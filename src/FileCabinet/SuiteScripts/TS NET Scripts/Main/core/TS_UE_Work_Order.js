/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log',
    'N/query',
    'N/record',
    'N/search',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages'
],
    /**
 * @param{log} log
 * @param{query} query
 * @param{record} record
 */
    (log, query, record, search, _controller, _constant, _errorMessage) => {
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
            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
                let item = 0;
                let transaction = 0;
                let ordenTrabajo = '';
                const currentRecord = scriptContext.newRecord;
                log.error('Entry', 'Entry 1')
                let objRecord = record.load({ type: _constant.Transaction.ASSEMBLY_ORDER, id: currentRecord.id, isDynamic: true });
                log.error('Entry', objRecord.getValue('createdfrom') + ' - ' + objRecord.getValue('createdfrom').length)
                if (objRecord.getValue('createdfrom').length > 0 && objRecord.getValue('custbody_ht_ce_ordentrabajo').length == 0) {
                    log.error('Entry', 'Entry 2')
                    try {
                        transaction = objRecord.getValue('createdfrom');
                        item = objRecord.getValue('assemblyitem');
                        log.error('Entry1', transaction + ' - ' + item);
                        let sql = 'SELECT * FROM customrecord_ht_record_ordentrabajo ' +
                            'WHERE custrecord_ht_ot_orden_servicio = ? AND custrecord_ht_ot_item = ?'
                        let resultSet = query.runSuiteQL({ query: sql, params: [transaction, item] });
                        let results = resultSet.asMappedResults();
                        log.error('results', results)

                        let objSearch = search.create({
                            type: "customrecord_ht_record_ordentrabajo",
                            filters:
                                [
                                    ["custrecord_ht_ot_orden_servicio", "anyof", transaction],
                                    "AND",
                                    ["custrecord_ht_ot_item", "anyof", item]
                                ],
                            columns:
                                [
                                    'internalid'
                                ]
                        });
                        let searchResultCount = objSearch.runPaged().count;
                        log.error("objSearch result count", searchResultCount);
                        if (searchResultCount > 0) {
                            const searchResult = objSearch.run().getRange({ start: 0, end: 1 });
                            //subsidiary = searchResult[0].getValue(searchLoad.columns[0]);
                            ordenTrabajo = record.submitFields({
                                type: _constant.customRecord.ORDEN_TRABAJO,
                                id: searchResult[0].getValue(objSearch.columns[0]),
                                values: {
                                    custrecord_ht_ot_ordenfabricacion: currentRecord.id
                                },
                                options: { enablesourcing: true }
                            });
                            log.error('InsertWorkOrder', 'Se asignó en la Orden de Trabajo ' + ordenTrabajo + ' la Orden de Fabricación ' + currentRecord.id);
                        }
                        objRecord.setValue('custbody_ht_ce_ordentrabajo', ordenTrabajo);
                        objRecord.save();
                    } catch (error) {
                        log.error('Error-Update-WorkOrder', error);
                    }
                } else {
                    log.error('InsertWorkOrder', 'La orden de fabración ya tiene asignada una OT');
                }
            }
        }
        return { beforeLoad, beforeSubmit, afterSubmit }

    });
