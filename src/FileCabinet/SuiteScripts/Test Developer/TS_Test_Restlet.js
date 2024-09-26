/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => { 
            return "NetSuite Oracle";
        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => { }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            // let data = [
            //     [
            //         "PLC.:GKU-0397 MOT.:GA16779986V CHA.:3N1DB41S4ZK024605 MAR.:NISSAN TIP.:AUTO MOD.:SENTRA COL.:PLATEADO",
            //         "C-EC-1300571054 LUIS S PLAZA VERA",
            //         "4",
            //         "MIGRADO",
            //         "TERRESTRE",
            //         "VEHICULO",
            //         "VIGENTE",
            //         "MAN",
            //         "GKU-0397",
            //         "GA16779986V                   ",
            //         "3N1DB41S4ZK024605             ",
            //         "NISSAN",
            //         "SENTRA",
            //         "AUTO",
            //         "NO DEFINIDO",
            //         "AUTOMATICA",
            //         "PLATEADO",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "SIN VERSION",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "NO",
            //         "5",
            //         "",
            //         "0",
            //         "1999",
            //         "15515.82",
            //         "0",
            //         "",
            //         "P-6382    ",
            //         "001 PERSONALES",
            //         "",
            //         "Guayaquil",
            //         "0990201595001 ANGLO AUTOMOTRIZ S.A.",
            //         "0991311637001 LATINA SEGUROS Y REASEGUROS C.A.",
            //         "9980000000004 SIN BANCO / FINANCIERA",
            //         "",
            //         "",
            //         "",
            //         "",
            //         "",
            //         "Empresa principal : CARSEG",
            //         "C-EC-1300571054"
            //     ],
            //     [
            //         "PLC.:GKU-0397 MOT.:GA16779986V CHA.:3N1DB41S4ZK024605 MAR.:NISSAN TIP.:AUTO MOD.:SENTRA COL.:PLATEADO",
            //         "C-EC-1300571054 LUIS S PLAZA VERA",
            //         "4",
            //         "MIGRADO",
            //         "TERRESTRE",
            //         "VEHICULO",
            //         "VIGENTE",
            //         "MAN",
            //         "GKU-0397",
            //         "GA16779986V                   ",
            //         "3N1DB41S4ZK024605             ",
            //         "NISSAN",
            //         "SENTRA",
            //         "AUTO",
            //         "NO DEFINIDO",
            //         "AUTOMATICA",
            //         "PLATEADO",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "SIN VERSION",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "NO DEFINIDO",
            //         "NO",
            //         "5",
            //         "",
            //         "0",
            //         "1999",
            //         "15515.82",
            //         "0",
            //         "",
            //         "P-6382    ",
            //         "001 PERSONALES",
            //         "",
            //         "Guayaquil",
            //         "0990201595001 ANGLO AUTOMOTRIZ S.A.",
            //         "0991311637001 LATINA SEGUROS Y REASEGUROS C.A.",
            //         "9980000000004 SIN BANCO / FINANCIERA",
            //         "",
            //         "",
            //         "",
            //         "",
            //         "",
            //         "Empresa principal : CARSEG",
            //         "C-EC-1300571054"
            //     ]
            // ]

            let data = requestBody.bienes;
            log.debug('requestBody', data);
            for (var i = 0; i < data.length; i++) {
                var subArray = data[i];
                log.debug('Subarreglo ' + (i + 1), subArray);
                log.debug('=======================================================')
                for (var j = 0; j < subArray.length; j++) {
                    log.debug(j, subArray[j]);
                }
            }
            return "Ok"
        }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => { }

        return { get,/*, put, */post/*, delete: doDelete*/ }

    });
