/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search'], (url, currentRecord, dialog, search) => {

    const pageInit = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        console.log('START PAGEINIT');
        hideFields(currentRecord);
    }

    const fieldChanged = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;

        if (fieldId == 'custpage_f_report') {
            showFields(currentRecord, fieldId);
        }

        return true;
    }

    const hideFields = (currentRecord) => {
        let fieldsId = [
            'custpage_f_format',
            'custpage_f_startdate',
            'custpage_f_enddate',
            'custpage_f_period',
            'custpage_f_subsidiary'
        ]
        fieldsId.forEach(fieldId => {
            let field = currentRecord.getField(fieldId);
            field.isDisplay = false;
        });
    }

    const showFields = (currentRecord) => {
        let fieldsId = []

        let reportId = currentRecord.getValue('custpage_f_report');

        if (reportId == "1") {
            // fieldsId = ['custpage_f_subsidiary', 'custpage_f_period'];
            fieldsId = ['custpage_f_subsidiary', 'custpage_f_period', 'custpage_f_format'];
        }
        fieldsId.forEach(fieldId => {
            let field = currentRecord.getField(fieldId);
            field.isDisplay = true;
        });
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
        fieldChanged
    };
});
