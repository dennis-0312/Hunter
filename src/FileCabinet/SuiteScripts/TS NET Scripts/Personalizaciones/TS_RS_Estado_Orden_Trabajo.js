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

 /*    const _get = (context) => {
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
    } */

    const _post = (scriptContext) => {
        log.debug('JSON', scriptContext);
        let accion = 'accion no definida';
        let respuesta = '';
        log.debug('JSON', scriptContext);
        try {   
                if (typeof scriptContext.accion != 'undefined') {
                    accion = scriptContext.accion;
                    log.debug(' accion',accion);
                    let guardar = 0;
                    let guardarBien = 0;
                    let recepcion = '';                  
                switch (accion) {
                    case 'actualizar':
                        /* if (typeof scriptContext.idordentrabajo != 'undefined') { */
                            log.debug('entra case');
                            let guardar = 0;
                            let action = '';
                            let openRecord = record.load({ type: "customrecord_ht_record_ordentrabajo", id: scriptContext.idordentrabajo, isDynamic: true });
/*                             if (typeof scriptContext.codigodispositivo != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_serieproductoasignacion", value: scriptContext.codigodispositivo });
                                guardar = 1;
                                action = 'Nro de serie de dispositivo asignado';
                            } */
                            if (typeof scriptContext.estadoot != 'undefined') {
                                log.debug('entra estado');
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_estado", value: scriptContext.estadoot });
                                guardar = 1;
                                action = 'Cambio de estado';
                            }
                            /* if (typeof scriptContext.tecnico != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_tecnicoasignacion", value: scriptContext.tecnico });
                                guardar = 1;
                                action = 'Chequeada';
                            }
                            if (typeof scriptContext.comentario != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_comentariofinalizacion", value: scriptContext.comentario });
                                guardar = 1;
                                action = 'Ingresa comentario';
                            }
                          if (typeof scriptContext.fechatrabajoasignacion != 'undefined') {
                           
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_fechatrabajoasignacion", value:  new Date(scriptContext.fechatrabajoasignacion) });
                                guardar = 1;
                                action = 'Ingresa fecha Trabajo';
                            }
                          if (typeof scriptContext.horatrabajoasignacion != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_horatrabajoasignacion", value: new Date(scriptContext.fechatrabajoasignacion+ ' ' + scriptContext.horatrabajoasignacion)  });
                                guardar = 1;
                                action = 'Ingresa Hora Trabajo';
                            }
                            if (typeof scriptContext.ubicacion != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_ubicacion", value: scriptContext.ubicacion });
                                guardar = 1;
                                action = 'Ingresa ubicacion ';
                            }
                           */
                          

                            if (guardar == 1) {
                                log.debug('entra');
                                openRecord.save();
                                respuesta = 'Actualización: ' + action;
                                
                            }
                            //openRecord.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
/*                         } else {
                            respuesta = 'internalid Orden de Trabajo no definida';
                        } */
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
        //get: _get,
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