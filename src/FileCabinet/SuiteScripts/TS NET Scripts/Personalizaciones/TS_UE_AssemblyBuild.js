/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  
||   This script for Customer (Generación de identificador para cliente)                                            
||                                                                                                                  
||   File Name: TS_UE_AssemblyBuild.js                                                                            
||                                                                                                                  
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  
||   01          1.0         26/01/2023      Script 2.1         SB               N/A                                
||                                                                                                                  
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/redirect', 'N/ui/serverWidget'], (log, search, record, redirect, serverWidget) => {



    const afterSubmit = (context) => {
        log.debug("cancelar", context.type);
        const currentRecord = context.newRecord;
        const idRecord = currentRecord.id;
        
        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
            let objRecord = record.load({ type: 'assemblybuild', id: idRecord, isDynamic: true });
            log.debug('objRecord',objRecord);
            let ordentrabajo = objRecord.getValue('custbody_ht_ce_ordentrabajo');
            let location = objRecord.getValue('custbody_ht_ce_ubicacion');
            if(ordentrabajo != ''){
                //let chaser = objRecord.getCurrentSublistValue({ sublistId: 'recmachcustrecord_ht_mc_enlace', fieldId: 'id'});
                let name = objRecord.getSublistValue({ sublistId: 'recmachcustrecord_ht_mc_enlace', fieldId: 'id', line: 0 });
                log.debug('name',name);
                let objRecord_2 = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordentrabajo, isDynamic: true })

                log.debug('objRecord_2',objRecord_2);
                objRecord_2.setValue('custrecord_ht_ot_serieproductoasignacion',name);
                log.debug('uu',objRecord_2.getValue('custrecord_ht_ot_serieproductoasignacion'));
                objRecord_2.setValue('custrecord_ht_ot_ubicacion',location);
                objRecord_2.setValue('custrecord_ht_ot_estado',2);

                objRecord_2.save();
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
Date: 26/01/2023
Author: Jeferson Mejia
Description: Creación del script.
===================================================================================================================*/