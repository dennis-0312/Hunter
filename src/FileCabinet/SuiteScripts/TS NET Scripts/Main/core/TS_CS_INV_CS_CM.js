/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
 define(['N/runtime', 'N/search'], function (runtime, search) {

    const Factura_Compra = 'vendorbill';
    var typeMode = '';
    var customer_old = '';
    var pe_number_old = '';

    function pageInit(context) {
        try {
            typeMode = context.mode;
            var currentRecord = context.currentRecord;
            var type_transaction = currentRecord.type;
            console.log('typeMode',typeMode);
            if(typeMode == 'edit'){
                customer_old = currentRecord.getValue({ fieldId: 'entity' });
                pe_number_old = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
            }
        } catch (e) {
            console.log('Error en: ' + e);
        }
    }

    function saveRecord(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var typeTransaction = currentRecord.type;
        var oldRecord = context.oldRecord;

        if (typeTransaction == Factura_Compra){
            if(typeMode == 'create' || typeMode == 'copy' ){
                var customer = currentRecord.getValue({ fieldId: 'entity' });
                var pe_number = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                console.log('customer',customer);
                console.log('pe_number',pe_number);
                let existe = buscarFacCompra(customer,pe_number);

                console.log('existe',existe);
                if(existe){
                    alert('Ya existe una Factura de Compra con el mismo Proveedor y Numero Preimpreso');
                    return false;
                }
            } else if(typeMode == 'edit'){

                var customer = currentRecord.getValue({ fieldId: 'entity' });
                var pe_number = currentRecord.getValue({ fieldId: 'custbody_ts_ec_numero_preimpreso' });
                console.log('customer',customer);
                console.log('pe_number',pe_number);
                console.log('customer_old',customer_old);
                console.log('pe_number_old',pe_number_old);

                if(customer != customer_old || pe_number != pe_number_old){
                    let existe = buscarFacCompra(customer,pe_number);
                    if(existe){
                        alert('Ya existe una Factura de Compra con el mismo Proveedor y Numero Preimpreso');
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function validateField(context) {

    }

    function fieldChanged(context) {

    }

    function postSourcing(context) {

    }

    function lineInit(context) {

    }

    function validateDelete(context) {

    }

    function validateInsert(context) {

    }

    const buscarFacCompra = (idCustomer, preimpreso) => {
        var vendorbillSearchObj = search.create({
            type: "vendorbill",
            filters:
            [
               ["type","anyof","VendBill"], 
               "AND", 
               ["name","is",idCustomer], 
               "AND", 
               ["custbody_ts_ec_numero_preimpreso","is",preimpreso], 
               "AND", 
               ["mainline","is","T"]
            ],
            columns:
            [
               search.createColumn({name: "internalid", label: "ID interno"})
            ]
        });

        let objRecord = vendorbillSearchObj.run().getRange(0,1000);
        let existe = false;
        if(objRecord.length > 0){
            existe = true;
        }
        return existe
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
        // validateField: validateField,
        //fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        //validateLine: validateLine,
        //sublistChanged: sublistChanged
    }
});