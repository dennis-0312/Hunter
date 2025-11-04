/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/format', 'N/currentRecord'],

    function (url, format, currentRecord) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            console.log('Hola Mundo');
            currentRecord = currentRecord.get();
            var fieldsFormDomElement = document.querySelector("#custpage_sublist_resultados_form > div.subtabblock");
            if (fieldsFormDomElement) {
                fieldsFormDomElement.style.display = "none";
            }
            var buttonsFormDomElement = document.querySelector("#custpage_sublist_resultados_buttons");
            if (buttonsFormDomElement) {
                buttonsFormDomElement.style.display = "none";
            }
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
        function fieldChanged(scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            let fieldId = scriptContext.fieldId;
            let fechaDesde = currentRecord.getValue({
                fieldId: 'custpage_fechadesde'
            });

            let fechaHasta = currentRecord.getValue({
                fieldId: 'custpage_fechahasta'
            });

            if (fechaDesde != '' && fechaHasta != '' && (fieldId == "custpage_fechadesde" || fieldId == "custpage_fechahasta")) {
                if (fechaDesde > fechaHasta) {
                }
                fechaDesde = format.format({
                    value: fechaDesde,
                    type: format.Type.DATE
                });

                fechaHasta = format.format({
                    value: fechaHasta,
                    type: format.Type.DATE
                });

                let params = {
                    flag: 'searchEjecuciones',
                    fechaDesde: fechaDesde,
                    fechaHasta: fechaHasta
                }

                params = JSON.stringify(params);
                window.onbeforeunload = null;
                let output = url.resolveScript({
                    scriptId: 'customscript_ts_sl_gap_3_facturacion_est',
                    deploymentId: 'customdeploy_ts_sl_gap_3_facturacion_est',
                    params: {
                        custscript_ts_params: params
                    }
                });

                setWindowChanged(window, false);
                window.location.href = output;
            }
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {

        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

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
        function saveRecord(scriptContext) {

        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            /*  postSourcing: postSourcing,
             sublistChanged: sublistChanged,
             lineInit: lineInit,
             validateField: validateField,
             validateLine: validateLine,
             validateInsert: validateInsert,
             validateDelete: validateDelete,
             saveRecord: saveRecord */
        };

    });
