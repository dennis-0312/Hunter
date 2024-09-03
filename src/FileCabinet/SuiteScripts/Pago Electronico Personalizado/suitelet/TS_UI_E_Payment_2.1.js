/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/redirect',
    'N/record',
    'N/runtime',
    'N/search',
    'N/task',
    'N/file',
    './lib/TS_LBRY_E_Payment_2.1.js'
], (serverWidget, redirect, record, runtime, search, task, file, library) => {
    const userRecord = runtime.getCurrentUser();
    const currentScript = runtime.getCurrentScript();
    //log.error('currentScript', currentScript);
    //cheque anticipo y pago
    const INPUT_FILES_FOLDER_ID = "6327"; //*SB:6327 EN PROD: 6504

    const onRequest = (context) => {
        try {
            var method = context.request.method;
            var deploymentId = currentScript.deploymentId;
            if (deploymentId == "customdeploy_ts_ui_e_payment_first") {
                if (method == 'GET') {
                    viewTransactionList(context);
                } else {
                    processEPayment(context);
                }
            } else if (deploymentId == "customdeploy_ts_ui_e_payment_second") {
                if (method == 'GET') {
                    viewPaymentBatchList(context);
                } else {
                    selectPaymentBatch(context);
                }
            } else if (deploymentId == "customdeploy_ts_ui_e_payment_third") {
                if (method == 'GET') {
                    loadPaymentBatch(context);
                } else {
                    processPaymentBatch(context);
                }
            }
        } catch (error) {
            log.error("error", error);
            context.response.writePage(error);
        }
    }

    const viewTransactionList = (context) => {
        log.error("viewTransactionList", "START")
        let userInterface = '';
        try {
            userInterface = new library.UserInterface(context.request.parameters);
        } catch (error) {
            log.error('ErrorSet1', error);
        }

        const { FIELDS, PARAMETERS } = userInterface;

        log.error("PARAMETERS", PARAMETERS)
        let form = userInterface.createForm(FIELDS.form.main.text);
        form.setClientScript("../TS_CS_E_Payment_Payment_Batch_Generation_2.1.js");

        form.addFieldGroup(FIELDS.fieldgroup.filters.id, FIELDS.fieldgroup.filters.text);
        let subsidiaryField = form.addField(FIELDS.field.subsidiary.id, serverWidget.FieldType.SELECT, FIELDS.field.subsidiary.text, FIELDS.fieldgroup.filters.id, 'subsidiary');
        subsidiaryField.setDefaultValue(PARAMETERS.subsidiary);
        subsidiaryField.setIsMandatory(true);

        let dateFromField = form.addField(FIELDS.field.datefrom.id, serverWidget.FieldType.DATE, FIELDS.field.datefrom.text, FIELDS.fieldgroup.filters.id);
        dateFromField.updateDisplaySize(3, 200);
        dateFromField.setDefaultValue(PARAMETERS.datefrom);

        let dateToField = form.addField(FIELDS.field.dateto.id, serverWidget.FieldType.DATE, FIELDS.field.dateto.text, FIELDS.fieldgroup.filters.id);
        dateToField.updateDisplaySize(3, 200);
        dateToField.setDefaultValue(PARAMETERS.dateto);

        let locationField = form.addField(FIELDS.field.location.id, serverWidget.FieldType.SELECT, FIELDS.field.location.text, FIELDS.fieldgroup.filters.id, 'location');
        locationField.updateDisplaySize(3, 200);
        locationField.setDefaultValue(PARAMETERS.location);

        let paymentMethodField = form.addField(FIELDS.field.paymentmethod.id, serverWidget.FieldType.SELECT, FIELDS.field.paymentmethod.text, FIELDS.fieldgroup.filters.id);
        userInterface.setPaymentMethodFieldData(paymentMethodField);
        paymentMethodField.setDefaultValue(PARAMETERS.paymentmethod);

        let entityField = form.addField(FIELDS.field.entity.id, serverWidget.FieldType.SELECT, FIELDS.field.entity.text, FIELDS.fieldgroup.filters.id, 'entity');
        userInterface.setEntityFieldData(entityField);
        entityField.setDefaultValue(PARAMETERS.entity);

        log.error('FIELDS.field.emitidos.id', FIELDS.field.emitidos.id)
        log.error('FIELDS.field.emitidos.text', FIELDS.field.emitidos.text)
        let emitidosField = form.addField(FIELDS.field.emitidos.id, serverWidget.FieldType.CHECKBOX, FIELDS.field.emitidos.text, FIELDS.fieldgroup.filters.id)
        emitidosField.setDefaultValue(PARAMETERS.emitidos);

        form.addFieldGroup(FIELDS.fieldgroup.payment.id, FIELDS.fieldgroup.payment.text);

        let bankAccountField = form.addField(FIELDS.field.bankaccount.id, serverWidget.FieldType.SELECT, FIELDS.field.bankaccount.text, FIELDS.fieldgroup.payment.id);
        bankAccountField.setIsMandatory(true);
        userInterface.setBankAccountFieldData(bankAccountField);
        bankAccountField.setDefaultValue(PARAMETERS.bankaccount);

        let currencyField = form.addField(FIELDS.field.currency.id, serverWidget.FieldType.SELECT, FIELDS.field.currency.text, FIELDS.fieldgroup.payment.id, 'currency');
        userInterface.setCurrencyFieldData(currencyField, PARAMETERS.bankaccount);
        currencyField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

        let tefTemplateField = form.addField(FIELDS.field.teftemplate.id, serverWidget.FieldType.SELECT, FIELDS.field.teftemplate.text, FIELDS.fieldgroup.payment.id);
        userInterface.setTefTemplateFieldData(tefTemplateField, PARAMETERS.bankaccount);

        let paymentDateField = form.addField(FIELDS.field.paymentdate.id, serverWidget.FieldType.DATE, FIELDS.field.paymentdate.text, FIELDS.fieldgroup.payment.id);
        paymentDateField.setDefaultValue(new Date());

        form.addTab(FIELDS.tab.transactions.id, FIELDS.tab.transactions.text);
        let pageField = form.addField(FIELDS.field.page.id, serverWidget.FieldType.SELECT, FIELDS.field.page.text, FIELDS.tab.transactions.id);
        pageField.updateDisplaySize(3, 200);

        let totalSummaryField = form.addField(FIELDS.field.totalsummary.id, serverWidget.FieldType.CURRENCY, FIELDS.field.totalsummary.text, FIELDS.tab.transactions.id);
        totalSummaryField.setDefaultValue(0.0);
        totalSummaryField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

        let transactionsSubList = form.addSublist(FIELDS.sublist.transactions.id, serverWidget.SublistType.LIST, FIELDS.sublist.transactions.text, FIELDS.tab.transactions.id);
        form.addButton('btnClean', 'Limpiar Filtros', 'cleanFilters');
        form.addButton('btnSumarImporte', 'Sumar Importe', 'sumImport');
        form.addButton('btnResetImporte', 'Limpiar Importe', 'resImport');
        transactionsSubList.addSublistField(FIELDS.sublistfield.select.id, serverWidget.FieldType.CHECKBOX, FIELDS.sublistfield.select.text);
        transactionsSubList.addSublistField(FIELDS.sublistfield.transactionid.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.transactionid.text)
            .updateDisplayType(serverWidget.FieldDisplayType.HIDDEN);
        transactionsSubList.addSublistField(FIELDS.sublistfield.paymentmethodid.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.paymentmethodid.text)
            .updateDisplayType(serverWidget.FieldDisplayType.HIDDEN);
        transactionsSubList.addSublistField(FIELDS.sublistfield.paymentmethod.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.paymentmethod.text);
        transactionsSubList.addSublistField(FIELDS.sublistfield.date.id, serverWidget.FieldType.DATE, FIELDS.sublistfield.date.text);
        transactionsSubList.addSublistField(FIELDS.sublistfield.documentnumber.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.documentnumber.text);
        transactionsSubList.addSublistField(FIELDS.sublistfield.entityid.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.entityid.text)
            .updateDisplayType(serverWidget.FieldDisplayType.HIDDEN);
        transactionsSubList.addSublistField(FIELDS.sublistfield.entity.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.entity.text);
        transactionsSubList.addSublistField(FIELDS.sublistfield.memo.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.memo.text);
        transactionsSubList.addSublistField(FIELDS.sublistfield.amount.id, serverWidget.FieldType.CURRENCY, FIELDS.sublistfield.amount.text);
        let amountpayable = transactionsSubList.addSublistField(FIELDS.sublistfield.amountpayable.id, serverWidget.FieldType.CURRENCY, FIELDS.sublistfield.amountpayable.text)
        amountpayable.updateDisplayType(serverWidget.FieldDisplayType.ENTRY);
        amountpayable.updateDisplayType(serverWidget.FieldDisplayType.HIDDEN);
        transactionsSubList.addMarkAllButtons();
        userInterface.setTransactionSublistData(transactionsSubList);
        //form.addButton(FIELDS.button.cleanfilters.id, FIELDS.button.cleanfilters.text, FIELDS.button.cleanfilters.function);

        if (transactionsSubList.getLineCount() <= 0) {
            pageField.updateDisplayType(serverWidget.FieldDisplayType.NODISPLAY);
            totalSummaryField.updateDisplayType(serverWidget.FieldDisplayType.NODISPLAY);
        } else {
            userInterface.setPageFieldData(pageField, transactionsSubList.getLineCount());
            pageField.updateDisplaySize(3, 120);
        }

        form.addTab(FIELDS.tab.logs.id, FIELDS.tab.logs.text);
        let logSubList = form.addSublist(FIELDS.sublist.logs.id, serverWidget.SublistType.LIST, FIELDS.sublist.logs.text, FIELDS.tab.logs.id);
        logSubList.addSublistField(FIELDS.sublistfield.logid.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.logid.text);
        logSubList.addSublistField(FIELDS.sublistfield.user.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.user.text);
        logSubList.addSublistField(FIELDS.sublistfield.startdate.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.startdate.text);
        logSubList.addSublistField(FIELDS.sublistfield.enddate.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.enddate.text);
        logSubList.addSublistField(FIELDS.sublistfield.status.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.status.text);
        logSubList.addSublistField(FIELDS.sublistfield.documents.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.documents.text);
        logSubList.addSublistField(FIELDS.sublistfield.result.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.result.text);
        logSubList.addSublistField(FIELDS.sublistfield.files.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.files.text);
        userInterface.setLogSublistData(logSubList);
        logSubList.addRefreshButton();
        form.addSubmitButton(FIELDS.button.process.text);
        context.response.writePage(form.form);
    }

    const processEPayment = (context) => {
        try {
            let selectedDocuments = getSelectedDocuments(context.request.parameters.custpage_sl_transactionsdata);
            let data = getDataForEPaymentLog(context.request.parameters, selectedDocuments.data);
            createEPaymentLog(data, selectedDocuments.documents);
            if (getInstanceSchedule("customscript_ts_ss_epmt_payment_batch_ge"))
                submitScheduleTask(context.request.parameters.custpage_f_emitidos);
            redirectToSuitelet();
        } catch (error) {
            log.error("An error was ocurred in [processEPayment]", error);
        }
    }

    const getSelectedDocuments = (sublistData) => {
        let resultData = [], documents = [];
        try {
            const breakLine = /\u0002/;
            const breakColumns = /\u0001/;
            let lines = sublistData.split(breakLine);
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].split(breakColumns);
                if (line[0] == 'T') {
                    let transaction = line[1];
                    let paymentMethod = line[2];
                    let document = line[5].trim();
                    let entity = line[6];
                    let amount = Number(line[9]);
                    let prePaymentAmount = Number(line[10]);
                    resultData.push([transaction, paymentMethod, entity, amount, prePaymentAmount]);
                    documents.push(document);
                }
            }
        } catch (error) {
            log.error("An error was found in [getSublistData] function", error);
        }
        return { data: resultData, documents };
    }

    const getDataForEPaymentLog = (parameters, sublistData) => {
        let dataJson = {
            subsidiary: parameters.custpage_f_subsidiary,
            paymentDate: parameters.custpage_f_paymentdate,
            bankAccount: parameters.custpage_f_bankaccount,
            currency: parameters.custpage_f_currency,
            tefTemplate: parameters.custpage_f_teftemplate,
            paymentMethod: parameters.custpage_f_paymentmethod,
            detail: sublistData
        };
        return dataJson;
    }

    const createEPaymentLog = (data, documents) => {
        let ePaymentLog = record.create({ type: "customrecord_ts_epmt_log" });
        ePaymentLog.setValue("custrecord_ts_epmt_log_user", userRecord.id);
        ePaymentLog.setValue("custrecord_ts_epmt_log_startdate", new Date());
        ePaymentLog.setValue("custrecord_ts_epmt_log_status", "Por Procesar");
        ePaymentLog.setValue("custrecord_ts_epmt_log_documents", `[${documents.join(",")}]`);
        ePaymentLog.setValue("custrecord_ts_epmt_log_data", JSON.stringify(data));
        ePaymentLog.save();
    }

    const getInstanceSchedule = (scriptId) => {
        var newSearch = search.create({
            type: "scheduledscriptinstance",
            filters: [
                ["script.scriptid", "is", scriptId],
                "AND",
                ["status", "noneof", "CANCELED", "COMPLETE", "FAILED"]
            ],
            columns: [
                search.createColumn({ name: "status", label: "Estado" })
            ]
        }).run().getRange(0, 10);
        log.error("newSearch.length", newSearch.length);
        return newSearch.length == 0;
    }

    const submitScheduleTask = (emitido) => {
        let scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_ts_ss_epmt_payment_batch_ge',
            deploymentId: 'customdeploy_ts_ss_epmt_payment_batch_ge',
            params: {
                custscript_ts_ss_epmt_ppg_emitido: emitido,
            }
        });
        scriptTask.submit();
    }

    const redirectToSuitelet = () => {
        redirect.toSuitelet({
            scriptId: 'customscript_ts_ui_e_payment_2_1',
            deploymentId: 'customdeploy_ts_ui_e_payment_first'
        });
    }

    const viewPaymentBatchList = (context) => {
        log.error("viewTransactionList", "START")
        let userInterface = new library.UserInterface(context.request.parameters);
        const { FIELDS, PARAMETERS } = userInterface;
        log.error("FIELDS", FIELDS);
        let form = userInterface.createForm(FIELDS.form.main.text);
        form.setClientScript("../TS_CS_E_Payment_Payment_2.1.js");

        form.addFieldGroup(FIELDS.fieldgroup.filters.id, FIELDS.fieldgroup.filters.text);
        let subsidiaryField = form.addField(FIELDS.field.subsidiary.id, serverWidget.FieldType.SELECT, FIELDS.field.subsidiary.text, FIELDS.fieldgroup.filters.id, 'subsidiary');
        subsidiaryField.setDefaultValue(PARAMETERS.subsidiary);
        //subsidiaryField.setIsMandatory(true);

        let bankAccountField = form.addField(FIELDS.field.bankaccount.id, serverWidget.FieldType.SELECT, FIELDS.field.bankaccount.text, FIELDS.fieldgroup.filters.id);
        //bankAccountField.setIsMandatory(true);
        userInterface.setBankAccountFieldData(bankAccountField);
        bankAccountField.setDefaultValue(PARAMETERS.bankaccount);

        let dateFromField = form.addField(FIELDS.field.datefrom.id, serverWidget.FieldType.DATE, FIELDS.field.datefrom.text, FIELDS.fieldgroup.filters.id);
        dateFromField.updateDisplaySize(3, 200);
        dateFromField.setDefaultValue(PARAMETERS.datefrom);

        let dateToField = form.addField(FIELDS.field.dateto.id, serverWidget.FieldType.DATE, FIELDS.field.dateto.text, FIELDS.fieldgroup.filters.id);
        dateToField.updateDisplaySize(3, 200);
        dateToField.setDefaultValue(PARAMETERS.dateto);

        form.addTab(FIELDS.tab.paymentbatch.id, FIELDS.tab.paymentbatch.text);

        let paymentBatchSubList = form.addSublist(FIELDS.sublist.paymentbatch.id, serverWidget.SublistType.LIST, FIELDS.sublist.paymentbatch.text);
        paymentBatchSubList.addSublistField(FIELDS.sublistfield.select.id, serverWidget.FieldType.CHECKBOX, FIELDS.sublistfield.select.text);
        //paymentBatchSubList.addSublistField(FIELDS.sublistfield.paymentbatchid.id, serverWidget.FieldType.INTEGER, FIELDS.sublistfield.paymentbatchid.text);
        paymentBatchSubList.addSublistField(FIELDS.sublistfield.paymentbatchid.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.paymentbatchid.text);
        paymentBatchSubList.addSublistField(FIELDS.sublistfield.paymentdate.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.paymentdate.text);
        paymentBatchSubList.addSublistField(FIELDS.sublistfield.account.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.account.text);
        paymentBatchSubList.addSublistField(FIELDS.sublistfield.number.id, serverWidget.FieldType.INTEGER, FIELDS.sublistfield.number.text);
        paymentBatchSubList.addSublistField(FIELDS.sublistfield.files.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.files.text);
        userInterface.setPaymentBatchSublistData(paymentBatchSubList);

        form.addButton(FIELDS.button.cleanfilters.id, FIELDS.button.cleanfilters.text, FIELDS.button.cleanfilters.function);
        form.addSubmitButton(FIELDS.button.process.text);

        context.response.writePage(form.form);
    }

    const selectPaymentBatch = (context) => {
        let selectedPaymentBatchId = getSelectedPaymentBatch(context.request.parameters.custpage_sl_paymentbatchdata);
        redirect.toSuitelet({
            scriptId: 'customscript_ts_ui_e_payment_2_1',
            deploymentId: 'customdeploy_ts_ui_e_payment_third',
            parameters: {
                custpage_f_paymentbatch: selectedPaymentBatchId
            }
        });
    }

    const getSelectedPaymentBatch = (paymentBatchData) => {
        let resultData = [], documents = [];
        try {
            const breakLine = /\u0002/;
            const breakColumns = /\u0001/;
            let lines = paymentBatchData.split(breakLine);
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].split(breakColumns);
                if (line[0] == 'T') {
                    let paymentBatchId = line[1];
                    return paymentBatchId;
                }
            }
            return "";
        } catch (error) {
            log.error("An error was found in [getSelectedPaymentBatch] function", error);
        }

        return { data: resultData, documents };
    }

    const loadPaymentBatch = (context) => { //* vista Procesar Archivo de Retorno
        log.error("loadPaymentBatch", "START");
        let userInterface = new library.UserInterface(context.request.parameters);
        const { FIELDS, PARAMETERS } = userInterface;
        //log.error("PARAMETERS", PARAMETERS);
        let form = userInterface.createForm(FIELDS.form.main.text);
        form.setClientScript("../TS_CS_E_Payment_Payment_Validate_File_2.1.js");

        form.addFieldGroup(FIELDS.fieldgroup.filters.id, FIELDS.fieldgroup.filters.text);

        let pageField = form.addField(FIELDS.field.page.id, serverWidget.FieldType.TEXT, FIELDS.field.page.text, FIELDS.fieldgroup.filters.id);
        pageField.setDefaultValue(PARAMETERS.page);
        pageField.updateDisplayType(serverWidget.FieldDisplayType.NODISPLAY);

        let paymentBatchField = form.addField(FIELDS.field.paymentbatch.id, serverWidget.FieldType.SELECT, FIELDS.field.paymentbatch.text, FIELDS.fieldgroup.filters.id, 'customrecord_ts_epmt_payment_batch');
        paymentBatchField.setDefaultValue(PARAMETERS.paymentbatch);

        let subsidiaryField = form.addField(FIELDS.field.subsidiary.id, serverWidget.FieldType.SELECT, FIELDS.field.subsidiary.text, FIELDS.fieldgroup.filters.id, 'subsidiary');
        subsidiaryField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

        let bankAccountField = form.addField(FIELDS.field.bankaccount.id, serverWidget.FieldType.SELECT, FIELDS.field.bankaccount.text, FIELDS.fieldgroup.filters.id, 'account');
        bankAccountField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

        let paymentDateField = form.addField(FIELDS.field.paymentdate.id, serverWidget.FieldType.DATE, FIELDS.field.paymentdate.text, FIELDS.fieldgroup.filters.id);
        paymentDateField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

        form.addTab(FIELDS.tab.payments.id, FIELDS.tab.payments.text);

        let paymentsSubList = form.addSublist(FIELDS.sublist.payments.id, serverWidget.SublistType.LIST, FIELDS.sublist.payments.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.select.id, serverWidget.FieldType.CHECKBOX, FIELDS.sublistfield.select.text).updateDisplayType(serverWidget.FieldDisplayType.HIDDEN);
        paymentsSubList.addSublistField(FIELDS.sublistfield.paymentid.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.paymentid.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.documentnumber.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.documentnumber.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.entity.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.entity.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.amount.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.amount.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.paymentmethod.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.paymentmethod.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.status.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.status.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.nro.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.nro.text);
        paymentsSubList.addSublistField(FIELDS.sublistfield.memo.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.memo.text);


        form.addTab(FIELDS.tab.notfound.id, FIELDS.tab.notfound.text);
        let notFoundSubList = form.addSublist(FIELDS.sublist.notfound.id, serverWidget.SublistType.LIST, FIELDS.sublist.notfound.text);
        notFoundSubList.addSublistField(FIELDS.sublistfield.number.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.number.text);
        notFoundSubList.addSublistField(FIELDS.sublistfield.row.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.row.text);

        paymentBatchField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
        subsidiaryField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
        bankAccountField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
        paymentDateField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);
        paymentDateField.updateDisplayType(serverWidget.FieldDisplayType.INLINE);

        let fileField;
        log.error("PARAMETROS", PARAMETERS);
        if (PARAMETERS.file) {
            fileField = form.addField(FIELDS.field.file.id, serverWidget.FieldType.TEXT, FIELDS.field.file.text);
            form.addButton(FIELDS.button.back.id, FIELDS.button.back.text, FIELDS.button.back.function);
        } else {
            fileField = form.addField(FIELDS.field.file.id, serverWidget.FieldType.FILE, FIELDS.field.file.text);
            fileField.setIsMandatory(true);
        }
        userInterface.setAllPaymentBatchFieldValues(subsidiaryField, bankAccountField, paymentDateField, fileField, paymentsSubList, notFoundSubList);
        form.addSubmitButton(FIELDS.button.process.text);
        context.response.writePage(form.form);
    }

    const processPaymentBatch = (context) => {
        log.error("context.request.parameters", context.request.parameters);
        let page = context.request.parameters.custpage_f_page;
        log.error("page", page);
        if (page == "process") {
            let payments = getPaymentsSubListData(context.request.parameters.custpage_sl_paymentsdata);
            let data = getDataForEPaymentReturnFileLog(context.request.parameters, payments);
            let returnFilelog = createReturnFileLog(data);
            if (getInstanceSchedule("customscript_ts_ss_e_payment_create_pay"))
                submitCreatePaymentScheduleTask(returnFilelog, data);
            // submitCreatePaymentScheduleTask(context.request.parameters.custpage_f_paymentbatch, data);
            redirect.toSuitelet({
                scriptId: 'customscript_ts_ui_e_payment_2_1',
                deploymentId: 'customdeploy_ts_ui_e_payment_second'
            });
        } else {
            let paymentBatchId = context.request.parameters.custpage_f_paymentbatch;
            let inputFile = context.request.files.custpage_f_file;
            inputFile.folder = INPUT_FILES_FOLDER_ID;
            let inputFileId = inputFile.save();
            log.error("paymentBatchId", paymentBatchId);
            log.error("inputFileId", inputFileId);
            redirect.toSuitelet({
                scriptId: 'customscript_ts_ui_e_payment_2_1',
                deploymentId: 'customdeploy_ts_ui_e_payment_third',
                parameters: {
                    custpage_f_paymentbatch: paymentBatchId,
                    custpage_f_file: inputFileId,
                    custpage_f_page: "process"
                }
            });
        }
    }

    const getPaymentsSubListData = (sublistData) => {
        let resultData = new Array();
        try {
            const breakLine = /\u0002/;
            const breakColumns = /\u0001/;
            let lines = sublistData.split(breakLine);
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].split(breakColumns);
                let selected = line[0];
                let paymentId = line[1];
                let llave = line[7];
                let memo = line[8];
                let status = "";
                if (line[0] == 'T') {
                    status = "APPROVED";
                } else {
                    status = "REJECTED";
                }
                resultData.push({ PaymentID: paymentId, status, llave, memo });
            }
        } catch (error) {
            log.error("An error was found in [getSublistData] function", error);
        }

        return resultData;
    }

    const getDataForEPaymentReturnFileLog = (params, payments) => {
        return {
            paymentBatchID: params.custpage_f_paymentbatch,
            payments
        };
    }

    const createReturnFileLog = (data) => {
        let returnFileLog = record.create({ type: "customrecord_ts_epmt_return_file_log" });
        returnFileLog.setValue("custrecord_ts_epmt_ret_file_log_user", userRecord.id);
        returnFileLog.setValue("custrecord_ts_epmt_ret_file_log_startdat", new Date());
        returnFileLog.setValue("custrecord_ts_epmt_ret_file_log_status", "PENDIENTE");
        returnFileLog.setValue("custrecord_ts_epmt_ret_file_log_data", JSON.stringify(data));
        return returnFileLog.save();
    }

    const submitCreatePaymentScheduleTask = (paymentBatchId, data) => {
        // log.error('submitCreatePaymentScheduleTask', data);
        // saveJson(data, 'submitCreatePaymentScheduleTask')
        // log.error('submitCreatePaymentScheduleTask', paymentBatchId);
        let scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_ts_ss_e_payment_create_pay',
            deploymentId: 'customdeploy_ts_ss_e_payment_create_pay',
            params: {
                custscript_ts_ss_e_payment_jason: data,
                custscript_ts_ss_e_payment_id_log: paymentBatchId
            }
        });
        scriptTask.submit();
    }

    const saveJson = (contents, nombre) => {
        let name = new Date();
        let fileObj = file.create({
            name: `${nombre}_${name}.json`,
            fileType: file.Type.JSON,
            contents: JSON.stringify(contents),
            folder: 6322,
            isOnline: false
        });
        // Save the file
        let id = fileObj.save();
    }

    return {
        onRequest
    };
}
)