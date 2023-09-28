/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/ui/serverWidget'], function (record, serverWidget) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var currentRecord = context.newRecord;
            //var form = context.form;
            var field = currentRecord.getField('custrecord_ht_ot_termometro').isDisplay = false;

        }

    }


    return {
        beforeLoad: beforeLoad
    };
});
