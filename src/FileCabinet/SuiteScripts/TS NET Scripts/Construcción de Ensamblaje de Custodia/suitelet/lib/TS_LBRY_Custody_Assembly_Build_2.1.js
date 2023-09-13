/**
 *@NApiVersion 2.1
*/
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/query', 'N/file'], (serverWidget, search, url, query, file) => {

    class Parameters {
        constructor({ item, workorder, salesorder, customer, location, subsidiary, relateditem }) {
            this.relateditem = relateditem;
            this.item = item;
            this.workorder = workorder;
            this.salesorder = salesorder;
            this.customer = customer;
            this.location = location;
            this.subsidiary = subsidiary;
        }
    }

    class Constant {
        constructor() {
            this.EMPTY_SELECT_VALUE = "";
            this.ECUADOR_SUBSIDIARY = 2;
            this.PAGE_SIZE = 500;
        }
    }

    class Field {
        constructor(field) {
            this.field = field;
        }

        addSelectOption = (value, text, isSelected = null) => {
            this.field.addSelectOption({
                value,
                text,
                isSelected
            });
        }

        updateDisplayType = (displayType) => {
            return this.field.updateDisplayType({ displayType });
        }

        setIsMandatory = (value) => {
            this.field.isMandatory = true;
        }

        setDefaultValue = (value) => {
            this.field.defaultValue = value;
        }

        getDefaultValue = () => {
            return this.field.defaultValue;
        }
    }

    class SubList {
        constructor(sublist) {
            this.sublist = sublist;
        }

        addSublistField = (id, type, label, source = null) => {
            return new Field(this.sublist.addField({
                id,
                type,
                label,
                source
            }));
        }

        setSublistValue = (id, line, value) => {
            this.sublist.setSublistValue({
                id,
                line,
                value
            });
        }

        addRefreshButton = () => {
            this.sublist.addRefreshButton();
        }
    }

    class Form {
        constructor(form) {
            this.form = form;
        }

        addField = (id, type, label, container = null, source = null) => {
            return new Field(this.form.addField({
                id,
                type,
                label,
                source,
                container
            }))
        }

        addFieldGroup = (id, label) => {
            return this.form.addFieldGroup({
                id,
                label
            });
        }

        addSublist = (id, type, label, tab = null) => {
            return new SubList(this.form.addSublist({
                id,
                type,
                label,
                tab
            }));
        }

        addSubtab = (id, label, tab = null) => {
            return this.form.addSubtab({
                id,
                label,
                tab
            });
        }

        addSubmitButton = (name) => {
            this.form.addSubmitButton(name);
        }

        setClientScript = (clientScriptModulePath) => {
            this.form.clientScriptModulePath = clientScriptModulePath;
        }
    }

    class UserInterface {
        constructor(parameters) {
            this.PARAMETERS = new Parameters(parameters);
            this.FIELDS = this.getFormFields();
            this.CONSTANT = new Constant();
        }

        init = () => {
            log.error("Start", "init");
        }

        getFieldsData = () => {
            return [
                ["form", "main", "", "Construccion de Ensamblaje"],
                ["fieldgroup", "primary", "cuspage_fg_primary", "Información Principal"],
                ["fieldgroup", "classification", "cuspage_fg_classification", "Segmentación"],
                ["field", "inlinehtml", "custpage_f_inlinehtml", " "],
                ["field", "workorder", "custpage_f_workorder", "HT Orden de Trabajo"],
                ["field", "salesorder", "custpage_f_salesorder", "Orden de Servicio"],
                ["field", "customer", "custpage_f_customer", "Cliente"],
                ["field", "salesitem", "custpage_f_salesitem", "Artículo de Venta"],
                ["field", "deviceitem", "custpage_f_deviceitem", "Artículo de Dispositivo"],
                ["field", "reinstallitem", "custpage_f_reinstallitem", "Artículo de Reinstalación"],
                ["field", "billofmaterials", "custpage_f_billofmaterials", "Lista de Materiales"],
                ["field", "billofmaterialsrev", "custpage_f_billofmaterialsrev", "Lista de Materiales de Revisión"],
                ["field", "location", "custpage_f_location", "Ubicación"],
                ["field", "date", "custpage_f_date", "Fecha"],
                ["field", "subsidiary", "custpage_f_subsidiary", "Subsidiaria"],
                ["field", "inventorynumber", "custpage_f_inventorynumber", "Numero de Serie/Inventario"],
                ["field", "inventorynumberid", "custpage_f_inventorynumberid", "Id Numero de Serie/Inventario"],
                ["field", "inventorydetail", "custpage_f_inventorydetail", "Inventory Detail"],
                ["subtab", "components", "custpage_st_components", "Componentes"],
                ["sublist", "components", "custpage_sl_components", "Componentes"],
                ["sublistfield", "componentid", "custpage_slf_componentid", "Id"],
                ["sublistfield", "type", "custpage_slf_type", "Type"],
                ["sublistfield", "component", "custpage_slf_component", "Componente"],
                ["sublistfield", "quantity", "custpage_slf_quantity", "Cantidad"],
                ["sublistfield", "onhand", "custpage_slf_onhand", "Cantidad Disponible"],
                ["sublistfield", "units", "custpage_slf_units", "Unidades"],
                ["sublistfield", "bin", "custpage_slf_bin", "Depósito"],
                ["sublistfield", "alquiler", "custpage_slf_alquiler", "Alquiler"],
                ["sublistfield", "inventorydetail", "custpage_slf_inventorydetail", "Detalle de Inventario"],
                ["button", "submit", "", "Procesar"]
            ];
        }

        getFormFields = () => {
            let formFields = {};
            let fieldsData = this.getFieldsData();
            for (let i = 0; i < fieldsData.length; i++) {
                let component = fieldsData[i][0];
                let field = fieldsData[i][1];
                let fieldId = fieldsData[i][2];
                let fieldLabel = fieldsData[i][3];
                if (formFields[component] === undefined) formFields[component] = {};
                if (formFields[component][field] === undefined) formFields[component][field] = {};
                formFields[component][field].id = fieldId;
                formFields[component][field].text = fieldLabel;
            }
            return formFields;
        }

        setComponentsSublistData = (componentsSublistField, billOfMaterialRevisionSelected, locationSelected) => {
            log.error("setComponentsSublistData", { billOfMaterialRevisionSelected, locationSelected });
            if (!(billOfMaterialRevisionSelected && locationSelected)) return;
            let line = 0;
            let sql = "SELECT i.id, i.fullname, i.custitem_ht_ai_tipocomponente as type, i.displayname, ail.quantityavailable, ail.quantityOnHand, ut.abbreviation, ibq.onHandAvail, b.binNumber, b.custrecord_deposito_para_alquiler as alquiler, brcm.bomQuantity " +
                "FROM bomRevision br " +
                "INNER JOIN bomRevisionComponentMember brcm " +
                "ON br.id = brcm.bomrevision " +
                "INNER JOIN item i " +
                "ON brcm.item = i.id " +
                "INNER JOIN aggregateItemLocation ail " +
                "ON i.id = ail.item " +
                "INNER JOIN unitsTypeUom as ut " +
                "ON brcm.units = ut.internalid " +
                "INNER JOIN itemBinQuantity ibq " +
                "ON i.id = ibq.item " +
                "INNER JOIN bin b " +
                `ON (ibq.bin = b.id AND b.location = '${locationSelected}' AND b.binNumber = 'BCO Comercial') ` +
                `WHERE br.id = '${billOfMaterialRevisionSelected}' AND ail.location = '${locationSelected}' AND i.custitem_ht_ai_tipocomponente NOT IN ('1', '3')`;
            log.error("sql", sql);
            let queryResult = query.runSuiteQL({
                query: sql
            }).asMappedResults();

            if (queryResult.length != 0) {
                for (let i = 0; i < queryResult.length; i++) {
                    if (queryResult[i].id) componentsSublistField.setSublistValue('custpage_slf_componentid', line, queryResult[i].id);
                    if (queryResult[i].id) componentsSublistField.setSublistValue('custpage_slf_component', line, `${queryResult[i].fullname} ${queryResult[i].displayname}`);
                    componentsSublistField.setSublistValue('custpage_slf_quantity', line, queryResult[i].bomquantity);
                    if (queryResult[i].quantityonhand) {
                        componentsSublistField.setSublistValue('custpage_slf_onhand', line, queryResult[i].quantityonhand);
                        let text = `<a id="compinvdet_popup_${line + 1}" class="smalltextul  i_inventorydetailneeded" href="#" onclick="viewInventoryDetail(this, ${line})" role="button"></a>`;
                        componentsSublistField.setSublistValue('custpage_slf_inventorydetail', line, text);
                    } else {
                        componentsSublistField.setSublistValue('custpage_slf_onhand', line, 0);
                    }
                    if (queryResult[i].abbreviation) componentsSublistField.setSublistValue('custpage_slf_units', line, queryResult[i].abbreviation);
                    if (queryResult[i].binnumber) componentsSublistField.setSublistValue('custpage_slf_bin', line, queryResult[i].binnumber);
                    if (queryResult[i].type) componentsSublistField.setSublistValue('custpage_slf_type', line, queryResult[i].type);
                    let isAlquiler = queryResult[i].displayname.toLowerCase().indexOf('alqu') > -1 ? 'T' : 'F';
                    componentsSublistField.setSublistValue('custpage_slf_alquiler', line, isAlquiler);

                    line++;
                }
            }
        }

        getBillOfMaterials = (salesItem) => {
            log.error("getBillOfMaterials", salesItem);

            if (!salesItem) return;
            let bomResultSearch = search.create({
                type: "bom",
                filters: [
                    ["assemblyitem.assembly", "anyof", salesItem]
                ],
                columns: [
                    search.createColumn({ name: "name", label: "Name" })
                ]
            }).run().getRange(0, 1);
            log.error("bomResultSearch.length", bomResultSearch.length);
            if (!bomResultSearch.length) return;
            return bomResultSearch[0].id;
        }

        setBillOfMaterialsRevisionFieldData = (billOfMaterialsRevisionField, itemSelected) => {
            log.error("setBillOfMaterialsRevisionFieldData", { itemSelected });

            if (!itemSelected) return;
            let filters = [["isinactive", "is", "F"], "AND", ["custrecord_ht_articulo_alquileractivo", "anyof", itemSelected]];
            let bomRevisionResultSearch = search.create({
                type: "bomrevision",
                filters,
                columns: ["name"]
            }).run().getRange(0, 1);

            for (let i = 0; i < bomRevisionResultSearch.length; i++) {
                let billOfMaterialRevision = bomRevisionResultSearch[i].id;
                billOfMaterialsRevisionField.setDefaultValue(billOfMaterialRevision);
            }
        }

        createForm = (formName) => {
            return new Form(serverWidget.createForm(formName));
        }

        getFormattedParameters = () => {
            log.error("getFormattedParameters BEFORE", this.PARAMETERS);

            this.PARAMETERS.item = this.PARAMETERS.item || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.relateditem = this.PARAMETERS.relateditem || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.workorder = this.PARAMETERS.workorder || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.salesorder = this.PARAMETERS.salesorder || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.customer = this.PARAMETERS.customer || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.location = this.PARAMETERS.location || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.subsidiary = this.PARAMETERS.subsidiary || this.CONSTANT.ECUADOR_SUBSIDIARY;

            log.error("getFormattedParameters", this.PARAMETERS);
            return this.PARAMETERS;
        }

        setInventoryNumber = (inventoryNumberField, salesOrder, reinstallitem) => {
            log.error("setInventoryNumber", { salesOrder, reinstallitem });
            if (!(salesOrder && reinstallitem)) return;

            let salesOrderResult = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ["type", "anyof", "SalesOrd"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["item", "anyof", reinstallitem],
                    "AND",
                    ["internalid", "anyof", salesOrder]
                ],
                columns: ["custcol_ts_dispositivo_en_custodia"]
            }).run().getRange(0, 1);
            if (!salesOrderResult.length) return;
            let inventoryNumber = salesOrderResult[0].getValue("custcol_ts_dispositivo_en_custodia") || "";
            inventoryNumberField.setDefaultValue(inventoryNumber);
        }

        setInventoryNumberId = (inventoryNumberIdField, location, deviceItem, inventoryNumber) => {
            log.error("setInventoryNumberId", { location, deviceItem, inventoryNumber });
            if (!(location && deviceItem && inventoryNumber)) return;
            let inventoryBalanceResult = search.create({
                type: "inventorybalance",
                filters: [
                    ["location", "anyof", location],
                    "AND",
                    ["item", "anyof", deviceItem],
                    "AND",
                    ["binnumber.custrecord_deposito_para_custodia", "is", "T"],
                    "AND",
                    ["inventorynumber.inventorynumber", "is", inventoryNumber]
                ],
                columns: ["inventorynumber"]
            }).run().getRange(0, 1);

            if (!inventoryBalanceResult.length) return;
            let inventoryNumberId = inventoryBalanceResult[0].getValue("inventorynumber") || "";
            log.error("inventoryNumberId", inventoryNumberId);

            inventoryNumberIdField.setDefaultValue(inventoryNumberId);
        }

        getLocationCustodia = (location) => {
            let locationSearch = search.create({
                type: "location",
                filters: [
                    ["custrecord_ht_ubicacion_padre", "anyof", "2"],
                    "AND",
                    ["custrecord_ht_ub_ubicacioncustodia", "is", "T"]
                ],
                columns: ["internalid"]
            }).run().getRange(0, 1);
            if (!locationSearch.length) return ""
            return locationSearch[0].getValue("internalid");
        }

        setDeviceItem = (deviceItemField, inventoryNumber) => {
            log.error("data", { inventoryNumber });
            if (!inventoryNumber) return;
            let custodiaResult = search.create({
                type: "customrecord_ht_record_custodia",
                filters: [["name", "is", inventoryNumber]],
                columns: ["custrecord_ht_ct_nombredispositivo"]
            }).run().getRange(0, 1);

            if (!custodiaResult.length) return;
            let deviceItem = custodiaResult[0].getValue('custrecord_ht_ct_nombredispositivo') || "";
            deviceItemField.setDefaultValue(deviceItem);
        }
    }

    return {
        Parameters,
        UserInterface
    }
})