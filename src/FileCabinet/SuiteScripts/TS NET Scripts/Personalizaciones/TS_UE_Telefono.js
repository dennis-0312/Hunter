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
                var entidad = objRecord.getValue('custrecord_ht_campo_lbl_entidad_telefono');
                var telefono = objRecord.getValue('custrecord_ht_campo_txt_telefono');
                var principal = objRecord.getValue('custrecord_ht_campo_txt_principal');
                log.debug('principal',principal)
                if (principal == true) {
                    record.submitFields({
                        type: 'customer',
                        id: entidad,
                        values: {
                            'phone': telefono
                        }
                    });
                    var idTelefono = getIdTelefono(entidad,objRecord.id);
                    log.debug('idTelefono',idTelefono);
                    for (i = 0; i < idTelefono.length; i++) {
                        log.debug('id: idTelefono[i]',idTelefono[i]);
                        record.submitFields({
                            type: 'customrecord_ht_registro_telefono',
                            id: idTelefono[i][0],
                            values: { 'custrecord_ht_campo_txt_principal': false },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }

                }
            }

        }
        const getIdTelefono = (entidad,telefono) => {
            try {
                var arrTelefonoId = new Array();
                var busqueda = search.create({
                    type: "customrecord_ht_registro_telefono",
                    filters:
                        [
                            ["custrecord_ht_campo_lbl_entidad_telefono", "anyof", entidad], 
                            "AND", 
                            ["internalid","noneof",telefono]
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
                        var arrTelefono = new Array();
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null)
                            arrTelefono[0] = result.getValue(columns[0]);
                        else
                            arrTelefono[0] = '';
                        arrTelefonoId.push(arrTelefono);
                    });
                });
                return arrTelefonoId;
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





