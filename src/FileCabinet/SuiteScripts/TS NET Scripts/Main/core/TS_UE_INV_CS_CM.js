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
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
    'N/error',
], (log, search, record, runtime, redirect, url, https, _controller, _constant, _errorMessage, err) => {
    const INVOICE = 'invoice';
    const CASH_SALE = 'cashsale';
    const CREDIT_MEMO = 'creditmemo';
    const VENDOR_BILL = 'vendorbill';
    const BILL_CREDIT = 'vendorcredit';
    const FORM_FACTURA = 125;
    const FORM_CASH_SALE = 127;
    const FORM_CREDIT_MEMO = 104;
    const FORM_DEBIT_MEMO = 129;
    const DOCUMENT_TYPE_RUC = 4; //Registro Unico De Contribuyentes
    const DOCUMENT_TYPE_DNI = 2; //Documento Nacional De Identidad
    const DOCUMENT_TYPE_FACTURA = 4; //Factura
    const DOCUMENT_TYPE_BOLETA = 9; // Boleta
    const DOCUMENT_TYPE_CREDIT_MEMO = 1; // Nota de Crédito
    const DOCUMENT_TYPE_NO_DOMICILIADO = 9 // No domicialiado
    const DOCUMENT_TYPE_RECIBO_HONORARIOS = 108; // Recibo por honorarios
    const DOCUMENT_TYPE_DEBIT_MEMO = 2;
    const PE_FEL_Sending_Method = 5; //SB: 5 / PR: ?
    const PE_FEL_Sending_Method_nc = 6; //SB: 6 / PR: ?
    const PE_Cash_Sale_FEL_Template = 1;
    const PE_Invoice_FEL_Template = 2;
    const PE_Credit_Memo_FEL_Template = 3;
    const For_Generation_Status = 1;
    let doctype = 0;
    let prefix = '';
    const PE_CONFIG_IMPRESORA = 'customsearch_pe_config_impresora' //PE Config Impresora - PRODUCCION

    const beforeLoad = (context) => {
        const eventType = context.type;
        //log.error("eventTypebeforeLoad", eventType);
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            const objRecord = context.newRecord;
            try {
                let jsonLines = Array();
                if (objRecord.type == BILL_CREDIT) {
                    let document_type_cr = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    let serie_cr = objRecord.getText({ fieldId: 'custbody_ts_ec_serie_doc_cxp' });
                    let number_cr = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                    let folio_cr = objRecord.getValue({ fieldId: 'custbody_ts_ec_folio_fiscal' });
                    let date_ref = getDateRef(objRecord.getValue('createdfrom'));

                    objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_folio_fiscal', value: '', ignoreFieldChange: true });
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
                        let date_ref = getDateRef(referenceInvoiceId);
                        let prefix = 'NC-'
                        let creditMemoSerie = getSerie(DOCUMENT_TYPE_CREDIT_MEMO, location, prefix);
                        /*FIN FECHA RELACIONADA A UNA NC */
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_type_ref', value: document_type, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_serie_ref', value: serie, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_number_ref', value: number, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_doc_fecha_ref', value: date_ref, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: DOCUMENT_TYPE_CREDIT_MEMO, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: creditMemoSerie.serieid || "", ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: '', ignoreFieldChange: true });
                    }
                }
            } catch (error) {
                log.error('Error-beforeLoad-General', eventType + '--' + error);
            }
        }
    }


    const beforeSubmit = (context) => {
        const eventType = context.type;
        log.error('eventType', eventType);
        //log.error("eventTypebeforeSubmit", eventType);
        let documentref = '';
        if (eventType === context.UserEventType.CREATE /*|| eventType === context.UserEventType.EDIT*/) {
            const objRecord = context.newRecord;
            try {
                if (objRecord.type == VENDOR_BILL || objRecord.type == BILL_CREDIT) {
                    let ref_no = '';
                    const docu_type = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    const serie_cxp = objRecord.getValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp' });
                    const pe_number = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                    let total = String(objRecord.getValue({ fieldId: 'usertotal' }));
                    //log.debug('total', total);
                    let montoLetras = NumeroALetras(total, { plural: 'DOLARES', singular: 'DOLAR', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_monto_letras', value: montoLetras });
                    // log.debug('DOCUMENT_TYPE_FACTURA', DOCUMENT_TYPE_FACTURA);
                    // log.debug('DOCUMENT_TYPE_NO_DOMICILIADO', DOCUMENT_TYPE_NO_DOMICILIADO);
                    // log.debug('DOCUMENT_TYPE_RECIBO_HONORARIOS', DOCUMENT_TYPE_RECIBO_HONORARIOS);
                    // log.debug('docu_type', docu_type);
                    if (docu_type == DOCUMENT_TYPE_FACTURA) {
                        ref_no = 'FA-' + serie_cxp + '-' + pe_number;
                    } else if (docu_type == DOCUMENT_TYPE_CREDIT_MEMO) {
                        ref_no = 'NC-' + serie_cxp + '-' + pe_number;
                    }
                    //log.debug('TranID', ref_no);
                    objRecord.setValue({ fieldId: 'tranid', value: ref_no });
                } else {
                    //log.debug('INVOICE');
                    const customform = objRecord.getValue({ fieldId: 'customform' });
                    const customer = objRecord.getValue({ fieldId: 'entity' }); //^: Activar cuando tipo de documento venga de cliente
                    const location = objRecord.getValue({ fieldId: 'location' });
                    let total = String(objRecord.getValue({ fieldId: 'total' }));
                    if (objRecord.type == INVOICE) { // NOTA: REVISAR
                        //log.debug('INVOICE');
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Invoice_FEL_Template, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_FEL_Sending_Method, ignoreFieldChange: true });
                    } else if (objRecord.type == CREDIT_MEMO) { }

                    let montoLetras = NumeroALetras(total, { plural: 'DOLARES', singular: 'DOLAR', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_monto_letras', value: montoLetras });
                    //log.debug('montoLetras', montoLetras);
                    //doctype = objRecord.getValue({ fieldId: 'custbody_pe_document_type' }); //*Activar cuando venga a demanda para Ibero
                    if (objRecord.type == INVOICE) {
                        doctype = DOCUMENT_TYPE_FACTURA;//^: Activar cuando tipo de documento venga de cliente
                        prefix = 'FA-';
                        try {
                            let getserie = getSerie(doctype, location, prefix, documentref);
                            //log.debug('LOG-getserie', getserie);
                            let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr);
                            //log.debug('LOG-correlative1', correlative);
                            objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                            //log.debug('LOG-correlative2', correlative.numbering);
                            objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                            //log.debug('LOG-correlative3', objRecord.getValue('tranid'));
                            /* }*/
                        } catch (error) {
                            log.error('Error-beforeSubmit-Intro', error);
                        }
                    } else if (objRecord.type == CREDIT_MEMO) { }
                }
            } catch (error) {
                log.error('Error-beforeSubmit-' + objRecord.type, eventType + '--' + error);
            }
        }
        
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            if (context.newRecord.type == VENDOR_BILL) {
                const objRecord = context.newRecord;

                var customer = objRecord.getValue({ fieldId: 'entity' });
                var pe_number = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                log.error('customer', customer);
                
                var existe = buscarFacCompra(customer, pe_number);

                if (existe) {
                    var myCustomError = err.create({
                        name: 'ERROR_NUMERO_DOCUMENTO',
                        message: 'Ya existe una Factura de Compra con el mismo PROVEEDOR y NUMERO PREIMPRESO',
                        notifyOff: false
                    });
                    log.error('Error: ' + myCustomError.name, myCustomError.message);
                    throw myCustomError;
                }
            }
        } else if(eventType === context.UserEventType.EDIT){
            if (context.newRecord.type == VENDOR_BILL){
                let objRecord = context.newRecord;
                let oldRecord = context.oldRecord;

                var customer_new = objRecord.getValue({ fieldId: 'entity' });
                var pe_number_new = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                log.error('customer_new', customer_new);
                log.error('pe_number_new', pe_number_new);
                var customer_old = oldRecord.getValue({ fieldId: 'entity' });
                var pe_number_old = oldRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                log.error('customer_old', customer_old);
                log.error('pe_number_old', pe_number_old);

                if(customer_new != customer_old || pe_number_new != pe_number_old){
                    var existe_new = buscarFacCompra(customer_new, pe_number_new);
                    if (existe_new) {
                        var myCustomError = err.create({
                            name: 'ERROR_NUMERO_DOCUMENTO',
                            message: 'Ya existe una Factura de Compra con el mismo PROVEEDOR y NUMERO PREIMPRESO',
                            notifyOff: false
                        });
                        log.error('Error: ' + myCustomError.name, myCustomError.message);
                        throw myCustomError;
                    }
                }
            }
        }
    }

    const afterSubmit = (context) => {
        const objRecord = context.newRecord;
        const eventType = context.type;
        const recordId = context.newRecord.id;
        //log.error("eventTypeafterSubmit", eventType);
        if (eventType === context.UserEventType.CREATE) {
            //log.error("context.newRecord.type", context.newRecord.type);
            if (context.newRecord.type == CREDIT_MEMO) {
                const doctype = DOCUMENT_TYPE_CREDIT_MEMO;
                const palabraBuscada = "Withholding Tax";
                const prefix = 'NC-';
                try {
                    const memo = context.newRecord.getValue({ fieldId: 'memo' });
                    if (memo.includes(palabraBuscada)) {
                        //log.debug('Nota de Crédito', 'Certificado de Retención');
                    } else {
                        //log.error("start", "flow");
                        let objRecord = record.load({ type: CREDIT_MEMO, id: recordId, isDynamic: true });
                        let location = objRecord.getValue({ fieldId: 'location' });
                        let total = String(objRecord.getValue({ fieldId: 'total' }));
                        let montoLetras = NumeroALetras(total, { plural: 'DOLARES', singular: 'DOLAR', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                        let documentref = objRecord.getValue({ fieldId: 'custbodyts_ec_doc_type_ref' });
                        let getserie = getSerie(doctype, location, prefix, documentref);
                        //log.debug('LOG-getserie', getserie);
                        let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr);
                        //log.debug('LOG-correlative1', correlative);
                        objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: doctype, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                        //log.debug('LOG-correlative2', correlative.numbering);
                        objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                        //log.debug('LOG-correlative3', objRecord.getValue('tranid'));
                        objRecord.setValue({ fieldId: 'custbody_ts_ec_monto_letras', value: montoLetras });
                        //log.debug('montoLetras', montoLetras);
                        try {
                            objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Credit_Memo_FEL_Template, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: For_Generation_Status, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_FEL_Sending_Method_nc, ignoreFieldChange: true });
                        } catch (error) {
                            log.error("error", error)
                        }
                        objRecord.save();
                    }
                } catch (error) {
                    log.error('Error-afterSubmit-Intro', error);
                }
            }
        }

        if (eventType === context.UserEventType.EDIT || eventType === context.UserEventType.CREATE) {
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
                                ["appliedtotransaction.custbody5", "is", "T"]
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
                    'custrecord_ts_ec_series_impresion'
                ]
            });
            const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            if (searchResult.length) {
                const column01 = searchResult[0].getValue(searchLoad.columns[0]);
                let column02 = searchResult[0].getValue(searchLoad.columns[1]);
                let column03 = searchResult[0].getValue(searchLoad.columns[2]);
                column03 = prefix + column03;
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


    const generateCorrelative = (return_pe_inicio, serieid, serieimpr) => {
        let ceros;
        let correlative;
        let numbering;
        let this_number = return_pe_inicio + 1;

        const next_number = this_number
        record.submitFields({ type: 'customrecordts_ec_series_impresion', id: serieid, values: { 'custrecord_ts_ec_rango_inicial': next_number } });

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
        let mySearch = search.load({ id: 'customsearch_pe_location_search' });
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

    const getPrinter = (location) => {
        let mySearch = search.load({ id: PE_CONFIG_IMPRESORA });
        let filters = mySearch.filters;
        const filterOne = search.createFilter({ name: 'custrecord_pe_config_imp_tienda', operator: search.Operator.ANYOF, values: location });
        filters.push(filterOne);
        const resultCount = mySearch.runPaged().count;
        if (resultCount > 0) {
            const searchResult = mySearch.run().getRange({ start: 0, end: 1 });
            let printer = searchResult[0].getValue({ name: "custrecord_pe_config_imp_impresora" });
            return printer
        } else {
            return 0;
        }
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
                    columns: ['trandate']
                });
                return dateDocumentRef['trandate'];
                //objRecord.setValue({ fieldId: 'custbody_pe_document_date_ref', value: dateDocumentRef['trandate'], ignoreFieldChange: true });
            }

        } catch (e) {
            log.error('Error en getDateRef', e);
        }
    }

    const buscarFacCompra = (idCustomer, preimpreso) => {
        var vendorbillSearchObj = search.create({
            type: "vendorbill",
            filters:
                [
                    ["type", "anyof", "VendBill"],
                    "AND",
                    ["name", "anyof", idCustomer],
                    "AND",
                    ["custbody_ts_ec_numero_preimpreso", "is", preimpreso],
                    "AND",
                    ["mainline", "is", "T"]
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

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit
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
Date: 18/06/2022
Author: Dennis Fernández
Description: Se implementa automatización para generación automática de Factura de Compra.
/***************************************************************************************************************
/* Commit:03
Version: 1.0
Date: 10/01/2023
Author: Dennis Fernández
Description: Adecuación para no generar correlativo y tomar según carga csv, solo aplica para csv.
==============================================================================================================*/