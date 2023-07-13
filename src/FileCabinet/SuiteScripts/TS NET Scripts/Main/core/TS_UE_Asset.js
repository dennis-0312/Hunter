/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  
||   This script for Customer (Generación de identificador para cliente)                                            
||                                                                                                                  
||   File Name: TS_UE_Asset.js                                                                            
||                                                                                                                  
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  
||   01          1.0         26/01/2023      Script 2.1         SB               N/A                                
||                                                                                                                  
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/redirect', 'N/ui/serverWidget', 'N/runtime', 'N/https', 'N/format'], (log, search, record, redirect, serverWidget, runtime, https, format) => {

    const afterSubmit = (context) => {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const currentRecord = context.newRecord;
                const idRecord = currentRecord.id;
                let objRecord = record.load({ type: 'customrecord_ncfar_asset', id: idRecord, isDynamic: true });
                log.debug('idRecord', idRecord);
                var cadenaConCeros = agregarCeros(idRecord);
                log.debug('cadenaConCeros', cadenaConCeros); 
                objRecord.setValue('custrecord_ht_af_codigobarra', cadenaConCeros);
                objRecord.save();
            }
        } catch (e) {
            log.error('Error en el afterSubmit', e);
        }

    }
    const beforeLoad = (context) => {
        try {
            var form = context.form;
            var currentRecord = context.newRecord;
            const idRecord = currentRecord.id;
            const typeRecord = currentRecord.type;

            if (context.type == context.UserEventType.VIEW) {
                var codigobarras = currentRecord.getValue('custrecord_ht_af_codigobarra');
                if (codigobarras != '') {
                    form.addButton({
                        id: 'custpage_ts_codigo_barras',
                        label: 'Código de Barras',
                        functionName: 'printCodigoBarras(' + idRecord + ',"' + typeRecord + '")'
                    });
                    form.clientScriptModulePath = './TS_CS_Codigo_Barras.js';
                }
            }
        } catch (e) {
            log.error('Error en el beforeSubmit', e);
        }
    }

    function agregarCeros(num) {
        var numString = num.toString(); // convertir el número en una cadena
        while (numString.length < 11) { // agregar ceros a la izquierda mientras la cadena sea menor que 11
            numString = '0' + numString;
        }
        return numString;
    }
    return {
        afterSubmit: afterSubmit,
        beforeLoad: beforeLoad
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 04/04/2023
Author: Jeferson Mejia
Description: Creación del script.
===================================================================================================================*/