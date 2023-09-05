/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message', 'N/url', 'N/record'], (search, currentRecord, message, url, record) => {
    let typeMode = '';

    const pageInit = (context) => {
        typeMode = context.mode; //!Importante, no borrar.
    }

    const fieldChanged = (context) => {
        console.log('entraaaaaa');
        const objRecord = currentRecord.get();
        console.log('objRecord', objRecord);
        console.log('typeMode', typeMode);
        /* var form = context.form;
        var currentRecord = context.newRecord;
        const idRecord = currentRecord.id;
        let objRecord = record.load({ type: 'customrecord_ht_record_detallechasersim', id: idRecord, isDynamic: true }); */
        let idSimCard = objRecord.getValue('custrecord_ht_ds_simcard');
        console.log('idSimCard', idSimCard);
        let item = getInventoryItem(idSimCard);
        console.log('item', item);
        //objRecord.setValue('custrecord_ht_ds_serie',item)

        //var type_event = context.type;

    }

    function getInventoryItem(idSimCard) {
        try {
            var arrCustomerId = new Array();
            var busqueda = search.create({
                type: "inventorynumber",
                filters:
                    [
                        ["item.internalid", "anyof", idSimCard],
                        "AND",
                        ["isonhand", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "inventorynumber",
                            sort: search.Sort.ASC,
                            label: "Number"
                        }),
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "memo", label: "Memo" }),
                        search.createColumn({ name: "location", label: "Location" }),
                        search.createColumn({ name: "quantityonhand", label: "On Hand" }),
                        search.createColumn({ name: "quantityavailable", label: "Available" }),
                        search.createColumn({ name: "quantityonorder", label: "On Order" }),
                        search.createColumn({ name: "isonhand", label: "Is On Hand" }),
                        search.createColumn({ name: "quantityintransit", label: "In Transit" }),
                        search.createColumn({ name: "datecreated", label: "Date Created" })
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
                    var arrCustomer = new Array();
                    //0. Internal id match
                    if (result.getValue(columns[0]) != null)
                        arrCustomer[0] = result.getValue(columns[0]);
                    else
                        arrCustomer[0] = '';
                    arrCustomerId.push(arrCustomer);
                });
            });
            return arrCustomerId;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 26/01/2023
Author: Jeferson Mejia
Description: Creación del script.
===================================================================================================================*/