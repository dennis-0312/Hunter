
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
define([
    'N/log',
    'N/search',
    'N/record',
    'N/query',
    'N/https',
    'N/task',
    'N/file'
], (log, search, record, query, htpps, task, file) => {
    const SAVED_CSV_IMPORTS = 341;
    const HT_COBERTURA_RECORD = 'customrecord_ht_co_cobertura';
    const HT_DETALLE_COBERTURA = 'customrecord_ht_ct_cobertura_transaction';
    const ORDEN_TRABAJO = 'CUSTOMRECORD_HT_RECORD_ORDENTRABAJO';
    const CHEQUEADO = 2;
    const PROCESANDO = 4;

    const _get = (scriptContext) => {
        try {
            log.debug('ConextGet', scriptContext);
            let recordLoad = record.load({ type: ORDEN_TRABAJO, id: scriptContext.myFirstParameter, isDynamic: true, defaultValues: true });
            recordLoad.setValue({ fieldId: 'custrecord_ht_ot_estado', value: CHEQUEADO });
            updateRecord = recordLoad.save();
            return updateRecord;

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
        try {
            if (scriptContext.estado == 1) {
                let response;
                let historial;
                if (scriptContext.cobertura == 0) {
                    let objRecord = record.create({ type: HT_COBERTURA_RECORD, isDynamic: true });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: scriptContext.bien });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_propietario', value: scriptContext.propietario });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: scriptContext.estadoCobertura });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturainicial', value: new Date(scriptContext.start) });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturafinal', value: new Date(scriptContext.end) });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_producto', value: scriptContext.producto });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_numeroserieproducto', value: scriptContext.serieproducto });
                    //objRecord.setValue({ fieldId: 'custrecord_ht_co_clientemonitoreo', value: scriptContext.monitoreo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado', value: scriptContext.estado });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_familia_prod', value: scriptContext.ttr });
                    response = objRecord.save();
                    log.debug('responseNuevoRegistro', response);
                } else {
                    let objRecord = record.load({ type: HT_COBERTURA_RECORD, id: scriptContext.cobertura });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: scriptContext.bien });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_propietario', value: scriptContext.propietario });
                    if (scriptContext.t_PPS == true) {
                        objRecord.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: scriptContext.estadoCobertura });
                        objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturainicial', value: new Date(scriptContext.start) });
                        objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                        objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturafinal', value: new Date(scriptContext.end) });
                    }
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_producto', value: scriptContext.producto });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_numeroserieproducto', value: scriptContext.serieproducto });
                    //objRecord.setValue({ fieldId: 'custrecord_ht_co_clientemonitoreo', value: scriptContext.monitoreo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado', value: scriptContext.estado });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_familia_prod', value: scriptContext.ttr });
                    response = objRecord.save();
                    log.debug('responseExisteRegistro', response);
                }
                let objSearch = verifyExistHistorial(scriptContext.salesorder, scriptContext.ordentrabajo);
                let searchResultCount = objSearch.runPaged().count;
                if (searchResultCount > 0) {
                    objSearch.run().each(result => {
                        historial = result.getValue({ name: "internalid", label: "Internal ID" });
                        return true;
                    });
                    let objRecord_2 = record.load({ type: HT_DETALLE_COBERTURA, id: historial });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: response });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: scriptContext.salesorder });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_trabajo', value: scriptContext.ordentrabajo });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: scriptContext.concepto });
                    // objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                    if (scriptContext.t_PPS == true) {
                        objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(scriptContext.start) });
                        objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(scriptContext.end) });
                    }
                    let response_2 = objRecord_2.save();
                    log.debug('responseExisteHistorial', response_2);

                } else {
                    let objRecord_2 = record.create({ type: HT_DETALLE_COBERTURA, isDynamic: true });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: response });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: scriptContext.salesorder });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_trabajo', value: scriptContext.ordentrabajo });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: scriptContext.concepto });
                    // objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(scriptContext.start) });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(scriptContext.end) });
                    let response_2 = objRecord_2.save();
                    log.debug('responseNuevoHistorial', response_2);
                }
            } else {
                let objRecord = record.create({ type: HT_COBERTURA_RECORD, isDynamic: true });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: scriptContext.bien });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_propietario', value: scriptContext.propietario });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_producto', value: scriptContext.producto });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_numeroserieproducto', value: scriptContext.serieproducto });
                objRecord.setValue({ fieldId: '0', value: scriptContext.ttr });
                let response = objRecord.save();
                log.debug('response', response);

                let objSearch = verifyExistHistorial(scriptContext.salesorder, scriptContext.ordentrabajo);
                let searchResultCount = objSearch.runPaged().count;
                if (searchResultCount > 0) {
                    objSearch.run().each(result => {
                        historial = result.getValue({ name: "internalid", label: "Internal ID" });
                        return true;
                    });
                    let objRecord_2 = record.load({ type: HT_DETALLE_COBERTURA, id: historial });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: response });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: scriptContext.salesorder });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_trabajo', value: scriptContext.ordentrabajo });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: scriptContext.concepto });
                    // objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado', value: scriptContext.estado });
                    let response_2 = objRecord_2.save();
                    log.debug('responseExisteHistorialSinCobertura', response_2);
                } else {
                    let objRecord_2 = record.create({ type: HT_DETALLE_COBERTURA, isDynamic: true });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: response });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: scriptContext.salesorder });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_orden_trabajo', value: scriptContext.ordentrabajo });
                    objRecord_2.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: scriptContext.concepto });
                    // objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado', value: scriptContext.estado });
                    let response_2 = objRecord_2.save();
                    log.debug('responseNuevoHistorialSinCobertura', response_2);
                }

            }
            return { 'Conect': 'ConectPost' };
        } catch (error) {
            log.error('Error', error)
        }
    }

    const verifyExistHistorial = (salesorder, ordentrabajo) => {
        let objSearch = search.create({
            type: "customrecord_ht_ct_cobertura_transaction",
            filters:
                [
                    ["custrecord_ht_ct_orden_servicio", "anyof", salesorder],
                    "AND",
                    ["custrecord_ht_ct_orden_trabajo", "anyof", ordentrabajo]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
        });
        //let searchResultCount = objSearch.runPaged().count;
        return objSearch;
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