/*********************************************************************************************************************************************
This script for Integration (Script para recepción de ) 
/*********************************************************************************************************************************************
File Name: TS_MR_Integration_Evolution.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 13/01/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/record', 'N/task', 'N/file', 'N/runtime', 'N/https'], (log, search, record, task, file, runtime, https) => {
    const scriptObj = runtime.getCurrentScript();
    const HEADER = 'Moneda|CheckTransferencia|RegistroTranferencia|External ID|Subsidiary|Date|Account|Debit|Credit|Memo|Class|Department|Location|MemoLinea|Name\n';
    const FOLDER = 546;
    const RECORD_ASIENTOS_EVOLUTION = 'customrecord_ht_ae_asientos_evolution'; //HT Asientos EVOLUTION
    let recordId = '';
    let fileId = '';
    let registro = '';

    const getInputData = () => {
        recordId = scriptObj.getParameter({ name: 'custscript_ae_param_recordid' });
        fileId = scriptObj.getParameter({ name: 'custscript_ae_param_fileid' });

        try {
            const fileLoad = file.load({ id: fileId });
            let data = JSON.parse(fileLoad.getContents());
            return data;
        } catch (error) {
            log.error('Error-getInputData', error);
        }
    }

    const map = (context) => {
        registro = scriptObj.getParameter({ name: 'custscript_ae_param_registro' });
        recordId = scriptObj.getParameter({ name: 'custscript_ae_param_recordid' });
        let contentJournal = '';
        try {
            let obj = JSON.parse(context.value);

            for (let i in obj) {
                contentJournal =
                    contentJournal + obj[i].moneda + '|' + 'T' + '|' + recordId + '|' +
                    obj[i].externalid + '|' + obj[i].subsidiary + '|' + obj[i].date + '|' +
                    obj[i].account + '|' + obj[i].debit + '|' + obj[i].credit + '|' + obj[i].memo + '|' +
                    obj[i].clase + '|' + obj[i].department + '|' + obj[i].location + '|' + obj[i].memolinea + '|' + obj[i].name + '\n';
            }
            context.write({ key: context.key, value: contentJournal });
        } catch (error) {
            log.error('Error-map', error);
        }
    }

    const reduce = (context) => {
        registro = scriptObj.getParameter({ name: 'custscript_ae_param_registro' });
        try {
            let contentJournal = context.values[0];
            contentJournal = HEADER + contentJournal;
            contentJournal = contentJournal.replace(/[,]/gi, ' ');
            contentJournal = contentJournal.replace(/[|]/gi, ';');

            const fileObj = file.create({
                name: registro + '.csv',
                fileType: file.Type.CSV,
                contents: contentJournal,
                encoding: file.Encoding.UTF8,
                folder: FOLDER,
                isOnline: true
            });
            let csvId = fileObj.save();
            log.error('csvId', csvId);

            context.write({ key: context.key, value: csvId });
        } catch (error) {
            log.error('Error-reduce', error);
        }
    }

    const summarize = (context) => {
        let csvId = '';
        try {
            recordId = scriptObj.getParameter({ name: 'custscript_ae_param_recordid' });
            context.output.iterator().each((key, value) => { csvId = value; return true; });

            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myUrlParameters = {
                csvfile: csvId,
                recordId: recordId
            }
            //asiento_04_03_2024_10_27_36
            let myRestletResponse = https.requestRestlet({
                deploymentId: 'customdeploy_ts_rs_integration_evolution',
                scriptId: 'customscript_ts_rs_integration_evolution',
                headers: myRestletHeaders,
                method: 'GET',
                urlParams: myUrlParameters
            });

            let response = myRestletResponse.body;
            log.error('Response-RESTlet', response);
            const updateRecord = record.submitFields({
                type: RECORD_ASIENTOS_EVOLUTION,
                id: recordId,
                values: {
                    custrecord_ht_ae_estado: 'Generando Diario',
                    custrecord_ht_ae_csv_archivo: csvId
                }
            });
            log.error('UpdateRecordProccesing', updateRecord);
        } catch (error) {
            log.error('Error-summarize', error);
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 13/01/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/