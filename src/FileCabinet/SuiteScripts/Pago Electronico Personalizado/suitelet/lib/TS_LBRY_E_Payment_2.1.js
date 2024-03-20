/**
 *@NApiVersion 2.1
*/
define([
    'N/ui/serverWidget',
    'N/search',
    'N/url',
    'N/query',
    'N/file',
    'N/runtime'
], (serverWidget, search, url, query, file, runtime) => {
    const currentScript = runtime.getCurrentScript();

    class Parameters {
        constructor({ custpage_f_subsidiary, custpage_f_datefrom, custpage_f_dateto, custpage_f_location, custpage_f_entity,
            custpage_f_paymentmethod, custpage_f_emitidos, custpage_f_bankaccount, custpage_f_currency, custpage_f_page, custpage_f_paymentbatch, custpage_f_paymmentdate, custpage_f_file }) {
            this.deploymentid = currentScript.deploymentId;
            this.subsidiary = custpage_f_subsidiary;
            this.datefrom = custpage_f_datefrom;
            this.dateto = custpage_f_dateto;
            this.location = custpage_f_location;
            this.paymentmethod = custpage_f_paymentmethod;
            this.emitidos = custpage_f_emitidos;
            this.entity = custpage_f_entity;
            this.bankaccount = custpage_f_bankaccount;
            this.currency = custpage_f_currency;
            this.page = custpage_f_page || 0;
            this.paymentbatch = custpage_f_paymentbatch;
            this.file = custpage_f_file;

            // Separar por deploy
        }
    }

    class Constant {
        constructor() {
            this.EMPTY_SELECT_VALUE = "";
            this.PAGE_SIZE = 1000;
            this.PAGINATION_SIZE = 100;
            this.SELECT_SEPARATOR = "\u0005";
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

        updateDisplaySize = (height, width) => {
            return this.field.updateDisplaySize({ height, width })
        }

        updateLayoutType = (layoutType) => {
            return this.field.updateLayoutType({ layoutType })
        }

        setIsMandatory = (value) => {
            this.field.isMandatory = value;
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
            // log.error('setSublistValue', id + ' - ' + line + ' - ' + value)
            this.sublist.setSublistValue({
                id,
                line,
                value
            });
        }

        addRefreshButton = () => {
            this.sublist.addRefreshButton();
        }

        getLineCount = () => {
            return this.sublist.lineCount;
        }

        addMarkAllButtons = () => {
            this.sublist.addMarkAllButtons();

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


        addTab = (id, label) => {
            return this.form.addTab({
                id,
                label
            });
        }

        addButton = (id, label, functionName) => {
            return this.form.addButton({
                id,
                label,
                functionName
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
            this.FIELDS = this.getFormFields(this.PARAMETERS);
            this.CONSTANT = new Constant();
        }

        init = () => {
            log.error("Start", "init");
        }

        getFieldsData = (deploymentid) => {
            try {
                let selectAllHTML = '<input type="checkbox" class="uir-mark-all" onchange="custpage_sl_transactionsMarkAll(this.checked);return false; return false;">';
                //setEventCancelBubble(event); nlapiSelectLineItem('custpage_sl_transactions', 1); custpage_sl_transactionsSyncRow(1, true, false, 'custpage_slf_select'); custpage_sl_transactionsRecalcMachine(); nlapiFieldChanged('custpage_sl_transactions', 'custpage_slf_select', nlapiGetCurrentLineItemIndex('custpage_sl_transactions'), null); return true;
                let fieldData = {
                    customdeploy_ts_ui_e_payment_first: [
                        ["form", "main", "Generación de Pagos Electrónicos"],
                        ["fieldgroup", "filters", "Filtros"],
                        ["field", "subsidiary", "Subsidiaria"],
                        ["field", "entity", "Beneficiario"],
                        ["field", "datefrom", "Fecha Desde"],
                        ["field", "dateto", "Fecha Hasta"],
                        ["field", "location", "Oficina"],
                        ["field", "paymentmethod", "Forma de Pago"],
                        ["field", "emitidos", "Emitido"],

                        ["fieldgroup", "payment", "Programación de Pago"],
                        ["field", "bankaccount", "Cuenta Banco"],
                        ["field", "currency", "Moneda"],
                        ["field", "teftemplate", "Plantilla TEF"],
                        ["field", "paymentdate", "Fecha de Pago"],

                        ["tab", "transactions", "Transacciones"],
                        ["field", "page", "Indice de Pagina"],
                        ["field", "totalsummary", "Total Importe a Pagar"],

                        ["sublist", "transactions", "Transacciones"],
                        ["sublistfield", "select", selectAllHTML],
                        ["sublistfield", "transactionid", "Id"],
                        ["sublistfield", "paymentmethod", "Forma de Pago"],
                        ["sublistfield", "paymentmethodid", "ID Forma de Pago"],
                        ["sublistfield", "date", "Fecha"],
                        ["sublistfield", "documentnumber", "N° Documento"],
                        ["sublistfield", "entityid", "Id Beneficiario"],
                        ["sublistfield", "entity", "Beneficiario"],
                        ["sublistfield", "memo", "Nota"],
                        ["sublistfield", "amount", "Importe"],
                        ["sublistfield", "amountpayable", "Importe a Pagar"],

                        ["tab", "logs", "Logs"],

                        ["sublist", "logs", "Logs"],
                        ["sublistfield", "logid", "ID"],
                        ["sublistfield", "user", "Usuario"],
                        ["sublistfield", "startdate", "Fecha de Inicio"],
                        ["sublistfield", "enddate", "Fecha de Finalización"],
                        ["sublistfield", "status", "Estado"],
                        ["sublistfield", "documents", "Documentos"],
                        ["sublistfield", "result", "Resultado"],
                        ["sublistfield", "files", "Archivos"],

                        ["button", "process", "Procesar"]
                    ],
                    customdeploy_ts_ui_e_payment_second: [
                        ["form", "main", "Procesar Archivo de Retorno"],
                        ["fieldgroup", "filters", "Filtros"],
                        ["field", "subsidiary", "Subsidiaria"],
                        ["field", "datefrom", "Fecha Creado Desde"],
                        ["field", "dateto", "Fecha Creado Hasta"],
                        ["field", "bankaccount", "Cuenta Banco"],

                        ["tab", "paymentbatch", "Lote de Pagos"],
                        ["sublist", "paymentbatch", "Lote de Pagos"],
                        ["sublistfield", "select", " "],
                        ["sublistfield", "paymentbatchid", "N° de Lote"],
                        ["sublistfield", "paymentdate", "Fecha de Pago"],
                        ["sublistfield", "account", "Cuenta de Banco"],
                        ["sublistfield", "number", "N° de Pagos"],
                        ["sublistfield", "files", "Archivos"],

                        ["button", "cleanfilters", "Limpiar Filtros", "cleanFilters"],
                        ["button", "process", "Validar"]
                    ],
                    customdeploy_ts_ui_e_payment_third: [
                        ["form", "main", "Procesar Archivo de Retorno"],
                        ["fieldgroup", "filters", "Datos de Lote de Pago"],

                        ["field", "file", "Archivo de Retorno"],
                        ["field", "subsidiary", "Subsidiaria"],
                        ["field", "bankaccount", "Cuenta de Banco"],
                        ["field", "paymentdate", "Fecha de Pago"],
                        ["field", "paymentbatch", "N° Lote"],
                        ["field", "page", "Estado Interfaz"],

                        ["tab", "payments", "Lista de Pagos"],
                        ["sublist", "payments", "Lote de Pagos"],
                        ["sublistfield", "select", " "],
                        ["sublistfield", "paymentid", "ID"],
                        ["sublistfield", "documentnumber", "N° Orden Pago"],
                        ["sublistfield", "entity", "Beneficiario"],
                        ["sublistfield", "amount", "Importe de Pago"],
                        ["sublistfield", "paymentmethod", "Método de Pago"],
                        ["sublistfield", "status", "Estado de Banco"],

                        ["tab", "notfound", "No Encontrados"],
                        ["sublist", "notfound", "No Encontrados"],
                        ["sublistfield", "number", "N° Fila"],
                        ["sublistfield", "row", "Contenido"],

                        ["button", "process", "Procesar"],
                        ["button", "back", "Volver", "back"]
                    ]
                }
                return fieldData[deploymentid] || [];
            } catch (error) {
                log.error('Error-getFieldsData', error);
            }
        }

        getFormFields = (parameters) => {
            let formFields = {};
            let abbreviation = { field: "f", fieldgroup: "fg", tab: "t", sublist: "sl", sublistfield: "slf", button: "b" };
            let fieldsData = this.getFieldsData(parameters.deploymentid);
            for (let i = 0; i < fieldsData.length; i++) {
                let component = fieldsData[i][0];
                let field = fieldsData[i][1];
                let fieldId = `custpage_${abbreviation[component]}_${field}`;
                let fieldLabel = fieldsData[i][2];
                let functionName = fieldsData[i][3];
                if (formFields[component] === undefined) formFields[component] = {};
                if (formFields[component][field] === undefined) formFields[component][field] = {};
                formFields[component][field].id = fieldId;
                formFields[component][field].text = fieldLabel;
                if (functionName) formFields[component][field].function = functionName;
            }
            //log.error("formFields", formFields);
            return formFields;
        }

        createForm = (formName) => {
            return new Form(serverWidget.createForm(formName));
        }

        getPayments = () => {
            let detail = {};
            let newSearch = search.create({
                type: "customrecord_ts_epmt_payment",
                filters: [
                    ["isinactive", "is", "F"],
                    "AND",
                    ["custrecord_ts_epmt_prepaydet_pre_payment.isinactive", "is", "F"],
                    "AND",
                    ["custrecord_ts_epmt_prepaydet_status", "isnot", "Rechazado"],
                    "AND",
                    ["custrecord_ts_epmt_prepaydet_origin_tran", "noneof", "@NONE@"]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_ts_epmt_prepaydet_origin_tran", label: " Transacción" }),
                    search.createColumn({ name: "custrecord_ts_epmt_prepaydet_paym_amount", label: "Programado" })
                ]
            });

            let pagedData = newSearch.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach(pageRange => {
                let page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach(result => {
                    let columns = result.columns;
                    let transactionId = result.getValue(columns[0]);
                    let amount = Number(result.getValue(columns[1]));
                    if (detail[transactionId] === undefined) {
                        detail[transactionId] = 0;
                    }
                    detail[transactionId] = Math.round(Number(detail[transactionId] + amount) * 100) / 100;
                });
            });
            return detail;
        }

        setTransactionSublistData = (transactionSubList) => {
            if (!(this.PARAMETERS.bankaccount && this.PARAMETERS.subsidiary)) return;

            if (this.PARAMETERS.emitidos == 'T') {
                let savedSearch = search.load({ id: "customsearch_ts_emitidos" });//TS E Payment Ordenes de Pago - PRODUCCION

                if (this.PARAMETERS.subsidiary) {
                    let subsidiaryFilter = search.createFilter({ name: "subsidiary", operator: search.Operator.ANYOF, values: [this.PARAMETERS.subsidiary] });
                    savedSearch.filters.push(subsidiaryFilter);
                }
                if (this.PARAMETERS.entity) {
                    let entityFilter = search.createFilter({ name: "entity", operator: search.Operator.ANYOF, values: [this.PARAMETERS.entity] });
                    savedSearch.filters.push(entityFilter);
                }
                if (this.PARAMETERS.location) {
                    let locationFilter = search.createFilter({ name: "location", operator: search.Operator.ANYOF, values: [this.PARAMETERS.location] });
                    savedSearch.filters.push(locationFilter);
                }
                if (this.PARAMETERS.datefrom && this.PARAMETERS.dateto) {
                    let dateFilter = search.createFilter({ name: "trandate", operator: search.Operator.WITHIN, values: [this.PARAMETERS.datefrom, this.PARAMETERS.dateto] });
                    savedSearch.filters.push(dateFilter);
                } else if (this.PARAMETERS.datefrom && !this.PARAMETERS.dateto) {
                    let dateFilter = search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: [this.PARAMETERS.datefrom] });
                    savedSearch.filters.push(dateFilter);
                } else if (!this.PARAMETERS.datefrom && this.PARAMETERS.dateto) {
                    let dateFilter = search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: [this.PARAMETERS.dateto] });
                    savedSearch.filters.push(dateFilter);
                }
                if (this.PARAMETERS.bankaccount) {
                    let bankAccountFilter = search.createFilter({ name: "account", operator: search.Operator.ANYOF, values: [this.PARAMETERS.bankaccount] });
                    savedSearch.filters.push(bankAccountFilter);
                }
                var searchResultCount = savedSearch.runPaged().count;
                log.error('searchResultCount emitido', searchResultCount)
                if (searchResultCount) {
                    let pagedData = savedSearch.runPaged({ pageSize: this.CONSTANT.PAGINATION_SIZE });
                    //pagedData.pageRanges.forEach(function (pageRange) {
                    let page = pagedData.fetch({ index: this.PARAMETERS.page });
                    let i = 0;
                    page.data.forEach(result => {
                        let columns = result.columns;
                        log.error('columns', columns)
                        let id = result.id;
                        let paymentMethodId = "2";
                        let paymentMethod = "CHE";
                        let date = result.getValue(columns[1]);
                        let documentNumber = result.getValue(columns[2]);
                        let entityId = result.getValue(columns[3]);
                        let entity = result.getValue(columns[4]);
                        let memo = result.getValue(columns[5]);
                        let amount = Number(result.getValue(columns[6]));

                        let remainingAmount = 0;
                        if (amount < 0) {
                            remainingAmount = amount * (-1);
                        } else {
                            remainingAmount = amount;
                        }

                        log.error('entityId', entityId)
                        let entidad = this.getCustomer(entityId);
                        if (entidad[0] == null) {
                            entidad = this.getProveedor(entityId);
                        }
                        if (entidad[0] == null) {
                            entidad = this.getemployee(entityId);
                        }

                        let company = entidad[0];
                        let isPerson = entidad[2];
                        let altname = entidad[3];

                        if (company == null) company = '';
                        if (isPerson == null) isPerson = '';
                        if (altname == null) altname = '';

                        if (isPerson == false) {
                            entity = company;
                        } else if (isPerson == true) {
                            entity = altname;
                        }

                        if (remainingAmount > 0) {
                            transactionSubList.setSublistValue("custpage_slf_transactionid", i, id);
                            if (paymentMethodId) transactionSubList.setSublistValue("custpage_slf_paymentmethodid", i, paymentMethodId);
                            if (paymentMethod) transactionSubList.setSublistValue("custpage_slf_paymentmethod", i, paymentMethod);
                            transactionSubList.setSublistValue("custpage_slf_date", i, date);
                            if (documentNumber) transactionSubList.setSublistValue("custpage_slf_documentnumber", i, documentNumber);
                            transactionSubList.setSublistValue("custpage_slf_entityid", i, entityId);
                            transactionSubList.setSublistValue("custpage_slf_entity", i, entity);
                            if (memo) transactionSubList.setSublistValue("custpage_slf_memo", i, memo);
                            transactionSubList.setSublistValue("custpage_slf_amount", i, remainingAmount);
                            transactionSubList.setSublistValue("custpage_slf_amountpayable", i, remainingAmount);
                            i++
                        }
                    });
                }
            } else {
                let paymentsJson = this.getPayments();
                log.error('RESULT1', paymentsJson);
                let savedSearch = search.load({ id: "customsearch_ts_epmt_payment_orders" });//TS E Payment Ordenes de Pago - PRODUCCION

                if (this.PARAMETERS.subsidiary) {
                    let subsidiaryFilter = search.createFilter({ name: "subsidiary", operator: search.Operator.ANYOF, values: [this.PARAMETERS.subsidiary] });
                    savedSearch.filters.push(subsidiaryFilter);
                }
                if (this.PARAMETERS.entity) {
                    let entityFilter = search.createFilter({ name: "custbody_ts_op", operator: search.Operator.ANYOF, values: [this.PARAMETERS.entity] });
                    savedSearch.filters.push(entityFilter);
                }
                if (this.PARAMETERS.location) {
                    let locationFilter = search.createFilter({ name: "location", operator: search.Operator.ANYOF, values: [this.PARAMETERS.location] });
                    savedSearch.filters.push(locationFilter);
                }
                if (this.PARAMETERS.datefrom && this.PARAMETERS.dateto) {
                    let dateFilter = search.createFilter({ name: "trandate", operator: search.Operator.WITHIN, values: [this.PARAMETERS.datefrom, this.PARAMETERS.dateto] });
                    savedSearch.filters.push(dateFilter);
                } else if (this.PARAMETERS.datefrom && !this.PARAMETERS.dateto) {
                    let dateFilter = search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: [this.PARAMETERS.datefrom] });
                    savedSearch.filters.push(dateFilter);
                } else if (!this.PARAMETERS.datefrom && this.PARAMETERS.dateto) {
                    let dateFilter = search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: [this.PARAMETERS.dateto] });
                    savedSearch.filters.push(dateFilter);
                }
                if (this.PARAMETERS.bankaccount) {
                    let bankAccountFilter = search.createFilter({ name: "custbody_ts_op_cuentapago", operator: search.Operator.ANYOF, values: [this.PARAMETERS.bankaccount] });
                    savedSearch.filters.push(bankAccountFilter);
                }
                if (this.PARAMETERS.paymentmethod) {
                    let paymentMethodFilter = search.createFilter({ name: "custbody_ts_forma_pago_op", operator: search.Operator.ANYOF, values: [this.PARAMETERS.paymentmethod] });
                    savedSearch.filters.push(paymentMethodFilter);
                }
                var searchResultCount = savedSearch.runPaged().count;
                log.error('RESULT2', searchResultCount);
                if (searchResultCount) {
                    let pagedData = savedSearch.runPaged({ pageSize: this.CONSTANT.PAGINATION_SIZE });
                    //pagedData.pageRanges.forEach(function (pageRange) {
                    let page = pagedData.fetch({ index: this.PARAMETERS.page });
                    let i = 0;
                    page.data.forEach(result => {
                        let columns = result.columns;
                        let id = result.id;
                        let paymentMethodId = result.getValue(columns[0]);
                        let paymentMethod = result.getText(columns[0]);
                        let date = result.getValue(columns[1]);
                        let documentNumber = result.getValue(columns[2]);
                        let entityId = result.getValue(columns[3]);
                        let entity = result.getValue(columns[4]);
                        let memo = result.getValue(columns[5]);
                        let amount = Number(result.getValue(columns[6]));

                        let remainingAmount = amount;
                        if (paymentsJson[id] !== undefined) {
                            remainingAmount = Math.round(Number(amount - paymentsJson[id]) * 100) / 100;
                        }
                        //log.error("remainingAmount", remainingAmount);
                        if (remainingAmount > 0) {
                            transactionSubList.setSublistValue("custpage_slf_transactionid", i, id);
                            if (paymentMethodId) transactionSubList.setSublistValue("custpage_slf_paymentmethodid", i, paymentMethodId);
                            if (paymentMethod) transactionSubList.setSublistValue("custpage_slf_paymentmethod", i, paymentMethod);
                            transactionSubList.setSublistValue("custpage_slf_date", i, date);
                            if (documentNumber) transactionSubList.setSublistValue("custpage_slf_documentnumber", i, documentNumber);
                            transactionSubList.setSublistValue("custpage_slf_entityid", i, entityId);
                            transactionSubList.setSublistValue("custpage_slf_entity", i, entity);
                            if (memo) transactionSubList.setSublistValue("custpage_slf_memo", i, memo);
                            transactionSubList.setSublistValue("custpage_slf_amount", i, remainingAmount);
                            transactionSubList.setSublistValue("custpage_slf_amountpayable", i, remainingAmount);
                            i++
                        }
                    });
                    //});
                }
            }
        }

        setLogSublistData = (logSubList) => {
            let newSearch = search.create({
                type: "customrecord_ts_epmt_log",
                filters: [["isinactive", "is", "false"]],
                columns: [
                    search.createColumn({ name: "name", sort: search.Sort.DESC, label: "ID" }),
                    search.createColumn({ name: "custrecord_ts_epmt_log_user", label: "Usuario" }),
                    search.createColumn({ name: "custrecord_ts_epmt_log_startdate", label: "Fecha de Inicio" }),
                    search.createColumn({ name: "custrecord_ts_epmt_log_enddate", label: "Fecha de Finalizacion" }),
                    search.createColumn({ name: "custrecord_ts_epmt_log_status", label: "Estado" }),
                    search.createColumn({ name: "custrecord_ts_epmt_log_documents", label: "Documentos" }),
                    search.createColumn({ name: "custrecord_ts_epmt_log_result", label: "Resultado" }),
                    search.createColumn({
                        name: "custrecord_ts_epmt_prepmt_tef_file_url",
                        join: "CUSTRECORD_TS_EPMT_LOG_PRE_PAGO",
                        label: "URL Archivo EFT"
                    }),
                    // search.createColumn({
                    //     name: "custrecord_ts_epmt_prepmt_pdf_file_url",
                    //     join: "CUSTRECORD_TS_EPMT_LOG_PRE_PAGO",
                    //     label: "URL PDF"
                    // })
                ]
            }).run().getRange(0, 1000);

            let j = 0;
            newSearch.forEach(result => {
                let columns = result.columns;
                let id = result.getValue(columns[0]);
                let usuario = result.getText(columns[1]);
                let fechaInicio = result.getValue(columns[2]);
                let fechaFin = result.getValue(columns[3]);
                let estado = result.getValue(columns[4]);
                let documentos = result.getValue(columns[5]).length > 300 ? result.getValue(columns[5]).substring(0, 297) + '...' : result.getValue(columns[5]);
                let resultado = result.getValue(columns[6]);
                let eftUrl = result.getValue(columns[7]);
                //let pdfUrl = result.getValue(columns[8]);

                if (id) logSubList.setSublistValue('custpage_slf_logid', j, id);
                if (usuario) logSubList.setSublistValue('custpage_slf_user', j, usuario);
                if (fechaInicio) logSubList.setSublistValue('custpage_slf_startdate', j, fechaInicio);
                if (fechaFin) logSubList.setSublistValue('custpage_slf_enddate', j, fechaFin);
                if (estado) logSubList.setSublistValue('custpage_slf_status', j, estado);
                if (documentos) logSubList.setSublistValue('custpage_slf_documents', j, documentos);
                if (resultado) logSubList.setSublistValue('custpage_slf_result', j, resultado);
                if (eftUrl /*|| pdfUrl*/) {
                    let html = `<a href="${eftUrl.replace('https://7451241.app.netsuite.com', '')}" download>Descargar</a>`;
                    // html += '<p> </p>';
                    // html += `<a href="${pdfUrl.replace('https://7451241-sb1.app.netsuite.com', '')}" download>PDF</a>`;
                    logSubList.setSublistValue('custpage_slf_files', j, html);
                }
                j++;
            })
        }

        setBankAccountFieldData = (bankAccountField) => {
            let accountSearchResult = search.create({
                type: 'account',
                filters: [['type', 'anyof', 'Bank'], 'AND', ['issummary', 'is', 'F']],
                columns: ['name', 'number']
            }).run().getRange(0, 1000);
            bankAccountField.addSelectOption('', '');
            for (let i = 0; i < accountSearchResult.length; i++) {
                let id = accountSearchResult[i].id;
                let number = accountSearchResult[i].getValue('number');
                let text = `${number} ${this.getShortAccountName(accountSearchResult[i].getValue('name'))}`.trim();
                bankAccountField.addSelectOption(id, text);
            }
        }

        getShortAccountName = (accountName) => {
            let names = accountName.split(':');
            return names[names.length - 1].trim();
        }

        setPageFieldData = (pageField, lineCount) => {
            let pageId = this.PARAMETERS.page;

            var pageCount = Math.ceil(lineCount / this.CONSTANT.PAGINATION_SIZE);
            if (!pageId || pageId == '' || pageId < 0)
                pageId = 0;
            else if (pageId >= pageCount)
                pageId = pageCount - 1;

            for (let i = 0; i < pageCount; i++) {
                let text = ((i * this.CONSTANT.PAGINATION_SIZE) + 1) + ' - ' + ((i + 1) * this.CONSTANT.PAGINATION_SIZE);
                if (i == pageId) {
                    pageField.addSelectOption(i, text, true);
                } else {
                    pageField.addSelectOption(i, text);
                }
            }
        }

        setCurrencyFieldData = (currencyField, bankAccountId) => {
            if (!bankAccountId) return;
            let sql = `SELECT a.currency FROM account a WHERE id = ${bankAccountId}`;
            var queryResult = query.runSuiteQL({ query: sql });
            let result = queryResult.asMappedResults();
            let currency = result.length ? result[0].currency : "";
            currencyField.setDefaultValue(currency);
        }

        setTefTemplateFieldData = (tefTemplateField, bankAccountId) => {
            log.error("setTefTemplate", { tefTemplateField, bankAccountId });
            if (!bankAccountId) {
                tefTemplateField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
            } else {
                let resultSearch = search.create({
                    type: "customrecord_2663_bank_details",
                    filters: [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_2663_gl_bank_account", "anyof", bankAccountId]
                    ],
                    columns: ["custrecord_ts_eft_template", "custrecord_ts_eft_template.altname", "custrecord_2663_trans_marked"]
                }).run().getRange(0, 1000);

                log.error("resultSearch", resultSearch.length);
                if (resultSearch.length == 0) {
                    tefTemplateField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
                } else {
                    let isSelected = false;
                    for (let i = 0; i < resultSearch.length; i++) {
                        let columns = resultSearch[i].columns;
                        let id = resultSearch[i].getValue(columns[0]);
                        let text = resultSearch[i].getValue(columns[1]);
                        let favorite = resultSearch[i].getValue(columns[2]);
                        log.error("dato", { id, text, favorite });
                        tefTemplateField.addSelectOption(id, text, favorite);
                    }
                    if (resultSearch.length == 1) tefTemplateField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
                }
            }
        }

        setPaymentMethodFieldData = (paymentMethodField) => {
            let paymentMethodIds = ["1", "2", "3", "4"];
            let searchResult = search.create({
                type: "customrecord_epayment_fpago",
                filters: [["internalid", "anyof", paymentMethodIds]],
                columns: ["custrecord_ecodigo", "name"]
            }).run().getRange(0, 1000);

            paymentMethodField.addSelectOption('', '');
            for (let i = 0; i < searchResult.length; i++) {
                let id = searchResult[i].id;
                let text = searchResult[i].getValue("name");
                paymentMethodField.addSelectOption(id, text);
            }
        }

        setEntityFieldData = (entityField) => {
            let searchResult = search.create({
                type: "entity",
                filters: [],
                columns: ["entityid", "altname"]
            });//.run().getRange(0, 1000);

            var pagedData = searchResult.runPaged({
                pageSize: 1000,
            });

            var page, columns;
            entityField.addSelectOption('', '');

            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index,
                });

                page.data.forEach(function (result) {
                    columns = result.columns;
                    let id = result.id;
                    let text = `${result.getValue(columns[0])} ${result.getValue(columns[1])}`;
                    entityField.addSelectOption(id, text);
                })

            })

            for (let i = 0; i < searchResult.length; i++) {
                let id = searchResult[i].id;
                let text = `${searchResult[i].getValue("entityid")} ${searchResult[i].getValue("altname")}`;

            }
        }

        setPaymentBatchSublistData = (paymentBatchSubList) => {
            let newSearch = search.create({
                type: "customrecord_ts_epmt_payment",
                filters: [
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_ts_epmt_prepaydet_pre_payment",
                        summary: "GROUP",
                        sort: search.Sort.DESC,
                        label: "Lote de Pago"
                    }),
                    search.createColumn({
                        name: "custrecord_ts_epmt_prepmt_payment_date",
                        join: "CUSTRECORD_TS_EPMT_PREPAYDET_PRE_PAYMENT",
                        summary: "GROUP",
                        label: "Fecha de Pago"
                    }),
                    search.createColumn({
                        name: "custrecord_ts_epmt_prepmt_bank_account",
                        join: "CUSTRECORD_TS_EPMT_PREPAYDET_PRE_PAYMENT",
                        summary: "GROUP",
                        label: "Cuenta Banco"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "1",
                        label: "Fórmula (numérica)"
                    })
                ]
            });

            if (this.PARAMETERS.subsidiary) {
                let subsidiaryFilter = search.createFilter({ name: "custrecord_ts_epmt_prepmt_subsidiary", join: "custrecord_ts_epmt_prepaydet_pre_payment", operator: search.Operator.ANYOF, values: [this.PARAMETERS.subsidiary] });
                newSearch.filters.push(subsidiaryFilter);
            }

            if (this.PARAMETERS.datefrom && this.PARAMETERS.dateto) {
                let dateFilter = search.createFilter({ name: "created", join: "custrecord_ts_epmt_prepaydet_pre_payment", operator: search.Operator.WITHIN, values: [this.PARAMETERS.datefrom, this.PARAMETERS.dateto] });
                newSearch.filters.push(dateFilter);
            } else if (this.PARAMETERS.datefrom && !this.PARAMETERS.dateto) {
                let dateFilter = search.createFilter({ name: "created", join: "custrecord_ts_epmt_prepaydet_pre_payment", operator: search.Operator.ONORAFTER, values: [this.PARAMETERS.datefrom] });
                newSearch.filters.push(dateFilter);
            } else if (!this.PARAMETERS.datefrom && this.PARAMETERS.dateto) {
                let dateFilter = search.createFilter({ name: "created", join: "custrecord_ts_epmt_prepaydet_pre_payment", operator: search.Operator.ONORBEFORE, values: [this.PARAMETERS.dateto] });
                newSearch.filters.push(dateFilter);
            }

            if (this.PARAMETERS.bankaccount) {
                let bankAccountFilter = search.createFilter({ name: "custrecord_ts_epmt_prepmt_bank_account", join: "custrecord_ts_epmt_prepaydet_pre_payment", operator: search.Operator.ANYOF, values: [this.PARAMETERS.bankaccount] });
                newSearch.filters.push(bankAccountFilter);
            }
            let searchResult = newSearch.run().getRange(0, 1000);
            for (let i = 0; i < searchResult.length; i++) {
                let columns = searchResult[i].columns;
                paymentBatchSubList.setSublistValue('custpage_slf_paymentbatchid', i, searchResult[i].getValue(columns[0]));
                paymentBatchSubList.setSublistValue('custpage_slf_paymentdate', i, searchResult[i].getValue(columns[1]));
                paymentBatchSubList.setSublistValue('custpage_slf_account', i, searchResult[i].getText(columns[2]));
                paymentBatchSubList.setSublistValue('custpage_slf_number', i, searchResult[i].getValue(columns[3]));
            }
        }

        getFileContent = (fileId, fileField) => {
            let resultArray = new Array();
            let inputFile = file.load({ id: fileId });
            fileField.setDefaultValue(inputFile.name);
            fileField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
            let iterator = inputFile.lines.iterator();
            let count = 1;
            iterator.each(function (line) {
                let lineValues = line.value;
                let llave = parseInt(lineValues.substring(156, 170));
                let vatregnumber = lineValues.substring(68, 82);
                let amount = lineValues.substring(188, 201);
                let decimals = lineValues.substring(201, 203);
                let result = lineValues.substring(369, 409);
                vatregnumber = vatregnumber.replace(' ', '');
                log.error("FILA " + llave + "-" + + count, [count, vatregnumber, Number(`${amount}.${decimals}`), result, lineValues]);
                resultArray.push([count, vatregnumber, Number(`${amount}.${decimals}`), result, lineValues]);
                count++;
                return true
            });
            return resultArray;
        }

        getVatRegNumber = (entityType, entityId) => {
            if (entityType == "Employee") {
                let result = search.lookupFields({ type: search.Type.EMPLOYEE, id: entityId, columns: ["custentity_ec_numero_registro"] });
                return result.custentity_ec_numero_registro;
            } else if (entityType == "Vendor") {
                let result = search.lookupFields({ type: search.Type.VENDOR, id: entityId, columns: ["vatregnumber"] });
                return result.vatregnumber;
            } else if (entityType == "CustJob") {
                let result = search.lookupFields({ type: search.Type.CUSTOMER, id: entityId, columns: ["vatregnumber"] });
                return result.vatregnumber;
            } else {
                return "";
            }
        }

        setAllPaymentBatchFieldValues = (subsidiaryField, bankAccountField, paymentDateField, fileField, paymentsSubList, notFoundSubList) => {
            let fileContentArray = new Array();
            if (this.PARAMETERS.file) {
                let fileId = this.PARAMETERS.file;
                fileContentArray = this.getFileContent(fileId, fileField);
                log.error("fileContentArray", fileContentArray);
            }

            let searchResult = search.create({
                type: "customrecord_ts_epmt_payment",
                filters: [
                    ["isinactive", "is", "F"],
                    "AND",
                    ["custrecord_ts_epmt_prepaydet_pre_payment", "anyof", this.PARAMETERS.paymentbatch]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_ts_epmt_prepmt_subsidiary", join: "CUSTRECORD_TS_EPMT_PREPAYDET_PRE_PAYMENT", label: "Subsidiaria" }),
                    search.createColumn({ name: "custrecord_ts_epmt_prepmt_bank_account", join: "CUSTRECORD_TS_EPMT_PREPAYDET_PRE_PAYMENT", label: "Cuenta Banco" }),
                    search.createColumn({ name: "custrecord_ts_epmt_prepmt_payment_date", join: "CUSTRECORD_TS_EPMT_PREPAYDET_PRE_PAYMENT", label: "Fecha de Pago" }),
                    search.createColumn({ name: "custrecord_ts_epmt_prepaydet_origin_tran", label: "Transaccion Origen" }),
                    search.createColumn({ name: "custrecord_ts_epmt_prepaydet_entity", label: "Beneficiario ID" }),
                    search.createColumn({ name: "type", join: "custrecord_ts_epmt_prepaydet_entity", label: "Beneficiario Tipo" }),
                    search.createColumn({ name: "formulatext", formula: "CONCAT(CONCAT({custrecord_ts_epmt_prepaydet_entity.entityid},' '), {custrecord_ts_epmt_prepaydet_entity.altname})", label: "Beneficiario" }),
                    search.createColumn({ name: "custrecord_ts_epmt_prepaydet_paym_amount", label: "Importe de Pago" }),
                    search.createColumn({ name: "custrecord_ts_epmt_prepaydet_paym_method", label: "Forma de Pago" }),
                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" }),
                ]
            }).run().getRange(0, 1000);

            let main = true; let i = 0;
            searchResult.forEach(result => {
                let columns = result.columns;
                if (main) {
                    let subsidiary = result.getValue(columns[0]);
                    let bankAccount = result.getValue(columns[1]);
                    let paymentDate = result.getValue(columns[2]);
                    subsidiaryField.setDefaultValue(subsidiary);
                    bankAccountField.setDefaultValue(bankAccount);
                    paymentDateField.setDefaultValue(paymentDate);
                    main = false;
                }
                let id = result.id;
                let documentNumber = result.getText(columns[3]);
                let entityId = result.getValue(columns[4]);
                let entityType = result.getValue(columns[5]);
                let entity = result.getValue(columns[6]);
                let amount = Number(result.getValue(columns[7]));
                let paymentMethod = result.getText(columns[8]);
                if (id) paymentsSubList.setSublistValue('custpage_slf_paymentid', i, id);
                if (documentNumber) paymentsSubList.setSublistValue('custpage_slf_documentnumber', i, documentNumber);
                if (entity) paymentsSubList.setSublistValue('custpage_slf_entity', i, entity);
                if (amount) paymentsSubList.setSublistValue('custpage_slf_amount', i, amount);
                if (paymentMethod) paymentsSubList.setSublistValue('custpage_slf_paymentmethod', i, paymentMethod);

                if (this.PARAMETERS.file) {
                    let vatregnumber = this.getVatRegNumber(entityType, entityId);
                    log.error('TRACK1', vatregnumber + ' - ' + amount);
                    let index = fileContentArray.findIndex(result => { return result[1] == vatregnumber && result[2] == amount });
                    if (index == -1) {
                        paymentsSubList.setSublistValue('custpage_slf_status', i, "No se encontró el pago");
                    } else {
                        let fileContentRow = fileContentArray[index];
                        if (fileContentRow[3].indexOf('No existe cuenta') != -1) {
                            paymentsSubList.setSublistValue('custpage_slf_status', i, fileContentRow[3]);
                        } else {
                            paymentsSubList.setSublistValue('custpage_slf_status', i, "Pago encontrado");
                            paymentsSubList.setSublistValue('custpage_slf_select', i, 'T');
                        }
                        fileContentArray.splice(index, 1);
                    }
                } else {
                    paymentsSubList.setSublistValue('custpage_slf_select', i, 'T');
                }
                i++;
            });
            log.error("fileContentArray", fileContentArray.length);
            log.error("fileContentArrayObjects", fileContentArray);
            for (let j = 0; j < fileContentArray.length; j++) {
                let line = fileContentArray[j][0];
                let value = fileContentArray[j][4].substring(0, 299);
                notFoundSubList.setSublistValue('custpage_slf_number', j, line);
                notFoundSubList.setSublistValue('custpage_slf_row', j, value);
            }
        }

        roundTwoDecimal = (value) => {
            return Math.round(Number(value) * 100) / 100;
        }

        getProveedor = (id) => {
            id = Number(id);
            try {
                var arr = [];
                let vendor = search.lookupFields({
                    type: "vendor",
                    id: id,
                    columns: [
                        "companyname", 'vatregnumber', 'isperson', 'altname'
                    ]
                });
                arr[0] = vendor.companyname;
                arr[1] = vendor.vatregnumber;
                arr[2] = vendor.isperson;
                arr[3] = vendor.altname;
                return arr;
            } catch (error) {
                log.error('error-getProveedor', error);
            }
        }

        getCustomer = (id) => {
            id = Number(id);
            try {
                var arr = [];
                let customer = search.lookupFields({
                    type: "customer",
                    id: id,
                    columns: [
                        "companyname", 'vatregnumber', 'isperson', 'altname'
                    ]
                });
                arr[0] = customer.companyname;
                arr[1] = customer.vatregnumber;
                arr[2] = customer.isperson;
                arr[3] = customer.altname;
                return arr;
            } catch (error) {
                log.error('error-getCustomer', error);
            }
        }

        getemployee = (id) => {
            id = Number(id);
            try {
                var arr = [];
                let employee = search.lookupFields({
                    type: "employee",
                    id: id,
                    columns: [
                        "altname", 'custentity_ec_numero_registro'
                    ]
                });
                arr[0] = '';
                arr[1] = employee.custentity_ec_numero_registro;
                arr[2] = true;
                arr[3] = employee.altname;
                return arr;
            } catch (error) {
                log.error('error-getemployee', error);
            }
        }
    }

    return {
        Parameters,
        UserInterface
    }
})