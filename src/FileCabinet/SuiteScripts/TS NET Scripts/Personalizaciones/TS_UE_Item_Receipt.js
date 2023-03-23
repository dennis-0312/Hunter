/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search', 'N/ui/serverWidget',"N/format"], (log, record, search, serverWidget, format) => {

    const afterSubmit = (scriptContext) => {
        try {
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                const objRecord = scriptContext.newRecord;
                let linecount = objRecord.getLineCount({ sublistId: 'item' })
                let tranID = objRecord.id;
                log.debug('tranID', tranID);
                let tranDate = objRecord.getValue('trandate');
                tranDate = format.parse({
                    value: tranDate,
                    type: format.Type.DATE
                });
                log.debug('tranDate', tranDate);
                /* let item = objRecord.getValue('item');
                log.debug('item', item); */
                log.debug('linecount', linecount);
                for (let i = 0; i < linecount; i++) {
                    let item = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    let typeItem = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_ai_componentechaser', line: i });
                    log.debug('typeItem', typeItem);
                    let location = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i });
                    let invDetailRec = objRecord.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: i });
                    log.debug('item', item);
                    log.debug('invDetailRec', invDetailRec);
                    let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });
                    log.debug('inventoryAssignmentLines', inventoryAssignmentLines);
                    for (let j = 0; j < inventoryAssignmentLines; j++) {
                        let inventorynumber = invDetailRec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', line: j });
                        log.debug('inventorynumber', inventorynumber);
                        let idInventoryNumber = getInventoryNumber(inventorynumber);
                        log.debug('idInventoryNumber', idInventoryNumber);
                        if (typeItem == 1) {
                            var chaser = record.create({
                                type: 'customrecord_ht_record_detallechaserdisp',
                                isDynamic: true
                            });
                            chaser.setValue('name', inventorynumber);
                            chaser.setValue('custrecord_ht_dd_dispositivo', item);
                            chaser.setValue('custrecord_ht_dd_item', idInventoryNumber);
                            chaser.setValue('custrecord_ht_dd_recepcionarticulo', tranID);
                            chaser.setValue('custrecord_ht_dd_fechaingreso', tranDate);
                            chaser.setValue('custrecord_ht_dd_ubicacioningreso', location);
                            chaser.setValue('isinactive', true);
                            //chaser.setValue('custrecord_ht_ds_estado', 4);
                            chaser.save();
                        } else if (typeItem == 2) {
                            var simCard = record.create({
                                type: 'customrecord_ht_record_detallechasersim',
                                isDynamic: true
                            });
                            simCard.setValue('name', inventorynumber);
                            simCard.setValue('custrecord_ht_ds_simcard', item);
                            simCard.setValue('custrecord_ht_ds_serie', idInventoryNumber);
                            simCard.setValue('custrecord_ht_ds_estado', 4);
                            simCard.setValue('custrecord_ht_ds_recepcionarticulo', tranID);
                            simCard.setValue('custrecord_ht_ds_ubicacioningreso', location);
                            simCard.setValue('custrecord_ht_ds_fechaingreso', tranDate);
                            simCard.setValue('isinactive', true);
                            simCard.save();
                        } else if (typeItem == 3) {
                            var lojack = record.create({
                                type: 'customrecord_ht_record_detallechaslojack',
                                isDynamic: true
                            });
                            lojack.setValue('name', inventorynumber);
                            lojack.setValue('custrecord_ht_cl_lojack', item);
                            lojack.setValue('custrecord_ht_cl_seriebox', idInventoryNumber);
                            lojack.setValue('custrecord_ht_cl_recepcionarticulo', tranID);
                            lojack.setValue('custrecord_ht_cl_ubicacioningreso', location);
                            lojack.setValue('custrecord_ht_cl_fechaingreso', tranDate);
                            lojack.setValue('isinactive', true);

                            //lojack.setValue('custrecord_ht_cl_estado', 5);
                            lojack.save();
                        } 
                    }
                }
            }
        } catch (error) {
            log.error('Error beforeSubmit', error);
        }

    }
    function getInventoryNumber(inventorynumber) {
        try {
            var busqueda = search.create({
                type: "inventorynumber",
                filters:
                    [
                        ["inventorynumber", "is", inventorynumber]
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
        /*  beforeLoad: beforeLoad,
         beforeSubmit: beforeSubmit */
        afterSubmit: afterSubmit
    }
});
