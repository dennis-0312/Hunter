/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/file', 'N/xml', 'N/encode', 'N/render', 'N/query', 'N/record', 'N/search'], (log, file, xml, encode, render, query, record, search) => {
    const URL = 'https://7451241.app.netsuite.com';
    const _get = (requestParams) => {
        try {
            let sql = 'SELECT co.*, dt.custrecord_ht_mc_ubicacion FROM customrecord_ht_co_cobertura co ' +
                'INNER JOIN customrecord_ht_record_mantchaser dt ON co.custrecord_ht_co_numeroserieproducto = dt.id ' +
                'WHERE co.custrecord_ht_co_bien = ? AND co.custrecord_ht_co_familia_prod = ?';
            // sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_nc_servicios_instalados ' +
            //     'WHERE custrecord_ns_orden_servicio_si = ? AND custrecord_ns_orden_trabajo = ?';
            // sql = 'SELECT foreigntotal, custbody_ht_af_ejecucion_relacionada FROM transaction WHERE id = ?';
            // sql = 'SELECT * FROM CUSTOMRECORD_NCFAR_ASSETTYPE WHERE id = ?'
            // sql = 'SELECT it.assetaccount as inventoryaccount, af.custrecord_assettypeassetacc as fixedassetaccount FROM item it ' +
            //     'INNER JOIN customrecord_ncfar_assettype af ON it.custitem_ht_ar_tipoactivo = af.id ' +
            //     'WHERE it.id = ?';
            // sql = 'SELECT * FROM transaction WHERE id = ?';
            // sql = 'SELECT it.displayname FROM customrecord_ht_record_mantchaser dt ' +
            //     'INNER JOIN customrecord_ht_record_detallechaserdisp di ON dt.custrecord_ht_mc_seriedispositivo = di.id ' +
            //     'INNER JOIN item it ON di.custrecord_ht_dd_dispositivo = it.id ' +
            //     'WHERE dt.id = ?';
            // sql = 'SELECT it.displayname FROM customrecord_ht_record_mantchaser dt ' +
            //     'INNER JOIN customrecord_ht_record_detallechaslojack di ON dt.custrecord_ht_mc_seriedispositivolojack = di.id ' +
            //     'INNER JOIN item it ON di.custrecord_ht_cl_lojack = it.id ' +
            //     'WHERE dt.id = ?';
            // sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_record_detallechaslojack WHERE name = ?';
            // sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_record_detallechaserdisp WHERE name = ?';
            // sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_record_detallechasersim WHERE name = ?';
            // sql = 'SELECT id FROM transaction WHERE custbody_ht_ir_no_recepcionado = 1 AND custbody_ht_ir_recepcionado = 0 ORDER BY id ASC FETCH FIRST 1 ROWS ONLY';
            // sql = 'SELECT * FROM transaction WHERE custbody_ht_ce_ordentrabajo = ?';
            // sql = 'SELECT * FROM customrecord_ht_record_historialsegui WHERE custrecord_ht_hs_estado = 1 AND custrecord_ht_af_enlace = ?';
            // sql = 'SELECT firstname, lastname FROM employee WHERE custentity_ec_numero_registro = ?'
            // sql = 'SELECT custrecord_ht_email_email as mail FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?'
            // sql = 'SELECT custrecord_ht_email_email as ami FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 2 AND custrecord_ht_ce_enlace = ?'
            // sql = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            // sql = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            // sql = 'SELECT isperson, id, entityid, custentity_ht_cl_primernombre, custentity_ht_cl_segundonombre, custentity_ht_cl_apellidopaterno, custentity_ht_cl_apellidomaterno, ' +
            //     'custentity_ht_customer_id_telematic, custentityts_ec_cod_tipo_doc_identidad, companyname FROM customer WHERE id = ?'
            // sql = 'SELECT * FROM customer WHERE id = ?';
            sql = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?';
            sql = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?';
            // sql = 'SELECT custrecord_ht_cuenta_activo_fijo_transit FROM subsidiary WHERE id = ?';
            //sql = 'SELECT memo, itemtype, createdpo FROM TransactionLine WHERE transaction = ?';
            //sql = 'SELECT * FROM TransactionLine WHERE transaction = ?'
            //sql = 'SELECT assemblycomponent, item, itemtype, memo FROM TransactionLine WHERE transaction = ?';

            // sql = 'SELECT dat.id as chaser, dat.name as serie, mod.custrecord_ht_dd_modelodispositivo_descr as modelo, uni.custrecord_ht_dd_tipodispositivo_descrip as unidad, ' +
            //     'fim.custrecord_ht_mc_firmware_descrip as fimware, scr.custrecord_ht_mc_script_descrip as script, srv.custrecord_ht_mc_servidor_descrip as servidor, ' +
            //     'sim.name as simcard, dat.custrecord_ht_mc_ip as ip, dat.custrecord_ht_mc_apn as apn, dis.custrecord_ht_dd_imei as imei, dat.custrecord_ht_mc_vid as vid, ' +
            //     // '(SELECT loj.name FROM customrecord_ht_record_mantchaser chs INNER JOIN customrecord_ht_record_detallechaslojack loj ON chs.custrecord_ht_mc_seriedispositivolojack = loj.id '+
            //     // 'WHERE chs.custrecord_ht_mc_seriedispositivolojack IS NOT NULL AND chs.id = ?) as box, ' +
            //     'dat.custrecord_ht_mc_seriedispositivolojack as box, dat.custrecord_ht_mc_codigoactivacion as activacion, dat.custrecord_ht_mc_codigorespuesta as respuesta ' +
            //     'FROM customrecord_ht_record_mantchaser dat ' +
            //     'INNER JOIN customrecord_ht_dd_modelodispositivo mod ON dat.custrecord_ht_mc_modelo = mod.id ' +
            //     'INNER JOIN customrecord_ht_dd_tipodispositivo uni ON dat.custrecord_ht_mc_unidad = uni.id ' +
            //     'INNER JOIN customrecord_ht_mc_firmware fim ON dat.custrecord_ht_mc_firmware = fim.id ' +
            //     'INNER JOIN customrecord_ht_mc_script scr ON dat.custrecord_ht_mc_script = scr.id ' +
            //     'INNER JOIN customrecord_ht_mc_servidor srv ON dat.custrecord_ht_mc_servidor = srv.id ' +
            //     'INNER JOIN customrecord_ht_record_detallechasersim sim ON dat.custrecord_ht_mc_celularsimcard = sim.id ' +
            //     'INNER JOIN customrecord_ht_record_detallechaserdisp dis ON dat.custrecord_ht_mc_seriedispositivo = dis.id ' +
            //     'WHERE dat.id = ?';
            // sql = 'SELECT custitem_ht_it_servicios as servicios FROM item WHERE id = ?'
            // sql = 'SELECT id FROM customrecord_ht_nc_servicios_instalados ' +
            //     'WHERE custrecord_ns_bien_si = ? AND custrecord_ns_orden_servicio_si = ? AND custrecord_ns_orden_trabajo = ?'
            // sql = 'SELECT dat.id as chaser, dat.name as serie, mod.custrecord_ht_dd_modelodispositivo_descr as modelo, uni.custrecord_ht_dd_tipodispositivo_descrip as unidad, ' +
            //     'fim.custrecord_ht_mc_firmware_descrip as fimware, scr.custrecord_ht_mc_script_descrip as script, srv.custrecord_ht_mc_servidor_descrip as servidor, ' +
            //     'sim.name as simcard, dat.custrecord_ht_mc_ip as ip, dat.custrecord_ht_mc_apn as apn, dis.custrecord_ht_dd_imei as imei, dis.custrecord_ht_dd_vid as vid, ' +
            //     'dat.custrecord_ht_mc_seriedispositivolojack as box, dat.custrecord_ht_mc_codigoactivacion as activacion, dat.custrecord_ht_mc_codigorespuesta as respuesta ' +
            //     'FROM customrecord_ht_record_mantchaser dat ' +
            //     'INNER JOIN customrecord_ht_dd_modelodispositivo mod ON dat.custrecord_ht_mc_modelo = mod.id ' +
            //     'INNER JOIN customrecord_ht_dd_tipodispositivo uni ON dat.custrecord_ht_mc_unidad = uni.id ' +
            //     'INNER JOIN customrecord_ht_mc_firmware fim ON dat.custrecord_ht_mc_firmware = fim.id ' +
            //     'INNER JOIN customrecord_ht_mc_script scr ON dat.custrecord_ht_mc_script = scr.id ' +
            //     'INNER JOIN customrecord_ht_mc_servidor srv ON dat.custrecord_ht_mc_servidor = srv.id ' +
            //     'INNER JOIN customrecord_ht_record_detallechasersim sim ON dat.custrecord_ht_mc_celularsimcard = sim.id ' +
            //     'INNER JOIN customrecord_ht_record_detallechaserdisp dis ON dat.custrecord_ht_mc_seriedispositivo = dis.id ' +
            //     'WHERE dat.id = ?';
            //sql = 'SELECT * FROM customrecord_ht_record_mantchaser WHERE id = ?';
            //sql = "SELECT id,recordtype FROM transaction WHERE custbody_ht_ce_ordentrabajo = ? AND recordtype = 'assemblybuild'";
            //sql = "SELECT inn.*, inb.* FROM inventorynumber inn INNER JOIN InventoryNumberInventoryBalance inb ON inn.id = inb.inventorynumber WHERE inn.item = ? AND inn.inventorynumber = ?";
            //sql = "SELECT * FROM InventoryNumberInventoryBalance WHERE item = ?";
            //sql = "SELECT * FROM InventoryNumberInventoryBalance WHERE inventoryNumber = ?";
            //sql = "SELECT * FROM inventorynumber WHERE item = ? AND inventorynumber = ?"
            let condition = [];
            if (requestParams.query == 1) {
                // //& sentencia
                // let myInventoryNumberQuery = query.create({ type: query.Type.INVENTORY_NUMBER });
                // //& join
                // let inventoryNumberBalanceJoin = myInventoryNumberQuery.autoJoin({ fieldId: 'inventoryBalance' });
                // //& where
                // let firstCondition = myInventoryNumberQuery.createCondition({ fieldId: 'item', operator: query.Operator.EQUAL, values: requestParams.id });
                // let thirdCondition = myInventoryNumberQuery.createCondition({ fieldId: 'inventorynumber', operator: query.Operator.START_WITH, values: requestParams.id2 });
                // //& and
                // //condition.push(firstCondition)
                // condition.push(thirdCondition)
                // //& apply where
                // myInventoryNumberQuery.condition = myInventoryNumberQuery.and(condition);
                // //& fields
                // myInventoryNumberQuery.columns = [
                //     myInventoryNumberQuery.createColumn({ fieldId: 'item' }),
                //     inventoryNumberBalanceJoin.createColumn({ fieldId: 'inventorynumber' })
                // ];
                // //& results
                // let resultSet = myInventoryNumberQuery.run();
                // let results = resultSet.asMappedResults();
                // if (results.length > 0) {
                //     return results[1].item;
                // } else {
                //     return 0;
                // }

                let myInventoryNumberQuery = query.create({ type: query.Type.CUSTOMER });
                let firstCondition = myInventoryNumberQuery.createCondition({ fieldId: 'entityid', operator: query.Operator.CONTAIN, values: requestParams.id2 });
                condition.push(firstCondition);
                myInventoryNumberQuery.condition = myInventoryNumberQuery.and(condition);
                myInventoryNumberQuery.columns = [
                    myInventoryNumberQuery.createColumn({ fieldId: 'id' }),
                    myInventoryNumberQuery.createColumn({ fieldId: 'altname' }),
                    myInventoryNumberQuery.createColumn({ fieldId: 'entitytitle' }),
                    myInventoryNumberQuery.createColumn({ fieldId: 'entityid' }),
                ];
                let resultSet = myInventoryNumberQuery.run();
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    return results;
                } else {
                    return 0;
                }
            } else if (requestParams.query == 2) {
                let sql = "SELECT val.custrecord_ht_pp_descripcion as producto FROM customrecord_ht_record_ordentrabajo tra " +
                    "INNER JOIN customrecord_ht_cr_pp_valores val ON tra.custrecordht_ot_tipo_agrupacion = val.id " +
                    "WHERE tra.custrecord_ht_ot_orden_servicio = ?"
                sql = "SELECT item, location, averagecostmli FROM aggregateItemLocation WHERE item = ? AND location = ?"
                //let params = [requestParams.id, requestParams.id2]
                sql = "SELECT * FROM transaction WHERE recordtype = 'assemblybuild' AND id = ?";
                let params = [/*requestParams.id1,*/ requestParams.id2]
                let resultSet = query.runSuiteQL({ query: sql, params: params });
                let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                //log.debug('Response', results);
                let res = '';
                if (results.length > 0) {
                    // for (let j in results) {
                    //     res =
                    //     res + results[j].producto + ';'
                    // }
                    return results;
                } else {
                    return 0;
                }

            } else if (requestParams.query == 3) {
                //log.debug('Entré', 'GET: ' + requestParams.query)
                let retorno = verifyExistInvoice();
                return retorno;
            } else if (requestParams.query == 4) {
                let jsonComand = new Array();
                var mySearch = search.create({
                    type: "customrecord_ht_servicios",
                    filters:
                        [
                            ["internalid", "anyof", ["3", "4", "9", "8"]]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_sv_command", label: "Comando" })
                        ]
                });
                var searchResultCount = mySearch.runPaged().count;
                log.debug("customrecord_ht_serviciosSearchObj result count", searchResultCount);
                mySearch.run().each(result => {
                    if (result.getValue('custrecord_ht_sv_command')) {
                        let comando = result.getText('custrecord_ht_sv_command').split(',');
                        jsonComand = jsonComand.concat(comando);
                    }
                    return true;
                });
                return jsonComand;




            } else if (requestParams.query == 5) {
                try {
                    // let newAdjust = record.create({ type: 'itemfulfillment', isDynamic: true });

                    // newAdjust.setValue({ fieldId: 'customform', value: 122 });
                    // newAdjust.setValue({ fieldId: 'subsidiary', value: 2 });
                    // newAdjust.setValue({ fieldId: 'entity', value: 523 });
                    // newAdjust.setValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal', value: 16 });
                    // newAdjust.setValue({ fieldId: 'trandate', value: new Date() });

                    // newAdjust.selectNewLine({ sublistId: 'item' });
                    // newAdjust.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                    // newAdjust.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 26 });
                    // newAdjust.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                    // newAdjust.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: 8 });

                    // let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail', line: 0 });
                    // newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                    // newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: 14004, line: 0 });
                    // newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: 229, line: 0 });
                    // newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1, line: 0 });
                    // newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1, line: 0 });
                    // newDetail.commitLine({ sublistId: 'inventoryassignment' });
                    // newAdjust.commitLine({ sublistId: 'item' });
                    // let newRecord = newAdjust.save();
                    // return newRecord;





































                    let fooRecord = record.load({ type: record.Type.SALES_ORDER, id: 44903 });
                    let itemFulfillment = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: 44903,
                        toType: record.Type.ITEM_FULFILLMENT,
                        isDynamic: true
                    });
                    log.debug('fulfillment', 'fulfillment');
                    // let numLines = newFulfill.getLineCount({ sublistId: 'item' });
                    // for (let i = 0; i < numLines; i++) {
                    itemFulfillment.selectLine({ sublistId: 'item', line: 0 })
                    itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                    itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: 8 });
                    itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: 26 });
                    itemFulfillment.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                    
                    let objSubRecord = itemFulfillment.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                    objSubRecord.selectLine({ sublistId: 'inventoryassignment', line: 0 })
                    objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: 14004 });
                    objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: 229 });
                    objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                    objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                    objSubRecord.commitLine({ sublistId: 'inventoryassignment' });
                    itemFulfillment.commitLine({ sublistId: 'item' });

                    // }


                    let fulfillment = itemFulfillment.save();
                    log.debug('fulfillment', 'fulfillment');
                    return fulfillment;






























                    















































                    //log.debug({ title: 'Record saved', details: 'Id of new record: ' + fulfillment });
                    // transformRecordPromise .then(function (recordObject) {
                    //     log.debug('Entry', 'Entry2')
                    //     fulfillment = recordObject.save(/*{ enableSourcing: false, ignoreMandatoryFields: true }*/);
                    //     log.debug({ title: 'Record saved', details: 'Id of new record: ' + fulfillment });
                    // }, function (e) {
                    //     log.error({ title: e.name, details: e.message });
                    //     return e;
                    // });






                    // // set the Internal id to a specific sales order for testing purposes
                    // var recID = '<Internal ID Sales Order>';
                    // var fooRecord = record.load({type: record.Type.SALES_ORDER, id: recID });
                    // var itemFulfillment = record.transform({fromType: record.Type.SALES_ORDER, fromId: recID, toType: record.Type.ITEM_FULFILLMENT, isDynamic: true });
                    // // This is an example of a field above, when we change the status from Picked to Packed or Shipped it will trigger that this item is for shipping.
                    // itemFulfillment.setValue({fieldId: 'shipstatus', value: '<Internal ID for Picked Status>' });

                    // // for testing purposes, The line item is hard-coded to 1
                    // //itemFulfillment.selectLineItem('item', 1);
                    // itemFulfillment.selectLine({sublistId: 'item', line: 1 });
                    // // On the item fulfillment record, we have to check the fulfill checkbox
                    // itemFulfillment.setCurrentSublistValue({sublistId: 'item', fieldId: 'itemreceive', value: true });
                    // // Location is a required field in my test account
                    // itemFulfillment.setCurrentSublistValue({sublistId: 'item', fieldId: 'location', value: 1 });
                    // itemFulfillment.commitLine({sublistId: 'item' });

                    // // this is the block of code that updates the package subtab
                    // itemFulfillment.selectLine({sublistId: 'packageusps', line: 1 });
                    // // Changing the Item Weight to 19, it was supposed to be 1.92 for my item
                    // itemFulfillment.setCurrentSublistValue({sublistId: 'packageusps', fieldId: 'packageweightusps', value: '19' });
                    // var lineweight = itemFulfillment.getCurrentSublistValue({sublistId: 'packageusps', fieldId: 'packageweightusps' })
                    // itemFulfillment.commitLine({sublistId: 'packageusps' });

                    // var fulfillmentId = itemFulfillment.save();
                    // // this will redirect us to the page of the newly created item fuilfillment record
                    // redirect.toRecord({
                    //     type: record.Type.ITEM_FULFILLMENT,
                    //     id: fulfillmentId
                    // });
                } catch (error) {
                    return error
                }





                // let newFulfill2 = newFulfill.selectNewLine({ sublistId: 'item' });
                // newFulfill2.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                // newFulfill2.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: idItemRelacionadoOT });
                // newFulfill2.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                // newFulfill2.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: ubicacion });
                // // if (ubicacion != 0) {

                // // }
                // let objSubRecord = newFulfill2.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: 0 });
                // objSubRecord.selectNewLine({ sublistId: 'inventoryassignment' });
                // objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: idDispositivo, line: 0 });
                // objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: 229, line: 0 });
                // objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1, line: 0 });
                // objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1, line: 0 });
                // objSubRecord.commitLine({ sublistId: 'inventoryassignment' });
                // newFulfill2.commitLine({ sublistId: 'item' });
            }

            // let results = resultSet.results;
            // for (let i = results.length - 1; i >= 0; i--)
            //     log.debug('Resut', results[i].values);
            //TODO:CONSULTA PARA MEJORA DE PARAMETRIZACIÓN, CAMBIO DE CAMPOS MULTISELECT A SELECT. dis.custrecord_ht_dd_imei,
            // sql = 'SELECT va.custrecord_ht_pp_codigo as parametro, pr.custrecord_ht_pp_parametrizacion_valor as valor ' +
            //     'FROM customrecord_ht_pp_main_param_prod pr ' +
            //     //'INNER JOIN customrecord_ht_cr_parametrizacion_produ pa ON pr.custrecord_ht_pp_parametrizacion_rela = pa.id ' +
            //     'INNER JOIN customrecord_ht_cr_pp_valores va ON pr.custrecord_ht_pp_parametrizacion_valor = va.id ' +
            //     'WHERE pr.custrecord_ht_pp_parametrizacionid = ? AND pr.custrecord_ht_pp_parametrizacion_rela = ?';
            // custrecord_ht_mc_unidad, custrecord_ht_mc_firmware, custrecord_ht_mc_script, ' +
            //'custrecord_ht_mc_servidor, custrecord_ht_mc_ip, custrecord_ht_mc_apn, custrecord_ht_mc_vid
            //!===================================================================================================================================
            // sql = 'SELECT so.status FROM customrecord_ht_record_ordentrabajo ot ' + 
            // 'INNER JOIN transaction so ON ot.custrecord_ht_ot_orden_servicio = so.id ' + 
            // 'WHERE ot.custrecord_ht_ot_orden_servicio = ? FETCH FIRST 1 ROWS ONLY';
            //let params = [requestParams.adjustid]
            //let params = [requestParams.bien, requestParams.familia]
            //let params = [requestParams.service, requestParams.work] ORDER BY id DESC FETCH FIRST 1 ROWS ONLY
            //let params = [requestParams.adjustid]
            //let params = [requestParams.item]
            //let params = [requestParams.chaser]
            //let params = [requestParams.ordenTrabajoid]
            //let params = [requestParams.serie].
            // let array = new Array();



            // let params = [requestParams.id, requestParams.id2]
            // //let params = [requestParams.id2]
            // let resultSet = query.runSuiteQL({ query: sql, params: params });
            // let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
            // log.debug('Response', results);
            // if (results.length > 0) {
            //     return results;
            //     // for (let i = 1; i < results.length; i++) { //
            //     //     if (results[i]['assemblycomponent'] == 'F' && results[i]['itemtype'] != 'TaxItem') {
            //     //         array.push([results[i]['item'], results[i]['itemtype']]);
            //     //     }
            //     // }
            //     // return array;
            //     // let texto = '';
            //     // for (let j in array) {
            //     //     texto =
            //     //     texto + array[j] + ';'
            //     // }
            //     // results = resultSet.asMappedResults()[0]['firstname'] + ' ' + resultSet.asMappedResults()[0]['lastname']
            //     //return results//[0]['isperson'] == 'F' ? 0 : results[0]['custentity_ht_cl_primernombre']
            //     //return results//[0]['custentity_ht_cl_primernombre'] == null ? '' : results[0]['custentity_ht_cl_primernombre'] //[0]['displayname']/*[0]['custrecord_ht_co_producto'] == null ? 0 : 1*/
            //     //return texto;
            // } else {
            //     return 0;
            // }


            // let sql = 'SELECT name FROM customrecord_ht_record_detallechaslojack WHERE id = ?'
            // let resultSet = query.runSuiteQL({ query: sql, params: [field[0]['box']] });
            // let results = resultSet.asMappedResults();
            // if (results.length > 0) {
            //     box = results[0]['name']
            // }

            // let response = createJournalEntrySalidaConAlquiler(requestParams.item, requestParams.adjustid, requestParams.location);
            // return response;
        } catch (error) {
            return error;
        }
    }

    const _post = (requestParams) => {
        let img = postImage(requestParams);
        return img;
    }

    const postImage = (params) => {
        let body = params.foto;
        let nombre = params.nombre;
        log.debug("Request", body);
        // let encoded = encode.convert({
        //     string: body,
        //     inputEncoding: encode.Encoding.BASE_64,
        //     outputEncoding: encode.Encoding.UTF_8
        // });

        let fileObj = file.create({
            name: nombre + '.jpg',
            fileType: file.Type.PJPGIMAGE,
            encoding: file.Encoding.UTF_8,
            folder: 2851,
            isOnline: true,
            contents: body
        });
        let fileId = fileObj.save();
        log.debug('fileId-Saved', fileId);

        let fileObjURL = file.load({
            // id: 'Images/myImageFile.jpg'
            id: fileId
        });
        log.debug({
            details: "File URL: " + fileObjURL.url
        });

        return { response: URL + fileObjURL.url };
    }

    const getImage = (context) => {
        let img = context.paramimg;
        log.debug('GETIMG', img)
        let fileObjURL = file.load({
            // id: 'Images/myImageFile.jpg'
            id: img
        });
        return { response: URL + fileObjURL.url };
    }

    const verifyExistInvoice = () => {
        try {
            let json = new Array();
            const invoiceSearchFilters = SavedSearchFilters = [
                ['type', 'anyof', 'CustInvc'],
                'AND',
                ['createdfrom', 'anyof', '23056'],
                'AND',
                ['item', 'anyof', '32'],
            ];

            const invoiceSearchColTranId = search.createColumn({ name: 'tranid' });
            const invoiceSearchColTranDate = search.createColumn({ name: 'trandate' });
            const invoiceSearchColItem = search.createColumn({ name: 'item' });

            const invoiceSearch = search.create({
                type: 'invoice',
                filters: invoiceSearchFilters,
                columns: [
                    invoiceSearchColTranId,
                    invoiceSearchColTranDate,
                    invoiceSearchColItem,
                ],
            });
            let searchResultCount = invoiceSearch.runPaged().count;
            log.debug('Count', searchResultCount);
            const invoiceSearchPagedData = invoiceSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
                const invoiceSearchPage = invoiceSearchPagedData.fetch({ index: i });
                invoiceSearchPage.data.forEach((result = search.Result) => {
                    const tranId = result.getValue(invoiceSearchColTranId);
                    const tranDate = result.getValue(invoiceSearchColTranDate);
                    const item = result.getValue(invoiceSearchColItem);
                    json.push({
                        tranId: tranId,
                        tranDate: tranDate,
                        item: item
                    });
                });
            }
            return json
        } catch (error) {
            return error;
        }
    }

    const getLastDate = () => {
        let date = new Date();
        let primerDia = new Date(date.getFullYear(), date.getMonth(), 1);
        let ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // console.log("El primer día es: " + primerDia.getDate())
        // console.log("El ultimo día es: " + ultimoDia.getDate())
    }

    return {
        get: _get,
        post: _post
    }

});


