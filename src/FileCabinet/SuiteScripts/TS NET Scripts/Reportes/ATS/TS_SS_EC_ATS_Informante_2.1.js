/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/log', 'N/runtime', 'N/task', 'N/format', 'N/file', 'N/search', 'N/record'],
    (log, runtime, task, format, file, search, record) => {
        let currentScript = runtime.getCurrentScript();

        const execute = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);
                //let auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);

                let atsInformanteString = getATSInformante(scriptParameters, environmentFeatures);
                log.error("atsInformanteString",atsInformanteString);
                scriptParameters.atsFilesId = saveFile(atsInformanteString, scriptParameters) + '|';

                executeMapReduce(scriptParameters, environmentFeatures);
            } catch (error) {
                log.error("error", error)
            }
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};

            if (environmentFeatures.hasSubsidiaries)
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_ss_ec_atsinfo_subsidiary');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_ss_ec_atsinfo_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_ss_ec_atsinfo_folder');
            scriptParameters.reportId = currentScript.getParameter('custscript_ts_ss_ec_atsinfo_report');
            scriptParameters.format = currentScript.getParameter('custscriptts_ss_ec_atsinfo_formato');
            scriptParameters.logId = createLogRecord(scriptParameters, environmentFeatures.hasSubsidiaries);

            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const getEnviromentFeatures = () => {
            let features = {};
            features.hasSubsidiaries = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            return features;
        }

        /*
        const getAuxiliaryRecords = (environmentFeatures, scriptParameters) => {
            let auxiliaryFields = {};

            auxiliaryFields.subsidiary = getSubsidiaryRecord(environmentFeatures.hasSubsidiaries, scriptParameters.subsidiaryId);

            auxiliaryFields.period = getPeriodRecord(scriptParameters.periodId);

            return auxiliaryFields;
        }*/

        const getSubsidiaryRecord = (hasSubsidiariesFeature, subsidiaryId) => {
            let subsidiaryRecord = {
                taxidnum: "",
                name: "",
                legalname: ""
            };
            try {
                if (hasSubsidiariesFeature) {
                    if (!subsidiaryId) return subsidiaryRecord;
                    let subsidiarySearch = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiaryId,
                        columns: ["taxidnum", "name", "legalname"]
                    });
                    subsidiaryRecord.taxidnum = subsidiarySearch.taxidnum;
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
                startDate: "",
                year: "",
                month: ""
            };
            try {
                var periodSearch = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: periodId,
                    columns: ['startdate', 'enddate']
                });
                periodRecord.startDate = periodSearch.startdate;
                periodRecord.endDate = periodSearch.enddate;
                let startDate = format.parse({
                    value: periodSearch.startdate,
                    type: format.Type.DATE
                });
                periodRecord.day = startDate.getDate();
                periodRecord.year = startDate.getFullYear();
                periodRecord.month = ('0' + (startDate.getMonth() + 1)).slice(-2);
            } catch (error) {
                log.error("An error was found in [getPeriodRecord]", error);
            }
            return periodRecord;
        }

        const getATSInformante = (scriptParameters, environmentFeatures) => {
            log.debug('getATSInformante.scriptParameters', scriptParameters);
            log.debug('getATSInformante.environmentFeatures', environmentFeatures);
            let atsInformanteSearch = search.load({
                id: 'customsearch_ts_ec_ats_informante'
            });

            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.periodId
                });
                atsInformanteSearch.filters.push(periodFilter);
            }

            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.subsidiaryId
                });
                atsInformanteSearch.filters.push(subsidiaryFilter);
            }

            let searchResult = atsInformanteSearch.run().getRange(0, 1000);
            log.error("searchResult.length", searchResult.length);
            if (!searchResult.length) return "";

            let rowArray = [];
            let columns = searchResult[0].columns;
            // 1 Tipo ID Informante
            rowArray[0] = searchResult[0].getValue(columns[0]);

            // 2 Identificacion Informante
            rowArray[1] = searchResult[0].getValue(columns[1]);

            // 3 Razon Social
            rowArray[2] = searchResult[0].getValue(columns[2]);

            // 4 Año
            rowArray[3] = searchResult[0].getValue(columns[3]);

            // 5 Mes
            rowArray[4] = searchResult[0].getValue(columns[4]);

            // 6 Numero de Establecimientos
            rowArray[5] = searchResult[0].getValue(columns[5]);

            // 7 Total Ventas
            rowArray[6] = searchResult[0].getValue(columns[6]);

            //8 Codigo Operativo
            rowArray[7] = searchResult[0].getValue(columns[7]);

            log.error("rowArray", rowArray);
            return rowArray.join('|');
        }

        const getFileName = (scriptParameters) => {
            return `IDENTIFICACION DEL INFORMANTE(${scriptParameters.subsidiaryId}, ${scriptParameters.periodId}).txt`;
        }

        const saveFile = (contents, scriptParameters) => {
            let name = getFileName(scriptParameters);

            let plainTextFile = file.create({
                name,
                fileType: file.Type.PLAINTEXT,
                contents,
                encoding: file.Encoding.UTF8,
                folder: scriptParameters.folderId
            });
            return plainTextFile.save();
        }

        const executeMapReduce = (scriptParameters, environmentFeatures) => {
            let params = {};

            if (environmentFeatures.hasSubsidiaries) {
                params['custscript_ts_mr_ec_ats_com_det_subsidia'] = scriptParameters.subsidiaryId;
            }
            params['custscript_ts_mr_ec_ats_com_det_period'] = scriptParameters.periodId;

            params['custscript_ts_mr_ec_ats_com_det_folder'] = scriptParameters.folderId;

            params['custscript_ts_mr_ec_ats_com_det_atsfiles'] = scriptParameters.atsFilesId;

            params['custscript_ts_mr_ec_ats_com_det_logid'] = scriptParameters.logId;
            //<I> rhuaccha: 2024-02-26
            params['custscript_ts_mr_ec_ats_com_det_formato'] = scriptParameters.format;
            //<F> rhuaccha: 2024-02-26

            log.error("executeMapReduce", params);
            let newTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ts_mr_ec_ats_compra_detalla',
                deploymentId: 'customdeploy_ts_mr_ec_ats_compra_detalla',
                params
            });
            newTask.submit();
        }

        const createLogRecord = (scriptParameters, hasSubsidiariesFeature) => {
            let logRecord = record.create({
                type: "customrecord_ts_ec_rpt_generator_log"
            });
    
            if (hasSubsidiariesFeature) {
                logRecord.setValue("custrecord_ts_ec_log_rpt_gen_subsidiaria", scriptParameters.subsidiaryId);
            }
    
            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_periodo", scriptParameters.periodId);
            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_estado", "Procesando...");
            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_libro_legal", "Procesando...");
            logRecord.setValue("custrecord_ts_ec_log_rpt_gen_report", "Reporte ATS");

            return logRecord.save();
        }

        return {
            execute
        }
    }
)