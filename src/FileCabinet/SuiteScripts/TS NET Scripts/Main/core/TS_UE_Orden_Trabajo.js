/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_UE_Orden_Trabajo.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/transaction', 'N/config', 'N/log', 'N/search', 'N/record', 'N/ui/serverWidget', 'N/https', 'N/error', '../../Impulso Plataformas/Controller/TS_Script_Controller'],
    (transaction, config, log, search, record, serverWidget, https, error, _Controller) => {
        const HT_DETALLE_ORDEN_SERVICIO = 'customsearch_ht_detalle_orden_servicio'; //HT Detalle Orden de Servicio - PRODUCCION
        const HT_CONSULTA_ORDEN_TRABAJO = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
        const tipo_servicio_alquiler = 1;
        const tipo_servicio_chequeo = 3;
        const tipo_servicio_demo = 4;
        const TIPO_SERVICIO_DESINSTALACION = 5;
        var TIPO_TRANSACCION = '2';
        const URL_DETALLE_SEARCH = '/app/common/search/searchresults.nl?searchid=' //+####&whence=
        const tipo_devolucion = 6;
        const tipo_garantia = 7;
        const tipo_renovacion_cobertura = 8;
        const tipo_upgrade = 9;
        const TIPO_VENTA = 10;
        const CONVENIO = 12;
        const ESTADO_CHEQUEADA = 2;
        const ENVIO_PLATAFORMASPX = 36;
        const ENVIO_PLATAFORMASTELEC = 38;
        const TYPE_REGISTRO = 'ORDEN_TRABAJO'
        const HABILITAR_LOG_SEGUIMIENTO = 1;
        const HABILITAR_LOG_VALIDACION = 1;
        var INST_DISPOSITIVO = '43';
        var TIPO_AGRUPACION_PRODUCTO = '77';
        var VENT_SERVICIOS = '50';
        const beforeLoad = (context) => {
            let configRecObj = config.load({ type: config.Type.COMPANY_INFORMATION });
            const URL = configRecObj.getValue({ fieldId: 'appurl' });
            let objRecord = context.newRecord;
            let id = context.newRecord.id;
            var form = context.form;
            var type_event = context.type;

            if (type_event == context.UserEventType.VIEW) {
                let idOrdenTrabajo = objRecord.getValue('custrecord_ht_ot_ordenfabricacion');
                let estado = objRecord.getValue('custrecord_ht_ot_estado');
                if (estado == 4) {
                    form.addButton({
                        id: 'custpage_ts_fabricarproducto',
                        label: 'Ensamble de Dispositivo',
                        functionName: 'ensambleDispositivo(' + idOrdenTrabajo + ')'
                    });
                    form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';

                }

                form.getField('custrecord_ht_ot_termometro').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                /*var btnStockAlquiler = form.addButton({
                    id: 'custpage_lh_btn_alquiler',
                    label: "Stock Alquiler",
                    functionName: 'reloadFuncion(' + URL + URL_DETALLE_SEARCH + ')'
                });
                var btnStockComercial = form.addButton({
                    id: 'custpage_lh_btn_comercial',
                    label: "Stock Comercial",
                    functionName: 'reloadFuncion(' + URL + URL_DETALLE_SEARCH + ')'
                });
                var btnStockMateriales = form.addButton({
                    id: 'custpage_lh_btn_material',
                    label: "Lista Materiales",
                    functionName: 'reloadFuncion(1)'
                });*/

            }
            var items = objRecord.getValue('custrecord_ht_ot_item');
            /*let itemsrelacionado = record.load({ type: 'serializedassemblyitem', id: items });
            var numLines = itemsrelacionado.getLineCount({ sublistId: 'recmachcustrecord_ht_pp_parametrizacionir' });
            for (let i = 0; i < numLines; i++) {
                let codigo = itemsrelacionado.getSublistValue({ sublistId: 'recmachcustrecord_ht_pp_parametrizacionir', fieldId: 'custrecord_ht_pp_codigoit', line: i });
                if (codigo == "11278") {
                    items = itemsrelacionado.getSublistValue({ sublistId: 'recmachcustrecord_ht_pp_parametrizacionir', fieldId: 'custrecord_ht_pp_descripcionit', line: i });

                }
            }*/
            let updateOrdenTrabajo = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            updateOrdenTrabajo.getField("custrecord_ht_ot_noimpulsaplataformas").isDisabled = true;
            updateOrdenTrabajo.setValue({ fieldId: 'custrecord_ht_ot_itemrelacionado', value: items })
            updateOrdenTrabajo.save();
        }


        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.EDIT) {
                let objRecord = context.newRecord;
                let accionEstadoOT = 'Sin estado';
                let id = context.newRecord.id;
                let Origen;
                let arr = [];
                let plataformasPX;
                let plataformasTele;
                let adp;
                let adpServicio = 0;
                let estaChequeada = objRecord.getValue('custrecord_ht_ot_estado');
                if (estaChequeada > 0) {
                    accionEstadoOT = ESTADO_CHEQUEADA;

                }

                switch (accionEstadoOT) {
                    case ESTADO_CHEQUEADA:
                        let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                        let bien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                        let coberturas = _Controller.getCobertura(bien);
                        let busqueda_salesorder = getSalesOrderItem(bien);
                        log.debug('busqueda_salesorder', busqueda_salesorder);
                        let busqueda_cobertura = getCoberturaItem(bien);

                        let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
                        var numLines = salesorder.getLineCount({ sublistId: 'item' });
                        let chaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                        let idItemOT = objRecord.getValue('custrecord_ht_ot_item');
                        var cantidad = 0;
                        let returEjerepo = true;
                        let parametrosRespo;
                        var parametro_salesorder = 0;
                        var arrayItemOT = [];
                        var arrayID = [];
                        var arrayTA = [];
                        let TTR_name = '';
                        var valor_tipo_agrupacion_2 = 0;
                        var idOS;
                        var TAG;
                        var envioPX = 0;
                        var envioTele = 0;
                        var idItem;
                        let parametrosRespo_2 = _Controller.parametrizacion(idItemOT);
                        let monitoreo;
                        let idCoberturaItem = '';
                        if (parametrosRespo_2.length != 0) {
                            //var accion_producto_2 = 0;
                            for (let j = 0; j < parametrosRespo_2.length; j++) {
                                if (parametrosRespo_2[j][0] == 2) {
                                    adp = parametrosRespo_2[j][1];
                                }
                                if (parametrosRespo_2[j][0] == 8) { // TTR tipo de transaccion
                                    let parametro = record.load({ type: 'customrecord_ht_cr_pp_valores', id: parametrosRespo_2[j][1], isDynamic: true });
                                    TTR_name = parametro.getValue('custrecord_ht_pp_descripcion');
                                }
                                if (parametrosRespo_2[j][0] == ENVIO_PLATAFORMASPX) {
                                    envioPX = parametrosRespo_2[j][1];
                                }
                                if (parametrosRespo_2[j][0] == ENVIO_PLATAFORMASTELEC) {
                                    envioTele = parametrosRespo_2[j][1];
                                }
                                if (parametrosRespo_2[j][0] == 99 && parametrosRespo_2[j][1] == 9) { //cos cerrar orden de servicio

                                    try {
                                        transaction.void({ type: 'salesorder', id: idSalesorder });
                                    } catch (error) {
                                        log.debug(error);
                                    }

                                }
                                if (parametrosRespo_2[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                    valor_tipo_agrupacion_2 = parametrosRespo_2[j][1];
                                }

                            }
                        }

                        if (busqueda_salesorder.length != 0) {
                            for (let i = 0; i < busqueda_salesorder.length; i++) {

                                let parametrosRespo = _Controller.parametrizacion(busqueda_salesorder[i][0]);
                                if (parametrosRespo.length != 0) {
                                    var accion_producto = 0;
                                    var valor_tipo_agrupacion = 0;

                                    for (let j = 0; j < parametrosRespo.length; j++) {


                                        if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                                            accion_producto = parametrosRespo[j][1];
                                        }

                                        if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                            valor_tipo_agrupacion = parametrosRespo[j][1];
                                        }



                                        if (accion_producto == VENT_SERVICIOS && valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                                            adpServicio = accion_producto;
                                            idOS = busqueda_salesorder[i][1];
                                            plataformasPX = envioPX;
                                            plataformasTele = envioTele;
                                            idItem = busqueda_salesorder[i][0];
                                        }

                                    }
                                }
                            }
                        }

                        if (parametrosRespo_2.length != 0) {
                            var accion_producto_2 = 0;
                            for (let j = 0; j < parametrosRespo_2.length; j++) {
                                if (parametrosRespo_2[j][0] == 2) {
                                    adp = parametrosRespo_2[j][1];
                                }
                                if (parametrosRespo_2[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                    valor_tipo_agrupacion_2 = parametrosRespo_2[j][1];
                                }
                            }
                        }

                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {

                                let parametrosRespo = _Controller.parametrizacion(busqueda_cobertura[i][0]);
                                if (parametrosRespo.length != 0) {
                                    var accion_producto = 0;
                                    var valor_tipo_agrupacion = 0;
                                    var envio = 0;
                                    for (let j = 0; j < parametrosRespo.length; j++) {

                                        if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                                            accion_producto = parametrosRespo[j][1];
                                        }

                                        if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                            valor_tipo_agrupacion = parametrosRespo[j][1];
                                        }

                                        if (accion_producto == INST_DISPOSITIVO && valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                                            idCoberturaItem = busqueda_cobertura[i][1];
                                        }

                                    }
                                }
                            }
                        }

                        if (idOS) {
                            var serviceOS = record.load({ type: 'salesorder', id: idOS });
                            var numLines_2 = serviceOS.getLineCount({ sublistId: 'item' });
                            for (let j = 0; j < numLines_2; j++) {
                                let items = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                                monitoreo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                                var itemMeses = idItemType(items);
                                if (itemMeses == 1) {
                                    let quantity = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j });
                                    cantidad = cantidad + quantity;
                                }

                                if (plataformasPX == 9) {
                                    returEjerepo = _Controller.parametros(ENVIO_PLATAFORMASPX, id, adp);
                                    log.debug('Estado que devuelve el impulso a plataforma PX- ' + j, returEjerepo + ': ' + returEjerepo);
                                } else {
                                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                    updateTelematic.save();
                                }
                                if (plataformasTele == 9) {
                                    returEjerepo = _Controller.parametros(ENVIO_PLATAFORMASTELEC, id, adp);
                                    log.debug('Estado que devuelve el impulso a plataforma tele- ' + j, returEjerepo + ': ' + returEjerepo);
                                } else {
                                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                    updateTelematic.save();
                                }
                            }
                        }
                        //var itemMeses = idItemType(items);
                        for (let i = 0; i < numLines; i++) {
                            //let items = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                            //let type = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                            Origen = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen', line: i });

                            //parametrosRespo = _Controller.parametrizacion(items);
                            //var itemMeses = idItemType(items);
                            // if (type == 'Service') {
                            //     /* if (parametrosRespo.length != 0) {
                            //         for (let j = 0; j < parametrosRespo.length; j++) {
                            //             if (parametrosRespo[j][0] == 2) {
                            //                 adpServicio = parametrosRespo[j][1];
                            //             }
                            //             if (parametrosRespo[j][0] == ENVIO_PLATAFORMAS) {
                            //                 plataformas = parametrosRespo[j][1];
                            //             }
                            //         }
                            //     } */
                            // } else {
                            //     if (parametrosRespo.length != 0) {
                            //         for (let j = 0; j < parametrosRespo.length; j++) {
                            //             if (parametrosRespo[j][0] == 2) {
                            //                 adp = parametrosRespo[j][1];
                            //             }
                            //         }
                            //     }
                            // }


                        }

                        let cobertura = getCobertura(cantidad);
                        record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: objRecord.getValue('custrecord_ht_ot_orden_servicio'),
                            values: {
                                'custbody_ht_os_trabajado': 'S'
                            }
                        });
                        let idItemCobertura = objRecord.getValue('custrecord_ht_ot_item');
                        let idVentAlq = objRecord.getValue('custrecord_ht_ot_item_vent_alq');
                        if (idVentAlq != '') {
                            idItemCobertura = idVentAlq;
                        }
                        var activacion = 16;
                        var instalacion_activacion = 17;
                        var instalacion = 15;
                        //log.debug('Debug1', returEjerepo + ' - ' + adpServicio);
                        if (returEjerepo && adpServicio != 0) {
                            if (idOS == idSalesorder) {
                                //log.debug('Debug2', returEjerepo + ' - ' + adpServicio);
                                let json = {
                                    bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                    propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                    start: cobertura.coberturaInicial,
                                    plazo: cantidad,
                                    end: cobertura.coberturaFinal,
                                    estado: 1,
                                    concepto: instalacion_activacion,
                                    producto: idItemCobertura,
                                    serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                    salesorder: idSalesorder,
                                    ordentrabajo: objRecord.id,
                                    monitoreo: monitoreo,
                                    cobertura: idCoberturaItem
                                }
                                cabertura(json);
                                let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: 1 })
                                updateTelematic.save();
                            } else {
                                //log.debug('Debug3', returEjerepo + ' - ' + adpServicio);
                                let json = {
                                    bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                    propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                    start: cobertura.coberturaInicial,
                                    plazo: cantidad,
                                    end: cobertura.coberturaFinal,
                                    estado: 1,
                                    concepto: activacion,
                                    producto: idItemCobertura,
                                    serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                    salesorder: idOS,
                                    ordentrabajo: objRecord.id,
                                    monitoreo: monitoreo,
                                    cobertura: idCoberturaItem
                                }
                                cabertura(json);
                                let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: 1 })
                                updateTelematic.save();
                            }
                        } else {
                            //log.debug('Debug4', returEjerepo + ' - ' + adpServicio);
                            let json = {
                                bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                producto: idItemCobertura,
                                concepto: instalacion,
                                serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                salesorder: idSalesorder,
                                ordentrabajo: objRecord.id,
                                cobertura: idCoberturaItem
                            }
                            cabertura(json);
                            let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                            updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: 1 })
                            updateTelematic.save();
                            record.submitFields({
                                type: 'customrecord_ht_record_ordentrabajo',
                                id: id,
                                values: { 'custrecord_ht_ot_estado': 4 },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }

                        if (adpServicio == 21) {
                            var customrecord_ht_ct_cobertura_transactionSearchObj = search.create({
                                type: "customrecord_ht_ct_cobertura_transaction",
                                filters:
                                    [
                                        ["custrecord_ht_ct_orden_servicio", "anyof", Origen]
                                    ],
                                columns:
                                    [
                                        search.createColumn({
                                            name: "scriptid",
                                            sort: search.Sort.ASC,
                                            label: "Script ID"
                                        }),
                                        search.createColumn({ name: "custrecord_ht_ct_orden_servicio", label: "HT Orden Servicio" }),
                                        search.createColumn({ name: "custrecord_ht_ct_orden_trabajo", label: "HT Orden de Trabajo" }),
                                        search.createColumn({ name: "custrecord_ht_ct_concepto", label: "HT Concepto" }),
                                        search.createColumn({ name: "custrecord_ht_ct_fecha_inicial", label: "HT Fecha Inicial" }),
                                        search.createColumn({ name: "custrecord_ht_ct_fecha_final", label: "HT Fecha Final" }),
                                        search.createColumn({ name: "custrecord_ht_ct_transacciones", label: "HT Cobertura" })
                                    ]
                            });
                            var pageData = customrecord_ht_ct_cobertura_transactionSearchObj.runPaged({
                                pageSize: 1000
                            });
                            pageData.pageRanges.forEach(function (pageRange) {
                                page = pageData.fetch({
                                    index: pageRange.index
                                });

                                page.data.forEach(function (result) {
                                    var columns = result.columns;


                                    let updateTelematic = record.load({ type: 'customrecord_ht_co_cobertura', id: result.getValue(columns[5]) });
                                    updateTelematic.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: 2 })
                                    updateTelematic.save();


                                });
                            });
                        }


                        if (adp == 43) {
                            let estado = objRecord.getValue('custrecord_ht_ot_estado');
                            let idSalesOrder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                            let dispositivo = objRecord.getValue('custrecord_ht_ot_dispositivo');
                            let boxserie = objRecord.getValue('custrecord_ht_ot_boxserie');
                            var fulfill = '';
                            if (dispositivo != '') {
                                fulfill = dispositivo;
                            } else {
                                fulfill = boxserie;
                            }


                            var idDispositivo = getInventoryNumber(fulfill);

                            var estadoSalesOrder = getSalesOrder(idSalesOrder);

                            if (estado == 2 && (estadoSalesOrder == 'pendingFulfillment' || estadoSalesOrder == 'partiallyFulfilled') && idDispositivo) {
                                var serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                var ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                                record.submitFields({
                                    type: 'customrecord_ht_record_mantchaser',
                                    id: serieProducto,
                                    values: { 'custrecord_ht_mc_ubicacion': ubicacion },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                var newFulfill = record.transform({
                                    fromType: record.Type.SALES_ORDER,
                                    fromId: idSalesOrder,
                                    toType: record.Type.ITEM_FULFILLMENT
                                });
                                var numLines = newFulfill.getLineCount({ sublistId: 'item' });
                                for (let i = 0; i < numLines; i++) {
                                    newFulfill.setSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1, line: i });
                                    var objSubRecord = newFulfill.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: 0 })
                                    objSubRecord.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: idDispositivo, line: 0 });;
                                    objSubRecord.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1, line: 0 });

                                }
                                newFulfill.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                });

                            }
                        }

                        if (adp = 44) { // chequeo 006 mantenimiento 
                            let objRecordCreateServicios = record.create({ type: 'customrecord_ht_nc_servicios_instalados', isDynamic: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_bien_si', value: objRecord.getValue('custrecord_ht_ot_vehiculo'), ignoreFieldChange: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_servicio_si', value: idSalesorder, ignoreFieldChange: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_trabajo', value: id, ignoreFieldChange: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_servicio', value: TTR_name, ignoreFieldChange: true });
                            objRecordCreateServicios.save();
                        }
                        break;
                    default:
                }




            }
        }

        //const envioPXAdmin = () => { }

        function getSalesOrderItem(idBien) {
            try {
                var busqueda = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["custbody_ht_so_bien", "anyof", idBien],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["formulatext: CASE WHEN {item} = 'S-EC'  THEN 0 ELSE 1 END", "is", "1"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "item",
                                summary: "GROUP",
                                label: "Item"
                            }),
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "Internal ID"
                            })
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
                log.error('Error en getSalesOrder', e);
            }
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

        const cabertura = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ts_rs_integration_plataform',
                scriptId: 'customscript_ts_rs_integration_plataform',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
        }

        function getInventoryNumber(inventorynumber) {
            try {
                var busqueda = search.create({
                    type: "inventorynumber",
                    filters:
                        [
                            ["inventorynumber", "is", inventorynumber],
                            "AND",
                            ["quantityavailable", "equalto", "1"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 1);
                var idInventoryNumber = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        idInventoryNumber = result.getValue(busqueda.columns[0]);
                        return true;
                    });
                }
                return idInventoryNumber;
            } catch (e) {
                log.error('Error en getInventoryNumber', e);
            }
        }

        const idItemType = (id) => {
            try {
                var busqueda = search.create({
                    type: "serviceitem",
                    filters:
                        [
                            ["type", "anyof", "Service"],
                            "AND",
                            ["unitstype", "anyof", "6"],
                            "AND",
                            ["internalid", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 1);
                var idType = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        idType = 1
                        return true;
                    });
                }
                return idType;
            } catch (e) {
                log.error('Error en getRepresentante', e);
            }
        }

        const getSalesOrder = (id) => {
            try {
                var busqueda = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["internalid", "anyof", id],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "statusref", label: "Status" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 1);
                var estado = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        estado = result.getValue(busqueda.columns[0]);
                        return true;
                    });
                }

                return estado;
            } catch (e) {
                log.error('Error en estadoSalesOrder', e);
            }
        }

        const getCobertura = (cantidad) => {
            try {

                let date = new Date();

                date.setDate(date.getDate());
                let date_final = new Date();
                date_final.setDate(date_final.getDate());
                date_final.setMonth(date_final.getMonth() + cantidad);
                date_final = new Date(date_final);
                return {
                    coberturaInicial: date,
                    coberturaFinal: date_final
                };

            } catch (e) {

            }

        }

        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        }
    });




/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 12/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
/*********************************************************************************************************************************************
Commit:02
Version: 1.0
Date: 15/12/2022
Author: Dennis Fernández
Description: Aplicación de evento EDIT.
==============================================================================================================================================*/
/*********************************************************************************************************************************************
Commit:03
Version: 1.0
Date: 23/03/2023
Author: Jeferson Mejia
Description: Se juntaron los scritps de Orden de Trabajo
==============================================================================================================================================*/
























