/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['N/log'], function (log) {

    function doTheMagic(operand1, operand2) {
        log.debug('LogPL', 'Hola');
        return operand1 + operand2;
    }

    function otroMetodo() {
        return 'Llamado desde plugin';
    }

    return {
        doTheMagic: doTheMagic,
        otroMetodo: otroMetodo
    }
});




