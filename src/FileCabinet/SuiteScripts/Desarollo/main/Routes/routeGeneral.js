/**
 * @NApiVersion 2.1
 * @returns {string}
 */

define(['N/log', '../Controllers/controllerGeneral'], function (log, controllerGeneral) {
    function onRequest(customer, action) {

        try {
            switch (action) {
                case 'test':
                    resultado = controllerGeneral.getIdentificaPlataforma();
                    break;
                default:
                    // Manejo para acciones no reconocidas
                    break;
            }
        } catch (error) {
            log.error('Error', error);
        }

    }

    return {
        onRequest
    };

});