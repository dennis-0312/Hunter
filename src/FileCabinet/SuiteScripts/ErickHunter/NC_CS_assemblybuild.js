/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/record'], function(record) {



    const pageInit = (scriptContext) => {
      var currentRecord = scriptContext.currentRecord;
      
       currentRecord.setValue('quantity',1);
      
      
    }
	

    

    return {

       
       pageInit : pageInit,
    }
});

