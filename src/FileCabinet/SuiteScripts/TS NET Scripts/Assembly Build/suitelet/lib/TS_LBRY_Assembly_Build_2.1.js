/**
 *@NApiVersion 2.1
*/
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/query', 'N/file'], (serverWidget, search, url, query, file) => {

    class Parameters {
        constructor({ item, workorder, salesorder, customer, location, subsidiary }) {
            this.item = item;
            this.workorder = workorder;
            this.salesorder = salesorder;
            this.customer = customer;
            //this.assemblyitem = assemblyitem;
            //this.billofmaterials = billofmaterials;
            //this.billofmaterialsrev = billofmaterialsrev;
            this.location = location;
            this.subsidiary = subsidiary;
        }
    }

    class Constant {
        constructor() {
            this.EMPTY_SELECT_VALUE = "";
            this.ECUADOR_SUBSIDIARY = 2;
            this.INVENTORY_DETAIL_CSS_PATH = './TS_CSS_Inventory_Detail.css';
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
                ["field", "item", "custpage_f_item", "Producto de Inventario"],
                ["field", "assemblyitem", "custpage_f_assemblyitem", "Producto de Ensamble"],
                ["field", "billofmaterials", "custpage_f_billofmaterials", "Lista de Materiales"],
                ["field", "billofmaterialsrev", "custpage_f_billofmaterialsrev", "Lista de Materiales de Revisión"],
                ["field", "location", "custpage_f_location", "Ubicación"],
                ["field", "date", "custpage_f_date", "Fecha"],
                ["field", "subsidiary", "custpage_f_subsidiary", "Subsidiaria"],
                ["field", "inventorydetail", "custpage_f_inventorydetail", "Inventory Detail"],

                ["field", "datostecnicos", "custpage_field_datos_tecnicos", "Datos Técnicos"],
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

        setComponentsSublistData = (componentsSublistField, billOfMaterialRevisionSelected, locationSelected, itemSelected) => {
            log.error("setComponentsSublistData", { billOfMaterialRevisionSelected, locationSelected });
            if (!(billOfMaterialRevisionSelected && locationSelected)) return;
            let line = 0;
            let sql_1 = "SELECT i.id, i.fullname, i.custitem_ht_ai_tipocomponente as type, i.displayname, ail.quantityavailable, ut.abbreviation, ibq.onHandAvail, b.binNumber, b.custrecord_deposito_para_alquiler as alquiler " +
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
                `ON (ibq.bin = b.id AND b.location = '${locationSelected}' AND b.custrecord_deposito_para_alquiler = 'T') ` +
                `WHERE br.id = '${billOfMaterialRevisionSelected}' AND ail.location = '${locationSelected}' AND i.custitem_ht_ai_tipocomponente IN ('1', '3')`;

            let alquilerResult = query.runSuiteQL({ query: sql_1 }).asMappedResults();
            log.error("sql_1", sql_1);
            log.error("sql_1_alquilerResult", alquilerResult);
            if (alquilerResult.length != 0) {
                for (let i = 0; i < alquilerResult.length; i++) {
                    if (alquilerResult[i].id) componentsSublistField.setSublistValue('custpage_slf_componentid', line, alquilerResult[i].id);
                    if (alquilerResult[i].id) componentsSublistField.setSublistValue('custpage_slf_component', line, `${alquilerResult[i].fullname} ${alquilerResult[i].displayname}`);
                    componentsSublistField.setSublistValue('custpage_slf_onhand', line, alquilerResult[i].onhandavail);
                    componentsSublistField.setSublistValue('custpage_slf_quantity', line, 0);
                    if (!alquilerResult[i].onHandAvail) {
                        let text = `<a id="compinvdet_popup_${line + 1}" class="smalltextul  i_inventorydetailneeded" href="#" onclick="viewInventoryDetail(this, ${line})" role="button"></a>`;
                        componentsSublistField.setSublistValue('custpage_slf_inventorydetail', line, text);
                    }
                    if (alquilerResult[i].abbreviation) componentsSublistField.setSublistValue('custpage_slf_units', line, alquilerResult[i].abbreviation);
                    if (alquilerResult[i].binnumber) componentsSublistField.setSublistValue('custpage_slf_bin', line, alquilerResult[i].binnumber);
                    if (alquilerResult[i].type) componentsSublistField.setSublistValue('custpage_slf_type', line, alquilerResult[i].type);
                    //let isAlquiler = alquilerResult[i].displayname.toLowerCase().indexOf('alqu') > -1 ? 'T' : 'F';
                    componentsSublistField.setSublistValue('custpage_slf_alquiler', line, 'T');
                    line++;
                }
            }
            //  }

            //Inicio Edwin
            let binnumber = '';
            let filters = [["location","anyof",locationSelected], "AND", ["custrecord_deposito_para_bodega_comercia","is","T"]];
            let binSearchObj = search.create({
                type: "bin",
                filters,
                columns: ["binnumber"]
            }).run().getRange(0, 1);

            for (let i = 0; i < binSearchObj.length; i++) {
                let columns = binSearchObj[i].columns;
                binnumber = binSearchObj[i].getValue(columns[0]);
                log.error("binnumber", binnumber);
            }
            //Fin Edwin

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
                `ON (ibq.bin = b.id AND b.location = '${locationSelected}' AND b.binNumber = '${binnumber}') ` +
                `WHERE br.id = '${billOfMaterialRevisionSelected}' AND ail.location = '${locationSelected}'`;

            let queryResult = query.runSuiteQL({ query: sql }).asMappedResults();
            log.error("sql", sql);
            log.error("sql_1_queryResult", queryResult);
            if (queryResult.length != 0) {
                for (let i = 0; i < queryResult.length; i++) {
                    if (queryResult[i].id) componentsSublistField.setSublistValue('custpage_slf_componentid', line, queryResult[i].id);
                    if (queryResult[i].id) componentsSublistField.setSublistValue('custpage_slf_component', line, `${queryResult[i].fullname} ${queryResult[i].displayname}`);
                    componentsSublistField.setSublistValue('custpage_slf_quantity', line, queryResult[i].bomquantity);
                    if (queryResult[i].onhandavail) { //queryResult[i].quantityonhand    //onhandavail
                        componentsSublistField.setSublistValue('custpage_slf_onhand', line, queryResult[i].onhandavail); //queryResult[i].quantityonhand    //onhandavail
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

        setBillOfMaterialsAndAssemblyItemFieldData = (billOfMaterialsField, assemblyItemField, serviceItemSelected) => {
            log.error("setBillOfMaterialsAndAssemblyItemFieldData", serviceItemSelected);

            if (!serviceItemSelected) return;
            let filters = [["isinactive", "is", "F"], "AND", ["custrecord_ht_articulo_alquiler", "anyof", serviceItemSelected]];
            let bomResultSearch = search.create({
                type: "bom",
                filters,
                columns: ["assemblyitem.assembly"]
            }).run().getRange(0, 1);
            log.error("bomResultSearch.length", bomResultSearch.length);
            for (let i = 0; i < bomResultSearch.length; i++) {
                let columns = bomResultSearch[i].columns;
                let billOfMaterials = bomResultSearch[i].id;
                let assemblyItem = bomResultSearch[i].getValue(columns[0]);
                billOfMaterialsField.setDefaultValue(billOfMaterials);
                assemblyItemField.setDefaultValue(assemblyItem);
            }
        }

        setBillOfMaterialsRevisionFieldData = (billOfMaterialsRevisionField, itemSelected) => {
            log.error("setBillOfMaterialsRevisionFieldData", { itemSelected });
            if (!itemSelected) return;
            let filters = [["isinactive", "is", "F"], "AND", ["custrecord_ht_articulo_alquileractivo", "anyof", itemSelected]];
            let bomRevisionResultSearch = search.create({ type: "bomrevision", filters, columns: ["name"] }).run().getRange(0, 1);
            for (let i = 0; i < bomRevisionResultSearch.length; i++) {
                let billOfMaterialRevision = bomRevisionResultSearch[i].id;
                billOfMaterialsRevisionField.setDefaultValue(billOfMaterialRevision);
            }
        }

        createForm = (formName) => {
            return new Form(serverWidget.createForm(formName));
        }

        getFormattedParameters = () => {
            this.PARAMETERS.item = this.PARAMETERS.item || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.workorder = this.PARAMETERS.workorder || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.salesorder = this.PARAMETERS.salesorder || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.customer = this.PARAMETERS.customer || this.CONSTANT.EMPTY_SELECT_VALUE;
            //this.PARAMETERS.billofmaterials = this.PARAMETERS.billofmaterials || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.billofmaterialsrev = this.PARAMETERS.billofmaterialsrev || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.location = this.PARAMETERS.location || this.CONSTANT.EMPTY_SELECT_VALUE;
            this.PARAMETERS.subsidiary = this.PARAMETERS.subsidiary || this.CONSTANT.ECUADOR_SUBSIDIARY;
            log.error("getFormattedParameters", this.PARAMETERS);
            return this.PARAMETERS;
        }

        getInventoryDetailCSS = () => {
            try {
                let inventoryDetailCss = file.load({ id: this.CONSTANT.INVENTORY_DETAIL_CSS_PATH });
                return inventoryDetailCss.getContents();
            } catch (error) {
                log.error("error", error)
                return "";
            }
        }
    }

    return {
        Parameters,
        UserInterface
    }
})