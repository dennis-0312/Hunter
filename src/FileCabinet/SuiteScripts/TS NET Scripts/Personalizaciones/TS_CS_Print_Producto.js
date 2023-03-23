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

    function fieldChanged(scriptContext) {

    }


    function postSourcing(scriptContext) {

    }

    function sublistChanged(scriptContext) {

    }

    function lineInit(scriptContext) {

    }


    function validateField(scriptContext) {

    }


    function validateLine(scriptContext) {

    }


    function validateInsert(scriptContext) {

    }


    function validateDelete(scriptContext) {

    }


    function saveRecord(scriptContext) {

    }

    function printproducto(internalid) {
      try {
        var host = url.resolveDomain({
          hostType: url.HostType.APPLICATION,
          accountId: runtime.accountId
        });
        console.log('host',host);
        /* var url_stlt = url.resolveScript({
          scriptId: 'customscript_ts_st_print_pdf',
          deploymentId: 'customdeploy_ts_st_print_pdf',
          returnExternalUrl: false
        }); */
        
        window.open('https://' + host+ '/app/accounting/transactions/build.nl?id='+internalid+'&e=T&transform=workord&memdoc=0&whence=', '_blank');


      } catch (err) {
        console.log("Error", "[ printPdf ] " + err);
      }

    }


    // function printPdfFel(_internalId, _typeRec) {
    //   try {
    //     alert('Se debe imprimir FEL');


    //   } catch (err) {
    //     console.log("Error", "[ printPdfFel ] " + err);
    //   }

    // }

    return {
      pageInit: pageInit,
      // fieldChanged: fieldChanged,
      // postSourcing: postSourcing,
      // sublistChanged: sublistChanged,
      // lineInit: lineInit,
      // validateField: validateField,
      // validateLine: validateLine,
      // validateInsert: validateInsert,
      // validateDelete: validateDelete,
      // saveRecord: saveRecord,
      printproducto: printproducto
      // printPdfFel: printPdfFel
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