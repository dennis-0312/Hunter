/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/search', "N/record"], function (currentRecord, url, search, record) {

    let typeMode = "";
    function pageInit(context) {
        typeMode = context.mode;
        console.log("GG")
        console.log("typeMode = " + typeMode)
        if (typeMode == "copy" || typeMode == "create") {
            // const objRecord = context.currentRecord;
            //   if (objRecord.type == 'vendorcredit') {
            //        let tipetrans = objRecord.getText({ fieldId: 'createdfrom' }).substring(0,13);

            //         if(tipetrans=='Vendor Return' || tipetrans=='Autorización '){
            //             var vendorreturnauthorization = record.load({ type: 'vendorreturnauthorization', id: objRecord.getValue({ fieldId: 'createdfrom' }), isDynamic: true });
            //             let tipetransVendor = vendorreturnauthorization.getText({ fieldId: 'createdfrom' }).substring(0,4);

            //           if(tipetransVendor=='Bill' || tipetransVendor == 'Fact'){
            //                 updateCampos(vendorreturnauthorization.getValue({ fieldId: 'createdfrom' }),objRecord);
            //             }


            //         }else{
            //             updateCampos(objRecord.getValue({ fieldId: 'createdfrom' }),objRecord);
            //         }
            // }
            setearReferencias(context)
        }
    }
    function updateCampos(IdVendor, objRecord) {
        var bill = record.load({ type: 'vendorbill', id: IdVendor, isDynamic: true });
        var trandate = bill.getValue({ fieldId: 'trandate' });
        var exchangerate = bill.getValue({ fieldId: 'exchangerate' });
        var custbody_pe_document_type = bill.getValue({ fieldId: 'custbody_pe_document_type' });
        var custbody_pe_serie_cxp = bill.getValue({ fieldId: 'custbody_pe_serie_cxp' });
        var custbody_pe_number = bill.getValue({ fieldId: 'custbody_pe_number' });
        objRecord.setValue({ fieldId: 'custbody_pe_document_type_ref', value: custbody_pe_document_type });
        objRecord.setValue({ fieldId: 'custbody_pe_document_series_ref', value: custbody_pe_serie_cxp })
        objRecord.setValue({ fieldId: 'custbody_pe_document_number_ref', value: custbody_pe_number })
        objRecord.setValue({ fieldId: 'custbody_pe_document_date_ref', value: trandate })
        objRecord.setValue({ fieldId: 'exchangerate', value: exchangerate })
        objRecord.setValue({ fieldId: 'custbody_pe_reason', value: null })
        objRecord.setValue({ fieldId: 'custbody_pe_serie_cxp', value: null })
        objRecord.setValue({ fieldId: 'custbody_pe_number', value: null })

    }

    function setearReferencias(context) {
        try {
            var currentUrl = window.location.href;
            var urlParams = new URLSearchParams(currentUrl);
            var transformValue = urlParams.get('transform');
            var idValue = urlParams.get('id');

            console.log('transformValue = ' + transformValue)
            console.log('idValue = ' + idValue)
            if (transformValue == 'vendbill' && idValue != null) {
                console.log("Recuperando los datos del vendbill")
                let getCampos = search.lookupFields({
                    type: 'vendorbill',
                    id: idValue,
                    columns: ['custbody_pe_document_type', 'custbody_pe_serie_cxp', 'custbody_pe_number', 'trandate']
                });
                console.log(getCampos)
                let custbody_pe_document_type = getCampos.custbody_pe_document_type[0].value;
                let custbody_pe_serie_cxp = getCampos.custbody_pe_serie_cxp;
                let custbody_pe_number = getCampos.custbody_pe_number;
                let trandate = getCampos.trandate;
                var currentRecordObj = currentRecord.get();
                currentRecordObj.setValue({ fieldId: 'custbody_pe_document_type_ref', value: custbody_pe_document_type });
                currentRecordObj.setValue({ fieldId: 'custbody_pe_document_series_ref', value: custbody_pe_serie_cxp, text: custbody_pe_serie_cxp });
                currentRecordObj.setValue({ fieldId: 'custbody_pe_document_number_ref', value: custbody_pe_number, value: custbody_pe_number });
                var dateParts = trandate.split('/');
                var dateObject = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                currentRecordObj.setValue({ fieldId: 'custbody_pe_document_date_ref', value: dateObject });

                //Nota de Crédito
                currentRecordObj.setValue({ fieldId: 'custbody_pe_document_type', value: '106' });//Nota de Crédito
                currentRecordObj.setValue({ fieldId: 'custbody_pe_serie_cxp', value: '' });
                currentRecordObj.setValue({ fieldId: 'custbody_pe_number', value: '' });
            }
        } catch (error) {
            console.log("error: " + error)
        }
    }

    function fieldChanged(context) {
        if ((typeMode == "copy" || typeMode == "create" || typeMode == "edit") &&
            (context.fieldId === 'custbody_pe_document_type' || context.fieldId === 'custbody_pe_serie_cxp' || context.fieldId === 'custbody_pe_number')) {
            let custbody_pe_document_type_prefijo = ''
            let custbody_pe_serie_cxp = ''
            let custbody_pe_number = ''

            var currentRecordObj = currentRecord.get();

            console.log('cambio en tipo comprobante, serie o correlativo')
            let custbody_pe_document_type_id = currentRecordObj.getValue({ fieldId: 'custbody_pe_document_type' });
            console.log('custbody_pe_document_type_id = ' + custbody_pe_document_type_id)

            if (custbody_pe_document_type_id != null && custbody_pe_document_type_id != '') {
                let getTipoComprobante = search.lookupFields({
                    type: 'customrecord_pe_fiscal_document_type',
                    id: custbody_pe_document_type_id,
                    columns: ['custrecord_pe_prefix']
                });
                custbody_pe_document_type_prefijo = getTipoComprobante.custrecord_pe_prefix;
                console.log('custbody_pe_document_type_prefijo = ' + custbody_pe_document_type_prefijo)
            }

            custbody_pe_serie_cxp = currentRecordObj.getValue({ fieldId: 'custbody_pe_serie_cxp' });
            console.log('custbody_pe_serie_cxp = ' + custbody_pe_serie_cxp)
            custbody_pe_number = currentRecordObj.getValue({ fieldId: 'custbody_pe_number' });
            console.log('custbody_pe_number = ' + custbody_pe_number)

            currentRecordObj.setValue({ fieldId: 'tranid', value: custbody_pe_document_type_prefijo + '-' + custbody_pe_serie_cxp + '-' + custbody_pe_number });
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    }
});