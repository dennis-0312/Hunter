/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/log',
    'N/config',
    'N/url',
    'N/task',
    'N/redirect',
    './lib/TS_LBRY_Assembly_Build_2.1.js'
], (serverWidget, log, config, url, task, redirect, library) => {

    const onRequest = (context) => {
        try {
            var method = context.request.method;
            let userInterface = new library.UserInterface(context.request.parameters);
            const FIELDS = userInterface.FIELDS;
            if (method == 'GET') {

                const PARAMETERS = userInterface.getFormattedParameters();
                log.error("parameters Q", PARAMETERS);

                let inventoryDetailStyle = userInterface.getInventoryDetailCSS();
                log.error("inventoryDetailStyle", inventoryDetailStyle);
                let form = userInterface.createForm(FIELDS.form.main.text);
                let inlineHtmlField = form.addField(FIELDS.field.inlinehtml.id, serverWidget.FieldType.INLINEHTML, FIELDS.field.inlinehtml.text);
                inlineHtmlField.setDefaultValue('<script>' + viewInventoryDetail + '</script><style>' + inventoryDetailStyle + '</style>');

                userInterface.init();
                form.setClientScript("../TS_CS_Assembly_Build_2.1.js")

                form.addFieldGroup(FIELDS.fieldgroup.primary.id, FIELDS.fieldgroup.primary.text);
                let customerField = form.addField(FIELDS.field.customer.id, serverWidget.FieldType.SELECT, FIELDS.field.customer.text, FIELDS.fieldgroup.primary.id, 'customer');
                customerField.setDefaultValue(PARAMETERS.customer);
                customerField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                let workOrderField = form.addField(FIELDS.field.workorder.id, serverWidget.FieldType.SELECT, FIELDS.field.workorder.text, FIELDS.fieldgroup.primary.id, 'customrecord_ht_record_ordentrabajo');
                workOrderField.setDefaultValue(PARAMETERS.workorder);
                workOrderField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                let salesOrderField = form.addField(FIELDS.field.salesorder.id, serverWidget.FieldType.SELECT, FIELDS.field.salesorder.text, FIELDS.fieldgroup.primary.id, 'salesorder');
                salesOrderField.setDefaultValue(PARAMETERS.salesorder);
                salesOrderField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                let itemField = form.addField(FIELDS.field.item.id, serverWidget.FieldType.SELECT, FIELDS.field.item.text, FIELDS.fieldgroup.primary.id, 'item');
                itemField.setDefaultValue(PARAMETERS.item);
                itemField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                //let assemblyItemField = form.addField(FIELDS.field.assemblyitem.id, serverWidget.FieldType.SELECT, FIELDS.field.assemblyitem.text, FIELDS.fieldgroup.primary.id, 'item');
                //assemblyItemField.setDefaultValue(PARAMETERS.item);
                //assemblyItemField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                //let billOfMaterialsField = form.addField(FIELDS.field.billofmaterials.id, serverWidget.FieldType.SELECT, FIELDS.field.billofmaterials.text, FIELDS.fieldgroup.primary.id, 'bom');
                //userInterface.setBillOfMaterialsAndAssemblyItemFieldData(billOfMaterialsField, assemblyItemField, itemField.getDefaultValue());
                //billOfMaterialsField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                let billOfMaterialRevisionField = form.addField(FIELDS.field.billofmaterialsrev.id, serverWidget.FieldType.SELECT, FIELDS.field.billofmaterialsrev.text, FIELDS.fieldgroup.primary.id, 'bomrevision');
                userInterface.setBillOfMaterialsRevisionFieldData(billOfMaterialRevisionField, itemField.getDefaultValue());
                billOfMaterialRevisionField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                form.addFieldGroup(FIELDS.fieldgroup.classification.id, FIELDS.fieldgroup.classification.text);

                let subsidiaryField = form.addField(FIELDS.field.subsidiary.id, serverWidget.FieldType.SELECT, FIELDS.field.subsidiary.text, FIELDS.fieldgroup.classification.id, 'subsidiary');
                subsidiaryField.setDefaultValue(PARAMETERS.subsidiary);
                subsidiaryField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                let locationField = form.addField(FIELDS.field.location.id, serverWidget.FieldType.SELECT, FIELDS.field.location.text, FIELDS.fieldgroup.classification.id, 'location');
                locationField.setDefaultValue(PARAMETERS.location);
                locationField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

                let inventoryDetailField = form.addField(FIELDS.field.inventorydetail.id, serverWidget.FieldType.LONGTEXT, FIELDS.field.inventorydetail.text, FIELDS.fieldgroup.classification.id);
                inventoryDetailField.setDefaultValue("{}");
                inventoryDetailField.updateDisplayType(serverWidget.FieldDisplayType.NODISPLAY);

                form.addSubtab(FIELDS.subtab.components.id, FIELDS.subtab.components.text);
                let componentSubList = form.addSublist(FIELDS.sublist.components.id, serverWidget.SublistType.LIST, FIELDS.sublist.components.text, FIELDS.subtab.components.id);
                componentSubList.addSublistField(FIELDS.sublistfield.componentid.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.componentid.text);
                let typeSubListField = componentSubList.addSublistField(FIELDS.sublistfield.type.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.type.text);
                typeSubListField.updateDisplayType(serverWidget.FieldDisplayType.HIDDEN);
                componentSubList.addSublistField(FIELDS.sublistfield.component.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.component.text);
                let quantitySubListField = componentSubList.addSublistField(FIELDS.sublistfield.quantity.id, serverWidget.FieldType.INTEGER, FIELDS.sublistfield.quantity.text);
                quantitySubListField.updateDisplayType(serverWidget.FieldDisplayType.ENTRY);
                componentSubList.addSublistField(FIELDS.sublistfield.onhand.id, serverWidget.FieldType.INTEGER, FIELDS.sublistfield.onhand.text);
                componentSubList.addSublistField(FIELDS.sublistfield.units.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.units.text);
                componentSubList.addSublistField(FIELDS.sublistfield.bin.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.bin.text);
                let alquilerField = componentSubList.addSublistField(FIELDS.sublistfield.alquiler.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.alquiler.text);
                alquilerField.updateDisplayType(serverWidget.FieldDisplayType.HIDDEN);
                componentSubList.addSublistField(FIELDS.sublistfield.inventorydetail.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.inventorydetail.text);

                userInterface.setComponentsSublistData(componentSubList, billOfMaterialRevisionField.getDefaultValue(), locationField.getDefaultValue());

                form.addSubmitButton(FIELDS.button.submit.text);

                context.response.writePage(form.form);

            } else if (method == 'POST') {
                let inventoryDetail = JSON.parse(context.request.parameters.custpage_f_inventorydetail);
                log.error("inventoryDetail", inventoryDetail);
                let { comercialData, alquilerData } = getSublistData(context.request.parameters.custpage_sl_componentsdata, inventoryDetail);
                log.error("comercialData", comercialData);
                let parameters = getParametersForSchedule(context.request.parameters, comercialData, alquilerData);
                log.error("parameters", parameters);
                taskSchedule(parameters)

                redirect.toRecord({
                    type: "customrecord_ht_record_ordentrabajo",
                    id: context.request.parameters.custpage_f_workorder
                });
            }

        } catch (error) {
            log.error("error", error);
            context.response.writePage(error);
        }
    }

    const getParametersForSchedule = (parameters, comercialData, alquilerData) => {
        let scriptParameters = {};
        scriptParameters.custscript_ts_ss_buil_inv_adj_alquiler = alquilerData;
        scriptParameters.custscript_ts_ss_buil_inv_adj_comercial = comercialData;
        scriptParameters.custscript_ts_ss_buil_inv_adj_customer = parameters.custpage_f_customer || "";
        scriptParameters.custscript_ts_ss_buil_inv_adj_location = parameters.custpage_f_location || "";
        scriptParameters.custscript_ts_ss_buil_inv_adj_item = parameters.custpage_f_item || "";
        scriptParameters.custscript_ts_ss_buil_inv_adj_workorder = parameters.custpage_f_workorder || "";
        scriptParameters.custscript_ts_ss_buil_inv_adj_salesorder = parameters.custpage_f_salesorder || "";

        return scriptParameters;
    }

    const getSublistData = (sublistData, inventoryDetail) => {
        let comercialData = [], alquilerData = [];
        try {
            const breakLine = /\u0002/;
            const breakColumns = /\u0001/;
            //{"10936":{"8054":{"serial":"8054","deposit":"4","state":"1","quantity":1}}
            log.error("sublistData", sublistData);
            let lines = sublistData.split(breakLine);
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].split(breakColumns);
                let id = line[0];
                let type = line[1];
                let quantity = line[3];
                let bin = line[6];
                let alquiler = line[7];

                log.error(i, inventoryDetail[i]);
                if (inventoryDetail[i] === undefined) continue;
                let length = Object.keys(inventoryDetail[i]).length;
                if (length <= 0) continue;
                let detail = { id, type, seriales: [] };

                for (let serialId in inventoryDetail[i]) {
                    detail.seriales.push(inventoryDetail[i][serialId]);
                }

                if (type == 1 && alquiler) {
                    alquilerData.push(detail);
                } else {
                    comercialData.push(detail);
                }
            }
        } catch (error) {
            log.error("An error was found in [getSublistData] function", error);
        }
        return { alquilerData, comercialData };
    }

    const taskSchedule = (params) => {
        let scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_ts_ss_build_inventory_adjus',
            deploymentId: 'customdeploy_ts_ss_build_inventory_adjus',
            params
        });
        var scriptTaskId = scriptTask.submit();
    }

    function viewInventoryDetail(element, line) {
        console.log(element, line);
        require(['N/currentRecord', 'N/url'], (currentRecord, url) => {
            currentRecord = currentRecord.get();

            const execute = () => {
                let parameters = getParameters(line);
                if (parameters.quantity <= 0) {
                    alert("Ingrese una cantidad mayor a 0 para el artículo");
                    return;
                }

                if (validateUniqueItemType(parameters)) {
                    alert("Solo se puede seleccionar un tipo de item para el ensamble de alquiler");
                    currentRecord.setSublistValue('custpage_sl_components', 'custpage_slf_quantity', line, 0);
                    return;
                }

                let inventoryDetailUrl = getInventoryDetailUrl(parameters);
                openWindow(inventoryDetailUrl);
            }

            const getParameters = (line) => {
                let item = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_componentid', line);
                let itemName = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_component', line);
                let quantity = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_quantity', line);
                let units = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_units', line);
                let type = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_type', line);
                let location = currentRecord.getValue('custpage_f_location');
                return { item, itemName, quantity, units, location, row: line, elementId: element.id, type };
            }

            const getInventoryDetailUrl = (params) => {
                let inventoryDetailUrl = url.resolveScript({
                    scriptId: "customscript_ts_ui_inventory_detail_form",
                    deploymentId: "customdeploy_ts_ui_inventory_detail_form",
                    params
                });
                return inventoryDetailUrl;
            }

            const openWindow = (inventoryDetailUrl) => {
                let customWindow = window.open(inventoryDetailUrl, 'Detalle de Inventario', 'toolbar=no,location=no,width=1000,height=600');
            }

            const validateUniqueItemType = (parameters) => {
                console.log('validateUniqueItemType')
                let inventoryDetail = JSON.parse(currentRecord.getValue('custpage_f_inventorydetail'));
                console.log(inventoryDetail);
                let rows = currentRecord.getLineCount('custpage_sl_components');
                let itemType = {};
                for (let row = 0; row < rows; row++) {
                    let item = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_componentid', row);
                    let type = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_type', row);
                    itemType[row] = { item, type };
                }
                console.log(itemType);
                let selectedItem = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_componentid', line);
                let selectedItemType = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_type', line);
                for (let rowId in inventoryDetail) {
                    console.log(rowId);
                    if (itemType[rowId].type == selectedItemType && itemType[rowId].item != selectedItem)
                        return true;
                }
                return false;
            }

            execute();
        })
    }

    return {
        onRequest
    };
})