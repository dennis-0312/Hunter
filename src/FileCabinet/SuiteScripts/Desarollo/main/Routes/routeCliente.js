/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @returns {string}
 */

define(['N/log', '../Controllers/controllerCliente'], function (log, controllerCliente) {

    function onRequest(context) {
        var action = context.action;
        var clienteIdInterno = context.clienteIdInterno;
        var resultado = '';

        try {
            log.debug({ 'title': 'action', 'details': action });
            log.debug({ 'title': 'action', 'details': clienteIdInterno });

            // Asocia cada acción con la función correspondiente de tu ruta
            switch (action) {
                case 'test':
                    resultado = controllerCliente.actualizaClientePlataforma(clienteIdInterno);
                    break;
                default:
                    // Manejo para acciones no reconocidas
                    break;
            }
        } catch (error) {
            log.error('Error en onRequest', error);
        }

        return resultado;

    }

    return {
        post: onRequest
    };

});