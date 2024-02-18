/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search'], function (currentRecord, search) {

    function pageInit(context) {
        let miRegistro = currentRecord.get();
        try {
            console.log('INIT');
            miRegistro.setValue({
                fieldId: 'subsidiary',
                value: 2,
                ignoreFieldChange: true,
                forceSyncSourcing: true
            });
            console.log('Desde Init');
        } catch (error) {
            console.error;
        }
    }

    function saveRecord(context) {
        return true;
    }

    function fieldChanged(context) {
        let miRegistro = currentRecord.get();
        let correo = miRegistro.getValue({ fieldId: 'email' });
        if (correo.length != 0) {
            let existe_correo = validarCorreo(correo);
            if (existe_correo != 0) {
                alert('El correo ya se encuentra registrado');
            }
        }
    }

    function validarCorreo(correo) {
        var result = search.create({
            type: 'customer',
            columns: ['internalid', 'email'],
            filters: [
                search.createFilter({
                    name: 'email',
                    operator: search.Operator.HASKEYWORDS,
                    values: correo
                })
            ]
        })
        var theCount = result.runPaged().count;
        return theCount;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged
    }
});
