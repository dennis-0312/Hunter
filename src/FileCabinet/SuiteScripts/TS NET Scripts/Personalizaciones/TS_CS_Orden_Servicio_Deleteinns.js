/*=======================================================================================================================================================
This script for service order
=========================================================================================================================================================
File Name: TS_CS_Orden_Servicio.js                                                                        
Commit: 01                                                                                                                          
Date: 19/03/2023
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/search', 'N/currentRecord', 'N/ui/message'], (search, currentRecord, message) => {
    let typeMode = '';

    const pageInit = (scriptContext) => {
        typeMode = scriptContext.mode; //!Importante, no borrar.
    }

    const fieldChanged = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;
        try {
            // if (typeMode == 'create' || typeMode == 'copy') {
            if (typeMode == 'create') {
                if (objRecord.getValue({ fieldId: 'custbody_ht_so_bien' }) != objRecord.getValue({ fieldId: 'custbody_ht_os_bien_flag' })) {
                    let linecount = parseInt(objRecord.getLineCount({ sublistId: 'item' }));
                    if (linecount > 0) {
                        console.log('Entré a borrar');
                        for (let i = linecount - 1; i >= 0; i--) {
                            objRecord.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
                        }
                    }
                    objRecord.setValue({ fieldId: 'custbody_ht_os_bien_flag', value: objRecord.getValue({ fieldId: 'custbody_ht_so_bien' }) })
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
