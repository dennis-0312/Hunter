
/*********************************************************************************************************************************************
This script for Journal Entry (Registrará el envío de los asientos de nómina enviado desde evolution) 
/*********************************************************************************************************************************************
File Name: TS_RS_Integration_Evolution.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 12/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/search', 'N/record', 'N/task', 'N/file', 'N/format'], (log, search, record, task, file, format) => {
    const SUBSIDIARY = 2;
    const FECHA = new Date();
    const RECORD_ASIENTOS_EVOLUTION = 'customrecord_ht_ae_asientos_evolution'; //HT Asientos EVOLUTION
    const FOLDER = 546;
    const LIMITE_TAMANIO_ARCHIVO = 10485760;
    const SAVED_CSV_IMPORTS = 156;

    const _get = (context) => {
        let csv = file.load({ id: context.csvfile });
        const scriptTask = task.create({ taskType: task.TaskType.CSV_IMPORT });
        scriptTask.mappingId = SAVED_CSV_IMPORTS;
        scriptTask.importFile = csv;
        scriptTask.queueId = 5;
        let csvImportTaskId = scriptTask.submit();
        //log.error('csvImportTaskIdGET', csvImportTaskId);
        let csvTaskStatus = task.checkStatus({ taskId: csvImportTaskId });
        log.error('csvTaskStatus', csvTaskStatus);
        return { 'ConextGet': csvTaskStatus.status };
        //return 'Oracle Netsuite Connected - Release 2024.1';
    }

    const _post = (context) => {
        let estado = 'Procesando';
        try {
            //const journal = createRecord(context);
            log.error('context', context);
            for (let index = 0; index < context.lines.length; index++) {
                if (typeof context.lines[index].externalid != 'undefined') {
                    if (!context.lines[index].externalid) {
                        return 'Se debe ingresar el ID Exteno en la línea ' + index;
                    }
                } else {
                    return 'El ID Externo no está definido en la línea ' + index;
                }
            }
            let cadenaFecha = format.format({ value: FECHA, type: format.Type.DATETIME });
            cadenaFecha = cadenaFecha.replace(/[/]/gi, '_').replace(/ /gi, '_').replace(/:/gi, '_');
            let registro = 'asiento_' + cadenaFecha;

            const fileObj = file.create({ name: registro + '.json', fileType: file.Type.JSON, contents: JSON.stringify(context) });
            fileObj.folder = FOLDER;
            let fileId = fileObj.save();

            const recordObj = record.create({ type: RECORD_ASIENTOS_EVOLUTION, isDynamic: true });
            recordObj.setValue({ fieldId: 'custrecord_ht_ae_identificador', value: registro });
            recordObj.setValue({ fieldId: 'custrecord_ht_ae_estado', value: estado });
            recordObj.setValue({ fieldId: 'custrecord_ht_ae_json_solicitud', value: fileId });
            recordObj.setValue({ fieldId: 'custrecord_ht_ae_externalid', value: context.lines[0].externalid });
            let recordId = recordObj.save({ ignoreMandatoryFields: true });

            const fileLoad = file.load({ id: fileId });
            if (fileLoad.size < LIMITE_TAMANIO_ARCHIVO) {
                //let data = JSON.parse(fileLoad.getContents());
                try {
                    let mapReduceScript = task.create({ taskType: task.TaskType.MAP_REDUCE });
                    mapReduceScript.scriptId = 'customscript_ts_mr_integration_evolution';
                    mapReduceScript.deploymentId = 'customdeploy_ts_mr_integration_evolution';
                    mapReduceScript.params = {
                        'custscript_ae_param_recordid': recordId,
                        'custscript_ae_param_fileid': fileId,
                        'custscript_ae_param_registro': registro
                    };
                    let mapReduceTaskId = mapReduceScript.submit();
                    log.error('mapReduceTaskId', mapReduceTaskId);
                } catch (error) {
                    log.error('Error-Task', error);
                    estado = 'Pendiente';
                    const updateRecord = record.submitFields({
                        type: RECORD_ASIENTOS_EVOLUTION,
                        id: recordId,
                        values: {
                            custrecord_ht_ae_estado: estado
                        }
                    });
                    log.error('Pending Proccess', updateRecord);
                }
                return { registro: recordId, proceso: registro, estado: estado };
            } else {
                return 'El archivo supera los 10M';
            }
        } catch (error) {
            log.error('Error-POST', error);
            return error;
        }
    }

    const createRecord = (context) => {
        try {
            const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
            objRecord.setValue({ fieldId: 'customform', value: 102 });
            objRecord.setValue({ fieldId: 'trandate', value: new Date(context.date) });
            //objRecord.setValue({ fieldId: 'currency', value: context.currency });
            objRecord.setValue({ fieldId: 'memo', value: context.memo });
            objRecord.setValue({ fieldId: 'subsidiary', value: SUBSIDIARY });
            //objRecord.setValue({ fieldId: 'postingperiod', value: context.postingPeriod });
            // objRecord.setValue({ fieldId: 'exchangerate', value: context.exchangeRate });
            //objRecord.setValue({ fieldId: 'approved', value: context.approved });

            // if (context.reversalDate != '') {
            //     objRecord.setValue({ fieldId: 'reversaldate', value: new Date(context.reversalDate) });
            // }
            //objRecord.setValue({ fieldId: 'reversaldefer', value: context.deferEntry });


            for (let i in context.lines) {
                objRecord.selectNewLine({ sublistId: 'line' });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: context.lines[i].account, ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: context.lines[i].debit, ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: context.lines[i].credit, ignoreFieldChange: false });
                //objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: context.lines[i].customer, ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: context.lines[i].department, ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: context.lines[i].class, ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: context.lines[i].location, ignoreFieldChange: false });
                objRecord.commitLine({ sublistId: 'line' });
            }
            const response = objRecord.save({ ignoreMandatoryFields: false });
            return {
                "id": response,
                "success": 1
            }
        } catch (error) {
            log.error('Error-createRecord', error);
            return error.message;
        }
    }

    return {
        get: _get,
        post: _post
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 12/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/