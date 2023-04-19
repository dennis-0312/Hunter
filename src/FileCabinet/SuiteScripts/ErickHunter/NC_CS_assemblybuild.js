/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/record'], function(record) {




	function validateField(context) {
        var currentRecord = context.Record;
       
        var fieldId = context.fieldId;
        if(fieldId=="custbody_ht_modal_estado"){
            let invDetailRec = currentRecord.getValue({ fieldId: 'inventorydetail'});
            var numLines = currentRecord.getLineCount({sublistId: 'component'});
            console.log(invDetailRec);
           
        }
       
    }

    

    return {

       validateField: validateField,
      
    }
});
