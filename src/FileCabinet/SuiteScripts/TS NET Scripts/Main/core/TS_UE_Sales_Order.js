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
    'N/query',
    'N/error',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
    '../routes/TS_ROUTER_Sales_Order',
    'N/format'
], (log, record, search, serverWidget, plugin, transaction, https, runtime, email, query, err, _controller, _constant, _errorMessage, _router, format) => {
    const beforeLoad = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            try {
                let currentRecord = scriptContext.newRecord;
                const idRecord = currentRecord.id;
                const form = scriptContext.form;
                let objRecord = currentRecord;
                let editServiceOrder = form.getButton('edit');
                if (objRecord.getValue('custbodycustbody_ht_os_created_from_sa') == true) editServiceOrder.isDisabled = true;
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
            } catch (error) {
                log.error('Error-beforeLoad', error)
            }

        }
    }

    const beforeSubmit = (scriptContext) => {
        const form = scriptContext.form;
        const objRecord = scriptContext.newRecord;
        let UserId = runtime.getCurrentUser();
        let usuario_id = UserId.id;
        /***
         * Validacion para la Reinstalacion de Custodia (campo custcol_ts_dispositivo_en_custodia)
         */
        let getDispositivoEnCustodia = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia', line: 0 });

        if (getDispositivoEnCustodia) {
            let salesorderSearchObj = search.create({
                type: "salesorder",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["custcol_ts_dispositivo_en_custodia", "is", getDispositivoEnCustodia],
                        "AND",
                        ["custcol_ts_dispositivo_en_custodia", "isnotempty", ""]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custcol_ts_dispositivo_en_custodia", label: "Dispositivo en Custodia" }),
                        search.createColumn({ name: "tranid", label: "Número de documento" })
                    ]
            });
            salesorderSearchObj.run().each(function (result) {
                throw 'El Dispositivo en Custodia ' + getDispositivoEnCustodia + ' ya se encuentra en la Orden de Servicio ' + result.getValue({ name: 'tranid' });
            });
        }
        try {
            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY) {
                let vehiculo = objRecord.getValue('custbody_ht_so_bien');
                let cambio_propie_convenio = objRecord.getValue('custbody_es_cambio_de_propietario');
                let convenio = '';
                let estado_convenio = '';
                let cod_convenio = '';
                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                var T_VBI = false;
                let nombre_error = '';
                let mensaje_error = '';

                var fam_product = [];
                if (vehiculo != '') {
                    fam_product = getFamiliaCoberturaItem(vehiculo);
                }

                if (cambio_propie_convenio && vehiculo != '') {
                    let busqueda_bien = obtenerConvenio(vehiculo);
                    convenio = busqueda_bien[0];
                    estado_convenio = busqueda_bien[1];
                    cod_convenio = busqueda_bien[2];
                    log.error('busqueda_bien', busqueda_bien);
                    if (convenio == '') {
                        nombre_error = 'ERROR_BIEN_SIN_CONVENIO';
                        mensaje_error = 'El Bien no tiene un Convenio';
                    } else if (estado_convenio != '1') {
                        nombre_error = 'ERROR_ESTADO_BIEN_NO_ACTIVO';
                        mensaje_error = 'Estado del Convenio del Bien no esta Activo';
                    }
                }

                if (nombre_error == '') {
                    var arrayItem = [];
                    for (let i = 0; i < numLines; i++) {
                        var T_CPR = false;
                        var T_RFU = false;
                        var T_FAM = '';

                        let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        arrayItem.push(items);

                        if (cambio_propie_convenio && convenio != '') {
                            let obn_item = obtenerItem(items);
                            log.error('obn_item', obn_item);
                            if (obn_item["custitem_ht_it_convenio.custrecord_ht_cn_codigo"] != cod_convenio) {
                                nombre_error = 'ERROR_CONVENIO_ARTICULO_DIFERENTE_BIEN';
                                mensaje_error = 'El convenio del Articulo es diferente al del Bien';
                            }
                        }

                        let parametrosRespo = _controller.parametrizacion(items);

                        for (let j = 0; j < parametrosRespo.length; j++) {
                            //T_VBI para validar el Bien
                            if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_ADP_ACCION_DEL_PRODUCTO && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_VALOR_010_CAMBIO_DE_PROPIETARIO && numLines != 1) {
                                nombre_error = 'ERROR_CAMBIO_PROPIETARIO_VARIOS_ARTICULOS';
                                mensaje_error = 'No se puede tener un Artículo tipo Cambio de Propietario junto a otro Artículo';
                            }
                            if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_VBI_VALIDACION_DE_BIEN_INGRESADO && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_SI) {
                                T_VBI = true;
                            }
                            if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_SI) {
                                T_CPR = true;
                            }
                            if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_RFU_REVISIÓN_DE_FAMILIA_UPGRADE && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_SI) {
                                T_RFU = true;
                            }
                            if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS) {
                                T_FAM = getParamValor(parametrosRespo[j][1]);
                            }
                            if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_PXB_ITEM_SOLICITA_CLIENTE_NUEVO && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_SI) {
                                //cambio de Propietario
                                var item = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                                var item_cliente = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: i });
                                if (!item_cliente) {
                                    nombre_error = 'ERROR_CAMBIO_PROPIETARIO';
                                    mensaje_error = 'No existe un Cliente para el item ' + item + '.'
                                }
                            }

                            if (T_CPR == true && T_RFU == true) {
                                for (let index = 0; index < fam_product.length; index++) {
                                    if (fam_product[index] == T_FAM) {
                                        nombre_error = 'ERROR_FAMILIA_ITEM';
                                        mensaje_error = 'Ya existe una Cobertura con la misma Familia de Producto que un Item';
                                        /*
                                        var myFamiliaError = err.create({
                                            name: 'ERROR_FAMILIA_ITEM',
                                            message: 'Ya existe una Cobertura con la misma Familia de Producto que un Item',
                                            notifyOff: false
                                        });
                                        throw myFamiliaError;
                                        */
                                    }
                                }
                            }
                        }
                    }

                    arrayItem = [...new Set(arrayItem)];
                    if (numLines != arrayItem.length) {
                        nombre_error = 'ERROR_ARTICULO_REPETIDO';
                        mensaje_error = 'Existen artículos repetidos en la lista';
                    }
                }

                if (T_VBI == true && vehiculo == '') {
                    nombre_error = 'ERROR_BIEN_VACIO';
                    mensaje_error = 'No se ha ingresado un bien.';
                }

                if (nombre_error != '') {
                    var myBienError = err.create({
                        name: nombre_error,
                        message: mensaje_error,
                        notifyOff: false
                    });
                    throw myBienError;
                }
            }
        } catch (error) {
            log.error('Error beforeSubmit', error);
            /*
            if(error.name == 'ERROR_FAMILIA_ITEM'){
                var myFamiliaError = err.create({
                    name: 'ERROR_FAMILIA_ITEM',
                    message: 'Ya existe una Cobertura con la misma Familia de Producto que un Item',
                    notifyOff: false
                });
                log.error('Error: ' + myFamiliaError.name, myFamiliaError.message);
                throw myFamiliaError.message;
            }
            */
            if (error.name != '') {
                if (error.name == 'ERROR_CAMBIO_PROPIETARIO' || error.name == 'ERROR_FAMILIA_ITEM' ||
                    error.name == 'ERROR_BIEN_VACIO' || error.name == 'ERROR_ARTICULO_REPETIDO' ||
                    error.name == 'ERROR_CAMBIO_PROPIETARIO_VARIOS_ARTICULOS' || error.name == 'ERROR_BIEN_SIN_CONVENIO' ||
                    error.name == 'ERROR_ESTADO_BIEN_NO_ACTIVO' || error.name == 'ERROR_CONVENIO_ARTICULO_DIFERENTE_BIEN') {
                    var myError = err.create({
                        name: error.name,
                        message: error.message,
                        notifyOff: false
                    });
                    log.error('Error: ' + myError.name, myError.message);
                    throw myError.message;
                }
            }
        }
    }

    const afterSubmit = (scriptContext) => {
        const form = scriptContext.form;

        if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY) {
            try {
                const currentRecord = scriptContext.newRecord;
                let idRecord = currentRecord.id;
                let senderId = runtime.getCurrentUser();
                senderId = senderId.id;

                /***** */
                var recordLoad = record.load({ type: currentRecord.type, id: idRecord, isDynamic: true });
                let formulario = recordLoad.getValue('customform');
                // log.error('formulario', formulario)
                const newSerie = getSerie(formulario);
                log.error('NUEVO CORRELATIVO', newSerie);

                recordLoad.setValue({ fieldId: 'tranid', value: newSerie, ignoreFieldChange: true });
                recordLoad.setValue({ fieldId: 'custbody_ec_flag_correlativo_os', value: newSerie, ignoreFieldChange: true }); 
                recordLoad.save({ ignoreMandatoryFields: true, enableSourcing: false });


                // Cargar de nuevo y verificar el tranid




                /*
                                let attempts = 0;
                let maxAttempts = 3;
                let finalOrdenServicio;
                
                do {
                    try {
                        let objRecord2 = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
                        finalOrdenServicio = objRecord2.getValue('tranid');
                
                        log.error('Intento:', attempts + 1, 'Valor actual de tranid:', finalOrdenServicio);
                
                        if (finalOrdenServicio !== newSerie) {
                            log.error('El correlativo no coincide, se intentará guardar de nuevo.');
                
                            // Reasignar el correlativo y volver a guardar
                            objRecord2.setValue({ fieldId: 'tranid', value: newSerie });
                            let newSaveAttempt = objRecord2.save({ ignoreMandatoryFields: false, enableSourcing: true });
                            log.error('Resultado del guardado:', newSaveAttempt);
                
                            // Verificar el valor de tranid después del guardado
                            let updatedRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
                            let updatedTranid = updatedRecord.getValue('tranid');
                            log.error("tranid después del guardado:", updatedTranid);
                
                            attempts++;
                        }
                    } catch (error) {
                        log.error('Error al guardar el registro:', error);
                        if (error.message.includes('locked')) {
                            log.error('El registro está bloqueado, se intentará de nuevo después de un breve retraso.');
                
                            let waitTime = 5000; 
                            let start = new Date().getTime();
                            while (new Date().getTime() < start + waitTime) {
                                // Esperar
                            }
                        } else {
                            throw error;
                        }
                    }
                } while (finalOrdenServicio !== newSerie && attempts < maxAttempts);
                
                if (finalOrdenServicio !== newSerie) {
                    throw new Error('El correlativo sigue sin coincidir después de múltiples intentos.');
                }*/

                let objRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
                let customer = objRecord.getValue('entity');
                let vehiculo = objRecord.getValue('custbody_ht_so_bien');
                let isGenerico = validateGenerico(vehiculo);
                let ordenServicio = objRecord.getValue('tranid');
                log.error('CORRELATIVO', ordenServicio);

                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                let aprobacionventa = objRecord.getValue('custbody_ht_os_aprobacionventa');
                let aprobacioncartera = objRecord.getValue('custbody_ht_os_aprobacioncartera');
                log.error('statusref', objRecord.getValue('statusRef'));
                log.error('aprobacionventa', aprobacionventa)
                log.error('aprobacioncartera', aprobacioncartera)
                let parametro = 0, parametro_aprob = 0, parametro_fact = 0, workOrder = 0, idWorkOrder = 0, adp = 0, fam = 0, plazo = 0, valor_tipo_agrupacion = 0, paramChequeo = 0, coberturaRecord = 0,
                    generaOrdenTrabajo = 0, esGarantia = 0, esUpgrade = _constant.Valor.NO, ccd = 0, dispositivoEnCustodia = "", itemCustodia = {}, ttr = 0, renovamos = false,
                    plataformas = false, arrayRecipientsOriginal = new Array(), arrayRecipients = new Array(), esAlquiler = 0, definicionServicios = false, paralizador = false,
                    botonPanico = false, tag = 0, t_PPS = false, variasOT = new Array(), idItem = '', unidadTiempo;
                log.error('objRecord', objRecord)
                log.error('numLines', numLines)
                for (let i = 0; i < numLines; i++) {
                    objRecord.selectLine({ sublistId: 'item', line: i });
                    let cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura' });
                    unidadTiempo = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura' });
                    let inventoryNumber = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia' });
                    let items = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                    log.debug('ITEM', items);
                    let itemDescription = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    if (!paralizador)
                        paralizador = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_paralizador' });
                    if (!botonPanico)
                        botonPanico = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_boton_panico' });
                    let parametrosRespo = _controller.parametrizacion(items);
                    //log.debug('parametrosRespo', parametrosRespo)
                    let descriptionItem = getDescription(customer, items);
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
                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                            parametro = parametrosRespo[j][1];
                            adp = parametrosRespo[j][1]
                            log.debug('ADP', adp);
                        }

                        //*CAMBIO TAG A FAM */
                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO)
                            tag = parametrosRespo[j][1];

                        if (parametrosRespo[j][0] == _constant.Parameter.APR_SOLICITA_APROBACIÓN)
                            parametro_aprob = parametrosRespo[j][1];

                        if (parametrosRespo[j][0] == _constant.Parameter.GOF_GENERA_SOLICITUD_DE_FACTURACION)
                            parametro_fact = parametrosRespo[j][1];

                        if (parametrosRespo[j][1] == _constant.Valor.VALOR_004_RENOVACION_DE_DISP) {
                            renovamos = true;
                            plazo += cantidad;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                            fam = parametrosRespo[j][1]
                            valor_tipo_agrupacion = fam;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametrosRespo[j][1] == _constant.Valor.SI)
                            plataformas = true;

                        if (parametrosRespo[j][0] == _constant.Parameter.TTR_TIPO_TRANSACCION)
                            ttr = parametrosRespo[j][1]

                        if (parametrosRespo[j][0] == _constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO && parametrosRespo[j][1] == _constant.Valor.SI && !isGenerico) {
                            workOrder = _controller.parametros(_constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO, json);
                            //variasOT.push(workOrder);
                            log.debug('workOrder', workOrder);
                            idWorkOrder = workOrder;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.VOT_VARIAS_ORDENES_DE_TRABAJO && parametrosRespo[j][1] == _constant.Valor.SI && !isGenerico) {
                            workOrder = _controller.parametros(_constant.Parameter.VOT_VARIAS_ORDENES_DE_TRABAJO, json);
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.TCH_TIPO_CHEQUEO_OT)
                            paramChequeo = parametrosRespo[j][1];

                        if (parametrosRespo[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS) {
                            ccd = parametrosRespo[j][1];
                            itemCustodia.inventoryNumber = inventoryNumber;
                            itemCustodia.item = items;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA && parametrosRespo[j][1] == _constant.Valor.SI)
                            esGarantia = 1;

                        if (parametrosRespo[j][0] == _constant.Parameter.CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][1] == _constant.Valor.SI)
                            esUpgrade = _constant.Valor.SI;

                        if (parametrosRespo[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER && parametrosRespo[j][1] == _constant.Valor.SI)
                            esAlquiler = _constant.Valor.SI;

                        if (parametrosRespo[j][0] == _constant.Parameter.DSR_DEFINICION_DE_SERVICIOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                            definicionServicios = true;
                            idItem = items
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.PPS_PEDIR_PERIODO_DE_SERVICIO && parametrosRespo[j][1] == _constant.Valor.SI) {
                            t_PPS = true;
                        }
                    }

                    let newAdjust = record.create({ type: 'customrecord_ht_osr_ordenes_serv_rela', isDynamic: true });
                    newAdjust.setValue({ fieldId: 'custrecord_ht_osr_campo_relacion', value: vehiculo });
                    newAdjust.setValue({ fieldId: 'custrecord_ht_osr_orden_servicio', value: idRecord });
                    newAdjust.setValue({ fieldId: 'custrecord_ht_osr_articulo_ori', value: items });
                    newAdjust.setValue({ fieldId: 'custrecord_ht_osr_descripcion_origen', value: itemDescription });
                    newAdjust.save();
                }

                //*BLOQUE CHEQUEO, DESINSTALACIÓN: Identificar instalación para asociar a la ot
                if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO || adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP || adp == _constant.Valor.VALOR_007_CHEQUEO_DE_COMPONENTES) {
                    let out = 0;
                    let busqueda_cobertura = new Array();
                    let bien = objRecord.getValue('custbody_ht_so_bien');
                    if (workOrder != 0) {
                        let field = 0;
                        //TODO: REVISAR CARGA DE DATOS TECNICOS
                        if (/*esUpgrade == _constant.Valor.NO &&*/ bien != '' /**&& esAlquiler == 0*/) {
                            log.debug('Entry-Edit-OT', 'Update Orden Trabajo');
                            // if (esGarantia) {
                            //     workOrder = variasOT[0];
                            // }
                            field = _controller.getFieldsCobertura(bien, fam);
                            log.debug('Field', field);

                            //inicio Cambio JCEC 24/08/2024
                            //Logica para traer la serie en caso de Flujo de Accesorio

                            //1° Buscar la familia del articulo de la orden de servicio de desinstalación
                            let serieAccesorio;
                            let ArticuloOS = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: 0 });
                            let paramDesinstalacion = getParamFamiliaProductosArticuloOSDesinstalacion(_constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS, ArticuloOS);
                            log.debug('JCEC paramDesinstalacion', paramDesinstalacion);
                            if (paramDesinstalacion.valorTexto == 'AR - HUNTER ARCA' && paramDesinstalacion.aplicacion) {
                                //2° buscar en las ordenes de servicio relacionadas al Bien la familia del articulo
                                let familiaArticuloOS = getFamiliaProductosArticuloOSDesinstalacion(bien);
                                //3° Comparar si la familia del articulo de la orden de servicio de desinstalación es igual a la familia del articulo de la orden de servicio relacionada al bien
                                for (let i = 0; i < familiaArticuloOS.length; i++) {
                                    //buscamos la familia del articulo de la orden de servicio relacionada al bien
                                    let paramFamilia = getParamFamiliaProductosArticuloOSDesinstalacion(_constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS, familiaArticuloOS[i].articulo);

                                    //comparamos si la familia del articulo de la orden de servicio de desinstalación es igual a la familia del articulo de la orden de servicio relacionada al bien
                                    if (paramDesinstalacion.valor == paramFamilia.valor) {
                                        //si es igual traemos la serie del articulo de la orden de servicio relacionada al bien
                                        serieAccesorio = familiaArticuloOS[i].serieAccesorio;
                                        break;
                                    }
                                }

                                try {

                                    record.submitFields({
                                        type: _constant.customRecord.ORDEN_TRABAJO,
                                        id: idWorkOrder,
                                        values: {
                                            'customform': _constant.Form.OT_HT_ACCESORIOS_ALQUILER,
                                            'custrecord_ot_serie_acc': serieAccesorio
                                        },
                                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                                    });


                                } catch (error) {
                                    log.error('Error Agregar SerieAccesorio', error);
                                }
                                //fin Cambio JCEC 24/08/2024
                            }
                            if (field != 0) {

                                log.debug('Field2', field);
                                record.submitFields({
                                    type: _constant.customRecord.ORDEN_TRABAJO,
                                    id: workOrder,
                                    values: {
                                        'custrecord_ht_ot_serieproductoasignacion': field[0]['custrecord_ht_co_numeroserieproducto'],
                                        'custrecord_ht_ot_ubicacion': field[0]['custrecord_ht_mc_ubicacion'] == null ? '' : field[0]['custrecord_ht_mc_ubicacion'],
                                        'custrecord_ht_ot_dispositivo': field[0]['custrecord_ht_co_numerodispositivo'] == null ? '' : field[0]['custrecord_ht_co_numerodispositivo'],
                                        'custrecord_ht_ot_modelo': field[0]['custrecord_ht_co_modelodispositivo'] == null ? '' : field[0]['custrecord_ht_co_modelodispositivo'],
                                        'custrecord_ht_ot_unidad': field[0]['custrecord_ht_co_unidad'] == null ? '' : field[0]['custrecord_ht_co_unidad'],
                                        'custrecord_ht_ot_firmware': field[0]['custrecord_ht_co_firmware'] == null ? '' : field[0]['custrecord_ht_co_firmware'],
                                        'custrecord_ht_ot_script': field[0]['custrecord_ht_co_script'] == null ? '' : field[0]['custrecord_ht_co_script'],
                                        'custrecord_ht_ot_servidor': field[0]['custrecord_ht_co_servidor'] == null ? '' : field[0]['custrecord_ht_co_servidor'],
                                        'custrecord_ht_ot_simcard': field[0]['custrecord_ht_co_celularsimcard'] == null ? '' : field[0]['custrecord_ht_co_celularsimcard'],
                                        'custrecord_ht_ot_ip': field[0]['custrecord_ht_co_ip'] == null ? '' : field[0]['custrecord_ht_co_ip'],
                                        'custrecord_ht_ot_apn': field[0]['custrecord_ht_co_apn'] == null ? '' : field[0]['custrecord_ht_co_apn'],
                                        'custrecord_ht_ot_imei': field[0]['custrecord_ht_co_imei'] == null ? '' : field[0]['custrecord_ht_co_imei'],
                                        'custrecord_ht_ot_vid': field[0]['custrecord_ht_co_vid'] == null ? '' : field[0]['custrecord_ht_co_vid'],
                                        'custrecord_ht_ot_boxserie': field[0]['custrecord_ht_co_seriedispolojack'] == null ? '' : field[0]['custrecord_ht_co_seriedispolojack'],
                                        'custrecord_ht_ot_codigoactivacion': field[0]['custrecord_ht_co_codigoactivacion'] == null ? '' : field[0]['custrecord_ht_co_codigoactivacion'],
                                        'custrecord_ht_ot_codigorespuesta': field[0]['custrecord_ht_co_codigorespuesta'] == null ? '' : field[0]['custrecord_ht_co_codigorespuesta']
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                            }




                        }

                        // log.debug('esUpgrade', esUpgrade);
                        // if (esUpgrade == _constant.Valor.SI) {
                        //     if (bien != '') {
                        //         busqueda_cobertura = getCoberturaItem(bien);
                        //     }
                        //     if (busqueda_cobertura.length != 0) {
                        //         for (let i = 0; i < busqueda_cobertura.length; i++) {
                        //             let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                        //             if (parametrosRespo != 0) {
                        //                 for (let j = 0; j < parametrosRespo.length; j++) {
                        //                     let rec = record.submitFields({
                        //                         type: 'customrecord_ht_co_cobertura',
                        //                         id: busqueda_cobertura[i][1],
                        //                         values: {
                        //                             'custrecord_ht_co_familia_prod': fam,
                        //                             //'custrecord_ht_co_estado': _constant.Status.CONVERTIDO
                        //                             'custrecord_ht_co_producto_convertido': true
                        //                         },
                        //                         options: { enableSourcing: false, ignoreMandatoryFields: true }
                        //                     });
                        //                     log.debug('esUpgrade-rec', rec);
                        //                     out = 1;
                        //                 }

                        //                 if (out == 1)
                        //                     break;
                        //             }
                        //         }
                        //     }
                        // }

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

                    log.debug('esUpgrade', esUpgrade);
                    let items_inventario = null
                    for (let i = 0; i < numLines; i++) {
                        items_inventario = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        log.debug('items_inventario', items_inventario);
                    }
                    if (esUpgrade == _constant.Valor.SI) {
                        if (bien != '') {
                            busqueda_cobertura = getCoberturaItem(bien);
                        }
                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {
                                let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                if (parametrosRespo != 0) {
                                    for (let j = 0; j < parametrosRespo.length; j++) {
                                        let rec = record.submitFields({
                                            type: 'customrecord_ht_co_cobertura',
                                            id: busqueda_cobertura[i][1],
                                            values: {
                                                'custrecord_ht_co_familia_prod': fam,
                                                'custrecord_ht_co_producto': items_inventario,
                                                'custrecord_ht_co_producto_convertido': true
                                            },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                        log.debug('esUpgrade-rec', rec);
                                        out = 1;
                                    }

                                    log.debug('objParameters', 'Ingresar Historial')
                                    log.debug('objParameters', busqueda_cobertura[i][1])
                                    let coberturaId = busqueda_cobertura[i][1]
                                    let objRecord = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                    objRecord.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: coberturaId });
                                    objRecord.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                    //objRecord.setValue({ fieldId: 'custrecord_ht_ct_orden_trabajo', value: objParameters.ordentrabajoId });
                                    objRecord.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: 9 });
                                    objRecord.save();

                                    if (out == 1)
                                        break;
                                }
                            }
                        }
                    }
                }

                //TODO: Revisar: parámetro ccd nunca ingresa porque está igualando al valor y aquí no debería generar custodia 
                if (ccd == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS) {
                    if (workOrder != 0) {
                        log.debug("CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS", true);
                        let deviceItemResult = search.create({
                            type: "customrecord_ht_record_custodia",
                            filters: [["name", "is", itemCustodia.inventoryNumber]],
                            columns: ["custrecord_ht_ct_nombredispositivo", "custrecord_ht_ct_venta"]
                        }).run().getRange(0, 1);
                        log.debug("deviceItemResult[0]", deviceItemResult.length);
                        let salesItem = deviceItemResult[0].getValue("custrecord_ht_ct_venta");
                        log.debug("salesItem", salesItem);

                        record.submitFields({
                            type: "customrecord_ht_record_ordentrabajo",
                            id: workOrder,
                            values: {
                                "custrecord_ht_ot_item": salesItem,
                                "custrecord_ht_ot_itemrelacionado": itemCustodia.item
                            }
                        });
                    }
                }

                if (definicionServicios) {
                    if (workOrder != 0) {
                        let sql = 'SELECT custitem_ht_it_servicios as servicios FROM item WHERE id = ?';
                        let params = [idItem];
                        let array = new Array();
                        let resultSet = query.runSuiteQL({ query: sql, params: params });
                        let results = resultSet.asMappedResults();
                        log.debug('results', 'results');
                        if (results.length > 0) {
                            let arregloconvertido = results[0]['servicios'].split(",")
                            array = arregloconvertido.map(a => parseInt(a));
                            record.submitFields({
                                type: _constant.customRecord.ORDEN_TRABAJO,
                                id: workOrder,
                                values: {
                                    custrecord_ht_ot_servicios_commands: array,
                                },
                                options: { enablesourcing: true }
                            });
                        }
                    }
                }

                if (esGarantia) {
                    var bien = objRecord.getValue('custbody_ht_so_bien');
                    if (workOrder != 0) {
                        let itemVentaGarantia = new Array();
                        if (bien != '') {
                            //itemVentaGarantia = getCoberturaItem(bien);
                            itemVentaGarantia = _controller.getProductoInstalado(bien, fam);
                        }
                        log.debug("itemVentaGarantia", itemVentaGarantia);
                        if (itemVentaGarantia.toString().length > 0) {
                            let workOrderResult = search.create({
                                type: "customrecord_ht_record_ordentrabajo",
                                filters: [["custrecord_ht_ot_orden_servicio", "anyof", idRecord]],
                                columns: ["internalid"]
                            }).run().getRange(0, 100);
                            log.debug("workOrderResult", workOrderResult.length);
                            if (workOrderResult.length) {
                                for (let i = 0; i < workOrderResult.length; i++) {
                                    let ordenTrabajoId = workOrderResult[i].id;
                                    let otid = record.submitFields({
                                        type: "customrecord_ht_record_ordentrabajo",
                                        id: ordenTrabajoId,
                                        values: { "custrecord_ts_item_venta_garantia": itemVentaGarantia }
                                    });
                                    log.debug("OrdenTrabajoUpdate", `Orden de Trabajo ${otid} actualizada por flujo de garantía`);

                                }
                            }
                        }
                    }
                }



                let finalRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: false });
                let finalOrdenServicio = finalRecord.getValue('tranid');
                log.error('TRANID FINAL', finalOrdenServicio);

                if (finalOrdenServicio !== newSerie) {
                    throw new Error('El correlativo sigue sin coincidir después del guardado.');
                }



            } catch (error) {
                log.error('Error-Create', error);
            }
        }

        if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY) {
            const idRecord = scriptContext.newRecord.id;
            let objRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
            //var objRecord = scriptContext.newRecord;

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
            let esCustodia = 0, esConvenio = 0;
            let custodiaDisp = 0;
            let unidadTiempo;
            let plazo = 0;
            let t_PPS = false;
            let renovamos = false;
            let plataformas = false;

            log.error('statusrefEdit', objRecord.getValue('statusRef'));
            log.error('aprobacionventaEdit', aprobacionventa);
            log.error('aprobacioncarteraEdit', aprobacioncartera);
            try {
                if (aprobacionventa == _constant.Status.APROBADO && aprobacioncartera == _constant.Status.APROBADO) {
                    log.debug('Track1', 'Track1');
                    for (let i = 0; i < numLines; i++) {
                        let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        log.debug('items', items);
                        parametrosRespo = _controller.parametrizacion(items);
                        objRecord.selectLine({ sublistId: 'item', line: i });
                        let cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura' })
                        unidadTiempo = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura' });

                        //log.debug('parametrosRespo', parametrosRespo);
                        if (parametrosRespo != 0) {
                            for (let j = 0; j < parametrosRespo.length; j++) {
                                if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                                    parametro = parametrosRespo[j][1];
                                if (parametrosRespo[j][0] == _constant.Parameter.CPC_HMONITOREO_CAMBIO_PROPETARIO_CON_COBERTURAS)
                                    parametrocambpropcobertura = parametrosRespo[j][1];
                                //*CAMBIO TAG A FAM */
                                // if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO)
                                //     valor_tipo_agrupacion = parametrosRespo[j][1];
                                if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS)
                                    valor_tipo_agrupacion = parametrosRespo[j][1];
                                if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO)
                                    adp = parametrosRespo[j][1]
                                if (parametrosRespo[j][0] == _constant.Parameter.TTR_TIPO_TRANSACCION)
                                    ttr = parametrosRespo[j][1]
                                if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS)
                                    fam = parametrosRespo[j][1]
                                if (parametrosRespo[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS)
                                    ccd = parametrosRespo[j][1]
                                if (parametrosRespo[j][0] == _constant.Parameter.CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][1] == _constant.Valor.SI)
                                    esUpgrade = _constant.Valor.SI;
                                if (parametrosRespo[j][0] == _constant.Parameter.TCH_TIPO_CHEQUEO_OT)
                                    paramChequeo = parametrosRespo[j][1];
                                if (parametrosRespo[j][0] == _constant.Parameter.PHV_PRODUCTO_HABILITADO_PARA_LA_VENTA && parametrosRespo[j][1] == _constant.Valor.VALOR_X_USO_CONVENIOS)
                                    esConvenio == 2
                                if (parametrosRespo[j][1] == _constant.Valor.VALOR_004_RENOVACION_DE_DISP) {
                                    renovamos = true;
                                    plazo += cantidad;
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.PPS_PEDIR_PERIODO_DE_SERVICIO && parametrosRespo[j][1] == _constant.Valor.SI)
                                    t_PPS = true;
                                if (parametrosRespo[j][0] == _constant.Parameter.CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametrosRespo[j][1] == _constant.Valor.SI)
                                    plataformas = true;
                            }
                        }
                        log.debug('monitoreo', objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i }));
                        htClient = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: i });
                        monitoreo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i }).length > 0 ? objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i }) : '';
                        bien = objRecord.getValue('custbody_ht_so_bien');
                        custodiaDisp = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia', line: i });
                    }

                    log.debug('Track2', 'Track2');
                    if (ccd == _constant.Valor.SI || ttr == _constant.Valor.VALOR_CAMB_GPS_TDE_DEALER_MOV_CUSTODIA) {
                        esCustodia = 1
                    }

                    log.debug('Track3', 'Track3');
                    if (parametro != 0 && esCustodia == 0 && adp == _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO) {
                        log.debug('entra plataformas por cambio de propietario');
                        log.debug('parametrosRespo.length', parametrosRespo);
                        for (let j = 0; j < parametrosRespo.length; j++) {
                            if (parametrosRespo[j][0] == _constant.Parameter.PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC && parametrosRespo[j][1] == _constant.Valor.SI) {
                                returEjerepo = _controller.parametros(_constant.Parameter.PARAM_CPT_CONFIGURA_PLATAFORMA_TELEMATIC, idRecord, parametro);
                            }
                        }
                        if (returEjerepo == false) {
                            let idCoberturaItem;
                            let responsePlataformasPX;
                            let responsePlataformasTM;
                            let busqueda_cobertura = [];
                            if (bien != '') {
                                busqueda_cobertura = getCoberturaItem(bien);
                            }
                            if (busqueda_cobertura != 0) {
                                for (let i = 0; i < busqueda_cobertura.length; i++) {
                                    let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                    if (parametrosRespo != 0) {
                                        var accion_producto_2 = 0;
                                        var valor_tipo_agrupacion_2 = 0;
                                        for (let j = 0; j < parametrosRespo.length; j++) {
                                            if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                                valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                            }
                                            if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {//TODO: Para cambio de propietario de bien debe cambiar a todos los productos instalados.
                                                idCoberturaItem = busqueda_cobertura[i][1];
                                            }

                                            //TODO: SOLO PARAPRUEBAS CAMBIO PROPIETARIO, LUEGO ACTIVAR
                                            log.debug('idCoberturaItem', idCoberturaItem);
                                            try {
                                                record.submitFields({
                                                    type: 'customrecord_ht_co_cobertura',
                                                    id: busqueda_cobertura[i][1],
                                                    values: {
                                                        'custrecord_ht_co_clientemonitoreo': monitoreo,
                                                        'custrecord_ht_co_propietario': htClient
                                                    },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                            } catch (error) { };

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
                                log.debug('responsePlataformasPX', responsePlataformasPX);
                                log.debug('responsePlataformasTM', responsePlataformasTM);
                                // try {
                                //     if (esConvenio) {
                                //         record.submitFields({
                                //             type: 'customrecord_ht_co_cobertura',
                                //             id: idCoberturaItem,
                                //             values: {
                                //                 'custrecord_ht_co_clientemonitoreo': monitoreo,
                                //                 'custrecord_ht_co_propietario': htClient
                                //             },
                                //             options: { enableSourcing: false, ignoreMandatoryFields: true }
                                //         });
                                //     }
                                // } catch (error) {

                                // }
                            }
                            //TODO: SOLO PARAPRUEBAS CAMBIO PROPIETARIO, LUEGO ACTIVAR
                            if (bien != '') {
                                record.submitFields({
                                    type: 'customrecord_ht_record_bienes',
                                    id: bien,
                                    values: {
                                        'custrecord_ht_bien_propietario': htClient,
                                        'custrecord_ht_bien_estadoconvenio': _constant.Status.ESTADO_CONVENIO_INACTIVO,
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                record.submitFields({ type: 'salesorder', id: idRecord, values: { 'custbody_ht_os_aprobacionventa': _constant.Status.APROBADO, 'orderstatus': 'B' }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                            }
                            transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                        }
                    }

                    //log.debug('parametrosRespo[j][0]', parametrosRespo)
                    log.debug('esConvenio', esConvenio)

                    if (adp == _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO) {
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
                        } else if (esConvenio == 2) {
                            log.debug('esConvenio', 'LOGICA PARA CAMBIO DE PROPIETARIO POR CONVENIO')
                            //TODO: LOGICA PARA CAMBIO DE PROPIETARIO POR CONVENIO


                        }
                        try {
                            transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                        } catch (error) { }
                    }

                    //**BLOQUE DE RENOVACIÓN */
                    log.debug('objRecord.getValue(custbody_ht_so_renovacion_aplicada)', objRecord.getValue('custbody_ht_so_renovacion_aplicada'))
                    log.debug('renovamos', renovamos)
                    if (renovamos == true && objRecord.getValue('custbody_ht_so_renovacion_aplicada') == false) {
                        let hayRenovacion = 1;
                        const fechaActual = new Date();
                        const resultados = {};
                        let sql = "SELECT tl.item as item, tl.custcol_ht_os_tiempo_cobertura as tiempo, tl.custcol_ht_os_und_tiempo_cobertura as unidad " +
                            "FROM TransactionLine tl " +
                            "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacionid = tl.item " +
                            "WHERE tl.itemtype = 'Service' " +
                            "AND tl.transaction = ? " +
                            "AND pa.custrecord_ht_pp_parametrizacion_valor = ?"
                        let params = [idRecord, _constant.Valor.VALOR_004_RENOVACION_DE_DISP];
                        let results = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
                        log.debug('results.runSuiteQL', results);
                        for (let j = 0; j < results.length; j++) {
                            let sql1 = "SELECT va.custrecord_ht_pp_codigo as codigofamilia " +
                                "FROM  customrecord_ht_cr_pp_valores va " +
                                "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacion_valor= va.id " +
                                "INNER JOIN customrecord_ht_cr_parametrizacion_produ pp ON pa.custrecord_ht_pp_parametrizacion_rela= pp.id " +
                                "WHERE pa.custrecord_ht_pp_parametrizacionid = ? " +
                                "AND pp.custrecord_ht_pp_code = ?"
                            let params1 = [results[j].item, 'FAM'];
                            let results1 = query.runSuiteQL({ query: sql1, params: params1 }).asMappedResults();
                            results[j].familia = results1[0].codigofamilia
                        }
                        log.debug('results.runSuiteQL.Before.Group', results);
                        for (let i = 0; i < results.length; i++) {
                            const { item, tiempo, unidad, familia } = results[i];
                            if (!resultados[familia]) {
                                resultados[familia] = {
                                    item: item,
                                    tiempo: 0,
                                    unidad: unidad
                                };
                            }
                            resultados[familia].tiempo += parseInt(tiempo);
                        }
                        results = Object.values(resultados);
                        log.debug('results.runSuiteQL.After.Group', results);
                        if (results.length > 0) {
                            let vehiculo;
                            if (bien != '') {
                                vehiculo = search.lookupFields({ type: 'customrecord_ht_record_bienes', id: bien, columns: ['custrecord_ht_bien_id_telematic'] });
                            } else {
                                vehiculo.custrecord_ht_bien_id_telematic = '';
                            }
                            for (let i = 0; i < results.length; i++) {
                                let familiaArtOS = _controller.getParameter(results[i].item, _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS);
                                plataformas = _controller.getParameter(results[i].item, _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS);
                                plataformas = plataformas == _constant.Valor.SI ? true : false;
                                t_PPS = _controller.getParameter(results[i].item, _constant.Parameter.PPS_PEDIR_PERIODO_DE_SERVICIO);
                                t_PPS = t_PPS == _constant.Valor.SI ? true : false;
                                let unidadTiempo = results[i].unidad;
                                let tiempo = results[i].tiempo
                                log.debug("Familia-OS", `${familiaArtOS}`);
                                let sql2 = "SELECT id, custrecord_ht_co_coberturainicial, custrecord_ht_co_coberturafinal, custrecord_ht_co_numeroserieproducto, custrecord_ht_co_plazo, " +
                                    "custrecord_ht_co_estado_cobertura " +
                                    "FROM customrecord_ht_co_cobertura " +
                                    "WHERE custrecord_ht_co_familia_prod = ? " +
                                    "AND custrecord_ht_co_bien = ?"
                                let params2 = [familiaArtOS, bien];
                                let results2 = query.runSuiteQL({ query: sql2, params: params2 }).asMappedResults();
                                log.debug('results2.runSuiteQL', results2);
                                if (results2.length > 0) {
                                    for (let j = 0; j < results2.length; j++) {
                                        let idCoberturaItem = results2[j].id
                                        log.debug('idCoberturaItem', idCoberturaItem);
                                        let idDispositivo = results2[j].custrecord_ht_co_numeroserieproducto;
                                        let coberturaplazo = results2[j].custrecord_ht_co_plazo;
                                        let coberturaAntigua = results2[j].custrecord_ht_co_coberturafinal;
                                        const partes = coberturaAntigua.split("/");
                                        let fechaValidar = new Date(partes[2], partes[1] - 1, partes[0]);
                                        if (fechaValidar <= fechaActual) {
                                            const dia = String(fechaActual.getDate()).padStart(2, '0');
                                            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
                                            const año = fechaActual.getFullYear();
                                            coberturaAntigua = `${dia}/${mes}/${año}`;
                                        }
                                        log.debug('coberturaAntigua', coberturaAntigua);
                                        // let cobertura_inicial = results2[j].custrecord_ht_co_coberturainicial;
                                        // cobertura_inicial = cobertura_inicial.split('/');
                                        // let nuevaCoberturaInicial = cobertura_inicial[1] + '/' + cobertura_inicial[0] + '/' + cobertura_inicial[2];
                                        // var fechaInicial = Date.parse(nuevaCoberturaInicial);
                                        // var newDateInicial = new Date(fechaInicial);
                                        let producto = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: idDispositivo, columns: ['custrecord_ht_mc_id_telematic'] });
                                        var idTelematic = producto.custrecord_ht_mc_id_telematic;
                                        log.debug('idTelematic', idTelematic);
                                        coberturaAntigua = coberturaAntigua.split('/');
                                        var nuevaCoberturaAntigua = coberturaAntigua[1] + '/' + coberturaAntigua[0] + '/' + coberturaAntigua[2];
                                        log.debug('nuevaCoberturaAntigua', nuevaCoberturaAntigua);
                                        var fechaAntigua = Date.parse(nuevaCoberturaAntigua);
                                        log.debug('fechaAntigua', fechaAntigua);
                                        var newDateAntigua = new Date(fechaAntigua);
                                        log.debug('newDateAntigua', newDateAntigua);
                                        var fechaNuevaDia = newDateAntigua.setDate(newDateAntigua.getDate());
                                        fechaNuevaDia = new Date(fechaNuevaDia);
                                        log.debug('fechaNuevaDia', fechaNuevaDia);
                                        var fechaNuevaCompletaAntigua = new Date(fechaAntigua);
                                        var fechaNuevaCompleta = fechaNuevaCompletaAntigua.setDate(fechaNuevaCompletaAntigua.getDate());
                                        fechaNuevaCompleta = new Date(fechaNuevaCompleta);
                                        plazo = Number(tiempo);
                                        if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.ANIO) {
                                            plazo = plazo * 12;
                                            fechaNuevaCompleta.setMonth(fechaNuevaCompleta.getMonth() + plazo);
                                            log.debug('_constant.Constants.UNIDAD_TIEMPO.ANIO', unidadTiempo);
                                        } else if (unidadTiempo == _constant.Constants.UNIDAD_TIEMPO.DIA) {
                                            fechaNuevaCompleta.setDate(fechaNuevaCompleta.getDate() + plazo);
                                            log.debug('_constant.Constants.UNIDAD_TIEMPO.DIA', unidadTiempo);
                                        } else {
                                            fechaNuevaCompleta.setMonth(fechaNuevaCompleta.getMonth() + plazo);
                                            log.debug('_constant.Constants.UNIDAD_TIEMPO.MESES', unidadTiempo);
                                        }
                                        fechaNuevaCompleta = new Date(fechaNuevaCompleta);
                                        fechaNuevaCompleta = obtenerFechaHoraConFormatoConTimezone(fechaNuevaCompleta);
                                        coberturaplazo = Number(coberturaplazo);
                                        var plazoTotal = parseFloat(plazo) + parseFloat(coberturaplazo);
                                        var hoy = new Date();
                                        log.debug('fechaNuevaCompleta2', fechaNuevaCompleta);
                                        log.debug('plazo', plazo);
                                        log.debug('plazoTotal', plazoTotal);
                                        let telemat = {
                                            id: vehiculo.custrecord_ht_bien_id_telematic,
                                            state: 1,
                                            product_expire_date: fechaNuevaCompleta,
                                        }
                                        if (plataformas == true && t_PPS == true) {
                                            log.debug('Entry', 'If');
                                            let Telematic = envioTelematic(telemat);
                                            Telematic = JSON.parse(Telematic);
                                            log.debug('Telematic-Entry', Telematic);
                                            if (Telematic.asset) {
                                                log.debug('Entry', 'If: ' + Telematic.asset);
                                                record.submitFields({
                                                    type: 'customrecord_ht_co_cobertura',
                                                    id: idCoberturaItem,
                                                    values: {
                                                        'custrecord_ht_co_coberturafinal': new Date(fechaNuevaCompleta),
                                                        'custrecord_ht_co_plazo': plazoTotal,
                                                        'custrecord_ht_co_estado_cobertura': _constant.Status.ACTIVO

                                                    },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: _constant.Status.RENOVACION });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(fechaNuevaDia) });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(fechaNuevaCompleta) });
                                                objRecord_detalle.save();
                                            }
                                        } else {
                                            log.debug('Entry', 'Else');
                                            if (newDateAntigua < hoy && t_PPS == true) {
                                                log.debug('Entry', 'Else: ' + newDateAntigua);
                                                record.submitFields({
                                                    type: 'customrecord_ht_co_cobertura',
                                                    id: idCoberturaItem,
                                                    values: {
                                                        'custrecord_ht_co_coberturainicial': new Date(fechaNuevaDia),
                                                        'custrecord_ht_co_coberturafinal': new Date(fechaNuevaCompleta),
                                                        'custrecord_ht_co_plazo': plazo,
                                                        'custrecord_ht_co_estado_cobertura': _constant.Status.ACTIVO
                                                    },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: _constant.Status.RENOVACION });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(fechaNuevaDia) });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(fechaNuevaCompleta) });
                                                objRecord_detalle.save();
                                            } else if (t_PPS == true) {
                                                record.submitFields({
                                                    type: 'customrecord_ht_co_cobertura',
                                                    id: idCoberturaItem,
                                                    values: {
                                                        'custrecord_ht_co_coberturafinal': new Date(fechaNuevaCompleta),
                                                        'custrecord_ht_co_plazo': plazoTotal,
                                                        'custrecord_ht_co_estado_cobertura': _constant.Status.ACTIVO
                                                    },
                                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                                });
                                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: _constant.Status.RENOVACION });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(fechaNuevaDia) });
                                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(fechaNuevaCompleta) });
                                                objRecord_detalle.save();
                                            }
                                        }
                                    }
                                } else {
                                    log.debug('Mapeo-Cobertura', results[i].item + ' No tiene cobertura.')
                                }
                            }
                        } else {
                            log.debug('Debug', 'No es Orden de Servicio por Renovación')
                            hayRenovacion = 0
                        }

                        if (hayRenovacion == 1) {
                            let serviceOrderrecordUp = record.submitFields({
                                type: 'salesorder',
                                id: idRecord,
                                values: {
                                    'custbody_ht_so_renovacion_aplicada': true,
                                },
                                options: { enableSourcing: true, ignoreMandatoryFields: true }
                            });
                            log.error('serviceOrderrecordUp', 'Orden de Servicio ' + serviceOrderrecordUp + ' actualizada por aplicación de renovación')
                        }
                    }

                }


                /**BLOQUE COBERTURA SIN ORDEN DE TRABAJO
                    * Condiciones:
                    * 1. El articulo debe de tener el paramtro ADP - ACCION DEL PRODUCTO = 008 - VENTA SEGUROS
                    * 2. El articulo debe de ser del tipo serviceitem 
                */
                let articulo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: 0 });
                let articulo_type = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: 0 });
                let parametrosArticulo = getParamFamiliaProductosArticuloOSDesinstalacion(_constant.Parameter.ADP_ACCION_DEL_PRODUCTO, articulo);
                let aprobacionventaCobertura = objRecord.getValue('custbody_ht_os_aprobacionventa');
                let aprobacioncarteraCobertura = objRecord.getValue('custbody_ht_os_aprobacioncartera');

                log.debug('parametrosArticulo', {
                    articulo: articulo,
                    articulo_type: articulo_type,
                    parametrosArticulo: parametrosArticulo

                });
                log.debug('JCEC scriptContext.type', scriptContext.type);
                if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY) {

                    const idRecordTest = scriptContext.newRecord.id;
                    //Validacion 1
                    let validacion1 = false;

                    let validacionDescuento = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: 0 });//Precion UNitario del Articulo
                    let validacionGarantia = true; // Por el momento no hay campo en la orden de venta que valide la garantia
                    let validacionNivelPrecio = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_nivelprecio', line: 0 });//Nivel de Precio 
                    let validacionAPRSolicitaAprobacion = false;

                    let validacionSearch2 = {}
                    let searchValidacion = search.create({
                        type: "salesorder",
                        filters:
                            [
                                ["internalid", "anyof", idRecordTest],
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custitem_ht_at_solicitaaprobacion", join: "item", label: "APR_SOLICITA_APRO" }),
                                search.createColumn({ name: "creditlimit", join: "customerMain", label: "Item" }),
                                search.createColumn({ name: "unbilledorders", join: "customerMain", label: "Item" }),
                                search.createColumn({ name: "overduebalance", join: "customerMain", label: "Item" }),

                            ]
                    });

                    searchValidacion.run().each(function (result) {
                        validacionAPRSolicitaAprobacion = !result.getValue({ name: "custitem_ht_at_solicitaaprobacion", join: "item" });
                        validacionSearch2.creditlimit = result.getValue({ name: "creditlimit", join: "customerMain" });
                        validacionSearch2.unbilledorders = result.getValue({ name: "unbilledorders", join: "customerMain" });
                        validacionSearch2.overduebalance = result.getValue({ name: "overduebalance", join: "customerMain" });

                        return true;
                    });


                    if (validacionDescuento != 0 && validacionGarantia && validacionNivelPrecio != 'Personalizado' && validacionAPRSolicitaAprobacion) {
                        validacion1 = true;
                    }

                    //Validacion 2
                    let validacion2 = false;

                    let validacionTotal = objRecord.getValue('total');
                    let validacionLimiteCredito = validacionSearch2.creditlimit;
                    let validacionOrdenesNoFacturadas = validacionSearch2.unbilledorders;
                    let validacionSaldoVencido = validacionSearch2.overduebalance;

                    let formula = validacionLimiteCredito - validacionOrdenesNoFacturadas - validacionSaldoVencido;

                    if (validacionTotal <= formula) {
                        validacion2 = true;
                    }

                    log.debug('Validaciones', {
                        validacion1: validacion1,
                        validacion2: validacion2,
                        validacionDescuento: validacionDescuento,
                        validacionGarantia: validacionGarantia,
                        validacionNivelPrecio: validacionNivelPrecio,
                        validacionAPRSolicitaAprobacion: validacionAPRSolicitaAprobacion,
                        validacionTotal: validacionTotal,
                        validacionLimiteCredito: validacionLimiteCredito,
                        validacionOrdenesNoFacturadas: validacionOrdenesNoFacturadas,
                        validacionSaldoVencido: validacionSaldoVencido,
                        formula: formula
                    }
                    );
                    if (validacion1 && validacion2) {
                        try {
                            if (articulo_type == 'Service' && parametrosArticulo.valorTexto == '008 - VENTA SEGUROS') {
                                let params = {};
                                params.plazo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: 0 });
                                params.fechaInicio = scriptContext.newRecord.getValue('trandate');
                                let cobertura = getCobertura(params.plazo, objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: 0 }), params.fechaInicio, params.fechaInicio).coberturaFinal;
                                // le damos formato a las fechas  
                                let fechaFinal = cobertura;

                                params.bien = scriptContext.newRecord.getValue('custbody_ht_so_bien');
                                params.producto = articulo;
                                params.estado = 1;
                                params.fechaFinal = fechaFinal;
                                params.familia = getParamFamiliaProductosArticuloOSDesinstalacion(_constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS, articulo).valor;
                            


                                log.debug('params', params);


                                let newCoberturaId = crearCoberturaSinOt(params);
                                log.debug('newCoberturaId', newCoberturaId);


                                let paramsDetalle = {};
                                paramsDetalle.IdCobertura = newCoberturaId;
                                paramsDetalle.IdOrdenServicio = idRecord;
                                paramsDetalle.concepto = 16;

                                let detalleIdCobertura = crearHTDetalleCobertura(paramsDetalle);
                                log.debug('detalleIdCobertura', detalleIdCobertura);



                            }
                        } catch (error) {
                            log.error('Error-CoberturaSinOT', error);
                        }
                    }


                } else if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                    let customrecord_ht_ct_cobertura_transactionSearchObj = search.create({
                        type: "customrecord_ht_ct_cobertura_transaction",
                        filters:
                            [
                                ["custrecord_ht_ct_orden_servicio", "anyof", idRecord]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_ht_ct_orden_servicio", label: "Orden Servicio" })
                            ]
                    });
                    let searchResultCount = customrecord_ht_ct_cobertura_transactionSearchObj.runPaged().count;
                    log.debug('JCEC searchResultCount ' + idRecord, searchResultCount);
                    if (searchResultCount == 0) {
                        if (aprobacionventaCobertura == _constant.Status.APROBADO && aprobacioncarteraCobertura == _constant.Status.APROBADO) {



                            try {
                                if (articulo_type == 'Service' && parametrosArticulo.valorTexto == '008 - VENTA SEGUROS') {
                                    let params = {};
                                    params.plazo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: 0 });
                                    params.fechaInicio = scriptContext.newRecord.getValue('trandate');
                                    let cobertura = getCobertura(params.plazo, objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: 0 }), params.fechaInicio, params.fechaInicio).coberturaFinal;
                                    // le damos formato a las fechas  
                                    let fechaFinal = cobertura;

                                    params.bien = scriptContext.newRecord.getValue('custbody_ht_so_bien');
                                    params.producto = articulo;
                                    params.estado = 1;
                                    params.fechaFinal = fechaFinal;
                                    params.familia = getParamFamiliaProductosArticuloOSDesinstalacion(_constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS, articulo).valor;
                                  


                                    log.debug('params', params);

                                    let newCoberturaId = crearCoberturaSinOt(params);
                                    log.debug('newCoberturaId', newCoberturaId);

                                    let paramsDetalle = {};
                                    paramsDetalle.IdCobertura = newCoberturaId;
                                    paramsDetalle.IdOrdenServicio = idRecord;
                                    paramsDetalle.concepto = 16;

                                    let detalleIdCobertura = crearHTDetalleCobertura(paramsDetalle);
                                    log.debug('detalleIdCobertura', detalleIdCobertura);



                                }
                            } catch (error) {
                                log.error('Error-CoberturaSinOT', error);
                            }


                        }
                    }
                }

                /****************************** */

            } catch (error) {
                log.error('Erro-Edit', error);
            }
        }



    }

    const crearCoberturaSinOt = (params) => {
        try {
            let newCobertura = record.create({ type: 'customrecord_ht_co_cobertura', isDynamic: true });
            if (params.bien) {
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_bien', value: params.bien });
            }
            if (params.producto) {
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_producto', value: params.producto });
            }
            if (params.estado) {
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: params.estado });
            }
            if (params.fechaInicio) {
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_coberturainicial', value: params.fechaInicio });
            }
            if (params.plazo) {
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_plazo', value: params.plazo });
            }
            if (params.fechaFinal) {
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_coberturafinal', value: params.fechaFinal });
            }
            if (params.familia) {
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_familia_prod', value: params.familia });
            }
            if(params.custrecord_ht_co_udp_pla_px_ami){
                newCobertura.setValue({ fieldId: 'custrecord_ht_co_udp_pla_px_ami', value: params.custrecord_ht_co_udp_pla_px_ami });
            }
            let newCoberturaId = newCobertura.save();
            return newCoberturaId;
        } catch (error) {
            log.error('Error-CrearCoberturaSinOt', error);
        }
    }

    const crearHTDetalleCobertura = (params) => {
        try {
            let newDetalleCobertura = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
            if (params.IdCobertura) {
                newDetalleCobertura.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: params.IdCobertura });
            }
            if (params.IdOrdenServicio) {
                newDetalleCobertura.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: params.IdOrdenServicio });
            }
            if (params.concepto) {
                newDetalleCobertura.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: params.concepto });
            }

            return newDetalleCobertura.save();
        } catch (error) {
            log.error('Error-CrearHTDetalleCobertura', error);
        }
    }


    const sumarTiempo = (cantidad, unidadTiempo, fechaInicial, fechaFinal, noanticipado) => {
        let nuevaFechaInicial = noanticipado == 2 ? new Date() : new Date(fechaInicial);
        let nuevaFechaFinal = noanticipado == 2 ? new Date() : new Date(fechaFinal);
        if (unidadTiempo === 'días') {
            //nuevaFechaInicial.setDate(nuevaFechaInicial.getDate() + cantidad);
            nuevaFechaFinal.setDate(nuevaFechaFinal.getDate() + cantidad);
        } else if (unidadTiempo === 'meses') {
            //nuevaFechaInicial.setMonth(nuevaFechaInicial.getMonth() + cantidad);
            nuevaFechaFinal.setMonth(nuevaFechaFinal.getMonth() + cantidad);
        } else if (unidadTiempo === 'años') {
            //nuevaFechaInicial.setFullYear(nuevaFechaInicial.getFullYear() + cantidad);
            nuevaFechaFinal.setFullYear(nuevaFechaFinal.getFullYear() + cantidad);
        }
        // if (noanticipado == 2)
        //     nuevaFechaInicial = new Date();
        return { nuevaFechaInicial, nuevaFechaFinal };
    }

    const getCobertura = (cantidad, undTiempo, fechaInicial, fechaFinal) => {
        log.debug('TIEMPOSSS', parseInt(cantidad) + ' - ' + undTiempo);
        let date = new Date();
        date.setDate(date.getDate());
        // let date_final = new Date();
        let date_final = new Date(fechaInicial);
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

            return {
                coberturaInicial: date,
                coberturaFinal: date_final
            };
        } catch (e) { }
    }

    function convertirFormatoFecha(fecha) {
        const partesFecha = fecha.split('/');
        const nuevaFecha = `${partesFecha[2]}-${partesFecha[1]}-${partesFecha[0]}`;
        return nuevaFecha;
    }

    // const fechaOriginal = "18/12/2023";
    // const fechaConvertida = convertirFormatoFecha(fechaOriginal);
    // console.log(fechaConvertida); // Output: "2023-12-18"

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
            let internalidItem = '';
            let internalid = '';
            let chaser = '';
            var arrayIdTotal = new Array();
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

    const obtenerFechaHoraConFormatoConTimezone = (fecha) => {
        var dia = fecha.getDate().toString().padStart(2, '0');
        var mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        var año = fecha.getFullYear();
        var offsetString = `-05:00`;

        return `${año}-${mes}-${dia}T05:00:00${offsetString}`;
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

    const getFamiliaCoberturaItem = (idBien) => {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_bien", "anyof", idBien],
                        "AND",
                        ["custrecord_ht_co_estado_cobertura", "anyof", "1", "2"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_codigo", join: "custrecord_ht_co_familia_prod", label: "Código" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 100);
            var cod_familia = '';
            var internalid = '';
            var array_cod_familia = [];
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    var arrayId = [];
                    cod_familia = result.getValue(busqueda.columns[0]);
                    array_cod_familia.push(cod_familia);
                    return true;
                });
            }
            return array_cod_familia;
        } catch (e) {
            log.error('Error en getFamiliaCoberturaItem', e);
        }
    }

    const getParamValor = (ID_parametrizacionVal) => {
        try {
            let codigo = '';
            var busqueda = search.create({
                type: "customrecord_ht_cr_pp_valores",
                filters: [["internalid", "anyof", ID_parametrizacionVal]],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_codigo", label: "Código" }),
                    ]
            });
            var pageData = busqueda.runPaged({ pageSize: 1 });
            pageData.pageRanges.forEach((pageRange) => {
                page = pageData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    var columns = result.columns;
                    //0. Internal id match
                    if (result.getValue(columns[0]) != null) {
                        codigo = result.getValue(columns[0]);
                    }
                });
            });
            return codigo;
        } catch (e) {
            log.error('Error en getParamValor', e);
        }
    }

    const obtenerConvenio = (bien) => {
        let busqueda_bien = search.lookupFields({
            type: 'customrecord_ht_record_bienes',
            id: bien,
            columns: ['custrecord_ht_bien_usovehiculo']
        });
        let convenio = busqueda_bien.custrecord_ht_bien_conveniovehiculo.length ? busqueda_bien.custrecord_ht_bien_conveniovehiculo[0].value : '';
        let estadoConvenio = busqueda_bien.custrecord_ht_bien_estadoconvenio.length ? busqueda_bien.custrecord_ht_bien_estadoconvenio[0].value : '';
        let cod_convenio = busqueda_bien["custrecord_ht_bien_conveniovehiculo.custrecord_ht_cn_codigo"];

        let result = [convenio, estadoConvenio, cod_convenio];
        return result;
    }

    const validateGenerico = (bien) => {
        let busqueda_bien = search.lookupFields({
            type: 'customrecord_ht_record_bienes',
            id: bien,
            columns: ['custrecord_ht_bien_generico']
        });
        let isGenerico = busqueda_bien.custrecord_ht_bien_generico;
        log.debug('busqueda_bien', busqueda_bien);
        return isGenerico;
    }

    const obtenerItem = (id) => {
        return search.lookupFields({
            type: "item",
            id: id,
            columns: ["recordtype", "custitem_ht_it_convenio.custrecord_ht_cn_codigo"]
        });
    }

    const getSerie = (formulario) => {
        try {
            var SerieOSSearchObj = search.create({
                type: "customrecord_serie_orden_servicio",
                filters:
                    [
                        ["custrecord_serie_os_formulario", "anyof", formulario]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "ID interno" }),
                        search.createColumn({ name: "custrecord_serie_os_prefijo", label: "Prefijo" }),
                        search.createColumn({ name: "custrecord_serie_os_numero_digitos", label: "Número de digitos" }),
                        search.createColumn({ name: "custrecord_serie_os_numero_inicial", label: "Número inicial" }),
                    ]
            });
            var savedsearch = SerieOSSearchObj.run().getRange(0, 1);
            let column00 = savedsearch[0].getValue(SerieOSSearchObj.columns[0]);
            let column01 = savedsearch[0].getValue(SerieOSSearchObj.columns[1]);
            let column02 = savedsearch[0].getValue(SerieOSSearchObj.columns[2]);
            let column03 = savedsearch[0].getValue(SerieOSSearchObj.columns[3]);
            var serieimpr = generateCorrelative(column00, column01, column02, column03);
            return serieimpr
        } catch (e) {
            log.error('Error en getParamValor', e);
        }
    }

    const generateCorrelative = (serieid, prefijo, numdig, numero) => {
        let ceros;
        let correlative;
        let this_number = Number(numero) + 1;
        record.submitFields({ type: 'customrecord_serie_orden_servicio', id: serieid, values: { 'custrecord_serie_os_numero_inicial': this_number } });
        if (this_number.toString().length == 1) {
            ceros = '0000000';
        } else if (this_number.toString().length == 2) {
            ceros = '000000';
        } else if (this_number.toString().length == 3) {
            ceros = '00000';
        } else if (this_number.toString().length == 4) {
            ceros = '0000';
        } else if (this_number.toString().length == 5) {
            ceros = '000';
        } else if (this_number.toString().length == 6) {
            ceros = '00';
        } else if (this_number.toString().length == 7) {
            ceros = '0';
        } else if (this_number.toString().length >= 8) {
            ceros = '';
        }
        correlative = prefijo + ceros + this_number;
        return correlative
    }


    //Cambio inicio JCEC 24/08/2024

    const getParamFamiliaProductosArticuloOSDesinstalacion = (Parameter, ArticuloOS) => {
        try {
            let respuesta = {};
            let customrecord_ht_pp_main_param_prodSearchObj = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        ["custrecord_ht_pp_parametrizacionid.internalid", "anyof", ArticuloOS],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", Parameter]
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


    const getFamiliaProductosArticuloOSDesinstalacion = (bien) => {
        try {
            let respuesta = [];
            let customrecord_ht_nc_servicios_instaladosSearchObj = search.create({
                type: "customrecord_ht_nc_servicios_instalados",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_ns_bien_si", "anyof", bien],
                        "AND",
                        ["custrecord_ns_orden_servicio_si.taxline", "is", "F"],
                        "AND",
                        ["custrecord_ns_orden_servicio_si.item", "noneof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ns_bien_si", label: "Otras Operaciones" }),
                        search.createColumn({ name: "custrecord_ns_orden_servicio_si", label: "Orden Servicio" }),
                        search.createColumn({ name: "custrecord_ns_orden_trabajo", label: "Orden de Trabajo" }),
                        search.createColumn({ name: "custrecord_ht_si_tipo_adicional", label: "Tipo Adicional" }),
                        search.createColumn({ name: "custrecord_ht_si_serie_acc", label: "Serie Accesorio" }),
                        search.createColumn({ name: "custrecord_ns_servicio", label: "Servicio" }),
                        search.createColumn({ name: "custrecord_ht_si_numero_puertas", label: "Número de Puertas" }),
                        search.createColumn({ name: "custrecord_ht_si_novedad", label: "Novedad" }),
                        search.createColumn({
                            name: "item",
                            join: "CUSTRECORD_NS_ORDEN_SERVICIO_SI",
                            label: "Artículo"
                        })
                    ]
            });
            var searchResultCount = customrecord_ht_nc_servicios_instaladosSearchObj.runPaged().count;
            log.debug("JCEC customrecord_ht_nc_servicios_instaladosSearchObj result count", searchResultCount);
            customrecord_ht_nc_servicios_instaladosSearchObj.run().each(function (result) {
                respuesta.push({
                    idOrdenServicio: result.getValue({ name: 'custrecord_ns_orden_servicio_si' }),
                    idOrdenTrabajo: result.getValue({ name: 'custrecord_ns_orden_trabajo' }),
                    tipoAdicional: result.getValue({ name: 'custrecord_ht_si_tipo_adicional' }),
                    serieAccesorio: result.getValue({ name: 'custrecord_ht_si_serie_acc' }),
                    servicio: result.getValue({ name: 'custrecord_ns_servicio' }),
                    numeroPuertas: result.getValue({ name: 'custrecord_ht_si_numero_puertas' }),
                    novedad: result.getValue({ name: 'custrecord_ht_si_novedad' }),
                    articulo: result.getValue({ name: 'item', join: 'CUSTRECORD_NS_ORDEN_SERVICIO_SI' })
                });
                return true;
            });
            return respuesta;
        } catch (error) {
            log.error('Error en getFamiliaProductosArticuloOSDesinstalacion', error);
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});