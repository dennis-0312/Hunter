/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/task'],
    /**
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{dialog} dialog
 */
    (log, query, record, runtime, search, dialog, task) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let eventType = scriptContext.type;
            //log.error('eventType', eventType);
            let objRecord = scriptContext.newRecord;
            let form = scriptContext.form;
            form.clientScriptModulePath = './TS_CS_E_Payment_Reverse.js';
            if (eventType === scriptContext.UserEventType.EDIT && objRecord.getValue('custrecord_ts_epmt_prepmt_status') == 'Generado') {
                form.addButton({
                    id: 'custpage_ts_epayment_reverse',
                    label: 'Liberar Pagos',
                    functionName: 'verifyProccessing("testparam")'
                });
            }

            if (eventType === scriptContext.UserEventType.VIEW && objRecord.getValue('custrecord_ts_epmt_prepmt_status') == 'Liberando...') {
                log.error('Init', 'Init Proccess');
                submitProccessingScheduleTask(objRecord.id);
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => { }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => { }


        const submitProccessingScheduleTask = (lotid) => {
            try {
                let scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_ts_ss_e_payment_reverse_pay',
                    deploymentId: 'customdeploy_ts_ss_e_payment_reverse_pay',
                    params: {
                        custscript_ts_ss_epmt_ppr_paymentlot_id: lotid,
                    }
                });
                scriptTask.submit();
            } catch (error) {
                try {
                    record.submitFields({
                        type: 'customrecord_ts_epmt_payment_batch',
                        id: lotid,
                        values: {
                            'custrecord_ts_epmt_prepmt_status': 'Generado'
                        }
                    })
                } catch (error) { }
            }
        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
