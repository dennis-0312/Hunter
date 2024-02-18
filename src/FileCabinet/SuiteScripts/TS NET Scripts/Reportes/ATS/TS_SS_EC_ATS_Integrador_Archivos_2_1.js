/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/log', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/search', 'N/render', 'N/record'],
    (log, runtime, task, format, file, search, render, record) => {
        let currentScript = runtime.getCurrentScript();

        const FTL_TEMPLATE_NAME = "./TS_FTL_EC_ATS_XML.ftl";
        const FOLDER_ID = "506"; //Path => SuiteBundles : Bundle 419588 : com.netsuite.psgsbe : src : cs : field_change_handler
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
            log.error("identificacionInformante", identificacionInformante);
            setIdentificacionInformante(jsonBuilded, identificacionInformante);

            let comprasReembolso = getFileContentByName(atsFiles, "COMPRAS REMBOLSO");
            comprasReembolso.pop();
            log.error("comprasReembolso", comprasReembolso);

            let formasPago = getFileContentByName(atsFiles, "FORMA DE PAGO");
            formasPago.pop();
            log.error("formasPago", formasPago);

            let comprasRetenciones = getFileContentByName(atsFiles, "COMPRAS RETENCIONES");
            comprasRetenciones.pop();
            log.error("comprasRetenciones", comprasRetenciones);

            let comprasDetalladas = getFileContentByName(atsFiles, "COMPRAS DETALLADAS");
            comprasDetalladas.pop();
            log.error("comprasDetalladas", comprasDetalladas);

            setComprasDetalladas(jsonBuilded, comprasDetalladas, comprasReembolso, formasPago, comprasRetenciones);

            let ventasClientes = getFileContentByName(atsFiles, "VENTAS DE CLIENTES");
            ventasClientes.pop();
            log.error("ventasClientes", ventasClientes);

            /*
            let formasPagoVenta = getFileContentByName(atsFiles, "FORMA DE PAGO VENTAS");
            formasPagoVenta.pop();
            log.error("formasPagoVenta", formasPagoVenta);*/

            setVentasDetalladas(jsonBuilded, ventasClientes/*, formasPagoVenta*/);

            let ventasEstablecimiento = getFileContentByName(atsFiles, "VENTAS POR ESTABLECIMIENTO");
            ventasEstablecimiento.pop();
            log.error("ventasEstablecimiento", ventasEstablecimiento);

            setVentasPorEstablecimiento(jsonBuilded, ventasEstablecimiento);

            let ventasExportaciones = getFileContentByName(atsFiles, "VENTAS DE EXPORTACIONES");
            ventasExportaciones.pop();
            log.error("ventasExportaciones", ventasExportaciones);

            setVentasDeExportación(jsonBuilded, ventasExportaciones);

            let comprobantesAnulados = getFileContentByName(atsFiles, "ANULADOS");
            comprobantesAnulados.pop();
            log.error("comprobantesAnulados", comprobantesAnulados);

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

                let air = getComprasRetenciones(codigoCompra, comprasRetenciones);
                detalleCompras.air = air;

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
                detalleAnulados.puntoEmision = comprobanteAnulado[2];
                detalleAnulados.secuencialInicio = comprobanteAnulado[3];
                detalleAnulados.secuencialFin = comprobanteAnulado[4];
                detalleAnulados.autorizacion = comprobanteAnulado[5];

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
            return "";
        }

        const getFormasPagoVenta = (formasPago) => {
            let formasDePago = [];
            formasPago = formasPago.split(',');
            for (let i = 0; i < formasPago.length; i++) {
                formasDePago.push(formasPago[i]);
            }
            return formasDePago;
        }

        const getComprasRetenciones = (codigoCompra, comprasRetenciones) => {
            let air = [];
            for (let i = 0; i < comprasRetenciones.length; i++) {
                let compraRetencion = comprasRetenciones[i].split('|');
                if (compraRetencion[0] == codigoCompra) {
                    let detalleAir = {};
                    detalleAir.codRetAir = compraRetencion[1]; //& 2 Concepto de Retención en la fuente de Impuesto a la Renta 
                    detalleAir.baseImpAir = Number(compraRetencion[2]) || 0; //& 3 Base Imponible Renta
                    detalleAir.porcentajeAir = compraRetencion[3]; //& 4 Porcentaje de Retención en la fuente de Impuesto a la Renta
                    detalleAir.valRetAir = Number(compraRetencion[4]) || 0; //& 5 Monto de retención de Renta
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