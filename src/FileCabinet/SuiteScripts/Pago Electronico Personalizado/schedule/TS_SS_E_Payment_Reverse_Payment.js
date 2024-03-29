/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/task'],
    /**
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 */
    (log, query, record, runtime, search, task) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */

        let currentScript = runtime.getCurrentScript();

        const execute = (scriptContext) => {
            log.error('Proccessing', 'START ================================================');
            let scriptParameters = getScriptParameters();
            if (scriptParameters.paymentLotIds) {
                let ePaymentPayments = getPayments(scriptParameters.paymentLotIds);
                log.error('ePaymentPayments', ePaymentPayments);
                if (ePaymentPayments != 0) {
                    reversePayments(ePaymentPayments, scriptParameters.paymentLotIds);
                    log.error('Proccessing', 'FINISH ===============================================');
                } else {
                    log.error('Error-Length', 'No hay registros de pagos relacionados');
                    deleteLog(scriptParameters.paymentLotIds);
                    deleteLot(scriptParameters.paymentLotIds);
                    log.error('Proccessing', 'FINISH ===============================================');
                }
            }
        }

        const getScriptParameters = () => {
            let scriptParameters = new Object();
            scriptParameters.paymentLotIds = currentScript.getParameter('custscript_ts_ss_epmt_ppr_paymentlot_id');
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const getPayments = (lote) => {
            let objPayments = new Array();
            let mySearch = search.create({
                type: "customrecord_ts_epmt_payment",
                filters: [
                    ["custrecord_ts_epmt_prepaydet_pre_payment", "anyof", lote],
                    "AND",
                    ["custrecord_ts_epmt_prepaydet_origin_tran.mainline", "is", "T"]
                ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ts_epmt_prepaydet_origin_tran", label: "Transaccion Origen" }),
                        search.createColumn({ name: "recordtype", join: "CUSTRECORD_TS_EPMT_PREPAYDET_ORIGIN_TRAN", label: "Record Type" }),
                    ]
            });
            let searchResultCount = mySearch.runPaged().count;
            mySearch.run().each((result) => {
                objPayments.push({
                    id: result.id,
                    tranid: result.getValue({ name: "custrecord_ts_epmt_prepaydet_origin_tran", label: "Transaccion Origen" }),
                    type: result.getValue({ name: "recordtype", join: "CUSTRECORD_TS_EPMT_PREPAYDET_ORIGIN_TRAN", label: "Record Type" })
                })
                return true;
            });
            return searchResultCount == 0 ? 0 : objPayments
        }

        const reversePayments = (results, lotid) => {
            for (let j in results) {
                let response = record.submitFields({
                    type: results[j].type,
                    id: results[j].tranid,
                    values: {
                        transtatus: "B",
                        custbody_est_emitido: 1,
                        custbody_ht_emitido_pago_electronico: true
                    }
                });
                log.error('Response Proccessing', 'Transacción: ' + results[j].type + ' ' + response + ' liberado');

                try {
                    if (response) {
                        deleteLogPayment(results[j].id);
                        deleteLog(lotid);
                        deleteLot(lotid);
                    }
                } catch (error) {
                    log.error('Error-Delete-' + results[j].id, error);
                }
            }
        }

        const deleteLogPayment = (id) => {
            try {
                record.delete({ type: 'customrecord_ts_epmt_payment', id: id });
                log.error('Response deleteLogPayment', 'Log Payment: ' + id + ' eliminado');
            } catch (error) {
                log.error('Error-deleteLogPayment', 'El registro ya no existe');
            }
        }

        const deleteLog = (lotid) => {
            let sql = 'select id from customrecord_ts_epmt_log where custrecord_ts_epmt_log_pre_pago = ?';
            let result = query.runSuiteQL({ query: sql, params: [lotid] }).asMappedResults();
            record.submitFields({ type: 'customrecord_ts_epmt_log', id: result[0].id, values: { custrecord_ts_epmt_log_status: "Liberado" } });
            log.error('Response deleteLog', 'Log: ' + result[0].id + ' liberado');
        }

        const deleteLot = (lotid) => {
            record.submitFields({ type: 'customrecord_ts_epmt_payment_batch', id: lotid, values: { custrecord_ts_epmt_prepmt_status: "Liberado" } });
            log.error('Response deleteLot', 'LoT: ' + lotid + ' liberado');
        }

        return { execute }

    });
