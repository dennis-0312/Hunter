/*********************************************************************************************************************************************
This script for Sales Order (Emisión de Orden de Trabajo) 
/*********************************************************************************************************************************************
File Name: TS_UE_Detalle_Bien.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 13/01/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/plugin', 'N/record', 'N/search', 'N/ui/serverWidget'], (log, plugin, record, search, serverWidget) => {
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //HT Orden de trabajo
    const HT_CONSULTA_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_consulta_orden_servicio'; //HT Consulta Orden de Servicio - PRODUCCION
    const HT_CONSULTA_ORDEN_TRABAJO_SEARCH = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
    const HT_DETALLE_ORDEN_VENTA_SEARCH = 'customsearch_ht_detalle_orden_servicio'; //HT Detalle Orden de Servicio - PRODUCCION
    const HT_BIEN_SEARCH = "customsearch_ht_bienes"; //HT Bienes - PRODUCCION
    const ESTADO_VENTAS = 7;


    const beforeLoad = (context) => {
        if (context.type === context.UserEventType.CREATE) {
            const objRecord = context.newRecord;
            const serviceOrderId = objRecord.getValue({ fieldId: 'custrecord_ht_db_enlace' });
            //const bienId = objRecord.getValue({ fieldId: 'custrecord_ht_db_enlace' });
            let json = new Array();
            let jsonBien = new Array();
            let clienteId = '';
            //const form = context.form;
            try {
                let objSearch = search.load({ id: HT_DETALLE_ORDEN_VENTA_SEARCH });
                let filters = objSearch.filters;
                const filterItemType = search.createFilter({ name: 'type', join: 'item', operator: search.Operator.ANYOF, values: ["Assembly", "InvtPart", "Kit", "Group", "Service"] });
                const filterIntenalID = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: serviceOrderId });
                filters.push(filterItemType);
                filters.push(filterIntenalID);
                let resultCount = objSearch.runPaged().count;
                let result = objSearch.run().getRange({ start: 0, end: 100 });
                clienteId = result[0].getValue({ name: "internalid", join: "customerMain" });

                for (let i in result) {
                    let item = result[i].getValue({ name: "internalid", join: "item" });
                    json.push(item);
                }
                log.debug('Array-Item', json);
                objRecord.setValue('custrecord_ht_db_item', json);

                // let selectlocation = form.addField({
                //     id: 'custpageht_db_pais',
                //     type: serverWidget.FieldType.SELECT,
                //     label: 'País',
                // });

                // selectlocation.addSelectOption({
                //     value: 9,
                //     text: 'Perú'
                // });
                // selectlocation.addSelectOption({
                //     value: 10,
                //     text: 'Ecuador'
                // });

                // let selectlocation2 = form.addField({
                //     id: 'custpageht_db_departamento',
                //     type: serverWidget.FieldType.SELECT,
                //     label: 'Departamento',
                // });

                // selectlocation2.addSelectOption({
                //     value: 9,
                //     text: 'Lima'
                // });
                // selectlocation2.addSelectOption({
                //     value: 10,
                //     text: 'Cuzco'
                // });

                // let selectlocation3 = form.addField({
                //     id: 'custpageht_db_provincia',
                //     type: serverWidget.FieldType.SELECT,
                //     label: 'Provincia',
                // });

                // selectlocation3.addSelectOption({
                //     value: 9,
                //     text: 'Lima'
                // });
                // selectlocation3.addSelectOption({
                //     value: 10,
                //     text: 'Lima'
                // });

                // let selectlocation4 = form.addField({
                //     id: 'custpageht_db_distrito',
                //     type: serverWidget.FieldType.SELECT,
                //     label: 'Distrito',
                // });

                // selectlocation4.addSelectOption({
                //     value: 9,
                //     text: 'Lurigancho'
                // });
                // selectlocation4.addSelectOption({
                //     value: 10,
                //     text: 'San Martín de Porres'
                // });
            } catch (error) {
                log.debug('Error-beforeLoad-Items', error);
            }

            // try {
            //     let objSearch = search.load({ id: HT_BIEN_SEARCH });
            //     let filters = objSearch.filters;
            //     const filterClienteID = search.createFilter({ name: 'custrecord_ht_bien_propietario', operator: search.Operator.ANYOF, values: clienteId });
            //     filters.push(filterClienteID);
            //     let resultCount = objSearch.runPaged().count;
            //     let result = objSearch.run().getRange({ start: 0, end: 500 });
            //     for (let i in result) {
            //         let bien = result[i].id
            //         jsonBien.push(bien);
            //     }
            //     log.debug('Array-Bien', jsonBien);
            //     objRecord.setValue('custrecord_ht_db_bien', jsonBien);
            // } catch (error) {
            //     log.debug('Error-beforeLoad-Bienes', error);
            // }
        }
    }


    const afterSubmit = (context) => {
        if (context.type === context.UserEventType.CREATE) {
            const objRecord = context.newRecord;

            try {
                const serviceOrderId = objRecord.getValue({ fieldId: 'custrecord_ht_db_enlace' });
                let objSearch = search.load({ id: HT_DETALLE_ORDEN_VENTA_SEARCH });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: serviceOrderId });
                filters.push(filterOne);
                let searchResultCount = objSearch.runPaged().count;
                log.debug('Count-Results', searchResultCount);
                let result = objSearch.run().getRange({ start: 0, end: 10 });
                log.debug('Result-Results', result);
                let esRenovacion = result[0].getValue({ name: "formulatext", formula: "DECODE({custbody_ht_os_tipoordenservicio}, 'Renovación', 'SI','NO')" });
                log.debug('Es Renovación', esRenovacion);
                if (esRenovacion == 'NO') {
                    const plFunctions = plugin.loadImplementation({ type: 'customscript_ts_pl_functions' });
                    let vehiculo = objRecord.getValue('custrecord_ht_db_bien');
                    let serviceOrder = objRecord.getValue('custrecord_ht_db_enlace');
                    let items = objRecord.getValue('custrecord_ht_db_item');
                    let itemsText = objRecord.getValue('custrecord_ht_db_item');

                    // let objSearch = search.load({ id: HT_CONSULTA_ORDEN_SERVICIO_SEARCH });
                    // let filters = objSearch.filters;
                    // const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: serviceOrder });
                    // filters.push(filterOne);
                    // let searchResultCount = objSearch.runPaged().count;
                    // log.debug('Count-Results', searchResultCount);
                    // let result = objSearch.run().getRange({ start: 0, end: 500 });
                    // let idcliente = result[0].getValue({ name: "internalid", join: "customerMain" });

                    // for (let i in vehiculo) {
                    // for (let j in items) {
                    let json = new Array();
                    // let item = result[i].getValue({ name: "internalid", join: "item" });
                    // let displayname = result[i].getValue({ name: "displayname", join: "item" });

                    json = {
                        serviceOrder: serviceOrder,
                        //idcliente: idcliente,
                        vehiculo: vehiculo,
                        item: items,
                        displayname: itemsText
                    }
                    let workOrder = plFunctions.plGenerateOT(json);
                    log.debug('OT ', workOrder);
                    // }
                    // }
                }
            } catch (error) {
                log.error('Error-afterSubmit', error);
            }
        }


        if (context.type === context.UserEventType.DELETE) {
            try {
                const objRecord = context.newRecord;
                const serviceOrder = objRecord.getValue('custrecord_ht_db_enlace');
                const vehiculo = objRecord.getValue('custrecord_ht_db_bien');
                log.debug('Log-Delete-Fields', serviceOrder + ' - ' + vehiculo);
                let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO_SEARCH });
                let filters = objSearch.filters;
                const filterServiceOrder = search.createFilter({ name: 'custrecord_ht_id_orden_servicio', operator: search.Operator.ANYOF, values: serviceOrder });
                filters.push(filterServiceOrder);
                const filterVehiculo = search.createFilter({ name: 'custrecord_ht_ot_vehiculo', operator: search.Operator.ANYOF, values: vehiculo });
                filters.push(filterVehiculo);
                let searchResultCount = objSearch.runPaged().count;
                log.debug('Count-Results', searchResultCount);
                if (searchResultCount > 0) {
                    let result = objSearch.run().getRange({ start: 0, end: 500 });
                    for (let i in result) {
                        let featureRecord = record.delete({ type: HT_ORDEN_TRABAJO_RECORD, id: result[i].id });
                        log.debug('Delete-Record', featureRecord);
                    }
                }
            } catch (error) {
                log.error('Error-Delete', error);
            }
        }
    }

    return {
        //beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 13/01/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/