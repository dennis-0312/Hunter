/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/format'], (url, currentRecord, dialog, format) => {

    const fieldsToFilter = ["custpage_f_subsidiary", "custpage_f_entity", "custpage_f_datefrom", "custpage_f_dateto",
        "custpage_f_location", "custpage_f_paymentmethod", "custpage_f_bankaccount", "custpage_f_emitidos"];

    let curRec = currentRecord.get();
    const pageInit = (scriptContext) => {
        console.log('START PAGEINIT');
    }

    const fieldChanged = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;

        //console.log("fieldChange", { sublistId, fieldId, line });

        if (fieldsToFilter.indexOf(fieldId) > -1) {
            let bankAccount = currentRecord.getValue('custpage_f_bankaccount');
            let subsidiary = currentRecord.getValue('custpage_f_subsidiary');
            let emitidos = currentRecord.getValue('custpage_f_emitidos');
            //console.log('emitidos', emitidos)
            if (!(bankAccount && subsidiary)) return true;
            //console.log('currentRecord', currentRecord)
            let parameters = getFiltersValue(currentRecord);
            //console.log('parameters', parameters)

            let suiteletURL = getSuiteletURL();
            suiteletURL = addParametersToUrl(suiteletURL, parameters);
            setWindowChanged(window, false);
            window.location.href = suiteletURL;
        }

        if (sublistId == 'custpage_sl_transactions' && fieldId == 'custpage_slf_select') {
            let check = currentRecord.getCurrentSublistValue(sublistId, fieldId);
            console.log('check ', check);
            if (check) {
                let totalAmount = currentRecord.getSublistValue({ sublistId, fieldId: "custpage_slf_amount", line: line });
                currentRecord.setCurrentSublistValue(sublistId, 'custpage_slf_amountpayable', totalAmount);
                let totalsummary = Number(currentRecord.getValue('custpage_f_totalsummary'));
                totalsummary = roundTwoDecimal(totalsummary + Number(totalAmount));
                currentRecord.setValue('custpage_f_totalsummary', totalsummary);
            } else {
                let totalAmount = currentRecord.getSublistValue({ sublistId, fieldId: "custpage_slf_amountpayable", line: line });
                console.log("totalAmount", totalAmount);
                currentRecord.setCurrentSublistValue(sublistId, 'custpage_slf_amountpayable', 0);
                let totalSummary = Number(currentRecord.getValue('custpage_f_totalsummary'));
                console.log("totalsummary", totalSummary);
                totalSummary = roundTwoDecimal(totalSummary - Number(totalAmount));
                console.log("totalsummary 2", totalSummary);
                currentRecord.setValue('custpage_f_totalsummary', totalSummary);
            }
        }
        return true;
    }

    const saveRecord = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        if (!currentRecord.getValue('custpage_f_teftemplate')) {
            dialog.alert({ title: 'Información', message: 'Se debe configurar el detalle bancario para la cuenta de banco seleccionada.' });
            return false;
        }
        if (!currentRecord.getValue('custpage_f_currency')) {
            dialog.alert({ title: 'Información', message: 'La cuenta de banco debe pertenecer a un tipo de moneda.' });
            return false;
        }
        if (verifySelectedSublist(currentRecord, 'custpage_sl_transactions', 'custpage_slf_select')) {
            dialog.alert({ title: 'Información', message: 'Por favor seleccione una orden de pago.' });
            return false;
        }

        let lines = currentRecord.getLineCount('custpage_sl_transactions');
        if (lines > 0) {
            let suma = 0
            for (let line = 0; line < lines; line++) {
                let check = currentRecord.getSublistValue('custpage_sl_transactions', 'custpage_slf_select', line);
                if (check) {
                    let totalAmount = Number(currentRecord.getSublistValue({ sublistId: 'custpage_sl_transactions', fieldId: "custpage_slf_amount", line: line }));
                    suma += totalAmount
                }
            }
            console.log('SUMA', currentRecord.getValue('custpage_f_totalsummary') + ' - ' + roundTwoDecimal(suma));
            if (currentRecord.getValue('custpage_f_totalsummary') != roundTwoDecimal(suma)) {
                dialog.alert({ title: 'Información', message: 'El importe total no coincide con el importe total de los registros seleccionados.' });
                return false
            }
        }
        return true;
    }

    const getSuiteletURL = () => {
        return url.resolveScript({
            scriptId: 'customscript_ts_ui_e_payment_2_1',
            deploymentId: 'customdeploy_ts_ui_e_payment_first',
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
        var emitido = 'F';
        if (currentRecord.getValue('custpage_f_emitidos') == true) {
            emitido = 'T'
        }
        let values = {
            custpage_f_subsidiary: currentRecord.getValue('custpage_f_subsidiary'),
            custpage_f_entity: currentRecord.getValue('custpage_f_entity'),
            custpage_f_datefrom: getDateFormat(currentRecord.getValue('custpage_f_datefrom')),
            custpage_f_dateto: getDateFormat(currentRecord.getValue('custpage_f_dateto')),
            custpage_f_location: currentRecord.getValue('custpage_f_location'),
            custpage_f_paymentmethod: currentRecord.getValue('custpage_f_paymentmethod'),
            //custpage_f_currency: currentRecord.getValue('custpage_f_currency'),
            custpage_f_bankaccount: currentRecord.getValue('custpage_f_bankaccount'),
            custpage_f_emitidos: emitido,
        };

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

    const roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
    }

    const sumImport = () => {
        // let check = currentRecord.getCurrentSublistValue('custpage_sl_transactions', 'custpage_slf_select');
        let lines = curRec.getLineCount('custpage_sl_transactions');
        let suma = 0
        if (lines <= 0) return dialog.alert({ title: 'Información', message: 'No se encontraron líneas.' });
        for (let line = 0; line < lines; line++) {
            let check = curRec.getSublistValue('custpage_sl_transactions', 'custpage_slf_select', line);
            if (check) {
                let totalAmount = Number(curRec.getSublistValue({ sublistId: 'custpage_sl_transactions', fieldId: "custpage_slf_amount", line: line }));
                suma += totalAmount
            }
        }
        curRec.setValue('custpage_f_totalsummary', roundTwoDecimal(suma));
    }

    const resImport = () => {
        curRec.setValue('custpage_f_totalsummary', 0);
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord,
        cleanFilters,
        sumImport,
        resImport
    };
});