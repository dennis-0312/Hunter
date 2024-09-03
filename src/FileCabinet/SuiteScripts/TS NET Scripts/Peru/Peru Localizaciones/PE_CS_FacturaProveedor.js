/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/runtime'], function (search, runtime) {
  function pageInit(context) {
      
  }

  function fieldChanged(context) {
   var params = runtime.getCurrentScript().getParameter({
      name: 'custscript_pe_cs_type_document'
  });
    context.currentRecord.getField('postingperiod').isDisabled = false;//20230908

   
      if (context.fieldId === 'custbody_pe_concept_detraction') {
        let comboSuperior = context.currentRecord.getValue({ fieldId: 'custbody_pe_concept_detraction' }),
            moneda = context.currentRecord.getValue({ fieldId: 'currency' }),
            tipoDocumento = context.currentRecord.getValue({ fieldId: 'custbody_pe_document_type' });
    
        console.log('Doc ->' + tipoDocumento + ' Param -> '+ params)
        if (tipoDocumento == params && comboSuperior != '') {
          if (moneda == "1"){//PEN
            var fieldLookUp = search.lookupFields({
              type: 'customrecord_pe_concept_detraction',
              id: comboSuperior,
              columns: ['custrecord_pe_tax_codes_pen']
            });
            console.log((fieldLookUp.custrecord_pe_tax_codes_pen).length)
            if((fieldLookUp.custrecord_pe_tax_codes_pen).length != 0){
              context.currentRecord.setValue({ fieldId: 'custpage_4601_witaxcode', value: fieldLookUp.custrecord_pe_tax_codes_pen[0].value })
            }
  
          }else{
            var fieldLookUp = search.lookupFields({
              type: 'customrecord_pe_concept_detraction',
              id: comboSuperior,
              columns: ['custrecord_pe_tax_codes_dol']
            });
            console.log((fieldLookUp.custrecord_pe_tax_codes_dol).length != 0)
            if(fieldLookUp.custrecord_pe_tax_codes_dol){
              context.currentRecord.setValue({ fieldId: 'custpage_4601_witaxcode', value: fieldLookUp.custrecord_pe_tax_codes_dol[0].value })
            }
          }
        }
        

    }
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged
  }
});