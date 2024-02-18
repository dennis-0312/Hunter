/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/runtime'], function (currentRecord, url, runtime) {

    const IMPRESION_COD_BARRA_PDF_SCRIPT_ID = "customscript_ts_ui_pdf_codigo_barras";
    const IMPRESION_COD_BARRA_PDF_DEPLOYMENT_ID = "customdeploy_ts_ui_pdf_codigo_barras";

    var objRecord = '';
    var newobjRecord = '';
    var sublistName = '';
    var FieldName = '';

    function pageInit(context) {
        objRecord = context.currentRecord;
        newobjRecord = context.newRecord;
        sublistName = context.sublistId;
        FieldName = context.fieldId;

    }

    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var typeTransaction = currentRecord.type;

        var fecha_ini = currentRecord.getValue('custpage_inicio');
        var fecha_fin = currentRecord.getValue('custpage_fin');
        var location = currentRecord.getValue('custpage_location');
        var estado = currentRecord.getValue('custpage_estado');
        var num_serie_disp = currentRecord.getValue('custpage_num_serie_disp');
        var bodega_activo = currentRecord.getValue('custpage_bodega_activo');

        if (fecha_ini == '' && fecha_fin == '' && location == '' && estado == ''
             && num_serie_disp == '' && bodega_activo == '') {
            alert('Seleccione por los menos una de los filtros')
            return false;
        }
        return true;
    }

    function validateField(context) {

    }

    function fieldChanged(context) {

        var record = currentRecord.get();
        try {

            if (context.fieldId == 'custpage_pageid') {

                var pageId = record.getValue('custpage_pageid');
                pageId = parseInt(pageId.split('_')[1]);
                //var flag = record.getText('custpage_flag');
                var inicio = record.getText('custpage_inicio');
                var fin = record.getValue('custpage_fin');
                var location = record.getValue('custpage_location');
                var estado = record.getValue('custpage_estado');
                var num_serie_disp = record.getValue('custpage_num_serie_disp');
                var bodega_activo = record.getValue('custpage_bodega_activo');

                document.location = url.resolveScript({
                    scriptId: getParameterFromURL('script'),
                    deploymentId: getParameterFromURL('deploy'),
                    params: {
                        inicio: inicio,
                        fin: fin,
                        location: location,
                        estado: estado,
                        num_serie_disp: num_serie_disp,
                        page: pageId,
                        bodega_activo: bodega_activo
                    }
                });
            }

        } catch (e) {
            console.log('Error en fieldChanged', e);
        }
    }

    function postSourcing(context) {

    }

    function lineInit(context) {

    }

    function validateDelete(context) {

    }

    function validateInsert(context) {

    }

    function validateLine(context) {

    }

    function sublistChanged(context) {

    }


    function getParameterFromURL(param) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return (false);
    }

    function cancelar() {
        try {
            var currentUrl = document.location.href;
            currentUrl = currentUrl.split('&compid');
            currentUrl = currentUrl[0];
            var urls = new URL(currentUrl);
            window.onbeforeunload = null;
            window.location.replace(urls);
        } catch (e) {
            console.log('Error-cancelar' + ' - ' + e);
        }
    }

    function generarCodBarr() {
        try {
            var cant = objRecord.getLineCount({ sublistId: 'sublist1' });
            console.log('cant', cant);
            var arreglo = [];
            var cod_barra_asiento = '';
            if (cant > 0) {
                for (var i = cant - 1; i >= 0; i--) {
                    var check_box = objRecord.getSublistValue({ sublistId: 'sublist1', fieldId: 'list1_check', line: i });
                    var Cod_barra = objRecord.getSublistValue({ sublistId: 'sublist1', fieldId: 'list1_cod_barra', line: i });
                    if (check_box == true) {
                        if (cod_barra_asiento == '') {
                            cod_barra_asiento = Cod_barra;
                        } else {
                            cod_barra_asiento = cod_barra_asiento + ',' + Cod_barra;
                        }
                        arreglo.push(Cod_barra);
                    }
                }

                if (arreglo.length > 0) {
                    console.log('arreglo', arreglo);
                    console.log('cod_barra_asiento', cod_barra_asiento);
                    let params = cod_barra_asiento;
                    let host = getHostDomain();
                    let suiteletUrl = getSuiteletUrl(IMPRESION_COD_BARRA_PDF_SCRIPT_ID, IMPRESION_COD_BARRA_PDF_DEPLOYMENT_ID);
                    let fullUrl = addParametersToUrl("https://" + host + suiteletUrl, params);
                    log.error('fullUrl', fullUrl)
                    window.open(fullUrl, '_blank');
                }

            }

        } catch (e) {
            console.log('Error-generarCodBarr' + ' - ' + e);
        }
    }

    function getSuiteletUrl(scriptId, deploymentId) {
        return url.resolveScript({
            scriptId: scriptId,
            deploymentId: deploymentId,
            returnExternalUrl: false
        });
    }

    function getHostDomain() {
        return host = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
        });
    }

    function addParametersToUrl(suiteletURL, parameters) {
        suiteletURL = suiteletURL + "&" + "cod_barra_asiento" + "=" + parameters;
        return suiteletURL;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        // validateField: validateField,
        fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged,
        cancelar: cancelar,
        generarCodBarr: generarCodBarr
    }
});