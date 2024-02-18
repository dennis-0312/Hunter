/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
*/

define(["N/log", "N/search", "N/record", "N/config", "N/format"],
    function (log, search, record, config, format) {
        const OK_STATUS_CODE = 200;
        const ERROR_STATUS_CODE = 500;
        const DOCUMENT_TYPE = ["01", "04", "05", "06", "03", "07"];
        const AUTHORIZATION_MESSAGE = "AUTORIZADO";

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
                if (!requestBody.numeroDocumento) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo numeroDocumento");
                if (!requestBody.numeroAutorizacion) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo numeroAutorizacion");
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

        const validarFecha = (fecha) => {
            const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
            return regex.test(fecha);
        }

        const validarHora = (hora) => {
            const regex = /^([01]\d|2[0-3]):[0-5]\d$/;
            return regex.test(hora);
        }

        const getRecordTypeBy = (tipoDocumento) => {
            if (tipoDocumento == "01" || tipoDocumento == "05") {
                return record.Type.INVOICE;
            } else if (tipoDocumento == "04") {
                return record.Type.CREDIT_MEMO;
            } else if (tipoDocumento == "06") {
                return record.Type.ITEM_FULFILLMENT;
            } else if (tipoDocumento == "03") {
                return record.Type.VENDOR_BILL;
            } else if (tipoDocumento == "07") {
                return record.Type.VENDOR_CREDIT;
            }
            return "";
        }

        const getTransactionsForAuthorization = (tipoDocumento) => {
            let recordType = getRecordTypeBy(tipoDocumento);
            log.error("recordType", { recordType, tipoDocumento });
            let transactionSearch = search.create({
                type: "transaction",
                filters: [
                    ["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante", "is", tipoDocumento],
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
                    ["custbodyts_ec_num_autorizacion", "isempty", ""]
                ],
                columns: [
                    "tranid"
                ]
            });
            if (tipoDocumento == "03") {
                let cxpSerieFilter = search.createFilter({
                    name: 'custbody_ts_ec_serie_doc_cxp',
                    operator: search.Operator.ISEMPTY
                });
                transactionSearch.filters.push(cxpSerieFilter);
            }
            var searchResultCount = transactionSearch.runPaged().count;
            log.error("searchResultCount", searchResultCount);
            let pageData = transactionSearch.runPaged({
                pageSize: 1000
            });

            let results = [];
            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    let columns = result.columns;
                    let document = {
                        idNetsuite: result.id,
                        numeroDocumento: result.getValue(columns[0])
                    }
                    results.push(document);
                });
            });
            return results;
        }

        const updateTransaction = (requestBody) => {
            log.error("Request", requestBody);
            let transaction = getTransactionByDocumentNumber(requestBody.numeroDocumento);
            let fechaAutorizacion = getDate(requestBody.fecha, requestBody.hora);
            log.error("fechaAutorizacion", fechaAutorizacion + ' - ' + transaction.id);
            let id = record.submitFields({
                type: transaction.recordtype,
                id: transaction.id,
                values: {
                    "custbodyts_ec_num_autorizacion": requestBody.numeroAutorizacion,
                    "custbody_ec_fecha_autorizacion": fechaAutorizacion,
                    "custbody_ec_estado_de_autorizaci": AUTHORIZATION_MESSAGE
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
            /*
            log.error("getDate", { day, month, year, hour, minute, timeZone });
            let dateTime = new Date(year, month, day, hour, minute);
            let gmtMinusFiveDate = new Date(dateTime.toLocaleString("en-US", { timeZone: "GMT-5" }));
            log.error("gmtMinusFiveDate", gmtMinusFiveDate);
            let dateFormat = getDateFormat(dateTime, timeZone);
            let zonaHorariaOffset = gmtMinusFiveDate.getTimezoneOffset();
            log.error("error", "La zona horaria actual tiene un desfase de " + zonaHorariaOffset / 60 + " minutos respecto a UTC.");
            */
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
                    ["numbertext", "is", numeroDocumento]
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
            put
        }
    }
)

