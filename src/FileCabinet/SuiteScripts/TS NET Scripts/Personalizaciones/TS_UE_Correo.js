/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_UE_Orden_Trabajo.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/log', 'N/search', 'N/record', 'N/ui/serverWidget', 'N/https', 'N/error'],
    (log, search, record, serverWidget, https, error) => {

        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const objRecord = context.newRecord;
                log.debug('objRecord', objRecord);
                var entidad = objRecord.getValue('custrecord_ht_ce_enlace');
                var email = objRecord.getValue('custrecord_ht_email_email');
                var principal = objRecord.getValue('custrecord_ht_email_emailprincipal');
                log.debug('principal', principal)
                if (principal == true) {
                    record.submitFields({ type: 'customer', id: entidad, values: { 'email': email } });
                    var idEmail = getIdEmail(entidad, objRecord.id);
                    log.debug('idEmail', idEmail);
                    for (i = 0; i < idEmail.length; i++) {
                        log.debug('id: idEmail[i]', idEmail[i]);
                        record.submitFields({
                            type: 'customrecord_ht_record_correoelectronico',
                            id: idEmail[i][0],
                            values: { 'custrecord_ht_email_emailprincipal': false },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }

                }
            }

        }
        const getIdEmail = (entidad, email) => {
            try {
                var arrEmailId = new Array();
                var busqueda = search.create({
                    type: "customrecord_ht_record_correoelectronico",
                    filters:
                        [
                            ["custrecord_ht_ce_enlace", "anyof", entidad],
                            "AND",
                            ["internalid", "noneof", email]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var pageData = busqueda.runPaged({
                    pageSize: 1000
                });

                pageData.pageRanges.forEach(function (pageRange) {
                    page = pageData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
                        var columns = result.columns;
                        var arrEmail = new Array();
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null)
                            arrEmail[0] = result.getValue(columns[0]);
                        else
                            arrEmail[0] = '';
                        arrEmailId.push(arrEmail);
                    });
                });
                return arrEmailId;
            } catch (e) {
                log.error('Error en getIdTelefono', e);
            }
        }

        return {
            //beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    });




/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 12/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
/*********************************************************************************************************************************************
Commit:02
Version: 1.0
Date: 15/12/2022
Author: Dennis Fernández
Description: Aplicación de evento EDIT.
==============================================================================================================================================*/
/*********************************************************************************************************************************************
Commit:03
Version: 1.0
Date: 23/03/2023
Author: Jeferson Mejia
Description: Se juntaron los scritps de Orden de Trabajo
==============================================================================================================================================*/





