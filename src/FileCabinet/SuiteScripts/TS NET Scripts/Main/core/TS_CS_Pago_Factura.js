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
    const IMPRESION_CERTIFICADO_SCRIPT_ID = "customscript_ts_ui_generar_compro_pago";
    const IMPRESION_CERTIFICADO_DEPLOYMENT_ID = "customdeploy_ts_ui_generar_compro_pago";

    const pageInit = (scriptContext) => { }

    const getSuiteletUrl = (scriptId, deploymentId) => {
        return url.resolveScript({ scriptId: scriptId, deploymentId: deploymentId, returnExternalUrl: false });
    }

    const getHostDomain = () => {
        return host = url.resolveDomain({ hostType: url.HostType.APPLICATION, accountId: runtime.accountId });
    }

    const addParametersToUrl = (suiteletURL, parameters) => {
        for (let param in parameters) {
            if (parameters[param]) {
                suiteletURL = `${suiteletURL}&${param}=${parameters[param]}`;
            }
        }
        return suiteletURL;
    }

    const printPago = (vendoPayment, tipo) => {
        try {
            let params = { vendoPayment, tipo };
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
        printPago
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