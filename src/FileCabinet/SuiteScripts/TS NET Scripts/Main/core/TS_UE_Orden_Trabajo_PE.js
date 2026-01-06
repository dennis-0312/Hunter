/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo)
/*********************************************************************************************************************************************
File Name: TS_UE_Orden_Trabajo.js
Commit: 01
Version: 1.0
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: PR
Governance points: N/A
InternalID NetSuite : 798
ID NetSuite: customscript_ts_ue_orden_trabajo
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
    'N/ui/message',
    'N/query',
    'N/file',
    'N/task',
    '../controller/TS_CM_Controller_PE',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
],
    (transaction, config, log, search, record, serverWidget, https, error, format, email, runtime, message, query, file, task, _controller, _constant, _errorMessage) => {

        const beforeLoad = (context) => {
            // DETECTAR PARÁMETROS DEL ENSAMBLE ALQUILER
            if (context.request && context.request.parameters) {
                // log.debug('ALQUILER-PARAMS-RECEIVED', {
                //     all_parameters: context.request.parameters,
                //     datos_tecnicos: context.request.parameters.custpage_field_datos_tecnicos,
                //     has_datos_tecnicos: !!context.request.parameters.custpage_field_datos_tecnicos,
                //     request_method: context.request.method,
                //     timestamp: new Date().toISOString()
                // });

                // Si viene el parámetro de datos técnicos del suitelet, procesarlo
                if (context.request.parameters.custpage_field_datos_tecnicos) {
                    log.debug('PROCESANDO-DATOS-TECNICOS-INICIO', {
                        datos_tecnicos_id: context.request.parameters.custpage_field_datos_tecnicos,
                        orden_trabajo_id: context.newRecord.id
                    });
                    procesarDatosTecnicos(context);
                }
            }

            let configRecObj = config.load({ type: config.Type.COMPANY_INFORMATION });
            const URL = configRecObj.getValue({ fieldId: 'appurl' });
            let objRecord = context.newRecord;
            let id = context.newRecord.id;
            let form = context.form;
            let type_event = context.type;
            let paralizador = 0, boton_panico = 0;

            if (type_event == context.UserEventType.VIEW || type_event == context.UserEventType.EDIT) {
                let serviceOrderid = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                if (serviceOrderid.length > 0) {
                    let sql = 'SELECT so.status as estado FROM customrecord_ht_record_ordentrabajo ot ' +
                        'INNER JOIN transaction so ON ot.custrecord_ht_ot_orden_servicio = so.id ' +
                        'WHERE ot.custrecord_ht_ot_orden_servicio = ? FETCH FIRST 1 ROWS ONLY';
                    let params = [serviceOrderid]
                    let resultSet = query.runSuiteQL({ query: sql, params: params });
                    let results = resultSet.asMappedResults();
                    if (results.length > 0) {
                        if (results[0]['estado'] == 'A') {
                            let messageObj = message.create({
                                type: message.Type.WARNING,
                                title: 'Orden de Servicio PENDIENTE de APROBACIÓN!',
                                message: 'Póngase en contacto con su supervisor antes de continuar.',
                                //duration: 10000
                            });
                            form.addPageInitMessage({ message: messageObj });
                        }

                        if (results[0]['estado'] == 'H' || results[0]['estado'] == 'C') {
                            let messageObj = message.create({
                                type: message.Type.ERROR,
                                title: 'Orden de Servicio CERRADA o CANCELADA!',
                                message: 'Póngase en contacto con su supervisor antes de continuar.',
                                //duration: 10000
                            });
                            form.addPageInitMessage({ message: messageObj });
                        }
                    }
                    //log.debug('SEVICIOS', objRecord.getValue('custrecord_ht_ot_servicios_commands'))
                }

                let sql2 = 'SELECT custrecord_ts_reg_imp_plt_estado as estado FROM customrecord_ts_regis_impulso_plataforma ' +
                    'WHERE custrecord_ts_reg_imp_plt_ordentrabajo = ? ' +
                    'ORDER BY id DESC FETCH FIRST 1 ROWS ONLY';
                let results2 = query.runSuiteQL({ query: sql2, params: [id] }).asMappedResults();
                if (results2.length > 0) {
                    if (results2[0].estado === 'error') {
                        let messageObj = message.create({
                            type: message.Type.ERROR,
                            title: 'Ocurrio un error con las plataformas.',
                            message: 'Póngase en contacto con el área de soporte.',
                            //duration: 10000
                        });
                        form.addPageInitMessage({ message: messageObj });
                    }
                }

                if (type_event == context.UserEventType.VIEW) {
                    if (objRecord.getValue('custrecord_ht_ot_estado') == _constant.Status.CHEQUEADO) {
                        let messageObj = message.create({
                            type: message.Type.CONFIRMATION,
                            title: 'Orden de Trabajo Chequeada',
                            message: 'La Orden de Trabajo ha sido Chequeda Correctamente.',
                            //duration: 10000
                        });
                        form.addPageInitMessage({ message: messageObj });
                    }
                }
            }

            if (type_event == context.UserEventType.VIEW) {
                // let fechaChequeo = objRecord.getValue('custrecord_ht_ot_fechatrabajoasignacion');
                // log.debug('fechaChequeo', `${fechaChequeo} - ${fechaChequeo.toISOString().length} - ${typeof fechaChequeo} - ${objRecord.getText('custrecord_ht_ot_fechatrabajoasignacion')}`);
                // let resturnFecha = convertFechaFinalToCobertura(fechaChequeo)
                //log.debug('resturnFecha', resturnFecha)
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
                        let existAssembly = validateExistAssemblyForOT(id);
                        if (!existAssembly) {
                            form.addButton({
                                id: 'custpage_ts_fabricarproducto',
                                label: 'Ensamble de Dispositivo',
                                functionName: 'ensambleDispositivo(' + idOrdenTrabajo + ')'
                            });
                        }
                    }
                }

                if (estado == _constant.Status.PROCESANDO || estado == _constant.Status.CHEQUEADO) {
                    let flujoCustodia = objRecord.getValue('custrecord_flujo_de_custodia');
                    let flujoAlquiler = objRecord.getValue('custrecord_flujo_de_alquiler');

                    if (serieDispositivo.length > 0 ||
                        objRecord.getValue('custrecord_ht_ot_others_installs') == true ||
                        objRecord.getValue('custrecord_ht_ot_flu_acc') ||
                        flujoCustodia == true ||
                        flujoAlquiler == true) {

                        // log.debug('CHEQUEO-BUTTON-CONDITIONS', {
                        //     serieDispositivo_length: serieDispositivo.length,
                        //     others_installs: objRecord.getValue('custrecord_ht_ot_others_installs'),
                        //     flu_acc: objRecord.getValue('custrecord_ht_ot_flu_acc'),
                        //     flujo_custodia: flujoCustodia,
                        //     flujo_alquiler: flujoAlquiler,
                        //     estado: estado,
                        //     mostrar_button: true
                        // });

                        form.addButton({
                            id: 'custpage_ts_chequeo',
                            label: 'Chequear Orden',
                            functionName: 'chequearOrden(' + id + ')'
                        });
                    } else {
                        log.debug('CHEQUEO-BUTTON-NOT-SHOWN', {
                            serieDispositivo_length: serieDispositivo.length,
                            others_installs: objRecord.getValue('custrecord_ht_ot_others_installs'),
                            flu_acc: objRecord.getValue('custrecord_ht_ot_flu_acc'),
                            flujo_custodia: flujoCustodia,
                            flujo_alquiler: flujoAlquiler,
                            estado: estado,
                            razon: 'Ninguna condición se cumple'
                        });
                    }
                }

                form.getField('custrecord_ht_ot_termometro').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                if (!objRecord.getValue('custrecord_ht_ot_serieproductoasignacion')) {
                    createEnsambleAlquilerButton(form, objRecord);
                    createEnsambleCustodiaButton(form, objRecord);
                    createEnsambleGarantiaButton(form, objRecord);
                }

                if (estado == _constant.Status.CHEQUEADO) {
                    //createCertificadoInstalacionButton(form, objRecord);
                    createCertificadoPropiedadButton(form, objRecord);
                }
                form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo_PE.js';

                // let taxNumber = search.lookupFields({
                //     type: 'customer',
                //     id: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                //     columns: ['vatregnumber', 'custentity_ts_ec_tipo_persona']
                // })
                showPlataformaErrors(form);
            } else if (type_event == context.UserEventType.EDIT) {
                // createEnsambleAlquilerButton(form, objRecord);
                // createEnsambleCustodiaButton(form, objRecord);
                // createEnsambleGarantiaButton(form, objRecord);
                // form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';
            }
        }

        const procesarDatosTecnicos = (context) => {
            try {
                let datosTecnicos = context.request.parameters.custpage_field_datos_tecnicos;
                let objRecord = context.newRecord;

                log.debug('PROCESANDO-DATOS-TECNICOS', {
                    datos_tecnicos: datosTecnicos,
                    orden_trabajo_id: objRecord.id,
                    all_request_params: context.request.parameters,
                    tiene_mantchaser_data: !!datosTecnicos,
                    timestamp: new Date().toISOString()
                });

                if (datosTecnicos && objRecord.id) {
                    // Buscar datos del mantchaser
                    let mantchaserSearch = search.create({
                        type: 'customrecord_ht_record_mantchaser',
                        filters: [
                            ['internalid', 'anyof', datosTecnicos]
                        ],
                        columns: [
                            'internalid',
                            'name',
                            'custrecord_ht_mc_seriedispositivo'
                        ]
                    });

                    let mantchaserResults = mantchaserSearch.run().getRange(0, 1);

                    log.debug('MANTCHASER-SEARCH-RESULTS', {
                        mantchaser_id: datosTecnicos,
                        results_found: mantchaserResults.length,
                        results: mantchaserResults.length > 0 ? {
                            serie: mantchaserResults[0].getValue('internalid'),
                            dispositivo: mantchaserResults[0].getValue('name'),
                            name: mantchaserResults[0].getValue('name')
                        } : null,
                        timestamp: new Date().toISOString()
                    });

                    if (mantchaserResults.length > 0) {
                        // Cargar el record para editarlo
                        let ordenTrabajoRecord = record.load({
                            type: 'customrecord_ht_record_ordentrabajo',
                            id: objRecord.id
                        });

                        // Actualizar campos con datos del mantchaser
                        let serieProducto = mantchaserResults[0].getValue('internalid');
                        let dispositivo = mantchaserResults[0].getValue('name');
                        let serieDispositivoId = mantchaserResults[0].getValue('custrecord_ht_mc_seriedispositivo');

                        // Buscar VID en el detalle del dispositivo si existe
                        let vid = null;
                        if (serieDispositivoId) {
                            try {
                                let deviceDetailSearch = search.create({
                                    type: 'customrecord_ht_record_detallechaserdisp',
                                    filters: [
                                        ['internalid', 'anyof', serieDispositivoId]
                                    ],
                                    columns: [
                                        'custrecord_ht_dd_vid',
                                        'custrecord_ht_dd_dispositivo'
                                    ]
                                });

                                deviceDetailSearch.run().each(function (deviceResult) {
                                    vid = deviceResult.getValue('custrecord_ht_dd_vid');
                                    return false; // solo el primero
                                });

                                log.debug('VID-SEARCH-ALQUILER', {
                                    dispositivo_id: serieDispositivoId,
                                    vid_encontrado: vid,
                                    timestamp: new Date().toISOString()
                                });
                            } catch (e) {
                                log.error('ERROR-BUSCAR-VID-ALQUILER', e.message);
                            }
                        }

                        if (serieProducto) {
                            ordenTrabajoRecord.setValue({
                                fieldId: 'custrecord_ht_ot_serieproductoasignacion',
                                value: serieProducto
                            });
                        }

                        if (dispositivo) {
                            ordenTrabajoRecord.setValue({
                                fieldId: 'custrecord_ht_ot_dispositivo',
                                value: dispositivo
                            });
                        }

                        // AGREGAR VID si se encontró
                        if (vid) {
                            ordenTrabajoRecord.setValue({
                                fieldId: 'custrecord_ht_ot_vid',
                                value: vid
                            });
                        }

                        let recordId = ordenTrabajoRecord.save();

                        log.debug('DATOS-TECNICOS-GUARDADOS', {
                            record_id: recordId,
                            serie_producto_guardado: serieProducto,
                            dispositivo_guardado: dispositivo,
                            vid_guardado: vid,
                            mantchaser_id: datosTecnicos,
                            timestamp: new Date().toISOString()
                        });

                        // Mostrar mensaje de éxito en el form
                        let form = context.form;
                        if (form) {
                            let messageObj = message.create({
                                type: message.Type.CONFIRMATION,
                                title: 'Ensamble Alquiler Procesado',
                                message: `Los datos técnicos del ensamble alquiler han sido procesados exitosamente. Serie: ${serieProducto || 'N/A'}, Dispositivo: ${dispositivo || 'N/A'}, VID: ${vid || 'N/A'}`
                            });
                            form.addPageInitMessage({ message: messageObj });
                        }
                    } else {
                        log.error('MANTCHASER-NO-ENCONTRADO', {
                            mantchaser_id: datosTecnicos,
                            timestamp: new Date().toISOString()
                        });

                        // Mostrar mensaje de advertencia
                        let form = context.form;
                        if (form) {
                            let messageObj = message.create({
                                type: message.Type.WARNING,
                                title: 'Mantchaser No Encontrado',
                                message: `No se encontraron datos técnicos para el ID: ${datosTecnicos}`
                            });
                            form.addPageInitMessage({ message: messageObj });
                        }
                    }
                } else {
                    log.debug('DATOS-TECNICOS-NO-DISPONIBLES', {
                        datos_tecnicos: datosTecnicos,
                        record_id: objRecord.id,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                log.error('ERROR-PROCESANDO-DATOS-TECNICOS', {
                    error: error.toString(),
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });

                // Mostrar mensaje de error al usuario
                let form = context.form;
                if (form) {
                    let messageObj = message.create({
                        type: message.Type.ERROR,
                        title: 'Error al Procesar Ensamble Alquiler',
                        message: `Error procesando datos técnicos: ${error.message}`
                    });
                    form.addPageInitMessage({ message: messageObj });
                }
            }
        }

        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.EDIT) {
                let senderId = runtime.getCurrentUser();
                senderId = senderId.id;
                let timeFormat = runtime.getCurrentUser().getPreference({ name: 'timeformat' });
                log.debug('FLOW-PE', `afterSubmit start | ot=${context.newRecord.id} | type=${context.type}`);
                let objRecord = context.newRecord;
                let accionEstadoOT = 'Sin estado';
                let id = context.newRecord.id;
                let impulsaPX = 1;
                let impulsaTelematics = 1;
                let adpServicio = 0;
                let adpActivados;
                let estaChequeada = objRecord.getValue('custrecord_ht_ot_estado');
                let fechaChequeo = objRecord.getValue('custrecord_ht_ot_fechatrabajoasignacion');
                let valoresPermitidos = ["317", "319", "320"];
                let ubicacionOT = objRecord.getValue('custrecord_ht_ot_ubicacion');
                let ubicacionTextoOT = objRecord.getText('custrecord_ht_ot_ubicacion');

                // DECLARAR VARIABLES DE TIEMPO AL INICIO DEL SCOPE - SOLO LAS QUE NECESITAMOS
                let cantidad = 0;
                let undTiempo = '';
                let noChequeado = 0;
                let flujoAccesorio = objRecord.getValue('custrecord_ht_ot_flu_acc');
                let esCambioSimCard = false;
                let esItemRepuesto = false;
                let ejecutarFulFillment = 1;
                let entregaCustodia = 0;
                let estadoInts;
                let esEntregaCustodia = 0;
                let yaFinalizadoPX = objRecord.getValue('custrecord_ht_ot_pxadminfinalizacion');
                let desinstalacionPxYaProgramada = false;
                let mantenimientoPxYaProgramada = false;

                // Logs para verificar ubicación
                log.debug('UBICACION-DEBUG-VALOR', `ubicacionOT: ${ubicacionOT}`);
                log.debug('UBICACION-DEBUG-TEXTO', `ubicacionTextoOT: ${ubicacionTextoOT}`);


                if (!fechaChequeo) {
                    fechaChequeo = getFechaChequeo();
                }
                let ingresaFlujoAlquiler;
                let statusOri = estaChequeada;
                let ingresaFlujoConvenio;
                let ingresaFlujoGarantiaReinstalación;
                let serializedinventoryitemDispLojack;
                let esActivados = false;
                //Cambio JCEC 20/08/2024
                if (estaChequeada > 0) {
                    accionEstadoOT = estaChequeada;
                    //accionEstadoOT = _constant.Status.CHEQUEADO
                }
                switch (parseInt(accionEstadoOT)) {
                    case _constant.Status.CHEQUEADO:
                        let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                        let valueSalesorder = objRecord.getText('custrecord_ht_ot_orden_servicio');
                        let bien = objRecord.getValue('custrecord_ht_ot_vehiculo');

                        let valuebien = objRecord.getText('custrecord_ht_ot_vehiculo');
                        let coberturas = _controller.getCobertura(bien);
                        ingresaFlujoGarantiaReinstalación = objRecord.getValue('custrecord_flujo_de_garantia');
                        ingresaFlujoConvenio = objRecord.getValue('custrecord_flujo_de_convenio');
                        let famProducto = objRecord.getValue('custrecord_ht_ot_producto');
                        let idItemRelacionadoOT = objRecord.getValue('custrecord_ht_ot_itemrelacionado');
                        let adpActivados2 = _controller.getParameter(idItemRelacionadoOT, _constant.Codigo_parametro.COD_ADP_ACCION_DEL_PRODUCTO);
                        //log.debug('adpActivados.codigo != 0 && adpActivados.codigo == _constant.Codigo_Valor.COD_VALOR_051_ACTIVADOS', `${adpActivados2.codigo} != 0 && ${adpActivados2.codigo} == ${_constant.Codigo_Valor.COD_VALOR_051_ACTIVADOS}`)
                        if (adpActivados2.codigo != 0 && adpActivados2.codigo == _constant.Codigo_Valor.COD_VALOR_051_ACTIVADOS) {
                            esActivados = true
                        }
                        let busqueda_salesorder = ingresaFlujoConvenio ? getSalesOrderItem(idSalesorder, ingresaFlujoConvenio, famProducto) : esActivados ? getSalesOrderItemActivados(bien, ingresaFlujoConvenio, famProducto) : getSalesOrderItem(bien, ingresaFlujoConvenio, famProducto);
                        // const arrayUnico = [...new Set(busqueda_salesorder.flat())];
                        // busqueda_salesorder = [arrayUnico];
                        // LOG DETALLADO DE BÚSQUEDA DE SALESORDER
                        // log.debug('BUSQUEDA-SALESORDER-PARAMETROS', {
                        //     ingresaFlujoConvenio: ingresaFlujoConvenio,
                        //     parametro1: ingresaFlujoConvenio ? idSalesorder : bien,
                        //     parametro2: ingresaFlujoConvenio,
                        //     parametro3: famProducto,
                        //     idSalesorder: idSalesorder,
                        //     bien: bien,
                        //     famProducto: famProducto,
                        //     resultado: busqueda_salesorder,
                        //     resultado_tipo: typeof busqueda_salesorder,
                        //     resultado_length: busqueda_salesorder ? (busqueda_salesorder.length || 'no length') : 'null/undefined'
                        // });



                        log.debug('busqueda_salesorder', busqueda_salesorder);
                        let busqueda_cobertura = getCoberturaItem(bien);

                        log.debug('busqueda_cobertura.............2.................', busqueda_cobertura);

                        let salesorder = record.load({ type: 'salesorder', id: idSalesorder });

                        log.debug('busqueda_cobertura.............3.................', idSalesorder);
                        let convenio = salesorder.getValue('custbody_ht_os_convenio');
                        let subsidiary = salesorder.getValue('subsidiary');
                        var numLines = salesorder.getLineCount({ sublistId: 'item' });
                        let ejecutivaGestion = salesorder.getValue('custbody_ht_os_ejecutiva_backoffice');
                        let total = salesorder.getValue('total');//Add JChaveza

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
                        let simTXT = objRecord.getValue('custrecord_ht_ot_simcard');
                        let flujoReinstalacion = objRecord.getValue('custrecord_flujo_de_reinstalacion');
                        let othersIntalls = objRecord.getValue('custrecord_ht_ot_others_installs');
                        let modeloDisp = objRecord.getValue('custrecord_ht_ot_modelo');
                        let unid = objRecord.getValue('custrecord_ht_ot_unidad');
                        let vid = objRecord.getValue('custrecord_ht_ot_vid');
                        let dispositivoMonitoreo = objRecord.getValue('custrecord_ht_ot_dispositivo');
                        let boxserieLojack = objRecord.getValue('custrecord_ht_ot_boxserie');


                        // Variables ya declaradas al inicio - solo inicializar valores si es necesario
                        let parametro_salesorder = 0, tag = 0, idOS = 0, envioPX = 0, envioTele = 0, idItem = 0, monitoreo = 0, precio = 0, esAlquiler = 0, entregaCliente = 0,
                            entradaCustodia = 0, adpDesinstalacion = 0, esGarantia = 0, plataformasPX = 0, plataformasTele = 0, adp, device, parametrosRespo = 0, ttrid = 0,
                            TTR_name = '', familia = "", idCoberturaItem = 0, returEjerepo = true, arrayItemOT = new Array(), arrayID = new Array(), arrayTA = new Array(), objParams = new Array(),
                            esConvenio = 0, responsepx, responsetm, esItemProduccion = false, objUserAssetCommand = new Object(), objAssetCommand = new Object(),
                            arrayCommands = new Array(), arrayCommand = new Array(), uniqueCommands = new Array(), saveRecord = false, familia_code = '',
                            esUpgrade = _constant.Valor.NO, familiaUpgrade = 0, familiaOrigenFAO = "";

                        // cambio JMON 14/12/2025: ADP para impulso PX tomado directamente del item de la OT
                        let adpFromOT = _controller.getParameter(idItemOT, _constant.Codigo_parametro.COD_ADP_ACCION_DEL_PRODUCTO);
                        let adpPX = adpFromOT ? (adpFromOT.idinterno || adpFromOT.codigo || 0) : 0;
                        adpDesinstalacion = adpPX;
                        log.debug('cambio JMON 14/12/2025 - ADP_OT', { idItemOT: idItemOT, adpPX: adpPX });

                        // AGREGAR LOG DE INICIALIZACIÓN DE VARIABLES
                        log.debug('VARIABLES-INICIALIZACION', {
                            cantidad: cantidad,
                            undTiempo: undTiempo,
                            adp: adp,
                            adpActivados: adpActivados,
                            idSalesorder: idSalesorder,
                            timestamp: new Date().toISOString()
                        });

                        // cambio jmon 17/12/2025 - Detectar upgrade por parametrizacion del item de OT
                        let parametrosUpgrade = _controller.parametrizacion(idItemOT) || [];
                        if (parametrosUpgrade.length) {
                            for (let j = 0; j < parametrosUpgrade.length; j++) {
                                if (parametrosUpgrade[j][0] == _constant.Parameter.CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosUpgrade[j][1] == _constant.Valor.SI) {
                                    esUpgrade = _constant.Valor.SI;
                                }
                                if (parametrosUpgrade[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                    familiaUpgrade = parametrosUpgrade[j][1];
                                }
                                if (parametrosUpgrade[j][0] == _constant.Parameter.FAO_FAMILIA_ORIGEN) {
                                    familiaOrigenFAO = parametrosUpgrade[j][3];
                                }
                            }
                        }

                        // cambio jmon 17/12/2025 - Aplicar upgrade de cobertura cuando la OT se chequea
                        if (esUpgrade == _constant.Valor.SI) {
                            let itemsInventario = idItemOT;
                            let busquedaCoberturaUpgrade = [];
                            if (bien && familiaOrigenFAO) {
                                busquedaCoberturaUpgrade = getInstalacionesforUpgrade(familiaOrigenFAO, bien) || [];
                            }
                            log.debug('UPGRADE-OT', {
                                bien: bien,
                                familiaOrigenFAO: familiaOrigenFAO,
                                familiaUpgrade: familiaUpgrade,
                                itemsInventario: itemsInventario,
                                resultados: busquedaCoberturaUpgrade ? busquedaCoberturaUpgrade.length : 0
                            });
                            if (busquedaCoberturaUpgrade && busquedaCoberturaUpgrade.length) {
                                if (!familiaUpgrade || !itemsInventario) {
                                    log.error('UPGRADE-OT-SKIP', 'Faltan datos de familia o item para ejecutar el upgrade.');
                                } else {
                                    for (let i = 0; i < busquedaCoberturaUpgrade.length; i++) {
                                        const coberturaId = busquedaCoberturaUpgrade[i].id;
                                        record.submitFields({
                                            type: "customrecord_ht_co_cobertura",
                                            id: coberturaId,
                                            values: {
                                                custrecord_ht_co_familia_prod: familiaUpgrade,
                                                custrecord_ht_co_producto: itemsInventario,
                                                custrecord_ht_co_producto_convertido: true,
                                                custrecord_ht_co_subsidiaria: subsidiary,  // Se mueve al momento del chequeo de OT
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true,
                                            },
                                        });

                                        let objRecordUpgrade = record.create({
                                            type: "customrecord_ht_ct_cobertura_transaction",
                                            isDynamic: true,
                                        });
                                        objRecordUpgrade.setValue({
                                            fieldId: "custrecord_ht_ct_transacciones",
                                            value: coberturaId,
                                        });
                                        objRecordUpgrade.setValue({
                                            fieldId: "custrecord_ht_ct_orden_servicio",
                                            value: idSalesorder,
                                        });
                                        objRecordUpgrade.setValue({
                                            fieldId: "custrecord_ht_ct_concepto",
                                            value: 9,
                                        });
                                        objRecordUpgrade.save();
                                    }
                                }
                            }
                        }

                        log.debug('...............othersIntalls....................', othersIntalls);
                        if (othersIntalls == true) {
                            log.debug('FLOW-PE', `branch=others_installs | ot=${id}`);
                            //Edwin agrego  FULFILLMENT
                            try {
                                let servicios = objRecord.getText('custrecord_ht_ot_servicios_commands')
                                let sql = 'SELECT id FROM customrecord_ht_nc_servicios_instalados ' +
                                    'WHERE custrecord_ns_bien_si = ? AND custrecord_ns_orden_servicio_si = ? AND custrecord_ns_orden_trabajo = ?';
                                let params = [bien, idSalesorder, id];
                                let resultSet = query.runSuiteQL({ query: sql, params: params });
                                let results = resultSet.asMappedResults();
                                if (results.length > 0) {
                                    record.delete({ type: 'customrecord_ht_nc_servicios_instalados', id: results[0]['id'] });
                                }
                                if (servicios.length > 0) {
                                    let sql2 = "SELECT bi.custrecord_ht_bien_id_telematic as bienidtm, cu.custentity_ht_customer_id_telematic as customeridtm FROM customrecord_ht_record_ordentrabajo ot " +
                                        "INNER JOIN customrecord_ht_record_bienes bi ON ot.custrecord_ht_ot_vehiculo = bi.id " +
                                        "INNER JOIN customer cu ON ot.custrecord_ht_ot_cliente_id = cu.id " +
                                        "WHERE ot.id = ?"
                                    let params2 = [id]
                                    let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 }).asMappedResults();
                                    log.debug('resultSet2', resultSet2);
                                    log.debug('servicios', servicios);
                                    let serviciosSearchObj = search.create({
                                        type: "customrecord_ht_servicios",
                                        filters:
                                            [
                                            ],
                                        columns:
                                            [
                                                search.createColumn({ name: "name", label: "Name" }),
                                                search.createColumn({ name: "custrecord_ht_sv_command", label: "Comando" })
                                            ]
                                    });
                                    let pagedData = serviciosSearchObj.runPaged({ pageSize: 1000 });
                                    pagedData.pageRanges.forEach((pageRange) => {
                                        var myPage = pagedData.fetch({ index: pageRange.index });
                                        myPage.data.forEach((result) => {
                                            let columns = result.columns;
                                            let commandName = result.getValue(columns[0]);
                                            let commands = result.getText(columns[1]);
                                            arrayCommands.push({
                                                commandName: commandName,
                                                commands: commands
                                            })
                                            return true;
                                        });
                                    });

                                    for (var i = 0; i < arrayCommands.length; i++) {
                                        var commandString = arrayCommands[i].commands;
                                        if (commandString) {
                                            var splitCommands = commandString.split(',');
                                            for (var j = 0; j < splitCommands.length; j++) {
                                                var trimmedCommand = splitCommands[j].trim();
                                                if (trimmedCommand && uniqueCommands.indexOf(trimmedCommand) === -1) {
                                                    uniqueCommands.push(trimmedCommand);
                                                }
                                            }
                                        }
                                    }
                                    log.debug("uniqueCommands", uniqueCommands);
                                    log.debug('uniqueCommands.length', uniqueCommands.length);
                                    if (uniqueCommands.length) {
                                        let responseCommandWS = '';
                                        let gpg = _controller.getParameter(idItemRelacionadoOT, _constant.Codigo_parametro.COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS);
                                        let gpt = _controller.getParameter(idItemRelacionadoOT, _constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS);
                                        log.debug('.............1.......................', gpg);
                                        log.debug('.............1.......................', gpt);
                                        log.debug('.............1.......................', '.............1........................');
                                        if (gpt != 0 && gpt == _constant.Valor.SI) {
                                            let registroImpulsoPlataforma1 = crearRegistroImpulsoPlataforma(id, "enviado", 'TELEMATICS')
                                            if (resultSet2[0].bienidtm != null && resultSet2[0].customeridtm != null) {
                                                for (let index = 0; index < uniqueCommands.length; index++) {
                                                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(id, "enviado", 'TELEMATICS')
                                                    const comando = uniqueCommands[index];
                                                    objUserAssetCommand.user = resultSet2[0].bienidtm
                                                    objUserAssetCommand.asset = resultSet2[0].customeridtm
                                                    objUserAssetCommand.command = comando
                                                    objUserAssetCommand.can_execute = true
                                                    objUserAssetCommand.status = 1
                                                    log.debug("objUserAssetCommand", objUserAssetCommand);
                                                    responseCommandWS = setUserAssetCommand(objUserAssetCommand);
                                                    log.debug("responseUserAssetCommand", responseCommandWS);
                                                    if (responseCommandWS.status == 'ok') {
                                                        responseCommandWS = setAssetCommand(objUserAssetCommand);
                                                        log.debug("responseAssetCommand", responseCommandWS);
                                                        if (responseCommandWS.status == 'error') {
                                                            ejecutarFulFillment = 0
                                                            break;
                                                        }
                                                    } else {
                                                        ejecutarFulFillment = 0
                                                        break;
                                                    }
                                                    if (ejecutarFulFillment == 0) {
                                                        let values = { "custrecord_ts_reg_imp_plt_estado": "error" };
                                                        values["custrecord_ts_reg_imp_plt_mensaje"] = responseCommandWS;
                                                        record.submitFields({
                                                            type: "customrecord_ts_regis_impulso_plataforma",
                                                            id: registroImpulsoPlataforma,
                                                            values
                                                        });
                                                    }
                                                }
                                            } else {
                                                let values = { "custrecord_ts_reg_imp_plt_estado": "error" };
                                                values["custrecord_ts_reg_imp_plt_mensaje"] = 'Revisar los datos del bien o del cliente';
                                                record.submitFields({
                                                    type: "customrecord_ts_regis_impulso_plataforma",
                                                    id: registroImpulsoPlataforma1,
                                                    values
                                                });
                                                ejecutarFulFillment = 0
                                            }
                                        }
                                    }
                                    log.debug('.............2........................', '.............2........................');
                                    let devoInstallmentAS = setServices(bien, idSalesorder, id, objRecord)
                                    log.debug("devoInstallmentAS", devoInstallmentAS);
                                }
                                //!FULFILLMENT ======================================================================================================================================================
                                if (ejecutarFulFillment == 1) {
                                    try {
                                        if (!idDispositivo) {
                                            //cambio JMON 14/12/2025 - permitir continuar aun sin serie
                                            log.error('FULFILLMENT-NO-DISPOSITIVO', `No se encontró idDispositivo para el OT ${id}, se continúa sin bloquear`);
                                        }
                                        let ubicacion = objRecord.getValue('custrecord_ht_ot_ordenfabricacion') ? _controller.getLocationToAssembly(objRecord.getValue('custrecord_ht_ot_ordenfabricacion')) : 0;
                                        log.debug('LogtLocationToAssembly other install', ubicacion);
                                        if (ubicacion == 0) {
                                            ubicacion = {};
                                            // let buscarLocacion = search.lookupFields({ type: 'salesorder', id: idSalesorder, columns: ['location'] });
                                            // ubicacion.location = buscarLocacion.location[0].value;
                                            ubicacion.location = objRecord.getValue('custrecord_ht_ot_location');
                                            ubicacion.binnumber = ''
                                            log.debug('LogtLocationToAssembly1', ubicacion);
                                        }

                                        let newFulfill = record.transform({
                                            fromType: record.Type.SALES_ORDER,
                                            fromId: idSalesorder,
                                            toType: record.Type.ITEM_FULFILLMENT,
                                            isDynamic: true
                                        });
                                        newFulfill.setValue({ fieldId: 'customform', value: _constant.Form.PE_DESPACHO });
                                        newFulfill.setValue({ fieldId: 'trandate', value: fechaChequeo });
                                        let numLines = newFulfill.getLineCount({ sublistId: 'item' });
                                        log.debug('FULFILLMENT-numLines', numLines);
                                        log.debug('FULFILLMENT-idItemOT', idItemOT);
                                        log.debug('FULFILLMENT-adp', adp);

                                        // idItemOT id item
                                        for (let i = 0; i < Number(numLines); i++) {
                                            newFulfill.selectLine({ sublistId: 'item', line: i })
                                            let idArticulo = newFulfill.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' })
                                            log.debug(`FULFILLMENT-Line ${i}`, `idArticulo: ${idArticulo}, match: ${idArticulo == idItemOT}`);

                                            if (idArticulo == idItemOT) {
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: ubicacion.location });
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: idItemOT });
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                                                log.debug(`FULFILLMENT-Processed Line ${i}`, 'itemreceive set to true');

                                                if (ubicacion.binnumber) {
                                                    let objSubRecord = newFulfill.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                                    objSubRecord.selectNewLine({ sublistId: 'inventoryassignment' });
                                                    objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: ubicacion.binnumber });
                                                    //objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                                                    objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                                                    objSubRecord.commitLine({ sublistId: 'inventoryassignment' });
                                                }
                                            }
                                            newFulfill.commitLine({ sublistId: 'item' });
                                        }
                                        let fulfillment = newFulfill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                        log.debug('FULFILLMENT-SAVED-ID', fulfillment);
                                    } catch (error) {
                                        log.error('FULFILLMENT-Error', error);
                                    }
                                }
                            } catch (error) {
                                log.error('Error-Process-Accesory', error);
                            }
                            // cambio JMON 15/12/2025: agendar impulso PX también para others_installs
                            const pxAdminFinOthers = objRecord.getValue('custrecord_ht_ot_pxadminfinalizacion');
                            if (!pxAdminFinOthers) {
                                try {
                                    log.debug('IMPULSO-PX-START-OTHERS', { ot: id, adp: adpPX }); //cambio JMON 15/12/2025
                                    const pxTaskId = task.create({
                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                        scriptId: 'customscript_ht_pe_impulso_plat_px',
                                        deploymentId: 'customdeploy_ht_pe_impulso_plat_px',
                                        params: { custscript_ht_pe_impulso_otid: id }
                                    }).submit();
                                    log.debug('IMPULSO-PX-END-OTHERS', { status: true, mensaje: 'Tarea programada', ot: id, taskId: pxTaskId }); //cambio JMON 15/12/2025
                                } catch (e) {
                                    log.error('IMPULSO-PX-TASK-ERROR-OTHERS', e); //cambio JMON 15/12/2025
                                }
                            } else {
                                log.debug('IMPULSO-PX-SKIP-OTHERS', { ot: id, motivo: 'pxadminfinalizacion=true' }); //cambio JMON 15/12/2025
                            }

                            // flujo principal instalación
                        } else {
                            log.debug('FLOW-PE', `branch=instalacion_main | ot=${id}`);
                            let parametrosRespo_2 = _controller.parametrizacion(idItemOT);
                            let parametrizacionProducto = _controller.parametrizacionJson(idItemOT);
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
                            let itemInstallId;
                            try {
                                itemInstallId = _controller.getInstall(objParameters);
                            } catch (error) { }

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
                                tag: 0,
                                estado: 0,
                                familia: 0,
                                subsidiary: subsidiary
                            }

                            /*for (let i = 0; i < numLines; i++) {
                                precio = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                            }*/

                            if (parametrosRespo_2.length != 0) {
                                for (let j = 0; j < parametrosRespo_2.length; j++) {
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                                        adp = parametrosRespo_2[j][1];
                                        adpServicio = parametrosRespo_2[j][1];
                                        adpDesinstalacion = adpServicio;
                                        adpActivados = parametrosRespo_2[j][3]; // Usar el código valor en lugar del ID
                                    }
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.TTR_TIPO_TRANSACCION) { // TTR tipo de transaccion
                                        let parametro = record.load({ type: 'customrecord_ht_cr_pp_valores', id: parametrosRespo_2[j][1], isDynamic: true });
                                        TTR_name = parametro.getValue('custrecord_ht_pp_descripcion');
                                    }
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS)
                                        envioPX = parametrosRespo_2[j][1];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS)
                                        envioTele = parametrosRespo_2[j][1];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.COS_CIERRE_DE_ORDEN_DE_SERVICIO && parametrosRespo_2[j][1] == _constant.Valor.SI) { //cos cerrar orden de servicio
                                        try {
                                            //<I> Add JChaveza 24.10.2024
                                            log.debug('numLinesX', numLines);
                                            for (var x = 0; x < numLines; x++) {
                                                let idArticulox = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: x });
                                                log.debug('idArticulox - linea ' + x, idArticulox);
                                                log.debug('idItemOT', idItemOT);
                                                if (total == 0 && idArticulox == idItemOT) {
                                                    log.debug('ENTRO', 'OK!');
                                                    var confirmaCierre = getCierre(idSalesorder, idItemOT);
                                                    if (confirmaCierre == true) {
                                                        salesorder.setSublistValue({ sublistId: 'item', fieldId: 'isclosed', line: x, value: true });
                                                        saveRecord = true;
                                                    }
                                                }
                                            }
                                            //<F> Add JChaveza 24.10.2024
                                            /*if (total == 0) {
                                                //transaction.void({ type: 'salesorder', id: idSalesorder });
                                            }*/
                                        } catch (error) {
                                            log.error('Error', error + ', ya está cerrada la Orden de Servicio');
                                        }
                                    }
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO)
                                        tag = parametrosRespo_2[j][3];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER)
                                        esAlquiler = _constant.Valor.SI;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.EDC_ENTREGA_DIRECTA_A_CLIENTE)
                                        entregaCliente = parametrosRespo_2[j][1];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esGarantia = parametrosRespo_2[j][1];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS && parametrosRespo_2[j][1] == _constant.Valor.VALOR_001_GENERA_CUSTODIAS)
                                        entradaCustodia = _constant.Valor.SI;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS && parametrosRespo_2[j][1] == _constant.Valor.VALOR_002_ENTREGA_CUSTODIAS) {
                                        entregaCustodia = _constant.Valor.SI;
                                        esEntregaCustodia = true;
                                    }
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.IRP_ITEM_DE_REPUESTO && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esItemRepuesto = true;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esItemProduccion = true;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.PMS_PERMITE_MODIFICAR_SIM_CARD && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esCambioSimCard = true;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                        familia = parametrosRespo_2[j][1];
                                        ttrid = familia;
                                        familia_code = parametrosRespo_2[j][3];
                                    }
                                    // if (parametrosRespo_2[j][0] == _constant.Parameter.PHV_PRODUCTO_HABILITADO_PARA_LA_VENTA && parametrosRespo_2[j][1] == _constant.Valor.VALOR_X_USO_CONVENIOS)
                                    //     esConvenio == 2
                                }
                            }

                            // Impulso PX para desinstalacion: solo requiere chequeo y no haber finalizado PX
                            if (adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP && statusOri == _constant.Status.CHEQUEADO) {
                                if (!yaFinalizadoPX) {
                                    try {
                                        log.debug('IMPULSO-PX-DESINSTALACION-START', { ot: id, adp });
                                        task.create({
                                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                                            scriptId: 'customscript_ht_pe_impulso_plat_px',
                                            deploymentId: 'customdeploy_ht_pe_impulso_plat_px',
                                            params: { custscript_ht_pe_impulso_otid: id }
                                        }).submit();
                                        log.debug('IMPULSO-PX-DESINSTALACION-END', { status: true, mensaje: 'Tarea programada', ot: id });
                                        desinstalacionPxYaProgramada = true;
                                    } catch (e) {
                                        log.error('IMPULSO-PX-DESINSTALACION-ERROR', e);
                                    }
                                } else {
                                    log.debug('IMPULSO-PX-DESINSTALACION-SKIP', { ot: id, motivo: 'pxadminfinalizacion=true' });
                                }
                            }

                            // Impulso PX para mantenimiento/chequeo: solo requiere chequeo y no haber finalizado PX
                            if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO && statusOri == _constant.Status.CHEQUEADO) {
                                if (!yaFinalizadoPX) {
                                    try {
                                        log.debug('IMPULSO-PX-MANT-START', { ot: id, adp });
                                        task.create({
                                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                                            scriptId: 'customscript_ht_pe_impulso_plat_px',
                                            deploymentId: 'customdeploy_ht_pe_impulso_plat_px',
                                            params: { custscript_ht_pe_impulso_otid: id }
                                        }).submit();
                                        log.debug('IMPULSO-PX-MANT-END', { status: true, mensaje: 'Tarea programada', ot: id });
                                        mantenimientoPxYaProgramada = true;
                                    } catch (e) {
                                        log.error('IMPULSO-PX-MANT-ERROR', e);
                                    }
                                } else {
                                    log.debug('IMPULSO-PX-MANT-SKIP', { ot: id, motivo: 'pxadminfinalizacion=true' });
                                }
                            }

                            var activador = false;
                            if (busqueda_salesorder) {
                                let terminar = 0;
                                for (let i = 0; i < busqueda_salesorder.length; i++) {
                                    if (terminar == 1) {
                                        break;
                                    }

                                    let parametrosRespo = _controller.parametrizacion(busqueda_salesorder[i][0]);

                                    //LOG DE CADA ITERACIÓN
                                    log.debug(`BUSQUEDA-SALESORDER-ITEM-${i}`, {
                                        item_id: busqueda_salesorder[i][0],
                                        salesorder_id: busqueda_salesorder[i][1],
                                        parametrosRespo: parametrosRespo,
                                        parametrosRespo_length: parametrosRespo ? parametrosRespo.length : 0
                                    });

                                    //log.debug('Track1 - parametrosRespo', parametrosRespo)
                                    if (parametrosRespo.length != 0) {
                                        var accion_producto = 0;
                                        var valor_tipo_agrupacion = 0;
                                        var accion_producto_code = 0;
                                        var valor_tipo_agrupacion_code = 0;
                                        for (let j = 0; j < parametrosRespo.length; j++) {
                                            if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                                                accion_producto = parametrosRespo[j][1];
                                                accion_producto_code = parametrosRespo[j][3]
                                            }

                                            if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                                valor_tipo_agrupacion = parametrosRespo[j][1];
                                                valor_tipo_agrupacion_code = parametrosRespo[j][3];
                                            }

                                            // log.debug('accion_producto == _constant.Codigo_Valor.VALOR_015_VENTA_SERVICIOS && valor_tipo_agrupacion == familia', `${accion_producto_code} == ${_constant.Codigo_Valor.COD_VALOR_015_VENTA_SERVICIOS} && ${valor_tipo_agrupacion_code} == ${familia_code}`)
                                            // log.debug('accion_producto == _constant.Valor.VALOR_015_VENTA_SERVICIOS && valor_tipo_agrupacion == familia', `${accion_producto} == ${_constant.Valor.VALOR_015_VENTA_SERVICIOS} && ${valor_tipo_agrupacion} == ${familia}`)
                                            if (accion_producto == _constant.Valor.VALOR_015_VENTA_SERVICIOS && valor_tipo_agrupacion == familia) {
                                                log.debug("Comparación-Familia-OS-Entra-Transmisión: " + i + ' - ' + j, `${valor_tipo_agrupacion}-${familia}-${busqueda_salesorder[i][0]}-${busqueda_salesorder[i][1]}`);
                                                adpServicio = accion_producto;
                                                idOS = busqueda_salesorder[i][1];
                                                plataformasPX = envioPX;
                                                plataformasTele = envioTele;
                                                idItem = busqueda_salesorder[i][0];
                                                terminar = 1;

                                                // LOG CUANDO SE ASIGNA idOS
                                                log.debug('BUSQUEDA-SALESORDER-ASIGNADO-VENTA-SERVICIOS', {
                                                    idOS: idOS,
                                                    accion_producto: accion_producto,
                                                    valor_tipo_agrupacion: valor_tipo_agrupacion,
                                                    familia: familia
                                                });
                                                break;
                                            }
                                            if (accion_producto == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                                idOS = busqueda_salesorder[i][1];
                                                terminar = 1;

                                                // LOG CUANDO SE ASIGNA idOS
                                                log.debug('BUSQUEDA-SALESORDER-ASIGNADO-MANTENIMIENTO', {
                                                    idOS: idOS,
                                                    accion_producto: accion_producto
                                                });
                                                break;
                                            }
                                            if (accion_producto == _constant.Valor.VALOR_ADP_ACTIVADOR) {
                                                idOS = busqueda_salesorder[i][1];
                                                terminar = 1;
                                                activador = true;

                                                // LOG CUANDO SE ASIGNA idOS
                                                log.debug('BUSQUEDA-SALESORDER-ASIGNADO-ACTIVADOR', {
                                                    idOS: idOS,
                                                    accion_producto: accion_producto,
                                                    activador: activador
                                                });
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                // LOG CUANDO NO HAY SALESORDERS
                                log.debug('BUSQUEDA-SALESORDER-VACIA', {
                                    busqueda_salesorder: busqueda_salesorder,
                                    busqueda_salesorder_type: typeof busqueda_salesorder,
                                    bien: bien,
                                    idSalesorder: idSalesorder,
                                    ingresaFlujoConvenio: ingresaFlujoConvenio,
                                    famProducto: famProducto
                                });
                            }

                            if (busqueda_cobertura.length != 0) {
                                log.debug('busqueda_cobertura', busqueda_cobertura)
                                for (let i = 0; i < busqueda_cobertura.length; i++) {
                                    let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                    if (parametrosRespo.length != 0) {
                                        var accion_producto = 0;
                                        var valor_tipo_agrupacion = 0;
                                        var envio = 0;
                                        for (let j = 0; j < parametrosRespo.length; j++) {
                                            if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                                                accion_producto = parametrosRespo[j][1];
                                            if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS)
                                                valor_tipo_agrupacion = parametrosRespo[j][1];
                                            if ((accion_producto == _constant.Valor.VALOR_001_INST_DISPOSITIVO || accion_producto == _constant.Valor.VALOR_003_REINSTALACION_DE_DISP || accion_producto == _constant.Valor.VALOR_ADP_ACTIVADOR) && valor_tipo_agrupacion == familia) {
                                                idCoberturaItem = busqueda_cobertura[i][1];
                                                estadoInts = _constant.StatusPE.INSTALADO
                                            }
                                        }
                                    }
                                }
                            }
                            //Validar Parametro PPS
                            log.debug('idCoberturaItem', idCoberturaItem)
                            let T_PPS = false;
                            log.debug('idOS', idOS);
                            // lógica para actualizar la cobertura en plataformas
                            if (idOS && ingresaFlujoGarantiaReinstalación == false && esItemRepuesto == false && esCambioSimCard == false) {
                                if (adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP)
                                    idOS = idSalesorder
                                log.debug('idOSIntroImpulsoPlataformas', idOS);
                                let serviceOS = record.load({ type: 'salesorder', id: idOS });
                                let numLines_2 = serviceOS.getLineCount({ sublistId: 'item' });

                                // LOG INICIAL DEL PROCESAMIENTO DE LA OS
                                log.debug('TIEMPO-COBERTURA-INICIO-PROCESAMIENTO', {
                                    idOS: idOS,
                                    numLines_2: numLines_2,
                                    familia_buscada: familia,
                                    cantidad_inicial: cantidad,
                                    undTiempo_inicial: undTiempo,
                                    context: 'Iniciando búsqueda de tiempo de cobertura en OS'
                                });

                                for (let k = 0; k < numLines_2; k++) { // para primero validar parametrizacion de todos los Items
                                    let items = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'item', line: k });
                                    let paramRespo = _controller.parametrizacion(items);
                                    log.debug('paramRespo', paramRespo)
                                    if (paramRespo.length != 0) {
                                        for (let l = 0; l < paramRespo.length; l++) {
                                            if (paramRespo[l][2] == _constant.Codigo_parametro.COD_PPS_PEDIR_PERIODO_DE_SERVICIO && paramRespo[l][3] == _constant.Codigo_Valor.COD_SI) {
                                                //if (paramRespo[l][2] == _constant.Parameter.PPS_PEDIR_PERIODO_DE_SERVICIO && paramRespo[l][3] == _constant.Valor.SI) {
                                                T_PPS = true;
                                            }
                                        }
                                    }
                                }
                                let impulsarUnaVezTelematic = true, impulsarUnaVezPX = true;
                                for (let j = 0; j < numLines_2; j++) {
                                    let items = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                                    let itemtype = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                                    let familiaArtOS = _controller.getParameter(items, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);

                                    // LOG DETALLADO DE CADA LÍNEA DE LA OS
                                    log.debug(`TIEMPO-COBERTURA-LINE-${j}`, {
                                        items: items,
                                        itemtype: itemtype,
                                        familiaArtOS: familiaArtOS,
                                        familia_esperada: familia,
                                        coincide_familia: familia == familiaArtOS.idinterno,
                                        es_servicio: itemtype == 'Service'
                                    });

                                    log.debug("Comparación-Familia-OS-0", `${familiaArtOS.idinterno}-${familia}`);
                                    log.debug("Comparación-Familia-OS-1", `${itemtype} == Service`);
                                    if (familia == familiaArtOS.idinterno && itemtype == 'Service') {
                                        log.debug('Tracking-5/02/2025', 'IF');
                                        monitoreo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                                        let quantity = parseInt(serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: j }));
                                        let unidadTiempo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: j });
                                        var itemMeses = idItemType(items);

                                        log.debug("itemMeses", itemMeses);
                                        log.debug("unidadTiempo", unidadTiempo);
                                        log.debug('TIMES====', itemMeses + ' == ' + 1 + ' && ' + quantity + ' != ' + 0 + ' && ' + unidadTiempo.length + ' > ' + 0)

                                        // AGREGAR LOG DETALLADO PARA VERIFICAR LAS CONDICIONES
                                        log.debug('TIEMPO-COBERTURA-VERIFICACION-CONDICIONES', {
                                            itemMeses: itemMeses,
                                            itemMeses_equals_1: itemMeses == 1,
                                            quantity: quantity,
                                            quantity_not_zero: quantity != 0,
                                            unidadTiempo: unidadTiempo,
                                            unidadTiempo_length: unidadTiempo ? unidadTiempo.length : 'undefined',
                                            unidadTiempo_length_gt_0: unidadTiempo && unidadTiempo.length > 0,
                                            condicion_completa: itemMeses == 1 && quantity != 0 && unidadTiempo && unidadTiempo.length > 0,
                                            line: j,
                                            item: items
                                        });

                                        if (itemMeses == 1 && quantity != 0 && unidadTiempo.length > 0) {
                                            if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                                quantity = parseInt(quantity) * 12
                                                unidadTiempo = _constant.Constants.UNIDAD_TIEMPO.MESES
                                            }
                                            undTiempo = unidadTiempo;
                                            let tiempo = quantity
                                            cantidad = cantidad + tiempo;

                                            // LOG CUANDO SE ASIGNA EL TIEMPO
                                            log.debug(`TIEMPO-COBERTURA-ASIGNADO-LINE-${j}`, {
                                                tiempo_agregado: tiempo,
                                                cantidad_nueva: cantidad,
                                                undTiempo_asignado: undTiempo,
                                                unidad_original: serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: j })
                                            });
                                        } else {
                                            // LOG CUANDO NO SE CUMPLE LA CONDICIÓN
                                            log.debug(`TIEMPO-COBERTURA-NO-CUMPLE-LINE-${j}`, {
                                                itemMeses: itemMeses,
                                                quantity: quantity,
                                                unidadTiempo: unidadTiempo,
                                                unidadTiempo_length: unidadTiempo ? unidadTiempo.length : 0,
                                                condicion1: itemMeses == 1,
                                                condicion2: quantity != 0,
                                                condicion3: unidadTiempo && unidadTiempo.length > 0
                                            });
                                        }

                                        if (plataformasPX == _constant.Valor.SI && impulsarUnaVezPX && !desinstalacionPxYaProgramada && !mantenimientoPxYaProgramada) {
                                            if (yaFinalizadoPX) {
                                                log.debug('IMPULSO-PX-SKIP', { ot: id, motivo: 'pxadminfinalizacion=true' }); //cambio JMON 14/12/2025
                                            } else {
                                                log.debug('FLOW-PE', `impulso_px | ot=${id} | adp=${adp}`);
                                                log.debug('IMPULSO-PX-START', { ot: id, adp: adpPX }); //cambio JMON 14/12/2025
                                                // Programar SS para impulso PX (customscript_ht_pe_impulso_plat_px)
                                                try {
                                                    task.create({
                                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                                        scriptId: 'customscript_ht_pe_impulso_plat_px',
                                                        deploymentId: 'customdeploy_ht_pe_impulso_plat_px',
                                                        params: { custscript_ht_pe_impulso_otid: id }
                                                    }).submit();
                                                    log.debug('IMPULSO-PX-END', { status: true, mensaje: 'Tarea programada', ot: id });
                                                } catch (e) {
                                                    log.error('IMPULSO-PX-TASK-ERROR', e);
                                                }
                                                responsepx = { status: true, mensaje: 'Impulso PX encolado a SS' };
                                            }
                                            impulsarUnaVezPX = false;
                                        } else {
                                            impulsaPX = 0;
                                        }

                                        if (plataformasTele == _constant.Valor.SI && ingresaFlujoConvenio == false && adpDesinstalacion != _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP && adp != _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO && impulsarUnaVezTelematic) {
                                            returEjerepo = _controller.parametros(_constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, id, adp);
                                            log.debug('RESPONSETM', returEjerepo);
                                            responsetm = returEjerepo;
                                            impulsarUnaVezTelematic = false;
                                        } else {
                                            impulsaTelematics = 0;
                                        }

                                        if (impulsaPX == 0 && impulsaTelematics == 0) {
                                            if (idCoberturaItem == 0) {
                                                let updateFinalizacionOT = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                                updateFinalizacionOT.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                                updateFinalizacionOT.save();
                                            } else if (T_PPS) {
                                                let updateFinalizacionOT = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                                                updateFinalizacionOT.setValue({ fieldId: 'custrecord_ht_ot_noimpulsaplataformas', value: true })
                                                updateFinalizacionOT.save();
                                            }
                                        }
                                    } else {
                                        log.debug('Tracking-5/02/2025', 'ELSE');
                                        log.debug('Tracking-5/02/2025-activador', activador);
                                        if (activador) {
                                            monitoreo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                                            let quantity = parseInt(serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: j }));
                                            let unidadTiempo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: j });

                                            log.debug("Comparación-unidadTiempo-OS-0", `${unidadTiempo}`);
                                            log.debug("Comparación-quantity-OS-0", `${quantity}`);
                                            if (quantity != 0 && unidadTiempo.length > 0) {
                                                if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                                    quantity = parseInt(quantity) * 12
                                                    unidadTiempo = _constant.Constants.UNIDAD_TIEMPO.MESES
                                                }
                                                undTiempo = unidadTiempo;
                                                let tiempo = quantity
                                                cantidad = cantidad + tiempo;

                                            }
                                        }
                                    }
                                }

                                let sql = "SELECT tr.id as id, tl.item as item, tl.custcol_ht_os_tiempo_cobertura as tiempo, tl.custcol_ht_os_und_tiempo_cobertura as unidad FROM TransactionLine tl " +
                                    "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacionid = tl.item " +
                                    "INNER JOIN transaction tr ON tr.id = tl.transaction " +
                                    "WHERE itemtype = 'Service' " +
                                    "AND tr.custbody_ht_so_renovacion_aplicada = 'F' " +
                                    "AND tr.status != 'A' " +
                                    "AND tr.status != 'C' " +
                                    "AND tr.status != 'H' " +
                                    "AND tr.custbody_ht_os_aprobacionventa = 1 " +
                                    "AND tr.custbody_ht_os_aprobacioncartera = 1 " +
                                    "AND tl.entity = ? " +
                                    "AND pa.custrecord_ht_pp_parametrizacion_valor = ? " +
                                    "AND tr.id != ? " +
                                    "AND tr.custbody_ht_so_bien = ?"
                                let params = [recipientId, _constant.Valor.VALOR_002_RENOVACION_ANTICIPADA, idSalesorder, bien];
                                let resultSet = query.runSuiteQL({ query: sql, params: params });
                                let results = resultSet.asMappedResults();
                                log.debug('results.params', results)

                                // AGREGAR LOG PARA RENOVACIÓN ANTICIPADA
                                log.debug('RENOVACION-ANTICIPADA-BUSQUEDA', {
                                    results_length: results.length,
                                    recipientId: recipientId,
                                    bien: bien,
                                    idSalesorder: idSalesorder,
                                    familia_buscada: familia
                                });

                                if (results.length > 0) {
                                    log.debug('results.asMappedResults', results)
                                    for (let i = 0; i < results.length; i++) {
                                        let quantity = Number(results[i].tiempo);
                                        let unidadTiempo = results[i].unidad;
                                        log.debug("Comparación-Familia-OS-9", `${unidadTiempo}`);

                                        // AGREGAR LOG DETALLADO PARA RENOVACIÓN ANTICIPADA
                                        log.debug(`RENOVACION-ANTICIPADA-ITEM-${i}`, {
                                            item: results[i].item,
                                            quantity: quantity,
                                            unidadTiempo: unidadTiempo,
                                            unidadTiempo_null: unidadTiempo == null
                                        });

                                        if (unidadTiempo != null) {
                                            let familiaArtOS = _controller.getParameter(results[i].item, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);
                                            log.debug("Comparación-Familia-OS-2", `${familiaArtOS.idinterno}-${familia}`);
                                            if (familia == familiaArtOS.idinterno) {
                                                log.debug("Comparación-Familia-OS-8", `${quantity}-${unidadTiempo.toString().length}`);
                                                if (quantity != 0 && unidadTiempo.toString().length > 0) {
                                                    log.debug("Comparación-Familia-OS-3", `${familiaArtOS.idinterno}-${familia}`);
                                                    if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                                        quantity = parseInt(quantity) * 12
                                                        unidadTiempo = _constant.Constants.UNIDAD_TIEMPO.MESES
                                                    }
                                                    undTiempo = unidadTiempo;
                                                    let tiempo = quantity
                                                    cantidad = cantidad + tiempo;

                                                    // AGREGAR LOG PARA TIEMPO AGREGADO EN RENOVACIÓN ANTICIPADA
                                                    log.debug(`RENOVACION-ANTICIPADA-TIEMPO-AGREGADO-${i}`, {
                                                        tiempo_agregado: tiempo,
                                                        cantidad_antes: cantidad - tiempo,
                                                        cantidad_despues: cantidad,
                                                        undTiempo: undTiempo
                                                    });

                                                    log.debug("Comparación-Familia-OS-4", `${undTiempo}-${unidadTiempo}`);
                                                    log.debug("Comparación-Familia-OS-5", `${tiempo}-${quantity}`);
                                                    log.debug("Comparación-Familia-OS-6", `${cantidad}-${cantidad} + ${tiempo}`);
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    log.debug('RENOVACION-ANTICIPADA-SIN-RESULTADOS', 'No se encontraron órdenes de renovación anticipada');
                                }
                            }

                            log.debug('T_PPS', T_PPS);
                            for (let i = 0; i < numLines; i++) {
                                Origen = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen', line: i }).length > 0 ? salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen', line: i }) : salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcoll_ns_codigo_origen_sys', line: i });
                            }

                            // AGREGAR LOG ANTES DE LLAMAR A getCobertura
                            log.debug('TIEMPO-COBERTURA-ANTES-GETCOBERTURA', {
                                cantidad: cantidad,
                                cantidad_tipo: typeof cantidad,
                                undTiempo: undTiempo,
                                fechaChequeo: fechaChequeo,
                                contexto: 'FLUJO_PRINCIPAL_NO_ACTIVADOS',
                                timestamp: new Date().toISOString()
                            });

                            let cobertura = getCobertura(cantidad, undTiempo, fechaChequeo);//*GENERAR COBERTURA PARA EL REGISTRO DE COBERTURA ========================
                            log.debug('COBERTURA ========================', cobertura)

                            let idItemCobertura = objRecord.getValue('custrecord_ht_ot_item');
                            let idVentAlq = objRecord.getValue('custrecord_ht_ot_item_vent_alq');
                            if (idVentAlq != '') {
                                idItemCobertura = idVentAlq;
                            }

                            let instalacion = 15;
                            let activacion = 16;
                            let instalacion_activacion = 17;


                            if (adpDesinstalacion != _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP && adpDesinstalacion != _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                estadoInts = 1 //Instalado
                                log.debug('returEjerepo', returEjerepo);
                                log.debug('idSalesorder', idSalesorder);
                                log.debug('VALOR_002_DESINSTALACION_DE_DISP', idSalesorder);
                                if (returEjerepo && adpServicio != 0 && ingresaFlujoGarantiaReinstalación == false) {
                                    if (idOS == idSalesorder) {
                                        log.debug('COBERTURA', 'Cobertura1');
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
                                            monitoreo: monitoreo == 0 ? objRecord.getValue('custrecord_ht_ot_cliente_id') : monitoreo,
                                            cobertura: idCoberturaItem,
                                            ttr: ttrid,
                                            estadoCobertura: estadoInts,
                                            t_PPS: T_PPS,
                                            modeloDispositivo: modeloDisp,
                                            unidadDispositivo: unid,
                                            vidDispositivo: vid,
                                            //galvar 26-02-2025
                                            subsidiary: objRecord.getValue('custrecord_ht_ot_subsidiary')
                                        }

                                        // AGREGAR LOG AQUÍ
                                        log.debug('COBERTURA-JSON-1-CONSTRUCTION', {
                                            cobertura: cobertura,
                                            cantidad: cantidad,
                                            estadoInts: estadoInts,
                                            idItemCobertura: idItemCobertura,
                                            json_plazo: json.plazo,
                                            json_estadoCobertura: json.estadoCobertura,
                                            json_end: json.end,
                                            punto: 'instalacion_activacion'
                                        });



                                        if (ingresaFlujoConvenio == true) {
                                            json.estadoCobertura = _constant.Status.PENDIENTE_DE_ACTIVACION
                                            //noChequeado = 1
                                        }

                                        log.debug('.....................*adp1*..........................', { adp, json });

                                        // LOG ANTES DE LLAMAR AL WS
                                        log.debug('BEFORE-CREATECOBERTURA-WS-1', {
                                            campos_esperados: {
                                                plazo: json.plazo,
                                                estadoCobertura: json.estadoCobertura,
                                                end: json.end
                                            },
                                            json_completo: json,
                                            mapping: {
                                                'custrecord_ht_co_plazo': 'plazo',
                                                'custrecord_ht_co_estado_cobertura': 'estadoCobertura',
                                                'custrecord_ht_co_coberturafinal': 'end'
                                            }
                                        });

                                        try {
                                            if (valoresPermitidos.includes(adp) && json && json?.subsidiary == "2") {
                                                log.debug("evento", "Genera Seguimiento adp1");
                                                json.objeto = "impulso1";
                                                createCoberturaWS(json);
                                            } else if (json?.subsidiary != "2") {
                                                json.objeto = "impulso2";
                                                createCoberturaWS(json);
                                            }
                                        } catch (error) {
                                            log.debug("evento", "Error Seguimiento adp1")
                                            json.objeto = "impulso3";
                                            createCoberturaWS(json);
                                        }

                                        if (chaser.length > 0) {
                                            let updateTelematic = record.load({ type: _constant.customRecord.DATOS_TECNICOS, id: chaser });
                                            updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: _constant.StatusPE.INSTALADO })
                                            if (ubicacionOT) {
                                                log.debug('UBICACION-ACTUALIZAR-TELEMATIC', `Actualizando chaser ${chaser} con ubicacionOT: ${ubicacionOT}`);
                                                updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_ubicacion', value: ubicacionOT });
                                            } else {
                                                log.debug('UBICACION-TELEMATIC-VACIO', `ubicacionOT está vacío para chaser ${chaser}`);
                                            }
                                            updateTelematic.save();
                                        }
                                    } else {
                                        log.debug('VALOR_002_DESINSTALACION_DE_DISP.............', idSalesorder);
                                        log.debug('COBERTURA.............', 'Cobertura2');

                                        log.debug('comercial................', comercial);

                                        let ObtenerCobertura = 0
                                        let objSearchCobertura = search.create({
                                            type: _constant.customRecord.CUSTODIA,
                                            filters: [["name", "haskeywords", comercial]],
                                            columns: [search.createColumn({ name: "custrecord_ht_ct_cobertura", label: "HT CT Cobertura" })]
                                        });

                                        log.debug('objSearchCobertura...............', objSearchCobertura);


                                        let searchResultCountCobertura = objSearchCobertura.runPaged().count;
                                        if (searchResultCountCobertura > 0) {
                                            objSearchCobertura.run().each(result => {
                                                ObtenerCobertura = result.getValue(objSearchCobertura.columns[0]);
                                                // log.debug('--ObtenerCobertura1--', ObtenerCobertura); // DOAS - 30/09/2021
                                                return true;
                                            })
                                            log.debug('objSearchCobertura........2.......', objSearchCobertura.columns[0]);
                                            log.debug('objSearchCobertura........3.......', ObtenerCobertura);
                                        } else {
                                            ObtenerCobertura = 0;
                                            log.debug('ObtenerCobertura2', 'No tiene Cobertura');
                                        };
                                        log.debug('ObtenerCobertura-------------', ObtenerCobertura);

                                        //Obtener el antiguo Bien
                                        let ObtenerBien = 0;
                                        if (!ObtenerCobertura) {
                                            ObtenerCobertura = 0;
                                            log.debug('ObtenerCobertura JCEC', 'No tiene Cobertura');
                                        }
                                        let CoberturaBien = search.create({
                                            type: "customrecord_ht_co_cobertura",
                                            filters:
                                                [["internalid", "anyof", ObtenerCobertura]],
                                            columns:
                                                ['custrecord_ht_co_bien']
                                        });
                                        let searchResultCountObtenerBien = CoberturaBien.runPaged().count;
                                        if (searchResultCountObtenerBien > 0) {
                                            CoberturaBien.run().each(result => {
                                                ObtenerBien = result.getValue({ name: "custrecord_ht_co_bien" });
                                                return true;
                                            });
                                        } else {
                                            log.debug('ObtenerBien', 'No tiene Bien');
                                        };

                                        log.debug('ObtenerBien', ObtenerBien);

                                        let NuevoBien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                                        let newItem = objRecord.getValue('custrecord_ht_ot_itemrelacionado');
                                        let newFamily = objRecord.getValue('custrecord_ht_ot_producto');
                                        log.debug('NuevoBien', NuevoBien);

                                        if (/*ObtenerBien !== NuevoBien && */searchResultCountObtenerBien > 0 && searchResultCountCobertura > 0) {

                                            idItemCobertura = newItem;
                                            ttrid = newFamily;
                                            idCoberturaItem = ObtenerCobertura;



                                            // let UpdateCobertura = record.load({ type: 'customrecord_ht_co_cobertura', id: ObtenerCobertura, isDynamic: true });
                                            // UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_producto', value: newItem });
                                            // UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_familia_prod', value: newFamily });
                                            // UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_bien', value: NuevoBien });
                                            // UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: _constant.Status.ACTIVO });
                                            // UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_estado', value: _constant.Status.INSTALADO });
                                            // let UpdateCober = UpdateCobertura.save();

                                            // log.debug("Data Update", {
                                            //     "customrecord_ht_co_cobertura": ObtenerCobertura,
                                            //     "custrecord_ht_co_bien": NuevoBien,
                                            //     "custrecord_ht_co_estado_cobertura": _constant.Status.ACTIVO,
                                            //     "custrecord_ht_co_estado": _constant.Status.INSTALADO
                                            // })
                                            // log.debug('UpdateCober---------', UpdateCober);
                                        } else {

                                        }

                                        let json = {
                                            bien: NuevoBien, // solo envía el bien de la OT no importa si es el mismo u otro
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
                                            monitoreo: monitoreo == 0 ? objRecord.getValue('custrecord_ht_ot_cliente_id') : monitoreo,
                                            cobertura: idCoberturaItem,
                                            ttr: ttrid,
                                            estadoCobertura: estadoInts,
                                            t_PPS: esItemRepuesto == true ? false : esCambioSimCard == true ? false : T_PPS,
                                            modeloDispositivo: unid,
                                            unidadDispositivo: modeloDisp,
                                            vidDispositivo: vid,
                                            esItemRepuesto: esItemRepuesto,
                                            esCambioSimCard: esCambioSimCard,
                                            //galvar 26-02-2025
                                            subsidiary: objRecord.getValue('custrecord_ht_ot_subsidiary'),
                                            esEntregaCustodiaCCD: esEntregaCustodia
                                        }

                                        // AGREGAR LOG AQUÍ
                                        log.debug('COBERTURA-JSON-2-CONSTRUCTION', {
                                            cobertura: cobertura,
                                            cantidad: cantidad,
                                            estadoInts: estadoInts,
                                            idItemCobertura: idItemCobertura,
                                            json_plazo: json.plazo,
                                            json_estadoCobertura: json.estadoCobertura,
                                            json_end: json.end,
                                            punto: 'activacion'
                                        });

                                        log.debug('json', json)
                                        if (idOS == 0) {
                                            json.concepto = instalacion;
                                            json.salesorder = idSalesorder;
                                            json.estadoCobertura = _constant.Status.PENDIENTE_DE_ACTIVACION
                                            noChequeado = 1
                                        }

                                        if (ingresaFlujoConvenio == true) {
                                            //*FLUJO DE CONVENIO INACTIVO, funcionaba con flujo autómatico hasta el chequeo
                                            json.concepto = instalacion;
                                            json.salesorder = idSalesorder;
                                        }
                                        log.debug('.....................*adp2*..........................', { adp, json });
                                        // createCoberturaWS(json);

                                        // LOG ANTES DE LLAMAR AL WS
                                        log.debug('BEFORE-CREATECOBERTURA-WS-2', {
                                            campos_esperados: {
                                                plazo: json.plazo,
                                                estadoCobertura: json.estadoCobertura,
                                                end: json.end
                                            },
                                            json_completo: json,
                                            mapping: {
                                                'custrecord_ht_co_plazo': 'plazo',
                                                'custrecord_ht_co_estado_cobertura': 'estadoCobertura',
                                                'custrecord_ht_co_coberturafinal': 'end'
                                            }
                                        });

                                        try {
                                            if (valoresPermitidos.includes(adp) && json && json?.subsidiary == "2") {
                                                log.debug("evento", "Genera Seguimiento adp2");
                                                json.objeto = 'impulso4';
                                                createCoberturaWS(json);
                                            } else if (json?.subsidiary != "2") {
                                                json.objeto = 'impulso5';
                                                createCoberturaWS(json);
                                            }
                                        } catch (error) {
                                            log.debug("evento", "error Seguimiento adp2")
                                            json.objeto = 'impulso6';
                                            createCoberturaWS(json);
                                        }
                                        if (chaser.length > 0) {
                                            let updateTelematic = record.load({ type: _constant.customRecord.DATOS_TECNICOS, id: chaser });
                                            updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estadolodispositivo', value: _constant.StatusPE.INSTALADO })
                                            updateTelematic.save();

                                        }

                                        log.debug('.....................ejecutarFulFillment.........1.....................', ejecutarFulFillment);
                                    }
                                }
                            }
                            if (statusOri == _constant.Status.CHEQUEADO && ingresaFlujoConvenio == true) {
                                //*FLUJO DE CONVENIO INACTIVO, funcionaba con flujo autómatico hasta el chequeo
                                // log.debug('Convenio', 'Es convenio');
                                // objParams.item = idItemOT
                                // objParams.boleano = true;
                                // let ajusteInvSalida = _controller.createInventoryAdjustmentSalida(objParams);
                                // let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, ajusteInvSalida, 1);
                                // log.debug('AjusteInventarioPorConvenio', ajusteInv);
                            }
                            log.debug('.....................adp..............................', adp);
                            if (adp == _constant.Valor.VALOR_001_INST_DISPOSITIVO || adp == _constant.Valor.VALOR_003_REINSTALACION_DE_DISP) {
                                if (envioPX == _constant.Valor.SI) {
                                    if (responsepx == false) return false
                                }
                                if (envioTele == _constant.Valor.SI) {
                                    if (responsetm == false) return false;
                                }

                                let estado = objRecord.getValue('custrecord_ht_ot_estado');
                                let idSalesOrder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                                let dispositivo = objRecord.getValue('custrecord_ht_ot_dispositivo');
                                let boxserie = objRecord.getValue('custrecord_ht_ot_boxserie');
                                let bien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                                let displayname = '';
                                var fulfill = '';
                                if (dispositivo != '') {
                                    fulfill = dispositivo;
                                } else {
                                    fulfill = boxserie;
                                }

                                let idDispositivo = getItemForFulfillment(idItemOT, fulfill)
                                //cambio JCEC 20/08/2024
                                if (flujoAccesorio) {
                                    log.debug('JCEC ', 'Entro a flujo de accesorio');
                                    log.debug('JCEC  getInventoryNumber;', getInventoryNumber(objRecord.getValue('custrecord_ot_serie_acc'), idItemOT));
                                    idDispositivo = getInventoryNumber(objRecord.getValue('custrecord_ot_serie_acc'), idItemOT);
                                }

                                let estadoSalesOrder = getSalesOrder(idSalesOrder);
                                log.debug('idItemOT ', idItemOT);
                                log.debug('fulfill ', fulfill);
                                log.debug('estado ', estado);
                                log.debug('estadoSalesOrder ', estadoSalesOrder);
                                log.debug('idDispositivo', idDispositivo);

                                if (estado == _constant.Status.CHEQUEADO && (estadoSalesOrder == 'pendingFulfillment' || estadoSalesOrder == 'partiallyFulfilled' || estadoSalesOrder == 'pendingBillingPartFulfilled') && idDispositivo) {
                                    let serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                    let ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                                    log.debug('ubicacion ', ubicacion);

                                    if (serieProducto.length > 0) {
                                        log.debug('UBICACION-INSTALACION-DEBUG', `serieProducto: ${serieProducto}, ubicacionTextoOT: ${ubicacionTextoOT}, estadoChaser: ${estadoChaser}`);

                                        if (boxserieLojack) {
                                            //LOJACK
                                            log.debug('TAG', 'LOJACK: ' + tag);
                                            log.debug('UBICACION-LOJACK-UPDATE', `Actualizando LOJACK ${serieProducto} con ubicacion: ${ubicacionTextoOT}`);
                                            record.submitFields({
                                                type: _constant.customRecord.CHASER,
                                                id: serieProducto,
                                                values: {
                                                    'custrecord_ht_mc_ubicacion': ubicacionTextoOT,
                                                    'custrecord_ht_mc_estadolojack': estadoChaser,
                                                    'custrecord_ht_mc_vehiculo': bien,
                                                    'custrecord_ht_mc_ubicacion': ubicacion
                                                },
                                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                                            });
                                            let dispositivo = search.lookupFields({ type: _constant.customRecord.CHASER, id: serieProducto, columns: ['custrecord_ht_mc_seriedispositivolojack', 'custrecord_ht_cl_dt_lojack'] });
                                            let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                            serializedinventoryitemDispLojack = dispositivo.custrecord_ht_cl_dt_lojack[0].value;
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaslojack', id: dispositivoid, values: { 'custrecord_ht_cl_estado': estadoChaser }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        } else {
                                            //CHASER
                                            log.debug('TAG', 'CHASER: ' + tag)
                                            log.debug('UBICACION-CHASER-UPDATE', `Actualizando CHASER ${serieProducto} con ubicacion: ${ubicacionTextoOT}`);
                                            record.submitFields({
                                                type: _constant.customRecord.CHASER,
                                                id: serieProducto,
                                                values: {
                                                    'custrecord_ht_mc_ubicacion': ubicacionTextoOT,
                                                    'custrecord_ht_mc_estadolodispositivo': estadoChaser,
                                                    'custrecord_ht_mc_vehiculo': bien,
                                                    'custrecord_ht_mc_ubicacion': ubicacion
                                                },
                                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                                            });
                                            let dispositivo = search.lookupFields({
                                                type: _constant.customRecord.CHASER,
                                                id: serieProducto,
                                                columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_dt_dispositivo']
                                            });
                                            let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                            serializedinventoryitemDispLojack = dispositivo.custrecord_ht_dt_dispositivo[0].value;
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaserdisp', id: dispositivoid, values: { 'custrecord_ht_dd_estado': estadoChaser }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }

                                        //log.debug('serializedinventoryitemDispLojack', serializedinventoryitemDispLojack)
                                    }

                                    try {
                                        //!FULFILLMENT ======================================================================================================================================================
                                        log.debug('fulfillment', 'Nueva lógica Fulfillment');
                                        log.debug('FULFILLMENT-START', {
                                            ot: id,
                                            salesorder: idSalesOrder,
                                            itemRelacionado: idItemRelacionadoOT,
                                            serieAsignada: idDispositivo,
                                            ubicacionObj: ubicacion
                                        });
                                        if (!idDispositivo) {
                                            //cambio JMON 14/12/2025 - permitir continuar aun cuando la serie esté en blanco
                                            log.error('FULFILLMENT-NO-DISPOSITIVO', `No se encontró idDispositivo para el OT ${id}, se continúa sin bloquear`);
                                        }
                                        let ubicacion = objRecord.getValue('custrecord_ht_ot_ordenfabricacion') ? _controller.getLocationToAssembly(objRecord.getValue('custrecord_ht_ot_ordenfabricacion')) : 0;
                                        log.debug('LogtLocationToAssembly2', ubicacion);
                                        if (ubicacion == 0) {
                                            ubicacion = {};
                                            // let buscarLocacion = search.lookupFields({ type: 'salesorder', id: idSalesorder, columns: ['location'] });
                                            // ubicacion.location = buscarLocacion.location[0].value;
                                            ubicacion.location = objRecord.getValue('custrecord_ht_ot_location');
                                            ubicacion.binnumber = ''
                                            log.debug('LogtLocationToAssembly2', ubicacion);
                                        }

                                        //log.debug('fulfillment', 'Nueva lógica Fulfillment 1');
                                        let newFulfill = record.transform({ fromType: record.Type.SALES_ORDER, fromId: idSalesOrder, toType: record.Type.ITEM_FULFILLMENT, isDynamic: true });
                                        newFulfill.setValue({ fieldId: 'customform', value: _constant.Form.PE_DESPACHO });
                                        let numLines = newFulfill.getLineCount({ sublistId: 'item' });
                                        //log.debug('fulfillment', 'Nueva lógica Fulfillment 2');

                                        //cambio JCEC 20/08/2024
                                        log.error('Entro a Flujo JCEC', flujoAccesorio);
                                        let custrecord_ot_serie_acc;
                                        if (flujoAccesorio) {
                                            custrecord_ot_serie_acc = objRecord.getValue('custrecord_ot_serie_acc');
                                        }

                                        let lineReceived = false;
                                        //cambio JMON 14/12/2025 - ubicación genérica (usa propiedad location cuando existe)
                                        let locationValue = (ubicacion && typeof ubicacion === 'object' && 'location' in ubicacion) ? ubicacion.location : ubicacion;
                                        for (let i = 0; i < Number(numLines); i++) {
                                            //log.debug('fulfillment', 'Nueva lógica Fulfillment 3');
                                            newFulfill.selectLine({ sublistId: 'item', line: i })
                                            let idArticulo = newFulfill.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' })
                                            if (idArticulo == idItemRelacionadoOT) {
                                                log.debug('DetalledeInventario', {
                                                    ubicacion: ubicacion.location,
                                                    idItemRelacionadoOT: idItemRelacionadoOT,
                                                    idDispositivo: idDispositivo
                                                })
                                                // newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: ubicacion.location }); //cambio JMON 14/12/2025 - antiguo, se deja comentado
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                                                //cambio JMON 14/12/2025 - alineado a genérico: usar locationValue
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: locationValue });
                                                //cambio JMON 14/12/2025 - si se requiere, setear subsidiaria en la línea (similar genérico)
                                                // newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'subsidiary', value: subsidiary });
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                                                newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: idItemRelacionadoOT });

                                                let objSubRecord = newFulfill.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                                objSubRecord.selectNewLine({ sublistId: 'inventoryassignment' });
                                                objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: idDispositivo });
                                                if (ubicacion.binnumber) {
                                                    objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: ubicacion.binnumber });
                                                }
                                                log.debug('fulfillment ubicacion', ubicacion);
                                                log.debug('fulfillment convenio', convenio);
                                                //objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                                                objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                                                objSubRecord.commitLine({ sublistId: 'inventoryassignment' });
                                            }
                                            newFulfill.commitLine({ sublistId: 'item' });
                                        }
                                        if (lineReceived) {
                                            let fulfillment = newFulfill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                            log.debug('fulfillment', fulfillment);
                                            log.debug('FULFILLMENT-END', { ot: id, salesorder: idSalesOrder, fulfillment });
                                        } else {
                                            log.error('FULFILLMENT-SIN-LINEA', `No se encontró línea a recibir para OT ${id}`);
                                            ejecutarFulFillment = 0;
                                        }
                                    } catch (error) {
                                        log.error('Error-Fulfill', error);
                                        log.error('FULFILLMENT-END', { ot: id, salesorder: idSalesOrder, error: error.message });
                                    }
                                    log.debug('entregaCustodia == _constant.Valor.SI', `${entregaCustodia} == ${_constant.Valor.SI}`)
                                    if (entregaCustodia == _constant.Valor.SI) {
                                        _controller.deleteRegistroCustodia(objParams);
                                        noChequeado = 0
                                    }
                                }

                                //*FLUJO ALQUILER ====================================================================================
                                if (estaChequeada == _constant.Status.CHEQUEADO && ingresaFlujoAlquiler == true) {
                                    //OBTENCION DE VARIABLES
                                    let numSerieId = 0;
                                    let numSerieText = 0;
                                    if (objRecord.getValue('custrecord_ht_ot_flu_acc') == true) {
                                        numSerieText = objRecord.getValue('custrecord_ot_serie_acc');
                                    } else {
                                        numSerieId = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                        numSerieText = objRecord.getText('custrecord_ht_ot_serieproductoasignacion');
                                    }
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
                                            nameDispositivo = results[0].getValue({ name: 'altname' });
                                            let descHistorial = textItemRelacionado + " " + numSerieText;

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
                                                historial.setValue('custrecord_ht_hs_orden_trabajo_ins', id);
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
                                                historial.setValue('custrecord_ht_hs_orden_trabajo_ins', id);
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
                                                //log.debug('recordRevision', recordRevision)
                                                let lineCountSublist = recordRevision.getLineCount({ sublistId: 'component' })
                                                let itemDispositivoId;
                                                //TODO: Revisar lógica, está trayendo el nombre del primer item que tiene 1, debe traer el nombre del dispositivo seleccionado en el ensamble.
                                                for (let j = 0; j < lineCountSublist; j++) {
                                                    let currentItemSub = recordRevision.getSublistText({ sublistId: 'component', fieldId: 'item', line: j }).toLowerCase();
                                                    let currentQuantiSub = recordRevision.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line: j });

                                                    // log.debug('Track1', '================================')
                                                    // log.debug('currentItemSub', currentItemSub)
                                                    // log.debug('currentQuantiSub', currentQuantiSub)
                                                    // log.debug('currentItemSub.indexOf(dispositivo) && currentQuantiSub == 1', `${currentItemSub.indexOf('dispositivo')} && ${currentQuantiSub} == 1`)
                                                    if (currentItemSub.indexOf('dispositivo') && currentQuantiSub == 1) {
                                                        itemDispositivoId = recordRevision.getSublistValue({ sublistId: 'component', fieldId: 'item', line: j });
                                                        // log.debug('Track2', 'Hiso Break con ================================ ' + itemDispositivoId)
                                                        break;
                                                    }
                                                    //log.debug('Track3', 'Hiso Break con ================================ ' + itemDispositivoId)
                                                }

                                                //ITEM NOMBRE DISPOSITIVO

                                                //&  <I> dfernandez 06/09/2025
                                                //log.debug('serializedinventoryitemDispLojack-alq', serializedinventoryitemDispLojack)
                                                if (!itemDispositivoId) {
                                                    itemDispositivoId = serializedinventoryitemDispLojack
                                                }
                                                //log.debug('itemDispositivoId', itemDispositivoId)
                                                //&  <F> dfernandez 06/09/2025
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

                                                    log.error("values", {
                                                        itemDispositivoName, item_tipo_activoId, creditoTotal, busqueda_sales_order,
                                                        asset_porcentaje_residual, asset_tipo_activo, asset_tiempo_de_vida
                                                    });
                                                    var fixedAsset = record.create({ type: 'customrecord_ncfar_asset', isDynamic: true });
                                                    creditoTotal = Math.round(creditoTotal * 100) / 100;
                                                    if (objRecord.getValue('custrecord_ht_ot_flu_acc') == true) {
                                                        displayname = objRecord.getValue('custrecord_ot_serie_acc');
                                                    } else {
                                                        if (dispositivo != '') {
                                                            displayname = _controller.getDisplayNameDispos(numSerieId);
                                                        } else {
                                                            displayname = _controller.getDisplayNameLojack(numSerieId);
                                                        }
                                                    }

                                                    fixedAsset.setValue('customform', _constant.Form.PE_ACTIVO_FIJO);
                                                    fixedAsset.setValue('altname', displayname);
                                                    fixedAsset.setValue('custrecord_assettype', item_tipo_activoId);
                                                    fixedAsset.setValue('custrecord_assetcost', creditoTotal);
                                                    fixedAsset.setValue('custrecord_assetlifetime', asset_tiempo_de_vida);
                                                    //fixedAsset.setValue('custrecord_assetresidualperc', Number(asset_porcentaje_residual));
                                                    fixedAsset.setValue('custrecord_assetcurrentcost', creditoTotal);
                                                    fixedAsset.setValue('custrecord_assetbookvalue', creditoTotal);
                                                    fixedAsset.setValue('custrecord_assetlocation', busqueda_sales_order.location[0].value);
                                                    fixedAsset.setValue('custrecord_assetsubsidiary', busqueda_sales_order.subsidiary[0].value);
                                                    // var today = new Date();
                                                    // fixedAsset.setValue('custrecord_assetpurchasedate', today);
                                                    // fixedAsset.setValue('custrecord_assetdeprstartdate', today);
                                                    // fixedAsset.setValue('custrecord_assetdeprenddate', new Date(today.getFullYear(), today.getMonth() + Number(asset_tiempo_de_vida), today.getDate() - 1));

                                                    var today = new Date(objRecord.getValue('custrecord_ht_ot_fechatrabajoasignacion'));
                                                    fixedAsset.setValue('custrecord_assetpurchasedate', today);
                                                    fixedAsset.setValue('custrecord_assetdeprstartdate', today);
                                                    fixedAsset.setValue('custrecord_assetdeprenddate', new Date(today.getFullYear(), today.getMonth() + Number(asset_tiempo_de_vida), today.getDate() - 1));
                                                    if (objRecord.getValue('custrecord_ht_ot_flu_acc') == false)
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
                                                    //log.debug('Termino crear activo');

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
                                                    historial.setValue('custrecord_ht_hs_orden_trabajo_ins', id);
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
                                record.submitFields({ type: record.Type.SALES_ORDER, id: objRecord.getValue('custrecord_ht_ot_orden_servicio'), values: { 'custbody_ht_os_trabajado': 'S' } });
                            }

                            //<I> Add JChaveza 24.10.2024
                            if (saveRecord) {
                                log.debug('Entré-saveRecord', saveRecord)
                                try {
                                    //--let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
                                    salesorder.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                } catch (error) {
                                    log.error('Error-saveRecord', error)
                                }
                            }

                            //<F> Add JChaveza 24.10.2024

                            if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                log.debug("estadoChaser valor", estadoChaser);
                                let existRecord = _controller.existInstallOtherService(idSalesorder, id);
                                if (existRecord == 0) {
                                    let objRecordCreateServicios = record.create({ type: 'customrecord_ht_nc_servicios_instalados', isDynamic: true });
                                    objRecordCreateServicios.setValue({ fieldId: 'custrecord_si_sub', value: objRecord.getValue('custrecord_ht_ot_subsidiary'), ignoreFieldChange: true });
                                    objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_bien_si', value: objRecord.getValue('custrecord_ht_ot_vehiculo'), ignoreFieldChange: true });
                                    objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_servicio_si', value: idSalesorder, ignoreFieldChange: true });
                                    objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_trabajo', value: id, ignoreFieldChange: true });
                                    objRecordCreateServicios.save();
                                }
                                objParams.estado = estadoChaser
                                objParams.t_PPS = T_PPS
                                _controller.updateInstall(objParams);
                                if (conNovedad == true) {
                                    //TODO: RETIRAR EL CAMPO Y VALIDAR FLUJO
                                    log.debug('UBICACION-MANTENIMIENTO-UPDATE', `Actualizando mantenimiento chaser ${serieChaser} con ubicacionOT: ${ubicacionOT}`);
                                    record.submitFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieChaser,
                                        values: {
                                            'custrecord_ht_mc_estadolodispositivo': estadoChaser,
                                            'custrecord_ht_mc_ubicacion': ubicacionOT
                                        },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });
                                    try { //TODO: Revisar para lojacks 1
                                        let dispositivo = search.lookupFields({
                                            type: _constant.customRecord.CHASER,
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
                                            type: _constant.customRecord.CHASER,
                                            id: serieChaser,
                                            columns: ['custrecord_ht_mc_seriedispositivolojack']
                                        });
                                        let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;

                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechaslojack',
                                            id: idDispositivo,
                                            values: {
                                                'custrecord_ht_cl_estado': estadoChaser
                                            },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });

                                        record.submitFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieChaser,
                                            values: {
                                                'custrecord_ht_mc_estadolojack': estadoChaser
                                            },
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

                                    try {
                                        log.debug('SendEmail', 'Entry Send Email');
                                        email.send({
                                            author: senderId,
                                            recipients: ejecutivaGestion,
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
                                    } catch (error) {
                                        log.error('Error-EMAIL', error);
                                    }
                                }

                                let impulsoPx = parametrizacionProducto[_constant.Codigo_parametro.COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS];
                                let impulsoTelematic = parametrizacionProducto[_constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS];
                                log.debug("params", { impulsoPx, impulsoTelematic });
                                if (estadoChaser == _constant.Status.PERDIDO || estadoChaser == _constant.Status.DANADO) {
                                    let value = impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI;
                                    let value2 = impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI;
                                    log.debug("value", value);
                                    log.debug("value", value2);

                                    if (impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI) {
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                    }

                                    if (impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI) {
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                    }

                                    //&Revisar ==================
                                    // record.submitFields({
                                    //     type: 'customrecord_ht_co_cobertura',
                                    //     id: idDispositivo,
                                    //     values: {
                                    //         'custrecord_ht_co_estado_cobertura': _constant.Status.SIN_DISPOSITIVO,
                                    //         'custrecord_ht_cl_estado': estadoChaser,
                                    //     },
                                    //     options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    // });
                                }
                            }

                            //* FLUJO DESINSTALACIONES ==================================================
                            if (adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP && statusOri == _constant.Status.CHEQUEADO) {//TODO: Revisar actualizaciones cuando es locjack, ya que no tiene simcard
                                log.debug('Tipo Desinstalación', `entregaCliente == ${entregaCliente} && esGarantia == ${esGarantia} && entradaCustodia == ${entradaCustodia} && esAlquiler == ${esAlquiler}`);
                                objParams.t_PPS = T_PPS;
                                objParams.estado = estadoChaser;
                                log.debug('Ingreso VALOR_002_DESINSTALACION_DE_DISP', estadoChaser);
                                adp = ingresaFlujoGarantiaReinstalación == true ? _constant.Valor.VALOR_001_INST_DISPOSITIVO : adp
                                if (envioPX == _constant.Valor.SI && objRecord.getValue('custrecord_ht_ot_subsidiary') == _constant.Constants.ECUADOR_SUBSIDIARY) {
                                    returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                    log.debug('DESACTIVACIÓN-PX o ingresaFlujoGarantiaReinstalación', returEjerepo);
                                    if (returEjerepo == false) return false
                                }

                                if (envioTele == _constant.Valor.SI && objRecord.getValue('custrecord_ht_ot_subsidiary') == _constant.Constants.ECUADOR_SUBSIDIARY) {
                                    returEjerepo = _controller.parametros(_constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, id, adp);
                                    log.debug('DESACTIVACIÓN-TM o REINSTALACION-TM', returEjerepo);
                                    if (returEjerepo == false) return false
                                }

                                if (esAlquiler == _constant.Valor.SI) {
                                    log.debug('Alquiler', 'Es alquiler');
                                    log.debug('tag == _constant.Codigo_Valor.COD_VALOR_LOJ_LOJACK', `${tag} == ${_constant.Codigo_Valor.COD_VALOR_LOJ_LOJACK}`);
                                    if (tag == _constant.Codigo_Valor.COD_VALOR_LOJ_LOJACK)
                                        objParams.tag = tag
                                    let parametros = getParamFamiliaProductosArticuloOSDesinstalacion(_constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION, idItemOT, _constant.Valor.SI);
                                    log.debug('Track - getParamFamiliaProductosArticuloOSDesinstalacion', parametros);
                                    if (!flujoAccesorio && parametros.aplicacion) {
                                        objParams.custrecord_ht_ot_orden_servicio = idSalesorder;
                                        objParams.serie = context.newRecord.getText('custrecord_ht_ot_serieproductoasignacion');
                                        objParams.TipoAjuste = 1; //Ingreso
                                        log.debug('objParams JCEC', objParams);
                                        createInventoryAdjustmentDesinstalacionFlujoAccesorio(objParams);
                                    } else if (flujoAccesorio) {
                                        objParams.custrecord_ht_ot_orden_servicio = idSalesorder;
                                        objParams.serie = context.newRecord.getValue('custrecord_ot_serie_acc');
                                        objParams.TipoAjuste = 1; //Ingreso
                                        createInventoryAdjustmentDesinstalacionFlujoAccesorio(objParams);
                                    } else {
                                        try {
                                            let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams);
                                            objParams.TipoAjuste = 1; //Ingreso
                                            log.debug('Track - ajusteInv', ajusteInv);
                                            let objRecordCreateAjusteRelacionados = record.create({ type: 'customrecord_ht_ajuste_relacionados', isDynamic: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_orden_trabajo', value: objParams.ordentrabajoId, ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_transacci_gene', value: ajusteInv, ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ht_tipo_mov', value: objParams.TipoAjuste, /*2 Salida 1 Ingreso*/ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_fecha', value: new Date(), ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.save();
                                        } catch (error) {
                                            log.error('Error-createInventoryAdjustmentIngreso', error);
                                        }
                                    }

                                    try {
                                        let returnHistorial = _controller.updateHistorialAF(objParams);
                                        log.debug('returnHistorial', returnHistorial);
                                    } catch (error) { }

                                    try {
                                        let updateIns = _controller.updateInstall(objParams);
                                        log.debug('updateIns', updateIns);
                                    } catch (error) { }

                                    if (!flujoAccesorio) {
                                        try {
                                            record.submitFields({
                                                type: 'customrecord_ht_record_mantchaser',
                                                id: serieChaser,
                                                //values: { 'custrecord_ht_mc_estado': estadoChaser },
                                                values: {
                                                    'custrecord_ht_mc_estadolodispositivo': estadoChaser,
                                                    'custrecord_ht_mc_ubicacion': ubicacionOT
                                                },
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
                                                values: { 'custrecord_ht_dd_estado': _constant.StatusPE.DISPONIBLE },
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
                                }

                                if (entregaCliente == _constant.Valor.SI || (esGarantia == _constant.Valor.SI && ingresaFlujoGarantiaReinstalación == false)) {
                                    log.debug('entrgaCliente', 'es Entrega Cliente o Garantía: ' + estadoChaser + ' - ' + serieChaser);
                                    objParams.estado = estadoChaser
                                    let updateIns = _controller.updateInstall(objParams);
                                    log.debug('updateIns', updateIns);
                                    try {
                                        //* =====================================
                                        if (dispositivoMonitoreo) {
                                            record.submitFields({
                                                type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: {
                                                    'custrecord_ht_mc_estadolodispositivo': _constant.StatusPE.DESINSTALADO,
                                                    'custrecord_ht_mc_ubicacion': ubicacionOT
                                                }, options: { enableSourcing: true, ignoreMandatoryFields: true }
                                            });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard', 'custrecord_ht_mc_estadolodispositivo'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                            let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                                            log.debug('dispositivoMonitoreo', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaserdisp', id: idDispositivo, values: { 'custrecord_ht_dd_estado': _constant.StatusPE.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                            record.submitFields({ type: 'customrecord_ht_record_detallechasersim', id: idSimCard, values: { 'custrecord_ht_ds_estado': _constant.Status.EN_PROCESO_DE_CORTE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }

                                        if (boxserieLojack) {
                                            record.submitFields({
                                                type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: {
                                                    'custrecord_ht_mc_estadolojack': _constant.StatusPE.DESINSTALADO,
                                                    'custrecord_ht_mc_ubicacion': ubicacionOT
                                                }, options: { enableSourcing: true, ignoreMandatoryFields: true }
                                            });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivolojack'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                            log.debug('dispositivoLojack', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaslojack', id: idDispositivo, values: { 'custrecord_ht_cl_estado': _constant.StatusPE.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }
                                    } catch (error) { log.error('Error1', error); }

                                    if (esGarantia == _constant.Valor.SI) {
                                        let json = {
                                            bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                            propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                            start: cobertura.coberturaInicial,
                                            plazo: cantidad,
                                            end: cobertura.coberturaFinal,
                                            estado: estadoChaser,
                                            concepto: instalacion_activacion,
                                            producto: objRecord.getValue('custrecord_ts_item_venta_garantia'),
                                            serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                            salesorder: idOS,
                                            ordentrabajo: objRecord.id,
                                            monitoreo: monitoreo == 0 ? objRecord.getValue('custrecord_ht_ot_cliente_id') : monitoreo,
                                            cobertura: idCoberturaItem,
                                            ttr: ttrid,
                                            estadoCobertura: estadoChaser,
                                            t_PPS: false,
                                            modeloDispositivo: modeloDisp,
                                            unidadDispositivo: unid,
                                            vidDispositivo: vid,
                                            //galvar 26-02-2025
                                            subsidiary: objRecord.getValue('custrecord_ht_ot_subsidiary')
                                        }
                                        try {
                                            //!REVISAR FLUJO GARANTÍA,SIEMPRE ESTÁ CONSIDERANDO COMO UNA DESINSTALACIÓN
                                            let dispo;
                                            log.debug('Garantía JSON', json);
                                            //createCoberturaWS(json);
                                            log.debug('Garantía', 'Es garantía');
                                            const deposito = _controller.getBinNumberRevision(objParams.location);
                                            objParams.deposito = deposito;
                                            objParams.boleano = true;
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard', 'custrecord_ht_mc_seriedispositivolojack'] });
                                            log.debug('objParamsGarantíadispositivo', dispositivo);
                                            if (dispositivo.custrecord_ht_mc_seriedispositivo.length > 0) {
                                                let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                                dispo = search.lookupFields({ type: 'customrecord_ht_record_detallechaserdisp', id: idDispositivo, columns: ['custrecord_ht_dd_dispositivo'] });
                                                log.debug('objParamsGarantíaidDispositivo', dispo);
                                                dispo = dispo.custrecord_ht_dd_dispositivo[0].value;
                                            } else {
                                                let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                                dispo = search.lookupFields({ type: 'customrecord_ht_record_detallechaslojack', id: idDispositivo, columns: ['custrecord_ht_cl_lojack'] });
                                                log.debug('objParamsGarantíaidDispositivoLojack', dispo);
                                                dispo = dispo.custrecord_ht_cl_lojack[0].value;
                                            }
                                            objParams.dispositivo = dispo
                                            log.debug('objParamsGarantía', objParams);
                                            try {
                                                let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, 0, _constant.Constants.FLUJO_GARANTIA);
                                                log.debug('ajusteInv', ajusteInv);
                                                try {
                                                    let objRecordCreateAjusteRelacionados = record.create({ type: 'customrecord_ht_ajuste_relacionados', isDynamic: true });
                                                    objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_orden_trabajo', value: id, ignoreFieldChange: true });
                                                    objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_transacci_gene', value: ajusteInv, ignoreFieldChange: true });
                                                    objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ht_tipo_mov', value: 1, ignoreFieldChange: true });
                                                    objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_fecha', value: new Date(), ignoreFieldChange: true });
                                                    objRecordCreateAjusteRelacionados.save();
                                                } catch (error) { }
                                            } catch (error) {
                                                log.error('createInventoryAdjustmentIngreso', error);
                                            }
                                        } catch (error) {
                                            log.error('Error2', error);
                                        }
                                    }
                                }

                                if (entradaCustodia == _constant.Valor.SI) {
                                    let serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                    let ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                                    log.debug('Flujo Custodia', 'Es custodia');
                                    let depositoCustodia = _controller.getBinNumberCustodia(objParams.location, _constant.Constants.FLUJO_CUSTODIA);
                                    log.debug('Flujo Custodia deposito', depositoCustodia);
                                    log.debug('objParams.deposito', objParams.deposito);
                                    objParams.deposito = depositoCustodia;
                                    objParams.boleano = true;
                                    objParams.estado = estadoChaser;
                                    let updateIns = _controller.updateInstall(objParams);
                                    log.debug('updateIns', updateIns);
                                    if (boxserieLojack.length > 0) {
                                        //LOJACK
                                        log.debug('TAG', 'LOJACK: ' + tag)
                                        log.debug('UBICACION-CUSTODIA-LOJACK', `Actualizando custodia LOJACK ${serieProducto} con ubicacionTextoOT: ${ubicacionTextoOT}`);
                                        record.submitFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieProducto,
                                            values: {
                                                'custrecord_ht_mc_ubicacion': ubicacionTextoOT,
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
                                        log.debug('UBICACION-CUSTODIA-CHASER', `Actualizando custodia CHASER ${serieChaser} con ubicacionOT: ${ubicacionOT}`);
                                        record.submitFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieChaser,
                                            values: {
                                                'custrecord_ht_mc_estadolodispositivo': estadoChaser,
                                                'custrecord_ht_mc_ubicacion': ubicacionOT
                                            },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                        log.debug('TAG', 'Track1: ' + tag)
                                        let dispositivo = search.lookupFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieChaser,
                                            columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard']
                                        });
                                        let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                        log.debug('TAG', 'Track2: ' + tag)
                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechaserdisp',
                                            id: idDispositivo,
                                            values: { 'custrecord_ht_dd_estado': _constant.StatusPE.DISPONIBLE },
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
                                    objParams.dispositivo = device;
                                    objParams.familia = familia;
                                    let returnRegistroCustodia = _controller.createRegistroCustodia(objParams);
                                    try {
                                        let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, 0, _constant.Constants.FLUJO_CUSTODIA);
                                        log.debug('ajusteInv', ajusteInv);
                                        try {
                                            let objRecordCreateAjusteRelacionados = record.create({ type: 'customrecord_ht_ajuste_relacionados', isDynamic: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_orden_trabajo', value: id, ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_transacci_gene', value: ajusteInv, ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ht_tipo_mov', value: 1, ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.setValue({ fieldId: 'custrecord_ts_ajuste_rela_fecha', value: new Date(), ignoreFieldChange: true });
                                            objRecordCreateAjusteRelacionados.save();
                                        } catch (error) { }
                                    } catch (error) {
                                        log.error('createInventoryAdjustmentIngreso', error);
                                    }
                                    log.debug('returnRegistroCustodia', returnRegistroCustodia);

                                }

                                if (esGarantia == _constant.Valor.SI && ingresaFlujoGarantiaReinstalación == true) {
                                    let json = {
                                        bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                        propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                        start: cobertura.coberturaInicial,
                                        plazo: cantidad,
                                        end: cobertura.coberturaFinal,
                                        estado: _constant.Status.ACTIVO,
                                        concepto: instalacion_activacion,
                                        producto: objRecord.getValue('custrecord_ts_item_venta_garantia'),
                                        serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                        salesorder: objRecord.getValue('custrecord_ht_ot_orden_servicio'),
                                        ordentrabajo: objRecord.id,
                                        monitoreo: monitoreo == 0 ? objRecord.getValue('custrecord_ht_ot_cliente_id') : monitoreo,
                                        cobertura: idCoberturaItem,
                                        ttr: ttrid,
                                        estadoCobertura: estadoInts,
                                        t_PPS: true,
                                        modeloDispositivo: modeloDisp,
                                        unidadDispositivo: unid,
                                        vidDispositivo: vid,
                                        esGarantia: true,
                                        //galvar 26-02-2025
                                        subsidiary: objRecord.getValue('custrecord_ht_ot_subsidiary')
                                    }

                                    // AGREGAR LOG AQUÍ
                                    log.debug('COBERTURA-JSON-3-CONSTRUCTION', {
                                        cobertura: cobertura,
                                        cantidad: cantidad,
                                        estadoInts: estadoInts,
                                        idItemCobertura: objRecord.getValue('custrecord_ts_item_venta_garantia'),
                                        json_plazo: json.plazo,
                                        json_estadoCobertura: json.estadoCobertura,
                                        json_end: json.end,
                                        punto: 'garantia_reinstalacion'
                                    });

                                    log.debug('Garantía JSON Rein', json);
                                    log.debug('.....................*adp3*..........................', { adp, json });

                                    // LOG ANTES DE LLAMAR AL WS
                                    log.debug('BEFORE-CREATECOBERTURA-WS-3', {
                                        campos_esperados: {
                                            plazo: json.plazo,
                                            estadoCobertura: json.estadoCobertura,
                                            end: json.end
                                        },
                                        json_completo: json,
                                        mapping: {
                                            'custrecord_ht_co_plazo': 'plazo',
                                            'custrecord_ht_co_estado_cobertura': 'estadoCobertura',
                                            'custrecord_ht_co_coberturafinal': 'end'
                                        }
                                    });
                                    json.objeto = 'impulso7';
                                    createCoberturaWS(json);
                                }

                                if (entregaCliente == 0 && esGarantia == 0 && entradaCustodia == 0 && esAlquiler == 0) {
                                    log.debug('Devolución', 'es Devolución: ' + estadoChaser + ' - ' + serieChaser);
                                    objParams.boleano = true;
                                    objParams.estado = estadoChaser;
                                    objParams.deposito = '';
                                    objParams.item = objRecord.getValue('custrecord_ht_ot_itemrelacionado');
                                    let updateIns = _controller.updateInstall(objParams);
                                    log.debug('updateIns', updateIns);
                                    try {
                                        //* =====================================
                                        if (dispositivoMonitoreo) {
                                            record.submitFields({
                                                type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: {
                                                    'custrecord_ht_mc_estadolodispositivo': _constant.StatusPE.DESINSTALADO,
                                                    'custrecord_ht_mc_ubicacion': ubicacionOT
                                                }, options: { enableSourcing: true, ignoreMandatoryFields: true }
                                            });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard', 'custrecord_ht_mc_estadolodispositivo'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                            let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                                            log.debug('dispositivoMonitoreo', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaserdisp', id: idDispositivo, values: { 'custrecord_ht_dd_estado': _constant.StatusPE.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                            record.submitFields({ type: 'customrecord_ht_record_detallechasersim', id: idSimCard, values: { 'custrecord_ht_ds_estado': _constant.Status.EN_PROCESO_DE_CORTE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }

                                        if (boxserieLojack) {
                                            record.submitFields({
                                                type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: {
                                                    'custrecord_ht_mc_estadolojack': _constant.StatusPE.DESINSTALADO,
                                                    'custrecord_ht_mc_ubicacion': ubicacionOT
                                                }, options: { enableSourcing: true, ignoreMandatoryFields: true }
                                            });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivolojack'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                            log.debug('dispositivoLojack', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaslojack', id: idDispositivo, values: { 'custrecord_ht_cl_estado': _constant.StatusPE.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }
                                    } catch (error) { log.error('Error1', error); }

                                    // let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivo'] });
                                    // let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;

                                    // let dispo = search.lookupFields({
                                    //     type: 'customrecord_ht_record_detallechaserdisp',
                                    //     id: idDispositivo,
                                    //     columns: ['custrecord_ht_dd_dispositivo']
                                    // });
                                    // device = dispo.custrecord_ht_dd_dispositivo[0].value;

                                    // objParams.dispositivo = device;
                                    // objParams.familia = familia;
                                    // let returnRegistroCustodia = _controller.createRegistroCustodia(objParams);

                                    // log.debug('returnRegistroCustodia', returnRegistroCustodia);
                                }
                            }
                            //*BLOQUE DE SERVICIOS
                            try {
                                let sql = 'SELECT id FROM customrecord_ht_nc_servicios_instalados ' +
                                    'WHERE custrecord_ns_bien_si = ? AND custrecord_ns_orden_servicio_si = ? AND custrecord_ns_orden_trabajo = ?';
                                let params = [bien, idSalesorder, id];
                                let resultSet = query.runSuiteQL({ query: sql, params: params });
                                let results = resultSet.asMappedResults();
                                if (results.length > 0) {
                                    let deleteServices = record.delete({ type: 'customrecord_ht_nc_servicios_instalados', id: results[0]['id'] });
                                    log.debug('DELETESERVICES', deleteServices);
                                }
                                objRecord.getValue('custrecord_ht_ot_servicios_commands').length > 0 ? setServices(bien, idSalesorder, id, objRecord) : 0;
                            } catch (error) {
                                log.error('Error-Servicios', error);
                            }
                        }
                        /***
                       * Proceso para crear el ajuste de inventario de la desinstalación de un dispositivo cuando es por retorno de bodega validacion del campo (custrecord_ht_ot_bodega)
                       */

                        try {
                            let custrecord_ht_ot_bodega = objRecord.getValue('custrecord_ht_ot_bodega');
                            if (custrecord_ht_ot_bodega && estadoChaser == _constant.Status.DESINSTALADO) {
                                let objParameters = {};
                                let searchOrdenTrabajo = search.create({
                                    type: 'customrecord_ht_record_ordentrabajo',
                                    filters: [
                                        {
                                            name: 'internalid',
                                            operator: search.Operator.IS,
                                            values: id
                                        }],
                                    columns: [
                                        search.createColumn({ name: 'custrecord_ht_ot_orden_servicio', label: 'Orden de Servicio' }),
                                        search.createColumn({ name: 'custrecord_ht_ot_fechatrabajoasignacion', label: 'fechatrabajo' }),
                                        search.createColumn({ name: 'custrecord_ht_ot_location', label: 'Ubicación' }),
                                        search.createColumn({ name: 'subsidiary', join: 'custrecord_ht_ot_orden_servicio', label: 'Subsidiaria' }),
                                        search.createColumn({ name: 'department', join: 'custrecord_ht_ot_orden_servicio', label: 'Departamento' }),
                                        search.createColumn({ name: 'class', join: 'custrecord_ht_ot_orden_servicio', label: 'Clase' }),
                                        search.createColumn({ name: 'custrecord_ht_lista_bodegas', label: 'Bodega' }),
                                        search.createColumn({ name: 'custrecord_ht_ot_serieproductoasignacion', label: 'SerieId' }),
                                        search.createColumn({ name: 'custrecord_ht_mc_seriedispositivo', join: 'custrecord_ht_ot_serieproductoasignacion', label: 'SerieId' }),

                                    ]
                                });
                                searchOrdenTrabajo.run().each(function (result) {
                                    objParameters.subsidiary = result.getValue({ name: 'subsidiary', join: 'custrecord_ht_ot_orden_servicio' });
                                    objParameters.adjlocation = result.getValue({ name: 'custrecord_ht_ot_location' });
                                    objParameters.department = result.getValue({ name: 'department', join: 'custrecord_ht_ot_orden_servicio' });
                                    objParameters.class = result.getValue({ name: 'class', join: 'custrecord_ht_ot_orden_servicio' });
                                    objParameters.ordenServicio = result.getValue({ name: 'custrecord_ht_ot_orden_servicio' });
                                    objParameters.cantidad = 1;
                                    objParameters.fechatrabajo = result.getValue({ name: 'custrecord_ht_ot_fechatrabajoasignacion', label: 'fechatrabajo' });
                                    objParameters.unitcost = 0;
                                    objParameters.unitcost = 0;
                                    objParameters.binnumber = result.getValue({ name: 'custrecord_ht_lista_bodegas' });
                                    objParameters.serieIdText = result.getText({ name: 'custrecord_ht_ot_serieproductoasignacion' });
                                    objParameters.serieIdValue = result.getValue({ name: 'custrecord_ht_ot_serieproductoasignacion' });
                                    objParameters.searchItem = result.getValue({ name: 'custrecord_ht_mc_seriedispositivo', join: 'custrecord_ht_ot_serieproductoasignacion' });
                                    return true;
                                });
                                //buscamos el item 
                                let searchDetalle = search.create({
                                    type: 'customrecord_ht_record_detallechaserdisp',
                                    filters: [
                                        ["internalid", "anyof", objParameters.searchItem]
                                    ],
                                    columns: [
                                        search.createColumn({ name: 'custrecord_ht_dd_dispositivo', label: 'Dispositivo' }),
                                        search.createColumn({ name: 'expenseaccount', join: 'CUSTRECORD_HT_DD_DISPOSITIVO', label: 'Item' })
                                    ]
                                });
                                searchDetalle.run().each(function (result) {
                                    objParameters.item = result.getValue({ name: 'custrecord_ht_dd_dispositivo' });
                                    objParameters.account = result.getValue({ name: 'expenseaccount', join: 'custrecord_ht_dd_dispositivo' });
                                    return true;
                                });
                                log.debug('objParameters JCEC', objParameters);
                                let idInventoryAdjustment = createInventoryAdjustment(objParameters);
                                log.debug('idInventoryAdjustment', idInventoryAdjustment);
                            }
                        } catch (error) {
                            log.error('Error-Desinstalación ajuste de inventario', error);
                        }
                        break;
                    default:
                }
                //cambio JCEC 20/08/2024
                // if (noChequeado == 1 ) {
                if (entregaCustodia == _constant.Valor.SI) {
                    noChequeado = 0
                }

                if (adpActivados == "001" || adpActivados == "051") {
                    log.debug('ACTIVADOS-DETECTADO', `Iniciando flujo activados (${adpActivados})`);

                    if (statusOri == _constant.Status.CHEQUEADO) {
                        let estado = objRecord.getValue('custrecord_ht_ot_estado');
                        let serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                        let boxserieLojack = objRecord.getValue('custrecord_ht_ot_boxserie');
                        let estadoChaser = objRecord.getValue('custrecord_ht_ot_estadochaser');
                        let vehiculo = objRecord.getValue('custrecord_ht_ot_vehiculo');
                        let ubicacion = objRecord.getValue('custrecord_ht_ot_ubicacion');

                        // OBTENER VID PARA ACTIVADOS
                        let vid = objRecord.getValue('custrecord_ht_ot_vid');

                        if (!vid && serieProducto) {
                            try {
                                // Primero obtener el ID del dispositivo del mantchaser
                                let mantchaserData = search.lookupFields({
                                    type: 'customrecord_ht_record_mantchaser',
                                    id: serieProducto,
                                    columns: ['custrecord_ht_mc_seriedispositivo']
                                });

                                if (mantchaserData.custrecord_ht_mc_seriedispositivo && mantchaserData.custrecord_ht_mc_seriedispositivo[0]) {
                                    let dispositivoId = mantchaserData.custrecord_ht_mc_seriedispositivo[0].value;

                                    // Buscar VID en el detalle del dispositivo
                                    let deviceDetailData = search.lookupFields({
                                        type: 'customrecord_ht_record_detallechaserdisp',
                                        id: dispositivoId,
                                        columns: ['custrecord_ht_dd_vid']
                                    });

                                    if (deviceDetailData.custrecord_ht_dd_vid) {
                                        vid = deviceDetailData.custrecord_ht_dd_vid;

                                        // Actualizar el campo VID en la OT
                                        record.submitFields({
                                            type: 'customrecord_ht_record_ordentrabajo',
                                            id: id,
                                            values: { 'custrecord_ht_ot_vid': vid },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                    } else {
                                        // Campo VID vacío en detalle dispositivo
                                    }
                                } else {
                                    // Mantchaser no tiene dispositivo asociado
                                }
                            } catch (e) {
                                log.error('ACTIVADOS-VID-ERROR', e.message);
                            }
                        }

                        if (estado == _constant.Status.CHEQUEADO && serieProducto && serieProducto.length > 0) {

                            if (boxserieLojack && boxserieLojack.length > 0) {
                                //LOJACK
                                record.submitFields({
                                    type: _constant.customRecord.CHASER,
                                    id: serieProducto,
                                    values: {
                                        'custrecord_ht_mc_ubicacion': ubicacionTextoOT,
                                        'custrecord_ht_mc_estadolojack': estadoChaser,
                                        'custrecord_ht_mc_vehiculo': objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                        'custrecord_ht_mc_ubicacion': ubicacion
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                let dispositivo = search.lookupFields({
                                    type: _constant.customRecord.CHASER,
                                    id: serieProducto,
                                    columns: ['custrecord_ht_mc_seriedispositivolojack']
                                });
                                if (dispositivo.custrecord_ht_mc_seriedispositivolojack && dispositivo.custrecord_ht_mc_seriedispositivolojack.length > 0) {
                                    let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                    record.submitFields({
                                        type: 'customrecord_ht_record_detallechaslojack',
                                        id: dispositivoid,
                                        values: { 'custrecord_ht_cl_estado': estadoChaser },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });
                                }
                            } else {
                                record.submitFields({
                                    type: _constant.customRecord.CHASER,
                                    id: serieProducto,
                                    values: {
                                        'custrecord_ht_mc_ubicacion': ubicacionTextoOT,
                                        'custrecord_ht_mc_estadolodispositivo': estadoChaser,
                                        'custrecord_ht_mc_vehiculo': objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                        'custrecord_ht_mc_ubicacion': ubicacion
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });

                                let dispositivo = search.lookupFields({
                                    type: _constant.customRecord.CHASER,
                                    id: serieProducto,
                                    columns: ['custrecord_ht_mc_seriedispositivo']
                                });
                                if (dispositivo.custrecord_ht_mc_seriedispositivo && dispositivo.custrecord_ht_mc_seriedispositivo.length > 0) {
                                    let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                    record.submitFields({
                                        type: 'customrecord_ht_record_detallechaserdisp',
                                        id: dispositivoid,
                                        values: { 'custrecord_ht_dd_estado': estadoChaser },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });
                                }
                            }

                            // --- CREAR COBERTURA PARA ACTIVADOS CON TIEMPO DINÁMICO ---
                            try {
                                // Obtener datos necesarios para la cobertura
                                let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                                let bienFinal = objRecord.getValue('custrecord_ht_ot_vehiculo');
                                let cliente = objRecord.getValue('custrecord_ht_ot_cliente_id');
                                let itemOT = objRecord.getValue('custrecord_ht_ot_item');

                                if (bienFinal && cliente && itemOT && idSalesorder) {
                                    // Buscar cobertura del item
                                    let busqueda_cobertura = getCoberturaItem(bienFinal);

                                    if (busqueda_cobertura && busqueda_cobertura.length > 0) {
                                        for (let i = 0; i < busqueda_cobertura.length; i++) {
                                            if (busqueda_cobertura[i][0] == itemOT) {
                                                let idCoberturaItem = busqueda_cobertura[i][1];

                                                // OBTENER TIEMPO DINÁMICAMENTE PARA ACTIVADOS
                                                let plazoActivados = 0;
                                                let tiempoCobertura = null;
                                                let familia = objRecord.getValue('custrecord_ht_ot_producto') || "0";

                                                try {
                                                    let serviceOS = record.load({ type: 'salesorder', id: idSalesorder });
                                                    let numLines_2 = serviceOS.getLineCount({ sublistId: 'item' });

                                                    for (let k = 0; k < numLines_2; k++) {
                                                        let items = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'item', line: k });
                                                        let itemtype = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: k });

                                                        try {
                                                            let familiaArtOS = _controller.getParameter(items, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);

                                                            // CAMBIO: Buscar tanto en Service como en Assembly/otros tipos pero priorizando Service
                                                            if (familia == familiaArtOS.idinterno) {
                                                                let quantity = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: k });
                                                                let unidadTiempo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: k });

                                                                // Si es Service, usar directamente
                                                                if (itemtype == 'Service' && quantity && parseInt(quantity) > 0 && unidadTiempo && unidadTiempo.length > 0) {
                                                                    plazoActivados = parseInt(quantity);

                                                                    // Convertir años a meses si es necesario
                                                                    if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                                                        plazoActivados = plazoActivados * 12;
                                                                    }

                                                                    // Calcular cobertura dinámica
                                                                    tiempoCobertura = getCobertura(plazoActivados, unidadTiempo, fechaChequeo);

                                                                    log.debug('ACTIVADOS-PLAZO-SERVICE', `Plazo dinámico Service: ${plazoActivados} meses`);
                                                                    break;
                                                                }
                                                                // Si no es Service pero tiene tiempo, usar como fallback
                                                                else if (itemtype != 'Service' && quantity && parseInt(quantity) > 0 && unidadTiempo && unidadTiempo.length > 0 && plazoActivados == 0) {
                                                                    let tempPlazo = parseInt(quantity);

                                                                    // Convertir años a meses si es necesario
                                                                    if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                                                        tempPlazo = tempPlazo * 12;
                                                                    }

                                                                    // Solo usar si no hemos encontrado un Service
                                                                    plazoActivados = tempPlazo;
                                                                    tiempoCobertura = getCobertura(plazoActivados, unidadTiempo, fechaChequeo);

                                                                    log.debug('ACTIVADOS-PLAZO-FALLBACK', `Plazo dinámico Fallback: ${plazoActivados} meses`);
                                                                }
                                                            }
                                                        } catch (paramError) {
                                                            // Error obteniendo parámetro para item
                                                        }
                                                    }
                                                } catch (timeError) {
                                                    log.error('ACTIVADOS-TIEMPO-DINAMICO-ERROR', timeError);
                                                }

                                                // Si no se encontró tiempo dinámico, usar el tiempo del flujo principal
                                                if (!tiempoCobertura && cantidad > 0 && undTiempo && undTiempo.length > 0) {
                                                    plazoActivados = cantidad;
                                                    tiempoCobertura = getCobertura(plazoActivados, undTiempo, fechaChequeo);

                                                    log.debug('ACTIVADOS-PLAZO-PRINCIPAL', `Usando plazo del flujo principal: ${plazoActivados} meses`);
                                                }

                                                // Si no se encontró tiempo dinámico, usar fallback
                                                if (!tiempoCobertura) {
                                                    tiempoCobertura = _controller.getCobertura(bienFinal);
                                                    plazoActivados = 0; // Mantener 0 como antes
                                                }

                                                log.debug('ACTIVADOS-PLAZO-FINAL', `Plazo final aplicado: ${plazoActivados} meses (${plazoActivados > 0 ? 'DINÁMICO' : 'ESTÁTICO'})`);

                                                if (tiempoCobertura) {
                                                    // Obtener TTR dinámicamente del campo producto (familia)
                                                    let ttrValue = objRecord.getValue('custrecord_ht_ot_producto') || "0";

                                                    // Construir JSON para cobertura con tiempo dinámico
                                                    let json = {
                                                        bien: bienFinal,
                                                        propietario: cliente,
                                                        start: tiempoCobertura.coberturaInicial,
                                                        plazo: plazoActivados, // AHORA ES DINÁMICO
                                                        end: tiempoCobertura.coberturaFinal, // AHORA ES DINÁMICO
                                                        estado: 1, // Activo
                                                        concepto: 15, // Concepto de activación
                                                        producto: itemOT,
                                                        serieproducto: serieProducto,
                                                        salesorder: idSalesorder,
                                                        ordentrabajo: id,
                                                        monitoreo: cliente,
                                                        cobertura: idCoberturaItem,
                                                        ttr: ttrValue,
                                                        estadoCobertura: plazoActivados > 0 ? 1 : 1, // Siempre activo para ACTIVADOS
                                                        t_PPS: false,
                                                        modeloDispositivo: objRecord.getValue('custrecord_ht_ot_modelo') || "",
                                                        unidadDispositivo: objRecord.getValue('custrecord_ht_ot_unidad') || "",
                                                        vidDispositivo: objRecord.getValue('custrecord_ht_ot_vid') || "",
                                                        esItemRepuesto: false,
                                                        esCambioSimCard: false,
                                                        subsidiary: objRecord.getValue('custrecord_ht_ot_subsidiary')
                                                    };

                                                    // Crear cobertura
                                                    json.objeto = 'impulso8';
                                                    createCoberturaWS(json);
                                                    log.debug('ACTIVADOS-COBERTURA-CREADA', `Cobertura creada con plazo: ${plazoActivados} meses`);
                                                }
                                                break;
                                            }
                                        }
                                    } else {
                                        // No se encontró cobertura para bien
                                    }
                                } else {
                                    // Faltan datos para cobertura
                                }
                            } catch (errorCobertura) {
                                log.error('ACTIVADOS-COBERTURA-ERROR', {
                                    error: errorCobertura.toString(),
                                    stack: errorCobertura.stack
                                });
                            }

                            // --- GENERAR FULFILLMENT PARA ACTIVADOS ---
                            try {
                                let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                                let idItemRelacionadoOT = objRecord.getValue('custrecord_ht_ot_itemrelacionado');

                                try {
                                    let ubicacion = objRecord.getValue('custrecord_ht_ot_ordenfabricacion') ? _controller.getLocationToAssembly(objRecord.getValue('custrecord_ht_ot_ordenfabricacion')) : 0;
                                    log.debug('LogtLocationToAssembly3', ubicacion);
                                    if (ubicacion == 0) {
                                        ubicacion = {};
                                        //let buscarLocacion = search.lookupFields({ type: 'salesorder', id: idSalesorder, columns: ['location'] });
                                        // ubicacion.location = buscarLocacion.location[0].value;
                                        ubicacion.location = objRecord.getValue('custrecord_ht_ot_location');
                                        ubicacion.binnumber = ''
                                        log.debug('LogtLocationToAssembly3', ubicacion);
                                    }

                                    let newFulfill = record.transform({
                                        fromType: record.Type.SALES_ORDER,
                                        fromId: idSalesorder,
                                        toType: record.Type.ITEM_FULFILLMENT,
                                        isDynamic: true
                                    });
                                    newFulfill.setValue({ fieldId: 'customform', value: _constant.Form.PE_DESPACHO });
                                    let numLines = newFulfill.getLineCount({ sublistId: 'item' });

                                    for (let i = 0; i < Number(numLines); i++) {
                                        newFulfill.selectLine({ sublistId: 'item', line: i });
                                        let idArticulo = newFulfill.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });

                                        if (idArticulo == idItemRelacionadoOT) {
                                            newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                                            newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: ubicacion.location });
                                            newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: idItemRelacionadoOT });
                                            newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });

                                            // DETALLE DE INVENTARIO SIMPLIFICADO
                                            try {
                                                let serieTexto = objRecord.getText('custrecord_ht_ot_serieproductoasignacion') ||
                                                    objRecord.getText('custrecord_ht_ot_boxserie')

                                                // Buscar el ID interno del número de serie usando el texto de la serie
                                                let inventoryNumberId = null;
                                                if (serieTexto) {
                                                    log.debug('objinventorynumber', {
                                                        serieTexto: serieTexto,
                                                        idItemRelacionadoOT: idItemRelacionadoOT
                                                    })
                                                    let invNumSearch = search.create({
                                                        type: 'inventorynumber',
                                                        filters: [
                                                            ['inventorynumber', 'is', serieTexto],
                                                            'AND',
                                                            ['item', 'anyof', idItemRelacionadoOT]
                                                        ],
                                                        columns: ['internalid']
                                                    });
                                                    invNumSearch.run().each(function (result) {
                                                        inventoryNumberId = result.getValue({ name: 'internalid' });
                                                        return false;
                                                    });
                                                }

                                                if (inventoryNumberId) {
                                                    log.debug('inventoryNumberIdr', {
                                                        serieTexto: serieTexto,
                                                        idItemRelacionadoOT: idItemRelacionadoOT,
                                                        inventoryNumberId: inventoryNumberId,
                                                        binnumber: ubicacion.binnumber
                                                    })
                                                    let inventoryDetail = newFulfill.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });

                                                    // Limpiar líneas existentes en el detalle de inventario
                                                    // if (inventoryDetail) {
                                                    //     let lineCount = inventoryDetail.getLineCount({ sublistId: 'inventoryassignment' });

                                                    //     // Eliminar todas las líneas existentes
                                                    //     for (let j = lineCount - 1; j >= 0; j--) {
                                                    //         inventoryDetail.selectLine({
                                                    //             sublistId: 'inventoryassignment',
                                                    //             line: j
                                                    //         });
                                                    //         inventoryDetail.removeLine({ sublistId: 'inventoryassignment' });
                                                    //     }
                                                    // }

                                                    inventoryDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                                                    inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: inventoryNumberId });
                                                    inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: ubicacion.binnumber });
                                                    //inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                                                    inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                                                    inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });
                                                    log.audit('ACTIVADOS-FULFILLMENT-INVENTORY', `Serie: ${serieTexto}, ID: ${inventoryNumberId}`);


                                                    // inventoryDetail.selectLine({ sublistId: 'inventoryassignment', line: 0 })
                                                    // inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: ubicacion.binnumber });
                                                    // inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                                                    // inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                                                    // inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });
                                                } else {
                                                    log.audit('ACTIVADOS-FULFILLMENT-NO-INVENTORY', `Serie no encontrada: ${serieTexto}`);
                                                }
                                            } catch (e) {
                                                log.error('ACTIVADOS-FULFILLMENT-INVENTORY-ERROR', e.message);
                                            }
                                        }
                                        newFulfill.commitLine({ sublistId: 'item' });
                                    }

                                    let fulfillment = newFulfill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                    log.audit('ACTIVADOS-FULFILLMENT-SUCCESS', `ID: ${fulfillment}`);

                                } catch (error) {
                                    log.error('ACTIVADOS-FULFILLMENT-ERROR', error.message);
                                }
                            } catch (errorExterno) {
                                log.error('ACTIVADOS-FULFILLMENT-GENERAL-ERROR', errorExterno.message);
                            }
                        }
                    } else {
                        // No es status CHEQUEADO para ACTIVADOS
                    } noChequeado = 0
                }

                // AGREGAR LOG FINAL ANTES DE DECIDIR EL ESTADO
                // log.debug('ESTADO-FINAL-VARIABLES', {
                //     cantidad: cantidad,
                //     undTiempo: undTiempo,
                //     noChequeado: noChequeado,
                //     flujoAccesorio: flujoAccesorio,
                //     esCambioSimCard: esCambioSimCard,
                //     esItemRepuesto: esItemRepuesto,
                //     ejecutarFulFillment: ejecutarFulFillment,
                //     adpActivados: typeof adpActivados !== 'undefined' ? adpActivados : 'undefined',
                //     statusOri: typeof statusOri !== 'undefined' ? statusOri : 'undefined',
                //     estado_actual: objRecord.getValue('custrecord_ht_ot_estado'),
                //     timestamp: new Date().toISOString()
                // });

                log.debug('IngresoCambioProcesando', `(${noChequeado} == 1 && ${flujoAccesorio} == false && ${esCambioSimCard} == false && ${esItemRepuesto} == false) || ${ejecutarFulFillment} == 0 && ${esCambioSimCard} == false && ${esItemRepuesto} == false`)
                if ((noChequeado == 1 && flujoAccesorio == false && esCambioSimCard == false && esItemRepuesto == false) || (ejecutarFulFillment == 0 && esCambioSimCard == false && esItemRepuesto == false)) {
                    log.debug('Change-Status', 'Entré a cambiar estado a PROCESANDO');
                    record.submitFields({
                        type: objRecord.type,
                        id: id,
                        values: { 'custrecord_ht_ot_estado': _constant.Status.PROCESANDO },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                } else {
                    let values = {}
                    let horaChequeo = getHoraChequeo();
                    if (timeFormat == 'h:mm a') {
                        horaChequeo = getHoraChequeoAMPM();
                    }
                    //log.debug('horaChequeo', horaChequeo)
                    values.custrecord_ht_ot_fechatrabajoasignacion = new Date(fechaChequeo)
                    if (!objRecord.getValue('custrecord_ht_ot_horatrabajoasignacion')) {
                        values.custrecord_ht_ot_horatrabajoasignacion = horaChequeo
                    }
                    record.submitFields({
                        type: objRecord.type,
                        id: id,
                        values: values,
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                }
            }
        }

        const createInventoryAdjustment = (objParameters) => {
            try {
                let newInventoryAdjustment = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
                newInventoryAdjustment.setValue({ fieldId: 'subsidiary', value: objParameters.subsidiary });
                newInventoryAdjustment.setValue({ fieldId: 'adjlocation', value: objParameters.adjlocation });
                newInventoryAdjustment.setValue({ fieldId: 'department', value: objParameters.department });
                newInventoryAdjustment.setValue({ fieldId: 'class', value: objParameters.class });
                newInventoryAdjustment.setValue({ fieldId: 'account', value: objParameters.account });
                newInventoryAdjustment.setValue({ fieldId: 'trandate', value: new Date() });
                newInventoryAdjustment.setValue({ fieldId: 'memo', value: 'Retorno por devolución' });
                newInventoryAdjustment.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: objParameters.ordenServicio });

                newInventoryAdjustment.selectNewLine({ sublistId: 'inventory' });
                newInventoryAdjustment.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: objParameters.item });
                newInventoryAdjustment.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: objParameters.adjlocation });
                newInventoryAdjustment.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'department', value: objParameters.department });
                newInventoryAdjustment.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'class', value: objParameters.class });
                newInventoryAdjustment.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: objParameters.cantidad });
                //newInventoryAdjustment.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: objParameters.unitcost });

                let newDetail = newInventoryAdjustment.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: objParameters.serieIdText });
                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: objParameters.binnumber });
                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: objParameters.cantidad });
                newDetail.commitLine({ sublistId: 'inventoryassignment' });
                newInventoryAdjustment.commitLine({ sublistId: 'inventory' });
                let idInventoryAdjustment = newInventoryAdjustment.save();
                return idInventoryAdjustment;
            } catch (error) {
                log.error('Error en createInventoryAdjustment', error);
            }
        }

        const getParamFamiliaProductosArticuloOSDesinstalacion = (Parameter, ArticuloOS, Valor) => {
            try {
                let respuesta = {};
                let customrecord_ht_pp_main_param_prodSearchObj = search.create({
                    type: "customrecord_ht_pp_main_param_prod",
                    filters:
                        [
                            ["custrecord_ht_pp_parametrizacionid.internalid", "anyof", ArticuloOS],
                            "AND",
                            ["custrecord_ht_pp_parametrizacion_rela", "anyof", Parameter],
                            "AND",
                            ["custrecord_ht_pp_parametrizacion_valor", "anyof", Valor]
                        ],
                    columns:
                        [

                            search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." }),
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Parametrización" }),
                            search.createColumn({ name: "custrecord_ht_pp_aplicacion", label: "Aplicación" }),
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" })
                        ]
                });
                let searchResultCount = customrecord_ht_pp_main_param_prodSearchObj.runPaged().count;
                log.debug("JCEC customrecord_ht_pp_main_param_prodSearchObj result count", searchResultCount);
                customrecord_ht_pp_main_param_prodSearchObj.run().each(function (result) {
                    respuesta = {
                        valor: result.getValue({ name: "custrecord_ht_pp_parametrizacion_valor" }),
                        valorTexto: result.getText({ name: "custrecord_ht_pp_parametrizacion_valor" }),
                        aplicacion: result.getValue({ name: "custrecord_ht_pp_aplicacion" })
                    }
                    return true;
                });
                return respuesta;
            } catch (error) {
                log.error('Error en getParamFamiliaProductosArticuloOSDesinstalacion', error);
            }
        }

        const createInventoryAdjustmentDesinstalacionFlujoAccesorio = (objParameters) => {
            try {
                let respuestaHistorialAF = [];
                let historialAFSearch = search.create({
                    type: "customrecord_ht_record_historialsegui",
                    filters:
                        [
                            ["custrecord_ht_af_enlace.custrecord_assetserialno", "startswith", objParameters.serie],
                            "AND",
                            ["custrecord_ht_hs_vidvehiculo", "startswith", objParameters.bien],
                            "AND",
                            ["custrecord_ht_hs_estado", "anyof", _constant.Status.INSTALADO]
                        ],
                    columns:
                        [
                            'internalid',
                            'custrecord_ht_af_enlace',
                            'custrecord_ht_hs_numeroordenservicio',
                            'custrecord_ht_hs_fechaordenservicio'

                        ]
                });

                historialAFSearch.run().each(function (result) {
                    respuestaHistorialAF.push({
                        id: result.id,
                        enlace: result.getValue('custrecord_ht_af_enlace'),
                        ordenServicioInstalacion: result.getValue('custrecord_ht_hs_numeroordenservicio'),
                        fechaOrdenServicioInstalacion: result.getValue('custrecord_ht_hs_fechaordenservicio')
                    });
                    return true;
                });

                //ordenamos la respuesta por fecha de orden de servicio de forma descendente
                respuestaHistorialAF.sort((a, b) => new Date(b.fechaOrdenServicioInstalacion) - new Date(a.fechaOrdenServicioInstalacion));

                //obtenemos el primer registro de la respuesta
                let historialAF = respuestaHistorialAF[0];

                log.debug('JCEC historialAF', historialAF);

                //Buscamos la Orden de Trabajo de la Orden de Servicio de Instalación
                let ordenTrabajoInstalacion = search.create({
                    type: "customrecord_ht_record_ordentrabajo",
                    filters:
                        [
                            ["custrecord_ht_ot_orden_servicio", "anyof", historialAF.ordenServicioInstalacion]
                        ],
                    columns:
                        [
                            'internalid'
                        ]
                });

                let ordenTrabajo;

                ordenTrabajoInstalacion.run().each(function (result) {
                    ordenTrabajo = result.getValue('internalid');
                    return true;
                });

                log.debug('JCEC ordenTrabajo', ordenTrabajo);

                //Buscamos el HT - Ajustes Relacionado

                let customrecord_ht_ajuste_relacionadosSearchObj = search.create({
                    type: "customrecord_ht_ajuste_relacionados",
                    filters:
                        [
                            ["custrecord_ts_ajuste_rela_orden_trabajo", "anyof", ordenTrabajo],
                            "AND",
                            ["custrecord_ht_tipo_mov", "anyof", "2"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "ID" }),
                            search.createColumn({ name: "custrecord_ts_ajuste_rela_orden_trabajo", label: "Transacciones" }),
                            search.createColumn({ name: "custrecord_ts_ajuste_rela_transacci_gene", label: "Transaccion Generada" }),

                        ]
                });

                let idAjusteRelacionado;

                customrecord_ht_ajuste_relacionadosSearchObj.run().each(function (result) {
                    idAjusteRelacionado = result.getValue('custrecord_ts_ajuste_rela_transacci_gene');
                    return true;
                });

                log.debug('JCEC idAjusteRelacionado', idAjusteRelacionado);

                //creamos una copia del ajuste relacionado para la desinstalación

                try {


                    let ajusteIntalacion = record.load({
                        type: 'inventoryadjustment',
                        id: idAjusteRelacionado,
                        isDynamic: true
                    });
                    //buscamos el ajuste de inventario relacionado 
                    let inventoryadjustmentSearchObj = search.create({
                        type: "inventoryadjustment",
                        filters:
                            [
                                ["type", "anyof", "InvAdjst"],
                                "AND",
                                ["internalid", "anyof", idAjusteRelacionado],
                                "AND",
                                ["quantity", "isnotempty", ""]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID interno" }),
                                search.createColumn({
                                    name: "item",
                                    join: "inventoryDetail",
                                    label: "Artículo"
                                }),
                                search.createColumn({
                                    name: "serialnumber",
                                }),
                                search.createColumn({
                                    name: "quantity",
                                    join: "inventoryDetail",
                                    label: "Cantidad"
                                }),
                                search.createColumn({
                                    name: "binnumber",
                                    join: "inventoryDetail",
                                    label: "Número de depósito"
                                }),
                                search.createColumn({
                                    name: "inventorynumber",
                                    join: "inventoryDetail",
                                    label: "Número"
                                }),
                                search.createColumn({
                                    name: "status",
                                    join: "inventoryDetail",
                                    label: "Estado"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    join: "inventoryDetail",
                                    label: "Oficina"
                                }),
                                search.createColumn({
                                    name: "location",
                                    join: "inventoryDetail",
                                    label: "Oficina"
                                }),
                                search.createColumn({
                                    name: "itemcount",
                                    join: "inventoryDetail",
                                    label: "Recuento de artículos"
                                })
                            ]
                    });

                    let searchResultCount = inventoryadjustmentSearchObj.runPaged().count;
                    log.debug("inventoryadjustmentSearchObj result count", searchResultCount);
                    let inventoryAdjusment = [];

                    inventoryadjustmentSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        inventoryAdjusment.push({
                            id: result.getValue('internalid'),
                            item: result.getValue({ name: "item", join: "inventoryDetail" }),
                            quantity: result.getValue({ name: "quantity", join: "inventoryDetail" }),
                            binnumber: result.getValue({ name: "binnumber", join: "inventoryDetail" }),
                            inventorynumber: result.getValue({ name: "serialnumber" }),
                            idInventory: result.getValue({ name: "internalid", join: "inventoryDetail" }),
                            status: result.getValue({ name: "status", join: "inventoryDetail" }),
                            location: result.getValue({ name: "location", join: "inventoryDetail" }),
                            itemcount: result.getValue({ name: "itemcount", join: "inventoryDetail" })
                        });
                        return true;
                    });

                    let ajusteDesinstalacion = record.create({
                        type: 'inventoryadjustment',
                        isDynamic: true
                    });

                    let datosAjusteOld = {
                        customer: ajusteIntalacion.getValue({ fieldId: 'customer' }),
                        account: ajusteIntalacion.getValue({ fieldId: 'account' }),
                        subsidiary: ajusteIntalacion.getValue({ fieldId: 'subsidiary' }),
                        location: ajusteIntalacion.getValue({ fieldId: 'adjlocation' }),
                        class: ajusteIntalacion.getValue({ fieldId: 'class' })
                    }

                    log.debug('JCEC datosAjusteOld', datosAjusteOld);



                    //Busqueda de deposito para alquiler
                    let depositoAlquiler = search.create({
                        type: "bin",
                        filters:
                            [
                                ["location", "anyof", datosAjusteOld.location],
                                "AND",
                                ["custrecord_deposito_para_alquiler", "is", "T"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "ID interno" }),
                                search.createColumn({ name: "binnumber", label: "Número de depósito" }),
                                search.createColumn({ name: "location", label: "Oficina" }),
                                search.createColumn({ name: "memo", label: "Nota" }),
                                search.createColumn({ name: "custrecord_deposito_para_alquiler", label: "Depósito para Alquiler" }),
                                search.createColumn({ name: "custrecord_deposito_para_bodega_comercia", label: "Deposito para bodega comercial" }),
                                search.createColumn({ name: "custrecord_deposito_para_custodia", label: "Deposito para Custodia" })
                            ]
                    });

                    let idDepositoAlquiler = depositoAlquiler.run().getRange(0, 1)[0].getValue('internalid');



                    //actualizamos el campo de la ejecucion relacionada con la orden de servicio de desinstalación
                    ajusteDesinstalacion.setValue({ fieldId: 'subsidiary', value: datosAjusteOld.subsidiary });
                    ajusteDesinstalacion.setValue({ fieldId: 'customer', value: datosAjusteOld.customer });
                    ajusteDesinstalacion.setValue({ fieldId: 'account', value: datosAjusteOld.account });
                    ajusteDesinstalacion.setValue({ fieldId: 'adjlocation', value: datosAjusteOld.location });
                    ajusteDesinstalacion.setValue({ fieldId: 'class', value: datosAjusteOld.class });


                    ajusteDesinstalacion.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: objParameters.custrecord_ht_ot_orden_servicio });
                    ajusteDesinstalacion.setValue({ fieldId: 'estimatedtotalvalue', value: 0 });
                    ajusteDesinstalacion.setValue({ fieldId: 'memo', value: 'Ajuste de ingreso por alquiler.' });
                    ajusteDesinstalacion.setValue({ fieldId: 'trandate', value: new Date() });


                    //Actualizamos las Lineas del Ajuste Relacionado
                    let lineCount = ajusteIntalacion.getLineCount({ sublistId: 'inventory' });

                    for (let i = 0; i < lineCount; i++) {
                        //obtenemos la linea antes de modificarla
                        let lineOldAdjustQtyBy = ajusteIntalacion.getSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', line: i });
                        ajusteDesinstalacion.selectNewLine({ sublistId: 'inventory' });
                        ajusteDesinstalacion.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: ajusteIntalacion.getSublistValue({ sublistId: 'inventory', fieldId: 'item', line: i }) });
                        ajusteDesinstalacion.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: datosAjusteOld.location });
                        ajusteDesinstalacion.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: lineOldAdjustQtyBy * -1 });
                        ajusteDesinstalacion.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: 0 });

                        let newDetail = ajusteDesinstalacion.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                        let oldDetail = inventoryAdjusment.filter(e => e.item == ajusteIntalacion.getSublistValue({ sublistId: 'inventory', fieldId: 'item', line: i }));
                        log.debug('JCEC oldDetail', oldDetail);

                        newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: oldDetail[0].inventorynumber });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'location', value: datosAjusteOld.location });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: idDepositoAlquiler });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: lineOldAdjustQtyBy * -1 });

                        newDetail.commitLine({ sublistId: 'inventoryassignment' });
                        ajusteDesinstalacion.commitLine({ sublistId: 'inventory' });
                    }


                    let idAjusteRelacionadoDesinstalacion = ajusteDesinstalacion.save();

                    log.debug('JCEC idAjusteRelacionadoDesinstalacion', idAjusteRelacionadoDesinstalacion);

                    //creamos el customrecord_ht_ajuste_relacionados
                    try {
                        let objRecordCreateAjusteRelacionados = record.create({
                            type: 'customrecord_ht_ajuste_relacionados',
                            isDynamic: true
                        });

                        objRecordCreateAjusteRelacionados.setValue({
                            fieldId: 'custrecord_ts_ajuste_rela_orden_trabajo',
                            value: objParameters.ordentrabajoId, ignoreFieldChange: true
                        });

                        objRecordCreateAjusteRelacionados.setValue({
                            fieldId: 'custrecord_ts_ajuste_rela_transacci_gene',
                            value: idAjusteRelacionadoDesinstalacion,
                            ignoreFieldChange: true
                        });

                        objRecordCreateAjusteRelacionados.setValue({
                            fieldId: 'custrecord_ht_tipo_mov',
                            value: objParameters.TipoAjuste, //2 Salida 1 Ingreso
                            ignoreFieldChange: true
                        });

                        objRecordCreateAjusteRelacionados.setValue({
                            fieldId: 'custrecord_ts_ajuste_rela_fecha',
                            value: new Date(),
                            ignoreFieldChange: true
                        });

                        objRecordCreateAjusteRelacionados.save();

                    } catch (error) {
                        log.error('Error-createInventoryAdjustmentDesinstalacionFlujoAccesorio', error);
                    }


                } catch (error) {
                    log.error('Error-createInventoryAdjustmentDesinstalacionFlujoAccesorio', error);
                }

            } catch (error) {
                log.error('Error-createInventoryAdjustmentDesinstalacionFlujoAccesorio', error);
            }
        }

        const setServices = (bien, idSalesorder, id, objRecord) => {
            let objRecordCreateServicios = record.create({ type: 'customrecord_ht_nc_servicios_instalados', isDynamic: true });
            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_bien_si', value: bien, ignoreFieldChange: true });
            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_servicio_si', value: idSalesorder, ignoreFieldChange: true });
            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_trabajo', value: id, ignoreFieldChange: true });
            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_servicio', value: objRecord.getValue('custrecord_ht_ot_servicios_commands'), ignoreFieldChange: true });
            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ht_si_numero_puertas', value: objRecord.getValue('custrecord_ht_ot_numero_puertas'), ignoreFieldChange: true });
            objRecordCreateServicios.setValue({ fieldId: 'custrecord_ht_si_novedad', value: objRecord.getValue('custrecord_ht_ot_observacion'), ignoreFieldChange: true });
            objRecordCreateServicios.save();
            return objRecordCreateServicios;
        }

        const createAssetValues = (newRec) => {
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

        const createAcquisitionHistoryFromRecord = (taxRec) => {
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
            var history = record.create({ type: "customrecord_ncfar_deprhistory" });
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
            return history.save({ enableSourcing: false, ignoreMandatoryFields: true });
        }

        const getSalesOrderItem = (idBienorSalesOrder, checkConvenio, valorParametro) => {
            log.debug('getSalesOrderItem-Params', {
                idBienorSalesOrder: idBienorSalesOrder,
                checkConvenio: checkConvenio,
                valorParametro: valorParametro
            })
            let internalidItem = '',
                internalid = '',
                arrayIdTotal = [];

            try {
                if (checkConvenio) {
                    let busqueda = search.create({
                        type: "salesorder",
                        filters:
                            [
                                ["type", "anyof", "SalesOrd"],
                                "AND",
                                ["internalid", "anyof", idBienorSalesOrder],
                                "AND",
                                ["mainline", "is", "F"],
                                "AND",
                                ["formulatext: CASE WHEN {item} = 'S-EC' THEN 0 ELSE 1 END", "is", "1"],
                                "AND",
                                ["status", "noneof", "SalesOrd:C", "SalesOrd:H", "SalesOrd:A"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "item", summary: "GROUP", label: "Item" }),
                                search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                            ]
                    });
                    let savedsearch = busqueda.run().getRange(0, 100);
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
                    } else {
                        arrayIdTotal = 0;
                    }
                } else {
                    let sqlGetSalesOrders = "SELECT tl.item as item, tr.id as id, tr.status, tl.isclosed FROM TransactionLine tl " +
                        "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacionid = tl.item " +
                        "INNER JOIN transaction tr ON tr.id = tl.transaction " +
                        "WHERE (custcol_ht_os_tipoarticulo = 'Service' OR custcol_ht_os_tipoarticulo = 'Servicio') " +
                        "AND tr.status != 'A' " +
                        "AND tr.status != 'C' " +
                        "AND tr.status != 'H' " +
                        "AND tl.isclosed = 'F' " +
                        "AND pa.custrecord_ht_pp_parametrizacion_valor = ? " +
                        "AND tr.custbody_ht_so_bien = ?"
                    "AND tr.subidiary = 3"

                    let resultSet = query.runSuiteQL({ query: sqlGetSalesOrders, params: [valorParametro, idBienorSalesOrder] });
                    let results = resultSet.asMappedResults();

                    if (results.length > 0) {
                        let arrayId = [];
                        for (let index = 0; index < results.length; index++) {
                            const element = results[index];
                            internalidItem = element.item
                            arrayId.push(internalidItem);
                            internalid = element.id
                            arrayId.push(internalid);
                            arrayIdTotal.push(arrayId);
                        }
                    } else {
                        arrayIdTotal = 0;
                    }
                }

                return arrayIdTotal;
            } catch (e) {
                log.error('Error en getSalesOrder', e);
            }
        }

        const getSalesOrderItemActivados = (idBienorSalesOrder, checkConvenio, valorParametro) => {
            let internalidItem = '',
                internalid = '',
                arrayIdTotal = [];

            try {
                if (checkConvenio) {
                    let busqueda = search.create({
                        type: "salesorder",
                        filters:
                            [
                                ["type", "anyof", "SalesOrd"],
                                "AND",
                                ["internalid", "anyof", idBienorSalesOrder],
                                "AND",
                                ["mainline", "is", "F"],
                                "AND",
                                ["formulatext: CASE WHEN {item} = 'S-EC' THEN 0 ELSE 1 END", "is", "1"],
                                "AND",
                                ["status", "noneof", "SalesOrd:C", "SalesOrd:H", "SalesOrd:A"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "item", summary: "GROUP", label: "Item" }),
                                search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                            ]
                    });
                    let savedsearch = busqueda.run().getRange(0, 100);
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
                    } else {
                        arrayIdTotal = 0;
                    }
                } else {
                    let sqlGetSalesOrders = "SELECT tl.item as item, tr.id as id, tr.status, tl.isclosed FROM TransactionLine tl " +
                        "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacionid = tl.item " +
                        "INNER JOIN transaction tr ON tr.id = tl.transaction " +
                        "WHERE (custcol_ht_os_tipoarticulo = 'Service' OR custcol_ht_os_tipoarticulo = 'Servicio' OR custcol_ht_os_tipoarticulo = 'Ensamblaje' OR custcol_ht_os_tipoarticulo = 'Assembly') " +
                        "AND tr.status != 'A' " +
                        "AND tr.status != 'C' " +
                        "AND tr.status != 'H' " +
                        "AND tl.isclosed = 'F' " +
                        "AND pa.custrecord_ht_pp_parametrizacion_valor = ? " +
                        "AND tr.custbody_ht_so_bien = ?"
                    "AND tr.subidiary = 3"

                    let resultSet = query.runSuiteQL({ query: sqlGetSalesOrders, params: [valorParametro, idBienorSalesOrder] });
                    let results = resultSet.asMappedResults();

                    if (results.length > 0) {
                        let arrayId = [];
                        for (let index = 0; index < results.length; index++) {
                            const element = results[index];
                            internalidItem = element.item
                            arrayId.push(internalidItem);
                            internalid = element.id
                            arrayId.push(internalid);
                            arrayIdTotal.push(arrayId);
                        }
                    } else {
                        arrayIdTotal = 0;
                    }
                }

                return arrayIdTotal;
            } catch (e) {
                log.error('Error en getSalesOrder', e);
            }
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
            // Log esencial para monitorear el plazo
            log.debug('COBERTURA-WS-PLAZO', `Creando cobertura con plazo: ${json.plazo} meses, estado: ${json.estadoCobertura}`);

            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            try {
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(json),
                    deploymentId: 'customdeploy_ts_rs_integration_plata_pe',
                    scriptId: 'customscript_ts_rs_integration_plata_pe',
                    headers: myRestletHeaders,
                });
                let response = myRestletResponse.body;

            } catch (error) {
                log.error('COBERTURA-WS-ERROR', {
                    error: error.toString(),
                    plazo: json.plazo,
                    timestamp: new Date().toISOString()
                });
            }
        }

        const getInventoryNumber = (inventorynumber, item) => {
            log.error('VerParams', inventorynumber + ' - ' + item);
            try {
                let busqueda = search.create({
                    type: "inventorynumber",
                    filters:
                        [
                            //["inventorynumber", "is", inventorynumber],
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
                let savedsearch = busqueda.run().getRange(0, 1);
                log.error('InventoryNumber', savedsearch);
                let idInventoryNumber = '';
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
            log.debug('idItemTypePR', id)
            try {
                var busqueda = search.create({
                    type: "serviceitem",
                    filters:
                        [
                            ["type", "anyof", "Service"],
                            "AND",
                            ["unitstype", "anyof", "2"], //6 = Plazo / 2 = Servicio
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

        const getCobertura = (cantidad, undTiempo, fechaChequeo) => {
            // AGREGAR LOGS PARA DIAGNOSTICAR PLAZO 0
            log.debug('GETCOBERTURA-INPUT', {
                cantidad: cantidad,
                cantidad_tipo: typeof cantidad,
                cantidad_parsed: parseInt(cantidad),
                undTiempo: undTiempo,
                fechaChequeo: fechaChequeo,
                timestamp: new Date().toISOString()
            });

            let date = new Date(fechaChequeo);
            date.setDate(date.getDate());
            let dateChequeo = convertFechaFinalToCobertura(fechaChequeo)
            let date_final = new Date(dateChequeo);

            try {
                if (undTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                    cantidad = parseInt(cantidad) * 12
                    date_final.setDate(date_final.getDate());
                    date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
                    log.debug('GETCOBERTURA-ANIO', {
                        cantidad_original: cantidad / 12,
                        cantidad_meses: cantidad,
                        nueva_fecha: date_final
                    });
                } else if (undTiempo == _constant.Constants.UNIDAD_TIEMPO.DIA) {
                    date_final.setDate(date_final.getDate() + parseInt(cantidad));
                    log.debug('GETCOBERTURA-DIA', {
                        cantidad_dias: cantidad,
                        nueva_fecha: date_final
                    });
                } else {
                    date_final.setDate(date_final.getDate());
                    date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
                    log.debug('GETCOBERTURA-MESES', {
                        cantidad_meses: cantidad,
                        nueva_fecha: date_final
                    });
                }

                date_final = new Date(date_final);
                let horaChequeo = getHoraChequeo();
                date_final.setHours(date_final.getHours() + Number(horaChequeo.split(":")[0]));
                let fechaAjustada = date_final.toISOString();

                let resultado = {
                    coberturaInicial: date,
                    coberturaFinal: fechaAjustada
                };

                log.debug('GETCOBERTURA-OUTPUT', {
                    resultado: resultado,
                    plazo_aplicado: cantidad,
                    unidad: undTiempo,
                    fecha_inicial: date,
                    fecha_final: fechaAjustada
                });

                return resultado;
            } catch (e) {
                log.error('GETCOBERTURA-ERROR', {
                    error: e.toString(),
                    cantidad: cantidad,
                    undTiempo: undTiempo,
                    fechaChequeo: fechaChequeo
                });
            }
        }

        const createCertificadoInstalacionButton = (form, objRecord) => {
            var id = objRecord.id;
            const type = "instalacion";
            const printCertificado = `printCertificado('${id}', '${type}')`;
            form.addButton({ id: 'custpage_btn_cert_inst', label: 'Certificado de Instalación', functionName: printCertificado });
        }

        const createCertificadoPropiedadButton = (form, objRecord) => {
            var id = objRecord.id;
            const type = "propiedad";
            const printCertificado = `printCertificado('${id}', '${type}')`;
            form.addButton({ id: 'custpage_btn_cert_prop', label: 'Certificado de Instalación', functionName: printCertificado });
        }

        const createEnsambleGarantiaButton = (form, objRecord) => {
            let checkFlujoGarantia = objRecord.getValue('custrecord_flujo_de_garantia')
            let itemVenta = objRecord.getValue('custrecord_ts_item_venta_garantia') || "";
            let status = objRecord.getValue('custrecord_ht_ot_estado')
            if (checkFlujoGarantia == false || status != _constant.Status.PROCESANDO) return
            let salesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let workorder = objRecord.id;
            let customer = objRecord.getValue('custrecord_ht_ot_cliente_id');
            let item = objRecord.getValue('custrecord_ht_ot_item');
            let subsidiary = objRecord.getValue('custrecord_ht_ot_subsidiary');
            let location = objRecord.getValue('custrecord_ht_ot_location');
            if (salesorder && !location) {
                locationSearch = search.lookupFields({ type: 'salesorder', id: salesorder, columns: ['location'] });
                location = locationSearch.location[0].value;
            }
            const ensambleGarantia = `ensambleGarantia('${itemVenta}', '${location}', '${workorder}', '${salesorder}', '${customer}',  '${subsidiary}')`;
            form.addButton({ id: 'custpage_btngarantia', label: 'Ensamble Garantía', functionName: ensambleGarantia });
        }

        const createEnsambleCustodiaButton = (form, objRecord) => {
            let checkFlujoCustodia = objRecord.getValue('custrecord_flujo_de_custodia')
            let status = objRecord.getValue('custrecord_ht_ot_estado')
            if (checkFlujoCustodia == false || status != _constant.Status.PROCESANDO) return
            let salesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let workorder = objRecord.id;
            let customer = objRecord.getValue('custrecord_ht_ot_cliente_id');
            let item = objRecord.getValue('custrecord_ht_ot_item');
            let subsidiary = objRecord.getValue('custrecord_ht_ot_subsidiary');
            let relateditem = objRecord.getValue('custrecord_ht_ot_itemrelacionado');
            let location = objRecord.getValue('custrecord_ht_ot_location');
            if (salesorder && !location) {
                locationSearch = search.lookupFields({ type: 'salesorder', id: salesorder, columns: ['location'] });
                location = locationSearch.location[0].value;
            }

            const ensambleCustodia = `ensambleCustodia('${item}', '${relateditem}', '${location}', '${workorder}', '${salesorder}', '${customer}', '${subsidiary}')`;
            form.addButton({ id: 'custpage_btncustodia', label: 'Reinstalación de Custodia', functionName: ensambleCustodia });
        }

        const createEnsambleAlquilerButton = (form, objRecord) => {
            let checkFlujoAluiler = objRecord.getValue('custrecord_flujo_de_alquiler')
            if (checkFlujoAluiler == false) return
            let salesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let workorder = objRecord.id;
            let customer = objRecord.getValue('custrecord_ht_ot_cliente_id');
            let item = objRecord.getValue('custrecord_ht_ot_item');
            let subsidiary = objRecord.getValue('custrecord_ht_ot_subsidiary');
            let location = objRecord.getValue('custrecord_ht_ot_location');
            if (salesorder && !location) {
                locationSearch = search.lookupFields({ type: 'salesorder', id: salesorder, columns: ['location'] });
                location = locationSearch.location[0].value;
            }
            const ensambleAlquiler = `ensambleAlquiler('${item}', '${location}', '${workorder}', '${salesorder}', '${customer}', '${subsidiary}')`;
            form.addButton({ id: 'custpage_btnalquiler', label: 'Ensamble Alquiler', functionName: ensambleAlquiler });
        }

        const showPlataformaErrors = (form) => { }

        const viewMessage = (form) => {
            require(["N/ui/message", "N/search"], function (message, search) {
                console.log("Que paso?");
                function execute() {
                    var onViewMessage = message.create({
                        title: "Prueba Plataforma",
                        message: "prueba",
                        type: message.Type.INFORMATION,
                    });
                    onViewMessage.show(3000);
                }
                execute();
            });
        }

        const validateExistAssemblyForOT = (otid) => {
            let sql = "SELECT COUNT(*) as cantidad FROM transaction WHERE custbody_ht_ce_ordentrabajo = ? AND recordtype = 'assemblybuild'";
            let resultSet = query.runSuiteQL({ query: sql, params: [otid] });
            let results = resultSet.asMappedResults();
            let cantidad = results[0]['cantidad'] == 0 ? results[0]['cantidad'] : 1;
            return cantidad;
        }

        const getItemForFulfillment = (item, itemSerie) => {
            log.debug('getItemForFulfillment', `${item}-${itemSerie}`)
            let sql = "SELECT inn.id as inventoryid FROM inventorynumber inn INNER JOIN InventoryNumberInventoryBalance inb ON inn.id = inb.inventorynumber WHERE inn.item = ? AND inn.inventorynumber = ?";
            let params = [item, itemSerie]
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults();
            if (results.length > 0) {
                return results[0]['inventoryid'];
            } else {
                return 0
            }
        }

        const getSerieItemProduccionAlquiler = (datosTecnicos) => {
            let sql = 'SELECT custrecord_ht_mc_serie_cargo as seriealquilerprod FROM customrecord_ht_record_mantchaser WHERE id = ?';
            let params = [datosTecnicos]
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults();
            if (results.length > 0) {
                return results[0].seriealquilerprod/* == null ? 0 : 1*/
            } else {
                return 0;
            }
        }

        const saveJson = (contents, nombre) => {
            let name = new Date();
            let fileObj = file.create({
                name: `${nombre}_${name}.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: 575,
                isOnline: false
            });
            // Save the file
            let id = fileObj.save();
        }

        const buscarOSItemRenovacionNoAplicadaIndependiente = (entity, paramRenoAnt, thisOrdenServicio, bien, familia) => {
            let arrayDataRenovacion = new Array();
            try {
                let sql = "SELECT tr.id as id, tl.item as item, tl.custcol_ht_os_tiempo_cobertura as tiempo, tl.custcol_ht_os_und_tiempo_cobertura as unidad FROM TransactionLine tl " +
                    "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacionid = tl.item " +
                    "INNER JOIN transaction tr ON tr.id = tl.transaction " +
                    "WHERE custcol_ht_os_tipoarticulo = 'Service' " +
                    "AND tr.custbody_ht_so_renovacion_aplicada = 'F' " +
                    "AND tr.status != 'A' " +
                    "AND tr.status != 'C' " +
                    "AND tr.status != 'H' " +
                    "AND tl.entity = ? " +
                    "AND pa.custrecord_ht_pp_parametrizacion_valor = ? " +
                    "AND tr.id != ? " +
                    "AND tr.custbody_ht_so_bien = ?"
                let params = [entity, paramRenoAnt, thisOrdenServicio, bien];
                let resultSet = query.runSuiteQL({ query: sql, params: params });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    let familiaArtOS = _controller.getParameter(results[0].item, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);
                    if (familia == familiaArtOS) {

                    }
                }
            } catch (error) {

            }

        }

        const setUserAssetCommand = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                scriptId: 'customscript_ns_rs_new_user_asset_commad',
                deploymentId: 'customdeploy_ns_rs_new_user_asset_commad',
                headers: myRestletHeaders,
            });
            log.debug('Return-setUserAssetCommand', myRestletResponse);
            return myRestletResponse.body;
        }

        const setAssetCommand = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                scriptId: 'customscript_ns_rs_new_asset_command',
                deploymentId: 'customdeploy_ns_rs_new_asset_command',
                headers: myRestletHeaders,
            });
            return myRestletResponse.body;
        }

        const crearRegistroImpulsoPlataforma = (ordenTrabajoId, estado, plataforma) => {
            let registroImpulsoPlataforma = record.create({ type: "customrecord_ts_regis_impulso_plataforma" });
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_ordentrabajo', ordenTrabajoId);
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_estado', estado);
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_plataforma', plataforma);
            return registroImpulsoPlataforma.save();
        }

        const convertFechaFinalToCobertura = (fechaPST) => {
            let fechaOriginal = new Date(fechaPST);
            let año = fechaOriginal.getFullYear();
            let mes = String(fechaOriginal.getMonth() + 1).padStart(2, '0'); // Obtiene el mes (0-11), así que se suma 1 y se formatea
            let dia = String(fechaOriginal.getDate()).padStart(2, '0'); // Obtiene el día
            let fechaFormateada = `${año}-${mes}-${dia}`;
            return fechaFormateada;
        }

        const getFechaChequeo = () => {
            let fechaOriginal = new Date();
            let año = fechaOriginal.getFullYear();
            let mes = String(fechaOriginal.getMonth() + 1).padStart(2, '0'); // Obtiene el mes (0-11), así que se suma 1 y se formatea
            let dia = String(fechaOriginal.getDate()).padStart(2, '0'); // Obtiene el día
            let fechaFormateada = `${año}-${mes}-${dia}`;
            fechaFormateada = new Date(fechaFormateada);
            let horaChequeo = getHoraChequeo()
            fechaFormateada.setHours(fechaFormateada.getHours() + Number(horaChequeo.split(":")[0]));
            let fechaAjustada = fechaFormateada.toISOString();
            return fechaAjustada;
        }

        const getHoraChequeo = () => {
            let fechaActual = new Date();
            let horas = String(fechaActual.getHours()).padStart(2, '0'); // Obtiene la hora y asegura que tenga dos dígitos
            let minutos = String(fechaActual.getMinutes()).padStart(2, '0'); // Obtiene los minutos y asegura que tenga dos dígitos
            let horaFormateada = `${3 + Number(horas)}:${minutos}`;
            return horaFormateada;
        }

        const getHoraChequeoAMPM = () => {
            let fechaActual = new Date();
            // Extraer la hora y los minutos
            let horas = fechaActual.getHours(); // Obtiene la hora en formato 24 horas
            let minutos = fechaActual.getMinutes(); // Obtiene los minutos
            // Determinar AM o PM
            let ampm = horas >= 12 ? 'PM' : 'AM';
            // Convertir a formato de 12 horas
            horas = horas % 12; // Convierte la hora a formato 12 horas
            horas = horas ? horas : 12; // Si es 0, establece la hora a 12
            // Asegurarse de que los minutos tengan dos dígitos
            minutos = String(minutos).padStart(2, '0');
            // Formatear la hora en el formato h:mm a
            let horaFormateada = `${3 + horas}:${minutos} ${ampm}`;
            return horaFormateada;
        }

        const getCierre = (idOrdenServicio, idItem) => {
            var SearchObj = search.create({
                type: "customrecord_ht_record_ordentrabajo",
                filters:
                    [
                        ["custrecord_ht_ot_orden_servicio", "anyof", idOrdenServicio],
                        "AND",
                        ["custrecord_ht_ot_item", "anyof", idItem]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "ID interno" }),
                        search.createColumn({ name: "custrecord_ht_ot_estado", label: "HT OT Estado Orden de trabajo" })
                    ]
            });

            var savedsearch = SearchObj.run().getRange(0, 100);
            var cierre = true;
            var estado = '';
            if (savedsearch.length > 0) {
                SearchObj.run().each(function (result) {
                    estado = result.getText(SearchObj.columns[1]);
                    if (estado != 'C - CHEQUEADO') {
                        cierre = false;
                    }
                    return true;
                });
                return cierre;
            } else {
                return false;
            }
        }

        // cambio jmon 17/12/2025 - Consulta de instalaciones para upgrade desde OT
        const getInstalacionesforUpgrade = (paramCode, bien) => {
            log.debug('Track-getInstalacionesforUpgrade-OT', `${paramCode}, ${bien}`);
            try {
                let sql = `
                SELECT co.id as id FROM customrecord_ht_co_cobertura co
                INNER JOIN customrecord_ht_cr_pp_valores pa ON co.custrecord_ht_co_familia_prod = pa.id
                WHERE pa.custrecord_ht_pp_codigo = ? AND co.custrecord_ht_co_bien = ?
                `;
                let resultSet = query.runSuiteQL({ query: sql, params: [paramCode, bien] });
                let results = resultSet.asMappedResults();
                return results.length > 0 ? results : [];
            } catch (error) {
                log.error('Error-getInstalacionesforUpgrade-OT', error);
                return [];
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
