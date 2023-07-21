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

                let transactions = getATSFormaPagoVentas(scriptParameters, environmentFeatures);

                return transactions;
            } catch (error) {
                log.error("error", error);
            }
        }

        const map = (context) => {
            try {
                let key = context.key;
                let result = JSON.parse(context.value);

                // 1 Codigo de Venta
                let codigoVenta = result[0];

                // 2 ID Cliente
                let idCliente = result[1].replace('- None -', '');

                // 3 Metodo de Pago
                let metodoPago = result[2].replace('- None -', '');

                // 4 ID Tipo de Documento
                let idTipoDocumento = result[3].replace('- None -', '');

                // 5 Tipo de Emision
                let tipoEmision = result[4].replace('- None -', '');

                let rowString = `${codigoVenta}|${idCliente}|${metodoPago}|${idTipoDocumento}|${tipoEmision}\r\n`;

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

        const getATSFormaPagoVentas = (scriptParameters, environmentFeatures) => {
            let atsFormaPagoSearch = search.load({
                id: "customsearch_ec_ats_forma_pago_ventas"
            });

            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.periodId
                });
                atsFormaPagoSearch.filters.push(periodFilter);
            }

            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.subsidiaryId
                });
                atsFormaPagoSearch.filters.push(subsidiaryFilter);
            }

            let pagedData = atsFormaPagoSearch.runPaged({ pageSize: MAX_PAGINATION_SIZE });

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
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_mr_ec_ats_form_pv_subsidia');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_mr_ec_ats_form_pv_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_mr_ec_ats_form_pv_folder');
            scriptParameters.atsFilesId = currentScript.getParameter('custscript_ts_mr_ec_ats_form_pv_atsfiles');
            scriptParameters.logId = currentScript.getParameter('custscript_ts_mr_ec_ats_form_pv_logid');

            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
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
            return `FORMA DE PAGO VENTAS(${scriptParameters.subsidiaryId}, ${scriptParameters.periodId}, ${fileCount}).txt`;
        }

        const executeMapReduce = (scriptParameters, environmentFeatures) => {
            let params = {};

            if (environmentFeatures.hasSubsidiaries) {
                params['custscript_ts_mr_ec_ats_anulado_subsidia'] = scriptParameters.subsidiaryId;
            }

            params['custscript_ts_mr_ec_ats_anulado_period'] = scriptParameters.periodId;

            params['custscript_ts_mr_ec_ats_anulado_folder'] = scriptParameters.folderId;

            params['custscript_ts_mr_ec_ats_anulado_atsfiles'] = scriptParameters.atsFilesId;
            params['custscript_ts_mr_ec_ats_anulado_logid'] = scriptParameters.logId;
            log.error("executeMapReduce", params);
            let scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ts_mr_ec_ats_anulados',
                deploymentId: 'customdeploy_ts_mr_ec_ats_anulados',
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