/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/record', 'N/runtime', 'N/task'], (file, search, record, runtime, task) => {

    let currentScript = runtime.getCurrentScript();
    const execute = (context) => {
        try {
            let amount = 88.50;
            let recordid = 436275;
            let journalid = 436904;

            let objRecord = record.transform({
                fromType: record.Type.INVOICE,
                fromId: recordid,
                toType: record.Type.CUSTOMER_PAYMENT,
                isDynamic: false
            });

            //objRecord.setValue({ fieldId: 'payment', value: amount });
            objRecord.setValue({ fieldId: 'autoapply', value: false });
            //objRecord.setValue({ fieldId: 'paymentmethod', value: paymentMethod })
            // let linecount = objRecord.getLineCount({ sublistId: 'apply' });
            // log.debug('linecount', linecount);
            // for (let j = 0; j < linecount; j++) {
            //     let invoice = objRecord.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: j });
            //     log.debug('invoice', invoice);
            //     if (invoice == recordid) {
            //         objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, line: j });
            //         objRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount, line: j });
            //         break;
            //     }
            // }
            


            let linecountCredit = objRecord.getLineCount({ sublistId: 'credit' });
            log.debug('linecountCredit', linecountCredit);

            // objRecord.setSublistValue({ sublistId: 'credit', fieldId: 'apply', value: true, line: 5 });
            // objRecord.setSublistValue({ sublistId: 'credit', fieldId: 'amount', value: amount, line: 5 });

            for (let j = 0; j < linecountCredit; j++) {
                let journal = objRecord.getSublistValue({ sublistId: 'credit', fieldId: 'doc', line: j });
                let dueJournal = objRecord.getSublistValue({ sublistId: 'credit', fieldId: 'due', line: j });
                //log.debug('journal', `${journal} == ${journalid} && ${dueJournal} == ${amount} - ${j}`);
                if (journal == journalid && dueJournal == amount) {
                    log.debug('journal-Entry', `${journal} - ${dueJournal} - ${j}`);
                    objRecord.setSublistValue({ sublistId: 'credit', fieldId: 'apply', value: true, line: j });
                    //objRecord.setSublistValue({ sublistId: 'credit', fieldId: 'amount', value: amount, line: j });
                    break;
                }
            }

            objRecord.setSublistValue({ sublistId: 'apply', fieldId: 'apply', value: false, line: 0 });
            objRecord.setSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true, line: 0 });
            // objRecord.setSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount, line: 0 });

            let saveRecord = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
            log.debug('saveRecord', saveRecord);

        } catch (error) {
            log.error('error', error);
        }
    }


    return {
        execute: execute
    }
});
