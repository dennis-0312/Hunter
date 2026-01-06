/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/https',
    'N/query',
    'N/file',
    'N/runtime',
    'N/ui/serverWidget',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, search, record, https, query, file, runtime, serverWidget, _controller, _constant, _errorMessages) => {
        const ROLES = ['administrator', 'customrole_ec_administradorec'];
        const folderRequest = 24651; //SB: 28733 - PR:24651
        const folderResponse = 24652; //SB: 28734 - PR:24652
        const PLATAFORMA_PX = 'PX';
        const PLATAFORMA_TELEMATICS = 'TELEMATICS';

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let form = scriptContext.form
            form.clientScriptModulePath = './TS_CS_Cobertura_Dispositivos.js';
            let userRoleId = runtime.getCurrentUser().roleId;
            //log.debug('userRole', `${userRoleId}`);
            if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                let parameters = {}
                parameters.id = scriptContext.newRecord.id
                parameters.type = scriptContext.type
                parameters.request = scriptContext.request
                let idtelematics = search.lookupFields({
                    type: _constant.customRecord.BIENES,
                    id: scriptContext.newRecord.getValue('custrecord_ht_co_bien'),
                    columns: ['custrecord_ht_bien_id_telematic']
                });
                //log.debug('idtelematics', idtelematics);
                parameters.asset = idtelematics.custrecord_ht_bien_id_telematic;
                parameters.endpoint = 'asset/id';
                if (ROLES.includes(userRoleId)) {
                    parameters.endpoint = 'asset/id'
                    form.addButton({
                        id: 'custpage_ts_btn_ver_cobertura',
                        label: 'Ver Coberura en Plataforma',
                        functionName: 'getCobertura(' + JSON.stringify(parameters) + ')'
                    });

                    form.addButton({
                        id: 'custpage_ts_btn_actualizar_cobertura',
                        label: 'Actualizar Coberura en Plataforma',
                        functionName: 'postCobertura(' + JSON.stringify(parameters) + ')'
                    });
                }
            }


            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
                if (ROLES.includes(userRoleId)) {
                    // form.addButton({
                    //     id: 'custpage_ts_btn_ver_data_bien',
                    //     label: 'Ver Datos del Bien',
                    //     functionName: 'getAssetData(' + JSON.stringify(parameters) + ')'
                    // });

                    // let field_view_result = form.addField({
                    //     id: 'custpage_view_results_impulso',
                    //     type: serverWidget.FieldType.TEXTAREA,
                    //     label: 'Sample label'
                    // });
                    // field_view_result.updateDisplaySize({ height: 60, width: 100 });
                }
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            try {
                log.debug('beforeSubmit.scriptContext.type', scriptContext.type);

                if (scriptContext.type === scriptContext.UserEventType.DELETE) {
                    let registroEliminado = scriptContext.newRecord;
                    log.debug('Registro eliminado', 'ID: ' + registroEliminado.id);

                    let bienCobe = registroEliminado.getValue('custrecord_ht_co_bien') || 0;
                    let subsidiaria = runtime.getCurrentUser().subsidiary;
                    if (subsidiaria != 2) return

                    log.debug('Registro eliminado - Bien', bienCobe);

                    // Usamos el módulo record para crear el log
                    let objRecord = record.create({ type: 'customrecord_log_proceso_general', isDynamic: true });
                    objRecord.setValue({ fieldId: 'custrecordlog_proceso_general_proceso', value: 'EnvioCobertura' });
                    objRecord.setValue({
                        fieldId: 'custrecord_log_proceso_general_traza',
                        value: {
                            'origen': 'DELETE',
                            'bienCobe': bienCobe
                        }
                    });
                    objRecord.setValue({ fieldId: 'custrecordid_registro_proc_general', value: registroEliminado.id || 0 });
                    objRecord.setValue({ fieldId: 'custrecord_producto_lpc', value: 'F' });
                    objRecord.save();
                }
            } catch (error) {
                log.error('Error en beforeSubmit', error);
            }
        };


        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            log.debug('scriptContext.type', scriptContext.type)
            if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.XEDIT) {
                let objRecord = scriptContext.newRecord;
                let item = objRecord.getValue('custrecord_ht_co_producto');
                let accionImpulso = Number(objRecord.getValue('custrecord_ht_co_impulso_plataforma'));
                let aplica = '';
                let updateData = {}
                switch (accionImpulso) {
                    case _constant.accionImpulso.PX_MODIFICACION_DATOS_DISPOSITIVOS:
                        let trama = {}

                        aplica = getParameterPlataforma(item, _constant.Codigo_parametro.COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS, _constant.Codigo_Valor.COD_SI)
                        log.debug('aplica-cobertura-px', `${aplica} - ${objRecord.id}`);
                        if (aplica > 0) {
                            trama = construirTrama(objRecord, accionImpulso);
                            log.debug('trama', trama)
                            if (Object.keys(trama).length > 0) {
                                let responsepxModificacionDatosDispositivos = pxModificacionDatosDispositivos(trama);
                                log.debug('response', responsepxModificacionDatosDispositivos)
                            } else {
                                log.debug("El objeto está vacío.");
                            }
                        }

                        aplica = getParameterPlataforma(item, _constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, _constant.Codigo_Valor.COD_SI);
                        log.debug('aplica-cobertura-tm', `${aplica} - ${objRecord.id}`);
                        if (aplica > 0) {
                            log.debug('request', trama);
                            // if (trama.asset.length > 0) {            // Antes
                            if (trama && trama?.asset?.length > 0) {     // Despues Doas - 03/06/2025 

                                try {
                                    let responsetmRenovacionActivacion = JSON.parse(tmRenovacionActivacion(trama));

                                    log.debug("responsetmRenovacionActivacion", responsetmRenovacionActivacion)

                                    responsetmRenovacionActivacion.results[0].body = JSON.parse(responsetmRenovacionActivacion?.results[0]?.body);
                                    log.debug('response', responsetmRenovacionActivacion);
                                    let requestFile = saveJson(trama, `request${objRecord.id}`, folderRequest);
                                    let responseFile = saveJson(responsetmRenovacionActivacion, `response${objRecord.id}`, folderResponse);
                                    let objData = {
                                        cobertura: objRecord.id,
                                        requestFile: requestFile,
                                        responseFile: responseFile,
                                        code: responsetmRenovacionActivacion.results[0].code,
                                        impulso: _constant.accionImpulso.TM_VERIFICACION_COBERTURA,
                                        plataforma: PLATAFORMA_TELEMATICS
                                    }
                                    log.debug('objData', objData)
                                    createRecordTraza(objData);
                                } catch (error) {
                                    log.debug("error", { error: error.message, stack: error.stack });
                                }


                            } else {
                                log.debug("El objeto está vacío.");
                            }
                        }
                        break;
                    case _constant.accionImpulso.TM_CAMBIO_ESTADO_DISPOSITIVO:
                        // if (objRecord.getValue('custrecord_ht_co_estado_cobertura') == _constant.Status.SUSPENDIDO && objRecord.getValue('custrecord_ht_co_estado_conciliacion') == _constant.Status.ENVIADO_A_CORTE) {
                        //     let idchaser = objRecord.getValue('custrecord_ht_co_numeroserieproducto');
                        //     let idbien = objRecord.getValue('custrecord_ht_co_bien');
                        //     let estadoSim = 'COR';
                        //     try {
                        //         let parametrosResponse = _controller.parametrizacion(objRecord.getValue('custrecord_ht_co_producto'));
                        //         if (parametrosResponse.length != 0) {
                        //             for (let j = 0; j < parametrosResponse.length; j++) {
                        //                 if (parametrosResponse[j][0] == _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS)
                        //                     envioCortePX = parametrosResponse[j][1];

                        //                 if (parametrosResponse[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS)
                        //                     envioCorteTM = parametrosResponse[j][1];
                        //             }
                        //             // log.debug('CortePX', 'Enviado a Corte PX: ' + envioCortePX);
                        //             // log.debug('CorteTM', 'Enviado a Corte TM: ' + envioCorteTM);
                        //             // log.debug('Datos', 'Datos de corte: ' + idchaser + ' - ' + idbien + ' - ' + estadoSim);
                        //             if (envioCortePX == _constant.Valor.SI) {
                        //                 const returCortePX = _controller.envioPXActualizacionEstado(idchaser, idbien, estadoSim);
                        //                 log.debug('ResponseCortePX', returCortePX);
                        //             }
                        //             if (envioCorteTM == _constant.Valor.SI) {
                        //                 const returnCorteTM = _controller.envioTelecCorteSim(idchaser);
                        //                 log.debug('ResponseCorteTM', returnCorteTM);
                        //             }
                        //         }
                        //     } catch (error) {
                        //         log.error('Error-Corte', error);
                        //     }
                        // }
                        // actualizacionCoberturaTelematic(objRecord);
                        break;
                    case _constant.accionImpulso.TM_RENOVACION_ACTIVACION:
                        aplica = getParameterPlataforma(item, _constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS, _constant.Codigo_Valor.COD_SI);
                        log.debug('aplica-cobertura', `${aplica} - ${objRecord.id}`);
                        if (aplica > 0) {
                            let trama = construirTrama(objRecord, accionImpulso);
                            log.debug('request', trama);
                            if (Object.keys(trama).length > 0) {
                                let responsetmRenovacionActivacion = JSON.parse(tmRenovacionActivacion(trama));
                                responsetmRenovacionActivacion.results[0].body = JSON.parse(responsetmRenovacionActivacion.results[0].body);
                                log.debug('response', responsetmRenovacionActivacion);
                                let requestFile = saveJson(trama, `request${objRecord.id}`, folderRequest);
                                let responseFile = saveJson(responsetmRenovacionActivacion, `response${objRecord.id}`, folderResponse);
                                let objData = {
                                    cobertura: objRecord.id,
                                    requestFile: requestFile,
                                    responseFile: responseFile,
                                    code: responsetmRenovacionActivacion.results[0].code,
                                    impulso: accionImpulso,
                                    plataforma: PLATAFORMA_TELEMATICS
                                }
                                log.debug('objData', objData)
                                createRecordTraza(objData);
                            } else {
                                log.debug("El objeto está vacío.");
                            }
                        }
                        break;
                    default:
                        break;
                }

                updateData.custrecord_ht_co_impulso_plataforma = '';
                if (accionImpulso == _constant.accionImpulso.TM_RENOVACION_ACTIVACION) {
                    updateData.custrecord_ht_co_estado_cobertura = _constant.Status.ACTIVO
                }
                record.submitFields({
                    type: 'customrecord_ht_co_cobertura',
                    id: objRecord.id,
                    values: updateData,
                });
            }
        }

        const actualizacionCoberturaTelematic = (objRecord) => {
            let ordenTrabajoId = obtenerOrdenTrabajo(objRecord.id);
            if (!ordenTrabajoId) return;
            _controller.envioTelecActualizacionCobertura(ordenTrabajoId, objRecord.getValue('custrecord_ht_co_coberturafinal'));
        }

        const obtenerOrdenTrabajo = (coberturaId) => {
            let resultSearch = search.create({
                type: "customrecord_ht_ct_cobertura_transaction",
                filters: [
                    ["custrecord_ht_ct_transacciones", "anyof", coberturaId]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_ht_ct_orden_trabajo", label: "Orden de Trabajo" }),
                    search.createColumn({ name: "created", sort: search.Sort.DESC, label: "Date Created" })
                ]
            }).run().getRange(0, 1000);
            if (!resultSearch.length) return;
            return resultSearch[0].getValue("custrecord_ht_ct_orden_trabajo");
        }

        const pxModificacionDatosDispositivos = (trama) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(trama),
                scriptId: 'customscript_ts_rs_px_mod_datos_dispo',
                deploymentId: 'customdeploy_ts_rs_px_mod_datos_dispo',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            return response;
        }

        const construirTrama = (objRecord, accionImpulso) => {
            let trama = {};
            let NumeroOrden = objRecord.id.toString();
            let CodigoVehiculo = objRecord.getValue('custrecord_ht_co_bien').toString();
            let datoTecnico = objRecord.getValue('custrecord_ht_co_numeroserieproducto');
            let fechaInicial = objRecord.getText('custrecord_ht_co_coberturainicial');
            let fechaFinal = objRecord.getText('custrecord_ht_co_coberturafinal');
            let estadoCobertura = objRecord.getValue('custrecord_ht_co_estado_cobertura');

            let dataBien = getDataBien(CodigoVehiculo);
            let IdMarca = dataBien.IdMarca;
            let DescMarca = dataBien.DescMarca;
            let IdModelo = dataBien.IdModelo;
            let DescModelo = dataBien.DescModelo;
            let IDTelematics = dataBien.IDTelematics
            let name = dataBien.name
            let placa = dataBien.placa
            let estadovehiculo = dataBien.estado

            let dataDatoTecnico = getDataDatoTecnico(datoTecnico);
            //log.debug('dataDatoTecnico', dataDatoTecnico)
            let vid = dataDatoTecnico.Vid;
            let CodMarcaDispositivo = dataDatoTecnico.CodMarcaDispositivo;
            let MarcaDispositivo = dataDatoTecnico.MarcaDispositivo;
            let CodModeloDispositivo = dataDatoTecnico.CodModeloDispositivo;
            let ModeloDispositivo = dataDatoTecnico.ModeloDispositivo;
            let Sn = dataDatoTecnico.Sn;
            let Imei = dataDatoTecnico.Imei;
            let NumeroCamaras = dataDatoTecnico.NumeroCamaras;
            let DireccionMac = dataDatoTecnico.DireccionMac;
            let Icc = dataDatoTecnico.Icc;
            let NumeroCelular = dataDatoTecnico.NumeroCelular;
            let Operadora = dataDatoTecnico.Operadora;

            if (accionImpulso == _constant.accionImpulso.PX_MODIFICACION_DATOS_DISPOSITIVOS) {
                let EstadoSim = 'A'

                let fechafinalante = fechaFinal;

                fechaInicial = formatDate(fechaInicial);
                fechaFinal = formatDate(fechaFinal);
                let { year, month, day } = obtenerValoresFechaHoy();
                trama = {
                    "StrToken": `SH2PX${year}${month}${day}`,
                    "UserName": "PxPrTest",
                    "Password": "PX12%09#w",
                    "UsuarioIngreso": "PRUEBAEVOL",
                    "NumeroOrden": NumeroOrden,
                    "FechaInicioCobertura": fechaInicial,
                    "FechaFinCobertura": fechaFinal,
                    "OperacionOrden": "005",
                    "CodigoVehiculo": CodigoVehiculo,
                    "IdMarca": IdMarca,
                    "DescMarca": DescMarca,
                    "IdModelo": IdModelo,
                    "DescModelo": DescModelo,
                    "Vid": vid,
                    "CodMarcaDispositivo": CodMarcaDispositivo,
                    "MarcaDispositivo": MarcaDispositivo,
                    "CodModeloDispositivo": CodModeloDispositivo,
                    "ModeloDispositivo": ModeloDispositivo,
                    "Sn": Sn,
                    "Imei": Imei,
                    "NumeroCamaras": NumeroCamaras,
                    "DireccionMac": DireccionMac,
                    "Icc": Icc,
                    "NumeroCelular": NumeroCelular,
                    "Operadora": Operadora,
                    "EstadoSim": "ACT",
                    "OperacionDispositivo": EstadoSim,
                    "asset": IDTelematics
                }

                if (IDTelematics) {

                    log.debug("---fechaFinal----", fechafinalante)


                    fechaFinal = formatDateUTC5Timezone(fechafinalante);
                    trama.name = placa;
                    trama.product_expire_date = fechaFinal
                    trama.active = estadoCobertura == 1 ? true : false
                }
            }

            if (accionImpulso == _constant.accionImpulso.TM_RENOVACION_ACTIVACION) {


                fechaFinal = formatDateUTC5Timezone(fechaFinal);
                if (IDTelematics) {
                    trama.asset = IDTelematics;
                    trama.name = placa;
                    trama.product_expire_date = fechaFinal
                    trama.active = true
                } else {
                    log.debug('idtelematics', 'No tiene un ID TELEMATICS');
                }
            }
            return trama;
        }

        const getDataBien = (id) => {
            let objData = {}
            let objSearch = search.create({
                type: _constant.customRecord.BIENES,
                filters:
                    [
                        ["internalid", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_marca_descripcion", join: "CUSTRECORD_HT_BIEN_MARCA", label: "Descripcion" }),
                        search.createColumn({ name: "custrecord_ht_marca_codigo", join: "CUSTRECORD_HT_BIEN_MARCA", label: "Codigo" }),
                        search.createColumn({ name: "custrecord_ht_mod_descripcion", join: "CUSTRECORD_HT_BIEN_MODELO", label: "Descripcion" }),
                        search.createColumn({ name: "custrecord_ht_mod_codigo", join: "CUSTRECORD_HT_BIEN_MODELO", label: "Codigo" }),
                        search.createColumn({ name: "custrecord_ht_bien_id_telematic", label: "ID Telematics" }),
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "custrecord_ht_bien_placa", label: "Placa" }),
                        search.createColumn({ name: "custrecord_ht_bien_marca", label: "MarcaID" }),
                        search.createColumn({ name: "custrecord_ht_bien_modelo", label: "ModeloID" }),
                        search.createColumn({ name: "custrecord_ht_bn_estadobien", label: "Estado" }),
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            //log.debug("customrecord_ht_record_bienesSearchObj result count", searchResultCount);
            objSearch.run().each((result) => {
                //objData.IdMarca = result.getValue({ name: "custrecord_ht_marca_codigo", join: "CUSTRECORD_HT_BIEN_MARCA", label: "Codigo" })
                //GALVAR 17-02-2025

                objData.IdMarca = result.getValue({ name: "custrecord_ht_bien_marca", label: "Codigo" })
                objData.DescMarca = result.getValue({ name: "custrecord_ht_marca_descripcion", join: "CUSTRECORD_HT_BIEN_MARCA", label: "Descripcion" })
                //objData.IdModelo = result.getValue({ name: "custrecord_ht_mod_codigo", join: "CUSTRECORD_HT_BIEN_MODELO", label: "Codigo" })
                //GALVAR 17-02-2025
                objData.IdModelo = result.getValue({ name: "custrecord_ht_bien_modelo", label: "Codigo" })
                objData.DescModelo = result.getValue({ name: "custrecord_ht_mod_descripcion", join: "CUSTRECORD_HT_BIEN_MODELO", label: "Descripcion" })
                objData.IDTelematics = result.getValue({ name: "custrecord_ht_bien_id_telematic", label: "ID Telematics" })
                objData.name = result.getValue({ name: "name", label: "Name" })
                objData.placa = result.getValue({ name: "custrecord_ht_bien_placa", label: "Placa" })
                //GALVAR
                objData.estado = result.getValue({ name: "custrecord_ht_bn_estadobien" }) ? result.getText({ name: "custrecord_ht_bn_estadobien" }) : ""
            });
            return objData;
        }

        const getDataDatoTecnico = (id) => {
            let objData = {}
            let objSearch = search.create({
                type: "customrecord_ht_record_mantchaser",
                filters:
                    [
                        ["internalid", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_mc_vid", label: "Vid" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispositivo_codigo", join: "CUSTRECORD_HT_MC_UNIDAD", label: "CodMarcaDispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispositivo_descrip", join: "CUSTRECORD_HT_MC_UNIDAD", label: "MarcaDispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_modelodispositivo_codig", join: "CUSTRECORD_HT_MC_MODELO", label: "CodModeloDispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_modelodispositivo_descr", join: "CUSTRECORD_HT_MC_MODELO", label: "ModeloDispositivo" }),
                        search.createColumn({ name: "custrecord_ht_mc_sn", label: "Sn" }),
                        search.createColumn({ name: "custrecord_ht_mc_imei", label: "Imei" }),
                        search.createColumn({ name: "custrecord_ht_dd_numero_camaras", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVO", label: "NumeroCamaras" }),
                        search.createColumn({ name: "custrecord_ht_mc_macaddress", label: "DireccionMac" }),
                        search.createColumn({ name: "custrecord_ht_mc_icc", label: "Icc" }),
                        search.createColumn({ name: "custrecord_ht_mc_nocelularsim", label: "NumeroCelular" }),

                        search.createColumn({ name: "custrecord_ht_mc_unidad", label: "CodMarca" }),
                        search.createColumn({ name: "custrecord_ht_mc_modelo", label: "CodModelo" }),

                        search.createColumn({ name: "custrecord_ht_cs_operadora_descrip", join: "CUSTRECORD_HT_MC_OPERADORA", label: "Operadora" })
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            //log.debug("customrecord_ht_record_mantchaserSearchObj result count", searchResultCount);
            objSearch.run().each((result) => {
                objData.Vid = result.getValue({ name: "custrecord_ht_mc_vid", label: "Vid" })
                //objData.CodMarcaDispositivo = result.getValue({ name: "custrecord_ht_dd_tipodispositivo_codigo", join: "CUSTRECORD_HT_MC_UNIDAD", label: "CodMarcaDispositivo" })
                //GALVAR 17-02-2025
                objData.CodMarcaDispositivo = result.getValue({ name: "custrecord_ht_mc_unidad", label: "Codigo" })
                objData.MarcaDispositivo = result.getValue({ name: "custrecord_ht_dd_tipodispositivo_descrip", join: "CUSTRECORD_HT_MC_UNIDAD", label: "MarcaDispositivo" })
                //objData.CodModeloDispositivo = result.getValue({ name: "custrecord_ht_dd_modelodispositivo_codig", join: "CUSTRECORD_HT_MC_MODELO", label: "CodModeloDispositivo" })
                //GALVAR 17-02-2025
                objData.CodModeloDispositivo = result.getValue({ name: "custrecord_ht_mc_modelo", label: "CodModeloDispositivo" })
                objData.ModeloDispositivo = result.getValue({ name: "custrecord_ht_dd_modelodispositivo_descr", join: "CUSTRECORD_HT_MC_MODELO", label: "ModeloDispositivo" })
                objData.Sn = result.getValue({ name: "custrecord_ht_mc_sn", label: "Sn" })
                objData.Imei = result.getValue({ name: "custrecord_ht_mc_imei", label: "Imei" })
                objData.NumeroCamaras = result.getValue({ name: "custrecord_ht_dd_numero_camaras", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVO", label: "NumeroCamaras" })
                objData.DireccionMac = result.getValue({ name: "custrecord_ht_mc_macaddress", label: "DireccionMac" })
                objData.Icc = result.getValue({ name: "custrecord_ht_mc_icc", label: "Icc" })
                objData.NumeroCelular = result.getValue({ name: "custrecord_ht_mc_nocelularsim", label: "NumeroCelular" })
                objData.Operadora = result.getValue({ name: "custrecord_ht_cs_operadora_descrip", join: "CUSTRECORD_HT_MC_OPERADORA", label: "Operadora" })
            });
            return objData;
        }

        const formatDate = (fecha) => {
            const partes = fecha.split("/");
            const dia = partes[0];
            const mes = partes[1];
            const año = partes[2];
            const fechaFormateada = `${año}-${mes}-${dia}`;
            return fechaFormateada;
        }

        const formatDateUTC5Timezone = (fecha) => {

            log.debug("fecha", fecha)

            const partes = fecha.split("/");

            const dia = partes[0];
            const mes = partes[1];
            const año = partes[2];
            let offsetString = `-05:00`;
            const fechaFormateada = `${año}-${mes}-${dia}T05:00:00${offsetString}`;
            log.debug("fechaFormateada---", fechaFormateada)
            return fechaFormateada;
        }

        const getParameterPlataforma = (item, parametro, valor) => {
            let sql = "SELECT pp.count(*) as aplica FROM customrecord_ht_pp_main_param_prod pp " +
                "INNER JOIN customrecord_ht_cr_parametrizacion_produ pa ON pp.custrecord_ht_pp_parametrizacion_rela = pa.id " +
                "INNER JOIN customrecord_ht_cr_pp_valores va ON pp.custrecord_ht_pp_parametrizacion_valor = va.id " +
                "WHERE custrecord_ht_pp_aplicacion = 'T' " +
                "AND pp.custrecord_ht_pp_parametrizacionid = ? " +
                "AND pa.custrecord_ht_pp_code = ? " +
                "AND va.custrecord_ht_pp_codigo = ?"
            let params = [item, parametro, valor];
            let results = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
            return results[0].aplica
        }

        const tmRenovacionActivacion = (trama) => {

            try {
                log.debug("trama--", trama)

                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(trama),
                    scriptId: 'customscript_ts_rs_tm_renovacion_activa',
                    deploymentId: 'customdeploy_ts_rs_tm_renovacion_activa',
                    headers: myRestletHeaders,
                });
                let response = myRestletResponse.body;
                return response;

            } catch (error) {

                log.debug("error", { error: error.message, stack: error.stack })

            }

        }

        const saveJson = (contents, nombre, folder) => {
            let date = new Date();
            let tdate = date.getDate();
            tdate = Number(tdate) < 10 ? `0${tdate}` : tdate;
            let month = date.getMonth() + 1;
            month = Number(month) < 10 ? `0${month}` : month;
            let year = date.getFullYear();
            fecha = `${tdate}${month}${year}`;

            let fileObj = file.create({
                name: `${nombre}_${fecha}.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: folder,
                isOnline: false
            });
            return fileObj.save();
        }

        const createRecordTraza = (objData) => {
            let objRecord = record.create({ type: 'customrecord_ht_ct_traza_impulso_platafo', isDynamic: true });
            objRecord.setValue({ fieldId: 'custrecord_ht_ip_cobertura', value: objData.cobertura });
            objRecord.setValue({ fieldId: 'custrecord_ht_ip_impulso', value: objData.impulso });
            objRecord.setValue({ fieldId: 'custrecord_ht_ip_plataforma', value: objData.plataforma });
            objRecord.setValue({ fieldId: 'custrecord_ht_ip_estado', value: 'enviado' });
            objRecord.setValue({ fieldId: 'custrecord_ht_ip_respuesta', value: objData.code });
            objRecord.setValue({ fieldId: 'custrecord_ht_ip_trama_envio', value: objData.requestFile });
            objRecord.setValue({ fieldId: 'custrecord_ht_ip_trama_respuesta', value: objData.responseFile });
            let saveRecord = objRecord.save();
            log.debug('recordTraza', saveRecord)
        }

        const obtenerValoresFechaHoy = () => {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            month = month < 10 ? `0${month}` : month;
            day = day < 10 ? `0${day}` : day;
            return { year, month, day };
        }

        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        }

    });