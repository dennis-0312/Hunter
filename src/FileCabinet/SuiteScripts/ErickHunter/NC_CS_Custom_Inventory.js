/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/search','N/ui/dialog'], function(search,dialog) {

   

    function saveRecord(context) {
       
       
        var currentRecord = context.currentRecord;
        let inventoryAssignmentLines = currentRecord.getLineCount({ sublistId: 'inventoryassignment' });
        let id = currentRecord.getValue({ fieldId: 'item' });
        let fieldLookUp = search.lookupFields({ type: 'serializedinventoryitem', id: id, columns: ['custitem_ht_ai_tipocomponente'] });
        let tipeItmes ;

        if(Object.keys(fieldLookUp).length != 0){
            if(fieldLookUp.custitem_ht_ai_tipocomponente.length != 0){
                tipeItmes = fieldLookUp.custitem_ht_ai_tipocomponente[0].value;
            }
           
        }
       
        let tipoItmesText;
        let customRecord;
        let columns;
        let estadoColumna=0;
                switch (tipeItmes) {
                    case '1':
                        tipoItmesText = " Dispositivo Chaser" ;
                        customRecord = "customrecord_ht_record_detallechaserdisp" ;
                        columns =[
                            search.createColumn({name: "internalid", label: "ID"}),
                            search.createColumn({name: "custrecord_ht_dd_dispositivo", label: "dd_dispositivo"}),
                            search.createColumn({name: "custrecord_ht_dd_item", label: "dd_item"}),
                            search.createColumn({name: "custrecord_ht_dd_tipodispositivo", label: "dd_tipodispositivo"}),
                            search.createColumn({name: "custrecord_ht_dd_modelodispositivo", label: "dd_modelodispositivo"}),
                            search.createColumn({name: "custrecord_ht_dd_macaddress", label: "dd_macaddress"}),
                            search.createColumn({name: "custrecord_ht_dd_imei", label: "dd_imei"}) ,
                            search.createColumn({name: "custrecord_ht_dd_firmware", label: "dd_firmware"}),
                            search.createColumn({name: "custrecord_ht_dd_script", label: "dd_script"}),
                            search.createColumn({name: "custrecord_ht_dd_servidor", label: "dd_servidor"}),
                            search.createColumn({name: "custrecord_ht_dd_estado", label: "dd_estado"}),
                            search.createColumn({name: "custrecord_ht_dd_tipodispocha", label: "dd_tipodispocha"}) 
                        ];
                        break;
                    case '2':
                        tipoItmesText = " Sim Card" ;
                        customRecord = "customrecord_ht_record_detallechasersim" ;
                        columns =[
                            search.createColumn({name: "internalid", label: "ID"}),
                            search.createColumn({name: "custrecord_ht_ds_simcard", label: "ds_simcard"}),
                            search.createColumn({name: "custrecord_ht_ds_serie", label: "ds_serie"}),
                            search.createColumn({name: "custrecord_ht_ds_tiposimcard", label: "ds_tiposimcard"}),
                            search.createColumn({name: "custrecord_ht_ds_operadora", label: "ds_operadora"}),
                            search.createColumn({name: "custrecord_ht_ds_ip", label: "ds_ip"}),
                            search.createColumn({name: "custrecord_ht_ds_apn", label: "ds_apn"}),
                            search.createColumn({name: "custrecord_ht_ds_numerocelsim", label: "ds_numerocelsim"}),
                            search.createColumn({name: "custrecord_ht_ds_estado", label: "ds_estado"}) 
                        ];
                        break;
                    case '3':
                        tipoItmesText = " LOJACK" ;
                        customRecord = "customrecord_ht_record_detallechaslojack" ;
                        estadoColumna =4;
                        columns =[
                            search.createColumn({name: "internalid", label: "ID"}),
                            search.createColumn({name: "custrecord_ht_cl_seriebox", label: "cl_seriebox"}),
                            search.createColumn({name: "custrecord_ht_cl_activacion", label: "cl_activacion"}),
                            search.createColumn({name: "custrecord_ht_cl_respuesta", label: "cl_respuesta"}),
                            search.createColumn({name: "custrecord_ht_cl_estado", label: "cl_estado"}),
                        ];
                        break;
                    default:
                        break;
                }
        console.log(customRecord);
        console.log(columns);
        let flag = true ;
        for (let j = 0; j < inventoryAssignmentLines; j++) {
            let inventoryAssignment = currentRecord.selectLine({ sublistId: 'inventoryassignment', line: j });
            let binNumber = inventoryAssignment.getCurrentSublistText({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber' });
       
            if(binNumber == '' || tipeItmes == null){
                return true;
            }
            var busqueda = search.create({
                type: customRecord,
                filters:
                [
                    search.createFilter({
                        name: 'name',
                        operator: search.Operator.HASKEYWORDS,
                        values: binNumber
                    })
                ],
                columns:columns
            });
            var pageData = busqueda.runPaged({
                pageSize: 1000
            });
           
            if(pageData.count == 0){
         
                dialog.alert({ title: 'Información', message: tipoItmesText + ' '+binNumber + ' No valido'});
                return false;  
            }
            pageData.pageRanges.forEach(function (pageRange) {
            page = pageData.fetch({
                index: pageRange.index
            });
            
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    
                    for (let i = 0; i < columns.length; i++) {
                       
                        if (result.getValue(columns[i]) == ''){
                            dialog.alert({ title: 'Información', message: 'No se tiene llenado todos los campos del ' + tipoItmesText + ' '+binNumber});
                            flag = false ;
                            break;
                        }
                       


                    }
                    
                    if (result.getValue(columns[estadoColumna]) != 1 && estadoColumna !=0){
                        dialog.alert({ title: 'Información', message: 'Estado de Dispositivo ' + tipoItmesText + ' no Disponible '+binNumber});
                        flag = false ;
                        return false;
                    }
                   
                });         
            });
  
        }
        return flag
        
    }

  
    return {
        saveRecord: saveRecord
 
        
    }
});
