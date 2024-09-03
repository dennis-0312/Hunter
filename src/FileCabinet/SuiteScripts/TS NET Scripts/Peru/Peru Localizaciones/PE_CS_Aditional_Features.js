/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/runtime'], function (record, search, runtime) {

    const CHEQUE = 'check';
    const INFORME_GASTO = 'expensereport';
    const DEPOSITO = 'deposit';
    const FACTURA_COMPRA = 'vendorbill';
    const PAGO_FACTURA = 'vendorpayment';
    const GASTO = 'expense';
    const ITEM = 'item';
    const PAGO_ANTICIPADO = 'vendorprepayment';
    const DIARIO = 'journalentry';
    const ORDEN_PAGO = 'custompurchase_ev_payment_order';
    const RECORD_NUMBER_ER = 'customrecord_pe_number_er';
    const BUSQUEDA_FACTURAS_ER = 'customsearch_ts_consulta_facturas_er';
    const TIPO_ORDEN_CAJA_CHINA = '1';
    const TIPO_ORDEN_PLANILLA = '2';
    const TIPO_ORDEN_VIATICOS = '3';
    const TIPO_ORDEN_DE_PAGOS = '4';
    const FACTURA = 103;
    const RECIBO_HONORARIOS = 108;
    const NO_DOMICILIADO = 9;
    const TAX_E_PE = '9';
    const TAX_S_PE = '12';
    const TIPO_REPORTE_CAJA_CHICA = '1';
    const TIPO_REPORTE_ENTREGA_A_RENDIR = '2';
    const TIPO_REPORTE_REEMBOLSO_EMPLEADO = '3';
    const TIPO_REPORTE_ORDEN_PAGO = '4';
    const CUENTA_FONDO_SIN_DEPOSITAR = 122; //SB: 122; PROD: 122
    var resultChequeOP = {};
    var objKeyExpense = [];
    const ORDEN_COMPRA = 'purchaseorder';
    const PENDIENTE_APROBAR_OC = 1;
    const TIPO_DOCUMENTO_DUA = 19;
    const MONEDA_SOLES = '1';
    const MONEDA_DOLARES = '2';
    const CUENTA_RENTA_CUARTA_CATEGORIA = "4661"; // SB: 137; PROD: 4661
    const CUENTAS_ANTICIPO = ["4682", "4227"]; //SB: ["4591", "4702"] PROD: ["4682", "4227"]
    const VENTA_COMISION_ALIGNET = 1;
    const VENTA_DEPOSITO_RECAUDO = 2;

    function pageInit(context) {
        try {
            const currentRecord = context.currentRecord;
            const typeMode = context.mode;
            const typeTransaction = currentRecord.type;

            if (typeMode == 'edit' || typeMode == 'copy') {
                if (typeTransaction == FACTURA_COMPRA) {
                    var details_expense = currentRecord.getLineCount(GASTO);
                    const details_item = currentRecord.getLineCount(ITEM);
                    if (details_expense > 0) {
                        setTimeout(function () {
                            removeLinesAjusteRetencion(currentRecord, details_expense, GASTO);
                        }, 300)
                    }
                    if (details_item > 0) {
                        setTimeout(function () {
                            removeLinesAjusteRetencion(currentRecord, details_item, ITEM);
                        }, 300)
                    }
                } else if (typeTransaction == INFORME_GASTO) {
                    var details_expense = currentRecord.getLineCount(GASTO);
                    if (details_expense > 0) {
                        removeLinesRetencionHonorarios(currentRecord, details_expense, GASTO);
                    }
                }
            }


        } catch (e) {
            console.log('Error en pageInit', e);
        }

    }


    function removeLinesAjusteRetencion(_record, _details, _sublist) {
        try {
            for (var s = _details - 1; s >= 0; s--) {
                var is_line_ajuste_ret = _record.getSublistValue({ sublistId: _sublist, fieldId: 'custcol_pe_linea_ajuste_retencion', line: s });

                if (is_line_ajuste_ret) {
                    _record.removeLine({ sublistId: _sublist, line: s });
                }
            }
        } catch (e) {
            console.log('Error en removeLinesAjusteRetencion', e);
        }
    }

    function removeLinesRetencionHonorarios(_record, _details, _sublist) {
        try {
            for (var s = _details - 1; s >= 0; s--) {
                var account = _record.getSublistValue({ sublistId: _sublist, fieldId: 'expenseaccount', line: s });
                //console.log("account", account);
                if (account == CUENTA_RENTA_CUARTA_CATEGORIA) {
                    _record.removeLine({ sublistId: _sublist, line: s });
                }
            }

        } catch (e) {
            console.log('Error en removeLinesAjusteRetencion', e);
        }
    }




    return {
        pageInit: pageInit,
    }
});