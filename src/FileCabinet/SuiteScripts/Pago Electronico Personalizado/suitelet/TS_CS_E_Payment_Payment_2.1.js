/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search', 'N/format'], (url, currentRecord, dialog, search, format) => {

    var rowSelected = "";
    const fieldsToFilter = ["custpage_f_subsidiary", "custpage_f_datefrom", "custpage_f_dateto", "custpage_f_bankaccount"];

    const pageInit = (scriptContext) => {
        console.log('START PAGEINIT');
    }

    const fieldChanged = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;

        if (sublistId == "custpage_sl_paymentbatch" && fieldId == "custpage_slf_select") {
            console.log("rowSelected", rowSelected);
            let selected = currentRecord.getCurrentSublistValue({ sublistId, fieldId });
            if (line !== rowSelected) {
                if (rowSelected !== "") {
                    currentRecord.selectLine({ sublistId, line: rowSelected });
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId, value: false, ignoreFieldChange: true, forceSyncSourcing: true });
                }
                rowSelected = line;
            }
        }
        if (fieldsToFilter.indexOf(fieldId) > -1) {
            let parameters = getFiltersValue(currentRecord);
            let suiteletURL = getSuiteletURL();
            suiteletURL = addParametersToUrl(suiteletURL, parameters);
            setWindowChanged(window, false);
            window.location.href = suiteletURL;
        }
        return true;
    }

    const getSuiteletURL = () => {
        return url.resolveScript({
            scriptId: 'customscript_ts_ui_e_payment_2_1',
            deploymentId: 'customdeploy_ts_ui_e_payment_second',
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

    const getFiltersValue = (currentRecord) => {
        let values = {
            custpage_f_subsidiary: currentRecord.getValue('custpage_f_subsidiary'),
            custpage_f_datefrom: getDateFormat(currentRecord.getValue('custpage_f_datefrom')),
            custpage_f_dateto: getDateFormat(currentRecord.getValue('custpage_f_dateto')),
            custpage_f_bankaccount: currentRecord.getValue('custpage_f_bankaccount'),
        };
        console.log("getFiltersValue", values);
        return values;
    }

    const getDateFormat = (dateObject) => {
        try {
            return format.format({
                value: dateObject,
                type: format.Type.DATE
            });
        } catch (error) {
            console.log(error);
            return ''
        }
    }

    const saveRecord = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        if (verifySelectedSublist(currentRecord, 'custpage_sl_paymentbatch', 'custpage_slf_select')) {
            alert('Por favor seleccione un lote de pago');
            return false;
        }

        return true;
    }

    const verifySelectedSublist = (currentRecord, sublistId, fieldId) => {
        let lines = currentRecord.getLineCount(sublistId);
        if (lines <= 0) return true;
        for (let line = 0; line < lines; line++) {
            let check = currentRecord.getSublistValue({ sublistId, fieldId, line });
            if (check) return false;
        }
        return true;
    }

    const cleanFilters = () => {
        let suiteletURL = getSuiteletURL();
        setWindowChanged(window, false);
        window.location.href = suiteletURL;
    }

    const redirect = () => {
        let suiteletURL = getSuiteletURL();
        setWindowChanged(window, false);
        window.location.href = suiteletURL;
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        cleanFilters,
        redirect
    };
});