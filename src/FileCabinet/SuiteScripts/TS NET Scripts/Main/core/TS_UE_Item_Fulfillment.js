/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
    const HT_INVENTORY_DETAIL_AF_SEARCH = 'customsearch_ht_inventory_detail_af'; //HT Inventory Detail AF - PRODUCCION
    // function beforeLoad(context) {}
    // function beforeSubmit(context) {}

    const afterSubmit = (context) => {
        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
            const objRecord = context.newRecord;
            try {
                let id = objRecord.id

                let objSearch = search.load({ id: HT_INVENTORY_DETAIL_AF_SEARCH });
                const filterInternalId = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: id });
                // const filterSerialNotNone = search.createFilter({ name: 'serialnumber', operator: search.Operator.ISNOTEMPTY, values: "" });
                // const filterEsAlquiler = search.createFilter({ name: 'custcol_ht_ep_productoalquiler', operator: search.Operator.ANYOF, values: true });
                // const filterUbicacionComercial = search.createFilter({ name: 'custcol_ht_af_ubicacion_comercial', operator: search.Operator.ANYOF, values: true });
                let filters = objSearch.filters;
                filters.push(filterInternalId);
                // filters.push(filterSerialNotNone);
                // filters.push(filterEsAlquiler);
                // filters.push(filterUbicacionComercial);

                let myResults = objSearch.run().getRange({ start: 0, end: 50 });
                //log.debug('MyResults', myResults);

                let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
                newAdjust.setValue({ fieldId: 'subsidiary', value: 2 });
                newAdjust.setValue({ fieldId: 'account', value: 1501 });
                newAdjust.setValue({ fieldId: 'adjlocation', value: 19 });
                newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: id });
                for (let i in myResults) {
                    let item = myResults[i].getValue({ name: "item", summary: "GROUP" });
                    let adjustqtyby = myResults[i].getValue({ name: "quantity", summary: "GROUP" });
                    let serialnumber = myResults[i].getValue({ name: "serialnumber", summary: "GROUP" });
                    log.debug('Results', item + ' - ' + adjustqtyby + ' - ' + serialnumber);
                    //==================================================================
                    newAdjust.selectNewLine({ sublistId: 'inventory' });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: 19 });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: adjustqtyby });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: 0 });

                    let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                    newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: serialnumber });
                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: 23 });
                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });
                    newDetail.commitLine({ sublistId: 'inventoryassignment' });

                    newAdjust.commitLine({ sublistId: 'inventory' });

                    let newRecord = newAdjust.save();
                    log.debug('Nuevo Ajuste', newRecord);
                }
            } catch (error) {
                log.error('Error', error);
            }
        }
    }

    return {
        // beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
