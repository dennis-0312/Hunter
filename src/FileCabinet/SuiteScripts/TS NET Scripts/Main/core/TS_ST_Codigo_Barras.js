/********************************************************************************************************************************************************
This script for Item Fulfillment
/******************************************************************************************************************************************************** 
File Name: TS_ST_Print_PDF.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 27/06/2022
ApiVersion: Script 2.x
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


define(['N/ui/serverWidget', 'N/record', 'N/render', 'N/file', 'N/search', 'N/runtime'],

  function (serverWidget, record, render, file, search, runtime) {

    const REC_GUIA_REMISION = 'itemfulfillment';
    const SALES_ORDER = 'salesorder';
    const VENDOR_AUTORIZATION = 'vendorreturnauthorization';
    const TRANSFER_ORDER = 'transferorder';
    const BUSQ_GUIA_REMISION = 'ItemShip';
    const ID_LIST_CONDUCTOR_SEC = 'recmachcustrecord_pe_nmro_guia_remision_con_sec';
    const ID_LIST_VEHICULO_SEC = 'recmachcustrecord_pe_nmro_guia_remision_veh_sec';

    function onRequest(context) {

      try {

        var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        log.debug('inicio', remainingUsage);

        if (context.request.method == 'GET') {
          log.debug("INICIO", "INICIO");
          var xmlJSON = {};
          var id_template = '';
          var typeEntity = '';
          var fieldEntity = '';
          var rec_id = context.request.parameters.custpage_internalid;
          var type_doc = context.request.parameters.custpage_typerec;
          //var is_fel = context.request.parameters.custpage_fel;


          var rec = record.load({ type: type_doc, id: rec_id });

          if (type_doc == 'customrecord_ncfar_asset') {

            // CONSTRUCCIÓN DE LA TRAMA PARA EL PDF
            xmlJSON.codigobarras = rec.getValue('custrecord_ht_af_codigobarra');

            // INFORMACIÓN RELACIONADA A FEL GUÍAS DE REMISIÓN

            id_template = './TS_FM_Asset_Codigo_Barras.ftl';

          }
          log.debug('xmlJSON', xmlJSON);


          // Renderiza el PDF
          var renderer = render.create();
          //Archivo del file cabinet
          var objfile = file.load({
            id: id_template
          });
          var objfile = objfile.getContents();
          renderer.templateContent = objfile;
          renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'record',
            data: xmlJSON
          });
          var result = renderer.renderAsString();
          var myFileObj = render.xmlToPdf({
            xmlString: result
          });
          pdfContent = myFileObj.getContents();
          context.response.renderPdf(result);

          log.debug("FIN", "FIN");
        }

        var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        log.debug('fin', remainingUsage);


      } catch (e) {
        log.error("Error", "[ onRequest ] " + e);
      }

    }



    return {
      onRequest: onRequest
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