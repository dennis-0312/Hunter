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
define(['N/url', 'N/runtime'],

  function (url, runtime) {

    function pageInit(scriptContext) {

      alert('hola mundo');

    }

    function ensambleDispositivo(internalid) {
      try {
        var host = url.resolveDomain({
          hostType: url.HostType.APPLICATION,
          accountId: runtime.accountId
        });
        console.log('host', host);
        window.open('https://' + host + '/app/accounting/transactions/build.nl?id=' + internalid + '&e=T&transform=workord&memdoc=0&whence=', '_blank');


      } catch (err) {
        console.log("Error", "[ ensambleDispositivo ] " + err);
      }

    }

    function ensambleAlquiler(item, location, workorder, salesorder, customer) {
      try {
        var host = url.resolveDomain({
          hostType: url.HostType.APPLICATION,
          accountId: runtime.accountId
        });

        var newUrl = 'https://' + host + '/app/site/hosting/scriptlet.nl?script=980&deploy=1&' +
          'item=' + item +
          '&location=' + location +
          '&workorder=' + workorder +
          '&salesorder=' + salesorder +
          '&customer=' + customer;
        console.log('host', host);
        window.open(newUrl);
      } catch (err) {
        console.log(err);
      }
    }

    return {
      pageInit: pageInit,
      ensambleDispositivo: ensambleDispositivo,
      ensambleAlquiler: ensambleAlquiler
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