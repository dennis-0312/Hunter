/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/runtime'], function (log, record, runtime) {

    function execute(context) {
        var parametroRecuperado = JSON.parse(runtime.getCurrentScript().getParameter({ name: 'custscript_parametrorecuperado' }));
        log.debug('Request', parametroRecuperado);
        for (let i in parametroRecuperado) {
            let registroOV = record.load({
                type: record.Type.SALES_ORDER,
                id: parametroRecuperado[i].id
            });
            registroOV.setValue({
                fieldId: 'shipcomplete',
                value: true
            });
            let guardar = registroOV.save();
            log.debug('Registro', guardar);
        }
    }
    return {
        execute: execute
    }
});
