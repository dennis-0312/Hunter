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
    '../routes/TS_ROUTER_Sales_Order'
], (log, record, search, serverWidget, plugin, transaction, https, runtime, email, query, err, _controller, _constant, _errorMessage, _router) => {
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
                let newSerie = getSerie(formulario);
                // log.error('newSerie', newSerie)
                recordLoad.setValue({ fieldId: 'tranid', value: newSerie });
                recordLoad.save({ ignoreMandatoryFields: true, enableSourcing: false });

                let objRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
                let customer = objRecord.getValue('entity');
                let vehiculo = objRecord.getValue('custbody_ht_so_bien');
                let isGenerico = validateGenerico(vehiculo);
                let ordenServicio = objRecord.getValue('tranid');
                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                let aprobacionventa = objRecord.getValue('custbody_ht_os_aprobacionventa');
                let aprobacioncartera = objRecord.getValue('custbody_ht_os_aprobacioncartera');
                let parametro = 0, parametro_aprob = 0, parametro_fact = 0, workOrder = 0, adp = 0, fam = 0, plazo = 0, valor_tipo_agrupacion = 0, paramChequeo = 0, coberturaRecord = 0,
                    generaOrdenTrabajo = 0, esGarantia = 0, esUpgrade = _constant.Valor.NO, ccd = 0, dispositivoEnCustodia = "", itemCustodia = {}, ttr = 0, renovamos = false,
                    plataformas = false, arrayRecipientsOriginal = new Array(), arrayRecipients = new Array(), esAlquiler = 0, definicionServicios = false, paralizador = false,
                    botonPanico = false, tag = 0, t_PPS = false, variasOT = new Array(), idItem = '';

                for (let i = 0; i < numLines; i++) {
                    objRecord.selectLine({ sublistId: 'item', line: i });
                    let cantidad = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura' });
                    let unidadTiempo = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura' });
                    let inventoryNumber = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia' });
                    let items = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                    log.debug('ITEM', items);
                    let itemDescription = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    if (!paralizador)
                        paralizador = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_paralizador' });
                    if (!botonPanico)
                        botonPanico = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_boton_panico' });
                    let parametrosRespo = _controller.parametrizacion(items);
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

                //**BLOQUE DE RENOVACIÓN */
                if (parametro_aprob != _constant.Valor.SI && parametro_fact == _constant.Valor.NO) {
                } else {
                    if (parametro_aprob == _constant.Valor.SI) {
                        objRecord.setValue('orderstatus', 'A');
                        objRecord.setValue('custbody_ht_os_aprobacionventa', _constant.Status.APROBACION_PENDIENTE);
                    }

                    if (renovamos == true) {
                        var bien = objRecord.getValue('custbody_ht_so_bien');
                        var idCoberturaItem;
                        let busqueda_cobertura = [];
                        if (bien != '') {
                            busqueda_cobertura = getCoberturaItem(bien);
                        }
                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {
                                let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                if (parametrosRespo != 0) {
                                    let valor_tipo_agrupacion_2 = 0;
                                    for (let j = 0; j < parametrosRespo.length; j++) {
                                        if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS)
                                            valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                        if (valor_tipo_agrupacion == valor_tipo_agrupacion_2)
                                            idCoberturaItem = busqueda_cobertura[i][1];
                                    }
                                }
                            }
                        }

                        let vehiculo;
                        if (bien != '') {
                            vehiculo = search.lookupFields({ type: 'customrecord_ht_record_bienes', id: bien, columns: ['custrecord_ht_bien_id_telematic'] });
                        } else {
                            vehiculo.custrecord_ht_bien_id_telematic = '';
                        }

                        let cobertura = search.lookupFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: idCoberturaItem,
                            columns: ['custrecord_ht_co_coberturainicial', 'custrecord_ht_co_coberturafinal', 'custrecord_ht_co_numeroserieproducto', 'custrecord_ht_co_plazo']
                        });
                        var idDispositivo = cobertura.custrecord_ht_co_numeroserieproducto[0].value;
                        var coberturaplazo = cobertura.custrecord_ht_co_plazo;
                        //log.debug('idDispositivo', idDispositivo);
                        var coberturaAntigua = cobertura.custrecord_ht_co_coberturafinal;
                        var cobertura_inicial = cobertura.custrecord_ht_co_coberturainicial;
                        cobertura_inicial = cobertura_inicial.split('/');
                        var nuevaCoberturaInicial = cobertura_inicial[1] + '/' + cobertura_inicial[0] + '/' + cobertura_inicial[2];
                        var fechaInicial = Date.parse(nuevaCoberturaInicial);
                        var newDateInicial = new Date(fechaInicial);
                        let producto = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: idDispositivo, columns: ['custrecord_ht_mc_id_telematic'] });
                        var idTelematic = producto.custrecord_ht_mc_id_telematic;
                        //log.debug('idTelematic', idTelematic);
                        coberturaAntigua = coberturaAntigua.split('/');
                        var nuevaCoberturaAntigua = coberturaAntigua[1] + '/' + coberturaAntigua[0] + '/' + coberturaAntigua[2];
                        var fechaAntigua = Date.parse(nuevaCoberturaAntigua);
                        var newDateAntigua = new Date(fechaAntigua);
                        var fechaNuevaDia = newDateAntigua.setDate(newDateAntigua.getDate());
                        fechaNuevaDia = new Date(fechaNuevaDia);
                        var fechaNuevaCompletaAntigua = new Date(fechaAntigua);
                        var fechaNuevaCompleta = fechaNuevaCompletaAntigua.setDate(fechaNuevaCompletaAntigua.getDate());
                        fechaNuevaCompleta = new Date(fechaNuevaCompleta);
                        plazo = plazo * 12;
                        fechaNuevaCompleta.setMonth(fechaNuevaCompleta.getMonth() + plazo);
                        fechaNuevaCompleta = new Date(fechaNuevaCompleta);
                        fechaNuevaCompleta = obtenerFechaHoraConFormatoConTimezone(fechaNuevaCompleta);
                        plazo = Number(plazo);
                        coberturaplazo = Number(coberturaplazo);
                        var plazoTotal = parseFloat(plazo) + parseFloat(coberturaplazo);
                        var hoy = new Date();

                        let telemat = {
                            id: vehiculo.custrecord_ht_bien_id_telematic,
                            state: 1,
                            product_expire_date: fechaNuevaCompleta,
                        }

                        if (plataformas == true && t_PPS == true) {
                            log.debug('Entry', 'If');
                            let Telematic = envioTelematic(telemat);
                            Telematic = JSON.parse(Telematic);
                            if (Telematic.asset) {
                                log.debug('Entry', 'If: ' + Telematic.asset);
                                record.submitFields({
                                    type: 'customrecord_ht_co_cobertura',
                                    id: idCoberturaItem,
                                    values: {
                                        'custrecord_ht_co_coberturafinal': new Date(fechaNuevaCompleta),
                                        'custrecord_ht_co_plazo': plazoTotal
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: _constant.Status.RENOVACION });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(fechaNuevaDia) });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(fechaNuevaCompleta) });
                                let response = objRecord_detalle.save();
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
                                        'custrecord_ht_co_plazo': plazo
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: _constant.Status.RENOVACION });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(fechaNuevaDia) });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(fechaNuevaCompleta) });
                                let response = objRecord_detalle.save();
                            } else if (t_PPS == true) {
                                record.submitFields({
                                    type: 'customrecord_ht_co_cobertura',
                                    id: idCoberturaItem,
                                    values: {
                                        'custrecord_ht_co_coberturafinal': new Date(fechaNuevaCompleta),
                                        'custrecord_ht_co_plazo': plazoTotal
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                let objRecord_detalle = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: idCoberturaItem });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: idRecord });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: _constant.Status.RENOVACION });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_inicial', value: new Date(fechaNuevaDia) });
                                objRecord_detalle.setValue({ fieldId: 'custrecord_ht_ct_fecha_final', value: new Date(fechaNuevaCompleta) });
                                let response = objRecord_detalle.save();
                            }
                        }
                    }

                    if (objRecord.getValue('custbody_ht_os_issue_invoice') == true) {
                        _controller.createInvoice(objRecord.id);
                    }
                    objRecord.save({ ignoreMandatoryFields: true, enableSourcing: false });
                }

                //*BLOQUE CHEQUEO, DESINSTALACIÓN: Identificar instalación para asociar a la ot
                if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO || adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                    let out = 0;
                    let bien = objRecord.getValue('custbody_ht_so_bien');
                    if (workOrder != 0) {
                        let busqueda_cobertura = [];
                        let field = 0;
                        //TODO: REVISAR CARGA DE DATOS TECNICOS
                        if (/*esUpgrade == _constant.Valor.NO &&*/ bien != '' /**&& esAlquiler == 0*/) {
                            log.debug('Entry-Edit-OT', 'Update Orden Trabajo');
                            // if (esGarantia) {
                            //     workOrder = variasOT[0];
                            // }
                            field = _controller.getFieldsCobertura(bien, fam);
                            log.debug('Field', field);
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

                        if (esUpgrade == _constant.Valor.SI) {
                            if (bien != '') {
                                busqueda_cobertura = getCoberturaItem(bien);
                            }
                            if (busqueda_cobertura.length != 0) {
                                for (let i = 0; i < busqueda_cobertura.length; i++) {
                                    let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                                    if (parametrosRespo != 0) {
                                        for (let j = 0; j < parametrosRespo.length; j++) {
                                            record.submitFields({
                                                type: 'customrecord_ht_co_cobertura',
                                                id: busqueda_cobertura[i][1],
                                                values: {
                                                    'custrecord_ht_co_familia_prod': fam,
                                                    'custrecord_ht_co_estado': _constant.Status.CONVERTIDO
                                                },
                                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                                            });
                                            out = 1;
                                        }
                                        if (out == 1)
                                            break;
                                    }
                                }
                            }
                        }

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
                        let itemVentaGarantia = [];
                        if (bien != '') {
                            //itemVentaGarantia = getCoberturaItem(bien);
                            itemVentaGarantia = _controller.getProductoInstalado(bien, fam);
                        }
                        log.debug("itemVentaGarantia", itemVentaGarantia);
                        if (itemVentaGarantia.length) {
                            let workOrderResult = search.create({
                                type: "customrecord_ht_record_ordentrabajo",
                                filters: [["custrecord_ht_ot_orden_servicio", "anyof", idRecord]],
                                columns: ["internalid"]
                            }).run().getRange(0, 100);
                            log.debug("workOrderResult", workOrderResult.length);
                            if (workOrderResult.length) {
                                for (let i = 0; i < workOrderResult.length; i++) {
                                    let workOrder = workOrderResult[i].id;
                                    record.submitFields({
                                        type: "customrecord_ht_record_ordentrabajo",
                                        id: workOrder,
                                        values: { "custrecord_ts_item_venta_garantia": itemVentaGarantia }
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                log.error('Error-Create', error);
            }
        }

        if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY) {
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
            let ccd = 0, paramChequeo = 0, esUpgrade = _constant.Valor.NO;
            let esCustodia = 0, esConvenio = 0;
            let custodiaDisp = 0;
            try {
                if (aprobacionventa == _constant.Status.APROBADO && aprobacioncartera == _constant.Status.APROBADO) {
                    for (let i = 0; i < numLines; i++) {
                        let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        parametrosRespo = _controller.parametrizacion(items);
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
                            }
                        }
                        htClient = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: i });
                        monitoreo = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i }).length > 0 ? objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: i }) : '';
                        bien = objRecord.getValue('custbody_ht_so_bien');
                        custodiaDisp = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia', line: i });
                    }

                    if (ccd == _constant.Valor.SI || ttr == _constant.Valor.VALOR_CAMB_GPS_TDE_DEALER_MOV_CUSTODIA) {
                        esCustodia = 1
                    }

                    if (parametro != 0 && esCustodia == 0 && adp == _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO) {
                        log.debug('entra plataformas por cambio de propietario');
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
                                        'custrecord_ht_bien_propietario': htClient
                                    },
                                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                                });
                                record.submitFields({ type: 'salesorder', id: idRecord, values: { 'custbody_ht_os_aprobacionventa': _constant.Status.APROBADO, 'orderstatus': 'B' }, options: { enableSourcing: false, ignoreMandatoryFields: true } });
                            }
                            transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                        }
                    }

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
                            //TODO: LOGICA PARA CAMBIO DE PROPIETARIO POR CONVENIO
                        }
                        try {
                            transaction.void({ type: transaction.Type.SALES_ORDER, id: idRecord });
                        } catch (error) { }
                    }

                    //TODO: Revisar, porque en el evento crear ya se realiza esta acción
                    // if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                    //     log.debug('Chequeo', 'VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO o VALOR_002_DESINSTALACION_DE_DISP');
                    //     let out = 0;
                    //     let bien = objRecord.getValue('custbody_ht_so_bien');
                    //     let busqueda_cobertura = [];
                    //     if (bien != '') {
                    //         busqueda_cobertura = getCoberturaItem(bien);
                    //     }
                    //     if (busqueda_cobertura.length != 0) {
                    //         for (let i = 0; i < busqueda_cobertura.length; i++) {
                    //             let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                    //             if (parametrosRespo != 0) {
                    //                 for (let j = 0; j < parametrosRespo.length; j++) {
                    //                     if (parametrosRespo[j][0] == _constant.Parameter.TCH_TIPO_CHEQUEO_OT && parametrosRespo[j][1] == paramChequeo) {
                    //                         try {
                    //                             if (workOrder != 0) {
                    //                                 record.submitFields({
                    //                                     type: 'customrecord_ht_record_ordentrabajo',
                    //                                     id: workOrder,
                    //                                     values: { 'custrecord_ht_ot_serieproductoasignacion': busqueda_cobertura[i][2] },
                    //                                     options: { enableSourcing: false, ignoreMandatoryFields: true }
                    //                                 });
                    //                             }
                    //                         } catch (error) {
                    //                             log.error('esUpgrade', 'No tiene OT')
                    //                         }
                    //                         if (esUpgrade == _constant.Valor.SI) {
                    //                             record.submitFields({
                    //                                 type: 'customrecord_ht_co_cobertura',
                    //                                 id: busqueda_cobertura[i][1],
                    //                                 values: {
                    //                                     'custrecord_ht_co_familia_prod': fam,
                    //                                     'custrecord_ht_co_estado': _constant.Status.CONVERTIDO
                    //                                 },
                    //                                 options: { enableSourcing: false, ignoreMandatoryFields: true }
                    //                             });
                    //                         }
                    //                         out = 1;
                    //                         break;
                    //                     }
                    //                 }
                    //                 if (out == 1)
                    //                     break;
                    //             }
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
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_ht_co_numeroserieproducto", label: "Chaser" })
                    ]
            });
            var searchResultCount = busqueda.runPaged().count;
            log.debug('searchResultCount', searchResultCount);
            let internalidItem = '';
            let internalid = '';
            let chaser = '';
            var arrayIdTotal = [];
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

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});