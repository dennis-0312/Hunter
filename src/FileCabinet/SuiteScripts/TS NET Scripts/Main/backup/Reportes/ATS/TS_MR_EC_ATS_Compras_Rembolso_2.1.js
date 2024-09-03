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

                let transactions = getATSComprasReembolso(scriptParameters, environmentFeatures);
                log.error("transactions", transactions.length);
                return transactions;
            } catch (error) {
                log.error("error", error);
            }
        }

        const map = (context) => {
            try {
                let key = context.key;
                let result = JSON.parse(context.value);

                // 0 ID
                let IDTras = result[0];

                // 1 Codigo de compra
                let codigoCompra = result[1];

                // 2 Código Tipo de comprobante reembolso
                let codigoTipoComprobante = result[2].replace('- None -', '');

                // 3 No. de Identificación del Proveedor Reembolso
                let tipoIdentificacionProveedor = result[3].replace('- None -', '');

                // 4 Numero de Identificación del Proveedor
                let numeroIdentificacionProveedor = result[4].replace('- None -', '');

                // 5 No. de serie del comprobante de venta Reembolso - establecimiento
                let establecimientoCVR = result[5].replace('- None -', '');

                // 6 No. de serie del comprobante de venta Reembolso - punto de emisión
                let puntoEmisionCVR = result[6].replace('- None -', '');

                // 7 No. secuencial del comprobante de venta Reembolso
                let numeroSencuencialCVR = result[7].replace('- None -', '')

                // 8 Fecha de emisión del comprobante de venta Reembolso
                let fechaEmisionCVR = result[8].replace('- None -', '');

                // 9 No. de autorización del comprobante de venta Reembolso
                let autorizacionCVR = result[9].replace('- None -', '');

                // 10 Base Imponible tarifa 0% IVA Reembolso
                let baseImponible0Iva = roundTwoDecimals(result[10]);

                // 11 Base Imponible tarifa IVA diferente de 0% Reembolso
                let baseImponibleGravada = roundTwoDecimals(result[11]);

                // 12 Base Imponible no objeto de IVA - REEMBOLSO
                let baseImponibleNoIva = roundTwoDecimals(result[12]);

                // 13 Base imponible exenta de IVA Reembolso
                let baseImponibleExenta = roundTwoDecimals(result[13]);

                // 14 Total Bases Imponibles Reembolso
                let totalBasesImponibles = roundTwoDecimals(result[14]);

                // 15 Monto ICE Reembolso
                let montoIce = roundTwoDecimals(result[15]);

                // 16 Monto IVA Reembolso
                let montoIva = roundTwoDecimals(result[16]);

                let rowString = `${IDTras}|${codigoCompra}|${codigoTipoComprobante}|${tipoIdentificacionProveedor}|${numeroIdentificacionProveedor}|${establecimientoCVR}|` +
                    `${puntoEmisionCVR}|${numeroSencuencialCVR}|${fechaEmisionCVR}|${autorizacionCVR}|${baseImponible0Iva}|${baseImponibleGravada}|${baseImponibleNoIva}|` +
                    `${baseImponibleExenta}|${totalBasesImponibles}|${montoIce}|${montoIva}\r\n`;

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

        const executeMapReduce = (scriptParameters, environmentFeatures) => {
            let params = {};

            if (environmentFeatures.hasSubsidiaries) {
                params['custscript_ts_mr_ec_ats_com_ret_subsia'] = scriptParameters.subsidiaryId;
            }

            params['custscript_ts_mr_ec_ats_com_ret_period'] = scriptParameters.periodId;

            params['custscript_ts_mr_ec_ats_com_ret_folder'] = scriptParameters.folderId;

            params['custscript_ts_mr_ec_ats_com_ret_atsfiles'] = scriptParameters.atsFilesId;

            params['custscript_ts_mr_ec_ats_com_ret_logid'] = scriptParameters.logId;
            //<I> rhuaccha: 2024-02-26
            params['custscript_ts_mr_ec_ats_com_ret_formato'] = scriptParameters.format;
            //<F> rhuaccha: 2024-02-26
            log.error("executeMapReduce", params);
            let scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ts_mr_ec_ats_compra_retenci',
                deploymentId: 'customdeploy_ts_mr_ec_ats_compra_retenci',
                params
            });
            let scriptTaskId = scriptTask.submit();
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
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ree_subsidia');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ree_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ree_folder');
            scriptParameters.atsFilesId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ree_atsfiles');
            scriptParameters.logId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ree_logid');
            //<I> rhuaccha: 2024-02-26
            scriptParameters.format = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ree_formato');
            //<F> rhuaccha: 2024-02-26

            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const getATSComprasReembolso = (scriptParameters, environmentFeatures) => {
            let atsComprasReembolsoSearch = search.load({
                id: "customsearch_ts_ec_compras_reembolso"
            });

            if (scriptParameters.periodId) {

                var periodSearch = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: scriptParameters.periodId,
                    columns: ['startdate', 'enddate']
                });
                let periodoInicio = periodSearch.startdate;
                let periodoFinal = periodSearch.enddate;

                let periodFilter = search.createFilter({
                    name: "custrecord_fecha",
                    operator: search.Operator.WITHIN,
                    values: [periodoInicio, periodoFinal],
                });
                atsComprasReembolsoSearch.filters.push(periodFilter);
            }

            let pagedData = atsComprasReembolsoSearch.runPaged({ pageSize: MAX_PAGINATION_SIZE });

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
            log.error("resultArray", resultArray);
            return resultArray;

        }

        const getFileName = (scriptParameters, fileCount) => {
            return `COMPRAS REMBOLSO(${scriptParameters.subsidiaryId}, ${scriptParameters.periodId}, ${fileCount}).txt`;
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

        const roundTwoDecimals = (number) => {
            return Math.round(Number(number) * 100) / 100;
        }

        return {
            getInputData,
            map,
            summarize
        }
    }
)