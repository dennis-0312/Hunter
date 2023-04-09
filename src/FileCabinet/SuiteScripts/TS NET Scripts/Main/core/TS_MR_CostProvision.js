/*********************************************************************************************************************************************
This script for Integration (Script para recepción de ) 
/*********************************************************************************************************************************************
File Name: TS_MR_Asiento_Provision_Costos.js                                                                        
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
define(['N/log',
    'N/search',
    'N/record',
    'N/task',
    'N/runtime',
    'N/query',
    '../controller/TS_CM_Controller',
], (log, search, record, task, runtime, query, _controller) => {

    const getInputData = () => {
        try {
            const json = _controller.getProvisionDetail();
            if (json == 0)
                json = new Array();
            return json;
        } catch (error) {
            log.error('Error-getInputData', error);
        }
    }

    const map = (context) => {
        try {
            context.write({ key: context.key, value: context.value });
        } catch (error) {
            log.error('Error-map', error);
        }
    }

    const reduce = (context) => {
        try {
            context.write({ key: context.key, value: context.values });
        } catch (error) {
            log.error('Error-reduce', error);
        }
    }

    const summarize = (context) => {
        let records = '';
        try {
            context.output.iterator().each((key, value) => {
                records = JSON.parse(JSON.parse(value));
                let provision = _controller.createProvisionDetail(records[0], records[1], records[2], records[3]);
                log.debug('Record', 'provision: ' + provision + ' - journal: ' + records[0] + ' - serviceOrder: ' + records[1] + ' - item: ' + records[2] + ' - amountProvided: ' + records[3]);
                return true;
            });
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
