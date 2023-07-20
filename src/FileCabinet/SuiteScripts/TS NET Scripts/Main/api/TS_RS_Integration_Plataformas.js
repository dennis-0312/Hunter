
/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_RS_Integration_Plataformas.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/search', 'N/record', 'N/query', 'N/https', 'N/task', 'N/file'], (log, search, record, query, htpps, task, file) => {
    const SAVED_CSV_IMPORTS = 341;
    const HT_COBERTURA_RECORD = 'customrecord_ht_co_cobertura';

    const _get = (context) => {
        try {
            log.debug('ConextGet', context);
            //!PRUEBA DEPOSITO CLIENTE
            // let paymentmethod = context.paymentmethod;
            // let customer = context.customer;
            // let fecha = context.fecha;
            // let deposit = record.create({ type: record.Type.CUSTOMER_DEPOSIT, isDynamic: true });
            // deposit.setValue({ fieldId: 'customer', value: customer });
            // deposit.setValue({ fieldId: 'undepfunds', value: 'T' });
            // deposit.setValue({ fieldId: 'trandate', value: new Date(fecha) })
            // deposit.setValue({ fieldId: 'payment', value: 100 });
            // deposit.setValue({ fieldId: 'paymentoption', value: paymentmethod });
            // let response = deposit.save({ ignoreMandatoryFields: true });
            // let objSearch = search.load({ id: 'customsearch802' });
            // let result = objSearch.run().getRange({ start: 0, end: 1000 });
            // for (let i in result) {
            //     let internalid = result[i].id;
            //     record.delete({ type: 'customrecord_pe_update_coa_sum_inv', id: internalid });
            // }


            // let objSearch2 = search.load({ id: 'customsearch803' });
            // let result2 = objSearch2.run().getRange({ start: 0, end: 1000 });
            // for (let i in result2) {
            //     let internalid = result2[i].id;
            //     record.submitFields({
            //         type: record.Type.ACCOUNT,
            //         id: internalid,
            //         values: {
            //             'issummary': 'F',
            //             'isinactive': 'F',
            //         }
            //     });
            // }
            // return { 'ConextGet': response };


            //!INTEGRACION EVOLUTION

            // const scriptTask = task.create({ taskType: task.TaskType.CSV_IMPORT });
            // scriptTask.mappingId = SAVED_CSV_IMPORTS;
            // let csv = file.load({ id: context.csvfile });
            // scriptTask.importFile = csv;
            // let csvImportTaskId = scriptTask.submit();
            // log.debug('csvImportTaskId', csvImportTaskId);

            // let csvTaskStatus = task.checkStatus({
            //     taskId: csvImportTaskId
            // });

            // log.debug('csvTaskStatus', csvTaskStatus);
            // return { 'ConextGet': csvTaskStatus.status };
        } catch (error) {
            log.error('Error', error);
            return error;
        }
    }

    const _post = (scriptContext) => {
        log.debug('ConextPost', scriptContext);
        let objRecord = record.create({ type: HT_COBERTURA_RECORD, isDynamic: true });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: scriptContext.bien });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_propietario', value: scriptContext.propietario });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: 1 });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturainicial', value: new Date(scriptContext.start) });
        // objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturafinal', value: new Date(scriptContext.end) });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_producto', value: scriptContext.producto });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_numeroserieproducto', value: scriptContext.serieproducto });
        objRecord.setValue({ fieldId: 'custrecord_ht_co_estado', value: scriptContext.estado });
        let response = objRecord.save();
        log.debug('Response', response);
        return { 'Conect': 'ConectPost' };
    }

    return {
        get: _get,
        post: _post
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 12/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/