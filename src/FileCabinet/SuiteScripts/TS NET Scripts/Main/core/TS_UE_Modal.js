/**
*@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define([
    'N/log',
    'N/record',
    'N/search',
    'N/ui/serverWidget',
    'N/plugin',
    '../controller/TS_CM_Controller',
], (log, record, search, serverWidget, plugin, _controller) => {
    const HT_DETALLE_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_detalle_orden_servicio_2'; //HT Detalle Orden de Servicio - PRODUCCION

    const beforeLoad = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            const form = scriptContext.form;
            const objRecord = scriptContext.newRecord;
            let editServiceOrder = form.getButton('edit');
            if (objRecord.getValue('custbodycustbody_ht_os_created_from_sa') == true) editServiceOrder.isDisabled = true;
        }
    }


    const afterSubmit = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            const objRecord = scriptContext.newRecord;//1
            try {
                let customer = objRecord.getValue({ fieldId: 'entity' });
                let vehiculo = objRecord.getValue('custbody_ht_so_bien');
                let idOs = objRecord.id;
                let objSearch = search.load({ id: HT_DETALLE_ORDEN_SERVICIO_SEARCH });
                let filters = objSearch.filters;
                const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: objRecord.id });
                filters.push(filterOne);
                let result = objSearch.run().getRange({ start: 0, end: 10 });

                for (let i in result) {
                    let json = new Array();
                    let items = result[i].getValue({ name: "internalid", join: "item", summary: "GROUP" });
                    let itemsText = result[i].getValue({ name: "itemid", join: "item", summary: "GROUP" });
                    let ordenServicio = result[i].getValue({ name: "tranid", summary: "GROUP" });
                    let itemventalq = '';
                    var busqueda = search.create({
                        type: "customrecord_ht_pp_main_param_prod",
                        filters:
                            [
                                ["custrecord_ht_pp_parametrizacionid", "anyof", items],
                                "AND",
                                ["custrecord_ht_pp_parametrizacion_valor", "anyof", "9"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." })
                            ]
                    });
                    var savedsearch = busqueda.run().getRange(0, 1);
                    var id = '';
                    if (savedsearch.length > 0) {
                        busqueda.run().each(function (result) {
                            id = result.getValue(busqueda.columns[0]);
                            log.debug('ID', id);
                            // idItem = search.lookupFields({
                            //     type: 'serializedinventoryitem',
                            //     id: id,
                            //     columns: ['custitem_ht_at_articulocomercialrela']
                            // });
                            // log.debug('Debug', idItem);
                            // itemventalq = items,
                            //     items = (idItem.custitem_ht_at_articulocomercialrela)[0].value;
                            // itemsText = (idItem.custitem_ht_at_articulocomercialrela)[0].text;
                        });
                    }

                    json = {
                        serviceOrder: idOs.toString(),
                        customer: customer.toString(),
                        vehiculo: vehiculo,
                        item: items,
                        // itemventalq: itemventalq,
                        // displayname: itemsText,
                        ordenServicio: ordenServicio
                    }

                    log.debug('JSON', json);

                    const plFunctions = plugin.loadImplementation({ type: 'customscript_ts_pl_functions' });
                    let workOrder = plFunctions.plGenerateOT(json);
                    log.debug('OT ', workOrder);
                }

                if (objRecord.getValue('custbody_ht_os_issue_invoice') == true) {
                    let invoice = _controller.createInvoice(objRecord.id);
                    log.debug('Invoice', invoice);
                }

            } catch (error) {
                log.error('Error-afterSubmit', error);
            }
        }
    }


    return {
        beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
