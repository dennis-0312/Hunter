/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @Author dfernandez
 */
define(['N/record', 'N/log', 'N/search', 'N/runtime', 'N/task', 'N/query'], function (record, log, search, runtime, task, query) {

    let witaxCode = '';
    let porcentajeDetraccion = '';
    let IGV_PE_UNDEF_PE = '';
    let id = '';

    function execute(context) {
        try {
            //const transactionId = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_factura_id' });
            IGV_PE_UNDEF_PE = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_tax_code_undef' });
            const TIPO_OPERACION = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_ei_tipo_operacion' });

            let sql = "SELECT id, custrecord_pe_whtax_related_record as factura, custrecord_pe_whtax_code as witaxcode, custrecord_pe_whtax_percent as percent FROM customrecord_pe_log_detraccion_automatic  " +
                "WHERE custrecord_pe_whtax_status = 'Pendiente' ORDER BY created ASC FETCH FIRST 1 ROW ONLY";
            let results = query.runSuiteQL({ query: sql, params: [] }).asMappedResults();
            log.error('Result-query', results);
            if (results.length > 0) {
                id = results[0]['id'];

                let transactionRecord = record.load({
                    type: record.Type.INVOICE,
                    id: results[0]['factura'],
                    isDynamic: true
                });
                witaxCode = results[0]['witaxcode'];
                porcentajeDetraccion = results[0]['percent'];

                record.submitFields({
                    type: 'customrecord_pe_log_detraccion_automatic',
                    id: id,
                    values: {
                        custrecord_pe_whtax_status: 'Procesando'
                    }
                });

                log.debug('Procesando transacción', 'ID: ' + transactionRecord.id);
                log.debug('witaxCode ', witaxCode);
                log.debug('porcentajeDetraccion ', porcentajeDetraccion);
                log.debug('typeof porcentajeDetraccion ', typeof porcentajeDetraccion);
                log.debug('codigo de impuesto UNDEF ', IGV_PE_UNDEF_PE);

                // Ejemplo: Aplicar detracción
                const itemCount = transactionRecord.getLineCount({ sublistId: 'item' });
                for (let line = 0; line < itemCount; line++) {
                    transactionRecord.selectLine({ sublistId: 'item', line: line });

                    const taxcode = transactionRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode' });
                    if (taxcode !== IGV_PE_UNDEF_PE) {
                        const grossamt = transactionRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt' }) * -1;
                        const whtAmount = ((porcentajeDetraccion * grossamt) * -1);
                        //log.debug('Importes', `grossamt = ${grossamt} / whtAmount = ${whtAmount}`)
                        transactionRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', value: true });
                        transactionRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxcode', value: witaxCode });
                        transactionRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxbaseamount', value: grossamt });
                        transactionRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxamount', value: whtAmount });
                    }
                    transactionRecord.commitLine({ sublistId: 'item' });
                }
                transactionRecord.setValue('custbody_pe_ei_operation_type', TIPO_OPERACION)
                transactionRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                log.debug('DETRACCION APLICADA POR SCHEDULED', 'Transacción ID: ' + transactionRecord.id);

                record.submitFields({
                    type: 'customrecord_pe_log_detraccion_automatic',
                    id: id,
                    values: {
                        custrecord_pe_whtax_status: 'Completado',
                        custrecord_pe_whtax_log: 'Detracción aplicada'
                    }
                });
                log.debug('Registro Actualizado', 'ID: ' + id);

                //Reprocesing
                let sql2 = "SELECT id, custrecord_pe_whtax_code as witaxcode, custrecord_pe_whtax_percent as percent FROM customrecord_pe_log_detraccion_automatic  " +
                    "WHERE custrecord_pe_whtax_status = 'Pendiente' ORDER BY created ASC FETCH FIRST 1 ROW ONLY";
                let results2 = query.runSuiteQL({ query: sql2, params: [] }).asMappedResults();
                log.error('Reseult2-query', results2);
                if (results2.length > 0) {
                    let scheduledScriptTask2 = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_ts_sc_witax_apply',
                        deploymentId: 'customdeploy_ts_sc_witax_apply',
                    });
                    let taskId2 = scheduledScriptTask2.submit();
                    log.debug('Log de Reinpulso', 'Activación por reproceso.', taskId2)
                }
            } else {
                log.debug('Obs Query', 'No hay registros que procesar');
            }
        } catch (error) {
            log.error('Error en el Scheduled Script', error);
            record.submitFields({
                type: 'customrecord_pe_log_detraccion_automatic',
                id: id,
                values: {
                    custrecord_pe_whtax_status: 'Error',
                    custrecord_pe_whtax_log: JSON.stringify(error)
                }
            });

            //Reprocesing
            let sql = "SELECT id, custrecord_pe_whtax_code as witaxcode, custrecord_pe_whtax_percent as percent FROM customrecord_pe_log_detraccion_automatic  " +
                "WHERE custrecord_pe_whtax_status = 'Pendiente' ORDER BY created ASC FETCH FIRST 1 ROW ONLY";
            let results = query.runSuiteQL({ query: sql, params: [] }).asMappedResults();
            log.error('Result-query', results);
            if (results.length > 0) {
                let scheduledScriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_ts_sc_witax_apply',
                    deploymentId: 'customdeploy_ts_sc_witax_apply',
                });
                let taskId = scheduledScriptTask.submit();
                log.debug('Log de Reinpulso', 'Activación por reproceso.', taskId)
            }
        }
    }

    return {
        execute: execute
    };
});


// SELECT
//     MAX(it.custitem_pe_concept_detraction) AS max_concept_detraction
// FROM
//     transactionLine tl
// INNER JOIN
//     item it ON tl.item = it.id
// WHERE
//     tl.itemtype = 'Service'
// AND tl.transaction = 442742