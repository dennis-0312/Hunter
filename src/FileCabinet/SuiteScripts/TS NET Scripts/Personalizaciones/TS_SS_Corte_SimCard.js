/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define([
    'N/search',
    'N/record',
    'N/email',
    'N/runtime',
    'N/log',
    'N/file',
    'N/task',
    "N/config",
    'N/url',
    'N/https',
    'N/query',
    '../Main/constant/TS_CM_Constant',
    '../Main/controller/TS_CM_Controller'
],
    (search, record, email, runtime, log, file, task, config, url, https, query, _constant, _controller) => {
        const execute = (context) => {
            try {
                let subsidiaria = search.lookupFields({
                    type: 'subsidiary',
                    id: _constant.Constants.ECUADOR_SUBSIDIARY, // CARSEG
                    columns: ['custrecord_ht_tiempo_corte_sim_card']
                });
                let timeCorte = subsidiaria.custrecord_ht_tiempo_corte_sim_card;
                log.error('timeCorte',timeCorte)
                timeCorte = Number(timeCorte);
                var e = new Date();
                var mesCierre = e.setMonth(e.getMonth() - timeCorte);
                mesCierre = new Date(mesCierre);
                mesCierre = formatDate(mesCierre);
                var f = new Date();
                var fechaActual = formatDateJson(f);
                fechaActual = "SH2PX" + fechaActual;
                log.debug('MESCIERRE', mesCierre);
                var idSalesOrder = getSalesOrder(mesCierre);
                log.debug("idSalesOrder: ", idSalesOrder);
                for (let i = 0; i < idSalesOrder.length; i++) {
                    if (idSalesOrder[i][0] != "" && idSalesOrder[i][0] != null && idSalesOrder[i][0] != 'undefined') {
                        let item_cobertura = [];
                        if (idSalesOrder[i][1] != "" && idSalesOrder[i][1] != null && idSalesOrder[i][1] != 'undefined') {
                            item_cobertura = validar_item(idSalesOrder[i][1]); // ADP y TRM = true
                            log.debug('item_cobertura', item_cobertura);
                        }
                        let idDispositivo = '';
                        if (item_cobertura[0] == true) {
                            let coberturas = getCobertura_bien(idSalesOrder[i][2]);
                            log.debug('coberturas', coberturas);
                            if (coberturas != '') {
                                let item_cober = getParametrizacion(coberturas[0]);
                                log.debug('item_cober', item_cobertura[1] + ' == ' + item_cober);
                                if (item_cobertura[1] == item_cober) {
                                    idDispositivo = coberturas[1];
                                    log.debug('idDispositivo', idDispositivo);
                                }
                            }
                        }

                        if (idDispositivo != '' && idDispositivo != null && idDispositivo != 'undefined') {
                            log.error('OS,Factura,Bien' + [i], idSalesOrder[i]);
                            log.error('idDispositivo', idDispositivo);
                            let mant_dispositivo = search.lookupFields({
                                type: 'customrecord_ht_record_mantchaser',
                                id: idDispositivo,
                                columns: ['custrecord_ht_mc_vehiculo', 'custrecord_ht_mc_vid', 'custrecord_ht_mc_id_telematic', 'custrecord_ht_mc_celularsimcard']
                            });

                            let idVehiculo = (mant_dispositivo.custrecord_ht_mc_vehiculo)[0];
                            if (idVehiculo) {
                                idVehiculo = idVehiculo.value
                            }
                            let idVid = mant_dispositivo.custrecord_ht_mc_vid;
                            let idTelematic = mant_dispositivo.custrecord_ht_mc_id_telematic;
                            let CelSimCard = (mant_dispositivo.custrecord_ht_mc_celularsimcard)[0];
                            if (CelSimCard) {
                                CelSimCard = CelSimCard.value
                            }

                            if (CelSimCard != '') {
                                CambiarSimCard(CelSimCard, mesCierre)
                            }

                            // log.debug('CelSimCard:', CelSimCard)
                            // log.debug('idVehiculo:', idVehiculo)
                            // log.debug('idVid:', idVid)
                            // log.debug('idTelematic:', idTelematic)

                            if (idVehiculo != "" && idVehiculo != null && idVehiculo != 'undefined') {
                                let marca_modelo = search.lookupFields({
                                    type: 'customrecord_ht_record_bienes',
                                    id: idVehiculo,
                                    columns: ['custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo']
                                });
                                // var marca = (marca_modelo.custrecord_ht_bien_marca)[0].text;
                                // marca = marca.split(' ')
                                // marca = marca[0];
                                // var modelo = (marca_modelo.custrecord_ht_bien_modelo)[0].text;
                                // modelo = modelo.split(' ')
                                // modelo = modelo[0];
                                let getCodes = getCodMarcaModelo((marca_modelo.custrecord_ht_bien_marca)[0].value, (marca_modelo.custrecord_ht_bien_modelo)[0].value);
                                let marca = getCodes.codMarca;
                                let modelo = getCodes.codModelo;

                                let idCobertura = getCobertura(idVehiculo);
                                log.debug('COBERTURA0', idCobertura);
                                if (idCobertura != 0) {
                                    log.debug('COBERTURA1', idCobertura);
                                    let estadoCobertura = search.lookupFields({
                                        type: 'customrecord_ht_co_cobertura',
                                        id: idCobertura,
                                        columns: ['custrecord_ht_co_estado_cobertura', 'custrecord_ht_co_celularsimcard', 'custrecord_ht_co_nocelularsimcard', 'custrecord_ht_co_apn']
                                    });
                                    let nuevoestadoCobertura = (estadoCobertura.custrecord_ht_co_estado_cobertura)[0];
                                    log.debug('nuevoestadoCobertura', nuevoestadoCobertura);
                                    if (nuevoestadoCobertura) {
                                        nuevoestadoCobertura = nuevoestadoCobertura.value
                                    }
                                    let serie = estadoCobertura.custrecord_ht_co_celularsimcard;
                                    let celular = estadoCobertura.custrecord_ht_co_nocelularsimcard;
                                    let apn = estadoCobertura.custrecord_ht_co_apn
                                    log.debug('nuevoestadoCobertura:' + '[' + i + ']', nuevoestadoCobertura);
                                    log.debug('serie-celular-apn', serie + ',' + celular + ',' + apn);

                                    if (idCobertura != "" && idCobertura != null && nuevoestadoCobertura != _constant.Status.SIN_DISPOSITIVO /*nuevoestadoCobertura != 1*/) {
                                        log.debug('COBERTURA2', idCobertura);
                                        // log.debug('marca', marca);
                                        // log.debug('modelo', modelo);
                                        record.submitFields({
                                            type: 'customrecord_ht_co_cobertura',
                                            id: idCobertura,
                                            values: {
                                                'custrecord_ht_co_estado_cobertura': _constant.Status.SIN_DISPOSITIVO, // suspendido cambia a "sin dispositivo"
                                                //'custrecord_ht_co_estado_conciliacion': _constant.Status.ENVIADO_A_CORTE //En proceso de conciliacion  -  Comentado por Edwin
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });

                                        //------Nuevo Edwin----------
                                        record.submitFields({
                                            type: 'customrecord_ht_record_detallechasersim',
                                            id: CelSimCard,
                                            values: {
                                                'custrecord_ht_ds_estado_conciliacion': _constant.Status.ENVIADO_A_CORTE
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                        //------------------------

                                        try {
                                            let jeRec = record.create({
                                                type: 'customrecord_ht_record_detallesimcard',
                                                isDynamic: true
                                            });
                                            jeRec.setValue('custrecord_ht_dsc_estado', _constant.Status.ENVIADO_A_CORTE);
                                            jeRec.setValue('custrecord_ht_dsc_coberdispo', idCobertura);
                                            jeRec.setValue('custrecord_ht_dsc_serie', serie);
                                            jeRec.setValue('custrecord_ht_dsc_numerocelsim', celular);
                                            jeRec.setValue('custrecord_ht_dsc_estado_conciliacion', 1);//PROCESO CONCILIACIÓN
                                            jeRec.setValue('custrecord_ht_dsc_apn', apn);
                                            jeRec.setValue('name', serie);
                                            jeRec.save();
                                        } catch (error) { }

                                        //id dispositivo
                                        log.debug('idTelematic', idTelematic);
                                        let telemat = {
                                            id: idTelematic,
                                            active: false
                                        }
                                        let PxAdmin = {
                                            StrToken: fechaActual,
                                            UserName: "PxPrTest",
                                            Password: "PX12%09#w",
                                            NumeroOrden: "1101895503",
                                            UsuarioIngreso: "PRUEBAEVOL",  //esto se tiene q cambiar verdad?
                                            OperacionOrden: "017",

                                            CodigoVehiculo: idVehiculo,
                                            NumeroCamaras: "0",
                                            Vid: idVid,
                                            IdProducto: idDispositivo,
                                            CodMarcaDispositivo: marca,
                                            CodModeloDispositivo: modelo,
                                            EstadoSim: "DSC",
                                            OperacionDispositivo: "A"
                                        }

                                        //let Telematic = envioTelematic(telemat);
                                        let PXAdminPrueba = envioPXAdmin(PxAdmin);
                                        //log.debug('Telematic', Telematic);
                                        log.debug('PXAdminPrueba', PXAdminPrueba);
                                    }
                                }
                            }
                        }
                        /*
                        if (idDispositivo != "" && idDispositivo != null && idDispositivo != 'undefined') {
                            var mant_dispositivo = search.lookupFields({
                                type: 'customrecord_ht_record_mantchaser',
                                id: idDispositivo,
                                columns: ['custrecord_ht_mc_vehiculo', 'custrecord_ht_mc_vid', 'custrecord_ht_mc_id_telematic']
                            });
                            var idVehiculo = (mant_dispositivo.custrecord_ht_mc_vehiculo)[0];
                            log.debug('idVehiculo:' + '[' + i + ']', idVehiculo);
                            if (idVehiculo) {
                                idVehiculo = idVehiculo.value
                            }
                            var idVid = mant_dispositivo.custrecord_ht_mc_vid;
                            var idTelematic = mant_dispositivo.custrecord_ht_mc_id_telematic;
                            log.debug('idVehiculo:' + '[' + i + ']', idVehiculo)
                            //log.debug('idTelematic:' + '[' + i + ']', idTelematic) -----
    
                            if (idVehiculo != "" && idVehiculo != null && idVehiculo != 'undefined') {
                                var marca_modelo = search.lookupFields({
                                    type: 'customrecord_ht_record_bienes',
                                    id: idVehiculo,
                                    columns: ['custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo']
                                });
                                var marca = (marca_modelo.custrecord_ht_bien_marca)[0].text;
    
                                marca = marca.split(' ')
                                marca = marca[0];
                                var modelo = (marca_modelo.custrecord_ht_bien_modelo)[0].text;
                                modelo = modelo.split(' ')
                                modelo = modelo[0];----------
                                var idCobertura = getCobertura(idVehiculo);
                                if (idCobertura != 0) {
                                    log.debug('idCobertura:' + '[' + i + ']', idCobertura);
                                    var estadoCobertura = search.lookupFields({
                                        type: 'customrecord_ht_co_cobertura',
                                        id: idCobertura,
                                        columns: ['custrecord_ht_co_estado_cobertura', 'custrecord_ht_co_celularsimcard', 'custrecord_ht_co_nocelularsimcard', 'custrecord_ht_co_apn']
                                    });
    
                                    var nuevoestadoCobertura = (estadoCobertura.custrecord_ht_co_estado_cobertura)[0];
                                    log.debug('nuevoestadoCobertura', nuevoestadoCobertura);
                                    if (nuevoestadoCobertura) {
                                        nuevoestadoCobertura = nuevoestadoCobertura.value
                                    }
                                    var serie = estadoCobertura.custrecord_ht_co_celularsimcard;
                                    var celular = estadoCobertura.custrecord_ht_co_nocelularsimcard;
                                    var apn = estadoCobertura.custrecord_ht_co_apn
                                    log.debug('estadoCobertura:' + '[' + i + ']', nuevoestadoCobertura);-------------
                                    if (idCobertura != "" && idCobertura != null && nuevoestadoCobertura != 1) {
                                        log.debug('marca', marca);
                                        log.debug('modelo', modelo);
                                        record.submitFields({
                                            type: 'customrecord_ht_co_cobertura',
                                            id: idCobertura,
                                            values: {
                                                'custrecord_ht_co_estado_cobertura': 2,
                                                'custrecord_ht_co_estado_conciliacion': 1
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });
                                        try {
                                            var jeRec = record.create({
                                                type: 'customrecord_ht_record_detallesimcard',
                                                isDynamic: true
                                            });
                                            jeRec.setValue('custrecord_ht_dsc_estado', 1);
                                            jeRec.setValue('custrecord_ht_dsc_coberdispo', idCobertura);
                                            jeRec.setValue('custrecord_ht_dsc_serie', serie);
                                            jeRec.setValue('custrecord_ht_dsc_numerocelsim', celular);
                                            jeRec.setValue('custrecord_ht_dsc_estado_conciliacion', 1);
                                            jeRec.setValue('custrecord_ht_dsc_apn', apn);
                                            jeRec.setValue('name', serie);
                                            jeRec.save();
                                        } catch (error) {
                                        
                                        }
    
                                        //id dispositivo
                                        log.debug('idTelematic', idTelematic);
                                        let telemat = {
                                            id: idTelematic,
                                            active: false
                                        }
                                        let PxAdmin = {
                                            StrToken: fechaActual,
                                            UserName: "PxPrTest",
                                            Password: "PX12%09#w",
                                            NumeroOrden: "1101895503",
                                            UsuarioIngreso: "PRUEBAEVOL",
                                            OperacionOrden: "017",
    
                                            CodigoVehiculo: idVehiculo,
                                            NumeroCamaras: "0",
                                            Vid: idVid,
                                            IdProducto: idDispositivo,
                                            CodMarcaDispositivo: marca,
                                            CodModeloDispositivo: modelo,
                                            EstadoSim: "DSC",
                                            OperacionDispositivo: "A"
                                        }
                                        let Telematic = envioTelematic(telemat);
                                        let PXAdminPrueba = envioPXAdmin(PxAdmin);
                                        log.debug('Telematic', Telematic);
                                        log.debug('PXAdminPrueba', PXAdminPrueba);
                                    }
                                }
    
    
                            }
                        }*/
                    }
                }
                //log.debug('territorio',territorio);
                //let objRecord = record.load({ type: record.Type.CUSTOMER, id: idRecord, isDynamic: true });
            } catch (error) {
                log.error('Error en Execute', error);
            }
        }

        const padTo2Digits = (num) => {
            return num.toString().padStart(2, '0');
        }

        const formatDate = (date) => {
            return [
                padTo2Digits(date.getDate()),
                padTo2Digits(date.getMonth() + 1),
                date.getFullYear(),
            ].join('/');
        }

        const formatDateJson = (date) => {
            return [
                date.getFullYear(),
                padTo2Digits(date.getMonth() + 1),
                padTo2Digits(date.getDate())

            ].join('');
        }

        const getSalesOrder = (mesCierre) => {
            try {
                var arrSalesOrder = new Array();
                var busqueda = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["duedate", "on", "21/12/2023"],
                            "AND",
                            ["status", "anyof", "CustInvc:A"],
                            "AND",
                            ["formulanumeric: CASE WHEN {createdfrom} = null THEN 0 ELSE 1 END", "equalto", "1"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["custbodyts_ec_tipo_documento_fiscal", "anyof", "4", "16"],
                            "AND",
                            ["custbody_ht_so_bien", "noneof", "@NONE@"],
                            "AND",
                            ["createdfrom", "noneof", "@NONE@"]


                        ],
                    columns:
                        [
                            search.createColumn({ name: "createdfrom", label: "Created From" }),
                            search.createColumn({ name: "internalid", label: "ID" }),
                            search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" })
                        ]
                });
                var pageData = busqueda.runPaged({ pageSize: 1000 });
                pageData.pageRanges.forEach(pageRange => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        var columns = result.columns;
                        var arrCustomer = new Array();
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null) {
                            arrCustomer[0] = result.getValue(columns[0]);
                            arrCustomer[1] = result.getValue(columns[1]);
                            arrCustomer[2] = result.getValue(columns[2]);
                            if (arrCustomer[0] != '') {
                                arrSalesOrder.push(arrCustomer);
                            }
                        }
                        //arrSalesOrder.push(arrCustomer);
                    });
                });
                //log.debug('JSON----', arrSalesOrder)
                return arrSalesOrder;
            } catch (e) {
                log.error('Error en getSalesOrder', e);
            }
        }

        const validar_item = (id) => {
            try {
                let T_ADP = false;
                let T_TRM = false;
                let T_TAG = '';
                let T_FAM = '';
                var busqueda = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["internalid", "anyof", id],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["item", "noneof", "@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "item", label: "Artículo" })
                        ]
                });
                var pageData = busqueda.runPaged({ pageSize: 1000 });
                pageData.pageRanges.forEach(pageRange => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        var columns = result.columns;
                        var id_item;
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null) {
                            id_item = result.getValue(columns[0]); //ID_Item
                            let parametrizacion = _controller.parametrizacion(id_item);
                            for (let j = 0; j < parametrizacion.length; j++) {
                                let codigo = getParamProduct(parametrizacion[j][0]);
                                let valor = getParamValor(parametrizacion[j][1]);
                                if (codigo == _constant.Codigo_parametro.COD_ADP_ACCION_DEL_PRODUCTO && valor == _constant.Codigo_Valor.COD_VALOR_015_VENTA_SERVICIOS) {
                                    T_ADP = true;
                                }
                                if (codigo == _constant.Codigo_parametro.COD_TRM_SERVICIO_DE_TRANSMISION && valor == _constant.Codigo_Valor.COD_SI) {
                                    T_TRM = true;
                                }
                                if (codigo == _constant.Codigo_parametro.COD_TAG_TIPO_AGRUPACION_PRODUCTO) {//&ESTA UTILIZANDO LA FAMILIA
                                    T_FAM = valor;
                                }
                            }
                        }
                    });
                });
                if (T_ADP == true && T_TRM == true) {
                    return [true, T_FAM];
                } else {
                    return [false, T_FAM];
                }
            } catch (e) {
                log.error('Error en validar_item', e);
            }
        }

        const getParamProduct = (ID_parametrizacionProd) => {
            try {
                let codigo = '';
                var busqueda = search.create({
                    type: "customrecord_ht_cr_parametrizacion_produ",
                    filters:
                        [
                            ["internalid", "anyof", ID_parametrizacionProd]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_pp_code", label: "Código" }),
                        ]
                });
                var pageData = busqueda.runPaged({
                    pageSize: 1
                });

                pageData.pageRanges.forEach(pageRange => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        var columns = result.columns;
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null) {
                            codigo = result.getValue(columns[0]);
                        }
                    });
                });
                return codigo;
            } catch (e) {
                log.error('Error en getParamProduct', e);
            }
        }

        const getParamValor = (ID_parametrizacionVal) => {
            try {
                let codigo = '';
                var busqueda = search.create({
                    type: "customrecord_ht_cr_pp_valores",
                    filters:
                        [
                            ["internalid", "anyof", ID_parametrizacionVal]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_pp_codigo", label: "Código" }),
                        ]
                });
                var pageData = busqueda.runPaged({
                    pageSize: 1
                });

                pageData.pageRanges.forEach(pageRange => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
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

        const getParametrizacion = (ID_parametrizacionProd) => {
            try {
                let T_TAG = '';
                let T_FAM = '';
                let parametrizacion = _controller.parametrizacion(ID_parametrizacionProd);
                for (let j = 0; j < parametrizacion.length; j++) {
                    let codigo = getParamProduct(parametrizacion[j][0]);
                    let valor = getParamValor(parametrizacion[j][1]);
                    if (codigo == _constant.Codigo_parametro.COD_TAG_TIPO_AGRUPACION_PRODUCTO) {
                        T_FAM = valor;
                    }
                }
                return T_FAM;
            } catch (e) {
                log.error('Error en getParamProduct', e);
            }
        }

        const CambiarSimCard = (ID, mesCierre) => {
            try {
                record.submitFields({
                    type: 'customrecord_ht_record_detallechasersim',
                    id: ID,
                    values: {
                        'custrecord_ht_ds_estado': _constant.Status.EN_PROCESO_DE_CORTE,  //EN PROCESO DE CORTE
                        'custrecord_ht_ds_fechacorte': mesCierre
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            } catch (e) {
                log.error('Error en CambiarSimCard', e);
            }
        }

        const getOrdenTrabajo = (id) => {
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_record_ordentrabajo",
                    filters:
                        [
                            ["custrecord_ht_ot_orden_servicio", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_ot_serieproductoasignacion", label: "HT OT Serie Producto" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 1);
                var internalid = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        internalid = result.getValue(busqueda.columns[0]);
                        return true;
                    });
                }
                return internalid;
            } catch (e) {
                log.error('Error en getOrdenTrabajo', e);
            }
        }

        const getCobertura_bien = (id) => {
            let cobertura = [];
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_co_producto", label: "HT CO PRODUCTO" }),
                            search.createColumn({ name: "custrecord_ht_co_numeroserieproducto", label: "Serie Producto" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 100);
                if (savedsearch.length > 0) {
                    busqueda.run().each(result => {
                        cobertura[0] = result.getValue(busqueda.columns[0]);
                        cobertura[1] = result.getValue(busqueda.columns[1]);
                        return true;
                    });
                }
                return cobertura;
            } catch (e) {
                log.error('Error en getCobertura_bien', e);
            }
        }

        const getCobertura = (id) => {
            let internalid = 0;
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", id],
                            "AND",
                            ["custrecord_ht_co_celularsimcard", "isnotempty", ""]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 100);
                if (savedsearch.length > 0) {
                    busqueda.run().each(result => {
                        internalid = result.getValue(busqueda.columns[0]);
                        return true;
                    });
                }
                return internalid;
            } catch (e) {
                log.error('Error en getCobertura', e);
            }
        }

        const envioPXAdmin = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ns_rs_px_services',
                scriptId: 'customscript_ns_rs_px_services',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            return response;
        }

        const envioTelematic = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ns_rs_update_device',
                scriptId: 'customscript_ns_rs_update_device',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            return response;
        }

        const getCodMarcaModelo = (marcaid, modeloid) => {
            let codMarca = '';
            let codModelo = '';
            let sql = "SELECT custrecord_ht_marca_codigo FROM customrecord_ht_bien_marca WHERE id = ?";
            let resultSet = query.runSuiteQL({ query: sql, params: [marcaid] });
            let results = resultSet.asMappedResults();
            codMarca = results.length > 0 ? results[0].custrecord_ht_marca_codigo : '';

            let sql2 = "SELECT custrecord_ht_mod_codigo FROM customrecord_ht_bn_modelo WHERE id = ?";
            let resultSet2 = query.runSuiteQL({ query: sql2, params: [modeloid] });
            let results2 = resultSet2.asMappedResults();
            codModelo = results2.length > 0 ? results2[0].custrecord_ht_mod_codigo : '';

            return {
                codMarca: codMarca,
                codModelo: codModelo
            }
        }

        return {
            execute: execute
        }

    });