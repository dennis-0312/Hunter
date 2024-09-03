/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/error', 'N/query', 'N/record', 'N/search', 'N/ui/dialog', 'N/url'],
    /**
     * @param{currentRecord} currentRecord
     * @param{error} error
     * @param{query} query
     * @param{record} record
     * @param{search} search
     * @param{dialog} dialog
     * @param{url} url
     */
    function (currentRecord, error, query, record, search, dialog, url) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        const pageInit = (scriptContext) => {
            console.log('Init');
        }

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
            if (currentRecord.getValue('custpage_ebly_field_process') == '0') {
                console.log('No se procesará');
                return false;
            } else {
                console.log('Continuar');
                return true
            }
        }

        // const back = () => {
        //     let suiteletURL = getSuiteletURL();
        //     let parameters = getFiltersValue(currentRecord);
        //     suiteletURL = addParametersToUrl(suiteletURL, parameters);
        //     setWindowChanged(window, false);
        //     window.location.href = suiteletURL;
        // }

        // const getSuiteletURL = () => {
        //     return url.resolveScript({
        //         scriptId: 'customscript_ts_ui_mass_assembly_view',
        //         deploymentId: 'customdeploy_ts_ui_mass_assembly_view_1'
        //     });
        // }

        // const getFiltersValue = (currentRecord) => {
        //     let values = {
        //         custpage_f_paymentbatch: currentRecord.getValue('custpage_f_paymentbatch')
        //     };
        //     console.log("getFiltersValue", values);
        //     return values;
        // }

        // const addParametersToUrl = (suiteletURL, parameters) => {
        //     for (let param in parameters) {
        //         if (parameters[param]) {
        //             suiteletURL = `${suiteletURL}&${param}=${parameters[param]}`;
        //         }
        //     }
        //     return suiteletURL;
        // }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord

        };

    });
