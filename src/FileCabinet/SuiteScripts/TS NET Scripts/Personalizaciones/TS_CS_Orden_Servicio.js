/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/search', 'N/currentRecord', 'N/ui/message'], (search, currentRecord, message) => {
    let typeMode = '';
    let fieldBien = '';

    const pageInit = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;
        typeMode = scriptContext.mode; //!Importante, no borrar.
        // console.log('Hola: ' + typeMode);
        // let filtro = objRecord.getValue('custpage_field_tipo');
        // console.log(filtro + ' - ' + filtro.length);
        // fieldBien = form.addField({
        //     id: 'custpage_field_bien',
        //     type: serverWidget.FieldType.SELECT,
        //     //source: 'customrecord_ht_record_bienes',
        //     label: 'Bien',
        //     container: 'fieldgroupid'
        // });
        // fieldBien.addSelectOption({ value: -1, text: '' });

    }

    function saveRecord(scriptContext) {

    }

    function validateField(scriptContext) {

    }

    const fieldChanged = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;
        try {
            if (objRecord.getValue({ fieldId: 'custpage_field_bien' }).length > 0) {
                objRecord.setValue({ fieldId: 'custbody_ht_os_bien_flag', value: objRecord.getValue({ fieldId: 'custpage_field_bien' }), ignoreFieldChange: true })
                // let searchBien = search.create({
                //     type: "customrecord_ht_record_bienes",
                //     filters: [["custrecord_ht_bien_propietario", "anyof", "502612"]], //terrestte, marítimo, inmueble, producción, tanque
                //     columns: ['internalid', 'name']
                // });

                // searchBien.run().each((result) => {
                //     var subId = result.getValue({ name: 'internalId' });
                //     var subName = result.getValue({ name: 'name' });
                //     fieldBien.addSelectOption({ value: subId, text: subName });
                //     return true;
                // });
            }
        } catch (error) {
            console.log(error)
        }
    }

    function postSourcing(scriptContext) {

    }

    function lineInit(scriptContext) {

    }

    function validateDelete(scriptContext) {

    }

    function validateInsert(scriptContext) {

    }

    function validateLine(scriptContext) {

    }

    function sublistChanged(scriptContext) {

    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        //fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
