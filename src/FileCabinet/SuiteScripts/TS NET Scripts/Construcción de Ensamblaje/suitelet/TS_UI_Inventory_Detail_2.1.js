/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/log',
    'N/query',
    'N/config',
], (serverWidget, search, log, query, config) => {

    const onRequest = (context) => {
        let method = context.request.method;
        try {

            if (method == 'GET') {
                let location = context.request.parameters.location;
                let item = context.request.parameters.item;
                let itemName = context.request.parameters.itemName || " ";
                let quantity = context.request.parameters.quantity || " ";
                let units = context.request.parameters.units || " ";
                let inventoryDetail = getInventoryDetail(item, location);
                let itemType = getType(item);

                let form = serverWidget.createForm({
                    title: "Detalle de Inventario",
                    hideNavBar: true
                });
                form.clientScriptModulePath = './TS_CS_Inventory_Detail_2.1.js';

                form.addButton({
                    id: 'custpage_b_cancel',
                    label: 'Cancelar',
                    functionName: 'closeWindow'
                });

                form.addFieldGroup({
                    id: 'custpage_fg_primary',
                    label: 'Información Primaria'
                });

                let itemField = form.addField({
                    id: 'custpage_f_item',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Articulo',
                    container: 'custpage_fg_primary'
                });
                itemField.defaultValue = itemName;
                itemField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                let descriptionField = form.addField({
                    id: 'custpage_f_description',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Descripción',
                    container: 'custpage_fg_primary'
                });
                descriptionField.defaultValue = " ";
                descriptionField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                let quantityField = form.addField({
                    id: 'custpage_f_quantity',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Cantidad',
                    container: 'custpage_fg_primary'
                });
                quantityField.defaultValue = quantity;
                quantityField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                let unitsField = form.addField({
                    id: 'custpage_f_units',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Unidades',
                    container: 'custpage_fg_primary'
                });
                unitsField.defaultValue = units;
                unitsField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                let itemTypeField = form.addField({
                    id: 'custpage_f_itemtype',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Tipo de Articulo',
                    container: 'custpage_fg_primary'
                });
                itemTypeField.defaultValue = itemType;
                itemTypeField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                if (itemType == 'inventoryitem') {
                    let inventoryDetailSubList = form.addSublist({
                        id: 'custpage_sl_inventorydetail',
                        type: serverWidget.SublistType.INLINEEDITOR,
                        label: 'Detalle de Inventario'
                    });

                    let depositSublistField = inventoryDetailSubList.addField({
                        id: 'custpage_slf_deposit',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Depósito',
                    });
                    setDepositSublistFieldValues(depositSublistField, inventoryDetail);
                    depositSublistField.isMandatory = true;

                    let stateSublistField = inventoryDetailSubList.addField({
                        id: 'custpage_slf_state',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Estado',
                        source: 'inventorystatus'
                    });
                    stateSublistField.isMandatory = true;
                    stateSublistField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    let quantitySublistField = inventoryDetailSubList.addField({
                        id: 'custpage_slf_quantity',
                        type: serverWidget.FieldType.INTEGER,
                        label: 'Cantidad'
                    });
                    quantitySublistField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    quantitySublistField.isMandatory = true;
                } else {
                    let inventoryDetailSubList = form.addSublist({
                        id: 'custpage_sl_inventorydetail',
                        type: serverWidget.SublistType.INLINEEDITOR,
                        label: 'Detalle de Inventario'
                    });
    
                    let serialSublistField = inventoryDetailSubList.addField({
                        id: 'custpage_slf_serial',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Número de Serie/Lote'
                    });
                    serialSublistField.isMandatory = true;
                    setSerialSublistFieldValues(serialSublistField, inventoryDetail);
    
                    let depositSublistField = inventoryDetailSubList.addField({
                        id: 'custpage_slf_deposit',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Depósito',
                        source: 'bin'
                    });
                    depositSublistField.isMandatory = true;
                    depositSublistField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
    
                    let stateSublistField = inventoryDetailSubList.addField({
                        id: 'custpage_slf_state',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Estado',
                        source: 'inventorystatus'
                    });
                    stateSublistField.isMandatory = true;
                    stateSublistField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
    
                    let quantitySublistField = inventoryDetailSubList.addField({
                        id: 'custpage_slf_quantity',
                        type: serverWidget.FieldType.INTEGER,
                        label: 'Cantidad'
                    });
                    quantitySublistField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    quantitySublistField.isMandatory = true;
                }

                

                form.addSubmitButton("Guardar");

                context.response.writePage(form);
            }

        } catch (error) {
            log.error("error", error);
        }
    }

    const setSerialSublistFieldValues = (serialSublistField, inventoryDetail) => {
        serialSublistField.addSelectOption({ value: -1, text: ' ' });
        for (inventoryNumberId in inventoryDetail) {
            let value = inventoryNumberId;
            let text = inventoryDetail[inventoryNumberId].inventoryNumber;
            serialSublistField.addSelectOption({ value, text });
        }
    }

    const setDepositSublistFieldValues = (depositSublistField, inventoryDetail) => {
        depositSublistField.addSelectOption({ value: -1, text: ' ' });
        for (inventoryNumberId in inventoryDetail) {
            let value = inventoryDetail[inventoryNumberId].binNumberId;
            let text = inventoryDetail[inventoryNumberId].binNumber;
            depositSublistField.addSelectOption({ value, text });
        }
    }

    const getInventoryDetail = (item, location) => {
        if (!(item && location)) return;
        let inventoryDetailResult = {};
        let inventoryBalanceSearch = search.create({
            type: "inventorybalance",
            filters: [
                ["location", "anyof", location],
                "AND",
                ["item", "anyof", item]
            ],
            columns: [
                search.createColumn({ name: "binnumber", label: "Bin Number" }),
                search.createColumn({ name: "inventorynumber", label: "Inventory Number" }),
                search.createColumn({ name: "status", label: "Status" })
            ]
        });

        inventoryBalanceSearch.run().each(function (result) {
            let inventoryNumberId = result.getValue('inventorynumber');
            let inventoryNumber = result.getText('inventorynumber');
            let binNumberId = result.getValue('binnumber');
            let binNumber = result.getText('binnumber');
            let status = result.getText('status');
            let statusId = result.getValue('status');

            inventoryDetailResult[inventoryNumberId] = {
                inventoryNumber,
                binNumber,
                binNumberId,
                status,
                statusId
            };
            return true;
        });

        log.error("cantidad", Object.keys(inventoryDetailResult).length);
        return inventoryDetailResult;
    }

    const getType = (itemId) => {
        let itemRecord = search.lookupFields({
            type: search.Type.ITEM, 
            id: itemId, 
            columns: ["recordtype"]
        });
        return itemRecord.recordtype;
    }

    return {
        onRequest
    }
})