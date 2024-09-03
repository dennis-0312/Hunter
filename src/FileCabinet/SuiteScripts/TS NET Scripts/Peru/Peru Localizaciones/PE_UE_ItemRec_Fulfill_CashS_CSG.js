/********************************************************************************************************************************************************
This script for Item Receipt and Fulfillment (Validación de artículos consignados) 
/******************************************************************************************************************************************************** 
File Name: TS_UE_ItemRec_Fulfill_CashS_CSG.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 05/05/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', "N/https", 'N/search', 'N/record', 'N/runtime'], (log, https, search, record, runtime) => {
    const ITEM_RECEIPT = 'itemreceipt';
    const ITEM_FULFILLMENT = 'itemfulfillment';
    const CASH_SALE = 'cashsale';
    const INVENTORY_TRANSFER = 'inventorytransfer';
    const SALES_ORDER = 'salesorder';
    const TRANSFER_ORDER = 'transferorder';
    const PURCHASE_ORDER = 'purchaseorder'
    const VENDOR_RETURN_AUTHORIZATION = 'vendorreturnauthorization';
    const RETURN_AUTHORIZATION = 'returnauthorization';

    const beforeLoad = (context) => {
        const eventType = context.type;
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            const objRecord = context.newRecord;
            let fieldLookUp = '';
            let typeRecordFrom = '';
            let createdfrom = objRecord.getValue({ fieldId: 'createdfrom' });

            var DOCUMENT_TYPE = runtime.getCurrentScript().getParameter({
                name: 'custscript_pe_ue_consig_doc'
            });
            try {
                if (objRecord.type == ITEM_FULFILLMENT) {

                    objRecord.setValue({ fieldId: 'custbody_pe_document_type', value: DOCUMENT_TYPE, ignoreFieldChange: true, forceSyncSourcing: true });
                    if (createdfrom.length != 0) {
                        log.debug('traza 1');
                        fieldLookUp = search.lookupFields({ type: search.Type.SALES_ORDER, id: createdfrom, columns: ['location'] });
                        typeRecordFrom = SALES_ORDER;
                        if (Object.keys(fieldLookUp).length === 0) {
                            fieldLookUp = search.lookupFields({ type: search.Type.VENDOR_RETURN_AUTHORIZATION, id: createdfrom, columns: ['location'] });
                            typeRecordFrom = VENDOR_RETURN_AUTHORIZATION;
                            if (Object.keys(fieldLookUp).length === 0) {
                                fieldLookUp = search.lookupFields({ type: search.Type.TRANSFER_ORDER, id: createdfrom, columns: ['location'] });
                                typeRecordFrom = TRANSFER_ORDER;
                            }
                        }
                    }
                } else if (objRecord.type == ITEM_RECEIPT) {
                    log.debug('entro objRecord.type ITEM_RECEIPT', objRecord.type);
                    objRecord.setValue({ fieldId: 'custbody_pe_document_type', value: DOCUMENT_TYPE, ignoreFieldChange: true, forceSyncSourcing: true });
                    if (createdfrom.length != 0) {
                        log.debug('traza 1', "traza 1");
                        fieldLookUp = search.lookupFields({ type: search.Type.PURCHASE_ORDER, id: createdfrom, columns: ['location'] });
                        typeRecordFrom = PURCHASE_ORDER;
                        if (Object.keys(fieldLookUp).length === 0) {
                            log.debug('traza 2', "traza 2");
                            fieldLookUp = search.lookupFields({ type: search.Type.VENDOR_RETURN_AUTHORIZATION, id: createdfrom, columns: ['location'] });
                            typeRecordFrom = VENDOR_RETURN_AUTHORIZATION;
                            if (Object.keys(fieldLookUp).length === 0) {
                                log.debug('traza 3', "traza 3");
                                fieldLookUp = search.lookupFields({ type: search.Type.TRANSFER_ORDER, id: createdfrom, columns: ['transferlocation', 'custbody_pe_serie'] });
                                typeRecordFrom = TRANSFER_ORDER;
                                if (Object.keys(fieldLookUp).length === 0) {
                                    log.debug('traza 4', "traza 4");
                                    fieldLookUp = search.lookupFields({ type: search.Type.RETURN_AUTHORIZATION, id: createdfrom, columns: ['location'] });
                                    typeRecordFrom = RETURN_AUTHORIZATION;
                                }
                            }
                        }
                    }
                } else if (objRecord.type == TRANSFER_ORDER) {
                    objRecord.setValue({ fieldId: 'custbody_pe_document_type', value: DOCUMENT_TYPE, ignoreFieldChange: true, forceSyncSourcing: true });
                }

                if (Object.keys(fieldLookUp).length !== 0) {
                    log.debug('entro fieldLookUp', fieldLookUp);

                    let location = '';
                    if (typeRecordFrom == TRANSFER_ORDER && objRecord.type == ITEM_RECEIPT) {
                        location = fieldLookUp.transferlocation[0].value;
                        let document_type = objRecord.getValue({ fieldId: 'custbody_pe_document_type' });
                        let pe_number = objRecord.getValue({ fieldId: 'custbody_pe_number' });
                        objRecord.setValue({ fieldId: 'custbody_pe_document_type_ref', value: document_type, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_pe_document_series_ref', value: fieldLookUp.custbody_pe_serie[0].text, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_pe_document_number_ref', value: pe_number, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_pe_serie_cxp', value: 'Por generar', ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_pe_number', value: 'Por generar', ignoreFieldChange: true });
                    } else {
                        location = fieldLookUp.location[0].value;
                    };

                    log.debug('mira', location)

                    objRecord.setValue({
                        fieldId: 'custbody_pe_location_source',
                        value: location,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });


                    objRecord.setValue({
                        fieldId: 'custbody_pe_flag_created_from',
                        value: typeRecordFrom,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });


                }
            } catch (error) {
                log.error('Error-beforeLoad-' + objRecord.type, error)
            }
        }
    }

    const beforeSubmit = (context) => {
        const objRecord = context.newRecord;
        const eventType = context.type;
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            const objRecord = context.newRecord;
            try {
                if (objRecord.type == CASH_SALE) {
                    try {
                        let lines = JSON.parse(objRecord.getValue({ fieldId: 'custbody_pe_flag_lines_csg' }));
                        if (lines.length != 0) {
                            for (let i in lines) {
                                let itemtype = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                                if (itemtype == 'InvtPart') {
                                    let inventoryDetailRec = objRecord.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: lines[i].line });
                                    inventoryDetailRec.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', line: lines[i].subline, value: lines[i].binPropio });
                                }
                            }
                        }
                    } catch (error) { }
                    // try {
                    //     let linecount = objRecord.getLineCount({ sublistId: 'item' });
                    //     let k = 0;
                    //     if (linecount != 0) {
                    //         for (let j = 0; j < linecount; j++) {
                    //             k = j;
                    //             let itemtype = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                    //             if (itemtype == 'InvtPart') {
                    //                 let itemtypeDSCTO = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: k + 1 });
                    //                 if (itemtypeDSCTO == 'Discount') {
                    //                     let grossDiscount = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: k + 1 });
                    //                     grossDiscount = Math.abs(grossDiscount);
                    //                     objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_discount_line', line: j, value: grossDiscount });
                    //                     objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: k + 1, value: true });
                    //                 }
                    //             }
                    //         }
                    //     }
                    // } catch (error) { }
                } else if (objRecord.type == ITEM_FULFILLMENT) {
                    let flag_created_from = objRecord.getValue({ fieldId: 'custbody_pe_flag_created_from' });
                    let formulario = objRecord.getValue({ fieldId: 'customform' });
                    log.debug('formulario', formulario);
                    if (flag_created_from == SALES_ORDER) {
                        if (formulario != '125') {
                            try {
                                var get_lines_item = objRecord.getLineCount('item');
                                for (var i = 0; i < get_lines_item; i++) {
                                    var line_location = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                                    var line_item = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                                    var cost_promedio = BuscarCostoPromedio(line_item, line_location);
                                    if (Number(cost_promedio) != 0) {
                                        cost_promedio = parseFloat(cost_promedio);
                                        objRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_average_cost', line: i, value: cost_promedio });
                                    }
                                }
                            } catch (error) { }
                            try {
                                let lines = JSON.parse(objRecord.getValue({ fieldId: 'custbody_pe_flag_lines_csg' }));
                                if (lines.length != 0) {
                                    for (let i in lines) {
                                        let inventoryDetail = objRecord.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: lines[i].line });
                                        inventoryDetail.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', line: lines[i].subline, value: lines[i].binPropio });
                                    }
                                }
                            } catch (error) { }
                        }

                        try {
                            let location_source = objRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                            let document_type = objRecord.getValue({ fieldId: 'custbody_pe_document_type' });
                            let returnSerie = generateSerie(document_type, location_source);
                            objRecord.setValue({ fieldId: 'custbody_pe_serie', value: returnSerie.peserieId, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_number', value: returnSerie.correlative, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_flag_serie', value: returnSerie.serieImpresion, ignoreFieldChange: true });
                        } catch (error) {
                            log.error('error', error);
                        }
                    } else if (flag_created_from == VENDOR_RETURN_AUTHORIZATION) {
                        try {
                            let location_source = objRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                            let document_type = objRecord.getValue({ fieldId: 'custbody_pe_document_type' });
                            let returnSerie = generateSerie(document_type, location_source);
                            objRecord.setValue({ fieldId: 'custbody_pe_serie', value: returnSerie.peserieId, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_number', value: returnSerie.correlative, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_flag_serie', value: returnSerie.serieImpresion, ignoreFieldChange: true });
                        } catch (error) {
                            log.error('error', error);
                        }
                    }
                } else if (objRecord.type == TRANSFER_ORDER) {
                    try {
                        let location_source = objRecord.getValue({ fieldId: 'location' });
                        let document_type = objRecord.getValue({ fieldId: 'custbody_pe_document_type' });
                        let returnSerie = generateSerie(document_type, location_source);
                        objRecord.setValue({ fieldId: 'custbody_pe_serie', value: returnSerie.peserieId, ignoreFieldChange: true });
                        objRecord.setValue({ fieldId: 'custbody_pe_number', value: returnSerie.correlative, ignoreFieldChange: true });
                    } catch (error) { }
                } else if (objRecord.type == ITEM_RECEIPT) {
                    let flag_created_from = objRecord.getValue({ fieldId: 'custbody_pe_flag_created_from' });
                    if (flag_created_from == TRANSFER_ORDER) {
                        try {
                            let location_source = objRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                            let document_type = objRecord.getValue({ fieldId: 'custbody_pe_document_type' });
                            let returnSerie = generateSerie(document_type, location_source);
                            objRecord.setValue({ fieldId: 'custbody_pe_serie_cxp', value: returnSerie.serieImpresion, ignoreFieldChange: true });
                            objRecord.setValue({ fieldId: 'custbody_pe_number', value: returnSerie.correlative, ignoreFieldChange: true });
                        } catch (error) { }
                    }
                }
            } catch (error) {
                log.error('Error-beforeSubmit-' + objRecord.type, error);
            }
        }
        if (eventType === context.UserEventType.CREATE) {
            const currentRecord = context.newRecord;
            log.debug('MSK', 'objRecord.type = ' + objRecord.type)
            if (objRecord.type == ITEM_FULFILLMENT) {
                let formulario = objRecord.getValue({ fieldId: 'customform' });
                //if(formulario != '125'){
                log.debug('MSK', 'Corelativo - Inicio')
                // let currentRecord = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true });
                var tranid = currentRecord.getValue('tranid');
                var custbody_pe_serie = currentRecord.getValue('custbody_pe_serie');
                var custbody_pe_document_type = currentRecord.getValue('custbody_pe_document_type');
                log.debug('MSK', 'tranid = ' + tranid)

                log.debug('MSK', 'Buscamos un correlativo...')
                // //!2.1 Buscar el correativo
                var recordId = custbody_pe_serie;//Id correspondiente a serie de Retención
                log.debug('recordId', recordId);
                searchLoad = search.create({
                    type: 'customrecord_pe_serie', filters: [
                        ['internalid', 'is', recordId]
                    ],
                    columns: [
                        'custrecord_pe_serie_impresion',
                        'custrecord_pe_inicio'
                    ]
                });
                const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });

                var fiscalDoc = search.lookupFields({
                    type: 'customrecord_pe_fiscal_document_type',
                    //id: DOCUMENT_TYPE,
                    id: custbody_pe_document_type,
                    columns: ['custrecord_pe_prefix']
                });

                if (fiscalDoc.custrecord_pe_prefix != '' && fiscalDoc.custrecord_pe_prefix != null) {
                    var prefijo = fiscalDoc.custrecord_pe_prefix
                } else {
                    var prefijo = 'OTRO'
                }

                let serie = searchResult[0].getValue(searchLoad.columns[0]);
                let correlativo = (searchResult[0].getValue(searchLoad.columns[1]) + "").padStart(8, '0');
                let corrltv = parseInt(searchResult[0].getValue(searchLoad.columns[1]));
                var record1 = record.load({ type: 'customrecord_pe_serie', id: recordId });
                record1.setValue({ fieldId: 'custrecord_pe_inicio', value: (corrltv + 1) + "" });
                record1.save();
                log.debug('MSK', prefijo + '-' + serie + '-' + correlativo)
                // currentRecord.setValue({ fieldId: 'memo', value: prefijo+'-'+serie+'-'+correlativo, ignoreFieldChange: true });
                currentRecord.setValue({ fieldId: 'tranid', value: prefijo + '-' + serie + '-' + correlativo, ignoreFieldChange: true });
                currentRecord.setValue({ fieldId: 'custbody_pe_number', value: correlativo, ignoreFieldChange: true });
                var tranid2 = currentRecord.getValue('tranid');
                log.debug('MSK', 'tranid2 = ' + tranid2)
                log.debug('MSK', 'Corelativo - Fin')
                //} 

            } else if (objRecord.type == ITEM_RECEIPT) {
                //Funciona tal y como venia funcionando
            }
        }
    }

    const afterSubmit = (context) => {
        const eventType = context.type;
        const objRecord = context.newRecord;
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY || eventType === context.UserEventType.EDIT) {
            if (objRecord.type == ITEM_FULFILLMENT) {

                let formulario = objRecord.getValue({ fieldId: 'customform' });
                let estado = objRecord.getValue({ fieldId: 'shipstatus' });
                let CreadoDesde = objRecord.getValue({ fieldId: 'ordertype' });

                if (formulario == '125' && estado == 'C' && CreadoDesde == 'SalesOrd') {
                    var itemsEjecucion = [];
                    var cantItem = objRecord.getLineCount({ sublistId: 'item' });
                    log.debug('cantItem', cantItem)
                    for (let i = 0; i < cantItem; i++) {
                        var idItem = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        itemsEjecucion.push(idItem);
                    }

                    let ordenVentaID = objRecord.getValue({ fieldId: 'createdfrom' });
                    let recordSalesOrder = record.load({ type: SALES_ORDER, id: ordenVentaID, isDynamic: true });

                    var cantItemSalesOrder = recordSalesOrder.getLineCount({ sublistId: 'item' });
                    for (let i = 0; i < cantItemSalesOrder; i++) {
                        recordSalesOrder.selectLine({ sublistId: 'item', line: i });
                        let idItemArticulo = recordSalesOrder.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });

                        for (let j = 0; j < itemsEjecucion.length; j++) {
                            if (idItemArticulo == itemsEjecucion[j]) {
                                let quantityfulfilled = recordSalesOrder.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantityfulfilled' });
                                let quantity = recordSalesOrder.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });
                                let isclosed = recordSalesOrder.getCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed' });
                                if (isclosed == false) {
                                    if (quantityfulfilled == quantity) {
                                        recordSalesOrder.setCurrentSublistValue({ sublistId: 'item', fieldId: 'isclosed', value: true, ignoreFieldChange: true });
                                    }
                                }
                            }
                        }
                        recordSalesOrder.commitLine({ sublistId: 'item' });
                    }

                    recordSalesOrder.save({ enableSourcing: true, ignoreMandatoryFields: true });

                }
            }
        }
    }

    const generateSerie = (document_type, location) => {
        let ceros;
        try {
            const mySearch = search.create({
                type: 'customrecord_pe_serie',
                filters:
                    [
                        ['custrecord_pe_tipo_documento_serie', 'anyof', document_type],
                        'AND',
                        ['custrecord_pe_location', 'anyof', location],
                    ],
                columns:
                    [
                        'internalid',
                        'custrecord_pe_inicio',
                        'custrecord_pe_serie_impresion'
                    ]
            });

            const searchResult = mySearch.run().getRange({ start: 0, end: 1 });
            let column01 = searchResult[0].getValue(mySearch.columns[0]);
            let column02 = parseInt(searchResult[0].getValue(mySearch.columns[1]));
            let column03 = searchResult[0].getValue(mySearch.columns[2]);

            let next_number = column02 + 1;
            record.submitFields({
                type: 'customrecord_pe_serie',
                id: column01,
                values: {
                    'custrecord_pe_inicio': next_number
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            if (next_number.toString().length == 1) {
                ceros = '0000000';
            } else if (next_number.toString().length == 2) {
                ceros = '000000';
            }
            else if (next_number.toString().length == 3) {
                ceros = '00000';
            }
            else if (next_number.toString().length == 4) {
                ceros = '0000';
            }
            else if (next_number.toString().length == 5) {
                ceros = '000';
            }
            else if (next_number.toString().length == 6) {
                ceros = '00';
            }
            else if (next_number.toString().length == 7) {
                ceros = '0';
            } else if (next_number.toString().length >= 8) {
                ceros = '';
            }

            let correlative = ceros + next_number;

            return {
                'peserieId': column01,
                'correlative': correlative,
                'serieImpresion': column03
            }
        }
        catch (e) {
            log.error({ title: 'getCorrelative', details: e });
        }
    }


    const BuscarCostoPromedio = (item, location) => {
        var inventoryitemSearchObj = search.create({
            type: "inventoryitem",
            filters:
                [
                    ["type", "anyof", "InvtPart"],
                    "AND",
                    ["internalidnumber", "equalto", item],
                    "AND",
                    ["inventorylocation", "anyof", location]
                ],
            columns:
                [
                    search.createColumn({ name: "locationaveragecost", label: "Costo promedio de ubicación" }),
                ]
        });

        let searchResultCount = inventoryitemSearchObj.runPaged().count;
        if (searchResultCount != 0) {
            const searchResult = inventoryitemSearchObj.run().getRange({ start: 0, end: 1 });
            let costo_promedio = searchResult[0].getValue(inventoryitemSearchObj.columns[0]);
            return costo_promedio;
        } else {
            return 0;
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 31/03/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/