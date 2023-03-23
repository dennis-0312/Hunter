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
        console.log ('entra');
        const objRecord = currentRecord.get();
        console.log('objRecord',objRecord);
        console.log('typeMode',typeMode);

        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {

            var ruc = objRecord.getText('custrecord_ht_cd_ruccanaldistribucion');
            console.log('ruc',ruc);
            var nombre = objRecord.getText('custrecord_ht_cd_nombre');
            
            var array = [ruc, nombre];
            var txtfinal = '';
            for (let i = 0; i < array.length; i++) {
                if(array[i]){

                    txtfinal += array[i];
                    if((i < array.length-1) && array[i+1] ) txtfinal += ' ';
                } 
            }
            console.log('txtfinal',txtfinal)
            objRecord.setText({
                fieldId: 'name',
                text: txtfinal,
                ignoreFieldChange: true
            });
          
        }
    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    }
});
