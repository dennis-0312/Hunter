/********************************************************************************************************************************************************
This script for Invoice, Cash Sale, Credit Memo and Vendor Bill (Evento para generar serie, correlativo y seteo de campos obligatorios) 
/******************************************************************************************************************************************************** 
File Name: TS_UE_INV_CS_CM.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 20/04/2022
ApiVersion: Script 2.1
Enviroment: PR
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/runtime'], (log, search, record, runtime) => {
    const INVOICE = 'invoice';
    const GASTO = 'expense';
    const CASH_SALE = 'cashsale';
    const CREDIT_MEMO = 'creditmemo';
    const VENDOR_BILL = 'vendorbill';
    const DOCUMENT_TYPE_RUC = 4; //Registro Unico De Contribuyentes
    const DOCUMENT_TYPE_DNI = 2; //Documento Nacional De Identidad

    const DOCUMENT_TYPE_FACTURA = '01';
    const DOCUMENT_TYPE_BOLETA = '46'
    const DOCUMENT_TYPE_CREDIT_MEMO = '07'
    const DOCUMENT_TYPE_NO_DOMICILIADO = '91'
    const DOCUMENT_TYPE_DEBIT_MEMO = '08'

    const PE_FEL_Sending_Method = 4;// se cambio 6->1 07/07/2023
    const PE_Invoice_FEL_Template = 1;// se cambio 2->1 07/07/2023
    const PE_Credit_Memo_FEL_Template = 1;// se cambio 2->3 07/07/2023
    const For_Generation_Status = 1;
    let doctype = 0;
    let prefix = '';

    const DOCUMENT_TYPE_RXH = '02';
    const DOCUMENT_TYPE_RXS = '14';
    const ITEM = 'item';
    const CONCEPTO_SIN_DETRACCION = 1;
    const MONEDA_SOLES = 1;
    const UNDEF_PE = 5;

    const ITEM_DETRACCION_SOLES = 66;
    const ITEM_DETRACCION_DOLAR = 870;

    //const OPERATION_TYPE = 47; //Venta Nacional
    // const EI_OPERATION_TYPE = 101; //Venta Interna
    // const EI_FOMRA_PAGO = 1; // Contado
    // const DOCUMENT_TYPE_NC = 106;
    // const DOCUMENT_TYPE_ND = 107;
    // const PAYMENT_METHOD = 1; //Efectivo

    const getCurrentUser = (employeeId) => {
        let userClassification = search.lookupFields({ type: search.Type.EMPLOYEE, id: employeeId, columns: ['department', 'class', 'location', 'custentity_pe_document_number'] });
        userClassification.department = userClassification.department.length ? userClassification.department[0].value : "";
        userClassification.class = userClassification.class.length ? userClassification.class[0].value : "";
        userClassification.location = userClassification.location.length ? userClassification.location[0].value : "";
        return userClassification;
    }

    const cleanFields = (objRecord) => {
        objRecord.setValue({ fieldId: 'custbody_pe_number', value: "", ignoreFieldChange: true });
    }

    const beforeLoad = (context) => {
        let eventType = context.type;

        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            let objRecord = context.newRecord;
            try {
                if (eventType === context.UserEventType.COPY) {
                    cleanFields(objRecord);
                }
                if (eventType === context.UserEventType.CREATE) {
                    if (objRecord.type != CREDIT_MEMO) {
                        let currentUser = runtime.getCurrentUser();
                        log.error("currentUser", currentUser);
                        let userClassification = getCurrentUser(currentUser.id);
                        objRecord.setValue({ fieldId: 'department', value: userClassification.department, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'class', value: userClassification.class, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'location', value: userClassification.location, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_pe_flag_dni_user', value: userClassification.custentity_pe_document_number, ignoreFieldChange: true });
                    }

                    if (objRecord.type == CREDIT_MEMO) {
                        let createdFromTransaction = objRecord.getValue({ fieldId: "createdfrom" });
                        if (createdFromTransaction) {
                            let document_type = objRecord.getValue({ fieldId: 'custbody_pe_document_type' });
                            let serie = objRecord.getText({ fieldId: 'custbody_pe_serie' });
                            let number = objRecord.getValue({ fieldId: 'custbody_pe_number' });
                            objRecord.setValue({ fieldId: 'custbody_pe_document_type_ref', value: document_type, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_document_series_ref', value: serie, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_document_number_ref', value: number, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_document_type', value: '', ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_serie', value: '', ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_number', value: '', ignoreFieldChange: true });
                        }
                    }
                }
            } catch (error) {
                log.error('Error-beforeLoad-General', eventType + '--' + error);
            }
        }
    }

    const getFiscalDocumentPrefix = (fiscalDocumentTypeId) => {
        if (!fiscalDocumentTypeId) return { prefix: "", codeDocumentType: "" };
        let fiscalDocumentType = search.lookupFields({
            type: "customrecord_pe_fiscal_document_type",
            id: fiscalDocumentTypeId,
            columns: ["custrecord_pe_prefix", "custrecord_pe_code_document_type"]
        });
        return {
            prefix: fiscalDocumentType.custrecord_pe_prefix,
            codeDocumentType: fiscalDocumentType.custrecord_pe_code_document_type
        }
    }

    const updateTotalAndMontoLetras = (objRecord) => {
        let total = objRecord.getValue({ fieldId: 'total' });
        objRecord.setValue({ fieldId: 'custbody_pe_flag_total', value: total });
        let montoLetras = NumeroALetras(total, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
        objRecord.setValue({ fieldId: 'custbody_pe_flag_monto_letras', value: montoLetras });
    }

    const setPurchaseTransactionNumber = (objRecord) => {
        let fiscalDocumentTypeId = objRecord.getValue("custbody_pe_document_type");
        let { prefix } = getFiscalDocumentPrefix(fiscalDocumentTypeId);
        let transactionSerie = objRecord.getValue({ fieldId: 'custbody_pe_serie_cxp' });
        let transactionNumber = objRecord.getValue({ fieldId: 'custbody_pe_number' });
        let transactionTranId = `${prefix}-${transactionSerie}-${transactionNumber}`;
        objRecord.setValue('tranid', transactionTranId);
    }

    const setAddressLocation = (objRecord) => {
        let location = objRecord.getValue("location");
        let addressLoc = getAddress(location);
        log.debug('addressLoc', addressLoc)
        objRecord.setValue({ fieldId: 'custbody_pe_flag_address_location', value: addressLoc });
    }

    const markDiscountLine = (objRecord) => {
        let linecount = objRecord.getLineCount({ sublistId: 'item' });
        let k = 0;
        if (linecount <= 1) return;
        for (let j = 0; j < linecount - 1; j++) {
            let itemtype = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
            if (itemtype == 'InvtPart' || itemtype == 'Service') {
                let itemtypeDSCTO = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j + 1 });
                if (itemtypeDSCTO == 'Discount') {
                    let grossDiscount = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: j + 1 });
                    grossDiscount = Math.abs(grossDiscount);
                    objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_discount_line', line: j, value: grossDiscount });
                    objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: j + 1, value: true });
                }
            }
        }
    }

    const beforeSubmit = (context) => {
        let eventType = context.type;
        let objRecord = context.newRecord;
        let type = objRecord.type;
        try {
            if (eventType === context.UserEventType.CREATE) {
                if (type == record.Type.INVOICE || type == record.Type.CASH_SALE || type == record.Type.CREDIT_MEMO) {
                    updateTotalAndMontoLetras(objRecord);
                    setAddressLocation(objRecord);
                    if (type == record.Type.INVOICE || type == record.Type.CASH_SALE) markDiscountLine(objRecord);
                }
                if (type == record.Type.INVOICE) {
                    var peTipoDocumento = objRecord.getValue({ fieldId: 'custbody_pe_document_type' });
                    var peConceptoDetra = objRecord.getValue({ fieldId: 'custbody_pe_concept_detraction' });

                    if (peTipoDocumento == '') {
                        objRecord.setValue({ fieldId: 'custbody_pe_document_type', value: 55, ignoreFieldChange: true });
                    }
                    if (peConceptoDetra == '') {
                        objRecord.setValue({ fieldId: 'custbody_pe_concept_detraction', value: 1, ignoreFieldChange: true });
                    }
                }
            } else if (eventType === context.UserEventType.EDIT) {
                if (type == record.Type.INVOICE || type == record.Type.CASH_SALE || type == record.Type.CREDIT_MEMO) {
                    updateTotalAndMontoLetras(objRecord);
                    setAddressLocation(objRecord);
                    if (type == record.Type.INVOICE || type == record.Type.CASH_SALE) markDiscountLine(objRecord);
                } else if (type == record.Type.VENDOR_BILL || type == record.Type.VENDOR_CREDIT) {
                    setPurchaseTransactionNumber(objRecord);
                    updateTotalAndMontoLetras(objRecord);
                    setAddressLocation(objRecord);
                }
            }
        } catch (error) {
            log.error('Error-beforeSubmit-' + objRecord.type, eventType + '--' + error);
        }
    }

    const updateTransactionTranId = (type, id, tranid, peNumber, peSerie) => {
        let values = { tranid: tranid };
        if (peNumber) values.custbody_pe_number = peNumber;
        if (peSerie) values.custbody_pe_serie = peSerie;
        record.submitFields({ type, id, values });
    }

    const afterSubmit = (context) => {
        let eventType = context.type;
        let objRecord = context.newRecord;
        let type = objRecord.type;
        log.error('eventType afterSubmit', eventType);
        log.error('type', type);

        let transactionTranId = "", peDocumentNumber = "", peSerie = "";
        if (eventType === context.UserEventType.CREATE) {
            let recordId = objRecord.id;
            let fiscalDocumentTypeId = objRecord.getValue("custbody_pe_document_type");
            let { prefix, codeDocumentType } = getFiscalDocumentPrefix(fiscalDocumentTypeId);
            if (type === record.Type.INVOICE || type === record.Type.CREDIT_MEMO || type === record.Type.CASH_SALE) {
                if (codeDocumentType != "") {
                    let location = objRecord.getValue('location');
                    let subsidiary = objRecord.getValue('subsidiary');
                    //let documentref = objRecord.getValue({ fieldId: 'custbody_pe_document_type_ref' });
                    var subSearch = search.lookupFields({ type: 'subsidiary', id: subsidiary, columns: ['tranprefix'] });
                    let prefSubsi = subSearch.tranprefix;
                    let documentReferenceType = "";
                    if (codeDocumentType == "08" || codeDocumentType == "07") {
                        documentReferenceType = record.Type.INVOICE;
                    }
                    log.error("data", { codeDocumentType, location, prefix, subsidiary, documentReferenceType });
                    let getserie = getSerie(codeDocumentType, location, prefix, subsidiary, documentReferenceType);
                    log.error("getserie", getserie);
                    let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr);
                    log.error("correlative", correlative);
                    transactionTranId = prefSubsi + '-' + correlative.numbering;
                    peDocumentNumber = correlative.correlative;
                    peSerie = getserie.serieid;

                }
            } else if (type === record.Type.VENDOR_BILL || type === record.Type.VENDOR_CREDIT) {
                let transactionSerie = objRecord.getValue({ fieldId: 'custbody_pe_serie_cxp' });
                let transactionNumber = objRecord.getValue({ fieldId: 'custbody_pe_number' });
                transactionTranId = `${prefix}-${transactionSerie}-${transactionNumber}`;
            }
            updateTransactionTranId(type, recordId, transactionTranId, peDocumentNumber, peSerie);
        }

        try {
            if (eventType != context.UserEventType.DELETE) {

                var recordId = objRecord.id;
                log.debug('recordId', recordId)
                var recordLoad = '';
                if (type == INVOICE) {
                    recordLoad = record.load({ type: objRecord.type, id: recordId, isDynamic: false });
                    let concepto_retencion = recordLoad.getValue('custbody_pe_concept_detraction');
                    let details_item = recordLoad.getLineCount(ITEM);
                    let details_expense = recordLoad.getLineCount(GASTO);
                    var currency = recordLoad.getValue('currency');

                    var arr = [];
                    var remuve = false;

                    if (concepto_retencion != CONCEPTO_SIN_DETRACCION) {
                        if (details_item > 0) {
                            arr = removeLinesAjusteDetraccion(recordLoad, details_item, ITEM);
                        }
                        remuve = arr;

                        const tipo_cambio_fc = recordLoad.getValue('exchangerate');
                        const rate_detraccion = recordLoad.getValue('custbody_pe_percentage_detraccion') * (0.01);

                        var subSearch = search.lookupFields({
                            type: 'subsidiary',
                            id: recordLoad.getValue('subsidiary'),
                            columns: ['custrecord_pe_detraccion_sales', 'custrecord_pe_detraccion_sales_dolar']
                        });

                        log.debug(' ', currency)
                        var itemDis = 0;

                        if (MONEDA_SOLES == currency) {
                            itemDis = subSearch.custrecord_pe_detraccion_sales[0].value;
                        }

                        log.debug('details_item', details_item)
                        log.debug('details_expense', details_expense)

                        if (details_item > 0) {
                            var total_item_ret = 0;
                            var total_amount = 0;
                            var flag = false;

                            var invoiceSearchObj = search.create({
                                type: "invoice",
                                filters:
                                    [
                                        ["type", "anyof", "CustInvc"],
                                        "AND",
                                        ["internalid", "anyof", recordId],
                                        "AND",
                                        ["mainline", "is", "F"],
                                        "AND",
                                        ["taxline", "is", "F"]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "grossamount", label: "Importe (bruto)" }),
                                        search.createColumn({
                                            name: "formulanumeric",
                                            formula: "{custcol_4601_witaxbaseamount}",
                                            label: "Fórmula (numérica)"
                                        }),
                                        search.createColumn({ name: "custcol_pe_linea_ajuste_retencion", label: "PE Linea de Ajuste Retenciones" })
                                    ]
                            });

                            invoiceSearchObj.run().each(function (result) {
                                var amount = roundTwoDecimal(result.getValue(invoiceSearchObj.columns[0]) || 0);
                                var mount_item_ret = Number(result.getValue(invoiceSearchObj.columns[1])) || 0;
                                flag = result.getValue(invoiceSearchObj.columns[2]);
                                log.debug('mount_item_ret', mount_item_ret);

                                if (mount_item_ret != 0) {

                                    log.debug('mount_item_ret 222', roundTwoDecimal(total_item_ret + mount_item_ret));
                                    total_item_ret = roundTwoDecimal(total_item_ret + mount_item_ret);
                                }
                                total_amount = total_amount + amount;
                                return true;
                            });
                            log.debug('total_amount', total_amount);
                            //for (var k = details_item-1; k >= 0; k--){

                            /*
                            for (var k = 0; k < details_item; k++){
                                var flag = recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'custcol_pe_linea_ajuste_retencion', line: k });
                                var monto_item_ret_ln = recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'custcol_4601_witaxbaseamount', line: k }) || 0;
                                    if (monto_item_ret_ln != 0) {
                                        total_item_ret += monto_item_ret_ln
                                    }
                            }
                            */
                            log.debug('total_item_ret', total_item_ret);

                            /*
                            var discountitemSearchObj = search.create({
                                type: "discountitem",
                                filters:
                                [
                                    ["type","anyof","Discount"], 
                                    "AND", 
                                    ["account","anyof",account]
                                ],
                                columns:
                                [
                                    search.createColumn({name: "internalid", label: "Internal ID"})
                                ]
                            });
                            
                            var searchResultCount = discountitemSearchObj.run().getRange(0,1);
                            if(searchResultCount.length != 0){
                                var columns = searchResultCount[0].columns;
                                itemDis = Number(searchResultCount[0].getValue(columns[0]));
                                
                            }
                            */

                            const amount_ret_item = total_item_ret * rate_detraccion * (-1);
                            const amount_line_ret_item = getResiduoRetencion(amount_ret_item, tipo_cambio_fc);
                            log.error("dif_redondeo", amount_ret_item);
                            log.error("amount_line_ret_item", amount_line_ret_item);
                            log.debug('flaaaaaaag', flag)

                            if (remuve == true) {
                                flag = false;
                                details_item = details_item - 1;
                            }

                            if (amount_line_ret_item != 0 && !flag) {
                                recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'item', line: details_item, value: itemDis });
                                //recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'quantity', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'quantity', line: 0 }) });
                                //recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'description', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'description', line: 0 }) });
                                recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'rate', line: details_item, value: amount_line_ret_item.toFixed(2) });
                                recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'taxcode', line: details_item, value: UNDEF_PE });
                                recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'department', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'department', line: 0 }) });
                                recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'class', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'class', line: 0 }) });
                                recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'location', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'location', line: 0 }) });
                                recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'custcol_pe_linea_ajuste_retencion', line: details_item, value: true });
                            }

                        }

                        if (MONEDA_SOLES == currency) {
                            recordLoad.save({ ignoreMandatoryFields: true, enableSourcing: false });
                        }

                    }
                }
            }
        } catch (error) {
            log.error('error', error)
        }

    }

    function roundTwoDecimal(value) {
        return Math.round(Number(value) * 100) / 100;
    }

    const afterSubmit1 = (context) => {
        let eventType = context.type;
        let objRecord = context.newRecord;
        let type = objRecord.type;

        log.debug('eventType afterSubmit', eventType);
        var FORM_DEBIT_MEMO = runtime.getCurrentScript().getParameter({
            name: 'custscript_pe_ue_transaction_formulario'
        });
        if (eventType === context.UserEventType.CREATE) {
            const objRecord = context.newRecord;

            try {
                let recordId = objRecord.id;
                let recordLoad = '';
                let documentref = '';
                if (objRecord.type == INVOICE) {
                    // record.submitFields({
                    //     type: record.Type.INVOICE,
                    //     id: recordId,
                    //     values: {
                    //         'custbody_pe_flag_print_pdf': urlpart1 + recordId + urlpartt2
                    //     }
                    // });

                    recordLoad = record.load({ type: record.Type.INVOICE, id: recordId, isDynamic: true });
                    let memo = recordLoad.getValue('memo');
                    var enajenacion = memo.includes('Factura para la enajenación de activos');
                    log.debug('enajenacion', enajenacion);
                    if (enajenacion == true) { //modulo de activos fijos enajenacion
                        const customform = objRecord.getValue({ fieldId: 'customform' });
                        const customer = objRecord.getValue({ fieldId: 'entity' });
                        if (customform == FORM_DEBIT_MEMO) {
                            prefix = 'ND-';
                        } else {
                            let searchField = search.lookupFields({ type: search.Type.CUSTOMER, id: customer, columns: ['custentity_pe_document_type'] });
                            if (searchField.custentity_pe_document_type[0].value == DOCUMENT_TYPE_RUC) {//TODO: Activar cuando tipo de documento venga de cliente
                                prefix = 'FA-';
                            } else {
                                prefix = 'BV-';
                            }
                        }
                        var pe_serie = recordLoad.getText('custbody_pe_serie');
                        var pe_number = recordLoad.getValue('custbody_pe_number');
                        var correlativo = prefix + pe_serie + '-' + pe_number;
                        log.debug('correlativo', correlativo);

                        //IMorales 20230814
                        // recordLoad.setValue({ fieldId: 'tranid', value: correlativo });
                        let subTransaction = record.load({ type: 'subsidiary', id: objRecord.getValue({ fieldId: 'subsidiary' }), isDynamic: true })
                        let prefijo_subsidiaria = subTransaction.getValue('tranprefix');
                        recordLoad.setValue({ fieldId: 'tranid', value: prefijo_subsidiaria + correlativo });
                    }
                } else if (objRecord.type == CASH_SALE) {
                    recordLoad = record.load({ type: record.Type.CASH_SALE, id: recordId, isDynamic: true });
                }

                let datecreated = String(recordLoad.getValue({ fieldId: 'createddate' }));
                datecreated = datecreated.split(' ');
                let time = datecreated[4];
                time = time.split(':');
                let hora = parseInt(time[0]) + 2;
                if (parseInt(hora) < 10) {
                    time = '0' + hora + ':' + time[1];
                } else {
                    time = hora + ':' + time[1];
                }
                recordLoad.setValue({ fieldId: 'custbody_pe_flag_hora_emision', value: time, ignoreFieldChange: true });
                log.debug('prueba', recordLoad.getValue({ fieldId: 'tranid' }));
                recordLoad.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            } catch (error) {
                log.error('Error-afterSubmit', eventType + '--' + error);
            }
        }
    }


    const getSerie = (documenttype, location, prefix, subsidiaryId, documentref = 0) => {
        let searchLoad = '';
        try {
            log.debug('DebugSearch1', documenttype + ' - ' + location + ' - ' + prefix + ' - ' + documentref)
            if (documenttype == DOCUMENT_TYPE_CREDIT_MEMO || documenttype == DOCUMENT_TYPE_DEBIT_MEMO) {
                log.debug('Debug', 'Entre a search NC o ND');
                searchLoad = search.create({
                    type: 'customrecord_pe_serie',
                    filters: [
                        ['custrecord_pe_subsidiaria', "anyof", subsidiaryId],
                        "AND",
                        ['custrecord_pe_tipo_documento_serie.custrecord_pe_code_document_type', "is", documenttype],
                        'AND',
                        ['custrecord_pe_location', 'anyof', location],
                        'AND',
                        ['custrecord_pe_tipo_documento_aplicado', 'anyof', documentref],
                        'AND',
                        ["custrecord_para_anulacin", "is", "F"]
                    ],
                    columns: [
                        {
                            name: 'internalid',
                            sort: search.Sort.ASC
                        },
                        'custrecord_pe_inicio',
                        'custrecord_pe_serie_impresion'
                    ]
                });
            } else {
                log.debug('ENTRA RECORD PE SERIE');
                searchLoad = search.create({
                    type: 'customrecord_pe_serie',
                    filters: [
                        ['custrecord_pe_subsidiaria', "anyof", subsidiaryId],
                        "AND",
                        ['custrecord_pe_tipo_documento_serie.custrecord_pe_code_document_type', 'is', documenttype],
                        'AND',
                        ['custrecord_pe_location', 'anyof', location],
                        'AND',
                        ["custrecord_para_anulacin", "is", "F"]
                    ],
                    columns: [
                        {
                            name: 'internalid',
                            sort: search.Sort.ASC
                        },
                        'custrecord_pe_inicio',
                        'custrecord_pe_serie_impresion'
                    ]
                });
            }

            let searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            let column01 = searchResult[0].getValue(searchLoad.columns[0]);
            let column02 = searchResult[0].getValue(searchLoad.columns[1]);
            let column03 = searchResult[0].getValue(searchLoad.columns[2]);
            column03 = prefix + "-" + column03;
            column02 = parseInt(column02);
            return {
                'serieid': column01,
                'peinicio': column02,
                'serieimpr': column03
            };
        } catch (e) {
            log.error({ title: 'getPeSerie', details: e });
        }
    }


    const generateCorrelative = (return_pe_inicio, serieid, serieimpr) => {
        let ceros;
        let correlative;
        let numbering;
        let this_number = return_pe_inicio;

        const next_number = return_pe_inicio + 1
        record.submitFields({ type: 'customrecord_pe_serie', id: serieid, values: { 'custrecord_pe_inicio': next_number } });

        if (this_number.toString().length == 1) {
            ceros = '0000000';
        } else if (this_number.toString().length == 2) {
            ceros = '000000';
        } else if (this_number.toString().length == 3) {
            ceros = '00000';
        } else if (this_number.toString().length == 4) {
            ceros = '0000';
        } else if (this_number.toString().length == 5) {
            ceros = '000';
        } else if (this_number.toString().length == 6) {
            ceros = '00';
        } else if (this_number.toString().length == 7) {
            ceros = '0';
        } else if (this_number.toString().length >= 8) {
            ceros = '';
        }

        correlative = ceros + this_number;
        numbering = serieimpr + '-' + correlative;
        return {
            'correlative': correlative,
            'numbering': numbering
        }
    }


    const getAddress = (location) => {
        let address = '';
        let mySearch = search.load({ id: 'customsearch_pe_location_search_2' });
        log.debug('mySearch', mySearch)
        let filters = mySearch.filters;
        const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: location });
        filters.push(filterOne);
        const searchResult = mySearch.run().getRange({ start: 0, end: 1 });
        let column01 = searchResult[0].getValue(mySearch.columns[0]);
        let column02 = searchResult[0].getValue(mySearch.columns[1]);
        let column03 = searchResult[0].getValue(mySearch.columns[2]);
        let column04 = searchResult[0].getValue(mySearch.columns[3]);
        address = column01 + ' ' + column03 + '-' + column04 + '-' + column02;
        return address;
    }


    //?BLOQUE DE CONVERSIÓN MONTO EN LETRAS================================================================================================================================================================================================
    function Unidades(num) {
        switch (num) {
            case 1: return 'UN';
            case 2: return 'DOS';
            case 3: return 'TRES';
            case 4: return 'CUATRO';
            case 5: return 'CINCO';
            case 6: return 'SEIS';
            case 7: return 'SIETE';
            case 8: return 'OCHO';
            case 9: return 'NUEVE';
        }

        return '';
    }//Unidades()


    function Decenas(num) {
        var decena = Math.floor(num / 10);
        var unidad = num - (decena * 10);

        switch (decena) {
            case 1:
                switch (unidad) {
                    case 0: return 'DIEZ';
                    case 1: return 'ONCE';
                    case 2: return 'DOCE';
                    case 3: return 'TRECE';
                    case 4: return 'CATORCE';
                    case 5: return 'QUINCE';
                    default: return 'DIECI' + Unidades(unidad);
                }
            case 2:
                switch (unidad) {
                    case 0: return 'VEINTE';
                    default: return 'VEINTI' + Unidades(unidad);
                }
            case 3: return DecenasY('TREINTA', unidad);
            case 4: return DecenasY('CUARENTA', unidad);
            case 5: return DecenasY('CINCUENTA', unidad);
            case 6: return DecenasY('SESENTA', unidad);
            case 7: return DecenasY('SETENTA', unidad);
            case 8: return DecenasY('OCHENTA', unidad);
            case 9: return DecenasY('NOVENTA', unidad);
            case 0: return Unidades(unidad);
        }
    }//Unidades()


    function DecenasY(strSin, numUnidades) {
        if (numUnidades > 0) {
            return strSin + ' Y ' + Unidades(numUnidades)
        }
        return strSin;
    }//DecenasY()


    function Centenas(num) {
        var centenas = Math.floor(num / 100);
        var decenas = num - (centenas * 100);
        switch (centenas) {
            case 1:
                if (decenas > 0) {
                    return 'CIENTO ' + Decenas(decenas);
                }
                return 'CIEN';
            case 2: return 'DOSCIENTOS ' + Decenas(decenas);
            case 3: return 'TRESCIENTOS ' + Decenas(decenas);
            case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
            case 5: return 'QUINIENTOS ' + Decenas(decenas);
            case 6: return 'SEISCIENTOS ' + Decenas(decenas);
            case 7: return 'SETECIENTOS ' + Decenas(decenas);
            case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
            case 9: return 'NOVECIENTOS ' + Decenas(decenas);
        }

        return Decenas(decenas);
    }//Centenas()


    function Seccion(num, divisor, strSingular, strPlural) {
        var cientos = Math.floor(num / divisor)
        var resto = num - (cientos * divisor)
        var letras = '';

        if (cientos > 0) {
            if (cientos > 1) {
                letras = Centenas(cientos) + ' ' + strPlural;
            } else {
                letras = strSingular;
            }
        }

        if (resto > 0) {
            letras += '';
        }
        return letras;
    }//Seccion()


    function Miles(num) {
        var divisor = 1000;
        var cientos = Math.floor(num / divisor)
        var resto = num - (cientos * divisor)

        var strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
        var strCentenas = Centenas(resto);

        if (strMiles == '') {
            return strCentenas;
        }
        return strMiles + ' ' + strCentenas;
    }//Miles()


    function Millones(num) {
        var divisor = 1000000;
        var cientos = Math.floor(num / divisor)
        var resto = num - (cientos * divisor)

        // var strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
        var strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
        var strMiles = Miles(resto);

        if (strMillones == '') {
            return strMiles;
        }
        return strMillones + ' ' + strMiles;
    }//Millones()


    function NumeroALetras(num, currency) {
        currency = currency || {};
        var data = {
            numero: num,
            enteros: Math.floor(num),
            centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
            letrasCentavos: '',
            letrasMonedaPlural: currency.plural || 'SOLES',//'PESOS', 'Dólares', 'Bolívares', 'etcs'
            letrasMonedaSingular: currency.singular || 'SOL', //'PESO', 'Dólar', 'Bolivar', 'etc'
            letrasMonedaCentavoPlural: currency.centPlural || 'CENTIMOS',
            letrasMonedaCentavoSingular: currency.centSingular || 'CENTIMO'
        };

        if (data.centavos > 0) {
            data.letrasCentavos = 'CON ' + (function () {
                if (data.centavos == 1)
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                else
                    return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
            })();
        };

        if (data.enteros == 0)
            return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        if (data.enteros == 1)
            return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
        else
            return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
    }

    function removeLinesAjusteDetraccion(_record, _details, _sublist) {
        try {
            var removido = false;
            for (var s = _details - 1; s >= 0; s--) {
                var is_line_ajuste_ret = _record.getSublistValue({ sublistId: _sublist, fieldId: 'custcol_pe_linea_ajuste_retencion', line: s });

                if (is_line_ajuste_ret) {
                    _record.removeLine({ sublistId: _sublist, line: s });
                    removido = true;
                }
            }
            return removido;
        } catch (e) {
            log.error("error", e);
        }
    }

    function getResiduoRetencion(_total_retencion, _tipo_cambio) {
        try {
            const total_retencion_tc = _total_retencion * _tipo_cambio;
            const total_redondeo = Math.round(Math.abs(total_retencion_tc)) * -1;
            var total_resto = total_redondeo + Math.abs(total_retencion_tc);
            total_resto = total_resto / _tipo_cambio;
            return total_resto;

        } catch (e) {
            log.error('Error en getResiduoRetencion', e);
        }
    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit
    }
});