/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/log', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/search', 'N/record', 'N/render', 'N/encode'],
    (log, runtime, task, format, file, search, record, render, encode) => {

        const FTL_TEMPLATE_EXCEL = "./TS_FTL_EC_ATS_XLS_V.ftl"
        const MAX_PAGINATION_SIZE = 1000;
        const FOLDER_ID = "506";

        let currentScript = runtime.getCurrentScript();

        const execute = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);
                let auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);

                let atsArray = getATSXLSVentas(scriptParameters, environmentFeatures);
                let atsArrayRet = getATSXLSVentasRet(scriptParameters, environmentFeatures, atsArray);
                let atsArrayRetBanc = getATSXLSVentasRetBanc(scriptParameters, environmentFeatures, atsArrayRet);

                let json = buildJsonForExcel(atsArrayRetBanc)

                generateXls(json, scriptParameters, auxiliaryRecords)
            } catch (error) {
                log.error("error execute", error)
            }
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};
            if (environmentFeatures.hasSubsidiaries)
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_v_subsidiary');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_v_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_v_folder');
            scriptParameters.reportId = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_v_report');
            scriptParameters.format = currentScript.getParameter('custscript_ts_ss_ec_ats_xls_v_formato');
            scriptParameters.logId = createLogRecord(scriptParameters, environmentFeatures.hasSubsidiaries);
            return scriptParameters;
        }

        const getEnviromentFeatures = () => {
            let features = new Object();
            features.hasSubsidiaries = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            return features;
        }

        const getATSXLSVentas = (scriptParameters, environmentFeatures) => {
            let atsXLSCompra = search.load({ id: 'customsearch_ec_ats_ventas_mensual' });
            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.periodId });
                atsXLSCompra.filters.push(periodFilter);
            }
            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.subsidiaryId });
                atsXLSCompra.filters.push(subsidiaryFilter);
            }
            let pagedData = atsXLSCompra.runPaged({ pageSize: MAX_PAGINATION_SIZE });
            let resultArray = new Array();
            for (let i = 0; i < pagedData.pageRanges.length; i++) {
                let page = pagedData.fetch({ index: pagedData.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    let rowArray = new Array();
                    for (let k = 0; k < columns.length; k++) {
                        rowArray.push(result.getValue(columns[k]));
                    }
                    resultArray.push(rowArray);
                }
            }
            return resultArray;
        }

        const getATSXLSVentasRet = (scriptParameters, environmentFeatures, atsArrayVentas) => {
            //saveJson(atsArrayVentas, 'atsArray', 34500);
            log.error('getATSXLSVentasRet', 'getATSXLSVentasRet');
            let atsXLSRetenciones = search.load({ id: 'customsearch_ec_ats_retenciones_mensual' });
            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.periodId });
                atsXLSRetenciones.filters.push(periodFilter);
            }
            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.subsidiaryId });
                atsXLSRetenciones.filters.push(subsidiaryFilter);
            }
            let objResults = atsXLSRetenciones.run().getRange({ start: 0, end: 1000 });
            log.debug('pageData', objResults);
            let pagedDataRetenciones = atsXLSRetenciones.runPaged({ pageSize: MAX_PAGINATION_SIZE });
            let retencionesCount = 0;
            // Se crea un mapa para realizar la actualización de forma eficiente
            let retencionesMap = new Map();
            for (let i = 0; i < pagedDataRetenciones.pageRanges.length; i++) {
                let page = pagedDataRetenciones.fetch({ index: pagedDataRetenciones.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    // Extraer valor de la columna 4 de "retenciones mensual"
                    let retencionKey = String(result.getValue(columns[4]));
                    // Guardar los datos en el mapa para fácil acceso
                    retencionesMap.set(retencionKey, {
                        col5: result.getValue(columns[5]),
                        col6: result.getValue(columns[6]),
                        col7: result.getValue(columns[7]),
                        col8: result.getValue(columns[8]),
                        col9: result.getValue(columns[9]),
                        co20: result.getValue(columns[10]),
                        co21: result.getValue(columns[11]),
                        co22: result.getValue(columns[12]),
                        co23: result.getValue(columns[13]),
                        co24: result.getValue(columns[14]),
                        co25: result.getValue(columns[15]),
                        co26: result.getValue(columns[16]),
                        co27: result.getValue(columns[17]),
                        co28: result.getValue(columns[18]),
                    });
                    retencionesCount++;
                }
            }
            // Contar registros en atsArrayVentas
            let ventasCount = atsArrayVentas.length;
            log.debug('Conteo de registros', `Registros en búsqueda 1: ${ventasCount}`);
            log.debug('Conteo de registros', `Registros en búsqueda 2: ${retencionesCount}`);
            // Log para verificar los datos en el mapa
            log.debug('retencionesMap', JSON.stringify(retencionesMap))
            retencionesMap.forEach((value, key) => {
                log.debug('Datos en el mapa', `Key: ${key}, Value: ${JSON.stringify(value)}`);
            });
            // Ahora actualizamos atsArrayVentas con los datos del mapa
            let resultArray = atsArrayVentas.map((row, index) => {
                let ventasKey = String(row[13]);  // Convertir la clave a cadena
                let retencionData = retencionesMap.get(ventasKey);
                log.debug('Iteración del mapeo', `Índice: ${index}, ventasKey: ${ventasKey}, retencionData: ${JSON.stringify(retencionData)}`);
                if (retencionData) {
                    let updatedRow = [
                        ...row.slice(0, 19),  // Mantener las columnas antes del índice 19
                        retencionData.col5 !== undefined ? retencionData.col5 : row[19],  // Reemplazar columna 19
                        retencionData.col6 !== undefined ? retencionData.col6 : row[20],  // Reemplazar columna 20
                        retencionData.col7 !== undefined ? retencionData.col7 : row[21],  // Reemplazar columna 21
                        retencionData.col8 !== undefined ? retencionData.col8 : row[22],  // Reemplazar columna 22
                        retencionData.col9 !== undefined ? retencionData.col9 : row[23],  // Reemplazar columna 23
                        ...row.slice(24, 25),
                        retencionData.co20 !== undefined ? retencionData.co20 : row[25],  // Reemplazar columna 25
                        retencionData.co21 !== undefined ? retencionData.co21 : row[27],  // Reemplazar columna 27
                        retencionData.co22 !== undefined ? retencionData.co22 : row[30],  // Reemplazar columna 30
                        retencionData.co23 !== undefined ? retencionData.co23 : row[28],  // Reemplazar columna 28
                        retencionData.co24 !== undefined ? retencionData.co24 : row[29],  // Reemplazar columna 29
                        //...row.slice(31, 32),
                        retencionData.co25 !== undefined ? retencionData.co25 : row[31],
                        retencionData.co26 !== undefined ? retencionData.co26 : row[32],  // Reemplazar columna 32
                        retencionData.co27 !== undefined ? retencionData.co27 : row[33],  // Reemplazar columna 33
                        retencionData.co28 !== undefined ? retencionData.co28 : row[34],  // Reemplazar columna 34
                        ...row.slice(35),
                        // Mantener las columnas desde el índice 35 en adelante

                        // retencionData.co20 !== undefined ? retencionData.co20 : row[25],  // Reemplazar columna 25
                        // retencionData.co21 !== undefined ? retencionData.co21 : row[27],  // Reemplazar columna 27
                        // retencionData.co22 !== undefined ? retencionData.co22 : row[30],  // Reemplazar columna 30
                        // retencionData.co23 !== undefined ? retencionData.co23 : row[28],  // Reemplazar columna 28
                        // retencionData.co24 !== undefined ? retencionData.co24 : row[29],  // Reemplazar columna 29
                        // retencionData.co25 !== undefined ? retencionData.co25 : row[31],  // Reemplazar columna 29
                        // retencionData.co26 !== undefined ? retencionData.co26 : row[32],  // Reemplazar columna 32
                        // retencionData.co27 !== undefined ? retencionData.co27 : row[33],  // Reemplazar columna 33
                        // retencionData.co28 !== undefined ? retencionData.co28 : row[34],  // Reemplazar columna 34
                    ];
                    log.debug('Fila actualizada', `Índice: ${index}, Updated Row: ${JSON.stringify(updatedRow)}`);
                    return updatedRow;
                } else {
                    log.debug('Fila no actualizada', `Índice: ${index}, Row: ${JSON.stringify(row)}`);
                    return row;  // Mantener la fila original si no hay coincidencia
                }
            });
            // Devolver el array con las actualizaciones realizadas
            return resultArray;
        }

        const getATSXLSVentasRetBanc = (scriptParameters, environmentFeatures, atsArrayVentas) => {
            //saveJson(atsArrayVentas, 'pruebaXLSatsArrayVentas', 34500)
            log.error('getATSXLSVentasRet', 'getATSXLSVentasRetBanc');
            let atsXLSRetenciones = search.load({ id: 'customsearch_ec_ret_ban_men' });
            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.periodId });
                atsXLSRetenciones.filters.push(periodFilter);
            }
            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.subsidiaryId });
                atsXLSRetenciones.filters.push(subsidiaryFilter);
            }
            let pagedDataRetenciones = atsXLSRetenciones.runPaged({ pageSize: MAX_PAGINATION_SIZE });
            let ventasRetBanc = new Array();
            for (let i = 0; i < pagedDataRetenciones.pageRanges.length; i++) {
                let page = pagedDataRetenciones.fetch({ index: pagedDataRetenciones.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    ventasRetBanc = [
                        result.getValue(columns[0]),
                        result.getValue(columns[1]),
                        result.getValue(columns[2]),
                        result.getValue(columns[3]),
                        result.getValue(columns[4]),
                        result.getValue(columns[5]),
                        result.getValue(columns[6]),
                        result.getText(columns[7]),
                        result.getValue(columns[8]),
                        result.getValue(columns[9]),
                        result.getValue(columns[10]),
                        result.getValue(columns[11]),
                        result.getValue(columns[12]),
                        result.getValue(columns[13]),
                        result.getValue(columns[14]),
                        result.getValue(columns[15]),
                        result.getValue(columns[16]),
                        result.getValue(columns[17]),
                        result.getValue(columns[18]),
                        result.getValue(columns[19]),
                        result.getValue(columns[20]),
                        result.getValue(columns[21]),
                        result.getValue(columns[22]),
                        result.getValue(columns[23]),
                        result.getValue(columns[24]),
                        result.getValue(columns[25]),
                        result.getValue(columns[26]),
                        //result.getValue(columns[27]),
                        result.getValue(columns[28]),
                        result.getValue(columns[29]),
                        result.getValue(columns[30]),
                        result.getValue(columns[31]),
                        result.getValue(columns[32]),
                        result.getValue(columns[33]),
                        result.getValue(columns[34]),
                        result.getValue(columns[35]),
                        result.getValue(columns[36]),
                        result.getValue(columns[37]),
                        result.getValue(columns[38]),
                        result.getValue(columns[39]),
                        result.getValue(columns[40]),
                        result.getValue(columns[41]),
                        result.getValue(columns[42]),
                        result.getValue(columns[43]),
                        result.getValue(columns[44]),
                        result.getValue(columns[45]),
                        result.getValue(columns[46]),
                        result.getValue(columns[47]),
                        result.getValue(columns[48]),
                        result.getValue(columns[49]),
                        result.getValue(columns[50]),
                        result.getValue(columns[51])
                    ]
                    atsArrayVentas.push(ventasRetBanc)
                }
            }
            // let objResults = atsXLSRetenciones.run().getRange({ start: 0, end: 1000 });
            // log.debug('objResults', objResults);
            saveJson(atsArrayVentas, 'objResults', 34500)
            return atsArrayVentas
        };

        const getFileName = (auxiliaryRecords, format) => {
            if (format === 'XLSX') {
                return `AT${auxiliaryRecords.period.month}${auxiliaryRecords.period.year}.xls`;
            }
        }

        const createLogRecord = (scriptParameters, hasSubsidiariesFeature) => {
            let logRecord = record.create({ type: "customrecord_ts_ec_rpt_generator_log" });
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
            let contenidoJSON = new Array();
            saveJson(ArrayXLS, 'pruebaXLS', 34500)
            for (let i = 0; i < ArrayXLS.length; i++) {
                let detalle = new Object();
                let data = ArrayXLS[i];
                let idInterno = data[0]; //* 0 ID interno
                detalle.periodo = data[1] || ""; //* 1 Período contable : Nombre
                detalle.rucEmpresa = data[2] || ""; //* 2 RUC Empresa
                detalle.mes = data[3] || ""; //* 3 Periodo: Mes
                detalle.anio = data[4] || ""; //* 4 Periodo: Año
                detalle.fechaEmiCompro = data[5] || ""; //* 5 Tipo Identificacion
                detalle.rucCedPasa = data[6] || ""; //* 6 RUC / Cédula / Pasaporte
                detalle.nombreProvee = data[7] || ""; //* 7 Nombre Proveedor (Opcional)
                detalle.fechaRegisConta = data[8] || ""; //* 8 PARTERELVTAS
                detalle.establecimiento = data[9] || ""; //* 9 ESTABLECIMIENTO
                detalle.codComprobante = data[10] || ""; //* 10 CO. COMPROBANTE
                detalle.cantComprobMes = Number(data[11]) || 0; //* 11 CANTIDAD DE COMPROB /MES
                detalle.factSistema = data[12] || ""; //* 12 FACTURA SISTEMA
                detalle.facFisico = data[13] || ""; //13 FAC. FÍSICO
                detalle.baseNoIva = Number(data[14]) || 0; //14 BASE NO APLICA IVA
                detalle.baseImponTarif0 = Number(data[15]) || 0; //15 BASE IMPON. TARIFA 0%
                detalle.baseImponTarif0_1 = Number(data[16]) || 0; //16 BASE IMPON. TARIFA <> 0%
                detalle.montoIva = Number(data[17]) || 0; //17 MONTO IVA
                detalle.declaraRetIva = Number(data[18]) || 0; //18 DECLARAR RET.IVA
                detalle.iva10 = Number(data[19]) || 0; //19 IVA 10%
                detalle.iva20 = Number(data[20]) || 0; //20 IVA 20%
                detalle.iva30 = Number(data[21]) || 0; //21 IVA 30%
                detalle.iva70 = Number(data[22]) || 0; //22 IVA 70%
                detalle.iva100 = Number(data[23]) || 0; //23 IVA 100%
                detalle.montoIce = Number(data[24]) || 0; //24 MONTO ICE
                detalle.montoRetIva = Number(data[25]) || 0; //25 MONTO RET. IVA
                detalle.declaraRetRenta = data[18] || ""; //26 DECLARAR RET.RENTA
                detalle.montoRetIr = Number(data[26]) || 0; //27 MONTO RET. IR
                detalle.ir1 = Number(data[27]) || 0; //28 IR 1%
                detalle.ir2 = Number(data[28]) || 0; //29 IR 2%
                detalle.ir0 = Number(data[29]) || 0; //30 IR 0%
                detalle.factFisico = data[30] || ""; //31 FAC. FÍSICO
                detalle.serie = data[31] || ""; //32 SERIE
                detalle.secuencia = data[32] || ""; //33 SECUENCIA
                detalle.autoriza = data[33] || ""; //34 AUTORIZACION
                detalle.origenRtf = data[34] || ""; //35 ORIGENRTF
                detalle.oficinaRtf = data[36] || ""; //36 OFICINARTF
                detalle.tasaIvaMov = data[37] || ""; //37 TASA IVA MOVIMIENTO
                detalle.dscto2Solidario = data[38] || ""; //38 DSCTO.2% SOLIDARIO
                detalle.tipoRtf = data[39] || ""; //39 TIPORTF
                detalle.fecEmiDoc = data[40] || ""; //40 FEC.EMISIÓN DOCUMENTO
                detalle.fecAutSri = data[41] || ""; //41 FEC.AUTORIZACIÓN SRI
                detalle.denom_cliente = data[42] || ""; //42 DENOMINACIÓN CLIENTE
                detalle.tipoEmision = data[43] || ""; //43 TIPO EMISIÓN
                detalle.tipoCompen = data[44] || ""; //44 TIPO COMPEN.
                detalle.montoCompen = Number(data[45]) || 0; //45 MONTO COMPENSACIÓN
                detalle.formaPago = data[46] || ""; //46 FORMA PAGO
                detalle.ir1_75 = Number(data[47]) || 0; //47 IR 1.75
                detalle.ir2_75 = Number(data[48]) || 0; //48 IR 2.75%
                detalle.parRel = data[49] || ""; //49 PAR REL.
                detalle.montoIce_1 = Number(data[50]) || 0; //50 MONTO ICE
                detalle.tipoIdeSri = data[51] || ""; //51 TIPO ID. SRI

                contenidoJSON.push(detalle);

            }
            return contenidoJSON;
        }

        const saveJson = (contents, nombre, folder) => {
            let date = new Date();
            var tdate = date.getDate();
            tdate = Number(tdate) < 10 ? `0${tdate}` : tdate;
            var month = date.getMonth() + 1;
            month = Number(month) < 10 ? `0${month}` : month;
            var year = date.getFullYear();
            let fecha = `${tdate}${month}${year}`;

            let fileObj = file.create({
                name: `${nombre}_${fecha}.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: folder,
                isOnline: false
            });
            return fileObj.save();
        }

        return {
            execute
        }
    }
)