/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['N/email', 'N/encode', 'N/format', 'N/https', 'N/record', 'N/search'],
    /**
     * @param{email} email
     * @param{encode} encode
     * @param{format} format
     * @param{https} https
     * @param{record} record
     * @param{search} search
     * 
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
    function (email, encode, format, https, record, search) {

        function send(pluginContext) {

            var MSG_NO_EMAIL = translator.getString("ei.sending.sendernoemail");
            var MSG_SENT_DETAILS = translator.getString("ei.sending.sentdetails");

            var senderDetails = pluginContext.sender;
            var customer = pluginContext.customer;
            var transaction = pluginContext.transaction;
            var recipientList = customer.recipients;
            var result = {};
            var parameters;
            if (!senderDetails.email) {
                parameters = {
                    EMPLOYEENAME: senderDetails.name
                };
                stringFormatter.setString(MSG_NO_EMAIL);
                stringFormatter.replaceParameters(parameters);
                result = {
                    success: false,
                    message: stringFormatter.toString()
                };
            } else {
                var invoiceSendDetails = {
                    number: transaction.number,
                    poNumber: transaction.poNum,
                    transactionType: transaction.type,
                    eInvoiceContent: pluginContext.eInvoiceContent,
                    attachmentFileIds: pluginContext.attachmentFileIds
                };
                notifier.notifyRecipient(senderDetails.id, recipientList, invoiceSendDetails);

                parameters = {
                    SENDER: senderDetails.email,
                    RECIPIENTS: recipientList.join(", ")
                };
                stringFormatter.setString(MSG_SENT_DETAILS);
                stringFormatter.replaceParameters(parameters);

                result = {
                    success: true,
                    message: stringFormatter.toString()
                };
            }
            return result;
        }

        return {
            send: send
        };

    });
