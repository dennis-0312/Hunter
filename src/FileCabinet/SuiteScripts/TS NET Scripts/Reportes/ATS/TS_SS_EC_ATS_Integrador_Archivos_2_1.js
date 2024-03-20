/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/log', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/search', 'N/render', 'N/record', 'N/encode'],
    (log, runtime, task, format, file, search, render, record, encode) => {
        let currentScript = runtime.getCurrentScript();

        const FTL_TEMPLATE_NAME = "./TS_FTL_EC_ATS_XML.ftl";
        const FTL_TEMPLATE_EXCEL = "./TS_FTL_EC_ATS_XLS.ftl";
        const FOLDER_ID = "506"; //Path => SuiteBundles : Bundle 419588 : com.netsuite.psgsbe : src : cs : field_change_handler
        const execute = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);
                let auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);

                let atsFiles = getAtsFiles(scriptParameters.atsFilesId);
                let formato = scriptParameters.format;
                log.debug('Formato', formato);
                if (atsFiles.length) {
                    log.debug('if length', true);
                    if (formato === 'XLSX') {
                        try {
                            let datos = buildJsonForExcel(atsFiles);
                            generateXls(datos, scriptParameters, auxiliaryRecords);
                        } catch (error) {
                            log.error('Error formato XLS', error);
                        }
                    }

                    if (formato === 'XML') {
                        let json = buildJson(atsFiles);
                        // log.error("json", json);
                        generateXML(json, scriptParameters, auxiliaryRecords);
                    }

                } else {
                    log.error('ATSFILES', 'No se encontraron archivos');
                }
            } catch (error) {
                log.error("error", error)
            }
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};

            if (environmentFeatures.hasSubsidiaries)
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_ss_ec_ats_int_arc_subsidia');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_ss_ec_ats_int_arc_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_ss_ec_ats_int_arc_folder');
            scriptParameters.atsFilesId = currentScript.getParameter('custscript_ts_ss_ec_ats_int_arc_atsfiles');
            scriptParameters.logId = currentScript.getParameter('custscript_ts_ss_ec_ats_int_arc_logid');
            //<I> rhuaccha: 2024-02-26
            scriptParameters.format = currentScript.getParameter('custscript_ts_ss_ec_ats_int_arc_formato');
            //<F> rhuaccha: 2024-02-26

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

        const getAtsFiles = (atsFilesId) => {
            let files = [];
            let filesId = atsFilesId.split('|');

            for (let i = 0; i < filesId.length; i++) {
                if (filesId[i] == "") continue;
                let atsFile = file.load({
                    id: filesId[i]
                });
                files.push(atsFile);
            }
            return files;
        }

        const buildJson = (atsFiles) => {
            let jsonBuilded = {};
            let identificacionInformante = getFileContentByName(atsFiles, "IDENTIFICACION DEL INFORMANTE");
            // log.error("identificacionInformante", identificacionInformante);
            setIdentificacionInformante(jsonBuilded, identificacionInformante);

            let comprasReembolso = getFileContentByName(atsFiles, "COMPRAS REMBOLSO");
            comprasReembolso.pop();
            // log.error("comprasReembolso", comprasReembolso);

            let formasPago = getFileContentByName(atsFiles, "FORMA DE PAGO");
            formasPago.pop();
            // log.error("formasPago", formasPago);

            let comprasRetenciones = getFileContentByName(atsFiles, "COMPRAS RETENCIONES");
            comprasRetenciones.pop();
            // log.error("comprasRetenciones", comprasRetenciones);

            let comprasDetalladas = getFileContentByName(atsFiles, "COMPRAS DETALLADAS");
            comprasDetalladas.pop();
            // log.error("comprasDetalladas", comprasDetalladas);

            setComprasDetalladas(jsonBuilded, comprasDetalladas, comprasReembolso, formasPago, comprasRetenciones);
            log.error('jsonBuilded.compras', jsonBuilded.compras)
            log.error('jsonBuilded', jsonBuilded)

            let ventasClientes = getFileContentByName(atsFiles, "VENTAS DE CLIENTES");
            ventasClientes.pop();
            // log.error("ventasClientes", ventasClientes);

            /*
            let formasPagoVenta = getFileContentByName(atsFiles, "FORMA DE PAGO VENTAS");
            formasPagoVenta.pop();
            log.error("formasPagoVenta", formasPagoVenta);*/

            setVentasDetalladas(jsonBuilded, ventasClientes/*, formasPagoVenta*/);

            let ventasEstablecimiento = getFileContentByName(atsFiles, "VENTAS POR ESTABLECIMIENTO");
            ventasEstablecimiento.pop();
            // log.error("ventasEstablecimiento", ventasEstablecimiento);

            setVentasPorEstablecimiento(jsonBuilded, ventasEstablecimiento);

            let ventasExportaciones = getFileContentByName(atsFiles, "VENTAS DE EXPORTACIONES");
            ventasExportaciones.pop();
            // log.error("ventasExportaciones", ventasExportaciones);

            setVentasDeExportación(jsonBuilded, ventasExportaciones);

            let comprobantesAnulados = getFileContentByName(atsFiles, "ANULADOS");
            comprobantesAnulados.pop();
            // log.error("comprobantesAnulados", comprobantesAnulados);

            setComprobanteAnulados(jsonBuilded, comprobantesAnulados);

            return jsonBuilded;
        }

        const generateXML = (txtDataJson, scriptParameters, auxiliaryRecords) => {
            let templateFile = file.load({ id: FTL_TEMPLATE_NAME });

            let data = { text: JSON.stringify(txtDataJson) };

            let renderer = render.create();
            renderer.templateContent = templateFile.getContents();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'jsonString',
                data
            });
            let contents = renderer.renderAsString();

            let name = getFileName(auxiliaryRecords, 'XML');
            let fileId = file.create({
                name,
                fileType: file.Type.XMLDOC,
                contents,
                folder: FOLDER_ID
            }).save();
            let xmlFile = file.load({ id: fileId });
            log.error("url", xmlFile.url);
            updateRecordLog(scriptParameters, xmlFile.url, xmlFile.name);
        }

        const getFileName = (auxiliaryRecords, format) => {
            if (format === 'XML') {
                return `AT${auxiliaryRecords.period.month}${auxiliaryRecords.period.year}.xml`;
            }
            if (format === 'XLSX') {
                return `AT${auxiliaryRecords.period.month}${auxiliaryRecords.period.year}.xls`;
            }
            return `AT${auxiliaryRecords.period.month}${auxiliaryRecords.period.year}.xml`;
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


        const getFileContentByName = (atsFiles, fileName) => {
            let fullContent = "";
            for (let i = 0; i < atsFiles.length; i++) {
                let name = atsFiles[i].name;
                let content = atsFiles[i].getContents();
                if ((name.substr(0, name.indexOf('('))).trim() == fileName.trim()) {
                    fullContent += content;
                }
            }
            return fullContent.split('\r\n');
        }

        const setIdentificacionInformante = (jsonBuilded, identificacionInformante) => {
            let identificacion = identificacionInformante[0].split('|');
            jsonBuilded.TipoIDInformante = identificacion[0] || "";
            jsonBuilded.IdInformante = identificacion[1] || "";
            jsonBuilded.razonSocial = identificacion[2] || "";
            jsonBuilded.Anio = identificacion[3] || "";
            jsonBuilded.Mes = identificacion[4] || "";
            jsonBuilded.numEstabRuc = identificacion[5] || "";
            jsonBuilded.totalVentas = Number(identificacion[6]) || 0;
            jsonBuilded.codigoOperativo = identificacion[7] || "";
        }

        const setComprasDetalladas = (jsonBuilded, comprasDetalladas, comprasReembolso, formasPago, comprasRetenciones) => {
            //!SS => EC - ATS Compras Detalladas - customsearch_ts_ec_compras_detalladas
            let compras = [];

            for (let i = 0; i < comprasDetalladas.length; i++) {
                let detalleCompras = {};
                let pagoExterior = {};
                let formasDePago = {};
                let compraDetallada = comprasDetalladas[i].split('|');
                let codigoCompra = compraDetallada[0]; //* 1 Codigo de compra

                detalleCompras.codSustento = compraDetallada[1] || ""; //* 2 Codigo de sustento
                detalleCompras.tpIdProv = compraDetallada[2] || ""; //* 3 Tipo de identificacion del proveedor
                detalleCompras.idProv = compraDetallada[3] || ""; //* 4 Numero de identificacion del proveedor
                detalleCompras.tipoComprobante = compraDetallada[4] || ""; //* 5 Codigo del tipo de comprobante
                detalleCompras.parteRel = compraDetallada[5] || ""; //* 6 Parte relacionada
                detalleCompras.tipoProv = compraDetallada[6] || ""; //* 7 Tipo de proveedor
                detalleCompras.denoProv = compraDetallada[7] || ""; //* 8 Proveedor razon social
                detalleCompras.fechaRegistro = compraDetallada[8] || ""; //* 9 CV Fecha de registro
                detalleCompras.establecimiento = compraDetallada[9] || ""; //* 10 CV Establecimiento
                detalleCompras.puntoEmision = compraDetallada[10] || ""; //* 11 CV Punto emision
                detalleCompras.secuencial = compraDetallada[11] || ""; //* 12 CV Secuencial
                detalleCompras.fechaEmision = compraDetallada[12] || ""; //* 13 CV Fecha de emision
                detalleCompras.autorizacion = compraDetallada[13] || ""; //* 14 CV Numero de autorizacion
                detalleCompras.baseNoGraIva = Number(compraDetallada[14]) || 0; //* 15 Base Imponible no objeto de IVA
                detalleCompras.baseImponible = Number(compraDetallada[15]) || 0; //* 16 Base imponible tarifa 0% de IVA 
                detalleCompras.baseImpGrav = Number(compraDetallada[16]) || 0; //* 17 Base imponible gravada
                detalleCompras.baseImpExe = Number(compraDetallada[17]) || 0; //* 18 Base exenta
                detalleCompras.montoIce = Number(compraDetallada[18]) || 0; //* 19 Monto ICE
                detalleCompras.montoIva = Number(compraDetallada[19]) || 0; //* 20 Monto IVA
                detalleCompras.valRetBien10 = Number(compraDetallada[20]) || 0; //* 21 Retencion bienes 10%
                detalleCompras.valRetServ20 = Number(compraDetallada[21]) || 0; //* 22 Retencion servicios 20%
                detalleCompras.valorRetBienes = Number(compraDetallada[22]) || 0; //* 23 Retencion de IVA 30% bienes
                detalleCompras.valRetServ50 = Number(compraDetallada[23]) || 0; //* 24 Retencion de IVA 50% bienes
                detalleCompras.valorRetServicios = Number(compraDetallada[24]) || 0; //* 25 Retencion de IVA 70% servicios
                detalleCompras.valRetServ100 = Number(compraDetallada[25]) || 0; //* 26 Retencion de IVA 100%

                let totbasesImpReemb = getTotalBaseImponibleReembolso(codigoCompra, comprasReembolso);
                detalleCompras.totbasesImpReemb = totbasesImpReemb || 0;

                pagoExterior.pagoLocExt = compraDetallada[27]; //* 28 Pago Local o Extranjero
                pagoExterior.tipoRegi = compraDetallada[28]; //* 29 Tipos de regimen fiscal del exterior
                pagoExterior.paisEfecPagoGen = compraDetallada[29]; //* 30 País de residencia o establecimiento permanente a quién se efectúa el pago régimen general
                pagoExterior.paisEfecPagoParFis = compraDetallada[30]; //* 31 País de residencia o establecimiento permanente a quién se efectúa el pago paraíso fiscal
                pagoExterior.denopago = compraDetallada[31]; //* 32 Denominación del régimen fiscal preferente o jurisdicción de menor imposición.
                pagoExterior.paisEfecPago = compraDetallada[32]; //* 33 País al que se efectúa el pago
                pagoExterior.aplicConvDobTrib = compraDetallada[33]; //* 34 ¿Aplica convenio de doble tributación?
                pagoExterior.pagExtSujRetNorLeg = compraDetallada[34]; //* 35 ¿Pago al exterior en aplicación a la Normativa Legal?
                pagoExterior.pagoRegFis = compraDetallada[35]; //* 36 ¿El pago es a un régimen fiscal preferente o de menor imposición?

                detalleCompras.pagoExterior = pagoExterior;

                formasDePago.formaPago = getFormaPago(codigoCompra, formasPago)
                detalleCompras.formasDePago = formasDePago;

                /* Inicio Edwin*****/
                let reembosloTotal = getFormaReembolso(codigoCompra, comprasReembolso)
                detalleCompras.reembolsos = reembosloTotal;
                /* Fin Edwin*****/


                // log.debug('CÓDIGO DE COMPRA', codigoCompra);
                if(detalleCompras.tipoComprobante != '02'){
                    let air = getComprasRetenciones(codigoCompra, comprasRetenciones);
                    detalleCompras.air = air;
                } else {
                    let air = [
                        {
                            codRetAir: '332',
                            baseImpAir: detalleCompras.baseImpGrav,
                            porcentajeAir: 0,
                            valRetAir:  0
                        }
                    ];
                    detalleCompras.air = air;
                }

                detalleCompras.estabRetencion1 = compraDetallada[36]; //* 37 No. de serie del comprobante de retención - establecimiento
                detalleCompras.ptoEmiRetencion1 = compraDetallada[37]; //* 38 No. de serie del comprobante de retención - punto de emisión
                detalleCompras.secRetencion1 = compraDetallada[38]; //* 39 No. secuencial del comprobante de retención
                detalleCompras.autRetencion1 = compraDetallada[39]; //* 40 No. de autorización del comprobante de retención
                detalleCompras.fechaEmiRet1 = compraDetallada[40]; //* 41 Fecha de emision del comprobante de retención

                compras.push(detalleCompras);
            }
            jsonBuilded.compras = compras;
        }

        const setVentasDetalladas = (jsonBuilded, ventasClientes/*, formasPago*/) => {
            let ventas = [];

            for (let i = 0; i < ventasClientes.length; i++) {
                let detalleVentas = {};

                let ventaCliente = ventasClientes[i].split('|');
                //let codigoVenta = ventaCliente[0];
                detalleVentas.tpIdCliente = ventaCliente[0];
                detalleVentas.idCliente = ventaCliente[1];
                detalleVentas.parteRelVtas = ventaCliente[2];
                detalleVentas.tipoCliente = ventaCliente[3];
                detalleVentas.DenoCli = ventaCliente[4];

                detalleVentas.tipoComprobante = ventaCliente[5];
                detalleVentas.tipoEmision = ventaCliente[6];

                detalleVentas.numeroComprobantes = ventaCliente[7];
                detalleVentas.baseNoGraIva = Number(ventaCliente[8]) || 0;
                detalleVentas.baseImponible = Number(ventaCliente[9]) || 0;
                detalleVentas.baseImpGrav = Number(ventaCliente[10]) || 0;
                detalleVentas.montoIva = Number(ventaCliente[11]) || 0;

                detalleVentas.montoIce = Number(ventaCliente[12]) || 0;
                detalleVentas.valorRetIva = Number(ventaCliente[13]) || 0;
                detalleVentas.valorRetRenta = Number(ventaCliente[14]) || 0;

                let formasDePago = getFormasPagoVenta(ventaCliente[15]);
                detalleVentas.formasDePago = formasDePago;
                ventas.push(detalleVentas);
            }

            jsonBuilded.ventas = ventas;
        }

        const setVentasPorEstablecimiento = (jsonBuilded, ventasEstablecimiento) => {
            let ventas = [];

            for (let i = 0; i < ventasEstablecimiento.length; i++) {
                let ventaEst = {};
                let ventaEstablecimiento = ventasEstablecimiento[i].split('|');

                ventaEst.codEstab = ventaEstablecimiento[0];
                ventaEst.ventasEstab = Number(ventaEstablecimiento[1]) || 0;
                ventaEst.ivaComp = Number(ventaEstablecimiento[2]) || 0;
                ventas.push(ventaEst);
            }

            // log.error("setVentasPorEstablecimiento", ventas);
            jsonBuilded.ventasEstablecimiento = ventas;
        }

        const setComprobanteAnulados = (jsonBuilded, comprobantesAnulados) => {
            let anulados = []

            for (let i = 0; i < comprobantesAnulados.length; i++) {
                let detalleAnulados = {}
                let comprobanteAnulado = comprobantesAnulados[i].split('|');

                detalleAnulados.tipoComprobante = comprobanteAnulado[0];
                detalleAnulados.establecimiento = comprobanteAnulado[1];
                detalleAnulados.puntoEmision = comprobanteAnulado[2];
                detalleAnulados.secuencialInicio = comprobanteAnulado[3];
                detalleAnulados.secuencialFin = comprobanteAnulado[4];
                detalleAnulados.autorizacion = comprobanteAnulado[5];

                anulados.push(detalleAnulados);
            }
            // log.error("setComprobanteAnulados", anulados);
            jsonBuilded.anulados = anulados;
        }

        const setVentasDeExportación = (jsonBuilded, ventasExportaciones) => {
            let exportaciones = [];

            for (let i = 0; i < ventasExportaciones.length; i++) {
                let detalleExportaciones = {};
                let ventaExportacion = ventasExportaciones[i].split('|');

                detalleExportaciones.tpIdClienteEx = ventaExportacion[1];
                detalleExportaciones.idClienteEx = ventaExportacion[2];
                detalleExportaciones.parteRelExp = ventaExportacion[3];
                detalleExportaciones.tipoCli = ventaExportacion[4];
                detalleExportaciones.denoExpCli = ventaExportacion[5];
                detalleExportaciones.tipoRegi = ventaExportacion[6];
                detalleExportaciones.paisEfecPagoGen = ventaExportacion[7]
                detalleExportaciones.paisEfecPagoParFis = ventaExportacion[8];
                detalleExportaciones.denopagoRegFis = ventaExportacion[9]
                detalleExportaciones.paisEfecExp = ventaExportacion[10];
                detalleExportaciones.pagoRegFis = ventaExportacion[11];
                detalleExportaciones.exportacionDe = ventaExportacion[12];
                detalleExportaciones.tipIngExt = ventaExportacion[13];
                detalleExportaciones.ingExtGravOtroPais = ventaExportacion[14];
                detalleExportaciones.impuestootropais = Number(ventaExportacion[15]) || 0;
                detalleExportaciones.tipoComprobante = ventaExportacion[16];
                detalleExportaciones.distAduanero = ventaExportacion[17];
                detalleExportaciones.anio = ventaExportacion[18];
                detalleExportaciones.regimen = ventaExportacion[19];
                detalleExportaciones.correlativo = ventaExportacion[20];
                detalleExportaciones.verificador = ventaExportacion[21];
                detalleExportaciones.docTransp = ventaExportacion[22];
                detalleExportaciones.fechaEmbarque = ventaExportacion[23];
                detalleExportaciones.fue = ventaExportacion[24];
                detalleExportaciones.valorFOB = Number(ventaExportacion[25]) || 0;
                detalleExportaciones.valorFOBComprobante = Number(ventaExportacion[26]) || 0;
                detalleExportaciones.establecimiento = ventaExportacion[27];
                detalleExportaciones.puntoEmision = ventaExportacion[28];
                detalleExportaciones.secuencial = ventaExportacion[29];
                detalleExportaciones.autorizacion = ventaExportacion[30];
                detalleExportaciones.fechaEmision = ventaExportacion[31];

                exportaciones.push(detalleExportaciones);
            }
            // log.error("exportaciones", exportaciones),
            jsonBuilded.exportaciones = exportaciones;
        }

        const getTotalBaseImponibleReembolso = (codigoCompra, comprasReembolso) => {
            let totalBaseImponibleReembolso = 0;
            for (let i = 0; i < comprasReembolso.length; i++) {
                let compraReembolso = comprasReembolso[i].split('|');
                if (codigoCompra != compraReembolso[1]) continue;
                totalBaseImponibleReembolso = roundTwoDecimals(totalBaseImponibleReembolso + Number(compraReembolso[14]));
            }
            return totalBaseImponibleReembolso;
        }

        const getFormaPago = (codigoCompra, formasPago) => {
            for (let i = 0; i < formasPago.length; i++) {
                let formaPago = formasPago[i].split('|');
                if (formaPago[0] != codigoCompra) continue;
                return formaPago[1];
            }
            return "";
        }

        const getFormaReembolso = (codigoCompra, formasReembolso) => {
            let reembolso = [];
            for (let i = 0; i < formasReembolso.length; i++) {
                let reemb = formasReembolso[i].split('|');
                if (Number(reemb[1]) === Number(codigoCompra)) {
                    let detalleReem = {
                        tipoComprobanteReemb: reemb[2],
                        tpIdProvReemb: reemb[3],
                        idProvReemb: reemb[4],
                        establecimientoReemb: reemb[5],
                        puntoEmisionReemb: reemb[6],
                        secuencialReemb: reemb[7],
                        fechaEmisionReemb: reemb[8],
                        autorizacionReemb: reemb[9],
                        baseImponibleReemb: Number(reemb[10]).toFixed(2),
                        baseImpGravReemb: Number(reemb[11]).toFixed(2),
                        baseNoGraIvaReemb: Number(reemb[12]).toFixed(2),
                        baseImpExeReemb: Number(reemb[13]).toFixed(2),
                        montoIceRemb: Number(reemb[15]).toFixed(2),
                        montoIvaRemb: Number(reemb[16]).toFixed(2),
                    };
                    //air.push(detalleAir);
                    reembolso.push(detalleReem);
                }
            }
            return reembolso;
        }

        const getFormasPagoVenta = (formasPago) => {
            let formasDePago = [];
            formasPago = formasPago.split(',');
            for (let i = 0; i < formasPago.length; i++) {
                formasDePago.push(formasPago[i]);
            }
            return formasDePago;
        }

        /*const getComprasRetenciones = (codigoCompra, comprasRetenciones) => {
            let air = [];
            for (let i = 0; i < comprasRetenciones.length; i++) {
                let compraRetencion = comprasRetenciones[i].split('|');
                if (Number(compraRetencion[0]) == Number(codigoCompra)) {
                    let detalleAir = {};
                    detalleAir.codRetAir = compraRetencion[1]; //& 2 Concepto de Retención en la fuente de Impuesto a la Renta 
                    detalleAir.baseImpAir = Number(compraRetencion[2]) || 0; //& 3 Base Imponible Renta
                    // detalleAir.porcentajeAir = compraRetencion[3].replace('- None -', ''); //& 4 Porcentaje de Retención en la fuente de Impuesto a la Renta
                    detalleAir.porcentajeAir = nvl(compraRetencion[3]);
                    detalleAir.valRetAir = Number(compraRetencion[4]) || 0; //& 5 Monto de retención de Renta
                    air.push(detalleAir);
                }
            }
            return air;
        }*/

        const getComprasRetenciones = (codigoCompra, comprasRetenciones) => {
            let air = [];
            let retGroup = 0;
            log.debug('codigoCompra', codigoCompra)
            log.debug('comprasRetenciones', comprasRetenciones)
            log.debug('comprasRetenciones.length', comprasRetenciones.length)
            for (let i = 0; i < comprasRetenciones.length; i++) {
                let compraRetencion = comprasRetenciones[i].split('|');
                if (Number(compraRetencion[0]) === Number(codigoCompra)) {
                    for (let j = 1; j < compraRetencion.length; j += 4) {
                        if (retGroup < 3) {
                            let detalleAir = {
                                codRetAir: (compraRetencion[j].replace(/[a-zA-Z]/g, "")).trim(),
                                baseImpAir: Number(compraRetencion[j + 1]) || 0,
                                porcentajeAir: compraRetencion[j + 2],
                                valRetAir: Number(compraRetencion[j + 3]) || 0
                            };

                            if(detalleAir.codRetAir != ''){
                                air.push(detalleAir);
                            }
                            /*
                            if (validateJson(detalleAir)) {
                                air.push(detalleAir);
                            }
                            */
                            retGroup++;
                        } else {
                            break;
                        }
                    }
                    break;
                }
            }
            return air;
        }

        const validateJson = (json) => {
            for (const propiedad in json) {
                const valor = json[propiedad];
                if (!valor || (typeof valor === "number" && valor === 0)) {
                    let row = `El campo "${propiedad}" no puede ser vacío o 0.`;
                    return false;
                }
            }
            return true;
        }

        const nvl = (valor) => {
            valor = valor.replace('- None -', '');

            if (valor === '' || valor === null) {
                return '0.00';
            } else {
                return valor;
            }
        }

        const roundTwoDecimals = (number) => {
            return Math.round(Number(number) * 100) / 100;
        }

        //<I> rhuaccha: 2024-02-26
        const getListFormaPago = (codigoCompra, formasPago) => {
            let arr = [];
            for (let i = 0; i < formasPago.length; i++) {
                let formaPago = formasPago[i].split('|');
                if (formaPago[0] != codigoCompra) continue;
                // return formaPago[1];
                arr.push(formaPago[1]);
            }
            return arr.join(",");
        }

        const buildJsonForExcel = (atsFiles) => {
            let json = {};
            let informante = getFileContentByName(atsFiles, "IDENTIFICACION DEL INFORMANTE");
            setIdentificacionInformante(json, informante);

            let comprasReembolso = getFileContentByName(atsFiles, "COMPRAS REMBOLSO");
            comprasReembolso.pop();

            let formasPago = getFileContentByName(atsFiles, "FORMA DE PAGO");
            formasPago.pop();

            let comprasRetenciones = getFileContentByName(atsFiles, "COMPRAS RETENCIONES");
            comprasRetenciones.pop();

            let comprasDetalladas = getFileContentByName(atsFiles, "COMPRAS DETALLADAS");
            comprasDetalladas.pop();

            getCompras(json, comprasDetalladas, comprasReembolso, formasPago, comprasRetenciones);

            return json;
        }

        const getCompras = (json, comprasDetalladas, comprasReembolso, formasPago, comprasRetenciones) => {
            //!SS => EC - ATS Compras Detalladas - customsearch_ts_ec_compras_detalladas
            let compras = [];

            for (let i = 0; i < comprasDetalladas.length; i++) {
                let detalle = {};
                let compraDetallada = comprasDetalladas[i].split('|');
                let codigoCompra = compraDetallada[0]; //* 1 Codigo de compra

                detalle.codSustento = compraDetallada[1] || ""; //* 2 Codigo de sustento
                detalle.tpIdProv = compraDetallada[2] || ""; //* 3 Tipo de identificacion del proveedor
                detalle.idProv = compraDetallada[3] || ""; //* 4 Numero de identificacion del proveedor
                detalle.tipoComprobante = compraDetallada[4] || ""; //* 5 Codigo del tipo de comprobante
                detalle.parteRel = compraDetallada[5] || ""; //* 6 Parte relacionada
                detalle.tipoProv = compraDetallada[6] || ""; //* 7 Tipo de proveedor
                detalle.denoProv = compraDetallada[7] || ""; //* 8 Proveedor razon social
                detalle.fechaRegistro = compraDetallada[8] || ""; //* 9 CV Fecha de registro
                detalle.establecimiento = compraDetallada[9] || ""; //* 10 CV Establecimiento
                detalle.puntoEmision = compraDetallada[10] || ""; //* 11 CV Punto emision
                detalle.secuencial = compraDetallada[11] || ""; //* 12 CV Secuencial
                detalle.fechaEmision = compraDetallada[12] || ""; //* 13 CV Fecha de emision
                detalle.autorizacion = compraDetallada[13] || ""; //* 14 CV Numero de autorizacion
                detalle.baseNoGraIva = Number(compraDetallada[14]) || 0; //* 15 Base Imponible no objeto de IVA
                detalle.baseImponible = Number(compraDetallada[15]) || 0; //* 16 Base imponible tarifa 0% de IVA 
                detalle.baseImpGrav = Number(compraDetallada[16]) || 0; //* 17 Base imponible gravada
                detalle.baseImpExe = Number(compraDetallada[17]) || 0; //* 18 Base exenta
                detalle.montoIce = Number(compraDetallada[18]) || 0; //* 19 Monto ICE
                detalle.montoIva = Number(compraDetallada[19]) || 0; //* 20 Monto IVA
                detalle.valRetBien10 = Number(compraDetallada[20]) || 0; //* 21 Retencion bienes 10%
                detalle.valRetServ20 = Number(compraDetallada[21]) || 0; //* 22 Retencion servicios 20%
                detalle.valorRetBienes = Number(compraDetallada[22]) || 0; //* 23 Retencion de IVA 30% bienes
                detalle.valRetServ50 = Number(compraDetallada[23]) || 0; //* 24 Retencion de IVA 50% bienes
                detalle.valorRetServicios = Number(compraDetallada[24]) || 0; //* 25 Retencion de IVA 70% servicios
                detalle.valRetServ100 = Number(compraDetallada[25]) || 0; //* 26 Retencion de IVA 100%

                let totbasesImpReemb = getTotalBaseImponibleReembolso(codigoCompra, comprasReembolso);
                detalle.totbasesImpReemb = totbasesImpReemb || 0;

                detalle.pagoLocExt = compraDetallada[27]; //* 28 Pago Local o Extranjero
                detalle.tipoRegi = compraDetallada[28]; //* 29 Tipos de regimen fiscal del exterior
                detalle.paisEfecPagoGen = compraDetallada[29]; //* 30 País de residencia o establecimiento permanente a quién se efectúa el pago régimen general
                detalle.paisEfecPagoParFis = compraDetallada[30]; //* 31 País de residencia o establecimiento permanente a quién se efectúa el pago paraíso fiscal
                detalle.denopago = compraDetallada[31]; //* 32 Denominación del régimen fiscal preferente o jurisdicción de menor imposición.
                detalle.paisEfecPago = compraDetallada[32]; //* 33 País al que se efectúa el pago
                detalle.aplicConvDobTrib = compraDetallada[33]; //* 34 ¿Aplica convenio de doble tributación?
                detalle.pagExtSujRetNorLeg = compraDetallada[34]; //* 35 ¿Pago al exterior en aplicación a la Normativa Legal?
                detalle.pagoRegFis = compraDetallada[35]; //* 36 ¿El pago es a un régimen fiscal preferente o de menor imposición?

                detalle.formasDePago = getListFormaPago(codigoCompra, formasPago);

                /* Inicio Edwin*****/
                let reembosloTotal = getFormaReembolso(codigoCompra, comprasReembolso)
                detalle.reembolsos = reembosloTotal;
                /* Fin Edwin*****/

                // log.debug('CÓDIGO DE COMPRA', codigoCompra);
                log.debug('detalle.tipoComprobante',detalle.tipoComprobante)
                let air = [];
                if(detalle.tipoComprobante != '02'){
                    air = getComprasRetenciones(codigoCompra, comprasRetenciones);
                } else {
                    air = [
                        {
                            codRetAir: '332',
                            baseImpAir: detalle.baseImpGrav,
                            porcentajeAir: 0,
                            valRetAir:  0
                        }
                    ];
                }
                log.debug('air',air)
                // log.debug('SECCIÓN AIR COMPRAS', air);
                // detalle.air = air;
                air.forEach((obj, index) => {
                    let key1 = `codRetAir${index + 1}`;
                    let key2 = `baseImpAir${index + 1}`;
                    let key3 = `porcentajeAir${index + 1}`;
                    let key4 = `valRetAir${index + 1}`;

                    detalle[key1] = obj.codRetAir;
                    detalle[key2] = obj.baseImpAir;
                    detalle[key3] = obj.porcentajeAir;
                    detalle[key4] = obj.valRetAir;
                });

                detalle.estabRetencion1 = compraDetallada[36]; //* 37 No. de serie del comprobante de retención - establecimiento
                detalle.ptoEmiRetencion1 = compraDetallada[37]; //* 38 No. de serie del comprobante de retención - punto de emisión
                detalle.secRetencion1 = compraDetallada[38]; //* 39 No. secuencial del comprobante de retención
                detalle.autRetencion1 = compraDetallada[39]; //* 40 No. de autorización del comprobante de retención
                detalle.fechaEmiRet1 = compraDetallada[40]; //* 41 Fecha de emision del comprobante de retención
                compras.push(detalle);
            }
            json.compras = compras;
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
            log.debug('DETALLE DEL ARCHIVO', { name: xlsFile.name, ulr: xlsFile.url });
            updateRecordLog(scriptParameters, xlsFile.url, xlsFile.name);
        }

        const createXmlExcel = (datos) => {
            const info = [
                ["Tipo ID Informante", datos.TipoIDInformante],
                ["Id Informante", datos.IdInformante],
                ["Razón Social", datos.razonSocial],
                ["Año", datos.Anio],
                ["Mes", datos.Mes],
                ["Numero Ruc", datos.numEstabRuc],
                ["Total Ventas", datos.totalVentas],
                ["Código Operativo", datos.codigoOperativo],
            ]
            let xmlString = '<?xml version="1.0" encoding="UTF-8" ?><?mso-application progid="Excel.Sheet"?>';
            xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"';
            xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office"';
            xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel"';
            xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"';
            xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
            xmlString += getStyleExcel();
            xmlString += '<Worksheet ss:Name="Compras">';
            xmlString += '<Table>';

            info.forEach(item => {
                let fieldName = item[0];
                let fieldValue = item[1];
                xmlString += `<Row><Cell ss:StyleID="chead"><Data ss:Type="String">${fieldName}</Data></Cell>`;
                xmlString += `<Cell ss:StyleID="cString"><Data ss:Type="${typeof fieldValue === 'number' ? 'Number' : 'String'}">${fieldValue}</Data></Cell></Row>`;

            });

            xmlString += '<Row/>';
            xmlString += '<Row/>';

            let header = "Identificación del sustento tributario,Tipo de Identificación del Proveedor,No. de Identificación del Proveedor,Código tipo de comprobante,Parte Relacionada,Tipo de Proveedor,Razón o denominación social del proveedor,Fecha de registro contable del comprobante de venta,No. de serie del comprobante de venta - establecimiento,No. de serie del comprobante de  venta - punto de emisión,No. secuencial del comprobante de venta,Fecha  de  emisión  del comprobante de venta,No. de autorización  del comprobante de venta,Base Imponible No objeto de IVA,Base Imponible tarifa 0% IVA,Base Imponible tarifa IVA diferente de 0%,Base imponible exenta de IVA,Monto ICE,Monto IVA,Retención IVA 10%,Retención IVA 20%,Retención IVA 30%,Retención IVA 50%,Retención IVA 70%,Retención IVA 100%,Pago a residente  o no residente,Tipos de régimen fiscal del exterior,País de residencia o establecimiento permanente a quién se efectúa el pago régimen general,País de residencia o establecimiento permanente a quién se efectúa el pago paraíso fiscal,Denominación del régimen fiscal preferente o jurisdicción de menor imposición,País de residencia o establecimiento permanente a quién se efectúa el pago,Aplica Convenio de Doble Tributación en el pago,Pago al exterior sujeto a retención en aplicación a la norma legal,¿El pago es a unrégimen fiscal preferente o de menor imposición?,Forma de pago,No. de serie del comprobante de retención - establecimiento,No. de serie del comprobante de retención - punto de emisión,No. secuencial del comprobante de retención,No. de autorización del comprobante de retención,Fecha de emisión del comprobante de retención,Total Bases Imponibles Reembolso";
            let arrHeader = header.split(',');

            xmlString += '<Row>';
            arrHeader.forEach(value => {
                xmlString += `<Cell ss:StyleID="wrapText"><Data ss:Type="String">${value}</Data></Cell>`;
            });
            xmlString += '</Row>';

            /*datos.compras.forEach(compra => {
                xmlString += '<Row>';
                Object.entries(compra).forEach(([key, value]) => {
                    xmlString += `<Cell ss:StyleID="cString"><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${value}</Data></Cell>`;
                });
                xmlString += '</Row>';
            });*/

            xmlString += '</Table>';
            xmlString += '</Worksheet>';
            xmlString += '</Workbook>';

            let base64 = encode.convert({
                string: xmlString,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });

            let fileId = file.create({
                name: 'REPORTE.xls',
                fileType: file.Type.EXCEL,
                contents: base64,
                folder: FOLDER_ID
            }).save();
            log.debug('ID DEL ARCHIVO', fileId);
        }

        const getStyleExcel = () => {
            let xmlStyle = '';
            xmlStyle += '<Styles>';
            xmlStyle += '<Style ss:ID="Default" ss:Name="Normal">';
            xmlStyle += '<Alignment ss:Vertical="Bottom"/>';
            xmlStyle += '<Borders/>';
            xmlStyle += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>';
            xmlStyle += '<Interior/>';
            xmlStyle += '<NumberFormat/>';
            xmlStyle += '<Protection/>';
            xmlStyle += '</Style>';
            xmlStyle += '<Style ss:ID="chead">';
            xmlStyle += '<Alignment ss:Horizontal="left" ss:Vertical="Center"/>';
            xmlStyle += getBorders();
            xmlStyle += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#000000" ss:Bold="1"/>';
            xmlStyle += '<Interior ss:Color="#BFBFBF" ss:Pattern="Solid"/>';
            xmlStyle += '</Style>';
            xmlStyle += '<Style ss:ID="cString">';
            xmlStyle += '<Alignment ss:Horizontal="left" ss:Vertical="Center"/>';
            xmlStyle += getBorders();
            xmlStyle += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="9" ss:Color="#000000"/>';
            xmlStyle += '</Style>';
            xmlStyle += '<Style ss:ID="cNumber">';
            xmlStyle += '<Alignment ss:Horizontal="Right" ss:Vertical="Center"/>';
            xmlStyle += getBorders();
            xmlStyle += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="9" ss:Color="#000000"/>';
            xmlStyle += '<NumberFormat ss:Format="#,##0.00"/>'
            xmlStyle += '</Style>';
            xmlStyle += '<Style ss:ID="wrapText">';
            xmlStyle += '<Alignment ss:Vertical="Center" ss:WrapText="1"/>';
            xmlStyle += getBorders();
            xmlStyle += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#000000" ss:Bold="1"/>';
            xmlStyle += '<Interior ss:Color="#BFBFBF" ss:Pattern="Solid"/>';
            xmlStyle += '</Style>';
            xmlStyle += '</Styles>';
            return xmlStyle;
        }

        const getBorders = () => {
            let border = '';
            border += '<Borders>';
            border += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>';
            border += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>';
            border += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>';
            border += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>';
            border += '</Borders>';
            return border;
        }
        //<F> rhuaccha: 2024-02-26

        return {
            execute
        }
    }
)