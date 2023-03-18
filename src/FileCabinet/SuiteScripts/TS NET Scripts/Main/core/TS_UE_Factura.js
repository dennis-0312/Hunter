/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_UE_Factura.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 20/01/2023
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/https'], (log, search, record, https) => {
    const HT_DETALLE_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_detalle_orden_servicio'; //HT Detalle Orden de Servicio - PRODUCCION
    const HT_DETALLE_BIENES_SEARCH = 'customsearch_ht_detalle_bienes';
    const HT_COBERTURA_SEARCH = 'customsearch_ht_cobertura' //HT Cobertura - PRODUCCION
    const HT_COBERTURA_RECORD = 'customrecord_ht_co_cobertura' // HT Cobertura
    const TIPO_SERVICIO_CAMBIO_PROPIETARIO = 2;

    const deforeSubmit = (context) => {
        // if (context.type === context.UserEventType.CREATE) {
        //     const objRecord = context.newRecord;
        //     const serviceOrderType = objRecord.getValue({ fieldId: 'custbody_ht_os_tipoordenservicio' });
        //     try {
        //         if (serviceOrderType == 8) {

        //         }
        //     } catch (error) {
        //         log.error('Error-deforeSubmit', error);
        //     }
        // }
    }

    const afterSubmit = (context) => {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            const objRecord = context.newRecord;
            try {
                let assembly = '';
                let service = '';
                const serviceOrderId = objRecord.getValue({ fieldId: 'createdfrom' });
                let objSearch = search.load({ id: HT_DETALLE_ORDEN_SERVICIO_SEARCH });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: serviceOrderId });
                filters.push(filterOne);
                let searchResultCount = objSearch.runPaged().count;
                // log.debug('Count-Results', searchResultCount);
                let result = objSearch.run().getRange({ start: 0, end: 1 });
                // log.debug('Result-Results', result);
                let esRenovacion = result[0].getValue({ name: "formulatext", formula: "DECODE({custbody_ht_os_tipoordenservicio}, 'Renovación', 'SI','NO')" });
                // log.debug('Es Renovación', esRenovacion);
                if (esRenovacion == 'SI') {
                    let objSearch2 = search.load({ id: HT_DETALLE_BIENES_SEARCH });
                    let filters2 = objSearch2.filters;
                    const filterOne2 = search.createFilter({ name: 'custrecord_ht_db_enlace', operator: search.Operator.ANYOF, values: serviceOrderId });
                    filters2.push(filterOne2);
                    let searchResultCount2 = objSearch2.runPaged().count;
                    // log.debug('Count-Results', searchResultCount2);
                    let result2 = objSearch2.run().getRange({ start: 0, end: 10 });
                    //log.debug('Result-Results', result2);
                    let bienId = result2[0].getValue({ name: "custrecord_ht_db_bien" });
                    //log.debug('item', bienId);
                    for (let i in result2) {
                        let itemtype = result2[i].getValue({ name: "itemtype", join: "CUSTRECORD_HT_DB_ENLACE" });
                        // item = result2[i].getValue({ name: "item", join: "CUSTRECORD_HT_DB_ENLACE" });
                        // log.debug('item', item);
                        // log.debug('itemtype', itemtype);
                        if (itemtype == 'Service') {
                            service = result2[i].getValue({ name: "item", join: "CUSTRECORD_HT_DB_ENLACE" });
                        }

                        if (itemtype == 'Assembly') {
                            assembly = result2[i].getValue({ name: "item", join: "CUSTRECORD_HT_DB_ENLACE" });
                        }
                    }
                    //log.debug('assembly', assembly);
                    let date = new Date();
                    let day = date.getDay() + 15;
                    let month = date.getMonth() + 1; // jan = 0
                    let year = date.getFullYear();
                    month = month <= 9 ? '0' + month : month;
                    let fechaInicial = day + '/' + month + '/' + year
                    let fechaFinal = (day - 1) + '/' + month + '/' + (parseInt(year) + 1)
                    log.debug('Nueva Cobertura', fechaInicial + ' - ' + fechaFinal);
                    log.debug('Impulso Plataforma', 'Genera impulso a Telematics');

                    // let fecha = new Date();
                    // let nuevaFecha = fecha.setFullYear(fecha.getFullYear() + 1);
                    // log.debug('Nueva Cobertura', new Date(nuevaFecha));


                    // let objSearch3 = search.load({ id: HT_COBERTURA_SEARCH });
                    // let filters3 = objSearch3.filters;
                    // const filterOne3 = search.createFilter({ name: 'custrecord_ht_co_producto', operator: search.Operator.ANYOF, values: assembly });
                    // filters3.push(filterOne3);
                    // let searchResultCount3 = objSearch3.runPaged().count;
                    // //log.debug('Count-Results', searchResultCount3);
                    // let result3 = objSearch3.run().getRange({ start: 0, end: 1 });
                    // log.debug('Result-Results', result3);
                    // let coberturaId = result3[0].id;
                    // log.debug('ID', coberturaId);
                    // let coberturaRecord = record.submitFields({
                    //     type: HT_COBERTURA_RECORD,
                    //     id: coberturaId,
                    //     values: {
                    //         'custrecord_ht_co_coberturafinal': new Date(nuevaFecha),
                    //     }
                    // });
                }
            } catch (error) {
                log.error('Error-afterSubmit', error);
            }
        }
    }

    return {
        //deforeSubmit: deforeSubmit,
        afterSubmit: afterSubmit
    }
});




/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 17/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/