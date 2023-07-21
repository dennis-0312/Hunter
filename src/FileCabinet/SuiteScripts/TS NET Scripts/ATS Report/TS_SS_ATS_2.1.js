/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
*/

define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', "N/config", "N/format", "N/task"],
    function (search, record, runtime, log, file, config, format, task) {
        let currentScript = runtime.getCurrentScript();
        const MAX_FILE_SIZE = 9400000;
        const MAX_REMAINING_USAGE = 200;
        const MAX_PAGINATION_SIZE = 1000;

        const execute = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);
                let auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);
                //if (!scriptParameters.logRecordId) scriptParameters.logRecordId = createLogRecord(scriptParameters, environmentFeatures.hasSubsidiaries, auxiliaryRecords);
                //getTransactionData(scriptParameters, environmentFeatures, auxiliaryRecords);
                let purchaseTransactionsArray = getPurchaseTransactions(scriptParameters, environmentFeatures, auxiliaryRecords);

                buildTemplateObject(environmentFeatures, scriptParameters, auxiliaryRecords, purchaseTransactionsArray);
                jsonForEmail.body = RenderTemplate.createFileRender(jsonData, FTL_TEMPLATE_NAME);


            } catch (error) {
                log.error("error", error);
            }
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};
            scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ns_ple_2021_subsidiary_schdl');
            scriptParameters.periodId = currentScript.getParameter('custscript_ns_ple_2021_period_schdl');
            scriptParameters.format = currentScript.getParameter('custscript_ns_ple_2021_format_schdl');
            scriptParameters.page = Number(currentScript.getParameter("custscript_ns_ple_2021_page_schdl"));
            scriptParameters.auxiliaryFileNumber = Number(currentScript.getParameter("custscript_ns_ple_2021_auxfilenumb_schdl"));
            scriptParameters.logRecordId = currentScript.getParameter("custscript_ns_ple_2021_logid_schdl");
            scriptParameters.folderId = currentScript.getParameter("custscript_ns_filecabinet_id");
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const createLogRecord = (scriptParameters, hasSubsidiariesFeature, auxiliaryRecords) => {
            let logRecord = record.create({
                type: "customrecord_ns_custrec_gen_logs"
            });

            if (hasSubsidiariesFeature) {
                logRecord.setValue("custrecord_ns_subsidiary_log", scriptParameters.subsidiaryId);
            }

            logRecord.setValue("custrecord_ns_report_log", "Procesando...");
            logRecord.setValue("custrecord_ns_status_log", "Procesando...");
            logRecord.setValue("custrecord_ns_file_cabinet_log", "");
            logRecord.setValue("custrecord_ns_book_log", "Libro de Inv. y Bal - Detalle Saldo Cuenta 20/21");
            logRecord.setValue("custrecord_ns_periodo_log", auxiliaryRecords.period.periodIdForLog);
            return logRecord.save();
        }

        const getEnviromentFeatures = () => {
            let features = {};
            features.hasSubsidiaries = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            return features;
        }

        const getAuxiliaryRecords = (environmentFeatures, scriptParameters) => {
            let auxiliaryFields = {};

            auxiliaryFields.subsidiary = getSubsidiaryRecord(environmentFeatures.hasSubsidiaries, environmentFeatures.hasSuiteTax, scriptParameters.subsidiaryId);

            auxiliaryFields.period = getPeriodRecord(scriptParameters.periodId);

            return auxiliaryFields;
        }

        const getSubsidiaryRecord = (hasSubsidiariesFeature, hasSuiteTax, subsidiaryId) => {
            let subsidiaryRecord = {
                taxidnum: "",
                name: "",
                legalname: ""
            };
            try {
                if (hasSubsidiariesFeature) {
                    if (!subsidiaryId) return subsidiaryRecord;
                    let taxColumn = hasSuiteTax ? "taxregistrationnumber" : "taxidnum";
                    let subsidiarySearch = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiaryId,
                        columns: [taxColumn, "name", "legalname"]
                    });
                    subsidiaryRecord.taxidnum = subsidiarySearch[taxColumn];
                    subsidiaryRecord.name = subsidiarySearch.name;
                    subsidiaryRecord.legalname = subsidiarySearch.legalname;
                } else {
                    let company = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    subsidiaryRecord.taxidnum = company.getValue("employerid");
                    subsidiaryRecord.name = "";
                    subsidiaryRecord.legalname = "";
                }
            } catch (error) {
                log.error("An error was found in [getSubsidiaryRecord]", error);
            }
            return subsidiaryRecord;
        }

        const getPeriodRecord = (periodId) => {
            let periodRecord = {
                endDate: "",
                periodYear: "",
                periodIdForLog: ""
            };
            try {
                let periodSearch = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: periodId,
                    columns: ['startdate']
                });
                let startDate = format.parse({
                    value: periodSearch.startdate,
                    type: format.Type.DATE
                });
                let periodYear = startDate.getFullYear();
                let periodEndDate = new Date(periodYear, 11, 31);
                periodRecord.periodYear = periodYear;
                periodRecord.endDate = format.format({
                    value: periodEndDate,
                    type: format.Type.DATE
                });
                periodRecord.periodIdForLog = getPeriodForLog(periodRecord.endDate);
            } catch (error) {
                log.error("An error was found in [getPeriodRecord]", error);
            }
            return periodRecord;
        }

        const getPeriodForLog = (periodEndDate) => {
            let resultSearch = search.create({
                type: "accountingperiod",
                filters: [
                    ["enddate", "on", periodEndDate]
                ],
                columns: [
                    search.createColumn({
                        name: "internalid",
                        sort: search.Sort.DESC,
                        label: "Internal ID"
                    })
                ]
            }).run().getRange(0, 10);
            let periodId = resultSearch[0].getValue(resultSearch[0].columns[0]);
            return periodId;
        }

        const getPurchaseTransactions = (scriptParameters, environmentFeatures, auxiliaryRecords) => {
            let savedSearch = search.load({ id: "customsearch_ns_pe_inv_bal_det_20_21" });

        }

        const buildTemplateObject = (environmentFeatures, scriptParameters, auxiliaryRecords, purchaseTransactionsArray) => {
            let fileIdArray = scriptParameters.auxiliaryFileId.split("|");
            let fileContentArray = getFileIdArray(fileIdArray);
        }

        const getAuxiliaryFilesData = (scriptParameters, alertsJson) => {
            let fileIdArray = scriptParameters.auxiliaryFileId.split("|");
            let fileContentArray = getFileIdArray(fileIdArray);
            let templateObjectJson = buildTemplateObjectJson(fileContentArray, alertsJson);
            return templateObjectJson;
        }

        return {
            execute
        };
    }
)