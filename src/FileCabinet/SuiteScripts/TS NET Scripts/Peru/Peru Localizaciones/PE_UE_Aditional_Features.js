/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/task'], function (search, record, runtime, task) {

    const ORDEN_PAGO = 'custompurchase_ev_payment_order';
    const ORDEN_COMPRA = 'purchaseorder';
    const FACTURA_COMPRA = 'vendorbill';
    const CHEQUE = 'check';
    const INFORME_GASTO = 'expensereport';
    const PAGO_PROVEEDOR = 'vendorpayment';
    const PAGO_ANTICIPADO = 'vendorprepayment';
    const DIARIO = 'journalentry';
    const REC_CORRELATIVO_ORDEN_PAGO = 'customrecord_ts_correlativo_orden_pago';
    const REC_CAJA_CHICA = 'customrecord_pe_cajachica_er';
    const REC_NUMERO_ER = 'customrecord_pe_number_er';
    const GASTO = 'expense';
    const ITEM = 'item';
    const PENDIENTE_APROBAR_OP = 'Aprobación pendiente';
    const UNDEF_PE = 24204; // SB: 16503; PROD:24204
    const CONCEPTO_SIN_DETRACCION = 1;
    const CLIENTE_OTROS = 6116; // SB: 7655; PROD:6116
    const TIPO_ORDEN_CAJA_CHINA = '1';
    const TIPO_REPORTE_CAJA_CHICA = '1';
    const PT_Cuenta_Puente = '4680'; // SB: 4701; PROD: 4680
    const CTA_ANTICIPO_DOLARES = '4702';
    const MONEDA_SOLES = "5";
    const MONEDA_DOLARES = '2';
    var recCajaChina_id = '';
    const TIPO_REPORTE_ENTREGA_A_RENDIR = '2';
    const TIPO_ORDEN_PLANILLA = '2';
    const TIPO_REPORTE_REEMBOLSO_EMPLEADO = '3';
    const TIPO_REPORTTE_PAGO_DUA = '5';
    const CUENTA_RENTA_CUARTA_CATEGORIA = "137"; // SB: 137; PROD: 137
    const TAX_CODE_UNDEF = "5";

    function beforeLoad(context) {
        try {
        } catch (e) {
            log.error('Error en beforeLoad', e);
        }
    }

    function beforeSubmit(context) {
        var objRecord = context.newRecord;
        try {
            if (objRecord.type == record.Type.PURCHASE_ORDER) {
                actualizarMontoTotalPersonalizado(objRecord);
            }
        } catch (e) {
            log.error('Error en beforeSubmit', e);
        }
    }

    function roundTwoDecimal(value) {
        return Math.round(Number(value) * 100) / 100;
    }

    function afterSubmit(context) {
        const eventType = context.type;
        const oldObjRecord = context.oldRecord;
        log.error("eventType afterSubmit", eventType);
        log.error("runtime.executionContext", runtime.executionContext);
        try {
            if (eventType != context.UserEventType.DELETE) {
                const objRecord = context.newRecord;

                var recordId = objRecord.id;
                var recordLoad = '';
                if (eventType == context.UserEventType.PAYBILLS) {
                    updatePTImportePagado(objRecord);
                } else {
                    log.error("objRecord.type", objRecord.type);
                    // Ajuste de Redondeo para Detracción
                    if (objRecord.type == FACTURA_COMPRA) {
                        recordLoad = record.load({ type: objRecord.type, id: recordId, isDynamic: false });
                        const account_factura_compra = recordLoad.getValue('account');
                        const concepto_retencion = recordLoad.getValue('custbody_pe_concept_detraction');
                        const details_expense = recordLoad.getLineCount(GASTO);
                        const details_item = recordLoad.getLineCount(ITEM);
                        var currency = recordLoad.getValue('currency');

                        log.debug('concepto_retencion', concepto_retencion)
                        log.debug('details_expense', details_expense)
                        if (concepto_retencion) {

                            log.debug('MSK-concepto_retencion', concepto_retencion)
                            if (concepto_retencion != CONCEPTO_SIN_DETRACCION) {
                                const tipo_cambio_fc = recordLoad.getValue('exchangerate');
                                const rate_detraccion = recordLoad.getValue('custbody_pe_percentage_detraccion') * (0.01);
                                var subSearch = search.lookupFields({
                                    type: 'subsidiary',
                                    id: recordLoad.getValue('subsidiary'),
                                    columns: ['custrecord_pe_detraccion_account', 'custrecord_pe_detraccion_account_dol']
                                });
                                log.debug('MSK-currency', currency)
                                if (MONEDA_SOLES == currency) var account = subSearch.custrecord_pe_detraccion_account[0].value;
                                else var account = subSearch.custrecord_pe_detraccion_account_dol[0].value
                                log.debug('MSK-account', account)
                                log.debug(account);

                                if (details_expense > 0) {
                                    var total_expense_ret = 0;
                                    var total_amount = 0;
                                    for (var k = 0; k < details_expense; k++) {
                                        var manual_ret = recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_retencion_manual', line: k });
                                        var flag = recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_linea_ajuste_retencion', line: k });
                                        if (manual_ret == false) {
                                            var amount = roundTwoDecimal(recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'grossamt', line: k }) || 0);
                                            var monto_expense_ret_ln = recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'custcol_4601_witaxbamt_exp', line: k }) || 0;
                                            log.debug('Montos de columnas ' + k, amount + '->> ' + monto_expense_ret_ln);
                                            if (monto_expense_ret_ln != 0) {
                                                total_expense_ret += monto_expense_ret_ln;
                                            }
                                            total_amount = roundTwoDecimal(total_amount + amount);
                                            log.debug('Montos de Total ' + k, total_amount);
                                        }
                                    }
                                    log.debug('Montos previos', total_expense_ret + ' -> ' + rate_detraccion + ' -> ' + tipo_cambio_fc)
                                    const amount_ret_exp = Math.round(total_expense_ret * rate_detraccion * 100) / 100 * (-1);
                                    const amount_line_ret_expense = getResiduoRetencion(amount_ret_exp, tipo_cambio_fc);
                                    log.debug('Montos despues', amount_ret_exp + ' -> ' + amount_line_ret_expense);
                                    log.debug('Montos Cálculo', `${Math.abs(amount_line_ret_expense.toFixed(2))} - ${Math.abs(amount_line_ret_expense)} = ${Math.abs(amount_line_ret_expense.toFixed(2)) - Math.abs(amount_line_ret_expense)}`);
                                    const dif_redondeo = Math.abs(amount_line_ret_expense.toFixed(2)) - Math.abs(amount_line_ret_expense);
                                    log.debug('roundTwoDecimal', roundTwoDecimal(amount_line_ret_expense) + ' -> ' + UNDEF_PE + ' -> ' + recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'department', line: 0 }) + ' -> ' + recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'class', line: 0 }))
                                    if (amount_line_ret_expense != 0 && !flag) {
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'account', line: details_expense, value: account });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'amount', line: details_expense, value: roundTwoDecimal(amount_line_ret_expense) });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'taxcode', line: details_expense, value: UNDEF_PE });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'department', line: details_expense, value: recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'department', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'class', line: details_expense, value: recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'class', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'location', line: details_expense, value: recordLoad.getSublistValue({ sublistId: GASTO, fieldId: 'location', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_linea_ajuste_retencion', line: details_expense, value: true });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_detraccion_redondeo', line: details_expense, value: amount_line_ret_expense });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_diferencia_redondeo', line: details_expense, value: dif_redondeo });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_det_red_dec', line: details_expense, value: amount_line_ret_expense });
                                        recordLoad.setSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_dif_red_dec', line: details_expense, value: dif_redondeo });
                                    }
                                }

                                log.debug('MSK-details_item', details_item)
                                if (details_item > 0) {
                                    log.debug('Entro al item')
                                    var total_item_ret = 0;
                                    for (var k = 0; k < details_item; k++) {
                                        var manual_ret = recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'custcol_pe_retencion_manual', line: k });
                                        var flag = recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'custcol_pe_linea_ajuste_retencion', line: k });
                                        log.debug('manual', manual_ret)
                                        if (manual_ret == false) {
                                            var monto_item_ret_ln = recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'custcol_4601_witaxbaseamount', line: k }) || 0;
                                            log.debug('monnto', monto_item_ret_ln)
                                            if (monto_item_ret_ln != 0) {
                                                total_item_ret += monto_item_ret_ln
                                            }
                                        }
                                    }
                                    log.debug('monnto 2', total_item_ret)

                                    var discountitemSearchObj = search.create({
                                        type: "discountitem",
                                        filters:
                                            [
                                                ["type", "anyof", "Discount"],
                                                "AND",
                                                ["account", "anyof", account],
                                                "AND",
                                                ["isinactive", "is", false]
                                            ],
                                        columns:
                                            [
                                                search.createColumn({ name: "internalid", label: "Internal ID" })
                                            ]
                                    });

                                    var searchResultCount = discountitemSearchObj.run().getRange(0, 1);
                                    if (searchResultCount.length != 0) {
                                        var columns = searchResultCount[0].columns;
                                        var itemDis = searchResultCount[0].getValue(columns[0]);
                                    }
                                    log.debug('itemDis', itemDis)
                                    const amount_ret_item = total_item_ret * rate_detraccion * (-1);
                                    log.error("cálculo0", `${total_item_ret} * ${rate_detraccion * (-1)} = ${amount_ret_item}`);
                                    const amount_line_ret_item = getResiduoRetencion(amount_ret_item, tipo_cambio_fc);
                                    //log.error("amount_line_ret_expense", amount_line_ret_item);
                                    log.debug('flaaaaaaag', flag)
                                    if (amount_line_ret_item != 0 && !flag) {
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'item', line: details_item, value: itemDis });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'quantity', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'quantity', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'description', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'description', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'rate', line: details_item, value: amount_line_ret_item });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'taxcode', line: details_item, value: UNDEF_PE });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'department', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'department', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'class', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'class', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'location', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'location', line: 0 }) });
                                        recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'custcol_pe_linea_ajuste_retencion', line: details_item, value: true });
                                    }
                                }
                                recordLoad.save({ ignoreMandatoryFields: true, enableSourcing: false });
                            }
                        }

                        /*var reportType = objRecord.getValue('custbody_pe_report_type');
                        if (reportType == TIPO_REPORTTE_PAGO_DUA) {
                            var numeroEr = objRecord.getValue('custbody_pe_number_er');
                            var status = recordLoad.getText('status');
                            if (!numeroEr) return;
                            actualizarDUARelacionadaOrdenPagoYCheque(numeroEr, recordId, status)
                        }*/

                    }
                }
            }
            log.error("END afterSubmit", "END afterSubmit");
        } catch (e) {
            log.error('Error afterSubmit', e);
        }
    }

    function actualizarMontoTotalPersonalizado(objRecord) {
        var exchangerate = Number(objRecord.getValue('exchangerate'));
        var totalAmount = Number(objRecord.getValue('total'));
        var tcMonto = roundTwoDecimal(exchangerate * totalAmount);
        log.debug('tcMonto', tcMonto);
        //objRecord.setValue('custbody_pe_total_moneda_base', tcMonto);
        objRecord.setValue('custbody_pe_total_oc', tcMonto);
    }

    function actualizarDUARelacionadaOrdenPagoYCheque(numeroEr, billId, status, paymentId) {
        var searchResult = search.create({
            type: 'transaction',
            filters: [
                ['voided', 'is', 'F'], 'AND',
                ['mainline', 'is', 'T'], 'AND',
                ['custbody_pe_number_er', 'anyof', numeroEr], 'AND',
                ["type", "anyof", "VendPymt", "Check", "CuTrPrch107"],
            ],
            columns: [
                'type',
            ]
        }).run().getRange(0, 1000);
        var json = {
            VendPymt: record.Type.VENDOR_PAYMENT,
            Check: record.Type.CHECK,
            CuTrPrch: 'custompurchase_ev_payment_order'
        }
        for (var i = 0; i < searchResult.length; i++) {
            var type = json[searchResult[i].getValue('type')];
            var id = searchResult[i].id;
            log.error("id", id)
            if (id != paymentId) {
                record.submitFields({
                    type: type,
                    id: id,
                    values: {
                        'custbody_dua_relacionada': billId,
                        'custbody_pe_est_dua': status
                    }
                });

            }
        }
    }

    // OBTENCION DEL RESIDUO DE LA RETENCION
    function getResiduoRetencion(_total_retencion, _tipo_cambio) {
        try {
            const total_retencion_tc = _total_retencion * _tipo_cambio;
            log.error("cálculo1", `${_total_retencion} * ${_tipo_cambio} = ${total_retencion_tc}`);
            const total_redondeo = Math.round(Math.abs(total_retencion_tc)) * -1;
            log.error("cálculo2", total_redondeo);
            log.error("cálculo3", roundTwoDecimal(Math.abs(total_retencion_tc)));
            var total_resto = total_redondeo + roundTwoDecimal(Math.abs(total_retencion_tc));
            log.error("cálculo4", `${total_redondeo} + ${roundTwoDecimal(Math.abs(total_retencion_tc))} = ${total_resto}`);
            let total = total_resto / _tipo_cambio;
            log.error("cálculo5", `${total_resto} / ${_tipo_cambio} = ${total}`);
            return total;
        } catch (e) {
            log.error('Error en getResiduoRetencion', e);
        }
    }


    function updatePTImportePagado(_objRecord) {
        var appliedLines = _objRecord.getLineCount('apply');
        for (var i = 0; i < appliedLines; i++) {
            var applied = _objRecord.getSublistValue('apply', 'apply', i);
            if (!applied) continue;
            var transaccion_id = _objRecord.getSublistValue('apply', 'internalid', i);
            log.error("transaccion_id " + i, transaccion_id);

            var id = record.submitFields({
                type: FACTURA_COMPRA,
                id: transaccion_id,
                values: {
                    custbodype_importe_programado: ''
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
        }
    }


    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});