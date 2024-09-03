/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @returns {string}
 */

define(['N/log', '../Controllers/controllerBien'], function (log, controllerBien) {

    function onRequest(context) {
        var action = context.action;
        var clienteIdInterno = context.clienteIdInterno;
        var bienIdInterno = context.bienIdInterno;
        var resultado = '';

        try {
            log.debug({ 'title': 'action', 'details': action });
            log.debug({ 'title': 'clienteIdInterno', 'details': clienteIdInterno });
            log.debug({ 'title': 'bienIdInterno', 'details': bienIdInterno });

            // Asocia cada acción con la función correspondiente de tu ruta
            switch (action) {
                case 'test':
                    resultado = controllerBien.actualizaBienPlataforma(clienteIdInterno, bienIdInterno);
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