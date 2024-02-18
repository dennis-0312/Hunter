S_CS_Correo.js /**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/query', 'N/ui/dialog'],
    /**
     * @param{currentRecord} currentRecord
     * @param{query} query
     */
    (currentRecord, query, dialog) => {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */

        let typeMode = '';
        const pageInit = (scriptContext) => {
            typeMode = scriptContext.mode; //!Importante, no borrar.
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
        const fieldChanged = (scriptContext) => { }

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
        const postSourcing = (scriptContext) => { }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        const sublistChanged = (scriptContext) => { }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        const lineInit = (scriptContext) => { }

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
        const validateField = (scriptContext) => { }

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
        const validateLine = (scriptContext) => { }

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
        const validateInsert = (scriptContext) => { }

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
        const validateDelete = (scriptContext) => { }

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
            const objRecord = currentRecord.get();
            const EMAIL_TYPE_AMI = 2;

            try {
                if (objRecord.getValue({ fieldId: 'custrecord_ht_email_tipoemail' }) == EMAIL_TYPE_AMI) {
                    let customer = objRecord.getValue({ fieldId: 'custrecord_ht_ce_enlace' });
                    let sql = 'SELECT COUNT(*) AS cantidad FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = ? AND custrecord_ht_ce_enlace = ?';
                    let results = query.runSuiteQL({ query: sql, params: [EMAIL_TYPE_AMI, customer] }).asMappedResults();
                    if (results[0].cantidad > 0 && (typeMode == 'create' || typeMode == 'copy')) {
                        dialog.alert({ title: 'Información', message: 'Ya existe un correo electrónico tipo AMI para este cliente.' });
                        return false;
                    } else {
                        let email = objRecord.getValue({ fieldId: 'custrecord_ht_email_email' });
                        let sql2 = 'SELECT COUNT(*) AS cantidad FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = ? AND custrecord_ht_email_email = ? AND custrecord_ht_ce_enlace != ?';
                        let results2 = query.runSuiteQL({ query: sql2, params: [EMAIL_TYPE_AMI, email, customer] }).asMappedResults();
                        if (results2[0].cantidad > 0) {
                            dialog.alert({ title: 'Información', message: 'Ya existe este correo electrónico tipo AMI.' });
                            return false;
                        } else {
                            return true;
                        }
                    }
                } else {
                    return true;
                }
            } catch (error) {
                dialog.alert({ title: 'Error', message: error.message });
                return false;
            }
        }

        return {
            pageInit: pageInit,
            // fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            saveRecord: saveRecord
        };

    });
