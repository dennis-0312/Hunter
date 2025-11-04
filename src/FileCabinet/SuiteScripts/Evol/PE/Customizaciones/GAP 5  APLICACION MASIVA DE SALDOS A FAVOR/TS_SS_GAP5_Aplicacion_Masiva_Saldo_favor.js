/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/search', 'N/format', 'N/runtime', 'N/task', 'N/file', 'N/transaction'],

    (record, log, search, format, runtime, task, file, transaction) => {



        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            try {
                let cola = getCola(); //Obtenemos la cola

                if (cola.length > 0) {
                    log.debug('execute', 'Ejecucion Iniciada');
                    try {
                        let fileObjContent = file.load({ id: cola[0].parametros });
                        let parametros = JSON.parse(fileObjContent.getContents());

                        let facturaDirecta = generarFacturaDirecta(parametros, cola[0]);
                        //  log.debug('execute', 'Factura Directa Generada: ' + facturaDirecta.id);
                    } catch (e) {
                        log.error('execute error getFacturasFIN', e);
                    }
                    //Verificamos si hay mas ejecuciones pendientes
                    try {
                        let scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_ts_ss_gap5_aplicacion_masiv',
                            deploymentId: 'customdeploy_ts_ss_gap5_aplicacion_masiv',

                        });
                        scriptTask.submit();
                    } catch (error) {
                        log.error('Pendientes Task Error', error);
                    }
                }
            } catch (error) {
                log.error('execute', error);
            }
        }

        const generarFacturaDirecta = (params, id_cola) => {
            let idCabLog = params.id_log;
            try {
                var journalEntry = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
                journalEntry.setValue({ fieldId: 'subsidiary', value: params.custom_subsidiaria });
                journalEntry.setValue({ fieldId: 'currency', value: params.currency });
                journalEntry.setValue({ fieldId: 'exchangerate', value: params.custom_tipo_cambio });
                journalEntry.setValue({ fieldId: 'custbody_ht_asiento_orig_ant_sf', value: params.custom_deposito });

                //& <I>17/07/25 dfernandez
                log.debug('params.custom_fecha', params.custom_fecha)
                let fechaOriginal = params.custom_fecha
                const [dia, mes, anio] = fechaOriginal.split('/');
                const fechaFormateada = `${anio}-${mes}-${dia}`;
                log.debug('fechaFormateada', fechaFormateada)

                // Crear fecha con UTC+8
                let fechaConUTC5 = new Date(fechaFormateada);
                fechaConUTC5.setHours(fechaConUTC5.getHours() + 8); // Añadir 8 horas para UTC+5
                log.debug('fechaConUTC5', fechaConUTC5);

                journalEntry.setValue({ fieldId: 'trandate', value: fechaConUTC5 });
                journalEntry.setValue({ fieldId: 'postingperiod', value: params.custom_periodo_contable });
                journalEntry.setValue({ fieldId: 'memo', value: params.custom_glosa });
                journalEntry.setValue({ fieldId: 'custbody_pe_tipo_de_diario', value: params.custom_tipo_diario });
                //& <F>17/07/25 dfernandez

                journalEntry.selectNewLine({ sublistId: 'line' });
                journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: params.cuenta });
                journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: params.custom_importe });
                journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: params.custom_cliente_deposito });
                journalEntry.commitLine({ sublistId: 'line' });
                log.debug('params.custom_importe', params.custom_importe);
                params.facturas.forEach(factura => {
                    log.debug('factura', factura);
                    lineasJournal(journalEntry, factura.cuenta_id, factura["aplicación parcial"], factura.id_cliente, factura.documento, factura.departamento, factura.class, factura.location);
                });
                var fieldLookUp = search.lookupFields({
                    type: 'customrecord_conf_saldo_favor',
                    id: 1,
                    columns: ['custrecord_cuenta_saldo_favor', 'custrecord_conf_saldo_favor']
                });
                if (params.custom_importe_perdida > 0) {
                    log.debug('params.custom_importe_perdida', params.custom_importe_perdida);
                    lineasJournal(journalEntry, fieldLookUp.custrecord_conf_saldo_favor[0].value, parseFloat(params.custom_importe_perdida) * -1, params.custom_cliente_deposito, 'Saldo a Perdido', '', '', '');

                }
                if (params.custom_importe_ganancia > 0) {
                    log.debug('params.custom_importe_ganancia', params.custom_importe_ganancia);
                    lineasJournal(journalEntry, fieldLookUp.custrecord_cuenta_saldo_favor[0].value, params.custom_importe_ganancia, params.custom_cliente_deposito, 'Saldo a Favor', '', '', '');

                }
                var journalEntryId = journalEntry.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('journalEntryId', journalEntryId);
                record.submitFields({
                    type: record.Type.JOURNAL_ENTRY,
                    id: params.custom_deposito,
                    values: { custbody_ht_procesado_ant_sf: true },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
                params.facturas.forEach(factura => {
                    var payment = record.transform({
                        fromType: record.Type.INVOICE,
                        fromId: factura["ID documento"],
                        toType: record.Type.CUSTOMER_PAYMENT,
                        isDynamic: true
                    });

                    //& <I>25/07/25 dfernandez
                    payment.setValue({ fieldId: 'customform', value: 185 });
                    payment.setValue({ fieldId: 'trandate', value: fechaConUTC5 });
                    payment.setValue({ fieldId: 'postingperiod', value: params.custom_periodo_contable });
                    //& <F>25/07/25 dfernandez

                    var creditCount = payment.getLineCount({ sublistId: 'credit' });

                    for (var i = 0; i < creditCount; i++) {
                        payment.selectLine({ sublistId: 'credit', line: i });

                        var creditTranId = payment.getCurrentSublistValue({ sublistId: 'credit', fieldId: 'doc' });

                        if (creditTranId == journalEntryId) { // Si coincide con el Journal Entry
                            payment.setCurrentSublistValue({ sublistId: 'credit', fieldId: 'apply', value: true });
                            break;
                        }
                    }

                    payment.commitLine({ sublistId: 'credit' });
                    var applyCount = payment.getLineCount({ sublistId: 'apply' });

                    for (var i = 0; i < applyCount; i++) {
                        payment.selectLine({ sublistId: 'apply', line: i });

                        var invoiceAppliedId = payment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'doc' });

                        if (invoiceAppliedId == factura["ID documento"]) {


                            payment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                            payment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: factura["aplicación parcial"] });

                            payment.commitLine({ sublistId: 'apply' });
                            break;
                        }
                    }
                    payment.setValue({ fieldId: 'memo', value: `Pago generado desde Journal/${params.custom_glosa}` });

                    var paymentId = payment.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('paymentId', paymentId);
                });
                try {
                    updateCabLog({ idCabLog: idCabLog, porcentaje: '100%' });
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }
                try {
                    updateCabLog({ idCabLog: idCabLog, porcentaje: '100%', estado: 'Finalizado', idFacturaDirecta: journalEntryId, fechaFin: true, errores: 'OK' });
                    updateCola({ id: id_cola.id, estado: 'Completado' })
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }
            } catch (error) {
                log.error('generarFacturaDirecta', error);
                //Actualizamos el porcentaje del log
                try {
                    updateCabLog({ idCabLog: idCabLog, porcentaje: '100%', estado: 'Error', fechaFin: true, errores: error });
                    updateCola({ id: id_cola.id, estado: 'Error', errores: error })
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }
            }

        }

        const lineasJournal = (journalEntry, cuenta, saldo, cliente, memo, department, clase, location) => {
            // log.debug('Logggg', {
            //     department: department,
            //     clase: clase,
            //     location: location
            // })
            journalEntry.selectNewLine({ sublistId: 'line' });
            journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: cuenta });
            journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: saldo });
            journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memo });
            journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: cliente });
            journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: department });
            journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: clase });
            journalEntry.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location });
            journalEntry.commitLine({ sublistId: 'line' });
        }

        const updateCabLog = (params) => {
            try {
                let cabLog = record.load({ type: 'customrecord_ts_log_ejec_agrup_fact_am', id: params.idCabLog });
                cabLog.setValue({ fieldId: 'custrecord_ts_porcentaje_am', value: params.porcentaje });
                cabLog.setValue({ fieldId: 'custrecord_ts_error_am', value: params.errores });
                if (params.estado) { cabLog.setValue({ fieldId: 'custrecord_ts_estado_am', value: params.estado }) }
                if (params.fechaFin) { cabLog.setValue({ fieldId: 'custrecord_ts_fecha_fin_am', value: new Date() }) }
                if (params.idFacturaDirecta) { cabLog.setValue({ fieldId: 'custrecord_ts_fact_direct_am', value: params.idFacturaDirecta }) }
                cabLog.save();
            } catch (error) {
                log.error('updateCabLog', error);
            }
        }

        const getCola = () => {
            try {
                let respuesta = new Array();
                var customrecord_ts_standar_ss_colaSearchObj = search.create({
                    type: "customrecord_ts_standar_ss_cola_am",
                    filters:
                        [
                            ["custrecord_ts_ss_estado_am", "is", "pendiente"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalId", label: "internalId" }),
                            search.createColumn({ name: "custrecord_ts_ss_fecha_inicio_am", label: "Fecha_Inicio" }),
                            search.createColumn({ name: "custrecord_ts_ss_parametros_am", label: "Parametros" })
                        ]
                });
                var searchResultCount = customrecord_ts_standar_ss_colaSearchObj.runPaged().count;

                customrecord_ts_standar_ss_colaSearchObj.run().each(function (result) {
                    respuesta.push({
                        id: result.getValue({ name: 'internalId' }),
                        ejecucionesPendientes: searchResultCount,
                        fechaInicio: result.getValue({ name: 'custrecord_ts_ss_fecha_inicio_am' }),
                        parametros: result.getValue({ name: 'custrecord_ts_ss_parametros_am' })
                    });
                    return true;
                });
                //Ordenamos la cola por fecha de inicio
                respuesta.sort((a, b) => {
                    return new Date(a.fechaInicio) - new Date(b.fechaInicio);
                });

                return respuesta;
            } catch (e) {
                log.error('getCola Error', e);
            }
        }

        const updateCola = (params) => {
            try {
                let cola = record.load({ type: 'customrecord_ts_standar_ss_cola_am', id: params.id });
                cola.setValue({ fieldId: 'custrecord_ts_ss_estado_am', value: params.estado });
                cola.setValue({ fieldId: 'custrecord_ts_ss_fecha_inicio_am', value: new Date() });
                if (params.errores) { cola.setValue({ fieldId: 'custrecord_ts_ss_error_am', value: params.errores }) }
                cola.save();
            } catch (error) {
                log.error('updateCola', error);
            }
        }



        return { execute }

    });


// if (params.facturarA) {
//     facturaDirecta.setValue({ fieldId: 'entity', value: params.facturarA });
// } else {
//     facturaDirecta.setValue({ fieldId: 'entity', value: params.cliente });
// }