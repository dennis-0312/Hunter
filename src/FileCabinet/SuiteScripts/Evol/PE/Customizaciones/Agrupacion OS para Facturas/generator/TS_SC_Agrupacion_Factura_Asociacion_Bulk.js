/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/file', 'N/log', 'N/search', 'N/record', 'N/runtime', 'N/task'],
    /**
 * @param{file} file
 * @param{log} log
 * @param{search} search
 * @param{record} record
 * @param{runtime} runtime
 * @param{task} task
 */
    (file, log, search, record, runtime, task) => {
        let currentScript = runtime.getCurrentScript();
        const COMPLETADO = 1;
        const ERROR = 2;
        const PENDIENTE = 3;
        const PROCESANDO = 4;
        const LOG_RECORD = 'customrecord_ts_standar_ss_cola';
        const CUSTOM_TRANSACTION_FACTURA_INTERNA = "customsale_ec_factura_interna";
        const flagfolder = 18053;
        const outputfolder = 18055;

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
            try {
                record.submitFields({ type: 'invoice', id: scriptParameters.facturaDirectaid, values: { custbody_ht_status_process_group: PROCESANDO } });
                valuesRecord.custrecord_ts_ss_estado_asociar_fac = PROCESANDO;
                updateLote(scriptParameters.loteID, valuesRecord);
                let lotData = getLot(scriptParameters.loteID);
                log.error('lotData', lotData);
                if (lotData[0].inputfile) {
                    responseProcesssData = processData(lotData[0], scriptParameters);
                    log.error('responseProcesssData', responseProcesssData);
                    if (responseProcesssData.pinicial == 0) {
                        valuesRecord.custrecord_ts_ss_estado_asociar_fac = COMPLETADO;
                        valuesRecord.custrecord_ts_ss_res_asociar_fact = responseProcesssData.message;
                        valuesRecord.custrecord_ts_ss_salida_asociar_fac = responseProcesssData.outputFileId;
                        updateLote(scriptParameters.loteID, valuesRecord);
                        record.submitFields({ type: 'invoice', id: scriptParameters.facturaDirectaid, values: { custbody_ht_status_process_group: responseProcesssData.statusProcess } });
                    }
                } else {
                    valuesRecord.custrecord_ts_ss_estado_asociar_fac = ERROR;
                    valuesRecord.custrecord_ts_ss_salida_asociar_fac = message2;
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
                    responseProcesssData.facturaDirectaid = scriptParameters.facturaDirectaid;
                    taskScheduledReprocessing(responseProcesssData)
                }
            } catch (error) {
                log.error('Catch-Error', error);
                valuesRecord.custrecord_ts_ss_estado_asociar_fac = ERROR;
                valuesRecord.custrecord_ts_ss_res_asociar_fact = JSON.stringify(error);
                updateLote(scriptParameters.loteID, valuesRecord);
                record.submitFields({ type: 'invoice', id: scriptParameters.facturaDirectaid, values: { custbody_ht_status_process_group: ERROR } });
                log.error('Proccessing', 'END ERROR ================================================');
            }

        }

        const getScriptParameters = () => {
            let scriptParameters = new Object();
            scriptParameters.loteID = currentScript.getParameter('custscript_ts_sc_fabulk_lote_id');
            scriptParameters.pinicial = Number(currentScript.getParameter('custscript_ts_sc_fabulk_punto_inicial'));
            scriptParameters.countproccesstotal = Number(currentScript.getParameter('custscript_ts_sc_fabulk_countproccesstot'));
            scriptParameters.retorno = currentScript.getParameter('custscript_ts_sc_fabulk_retorno');
            scriptParameters.facturaDirectaid = currentScript.getParameter('custscript_ts_sc_fabulk_facturadirectaid');
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const getLot = (lot) => {
            let objPayments = new Array();
            let mySearch = search.create({
                type: LOG_RECORD,
                filters: [["internalid", "anyof", lot]],
                columns: ['custrecord_ts_ss_parametros', 'owner']
            });
            let searchResultCount = mySearch.runPaged().count;
            mySearch.run().each((result) => {
                objPayments.push({
                    id: result.id,
                    inputfile: result.getValue({ name: "custrecord_ts_ss_parametros" }),
                    owner: result.getValue({ name: "owner" })
                })
                return true;
            });
            return searchResultCount == 0 ? 0 : objPayments;
        }

        const processData = (lotData, scParameters) => {
            let valuesRecord = new Object();
            let statusProcess = COMPLETADO;
            valuesRecord.custrecord_ts_ss_percent_asociar_fac = '0%';
            updateLote(scParameters.loteID, valuesRecord)
            let contentResults = new Array();
            if (scParameters.pinicial != 0) {
                let fileObjContent = file.load({ id: scParameters.retorno });
                contentResults = JSON.parse(fileObjContent.getContents());
            }
            log.error('contentResults', contentResults);
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
            let objDataSend = new Object();
            if (fileObj.size < 10485760) {
                let getContents = JSON.parse(fileObj.getContents());
                let ordenID = getContents.facturasSeleccionadas
                let facturaDirecta = getContents.facturaDirectaid
                //log.error('ordenID', ordenID);
                //*PROCESO */
                cantidadTotalRegistros = ordenID.length;
                log.error('cantidadTotalRegistros', cantidadTotalRegistros);
                for (let i = puntoInicial; i < ordenID.length; i++) {
                    let tranid = '';
                    scriptObj = runtime.getCurrentScript();
                    log.debug('Remaining governance units proccess: ' + i, scriptObj.getRemainingUsage());
                    if (scriptObj.getRemainingUsage() > 100) {
                        let percent = calcularPorcentaje(i + 1, cantidadTotalRegistros)
                        log.debug('percent', `${Math.round(percent)}%`)
                        valuesRecord.custrecord_ts_ss_percent_asociar_fac = `${Math.round(percent)}%`;
                        updateLote(scParameters.loteID, valuesRecord)
                        log.debug('ordenID', ordenID[i])
                        try {
                            let fieldLookUp = search.lookupFields({ type: CUSTOM_TRANSACTION_FACTURA_INTERNA, id: ordenID[i].id, columns: ['tranid'] });
                            log.error('buildId', `Factura # ${i + 1} - ${fieldLookUp.tranid}`);
                            let tranid = fieldLookUp.tranid;
                            record.submitFields({ type: CUSTOM_TRANSACTION_FACTURA_INTERNA, id: ordenID[i].id, values: { custbody_ht_factura_directa: facturaDirecta } });
                            record.submitFields({ type: 'salesorder', id: ordenID[i].creado_desde, values: { custbody_ht_factura_directa: facturaDirecta } });
                            let factura = record.create({ type: "customrecord_ht_fact_internas_asociadas", isDynamic: true });
                            factura.setValue({ fieldId: 'custrecord_nro_factura', value: facturaDirecta });
                            factura.setValue({ fieldId: 'custrecord_nro_factura_interna', value: ordenID[i].id });
                            factura.setValue({ fieldId: 'custrecord_orden_servicio', value: ordenID[i].creado_desde });
                            if (ordenID[i].nro_cuota) { factura.setValue({ fieldId: 'custrecord_nro_cuota', value: ordenID[i].nro_cuota }) }
                            retorno = factura.save();
                            log.error('retorno', retorno);
                            contentResults.push({
                                facturaInterna: tranid,
                                Registro: retorno
                            })
                            cantidadTotalRegistrosProcesados = contadorProcesados++
                            countProccessTotal += cantidadTotalRegistrosProcesados
                        } catch (error) {
                            contentResults.push({
                                facturaInterna: tranid,
                                facturaInternId: ordenID[i].id,
                                resultado: JSON.stringify(error)
                            })
                            statusProcess = ERROR;
                        }
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
                    log.error('contentResultsOut', contentResults);
                    let fileObjFlagId = saveJson(contentResults, `flag${nameDataSinExtension}`, flagfolder);
                    log.error('fileObjFlagId', fileObjFlagId);
                    objDataSend.retorno = fileObjFlagId;
                    return objDataSend;
                } else {
                    let fileOutput = saveJson(contentResults, nameDataSinExtension, outputfolder);
                    objDataSend.pinicial = 0;
                    objDataSend.outputFileId = fileOutput;
                    objDataSend.message = `${countProccessTotal} de ${cantidadTotalRegistros} registros procesados correctamente`;
                    objDataSend.statusProcess = statusProcess;
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

        const updateLote = (id, valuesRecord) => {
            record.submitFields({ type: LOG_RECORD, id: id, values: valuesRecord })
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

        const getLotPending = () => {
            log.error('Track1', 'Verficando Cola');
            let objRetorno = new Object();
            let searchLotPending = search.create({
                type: LOG_RECORD,
                filters: [
                    ["custrecord_ts_ss_estado_asociar_fac", "anyof", PENDIENTE]
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

        const taskScheduled = (objDataSend) => {
            try {
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_sc_agru_fac_asociar_bulk';
                mrTask.deploymentId = 'customdeploy_ts_sc_agru_fac_asociar_bulk';
                mrTask.params = {
                    custscript_ts_sc_fabulk_lote_id: objDataSend.recordId,
                    custscript_ts_sc_fabulk_punto_inicial: 0,
                    custscript_ts_sc_fabulk_countproccesstot: 0,
                    custscript_ts_sc_fabulk_retorno: 0,
                    custscript_ts_sc_fabulk_facturaDirectaid: 0,
                }
                let taskToken = mrTask.submit();
                log.error('taskToken', taskToken);
            } catch (error) {
                log.error('Error-taskScheduled', error);
            }
        }

        const taskScheduledReprocessing = (objDataSend) => {
            try {
                log.error("objDataSend", objDataSend);
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_sc_agru_fac_asociar_bulk';
                mrTask.deploymentId = 'customdeploy_ts_sc_agru_fac_asociar_bulk';
                mrTask.params = {
                    custscript_ts_sc_fabulk_lote_id: objDataSend.recordId,
                    custscript_ts_sc_fabulk_punto_inicial: objDataSend.pinicial,
                    custscript_ts_sc_fabulk_countproccesstot: objDataSend.countproccesstotal,
                    custscript_ts_sc_fabulk_retorno: objDataSend.retorno,
                    custscript_ts_sc_fabulk_facturaDirectaid: objDataSend.facturaDirectaid,
                }
                let taskToken = mrTask.submit();
                log.error('taskTokenReporocessing', taskToken);
            } catch (error) {
                log.error('Error-taskScheduled-Reporocessing', error);
            }
        }

        const calcularPorcentaje = (parte, total) => {
            return (parte / total) * 100;
        }

        return { execute }

    });
