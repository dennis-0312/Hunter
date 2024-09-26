/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['N/https', 'N/record', 'N/search'],
    /**
     * send - This function is the entry point of our plugin script
    * @param {Object} plugInContext
    * @param {String} plugInContext.scriptId
    * @param {String} plugInContext.sendMethodId
    * @param {String} plugInContext.eInvoiceContent
    * @param {Array}  plugInContext.attachmentFileIds
    * @param {String} plugInContext.customPluginImpId
    * @param {Number} plugInContext.batchOwner
    * @param {Object} plugInContext.customer
    * @param {String} plugInContext.customer.id
    * @param {Array}  plugInContext.customer.recipients
    * @param {Object} plugInContext.transaction
    * @param {String} plugInContext.transaction.number
    * @param {String} plugInContext.transaction.id
    * @param {String} plugInContext.transaction.poNum
    * @param {String} plugInContext.transaction.tranType
    * @param {Number} plugInContext.transaction.subsidiary
    * @param {Object} plugInContext.sender
    * @param {String} plugInContext.sender.id
    * @param {String} plugInContext.sender.name 
    * @param {String} plugInContext.sender.email
    * @param {Number} plugInContext.userId
    *
    * @returns {Object}  result
    * @returns {Boolean} result.success
    * @returns {String}  result.message
     */
    function (https, record, search) {

        var transactionId = '';
        var userId = '';
        /* Corregir la variable con ERROR en la subsidiaria */
        var SUBSIDIsARIA = 2;

        function send(pluginContext) {
            var result = {
                success: false,
                message: ""
            }
            try {
                transactionId = pluginContext.transaction.id;
                userId = pluginContext.sender.id;

                var transactionRecord = getLookUpTransactionFields(transactionId);

                if (transactionRecord.recordtype == "vendorbill" && transactionRecord["custbodyec_tipo_de_documento_retencion.custrecordts_ec_cod_tipo_comprobante"] == "07") {
                    if (transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "03") {
                        var fileId = transactionRecord.custbody_ts_ec_documento_ectronico.length ? transactionRecord.custbody_ts_ec_documento_ectronico[0].value : "";
                        var fileName = transactionRecord.custbody_ts_ec_documento_ectronico.length ? transactionRecord.custbody_ts_ec_documento_ectronico[0].text : "";
                        if (fileId) {
                            var response = sendFileToHunterServer(fileId);
                            if (response.status == "ok") {
                                result.success = true;
                                result.message = fileId + " - Archivo [" + fileName + "] enviado con éxito ";
                            } else {
                                result.success = false;
                                result.message = fileId + " - Error en el envio del Archivo [" + fileName + "] generado.";
                                return result;
                            }
                        } else {
                            result.success = false;
                            result.message = fileId + " - Error en el envio del Archivo [" + fileName + "] generado.";
                            return result;
                        }
                    }

                    var retencionFileId = transactionRecord.custbodyts_ec_documento_ectronic_reten.length ? transactionRecord.custbodyts_ec_documento_ectronic_reten[0].value : "";
                    var retencionFileName = transactionRecord.custbodyts_ec_documento_ectronic_reten.length ? transactionRecord.custbodyts_ec_documento_ectronic_reten[0].text : "";

                    if (retencionFileId) {
                        var response = sendFileToHunterServer(retencionFileId);
                        if (response.status == "ok") {
                            result.success = true;
                            result.message = result.message + retencionFileId + " - Archivo [" + retencionFileName + "] enviado con éxito.";
                        } else {
                            result.success = false;
                            result.message = retencionFileId + " - Error en el envio del Archivo [" + retencionFileName + "] generado.";
                            return result;
                        }
                    } else {
                        result.success = false;
                        result.message = retencionFileId + " - Error en el envio del Archivo [" + retencionFileName + "] generado.";
                    }
                } else {
                    var fileId = transactionRecord.custbody_ts_ec_documento_ectronico.length ? transactionRecord.custbody_ts_ec_documento_ectronico[0].value : "";
                    var fileName = transactionRecord.custbody_ts_ec_documento_ectronico.length ? transactionRecord.custbody_ts_ec_documento_ectronico[0].text : "";
                    if (fileId) {
                        var response = sendFileToHunterServer(fileId);
                        if (response.status == "ok") {
                            result.success = true;
                            result.message = fileId + " - Archivo [" + fileName + "] enviado con éxito.";
                            logError('Resultado', response.status);
                        } else {
                            result.success = false;
                            result.message = fileId + " - Error en el envio del Archivo [" + fileName + "] generado.";
                            return result;
                        }
                    } else {
                        result.success = false;
                        result.message = fileId + " - Error en el envio del Archivo [" + fileName + "] generado.";
                    }
                }
            } catch (e) {
                result = {
                    success: false,
                    message: "An error was ocurred: " + e.message
                }
            }
            return result;
        }

        function sendFileToHunterServer(fileId) {
            try {
                var suiteletResponse = https.requestSuitelet({
                    scriptId: "customscript_ts_ui_upload_file_sftp",
                    deploymentId: "customdeploy_ts_ui_upload_file_sftp",
                    method: https.Method.GET,
                    external: true,
                    urlParams: {
                        fileId: fileId
                    }
                });
                return JSON.parse(suiteletResponse.body);

            } catch (e) {
                logError('Error-sendFileToHunterServer', e);
                return "failed";
            }
        }

        function getLookUpTransactionFields(id) {
            try {
                var transactionRecord = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: id,
                    columns: [
                        "recordtype",
                        "custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante",
                        "custbodyec_tipo_de_documento_retencion.custrecordts_ec_cod_tipo_comprobante",
                        "custbody_ts_ec_documento_ectronico",
                        "custbodyts_ec_documento_ectronic_reten"
                    ]
                });
                return transactionRecord;
            } catch (e) {
                logError('Error-getLookupFieldsSearch', e);
            }
        }

        function logError(docstatus, response) {
            try {
                var logError = record.create({ type: 'customrecord_ec_ei_log_documents' });
                logError.setValue('custrecord_pe_ei_log_related_transaction', transactionId);
                logError.setValue('custrecord_pe_ei_log_subsidiary', SUBSIDIsARIA);
                logError.setValue('custrecord_pe_ei_log_employee', userId);
                logError.setValue('custrecord_ec_ei_log_status', docstatus);
                logError.setValue('custrecord_pe_ei_log_response', JSON.stringify(response));
                logError.save();
            } catch (e) {
                throw e.create({ name: "ERROR", message: response.message, notifyOff: false });
            }
        }

        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_ec_ei_document_status' });
                logStatus.setValue('custrecord_ec_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status', docstatus);
                logStatus.save();
            } catch (e) {

            }
        }

        return {
            send: send
        };

    }
);