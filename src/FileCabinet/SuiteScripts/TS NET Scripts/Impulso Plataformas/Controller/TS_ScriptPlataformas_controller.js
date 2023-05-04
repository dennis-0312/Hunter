/**
 * @NApiVersion 2.1
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/https',
],
    (log, search, record,https) => {
  /* var arr = parametrosRespo[j][0];
                                 primerapos.push(arr); */
        let arr = [];
        return ({
            envioPXAdminInstall: (id) => {
                let PxAdmin;
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';
    
                let order  = record.load({ type:'customrecord_ht_record_ordentrabajo', id:id}); 
                let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

                let confirmaciontelamatic = order.getValue('custrecord_ht_ot_confirmaciontelamatic');
                let vehiculo = search.lookupFields({ type: 'customrecord_ht_record_bienes', id: order.getValue('custrecord_ht_ot_vehiculo'),
                                                        columns: [ 'custrecord_ht_bien_placa','custrecord_ht_bien_marca','custrecord_ht_bien_modelo',
                                                            'custrecord_ht_bien_chasis',
                                                            'custrecord_ht_bien_motor',
                                                            'custrecord_ht_bien_colorcarseg',
                                                            'custrecord_ht_bien_tipoterrestre',
                                                            'name',
                                                            'custrecord_ht_bien_ano'
                                                                    ] });
                let Propietario = search.lookupFields({ type: 'customer', id: order.getValue('custrecord_ht_ot_cliente_id'),
                                                        columns: [ 'entityid','custentity_ht_cl_primernombre','custentity_ht_cl_segundonombre',
                                                            'custentity_ht_cl_apellidopaterno',
                                                            'custentity_ht_cl_apellidomaterno',
                                                            'phone',
                                                            'email'
                                                                    ] });
                 
                                          
                let Dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: order.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                                                    columns: [ 'custrecord_ht_mc_vid','custrecord_ht_mc_modelo',
                                                                        'custrecord_ht_mc_unidad',
                                                                        'custrecord_ht_mc_seriedispositivo',
                                                                        'custrecord_ht_mc_nocelularsim',
                                                                        'custrecord_ht_mc_operadora',
                                                                        'custrecord_ht_mc_estado'
                                                                                ] });
                let unidad = Dispositivo.custrecord_ht_mc_modelo[0].text.split(' - ');
                let  modelo= Dispositivo.custrecord_ht_mc_unidad[0].text.split(' - ');
                
                   /* if(!pxadminfinalizacion){
                        let PxAdmin ={
                            StrToken:"SH2PX20230323",
                            UserName:"PxPrTest",
                            Password:"PX12%09#w",
                            NumeroOrden:"1101895503",
                            UsuarioIngreso:"PRUEBAEVOL",
                            OperacionOrden:"001",
                            NombreEjecutiva:"PIERINA GOMEZ",
    
                            Placa:vehiculo.custrecord_ht_bien_placa,
                            IdMarca:vehiculo.custrecord_ht_bien_marca[0].value,
                            DescMarca:vehiculo.custrecord_ht_bien_marca[0].text,
                            IdModelo:vehiculo.custrecord_ht_bien_modelo[0].value,
                            DescModelo:vehiculo.custrecord_ht_bien_marca[0].text,
                            CodigoVehiculo:vehiculo.name,
                            Chasis:vehiculo.custrecord_ht_bien_chasis,
                            Motor:vehiculo.custrecord_ht_bien_motor,
                            Color:vehiculo.custrecord_ht_bien_colorcarseg[0].text,
                            Anio:vehiculo.custrecord_ht_bien_ano,
                            Tipo:vehiculo.custrecord_ht_bien_tipoterrestre[0].text,
                            
                            Vid:Dispositivo.custrecord_ht_mc_vid,
                            IdProducto:order.getValue('custrecord_ht_ot_serieproductoasignacion'),
                            DescProducto:"REINSTALACION GPS GM",
                            CodMarcaDispositivo:unidad[0],
                            MarcaDispositivo:unidad[1],
                            CodModeloDispositivo:modelo[0],
                            ModeloDispositivo:modelo[1],
                            Sn:"4635224500",
                            Imei:"014776002419017",
                            NumeroCamaras:"0",
                            DireccionMac:"20:21:03:11:19",
                            Icc:"2021031119",
                            NumeroCelular:Dispositivo.custrecord_ht_mc_nocelularsim,
                            Operadora:Dispositivo.custrecord_ht_mc_nocelularsim[0].text,
                            EstadoSim:Dispositivo.custrecord_ht_mc_estado[0].text,
                            OperacionDispositivo:"C",
                            ServiciosInstalados:"",
                            VidAnterior:"",
    
                            IdentificadorPropietario:Propietario.entityid,
                            NombrePropietario:Propietario.custentity_ht_cl_primernombre+' '+Propietario.custentity_ht_cl_segundonombre,
                            ApellidosPropietario:Propietario.custentity_ht_cl_apellidopaterno+' '+Propietario.custentity_ht_cl_apellidomaterno,
                            DireccionPropietario:"SURCO",
                            ConvencionalPropietario:"43576409",
                            CelularPropietario:Propietario.phone,
                            EmailPropietario:Propietario.email,
                        
                            IdentificadorMonitorea:Propietario.entityid,
                            NombreMonitorea:Propietario.custentity_ht_cl_primernombre+' '+Propietario.custentity_ht_cl_segundonombre,
                            ApellidosMonitorea:Propietario.custentity_ht_cl_apellidopaterno+' '+Propietario.custentity_ht_cl_apellidomaterno,
                            DireccionMonitorea:"SURCO",
                            ConvencionalMonitorea:"43576409",
                            CelularMonitorea:Propietario.phone,
                            EmailMonitorea:Propietario.email,
                        
    
                        }
                        return true;
                        /*let myRestletResponse = https.requestRestlet({
                            body: JSON.stringify(PxAdmin),
                            deploymentId: 'customdeploy_ns_rs_px_services',
                            scriptId: 'customscript_ns_rs_px_services',
                            headers: myRestletHeaders,
                        });
                        let response = myRestletResponse.body;
                       
                        if(response == 1 ){
                            let updatePxadmin  = record.load({ type:'customrecord_ht_record_ordentrabajo', id:id}); 
                            updatePxadmin.setValue({fieldId:'custrecord_ht_ot_pxadminfinalizacion',value:true})
                            updatePxadmin.save();
                            
                        }*/
                       
                    //}
                    if(!confirmaciontelamatic){
                        let telemat = {
                            customer:{
                                username:  Propietario.email,
                                customer: {
                                    identity_document_number: "0932677495",
                                    company_code: "0991259546001",
                                    identity_document_type: 3
                                },
                                first_name: Propietario.custentity_ht_cl_primernombre+' '+Propietario.custentity_ht_cl_segundonombre,
                                last_name: Propietario.custentity_ht_cl_apellidopaterno+' '+Propietario.custentity_ht_cl_apellidomaterno,
                                is_active: true,
                                email: Propietario.email,
                            },
                            asset:{
                                product: "PruebaEvol",
                                name: "PruebaEvol",
                                custom_name: "PruebaEvol",
                                description: "PruebaEvol",
                                contract_code: "PruebaEvol",
                                owner: "403",
                                aceptation_date: "2021-06-02T00:00:00Z",
                                active: true,
                                attributes: [
                                ],
                                doors_sensors: 0,
                                asset_type: "2",
                                product_expire_date: "2026-01-06T00:00:00Z"
                            },
                            device:{
                                report_from: 3,
                                active: true,
                                model: 1,
                                company_code: "PruebaEvol",
                                id: order.getValue('custrecord_ht_ot_serieproductoasignacion')
                            },
                            command:[
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
                            let updateTelematic  = record.load({ type:'customrecord_ht_record_ordentrabajo', id:id}); 
                            updateTelematic.setValue({fieldId:'custrecord_ht_ot_confirmaciontelamatic',value:true})
                            updateTelematic.save();
                            return true;
                        }
                    }
            
                
                
            },
            envioPXAdminClient: (json) => {
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
            },

            envioTelematicCambioFecha: (json) => {
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
            },

            envioTelematicCambioPropietario: (json) => {
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
            },

            envioPXAdmin: (json) => {
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
            },

            envioTelematic: (json) => {
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
            },

            parametrizacion: (items) => {
                let arr = [];
                var busqueda = search.create({
                    type: "customrecord_ht_pp_main_param_prod",
                    filters:
                        [
                            search.createFilter({
                                name: 'custrecord_ht_pp_aplicacion',
                                operator: search.Operator.IS,
                                values: true
                            }), search.createFilter({
                                name: 'custrecord_ht_pp_parametrizacionid',
                                operator: search.Operator.ANYOF,
                                values: items
                            })
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Param" }),
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" })
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
                        var parametrizacion = new Array();
                        result.getValue(columns[0]) != null ? parametrizacion[0] = result.getValue(columns[0]) : parametrizacion[0] = '';
                        result.getValue(columns[1]) != null ? parametrizacion[1] = result.getValue(columns[1]) : parametrizacion[1] = '';
                        arr.push(parametrizacion);
                    });
                });
                return arr;
            },

        });
    });