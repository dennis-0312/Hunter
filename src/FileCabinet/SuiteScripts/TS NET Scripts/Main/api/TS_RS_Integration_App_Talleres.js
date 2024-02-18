
/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_RS_Integration_App_Talleres.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
Url: https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=802&deploy=1
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/search', 'N/record', 'N/email', 'N/format', 'N/query', 'N/file', 'N/runtime'], (log, search, record, email, format, query, file, runtime) => {
    const HT_CONSULTA_ORDEN_TRABAJO_SEARCH = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //
    const HT_BIEN_RECORD = 'customrecord_ht_record_bienes' //HT Bienes
    const HT_FLUJO_ORDEN_TRABAJO_RECORD = 'customrecord_ht_ot_flujoordendetrabajo' //HT OT Flujo Orden de trabajo - PRODUCCION
    const HT_FLUJO_ORDEN_TRBAJO_SEARCH = 'customsearch_ht_ot_flujo_orden_trabajo' //HT OT Flujo Orden de trabajo - PRODUCCION
    const RECEPCION = 'recepcion';
    const ACTUALIZAR = 'actualizar';
    const ORIGINAL = 'original';
    const ASIGNACION = 'asignacion';
    const ASIGNADO = 'asignado';
    const DISPOSITIVO = 'dispositivo';
    const FOTO = "foto";
    const CHEQUEADO = 2;
    const VENTA = 7;
    const PROCESANDO = 4;
    const ENTREGADO_A_CLIENTE = 8;

    const _get = (scriptContext) => {
        let jsonResult = new Array();
        let jsonResponse = new Array();
        let jsonMapping = new Array();
        let jsonRecepcion = new Array();
        let jsonOrdenServicio = new Array();
        let jsonProducto = new Array();
       
        log.debug('scriptContext', scriptContext);
        try {
            if (typeof scriptContext.accesorios != 'undefined') {
                let accesoriosArray = new Array();
                let arrayJson = new Array();
                let sql = 'SELECT * FROM customrecord_ht_rc_accesorios';
                // let params = [requestParams.id]
                let resultSet = query.runSuiteQL({ query: sql/*, params: params*/ });
                let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                if (results.length > 0) {
                    for (let i in results ) {
                        arrayJson.push({'accesorio':results[i]['name']} )
                    }
                }
                return arrayJson;
            } else if (typeof scriptContext.accion != 'undefined' && scriptContext.accion.length > 0) {
                let param = false;
                let filter =
                    [
                        ["custrecord_ht_ot_orden_servicio.class", "noneof", "@NONE@"],
                        "AND",
                        ["custrecord_ht_ot_orden_servicio.department", "noneof", "@NONE@"]
                    ]              
                // if (typeof scriptContext.serie != 'undefined') {
                //     if (scriptContext.serie.length != 0) {
                //         filter.push("AND", ["custrecord_ht_ot_dispositivo", "startswith", scriptContext.serie])
                //         param = true;
                //     }
                // }

                

                // if (typeof scriptContext.estadodispositivo != 'undefined') {
                //     if (scriptContext.estadodispositivo.length != 0) {
                //         filter.push("AND", ["custrecord_ht_ot_serieproductoasignacion.custrecord_ht_mc_estadolodispositivo", "anyof", scriptContext.estadodispositivo])
                //         param = true;
                //     }
                // }
    
                // if (param == false) {
                //     return 'Filtro no válido';
                // }
    
                if (scriptContext.accion == RECEPCION) {
                    log.debug('Response', scriptContext.accion);
                    if (typeof scriptContext.placa != 'undefined') {
                        if (scriptContext.placa.length != 0) {
                            filter.push("AND", ["custrecord_ht_ot_vehiculo.custrecord_ht_bien_placa", "startswith", scriptContext.placa])
                            param = true;
                        }
                    }
        
                    if (typeof scriptContext.cedularuc != 'undefined') {
                        if (scriptContext.cedularuc.length != 0) {
                            let id_cliente = BuscarCliente(scriptContext.cedularuc);
                            if(id_cliente != ''){
                                filter.push("AND", ["custrecord_ht_ot_cliente_id.internalid", "anyof", id_cliente]);
                            }
                            param = true;
                        }
                    }

                    if (typeof scriptContext.ordenservicio != 'undefined') {
                        if (scriptContext.ordenservicio.length != 0) {
                            filter.push("AND", ["custrecord_ht_ot_orden_serivicio_txt", "startswith", scriptContext.ordenservicio])
                            param = true;
                        }
                    }

                    if (typeof scriptContext.recepcionada != 'undefined') {
                        if (scriptContext.recepcionada.length != 0) {
                            if (scriptContext.recepcionada == 'true') {
                                log.debug('Entré:', 'TRUE')
                                filter.push("AND", ["custrecord_ht_ot_estado","anyof", CHEQUEADO, ENTREGADO_A_CLIENTE, PROCESANDO])
                            } else if (scriptContext.recepcionada == 'false') {
                                log.debug('Entré:', 'FALSE')
                                filter.push("AND", ["custrecord_ht_ot_estado","anyof", VENTA])
                            }
                            param = true;
                        }
                    }

                    if (param == false) {
                        return 'Filtro no válido para esta acción, revise sus parámetros';
                    }
    
                    const mySearch = search.create({
                        type: HT_ORDEN_TRABAJO_RECORD,
                        filters: filter,
                        columns:
                            [
                                search.createColumn({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }), 
                                search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                                search.createColumn({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }),
                                search.createColumn({ name: "altname", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Name" }),
                                search.createColumn({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }),  
                                search.createColumn({ name: "altname", join: "CUSTRECORD_HT_OT_VEHICULO",summary: "GROUP",label: "Name" }),
                                search.createColumn({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }),
                                search.createColumn({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }),
                                search.createColumn({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }),
                                search.createColumn({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" }),
                                search.createColumn({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" }),
                                search.createColumn({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" }),
                                search.createColumn({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" }),
                                search.createColumn({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }),
                                search.createColumn({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" }),
                                search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado OT" }),
                                search.createColumn({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }),
                                search.createColumn({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" }),
                                search.createColumn({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }),
                                search.createColumn({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }),
                                search.createColumn({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }),
                                search.createColumn({ name: "custrecord_ht_bien_ano", join: "CUSTRECORD_HT_OT_VEHICULO",summary: "GROUP",label: "Anio" })
                            ]
                    });
    
                    let searchResultCount = mySearch.runPaged().count;
                    log.debug("scriptdeploymentSearchObj result count", searchResultCount);
                    if (searchResultCount > 0) {
                        mySearch.run().each(result =>{
                            let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                            if (remainingUsage < 30) {
                                return false;
                            }
                            let lookupFieldsvatregnumber = '';
                            let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                            try {
                                 lookupFieldsvatregnumber = search.lookupFields({ type: 'customer', id: clienteid, columns: ['vatregnumber'] });
                                 lookupFieldsvatregnumber = lookupFieldsvatregnumber.vatregnumber.length ? lookupFieldsvatregnumber.vatregnumber : '';
                            } catch (error) {}
                            
                            let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                            let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }) //^REQUERIDO POR HUNTER
                            let cliente = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                            let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }) //^REQUERIDO POR HUNTER 
                            let vehiculo = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_VEHICULO", summary: "GROUP", label: "Name" }) //^REQUERIDO POR HUNTER 
                            let comentarioTec = result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) //^REQUERIDO POR HUNTER
                            let producto = result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                            let direccion = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" })
                            let email = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" })
                            let telefono = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" })
                            let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" })
                            let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" })
                            let tipoTrabajo = result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                            let ceduleruc = lookupFieldsvatregnumber;
                            let consideracion = result.getValue({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" })
                            let estadoot = result.getText({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado OT" })
                            let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" })
                            let color = result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })  == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })
                            let marca = result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" })
                            let modelo = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" })
                            let version = result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" })
                            let anio = result.getValue({ name: "custrecord_ht_bien_ano", join: "CUSTRECORD_HT_OT_VEHICULO",summary: "GROUP",label: "Anio" })
                            
                               
                            let sql = 'SELECT assemblycomponent, memo, itemtype FROM TransactionLine WHERE transaction = ?';
                            let params = [ordenServicioid]
                            let array = new Array();
                            let trabajo = '';
                            let resultSet = query.runSuiteQL({ query: sql, params: params });
                            let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                            if (results.length > 0) {
                                for (let i in results) {
                                    if ((results[i]['itemtype'] == "Assembly" || results[i]['itemtype'] == "Service" || results[i]['itemtype'] == "InvtPart") && results[i]['assemblycomponent'] == 'F') {
                                        array.push(results[i]['memo']);
                                    }
                                }
                                for (let j in array) {
                                    trabajo =
                                    trabajo + array[j] + ';'
                                }
                            }

                            let sql2 = "SELECT val.custrecord_ht_pp_descripcion as producto FROM customrecord_ht_record_ordentrabajo tra " +
                                "INNER JOIN customrecord_ht_cr_pp_valores val ON tra.custrecordht_ot_tipo_agrupacion = val.id "+
                                "WHERE tra.custrecord_ht_ot_orden_servicio = ?"
                                let params2 = [ordenServicioid]
                                let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 });
                                let results2 = resultSet2.asMappedResults();
                                let prod = '';
                                if (results2.length > 0) {
                                    for (let j in results2) {
                                        prod =
                                        prod + results2[j].producto + ';'
                                    }
                                }
                            
                            let sql3 = "SELECT ttr.custrecord_ht_pp_descripcion as trabajo FROM customrecord_ht_record_ordentrabajo tra " +
                                "INNER JOIN customrecord_ht_cr_pp_valores ttr ON tra.custrecord_ht_ot_tipo_trabajo = ttr.id "+
                                "WHERE tra.custrecord_ht_ot_orden_servicio = ?"
                                let params3 = [ordenServicioid]
                                let resultSet3 = query.runSuiteQL({ query: sql3, params: params3 });
                                let results3 = resultSet3.asMappedResults();
                                let trab = '';
                                if (results3.length > 0) {
                                    for (let j in results3) {
                                        trab =
                                        trab + results3[j].trabajo + ';'
                                    }
                                }

                            consideracion = consideracion == '- None -' ? '' : consideracion;
                                let accesorio = [];
                                //Buscar Recepcion
                                let RecepcionSearchObj = search.create({
                                    type: "calendarevent",
                                    filters:
                                    [
                                       ["transaction.internalid","anyof",ordenServicioid]
                                    ],
                                    columns:
                                    [
                                       search.createColumn({name: "title",label: "Recepción"}),
                                       search.createColumn({name: "custevent_ht_rc_radio",}),
                                       search.createColumn({name: "custevent_ht_rc_perillas",}),
                                       search.createColumn({name: "custevent_ht_rc_tapacombustible",}),
                                       search.createColumn({name: "custevent_ht_rc_alfombrapiso",}),
                                       search.createColumn({name: "custevent_ht_rc_aireacondicionado",}),
                                       search.createColumn({name: "custevent_ht_rc_brazosplumas",}),
                                       search.createColumn({name: "custevent_ht_rc_mascarillas",}),
                                       search.createColumn({name: "custevent_ht_rc_cenicero",}),
                                       search.createColumn({name: "custevent_ht_rc_chicotes",}),
                                       search.createColumn({name: "custevent_ht_rc_lucesparqueo",}),
                                       search.createColumn({name: "custevent_ht_rc_topespuertas",}),
                                       search.createColumn({name: "custevent_ht_rc_vidriosyseguros",}),
                                       search.createColumn({name: "custevent_ht_rc_moquetas",}),
                                       search.createColumn({name: "custevent_ht_rc_manualradio",}),
                                       search.createColumn({name: "custevent_ht_rc_palanca",}),
                                       search.createColumn({name: "custevent_ht_rc_encededor",}),
                                       search.createColumn({name: "custevent_ht_rc_espejointerior",}),
                                       search.createColumn({name: "custevent_ht_rc_espejoexterior",}),
                                       search.createColumn({name: "custevent_ht_rc_ventcalef",}),
                                       search.createColumn({name: "custevent_ht_rc_tapacubos",}),
                                       search.createColumn({name: "custevent_ht_rc_parlantes",}),
                                       search.createColumn({name: "custevent_ht_rc_antena",}),
                                       search.createColumn({name: "custevent_ht_rc_manualcarro",}),
                                       search.createColumn({name: "custevent_ht_rc_llantaemergencia",}),
                                       search.createColumn({name: "custevent_ht_rc_lucesyfaros",}),
                                       search.createColumn({name: "custevent_ht_rc_micasdeluces",}),
                                       search.createColumn({name: "custevent_ht_rc_cabecera",}),
                                       search.createColumn({name: "custevent_ht_rc_herramientas",}),
                                       search.createColumn({name: "custevent_ht_rc_gata",}),
                                       search.createColumn({name: "custevent_ht_rc_llaverueda",}),
                                       search.createColumn({ name: "custevent_ht_rc_odometro", label: "Odomoetro" }),
                                       search.createColumn({ name: "custevent_ht_rc_cantidadllaves", label: "Canticad de Llaves " }),
                                       search.createColumn({ name: "custevent_ht_rc_fechaentrega", label: "Fecha Entrega" }),
                                       search.createColumn({ name: "custevent_ht_rc_novedades", label: "Novedades" }),
                                       search.createColumn({ name: "custevent_ht_rc_combustible", label: "Combustible" }),
                                       search.createColumn({ name: "custevent_ht_rc_cantidadcontroles", label: "Cantidad de Controlles" }),
                                       search.createColumn({ name: "custevent_ht_rc_horaentrega", label: "Hora de Entrega" }),
                                    ]
                                });
                                let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                                if (searchResult.length) {
                                    accesorio[0] = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                                    accesorio[1] = searchResult[0].getValue(RecepcionSearchObj.columns[1]);
                                    accesorio[2] = searchResult[0].getValue(RecepcionSearchObj.columns[2]);
                                    accesorio[3] = searchResult[0].getValue(RecepcionSearchObj.columns[3]);
                                    accesorio[4] = searchResult[0].getValue(RecepcionSearchObj.columns[4]);
                                    accesorio[5] = searchResult[0].getValue(RecepcionSearchObj.columns[5]);
                                    accesorio[6] = searchResult[0].getValue(RecepcionSearchObj.columns[6]);
                                    accesorio[7] = searchResult[0].getValue(RecepcionSearchObj.columns[7]);
                                    accesorio[8] = searchResult[0].getValue(RecepcionSearchObj.columns[8]);
                                    accesorio[9] = searchResult[0].getValue(RecepcionSearchObj.columns[9]);
                                    accesorio[10] = searchResult[0].getValue(RecepcionSearchObj.columns[10]);
                                    accesorio[11] = searchResult[0].getValue(RecepcionSearchObj.columns[11]);
                                    accesorio[12] = searchResult[0].getValue(RecepcionSearchObj.columns[12]);
                                    accesorio[13] = searchResult[0].getValue(RecepcionSearchObj.columns[13]);
                                    accesorio[14] = searchResult[0].getValue(RecepcionSearchObj.columns[14]);
                                    accesorio[15] = searchResult[0].getValue(RecepcionSearchObj.columns[15]);
                                    accesorio[16] = searchResult[0].getValue(RecepcionSearchObj.columns[16]);
                                    accesorio[17] = searchResult[0].getValue(RecepcionSearchObj.columns[17]);
                                    accesorio[18] = searchResult[0].getValue(RecepcionSearchObj.columns[18]);
                                    accesorio[19] = searchResult[0].getValue(RecepcionSearchObj.columns[19]);
                                    accesorio[20] = searchResult[0].getValue(RecepcionSearchObj.columns[20]);
                                    accesorio[21] = searchResult[0].getValue(RecepcionSearchObj.columns[21]);
                                    accesorio[22] = searchResult[0].getValue(RecepcionSearchObj.columns[22]);
                                    accesorio[23] = searchResult[0].getValue(RecepcionSearchObj.columns[23]);
                                    accesorio[24] = searchResult[0].getValue(RecepcionSearchObj.columns[24]);
                                    accesorio[25] = searchResult[0].getValue(RecepcionSearchObj.columns[25]);
                                    accesorio[26] = searchResult[0].getValue(RecepcionSearchObj.columns[26]);
                                    accesorio[27] = searchResult[0].getValue(RecepcionSearchObj.columns[27]);
                                    accesorio[28] = searchResult[0].getValue(RecepcionSearchObj.columns[28]);
                                    accesorio[29] = searchResult[0].getValue(RecepcionSearchObj.columns[29]);
                                    accesorio[30] = searchResult[0].getValue(RecepcionSearchObj.columns[30]);
                                    accesorio[31] = searchResult[0].getValue(RecepcionSearchObj.columns[31]);
                                    accesorio[32] = searchResult[0].getValue(RecepcionSearchObj.columns[32]);
                                    accesorio[33] = searchResult[0].getValue(RecepcionSearchObj.columns[33]);
                                    accesorio[34] = searchResult[0].getValue(RecepcionSearchObj.columns[34]);
                                    accesorio[35] = searchResult[0].getValue(RecepcionSearchObj.columns[35]);
                                    accesorio[36] = searchResult[0].getValue(RecepcionSearchObj.columns[36]);
                                    accesorio[37] = searchResult[0].getValue(RecepcionSearchObj.columns[37]);
                                }

        
                                jsonRecepcion = [{
                                    clienteid: clienteid,
                                    ceduleruc: ceduleruc == '- None -' ? '' : ceduleruc,
                                    cliente: cliente,
                                    direccion: direccion,
                                    telefono: telefono == '- None -' ? '' : telefono,
                                    email: email == '- None -' ? '' : email,
                                }];
        
                                jsonOrdenServicio.push({
                                    ordenServicioid: ordenServicioid,
                                    vehiculoid: vehiculoid,
                                    ordenServicio: ordenServicio,
                                    vehiculo: vehiculo,
                                    motor: motor,
                                    chasis: chasis,
                                    comentarioTec: consideracion,
                                    estadoot: estadoot,
                                    placaColor: placa + '/' + color,
                                    marcaModeloVersion: marca + '/'+ modelo + '/' + version,
                                    anio: anio,
                                    trabajo: trabajo,
                                    producto: prod,
                                    tipoTrabajo: trab,
                                    accesorioRadio: typeof accesorio[1] == 'undefined' ? '' : accesorio[1],
                                    accesorioPerillas: typeof accesorio[2] == 'undefined' ? '' : accesorio[2],
                                    accesorioTapaCombustible: typeof accesorio[3] == 'undefined' ? '' : accesorio[3],
                                    accesorioAlfombraPiso: typeof accesorio[4] == 'undefined' ? '' : accesorio[4],
                                    accesorioAireAcondicionado: typeof accesorio[5] == 'undefined' ? '' : accesorio[5],
                                    accesorioBrazosPlumas: typeof accesorio[6] == 'undefined' ? '' : accesorio[6],
                                    accesorioMascarrillas: typeof accesorio[7] == 'undefined' ? '' : accesorio[7],
                                    accesorioCenicero: typeof accesorio[8] == 'undefined' ? '' : accesorio[8],
                                    accesorioChicotes: typeof accesorio[9] == 'undefined' ? '' : accesorio[9],
                                    accesorioLucesParqueo: typeof accesorio[10] == 'undefined' ? '' : accesorio[10],
                                    accesorioTopesPuertas: typeof accesorio[11] == 'undefined' ? '' : accesorio[11],
                                    accesorioVidriosYSeguros: typeof accesorio[12] == 'undefined' ? '' : accesorio[12],
                                    accesorioMoquetas: typeof accesorio[13] == 'undefined' ? '' : accesorio[13],
                                    accesorioManualRadio: typeof accesorio[14] == 'undefined' ? '' : accesorio[14],
                                    accesorioPalanca: typeof accesorio[15] == 'undefined' ? '' : accesorio[15],
                                    accesorioEncendedor: typeof accesorio[16] == 'undefined' ? '' : accesorio[16],
                                    accesorioEspejoInterior: typeof accesorio[17] == 'undefined' ? '' : accesorio[17],
                                    accesorioEspejoExterior: typeof accesorio[18] == 'undefined' ? '' : accesorio[18],
                                    accesorioVentCalef: typeof accesorio[19] == 'undefined' ? '' : accesorio[19],
                                    accesorioTapaCubos: typeof accesorio[20] == 'undefined' ? '' : accesorio[20],
                                    accesorioParlantes: typeof accesorio[21] == 'undefined' ? '' : accesorio[21],
                                    accesorioAntena: typeof accesorio[22] == 'undefined' ? '' : accesorio[22],
                                    accesorioManualCarro: typeof accesorio[23] == 'undefined' ? '' : accesorio[23],
                                    accesorioLlantaEmergencia: typeof accesorio[24] == 'undefined' ? '' : accesorio[24],
                                    accesorioLucesYFaros: typeof accesorio[25] == 'undefined' ? '' : accesorio[25],
                                    accesorioMicasDeLuces: typeof accesorio[26] == 'undefined' ? '' : accesorio[26],
                                    accesorioCabecera: typeof accesorio[27] == 'undefined' ? '' : accesorio[27],
                                    accesorioHerramientas: typeof accesorio[28] == 'undefined' ? '' : accesorio[28],
                                    accesorioGata: typeof accesorio[29] == 'undefined' ? '' : accesorio[29],
                                    accesorioLlaveRueda: typeof accesorio[30] == 'undefined' ? '' : accesorio[30],
                                    odometro: typeof accesorio[31] == 'undefined' ? '' : accesorio[31],
                                    cantidadllaves: typeof accesorio[32] == 'undefined' ? '' : accesorio[32],
                                    fechaEntrega: typeof accesorio[33] == 'undefined' ? '' : accesorio[33],
                                    novedades: typeof accesorio[34] == 'undefined' ? '' : accesorio[34],
                                    combustible: typeof accesorio[35] == 'undefined' ? '' : accesorio[35],
                                    cntidadControles: typeof accesorio[36] == 'undefined' ? '' : accesorio[36],
                                    horaEntrega: typeof accesorio[37] == 'undefined' ? '' : accesorio[37]
                                });
                            return true;
                        });
        
                        //let newArray = groupById(jsonOrdenServicio);

                        let hash = {};
                        jsonOrdenServicio = jsonOrdenServicio.filter(current => {
                        let exists = !hash[current.ordenServicioid];
                        hash[current.ordenServicioid] = true;
                        return exists;
                        });
                        
                        jsonResponse.push({
                            cabecera : jsonRecepcion,
                            detalle: jsonOrdenServicio
                        });
            
                        // let myPagedData = mySearch.runPaged();
                        // jsonMapping = {
                        //     query: scriptContext,
                        //     result: myPagedData.count
                        // }
                        // log.debug('Request', jsonMapping);
                        // // let searchResult = mySearch.run().getRange({ start: 0, end: 1000 });
                        // // log.debug('RESObj', searchResult);
                        // myPagedData.pageRanges.forEach(pageRange => {
                        //     let myPage = myPagedData.fetch({ index: pageRange.index });
                        //     myPage.data.forEach(result => {
                        //         let lookupFieldsvatregnumber = '';
                        //         let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                        //         try {
                        //              lookupFieldsvatregnumber = search.lookupFields({ type: 'customer', id: clienteid, columns: ['vatregnumber'] });
                        //              lookupFieldsvatregnumber = lookupFieldsvatregnumber.vatregnumber.length ? lookupFieldsvatregnumber.vatregnumber : '';
                        //         } catch (error) {}
                                
                        //         let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                        //         let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                        //         let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }) //^REQUERIDO POR HUNTER
                        //         let consecionarioid = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) //^REQUERIDO POR HUNTER
                        //         let consecionario = result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) == '- None -' ? '':  
                        //         result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[1] + ' ' + result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[2] //^REQUERIDO POR HUNTER
                        //         let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }) //^REQUERIDO POR HUNTER
                        //        // let cliente = result.getText({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                        //         let cliente = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                        //         let fechaTrabajo = result.getValue({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }) //^REQUERIDO POR HUNTER
                        //         let horaTrabajo = result.getValue({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }) //^REQUERIDO POR HUNTER
                        //         let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }) //^REQUERIDO POR HUNTER 
                        //         let vehiculo = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_VEHICULO", summary: "GROUP", label: "Name" }) //^REQUERIDO POR HUNTER 
                        //         let tallerid = result.getValue({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) //^REQUERIDO POR HUNTER
                        //         let taller = result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }).split(' ')[1]  //^REQUERIDO POR HUNTER
                        //         let comentario = result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" })  //^REQUERIDO POR HUNTER
                        //         let comentarioTec = result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) //^REQUERIDO POR HUNTER
                        //         let tecnicoid = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })
                        //         let tecnico = result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })/*.split(' - ')[1] */ //^REQUERIDO POR HUNTER
                        //         let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" })
                        //         let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" })
                        //         //let producto = result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                        //         let producto = result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                        //         let direccion = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" })
                        //         let email = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" })
                        //         let telefono = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" })
                        //         let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" })
                        //         let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" })
                        //         let tipoTrabajo = result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                        //         //let ceduleruc = result.getValue({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Doc. Number"})
                        //         let ceduleruc = lookupFieldsvatregnumber;
                        //         let memo = result.getValue({ name: "custbodyec_nota_cliente", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Memo" })
                        //         let consideracion = result.getValue({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" })
                        //         let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" })
                        //         let color = result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })  == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })
                        //         let marca = result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" })
                        //         let modelo = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" })
                        //         let version = result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" })
                        //         let serie = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" })
                        //         let modeloDisp = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo"})
                        //         let unidad = result.getValue({ name:"custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" })
                        //         let vid = result.getValue({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" })
                        //         let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" })
                        //         let simcard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" })
                        //         let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" })
                        //         let fimware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" })
                        //         let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" })
                        //         let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" })
                        //         let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                        //         let ubicacion = result.getValue({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" })
                                   
                        //         let sql = 'SELECT assemblycomponent, memo, itemtype FROM TransactionLine WHERE transaction = ?';
                        //         let params = [ordenServicioid]
                        //         let array = new Array();
                        //         let trabajo = '';
                        //         let resultSet = query.runSuiteQL({ query: sql, params: params });
                        //         let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                        //         if (results.length > 0) {
                        //             for (let i in results) {
                        //                 if ((results[i]['itemtype'] == "Assembly" || results[i]['itemtype'] == "Service" || results[i]['itemtype'] == "InvtPart") && results[i]['assemblycomponent'] == 'F') {
                        //                     array.push(results[i]['memo']);
                        //                 }
                        //             }
                        //             for (let j in array) {
                        //                 trabajo =
                        //                 trabajo + array[j] + ';'
                        //             }
                        //         } 
        
                        //         consideracion == '- None -' ? '' :consideracion;
                        //         let accesorio = [];
                        //         //Buscar Recepcion
                        //         let RecepcionSearchObj = search.create({
                        //             type: "calendarevent",
                        //             filters:
                        //             [
                        //                ["transaction.internalid","anyof",ordenServicioid]
                        //             ],
                        //             columns:
                        //             [
                        //                search.createColumn({name: "title",label: "Recepción"}),
                        //                search.createColumn({name: "custevent_ht_rc_radio",}),
                        //                search.createColumn({name: "custevent_ht_rc_perillas",}),
                        //                search.createColumn({name: "custevent_ht_rc_tapacombustible",}),
                        //                search.createColumn({name: "custevent_ht_rc_alfombrapiso",}),
                        //                search.createColumn({name: "custevent_ht_rc_aireacondicionado",}),
                        //                search.createColumn({name: "custevent_ht_rc_brazosplumas",}),
                        //                search.createColumn({name: "custevent_ht_rc_mascarillas",}),
                        //                search.createColumn({name: "custevent_ht_rc_cenicero",}),
                        //                search.createColumn({name: "custevent_ht_rc_chicotes",}),
                        //                search.createColumn({name: "custevent_ht_rc_lucesparqueo",}),
                        //                search.createColumn({name: "custevent_ht_rc_topespuertas",}),
                        //                search.createColumn({name: "custevent_ht_rc_vidriosyseguros",}),
                        //                search.createColumn({name: "custevent_ht_rc_moquetas",}),
                        //                search.createColumn({name: "custevent_ht_rc_manualradio",}),
                        //                search.createColumn({name: "custevent_ht_rc_palanca",}),
                        //                search.createColumn({name: "custevent_ht_rc_encededor",}),
                        //                search.createColumn({name: "custevent_ht_rc_espejointerior",}),
                        //                search.createColumn({name: "custevent_ht_rc_espejoexterior",}),
                        //                search.createColumn({name: "custevent_ht_rc_ventcalef",}),
                        //                search.createColumn({name: "custevent_ht_rc_tapacubos",}),
                        //                search.createColumn({name: "custevent_ht_rc_parlantes",}),
                        //                search.createColumn({name: "custevent_ht_rc_antena",}),
                        //                search.createColumn({name: "custevent_ht_rc_manualcarro",}),
                        //                search.createColumn({name: "custevent_ht_rc_llantaemergencia",}),
                        //                search.createColumn({name: "custevent_ht_rc_lucesyfaros",}),
                        //                search.createColumn({name: "custevent_ht_rc_micasdeluces",}),
                        //                search.createColumn({name: "custevent_ht_rc_cabecera",}),
                        //                search.createColumn({name: "custevent_ht_rc_herramientas",}),
                        //                search.createColumn({name: "custevent_ht_rc_gata",}),
                        //                search.createColumn({name: "custevent_ht_rc_llaverueda",}),
                        //                search.createColumn({ name: "custevent_ht_rc_odometro", label: "Odomoetro" }),
                        //                search.createColumn({ name: "custevent_ht_rc_cantidadllaves", label: "Canticad de Llaves " }),
                        //                search.createColumn({ name: "custevent_ht_rc_fechaentrega", label: "Fecha Entrega" }),
                        //                search.createColumn({ name: "custevent_ht_rc_novedades", label: "Novedades" }),
                        //                search.createColumn({ name: "custevent_ht_rc_combustible", label: "Combustible" }),
                        //                search.createColumn({ name: "custevent_ht_rc_cantidadcontroles", label: "Cantidad de Controlles" }),
                        //                search.createColumn({ name: "custevent_ht_rc_horaentrega", label: "Hora de Entrega" }),
                        //             ]
                        //         });
                        //         let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                        //         if (searchResult.length) {
                        //             accesorio[0] = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                        //             accesorio[1] = searchResult[0].getValue(RecepcionSearchObj.columns[1]);
                        //             accesorio[2] = searchResult[0].getValue(RecepcionSearchObj.columns[2]);
                        //             accesorio[3] = searchResult[0].getValue(RecepcionSearchObj.columns[3]);
                        //             accesorio[4] = searchResult[0].getValue(RecepcionSearchObj.columns[4]);
                        //             accesorio[5] = searchResult[0].getValue(RecepcionSearchObj.columns[5]);
                        //             accesorio[6] = searchResult[0].getValue(RecepcionSearchObj.columns[6]);
                        //             accesorio[7] = searchResult[0].getValue(RecepcionSearchObj.columns[7]);
                        //             accesorio[8] = searchResult[0].getValue(RecepcionSearchObj.columns[8]);
                        //             accesorio[9] = searchResult[0].getValue(RecepcionSearchObj.columns[9]);
                        //             accesorio[10] = searchResult[0].getValue(RecepcionSearchObj.columns[10]);
                        //             accesorio[11] = searchResult[0].getValue(RecepcionSearchObj.columns[11]);
                        //             accesorio[12] = searchResult[0].getValue(RecepcionSearchObj.columns[12]);
                        //             accesorio[13] = searchResult[0].getValue(RecepcionSearchObj.columns[13]);
                        //             accesorio[14] = searchResult[0].getValue(RecepcionSearchObj.columns[14]);
                        //             accesorio[15] = searchResult[0].getValue(RecepcionSearchObj.columns[15]);
                        //             accesorio[16] = searchResult[0].getValue(RecepcionSearchObj.columns[16]);
                        //             accesorio[17] = searchResult[0].getValue(RecepcionSearchObj.columns[17]);
                        //             accesorio[18] = searchResult[0].getValue(RecepcionSearchObj.columns[18]);
                        //             accesorio[19] = searchResult[0].getValue(RecepcionSearchObj.columns[19]);
                        //             accesorio[20] = searchResult[0].getValue(RecepcionSearchObj.columns[20]);
                        //             accesorio[21] = searchResult[0].getValue(RecepcionSearchObj.columns[21]);
                        //             accesorio[22] = searchResult[0].getValue(RecepcionSearchObj.columns[22]);
                        //             accesorio[23] = searchResult[0].getValue(RecepcionSearchObj.columns[23]);
                        //             accesorio[24] = searchResult[0].getValue(RecepcionSearchObj.columns[24]);
                        //             accesorio[25] = searchResult[0].getValue(RecepcionSearchObj.columns[25]);
                        //             accesorio[26] = searchResult[0].getValue(RecepcionSearchObj.columns[26]);
                        //             accesorio[27] = searchResult[0].getValue(RecepcionSearchObj.columns[27]);
                        //             accesorio[28] = searchResult[0].getValue(RecepcionSearchObj.columns[28]);
                        //             accesorio[29] = searchResult[0].getValue(RecepcionSearchObj.columns[29]);
                        //             accesorio[30] = searchResult[0].getValue(RecepcionSearchObj.columns[30]);
                        //             accesorio[31] = searchResult[0].getValue(RecepcionSearchObj.columns[31]);
                        //             accesorio[32] = searchResult[0].getValue(RecepcionSearchObj.columns[32]);
                        //             accesorio[33] = searchResult[0].getValue(RecepcionSearchObj.columns[33]);
                        //             accesorio[34] = searchResult[0].getValue(RecepcionSearchObj.columns[34]);
                        //             accesorio[35] = searchResult[0].getValue(RecepcionSearchObj.columns[35]);
                        //             accesorio[36] = searchResult[0].getValue(RecepcionSearchObj.columns[36]);
                        //             accesorio[37] = searchResult[0].getValue(RecepcionSearchObj.columns[37]);
                        //         }
        
                        //         jsonRecepcion = [{
                        //             clienteid: clienteid,
                        //             ceduleruc: ceduleruc == '- None -' ? '' : ceduleruc,
                        //             cliente: cliente,
                        //             direccion: direccion,
                        //             telefono: telefono == '- None -' ? '' : telefono,
                        //             email: email == '- None -' ? '' : email,
                        //         }];
        
                        //         jsonOrdenServicio.push({
                        //             ordenServicioid: ordenServicioid
                        //         });
            
        
                        //         jsonResponse.push({
                        //             bloque1 : jsonRecepcion,
                        //             bloque2: jsonOrdenServicio
                        //         });
                        //     });
                        // });
                        return jsonResponse;
                    } else {
                        return []
                    }
                } else if (scriptContext.accion == ORIGINAL){
                    log.debug('Response', 'original');
                    const mySearch = search.create({
                        type: HT_ORDEN_TRABAJO_RECORD,
                        filters: filter,
                        columns:
                            [
                                search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                                search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                                search.createColumn({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }),
                                search.createColumn({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }), 
                                search.createColumn({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }), 
                                search.createColumn({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }), 
                                search.createColumn({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }), 
                                search.createColumn({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }), 
                                search.createColumn({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }),  
                                search.createColumn({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }),
                                search.createColumn({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }), 
                                search.createColumn({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }), 
                                search.createColumn({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }),
                                search.createColumn({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" }),
                                search.createColumn({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" }),
                                //search.createColumn({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }), 
                                search.createColumn({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }),
                                search.createColumn({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }),
                                search.createColumn({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" }),
                                search.createColumn({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" }),
                                search.createColumn({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" }),
                                search.createColumn({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" }),
                                search.createColumn({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }),
                                search.createColumn({ name: "altname", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Name"}),
                                search.createColumn({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Doc. Number"}),
                                search.createColumn({name: "altname",join: "CUSTRECORD_HT_OT_VEHICULO",summary: "GROUP",label: "Name"}),
                                search.createColumn({ name: "custbodyec_nota_cliente", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Memo" }),
                                search.createColumn({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" }),
                                search.createColumn({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }),
                                search.createColumn({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" }),
                                search.createColumn({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }),
                                search.createColumn({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }),
                                search.createColumn({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }),
                                search.createColumn({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" }),
                                search.createColumn({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo" }),
                                search.createColumn({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" }),
                                search.createColumn({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" }),
                                search.createColumn({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" }),
                                search.createColumn({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" }),
                                search.createColumn({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" }),
                                search.createColumn({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" }),
                                search.createColumn({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" }),
                                search.createColumn({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" }),
                                search.createColumn({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" }),
                                search.createColumn({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" }),
                                search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado OT" })
                            ]
                    });

                    let myPagedData = mySearch.runPaged();
                        jsonMapping = {
                            query: scriptContext,
                            result: myPagedData.count
                        }
                        log.debug('Request', jsonMapping);
                        myPagedData.pageRanges.forEach(pageRange => {
                            let myPage = myPagedData.fetch({ index: pageRange.index });
                            myPage.data.forEach(result => {
                                let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                                // log.debug('remainingUsage CONSUMIDO', remainingUsage);
                                if (remainingUsage < 30) {
                                    return false;
                                }
                                let lookupFieldsvatregnumber = '';
                                let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                                try {
                                     lookupFieldsvatregnumber = search.lookupFields({ type: 'customer', id: clienteid, columns: ['vatregnumber'] });
                                     lookupFieldsvatregnumber = lookupFieldsvatregnumber.vatregnumber.length ? lookupFieldsvatregnumber.vatregnumber : '';
                                } catch (error) {}
                                let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                                let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                                let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }) //^REQUERIDO POR HUNTER
                                let consecionarioid = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) //^REQUERIDO POR HUNTER
                                let consecionario = result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) == '- None -' ? '':  
                                result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[1] + ' ' + result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[2] //^REQUERIDO POR HUNTER
                                let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }) //^REQUERIDO POR HUNTER
                               // let cliente = result.getText({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                                let cliente = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                                let fechaTrabajo = result.getValue({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }) //^REQUERIDO POR HUNTER
                                let horaTrabajo = result.getValue({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }) //^REQUERIDO POR HUNTER
                                let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }) //^REQUERIDO POR HUNTER 
                                let vehiculo = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_VEHICULO", summary: "GROUP", label: "Name" }) //^REQUERIDO POR HUNTER 
                                let tallerid = result.getValue({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) //^REQUERIDO POR HUNTER
                                let taller = result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }).split(' ')[1]  //^REQUERIDO POR HUNTER
                                let comentario = result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" })  //^REQUERIDO POR HUNTER
                                let comentarioTec = result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) //^REQUERIDO POR HUNTER
                                let tecnicoid = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })
                                let tecnico = result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })/*.split(' - ')[1] */ //^REQUERIDO POR HUNTER
                                let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" })
                                let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" })
                                //let producto = result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                                let producto = result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                                let direccion = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" })
                                let email = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" })
                                let telefono = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" })
                                let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" })
                                let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" })
                                let tipoTrabajo = result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                                //let ceduleruc = result.getValue({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Doc. Number"})
                                let ceduleruc = lookupFieldsvatregnumber;
                                let memo = result.getValue({ name: "custbodyec_nota_cliente", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Memo" })
                                let consideracion = result.getValue({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" })
                                let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" })
                                let color = result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })  == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })
                                let marca = result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" })
                                let modelo = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" })
                                let version = result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" })
                                let serie = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" })
                                let modeloDisp = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo"})
                                let unidad = result.getValue({ name:"custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" })
                                let vid = result.getValue({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" })
                                let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" })
                                let simcard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" })
                                let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" })
                                let fimware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" })
                                let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" })
                                let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" })
                                let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                                let ubicacion = result.getValue({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" })
                                   
                                let sql = 'SELECT assemblycomponent, memo, itemtype FROM TransactionLine WHERE transaction = ?';
                                let params = [ordenServicioid]
                                let array = new Array();
                                let trabajo = '';
                                let resultSet = query.runSuiteQL({ query: sql, params: params });
                                let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                                if (results.length > 0) {
                                    for (let i in results) {
                                        if ((results[i]['itemtype'] == "Assembly" || results[i]['itemtype'] == "Service" || results[i]['itemtype'] == "InvtPart") && results[i]['assemblycomponent'] == 'F') {
                                            array.push(results[i]['memo']);
                                        }
                                    }
                                    for (let j in array) {
                                        trabajo =
                                        trabajo + array[j] + ';'
                                    }
                                } 
        
                                consideracion == '- None -' ? '' :consideracion;
                                let accesorio = [];
                                //Buscar Recepcion
                                let RecepcionSearchObj = search.create({
                                    type: "calendarevent",
                                    filters:
                                    [
                                       ["transaction.internalid","anyof",ordenServicioid]
                                    ],
                                    columns:
                                    [
                                       search.createColumn({name: "title",label: "Recepción"}),
                                       search.createColumn({name: "custevent_ht_rc_radio",}),
                                       search.createColumn({name: "custevent_ht_rc_perillas",}),
                                       search.createColumn({name: "custevent_ht_rc_tapacombustible",}),
                                       search.createColumn({name: "custevent_ht_rc_alfombrapiso",}),
                                       search.createColumn({name: "custevent_ht_rc_aireacondicionado",}),
                                       search.createColumn({name: "custevent_ht_rc_brazosplumas",}),
                                       search.createColumn({name: "custevent_ht_rc_mascarillas",}),
                                       search.createColumn({name: "custevent_ht_rc_cenicero",}),
                                       search.createColumn({name: "custevent_ht_rc_chicotes",}),
                                       search.createColumn({name: "custevent_ht_rc_lucesparqueo",}),
                                       search.createColumn({name: "custevent_ht_rc_topespuertas",}),
                                       search.createColumn({name: "custevent_ht_rc_vidriosyseguros",}),
                                       search.createColumn({name: "custevent_ht_rc_moquetas",}),
                                       search.createColumn({name: "custevent_ht_rc_manualradio",}),
                                       search.createColumn({name: "custevent_ht_rc_palanca",}),
                                       search.createColumn({name: "custevent_ht_rc_encededor",}),
                                       search.createColumn({name: "custevent_ht_rc_espejointerior",}),
                                       search.createColumn({name: "custevent_ht_rc_espejoexterior",}),
                                       search.createColumn({name: "custevent_ht_rc_ventcalef",}),
                                       search.createColumn({name: "custevent_ht_rc_tapacubos",}),
                                       search.createColumn({name: "custevent_ht_rc_parlantes",}),
                                       search.createColumn({name: "custevent_ht_rc_antena",}),
                                       search.createColumn({name: "custevent_ht_rc_manualcarro",}),
                                       search.createColumn({name: "custevent_ht_rc_llantaemergencia",}),
                                       search.createColumn({name: "custevent_ht_rc_lucesyfaros",}),
                                       search.createColumn({name: "custevent_ht_rc_micasdeluces",}),
                                       search.createColumn({name: "custevent_ht_rc_cabecera",}),
                                       search.createColumn({name: "custevent_ht_rc_herramientas",}),
                                       search.createColumn({name: "custevent_ht_rc_gata",}),
                                       search.createColumn({name: "custevent_ht_rc_llaverueda",}),
                                       search.createColumn({ name: "custevent_ht_rc_odometro", label: "Odomoetro" }),
                                       search.createColumn({ name: "custevent_ht_rc_cantidadllaves", label: "Canticad de Llaves " }),
                                       search.createColumn({ name: "custevent_ht_rc_fechaentrega", label: "Fecha Entrega" }),
                                       search.createColumn({ name: "custevent_ht_rc_novedades", label: "Novedades" }),
                                       search.createColumn({ name: "custevent_ht_rc_combustible", label: "Combustible" }),
                                       search.createColumn({ name: "custevent_ht_rc_cantidadcontroles", label: "Cantidad de Controlles" }),
                                       search.createColumn({ name: "custevent_ht_rc_horaentrega", label: "Hora de Entrega" }),
                                    ]
                                });
                                let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                                if (searchResult.length) {
                                    accesorio[0] = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                                    accesorio[1] = searchResult[0].getValue(RecepcionSearchObj.columns[1]);
                                    accesorio[2] = searchResult[0].getValue(RecepcionSearchObj.columns[2]);
                                    accesorio[3] = searchResult[0].getValue(RecepcionSearchObj.columns[3]);
                                    accesorio[4] = searchResult[0].getValue(RecepcionSearchObj.columns[4]);
                                    accesorio[5] = searchResult[0].getValue(RecepcionSearchObj.columns[5]);
                                    accesorio[6] = searchResult[0].getValue(RecepcionSearchObj.columns[6]);
                                    accesorio[7] = searchResult[0].getValue(RecepcionSearchObj.columns[7]);
                                    accesorio[8] = searchResult[0].getValue(RecepcionSearchObj.columns[8]);
                                    accesorio[9] = searchResult[0].getValue(RecepcionSearchObj.columns[9]);
                                    accesorio[10] = searchResult[0].getValue(RecepcionSearchObj.columns[10]);
                                    accesorio[11] = searchResult[0].getValue(RecepcionSearchObj.columns[11]);
                                    accesorio[12] = searchResult[0].getValue(RecepcionSearchObj.columns[12]);
                                    accesorio[13] = searchResult[0].getValue(RecepcionSearchObj.columns[13]);
                                    accesorio[14] = searchResult[0].getValue(RecepcionSearchObj.columns[14]);
                                    accesorio[15] = searchResult[0].getValue(RecepcionSearchObj.columns[15]);
                                    accesorio[16] = searchResult[0].getValue(RecepcionSearchObj.columns[16]);
                                    accesorio[17] = searchResult[0].getValue(RecepcionSearchObj.columns[17]);
                                    accesorio[18] = searchResult[0].getValue(RecepcionSearchObj.columns[18]);
                                    accesorio[19] = searchResult[0].getValue(RecepcionSearchObj.columns[19]);
                                    accesorio[20] = searchResult[0].getValue(RecepcionSearchObj.columns[20]);
                                    accesorio[21] = searchResult[0].getValue(RecepcionSearchObj.columns[21]);
                                    accesorio[22] = searchResult[0].getValue(RecepcionSearchObj.columns[22]);
                                    accesorio[23] = searchResult[0].getValue(RecepcionSearchObj.columns[23]);
                                    accesorio[24] = searchResult[0].getValue(RecepcionSearchObj.columns[24]);
                                    accesorio[25] = searchResult[0].getValue(RecepcionSearchObj.columns[25]);
                                    accesorio[26] = searchResult[0].getValue(RecepcionSearchObj.columns[26]);
                                    accesorio[27] = searchResult[0].getValue(RecepcionSearchObj.columns[27]);
                                    accesorio[28] = searchResult[0].getValue(RecepcionSearchObj.columns[28]);
                                    accesorio[29] = searchResult[0].getValue(RecepcionSearchObj.columns[29]);
                                    accesorio[30] = searchResult[0].getValue(RecepcionSearchObj.columns[30]);
                                    accesorio[31] = searchResult[0].getValue(RecepcionSearchObj.columns[31]);
                                    accesorio[32] = searchResult[0].getValue(RecepcionSearchObj.columns[32]);
                                    accesorio[33] = searchResult[0].getValue(RecepcionSearchObj.columns[33]);
                                    accesorio[34] = searchResult[0].getValue(RecepcionSearchObj.columns[34]);
                                    accesorio[35] = searchResult[0].getValue(RecepcionSearchObj.columns[35]);
                                    accesorio[36] = searchResult[0].getValue(RecepcionSearchObj.columns[36]);
                                    accesorio[37] = searchResult[0].getValue(RecepcionSearchObj.columns[37]);
                                }
        
                                jsonResult.push({
                                    ordenServicioid: ordenServicioid,
                                    ordenTrabajoid: ordenTrabajoid,
                                    clienteid: clienteid,
                                    vehiculoid: vehiculoid,
                                    tallerid: tallerid,
                                    consecionarioid: consecionarioid,
                                    tecnicoid: tecnicoid,
                                    ordenServicio: ordenServicio,
                                    ordenTrabajo: ordenTrabajo,
                                    ceduleruc: ceduleruc == '- None -' ? '' : ceduleruc,
                                    cliente: cliente,
                                    vehiculo: vehiculo,
                                    taller: taller,
                                    consecionario: consecionario,
                                    fechaTrabajo: fechaTrabajo,
                                    horaTrabajo: horaTrabajo,
                                    comentario: comentario,
                                    comentarioTec: comentarioTec,
                                    tecnico: tecnico,
                                    fueraCuidad: fueraCuidad,
                                    fueraTaller: fueraTaller,
                                    producto: producto,
                                    direccion: direccion,
                                    email: email == '- None -' ? '' : email,
                                    telefono: telefono == '- None -' ? '' : telefono,
                                    motor: motor,
                                    chasis: chasis,
                                    tipoTrabajo: tipoTrabajo,
                                    nota: memo == '- None -' ? '' : memo,
                                    consideracionTrabajoTecnico: consideracion == '- None -' ? '' : consideracion,
                                    placaColor: placa + '/' + color,
                                    marcaModeloVersion: marca + '/'+ modelo + '/' + version,
                                    trabajo: trabajo,
                                    serie: serie == '- None -' ? '' : serie,
                                    modelo: modeloDisp == '- None -' ? '' : modeloDisp,
                                    unidad: unidad == '- None -' ? '' : unidad,
                                    vid: vid == '- None -' ? '' : vid,
                                    ip: ip == '- None -' ? '' : ip,
                                    simcard: simcard == '- None -' ? '' : simcard,
                                    servidor: servidor == '- None -' ? '' : servidor,
                                    fimware: fimware == '- None -' ? '' : fimware,
                                    script: script == '- None -' ? '' : script,
                                    apn: apn == '- None -' ? '' : apn,
                                    imei: imei == '- None -' ? '' : imei,
                                    ubicacion: ubicacion == '- None -' ? '' : ubicacion,
                                    accesorioRadio: accesorio[1],
                                    accesorioPerillas: accesorio[2],
                                    accesorioTapaCombustible: accesorio[3],
                                    accesorioAlfombraPiso: accesorio[4],
                                    accesorioAireAcondicionado: accesorio[5],
                                    accesorioBrazosPlumas: accesorio[6],
                                    accesorioMascarrillas: accesorio[7],
                                    accesorioCenicero: accesorio[8],
                                    accesorioChicotes: accesorio[9],
                                    accesorioLucesParqueo: accesorio[10],
                                    accesorioTopesPuertas: accesorio[11],
                                    accesorioVidriosYSeguros: accesorio[12],
                                    accesorioMoquetas: accesorio[13],
                                    accesorioManualRadio: accesorio[14],
                                    accesorioPalanca: accesorio[15],
                                    accesorioEncendedor: accesorio[16],
                                    accesorioEspejoInterior: accesorio[17],
                                    accesorioEspejoExterior: accesorio[18],
                                    accesorioVentCalef: accesorio[19],
                                    accesorioTapaCubos: accesorio[20],
                                    accesorioParlantes: accesorio[21],
                                    accesorioAntena: accesorio[22],
                                    accesorioManualCarro: accesorio[23],
                                    accesorioLlantaEmergencia: accesorio[24],
                                    accesorioLucesYFaros: accesorio[25],
                                    accesorioMicasDeLuces: accesorio[26],
                                    accesorioCabecera: accesorio[27],
                                    accesorioHerramientas: accesorio[28],
                                    accesorioGata: accesorio[29],
                                    accesorioLlaveRueda: accesorio[30],
                                    odometro: accesorio[31],
                                    cantidadllaves: accesorio[32],
                                    fechaEntrega: accesorio[33],
                                    novedades: accesorio[34],
                                    combustible: accesorio[35],
                                    cntidadControles: accesorio[36],
                                    horaEntrega: accesorio[37]
                                });
                            });
                        });
                        return jsonResult;
                } else if (scriptContext.accion == ASIGNACION) {
                    log.debug('Response', scriptContext.accion);
                    if (typeof scriptContext.desde != 'undefined' && typeof scriptContext.hasta != 'undefined') {
                        let from = esFechaValida(scriptContext.desde);
                        let to = esFechaValida(scriptContext.hasta);
                        if (from == true && to == true) {
                            filter.push("AND", ["custrecord_ht_ot_orden_servicio.trandate", "within", scriptContext.desde, scriptContext.hasta])
                            param = true;
                        } else {
                            return 'Las fechas ingresadas no son válidas';
                        }
                    }

                    if (typeof scriptContext.taller != 'undefined') {
                        if (scriptContext.taller.length != 0) {
                            filter.push("AND", ["custrecord_ht_ot_taller", "anyof", scriptContext.taller])
                            param = true;
                        }
                    }

                    if (typeof scriptContext.ordenservicio != 'undefined') {
                        if (scriptContext.ordenservicio.length != 0) {
                            filter.push("AND", ["custrecord_ht_ot_orden_serivicio_txt", "startswith", scriptContext.ordenservicio])
                            param = true;
                        }
                    }

                    if (typeof scriptContext.recepcionada != 'undefined') {
                        if (scriptContext.recepcionada.length != 0) {
                            if (scriptContext.recepcionada == 'true') {
                                log.debug('Entré:', 'TRUE')
                                filter.push("AND", ["custrecord_ht_ot_estado","anyof", CHEQUEADO, ENTREGADO_A_CLIENTE, PROCESANDO])
                            } else if (scriptContext.recepcionada == 'false') {
                                log.debug('Entré:', 'FALSE')
                                filter.push("AND", ["custrecord_ht_ot_estado","anyof", VENTA])
                            }
                            param = true;
                        }
                    }

                    if (param == false) {
                        return 'Filtro no válido para esta acción, revise sus parámetros';
                    }

                    const mySearch = search.create({
                        type: HT_ORDEN_TRABAJO_RECORD,
                        filters: filter,
                        columns:
                            [
                                search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                                search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                                search.createColumn({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }), 
                                search.createColumn({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }), 
                                search.createColumn({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }), 
                                // search.createColumn({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }), 
                                // search.createColumn({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }), 
                                search.createColumn({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }),  
                                search.createColumn({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }),
                                search.createColumn({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }), 
                                search.createColumn({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }), 
                                search.createColumn({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }),
                                search.createColumn({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" }),
                                search.createColumn({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" }),
                                search.createColumn({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }),
                                search.createColumn({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }),
                                search.createColumn({ name: "altname", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Name"}),
                                search.createColumn({name: "altname",join: "CUSTRECORD_HT_OT_VEHICULO",summary: "GROUP",label: "Name"}),
                                search.createColumn({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" }),
                                search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado Orden de Trabajo" }),
                            ]
                    });

                    let myPagedData = mySearch.runPaged();
                        jsonMapping = {
                            query: scriptContext,
                            result: myPagedData.count
                        }
                        log.debug('Request', jsonMapping);
                        myPagedData.pageRanges.forEach(pageRange => {
                            let myPage = myPagedData.fetch({ index: pageRange.index });
                            myPage.data.forEach(result => {
                                let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                                //log.debug('remainingUsage CONSUMIDO', remainingUsage);
                                if (remainingUsage < 30) {
                                    return false;
                                }
                                let lookupFieldsvatregnumber = '';
                                let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                                try {
                                     lookupFieldsvatregnumber = search.lookupFields({ type: 'customer', id: clienteid, columns: ['vatregnumber'] });
                                     lookupFieldsvatregnumber = lookupFieldsvatregnumber.vatregnumber.length ? lookupFieldsvatregnumber.vatregnumber : '';
                                } catch (error) {}
                                let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                                let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                                let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }) //^REQUERIDO POR HUNTER
                                let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }) //^REQUERIDO POR HUNTER
                                let cliente = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                                let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }) //^REQUERIDO POR HUNTER 
                                let vehiculo = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_VEHICULO", summary: "GROUP", label: "Name" }) //^REQUERIDO POR HUNTER 
                                let tallerid = result.getValue({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) //^REQUERIDO POR HUNTER
                                let taller = result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }).split(' ')[1]  //^REQUERIDO POR HUNTER
                                let comentario = result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" })  //^REQUERIDO POR HUNTER
                                let comentarioTec = result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) //^REQUERIDO POR HUNTER
                                let tecnicoid = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })
                                let tecnico = result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })/*.split(' - ')[1] */ //^REQUERIDO POR HUNTER
                                let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" })
                                let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" })
                                let producto = result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                                let tipoTrabajo = result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                                let consideracion = result.getValue({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" })
                                let estadoOT = result.getText({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado Orden de Trabajo" })
                                   
                                let sql = 'SELECT assemblycomponent, memo, itemtype FROM TransactionLine WHERE transaction = ?';
                                let params = [ordenServicioid]
                                let array = new Array();
                                let trabajo = '';
                                let resultSet = query.runSuiteQL({ query: sql, params: params });
                                let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                                if (results.length > 0) {
                                    for (let i in results) {
                                        if ((results[i]['itemtype'] == "Assembly" || results[i]['itemtype'] == "Service" || results[i]['itemtype'] == "InvtPart") && results[i]['assemblycomponent'] == 'F') {
                                            array.push(results[i]['memo']);
                                        }
                                    }
                                    for (let j in array) {
                                        trabajo =
                                        trabajo + array[j] + ';'
                                    }
                                } 
        
                                consideracion == '- None -' ? '' :consideracion;
                                let accesorio = [];
                                //Buscar Turno
                                let RecepcionSearchObj = search.create({
                                    type: "task",
                                    filters:
                                    [
                                       ["transaction.internalid","anyof",ordenServicioid]
                                    ],
                                    columns:
                                    [
                                       search.createColumn({name: "title",label: "Turno"}),                    
                                       search.createColumn({ name: "startdate", label: "Fecha Turno" }),
                                       search.createColumn({ name: "custevent_ht_tr_hora", label: "Hora Turno" }),
                                    ]
                                });
                                let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                                if (searchResult.length) {
                                    accesorio[0] = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                                    accesorio[1] = searchResult[0].getValue(RecepcionSearchObj.columns[1]);
                                    accesorio[2] = searchResult[0].getValue(RecepcionSearchObj.columns[2]);
                                }
        
                                jsonResult.push({
                                    ordenServicioid: ordenServicioid,
                                    ordenTrabajoid: ordenTrabajoid,
                                    clienteid: clienteid,
                                    vehiculoid: vehiculoid,
                                    tallerid: tallerid,
                                    tecnicoid: tecnicoid,
                                    ordenServicio: ordenServicio,
                                    ordenTrabajo: ordenTrabajo,
                                    estadoOT : estadoOT,
                                    cliente: cliente,
                                    vehiculo: vehiculo,
                                    taller: taller,
                                    fechaTurno: typeof accesorio[1] == 'undefined' ? '' : accesorio[1],
                                    horaTurno: typeof accesorio[2] == 'undefined' ? '' : accesorio[2],
                                    comentario: comentario,
                                    comentarioTec: comentarioTec,
                                    tecnico: tecnico,
                                    fueraCuidad: fueraCuidad,
                                    fueraTaller: fueraTaller,
                                    producto: producto,
                                    tipoTrabajo: tipoTrabajo,
                                });
                            });
                        });
                        let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                        log.debug('remainingUsage INICIAL', remainingUsage);
                        return jsonResult;
                } else if (scriptContext.accion == ASIGNADO) {
                    log.debug('Response', 'asignado');
                    if (typeof scriptContext.desde != 'undefined' && typeof scriptContext.hasta != 'undefined') {
                        let from = esFechaValida(scriptContext.desde);
                        let to = esFechaValida(scriptContext.hasta);
                        if (from == true && to == true) {
                            filter.push("AND", ["custrecord_ht_ot_orden_servicio.trandate", "within", scriptContext.desde, scriptContext.hasta])
                            param = true;
                        } else {
                            return 'Las fechas ingresadas no son válidas';
                        }
                    }

                    if (typeof scriptContext.tecnico != 'undefined') {
                        if (scriptContext.tecnico.length != 0) {
                            filter.push("AND", ["custrecord_ht_ot_tecnicoasignacion", "anyof", scriptContext.tecnico])
                            param = true;
                        }
                    }

                    if (typeof scriptContext.ordenservicio != 'undefined') {
                        if (scriptContext.ordenservicio.length != 0) {
                            filter.push("AND", ["custrecord_ht_ot_orden_serivicio_txt", "startswith", scriptContext.ordenservicio])
                            param = true;
                        }
                    }

                    if (param == false) {
                        return 'Filtro no válido para esta acción, revise sus parámetros';
                    }

                    const mySearch = search.create({
                        type: HT_ORDEN_TRABAJO_RECORD,
                        filters: filter,
                        columns:
                            [
                                search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                                search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                                search.createColumn({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }), 
                                search.createColumn({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }),
                                search.createColumn({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }), 
                                search.createColumn({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }), 
                                // search.createColumn({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }), 
                                // search.createColumn({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }), 
                                search.createColumn({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }),  
                                search.createColumn({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }),
                                search.createColumn({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }), 
                                search.createColumn({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }), 
                                search.createColumn({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }),
                                search.createColumn({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" }),
                                search.createColumn({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" }),
                                search.createColumn({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }),
                                search.createColumn({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }),
                                search.createColumn({ name: "altname", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Name"}),
                                search.createColumn({name: "altname",join: "CUSTRECORD_HT_OT_VEHICULO",summary: "GROUP",label: "Name"}),
                                search.createColumn({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" }),
                                search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado Orden de Trabajo" }),
                            ]
                    });

                    let myPagedData = mySearch.runPaged();
                        jsonMapping = {
                            query: scriptContext,
                            result: myPagedData.count
                        }
                        log.debug('Request', jsonMapping);
                        myPagedData.pageRanges.forEach(pageRange => {
                            let myPage = myPagedData.fetch({ index: pageRange.index });
                            myPage.data.forEach(result => {
                                let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                                //log.debug('remainingUsage CONSUMIDO', remainingUsage);
                                if (remainingUsage < 30) {
                                    return false;
                                }
                                let lookupFieldsvatregnumber = '';
                                let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                                try {
                                     lookupFieldsvatregnumber = search.lookupFields({ type: 'customer', id: clienteid, columns: ['vatregnumber'] });
                                     lookupFieldsvatregnumber = lookupFieldsvatregnumber.vatregnumber.length ? lookupFieldsvatregnumber.vatregnumber : '';
                                } catch (error) {}
                                let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                                let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                                let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }) //^REQUERIDO POR HUNTER
                                let consecionarioid = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) //^REQUERIDO POR HUNTER
                                let consecionario = result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) == '- None -' ? '':  
                                result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[1] + ' ' + result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[2] //^REQUERIDO POR HUNTER
                                let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }) //^REQUERIDO POR HUNTER
                                let cliente = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                                let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }) //^REQUERIDO POR HUNTER 
                                let vehiculo = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_VEHICULO", summary: "GROUP", label: "Name" }) //^REQUERIDO POR HUNTER 
                                let tallerid = result.getValue({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) //^REQUERIDO POR HUNTER
                                let taller = result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }).split(' ')[1]  //^REQUERIDO POR HUNTER
                                let comentario = result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" })  //^REQUERIDO POR HUNTER
                                let comentarioTec = result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) //^REQUERIDO POR HUNTER
                                let tecnicoid = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })
                                let tecnico = result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })/*.split(' - ')[1] */ //^REQUERIDO POR HUNTER
                                let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" })
                                let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" })
                                let producto = result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                                let tipoTrabajo = result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                                let consideracion = result.getValue({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" })
                                let estadoOT = result.getText({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado Orden de Trabajo" })
                                   
                                let sql = 'SELECT assemblycomponent, memo, itemtype FROM TransactionLine WHERE transaction = ?';
                                let params = [ordenServicioid]
                                let array = new Array();
                                let trabajo = '';
                                let resultSet = query.runSuiteQL({ query: sql, params: params });
                                let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                                if (results.length > 0) {
                                    for (let i in results) {
                                        if ((results[i]['itemtype'] == "Assembly" || results[i]['itemtype'] == "Service" || results[i]['itemtype'] == "InvtPart") && results[i]['assemblycomponent'] == 'F') {
                                            array.push(results[i]['memo']);
                                        }
                                    }
                                    for (let j in array) {
                                        trabajo =
                                        trabajo + array[j] + ';'
                                    }
                                } 
        
                                consideracion = consideracion == '- None -' ? '' : consideracion;
                                let accesorio = [];
                                //Buscar Turno
                                let RecepcionSearchObj = search.create({
                                    type: "task",
                                    filters:
                                    [
                                       ["transaction.internalid","anyof",ordenServicioid]
                                    ],
                                    columns:
                                    [
                                       search.createColumn({name: "title",label: "Turno"}),                    
                                       search.createColumn({ name: "startdate", label: "Fecha Turno" }),
                                       search.createColumn({ name: "custevent_ht_tr_hora", label: "Hora Turno" }),
                                    ]
                                });
                                let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                                if (searchResult.length) {
                                    accesorio[0] = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                                    accesorio[1] = searchResult[0].getValue(RecepcionSearchObj.columns[1]);
                                    accesorio[2] = searchResult[0].getValue(RecepcionSearchObj.columns[2]);
                                }
        
                                jsonResult.push({
                                    ordenServicioid: ordenServicioid,
                                    ordenTrabajoid: ordenTrabajoid,
                                    clienteid: clienteid,
                                    vehiculoid: vehiculoid,
                                    tallerid: tallerid,
                                    tecnicoid: tecnicoid,
                                    consecionarioid: consecionarioid,
                                    ordenServicio: ordenServicio,
                                    ordenTrabajo: ordenTrabajo,
                                    consecionario: consecionario,
                                    estadoOT : estadoOT,
                                    cliente: cliente,
                                    vehiculo: vehiculo,
                                    taller: taller,
                                    fechaTurno: typeof accesorio[1] == 'undefined' ? '' : accesorio[1],
                                    horaTurno: typeof accesorio[2] == 'undefined' ? '' : accesorio[2],
                                    // comentario: comentario,
                                    // comentarioTec: comentarioTec,
                                    tecnico: tecnico,
                                    fueraCuidad: fueraCuidad,
                                    fueraTaller: fueraTaller,
                                    producto: producto,
                                    tipoTrabajo: tipoTrabajo,
                                    comentario: consideracion
                                });
                            });
                        });
                        let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                        log.debug('remainingUsage INICIAL', remainingUsage);
                        return jsonResult;
                } else if (scriptContext.accion == DISPOSITIVO) {
                    log.debug('Response', DISPOSITIVO);
                    if (typeof scriptContext.ordentrabajo != 'undefined') {
                        if (scriptContext.ordentrabajo.length != 0) {
                            filter.push("AND", ["idtext", "startswith", scriptContext.ordentrabajo])
                            param = true;
                        }
                    }

                    if (typeof scriptContext.dispositivo != 'undefined') {
                        if (scriptContext.dispositivo.length != 0) {
                            filter.push("AND", ["custrecord_ht_ot_serieproductoasignacion.name", "startswith", scriptContext.dispositivo])
                            param = true;
                        }
                    }

                    if (param == false) {
                        return 'Filtro no válido para esta acción, revise sus parámetros';
                    }
    
                    const mySearch = search.create({
                        type: HT_ORDEN_TRABAJO_RECORD,
                        filters: filter,
                        columns:
                            [
                                // search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                                // search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                                //search.createColumn({ name: "custrecord_ht_ot_serieproductoasignacion", summary: "GROUP", label: "Dispositivo" }),
                                search.createColumn({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" }),
                                search.createColumn({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo" }),
                                search.createColumn({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" }),
                                search.createColumn({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" }),
                                search.createColumn({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" }),
                                search.createColumn({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" }),
                                search.createColumn({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" }),
                                search.createColumn({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" }),
                                search.createColumn({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" }),
                                search.createColumn({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" }),
                                search.createColumn({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" }),
                                search.createColumn({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" }),
                                search.createColumn({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "Box" }),
                                search.createColumn({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Código Act" }),
                                search.createColumn({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Código Res" }),
                                
                            ]
                    });

                    let myPagedData = mySearch.runPaged();
                        jsonMapping = {
                            query: scriptContext,
                            result: myPagedData.count
                        }
                        log.debug('Request', jsonMapping);
                        myPagedData.pageRanges.forEach(pageRange => {
                            let myPage = myPagedData.fetch({ index: pageRange.index });
                            myPage.data.forEach(result => {
                                let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                                // log.debug('remainingUsage CONSUMIDO', remainingUsage);
                                if (remainingUsage < 30) {
                                    return false;
                                }
                                // let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                                // let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                                let serie = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" })
                                let modeloDisp = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo"})
                                let unidad = result.getValue({ name:"custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" })
                                let vid = result.getValue({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" })
                                let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" })
                                let simcard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" })
                                let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" })
                                let fimware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" })
                                let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" })
                                let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" })
                                let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                                let ubicacion = result.getValue({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" })
                                let box = result.getValue({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "Ubicación" })
                                let codact = result.getValue({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Ubicación" })
                                let codres = result.getValue({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Ubicación" })
        
                                jsonResult.push({
                                    // ordenServicioid: ordenServicioid,
                                    // ordenTrabajoid: ordenTrabajoid,
                                    serie: serie == '- None -' ? '' : serie,
                                    modelo: modeloDisp == '- None -' ? '' : modeloDisp,
                                    unidad: unidad == '- None -' ? '' : unidad,
                                    vid: vid == '- None -' ? '' : vid,
                                    ip: ip == '- None -' ? '' : ip,
                                    simcard: simcard == '- None -' ? '' : simcard,
                                    servidor: servidor == '- None -' ? '' : servidor,
                                    fimware: fimware == '- None -' ? '' : fimware,
                                    script: script == '- None -' ? '' : script,
                                    apn: apn == '- None -' ? '' : apn,
                                    imei: imei == '- None -' ? '' : imei,
                                    ubicacion: ubicacion == '- None -' ? '' : ubicacion,
                                    // box: box == '- None -' ? '' : box,
                                    // codact: codact == '- None -' ? '' : codact,
                                    // codres: codres == '- None -' ? '' : codre,

                                });
                            });
                        });
                        return jsonResult;

                    // const mySearch = search.create({
                    //     type: HT_ORDEN_TRABAJO_RECORD,
                    //     filters: filter,
                    //     columns:
                    //         [
                    //             search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                    //             search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_serieproductoasignacion", summary: "GROUP", label: "Dispositivo" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado OT" })
                    //         ]
                    // });

                    // let myPagedData = mySearch.runPaged();
                    //     jsonMapping = {
                    //         query: scriptContext,
                    //         result: myPagedData.count
                    //     }
                    //     log.debug('Request', jsonMapping);
                    //     myPagedData.pageRanges.forEach(pageRange => {
                    //         let myPage = myPagedData.fetch({ index: pageRange.index });
                    //         myPage.data.forEach(result => {
                    //             let remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                    //             // log.debug('remainingUsage CONSUMIDO', remainingUsage);
                    //             if (remainingUsage < 30) {
                    //                 return false;
                    //             }
                    //             let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                    //             let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                    //             let serie = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" })
                    //             let modeloDisp = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo"})
                    //             let unidad = result.getValue({ name:"custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" })
                    //             let vid = result.getValue({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" })
                    //             let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" })
                    //             let simcard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" })
                    //             let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" })
                    //             let fimware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" })
                    //             let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" })
                    //             let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" })
                    //             let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                    //             let ubicacion = result.getValue({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" })
        
                    //             jsonResult.push({
                    //                 ordenServicioid: ordenServicioid,
                    //                 ordenTrabajoid: ordenTrabajoid,
                    //                 // clienteid: clienteid,
                    //                 // vehiculoid: vehiculoid,
                    //                 // tallerid: tallerid,
                    //                 // consecionarioid: consecionarioid,
                    //                 // tecnicoid: tecnicoid,
                    //                 // ordenServicio: ordenServicio,
                    //                 // ordenTrabajo: ordenTrabajo,
                    //                 // ceduleruc: ceduleruc == '- None -' ? '' : ceduleruc,
                    //                 // cliente: cliente,
                    //                 // vehiculo: vehiculo,
                    //                 // taller: taller,
                    //                 // consecionario: consecionario,
                    //                 // fechaTrabajo: fechaTrabajo,
                    //                 // horaTrabajo: horaTrabajo,
                    //                 // comentario: comentario,
                    //                 // comentarioTec: comentarioTec,
                    //                 // tecnico: tecnico,
                    //                 // fueraCuidad: fueraCuidad,
                    //                 // fueraTaller: fueraTaller,
                    //                 // producto: producto,
                    //                 // direccion: direccion,
                    //                 // email: email == '- None -' ? '' : email,
                    //                 // telefono: telefono == '- None -' ? '' : telefono,
                    //                 // motor: motor,
                    //                 // chasis: chasis,
                    //                 // tipoTrabajo: tipoTrabajo,
                    //                 // nota: memo == '- None -' ? '' : memo,
                    //                 // consideracionTrabajoTecnico: consideracion == '- None -' ? '' : consideracion,
                    //                 // placaColor: placa + '/' + color,
                    //                 // marcaModeloVersion: marca + '/'+ modelo + '/' + version,
                    //                 // trabajo: trabajo,
                    //                 serie: serie == '- None -' ? '' : serie,
                    //                 modelo: modeloDisp == '- None -' ? '' : modeloDisp,
                    //                 unidad: unidad == '- None -' ? '' : unidad,
                    //                 vid: vid == '- None -' ? '' : vid,
                    //                 ip: ip == '- None -' ? '' : ip,
                    //                 simcard: simcard == '- None -' ? '' : simcard,
                    //                 servidor: servidor == '- None -' ? '' : servidor,
                    //                 fimware: fimware == '- None -' ? '' : fimware,
                    //                 script: script == '- None -' ? '' : script,
                    //                 apn: apn == '- None -' ? '' : apn,
                    //                 imei: imei == '- None -' ? '' : imei,
                    //                 ubicacion: ubicacion == '- None -' ? '' : ubicacion
                    //             });
                    //         });
                    //     });
                    //     return jsonResult;
                } else {
                    return 'Acción incorrecta.';
                    // log.debug('Response', 'else');
                    // const mySearch = search.create({
                    //     type: HT_ORDEN_TRABAJO_RECORD,
                    //     filters: filter,
                    //     columns:
                    //         [
                    //             search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                    //             search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }),
                    //             search.createColumn({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }), 
                    //             search.createColumn({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }), 
                    //             search.createColumn({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }), 
                    //             search.createColumn({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }), 
                    //             search.createColumn({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }), 
                    //             search.createColumn({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }),  
                    //             search.createColumn({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }), 
                    //             search.createColumn({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }), 
                    //             search.createColumn({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" }),
                    //             //search.createColumn({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }), 
                    //             search.createColumn({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }),
                    //             search.createColumn({ name: "altname", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Name"}),
                    //             search.createColumn({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Doc. Number"}),
                    //             search.createColumn({name: "altname",join: "CUSTRECORD_HT_OT_VEHICULO",summary: "GROUP",label: "Name"}),
                    //             search.createColumn({ name: "custbodyec_nota_cliente", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Memo" }),
                    //             search.createColumn({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" }),
                    //             search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado OT" })
                    //         ]
                    // });
    
                    // let searchResultCount = mySearch.runPaged().count;
                    // log.debug("scriptdeploymentSearchObj result count", searchResultCount);
                    // if (searchResultCount > 0) {
                    //     mySearch.run().each(result =>{
                    //         let lookupFieldsvatregnumber = '';
                    //         let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                    //         try {
                    //              lookupFieldsvatregnumber = search.lookupFields({ type: 'customer', id: clienteid, columns: ['vatregnumber'] });
                    //              lookupFieldsvatregnumber = lookupFieldsvatregnumber.vatregnumber.length ? lookupFieldsvatregnumber.vatregnumber : '';
                    //         } catch (error) {}
                            
                    //         let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                    //         let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                    //         let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }) //^REQUERIDO POR HUNTER
                    //         let consecionarioid = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) //^REQUERIDO POR HUNTER
                    //         let consecionario = result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) == '- None -' ? '':  
                    //         result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[1] + ' ' + result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[2] //^REQUERIDO POR HUNTER
                    //         let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }) //^REQUERIDO POR HUNTER
                    //        // let cliente = result.getText({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                    //         let cliente = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                    //         let fechaTrabajo = result.getValue({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }) //^REQUERIDO POR HUNTER
                    //         let horaTrabajo = result.getValue({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }) //^REQUERIDO POR HUNTER
                    //         let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }) //^REQUERIDO POR HUNTER 
                    //         let vehiculo = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_VEHICULO", summary: "GROUP", label: "Name" }) //^REQUERIDO POR HUNTER 
                    //         let tallerid = result.getValue({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) //^REQUERIDO POR HUNTER
                    //         let taller = result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }).split(' ')[1]  //^REQUERIDO POR HUNTER
                    //         let comentario = result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" })  //^REQUERIDO POR HUNTER
                    //         let comentarioTec = result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) //^REQUERIDO POR HUNTER
                    //         let tecnicoid = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })
                    //         let tecnico = result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })/*.split(' - ')[1] */ //^REQUERIDO POR HUNTER
                    //         let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" })
                    //         let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" })
                    //         //let producto = result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                    //         let producto = result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                    //         let direccion = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" })
                    //         let email = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" })
                    //         let telefono = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" })
                    //         let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" })
                    //         let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" })
                    //         let tipoTrabajo = result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                    //         //let ceduleruc = result.getValue({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Doc. Number"})
                    //         let ceduleruc = lookupFieldsvatregnumber;
                    //         let memo = result.getValue({ name: "custbodyec_nota_cliente", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Memo" })
                    //         let consideracion = result.getValue({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" })
                    //         let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" })
                    //         let color = result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })  == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })
                    //         let marca = result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" })
                    //         let modelo = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" })
                    //         let version = result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" })
                    //         let serie = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" })
                    //         let modeloDisp = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo"})
                    //         let unidad = result.getValue({ name:"custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" })
                    //         let vid = result.getValue({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" })
                    //         let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" })
                    //         let simcard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" })
                    //         let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" })
                    //         let fimware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" })
                    //         let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" })
                    //         let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" })
                    //         let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                    //         let ubicacion = result.getValue({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" })
                    //         let estadoot = result.getText({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "Estado OT" })
                               
                    //         let sql = 'SELECT assemblycomponent, memo, itemtype FROM TransactionLine WHERE transaction = ?';
                    //         let params = [ordenServicioid]
                    //         let array = new Array();
                    //         let trabajo = '';
                    //         let resultSet = query.runSuiteQL({ query: sql, params: params });
                    //         let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                    //         if (results.length > 0) {
                    //             for (let i in results) {
                    //                 if ((results[i]['itemtype'] == "Assembly" || results[i]['itemtype'] == "Service" || results[i]['itemtype'] == "InvtPart") && results[i]['assemblycomponent'] == 'F') {
                    //                     array.push(results[i]['memo']);
                    //                 }
                    //             }
                    //             for (let j in array) {
                    //                 trabajo =
                    //                 trabajo + array[j] + ';'
                    //             }
                    //         }
        
                    //         consideracion == '- None -' ? '' : consideracion;
                    //             let accesorio = [];
                    //             //Buscar Recepcion
                    //             let RecepcionSearchObj = search.create({
                    //                 type: "calendarevent",
                    //                 filters:
                    //                 [
                    //                    ["transaction.internalid","anyof",ordenServicioid]
                    //                 ],
                    //                 columns:
                    //                 [
                    //                    search.createColumn({name: "title",label: "Recepción"}),
                    //                    search.createColumn({name: "custevent_ht_rc_radio",}),
                    //                    search.createColumn({name: "custevent_ht_rc_perillas",}),
                    //                    search.createColumn({name: "custevent_ht_rc_tapacombustible",}),
                    //                    search.createColumn({name: "custevent_ht_rc_alfombrapiso",}),
                    //                    search.createColumn({name: "custevent_ht_rc_aireacondicionado",}),
                    //                    search.createColumn({name: "custevent_ht_rc_brazosplumas",}),
                    //                    search.createColumn({name: "custevent_ht_rc_mascarillas",}),
                    //                    search.createColumn({name: "custevent_ht_rc_cenicero",}),
                    //                    search.createColumn({name: "custevent_ht_rc_chicotes",}),
                    //                    search.createColumn({name: "custevent_ht_rc_lucesparqueo",}),
                    //                    search.createColumn({name: "custevent_ht_rc_topespuertas",}),
                    //                    search.createColumn({name: "custevent_ht_rc_vidriosyseguros",}),
                    //                    search.createColumn({name: "custevent_ht_rc_moquetas",}),
                    //                    search.createColumn({name: "custevent_ht_rc_manualradio",}),
                    //                    search.createColumn({name: "custevent_ht_rc_palanca",}),
                    //                    search.createColumn({name: "custevent_ht_rc_encededor",}),
                    //                    search.createColumn({name: "custevent_ht_rc_espejointerior",}),
                    //                    search.createColumn({name: "custevent_ht_rc_espejoexterior",}),
                    //                    search.createColumn({name: "custevent_ht_rc_ventcalef",}),
                    //                    search.createColumn({name: "custevent_ht_rc_tapacubos",}),
                    //                    search.createColumn({name: "custevent_ht_rc_parlantes",}),
                    //                    search.createColumn({name: "custevent_ht_rc_antena",}),
                    //                    search.createColumn({name: "custevent_ht_rc_manualcarro",}),
                    //                    search.createColumn({name: "custevent_ht_rc_llantaemergencia",}),
                    //                    search.createColumn({name: "custevent_ht_rc_lucesyfaros",}),
                    //                    search.createColumn({name: "custevent_ht_rc_micasdeluces",}),
                    //                    search.createColumn({name: "custevent_ht_rc_cabecera",}),
                    //                    search.createColumn({name: "custevent_ht_rc_herramientas",}),
                    //                    search.createColumn({name: "custevent_ht_rc_gata",}),
                    //                    search.createColumn({name: "custevent_ht_rc_llaverueda",}),
                    //                    search.createColumn({ name: "custevent_ht_rc_odometro", label: "Odomoetro" }),
                    //                    search.createColumn({ name: "custevent_ht_rc_cantidadllaves", label: "Canticad de Llaves " }),
                    //                    search.createColumn({ name: "custevent_ht_rc_fechaentrega", label: "Fecha Entrega" }),
                    //                    search.createColumn({ name: "custevent_ht_rc_novedades", label: "Novedades" }),
                    //                    search.createColumn({ name: "custevent_ht_rc_combustible", label: "Combustible" }),
                    //                    search.createColumn({ name: "custevent_ht_rc_cantidadcontroles", label: "Cantidad de Controlles" }),
                    //                    search.createColumn({ name: "custevent_ht_rc_horaentrega", label: "Hora de Entrega" }),
                    //                 ]
                    //             });
                    //             let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                    //             if (searchResult.length) {
                    //                 accesorio[0] = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                    //                 accesorio[1] = searchResult[0].getValue(RecepcionSearchObj.columns[1]);
                    //                 accesorio[2] = searchResult[0].getValue(RecepcionSearchObj.columns[2]);
                    //                 accesorio[3] = searchResult[0].getValue(RecepcionSearchObj.columns[3]);
                    //                 accesorio[4] = searchResult[0].getValue(RecepcionSearchObj.columns[4]);
                    //                 accesorio[5] = searchResult[0].getValue(RecepcionSearchObj.columns[5]);
                    //                 accesorio[6] = searchResult[0].getValue(RecepcionSearchObj.columns[6]);
                    //                 accesorio[7] = searchResult[0].getValue(RecepcionSearchObj.columns[7]);
                    //                 accesorio[8] = searchResult[0].getValue(RecepcionSearchObj.columns[8]);
                    //                 accesorio[9] = searchResult[0].getValue(RecepcionSearchObj.columns[9]);
                    //                 accesorio[10] = searchResult[0].getValue(RecepcionSearchObj.columns[10]);
                    //                 accesorio[11] = searchResult[0].getValue(RecepcionSearchObj.columns[11]);
                    //                 accesorio[12] = searchResult[0].getValue(RecepcionSearchObj.columns[12]);
                    //                 accesorio[13] = searchResult[0].getValue(RecepcionSearchObj.columns[13]);
                    //                 accesorio[14] = searchResult[0].getValue(RecepcionSearchObj.columns[14]);
                    //                 accesorio[15] = searchResult[0].getValue(RecepcionSearchObj.columns[15]);
                    //                 accesorio[16] = searchResult[0].getValue(RecepcionSearchObj.columns[16]);
                    //                 accesorio[17] = searchResult[0].getValue(RecepcionSearchObj.columns[17]);
                    //                 accesorio[18] = searchResult[0].getValue(RecepcionSearchObj.columns[18]);
                    //                 accesorio[19] = searchResult[0].getValue(RecepcionSearchObj.columns[19]);
                    //                 accesorio[20] = searchResult[0].getValue(RecepcionSearchObj.columns[20]);
                    //                 accesorio[21] = searchResult[0].getValue(RecepcionSearchObj.columns[21]);
                    //                 accesorio[22] = searchResult[0].getValue(RecepcionSearchObj.columns[22]);
                    //                 accesorio[23] = searchResult[0].getValue(RecepcionSearchObj.columns[23]);
                    //                 accesorio[24] = searchResult[0].getValue(RecepcionSearchObj.columns[24]);
                    //                 accesorio[25] = searchResult[0].getValue(RecepcionSearchObj.columns[25]);
                    //                 accesorio[26] = searchResult[0].getValue(RecepcionSearchObj.columns[26]);
                    //                 accesorio[27] = searchResult[0].getValue(RecepcionSearchObj.columns[27]);
                    //                 accesorio[28] = searchResult[0].getValue(RecepcionSearchObj.columns[28]);
                    //                 accesorio[29] = searchResult[0].getValue(RecepcionSearchObj.columns[29]);
                    //                 accesorio[30] = searchResult[0].getValue(RecepcionSearchObj.columns[30]);
                    //                 accesorio[31] = searchResult[0].getValue(RecepcionSearchObj.columns[31]);
                    //                 accesorio[32] = searchResult[0].getValue(RecepcionSearchObj.columns[32]);
                    //                 accesorio[33] = searchResult[0].getValue(RecepcionSearchObj.columns[33]);
                    //                 accesorio[34] = searchResult[0].getValue(RecepcionSearchObj.columns[34]);
                    //                 accesorio[35] = searchResult[0].getValue(RecepcionSearchObj.columns[35]);
                    //                 accesorio[36] = searchResult[0].getValue(RecepcionSearchObj.columns[36]);
                    //                 accesorio[37] = searchResult[0].getValue(RecepcionSearchObj.columns[37]);
                    //             }
        
                    //             jsonRecepcion = [{
                    //                 clienteid: clienteid,
                    //                 ceduleruc: ceduleruc == '- None -' ? '' : ceduleruc,
                    //                 cliente: cliente,
                    //                 direccion: direccion,
                    //                 telefono: telefono == '- None -' ? '' : telefono,
                    //                 email: email == '- None -' ? '' : email,
                    //             }];
        
                    //             jsonOrdenServicio.push({
                    //                 ordenServicioid: ordenServicioid,
                    //                 vehiculoid: vehiculoid,
                    //                 ordenServicio: ordenServicio,
                    //                 vehiculo: vehiculo,
                    //                 motor: motor,
                    //                 chasis: chasis,
                    //                 comentarioTec: comentarioTec,
                    //                 estadoot: estadoot,
                    //                 producto: producto,
                    //                 tipoTrabajo: tipoTrabajo
                    //             });
                    //         return true;
                    //     });
        
                    //     let newArray = groupById(jsonOrdenServicio);
                    //     let hash = {};
                    //     newArray = newArray.filter(current => {
                    //     let exists = !hash[current.ordenServicioid];
                    //     hash[current.ordenServicioid] = true;
                    //     return exists;
                    //     });
        
                    //     jsonResponse.push({
                    //         cabecera : jsonRecepcion,
                    //         detalle: newArray
                    //     });
            
                    //     // let myPagedData = mySearch.runPaged();
                    //     // jsonMapping = {
                    //     //     query: scriptContext,
                    //     //     result: myPagedData.count
                    //     // }
                    //     // log.debug('Request', jsonMapping);
                    //     // // let searchResult = mySearch.run().getRange({ start: 0, end: 1000 });
                    //     // // log.debug('RESObj', searchResult);
                    //     // myPagedData.pageRanges.forEach(pageRange => {
                    //     //     let myPage = myPagedData.fetch({ index: pageRange.index });
                    //     //     myPage.data.forEach(result => {
                    //     //         let lookupFieldsvatregnumber = '';
                    //     //         let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                    //     //         try {
                    //     //              lookupFieldsvatregnumber = search.lookupFields({ type: 'customer', id: clienteid, columns: ['vatregnumber'] });
                    //     //              lookupFieldsvatregnumber = lookupFieldsvatregnumber.vatregnumber.length ? lookupFieldsvatregnumber.vatregnumber : '';
                    //     //         } catch (error) {}
                                
                    //     //         let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                    //     //         let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                    //     //         let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }) //^REQUERIDO POR HUNTER
                    //     //         let consecionarioid = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) //^REQUERIDO POR HUNTER
                    //     //         let consecionario = result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }) == '- None -' ? '':  
                    //     //         result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[1] + ' ' + result.getText({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }).split(' ')[2] //^REQUERIDO POR HUNTER
                    //     //         let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }) //^REQUERIDO POR HUNTER
                    //     //        // let cliente = result.getText({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                    //     //         let cliente = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Cliente" }) //^REQUERIDO POR HUNTER
                    //     //         let fechaTrabajo = result.getValue({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }) //^REQUERIDO POR HUNTER
                    //     //         let horaTrabajo = result.getValue({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }) //^REQUERIDO POR HUNTER
                    //     //         let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }) //^REQUERIDO POR HUNTER 
                    //     //         let vehiculo = result.getValue({ name: "altname",  join: "CUSTRECORD_HT_OT_VEHICULO", summary: "GROUP", label: "Name" }) //^REQUERIDO POR HUNTER 
                    //     //         let tallerid = result.getValue({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) //^REQUERIDO POR HUNTER
                    //     //         let taller = result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_taller", summary: "GROUP", label: "Taller" }).split(' ')[1]  //^REQUERIDO POR HUNTER
                    //     //         let comentario = result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentario" })  //^REQUERIDO POR HUNTER
                    //     //         let comentarioTec = result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_observacion", summary: "GROUP", label: "Comentario Técnico" }) //^REQUERIDO POR HUNTER
                    //     //         let tecnicoid = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })
                    //     //         let tecnico = result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" }) == '- None -' ? 'SIN ASIGNAR' : result.getText({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "Técnico" })/*.split(' - ')[1] */ //^REQUERIDO POR HUNTER
                    //     //         let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "Fuera Ciudad" })
                    //     //         let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "Fuera taller" })
                    //     //         //let producto = result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_producto", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                    //     //         let producto = result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }) == '- None -' ? '' : result.getText({ name: "custrecordht_ot_tipo_agrupacion", summary: "GROUP", label: "Producto" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                    //     //         let direccion = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "Dirección del Cliente" })
                    //     //         let email = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "Correo del Cliente" })
                    //     //         let telefono = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "Teléfono del Cliente" })
                    //     //         let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "Motor" })
                    //     //         let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "Chasis" })
                    //     //         let tipoTrabajo = result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo Trabajo" }).split(' - ')[1]  //^REQUERIDO POR HUNTER
                    //     //         //let ceduleruc = result.getValue({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_OT_CLIENTE_ID", summary: "GROUP", label: "Doc. Number"})
                    //     //         let ceduleruc = lookupFieldsvatregnumber;
                    //     //         let memo = result.getValue({ name: "custbodyec_nota_cliente", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Memo" })
                    //     //         let consideracion = result.getValue({ name: "custbody_ht_os_consideracion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Consideracion" })
                    //     //         let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" }) == '- None -' ? '' : result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "Placa" })
                    //     //         let color = result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })  == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "Color" })
                    //     //         let marca = result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "Marca" })
                    //     //         let modelo = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "Modelo" })
                    //     //         let version = result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" }) == '- None -' ? '' : result.getText({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "Versión" })
                    //     //         let serie = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "Serie" })
                    //     //         let modeloDisp = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "Modelo"})
                    //     //         let unidad = result.getValue({ name:"custrecord_ht_ot_unidad", summary: "GROUP", label: "Unidad" })
                    //     //         let vid = result.getValue({ name: "custrecord_ht_ot_vid", summary: "GROUP", label: "VID" })
                    //     //         let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "IP" })
                    //     //         let simcard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "SimCard" })
                    //     //         let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "Servidor" })
                    //     //         let fimware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "Fimware" })
                    //     //         let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "Script" })
                    //     //         let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "APN" })
                    //     //         let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                    //     //         let ubicacion = result.getValue({ name: "custrecord_ht_ot_ubicacion", summary: "GROUP", label: "Ubicación" })
                                   
                    //     //         let sql = 'SELECT assemblycomponent, memo, itemtype FROM TransactionLine WHERE transaction = ?';
                    //     //         let params = [ordenServicioid]
                    //     //         let array = new Array();
                    //     //         let trabajo = '';
                    //     //         let resultSet = query.runSuiteQL({ query: sql, params: params });
                    //     //         let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                    //     //         if (results.length > 0) {
                    //     //             for (let i in results) {
                    //     //                 if ((results[i]['itemtype'] == "Assembly" || results[i]['itemtype'] == "Service" || results[i]['itemtype'] == "InvtPart") && results[i]['assemblycomponent'] == 'F') {
                    //     //                     array.push(results[i]['memo']);
                    //     //                 }
                    //     //             }
                    //     //             for (let j in array) {
                    //     //                 trabajo =
                    //     //                 trabajo + array[j] + ';'
                    //     //             }
                    //     //         } 
        
                    //     //         consideracion == '- None -' ? '' :consideracion;
                    //     //         let accesorio = [];
                    //     //         //Buscar Recepcion
                    //     //         let RecepcionSearchObj = search.create({
                    //     //             type: "calendarevent",
                    //     //             filters:
                    //     //             [
                    //     //                ["transaction.internalid","anyof",ordenServicioid]
                    //     //             ],
                    //     //             columns:
                    //     //             [
                    //     //                search.createColumn({name: "title",label: "Recepción"}),
                    //     //                search.createColumn({name: "custevent_ht_rc_radio",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_perillas",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_tapacombustible",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_alfombrapiso",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_aireacondicionado",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_brazosplumas",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_mascarillas",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_cenicero",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_chicotes",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_lucesparqueo",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_topespuertas",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_vidriosyseguros",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_moquetas",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_manualradio",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_palanca",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_encededor",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_espejointerior",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_espejoexterior",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_ventcalef",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_tapacubos",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_parlantes",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_antena",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_manualcarro",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_llantaemergencia",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_lucesyfaros",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_micasdeluces",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_cabecera",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_herramientas",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_gata",}),
                    //     //                search.createColumn({name: "custevent_ht_rc_llaverueda",}),
                    //     //                search.createColumn({ name: "custevent_ht_rc_odometro", label: "Odomoetro" }),
                    //     //                search.createColumn({ name: "custevent_ht_rc_cantidadllaves", label: "Canticad de Llaves " }),
                    //     //                search.createColumn({ name: "custevent_ht_rc_fechaentrega", label: "Fecha Entrega" }),
                    //     //                search.createColumn({ name: "custevent_ht_rc_novedades", label: "Novedades" }),
                    //     //                search.createColumn({ name: "custevent_ht_rc_combustible", label: "Combustible" }),
                    //     //                search.createColumn({ name: "custevent_ht_rc_cantidadcontroles", label: "Cantidad de Controlles" }),
                    //     //                search.createColumn({ name: "custevent_ht_rc_horaentrega", label: "Hora de Entrega" }),
                    //     //             ]
                    //     //         });
                    //     //         let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                    //     //         if (searchResult.length) {
                    //     //             accesorio[0] = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                    //     //             accesorio[1] = searchResult[0].getValue(RecepcionSearchObj.columns[1]);
                    //     //             accesorio[2] = searchResult[0].getValue(RecepcionSearchObj.columns[2]);
                    //     //             accesorio[3] = searchResult[0].getValue(RecepcionSearchObj.columns[3]);
                    //     //             accesorio[4] = searchResult[0].getValue(RecepcionSearchObj.columns[4]);
                    //     //             accesorio[5] = searchResult[0].getValue(RecepcionSearchObj.columns[5]);
                    //     //             accesorio[6] = searchResult[0].getValue(RecepcionSearchObj.columns[6]);
                    //     //             accesorio[7] = searchResult[0].getValue(RecepcionSearchObj.columns[7]);
                    //     //             accesorio[8] = searchResult[0].getValue(RecepcionSearchObj.columns[8]);
                    //     //             accesorio[9] = searchResult[0].getValue(RecepcionSearchObj.columns[9]);
                    //     //             accesorio[10] = searchResult[0].getValue(RecepcionSearchObj.columns[10]);
                    //     //             accesorio[11] = searchResult[0].getValue(RecepcionSearchObj.columns[11]);
                    //     //             accesorio[12] = searchResult[0].getValue(RecepcionSearchObj.columns[12]);
                    //     //             accesorio[13] = searchResult[0].getValue(RecepcionSearchObj.columns[13]);
                    //     //             accesorio[14] = searchResult[0].getValue(RecepcionSearchObj.columns[14]);
                    //     //             accesorio[15] = searchResult[0].getValue(RecepcionSearchObj.columns[15]);
                    //     //             accesorio[16] = searchResult[0].getValue(RecepcionSearchObj.columns[16]);
                    //     //             accesorio[17] = searchResult[0].getValue(RecepcionSearchObj.columns[17]);
                    //     //             accesorio[18] = searchResult[0].getValue(RecepcionSearchObj.columns[18]);
                    //     //             accesorio[19] = searchResult[0].getValue(RecepcionSearchObj.columns[19]);
                    //     //             accesorio[20] = searchResult[0].getValue(RecepcionSearchObj.columns[20]);
                    //     //             accesorio[21] = searchResult[0].getValue(RecepcionSearchObj.columns[21]);
                    //     //             accesorio[22] = searchResult[0].getValue(RecepcionSearchObj.columns[22]);
                    //     //             accesorio[23] = searchResult[0].getValue(RecepcionSearchObj.columns[23]);
                    //     //             accesorio[24] = searchResult[0].getValue(RecepcionSearchObj.columns[24]);
                    //     //             accesorio[25] = searchResult[0].getValue(RecepcionSearchObj.columns[25]);
                    //     //             accesorio[26] = searchResult[0].getValue(RecepcionSearchObj.columns[26]);
                    //     //             accesorio[27] = searchResult[0].getValue(RecepcionSearchObj.columns[27]);
                    //     //             accesorio[28] = searchResult[0].getValue(RecepcionSearchObj.columns[28]);
                    //     //             accesorio[29] = searchResult[0].getValue(RecepcionSearchObj.columns[29]);
                    //     //             accesorio[30] = searchResult[0].getValue(RecepcionSearchObj.columns[30]);
                    //     //             accesorio[31] = searchResult[0].getValue(RecepcionSearchObj.columns[31]);
                    //     //             accesorio[32] = searchResult[0].getValue(RecepcionSearchObj.columns[32]);
                    //     //             accesorio[33] = searchResult[0].getValue(RecepcionSearchObj.columns[33]);
                    //     //             accesorio[34] = searchResult[0].getValue(RecepcionSearchObj.columns[34]);
                    //     //             accesorio[35] = searchResult[0].getValue(RecepcionSearchObj.columns[35]);
                    //     //             accesorio[36] = searchResult[0].getValue(RecepcionSearchObj.columns[36]);
                    //     //             accesorio[37] = searchResult[0].getValue(RecepcionSearchObj.columns[37]);
                    //     //         }
        
                    //     //         jsonRecepcion = [{
                    //     //             clienteid: clienteid,
                    //     //             ceduleruc: ceduleruc == '- None -' ? '' : ceduleruc,
                    //     //             cliente: cliente,
                    //     //             direccion: direccion,
                    //     //             telefono: telefono == '- None -' ? '' : telefono,
                    //     //             email: email == '- None -' ? '' : email,
                    //     //         }];
        
                    //     //         jsonOrdenServicio.push({
                    //     //             ordenServicioid: ordenServicioid
                    //     //         });
            
        
                    //     //         jsonResponse.push({
                    //     //             bloque1 : jsonRecepcion,
                    //     //             bloque2: jsonOrdenServicio
                    //     //         });
                    //     //     });
                    //     // });
                    //     return jsonResponse;
                    // } else {
                    //     return []
                    // }
                }     
            } else {
                return 'No ha ingresado ninguna acción.';
            }
        } catch (error) {
            log.error('Error-GET', error);
            return error;
        }
    }

    const groupById = (array) => {
        return array.reduce((acc, current) => {
            const foundItem = acc.find(it => it.ordenServicioid === current.ordenServicioid);
            if (foundItem) {
                foundItem.data = foundItem.data
                    ? [...foundItem.data, { 'producto': current.producto, 'tipoTrabajo': current.tipoTrabajo }]
                    : [{ 'producto': current.fecha, 'tipoTrabajo': current.tipoTrabajo }];
            } else { 
                acc.push({
                    'ordenServicioid': current.ordenServicioid,
                    'vehiculoid': current.vehiculoid,
                    'ordenServicio': current.ordenServicio,
                    'vehiculo': current.vehiculo,
                    'motor': current.motor,
                    'chasis': current.chasis,
                    'comentarioTec': current.comentarioTec,
                    'estadoot': current.estadoot,
                    'placaColor': current.placaColor,
                    'marcaModeloVersion': current.marcaModeloVersion,
                    'anio': current.anio,
                    'trabajo': current.trabajo,
                    'accesorioRadio': current.accesorioRadio,
                    accesorioPerillas: current.accesorioPerillas,
                    accesorioTapaCombustible: current.accesorioTapaCombustible,
                    accesorioAlfombraPiso: current.accesorioAlfombraPiso,
                    accesorioAireAcondicionado: current.accesorioAireAcondicionado,
                    accesorioBrazosPlumas: current.accesorioBrazosPlumas,
                    accesorioMascarrillas: current.accesorioMascarrillas,
                    accesorioCenicero: current.accesorioCenicero,
                    accesorioChicotes: current.accesorioChicotes,
                    accesorioLucesParqueo: current.accesorioLucesParqueo,
                    accesorioTopesPuertas: current.accesorioTopesPuertas,
                    accesorioVidriosYSeguros: current.accesorioVidriosYSeguros,
                    accesorioMoquetas: current.accesorioMoquetas,
                    accesorioManualRadio: current.accesorioManualRadio,
                    accesorioPalanca: current.accesorioPalanca,
                    accesorioEncendedor: current.accesorioEncendedor,
                    accesorioEspejoInterior: current.accesorioEspejoInterior,
                    accesorioEspejoExterior: current.accesorioEspejoExterior,
                    accesorioVentCalef: current.accesorioVentCalef,
                    accesorioTapaCubos: current.accesorioTapaCubos,
                    accesorioParlantes: current.accesorioParlantes,
                    accesorioAntena: current.accesorioAntena,
                    accesorioManualCarro: current.accesorioManualCarro,
                    accesorioLlantaEmergencia: current.accesorioLlantaEmergencia,
                    accesorioLucesYFaros: current.accesorioLucesYFaros,
                    accesorioMicasDeLuces: current.accesorioMicasDeLuces,
                    accesorioCabecera: current.accesorioCabecera,
                    accesorioHerramientas: current.accesorioHerramientas,
                    accesorioGata: current.accesorioGata,
                    accesorioLlaveRueda: current.accesorioLlaveRueda,
                    odometro: current.odometro,
                    cantidadllaves: current.cantidadllaves,
                    fechaEntrega: current.fechaEntrega,
                    novedades: current.novedades,
                    combustible: current.combustible,
                    cntidadControles: current.cntidadControles,
                    horaEntrega: current.horaEntrega,
                    //'data': [{ 'producto': current.producto, 'tipoTrabajo': current.tipoTrabajo }]
                });
            }
            return acc;
        }, []);
    }

    const _post = (scriptContext) => {
        let accion = 'accion no definida';
        let respuesta;
        log.debug('JSON', scriptContext);
        try {
            if (typeof scriptContext.accion != 'undefined') {
                accion = scriptContext.accion;
                accion = accion.toLowerCase();
                let guardar = 0;
                let guardarBien = 0;
                let recepcion = '', recep = 0;
                switch (accion) {
                    case RECEPCION:
                        log.debug('Acción', 'Recepción');
                        if (typeof scriptContext.ordenServicio != 'undefined' && scriptContext.ordenServicio.length > 0) {
                            let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO_SEARCH });
                            let filters = objSearch.filters;
                            const ordenTrabajo = search.createFilter({ name: 'custrecord_ht_ot_orden_serivicio_txt', operator: search.Operator.STARTSWITH, values: scriptContext.ordenServicio });
                            filters.push(ordenTrabajo);
                            let cantidadRegistros = objSearch.runPaged().count;
                            log.debug('cantidadRegistros', cantidadRegistros);
                            if (cantidadRegistros > 0) {
                                let result = objSearch.run().getRange({ start: 0, end: 1 });
                                let idordentrabajo = result[0].getValue({ name: "internalid" });
                                let idvehiculo = result[0].getValue({ name: "custrecord_ht_ot_vehiculo" });

                                //*Bloque seteo ======================================================================================================
                                //let recepcionRecord = record.create({ type: HT_FLUJO_ORDEN_TRABAJO_RECORD });

                                let openRecord = record.create({ type: record.Type.CALENDAR_EVENT, isDynamic: true })
                                //let openRecord = record.load({ type: HT_ORDEN_TRABAJO_RECORD, id: idordentrabajo, isDynamic: true });
                                openRecord.setValue({ fieldId: "organizer", value: scriptContext.recepcionador });
                                openRecord.setValue({ fieldId: "title", value: scriptContext.ordenServicio });
                                openRecord.setValue({ fieldId: "startdate", value: new Date() });
                                openRecord.setValue({ fieldId: "timedevent", value: false });
                                if (typeof scriptContext.entregaa != 'undefined' && scriptContext.entregaa.length > 0) {
                                    openRecord.setValue({ fieldId: "custevent_ht_rc_nombreentrega", value: scriptContext.entregaa });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.recibea != 'undefined' && scriptContext.recibea.length > 0) {
                                    openRecord.setValue({ fieldId: "custevent_ht_rc_nombrerecibe", value: scriptContext.recibea });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.correo != 'undefined' && scriptContext.correo.length > 0) {
                                    openRecord.setValue({ fieldId: "custevent_ht_rc_correorecepcion", value: scriptContext.correo });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.comentario != 'undefined' && scriptContext.comentario.length > 0) {
                                    openRecord.setValue({ fieldId: "message", value: scriptContext.comentario });
                                    guardar = 1;
                                }

                                //Inicio accesorio 
                                if (typeof scriptContext.accesorioRadio != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_radio', value: scriptContext.accesorioRadio });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioPerillas != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_perillas', value: scriptContext.accesorioPerillas });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioTapaCombustible != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_tapacombustible', value: scriptContext.accesorioTapaCombustible });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioAlfombraPiso != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_alfombrapiso', value: scriptContext.accesorioAlfombraPiso });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioAireAcondicionado != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_aireacondicionado', value: scriptContext.accesorioAireAcondicionado });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioBrazosPlumas != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_brazosplumas', value: scriptContext.accesorioBrazosPlumas });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioMascarrillas != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_mascarillas', value: scriptContext.accesorioMascarrillas });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioCenicero != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_cenicero', value: scriptContext.accesorioCenicero });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioChicotes != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_chicotes', value: scriptContext.accesorioChicotes });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioLucesParqueo != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_lucesparqueo', value: scriptContext.accesorioLucesParqueo });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioTopesPuertas != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_topespuertas', value: scriptContext.accesorioTopesPuertas });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioVidriosYSeguros != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_vidriosyseguros', value: scriptContext.accesorioVidriosYSeguros });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioMoquetas != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_moquetas', value: scriptContext.accesorioMoquetas });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioManualRadio != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_manualradio', value: scriptContext.accesorioManualRadio });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioPalanca != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_palanca', value: scriptContext.accesorioPalanca });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioEncendedor != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_encededor', value: scriptContext.accesorioEncendedor });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioEspejoInterior != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_espejointerior', value: scriptContext.accesorioEspejoInterior });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioEspejoExterior != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_espejoexterior', value: scriptContext.accesorioEspejoExterior });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioVentCalef != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_ventcalef', value: scriptContext.accesorioVentCalef });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioTapaCubos != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_tapacubos', value: scriptContext.accesorioTapaCubos });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioParlantes != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_parlantes', value: scriptContext.accesorioParlantes });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioAntena != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_antena', value: scriptContext.accesorioAntena });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioManualCarro != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_manualcarro', value: scriptContext.accesorioManualCarro });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioLlantaEmergencia != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_llantaemergencia', value: scriptContext.accesorioLlantaEmergencia });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioLucesYFaros != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_lucesyfaros', value: scriptContext.accesorioLucesYFaros });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioMicasDeLuces != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_micasdeluces', value: scriptContext.accesorioMicasDeLuces });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioCabecera != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_cabecera', value: scriptContext.accesorioCabecera });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioHerramientas != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_herramientas', value: scriptContext.accesorioHerramientas });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioGata != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_gata', value: scriptContext.accesorioGata });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.accesorioLlaveRueda != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_llaverueda', value: scriptContext.accesorioLlaveRueda });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.odometro != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_odometro', value: scriptContext.odometro });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.cantidadllaves != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_cantidadllaves', value: scriptContext.cantidadllaves });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.fechaentrega != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_fechaentrega', value: new Date(scriptContext.fechaentrega) });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.novedades != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_novedades', value: scriptContext.novedades });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.combustible != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_combustible', value: scriptContext.combustible });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.cantidadcontroles != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_cantidadcontroles', value: scriptContext.cantidadcontroles });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.horaentrega != 'undefined') {
                                    openRecord.setValue({ fieldId: 'custevent_ht_rc_horaentrega', value: scriptContext.horaentrega });
                                    guardar = 1;
                                }

                                //Fin accesorio 

                                if (guardar == 1) {
                                    var now = new Date();
                                    openRecord.setValue({ fieldId: 'company', value: scriptContext.customer });
                                    openRecord.setValue({ fieldId: 'transaction', value: scriptContext.idordenservicio });
                                    openRecord.setValue({ fieldId: 'custevent_ht_os_hora_recepcion', value: format.format({ value: now, type: format.Type.TIMEOFDAY }) });
                                    recepcion = openRecord.save();
                                    log.debug('Hora', now);
                                }

                                let openRecordBien = record.load({ type: HT_BIEN_RECORD, id: idvehiculo, isDynamic: true });
                                if (typeof scriptContext.color != 'undefined' && scriptContext.color.length > 0) {
                                    openRecordBien.setValue({ fieldId: "custrecord_ht_bien_colorcarseg", value: scriptContext.color });
                                    guardarBien = 1;
                                }

                                if (guardarBien == 1) {
                                    openRecordBien.save();
                                }
                                email.send({
                                    author: scriptContext.recepcionador,
                                    recipients: scriptContext.customer,
                                    subject: 'Recepción de Vehículo',
                                    body: '<p>Vehículo recepcionado</p><p>' + scriptContext.comentario + '</p>',
                                    relatedRecords: {
                                        transactionId: scriptContext.idordenservicio
                                    }
                                });
                                respuesta = {'id': recepcion}
                                //respuesta = 'Vehículo recepcionado, recepción: ' + scriptContext.ordenServicio;
                            } else {
                                respuesta = 'No se encontró información para está Orden de Trabajo';
                            }
                        } else {
                            respuesta = 'Orden de Trabajo no especificada';
                        }
                        break;
                    case ACTUALIZAR:
                        if (typeof scriptContext.idordentrabajo != 'undefined') {
                            log.debug('Acción', 'Chequeo');
                            let guardar = 0;
                            let guardar2 = 0;
                            let action = '';
                            let openRecord = record.load({ type: HT_ORDEN_TRABAJO_RECORD, id: scriptContext.idordentrabajo, isDynamic: true });
                            let idOS = openRecord.getValue({ fieldId: "custrecord_ht_ot_orden_servicio"});
                            log.debug('idOS',idOS);

                            if (typeof scriptContext.codigodispositivo != 'undefined' && scriptContext.codigodispositivo.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_serieproductoasignacion", value: scriptContext.codigodispositivo });
                                action += 'Nro de serie de dispositivo asignado|';
                                guardar = 1;
                            }
                            if (typeof scriptContext.estadoot != 'undefined' && scriptContext.estadoot.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_estado", value: scriptContext.estadoot });
                                log.debug('Acción', 'Status: ' + scriptContext.estadoot);
                                action += 'Actualización Estado||';
                                guardar = 1;     
                            }
                            if (typeof scriptContext.tecnico != 'undefined' && scriptContext.tecnico.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_tecnicoasignacion", value: scriptContext.tecnico });
                                let sql = 'SELECT id as turno FROM task WHERE transaction = ?';

                                action += 'Actualización Técnico||';
                                guardar = 1;          
                            }
                            if (typeof scriptContext.comentario != 'undefined' && scriptContext.comentario.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_comentariofinalizacion", value: scriptContext.comentario });
                                action += 'Actualización Comentario||';
                                guardar = 1;
                            }
                            if (typeof scriptContext.fueraciudad != 'undefined' /*&& scriptContext.fueraciudad.length > 0*/) {
                                log.debug('JSON-true', scriptContext.fueraciudad);
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_fueraciudad", value: scriptContext.fueraciudad });
                                action += 'Actualización Fuera Ciudad||';
                                guardar = 1;
                            }
                            if (typeof scriptContext.fuerataller != 'undefined' /*&& scriptContext.fuerataller.length > 0*/) {
                                log.debug('JSON-true', scriptContext.fuerataller);
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_fuerataller", value: scriptContext.fuerataller });
                                action += 'Actualización Fuera Taller||';
                                guardar = 1;
                            }
                            if (typeof scriptContext.fechatrabajoasignacion != 'undefined' && scriptContext.fechatrabajoasignacion.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_fechatrabajoasignacion", value: new Date(scriptContext.fechatrabajoasignacion) });
                                action += 'Actualización Fecha Asignación||';
                                guardar = 1;
                            }
                            if (typeof scriptContext.horatrabajoasignacion != 'undefined' && scriptContext.horatrabajoasignacion.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_horatrabajoasignacion", value: new Date(scriptContext.horatrabajoasignacion) });
                                action += 'Actualización Hora Asignación||';
                                guardar = 1;
                            }
                            if (typeof scriptContext.ubicacion != 'undefined' && scriptContext.ubicacion.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_ubicacion", value: scriptContext.ubicacion });
                                action += 'Actualización Ubicación||';
                                guardar = 1;
                            }              
                            if (typeof scriptContext.novedad != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_connovedad", value: scriptContext.novedad });
                                action += 'Actualización Novedad||';
                                guardar = 1;
                            } 
                            if (typeof scriptContext.observacion != 'undefined' && scriptContext.observacion.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_observacion", value: scriptContext.observacion });
                                action += 'Actualización Observación||';
                                guardar = 1;
                            }
                            if (typeof scriptContext.estadoChequeo != 'undefined' && scriptContext.estadoChequeo.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_estadochaser", value: scriptContext.estadoChequeo });
                                action += 'Actualización Estado Instalación||';
                                guardar = 1;
                            }
                            if (typeof scriptContext.supervisor != 'undefined' && scriptContext.supervisor.length > 0) {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_supervisorasignacion", value: scriptContext.supervisor });
                                action += 'Actulización Supervisor||';
                                guardar = 1;
                            }
                            if (guardar == 1) {
                                let os = openRecord.save();
                                log.debug('Acción', 'Chequeo: ' + os);
                                respuesta = 'Actualización: ' + action;
                            }

                            if (typeof scriptContext.accesorioRadio != 'undefined' || typeof scriptContext.accesorioPerillas != 'undefined' || typeof scriptContext.accesorioTapaCombustible != 'undefined'
                            || typeof scriptContext.accesorioAlfombraPiso != 'undefined' || typeof scriptContext.accesorioAireAcondicionado != 'undefined' || typeof scriptContext.accesorioBrazosPlumas != 'undefined'
                            || typeof scriptContext.accesorioMascarrillas != 'undefined' || typeof scriptContext.accesorioCenicero != 'undefined' || typeof scriptContext.accesorioChicotes != 'undefined'
                            || typeof scriptContext.accesorioLucesParqueo != 'undefined' || typeof scriptContext.accesorioTopesPuertas != 'undefined' || typeof scriptContext.accesorioVidriosYSeguros != 'undefined'
                            || typeof scriptContext.accesorioMoquetas != 'undefined' || typeof scriptContext.accesorioManualRadio != 'undefined' || typeof scriptContext.accesorioPalanca != 'undefined'
                            || typeof scriptContext.accesorioEncendedor != 'undefined' || typeof scriptContext.accesorioEspejoInterior != 'undefined' || typeof scriptContext.accesorioEspejoExterior != 'undefined'
                            || typeof scriptContext.accesorioVentCalef != 'undefined' || typeof scriptContext.accesorioTapaCubos != 'undefined' || typeof scriptContext.accesorioParlantes != 'undefined'
                            || typeof scriptContext.accesorioAntena != 'undefined' || typeof scriptContext.accesorioManualCarro != 'undefined' || typeof scriptContext.accesorioLlantaEmergencia != 'undefined'
                            || typeof scriptContext.accesorioLucesYFaros != 'undefined' || typeof scriptContext.accesorioMicasDeLuces != 'undefined' || typeof scriptContext.accesorioCabecera != 'undefined'
                            || typeof scriptContext.accesorioHerramientas != 'undefined' || typeof scriptContext.accesorioGata != 'undefined' || typeof scriptContext.accesorioLlaveRueda != 'undefined'){

                                var idRecep = '';
                                var RecepcionSearchObj = search.create({
                                    type: "calendarevent",
                                    filters:
                                    [
                                       ["transaction.internalid","anyof",idOS]
                                    ],
                                    columns:
                                    [
                                        search.createColumn({name: "internalid", label: "ID interno"})
                                    ]
                                });
                                let searchResult = RecepcionSearchObj.run().getRange({ start: 0, end: 1 });
                                if (searchResult.length) {
                                    idRecep = searchResult[0].getValue(RecepcionSearchObj.columns[0]);
                                }

                                log.debug('idRecep',idRecep);
                                var id_Recepcion = Number(idRecep)
                                if(idRecep =! ''){
                                    log.debug('dentro',idRecep);
                                    log.debug('id_Recepcion',id_Recepcion);
                                    let openRecordrecepcion = record.load({ type: record.Type.CALENDAR_EVENT, id: id_Recepcion, isDynamic: true });

                                    //Inicio accesorio 
                                    if (typeof scriptContext.accesorioRadio != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_radio', value: scriptContext.accesorioRadio });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioPerillas != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_perillas', value: scriptContext.accesorioPerillas });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioTapaCombustible != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_tapacombustible', value: scriptContext.accesorioTapaCombustible });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioAlfombraPiso != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_alfombrapiso', value: scriptContext.accesorioAlfombraPiso });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioAireAcondicionado != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_aireacondicionado', value: scriptContext.accesorioAireAcondicionado });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioBrazosPlumas != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_brazosplumas', value: scriptContext.accesorioBrazosPlumas });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioMascarrillas != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_mascarillas', value: scriptContext.accesorioMascarrillas });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioCenicero != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_cenicero', value: scriptContext.accesorioCenicero });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioChicotes != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_chicotes', value: scriptContext.accesorioChicotes });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioLucesParqueo != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_lucesparqueo', value: scriptContext.accesorioLucesParqueo });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioTopesPuertas != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_topespuertas', value: scriptContext.accesorioTopesPuertas });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioVidriosYSeguros != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_vidriosyseguros', value: scriptContext.accesorioVidriosYSeguros });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioMoquetas != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_moquetas', value: scriptContext.accesorioMoquetas });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioManualRadio != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_manualradio', value: scriptContext.accesorioManualRadio });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioPalanca != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_palanca', value: scriptContext.accesorioPalanca });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioEncendedor != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_encededor', value: scriptContext.accesorioEncendedor });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioEspejoInterior != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_espejointerior', value: scriptContext.accesorioEspejoInterior });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioEspejoExterior != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_espejoexterior', value: scriptContext.accesorioEspejoExterior });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioVentCalef != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_ventcalef', value: scriptContext.accesorioVentCalef });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioTapaCubos != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_tapacubos', value: scriptContext.accesorioTapaCubos });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioParlantes != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_parlantes', value: scriptContext.accesorioParlantes });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioAntena != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_antena', value: scriptContext.accesorioAntena });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioManualCarro != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_manualcarro', value: scriptContext.accesorioManualCarro });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioLlantaEmergencia != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_llantaemergencia', value: scriptContext.accesorioLlantaEmergencia });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioLucesYFaros != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_lucesyfaros', value: scriptContext.accesorioLucesYFaros });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioMicasDeLuces != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_micasdeluces', value: scriptContext.accesorioMicasDeLuces });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioCabecera != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_cabecera', value: scriptContext.accesorioCabecera });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioHerramientas != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_herramientas', value: scriptContext.accesorioHerramientas });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioGata != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_gata', value: scriptContext.accesorioGata });
                                        guardar2 = 1;
                                    }

                                    if (typeof scriptContext.accesorioLlaveRueda != 'undefined') {
                                        openRecordrecepcion.setValue({ fieldId: 'custevent_ht_rc_llaverueda', value: scriptContext.accesorioLlaveRueda });
                                        guardar2 = 1;
                                    }
                                    //fin Accesorio
                                        log.debug('Acción', 'Chequeo: ');
                                    if (guardar2 == 1) {
                                        let os = openRecordrecepcion.save();
                                        log.debug('Acción', 'Chequeo: ' + os);
                                        respuesta = 'Actualización: ' + action;
                                    }
                                }
                            }
                            //openRecord.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                        } else {
                            log.debug('Acción', 'Internalid Orden de Trabajo no definida');
                            respuesta = 'internalid Orden de Trabajo no definida';
                        }
                        break;
                    case FOTO:
                        if (typeof scriptContext.nombre != 'undefined') {
                            log.debug('ENTRY FOTO', 'Entry');
                            let img = postImage(scriptContext);
                            log.debug('RESPONSE FOTO', img);
                            respuesta = img;
                        }
                        break;
                    default:
                        log.debug('Acción', 'Sin coincidencia de acción');
                        break;
                }
                return respuesta;
            } else {
                return accion;
            }
        } catch (error) {
            return error;
        }
    }

    const esFechaValida = (fecha) => {
        let regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        if (!regex.test(fecha)) {
            return false;
        }

        let partes = fecha.split('/');
        let dia = parseInt(partes[0], 10);
        let mes = parseInt(partes[1], 10) - 1;
        let anio = parseInt(partes[2], 10);

        let dateObj = new Date(anio, mes, dia);
        if (dateObj.getFullYear() !== anio || dateObj.getMonth() !== mes || dateObj.getDate() !== dia) {
            return false;
        } else {
            return true;
        }
    }

    const BuscarCliente = (codigo) => {
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                [
                    ["formulatext: {vatregnumber}","startswith",codigo]
                ],
                columns:
                [
                   search.createColumn({name: "internalid", label: "ID interno"}),
                ]
            });

            var arr = [];
            var myPagedData = customerSearchObj.runPaged({ pageSize: 1000 });
            myPagedData.pageRanges.forEach(pageRange => {
                let myPage = myPagedData.fetch({ index: pageRange.index });
                myPage.data.forEach(result => {
                    let columns = result.columns;
                    let id = result.getValue(columns[0]);
                    arr.push(id);
                    return true
                });

            });

            return arr;
        } catch (e) {
            log.error('Error en BuscarCliente', e);
        }
    }

    const postImage = (params) => {
        let body = params.foto;
        let nombre = params.nombre;
        let transaction = params.transaccion;
        let tipo = params.tipo;
        let novedades = params.novedades;
        //log.debug("Request", body);

        let fileObj = file.create({
            name: nombre + '.jpg',
            fileType: file.Type.PJPGIMAGE,
            encoding: file.Encoding.UTF_8,
            folder: 2851,
            isOnline: true,
            contents: body
        });
        let fileId = fileObj.save();
        log.debug('fileId-Saved', fileId);

        let fileObjURL = file.load({
            // id: 'Images/myImageFile.jpg'
            id: fileId
        });

        let crearFoto = record.create({type: 'customrecord_ht_rc_fotos_recepcion', isDynamic: true });
        crearFoto.setValue({fieldId: 'custrecord_ht_fr_orden_servicio', value:transaction });
        crearFoto.setValue({fieldId: 'custrecord_ht_fr_tipo_foto', value: tipo });
        crearFoto.setValue({fieldId: 'custrecord_ht_fr_foto', value: fileId });
        crearFoto.setValue({fieldId: 'custrecord_ht_fr_novedades', value: novedades });
        let registroFoto = crearFoto.save();
        log.debug({details: "File URL: " + fileObjURL.url});

        return registroFoto;

        // return { response: URL + fileObjURL.url };
    }

    return {
        get: _get,
        post: _post
    }
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 6/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/

// search.createColumn({ name: "class", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Class" }),
                        // search.createColumn({ name: "trandate", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Date" }),
                        // search.createColumn({ name: "department", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Department" }),
                        // search.createColumn({ name: "location", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Location" }),
                        // search.createColumn({ name: "custbody_ht_os_aprobacioncartera", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Cartera" }),
                        // search.createColumn({ name: "custbody_ht_os_aprobacionventa", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Venta" }),
                        // search.createColumn({ name: "custbody_ht_os_ejecutiva_backoffice", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de Gestión" }),
                        // search.createColumn({ name: "custbody_ht_os_ejecutivareferencia", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de referencia" }),
                        // search.createColumn({ name: "salesrep", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Sales Rep" }),
                        // search.createColumn({ name: "opportunity", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Opportunity" }),
                        // search.createColumn({ name: "subsidiarynohierarchy", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Subsidiary (no hierarchy)" }),
                        // search.createColumn({ name: "custbody_ht_os_companiaseguros", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Aseguradora" }),                  
                        // search.createColumn({ name: "custbody2", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Bancos" }),
                        // search.createColumn({ name: "custbody_ht_os_vendcanaldistribucion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Vendedor del canal de distribución" }),
                        // search.createColumn({ name: "custbody_ht_facturar_a", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Facturar a" }),
                        // search.createColumn({ name: "custbody_ht_os_trabajado", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Trabajado" }),
                        // search.createColumn({ name: "custbody_ht_os_novedades", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Novedades" }),                    
                        // search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "HT OT Estado Orden de trabajo" }),
                        // search.createColumn({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" }),                      
                        // search.createColumn({ name: "custrecord_ht_ot_estadolojack", summary: "GROUP", label: "Estado Lojack" }),
                        // search.createColumn({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "HT Box Serie" }),
                        // search.createColumn({ name: "custrecord_ht_ot_pxadminfinalizacion", summary: "GROUP", label: "HT Confirmación PX Admin" }),
                        // search.createColumn({ name: "custrecord_ht_ot_estadochaser", summary: "GROUP", label: "Estado Chaser" }),
                        // search.createColumn({ name: "custrecord_ht_ot_confirmaciontelamatic", summary: "GROUP", label: "HT Confirmación Telematic" }),
                        // search.createColumn({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "HT OS Modelo" }),
                        // search.createColumn({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "HT OT APN" }),
                        // search.createColumn({ name: "custrecord_ht_ot_aireacondicionado", summary: "GROUP", label: "HT OT Aire acondicionado" }),
                        // search.createColumn({ name: "custrecord_ht_ot_alfombrapiso", summary: "GROUP", label: "HT OT Alfombra de piso" }),
                        // search.createColumn({ name: "custrecord_ht_ot_brazosplumas", summary: "GROUP", label: "HT OT Brazos y Plumas" }),
                        // search.createColumn({ name: "custrecord_ht_ot_contidadcontroles", summary: "GROUP", label: "HT OT Cantidad controles" }),
                        // search.createColumn({ name: "custrecord_ht_ot_cantidadllaves", summary: "GROUP", label: "HT OT Cantidad llaves" }),
                        // search.createColumn({ name: "custrecord_ht_ot_cenicero", summary: "GROUP", label: "HT OT Cenicero" }),
                        
                        // search.createColumn({ name: "custrecord_ht_ot_chicotes", summary: "GROUP", label: "HT OT Chicotes" }),
                        // search.createColumn({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "HT OT Color" }),
                        // search.createColumn({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Código de Activación" }),
                        // search.createColumn({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Código de Respuesta" }),
                        // search.createColumn({ name: "created", summary: "GROUP", label: "Date Created" }),
                        // search.createColumn({ name: "custrecord_ht_ot_porcentajecombustible", summary: "GROUP", label: "HT OT Combustible" }),
                        // search.createColumn({ name: "custrecord_ht_ot_telematicfinalizacion", summary: "GROUP", label: "HT OT Conectividad Telematic" }),
                        // search.createColumn({ name: "custrecord_ht_ot_connovedad", summary: "GROUP", label: "HT OT Con novedad" }),
                        // search.createColumn({ name: "custrecord_ht_ot_correorecepcion", summary: "GROUP", label: "HT OT Correo" }),
                        
                       
                        // search.createColumn({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "HT OT Dispositivo" }),
                        // search.createColumn({ name: "custrecord_ht_ot_fechaentrega", summary: "GROUP", label: "HT OT Fecha entrega" }),                      
                        // search.createColumn({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "HT OT Firmware" }), 
                        // search.createColumn({ name: "custrecord_ht_ot_horaentrega", summary: "GROUP", label: "HT OT Hora entrega" }),
                        // search.createColumn({ name: "custrecord_ht_ot_lucesparqueo", summary: "GROUP", label: "HT OT Luces Parqueo" }),
                        // search.createColumn({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "HT OT IP" }),
                        // search.createColumn({ name: "custrecord_ht_ot_item_vent_alq", summary: "GROUP", label: "HT OT Item Vent Alq" }),
                        // search.createColumn({ name: "custrecord_ht_ot_listacomentarios", summary: "GROUP", label: "HT OT Lista de comentarios" }),
                        // search.createColumn({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "HT OT Marca" }),
                        // search.createColumn({ name: "custrecord_ht_ot_mascarillas", summary: "GROUP", label: "HT OT Mascarillas" }),
                        // search.createColumn({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "HT OT Modelo" }),
                        // search.createColumn({ name: "custrecord_ht_ot_motivos", summary: "GROUP", label: "HT OT Motivos" }),
                        // search.createColumn({ name: "custrecord_ht_ot_motivoscomentario", summary: "GROUP", label: "HT OT Motivos Comentario" }),
                        
                        // search.createColumn({ name: "custrecord_ht_ot_nombrereciberecepcion", summary: "GROUP", label: "HT OT Nombre Recibe" }),
                        // search.createColumn({ name: "custrecord_ht_ot_nombreentregarecepcion", summary: "GROUP", label: "HT OT Nombre entrega" }),
                        // search.createColumn({ name: "custrecord_ht_ot_novedades", summary: "GROUP", label: "HT OT Novedades" }),
                        // search.createColumn({ name: "custrecord_ht_ot_odometro", summary: "GROUP", label: "HT OT Odómetro" }),
                        // search.createColumn({ name: "custrecord_ht_ot_paralizador", summary: "GROUP", label: "HT OT Paralizador" }),
                        // search.createColumn({ name: "custrecord_ht_ot_perillas", summary: "GROUP", label: "HT OT Perillas" }),
                        // search.createColumn({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "HT OT Placa" }),
                        // search.createColumn({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "HT OT Script" }),
                        // search.createColumn({ name: "custrecord_ht_ot_radio", summary: "GROUP", label: "HT OT Radio" }),
                        // search.createColumn({ name: "custrecord_ht_ot_serieproductoasignacion", summary: "GROUP", label: "Serie Producto" }),
                        // search.createColumn({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "HT OT Servidor" }),
                        // search.createColumn({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "HT OT Sim Card" }),
                        // search.createColumn({ name: "custrecord_ht_ot_sinnovedad", summary: "GROUP", label: "HT OT Sin novedad" }),
                        // search.createColumn({ name: "custrecord_ht_ot_supervisorasignacion", summary: "GROUP", label: "HT OT Supervisor" }),
                        // search.createColumn({ name: "custrecord_ht_ot_tapacombustible", summary: "GROUP", label: "HT OT Tapa Combustible" }),
                        
                        // search.createColumn({ name: "custrecord_ht_ot_termometro", summary: "GROUP", label: "HT OT Termometro" }),
                        // search.createColumn({ name: "custrecord_ht_ot_tipo", summary: "GROUP", label: "HT OT Tipo" }),
                        // search.createColumn({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "HT OT Unidad" }),
                        // search.createColumn({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "HT OT Version" }),
                        // search.createColumn({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" }),
                        // search.createColumn({ name: "custrecord_ht_ot_oficinaatencion", summary: "GROUP", label: "Oficina de atención" }),
                        // search.createColumn({ name: "custrecord_ht_ot_noimpulsaplataformas", summary: "GROUP", label: "No impulsa a Plataformas" }), 



                                           // let clase = result.getText({ name: "class", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Class" })
                    // let fechaEmisiónOrdenServicio = result.getValue({ name: "trandate", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Date" })
                    // let departamento = result.getText({ name: "department", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Department" })
                    // let oficina = result.getText({ name: "location", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Location" })
                    // let aprobacionCartera = result.getValue({ name: "custbody_ht_os_aprobacioncartera", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Cartera" })
                    // let aprobacionVenta = result.getValue({ name: "custbody_ht_os_aprobacionventa", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Venta" })
                    // let ejecutivaGestion = result.getValue({ name: "custbody_ht_os_ejecutiva_backoffice", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de Gestión" })
                    // let ejecutivaReferencia = result.getValue({ name: "custbody_ht_os_ejecutivareferencia", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de referencia" })
                    // let ejecutivaRenovacion = result.getValue({ name: "salesrep", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Sales Rep" })
                    // let oportunidad = result.getValue({ name: "opportunity", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Opportunity" })
                    // let subsidiaria = result.getValue({ name: "subsidiarynohierarchy", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Subsidiary (no hierarchy)" })
                    // let aseguradora = result.getValue({ name: "custbody_ht_os_companiaseguros", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Aseguradora" })                 
                    // let bancos = result.getValue({ name: "custbody2", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Bancos" })
                    // let vendedorCanalDistribucion = result.getValue({ name: "custbody_ht_os_vendcanaldistribucion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Vendedor del canal de distribución" })
                    // let facturarA = result.getValue({ name: "custbody_ht_facturar_a", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Facturar a" })
                    // let trabajado = result.getValue({ name: "custbody_ht_os_trabajado", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Trabajado" })
                    // let novedadesOrdenServicio = result.getValue({ name: "custbody_ht_os_novedades", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Novedades" })                
                    // let ordenTrabajoEstado = result.getValue({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "HT OT Estado Orden de trabajo" })
                    // let itemid = result.getValue({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
                    // let item = result.getText({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
                    // let estadoLojack = result.getValue({ name: "custrecord_ht_ot_estadolojack", summary: "GROUP", label: "Estado Lojack" })
                    // let boxSerie = result.getValue({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "HT Box Serie" })
                    // let confirmacionPXAdmin = result.getValue({ name: "custrecord_ht_ot_pxadminfinalizacion", summary: "GROUP", label: "HT Confirmación PX Admin" })
                    // let estadoChaser = result.getValue({ name: "custrecord_ht_ot_estadochaser", summary: "GROUP", label: "Estado Chaser" })
                    // let confirmacionTelematics = result.getValue({ name: "custrecord_ht_ot_confirmaciontelamatic", summary: "GROUP", label: "HT Confirmación Telematics" })
                    // let modeloBien = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "HT OS Modelo" })
                    // let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "HT OT APN" })
                    // let aireaAcondicionado = result.getValue({ name: "custrecord_ht_ot_aireacondicionado", summary: "GROUP", label: "HT OT Aire acondicionado" })
                    // let alfombraPiso = result.getValue({ name: "custrecord_ht_ot_alfombrapiso", summary: "GROUP", label: "HT OT Alfombra de piso" })
                    // let brazosPlumas = result.getValue({ name: "custrecord_ht_ot_brazosplumas", summary: "GROUP", label: "HT OT Brazos y Plumas" })
                    // let cantidadControles = result.getValue({ name: "custrecord_ht_ot_contidadcontroles", summary: "GROUP", label: "HT OT Cantidad controles" })
                    // let cantidadLlaves = result.getValue({ name: "custrecord_ht_ot_cantidadllaves", summary: "GROUP", label: "HT OT Cantidad llaves" })
                    // let cenicero = result.getValue({ name: "custrecord_ht_ot_cenicero", summary: "GROUP", label: "HT OT Cenicero" })
                    // let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "HT OT Chasis" })
                    // let chocotes = result.getValue({ name: "custrecord_ht_ot_chicotes", summary: "GROUP", label: "HT OT Chicotes" })
                    // let color = result.getValue({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "HT OT Color" })
                    // let codigoActivacion = result.getValue({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Código de Activación" })
                    // let codigoRespuesta = result.getValue({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Código de Respuesta" })
                    // let fecha = result.getValue({ name: "created", summary: "GROUP", label: "Date Created" })
                    // let conbustible = result.getValue({ name: "custrecord_ht_ot_porcentajecombustible", summary: "GROUP", label: "HT OT Combustible" })
                    // let conectividadTelematics = result.getValue({ name: "custrecord_ht_ot_telematicfinalizacion", summary: "GROUP", label: "HT OT Conectividad Telematics" })
                    // let conNovedad = result.getValue({ name: "custrecord_ht_ot_connovedad", summary: "GROUP", label: "HT OT Con novedad" })
                    // let correo = result.getValue({ name: "custrecord_ht_ot_correorecepcion", summary: "GROUP", label: "HT OT Correo" })
                    // let direccionCliente = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "HT OT Dirección del Cliente" })
                    // let correoCliente = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "HT OT Correo del Cliente" })
                    // let dispositivo = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "HT OT Dispositivo" })
                    // let fechaEntrega = result.getValue({ name: "custrecord_ht_ot_fechaentrega", summary: "GROUP", label: "HT OT Fecha entrega" })              
                    // let fimaware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "HT OT Firmware" })
                    // let horaEntrega = result.getValue({ name: "custrecord_ht_ot_horaentrega", summary: "GROUP", label: "HT OT Hora entrega" })                 
                    // let lucesParqueo = result.getValue({ name: "custrecord_ht_ot_lucesparqueo", summary: "GROUP", label: "HT OT Luces Parqueo" })
                    // let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "HT OT IP" })
                    // let itemVentAlquiler = result.getValue({ name: "custrecord_ht_ot_item_vent_alq", summary: "GROUP", label: "HT OT Item Vent Alq" })
                    // let listaComentarios = result.getValue({ name: "custrecord_ht_ot_listacomentarios", summary: "GROUP", label: "HT OT Lista de comentarios" })
                    // let marca = result.getValue({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "HT OT Marca" })
                    // let mascarillas = result.getValue({ name: "custrecord_ht_ot_mascarillas", summary: "GROUP", label: "HT OT Mascarillas" })
                    // let modeloDispositivo = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "HT OT Modelo" })
                    // let motivos = result.getValue({ name: "custrecord_ht_ot_motivos", summary: "GROUP", label: "HT OT Motivos" })
                    // let motivoComentario = result.getValue({ name: "custrecord_ht_ot_motivoscomentario", summary: "GROUP", label: "HT OT Motivos Comentario" })
                    // let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "HT OT Motor" })
                    // let nombreRecibe = result.getValue({ name: "custrecord_ht_ot_nombrereciberecepcion", summary: "GROUP", label: "HT OT Nombre Recibe" })
                    // let nombreEntrega = result.getValue({ name: "custrecord_ht_ot_nombreentregarecepcion", summary: "GROUP", label: "HT OT Nombre entrega" })
                    // let novedades = result.getValue({ name: "custrecord_ht_ot_novedades", summary: "GROUP", label: "HT OT Novedades" })
                    // let odometro = result.getValue({ name: "custrecord_ht_ot_odometro", summary: "GROUP", label: "HT OT Odómetro" })
                    // let paralizador = result.getValue({ name: "custrecord_ht_ot_paralizador", summary: "GROUP", label: "HT OT Paralizador" })
                    // let perillas = result.getValue({ name: "custrecord_ht_ot_perillas", summary: "GROUP", label: "HT OT Perillas" })
                    // let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "HT OT Placa" })
                    // let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "HT OT Script" })
                    // let radio = result.getValue({ name: "custrecord_ht_ot_radio", summary: "GROUP", label: "HT OT Radio" })
                    // let serieProducto = result.getText({ name: "custrecord_ht_ot_serieproductoasignacion", summary: "GROUP", label: "Serie Producto" })
                    // let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "HT OT Servidor" })
                    // let simCard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "HT OT Sim Card" })
                    // let sinNovedad = result.getValue({ name: "custrecord_ht_ot_sinnovedad", summary: "GROUP", label: "HT OT Sin novedad" })
                    // let supervisor = result.getValue({ name: "custrecord_ht_ot_supervisorasignacion", summary: "GROUP", label: "HT OT Supervisor" })
                    // let tapaCombustible = result.getValue({ name: "custrecord_ht_ot_tapacombustible", summary: "GROUP", label: "HT OT Tapa Combustible" })
                    // let telefonoCliente = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "HT OT Teléfono del Cliente" })
                    // let termometro = result.getValue({ name: "custrecord_ht_ot_termometro", summary: "GROUP", label: "HT OT Termometro" })
                    // let tipoBien = result.getValue({ name: "custrecord_ht_ot_tipo", summary: "GROUP", label: "HT OT Tipo" })
                    // let unidad = result.getValue({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "HT OT Unidad" })
                    // let version = result.getValue({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "HT OT Version" })
                    // let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                    // let oficinaAtencion = result.getValue({ name: "custrecord_ht_ot_oficinaatencion", summary: "GROUP", label: "Oficina de atención" })
                    // let impulsaPlataformas = result.getValue({ name: "custrecord_ht_ot_noimpulsaplataformas", summary: "GROUP", label: "No impulsa a Plataformas" })


                    // clase: clase,
                        // fechaEmisiónOrdenServicio: fechaEmisiónOrdenServicio,
                        // departamento: departamento,
                        // oficina: oficina,
                        // aprobacionCartera: aprobacionCartera,
                        // aprobacionVenta: aprobacionVenta,
                        // ejecutivaGestion: ejecutivaGestion,
                        // ejecutivaReferencia: ejecutivaReferencia,
                        // ejecutivaRenovacion: ejecutivaRenovacion,
                        // oportunidad: oportunidad,
                        // subsidiaria: subsidiaria,
                        // aseguradora: aseguradora,
                        // bancos: bancos,
                        // vendedorCanalDistribucion: vendedorCanalDistribucion,
                        // facturarA: facturarA,
                        // trabajado: trabajado,
                        // novedadesOrdenServicio: novedadesOrdenServicio,
                        // ordenTrabajo: ordenTrabajo,
                        // ordenTrabajoEstado: ordenTrabajoEstado,
                        // itemid: itemid,
                        // item: item,   
                        // estadoLojack: estadoLojack,
                        // boxSerie: boxSerie,
                        // confirmacionPXAdmin: confirmacionPXAdmin,
                        // estadoChaser: estadoChaser,
                        // confirmacionTelematics: confirmacionTelematics,
                        // modeloBien: modeloBien,
                        // apn: apn,
                        // aireaAcondicionado: aireaAcondicionado,
                        // alfombraPiso: alfombraPiso,
                        // brazosPlumas: brazosPlumas,
                        // cantidadControles: cantidadControles,
                        // cantidadLlaves: cantidadLlaves,
                        // cenicero: cenicero,
                        // chasis: chasis,
                        // chocotes: chocotes,
                        // color: color,
                        // codigoActivacion: codigoActivacion,
                        // codigoRespuesta: codigoRespuesta,
                        // conbustible: conbustible,
                        // conectividadTelematics: conectividadTelematics,
                        // conNovedad: conNovedad,
                        // correo: correo,
                        // direccionCliente: direccionCliente,
                        // correoCliente: correoCliente,
                        // dispositivo: dispositivo,
                        // fechaEntrega: fechaEntrega,                       
                        // fimaware: fimaware,
                        // horaEntrega: horaEntrega,        
                        // lucesParqueo: lucesParqueo,
                        // ip: ip,
                        // itemVentAlquiler: itemVentAlquiler,
                        // listaComentarios: listaComentarios,
                        // marca: marca,
                        // mascarillas: mascarillas,
                        // modeloDispositivo, modeloDispositivo,
                        // motivos: motivos,
                        // motivoComentario: motivoComentario,
                        // motor: motor,
                        // nombreRecibe: nombreRecibe,
                        // nombreEntrega: nombreEntrega,
                        // novedades: novedades,
                        // odometro: odometro,
                        // paralizador: paralizador,
                        // perillas: perillas,
                        // placa: placa,
                        // script: script,
                        // radio: radio,
                        // serieProducto: serieProducto,
                        // servidor: servidor,
                        // simCard: simCard,
                        // sinNovedad: sinNovedad,
                        // supervisor: supervisor,
                        // tapaCombustible: tapaCombustible,
                        // telefonoCliente: telefonoCliente,
                        // termometro: termometro,
                        // tipoBien: tipoBien,
                        //tecnicoAsignado: tecnicoAsignado,
                        // unidad: unidad,
                        // version: version,
                        // imei1_: imei,
                        // oficinaAtencion: oficinaAtencion,
                        // impulsaPlataformas: impulsaPlataformas,