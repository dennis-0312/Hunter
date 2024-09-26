/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => { }

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
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type != scriptContext.UserEventType.CREATE || scriptContext.type != scriptContext.UserEventType.EDIT) {
                try {
                    let depositSearchObj = search.create({
                        type: "deposit",
                        settings: [{ "name": "consolidationtype", "value": "NONE" }],
                        filters:
                            [
                                ["type", "anyof", "Deposit"],
                                "AND",
                                ["internalid", "anyof", scriptContext.newRecord.id],
                                "AND",
                                ["mainline", "is", "F"],
                                "AND",
                                ["appliedtotransaction.memomain", "isnotempty", ""]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "Internal ID" }),
                                search.createColumn({ name: "memomain", join: "appliedToTransaction", label: "Memo (Main)" })
                            ]
                    });
                    var searchResultCount = depositSearchObj.runPaged().count;
                    log.debug("depositSearchObj result count", searchResultCount);
                    let objResults = depositSearchObj.run().getRange({ start: 0, end: 1 });
                    log.debug('objResults', objResults);
                    let glosa = objResults[0].getValue({ name: "memomain", join: "appliedToTransaction", label: "Memo (Main)" });
                    record.submitFields({
                        type: scriptContext.newRecord.type,
                        id: scriptContext.newRecord.id,
                        values: { 'memo': glosa },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        }
                    });
                } catch (error) {
                    log.error('Error', error);
                }
            }
        }

        return { /*beforeLoad, beforeSubmit,*/ afterSubmit }

    });
