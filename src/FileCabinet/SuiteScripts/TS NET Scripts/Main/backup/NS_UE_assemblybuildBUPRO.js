/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/query',
    '../TS NET Scripts/Main/controller/TS_CM_Controller',
    '../TS NET Scripts/Main/constant/TS_CM_Constant',
    '../TS NET Scripts/Main/error/TS_CM_ErrorMessages'],
    (log, search, record, query, _controller, _constant, _errorMessage) => {
        const beforeLoad = (context) => { }

        const afterSubmit = (context) => {
            let id = context.newRecord.id;
            let objRecord = context.newRecord;
            //log.debug('prueba', id);
            let datosTecnicos = 0;
            let field = 0, box = '', monitoreo = null, lojack = null;
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                let IdOrdenTrabajo = objRecord.getValue({ fieldId: 'custbody_ht_ce_ordentrabajo' });
                if (IdOrdenTrabajo.length > 0) {
                    try {
                        let bienid = search.lookupFields({
                            type: 'customrecord_ht_record_ordentrabajo',
                            id: IdOrdenTrabajo,
                            columns: ['custrecord_ht_ot_vehiculo', 'custrecord_ht_ot_item']
                        });
                        let item = bienid.custrecord_ht_ot_item.length ? bienid.custrecord_ht_ot_item[0].value : "";

                        if (item) {
                            let pro = _controller.getParameter(item, _constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION);
                            let avp = _controller.getParameter(item, _constant.Parameter.AVP_ARTICULO_DE_VENTA_PRODUCCION);
                            log.debug('pro', pro);
                            log.debug('avp', avp);
                            if ((pro == _constant.Valor.SI && avp == _constant.Valor.SI) || (pro == 0 && avp == 0)) {
                                datosTecnicos = crearCargaDispositivoChaser(objRecord, bienid);
                            } else {
                                let datosTecnicosPrevios = objRecord.getValue({ fieldId: 'custbody_ht_as_datos_tecnicos' });
                                if (context.type === context.UserEventType.EDIT && datosTecnicosPrevios.length > 0) {
                                    record.delete({ type: _constant.customRecord.DATOS_TECNICOS, id: datosTecnicosPrevios });
                                    log.debug('EliminarRegistro', 'Se eliminó el registro de datos técnicos anterior: ' + datosTecnicosPrevios);
                                }
                                datosTecnicos = crearCargaDispositivoChaser(objRecord, bienid);
                            }
                        } else {
                            if (objRecord.getValue({ fieldId: 'custbody_ht_as_datos_tecnicos' }).length == 0) {
                                datosTecnicos = crearCargaDispositivoChaser(objRecord, bienid);
                            }
                        }

                        //datosTecnicos = crearCargaDispositivoChaser(objRecord, bienid);
                        field = _controller.getFiledsDatosTecnicos(datosTecnicos);
                        log.debug('ArrayFileds', field);
                        if (field[0]['box']) {
                            lojack = field[0]['serie']
                        } else {
                            monitoreo = field[0]['serie']
                        }

                        if (context.type === context.UserEventType.EDIT) {
                            let previousData = search.create({
                                type: _constant.customRecord.DATOS_TECNICOS,
                                filters: [['custrecord_ht_mc_enlace', 'is', id]],
                                columns: ['internalid']
                            }).run().getRange({ start: 0, end: 1 });
                            if (previousData.length > 0) {
                                record.delete({ type: _constant.customRecord.DATOS_TECNICOS, id: previousData[0].getValue('internalid') });
                            }
                        }

                        let ordenTrabajo = record.submitFields({
                            type: _constant.customRecord.ORDEN_TRABAJO,
                            id: IdOrdenTrabajo,
                            values: {
                                'custrecord_ht_ot_serieproductoasignacion': datosTecnicos,
                                'custrecord_ht_ot_dispositivo': monitoreo == null ? '' : monitoreo,
                                'custrecord_ht_ot_modelo': field[0]['modelo'] == null ? '' : field[0]['modelo'],
                                'custrecord_ht_ot_unidad': field[0]['unidad'] == null ? '' : field[0]['unidad'],
                                'custrecord_ht_ot_firmware': field[0]['fimware'] == null ? '' : field[0]['fimware'],
                                'custrecord_ht_ot_script': field[0]['script'] == null ? '' : field[0]['script'],
                                'custrecord_ht_ot_servidor': field[0]['servidor'] == null ? '' : field[0]['servidor'],
                                'custrecord_ht_ot_simcard': field[0]['simcard'] == null ? '' : field[0]['simcard'],
                                'custrecord_ht_ot_ip': field[0]['ip'] == null ? '' : field[0]['ip'],
                                'custrecord_ht_ot_apn': field[0]['apn'] == null ? '' : field[0]['apn'],
                                'custrecord_ht_ot_imei': field[0]['imei'] == null ? '' : field[0]['imei'],
                                'custrecord_ht_ot_vid': field[0]['vid'] == null ? '' : field[0]['vid'],
                                'custrecord_ht_ot_boxserie': lojack == null ? '' : lojack,
                                'custrecord_ht_ot_codigoactivacion': field[0]['activacion'] == null ? '' : field[0]['activacion'],
                                'custrecord_ht_ot_codigorespuesta': field[0]['respuesta'] == null ? '' : field[0]['respuesta']
                            },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        log.debug('AsignarDatosTec', 'Se asignó el registro de datos técnicos ' + datosTecnicos + ' a la Orden de Trabajo ' + ordenTrabajo);

                    } catch (error) {
                        log.error('ErrorEnsamble', error);
                    }
                }
            }
        }

        const crearCargaDispositivoChaser = (objRecord, bienid) => {
            let object;
            let Simcard;
            let lojack;
            var numLines = objRecord.getLineCount({ sublistId: 'component' });

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
                    object.pageRanges.forEach(pageRange => {
                        page = object.fetch({ index: pageRange.index });
                        page.data.forEach(result => {
                            var columns = result.columns;
                            //log.debug('custrecord_ht_mc_seriedispositivo', result.getValue(columns[1]));
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivo', value: result.getValue(columns[0]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[12]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_modelo', value: result.getValue(columns[4]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_unidad', value: result.getValue(columns[3]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_imei', value: result.getValue(columns[6]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_firmware', value: result.getValue(columns[7]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_script', value: result.getValue(columns[8]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_servidor', value: result.getValue(columns[9]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vid', value: result.getValue(columns[15]), ignoreFieldChange: true });
                            //objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vid', value: bienid.custrecord_ht_ot_vehiculo[0].value, ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estadolodispositivo', value: result.getValue(columns[10]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_tipodispositivo', value: result.getValue(columns[11]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vehiculo', value: bienid.custrecord_ht_ot_vehiculo[0].value, ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_macaddress', value: result.getValue(columns[5]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_sn', value: result.getValue(columns[13]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_numero_camara', value: result.getValue(columns[14]), ignoreFieldChange: true });
                        });
                    });
                }

                if (quantity != 0 && tipeItmes == 2) {
                    Simcard = getInventorynumber(objRecord, i, tipeItmes);
                    Simcard.pageRanges.forEach(function (pageRange) {
                        page = Simcard.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            var columns = result.columns;
                            //log.debug('fsd', result.columns);
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_celularsimcard', value: result.getValue(columns[0]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_nocelularsim', value: result.getValue(columns[7]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_ip', value: result.getValue(columns[5]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_apn', value: result.getValue(columns[6]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_operadora', value: result.getValue(columns[4]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_icc', value: result.getValue(columns[9]), ignoreFieldChange: true })
                        });
                    });
                }

                if (quantity != 0 && tipeItmes == 3) {
                    lojack = getInventorynumber(objRecord, i, tipeItmes);
                    lojack.pageRanges.forEach(function (pageRange) {
                        page = lojack.fetch({ index: pageRange.index });
                        page.data.forEach(function (result) {
                            var columns = result.columns;
                            log.debug('fsd', typeof result.getValue(columns[0]));
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigoactivacion', value: result.getValue(columns[2]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigorespuesta', value: result.getValue(columns[3]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estadolojack', value: result.getValue(columns[4]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivolojack', value: result.getValue(columns[0]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[5]), ignoreFieldChange: true });
                            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vehiculo', value: bienid.custrecord_ht_ot_vehiculo[0].value, ignoreFieldChange: true });
                        });
                    });
                }
            }
            objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_enlace', value: objRecord.id, ignoreFieldChange: true });
            let recordId = objRecordCreate.save({ enableSourcing: false, ignoreMandatoryFields: false });
            return recordId;
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
                        search.createColumn({ name: "name", label: "name" }),
                        search.createColumn({ name: "custrecord_ht_dd_sn", label: "dd_sn" }),
                        search.createColumn({ name: "custrecord_ht_dd_numero_camaras", label: "dd_numerocamaras" }),
                        search.createColumn({ name: "custrecord_ht_dd_vid", label: "dd_numerocamaras" })
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
                        search.createColumn({ name: "custrecord_ht_ds_estado", label: "ds_estado" }),
                        search.createColumn({ name: "custrecord_ht_ds_icc", label: "ds_icc" })
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
            //beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        }
    });