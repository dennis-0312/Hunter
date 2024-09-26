/********************************************************************************************************************************************************
This script for Invoice, Cash Sale, Credit Memo and Vendor Bill (Evento para generar serie, correlativo y seteo de campos obligatorios) 
/******************************************************************************************************************************************************** 
File Name: TS_UE_INV_CS_CM_VB.js                                                                        
Commit: 03                                                        
Version: 1.0                                                                     
Date: 10/01/2023
ApiVersion: Script 2.1
Enviroment: PR
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/runtime',
    'N/redirect',
    'N/url',
    'N/https',
    'N/task',
    'N/query',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
    'N/error',
    'N/config',
    'N/file'
], (log, search, record, runtime, redirect, url, https, task, query, _controller, _constant, _errorMessage, err, config, file) => {
    const INVOICE = 'invoice';
    const CREDIT_MEMO = 'creditmemo';
    const VENDOR_BILL = 'vendorbill';
    const BILL_CREDIT = 'vendorcredit';
    const EJECUCION_PEDIDO_ARTICULO = 'itemfulfillment';
    const SERVICE_ORDER = 'salesorder'
    const ANTICIPO_PROVEEDOR = 'vendorprepayment';
    const FACTURA_INTERNA = 'customsale_ec_factura_interna';
    const DOCUMENT_TYPE_FACTURA = 4; //Factura
    const DOCUMENT_TYPE_GUIA_REMISION = 3; //Factura
    const DOCUMENT_TYPE_LIQUIDACION_COMPRA = 10;
    const DOCUMENT_TYPE_COMPROBANTE_RETENCION = 11;
    const DOCUMENT_TYPE_CREDIT_MEMO = 1; // Nota de Crédito
    const DOCUMENT_TYPE_CREDIT_MEMO_INTERNAL = 38; // Nota de Crédito Interna
    const DOCUMENT_TYPE_NOTA_VENTA = 9 // Nota o boleta de venta
    const PE_FEL_Sending_Method = 4;
    const PE_FEL_Sending_Method_nc = 4;
    const PE_Invoice_FEL_Template = 1;
    const PE_Credit_Memo_FEL_Template = 1;
    const PE_Liquidacion_Compra_FEL_Template = 1;
    const PE_Liquidacion_Compra_FEL_Sending = 4;
    const PE_Comprobante_Retencion_FEL_Template = 1;
    const PE_Comprobante_Retencion_FEL_Sending = 4;
    const PE_Guia_De_Remision_FEL_Template = 2;
    const PE_Guia_De_Remision_FEL_Sendings = 5;
    const For_Generation_Status = 1;
    const FORM_NOTA_CREDITO_COMPRA = 104;
    const FORM_NOTA_CREDITO_COMPRA_INTERNAL = 214;
    const ESTADO_FACTURA_INTERNA = 2;
    const STATUS_TRANSACTION = 'closed'
    const STATUS_PENDING_FULFILLMENT = 'pendingFulfillment';
    const STATUS_PENDING_BILLING = 'pendingBilling';
    const STATUS_PARTIALLY_FULFILLED = 'partiallyFulfilled';
    const STATUS_PENDING_BILLING_PARTIALLY_FULFILLED = 'pendingBillingPartFulfilled';
    const STATUS_BILLED = ''


    const ITEM = 'item';
    const DOCUMENT_TYPE_REEMBOLSO = 23; // Reembolso
    const DOCUMENT_TYPE_UNICO_EXPORTACION = 15;
    const DOCUMENT_TYPE_VENTA_EXTERIOR = 14;
    const DOCUMENT_TYPE_SERVICIOS_ADMIN = 18;
    const DOCUMENT_TYPE_PASAJES_AEREOS = 12;
    let TAX_ITEM_NS_EC = "" //SB:16514 / PR:24128
    const TAX_ITEM_UNDEF = "5"
    let FORM_FACTURA_VENTA = "";
    let FORM_NOTA_CREDITO = "";
    let FORM_COMPROBANTE_RETENCION = "";
    let doctype = 0;
    let prefix = '';

    const configEnviroment = () => {
        let variables = new Object();
        let companyInfo = config.load({ type: config.Type.COMPANY_INFORMATION });
        let companyid = companyInfo.getValue({ fieldId: 'companyid' });
        const EN_SANDBOX = companyid.includes('SB');
        if (EN_SANDBOX) {
            variables.tax_item_ns_ec = '16514';
            variables.form_factura_venta = 101;
            variables.form_nota_credito = 132;
            variables.form_comprobante_retencion = 104;
        } else {//EN_PROD
            variables.tax_item_ns_ec = '24128';
            variables.form_factura_venta = 101;
            variables.form_nota_credito = 132;
            variables.form_comprobante_retencion = 157;
        }
        return variables;
    }

    const beforeLoad = (context) => {
        const eventType = context.type;
        //**BLOQUE DE CONFIGURACIÓN DE AMBIENTE ======================================================================== */
        let varEnviroment = configEnviroment()
        //log.debug('varEnviromentBL', varEnviroment);
        TAX_ITEM_NS_EC = varEnviroment.tax_item_ns_ec;
        //**============================================================================================================ */
        let userObj = runtime.getCurrentUser();

        if ((eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) || eventType === context.UserEventType.EDIT /*&& userObj.id != 4*/) {
            const objRecord = context.newRecord;
            try {
                if (objRecord.type == BILL_CREDIT) {
                    let document_type_cr = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    let serie_cr = objRecord.getValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp' });
                    let number_cr = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                    // let folio_cr = objRecord.getValue({ fieldId: 'custbody_ts_ec_folio_fiscal' });
                    let createdfromData = getDateRef(objRecord.getValue('createdfrom'));
                    log.debug('createdfromData', createdfromData);
                    let date_ref = createdfromData.trandate
                    let folio_cr = createdfromData.autorization

                    objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_folio_fiscal', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_num_autorizacion', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ec_fecha_autorizacion', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_doc_type_ref', value: document_type_cr, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_doc_serie_ref', value: serie_cr, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_doc_number_ref', value: number_cr, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_doc_fecha_ref', value: date_ref, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_folio_fiscal_ref', value: folio_cr, ignoreFieldChange: true });
                } else if (objRecord.type == CREDIT_MEMO) {
                    let referenceInvoiceId = objRecord.getValue('createdfrom');
                    if (referenceInvoiceId) {
                        let document_type = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                        let serie = objRecord.getText({ fieldId: 'custbody_ts_ec_serie_cxc' });
                        let number = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                        let location = objRecord.getValue({ fieldId: 'location' });
                        let createdfromData = getDateRef(referenceInvoiceId);
                        let date_ref = createdfromData.trandate
                        let prefix = 'NC-'
                        let getForm = objRecord.getValue({ fieldId: 'customform' });


                        let creditMemoSerie;
                        if (getForm == FORM_NOTA_CREDITO_COMPRA_INTERNAL) {
                            creditMemoSerie = getSerie(DOCUMENT_TYPE_CREDIT_MEMO_INTERNAL, location, prefix);
                        } else {
                            creditMemoSerie = getSerie(DOCUMENT_TYPE_CREDIT_MEMO, location, prefix);
                        }
                        let correlative = generateCorrelative(creditMemoSerie.peinicio, creditMemoSerie.serieid, creditMemoSerie.serieimpr, 'beforeLoad');



                        /*FIN FECHA RELACIONADA A UNA NC */
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_type_ref', value: document_type, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_serie_ref', value: serie, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_number_ref', value: number, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_fecha_ref', value: date_ref, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: DOCUMENT_TYPE_CREDIT_MEMO, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: creditMemoSerie.serieid || "", ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                    }
                } else if (objRecord.type == INVOICE) {
                    let referenceOrdenservicioId = objRecord.getValue('createdfrom');
                    //log.error('referenceOrdenservicioId', referenceOrdenservicioId);
                    if (referenceOrdenservicioId) {
                        let location = objRecord.getValue({ fieldId: 'location' });
                        let docFiscal = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                        let idSerie = getSerie(docFiscal, location).serieid;
                        //log.error('idSerie', idSerie);
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: idSerie, ignoreFieldChange: true });
                    }
                } else if (objRecord.type == EJECUCION_PEDIDO_ARTICULO) {
                    objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: DOCUMENT_TYPE_GUIA_REMISION, ignoreFieldChange: true });
                    let OServ = objRecord.getValue({ fieldId: 'createdfrom' });
                    let typeTransaction = search.lookupFields({ type: 'transaction', id: OServ, columns: ['location'] });
                    let location = typeTransaction.location[0].value;
                    let idSerie = getSerie(DOCUMENT_TYPE_GUIA_REMISION, location).serieid;
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: idSerie, ignoreFieldChange: true });
                } else if (objRecord.type == FACTURA_INTERNA) {
                    let referenceOrdenservicioId = objRecord.getValue('createdfrom');
                    let location = objRecord.getValue({ fieldId: 'location' });
                    let docFiscal = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    log.error('docFiscal', docFiscal);
                    let idSerie = getSerie(37, location).serieid;
                    log.error('idSerie', idSerie);
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: idSerie, ignoreFieldChange: true });
                }
            } catch (error) {
                log.error('Error-beforeLoad-General', eventType + '--' + error);
            }
        }

        if (eventType === context.UserEventType.VIEW) {
            let objRecord = context.newRecord;
            if (objRecord.type == _constant.Transaction.VENDOR_PAYMENT || objRecord.type == _constant.Transaction.CHECK || objRecord.type == _constant.Transaction.VENDOR_PRE_PAYMENT) {
                let forms = context.form;
                imprimirComprobante(forms, objRecord);
                forms.clientScriptModulePath = './TS_CS_Pago_Factura.js'
            }

            try {
                if (!objRecord.getText({ fieldId: 'tranid' }) && objRecord.type == VENDOR_BILL) {
                    log.debug('SetTranid', 'Set');
                    objRecord = record.load({ type: VENDOR_BILL, id: objRecord.id, isDynamic: true });
                    setTranid(objRecord);
                    objRecord.save();
                }
            } catch (error) { }
            log.debug('status', objRecord.getValue('status'));
            log.debug('statusRef', objRecord.getValue('statusRef'));
            if (objRecord.type == _constant.Transaction.SALES_ORDER && objRecord.getValue('custbody_ec_estado_factura_interna') != ESTADO_FACTURA_INTERNA) {
                if (objRecord.getValue('statusRef') == STATUS_PENDING_FULFILLMENT || objRecord.getValue('statusRef') == STATUS_PENDING_BILLING || objRecord.getValue('statusRef') == STATUS_PENDING_BILLING_PARTIALLY_FULFILLED) {
                    let form = context.form;
                    form.addButton({ id: 'custpage_btn_emitir_fac_inter', label: 'Factura Interna', functionName: `createFacturaInterna('${objRecord.id}')` });
                    form.clientScriptModulePath = '../../../Evol/PE/Customizaciones/Emision Masiva de Facturas Internas/client/TS_CS_Factura_Interna_Bulk.js'
                }
            }

        }
    }

    const beforeSubmit = (context) => {
        const eventType = context.type;
        let documentref = '';
        //**BLOQUE DE CONFIGURACIÓN DE AMBIENTE ======================================================================== */
        let varEnviroment = configEnviroment()
        //log.debug('varEnviromentBS', varEnviroment);
        TAX_ITEM_NS_EC = varEnviroment.tax_item_ns_ec;
        //**============================================================================================================ */
        let userObj = runtime.getCurrentUser();

        if ((eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) /*&& userObj.id != 4*/) {
            const objRecord = context.newRecord;
            //objRecord.type == VENDOR_BILL ? setTranid(objRecord) : log.error('Type', 'Es vendor Prepayment')
            setMontoLetras(objRecord);
            if (objRecord.type == INVOICE) {
                let location = objRecord.getValue({ fieldId: 'location' });
                doctype = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                prefix = 'FA-';
                try {
                    objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Invoice_FEL_Template, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: For_Generation_Status, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_FEL_Sending_Method, ignoreFieldChange: true });
                    let getserie = getSerie(doctype, location, prefix, documentref);
                    log.error('LOG-getserie', getserie);
                    let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'beforeSubmit');
                    log.error('LOG-correlative1', correlative);
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                } catch (error) {
                    log.error('Error-beforeSubmit-Intro', error);
                }
            } else if (objRecord.type == CREDIT_MEMO) {

            } else if (objRecord.type == EJECUCION_PEDIDO_ARTICULO) {
                var formulario = objRecord.getValue('customform')// 143 Proveduria
                if (formulario != 143) {
                    log.error('beforeSubmit', 'beforeSubmit');
                    doctype = DOCUMENT_TYPE_GUIA_REMISION;//^: Activar cuando tipo de documento venga de cliente
                    prefix = 'GDR-';
                    try {
                        let OServ = objRecord.getValue({ fieldId: 'createdfrom' });
                        let typeTransaction = search.lookupFields({ type: 'transaction', id: OServ, columns: ['location'] });
                        let location_ej = typeTransaction.location[0].value;
                        let getserie = getSerie(doctype, location_ej, prefix, documentref);
                        log.debug('getserie', getserie);
                        let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'beforeSubmit');
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                        //objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                    } catch (error) {
                        log.error('Error-beforeSubmit-Intro', error);
                    }
                }
            } else if (objRecord.type == SERVICE_ORDER) {
                // let location = objRecord.getValue({ fieldId: 'location' });
                // doctype = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                // prefix = 'OS-';
                // try {
                //     let getserie = getSerie(doctype, location, prefix, documentref);
                //     log.error('LOG-getserie', getserie);
                //     let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'beforeSubmit');
                //     log.error('LOG-correlative1', correlative);
                //     objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                //     objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                //     objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                // } catch (error) {
                //     log.error('Error-beforeSubmit-Intro', error);
                // }
            } else if (objRecord.type == VENDOR_BILL || context.newRecord.type == BILL_CREDIT) {
                const objRecord = context.newRecord;
                var customer = objRecord.getValue({ fieldId: 'entity' });
                var pe_number = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                let doc_fiscal = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                //log.error('customer', customer);
                var existe = buscarFacCompra(customer, pe_number, doc_fiscal);
                //log.debug('existe', existe);
                if (existe) {
                    log.debug('DEBUG', 'Entré a existe por lo tando no se crea registro');
                    var myCustomError = err.create({
                        name: 'ERROR_NUMERO_DOCUMENTO',
                        message: 'Ya existe una Transacción de Compra con el mismo PROVEEDOR y NUMERO PREIMPRESO',
                        notifyOff: false
                    });
                    log.error('Error: ' + myCustomError.name, myCustomError.message);
                    throw myCustomError;
                }
                setTranid(objRecord);
            } else if (objRecord.type == ANTICIPO_PROVEEDOR) {
                try {
                    var montoPago = objRecord.getValue({ fieldId: 'payment' });
                    var idOC = objRecord.getValue({ fieldId: 'purchaseorder' });
                    var OC_montoAnticipo = search.lookupFields({ type: 'transaction', id: idOC, columns: ['custbody_ec_imp_ant'] });
                    var totalAnticipo = OC_montoAnticipo.custbody_ec_imp_ant;
                    var nuevoTotal = Number(montoPago) + Number(totalAnticipo);
                    let comisionid = record.submitFields({
                        type: record.Type.PURCHASE_ORDER,
                        id: idOC,
                        values: {
                            custbody_ec_imp_ant: nuevoTotal
                        },
                        options: { enablesourcing: true }
                    });
                } catch (error) {
                    log.error('Error-beforeSubmit-Intro', error);
                }
            }
        }

        if (eventType === context.UserEventType.EDIT) {
            let objRecord = context.newRecord;
            if ((context.newRecord.type == VENDOR_BILL || context.newRecord.type == BILL_CREDIT) && typeof objRecord.getValue({ fieldId: 'void' }) == 'undefined') {
                let oldRecord = context.oldRecord;
                var customer_new = objRecord.getValue({ fieldId: 'entity' });
                var pe_number_new = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                let doc_fiscal_new = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                log.error('customer_new', customer_new);
                log.error('pe_number_new', pe_number_new);
                var customer_old = oldRecord.getValue({ fieldId: 'entity' });
                var pe_number_old = oldRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                let doc_fiscal_old = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                log.error('customer_old', customer_old);
                log.error('pe_number_old', pe_number_old);
                if (customer_new != customer_old || pe_number_new != pe_number_old || doc_fiscal_new != doc_fiscal_old) {
                    var existe_new = buscarFacCompra(customer_new, pe_number_new, doc_fiscal_new);
                    if (existe_new) {
                        var myCustomError = err.create({
                            name: 'ERROR_NUMERO_DOCUMENTO',
                            message: 'Ya existe una Transacción de Compra con el mismo PROVEEDOR y NUMERO PREIMPRESO',
                            notifyOff: false
                        });
                        log.error('Error: ' + myCustomError.name, myCustomError.message);
                        throw myCustomError;
                    }
                }
                setTranid(objRecord);
                setMontoLetras(objRecord);
            } else if (objRecord.type == ANTICIPO_PROVEEDOR) {
                try {
                    let oldRecord = context.oldRecord;
                    var nuevoMontoPago = objRecord.getValue({ fieldId: 'payment' });
                    var anteriorMontoPago = oldRecord.getValue({ fieldId: 'payment' });
                    var montoPago = Number(nuevoMontoPago) - Number(anteriorMontoPago);
                    var idOC = objRecord.getValue({ fieldId: 'purchaseorder' });
                    var OC_montoAnticipo = search.lookupFields({ type: 'transaction', id: idOC, columns: ['custbody_ec_imp_ant'] });
                    var totalAnticipo = OC_montoAnticipo.custbody_ec_imp_ant;
                    var nuevoTotal = Number(montoPago) + Number(totalAnticipo);
                    let comisionid = record.submitFields({
                        type: record.Type.PURCHASE_ORDER,
                        id: idOC,
                        values: {
                            custbody_ec_imp_ant: nuevoTotal
                        },
                        options: { enablesourcing: true }
                    });
                } catch (error) {

                }
                setMontoLetras(objRecord);
            } else if (objRecord.type == INVOICE) {
                setMontoLetras(objRecord);
            }
        }

        if ((eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY || eventType === context.UserEventType.EDIT) && typeof context.newRecord.getValue({ fieldId: 'void' }) == 'undefined') {
            const objRecord = context.newRecord;
            let descriptionTaxCode = getDescriptionTaxCode();
            try {
                let item = objRecord.getLineCount("item");
                if (item > 0) {
                    for (let i = 0; i < item; i++) {
                        let descTaxCode = descriptionTaxCode.find(element => element.id == objRecord.getSublistValue({ sublistId: "item", fieldId: "taxcode", line: i }))
                        objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_tst_desc_iva', line: i, value: descTaxCode.description })
                    }
                }
                let expense = objRecord.getLineCount("expense");
                for (let i = 0; i < expense; i++) {
                    let descTaxCode = descriptionTaxCode.find(element => element.id == objRecord.getSublistValue({ sublistId: "expense", fieldId: "taxcode", line: i }))
                    objRecord.setSublistValue({ sublistId: 'expense', fieldId: 'custcol_tst_desc_iva', line: i, value: descTaxCode.description })
                }
            } catch (error) { }
        }
    }

    const afterSubmit = (context) => {
        let objRecord = context.newRecord;
        //**BLOQUE DE CONFIGURACIÓN DE AMBIENTE ======================================================================== */
        let varEnviroment = configEnviroment()
        //log.debug('varEnviromentAS', varEnviroment);
        TAX_ITEM_NS_EC = varEnviroment.tax_item_ns_ec;
        FORM_FACTURA_VENTA = varEnviroment.form_factura_venta;
        FORM_NOTA_CREDITO = varEnviroment.form_nota_credito;
        FORM_COMPROBANTE_RETENCION = varEnviroment.form_comprobante_retencion;
        //**============================================================================================================ */
        const eventType = context.type;
        const recordId = context.newRecord.id;
        log.error("afterSubmit", eventType);
        log.error("recordId", recordId);
        log.error("context.newRecord.type", context.newRecord.type);
        let userObj = runtime.getCurrentUser();

        if ((eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY || eventType === context.UserEventType.EDIT) /*&& userObj.id != 4)*/) {
            if (context.newRecord.type == CREDIT_MEMO) {
                let custForm = objRecord.getValue({ fieldId: 'customform' });
                let doctype;
                if (custForm == FORM_NOTA_CREDITO_COMPRA_INTERNAL) {
                    doctype = DOCUMENT_TYPE_CREDIT_MEMO_INTERNAL;
                } else {
                    doctype = DOCUMENT_TYPE_CREDIT_MEMO;
                }
                let palabraBuscada = "Withholding Tax";
                let prefix = 'NC-';

                try {
                    const memo = context.newRecord.getValue({ fieldId: 'memo' });
                    if (memo.includes(palabraBuscada)) {
                    } else {
                        log.error("start", "flow");
                        let objRecord = record.load({ type: CREDIT_MEMO, id: recordId, isDynamic: true });
                        let customform = objRecord.getValue({ fieldId: 'customform' });
                        log.error("customform", customform);
                        if (customform == FORM_NOTA_CREDITO_COMPRA) {
                            objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: DOCUMENT_TYPE_COMPROBANTE_RETENCION, ignoreFieldChange: true });
                            try {
                                objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: "", ignoreFieldChange: true });
                                objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: "", ignoreFieldChange: true });
                                objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: "", ignoreFieldChange: true });
                            } catch (error) {
                                log.error("error", error)
                            }
                            objRecord.save();
                        } else {
                            const docu_type = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                            //!VERIFCAR PARA ASIGNAR PREFIJO, SE ESTÁ VALIDANDO POR FORMULARIO.
                            let sql = "select custrecordts_ec_iniciales_tip_comprob as prefix from customrecordts_ec_tipo_doc_fiscal where id = ?"
                            let resultSet = query.runSuiteQL({ query: sql, params: [docu_type] }).asMappedResults();
                            prefix = resultSet.length > 0 ? resultSet[0].prefix : 0;
                            //objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: DOCUMENT_TYPE_CREDIT_MEMO, ignoreFieldChange: true });
                            let location = objRecord.getValue({ fieldId: 'location' });
                            let total = String(objRecord.getValue({ fieldId: 'total' }));
                            let montoLetras = NumeroALetras(total, { plural: 'DOLARES', singular: 'DOLAR', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                            let documentref = objRecord.getValue({ fieldId: 'custbodyts_ec_doc_type_ref' });
                            let getserie = getSerie(doctype, location, prefix, documentref);
                            let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'afterSubmit');
                            objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                            objRecord.setValue({ fieldId: 'custbody_ts_ec_monto_letras', value: montoLetras });
                            try {
                                objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Credit_Memo_FEL_Template, ignoreFieldChange: true });
                                objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: For_Generation_Status, ignoreFieldChange: true });
                                objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_FEL_Sending_Method_nc, ignoreFieldChange: true });
                            } catch (error) {
                                log.error("error", error)
                            }
                            objRecord.save();
                        }
                    }
                } catch (error) {
                    log.error('CREDIT MEMO - Error-afterSubmit-Intro ', error);
                }
            } else if (context.newRecord.type == INVOICE && eventType === context.UserEventType.CREATE) {
                let documentref = '';
                let location_id = objRecord.getValue({ fieldId: 'location' });
                doctype = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                prefix = 'FAC-';
                try {
                    let getserie = getSerie(doctype, location_id, prefix, documentref);
                    let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'afterSubmit');
                    updateTransaction(objRecord.type, objRecord.id, correlative.numbering);
                } catch (error) {
                    log.error('Error-afterSubmit-Intro', error);
                }
            } else if (context.newRecord.type == FACTURA_INTERNA && eventType === context.UserEventType.CREATE) {
                log.error('FACTURA_INTERNA', FACTURA_INTERNA);
                let documentref = '';
                let location_id = objRecord.getValue({ fieldId: 'location' });
                doctype = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                prefix = 'FAC-';
                try {
                    let getserie = getSerie(doctype, location_id, prefix, documentref);
                    log.error('getserie-afterSubmit-Intro', getserie);
                    let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'afterSubmit');
                    log.error('correlative-afterSubmit-Intro', correlative);
                    let objSave = {
                        custbody_ts_ec_serie_cxc: getserie.serieid,
                        tranid: correlative.numbering
                    }
                    log.error('objSave-afterSubmit-Intro', objSave);
                    updateTransaction(objRecord.type, objRecord.id, correlative.numbering, correlative.correlative);
                    updateTransaction2(objRecord.type, objRecord.id, objSave);
                } catch (error) {
                    log.error('Error-afterSubmit-Intro', error);
                }
            } else if (context.newRecord.type == EJECUCION_PEDIDO_ARTICULO) {
                log.error('afterSubmit EJECUCION_PEDIDO_ARTICULO', 'afterSubmit');
                var formulario = objRecord.getValue('customform')// 143 Proveduria
                log.error('formulario', formulario);
                if (formulario != 143) {
                    let documentref = '';
                    let OServ = objRecord.getValue({ fieldId: 'createdfrom' });
                    let typeTransaction = search.lookupFields({
                        type: 'transaction',
                        id: OServ,
                        columns: ['location']
                    });
                    let location_ej = typeTransaction.location[0].value;
                    doctype = DOCUMENT_TYPE_GUIA_REMISION;
                    prefix = 'GDR-';
                    try {
                        let getserie = getSerie(doctype, location_ej, prefix, documentref);
                        let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'afterSubmit');
                        objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                        log.error('afterSubmit objRecord.type', objRecord.type);
                        log.error('afterSubmit recordId', recordId);
                        log.error("correlative", correlative);
                        var recordLoad = record.load({ type: objRecord.type, id: recordId, isDynamic: false });
                        recordLoad.setValue('tranid', correlative.numbering);
                        try {
                            recordLoad.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Guia_De_Remision_FEL_Template, ignoreFieldChange: true });
                            recordLoad.setValue({ fieldId: 'custbody_psg_ei_status', value: For_Generation_Status, ignoreFieldChange: true });
                            recordLoad.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_Guia_De_Remision_FEL_Sendings, ignoreFieldChange: true });
                        } catch (error) {
                            log.error("error", error);
                        }
                        recordLoad.save({ ignoreMandatoryFields: true, enableSourcing: false });
                    } catch (error) {
                        log.error('Error-beforeSubmit-Intro', error);
                    }
                } else {
                    let OServ = objRecord.getValue({ fieldId: 'createdfrom' });
                    let typeTransaction = search.lookupFields({
                        type: 'transaction',
                        id: OServ,
                        columns: ['statusRef']
                    });

                    let estado = typeTransaction.statusRef[0].value;
                    if (estado == 'pendingBilling') {
                        var recordLoad = record.load({ type: 'salesorder', id: OServ, isDynamic: false });
                        let cant_Item = recordLoad.getLineCount(ITEM);
                        for (let i = 0; i < cant_Item; i++) {
                            recordLoad.setSublistValue({ sublistId: ITEM, fieldId: 'isclosed', line: i, value: true });
                        }
                        recordLoad.save({ ignoreMandatoryFields: true, enableSourcing: false });
                    }
                }
            } else if (context.newRecord.type == VENDOR_BILL) {
                let openRecord = record.load({ type: VENDOR_BILL, id: recordId, isDynamic: true });
                let tipoDocumentoFiscal = openRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                if (tipoDocumentoFiscal == DOCUMENT_TYPE_LIQUIDACION_COMPRA) {
                    let prefix = 'LC-';
                    let location = openRecord.getValue({ fieldId: 'location' });
                    let documentref = openRecord.getValue({ fieldId: 'custbodyts_ec_doc_type_ref' });
                    let getserie = getSerie(tipoDocumentoFiscal, location, prefix, documentref);
                    let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'afterSubmit');
                    //openRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: doctype, ignoreFieldChange: true });
                    openRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                    openRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                    openRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                }
                try {
                    if (openRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.APPROVED && openRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' }) == DOCUMENT_TYPE_LIQUIDACION_COMPRA) {
                        openRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Liquidacion_Compra_FEL_Template, ignoreFieldChange: true });
                        openRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: For_Generation_Status, ignoreFieldChange: true });
                        openRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_Liquidacion_Compra_FEL_Sending, ignoreFieldChange: true });
                    } else if (openRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.PENDING_APPROVAL && openRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' }) == DOCUMENT_TYPE_LIQUIDACION_COMPRA) {
                        openRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: '', ignoreFieldChange: true });
                        openRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: '', ignoreFieldChange: true });
                        openRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: '', ignoreFieldChange: true });
                    }
                } catch (error) {
                    log.error("error", error)
                }
                openRecord.save();
            } else if (context.newRecord.type == BILL_CREDIT) {
                // EN DESHUSO, se deja por si llega a cambiar
                let palabraBuscada = "Withholding Tax";
                let memo = context.newRecord.getValue({ fieldId: 'memo' });
                if (memo.includes(palabraBuscada)) {
                    let doctype = DOCUMENT_TYPE_COMPROBANTE_RETENCION;
                    let prefix = 'CR-';
                    let objRecord = record.load({ type: BILL_CREDIT, id: recordId, isDynamic: true });
                    let location = objRecord.getValue({ fieldId: 'location' });
                    let total = String(objRecord.getValue({ fieldId: 'total' }));
                    let montoLetras = NumeroALetras(total, { plural: 'DOLARES', singular: 'DOLAR', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                    let documentref = objRecord.getValue({ fieldId: 'custbodyts_ec_doc_type_ref' });
                    let getserie = getSerie(doctype, location, prefix, documentref);
                    let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'afterSubmit');

                    objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: doctype, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_monto_letras', value: montoLetras });

                    try {
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Comprobante_Retencion_FEL_Template, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: For_Generation_Status, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_Comprobante_Retencion_FEL_Sending, ignoreFieldChange: true });
                    } catch (error) {
                        log.error("error", error)
                    }
                    objRecord.save();
                }
            } else if (context.newRecord.type == SERVICE_ORDER && eventType === context.UserEventType.EDIT) {
                // Primer Scheduled Script para EC Ordenes de Servicios
                try {
                    let scheduledScript = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    scheduledScript.scriptId = 'customscript_ts_ss_actual_correla_os';
                    scheduledScript.deploymentId = 'customdeploy_ts_ss_actual_correla_os';
                    scheduledScript.params = { 'custscript_ht_punto_inicio_o': '0' };
                    scheduledScript.submit();
                    log.debug("se ejecuto el script actualizar correlativos")
                } catch (error) {
                    log.error('Error-Update', error);
                }
                // Segundo Scheduled Script para EC Orden de Proveduría
                try {
                    let scheduledScript = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    scheduledScript.scriptId = 'customscript_ts_ss_actual_correla_osp';
                    scheduledScript.deploymentId = 'customdeploy_ts_ss_actual_correla_osp';
                    scheduledScript.params = { 'custscript_ht_punto_inicio_os': '0' };
                    scheduledScript.submit();
                    log.debug("se ejecuto el script actualizar correlativos P")
                } catch (error) {
                    log.error('Error-Update', error);
                }

            } else if (context.newRecord.type == _constant.Transaction.TRANSFER_ORDER) {
                try {
                    let objRecord = record.load({ type: _constant.Transaction.TRANSFER_ORDER, id: recordId, isDynamic: true });
                    objRecord.setValue({ fieldId: 'custbody_psg_ei_trans_edoc_standard', value: _constant.Constants.FEL.ELECTRONIC_DOCUMENT_PACKAGE, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: _constant.Constants.FEL.EC_EI_TEMPLATE_TRANSFER_ORDER, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_edoc_gen_trans_pdf', value: true, ignoreFieldChange: true });
                    objRecord.save();
                } catch (error) {
                    log.error("error", error)
                }
            }
            try {
                let scheduledScript = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                scheduledScript.scriptId = 'customscript_ts_ss_actualizacion_correla';
                scheduledScript.deploymentId = 'customdeploy_ts_ss_actualizacion_correla';
                scheduledScript.params = { 'custscript_ht_punto_inicio': '0' };
                //scheduledScript.submit();
            } catch (error) {
                log.error('Error-Update', error);
            }
        }

        if ((eventType === context.UserEventType.EDIT || eventType === context.UserEventType.CREATE)) {
            if (objRecord.type == _constant.Transaction.VENDOR_PAYMENT) {
                let arrayBills = new Array();
                try {
                    let objSearch = search.create({
                        type: objRecord.type,
                        filters:
                            [
                                ["type", "anyof", "VendPymt"],
                                "AND",
                                ["internalid", "anyof", recordId],
                                "AND",
                                ["appliedtotransaction", "noneof", "@NONE@"],
                                "AND",
                                ["appliedtotransaction.custbody_ht_comision_pago", "is", "T"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "appliedtotransaction", label: "Applied To Transaction" }),
                                // search.createColumn({ name: "lastmodifieddate", sort: search.Sort.DESC, label: "Last Modified" }),
                                // search.createColumn({ name: "statusref", join: "appliedToTransaction", label: "Status" }),
                                // search.createColumn({ name: "custbody5", join: "appliedToTransaction", label: "HT_COMISION_PAGO" })
                            ]
                    });
                    let searchResultCount = objSearch.runPaged().count;
                    if (searchResultCount > 0) {
                        objSearch.run().each(result => {
                            let billid = result.getValue('appliedtotransaction');
                            arrayBills.push(billid);
                            return true;
                        });
                        log.debug('arrayBills', arrayBills);

                        for (let i in arrayBills) {
                            //log.debug('Bill', arrayBills[i]);
                            let objSearch2 = search.create({
                                type: _constant.customRecord.COMISIONES_EXTERNAS,
                                filters:
                                    [
                                        ["custrecord_ht_factura_comision", "anyof", arrayBills[i]],
                                        "AND",
                                        [["custrecord_ht_estado_comision", "noneof", _constant.Status.BILL_PAID_IN_FULL], "OR", ["custrecord_ht_estado_ce", "noneof", _constant.Status.PAGADO]]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "custrecord_ht_estado_comision", label: "HT ESTADO FACTURA " }),
                                        search.createColumn({ name: "custrecord_ht_estado_ce", label: "HT_ESTADO_COMISION" })
                                    ]
                            });
                            let searchResultCount = objSearch2.runPaged().count;
                            if (searchResultCount > 0) {
                                objSearch2.run().each(result => {
                                    try {
                                        let comisionid = record.submitFields({
                                            type: _constant.customRecord.COMISIONES_EXTERNAS,
                                            id: result.id,
                                            values: {
                                                custrecord_ht_estado_comision: _constant.Status.BILL_PAID_IN_FULL,
                                                custrecord_ht_estado_ce: _constant.Status.PAGADO
                                            },
                                            options: { enablesourcing: true }
                                        });
                                        log.debug('Estado Comisión', 'Comisión: ' + comisionid + ' actualizada!!!!')
                                    } catch (error) {
                                        log.errror('ErrorUpdateComision', error);
                                    }
                                    return true;
                                });
                            } else {
                                log.debug('Estado Comisión', 'Ya está con estado pagado o no existe un registro de comisión para la factura: ' + arrayBills[i]);
                            }
                        }
                    } else {
                        log.debug('Cantidad de Facturas pagadas', 'No se encontraron facturas')
                    }
                } catch (error) {
                    log.error('Error-VENDOR_PAYMENT', error);
                }
            }
        }

        if ((eventType === context.UserEventType.EDIT || eventType === context.UserEventType.COPY || eventType === context.UserEventType.CREATE) && typeof objRecord.getValue({ fieldId: 'void' }) == 'undefined' /*&& userObj.id != 4*/) {
            if (context.newRecord.type == VENDOR_BILL) {
                let baseRateEqualto0 = getBaseRateEqualto0(recordId);
                let baseRateNoObjetoIVA = getBaseRateNoObjetoIVA(recordId);
                let baseRateNotEqualto0 = getBaseRateNotEqualto0(recordId);
                let amountTax = getMontoIVATotal(recordId);
                let apply = setWithholdingVoucherField(objRecord, baseRateEqualto0, baseRateNoObjetoIVA, baseRateNotEqualto0, amountTax);
                apply == 0 ? setFieldsLocalization(objRecord, baseRateEqualto0, baseRateNoObjetoIVA, baseRateNotEqualto0, amountTax) : log.error("WithholdingTax", 'No Apply');
                if (apply == 0 && objRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.APPROVED && objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' }) == DOCUMENT_TYPE_LIQUIDACION_COMPRA && objRecord.getValue({ fieldId: 'custbody_psg_ei_template' }).length == 0) {
                    record.submitFields({
                        type: objRecord.type,
                        id: objRecord.id,
                        values: {
                            custbody_psg_ei_template: PE_Liquidacion_Compra_FEL_Template,
                            custbody_psg_ei_status: For_Generation_Status,
                            custbody_psg_ei_sending_method: PE_Liquidacion_Compra_FEL_Sending
                        }
                    })
                }
            }

            if (context.newRecord.type == BILL_CREDIT) {
                let baseRateEqualto0 = getBaseRateEqualto0(recordId);
                let baseRateNoObjetoIVA = getBaseRateNoObjetoIVA(recordId);
                let baseRateNotEqualto0 = getBaseRateNotEqualto0(recordId);
                let amountTax = getMontoIVATotal(recordId);
                let valores = new Object();
                valores.custbody_ec_monto_iva = amountTax
                valores.custbodyts_ec_base_rate0 = baseRateEqualto0[0].amount ? Math.abs(parseFloat(baseRateEqualto0[0].amount)) : 0;
                valores.custbodyts_ec_base_rate12 = baseRateNotEqualto0[0].amount ? Math.abs(parseFloat(baseRateNotEqualto0[0].amount)) : 0;
                valores.custbody_base_niva = baseRateNoObjetoIVA[0].amount ? Math.abs(parseFloat(baseRateNoObjetoIVA[0].amount)) : 0;
                log.debug('valores.custbody_ec_monto_iva', amountTax)
                log.debug('valores.custbodyts_ec_base_rate0', baseRateEqualto0[0].amount ? Math.abs(parseFloat(baseRateEqualto0[0].amount)) : 0)
                log.debug('valores.custbodyts_ec_base_rate12', baseRateNotEqualto0[0].amount ? Math.abs(parseFloat(baseRateNotEqualto0[0].amount)) : 0)
                log.debug('valores.custbody_base_niva', baseRateNoObjetoIVA[0].amount ? Math.abs(parseFloat(baseRateNoObjetoIVA[0].amount)) : 0)

                record.submitFields({
                    type: objRecord.type,
                    id: objRecord.id,
                    values: valores
                })
            }

            if (context.newRecord.type == CREDIT_MEMO && objRecord.getValue({ fieldId: 'customform' }) == FORM_COMPROBANTE_RETENCION) {
                let apply = setWithholdingVoucherFieldSales(objRecord);

                // if (apply == 0 && objRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.APPROVED && objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' }) == DOCUMENT_TYPE_LIQUIDACION_COMPRA && objRecord.getValue({ fieldId: 'custbody_psg_ei_template' }).length == 0) {
                //     record.submitFields({
                //         type: objRecord.type,
                //         id: objRecord.id,
                //         values: {
                //             custbody_psg_ei_template: PE_Liquidacion_Compra_FEL_Template,
                //             custbody_psg_ei_status: For_Generation_Status,
                //             custbody_psg_ei_sending_method: PE_Liquidacion_Compra_FEL_Sending
                //         }
                //     })
                // }
            }

            //log.error('Formulario', objRecord.getValue({ fieldId: 'customform' }));
            if ((context.newRecord.type == INVOICE && objRecord.getValue({ fieldId: 'customform' }) == FORM_FACTURA_VENTA) || (context.newRecord.type == CREDIT_MEMO && objRecord.getValue({ fieldId: 'customform' }) == FORM_NOTA_CREDITO)) {
                log.debug('Update', context.newRecord.type);
                log.debug('Formulario', objRecord.getValue({ fieldId: 'customform' }));
                let fieldsToUpdate = new Object();
                let baseRateEqualto0 = getBaseRateEqualto0(recordId);
                let baseRateNoObjetoIVA = getBaseRateNoObjetoIVA(recordId);
                let baseRateNotEqualto0 = getBaseRateNotEqualto0(recordId);
                let amountTax = getMontoIVATotal(recordId);
                fieldsToUpdate.custbodyts_ec_base_rate0 = baseRateEqualto0[0].amount ? Math.abs(parseFloat(baseRateEqualto0[0].amount)) : 0;
                fieldsToUpdate.custbodyts_ec_base_rate12 = baseRateNotEqualto0[0].amount ? Math.abs(parseFloat(baseRateNotEqualto0[0].amount)) : 0;
                fieldsToUpdate.custbody_base_niva = baseRateNoObjetoIVA[0].amount ? Math.abs(parseFloat(baseRateNoObjetoIVA[0].amount)) : 0;
                fieldsToUpdate.custbody_ec_monto_iva = amountTax;
                log.debug('fieldsToUpdate', fieldsToUpdate);
                updateMainFieldTransaction(objRecord.type, objRecord.id, fieldsToUpdate);


            }

            if (context.newRecord.type == INVOICE) {
                //INICIO Cambio JCEC 20/09/2024
                //Ejemplo de termino Valido (empieza por 'CREDITO DIRECTO A')
                let termino = ''
                try {
                    termino = objRecord.getText({ fieldId: 'terms' });
                } catch (error) { }
                if (termino && termino.startsWith('CREDITO DIRECTO A')) {
                    // if (objRecord.getValue({ fieldId: 'terms' })) {
                    //FIN Cambio JCEC 20/09/2024

                    let checkCuota = '';
                    let dueDate = '';
                    let objData = new Array();
                    let termSearchObj = search.create({
                        type: "term",
                        filters: [["internalid", "anyof", objRecord.getValue({ fieldId: 'terms' })]],
                        columns: [search.createColumn({ name: "installment", label: "Installment" })]
                    });
                    //let searchResultCount = termSearchObj.runPaged().count;
                    termSearchObj.run().each(result => {
                        checkCuota = result.getValue('installment')
                        log.debug('cuota configurada', checkCuota)
                        return true;
                    });

                    log.debug('checkCuota', checkCuota)
                    if (checkCuota) {
                        let invoiceSearchObj = search.create({
                            type: "invoice",
                            filters:
                                [
                                    ["type", "anyof", "CustInvc"],
                                    "AND",
                                    ["internalid", "anyof", objRecord.id],
                                    "AND",
                                    ["installment.duedate", "isnotempty", ""]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "duedate", join: "installment", label: "Due Date" })
                                ]
                        });
                        let searchResultCount = invoiceSearchObj.runPaged().count;
                        log.debug("invoiceSearchObj result count", searchResultCount);
                        invoiceSearchObj.run().each(result => {
                            dueDate = result.getValue({ name: "duedate", join: "installment", label: "Due Date" })
                            objData.push(dueDate)
                            return true;
                        });
                        log.debug('cuota objData', objData)
                        dueDate = getFechaMayor(objData)
                        log.debug('cuota dueDate', dueDate)

                        record.submitFields({
                            type: context.newRecord.type,
                            id: objRecord.id,
                            values: {
                                custbody_ht_ec_nro_cuotas: true,
                                custbody_ht_ec_fech_ven_fin: dueDate
                            }
                        })
                    } else {
                        record.submitFields({
                            type: context.newRecord.type,
                            id: objRecord.id,
                            values: {
                                custbody_ht_ec_nro_cuotas: false,
                                custbody_ht_ec_fech_ven_fin: ''
                            }
                        })
                    }
                } else {
                    record.submitFields({
                        type: context.newRecord.type,
                        id: objRecord.id,
                        values: {
                            custbody_ht_ec_nro_cuotas: false,
                            custbody_ht_ec_fech_ven_fin: ''
                        }
                    })
                }
            }
        }

        if ((eventType === context.UserEventType.COPY || eventType === context.UserEventType.CREATE)) {
            if (context.newRecord.type == VENDOR_BILL) {
                setDocumentValuesWithholdingVoucherField(objRecord);
            }
        }

        if (eventType === context.UserEventType.EDIT) {
            if (context.newRecord.type == INVOICE) {
                try {
                    let scheduledScript = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    scheduledScript.scriptId = 'customscript_ts_ss_actualizacion_correla';
                    scheduledScript.deploymentId = 'customdeploy_ts_ss_actualizacion_correla';
                    scheduledScript.params = { 'custscript_ht_punto_inicio': '2' };
                    scheduledScript.submit();
                } catch (error) {
                    log.error('Error-Update-Edit', error);
                }
            }

            if ((context.newRecord.type == VENDOR_BILL || context.newRecord.type == BILL_CREDIT) && !objRecord.getValue('custbody_ts_ec_preimpreso_retencion') && typeof objRecord.getValue({ fieldId: 'void' }) == 'undefined') {
                setDocumentValuesWithholdingVoucherField(objRecord);
            }

            if (context.newRecord.type == _constant.Transaction.TRANSFER_ORDER) {
                try {
                    let objRecord = record.load({ type: _constant.Transaction.TRANSFER_ORDER, id: recordId, isDynamic: true });
                    if (!objRecord.getValue({ fieldId: 'custbody_psg_ei_trans_edoc_standard' })) {
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_trans_edoc_standard', value: _constant.Constants.FEL.ELECTRONIC_DOCUMENT_PACKAGE, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: _constant.Constants.FEL.EC_EI_TEMPLATE_TRANSFER_ORDER, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_edoc_gen_trans_pdf', value: true, ignoreFieldChange: true });
                        objRecord.save();
                    }
                } catch (error) {
                    log.error("error", error)
                }
            }

            if (context.newRecord.type == FACTURA_INTERNA && typeof objRecord.getValue({ fieldId: 'void' }) != 'undefined') {
                log.error('Anulación', 'Proceso de Anulación de Factura Interna.');
                let creadoDesde = objRecord.getValue({ fieldId: 'custbody_ec_created_from_fac_int' })
                log.error('creadoDesde', `${creadoDesde} - ${typeof creadoDesde} - ${creadoDesde.length}`);
                if (creadoDesde.length > 0) {
                    let transactionSearchObj = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["type", "anyof", "CuTrSale112"],
                                "AND",
                                ["custbody_ec_created_from_fac_int", "anyof", creadoDesde],
                                "AND",
                                ["status", "anyof", "CuTrSale112:C"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "tranid", label: "Document Number" })
                            ]
                    });
                    let searchResultCount = transactionSearchObj.runPaged().count;
                    log.debug("Factura Interna result count", searchResultCount);
                    if (searchResultCount == 0) {
                        try {
                            let serviceOrderUpdate = record.submitFields({
                                type: SERVICE_ORDER,
                                id: creadoDesde,
                                values: {
                                    custbody_ec_estado_factura_interna: _constant.Status.FACTURA_INTERNA_ANULADA
                                },
                            })
                            log.error('serviceOrderUpdate', `Orden de Servicio Actualizada por acción de anulación de Factura Interna: ${serviceOrderUpdate}`);
                        } catch (error) {
                            log.error('Error-serviceOrderUpdate', error);
                        }
                    }
                }
            }
        }
    }

    const setDocumentValuesWithholdingVoucherField = (objRecord) => {
        let item = verifyWithholdingTaxApply(objRecord, "item");
        let expense = verifyWithholdingTaxApply(objRecord, "expense");
        if (item || expense) {
            log.error("setDocumentValuesWithholdingVoucherField", "setDocumentValuesWithholdingVoucherField");
            let doctype = DOCUMENT_TYPE_COMPROBANTE_RETENCION;
            let prefix = 'RET-';
            let location = objRecord.getValue({ fieldId: 'location' });
            let getserie = getSerie(doctype, location, prefix);
            let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr, 'afterSubmit');
            let fieldsToUpdate = {
                custbodyec_tipo_de_documento_retencion: doctype,
                custbody_ec_serie_cxc_retencion: getserie.serieid,
                custbody_ts_ec_preimpreso_retencion: correlative.correlative
            }
            try {
                if (objRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.APPROVED) {
                    fieldsToUpdate.custbody_psg_ei_template = PE_Liquidacion_Compra_FEL_Template;
                    fieldsToUpdate.custbody_psg_ei_status = For_Generation_Status;
                    fieldsToUpdate.custbody_psg_ei_sending_method = PE_Liquidacion_Compra_FEL_Sending;
                } else {
                    if (objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' }) != DOCUMENT_TYPE_LIQUIDACION_COMPRA) {
                        fieldsToUpdate.custbody_psg_ei_template = '';
                        fieldsToUpdate.custbody_psg_ei_status = '';
                        fieldsToUpdate.custbody_psg_ei_sending_method = '';
                    }
                }
            } catch (error) {
                log.error("error", error)
            }
            log.error("fieldsToUpdate RETENCION", "fieldsToUpdate");
            try {
                updateMainFieldTransaction(objRecord.type, objRecord.id, fieldsToUpdate);
            } catch (error) {

            }
        }
    }

    const setWithholdingVoucherField = (objRecord, baseRateEqualto0, baseRateNoObjetoIVA, baseRateNotEqualto0, amountTax) => {
        let retorno = 0;
        let fieldsToUpdate = new Object();
        let item = verifyWithholdingTaxApply(objRecord, "item");
        let expense = verifyWithholdingTaxApply(objRecord, "expense");
        let serie = getSerieLocalization(DOCUMENT_TYPE_COMPROBANTE_RETENCION, objRecord.getValue('subsidiary'), objRecord.getValue('location'));
        if (item) {
            retorno = 1
            let withholdingTaxCodeList = new Object(), withholdingCodeId = new Object();
            let lines = objRecord.getLineCount("item");
            for (let line = 0; line < lines; line++) {
                let apply = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line });
                if (apply) {
                    let withholdingTaxCode = objRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxcode", line });
                    let baseAmount = Number(objRecord.getSublistValue({ sublistId: "item", fieldId: "amount", line }));
                    let rate = Number(objRecord.getSublistValue({ sublistId: "item", fieldId: "taxrate1", line })) / 100;
                    let taxAmount = /*roundTwoDecimal*/(rate * baseAmount);
                    if (withholdingTaxCodeList[withholdingTaxCode] !== undefined) {
                        withholdingTaxCodeList[withholdingTaxCode].baseAmount = /*roundTwoDecimal*/(withholdingTaxCodeList[withholdingTaxCode].baseAmount + baseAmount);
                        withholdingTaxCodeList[withholdingTaxCode].taxAmount = /*roundTwoDecimal*/(withholdingTaxCodeList[withholdingTaxCode].taxAmount + taxAmount);
                    } else {
                        withholdingTaxCodeList[withholdingTaxCode] = { withholdingTaxCode, baseAmount, taxAmount };
                    }
                    withholdingCodeId[withholdingTaxCode] = withholdingTaxCode;
                }
            }
            let withhHoldingTaxList = getWithholdingTaxJson(withholdingTaxCodeList, Object.keys(withholdingCodeId));
            //log.error('withhHoldingTaxList', withhHoldingTaxList);
            var updateTransaction = false;
            let sumaBaseIVA = 0;
            let retencion = 0;

            for (let key in withhHoldingTaxList.item) {
                if (withhHoldingTaxList.item.hasOwnProperty(key)) {
                    let withholdingTax = withhHoldingTaxList.item[key];
                    if (withholdingTax.type == "RENTA") {
                        retencion++
                        if (retencion == 1) {
                            fieldsToUpdate.custbody_ec_importe_base_ir = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_ir = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_monto_de_ret_ir = /*roundTwoDecimal*/(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_porcentaje_ret_ir = withholdingTax.taxRate;
                        }

                        if (retencion == 2) {
                            fieldsToUpdate.custbody_ec_impb_ir2 = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_por_ir2 = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_mont_ret_2 = /*roundTwoDecimal*/(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_ret_ir2 = withholdingTax.taxRate;
                        }

                        if (retencion == 3) {
                            fieldsToUpdate.custbody_ec_impb_ir3 = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_por_ir3 = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_mont_ret_3 = /*roundTwoDecimal*/(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_ret_ir3 = withholdingTax.taxRate;
                        }
                        updateTransaction = true;
                    }
                    if (withholdingTax.type == "IVA") {
                        sumaBaseIVA += withholdingTax.taxAmount;
                        fieldsToUpdate.custbody_ec_importe_base_iva = sumaBaseIVA;
                        if (withholdingTax.taxRate == 10) {
                            fieldsToUpdate.custbody_cod_ret_iva_10 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_10 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_baseiva_10 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 20) {
                            fieldsToUpdate.custbody_cod_ret_iva_20 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_20 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_baseiva_20 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 30) {
                            fieldsToUpdate.custbody_cod_ret_iva_30 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_30 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_baseiva_30 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 70) {
                            fieldsToUpdate.custbody_cod_ret_iva_70 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_70 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_baseiva_70 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 100) {
                            fieldsToUpdate.custbody_cod_ret_iva_100 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_100 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_baseiva_100 = withholdingTax.taxAmount
                        }
                        updateTransaction = true;
                    }
                }
            }

            fieldsToUpdate.custbodyts_ec_base_rate0 = baseRateEqualto0[0].amount ? Math.abs(parseFloat(baseRateEqualto0[0].amount)) : 0;
            fieldsToUpdate.custbodyts_ec_base_rate12 = baseRateNotEqualto0[0].amount ? Math.abs(parseFloat(baseRateNotEqualto0[0].amount)) : 0;
            fieldsToUpdate.custbody_base_niva = baseRateNoObjetoIVA[0].amount ? Math.abs(parseFloat(baseRateNoObjetoIVA[0].amount)) : 0;
            if (objRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.APPROVED && objRecord.getValue({ fieldId: 'custbody_psg_ei_template' }).length == 0) {
                try {
                    fieldsToUpdate.custbody_psg_ei_template = PE_Liquidacion_Compra_FEL_Template;
                    fieldsToUpdate.custbody_psg_ei_status = For_Generation_Status;
                    fieldsToUpdate.custbody_psg_ei_sending_method = PE_Liquidacion_Compra_FEL_Sending;
                } catch (error) {
                    log.error("Error-Template", error);
                }
            }
            fieldsToUpdate.custbody_ec_monto_iva = amountTax;
            fieldsToUpdate.custbodyec_tipo_de_documento_retencion = DOCUMENT_TYPE_COMPROBANTE_RETENCION;
            fieldsToUpdate.custbody_ec_serie_cxc_retencion = serie
            if (updateTransaction) updateMainFieldTransaction(objRecord.type, objRecord.id, fieldsToUpdate);
        } else if (expense) {
            retorno = 1
            let withholdingTaxCodeList = {}, withholdingCodeId = {};
            let lines = objRecord.getLineCount("expense");
            for (let line = 0; line < lines; line++) {
                let apply = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxapplies', line });
                if (apply) {
                    let withholdingTaxCode = objRecord.getSublistValue({ sublistId: "expense", fieldId: "custcol_4601_witaxcode_exp", line });
                    let baseAmount = Number(objRecord.getSublistValue({ sublistId: "expense", fieldId: "amount", line }));
                    let rate = Number(objRecord.getSublistValue({ sublistId: "expense", fieldId: "taxrate1", line })) / 100;
                    let taxAmount = /*roundTwoDecimal*/(rate * baseAmount);
                    if (withholdingTaxCodeList[withholdingTaxCode] !== undefined) {
                        withholdingTaxCodeList[withholdingTaxCode].baseAmount = /*roundTwoDecimal*/(withholdingTaxCodeList[withholdingTaxCode].baseAmount + baseAmount);
                        withholdingTaxCodeList[withholdingTaxCode].taxAmount = /*roundTwoDecimal*/(withholdingTaxCodeList[withholdingTaxCode].taxAmount + taxAmount);
                    } else {
                        withholdingTaxCodeList[withholdingTaxCode] = { withholdingTaxCode, baseAmount, taxAmount };
                    }
                    withholdingCodeId[withholdingTaxCode] = withholdingTaxCode;
                }
            }
            let withhHoldingTaxList = getWithholdingTaxJson(withholdingTaxCodeList, Object.keys(withholdingCodeId));
            log.debug('withhHoldingTaxList', withhHoldingTaxList)
            var updateTransaction = false;
            let sumaBaseIVA = 0;
            let retencion = 0;

            for (let key in withhHoldingTaxList.account) {
                if (withhHoldingTaxList.account.hasOwnProperty(key)) {
                    let withholdingTax = withhHoldingTaxList.account[key];
                    if (withholdingTax.type == "RENTA") {
                        retencion++
                        if (retencion == 1) {
                            fieldsToUpdate.custbody_ec_importe_base_ir = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_ir = withholdingTax.withholdingTax;
                            // log.debug('fieldsToUpdate.custbody_ec_monto_de_ret_ir', parseFloat(withholdingTax.baseAmount) + ' * ' + parseFloat(withholdingTax.taxRate) / 100)
                            fieldsToUpdate.custbody_ec_monto_de_ret_ir = /*roundTwoDecimal*/(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_porcentaje_ret_ir = withholdingTax.taxRate;
                        }

                        if (retencion == 2) {
                            fieldsToUpdate.custbody_ec_impb_ir2 = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_por_ir2 = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_mont_ret_2 = /*roundTwoDecimal*/(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_ret_ir2 = withholdingTax.taxRate;
                        }

                        if (retencion == 3) {
                            fieldsToUpdate.custbody_ec_impb_ir3 = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_por_ir3 = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_mont_ret_3 = /*roundTwoDecimal*/(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_ret_ir3 = withholdingTax.taxRate;
                        }
                        updateTransaction = true;
                    }
                    if (withholdingTax.type == "IVA") {
                        sumaBaseIVA += withholdingTax.taxAmount;
                        fieldsToUpdate.custbody_ec_importe_base_iva = sumaBaseIVA;
                        if (withholdingTax.taxRate == 10) {
                            fieldsToUpdate.custbody_cod_ret_iva_10 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_10 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100))
                            fieldsToUpdate.custbody_baseiva_10 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 20) {
                            fieldsToUpdate.custbody_cod_ret_iva_20 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_20 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100))
                            fieldsToUpdate.custbody_baseiva_20 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 30) {
                            fieldsToUpdate.custbody_cod_ret_iva_30 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_30 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100))
                            fieldsToUpdate.custbody_baseiva_30 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 70) {
                            fieldsToUpdate.custbody_cod_ret_iva_70 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_70 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100))
                            fieldsToUpdate.custbody_baseiva_70 = withholdingTax.taxAmount
                        }
                        if (withholdingTax.taxRate == 100) {
                            fieldsToUpdate.custbody_cod_ret_iva_100 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_100 = /*roundTwoDecimal*/(parseFloat(withholdingTax.taxAmount) * (parseFloat(withholdingTax.taxRate) / 100))
                            fieldsToUpdate.custbody_baseiva_100 = withholdingTax.taxAmount
                        }
                        updateTransaction = true;
                    }
                }
            }

            fieldsToUpdate.custbodyts_ec_base_rate0 = baseRateEqualto0[0].amount ? Math.abs(parseFloat(baseRateEqualto0[0].amount)) : 0;
            fieldsToUpdate.custbodyts_ec_base_rate12 = baseRateNotEqualto0[0].amount ? Math.abs(parseFloat(baseRateNotEqualto0[0].amount)) : 0;
            fieldsToUpdate.custbody_base_niva = baseRateNoObjetoIVA[0].amount ? Math.abs(parseFloat(baseRateNoObjetoIVA[0].amount)) : 0;
            if (objRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.APPROVED && objRecord.getValue({ fieldId: 'custbody_psg_ei_template' }).length == 0) {
                try {
                    fieldsToUpdate.custbody_psg_ei_template = PE_Liquidacion_Compra_FEL_Template;
                    fieldsToUpdate.custbody_psg_ei_status = For_Generation_Status;
                    fieldsToUpdate.custbody_psg_ei_sending_method = PE_Liquidacion_Compra_FEL_Sending;
                } catch (error) {
                    log.error("Error-Template", error)
                }
            }
            fieldsToUpdate.custbody_ec_monto_iva = amountTax;
            fieldsToUpdate.custbodyec_tipo_de_documento_retencion = DOCUMENT_TYPE_COMPROBANTE_RETENCION;
            fieldsToUpdate.custbody_ec_serie_cxc_retencion = serie;
            if (updateTransaction) updateMainFieldTransaction(objRecord.type, objRecord.id, fieldsToUpdate);
        }
        return retorno;
    }

    const setWithholdingVoucherFieldSales = (objRecord/*, baseRateEqualto0, baseRateNoObjetoIVA, baseRateNotEqualto0, amountTax*/) => {
        let retorno = 0;
        let fieldsToUpdate = new Object();

        //let item = /*verifyWithholdingTaxApply(objRecord, "item")*/ true;
        //let expense = verifyWithholdingTaxApply(objRecord, "expense");
        let serie = getSerieLocalization(DOCUMENT_TYPE_COMPROBANTE_RETENCION, objRecord.getValue('subsidiary'), objRecord.getValue('location'));
        let esRetencion = objRecord.getValue('custbodyec_tipo_de_documento_retencion');
        if (esRetencion == DOCUMENT_TYPE_COMPROBANTE_RETENCION) {
            //log.debug('item', item);
            retorno = 1
            let withholdingTaxCodeList = new Object(), withholdingCodeId = new Object();
            let lines = objRecord.getLineCount("item");
            for (let line = 0; line < lines; line++) {
                // let apply = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line });
                // if (apply) {
                let withholdingTaxCode = objRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_4601_witaxcode", line });
                let baseAmount = Number(objRecord.getSublistValue({ sublistId: "item", fieldId: "amount", line }));
                let rate = Number(objRecord.getSublistValue({ sublistId: "item", fieldId: "taxrate1", line })) / 100;
                let taxAmount = /*roundTwoDecimal*/(rate * baseAmount);
                if (withholdingTaxCodeList[withholdingTaxCode] !== undefined) {
                    withholdingTaxCodeList[withholdingTaxCode].baseAmount = /*roundTwoDecimal*/(withholdingTaxCodeList[withholdingTaxCode].baseAmount + baseAmount);
                    withholdingTaxCodeList[withholdingTaxCode].taxAmount = /*roundTwoDecimal*/(withholdingTaxCodeList[withholdingTaxCode].taxAmount + taxAmount);
                } else {
                    withholdingTaxCodeList[withholdingTaxCode] = { withholdingTaxCode, baseAmount, taxAmount };
                }
                withholdingCodeId[withholdingTaxCode] = withholdingTaxCode;
                // }
            }
            let withhHoldingTaxList = getWithholdingTaxJson(withholdingTaxCodeList, Object.keys(withholdingCodeId));
            log.error('withhHoldingTaxList', withhHoldingTaxList);
            var updateTransaction = false;
            let sumaBaseIVA = 0;
            let retencion = 0;
            let importeBaseIVA10 = 0;
            let importeBaseIVA20 = 0;
            let importeBaseIVA30 = 0;
            let importeBaseIVA70 = 0;
            let importeBaseIVA100 = 0;

            for (let key in withhHoldingTaxList.item) {
                if (withhHoldingTaxList.item.hasOwnProperty(key)) {
                    let withholdingTax = withhHoldingTaxList.item[key];
                    if (withholdingTax.type == "RENTA") {
                        retencion++
                        if (retencion == 1) {
                            fieldsToUpdate.custbody_ec_importe_base_ir = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_ir = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_monto_de_ret_ir = roundTwoDecimal(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_porcentaje_ret_ir = withholdingTax.taxRate;
                        }

                        if (retencion == 2) {
                            fieldsToUpdate.custbody_ec_impb_ir2 = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_por_ir2 = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_mont_ret_2 = roundTwoDecimal(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_ret_ir2 = withholdingTax.taxRate;
                        }

                        if (retencion == 3) {
                            fieldsToUpdate.custbody_ec_impb_ir3 = withholdingTax.baseAmount;
                            fieldsToUpdate.custbody_ec_ret_por_ir3 = withholdingTax.withholdingTax;
                            fieldsToUpdate.custbody_ec_mont_ret_3 = roundTwoDecimal(parseFloat(withholdingTax.baseAmount) * (parseFloat(withholdingTax.taxRate) / 100));
                            fieldsToUpdate.custbody_ec_ret_ir3 = withholdingTax.taxRate;
                        }
                        updateTransaction = true;
                    }
                    if (withholdingTax.type == "IVA") {
                        sumaBaseIVA += withholdingTax.baseAmount;
                        fieldsToUpdate.custbody_ec_mont_retiva = sumaBaseIVA;
                        if (parseInt(withholdingTax.taxRate) == 10) {
                            fieldsToUpdate.custbody_cod_ret_iva_10 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_10 = parseFloat(withholdingTax.baseAmount);
                            fieldsToUpdate.custbody_baseiva_10 = withholdingTax.taxAmount
                            importeBaseIVA10 = parseFloat(withholdingTax.baseAmount) / 0.1;

                        }
                        if (parseInt(withholdingTax.taxRate) == 20) {
                            fieldsToUpdate.custbody_cod_ret_iva_20 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_20 = parseFloat(withholdingTax.baseAmount);
                            fieldsToUpdate.custbody_baseiva_20 = withholdingTax.taxAmount
                            importeBaseIVA20 = parseFloat(withholdingTax.baseAmount) / 0.2;
                        }
                        if (parseInt(withholdingTax.taxRate) == 30) {
                            fieldsToUpdate.custbody_cod_ret_iva_30 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_30 = parseFloat(withholdingTax.baseAmount)
                            fieldsToUpdate.custbody_baseiva_30 = withholdingTax.taxAmount
                            importeBaseIVA30 = parseFloat(withholdingTax.baseAmount) / 0.3;
                        }
                        if (parseInt(withholdingTax.taxRate) == 70) {
                            fieldsToUpdate.custbody_cod_ret_iva_70 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_70 = parseFloat(withholdingTax.baseAmount);
                            fieldsToUpdate.custbody_baseiva_70 = withholdingTax.taxAmount
                            importeBaseIVA70 = parseFloat(withholdingTax.baseAmount) / 0.7;
                        }
                        if (parseInt(withholdingTax.taxRate) == 100) {
                            fieldsToUpdate.custbody_cod_ret_iva_100 = withholdingTax.withholdingTax
                            fieldsToUpdate.custbody_ec_porcentaje_ret_100 = parseFloat(withholdingTax.baseAmount);
                            fieldsToUpdate.custbody_baseiva_100 = withholdingTax.taxAmount
                            importeBaseIVA100 = parseFloat(withholdingTax.baseAmount) / 1;
                        }
                        updateTransaction = true;
                    }
                }
            }

            if (objRecord.getValue({ fieldId: 'approvalstatus' }) == _constant.Status.APPROVED && objRecord.getValue({ fieldId: 'custbody_psg_ei_template' }).length == 0) {
                try {
                    fieldsToUpdate.custbody_psg_ei_template = PE_Liquidacion_Compra_FEL_Template;
                    fieldsToUpdate.custbody_psg_ei_status = For_Generation_Status;
                    fieldsToUpdate.custbody_psg_ei_sending_method = PE_Liquidacion_Compra_FEL_Sending;
                } catch (error) {
                    log.error("Error-Template", error);
                }
            }
            fieldsToUpdate.custbody_ec_importe_base_iva = importeBaseIVA10 + importeBaseIVA20 + importeBaseIVA30 + importeBaseIVA70 + importeBaseIVA100;
            log.debug('fieldsToUpdate', fieldsToUpdate);
            if (updateTransaction) updateMainFieldTransaction(objRecord.type, objRecord.id, fieldsToUpdate);
        }
        return retorno;
    }

    const updateMainFieldTransaction = (type, id, values) => {
        record.submitFields({ type, id, values });
    }

    const roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
    }

    const getWithholdingTaxJson = (withholdingTaxCodeList, withholdingTaxCodeIds) => {
        log.error("withholdingCode", { withholdingTaxCodeList, withholdingTaxCodeIds });
        let result = { "account": {}, "item": {} };
        let searchResult = search.create({
            type: "customrecord_4601_witaxcode",
            filters: [
                ["internalid", "anyof", withholdingTaxCodeIds],
                "AND",
                [["custrecord_4601_wtc_availableon", "is", "both"], "OR", ["custrecord_4601_wtc_availableon", "is", "onpurcs"], "OR", ["custrecord_4601_wtc_availableon", "is", "onsales"]]
            ],
            columns: [
                search.createColumn({ name: "custrecord_4601_wtc_istaxgroup", label: "Grupo de impuestos" }),
                search.createColumn({ name: "custrecord_4601_wtt_purcitem", join: "CUSTRECORD_4601_WTC_WITAXTYPE" }),
                search.createColumn({ name: "custrecord_4601_wtt_purcaccount", join: "CUSTRECORD_4601_WTC_WITAXTYPE" }),
                search.createColumn({ name: "custrecord_4601_gwtc_code", join: "CUSTRECORD_4601_WTC_GROUPEDWITAXCODES" }),
                search.createColumn({ name: "custrecord_ts_ec_witaxcode_tipo_retencio" }),
                search.createColumn({ name: "custrecord_4601_wtc_rate" })
            ]
        }).run().getRange(0, 1000);
        for (let i = 0; i < searchResult.length; i++) {
            let columns = searchResult[i].columns;
            let id = searchResult[i].id;
            let isTaxGroup = searchResult[i].getValue(columns[0]);
            let item = searchResult[i].getValue(columns[1]);
            let account = searchResult[i].getValue(columns[2]);
            let individualWithholdingCode = searchResult[i].getValue(columns[3]);
            let withholdingType = searchResult[i].getText(columns[4]);
            let taxRate = searchResult[i].getValue(columns[5]).replace('%', '');
            if (isTaxGroup) {
                let withholdingRecord = getWithholdingRecord(individualWithholdingCode);
                item = withholdingRecord.item;
                account = withholdingRecord.account;
                withholdingType = withholdingRecord.withholdingType;
                taxRate = withholdingRecord.taxRate;
                if (result["account"][account] === undefined) {
                    result["account"][account] = {
                        withholdingTax: individualWithholdingCode,
                        type: withholdingType,
                        baseAmount: withholdingTaxCodeList[id].baseAmount,
                        taxAmount: withholdingTaxCodeList[id].taxAmount,
                        taxRate: taxRate
                    };
                } else {
                    result["account"][account].baseAmount = /*roundTwoDecimal*/(result["account"][account].baseAmount + withholdingTaxCodeList[id].baseAmount);
                    result["account"][account].taxAmount = /*roundTwoDecimal*/(result["account"][account].taxAmount + withholdingTaxCodeList[id].taxAmount);
                }
                if (result["item"][item] === undefined) {
                    result["item"][item] = {
                        withholdingTax: individualWithholdingCode,
                        type: withholdingType,
                        baseAmount: withholdingTaxCodeList[id].baseAmount,
                        taxAmount: withholdingTaxCodeList[id].taxAmount,
                        taxRate: taxRate
                    };
                } else {
                    result["item"][item].baseAmount = /*roundTwoDecimal*/(result["item"][item].baseAmount + withholdingTaxCodeList[id].baseAmount);
                    result["item"][item].taxAmount = /*roundTwoDecimal*/(result["item"][item].taxAmount + withholdingTaxCodeList[id].taxAmount);
                }
            } else {
                if (result["account"][account] === undefined) {
                    result["account"][account] = {
                        withholdingTax: id,
                        type: withholdingType,
                        baseAmount: withholdingTaxCodeList[id].baseAmount,
                        taxAmount: withholdingTaxCodeList[id].taxAmount,
                        taxRate: taxRate
                    };
                } else {
                    result["account"][account].baseAmount = /*roundTwoDecimal*/(result["account"][account].baseAmount + withholdingTaxCodeList[id].baseAmount);
                    result["account"][account].taxAmount = /*roundTwoDecimal*/(result["account"][account].taxAmount + withholdingTaxCodeList[id].taxAmount);
                }

                if (result["item"][item] === undefined) {
                    result["item"][item] = {
                        withholdingTax: id,
                        type: withholdingType,
                        baseAmount: withholdingTaxCodeList[id].baseAmount,
                        taxAmount: withholdingTaxCodeList[id].taxAmount,
                        taxRate: taxRate
                    };
                } else {
                    result["item"][item].baseAmount = /*roundTwoDecimal*/(result["item"][item].baseAmount + withholdingTaxCodeList[id].baseAmount);
                    result["item"][item].taxAmount = /*roundTwoDecimal*/(result["item"][item].taxAmount + withholdingTaxCodeList[id].taxAmount);
                }
            }
        }
        log.error("result", result);
        return result;
    }

    const getWithholdingRecord = (withholdingTax) => {
        let searchResult = search.lookupFields({
            type: "customrecord_4601_witaxcode",
            id: withholdingTax,
            columns: [
                "custrecord_4601_wtc_witaxtype.custrecord_4601_wtt_purcitem",
                "custrecord_4601_wtc_witaxtype.custrecord_4601_wtt_purcaccount",
                "custrecord_ts_ec_witaxcode_tipo_retencio",
                "custrecord_4601_wtc_rate"
            ]
        });
        let withholdingType = searchResult["custrecord_ts_ec_witaxcode_tipo_retencio"].length ? searchResult["custrecord_ts_ec_witaxcode_tipo_retencio"][0].text : "";
        let item = searchResult["custrecord_4601_wtc_witaxtype.custrecord_4601_wtt_purcitem"][0].value;
        let account = searchResult["custrecord_4601_wtc_witaxtype.custrecord_4601_wtt_purcaccount"][0].value;
        let taxRate = searchResult["custrecord_4601_wtc_rate"].replace('%', '');
        log.error("getWithholdingRecord", { withholdingType, item, account, taxRate });
        return { withholdingType, item, account, taxRate };
    }

    const verifyWithholdingTaxApply = (objRecord, sublistId) => {
        let lines = objRecord.getLineCount(sublistId);
        for (let line = 0; line < lines; line++) {
            let apply = objRecord.getSublistValue({ sublistId, fieldId: 'custcol_4601_witaxapplies', line });
            if (apply) return apply;
        }
        return false;
    }

    const updateTransaction = (type, id, tranid, custbody_ts_ec_numero_preimpreso) => {
        let transactionId = record.submitFields({
            type,
            id,
            //cambio JCEC 22/08/2024
            // values: { tranid, custbody_ts_ec_numero_preimpreso }
            values: { tranid }
        });
        log.error("updateTransaction", { transactionId, tranid });
    }

    const updateTransaction2 = (type, id, tranid, custbody_ts_ec_numero_preimpreso) => {
        let transactionId = record.submitFields({ type, id, values: tranid });
        log.error("updateTransaction", { transactionId, tranid });
    }

    const getSerie = (documenttype, location, prefix, documentref = 0) => {
        let searchLoad = '';
        let serieResult = {
            'serieid': "",
            'peinicio': "",
            'serieimpr': ""
        }
        try {
            log.debug('DebugSearch1', documenttype + ' - ' + location + ' - ' + prefix + ' - ' + documentref)
            searchLoad = search.create({
                type: 'customrecordts_ec_series_impresion',
                filters: [
                    ['custrecord_ts_ec_tipo_documento', 'anyof', documenttype],
                    'AND',
                    ['custrecord_ts_ec_localidad_serie', 'anyof', location]
                ],
                columns: [
                    { name: 'internalid', sort: search.Sort.ASC },
                    'custrecord_ts_ec_rango_inicial',
                    'custrecord_ts_ec_series_impresion',
                    search.createColumn({ name: "custrecordts_ec_iniciales_tip_comprob", join: "custrecord_ts_ec_tipo_documento", label: "Status" }),
                ]
            });
            const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            if (searchResult.length) {
                const column01 = searchResult[0].getValue(searchLoad.columns[0]);
                let column02 = searchResult[0].getValue(searchLoad.columns[1]);
                let column03 = searchResult[0].getValue(searchLoad.columns[2]);
                let column04 = searchResult[0].getValue(searchLoad.columns[3]);
                column03 = column04 + '-' + column03;
                column02 = parseInt(column02);
                return {
                    'serieid': column01,
                    'peinicio': column02,
                    'serieimpr': column03
                };
            }
        } catch (error) {
            log.error({ title: 'getPeSerie', details: error });
        }
        return serieResult;
    }

    const generateCorrelative = (return_pe_inicio, serieid, serieimpr, funcion) => {
        let ceros;
        let correlative;
        let numbering;
        let this_number = return_pe_inicio + 1;

        if (funcion == 'afterSubmit') {
            log.error("generateCorrelative", { return_pe_inicio, serieid, serieimpr });
            const next_number = this_number
            log.error('afterSubmit', next_number);
            record.submitFields({ type: 'customrecordts_ec_series_impresion', id: serieid, values: { 'custrecord_ts_ec_rango_inicial': next_number } });
        }

        if (this_number.toString().length == 1) {
            ceros = '00000000';
        } else if (this_number.toString().length == 2) {
            ceros = '0000000';
        } else if (this_number.toString().length == 3) {
            ceros = '000000';
        } else if (this_number.toString().length == 4) {
            ceros = '00000';
        } else if (this_number.toString().length == 5) {
            ceros = '0000';
        } else if (this_number.toString().length == 6) {
            ceros = '000';
        } else if (this_number.toString().length == 7) {
            ceros = '00';
        } else if (this_number.toString().length = 8) {
            ceros = '0';
        } else if (this_number.toString().length >= 9) {
            ceros = '';
        }

        correlative = ceros + this_number;
        numbering = serieimpr + '-' + correlative;
        numbering = numbering.replace(/-/gi, "")
        return {
            'correlative': correlative,
            'numbering': numbering
        }
    }

    const getBaseRateEqualto0 = (internalid) => {
        try {
            let mainLineJson = new Object();
            let pushColumn = new Array();
            const vendorBillSearchFiltersequalto0 = [ //customsearch2492 // Vendor Bill Base Rate Igual a 0%  - DEVELOPER
                ['type', 'anyof', 'VendBill', 'VendCred', 'CustInvc', 'CustCred'],
                'AND',
                ['internalid', 'anyof', internalid],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['taxline', 'is', 'F'],
                "AND",
                ["taxitem", "noneof", TAX_ITEM_UNDEF, TAX_ITEM_NS_EC],
                "AND",
                ["taxitem.rate", "equalto", "0"]
            ];

            const vendorBillSearch = search.create({
                type: 'transaction',
                filters: vendorBillSearchFiltersequalto0,
                columns: [
                    search.createColumn({ name: 'amount', summary: search.Summary.SUM, label: 'amount' }),
                ],
            });

            const vendorBillSearchPagedData = vendorBillSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < vendorBillSearchPagedData.pageRanges.length; i++) {
                const vendorBillSearchPage = vendorBillSearchPagedData.fetch({ index: i });
                vendorBillSearchPage.data.forEach(result => {
                    vendorBillSearchPage.pagedData.searchDefinition.columns.forEach(column => {
                        var column_key = column.label || column.name;
                        mainLineJson[column_key] = result.getValue(column);
                    })
                    pushColumn.push(mainLineJson);
                });
            }
            return pushColumn;
        } catch (error) {
            log.error('Error-getBaseRateequalto0', error);
        }
    }

    const getBaseRateNoObjetoIVA = (internalid) => {
        try {
            let mainLineJson = new Object();
            let pushColumn = new Array();
            const vendorBillSearchFiltersequalto0 = [ //customsearch1834 // Vendor Bill No Objeto de IVA
                ['type', 'anyof', 'VendBill', 'VendCred', 'CustInvc', 'CustCred'],
                'AND',
                ['internalid', 'anyof', internalid],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['taxline', 'is', 'F'],
                "AND",
                ["taxitem", "noneof", TAX_ITEM_UNDEF],
                "AND",
                ["taxitem", "anyof", TAX_ITEM_NS_EC],
                "AND",
                ["taxitem.rate", "equalto", "0"]
            ];

            const vendorBillSearch = search.create({
                type: 'transaction',
                filters: vendorBillSearchFiltersequalto0,
                columns: [
                    search.createColumn({ name: 'amount', summary: search.Summary.SUM, label: 'amount' }),
                ],
            });

            const vendorBillSearchPagedData = vendorBillSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < vendorBillSearchPagedData.pageRanges.length; i++) {
                const vendorBillSearchPage = vendorBillSearchPagedData.fetch({ index: i });
                vendorBillSearchPage.data.forEach(result => {
                    vendorBillSearchPage.pagedData.searchDefinition.columns.forEach(column => {
                        var column_key = column.label || column.name;
                        mainLineJson[column_key] = result.getValue(column);
                    })
                    pushColumn.push(mainLineJson);
                });
            }
            return pushColumn;
        } catch (error) {
            log.error('Error-getBaseRateequalto0', error);
        }
    }

    const getBaseRateNotEqualto0 = (internalid) => {
        try {
            let mainLineJson = {};
            let pushColumn = new Array();
            const vendorBillSearchFiltersequalto0 = [ //customsearch2493 // Vendor Bill Base Rate Diferente de 0%  - DEVELOPER
                ['type', 'anyof', 'VendBill', 'VendCred', 'CustInvc', 'CustCred'],
                'AND',
                ['internalid', 'anyof', internalid],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['taxline', 'is', 'F'],
                "AND",
                ["taxitem", "noneof", TAX_ITEM_UNDEF, TAX_ITEM_NS_EC],
                "AND",
                ["taxitem.rate", "notequalto", "0"]
            ];

            const vendorBillSearch = search.create({
                type: 'transaction',
                filters: vendorBillSearchFiltersequalto0,
                columns: [
                    search.createColumn({ name: 'amount', summary: search.Summary.SUM, label: 'amount' }),
                ],
            });

            const vendorBillSearchPagedData = vendorBillSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < vendorBillSearchPagedData.pageRanges.length; i++) {
                const vendorBillSearchPage = vendorBillSearchPagedData.fetch({ index: i });
                vendorBillSearchPage.data.forEach(result => {
                    vendorBillSearchPage.pagedData.searchDefinition.columns.forEach(column => {
                        var column_key = column.label || column.name;
                        mainLineJson[column_key] = result.getValue(column);
                    })
                    pushColumn.push(mainLineJson);
                });
            }
            return pushColumn;
        } catch (error) {
            log.error('Error-getBaseRateequalto0', error);
        }
    }

    const getMontoIVATotal = (internalid) => {
        let amoutTax = 0;
        var searchLoad = search.create({//customsearch1913
            type: "transaction",
            filters:
                [
                    ["type", "anyof", "VendBill", 'VendCred', 'CustInvc', 'CustCred'],
                    "AND",
                    ["internalid", "anyof", internalid],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["itemtype", "isnot", "Discount"],
                    "AND",
                    ["custcol_adjustment_tax_code", "noneof", TAX_ITEM_UNDEF]
                    // "AND",
                    // ["accounttype", "noneof", "OthCurrLiab"]
                ],
            columns:
                [
                    search.createColumn({ name: "taxamount", summary: "SUM", label: "Amount (Tax)" })
                ]
        });
        let searchResultCount = searchLoad.runPaged().count;
        if (searchResultCount > 0) {
            searchLoad.run().each((result) => {
                amoutTax = Math.abs(result.getValue(searchLoad.columns[0])) == .00 ? "0.00" : Math.abs(result.getValue(searchLoad.columns[0]))
                return true;
            });
        }
        return amoutTax;
    }

    const setFieldsLocalization = (objRecord, baseRateEqualto0, baseRateNoObjetoIVA, baseRateNotEqualto0, amountTax) => {
        let valores = new Object();
        let concepto332 = "332";
        valores.custbody_ec_monto_iva = amountTax
        valores.custbodyts_ec_base_rate0 = baseRateEqualto0[0].amount ? Math.abs(parseFloat(baseRateEqualto0[0].amount)) : 0;
        valores.custbodyts_ec_base_rate12 = baseRateNotEqualto0[0].amount ? Math.abs(parseFloat(baseRateNotEqualto0[0].amount)) : 0;
        valores.custbody_base_niva = baseRateNoObjetoIVA[0].amount ? Math.abs(parseFloat(baseRateNoObjetoIVA[0].amount)) : 0;
        log.debug('valores.custbody_ec_monto_iva', amountTax)
        log.debug('valores.custbodyts_ec_base_rate0', baseRateEqualto0[0].amount ? Math.abs(parseFloat(baseRateEqualto0[0].amount)) : 0)
        log.debug('valores.custbodyts_ec_base_rate12', baseRateNotEqualto0[0].amount ? Math.abs(parseFloat(baseRateNotEqualto0[0].amount)) : 0)
        log.debug('valores.custbody_base_niva', baseRateNoObjetoIVA[0].amount ? Math.abs(parseFloat(baseRateNoObjetoIVA[0].amount)) : 0)

        // let Withholding_Tax_Code_332IT = 0;
        // let items = objRecord.getLineCount("item");
        // for (let line = 0; line < items; line++) {
        //     let conceptoRetencion = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_ec_col_ec_concepto_retenci', line });
        //     if (conceptoRetencion) {
        //         let codigo_concepto = search.lookupFields({ type: 'customrecord_ts_ec_wht_reteir_concept', id: conceptoRetencion, columns: ['custrecord_ts_ec_codigo_anexo'] });
        //         if (codigo_concepto.custrecord_ts_ec_codigo_anexo.includes(concepto332)) {
        //             log.debug('codigo_concepto.custrecord_ts_ec_codigo_anexo', codigo_concepto.custrecord_ts_ec_codigo_anexo)
        //             Withholding_Tax_Code_332IT = codigo_concepto.custrecord_ts_ec_codigo_anexo ? getWithholdingTaxCode(codigo_concepto.custrecord_ts_ec_codigo_anexo) : Withholding_Tax_Code_332IT;
        //             break;
        //         }
        //     }
        // }

        // let Withholding_Tax_Code_332EX = 0;
        // let expenses = objRecord.getLineCount("expense");
        // for (let line = 0; line < expenses; line++) {
        //     let conceptoRetencion = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'custcol_ts_ec_col_ec_concepto_retenci', line });
        //     if (conceptoRetencion) {
        //         let codigo_concepto = search.lookupFields({ type: 'customrecord_ts_ec_wht_reteir_concept', id: conceptoRetencion, columns: ['custrecord_ts_ec_codigo_anexo'] });
        //         if (codigo_concepto.custrecord_ts_ec_codigo_anexo.includes(concepto332)) {
        //             log.debug('codigo_concepto.custrecord_ts_ec_codigo_anexo', codigo_concepto.custrecord_ts_ec_codigo_anexo)
        //             Withholding_Tax_Code_332EX = codigo_concepto.custrecord_ts_ec_codigo_anexo ? getWithholdingTaxCode(codigo_concepto.custrecord_ts_ec_codigo_anexo) : Withholding_Tax_Code_332EX;
        //             break;
        //         }
        //     }
        // }

        // log.debug('Withholding_Tax_Code_332IT || Withholding_Tax_Code_332EX', Withholding_Tax_Code_332IT + ' - ' + Withholding_Tax_Code_332EX)
        // if (Withholding_Tax_Code_332IT != 0 || Withholding_Tax_Code_332EX != 0)
        //     valores.custbody_ec_ret_ir = Withholding_Tax_Code_332IT ? Withholding_Tax_Code_332IT : Withholding_Tax_Code_332EX;

        record.submitFields({
            type: objRecord.type,
            id: objRecord.id,
            values: valores
        })
    }

    const getDescriptionTaxCode = () => {
        let json = new Array();
        let objSearch = search.create({
            type: "salestaxitem",
            filters: [],
            columns:
                [
                    "internalid",
                    search.createColumn({ name: "name", sort: search.Sort.DESC, label: "Name" }),
                    search.createColumn({ name: "description", label: "Description" })
                ]
        });
        //var searchResultCount = salestaxitemSearchObj.runPaged().count;
        objSearch.run().each((result) => {
            json.push({ id: result.getValue('internalid'), description: result.getValue('description') })
            return true;
        });
        return json;
    }

    const setTranid = (objRecord) => {
        log.debug('Type Record', objRecord.type)
        let serie_cxc = ''
        try {
            let ref_no = '';
            const docu_type = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
            const serie_cxp = objRecord.getValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp' });
            const pe_number = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
            try {
                serie_cxc = objRecord.getText({ fieldId: 'custbody_ts_ec_serie_cxc' });
            } catch (error) { }

            let sql = "select custrecordts_ec_iniciales_tip_comprob as prefix from customrecordts_ec_tipo_doc_fiscal where id = ?"
            let resultSet = query.runSuiteQL({ query: sql, params: [docu_type] }).asMappedResults();
            let prefix = resultSet.length > 0 ? resultSet[0].prefix : 0;

            if (docu_type == DOCUMENT_TYPE_LIQUIDACION_COMPRA) {
                ref_no = prefix + serie_cxc + pe_number;
            } else {
                ref_no = prefix + serie_cxp + pe_number;
            }
            objRecord.setValue({ fieldId: 'tranid', value: ref_no });
        } catch (error) {
            log.error('Error-setTranid', error);
        }
    }

    const setMontoLetras = (objRecord) => {
        try {
            let total = String(objRecord.getValue({ fieldId: 'usertotal' })) == 'undefined' ? String(objRecord.getValue({ fieldId: 'total' })) : String(objRecord.getValue({ fieldId: 'usertotal' }));
            log.debug('TypeOf', total + ' - ' + typeof total);
            let montoLetras = NumeroALetras(total, { plural: 'DOLARES', singular: 'DOLAR', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
            log.debug('setMontoLetras', montoLetras);
            objRecord.setValue({ fieldId: 'custbody_ts_ec_monto_letras', value: montoLetras });
        } catch (error) {
            log.error('Error-setMontoLetras', error);
        }
    }

    const getSerieLocalization = (docType, subsidiary, location) => {
        log.debug('docType, subsidiary, location', docType + '-' + subsidiary + '-' + location);
        let sql = "select id from customrecordts_ec_series_impresion where custrecord_ts_ec_tipo_documento = ? and custrecordts_ec_serie_subsidiaria = ? and custrecord_ts_ec_localidad_serie = ?"
        var resultSet = query.runSuiteQL({ query: sql, params: [docType, subsidiary, location] }).asMappedResults();
        var results = resultSet.length > 0 ? resultSet[0].id : 0;
        return results;
    }

    function getDateRef(_idDocumentRef) {
        try {
            if (_idDocumentRef) {
                var typeTransaction = search.lookupFields({
                    type: 'transaction',
                    id: _idDocumentRef,
                    columns: ['recordtype']
                });

                var dateDocumentRef = search.lookupFields({
                    type: typeTransaction['recordtype'],
                    id: _idDocumentRef,
                    columns: [
                        'trandate',
                        'custbodyts_ec_num_autorizacion'
                    ]
                });

                return {
                    trandate: dateDocumentRef['trandate'],
                    autorization: dateDocumentRef['custbodyts_ec_num_autorizacion']
                }
                //objRecord.setValue({ fieldId: 'custbody_pe_document_date_ref', value: dateDocumentRef['trandate'], ignoreFieldChange: true });
            }

        } catch (e) {
            log.error('Error en getDateRef', e);
        }
    }

    const buscarFacCompra = (idCustomer, preimpreso, docFiscal) => {
        var vendorbillSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["type", "anyof", "VendBill", "VendCred"],
                    "AND",
                    ["name", "anyof", idCustomer],
                    "AND",
                    ["custbody_ts_ec_numero_preimpreso", "is", preimpreso],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["custbodyts_ec_tipo_documento_fiscal", "anyof", docFiscal]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "ID interno" })
                ]
        });

        let objRecord = vendorbillSearchObj.run().getRange(0, 1000);
        let existe = false;
        if (objRecord.length > 0) {
            existe = true;
        }
        return existe
    }

    const imprimirComprobante = (form, objRecord) => {
        var tipo = '';
        if (objRecord.type == _constant.Transaction.VENDOR_PAYMENT) {
            tipo = 'pagoFactura';
        }
        if (objRecord.type == _constant.Transaction.CHECK) {
            tipo = 'cheque';
        }
        if (objRecord.type == _constant.Transaction.VENDOR_PRE_PAYMENT) {
            tipo = 'pagoAnticipo';
        }

        var id = objRecord.id;
        const printPago = `printPago('${id}','${tipo}')`;
        log.debug('printPago', `printPago('${id}','${tipo}')`);
        form.addButton({ id: 'custpage_btn_print_pago', label: 'Cheque', functionName: printPago });
    }

    const getWithholdingTaxCode = (codigo_concepto) => {
        let sql = "select id from customrecord_4601_witaxcode where custrecord_ts_ec_cod_retencion_iva = ?"
        let resultSet = query.runSuiteQL({ query: sql, params: [codigo_concepto] }).asMappedResults();
        let id = resultSet.length > 0 ? resultSet[0].id : 0;
        return id;
    }

    const pruebaFunction = () => {
        log.debug('TAX_ITEM_NS_EC', TAX_ITEM_NS_EC)
    }

    const getFechaMayor = (objFechas) => {
        // Array de fechas en formato "DD/MM/YYYY"
        const fechas = [
            "23/09/2024",
            "23/10/2024",
            "23/11/2024",
            "23/12/2024",
            "23/01/2025",
            "23/08/2025",
            "23/03/2025",
            "23/04/2025",
            "23/05/2025",
            "23/06/2025",
            "23/07/2025",
            "23/02/2025"
        ];

        // Función para convertir una fecha en formato "DD/MM/YYYY" a un objeto Date
        function convertirADate(fecha) {
            const [dia, mes, año] = fecha.split('/');
            return new Date(año, mes - 1, dia); // Restamos 1 al mes porque los meses en JavaScript van de 0 a 11
        }

        // Obtener la fecha mayor
        const fechaMayor = objFechas.reduce((mayor, fechaActual) => {
            const fechaActualDate = convertirADate(fechaActual);
            return fechaActualDate > mayor ? fechaActualDate : mayor;
        }, new Date(0)); // Inicializamos con una fecha muy antigua

        // Mostrar la fecha mayor en formato "DD/MM/YYYY"
        const dia = String(fechaMayor.getDate()).padStart(2, '0');
        const mes = String(fechaMayor.getMonth() + 1).padStart(2, '0'); // Sumamos 1 al mes
        const año = fechaMayor.getFullYear();
        return `${dia}/${mes}/${año}`
        //console.log(`${dia}/${mes}/${año}`); // Imprimirá la fecha mayor
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
            letrasMonedaPlural: currency.plural || 'DOLARES',//'PESOS', 'Dólares', 'Bolívares', 'etcs'
            letrasMonedaSingular: currency.singular || 'DOLAR', //'PESO', 'Dólar', 'Bolivar', 'etc'
            letrasMonedaCentavoPlural: currency.centPlural || 'CENTAVOS',
            letrasMonedaCentavoSingular: currency.centSingular || 'CENTAVO'
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






    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
/***************************************************************************************************************
TRACKING
/***************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 28/01/2022
Author: Dennis Fernández
Description: Creación del script.
/***************************************************************************************************************
/* Commit:02
Version: 1.0
Date: 18/06/2022s
Author: Dennis Fernández
Description: Se implementa automatización para generación automática de Factura de Compra.
/***************************************************************************************************************
/* Commit:03
Version: 1.0
Date: 10/01/2023
Author: Dennis Fernández
Description: Adecuación para no generar correlativo y tomar según carga csv, solo aplica para csv.
==============================================================================================================*/