/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/query', 'N/record', 'N/redirect', 'N/render', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/ui/message', 'N/ui/serverWidget'],
    /**
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{redirect} redirect
 * @param{render} render
 * @param{runtime} runtime
 * @param{search} search
 * @param{dialog} dialog
 * @param{message} message
 * @param{serverWidget} serverWidget
 */
    (log, query, record, redirect, render, runtime, search, dialog, message, serverWidget) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

        }

        return {onRequest}

    });
