/**
 *@NModuleScope Public
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search'], function (currentRecord, search) {
    const FACTURA = 103;

    const saveRecord = (context) => {
        const objRecord = currentRecord.get();
        const documentType = objRecord.getValue('custbody_pe_document_type');
        let tranid = ''
        let newTranid = '';
        try {
            if (objRecord.getValue('tranid').length == 0) {
                const serieCXP = objRecord.getValue('custbody_pe_serie_cxp');
                const number = objRecord.getValue('custbody_pe_number');
                documentType == FACTURA ? tranid = 'FA-' : tranid = 'BV-';
                newTranid = tranid + serieCXP + '-' + number;
                objRecord.setValue('tranid', newTranid);
                return true;
            }
        } catch (error) {
            console.log('Error-saveRecord: ' + error);
        }
    }


    const fieldChanged = (context) => {
        const objRecord = currentRecord.get();
        try {
            if (objRecord.getValue('custbody_pe_concept_detraction').length != 0) {
                if (objRecord.getValue('custbody_pe_concept_detraction') != 1) {
                    let witaxCode = getWitaxCode(objRecord.getValue('custbody_pe_percentage_detraccion'));
                    objRecord.setValue({ fieldId: 'custpage_4601_witaxcode', value: witaxCode, ignoreFieldChange: true });
                }
            }
        } catch (error) {
            console.log('Error-fieldChanged: ' + error);
        }
    }


    const getWitaxCode = (detraction) => {
        try {
            const searchLoad = search.create({
                type: "customrecord_4601_witaxcode",
                filters:
                    [
                        ["custrecord_4601_wtc_witaxtype", "anyof", "1"],
                        "AND",
                        ["custrecord_4601_wtc_rate", "equalto", detraction]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            const searchResult = searchLoad.run().getRange(0, 1);
            let column01 = searchResult[0].getValue(searchLoad.columns[0]);
            return column01;
        } catch (error) {
            log.error('Error-getWitaxCode', error)
        }
    }
    return {
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
    }
});