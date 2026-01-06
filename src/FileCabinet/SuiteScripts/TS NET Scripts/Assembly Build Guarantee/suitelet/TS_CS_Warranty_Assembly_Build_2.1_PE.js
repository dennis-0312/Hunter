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

        if (scriptContext.fieldId == 'custpage_f_location') {
            let location = currentRecord.getValue('custpage_f_location');
            let item = currentRecord.getValue('custpage_f_item');
            let workorder = currentRecord.getValue('custpage_f_workorder');
            let salesorder = currentRecord.getValue('custpage_f_salesorder');
            let customer = currentRecord.getValue('custpage_f_customer');

            let parametros = {
                location,
                item,
                workorder,
                salesorder,
                customer
            }

            console.log(parametros);
            let url = getSuiteletURL(parametros);
            //evitamos mostrar el mensaje de confirmacion
            window.onbeforeunload = null;
            window.open(url, '_self');
        }

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

    const getSuiteletURL = (parametros) => {
        return url.resolveScript({
            scriptId: 'customscript_ts_ui_warrant_assem_buil_pe',
            deploymentId: 'customdeploy_ts_ui_warrant_assem_buil_pe',
            //returnExternalUrl: false
            params: parametros
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
        fieldChanged
    };
});
