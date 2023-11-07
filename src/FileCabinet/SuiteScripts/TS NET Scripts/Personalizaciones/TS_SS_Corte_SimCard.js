/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", 'N/url', 'N/https', '../Main/constant/TS_CM_Constant', '../Main/controller/TS_CM_Controller'],
    (search, record, email, runtime, log, file, task, config, url, https, _constant, _controller) => {

        const COD_ADP_ACCION_DEL_PRODUCTO = 'ADP';
        const VAL_ADP_ACCION_DEL_PRODUCTO = '015';
        const COD_TRM_ACCION_DEL_PRODUCTO = 'TRM';
        const VAL_TRM_ACCION_DEL_PRODUCTO = 'S';
        const COD_TAG_ACCION_DEL_PRODUCTO = 'TAG';

        function execute(context) {
            try {
                var e = new Date();
                var mesCierre = e.setMonth(e.getMonth() - 2);
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
                        }

                        let idDispositivo = '';

                        if (item_cobertura[0] == true) {
                            let coberturas = getCobertura_bien(idSalesOrder[i][2]);
                            if (coberturas != '') {
                                let item_cober = getParametrizacion(coberturas[0]);
                                if (item_cobertura[1] == item_cober) {
                                    idDispositivo = coberturas[1];
                                }
                            }
                        }

                        if (idDispositivo != '' && idDispositivo != null && idDispositivo != 'undefined') {
                            log.error('OS,Factura,Bien' + [i], idSalesOrder[i]);
                            log.error('idDispositivo', idDispositivo);
                            var mant_dispositivo = search.lookupFields({
                                type: 'customrecord_ht_record_mantchaser',
                                id: idDispositivo,
                                columns: ['custrecord_ht_mc_vehiculo', 'custrecord_ht_mc_vid', 'custrecord_ht_mc_id_telematic', 'custrecord_ht_mc_celularsimcard']
                            });

                            var idVehiculo = (mant_dispositivo.custrecord_ht_mc_vehiculo)[0];
                            if (idVehiculo) {
                                idVehiculo = idVehiculo.value
                            }
                            var idVid = mant_dispositivo.custrecord_ht_mc_vid;
                            var idTelematic = mant_dispositivo.custrecord_ht_mc_id_telematic;

                            var CelSimCard = (mant_dispositivo.custrecord_ht_mc_celularsimcard)[0];
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
                                modelo = modelo[0];

                                let idCobertura = getCobertura(idVehiculo);
                                log.debug('COBERTURA0', idCobertura);
                                if (idCobertura != 0) {
                                    log.debug('COBERTURA1', idCobertura);
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
                                    log.debug('nuevoestadoCobertura:' + '[' + i + ']', nuevoestadoCobertura);
                                    log.debug('serie-celular-apn', serie + ',' + celular + ',' + apn);

                                    if (idCobertura != "" && idCobertura != null && nuevoestadoCobertura != 2 /*nuevoestadoCobertura != 1*/) {
                                        log.debug('COBERTURA2', idCobertura);
                                        // log.debug('marca', marca);
                                        // log.debug('modelo', modelo);

                                        record.submitFields({
                                            type: 'customrecord_ht_co_cobertura',
                                            id: idCobertura,
                                            values: {
                                                'custrecord_ht_co_estado_cobertura': 2, // suspendido cambia a "sin dispositivo"
                                                'custrecord_ht_co_estado_conciliacion': 1 //En proceso de conciliacion
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
                                            jeRec.setValue('custrecord_ht_dsc_estado_conciliacion', 1);//PROCESO CONCILIACIÓN
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

        function padTo2Digits(num) {
            return num.toString().padStart(2, '0');
        }

        function formatDate(date) {
            return [
                padTo2Digits(date.getDate()),
                padTo2Digits(date.getMonth() + 1),
                date.getFullYear(),
            ].join('/');
        }

        function formatDateJson(date) {
            return [

                date.getFullYear(),
                padTo2Digits(date.getMonth() + 1),
                padTo2Digits(date.getDate())

            ].join('');
        }

        function getSalesOrder(mesCierre) {
            try {
                var arrSalesOrder = new Array();
                var busqueda = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["duedate", "onorbefore", mesCierre],
                            "AND",
                            ["status", "anyof", "CustInvc:A"],
                            "AND",
                            ["formulanumeric: CASE WHEN {createdfrom} = null THEN 0 ELSE 1 END", "equalto", "1"],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "createdfrom", label: "Created From" }),
                            search.createColumn({ name: "internalid", label: "ID" }),
                            search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" })
                        ]
                });
                var pageData = busqueda.runPaged({
                    pageSize: 1000
                });

                pageData.pageRanges.forEach(function (pageRange) {
                    page = pageData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
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
                log.debug('JSON----', arrSalesOrder)
                return arrSalesOrder;
            } catch (e) {
                log.error('Error en getSalesOrder', e);
            }
        }

        function validar_item(id) {
            try {
                let T_ADP = false;
                let T_TRM = false;
                let T_TAG = '';
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
                var pageData = busqueda.runPaged({
                    pageSize: 1000
                });

                pageData.pageRanges.forEach(function (pageRange) {
                    page = pageData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
                        var columns = result.columns;
                        var id_item;
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null) {
                            id_item = result.getValue(columns[0]); //ID_Item
                            let parametrizacion = _controller.parametrizacion(id_item);
                            for (let j = 0; j < parametrizacion.length; j++) {
                                let codigo = getParamProduct(parametrizacion[j][0]);
                                let valor = getParamValor(parametrizacion[j][1]);
                                if (codigo == COD_ADP_ACCION_DEL_PRODUCTO && valor == VAL_ADP_ACCION_DEL_PRODUCTO) {
                                    T_ADP = true;
                                }
                                if (codigo == COD_TRM_ACCION_DEL_PRODUCTO && valor == VAL_TRM_ACCION_DEL_PRODUCTO) {
                                    T_TRM = true;
                                }
                                if (codigo == COD_TAG_ACCION_DEL_PRODUCTO) {
                                    T_TAG = valor;
                                }
                            }
                        }
                    });
                });
                if (T_ADP == true && T_TRM == true) {
                    return [true, T_TAG];
                } else {
                    return [false, T_TAG];
                }
            } catch (e) {
                log.error('Error en validar_item', e);
            }
        }

        function getParamProduct(ID_parametrizacionProd) {
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

                pageData.pageRanges.forEach(function (pageRange) {
                    page = pageData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
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

        function getParamValor(ID_parametrizacionVal) {
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

                pageData.pageRanges.forEach(function (pageRange) {
                    page = pageData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
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

        function getParametrizacion(ID_parametrizacionProd) {
            try {
                let T_TAG = '';
                let parametrizacion = _controller.parametrizacion(ID_parametrizacionProd);
                for (let j = 0; j < parametrizacion.length; j++) {
                    let codigo = getParamProduct(parametrizacion[j][0]);
                    let valor = getParamValor(parametrizacion[j][1]);
                    if (codigo == COD_TAG_ACCION_DEL_PRODUCTO) {
                        T_TAG = valor;
                    }
                }
                return T_TAG;
            } catch (e) {
                log.error('Error en getParamProduct', e);
            }
        }

        function CambiarSimCard(ID, mesCierre) {
            try {
                record.submitFields({
                    type: 'customrecord_ht_record_detallechasersim',
                    id: ID,
                    values: {
                        'custrecord_ht_ds_estado': 2, //EN PROCESO DE CORTE
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

        function getOrdenTrabajo(id) {
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

        function getCobertura_bien(id) {
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
                    busqueda.run().each(function (result) {

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
        function getCobertura(id) {
            let internalid = 0;
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 100);

                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
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

        return {
            execute: execute
        }

    });