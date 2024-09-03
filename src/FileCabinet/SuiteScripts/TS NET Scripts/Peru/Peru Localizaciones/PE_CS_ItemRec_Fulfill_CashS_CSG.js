/********************************************************************************************************************************************************
This script for Item Receipt and Fulfillment (Validación de artículos consignados) 
/******************************************************************************************************************************************************** 
File Name: TS_CS_ItemRec_Fulfill_CashS_CSG.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 05/05/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/currentRecord', 'N/record', 'N/search', 'N/ui/dialog'], (currentRecord, record, search, dialog) => {
    let typeMode = '';
    const ITEM_RECEIPT = 'itemreceipt';
    const ITEM_FULFILLMENT = 'itemfulfillment';
    const CASH_SALE = 'cashsale';
    const INVENTORY_TRANSFER = 'inventorytransfer';
    const SALES_ORDER = 'salesorder';
    const TRANSFER_ORDER = 'transferorder';
    const PURCHASE_ORDER = 'purchaseorder'
    const VENDOR_RETURN_AUTHORIZATION = 'vendorreturnauthorization';
    const RETURN_AUTHORIZATION = 'returnauthorization';

    const pageInit = (scriptContext) => {
        typeMode = scriptContext.mode; //!Importante, no borrar.
        // let recordType = scriptContext.currentRecord.type;
        // let fieldLookUp = '';
        // if (recordType == ITEM_FULFILLMENT) {
        //     let createdfrom = scriptContext.currentRecord.getValue({ fieldId: 'createdfrom' });
        //     if (createdfrom.length != 0) {
        //         fieldLookUp = search.lookupFields({ type: search.Type.SALES_ORDER, id: createdfrom, columns: ['location'] });
        //         typeRecordFrom = SALES_ORDER;
        //         if (Object.keys(fieldLookUp).length === 0) {
        //             fieldLookUp = search.lookupFields({ type: search.Type.VENDOR_RETURN_AUTHORIZATION, id: createdfrom, columns: ['location'] });
        //             typeRecordFrom = VENDOR_RETURN_AUTHORIZATION;
        //             if (Object.keys(fieldLookUp).length === 0) {
        //                 fieldLookUp = search.lookupFields({ type: search.Type.TRANSFER_ORDER, id: createdfrom, columns: ['location'] });
        //                 typeRecordFrom = TRANSFER_ORDER;
        //             }
        //         }

        //         if (Object.keys(fieldLookUp).length !== 0) {
        //             scriptContext.currentRecord.setValue({
        //                 fieldId: 'custbody_pe_location_source',
        //                 value: fieldLookUp.location[0].value,
        //                 ignoreFieldChange: true,
        //                 forceSyncSourcing: true
        //             });

        //             scriptContext.currentRecord.setValue({
        //                 fieldId: 'custbody_pe_flag_created_from',
        //                 value: typeRecordFrom,
        //                 ignoreFieldChange: true,
        //                 forceSyncSourcing: true
        //             });
        //         }
        //         scriptContext.currentRecord.setValue({ fieldId: 'custbody_pe_document_type', value: 105, ignoreFieldChange: true, forceSyncSourcing: true });
        //     }
        // } else if (recordType == ITEM_RECEIPT) {
        //     let createdfrom = scriptContext.currentRecord.getValue({ fieldId: 'createdfrom' });
        //     if (createdfrom.length != 0) {
        //         fieldLookUp = search.lookupFields({ type: search.Type.PURCHASE_ORDER, id: createdfrom, columns: ['location'] });
        //         typeRecordFrom = PURCHASE_ORDER;
        //         if (Object.keys(fieldLookUp).length === 0) {
        //             fieldLookUp = search.lookupFields({ type: search.Type.VENDOR_RETURN_AUTHORIZATION, id: createdfrom, columns: ['location'] });
        //             typeRecordFrom = VENDOR_RETURN_AUTHORIZATION;
        //             if (Object.keys(fieldLookUp).length === 0) {
        //                 fieldLookUp = search.lookupFields({ type: search.Type.TRANSFER_ORDER, id: createdfrom, columns: ['location'] });
        //                 typeRecordFrom = TRANSFER_ORDER;
        //                 if (Object.keys(fieldLookUp).length === 0) {
        //                     fieldLookUp = search.lookupFields({ type: search.Type.RETURN_AUTHORIZATION, id: createdfrom, columns: ['location'] });
        //                     typeRecordFrom = RETURN_AUTHORIZATION;
        //                 }
        //             }
        //         }

        //         if (Object.keys(fieldLookUp).length !== 0) {
        //             scriptContext.currentRecord.setValue({
        //                 fieldId: 'custbody_pe_location_source',
        //                 value: fieldLookUp.location[0].value,
        //                 ignoreFieldChange: true,
        //                 forceSyncSourcing: true
        //             });

        //             scriptContext.currentRecord.setValue({
        //                 fieldId: 'custbody_pe_flag_created_from',
        //                 value: typeRecordFrom,
        //                 ignoreFieldChange: true,
        //                 forceSyncSourcing: true
        //             });
        //         }

        //         scriptContext.currentRecord.setValue({
        //             fieldId: 'custbody_pe_document_type',
        //             value: 104,
        //             ignoreFieldChange: true,
        //             forceSyncSourcing: true
        //         });
        //     }
        // }
    }

    const saveRecord = (scriptContext) => {
        //console.log('In Saved: ' + scriptContext.currentRecord.type + ' - ' + typeMode);
        if (typeMode == 'create' || typeMode == 'copy') {
            let recordType = scriptContext.currentRecord.type;
            //console.log('Tipo Registro: ' + recordType);
            if (recordType == ITEM_RECEIPT) {
                let typeRecordFrom = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_flag_created_from' });
                if (typeRecordFrom.length == 0 || typeof typeRecordFrom == 'undefined') {
                    dialog.alert({ title: 'Información', message: 'No tiene una transacción padre asociada.' });
                    return false;
                }
                console.log(typeRecordFrom);
                try {
                    if (typeRecordFrom == PURCHASE_ORDER) {
                        let validate = true;
                        let location = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                        let binConsig = getBinConsig(location);
                        let esconsignacion = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_es_consignacion' });
                        let numLines = scriptContext.currentRecord.getLineCount({ sublistId: 'item' });
                        if (numLines != 0) {
                            for (let i = 0; i < numLines; i++) {
                                let invDetailRec = scriptContext.currentRecord.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                                let binNumber = invDetailRec.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', line: i });
                                if (esconsignacion == true) {
                                    if (binNumber != binConsig) {
                                        alert('Ingrese zona de consignación.');
                                        validate = false;
                                        break;
                                    }
                                } else {
                                    if (binNumber == binConsig) {
                                        alert('No puedes guardar en zona de consignación.');
                                        validate = false;
                                        break;
                                    }
                                }
                            }
                            return validate;
                        }
                    } else if (typeRecordFrom == TRANSFER_ORDER) {
                        let location = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                        if (location.length == 0) {
                            dialog.alert({ title: 'Información', message: 'Se debe ingresar una locación' });
                            return false;
                        }
                        let binConsig = getBinConsig(location);
                        let numLines = scriptContext.currentRecord.getLineCount({ sublistId: 'item' });
                        for (let i = 0; i < numLines; i++) {
                            let itemreceiveCheck = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i });
                            if (itemreceiveCheck == true) {
                                let item = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                                let fieldLookUp = search.lookupFields({ type: search.Type.INVENTORY_ITEM, id: item, columns: ['averagecost'] });
                                if (Object.keys(fieldLookUp).length === 0) {
                                    dialog.alert({ title: 'Información', message: 'El artículo no tiene un costo estimado asignado.' });
                                    return false;
                                }
                                let recordLine = scriptContext.currentRecord.selectLine({ sublistId: 'item', line: i });
                                let inventoryDetail = recordLine.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                let inventoryAssignmentLines = inventoryDetail.getLineCount({ sublistId: 'inventoryassignment' });
                                for (let j = 0; j < inventoryAssignmentLines; j++) {
                                    let inventoryAssignment = inventoryDetail.selectLine({ sublistId: 'inventoryassignment', line: j });
                                    let binNumber = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber' });
                                    let quantity = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity' });
                                    if (binNumber == binConsig) {
                                        recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_aplicar_consignacion', value: true, ignoreFieldChange: true });
                                        recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_average_cost', value: fieldLookUp.averagecost, ignoreFieldChange: true });
                                        recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_cantidad_consignada', value: quantity, ignoreFieldChange: true });
                                    }
                                }
                            }
                        }
                        return true;
                    } else if (typeRecordFrom == RETURN_AUTHORIZATION) {
                        return true;
                    }
                } catch (error) {
                    console.log('Error-ItemReceipt: ' + error);
                }
            } else if (recordType == ITEM_FULFILLMENT) {
                let typeRecordFrom = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_flag_created_from' });
                let esconsignacion = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_es_consignacion' });
                if (typeRecordFrom.length == 0 || typeof typeRecordFrom == 'undefined') {
                    dialog.alert({
                        title: 'Información',
                        message: 'No tiene una transacción padre asociada.'
                    });
                    return false;
                }
                try {
                    //console.log(typeRecordFrom);
                    if (typeRecordFrom == SALES_ORDER) {
                        let json = new Array();
                        let jsonLines = new Array();
                        let location = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                        if (location.length == 0) {
                            dialog.alert({ title: 'Información', message: 'Se debe ingresar un almacén' });
                            return false;
                        }
                        let binPropio = getBinPropio(location);
                        let binConsig = getBinConsig(location);
                        if (binPropio == 0) {
                            let options = { title: 'Información', message: 'El almacén no tiene una zona propia' }
                            dialog.alert(options);
                            return false;
                        }
                        let numLines = scriptContext.currentRecord.getLineCount({ sublistId: 'item' });
                        for (let i = 0; i < numLines; i++) {
                            let itemreceiveCheck = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i });
                            if (itemreceiveCheck == true) {
                                let itemType = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                                if (itemType == 'InvtPart') {
                                    let item = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                                    let fieldLookUp = search.lookupFields({ type: search.Type.INVENTORY_ITEM, id: item, columns: ['averagecost'] });
                                    if (Object.keys(fieldLookUp).length === 0) {
                                        dialog.alert({
                                            title: 'Información',
                                            message: 'El artículo no tiene un costo estimado asignado.'
                                        });
                                        return false;
                                    }
                                    let recordLine = scriptContext.currentRecord.selectLine({ sublistId: 'item', line: i });
                                    let inventoryDetail = recordLine.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                    let inventoryAssignmentLines = inventoryDetail.getLineCount({ sublistId: 'inventoryassignment' });
                                    for (let j = 0; j < inventoryAssignmentLines; j++) {
                                        let inventoryAssignment = inventoryDetail.selectLine({ sublistId: 'inventoryassignment', line: j });
                                        let binNumber = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber' });
                                        let quantity = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity' });
                                        if (binNumber == binConsig) {
                                            recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_aplicar_consignacion', value: true, ignoreFieldChange: true });
                                            recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_average_cost', value: fieldLookUp.averagecost, ignoreFieldChange: true });
                                            recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_cantidad_consignada', value: quantity, ignoreFieldChange: true });
                                            json.push({
                                                'line': i,
                                                'location': location,
                                                'item': item,
                                                'quantity': quantity,
                                                'binConsig': binConsig,
                                                'binPropio': binPropio
                                            });
                                            jsonLines.push({
                                                'line': i,
                                                'subline': j,
                                                'item': item,
                                                'binPropio': binPropio,
                                                'quantity': quantity
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        // return false;
                        console.log(json);
                        if (json.length != 0) {
                            let responseBinTransfer = binTransfer(json);
                            if (isNaN(parseInt(responseBinTransfer)) == false && parseInt(responseBinTransfer) != 0) {
                                //jsonLines.push({ 'binTransfer': responseBinTransfer });
                                scriptContext.currentRecord.setValue({
                                    fieldId: 'custbody_pe_flag_lines_csg',
                                    value: JSON.stringify(jsonLines),
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                return true;
                                //return false;
                            } else {
                                return false;
                            }
                        } else {
                            return true;
                        }
                    } else if (typeRecordFrom == VENDOR_RETURN_AUTHORIZATION) {
                        let validate = true;
                        let location = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                        let binConsig = getBinConsig(location);
                        let numLines = scriptContext.currentRecord.getLineCount({ sublistId: 'item' });
                        for (let i = 0; i < numLines; i++) {
                            let itemreceiveCheck = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i });
                            if (itemreceiveCheck == true) {
                                let recordLine = scriptContext.currentRecord.selectLine({ sublistId: 'item', line: i });
                                let inventoryDetailRec = recordLine.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                let binNumber = inventoryDetailRec.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', line: 0 });
                                if (esconsignacion == true) {
                                    if (binNumber != binConsig) {
                                        dialog.alert({ title: 'Información', message: 'Ingrese zona de consignación.' });
                                        validate = false;
                                        break;
                                    }
                                } else {
                                    if (binNumber == binConsig) {
                                        dialog.alert({ title: 'Información', message: 'No puedes guardar en zona de consignación.' });
                                        validate = false;
                                        break;
                                    }
                                }
                            }
                        }
                        return validate;
                    } else if (typeRecordFrom == TRANSFER_ORDER) {
                        let location = scriptContext.currentRecord.getValue({ fieldId: 'custbody_pe_location_source' });
                        if (location.length == 0) {
                            dialog.alert({ title: 'Información', message: 'Se debe ingresar una locación' });
                            return false;
                        }
                        let binConsig = getBinConsig(location);
                        let numLines = scriptContext.currentRecord.getLineCount({ sublistId: 'item' });
                        for (let i = 0; i < numLines; i++) {
                            let itemreceiveCheck = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemreceive', line: i });
                            if (itemreceiveCheck == true) {
                                let item = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                                let fieldLookUp = search.lookupFields({ type: search.Type.INVENTORY_ITEM, id: item, columns: ['averagecost'] });
                                if (Object.keys(fieldLookUp).length === 0) {
                                    dialog.alert({ title: 'Información', message: 'El artículo no tiene un costo estimado asignado.' });
                                    return false;
                                }
                                let recordLine = scriptContext.currentRecord.selectLine({ sublistId: 'item', line: i });
                                let inventoryDetail = recordLine.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                let inventoryAssignmentLines = inventoryDetail.getLineCount({ sublistId: 'inventoryassignment' });
                                for (let j = 0; j < inventoryAssignmentLines; j++) {
                                    let inventoryAssignment = inventoryDetail.selectLine({ sublistId: 'inventoryassignment', line: j });
                                    let binNumber = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber' });
                                    let quantity = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity' });
                                    if (binNumber == binConsig) {
                                        recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_aplicar_consignacion', value: true, ignoreFieldChange: true });
                                        recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_average_cost', value: fieldLookUp.averagecost, ignoreFieldChange: true });
                                        recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_cantidad_consignada', value: quantity, ignoreFieldChange: true });
                                    }
                                }
                            }
                        }
                        return true;
                    }
                } catch (error) {
                    console.error('Error: ' + error);
                    return false;
                }
            } else if (recordType == CASH_SALE) {
                try {
                    //console.log('=====================================================');
                    let json = new Array();
                    let jsonLines = new Array();
                    let icbper = 0;
                    let location = scriptContext.currentRecord.getValue({ fieldId: 'location' });
                    let binPropio = getBinPropio(location);
                    let binConsig = getBinConsig(location);
                    if (binPropio == 0) {
                        let options = { title: 'Información', message: 'La locación no tiene una zona propia' }
                        dialog.alert(options);
                        return false;
                    }
                    let numLines = scriptContext.currentRecord.getLineCount({ sublistId: 'item' });
                    for (let i = 0; i < numLines; i++) {
                        let itemtype = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                        if (itemtype == 'InvtPart') {
                            let item = scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                            let recordLine = scriptContext.currentRecord.selectLine({ sublistId: 'item', line: i });
                            let inventoryDetail = recordLine.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                            let inventoryAssignmentLines = inventoryDetail.getLineCount({ sublistId: 'inventoryassignment' });
                            for (let j = 0; j < inventoryAssignmentLines; j++) {
                                let inventoryAssignment = inventoryDetail.selectLine({ sublistId: 'inventoryassignment', line: j });
                                let binNumber = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber' });
                                let quantity = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity' });
                                if (binNumber == binConsig) {
                                    recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_aplicar_consignacion', value: true, ignoreFieldChange: true });
                                    recordLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_cantidad_consignada', value: quantity, ignoreFieldChange: true });
                                    json.push({
                                        'line': i,
                                        'location': location,
                                        'item': item,
                                        'quantity': quantity,
                                        'binConsig': binConsig,
                                        'binPropio': binPropio
                                    });
                                    jsonLines.push({
                                        'line': i,
                                        'subline': j,
                                        'item': item,
                                        'binPropio': binPropio,
                                        'quantity': quantity
                                    });
                                }
                            }
                        } else if (itemtype == 'NonInvtPart') {
                            let recordLine = scriptContext.currentRecord.selectLine({ sublistId: 'item', line: i });
                            let quantity = parseFloat(scriptContext.currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }));
                            icbper = 0.4 * quantity;
                            icbper = icbper.toFixed(2);
                        }
                        scriptContext.currentRecord.setValue({ fieldId: 'custbody_pe_flag_discount_icbper', value: icbper, ignoreFieldChange: true });
                    }
                    console.log(json);
                    if (json.length != 0) {
                        let responseBinTransfer = binTransfer(json);
                        if (isNaN(parseInt(responseBinTransfer)) == false && parseInt(responseBinTransfer) != 0) {
                            //jsonLines.push({ 'binTransfer': responseBinTransfer });
                            scriptContext.currentRecord.setValue({
                                fieldId: 'custbody_pe_flag_lines_csg',
                                value: JSON.stringify(jsonLines),
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                } catch (error) {
                    console.error('Error: ' + error);
                    return false;
                }
            }
            // let options = { title: 'Información', message: 'Estoy entrando al final' }
            // dialog.alert(options);
            return false;
        } else if (typeMode == 'edit') {
            let recordType = scriptContext.currentRecord.type;
            if (recordType == CASH_SALE) {
                return true;
            }

            if (recordType == ITEM_FULFILLMENT) {
                return true;
            }

            if (recordType == ITEM_RECEIPT) {
                return true;
            }
        }
    }

    const binTransfer = (json) => {
        let recId = 0;
        try {
            let rec = record.create({ type: record.Type.BIN_TRANSFER, isDynamic: true });

            rec.setValue({ fieldId: 'location', value: json[0].location });
            rec.setValue({ fieldId: 'memo', value: 'Consignación por CS' });
            //===================================================================================================================
            for (let i in json) {
                rec.selectNewLine({ sublistId: 'inventory' });
                rec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: json[i].item });
                rec.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'quantity', value: json[i].quantity });
                //=====================================================================================================
                let subrec = rec.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                subrec.selectNewLine({ sublistId: 'inventoryassignment' });
                subrec.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: json[i].binConsig });
                subrec.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'tobinnumber', value: json[i].binPropio });
                subrec.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: json[i].quantity });
                subrec.commitLine({ sublistId: 'inventoryassignment' });
                rec.commitLine({ sublistId: 'inventory' });
                //===================================================================================================================
            }
            recId = rec.save();
            //console.log('BinTransfer: ' + recId);
            return recId;
        } catch (error) {
            console.error('Error-binTransfer: ' + error);
            return false;
        }
    }

    const getBinPropio = (location) => {
        const searchObj = search.create({
            type: "bin",
            filters:
                [
                    ["binnumber", "startswith", "I-Propio"],
                    "AND",
                    ["location", "anyof", location]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
        });
        let searchResultCount = searchObj.runPaged().count;
        if (searchResultCount != 0) {
            const searchResult = searchObj.run().getRange({ start: 0, end: 1 });
            let binPropio = searchResult[0].getValue(searchObj.columns[0]);
            return binPropio;
        } else {
            return 0;
        }
    }

    const getBinConsig = (location) => {
        const searchObj = search.create({
            type: "bin",
            filters:
                [
                    ["binnumber", "startswith", "I-Consig"],
                    "AND",
                    ["location", "anyof", location]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
        });
        let searchResultCount = searchObj.runPaged().count;
        if (searchResultCount != 0) {
            const searchResult = searchObj.run().getRange({ start: 0, end: 1 });
            let binPropio = searchResult[0].getValue(searchObj.columns[0]);
            return binPropio;
        } else {
            return 0;
        }
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});