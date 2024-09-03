/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
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
            var auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);

            getTransactions(scriptParameters, environmentFeatures, auxiliaryRecords);

        } catch (error) {
            log.error("error", error);
        }
    }

    const getEnviromentFeatures = () => {
        let features = {};
        features.hasSubsidiaries = runtime.isFeatureInEffect({
            feature: "SUBSIDIARIES"
        });
        return features;
    }

    const getScriptParameters = (environmentFeatures) => {
        let scriptParameters = {};
        scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_sc_ple_9_2_subsidiary');
        scriptParameters.periodId = currentScript.getParameter('custscript_ts_sc_ple_9_2_period');
        scriptParameters.format = currentScript.getParameter("custscript_ts_sc_ple_9_2_format");
        scriptParameters.folderId = currentScript.getParameter("custscript_ts_sc_ple_9_2_folderid");
        scriptParameters.page = Number(currentScript.getParameter("custscript_ts_sc_ple_9_2_num_pag")) || 0;
        scriptParameters.auxiliaryFileNumber = Number(currentScript.getParameter("custscript_ts_sc_ple_9_2_num_archv")) || 0;
        if (!scriptParameters.logRecordId && scriptParameters.auxiliaryFileNumber == 0) scriptParameters.logRecordId = createLogRecord(scriptParameters, environmentFeatures.hasSubsidiaries);

        log.error("scriptParameters", scriptParameters);
        return scriptParameters;
    }

    const getAuxiliaryRecords = (environmentFeatures, scriptParameters) => {
        let auxiliaryFields = {};

        auxiliaryFields.subsidiary = getSubsidiaryRecord(environmentFeatures.hasSubsidiaries, scriptParameters.subsidiaryId);

        auxiliaryFields.period = getPeriodRecord(scriptParameters.periodId);

        return auxiliaryFields;
    }

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
            var mes = startDate.getMonth() + 1;
            periodRecord.year = startDate.getFullYear();
            periodRecord.month = `${mes < 10 ? '0' : ''}${mes}`;
            
            //periodRecord.periodIdForLog = getPeriodForLog(periodRecord.endDate);
        } catch (error) {
            log.error("An error was found in [getPeriodRecord]", error);
        }
        return periodRecord;
    }

    const createLogRecord = (scriptParameters, hasSubsidiariesFeature) => {
        try {
            let logRecord = record.create({
                type: "customrecord_pe_generation_logs"
            });
    
            if (hasSubsidiariesFeature) {
                logRecord.setValue("custrecord_pe_subsidiary_log", scriptParameters.subsidiaryId);
            }
    
            logRecord.setValue("custrecord_pe_period_log", scriptParameters.periodId);
            logRecord.setValue("custrecord_pe_status_log", "Procesando...");
            logRecord.setValue("custrecord_pe_report_log", "Procesando...");
            logRecord.setValue("custrecord_pe_book_log", "Registro de Consignaciones 9.2");
            return logRecord.save();
        } catch (error) {
            log.error('An error was ocurred in [createLogRecord] function', error);
        }
    }

    const getTransactions = (scriptParameters, environmentFeatures, auxiliaryRecords) => {
        let transactionSearch = search.load({ id: "customsearch_pe_libro_mayor_9_2" });

        if (scriptParameters.periodId) {
            let periodFilter = search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.ANYOF,
                values: scriptParameters.periodId
            });
            transactionSearch.filters.push(periodFilter);
        }

        if (environmentFeatures.hasSubsidiaries) {
            let subsidiaryFilter = search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: scriptParameters.subsidiaryId
            });
            transactionSearch.filters.push(subsidiaryFilter);
        }

        /*
        if (scriptParameters.auxiliaryInternalId) {
            let itemIdFilter = search.createFilter({
                name: "internalidnumber",
                operator: search.Operator.GREATERTHAN,
                values: scriptParameters.auxiliaryInternalId
            });
            transactionSearch.filters.push(itemIdFilter);
        }
        */

        let pagedData = transactionSearch.runPaged({ pageSize: MAX_PAGINATION_SIZE });
        let auxiliaryFileNumber = scriptParameters.auxiliaryFileNumber;
        let fileNumberToRecall = auxiliaryFileNumber + 2;
        let pageToExecute = scriptParameters.page || 0;
        let transactionDataString = "";
        let auxiliaryFileContentSize = 0;
        let separator = scriptParameters.format == "CSV" ? "," : "|";

        for (let i = pageToExecute; i < pagedData.pageRanges.length; i++){
            if ((auxiliaryFileNumber == fileNumberToRecall) || (currentScript.getRemainingUsage() <= MAX_REMAINING_USAGE)) {
                saveFile(transactionDataString, auxiliaryFileNumber, scriptParameters, environmentFeatures, auxiliaryRecords, auxiliaryFileContentSize);
                auxiliaryFileNumber++;
                auxiliaryFileContentSize = 0;
                transactionDataString = "";
                scriptParameters.auxiliaryFileNumber = auxiliaryFileNumber;
                scriptParameters.page = i;
                executeScriptRecall(scriptParameters);
                return;
            }

            let page = pagedData.fetch({
                index: pagedData.pageRanges[i].index
            });

            for (let j = 0; j < page.data.length; j++) {
                let result = page.data[j];
                let columns = result.columns;
                let rowInString = getRow(result, columns, separator);
                transactionDataString += rowInString;

                let stringSize = lengthInUtf8Bytes(rowInString);
                auxiliaryFileContentSize += stringSize;

                if (auxiliaryFileNumber <= fileNumberToRecall - 1 && auxiliaryFileContentSize > MAX_FILE_SIZE) {
                    log.error("getTransactions MAX_FILE_SIZE", auxiliaryFileContentSize);
                    saveFile(transactionDataString, auxiliaryFileNumber, scriptParameters, environmentFeatures, auxiliaryRecords, auxiliaryFileContentSize);
                    auxiliaryFileNumber++;
                    auxiliaryFileContentSize = 0;
                    transactionDataString = "";
                    scriptParameters.auxiliaryFileNumber = auxiliaryFileNumber;
                }
            }
        }
        saveFile(transactionDataString, auxiliaryFileNumber, scriptParameters, environmentFeatures, auxiliaryRecords, auxiliaryFileContentSize);
    }

    const getRow = (result, columns, separator) => {
        let rowArray = [];

        rowArray[1] = result.getValue(columns[0]);
        rowArray[2] = result.getValue(columns[1]);
        rowArray[3] = result.getValue(columns[2]);
        rowArray[4] = result.getValue(columns[3]);
        rowArray[5] = result.getValue(columns[4]);
        rowArray[6] = result.getValue(columns[5]);
        rowArray[7] = result.getValue(columns[6]);
        rowArray[8] = result.getValue(columns[7]);
        rowArray[9] = result.getValue(columns[8]);
        rowArray[10] = result.getValue(columns[9]);
        rowArray[11] = result.getValue(columns[10]);
        rowArray[12] = result.getValue(columns[11]);
        rowArray[13] = result.getValue(columns[12]);
        rowArray[14] = result.getValue(columns[13]);
        rowArray[15] = result.getValue(columns[14]);
        rowArray[16] = result.getValue(columns[15]);
        rowArray[17] = result.getValue(columns[16]);
        rowArray[18] = result.getValue(columns[17]);
        rowArray[19] = result.getValue(columns[18]);
        rowArray[19] = roundTwoDecimal(rowArray[19]);
        if (rowArray[19] == 0) rowArray[19] = '0.00';
        rowArray[20] = result.getValue(columns[19]);
        rowArray[20] = roundTwoDecimal(rowArray[20]);
        if (rowArray[20] == 0) rowArray[20] = '0.00';
        rowArray[21] = result.getValue(columns[20]);
        rowArray[21] = roundTwoDecimal(rowArray[21]);
        if (rowArray[21] == 0) rowArray[21] = '0.00';

        return getRowInString(rowArray, separator);
    }

    const getRowInString = (rowResult, separator) => {
        let rowString = "";
        for (let i = 1; i < rowResult.length; i++) {
            let value = rowResult[i];
            rowString += `${value}${separator}`;
        }
        return `${rowString.replace(/- None -/g, "")}\n`;
    }

    const lengthInUtf8Bytes = (string) => {
        let utf8String = encodeURIComponent(string).match(/%[89ABab]/g);
        return string.length + (utf8String ? utf8String.length : 0);
    }

    const saveAuxiliaryFile = (name, contents, folder) => {
        let auxiliaryFile = file.create({
            name,
            fileType: file.Type.PLAINTEXT,
            contents,
            encoding: file.Encoding.UTF8,
            folder
        });
        return auxiliaryFile.save();
    }

    const saveFile = (fileContent, auxiliaryFileNumber, scriptParameters, environmentFeatures, auxiliaryRecords, auxiliaryFileContentSize) => {
        let headerString = "";
        let fileName = getFileName(auxiliaryRecords, auxiliaryFileNumber, auxiliaryFileContentSize);
        let fileType = file.Type.PLAINTEXT;
        if (scriptParameters.format == "CSV") {
            fileName = `${fileName}.csv`;
            fileType = file.Type.CSV;
            headerString = getHeader();
        } else {
            fileName = `${fileName}.txt`;
        }
        let createdFile = createFile(fileName, fileType, `${headerString}${fileContent}`, file.Encoding.UTF8, scriptParameters.folderId)
        let fileId = createdFile.save();
        let loadedFile = file.load({ id: fileId });
        let logRecordId = auxiliaryFileNumber == 0 ? scriptParameters.logRecordId : createLogRecord(scriptParameters, environmentFeatures.hasSubsidiaries, auxiliaryRecords);
        log.error("saveFile", fileName);
        updateLogRecord(logRecordId, loadedFile, fileName, scriptParameters, environmentFeatures);
    }

    const getFileName = (auxiliaryRecords, auxiliaryFileNumber, auxiliaryFileContentSize) => {
        let hasInfo = auxiliaryFileContentSize == 0 ? "0" : "1";
        return `LE${auxiliaryRecords.subsidiary.taxidnum}${auxiliaryRecords.period.year}${auxiliaryRecords.period.month}00090200001${hasInfo}11_${auxiliaryFileNumber}`;
    }

    const getHeader = () => {
        return '1 Periodo|2 Codigo del catalogo utilizado|3 Tipo de Existencia|4 Codigo de la existencia|5 CUO|6 Nombre existencia|7 Codigo de la unidad de medida|'+
        '8 Fecha de Emision|9 Numero de Serie de Guia de remision|10 Numero de la guia de remision emitido por el consignador|11 Tipo de Comprobante de Pago|12 Fecha de emision del comprobante emitido por el consignador|13 Serie del Comprobante de Pago emitido por el consignador|'+
        '14 Numero del Comprobante de Pago emitido por el consignador (1)|15 Fecha de entrega o devolucion del bien|16 Numero de RUC del consignador|17 Apellidos y Nombres, Denominacion o Razon Social del consignatario|'+
        '18 Cantidad de bienes recibidos en consignacion o por devolucion del cliente|19 Cantidad de bienes devueltos al consignador|20 Cantidad de bienes vendidos por el consignatario|21 Indica el estado de la operacion|\n';
    }

    const createFile = (name, fileType, contents, encoding, folder) => {
        return file.create({
            name,
            fileType,
            contents,
            encoding,
            folder
        });
    }

    const updateLogRecord = (logRecordId, loadedFile, fileName, scriptParameters, environmentFeatures) => {
        let values = {}
        if (environmentFeatures.hasSubsidiaries) values.custrecord_pe_subsidiary_log = scriptParameters.subsidiaryId;

        values.custrecord_pe_report_log = fileName;
        values.custrecord_pe_status_log = 'Generated';
        values.custrecord_pe_book_log = 'Registro Consignacion 9.2';
        values.custrecord_pe_file_cabinet_log = `${loadedFile.url}&_xd=T`;
        return record.submitFields({
            type: "customrecord_pe_generation_logs",
            id: logRecordId,
            values
        });
    }

    const executeScriptRecall = (scriptParameters) => {
        let params = {}

        params["custscript_ts_sc_ple_9_2_subsidiary"] = scriptParameters.subsidiaryId;
        params["custscript_ts_sc_ple_9_2_period"] = scriptParameters.periodId;
        params["custscript_ts_sc_ple_9_2_format"] = scriptParameters.format;
        params["custscript_ts_sc_ple_9_2_num_pag"] = scriptParameters.page;
        params["custscript_ts_sc_ple_9_2_folderid"] = scriptParameters.folderId
        params["custscript_ts_sc_ple_9_2_num_archv"] = scriptParameters.auxiliaryFileNumber;

        log.error("executeScriptRecall Params", params);
        let scheduledTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: 'customscript_ts_sc_ple_9_2_regist_consig',
            deploymentId: 'customdeploy_ts_sc_ple_9_2_regist_consig',
            params
        });
        scheduledTask.submit();
    }

    const roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
    }

    const ValidarCantidad = (num, cantidaDigi) => {
        var cant = num.length;
        var falta = cantidaDigi-cant;
        if(cant == 0){
            return num;
        } else {
            for(var i = 0; i<falta ;i++){
                num = '0' + num ;
            }
            return num;
        }
    }

    const CambiarText = (texto) => {
        var tex = texto + '';
        var cantidad = tex.length;
        log.error('tex',tex);
        log.error('cantidad',cantidad);
        var final = '';
        for(var i = 0; i < cantidad ; i++){
            log.error('tex[i]',tex[i])
            tex[i] = tex[i] + '';
            if(tex[i] == '0' || tex[i] == '1' || tex[i] == '2' || tex[i] == '3' || tex[i] == '4' || 
            tex[i] == '5' || tex[i] == '6' || tex[i] == '7' || tex[i] == '8' || tex[i] == '9'){
                final = final + tex[i];
            } else {
                final = final + '0';
            }
            log.error('final dentro',final)
        }
        log.error('final',final)
        return final;
    }

    return {
        execute
    }
})