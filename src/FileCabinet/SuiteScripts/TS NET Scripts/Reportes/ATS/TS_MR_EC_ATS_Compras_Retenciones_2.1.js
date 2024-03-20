/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
*/

define(['N/search', 'N/email', 'N/file', 'N/runtime', 'N/log', 'N/format', 'N/record', 'N/task'],
    (search, email, file, runtime, log, format, record, task) => {

        const MAX_PAGINATION_SIZE = 1000;
        const SEARCH_EC_ATS_COMPRAS_RETENCIONES = 'customsearch_ts_ec_ats_compras_retencion' //EC - ATS Compras Retenciones
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

        /*const map = (context) => {
            try {
                let key = context.key;
                let result = JSON.parse(context.value);
                let codigoCompra = result[0];//* 1 Código de Compra
                let conceptoRetencionIR = result[1].replace('- None -', '');//* 2 Concepto de Retención en la fuente de Impuesto a la Renta
                let baseImponibleRenta = roundTwoDecimals(result[2]);//* 3 Base Imponible Renta
                let porcentajeRetencionIR = result[3];//* 4 Porcentaje de Retención en la fuente de Impuesto a la Renta
                let montoRetencionRenta = roundTwoDecimals(result[4]);//* 5 Monto de retención de Renta
                let fechaPagoDividendo = result[5].replace('- None -', '');//* 6 Fecha de Pago del Dividendo
                let impuestoRentaPagado = roundTwoDecimals(result[6]);//* 7 Impuesto a la Renta Pagado por la Sociedad Correspondiente al Dividendo
                let anioUtilidades = result[7].replace('- None -', '');//* 8 Año en que se generaron las utilidades atribuibles al dividendo
                let numeroCajasEstandar = result[8].replace('- None -', '');//* 9 Cantidad de cajas estándar de banano
                let precioCaja = result[9].replace('- None -', '');//* 10 Precio de la caja de banano

                let rowString = `${codigoCompra}|${conceptoRetencionIR}|${baseImponibleRenta}|${porcentajeRetencionIR}|${montoRetencionRenta}|` +
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
        }*/

        const map = (context) => {
            try {
                let key = context.key;
                let result = JSON.parse(context.value);
                let codigoCompra = result[0];//* 1 Código de Compra
                //<I> rhuaccha: 2024-02-22
                let ecRetIr1 = result[1].replace('- None -', '').trim();
                let ecRetIr2 = result[2].replace('- None -', '').trim();
                let ecRetIr3 = result[3].replace('- None -', '').trim();
                let ecImporteBaseIr1 = roundTwoDecimals(result[4].replace('- None -', ''));
                let ecImporteBaseIr2 = roundTwoDecimals(result[5].replace('- None -', ''));
                let ecImporteBaseIr3 = roundTwoDecimals(result[6].replace('- None -', ''));
                let ecPorcentajeRetIr1 = roundTwoDecimals(result[7].replace('- None -', ''));
                let ecPorcentajeRetIr2 = roundTwoDecimals(result[8].replace('- None -', ''));
                let ecPorcentajeRetIr3 = roundTwoDecimals(result[9].replace('- None -', ''));
                let ecMontoRetIr1 = roundTwoDecimals(result[10].replace('- None -', ''));
                let ecMontoRetIr2 = roundTwoDecimals(result[11].replace('- None -', ''));
                let ecMontoRetIr3 = roundTwoDecimals(result[12].replace('- None -', ''));
                let fechaPagoDividendo = result[13].replace('- None -', '');//* 6 Fecha de Pago del Dividendo
                let impuestoRentaPagado = roundTwoDecimals(result[14]);//* 7 Impuesto a la Renta Pagado por la Sociedad Correspondiente al Dividendo
                let anioUtilidades = result[15].replace('- None -', '');//* 8 Año en que se generaron las utilidades atribuibles al dividendo
                let numeroCajasEstandar = result[16].replace('- None -', '');//* 9 Cantidad de cajas estándar de banano
                let precioCaja = result[17].replace('- None -', '');//* 10 Precio de la caja de banano

                /*let conceptoRetencionIR = result[1].replace('- None -', '');//* 2 Concepto de Retención en la fuente de Impuesto a la Renta
                let baseImponibleRenta = roundTwoDecimals(result[2]);//* 3 Base Imponible Renta
                let porcentajeRetencionIR = result[3];//* 4 Porcentaje de Retención en la fuente de Impuesto a la Renta
                let montoRetencionRenta = roundTwoDecimals(result[4]);//* 5 Monto de retención de Renta
                let fechaPagoDividendo = result[5].replace('- None -', '');//* 6 Fecha de Pago del Dividendo
                let impuestoRentaPagado = roundTwoDecimals(result[6]);//* 7 Impuesto a la Renta Pagado por la Sociedad Correspondiente al Dividendo
                let anioUtilidades = result[7].replace('- None -', '');//* 8 Año en que se generaron las utilidades atribuibles al dividendo
                let numeroCajasEstandar = result[8].replace('- None -', '');//* 9 Cantidad de cajas estándar de banano
                let precioCaja = result[9].replace('- None -', '');// 10 Precio de la caja de banano

                let rowString = `${codigoCompra}|${conceptoRetencionIR}|${baseImponibleRenta}|${porcentajeRetencionIR}|${montoRetencionRenta}|` +
                    `${fechaPagoDividendo}|${impuestoRentaPagado}|${anioUtilidades}|${numeroCajasEstandar}|${precioCaja}\r\n`;*/

                let rowString = `${codigoCompra}|${ecRetIr1}|${ecImporteBaseIr1}|${ecPorcentajeRetIr1}|${ecMontoRetIr1}| ` +
                    `${ecRetIr2}|${ecImporteBaseIr2}|${ecPorcentajeRetIr2}|${ecMontoRetIr2}| ` +
                    `${ecRetIr3}|${ecImporteBaseIr3}|${ecPorcentajeRetIr3}|${ecMontoRetIr3}| ` +
                    `${fechaPagoDividendo}|${impuestoRentaPagado}|${anioUtilidades}|${numeroCajasEstandar}|${precioCaja}\r\n`;
                //<F> rhuaccha: 2024-02-22
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
            let atsComprasRetencionesSearch = search.load({ id: SEARCH_EC_ATS_COMPRAS_RETENCIONES });

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
            //<I> rhuaccha: 2024-02-26
            scriptParameters.format = currentScript.getParameter('custscript_ts_mr_ec_ats_com_ret_formato');
            //<F> rhuaccha: 2024-02-26

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
            if (environmentFeatures.hasSubsidiaries)
                params['custscript_ts_mr_ec_ats_formpag_subsidi'] = scriptParameters.subsidiaryId;
            params['custscript_ts_mr_ec_ats_formpag_period'] = scriptParameters.periodId;
            params['custscript_ts_mr_ec_ats_formpag_folder'] = scriptParameters.folderId;
            params['custscript_ts_mr_ec_ats_formpag_atsfiles'] = scriptParameters.atsFilesId;
            params['custscript_ts_mr_ec_ats_formpag_logid'] = scriptParameters.logId;
            //<I> rhuaccha: 2024-02-26
            params['custscript_ts_mr_ec_ats_formpag_formato'] = scriptParameters.format;
            //<F> rhuaccha: 2024-02-26
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