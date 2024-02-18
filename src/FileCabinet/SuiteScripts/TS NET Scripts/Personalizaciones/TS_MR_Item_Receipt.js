/*********************************************************************************************************************************************
This script for Integration (Script para recepción de ) 
/*********************************************************************************************************************************************
File Name: TS_MR_Asiento_Provision_Costos.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 13/01/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@NModuleScope Public
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/task',
    'N/runtime',
    'N/query',
    "N/format"
], (log, search, record, task, runtime, query, format) => {
    const objContext = runtime.getCurrentScript();
    const getInputData = () => {
        try {
            let itemID = objContext.getParameter({ name: 'custscript_my_map_reduce_array' });
            let arrTempID = JSON.parse(itemID);
            log.debug('arrTempID', arrTempID + ' - ' + 'Procesando...');
            let objRecord_item = record.load({ type: 'itemreceipt', id: arrTempID, isDynamic: false });
            let linecount = objRecord_item.getLineCount({ sublistId: 'item' })
            log.debug('linecount', linecount);
            let tranDate = objRecord_item.getValue('trandate');
            //log.debug('tranDate', tranDate);
            tranDate = format.parse({ value: tranDate, type: format.Type.DATE });
            log.debug('tranDate', tranDate);
            let arrayInventoryNumber = [];
            for (let i = 0; i < linecount; i++) {
                // let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                // log.debug('remainingUsage Línea CONSUMIDO', i + ' - ' + remainingUsage);
                // if (remainingUsage < 30) {
                //     return false;
                // }
                let item = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                let typeItem = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_ai_componentechaser', line: i });
                //log.debug('typeItem', typeItem);
                let location = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                let invDetailRec = objRecord_item.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                //log.debug('item', item);
                //log.debug('invDetailRec', invDetailRec);
                let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });
                //log.debug('inventoryAssignmentLines', inventoryAssignmentLines);
                for (let j = 0; j < inventoryAssignmentLines; j++) {
                    let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                    log.debug('remainingUsage CONSUMIDO', j + ' - ' + remainingUsage);
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
                }
            }
            //log.debug('Object', objRecord_item)
            return JSON.parse(objRecord_item);
        } catch (error) {
            log.error('Error-getInputData', error);
            // record.submitFields({
            //     type: 'itemreceipt',
            //     id: arrTempID,
            //     values: {
            //         'custbody_ht_ir_no_recepcionado': 1,
            //         'custbody_ht_ir_resultado_recepcion': error.message
            //     }
            // });
        }
    }

    const map = (context) => {
        let itemID = objContext.getParameter({ name: 'custscript_my_map_reduce_array' });
        try {
            log.debug('MAP', context);
            let json = new Array();
            let objRecord_item = JSON.parse(context.value)
            let linecount = objRecord_item.getLineCount({ sublistId: 'item' })
            for (let i = 0; i < linecount; i++) {
                let item = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                json.push(item);
            }
            // var key = context.key;
            // var value = context.value;
            context.write({
                key: context.key,
                value: itemID
            });
        } catch (error) {
            log.error('Error-map', error);
        }
    }

    const reduce = (context) => {
        let itemID = objContext.getParameter({ name: 'custscript_my_map_reduce_array' });
        try {
            log.debug('REDUCE', context);
            let internid = context.values[0];
            context.write({
                key: context.key,
                value: itemID
            });
        } catch (error) {
            log.error('Error-reduce', error);
        }
    }

    const summarize = (context) => {
        let records = '';
        log.debug('summarize', context);
        let itemID = objContext.getParameter({ name: 'custscript_my_map_reduce_array' });
        try {
            record.submitFields({
                type: 'itemreceipt',
                id: JSON.parse(itemID),
                values: {
                    'custbody_ht_ir_recepcionado': 1,
                    'custbody_ht_ir_resultado_recepcion': 'Exitoso'
                }
            });

            let sql = 'SELECT id FROM transaction WHERE custbody_ht_ir_no_recepcionado = 0 AND custbody_ht_ir_recepcionado = 0 ORDER BY id ASC FETCH FIRST 1 ROWS ONLY';
            let resultSet = query.runSuiteQL({ query: sql });
            let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
            if (results.length > 0) {
                // log.debug('Results', results[0]['id']);
                // let queue = task.create({
                //     taskType: task.TaskType.MAP_REDUCE,
                //     scriptId: 'customscript_ts_mr_item_receipt',
                //     deploymentId: 'customdeploy_ts_mr_item_receipt'
                // });
                // queue.params = {
                //     custscript_my_map_reduce_array: results[0]['id']
                // };
                // queue.submit();
            }
        } catch (error) {
            log.error('Error-summarize', error);
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

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 13/01/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/
