/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/https', 'N/record','N/ui/dialog'], (log, https, record,dialog) => {
    function beforeSubmit(context) {
        if (context.type === context.UserEventType.EDIT) {
            var currentRecord = context.newRecord;
            var campoIncompleto = currentRecord.getValue({
                fieldId: 'custrecord11'
            });

            if (!campoIncompleto) {
                var message = 'La transacción no puede ser guardada debido a que el campo está incompleto.';
                var options = {
                  title: 'Alerta',
                  message: message
                };
                
                // Mostrar la alerta al usuario
                dialog.alert(options);
        
                // Cancelar el guardado de la transacción
                context.abort = true;
                context.cancelled = true;
            }
        }
    }

    return {
        //beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    }
});