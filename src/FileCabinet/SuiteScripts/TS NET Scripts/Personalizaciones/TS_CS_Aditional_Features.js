/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/runtime'], function (record, search, runtime) {

    const CHEQUE = 'check';
    const INFORME_GASTO = 'expensereport';
    const DEPOSITO = 'deposit';
    const FACTURA_COMPRA = 'vendorbill';
    const GASTO = 'expense';
    const ITEM = 'item';
    const PAGO_ANTICIPADO = 'vendorprepayment';
    const ORDEN_PAGO = 'custompurchase_ev_payment_order';
    const RECORD_NUMBER_ER = 'customrecord_pe_number_er';
    const BUSQUEDA_FACTURAS_ER = 'customsearch_ts_consulta_facturas_er';
    const TIPO_ORDEN_CAJA_CHINA = '1';
    const TIPO_ORDEN_PLANILLA = '2';
    const TIPO_ORDEN_VIATICOS = '3';
    const TIPO_ORDEN_DE_PAGOS = '4';
    const TAX_E_PE = '9';
    const TAX_S_PE = '12';
    const TIPO_REPORTE_CAJA_CHICA = '1';
    const TIPO_REPORTE_ENTREGA_A_RENDIR = '2';
    const TIPO_REPORTE_REEMBOLSO_EMPLEADO = '3';
    const CUENTA_FONDO_SIN_DEPOSITAR = 122;
    var resultChequeOP = {};
    var objKeyExpense = [];
    const ORDEN_COMPRA = 'purchaseorder';
    const SOLICTUD = 'purchaserequisition';
    const PENDIENTE_APROBAR_OC = 1;
    const TIPO_DOCUMENTO_DUA = 19;
    const MONEDA_SOLES = '1';
    const MONEDA_DOLARES = '2';

    function pageInit(context) {
        try {
            const currentRecord = context.currentRecord;
            const typeMode = context.mode;
            const typeTransaction = currentRecord.type;

            if (typeMode == 'create' || typeMode == 'copy') {
                if (typeTransaction == ORDEN_COMPRA || typeTransaction == SOLICTUD) {
                    currentRecord.setValue('approvalstatus', PENDIENTE_APROBAR_OC);
                    //} else if (typeTransaction == ORDEN_COMPRA) {
                    /*                  const details_expense_oc = currentRecord.getLineCount(GASTO);
                                        const details_item_oc = currentRecord.getLineCount(ITEM);
                    
                                        if (details_expense_oc > 0) {
                                            setLinesWhtTax(currentRecord, details_expense_oc, GASTO);
                                        }
                                        if (details_item_oc > 0) {
                                            setLinesWhtTax(currentRecord, details_item_oc, ITEM);
                                        } */

                } /* else if (typeTransaction == CHEQUE) {
                    if (currentRecord.getValue('entity').length != 0) {
                        currentRecord.setValue('custbody_pe_ent', currentRecord.getValue('entity'));
                    }
                } */

            } /* else if (typeMode == 'edit') {
                if (typeTransaction == FACTURA_COMPRA) {
                    const details_expense = currentRecord.getLineCount(GASTO);
                    const details_item = currentRecord.getLineCount(ITEM);
                    if (details_expense > 0) {
                        removeLinesAjusteRetencion(currentRecord, details_expense, GASTO);
                    }
                    if (details_item > 0) {
                        removeLinesAjusteRetencion(currentRecord, details_item, ITEM);
                    }
                }
            } */


        } catch (e) {
            console.log('Error en pageInit', e);
        }

    }

    // function saveRecord(context) {

    // }

    // function validateField(context) {

    // }

    // function fieldChanged(context) {
    //     const currentRecord = context.currentRecord;
    //     const sublistName = context.sublistId;
    //     const typeTransaction = currentRecord.type;
    //     const sublistFieldName = context.fieldId;
    //     const line = context.line;

    //     try {
    //         if (typeTransaction === CHEQUE || typeTransaction === INFORME_GASTO || typeTransaction === DEPOSITO) {
    //             if (sublistFieldName === 'custbody_ev_op_vinculada' && typeTransaction !== INFORME_GASTO) {

    //                 const op_id = currentRecord.getValue(sublistFieldName);
    //                 const resultNumberEr = consultaNumberEr(op_id);
    //                 currentRecord.setValue('custbody_pe_number_er', resultNumberEr.idRecNumberEr);
    //                 currentRecord.setValue('custbody_tipopago', resultNumberEr.tipoPago);
    //                 currentRecord.setValue('custbody_pe_report_type', resultNumberEr.tipoReporte);

    //                 if (typeTransaction == CHEQUE) {
    //                     const op_details = currentRecord.getLineCount(GASTO);
    //                     const op_details_item = currentRecord.getLineCount(ITEM);

    //                     for (var k = op_details - 1; k >= 0; k--) {
    //                         currentRecord.removeLine({ sublistId: GASTO, line: k, ignoreRecalc: true });
    //                     }

    //                     for (var m = op_details_item - 1; m >= 0; m--) {
    //                         currentRecord.removeLine({ sublistId: ITEM, line: m, ignoreRecalc: true });
    //                     }

    //                     const objOrdenPago = getInfoTransaccionRelacionada(op_id, ORDEN_PAGO);
    //                     //currentRecord.setValue('entity', objOrdenPago.vendor);
    //                     const objOrdenPagoLinesExp = objOrdenPago.linesExp;
    //                     const objOrdenPagoLinesItem = objOrdenPago.linesItem;
    //                     //console.log('objOrdenPago', objOrdenPago);

    //                     for (var key in objOrdenPagoLinesExp) {
    //                         var lineas = objOrdenPagoLinesExp[key];
    //                         currentRecord.selectNewLine({ sublistId: GASTO });
    //                         for (var col in lineas) {
    //                             currentRecord.setCurrentSublistValue({ sublistId: GASTO, fieldId: col, value: lineas[col], forceSyncSourcing: true });
    //                         }
    //                         currentRecord.commitLine({ sublistId: GASTO });
    //                     }

    //                     for (var key_i in objOrdenPagoLinesItem) {
    //                         var lineasItem = objOrdenPagoLinesItem[key_i];
    //                         currentRecord.selectNewLine({ sublistId: ITEM });
    //                         for (var colItem in lineasItem) {
    //                             currentRecord.setCurrentSublistValue({ sublistId: ITEM, fieldId: colItem, value: lineasItem[colItem], forceSyncSourcing: true });
    //                         }
    //                         currentRecord.commitLine({ sublistId: ITEM, ignoreRecalc: true });
    //                     }
    //                 }

    //             } else if (typeTransaction === INFORME_GASTO) {

    //                 if (sublistFieldName === 'custbody_pe_ov_vinculada') {
    //                     const op_id_ig = currentRecord.getValue(sublistFieldName);
    //                     const resultNumberEr_ig = consultaNumberEr(op_id_ig);
    //                     currentRecord.setValue('custbody_pe_number_er', resultNumberEr_ig.idRecNumberEr);
    //                     currentRecord.setValue('custbody_tipopago', resultNumberEr_ig.tipoPago);
    //                     currentRecord.setValue('custbody_pe_report_type', resultNumberEr_ig.tipoReporte);
    //                     resultChequeOP = searchChequeOP(op_id_ig);
    //                     currentRecord.setValue('advanceaccount', resultChequeOP.cuenta);

    //                 } else if (sublistFieldName === 'entity') {
    //                     const entity_cop = currentRecord.getValue(sublistFieldName);
    //                     currentRecord.setValue('custbody_pe_ent', entity_cop);

    //                 }

    //             }
    //         }

    //         if (typeTransaction == CHEQUE) {
    //             if (sublistFieldName == 'entity') {
    //                 currentRecord.setValue('custbody_pe_ent', currentRecord.getValue('entity'));
    //             }
    //         }

    //         if (typeTransaction == ORDEN_PAGO) {
    //             if (sublistName == GASTO) {
    //                 if (sublistFieldName === 'custcol_cuenta') {
    //                     const line_pe_cuenta = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: sublistFieldName });
    //                     currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'account', value: line_pe_cuenta });
    //                     //console.log('line_account_op', line_account_op);
    //                     //currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'account', value: CUENTA_FONDO_SIN_DEPOSITAR });
    //                     //currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'account', value: line_pe_cuenta });
    //                     //return true;

    //                 }

    //             }
    //         }
    //         if (typeTransaction == FACTURA_COMPRA) {
    //             cambioGastosImportacionImporteDolares(sublistName, sublistFieldName, line, currentRecord);
    //             copiarLineasOrdenCompraDua(sublistFieldName, currentRecord);
    //         }
    //         if (typeTransaction == PAGO_ANTICIPADO) {
    //             console.log('PAGO ANTICIPADO');
    //             var currencyId = currentRecord.getValue('currency');
    //             var subsidiaryId = currentRecord.getValue('subsidiary');
    //             console.log(currencyId + '-' + subsidiaryId)
    //             if (sublistFieldName == 'currency') {
    //                 var currencyId = currentRecord.getValue('currency');
    //                 var subsidiaryId = currentRecord.getValue('subsidiary');
    //                 if (!(subsidiaryId && currencyId)) return;
    //                 var cuentaAnticipo = obtenerCuentaAnticiposPorMoneda(subsidiaryId, currencyId);
    //                 if (!cuentaAnticipo) return;
    //                 currentRecord.setValue('custbody4', cuentaAnticipo);
    //             }

    //         }

    //     } catch (e) {
    //         console.log('Error en fieldChanged', e);
    //     }
    // }

    // function postSourcing(context) {
    //     try {
    //         const currentRecord = context.currentRecord;
    //         const sublistName = context.sublistId;
    //         const sublistFieldName = context.fieldId;
    //         const typeTransaction = currentRecord.type;

    //         if (typeTransaction === INFORME_GASTO) {
    //             if (sublistFieldName === 'advanceaccount') {
    //                 const op_id_ps = currentRecord.getValue('custbody_pe_ov_vinculada');
    //                 if (op_id_ps) {
    //                     if (sublistFieldName === 'advanceaccount') {
    //                         currentRecord.setValue('advance', resultChequeOP.monto);
    //                     }
    //                 }
    //             }
    //         }

    //     } catch (e) {
    //         console.log('Error en postSourcing', e);

    //     }

    // }

    // function lineInit(context) {

    // }

    // function validateDelete(context) {

    // }


    // function validateInsert(context) {
    // }

    // function validateLine(context) {
    //     const currentRecord = context.currentRecord;
    //     const sublistName = context.sublistId;

    //     try {
    //         const typeTransaction = currentRecord.type;
    //         const recordId = currentRecord.id;
    //         if (typeTransaction == INFORME_GASTO) {
    //             const entity = currentRecord.getValue('entity');
    //             var line = currentRecord.getCurrentSublistIndex(sublistName);
    //             if (sublistName == GASTO) {
    //                 const line_vendor = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_ln_vendor', line: line });
    //                 const line_vendor_txt = currentRecord.getCurrentSublistText({ sublistId: sublistName, fieldId: 'custcol_pe_ln_vendor', line: line });
    //                 const line_nmro_doc = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_ln_doc_num_iden', line: line });
    //                 //const line_taxcode = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'taxcode', line: line });
    //                 //const line_taxcode_txt = currentRecord.getCurrentSublistText({ sublistId: sublistName, fieldId: 'taxcode', line: line });
    //                 const line_taxrate = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'taxrate1', line: line });
    //                 const line_taxrate_txt = currentRecord.getCurrentSublistText({ sublistId: sublistName, fieldId: 'taxrate1', line: line });
    //                 const line_document_type = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_ln_document_type', line: line });
    //                 const line_document_type_txt = currentRecord.getCurrentSublistText({ sublistId: sublistName, fieldId: 'custcol_pe_ln_document_type', line: line });
    //                 const line_serie_cxp = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_ln_serie_cxp', line: line });
    //                 const line_number = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_ln_number', line: line });
    //                 const line_account = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'expenseaccount', line: line });

    //                 //const nkeyExpense = entity + '-' + line_vendor + '-' + line_nmro_doc + '-' + line_taxcode + '-' + line_taxrate + '-' + line_document_type + '-' + line_serie_cxp + '-' + line_number;
    //                 const nkeyExpense = line_vendor + '-' + line_nmro_doc + '-' + line_taxrate + '-' + line_document_type + '-' + line_serie_cxp + '-' + line_number + '-' + line_account;
    //                 console.log('nkeyExpense', nkeyExpense);

    //                 if (nkeyExpense) {
    //                     const busqFacturaLinea = search.load({ id: BUSQUEDA_FACTURAS_ER });
    //                     if (recordId) {
    //                         busqFacturaLinea.filters.push(search.createFilter({
    //                             name: 'internalid',
    //                             operator: search.Operator.NONEOF,
    //                             values: [recordId]
    //                         }));
    //                     }
    //                     busqFacturaLinea.filters.push(search.createFilter({
    //                         name: "formulatext",
    //                         formula: "CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT(CONCAT({custcol_pe_ln_vendor.internalid}, '-'), {custcol_pe_ln_doc_num_iden}),'-'), {taxitem.rate}), '-'), {custcol_pe_ln_document_type.internalid}), '-'), {custcol_pe_ln_serie_cxp}), '-'), {custcol_pe_ln_number}), '-'), {account.internalid})",
    //                         operator: search.Operator.IS,
    //                         values: [nkeyExpense]
    //                     }));

    //                     const resultFacturaLinea = (busqFacturaLinea.run().getRange(0, 1)).length;
    //                     // objKeyExpense.splice(line, 1);
    //                     // const existe_factura_er = objKeyExpense.includes(nkeyExpense);
    //                     // if (resultFacturaLinea == 0 && !existe_factura_er) {
    //                     if (resultFacturaLinea == 0) {
    //                         return true;

    //                     } else {
    //                         alert('Ya existe una línea con el valor para proveedor: ' + line_vendor_txt + ', nmro doc: ' + line_nmro_doc + ', tasa: ' + line_taxrate_txt + ', tipo doc: ' + line_document_type_txt + ', serie: ' + line_serie_cxp + ', nmro: ' + line_number);
    //                         return false;
    //                     }
    //                 }
    //             }
    //         } else if (typeTransaction == ORDEN_PAGO) {
    //             if (sublistName == GASTO) {
    //                 const line_pe_cuenta = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_cuenta' });
    //                 const line_account_op = currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'account' });
    //                 if (line_pe_cuenta != line_account_op) currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'account', value: CUENTA_FONDO_SIN_DEPOSITAR });
    //                 return true;

    //             }
    //         }
    //         return true;

    //     } catch (e) {
    //         console.log('Error en validateLine', e);
    //     }

    // }

    // function sublistChanged(context) {

    // }


    // function getInfoTransaccionRelacionada(_id_rec, _type) {
    //     try {

    //         var objRecordRel = {};
    //         var objRecordLinesExp = [];
    //         var objRecordLinesItem = [];
    //         var loadRecord = record.load({ type: _type, id: _id_rec, isDynamic: true });

    //         var tax_code = TAX_S_PE;
    //         const po_vendor = loadRecord.getValue('custbody_payee');
    //         const po_tipo_pago = loadRecord.getValue('custbody_tipopago');
    //         if (po_tipo_pago == TIPO_ORDEN_VIATICOS) tax_code = TAX_E_PE;

    //         objRecordRel.vendor = po_vendor;

    //         const lineDetailExp = loadRecord.getLineCount(GASTO);
    //         const lineDetailItem = loadRecord.getLineCount(ITEM);

    //         for (var i = 0; i < lineDetailExp; i++) {
    //             objRecordLinesExp.push({
    //                 'category': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'category', line: i }),
    //                 //'account': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'account', line: i }),
    //                 'account': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'custcol_cuenta', line: i }),
    //                 'memo': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'memo', line: i }),
    //                 'amount': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'amount', line: i }),
    //                 'taxcode': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'custcol1', line: i }),
    //                 'department': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'department', line: i }),
    //                 'class': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'class', line: i }),
    //                 'location': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'location', line: i }),
    //                 'customer': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'customer', line: i }),
    //                 'isbillable': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'isbillable', line: i }),
    //                 'custcol_npol': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'custcol_npol', line: i })
    //             });
    //         }


    //         for (var j = 0; j < lineDetailItem; j++) {
    //             objRecordLinesItem.push({
    //                 'item': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'item', line: j }),
    //                 'quantity': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'quantity', line: j }),
    //                 'units': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'units', line: j }),
    //                 'description': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'description', line: j }),
    //                 'rate': parseFloat(loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'rate', line: j })),
    //                 'amount': parseFloat(loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'amount', line: j })),
    //                 'taxcode': loadRecord.getSublistValue({ sublistId: GASTO, fieldId: 'custcol1', line: i }),
    //                 'department': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'department', line: j }),
    //                 'class': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'class', line: j }),
    //                 'location': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'location', line: j }),
    //                 'customer': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'customer', line: j }),
    //                 'isbillable': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'isbillable', line: j }),
    //                 'custcol_npol': loadRecord.getSublistValue({ sublistId: ITEM, fieldId: 'custcol_npol', line: j })
    //             });
    //         }

    //         objRecordRel.linesExp = objRecordLinesExp;
    //         objRecordRel.linesItem = objRecordLinesItem;

    //         return objRecordRel;

    //     } catch (e) {
    //         console.log('Error en getInfoTransaccionRelacionada', e);
    //     }
    // }


    // function consultaNumberEr(_id_op_vinculada) {
    //     try {
    //         var objNumberEr = {
    //             idRecNumberEr: '',
    //             tipoPago: '',
    //             tipoReporte: TIPO_REPORTE_ENTREGA_A_RENDIR
    //         };

    //         const numberDoc = search.lookupFields({
    //             type: ORDEN_PAGO,
    //             id: _id_op_vinculada,
    //             columns: ['tranid', 'recordtype', 'custbody_tipopago']
    //         });
    //         const doc_nmro = numberDoc['tranid'];
    //         const doc_type = numberDoc['recordtype'];
    //         const doc_tipo_pago = numberDoc['custbody_tipopago'][0].value;

    //         //if (doc_type == ORDEN_PAGO) {
    //         if (doc_tipo_pago) {

    //             objNumberEr.tipoPago = doc_tipo_pago;
    //             if (doc_tipo_pago == TIPO_ORDEN_CAJA_CHINA) {
    //                 objNumberEr.tipoReporte = TIPO_REPORTE_CAJA_CHICA;

    //             } else if (doc_tipo_pago == TIPO_ORDEN_PLANILLA) {
    //                 objNumberEr.tipoReporte = TIPO_REPORTE_REEMBOLSO_EMPLEADO;
    //             }

    //             var recNumberEr = search.create({
    //                 type: RECORD_NUMBER_ER,
    //                 filters:
    //                     [["isinactive", "is", "F"],
    //                         "AND",
    //                     ["name", "is", doc_nmro]],
    //                 columns: ["internalid"]
    //             });
    //             var searchResult = recNumberEr.run().getRange({ start: 0, end: 1 });
    //             if (searchResult.length != 0) {
    //                 objNumberEr.idRecNumberEr = searchResult[0].getValue("internalid");

    //             } else {
    //                 const userObj = runtime.getCurrentUser();
    //                 const recordNumberEr = record.create({ type: RECORD_NUMBER_ER, isDynamic: true });
    //                 recordNumberEr.setValue('name', doc_nmro);
    //                 recordNumberEr.setValue('custrecord_pe_employee', userObj.id);
    //                 recordNumberEr.setValue('custrecord_pe_report_type', objNumberEr.tipoReporte);
    //                 objNumberEr.idRecNumberEr = recordNumberEr.save({ ignoreMandatoryFields: true, enableSourcing: false });
    //                 window.location.reload();
    //             }
    //         }
    //         return objNumberEr;

    //     } catch (e) {
    //         console.log('Error en searchNumberEr', e);
    //     }
    // }


    // function removeLinesAjusteRetencion(_record, _details, _sublist) {
    //     try {
    //         for (var s = _details - 1; s >= 0; s--) {
    //             const is_line_ajuste_ret = _record.getSublistValue({ sublistId: _sublist, fieldId: 'custcol_ts_linea_ajuste_retencion', line: s });
    //             if (is_line_ajuste_ret) {
    //                 _record.removeLine({ sublistId: _sublist, line: s });
    //                 break;
    //             }
    //         }

    //     } catch (e) {
    //         console.log('Error en removeLinesAjusteRetencion', e);
    //     }
    // }


    // function setLinesWhtTax(_record, _details, _sublist) {
    //     try {
    //         for (var b = 0; b < _details; b++) {
    //             _record.setSublistValue({ sublistId: _sublist, fieldId: 'custcol_4601_witaxapplies', line: b, value: true });
    //         }

    //     } catch (e) {
    //         console.log('Error en setLinesWhtTax', e);
    //     }
    // }


    // function searchChequeOP(_id_op) {
    //     var objCheckOP = {
    //         "empleado": '',
    //         "cuenta": '',
    //         "monto": 0.00
    //     }

    //     try {
    //         const checkOP = search.create({
    //             type: CHEQUE,
    //             filters:
    //                 [
    //                     ["type", "anyof", "Check"],
    //                     "AND",
    //                     ["custbody_ev_op_vinculada", "anyof", _id_op],
    //                     "AND",
    //                     ["taxline", "is", "F"],
    //                     "AND",
    //                     //["formulanumeric: {amount}", "greaterthanorequalto", "0"]
    //                     ["mainline", "is", "F"]

    //                 ],
    //             columns:
    //                 [
    //                     search.createColumn({
    //                         name: "internalid",
    //                         join: "employee"
    //                     }),
    //                     "account",
    //                     "amount"
    //                 ]
    //         });
    //         const searchResultOP = checkOP.run().getRange({ start: 0, end: 1 });
    //         if (searchResultOP.length > 0) {
    //             objCheckOP.empleado = searchResultOP[0].getValue(checkOP.columns[0]);
    //             objCheckOP.cuenta = searchResultOP[0].getValue(checkOP.columns[1]);
    //             objCheckOP.monto = Math.abs(searchResultOP[0].getValue(checkOP.columns[2]));
    //         }
    //         return objCheckOP;

    //     } catch (e) {
    //         console.log('Error en searchChequeOP', e);
    //     }
    // }

    // function cambioGastosImportacionImporteDolares(sublistName, sublistFieldName, line, currentRecord) {
    //     //console.log('cambioGastosImportacionImporteDolares');
    //     //console.log('sublistFieldName', sublistFieldName);
    //     if (sublistName == GASTO || sublistName == ITEM) {
    //         const actualizaValorCIF = ['custcolpe_imp_dolares', 'custcol_pe_flete_dua', 'custcol_pe_seguro_dua'];
    //         const actualizarValorCIFADVDUA = ['custcolpe_imp_dolares', 'custcol_pe_flete_dua', 'custcol_pe_seguro_dua', 'custcol_pe_advaloren_dua'];
    //         const actualizarImporte = ['custcol_pe_flete_dua', 'custcol_pe_advaloren_dua']

    //         var line_importeFOB = Number(currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcolpe_imp_dolares', line: line }) || 0);
    //         var line_fleteDUA = Number(currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_flete_dua', line: line }) || 0);
    //         var line_seguroDUA = Number(currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_seguro_dua', line: line }) || 0);
    //         var line_adValoremDUA = Number(currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_advaloren_dua', line: line }) || 0);
    //         var line_valorCIFDUA = 0, line_valorCIFADVDUA = 0;

    //         if (actualizarValorCIFADVDUA.indexOf(sublistFieldName) >= 0) {
    //             line_valorCIFDUA = line_importeFOB + line_fleteDUA + line_seguroDUA;
    //             //console.log('line_valorCIFDUA', line_valorCIFDUA);
    //             currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_valor_cif_dua', value: line_valorCIFDUA, forceSyncSourcing: true });
    //         }
    //         if (actualizarValorCIFADVDUA.indexOf(sublistFieldName) >= 0) {
    //             line_valorCIFADVDUA = line_valorCIFDUA + line_adValoremDUA;
    //             //console.log('line_valorCIFADVDUA', line_valorCIFADVDUA);
    //             currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_cif_adv_usd_dua', value: line_valorCIFADVDUA, forceSyncSourcing: true });
    //         }
    //         var custom_exchange_rate = Number(currentRecord.getValue('exchangerate'));

    //         if (actualizarImporte.indexOf(sublistFieldName) >= 0) {
    //             //console.log("line_fleteDUA + line_seguroDUA + line_adValoremDUA", line_fleteDUA + line_seguroDUA + line_adValoremDUA);
    //             var importe = redondearDosDecimales((line_fleteDUA + line_adValoremDUA));
    //             //console.log('importe', importe);
    //             currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'amount', value: importe, forceSyncSourcing: true });
    //         }
    //         if (sublistFieldName == 'amount' || sublistFieldName == 'custcol_pe_cif_adv_usd_dua'/* && line_adValoremDUA > 0*/) {
    //             var line_PTCIVAdvDuaUsd = line_importeFOB + line_fleteDUA + line_seguroDUA + line_adValoremDUA;
    //             //console.log('line_PTCIVAdvDuaUsd', line_PTCIVAdvDuaUsd);
    //             if (line_PTCIVAdvDuaUsd <= 0) return;
    //             //console.log("taxRate", currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'taxrate1', line: line }));
    //             var taxRate = Number(currentRecord.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'taxrate1', line: line })) / 100;
    //             //console.log("taxRate", taxRate);
    //             var taxamount = redondearDosDecimales(line_PTCIVAdvDuaUsd * taxRate);
    //             currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'tax1amt', value: taxamount, forceSyncSourcing: true });
    //         }
    //         if (custom_exchange_rate <= 0) return;
    //         //console.log('custom_exchange_rate', custom_exchange_rate)
    //         if (line_valorCIFADVDUA > 0) {
    //             var line_valorCIFADVALOREMDUA = redondearDosDecimales(line_valorCIFADVDUA * custom_exchange_rate);
    //             //console.log('line_valorCIFADVALOREMDUA', line_valorCIFADVALOREMDUA);
    //             currentRecord.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_pe_valor_cif_advalorem_dua', value: line_valorCIFADVALOREMDUA, forceSyncSourcing: true });
    //         }
    //     }

    //     if (sublistFieldName == "exchangerate") {
    //         var custom_exchange_rate = currentRecord.getValue('exchangerate');
    //         if (custom_exchange_rate < 0) return;
    //         //console.log("custom_exchange_rate", custom_exchange_rate);
    //         const details_expense_oc = currentRecord.getLineCount(GASTO);
    //         //console.log("details_expense_oc", details_expense_oc);
    //         for (var i = 0; i <= details_expense_oc; i++) {
    //             currentRecord.selectLine(GASTO, i);
    //             var line_importeFOB = Number(currentRecord.getCurrentSublistValue({ sublistId: GASTO, fieldId: 'custcolpe_imp_dolares', line: i }));
    //             var line_fleteDUA = Number(currentRecord.getCurrentSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_flete_dua', line: i }));
    //             var line_seguroDUA = Number(currentRecord.getCurrentSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_seguro_dua', line: i }));
    //             var line_adValoremDUA = Number(currentRecord.getCurrentSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_advaloren_dua', line: i }));

    //             var line_valorCIFADVDUA = line_importeFOB + line_fleteDUA + line_seguroDUA + line_adValoremDUA;
    //             if (line_valorCIFADVDUA > 0) {
    //                 var line_valorCIFADVALOREMDUA = redondearDosDecimales(line_valorCIFADVDUA * custom_exchange_rate);
    //                 //console.log('line_valorCIFADVALOREMDUA', line_valorCIFADVALOREMDUA);
    //                 currentRecord.setCurrentSublistValue({ sublistId: GASTO, fieldId: 'custcol_pe_valor_cif_advalorem_dua', value: line_valorCIFADVALOREMDUA, forceSyncSourcing: true });
    //             }
    //             /*
    //             var importe = line_fleteDUA + line_seguroDUA + line_adValoremDUA;
    //             if (importe > 0) {
    //                 var importe = redondearDosDecimales(importe * custom_exchange_rate);
    //                 console.log('importe',importe);
    //                 currentRecord.setCurrentSublistValue({ sublistId: GASTO, fieldId: 'amount', value: importe, forceSyncSourcing: true });
    //             }*/
    //             currentRecord.commitLine(GASTO);
    //         }
    //     }
    // }

    // function redondearDosDecimales(numero) {
    //     return (Math.round(numero * 100) / 100);
    // }

    // function copiarLineasOrdenCompraDua(fieldId, currentRecord) {
    //     try {
    //         if (fieldId != 'custbody_pe_orden_compra_dua') return;
    //         var ordenCompra = currentRecord.getValue(fieldId);
    //         if (!ordenCompra) return;
    //         var resultSearch = search.create({
    //             type: "transaction",
    //             filters: [
    //                 ["mainline", "is", "F"],
    //                 "AND",
    //                 ["taxline", "is", "F"],
    //                 "AND",
    //                 ["internalidnumber", "equalto", ordenCompra]
    //             ],
    //             columns: [
    //                 search.createColumn({ name: "item", label: "Item" }),
    //                 search.createColumn({ name: "quantity", label: "Quantity" }),
    //                 search.createColumn({ name: "fxrate", label: "Item Rate" }),
    //                 search.createColumn({ name: "fxamount", label: "Amount" }),
    //                 search.createColumn({ name: "department", label: "Department" }),
    //                 search.createColumn({ name: "class", label: "Class" }),
    //                 search.createColumn({ name: "location", label: "Location" })
    //             ]
    //         }).run().getRange(0, 1000);
    //         if (resultSearch) {
    //             console.log('recorrer busqueda');
    //             for (var i = 0; i < resultSearch.length; i++) {
    //                 currentRecord.selectNewLine({ sublistId: ITEM });
    //                 var columns = resultSearch[i].columns;
    //                 var json = {};
    //                 json.item = resultSearch[i].getValue(columns[0]);
    //                 json.quantity = resultSearch[i].getValue(columns[1]);
    //                 json.rate = resultSearch[i].getValue(columns[2]);
    //                 json.custcolpe_imp_dolares = resultSearch[i].getValue(columns[3]);
    //                 json.amount = 0;
    //                 json.department = resultSearch[i].getValue(columns[4]);
    //                 json.class = resultSearch[i].getValue(columns[5]);
    //                 json.location = resultSearch[i].getValue(columns[6]);
    //                 setLineInItem(currentRecord, json);
    //             }
    //         }
    //     } catch (error) {
    //         console.log("There was an error", error);
    //     }
    // }

    // function setLineInItem(currentRecord, json) {
    //     for (var key in json) {
    //         currentRecord.setCurrentSublistValue({ sublistId: ITEM, fieldId: key, value: json[key], forceSyncSourcing: true });
    //     }
    //     currentRecord.commitLine({ sublistId: ITEM });
    // }

    // function obtenerCuentaAnticiposPorMoneda(subsidiaryId, currencyId) {
    //     var subsidiaryRecord = record.load({
    //         type: record.Type.SUBSIDIARY,
    //         id: subsidiaryId
    //     });
    //     if (currencyId == MONEDA_SOLES) return subsidiaryRecord.getValue({ fieldId: 'VENDORPREPAYMENTACCOUNT' });
    //     if (currencyId == MONEDA_DOLARES) return subsidiaryRecord.getValue({ fieldId: 'custrecord_anticipo_prov_dolares' });
    //     return '';
    // }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // // lineInit: lineInit,
        // // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});