/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/record',
    'N/query',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages'
], (search, record, query, _controller, _constant, _errorMessage) => {
    let esAlquiler = 'continue';
    let esDesinstalacion = 'continue';
    const beforeLoad = (context) => { }
    const beforeSubmit = (context) => { }

    const afterSubmit = (context) => {
        if (context.type != context.UserEventType.DELETE) {
            let objRecord = context.newRecord;
            //let NumeroItmes;
            //let relateditem = objRecord.getValue({ fieldId: 'relateditem' });
            let transaction = objRecord.getValue({ fieldId: 'transaction' });
            let taller = objRecord.getValue({ fieldId: 'custevent_ht_turno_taller' });
            // let salesOrder = record.load({ type: 'salesorder', id: transaction });
            // let numLines = salesOrder.getLineCount({ sublistId: 'item' });
            //log.debug('Item', relateditem);
            try {
                let sql = 'SELECT ot.id FROM customrecord_ht_record_ordentrabajo ot ' +
                    'INNER JOIN transaction so ON ot.custrecord_ht_ot_orden_servicio = so.id ' +
                    'WHERE ot.custrecord_ht_ot_orden_servicio = ?';
                let resultSet = query.runSuiteQL({ query: sql, params: [transaction] });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    for (let i in results) {
                        let otUpdate = record.submitFields({ type: _constant.customRecord.ORDEN_TRABAJO, id: results[i]['id'], values: { 'custrecord_ht_ot_taller': taller } });
                        log.error('InserTaller', 'Se asignó el Taller ' + taller + ' en la Orden de Trabajo ' + otUpdate);
                    }
                } else {
                    log.error('OrdenTrabajoTurno', 'La Orden de Servicio ' + transaction + ' no tiene ninguna Orden de Trabajo asociada')
                }

                //?Bloque de turno anterior, eliminar después de validar funcionamiento
                // let ordenTrabajo = _controller.getOrdenTrabajoParaTurno(transaction, relateditem);
                // let otUpdate = record.submitFields({
                //     type: _constant.customRecord.ORDEN_TRABAJO,
                //     id: ordenTrabajo,
                //     values: { 'custrecord_ht_ot_taller': taller },
                //     options: { enableSourcing: false, ignoreMandatoryFields: true }
                // });
                // let parametrosRespo = _controller.parametrizacion(relateditem);
                // log.debug('parametrizacion pruebas', parametrosRespo);
                // if (parametrosRespo.length != 0) {
                //     for (let j = 0; j < parametrosRespo.length; j++) {
                //         if (parametrosRespo[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER) {
                //             esAlquiler = parametrosRespo[j][1];
                //             // break;
                //         }

                //         if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                //             esDesinstalacion = parametrosRespo[j][1];
                //             // break;
                //         }
                //     }
                // }
                // log.debug('ESALQUILER', esAlquiler);
                // log.debug('ESDESINSTALACION', esDesinstalacion);
                // for (let i = 0; i < numLines; i++) {
                //     let AplicaPPTO = salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                //     // log.debug('CompareItems', AplicaPPTO + ' - ' + relateditem);
                //     if (AplicaPPTO == relateditem) {
                //         NumeroItmes = i;
                //     }
                // }
                // // var pageData = busqueda.runPaged({ pageSize: 1000 });
                // let ordenTrabajo = _controller.getOrdenTrabajoParaTurno(transaction, relateditem);
                // log.debug('relateditem', relateditem);
                // let params = {
                //     soid: transaction,
                //     soline: NumeroItmes,
                //     specord: 'T',
                //     assemblyitem: relateditem
                // };
                // log.debug('params', params);
                // if (ordenTrabajo.length > 0) {
                //     if (esAlquiler != _constant.Valor.SI && esDesinstalacion != _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                //         let workOrder = record.create({ type: record.Type.WORK_ORDER, isDynamic: true, defaultValues: params });
                //         workOrder.setValue({ fieldId: 'quantity', value: 1 });
                //         workOrder.setValue({ fieldId: 'custbody_ht_ce_ordentrabajo', value: ordenTrabajo });
                //         let woId = workOrder.save();
                //         log.debug('woId', woId);
                //         let order = record.load({ type: _constant.customRecord.ORDEN_TRABAJO, id: ordenTrabajo });
                //         order.setValue({ fieldId: 'custrecord_ht_ot_ordenfabricacion', value: woId });
                //         order.save();
                //     } else {
                //         log.debug('ESALQUILER2', esAlquiler);
                //         if (esAlquiler == _constant.Valor.SI) {
                //             log.debug('ESALQUILER3', esAlquiler);
                //             record.submitFields({
                //                 type: _constant.customRecord.ORDEN_TRABAJO,
                //                 id: ordenTrabajo,
                //                 values: { 'custrecord_flujo_de_alquiler': true },
                //                 options: { enableSourcing: false, ignoreMandatoryFields: true }
                //             });
                //         }
                //     }
                // }
            } catch (error) {
                log.error('Error-POST', error);
                return error.message;
            }
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
