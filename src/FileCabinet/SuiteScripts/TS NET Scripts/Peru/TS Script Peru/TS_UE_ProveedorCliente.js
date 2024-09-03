/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/task'], function (search, record, runtime, task) {

    const CUSTOMER = 'customer';
    const VENDOR = 'vendor';
    const EMPLEADO = 'employee'

    function beforeLoad(context) {
        try { } catch (e) {
            log.error('Error en beforeLoad', e);
        }
    }

    function beforeSubmit(context) {
        try { } catch (e) {
            log.error('Error en beforeSubmit', e);
        }
    }

    function afterSubmit(context) {
        const eventType = context.type;
        const oldObjRecord = context.oldRecord;
        log.error("eventType afterSubmit", eventType);
        var entityIndicator = '';
        try {
            const objRecord = context.newRecord;
            var recordId = objRecord.id;
            var recordLoad = '';
            recordLoad = record.load({ type: objRecord.type, id: recordId, isDynamic: false });
            var newEntityId = '';
            if (eventType == context.UserEventType.COPY || eventType == context.UserEventType.CREATE || eventType == context.UserEventType.EDIT) {
                if (objRecord.type == CUSTOMER || objRecord.type == VENDOR || objRecord.type == EMPLEADO) {
                    if (objRecord.type == CUSTOMER) {
                        entityIndicator = 'C-PE'
                    }
                    if (objRecord.type == VENDOR) {
                        entityIndicator = 'P-PE'
                    }
                    if (objRecord.type == EMPLEADO) {
                        entityIndicator = 'E-PE'
                    }
                    var documentNumber = recordLoad.getValue('custentity_pe_document_number');
                    newEntityId = entityIndicator + "-" + documentNumber;
                }
            }
            record.submitFields({ type: objRecord.type, id: recordId, values: { entityid: newEntityId } });
            log.error("END afterSubmit", "END afterSubmit");
        } catch (e) {
            log.error('Error afterSubmit', e);

        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});