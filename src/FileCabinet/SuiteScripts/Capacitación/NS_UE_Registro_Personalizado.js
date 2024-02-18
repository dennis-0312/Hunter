/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record'], function (record) {

    function beforeLoad(context) {
        let objRecord = context.newRecord;
        objRecord.setValue({ fieldId: 'custrecord_ec_primer_nombre', value: 'Dennis' });
        objRecord.setValue({ fieldId: 'custrecord_ec_apellidos', value: 'Fernandez' });


        // let registro = record.load({
        //     type: 'customrecord_dfr_registro_personalizado'
        // });


    }

    return {
        beforeLoad: beforeLoad
    }
});
