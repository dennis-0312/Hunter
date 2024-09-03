/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search'], (url, currentRecord, dialog, search) => {

    var inventoryDetailList, parentInventoryDetail;

    const pageInit = (scriptContext) => {
        console.log('START PAGEINIT');
        let currentRecord = scriptContext.currentRecord;
        try {
            let location = getParamFromUrl("location");
            let item = getParamFromUrl("item");
            let row = getParamFromUrl("row");
            inventoryDetailList = getInventoryBalance(item, location);
            console.log(inventoryDetailList);
            parentInventoryDetail = getParentInventoryDetail();
            console.log(parentInventoryDetail);
            loadParentInventoryDetail(inventoryDetailList, parentInventoryDetail, row, currentRecord);
        } catch (error) {
            console.log(error);
        }
    }

    const getParentInventoryDetail = () => {
        let parentInventoryDetail = window.opener.nlapiGetFieldValue('custpage_f_inventorydetail');
        parentInventoryDetail = parentInventoryDetail == "" ? {} : JSON.parse(parentInventoryDetail);
        return parentInventoryDetail;
    }

    const loadParentInventoryDetail = (inventoryDetailList, parentInventoryDetail, row, currentRecord) => {
        if (parentInventoryDetail[row] === undefined) return;
        let itemType = currentRecord.getValue('custpage_f_itemtype');
        for (let serialOrDeposit in parentInventoryDetail[row]) {
            if (inventoryDetailList[serialOrDeposit] !== undefined) {
                if (!inventoryDetailList[serialOrDeposit].isSerialized) {
                    currentRecord.setCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_deposit', serialOrDeposit);
                    currentRecord.commitLine('custpage_sl_inventorydetail');
                    currentRecord.selectNewLine('custpage_sl_inventorydetail');
                } else {
                    currentRecord.setCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_serial', serialOrDeposit);
                    currentRecord.commitLine('custpage_sl_inventorydetail');
                    currentRecord.selectNewLine('custpage_sl_inventorydetail');
                }
            }
        }
    }

    const fieldChanged = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;
        try {
            console.log({ sublistId, fieldId, line })
            if (sublistId == "custpage_sl_inventorydetail" && fieldId == "custpage_slf_serial") {
                let serial = currentRecord.getCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_serial');
                if (inventoryDetailList[serial] === undefined) return true;
                if (inventoryDetailList[serial].binNumberId) {
                    currentRecord.setCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_deposit', inventoryDetailList[serial].binNumberId)
                }
                if (inventoryDetailList[serial].statusId) {
                    currentRecord.setCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_state', inventoryDetailList[serial].statusId)
                }
                currentRecord.setCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_quantity', inventoryDetailList[serial].quantity);
            }

            if (sublistId == "custpage_sl_inventorydetail" && fieldId == "custpage_slf_deposit") {
                let serial = currentRecord.getCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_serial');
                if (serial === undefined) {
                    let quantity = getParamFromUrl("quantity");
                    let deposit = currentRecord.getCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_deposit');
                    currentRecord.setCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_state', inventoryDetailList[deposit].statusId);
                    currentRecord.setCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_quantity', quantity);
                }
            }
            return true;
        } catch (error) {
            console.log(error);
        }
    }

    const saveRecord = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;

        let totalQuantity = currentRecord.getValue('custpage_f_quantity');
        console.log(totalQuantity);
        if (verifyTotalQuantity(totalQuantity, currentRecord) && totalQuantity != 0) {
            alert(`La cantidad de detalle de inventario total debe ser ${totalQuantity}`);
            return false;
        }
        let buildedParentInventoryDetail = buildParentInventoryDetail(currentRecord);
        window.opener.nlapiSetFieldValue('custpage_f_inventorydetail', JSON.stringify(buildedParentInventoryDetail));
        updateParentTagIcon();
        window.close();
        return true;
    }

    const updateParentTagIcon = () => {
        let elementId = getParamFromUrl("elementId");
        var element = window.opener.document.getElementById(elementId);
        element.classList.remove("i_inventorydetailneeded");
        element.classList.add("i_inventorydetailset");
    }

    const verifyTotalQuantity = (totalQuantity, currentRecord) => {
        let lines = currentRecord.getLineCount('custpage_sl_inventorydetail');
        if (totalQuantity == lines) {
            return false;
        } else {
            return true;
        }
    }

    const buildParentInventoryDetail = (currentRecord) => {
        let row = getParamFromUrl("row");
        if (parentInventoryDetail[row] === undefined) parentInventoryDetail[row] = {};
        let lines = currentRecord.getLineCount('custpage_sl_inventorydetail');
        if (lines == 0) parentInventoryDetail[row] = {};
        let itemType = currentRecord.getValue('custpage_f_itemtype');

        if (itemType == "inventoryitem") {
            for (let line = 0; line < lines; line++) {
                let deposit = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_deposit', line);
                let state = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_state', line);
                let quantity = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_quantity', line);

                parentInventoryDetail[row][deposit] = { deposit, state, quantity };
            }
        } else {
            for (let line = 0; line < lines; line++) {
                let serial = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_serial', line);
                let deposit = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_deposit', line);
                let state = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_state', line);
                let quantity = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_quantity', line);

                parentInventoryDetail[row][serial] = { serial, deposit, state, quantity };
            }
        }

        return parentInventoryDetail;
    }

    const getInventoryBalance = (item, location, bin) => {
        if (!(item && location)) return;
        let inventoryBalanceResult = {};
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
                search.createColumn({ name: "status", label: "Status" }),
                search.createColumn({ name: "isserialitem", join: "item", label: "Is Serialized Item" }),
                search.createColumn({ name: "onhand", label: "On Hand" }),
                search.createColumn({ name: "available", label: "Available" })
            ]
        });

        inventoryBalanceSearch.run().each(function (result) {
            let inventoryNumberId = result.getValue('inventorynumber');
            let inventoryNumber = result.getText('inventorynumber');
            let binNumberId = result.getValue('binnumber');
            let binNumber = result.getText('binnumber');
            let status = result.getText('status');
            let statusId = result.getValue('status');
            let isSerialized = result.getValue(result.columns[3]);
            let quantity = result.getValue("onhand");

            if (!isSerialized) {
                inventoryBalanceResult[binNumberId] = {
                    isSerialized,
                    binNumber,
                    binNumberId,
                    status,
                    statusId,
                    quantity
                };
            } else {
                inventoryBalanceResult[inventoryNumberId] = {
                    isSerialized,
                    inventoryNumber,
                    binNumber,
                    binNumberId,
                    status,
                    statusId,
                    quantity
                };
            }
            return true;
        });

        console.log("cantidad", Object.keys(inventoryBalanceResult).length);
        return inventoryBalanceResult;
    }

    const getInventoryDetail = (item, location) => {
        if (!(item && location)) return;
        let inventoryDetailResult = {};
        let inventoryDetailSearch = search.create({
            type: "inventorydetail",
            filters: [
                ["location", "anyof", location],
                "AND",
                ["item", "anyof", item]
            ],
            columns: [
                search.createColumn({ name: "isserialitem", join: "item", summary: "GROUP", label: "Is Serialized Item" }),
                search.createColumn({ name: "inventorynumber", summary: "GROUP", label: " Number" }),
                search.createColumn({ name: "binnumber", summary: "GROUP", label: "Bin Number" }),
                search.createColumn({ name: "status", summary: "GROUP", label: "Status" }),
                search.createColumn({ name: "itemcount", summary: "SUM", label: "Quantity" })
            ]
        });

        inventoryDetailSearch.run().each(function (result) {
            let columns = result.columns;
            let isSerialized = result.getValue(columns[0]);
            let inventoryNumberId = result.getValue(columns[1]);
            let inventoryNumber = result.getText(columns[1]);
            let binNumberId = result.getValue(columns[2]);
            let binNumber = result.getText(columns[2]);
            let status = result.getText(columns[3]);
            let statusId = result.getValue(columns[3]);
            let quantity = result.getValue(columns[4]);

            if (!isSerialized) {
                inventoryDetailResult[binNumberId] = {
                    isSerialized,
                    binNumber,
                    binNumberId,
                    status,
                    statusId,
                    quantity
                };
            } else {
                inventoryDetailResult[inventoryNumberId] = {
                    isSerialized,
                    inventoryNumber,
                    binNumber,
                    binNumberId,
                    status,
                    statusId,
                    quantity
                };
            }

            return true;
        });

        return inventoryDetailResult;
    }

    const getParamFromUrl = (name) => {
        let params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    const validateLine = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;

        if (sublistId == 'custpage_sl_inventorydetail') {
            let itemType = currentRecord.getValue('custpage_f_itemtype');

            if (itemType == "inventoryitem") {
                let lines = currentRecord.getLineCount('custpage_sl_inventorydetail');
                let deposit = currentRecord.getCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_deposit');
                let depositName = currentRecord.getCurrentSublistText('custpage_sl_inventorydetail', 'custpage_slf_deposit');

                for (let line = 0; line < lines; line++) {
                    let currentDeposit = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_deposit', line);
                    if (deposit == currentDeposit) {
                        alert(`El depósito ${depositName} ya ha sido seleccionada, favor de seleccionar otro.`);
                        return false;
                    }
                }

            } else {
                let lines = currentRecord.getLineCount('custpage_sl_inventorydetail');
                let serial = currentRecord.getCurrentSublistValue('custpage_sl_inventorydetail', 'custpage_slf_serial');
                let serialName = currentRecord.getCurrentSublistText('custpage_sl_inventorydetail', 'custpage_slf_serial');

                for (let line = 0; line < lines; line++) {
                    let currentSerial = currentRecord.getSublistValue('custpage_sl_inventorydetail', 'custpage_slf_serial', line);
                    if (serial == currentSerial) {
                        alert(`El número de serie ${serialName} ya ha sido seleccionada, favor de seleccionar otro número de serie.`);
                        return false;
                    }
                }

                if (validateFieldConfiguration(serialName)) {
                    return false
                }
            }

            return true;
        }
    }

    const validateFieldConfiguration = (serial) => {
        let itemType = getParamFromUrl("type");
        if (itemType == "4" || itemType == "5") return false;
        let { columns, customRecord, typeName, estadoColumna, filterBy } = getDataForSerchByType(itemType);
        console.log("validateFieldConfiguration", { columns, customRecord, typeName, estadoColumna });
        let resultSearch = createSearchByType(customRecord, columns, serial, filterBy);
        if (!resultSearch.length) {
            alert(`El número de serie seleccionado no es válido`);
            return true;
        }
        for (let i = 0; i < resultSearch[0].columns.length; i++) {
            if (resultSearch[0].getValue(resultSearch[0].columns[i]) == '') {
                alert(`Revisar la configuración de los campos del ${typeName} ${serial}`);
                return true;
            }
        }
        if (typeName == "1") {
            if (resultSearch[0].getValue(resultSearch[0].columns[estadoColumna]) == "1") {
                alert(`Estado de Dispositivo ${typeName} ${serial} no dispobible.`);
                return true;
            }
        } else if (typeName == "2") {
            if (resultSearch[0].getValue(resultSearch[0].columns[estadoColumna]) != "1") {
                alert(`Estado de Dispositivo ${typeName} ${serial} no dispobible.`);
                return true;
            }
        } else if (typeName == "3") {
            if (resultSearch[0].getValue(resultSearch[0].columns[estadoColumna]) != "1") {
                alert(`Estado de Dispositivo ${typeName} ${serial} no dispobible.`);
                return true;
            }
        }
        return false;
    }

    const createSearchByType = (customRecord, columns, serial, filterBy) => {
        console.log("createSearchByType", { customRecord, columns, serial });
        var resultSearch = search.create({
            type: customRecord,
            filters: [
                [`${filterBy}.inventorynumber`, "is", serial]
            ],
            columns: columns
        }).run().getRange(0, 1000);
        return resultSearch;
    }

    const getDataForSerchByType = (itemType) => {
        let columns = [], customRecord = "", typeName = "", estadoColumna, filterBy = "";
        switch (itemType) {
            case '1':
                estadoColumna = 10;
                typeName = " Dispositivo Chaser";
                customRecord = "customrecord_ht_record_detallechaserdisp";
                filterBy = "custrecord_ht_dd_item";
                columns = [
                    search.createColumn({ name: "internalid", label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_dd_dispositivo", label: "dd_dispositivo" }),
                    search.createColumn({ name: "custrecord_ht_dd_item", label: "dd_item" }),
                    search.createColumn({ name: "custrecord_ht_dd_tipodispositivo", label: "dd_tipodispositivo" }),
                    search.createColumn({ name: "custrecord_ht_dd_modelodispositivo", label: "dd_modelodispositivo" }),
                    search.createColumn({ name: "custrecord_ht_dd_macaddress", label: "dd_macaddress" }),
                    search.createColumn({ name: "custrecord_ht_dd_imei", label: "dd_imei" }),
                    search.createColumn({ name: "custrecord_ht_dd_firmware", label: "dd_firmware" }),
                    search.createColumn({ name: "custrecord_ht_dd_script", label: "dd_script" }),
                    search.createColumn({ name: "custrecord_ht_dd_servidor", label: "dd_servidor" }),
                    search.createColumn({ name: "custrecord_ht_dd_estado", label: "dd_estado" }),
                    search.createColumn({ name: "custrecord_ht_dd_tipodispocha", label: "dd_tipodispocha" })
                ];
                break;
            case '2':
                estadoColumna = 8;
                typeName = " Sim Card";
                customRecord = "customrecord_ht_record_detallechasersim";
                filterBy = "custrecord_ht_ds_serie";
                columns = [
                    search.createColumn({ name: "internalid", label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_ds_simcard", label: "ds_simcard" }),
                    search.createColumn({ name: "custrecord_ht_ds_serie", label: "ds_serie" }),
                    search.createColumn({ name: "custrecord_ht_ds_tiposimcard", label: "ds_tiposimcard" }),
                    search.createColumn({ name: "custrecord_ht_ds_operadora", label: "ds_operadora" }),
                    search.createColumn({ name: "custrecord_ht_ds_ip", label: "ds_ip" }),
                    search.createColumn({ name: "custrecord_ht_ds_apn", label: "ds_apn" }),
                    search.createColumn({ name: "custrecord_ht_ds_numerocelsim", label: "ds_numerocelsim" }),
                    search.createColumn({ name: "custrecord_ht_ds_estado", label: "ds_estado" })
                ];
                break;
            case '3':
                typeName = " LOJACK";
                customRecord = "customrecord_ht_record_detallechaslojack";
                estadoColumna = 4;
                filterBy = "custrecord_ht_cl_seriebox";
                columns = [
                    search.createColumn({ name: "internalid", label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_cl_seriebox", label: "cl_seriebox" }),
                    search.createColumn({ name: "custrecord_ht_cl_activacion", label: "cl_activacion" }),
                    search.createColumn({ name: "custrecord_ht_cl_respuesta", label: "cl_respuesta" }),
                    search.createColumn({ name: "custrecord_ht_cl_estado", label: "cl_estado" }),
                ];
                break;
            default:
                break;
        }
        return { columns, customRecord, typeName, estadoColumna, filterBy };
    }

    const closeWindow = () => {
        window.close();
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        validateLine,
        closeWindow
    }
})