/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @returns {string}
 */

define(['N/log', '../Controllers/controllerCobertura'], function (log, controllerCobertura) {

    function onRequest(context) {
        var action = context.action;
        var idusuario = context.idusuario;
        var idcobertura = context.idcobertura;
        var resultado = '';

        try {
            log.debug({ 'title': 'action', 'details': action });
            log.debug({ 'title': 'idusuario', 'details': idusuario });
            log.debug({ 'title': 'idcobertura', 'details': idcobertura });

            // Asocia cada acción con la función correspondiente de tu ruta
            switch (action) {
                case 'test':
                    resultado = controllerCobertura.actualizaEstadoPlataforma(idcobertura, idusuario);
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