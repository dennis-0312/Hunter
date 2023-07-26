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
define([
    'N/transaction',
    'N/config',
    'N/log',
    'N/search',
    'N/record',
    'N/ui/serverWidget',
    'N/https',
    'N/error',
    'N/format',
    'N/email',
    'N/runtime',
    '../controller/TS_CM_Controller'
],
    (transaction, config, log, search, record, serverWidget, https, error, format, email, runtime, _Controller) => {
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
        const VALOR_001_INST_DISPOSITIVO = 43;
        const SI = 9;
        const ESTADO_001_INSTALADO = 1;
        const CHEQUEADO = 2;
        //^BLOQUE PARAMETROS ===================================================================
        const ADP_ACCION_DEL_PRODUCTO = 2
        const VALOR_010_CAMBIO_PROPIETARIO = 10;
        const PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC = 5
        const TTR_TIPO_TRANSACCION = 8;
        const CAMB_MOV_CUSTODIA = 131;
        const CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS = 21;
        const VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO = 44;
        const TAG_TIPO_AGRUPACION_PRODUCTO = 77;
        const TCH_TIPO_CHEQUEO_OT = 6;
        const VALOR_001_CHEQUEO_H_LOJACK = 105;
        const VALOR_002_DESINSTALACION_DE_DISP = 21;
        const ALQUILER_PARAM = 13;
        const COS_CIERRE_DE_ORDEN_DE_SERVICIO = 99;
        const DISPONIBLE = 5;
        const INACTIVO = 5;
        const INSTALADO = 1;
        const PROCESANDO = 4


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
                }
                form.getField('custrecord_ht_ot_termometro').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                createEnsambleAlquilerButton(form, objRecord);
                form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';
            } else if (type_event == context.UserEventType.EDIT) {
                createEnsambleAlquilerButton(form, objRecord);
                form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';
            }
        }

        const createEnsambleAlquilerButton = (form, objRecord) => {
            let itemName = objRecord.getText('custrecord_ht_ot_item') || "";
            itemName = itemName.toLowerCase()
            if (!itemName.includes('alq')) return;
            let salesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let workorder = objRecord.id;
            let customer = objRecord.getValue('custrecord_ht_ot_cliente_id');
            let item = objRecord.getValue('custrecord_ht_ot_item');
            let location = "";
            if (salesorder) {
                locationSearch = search.lookupFields({
                    type: 'salesorder', id: salesorder, columns: ['location']
                });
                location = locationSearch.location[0].value;
            }

            const ensambleAlquiler = `ensambleAlquiler('${item}', '${location}', '${workorder}', '${salesorder}', '${customer}')`;
            form.addButton({ id: 'custpage_btnalquiler', label: 'Ensamble Alquiler', functionName: ensambleAlquiler });
        }

        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.EDIT) {
                let senderId = runtime.getCurrentUser();
                senderId = senderId.id;
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
                let statusOri = estaChequeada;
                let estadoInts;
                let ingresaFlujoAlquiler;
                const SI = 9;
                var serieProductoChaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                log.debug('serieProductoChaser', serieProductoChaser);

                if (estaChequeada > 0) {
                    accionEstadoOT = ESTADO_CHEQUEADA;
                }

                //log.debug('accionEstadoOT', accionEstadoOT);

                switch (accionEstadoOT) {
                    case ESTADO_CHEQUEADA:
                        let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                        let valueSalesorder = objRecord.getText('custrecord_ht_ot_orden_servicio');
                        let bien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                        let valuebien = objRecord.getText('custrecord_ht_ot_vehiculo');
                        let coberturas = _Controller.getCobertura(bien);
                        let busqueda_salesorder = getSalesOrderItem(bien);
                        //log.debug('busqueda_salesorder', busqueda_salesorder);
                        let busqueda_cobertura = getCoberturaItem(bien);
                        let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
                        var numLines = salesorder.getLineCount({ sublistId: 'item' });
                        let chaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                        let idItemOT = objRecord.getValue('custrecord_ht_ot_item');
                        let conNovedad = objRecord.getValue('custrecord_ht_ot_connovedad');
                        let serieChaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                        let estadoChaser = objRecord.getValue('custrecord_ht_ot_estadochaser');
                        let recipientId = objRecord.getValue('custrecord_ht_ot_cliente_id');
                        let customer = objRecord.getText('custrecord_ht_ot_cliente_id');
                        let comentario = objRecord.getText('custrecord_ht_ot_observacion');
                        ingresaFlujoAlquiler = objRecord.getValue('custrecord_flujo_de_alquiler');
                        let taller = objRecord.getValue('custrecord_ht_ot_taller');
                        let comercial = objRecord.getText('custrecord_ht_ot_serieproductoasignacion');

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
                        let precio = 0;
                        let esAlquiler = 0;
                        let objParams = new Array();
                        let adpAlquiler = 0;

                        let recordTaller = search.lookupFields({
                            type: 'customrecord_ht_tt_tallertablet',
                            id: taller,
                            columns: ['custrecord_ht_tt_oficina']
                        });
                        let location = recordTaller.custrecord_ht_tt_oficina[0].value;

                        let objParameters = {
                            serieChaser: serieChaser,
                            bien: bien
                        }
                        let itemInstallId = _Controller.getInstall(objParameters);

                        objParams = {
                            location: location,
                            comercial: comercial,
                            customer: customer,
                            salesorder: idSalesorder,
                            item: itemInstallId,
                            boleano: false,
                            serieChaser: serieChaser,
                            ordentrabajoId: id,
                            recipientId: recipientId,
                            bien: bien
                        }

                        for (let i = 0; i < numLines; i++) {
                            precio = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                        }

                        if (parametrosRespo_2.length != 0) {
                            //var accion_producto_2 = 0;
                            for (let j = 0; j < parametrosRespo_2.length; j++) {
                                if (parametrosRespo_2[j][0] == ADP_ACCION_DEL_PRODUCTO) {
                                    adp = parametrosRespo_2[j][1];
                                }
                                if (parametrosRespo_2[j][0] == TTR_TIPO_TRANSACCION) { // TTR tipo de transaccion
                                    let parametro = record.load({ type: 'customrecord_ht_cr_pp_valores', id: parametrosRespo_2[j][1], isDynamic: true });
                                    TTR_name = parametro.getValue('custrecord_ht_pp_descripcion');
                                }
                                if (parametrosRespo_2[j][0] == ENVIO_PLATAFORMASPX) {
                                    envioPX = parametrosRespo_2[j][1];
                                }
                                if (parametrosRespo_2[j][0] == ENVIO_PLATAFORMASTELEC) {
                                    envioTele = parametrosRespo_2[j][1];
                                }
                                if (parametrosRespo_2[j][0] == COS_CIERRE_DE_ORDEN_DE_SERVICIO && parametrosRespo_2[j][1] == SI) { //cos cerrar orden de servicio
                                    try {
                                        if (precio == 0)
                                            transaction.void({ type: 'salesorder', id: idSalesorder });
                                    } catch (error) {
                                        log.error('Error', error + ', ya está cerrada la Orden de Servicio');
                                    }
                                }
                                if (parametrosRespo_2[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                    valor_tipo_agrupacion_2 = parametrosRespo_2[j][1];
                                }

                                if (parametrosRespo_2[j][0] == ADP_ACCION_DEL_PRODUCTO) {
                                    adpServicio = parametrosRespo_2[j][1];
                                    adpAlquiler = adpServicio
                                }

                                if (parametrosRespo_2[j][0] == ALQUILER_PARAM) {
                                    esAlquiler = parametrosRespo_2[j][1];
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

                                        if (accion_producto == VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                            idOS = busqueda_salesorder[i][1];
                                        }

                                    }
                                }
                            }
                        }

                        if (parametrosRespo_2.length != 0) {
                            var accion_producto_2 = 0;
                            for (let j = 0; j < parametrosRespo_2.length; j++) {
                                if (parametrosRespo_2[j][0] == ADP_ACCION_DEL_PRODUCTO) {
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
                                            estadoInts = ESTADO_001_INSTALADO
                                        }
                                    }
                                }
                            }
                        }

                        // log.debug('idOS', idOS)
                        if (idOS) {
                            // log.debug('idOSIntro', idOS)
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

                                if (plataformasPX == SI) {
                                    returEjerepo = _Controller.parametros(ENVIO_PLATAFORMASPX, id, adp);
                                    log.debug('Estado que devuelve el impulso a plataforma PX- ' + j, JSON.stringify(returEjerepo) + ': ' + JSON.stringify(returEjerepo));
                                } else {
                                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                    updateTelematic.save();
                                }
                                if (plataformasTele == SI) {
                                    returEjerepo = _Controller.parametros(ENVIO_PLATAFORMASTELEC, id, adp);
                                    log.debug('Estado que devuelve el impulso a plataforma tele- ' + j, JSON.stringify(returEjerepo) + ': ' + JSON.stringify(returEjerepo));
                                } else {
                                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                    updateTelematic.save();
                                }
                            }
                        }

                        for (let i = 0; i < numLines; i++) {
                            Origen = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen', line: i });
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
                        log.debug('Prodcuto', idItemCobertura)
                        let idVentAlq = objRecord.getValue('custrecord_ht_ot_item_vent_alq');
                        if (idVentAlq != '') {
                            idItemCobertura = idVentAlq;
                        }
                        var activacion = 16;
                        var instalacion_activacion = 17;
                        var instalacion = 15;
                        estadoInts = 1 //Instalado
                        log.debug('Debug1', returEjerepo + ' - ' + adpAlquiler);
                        if (adpAlquiler != VALOR_002_DESINSTALACION_DE_DISP) {
                            if (returEjerepo && adpServicio != 0) {
                                if (idOS == idSalesorder) {
                                    log.debug('MONITOREOOOOOO', 'Cobertura1');
                                    // log.debug('ESTADOOOOOOOOO', estadoInts);
                                    // log.debug('Debug2', returEjerepo + ' - ' + adpServicio);
                                    let json = {
                                        bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                        propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                        start: cobertura.coberturaInicial,
                                        plazo: cantidad,
                                        end: cobertura.coberturaFinal,
                                        estado: estadoInts,
                                        concepto: instalacion_activacion,
                                        producto: idItemCobertura,
                                        serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                        salesorder: idSalesorder,
                                        ordentrabajo: objRecord.id,
                                        monitoreo: monitoreo,
                                        cobertura: idCoberturaItem,
                                    }
                                    createCoberturaWS(json);
                                    if (chaser.length > 0) {
                                        let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                        updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: INSTALADO })
                                        updateTelematic.save();
                                    }
                                } else {
                                    log.debug('MONITOREOOOOOO', 'Cobertura2');
                                    // log.debug('Debug3', returEjerepo + ' - ' + adpServicio);
                                    let json = {
                                        bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                        propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                        start: cobertura.coberturaInicial,
                                        plazo: cantidad,
                                        end: cobertura.coberturaFinal,
                                        estado: estadoInts,
                                        concepto: activacion,
                                        producto: idItemCobertura,
                                        serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                        salesorder: idOS,
                                        ordentrabajo: objRecord.id,
                                        monitoreo: monitoreo,
                                        cobertura: idCoberturaItem,
                                    }
                                    createCoberturaWS(json);
                                    if (chaser.length > 0) {
                                        let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                        updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: INSTALADO })
                                        updateTelematic.save();
                                    }
                                }
                            } else {
                                if (adpServicio != VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                    // log.debug('Debug4', returEjerepo + ' - ' + adpServicio);
                                    log.debug('MONITOREOOOOOO', 'Cobertura3');
                                    let json = {
                                        bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                        propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                        producto: idItemCobertura,
                                        concepto: instalacion,
                                        serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                        salesorder: idSalesorder,
                                        ordentrabajo: objRecord.id,
                                        cobertura: idCoberturaItem,
                                        estado: estadoInts
                                    }
                                    createCoberturaWS(json);
                                    if (chaser.length > 0) {
                                        let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                        updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: INSTALADO })
                                        updateTelematic.save();
                                        record.submitFields({ type: 'customrecord_ht_record_ordentrabajo', id: id, values: { 'custrecord_ht_ot_estado': PROCESANDO }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                    }
                                }
                            }
                        }

                        if (adpServicio == CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS) {
                            var customrecord_ht_ct_cobertura_transactionSearchObj = search.create({
                                type: "customrecord_ht_ct_cobertura_transaction",
                                filters:
                                    [
                                        ["custrecord_ht_ct_orden_servicio", "anyof", Origen]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "scriptid", sort: search.Sort.ASC, label: "Script ID" }),
                                        search.createColumn({ name: "custrecord_ht_ct_orden_servicio", label: "HT Orden Servicio" }),
                                        search.createColumn({ name: "custrecord_ht_ct_orden_trabajo", label: "HT Orden de Trabajo" }),
                                        search.createColumn({ name: "custrecord_ht_ct_concepto", label: "HT Concepto" }),
                                        search.createColumn({ name: "custrecord_ht_ct_fecha_inicial", label: "HT Fecha Inicial" }),
                                        search.createColumn({ name: "custrecord_ht_ct_fecha_final", label: "HT Fecha Final" }),
                                        search.createColumn({ name: "custrecord_ht_ct_transacciones", label: "HT Cobertura" })
                                    ]
                            });
                            var pageData = customrecord_ht_ct_cobertura_transactionSearchObj.runPaged({ pageSize: 1000 });
                            pageData.pageRanges.forEach(pageRange => {
                                page = pageData.fetch({
                                    index: pageRange.index
                                });

                                page.data.forEach(result => {
                                    var columns = result.columns;
                                    let updateTelematic = record.load({ type: 'customrecord_ht_co_cobertura', id: result.getValue(columns[5]) });
                                    updateTelematic.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: 2 })
                                    updateTelematic.save();
                                });
                            });
                        }

                        if (adp == VALOR_001_INST_DISPOSITIVO) {
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
                            if (estado == ESTADO_CHEQUEADA && (estadoSalesOrder == 'pendingFulfillment' || estadoSalesOrder == 'partiallyFulfilled') && idDispositivo) {
                                var serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                var ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                                if (serieProducto.length > 0) {
                                    record.submitFields({
                                        type: 'customrecord_ht_record_mantchaser',
                                        id: serieProducto,
                                        values: { 'custrecord_ht_mc_ubicacion': ubicacion },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });
                                }
                                try {
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
                                    newFulfill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                } catch (error) {
                                    log.error('Error-Fulfill', error);
                                }
                            }
                        }

                        if (adp == VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                            let objRecordCreateServicios = record.create({ type: 'customrecord_ht_nc_servicios_instalados', isDynamic: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_bien_si', value: objRecord.getValue('custrecord_ht_ot_vehiculo'), ignoreFieldChange: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_servicio_si', value: idSalesorder, ignoreFieldChange: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_trabajo', value: id, ignoreFieldChange: true });
                            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_servicio', value: TTR_name, ignoreFieldChange: true });
                            objRecordCreateServicios.save();
                            if (conNovedad == true) {
                                record.submitFields({
                                    type: 'customrecord_ht_record_mantchaser',
                                    id: serieChaser,
                                    values: { 'custrecord_ht_mc_estado': estadoChaser },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                let dispositivo = search.lookupFields({
                                    type: 'customrecord_ht_record_mantchaser',
                                    id: serieChaser,
                                    columns: ['custrecord_ht_mc_seriedispositivo']
                                });
                                let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;

                                record.submitFields({
                                    type: 'customrecord_ht_record_detallechaserdisp',
                                    id: idDispositivo,
                                    values: { 'custrecord_ht_dd_estado': estadoChaser },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                let emailBody = '<p><b>Número de Documento: </b><span style="color: #000000;">' + valueSalesorder + '</span></p>' +
                                    '<p><b>Cliente: </b><span style="color: #000000;">' + customer + '</span></p>' +
                                    '<p><b>Bien: </b><span style="color: #000000;">' + valuebien + '</span></p>' +
                                    '<p><b>Resultado Chequeo: </b><span style="color: #000000;">Con novedad</span></p>' +
                                    '<p><b>Comentario: </b><span style="color: #000000;">' + comentario + '</span></p>'

                                email.send({
                                    author: senderId,
                                    recipients: recipientId,
                                    subject: 'Resultado de la Orden de Servicio por Mantenimiento - Chequeo ' + valueSalesorder + ' con novedad',
                                    body: emailBody,
                                    relatedRecords: {
                                        transactionId: idSalesorder
                                    }
                                    // attachments: [fileObj],
                                    // relatedRecords: {
                                    //     entityId: recipientId,
                                    //     customRecord: {
                                    //         id: recordId,
                                    //         recordType: recordTypeId
                                    //     }
                                    // }
                                });
                            }
                        }

                        if (adp == VALOR_002_DESINSTALACION_DE_DISP && estaChequeada == ESTADO_CHEQUEADA) {//TODO: Revisar actualziaciones cuando es locjack, ya que no tiene simcard
                            if (esAlquiler == SI) {
                                log.debug('Alquiler', 'Es alquiler');
                                let ajusteInv = _Controller.createInventoryAdjustmentIngreso(objParams);
                                let returnHistorial = _Controller.updateHistorialAF(objParams);
                                let updateIns = _Controller.updateInstall(objParams)
                                log.debug('ajusteInv', ajusteInv);
                                log.debug('returnHistorial', returnHistorial);
                                log.debug('returnHistorial', updateIns);
                                record.submitFields({
                                    type: 'customrecord_ht_record_mantchaser',
                                    id: serieChaser,
                                    values: { 'custrecord_ht_mc_estado': estadoChaser },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                let dispositivo = search.lookupFields({
                                    type: 'customrecord_ht_record_mantchaser',
                                    id: serieChaser,
                                    columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard']
                                });
                                let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;

                                record.submitFields({
                                    type: 'customrecord_ht_record_detallechaserdisp',
                                    id: idDispositivo,
                                    values: { 'custrecord_ht_dd_estado': DISPONIBLE },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                record.submitFields({
                                    type: 'customrecord_ht_record_detallechasersim',
                                    id: idSimCard,
                                    values: { 'custrecord_ht_ds_estado': INACTIVO },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                            }
                        }
                        break;
                    default:
                }

                log.debug('Esta chequeado?', estaChequeada == CHEQUEADO);
                if (estaChequeada == CHEQUEADO && ingresaFlujoAlquiler == true) {
                    //OBTENCION DE VARIABLES
                    var numSerieId = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                    log.debug('numSerieId', numSerieId);
                    var numSerieText = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                    log.debug('numSerieText', numSerieText);
                    var isCheck = context.newRecord.getValue('custrecord_flujo_de_alquiler');
                    log.debug('is checked?', isCheck);
                    let idItemRelacionado = objRecord.getValue('custrecord_ht_ot_item');
                    log.debug('idItemRelacionado', idItemRelacionado);
                    let textItemRelacionado = objRecord.getValue('custrecord_ht_ot_item');
                    log.debug('textItemRelacionado', textItemRelacionado);

                    var busquedaTipoActivo = search.lookupFields({ type: search.Type.ITEM, id: idItemRelacionado, columns: ['custitem_ht_ar_tipoactivo'] });
                    log.debug('busquedaTipoActivo', busquedaTipoActivo);

                    var item_tipo_activoId = (busquedaTipoActivo.custitem_ht_ar_tipoactivo)[0].value;
                    log.debug('item_tipo_activoId', item_tipo_activoId);

                    var item_tipo_activoText = (busquedaTipoActivo.custitem_ht_ar_tipoactivo)[0].text;
                    log.debug('item_tipo_activoText', item_tipo_activoText);


                    var historial_orden_de_servicio_id = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                    log.debug('historial_orden_de_servicio_id', historial_orden_de_servicio_id);
                    var historial_id_cliente = objRecord.getValue('custrecord_ht_ot_cliente_id');
                    // var historial_descripcion = objRecord.getValue('custrecord_ht_hs_descripcion');
                    // var historial_fecha_trabajo = objRecord.getValue('custrecord_ht_ot_fechatrabajoasignacion');


                    var historial_estado_ot = 'Instalado';
                    log.debug('historial_estado_ot', historial_estado_ot);
                    var historial_vid_auto = objRecord.getValue('custrecord_ht_ot_vehiculo');
                    log.debug('historial_vid_auto', historial_vid_auto);

                    var historial_placa = objRecord.getValue('custrecord_ht_ot_placa');
                    log.debug('historial_placa', historial_placa);
                    var historial_marca = objRecord.getValue('custrecord_ht_ot_marca');
                    log.debug('historial_marca', historial_marca);
                    var historial_tipo = objRecord.getValue('custrecord_ht_ot_tipo');
                    log.debug('historial_tipo', historial_tipo);
                    var historial_motor = objRecord.getValue('custrecord_ht_ot_motor');
                    log.debug('historial_motor', historial_motor);

                    var busqueda_sales_order = search.lookupFields({ type: search.Type.SALES_ORDER, id: historial_orden_de_servicio_id, columns: ['custbody_ht_os_tipoordenservicio', 'trandate'] });
                    log.debug('busqueda_sales_order', busqueda_sales_order);

                    // var typeSalesOrder = (busqueda_sales_order.custbody_ht_os_tipoordenservicio)[0].text;
                    // log.debug('typeSalesOrder', typeSalesOrder);
                    var dateSalesOrder = busqueda_sales_order.trandate;
                    log.debug('dateSalesOrder', dateSalesOrder);

                    var customrecord_asset_search = search.create({
                        type: "customrecord_ncfar_asset",
                        filters:
                            [
                                ["custrecord_nmero_de_serie_dispositivo", "is", numSerieId]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_nmero_de_serie_dispositivo", label: "Número de Serie Dispositivo" }),
                                search.createColumn({ name: "altname", label: "Name" })
                            ]
                    });

                    var results = customrecord_asset_search.run().getRange({ start: 0, end: 1 });
                    log.debug('results', results);

                    var historial_id_activo_fijo;
                    var nameDispositivo;




                    if (results.length > 0) {
                        // if (false) {
                        //EXISTE ACTIVO FIJO
                        historial_id_activo_fijo = results[0].id;
                        log.debug('historial_id_activo_fijo', historial_id_activo_fijo);
                        nameDispositivo = results[0].getValue({ name: 'altname' });
                        log.debug('nameDispositivo', nameDispositivo);

                        log.debug('Entro a flujo de: ', 'generar Historial en activo')
                        var descHistorial = textItemRelacionado + " " + itemDispositivoName.displayname + " " + numSerieText;
                        log.debug('descHistorial', descHistorial);

                        var historial = record.create({ type: 'customrecord_ht_record_historialsegui', isDynamic: true });
                        historial.setValue('custrecord_ht_hs_numeroordenservicio', historial_orden_de_servicio_id);
                        historial.setValue('custrecord_ht_hs_propietariocliente', historial_id_cliente);
                        historial.setValue('custrecord_ht_hs_descripcion', descHistorial);
                        historial.setText('custrecord_ht_hs_fechaordenservicio', dateSalesOrder);
                        historial.setValue('custrecord_ht_hs_estado', 'Instalado');
                        historial.setValue('custrecord_ht_hs_vidvehiculo', historial_vid_auto);
                        historial.setValue('custrecord_ht_hs_placa', historial_placa);
                        historial.setValue('custrecord_ht_hs_marca', historial_marca);
                        historial.setValue('custrecord_ht_hs_tipo', historial_tipo);
                        historial.setValue('custrecord_ht_hs_motor', historial_motor);
                        historial.setValue('custrecord_ht_af_enlace', historial_id_activo_fijo);
                        historial.save();
                        log.debug('Termino crear historial');

                    } else {
                        //NO EXISTE ACTIVO FIJO -> CREAR ACTIVO

                        //Busqueda Dispositivo Serie
                        var billOfMaterialRevision;

                        var filters = [["isinactive", "is", "F"], "AND", ["custrecord_ht_articulo_alquileractivo", "anyof", idItemRelacionado]];
                        var bomRevisionResultSearch = search.create({
                            type: "bomrevision",
                            filters,
                            columns: ["name"]
                        }).run().getRange(0, 1);
                        log.debug('bomRevisionResultSearch', bomRevisionResultSearch);

                        if (bomRevisionResultSearch.length != 0) {
                            for (var i = 0; i < bomRevisionResultSearch.length; i++) {
                                billOfMaterialRevision = bomRevisionResultSearch[i].id;
                            }

                            log.debug('billOfMaterialRevision', billOfMaterialRevision);

                            var recordRevision = record.load({ type: 'bomrevision', id: billOfMaterialRevision })
                            var lineCountSublist = recordRevision.getLineCount({ sublistId: 'component' })

                            var itemDispositivoId;
                            for (var j = 0; j < lineCountSublist; j++) {
                                var currentItemSub = recordRevision.getSublistText({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    line: j
                                }).toLowerCase();

                                var currentQuantiSub = recordRevision.getSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'quantity',
                                    line: j
                                });

                                if (currentItemSub.indexOf('dispositivo') && currentQuantiSub == 1) {
                                    itemDispositivoId = recordRevision.getSublistValue({
                                        sublistId: 'component',
                                        fieldId: 'item',
                                        line: j
                                    });
                                    break;
                                }
                            }

                            //ITEM NOMBRE DISPOSITIVO
                            var itemDispositivoName = search.lookupFields({
                                type: 'serializedinventoryitem',
                                id: itemDispositivoId,
                                columns: ['displayname']
                            });

                            log.debug('itemDispositivoName', itemDispositivoName.displayname);

                            //BUSQUEDA PARA CONSEGUIR ID DE AJUSTE DE INVENTARIO
                            var inventoryadjustmentSearchObj = search.create({
                                type: "inventoryadjustment",
                                filters:
                                    [
                                        ["type", "anyof", "InvAdjst"],
                                        "AND",
                                        ["custbody_ht_af_ejecucion_relacionada", "anyof", historial_orden_de_servicio_id],
                                        "AND",
                                        ["creditfxamount", "isnotempty", ""]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "item", label: "Item" }),
                                        search.createColumn({ name: "creditamount", label: "Amount (Credit)" })
                                    ]
                            });

                            var resultsInvAdj = inventoryadjustmentSearchObj.run().getRange({ start: 0, end: 1000 });
                            log.debug('resultsInvAdj', resultsInvAdj);

                            if (resultsInvAdj != 0) {
                                var arrResult = [];

                                for (var index = 0; index < resultsInvAdj.length; index++) {
                                    var jsonTemp = {};
                                    jsonTemp.adjInvId = resultsInvAdj[index].id;
                                    jsonTemp.adjIdItem = resultsInvAdj[index].getValue({ name: 'item' });
                                    jsonTemp.adjCreditAmount = resultsInvAdj[index].getValue({ name: 'creditamount' });

                                    arrResult.push(jsonTemp);

                                }

                                var currentInvAdjId;
                                for (var i = 0; i < arrResult.length; i++) {
                                    if (arrResult[i].adjIdItem == itemDispositivoId) {
                                        currentInvAdjId = arrResult[i].adjInvId;
                                        break;
                                    }

                                }

                                //MONTO CREDITO TOTAL
                                var creditoTotal = 0;
                                for (var i = 0; i < arrResult.length; i++) {
                                    if (arrResult[i].adjInvId == currentInvAdjId) {
                                        creditoTotal += Number(arrResult[i].adjCreditAmount);
                                    }
                                }
                                log.debug('creditoTotal', creditoTotal);

                                // results[index].getValue({ name: 'debitfxamount' });
                                // var asset_debit_amount = results[0].getValue({ name: 'debitfxamount' });
                                // log.debug('nameDispositivo', nameDispositivo);


                                //Valores de Nuevo Asset
                                var datosTipoActivo = search.lookupFields({ type: 'customrecord_ncfar_assettype', id: item_tipo_activoId, columns: ['custrecord_assettypeaccmethod', 'custrecord_assettyperesidperc', 'custrecord_assettypelifetime', 'custrecord_assettypedescription'] });
                                log.debug('datosTipoActivo', datosTipoActivo);

                                var asset_tipo_activo = (datosTipoActivo.custrecord_assettypeaccmethod)[0].value;
                                log.debug('asset_tipo_activo', asset_tipo_activo);
                                var asset_porcentaje_residual = datosTipoActivo.custrecord_assettyperesidperc.replace('%', '');
                                log.debug('asset_porcentaje_residual', asset_porcentaje_residual);
                                var asset_tiempo_de_vida = datosTipoActivo.custrecord_assettypelifetime;
                                log.debug('asset_tiempo_de_vida', asset_tiempo_de_vida);
                                // var asset_name = datosTipoActivo.custrecord_assettypedescription;
                                // log.debug('asset_name', asset_name);


                                var fixedAsset = record.create({ type: 'customrecord_ncfar_asset', isDynamic: true });

                                fixedAsset.setValue('customform', 145);
                                fixedAsset.setValue('altname', itemDispositivoName.displayname);
                                fixedAsset.setValue('custrecord_assettype', item_tipo_activoId);
                                fixedAsset.setValue('custrecord_assetcost', creditoTotal);
                                fixedAsset.setValue('custrecord_assetresidualperc', Number(asset_porcentaje_residual));
                                fixedAsset.setValue('custrecord_assetresidualvalue', 1);
                                fixedAsset.setValue('custrecord_assetaccmethod', asset_tipo_activo);
                                fixedAsset.setValue('custrecord_assetlifetime', asset_tiempo_de_vida);
                                fixedAsset.setValue('custrecord_nmero_de_serie_dispositivo', numSerieId);

                                var id_new_asset = fixedAsset.save()
                                log.debug('id_new_asset', id_new_asset);
                                log.debug('Termino crear activo');

                                var historial = record.create({ type: 'customrecord_ht_record_historialsegui', isDynamic: true });
                                var descHistorial = textItemRelacionado + ' ' + itemDispositivoName.displayname + ' ' + numSerieText

                                historial.setValue('custrecord_ht_hs_numeroordenservicio', historial_orden_de_servicio_id);
                                historial.setValue('custrecord_ht_hs_propietariocliente', historial_id_cliente);
                                historial.setValue('custrecord_ht_hs_descripcion', descHistorial);
                                historial.setText('custrecord_ht_hs_fechaordenservicio', dateSalesOrder);
                                historial.setValue('custrecord_ht_hs_estado', 'Instalado');
                                historial.setValue('custrecord_ht_hs_vidvehiculo', historial_vid_auto);
                                historial.setValue('custrecord_ht_hs_placa', historial_placa);
                                historial.setValue('custrecord_ht_hs_marca', historial_marca);
                                historial.setValue('custrecord_ht_hs_tipo', historial_tipo);
                                historial.setValue('custrecord_ht_hs_motor', historial_motor);
                                historial.setValue('custrecord_ht_af_enlace', id_new_asset);
                                historial.save();
                                log.debug('Termino crear historial de nuevo activo');
                            } else {

                                log.debug('No existe ajuste de inventario, con OS Relacionado');
                            }

                        } else {
                            log.debug('No se encuentra dispositivo en el item revision');
                        }
                    }
                }
            }
        }

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

        const createCoberturaWS = (json) => {
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
























