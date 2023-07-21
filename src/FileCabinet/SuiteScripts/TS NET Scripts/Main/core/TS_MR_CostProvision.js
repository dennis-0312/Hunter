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
    'N/query'
], (log, search, record, task, runtime, query) => {
   
    function getInputData () {
        try {
            //var myArray = context.parameters.custscript_my_map_reduce_array;
            var objContext = runtime.getCurrentScript();
            var itemID = objContext.getParameter({
                name: 'custscript_my_map_reduce_array'
              });
              var arrTempID = JSON.parse(itemID);
              log.debug('arrTempID',arrTempID);
            return arrTempID;
        } catch (error) {
            log.error('Error-getInputData', error);
        }
    }

    function map(context) {
        try {
            var key = context.key;
            var value = context.value;
            log.debug('value',value);
            let idInventoryNumber = getInventoryNumber(value);
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
        map: map,
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
