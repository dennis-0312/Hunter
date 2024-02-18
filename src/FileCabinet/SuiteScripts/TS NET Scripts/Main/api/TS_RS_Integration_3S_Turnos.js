/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_RS_Integration_3S_Turnos.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
Url: https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=694&deploy=1
=============================================================================================================================================*/
/**
*@NApiVersion 2.1
*@NScriptType Restlet
*/
define(['N/log', 'N/search', 'N/record', 'N/query', 'N/runtime'], (log, search, record, query, runtime) => {
    const HT_CONSULTA_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_consulta_orden_servicio'; //HT Consulta Orden de Servicio - PRODUCCION
    const HT_REGISTRO_BIENES_RECORD = 'customrecord_ht_record_registrobienes'; //
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo'; //
    const HT_TECNICO_TABLET = 'customrecord_ht_tect_tecnicotablet'; //
    const HT_TURNO = 'task'; //
    const HT_CONSULTA_ORDEN_TRABAJO_SEARCH = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
    const ESTADO_VENTAS = 7;
    const PRIMER_TURNO = 1;
    const SEGUNDO_TURNO = 2;

    const _get = (scriptContext) => {
        // let nrodocumento = context.nrodocumento;
        // log.debug('Context', nrodocumento);
        let idOT = 'vacio';
        let idOS = 'vacio';
        let placa = 'vacio';
        let jsonResult = new Array();
        log.debug('Context', scriptContext);

        try {
            var fechaTurnoDesde = '';
            var fechaTurnoHasta = '';
            var filtro_fecha = false;
            let param = false;
            let tecnico_param = false;
            let taller_param = false;
            let cliente_param = false;
            let vehiculo_param = false;
            let OrdeServ_param = false;
            let consultanro4_param = false;
            let filter =
                [
                    ["custrecord_ht_ot_orden_servicio.class", "noneof", "@NONE@"],
                    "AND",
                    ["custrecord_ht_ot_orden_servicio.department", "noneof", "@NONE@"]
                ];
            let filter_Cliente =
                [
                    ["isinactive", "is", "F"]
                ];
            let filter_Tecnico = [
                ["custevent_ht_turno_taller", "noneof", "@NONE@"]
            ];
            let filter_Taller = filter;
            let filter_Vehiculo = filter;
            let filter_OrdenServ = filter;
            let consulta_nro4 = [];
            // switch (scriptContext.filtro) {
            //     case 'ordenservicio':
            //         filter = ["custrecord_ht_ot_orden_serivicio_txt", "startswith", scriptContext.ordenservicio]
            //         break;
            //     case 'ordentrabajo':
            //         filter = ["idtext", "startswith", scriptContext.ordentrabajo]
            //         break;
            //     case 'fechaemision':
            //         let from = esFechaValida(scriptContext.desde);
            //         let to = esFechaValida(scriptContext.hasta);
            //         if (from == true && to == true) {
            //             filter = ["custrecord_ht_ot_orden_servicio.trandate", "within", scriptContext.desde, scriptContext.hasta]
            //         } else {
            //             return 'Las fechas ingresadas no son válidas';
            //         }
            //         break;
            //     case 'tecnico': //277
            //         filter = ["custrecord_ht_ot_tecnicoasignacion", "anyof", scriptContext.tecnico]
            //         break;
            //     default:
            //         filter = false;
            //         break;
            // }

            if (typeof scriptContext.ostieneturno != 'undefined') {
                if (scriptContext.ostieneturno.length != 0) {
                    if (scriptContext.ostieneturno == 'T') {
                        filter_OrdenServ.push("AND", ["custrecord_ht_ot_taller", "noneof", "@NONE@"]);
                    } else if (scriptContext.ostieneturno == 'F') {
                        //filter.push("AND", ["custrecord_ht_ot_estado", "anyof", "7"]);
                        filter_OrdenServ.push("AND", ["custrecord_ht_ot_taller", "anyof", "@NONE@"]);
                    }
                    param = true;
                    OrdeServ_param = true;
                }
            }

            if (typeof scriptContext.osdesde != 'undefined' && typeof scriptContext.oshasta != 'undefined') {
                let FechaDesde = scriptContext.osdesde;
                FechaDesde = FechaDesde.replace(/-/g, '/');
                FechaDesde = FechaDesde.replace(/"/g, "");
                let FechaHasta = scriptContext.oshasta;
                FechaHasta = FechaHasta.replace(/-/g, '/');
                FechaHasta = FechaHasta.replace(/"/g, "");
                let from = esFechaValida(FechaDesde);
                let to = esFechaValida(FechaHasta);
                if (from == true && to == true) {
                    filter_OrdenServ.push("AND", ["custrecord_ht_ot_orden_servicio.trandate", "within", FechaDesde, FechaHasta])
                    param = true;
                    OrdeServ_param = true;
                } else {
                    return 'Las fechas ingresadas no son válidas';
                }
            }

            if (typeof scriptContext.fechadesde != 'undefined' && typeof scriptContext.fechahasta != 'undefined') {
                let FechaDesde = scriptContext.fechadesde;
                FechaDesde = FechaDesde.replace(/-/g, '/');
                FechaDesde = FechaDesde.replace(/"/g, "");
                let FechaHasta = scriptContext.fechahasta;
                FechaHasta = FechaHasta.replace(/-/g, '/');
                FechaHasta = FechaHasta.replace(/"/g, "");
                let from = esFechaValida(FechaDesde);
                let to = esFechaValida(FechaHasta);

                if (from == true && to == true) {
                    fechaTurnoDesde = FechaDesde;
                    fechaTurnoHasta = FechaHasta;
                    filtro_fecha = true;
                    param = true;
                    OrdeServ_param = true;
                } else {
                    return 'Las fechas ingresadas no son válidas';
                }
            }

            if (typeof scriptContext.turnoordenservicio != 'undefined') {
                if (scriptContext.turnoordenservicio.length != 0) {
                    filter_Tecnico.push("AND", ["transaction.tranid", "contains", scriptContext.turnoordenservicio])
                    param = true;
                    tecnico_param = true;
                }
            }

            if (typeof scriptContext.turnodesde != 'undefined' && typeof scriptContext.turnohasta != 'undefined') {
                let FechaDesde = scriptContext.turnodesde;
                FechaDesde = FechaDesde.replace(/-/g, '/');
                FechaDesde = FechaDesde.replace(/"/g, "");
                let FechaHasta = scriptContext.turnohasta;
                FechaHasta = FechaHasta.replace(/-/g, '/');
                FechaHasta = FechaHasta.replace(/"/g, "");
                let from = esFechaValida(FechaDesde);
                let to = esFechaValida(FechaHasta);
                if (from == true && to == true) {
                    filter_Tecnico.push("AND", ["startdate", "within", FechaDesde, FechaHasta])
                    param = true;
                    tecnico_param = true;
                } else {
                    return 'Las fechas ingresadas no son válidas';
                }
            }

            if (typeof scriptContext.codigotecnico != 'undefined') {
                if (scriptContext.codigotecnico.length != 0) {
                    //filter.push("AND", ["custrecord_ht_ot_tecnicoasignacion", "anyof", scriptContext.tecnico])
                    param = true;
                    filter_Tecnico.push("AND", ["assigned", "anyof", scriptContext.codigotecnico])
                    tecnico_param = true;
                }
            }

            if (typeof scriptContext.descripciontecnico != 'undefined') {
                if (scriptContext.descripciontecnico.length != 0) {
                    param = true;
                    filter_Tecnico.push("AND", ["assigned.entityid", "haskeywords", scriptContext.descripciontecnico])
                    tecnico_param = true;
                }
            }

            if (typeof scriptContext.turnodescripciontaller != 'undefined') {
                if (scriptContext.turnodescripciontaller.length != 0) {
                    param = true;
                    filter_Tecnico.push("AND", ["custevent_ht_turno_taller.custrecord_ht_tt_descripcion", "contains", scriptContext.turnodescripciontaller])
                    tecnico_param = true;
                }
            }

            if (typeof scriptContext.turnocodigotaller != 'undefined') {
                if (scriptContext.turnocodigotaller.length != 0) {
                    param = true;
                    filter_Tecnico.push("AND", ["custevent_ht_turno_taller.custrecord_ht_tt_codigo", "startswith", scriptContext.turnocodigotaller])
                    tecnico_param = true;
                }
            }

            if (typeof scriptContext.codigotaller != 'undefined') {
                if (scriptContext.codigotaller.length != 0) {
                    param = true;
                    filter_Taller.push("AND", ["custrecord_ht_ot_taller.custrecord_ht_tt_codigo", "startswith", scriptContext.codigotaller])
                    taller_param = true;
                }
            }

            if (typeof scriptContext.nombrecliente != 'undefined') {
                if (scriptContext.nombrecliente.length != 0) {
                    param = true;
                    filter_Cliente.push("AND", ["altname", "contains", scriptContext.nombrecliente])
                    cliente_param = true;
                }
            }

            if (typeof scriptContext.cedularuc != 'undefined') {
                if (scriptContext.cedularuc.length != 0) {
                    param = true;
                    filter_Cliente.push("AND", ["vatregnumber", "startswith", scriptContext.cedularuc])
                    cliente_param = true;
                }
            }

            if (typeof scriptContext.nombre != 'undefined') {
                if (scriptContext.nombre.length != 0) {
                    consulta_nro4.push(["altname", "contains", scriptContext.nombre]);
                    param = true;
                    consultanro4_param = true;
                    //vehiculo_param = true;
                }
            }

            var idclienteconsulta = 0;
            if (typeof scriptContext.clienteId != 'undefined') {
                if (scriptContext.clienteId.length != 0) {
                    idclienteconsulta = scriptContext.clienteId;
                    //filter_Vehiculo.push("AND", ["custrecord_ht_ot_cliente_id.internalid", "anyof", scriptContext.clienteId]);
                    consulta_nro4.push(["custrecord_ht_bien_propietario", "anyof", scriptContext.clienteId])
                    param = true;
                    consultanro4_param = true;
                }
            }

            if (typeof scriptContext.codigoClienteVehiculo != 'undefined') {
                if (scriptContext.codigoClienteVehiculo.length != 0) {
                    let id_cliente = BuscarCliente(scriptContext.codigoClienteVehiculo);
                    log.error('id_cliente', id_cliente)
                    if (id_cliente != '' && idclienteconsulta == 0) {
                        //filter_Vehiculo.push("AND", ["custrecord_ht_ot_cliente_id.internalid", "anyof", id_cliente])
                        consulta_nro4.push(["custrecord_ht_bien_propietario", "anyof", id_cliente])
                    }
                    param = true;
                    //vehiculo_param = true;
                    consultanro4_param = true;
                }
            }

            if (typeof scriptContext.nombrevehiculo != 'undefined') {
                if (scriptContext.nombrevehiculo.length != 0) {
                    param = true;
                    //filter_Vehiculo.push("AND", ["custrecord_ht_ot_vehiculo.name", "contains", scriptContext.nombrevehiculo])
                    consulta_nro4.push(["name", "contains", scriptContext.nombrevehiculo])
                    consultanro4_param = true;
                }
            }

            if (param == false) {
                return 'Filtro no válido';
            }

            if (tecnico_param == true && (taller_param == true || cliente_param == true || consultanro4_param == true || OrdeServ_param == true)) {
                return 'Filtro no válido';
            }

            if (taller_param == true && (tecnico_param == true || cliente_param == true || consultanro4_param == true || OrdeServ_param == true)) {
                return 'Filtro no válido';
            }

            if (cliente_param == true && (tecnico_param == true || taller_param == true || consultanro4_param == true || OrdeServ_param == true)) {
                return 'Filtro no válido';
            }

            if (consultanro4_param == true && (tecnico_param == true || cliente_param == true || taller_param == true || OrdeServ_param == true)) {
                return 'Filtro no válido';
            }

            if (OrdeServ_param == true && (tecnico_param == true || cliente_param == true || taller_param == true || consultanro4_param == true)) {
                return 'Filtro no válido';
            }

            const Search_tecnico = search.create({
                type: HT_TURNO,
                filters: filter_Tecnico,
                columns:
                    [
                        search.createColumn({
                            name: "custevent_ht_tr_hora",
                            summary: "GROUP",
                            label: "Hora"
                        }),
                        search.createColumn({
                            name: "startdate",
                            summary: "GROUP",
                            label: "Fecha de inicio"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_tt_codigo",
                            join: "CUSTEVENT_HT_TURNO_TALLER",
                            summary: "GROUP",
                            label: "Código"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_tt_descripcion",
                            join: "CUSTEVENT_HT_TURNO_TALLER",
                            summary: "GROUP",
                            label: "Descripción"
                        }),
                        search.createColumn({
                            name: "transaction",
                            summary: "GROUP",
                            label: "Transacción"
                        }),
                        search.createColumn({
                            name: "assigned",
                            summary: "GROUP",
                            label: "Asignado a"
                        }),
                        search.createColumn({
                            name: "title",
                            summary: "GROUP",
                            label: "Título de turno"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "ID interno"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "transaction",
                            summary: "GROUP",
                            label: "ID interno"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTEVENT_HT_TURNO_TALLER",
                            summary: "GROUP",
                            label: "ID interno"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "assigned",
                            summary: "GROUP",
                            label: "ID interno"
                        }),
                        search.createColumn({
                            name: "entity",
                            join: "transaction",
                            summary: "GROUP",
                            label: "ID interno"
                        }),
                        search.createColumn({
                            name: "custevent_ht_turno_creado_por",
                            summary: "GROUP",
                            label: "Creador"
                        })
                    ]
            });

            const Search_taller = search.create({
                type: HT_ORDEN_TRABAJO_RECORD, //Orden de Trabajo Search - DEVELOPER
                filters: filter_Taller,
                columns:
                    [
                        search.createColumn({ name: "internalid", join: "custrecord_ht_ot_orden_servicio", summary: "GROUP", label: "ID interno" }),
                        search.createColumn({ name: "internalid", join: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Id cliente" }),
                        search.createColumn({ name: "custrecord_ht_pp_descripcion", join: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "HT OT descripcion" }),
                        search.createColumn({ name: "name", join: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "Destino Nombre" }),
                        search.createColumn({ name: "altname", join: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "Destino Nombre" }),
                        search.createColumn({ name: "internalid", join: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "Destino id" }),
                        search.createColumn({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "HT OT Comentario" }),
                        search.createColumn({ name: "location", join: "custrecord_ht_ot_orden_servicio", summary: "GROUP", label: "HT OT punto de Venta" })
                    ]
            });

            const consultaNro4 = search.create({
                type: 'customrecord_ht_record_bienes',
                filters: consulta_nro4,
                columns:
                    [
                        search.createColumn({ name: "altname", label: "Destino Nombre" }),
                        search.createColumn({ name: "name", label: "Nombre" }),
                        search.createColumn({ name: "custrecord_ht_bien_propietario", label: "Id cliente" }),
                    ]
            });

            const Search_vehiculo = search.create({
                type: HT_ORDEN_TRABAJO_RECORD,
                filters: filter_Vehiculo,
                columns:
                    [
                        search.createColumn({ name: "altname", join: "CUSTRECORD_HT_OT_VEHICULO", label: "Destino Nombre" }),
                        search.createColumn({ name: "name", join: "CUSTRECORD_HT_OT_VEHICULO", label: "ID" }),
                        search.createColumn({ name: "internalid", join: "custrecord_ht_ot_cliente_id", label: "Id cliente" }),
                    ]
            });

            const Search_cliente = search.create({
                type: 'customer', //Orden de Trabajo Search - DEVELOPER
                filters: filter_Cliente,
                columns:
                    [
                        search.createColumn({ name: "altname", summary: "GROUP", label: "Nombre Cliente" }),
                        search.createColumn({ name: "vatregnumber", summary: "GROUP", label: "ID Cliente" }),
                        search.createColumn({ name: "email", summary: "GROUP", label: "email Cliente" }),
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "ID interno" }),
                    ]
            });

            const Search_OrdServ = search.create({
                type: HT_ORDEN_TRABAJO_RECORD,
                filters: filter_OrdenServ,
                columns:
                    [
                        search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", label: "ID interno" }),
                        search.createColumn({ name: "custrecord_ht_ot_taller", label: "Taller" })
                    ]
            });

            if (tecnico_param == true) {
                let arr = [];
                let usuarioCreacion = '';
                let myPagedData = Search_tecnico.runPaged({ pageSize: 1000 });
                myPagedData.pageRanges.forEach(pageRange => {
                    let myPage = myPagedData.fetch({ index: pageRange.index });
                    myPage.data.forEach(result => {
                        let columns = result.columns;
                        let datosCliente = getClienteDatos(result.getValue(columns[11]));
                        //arr = [idcustomer,nombre,cedRuc];
                        let hora = result.getValue(columns[0]);
                        let fecha = result.getValue(columns[1]);
                        let codigo_taller = result.getValue(columns[2]);
                        let codigo_descripcion = result.getValue(columns[3]);
                        let transaccion = result.getValue(columns[4]);
                        let asignado = result.getText(columns[5]);
                        let title = result.getValue(columns[6]);
                        let internalID = result.getValue(columns[7]);
                        let ID_transac = result.getValue(columns[8]);
                        let ID_Taller = result.getValue(columns[9]);
                        let ID_Asig = result.getValue(columns[10]);
                        let cedula_creador = result.getValue(columns[12]) == '- None -' ? '' : result.getValue(columns[12]);
                        let sql = 'SELECT firstname, lastname FROM employee WHERE custentity_ec_numero_registro = ?'
                        let params = [cedula_creador]
                        let resultSet = query.runSuiteQL({ query: sql, params: params });
                        let results = resultSet.asMappedResults();
                        if (results.length > 0) {
                            usuarioCreacion = resultSet.asMappedResults()[0]['firstname'] + ' ' + resultSet.asMappedResults()[0]['lastname']
                        }

                        if (codigo_taller == '- None -') {
                            codigo_taller = '';
                        }
                        if (codigo_descripcion == '- None -') {
                            codigo_descripcion = '';
                        }

                        let repetido = false;
                        let arracuxi = [];
                        if (internalID != '' && internalID != null) {
                            for (let i = 0; i < arr.length; i++) {
                                if (arr[i][0] == internalID) {
                                    repetido = true;
                                }
                            }
                            arracuxi = [internalID]
                            if (repetido == false) {
                                //Buscar 
                                if (ID_transac != '') {
                                    var ordenServ = BuscarOS(ID_transac);
                                    //log.error('ordenServ',ordenServ);
                                    arr.push(arracuxi);
                                    jsonResult.push({
                                        propietarioBien: datosCliente[1],
                                        codigoPropietario: datosCliente[0],
                                        nrodocPropietario: datosCliente[2],
                                        codigoBien: ordenServ[9],
                                        codigoVehiculo: ordenServ[0],
                                        idTurno: internalID,
                                        codigoTurno3S: title,
                                        idTaller: ID_Taller,
                                        codigoTaller: codigo_taller,
                                        descripcionTaller: codigo_descripcion,
                                        idAsignado: ID_Asig,
                                        asignado: asignado,
                                        idOrdenServicio: ID_transac,
                                        ordenServicio: transaccion.split('#')[1],
                                        destinoNombre: ordenServ[1],
                                        fecha: fecha,
                                        horaInicio: hora,
                                        codigoUsuarioCreacion: cedula_creador,
                                        usuarioCreacion: usuarioCreacion,
                                    });
                                }
                            }
                        }
                    });
                });

            } else if (taller_param == true) {
                let myPagedData = Search_taller.runPaged({ pageSize: 1000 });
                myPagedData.pageRanges.forEach(pageRange => {
                    let myPage = myPagedData.fetch({ index: pageRange.index });
                    myPage.data.forEach(result => {

                        let ID_OV = result.getValue({ name: "internalid", join: "custrecord_ht_ot_orden_servicio", summary: "GROUP", label: "Orden Servicio" });
                        let TurnoDatos = getTurnoDatos(ID_OV, filtro_fecha);
                        let Hora_Inicio = TurnoDatos[0];
                        if (Hora_Inicio == null) {
                            Hora_Inicio = '';
                        }

                        let idClient = result.getValue({ name: "internalid", join: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Id cliente" });

                        let datosCliente = getClienteDatos(idClient);

                        let id_destino = result.getValue({ name: "internalid", join: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "Destino id" });
                        let Destino_Nombre = result.getValue({ name: "altname", join: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "Destino Nombre" });
                        let vid = result.getValue({ name: "name", join: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "Destino Nombre" });
                        let Tipo_trabajo_descripcion = result.getValue({ name: "custrecord_ht_pp_descripcion", join: "custrecord_ht_ot_tipo_trabajo", summary: "GROUP", label: "Tipo trabajo descripcion" });
                        if (Tipo_trabajo_descripcion == '- None -') {
                            Tipo_trabajo_descripcion = '';
                        }
                        let Comentario = result.getValue({ name: "custrecord_ht_ot_comentariofinalizacion", summary: "GROUP", label: "Comentarios" });
                        if (Comentario == '- None -') {
                            Comentario = '';
                        }
                        let Fecha_Creacion = TurnoDatos[1];
                        if (Fecha_Creacion == null) {
                            Fecha_Creacion = '';
                        }
                        let Punto_Venta = result.getText({ name: "location", join: "custrecord_ht_ot_orden_servicio", summary: "GROUP", label: "Punto Venta" });
                        let id_Punto_Venta = result.getValue({ name: "location", join: "custrecord_ht_ot_orden_servicio", summary: "GROUP", label: "Punto Venta" });

                        jsonResult.push({
                            idTurno: TurnoDatos[3],
                            codigoTurno3S: TurnoDatos[2],
                            horaInicio: Hora_Inicio,
                            clienteNombre: datosCliente[1],
                            codigoPropietario: datosCliente[0],
                            nrodocPropietario: datosCliente[2],
                            vidBien: vid,
                            codigoBien: id_destino,
                            destinoNombre: Destino_Nombre,
                            tipoTrabajoDescripcion: Tipo_trabajo_descripcion,
                            comentario: Comentario,
                            fechaCreacion: Fecha_Creacion,
                            codigoOficina: id_Punto_Venta,
                            puntoVenta: Punto_Venta,
                            codigoUsuarioCreacion: TurnoDatos[7],
                            usuarioCreacion: TurnoDatos[8],
                        });
                    });
                });

            } else if (cliente_param == true) {
                let myPagedData = Search_cliente.runPaged({ pageSize: 1000 });
                myPagedData.pageRanges.forEach(pageRange => {
                    let myPage = myPagedData.fetch({ index: pageRange.index });
                    myPage.data.forEach(result => {
                        let Nombre = result.getValue({ name: "altname", summary: "GROUP", label: "Nombre Cliente" });
                        let Cliente_ID = result.getValue({ name: "vatregnumber", summary: "GROUP", label: "ID Cliente" });
                        let Email = result.getValue({ name: "email", summary: "GROUP", label: "email Cliente" });
                        let id_Cliente = result.getValue({ name: "internalid", summary: "GROUP", label: "ID interno" });

                        jsonResult.push({
                            nombre: Nombre,
                            clienteId: Cliente_ID,
                            email: Email,
                            codigoCliente: id_Cliente
                        });
                    });
                });
            } else if (vehiculo_param == true) {
                let myPagedData = Search_vehiculo.runPaged({ pageSize: 1000 });
                let arr = []
                myPagedData.pageRanges.forEach(pageRange => {
                    let myPage = myPagedData.fetch({ index: pageRange.index });
                    myPage.data.forEach(result => {
                        let Destino_Nombre = result.getValue({ name: "altname", join: "CUSTRECORD_HT_OT_VEHICULO", label: "Nombre" });
                        let Destino_ID = result.getValue({ name: "name", join: "CUSTRECORD_HT_OT_VEHICULO", label: "ID" });
                        let Cliente_ID = result.getValue({ name: "internalid", join: "custrecord_ht_ot_cliente_id", label: "Id cliente" })
                        let datosCliente = getClienteDatos(Cliente_ID);
                        let repetido = false;
                        let arracuxi = [];
                        for (let i = 0; i < arr.length; i++) {
                            if (arr[i][0] == Destino_Nombre && arr[i][1] == Destino_ID) {
                                repetido = true;
                            }
                        }
                        arracuxi = [Destino_Nombre, Destino_ID]
                        if (repetido == false) {
                            arr.push(arracuxi);
                            jsonResult.push({
                                propietarioBien: datosCliente[1],
                                codigoPropietario: datosCliente[0],
                                nrodocPropietario: datosCliente[2],
                                destinoNombre: Destino_Nombre,
                                destinoId: Destino_ID
                            });
                        }

                    });
                });
            } else if (OrdeServ_param == true) {
                let arr = [];
                let myPagedData = Search_OrdServ.runPaged({ pageSize: 1000 });
                //log.error('myPagedData', myPagedData);
                myPagedData.pageRanges.forEach(pageRange => {
                    let myPage = myPagedData.fetch({ index: pageRange.index });
                    myPage.data.forEach(result => {
                        let columns = result.columns;
                        let idOrdenServic = result.getValue(columns[0]);
                        let Taller = result.getValue(columns[1]);

                        let repetido = false;
                        let arracuxi = [];

                        if (idOrdenServic != '' && idOrdenServic != null) {
                            for (let i = 0; i < arr.length; i++) {
                                if (arr[i][0] == idOrdenServic) {
                                    repetido = true;
                                }
                            }
                            arracuxi = [idOrdenServic]
                            if (repetido == false) {
                                //Buscar 
                                if (idOrdenServic != '') {
                                    // log.error('idOrdenServic', idOrdenServic);
                                    // log.error('Taller', Taller);
                                    var ordenServ = BuscarOS(idOrdenServic);
                                    //log.error('REQUEST', ordenServ);
                                    let TurnoDatos = [];
                                    arr.push(arracuxi);
                                    if (Taller != '') {
                                        TurnoDatos = getTurnoDatos(idOrdenServic, filtro_fecha, fechaTurnoDesde, fechaTurnoHasta);
                                        if (TurnoDatos.length > 0) {
                                            jsonResult.push({
                                                idTurno: TurnoDatos[3],
                                                codigoTurno3S: TurnoDatos[2],
                                                fechaTurno: TurnoDatos[1],
                                                idTaller: TurnoDatos[4],
                                                codigoTaller: TurnoDatos[5],
                                                descripcionTaller: TurnoDatos[6],
                                                idOrdenServicio: idOrdenServic,
                                                ordenServicio: ordenServ[5],
                                                idCliente: ordenServ[6],
                                                cliente: ordenServ[4],
                                                comentario: ordenServ[7],
                                                correoCliente: ordenServ[8],
                                                codigoVehiculo: ordenServ[0],
                                                destinoNombre: ordenServ[1],
                                                oficina: ordenServ[2],
                                                idOficina: ordenServ[3],
                                                codigoUsuarioCreacion: TurnoDatos[7],
                                                usuarioCreacion: TurnoDatos[8],
                                                nrodocPropietario: ordenServ[10]
                                            });
                                        }
                                    } else {
                                        jsonResult.push({
                                            idTurno: '',
                                            codigoTurno3S: '',
                                            fechaTurno: '',
                                            idTaller: '',
                                            codigoTaller: '',
                                            descripcionTaller: '',
                                            idOrdenServicio: idOrdenServic,
                                            ordenServicio: ordenServ[5],
                                            idCliente: ordenServ[6],
                                            cliente: ordenServ[4],
                                            comentario: ordenServ[7],
                                            correoCliente: ordenServ[8],
                                            codigoVehiculo: ordenServ[0],
                                            destinoNombre: ordenServ[1],
                                            oficina: ordenServ[2],
                                            idOficina: ordenServ[3],
                                            codigoUsuarioCreacion: '',
                                            usuarioCreacion: '',
                                            nrodocPropietario: ordenServ[10]
                                        });
                                    }
                                }
                            }
                        }
                    });
                });
            } else if (consultanro4_param == true) {
                let myPagedData = consultaNro4.runPaged({ pageSize: 1000 });
                let arr = []
                myPagedData.pageRanges.forEach(pageRange => {
                    let myPage = myPagedData.fetch({ index: pageRange.index });
                    myPage.data.forEach(result => {
                        let Destino_Nombre = result.getValue({ name: "altname", label: "Nombre" });
                        let Destino_ID = result.getValue({ name: "name", label: "ID" });
                        let Cliente_ID = result.getValue({ name: "custrecord_ht_bien_propietario", label: "Id cliente" })
                        let datosCliente = getClienteDatos(Cliente_ID);
                        let repetido = false;
                        let arracuxi = [];
                        for (let i = 0; i < arr.length; i++) {
                            if (arr[i][0] == Destino_Nombre && arr[i][1] == Destino_ID) {
                                repetido = true;
                            }
                        }
                        arracuxi = [Destino_Nombre, Destino_ID]
                        if (repetido == false) {
                            arr.push(arracuxi);
                            jsonResult.push({
                                propietarioBien: datosCliente[1],
                                codigoPropietario: datosCliente[0],
                                nrodocPropietario: datosCliente[2],
                                destinoNombre: Destino_Nombre,
                                destinoId: Destino_ID
                            });
                        }

                    });
                });
            }
            return jsonResult;
        } catch (error) {
            log.error('Error-GET', error);
            return error;
        }
    }


    const _post = (scriptContext) => {
        log.debug('Context', scriptContext);
        try {
            // let results = query.runSuiteQL({
            //     query: 'SELECT customrecord_ht_record_bienes.id as ID, customrecord_ht_record_bienes.custrecord_ht_bien_tipobien as TIPO, customrecord_ht_record_bienes.custrecord_ht_bien_marca as MARCA FROM customrecord_ht_record_bienes WHERE customrecord_ht_record_bienes.custrecord_ht_bien_placa = ?',
            //     params: [placa]
            // });
            // let id = results.results[0].values[0];
            // let turnoUnico = getTurnoId(scriptContext.ordenServicio);
            // if (turnoUnico != '') {
            //     return { 'codigoTurno': '' }
            // } else {

            log.debug('User', runtime.getCurrentUser().id)
            if (scriptContext.taller != 12) {
                // if (runtime.getCurrentUser().id == 4) {
                //let sql = 'SELECT em.id as codigotecnico, em.email from employee em where em.id = ? and em.email is not null';
                let sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_record_ordentrabajo ot ' +
                    'INNER JOIN transaction so ON ot.custrecord_ht_ot_orden_servicio = so.id ' +
                    'WHERE ot.custrecord_ht_ot_orden_servicio = ?';
                let sql2 = 'SELECT COUNT(*) as cantidad from employee em where em.id = ? and em.email is not null';
                let cantidadOS = query.runSuiteQL({ query: sql, params: [scriptContext.ordenServicio] });
                let empleado = query.runSuiteQL({ query: sql2, params: [scriptContext.codigoTecnico] });
                let conteo = cantidadOS.asMappedResults()[0]['cantidad'];
                let cantidad = empleado.asMappedResults()[0]['cantidad'];
                //log.debug('Result', cantidad);
                if (conteo > 0) {
                    if (cantidad > 0) {
                        let turno = record.create({ type: record.Type.TASK });
                        turno.setValue({ fieldId: 'title', value: scriptContext.codigoTurno });
                        turno.setValue({ fieldId: 'assigned', value: scriptContext.codigoTecnico });
                        turno.setValue({ fieldId: 'startdate', value: new Date(scriptContext.fecha) });
                        turno.setValue({ fieldId: 'custevent_ht_tr_hora', value: new Date(scriptContext.hora) });
                        turno.setValue({ fieldId: 'custevent_ht_turno_taller', value: scriptContext.taller });
                        turno.setValue({ fieldId: 'company', value: scriptContext.customer });
                        turno.setValue({ fieldId: 'transaction', value: scriptContext.ordenServicio });
                        turno.setValue({ fieldId: 'custevent_ht_turno_creado_por', value: scriptContext.usuarioCreacion });
                        // if (typeof scriptContext.item != 'undefined' && scriptContext.item.length > 0) {
                        //     turno.setValue({ fieldId: 'relateditem', value: scriptContext.item });
                        // }
                        let recordTurno = turno.save();


                        // let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO_SEARCH });
                        // let filters = objSearch.filters;
                        // const transactionFilter = search.createFilter({ name: 'internalid', join: 'custrecord_ht_ot_orden_servicio', operator: search.Operator.ANYOF, values: scriptContext.ordenServicio });
                        // filters.push(transactionFilter);
                        // let resultCount = objSearch.runPaged({ pageSize: 1000 }).count;
                        // log.debug('resultCount', resultCount);
                        // let result = objSearch.run().getRange({ start: 0, end: 100 });
                        // log.debug('result', result);
                        // for (let i in result) {
                        //     let internalidOT = result[i].getValue({ name: "internalid", label: "Internal ID" });
                        //     log.debug('Turno', internalidOT);
                        //     record.submitFields({ type: 'customrecord_ht_record_ordentrabajo', id: internalidOT, values: { 'custrecord_ht_ot_taller': scriptContext.taller } });
                        // }
                        //log.debug('Turno', recordTurno);
                        return { 'turnoID': recordTurno }
                        // }
                    } else {
                        return { 'turnoID': 'El Técnico no existe o no tiene un correo asignado' };
                    }
                } else {
                    return { 'turnoID': 'La Orden de Servicio ' + scriptContext.ordenServicio + ' no tiene ninguna Orden de Trabajo asociada' };
                }

            } else {
                return 'Taller no válido';
            }

        } catch (error) {
            log.error('Error-POST', error);
            return error.message;
        }
    }

    const generateOT = (id, body) => {
        try {
            let response;
            let tiempo1;
            let tiempo2;
            let idot;
            let ordenServicio = body.ordenServicio;
            let idcliente = body.idcliente;
            let tranid = body.tranid;
            let item = body.item;
            let displayname = body.displayname;
            let taller = body.taller;

            if (typeof body.tiempo1 != 'undefined') {
                tiempo1 = body.tiempo1;
            }

            if (typeof body.tiempo2 != 'undefined') {
                tiempo2 = body.tiempo2;
            }

            if (typeof body.idot != 'undefined') {
                idot = body.idot;
            }

            //log.debug('Case', '1');
            let objRecord = record.create({ type: HT_ORDEN_TRABAJO_RECORD, isDynamic: true });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: id });
            objRecord.setValue({ fieldId: 'custrecord_ht_id_orden_servicio', value: ordenServicio });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_ordenservicio', value: tranid });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente', value: idcliente });
            objRecord.setValue({ fieldId: 'custrecord_ht_bien_item', value: item });
            objRecord.setValue({ fieldId: 'custrecord_ht_bien_descripcionitem', value: displayname });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_estado', value: ESTADO_VENTAS });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_taller', value: taller });
            objRecord.setValue({ fieldId: 'custrecord_ht_ot_primer_turno', value: tiempo1 });
            response = objRecord.save({ ignoreMandatoryFields: true });
            return response;
        } catch (error) {
            log.error('Error-generateOrdenTrabajo', error);
        }
    }

    const getTurnoId = (id) => {
        try {
            var busqueda = search.create({
                type: "task",
                filters:
                    [
                        ["transaction.internalid", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "transaction",
                            summary: "GROUP",
                            label: "Transaction"
                        })
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
            log.error('Error en getCustomer', e);
        }
    }

    const getTurnoDatos = (id, filtrofecha, fechaTurnoDesde, fechaTurnoHasta) => {
        try {

            log.error('filtrofecha', filtrofecha);
            if (filtrofecha == true) {
                filter = [["transaction.internalid", "anyof", id],
                    "AND",
                ["startdate", "within", fechaTurnoDesde, fechaTurnoHasta]];

            } else {
                filter = ["transaction.internalid", "anyof", id];
            }
            log.error('filter', filter);
            var busqueda = search.create({
                type: "task",
                filters:
                    [
                        filter
                    ],
                columns:
                    [
                        "custevent_ht_tr_hora",
                        "startdate",
                        "title",
                        'internalid',
                        'custevent_ht_turno_taller',
                        'custevent_ht_turno_taller.custrecord_ht_tt_codigo',
                        'custevent_ht_turno_taller.custrecord_ht_tt_descripcion',
                        'custevent_ht_turno_creado_por'
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var result = [];
            if (savedsearch.length > 0) {
                result[0] = savedsearch[0].getValue(busqueda.columns[0]);
                result[1] = savedsearch[0].getValue(busqueda.columns[1]);
                result[2] = savedsearch[0].getValue(busqueda.columns[2]);
                result[3] = savedsearch[0].getValue(busqueda.columns[3]);
                result[4] = savedsearch[0].getValue(busqueda.columns[4]);
                result[5] = savedsearch[0].getValue(busqueda.columns[5]);
                result[6] = savedsearch[0].getValue(busqueda.columns[6]);
                result[7] = savedsearch[0].getValue(busqueda.columns[7]);
                if (result[7] != '') {
                    result[8] = getUsuarioCreacion(result[7]);
                } else {
                    result[8] = '';
                }

            }
            return result;
        } catch (e) {
            log.error('Error en getTurnoDatos', e);
        }
    }

    const BuscarOS = (id) => {
        try {
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", id],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" }),
                        search.createColumn({
                            name: "altname",
                            join: "CUSTBODY_HT_SO_BIEN",
                            label: "Nombre"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{location}",
                            label: "Fórmula (texto)"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "location",
                            label: "ID location"
                        }),
                        search.createColumn({
                            name: "altname",
                            join: "customerMain",
                            label: "Name"
                        }),
                        search.createColumn({ name: "tranid", label: "Num. Pedido" }),
                        search.createColumn({ name: "memo", label: "Nota" }),
                        search.createColumn({ name: "custbody_ht_os_correocliente", label: "email" }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{entity.id}",
                            label: "Fórmula (texto)"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTBODY_HT_SO_BIEN",
                            label: "Nombre"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{entity}",
                            label: "Fórmula (texto)"
                        })
                    ]
            });
            var myPagedData = salesorderSearchObj.runPaged({ pageSize: 1000 });
            var respuesta = []
            myPagedData.pageRanges.forEach(pageRange => {
                let myPage = myPagedData.fetch({ index: pageRange.index });
                myPage.data.forEach(result => {
                    let columns = result.columns;
                    let codigo = result.getText(columns[0]);
                    let nombre = result.getValue(columns[1]);
                    let Ubicacion = result.getValue(columns[2]);
                    let idUbicacion = result.getValue(columns[3]);
                    let cliente = result.getValue(columns[4]);
                    let numPedido = result.getValue(columns[5]);
                    let nota = result.getValue(columns[6]);
                    let email = result.getValue(columns[7]);
                    let idcliente = result.getValue(columns[8]);
                    let idbien = result.getValue(columns[9]);
                    let nrodocPropietario = (result.getValue(columns[10]).split(' ')[0]).split('-')[2];
                    let arreglo = [codigo, nombre, Ubicacion, idUbicacion, cliente, numPedido, idcliente, nota,
                        email, idbien, nrodocPropietario];
                    respuesta = arreglo;
                });
            });
            //log.error('respuesta.length', respuesta.length)
            return respuesta;
        } catch (e) {
            log.error('Error en BuscarOS', e);
        }
    }

    const getUsuarioCreacion = (id) => {
        try {
            var busqueda = search.create({
                type: "employee",
                filters:
                    [
                        ["custentity_ec_numero_registro", "is", id]
                    ],
                columns:
                    [
                        "altname"
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var neme = '';
            if (savedsearch.length > 0) {
                neme = savedsearch[0].getValue(busqueda.columns[0]);
            }
            return neme;
        } catch (e) {
            log.error('Error en getUsuarioCreacion', e);
        }
    }

    const BuscarCliente = (codigo) => {
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["formulatext: {vatregnumber}", "startswith", codigo]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "ID interno" }),
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

    const getClienteDatos = (id) => {
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["internalid", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "ID interno" }),
                        search.createColumn({ name: "isperson", label: "Tipo" }),
                        search.createColumn({ name: "altname", label: "Nombre" }),
                        search.createColumn({ name: "companyname", label: "Nombre de la empresa" }),
                        search.createColumn({ name: "custentity_ec_document_type", label: "EC Tipo de Documento" }),
                        search.createColumn({ name: "vatregnumber", label: "Cedula/RUC" }),
                    ]
            });
            var savedsearch = customerSearchObj.run().getRange(0, 1);
            var arr = [];
            if (savedsearch.length > 0) {
                let nombre = '';
                idcustomer = savedsearch[0].getValue(customerSearchObj.columns[0]);
                tipoperson = savedsearch[0].getValue(customerSearchObj.columns[1]);
                altname = savedsearch[0].getValue(customerSearchObj.columns[2]);
                companyname = savedsearch[0].getValue(customerSearchObj.columns[3]);
                tipodoc = savedsearch[0].getValue(customerSearchObj.columns[4]);
                cedRuc = savedsearch[0].getValue(customerSearchObj.columns[5]);

                if (tipodoc == '1') {
                    nombre = companyname;
                } else {
                    nombre = altname;
                }
                arr = [idcustomer, nombre, cedRuc];
            }
            return arr;
        } catch (e) {
            log.error('Error en getClienteDatos', e);
        }
    }

    const generateDetalleOS = (id, body) => {
        let ordenServicio = body.ordenServicio;
        let objRecord = record.create({ type: HT_REGISTRO_BIENES_RECORD, isDynamic: true });
        objRecord.setValue({ fieldId: 'custrecord_ht_rb_enlace', value: ordenServicio });
        objRecord.setValue({ fieldId: 'custrecord_ht_rb_bien', value: id });
        let response = objRecord.save({ ignoreMandatoryFields: true });
        return response;
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
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 19/03/2023
Author: Jeferson Mejia
Description: Validacion Turno unico por transacción.
==============================================================================================================================================*/


/*
            log.error('Search_OrdServ',Search_OrdServ);
            let count = mySearch.runPaged().count;

            log.debug('Debug', mySearch.run().getRange({ start: 0, end: 100 }))
            mySearch.run().each(result => {
                let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" })
                let clase = result.getText({ name: "class", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Class" })
                let fechaEmisiónOrdenServicio = result.getValue({ name: "trandate", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Date" })
                let departamento = result.getText({ name: "department", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Department" })
                let oficina = result.getText({ name: "location", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Location" })
                let aprobacionCartera = result.getValue({ name: "custbody_ht_os_aprobacioncartera", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Cartera" })
                let aprobacionVenta = result.getValue({ name: "custbody_ht_os_aprobacionventa", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Venta" })
                let ejecutivaGestion = result.getValue({ name: "custbody_ht_os_ejecutiva_backoffice", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de Gestión" })
                let ejecutivaReferencia = result.getValue({ name: "custbody_ht_os_ejecutivareferencia", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de referencia" })
                let ejecutivaRenovacion = result.getValue({ name: "salesrep", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Sales Rep" })
                let oportunidad = result.getValue({ name: "opportunity", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Opportunity" })
                let subsidiaria = result.getValue({ name: "subsidiarynohierarchy", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Subsidiary (no hierarchy)" })
                let aseguradora = result.getValue({ name: "custbody_ht_os_companiaseguros", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Aseguradora" })
                let consecionario = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" })
                let bancos = result.getValue({ name: "custbody2", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Bancos" })
                let vendedorCanalDistribucion = result.getValue({ name: "custbody_ht_os_vendcanaldistribucion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Vendedor del canal de distribución" })
                let facturarA = result.getValue({ name: "custbody_ht_facturar_a", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Facturar a" })
                let trabajado = result.getValue({ name: "custbody_ht_os_trabajado", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Trabajado" })
                let novedadesOrdenServicio = result.getValue({ name: "custbody_ht_os_novedades", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Novedades" })
                let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" })
                let ordenTrabajoEstado = result.getValue({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "HT OT Estado Orden de trabajo" })
                let itemid = result.getValue({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
                let item = result.getText({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
                let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" })
                let cliente = result.getText({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" })
                let estadoLojack = result.getValue({ name: "custrecord_ht_ot_estadolojack", summary: "GROUP", label: "Estado Lojack" })
                let boxSerie = result.getValue({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "HT Box Serie" })
                let confirmacionPXAdmin = result.getValue({ name: "custrecord_ht_ot_pxadminfinalizacion", summary: "GROUP", label: "HT Confirmación PX Admin" })
                let estadoChaser = result.getValue({ name: "custrecord_ht_ot_estadochaser", summary: "GROUP", label: "Estado Chaser" })
                let confirmacionTelematics = result.getValue({ name: "custrecord_ht_ot_confirmaciontelamatic", summary: "GROUP", label: "HT Confirmación Telematics" })
                let modeloBien = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "HT OS Modelo" })
                let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "HT OT APN" })
                let aireaAcondicionado = result.getValue({ name: "custrecord_ht_ot_aireacondicionado", summary: "GROUP", label: "HT OT Aire acondicionado" })
                let alfombraPiso = result.getValue({ name: "custrecord_ht_ot_alfombrapiso", summary: "GROUP", label: "HT OT Alfombra de piso" })
                let brazosPlumas = result.getValue({ name: "custrecord_ht_ot_brazosplumas", summary: "GROUP", label: "HT OT Brazos y Plumas" })
                let cantidadControles = result.getValue({ name: "custrecord_ht_ot_contidadcontroles", summary: "GROUP", label: "HT OT Cantidad controles" })
                let cantidadLlaves = result.getValue({ name: "custrecord_ht_ot_cantidadllaves", summary: "GROUP", label: "HT OT Cantidad llaves" })
                let cenicero = result.getValue({ name: "custrecord_ht_ot_cenicero", summary: "GROUP", label: "HT OT Cenicero" })
                let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "HT OT Chasis" })
                let chocotes = result.getValue({ name: "custrecord_ht_ot_chicotes", summary: "GROUP", label: "HT OT Chicotes" })
                let color = result.getValue({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "HT OT Color" })
                let codigoActivacion = result.getValue({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Código de Activación" })
                let codigoRespuesta = result.getValue({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Código de Respuesta" })
                let fecha = result.getValue({ name: "created", summary: "GROUP", label: "Date Created" })
                let conbustible = result.getValue({ name: "custrecord_ht_ot_porcentajecombustible", summary: "GROUP", label: "HT OT Combustible" })
                let conectividadTelematics = result.getValue({ name: "custrecord_ht_ot_telematicfinalizacion", summary: "GROUP", label: "HT OT Conectividad Telematics" })
                let conNovedad = result.getValue({ name: "custrecord_ht_ot_connovedad", summary: "GROUP", label: "HT OT Con novedad" })
                let correo = result.getValue({ name: "custrecord_ht_ot_correorecepcion", summary: "GROUP", label: "HT OT Correo" })
                let direccionCliente = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "HT OT Dirección del Cliente" })
                let correoCliente = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "HT OT Correo del Cliente" })
                let dispositivo = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "HT OT Dispositivo" })
                let fechaEntrega = result.getValue({ name: "custrecord_ht_ot_fechaentrega", summary: "GROUP", label: "HT OT Fecha entrega" })
                let fechaTrabajo = result.getValue({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" })
                let fimaware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "HT OT Firmware" })
                let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "HT OT Fuera Ciudad" })
                let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "HT OT Fuera taller" })
                let horaEntrega = result.getValue({ name: "custrecord_ht_ot_horaentrega", summary: "GROUP", label: "HT OT Hora entrega" })
                let horaTrabajo = result.getValue({ name: "custrecord_ht_ot_horatrabajoasignacion", label: "HT OT Hora trabajo" })
                let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" })
                let vehiculo = result.getText({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" })
                let lucesParqueo = result.getValue({ name: "custrecord_ht_ot_lucesparqueo", summary: "GROUP", label: "HT OT Luces Parqueo" })
                let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "HT OT IP" })
                let itemVentAlquiler = result.getValue({ name: "custrecord_ht_ot_item_vent_alq", summary: "GROUP", label: "HT OT Item Vent Alq" })
                let listaComentarios = result.getValue({ name: "custrecord_ht_ot_listacomentarios", summary: "GROUP", label: "HT OT Lista de comentarios" })
                let marca = result.getValue({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "HT OT Marca" })
                let mascarillas = result.getValue({ name: "custrecord_ht_ot_mascarillas", summary: "GROUP", label: "HT OT Mascarillas" })
                let modeloDispositivo = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "HT OT Modelo" })
                let motivos = result.getValue({ name: "custrecord_ht_ot_motivos", summary: "GROUP", label: "HT OT Motivos" })
                let motivoComentario = result.getValue({ name: "custrecord_ht_ot_motivoscomentario", summary: "GROUP", label: "HT OT Motivos Comentario" })
                let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "HT OT Motor" })
                let nombreRecibe = result.getValue({ name: "custrecord_ht_ot_nombrereciberecepcion", summary: "GROUP", label: "HT OT Nombre Recibe" })
                let nombreEntrega = result.getValue({ name: "custrecord_ht_ot_nombreentregarecepcion", summary: "GROUP", label: "HT OT Nombre entrega" })
                let novedades = result.getValue({ name: "custrecord_ht_ot_novedades", summary: "GROUP", label: "HT OT Novedades" })
                let odometro = result.getValue({ name: "custrecord_ht_ot_odometro", summary: "GROUP", label: "HT OT Odómetro" })
                let paralizador = result.getValue({ name: "custrecord_ht_ot_paralizador", summary: "GROUP", label: "HT OT Paralizador" })
                let perillas = result.getValue({ name: "custrecord_ht_ot_perillas", summary: "GROUP", label: "HT OT Perillas" })
                let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "HT OT Placa" })
                let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "HT OT Script" })
                let radio = result.getValue({ name: "custrecord_ht_ot_radio", summary: "GROUP", label: "HT OT Radio" })
                let serieProducto = result.getValue({ name: "custrecord_ht_ot_serieproductoasignacion", label: "HT OT Serie Producto" })
                let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "HT OT Servidor" })
                let simCard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "HT OT Sim Card" })
                let sinNovedad = result.getValue({ name: "custrecord_ht_ot_sinnovedad", summary: "GROUP", label: "HT OT Sin novedad" })
                let supervisor = result.getValue({ name: "custrecord_ht_ot_supervisorasignacion", summary: "GROUP", label: "HT OT Supervisor" })
                let tapaCombustible = result.getValue({ name: "custrecord_ht_ot_tapacombustible", summary: "GROUP", label: "HT OT Tapa Combustible" })
                let telefonoCliente = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "HT OT Teléfono del Cliente" })
                let termometro = result.getValue({ name: "custrecord_ht_ot_termometro", summary: "GROUP", label: "HT OT Termometro" })
                let tipoBien = result.getValue({ name: "custrecord_ht_ot_tipo", summary: "GROUP", label: "HT OT Tipo" })
                let tecnicoAsignado = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "HT OT Técnico asignado" })
                let unidad = result.getValue({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "HT OT Unidad" })
                let version = result.getValue({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "HT OT Version" })
                let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                let oficinaAtencion = result.getValue({ name: "custrecord_ht_ot_oficinaatencion", summary: "GROUP", label: "Oficina de atención" })
                let impulsaPlataformas = result.getValue({ name: "custrecord_ht_ot_noimpulsaplataformas", summary: "GROUP", label: "No impulsa a Plataformas" })

                jsonResult.push({
                    ordenTrabajoid: ordenTrabajoid,
                    ordenServicioid: ordenServicioid,
                    ordenServicio: ordenServicio,
                    clase: clase,
                    fechaEmisiónOrdenServicio: fechaEmisiónOrdenServicio,
                    departamento: departamento,
                    oficina: oficina,
                    aprobacionCartera: aprobacionCartera,
                    aprobacionVenta: aprobacionVenta,
                    ejecutivaGestion: ejecutivaGestion,
                    ejecutivaReferencia: ejecutivaReferencia,
                    ejecutivaRenovacion: ejecutivaRenovacion,
                    oportunidad: oportunidad,
                    subsidiaria: subsidiaria,
                    aseguradora: aseguradora,
                    consecionario: consecionario,
                    bancos: bancos,
                    vendedorCanalDistribucion: vendedorCanalDistribucion,
                    facturarA: facturarA,
                    trabajado: trabajado,
                    novedadesOrdenServicio: novedadesOrdenServicio,
                    ordenTrabajo: ordenTrabajo,
                    ordenTrabajoEstado: ordenTrabajoEstado,
                    itemid: itemid,
                    item: item,
                    clienteid: clienteid,
                    cliente: cliente,
                    estadoLojack: estadoLojack,
                    boxSerie: boxSerie,
                    confirmacionPXAdmin: confirmacionPXAdmin,
                    estadoChaser: estadoChaser,
                    confirmacionTelematics: confirmacionTelematics,
                    modeloBien: modeloBien,
                    apn: apn,
                    aireaAcondicionado: aireaAcondicionado,
                    alfombraPiso: alfombraPiso,
                    brazosPlumas: brazosPlumas,
                    cantidadControles: cantidadControles,
                    cantidadLlaves: cantidadLlaves,
                    cenicero: cenicero,
                    chasis: chasis,
                    chocotes: chocotes,
                    color: color,
                    codigoActivacion: codigoActivacion,
                    codigoRespuesta: codigoRespuesta,
                    conbustible: conbustible,
                    conectividadTelematics: conectividadTelematics,
                    conNovedad: conNovedad,
                    correo: correo,
                    direccionCliente: direccionCliente,
                    correoCliente: correoCliente,
                    dispositivo: dispositivo,
                    fechaEntrega: fechaEntrega,
                    fechaTrabajo: fechaTrabajo,
                    fimaware: fimaware,
                    fueraCuidad: fueraCuidad,
                    fueraTaller: fueraTaller,
                    horaEntrega: horaEntrega,
                    horaTrabajo: horaTrabajo,
                    vehiculoid: vehiculoid,
                    vehiculo: vehiculo,
                    lucesParqueo: lucesParqueo,
                    ip: ip,
                    itemVentAlquiler: itemVentAlquiler,
                    listaComentarios: listaComentarios,
                    marca: marca,
                    mascarillas: mascarillas,
                    modeloDispositivo, modeloDispositivo,
                    motivos: motivos,
                    motivoComentario: motivoComentario,
                    motor: motor,
                    nombreRecibe: nombreRecibe,
                    nombreEntrega: nombreEntrega,
                    novedades: novedades,
                    odometro: odometro,
                    paralizador: paralizador,
                    perillas: perillas,
                    placa: placa,
                    script: script,
                    radio: radio,
                    serieProducto: serieProducto,
                    servidor: servidor,
                    simCard: simCard,
                    sinNovedad: sinNovedad,
                    supervisor: supervisor,
                    tapaCombustible: tapaCombustible,
                    telefonoCliente: telefonoCliente,
                    termometro: termometro,
                    tipoBien: tipoBien,
                    tecnicoAsignado: tecnicoAsignado,
                    unidad: unidad,
                    version: version,
                    imei1_: imei,
                    oficinaAtencion: oficinaAtencion,
                    impulsaPlataformas: impulsaPlataformas
                });
                return true;
            });
            */


/*
               let myPagedData = mySearch.runPaged();
               log.debug('Count', myPagedData.count);
               myPagedData.pageRanges.forEach(pageRange => {
                   let myPage = myPagedData.fetch({ index: pageRange.index });
                   myPage.data.forEach(result => {
                       let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                       let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
                       let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" })
                       let clase = result.getText({ name: "class", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Class" })
                       let fechaEmisiónOrdenServicio = result.getValue({ name: "trandate", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Date" })
                       let departamento = result.getText({ name: "department", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Department" })
                       let oficina = result.getText({ name: "location", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Location" })
                       let aprobacionCartera = result.getValue({ name: "custbody_ht_os_aprobacioncartera", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Cartera" })
                       let aprobacionVenta = result.getValue({ name: "custbody_ht_os_aprobacionventa", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Venta" })
                       let ejecutivaGestion = result.getValue({ name: "custbody_ht_os_ejecutiva_backoffice", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de Gestión" })
                       let ejecutivaReferencia = result.getValue({ name: "custbody_ht_os_ejecutivareferencia", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de referencia" })
                       let ejecutivaRenovacion = result.getValue({ name: "salesrep", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Sales Rep" })
                       let oportunidad = result.getValue({ name: "opportunity", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Opportunity" })
                       let subsidiaria = result.getValue({ name: "subsidiarynohierarchy", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Subsidiary (no hierarchy)" })
                       let aseguradora = result.getValue({ name: "custbody_ht_os_companiaseguros", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Aseguradora" })
                       let consecionario = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" })
                       let bancos = result.getValue({ name: "custbody2", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Bancos" })
                       let vendedorCanalDistribucion = result.getValue({ name: "custbody_ht_os_vendcanaldistribucion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Vendedor del canal de distribución" })
                       let facturarA = result.getValue({ name: "custbody_ht_facturar_a", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Facturar a" })
                       let trabajado = result.getValue({ name: "custbody_ht_os_trabajado", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Trabajado" })
                       let novedadesOrdenServicio = result.getValue({ name: "custbody_ht_os_novedades", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Novedades" })
                       let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" })
                       let ordenTrabajoEstado = result.getValue({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "HT OT Estado Orden de trabajo" })
                       let itemid = result.getValue({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
                       let item = result.getText({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
                       let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" })
                       let cliente = result.getText({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" })
                       let estadoLojack = result.getValue({ name: "custrecord_ht_ot_estadolojack", summary: "GROUP", label: "Estado Lojack" })
                       let boxSerie = result.getValue({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "HT Box Serie" })
                       let confirmacionPXAdmin = result.getValue({ name: "custrecord_ht_ot_pxadminfinalizacion", summary: "GROUP", label: "HT Confirmación PX Admin" })
                       let estadoChaser = result.getValue({ name: "custrecord_ht_ot_estadochaser", summary: "GROUP", label: "Estado Chaser" })
                       let confirmacionTelematics = result.getValue({ name: "custrecord_ht_ot_confirmaciontelamatic", summary: "GROUP", label: "HT Confirmación Telematics" })
                       let modeloBien = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "HT OS Modelo" })
                       let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "HT OT APN" })
                       let aireaAcondicionado = result.getValue({ name: "custrecord_ht_ot_aireacondicionado", summary: "GROUP", label: "HT OT Aire acondicionado" })
                       let alfombraPiso = result.getValue({ name: "custrecord_ht_ot_alfombrapiso", summary: "GROUP", label: "HT OT Alfombra de piso" })
                       let brazosPlumas = result.getValue({ name: "custrecord_ht_ot_brazosplumas", summary: "GROUP", label: "HT OT Brazos y Plumas" })
                       let cantidadControles = result.getValue({ name: "custrecord_ht_ot_contidadcontroles", summary: "GROUP", label: "HT OT Cantidad controles" })
                       let cantidadLlaves = result.getValue({ name: "custrecord_ht_ot_cantidadllaves", summary: "GROUP", label: "HT OT Cantidad llaves" })
                       let cenicero = result.getValue({ name: "custrecord_ht_ot_cenicero", summary: "GROUP", label: "HT OT Cenicero" })
                       let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "HT OT Chasis" })
                       let chocotes = result.getValue({ name: "custrecord_ht_ot_chicotes", summary: "GROUP", label: "HT OT Chicotes" })
                       let color = result.getValue({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "HT OT Color" })
                       let codigoActivacion = result.getValue({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Código de Activación" })
                       let codigoRespuesta = result.getValue({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Código de Respuesta" })
                       let fecha = result.getValue({ name: "created", summary: "GROUP", label: "Date Created" })
                       let conbustible = result.getValue({ name: "custrecord_ht_ot_porcentajecombustible", summary: "GROUP", label: "HT OT Combustible" })
                       let conectividadTelematics = result.getValue({ name: "custrecord_ht_ot_telematicfinalizacion", summary: "GROUP", label: "HT OT Conectividad Telematics" })
                       let conNovedad = result.getValue({ name: "custrecord_ht_ot_connovedad", summary: "GROUP", label: "HT OT Con novedad" })
                       let correo = result.getValue({ name: "custrecord_ht_ot_correorecepcion", summary: "GROUP", label: "HT OT Correo" })
                       let direccionCliente = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "HT OT Dirección del Cliente" })
                       let correoCliente = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "HT OT Correo del Cliente" })
                       let dispositivo = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "HT OT Dispositivo" })
                       let fechaEntrega = result.getValue({ name: "custrecord_ht_ot_fechaentrega", summary: "GROUP", label: "HT OT Fecha entrega" })
                       let fechaTrabajo = result.getValue({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" })
                       let fimaware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "HT OT Firmware" })
                       let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "HT OT Fuera Ciudad" })
                       let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "HT OT Fuera taller" })
                       let horaEntrega = result.getValue({ name: "custrecord_ht_ot_horaentrega", summary: "GROUP", label: "HT OT Hora entrega" })
                       let horaTrabajo = result.getValue({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" })
                       let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" })
                       let vehiculo = result.getText({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" })
                       let lucesParqueo = result.getValue({ name: "custrecord_ht_ot_lucesparqueo", summary: "GROUP", label: "HT OT Luces Parqueo" })
                       let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "HT OT IP" })
                       let itemVentAlquiler = result.getValue({ name: "custrecord_ht_ot_item_vent_alq", summary: "GROUP", label: "HT OT Item Vent Alq" })
                       let listaComentarios = result.getValue({ name: "custrecord_ht_ot_listacomentarios", summary: "GROUP", label: "HT OT Lista de comentarios" })
                       let marca = result.getValue({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "HT OT Marca" })
                       let mascarillas = result.getValue({ name: "custrecord_ht_ot_mascarillas", summary: "GROUP", label: "HT OT Mascarillas" })
                       let modeloDispositivo = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "HT OT Modelo" })
                       let motivos = result.getValue({ name: "custrecord_ht_ot_motivos", summary: "GROUP", label: "HT OT Motivos" })
                       let motivoComentario = result.getValue({ name: "custrecord_ht_ot_motivoscomentario", summary: "GROUP", label: "HT OT Motivos Comentario" })
                       let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "HT OT Motor" })
                       let nombreRecibe = result.getValue({ name: "custrecord_ht_ot_nombrereciberecepcion", summary: "GROUP", label: "HT OT Nombre Recibe" })
                       let nombreEntrega = result.getValue({ name: "custrecord_ht_ot_nombreentregarecepcion", summary: "GROUP", label: "HT OT Nombre entrega" })
                       let novedades = result.getValue({ name: "custrecord_ht_ot_novedades", summary: "GROUP", label: "HT OT Novedades" })
                       let odometro = result.getValue({ name: "custrecord_ht_ot_odometro", summary: "GROUP", label: "HT OT Odómetro" })
                       let paralizador = result.getValue({ name: "custrecord_ht_ot_paralizador", summary: "GROUP", label: "HT OT Paralizador" })
                       let perillas = result.getValue({ name: "custrecord_ht_ot_perillas", summary: "GROUP", label: "HT OT Perillas" })
                       let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "HT OT Placa" })
                       let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "HT OT Script" })
                       let radio = result.getValue({ name: "custrecord_ht_ot_radio", summary: "GROUP", label: "HT OT Radio" })
                       let serieProducto = result.getText({ name: "custrecord_ht_ot_serieproductoasignacion", summary: "GROUP", label: "Serie Producto" })
                       let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "HT OT Servidor" })
                       let simCard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "HT OT Sim Card" })
                       let sinNovedad = result.getValue({ name: "custrecord_ht_ot_sinnovedad", summary: "GROUP", label: "HT OT Sin novedad" })
                       let supervisor = result.getValue({ name: "custrecord_ht_ot_supervisorasignacion", summary: "GROUP", label: "HT OT Supervisor" })
                       let tapaCombustible = result.getValue({ name: "custrecord_ht_ot_tapacombustible", summary: "GROUP", label: "HT OT Tapa Combustible" })
                       let telefonoCliente = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "HT OT Teléfono del Cliente" })
                       let termometro = result.getValue({ name: "custrecord_ht_ot_termometro", summary: "GROUP", label: "HT OT Termometro" })
                       let tipoBien = result.getValue({ name: "custrecord_ht_ot_tipo", summary: "GROUP", label: "HT OT Tipo" })
                       let tecnicoAsignado = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "HT OT Técnico asignado" })
                       let unidad = result.getValue({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "HT OT Unidad" })
                       let version = result.getValue({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "HT OT Version" })
                       let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
                       let oficinaAtencion = result.getValue({ name: "custrecord_ht_ot_oficinaatencion", summary: "GROUP", label: "Oficina de atención" })
                       let impulsaPlataformas = result.getValue({ name: "custrecord_ht_ot_noimpulsaplataformas", summary: "GROUP", label: "No impulsa a Plataformas" })

                       jsonResult.push({
                           ordenTrabajoid: ordenTrabajoid,
                           ordenServicioid: ordenServicioid,
                           ordenServicio: ordenServicio,
                           clase: clase,
                           fechaEmisiónOrdenServicio: fechaEmisiónOrdenServicio,
                           departamento: departamento,
                           oficina: oficina,
                           aprobacionCartera: aprobacionCartera,
                           aprobacionVenta: aprobacionVenta,
                           ejecutivaGestion: ejecutivaGestion,
                           ejecutivaReferencia: ejecutivaReferencia,
                           ejecutivaRenovacion: ejecutivaRenovacion,
                           oportunidad: oportunidad,
                           subsidiaria: subsidiaria,
                           aseguradora: aseguradora,
                           consecionario: consecionario,
                           bancos: bancos,
                           vendedorCanalDistribucion: vendedorCanalDistribucion,
                           facturarA: facturarA,
                           trabajado: trabajado,
                           novedadesOrdenServicio: novedadesOrdenServicio,
                           ordenTrabajo: ordenTrabajo,
                           ordenTrabajoEstado: ordenTrabajoEstado,
                           itemid: itemid,
                           item: item,
                           clienteid: clienteid,
                           cliente: cliente,
                           estadoLojack: estadoLojack,
                           boxSerie: boxSerie,
                           confirmacionPXAdmin: confirmacionPXAdmin,
                           estadoChaser: estadoChaser,
                           confirmacionTelematics: confirmacionTelematics,
                           modeloBien: modeloBien,
                           apn: apn,
                           aireaAcondicionado: aireaAcondicionado,
                           alfombraPiso: alfombraPiso,
                           brazosPlumas: brazosPlumas,
                           cantidadControles: cantidadControles,
                           cantidadLlaves: cantidadLlaves,
                           cenicero: cenicero,
                           chasis: chasis,
                           chocotes: chocotes,
                           color: color,
                           codigoActivacion: codigoActivacion,
                           codigoRespuesta: codigoRespuesta,
                           conbustible: conbustible,
                           conectividadTelematics: conectividadTelematics,
                           conNovedad: conNovedad,
                           correo: correo,
                           direccionCliente: direccionCliente,
                           correoCliente: correoCliente,
                           dispositivo: dispositivo,
                           fechaEntrega: fechaEntrega,
                           fechaTrabajo: fechaTrabajo,
                           fimaware: fimaware,
                           fueraCuidad: fueraCuidad,
                           fueraTaller: fueraTaller,
                           horaEntrega: horaEntrega,
                           horaTrabajo: horaTrabajo,
                           vehiculoid: vehiculoid,
                           vehiculo: vehiculo,
                           lucesParqueo: lucesParqueo,
                           ip: ip,
                           itemVentAlquiler: itemVentAlquiler,
                           listaComentarios: listaComentarios,
                           marca: marca,
                           mascarillas: mascarillas,
                           modeloDispositivo, modeloDispositivo,
                           motivos: motivos,
                           motivoComentario: motivoComentario,
                           motor: motor,
                           nombreRecibe: nombreRecibe,
                           nombreEntrega: nombreEntrega,
                           novedades: novedades,
                           odometro: odometro,
                           paralizador: paralizador,
                           perillas: perillas,
                           placa: placa,
                           script: script,
                           radio: radio,
                           serieProducto: serieProducto,
                           servidor: servidor,
                           simCard: simCard,
                           sinNovedad: sinNovedad,
                           supervisor: supervisor,
                           tapaCombustible: tapaCombustible,
                           telefonoCliente: telefonoCliente,
                           termometro: termometro,
                           tipoBien: tipoBien,
                           tecnicoAsignado: tecnicoAsignado,
                           unidad: unidad,
                           version: version,
                           imei1_: imei,
                           oficinaAtencion: oficinaAtencion,
                           impulsaPlataformas: impulsaPlataformas
                       });    
                   });
               });
           */