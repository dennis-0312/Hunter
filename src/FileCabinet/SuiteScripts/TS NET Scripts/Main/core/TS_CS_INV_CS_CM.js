/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/runtime', 'N/search', 'N/ui/dialog'], function (runtime, search, dialog) {

    const Factura_Compra = 'vendorbill';
    const VENDOR_BILL = 'vendorbill';
    const BILL_CREDIT = 'vendorcredit';
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
        if (typeTransaction == VENDOR_BILL || typeTransaction == BILL_CREDIT) {
            if (typeMode == 'create' || typeMode == 'copy') {
                let customer = currentRecord.getValue({ fieldId: 'entity' });
                let pe_number = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                let doc_fiscal = currentRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                console.log('customer', customer);
                console.log('pe_number', pe_number);
                let existe = buscarFacCompra(customer, pe_number, doc_fiscal);
                console.log('Usuario', userObj.id);
                console.log(existe)
                if (existe) {
                    // if (existe || userObj.id == 4 || userObj.id == 13) {
                    dialog.alert({ title: 'Alerta', message: 'Ya existe una Transacción de Compra con el mismo Proveedor y Numero Preimpreso.' });
                    return false;
                }

                if (currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' }).length != 9 && doc_fiscal != 10 && userObj.id != 4) {
                    dialog.alert({ title: 'Alerta', message: 'El número preimpreso debe tener 9 dígitos.' });
                    return false;
                }
            } else if (typeMode == 'edit') {
                var customer = currentRecord.getValue({ fieldId: 'entity' });
                var pe_number = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                let doc_fiscal = currentRecord.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                console.log('customer', customer);
                if (customer != customer_old || pe_number != pe_number_old) {
                    let existe = buscarFacCompra(customer, pe_number, doc_fiscal);
                    if (existe) {
                        dialog.alert({ title: 'Alerta', message: 'Ya existe una Transacción de Compra con el mismo Proveedor y Numero Preimpreso.' });
                        return false;
                    }
                }

                if (currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' }).length != 9 && userObj.id != 4) {
                    dialog.alert({ title: 'Alerta', message: 'El número preimpreso debe tener 9 dígitos.' });
                    return false;
                }
            }
        }
        if (userObj.id == 4) {
            console.log('Usuario', userObj.id)
            return true
        } else {
            return true
        }
        //return true;
    }

    function validateField(context) { }

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            if (sublistName == 'expense') {
                try {
                    if (sublistFieldName == 'taxcode') {
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

    const buscarFacCompra = (idCustomer, preimpreso, docFiscal) => {
        var vendorbillSearchObj = search.create({
            type: "transaction",
            filters:
                [
                    ["type", "anyof", "VendBill", "VendCred"],
                    "AND",
                    ["name", "anyof", idCustomer],
                    "AND",
                    ["custbody_ts_ec_numero_preimpreso", "is", preimpreso],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["custbodyts_ec_tipo_documento_fiscal", "anyof", docFiscal]
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