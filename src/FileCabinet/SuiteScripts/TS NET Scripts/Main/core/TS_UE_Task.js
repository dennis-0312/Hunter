/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/search',
    'N/record',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages'
], (search, record, _controller, _constant, _errorMessage) => {
    let esAlquiler = 'continue';
    let esDesinstalacion = 'continue';
    const beforeLoad = (context) => { }
    const beforeSubmit = (context) => { }

    const afterSubmit = (context) => {
        let objRecord = context.newRecord;
        let NumeroItmes;
        let relateditem = objRecord.getValue({ fieldId: 'relateditem' });
        let transaction = objRecord.getValue({ fieldId: 'transaction' });
        let customer = record.load({ type: 'salesorder', id: transaction });
        let numLines = customer.getLineCount({ sublistId: 'item' });

        try {
            let parametrosRespo = _controller.parametrizacion(relateditem);
            //log.debug('parametrizacion pruebas', parametrosRespo);
            if (parametrosRespo.length != 0) {
                for (let j = 0; j < parametrosRespo.length; j++) {
                    //log.debug('parámetros', parametrosRespo[j][0] + ' - ' + parametrosRespo[j][1]);
                    if (parametrosRespo[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER) {
                        esAlquiler = parametrosRespo[j][1];
                        break;
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                        esDesinstalacion = parametrosRespo[j][1];
                        break;
                    }
                }
            }
            log.debug('ESALQUILER', esAlquiler);
            log.debug('ESDESINSTALACION', esDesinstalacion);
            for (let i = 0; i < numLines; i++) {
                let AplicaPPTO = customer.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                if (AplicaPPTO == relateditem) {
                    NumeroItmes = i;
                }
            }

            // const busqueda = search.create({
            //     type: "customrecord_ht_record_ordentrabajo",
            //     filters: [
            //         ["custrecord_ht_ot_orden_servicio", "anyof", transaction]
            //     ],
            //     columns: [
            //         search.createColumn({ name: "internalid", label: "ID" })
            //     ]
            // });
            // var pageData = busqueda.runPaged({ pageSize: 1000 });
            let ordenTrabajo = _controller.getOrdenTrabajoParaTurno(transaction, relateditem);
            log.debug('relateditem', relateditem);
            let params = {
                soid: transaction,
                soline: NumeroItmes,
                specord: 'T',
                assemblyitem: relateditem
            };
            log.debug('params', params);
            if (ordenTrabajo.length > 0) {
                if (esAlquiler != _constant.Valor.SI && esDesinstalacion != _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                    let workOrder = record.create({ type: record.Type.WORK_ORDER, isDynamic: true, defaultValues: params });
                    workOrder.setValue({ fieldId: 'quantity', value: 1 });
                    workOrder.setValue({ fieldId: 'custbody_ht_ce_ordentrabajo', value: ordenTrabajo });
                    let woId = workOrder.save();
                    log.debug('woId', woId);

                    let order = record.load({ type: _constant.customRecord.ORDEN_TRABAJO, id: ordenTrabajo });
                    order.setValue({ fieldId: 'custrecord_ht_ot_ordenfabricacion', value: woId });
                    order.save();
                } else {
                    if (esAlquiler == _constant.Valor.SI) {
                        record.submitFields({
                            type: _constant.customRecord.ORDEN_TRABAJO,
                            id: ordenTrabajo,
                            values: { 'custrecord_flujo_de_alquiler': true },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }
                }
            }
        } catch (error) {
            log.error('Error-POST', error);
            return error.message;
        }
    }


    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
