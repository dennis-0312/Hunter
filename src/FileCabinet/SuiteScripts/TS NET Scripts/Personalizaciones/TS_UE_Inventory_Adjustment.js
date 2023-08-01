/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/log', 'N/record', 'N/search'], (log, record, search) => {

    // function beforeLoad(context) {}
    // function beforeSubmit(context) {}

    const afterSubmit = (context) => {
        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {

            try {
                let objRecord = context.newRecord;
                let id = objRecord.id
                var cuenta = objRecord.getValue('account');
                var customer = objRecord.getValue('customer');
                var subsidiary = objRecord.getValue('subsidiary');
                var adjlocation = objRecord.getValue('adjlocation');
                var alquiler = objRecord.getValue('custbody_ht_ai_paraalquiler');
                var idAssemblyBuild = objRecord.getValue('custbody_ht_ai_orden_trabajo');
                log.debug('alquiler', alquiler);
                var idItem = objRecord.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item',
                    line: 0
                });
                var idItemText = objRecord.getSublistText({
                    sublistId: 'inventory',
                    fieldId: 'item',
                    line: 0
                });
                log.debug('idItem', idItem);
                var avgunitcost = objRecord.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'avgunitcost',
                    line: 0
                });
                var adjustqtyby = objRecord.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'adjustqtyby',
                    line: 0
                });
                adjustqtyby = Number(adjustqtyby) * -1;
                log.debug('adjustqtyby', adjustqtyby);

                let newDetail = objRecord.getSublistSubrecord({
                    sublistId: 'inventory',
                    fieldId: 'inventorydetail',
                    line: 0
                });
                log.debug('newDetail', newDetail);
                var numLines = objRecord.getLineCount({ sublistId: 'inventory' });
                let inventorynumber = '';
                for (let i = 0; i < numLines; i++) {
                    let invDetailRec = objRecord.getSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail', line: i });
                    let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });

                    for (let j = 0; j < inventoryAssignmentLines; j++) {

                        inventorynumber = invDetailRec.getSublistText({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });

                    }
                }
                log.debug('inventorynumber', inventorynumber);
                var busqueda = search.lookupFields({
                    type: search.Type.ITEM,
                    id: idItem,
                    columns: ['custitem_ht_at_itemalquiler', 'custitem_ht_ar_tipoactivo']
                });
                log.debug('busqueda', busqueda);
                var itemAlquiler = (busqueda.custitem_ht_at_itemalquiler)[0].value;
                var tipo = (busqueda.custitem_ht_ar_tipoactivo)[0].value;
                var busqueda_2 = search.lookupFields({
                    type: search.Type.ASSEMBLY_BUILD,
                    id: idAssemblyBuild,
                    columns: ['custbody_ht_ce_ordentrabajo']
                });
                log.debug('busqueda_2', busqueda_2);
                var idOrdenTrabajo = (busqueda_2.custbody_ht_ce_ordentrabajo)[0].value;
                let objRecord_2 = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: idOrdenTrabajo, isDynamic: true });
                var nameTextSalesOrder = objRecord_2.getText('custrecord_ht_id_orden_servicio');
                var nameValueSalesOrder = objRecord_2.getValue('custrecord_ht_id_orden_servicio');
                var estadoOrdenTrabajo = objRecord_2.getText('custrecord_ht_ot_estado');
                var clienteOrdenTrabajo = objRecord_2.getText('custrecord_ht_ot_cliente');
                var placaOrdenTrabajo = objRecord_2.getText('custrecord_ht_ot_placa');
                var tipoOrdenTrabajo = objRecord_2.getText('custrecord_ht_ot_tipo');
                var marcaOrdenTrabajo = objRecord_2.getText('custrecord_ht_os_marca');
                var motorOrdenTrabajo = objRecord_2.getText('custrecord_ht_ot_motor');
                var estadoOrdenTrabajo = objRecord_2.getText('custrecord_ht_ot_estado');
                log.debug('tipoOrdenTrabajo', tipoOrdenTrabajo);
                var busqueda_3 = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: nameValueSalesOrder,
                    columns: ['custbody_ht_os_tipoordenservicio', 'trandate']
                });
                log.debug('busqueda_3', busqueda_3);
                var typeSalesOrder = (busqueda_3.custbody_ht_os_tipoordenservicio)[0].text;
                var createDateSalesOrder = busqueda_3.trandate;
                /*                 if (itemAlquiler != '') {
                                    itemAlquiler = itemAlquiler[0].value;
                                } */
                /*                 if (tipo != '') {
                                    tipo = tipo[0].value;
                                } */
                log.debug('itemAlquiler + TIPO', itemAlquiler + '-' + tipo);

                if (alquiler == true || alquiler == 'T') {
                    if (tipo) {
                        var fixedAsset = record.create({
                            type: 'customrecord_ncfar_asset',
                            isDynamic: true
                        });
                        fixedAsset.setValue('altname', idItemText);
                        fixedAsset.setValue('custrecord_assettype', tipo);
                        fixedAsset.setValue('custrecord_assetcost', avgunitcost);
                        fixedAsset.setValue('custrecord_assetresidualvalue', 1);
                        fixedAsset.save();
                        log.debug('fixedAsset.id', fixedAsset.id);
                        var historial = record.create({
                            type: 'customrecord_ht_record_historialsegui',
                            isDynamic: true
                        });
                        historial.setText('name', nameTextSalesOrder);
                        historial.setText('custrecord_ht_hs_numeroordenservicio', nameTextSalesOrder);
                        historial.setValue('custrecord_ht_hs_descripcion', typeSalesOrder);
                        historial.setValue('custrecord_ht_hs_fechaordenservicio', createDateSalesOrder);
                        historial.setValue('custrecord_ht_hs_estado', estadoOrdenTrabajo);
                        historial.setValue('custrecord_ht_hs_propietariocliente', clienteOrdenTrabajo);
                        historial.setValue('custrecord_ht_hs_vidvehiculo', inventorynumber);
                        historial.setValue('custrecord_ht_hs_placa', placaOrdenTrabajo);
                        historial.setValue('custrecord_ht_hs_marca', marcaOrdenTrabajo);
                        historial.setValue('custrecord_ht_hs_tipo', tipoOrdenTrabajo);
                        historial.setValue('custrecord_ht_hs_motor', motorOrdenTrabajo);
                        historial.setValue('custrecord_ht_af_enlace', fixedAsset.id);
                        historial.save();
                    }
                    if (itemAlquiler) {
                        let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
                        newAdjust.setValue({ fieldId: 'subsidiary', value: subsidiary });
                        newAdjust.setValue({ fieldId: 'account', value: cuenta });
                        newAdjust.setValue({ fieldId: 'adjlocation', value: adjlocation });
                        newAdjust.setValue({ fieldId: 'customer', value: customer });
                        newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: id });

                        for (let i = 0; i < numLines; i++) {
                            //==================================================================
                            newAdjust.selectNewLine({ sublistId: 'inventory' });
                            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: itemAlquiler });
                            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: adjlocation });
                            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: adjustqtyby });
                            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: 0 });

                            let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                            log.debug('newDetail ', newDetail);
                            newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: inventorynumber });
                            /*                     newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: 1 });
                                                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });  */
                            newDetail.commitLine({ sublistId: 'inventoryassignment' });

                            newAdjust.commitLine({ sublistId: 'inventory' });
                        }
                        let newRecord = newAdjust.save();
                        log.debug('Nuevo Ajuste', newRecord);
                    }
                }
            } catch (error) {
                log.error('Error', error);
            }
        }
    }
    function getInventorynumber(objRecord, i) {
        let invDetailRec = objRecord.getSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail', line: i });
        let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });


        for (let j = 0; j < inventoryAssignmentLines; j++) {

            let inventorynumber = invDetailRec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });

            return inventorynumber;
        }
    }
    return {
        // beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
