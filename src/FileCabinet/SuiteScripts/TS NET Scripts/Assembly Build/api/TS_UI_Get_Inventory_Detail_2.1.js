/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/log',
    'N/config',
], (serverWidget, search, log, config) => {

    const onRequest = (context) => {
        let method = context.request.method;
        try {

            if (method == 'GET') {
                let location = context.request.parameters.location;
                let item = context.request.parameters.item;
                let inventoryDetail = getInventoryDetail(item, location);

                let form = serverWidget.createForm("Detalle de Inventario");
                this.form.clientScriptModulePath = './TS_CS_Inventory_Detail_2.1.js';

                form.addButton({
                    id: 'custpage_b_cancel',
                    label: 'Cancelar',
                    functionName: 'cancel'
                });

                let itemField = form.addField({
                    id: 'custpage_f_item',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Articulo'
                });

                let descriptionField = form.addField({
                    id: 'custpage_f_description',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Descripción'
                });

                let quantityField = form.addField({
                    id: 'custpage_f_quantity',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Cantidad'
                });

                let unitsField = form.addField({
                    id: 'custpage_f_units',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Unidades'
                });

                let inventoryDetailSubList = form.addSublist({
                    id: 'custpage_sl_inventorydetail',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Detalle de Inventario'
                });

                inventoryDetailSubList.addField({
                    id: 'custpage_slf_serial',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Número de Serie/Lote'
                });

                inventoryDetailSubList.addField({
                    id: 'custpage_slf_deposit',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Depósito'
                });

                inventoryDetailSubList.addField({
                    id: 'custpage_slf_state',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Estado'
                });

                inventoryDetailSubList.addField({
                    id: 'custpage_slf_quantity',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Cantidad'
                });

                form.addSubmitButton("Guardar");

                context.response.writePage(form);
            }

        } catch (error) {
            log.error("error", error);
        }
    }

    const getInventoryDetail = (item, location) => {
        if (!(item && location)) return;
        let inventoryDetailResult = {};
        let inventoryDetailSearch = search.create({
            type: "inventorydetail",
            filters: [
                ["location", "anyof", location],
                "AND",
                ["item", "anyof", item]
            ],
            columns: [
                search.createColumn({ name: "inventorynumber", label: " Number" }),
                search.createColumn({ name: "binnumber", label: "Bin Number" }),
                search.createColumn({ name: "status", label: "Status" }),
                search.createColumn({ name: "quantity", label: "Quantity" })
            ]
        });
        inventoryDetailSearch.run().each(function (result) {
            let inventoryNumberId = result.getValue('inventorynumber');
            let inventoryNumber = result.getText('inventorynumber');
            let binNumberId = result.getValue('binnumber');
            let binNumber = result.getText('binnumber');
            let status = result.getText('status');
            let statusId = result.getValue('status');

            inventoryDetailResult[inventoryNumberId] = {
                inventoryNumber,
                binNumber,
                binNumberId,
                status,
                statusId
            };
            return true;
        });

        return inventoryDetailResult;
    }

    return {
        onRequest
    }
})