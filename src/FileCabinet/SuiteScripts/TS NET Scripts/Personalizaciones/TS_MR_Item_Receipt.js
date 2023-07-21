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
    'N/query',"N/format"
], (log, search, record, task, runtime, query, format) => {
   
    function getInputData () {
        try {
            //var myArray = context.parameters.custscript_my_map_reduce_array;
            var objContext = runtime.getCurrentScript();
            var itemID = objContext.getParameter({
                name: 'custscript_my_map_reduce_array'
              });
              var arrTempID = JSON.parse(itemID);
              log.debug('arrTempID',arrTempID);
              let objRecord_item = record.load({ type: 'itemreceipt', id: arrTempID, isDynamic: false });
              let linecount = objRecord_item.getLineCount({ sublistId: 'item' })
              log.debug('linecount',linecount);
              let tranDate = objRecord_item.getValue('trandate');
              log.debug('tranDate', tranDate);
                tranDate = format.parse({
                    value: tranDate,
                    type: format.Type.DATE
                });
                log.debug('tranDate', tranDate);
                let arrayInventoryNumber = [];
                for (let i = 0; i < linecount; i++) {
                    let item = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    let typeItem = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_ai_componentechaser', line: i });
                    log.debug('typeItem', typeItem);
                    let location = objRecord_item.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                    let invDetailRec = objRecord_item.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                    log.debug('item', item);
                    log.debug('invDetailRec', invDetailRec);
                    let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });
                    log.debug('inventoryAssignmentLines', inventoryAssignmentLines);
                    
                    for (let j = 0; j < inventoryAssignmentLines; j++) {
                        let inventorynumber = invDetailRec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line: j });
                        log.debug('inventorynumber', inventorynumber);
                        let idInventoryNumber = getInventoryNumber(inventorynumber);
                        /* log.debug('idInventoryNumber', idInventoryNumber); 
                        arrayInventoryNumber.push(inventorynumber); */
                        if (typeItem == 1) {
                            var chaser = record.create({
                                type: 'customrecord_ht_record_detallechaserdisp',
                                isDynamic: true
                            });
                            chaser.setValue('name', inventorynumber);
                            chaser.setValue('custrecord_ht_dd_dispositivo', item);
                            chaser.setValue('custrecord_ht_dd_item', idInventoryNumber);
                            chaser.setValue('custrecord_ht_dd_recepcionarticulo', arrTempID);
                            chaser.setValue('custrecord_ht_dd_fechaingreso', tranDate);
                            chaser.setValue('custrecord_ht_dd_ubicacioningreso', location);
                            chaser.setValue('isinactive', true);
                            //chaser.setValue('custrecord_ht_ds_estado', 4);
                            let newChaser = chaser.save();
                            log.debug('newChaser',newChaser);
                        } else if (typeItem == 2) {
                            var simCard = record.create({
                                type: 'customrecord_ht_record_detallechasersim',
                                isDynamic: true
                            });
                            simCard.setValue('name', inventorynumber);
                            simCard.setValue('custrecord_ht_ds_simcard', item);
                            simCard.setValue('custrecord_ht_ds_serie', idInventoryNumber);
                            simCard.setValue('custrecord_ht_ds_estado', 4);
                            simCard.setValue('custrecord_ht_ds_recepcionarticulo', arrTempID);
                            simCard.setValue('custrecord_ht_ds_ubicacioningreso', location);
                            simCard.setValue('custrecord_ht_ds_fechaingreso', tranDate);
                            simCard.setValue('isinactive', true);
                            simCard.save();
                        } else if (typeItem == 3) {
                            var lojack = record.create({
                                type: 'customrecord_ht_record_detallechaslojack',
                                isDynamic: true
                            });
                            lojack.setValue('name', inventorynumber);
                            lojack.setValue('custrecord_ht_cl_lojack', item);
                            lojack.setValue('custrecord_ht_cl_seriebox', idInventoryNumber);
                            lojack.setValue('custrecord_ht_cl_recepcionarticulo', arrTempID);
                            lojack.setValue('custrecord_ht_cl_ubicacioningreso', location);
                            lojack.setValue('custrecord_ht_cl_fechaingreso', tranDate);
                            lojack.setValue('isinactive', true);

                            //lojack.setValue('custrecord_ht_cl_estado', 5);
                            lojack.save();
                        } 
                    }
                   
                    //log.debug('arrayinventorynumber',arrayInventoryNumber.length);
                }
            //return arrayInventoryNumber;
        } catch (error) {
            log.error('Error-getInputData', error);
        }
    }

    function map(context) {
        try {
            var key = context.key;
            var value = context.value;
            log.debug('value',value);
            //let idInventoryNumber = getInventoryNumber(value);
            /* var myArray = context.parameters.custscript_my_map_reduce_array;
            log.debug('myArray',myArray); */
        } catch (error) {
            log.error('Error-map', error);
        }
    }

    const reduce = (context) => {
        try {
        
        } catch (error) {
            log.error('Error-reduce', error);
        }
    }

    const summarize = (context) => {
        let records = '';
        try {
            
            
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
        //map: map,
        //reduce: reduce,
        //summarize: summarize
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
