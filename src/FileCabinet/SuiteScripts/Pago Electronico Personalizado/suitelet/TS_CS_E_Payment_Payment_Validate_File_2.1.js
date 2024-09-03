/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search', 'N/format'], (url, currentRecord, dialog, search, format) => {

    var rowSelected = "";

    const pageInit = (scriptContext) => {
        currentRecord = currentRecord.get();
    }

    const fieldChanged = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;

        return true;
    }

    const getSuiteletURL = () => {
        return url.resolveScript({
            scriptId: 'customscript_ts_ui_e_payment_2_1',
            deploymentId: 'customdeploy_ts_ui_e_payment_third'
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
            custpage_f_paymentbatch: currentRecord.getValue('custpage_f_paymentbatch')
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
        if (!currentRecord.getValue('custpage_f_file')) {
            dialog.alert({ title: 'Información', message: 'Por favor seleccione un archivo de retorno a procesar.' });
            return false;
        }

        if (verifySelectedSublist(currentRecord, 'custpage_sl_payments', 'custpage_slf_select')) {
            dialog.alert({ title: 'Información', message: 'No se encontró ningúna orden de pago en el archivo de retorno.' });
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

    const back = () => {
        let suiteletURL = getSuiteletURL();
        let parameters = getFiltersValue(currentRecord);
        suiteletURL = addParametersToUrl(suiteletURL, parameters);
        setWindowChanged(window, false);
        window.location.href = suiteletURL;
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        back
    };
});