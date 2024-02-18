/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/search', 'N/runtime'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search, runtime) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            let scriptObj = runtime.getCurrentScript();
            try {
                let accountSearchObj = search.create({
                    type: "savedsearch",
                    filters:
                        [
                            ["access", "anyof", "PRIVATE"],
                            "AND",
                            ["internalid", "noneof", "1509"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "title", sort: search.Sort.ASC, label: "Title" })
                        ]
                });
                let searchResultCount = accountSearchObj.runPaged().count;
                log.debug("accountSearchObj result count", searchResultCount);
                if (searchResultCount > 0) {
                    let objResults = accountSearchObj.run().getRange({ start: 0, end: 2 });
                    for (let i in objResults) {
                        if (scriptObj.getRemainingUsage() < 200) {
                            log.error('Supera memoria');
                            break;
                        }
                        let id = objResults[i].getValue({ name: "internalid" });
                        record.submitFields({
                            type: 'savedsearch',
                            id: id,
                            values: {
                                ispublic: true
                            },
                        })
                        // record.save({ type: 'savedsearch', id: id });
                        log.debug('Registro Actualizado', id);
                    }
                }
                // accountSearchObj.run().each((result) => {return true});
            } catch (error) {
                log.error('Error', error);
            }
        }

        return { execute }

    });
