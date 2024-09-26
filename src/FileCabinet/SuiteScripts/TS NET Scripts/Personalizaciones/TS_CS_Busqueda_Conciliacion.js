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

      console.log('hola mundo');

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

    function busqueda() {
      try {
        const SEARCH_ID = 3560; //SB: 3560 / PR: 3491
        var host = url.resolveDomain({ hostType: url.HostType.APPLICATION, accountId: runtime.accountId });
        console.log('host', host); //7451241-sb1.app.netsuite.com
        window.open('https://' + host + '/app/common/search/searchresults.nl?searchid=' + SEARCH_ID + '&whence=');
      } catch (err) {
        console.log("Error", "[ busqueda ] " + err);
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
      busqueda: busqueda
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