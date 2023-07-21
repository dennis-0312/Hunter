/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/url', 'N/record', 'N/currentRecord', 'N/transaction', 'N/email', 'N/search'], function(url, record, currentRecord, transaction, email, search) {

   

    function lineInit(context) {
        const objRecord = context.currentRecord;
        let count = objRecord.getLineCount({ sublistId: 'item' });
        let expense = objRecord.getLineCount({ sublistId: 'expense' });
        objRecord.setValue({  fieldId: 'custbodyts_ec_base_rate0',value:0 });
        objRecord.setValue({  fieldId: 'custbodyts_ec_base_rate12',value:0 });
        objRecord.setValue({  fieldId: 'custbodyts_ec_base_rate14',value:0 });
        for (let j = 0; j < count; j++) {
         
            let taxrate = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1',line:j });
            let rate = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate' ,line:j});
            
            let valueImput = objRecord.getValue({  fieldId: 'custbodyts_ec_base_rate'+taxrate });
       
            objRecord.setValue({  fieldId: 'custbodyts_ec_base_rate'+taxrate,value:valueImput +rate });
        }
        for (let i = 0; i < expense; i++) {
            let taxrate = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'taxrate1',line:i });
            let rate = objRecord.getSublistValue({ sublistId: 'expense', fieldId: 'amount' ,line:i});
            
            let valueImput = objRecord.getValue({  fieldId: 'custbodyts_ec_base_rate'+taxrate });
       
            objRecord.setValue({  fieldId: 'custbodyts_ec_base_rate'+taxrate,value:valueImput +rate });
   
        }
        /*
       */return true;
    }

   


    return {

        lineInit: lineInit
    }
});
