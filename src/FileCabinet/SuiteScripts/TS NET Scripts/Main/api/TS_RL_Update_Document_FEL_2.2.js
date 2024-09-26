/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
*/

define([
    "N/log",
    "N/search",
    "N/record",
    "N/config",
    "N/format"
],
function (log, search, record, config, format){

    const OK_STATUS_CODE = 200;
    const ERROR_STATUS_CODE = 500;
    const DOCUMENT_TYPE = ["01", "04", "05", "06", "03", "07", "41"];
    const AUTHORIZATION_MESSAGE = "AUTORIZADO";
    const DOCUMENTO_RETENCION = "07";

    const put = (requestBody) => {
        try {
            log.error("Put", requestBody)
            if (!requestBody.idinternoDocumento) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo idinternoDocumento");
            //if (!requestBody.numeroAutorizacion) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo numeroAutorizacion");
            if (!requestBody.numeroAutorizacionRetencion) {
                //return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para el campo numeroAutorizacionRetencion");
            } else {
                if (!requestBody.estadoAutorizacionRetencion) return new CustomError(ERROR_STATUS_CODE, "ERROR", "Introduzca un valor correcto para estadoAutorizacionRetencion");
            }
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

    const updateTransaction = (requestBody) => {
        log.error("Request", requestBody);
        let transaction = getTransactionByDocumentNumber(requestBody.idinternoDocumento);
        let fechaAutorizacion = getDate(requestBody.fecha, requestBody.hora);
        log.error("fechaAutorizacion", fechaAutorizacion + ' - ' + transaction.id);
        let id = record.submitFields({
            type: transaction.recordtype,
            id: transaction.id,
            values: {
                //"custbodyts_ec_num_autorizacion": requestBody.numeroAutorizacion,
                //"custbody_ec_fecha_autorizacion": fechaAutorizacion, // Pricipal
                //"custbody_ec_estado_de_autorizaci": AUTHORIZATION_MESSAGE,
                //"custbody_ei_pdf_response_principal": requestBody.pdfPrincipal,
                //"custbody_ei_xml_response_principal": requestBody.xmlPrincipal,
                "custbody_ei_pdf_response": requestBody.pdfRetencion,
                "custbody_ei_xml_response": requestBody.xmlRetencion,
                "custbodyts_ec_cod_wht_autorization": requestBody.numeroAutorizacionRetencion,
                "custbody_ec_fecha_hora_autorizacion": fechaAutorizacion, //retencion
                "custbody_ec_estado_de_autorizaci": requestBody.estadoAutorizacionRetencion
            }
        });
        return id;
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
        put
    }

})