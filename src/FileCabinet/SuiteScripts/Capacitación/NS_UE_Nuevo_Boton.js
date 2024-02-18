/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([], function() {

    function beforeLoad(context) {
        let formulario = context.form;
        formulario.clientScriptFileId = 25;
        formulario.addButton({ 
            id: 'custpage_buttonid', 
            label: 'Nuevo Botón',
            functionName: 'enviarOV'
        });
    }

    return {
        beforeLoad: beforeLoad
    }
});
