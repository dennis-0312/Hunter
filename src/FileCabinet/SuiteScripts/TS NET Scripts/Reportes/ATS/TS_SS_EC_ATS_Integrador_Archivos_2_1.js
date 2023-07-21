/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/log', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/search', 'N/render', 'N/record'],
    (log, runtime, task, format, file, search, render, record) => {
        let currentScript = runtime.getCurrentScript();

        const FTL_TEMPLATE_NAME = "./TS_FTL_EC_ATS_XML.ftl";
        const FOLDER_ID = "1593";
        const execute = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);
                let auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);

                let atsFiles = getAtsFiles(scriptParameters.atsFilesId);
                if (atsFiles.length) {
                    let json = buildJson(atsFiles);
                    log.error("json", json);
                    generateXML(json, scriptParameters, auxiliaryRecords);

                } else {

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
            setIdentificacionInformante(jsonBuilded, identificacionInformante);

            let comprasReembolso = getFileContentByName(atsFiles, "COMPRAS REMBOLSO");
            comprasReembolso.pop();

            let formasPago = getFileContentByName(atsFiles, "FORMA DE PAGO");
            formasPago.pop();

            let comprasRetenciones = getFileContentByName(atsFiles, "COMPRAS RETENCIONES");
            comprasRetenciones.pop();

            let comprasDetalladas = getFileContentByName(atsFiles, "COMPRAS DETALLADAS");
            comprasDetalladas.pop();

            setComprasDetalladas(jsonBuilded, comprasDetalladas, comprasReembolso, formasPago, comprasRetenciones);
            
            let ventasClientes = getFileContentByName(atsFiles, "VENTAS DE CLIENTES");
            ventasClientes.pop();

            let formasPagoVenta = getFileContentByName(atsFiles, "FORMA DE PAGO VENTAS");
            formasPagoVenta.pop();

            setVentasDetalladas(jsonBuilded, ventasClientes, formasPagoVenta);

            let ventasEstablecimiento = getFileContentByName(atsFiles, "VENTAS POR ESTABLECIMIENTO");
            ventasEstablecimiento.pop();

            setVentasPorEstablecimiento(jsonBuilded, ventasEstablecimiento);
            
            let ventasExportaciones = getFileContentByName(atsFiles, "VENTAS DE EXPORTACIONES");
            ventasExportaciones.pop();

            setVentasDeExportación(jsonBuilded, ventasExportaciones);
            
            let comprobantesAnulados = getFileContentByName(atsFiles, "ANULADOS");
            comprobantesAnulados.pop();

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

            let name = getFileName(auxiliaryRecords);
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

        const getFileName = (auxiliaryRecords) => {
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
            jsonBuilded.totalVentas = identificacion[6] || 0;
            jsonBuilded.codigoOperativo = identificacion[7] || "";
        }

        const setComprasDetalladas = (jsonBuilded, comprasDetalladas, comprasReembolso, formasPago, comprasRetenciones) => {
            let compras = [];

            for (let i = 0; i < comprasDetalladas.length; i++) {
                let detalleCompras = {};
                let pagoExterior = {};
                let formasDePago = {};
                let compraDetallada = comprasDetalladas[i].split('|');
                let codigoCompra = compraDetallada[0];

                detalleCompras.codSustento = compraDetallada[1] || "";
                detalleCompras.tpIdProv = compraDetallada[2] || "";
                detalleCompras.idProv = compraDetallada[3] || "";
                detalleCompras.tipoComprobante = compraDetallada[4] || "";
                detalleCompras.parteRel = compraDetallada[5] || "";
                detalleCompras.tipoProv = compraDetallada[6] || "";
                detalleCompras.denoProv = compraDetallada[7] || "";
                detalleCompras.fechaRegistro = compraDetallada[8] || "";
                detalleCompras.establecimiento = compraDetallada[9] || "";
                detalleCompras.puntoEmision = compraDetallada[10] || "";
                detalleCompras.secuencial = compraDetallada[11] || "";
                detalleCompras.fechaEmision = compraDetallada[12] || "";
                detalleCompras.autorizacion = compraDetallada[13] || "";
                detalleCompras.baseNoGraIva = compraDetallada[14] || "";
                detalleCompras.baseImponible = compraDetallada[15] || "";
                detalleCompras.baseImpGrav = compraDetallada[16] || "";
                detalleCompras.baseImpExe = compraDetallada[17] || "";
                detalleCompras.montoIce = compraDetallada[18] || "";
                detalleCompras.montoIva = compraDetallada[19] || "";
                detalleCompras.valRetBien10 = compraDetallada[20] || "";
                detalleCompras.valRetServ20 = compraDetallada[21] || "";
                detalleCompras.valorRetBienes = compraDetallada[22] || "";
                detalleCompras.valRetServ50 = compraDetallada[23] || "";
                detalleCompras.valorRetServicios = compraDetallada[24] || "";
                detalleCompras.valRetServ100 = compraDetallada[25] || "";

                let totbasesImpReemb = getTotalBaseImponibleReembolso(codigoCompra, comprasReembolso);
                detalleCompras.totbasesImpReemb = totbasesImpReemb || 0;

                pagoExterior.pagoLocExt = compraDetallada[27];
                pagoExterior.tipoRegi = compraDetallada[28];
                pagoExterior.paisEfecPagoGen = compraDetallada[29];
                pagoExterior.paisEfecPagoParFis = compraDetallada[30];
                pagoExterior.denopago = compraDetallada[31];
                pagoExterior.paisEfecPago = compraDetallada[32];
                pagoExterior.aplicConvDobTrib = compraDetallada[33];
                pagoExterior.pagExtSujRetNorLeg = compraDetallada[34];
                pagoExterior.pagoRegFis = compraDetallada[35];

                detalleCompras.pagoExterior = pagoExterior;

                formasDePago.formaPago = getFormaPago(codigoCompra, formasPago)
                detalleCompras.formasDePago = formasDePago;

                let air = getComprasRetenciones(codigoCompra, comprasRetenciones);
                detalleCompras.air = air;

                detalleCompras.estabRetencion1 = compraDetallada[36];
                detalleCompras.ptoEmiRetencion1 = compraDetallada[37];
                detalleCompras.secRetencion1 = compraDetallada[38];
                detalleCompras.autRetencion1 = compraDetallada[39];
                detalleCompras.fechaEmiRet1 = compraDetallada[40];

                compras.push(detalleCompras);
            }
            jsonBuilded.compras = compras;
        }

        const setVentasDetalladas = (jsonBuilded, ventasClientes, formasPago) => {
            let ventas = [];

            for (let i = 0; i < ventasClientes.length; i++) {
                let detalleVentas = {};

                let ventaCliente = ventasClientes[i].split('|');
                let codigoVenta = ventaCliente[0];
                detalleVentas.tpIdCliente = ventaCliente[1];
                detalleVentas.idCliente = ventaCliente[2];
                detalleVentas.parteRel = ventaCliente[3];
                detalleVentas.tipoCliente = ventaCliente[4];
                detalleVentas.DenoCli = ventaCliente[5];

                detalleVentas.tipoComprobante = ventaCliente[6];
                detalleVentas.tipoEm = ventaCliente[7];

                detalleVentas.numeroComprobantes = ventaCliente[8];
                detalleVentas.baseNoGraIva = ventaCliente[9];
                detalleVentas.baseImponible = ventaCliente[10];
                detalleVentas.baseImpGrav = ventaCliente[11];
                detalleVentas.montoIva = ventaCliente[12];
                /*
                detalleVentas.tipoCompe = "";
                detalleVentas.monto = "";
                */
                detalleVentas.montoIce = ventaCliente[13];
                detalleVentas.valorRetIva = ventaCliente[14];
                detalleVentas.valorRetRenta = ventaCliente[15];

                let formasDePago = getFormasPagoVenta(codigoVenta, formasPago);
                detalleVentas.formasDePago = formasDePago;
            }

            jsonBuilded.ventas = ventas;
        }

        const setVentasPorEstablecimiento = (jsonBuilded, ventasEstablecimiento) => {
            let ventas = [];

            for (let i = 0; i < ventasEstablecimiento.length; i++) {
                let ventaEst = {};
                let ventaEstablecimiento = ventasEstablecimiento[i].split('|');

                ventaEst.codEstab = ventaEstablecimiento[0];
                ventaEst.ventasEstab = ventaEstablecimiento[1];
                ventaEst.ivaComp = ventaEstablecimiento[2];
                ventas.push(ventaEst);
            }

            log.error("setVentasPorEstablecimiento", ventas);
            jsonBuilded.ventasEstablecimiento = ventas;
        }

        const setComprobanteAnulados = (jsonBuilded, comprobantesAnulados) => {
            let anulados = []

            for (let i = 0; i < comprobantesAnulados.length; i++) {
                let detalleAnulados = {}
                let comprobanteAnulado = comprobantesAnulados[i].split('|');

                detalleAnulados.tipoComprobante = comprobanteAnulado[0];
                detalleAnulados.establecimiento = comprobanteAnulado[1];
                detalleAnulados.puntoEmision = comprobanteAnulado[3];
                detalleAnulados.secuencialInicio = comprobanteAnulado[4];
                detalleAnulados.secuencialFin = comprobanteAnulado[5];
                detalleAnulados.autorizacion = comprobanteAnulado[6];

                anulados.push(detalleAnulados);
            }
            log.error("setComprobanteAnulados", anulados);
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
                detalleExportaciones.ingextgravotropaís = ventaExportacion[14];
                detalleExportaciones.impuestootropaís = ventaExportacion[15];
                detalleExportaciones.tipoComprobante = ventaExportacion[16];
                detalleExportaciones.distAduanero = ventaExportacion[17];
                detalleExportaciones.anio = ventaExportacion[18];
                detalleExportaciones.regimen = ventaExportacion[19];
                detalleExportaciones.correlativo = ventaExportacion[20];
                detalleExportaciones.verificador = ventaExportacion[21];
                detalleExportaciones.docTransp = ventaExportacion[22];
                detalleExportaciones.fechaEmbarque = ventaExportacion[23];
                detalleExportaciones.fue = ventaExportacion[24];
                detalleExportaciones.valorFOB = ventaExportacion[25];
                detalleExportaciones.valorFOBComprobante = ventaExportacion[26];
                detalleExportaciones.establecimiento = ventaExportacion[27];
                detalleExportaciones.puntoEmision = ventaExportacion[28];
                detalleExportaciones.secuencial = ventaExportacion[29];
                detalleExportaciones.autorizacion = ventaExportacion[30];
                detalleExportaciones.fechaEmision = ventaExportacion[31];

                exportaciones.push(detalleExportaciones);
            }
            log.error("exportaciones", exportaciones),
            jsonBuilded.exportaciones = exportaciones;
        }

        const getTotalBaseImponibleReembolso = (codigoCompra, comprasReembolso) => {
            let totalBaseImponibleReembolso = 0;
            for (let i = 0; i < comprasReembolso.length; i++) {
                let compraReembolso = comprasReembolso[i].split('|');
                if (codigoCompra != compraReembolso[0]) continue;
                totalBaseImponibleReembolso = roundTwoDecimals(totalBaseImponibleReembolso + Number(compraReembolso[13]));
            }
            return totalBaseImponibleReembolso;
        }

        const getFormaPago = (codigoCompra, formasPago) => {
            for (let i = 0; i < formasPago.length; i++) {
                let formaPago = formasPago[i].split('|');
                if (formaPago[0] != codigoCompra) continue;
                return formaPago[1];
            }
        }

        const getFormasPagoVenta = (codigoVenta, formasPago) => {
            let formasDePago = []
            for (let i = 0; i < formasPago.length; i++) {
                let formaPago = formasPago[i].split('|');
                if (formaPago[0] != codigoVenta) continue;
                formasDePago.push(formaPago[1]);
            }
            return formasDePago;
        }

        const getComprasRetenciones = (codigoCompra, comprasRetenciones) => {
            let air = [];
            for (let i = 0; i < comprasRetenciones.length; i++) {
                let compraRetencion = comprasRetenciones[i].split('|');
                if (compraRetencion[0] == codigoCompra) {
                    let detalleAir = {};
                    detalleAir.codRetAir = compraRetencion[1];
                    detalleAir.baseImpAir = compraRetencion[2];
                    detalleAir.porcentajeAir = compraRetencion[3];
                    detalleAir.valRetAir = compraRetencion[4];
                    air.push(detalleAir);
                }
            }
            return air;
        }

        const roundTwoDecimals = (number) => {
            return Math.round(Number(number) * 100) / 100;
        }

        return {
            execute
        }
    }
)