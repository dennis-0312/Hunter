/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/runtime', 'N/record', 'N/currentRecord', 'N/transaction', 'N/https', 'N/format', 'N/search'],

    function (url, runtime, record, currentRecord, transaction, https, format, search) {

        const pageInit = (scriptContext) => {
            alert('hola mundo'); //!Importante, no borrar.
        }

        const aprobarVenta = (idRecord, htClient, bien, cobertura, fechaInicial, fechaFinal) => {
            try {
                var f = new Date();
                var fechaActual = formatDateJson(f);
                fechaActual = "SH2PX" + fechaActual;
                var fechaInicialSplit = fechaInicial.split('/');
                var fechaInicialTelematic = fechaInicialSplit[2] + '-' + fechaInicialSplit[1] + '-' + fechaInicialSplit[0] + 'T00:00';
                var fechaFinalSplit = fechaFinal.split('/');
                var fechaFinalTelematic = fechaFinalSplit[2] + '-' + fechaFinalSplit[1] + '-' + fechaFinalSplit[0] + 'T00:00';
                console.log('fechaInicialTelematic', fechaInicialTelematic);
                console.log('fechaFinalTelematic', fechaFinalTelematic);
                console.log('htClient', htClient);
                console.log('bien', bien);
                console.log('cobertura', cobertura);
                console.log('fechaInicial', fechaInicial);
                console.log('fechaFinal', fechaFinal);
                if (htClient != '' && bien != '') {
                    let salesOrder = search.lookupFields({
                        type: 'salesorder',
                        id: idRecord,
                        columns: ['entity']
                    });
                    var customerAnterior = (salesOrder.entity)[0].value;
                    let vehiculo = search.lookupFields({
                        type: 'customrecord_ht_record_bienes',
                        id: bien,
                        columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo', 'custrecord_ht_bien_chasis', 'custrecord_ht_bien_motor', 'custrecord_ht_bien_colorcarseg', 'custrecord_ht_bien_tipoterrestre', 'name', 'custrecord_ht_bien_ano', 'custrecord_ht_bien_id_telematic']
                    });
                    let PropietarioAnterior = search.lookupFields({
                        type: 'customer',
                        id: customerAnterior,
                        columns: ['custentity_ht_customer_id_telematic']
                    });
                    let Propietario = search.lookupFields({
                        type: 'customer',
                        id: htClient,
                        columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre', 'custentity_ht_cl_apellidopaterno', 'custentity_ht_cl_apellidomaterno', 'phone', 'email', 'custentity_ht_customer_id_telematic']
                    });

                    let PxAdmin = {
                        StrToken: fechaActual,
                        UserName: "PxPrTest",
                        Password: "PX12%09#w",
                        NumeroOrden: "1101895503",
                        UsuarioIngreso: "PRUEBAEVOL",
                        OperacionOrden: "010",

                        CodigoVehiculo: vehiculo.name,

                        NumeroCamaras: "0",
                        OperacionDispositivo: "A",

                        IdentificadorPropietario: Propietario.entityid,
                        NombrePropietario: Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre,
                        ApellidosPropietario: Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno,
                        DireccionPropietario: "GUAYAQUIL",
                        ConvencionalPropietario: "43576409",
                        CelularPropietario: Propietario.phone,
                        EmailPropietario: Propietario.email,

                        IdentificadorMonitorea: Propietario.entityid,
                        NombreMonitorea: Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre,
                        ApellidosMonitorea: Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno,
                        DireccionMonitorea: "GUAYAQUIL",
                        ConvencionalMonitorea: "43576409",
                        CelularMonitorea: Propietario.phone,
                        EmailMonitorea: Propietario.email,
                    }
                    let PXAdminPrueba = envioPXAdmin(PxAdmin);
                    let telemat = {
                        customerNew: Propietario.custentity_ht_customer_id_telematic,//prpietario nuevo
                        customerOld: PropietarioAnterior.custentity_ht_customer_id_telematic,//prpietario anterior
                        asset: vehiculo.custrecord_ht_bien_id_telematic,//vehiculo
                         commandUserAsset: [
                           /*  {
                                id: 671,
                                command: "CAR_LOCK"
                            },
                            {
                                id: 672,
                                command: "OPEN_DOOR_LOCKS"
                            } */
                        ] 
                    }
                    let Telematic = envioTelematicCambioPropietario(telemat);
                    console.log('Telematic',Telematic);
                    Telematic = JSON.parse(Telematic);
                    //console.log('Telematic.code',Telematic.code);

                    if (PXAdminPrueba == 1 && Telematic) {
                        alert('Entro en envio a PXAdmin');
                        record.submitFields({
                            type: 'salesorder',
                            id: idRecord,
                            values: { 'custbody_ht_os_aprobacionventa': 1 },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        console.log('entra');
                        transaction.void({
                            type: 'salesorder',
                            id: idRecord
                        });
                        console.log('entrax2');
                        record.submitFields({
                            type: 'customrecord_ht_record_bienes',
                            id: bien,
                            values: { 'custrecord_ht_bien_propietario': htClient },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        console.log('entrax3');
                        if (cobertura != '') {
                            record.submitFields({
                                type: 'customrecord_ht_co_cobertura',
                                id: cobertura,
                                values: { 'custrecord_ht_co_propietario': htClient },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }
                        location.reload();
                    } else {
                       /*  if (PXAdminPrueba != 1) { */
                            alert('Error en envio a PXAdmin');
                        /* } else {
                            alert(Telematic.asset);
                        } */
                    }

                } else if (cobertura != '' && bien != '') {
                    let vehiculo = search.lookupFields({
                        type: 'customrecord_ht_record_bienes',
                        id: bien,
                        columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo', 'custrecord_ht_bien_chasis', 'custrecord_ht_bien_motor', 'custrecord_ht_bien_colorcarseg', 'custrecord_ht_bien_tipoterrestre', 'name', 'custrecord_ht_bien_ano', 'custrecord_ht_bien_id_telematic']
                    });
                    var idTelematic = vehiculo.custrecord_ht_bien_id_telematic;
                    var idDispositivo = getDispositivo(bien);
                    console.log('idDispositivo',idDispositivo);
                    var PXAdminPrueba = new Array();
                    for (let i = 0; i < idDispositivo.length; i++) {
                        let Dispositivo = search.lookupFields({
                            type: 'customrecord_ht_record_mantchaser',
                            id: idDispositivo[i],
                            columns: ['custrecord_ht_mc_vid', 'custrecord_ht_mc_modelo', 'custrecord_ht_mc_unidad', 'custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_nocelularsim', 'custrecord_ht_mc_operadora', 'custrecord_ht_mc_estado','custrecord_ht_mc_imei']
                        });
                        let unidad = Dispositivo.custrecord_ht_mc_modelo[0].text.split(' - ');
                        let modelo = Dispositivo.custrecord_ht_mc_unidad[0].text.split(' - ');
                        let PxAdmin = {
                            StrToken: fechaActual,
                            UserName: "PxPrTest",
                            Password: "PX12%09#w",
                            NumeroOrden: "1101895503",
                            UsuarioIngreso: "PRUEBAEVOL",
                            OperacionOrden: "005",

                            CodigoVehiculo: vehiculo.name,

                            Vid:Dispositivo.custrecord_ht_mc_vid,

                            CodMarcaDispositivo:unidad[0],
                            MarcaDispositivo:unidad[1],
                            CodModeloDispositivo:modelo[0],
                            ModeloDispositivo:modelo[1],
                            Sn: "4635224500",
                            Imei: Dispositivo.custrecord_ht_mc_imei,
                            NumeroCamaras: "0",
                            DireccionMac: "20:21:03:11:19",
                            Icc: "2021031119",
                            NumeroCelular:Dispositivo.custrecord_ht_mc_nocelularsim,
                            Operadora:Dispositivo.custrecord_ht_mc_nocelularsim[0].text,
                            EstadoSim:Dispositivo.custrecord_ht_mc_estado[0].text,
                            OperacionDispositivo: "A",
                            ServiciosInstalados: ""

                        }
                        var arrPxAdmin = new Array();
                        arrPxAdmin = envioPXAdmin(PxAdmin);
                        PXAdminPrueba.push(arrPxAdmin);
                    }
                    let total = 0;
                    for (let i of PXAdminPrueba) total += i;
                    console.log('total',total);
                    let telemat = {
                        id: idTelematic,
                        state: 1,
                        product_expire_date: fechaFinalTelematic,
                        aceptation_date: fechaInicialTelematic
                    }
                    let Telematic = envioTelematicCambioFecha(telemat);
                    Telematic = JSON.parse(Telematic);
                    console.log('Telematic', Telematic.asset);


                    if (total == idDispositivo.length && Telematic.asset) {
                        alert('Entro en envio a PXAdmin');
                        record.submitFields({
                            type: 'salesorder',
                            id: idRecord,
                            values: { 'custbody_ht_os_aprobacionventa': 1 },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        transaction.void({
                            type: 'salesorder',
                            id: idRecord
                        });
                        console.log('entrax2');
                        if (fechaInicial != '' && fechaFinal != '') {
                            record.submitFields({
                                type: 'customrecord_ht_co_cobertura',
                                id: cobertura,
                                values: {
                                    'custrecord_ht_co_coberturainicial': fechaInicial,
                                    'custrecord_ht_co_coberturafinal': fechaFinal
                                },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }

                        location.reload();
                    } else {
                        if (PXAdminPrueba != 1) {
                            alert('Error en envio a PXAdmin');
                        } else {
                            alert(Telematic.asset);
                        }
                    }


                } else {
                    record.submitFields({
                        type: 'salesorder',
                        id: idRecord,
                        values: { 'custbody_ht_os_aprobacionventa': 1, 'orderstatus': 'B' },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });
                    console.log('despues');
                    location.reload();
                }

            } catch (err) {
                console.log("Error", "[ aprobarVenta ] " + err);
            }
        }

        function padTo2Digits(num) {
            return num.toString().padStart(2, '0');
        }
        function formatDateJson(date) {
            return [

                date.getFullYear(),
                padTo2Digits(date.getMonth() + 1),
                padTo2Digits(date.getDate())

            ].join('');
        }
        function formatDateJson(date) {
            return [

                date.getFullYear(),
                padTo2Digits(date.getMonth() + 1),
                padTo2Digits(date.getDate())

            ].join('');
        }
        function getDispositivo(bien) {
            try {
                var arrDispositivoId = new Array();
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", bien]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_co_numeroserieproducto", label: "HT CO Número serie Producto" })
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
                        var arrDispositivo = new Array();
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null)
                            arrDispositivo[0] = result.getValue(columns[0]);
                        else
                            arrDispositivo[0] = '';
                        arrDispositivoId.push(arrDispositivo);
                    });
                });
                return arrDispositivoId;
            } catch (e) {
                log.error('Error en getCustomer', e);
            }
        }
        const envioPXAdmin = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let output = url.resolveScript({
                scriptId: 'customscript_ns_rs_px_services',
                deploymentId: 'customdeploy_ns_rs_px_services',
            });
            console.log('output', output);

            let myRestletResponse = https.post({
                url: output,
                body: json,
                headers: myRestletHeaders
            });

            let response = myRestletResponse.body;
            return response;
        }
        const envioTelematicCambioFecha = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let output = url.resolveScript({
                scriptId: 'customscript_ns_rs_update_asset',
                deploymentId: 'customdeploy_ns_rs_update_asset',
            });

            let myRestletResponse = https.post({
                url: output,
                body: json,
                headers: myRestletHeaders
            });

            let response = myRestletResponse.body;
            return response;
        }
        const envioTelematicCambioPropietario = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let output = url.resolveScript({
                scriptId: 'customscript_ns_rs_new_owner',
                deploymentId: 'customdeploy_ns_rs_new_owner',
            });

            let myRestletResponse = https.post({
                url: output,
                body: json,
                headers: myRestletHeaders
            });

            let response = myRestletResponse.body;
            return response;
        }
        return {
            pageInit: pageInit,
            aprobarVenta: aprobarVenta
        };

    });
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 27/06/2022
Author: Jeferson Mejia
Description: Creación del script.
========================================================================================================================================================*/