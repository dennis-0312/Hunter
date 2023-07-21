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

                let transactions = getATSComprasRetenciones(scriptParameters, environmentFeatures);

                return transactions;
            } catch (error) {
                log.error("error", error);
            }
        }

        const map = (context) => {
            try {
                let key = context.key;
                let result = JSON.parse(context.value);

                // 1 Código de Compra
                let codigoCompra = result[0];

                // 2 Concepto de Retención en la fuente de Impuesto a la Renta
                let conceptoRetencionIR = result[1].replace('- None -', '');

                // 3 Base Imponible Renta
                let baseImponibleRenta = roundTwoDecimals(result[2]);

                // 4 Porcentaje de Retención en la fuente de Impuesto a la Renta
                let porcentajeRetencionIR = result[3];

                // 5 Monto de retención de Renta
                let montoRetencionRenta = roundTwoDecimals(result[4]);

                // 6 Fecha de Pago del Dividendo
                let fechaPagoDividendo = result[5].replace('- None -', '');

                // 7 Impuesto a la Renta Pagado por la Sociedad Correspondiente al Dividendo
                let impuestoRentaPagado = roundTwoDecimals(result[6]);

                // 8 Año en que se generaron las utilidades atribuibles al dividendo
                let anioUtilidades = result[7].replace('- None -', '');

                // 9 Cantidad de cajas estándar de banano
                let numeroCajasEstandar = result[8].replace('- None -', '');

                // 10 Precio de la caja de banano
                let precioCaja = result[9].replace('- None -', '');

                let rowString = `${codigoCompra}|${conceptoRetencionIR}${baseImponibleRenta}|${porcentajeRetencionIR}|${montoRetencionRenta}|` +
                    `${fechaPagoDividendo}|${impuestoRentaPagado}|${anioUtilidades}|${numeroCajasEstandar}|${precioCaja}\r\n`;

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

        const getATSComprasRetenciones = (scriptParameters, environmentFeatures) => {
            let atsComprasRetencionesSearch = search.load({
                id: "customsearch_ts_ec_ats_compras_retencion"
            });

            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.periodId
                });
                atsComprasRetencionesSearch.filters.push(periodFilter);
            }

            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.subsidiaryId
                });
                atsComprasRetencionesSearch.filters.push(subsidiaryFilter);
            }

            let pagedData = atsComprasRetencionesSearch.runPaged({ pageSize: MAX_PAGINATION_SIZE });

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
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ret_subsia');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ret_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ret_folder');
            scriptParameters.atsFilesId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ret_atsfiles');
            scriptParameters.logId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ret_logid');
            
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
            return `COMPRAS RETENCIONES(${scriptParameters.subsidiaryId}, ${scriptParameters.periodId}, ${fileCount}).txt`;
        }

        const executeMapReduce = (scriptParameters, environmentFeatures) => {
            let params = {};

            if (environmentFeatures.hasSubsidiaries) {
                params['custscript_ts_mr_ec_ats_formpag_subsidi'] = scriptParameters.subsidiaryId;
            }
            
            params['custscript_ts_mr_ec_ats_formpag_period'] = scriptParameters.periodId;

            params['custscript_ts_mr_ec_ats_formpag_folder'] = scriptParameters.folderId;

            params['custscript_ts_mr_ec_ats_formpag_atsfiles'] = scriptParameters.atsFilesId;

            params['custscript_ts_mr_ec_ats_formpag_logid'] = scriptParameters.logId;

            log.error("executeMapReduce", params);
            let scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ts_mr_ec_ats_forma_pago',
                deploymentId: 'customdeploy_ts_mr_ec_ats_forma_pago',
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