/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/record'], (record) => {
   const pageInit = (scriptContext) => {
      let currentRecord = scriptContext.currentRecord;
      currentRecord.setValue('quantity', 1);
   }

   return { pageInit: pageInit }
});

