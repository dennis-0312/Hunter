/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/search', 'N/file', 'N/runtime'], function (record, log, search, file, runtime) {
    const PE_FEL_Sending_Method = 4; //SB: 6    Prod: 4
    const PE_FEL_Template = 1; //SB: 4    Prod: 1
    const ID_TAXCODE = 24204;   //SB: 16503    Prod: 24204 

    function beforeSubmit(context) {
        try {
            log.error('Init', 'Proccess');
            var COD_RETENCION_IMPUESTOS = runtime.getCurrentScript().getParameter({ name: 'custscript_pe_ue_retencion_cod' });
            var TIPO_COMPROBANTE_RET = runtime.getCurrentScript().getParameter({ name: 'custscript_pe_ue_retencion_type_doc' })
            var CUSTOM_FORM_RETENCION = runtime.getCurrentScript().getParameter({ name: 'custscript_pe_ue_retencion_form' });
            var RECORD_SERIE_RETENCION = runtime.getCurrentScript().getParameter({ name: 'custscript_pe_ue_retencion_serie' });
            var CUENTA_CONTABLE = runtime.getCurrentScript().getParameter({ name: 'custscript_pe_ue_retencion_account' });
            CUENTA_CONTABLE = '5286'; //401141 IGV-REGIMEN DE RETENCIONES    SB: 5677     Prod: 5286
            TIPO_COMPROBANTE_RET = '59';   //  SB: 210     Prod: 59
            CUSTOM_FORM_RETENCION = '167'; //Formulario    SB: 179     Prod: 167
            COD_RETENCION_IMPUESTOS = '210' //SB: 123     Prod: 210
            //Pago Individual btn Realizar pago, Pago Individual pagar a un proveedor, Pago masivo TEF
            //Pago Masivo pagar facturas
            log.error('context.type', context.type);
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.PAYBILLS || context.type === context.UserEventType.EDIT) {
                log.error('MSK', 'Entré al IF');
                //!1.0 Recuperando la data del Pago
                let generaComprobanteRetencion = false;
                let total_retencion = 0;
                let memo = ''

                //let currentRecord = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true });//Mucho mejor, todos los campos ya están seteados
                let currentRecord = context.newRecord;//Toma los datos del pago, pero todos no están seteados (transactionnumber por ejemplo aun no está seteado)
                var entity = currentRecord.getValue('entity');
                var exchangerate = currentRecord.getValue('exchangerate');//TIPO CAMBIO
                var currency = currentRecord.getValue('currency'); //1 : Soles   2: Dolares
                var department = currentRecord.getValue('department');
                var class_ = currentRecord.getValue('class');
                var location = currentRecord.getValue('location');
                var transactionnumber = currentRecord.getValue('transactionnumber');
                var applyCount = currentRecord.getLineCount({ sublistId: 'apply' });
                var subsidiary = currentRecord.getValue('subsidiary');
                var total_documento_pago = currentRecord.getValue('total');
                var total_documento_pago_soles = parseFloat(total_documento_pago) * parseFloat(exchangerate);
                var total_facturas_involucradas = 0;
                var cuenta = currentRecord.getValue('apacct');
                var searchLoadSubsidiaria = search.create({
                    type: 'subsidiary', filters: [
                        ['internalid', 'is', subsidiary]
                    ],
                    columns: [
                        'custrecord_pe_is_wht_agent',
                        'custrecord_pe_detraccion_account',
                        'custrecord_pe_detraccion_account_dol'
                    ]
                });
                log.error('MSK', 'traza 1');
                const searchResultSubsidiaria = searchLoadSubsidiaria.run().getRange({ start: 0, end: 1 });
                let custrecord_pe_is_wht_agent = searchResultSubsidiaria[0].getValue(searchLoadSubsidiaria.columns[0]);
                var cuenta_soles = searchResultSubsidiaria[0].getValue(searchLoadSubsidiaria.columns[1]);
                var cuenta_dolares = searchResultSubsidiaria[0].getValue(searchLoadSubsidiaria.columns[2]);
                log.error('MSK', 'custrecord_pe_is_wht_agent (' + subsidiary + ') = ' + custrecord_pe_is_wht_agent);
                if (custrecord_pe_is_wht_agent == "true" || custrecord_pe_is_wht_agent == true) {
                    log.error('MSK', 'subsidiary = ' + subsidiary + ' --> - Aplica Retención');
                    //!1.1 Recuperando datos del Vendor
                    vendorRecord = record.load({ type: record.Type.VENDOR, id: entity, isDynamic: true });
                    var CodRetencionImpuestos = vendorRecord.getValue({ fieldId: 'custentity_4601_defaultwitaxcode' });
                    log.error('MSK', 'CodRetencionImpuestos [VendorId=' + entity + ']: ' + CodRetencionImpuestos);
                    //Proveedor tiene código de retención de impuesto (RETIGV:3%)
                    if (CodRetencionImpuestos == COD_RETENCION_IMPUESTOS) {
                        // log.error('MSK', 'traza 1');
                        //!1.2 Recuperando los Items que se pagaron
                        let referencias = []
                        log.error('applyCount', applyCount);
                        for (var i = 0; i < applyCount; i++) {
                            // log.error('MSK', 'traza 3 -> i='+i);
                            var apply = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                            var trantype = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'trantype', line: i });
                            var idFactura = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i });
                            var refnum = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'refnum', line: i });
                            var total = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'total', line: i });
                            var amount = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: i });
                            var fec_emi_fc = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'applydate', line: i });

                            log.error('apply', apply);
                            // log.error('MSK', 'traza 4 -> i='+i);
                            if ((apply == true || apply == "T") && trantype == 'VendBill') {
                                let referencia = {}
                                referencia.line = i
                                referencia.amount = amount
                                referencia.trantype = trantype
                                referencia.id = idFactura
                                referencia.refnum = refnum
                                //referencia.importe_original_soles = (parseFloat(total) * parseFloat(exchangerate)).toFixed(2)
                                //referencia.importe_pagado_soles = (parseFloat(amount) * parseFloat(exchangerate)).toFixed(2)
                                referencia.importe_original_soles = (parseFloat(total)).toFixed(2)
                                referencia.importe_pagado_soles = (parseFloat(amount)).toFixed(2)
                                referencia.fec_emi_fc = fec_emi_fc
                                referencias.push(referencia)
                                log.error('referencia qq', referencia);
                                log.error('referencias', referencias);
                                total_facturas_involucradas = parseFloat(total_facturas_involucradas) + parseFloat(referencia.importe_original_soles);
                                log.error('MSK', 'refnum=' + refnum + ', referencia.importe_original_soles =' + referencia.importe_original_soles);

                            }
                            log.error('total_facturas_involucradas', total_facturas_involucradas);

                        }
                        log.error('referencias final', referencias);

                        if (total_facturas_involucradas >= 700) {
                            //!1.3 Recorriendo los Items que se pagaron y recuperando los periodos
                            for (var i = 0; i < referencias.length; i++) {
                                // log.error('MSK', 'mi traza 1-> i='+i);
                                log.error('Track', 'Step 1');
                                let aplica_retencion = false;
                                let retencion_item = 0
                                let suma_periodo = 0;
                                let id_factura_actual = referencias[i].id
                                let esFacturaDetraccion = false
                                // log.error('MSK', 'mi traza 2-> i='+i);
                                if (referencias[i].trantype == 'VendBill') {
                                    log.error('Track', 'Step 2');
                                    vendorBillRecord = record.load({ type: record.Type.VENDOR_BILL, id: referencias[i].id });
                                    // log.error('MSK', 'mi traza 3-> i='+i);
                                    var periodo = vendorBillRecord.getValue({ fieldId: 'postingperiod' });
                                    var periodoDescripcion = vendorBillRecord.getText({ fieldId: 'postingperiod' });
                                    var trandate = vendorBillRecord.getText({ fieldId: 'trandate' });
                                    referencias[i].periodo_cod = periodo
                                    referencias[i].periodo_des = periodoDescripcion
                                    referencias[i].trandate = trandate
                                }
                                log.error('Track', 'Step 3');
                                // log.error('MSK', 'mi traza 4-> i='+i);

                                if (referencias[i].periodo_des != null && referencias[i].periodo_des != "") {
                                    //!1.3.1 Verificar si para ese periodo se aplica o no retención
                                    log.error('Track', 'Step 4');
                                    // log.error('MSK', 'mi traza 4-> i='+i);
                                    //!1.3.1.1 - Recorriendo Facturas de Detracción
                                    var facturaSearch_det = search.load({ id: 'customsearch_pe_facturas_proveedor_det_2' });
                                    facturaSearch_det.filters.push(search.createFilter({ name: 'entity', operator: search.Operator.IS, values: entity }));
                                    facturaSearch_det.filters.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.IS, values: referencias[i].periodo_cod }));
                                    var resultSet_det = facturaSearch_det.run();
                                    let contador_det = 0;
                                    let lst_facturas_detraccion = []
                                    log.error('Track', 'Step 5');
                                    resultSet_det.each(function (result) {
                                        log.error('Track', 'Step 6');
                                        contador_det++;
                                        var internalid = result.getValue({ name: 'internalid', summary: search.Summary.GROUP });
                                        if (id_factura_actual == internalid) {
                                            esFacturaDetraccion = true;
                                        }
                                        lst_facturas_detraccion.push(internalid)
                                        return true;
                                    });
                                    log.error('Track', 'Step 7');
                                    // log.error('MSK', "lst_facturas_detraccion = " + lst_facturas_detraccion)
                                    referencias[i].esFacturaDetraccion = esFacturaDetraccion
                                    log.error('esFacturaDetraccion', esFacturaDetraccion)
                                    if (!esFacturaDetraccion) {
                                        aplica_retencion = true;//item
                                        generaComprobanteRetencion = true;//general
                                        total_retencion = total_retencion + parseFloat(referencias[i].importe_pagado_soles) * 0.03;
                                        retencion_item = (parseFloat(referencias[i].importe_pagado_soles) * 0.03).toFixed(2)
                                    }
                                }
                                referencias[i].aplica_retencion = aplica_retencion
                                referencias[i].retencion_item = retencion_item
                            }

                            log.error('referencias', referencias);

                            // //!2.0 Registrando el Comprobante de Retención
                            if (generaComprobanteRetencion) {
                                log.error('MSK', 'Se creará Comprobante Retencion');
                                total_retencion = total_retencion.toFixed(2)
                                var vendorCredit = record.create({
                                    type: record.Type.VENDOR_CREDIT,
                                    isDynamic: true
                                });

                                log.error('cuenta', cuenta);
                                vendorCredit.setValue('customform', CUSTOM_FORM_RETENCION); // ID interno del formulario personalizado para "PE Comprobante de Retención" 129->313
                                vendorCredit.setValue('entity', entity); // Proveedor
                                vendorCredit.setValue('account', cuenta);
                                vendorCredit.setValue('subsidiary', subsidiary);
                                vendorCredit.setValue('custbody_pe_document_type', TIPO_COMPROBANTE_RET); // Tipo Comprobante -> Retención
                                vendorCredit.setValue('total', total_retencion); // Total del comprobante
                                vendorCredit.setValue('memo', transactionnumber); // descripcion
                                vendorCredit.setValue('currency', currency);//Moneda Simpre en soles
                                //vendorCredit.setValue('currency', 1);//Moneda Simpre en soles

                                //!2.1 Buscar el correativo
                                //var recordId = RECORD_SERIE_RETENCION;//Id correspondiente a serie de Retención
                                //PE TIPO DE DOCUMENTO SERIE (Comprobante de Retencion): 16

                                searchLoad = search.create({
                                    type: 'customrecord_pe_serie', filters: [
                                        ['custrecord_pe_tipo_documento_serie', 'is', TIPO_COMPROBANTE_RET],
                                        'AND',
                                        ['custrecord_pe_location', 'is', location],
                                        'AND',
                                        ['custrecord_pe_subsidiaria', 'is', subsidiary]
                                    ],
                                    columns: [
                                        'custrecord_pe_serie_impresion',
                                        'custrecord_pe_inicio',
                                        'internalid'
                                    ]
                                });
                                log.error('MSK', 'traza 1');
                                const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                                let serie = searchResult[0].getValue(searchLoad.columns[0]);
                                let correlativo = (searchResult[0].getValue(searchLoad.columns[1]) + "").padStart(8, '0');
                                let corrltv = parseInt(searchResult[0].getValue(searchLoad.columns[1]));
                                var recordId = searchResult[0].getValue(searchLoad.columns[2]);
                                var record1 = record.load({ type: 'customrecord_pe_serie', id: recordId });
                                record1.setValue({ fieldId: 'custrecord_pe_inicio', value: (corrltv + 1) + "" });
                                record1.save();
                                log.error('MSK', 'traza 2');

                                //!2.2 Llenando el correlativo
                                let location_value = location
                                vendorCredit.setValue('custbody_pe_serie_cxp', serie);
                                vendorCredit.setValue('custbody_pe_number', correlativo);
                                vendorCredit.setValue('location', location_value);
                                vendorCredit.setValue('tranid', serie + "-" + correlativo);

                                log.error('MSK', 'traza 3->' + serie + '|' + correlativo + '|' + 5 + '|' + serie + "-" + correlativo);
                                log.error('referencias', referencias)
                                log.error('segmentación', `${department} - ${class_}`)
                                referencias.forEach(function (dataItem) {
                                    log.error('dataItem.aplica_retencion', dataItem.aplica_retencion);
                                    if (dataItem.aplica_retencion) {
                                        log.error('MSK', 'traza 3.1');
                                        vendorCredit.selectNewLine({ sublistId: 'expense' });
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'account', value: CUENTA_CONTABLE }); // ID de cuenta contable para el gasto
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: dataItem.retencion_item }); // Monto del gasto
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: ID_TAXCODE }); // Tipo Impuesto
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'department', value: department });
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'class', value: class_ });
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: location_value });//Obligatorio en TSNET

                                        log.error('MSK', 'traza 3.2');
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_factura_ln', value: dataItem.refnum });
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcolpe_imp_original_ln', value: dataItem.importe_original_soles });
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_imp_pagado_ln', value: dataItem.importe_pagado_soles });
                                        vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_ln_fec_emi_fc', value: dataItem.fec_emi_fc });
                                        log.error('MSK', 'traza 3.3');
                                        vendorCredit.commitLine({ sublistId: 'expense' });

                                        log.error('MSK', 'traza 4');
                                        //!20230831
                                        var amount_sin_retencion = (0.97 * parseFloat(dataItem.amount)).toFixed(2)
                                        log.error('MSK', 'refnum=' + dataItem.refnum + ', amount-antes=' + dataItem.amount + ', amount_sin_retencion=' + amount_sin_retencion)
                                        //currentRecord.selectLine({ sublistId: 'apply', line: dataItem.line });
                                        //currentRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount_sin_retencion });
                                        currentRecord.setSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount_sin_retencion, line: dataItem.line });
                                        //currentRecord.commitLine({ sublistId: 'apply' });
                                        log.error('MSK', 'cambio OK')
                                        log.error('MSK', 'traza 5');
                                    }
                                });

                                log.error('MSK', 'Antes de actualizar documento de pago')
                                vendorCredit.setValue('custbody_psg_ei_template', PE_FEL_Template);
                                log.error('1', '1')
                                vendorCredit.setValue('custbody_psg_ei_sending_method', PE_FEL_Sending_Method);
                                log.error('2', '2')
                                vendorCredit.setValue('custbody_psg_ei_status', 1);
                                log.error('3', '3')
                                //currentRecord.save()
                                log.error('MSK', 'Despues de actualizar documento de pago')
                                var vendorCreditId = vendorCredit.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                log.error('MSK', 'Se creó Comprobante de Retención [' + vendorCreditId + '] -> ' + serie + '-' + correlativo);

                                //!APPLY
                                log.error('MSK', 'Vamos a modificar el documento de retención');
                                var vendorCreditUpd = record.load({
                                    type: record.Type.VENDOR_CREDIT, // Tipo de registro Vendor Credit
                                    id: vendorCreditId, // Reemplaza con el ID de tu registro Vendor Credit
                                    isDynamic: true
                                });
                                log.error('MSK', 'previo a applyCount');
                                var applyCount = vendorCreditUpd.getLineCount({ sublistId: 'apply' });
                                log.error('MSK', 'applyCount=' + applyCount);
                                var contadorRef = 0
                                referencias.forEach(function (dataItem) {
                                    log.error('MSK', 'referencias[' + contadorRef + ']');
                                    if (dataItem.aplica_retencion) {
                                        for (var i = 0; i < applyCount; i++) {
                                            log.error('MSK', 'dataItem[' + i + ']');
                                            var refnum = vendorCreditUpd.getSublistValue({ sublistId: 'apply', fieldId: 'refnum', line: i });
                                            var trantype = vendorCreditUpd.getSublistValue({ sublistId: 'apply', fieldId: 'trantype', line: i });
                                            var isApplied = vendorCreditUpd.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                                            log.error('MSK', 'refnum=' + refnum + ', isApplied=' + isApplied);
                                            log.error('MSK', 'refnum=' + refnum + ", trantype=" + trantype);
                                            log.error('dataItem.refnum', dataItem.refnum);
                                            log.error('trantype', trantype);

                                            if (refnum === dataItem.refnum && trantype === "VendBill") {
                                                log.error('MSK', 'isApplied=' + isApplied);
                                                if (!isApplied) {
                                                    // Selecciona la línea antes de establecer los valores
                                                    vendorCreditUpd.selectLine({ sublistId: 'apply', line: i });

                                                    // Establece los valores
                                                    vendorCreditUpd.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                                                    vendorCreditUpd.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: dataItem.retencion_item });

                                                    // Guarda la línea modificada
                                                    vendorCreditUpd.commitLine({ sublistId: 'apply' });

                                                    log.error('MSK', 'Aplicar a ' + dataItem.refnum + ", monto:" + dataItem.retencion_item);
                                                } else {
                                                    log.error('MSK', 'La factura ya ha sido aplicada: ' + dataItem.refnum);
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    contadorRef++
                                });

                                var vendorCreditId = vendorCreditUpd.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                log.error('MSK', 'Documento de Retención Modificado');

                            } else {
                                log.error('MSK', 'No se creará Comprobante Retencion, todas las facturas pagadas tienen detracción');
                            }
                        } else {
                            log.error('MSK', 'No se creará Comprobante Retencion, el total de facturas involucradas no supera los 700');
                        }

                    } else {
                        log.error('MSK', 'No aplica retención');
                    }
                } else {
                    log.error('MSK', 'subsidiary == ' + subsidiary + ' --> No Aplica');
                }

            } else {
                log.error('MSK', 'NO Entré al IF');
            }
        } catch (error) {
            log.error('Error al crear el crédito de factura', error.message);
        }
    }

    return {
        //afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit
    }
});