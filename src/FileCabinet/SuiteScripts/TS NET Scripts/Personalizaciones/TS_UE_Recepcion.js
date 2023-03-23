/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  
||   This script for Customer (Generación de identificador para cliente)                                            
||                                                                                                                  
||   File Name: TS_UE_Orden_Servicio_2.js                                                                            
||                                                                                                                  
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  
||   01          1.0         26/01/2023      Script 2.1         SB               N/A                                
||                                                                                                                  
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */


/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/redirect', 'N/ui/serverWidget', 'N/runtime', 'N/https'], (log, search, record, redirect, serverWidget, runtime, https) => {

    const afterSubmit = (context) => {
        log.debug("cancelar", context.type);
        const currentRecord = context.newRecord;
        const idRecord = currentRecord.id;
        if (context.type === context.UserEventType.CREATE) {
            let objRecord = record.load({ type: 'calendarevent', id: idRecord, isDynamic: true });
            if (context.type === context.UserEventType.CREATE) {
                var salesOrder = objRecord.getValue('transaction');
                getRecepcion(salesOrder);
            }
        }
    }
    function getRecepcion(id) {
        try {

            var busqueda = search.create({
                type: "customrecord_ht_record_ordentrabajo",
                filters:
                    [
                        ["custrecord_ht_ot_orden_servicio", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            sort: search.Sort.ASC,
                            label: "ID"
                        })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 100);
            var id = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    id = result.getValue(busqueda.columns[0]);
                    log.debug('id', id);
                    record.submitFields({
                        type: 'customrecord_ht_record_ordentrabajo',
                        id: id,
                        values: {
                            'custrecord_ht_ot_estado': 4
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    return true;
                });
            }
        } catch (e) {
            log.error('Error en getRecepcion', e);
        }
    }
    return {
        afterSubmit: afterSubmit
        //beforeLoad: beforeLoad
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