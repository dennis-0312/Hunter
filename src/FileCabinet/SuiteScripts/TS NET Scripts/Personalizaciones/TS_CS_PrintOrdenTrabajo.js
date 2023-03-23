/********************************************************************************************************************************************************
This script for Item Fulfillment
/******************************************************************************************************************************************************** 
File Name: TS_CS_Print_PDF.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 27/06/2022
ApiVersion: Script 2.x
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/runtime','N/record'],

    function (url, runtime, record) {

        function pageInit(scriptContext) {

            alert('hola mundo');
      
          }
      
        function printOrdenTrabajo(rectype, internalid) {
            try {

                var host = url.resolveDomain({
                    hostType: url.HostType.APPLICATION,
                    accountId: runtime.accountId
                });

                window.open('https://' + host + '/app/common/custom/custrecordentry.nl?rectype=' + rectype + '&id=' + internalid, '_blank');


            } catch (err) {
                console.log("Error", "[ printOrdenTrabajo ] " + err);
            }

        }



        return {
            pageInit: pageInit,
            printOrdenTrabajo: printOrdenTrabajo
        };

    });
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 27/06/2022
Author: Jean Ñique
Description: Creación del script.
========================================================================================================================================================*/