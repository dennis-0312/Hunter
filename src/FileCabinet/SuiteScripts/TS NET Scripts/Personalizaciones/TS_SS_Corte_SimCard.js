/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", 'N/url', 'N/https'], (search, record, email, runtime, log, file, task, config, url, https) => {

    function execute(context) {
        try {
            var e = new Date();
            var mesCierre = e.setMonth(e.getMonth() - 2);
            mesCierre = new Date(mesCierre);
            mesCierre = formatDate(mesCierre);
            log.debug("fecha: ", mesCierre)
            var f = new Date();
            var fechaActual = formatDateJson(f);
            fechaActual = "SH2PX" + fechaActual;
            log.debug("fechaActual: ", fechaActual)


            var idSalesOrder = getSalesOrder(mesCierre);
            for (let i = 0; i < idSalesOrder.length; i++) {
                if (idSalesOrder[i] != "" && idSalesOrder[i] != null && idSalesOrder[i] != 'undefined') {
                    log.debug('idSalesOrder'+'['+i+']',idSalesOrder[i]);
                    var idDispositivo = getOrdenTrabajo(idSalesOrder[i]);
                    log.debug('idDispositivo:' +'['+i+']',idDispositivo);
                    if (idDispositivo != "" && idDispositivo != null && idDispositivo != 'undefined') {
                        var mant_dispositivo = search.lookupFields({
                            type: 'customrecord_ht_record_mantchaser',
                            id: idDispositivo,
                            columns: ['custrecord_ht_mc_vehiculo', 'custrecord_ht_mc_vid', 'custrecord_ht_mc_id_telematic']
                        });
                        var idVehiculo = (mant_dispositivo.custrecord_ht_mc_vehiculo)[0];
                        log.debug('idVehiculo:' +'['+i+']',idVehiculo);
                        if(idVehiculo){
                            idVehiculo = idVehiculo.value
                        }
                        var idVid = mant_dispositivo.custrecord_ht_mc_vid;
                        var idTelematic = mant_dispositivo.custrecord_ht_mc_id_telematic;
                        log.debug('idVehiculo:' + '[' + i + ']', idVehiculo)
                        //log.debug('idTelematic:' + '[' + i + ']', idTelematic)
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
                            var idCobertura = getCobertura(idVehiculo);
                            log.debug('idCobertura:' + '[' + i + ']', idCobertura);
                            var estadoCobertura = search.lookupFields({
                                type: 'customrecord_ht_co_cobertura',
                                id: idCobertura,
                                columns: ['custrecord_ht_co_estado_cobertura', 'custrecord_ht_co_celularsimcard', 'custrecord_ht_co_nocelularsimcard', 'custrecord_ht_co_apn']
                            });
                            
                            var nuevoestadoCobertura = (estadoCobertura.custrecord_ht_co_estado_cobertura)[0];
                            log.debug('nuevoestadoCobertura',nuevoestadoCobertura);
                            if(nuevoestadoCobertura){
                                nuevoestadoCobertura = nuevoestadoCobertura.value
                            }
                            var serie = estadoCobertura.custrecord_ht_co_celularsimcard;
                            var celular = estadoCobertura.custrecord_ht_co_nocelularsimcard;
                            var apn = estadoCobertura.custrecord_ht_co_apn
                            log.debug('estadoCobertura:' + '[' + i + ']', nuevoestadoCobertura);
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
                        ["trandate", "onorbefore", mesCierre, mesCierre],
                        "AND",
                        ["status", "anyof", "CustInvc:A"],
                        "AND",
                        ["formulanumeric: CASE WHEN {createdfrom} = NULL THEN 0 ELSE 1 END", "equalto", "1"],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "createdfrom", label: "Created From" })
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
                    if (result.getValue(columns[0]) != null)
                        arrCustomer[0] = result.getValue(columns[0]);
                    arrSalesOrder.push(arrCustomer);
                });
            });
            return arrSalesOrder;
        } catch (e) {
            log.error('Error en getSalesOrder', e);
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
    function getCobertura(id) {
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
            var internalid = '';
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