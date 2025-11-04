/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message', 'N/url'], (search, currentRecord, message, url) => {
    let typeMode = '';

    const pageInit = (context) => {
        typeMode = context.mode; //!Importante, no borrar.
    }

    const fieldChanged = (context) => {
        console.log('entra');
        const objRecord = currentRecord.get();
        console.log('objRecord', objRecord);
        console.log('typeMode', typeMode);
        var sublistFieldName = context.fieldId;
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            if (sublistFieldName == 'custrecord_ht_ds_serie') {
                var serie = objRecord.getText('custrecord_ht_ds_serie');
                objRecord.setText({
                    fieldId: 'name',
                    text: serie,
                    ignoreFieldChange: true
                });
            }

            // if (serie) {

            // }
        }
    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    }
});
