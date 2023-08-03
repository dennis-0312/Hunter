/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/ui/serverWidget'], (log, search, record, serverWidget) => {

    const beforeLoad = (context) => {
        let objRecord = context.newRecord;


        //let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });


        //let inventorynumber = invDetailRec.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });

        /*  let form = context.form;
          let pageHTML = '<!DOCTYPE html>'
              pageHTML += '<html lang="en">'
              pageHTML += '<head>'
              pageHTML += '<meta charset="UTF-8">'
              pageHTML += '<meta http-equiv="X-UA-Compatible" content="IE=edge">'
              pageHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
              pageHTML += '<title>Connect Print</title>'
              pageHTML += '</head>'
              pageHTML += '<body>'
              pageHTML += '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>'
              pageHTML += '<script>'
              pageHTML += '$(document).ready(function() {'
          
              pageHTML += 'if ($("#inventorydetail_helper_popup").length) {'
              pageHTML += '$("#inventorydetail_helper_popup").click(function(){'
  
              pageHTML += 'document.getElementById("custbody_ht_modal_estado_fs_inp").checked = false;'
              pageHTML += 'document.getElementById("custbody_ht_modal_estado_fs_inp").click();'
             
              pageHTML += '});'
              pageHTML += '    }'
              pageHTML += '    else {'
              pageHTML += '        alert("The element does not exist");'
              pageHTML += '     }'
              pageHTML += '});'
              pageHTML += '</script>'
              pageHTML += '</body>'
              pageHTML += '</html>';
              let field = form.addField({
                  id: 'custpage_canvas',
                  type: serverWidget.FieldType.INLINEHTML,
                  label: ' '
              }).defaultValue = pageHTML;*/



    }

    const afterSubmit = (context) => {
        let id = context.newRecord.id;
        let objRecord = context.newRecord;
        log.debug('prueba', id);

        if (context.type === 'create') {
            var numLines = objRecord.getLineCount({ sublistId: 'component' });
            let object;
            let Simcard;
            let lojack;
            let IdOrdenTrabajo = objRecord.getValue({ fieldId: 'custbody_ht_ce_ordentrabajo' });
            let bienid = search.lookupFields({
                type: 'customrecord_ht_record_ordentrabajo',
                id: IdOrdenTrabajo,
                columns: ['custrecord_ht_ot_vehiculo']
            });

            let objRecordCreate = record.create({ type: 'customrecord_ht_record_mantchaser', isDynamic: true });
            for (let i = 0; i < numLines; i++) {
                let item = objRecord.getSublistValue({ sublistId: 'component', fieldId: 'item', line: i });
                let quantity = objRecord.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line: i });
                let fieldLookUp = search.lookupFields({ type: 'serializedinventoryitem', id: item, columns: ['custitem_ht_ai_tipocomponente'] });
                let tipeItmes;
                if (Object.keys(fieldLookUp).length != 0) {
                    if (fieldLookUp.custitem_ht_ai_tipocomponente.length != 0) {
                        tipeItmes = fieldLookUp.custitem_ht_ai_tipocomponente[0].value;
                    }
                }

                if (quantity != 0 && tipeItmes == 1) {
                    object = getInventorynumber(objRecord, i, tipeItmes);
                    object.pageRanges.forEach(function (pageRange) {
                        page = object.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            var columns = result.columns;
                            log.debug('custrecord_ht_mc_seriedispositivo', result.getValue(columns[1]));
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivo', value: result.getValue(columns[0]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[12]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_modelo', value: result.getValue(columns[4]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_unidad', value: result.getValue(columns[3]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_imei', value: result.getValue(columns[6]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_firmware', value: result.getValue(columns[7]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_script', value: result.getValue(columns[8]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_servidor', value: result.getValue(columns[9]), ignoreFieldChange: true });
                            // objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vid', value: result.getValue(columns[7]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vid', value: bienid.custrecord_ht_ot_vehiculo[0].value, ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estado', value: result.getValue(columns[10]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_tipodispositivo', value: result.getValue(columns[11]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vehiculo', value: bienid.custrecord_ht_ot_vehiculo[0].value, ignoreFieldChange: true });
                        });
                    });
                }

                if (quantity != 0 && tipeItmes == 2) {
                    Simcard = getInventorynumber(objRecord, i, tipeItmes);
                    Simcard.pageRanges.forEach(function (pageRange) {
                        page = Simcard.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            var columns = result.columns;
                            log.debug('fsd', result.columns);
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_celularsimcard', value: result.getValue(columns[0]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_nocelularsim', value: result.getValue(columns[7]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_ip', value: result.getValue(columns[5]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_apn', value: result.getValue(columns[6]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_operadora', value: result.getValue(columns[4]), ignoreFieldChange: true });
                        });
                    });
                }

                if (quantity != 0 && tipeItmes == 3) {
                    lojack = getInventorynumber(objRecord, i, tipeItmes);
                    lojack.pageRanges.forEach(function (pageRange) {
                        page = lojack.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            var columns = result.columns;
                            log.debug('fsd', result.columns);
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigoactivacion', value: result.getValue(columns[2]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigorespuesta', value: result.getValue(columns[3]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estadolojack', value: result.getValue(columns[4]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivolojack', value: result.getValue(columns[0]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[5]), ignoreFieldChange: true });
                        });
                    });
                }

            }
            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_enlace', value: id, ignoreFieldChange: true });
            let recordId = objRecordCreate.save({ enableSourcing: false, ignoreMandatoryFields: false });
        }
    }


    const getInventorynumber = (objRecord, i, tipeItmes) => {
        let tipoItmesText;
        let customRecord;
        let columns;
        let estadoColumna = 0;
        switch (tipeItmes) {
            case '1':
                tipoItmesText = "custrecord_ht_dd_item";
                customRecord = "customrecord_ht_record_detallechaserdisp";
                columns = [
                    search.createColumn({ name: "internalid", label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_dd_dispositivo", label: "dd_dispositivo" }),
                    search.createColumn({ name: "custrecord_ht_dd_item", label: "dd_item" }),
                    search.createColumn({ name: "custrecord_ht_dd_tipodispositivo", label: "dd_tipodispositivo" }),
                    search.createColumn({ name: "custrecord_ht_dd_modelodispositivo", label: "dd_modelodispositivo" }),
                    search.createColumn({ name: "custrecord_ht_dd_macaddress", label: "dd_macaddress" }),
                    search.createColumn({ name: "custrecord_ht_dd_imei", label: "dd_imei" }),
                    search.createColumn({ name: "custrecord_ht_dd_firmware", label: "dd_firmware" }),
                    search.createColumn({ name: "custrecord_ht_dd_script", label: "dd_script" }),
                    search.createColumn({ name: "custrecord_ht_dd_servidor", label: "dd_servidor" }),
                    search.createColumn({ name: "custrecord_ht_dd_estado", label: "dd_estado" }),
                    search.createColumn({ name: "custrecord_ht_dd_tipodispocha", label: "dd_tipodispocha" }),
                    search.createColumn({ name: "name", label: "name" })
                ];
                break;
            case '2':
                tipoItmesText = "custrecord_ht_ds_serie";
                customRecord = "customrecord_ht_record_detallechasersim";
                columns = [
                    search.createColumn({ name: "internalid", label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_ds_simcard", label: "ds_simcard" }),
                    search.createColumn({ name: "custrecord_ht_ds_serie", label: "ds_serie" }),
                    search.createColumn({ name: "custrecord_ht_ds_tiposimcard", label: "ds_tiposimcard" }),
                    search.createColumn({ name: "custrecord_ht_ds_operadora", label: "ds_operadora" }),
                    search.createColumn({ name: "custrecord_ht_ds_ip", label: "ds_ip" }),
                    search.createColumn({ name: "custrecord_ht_ds_apn", label: "ds_apn" }),
                    search.createColumn({ name: "custrecord_ht_ds_numerocelsim", label: "ds_numerocelsim" }),
                    search.createColumn({ name: "custrecord_ht_ds_estado", label: "ds_estado" })
                ];
                break;
            case '3':
                tipoItmesText = "custrecord_ht_cl_seriebox";
                customRecord = "customrecord_ht_record_detallechaslojack";
                estadoColumna = 4;
                columns = [
                    search.createColumn({ name: "internalid", label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_cl_seriebox", label: "cl_seriebox" }),
                    search.createColumn({ name: "custrecord_ht_cl_activacion", label: "cl_activacion" }),
                    search.createColumn({ name: "custrecord_ht_cl_respuesta", label: "cl_respuesta" }),
                    search.createColumn({ name: "custrecord_ht_cl_estado", label: "cl_estado" }),
                    search.createColumn({ name: "name", label: "name" }),
                ];
                break;
            default:
                break;
        }

        let invDetailRec = objRecord.getSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail', line: i });
        let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });

        for (let j = 0; j < inventoryAssignmentLines; j++) {
            let inventorynumber = invDetailRec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });
            var busqueda = search.create({
                type: customRecord,
                filters:
                    [
                        [tipoItmesText, "anyof", inventorynumber]
                    ],
                columns: columns
            });
            let pageData = busqueda.runPaged({ pageSize: 1000 });
            return pageData;
        }
    }
    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    }
});

