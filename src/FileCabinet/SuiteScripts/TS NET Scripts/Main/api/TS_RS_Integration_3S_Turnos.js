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
define(['N/log', 'N/search', 'N/record'], (log, search, record) => {
    const HT_CONSULTA_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_consulta_orden_servicio'; //HT Consulta Orden de Servicio - PRODUCCION
    const HT_REGISTRO_BIENES_RECORD = 'customrecord_ht_record_registrobienes'; //
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //
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
        //log.debug('Context', scriptContext);

        try {
            let param = false;
            let filter =
                [
                    ["custrecord_ht_ot_orden_servicio.class", "noneof", "@NONE@"],
                    "AND",
                    ["custrecord_ht_ot_orden_servicio.department", "noneof", "@NONE@"]
                ]

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


            if (typeof scriptContext.ordenservicio != 'undefined') {
                if (scriptContext.ordenservicio.length != 0) {
                    filter.push("AND", ["custrecord_ht_ot_orden_serivicio_txt", "startswith", scriptContext.ordenservicio])
                    param = true;
                }
            }

            if (typeof scriptContext.ordentrabajo != 'undefined') {
                if (scriptContext.ordentrabajo.length != 0) {
                    filter.push("AND", ["idtext", "startswith", scriptContext.ordentrabajo])
                    param = true;
                }
            }

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

            if (param == false) {
                return 'Filtro no válido';
            }

            //log.debug('Filter', filter);

            const mySearch = search.create({
                type: HT_ORDEN_TRABAJO_RECORD, //Orden de Trabajo Search - DEVELOPER
                filters: filter,
                // [
                //     ["custrecord_ht_ot_orden_servicio.class", "noneof", "@NONE@"],
                //     "AND",
                //     ["custrecord_ht_ot_orden_servicio.department", "noneof", "@NONE@"],
                //     "AND",
                //     filter
                // ],
                columns:
                    [
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                        search.createColumn({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "ID interno" }),
                        search.createColumn({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" }),
                        search.createColumn({ name: "class", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Class" }),
                        search.createColumn({ name: "trandate", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Date" }),
                        search.createColumn({ name: "department", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Department" }),
                        search.createColumn({ name: "location", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Location" }),
                        search.createColumn({ name: "custbody_ht_os_aprobacioncartera", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Cartera" }),
                        search.createColumn({ name: "custbody_ht_os_aprobacionventa", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Venta" }),
                        search.createColumn({ name: "custbody_ht_os_ejecutiva_backoffice", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de Gestión" }),
                        search.createColumn({ name: "custbody_ht_os_ejecutivareferencia", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de referencia" }),
                        search.createColumn({ name: "salesrep", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Sales Rep" }),
                        search.createColumn({ name: "opportunity", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Opportunity" }),
                        search.createColumn({ name: "subsidiarynohierarchy", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Subsidiary (no hierarchy)" }),
                        search.createColumn({ name: "custbody_ht_os_companiaseguros", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Aseguradora" }),
                        search.createColumn({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" }),
                        search.createColumn({ name: "custbody2", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Bancos" }),
                        search.createColumn({ name: "custbody_ht_os_vendcanaldistribucion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Vendedor del canal de distribución" }),
                        search.createColumn({ name: "custbody_ht_facturar_a", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Facturar a" }),
                        search.createColumn({ name: "custbody_ht_os_trabajado", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Trabajado" }),
                        search.createColumn({ name: "custbody_ht_os_novedades", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Novedades" }),
                        search.createColumn({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "HT OT Estado Orden de trabajo" }),
                        search.createColumn({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" }),
                        search.createColumn({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" }),
                        search.createColumn({ name: "custrecord_ht_ot_estadolojack", summary: "GROUP", label: "Estado Lojack" }),
                        search.createColumn({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "HT Box Serie" }),
                        search.createColumn({ name: "custrecord_ht_ot_pxadminfinalizacion", summary: "GROUP", label: "HT Confirmación PX Admin" }),
                        search.createColumn({ name: "custrecord_ht_ot_estadochaser", summary: "GROUP", label: "Estado Chaser" }),
                        search.createColumn({ name: "custrecord_ht_ot_confirmaciontelamatic", summary: "GROUP", label: "HT Confirmación Telematic" }),
                        search.createColumn({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "HT OS Modelo" }),
                        search.createColumn({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "HT OT APN" }),
                        search.createColumn({ name: "custrecord_ht_ot_aireacondicionado", summary: "GROUP", label: "HT OT Aire acondicionado" }),
                        search.createColumn({ name: "custrecord_ht_ot_alfombrapiso", summary: "GROUP", label: "HT OT Alfombra de piso" }),
                        search.createColumn({ name: "custrecord_ht_ot_brazosplumas", summary: "GROUP", label: "HT OT Brazos y Plumas" }),
                        search.createColumn({ name: "custrecord_ht_ot_contidadcontroles", summary: "GROUP", label: "HT OT Cantidad controles" }),
                        search.createColumn({ name: "custrecord_ht_ot_cantidadllaves", summary: "GROUP", label: "HT OT Cantidad llaves" }),
                        search.createColumn({ name: "custrecord_ht_ot_cenicero", summary: "GROUP", label: "HT OT Cenicero" }),
                        search.createColumn({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "HT OT Chasis" }),
                        search.createColumn({ name: "custrecord_ht_ot_chicotes", summary: "GROUP", label: "HT OT Chicotes" }),
                        search.createColumn({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "HT OT Color" }),
                        search.createColumn({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Código de Activación" }),
                        search.createColumn({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Código de Respuesta" }),
                        search.createColumn({ name: "created", summary: "GROUP", label: "Date Created" }),
                        search.createColumn({ name: "custrecord_ht_ot_porcentajecombustible", summary: "GROUP", label: "HT OT Combustible" }),
                        search.createColumn({ name: "custrecord_ht_ot_telematicfinalizacion", summary: "GROUP", label: "HT OT Conectividad Telematic" }),
                        search.createColumn({ name: "custrecord_ht_ot_connovedad", summary: "GROUP", label: "HT OT Con novedad" }),
                        search.createColumn({ name: "custrecord_ht_ot_correorecepcion", summary: "GROUP", label: "HT OT Correo" }),
                        search.createColumn({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "HT OT Dirección del Cliente" }),
                        search.createColumn({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "HT OT Correo del Cliente" }),
                        search.createColumn({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "HT OT Dispositivo" }),
                        search.createColumn({ name: "custrecord_ht_ot_fechaentrega", summary: "GROUP", label: "HT OT Fecha entrega" }),
                        search.createColumn({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" }),
                        search.createColumn({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "HT OT Firmware" }),
                        search.createColumn({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "HT OT Fuera Ciudad" }),
                        search.createColumn({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "HT OT Fuera taller" }),
                        search.createColumn({ name: "custrecord_ht_ot_horaentrega", summary: "GROUP", label: "HT OT Hora entrega" }),
                        search.createColumn({ name: "custrecord_ht_ot_horatrabajoasignacion", summary: "GROUP", label: "HT OT Hora trabajo" }),
                        search.createColumn({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" }),
                        search.createColumn({ name: "custrecord_ht_ot_lucesparqueo", summary: "GROUP", label: "HT OT Luces Parqueo" }),
                        search.createColumn({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "HT OT IP" }),
                        search.createColumn({ name: "custrecord_ht_ot_item_vent_alq", summary: "GROUP", label: "HT OT Item Vent Alq" }),
                        search.createColumn({ name: "custrecord_ht_ot_listacomentarios", summary: "GROUP", label: "HT OT Lista de comentarios" }),
                        search.createColumn({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "HT OT Marca" }),
                        search.createColumn({ name: "custrecord_ht_ot_mascarillas", summary: "GROUP", label: "HT OT Mascarillas" }),
                        search.createColumn({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "HT OT Modelo" }),
                        search.createColumn({ name: "custrecord_ht_ot_motivos", summary: "GROUP", label: "HT OT Motivos" }),
                        search.createColumn({ name: "custrecord_ht_ot_motivoscomentario", summary: "GROUP", label: "HT OT Motivos Comentario" }),
                        search.createColumn({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "HT OT Motor" }),
                        search.createColumn({ name: "custrecord_ht_ot_nombrereciberecepcion", summary: "GROUP", label: "HT OT Nombre Recibe" }),
                        search.createColumn({ name: "custrecord_ht_ot_nombreentregarecepcion", summary: "GROUP", label: "HT OT Nombre entrega" }),
                        search.createColumn({ name: "custrecord_ht_ot_novedades", summary: "GROUP", label: "HT OT Novedades" }),
                        search.createColumn({ name: "custrecord_ht_ot_odometro", summary: "GROUP", label: "HT OT Odómetro" }),
                        search.createColumn({ name: "custrecord_ht_ot_paralizador", summary: "GROUP", label: "HT OT Paralizador" }),
                        search.createColumn({ name: "custrecord_ht_ot_perillas", summary: "GROUP", label: "HT OT Perillas" }),
                        search.createColumn({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "HT OT Placa" }),
                        search.createColumn({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "HT OT Script" }),
                        search.createColumn({ name: "custrecord_ht_ot_radio", summary: "GROUP", label: "HT OT Radio" }),
                        search.createColumn({ name: "custrecord_ht_ot_serieproductoasignacion", summary: "GROUP", label: "Serie Producto" }),
                        search.createColumn({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "HT OT Servidor" }),
                        search.createColumn({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "HT OT Sim Card" }),
                        search.createColumn({ name: "custrecord_ht_ot_sinnovedad", summary: "GROUP", label: "HT OT Sin novedad" }),
                        search.createColumn({ name: "custrecord_ht_ot_supervisorasignacion", summary: "GROUP", label: "HT OT Supervisor" }),
                        search.createColumn({ name: "custrecord_ht_ot_tapacombustible", summary: "GROUP", label: "HT OT Tapa Combustible" }),
                        search.createColumn({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "HT OT Teléfono del Cliente" }),
                        search.createColumn({ name: "custrecord_ht_ot_termometro", summary: "GROUP", label: "HT OT Termometro" }),
                        search.createColumn({ name: "custrecord_ht_ot_tipo", summary: "GROUP", label: "HT OT Tipo" }),
                        search.createColumn({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "HT OT Técnico asignado" }),
                        search.createColumn({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "HT OT Unidad" }),
                        search.createColumn({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "HT OT Version" }),
                        search.createColumn({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" }),
                        search.createColumn({ name: "custrecord_ht_ot_oficinaatencion", summary: "GROUP", label: "Oficina de atención" }),
                        search.createColumn({ name: "custrecord_ht_ot_noimpulsaplataformas", summary: "GROUP", label: "No impulsa a Plataformas" })
                    ]
            });
            //let count = mySearch.runPaged().count;

            // log.debug('Debug', mySearch.run().getRange({ start: 0, end: 100 }))
            // mySearch.run().each(result => {
            //     let ordenTrabajoid = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" })
            //     let ordenServicioid = result.getValue({ name: "internalid", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OT ID Orden Servicio" })
            //     let ordenServicio = result.getValue({ name: "custrecord_ht_ot_orden_serivicio_txt", summary: "GROUP", label: "HT OT Orden de Servicio TXT" })
            //     let clase = result.getText({ name: "class", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Class" })
            //     let fechaEmisiónOrdenServicio = result.getValue({ name: "trandate", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Date" })
            //     let departamento = result.getText({ name: "department", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Department" })
            //     let oficina = result.getText({ name: "location", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Location" })
            //     let aprobacionCartera = result.getValue({ name: "custbody_ht_os_aprobacioncartera", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Cartera" })
            //     let aprobacionVenta = result.getValue({ name: "custbody_ht_os_aprobacionventa", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT OS Aprobación Venta" })
            //     let ejecutivaGestion = result.getValue({ name: "custbody_ht_os_ejecutiva_backoffice", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de Gestión" })
            //     let ejecutivaReferencia = result.getValue({ name: "custbody_ht_os_ejecutivareferencia", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Ejecutiva de referencia" })
            //     let ejecutivaRenovacion = result.getValue({ name: "salesrep", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Sales Rep" })
            //     let oportunidad = result.getValue({ name: "opportunity", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Opportunity" })
            //     let subsidiaria = result.getValue({ name: "subsidiarynohierarchy", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Subsidiary (no hierarchy)" })
            //     let aseguradora = result.getValue({ name: "custbody_ht_os_companiaseguros", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Aseguradora" })
            //     let consecionario = result.getValue({ name: "custbody_ht_os_concesionario", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Concesionario" })
            //     let bancos = result.getValue({ name: "custbody2", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Bancos" })
            //     let vendedorCanalDistribucion = result.getValue({ name: "custbody_ht_os_vendcanaldistribucion", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Vendedor del canal de distribución" })
            //     let facturarA = result.getValue({ name: "custbody_ht_facturar_a", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "HT Facturar a" })
            //     let trabajado = result.getValue({ name: "custbody_ht_os_trabajado", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Trabajado" })
            //     let novedadesOrdenServicio = result.getValue({ name: "custbody_ht_os_novedades", join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO", summary: "GROUP", label: "Novedades" })
            //     let ordenTrabajo = result.getValue({ name: "name", sort: search.Sort.ASC, summary: "GROUP", label: "ID" })
            //     let ordenTrabajoEstado = result.getValue({ name: "custrecord_ht_ot_estado", summary: "GROUP", label: "HT OT Estado Orden de trabajo" })
            //     let itemid = result.getValue({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
            //     let item = result.getText({ name: "custrecord_ht_ot_item", summary: "GROUP", label: "HT OT Ítem" })
            //     let clienteid = result.getValue({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" })
            //     let cliente = result.getText({ name: "custrecord_ht_ot_cliente_id", summary: "GROUP", label: "Cliente" })
            //     let estadoLojack = result.getValue({ name: "custrecord_ht_ot_estadolojack", summary: "GROUP", label: "Estado Lojack" })
            //     let boxSerie = result.getValue({ name: "custrecord_ht_ot_boxserie", summary: "GROUP", label: "HT Box Serie" })
            //     let confirmacionPXAdmin = result.getValue({ name: "custrecord_ht_ot_pxadminfinalizacion", summary: "GROUP", label: "HT Confirmación PX Admin" })
            //     let estadoChaser = result.getValue({ name: "custrecord_ht_ot_estadochaser", summary: "GROUP", label: "Estado Chaser" })
            //     let confirmacionTelematics = result.getValue({ name: "custrecord_ht_ot_confirmaciontelamatic", summary: "GROUP", label: "HT Confirmación Telematics" })
            //     let modeloBien = result.getText({ name: "custrecord_ht_ot_modelobien", summary: "GROUP", label: "HT OS Modelo" })
            //     let apn = result.getValue({ name: "custrecord_ht_ot_apn", summary: "GROUP", label: "HT OT APN" })
            //     let aireaAcondicionado = result.getValue({ name: "custrecord_ht_ot_aireacondicionado", summary: "GROUP", label: "HT OT Aire acondicionado" })
            //     let alfombraPiso = result.getValue({ name: "custrecord_ht_ot_alfombrapiso", summary: "GROUP", label: "HT OT Alfombra de piso" })
            //     let brazosPlumas = result.getValue({ name: "custrecord_ht_ot_brazosplumas", summary: "GROUP", label: "HT OT Brazos y Plumas" })
            //     let cantidadControles = result.getValue({ name: "custrecord_ht_ot_contidadcontroles", summary: "GROUP", label: "HT OT Cantidad controles" })
            //     let cantidadLlaves = result.getValue({ name: "custrecord_ht_ot_cantidadllaves", summary: "GROUP", label: "HT OT Cantidad llaves" })
            //     let cenicero = result.getValue({ name: "custrecord_ht_ot_cenicero", summary: "GROUP", label: "HT OT Cenicero" })
            //     let chasis = result.getValue({ name: "custrecord_ht_ot_chasis", summary: "GROUP", label: "HT OT Chasis" })
            //     let chocotes = result.getValue({ name: "custrecord_ht_ot_chicotes", summary: "GROUP", label: "HT OT Chicotes" })
            //     let color = result.getValue({ name: "custrecord_ht_ot_color", summary: "GROUP", label: "HT OT Color" })
            //     let codigoActivacion = result.getValue({ name: "custrecord_ht_ot_codigoactivacion", summary: "GROUP", label: "Código de Activación" })
            //     let codigoRespuesta = result.getValue({ name: "custrecord_ht_ot_codigorespuesta", summary: "GROUP", label: "Código de Respuesta" })
            //     let fecha = result.getValue({ name: "created", summary: "GROUP", label: "Date Created" })
            //     let conbustible = result.getValue({ name: "custrecord_ht_ot_porcentajecombustible", summary: "GROUP", label: "HT OT Combustible" })
            //     let conectividadTelematics = result.getValue({ name: "custrecord_ht_ot_telematicfinalizacion", summary: "GROUP", label: "HT OT Conectividad Telematics" })
            //     let conNovedad = result.getValue({ name: "custrecord_ht_ot_connovedad", summary: "GROUP", label: "HT OT Con novedad" })
            //     let correo = result.getValue({ name: "custrecord_ht_ot_correorecepcion", summary: "GROUP", label: "HT OT Correo" })
            //     let direccionCliente = result.getValue({ name: "custrecord_ht_ot_direccioncliente", summary: "GROUP", label: "HT OT Dirección del Cliente" })
            //     let correoCliente = result.getValue({ name: "custrecord_ht_ot_correocliente", summary: "GROUP", label: "HT OT Correo del Cliente" })
            //     let dispositivo = result.getValue({ name: "custrecord_ht_ot_dispositivo", summary: "GROUP", label: "HT OT Dispositivo" })
            //     let fechaEntrega = result.getValue({ name: "custrecord_ht_ot_fechaentrega", summary: "GROUP", label: "HT OT Fecha entrega" })
            //     let fechaTrabajo = result.getValue({ name: "custrecord_ht_ot_fechatrabajoasignacion", summary: "GROUP", label: "HT OT Fecha trabajo" })
            //     let fimaware = result.getValue({ name: "custrecord_ht_ot_firmware", summary: "GROUP", label: "HT OT Firmware" })
            //     let fueraCuidad = result.getValue({ name: "custrecord_ht_ot_fueraciudad", summary: "GROUP", label: "HT OT Fuera Ciudad" })
            //     let fueraTaller = result.getValue({ name: "custrecord_ht_ot_fuerataller", summary: "GROUP", label: "HT OT Fuera taller" })
            //     let horaEntrega = result.getValue({ name: "custrecord_ht_ot_horaentrega", summary: "GROUP", label: "HT OT Hora entrega" })
            //     let horaTrabajo = result.getValue({ name: "custrecord_ht_ot_horatrabajoasignacion", label: "HT OT Hora trabajo" })
            //     let vehiculoid = result.getValue({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" })
            //     let vehiculo = result.getText({ name: "custrecord_ht_ot_vehiculo", summary: "GROUP", label: "HT OT ID Vehículo" })
            //     let lucesParqueo = result.getValue({ name: "custrecord_ht_ot_lucesparqueo", summary: "GROUP", label: "HT OT Luces Parqueo" })
            //     let ip = result.getValue({ name: "custrecord_ht_ot_ip", summary: "GROUP", label: "HT OT IP" })
            //     let itemVentAlquiler = result.getValue({ name: "custrecord_ht_ot_item_vent_alq", summary: "GROUP", label: "HT OT Item Vent Alq" })
            //     let listaComentarios = result.getValue({ name: "custrecord_ht_ot_listacomentarios", summary: "GROUP", label: "HT OT Lista de comentarios" })
            //     let marca = result.getValue({ name: "custrecord_ht_ot_marca", summary: "GROUP", label: "HT OT Marca" })
            //     let mascarillas = result.getValue({ name: "custrecord_ht_ot_mascarillas", summary: "GROUP", label: "HT OT Mascarillas" })
            //     let modeloDispositivo = result.getValue({ name: "custrecord_ht_ot_modelo", summary: "GROUP", label: "HT OT Modelo" })
            //     let motivos = result.getValue({ name: "custrecord_ht_ot_motivos", summary: "GROUP", label: "HT OT Motivos" })
            //     let motivoComentario = result.getValue({ name: "custrecord_ht_ot_motivoscomentario", summary: "GROUP", label: "HT OT Motivos Comentario" })
            //     let motor = result.getValue({ name: "custrecord_ht_ot_motor", summary: "GROUP", label: "HT OT Motor" })
            //     let nombreRecibe = result.getValue({ name: "custrecord_ht_ot_nombrereciberecepcion", summary: "GROUP", label: "HT OT Nombre Recibe" })
            //     let nombreEntrega = result.getValue({ name: "custrecord_ht_ot_nombreentregarecepcion", summary: "GROUP", label: "HT OT Nombre entrega" })
            //     let novedades = result.getValue({ name: "custrecord_ht_ot_novedades", summary: "GROUP", label: "HT OT Novedades" })
            //     let odometro = result.getValue({ name: "custrecord_ht_ot_odometro", summary: "GROUP", label: "HT OT Odómetro" })
            //     let paralizador = result.getValue({ name: "custrecord_ht_ot_paralizador", summary: "GROUP", label: "HT OT Paralizador" })
            //     let perillas = result.getValue({ name: "custrecord_ht_ot_perillas", summary: "GROUP", label: "HT OT Perillas" })
            //     let placa = result.getValue({ name: "custrecord_ht_ot_placa", summary: "GROUP", label: "HT OT Placa" })
            //     let script = result.getValue({ name: "custrecord_ht_ot_script", summary: "GROUP", label: "HT OT Script" })
            //     let radio = result.getValue({ name: "custrecord_ht_ot_radio", summary: "GROUP", label: "HT OT Radio" })
            //     let serieProducto = result.getValue({ name: "custrecord_ht_ot_serieproductoasignacion", label: "HT OT Serie Producto" })
            //     let servidor = result.getValue({ name: "custrecord_ht_ot_servidor", summary: "GROUP", label: "HT OT Servidor" })
            //     let simCard = result.getValue({ name: "custrecord_ht_ot_simcard", summary: "GROUP", label: "HT OT Sim Card" })
            //     let sinNovedad = result.getValue({ name: "custrecord_ht_ot_sinnovedad", summary: "GROUP", label: "HT OT Sin novedad" })
            //     let supervisor = result.getValue({ name: "custrecord_ht_ot_supervisorasignacion", summary: "GROUP", label: "HT OT Supervisor" })
            //     let tapaCombustible = result.getValue({ name: "custrecord_ht_ot_tapacombustible", summary: "GROUP", label: "HT OT Tapa Combustible" })
            //     let telefonoCliente = result.getValue({ name: "custrecord_ht_ot_telefonocliente", summary: "GROUP", label: "HT OT Teléfono del Cliente" })
            //     let termometro = result.getValue({ name: "custrecord_ht_ot_termometro", summary: "GROUP", label: "HT OT Termometro" })
            //     let tipoBien = result.getValue({ name: "custrecord_ht_ot_tipo", summary: "GROUP", label: "HT OT Tipo" })
            //     let tecnicoAsignado = result.getValue({ name: "custrecord_ht_ot_tecnicoasignacion", summary: "GROUP", label: "HT OT Técnico asignado" })
            //     let unidad = result.getValue({ name: "custrecord_ht_ot_unidad", summary: "GROUP", label: "HT OT Unidad" })
            //     let version = result.getValue({ name: "custrecord_ht_ot_version", summary: "GROUP", label: "HT OT Version" })
            //     let imei = result.getValue({ name: "custrecord_ht_ot_imei", summary: "GROUP", label: "IMEI" })
            //     let oficinaAtencion = result.getValue({ name: "custrecord_ht_ot_oficinaatencion", summary: "GROUP", label: "Oficina de atención" })
            //     let impulsaPlataformas = result.getValue({ name: "custrecord_ht_ot_noimpulsaplataformas", summary: "GROUP", label: "No impulsa a Plataformas" })

            //     jsonResult.push({
            //         ordenTrabajoid: ordenTrabajoid,
            //         ordenServicioid: ordenServicioid,
            //         ordenServicio: ordenServicio,
            //         clase: clase,
            //         fechaEmisiónOrdenServicio: fechaEmisiónOrdenServicio,
            //         departamento: departamento,
            //         oficina: oficina,
            //         aprobacionCartera: aprobacionCartera,
            //         aprobacionVenta: aprobacionVenta,
            //         ejecutivaGestion: ejecutivaGestion,
            //         ejecutivaReferencia: ejecutivaReferencia,
            //         ejecutivaRenovacion: ejecutivaRenovacion,
            //         oportunidad: oportunidad,
            //         subsidiaria: subsidiaria,
            //         aseguradora: aseguradora,
            //         consecionario: consecionario,
            //         bancos: bancos,
            //         vendedorCanalDistribucion: vendedorCanalDistribucion,
            //         facturarA: facturarA,
            //         trabajado: trabajado,
            //         novedadesOrdenServicio: novedadesOrdenServicio,
            //         ordenTrabajo: ordenTrabajo,
            //         ordenTrabajoEstado: ordenTrabajoEstado,
            //         itemid: itemid,
            //         item: item,
            //         clienteid: clienteid,
            //         cliente: cliente,
            //         estadoLojack: estadoLojack,
            //         boxSerie: boxSerie,
            //         confirmacionPXAdmin: confirmacionPXAdmin,
            //         estadoChaser: estadoChaser,
            //         confirmacionTelematics: confirmacionTelematics,
            //         modeloBien: modeloBien,
            //         apn: apn,
            //         aireaAcondicionado: aireaAcondicionado,
            //         alfombraPiso: alfombraPiso,
            //         brazosPlumas: brazosPlumas,
            //         cantidadControles: cantidadControles,
            //         cantidadLlaves: cantidadLlaves,
            //         cenicero: cenicero,
            //         chasis: chasis,
            //         chocotes: chocotes,
            //         color: color,
            //         codigoActivacion: codigoActivacion,
            //         codigoRespuesta: codigoRespuesta,
            //         conbustible: conbustible,
            //         conectividadTelematics: conectividadTelematics,
            //         conNovedad: conNovedad,
            //         correo: correo,
            //         direccionCliente: direccionCliente,
            //         correoCliente: correoCliente,
            //         dispositivo: dispositivo,
            //         fechaEntrega: fechaEntrega,
            //         fechaTrabajo: fechaTrabajo,
            //         fimaware: fimaware,
            //         fueraCuidad: fueraCuidad,
            //         fueraTaller: fueraTaller,
            //         horaEntrega: horaEntrega,
            //         horaTrabajo: horaTrabajo,
            //         vehiculoid: vehiculoid,
            //         vehiculo: vehiculo,
            //         lucesParqueo: lucesParqueo,
            //         ip: ip,
            //         itemVentAlquiler: itemVentAlquiler,
            //         listaComentarios: listaComentarios,
            //         marca: marca,
            //         mascarillas: mascarillas,
            //         modeloDispositivo, modeloDispositivo,
            //         motivos: motivos,
            //         motivoComentario: motivoComentario,
            //         motor: motor,
            //         nombreRecibe: nombreRecibe,
            //         nombreEntrega: nombreEntrega,
            //         novedades: novedades,
            //         odometro: odometro,
            //         paralizador: paralizador,
            //         perillas: perillas,
            //         placa: placa,
            //         script: script,
            //         radio: radio,
            //         serieProducto: serieProducto,
            //         servidor: servidor,
            //         simCard: simCard,
            //         sinNovedad: sinNovedad,
            //         supervisor: supervisor,
            //         tapaCombustible: tapaCombustible,
            //         telefonoCliente: telefonoCliente,
            //         termometro: termometro,
            //         tipoBien: tipoBien,
            //         tecnicoAsignado: tecnicoAsignado,
            //         unidad: unidad,
            //         version: version,
            //         imei1_: imei,
            //         oficinaAtencion: oficinaAtencion,
            //         impulsaPlataformas: impulsaPlataformas
            //     });
            //     return true;
            // });


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
            let turnoUnico = getTurnoId(scriptContext.ordenServicio);
            if (turnoUnico != '') {
                return { 'codigoTurno': '' }
            } else {
                let turno = record.create({ type: record.Type.TASK });
                turno.setValue({ fieldId: 'title', value: scriptContext.codigoTurno });
                turno.setValue({ fieldId: 'assigned', value: 4 });
                turno.setValue({ fieldId: 'startdate', value: new Date(scriptContext.fecha) });
                turno.setValue({ fieldId: 'custevent_ht_tr_hora', value: new Date(scriptContext.hora) });
                turno.setValue({ fieldId: 'custevent_ht_turno_taller', value: scriptContext.taller });
                turno.setValue({ fieldId: 'company', value: scriptContext.customer });
                turno.setValue({ fieldId: 'transaction', value: scriptContext.ordenServicio });
                turno.setValue({ fieldId: 'relateditem', value: scriptContext.item });
                let recordTurno = turno.save();
                let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO_SEARCH });
                let filters = objSearch.filters;
                const transactionFilter = search.createFilter({ name: 'internalid', join: 'custrecord_ht_ot_orden_servicio', operator: search.Operator.ANYOF, values: scriptContext.ordenServicio });
                filters.push(transactionFilter);
                //let resultCount = objSearch.runPaged().count;
                let result = objSearch.run().getRange({ start: 0, end: 100 });
                for (let i in result) {
                    let internalidOT = result[i].getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" });
                    record.submitFields({ type: 'customrecord_ht_record_ordentrabajo', id: internalidOT, values: { 'custrecord_ht_ot_taller': scriptContext.taller } });
                }
                //log.debug('Turno', recordTurno);
                return { 'turnoID': recordTurno }
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