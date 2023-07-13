
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
define(['N/log', 'N/search', 'N/record', 'N/email'], (log, search, record, email) => {
    const HT_CONSULTA_ORDEN_TRABAJO_SEARCH = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //
    const HT_BIEN_RECORD = 'customrecord_ht_record_bienes' //HT Bienes
    const HT_FLUJO_ORDEN_TRABAJO_RECORD = 'customrecord_ht_ot_flujoordendetrabajo' //HT OT Flujo Orden de trabajo - PRODUCCION
    const HT_FLUJO_ORDEN_TRBAJO_SEARCH = 'customsearch_ht_ot_flujo_orden_trabajo' //HT OT Flujo Orden de trabajo - PRODUCCION
    const RECEPCION = 'recepcion';
    const ACTUALIZAR = 'actualizar';
    const RECEPCION_FORMULARIO = 161;
    const ASIGNACION_FORMULARIO = 163;
    const PROCESANDO_FORMULARIO = 162;
    const FINALIZACION_OT = 164;

    const _get = (scriptContext) => {
        let idOT = 'vacio';
        let idOS = 'vacio';
        let placa = 'vacio';
        let jsonResult = new Array();
        // log.debug('scriptContext', scriptContext);

        try {
            let param = false;
            let filter =
                [
                    ["custrecord_ht_ot_orden_servicio.class", "noneof", "@NONE@"],
                    "AND",
                    ["custrecord_ht_ot_orden_servicio.department", "noneof", "@NONE@"]
                ]

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

            const mySearch = search.create({
                type: HT_ORDEN_TRABAJO_RECORD,
                filters: filter,
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

        // if (typeof scriptContext.idot != 'undefined') { idOT = scriptContext.idot; }
        // if (typeof scriptContext.idos != 'undefined') { idOS = scriptContext.idos; }
        // if (typeof scriptContext.placa != 'undefined') { placa = scriptContext.placa; }

        // const filterIDOS = search.createFilter({ name: 'custrecord_ht_ot_orden_serivicio_txt', operator: search.Operator.STARTSWITH, values: idOS });
        // const filterIDOT = search.createFilter({ name: 'idtext', operator: search.Operator.STARTSWITH, values: idOT });
        // //const filterTecnico = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: id });
        // const filterPlaca = search.createFilter({ name: 'custrecord_ht_bien_placa', join: 'custrecord_ht_ot_vehiculo', operator: search.Operator.STARTSWITH, values: placa });
        // //const filterTaller = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: id });

        // try {
        //     let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO_SEARCH });
        //     let filters = objSearch.filters;
        //     if (typeof scriptContext.idos != 'undefined') {
        //         filters.push(filterIDOS);
        //     }
        //     if (typeof scriptContext.idot != 'undefined') {
        //         filters.push(filterIDOT);
        //     }
        //     if (typeof scriptContext.placa != 'undefined') {
        //         filters.push(filterPlaca);
        //     }

        //     let cantidadRegistros = objSearch.runPaged().count;
        //     let result = objSearch.run().getRange({ start: 0, end: 100 });
        //     //log.debug('Results', result);
        //     return result;

        //     // if (typeof scriptContext.idos == 'undefined') {
        //     //     if (typeof scriptContext.idot != 'undefined' || typeof scriptContext.placa != 'undefined') {
        //     //         let objSearchFlujoOT = search.load({ id: HT_FLUJO_ORDEN_TRBAJO_SEARCH });
        //     //         let filters1 = objSearchFlujoOT.filters;
        //     //         const filterIDOT = search.createFilter({ name: 'idtext', operator: search.Operator.STARTSWITH, values: idOT });
        //     //         filters1.push(filterIDOT);
        //     //         let cantidadRegistros = objSearch.runPaged().count;
        //     //         let result = objSearch.run().getRange({ start: 0, end: 100 });
        //     //     }
        //     // } else {
        //     //     return result;
        //     // }
        // } catch (error) {
        //     log.error('Error-GET', error);
        // }
    }

    const _post = (scriptContext) => {
        let accion = 'accion no definida';
        let respuesta = '';
        log.debug('JSON', scriptContext);
        try {
            if (typeof scriptContext.accion != 'undefined') {
                accion = scriptContext.accion;
                let guardar = 0;
                let guardarBien = 0;
                let recepcion = '';
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
                                //log.debug('Results', result);
                                let idordentrabajo = result[0].getValue({ name: "internalid" });
                                let idvehiculo = result[0].getValue({ name: "custrecord_ht_ot_vehiculo" });

                                //*Bloque seteo =========================================================================================
                                //let recepcionRecord = record.create({ type: HT_FLUJO_ORDEN_TRABAJO_RECORD });

                                let openRecord = record.create({ type: record.Type.CALENDAR_EVENT, isDynamic: true })
                                //let openRecord = record.load({ type: HT_ORDEN_TRABAJO_RECORD, id: idordentrabajo, isDynamic: true });
                                openRecord.setValue({ fieldId: "customform", value: "173" });
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

                                if (typeof scriptContext.customer != 'undefined' && scriptContext.customer.length > 0) {
                                    openRecord.setValue({ fieldId: "custevent_ht_rc_correorecepcion", value: scriptContext.correo });
                                    guardar = 1;
                                }

                                if (typeof scriptContext.comentario != 'undefined' && scriptContext.comentario.length > 0) {
                                    openRecord.setValue({ fieldId: "message", value: scriptContext.comentario });
                                    guardar = 1;
                                }

                                if (guardar == 1) {
                                    openRecord.setValue({ fieldId: 'company', value: scriptContext.customer });
                                    openRecord.setValue({ fieldId: 'transaction', value: scriptContext.idordenservicio });
                                    //openRecord.setValue({ fieldId: "sendemail", value: true });
                                    let recepcionRec = openRecord.save();
                                    recepcion = scriptContext.ordenServicio;
                                    // let submitF = record.submitFields({
                                    //     type: record.Type.CALENDAR_EVENT,
                                    //     id: savedRecord,
                                    //     values: {
                                    //         sendemail: true
                                    //     }
                                    // });
                                    log.debug('Recepción', recepcionRec);
                                }

                                let openRecordBien = record.load({ type: HT_BIEN_RECORD, id: idvehiculo, isDynamic: true });
                                if (typeof scriptContext.color != 'undefined' && scriptContext.color.length > 0) {
                                    openRecordBien.setValue({ fieldId: "custrecord_ht_bien_colorcarseg", value: scriptContext.color });
                                    guardarBien = 1;
                                }

                                if (guardarBien == 1) {
                                    openRecordBien.save();
                                }
                                let Dennis = 4;
                                let Bruno = 34;
                                email.send({
                                    author: Dennis,
                                    recipients: scriptContext.customer,
                                    subject: 'Recepción de Vehículo',
                                    body: '<p>Vehículo recepcionado</p><p>' + scriptContext.comentario + '</p>',
                                    relatedRecords: {
                                        transactionId: scriptContext.idordenservicio
                                    }
                                });
                                respuesta = 'Vehículo recepcionado, recepción: ' + recepcion;
                            } else {
                                respuesta = 'No se encontró información para está Orden de Trabajo';
                            }
                        } else {
                            respuesta = 'Orden de Trabajo no especificada';
                        }
                        break;
                    case ACTUALIZAR:
                        if (typeof scriptContext.idordentrabajo != 'undefined') {
                            let guardar = 0;
                            let action = '';
                            let openRecord = record.load({ type: HT_ORDEN_TRABAJO_RECORD, id: scriptContext.idordentrabajo, isDynamic: true });
                            if (typeof scriptContext.codigodispositivo != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_serieproductoasignacion", value: scriptContext.codigodispositivo });
                                guardar = 1;
                                action = 'Nro de serie de dispositivo asignado';
                            }
                            if (typeof scriptContext.estadoot != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_estado", value: scriptContext.estadoot });
                                guardar = 1;
                                action = 'Cambio de estado';
                            }
                            if (typeof scriptContext.tecnico != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_tecnicoasignacion", value: scriptContext.tecnico });
                                guardar = 1;
                                action = 'Chequeada';
                            }
                            if (typeof scriptContext.comentario != 'undefined') {
                                openRecord.setValue({ fieldId: "custrecord_ht_ot_comentariofinalizacion", value: scriptContext.comentario });
                                guardar = 1;
                                action = 'Ingresa comentario';
                            }
                            openRecord.setValue({ fieldId: "custrecord_ht_ot_fechatrabajoasignacion", value: new Date(scriptContext.fechatrabajoasignacion) });
                            openRecord.setValue({ fieldId: "custrecord_ht_ot_horatrabajoasignacion", value: new Date(scriptContext.horatrabajoasignacion) });
                            openRecord.setValue({ fieldId: "custrecord_ht_ot_ubicacion", value: scriptContext.ubicacion });

                            if (guardar == 1) {
                                openRecord.save();
                                respuesta = 'Actualización: ' + action;
                            }
                            //openRecord.setValue({ fieldId: "custrecord_lh_detalle_cppto_" + month, value: montoEjecutado });
                        } else {
                            respuesta = 'internalid Orden de Trabajo no definida';
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