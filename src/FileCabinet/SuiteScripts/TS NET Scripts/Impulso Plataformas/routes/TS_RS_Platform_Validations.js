/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/https', 'N/log', 'N/url', 'N/record'],
    /**
 * @param{https} https
 * @param{log} log
 * @param{url} url
 * @param{record} record
 */
    (https, log, url, record) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
            try {
                let fooRecord = record.load({ type: record.Type.SALES_ORDER, id: 44903 });
                let itemFulfillment = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: 44903,
                    toType: record.Type.ITEM_FULFILLMENT,
                    isDynamic: true
                });
                log.debug('fulfillment', 'fulfillment');
                itemFulfillment.selectLine({ sublistId: 'item', line: 0 })
                itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: 8 });
                itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 26 });
                itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });

                let objSubRecord = itemFulfillment.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                objSubRecord.selectLine({ sublistId: 'inventoryassignment', line: 0 })
                objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: 14004 });
                objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: 229 });
                objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                objSubRecord.commitLine({ sublistId: 'inventoryassignment' });
                itemFulfillment.commitLine({ sublistId: 'item' });

                let fulfillment = itemFulfillment.save();
                log.debug('fulfillment', 'fulfillment');
                return fulfillment;
            } catch (error) {
                return error;
            }
        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => { }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => { }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => { }

        return { get, put, post, delete: doDelete }

    });
