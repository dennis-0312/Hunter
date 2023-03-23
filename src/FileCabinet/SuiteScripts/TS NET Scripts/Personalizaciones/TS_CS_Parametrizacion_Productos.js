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
        console.log ('entrax2');
        const objRecord = currentRecord.get();
        console.log('objRecord',objRecord);
        console.log('typeMode',typeMode);

        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {

            var code = objRecord.getText('custrecord_ht_pp_code');
            var descripcion = objRecord.getText('custrecord_ht_pp_descrip');
            console.log('code descripcion',code+'-'+descripcion);
            var array = [code, descripcion];
            var txtfinal = '';
            for (let i = 0; i < array.length; i++) {
                if(array[i]){

                    txtfinal += array[i];
                    if((i < array.length-1) && array[i+1] ) txtfinal += ' - ';
                } 
            }
            if(code){
                objRecord.setText({
                    fieldId: 'name',
                    text: txtfinal,
                    ignoreFieldChange: true
                });
            }else{
                objRecord.setText({
                    fieldId: 'name',
                    text: '',
                    ignoreFieldChange: true
                });
            }
        }
    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    }
});
