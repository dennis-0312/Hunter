/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/file', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/render', '../lib/TS_CM_Factura_Interna'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 */
    (email, file, log, record, runtime, search, task, render, _lib) => {
        const LOG_RECORD = 'customrecord_ht_cr_fac_inter_lote';
        const COMPLETADO = 1;
        const ERROR = 2;
        const PENDIENTE = 3;
        const PROCESANDO = 4;
        const COMPROBANTE_FISCAL = 37
        const ESTADO_FACTURA_INTERNA = 2
        const CUSTOM_TRANSACTION_FACTURA_INTERNA = "customsale_ec_factura_interna";
        const outputfoldervoid = 18061
        let currentScript = runtime.getCurrentScript();
        let message1 = 'Lote procesado correctamente.';
        let message2 = 'El registro no contiene un archivo de entrada.';
        const PROCESS_ANULACION = 1;

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            log.error('Proccessing', 'START ================================================');
            let scriptParameters = getScriptParameters();
            let scriptObj = runtime.getCurrentScript();
            //log.debug('Remaining governance units: 1 ', scriptObj.getRemainingUsage());
            let valuesRecord = new Object();
            if (scriptParameters.loteID) {
                try {
                    valuesRecord.custrecord_ht_fibulk_estado = PROCESANDO;
                    updateLote(scriptParameters.loteID, valuesRecord);
                    let lotData = getLot(scriptParameters.loteID);
                    log.error('lotData', lotData);
                    if (lotData[0].inputfile) {
                        let responseProcesssData = processData(lotData[0]);
                        valuesRecord.custrecord_ht_fibulk_estado = COMPLETADO;
                        valuesRecord.custrecord_ht_fibulk_log = responseProcesssData.message;
                        valuesRecord.custrecord_ht_fibulk_output = responseProcesssData.outputFileId;
                        updateLote(scriptParameters.loteID, valuesRecord);
                    } else {
                        valuesRecord.custrecord_ht_fibulk_estado = ERROR;
                        valuesRecord.custrecord_ht_fibulk_log = message2;
                        updateLote(scriptParameters.loteID, valuesRecord);
                    }
                    scriptObj = runtime.getCurrentScript();
                    //log.debug('Remaining governance units: 5 ', scriptObj.getRemainingUsage());
                    log.error('Proccessing', 'END ================================================');
                    log.error('Reproccessing', 'START ================================================');
                    let objRetorno = getLotPending(); //*Verify Pendding
                    if (objRetorno != 0) {
                        taskScheduled(objRetorno);
                        log.error('Reproccessing', 'END ================================================');
                    } else {
                        log.error('Reproccessing', 'END ================================================');
                    }
                } catch (error) {
                    log.error('Catch-Error', error);
                    valuesRecord.custrecord_ht_fibulk_estado = ERROR;
                    valuesRecord.custrecord_ht_fibulk_log = JSON.stringify(error);
                    updateLote(scriptParameters.loteID, valuesRecord);
                    log.error('Proccessing', 'END ERROR ================================================');
                }
            }
        }

        const processData = (lotData) => {
            let contentResults = new Array();
            let contadorProcesados = 1;
            let cantidadTotalRegistros = 0;
            let cantidadTotalRegistrosProcesados = 0;
            let fileObj = file.load({ id: lotData.inputfile });
            let nameData = `${fileObj.name}`;
            let nameDataSinExtension = nameData.replace(".json", "");
            let retorno = '';
            let countProccessTotal = 0;
            if (fileObj.size < 10485760) {
                let ordenID = JSON.parse(fileObj.getContents());
                //*PROCESO */
                cantidadTotalRegistros = ordenID.length;
                for (let i in ordenID) {
                    scriptObj = runtime.getCurrentScript();
                    log.debug('Remaining governance units proccess: ' + i, scriptObj.getRemainingUsage());
                    log.debug('ordenID', ordenID[i])
                    retorno = _lib.anulacionFacturaInterna(ordenID[i], cantidadTotalRegistrosProcesados, contadorProcesados, contentResults)
                    log.error('retorno', retorno);
                    countProccessTotal += retorno.cantidadTotalRegistrosProcesados
                }
                scriptObj = runtime.getCurrentScript();
                log.debug('Remaining governance units: 4 ', scriptObj.getRemainingUsage());
                let fileOutput = saveJson(retorno.contentResults, nameDataSinExtension, outputfoldervoid);
                return {
                    outputFileId: fileOutput,
                    message: `${countProccessTotal} de ${cantidadTotalRegistros} registros procesados correctamente`
                }
            } else {
                log.error('Error', 'fileObj.size mayor a 10485760');
                return {
                    outputFileId: fileOutput,
                    message: 'fileObj.size mayor a 10485760'
                }
            }
        }

        const getScriptParameters = () => {
            let scriptParameters = new Object();
            scriptParameters.loteID = currentScript.getParameter('custscript_ts_sc_fivoid_lote_id');
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const getLot = (lot) => {
            let objPayments = new Array();
            let mySearch = search.create({
                type: LOG_RECORD,
                filters: [["internalid", "anyof", lot]],
                columns: ['custrecord_ht_fibulk_input', 'owner']
            });
            let searchResultCount = mySearch.runPaged().count;
            mySearch.run().each((result) => {
                objPayments.push({
                    id: result.id,
                    inputfile: result.getValue({ name: "custrecord_ht_fibulk_input" }),
                    owner: result.getValue({ name: "owner" })
                })
                return true;
            });
            return searchResultCount == 0 ? 0 : objPayments;
        }

        const getLotPending = () => {
            log.error('Track1', 'Verficando Cola');
            let objRetorno = new Object();
            let searchLotPending = search.create({
                type: LOG_RECORD,
                filters: [
                    ["custrecord_ht_fibulk_estado", "anyof", PENDIENTE],
                    "AND",
                    ["custrecord_ht_fibulk_proceso", "anyof", PROCESS_ANULACION]
                ],
                columns: [
                    search.createColumn({ name: "created", sort: search.Sort.ASC }),
                    search.createColumn({ name: "owner", label: "Owner" }),
                ]
            });
            let searchResultCount = searchLotPending.runPaged().count;
            log.error("Track2", `Se encontraron ${searchResultCount} registros en cola`);
            if (searchResultCount > 0) {
                searchLotPending.run().each((result) => {
                    objRetorno.recordId = result.id
                    objRetorno.owner = result.getValue('owner')
                });
                log.error("Track3", `Iniciando proceso del registro ${objRetorno.recordId}`);
                return objRetorno;
            } else {
                return 0;
            }

        }

        const updateLote = (id, valuesRecord) => {
            record.submitFields({ type: LOG_RECORD, id: id, values: valuesRecord })
        }

        const taskScheduled = (objDataSend) => {
            try {
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_sc_factura_interna_void';
                mrTask.deploymentId = 'customdeploy_ts_sc_factura_interna_void';
                mrTask.params = {
                    custscript_ts_ss_cgui_ppr_consolidlot_id: objDataSend.recordId,
                    custscript_ts_ss_cgui_ppr_employemisorid: objDataSend.senderId,
                    custscript_ts_ss_cgui_ppr_url: objDataSend.url,
                    custscript_ts_ss_cgui_ppr_savedsearchjob: objDataSend.savedSearch
                }
                let taskToken = mrTask.submit();
                log.error('taskToken', taskToken);
            } catch (error) {
                log.error('Error-taskScheduled', error);
            }
        }

        const saveJson = (contents, nombre, folder) => {
            let fileObj = file.create({
                name: `${nombre}_output.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: folder,
                isOnline: false
            });
            return fileObj.save();
        }

        return { execute }

    });
