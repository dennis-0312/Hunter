/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/runtime'], function (search, runtime) {

    const pageInit = (context) => {
        let currentRecord = context.currentRecord;
        try {
            removerLineasRetencion(currentRecord);
        } catch (error) {
            console.log("error", error);
        }
    }

    const removerLineasRetencion = (currentRecord) => {
        let expenseLines = currentRecord.getLineCount("expense");
        for (let i = expenseLines - 1; i >= 0; i--) {
            let esRetencion = currentRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_ts_ec_es_retencion_impuestos', line: i });
            if (esRetencion) currentRecord.removeLine("expense", i);
        }
    }

    return {
        pageInit
    };
})
