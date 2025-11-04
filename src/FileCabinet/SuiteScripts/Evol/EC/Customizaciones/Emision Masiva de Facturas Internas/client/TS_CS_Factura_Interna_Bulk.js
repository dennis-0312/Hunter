/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/https'],
    /**
     * @param{url} url
     * @param{https} https
     */
    (url, currentRecord, dialog, https) => {
        let curRec = currentRecord.get();
        let buttonClicked = false;
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        const pageInit = (scriptContext) => { }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        const fieldChanged = (scriptContext) => {
            let currentRecord = scriptContext.currentRecord;
            let sublistId = scriptContext.sublistId;
            let fieldId = scriptContext.fieldId;
            let line = scriptContext.line;

            if (fieldId == 'custpage_pageid') {
                let paramDesde = curRec.getValue('custpage_field_fecha_desde');
                let paramHasta = curRec.getValue('custpage_field_fecha_hasta');
                if (paramDesde.toString().length > 0 && paramHasta.toString().length > 0) {
                    let paramCliente = curRec.getValue('custpage_field_cliente');
                    // if (paramTransportista.length > 0) {
                    // if (paramDesde.toString().length > 0 && paramHasta.toString().length > 0) {
                    let paramClientetxt = curRec.getText('custpage_field_cliente');
                    let pageId = curRec.getValue({ fieldId: 'custpage_pageid' });
                    pageId = parseInt(pageId.split('_')[1]);
                    window.onbeforeunload = null;
                    document.location = url.resolveScript({
                        scriptId: getParameterFromURL('script'),
                        deploymentId: getParameterFromURL('deploy'),
                        params: {
                            page: pageId,
                            paramCargarLista: 'cargarLista',
                            paramDesde: paramDesde,
                            paramHasta: paramHasta,
                            paramCliente: paramCliente,
                            paramClientetxt: paramClientetxt
                        }
                    });
                } else {
                    dialog.alert({ title: 'Información', message: 'Se debe ingresar ambas fechas.' });
                }
            }

            if (fieldId == 'custpage_field_fecha_desde' || fieldId == 'custpage_field_fecha_hasta') {
                let paramDesde = curRec.getValue('custpage_field_fecha_desde');
                let paramHasta = curRec.getValue('custpage_field_fecha_hasta');
                if (paramDesde.toString().length > 0 && paramHasta.toString().length > 0) {
                    let paramCliente = curRec.getValue('custpage_field_cliente');
                    let paramClientetxt = curRec.getText('custpage_field_cliente');
                    let pageId = curRec.getValue({ fieldId: 'custpage_pageid' });
                    pageId = parseInt(pageId.split('_')[1]);
                    window.onbeforeunload = null;
                    document.location = url.resolveScript({
                        scriptId: getParameterFromURL('script'),
                        deploymentId: getParameterFromURL('deploy'),
                        params: {
                            page: pageId,
                            paramCargarLista: 'cargarLista',
                            paramDesde: paramDesde,
                            paramHasta: paramHasta,
                            paramCliente: paramCliente,
                            paramClientetxt: paramClientetxt
                        }
                    });
                }
            }

            return true;
        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        const saveRecord = (scriptContext) => {
            let currentRecord = scriptContext.currentRecord;
            if (verifySelectedSublist(currentRecord, 'sublist', 'sublist_field_seleccion')) {
                dialog.alert({ title: 'Información', message: 'No tiene Órdenes de Servicio Seleccionadas.' });
                return false;
            }
            return true;
        }

        const viewResults = () => {
            let paramDesde = curRec.getValue('custpage_field_fecha_desde');
            let paramHasta = curRec.getValue('custpage_field_fecha_hasta');
            if (paramDesde.toString().length > 0 && paramHasta.toString().length > 0) {
                let paramCliente = curRec.getValue('custpage_field_cliente');
                let paramClientetxt = curRec.getText('custpage_field_cliente');
                let pageId = curRec.getValue({ fieldId: 'custpage_pageid' });
                pageId = parseInt(pageId.split('_')[1]);
                window.onbeforeunload = null;
                document.location = url.resolveScript({
                    scriptId: getParameterFromURL('script'),
                    deploymentId: getParameterFromURL('deploy'),
                    params: {
                        page: pageId,
                        paramCargarLista: 'cargarLista',
                        paramDesde: paramDesde,
                        paramHasta: paramHasta,
                        paramCliente: paramCliente,
                        paramClientetxt: paramClientetxt
                    }
                });
            } else {
                dialog.alert({ title: 'Información', message: 'Se debe ingresar ambas fechas.' });
            }
        }

        const cleanFilters = () => {
            let suiteletURL = getSuiteletURL();
            setWindowChanged(window, false);
            window.location.href = suiteletURL;
        }

        const createFacturaInterna = (recordId) => {
            if (!buttonClicked) {
                buttonClicked = true;
                https.requestSuitelet({
                    scriptId: "customscript_ts_sl_factura_interna_singl",
                    deploymentId: "customdeploy_ts_sl_factura_interna_singl",
                    urlParams: {
                        recordId: recordId
                    }
                });
                location.reload();
            }
        }

        const getParameterFromURL = (param) => {
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

        const verifySelectedSublist = (currentRecord, sublistId, fieldId) => {
            let lines = currentRecord.getLineCount(sublistId);
            if (lines <= 0) return true;
            for (let line = 0; line < lines; line++) {
                let check = currentRecord.getSublistValue({ sublistId, fieldId, line });
                if (check) return false;
            }
            return true;
        }

        const roundTwoDecimal = (value) => {
            return Math.round(Number(value) * 100) / 100;
        }

        const getSuiteletURL = () => {
            return url.resolveScript({
                scriptId: 'customscript_ts_sl_factura_interna_bulk',
                deploymentId: 'customdeploy_ts_sl_factura_interna_bulk',
                returnExternalUrl: false
            });
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            viewResults: viewResults,
            cleanFilters: cleanFilters,
            createFacturaInterna: createFacturaInterna
        };

    });
