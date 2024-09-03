/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/config', 'N/error', 'N/file', 'N/log', 'N/query', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/task', 'N/ui/dialog', 'N/ui/message', 'N/ui/serverWidget'],
    /**
 * @param{config} config
 * @param{error} error
 * @param{file} file
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{redirect} redirect
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 * @param{dialog} dialog
 * @param{message} message
 * @param{serverWidget} serverWidget
 */
    (config, error, file, log, query, record, redirect, runtime, search, task, dialog, message, serverWidget) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const userRecord = runtime.getCurrentUser();
        const currentScript = runtime.getCurrentScript();

        const onRequest = (scriptContext) => {
            try {
                let method = scriptContext.request.method;
                let deploymentId = currentScript.deploymentId;
                if (deploymentId == "customdeploy_ts_ui_mass_assembly_view_1") {
                    if (method == 'GET') {
                        viewUploadFile(scriptContext);
                    } else {
                        processData(scriptContext);
                    }
                }
            } catch (error) {
                log.error('Error', error);
            }
        }

        const viewUploadFile = (body) => {
            try {
                let form = serverWidget.createForm({ title: 'Construcción de Ensamble Masivo' });
                form.clientScriptModulePath = '../client/TS_CS_Mass_Assembly_Validate_File.js';

                //& ---------------------------- RECUPERACIÓN DE PARAMETROS ---------------------------- */
                let fileType = body.request.parameters.ftype;
                let size = body.request.parameters.fsize;
                let archivo = body.request.parameters.ffile;
                let nameFile = body.request.parameters.fname;
                let nameButton = ''

                //& ---------------------------- VALIDACIÓN DE CONFIGURACIÓN ---------------------------- */
                let companyInfo = config.load({ type: config.Type.COMPANY_INFORMATION });
                const URL = companyInfo.getValue({ fieldId: 'appurl' });
                log.debug('URL', URL);
                let parmaConfig = currentScript.getParameter('custscript_ht_ebly_config_record');
                if (parmaConfig.length == 0)
                    return body.response.write('No se ha configurado el ID Interno del registro personalizado en el parámetro CONFIG RECORD del despliegue del SuiteLet, contáctese con el área de sistemas.');
                let validateConfig = getConfig(userRecord.subsidiary)
                if (validateConfig == 0)
                    return body.response.write(`<p>No existe un registro de configuración para esta subsidaria.</p><a href="${URL}/app/common/custom/custrecordentrylist.nl?rectype=${parmaConfig}">Crear registro de configuración.</a>`);
                
                //& ---------------------------- VALIDACIÓN DE TIPO ARCHIVO Y TAMAÑO ---------------------------- */
                let returnProcess = validationFile(fileType, size, form)

                //& ---------------------------- INICIO CUERPO FORMULARIO ---------------------------- */

                if (typeof archivo == 'undefined') {
                    nameButton = 'Validar CSV'
                    form.addField({ id: 'custpage_ebly_field_file', type: serverWidget.FieldType.FILE, label: 'archivo csv' }).isMandatory = true;
                } else {
                    nameButton = 'Procesar CSV'
                    let field_file_txt = form.addField({ id: 'custpage_ebly_field_file_text', type: serverWidget.FieldType.TEXT, label: 'archivo csv' })
                    field_file_txt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    field_file_txt.defaultValue = nameFile;
                }

                let field_select_queue = form.addField({ id: 'custpage_ebly_field_select_queue', type: serverWidget.FieldType.SELECT, label: 'cola' });
                field_select_queue.addSelectOption({
                    value: -1,
                    text: 'Seleccione...'
                });

                // if (typeof scriptContext.request.parameters.location != 'undefined') {
                //     const upselectfilter2 = upSelecFilter(SEARCH_ID, location);
                //     upselectfilter2.run().each((result) => {
                //         const ovid = result.getValue(upselectfilter2.columns[5]);
                //         const ovnumber = result.getValue(upselectfilter2.columns[6]);
                //         const ponumber = result.getValue(upselectfilter2.columns[7]);
                //         if (ponumber != '- None -') {
                //             selectpo.addSelectOption({
                //                 value: ovid,
                //                 text: ponumber
                //             });
                //         }
                //         return true;
                //     });
                // }

                let field_process = form.addField({ id: 'custpage_ebly_field_process', type: serverWidget.FieldType.TEXT, label: 'process' });
                field_process.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                //field_process.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_process.defaultValue = returnProcess;

                let field_file = form.addField({ id: 'custpage_ebly_field_file_value', type: serverWidget.FieldType.TEXT, label: 'file' });
                field_file.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                //field_process.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_file.defaultValue = archivo;



                form.addSubmitButton(nameButton);
                body.response.writePage(form);
            } catch (error) {
                log.error('Error-viewUploadFile', error);
            }
        }

        const processData = (body) => {
            let params = new Object();
            let process = body.request.parameters.custpage_ebly_field_process;
            if (process == 1) {
                redirectToSuitelet(params);
            } else {
                let objFile = body.request.files.custpage_ebly_field_file;
                objFile.folder = 6669;
                let inputFileId = objFile.save();
                params.ftype = objFile.fileType
                params.fsize = objFile.size
                params.fname = objFile.name
                params.ffile = inputFileId
                //log.debug('params', params);
                let contentCSV = objFile.getContents();
                let contentJSON = csvToJSON(contentCSV);
                let jsonBody = buildJSON(contentJSON)
                log.debug('jsonBody', jsonBody);
                redirectToSuitelet(params);
            }
        }

        const csvToJSON = (csv) => {
            let lines = csv.split(/\r\n|\n/);
            let result = new Array();
            let headers = lines[0].split(',');

            for (let i = 1; i < lines.length; i++) {
                let obj = new Object();
                let currentline = lines[i].split(',');

                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }
            return result;
        }

        const buildJSON = (objetos) => {
            let tramaJSON1 = new Array();
            return json = objetos.reduce((acc, obj) => {
                const key = obj.idexterno;
                if (!acc[key]) {
                    acc[key] = new Array();
                }
                acc[key].push(obj);
                return acc;
            }, {});


            // for (let key in json) {
            //     if (json.hasOwnProperty(key)) {
            //         json[key].forEach(obj => {
            //             tramaJSON1.push(obj)
            //         });
            //     }
            // }
            // log.debug('tramaJSON1', tramaJSON1);
            // return tramaJSON1;
        }

        const validationFile = (fileType, size, form) => {
            if (typeof fileType != 'undefined' && typeof size != 'undefined') {
                let messageObj;
                let calculate = calculateSize(size);
                if (fileType == 'CSV' && size <= 10485760) {
                    process = 1
                    messageObj = message.create({
                        type: message.Type.CONFIRMATION,
                        title: 'Validación de Tipo y Tamaño de Archivo.',
                        message: `<p>*</p><p>Tipo de archivo: ${fileType}</p><p>Tamaño del archivo: ${calculate.bsize} ${calculate.extension}</p><p>*</p><p>El archivo cumple con las condiciones.</p>`,
                        duration: 10000
                    });
                } else {
                    process = 0
                    messageObj = message.create({
                        type: message.Type.ERROR,
                        title: 'Validación de Tipo y Tamaño de Archivo.',
                        message: `<p>*</p><p>Tipo de archivo: ${fileType}</p><p>Tamaño del archivo: ${calculate.bsize} ${calculate.extension}</p><p>*</p><p>El archivo no cumple con las condiciones.</p>`,
                        duration: 10000
                    });
                }
                form.addPageInitMessage({ message: messageObj });
                return process;
            }
        }

        const redirectToSuitelet = (params) => {
            let parametros = new Object();
            let objLength = isEmptyObject(params)
            parametros.scriptId = 'customscript_ts_ui_mass_assembly_view';
            parametros.deploymentId = 'customdeploy_ts_ui_mass_assembly_view_1';
            if (!objLength)
                parametros.parameters = params;
            redirect.toSuitelet(parametros);
        }

        const isEmptyObject = (objeto) => {
            return Object.keys(objeto).length === 0
        }

        const calculateSize = (size) => {
            let bsize = '';
            let extension = '';
            if (size < 1024) {
                bsize = size
                extension = 'bytes'
            } else if (size > 1024 && size <= 1048576) {
                bsize = bytesToKilobytes(size)
                extension = 'KB'
            } else if (size > 1048576 && size <= 10485760) {
                bsize = bytesToMegabytes(size)
                extension = 'MB'
            } else if (size > 10485760) {
                bsize = bytesToMegabytes(size)
                extension = 'MB'
            }

            return {
                bsize: bsize,
                extension: extension
            }
        }

        const bytesToMegabytes = (bytes) => {
            return (bytes / 1048576).toFixed(3);
        }

        const bytesToKilobytes = (bytes) => {
            return (bytes / 1024).toFixed(3);
        }

        const createJSON = () => {

        }

        const getConfig = (subsidiary) => {
            let sql = "select count(id) as cantidad from customrecord_ht_cr_mass_assembly_config where isinactive = 'F' and custrecord_ht_mbly_subsidiary = ?"
            let results = query.runSuiteQL({ query: sql, params: [subsidiary] }).asMappedResults();
            let count = results[0].cantidad;
            return count;
        }


        return { onRequest }

    });
