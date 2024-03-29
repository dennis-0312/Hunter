/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/runtime', 'N/search',], function (runtime, search) {

    const Factura_Compra = 'vendorbill';
    var typeMode = '';
    var customer_old = '';
    var pe_number_old = '';

    function pageInit(context) {
        try {
            typeMode = context.mode;
            // console.log(typeMode)
            var currentRecord = context.currentRecord;
            var type_transaction = currentRecord.type;
            if (typeMode == 'edit') {
                customer_old = currentRecord.getValue({ fieldId: 'entity' });
                pe_number_old = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
            }
            let userObj = runtime.getCurrentUser();
            console.log('User', userObj.id)
        } catch (e) {
            console.log('Error en: ' + e);
        }
    }

    function saveRecord(context) {
        let userObj = runtime.getCurrentUser();
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var typeTransaction = currentRecord.type;
        var oldRecord = context.oldRecord;
        if (typeTransaction == Factura_Compra) {
            if (typeMode == 'create' || typeMode == 'copy') {
                var customer = currentRecord.getValue({ fieldId: 'entity' });
                var pe_number = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                let existe = buscarFacCompra(customer, pe_number);
                console.log('Usuario', userObj.id);
                console.log(existe)
                if (existe) {
                    // if (existe || userObj.id == 4 || userObj.id == 13) {
                    alert('Ya existe una Factura de Compra con el mismo Proveedor y Numero Preimpreso');
                    return false;
                }
            } else if (typeMode == 'edit') {
                var customer = currentRecord.getValue({ fieldId: 'entity' });
                var pe_number = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                if (customer != customer_old || pe_number != pe_number_old) {
                    let existe = buscarFacCompra(customer, pe_number);
                    if (existe) {
                        alert('Ya existe una Factura de Compra con el mismo Proveedor y Numero Preimpreso');
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function validateField(context) { }

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            if (sublistName == 'expense') {
                try {
                    // console.log('Entry1')
                    if (sublistFieldName == 'taxcode') {
                        // console.log('Entry2')
                        let descriptionTaxCode = getDescriptionTaxCode();
                        let descTaxCode = descriptionTaxCode.find(element => element.id == currentRecord.getCurrentSublistValue({ sublistId: "expense", fieldId: "taxcode" }))
                        currentRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_tst_desc_iva', value: descTaxCode.description, ignoreFieldChange: true });
                    }
                } catch (error) { }
            }

            if (sublistName == 'item') {
                try {
                    if (sublistFieldName == 'taxcode') {
                        let descriptionTaxCode = getDescriptionTaxCode();
                        let descTaxCode = descriptionTaxCode.find(element => element.id == currentRecord.getCurrentSublistValue({ sublistId: "item", fieldId: "taxcode" }))
                        currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_tst_desc_iva', value: descTaxCode.description, ignoreFieldChange: true });
                    }
                } catch (error) { }
            }
        }
    }

    function postSourcing(context) { }

    function lineInit(context) {
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            let descriptionTaxCode = getDescriptionTaxCode();
            if (sublistName === 'expense') {
                try {
                    let descTaxCode = descriptionTaxCode.find(element => element.id == currentRecord.getCurrentSublistValue({ sublistId: "expense", fieldId: "taxcode" }))
                    console.log(descTaxCode);
                    currentRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_tst_desc_iva', value: descTaxCode.description });
                } catch (error) {

                }
            }
        }
    }

    function validateDelete(context) { }

    function validateInsert(context) { }

    function sublistChanged(context) {
        //console.log('Init');
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            // var op = context.operation;
            let descriptionTaxCode = getDescriptionTaxCode();
            if (sublistName === 'expense') {
                let descTaxCode = descriptionTaxCode.find(element => element.id == currentRecord.getCurrentSublistValue({ sublistId: "expense", fieldId: "taxcode" }))
                console.log(descTaxCode);
                currentRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_tst_desc_iva', value: descTaxCode.description });
            }

        }
    }

    const buscarFacCompra = (idCustomer, preimpreso) => {
        var vendorbillSearchObj = search.create({
            type: "vendorbill",
            filters:
                [
                    ["type", "anyof", "VendBill"],
                    "AND",
                    ["name", "anyof", idCustomer],
                    "AND",
                    ["custbody_ts_ec_numero_preimpreso", "is", preimpreso],
                    "AND",
                    ["mainline", "is", "T"]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "ID interno" })
                ]
        });

        let objRecord = vendorbillSearchObj.run().getRange(0, 1000);
        let existe = false;
        if (objRecord.length > 0) {
            existe = true;
        }
        return existe
    }

    const getDescriptionTaxCode = () => {
        // console.log('getDescriptionTaxCode')
        let json = new Array();
        let objSearch = search.create({
            type: "salestaxitem",
            filters: [],
            columns:
                [
                    "internalid",
                    search.createColumn({ name: "name", sort: search.Sort.DESC, label: "Name" }),
                    search.createColumn({ name: "description", label: "Description" })
                ]
        });
        //var searchResultCount = salestaxitemSearchObj.runPaged().count;
        objSearch.run().each((result) => {
            json.push({ id: result.getValue('internalid'), description: result.getValue('description') })
            return true;
        });
        return json;
    }


    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        //validateField: validateField,
        fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        //sublistChanged: sublistChanged
    }
});