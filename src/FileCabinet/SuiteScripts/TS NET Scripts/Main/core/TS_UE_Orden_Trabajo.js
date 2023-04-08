    /*********************************************************************************************************************************************
    This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
    /*********************************************************************************************************************************************
    File Name: TS_UE_Orden_Trabajo.js                                                                        
    Commit: 01                                                        
    Version: 1.0                                                                     
    Date: 6/12/2022
    ApiVersion: Script 2.1
    Enviroment: SB
    Governance points: N/A
    =============================================================================================================================================*/
    /**
     *@NApiVersion 2.1
    *@NScriptType UserEventScript
    */
    define(['N/log', 'N/search', 'N/record', 'N/https', 'N/error'], (log, search, record, https, error) => {
        const HT_DETALLE_ORDEN_SERVICIO = 'customsearch_ht_detalle_orden_servicio'; //HT Detalle Orden de Servicio - PRODUCCION
        const HT_CONSULTA_ORDEN_TRABAJO = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
        const tipo_servicio_alquiler = 1;
        const tipo_servicio_chequeo = 3;
        const tipo_servicio_demo = 4;
        const TIPO_SERVICIO_DESINSTALACION = 5;
        const tipo_devolucion = 6;
        const tipo_garantia = 7;
        const tipo_renovacion_cobertura = 8;
        const tipo_upgrade = 9;
        const TIPO_VENTA = 10;
        const CONVENIO = 12;
        const ESTADO_CHEQUEADA = 2;
        const HABILITAR_LOG_SEGUIMIENTO = 1;
        const HABILITAR_LOG_VALIDACION = 1;

        const beforeSubmit = (context) => {
            if (context.type === context.UserEventType.CREATE) {
                let validate = 1
                if (validate == 1) {
                    var myCustomError = error.create({
                        name: 'WRONG_PARAMETER_TYPE',
                        message: 'Wrong parameter type selected.',
                        notifyOff: false
                    });
                    // This will write 'Error: WRONG_PARAMETER_TYPE Wrong parameter type selected' to the log
                    log.error('Error: ' + myCustomError.name, myCustomError.message);
                    throw myCustomError;
                }
            }
        }

        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.EDIT) {
                //log.debug('Entré', 'EDIT');
                let objRecord = context.newRecord;
                let id = context.newRecord.id;
                let accionEstadoOT = 'Sin estado';
                const filterIDOT = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: id });
                const filterEstadoChequeada = search.createFilter({ name: 'custrecord_ht_ot_estado', operator: search.Operator.ANYOF, values: ESTADO_CHEQUEADA });
                //const filterEsConvenio = search.createFilter({ name: 'class', join: 'custrecord_ht_id_orden_servicio', operator: search.Operator.ANYOF, values: CLASS_CONVENIO });
                const filterGeneraParamTelematic = search.createFilter({
                    name: 'entityid',
                    join: 'custrecord_ht_campo_lbl_entidad_telefono', operator: search.Operator.HASKEYWORDS,
                    values: true
                });

                try {
                    //select para identificar estado de la orden de trabajo
                    let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO });
                    let filters = objSearch.filters;
                    filters.push(filterIDOT);
                    filters.push(filterEstadoChequeada);
                    let estaChequeada = objSearch.runPaged().count;
                    
                    if (estaChequeada > 0) {
                        accionEstadoOT = ESTADO_CHEQUEADA;
                    }
                    log.debug('accionEstadoOT', accionEstadoOT);

                    switch (accionEstadoOT) {
                        case ESTADO_CHEQUEADA:
                            log.debug('generaParametrización', 'Genera parametrización en las plataformas.');
                            let cobertura = getCobertura();
                            log.debug('cobertura',cobertura);
                            record.submitFields({
                                type: record.Type.SALES_ORDER,
                                id: objRecord.getValue('custrecord_ht_ot_orden_servicio'),
                                values: {
                                    'custbody_ht_os_trabajado': 'S'
                                }
                            });
                            let idItemCobertura = objRecord.getValue('custrecord_ht_ot_item');
                            let idVentAlq = objRecord.getValue('custrecord_ht_ot_item_vent_alq');
                            if(idVentAlq != ''){
                                idItemCobertura = idVentAlq;
                            }
                            let json = {
                                bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                start: cobertura.coberturaInicial,
                                // plazo: objSearch.getValue(''),
                                end: cobertura.coberturaFinal,
                                producto: idItemCobertura,
                                serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                salesorder: objRecord.getValue('custrecord_ht_ot_orden_servicio'),
                                ordentrabajo: objRecord.id
                            }
                            cabertura(json);
                            let pxadminfinalizacion = objRecord.getValue('custrecord_ht_ot_pxadminfinalizacion');

                            let confirmaciontelamatic = objRecord.getValue('custrecord_ht_ot_confirmaciontelamatic');
                            let vehiculo = search.lookupFields({ type: 'customrecord_ht_record_bienes', id: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                                                                    columns: [ 'custrecord_ht_bien_placa','custrecord_ht_bien_marca','custrecord_ht_bien_modelo',
                                                                        'custrecord_ht_bien_chasis',
                                                                        'custrecord_ht_bien_motor',
                                                                        'custrecord_ht_bien_colorcarseg',
                                                                        'custrecord_ht_bien_tipoterrestre',
                                                                        'name',
                                                                        'custrecord_ht_bien_ano'
                                                                                ] });
                            let Propietario = search.lookupFields({ type: 'customer', id: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                                                                    columns: [ 'entityid','custentity_ht_cl_primernombre','custentity_ht_cl_segundonombre',
                                                                        'custentity_ht_cl_apellidopaterno',
                                                                        'custentity_ht_cl_apellidomaterno',
                                                                        'phone',
                                                                        'email'
                                                                                ] });
                            let Dispositivo = search.lookupFields({ type: 'customrecord_ht_record_mantchaser', id: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
                                                                                columns: [ 'custrecord_ht_mc_vid','custrecord_ht_mc_modelo',
                                                                                    'custrecord_ht_mc_unidad',
                                                                                    'custrecord_ht_mc_seriedispositivo',
                                                                                    'custrecord_ht_mc_nocelularsim',
                                                                                    'custrecord_ht_mc_operadora',
                                                                                    'custrecord_ht_mc_estado'
                                                                                            ] });
                            let unidad = Dispositivo.custrecord_ht_mc_modelo[0].text.split(' - ');
                            let  modelo= Dispositivo.custrecord_ht_mc_unidad[0].text.split(' - ');
                            if(!pxadminfinalizacion){
                                let PxAdmin ={
                                    StrToken:"SH2PX20230317",
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
                                    IdProducto:objRecord.getValue('custrecord_ht_ot_serieproductoasignacion'),
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
                                let PXAdmin = envioPXAdmin(PxAdmin);
                                log.debug('PXAdmin',PXAdmin);
                                if(PXAdmin == 1 ){
                                    let order  = record.load({ type:'customrecord_ht_record_ordentrabajo', id:id}); 
                                    order.setValue({fieldId:'custrecord_ht_ot_pxadminfinalizacion',value:true})
                                    order.save();
                                    
                                }
                               
                            }
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
                                        id: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion')
                                    },
                                    command:[
                                        "CAR_LOCK",
                                        "OPEN_DOOR_LOCKS"
                                    ]
                                                
                                }
                                let Telematic = envioTelematic(telemat);
                                log.debug('Telematic',Telematic);
                                Telematic = JSON.parse(Telematic);
                                if (Telematic.device && Telematic.customer && Telematic.asset) {
                                    let order  = record.load({ type:'customrecord_ht_record_ordentrabajo', id:id}); 
                                    order.setValue({fieldId:'custrecord_ht_ot_confirmaciontelamatic',value:true})
                                    order.save();
                                }
                            }
                           
                           
                           
                            let results = objSearch.run().getRange({ start: 0, end: 1 });
                            // log.debug('Debug1', 'Estoy chequeada');
                            // log.debug('Res', results);
                            let tipoOrdenServicio = results[0].getValue({ name: "custbody_ht_os_tipoordenservicio", join: "CUSTRECORD_HT_ID_ORDEN_SERVICIO" });
                            //log.debug('tipoOrdenServicio', tipoOrdenServicio);
                            //! =====================================================================================================================================================
                            const tipoOS = parseInt(tipoOrdenServicio);      
                           
                           
                           
                             
                            switch (tipoOS) {
                                case TIPO_VENTA:
                                    // log.debug('acciónOrdenServicio', 'Genera instalación');
                                    // let codigoDispositivo = results[0].getValue({ name: "custrecord_ht_ot_serieproductoasignacion" });

                                    // //let esConvenio = results[0].getValue({ name: "formulatext", formula: "CASE WHEN {CUSTRECORD_HT_ID_ORDEN_SERVICIO.class} = 'Venta : Venta Convenio' THEN 'SI' ELSE 'NO' END" });
                                    // let esConvenio = results[0].getValue({ name: "formulatext", formula: "DECODE({CUSTRECORD_HT_ID_ORDEN_SERVICIO.custbody_ht_os_tipoordenservicio}, 'Convenio', 'SI','NO')" });
                                    // if (codigoDispositivo.length > 0) {
                                    //     let objSearch3 = search.load({ id: HT_DETALLE_ORDEN_SERVICIO });
                                    //     let filters3 = objSearch3.filters;
                                    //     const filterCodigoDispositivo = search.createFilter({ name: 'inventorynumber', join: 'itemnumber', operator: search.Operator.STARTSWITH, values: codigoDispositivo });
                                    //     filters3.push(filterCodigoDispositivo);
                                    //     filters3.push(filterGeneraParamTelematic);
                                    //     let generaParamTelematic = objSearch3.runPaged().count;
                                    //     //log.debug('Count2', generaParamTelematic);

                                    //     if (generaParamTelematic > 0 && esConvenio == 'SI') {
                                    //         log.debug('generaParametrización', 'Genera parametrización en pxadmin - convenio.');
                                    //     }

                                    //     if (generaParamTelematic > 0 && esConvenio == 'NO') {
                                    //         log.debug('generaParametrización', 'Genera parametrización en telematic y pxadmin.');
                                    //     }
                                    // }









                                    break;
                                // case CONVENIO:
                                //     log.debug('acciónOrdenServicio', 'Genera instalación Convenio');
                                //     let codigoDispositivo2 = results[0].getValue({ name: "custrecord_ht_ot_serieproductoasignacion" });

                                //     //let esConvenio = results[0].getValue({ name: "formulatext", formula: "CASE WHEN {CUSTRECORD_HT_ID_ORDEN_SERVICIO.class} = 'Venta : Venta Convenio' THEN 'SI' ELSE 'NO' END" });
                                //     let esConvenio2 = results[0].getValue({ name: "formulatext", formula: "DECODE({CUSTRECORD_HT_ID_ORDEN_SERVICIO.custbody_ht_os_tipoordenservicio}, 'Convenio', 'SI','NO')" });
                                //     if (codigoDispositivo2.length > 0) {
                                //         let objSearch3 = search.load({ id: HT_DETALLE_ORDEN_SERVICIO });
                                //         let filters3 = objSearch3.filters;
                                //         const filterCodigoDispositivo = search.createFilter({ name: 'inventorynumber', join: 'itemnumber', operator: search.Operator.STARTSWITH, values: codigoDispositivo2 });
                                //         filters3.push(filterCodigoDispositivo);
                                //         filters3.push(filterGeneraParamTelematic);
                                //         let generaParamTelematic = objSearch3.runPaged().count;
                                //         //log.debug('Count2', generaParamTelematic);

                                //         if (generaParamTelematic > 0 && esConvenio2 == 'SI') {
                                //             log.debug('generaParametrización', 'Genera parametrización en pxadmin - convenio.');
                                //         }

                                //         if (generaParamTelematic > 0 && esConvenio2 == 'NO') {
                                //             log.debug('generaParametrización', 'Genera parametrización en telematic y pxadmin.');
                                //         }
                                //     }
                                //     break;
                                // case TIPO_SERVICIO_DESINSTALACION:
                                //     log.debug('acciónOrdenServicio', 'Genera desisntalación');
                                //     break;
                                default:
                                    //log.debug('tipoOS', `Sorry, we are out of ${tipoOS}.`);
                                    break;
                            }
                            break;
                        default:
                            log.debug('accionEstadoOT', `Sorry, we are out of ${accionEstadoOT}.`);
                    }


                    // function esConvenio(filterIDOT, filterEsConvenio) {
                    //     let objSearch2 = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO });
                    //     let filters2 = objSearch2.filters;
                    //     filters2.push(filterIDOT);
                    //     filters2.push(filterEsConvenio);
                    //     let esConvenio = objSearch2.runPaged().count;
                    //     log.debug('Count-Esconvenio', esConvenio);
                    //     if (esConvenio > 0) {
                    //         return 1;
                    //     } else {
                    //         return 0;
                    //     }
                    // }




                    // let results = objSearch.run().getRange({ start: 0, end: 100 });
                    // log.debug('Res', results);


                    // let myRestletHeaders = new Array();
                    // myRestletHeaders['Accept'] = '*/*';
                    // myRestletHeaders['Content-Type'] = 'application/json';

                    // let myUrlParameters = {
                    //     myFirstParameter: 'firstparam',
                    //     mySecondParameter: 'secondparam'
                    // }

                    // let myRestletResponse = https.requestRestlet({
                    //     body: 'My Restlet body',
                    //     deploymentId: 'customdeploy_ts_rs_integration_plataform',
                    //     scriptId: 'customscript_ts_rs_integration_plataform',
                    //     headers: myRestletHeaders,
                    //     method: 'GET',
                    //     urlParams: myUrlParameters
                    // });

                    // let response = myRestletResponse.body;
                    // //log.debug('Debug', response);
                } catch (error) {
                    log.error('Error', error);
                }
            }
        }

        //const envioPXAdmin = () => { }
        const cabertura = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myUrlParameters = {
                myFirstParameter: 'firstparam',
                mySecondParameter: 'secondparam'
            }

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ts_rs_integration_plataform',
                scriptId: 'customscript_ts_rs_integration_plataform',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            log.debug('response',response);
        }
        const envioTelematic = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

        /* let myUrlParameters = {
                myFirstParameter: 'firstparam',
                mySecondParameter: 'secondparam'
            }

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ts_rs_integration_plataform',
                scriptId: 'customscript_ts_rs_integration_plataform',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;*/
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ns_rs_new_installation',
                scriptId: 'customscript_ns_rs_new_installation',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            return response;
        }
        const envioPXAdmin = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let myUrlParameters = {
                myFirstParameter: 'firstparam',
                mySecondParameter: 'secondparam'
            }

            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ns_rs_px_services',
                scriptId: 'customscript_ns_rs_px_services',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            return response;
        }

		 const getCobertura = () => {
            try {
                
                let date = new Date();

                date.setDate(date.getDate()+1);
                let date_final = new Date ();
                date_final.setDate(date_final.getDate()+1);
                date_final.setFullYear(date_final.getFullYear()+1)
                date_final = new Date(date_final);
                return {
                    coberturaInicial: date,
                    coberturaFinal: date_final
                };
         
            } catch (e) {
                log.debug('Error-sysDate', e);
            }

        }

        return {
            //beforeSubmit: beforeSubmit,
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






