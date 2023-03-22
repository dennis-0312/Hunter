/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/log'],
    /**
 * @param{log} log
 */
    (log) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
            try {
                let numero = requestParams.numero
                var suma = 0;
                var residuo = 0;
                var pri = false;
                var pub = false;
                var nat = false;
                var numeroProvincias = 22;
                var modulo = 11;
                let message = '';

                /* Verifico que el campo no contenga letras */
                var ok = 1;
                for (i = 0; i < numero.length && ok == 1; i++) {
                    var n = parseInt(numero.charAt(i));
                    if (isNaN(n)) ok = 0;
                }
                if (ok == 0) {
                    message = 'No puede ingresar caracteres en el número.';
                    log.debug('Debug1', message);
                    return message;
                }

                if (numero.length < 10) {
                    message = 'El número ingresado no es válido.';
                    log.debug('Debug2', message);
                    return message;
                }

                /* Los primeros dos digitos corresponden al codigo de la provincia */
                provincia = numero.substr(0, 2);
                if (provincia < 1 || provincia > numeroProvincias) {
                    message = 'El código de la provincia (dos primeros dígitos) es inválido.';
                    log.debug('Debug3', message);
                    return message;
                }

                /* Aqui almacenamos los digitos de la cedula en variables. */
                d1 = numero.substr(0, 1);
                d2 = numero.substr(1, 1);
                d3 = numero.substr(2, 1);
                d4 = numero.substr(3, 1);
                d5 = numero.substr(4, 1);
                d6 = numero.substr(5, 1);
                d7 = numero.substr(6, 1);
                d8 = numero.substr(7, 1);
                d9 = numero.substr(8, 1);
                d10 = numero.substr(9, 1);

                /* El tercer digito es: */
                /* 9 para sociedades privadas y extranjeros   */
                /* 6 para sociedades publicas */
                /* menor que 6 (0,1,2,3,4,5) para personas naturales */

                if (d3 == 7 || d3 == 8) {
                    message = 'El tercer dígito ingresado es inválido.';
                    log.debug('Debug4', message);
                    return message;
                }

                /* Solo para personas naturales (modulo 10) */
                if (d3 < 6) {
                    nat = true;
                    p1 = d1 * 2; if (p1 >= 10) p1 -= 9;
                    p2 = d2 * 1; if (p2 >= 10) p2 -= 9;
                    p3 = d3 * 2; if (p3 >= 10) p3 -= 9;
                    p4 = d4 * 1; if (p4 >= 10) p4 -= 9;
                    p5 = d5 * 2; if (p5 >= 10) p5 -= 9;
                    p6 = d6 * 1; if (p6 >= 10) p6 -= 9;
                    p7 = d7 * 2; if (p7 >= 10) p7 -= 9;
                    p8 = d8 * 1; if (p8 >= 10) p8 -= 9;
                    p9 = d9 * 2; if (p9 >= 10) p9 -= 9;
                    modulo = 10;
                }

                /* Solo para sociedades publicas (modulo 11) */
                /* Aqui el digito verficador esta en la posicion 9, en las otras 2 en la pos. 10 */
                else if (d3 == 6) {
                    pub = true;
                    p1 = d1 * 3;
                    p2 = d2 * 2;
                    p3 = d3 * 7;
                    p4 = d4 * 6;
                    p5 = d5 * 5;
                    p6 = d6 * 4;
                    p7 = d7 * 3;
                    p8 = d8 * 2;
                    p9 = 0;
                }

                /* Solo para entidades privadas (modulo 11) */
                else if (d3 == 9) {
                    pri = true;
                    p1 = d1 * 4;
                    p2 = d2 * 3;
                    p3 = d3 * 2;
                    p4 = d4 * 7;
                    p5 = d5 * 6;
                    p6 = d6 * 5;
                    p7 = d7 * 4;
                    p8 = d8 * 3;
                    p9 = d9 * 2;
                }

                suma = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                residuo = suma % modulo;

                /* Si residuo=0, dig.ver.=0, caso contrario 10 - residuo*/
                digitoVerificador = residuo == 0 ? 0 : modulo - residuo;

                /* ahora comparamos el elemento de la posicion 10 con el dig. ver.*/
                if (pub == true) {
                    if (digitoVerificador != d9) {
                        message = 'El ruc de la empresa del sector público es incorrecto.';
                        log.debug('Debug5', message);
                        return message;
                    }
                    /* El ruc de las empresas del sector publico terminan con 0001*/
                    if (numero.substr(9, 4) != '0001') {
                        message = 'El ruc de la empresa del sector público debe terminar con 0001.';
                        log.debug('Debug6', message);
                        return message;
                    }
                }
                else if (pri == true) {
                    if (digitoVerificador != d10) {
                        message = 'El ruc de la empresa del sector privado es incorrecto.';
                        log.debug('Debug7', message);
                        return message;
                    }
                    if (numero.substr(10, 3) != '001') {
                        message = 'El ruc de la empresa del sector privado debe terminar con 001.';
                        log.debug('Debug8', message);
                        return message;
                    }
                }

                else if (nat == true) {
                    if (digitoVerificador != d10) {
                        message = 'El número de cédula de la persona natural es incorrecto.';
                        log.debug('Debug9', message);
                        return message;
                    }
                    if (numero.length > 10 && numero.substr(10, 3) != '001') {
                        message = 'El ruc de la persona natural debe terminar con 001.';
                        log.debug('Debug10', message);
                        return message;
                    }
                }

                //console.log('Código verificador:', numero.split('')[9]);
                return numero.split('')[9];
            } catch (error) {
                log.error('Error', error);
                return error.message;
            }
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
        const put = (requestBody) => {

        }

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

        }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => {

        }

        return { get, put, post, delete: doDelete }

    });
