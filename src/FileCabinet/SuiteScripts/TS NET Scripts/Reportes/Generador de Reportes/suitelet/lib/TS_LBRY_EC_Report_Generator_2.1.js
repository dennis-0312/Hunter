/**
 *@NApiVersion 2.1
*/
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/query', 'N/file', 'N/log'], (serverWidget, search, url, query, file, log) => {

    class Parameters {
        constructor({ item, workorder, salesorder, customer, location, subsidiary }) {
            this.item = item;
            this.workorder = workorder,
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

        addField = (id, type, label, source = null) => {
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
        //<I> rhuaccha: 2024-02-24
        addFormatField = (id, type, label, container = null, source = null) => {
            if (type === serverWidget.FieldType.SELECT) {
                const field = new Field(this.form.addField({
                    id,
                    type: serverWidget.FieldType.SELECT,
                    label,
                    source,
                    container
                }));
                const options = [
                    { value: "XLSX", text: "EXCEL" },
                    { value: "XML", text: "XML" },
                    { value: "XLSX_V", text: "VENTAS" }
                ];
                for (const item of options) {
                    field.addSelectOption(item.value, item.text);
                }
            }
        }
        //<F> rhuaccha: 2024-02-24
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
                ["form", "main", "", "EC - Generador de Reportes"],
                ["fieldgroup", "primary", "cuspage_fg_primary", "Información Principal"],
                ["fieldgroup", "filters", "cuspage_fg_filters", "Filtros"],
                ["field", "report", "custpage_f_report", "Reporte"],
                ["field", "format", "custpage_f_format", "Formato"],
                ["field", "startdate", "custpage_f_startdate", "Fecha Inicio"],
                ["field", "enddate", "custpage_f_enddate", "Fecha Fin"],
                ["field", "period", "custpage_f_period", "Periodo"],
                ["field", "subsidiary", "custpage_f_subsidiary", "Subsidiaria"],
                ["sublist", "results", "custpage_sl_results", "Resultados"],
                ["sublistfield", "id", "custpage_slf_id", "Id"],
                ["sublistfield", "datecreated", "custpage_slf_datecreated", "Fecha de Creación"],
                ["sublistfield", "createdby", "custpage_slf_createdby", "Generado Por"],
                ["sublistfield", "subsidiary", "custpage_slf_subsidiary", "Subsidiaria"],
                ["sublistfield", "period", "custpage_slf_period", "Periodo"],
                ["sublistfield", "report", "custpage_slf_report", "Reporte"],
                ["sublistfield", "filename", "custpage_slf_filename", "Archivo"],
                ["sublistfield", "url", "custpage_slf_url", " "],
                ["button", "submit", "", "Generar"]
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

        setResultSubListData = (resultSubList) => {
            let searchResult = search.create({
                type: "customrecord_ts_ec_rpt_generator_log",
                filters: [],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        sort: search.Sort.DESC,
                        label: "ID"
                    }),
                    search.createColumn({ name: "created", label: "Date Created" }),
                    search.createColumn({ name: "custrecord_ts_ec_log_rpt_gen_subsidiaria", label: "Subsidiaria" }),
                    search.createColumn({ name: "custrecord_ts_ec_log_rpt_gen_periodo", label: "Periodo" }),
                    search.createColumn({ name: "custrecord_ts_ec_log_rpt_gen_url", label: "URL" }),
                    search.createColumn({ name: "custrecord_ts_ec_log_rpt_gen_report", label: "Reporte" }),
                    search.createColumn({ name: "entityid", join: "owner", label: "Name" }),
                    search.createColumn({ name: "custrecord_ts_ec_log_rpt_gen_libro_legal", label: "Libro Legal" })

                ]
            });

            let line = 0;
            searchResult.run().each(function (result) {
                let columns = result.columns;
                let id = result.id;
                let created = result.getValue(columns[1]) || "";
                let subsidiary = result.getText(columns[2]) || "";
                let period = result.getText(columns[3]) || "";
                let url = result.getValue(columns[4]) || "";
                let report = result.getValue(columns[5]) || "";
                let owner = result.getValue(columns[6]) || "";
                let fileName = result.getValue(columns[7]) || "";


                resultSubList.setSublistValue("custpage_slf_id", line, id)
                if (created) resultSubList.setSublistValue("custpage_slf_datecreated", line, created);
                if (owner) resultSubList.setSublistValue("custpage_slf_createdby", line, owner);
                if (subsidiary) resultSubList.setSublistValue("custpage_slf_subsidiary", line, subsidiary);
                if (period) resultSubList.setSublistValue("custpage_slf_period", line, period);
                if (report) resultSubList.setSublistValue("custpage_slf_report", line, report);
                if (fileName) resultSubList.setSublistValue("custpage_slf_filename", line, fileName);
                if (url) {
                    let link = `<a target="_blank" href="${url}" download>Descargar</a>`;
                    resultSubList.setSublistValue("custpage_slf_url", line, link);
                }

                line++;
                return true;
            });

        }

        createForm = (formName) => {
            return new Form(serverWidget.createForm(formName));
        }

        getFormattedParameters = () => {

        }

    }

    return {
        Parameters,
        UserInterface
    };

})