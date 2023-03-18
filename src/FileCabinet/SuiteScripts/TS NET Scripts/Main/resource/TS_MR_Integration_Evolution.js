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
    const HEADER = 'External ID|Subsidiary|Date|Account|Debit|Credit|Memo|Class|Department|Location\n';
    const FOLDER = 1118;
    const RECORD_ASIENTOS_EVOLUTION = 'customrecord_ht_ae_asientos_evolution'; //HT Asientos EVOLUTION
    let recordId = '';
    let fileId = '';
    let registro = '';

    const getInputData = () => {
        // recordId = scriptObj.getParameter({ name: 'custscript_ae_param_recordid' });
        fileId = scriptObj.getParameter({ name: 'custscript_ae_param_fileid' });
        //log.debug('Params', fileId);

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
        let contentJournal = '';
        try {
            let obj = JSON.parse(context.value);
            //log.debug('Context-map-Length', obj);
            //log.debug('Context-map', typeof obj);

            for (let i in obj) {
                contentJournal =
                    contentJournal + registro + '|' + obj[i].subsidiary + '|' + obj[i].date + '|' +
                    obj[i].account + '|' + obj[i].debit + '|' + obj[i].credit + '|' + obj[i].memo + '|' +
                    obj[i].class + '|' + obj[i].department + '|' + obj[i].location + '\n';
            }

            context.write({
                key: context.key,
                value: contentJournal
            });
        } catch (error) {
            log.error('Error-map', error);
        }
    }

    const reduce = (context) => {
        registro = scriptObj.getParameter({ name: 'custscript_ae_param_registro' });
        try {
            //log.debug('Context-reduce', context.values);
            //log.debug('Context-reduce-typeof', typeof context.values);
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
            log.debug('csvId', csvId);

            context.write({
                key: context.key,
                value: csvId
            });
        } catch (error) {
            log.error('Error-reduce', error);
        }
    }

    const summarize = (context) => {
        let csvId = '';
        try {
            recordId = scriptObj.getParameter({ name: 'custscript_ae_param_recordid' });

            context.output.iterator().each((key, value) => {
                csvId = value;
                return true;
            });

            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myUrlParameters = {
                csvfile: csvId,
                //mySecondParameter: 'secondparam'
            }

            let myRestletResponse = https.requestRestlet({
                //body: 'My Restlet body',
                deploymentId: 'customdeploy_ts_rs_integration_evolution',
                scriptId: 'customscript_ts_rs_integration_evolution',
                headers: myRestletHeaders,
                method: 'GET',
                urlParams: myUrlParameters
            });

            let response = myRestletResponse.body;
            log.debug('Response-RESTlet', response);
            //log.debug('Params-summarize', recordId);
            const updateRecord = record.submitFields({
                type: RECORD_ASIENTOS_EVOLUTION,
                id: recordId,
                values: {
                    custrecord_ht_ae_estado: 'Generando Diario',
                    custrecord_ht_ae_csv_archivo: csvId
                }
            });
            log.debug('updateRecord', updateRecord);
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
