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
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
],
    (transaction, config, log, search, record, serverWidget, https, error, format, email, runtime, _controller, _constant, _errorMessage) => {
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
        //^BLOQUE PARAMETROS ===================================================================
        const VALOR_001_INST_DISPOSITIVO = 43;
        const SI = 9;
        const ESTADO_001_INSTALADO = 1;
        const CHEQUEADO = 2;
        const ADP_ACCION_DEL_PRODUCTO = 2
        const VALOR_010_CAMBIO_PROPIETARIO = 10;
        const PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC = 5
        const CAMB_MOV_CUSTODIA = 131;
        const VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO = 44;
        const TAG_TIPO_AGRUPACION_PRODUCTO = 77;
        const TCH_TIPO_CHEQUEO_OT = 6;
        const VALOR_001_CHEQUEO_H_LOJACK = 105;
        const ALQUILER_PARAM = 13;
        const COS_CIERRE_DE_ORDEN_DE_SERVICIO = 99;
        const DISPONIBLE = 5;
        const INACTIVO = 5;
        const INSTALADO = 1;
        const PROCESANDO = 4;


        const beforeLoad = (context) => {
            let configRecObj = config.load({ type: config.Type.COMPANY_INFORMATION });
            const URL = configRecObj.getValue({ fieldId: 'appurl' });
            let objRecord = context.newRecord;
            let id = context.newRecord.id;
            let form = context.form;
            let type_event = context.type;
            let paralizador = 0, boton_panico = 0;

            if (type_event == context.UserEventType.VIEW) {
                let idOrdenTrabajo = objRecord.getValue('custrecord_ht_ot_ordenfabricacion');
                let estado = objRecord.getValue('custrecord_ht_ot_estado');
                let serieDispositivo = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                if (estado == _constant.Status.PROCESANDO) {
                    //^: Solo para pruebas internas por si no se chequea, luego activar y borrar el botón sin validación de estado, línea 99
                    // if (serieDispositivo.length > 0) {
                    //     form.addButton({
                    //         id: 'custpage_ts_chequeo',
                    //         label: 'Chequear Orden',
                    //         functionName: 'chequearOrden(' + id + ')'
                    //     });
                    // }

                    if (idOrdenTrabajo.length > 0) {
                        form.addButton({
                            id: 'custpage_ts_fabricarproducto',
                            label: 'Ensamble de Dispositivo',
                            functionName: 'ensambleDispositivo(' + idOrdenTrabajo + ')'
                        });
                    }
                }

                if (estado == _constant.Status.PROCESANDO || estado == _constant.Status.CHEQUEADO) {
                    if (serieDispositivo.length > 0) {
                        form.addButton({
                            id: 'custpage_ts_chequeo',
                            label: 'Chequear Orden',
                            functionName: 'chequearOrden(' + id + ')'
                        });
                    }
                }

                form.getField('custrecord_ht_ot_termometro').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                createEnsambleAlquilerButton(form, objRecord);
                createEnsambleCustodiaButton(form, objRecord);
                createEnsambleGarantiaButton(form, objRecord);
                form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';

                let taxNumber = search.lookupFields({
                    type: 'customer',
                    id: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                    columns: ['vatregnumber', 'custentity_ts_ec_tipo_persona']
                })
                //log.debug('Tax-Number', taxNumber.vatregnumber)
            } else if (type_event == context.UserEventType.EDIT) {
                createEnsambleAlquilerButton(form, objRecord);
                createEnsambleCustodiaButton(form, objRecord);
                createEnsambleGarantiaButton(form, objRecord);
                form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';
            }

            // if (type_event == context.UserEventType.VIEW) {
            //     //let objRecord = context.newRecord;
            //     let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            //     let idItemOT = objRecord.getValue({ fieldId: 'custrecord_ht_ot_item' });
            //     let parametrosRespo_2 = _controller.parametrizacion(idItemOT);
            //     if (parametrosRespo_2.length != 0) {
            //         for (let j = 0; j < parametrosRespo_2.length; j++) {
            //             if (parametrosRespo_2[j][0] == _constant.Parameter.DSR_DEFINICION_DE_SERVICIOS && parametrosRespo_2[j][1] == _constant.Valor.SI) {
            //                 let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
            //                 let numLines = salesorder.getLineCount({ sublistId: 'item' });
            //                 for (let i = 0; i < numLines; i++) {
            //                     paralizador = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_paralizador', line: i });
            //                     if (paralizador) {
            //                         log.debug('PARALIZADORT', 'es: ' + paralizador);
            //                         record.submitFields({
            //                             type: context.newRecord.type,
            //                             id: objRecord.id,
            //                             values: { custrecord_ht_ot_paralizador: true },
            //                             options: { enablesourcing: true }
            //                         })
            //                         //objRecord.setValue('custrecord_ht_ot_paralizador', true)
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }
        }

        const afterSubmit = (context) => {
            // if (context.type == context.UserEventType.CREATE) {
            //     let objRecord = context.newRecord;
            //     let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            //     let idItemOT = objRecord.getValue({ fieldId: 'custrecord_ht_ot_item' });
            //     let parametrosRespo_2 = _controller.parametrizacion(idItemOT);
            //     log.debug('LOGGG', parametrosRespo_2);
            //     if (parametrosRespo_2.length != 0) {
            //         for (let j = 0; j < parametrosRespo_2.length; j++) {
            //             if (parametrosRespo_2[j][0] == _constant.Parameter.DSR_DEFINICION_DE_SERVICIOS && parametrosRespo_2[j][1] == _constant.Valor.SI) {
            //                 let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
            //                 let numLines = salesorder.getLineCount({ sublistId: 'item' });
            //                 for (let i = 0; i < numLines; i++) {
            //                     paralizador = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_paralizador', line: i });
            //                     if (paralizador) {
            //                         log.debug('PARALIZADORT', 'es: ' + paralizador);
            //                         record.submitFields({
            //                             type: context.newRecord.type,
            //                             id: objRecord.id,
            //                             values: { custrecord_ht_ot_paralizador: true },
            //                             options: { enablesourcing: true }
            //                         })
            //                         //objRecord.setValue('custrecord_ht_ot_paralizador', true)
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }

            if (context.type === context.UserEventType.EDIT) {
                let senderId = runtime.getCurrentUser();
                senderId = senderId.id;
                let objRecord = context.newRecord;
                let accionEstadoOT = 'Sin estado';
                let id = context.newRecord.id;
                let Origen;
                let arr = [];
                let impulsaPX = 1;
                let impulsaTelematics = 1;
                let adpServicio = 0;
                let estaChequeada = objRecord.getValue('custrecord_ht_ot_estado');
                let ingresaFlujoAlquiler;
                let statusOri = estaChequeada;
                let estadoInts, noChequeado = 0;

                let ingresaFlujoConvenio;
                let serieProductoChaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                //log.debug('serieProductoChaser', serieProductoChaser);

                if (estaChequeada > 0) {
                    accionEstadoOT = estaChequeada;//TODO: Revisar esta sección porque puede impactar la instalación sin activicación de servicio.
                    //accionEstadoOT = _constant.Status.CHEQUEADO
                }
                //log.debug('accionEstadoOT', accionEstadoOT);

                switch (parseInt(accionEstadoOT)) {
                    case _constant.Status.CHEQUEADO:
                        let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                        let valueSalesorder = objRecord.getText('custrecord_ht_ot_orden_servicio');
                        let bien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                        let valuebien = objRecord.getText('custrecord_ht_ot_vehiculo');
                        let coberturas = _controller.getCobertura(bien);
                        let busqueda_salesorder = getSalesOrderItem(bien);
                        //log.debug('busqueda_salesorder', busqueda_salesorder);
                        let busqueda_cobertura = getCoberturaItem(bien);
                        let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
                        var numLines = salesorder.getLineCount({ sublistId: 'item' });
                        let chaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                        let idItemOT = objRecord.getValue('custrecord_ht_ot_item');
                        let idItemRelacionadoOT = objRecord.getValue('custrecord_ht_ot_itemrelacionado');
                        let conNovedad = objRecord.getValue('custrecord_ht_ot_connovedad');
                        let serieChaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                        let estadoChaser = objRecord.getValue('custrecord_ht_ot_estadochaser');
                        let recipientId = objRecord.getValue('custrecord_ht_ot_cliente_id');
                        let customer = objRecord.getText('custrecord_ht_ot_cliente_id');
                        let comentario = objRecord.getText('custrecord_ht_ot_observacion');
                        ingresaFlujoAlquiler = objRecord.getValue('custrecord_flujo_de_alquiler');
                        ingresaFlujoConvenio = objRecord.getValue('custrecord_flujo_de_convenio');
                        let taller = objRecord.getValue('custrecord_ht_ot_taller');
                        let comercial = objRecord.getText('custrecord_ht_ot_serieproductoasignacion');
                        let simTXT = objRecord.getValue('custrecord_ht_ot_simcard');
                        let flujoReinstalacion = objRecord.getValue('custrecord_flujo_de_reinstalacion');

                        let cantidad = 0, parametro_salesorder = 0, tag = 0, idOS = 0, envioPX = 0, envioTele = 0, idItem = 0, monitoreo = 0, precio = 0, esAlquiler = 0, entregaCliente = 0,
                            entradaCustodia = 0, entregaCustodia = 0, adpDesinstalacion = 0, esGarantia = 0, plataformasPX = 0, plataformasTele = 0, adp, device, parametrosRespo = 0, ttrid = 0,
                            TTR_name = '', idCoberturaItem = '', returEjerepo = true, arrayItemOT = new Array(), arrayID = new Array(), arrayTA = new Array(), objParams = new Array();

                        let parametrosRespo_2 = _controller.parametrizacion(idItemOT);

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
                        let itemInstallId = _controller.getInstall(objParameters);

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
                            bien: bien,
                            sim: simTXT,
                            deposito: 0,
                            dispositivo: 0,
                            tag: 0
                        }

                        for (let i = 0; i < numLines; i++) {
                            precio = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                        }

                        if (parametrosRespo_2.length != 0) {
                            for (let j = 0; j < parametrosRespo_2.length; j++) {
                                if (parametrosRespo_2[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                                    adp = parametrosRespo_2[j][1];
                                    adpServicio = parametrosRespo_2[j][1];
                                    adpDesinstalacion = adpServicio
                                }

                                if (parametrosRespo_2[j][0] == _constant.Parameter.TTR_TIPO_TRANSACCION) { // TTR tipo de transaccion
                                    let parametro = record.load({ type: 'customrecord_ht_cr_pp_valores', id: parametrosRespo_2[j][1], isDynamic: true });
                                    TTR_name = parametro.getValue('custrecord_ht_pp_descripcion');
                                    ttrid = parametrosRespo_2[j][1]
                                }
                                if (parametrosRespo_2[j][0] == _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS)
                                    envioPX = parametrosRespo_2[j][1];

                                if (parametrosRespo_2[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS)
                                    envioTele = parametrosRespo_2[j][1];

                                if (parametrosRespo_2[j][0] == _constant.Parameter.COS_CIERRE_DE_ORDEN_DE_SERVICIO && parametrosRespo_2[j][1] == _constant.Valor.SI) { //cos cerrar orden de servicio
                                    try {
                                        if (precio == 0)
                                            transaction.void({ type: 'salesorder', id: idSalesorder });
                                    } catch (error) {
                                        log.error('Error', error + ', ya está cerrada la Orden de Servicio');
                                    }
                                }

                                if (parametrosRespo_2[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO)
                                    tag = parametrosRespo_2[j][1];

                                if (parametrosRespo_2[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER)
                                    esAlquiler = _constant.Valor.SI;


                                if (parametrosRespo_2[j][0] == _constant.Parameter.EDC_ENTREGA_DIRECTA_A_CLIENTE)
                                    entregaCliente = parametrosRespo_2[j][1];

                                if (parametrosRespo_2[j][0] == _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                    esGarantia = parametrosRespo_2[j][1];

                                if (parametrosRespo_2[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS && parametrosRespo_2[j][1] == _constant.Valor.VALOR_001_GENERA_CUSTODIAS)
                                    entradaCustodia = _constant.Valor.SI
                            }
                        }

                        if (busqueda_salesorder.length != 0) {
                            for (let i = 0; i < busqueda_salesorder.length; i++) {
                                let parametrosRespo = _controller.parametrizacion(busqueda_salesorder[i][0]);
                                if (parametrosRespo.length != 0) {
                                    var accion_producto = 0;
                                    var valor_tipo_agrupacion = 0;

                                    for (let j = 0; j < parametrosRespo.length; j++) {
                                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                                            accion_producto = parametrosRespo[j][1];
                                        }

                                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO) {
                                            valor_tipo_agrupacion = parametrosRespo[j][1];
                                        }

                                        if (accion_producto == _constant.Valor.VALOR_015_VENTA_SERVICIOS && valor_tipo_agrupacion == tag) {
                                            log.debug('Entry', 'Entra a item de transmision');
                                            adpServicio = accion_producto;
                                            idOS = busqueda_salesorder[i][1];
                                            plataformasPX = envioPX;
                                            plataformasTele = envioTele;
                                            idItem = busqueda_salesorder[i][0];
                                        }

                                        if (accion_producto == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                            idOS = busqueda_salesorder[i][1];
                                        }
                                    }
                                }
                            }
                        }

                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {
                                let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                if (parametrosRespo.length != 0) {
                                    var accion_producto = 0;
                                    var valor_tipo_agrupacion = 0;
                                    var envio = 0;
                                    for (let j = 0; j < parametrosRespo.length; j++) {
                                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                                            accion_producto = parametrosRespo[j][1];
                                        }

                                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO) {
                                            valor_tipo_agrupacion = parametrosRespo[j][1];
                                        }

                                        if ((accion_producto == _constant.Valor.VALOR_001_INST_DISPOSITIVO || accion_producto == _constant.Valor.VALOR_003_REINSTALACION_DE_DISP) && valor_tipo_agrupacion == tag) {
                                            idCoberturaItem = busqueda_cobertura[i][1];
                                            estadoInts = _constant.Status.INSTALADO
                                        }
                                    }
                                }
                            }
                        }

                        // log.debug('idOS', idOS)

                        if (idOS) {
                            log.debug('idOSIntroImpulsoPlataformas', idOS)
                            let serviceOS = record.load({ type: 'salesorder', id: idOS });
                            let numLines_2 = serviceOS.getLineCount({ sublistId: 'item' });
                            for (let j = 0; j < numLines_2; j++) {
                                let items = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                                monitoreo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                                var itemMeses = idItemType(items);
                                if (itemMeses == 1) {
                                    let quantity = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j });
                                    cantidad = cantidad + quantity;
                                }

                                if (plataformasPX == _constant.Valor.SI) {
                                    returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                    //log.debug('Estado que devuelve el impulso a plataforma PX- ' + j, JSON.stringify(returEjerepo) + ': ' + JSON.stringify(returEjerepo));
                                } else {
                                    impulsaPX = 0;
                                    // let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                    // updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                    // updateTelematic.save();
                                }

                                if (plataformasTele == _constant.Valor.SI && ingresaFlujoConvenio == false && adpDesinstalacion != _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                                    returEjerepo = _controller.parametros(_constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, id, adp);
                                    //log.debug('Estado que devuelve el impulso a plataforma tele- ' + j, JSON.stringify(returEjerepo) + ': ' + JSON.stringify(returEjerepo));
                                } else {
                                    impulsaTelematics = 0;
                                    // let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                    // updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                    // updateTelematic.save();
                                }

                                if (impulsaPX == 0 && impulsaTelematics == 0) {
                                    let updateFinalizacionOT = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                    updateFinalizacionOT.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                    updateFinalizacionOT.save();
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
                            values: { 'custbody_ht_os_trabajado': 'S' }
                        });

                        let idItemCobertura = objRecord.getValue('custrecord_ht_ot_item');
                        let idVentAlq = objRecord.getValue('custrecord_ht_ot_item_vent_alq');
                        if (idVentAlq != '') {
                            idItemCobertura = idVentAlq;
                        }
                        let activacion = 16;
                        let instalacion_activacion = 17;
                        let instalacion = 15;
                        estadoInts = 1 //Instalado
                        //log.debug('Debug1', returEjerepo + ' - ' + adpDesinstalacion);

                        if (adpDesinstalacion != _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                            if (returEjerepo && adpServicio != 0) {
                                //log.debug('SALES ORDER!!!!!!!!!!!!', idOS + '==' + idSalesorder)
                                if (idOS == idSalesorder) {
                                    log.debug('MONITOREOOOOOO', 'Cobertura1');
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
                                        salesorder: idOS,
                                        ordentrabajo: objRecord.id,
                                        monitoreo: monitoreo,
                                        cobertura: idCoberturaItem,
                                        ttr: ttrid,
                                        estadoCobertura: estadoInts
                                    }
                                    createCoberturaWS(json);
                                    if (chaser.length > 0) {
                                        let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                        updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: _constant.Status.INSTALADO })
                                        updateTelematic.save();
                                    }
                                } else {
                                    log.debug('MONITOREOOOOOO', 'Cobertura2');
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
                                        ttr: ttrid,
                                        estadoCobertura: estadoInts
                                    }

                                    if (idOS == 0) {
                                        json.concepto = instalacion;
                                        json.salesorder = idSalesorder;
                                        json.estadoCobertura = _constant.Status.PENDIENTE_DE_ACTIVACION
                                        noChequeado = 1
                                    }

                                    if (ingresaFlujoConvenio == true) {
                                        json.concepto = instalacion;
                                        json.salesorder = idSalesorder;
                                    }

                                    createCoberturaWS(json);
                                    if (chaser.length > 0) {
                                        let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                        updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: _constant.Status.INSTALADO })
                                        updateTelematic.save();
                                    }
                                }
                            } else {
                                if (adpServicio != _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
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
                                        estado: estadoInts,
                                        ttr: ttrid
                                    }
                                    createCoberturaWS(json);
                                    if (chaser.length > 0) {
                                        let updateTelematic = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaser });
                                        updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: _constant.Status.INSTALADO })
                                        updateTelematic.save();
                                        record.submitFields({ type: 'customrecord_ht_record_ordentrabajo', id: id, values: { 'custrecord_ht_ot_estado': _constant.Status.PROCESANDO }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                    }
                                }
                            }
                        }

                        if (statusOri == _constant.Status.CHEQUEADO && ingresaFlujoConvenio == true) {
                            log.debug('Convenio', 'Es convenio');
                            objParams.item = idItemOT
                            objParams.boleano = true;
                            let ajusteInvSalida = _controller.createInventoryAdjustmentSalida(objParams);
                            //log.debug('account', ajusteInvSalida);
                            let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, ajusteInvSalida, 1);
                            // log.debug('AjusteInventarioPorConvenioSalida', ajusteInvSalida);
                            log.debug('AjusteInventarioPorConvenio', ajusteInv);
                        }

                        if (adp == _constant.Valor.VALOR_001_INST_DISPOSITIVO || adp == _constant.Valor.VALOR_003_REINSTALACION_DE_DISP) {
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
                            let idDispositivo = getInventoryNumber(fulfill, idItemOT);
                            log.debug('idDispositivo', idDispositivo)
                            var estadoSalesOrder = getSalesOrder(idSalesOrder);
                            if (estado == _constant.Status.CHEQUEADO && (estadoSalesOrder == 'pendingFulfillment' || estadoSalesOrder == 'partiallyFulfilled') && idDispositivo) {
                                let serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                let ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                                if (serieProducto.length > 0) {
                                    if (tag == _constant.Valor.VALOR_LOJ_LOJACK) {
                                        //LOJACK
                                        log.debug('TAG', 'LOJACK: ' + tag);
                                        record.submitFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieProducto,
                                            values: {
                                                'custrecord_ht_mc_estado': estadoChaser,
                                                'custrecord_ht_mc_estadolojack': estadoChaser
                                            },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });

                                        let dispositivo = search.lookupFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieProducto,
                                            columns: ['custrecord_ht_mc_seriedispositivolojack']
                                        });
                                        let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                        //log.debug('dispositivoid', dispositivoid);
                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechaslojack',
                                            id: dispositivoid,
                                            values: { 'custrecord_ht_cl_estado': estadoChaser },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                    } else {
                                        //CHASER
                                        log.debug('TAG', 'CHASER: ' + tag)
                                        record.submitFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieProducto,
                                            values: {
                                                'custrecord_ht_mc_ubicacion': ubicacion,
                                                'custrecord_ht_mc_estadolodispositivo': estadoChaser
                                            },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });

                                        let dispositivo = search.lookupFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieProducto,
                                            columns: ['custrecord_ht_mc_seriedispositivo']
                                        });
                                        let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;

                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechaserdisp',
                                            id: dispositivoid,
                                            values: { 'custrecord_ht_dd_estado': estadoChaser },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                    }
                                }
                                try {
                                    let newFulfill = record.transform({
                                        fromType: record.Type.SALES_ORDER,
                                        fromId: idSalesOrder,
                                        toType: record.Type.ITEM_FULFILLMENT
                                    });
                                    let numLines = newFulfill.getLineCount({ sublistId: 'item' });
                                    for (let i = 0; i < numLines; i++) {
                                        newFulfill.setSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1, line: i });
                                        let objSubRecord = newFulfill.getSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail', line: 0 })
                                        objSubRecord.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: idDispositivo, line: 0 });
                                        objSubRecord.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1, line: 0 });
                                        objSubRecord.setSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1, line: 0 });
                                    }
                                    newFulfill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                } catch (error) {
                                    log.error('Error-Fulfill', error);
                                }

                                if (entregaCustodia == _constant.Valor.SI) {
                                    _controller.deleteRegistroCustodia(objParams);
                                }
                            }

                            if (estaChequeada == _constant.Status.CHEQUEADO && ingresaFlujoAlquiler == true) {
                                //OBTENCION DE VARIABLES
                                let numSerieId = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                let numSerieText = objRecord.getText('custrecord_ht_ot_serieproductoasignacion');
                                let isCheck = context.newRecord.getValue('custrecord_flujo_de_alquiler');
                                let idItemRelacionado = objRecord.getValue('custrecord_ht_ot_item');
                                let textItemRelacionado = objRecord.getText('custrecord_ht_ot_item');
                                let busquedaTipoActivo = search.lookupFields({ type: search.Type.ITEM, id: idItemRelacionado, columns: ['custitem_ht_ar_tipoactivo'] });
                                let item_tipo_activoId = (busquedaTipoActivo.custitem_ht_ar_tipoactivo)[0].value;
                                let item_tipo_activoText = (busquedaTipoActivo.custitem_ht_ar_tipoactivo)[0].text;
                                let historial_orden_de_servicio_id = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                                let historial_id_cliente = objRecord.getValue('custrecord_ht_ot_cliente_id');
                                // var historial_descripcion = objRecord.getValue('custrecord_ht_hs_descripcion');
                                // var historial_fecha_trabajo = objRecord.getValue('custrecord_ht_ot_fechatrabajoasignacion');
                                let historial_vid_auto = objRecord.getValue('custrecord_ht_ot_vehiculo');
                                let historial_placa = objRecord.getValue('custrecord_ht_ot_placa');
                                let historial_marca = objRecord.getValue('custrecord_ht_ot_marca');
                                let historial_tipo = objRecord.getValue('custrecord_ht_ot_tipo');
                                let historial_motor = objRecord.getValue('custrecord_ht_ot_motor');
                                let busqueda_sales_order = search.lookupFields({
                                    type: search.Type.SALES_ORDER,
                                    id: historial_orden_de_servicio_id,
                                    columns: ['custbody_ht_os_tipoordenservicio', 'trandate', 'location', 'subsidiary']
                                });
                                // var typeSalesOrder = (busqueda_sales_order.custbody_ht_os_tipoordenservicio)[0].text;
                                let dateSalesOrder = busqueda_sales_order.trandate;

                                let customrecord_asset_search = search.create({
                                    type: "customrecord_ncfar_asset",
                                    filters:
                                        [
                                            // ["custrecord_nmero_de_serie_dispositivo", "is", numSerieId]
                                            ["custrecord_assetserialno", "startswith", numSerieText]
                                        ],
                                    columns:
                                        [
                                            search.createColumn({ name: "custrecord_nmero_de_serie_dispositivo", label: "Número de Serie Dispositivo" }),
                                            search.createColumn({ name: "altname", label: "Name" })
                                        ]
                                });

                                let results = customrecord_asset_search.run().getRange({ start: 0, end: 1 });
                                //log.debug('results', results);
                                let historial_id_activo_fijo;
                                let nameDispositivo;

                                if (results.length > 0) {
                                    //if (false) {
                                    //EXISTE ACTIVO FIJO
                                    try {
                                        let historialSeguimiento;
                                        historial_id_activo_fijo = results[0].id;
                                        // log.debug('historial_id_activo_fijo', historial_id_activo_fijo);
                                        nameDispositivo = results[0].getValue({ name: 'altname' });
                                        // log.debug('nameDispositivo', nameDispositivo);
                                        // log.debug('Entro a flujo de: ', 'generar Historial en activo')
                                        //var descHistorial = textItemRelacionado + " " + itemDispositivoName.displayname + " " + numSerieText;
                                        let descHistorial = textItemRelacionado + " " + numSerieText;
                                        // log.debug('descHistorial', descHistorial);

                                        let objSearch = _controller.verifyExistHistorialAF(objParams);
                                        let searchResultCount = objSearch.runPaged().count;
                                        if (searchResultCount > 0) {
                                            objSearch.run().each(result => {
                                                historialSeguimiento = result.getValue({ name: "internalid" });
                                                return true;
                                            });
                                            let historial = record.load({ type: 'customrecord_ht_record_historialsegui', id: historialSeguimiento });
                                            historial.setValue('custrecord_ht_hs_numeroordenservicio', historial_orden_de_servicio_id);
                                            historial.setValue('custrecord_ht_hs_propietariocliente', historial_id_cliente);
                                            historial.setValue('custrecord_ht_hs_descripcion', descHistorial);
                                            historial.setText('custrecord_ht_hs_fechaordenservicio', dateSalesOrder);
                                            historial.setValue('custrecord_ht_hs_estado', estadoChaser);
                                            historial.setValue('custrecord_ht_hs_vidvehiculo', historial_vid_auto);
                                            historial.setValue('custrecord_ht_hs_placa', historial_placa);
                                            historial.setValue('custrecord_ht_hs_marca', historial_marca);
                                            historial.setValue('custrecord_ht_hs_tipo', historial_tipo);
                                            historial.setValue('custrecord_ht_hs_motor', historial_motor);
                                            historial.setValue('custrecord_ht_af_enlace', historial_id_activo_fijo);
                                            historial.save();
                                            log.debug('Termino crear historial');
                                        } else {
                                            let historial = record.create({ type: 'customrecord_ht_record_historialsegui', isDynamic: true });
                                            historial.setValue('custrecord_ht_hs_numeroordenservicio', historial_orden_de_servicio_id);
                                            historial.setValue('custrecord_ht_hs_propietariocliente', historial_id_cliente);
                                            historial.setValue('custrecord_ht_hs_descripcion', descHistorial);
                                            historial.setText('custrecord_ht_hs_fechaordenservicio', dateSalesOrder);
                                            historial.setValue('custrecord_ht_hs_estado', estadoChaser);
                                            historial.setValue('custrecord_ht_hs_vidvehiculo', historial_vid_auto);
                                            historial.setValue('custrecord_ht_hs_placa', historial_placa);
                                            historial.setValue('custrecord_ht_hs_marca', historial_marca);
                                            historial.setValue('custrecord_ht_hs_tipo', historial_tipo);
                                            historial.setValue('custrecord_ht_hs_motor', historial_motor);
                                            historial.setValue('custrecord_ht_af_enlace', historial_id_activo_fijo);
                                            historial.save();
                                            log.debug('Termino crear historial');
                                        }
                                    } catch (error) {
                                        log.error('EXISTE ACTIVO FIJO', error);
                                    }
                                } else {
                                    //NO EXISTE ACTIVO FIJO -> CREAR ACTIVO
                                    //Busqueda Dispositivo Serie
                                    try {
                                        let billOfMaterialRevision;
                                        //var filters = [["isinactive", "is", "F"], "AND", ["custrecord_ht_articulo_alquileractivo", "anyof", idItemRelacionado]];
                                        let bomRevisionResultSearch = search.create({
                                            type: "bomrevision",
                                            filters: [
                                                ["isinactive", "is", "F"],
                                                "AND",
                                                ["custrecord_ht_articulo_alquileractivo", "anyof", idItemRelacionado]
                                            ],
                                            columns: ["name"]
                                        }).run().getRange(0, 1);
                                        //log.debug('bomRevisionResultSearch', bomRevisionResultSearch);
                                        if (bomRevisionResultSearch.length != 0) {
                                            for (let i = 0; i < bomRevisionResultSearch.length; i++) {
                                                billOfMaterialRevision = bomRevisionResultSearch[i].id;
                                            }
                                            //log.debug('billOfMaterialRevision', billOfMaterialRevision);

                                            let recordRevision = record.load({ type: 'bomrevision', id: billOfMaterialRevision })
                                            let lineCountSublist = recordRevision.getLineCount({ sublistId: 'component' })
                                            let itemDispositivoId;
                                            //TODO: Revisar lógica, está trayendo el nombre del primer item que tiene 1, debe traer el nombre del dispositivo seleccionado en el ensamble.
                                            for (let j = 0; j < lineCountSublist; j++) {
                                                let currentItemSub = recordRevision.getSublistText({ sublistId: 'component', fieldId: 'item', line: j }).toLowerCase();
                                                let currentQuantiSub = recordRevision.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line: j });

                                                if (currentItemSub.indexOf('dispositivo') && currentQuantiSub == 1) {
                                                    itemDispositivoId = recordRevision.getSublistValue({ sublistId: 'component', fieldId: 'item', line: j });
                                                    break;
                                                }
                                            }

                                            //ITEM NOMBRE DISPOSITIVO
                                            let itemDispositivoName = search.lookupFields({
                                                type: 'serializedinventoryitem',
                                                id: itemDispositivoId,
                                                columns: ['displayname']
                                            });

                                            //BUSQUEDA PARA CONSEGUIR ID DE AJUSTE DE INVENTARIO
                                            let inventoryadjustmentSearchObj = search.create({
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

                                            let resultsInvAdj = inventoryadjustmentSearchObj.run().getRange({ start: 0, end: 1000 });
                                            //log.debug('resultsInvAdj', resultsInvAdj);

                                            if (resultsInvAdj != 0) {
                                                let arrResult = [];
                                                for (let index = 0; index < resultsInvAdj.length; index++) {
                                                    let jsonTemp = {};
                                                    jsonTemp.adjInvId = resultsInvAdj[index].id;
                                                    jsonTemp.adjIdItem = resultsInvAdj[index].getValue({ name: 'item' });
                                                    jsonTemp.adjCreditAmount = resultsInvAdj[index].getValue({ name: 'creditamount' });
                                                    arrResult.push(jsonTemp);
                                                }
                                                log.debug('Montossssss', arrResult)
                                                // let currentInvAdjId;
                                                // for (let i = 0; i < arrResult.length; i++) {
                                                //     log.debug('Loop1', arrResult[i].adjIdItem + ' == ' +  itemDispositivoId)
                                                //     if (arrResult[i].adjIdItem == itemDispositivoId) {
                                                //         log.debug('Loop2', arrResult[i].adjIdItem + ' == ' +  itemDispositivoId)
                                                //         currentInvAdjId = arrResult[i].adjInvId;
                                                //         break;
                                                //     }
                                                // }

                                                //MONTO CREDITO TOTAL
                                                let creditoTotal = 0;
                                                for (let i = 0; i < arrResult.length; i++) {
                                                    // if (arrResult[i].adjInvId == currentInvAdjId) {
                                                    creditoTotal += Number(arrResult[i].adjCreditAmount);
                                                    // 
                                                }
                                                log.debug('creditoTotal', creditoTotal);
                                                // results[index].getValue({ name: 'debitfxamount' });
                                                // let asset_debit_amount = results[0].getValue({ name: 'debitfxamount' });


                                                //Valores de Nuevo Asset
                                                let datosTipoActivo = search.lookupFields({
                                                    type: 'customrecord_ncfar_assettype',
                                                    id: item_tipo_activoId,
                                                    columns: [
                                                        'custrecord_assettypeaccmethod',
                                                        'custrecord_assettyperesidperc',
                                                        'custrecord_assettypelifetime',
                                                        'custrecord_assettypedescription'
                                                    ]
                                                });

                                                let asset_tipo_activo = (datosTipoActivo.custrecord_assettypeaccmethod)[0].value;
                                                let asset_porcentaje_residual = datosTipoActivo.custrecord_assettyperesidperc.replace('%', '');
                                                let asset_tiempo_de_vida = datosTipoActivo.custrecord_assettypelifetime;
                                                //let dateNow = _controller.getDateNow();

                                                log.error("values", { itemDispositivoName, item_tipo_activoId, creditoTotal, busqueda_sales_order, asset_porcentaje_residual, asset_tipo_activo, asset_tiempo_de_vida });
                                                var fixedAsset = record.create({ type: 'customrecord_ncfar_asset', isDynamic: true });
                                                creditoTotal = Math.round(creditoTotal * 100) / 100;

                                                fixedAsset.setValue('altname', itemDispositivoName.displayname);
                                                fixedAsset.setValue('custrecord_assettype', item_tipo_activoId);
                                                fixedAsset.setValue('custrecord_assetcost', creditoTotal);
                                                fixedAsset.setValue('custrecord_assetlifetime', asset_tiempo_de_vida);
                                                //fixedAsset.setValue('custrecord_assetresidualperc', Number(asset_porcentaje_residual));
                                                fixedAsset.setValue('custrecord_assetcurrentcost', creditoTotal);
                                                fixedAsset.setValue('custrecord_assetbookvalue', creditoTotal);
                                                fixedAsset.setValue('custrecord_assetlocation', busqueda_sales_order.location[0].value);
                                                fixedAsset.setValue('custrecord_assetsubsidiary', busqueda_sales_order.subsidiary[0].value);
                                                var today = new Date();
                                                fixedAsset.setValue('custrecord_assetpurchasedate', today);
                                                fixedAsset.setValue('custrecord_assetdeprstartdate', today);
                                                fixedAsset.setValue('custrecord_assetdeprenddate', new Date(today.getFullYear(), today.getMonth() + Number(asset_tiempo_de_vida), today.getDate() - 1));
                                                fixedAsset.setValue('custrecord_nmero_de_serie_dispositivo', numSerieId);
                                                fixedAsset.setValue('custrecord_assetbookvalue', creditoTotal);
                                                fixedAsset.setValue('custrecord_assetresidualvalue', 1);
                                                fixedAsset.setValue('custrecord_assetserialno', numSerieText);
                                                //fixedAsset.setValue('custrecord_assetbookvalue', creditoTotal);
                                                //fixedAsset.setValue('custrecord_assetresidualperc', Number(asset_porcentaje_residual));
                                                //fixedAsset.setValue('custrecord_assetaccmethod', asset_tipo_activo);

                                                var id_new_asset = fixedAsset.save();
                                                var fixedAsset = record.load({ type: "customrecord_ncfar_asset", id: id_new_asset });
                                                var assetValuesId = createAssetValues(fixedAsset);
                                                fixedAsset.setValue('custrecord_assetvals', assetValuesId);
                                                fixedAsset.save();
                                                var adquisicionId = createAcquisitionHistoryFromRecord(fixedAsset);
                                                log.error("adquisicionId", adquisicionId);
                                                // log.debug('id_new_asset', id_new_asset);
                                                // log.debug('Termino crear activo');

                                                let historial = record.create({ type: 'customrecord_ht_record_historialsegui', isDynamic: true });
                                                let descHistorial = textItemRelacionado + ' ' + itemDispositivoName.displayname + ' ' + numSerieText
                                                historial.setValue('custrecord_ht_hs_numeroordenservicio', historial_orden_de_servicio_id);
                                                historial.setValue('custrecord_ht_hs_propietariocliente', historial_id_cliente);
                                                historial.setValue('custrecord_ht_hs_descripcion', descHistorial);
                                                historial.setText('custrecord_ht_hs_fechaordenservicio', dateSalesOrder);
                                                historial.setValue('custrecord_ht_hs_estado', estadoChaser);
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
                                    } catch (error) {
                                        log.error('NO EXISTE ACTIVO FIJO', error);
                                    }
                                }
                            }
                        }

                        if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
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
                                try { //TODO: Revisar para lojacks 1
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
                                } catch (error) {
                                    log.error('Chequeo', 'No es Monitoreo');
                                }

                                try { //TODO: Revisar para lojacks 2
                                    let dispositivo = search.lookupFields({
                                        type: 'customrecord_ht_record_mantchaser',
                                        id: serieChaser,
                                        columns: ['custrecord_ht_mc_seriedispositivolojack']
                                    });
                                    let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;

                                    record.submitFields({
                                        type: 'customrecord_ht_record_detallechaslojack',
                                        id: idDispositivo,
                                        values: { 'custrecord_ht_cl_estado': estadoChaser },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });
                                } catch (error) {
                                    log.error('Chequeo', 'No es Lojack');
                                }

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

                        if (adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP && statusOri == _constant.Status.CHEQUEADO) {//TODO: Revisar actualziaciones cuando es locjack, ya que no tiene simcard
                            if (esAlquiler == _constant.Valor.SI) {
                                log.debug('Alquiler', 'Es alquiler');
                                if (tag == _constant.Valor.VALOR_LOJ_LOJACK)
                                    objParams.tag = tag

                                try {
                                    let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams);
                                    log.debug('ajusteInv', ajusteInv);
                                    // let newAdjust = record.create({ type: 'customrecord_ht_ajuste_relacionados', isDynamic: true });
                                    // newAdjust.setValue({ fieldId: 'custrecord_ts_ajuste_rela_orden_trabajo', value: id });
                                    // newAdjust.setValue({ fieldId: 'custrecord_ts_ajuste_rela_transacci_gene', value: ajusteInv });
                                    // newAdjust.setValue({ fieldId: 'custrecord_ts_ajuste_rela_fecha', value: new Date() });
                                    // let registroAjusteEntrada = newAdjust.save();
                                    // log.debug('registroAjusteEntrada', registroAjusteEntrada);
                                } catch (error) { }

                                try {
                                    let returnHistorial = _controller.updateHistorialAF(objParams);
                                    log.debug('returnHistorial', returnHistorial);
                                } catch (error) { }

                                try {
                                    let updateIns = _controller.updateInstall(objParams);
                                    log.debug('updateIns', updateIns);
                                } catch (error) { }

                                try {
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
                                    record.submitFields({
                                        type: 'customrecord_ht_record_detallechaserdisp',
                                        id: idDispositivo,
                                        values: { 'custrecord_ht_dd_estado': _constant.Status.DISPONIBLE },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });

                                    try {
                                        let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechasersim',
                                            id: idSimCard,
                                            values: { 'custrecord_ht_ds_estado': _constant.Status.INACTIVO },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                    } catch (error) {
                                        log.error('Lojack', 'Dispositivo Lojack, no tiene SIM Card.');
                                    }
                                } catch (error) { }
                            }

                            if (entregaCliente == _constant.Valor.SI || esGarantia == _constant.Valor.SI) {
                                log.debug('entrgaCliente', 'es Entrega Cliente o Garantía');
                                let updateIns = _controller.updateInstall(objParams);
                                log.debug('updateIns', updateIns);
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
                                    values: { 'custrecord_ht_dd_estado': _constant.Status.DISPONIBLE },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                record.submitFields({
                                    type: 'customrecord_ht_record_detallechasersim',
                                    id: idSimCard,
                                    values: { 'custrecord_ht_ds_estado': _constant.Status.INACTIVO },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                if (esGarantia == _constant.Valor.SI) {
                                    log.debug('Custodia', 'Es custodia');
                                    const deposito = _controller.getBinNumberRevision(objParams.location);
                                    objParams.deposito = deposito;
                                    objParams.boleano = true;
                                    let dispositivo = search.lookupFields({
                                        type: 'customrecord_ht_record_mantchaser',
                                        id: serieChaser,
                                        columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard']
                                    });
                                    let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                    let dispo = search.lookupFields({
                                        type: 'customrecord_ht_record_detallechaserdisp',
                                        id: idDispositivo,
                                        columns: ['custrecord_ht_dd_dispositivo']
                                    });
                                    objParams.dispositivo = dispo.custrecord_ht_dd_dispositivo[0].value;
                                    let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, 0, 3);
                                    log.debug('ajusteInv', ajusteInv);
                                }
                            }

                            if (entradaCustodia == _constant.Valor.SI) {
                                log.debug('Flujo Custodia', 'Es custodia');
                                const deposito = _controller.getBinNumberCustodia(objParams.location, _constant.Constants.FLUJO_CUSTODIA);
                                objParams.deposito = deposito;
                                objParams.boleano = true;
                                let updateIns = _controller.updateInstall(objParams);
                                log.debug('updateIns', updateIns);
                                if (tag == _constant.Valor.VALOR_LOJ_LOJACK) {
                                    //LOJACK
                                    log.debug('TAG', 'LOJACK: ' + tag)
                                    record.submitFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieProducto,
                                        values: {
                                            'custrecord_ht_mc_ubicacion': ubicacion,
                                            'custrecord_ht_mc_estadolojack': estadoChaser
                                        },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });

                                    let dispositivo = search.lookupFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieProducto,
                                        columns: ['custrecord_ht_mc_seriedispositivolojack']
                                    });
                                    let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;

                                    record.submitFields({
                                        type: 'customrecord_ht_record_detallechaslojack',
                                        id: idDispositivo,
                                        values: { 'custrecord_ht_cl_estado': estadoChaser },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });

                                    let dispo = search.lookupFields({
                                        type: 'customrecord_ht_record_detallechaslojack',
                                        id: idDispositivo,
                                        columns: ['custrecord_ht_cl_lojack']
                                    });
                                    device = dispo.custrecord_ht_cl_lojack[0].value;
                                } else {
                                    log.debug('TAG', 'MONITOREO/CARGO: ' + tag)
                                    record.submitFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieChaser,
                                        values: {
                                            'custrecord_ht_mc_estado': estadoChaser,
                                            'custrecord_ht_mc_estadolodispositivo': estadoChaser,
                                        },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });

                                    let dispositivo = search.lookupFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieChaser,
                                        columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard']
                                    });
                                    let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                    record.submitFields({
                                        type: 'customrecord_ht_record_detallechaserdisp',
                                        id: idDispositivo,
                                        values: { 'custrecord_ht_dd_estado': _constant.Status.DISPONIBLE },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });

                                    try {
                                        let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechasersim',
                                            id: idSimCard,
                                            values: { 'custrecord_ht_ds_estado': _constant.Status.INACTIVO },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                    } catch (error) {
                                        log.error('CHASER', 'No Tiene Sim Card');
                                    }
                                    let dispo = search.lookupFields({
                                        type: 'customrecord_ht_record_detallechaserdisp',
                                        id: idDispositivo,
                                        columns: ['custrecord_ht_dd_dispositivo']
                                    });
                                    device = dispo.custrecord_ht_dd_dispositivo[0].value;
                                }
                                objParams.dispositivo = device
                                let returnRegistroCustodia = _controller.createRegistroCustodia(objParams);
                                try {
                                    let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, 0, _constant.Constants.FLUJO_CUSTODIA);
                                    log.debug('ajusteInv', ajusteInv);
                                } catch (error) { }
                                log.debug('returnRegistroCustodia', returnRegistroCustodia);
                            }

                            // if (envioPX == _constant.Valor.SI) {
                            try {
                                returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                log.debug('DESACTIVACIÓN-PX', returEjerepo);
                            } catch (error) {

                            }

                            // }

                            if (envioTele == _constant.Valor.SI) {
                                returEjerepo = _controller.parametros(_constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, id, adp);
                                log.debug('DESACTIVACIÓN-TM', returEjerepo);
                            }
                        }
                        break;
                    default:
                }

                if (noChequeado == 1) {
                    record.submitFields({
                        type: objRecord.type,
                        id: id,
                        values: { 'custrecord_ht_ot_estado': _constant.Status.PROCESANDO },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                }
            }
        }

        function createAssetValues(newRec) {
            var deprStartDate = newRec.getValue({ fieldId: 'custrecord_assetdeprstartdate' });
            var lastDeprDate = newRec.getValue({ fieldId: 'custrecord_assetlastdeprdate' });
            var lastForecastDate = deprStartDate > lastDeprDate ?
                new Date(deprStartDate.getFullYear(),
                    deprStartDate.getMonth(),
                    deprStartDate.getDate() - 1)
                : lastDeprDate;
            var bookValue = newRec.getValue({ fieldId: 'custrecord_assetcost' });
            var lastDeprAmt = newRec.getValue({ fieldId: 'custrecord_assetlastdepramt' });
            var lastPeriod = newRec.getValue({ fieldId: 'custrecord_assetcurrentage' });

            var assetValues = record.create({ type: 'customrecord_fam_assetvalues' });
            assetValues.setValue({ fieldId: 'custrecord_slaveparentasset', value: newRec.id });

            assetValues.setValue({
                fieldId: 'custrecord_slavelastforecastdate',
                value: format.parse({ value: lastForecastDate, type: format.Type.DATE })
            });
            assetValues.setValue({ fieldId: 'custrecord_slavebookvalue', value: bookValue });
            assetValues.setValue({ fieldId: 'custrecord_slavelastdepramt', value: lastDeprAmt });
            assetValues.setValue({
                fieldId: 'custrecord_slavelastdeprdate',
                value: format.parse({ value: lastDeprDate, type: format.Type.DATE })
            });
            assetValues.setValue({ fieldId: 'custrecord_slavecurrentage', value: lastPeriod });
            assetValues.setValue({ fieldId: 'custrecord_slavepriornbv', value: bookValue });
            var assetValuesId = assetValues.save();
            log.error("assetValuesId", assetValuesId);
            return assetValuesId;
        }

        function createAcquisitionHistoryFromRecord(taxRec) {
            /*    
                        var DHR_DEFAULT_NAME = 'dhr-default-name';
            
                        
                        var dhrValues = {
                            name            : DHR_DEFAULT_NAME,
                            asset           : taxRec.getValue({fieldId : 'custrecord_altdeprasset'}),
                            altDepr         : taxRec.id,
                            altMethod       : taxRec.getValue({fieldId : 'custrecord_altdepraltmethod'}),
                            actDeprMethod   : taxRec.getValue({fieldId : 'custrecord_altdeprmethod'}),
                            book            : taxRec.getValue({fieldId : 'custrecord_altdepr_accountingbook'}),
                            assetType       : taxRec.getValue({fieldId : 'custrecord_altdepr_assettype'}),
                            transType       : customList.TransactionType.Acquisition,
                            date            : purchaseDate || taxRec.getValue({fieldId : 'custrecord_altdeprstartdeprdate'}),
                            transAmount     : taxRec.getValue({fieldId : 'custrecord_altdepr_originalcost'}),
                            nbv             : taxRec.getValue({fieldId : 'custrecord_altdepr_originalcost'}),
                            quantity        : +assetQty
                        };
                
                      dhrValues.subsidiary = taxRec.getValue({fieldId : 'custrecord_altdepr_subsidiary'});
            */
            var history = record.create({
                type: "customrecord_ncfar_deprhistory"
            });
            history.setValue("name", "dhr-default-name");
            history.setValue("custrecord_deprhistasset", taxRec.id);
            //history.setValue("custrecord_deprhistaltdepr", taxRec.id);
            history.setValue("custrecord_deprhistaltmethod", taxRec.getValue({ fieldId: 'custrecord_altdepraltmethod' }));
            history.setValue("custrecord_deprhistdeprmethod", taxRec.getValue({ fieldId: 'custrecord_altdeprmethod' }));
            history.setValue("custrecord_deprhistaccountingbook", 1);
            history.setValue("custrecord_deprhistassettype", taxRec.getValue({ fieldId: 'custrecord_assettype' }));
            history.setValue("custrecord_deprhisttype", 1);
            history.setValue("custrecord_deprhistdate", taxRec.getValue({ fieldId: 'custrecord_assetdeprstartdate' }));
            history.setValue("custrecord_deprhistamount", taxRec.getValue({ fieldId: 'custrecord_assetcost' }));
            history.setValue("custrecord_deprhistbookvalue", taxRec.getValue({ fieldId: 'custrecord_assetcost' }));
            history.setValue("custrecord_deprhistquantity", taxRec.getValue({ fieldId: 'custrecord_ncfar_quantity' }));
            return history.save();
        };

        function getSalesOrderItem(idBien) {
            try {
                let busqueda = search.create({
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
                let savedsearch = busqueda.run().getRange(0, 100);
                let internalidItem = '';
                let internalid = '';
                let arrayIdTotal = [];
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        let arrayId = [];
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

        function getInventoryNumber(inventorynumber, item) {
            try {
                var busqueda = search.create({
                    type: "inventorynumber",
                    filters:
                        [
                            // ["inventorynumber", "is", inventorynumber],
                            ["inventorynumber", "startswith", inventorynumber],
                            "AND",
                            ["item", "anyof", item],
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
            } catch (e) { }
        }

        const createEnsambleGarantiaButton = (form, objRecord) => {
            let itemName = objRecord.getText('custrecord_ht_ot_item') || "";
            itemName = itemName.toLowerCase()
            let itemVenta = objRecord.getValue('custrecord_ts_item_venta_garantia') || "";
            if (!(itemName.includes('gara') && itemVenta)) return;
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
            const ensambleGarantia = `ensambleGarantia('${itemVenta}', '${location}', '${workorder}', '${salesorder}', '${customer}')`;
            form.addButton({ id: 'custpage_btngarantia', label: 'Ensamble Garantía', functionName: ensambleGarantia });
        }

        const createEnsambleCustodiaButton = (form, objRecord) => {
            let itemName = objRecord.getText('custrecord_ht_ot_item') || "";
            itemName = itemName.toLowerCase();
            if (!itemName.includes('cust')) return;
            let salesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let workorder = objRecord.id;
            let customer = objRecord.getValue('custrecord_ht_ot_cliente_id');
            let item = objRecord.getValue('custrecord_ht_ot_item');
            let relateditem = objRecord.getValue('custrecord_ht_ot_itemrelacionado');
            let location = "";
            if (salesorder) {
                locationSearch = search.lookupFields({
                    type: 'salesorder', id: salesorder, columns: ['location']
                });
                location = locationSearch.location[0].value;
            }
            const ensambleCustodia = `ensambleCustodia('${item}', '${relateditem}', '${location}', '${workorder}', '${salesorder}', '${customer}')`;
            form.addButton({ id: 'custpage_btnalquiler', label: 'Reinstalación de Custodia', functionName: ensambleCustodia });
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























