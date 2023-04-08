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
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/task',
    'N/runtime',
    'N/query',
    '../controller/TS_CM_Controller',
], (log, search, record, task, runtime, query, _controller) => {
    //const scriptObj = runtime.getCurrentScript();
    const HT_ASIENTO_PROVISION_COSTOS_SEARCH = 'customsearch_ht_asiento_prov_costos'; //HT Asiento Provisión Costos DETALLE - PRODUCCION
    const HT_ASIENTO_PROVISION_COSTOS_TOTAL_SEARCH = 'customsearch_ht_asiento_prov_costos_suma'; //HT Asiento Provisión Costos CONSOLIDADO - PRODUCCION
    let recordId = '';

    const getInputData = () => {
        // recordId = scriptObj.getParameter({ name: 'custscript_ae_param_recordid' });
        //fileId = scriptObj.getParameter({ name: 'custscript_ae_param_fileid' });
        //log.debug('Params', fileId);
        // let json = new Array();
        // let searchResult;
        // let division = 0.0;
        // let laps = 0.0;
        // let start = 0;
        // let end = 1000;
        // let size = 1000;
        //let total = 0;
        try {
            // const objTotal = search.load({ id: HT_ASIENTO_PROVISION_COSTOS_TOTAL_SEARCH });
            // const searchResultCount = objTotal.runPaged().count;
            // //const date = new Date('2023-2-1'); //!Elegir fecha
            // const date = new Date();
            // const ultimoDia = new Date(date.getFullYear(), date.getMonth(), 0);
            // log.debug('ultimoDiaTimeZona', ultimoDia);
            // //log.debug('ultimoDia', ultimoDia.getDate() + '/' + (ultimoDia.getMonth() + 1) + '/' + ultimoDia.getFullYear());
            // if (searchResultCount > 0) {
            //     let objResults = objTotal.run().getRange({ start: 0, end: 1 });
            //     const total = objResults[0].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
            //     const nota = 'Provisión Enero'
            //     let journal = createJournal(ultimoDia, total, nota);
            //     //let journal = 125255896;
            //     log.debug('journal', journal);

            //     const objSearch = search.load({ id: HT_ASIENTO_PROVISION_COSTOS_SEARCH });
            //     const searchResultCount = objSearch.runPaged().count;
            //     log.debug('Count', searchResultCount);
            //     division = searchResultCount / size;
            //     laps = Math.round(division);
            //     if (division > laps) {
            //         laps = laps + 1
            //     }

            //     for (let i = 1; i <= laps; i++) {
            //         if (i != laps) {
            //             searchResult = objSearch.run().getRange({ start: start, end: end });
            //         } else {
            //             searchResult = objSearch.run().getRange({ start: start, end: searchResultCount });
            //         }
            //         //log.debug('Count', searchResult);
            //         for (let j in searchResult) {
            //             const internalid = searchResult[j].getValue({ name: "internalid", summary: "GROUP" });
            //             const item = searchResult[j].getValue({ name: "item", summary: "GROUP" });
            //             const provision = searchResult[j].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
            //             //total += parseFloat(provision);
            //             json.push([internalid, item, provision, journal]);
            //         }
            //         start = start + size;
            //         end = end + size;
            //     }

            //     //log.debug('JSON', json);
            //     //log.debug('Total', total);
            //     return json;
            // } else {
            //     return json;
            // }

            const json = _controller.getCostProvision();
            if (json == 0)
                json = new Array();

            return json;
        } catch (error) {
            log.error('Error-getInputData', error);
        }
    }

    const map = (context) => {
        //registro = scriptObj.getParameter({ name: 'custscript_ae_param_registro' });
        try {
            //log.debug('Context-map-Length', context.value);

            context.write({
                key: context.key,
                value: context.value
            });
        } catch (error) {
            log.error('Error-map', error);
        }
    }

    const reduce = (context) => {
        //registro = scriptObj.getParameter({ name: 'custscript_ae_param_registro' });
        try {
            //log.debug('Context-reduce', JSON.parse(context.values));

            context.write({
                key: context.key,
                value: context.values
            });
        } catch (error) {
            log.error('Error-reduce', error);
        }
    }

    const summarize = (context) => {
        let records = '';
        try {
            //recordId = scriptObj.getParameter({ name: 'custscript_ae_param_recordid' });

            context.output.iterator().each((key, value) => {
                records = JSON.parse(JSON.parse(value));
                log.debug('Records', 'internalid: ' + records[0] + ' - item: ' + records[1] + ' - provision: ' + records[2] + ' - journal: ' + records[3]);

                return true;
            });
        } catch (error) {
            log.error('Error-summarize', error);
        }
    }


    const createJournal = (fecha, provision, nota) => {
        const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });

        objRecord.setValue({ fieldId: 'trandate', value: new Date(fecha) });
        //objRecord.setValue({ fieldId: 'currency', value: context.currency });
        objRecord.setValue({ fieldId: 'memo', value: nota });
        objRecord.setValue({ fieldId: 'subsidiary', value: 2 });

        objRecord.selectNewLine({ sublistId: 'line' });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 1237, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: provision, ignoreFieldChange: false });
        // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
        // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
        objRecord.commitLine({ sublistId: 'line' });

        objRecord.selectNewLine({ sublistId: 'line' });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 798, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: provision, ignoreFieldChange: false });
        // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
        // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
        objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
        objRecord.commitLine({ sublistId: 'line' });

        const newJournal = objRecord.save({ ignoreMandatoryFields: false });

        return newJournal
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
