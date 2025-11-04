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
        const outputfolder = 18065; //SB:16795 - PR:18065
        const flagfolder = 18063; //SB:22388 - PR:18063
        let currentScript = runtime.getCurrentScript();
        let message1 = 'Lote procesado correctamente.';
        let message2 = 'El registro no contiene un archivo de entrada.';
        const PROCESS_EMISION = 2;

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            log.error('Proccessing', 'START ================================================');
            let scriptParameters = getScriptParameters();
            let valuesRecord = new Object();
            let responseProcesssData = new Object();
            if (scriptParameters.loteID) {
                try {
                    valuesRecord.custrecord_ht_fibulk_estado = PROCESANDO;
                    updateLote(scriptParameters.loteID, valuesRecord);
                    let lotData = getLot(scriptParameters.loteID);
                    //log.error('lotData', lotData);
                    if (lotData[0].inputfile) {
                        responseProcesssData = processData(lotData[0], scriptParameters);
                        if (responseProcesssData.pinicial == 0) {
                            valuesRecord.custrecord_ht_fibulk_estado = COMPLETADO;
                            valuesRecord.custrecord_ht_fibulk_log = responseProcesssData.message;
                            valuesRecord.custrecord_ht_fibulk_output = responseProcesssData.outputFileId;
                            updateLote(scriptParameters.loteID, valuesRecord);
                        }
                    } else {
                        valuesRecord.custrecord_ht_fibulk_estado = ERROR;
                        valuesRecord.custrecord_ht_fibulk_log = message2;
                        updateLote(scriptParameters.loteID, valuesRecord);
                    }
                    if (responseProcesssData.pinicial == 0) {
                        log.error('Proccessing', 'END ================================================');
                        log.error('Reproccessing', 'START ================================================');
                        let objRetorno = getLotPending(); //*Verify Pendding
                        if (objRetorno != 0) {
                            taskScheduled(objRetorno);
                            log.error('Reproccessing', 'END ================================================');
                        } else {
                            log.error('Reproccessing', 'END ================================================');
                        }
                    } else {
                        log.error('Proccessing', 'END ================================================');
                        log.error('ReCall', 'START ================================================');
                        taskScheduledReprocessing(responseProcesssData)
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

        const processData = (lotData, scParameters) => {
            let valuesRecord = new Object();
            let contentResults = new Array();
            if (scParameters.pinicial != 0) {
                let fileObjContent = file.load({ id: scParameters.retorno });
                contentResults = JSON.parse(fileObjContent.getContents());
            }
            //log.error('contentResults', contentResults);
            let contadorProcesados = 1;
            let cantidadTotalRegistros = 0;
            let cantidadTotalRegistrosProcesados = 0;
            let fileObj = file.load({ id: lotData.inputfile });
            let nameData = `${fileObj.name}`;
            let nameDataSinExtension = nameData.replace(".json", "");
            let retorno = '';
            let countProccessTotal = scParameters.pinicial == 0 ? 0 : scParameters.countproccesstotal;
            let reProcessing = 0;
            let puntoInicial = scParameters.pinicial == 0 ? 0 : scParameters.pinicial;
            let objDataSend = new Object()
            if (fileObj.size < 10485760) {
                let ordenID = JSON.parse(fileObj.getContents());
                //*PROCESO */
                cantidadTotalRegistros = ordenID.length;
                for (let i = puntoInicial; i < ordenID.length; i++) {
                    scriptObj = runtime.getCurrentScript();
                    //log.debug('Remaining governance units proccess: ' + i, scriptObj.getRemainingUsage());
                    let percent = calcularPorcentaje(i + 1, cantidadTotalRegistros)
                    log.debug('percent', `${Math.round(percent)}%`)
                    valuesRecord.custrecord_ht_fibulk_percent_complete = `${Math.round(percent)}%`;
                    updateLote(scParameters.loteID, valuesRecord)
                    if (scriptObj.getRemainingUsage() > 600) {
                        log.debug('ordenID', ordenID[i])
                        retorno = _lib.creacionFacturaInterna(ordenID[i], cantidadTotalRegistrosProcesados, contadorProcesados, contentResults)
                        //log.error('retorno', retorno);
                        countProccessTotal += retorno.cantidadTotalRegistrosProcesados
                    } else {
                        puntoInicial = i
                        reProcessing = 1
                        break;
                    }
                }

                if (reProcessing == 1) {
                    objDataSend.recordId = scParameters.loteID;
                    objDataSend.pinicial = puntoInicial;
                    objDataSend.countproccesstotal = countProccessTotal;
                    //log.error('retorno.contentResults', retorno.contentResults);
                    let fileObjFlagId = saveJson(retorno.contentResults, `flag${nameDataSinExtension}`, flagfolder);
                    //log.error('fileObjFlagId', fileObjFlagId);
                    objDataSend.retorno = fileObjFlagId;
                    return objDataSend;
                } else {
                    let fileOutput = saveJson(retorno.contentResults, nameDataSinExtension, outputfolder);
                    objDataSend.pinicial = 0;
                    objDataSend.outputFileId = fileOutput;
                    objDataSend.message = `${countProccessTotal} de ${cantidadTotalRegistros} registros procesados correctamente`;
                    return objDataSend;
                }
            } else {
                log.error('Error', 'fileObj.size mayor a 10485760');
                return {
                    outputFileId: fileObj,
                    message: 'fileObj.size mayor a 10485760'
                }
            }
        }

        const getScriptParameters = () => {
            let scriptParameters = new Object();
            scriptParameters.loteID = currentScript.getParameter('custscript_ts_sc_fibulk_lote_id');
            scriptParameters.pinicial = Number(currentScript.getParameter('custscript_ts_sc_fibulk_punto_inicial'));
            scriptParameters.countproccesstotal = Number(currentScript.getParameter('custscript_ts_sc_fibulk_countproccesstot'));
            scriptParameters.retorno = currentScript.getParameter('custscript_ts_sc_fibulk_retorno');
            //log.error("scriptParameters", scriptParameters);
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
                    ["custrecord_ht_fibulk_proceso", "anyof", PROCESS_EMISION]
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
                mrTask.scriptId = 'customscript_ts_sc_factura_interna_bulk';
                mrTask.deploymentId = 'customdeploy_ts_sc_factura_interna_bulk';
                mrTask.params = {
                    custscript_ts_sc_fibulk_lote_id: objDataSend.recordId,
                }
                let taskToken = mrTask.submit();
                //log.error('taskToken', taskToken);
            } catch (error) {
                log.error('Error-taskScheduled', error);
            }
        }

        const taskScheduledReprocessing = (objDataSend) => {
            try {
                //log.error("objDataSend", objDataSend);
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_sc_factura_interna_bulk';
                mrTask.deploymentId = 'customdeploy_ts_sc_factura_interna_bulk';
                mrTask.params = {
                    custscript_ts_sc_fibulk_lote_id: objDataSend.recordId,
                    custscript_ts_sc_fibulk_punto_inicial: objDataSend.pinicial,
                    custscript_ts_sc_fibulk_countproccesstot: objDataSend.countproccesstotal,
                    custscript_ts_sc_fibulk_retorno: objDataSend.retorno
                }
                let taskToken = mrTask.submit();
                //log.error('taskToken', taskToken);
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

        const calcularPorcentaje = (parte, total) => {
            return (parte / total) * 100;
        }

        return { execute }

    });
