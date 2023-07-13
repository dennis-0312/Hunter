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
    '../../Impulso Plataformas/Controller/TS_Script_Controller',
    'N/https'
], (log, record, search, serverWidget, plugin, transaction, _controller, _controllerParm, https) => {
    const HT_DETALLE_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_detalle_orden_servicio_2'; //HT Detalle Orden de Servicio - PRODUCCION
    const ORDEN_TRABAJO = '34';
    var TIPO_TRANSACCION = '2';
    var MONITOREO = '7';
    var CAMBIO_PROPIETARIO = '10';
    var SOLICITA_APROBACION = '11';
    var RENOVACION_PRODUCTO = '15';
    var ENVIO_PLATAFORMAS = '5';
    var SOLICITA_FACTURACION = '33';
    var TIPO_AGRUPACION_PRODUCTO = '77';
    
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
            var cobertura = '';
            var fechaInicial = '';
            var fechaFinal = '';
            let parametro = 0;
            let parametro_aprob = 0;
            for (let i = 0; i < numLines; i++) {
/*                 objRecord.selectLine({
                    sublistId: 'item',
                    line: i
                }); */
                let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i});
                log.debug('items', items);

                let parametrosRespo = _controllerParm.parametrizacion(items);
                for (let j = 0; j < parametrosRespo.length; j++) {
                    if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                        parametro = parametrosRespo[j][1];
                    }
                    if (parametrosRespo[j][0] == SOLICITA_APROBACION) {
                        parametro_aprob = parametrosRespo[j][1];
                    }
                }
                if (parametro_aprob == 9) {
                    var htClient = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: i });
                    log.debug('htClient', htClient);
                    var monitoreo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i });
                    log.debug('monitoreo', monitoreo);
                    bien = objRecord.getValue('custbody_ht_so_bien');
                    var fechaInicialItem = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cambio_fecha', line: i });
                    fechaInicial = new Date(fechaInicialItem);
                }
            }
            log.debug('parametro_aprob',parametro_aprob);
            log.debug('aprobacion_venta',aprobacion_venta);
            // if (parametro_aprob == 9 && aprobacion_venta == 2) {
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
                objRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });
                let cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });
                let items = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                let parametrosRespo = _controllerParm.parametrizacion(items);
                log.debug('parametrosRespo', parametrosRespo);
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
                    if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                        valor_tipo_agrupacion = parametrosRespo[j][1];
                    }
                    log.debug('parametrosRespo[j][0]', parametrosRespo[j][0]);
                    log.debug('parametrosRespo[j][1]', parametrosRespo[j][1]);
                    if (parametrosRespo[j][0] == SOLICITA_APROBACION) {
                        parametro_aprob = parametrosRespo[j][1];
                        log.debug('parametro_aprob1', parametro_aprob);
                    }
                    if (parametrosRespo[j][0] == SOLICITA_FACTURACION) {
                        parametro_fact = parametrosRespo[j][1];
                        log.debug('parametro_fact1', parametro_fact);
                    }
                    if (parametrosRespo[j][1] == RENOVACION_PRODUCTO) {
                        renovamos = true;
                        plazo += cantidad;
                    }
                    if (parametrosRespo[j][0] == ENVIO_PLATAFORMAS && parametrosRespo[j][1] == '9') {
                        plataformas = true;
                    }
                    if (parametrosRespo[j][0] == ORDEN_TRABAJO && parametrosRespo[j][1] == '9') {
                        let workOrder = _controllerParm.parametros(ORDEN_TRABAJO, json);
                        log.debug('OT ', workOrder);
                    }
                    if (parametrosRespo[j][0] ==   GENERA_VARIAS_ORDENES_TRABAJO && parametrosRespo[j][1] == '9') {
                        let workOrder = _controllerParm.parametros(ORDEN_TRABAJO, json);
                        log.debug('OT ', workOrder);
                    }
                }

            }
            log.debug('parametro_aprob', parametro_aprob);
            log.debug('parametro_fact', parametro_fact);
            if (parametro_aprob != 9 && parametro_fact == 18) {
                log.debug('cierra', idRecord);
                transaction.void({
                    type: 'salesorder',
                    id: idRecord
                });
            } else {
                if (parametro_aprob == 9) {
                    log.debug('parametro_aprob', parametro_aprob);
                    objRecord.setValue('orderstatus', 'A');
                    objRecord.setValue('custbody_ht_os_aprobacionventa', 2);
                }
                if (renovamos == true) {
                    var bien = objRecord.getValue('custbody_ht_so_bien');
                    /* var newInvoice = record.transform({
                        fromType: 'salesorder',
                        fromId: idRecord,
                        toType: 'invoice',
                        isDynamic: true
                    });
                    newInvoice.setValue({
                        fieldId: 'custbodyts_ec_tipo_documento_fiscal',
                        value: 4
                    });
                    newInvoice.setValue({
                        fieldId: 'custbody_ts_ec_serie_cxc',
                        value: 1
                    });
                    newInvoice.setValue({
                        fieldId: 'billdate',
                        value: fechaActual
                    });
                    var idInvoice = newInvoice.save(); */
                    //log.debug('idInvoice', idInvoice);
                    var idCoberturaItem;
                    let busqueda_cobertura = getCoberturaItem(bien);
                    log.debug('busqueda_cobertura',busqueda_cobertura);
                    if (busqueda_cobertura.length != 0) {
                        for (let i = 0; i < busqueda_cobertura.length; i++) {
    
                            let parametrosRespo = _controllerParm.parametrizacion(busqueda_cobertura[i][0]);
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
                    //var idCobertura = getCobertura(bien);
                    let vehiculo = search.lookupFields({
                        type: 'customrecord_ht_record_bienes',
                        id: bien,
                        columns: ['custrecord_ht_bien_id_telematic']
                    });
                    //log.debug('idCobertura.length', idCobertura.length);
                    //for (let i = 0; i < idCobertura.length; i++) {
                        //log.debug('idDispositivo[i][0]', idCobertura[i][0]);
                        var cobertura = search.lookupFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: idCoberturaItem,
                            columns: ['custrecord_ht_co_coberturainicial','custrecord_ht_co_coberturafinal', 'custrecord_ht_co_numeroserieproducto', 'custrecord_ht_co_plazo']
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
                        log.debug('HOY',hoy);
                        log.debug('newDateInicial',newDateInicial);
                        log.debug('newDateAntigua',newDateAntigua);
                        
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
                            if(newDateAntigua < hoy){
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
                            }else{
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
                    //}

                }
                if (objRecord.getValue('custbody_ht_os_issue_invoice') == true) {
                    let invoice = _controller.createInvoice(objRecord.id);
                    log.debug('Invoice', invoice);
                }
                objRecord.save({ ignoreMandatoryFields: true, enableSourcing: false });
            }
            /* if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                 const objRecord = scriptContext.newRecord;
                 try {
                     let customer = objRecord.getValue({ fieldId: 'entity' });
                     
                     let idOs = objRecord.id;
                     let objSearch = search.load({ id: HT_DETALLE_ORDEN_SERVICIO_SEARCH });
                     let filters = objSearch.filters;
                     const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: objRecord.id });
                     filters.push(filterOne);
                     let result = objSearch.run().getRange({ start: 0, end: 10 });
                    
                     for (let i in result) {
                         let json = new Array();
                         let items = result[i].getValue({ name: "internalid", join: "item", summary: "GROUP" });
                         let ordenServicio = result[i].getValue({ name: "tranid", summary: "GROUP" });
     
                      
                         
     
                     }
     
                    
     
     
     
     
                 } catch (error) {
                     log.error('Error-afterSubmit', error);
                 }
             }*/
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
    
    function getCoberturaItem(idBien) {
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
            var savedsearch = busqueda.run().getRange(0, 100);
            var internalidItem = '';
            var internalid = '';
            var arrayIdTotal = [];
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    var arrayId = [];
                    internalidItem = result.getValue(busqueda.columns[0]);
                    arrayId.push(internalidItem);
                    internalid = result.getValue(busqueda.columns[1]);
                    arrayId.push(internalid);
                    arrayIdTotal.push(arrayId);
                    return true;
                });
            }
            return arrayIdTotal;
        } catch (e) {
            log.error('Error en getCoberturaItem', e);
        }
    }

    function getDescription(entity, item) {
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




    return {
        beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
