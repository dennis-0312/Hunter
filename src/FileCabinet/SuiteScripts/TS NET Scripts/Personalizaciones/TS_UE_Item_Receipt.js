/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log',
    'N/record',
    'N/search',
    'N/ui/serverWidget',
    "N/format",
    "N/task",
    "N/query"
], (log, record, search, serverWidget, format, task, query) => {
    const beforeSubmit = (scriptContext) => {
        const objRecord = scriptContext.newRecord;
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            log.debug('EVENT', 'CREATE');
            log.debug('RecordType', objRecord.getValue('baserecordtype'));
            if (objRecord.getValue('baserecordtype') == 'itemreceipt') {
                objRecord.setValue('custbody_ht_ir_recepcionado', 0);
                objRecord.setValue('custbody_ht_ir_no_recepcionado', 0);
            }
        }

        if (scriptContext.type === scriptContext.UserEventType.EDIT) {
            log.debug('EVENT', 'EDIT');
            log.debug('RecordType', objRecord.getValue('baserecordtype'));
            if (objRecord.getValue('baserecordtype') == 'itemreceipt') {
                objRecord.setValue('custbody_ht_ir_recepcionado', 0);
                objRecord.setValue('custbody_ht_ir_no_recepcionado', 0);
            }
        }

        // if (scriptContext.type === scriptContext.UserEventType.XEDIT) {
        //     log.debug('EVENT', 'XEDIT')
        // }
    }

    const afterSubmit = (scriptContext) => {
        let recepcionado = true;
        let norecepcionado = true;
        try {
            const objRecord = scriptContext.newRecord;
            let tranID = objRecord.id;
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                // let queue = task.create({
                //     taskType: task.TaskType.MAP_REDUCE,
                //     scriptId: 'customscript_ts_mr_item_receipt',
                //     deploymentId: 'customdeploy_ts_mr_item_receipt'
                // });
                // queue.params = {
                //     custscript_my_map_reduce_array: tranID
                // };
                // queue.submit();
                let queue = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_ts_ss_item_receipt',
                    deploymentId: 'customdeploy_ts_ss_item_receipt'
                });
                queue.params = {
                    custscript_ht_param_itemreceiptid: tranID
                };
                let token = queue.submit();
                log.debug('token', token);
            } else if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                // let queue = task.create({
                //     taskType: task.TaskType.MAP_REDUCE,
                //     scriptId: 'customscript_ts_mr_item_receipt',
                //     deploymentId: 'customdeploy_ts_mr_item_receipt'
                // });
                // queue.params = {
                //     custscript_my_map_reduce_array: tranID
                // };
                // queue.submit();
                let queue = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_ts_ss_item_receipt',
                    deploymentId: 'customdeploy_ts_ss_item_receipt'
                });
                queue.params = {
                    custscript_ht_param_itemreceiptid: tranID
                };
                let token = queue.submit();
                log.debug('token', token);
            }
        } catch (error) {
            log.error('Error beforeSubmit', error);
        }
    }

    return {
        /*  beforeLoad: beforeLoad, 1433*/
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
