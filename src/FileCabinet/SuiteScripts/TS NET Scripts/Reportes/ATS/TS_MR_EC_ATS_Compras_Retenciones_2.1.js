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
                log.error('transactions', transactions);
                //Validacion para desde Abril 2024
                let periodoInicioActual = getRecordPeriod(scriptParameters.periodId); // [inicio,final]
                log.error('periodoInicioActual', periodoInicioActual.startdate);
                let fechaActual = periodoInicioActual.startdate.split('/');
                var f1 = new Date(2024, 3, 1); //Abril 2024
                var f2 = new Date(fechaActual[2], fechaActual[1] - 1, fechaActual[0]);

                let transacReten = [];
                if (f2 >= f1) {
                    log.error('entro', 'entro');
                    transacReten = getATSComprasDetalladasReten(scriptParameters, environmentFeatures)
                    log.error('transacReten', transacReten);

                    transactions = juntarReten(transactions, transacReten)
                    log.error('transactions', transactions);
                }


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

        const getRecordPeriod = (periodId) => {
            let periodRecord = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: periodId,
                columns: ['startdate', 'enddate']
            });

            return periodRecord;
        }

        const getATSComprasDetalladasReten = (scriptParameters, environmentFeatures) => {
            let aTSComprasDetalladasReten = '';
            if (environmentFeatures.hasSubsidiaries) {
                aTSComprasDetalladasReten = search.create({
                    type: "vendorbill",
                    filters:
                        [
                            ["type", "anyof", "VendBill"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["taxitem", "noneof", "5"],
                            "AND",
                            ["voided", "is", "F"],
                            "AND",
                            ["formulatext: SUBSTR({custcol_ts_ec_col_ec_concepto_retenci},1,3)", "is", "332"],
                            "AND",
                            ["subsidiary", "anyof", scriptParameters.subsidiaryId],
                            "AND",
                            ["postingperiod", "abs", scriptParameters.periodId],
                            "AND",
                            ["formulatext: CASE WHEN {custcol_4601_witaxapplies} = 'T' THEN 0 ELSE 1 END", "is", "1"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "ID interno"
                            }),
                            search.createColumn({
                                name: "custrecord_ts_ec_codigo_anexo",
                                join: "CUSTCOL_TS_EC_COL_EC_CONCEPTO_RETENCI",
                                summary: "GROUP",
                                label: "EC - Codigo de Anexo"
                            }),
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Monto"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "'0%'",
                                label: "TIPO DE RETENCIÓN DE IMPUESTOS"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "'0'",
                                label: "IMPORTE DE RETENCIÓN DE IMPUESTOS"
                            })
                        ]
                });
            } else {
                aTSComprasDetalladasReten = search.create({
                    type: "vendorbill",
                    filters:
                        [
                            ["type", "anyof", "VendBill"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["taxitem", "noneof", "5"],
                            "AND",
                            ["voided", "is", "F"],
                            "AND",
                            ["formulatext: SUBSTR({custcol_ts_ec_col_ec_concepto_retenci},1,3)", "is", "332"],
                            "AND",
                            ["postingperiod", "abs", scriptParameters.periodId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "ID interno"
                            }),
                            search.createColumn({
                                name: "custrecord_ts_ec_codigo_anexo",
                                join: "CUSTCOL_TS_EC_COL_EC_CONCEPTO_RETENCI",
                                summary: "GROUP",
                                label: "EC - Codigo de Anexo"
                            }),
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Monto"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "'0%'",
                                label: "TIPO DE RETENCIÓN DE IMPUESTOS"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "'0'",
                                label: "IMPORTE DE RETENCIÓN DE IMPUESTOS"
                            })
                        ]
                });
            }


            let pagedData = aTSComprasDetalladasReten.runPaged({ pageSize: MAX_PAGINATION_SIZE });
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

        const juntarReten = (transactions, transacReten) => {
            var newArray = [];

            for (let j = 0; j < transacReten.length; j++) {
                let idTransaccRetencion = transacReten[j][0];
                let existe = false;
                for (let i = 0; i < transactions.length; i++) {
                    let idTransacc = transactions[i][0];
                    if (idTransacc == idTransaccRetencion) {
                        if (transactions[i][2] == '- None -') {
                            transactions[i][2] = transacReten[j][1];
                            transactions[i][5] = transacReten[j][2];
                        } else if (transactions[i][3] == '- None -') {
                            transactions[i][3] = transacReten[j][1];
                            transactions[i][6] = transacReten[j][2];
                        }
                        existe = true;
                    }
                }

                if (existe == false) {
                    var arrNoexiste = [idTransaccRetencion, transacReten[j][1], "- None -", "- None -", transacReten[j][2], ".00", ".00", "0", "0", "0", ".00", ".00", ".00", "- None -", "", "- None -", "- None -", "- None -"]
                    let existe2 = false
                    for (let x = 0; x < newArray.length; x++) {
                        if (idTransaccRetencion == newArray[x][0]) {
                            if (newArray[x][2] == '- None -') {
                                newArray[x][2] = transacReten[j][1];
                                newArray[x][5] = transacReten[j][2];
                            } else if (newArray[x][3] == '- None -') {
                                newArray[x][3] = transacReten[j][1];
                                newArray[x][6] = transacReten[j][2];
                            }
                        }
                    }
                    if (existe2 == false) {
                        newArray.push(arrNoexiste);
                    }
                }
            }

            for (let x = 0; x < newArray.length; x++) {
                transactions.push(newArray[x]);
            }

            return transactions;
        }

        return {
            getInputData,
            map,
            summarize
        }
    }
)