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
    const PX_MODIFICACION_DATOS_DISPOSITIVOS = 1

    const _get = (scriptContext) => {
        try {
            log.debug('ConextGet', scriptContext);
            let recordLoad = record.load({ type: ORDEN_TRABAJO, id: scriptContext.myFirstParameter, isDynamic: true, defaultValues: true });
            recordLoad.setValue({ fieldId: 'custrecord_ht_ot_estado', value: CHEQUEADO });
            updateRecord = recordLoad.save();
            return updateRecord;
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
                    //galvar 26/02/2025
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_subsidiaria', value: scriptContext.subsidiary });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: scriptContext.bien });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_propietario', value: scriptContext.propietario });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: scriptContext.estadoCobertura });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturainicial', value: new Date(scriptContext.start) });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturafinal', value: new Date(scriptContext.end) });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_producto', value: scriptContext.producto });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_numeroserieproducto', value: scriptContext.serieproducto });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_clientemonitoreo', value: scriptContext.monitoreo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado', value: scriptContext.estado });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_familia_prod', value: scriptContext.ttr });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_modelodispositivo', value: scriptContext.modeloDispositivo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_unidad', value: scriptContext.unidadDispositivo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_vid', value: scriptContext.vidDispositivo });
                    response = objRecord.save();
                    log.debug('responseNuevoRegistro', response);
                } else {
                    let objRecord = record.load({ type: HT_COBERTURA_RECORD, id: scriptContext.cobertura });
                    //& <I> dfernandez 06/09/2025
                    let fechaFinCobertura = objRecord.getValue('custrecord_ht_co_coberturafinal');
                    scriptContext.estadoCobertura = getEstadoFinal(fechaFinCobertura, scriptContext.estadoCobertura);
                    //& <F> dfernandez 06/09/2025
                    //galvar 26/02/2025
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_subsidiaria', value: scriptContext.subsidiary });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: scriptContext.bien });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_propietario', value: scriptContext.propietario });
                    if (scriptContext.t_PPS == true) {
                        if (scriptContext.esGarantia == true) {
                            objRecord.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: scriptContext.estadoCobertura });
                            scriptContext.start = objRecord.getValue('custrecord_ht_co_coberturainicial');
                            scriptContext.end = objRecord.getValue('custrecord_ht_co_coberturafinal');
                            objRecord.setValue({ fieldId: 'custrecord_ht_co_impulso_plataforma', value: PX_MODIFICACION_DATOS_DISPOSITIVOS });
                        } else {
                            objRecord.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: scriptContext.estadoCobertura });
                            objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturainicial', value: new Date(scriptContext.start) });
                            objRecord.setValue({ fieldId: 'custrecord_ht_co_plazo', value: scriptContext.plazo });
                            objRecord.setValue({ fieldId: 'custrecord_ht_co_coberturafinal', value: new Date(scriptContext.end) });
                        }
                    } else {
                        //& <I> dfernandez 06/09/2025
                        try {
                            if (scriptContext.esEntregaCustodiaCCD) {
                                scriptContext.start = objRecord.getValue('custrecord_ht_co_coberturainicial');
                                scriptContext.end = objRecord.getValue('custrecord_ht_co_coberturafinal');
                                log.debug('scriptContext.esEntregaCustodiaCCD', scriptContext.esEntregaCustodiaCCD)
                                objRecord.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: scriptContext.estadoCobertura });
                            }
                        } catch (error) { }
                        //& <F> dfernandez 06/09/2025
                    }

                    if (scriptContext.esCambioSimCard == true) { objRecord.setValue({ fieldId: 'custrecord_ht_co_impulso_plataforma', value: PX_MODIFICACION_DATOS_DISPOSITIVOS }); }
                    if (scriptContext.esItemRepuesto == true) { objRecord.setValue({ fieldId: 'custrecord_ht_co_impulso_plataforma', value: PX_MODIFICACION_DATOS_DISPOSITIVOS }); }
                    if (!scriptContext.esGarantia || scriptContext.esEntregaCustodiaCCD) { objRecord.setValue({ fieldId: 'custrecord_ht_co_producto', value: scriptContext.producto }) }
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_numeroserieproducto', value: scriptContext.serieproducto });
                    //objRecord.setValue({ fieldId: 'custrecord_ht_co_clientemonitoreo', value: scriptContext.monitoreo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_estado', value: scriptContext.estado });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_familia_prod', value: scriptContext.ttr });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_modelodispositivo', value: scriptContext.modeloDispositivo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_unidad', value: scriptContext.unidadDispositivo });
                    objRecord.setValue({ fieldId: 'custrecord_ht_co_vid', value: scriptContext.vidDispositivo });
                    response = objRecord.save();
                    log.debug('responseExisteRegistro', response);
                }

                let objSearch = verifyExistHistorial(scriptContext.salesorder, scriptContext.ordentrabajo, scriptContext.concepto);
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
                let objRecord;
                if (scriptContext.cobertura != 0) {
                    objRecord = record.load({ type: HT_COBERTURA_RECORD, id: scriptContext.cobertura, isDynamic: true });
                    log.debug('record.load', 'load');
                } else {
                    objRecord = record.create({ type: HT_COBERTURA_RECORD, isDynamic: true });
                    log.debug('record.create', 'create');
                }
                //galvar 26/02/2025
                objRecord.setValue({ fieldId: 'custrecord_ht_co_subsidiaria', value: scriptContext.subsidiary });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_bien', value: scriptContext.bien });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_propietario', value: scriptContext.propietario });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_producto', value: scriptContext.producto });
                objRecord.setValue({ fieldId: 'custrecord_ht_co_numeroserieproducto', value: scriptContext.serieproducto });
                objRecord.setValue({ fieldId: '0', value: scriptContext.ttr });
                let response = objRecord.save();
                log.debug('response', response);
                let objSearch = verifyExistHistorial(scriptContext.salesorder, scriptContext.ordentrabajo, scriptContext.concepto);
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

    const verifyExistHistorial = (salesorder, ordentrabajo, concepto) => {
        let objSearch = search.create({
            type: "customrecord_ht_ct_cobertura_transaction",
            filters:
                [
                    ["custrecord_ht_ct_orden_servicio", "anyof", salesorder],
                    "AND",
                    ["custrecord_ht_ct_orden_trabajo", "anyof", ordentrabajo],
                    // "AND",
                    // ["custrecord_ht_ct_concepto", "anyof", concepto]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
        });
        //let searchResultCount = objSearch.runPaged().count;
        return objSearch;
    }

    const getEstadoFinal = (fechaFinCobertura, estadoCobertura) => {
        let estadoFinal;
        log.debug('fechaFinCobertura', fechaFinCobertura);
        const fechaRecibida = new Date(fechaFinCobertura);
        const fechaHoy = new Date();

        // Comparar si es mayor que hoy
        if (fechaRecibida > fechaHoy) {
            log.debug('La fecha recibida es mayor que hoy');
            estadoFinal = 1
        } else if (fechaRecibida < fechaHoy) {
            log.debug('La fecha recibida es menor que hoy');
            estadoFinal = estadoCobertura
        } else {
            log.debug('Las fechas son iguales');
            estadoFinal = estadoCobertura
        }
        log.debug('estadoFinal', estadoFinal);
        return estadoFinal;
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