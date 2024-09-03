/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(["N/record", "N/search", "N/log", "N/runtime"],

    function (record, search, log, runtime) {

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
            var Record1a = scriptContext.currentRecord;
            Record1a.getField('field_boletas_rrhh').isDisplay = false;
            Record1a.getField('field_incluir_ventas').isDisplay = false;

            //IMorales 20230829
            if(Record1a.getValue('field_reporte') == 25 ){
                Record1a.getField('field_account').isDisplay = true;
            }else{
                Record1a.getField('field_account').isDisplay = false;
          }
          
            //Gguadalupe 23102023
            if(Record1a.getValue('field_reporte') == 61 ||
              Record1a.getValue('field_reporte') == 57 ||
              Record1a.getValue('field_reporte') == 52 ||
              Record1a.getValue('field_reporte') == 53
              ) {
                Record1a.getField('field_acc_period').isDisplay = false;
                Record1a.getField('field_ano').isDisplay = true;
            }


            return true;
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
            //var rec=currentRecord.get();
            var Record1a = scriptContext.currentRecord;
            var sublistName = scriptContext.sublistId;
            var sublistFieldName = scriptContext.fieldId;
            var line = scriptContext.line;
            console.log(sublistName + '-' + sublistFieldName + '-' + line);
            if (sublistFieldName == 'field_reporte') {
                console.log(Record1a.getValue('field_reporte'));
                if (Record1a.getValue('field_reporte') == 5) {
                    Record1a.getField('field_acc_period').isDisplay = false;
                    Record1a.getField('field_format').isDisplay = false;
                    Record1a.getField('field_ano').isDisplay = true;
                }
                // BLOQUE 1 =======================================================================
                
                if (Record1a.getValue('field_reporte') == 11 ||
                    Record1a.getValue('field_reporte') == 12 ||
                    Record1a.getValue('field_reporte') == 13 ||
                    Record1a.getValue('field_reporte') == 14 ||
                    Record1a.getValue('field_reporte') == 16 ||
                    Record1a.getValue('field_reporte') == 28||
                    Record1a.getValue('field_reporte') == 4 ||
                    Record1a.getValue('field_reporte') == 5 ||
                    Record1a.getValue('field_reporte') == 6 ||
                    Record1a.getValue('field_reporte') == 7 ||
                    Record1a.getValue('field_reporte') == 8 ||
                    Record1a.getValue('field_reporte') == 10 ||
                    Record1a.getValue('field_reporte') == 29 ||
                    Record1a.getValue('field_reporte') == 30 ||
                    Record1a.getValue('field_reporte') == 35 ||
                    Record1a.getValue('field_reporte') == 31 ||
                    Record1a.getValue('field_reporte') == 32 ||
                    Record1a.getValue('field_reporte') == 33 ||
                    Record1a.getValue('field_reporte') == 43

                ) {
                    
                    Record1a.getField('field_acc_period').isDisplay = false;
                    Record1a.getField('field_format').isDisplay = true;
                    Record1a.getField('field_ano').isDisplay = true;

                }
                // if (Record1a.getValue('field_reporte') == 7) {
                //     Record1a.getField('field_acc_period').isDisplay = true;
                //     Record1a.getField('field_format').isDisplay = false;
                //     Record1a.getField('field_ano').isDisplay = false;

                // }
                // BLOQUE 2 =======================================================================
                if (
                    Record1a.getValue('field_reporte') != 4 &&
                    Record1a.getValue('field_reporte') != 5 &&
                    Record1a.getValue('field_reporte') != 6 &&
                    Record1a.getValue('field_reporte') != 7 &&
                    Record1a.getValue('field_reporte') != 8 &&
                    Record1a.getValue('field_reporte') != 10 &&
                    Record1a.getValue('field_reporte') != 11 &&
                    Record1a.getValue('field_reporte') != 12 &&
                    Record1a.getValue('field_reporte') != 13 &&
                    Record1a.getValue('field_reporte') != 14 &&
                    Record1a.getValue('field_reporte') != 16 &&
                    Record1a.getValue('field_reporte') != 28 &&
                    Record1a.getValue('field_reporte') != 29 &&
                    Record1a.getValue('field_reporte') != 30 &&
                    Record1a.getValue('field_reporte') != 31 &&
                    Record1a.getValue('field_reporte') != 32 &&
                    Record1a.getValue('field_reporte') != 33 &&
                    Record1a.getValue('field_reporte') != 35 &&
                    Record1a.getValue('field_reporte') != 43 
                ) {
                    Record1a.getField('field_acc_period').isDisplay = true;
                    Record1a.getField('field_format').isDisplay = true;
                    Record1a.getField('field_ano').isDisplay = false;
                }

                if (Record1a.getValue('field_reporte') == 2) {
                    Record1a.getField('field_boletas_rrhh').isDisplay = true;
                } else {
                    Record1a.getField('field_boletas_rrhh').isDisplay = false;
                }

                if (Record1a.getValue('field_reporte') == 1 || Record1a.getValue('field_reporte') == 10) {
                    Record1a.getField('field_incluir_ventas').isDisplay = true;
                } else {
                    Record1a.getField('field_incluir_ventas').isDisplay = false;
                }

                //IMorales 20230829
                if(Record1a.getValue('field_reporte') == 25 ){
                    Record1a.getField('field_account').isDisplay = true;
                }else{
                    Record1a.getField('field_account').isDisplay = false;
              }
              
              //Gguadalupe 23102023
              if(Record1a.getValue('field_reporte') == 61 ||
                Record1a.getValue('field_reporte') == 57 ||
                Record1a.getValue('field_reporte') == 52 ||
                Record1a.getValue('field_reporte') == 53
              ) {
                Record1a.getField('field_acc_period').isDisplay = false;
                Record1a.getField('field_ano').isDisplay = true;
              }
              
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
            return true;
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
        function lineInit(context) {


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

            return true;
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

            return true;
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

            return true;

        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            //postSourcing: postSourcing,
            //sublistChanged: sublistChanged,
            //lineInit: lineInit,
            //validateField: validateField,
            //validateLine: validateLine,
            //validateInsert: validateInsert,
            //validateDelete: validateDelete,
            //saveRecord: saveRecord
        };

    });