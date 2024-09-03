/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/ui/dialog'], (currentRecord, search, dialog) => {
    const CUSTOMER = 'customer';
    const VENDOR = 'vendor';
    const CASH_SALE = 'cashsale';
    let idCliente = 0;
    let modo = null;

    const pageInit = (context) => { 
        modo = context.mode

    }

    const saveRecord = (scriptContext) => {
        try {
            let recordType = scriptContext.currentRecord.type;
            console.log(recordType);
            if (recordType == CUSTOMER || recordType == VENDOR) {
                let entidad = recordType == CUSTOMER ? "Cliente" : recordType == VENDOR ? "Proveedor" : ""//!IMorales 20230823 - Se personalizó el mensaje
                let document_number = scriptContext.currentRecord.getValue('custentity_pe_document_number');
                let getdatesauto = scriptContext.currentRecord.getValue('custentity_pe_crear_cliente_auto');
                console.log("document_number = "+document_number)
                console.log("getdatesauto = "+getdatesauto)
                if (getdatesauto == true) {
                    let isperson = scriptContext.currentRecord.getValue('isperson');
                    console.log("isperson = "+isperson)
                    let returnValidate = validateLength(isperson, document_number);
                    console.log("returnValidate = "+returnValidate)
                    if (returnValidate == 1) {
                        let existCustomer = getExistCustomer(document_number, recordType);
                        let searchByDocumentNumber = searchVendorByDocumentNumber(document_number, recordType)//!IMorales 20230823 - Busqueda a Cliente y Proveedor
                        console.log("-->existCustomer = "+existCustomer)
                        console.log("-->searchByDocumentNumber = "+searchByDocumentNumber)
                        if (existCustomer == 1 || searchByDocumentNumber>0) {
                            let options = { title: 'Información', message: 'El ' + entidad + ' ya se encuentra registrado.' }
                            // scriptContext.currentRecord.setValue({ fieldId: 'custbody_pe_number', value: idCliente, ignoreFieldChange: true, forceSyncSourcing: true });
                            // window.close()
                            // window.location.replace("https://6785603-sb1.app.netsuite.com/app/accounting/transactions/cashsale.nl?whence=&cf=127&entity=408&nexus=1&custpage_4601_appliesto=&subsidiary=1&manual_reload=T")
                            dialog.alert(options);
                            return false;
                        } else {
                            //alert('Se creó');
                            return true;
                        }
                    }
                } else {
                    scriptContext.currentRecord.setValue({ fieldId: 'vatregnumber', value: document_number, ignoreFieldChange: true, forceSyncSourcing: true });
                    let document_type = scriptContext.currentRecord.getText('custentity_pe_document_type');
                    let type_of_person = scriptContext.currentRecord.getText('custentity_pe_type_of_person');
                    if (document_type.length != 0 && type_of_person.length != 0) {
                        //alert('Se creo');
                        return true;
                    } else {
                        let options = { title: 'Información', message: 'Los campos tipo documento y tipo persona son obligatorios.' }
                        dialog.alert(options);
                        return false;
                    }
                }
            }
            // else {
            //     scriptContext.currentRecord.setValue({ fieldId: 'custbody_pe_number', value: idCliente, ignoreFieldChange: true, forceSyncSourcing: true });
            // }

        } catch (error) {
            console.log('Error-saveRecord: ' + error);
        }
    }

    const fieldChanged = (scriptContext) => {
        try {
            console.log('traza 1')
            let getdatesauto = scriptContext.currentRecord.getValue('custentity_pe_crear_cliente_auto');
            console.log('traza getdatesauto='+getdatesauto)
            if (getdatesauto == true) {
                let document_number = scriptContext.currentRecord.getValue('custentity_pe_document_number');
                console.log('traza document_number='+document_number)
                if (document_number.length != 0) {
                    scriptContext.currentRecord.setValue({ fieldId: 'companyname', value: 'Por generar', ignoreFieldChange: true, forceSyncSourcing: true });
                    scriptContext.currentRecord.setValue({ fieldId: 'firstname', value: 'Por generar', ignoreFieldChange: true, forceSyncSourcing: true });
                    scriptContext.currentRecord.setValue({ fieldId: 'lastname', value: 'Por generar', ignoreFieldChange: true, forceSyncSourcing: true });
                    scriptContext.currentRecord.setValue({ fieldId: 'entityid', value: 'Por generar', ignoreFieldChange: true, forceSyncSourcing: true });//IMorales 20230825
                }
            }
            console.log('traza 3=')

            if (modo === 'edit'){ //con el crear no hubo problemas así que obviaré ese paso
            var currentRecord = scriptContext.currentRecord;
            var fieldName = scriptContext.fieldId;
            
            if (fieldName === 'companyname') {
                var entityType = currentRecord.type;
                var entityIndicator = (entityType === 'vendor') ? 'P' : (entityType === 'customer') ? 'C' : '';

                // Obtener los valores necesarios
                var documentNumber = currentRecord.getValue('custentity_pe_document_number');
                var companyName = currentRecord.getValue('companyname');

                // Construir el nuevo valor para 'entityid'
                var newEntityId = entityIndicator + "-" + documentNumber + " " + companyName;

                // Actualizar el campo 'entityid'
                currentRecord.setValue({ fieldId: 'entityid', value: newEntityId });
                console.log("Cambio de entityid con éxito")
            }
            console.log(fieldName);  
           /* if (fieldName === 'custentity_pe_entity_country') {
                var fileId = currentRecord.getValue({
                    fieldId: 'custentity_pe_entity_country' // Reemplaza 'custrecord_campo_de_archivo' con el ID de tu campo de archivo personalizado.
                });
                currentRecord.setValue({
                    fieldId: 'custentity_pe_code_entity_country',
                    value:fileId
                });
                
            }*/
        }
        } catch (error) {
            console.log('Error-fieldChanged: ' + error);
        }
    }


    const getExistCustomer = (document, recordType) => {
        let mySearch = '';
        if (recordType == CUSTOMER) {
            mySearch = search.load({ id: 'customsearch_pe_customer_document_exist' }); //TODO PE - Customer Document Exist - PRODUCCION
        } else {
            mySearch = search.load({ id: 'customsearch_pe_vendor_document_exist' }); //TODO PE - Vendor Document Exist - PRODUCCION
        }

        let filters = mySearch.filters;
        const filterOne = search.createFilter({ name: 'vatregnumber', operator: search.Operator.STARTSWITH, values: document });
        filters.push(filterOne);
        let searchResultCount = mySearch.runPaged().count;
        if (searchResultCount != 0) {
            return 1;
        } else {
            return 0;
        }
    }

    const searchVendorByDocumentNumber = (documentNumber, entityType) => {
        //!IMorales 20230823
        // Crea una búsqueda para verificar si existe un proveedor/cliente con el mismo número de documento
        var vendorSearch = search.create({
            type: entityType,
            filters: [
                search.createFilter({
                    name: 'custentity_pe_document_number',
                    operator: search.Operator.IS,
                    values: documentNumber
                })
            ]
        }).run().getRange({ start: 0, end: 1 });

        return vendorSearch.length;
    }

    const validateLength = (isperson, document) => {
        if (isperson == 'F') {
            if (document.length != 11) {
                let options = { title: 'Información', message: 'El número de documento debe contener 11 caracteres.' }
                dialog.alert(options);
                return false;
            }
        } else {
            if (document.length != 8) {
                let options = { title: 'Información', message: 'El número de documento debe contener 8 caracteres.' }
                dialog.alert(options);
                return false;
            }
        }
        return 1;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged
    }
});