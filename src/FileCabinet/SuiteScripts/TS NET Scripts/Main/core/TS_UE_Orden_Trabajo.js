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
define(['N/log', 'N/search', 'N/record', 'N/ui/serverWidget', 'N/https', 'N/error', '../../Impulso Plataformas/Controller/TS_Script_Controller'],
    (log, search, record, serverWidget, https, error, _Controller) => {
        const HT_DETALLE_ORDEN_SERVICIO = 'customsearch_ht_detalle_orden_servicio'; //HT Detalle Orden de Servicio - PRODUCCION
        const HT_CONSULTA_ORDEN_TRABAJO = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
        const tipo_servicio_alquiler = 1;
        const tipo_servicio_chequeo = 3;
        const tipo_servicio_demo = 4;
        const TIPO_SERVICIO_DESINSTALACION = 5;
        const tipo_devolucion = 6;
        const tipo_garantia = 7;
        const tipo_renovacion_cobertura = 8;
        const tipo_upgrade = 9;
        const TIPO_VENTA = 10;
        const CONVENIO = 12;
        const ESTADO_CHEQUEADA = 2;
        const ENVIO_PLATAFORMAS = '5';
        const TYPE_REGISTRO = 'ORDEN_TRABAJO'
        const HABILITAR_LOG_SEGUIMIENTO = 1;
        const HABILITAR_LOG_VALIDACION = 1;

        const beforeLoad = (context) => {

            let objRecord = context.newRecord;
            let id = context.newRecord.id;
            var form = context.form;
            var type_event = context.type;

            if (type_event == context.UserEventType.VIEW) {
                let idOrdenTrabajo = objRecord.getValue('custrecord_ht_ot_ordenfabricacion');
                let estado = objRecord.getValue('custrecord_ht_ot_estado');
                if (estado == 4) {//ESTADO PROCESANSO
                    form.addButton({
                        id: 'custpage_ts_fabricarproducto',
                        label: 'Ensamble de Dispositivo',
                        functionName: 'ensambleDispositivo(' + idOrdenTrabajo + ')'
                    });
                    form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';

                }
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
                let plataformas;
                let adp;
                let estaChequeada = objRecord.getValue('custrecord_ht_ot_estado');
                if (estaChequeada > 0) {
                    accionEstadoOT = ESTADO_CHEQUEADA;

                }

                switch (accionEstadoOT) {
                    case ESTADO_CHEQUEADA:
                        let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                        let bien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                        let coberturas = _Controller.getCobertura(bien);
                        let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
                        var numLines = salesorder.getLineCount({ sublistId: 'item' });
                        var cantidad = 0;
                        let returEjerepo = false;
                        let parametrosRespo;
                        for (let i = 0; i < numLines; i++) {
                            let items = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                            let type = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                            log.debug('TYPE', type);
                            Origen = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen', line: i });
                            parametrosRespo = _Controller.parametrizacion(items);
                            var itemMeses = idItemType(items);

                            if (itemMeses == 1) {
                                let quantity = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                                cantidad = cantidad + quantity;
                            }
                            log.debug('parametrosRespo', parametrosRespo);
                            if (parametrosRespo.length != 0) {
                                for (let j = 0; j < parametrosRespo.length; j++) {
                                    if (parametrosRespo[j][0] == 2) {//ADP
                                        adp = parametrosRespo[j][1];
                                    }
                                    if (parametrosRespo[j][0] == ENVIO_PLATAFORMAS) {
                                        plataformas = parametrosRespo[j][1];
                                    }
                                }
                            }
                            if (plataformas == 9) {//SI
                                returEjerepo = _Controller.parametros(ENVIO_PLATAFORMAS, id, adp);
                            } else {
                                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true });
                                updateTelematic.save();
                            }
                            log.debug('returEjerepo', returEjerepo);
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

                        if (returEjerepo) {
                            let json = {
                                bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                start: cobertura.coberturaInicial,
                                plazo: cantidad,
                                end: cobertura.coberturaFinal,
                                producto: idItemCobertura,
                                serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                salesorder: idSalesorder,
                                ordentrabajo: objRecord.id
                            }
                            cabertura(json);
                        }


                        if (adp == 21) {//DESINSTALACION
                            var customrecord_ht_ct_cobertura_transactionSearchObj = search.create({
                                type: "customrecord_ht_ct_cobertura_transaction",
                                filters:
                                    [
                                        ["custrecord_ht_ct_orden_servicio", "anyof", "29353"]
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
                        log.debug('ADP', adp);
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
                            log.debug('fulfill', fulfill);
                            var idDispositivo = getInventoryNumber(fulfill);
                            log.debug('idDispositivo', idDispositivo);
                            var estadoSalesOrder = getSalesOrder(idSalesOrder);
                            log.debug('estadoSalesOrder', estadoSalesOrder);
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



                        break;
                    default:
                        log.debug('accionEstadoOT', `Sorry, we are out of ${accionEstadoOT}.`);
                }




            }
        }

        //const envioPXAdmin = () => { }


        const cabertura = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            log.debug('json', json);

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
                log.debug('estado busqueda', estado);
                return estado;
            } catch (e) {
                log.error('Error en estadoSalesOrder', e);
            }
        }



        const getCobertura = (cantidad) => {
            try {

                let date = new Date();

                date.setDate(date.getDate() + 1);
                let date_final = new Date();
                date_final.setDate(date_final.getDate() + 1);
                date_final.setMonth(date_final.getMonth() + cantidad);
                date_final = new Date(date_final);
                return {
                    coberturaInicial: date,
                    coberturaFinal: date_final
                };

            } catch (e) {
                log.debug('Error-sysDate', e);
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
















