/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/config', 'N/file', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/format'],
    /**
 * @param{config} config
 * @param{file} file
 * @param{log} log
 * @param{record} record
 * @param{redirect} redirect
 * @param{runtime} runtime
 * @param{search} search
 * @param{format} format
 */
    (config, file, log, record, runtime, search, format) => {
        const FOLDER_NAME = 'FileCabinet'
        const SEARCH1 = 'customsearch_pe_registro_de_compra_8_2'
        const CUSTOM_RECORD_LOG = 'customrecord_pe_generation_logs'
        const CODIGO_LIBRO = '080200'
        const PARAMETER = 'custscript_pe_ss_ple_8_2_per_v2'
        const BOOK_NAME = 'Registro de Compras 8.2'
        let currentScript = runtime.getCurrentScript();

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            log.error('Proccessing', 'START ================================================================================================');
            let scriptParameters = getScriptParameters();
            let filterSubsidiary;
            let data = new Object();
            let isOneWorld = 0;
            let fedIdNumb;
            let filters = new Object();
            let jsonData = new Array();
            let stringContentReport = '';
            let recordGenerationLogId = '';

            if (scriptParameters) {
                try {
                    //& ================================================ SUBSIDIARY IN ONE WORLD ================================================ */
                    let featureSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                    let filterPostingPeriod = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.selectPeriod });
                    if (featureSubsidiary || featureSubsidiary == 'T') {
                        data.custrecord_pe_subsidiary_log = scriptParameters.selectSubsidiary;
                        filterSubsidiary = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.selectSubsidiary });
                        let subLookup = search.lookupFields({ type: search.Type.SUBSIDIARY, id: scriptParameters.selectSubsidiary, columns: ['taxidnum'] });
                        fedIdNumb = subLookup.taxidnum;
                        isOneWorld = 1
                    } else {
                        let configpage = config.load({ type: config.Type.COMPANY_INFORMATION });
                        fedIdNumb = configpage.getValue('employerid');
                    }
                    log.error('fedIdNumb', fedIdNumb);


                    //& ================================================ CREATE RECORD GENERATION LOGS ================================================ */
                    data.custrecord_pe_period_log = scriptParameters.selectPeriod;
                    data.custrecord_pe_report_log = "Procesando...";
                    data.custrecord_pe_status_log = "Procesando...";
                    data.custrecord_pe_book_log = BOOK_NAME;
                    recordGenerationLogId = createGenerationLog(data);
                    log.error('recordGenerationLogId', recordGenerationLogId);


                    //& ================================================ SEARCH FOLDER ID ================================================ */
                    let folderid = getFolderId();


                    //& ================================================ GET DATA ACCOUNTING PERIOD ================================================ */
                    let perLookup = search.lookupFields({ type: search.Type.ACCOUNTING_PERIOD, id: scriptParameters.selectPeriod, columns: ['periodname', 'startdate'] });
                    let periodoFinDate = format.parse({ type: format.Type.DATE, value: perLookup.startdate });
                    perLookup = periodoFinDate.getFullYear() + completarCero(2, periodoFinDate.getMonth() + 1) + '00';


                    //& ================================================ SEARCH LOAD PROCESS ================================================ */
                    //^ SEARCH 1 ============================================================================
                    let searchLoad = search.load({ id: SEARCH1 });
                    filters = searchLoad.filters;
                    filters.push(filterPostingPeriod);
                    if (isOneWorld == 1)
                        filters.push(filterSubsidiary);
                    let searchResultCount = searchLoad.runPaged().count;
                    log.error({ title: 'searchResultCount', details: searchResultCount });
                    if (searchResultCount > 0) {
                        let pagedData = searchLoad.runPaged({ pageSize: 1000 });
                        pagedData.pageRanges.forEach((pageRange) => {
                            let myPage = pagedData.fetch({ index: pageRange.index });
                            myPage.data.forEach((result) => {
                                let campoRegistro01 = result.getValue(pagedData.searchDefinition.columns[0]);
                                let campoRegistro02 = result.getValue(pagedData.searchDefinition.columns[1]);
                                let campoRegistro03 = result.getValue(pagedData.searchDefinition.columns[2]);
                                let campoRegistro04 = result.getValue(pagedData.searchDefinition.columns[3]);
                                let campoRegistro05 = result.getValue(pagedData.searchDefinition.columns[4]);
                                let campoRegistro06 = result.getValue(pagedData.searchDefinition.columns[5]);
                                let campoRegistro07 = result.getValue(pagedData.searchDefinition.columns[6]);
                                let campoRegistro08 = result.getValue(pagedData.searchDefinition.columns[7]);

                                let campoRegistro09 = result.getValue(pagedData.searchDefinition.columns[8]);
                                if (campoRegistro09 == '.00') campoRegistro09 = '0.00'

                                let campoRegistro10 = result.getValue(pagedData.searchDefinition.columns[9]);

                                let campoRegistro11 = result.getValue(pagedData.searchDefinition.columns[10]);
                                if (campoRegistro11 == '- None -') campoRegistro11 = ''

                                let campoRegistro12 = result.getValue(pagedData.searchDefinition.columns[11]);
                                if (campoRegistro12 == '- None -') campoRegistro12 = ''

                                let campoRegistro13 = result.getValue(pagedData.searchDefinition.columns[12]);
                                if (campoRegistro13 == '- None -') campoRegistro13 = ''

                                let campoRegistro14 = result.getValue(pagedData.searchDefinition.columns[13]);
                                if (campoRegistro14 == '- None -') campoRegistro14 = ''

                                let campoRegistro15 = result.getValue(pagedData.searchDefinition.columns[14]);
                                if (campoRegistro15 == '.00') campoRegistro15 = '0.00'

                                let campoRegistro16 = result.getValue(pagedData.searchDefinition.columns[15]);
                                let campoRegistro17 = result.getValue(pagedData.searchDefinition.columns[16]);
                                let campoRegistro18 = result.getValue(pagedData.searchDefinition.columns[17]);
                                let campoRegistro19 = result.getValue(pagedData.searchDefinition.columns[18]);

                                let campoRegistro20 = result.getValue(pagedData.searchDefinition.columns[19]);
                                
                                let campoRegistro21 = result.getValue(pagedData.searchDefinition.columns[20]);
                                if (campoRegistro21 == '- None -') campoRegistro21 = ''

                                let campoRegistro22 = result.getValue(pagedData.searchDefinition.columns[21]);
                                if (campoRegistro22 == '- None -') campoRegistro22 = ''

                                let campoRegistro23 = result.getValue(pagedData.searchDefinition.columns[22]);

                                let campoRegistro24 = result.getValue(pagedData.searchDefinition.columns[23]);
                                let campoRegistro25 = result.getValue(pagedData.searchDefinition.columns[24]);

                                let campoRegistro26 = result.getValue(pagedData.searchDefinition.columns[25]);
                                if (campoRegistro26 == '.00') campoRegistro26 = '0.00'

                                let campoRegistro27 = result.getValue(pagedData.searchDefinition.columns[26]);
                                if (campoRegistro26 == '.00') campoRegistro26 = '0.00'

                                let campoRegistro28 = result.getValue(pagedData.searchDefinition.columns[27]);
                                if (campoRegistro26 == '.00') campoRegistro26 = '0.00'

                                let campoRegistro29 = result.getValue(pagedData.searchDefinition.columns[28]);
                                if (campoRegistro29 != '') campoRegistro29 = parseFloat(campoRegistro29).toFixed(2)

                                let campoRegistro30 = result.getValue(pagedData.searchDefinition.columns[29]);
                                if (campoRegistro30 == '.00') campoRegistro30 = '0.00'
                                if (campoRegistro30 != '') campoRegistro30 = parseFloat(campoRegistro30).toFixed(2)

                                let campoRegistro31 = result.getValue(pagedData.searchDefinition.columns[30]);
                                if (campoRegistro31 == '- None -') campoRegistro31 = ''

                                let campoRegistro32 = result.getValue(pagedData.searchDefinition.columns[31]);
                                if (campoRegistro32 == '- None -') campoRegistro32 = ''

                                let campoRegistro33 = result.getValue(pagedData.searchDefinition.columns[32]);
                                if (campoRegistro33 == '- None -') campoRegistro33 = ''

                                let campoRegistro34 = result.getValue(pagedData.searchDefinition.columns[33]);
                                if (campoRegistro34 == '- None -') campoRegistro34 = ''

                                let campoRegistro35 = result.getValue(pagedData.searchDefinition.columns[34]);
                                if (campoRegistro35 == '- None -') campoRegistro35 = ''

                                let campoRegistro36 = result.getValue(pagedData.searchDefinition.columns[35]);
                                let campoRegistro37 = result.getValue(pagedData.searchDefinition.columns[36]);
                                let campoRegistro38 = result.getValue(pagedData.searchDefinition.columns[37]);
                                let campoRegistro39 = result.getValue(pagedData.searchDefinition.columns[38]);

                                jsonData.push({
                                    campoRegistro01: campoRegistro01,
                                    campoRegistro02: campoRegistro02,
                                    campoRegistro03: campoRegistro03,
                                    campoRegistro04: campoRegistro04,
                                    campoRegistro05: campoRegistro05,
                                    campoRegistro06: campoRegistro06,
                                    campoRegistro07: campoRegistro07,
                                    campoRegistro08: campoRegistro08,
                                    campoRegistro09: campoRegistro09,
                                    campoRegistro10: campoRegistro10,
                                    campoRegistro11: campoRegistro11,
                                    campoRegistro12: campoRegistro12,
                                    campoRegistro13: campoRegistro13,
                                    campoRegistro14: campoRegistro14,
                                    campoRegistro15: campoRegistro15,
                                    campoRegistro16: campoRegistro16,
                                    campoRegistro17: campoRegistro17,
                                    campoRegistro18: campoRegistro18,
                                    campoRegistro19: campoRegistro19,
                                    campoRegistro20: campoRegistro20,
                                    campoRegistro21: campoRegistro21,
                                    campoRegistro22: campoRegistro22,
                                    campoRegistro23: campoRegistro23,
                                    campoRegistro24: campoRegistro24,
                                    campoRegistro25: campoRegistro25,
                                    campoRegistro26: campoRegistro26,
                                    campoRegistro27: campoRegistro27,
                                    campoRegistro28: campoRegistro28,
                                    campoRegistro29: campoRegistro29,
                                    campoRegistro30: campoRegistro30,
                                    campoRegistro31: campoRegistro31,
                                    campoRegistro32: campoRegistro32,
                                    campoRegistro33: campoRegistro33,
                                    campoRegistro34: campoRegistro34,
                                    campoRegistro35: campoRegistro35,
                                    campoRegistro36: campoRegistro36,
                                    campoRegistro37: campoRegistro37,
                                    campoRegistro38: campoRegistro38,
                                    campoRegistro39: campoRegistro39
                                });
                            });
                        });
                    }


                    //& ================================================ DATA RESTRUCTURING ================================================ */
                    if (searchResultCount > 0) {
                        let array = jsonData;
                        log.error('array', array.length);


                        //& ================================================ MAPPING DATA ================================================ */
                        for (let i = 0; i < array.length; i++) {
                            stringContentReport =
                                stringContentReport + array[i].campoRegistro01 + '|' + array[i].campoRegistro02 + '|' + array[i].campoRegistro03 + '|' +
                                array[i].campoRegistro04 + '|' + array[i].campoRegistro05 + '|' + array[i].campoRegistro06 + '|' + array[i].campoRegistro07 + '|' +
                                array[i].campoRegistro08 + '|' + array[i].campoRegistro09 + '|' + array[i].campoRegistro10 + '|' + array[i].campoRegistro11 + '|' +
                                array[i].campoRegistro12 + '|' + array[i].campoRegistro13 + '|' + array[i].campoRegistro14 + '|' + array[i].campoRegistro15 + '|' +
                                array[i].campoRegistro16 + '|' + array[i].campoRegistro17 + '|' + array[i].campoRegistro18 + '|' + array[i].campoRegistro19 + '|' +
                                array[i].campoRegistro20 + '|' + array[i].campoRegistro21 + '|' + array[i].campoRegistro22 + '|' + array[i].campoRegistro23 + '|' +
                                array[i].campoRegistro24 + '|' + array[i].campoRegistro25 + '|' + array[i].campoRegistro26 + '|' + array[i].campoRegistro27 + '|' +
                                array[i].campoRegistro28 + '|' + array[i].campoRegistro29 + '|' + array[i].campoRegistro30 + '|' + array[i].campoRegistro31 + '|' +
                                array[i].campoRegistro32 + '|' + array[i].campoRegistro33 + '|' + array[i].campoRegistro34 + '|' + array[i].campoRegistro35 + '|' +
                                array[i].campoRegistro36 + '|' + array[i].campoRegistro37 + '|' + array[i].campoRegistro38 + '|' + array[i].campoRegistro39 + '|\n'
                        }


                        //& ================================================ CREATE FILE ================================================ */
                        let nameReportGenerated = 'LE' + fedIdNumb + perLookup + CODIGO_LIBRO + '00' + '1111';
                        let fileId = createFile(nameReportGenerated, scriptParameters.selectFormat, stringContentReport, folderid)
                        log.error('fileId', fileId);


                        //& ================================================ UPDATE RECORD LOG ================================================ */
                        updateRecordLog(recordGenerationLogId, fileId);


                        //*SAVE JSON =========================================================================
                        //saveJson(result, 'libro_8_1');
                    } else {
                        //& ================================================ UPDATE RECORD LOG NO HAY REGISTROS ================================================ */
                        updateRecordLog(recordGenerationLogId);
                    }
                    log.error('Proccessing', 'END =================================================================================================');
                } catch (error) {
                    updateRecordLog(recordGenerationLogId, 'error', error.message);
                    log.error('Error', error);
                    log.error('Proccessing', 'END ERROR ================================================================================================');
                }
            }
        }

        const getScriptParameters = () => {
            let scriptParameters = JSON.parse(currentScript.getParameter(PARAMETER));
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const createGenerationLog = (data) => {
            //log.debug('data', data);
            let recordGenerationLog = record.create({ type: CUSTOM_RECORD_LOG, isDynamic: true });
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    recordGenerationLog.setValue({ fieldId: key, value: data[key] });
                }
            }
            return recordGenerationLog.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        const getFolderId = () => {
            let folderid;
            let folderSearchObj = search.create({
                type: "folder",
                filters: [["name", "is", FOLDER_NAME]],
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
            });
            let searchResultCount = folderSearchObj.runPaged().count;
            folderSearchObj.run().each((result) => {
                folderid = result.getValue({ name: "internalid", label: "Internal ID" });
            });
            return folderid;
        }

        const completarCero = (tamano, valor) => {
            let strValor = valor + '';
            let lengthStrValor = strValor.length;
            let nuevoValor = valor + '';

            if (lengthStrValor <= tamano) {
                if (tamano != lengthStrValor) {
                    for (let i = lengthStrValor; i < tamano; i++) {
                        nuevoValor = '0' + nuevoValor;
                    }
                }
                return nuevoValor;
            } else {
                return nuevoValor.substring(0, tamano);
            }
        }

        // CONVIERTE A LA FECHA EN FORMATO JSON
        const formatDate = (dateString) => {
            let date = dateString.split('/');
            if (Number(date[0]) < 10) date[0] = '0' + Number(date[0]);
            if (Number(date[1]) < 10) date[1] = '0' + Number(date[1]);
            return { 'anio': date[2], 'mes': date[1], 'dia': date[0] }
        }

        const createFile = (nameFile, formatType, contentFile, folderid) => {
            let objFields = new Object();

            if (formatType == 'CSV') {
                objFields.name = `${nameFile}.${formatType.toLowerCase()}`;
                objFields.fileType = file.Type.CSV;
                objFields.contents = `${getCabeceraCSV()}${contentFile.replace(/\|/g, ',')}`;
            } else {
                objFields.name = `${nameFile}.txt`;
                objFields.fileType = file.Type.PLAINTEXT;
                objFields.contents = contentFile;
            }
            objFields.encoding = file.Encoding.UTF8;
            objFields.folder = folderid;
            objFields.isOnline = true;

            let fileObj = file.create(objFields);
            let fileId = fileObj.save();
            return fileId;
        }

        const updateRecordLog = (id, fileId = 0, errormessage = 0) => {
            let updateData = new Object();
            let openFile;

            if (fileId == 0) {
                updateData.custrecord_pe_report_log = 'Proceso finalizado'
                updateData.custrecord_pe_status_log = 'No hay registros'
            } else if (fileId == 'error') {
                updateData.custrecord_pe_report_log = errormessage
                updateData.custrecord_pe_status_log = 'Error'
            } else {
                openFile = file.load({ id: fileId });
                updateData.custrecord_pe_report_log = openFile.name
                updateData.custrecord_pe_status_log = 'Generated'
                updateData.custrecord_pe_file_cabinet_log = openFile.url
            }

            let updateRecordGenerationLogId = record.submitFields({
                type: CUSTOM_RECORD_LOG,
                id: id,
                values: updateData
            });
            log.error('updateRecordGenerationLogId', updateRecordGenerationLogId);
        }

        const getCabeceraCSV = () => {
            let cabeceraCSV = '1 PERIODO,2 CUO,3 CORRELATIVO,4 FECHA DE EMISION DEL COMP DE PAGO O DOC,' +
                '5 TIPO DE COMP DE PAGO O DOC,' +
                '6 SERIE DEL COMP DE PAGO O DOC,' +
                '7 NRO DEL COMP DE PAGO O DOC,' +
                '8 VALOR DE ADQUISICIONES,' +
                '9 OTROS CONCEPTOS, TRIBUTOS Y CARGOS QUE NO FORMEN PARTE DE LA BASE IMPONIBLE,' +
                '10 IMPORTE TOTAL DE LAS ADQUISICIONES REGISTRADAS SEGÚN COMPROBANTES DE PAGO,' +
                '11 TIPO DE COMPROBANTE DE PAGO QUE SUSTENTA EL CRÉDITO FISCAL,' +
                '12 SERIE COMPROBANTE DE PAGO O DOC (DUA) (DSI),' +
                '13 AÑO DE EMISIÓN DE LA DUA O DSI,' +
                '14 NÚMERO DE ORDEN FISICO O VIRTUAL DEL NO DOMICIALILADO (DUA) (DSI),' +
                '15 Monto de Retención del IGV,' +
                '16 Codigo de Moneda,' +
                '17 Tipo de Cambio,' +
                '18 Pais de la Residencia del No Domiciliado,' +
                '19 Apellidos y Nombres o Razón Social del No Domiciliado,' +
                '20. Domicilio en el Extranjero del No Domiciliado,' +
                '21 Número de Identificación del No Domiciliado,' +
                '22 Nro de identificación Fiscal del Beneficiario efectivo de los pagos,' +
                '23 Ap y Nom denominación o Razón Social del Proveedor,' +
                '24 País de Residencia del Beneficiario efectivos de los pagos,' +
                '25 Vínculo Contrib. y Res. Extranj.,' +
                '26 Renta Bruta,' +
                '27 Deducción / Costo de Enajenación de Bienes de Capital,' +
                '28 Renta Neta,' +
                '29 Tasa de Retención,' +
                '30 Impuesto Retenido,' +
                '31 Convenios para evitar la doble Imposición,' +
                '32 Exoneración Aplicada,' +
                '33 Tipo de Renta,' +
                '34 Modalidad del Servicio Prestado por el No Domiciliado,' +
                '35 Aplicación del Penúltimo párrafo del Art 76° de la Ley de Impuesto a la Renta,' +
                '36 Estado que identifica la Oportunidad de la Anotación o Indicación,' +
                '37 Periodo,' +
                '38 Periodo Inicial,' +
                '39 Periodo Final\n';
            return cabeceraCSV;
        }

        const saveJson = (contents, nombre) => {
            let name = new Date();
            let fileObj = file.create({
                name: `${nombre}_${name}.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: 3577,
                isOnline: false
            });
            let id = fileObj.save();
            log.debug('JSONTrack', id)
        }

        return { execute }

    });
