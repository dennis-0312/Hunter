
/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_RS_Integration_App_Talleres.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
Url: https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=802&deploy=1
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/search', 'N/record', 'N/email'], (log, search, record, email) => {
    const HT_CONSULTA_ORDEN_TRABAJO_SEARCH = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //
    const HT_BIEN_RECORD = 'customrecord_ht_record_bienes' //HT Bienes
    const HT_FLUJO_ORDEN_TRABAJO_RECORD = 'customrecord_ht_ot_flujoordendetrabajo' //HT OT Flujo Orden de trabajo - PRODUCCION
    const HT_FLUJO_ORDEN_TRBAJO_SEARCH = 'customsearch_ht_ot_flujo_orden_trabajo' //HT OT Flujo Orden de trabajo - PRODUCCION
    const RECEPCION = 'recepcion';
    const ACTUALIZAR = 'actualizar';
    const RECEPCION_FORMULARIO = 161;
    const ASIGNACION_FORMULARIO = 163;
    const PROCESANDO_FORMULARIO = 162;
    const FINALIZACION_OT = 164;

    const _get = (scriptContext) => {
        let idOT = 'vacio';
        let idOS = 'vacio';
        let placa = 'vacio';

        log.debug('scriptContext', scriptContext);

        if (typeof scriptContext.idot != 'undefined') { idOT = scriptContext.idot; }
        if (typeof scriptContext.idos != 'undefined') { idOS = scriptContext.idos; }
        if (typeof scriptContext.placa != 'undefined') { placa = scriptContext.placa; }

        const filterIDOS = search.createFilter({ name: 'custrecord_ht_ot_orden_serivicio_txt', operator: search.Operator.STARTSWITH, values: idOS });
        const filterIDOT = search.createFilter({ name: 'idtext', operator: search.Operator.STARTSWITH, values: idOT });
        //const filterTecnico = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: id });
        const filterPlaca = search.createFilter({ name: 'custrecord_ht_bien_placa', join: 'custrecord_ht_ot_vehiculo', operator: search.Operator.STARTSWITH, values: placa });
        //const filterTaller = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: id });

        try {
            let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO_SEARCH });
            let filters = objSearch.filters;
            if (typeof scriptContext.idos != 'undefined') {
                filters.push(filterIDOS);
            }
            if (typeof scriptContext.idot != 'undefined') {
                filters.push(filterIDOT);
            }
            if (typeof scriptContext.placa != 'undefined') {
                filters.push(filterPlaca);
            }

            let cantidadRegistros = objSearch.runPaged().count;
            let result = objSearch.run().getRange({ start: 0, end: 100 });
            //log.debug('Results', result);
            return result;

            // if (typeof scriptContext.idos == 'undefined') {
            //     if (typeof scriptContext.idot != 'undefined' || typeof scriptContext.placa != 'undefined') {
            //         let objSearchFlujoOT = search.load({ id: HT_FLUJO_ORDEN_TRBAJO_SEARCH });
            //         let filters1 = objSearchFlujoOT.filters;
            //         const filterIDOT = search.createFilter({ name: 'idtext', operator: search.Operator.STARTSWITH, values: idOT });
            //         filters1.push(filterIDOT);
            //         let cantidadRegistros = objSearch.runPaged().count;
            //         let result = objSearch.run().getRange({ start: 0, end: 100 });
            //     }
            // } else {
            //     return result;
            // }
        } catch (error) {
            log.error('Error-GET', error);
        }
    }

    const _post = (scriptContext) => {
        let accion = 'accion no definida';
        let respuesta = '';
        log.debug('JSON', scriptContext);
        try {
            if (typeof scriptContext.accion != 'undefined') {
                accion = scriptContext.accion;
                let guardar = 0;
                let guardarBien = 0;
                let recepcion = '';
                switch (accion) {
                    case RECEPCION:
                        log.debug('Acción', 'Recepción');
                        if (typeof scriptContext.ordenServicio != 'undefined' && scriptContext.ordenServicio.length > 0) {

                            let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO_SEARCH });
                            let filters = objSearch.filters;
                            const ordenTrabajo = search.createFilter({ name: 'custrecord_ht_ot_orden_serivicio_txt', operator: search.Operator.STARTSWITH, values: scriptContext.ordenServicio });
                            filters.push(ordenTrabajo);
                            let cantidadRegistros = objSearch.runPaged().count;
                            log.debug('cantidadRegistros', cantidadRegistros);
                            if (cantidadRegistros > 0) {
                                let result = objSearch.run().getRange({ start: 0, end: 1 });
                                //log.debug('Results', result);
                                let idordentrabajo = result[0].getValue({ name: "internalid" });
                                let idvehiculo = result[0].getValue({ name: "custrecord_ht_ot_vehiculo" });

                                //*Bloque seteo ==============
                                //let recepcionRecord = record.create({ type: HT_FLUJO_ORDEN_TRABAJO_RECORD });

                                let openRecord = record.create({ type: record.Type.CALENDAR_EVENT, isDynamic: true })
                                //let openRecord = record.load({ type: HT_ORDEN_TRABAJO_RECORD, id: idordentrabajo, isDynamic: true });
                                openRecord.setValue({ fieldId: "customform", value: "173" });
                                openRecord.setValue({ fieldId: "title", value: scriptContext.ordenServicio });
                                openRecord.setValue({ fieldId: "startdate", value: new Date() });
                                openRecord.setValue({ fieldId: "timedevent", value: false });
                                if (typeof scriptContext.entregaa != 'undefined' && scriptContext.entregaa.length > 0) {
                                    openRecord.setValue({ fieldId: "custevent_ht_rc_nombreentrega", value: scriptContext.entregaa });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.recibea != 'undefined' && scriptContext.recibea.length > 0) {
                                    openRecord.setValue({ fieldId: "custevent_ht_rc_nombrerecibe", value: scriptContext.recibea });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.customer != 'undefined' && scriptContext.customer.length > 0) {
                                    openRecord.setValue({ fieldId: "custevent_ht_rc_correorecepcion", value: scriptContext.correo });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.comentario != 'undefined' && scriptContext.comentario.length > 0) {
                                    openRecord.setValue({ fieldId: "message", value: scriptContext.comentario });
                                    guardar = 1;
                                }

                                if (guardar == 1) {
                                    openRecord.setValue({ fieldId: 'company', value: scriptContext.customer });
                                    openRecord.setValue({ fieldId: 'transaction', value: scriptContext.idordenservicio });
                                    //openRecord.setValue({ fieldId: "sendemail", value: true });
                                    let recepcionRec = openRecord.save();
                                    recepcion = scriptContext.ordenServicio;
                                    // let submitF = record.submitFields({
                                    //     type: record.Type.CALENDAR_EVENT,
                                    //     id: savedRecord,
                                    //     values: {
                                    //         sendemail: true
                                    //     }
                                    // });
                                    log.debug('Recepción', recepcionRec);
                                }

                                let openRecordBien = record.load({ type: HT_BIEN_RECORD, id: idvehiculo, isDynamic: true });
                                if (typeof scriptContext.color != 'undefined' && scriptContext.color.length > 0) {
                                    openRecordBien.setValue({ fieldId: "custrecord_ht_bien_colorcarseg", value: scriptContext.color });
                                    guardarBien = 1;
                                }

                                if (guardarBien == 1) {
                                    openRecordBien.save();
                                }

                                email.send({
                                    author: 34,
                                    recipients: scriptContext.customer,
                                    subject: 'Recepción de Vehículo',
                                    body: '<p>Vehículo recepcionado</p><p>' + scriptContext.comentario + '</p>',
                                    relatedRecords: {
                                        transactionId: scriptContext.idordenservicio
                                    }
                                });
                                respuesta = 'Vehículo recepcionado, recepción: ' + recepcion;
                            } else {
                                respuesta = 'No se encontró información para está Orden de Trabajo';
                            }
                        } else {
                            respuesta = 'Orden de Trabajo no especificada';
                        }
                        break;
                    case ACTUALIZAR:
                        if (typeof scriptContext.idordentrabajo != 'undefined') {
                            let guardar = 0;
                            let action = '';
                            let openRecord = record.load({ type: HT_ORDEN_TRABAJO_RECORD, id: scriptContext.idordentrabajo, isDynamic: true });
                            if (typeof scriptContext.codigodispositivo != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_serieproductoasignacion", value: scriptContext.codigodispositivo });
                                guardar = 1;
                                action = 'Nro de serie de dispositivo asignado';
                            }
                            if (typeof scriptContext.estadoot != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_estado", value: scriptContext.estadoot });
                                guardar = 1;
                                action = 'Cambio de estado';
                            }
                            if (typeof scriptContext.tecnico != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_tecnicoasignacion", value: scriptContext.tecnico });
                                guardar = 1;
                                action = 'Chequeada';
                            }
                            if (typeof scriptContext.comentario != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_comentariofinalizacion", value: scriptContext.comentario });
                                guardar = 1;
                                action = 'Ingresa comentario';
                            }
                            openRecord.setValue({ fieldId: "custrecord_ht_ot_fechatrabajoasignacion", value: new Date(scriptContext.fechatrabajoasignacion) });
                            openRecord.setValue({ fieldId: "custrecord_ht_ot_horatrabajoasignacion", value: new Date(scriptContext.horatrabajoasignacion) });
                            openRecord.setValue({ fieldId: "custrecord_ht_ot_ubicacion", value: scriptContext.ubicacion });

                            if (guardar == 1) {
                                openRecord.save();
                                respuesta = 'Actualización: ' + action;
                            }
                            //openRecord.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                        } else {
                            respuesta = 'internalid Orden de Trabajo no definida';
                        }
                        break;
                    default:
                        log.debug('Acción', 'Sin coincidencia de acción');
                        break;
                }
                return respuesta;
            } else {
                return accion;
            }
        } catch (error) {
            return error;
        }
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
Date: 6/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/