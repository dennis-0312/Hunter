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
