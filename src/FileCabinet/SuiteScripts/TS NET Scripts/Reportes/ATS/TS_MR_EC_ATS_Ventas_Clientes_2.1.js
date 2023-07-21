/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
*/

define(['N/search', 'N/email', 'N/file', 'N/runtime', 'N/log', 'N/format', 'N/record', 'N/task'],
    (search, email, file, runtime, log, format, record, task) => {

        const MAX_PAGINATION_SIZE = 1000;
        var currentScript = runtime.getCurrentScript();

        const getInputData = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);

                let transactions = getATSVentasClientes(scriptParameters, environmentFeatures);

                return transactions;
            } catch (error) {
                log.error("error", error);
            }
        }

        const map = (context) => {
            try {
                let key = context.key;
                let result = JSON.parse(context.value);

                // 1. Código Venta
                let codigoCompra = result[0];

                // 2 Tipo de Identificacion del Cliente
                let tipoIdentificacionCliente = result[1].replace('- None -', '');

                // 3 No. de Identificación del Cliente
                let numeroIdentificacionCliente = result[2].replace('- None -', '');

                // 4 Es Parte Relacionada
                let esParteRelacionada = result[3];

                // 5 Tipo de Cliente
                let tipoCliente = result[4].replace('- None -', '');

                // 6 Razon Social de Cliente
                let razonSocialCliente = result[5].replace('- None -', '');

                // 7 Codigo Tipo de Comprobante
                let codigoTipoComprobante = result[6].replace('- None -', '');

                // 8 Tipo de Emision
                let tipoEmision = result[7].replace('- None -', '');

                // 9 No. de Comprobantes Emitidos
                let numeroComprobantesEmitidos = result[8].replace('- None -', '')

                // 10 Base Imponible No objeto de IVA
                let baseImponibleNoIva = roundTwoDecimals(result[9]);

                // 11 Base Imponible Tarifa 0% IVA
                let baseImponible0Iva = roundTwoDecimals(result[10]);

                // 12 Base Imponible tarifa IVA diferente de 0%
                let baseImponibleGravada = roundTwoDecimals(result[11]);

                // 13 Monto IVA
                let montoIva = roundTwoDecimals(result[12]);

                // 14 Monto ICE
                let montoIce = roundTwoDecimals(result[13]);

                // 15 Valor de IVA que le han Retenido
                let montoIvaRetenido = roundTwoDecimals(result[14]);

                // 16 Valor de Renta que le han Retenido
                let montoRentaRetenido = roundTwoDecimals(result[15]);

                let rowString = `${codigoCompra}|${tipoIdentificacionCliente}|${numeroIdentificacionCliente}|${esParteRelacionada}|${tipoCliente}|` +
                    `${razonSocialCliente}|${codigoTipoComprobante}|${tipoEmision}|${numeroComprobantesEmitidos}|${baseImponibleNoIva}|${baseImponible0Iva}|` +
                    `${baseImponibleGravada}|${montoIva}|${montoIce}|${montoIvaRetenido}|${montoRentaRetenido}\r\n`;

                context.write({
                    key: context.key,
                    value: {
                        rowString
                    }
                });
            } catch (error) {
                log.error("error", error);
            }
        }

        const summarize = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);

                let fileContent = "";
                let lineCount = 0;
                let fileCount = 0;

                context.output.iterator().each(function (key, value) {
                    let obj = JSON.parse(value);
                    fileContent += obj.rowString;
                    lineCount++;
                    if (lineCount % 10000 == 0) {
                        scriptParameters.atsFilesId += saveFile(fileContent, fileCount, scriptParameters) + '|';
                        fileContent = "";
                        lineCount = 0;
                        fileCount++;
                    }
                    return true;
                });

                if (lineCount != 0) {
                    scriptParameters.atsFilesId += saveFile(fileContent, fileCount, scriptParameters) + '|';
                }

                log.error("summarize", scriptParameters);
                executeMapReduce(scriptParameters, environmentFeatures);
            } catch (error) {
                log.error("error", error);
            }
        }

        const getATSVentasClientes = (scriptParameters, environmentFeatures) => {
            let atsVentasClientesSearch = search.load({
                id: "customsearch_ec_ats_ventas_clientes"
            });

            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.periodId
                });
                atsVentasClientesSearch.filters.push(periodFilter);
            }

            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.subsidiaryId
                });
                atsVentasClientesSearch.filters.push(subsidiaryFilter);
            }

            let pagedData = atsVentasClientesSearch.runPaged({ pageSize: MAX_PAGINATION_SIZE });

            let resultArray = [];
            for (let i = 0; i < pagedData.pageRanges.length; i++) {

                let page = pagedData.fetch({
                    index: pagedData.pageRanges[i].index
                });

                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;

                    let rowArray = [];
                    for (let k = 0; k < columns.length; k++) {
                        rowArray.push(result.getValue(columns[k]));
                    }
                    resultArray.push(rowArray);
                }
            }
            return resultArray;
        }

        const getEnviromentFeatures = () => {
            let features = {};
            features.hasSubsidiaries = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            return features;
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};

            if (environmentFeatures.hasSubsidiaries)
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_mr_ec_ats_ven_cli_subsidia');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_mr_ec_ats_ven_cli_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_mr_ec_ats_ven_cli_folder');
            scriptParameters.atsFilesId = currentScript.getParameter('custscript_ts_mr_ec_ats_ven_cli_atsfiles');
            scriptParameters.logId = currentScript.getParameter('custscript_ts_mr_ec_ats_ven_cli_logid');

            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const roundTwoDecimals = (number) => {
            return Math.round(Number(number) * 100) / 100;
        }

        const saveFile = (contents, fileCount, scriptParameters) => {
            let name = getFileName(scriptParameters, fileCount);

            let plainTextFile = file.create({
                name,
                fileType: file.Type.PLAINTEXT,
                contents,
                encoding: file.Encoding.UTF8,
                folder: scriptParameters.folderId
            });
            return plainTextFile.save();
        }

        const getFileName = (scriptParameters, fileCount) => {
            return `VENTAS DE CLIENTES(${scriptParameters.subsidiaryId}, ${scriptParameters.periodId}, ${fileCount}).txt`;
        }

        const executeMapReduce = (scriptParameters, environmentFeatures) => {
            let params = {};

            if (environmentFeatures.hasSubsidiaries) {
                params['custscript_ts_mr_ec_ats_ven_est_subsidia'] = scriptParameters.subsidiaryId;
            }

            params['custscript_ts_mr_ec_ats_ven_est_period'] = scriptParameters.periodId;

            params['custscript_ts_mr_ec_ats_ven_est_folder'] = scriptParameters.folderId;

            params['custscript_ts_mr_ec_ats_ven_est_atsfiles'] = scriptParameters.atsFilesId;

            params['custscript_ts_mr_ec_ats_ven_est_logid'] = scriptParameters.logId;
            log.error("executeMapReduce", params);
            let scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ts_mr_ec_ats_ventas_estable',
                deploymentId: 'customdeploy_ts_mr_ec_ats_ventas_estable',
                params
            });
            let scriptTaskId = scriptTask.submit();
        }

        return {
            getInputData,
            map,
            summarize
        }

    }
)