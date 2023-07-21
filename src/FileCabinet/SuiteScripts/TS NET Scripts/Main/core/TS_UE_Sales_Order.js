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
    '../controller/TS_CM_Controller',
    // '../../Impulso Plataformas/Controller/TS_Script_Controller',
    'N/https'
], (log, record, search, serverWidget, plugin, transaction, _controller, https) => {
    const HT_DETALLE_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_detalle_orden_servicio_2'; //HT Detalle Orden de Servicio - PRODUCCION
    const ORDEN_TRABAJO = '34';
    const GENERA_VARIAS_ORDEN_TRABAJO = '90';
    var TIPO_TRANSACCION = '2';
    var MONITOREO = '7';
    var SOLICITA_APROBACION = '11';
    var RENOVACION_PRODUCTO = '15';
    var SOLICITA_FACTURACION = '33';
    const TAG_TIPO_AGRUPACION_PRODUCTO = 77;
    var CAMBIO_PROPIETARIO_COBERTURA = '24';
    const SI = 9
    const NO = 18
    //~BLOQUE ADP Y VALOR====================================================
    /* Variables para identificación de ADP Y valores */
    const PARAM_ADP_ACCION_DEL_PRODUCTO = 2
    const VALOR_010_CAMBIO_PROPIETARIO = 10;
    const PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC = 5
    const TTR_TIPO_TRANSACCION = 8;
    const CAMB_MOV_CUSTODIA = 131;
    const CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS = 21;


    const beforeLoad = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            const form = scriptContext.form;
            const objRecord = scriptContext.newRecord;
            let editServiceOrder = form.getButton('edit');
            if (objRecord.getValue('custbodycustbody_ht_os_created_from_sa') == true) editServiceOrder.isDisabled = true;
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
                    if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                        parametro = parametrosRespo[j][1];
                    }
                    if (parametrosRespo[j][0] == SOLICITA_APROBACION) {
                        parametro_aprob = parametrosRespo[j][1];
                    }
                }
                if (parametro_aprob == SI) {
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
                let parametro = 0;
                let parametro_aprob = 0;
                let parametro_fact = 0;
                const currentRecord = scriptContext.newRecord;
                let idRecord = currentRecord.id;
                let objRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
                let customer = objRecord.getValue('entity');
                let vehiculo = objRecord.getValue('custbody_ht_so_bien');
                let renovamos = false;
                let plataformas = false;
                let ordenServicio = objRecord.getValue('tranid');
                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                let plazo = 0;
                var valor_tipo_agrupacion = 0;
                for (let i = 0; i < numLines; i++) {
                    objRecord.selectLine({ sublistId: 'item', line: i });
                    let cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });
                    let items = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
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
                        ordenServicio: ordenServicio
                    }

                    for (let j = 0; j < parametrosRespo.length; j++) {
                        if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                            parametro = parametrosRespo[j][1];

                        }
                        if (parametrosRespo[j][0] == TAG_TIPO_AGRUPACION_PRODUCTO) {
                            valor_tipo_agrupacion = parametrosRespo[j][1];
                        }
                        // log.debug('parametrosRespo[j][0]', parametrosRespo[j][0]);
                        // log.debug('parametrosRespo[j][1]', parametrosRespo[j][1]);
                        if (parametrosRespo[j][0] == SOLICITA_APROBACION) {
                            parametro_aprob = parametrosRespo[j][1];
                            //log.debug('parametro_aprob1', parametro_aprob);
                        }
                        if (parametrosRespo[j][0] == SOLICITA_FACTURACION) {
                            parametro_fact = parametrosRespo[j][1];
                            //log.debug('parametro_fact1', parametro_fact);
                        }
                        if (parametrosRespo[j][1] == RENOVACION_PRODUCTO) {
                            renovamos = true;
                            plazo += cantidad;
                        }
                        if (parametrosRespo[j][0] == PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC&& parametrosRespo[j][1] == SI) {
                            plataformas = true;
                        }
                        if (parametrosRespo[j][0] == ORDEN_TRABAJO && parametrosRespo[j][1] == SI) {
                            let workOrder = _controller.parametros(ORDEN_TRABAJO, json);
                            //log.debug('OT ', workOrder);
                        }
                        if (parametrosRespo[j][0] == GENERA_VARIAS_ORDEN_TRABAJO && parametrosRespo[j][1] == SI) {
                            let workOrder = _controller.parametros(GENERA_VARIAS_ORDEN_TRABAJO, json);
                            //log.debug('VOT ', workOrder);
                        }
                    }
                }

                // log.debug('parametro_aprob', parametro_aprob);
                // log.debug('parametro_fact', parametro_fact);
                if (parametro_aprob != SI && parametro_fact == NO) {
                    log.debug('cierra', idRecord);
                    //transaction.void({ type: 'salesorder', id: idRecord });
                } else {
                    if (parametro_aprob == SI) {
                        log.debug('parametro_aprob', parametro_aprob);
                        objRecord.setValue('orderstatus', 'A');
                        objRecord.setValue('custbody_ht_os_aprobacionventa', 2);
                    }
                    if (renovamos == true) {
                        var bien = objRecord.getValue('custbody_ht_so_bien');
                        var idCoberturaItem;
                        let busqueda_cobertura = getCoberturaItem(bien);
                        log.debug('busqueda_cobertura', busqueda_cobertura);
                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {

                                let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                if (parametrosRespo.length != 0) {
                                    var accion_producto_2 = 0;
                                    var valor_tipo_agrupacion_2 = 0;
                                    for (let j = 0; j < parametrosRespo.length; j++) {

                                        if (parametrosRespo[j][0] == TAG_TIPO_AGRUPACION_PRODUCTO) {
                                            valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                        }

                                        if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                                            idCoberturaItem = busqueda_cobertura[i][1];
                                        }

                                    }
                                }
                            }
                        }
                        let vehiculo = search.lookupFields({
                            type: 'customrecord_ht_record_bienes',
                            id: bien,
                            columns: ['custrecord_ht_bien_id_telematic']
                        });
                        var cobertura = search.lookupFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: idCoberturaItem,
                            columns: ['custrecord_ht_co_coberturainicial', 'custrecord_ht_co_coberturafinal', 'custrecord_ht_co_numeroserieproducto', 'custrecord_ht_co_plazo']
                        });
                        var idDispositivo = cobertura.custrecord_ht_co_numeroserieproducto[0].value;
                        var coberturaplazo = cobertura.custrecord_ht_co_plazo;
                        log.debug('idDispositivo', idDispositivo);
                        var coberturaAntigua = cobertura.custrecord_ht_co_coberturafinal;
                        var cobertura_inicial = cobertura.custrecord_ht_co_coberturainicial;
                        cobertura_inicial = cobertura_inicial.split('/');
                        var nuevaCoberturaInicial = cobertura_inicial[1] + '/' + cobertura_inicial[0] + '/' + cobertura_inicial[2];
                        var fechaInicial = Date.parse(nuevaCoberturaInicial);
                        var newDateInicial = new Date(fechaInicial);
                        var producto = search.lookupFields({
                            type: 'customrecord_ht_record_mantchaser',
                            id: idDispositivo,
                            columns: ['custrecord_ht_mc_id_telematic']
                        });
                        var idTelematic = producto.custrecord_ht_mc_id_telematic;
                        log.debug('idTelematic', idTelematic);
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
                        log.debug('HOY', hoy);
                        log.debug('newDateInicial', newDateInicial);
                        log.debug('newDateAntigua', newDateAntigua);

                        let telemat = {
                            id: idTelematic,
                            state: 1,
                            product_expire_date: fechaNuevaCompleta,
                        }
                        if (plataformas == true) {
                            let Telematic = envioTelematic(telemat);
                            Telematic = JSON.parse(Telematic);
                            log.debug('Telematic', Telematic);

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
                        log.debug('Invoice', invoice);
                    }
                    objRecord.save({ ignoreMandatoryFields: true, enableSourcing: false });
                }
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
            let ccd = 0;
            let esCustodia = 0;
            let custodiaDisp = 0;
            try {
                //let aprobacion_venta = objRecord.getValue('custbody_ht_os_aprobacionventa');
                // log.debug('orderstatus', orderstatus);
                // log.debug('aprobacionventa', aprobacionventa);
                // log.debug('aprobacioncartera', aprobacioncartera);
                if (aprobacionventa == 1 && aprobacioncartera == 1) {
                    for (let i = 0; i < numLines; i++) {
                        //objRecord.selectLine({ sublistId: 'item', line: i });
                        let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        parametrosRespo = _controller.parametrizacion(items);
                        //log.debug('parametrosRespop', parametrosRespo);
                        if (parametrosRespo.length != 0) {
                            for (let j = 0; j < parametrosRespo.length; j++) {
                                if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                                    parametro = parametrosRespo[j][1];
                                }
                                if (parametrosRespo[j][0] == CAMBIO_PROPIETARIO_COBERTURA) {
                                    parametrocambpropcobertura = parametrosRespo[j][1];
                                }
                                if (parametrosRespo[j][0] == TAG_TIPO_AGRUPACION_PRODUCTO) {
                                    valor_tipo_agrupacion = parametrosRespo[j][1];
                                }
                                if (parametrosRespo[j][0] == PARAM_ADP_ACCION_DEL_PRODUCTO) {
                                    adp = parametrosRespo[j][1]
                                }
                                if (parametrosRespo[j][0] == TTR_TIPO_TRANSACCION) {
                                    ttr = parametrosRespo[j][1]
                                }
                                if (parametrosRespo[j][0] == CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS) {
                                    ccd = parametrosRespo[j][1]
                                }
                            }
                        }
                        htClient = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: i });
                        //log.debug('htClient', htClient);
                        monitoreo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i });
                        //log.debug('monitoreo', monitoreo);
                        bien = objRecord.getValue('custbody_ht_so_bien');
                        custodiaDisp = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i });
                        //log.debug('monitoreo', monitoreo);
                        // var fechaInicialItem = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cambio_fecha', line: i });
                        // fechaInicial = new Date(fechaInicialItem);
                    }
                    // log.debug('parametrocambpropcobertura', parametrocambpropcobertura);
                    // log.debug('valor_tipo_agrupacion', valor_tipo_agrupacion);
                    // log.debug('ADP', adp);
                    // log.debug('DEBUG1', ccd + ' - ' + ttr);
                    if (ccd == SI || ttr == CAMB_MOV_CUSTODIA)
                        esCustodia = 1
                    if (parametro != 0 && esCustodia == 0) {
                        //log.debug('entra plataformas por cambio de propietario');
                        for (let j = 0; j < parametrosRespo.length; j++) {
                            if (parametrosRespo[j][0] == PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametrosRespo[j][1] == SI) {
                                returEjerepo = _controller.parametros(PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC, idRecord, parametro);
                            }
                        }
                        if (returEjerepo == false) {
                            let idCoberturaItem;
                            let busqueda_cobertura = getCoberturaItem(bien);
                            // log.debug('busqueda_cobertura', busqueda_cobertura);
                            // log.debug('monitoreo', monitoreo);
                            // log.debug('htClient', htClient);
                            // log.debug('bien', bien);
                            if (busqueda_cobertura != 0) {
                                for (let i = 0; i < busqueda_cobertura.length; i++) {
                                    //log.debug('Init For');
                                    let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                    if (parametrosRespo.length != 0) {
                                        var accion_producto_2 = 0;
                                        var valor_tipo_agrupacion_2 = 0;
                                        for (let j = 0; j < parametrosRespo.length; j++) {
                                            if (parametrosRespo[j][0] == TAG_TIPO_AGRUPACION_PRODUCTO) {
                                                valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                                //log.debug('valor_tipo_agrupacion_2', valor_tipo_agrupacion_2);
                                            }
                                            if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                                                idCoberturaItem = busqueda_cobertura[i][1];
                                                //log.debug('idCoberturaItem', idCoberturaItem);
                                            }
                                        }
                                    }
                                }
                                //log.debug('idCoberturaItem', idCoberturaItem);
                                record.submitFields({
                                    type: 'customrecord_ht_co_cobertura',
                                    id: idCoberturaItem,
                                    values: {
                                        'custrecord_ht_co_clientemonitoreo': monitoreo,
                                        'custrecord_ht_co_propietario': htClient
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                            }
                            record.submitFields({
                                type: 'customrecord_ht_record_bienes',
                                id: bien,
                                values: {
                                    'custrecord_ht_bien_propietario': htClient
                                },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                            //record.submitFields({ type: 'salesorder', id: idRecord, values: { 'custbody_ht_os_aprobacionventa': 1, 'orderstatus': 'B' }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                            //transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                        }
                    }


                    if (adp == VALOR_010_CAMBIO_PROPIETARIO) {
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
                        transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                    }




                    // if (parametrocambpropcobertura == NO) {
                    //     //record.submitFields({ type: 'salesorder', id: idRecord, values: { 'custbody_ht_os_aprobacionventa': 1 }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                    //     //transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                    //     // location.reload();
                    // } else {

                    //     if (parametro != 0) {
                    //         log.debug('entra plataformas por cambio de propietario');
                    //         for (let j = 0; j < parametrosRespo.length; j++) {
                    //             if (parametrosRespo[j][0] == PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametrosRespo[j][1] == SI) {
                    //                 returEjerepo = _controller.parametros(PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC, idRecord, parametro);
                    //             }
                    //         }
                    //         //log.debug('returEjerepo', returEjerepo);
                    //         if (returEjerepo == false) {
                    //             let idCoberturaItem;
                    //             let busqueda_cobertura = getCoberturaItem(bien);
                    //             log.debug('busqueda_cobertura', busqueda_cobertura);
                    //             log.debug('monitoreo', monitoreo);
                    //             log.debug('htClient', htClient);
                    //             log.debug('bien', bien);
                    //             if (busqueda_cobertura != 0) {
                    //                 for (let i = 0; i < busqueda_cobertura.length; i++) {
                    //                     log.debug('Init For');
                    //                     let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                    //                     //log.debug('parametrosRespo', parametrosRespo);
                    //                     if (parametrosRespo.length != 0) {
                    //                         var accion_producto_2 = 0;
                    //                         var valor_tipo_agrupacion_2 = 0;
                    //                         for (let j = 0; j < parametrosRespo.length; j++) {
                    //                             if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                    //                                 valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                    //                                 log.debug('valor_tipo_agrupacion_2', valor_tipo_agrupacion_2);
                    //                             }
                    //                             if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                    //                                 idCoberturaItem = busqueda_cobertura[i][1];
                    //                                 log.debug('idCoberturaItem', idCoberturaItem);
                    //                             }
                    //                         }
                    //                     }
                    //                 }
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
                    //             }
                    //             record.submitFields({
                    //                 type: 'customrecord_ht_record_bienes',
                    //                 id: bien,
                    //                 values: {
                    //                     'custrecord_ht_bien_propietario': htClient
                    //                 },
                    //                 options: { enableSourcing: false, ignoreMandatoryFields: true }
                    //             });
                    //             //record.submitFields({ type: 'salesorder', id: idRecord, values: { 'custbody_ht_os_aprobacionventa': 1, 'orderstatus': 'B' }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                    //             //transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                    //         }
                    //     }
                    // }
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
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var searchResultCount = busqueda.runPaged().count;
            log.debug('searchResultCount', searchResultCount);
            //var savedsearch = busqueda.run().getRange(0, 100);
            //log.debug('savedsearch', savedsearch);
            var internalidItem = '';
            var internalid = '';
            var arrayIdTotal = [];
            if (searchResultCount > 0) {
                busqueda.run().each((result) => {
                    var arrayId = [];
                    internalidItem = result.getValue(busqueda.columns[0]);
                    arrayId.push(internalidItem);
                    internalid = result.getValue(busqueda.columns[1]);
                    arrayId.push(internalid);
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


    function getCobertura(bien) {
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


    const aprobarVenta = (idRecord, htClient, bien, fechaInicial, monitoreo) => {
        var f = new Date();
        let parametro = 0;
        let parametrocambpropcobertura = 0;
        var valor_tipo_agrupacion = 0;
        var fechaActual = formatDateJson(f);
        fechaActual = "SH2PX" + fechaActual;
        log.debug('fechaInicial', fechaInicial);
        var fechainialtest = new Date(fechaInicial);
        var fechafinaltest = new Date(fechaInicial);
        fechafinaltest = fechafinaltest.setMonth(fechafinaltest.getMonth() + 12);
        fechafinaltest = new Date(fechafinaltest);
        log.debug('fechainialtest', fechainialtest);
        log.debug('fechafinaltest', fechafinaltest);
        var fechaInicialSplit = fechaInicial.split('/');
        var fechaInicialTelematic = fechaInicialSplit[2] + '-' + fechaInicialSplit[1] + '-' + fechaInicialSplit[0] + 'T00:00';
        //var fechaFinalSplit = fechaFinal.split('/');
        //var fechaFinalTelematic = fechaFinalSplit[2] + '-' + fechaFinalSplit[1] + '-' + fechaFinalSplit[0] + 'T00:00';
        let objRecord_salesorder = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
        let numLines = objRecord_salesorder.getLineCount({ sublistId: 'item' });
        let parametrosRespo;
        let returEjerepo = false;
        for (let i = 0; i < numLines; i++) {
            objRecord_salesorder.selectLine({ sublistId: 'item', line: i });
            let items = objRecord_salesorder.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
            parametrosRespo = _controller.parametrizacion(items);
            log.debug(parametrosRespo);
            if (parametrosRespo.length != 0) {
                for (let j = 0; j < parametrosRespo.length; j++) {
                    if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                        parametro = parametrosRespo[j][1];
                    }
                    if (parametrosRespo[j][0] == CAMBIO_PROPIETARIO_COBERTURA) {
                        parametrocambpropcobertura = parametrosRespo[j][1];
                    }
                    if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                        valor_tipo_agrupacion = parametrosRespo[j][1];
                    }
                }
            }
        }

        if (parametrocambpropcobertura == '18') {
            log.debug('parametrocambpropcobertura');
            record.submitFields({
                type: 'salesorder',
                id: idRecord,
                values: { 'custbody_ht_os_aprobacionventa': 1 },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });
            transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
            location.reload();
        } else {
            if (parametro != 0) {
                log.debug('entra plataformas');
                for (let j = 0; j < parametrosRespo.length; j++) {
                    if (parametrosRespo[j][0] == PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC&& parametro == '9') {
                        returEjerepo = _controller.parametros(ENVIO_PLATAFORMAS, idRecord, parametro);
                    }
                }
                //log.debug('returEjerepo', returEjerepo);

                if (returEjerepo == false) {
                    let idCoberturaItem;
                    let busqueda_cobertura = getCoberturaItem(bien);
                    log.debug('busqueda_cobertura', busqueda_cobertura);
                    if (busqueda_cobertura.length != 0) {
                        for (let i = 0; i < busqueda_cobertura.length; i++) {

                            let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                            if (parametrosRespo.length != 0) {
                                var accion_producto_2 = 0;
                                var valor_tipo_agrupacion_2 = 0;
                                for (let j = 0; j < parametrosRespo.length; j++) {

                                    if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                        valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                    }

                                    if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                                        idCoberturaItem = busqueda_cobertura[i][1];
                                    }

                                }
                            }
                        }
                    }
                    log.debug('monitoreo', monitoreo);
                    log.debug('htClient', htClient);
                    log.debug('bien', bien);
                    log.debug('idCoberturaItem', idCoberturaItem);
                    record.submitFields({
                        type: 'customrecord_ht_co_cobertura',
                        id: idCoberturaItem,
                        values: {
                            'custrecord_ht_co_clientemonitoreo': monitoreo,
                            'custrecord_ht_co_propietario': htClient
                        },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                    record.submitFields({
                        type: 'customrecord_ht_record_bienes',
                        id: bien,
                        values: { 'custrecord_ht_bien_propietario': htClient },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                    record.submitFields({
                        type: 'salesorder',
                        id: idRecord,
                        values: { 'custbody_ht_os_aprobacionventa': 1, 'orderstatus': 'B' },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                    log.debug('despues');
                    transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                }
            }
        }
    }


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
