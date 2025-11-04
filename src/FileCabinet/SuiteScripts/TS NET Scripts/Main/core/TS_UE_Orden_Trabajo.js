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
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
],
    (transaction, config, log, search, record, serverWidget, https, error, format, email, runtime, message, query, file, _controller, _constant, _errorMessage) => {

        const beforeLoad = (context) => {
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
                    if (serieDispositivo.length > 0 || objRecord.getValue('custrecord_ht_ot_others_installs') == true || objRecord.getValue('custrecord_ht_ot_flu_acc')) {
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
                if (estado == _constant.Status.CHEQUEADO) {
                    //createCertificadoInstalacionButton(form, objRecord);
                    createCertificadoPropiedadButton(form, objRecord);
                }
                form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';

                // let taxNumber = search.lookupFields({
                //     type: 'customer',
                //     id: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                //     columns: ['vatregnumber', 'custentity_ts_ec_tipo_persona']
                // })
                showPlataformaErrors(form);
            } else if (type_event == context.UserEventType.EDIT) {
                createEnsambleAlquilerButton(form, objRecord);
                createEnsambleCustodiaButton(form, objRecord);
                createEnsambleGarantiaButton(form, objRecord);
                form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';
            }
        }

        //MLNY 07-2025
        const beforeSubmit = (context) => {
            try {

                let currentRecord = context.newRecord;
                let usuario = runtime.getCurrentUser();
                let estadoDispositivo = '';
                //log.debug('usuario.subsidiary  ', usuario ); 

                if (usuario.subsidiary == _constant.Constants.ECUADOR_SUBSIDIARY) {
                    let idEstadoOT = currentRecord.getValue('custrecord_ht_ot_estado');
                    try {
                        estadoDispositivo = currentRecord.getText({ fieldId: 'custrecord_ht_ot_estadochaser' });
                    } catch (error) { }


                    if (context.type == context.UserEventType.EDIT && idEstadoOT == _constant.Status.PROCESANDO && estadoDispositivo != '') {
                        // Obtener el estado del dispositivo  s
                        let idEstadoDispositivo = currentRecord.getValue({ fieldId: 'custrecord_ht_ot_estadochaser' });
                        let articulo = currentRecord.getValue({ fieldId: 'custrecord_ht_ot_itemrelacionado' });
                        let accion = _controller.getParameter(articulo, _constant.Parameter.ADP_ACCION_DEL_PRODUCTO);
                        let valorEdc = _controller.getParameter(articulo, _constant.Parameter.EDC_ENTREGA_DIRECTA_A_CLIENTE);
                        let entregaDirecta = _controller.getValorParameter(articulo, _constant.Parameter.EDC_ENTREGA_DIRECTA_A_CLIENTE, valorEdc);


                        //Evalúa estado de dispositivo por acción de producto
                        let estadoValido = _controller.evaluaAccionEstado(accion, idEstadoDispositivo, entregaDirecta)
                        //log.debug('estadoValido ', estadoValido);
                        if (estadoValido == 0) {
                            throw ('Estado  [' + estadoDispositivo + '], no aplica para acción de producto del trabajo a procesar.');
                        }
                    }
                }

            } catch (e) {
                // Loguea el error en el registro de scripts (no visible al usuario final)
                log.error('Error de validación en beforeSubmit', e.message);
                // Relanza el error para que NetSuite bloquee el guardado
                throw e;
            }
        }

        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.EDIT) {
                let senderId = runtime.getCurrentUser();
                senderId = senderId.id;
                let timeFormat = runtime.getCurrentUser().getPreference({ name: 'timeformat' });
                //log.debug('Formato de Hora', timeFormat);
                let objRecord = context.newRecord;
                let accionEstadoOT = 'Sin estado';
                let id = context.newRecord.id;
                let impulsaPX = 1;
                let impulsaTelematics = 1;
                let adpServicio = 0;
                let estaChequeada = objRecord.getValue('custrecord_ht_ot_estado');
                let fechaChequeo = objRecord.getValue('custrecord_ht_ot_fechatrabajoasignacion');
                //log.debug('fechaChequeo.length', fechaChequeo);
                let valoresPermitidos = ["317", "319", "320"];
                let AccionAdp = ["5199", "382"]

                if (!fechaChequeo) {
                    //log.debug('Campo Fecha', 'Vacío')
                    fechaChequeo = getFechaChequeo();
                    //log.debug('dateChequeo', fechaChequeo);
                }
                let ingresaFlujoAlquiler;
                let statusOri = estaChequeada;
                let estadoInts, noChequeado = 0;
                let ingresaFlujoConvenio;
                let ingresaFlujoGarantiaReinstalación;
                let ejecutarFulFillment = 1;
                let esCambioSimCard = false;
                let esItemRepuesto = false;
                let entregaCustodia = 0;
                //Cambio JCEC 20/08/2024
                let flujoAccesorio = objRecord.getValue('custrecord_ht_ot_flu_acc');
                if (estaChequeada > 0) {
                    accionEstadoOT = estaChequeada;//TODO: Revisar esta sección porque puede impactar la instalación sin activicación de servicio.
                    //accionEstadoOT = _constant.Status.CHEQUEADO
                }
                log.debug('accionEstadoOT', accionEstadoOT);
                //log.debug('_constant.Status.CHEQUEADO', _constant.Status.CHEQUEADO);
                switch (parseInt(accionEstadoOT)) {
                    case _constant.Status.CHEQUEADO:
                        let idSalesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                        let valueSalesorder = objRecord.getText('custrecord_ht_ot_orden_servicio');
                        let bien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                        log.debug('busqueda_cobertura...............bien................', bien);
                        let valuebien = objRecord.getText('custrecord_ht_ot_vehiculo');
                        let subsidiaria = objRecord.getValue('custrecord_ht_ot_subsidiary');
                        // let coberturas = _controller.getCobertura(bien,subsidiaria);
                        let coberturas = _controller.getCoberturaSubsidiaria(bien);
                        ingresaFlujoGarantiaReinstalación = objRecord.getValue('custrecord_flujo_de_garantia');
                        ingresaFlujoConvenio = objRecord.getValue('custrecord_flujo_de_convenio');
                        let busqueda_salesorder = ingresaFlujoConvenio ? getSalesOrderItem(idSalesorder, ingresaFlujoConvenio) : getSalesOrderItem(bien, ingresaFlujoConvenio);
                        log.debug('busqueda_salesorder', busqueda_salesorder);
                        let busqueda_cobertura = getCoberturaItem(bien, subsidiaria);
                        log.debug('busqueda_cobertura..............................', busqueda_cobertura);
                        let salesorder = record.load({ type: 'salesorder', id: idSalesorder });
                        log.debug('busqueda_cobertura.............idSalesorder.................', idSalesorder);
                        let convenio = salesorder.getValue('custbody_ht_os_convenio');
                        let subsidiary = salesorder.getValue('subsidiary');
                        var numLines = salesorder.getLineCount({ sublistId: 'item' });
                        let ejecutivaGestion = salesorder.getValue('custbody_ht_os_ejecutiva_backoffice');
                        let total = salesorder.getValue('total');//Add JChaveza
                        let chaser = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                        let idItemRelacionadoOT = objRecord.getValue('custrecord_ht_ot_itemrelacionado');
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

                        let cantidad = 0, parametro_salesorder = 0, tag = 0, idOS = 0, envioPX = 0, envioTele = 0, idItem = 0, monitoreo = 0, precio = 0, esAlquiler = 0, entregaCliente = 0,
                            entradaCustodia = 0, adpDesinstalacion = 0, esGarantia = 0, plataformasPX = 0, plataformasTele = 0, adp, device, parametrosRespo = 0, ttrid = 0,
                            TTR_name = '', familia = "", idCoberturaItem = 0, returEjerepo = true, arrayItemOT = new Array(), arrayID = new Array(), arrayTA = new Array(), objParams = new Array(),
                            esConvenio = 0, responsepx, responsetm, undTiempo = '', esItemProduccion = false, objUserAssetCommand = new Object(), objAssetCommand = new Object(),
                            arrayCommands = new Array(), arrayCommand = new Array(), uniqueCommands = new Array(), saveRecord = false;

                        log.debug('othersIntalls....................', othersIntalls);
                        if (othersIntalls == true) {
                            //Edwin agrego  FULFILLMENT
                            try {
                                let servicios = objRecord.getText('custrecord_ht_ot_servicios_commands')
                                log.debug("customrecord_ht_nc_servicios_instalados....", {
                                    "bien": bien,
                                    "custrecord_ns_orden_servicio_si": idSalesorder,
                                    "custrecord_ns_orden_trabajo": id,
                                    "servicios": servicios
                                });
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
                                    //log.debug('uniqueCommands.length', uniqueCommands.length);
                                    if (uniqueCommands.length) {
                                        let responseCommandWS = '';
                                        let gpg = _controller.getParameter(idItemRelacionadoOT, _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS);
                                        let gpt = _controller.getParameter(idItemRelacionadoOT, _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS);
                                        log.debug('gpg.......................', gpg);
                                        log.debug('gpt.......................', gpt);
                                        //galvar
                                        let cpt = _controller.getParameter(idItemRelacionadoOT, _constant.Parameter.CPT_CONFIGURA_PLATAFORMA_TELEMATIC);
                                        let igs = _controller.getParameter(idItemRelacionadoOT, _constant.Parameter.IGS_PRODUCTO_MONITOREADO_POR_GEOSYS);
                                        log.debug('igs.......................', igs);
                                        log.debug('cpt.......................', cpt);
                                        //
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
                                    let devoInstallmentAS = setServices(bien, idSalesorder, id, objRecord, subsidiary)
                                    log.debug("devoInstallmentAS", devoInstallmentAS);
                                }
                                //!FULFILLMENT ======================================================================================================================================================
                                log.debug("ejecutarFulFillment", ejecutarFulFillment);
                                if (ejecutarFulFillment == 1) {
                                    /*
                                      try {
                                          //log.debug('fulfillment', 'Nueva lógica Fulfillment');
                                          let ubicacion = objRecord.getValue('custrecord_ht_ot_ordenfabricacion') ? _controller.getLocationToAssembly(objRecord.getValue('custrecord_ht_ot_ordenfabricacion')) : 0;
                                         // log.debug('ubicacion ', ubicacion);
                                          //log.audit("ubicación 1", ubicacion);
                                          if (ubicacion == 0) {
                                              let buscarLocacion = search.lookupFields({ type: 'salesorder', id: idSalesorder, columns: ['location'] });
                                              ubicacion = buscarLocacion.location[0].value;
                                          }
                                          //log.audit("ubicación 1", ubicacion);
                                          let newFulfill = record.transform({ fromType: record.Type.SALES_ORDER, fromId: idSalesorder, toType: record.Type.ITEM_FULFILLMENT, isDynamic: true });
                                          log.audit('newFulfill', newFulfill);
                                          newFulfill.setValue({ fieldId: 'trandate', value: fechaChequeo });
                                          let numLines = newFulfill.getLineCount({ sublistId: 'item' });
                                          //log.debug('numLines', numLines);
                                          log.audit('numLines', numLines);
                                          // idItemOT id item
                                          for (let i = 0; i < Number(numLines); i++) {
                                              newFulfill.selectLine({ sublistId: 'item', line: i })
                                              let idArticulo = newFulfill.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' })
  
                                              log.debug('--idArticulo--', idArticulo);
                                              log.debug('--idItemOT--', idItemOT);
  
                                              log.audit("idArticulo == idItemOT",`${idArticulo} - ${idItemOT} ${idArticulo == idItemOT}`);
                                              
                                              if (idArticulo == idItemOT) {
                                                  //galvar
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'subsidiary', value: subsidiary });
                                                  //
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: ubicacion });
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: idItemOT });
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                                              }
  
                                              let objSubRecord = newFulfill.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                              let binNumber = "";
                                              let lineCountInventoryassignment = objSubRecord.getLineCount({ sublistId: 'inventoryassignment' });
                                              log.audit("Detalle de inventario - inicial SCRIPT", objSubRecord );
                                              if( objSubRecord && lineCountInventoryassignment> 0 ){
                                                binNumber = objSubRecord.getSublistValue({
                                                  sublistId: 'inventoryassignment',
                                                  fieldId: 'binnumber',
                                                  line: 0
                                                });
                                              }
                                              log.audit("binNumber", binNumber);
                                              log.audit("binNumber", binNumber.length);
                                              if ( binNumber.length == 0){
                                                  log.audit(`Bin ${binNumber} Detalle de inventario - SelectLine SCRIPT`, objSubRecord);
                                                  objSubRecord.selectLine({ sublistId: 'inventoryassignment', line: 0 })
                                                  //objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: idDispositivo });
                                                  try {
                                                      objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                                                  } catch (error) {
                                                      log.audit("ERROR inventorystatus SCRIPT", error)
                                                  }
                                                  objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
      
                                                  log.audit("Detalle de inventario - Antes del commitLine SCRIPT", objSubRecord);
                                                  objSubRecord.commitLine({ sublistId: 'inventoryassignment' });
                                               }
                                              newFulfill.commitLine({ sublistId: 'item' });
                                          }
                                          let fulfillment = newFulfill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                          log.debug('fulfillment', fulfillment);
                                      } catch (error) {
                                          log.error("Error-Fulfill..........0..............", error.stack);
                                          log.error('Error-Fulfill', error);
                                        log.audit("ERROR 1 ", error)
                                      }
                                    */
                                }
                            } catch (error) {
                                log.error('Error-Process-Accesory', error);
                            }
                        } else {
                            let parametrosRespo_2 = _controller.parametrizacion(idItemOT);
                            let parametrizacionProducto = _controller.parametrizacionJson(idItemOT);

                            log.debug("parametrosRespo_2", parametrosRespo_2)
                            log.debug("parametrizacionProducto", parametrizacionProducto)

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
                                        adpDesinstalacion = adpServicio
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
                                            //log.debug('numLinesX', numLines);
                                            for (var x = 0; x < numLines; x++) {
                                                let idArticulox = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: x });
                                                //log.debug('idArticulox - linea ' + x, idArticulox);
                                                //log.debug('idItemOT', idItemOT);
                                                if (total == 0 && idArticulox == idItemOT) {
                                                    //log.debug('ENTRO', 'OK!');
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
                                        tag = parametrosRespo_2[j][1];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER)
                                        esAlquiler = _constant.Valor.SI;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.EDC_ENTREGA_DIRECTA_A_CLIENTE)
                                        entregaCliente = parametrosRespo_2[j][1];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esGarantia = parametrosRespo_2[j][1];
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS && parametrosRespo_2[j][1] == _constant.Valor.VALOR_001_GENERA_CUSTODIAS)
                                        entradaCustodia = _constant.Valor.SI;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS && parametrosRespo_2[j][1] == _constant.Valor.VALOR_002_ENTREGA_CUSTODIAS)
                                        entregaCustodia = _constant.Valor.SI;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.IRP_ITEM_DE_REPUESTO && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esItemRepuesto = true;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esItemProduccion = true;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.PMS_PERMITE_MODIFICAR_SIM_CARD && parametrosRespo_2[j][1] == _constant.Valor.SI)
                                        esCambioSimCard = true;
                                    if (parametrosRespo_2[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                        familia = parametrosRespo_2[j][1];
                                        ttrid = familia
                                    }

                                    //log.debug('esAlquiler.....', esAlquiler);
                                    //log.debug('entregaCliente.....', entregaCliente);
                                    //log.debug('esGarantia.....', esGarantia);
                                    //log.debug('entradaCustodia.....', entradaCustodia);
                                    //log.debug('esItemRepuesto.....', esItemRepuesto);
                                    //log.debug('esCambioSimCard.....', esCambioSimCard);
                                    //log.debug('esItemProduccion.....', esItemProduccion);
                                    // if (parametrosRespo_2[j][0] == _constant.Parameter.PHV_PRODUCTO_HABILITADO_PARA_LA_VENTA && parametrosRespo_2[j][1] == _constant.Valor.VALOR_X_USO_CONVENIOS)
                                    //     esConvenio == 2
                                }
                                log.debug('Data_parametrosRespo_2', {
                                    adp: adp,
                                    adpServicio: adpServicio,
                                    adpDesinstalacion: adpDesinstalacion,
                                    ttrid: ttrid,
                                    TTR_name: TTR_name,
                                    envioPX: envioPX,
                                    envioTele: envioTele,
                                    tag: tag,
                                    esAlquiler: esAlquiler,
                                    entregaCliente: entregaCliente,
                                    esGarantia: esGarantia,
                                    entradaCustodia: entradaCustodia,
                                    esItemRepuesto: esItemRepuesto,
                                    esItemProduccion: esItemProduccion,
                                    esCambioSimCard: esCambioSimCard,
                                    familia: familia
                                });
                            }
                            var activador = false;
                            if (busqueda_salesorder.length != 0) {
                                let terminar = 0;
                                for (let i = 0; i < busqueda_salesorder.length; i++) {
                                    if (terminar == 1) {
                                        break;
                                    }
                                    let parametrosRespo = _controller.parametrizacion(busqueda_salesorder[i][0]);
                                    log.debug('parametrosRespoTrack1.........parametrosRespo..', parametrosRespo)
                                    if (parametrosRespo.length != 0) {
                                        var accion_producto = 0;
                                        var valor_tipo_agrupacion = 0;
                                        for (let j = 0; j < parametrosRespo.length; j++) {
                                            if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                                                accion_producto = parametrosRespo[j][1];
                                            if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS)
                                                valor_tipo_agrupacion = parametrosRespo[j][1];
                                            //log.debug("Comparación-Familia-OS-Track1: " + i + ' - ' + j, `${accion_producto} == ${_constant.Valor.VALOR_015_VENTA_SERVICIOS}-${valor_tipo_agrupacion}-${familia}`);
                                            if (accion_producto == _constant.Valor.VALOR_015_VENTA_SERVICIOS && valor_tipo_agrupacion == familia) {
                                                //log.debug("Comparación-Familia-OS-Entra-Transmisión: " + i + ' - ' + j, `${valor_tipo_agrupacion}-${familia}-${busqueda_salesorder[i][0]}-${busqueda_salesorder[i][1]}`);
                                                adpServicio = accion_producto;
                                                idOS = busqueda_salesorder[i][1];
                                                plataformasPX = envioPX;
                                                plataformasTele = envioTele;
                                                idItem = busqueda_salesorder[i][0];
                                                terminar = 1;
                                                break;
                                            }
                                            if (accion_producto == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                                idOS = busqueda_salesorder[i][1];
                                                terminar = 1;
                                                break;
                                            }
                                            if (accion_producto == _constant.Valor.VALOR_ADP_ACTIVADOR) {
                                                idOS = busqueda_salesorder[i][1];
                                                terminar = 1;
                                                activador = true;
                                                break;

                                            }
                                        }
                                    }
                                    log.debug('DataparametrosRespoTrack1l', {
                                        accion_producto: accion_producto,
                                        valor_tipo_agrupacion: valor_tipo_agrupacion,
                                        idOS: idOS,
                                        plataformasPX: plataformasPX,
                                        plataformasTele: plataformasTele,
                                        idItem: idItem,
                                        activar: activador,
                                        familia: familia,
                                        terminar: terminar
                                    });
                                }
                            }

                            if (busqueda_cobertura.length != 0) {
                                log.debug('busqueda_cobertura', busqueda_cobertura)
                                for (let i = 0; i < busqueda_cobertura.length; i++) {
                                    //galvar 31/08/25
                                    if (busqueda_cobertura[i][0].length != 0) {
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
                                                    estadoInts = _constant.Status.INSTALADO
                                                }
                                            }
                                        }
                                    }
                                }
                                log.debug('inf busqueda_cobertura', {
                                    idCoberturaItem: idCoberturaItem,
                                    estadoInts: estadoInts,
                                    accion_producto: accion_producto,
                                    valor_tipo_agrupacion: valor_tipo_agrupacion
                                })
                            }
                            //Validar Parametro PPS
                            log.debug('idCoberturaItem', idCoberturaItem)
                            let T_PPS = false;
                            log.debug('idOS', idOS);
                            // lógica para actualizar la cobertura en plataformas
                            if (idOS && ingresaFlujoGarantiaReinstalación == false && esItemRepuesto == false && esCambioSimCard == false) {
                                if (adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP)
                                    idOS = idSalesorder
                                //log.debug('idOSIntroImpulsoPlataformas', idOS);
                                let serviceOS = record.load({ type: 'salesorder', id: idOS });
                                let numLines_2 = serviceOS.getLineCount({ sublistId: 'item' });
                                for (let k = 0; k < numLines_2; k++) { // para primero validar parametrizacion de todos los Items
                                    let items = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'item', line: k });
                                    let paramRespo = _controller.parametrizacion(items);
                                    //log.debug('paramRespo', paramRespo)
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
                                    //log.debug("items..................", items) 
                                    let itemtype = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                                    let familiaArtOS = _controller.getParameter(items, _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS);
                                    log.debug("Items-Comparación-Familia-OS", `${items}-${familiaArtOS}-${familia}`);
                                    if (familia == familiaArtOS && itemtype == 'Service') {
                                        monitoreo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                                        let quantity = parseInt(serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: j }));
                                        let unidadTiempo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: j });
                                        var itemMeses = idItemType(items);
                                        //log.debug("itemMeses", itemMeses);
                                        //log.debug("unidadTiempo", unidadTiempo);
                                        //log.debug('TIMES====', itemMeses + ' == ' + 1 + ' && ' + quantity + ' != ' + 0 + ' && ' + unidadTiempo.length + ' > ' + 0)
                                        if (itemMeses == 1 && quantity != 0 && unidadTiempo.length > 0) {
                                            // let quantity = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: j }); //!Cambio quantity por tiempo
                                            // cantidad = cantidad + quantity;
                                            if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                                quantity = parseInt(quantity) * 12
                                                unidadTiempo = _constant.Constants.UNIDAD_TIEMPO.MESES
                                            }
                                            undTiempo = unidadTiempo;
                                            let tiempo = quantity
                                            cantidad = cantidad + tiempo;
                                        }

                                        if (plataformasPX == _constant.Valor.SI && impulsarUnaVezPX) {
                                            log.debug('id', id);
                                            log.debug('adp', adp);
                                            returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                            log.debug('...returEjerepo...', returEjerepo);
                                            responsepx = returEjerepo;
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
                                        if (activador) {
                                            monitoreo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                                            let quantity = parseInt(serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: j }));
                                            let unidadTiempo = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: j });

                                            if (quantity != 0 && unidadTiempo.length > 0) {
                                                // let quantity = serviceOS.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: j }); //!Cambio quantity por tiempo
                                                // cantidad = cantidad + quantity;
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
                                log.debug('results.params..........results......', results)
                                if (results.length > 0) {
                                    //log.debug('results.asMappedResults......results...', results)
                                    for (let i = 0; i < results.length; i++) {
                                        let quantity = Number(results[i].tiempo);
                                        let unidadTiempo = results[i].unidad;
                                        //log.debug("Comparación-Familia-OS-9", `${unidadTiempo}`);
                                        if (unidadTiempo != null) {
                                            let familiaArtOS = _controller.getParameter(results[i].item, _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS);
                                            log.debug("Comparación-Familia-OS-2", `${familiaArtOS}-${familia}-${unidadTiempo}`);
                                            if (familia == familiaArtOS) {
                                                //log.debug("Comparación-Familia-OS-8", `${quantity}-${unidadTiempo.toString().length}`);
                                                if (quantity != 0 && unidadTiempo.toString().length > 0) {
                                                    //log.debug("Comparación-Familia-OS-3", `${familiaArtOS}-${familia}`);
                                                    if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                                        quantity = parseInt(quantity) * 12
                                                        unidadTiempo = _constant.Constants.UNIDAD_TIEMPO.MESES
                                                    }
                                                    undTiempo = unidadTiempo;
                                                    let tiempo = quantity
                                                    cantidad = cantidad + tiempo;
                                                    //log.debug("Comparación-Familia-OS-4", `${undTiempo}-${unidadTiempo}`);
                                                    //log.debug("Comparación-Familia-OS-5", `${tiempo}-${quantity}`);
                                                    //log.debug("Comparación-Familia-OS-6", `${cantidad}-${cantidad} + ${tiempo}`);
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            log.debug('T_PPS', T_PPS);
                            for (let i = 0; i < numLines; i++) {
                                Origen = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen', line: i }).length > 0 ? salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen', line: i }) : salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcoll_ns_codigo_origen_sys', line: i });
                            }

                            let cobertura = getCobertura(cantidad, undTiempo, fechaChequeo);//*GENERAR COBERTURA PARA EL REGISTRO DE COBERTURA ========================
                            log.debug('COBERTURA ========================', cobertura)

                            let idItemCobertura = objRecord.getValue('custrecord_ht_ot_item');
                            let idVentAlq = objRecord.getValue('custrecord_ht_ot_item_vent_alq');
                            if (idVentAlq != '') {
                                idItemCobertura = idVentAlq;
                            }
                            let activacion = 16;
                            let instalacion_activacion = 17;
                            let instalacion = 15;

                            if (adpDesinstalacion != _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP &&
                                adpDesinstalacion != _constant.Valor.VALOR_007_CHEQUEO_DE_COMPONENTES &&
                                adpDesinstalacion != _constant.Valor.VALOR_013_CHEQUEO_OTROS_PRODUCTOS &&
                                adpDesinstalacion != _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                estadoInts = 1 //Instalado
                                //log.debug('returEjerepo', returEjerepo);
                                log.debug('idSalesorder', idSalesorder);
                                //log.debug('adpServicio.....', adpServicio);
                                log.debug('idOS.....', idOS);
                                if (returEjerepo && adpServicio != 0 && ingresaFlujoGarantiaReinstalación == false) {
                                    if (idOS == idSalesorder) {
                                        //log.debug('COBERTURA.........', 'Cobertura1');
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

                                        if (ingresaFlujoConvenio == true) {
                                            json.estadoCobertura = _constant.Status.PENDIENTE_DE_ACTIVACION
                                            //noChequeado = 1
                                        }

                                        log.debug('*adp1*..........................', { adp, json });

                                        try {
                                            if (valoresPermitidos.includes(adp) && json && json?.subsidiary == "2") {
                                                log.debug("evento", json);
                                                createCoberturaWS(json);
                                            } else if (json?.subsidiary != "2") {
                                                createCoberturaWS(json);
                                            }
                                        } catch (error) {
                                            log.debug("evento", "Error Seguimiento adp1")
                                            createCoberturaWS(json);
                                        }

                                        if (chaser.length > 0) {
                                            let updateTelematic = record.load({ type: _constant.customRecord.DATOS_TECNICOS, id: chaser });
                                            updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estado', value: _constant.Status.INSTALADO })
                                            updateTelematic.save();
                                        }
                                    } else {
                                        //log.debug('COBERTURA.............', 'Cobertura2');
                                        //log.debug('comercial................', comercial);
                                        let ObtenerCobertura = 0
                                        let objSearchCobertura = search.create({
                                            type: _constant.customRecord.CUSTODIA,
                                            filters: [["name", "haskeywords", comercial]],
                                            columns: [search.createColumn({ name: "custrecord_ht_ct_cobertura", label: "HT CT Cobertura" })]
                                        });
                                        //log.debug('objSearchCobertura...............', objSearchCobertura);
                                        let searchResultCountCobertura = objSearchCobertura.runPaged().count;
                                        if (searchResultCountCobertura > 0) {
                                            objSearchCobertura.run().each(result => {
                                                ObtenerCobertura = result.getValue(objSearchCobertura.columns[0]);
                                                // log.debug('--ObtenerCobertura1--', ObtenerCobertura); // DOAS - 30/09/2021
                                                return true;
                                            })
                                            //log.debug('objSearchCobertura........2.......', objSearchCobertura.columns[0]);
                                            //log.debug('objSearchCobertura........3.......', ObtenerCobertura);
                                        } else {
                                            ObtenerCobertura = 0;
                                            log.debug('ObtenerCobertura2', 'No tiene Cobertura');
                                        };
                                        log.debug('ObtenerCobertura-------------', ObtenerCobertura);
                                        //cobertura incorrecta 317800 GALVAR
                                        if (ObtenerCobertura = 317800) {
                                            log.debug('ObtenerCobertura REPETIDA..............', ObtenerCobertura);
                                            ObtenerCobertura = 0;
                                        }
                                        //Obtener el antiguo Bien
                                        let ObtenerBien = 0;
                                        if (!ObtenerCobertura) {
                                            ObtenerCobertura = 0;
                                            //log.debug('ObtenerCobertura JCEC', 'No tiene Cobertura');
                                        }
                                        let CoberturaBien = search.create({
                                            type: "customrecord_ht_co_cobertura",
                                            filters:
                                                [
                                                    ["internalid", "anyof", ObtenerCobertura],
                                                    "AND",
                                                    ["custrecord_ht_co_subsidiaria", "anyof", subsidiaria]
                                                ],
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
                                        //log.debug('ObtenerBien', ObtenerBien);
                                        let NuevoBien = objRecord.getValue('custrecord_ht_ot_vehiculo');
                                        log.debug('NuevoBien', NuevoBien);
                                        if (ObtenerBien !== NuevoBien && searchResultCountObtenerBien > 0 && searchResultCountCobertura > 0) {
                                            let UpdateCobertura = record.load({ type: 'customrecord_ht_co_cobertura', id: ObtenerCobertura, isDynamic: true });
                                            UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_bien', value: NuevoBien });
                                            UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: _constant.Status.ACTIVO });
                                            UpdateCobertura.setValue({ fieldId: 'custrecord_ht_co_estado', value: _constant.Status.INSTALADO });
                                            let UpdateCober = UpdateCobertura.save();
                                            log.debug("Data Update", {
                                                "customrecord_ht_co_cobertura": ObtenerCobertura,
                                                "custrecord_ht_co_bien": NuevoBien,
                                                "custrecord_ht_co_estado_cobertura": _constant.Status.ACTIVO,
                                                "custrecord_ht_co_estado": _constant.Status.INSTALADO
                                            })
                                            //log.debug('UpdateCober---------', UpdateCober);
                                        } else {
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
                                                monitoreo: monitoreo == 0 ? objRecord.getValue('custrecord_ht_ot_cliente_id') : monitoreo,
                                                cobertura: idCoberturaItem,
                                                ttr: ttrid,
                                                estadoCobertura: estadoInts,
                                                t_PPS: esItemRepuesto == true ? false : esCambioSimCard == true ? false : T_PPS,
                                                modeloDispositivo: modeloDisp,
                                                unidadDispositivo: unid,
                                                vidDispositivo: vid,
                                                esItemRepuesto: esItemRepuesto,
                                                esCambioSimCard: esCambioSimCard,
                                                //galvar 26-02-2025
                                                subsidiary: objRecord.getValue('custrecord_ht_ot_subsidiary')
                                            }
                                            //log.debug('json', json)
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

                                            // DOAS 24-07-2025  // !AQUI
                                            if (json?.esItemRepuesto == true) {
                                                try {

                                                    log.debug("esItemRepuestoIRP", json?.esItemRepuesto);

                                                    let itemIRP = objRecord.getValue('custrecord_ht_ot_item');
                                                    let bienIRP = objRecord.getValue('custrecord_ht_ot_vehiculo');

                                                    log.debug("itemIRP", itemIRP);
                                                    log.debug("bienIRP", bienIRP);

                                                    let textFamiliaIRP = obtenerParametrizacionItem(itemIRP, ["FAM"]);
                                                    if (!textFamiliaIRP?.[0]?.Valor) {
                                                        throw new Error("No se encontró la familia del item IRP o el valor es nulo/indefinido.");
                                                    }

                                                    let familiaIDIRP = consultaFamiliaNetsuite(textFamiliaIRP[0].Valor);
                                                    if (!familiaIDIRP?.id) {
                                                        throw new Error("No se encontró la familia en Netsuite o el ID es nulo/indefinido.");
                                                    }

                                                    let coberturaInfoIRP = consultaCobertura(bienIRP, familiaIDIRP.id);
                                                    if (!coberturaInfoIRP?.coberturafinal) {
                                                        throw new Error("No se encontró información de cobertura o la fecha de cobertura final es nula/indefinida.");
                                                    }

                                                    let coberturaVigente = evaluarFechaCobertura(coberturaInfoIRP.coberturafinal);

                                                    if (coberturaVigente == 3) {
                                                        throw new Error("La cobertura no se puede evaluar.");
                                                    }

                                                    json.estadoCobertura = coberturaVigente ? _constant.Status.ACTIVO : _constant.Status.SUSPENDIDO;

                                                } catch (error) {
                                                    log.debug("Error Contorlado..", {
                                                        mensaje: error.message,
                                                        stack: error.stack
                                                    });
                                                }
                                            }

                                            log.debug('adp2*..........................', { adp, json });
                                            // createCoberturaWS(json);
                                            try {
                                                if (valoresPermitidos.includes(adp) && json && json?.subsidiary == "2") {
                                                    log.debug("evento.........", json);
                                                    createCoberturaWS(json);
                                                } else if (json?.subsidiary != "2") {
                                                    createCoberturaWS(json);
                                                }
                                            } catch (error) {
                                                log.debug("evento", "error Seguimiento adp2")
                                                createCoberturaWS(json);
                                            }

                                            //Doas 03/06/2025  // Relay - Home - Chequeo 
                                            if (AccionAdp.includes(adp) && json && json?.subsidiary == "2") {
                                                log.debug("Validacion Relay - Home - Chequeo ", ejecutarFulFillment);
                                                ejecutarFulFillment = 1;
                                                noChequeado = 0;
                                            } else if (json?.subsidiary != "2") {
                                                log.debug("evento", ejecutarFulFillment);
                                            }

                                            //galvar 26-03-2025
                                            //--ejecutarFulFillment=0;

                                        }
                                        if (chaser.length > 0) {
                                            let updateTelematic = record.load({ type: _constant.customRecord.DATOS_TECNICOS, id: chaser });
                                            updateTelematic.setValue({ fieldId: 'custrecord_ht_mc_estadolodispositivo', value: _constant.Status.INSTALADO })
                                            updateTelematic.save();

                                        }

                                        log.debug('ejecutarFulFillment.........1.....................', ejecutarFulFillment);
                                    }
                                }
                            }
                            log.debug('statusOri..............................', statusOri);
                            log.debug('ingresaFlujoConvenio..............................', ingresaFlujoConvenio);
                            if (statusOri == _constant.Status.CHEQUEADO && ingresaFlujoConvenio == true) {
                                //*FLUJO DE CONVENIO INACTIVO, funcionaba con flujo autómatico hasta el chequeo
                                // log.debug('Convenio', 'Es convenio');
                                // objParams.item = idItemOT
                                // objParams.boleano = true;
                                // let ajusteInvSalida = _controller.createInventoryAdjustmentSalida(objParams);
                                // let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, ajusteInvSalida, 1);
                                // log.debug('AjusteInventarioPorConvenio', ajusteInv);
                            }
                            log.debug('adp..............................', adp);
                            log.debug("envioPX-----", envioPX ? envioPX : "ND");
                            log.debug("responsepx-----", responsepx ? responsepx : "ND");

                            if (adp == _constant.Valor.VALOR_001_INST_DISPOSITIVO || adp == _constant.Valor.VALOR_003_REINSTALACION_DE_DISP) {
                                //log.debug('TRACKING1', 'Track1');
                                log.debug('envioPX', envioPX);
                                log.debug('responsepx', responsepx);
                                if (envioPX == _constant.Valor.SI) {
                                    if (responsepx == false) return false
                                }
                                //log.debug('TRACKING2', 'Track2');
                                log.debug('envioTele', envioTele);
                                if (envioTele == _constant.Valor.SI) {
                                    if (responsetm == false) return false;
                                }
                                //log.debug('TRACKING3', 'Track3');

                                let estado = objRecord.getValue('custrecord_ht_ot_estado');
                                let idSalesOrder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
                                let dispositivo = objRecord.getValue('custrecord_ht_ot_dispositivo');
                                let boxserie = objRecord.getValue('custrecord_ht_ot_boxserie');
                                //&& Lógica para candado de alquiler =========================================================================================================
                                // if (ingresaFlujoAlquiler && esItemProduccion == true) {
                                //     let sererieItemProduccionAlquiler = getSerieItemProduccionAlquiler(chaser)
                                //     log.debug('sererieItemProduccionAlquiler', sererieItemProduccionAlquiler);
                                //     dispositivo = sererieItemProduccionAlquiler;
                                //     boxserie = sererieItemProduccionAlquiler;
                                // }
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
                                log.debug('idDispositivo ', idDispositivo);

                                if (estado == _constant.Status.CHEQUEADO && (estadoSalesOrder == 'pendingFulfillment' || estadoSalesOrder == 'partiallyFulfilled' || estadoSalesOrder == 'pendingBillingPartFulfilled') && idDispositivo) {
                                    let serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                    let ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                                    //log.debug('ubicacion ', ubicacion);

                                    if (serieProducto.length > 0) {
                                        if (boxserieLojack) {
                                            //LOJACK
                                            //log.debug('TAG', 'LOJACK: ' + tag);
                                            record.submitFields({ type: _constant.customRecord.CHASER, id: serieProducto, values: { 'custrecord_ht_mc_estadolojack': estadoChaser }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                            let dispositivo = search.lookupFields({ type: _constant.customRecord.CHASER, id: serieProducto, columns: ['custrecord_ht_mc_seriedispositivolojack'] });
                                            let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaslojack', id: dispositivoid, values: { 'custrecord_ht_cl_estado': estadoChaser }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        } else {
                                            //CHASER
                                            //log.debug('TAG', 'CHASER: ' + tag)
                                            log.debug('TAG', 'estadoChaser: ' + estadoChaser)
                                            record.submitFields({ type: _constant.customRecord.CHASER, id: serieProducto, values: { 'custrecord_ht_mc_ubicacion': ubicacion, 'custrecord_ht_mc_estadolodispositivo': estadoChaser }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                            let dispositivo = search.lookupFields({ type: _constant.customRecord.CHASER, id: serieProducto, columns: ['custrecord_ht_mc_seriedispositivo'] });
                                            let dispositivoid = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaserdisp', id: dispositivoid, values: { 'custrecord_ht_dd_estado': estadoChaser }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }
                                    }

                                    /*
                                      try {
                                          //!FULFILLMENT ======================================================================================================================================================
                                          //log.debug('fulfillment', 'Nueva lógica Fulfillment');
                                          let ubicacion = objRecord.getValue('custrecord_ht_ot_ordenfabricacion') ? _controller.getLocationToAssembly(objRecord.getValue('custrecord_ht_ot_ordenfabricacion')) : 0;
  
                                          //log.debug('ubicacion ', ubicacion);
                                          if (ubicacion == 0) {
                                              let buscarLocacion = search.lookupFields({
                                                  type: 'salesorder', id: idSalesOrder, columns: ['location']
                                              });
                                              ubicacion = buscarLocacion.location[0].value;
                                          }
  
                                          //log.debug('fulfillment', 'Nueva lógica Fulfillment 1');
                                          log.audit("Orden de Servicio", `<a href='https://7451241.app.netsuite.com/app/accounting/transactions/transaction.nl?id=${idSalesOrder}' target='_blank'>${idSalesOrder}</a>`)
                                          let newFulfill = record.transform({ fromType: record.Type.SALES_ORDER, fromId: idSalesOrder, toType: record.Type.ITEM_FULFILLMENT, isDynamic: true });
                                          let numLines = newFulfill.getLineCount({ sublistId: 'item' });
                                          log.audit("newFulfill", newFulfill)
  
                                          //log.debug('fulfillment', 'Nueva lógica Fulfillment 2');
  
                                          //cambio JCEC 20/08/2024
                                          log.error('Entro a Flujo JCEC', flujoAccesorio);
                                          let custrecord_ot_serie_acc;
                                          if (flujoAccesorio) {
                                              custrecord_ot_serie_acc = objRecord.getValue('custrecord_ot_serie_acc');
                                          }
  
                                          for (let i = 0; i < Number(numLines); i++) {
                                              //log.debug('fulfillment', 'Nueva lógica Fulfillment 3');
                                              newFulfill.selectLine({ sublistId: 'item', line: i })
                                              let idArticulo = newFulfill.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' })
                                              if (idArticulo == idItemRelacionadoOT) {
                                                  // galvar
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'subsidiary', value: subsidiary });
                                                  //
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: true });
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: ubicacion });
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: idItemRelacionadoOT });
                                                  newFulfill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                                                  //log.debug('fulfillment', 'Nueva lógica Fulfillment 4');
  
                                              // ! ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
                                                  let objSubRecord = newFulfill.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' });
                                                  let binNumber = "";
                                                  let lineCountInventoryassignment = objSubRecord.getLineCount({ sublistId: 'inventoryassignment' });
                                                  log.audit("Detalle de inventario - inicial", objSubRecord );
                                                  if( objSubRecord && lineCountInventoryassignment> 0 ){
                                                      binNumber = objSubRecord.getSublistValue({
                                                        sublistId: 'inventoryassignment',
                                                        fieldId: 'binnumber',
                                                        line: 0
                                                    });
                                                  }
                                                  if ( binNumber.length == 0){
                                                      log.audit(`Bin ${binNumber} Detalle de inventario - SelectLine`, objSubRecord);
                                                      objSubRecord.selectLine({ sublistId: 'inventoryassignment', line: 0 })
                                                      objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: idDispositivo });
  
                                                      //log.debug('fulfillment', 'Nueva lógica Fulfillment 5');
                                                      log.debug('fulfillment ubicacion', ubicacion);
                                                      log.debug('fulfillment convenio', convenio);
  
                                                      // if (ingresaFlujoConvenio) {
                                                      //     let bin = _controller.getBinConvenio(ubicacion, convenio);
                                                      //     log.debug('BIN-Convenio', bin);
                                                      //     objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: bin });
                                                      // }
                                                      //log.debug('fulfillment', 'Nueva lógica Fulfillment 6');
                                                      try {
                                                        objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                                                      } catch (error) {
                                                        log.audit("ERROR inventorystatus", error)
                                                      }
                                                      objSubRecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
  
                                                      //log.debug('fulfillment', 'Nueva lógica Fulfillment 7');
  
                                                      log.audit("Detalle de inventario - Antes del commitLine", objSubRecord);
                                                      
  
                                                      objSubRecord.commitLine({ sublistId: 'inventoryassignment' });
                                                  }
                                              }
                                              newFulfill.commitLine({ sublistId: 'item' });
                                          }
                                          let fulfillment = newFulfill.save({ enableSourcing: false, ignoreMandatoryFields: true });
                                          log.audit("Registro creado", `<a href="https://7451241.app.netsuite.com/app/accounting/transactions/itemship.nl?whence=&id=${fulfillment}" target="_black">${fulfillment}</a>`)
                                          log.debug('fulfillment', fulfillment);
                                      } catch (error) {
                                          log.audit("ERROR", error);
                                          log.error("Error-Fulfill..........1..............", error.stack);
                                          log.error('Error-Fulfill', error);
                                      }
                                   */
                                    if (entregaCustodia == _constant.Valor.SI) {
                                        _controller.deleteRegistroCustodia(objParams);
                                        noChequeado = 0
                                    }
                                }

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
                                                    //log.debug('Montossssss.....arrResult....', arrResult)
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
                                                    //log.debug('creditoTotal', creditoTotal);
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
                                                    if (objRecord.getValue('custrecord_ht_ot_flu_acc') == true) {
                                                        displayname = objRecord.getValue('custrecord_ot_serie_acc');
                                                    } else {
                                                        if (dispositivo != '') {
                                                            displayname = _controller.getDisplayNameDispos(numSerieId);
                                                        } else {
                                                            displayname = _controller.getDisplayNameLojack(numSerieId);
                                                        }
                                                    }


                                                    fixedAsset.setValue('altname', displayname);
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

                            //galvar
                            // actualiza el estado de simcard
                            if ((adp == _constant.Valor.VALOR_001_INST_DISPOSITIVO || adp == _constant.Valor.VALOR_003_REINSTALACION_DE_DISP) && statusOri == _constant.Status.CHEQUEADO) {
                                let serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                //log.debug('---serieProducto-----', serieProducto);
                                //log.debug('---boxserieLojack-----', boxserieLojack);
                                if (serieProducto.length > 0) {
                                    if (boxserieLojack) {
                                        //actualiza LOJACK datos tecnico galvar 08-06-25
                                        log.debug('---datos tecnico bien lojack-----', bien);
                                        if (chaser.length > 0) {
                                            let updateDatosTecnico = record.load({ type: _constant.customRecord.DATOS_TECNICOS, id: chaser });
                                            updateDatosTecnico.setValue({ fieldId: 'custrecord_ht_mc_estadolojack', value: _constant.Status.INSTALADO })
                                            updateDatosTecnico.setValue({ fieldId: 'custrecord_ht_mc_vehiculo', value: bien })
                                            updateDatosTecnico.save();
                                            log.debug('---Modificado datos tecnicos lojack-----', chaser);
                                        }
                                        //tabla dispositivo
                                        let dispositivoLojack = search.lookupFields({ type: _constant.customRecord.CHASER, id: serieProducto, columns: ['custrecord_ht_mc_seriedispositivolojack', 'custrecord_ht_mc_estadolojack', 'custrecord_ht_mc_subsidiaria', 'custrecord_ht_mc_vehiculo'] });
                                        let idDispositivo = dispositivoLojack.custrecord_ht_mc_seriedispositivolojack[0].value;
                                        log.debug('dispositivoLojack....', dispositivoLojack);
                                        log.debug('---datos dispositivo lojack-----', idDispositivo);
                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechaslojack',
                                            id: idDispositivo,
                                            values: { 'custrecord_ht_cl_estado': _constant.Status.INSTALADO },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                    } else {
                                        //CHASER
                                        //actualiza datos tecnico galvar 08-06-25
                                        log.debug('---datos tecnico bien-----', bien);
                                        if (chaser.length > 0) {
                                            let updateDatosTecnico = record.load({ type: _constant.customRecord.DATOS_TECNICOS, id: chaser });
                                            updateDatosTecnico.setValue({ fieldId: 'custrecord_ht_mc_estadolodispositivo', value: _constant.Status.INSTALADO })
                                            updateDatosTecnico.setValue({ fieldId: 'custrecord_ht_mc_vehiculo', value: bien })
                                            updateDatosTecnico.save();
                                            log.debug('---Modificado datos tecnicos-----', chaser);
                                        }
                                        //log.debug( 'Verificar SIMCARD - adp ' , adp)
                                        let dispositivo = search.lookupFields({ type: _constant.customRecord.CHASER, id: serieProducto, columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_estadolodispositivo', 'custrecord_ht_mc_celularsimcard', 'custrecord_ht_mc_estadosimcard', 'custrecord_ht_mc_subsidiaria', 'custrecord_ht_mc_vehiculo'] });
                                        //tabla dispositivo
                                        let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                        log.debug('dispositivoMonitoreo....1', dispositivo);
                                        log.debug('---datos dispositivo-----', idDispositivo);
                                        record.submitFields({  // !AAA
                                            type: 'customrecord_ht_record_detallechaserdisp',
                                            id: idDispositivo,
                                            values: { 'custrecord_ht_dd_estado': _constant.Status.INSTALADO },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                        let estadoSimCard = dispositivo?.custrecord_ht_mc_estadosimcard[0]?.value || "0";
                                        let subsidiariadisp = dispositivo?.custrecord_ht_mc_subsidiaria[0]?.value;
                                        // excluye los activo y cortado                                   
                                        if ((estadoSimCard != "1" && estadoSimCard != "3") && subsidiariadisp == "2") {
                                            try {
                                                let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                                                log.debug('Verificar SIMCARD -idSimCard: ', idSimCard);
                                                record.submitFields({
                                                    type: 'customrecord_ht_record_detallechasersim',
                                                    id: idSimCard,
                                                    values: { 'custrecord_ht_ds_estado': _constant.Status.ACTIVO },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                                //log.debug('idSimCard....Actualizada', idSimCard);
                                            } catch (error) {
                                                log.error('SimCard....', error);
                                            }
                                        }

                                    }
                                }
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

                                let bienlog = objRecord.getValue('custrecord_ht_ot_vehiculo');
                                log.debug('Bienlog', bienlog);

                                if (existRecord == 0) {
                                    //GALVAR VER 
                                    try {
                                        log.debug("customrecord_ht_nc_servicios_instalados....", {
                                            "bien": objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                            "custrecord_ns_orden_servicio_si": idSalesorder,
                                            "custrecord_ns_orden_trabajo": id
                                        });
                                        //         let objRecordCreateServicios = record.create({ type: 'customrecord_ht_nc_servicios_instalados', isDynamic: true });
                                        //         objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_bien_si', value: objRecord.getValue('custrecord_ht_ot_vehiculo'), ignoreFieldChange: true });
                                        //         objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_servicio_si', value: idSalesorder, ignoreFieldChange: true });
                                        //         objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_trabajo', value: id, ignoreFieldChange: true });
                                        //         //objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_servicio', value: TTR_name, ignoreFieldChange: true });
                                        //         objRecordCreateServicios.save();                                    
                                    } catch (error) {
                                        log.debug('Error-CreateServicios', error);
                                    }
                                }
                                objParams.estado = estadoChaser
                                objParams.t_PPS = T_PPS
                                log.debug('--objParams--', objParams);
                                _controller.updateInstall(objParams);
                                if (conNovedad == true) {
                                    //TODO: RETIRAR EL CAMPO Y VALIDAR FLUJO
                                    record.submitFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieChaser,
                                        values: { 'custrecord_ht_mc_estadolodispositivo': estadoChaser },
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
                                if (estadoChaser == _constant.Status.PERDIDO || estadoChaser == _constant.Status.DANADO || estadoChaser == _constant.Status.DADO_DE_BAJO || estadoChaser == _constant.Status.DESINSTALADO || estadoChaser == _constant.Status.CODIGO_BLANCO) {
                                    //let value = impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI;
                                    //let value2 = impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI;
                                    //log.debug("value", value);
                                    //log.debug("value", value2);
                                    //galvar 25-06-25
                                    //log.debug("estadoChaser.................", estadoChaser);
                                    if (impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI) {
                                        //returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, "318");
                                    }

                                    if (impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI) {
                                        //returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, "318");
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

                            //galvar 27/06/2025
                            if (adp == _constant.Valor.VALOR_007_CHEQUEO_DE_COMPONENTES) {
                                log.debug("estadoChaser valor", estadoChaser);
                                objParams.estado = estadoChaser
                                objParams.t_PPS = T_PPS
                                _controller.updateInstall(objParams);
                                if (conNovedad == true) {
                                    //TODO: RETIRAR EL CAMPO Y VALIDAR FLUJO
                                    record.submitFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieChaser,
                                        values: { 'custrecord_ht_mc_estadolodispositivo': estadoChaser },
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
                                            subject: 'Resultado de la Orden de Servicio por Chequeo de Componentes ' + valueSalesorder + ' con novedad',
                                            body: emailBody,
                                            relatedRecords: {
                                                transactionId: idSalesorder
                                            }
                                        });
                                    } catch (error) {
                                        log.error('Error-EMAIL', error);
                                    }
                                }

                                let impulsoPx = parametrizacionProducto[_constant.Codigo_parametro.COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS];
                                let impulsoTelematic = parametrizacionProducto[_constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS];
                                log.debug("params", { impulsoPx, impulsoTelematic });
                                if (estadoChaser == _constant.Status.PERDIDO || estadoChaser == _constant.Status.DANADO || estadoChaser == _constant.Status.DADO_DE_BAJO || estadoChaser == _constant.Status.DESINSTALADO || estadoChaser == _constant.Status.CODIGO_BLANCO) {
                                    //let value = impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI;
                                    //let value2 = impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI;
                                    //log.debug("value", value);
                                    //log.debug("value", value2);
                                    //galvar 25-06-25
                                    //log.debug("estadoChaser.................", estadoChaser);
                                    if (impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI) {
                                        //returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, "318");
                                    }

                                    if (impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI) {
                                        //returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, "318");
                                    }
                                }
                            }
                            if (adp == _constant.Valor.VALOR_013_CHEQUEO_OTROS_PRODUCTOS) {
                                log.debug("estadoChaser valor", estadoChaser);
                                objParams.estado = estadoChaser
                                objParams.t_PPS = T_PPS
                                _controller.updateInstall(objParams);
                                if (conNovedad == true) {
                                    //TODO: RETIRAR EL CAMPO Y VALIDAR FLUJO
                                    record.submitFields({
                                        type: _constant.customRecord.CHASER,
                                        id: serieChaser,
                                        values: { 'custrecord_ht_mc_estadolodispositivo': estadoChaser },
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
                                            subject: 'Resultado de la Orden de Servicio por Chequeo de Otros Productos ' + valueSalesorder + ' con novedad',
                                            body: emailBody,
                                            relatedRecords: {
                                                transactionId: idSalesorder
                                            }
                                        });
                                    } catch (error) {
                                        log.error('Error-EMAIL', error);
                                    }
                                }

                                let impulsoPx = parametrizacionProducto[_constant.Codigo_parametro.COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS];
                                let impulsoTelematic = parametrizacionProducto[_constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS];
                                log.debug("params", { impulsoPx, impulsoTelematic });
                                if (estadoChaser == _constant.Status.PERDIDO || estadoChaser == _constant.Status.DANADO || estadoChaser == _constant.Status.DADO_DE_BAJO || estadoChaser == _constant.Status.DESINSTALADO || estadoChaser == _constant.Status.CODIGO_BLANCO) {
                                    //let value = impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI;
                                    //let value2 = impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI;
                                    //log.debug("value", value);
                                    //log.debug("value", value2);
                                    //galvar 25-06-25
                                    //log.debug("estadoChaser.................", estadoChaser);
                                    if (impulsoPx !== undefined && impulsoPx.valor == _constant.Codigo_Valor.COD_SI) {
                                        //returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, "318");
                                    }

                                    if (impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI) {
                                        //returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                        returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, "318");
                                    }
                                }
                            }

                            //fin de lo nuevo
                            if (adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP && statusOri == _constant.Status.CHEQUEADO) {//TODO: Revisar actualizaciones cuando es locjack, ya que no tiene simcard
                                log.debug('Tipo Desinstalación', `entregaCliente == ${entregaCliente} && esGarantia == ${esGarantia} && entradaCustodia == ${entradaCustodia} && esAlquiler == ${esAlquiler}`);
                                objParams.t_PPS = T_PPS;
                                objParams.estado = estadoChaser;
                                log.debug('Ingreso VALOR_002_DESINSTALACION_DE_DISP', estadoChaser);
                                adp = ingresaFlujoGarantiaReinstalación == true ? _constant.Valor.VALOR_001_INST_DISPOSITIVO : adp
                                if (envioPX == _constant.Valor.SI) {
                                    returEjerepo = _controller.parametros(_constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, id, adp);
                                    log.debug('DESACTIVACIÓN-PX o ingresaFlujoGarantiaReinstalación', returEjerepo);
                                    if (returEjerepo == false) return false
                                }

                                if (envioTele == _constant.Valor.SI) {
                                    returEjerepo = _controller.parametros(_constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, id, adp);
                                    log.debug('DESACTIVACIÓN-TM o REINSTALACION-TM', returEjerepo);
                                    if (returEjerepo == false) return false
                                }

                                if (esAlquiler == _constant.Valor.SI) {
                                    log.debug('Alquiler', 'Es alquiler');
                                    if (tag == _constant.Valor.VALOR_LOJ_LOJACK)
                                        objParams.tag = tag
                                    let parametros = getParamFamiliaProductosArticuloOSDesinstalacion(_constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION, idItemOT, _constant.Valor.SI);

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
                                            log.debug('ajusteInv', ajusteInv);
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
                                            //TODO: RETIRAR EL CAMPO Y VALIDAR FLUJO
                                            log.debug('TAG', 'estadoChaser: 1' + estadoChaser)
                                            record.submitFields({
                                                type: 'customrecord_ht_record_mantchaser',
                                                id: serieChaser,
                                                //values: { 'custrecord_ht_mc_estado': estadoChaser },
                                                values: { 'custrecord_ht_mc_estadolodispositivo': estadoChaser },
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
                                }

                                if (entregaCliente == _constant.Valor.SI || (esGarantia == _constant.Valor.SI && ingresaFlujoGarantiaReinstalación == false)) {
                                    log.debug('entrgaCliente', 'es Entrega Cliente o Garantía: ' + estadoChaser + ' - ' + serieChaser);
                                    objParams.estado = estadoChaser
                                    let updateIns = _controller.updateInstall(objParams);
                                    log.debug('updateIns', updateIns);
                                    try {
                                        //* =====================================
                                        if (dispositivoMonitoreo) {
                                            record.submitFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: { 'custrecord_ht_mc_estadolodispositivo': _constant.Status.DESINSTALADO }, options: { enableSourcing: true, ignoreMandatoryFields: true } });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard', 'custrecord_ht_mc_estadolodispositivo'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                            let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                                            log.debug('dispositivoMonitoreo', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaserdisp', id: idDispositivo, values: { 'custrecord_ht_dd_estado': _constant.Status.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                            record.submitFields({ type: 'customrecord_ht_record_detallechasersim', id: idSimCard, values: { 'custrecord_ht_ds_estado': _constant.Status.EN_PROCESO_DE_CORTE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }

                                        if (boxserieLojack) {
                                            record.submitFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: { 'custrecord_ht_mc_estadolojack': _constant.Status.DESINSTALADO }, options: { enableSourcing: true, ignoreMandatoryFields: true } });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivolojack'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                            log.debug('dispositivoLojack', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaslojack', id: idDispositivo, values: { 'custrecord_ht_cl_estado': _constant.Status.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
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
                                            //log.debug('Garantía', 'Es garantía');
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
                                            let ajusteInv = _controller.createInventoryAdjustmentIngreso(objParams, 0, 3);
                                            log.debug('ajusteInv', ajusteInv);
                                        } catch (error) {
                                            log.error('Error2', error);
                                        }
                                    }
                                }

                                if (entradaCustodia == _constant.Valor.SI) {
                                    let serieProducto = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
                                    let ubicacion = objRecord.getText('custrecord_ht_ot_ubicacion');
                                    //log.debug('Flujo Custodia', 'Es custodia');
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
                                        //log.debug('TAG', 'LOJACK: ' + tag)
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
                                        //log.debug('TAG', 'MONITOREO/CARGO: ' + tag)
                                        log.debug('TAG', 'estadoChaser: 2' + estadoChaser)
                                        record.submitFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieChaser,
                                            values: {
                                                'custrecord_ht_mc_estadolodispositivo': estadoChaser,
                                            },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                        //log.debug('TAG', 'Track1: ' + tag)
                                        let dispositivo = search.lookupFields({
                                            type: _constant.customRecord.CHASER,
                                            id: serieChaser,
                                            columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard']
                                        });
                                        let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                        //log.debug('TAG', 'Track2: ' + tag)
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
                                        estado: estadoInts,
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
                                    log.debug('Garantía JSON Rein', json);
                                    log.debug('*adp3*..........................', { adp, json });
                                    createCoberturaWS(json);

                                    // let gpt = _controller.getParameter(idItemRelacionadoOT, _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS);
                                    // if (gpt != 0 && gpt == _constant.Valor.SI) {
                                    //     returEjerepo = _controller.parametros(_constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, objRecord.id, adp);
                                    //     log.debug('RESPONSETM-REINSTALACION', returEjerepo);
                                    // }
                                }

                                if (entregaCliente == 0 && esGarantia == 0 && entradaCustodia == 0 && esAlquiler == 0) {
                                    log.debug('Devolución', 'es Devolución: ' + estadoChaser + ' - ' + serieChaser);
                                    objParams.boleano = true;
                                    objParams.estado = estadoChaser;
                                    objParams.deposito = '';
                                    let updateIns = _controller.updateInstall(objParams);
                                    log.debug('updateIns', updateIns);
                                    try {
                                        //* =====================================
                                        if (dispositivoMonitoreo) {
                                            record.submitFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: { 'custrecord_ht_mc_estadolodispositivo': _constant.Status.DESINSTALADO }, options: { enableSourcing: true, ignoreMandatoryFields: true } });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard', 'custrecord_ht_mc_estadolodispositivo'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                                            let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                                            log.debug('dispositivoMonitoreo', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaserdisp', id: idDispositivo, values: { 'custrecord_ht_dd_estado': _constant.Status.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                            record.submitFields({ type: 'customrecord_ht_record_detallechasersim', id: idSimCard, values: { 'custrecord_ht_ds_estado': _constant.Status.EN_PROCESO_DE_CORTE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                                        }

                                        if (boxserieLojack) {
                                            record.submitFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, values: { 'custrecord_ht_mc_estadolojack': _constant.Status.DESINSTALADO }, options: { enableSourcing: true, ignoreMandatoryFields: true } });
                                            let dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: serieChaser, columns: ['custrecord_ht_mc_seriedispositivolojack'] });
                                            let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivolojack[0].value;
                                            log.debug('dispositivoLojack', dispositivo);
                                            record.submitFields({ type: 'customrecord_ht_record_detallechaslojack', id: idDispositivo, values: { 'custrecord_ht_cl_estado': _constant.Status.DISPONIBLE }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
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
                                log.debug("...BLOQUE DE SERVICIOS ...", {
                                    "bien": bien,
                                    "idSalesorder": idSalesorder,
                                    "idtrabajo": id
                                });
                                //log.debug('.....................objRecord..........................', objRecord);
                                let sql = 'SELECT id FROM customrecord_ht_nc_servicios_instalados ' +
                                    'WHERE custrecord_ns_bien_si = ? AND custrecord_ns_orden_servicio_si = ? AND custrecord_ns_orden_trabajo = ?';
                                let params = [bien, idSalesorder, id];
                                let resultSet = query.runSuiteQL({ query: sql, params: params });
                                let results = resultSet.asMappedResults();
                                if (results.length > 0) {
                                    let deleteServices = record.delete({ type: 'customrecord_ht_nc_servicios_instalados', id: results[0]['id'] });
                                    log.debug('DELETESERVICES', deleteServices);
                                }
                                objRecord.getValue('custrecord_ht_ot_servicios_commands').length > 0 ? setServices(bien, idSalesorder, id, objRecord, subsidiary) : 0;
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
                log.debug('IngresoCambioProcesando-entregaCustodia', `${entregaCustodia} == ${_constant.Valor.SI}`)
                if (entregaCustodia == _constant.Valor.SI) {
                    noChequeado = 0
                }
                //log.debug('.............3........................', '.............3........................');
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

        const setServices = (bien, idSalesorder, id, objRecord, subsidiary) => {
            try {
                log.debug("Guardar setServices", {
                    "custrecord_ns_bien_si": Number(bien),
                    "custrecord_ns_orden_servicio_si": idSalesorder,
                    "custrecord_ns_orden_trabajo": id,
                    "subsidiary": subsidiary,
                    "custrecord_ns_servicio": objRecord.getValue('custrecord_ht_ot_servicios_commands'),
                    "custrecord_ht_si_numero_puertas": objRecord.getValue('custrecord_ht_ot_numero_puertas'),
                    "custrecord_ht_si_novedad": objRecord.getValue('custrecord_ht_ot_observacion')
                });
                let objRecordCreateServicios = record.create({ type: 'customrecord_ht_nc_servicios_instalados', isDynamic: true });
                objRecordCreateServicios.setValue({ fieldId: 'custrecord_si_sub', value: subsidiary, ignoreFieldChange: true });
                objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_bien_si', value: Number(bien), ignoreFieldChange: true });
                objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_servicio_si', value: Number(idSalesorder), ignoreFieldChange: true });
                objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_orden_trabajo', value: id, ignoreFieldChange: true });
                objRecordCreateServicios.setValue({ fieldId: 'custrecord_ns_servicio', value: objRecord.getValue('custrecord_ht_ot_servicios_commands'), ignoreFieldChange: true });
                objRecordCreateServicios.setValue({ fieldId: 'custrecord_ht_si_numero_puertas', value: objRecord.getValue('custrecord_ht_ot_numero_puertas'), ignoreFieldChange: true });
                objRecordCreateServicios.setValue({ fieldId: 'custrecord_ht_si_novedad', value: objRecord.getValue('custrecord_ht_ot_observacion'), ignoreFieldChange: true });
                objRecordCreateServicios.save();
                return objRecordCreateServicios;
            } catch (e) {
                log.error("ErrorSetServices", e.stack);
            }
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
        }

        const getSalesOrderItem = (idBienorSalesOrder, checkConvenio) => {
            filtro = '';
            if (checkConvenio) {
                filtro = ["internalid", "anyof", idBienorSalesOrder]
            } else {
                filtro = ["custbody_ht_so_bien", "anyof", idBienorSalesOrder]
            }

            try {
                let busqueda = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            filtro,
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

        const getCoberturaItem = (idBien, subsidiaria) => {
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", idBien],
                            "AND",
                            ["custrecord_ht_co_subsidiaria", "anyof", subsidiaria]
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

            try {  // 21/05/2025
                if (json?.start) json.start = json.start + 'T05:00:00'
                if (json?.end) json.end = json.end + 'T05:00:00'
            } catch (e) {
                log.debug("error", e);
                //log.debug("error", json);
            }
            log.debug("---JSON-1--", json);


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
            log.debug('........response...............', response);
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
            //log.debug('idItemTypePR....id', id)
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

        // const getCobertura = (cantidad, undTiempo, fechaChequeo) => {
        //     log.debug('TIEMPOSSS', `${parseInt(cantidad)} -  ${undTiempo} - ${fechaChequeo}`);
        //     let date = new Date(fechaChequeo);
        //     date.setDate(date.getDate());
        //     let dateChequeo = convertFechaFinalToCobertura(fechaChequeo)
        //     let date_final = new Date(dateChequeo);

        //     try {
        //         if (undTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
        //             cantidad = parseInt(cantidad) * 12
        //             date_final.setDate(date_final.getDate());
        //             date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
        //         } else if (undTiempo == _constant.Constants.UNIDAD_TIEMPO.DIA) {
        //             date_final.setDate(date_final.getDate() + parseInt(cantidad));
        //         } else {
        //             date_final.setDate(date_final.getDate());
        //             date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
        //         }
        //         date_final = new Date(date_final);
        //         let horaChequeo = getHoraChequeo()
        //         date_final.setHours(date_final.getHours() + Number(horaChequeo.split(":")[0]));
        //         let fechaAjustada = date_final.toISOString();

        //         log.debug('FECHAS', `${date} - ${fechaAjustada}`);

        //         return {
        //             coberturaInicial: date,
        //             coberturaFinal: fechaAjustada
        //         };
        //     } catch (e) { }
        // }


        const getCobertura = (cantidad, undTiempo, fechaChequeo) => {
            //log.debug('TIEMPOSSS', `${parseInt(cantidad)} -  ${undTiempo} - ${fechaChequeo}`);
            let date = new Date(fechaChequeo);
            date.setDate(date.getDate());
            let dateChequeo = convertFechaFinalToCobertura(fechaChequeo)
            let date_final = new Date(dateChequeo);
            try {
                if (undTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                    cantidad = parseInt(cantidad) * 12
                    date_final.setDate(date_final.getDate());
                    date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
                } else if (undTiempo == _constant.Constants.UNIDAD_TIEMPO.DIA) {
                    date_final.setDate(date_final.getDate() + parseInt(cantidad));
                } else {
                    date_final.setDate(date_final.getDate());
                    date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
                }
                date_final = new Date(date_final);
                let horaChequeo = getHoraChequeo()
                date_final.setHours(date_final.getHours() + Number(horaChequeo.split(":")[0]));
                let fechaAjustada = date_final.toISOString();
                // date.setHours(date.getHours() + Number(horaChequeo.split(":")[0]));
                date.setHours(date.getHours());
                date = date.toISOString()
                //log.debug('FECHAS', `${date} - ${fechaAjustada}`);
                return {
                    // coberturaInicial: date,
                    // coberturaFinal: fechaAjustada
                    coberturaInicial: date.split("T")[0],
                    coberturaFinal: fechaAjustada.split("T")[0]
                };
            } catch (e) {
                log.debug(e);
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
            let itemName = objRecord.getText('custrecord_ht_ot_item') || "";
            itemName = itemName.toLowerCase();
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
            let checkFlujoCustodia = objRecord.getValue('custrecord_flujo_de_custodia')
            if (checkFlujoCustodia == false) return
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
            let checkFlujoAluiler = objRecord.getValue('custrecord_flujo_de_alquiler')
            if (checkFlujoAluiler == false) return
            let salesorder = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let workorder = objRecord.id;
            let customer = objRecord.getValue('custrecord_ht_ot_cliente_id');
            let item = objRecord.getValue('custrecord_ht_ot_item');
            let subsidiary = objRecord.getValue('custrecord_ht_ot_subsidiary');
            let location = "";
            if (salesorder) {
                locationSearch = search.lookupFields({
                    type: 'salesorder', id: salesorder, columns: ['location']
                });
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
            //log.debug('getItemForFulfillment', `${item}-${itemSerie}`)
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
                    let familiaArtOS = _controller.getParameter(results[0].item, _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS);
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

        function obtCobeFechaFin(idCobertura) {
            try {

                if (!idCobertura) {
                    log.error('Error al obtener cobertura final', 'ID de cobertura no proporcionado');
                    return null;
                }

                const resultado = search.lookupFields({
                    type: 'customrecord_ht_co_cobertura',
                    id: idCobertura,
                    columns: ['custrecord_ht_co_coberturafinal']
                });

                return resultado.custrecord_ht_co_coberturafinal || null;
            } catch (error) {
                log.error('Error al obtener cobertura final', error);
                return null;
            }
        }

        function consultaFamiliaNetsuite(familia) {
            let results = [];
            try {
                let FamiliaSearch = search.create({
                    type: "customrecord_ht_cr_pp_valores",
                    filters: [
                        ["custrecord_ht_pp_codigo", "is", familia],
                        // 'AND',
                        // ['owner.subsidiary', 'anyof', '2'],
                        'AND',
                        ['custrecord33', 'anyof', '2']
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "name" }),
                        search.createColumn({ name: "custrecord_ht_pp_codigo" }),
                    ],
                });

                let searchResult = FamiliaSearch.runPaged();

                searchResult.pageRanges.forEach(function (pageRange) {
                    let myPage = searchResult.fetch({ index: pageRange.index });

                    myPage.data.forEach(function (result) {

                        results.push({
                            id: result.getValue({ name: "internalid" }),
                            name: result.getValue({ name: "name" }),
                            codigo: result.getValue({ name: "custrecord_ht_pp_codigo" }),
                        });
                    });
                });

                log.debug("resultssss", results)

                return results[0];
            } catch (error) {
                log.debug("Error", { error: error.message, stack: error.stack });

                return [];
            }
        }



        function consultaCobertura(IdVehiculo, idfamilia) {
            let results = [];

            try {
                let CoberturaSearch = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters: [
                        ["custrecord_ht_co_bien", "anyof", IdVehiculo],
                        "AND",
                        ["custrecord_ht_co_familia_prod", "anyof", idfamilia],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "name" }),
                        search.createColumn({ name: "custrecord_ht_co_clientemonitoreo" }),
                        search.createColumn({ name: "custrecord_ht_co_bien" }),
                        search.createColumn({ name: "custrecord_ht_co_producto" }),
                        search.createColumn({ name: "custrecord_ht_co_coberturainicial" }),
                        search.createColumn({ name: "custrecord_ht_co_coberturafinal" }),
                        search.createColumn({ name: "custrecord_ht_co_numeroserieproducto" }),
                        search.createColumn({ name: "custrecord_ht_co_plazo" }),
                        search.createColumn({ name: "custrecord_ht_co_estado_cobertura" }),
                        search.createColumn({ name: "custrecord_ht_co_propietario" }),
                    ],
                });

                let searchResult = CoberturaSearch.runPaged();

                searchResult.pageRanges.forEach(function (pageRange) {
                    let myPage = searchResult.fetch({ index: pageRange.index });

                    myPage.data.forEach(function (result) {

                        results.push({
                            id: result.getValue({ name: "internalid" }),
                            name: result.getValue({ name: "name" }),
                            clientemonitoreo: result.getValue({ name: "custrecord_ht_co_clientemonitoreo" }),
                            bien: result.getValue({ name: "custrecord_ht_co_bien" }),
                            producto: result.getValue({ name: "custrecord_ht_co_producto" }),
                            coberturainicial: result.getValue({ name: "custrecord_ht_co_coberturainicial" }),
                            coberturafinal: result.getValue({ name: "custrecord_ht_co_coberturafinal" }),
                            numeroserieproducto: result.getValue({ name: "custrecord_ht_co_numeroserieproducto" }),
                            plazo: result.getValue({ name: "custrecord_ht_co_plazo" }),
                            estado_cobertura: result.getValue({ name: "custrecord_ht_co_estado_cobertura" }),
                            propietario: result.getValue({ name: "custrecord_ht_co_propietario" }),
                        });
                    });
                });

                return results[0];

            } catch (error) {
                log.debug("error", error);
                return [];
            }
        }

        function evaluarFechaCobertura(fechaFinalCobertura) {
            try {
                const formatoValido = /^\d{2}\/\d{2}\/\d{4}$/;
                if (!formatoValido.test(fechaFinalCobertura)) return false;

                const hoy = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" }));
                const dia = String(hoy.getDate()).padStart(2, '0');
                const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                const anio = hoy.getFullYear();
                const fechaActual = new Date(`${anio}-${mes}-${dia}`);

                const partes = fechaFinalCobertura.split('/');
                const fechaFinal = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);

                if (isNaN(fechaFinal) || isNaN(fechaActual)) return false;

                return fechaFinal >= fechaActual;
            } catch (error) {
                log.error("Error al evaluar cobertura", error);
                return false;
            }
        }

        function obtenerParametrizacionItem(items, busquedaParametro) {
            try {
                let data = [];
                for (let i = 0; i < busquedaParametro.length; i++) {

                    if (!items || !busquedaParametro[i]) {
                        log.debug("Error", "El ID del item o el parámetro de búsqueda son nulos o indefinidos");
                        return [];
                    }

                    let filtro = [
                        ["custrecord_ht_pp_parametrizacionid", "is", items],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_rela.custrecord_ht_pp_code", "is", busquedaParametro[i]]
                    ];

                    let busqueda = search.create({
                        type: "customrecord_ht_pp_main_param_prod",
                        filters: filtro,
                        columns: [
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Param" }),
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" }),
                            search.createColumn({ name: "custrecord_ht_pp_code", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_RELA", label: "Código" }),
                            search.createColumn({ name: "custrecord_ht_pp_codigo", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_VALOR", label: "Código" }),
                        ],
                    });

                    let resultCount = busqueda.runPaged().count;

                    if (resultCount > 0) {
                        let pageData = busqueda.runPaged({ pageSize: 1 });
                        pageData.pageRanges.forEach((pageRange) => {
                            let page = pageData.fetch({ index: pageRange.index });
                            page.data.forEach((result) => {
                                let columns = result.columns;
                                let parametrizacion = {
                                    Param: result.getValue(columns[2]) || "",
                                    ParamId: result.getValue(columns[0]) || "",
                                    Valor: result.getValue(columns[3]) || "",
                                    ValorText: result.getText(columns[1]) || "",
                                    ValorId: result.getValue(columns[1]) || "",
                                };
                                data.push(parametrizacion);
                            });
                        });
                    } else {
                        data.push({
                            Param: "",
                            ParamId: "",
                            Valor: "",
                            ValorText: "",
                            ValorId: "",
                        });
                    }
                }
                return data;
            } catch (error) {
                log.error("Error", { error: error.message, stack: error.stack });
                return []
            }
        };

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

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
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