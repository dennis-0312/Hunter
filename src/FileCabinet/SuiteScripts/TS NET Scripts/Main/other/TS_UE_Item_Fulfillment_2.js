/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
    //const HT_INVENTORY_DETAIL_AF_SEARCH = 'customsearch_ht_inventory_detail_af'; //HT Inventory Detail AF - PRODUCCION
    // function beforeLoad(context) {}
    // function beforeSubmit(context) {}
    const HT_INVENTORY_DETAIL_AF_SEARCH = 'customsearch_ht_inventory_detail_af';
    const afterSubmit = (context) => {
        if (context.type === context.UserEventType.EDIT) {
            try {
                const objRecord = context.newRecord;
                log.debug('objRecord', objRecord);
                let estado = objRecord.getValue('custrecord_ht_ot_estado');
                log.debug('estado', estado);
                let idSalesOrder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                log.debug('idSalesOrder', idSalesOrder);
                let dispositivo = objRecord.getValue('custrecord_ht_ot_dispositivo');
                log.debug('dispositivo', dispositivo);
                var idDispositivo = getInventoryNumber(dispositivo);
                log.debug('idDispositivo', idDispositivo);
                var estadoSalesOrder = getSalesOrder(idSalesOrder);

                if (estado == 2 && (estadoSalesOrder == 'pendingFulfillment'|| estadoSalesOrder == 'partiallyFulfilled')) {
                    log.debug('entra');
                    var serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                    var ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                    record.submitFields({
                        type: 'customrecord_ht_record_mantchaser',
                        id: serieProducto,
                        values: { 'custrecord_ht_mc_ubicacion': ubicacion },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                    var createFulfill = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: idSalesOrder,
                        toType: record.Type.ITEM_FULFILLMENT
                    });
                    log.debug('createFulfill', createFulfill);
                    var numLines = createFulfill.getLineCount({ sublistId: 'item' });
                    log.debug('numLines', numLines);
                    for (let i = 0; i < numLines; i++) {
                        createFulfill.setSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1, line: i });
                        var objSubRecord = createFulfill.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: 0 });
                        objSubRecord.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1, line: 0 });
                        objSubRecord.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: idDispositivo, line: 0 });
                    }
                    createFulfill.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

                }

            } catch (error) {
                log.error('Error', error);
            }

        }
    }
    function getSalesOrder(id) {
        try {
            var busqueda = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", id],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "statusref", label: "Status" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var estado = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    estado = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            log.debug('estado busqueda', estado);
            return estado;
        } catch (e) {
            log.error('Error en estadoSalesOrder', e);
        }
    }

    function getInventoryNumber(inventorynumber) {
        try {
            var busqueda = search.create({
                type: "inventorynumber",
                filters:
                    [
                        ["inventorynumber", "is", inventorynumber],
                        "AND",
                        ["quantityavailable", "equalto", "1"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var idInventoryNumber = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    idInventoryNumber = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return idInventoryNumber;
        } catch (e) {
            log.error('Error en getInventoryNumber', e);
        }
    }
    return {
        // beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
