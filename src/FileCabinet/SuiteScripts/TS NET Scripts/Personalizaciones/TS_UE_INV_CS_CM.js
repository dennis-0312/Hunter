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
define(['N/log', 'N/search', 'N/record', 'N/runtime', 'N/redirect', 'N/url', 'N/https'], (log, search, record, runtime, redirect, url, https) => {
    const INVOICE = 'invoice';
    const CASH_SALE = 'cashsale';
    const CREDIT_MEMO = 'creditmemo';
    const VENDOR_BILL = 'vendorbill';
    const FORM_FACTURA = 125;
    const FORM_CASH_SALE = 127;
    const FORM_CREDIT_MEMO = 104;
    const FORM_DEBIT_MEMO = 129;
    const DOCUMENT_TYPE_RUC = 4; //Registro Unico De Contribuyentes
    const DOCUMENT_TYPE_DNI = 2; //Documento Nacional De Identidad
    const DOCUMENT_TYPE_FACTURA = 103; //Factura
    const DOCUMENT_TYPE_BOLETA = 101; // Boleta
    const DOCUMENT_TYPE_CREDIT_MEMO = 106; // Nota de Crédito
    const DOCUMENT_TYPE_NO_DOMICILIADO = 9 // No domicialiado
    const DOCUMENT_TYPE_RECIBO_HONORARIOS = 108; // Recibo por honorarios
    const DOCUMENT_TYPE_DEBIT_MEMO = 107;
    const PE_FEL_Sending_Method = 4; //SB: 6 / PR: 4
    const PE_Cash_Sale_FEL_Template = 1;
    const PE_Invoice_FEL_Template = 2;
    const PE_Credit_Memo_FEL_Template = 3;
    const For_Generation_Status = 1;
    let doctype = 0;
    let prefix = '';
    const PE_CONFIG_IMPRESORA = 'customsearch_pe_config_impresora' //PE Config Impresora - PRODUCCION
    //const OPERATION_TYPE = 47; //Venta Nacional
    // const EI_OPERATION_TYPE = 101; //Venta Interna
    // const EI_FOMRA_PAGO = 1; // Contado  
    // const DOCUMENT_TYPE_NC = 106;
    // const DOCUMENT_TYPE_ND = 107;
    // const PAYMENT_METHOD = 1; //Efectivo
    
    const beforeLoad = (context) => {
        const eventType = context.type;
        // const objRecord = context.newRecord;
        // log.debug('HORA', objRecord.getValue({ fieldId: 'createddate' }))
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            const objRecord = context.newRecord;
            try {
                let jsonLines = Array();
                /* if (objRecord.type != CREDIT_MEMO) {
                    //custentity_ec_numero_registro documento del empleado
                    const userObj = runtime.getCurrentUser();
                    let userClassification = search.lookupFields({ type: search.Type.EMPLOYEE, id: userObj.id, columns: ['department', 'class', 'location'] });
                    objRecord.setValue({ fieldId: 'department', value: userClassification.department[0].value, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'class', value: userClassification.class[0].value, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'location', value: userClassification.location[0].value, ignoreFieldChange: true });
                    
                } */


                /* if (objRecord.type == INVOICE) {
                    log.debug('INICIO', 'INICIO INVOICE -------------------------------------------------');
                    log.debug('END', 'END INVOICE -------------------------------------------------');
                } else if (objRecord.type == CREDIT_MEMO) {
                    let document_type = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    let serie = objRecord.getText({ fieldId: 'custbody_ts_ec_serie_cxc' });
                    let number = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_doc_type_ref', value: document_type, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_doc_serie_ref', value: serie, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_doc_number_ref', value: number, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: '', ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: '', ignoreFieldChange: true });
                } */

                // else if (objRecord.type == CASH_SALE) {
                //     log.debug('INICIO', 'INICIO CASH SALE -------------------------------------------------');
                //     try {
                //         //! Falta campo
                //         //newRecord.setValue({ fieldId: 'paymentmethod', value: PAYMENT_METHOD, ignoreFieldChange: true });
                //     } catch (e) {
                //         log.error({ title: 'Error-beforeLoad-' + CASH_SALE, details: e });
                //     }
                //     log.debug('END', 'END CASH SALE -------------------------------------------------');
                // }
            } catch (error) {
                log.error('Error-beforeLoad-General', eventType + '--' + error);
            }
        }
    }


    const beforeSubmit = (context) => {
        const eventType = context.type;
        let documentref = '';
        if (eventType === context.UserEventType.CREATE) {
            const objRecord = context.newRecord;
            try {
                if (objRecord.type == VENDOR_BILL) {
                    let ref_no = '';
                    const docu_type = objRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    const serie_cxp = objRecord.getValue({ fieldId: 'custbody_ts_ec_serie_doc_cxp' });
                    const pe_number = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                    if (docu_type == DOCUMENT_TYPE_FACTURA) {   
                        ref_no = 'FA-' + serie_cxp + '-' + pe_number;
                    } else if (docu_type == DOCUMENT_TYPE_NO_DOMICILIADO) {
                        ref_no = 'CN-' + serie_cxp + '-' + pe_number;
                    } else if (docu_type == DOCUMENT_TYPE_RECIBO_HONORARIOS) {
                        ref_no = 'RH-' + serie_cxp + '-' + pe_number;
                    } else {
                        ref_no = 'BV-' + serie_cxp + '-' + pe_number;
                    }
                    log.debug('TranID', ref_no);
                    objRecord.setValue({ fieldId: 'tranid', value: ref_no });
                } else {
                    log.debug('INVOICE');
                    const customform = objRecord.getValue({ fieldId: 'customform' });
                    const customer = objRecord.getValue({ fieldId: 'entity' }); //TODO: Activar cuando tipo de documento venga de cliente
                    const location = objRecord.getValue({ fieldId: 'location' });
                    let total = String(objRecord.getValue({ fieldId: 'total' }));
                    if (objRecord.type == INVOICE) {
                        log.debug('INVOICE');
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Invoice_FEL_Template, ignoreFieldChange: true });
                    } else if (objRecord.type == CASH_SALE) {
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Cash_Sale_FEL_Template, ignoreFieldChange: true });
                        //===========================================================================
                    } else if (objRecord.type == CREDIT_MEMO) {
                        objRecord.setValue({ fieldId: 'custbody_psg_ei_template', value: PE_Credit_Memo_FEL_Template, ignoreFieldChange: true });
                    }
                    objRecord.setValue({ fieldId: 'custbody_psg_ei_status', value: For_Generation_Status, ignoreFieldChange: true });
                    objRecord.setValue({ fieldId: 'custbody_psg_ei_sending_method', value: PE_FEL_Sending_Method, ignoreFieldChange: true });
                    // objRecord.setValue({ fieldId: 'custbody_pe_flag_total', value: total }); PREGUNTAR
                    let montoLetras = NumeroALetras(total, { plural: 'DOLARES', singular: 'DOLAR', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                    objRecord.setValue({ fieldId: 'custbody_ts_ec_monto_letras', value: montoLetras });
                    log.debug('montoLetras',montoLetras);

                    //doctype = objRecord.getValue({ fieldId: 'custbody_pe_document_type' }); //*Activar cuando venga a demanda
                    if (objRecord.type == INVOICE || objRecord.type == CASH_SALE) {
                        //Bloque obtener Dirección de la tienda ===========================================================================
                        /* let addressLoc = getAddress(location);
                        objRecord.setValue({ fieldId: 'custbody_pe_flag_address_location', value: addressLoc }); PREGUNTAR*/ 
/*                         if (customform == FORM_DEBIT_MEMO) {
                            documentref = objRecord.getValue({ fieldId: 'custbodyts_ec_doc_type_ref' });
                            doctype = DOCUMENT_TYPE_DEBIT_MEMO;
                            prefix = 'ND-';
                        } else { */
                            let searchField = search.lookupFields({ type: search.Type.CUSTOMER, id: customer, columns: ['custentity_ec_document_type'] });
                            if (searchField.custentity_ec_document_type[0].value == DOCUMENT_TYPE_RUC) {//TODO: Activar cuando tipo de documento venga de cliente
                                // if (doctype == DOCUMENT_TYPE_FACTURA) { //*Activar cuando venga a demanda
                                doctype = DOCUMENT_TYPE_FACTURA;//TODO: Activar cuando tipo de documento venga de cliente
                                prefix = 'FA-';
                            } else {
                                doctype = DOCUMENT_TYPE_BOLETA;//TODO: Activar cuando tipo de documento venga de cliente
                                prefix = 'BV-';
                            }
                        /* } */

/*                         try {
                            let linecount = objRecord.getLineCount({ sublistId: 'item' });
                            let k = 0;
                            if (linecount != 0) {
                                for (let j = 0; j < linecount; j++) {
                                    k = j;
                                    let itemtype = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                                    if (itemtype == 'InvtPart' || itemtype == 'Service') {
                                        log.debug('Debug', 'entré: ' + itemtype);
                                        let itemtypeDSCTO = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: k + 1 });
                                        if (itemtypeDSCTO == 'Discount') {
                                            let grossDiscount = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: k + 1 });
                                            grossDiscount = Math.abs(grossDiscount);
                                            log.debug('Debug2', 'entré: ' + grossDiscount);
                                            objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_discount_line', line: j, value: grossDiscount });
                                            objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: k + 1, value: true });
                                            log.debug('Debug3', 'entré:');
                                        }
                                    }
                                }
                            }
                        } catch (error) { } */
                    } else if (objRecord.type == CREDIT_MEMO) {
                        documentref = objRecord.getValue({ fieldId: 'custbodyts_ec_doc_type_ref' });
                        doctype = DOCUMENT_TYPE_CREDIT_MEMO;
                        prefix = 'NC-';
                    }
                    //objRecord.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: doctype, ignoreFieldChange: true }); //TODO: Activar cuando tipo de documento venga de cliente
                    try {
                       /*  let cashCsv = objRecord.getValue({ fieldId: 'custbody_pe_cash_sale_csv' });
                        log.debug('LOG-value-CSV', cashCsv);
                        if (cashCsv.length > 0) {//!: Caso de prueba no generación de correlativo por csv
                            let peNumber = objRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                            let correlativeCashSale = prefix + cashCsv + '-' + peNumber;
                            log.debug('LOG-correlative-CSV', correlativeCashSale);
                            objRecord.setValue({ fieldId: 'tranid', value: correlativeCashSale });
                        } else {*/
                            let getserie = getSerie(doctype, location, prefix, documentref);
                            log.debug('LOG-getserie', getserie);
                            let correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr);
                            log.debug('LOG-correlative', correlative);
                            objRecord.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: correlative.correlative, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: getserie.serieid, ignoreFieldChange: true });
                            log.debug('LOG-correlative', correlative.numbering);
                            objRecord.setValue({ fieldId: 'tranid', value: correlative.numbering });
                            log.debug('LOG-correlative', objRecord.getValue('tranid'));
                        /* }*/
                    } catch (error) {
                        log.error('Error-beforeSubmit-Intro', error);
                    }  
                }
            } catch (error) {
                log.error('Error-beforeSubmit-' + objRecord.type, eventType + '--' + error);
            }
        } else if (eventType === context.UserEventType.EDIT) {
            const objRecord = context.newRecord;
            let total = String(objRecord.getValue({ fieldId: 'total' }));
            /* objRecord.setValue({ fieldId: 'custbody_pe_flag_total', value: total }); */

            if (objRecord.type == INVOICE || objRecord.type == CASH_SALE) {
                try {
                    let linecount = objRecord.getLineCount({ sublistId: 'item' });
                    let k = 0;
                    /* if (linecount != 0) {
                        for (let j = 0; j < linecount; j++) {
                            k = j;
                            let itemtype = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                            if (itemtype == 'InvtPart' || itemtype == 'Service') {
                                log.debug('Debug', 'entré: ' + itemtype);
                                let itemtypeDSCTO = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: k + 1 });
                                if (itemtypeDSCTO == 'Discount') {
                                    let grossDiscount = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: k + 1 });
                                    grossDiscount = Math.abs(grossDiscount);
                                    log.debug('Debug2', 'entré: ' + grossDiscount);
                                    objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_discount_line', line: j, value: grossDiscount });
                                    objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: k + 1, value: true });
                                    log.debug('Debug3', 'entré: ');
                                }
                            }
                        }
                    } */
                } catch (error) { }
            }
        }
    }


    const afterSubmit = (context) => {
        const eventType = context.type;

       /*  if (eventType === context.UserEventType.CREATE) {
            const urlpart1 = 'https://6785603.app.netsuite.com/app/accounting/print/hotprint.nl?regular=T&sethotprinter=T&formnumber=125&trantype=custinvc&&id='
            const urlpartt2 = '&label=Invoice&printtype=transaction'
            const objRecord = context.newRecord;
            try {
                let recordId = objRecord.id;
                let recordLoad = '';
                let tranid = '';
                let location = '';
                let printer = '';
                let predeterminada = '@NONE@'
                let searchlookupFields = '';
                if (objRecord.type == INVOICE) {
                    // record.submitFields({
                    //     type: record.Type.INVOICE,
                    //     id: recordId,
                    //     values: {
                    //         'custbody_pe_flag_print_pdf': urlpart1 + recordId + urlpartt2
                    //     }
                    // });
                    recordLoad = record.load({ type: record.Type.INVOICE, id: recordId, isDynamic: true });
                } else if (objRecord.type == CASH_SALE) {
                    recordLoad = record.load({ type: record.Type.CASH_SALE, id: recordId, isDynamic: true });
                    tranid = recordLoad.getValue({ fieldId: 'tranid' });
                    location = recordLoad.getValue({ fieldId: 'location' });
                    log.debug('LOG-location', location);
                    log.debug('LOG-printer', printer);
                    printer = getPrinter(location);
                    if (printer == 0) {
                        printer = getPrinter(predeterminada);
                    }
                    //searchlookupFields = search.lookupFields({ type: search.Type.CASH_SALE, id: recordId, columns: 'createddate' })
                }
                let datecreated = String(recordLoad.getValue({ fieldId: 'createddate' }));
                //let datecreated = searchlookupFields.datecreated;
                log.debug('LOG-datecreated', datecreated);
                datecreated = datecreated.split(' ');
                let time = datecreated[4];
                time = time.split(':');
                let hora = parseInt(time[0]) + 3;
                if (parseInt(hora) < 10) {
                    time = '0' + hora + ':' + time[1];
                } else {
                    time = hora + ':' + time[1];
                }
                log.debug('LOG-time', time);
                let otherId = record.submitFields({ type: record.Type.CASH_SALE, id: recordId, values: { 'custbody_pe_flag_hora_emision': time } });
                log.debug('LOG-Record-Saved-AS', otherId);
                if (objRecord.type == CASH_SALE || objRecord.type == CREDIT_MEMO) {
                    redirect.toSuitelet({
                        scriptId: 'customscript_ts_ui_automatic_print',
                        deploymentId: 'customdeploy_ts_ui_automatic_print',
                        parameters: {
                            'custparam_internalid': recordId,
                            'custparam_tranid': tranid,
                            'custparam_printer': printer,
                            'custparam_rectype': objRecord.type
                        }
                    });
                }
            } catch (error) {
                log.error('Error-afterSubmit', eventType + '--' + error);
            }
        }
 */
      /*   if (eventType === context.UserEventType.EDIT) {
            const objRecord = context.newRecord;
            if (objRecord.type == CASH_SALE || objRecord.type == CREDIT_MEMO) {
                try {
                    let recordId = objRecord.id;
                    let predeterminada = '@NONE@'
                    //let searchlookupFields = search.lookupFields({ type: search.Type.CASH_SALE, id: recordId, columns: ['tranid', 'location'] });
                    let searchlookupFields = search.lookupFields({ type: objRecord.type, id: recordId, columns: ['tranid', 'location'] });
                    location = searchlookupFields.location[0].value
                    printer = getPrinter(location);
                    if (printer == 0) {
                        printer = getPrinter(predeterminada);
                    }
                    log.debug('LOG-location', printer);
                    redirect.toSuitelet({
                        scriptId: 'customscript_ts_ui_automatic_print',
                        deploymentId: 'customdeploy_ts_ui_automatic_print',
                        parameters: {
                            'custparam_internalid': recordId,
                            'custparam_tranid': searchlookupFields.tranid,
                            'custparam_printer': printer,
                            'custparam_rectype': objRecord.type
                        }
                    });
                } catch (error) {
                    log.error('Error-Print', error);
                }
            }
        } */
    }


    const getSerie = (documenttype, location, prefix, documentref = 0) => {
        let searchLoad = '';
        try {
            log.debug('DebugSearch1', documenttype + ' - ' + location + ' - ' + prefix + ' - ' + documentref)
            if (documenttype == DOCUMENT_TYPE_CREDIT_MEMO || documenttype == DOCUMENT_TYPE_DEBIT_MEMO) {
                log.debug('Debug', 'Entre a search NC o ND');
                searchLoad = search.create({
                    type: 'customrecordts_ec_series_impresion',
                    filters: [
                     /*    ['custrecord_pe_tipo_documento_serie', 'anyof', documenttype],
                        'AND',
                        ['custrecord_pe_location', 'anyof', location],
                        'AND',
                        ['custrecord_pe_tipo_documento_aplicado', 'anyof', documentref] */
                    ],
                    columns: [
                        {
                            name: 'internalid',
                            sort: search.Sort.ASC
                        },
                        'custrecord_ts_ec_rango_inicial',
                        'custrecord_ts_ec_series_impresion'
                    ]
                });
            } else {
                searchLoad = search.create({
                    type: 'customrecordts_ec_series_impresion',
                    filters: [
/*                         ['custrecord_pe_tipo_documento_serie', 'anyof', documenttype],
                        'AND',
                        ['custrecord_pe_location', 'anyof', location] */
                    ],
                    columns: [
                        {
                            name: 'internalid',
                            sort: search.Sort.ASC
                        },
                        'custrecord_ts_ec_rango_inicial',
                        'custrecord_ts_ec_series_impresion'
                    ]
                });
            }

            const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
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
        } catch (e) {
            log.error({ title: 'getPeSerie', details: e });
        }
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