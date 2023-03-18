/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  
||   This script for Customer (Generación de identificador para cliente)                                            
||                                                                                                                  
||   File Name: TS_UE_Customer_Vendor.js                                                                            
||                                                                                                                  
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  
||   01          1.0         26/12/2022      Script 2.1         SB               N/A                                
||                                                                                                                  
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/redirect'], (log, search, record, redirect) => {
    const CUSTOMER = 'customer';
    const VENDOR = 'vendor';

    const afterSubmit = (context) => {
        const objRecord = context.newRecord;
        const recordId = objRecord.id;
        let identifier = '';
        //let altname = '';
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY || context.type === context.UserEventType.EDIT) {
            try {
                let vatregnumber = objRecord.getValue('vatregnumber');
                // let isperson = objRecord.getValue('isperson');
                // log.debug('isperson', isperson);

                // if (isperson == 'F') {
                //     altname = objRecord.getValue('companyname');
                // } else {
                //     altname = objRecord.getValue('firstname') + ' ' + objRecord.getValue('lastname');
                // }

                if (context.newRecord.type == CUSTOMER) {
                    identifier = 'C-EC-' + vatregnumber;
                    record.submitFields({ type: record.Type.CUSTOMER, id: recordId, values: { 'entityid': identifier } });
                }

                if (context.newRecord.type == VENDOR) {
                    identifier = 'P-EC-' + vatregnumber;
                    record.submitFields({ type: record.Type.VENDOR, id: recordId, values: { 'entityid': identifier } });
                }
                log.debug('DEBUG', identifier);

            } catch (error) {
                log.error('Error-beforeLoad', error);
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 16/03/2021
Author: Dennis Fernández
Description: Creación del script.
===================================================================================================================*/