/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
*/

define([
    "N/log",
    "N/search",
    "N/record",
    "N/config",
    "N/format",
    'N/runtime'
],
    function (log, search, record, config, format, runtime) {
        const OK_STATUS_CODE = 200;
        const ERROR_STATUS_CODE = 500;
        const DOCUMENT_TYPE = ["01", "04", "05", "06", "03", "07", "41"];
        const AUTHORIZATION_MESSAGE = "AUTORIZADO";
        const DOCUMENTO_RETENCION = "07";

        const get = (requestBody) => {
            try {
                log.error("Get", requestBody);
                let results = [];

                if (!requestBody.tipoDocumento || DOCUMENT_TYPE.indexOf(requestBody.tipoDocumento) == -1) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el parametro tipoDocumento");
                results = getTransactionsForAuthorization(requestBody.tipoDocumento);
                log.error("results", results);
                return new GetResponse(OK_STATUS_CODE, results);
            } catch (error) {
                log.error("error", error);
                return new CustomError(ERROR_STATUS_CODE, "ERROR", "Ocurrió un error inesperado");
            }
        }

        const put = (requestBody) => {
            try {
                log.error("Put", requestBody)
                if (!requestBody.idinternoDocumento) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo idinternoDocumento");
                if (!requestBody.numeroAutorizacion) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo numeroAutorizacion");
                /*
                if (!requestBody.numeroAutorizacionRetencion) {
                    //return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo numeroAutorizacionRetencion");
                } else {
                    if (!requestBody.estadoAutorizacionRetencion) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para estadoAutorizacionRetencion");
                }
                */
                if (!requestBody.fecha) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo fecha");
                if (!requestBody.hora) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo hora");
                if (!validarFecha(requestBody.fecha)) return new CustomError(ERROR_STATUS_CODE, "ERROR", "El formato correcto para la fecha es DD/MM/YYYY");
                if (!validarHora(requestBody.hora)) return new CustomError(ERROR_STATUS_CODE, "ERROR", "El formato correcto para la hora es HH:MM");

                let id = updateTransaction(requestBody);
                return new PutResponse(OK_STATUS_CODE, id);
            } catch (error) {
                log.error("error", error);
                return new CustomError(ERROR_STATUS_CODE, "ERROR", "Ocurrió un error inesperado");
            }
        }

        const post = (scriptContext) => {
            try {
                //let estadoDoc = scriptContext.idEstadoDocElect;
                let estadoFel = scriptContext.idEstadoDocElect;
                let id = scriptContext.idNetsuite;
                let tipoDocumento = scriptContext.tipoDocumento;
                let tipoDocumentoFilter = new Array();
                //if (estadoDoc == '8') {
                if (estadoFel == 'ERROR') {
                    let tipoTansac = '';
                    let idVendor;
                    var userID = runtime.getCurrentUser().id;

                    if (tipoDocumento == DOCUMENTO_RETENCION) {
                        tipoDocumentoFilter = ["custbodyec_tipo_de_documento_retencion.custrecordts_ec_cod_tipo_comprobante", "is", tipoDocumento]
                    } else {
                        tipoDocumentoFilter = ["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante", "is", tipoDocumento]
                    }

                    let transactionSearch = search.create({
                        type: "transaction",
                        filters: [
                            tipoDocumentoFilter,
                            "AND",
                            ["internalid", "is", id],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["voided", "is", "F"],
                            "AND",
                            ["posting", "is", "T"],
                            "AND",
                            ["custbody_psg_ei_status", "is", "7"]//* UPDATE =======================================================
                        ],
                        columns: [
                            search.createColumn({ name: "recordType" }),
                            search.createColumn({ name: "internalid", join: "vendor" })
                        ]
                    });

                    let searchResultCount = transactionSearch.runPaged().count;
                    if (searchResultCount != 0) {
                        const searchResult = transactionSearch.run().getRange({ start: 0, end: 1 });
                        tipoTansac = searchResult[0].getValue(transactionSearch.columns[0]);
                        idVendor = searchResult[0].getValue(transactionSearch.columns[1]);
                    } else {
                        return new CustomError(ERROR_STATUS_CODE, "ERROR", "No se encontro la transaccion con estado enviado o el tipo de documento");
                    }

                    //log.error('estadoDoc', estadoDoc)
                    let newTransaccion = record.load({ type: tipoTansac, id: id, isDynamic: true });
                    //newTransaccion.setValue({ fieldId: 'custbody_psg_ei_status', value: estadoDoc, ignoreFieldChange: true });

                    if (tipoDocumento == '07') {
                        newTransaccion.setValue({ fieldId: 'custbody_ec_estado_de_autorizaci', value: estadoFel });
                    } else {
                        newTransaccion.setValue({ fieldId: 'custbody_ts_estado_fel', value: estadoFel });
                    }

                    newTransaccion.save({ ignoreMandatoryFields: true, enableSourcing: false });

                    var customRecord = record.create({
                        type: 'customrecord_psg_ei_audit_trail',
                        isDynamic: true
                    });

                    customRecord.setValue('custrecord_psg_ei_audit_transaction', id);
                    customRecord.setValue('custrecord_psg_ei_audit_event', 8);
                    customRecord.setValue('custrecord_psg_ei_audit_entity', idVendor);
                    customRecord.setValue('custrecord_psg_ei_audit_owner', userID);
                    customRecord.setValue('custrecord_psg_ei_audit_details', scriptContext.detalle);
                    customRecord.save();

                }

                return new PutResponse(OK_STATUS_CODE, id);
            } catch (error) {
                log.error('error', error)
                return new CustomError(ERROR_STATUS_CODE, "ERROR", "Ocurrió un error inesperado");
            }
        }

        const validarFecha = (fecha) => {
            const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
            return regex.test(fecha);
        }

        const validarHora = (hora) => {
            const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
            return regex.test(hora);
        }

        const getRecordTypeBy = (tipoDocumento) => {
            if (tipoDocumento == "01" || tipoDocumento == "05" || tipoDocumento == "41") {
                return record.Type.INVOICE;
            } else if (tipoDocumento == "04") {
                return record.Type.CREDIT_MEMO;
            } else if (tipoDocumento == "06") {
                return record.Type.ITEM_FULFILLMENT;
            } else if (tipoDocumento == "03" || tipoDocumento == "07") {
                return record.Type.VENDOR_BILL;
            }
            // else if (tipoDocumento == "07") {
            //     return record.Type.VENDOR_CREDIT;
            // }
            return "";
        }

        const getTransactionsForAuthorization = (tipoDocumento) => {
            let tipoDocumentoFilter = new Array();
            let numAutorizationFilter = new Array();
            let recordType = getRecordTypeBy(tipoDocumento);
            log.error("recordType", { recordType, tipoDocumento });
            if (tipoDocumento == DOCUMENTO_RETENCION) {
                tipoDocumentoFilter = ["custbodyec_tipo_de_documento_retencion.custrecordts_ec_cod_tipo_comprobante", "is", tipoDocumento]
                numAutorizationFilter = ["custbodyts_ec_cod_wht_autorization", "isempty", ""]
            } else {
                tipoDocumentoFilter = ["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante", "is", tipoDocumento]
                numAutorizationFilter = ["custbodyts_ec_num_autorizacion", "isempty", ""]
            }
            log.error('Filter', tipoDocumentoFilter)
            let transactionSearch = search.create({
                type: "transaction",
                filters: [
                    tipoDocumentoFilter,
                    "AND",
                    ["recordtype", "is", recordType],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["voided", "is", "F"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    ["custbody_psg_ei_status", "is", "7"],//* UPDATE =======================================================
                    "AND",
                    numAutorizationFilter
                ],
                columns: [
                    search.createColumn({ name: "tranid", label: "Document Number" }),
                    search.createColumn({ name: "custbody_ec_serie_cxc_retencion", label: "EC - SERIE CXC RETENCIÓN" }),
                    search.createColumn({ name: "custbody_ts_ec_preimpreso_retencion", label: "EC - PREIMPRESO RETENCION" }),
                    search.createColumn({ name: "internalid", join: "vendor" }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{vendor.vatregnumber}",
                        label: "Fórmula (texto)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{vendor.isperson}",
                        label: "Fórmula (texto)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{vendor.companyname}",
                        label: "Fórmula (texto)"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{vendor.altname}",
                        label: "Fórmula (texto)"
                    })

                ]
            });
            if (tipoDocumento == "03") {
                let cxpSerieFilter = search.createFilter({ name: 'custbody_ts_ec_serie_doc_cxp', operator: search.Operator.ISEMPTY });
                transactionSearch.filters.push(cxpSerieFilter);
            }

            if (tipoDocumento == "07") {
                let autorizaReten = search.createFilter({ name: 'custbodyts_ec_cod_wht_autorization', operator: search.Operator.ISEMPTY });
                transactionSearch.filters.push(autorizaReten);
                let estadoAutoriza = search.createFilter({ name: 'custbody_ec_estado_de_autorizaci', operator: search.Operator.IS, values: "SIN DECLARAR" });
                transactionSearch.filters.push(estadoAutoriza);
                let tipoDocReten = search.createFilter({ name: 'custbodyec_tipo_de_documento_retencion', operator: search.Operator.ISNOTEMPTY });
                transactionSearch.filters.push(tipoDocReten);
            }
            var searchResultCount = transactionSearch.runPaged().count;
            log.error("searchResultCount", searchResultCount);
            let pageData = transactionSearch.runPaged({ pageSize: 1000 });

            let results = new Array();
            let nroDoc = ''
            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    let columns = result.columns;
                    if (tipoDocumento == DOCUMENTO_RETENCION) {
                        nroDoc = result.getText(columns[1]) + result.getValue(columns[2])
                    } else {
                        nroDoc = result.getValue(columns[0])
                    }
                    // nroDoc = result.getValue(columns[0])
                    // try {
                    //     nroRet = result.getText(columns[1]) + result.getValue(columns[2])
                    // } catch (error) { }

                    var entidad = result.getValue(columns[3])
                    var ruc = result.getValue(columns[4])
                    var ispersona = result.getValue(columns[5])
                    var nombreProvee = '';
                    if (ispersona == true || ispersona == 'T') {
                        nombreProvee = result.getValue(columns[7])
                    } else {
                        nombreProvee = result.getValue(columns[6])
                    }


                    let document = {
                        idNetsuite: result.id,
                        numeroDocumento: nroDoc,
                        idProveedor: entidad,
                        nombreProveedor: nombreProvee,
                        numeroDocumentoProveedor: ruc,
                        // numeroRetencion: nroRet
                    }
                    results.push(document);
                });
            });
            return results;
        }

        const updateTransaction = (requestBody) => {
            log.error("Request", requestBody);
            let transaction = getTransactionByDocumentNumber(requestBody.idinternoDocumento);
            let fechaAutorizacion = getDate(requestBody.fecha, requestBody.hora);
            log.error("fechaAutorizacion", fechaAutorizacion + ' - ' + transaction.id);
            let id = record.submitFields({
                type: transaction.recordtype,
                id: transaction.id,
                values: {
                    "custbodyts_ec_num_autorizacion": requestBody.numeroAutorizacion,
                    "custbody_ec_fecha_autorizacion": fechaAutorizacion,
                    //"custbody_ec_estado_de_autorizaci": AUTHORIZATION_MESSAGE,
                    "custbody_ei_pdf_response_principal": requestBody.pdfPrincipal,
                    "custbody_ei_xml_response_principal": requestBody.xmlPrincipal,
                    //"custbody_ei_pdf_response": requestBody.pdfRetencion,
                    //"custbody_ei_xml_response": requestBody.xmlRetencion,
                    //"custbodyts_ec_cod_wht_autorization": requestBody.numeroAutorizacionRetencion,
                    //"custbody_ec_fecha_hora_autorizacion": fechaAutorizacion,
                    //"custbody_ec_estado_de_autorizaci": requestBody.estadoAutorizacionRetencion
                    "custbody_ts_estado_fel": AUTHORIZATION_MESSAGE
                }
            });
            return id;
        }

        const getDate = (fecha, hora) => {
            let dateParts = fecha.split('/');
            let hourParts = hora.split(':');
            let day = parseInt(dateParts[0], 10);
            let month = parseInt(dateParts[1], 10) - 1;
            let year = parseInt(dateParts[2], 10);
            let hour = parseInt(hourParts[0], 10);
            let minute = parseInt(hourParts[1], 10);

            let timeZone = getTimeZone();
            let dateTime = new Date(year, month, day, hour, minute);
            let zonaHorariaOffset = dateTime.getTimezoneOffset() / 60;
            log.error("zonaHorariaOffset", zonaHorariaOffset);
            let hoursDiference = zonaHorariaOffset - 5;
            log.error("hoursDiference", hoursDiference);
            dateTime = new Date(year, month, day, hour - hoursDiference, minute);
            return dateTime;
        }

        const getTimeZone = () => {
            let conf = config.load({ type: config.Type.USER_PREFERENCES });
            let timeZone = conf.getValue({ fieldId: 'TIMEZONE' });
            return timeZone;
        }

        function getDateFormat(date, timeZone) {
            log.error("getDateFormat", { date, timeZone });
            let timeZoneDateString = format.format({ value: date, type: format.Type.DATETIME, timezone: timeZone });
            log.error("timeZoneDateString", timeZoneDateString);
            let timeZoneDateObject = format.parse({ value: timeZoneDateString, type: format.Type.DATE, timezone: timeZone });
            log.error("timeZoneDateObject", timeZoneDateObject);
            return timeZoneDateObject;
        }

        const getTransactionByDocumentNumber = (numeroDocumento) => {
            let result = {
                id: "",
                recordtype: "",
            }
            var resultSearch = search.create({
                type: "transaction",
                filters: [
                    ["mainline", "is", "T"],
                    "AND",
                    ["voided", "is", "F"],
                    "AND",
                    ["posting", "is", "T"],
                    "AND",
                    // ["numbertext", "is", numeroDocumento]
                    ["internalid", "anyof", numeroDocumento]
                ],
                columns: [
                    "recordtype"
                ]
            }).run().getRange(0, 1000);
            if (resultSearch.length) {
                result.id = resultSearch[0].id;
                result.recordtype = resultSearch[0].getValue("recordtype");
            }
            return result;
        }

        class GetResponse {
            constructor(status, results) {
                this.status = status;
                this.count = results.length;
                this.results = results;
            }
        }

        class PutResponse {
            constructor(status, id) {
                this.status = status;
                if (id) this.id = id;
            }
        }

        class CustomError {
            constructor(status, name, message) {
                this.status = status;
                this.error = {
                    name,
                    message
                };
            }
        }

        return {
            get,
            put,
            post
        }
    }
)