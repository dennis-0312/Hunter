/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/https', 'N/log', 'N/query', 'N/record', 'N/runtime', 'N/task', 'N/format', 'N/search'],
    /**
 * @param{https} https
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{task} task
 * @param{format} format
 * @param{search} search
 */
    (https, log, query, record, runtime, task, format, search) => {
        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            const objContext = runtime.getCurrentScript();
            try {
                let itemID = objContext.getParameter({ name: 'custscript_ht_param_itemreceiptid' });
                let arrTempID = JSON.parse(itemID);
                log.debug('arrTempID', arrTempID + ' - ' + 'Procesando...');
                let objRecord_item = record.load({ type: 'itemreceipt', id: arrTempID, isDynamic: false });
                let linecount = objRecord_item.getLineCount({ sublistId: 'item' })
                //log.debug('linecount', linecount);
                let tranDate = objRecord_item.getValue('trandate');
                tranDate = format.parse({ value: tranDate, type: format.Type.DATE });
                let arrayInventoryNumber = [];
                let continuar = true;
                let status = 0;
                for (let i = 0; i < linecount; i++) {
                    if (continuar == true) {
                        let item = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        let typeItem = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_ai_componentechaser', line: i });
                        //log.debug('typeItem', typeItem);
                        let location = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                        let invDetailRec = objRecord_item.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                        //log.debug('item', item);
                        //log.debug('invDetailRec', invDetailRec);
                        let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });
                        // log.debug('inventoryAssignmentLines', inventoryAssignmentLines);
                        for (let j = 0; j < inventoryAssignmentLines; j++) {
                            let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                            //log.debug('remainingUsage CONSUMIDO', j + ' - ' + remainingUsage);
                            if (remainingUsage > 200) {
                                let inventorynumber = invDetailRec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line: j });
                                //log.debug('inventorynumber', inventorynumber);
                                let idInventoryNumber = getInventoryNumber(inventorynumber);
                                if (typeItem == 1) {
                                    let sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_record_detallechaserdisp WHERE name = ?';
                                    let resultSet = query.runSuiteQL({ query: sql, params: [inventorynumber] });
                                    let results = resultSet.asMappedResults()[0]['cantidad'];
                                    //log.debug('CantidadDISP', results);
                                    if (results == 0) {
                                        let chaser = record.create({ type: 'customrecord_ht_record_detallechaserdisp', isDynamic: true });
                                        chaser.setValue('name', inventorynumber);
                                        chaser.setValue('custrecord_ht_dd_dispositivo', item);
                                        chaser.setValue('custrecord_ht_dd_item', idInventoryNumber);
                                        chaser.setValue('custrecord_ht_dd_recepcionarticulo', arrTempID);
                                        chaser.setValue('custrecord_ht_dd_fechaingreso', tranDate);
                                        chaser.setValue('custrecord_ht_dd_ubicacioningreso', location);
                                        chaser.setValue('isinactive', true);
                                        let newChaser = chaser.save();
                                        log.debug('newChaser', newChaser);
                                    }
                                } else if (typeItem == 2) {
                                    let sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_record_detallechasersim WHERE name = ?';
                                    let resultSet = query.runSuiteQL({ query: sql, params: [inventorynumber] });
                                    let results = resultSet.asMappedResults()[0]['cantidad'];
                                    //log.debug('CantidadSIM', results);
                                    if (results == 0) {
                                        let simCard = record.create({ type: 'customrecord_ht_record_detallechasersim', isDynamic: true });
                                        simCard.setValue('name', inventorynumber);
                                        simCard.setValue('custrecord_ht_ds_simcard', item);
                                        simCard.setValue('custrecord_ht_ds_serie', idInventoryNumber);
                                        simCard.setValue('custrecord_ht_ds_estado', 4);
                                        simCard.setValue('custrecord_ht_ds_recepcionarticulo', arrTempID);
                                        simCard.setValue('custrecord_ht_ds_ubicacioningreso', location);
                                        simCard.setValue('custrecord_ht_ds_fechaingreso', tranDate);
                                        simCard.setValue('isinactive', true);
                                        simCard.save();
                                    }
                                } else if (typeItem == 3) {
                                    let sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_record_detallechaslojack WHERE name = ?';
                                    let resultSet = query.runSuiteQL({ query: sql, params: [inventorynumber] });
                                    let results = resultSet.asMappedResults()[0]['cantidad'];
                                    //log.debug('CantidadLoc', results);
                                    if (results == 0) {
                                        let lojack = record.create({ type: 'customrecord_ht_record_detallechaslojack', isDynamic: true });
                                        lojack.setValue('name', inventorynumber);
                                        lojack.setValue('custrecord_ht_cl_lojack', item);
                                        lojack.setValue('custrecord_ht_cl_seriebox', idInventoryNumber);
                                        lojack.setValue('custrecord_ht_cl_recepcionarticulo', arrTempID);
                                        lojack.setValue('custrecord_ht_cl_ubicacioningreso', location);
                                        lojack.setValue('custrecord_ht_cl_fechaingreso', tranDate);
                                        lojack.setValue('isinactive', true);
                                        lojack.save();
                                    }
                                }
                            } else {
                                continuar = false;
                                break;
                            }
                        }
                    } else {
                        break;
                    }
                }

                let message = '';
                if (continuar == true) {
                    status = 1
                    message = 'Exitoso';
                } else {
                    message = 'Por completar';
                }
                record.submitFields({
                    type: 'itemreceipt',
                    id: JSON.parse(itemID),
                    values: {
                        'custbody_ht_ir_recepcionado': status,
                        'custbody_ht_ir_resultado_recepcion': message
                    }
                });

                let sql = 'SELECT id FROM transaction WHERE custbody_ht_ir_no_recepcionado = 0 AND custbody_ht_ir_recepcionado = 0 ORDER BY id ASC FETCH FIRST 1 ROWS ONLY';
                let resultSet = query.runSuiteQL({ query: sql });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    log.debug('Results', results[0]['id']);
                    // let queue = task.create({
                    //     taskType: task.TaskType.MAP_REDUCE,
                    //     scriptId: 'customscript_ts_mr_item_receipt',
                    //     deploymentId: 'customdeploy_ts_mr_item_receipt'
                    // });
                    // queue.params = {
                    //     custscript_my_map_reduce_array: results[0]['id']
                    // };
                    // queue.submit();

                    let queue = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_ts_ss_item_receipt',
                        deploymentId: 'customdeploy_ts_ss_item_receipt'
                    });
                    queue.params = {
                        custscript_ht_param_itemreceiptid: results[0]['id']
                    };
                    queue.submit();
                }
            } catch (error) {
                log.error('Error-getInputData', error);
                record.submitFields({
                    type: 'itemreceipt',
                    id: arrTempID,
                    values: {
                        'custbody_ht_ir_no_recepcionado': 1,
                        'custbody_ht_ir_resultado_recepcion': error.message
                    }
                });
            }
        }

        function getInventoryNumber(inventorynumber) {
            try {
                var busqueda = search.create({
                    type: "inventorynumber",
                    filters:
                        [
                            ["inventorynumber", "is", inventorynumber]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 1);
                var idInventoryNumber = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        idInventoryNumber = result.getValue(busqueda.columns[0]);
                        return true;
                    });
                }
                return idInventoryNumber;
            } catch (e) {
                log.error('Error en getInventoryNumber', e);
            }
        }

        return { execute }

    });
