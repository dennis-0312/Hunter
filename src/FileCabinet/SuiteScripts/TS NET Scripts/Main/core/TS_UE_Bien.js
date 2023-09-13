/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/log',
    'N/record',
    'N/search',
    'N/https',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
    '../controller/TS_CM_Controller'
],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search, https, _constant, _errorMessage, _controller) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => { }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => { }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                const objRecord = scriptContext.newRecord;
                let dispositivoTXT = '';
                let simCardTXT = '';
                const bienid = objRecord.id.toString();
                let vid = objRecord.getValue('name');
                let altname = objRecord.getValue('altname');
                let estadoConvenio = objRecord.getValue('custrecord_ht_bien_estadoconvenio');
                let documentNumber = objRecord.getValue('custrecord_ht_bien_seguimiento');
                let customer = objRecord.getValue('custrecord_ht_bien_propietario');
                let taller = objRecord.getValue('custrecord_ht_bien_taller_convenio');
                let dispositivo = objRecord.getValue('custrecord_ht_bien_dispositivo_convenio');
                let simCard = objRecord.getValue('custrecord_ht_bien_simcard_convenio');
                try {
                    dispositivoTXT = objRecord.getText('custrecord_ht_bien_dispositivo_convenio');
                    simCardTXT = objRecord.getText('custrecord_ht_bien_simcard_convenio');
                } catch (error) {
                    log.error('Error', 'Campos vacíos, no usar getText: ' + error)
                }

                let datos = new Array();
                let typeComponents = ["1", "2"]
                let components = [dispositivo, simCard];
                let ordenTrabajo;
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';


                try {
                    if (estadoConvenio == _constant.Status.ACTIVO && documentNumber.length != 0) {
                        let transactionid = _controller.identifyServiceOrder(documentNumber);
                        if (transactionid != 0) {
                            let objReturn = _controller.getItemOfServiceOrder(transactionid);
                            // log.debug('OBJ', objReturn)
                            // log.debug('Length OBJ', objReturn.length)
                            if (objReturn.length > 0) {
                                datos = {
                                    serviceOrder: transactionid,
                                    customer: customer,
                                    vehiculo: bienid,
                                    item: objReturn[0].itemid,
                                    ordenServicio: objReturn[0].tranid
                                }
                                //log.debug('objReturn', JSON.stringify(datos))
                                let existOrdenTrabajo = _controller.validateOrdenTrabajo(transactionid, bienid);
                                if (existOrdenTrabajo == 0) {
                                    ordenTrabajo = _controller.parametros(_constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO, datos);
                                } else {
                                    ordenTrabajo = existOrdenTrabajo
                                }

                                let existChaser = _controller.validateChaser(bienid, dispositivo, simCard);
                                if (existChaser == 0) {
                                    chaserRecord = _controller.createChaser(bienid, vid, typeComponents, components);
                                } else {
                                    chaserRecord = existChaser
                                }

                                log.debug('OrdenTrabajo', ordenTrabajo);
                                log.debug('Chaser', chaserRecord);

                                let updateOrdenTrabajo = _controller.updateOrdenTrabajo(ordenTrabajo, taller, chaserRecord, dispositivoTXT, simCardTXT);
                                let myUrlParameters = { myFirstParameter: updateOrdenTrabajo }
                                let myRestletResponse = https.requestRestlet({
                                    // body: JSON.stringify(json),
                                    deploymentId: 'customdeploy_ts_rs_integration_plataform',
                                    scriptId: 'customscript_ts_rs_integration_plataform',
                                    headers: myRestletHeaders,
                                    method: 'GET',
                                    urlParams: myUrlParameters
                                });
                                let response = myRestletResponse.body;
                                log.debug('Response', response);
                            } else {
                                log.error('Error-getItemOfServiceOrder', _errorMessage.ErrorMessages.ITEM_ORDEN_SERVICIO);
                            }
                        } else {
                            log.error('Error-identifyServiceOrder', _errorMessage.ErrorMessages.IDENTIFICACION_ORDEN_SERVICIO);
                        }
                    }

                    if (objRecord.getValue("custrecord_ht_bien_tipobien") == _constant.Constants.PRODUCCION) {
                        if (objRecord.getValue('name') != objRecord.getValue('altname')) {
                            record.submitFields({
                                type: 'customrecord_ht_record_bienes',
                                id: bienid,
                                values: { 'name': altname },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }
                    } else if (altname.includes(bienid) == false) {
                        record.submitFields({
                            type: 'customrecord_ht_record_bienes',
                            id: bienid,
                            values: { 'altname': altname + bienid },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }
                } catch (error) {
                    log.debug('Error', error);
                }
            }

            if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                const objRecord = scriptContext.newRecord;
                const bienid = objRecord.id.toString();
                let altname = objRecord.getValue('altname');

                if (objRecord.getValue("custrecord_ht_bien_tipobien") == _constant.Constants.PRODUCCION) {
                    if (objRecord.getValue('name') != objRecord.getValue('altname')) {
                        record.submitFields({
                            type: 'customrecord_ht_record_bienes',
                            id: bienid,
                            values: { 'name': altname },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }
                } else if (altname.includes(bienid) == false) {
                    record.submitFields({
                        type: 'customrecord_ht_record_bienes',
                        id: bienid,
                        values: { 'altname': altname + bienid },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                }
            }
        }

        return { beforeLoad, beforeSubmit, afterSubmit }
    });
