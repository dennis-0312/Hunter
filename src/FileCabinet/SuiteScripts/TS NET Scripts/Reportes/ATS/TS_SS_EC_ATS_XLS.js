/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/log', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/search', 'N/record', 'N/render', 'N/encode'],
    (log, runtime, task, format, file, search, record, render, encode) => {

        const FTL_TEMPLATE_EXCEL = "./TS_FTL_EC_ATS_XLS_2.ftl"
        const MAX_PAGINATION_SIZE = 1000;
        const FOLDER_ID = "506";;

        let currentScript = runtime.getCurrentScript();

        const execute = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);
                let auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);

                let atsArray = getATSXLSCompras(scriptParameters, environmentFeatures);
                let newATSarray = getATSXLSComprasIG(scriptParameters, environmentFeatures, atsArray);

                let json = buildJsonForExcel(newATSarray)

                generateXls(json, scriptParameters, auxiliaryRecords)
            } catch (error) {
                log.error("error execute", error)
            }
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};

            if (environmentFeatures.hasSubsidiaries)
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_subsidiary');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_folder');
            scriptParameters.reportId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_report');
            scriptParameters.format = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_formato');
            scriptParameters.logId = createLogRecord(scriptParameters, environmentFeatures.hasSubsidiaries);

            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const getEnviromentFeatures = () => {
            let features = {};
            features.hasSubsidiaries = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            return features;
        }

        const getATSXLSCompras = (scriptParameters, environmentFeatures) => {

            log.error('getATSXLSCompras', 'getATSXLSCompras')
            let atsXLSCompra = search.load({
                id: 'customsearch_ec_reporte_ats_compras'
            });

            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.periodId
                });
                atsXLSCompra.filters.push(periodFilter);
            }

            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.subsidiaryId
                });
                atsXLSCompra.filters.push(subsidiaryFilter);
            }

            let pagedData = atsXLSCompra.runPaged({ pageSize: MAX_PAGINATION_SIZE });
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
                    log.error('rowArray', rowArray)
                    resultArray.push(rowArray);
                }
            }

            //Validacion para desde Abril 2024
            let periodoInicioActual = getRecordPeriod(scriptParameters.periodId); // [inicio,final]
            log.error('periodoInicioActual', periodoInicioActual.startdate);
            let fechaActual = periodoInicioActual.startdate.split('/');
            var f1 = new Date(2024, 3, 1); //Abril 2024
            var f2 = new Date(fechaActual[2], fechaActual[1] - 1, fechaActual[0]);

            log.error('f1', f1);
            log.error('f2', f2);
            let transacReten = [];
            if (f2 >= f1) {
                transacReten = getATSComprasDetalladasReten(scriptParameters, environmentFeatures)
                log.error('transacReten', transacReten);
                resultArray = juntarReten(resultArray, transacReten)
            }

            log.error('resultArray', resultArray);
            return resultArray;

        }

        const getATSXLSComprasIG = (scriptParameters, environmentFeatures, resultArray) => {

            log.error('getATSXLSComprasIG', 'getATSXLSComprasIG')
            let atsXLSCompra = search.load({id: 'customsearch_ec_reporte_ats_compras_2'});
            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.periodId });
                atsXLSCompra.filters.push(periodFilter);
            }
            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({ name: 'subsidiary',operator: search.Operator.ANYOF, values: scriptParameters.subsidiaryId });
                atsXLSCompra.filters.push(subsidiaryFilter);
            }

            let pagedData = atsXLSCompra.runPaged({ pageSize: MAX_PAGINATION_SIZE });
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
                    log.error('rowArray', rowArray)
                    resultArray.push(rowArray);
                }
            }
            return resultArray;

        }

        const getFileName = (auxiliaryRecords, format) => {
            if (format === 'XLSX') {
                return `AT${auxiliaryRecords.period.month}${auxiliaryRecords.period.year}.xls`;
            }
        }

        const createLogRecord = (scriptParameters, hasSubsidiariesFeature) => {
            let logRecord = record.create({
                type: "customrecord_ts_ec_rpt_generator_log"
            });

            if (hasSubsidiariesFeature) {
                logRecord.setValue("custrecord_ts_ec_log_rpt_gen_subsidiaria", scriptParameters.subsidiaryId);
            }

            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_periodo", scriptParameters.periodId);
            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_estado", "Procesando...");
            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_libro_legal", "Procesando...");
            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_report", "Reporte ATS");

            return logRecord.save();
        }

        const generateXls = (txtDataJson, scriptParameters, auxiliaryRecords) => {
            let templateFile = file.load({ id: FTL_TEMPLATE_EXCEL });

            let data = { text: JSON.stringify(txtDataJson) };
            log.error('data', data)
            let renderer = render.create();
            renderer.templateContent = templateFile.getContents();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'jsonString',
                data
            });
            let contents = renderer.renderAsString();
            let base64 = encode.convert({
                string: contents,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });

            let name = getFileName(auxiliaryRecords, 'XLSX');
            let fileId = file.create({
                name,
                fileType: file.Type.EXCEL,
                contents: base64,
                folder: FOLDER_ID
            }).save();
            let xlsFile = file.load({ id: fileId });
            log.debug('DETALLE DEL ARCHIVO', { name: xlsFile.name, ulr: xlsFile.url });
            updateRecordLog(scriptParameters, xlsFile.url, xlsFile.name);
        }

        const updateRecordLog = (scriptParameters, url, name) => {
            record.submitFields({
                type: "customrecord_ts_ec_rpt_generator_log",
                id: scriptParameters.logId,
                values: {
                    "custrecord_ts_ec_log_rpt_gen_estado": "Generado",
                    "custrecord_ts_ec_log_rpt_gen_libro_legal": name,
                    "custrecord_ts_ec_log_rpt_gen_url": url
                }
            });
        };

        const getAuxiliaryRecords = (environmentFeatures, scriptParameters) => {
            let auxiliaryFields = {};

            auxiliaryFields.subsidiary = getSubsidiaryRecord(environmentFeatures.hasSubsidiaries, scriptParameters.subsidiaryId);

            auxiliaryFields.period = getPeriodRecord(scriptParameters.periodId);

            return auxiliaryFields;
        }

        const getSubsidiaryRecord = (hasSubsidiariesFeature, subsidiaryId) => {
            let subsidiaryRecord = {
                taxidnum: "",
                name: "",
                legalname: ""
            };
            try {
                if (hasSubsidiariesFeature) {
                    if (!subsidiaryId) return subsidiaryRecord;
                    let subsidiarySearch = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiaryId,
                        columns: ["taxidnum", "name", "legalname"]
                    });
                    subsidiaryRecord.taxidnum = subsidiarySearch.taxidnum;
                    subsidiaryRecord.name = subsidiarySearch.name;
                    subsidiaryRecord.legalname = subsidiarySearch.legalname;
                } else {
                    let company = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    subsidiaryRecord.taxidnum = company.getValue("employerid");
                    subsidiaryRecord.name = "";
                    subsidiaryRecord.legalname = "";
                }
            } catch (error) {
                log.error("An error was found in [getSubsidiaryRecord]", error);
            }
            return subsidiaryRecord;
        }

        const getPeriodRecord = (periodId) => {
            let periodRecord = {
                endDate: "",
                startDate: "",
                year: "",
                month: ""
            };
            try {
                var periodSearch = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: periodId,
                    columns: ['startdate', 'enddate']
                });
                periodRecord.startDate = periodSearch.startdate;
                periodRecord.endDate = periodSearch.enddate;
                let startDate = format.parse({
                    value: periodSearch.startdate,
                    type: format.Type.DATE
                });
                periodRecord.day = startDate.getDate();
                periodRecord.year = startDate.getFullYear();
                periodRecord.month = ('0' + (startDate.getMonth() + 1)).slice(-2);
            } catch (error) {
                log.error("An error was found in [getPeriodRecord]", error);
            }
            return periodRecord;
        }

        const buildJsonForExcel = (ArrayXLS) => {
            let contenidoJSON = [];

            for (let i = 0; i < ArrayXLS.length; i++) {
                let detalle = {};
                let data = ArrayXLS[i];
                let idInterno = data[0]; //* 0 ID interno
                detalle.periodo = data[1] || ""; //* 1 Período contable : Nombre
                detalle.rucEmpresa = data[2] || ""; //* 2 RUC Empresa
                detalle.mes = data[3] || ""; //* 3 Periodo: Mes
                detalle.anio = data[4] || ""; //* 4 Periodo: Año
                detalle.fechaEmiCompro = data[5] || ""; //* 5 Fe.Emision Comprobante
                detalle.fechaRegisConta = data[6] || ""; //* 6 Fe.Registro Contable
                detalle.tipoIdent = data[7] || ""; //* 7 Tipo Identificacion
                detalle.rucCedPasa = data[8] || ""; //* 8 RUC / Cédula / Pasaporte
                detalle.nombreProvee = data[9] || ""; //* 9 Nombre Proveedor (Opcional)
                detalle.concepto = data[10] || ""; //* 10 Concepto
                detalle.coSustTribu = data[11] || ""; //* 11 Co. Sust Tributario
                detalle.codTipoConpro = data[12] || ""; //* 12 Cod de Tipo Comprobante
                detalle.numSerieCompro = data[13] || ""; //* 13 No. Serie de Comprobante
                detalle.numSecuenCompro = data[14] || ""; //* 14 No.Secuencia Comprobante
                detalle.numAutorizaCompro = data[15] || ""; //* 15 No.Autorizacion Comprobante
                detalle.baseNoAplicaIva = Number(data[16]) || 0; //* 16 Base No aplica IVA
                detalle.baseTarifaCero = Number(data[17]) || 0; //* 17 Base tarifa 0%
                detalle.baseTarifaDifCero = Number(data[18]) || 0; //* 18 Base tarifa <> 0%
                detalle.baseImpExe = Number(data[19]) || 0; //* 19 baseImpExe
                detalle.montoIVA = Number(data[20]) || 0; //* 20 Monto IVA
                detalle.descripcion = data[21] || ""; //* 21 Descripción
                detalle.montoICE = Number(data[22]) || 0; //* 22 Monto ICE
                detalle.montoeRetIVA30 = Number(data[23]) || 0; //* 23 Monto Ret. IVA Bienes 30%
                detalle.montoeRetIVA70 = Number(data[24]) || 0; //* 24 Ret. IVA Servicios 70%
                detalle.montoeRetIVA100 = Number(data[25]) || 0; //* 25 Ret. IVA  100%
                detalle.montoeRetIVA10 = Number(data[26]) || 0; //* 26 Ret. IVA  10%
                detalle.montoeRetIVA20 = Number(data[27]) || 0; //* 27 Ret. IVA  20%
                detalle.pagoLocal = data[28] || ""; //* 28 Pago: Local
                detalle.pagoExteriorPais = data[29] || ""; //* 29 Pago Exterior: Pais
                detalle.pagoExteriorDoble = data[30] || ""; //* 30 Pago Exterior:  Doble tributacion
                detalle.pagoExteriorReten = data[31] || ""; //* 31 Pago Exterior: Sujeto a Retencion
                detalle.comprobanteModific = data[32] || ""; //* 32 Comprobante Modificado
                detalle.fechaEmiModific = data[33] || ""; //* 33 Fe. Emisión Modificado
                detalle.numSerieModific = data[34] || ""; //* 34 No. Serie de Modificado
                detalle.numSoecuenciaModific = data[35] || ""; //* 35 No.Secuencia Modificado
                detalle.numAutorizaModific = data[36] || ""; //* 36 No.Autorizacion Modificado
                detalle.pagoRegFis = data[37] || ""; //* 37 pagoRegFis
                detalle.formaDePago = data[38] || ""; //* 38 Forma de Pago
                detalle.codIr1 = data[39] || ""; //* 39 Co. IR(1)
                detalle.baseImpIR1 = Number(data[40]) || 0; //* 40 Base Impon. IR
                detalle.porcentRetIR1 = data[41] || 0; //* 41 % Ret. IR
                detalle.montoRetIR1 = Number(data[42]) || 0; //* 42 Monto Ret. IR
                detalle.codIr2 = data[43] || ""; //* 43 Co. IR(2)
                detalle.baseImpIR2 = Number(data[44]) || 0; //* 44 Base Impon. IR
                detalle.porcentRetIR2 = data[45] || 0; //* 45 % Ret. IR
                detalle.montoRetIR2 = Number(data[46]) || 0; //* 46 Monto Ret. IR
                detalle.codIr3 = data[47] || ""; //* 47 Co. IR(3)
                detalle.baseImpIR3 = Number(data[48]) || 0; //* 48 Base Impon. IR
                detalle.porcentRetIR3 = data[49] || 0; //* 49 % Ret. IR
                detalle.montoRetIR3 = Number(data[50]) || 0; //* 50 Monto Ret. IR
                detalle.diviFechaPago = data[51] || ""; //* 51 Dividendo: Fecha Pago
                detalle.diviIrPago = Number(data[52]) || 0; //* 52 Dividendo: IR pagado x empresa
                detalle.diviAnoUtili = data[53] || ""; //* 53 Dividendo: Año Utilid. del Divid.
                detalle.numSerieCR1 = data[54] || ""; //* 54 No. Serie CR-1
                detalle.numSecuenciaCR1 = data[55] || ""; //* 55 No. Secuencia CR-1
                detalle.numAutorizaCR1 = data[56] || ""; //* 56 No. Autoriza CR-1
                detalle.fechaEmiCR1 = data[57] || ""; //* 57 Fe. Emision CR-1
                detalle.numDocumento = data[58] || ""; //* 58 Número documento
                detalle.porcentIVA = data[59] || 0; //* 59 Porcentaje IVA
                detalle.valorCompSoli = Number(data[60]) || 0; //* 60 Valor Comp. Solidaria
                detalle.fechaAutorizaDocum = data[61] || ""; //* 61 Fecha Autorización documento
                detalle.oficinaCabecera = data[62] || ""; //* 62 Cabecera
                detalle.ecReportType = data[63] || ""; //* 63 ecReportType

                contenidoJSON.push(detalle);

            }
            log.error('contenidoJSON', contenidoJSON)
            log.error('contenidoJSON.length', contenidoJSON.length)

            return contenidoJSON;
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

        const juntarReten = (resultArray, transacReten) => {
            var newArray = [];

            for (let j = 0; j < resultArray.length; j++) {
                let idTransaccion = resultArray[j][0];
                for (let i = 0; i < transacReten.length; i++) {
                    let idTransacc = transacReten[i][0];
                    if (idTransaccion == idTransacc) {
                        if (resultArray[j][39] == '') {
                            resultArray[j][39] = transacReten[i][1];
                            resultArray[j][40] = transacReten[i][2];
                        } else if (resultArray[j][43] == '') {
                            resultArray[j][43] = transacReten[i][1];
                            resultArray[j][44] = transacReten[i][2];
                        } else if (resultArray[j][47] == '') {
                            resultArray[j][47] = transacReten[i][1];
                            resultArray[j][48] = transacReten[i][2];
                        }
                    }
                }
            }

            return resultArray;
        }

        return {
            execute
        }
    }
)