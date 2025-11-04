/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/https', 'N/record', 'N/runtime', 'N/query', 'N/task'], (log, https, record, runtime, query, task) => {

    const MONEDA_SOLES = 5;
    const MONEDA_DOLARES = 1;
    let MONEDA = '';

    const afterSubmit = (scriptContext) => {
        let newRecord = scriptContext.newRecord;
        let whtaxCode = '';
        const WHTAX_CODE_SIN_DETRACCION = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_whtax_code_sd' });
        const TIPO_OPERACION = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_ue_ei_tipo_operacion' });
        const IMPORTE_MINIMO = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_importe_minimo' });
        log.debug('IMPORTE_MINIMO value', IMPORTE_MINIMO)
        log.debug('IMPORTE_MINIMO', typeof IMPORTE_MINIMO)
        const DOCUMENT_APPLY = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_type_doc_apply' });

        if ((scriptContext.type === scriptContext.UserEventType.CREATE ||
            scriptContext.type === scriptContext.UserEventType.EDIT ||
            scriptContext.type === scriptContext.UserEventType.COPY) &&
            newRecord.getValue('custbody_pe_concept_detraction') != WHTAX_CODE_SIN_DETRACCION) {
            try {
                //const TAX_CODE = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_pe_tax_code' });

                const consulta = `
                SELECT
                    cd.id,
                    cd.custrecord_pe_percentage_detraction
                FROM
                    transactionLine tl
                INNER JOIN
                    item it ON tl.item = it.id
                INNER JOIN
                    customrecord_pe_concept_detraction cd ON it.custitem_pe_concept_detraction = cd.id
                WHERE
                    tl.itemtype = 'Service'
                    AND tl.transaction = ?
            `;

                let resultsCon = query.runSuiteQL({ query: consulta, params: [newRecord.id] }).asMappedResults();
                log.error('resultsCon-query', resultsCon);

                const filtrado = resultsCon.filter(item => item.id !== null);
                const mayor = filtrado.reduce((prev, current) => {
                    return (prev.custrecord_pe_percentage_detraction > current.custrecord_pe_percentage_detraction) ? prev : current;
                });
                log.debug('resultsCon-mayor', mayor.id);
                log.debug('resultsCon-custrecord_pe_percentage_detraction', mayor.custrecord_pe_percentage_detraction);

                if ((scriptContext.type === scriptContext.UserEventType.CREATE ||
                    scriptContext.type === scriptContext.UserEventType.COPY ||
                    (scriptContext.type === scriptContext.UserEventType.EDIT && !newRecord.getValue('custbody_pe_concept_detraction')) &&
                    newRecord.getValue('approvalstatus') == 2)
                ) {
                    record.submitFields({
                        type: newRecord.type,
                        id: newRecord.id,
                        values: {
                            custbody_pe_concept_detraction: mayor.id,
                            custbody_pe_percentage_detraccion: mayor.custrecord_pe_percentage_detraction * 100
                        }
                    });
                }

                let objRecord = record.load({ type: newRecord.type, id: newRecord.id, isDynamic: true });
                let total = objRecord.getValue('total') * objRecord.getValue('exchangerate');
                let applyWHTax = objRecord.getValue('custbody_pe_concept_detraction');
                let approvalstatus = objRecord.getValue('approvalstatus');
                let memo = objRecord.getValue('memo');
                MONEDA = objRecord.getValue('currency');
                let conceptoDetraccion = objRecord.getValue('custbody_pe_concept_detraction');
                whtaxCode = queryWHTax(conceptoDetraccion)
                let porcentajeDetraccion = objRecord.getValue('custbody_pe_percentage_detraccion');
                let documentType = objRecord.getValue('custbody_pe_document_type');

                log.debug('total', total);
                log.debug('applyWHTax', applyWHTax);
                log.debug('approvalstatus', approvalstatus);
                log.debug('memo', memo);
                log.debug('whtaxCode', whtaxCode);

                log.debug('Track-Validación', `${memo} != 'VOID' && ${approvalstatus} == 2 && ${total} > ${IMPORTE_MINIMO} && ${documentType} == ${DOCUMENT_APPLY}`)
                if (memo != 'VOID' && approvalstatus == 2 && total > IMPORTE_MINIMO && documentType == DOCUMENT_APPLY) {

                    let sqlExe = "SELECT COUNT(*) AS encola " +
                        "FROM customrecord_pe_log_detraccion_automatic " +
                        "WHERE custrecord_pe_whtax_status IN ('Pendiente', 'Procesando', 'Completado') " +
                        "AND custrecord_pe_whtax_related_record = ?"

                    let resultsExe = query.runSuiteQL({ query: sqlExe, params: [objRecord.id] }).asMappedResults();
                    log.error('resultsExe-query', resultsExe);
                    if (resultsExe[0].encola == 0) {
                        log.debug('Access', 'Ingresó a generación de aplicación');
                        let initStatus = 'Pendiente';
                        let customRecord = record.create({ type: 'customrecord_pe_log_detraccion_automatic' });
                        customRecord.setValue({ fieldId: 'custrecord_pe_whtax_related_record', value: objRecord.id });
                        customRecord.setValue({ fieldId: 'custrecord_pe_whtax_subsidiary', value: objRecord.getValue('subsidiary') });
                        if (conceptoDetraccion == 0) {
                            customRecord.setValue({ fieldId: 'custrecord_pe_whtax_log', value: 'El registro de concepto de detracción no cuenta con códigos configurados.' });
                            initStatus = 'Rechazado'
                        } else {
                            customRecord.setValue({ fieldId: 'custrecord_pe_whtax_code', value: whtaxCode });
                        }
                        customRecord.setValue({ fieldId: 'custrecord_pe_whtax_percent', value: porcentajeDetraccion });
                        customRecord.setValue({ fieldId: 'custrecord_pe_whtax_status', value: initStatus });
                        let recordId = customRecord.save();
                        log.debug('Registro en cola para aplicación de detracción automática', recordId);
                    } else {
                        log.debug('Debug', 'La transacción ' + objRecord.id + 'ya cuenta con registro de aplicación.')
                    }

                    //*Ingresa a script programado para procesar 
                    try {
                        let scheduledScriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_ts_sc_witax_apply',
                            deploymentId: 'customdeploy_ts_sc_witax_apply',
                        });
                        let taskId = scheduledScriptTask.submit();
                        log.debug('taskId', taskId)
                    } catch (error) {
                        log.debug('taskId', 'El scheduled ya se encuentra ejecutando')
                    }
                } else {
                    log.debug('Debug', 'No aplica')
                }
            } catch (error) {
                // let customRecord = record.create({ type: 'customrecord_pe_log_detraccion_automatic' });
                // customRecord.setValue({ fieldId: 'custrecord_pe_whtax_related_record', value: objRecord.id });
                // customRecord.setValue({ fieldId: 'custrecord_pe_whtax_subsidiary', value: objRecord.getValue('subsidiary') });
                // customRecord.setValue({ fieldId: 'custrecord_pe_whtax_status', value: 'Error' });
                // customRecord.setValue({ fieldId: 'custrecord_pe_whtax_log', value: JSON.stringify(error) });
                // let recordId = customRecord.save();
                log.error('Error Aplicación Auto Detrac:', error);
            }
        } else {
            record.submitFields({
                type: newRecord.type,
                id: newRecord.id,
                values: {
                    custbody_pe_ei_operation_type: TIPO_OPERACION,
                }
            });
            log.debug('El concepto es sin detracción', 'No aplica detracción');
        }
    }

    let queryWHTax = (id) => {
        let taxCode = '';
        let sql = 'select custrecord_pe_tax_codes_pen as soles, custrecord_pe_tax_codes_dol as dolares from customrecord_pe_concept_detraction ' +
            'where id = ?';
        let results = query.runSuiteQL({ query: sql, params: [id] }).asMappedResults();
        log.error('Response-queryWHTax', results);
        if (results.length > 0) {
            if (MONEDA == MONEDA_SOLES) {
                taxCode = results[0]['soles'];
            } else if (MONEDA == MONEDA_DOLARES) {
                taxCode = results[0]['dolares'];
            }
        } else {
            taxCode = 0;
        }
        return taxCode;
        // let producto = results.length > 0 ? results[0]['producto'] : 0;
        // return producto;
    }


    return {
        afterSubmit: afterSubmit
    };
});