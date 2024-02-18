/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define(['N/search', 'N/record', 'N/email', 'N/runtime'],
 function(search, record, email, runtime) {
     function execute(context) {
         if (context.type !== context.InvocationType.ON_DEMAND)
             return;
         var searchId = runtime.getCurrentScript().getParameter("custscript_searchid");
         try {
             search.load({
                 id: searchId
             }).run().each(function(result) {
                 log.debug({
                     details: 'transforming so :' + result.id + ' to item fulfillment'
                 });
                 var fulfillmentRecord = record.transform({
                     fromType: record.Type.SALES_ORDER,
                     fromId: result.id,
                     toType: record.Type.ITEM_FULFILLMENT,
                     isDynamic: false
                 });
                 var lineCount = fulfillmentRecord.getLineCount('item');
                 for (var i = 0; i < lineCount; i++) {
                     fulfillmentRecord.setSublistValue('item', 'location', i, 1);
                 }
                 var fulfillmentId = fulfillmentRecord.save();
                 var so = record.load({
                     type: record.Type.SALES_ORDER,
                     id: result.id
                 });
                 so.setValue('memo', fulfillmentId);
                 so.save();
                 return true;
             });
         } catch (e) {
             var subject = 'Fatal Error: Unable to transform salesorder to item fulfillment!';
             var authorId = -5;
             var recipientEmail = 'notify@example.com';
             email.send({
                 author: authorId,
                 recipients: recipientEmail,
                 subject: subject,
                 body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
             });
         }
     }
     return {
         execute: execute
     };
 });