/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/record', 'N/runtime', 'N/task', 'N/render', 'N/format', 'N/file', 'N/search', 'N/url',
    '../render/TS_LBRY_E_Payment_Render_Template_2.1.js',
    './TS_LBRY_E_Payment_Access_Data_2.1.js',
    './TS_LBRY_E_Payment_Columns_2.1.js'
], function (record, runtime, task, render, format, file, search, url, RENDER_TEMPLATE, EPMT_ACCES_DATA, EPMT_COLUMNS) {
    let currentScript = runtime.getCurrentScript();
    const PAYMENT_ORDER_RECORD_ID = 'customrecord_ts_epmt_payment_batch';
    const PAYMENT_ORDER_DETAIL_RECORD_ID = 'customrecord_ts_epmt_payment';
    const PDF_FOLDER_ID = "6503"; //SB: 6322 - PR 6503 /Path: SuiteScripts > Pago Electronico Personalizado
    const PDF_TEMPLATE = "../templates/TS_FTL_E_Payment_PDF.ftl";

    const execute = (context) => {
        try {
            let scriptParameters = getScriptParameters();
            let deploymentId = currentScript.deploymentId;
            log.error("execute", { scriptParameters, deploymentId });
            if (deploymentId == "customdeploy_ts_ss_epmt_payment_batch_ge") {
                if (!scriptParameters.paymentLotIds) {
                    let ePaymentLogData = getEPaymentLogData();
                    if (ePaymentLogData.length) {
                        let paymentLotIds = createPaymentLotRecords(ePaymentLogData, scriptParameters.emitido);
                        callScheduleScript(paymentLotIds, scriptParameters.emitido);
                    }
                } else {
                    let paymentLotIds = scriptParameters.paymentLotIds.split(',');
                    let jsonData = buildJsonData(paymentLotIds, scriptParameters.emitido);
                    generateFiles(jsonData, true, true);
                }
            } else if (deploymentId == "") { }
        } catch (error) {
            log.error("An error was ocurred in [execute]", error);
        }
    }

    const getScriptParameters = () => {
        let scriptParameters = new Object();
        scriptParameters.paymentLotIds = currentScript.getParameter('custscript_ts_ss_epmt_ppg_paymentlot_ids');
        scriptParameters.emitido = currentScript.getParameter('custscript_ts_ss_epmt_ppg_emitido');
        log.error("scriptParameters", scriptParameters);
        return scriptParameters;
    }

    const buildJsonData = (paymentLotIds, emitido) => {
        //emitido == 'F' ? log.error('No es emitido') : log.error('Es emitido');
        if (!paymentLotIds.length) return;
        let transactionsJSON = new Object();
        let columns = EPMT_COLUMNS.getColumns(["customrecord_ts_epmt_payment_file_format"]);
        let paymentBatchJSON = EPMT_ACCES_DATA.getEPaymentPaymentBatchRecord(columns.epayment_payment_batch_columns, paymentLotIds);
        paymentBatchJSON = EPMT_ACCES_DATA.getEPaymentPaymentRecord(paymentBatchJSON, columns.epayment_payment_columns, paymentLotIds);
        let { customerIds, vendorIds, employeeIds, transactionsIds } = getRecordIdValues(paymentBatchJSON);
        let customersJSON = EPMT_ACCES_DATA.getCustomers(columns.customer_columns, customerIds);
        let vendorsJSON = EPMT_ACCES_DATA.getVendors(columns.vendor_columns, vendorIds);
        let employeesJSON = EPMT_ACCES_DATA.getEmployees(columns.employee_columns, employeeIds);
        log.error("transactionsIds", transactionsIds);
        if (emitido == 'F') {
            transactionsJSON = EPMT_ACCES_DATA.getTransactions(columns.transaction_columns, transactionsIds);
        } else {
            transactionsJSON = EPMT_ACCES_DATA.getEmitidos(columns.emitidos_columns, transactionsIds);
        }
        EPMT_ACCES_DATA.getCustomerBankDetailRecord(paymentBatchJSON, columns.bank_detail_columns, customerIds);
        EPMT_ACCES_DATA.getVendorBankDetailRecord(paymentBatchJSON, columns.bank_detail_columns, vendorIds);
        EPMT_ACCES_DATA.getEmployeeBankDetailRecord(paymentBatchJSON, columns.bank_detail_columns, employeeIds);
        log.error("transactionsJSON", transactionsJSON);
        let templatesJSON = EPMT_ACCES_DATA.getCustomRecord("customrecord_ts_epmt_payment_file_format", columns.customrecord_ts_epmt_payment_file_format);
        let subsidiariesJSON = EPMT_ACCES_DATA.getSubsidiaries(columns.subsidiary_columns);
        log.error('subsidiariesJSON', subsidiariesJSON);

        return {
            paymentBatch: paymentBatchJSON,
            customers: customersJSON,
            vendors: vendorsJSON,
            employees: employeesJSON,
            templates: templatesJSON,
            transactions: transactionsJSON,
            subsidiaries: subsidiariesJSON
        };
    }

    const getRecordIdValues = (json) => {
        let customerIds = [], vendorIds = [], employeeIds = [];
        let transactionsIds = [];
        for (let id in json) {
            let paymentBatch = json[id];
            for (let i = 0; i < paymentBatch.detail.length; i++) {
                let ePaymentPayment = paymentBatch.detail[i];
                log.error("getRecordIdValues ePayment", ePaymentPayment);
                if (ePaymentPayment["custrecord_ts_epmt_prepaydet_entity.type"].value == "Employee") {
                    employeeIds.push(ePaymentPayment.custrecord_ts_epmt_prepaydet_entity.value);
                } else if (ePaymentPayment["custrecord_ts_epmt_prepaydet_entity.type"].value == "Vendor") {
                    vendorIds.push(ePaymentPayment.custrecord_ts_epmt_prepaydet_entity.value);
                } else if (ePaymentPayment["custrecord_ts_epmt_prepaydet_entity.type"].value == "CustJob") {
                    customerIds.push(ePaymentPayment.custrecord_ts_epmt_prepaydet_entity.value);
                }
                log.error("ePaymentPayment.custrecord_ts_epmt_prepaydet_origin_tran.value", ePaymentPayment.custrecord_ts_epmt_prepaydet_origin_tran.value);
                transactionsIds.push(ePaymentPayment.custrecord_ts_epmt_prepaydet_origin_tran.value);
            }
        }
        return { customerIds, vendorIds, employeeIds, transactionsIds };
    }

    const generateFiles = (jsonData, printPDF, printTXT) => {
        for (let ePaymentPaymentBatchId in jsonData.paymentBatch) {
            let ePaymentPaymentJSON = jsonData.paymentBatch[ePaymentPaymentBatchId];
            let templateJSON = jsonData.templates[ePaymentPaymentJSON.custrecord_ts_epmt_prepmt_tef_template.value];
            let subsidiaryJSON = jsonData.subsidiaries[ePaymentPaymentJSON.custrecord_ts_epmt_prepmt_subsidiary.value];
            // let objetoJSON = jsonData.transactions;
            // let key = Object.keys(objetoJSON)[0];
            // let numeroCompleto = key.toString().padStart(15, '0');
            // objetoJSON[key].id = numeroCompleto;
            let txtDataJson = {
                paymentBatch: ePaymentPaymentJSON,
                customers: jsonData.customers,
                vendors: jsonData.vendors,
                employees: jsonData.employees,
                transactions: jsonData.transactions,
                subsidiary: subsidiaryJSON
            };
            if (printTXT) generateTXT(txtDataJson, ePaymentPaymentBatchId, templateJSON);
            if (printPDF) generatePDF(txtDataJson, ePaymentPaymentBatchId);
        }
    }

    const getFileName = (txtDataJson, extension) => {
        var customrecord_ts_epmt_payment_batchSearchObj = search.create({
            type: "customrecord_ts_epmt_log",
            filters:
                [["created", "within", "today"]],
            columns:
                ["internalid"]
        });
        var searchResultCount = customrecord_ts_epmt_payment_batchSearchObj.runPaged().count;

        // log.debug("customrecord_ts_epmt_payment_batchSearchObj result count", searchResultCount);
        // customrecord_ts_epmt_payment_batchSearchObj.run().each(function (result) {
        //     // .run().each has a limit of 4,000 results
        //     return true;
        // });
        return `${txtDataJson.subsidiary.name}${formatDate(txtDataJson.paymentBatch.custrecord_ts_epmt_prepmt_payment_date)}${searchResultCount + 1}${extension}`;
    }

    const formatDate = (date) => {
        let objectDate = new Date(date);
        let year = objectDate.getFullYear();
        let month = objectDate.getMonth() + 1 < 10 ? `0${objectDate.getMonth() + 1}` : objectDate.getMonth() + 1;
        let day = objectDate.getDate();
        return `${year}${month}${day}`;
    }

    const generateTXT = (txtDataJson, ePaymentPaymentBatchId, templateJSON) => {
        let name = getFileName(txtDataJson, templateJSON.custrecord_ts_epmt_pff_output_file_exten);
        name = name.replace(/\s/g, "").split(":")[1];
        log.error("name", name);

        //log.error("txtDataJson", txtDataJson);
        let outputFileContents = RENDER_TEMPLATE.createFileRender(txtDataJson, templateJSON.custrecord_ts_epmt_pff_free_marker_body);
        log.error("outputFileContents", outputFileContents);
        let fileId = file.create({
            name,
            fileType: file.Type.PLAINTEXT,
            contents: outputFileContents,
            encoding: file.Encoding.UTF_8,
            folder: PDF_FOLDER_ID
        }).save();
        let paymentBatchFile = file.load({ id: fileId });
        var domainUrl = url.resolveDomain({ hostType: url.HostType.APPLICATION });
        let fullUrl = `https://${domainUrl}${paymentBatchFile.url}`;
        log.error("url TXT", fullUrl);
        updateEPaymentPrePayment(ePaymentPaymentBatchId, fullUrl, "template");
        return paymentBatchFile.url;
    }

    const generatePDF = (txtDataJson, ePaymentPaymentBatchId, templateJSON) => {
        let name = getPDFFileName(txtDataJson);
        log.error("name", name);
        let templateFile = file.load({ id: PDF_TEMPLATE });
        log.error("templateFile", templateFile);
        let outputFileContents = RENDER_TEMPLATE.createPDFFileRender(txtDataJson, templateFile.getContents());
        outputFileContents.name = name;
        outputFileContents.folder = PDF_FOLDER_ID;
        let fileId = outputFileContents.save();
        /*let fileId = file.create({
            name,
            fileType: file.Type.PDF,
            contents: outputFileContents.getContents(),
            folder: PDF_FOLDER_ID
        }).save();*/
        let paymentBatchFile = file.load({ id: fileId });
        var domainUrl = url.resolveDomain({ hostType: url.HostType.APPLICATION });
        let fullUrl = `https://${domainUrl}${paymentBatchFile.url}`;
        log.error("url PDF", fullUrl);
        updateEPaymentPrePayment(ePaymentPaymentBatchId, fullUrl, "pdf");
        return
    }

    const getPDFFileName = (txtDataJson) => {
        return `${txtDataJson.subsidiary.name}${formatDate(txtDataJson.paymentBatch.custrecord_ts_epmt_prepmt_payment_date)}1.pdf`;
    }

    const updateEPaymentPrePayment = (prePaymentId, fileUrl, fileType) => {
        let values = {};
        if (fileType == 'pdf') {
            values.custrecord_ts_epmt_prepmt_pdf_file_url = fileUrl;
        } else if (fileType == 'template') {
            values.custrecord_ts_epmt_prepmt_tef_file_url = fileUrl;
            values.custrecord_ts_epmt_prepmt_status = 'Generado';
        }
        record.submitFields({
            type: "customrecord_ts_epmt_payment_batch",
            id: prePaymentId,
            values
        });
    }

    const getEPaymentLogData = () => {
        let ePaymentLogdDataResult = [];
        let newSearch = search.create({
            type: "customrecord_ts_epmt_log",
            filters: [
                ["isinactive", "is", "F"],
                "AND",
                ["custrecord_ts_epmt_log_status", "is", "Por Procesar"]
            ],
            columns: ["custrecord_ts_epmt_log_data"]
        });
        let result = newSearch.run().getRange(0, 1000);

        for (let i = 0; i < result.length; i++) {
            let columns = result[i].columns;
            let ePaymentLogId = result[i].id;
            let data = JSON.parse(result[i].getValue(columns[0]));
            log.error("data", data);
            data.ePaymentLogId = ePaymentLogId;
            ePaymentLogdDataResult.push(data);
        }
        return ePaymentLogdDataResult;
    }

    const createPaymentLotRecords = (ePaymentLogData, emitido) => {
        let paymentLotIds = [];
        for (let i = 0; i < ePaymentLogData.length; i++) {
            let ePaymentLog = ePaymentLogData[i];
            try {
                if (ePaymentLog.detail === undefined || ePaymentLog.detail.length == 0) { }
                let prePaymentId = createEPaymentPaymentBatch(ePaymentLog);
                log.error("prePaymentId", prePaymentId);
                let generatedePaymentPayment = createEPaymentePayment(prePaymentId, ePaymentLog.detail, emitido);
                paymentLotIds.push(prePaymentId);
                updateEPaymentLog(ePaymentLog.ePaymentLogId, prePaymentId, generatedePaymentPayment);
            } catch (error) {
                log.error("Ocurrión un error", error);
                // Controlar Errores
            }
        }
        log.error("ids", paymentLotIds);
        return paymentLotIds;
    }

    const createEPaymentPaymentBatch = (ePaymentLog) => {
        let prePaymentRecord = record.create({ type: PAYMENT_ORDER_RECORD_ID, isDynamic: true });
        log.error("ePaymentLog", ePaymentLog)
        prePaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepmt_bank_account', value: ePaymentLog.bankAccount });
        prePaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepmt_currency', value: ePaymentLog.currency });
        prePaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepmt_status', value: "Registrado" });
        prePaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepmt_subsidiary', value: ePaymentLog.subsidiary });
        prePaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepmt_payment_date', value: getDateFormat(ePaymentLog.paymentDate) });
        prePaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepmt_tef_template', value: ePaymentLog.tefTemplate });
        return prePaymentRecord.save();
    }

    const createEPaymentePayment = (prePaymentId, detail, emitido) => {
        let generatedePaymentPayment = [];
        for (let i = 0; i < detail.length; i++) {
            let detailLine = detail[i];
            let ePaymentPaymentRecord = record.create({ type: PAYMENT_ORDER_DETAIL_RECORD_ID, isDynamic: true });
            log.error("createEPaymentePayment", detailLine);
            ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_pre_payment', value: prePaymentId });
            ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_origin_tran', value: detailLine[0] });
            ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_paym_method', value: detailLine[1] });
            ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_entity', value: detailLine[2] });
            ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_tran_amount', value: detailLine[3] });
            // ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_paym_amount', value: detailLine[4] });
            ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_paym_amount', value: detailLine[3] });
            ePaymentPaymentRecord.setValue({ fieldId: 'custrecord_ts_epmt_prepaydet_status', value: "Registrado" });
            let ePaymentPaymentId = ePaymentPaymentRecord.save();
            generatedePaymentPayment.push(ePaymentPaymentId);
            updateOrdenPago(detailLine[0], emitido); //!COMENTAR SOLO PARA PRUEBAS Y NO ACTUALICE EL CAMPO ESTADO
        }
        return generatedePaymentPayment;
    }

    const updateEPaymentLog = (ePaymentLogId, prePaymentId, generatedePaymentPayment) => {
        log.error('updateEPaymentLog', 'Entry Update');
        record.submitFields({
            type: "customrecord_ts_epmt_log",
            id: ePaymentLogId,
            values: {
                custrecord_ts_epmt_log_enddate: new Date(),
                custrecord_ts_epmt_log_status: "Generado",
                custrecord_ts_epmt_log_pre_pago: prePaymentId,
                custrecord_ts_epmt_log_result: `Se generó el siguiente lote de pago: ${prePaymentId}`
            }
        });
    }

    const getDateFormat = (date) => {
        return format.parse({ type: format.Type.DATE, value: date });
    }

    const callScheduleScript = (paymentLotIds, emitido) => {
        let scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_ts_ss_epmt_payment_batch_ge',
            deploymentId: 'customdeploy_ts_ss_epmt_payment_batch_ge',
            params: {
                custscript_ts_ss_epmt_ppg_paymentlot_ids: paymentLotIds.join(','),
                custscript_ts_ss_epmt_ppg_emitido: emitido
            }
        });
        scriptTask.submit();
    }

    const updateOrdenPago = (opid, emitido) => {
        try {
            if (emitido == 'F') {
                // log.error('updateOrdenPago', 'Entry Update OP: ' + opid);
                record.submitFields({ type: "customtransaction_orden_pago", id: opid, values: { transtatus: "A" } });
            } else {
                let fieldLookUp = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: opid,
                    columns: ['type']
                });
                //log.error('fieldLookUp', fieldLookUp.type[0].value);
                const tipoRegistros = [
                    { registro: "Check", tipo: "check" },
                    { registro: "VPrep", tipo: "vendorprepayment" },
                    { registro: "VendPymt", tipo: "vendorpayment" }
                ];
                let resultado = tipoRegistros.find((tipo) => tipo.registro === fieldLookUp.type[0].value);
                record.submitFields({
                    type: resultado.tipo,
                    id: opid,
                    values: {
                        custbody_est_emitido: 2,
                        custbody_ht_emitido_pago_electronico: false
                    }
                });
            }
        } catch (error) {
            log.error('updateOrdenPago', error)
        }
    }

    return {
        execute
    }
}
);