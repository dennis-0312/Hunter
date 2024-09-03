/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/log',
    'N/query',
    'N/config',
    'N/task',
    'N/redirect',
    './lib/TS_LBRY_EC_Report_Generator_2.1.js'
], (serverWidget, search, log, query, config, task, redirect, library) => {

    const FOLDER_ID = "585";

    const onRequest = (context) => {
        try {
            var method = context.request.method;
            let userInterface = new library.UserInterface(context.request.parameters);
            const FIELDS = userInterface.FIELDS;
            log.error('FIELDS', FIELDS);
            if (method == 'GET') {

                //const PARAMETERS = userInterface.getFormattedParameters();


                let form = userInterface.createForm(FIELDS.form.main.text);
                form.setClientScript("../TS_CS_EC_Report_Generator_2.1.js");

                form.addFieldGroup(FIELDS.fieldgroup.primary.id, FIELDS.fieldgroup.primary.text);
                let reportField = form.addField(FIELDS.field.report.id, serverWidget.FieldType.SELECT, FIELDS.field.report.text, FIELDS.fieldgroup.primary.id, 'customrecord_ts_ec_libros_legales');

                form.addFieldGroup(FIELDS.fieldgroup.filters.id, FIELDS.fieldgroup.filters.text);
                let subsidiaryField = form.addField(FIELDS.field.subsidiary.id, serverWidget.FieldType.SELECT, FIELDS.field.subsidiary.text, FIELDS.fieldgroup.filters.id, 'subsidiary');

                let periodField = form.addField(FIELDS.field.period.id, serverWidget.FieldType.SELECT, FIELDS.field.period.text, FIELDS.fieldgroup.filters.id, 'accountingperiod');

                let startDateField = form.addField(FIELDS.field.startdate.id, serverWidget.FieldType.DATE, FIELDS.field.startdate.text, FIELDS.fieldgroup.filters.id);

                let endDateField = form.addField(FIELDS.field.enddate.id, serverWidget.FieldType.DATE, FIELDS.field.enddate.text, FIELDS.fieldgroup.filters.id);

                let formatField = form.addFormatField(FIELDS.field.format.id, serverWidget.FieldType.SELECT, FIELDS.field.format.text, FIELDS.fieldgroup.filters.id);

                let resultSubList = form.addSublist(FIELDS.sublist.results.id, serverWidget.SublistType.STATICLIST, FIELDS.sublist.results.text);
                resultSubList.addField(FIELDS.sublistfield.id.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.id.text);
                resultSubList.addField(FIELDS.sublistfield.datecreated.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.datecreated.text);
                resultSubList.addField(FIELDS.sublistfield.createdby.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.createdby.text);
                resultSubList.addField(FIELDS.sublistfield.subsidiary.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.subsidiary.text);
                resultSubList.addField(FIELDS.sublistfield.period.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.period.text);
                resultSubList.addField(FIELDS.sublistfield.report.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.report.text);
                resultSubList.addField(FIELDS.sublistfield.filename.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.filename.text);
                resultSubList.addField(FIELDS.sublistfield.url.id, serverWidget.FieldType.TEXT, FIELDS.sublistfield.url.text);
                userInterface.setResultSubListData(resultSubList);
                resultSubList.addRefreshButton();
                form.addSubmitButton(FIELDS.button.submit.text);

                context.response.writePage(form.form);

            } else if (method == 'POST') {
                let reportId = context.request.parameters.custpage_f_report;
                let subsidiaryId = context.request.parameters.custpage_f_subsidiary;
                let periodId = context.request.parameters.custpage_f_period;
                let format = context.request.parameters.custpage_f_format;

                log.error("params", { reportId, subsidiaryId, periodId, format });
                log.error("format", format);

                let params = {};

                if (format == 'XLSX') {
                    params.custscript_ts_ss_ec_ats_xls_subsidiary = subsidiaryId;
                    params.custscript_ts_ss_ec_ats_xls_period = periodId;
                    params.custscript_ts_ss_ec_ats_xls_report = reportId;
                    params.custscript_ts_ss_ec_ats_xls_folder = FOLDER_ID;
                    params.custscript_ts_ss_ec_ats_xls_formato = format;
                    log.error("params", params);
                    if (reportId == "1") {
                        let scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_ts_ss_ec_ats_xls',
                            deploymentId: 'customdeploy_ts_ss_ec_ats_xls',
                            params
                        });
                        var scriptTaskId = scriptTask.submit();
                    }
                } else {
                    params.custscript_ts_ss_ec_atsinfo_subsidiary = subsidiaryId;
                    params.custscript_ts_ss_ec_atsinfo_period = periodId;
                    params.custscript_ts_ss_ec_atsinfo_report = reportId;
                    params.custscript_ts_ss_ec_atsinfo_folder = FOLDER_ID;
                    params.custscriptts_ss_ec_atsinfo_formato = format;
                    log.error("params", params);
                    if (reportId == "1") {
                        let scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_ts_ss_ats_informante',
                            deploymentId: 'customdeploy_ts_ss_ec_ats_informante',
                            params
                        });
                        var scriptTaskId = scriptTask.submit();
                    }
                }

                redirect.toSuitelet({
                    scriptId: 'customscript_ts_ui_ec_report_generator',
                    deploymentId: 'customdeploy_ts_ui_ec_report_generator'
                });
            }
        } catch (error) {
            log.error("error", error);
        }
    }

    return {
        onRequest
    }
})