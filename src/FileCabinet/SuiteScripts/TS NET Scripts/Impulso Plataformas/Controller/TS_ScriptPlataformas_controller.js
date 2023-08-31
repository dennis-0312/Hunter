/**
 * @NApiVersion 2.1
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/https',
    'N/url',
],
    (log, search, record, https, url) => {
        let myRestletHeaders = new Array();
        myRestletHeaders['Accept'] = '*/*';
        myRestletHeaders['Content-Type'] = 'application/json';
        let arr = [];
        var date = new Date();
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        mm = mm < 10 ? '0' + mm : mm;
        dd = dd < 10 ? '0' + dd : dd;
        return ({
            envioPXAdminInstall: (Dispositivo, vehiculo, Propietario, PropietarioMonitero, id) => {
                let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });

                let StrToken = "SH2PX" + yyyy + mm + dd;

                //let monitoreo  = record.load({ type:'customer', id:PropietarioMonitero.entityid});
                // let inventoryAssignmentLines = salesorder.getLineCount({ sublistId: 'item' }); 
                let unidad = Dispositivo.custrecord_ht_mc_modelo[0].text.split(' - ');
                let modelo = Dispositivo.custrecord_ht_mc_unidad[0].text.split(' - ');
                let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');
                if (!pxadminfinalizacion) {
                    let PxAdmin = {
                        StrToken: StrToken,
                        UserName: "PxPrTest",
                        Password: "PX12%09#w",
                        NumeroOrden: "1101895503",
                        UsuarioIngreso: "PRUEBAEVOL",
                        OperacionOrden: "001",


                        Placa: vehiculo.custrecord_ht_bien_placa,
                        IdMarca: vehiculo.custrecord_ht_bien_marca[0].value,
                        DescMarca: vehiculo.custrecord_ht_bien_marca[0].text,
                        IdModelo: vehiculo.custrecord_ht_bien_modelo[0].value,
                        DescModelo: vehiculo.custrecord_ht_bien_marca[0].text,
                        CodigoVehiculo: vehiculo.name,
                        Chasis: vehiculo.custrecord_ht_bien_chasis,
                        Motor: vehiculo.custrecord_ht_bien_motor,
                        Color: vehiculo.custrecord_ht_bien_colorcarseg[0].text,
                        Anio: vehiculo.custrecord_ht_bien_ano,
                        Tipo: vehiculo.custrecord_ht_bien_tipoterrestre[0].text,

                        Vid: Dispositivo.custrecord_ht_mc_vid,
                        IdProducto: order.getValue('custrecord_ht_ot_item'),
                        DescProducto: Dispositivo.name,
                        CodMarcaDispositivo: unidad[0],
                        MarcaDispositivo: unidad[1],
                        CodModeloDispositivo: modelo[0],
                        ModeloDispositivo: modelo[1],
                        Sn: Dispositivo.custrecord_ht_mc_seriedispositivo,
                        Imei: Dispositivo.custrecord_ht_mc_imei,
                        NumeroCamaras: "0",
                        DireccionMac: Dispositivo.custrecord_ht_mc_ip,
                        Icc: Dispositivo.custrecord_ht_mc_nocelularsim,
                        NumeroCelular: Dispositivo.custrecord_ht_mc_nocelularsim,
                        Operadora: Dispositivo.custrecord_ht_mc_nocelularsim[0].text,
                        EstadoSim: Dispositivo.custrecord_ht_mc_estado[0].text,
                        OperacionDispositivo: "I",
                        ServiciosInstalados: "",
                        VidAnterior: "",

                        IdentificadorPropietario: Propietario.entityid,
                        NombrePropietario: Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre,
                        ApellidosPropietario: Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno,
                        DireccionPropietario: "SURCO",
                        ConvencionalPropietario: "43576409",
                        CelularPropietario: Propietario.phone,
                        EmailPropietario: Propietario.email,

                        IdentificadorMonitorea: PropietarioMonitero.entityid,
                        NombreMonitorea: PropietarioMonitero.custentity_ht_cl_primernombre + ' ' + PropietarioMonitero.custentity_ht_cl_segundonombre,
                        ApellidosMonitorea: PropietarioMonitero.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitero.custentity_ht_cl_apellidomaterno,
                        DireccionMonitorea: "SURCO",
                        ConvencionalMonitorea: "43576409",
                        CelularMonitorea: PropietarioMonitero.phone,
                        EmailMonitorea: PropietarioMonitero.email,


                    }

                    let myRestletResponse = https.requestRestlet({
                        body: JSON.stringify(PxAdmin),
                        deploymentId: 'customdeploy_ns_rs_px_services',
                        scriptId: 'customscript_ns_rs_px_services',
                        headers: myRestletHeaders,
                    });
                    let response = myRestletResponse.body;

                    if (response == 1) {
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                    }

                }
                if (!pxadminfinalizacion) {
                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updateTelematic.save();
                    return false;
                }
                return true;

            },
            envioPXAdminInstallTelec: (Dispositivo, vehiculo, Propietario, PropietarioMonitero, id) => {
                let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });

                let confirmaciontelamatic = order.getValue('custrecord_ht_ot_confirmaciontelamatic');

                if (!confirmaciontelamatic) {
                    let telemat = {
                        customer: {
                            username: Propietario.email,
                            customer: {
                                identity_document_number: "0932677495",
                                company_code: "0991259546001",
                                identity_document_type: 3
                            },
                            first_name: Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre,
                            last_name: Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno,
                            is_active: true,
                            email: Propietario.email,
                        },
                        asset: {
                            product: vehiculo.name,
                            name: vehiculo.altname,
                            custom_name: vehiculo.altname,
                            description: "PruebaEvol",
                            contract_code: "",
                            owner: "403",
                            aceptation_date: "2023-03-23T00:00:00Z",
                            active: true,
                            attributes: [
                                {

                                    attribute: 10,
                                    value: vehiculo.custrecord_ht_bien_marca[0].text,
                                    attribute_name: "Brand"
                                },
                                {

                                    attribute: 11,
                                    value: vehiculo.custrecord_ht_bien_marca[0].text,
                                    attribute_name: "Model"
                                },
                                {

                                    attribute: 16,
                                    value: vehiculo.custrecord_ht_bien_chasis,
                                    attribute_name: "Chasis"
                                },
                                {

                                    attribute: 17,
                                    value: vehiculo.custrecord_ht_bien_motor,
                                    attribute_name: "Motor"
                                },
                                {

                                    attribute: 18,
                                    value: vehiculo.custrecord_ht_bien_placa,
                                    attribute_name: "Plate"
                                }
                            ],
                            doors_sensors: 0,
                            asset_type: "2",
                            product_expire_date: "2024-03-23T00:00:00Z"
                        },
                        device: {
                            report_from: 3,
                            active: true,
                            model: 1,
                            company_code: "",
                            id: Dispositivo.name
                        },
                        command: [
                            "CAR_LOCK",
                            "OPEN_DOOR_LOCKS"
                        ]

                    }
                    let myRestletResponse = https.requestRestlet({
                        body: JSON.stringify(telemat),
                        deploymentId: 'customdeploy_ns_rs_new_installation',
                        scriptId: 'customscript_ns_rs_new_installation',
                        headers: myRestletHeaders,
                    });

                    let response = myRestletResponse.body;
                    let Telematic = JSON.parse(response);
                    if (Telematic.device && Telematic.customer && Telematic.asset) {
                        let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                        updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_confirmaciontelamatic', value: true })
                        updateTelematic.save();
                        confirmaciontelamatic = true;
                    }
                }


                if (!confirmaciontelamatic) {
                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updateTelematic.save();
                    return false;
                }
                return true;

            },
            envioCambioPropietario: (id) => {
                try {
                    let order = record.load({ type: 'salesorder', id: id });
                    fechaActual = "SH2PX" + yyyy + mm + dd;
                    let clienteNew = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: 0 });
                    let clienteMonitoreo = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: 0 });
                    let vehiculo = search.lookupFields({
                        type: 'customrecord_ht_record_bienes', id: order.getValue('custbody_ht_so_bien'),
                        columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo',
                            'custrecord_ht_bien_chasis',
                            'custrecord_ht_bien_motor',
                            'custrecord_ht_bien_colorcarseg',
                            'custrecord_ht_bien_tipoterrestre',
                            'name',
                            'custrecord_ht_bien_ano',
                            'altname', 'custrecord_ht_bien_id_telematic']
                    });
                    let Propietario = search.lookupFields({
                        type: 'customer', id: order.getValue('entity'),
                        columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                            'custentity_ht_cl_apellidopaterno',
                            'custentity_ht_cl_apellidomaterno',
                            'phone',
                            'email', 'custentity_ht_customer_id_telematic']
                    });
                    let PropietarioNew = search.lookupFields({
                        type: 'customer', id: clienteNew,
                        columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                            'custentity_ht_cl_apellidopaterno',
                            'custentity_ht_cl_apellidomaterno',
                            'phone',
                            'email'
                        ]
                    });
                    let PropietarioMonitero = search.lookupFields({
                        type: 'customer', id: clienteMonitoreo,
                        columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                            'custentity_ht_cl_apellidopaterno',
                            'custentity_ht_cl_apellidomaterno',
                            'phone',
                            'email'
                        ]
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

                        IdentificadorPropietario: PropietarioNew.entityid,
                        NombrePropietario: PropietarioNew.custentity_ht_cl_primernombre + ' ' + PropietarioNew.custentity_ht_cl_segundonombre,
                        ApellidosPropietario: PropietarioNew.custentity_ht_cl_apellidopaterno + ' ' + PropietarioNew.custentity_ht_cl_apellidomaterno,
                        DireccionPropietario: "GUAYAQUIL",
                        ConvencionalPropietario: "43576409",
                        CelularPropietario: PropietarioNew.phone,
                        EmailPropietario: PropietarioNew.email,

                        IdentificadorMonitorea: PropietarioMonitero.entityid,
                        NombreMonitorea: PropietarioMonitero.custentity_ht_cl_primernombre + ' ' + PropietarioMonitero.custentity_ht_cl_segundonombre,
                        ApellidosMonitorea: PropietarioMonitero.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitero.custentity_ht_cl_apellidomaterno,
                        DireccionMonitorea: "GUAYAQUIL",
                        ConvencionalMonitorea: "43576409",
                        CelularMonitorea: PropietarioMonitero.phone,
                        EmailMonitorea: PropietarioMonitero.email,
                    }

                    let outputPXadmin = url.resolveScript({
                        scriptId: 'customscript_ns_rs_px_services',
                        deploymentId: 'customdeploy_ns_rs_px_services',
                    });


                    let myRestletResponsePX = https.post({
                        url: outputPXadmin,
                        body: PxAdmin,
                        headers: myRestletHeaders
                    });


                    if (response == 1) {


                    }

                    let telemat = {
                        customerNew: {
                            username: PropietarioNew.entityid,
                            customer: {
                                identity_document_number: "0932677495",
                                company_code: "0991259546001",
                                identity_document_type: 3
                            },
                            first_name: PropietarioNew.custentity_ht_cl_primernombre + ' ' + PropietarioNew.custentity_ht_cl_segundonombre,
                            last_name: PropietarioNew.custentity_ht_cl_apellidopaterno + ' ' + PropietarioNew.custentity_ht_cl_apellidomaterno,
                            is_active: true,
                            email: PropietarioNew.email
                        },
                        customerOld: Propietario.custentity_ht_customer_id_telematic,
                        asset: vehiculo.custrecord_ht_bien_id_telematic

                    }

                    let output = url.resolveScript({
                        scriptId: 'customscript_ns_rs_new_owner',
                        deploymentId: 'customdeploy_ns_rs_new_owner',
                    });


                    let myRestletResponse = https.post({
                        url: output,
                        body: telemat,
                        headers: myRestletHeaders
                    });

                    let response = myRestletResponse.body;
                } catch (e) {
                    return false;
                }

            },
            Propietario: (id) => {
                let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                let Propietario = search.lookupFields({
                    type: 'customer', id: order.getValue('custrecord_ht_ot_cliente_id'),
                    columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email'
                    ]
                });
                return Propietario;
            },
            vehiculo: (id) => {
                let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                let vehiculo = search.lookupFields({
                    type: 'customrecord_ht_record_bienes', id: order.getValue('custrecord_ht_ot_vehiculo'),
                    columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo',
                        'custrecord_ht_bien_chasis',
                        'custrecord_ht_bien_motor',
                        'custrecord_ht_bien_colorcarseg',
                        'custrecord_ht_bien_tipoterrestre',
                        'name',
                        'custrecord_ht_bien_ano',
                        'altname'
                    ]
                });
                return vehiculo;

            },
            Dispositivo: (id) => {
                let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                let Dispositivo = search.lookupFields({
                    type: 'customrecord_ht_record_mantchaser', id: order.getValue('custrecord_ht_ot_serieproductoasignacion'),
                    columns: ['custrecord_ht_mc_vid', 'custrecord_ht_mc_modelo',
                        'custrecord_ht_mc_unidad',
                        'custrecord_ht_mc_seriedispositivo',
                        'custrecord_ht_mc_imei',
                        'name',
                        'custrecord_ht_mc_nocelularsim',
                        'custrecord_ht_mc_operadora',
                        'custrecord_ht_mc_ip', 'custrecord_ht_mc_celularsimcard',
                        'custrecord_ht_mc_estado', 'name'
                    ]
                });
                return Dispositivo;
            },
            PropietarioMonitoreo: (id) => {
                let lookupFieldsPropietarioMonitero = 0
                let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                let salesorder = record.load({ type: 'salesorder', id: order.getValue('custrecord_ht_ot_orden_servicio') });
                let inventoryAssignmentLines = salesorder.getLineCount({ sublistId: 'item' });
                let PropietarioMonitero = 0;
                for (let j = 0; j < inventoryAssignmentLines; j++) {
                    let item = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                    if (item == order.getValue('custrecord_ht_ot_item')) {
                        PropietarioMonitero = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                    }
                }
                log.debug('MONITOREOOOOOO', PropietarioMonitero);
                if (PropietarioMonitero != 0) {
                    lookupFieldsPropietarioMonitero = search.lookupFields({
                        type: 'customer', id: PropietarioMonitero,
                        columns: [
                            'entityid',
                            'custentity_ht_cl_primernombre',
                            'custentity_ht_cl_segundonombre',
                            'custentity_ht_cl_apellidopaterno',
                            'custentity_ht_cl_apellidomaterno',
                            'phone',
                            'email'
                        ]
                    });
                }
                return lookupFieldsPropietarioMonitero;

            }
        });
    });