/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([
  'N/url',
  'N/runtime',
  'N/record',
  'N/ui/dialog',
  '../controller/TS_CM_Controller',
  '../constant/TS_CM_Constant'
], (url, runtime, record, dialog, _controller, _constant) => {
  const RENT_ASSEMBLY_BUILD_DEPLOYMENT_ID = "customdeploy_ts_ui_assembly_build_21";
  const RENT_ASSEMBLY_BUILD_SCRIPT_ID = "customscript_ts_ui_assembly_build_21";
  const CUSTODY_ASSEMBLY_BUILD_DEPLOYMENT_ID = "customdeploy_ts_ui_custody_assem_buil_21";
  const CUSTODY_ASSEMBLY_BUILD_SCRIPT_ID = "customscript_ts_ui_custody_assem_buil_21";
  const WARRANT_ASSEMBLY_BUILD_DEPLOYMENT_ID = "customdeploy_ts_ui_warrant_assem_buil_21";
  const WARRANT_ASSEMBLY_BUILD_SCRIPT_ID = "customscript_ts_ui_warrant_assem_buil_21";
  const IMPRESION_CERTIFICADO_SCRIPT_ID = "customscript_ts_ui_ec_impresion_certi";
  const IMPRESION_CERTIFICADO_DEPLOYMENT_ID = "customdeploy_ts_ui_ec_impresion_certi"
  const estadoChequeado = 2;
  const estadoDisponible = 5;

  const pageInit = (scriptContext) => { }

  const ensambleDispositivo = (internalid) => {
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

  const ensambleAlquiler = (item, location, workorder, salesorder, customer) => {
    /*try {
      console.log({ item, location, workorder, salesorder, customer });
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
    }*/
    try {
      let params = { item, location, workorder, salesorder, customer };
      let host = getHostDomain();
      let suiteletUrl = getSuiteletUrl(RENT_ASSEMBLY_BUILD_SCRIPT_ID, RENT_ASSEMBLY_BUILD_DEPLOYMENT_ID);
      let fullUrl = addParametersToUrl(`https://${host}${suiteletUrl}`, params);
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.log(error);
    }
  }

  const ensambleCustodia = (item, relateditem, location, workorder, salesorder, customer) => {
    /*try {
      console.log(item, relateditem, location, workorder, salesorder, customer);
      var host = url.resolveDomain({
        hostType: url.HostType.APPLICATION,
        accountId: runtime.accountId
      });
      var newUrl = 'https://' + host + '/app/site/hosting/scriptlet.nl?script=1147&deploy=1&' +
        'item=' + item +
        '&relateditem=' + relateditem +
        '&location=' + location +
        '&workorder=' + workorder +
        '&salesorder=' + salesorder +
        '&customer=' + customer;
      console.log('host', host);
      window.open(newUrl);
    } catch (err) {
      console.log(err);
    }*/

    try {
      let params = { item, relateditem, location, workorder, salesorder, customer };
      let host = getHostDomain();
      let suiteletUrl = getSuiteletUrl(CUSTODY_ASSEMBLY_BUILD_SCRIPT_ID, CUSTODY_ASSEMBLY_BUILD_DEPLOYMENT_ID);
      let fullUrl = addParametersToUrl(`https://${host}${suiteletUrl}`, params);
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.log(error);
    }
  }

  const ensambleGarantia = (item, location, workorder, salesorder, customer) => {
    try {
      let params = { item, location, workorder, salesorder, customer };
      let host = getHostDomain();
      let suiteletUrl = getSuiteletUrl(WARRANT_ASSEMBLY_BUILD_SCRIPT_ID, WARRANT_ASSEMBLY_BUILD_DEPLOYMENT_ID);
      let fullUrl = addParametersToUrl(`https://${host}${suiteletUrl}`, params);
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.log(error);
    }
  }

  const getSuiteletUrl = (scriptId, deploymentId) => {
    return url.resolveScript({
      scriptId: scriptId,
      deploymentId: deploymentId,
      returnExternalUrl: false
    });
  }

  const getHostDomain = () => {
    return host = url.resolveDomain({
      hostType: url.HostType.APPLICATION,
      accountId: runtime.accountId
    });
  }

  const addParametersToUrl = (suiteletURL, parameters) => {
    for (let param in parameters) {
      if (parameters[param]) {
        suiteletURL = `${suiteletURL}&${param}=${parameters[param]}`;
      }
    }
    return suiteletURL;
  }

  const chequearOrden = (internalid) => {
    let pideNumberBox = 0;
    try {
      let objRecord = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: internalid });
      if (objRecord.getValue('custrecord_ht_ot_estadochaser').length > 0) {
        if (objRecord.getValue('custrecord_ht_ot_estadochaser') != estadoDisponible) {
          let parametrosRespo = _controller.parametrizacion(objRecord.getValue({ fieldId: 'custrecord_ht_ot_item' }));
          for (let j = 0; j < parametrosRespo.length; j++) {
            if (parametrosRespo[j][0] == _constant.Parameter.PNB_PIDE_NUMBER_BOX && parametrosRespo[j][1] == _constant.Valor.SI) {
              pideNumberBox = _constant.Valor.SI;
              break;
            }
            
          }

          if (pideNumberBox == 0) {
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_estado', value: estadoChequeado });
            response = objRecord.save();
            location.reload();
          } else {
            if (objRecord.getValue('custrecord_ht_ot_boxserie').length > 0) {
              objRecord.setValue({ fieldId: 'custrecord_ht_ot_estado', value: estadoChequeado });
              response = objRecord.save();
              location.reload();
            } else {
              dialog.alert({ title: 'Alerta', message: 'Se debe ingresar un dato para el campo BOX SERIE.' });
            }

            // return true;
            //dialog.alert({ title: 'Alerta', message: 'Se debe ingresar un dato para el campo BOX SERIE.' });
          }
        } else {
          dialog.alert({ title: 'Alerta', message: 'El estado de la instalación debe ser diferente a disponible.' });
        }
      } else {
        dialog.alert({ title: 'Alerta', message: 'Debe ingresar un estado para la instalación.' });
      }
    } catch (error) {
      console.log('Error', error);
    }
  }

  const printCertificado = (workOrder, type) => {
    try {
      let params = { workOrder, type };
      let host = getHostDomain();
      let suiteletUrl = getSuiteletUrl(IMPRESION_CERTIFICADO_SCRIPT_ID, IMPRESION_CERTIFICADO_DEPLOYMENT_ID);
      let fullUrl = addParametersToUrl(`https://${host}${suiteletUrl}`, params);
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.log(error);
    }
  }

  return {
    pageInit,
    ensambleDispositivo,
    ensambleAlquiler,
    ensambleCustodia,
    ensambleGarantia,
    chequearOrden,
    printCertificado
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