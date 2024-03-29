/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record'],
    /**
     * @param{currentRecord} currentRecord
     */
    function (currentRecord, record) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        let objRecord = '';
        var typeMode = '';
        function pageInit(scriptContext) {
            objRecord = scriptContext.currentRecord
            typeMode = scriptContext.mode;
        }

        const verifyProccessing = () => {
            //let objRecord = currentRecord.get().id;
            console.log(typeMode)
            console.log(objRecord.getValue('custrecord_ts_epmt_prepmt_status'))
            if (typeMode == 'edit' && objRecord.getValue('custrecord_ts_epmt_prepmt_status') == 'Generado') {
                console.log('Init Proccess');
                let rec = record.submitFields({
                    type: 'customrecord_ts_epmt_payment_batch',
                    id: objRecord.id,
                    values: {
                        'custrecord_ts_epmt_prepmt_status': 'Liberando...'
                    }
                });
            }
            window.location.href = "https://7451241.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1281&id=" + objRecord.id
            //window.location.href = "https://7451241-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=1184&id=" + objRecord.id
        }

        return {
            pageInit,
            verifyProccessing,
            // fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            //saveRecord
        };

    });
