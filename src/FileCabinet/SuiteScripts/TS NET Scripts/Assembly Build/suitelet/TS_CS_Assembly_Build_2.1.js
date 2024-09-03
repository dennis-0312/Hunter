/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search'], (url, currentRecord, dialog, search) => {

    const COMPONENT_INVENTORY_DETAIL_POPUP_ID = 'compinvdet_popup_';

    const pageInit = (scriptContext) => {
        console.log('START PAGEINIT');
    }

    const fieldChanged = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;

        if (sublistId == 'custpage_sl_components' && fieldId == 'custpage_slf_quantity') {
            let getInventoryDetail = JSON.parse(currentRecord.getValue('custpage_f_inventorydetail'));
            if (getInventoryDetail[line] === undefined) return true;
            let length = Object.keys(getInventoryDetail[line]).length;
            let quantity = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_quantity', line);
            if (length == quantity && quantity != 0) {
                updateSetTagIcon(line + 1);
            } else {
                updateNeededTagIcon(line + 1)
            }
        }
        return true;
    }

    const saveRecord = () => {
        let currentRecord = scriptContext.currentRecord;
        if (verificarParametroCandado(workOrderId)) {
            if (currentRecord.getValue({ fieldId: ' ' })) return true;
        }
    }

    const updateSetTagIcon = (line) => {
        let id = `${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`;
        var element = document.getElementById(`${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`);
        element.classList.remove("i_inventorydetailneeded");
        element.classList.add("i_inventorydetailset");
    }

    const updateNeededTagIcon = (line) => {
        let id = `${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`;
        var element = document.getElementById(`${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`);
        element.classList.remove("i_inventorydetailset");
        element.classList.add("i_inventorydetailneeded");
    }

    const verificarParametroCandado = (workOrderId) => {
        const COD_PRO_ITEM_COMERCIAL_DE_PRODUCCION = "PRO";
        const COD_SI = "S";
        let itemVenta = search.lookupFields({
            type: "customrecord_ht_record_ordentrabajo",
            id: workOrderId,
            columns: ["custrecord_ht_ot_item"]
        }).custrecord_ht_ot_item;
        let itemVentaId = itemVenta.length ? itemVenta[0].value : "";
        if (!itemVentaId) return true;
        let parametrizacionProducto = parametrizacionJson(itemVentaId);
        let esCandado = parametrizacionProducto[COD_PRO_ITEM_COMERCIAL_DE_PRODUCCION];
        return esCandado !== undefined && esCandado.valor == COD_SI;
    }

    const getSuiteletURL = () => {
        return url.resolveScript({
            scriptId: 'customscript_ts_ui_assembly_build_21',
            deploymentId: 'customdeploy_ts_ui_assembly_build_21',
            returnExternalUrl: false
        });
    }

    const addParametersToUrl = (suiteletURL, parameters) => {
        for (let param in parameters) {
            if (parameters[param]) {
                suiteletURL = `${suiteletURL}&${param}=${parameters[param]}`;
            }
        }
        return suiteletURL;
    }

    const getHeaderParameters = (currentRecord) => {
        let values = {
            item: currentRecord.getValue('custpage_f_item'),
            billofmaterials: currentRecord.getValue('custpage_f_billofmaterials'),
            location: currentRecord.getValue('custpage_f_location'),

        };
        return values;
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord
    };
});
