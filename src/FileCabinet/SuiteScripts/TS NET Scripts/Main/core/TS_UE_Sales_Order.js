/**
*@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define([
    'N/log',
    'N/record',
    'N/search',
    'N/ui/serverWidget',
    'N/plugin',
    'N/transaction',
    'N/https',
    'N/runtime',
    'N/email',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
    '../routes/TS_ROUTER_Sales_Order'
], (log, record, search, serverWidget, plugin, transaction, https, runtime, email, _controller, _constant, _errorMessage, _router) => {
    const HT_DETALLE_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_detalle_orden_servicio_2'; //HT Detalle Orden de Servicio - PRODUCCION
    const beforeLoad = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            const form = scriptContext.form;
            const objRecord = scriptContext.newRecord;
            let editServiceOrder = form.getButton('edit');
            if (objRecord.getValue('custbodycustbody_ht_os_created_from_sa') == true) editServiceOrder.isDisabled = true;
            _router.getSchedule(scriptContext);
        }

        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            var currentRecord = scriptContext.newRecord;
            const idRecord = currentRecord.id;
            const form = scriptContext.form;
            let objRecord = /* record.load({ type: 'salesorder', id: idRecord, isDynamic: true }); */ currentRecord;
            let aprobacion_venta = objRecord.getValue('custbody_ht_os_aprobacionventa');
            let numLines = objRecord.getLineCount({ sublistId: 'item' });
            var htClient = '';
            var bien = '';
            var fechaInicial = '';
            var fechaFinal = '';
            let parametro = 0;
            let parametro_aprob = 0;
            for (let i = 0; i < numLines; i++) {
                let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                //log.debug('items', items);
                let parametrosRespo = _controller.parametrizacion(items);
                for (let j = 0; j < parametrosRespo.length; j++) {
                    if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                        parametro = parametrosRespo[j][1];
                    }
                    if (parametrosRespo[j][0] == _constant.Parameter.APR_SOLICITA_APROBACIÓN) {
                        parametro_aprob = parametrosRespo[j][1];
                    }
                }
                if (parametro_aprob == _constant.Valor.SI) {
                    var htClient = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: i });
                    //log.debug('htClient', htClient);
                    var monitoreo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i });
                    //log.debug('monitoreo', monitoreo);
                    bien = objRecord.getValue('custbody_ht_so_bien');
                    var fechaInicialItem = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cambio_fecha', line: i });
                    fechaInicial = new Date(fechaInicialItem);
                }
            }

            // log.debug('parametro_aprob', parametro_aprob);
            // log.debug('aprobacion_venta', aprobacion_venta);
            // if (parametro_aprob == SI && aprobacion_venta == 2) {
            //     form.addButton({
            //         id: 'custpage_ts_aprobar_venta',
            //         label: 'Aprobar Venta',
            //         functionName: 'aprobarVenta(' + idRecord + ',"' + htClient + '","' + bien + '","' + fechaInicial + '","' + monitoreo + '")'
            //     });
            //     form.clientScriptModulePath = './TS_CS_Aprobar_Venta.js';
            // }
        }
    }


    const afterSubmit = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            try {
                const currentRecord = scriptContext.newRecord;
                let idRecord = currentRecord.id;
                let senderId = runtime.getCurrentUser();
                senderId = senderId.id;
                let objRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
                let customer = objRecord.getValue('entity');
                let vehiculo = objRecord.getValue('custbody_ht_so_bien');
                let ordenServicio = objRecord.getValue('tranid');
                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                let aprobacionventa = objRecord.getValue('custbody_ht_os_aprobacionventa');
                let aprobacioncartera = objRecord.getValue('custbody_ht_os_aprobacioncartera');
                let parametro = 0, parametro_aprob = 0, parametro_fact = 0, workOrder = 0, adp = 0, plazo = 0, valor_tipo_agrupacion = 0, paramChequeo = 0, coberturaRecord = 0,
                    generaOrdenTrabajo = 0, esGarantia = 0, esUpgrade = _constant.Valor.NO, ccd = 0, dispositivoEnCustodia = "", itemCustodia = {}, ttr = 0, renovamos = false,
                    plataformas = false, arrayRecipientsOriginal = new Array(), arrayRecipients = new Array(), esAlquiler = 0, definicionServicios = false, paralizador = false,
                    botonPanico = false;

                for (let i = 0; i < numLines; i++) {
                    objRecord.selectLine({ sublistId: 'item', line: i });
                    let cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });
                    let inventoryNumber = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia' });
                    let items = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                    if (!paralizador)
                        paralizador = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_paralizador' });

                    if (!botonPanico)
                        botonPanico = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_boton_panico' });
                    //log.debug('Servicios!!!!!!!!!!!!!!', paralizador + ' - ' + botonPanico);

                    let parametrosRespo = _controller.parametrizacion(items);
                    //log.debug('parametrosRespo', parametrosRespo);
                    var descriptionItem = getDescription(customer, items);
                    if (descriptionItem) {
                        objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: descriptionItem });
                    }
                    objRecord.commitLine({ sublistId: 'item' });

                    json = {
                        serviceOrder: idRecord.toString(),
                        customer: customer.toString(),
                        vehiculo: vehiculo,
                        item: parseInt(items),
                        ordenServicio: ordenServicio,
                        tipoProd: 0,
                        tipoTrab: 0
                    }

                    for (let j = 0; j < parametrosRespo.length; j++) {
                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                            parametro = parametrosRespo[j][1];

                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO)
                            valor_tipo_agrupacion = parametrosRespo[j][1];

                        if (parametrosRespo[j][0] == _constant.Parameter.APR_SOLICITA_APROBACIÓN)
                            parametro_aprob = parametrosRespo[j][1];

                        if (parametrosRespo[j][0] == _constant.Parameter.GOF_GENERA_SOLICITUD_DE_FACTURACION)
                            parametro_fact = parametrosRespo[j][1];

                        if (parametrosRespo[j][1] == _constant.Valor.VALOR_004_RENOVACION_DE_DISP) {
                            renovamos = true;
                            plazo += cantidad;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                            adp = parametrosRespo[j][1]

                        if (parametrosRespo[j][0] == _constant.Parameter.CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametrosRespo[j][1] == _constant.Valor.SI)
                            plataformas = true;

                        if (parametrosRespo[j][0] == _constant.Parameter.TTR_TIPO_TRANSACCION)
                            ttr = parametrosRespo[j][1]

                        if (parametrosRespo[j][0] == _constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO && parametrosRespo[j][1] == _constant.Valor.SI) {
                            workOrder = _controller.parametros(_constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO, json);
                            //generaOrdenTrabajo = 1;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.VOT_VARIAS_ORDENES_DE_TRABAJO && parametrosRespo[j][1] == _constant.Valor.SI) {
                            workOrder = _controller.parametros(_constant.Parameter.VOT_VARIAS_ORDENES_DE_TRABAJO, json);
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.TCH_TIPO_CHEQUEO_OT)
                            paramChequeo = parametrosRespo[j][1];

                        if (parametrosRespo[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS) {
                            ccd = parametrosRespo[j][1];
                            itemCustodia.inventoryNumber = inventoryNumber;
                            itemCustodia.item = items;
                            //log.error("itemCustodia ccd", itemCustodia);
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA && parametrosRespo[j][1] == _constant.Valor.SI)
                            esGarantia = 1;

                        if (parametrosRespo[j][0] == _constant.Parameter.CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][1] == _constant.Valor.SI)
                            esUpgrade = _constant.Valor.SI;

                        if (parametrosRespo[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER && parametrosRespo[j][1] == _constant.Valor.SI)
                            esAlquiler = _constant.Valor.SI;

                        if (parametrosRespo[j][0] == _constant.Parameter.DSR_DEFINICION_DE_SERVICIOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                            //log.debug('Servicios11111111111111!!!!!!!!!!!!!!', paralizador + ' - ' + botonPanico);
                            definicionServicios = true;
                        }
                    }

                    try {
                        record.submitFields({
                            type: _constant.customRecord.ORDEN_TRABAJO,
                            id: workOrder,
                            values: {
                                custrecord_ht_ot_producto: valor_tipo_agrupacion,
                                custrecord_ht_ot_tipo_trabajo: ttr
                            },
                            options: { enablesourcing: true }
                        });
                    } catch (error) {
                        log.error('Error-SubmitFields', 'No tiene el parámetro TAG o TTR configurado');
                    }

                }

                log.error("itemCustodia", itemCustodia);
                log.error('EsAlquiler', esAlquiler)
                // log.debug('parametro_aprob', parametro_aprob);
                // log.debug('parametro_fact', parametro_fact);
                if (parametro_aprob != _constant.Valor.SI && parametro_fact == _constant.Valor.NO) {
                    //log.debug('cierra', idRecord);
                    //transaction.void({ type: 'salesorder', id: idRecord });
                } else {
                    if (parametro_aprob == _constant.Valor.SI) {
                        //log.debug('parametro_aprob', parametro_aprob);
                        objRecord.setValue('orderstatus', 'A');
                        objRecord.setValue('custbody_ht_os_aprobacionventa', 2);
                    }

                    if (renovamos == true) {
                        var bien = objRecord.getValue('custbody_ht_so_bien');
                        var idCoberturaItem;
                        let busqueda_cobertura = getCoberturaItem(bien);
                        //log.debug('busqueda_cobertura', busqueda_cobertura);
                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {
                                let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                if (parametrosRespo != 0) {
                                    let accion_producto_2 = 0;
                                    let valor_tipo_agrupacion_2 = 0;
                                    for (let j = 0; j < parametrosRespo.length; j++) {
                                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO)
                                            valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                        if (valor_tipo_agrupacion == valor_tipo_agrupacion_2)
                                            idCoberturaItem = busqueda_cobertura[i][1];
                                    }
                                }
                            }
                        }
                        let vehiculo = search.lookupFields({ type: 'customrecord_ht_record_bienes', id: bien, columns: ['custrecord_ht_bien_id_telematic'] });
                        var cobertura = search.lookupFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: idCoberturaItem,
                            columns: ['custrecord_ht_co_coberturainicial', 'custrecord_ht_co_coberturafinal', 'custrecord_ht_co_numeroserieproducto', 'custrecord_ht_co_plazo']
                        });
                        var idDispositivo = cobertura.custrecord_ht_co_numeroserieproducto[0].value;
                        var coberturaplazo = cobertura.custrecord_ht_co_plazo;
                        //log.debug('idDispositivo', idDispositivo);
                        var coberturaAntigua = cobertura.custrecord_ht_co_coberturafinal;
                        var cobertura_inicial = cobertura.custrecord_ht_co_coberturainicial;
                        cobertura_inicial = cobertura_inicial.split('/');
                        var nuevaCoberturaInicial = cobertura_inicial[1] + '/' + cobertura_inicial[0] + '/' + cobertura_inicial[2];
                        var fechaInicial = Date.parse(nuevaCoberturaInicial);
                        var newDateInicial = new Date(fechaInicial);

                        let producto = search.lookupFields({
                            type: 'customrecord_ht_record_mantchaser',
                            id: idDispositivo,
                            columns: ['custrecord_ht_mc_id_telematic']
                        });
                        var idTelematic = producto.custrecord_ht_mc_id_telematic;
                        //log.debug('idTelematic', idTelematic);
                        coberturaAntigua = coberturaAntigua.split('/');
                        var nuevaCoberturaAntigua = coberturaAntigua[1] + '/' + coberturaAntigua[0] + '/' + coberturaAntigua[2];
                        var fechaAntigua = Date.parse(nuevaCoberturaAntigua);
                        var newDateAntigua = new Date(fechaAntigua);
                        var fechaNuevaDia = newDateAntigua.setDate(newDateAntigua.getDate());
                        fechaNuevaDia = new Date(fechaNuevaDia);
                        var fechaNuevaCompletaAntigua = new Date(fechaAntigua);
                        var fechaNuevaCompleta = fechaNuevaCompletaAntigua.setDate(fechaNuevaCompletaAntigua.getDate());
                        fechaNuevaCompleta = new Date(fechaNuevaCompleta);
                        fechaNuevaCompleta.setMonth(fechaNuevaCompleta.getMonth() + plazo);
                        fechaNuevaCompleta = new Date(fechaNuevaCompleta);
                        plazo = Number(plazo);
                        coberturaplazo = Number(coberturaplazo);
                        var plazoTotal = parseFloat(plazo) + parseFloat(coberturaplazo);
                        var hoy = new Date();
                        // log.debug('HOY', hoy);
                        // log.debug('newDateInicial', newDateInicial);
                        // log.debug('newDateAntigua', newDateAntigua);

                        let telemat = {
                            id: vehiculo.custrecord_ht_bien_id_telematic,
                            state: 1,
                            product_expire_date: fechaNuevaCompleta,
                        }
                        if (plataformas == true) {
                            log.debug('UPDATE-ASSET-IF', telemat);
                            let Telematic = envioTelematic(telemat);
                            Telematic = JSON.parse(Telematic);
                            //log.debug('Telematic', Telematic);

                            if (Telematic.asset) {
                                record.submitFields({
                                    type: 'customrecord_ht_co_cobertura',
                                    id: idCoberturaItem,
                                    values: {
                                        'custrecord_ht_co_coberturafinal': fechaNuevaCompleta,
                                        'custrecord_ht_co_plazo': plazoTotal
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: 8 });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: fechaNuevaDia });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: fechaNuevaCompleta });
                                let response = objRecord_detalle.save();
                            }
                        } else {
                            log.debug('UPDATE-ASSET-ELSE', telemat);
                            if (newDateAntigua < hoy) {
                                record.submitFields({
                                    type: 'customrecord_ht_co_cobertura',
                                    id: idCoberturaItem,
                                    values: {
                                        'custrecord_ht_co_coberturainicial': fechaNuevaDia,
                                        'custrecord_ht_co_coberturafinal': fechaNuevaCompleta,
                                        'custrecord_ht_co_plazo': plazo
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: 8 });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: fechaNuevaDia });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: fechaNuevaCompleta });
                                let response = objRecord_detalle.save();
                            } else {
                                record.submitFields({
                                    type: 'customrecord_ht_co_cobertura',
                                    id: idCoberturaItem,
                                    values: {
                                        'custrecord_ht_co_coberturafinal': fechaNuevaCompleta,
                                        'custrecord_ht_co_plazo': plazoTotal
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: 8 });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: fechaNuevaDia });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: fechaNuevaCompleta });
                                let response = objRecord_detalle.save();
                            }
                        }
                    }

                    if (objRecord.getValue('custbody_ht_os_issue_invoice') == true) {
                        let invoice = _controller.createInvoice(objRecord.id);
                        //log.debug('Invoice', invoice);
                    }
                    objRecord.save({ ignoreMandatoryFields: true, enableSourcing: false });
                }

                if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO || adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                    log.debug('Chequeo', 'VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO o VALOR_002_DESINSTALACION_DE_DISP');
                    let out = 0;
                    let bien = objRecord.getValue('custbody_ht_so_bien');
                    let busqueda_cobertura = getCoberturaItem(bien);

                    if (busqueda_cobertura.length != 0) {
                        for (let i = 0; i < busqueda_cobertura.length; i++) {
                            let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                            log.debug('busqueda_cobertura', JSON.stringify(busqueda_cobertura));
                            if (parametrosRespo != 0) {
                                for (let j = 0; j < parametrosRespo.length; j++) {
                                    if (parametrosRespo[j][0] == _constant.Parameter.TCH_TIPO_CHEQUEO_OT && parametrosRespo[j][1] == paramChequeo) {
                                        log.debug('workOrder', workOrder);
                                        if (workOrder != 0) {
                                            try {
                                                record.submitFields({
                                                    type: 'customrecord_ht_record_ordentrabajo',
                                                    id: workOrder,
                                                    values: { 'custrecord_ht_ot_serieproductoasignacion': busqueda_cobertura[i][2] },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                            } catch (error) {
                                                log.error('Errro-DESISNTALAR', error);
                                            }
                                        }
                                        if (aprobacionventa == _constant.Status.APROBADO && aprobacioncartera == _constant.Status.APROBADO) {
                                            log.debug('Entry', 'Cobertura');
                                            if (esUpgrade == _constant.Valor.SI) {
                                                record.submitFields({
                                                    type: 'customrecord_ht_co_cobertura',
                                                    id: busqueda_cobertura[i][1],
                                                    values: {
                                                        'custrecord_ht_co_familia_prod': ttr,
                                                        'custrecord_ht_co_estado': _constant.Status.CONVERTIDO
                                                    },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                            }
                                        }
                                        out = 1;
                                        break;
                                    }
                                }
                                if (out == 1)
                                    break;
                            }
                        }
                    }

                    if (esAlquiler == _constant.Valor.SI && adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                        log.error('Entry', 'Ingreso a envío de correo por geneaci´no de desinstalación de alquiler');
                        let emailBody = '<p><b>Orden de Servicio por Desinstalación de Alquiler: </b><span style="color: #000000;">' + ordenServicio + '</span></p>' +
                            //'<p><b>Orden de Servicio por Instalación: </b><span style="color: #000000;">' + customer + '</span></p>' +
                            '<p><b>Cliente: </b><span style="color: #000000;">' + customer + '</span></p>' +
                            '<p><b>Bien: </b><span style="color: #000000;">' + vehiculo + '</span></p>'

                        let objSearch = search.create({
                            type: "employee",
                            filters: [["role", "anyof", _constant.Roles.EC_CUENTAS_POR_COBRAR], "AND", ["email", "isnotempty", ""]],
                            columns: [search.createColumn({ name: "email", label: "Email" })]
                        });
                        //let searchResultCount = objSearch.runPaged().count;
                        //log.debug("employeeSearchObj result count", searchResultCount);
                        objSearch.run().each(result => {
                            let correo = result.getValue({ name: 'email' });
                            arrayRecipientsOriginal.push(correo);
                            return true;
                        });

                        if (objSearch.runPaged().count > 0) {
                            for (let i = 0; i < arrayRecipientsOriginal.length; i += 10) {
                                const subArreglo = arrayRecipientsOriginal.slice(i, i + 10);
                                arrayRecipients.push(subArreglo);
                            }

                            log.error('ArrayRecipients', arrayRecipients);
                            for (let j = 0; j < arrayRecipients.length; j++) {
                                email.send({
                                    author: senderId,
                                    recipients: arrayRecipients[j],
                                    subject: 'Orden de Servicio por Desinstalación de Alquiler ' + ordenServicio,
                                    body: emailBody,
                                    relatedRecords: { transactionId: idRecord }
                                });
                            }
                        }
                    }
                }

                if (ccd == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS) {
                    log.error("CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS", true);
                    let deviceItemResult = search.create({
                        type: "customrecord_ht_record_custodia",
                        filters: [["name", "is", itemCustodia.inventoryNumber]],
                        columns: ["custrecord_ht_ct_nombredispositivo", "custrecord_ht_ct_venta"]
                    }).run().getRange(0, 1);
                    log.error("deviceItemResult[0]", deviceItemResult.length);
                    let salesItem = deviceItemResult[0].getValue("custrecord_ht_ct_venta");
                    log.error("salesItem", salesItem);

                    let workOrderRecord = record.submitFields({
                        type: "customrecord_ht_record_ordentrabajo",
                        id: workOrder,
                        values: {
                            "custrecord_ht_ot_item": salesItem,
                            "custrecord_ht_ot_itemrelacionado": itemCustodia.item
                        }
                    });
                }

                if (definicionServicios) {
                    log.debug('Servicios22222!!!!!!!!!!!!!!', paralizador + ' - ' + botonPanico);
                    record.submitFields({
                        type: _constant.customRecord.ORDEN_TRABAJO,
                        id: workOrder,
                        values: {
                            custrecord_ht_ot_paralizador: paralizador,
                            custrecord_ht_ot_boton_panico: botonPanico
                        },
                        options: { enablesourcing: true }
                    });
                    log.debug('PARALIZADORT', workOrder + ' Actualizada');
                }

                log.error("esGarantia", esGarantia);
                if (esGarantia) {
                    var bien = objRecord.getValue('custbody_ht_so_bien');
                    let itemVentaGarantia = getCoberturaItem(bien);
                    log.error("itemVentaGarantia", itemVentaGarantia);
                    if (itemVentaGarantia.length) {
                        let workOrderResult = search.create({
                            type: "customrecord_ht_record_ordentrabajo",
                            filters: [["custrecord_ht_ot_orden_servicio", "anyof", idRecord]],
                            columns: ["internalid"]
                        }).run().getRange(0, 100);
                        log.error("workOrderResult", workOrderResult.length);
                        if (workOrderResult.length) {
                            for (let i = 0; i < workOrderResult.length; i++) {
                                let workOrder = workOrderResult[i].id;
                                let workOrderRecord = record.submitFields({
                                    type: "customrecord_ht_record_ordentrabajo",
                                    id: workOrder,
                                    values: { "custrecord_ts_item_venta_garantia": itemVentaGarantia[0][0] }
                                });
                            }
                        }
                    }
                }


                // if (generaOrdenTrabajo == 1 && esGarantia == 0) {
                //     workOrder = _controller.parametros(_constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO, json);
                // }
            } catch (error) {
                log.error('Erro-Create', error);
            }
        }

        if (scriptContext.type === scriptContext.UserEventType.EDIT) {
            var objRecord = scriptContext.newRecord;
            const idRecord = objRecord.id;
            let orderstatus = objRecord.getValue('orderstatus');
            let numLines = objRecord.getLineCount({ sublistId: 'item' });
            let aprobacionventa = objRecord.getValue('custbody_ht_os_aprobacionventa');
            let aprobacioncartera = objRecord.getValue('custbody_ht_os_aprobacioncartera');
            let customer = objRecord.getValue('entity');
            let parametrocambpropcobertura = 0;
            var htClient = '';
            var valor_tipo_agrupacion = 0;
            var bien = '';
            var fechaInicial = '';
            let parametro = 0;
            let monitoreo
            let parametro_aprob = 0;
            let parametrosRespo;
            let returEjerepo = false;
            let adp;
            let ttr;
            let ccd = 0, paramChequeo = 0, esUpgrade = _constant.Valor.NO;
            let esCustodia = 0;
            let custodiaDisp = 0;
            try {
                //let aprobacion_venta = objRecord.getValue('custbody_ht_os_aprobacionventa');
                // log.debug('orderstatus', orderstatus);
                // log.debug('aprobacionventa', aprobacionventa);
                // log.debug('aprobacioncartera', aprobacioncartera);
                if (aprobacionventa == _constant.Status.APROBADO && aprobacioncartera == _constant.Status.APROBADO) {
                    for (let i = 0; i < numLines; i++) {
                        //objRecord.selectLine({ sublistId: 'item', line: i });
                        let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        parametrosRespo = _controller.parametrizacion(items);
                        if (parametrosRespo != 0) {
                            //log.debug('parametrosRespop', parametrosRespo);
                            for (let j = 0; j < parametrosRespo.length; j++) {
                                if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                                    parametro = parametrosRespo[j][1];

                                if (parametrosRespo[j][0] == _constant.Parameter.CPC_HMONITOREO_CAMBIO_PROPETARIO_CON_COBERTURAS)
                                    parametrocambpropcobertura = parametrosRespo[j][1];

                                if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO)
                                    valor_tipo_agrupacion = parametrosRespo[j][1];

                                if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                                    adp = parametrosRespo[j][1]

                                if (parametrosRespo[j][0] == _constant.Parameter.TTR_TIPO_TRANSACCION)
                                    ttr = parametrosRespo[j][1]

                                if (parametrosRespo[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS)
                                    ccd = parametrosRespo[j][1]

                                if (parametrosRespo[j][0] == _constant.Parameter.CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][1] == _constant.Valor.SI)
                                    esUpgrade = _constant.Valor.SI;

                                if (parametrosRespo[j][0] == _constant.Parameter.TCH_TIPO_CHEQUEO_OT)
                                    paramChequeo = parametrosRespo[j][1];
                            }
                        }
                        htClient = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: i });
                        log.debug('htClient', htClient);
                        monitoreo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i });
                        log.debug('monitoreo', monitoreo);
                        bien = objRecord.getValue('custbody_ht_so_bien');
                        custodiaDisp = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia', line: i });
                        log.debug('custodiaDisp', custodiaDisp);
                        // var fechaInicialItem = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cambio_fecha', line: i });
                        // fechaInicial = new Date(fechaInicialItem);
                    }
                    // log.debug('parametrocambpropcobertura', parametrocambpropcobertura);
                    // log.debug('valor_tipo_agrupacion', valor_tipo_agrupacion);
                    // log.debug('ADP', adp);
                    // log.debug('DEBUG1', ccd + ' - ' + ttr);
                    if (ccd == _constant.Valor.SI || ttr == _constant.Valor.VALOR_CAMB_GPS_TDE_DEALER_MOV_CUSTODIA) {
                        esCustodia = 1
                    }

                    //log.debug('DEBUGGGGGG', adp + ' - ' + esCustodia + ' - ' + parametro);
                    if (parametro != 0 && esCustodia == 0 && adp == _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO) {
                        log.debug('entra plataformas por cambio de propietario');
                        for (let j = 0; j < parametrosRespo.length; j++) {
                            if (parametrosRespo[j][0] == _constant.Parameter.PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametrosRespo[j][1] == _constant.Valor.SI) {
                                returEjerepo = _controller.parametros(_constant.Parameter.PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC, idRecord, parametro);
                            }
                        }
                        if (returEjerepo == false) {
                            let idCoberturaItem;
                            let responsePlataformasPX;
                            let responsePlataformasTM;
                            let busqueda_cobertura = getCoberturaItem(bien);
                            log.debug('busqueda_cobertura', busqueda_cobertura);
                            log.debug('monitoreo', monitoreo);
                            log.debug('htClient', htClient);
                            //log.debug('bien', bien);
                            if (busqueda_cobertura != 0) {
                                log.debug('bienNNNN', bien);
                                for (let i = 0; i < busqueda_cobertura.length; i++) {
                                    //log.debug('Init For');
                                    let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                    if (parametrosRespo != 0) {
                                        var accion_producto_2 = 0;
                                        var valor_tipo_agrupacion_2 = 0;
                                        for (let j = 0; j < parametrosRespo.length; j++) {
                                            if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO) {
                                                valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                                //log.debug('valor_tipo_agrupacion_2', valor_tipo_agrupacion_2);
                                            }
                                            if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {//TODO: Para cambio de propietario de bien debe cambiar a todos los productos instalados.
                                                idCoberturaItem = busqueda_cobertura[i][1];
                                                //log.debug('idCoberturaItem', idCoberturaItem);
                                            }

                                            if (parametrosRespo[j][0] == _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS && parametrosRespo[j][1] == _constant.Valor.SI) {
                                                log.debug('Entré', 'Entré a Parametrizar PX !!!!!');
                                                responsePlataformasPX = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, idRecord, _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO);
                                            }

                                            if (parametrosRespo[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS && parametrosRespo[j][1] == _constant.Valor.SI) {
                                                log.debug('Entré', 'Entré a Parametrizar TM!!!!!');
                                                responsePlataformasTM = _controller.parametros(_constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, idRecord, _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO);
                                            }
                                        }
                                    }
                                }
                                log.debug('idCoberturaItem', idCoberturaItem);
                                log.debug('responsePlataformasPX', responsePlataformasPX);
                                log.debug('responsePlataformasTM', responsePlataformasTM);
                                //TODO: SOLO PARAPRUEBAS CAMBIO PROPIETARIO, LUEGO ACTIVAR
                                try {
                                    record.submitFields({
                                        type: 'customrecord_ht_co_cobertura',
                                        id: idCoberturaItem,
                                        values: {
                                            'custrecord_ht_co_clientemonitoreo': monitoreo,
                                            'custrecord_ht_co_propietario': htClient
                                        },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });
                                } catch (error) { }
                            }
                            //TODO: SOLO PARAPRUEBAS CAMBIO PROPIETARIO, LUEGO ACTIVAR
                            record.submitFields({
                                type: 'customrecord_ht_record_bienes',
                                id: bien,
                                values: {
                                    'custrecord_ht_bien_propietario': htClient
                                },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                            record.submitFields({ type: 'salesorder', id: idRecord, values: { 'custbody_ht_os_aprobacionventa': 1, 'orderstatus': 'B' }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                            transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                        }
                    }


                    if (adp == _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO) {
                        //log.debug('ADP', 'Cambio de propietario');
                        if (esCustodia == 1) {
                            let internalid;
                            let custodiaSearch = search.create({
                                type: "customrecord_ht_record_custodia",
                                filters:
                                    [
                                        ["custrecord_ht_ct_cliente", "anyof", customer],
                                        "AND",
                                        ["name", "haskeywords", custodiaDisp]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                                        search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Número de dispositivo" }),
                                        search.createColumn({ name: "custrecord_ht_ct_nombredispositivo", label: "Nombre del dispositivo" }),
                                        search.createColumn({ name: "custrecord_ht_ct_ubicacion", label: "Ubicación" }),
                                        search.createColumn({ name: "custrecord_ht_ct_deposito", label: "Deposito" }),
                                        search.createColumn({ name: "custrecord_ht_ct_cliente", label: "Cliente" }),
                                        search.createColumn({ name: "custrecord_ht_ct_estado", label: "Estado" })
                                    ]
                            });
                            let searchResultCount = custodiaSearch.runPaged().count;
                            //log.debug("searchResultCount", searchResultCount);
                            if (searchResultCount > 0) {
                                custodiaSearch.run().each(result => {
                                    internalid = result.getValue({ name: "internalid" });
                                    return true;
                                });
                                //log.debug("id", internalid);
                                record.submitFields({
                                    type: 'customrecord_ht_record_custodia',
                                    id: internalid,
                                    values: {
                                        'custrecord_ht_ct_cliente': htClient
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                            }
                        }
                        try {
                            transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                        } catch (error) { }
                    }


                    if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                        log.debug('Chequeo', 'VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO o VALOR_002_DESINSTALACION_DE_DISP');
                        let out = 0;
                        let bien = objRecord.getValue('custbody_ht_so_bien');
                        let busqueda_cobertura = getCoberturaItem(bien);
                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {
                                let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                log.debug('busqueda_cobertura', JSON.stringify(busqueda_cobertura));
                                if (parametrosRespo != 0) {
                                    for (let j = 0; j < parametrosRespo.length; j++) {
                                        if (parametrosRespo[j][0] == _constant.Parameter.TCH_TIPO_CHEQUEO_OT && parametrosRespo[j][1] == paramChequeo) {
                                            //TODO: Habilitar este bloque para cuando se haga el ajuste del proceso por aprobación ==========
                                            if (workOrder != 0) {
                                                record.submitFields({
                                                    type: 'customrecord_ht_record_ordentrabajo',
                                                    id: workOrder,
                                                    values: { 'custrecord_ht_ot_serieproductoasignacion': busqueda_cobertura[i][2] },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                            }
                                            log.debug('Entry', 'Cobertura');
                                            if (esUpgrade == _constant.Valor.SI) {
                                                record.submitFields({
                                                    type: 'customrecord_ht_co_cobertura',
                                                    id: busqueda_cobertura[i][1],
                                                    values: {
                                                        'custrecord_ht_co_familia_prod': ttr,
                                                        'custrecord_ht_co_estado': _constant.Status.CONVERTIDO
                                                    },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                            }
                                            out = 1;
                                            break;
                                        }
                                    }
                                    if (out == 1)
                                        break;
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                log.error('Erro-Edit', error);
            }
        }
    }


    const envioTelematic = (json) => {
        let myRestletHeaders = new Array();
        myRestletHeaders['Accept'] = '*/*';
        myRestletHeaders['Content-Type'] = 'application/json';

        let myRestletResponse = https.requestRestlet({
            body: JSON.stringify(json),
            deploymentId: 'customdeploy_ns_rs_update_asset',
            scriptId: 'customscript_ns_rs_update_asset',
            headers: myRestletHeaders,
        });
        let response = myRestletResponse.body;
        return response;
    }

    const getCoberturaItem = (idBien) => {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_bien", "anyof", idBien]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_co_producto", label: "HT CO Producto" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_ht_co_numeroserieproducto", label: "Chaser" })
                    ]
            });
            var searchResultCount = busqueda.runPaged().count;
            log.debug('searchResultCount', searchResultCount);
            //var savedsearch = busqueda.run().getRange(0, 100);
            //log.debug('savedsearch', savedsearch);
            let internalidItem = '';
            let internalid = '';
            let chaser = '';
            var arrayIdTotal = [];
            if (searchResultCount > 0) {
                busqueda.run().each(result => {
                    var arrayId = [];
                    internalidItem = result.getValue(busqueda.columns[0]);
                    arrayId.push(internalidItem);
                    internalid = result.getValue(busqueda.columns[1]);
                    arrayId.push(internalid);
                    chaser = result.getValue(busqueda.columns[2]);
                    arrayId.push(chaser);
                    arrayIdTotal.push(arrayId);
                    return true;
                });
            } else {
                arrayIdTotal = searchResultCount;
            }
            return arrayIdTotal;
        } catch (error) {
            log.error('Error en getCoberturaItem', error);
        }
    }

    const getDescription = (entity, item) => {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_record_descriparticulo",
                filters:
                    [
                        ["custrecord_ht_da_enlace", "anyof", entity],
                        "AND",
                        ["custrecord_ht_da_articulocomercial", "anyof", item]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_ht_da_enlace", label: "HT DA Enlace" }),
                        search.createColumn({ name: "custrecord_ht_da_articulocomercial", label: "HT DA Artículo comercial" }),
                        search.createColumn({ name: "custrecord_ht_da_descripcionventa", label: "HT DA Descripción de Venta" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var description = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    description = result.getValue(busqueda.columns[3]);
                    return true;
                });
            }
            return description;
        } catch (e) {
            log.error('Error en getDescription', e);
        }
    }

    const getCobertura = (bien) => {
        try {
            var arrCoberturaId = new Array();
            var busqueda = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_bien", "anyof", bien]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var pageData = busqueda.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrCobertura = new Array();
                    //0. Internal id match
                    if (result.getValue(columns[0]) != null)
                        arrCobertura[0] = result.getValue(columns[0]);
                    else
                        arrCobertura[0] = '';
                    arrCoberturaId.push(arrCobertura);
                });
            });
            return arrCoberturaId;
        } catch (e) {
            log.error('Error en getCobertura', e);
        }
    }

    // const aprobarVenta = (idRecord, htClient, bien, fechaInicial, monitoreo) => {
    //     var f = new Date();
    //     let parametro = 0;
    //     let parametrocambpropcobertura = 0;
    //     var valor_tipo_agrupacion = 0;
    //     var fechaActual = formatDateJson(f);
    //     fechaActual = "SH2PX" + fechaActual;
    //     log.debug('fechaInicial', fechaInicial);
    //     var fechainialtest = new Date(fechaInicial);
    //     var fechafinaltest = new Date(fechaInicial);
    //     fechafinaltest = fechafinaltest.setMonth(fechafinaltest.getMonth() + 12);
    //     fechafinaltest = new Date(fechafinaltest);
    //     log.debug('fechainialtest', fechainialtest);
    //     log.debug('fechafinaltest', fechafinaltest);
    //     var fechaInicialSplit = fechaInicial.split('/');
    //     var fechaInicialTelematic = fechaInicialSplit[2] + '-' + fechaInicialSplit[1] + '-' + fechaInicialSplit[0] + 'T00:00';
    //     //var fechaFinalSplit = fechaFinal.split('/');
    //     //var fechaFinalTelematic = fechaFinalSplit[2] + '-' + fechaFinalSplit[1] + '-' + fechaFinalSplit[0] + 'T00:00';
    //     let objRecord_salesorder = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
    //     let numLines = objRecord_salesorder.getLineCount({ sublistId: 'item' });
    //     let parametrosRespo;
    //     let returEjerepo = false;
    //     for (let i = 0; i < numLines; i++) {
    //         objRecord_salesorder.selectLine({ sublistId: 'item', line: i });
    //         let items = objRecord_salesorder.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
    //         parametrosRespo = _controller.parametrizacion(items);
    //         log.debug(parametrosRespo);
    //         if (parametrosRespo.length != 0) {
    //             for (let j = 0; j < parametrosRespo.length; j++) {
    //                 if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
    //                     parametro = parametrosRespo[j][1];
    //                 }
    //                 if (parametrosRespo[j][0] == CAMBIO_PROPIETARIO_COBERTURA) {
    //                     parametrocambpropcobertura = parametrosRespo[j][1];
    //                 }
    //                 if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
    //                     valor_tipo_agrupacion = parametrosRespo[j][1];
    //                 }
    //             }
    //         }
    //     }

    //     if (parametrocambpropcobertura == '18') {
    //         log.debug('parametrocambpropcobertura');
    //         record.submitFields({
    //             type: 'salesorder',
    //             id: idRecord,
    //             values: { 'custbody_ht_os_aprobacionventa': 1 },
    //             options: { enableSourcing: false, ignoreMandatoryFields: true }
    //         });
    //         transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
    //         location.reload();
    //     } else {
    //         if (parametro != 0) {
    //             log.debug('entra plataformas');
    //             for (let j = 0; j < parametrosRespo.length; j++) {
    //                 if (parametrosRespo[j][0] == _constant.Parameter.PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametro == '9') {
    //                     returEjerepo = _controller.parametros(ENVIO_PLATAFORMAS, idRecord, parametro);
    //                 }
    //             }
    //             //log.debug('returEjerepo', returEjerepo);

    //             if (returEjerepo == false) {
    //                 let idCoberturaItem;
    //                 let busqueda_cobertura = getCoberturaItem(bien);
    //                 log.debug('busqueda_cobertura', busqueda_cobertura);
    //                 if (busqueda_cobertura.length != 0) {
    //                     for (let i = 0; i < busqueda_cobertura.length; i++) {

    //                         let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
    //                         if (parametrosRespo.length != 0) {
    //                             var accion_producto_2 = 0;
    //                             var valor_tipo_agrupacion_2 = 0;
    //                             for (let j = 0; j < parametrosRespo.length; j++) {

    //                                 if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
    //                                     valor_tipo_agrupacion_2 = parametrosRespo[j][1];
    //                                 }

    //                                 if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
    //                                     idCoberturaItem = busqueda_cobertura[i][1];
    //                                 }

    //                             }
    //                         }
    //                     }
    //                 }
    //                 log.debug('monitoreo', monitoreo);
    //                 log.debug('htClient', htClient);
    //                 log.debug('bien', bien);
    //                 log.debug('idCoberturaItem', idCoberturaItem);
    //                 record.submitFields({
    //                     type: 'customrecord_ht_co_cobertura',
    //                     id: idCoberturaItem,
    //                     values: {
    //                         'custrecord_ht_co_clientemonitoreo': monitoreo,
    //                         'custrecord_ht_co_propietario': htClient
    //                     },
    //                     options: { enableSourcing: false, ignoreMandatoryFields: true }
    //                 });
    //                 record.submitFields({
    //                     type: 'customrecord_ht_record_bienes',
    //                     id: bien,
    //                     values: { 'custrecord_ht_bien_propietario': htClient },
    //                     options: { enableSourcing: false, ignoreMandatoryFields: true }
    //                 });
    //                 record.submitFields({
    //                     type: 'salesorder',
    //                     id: idRecord,
    //                     values: { 'custbody_ht_os_aprobacionventa': 1, 'orderstatus': 'B' },
    //                     options: { enableSourcing: false, ignoreMandatoryFields: true }
    //                 });
    //                 log.debug('despues');
    //                 transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
    //             }
    //         }
    //     }
    // }

    const padTo2Digits = (num) => {
        return num.toString().padStart(2, '0');
    }

    const formatDateJson = (date) => {
        return [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate())
        ].join('');
    }

    return {
        beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});