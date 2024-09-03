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
Url: https://7451241-sb1.restlets.api.netsuite.com/app/sites/hosting/restlet.nl?script=706&deploy=1
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(["N/log", "N/search", "N/record", "N/query", "N/runtime"], (log, search, record, query, runtime) => {
  const HT_TURNO = "task";
  const HT_ORDEN_TRABAJO_RECORD = "customrecord_ht_record_ordentrabajo";
  const ERROR_TALLER_NO_VALIDO = "Taller no válido o no encontrado";
  const ERROR_ORDEN_SERVICIO = "La Orden de Servicio no tiene ninguna Orden de Trabajo asociada";

  const _get = (scriptContext) => {
    // let nrodocumento = context.nrodocumento;
    // log.debug('Context', nrodocumento);
    let idOT = "vacio";
    let idOS = "vacio";
    let placa = "vacio";
    let jsonResult = new Array();
    log.debug("Context", scriptContext);

    try {
      var fechaTurnoDesde = "";
      var fechaTurnoHasta = "";
      var filtro_fecha = false;
      let param = false;
      let tecnico_param = false;
      let taller_param = false;
      let cliente_param = false;
      let vehiculo_param = false;
      let OrdeServ_param = false;
      let consultanro4_param = false;
      let filter = [
        ["custrecord_ht_ot_orden_servicio.class", "noneof", "@NONE@"],
        "AND",
        ["custrecord_ht_ot_orden_servicio.department", "noneof", "@NONE@"],
      ];
      let filter_Cliente = [["isinactive", "is", "F"]];
      let filter_Tecnico = [["custevent_ht_turno_taller", "noneof", "@NONE@"]];
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

      if (typeof scriptContext.ostieneturno != "undefined") {
        if (scriptContext.ostieneturno.length != 0) {
          if (scriptContext.ostieneturno == "T") {
            filter_OrdenServ.push("AND", [
              "custrecord_ht_ot_taller",
              "noneof",
              "@NONE@",
            ]);
          } else if (scriptContext.ostieneturno == "F") {
            //filter.push("AND", ["custrecord_ht_ot_estado", "anyof", "7"]);
            filter_OrdenServ.push("AND", [
              "custrecord_ht_ot_taller",
              "anyof",
              "@NONE@",
            ]);
          }
          param = true;
          OrdeServ_param = true;
        }
      }

      if (
        typeof scriptContext.osdesde != "undefined" &&
        typeof scriptContext.oshasta != "undefined"
      ) {
        let FechaDesde = scriptContext.osdesde;
        FechaDesde = FechaDesde.replace(/-/g, "/");
        FechaDesde = FechaDesde.replace(/"/g, "");
        let FechaHasta = scriptContext.oshasta;
        FechaHasta = FechaHasta.replace(/-/g, "/");
        FechaHasta = FechaHasta.replace(/"/g, "");
        let from = esFechaValida(FechaDesde);
        let to = esFechaValida(FechaHasta);

        log.debug("FechaDesde1", FechaDesde);
        log.debug("FechaHasta1", FechaHasta);

        if (from == true && to == true) {
          filter_OrdenServ.push("AND", [
            "custrecord_ht_ot_orden_servicio.trandate",
            "within",
            FechaDesde,
            FechaHasta,
          ]);
          param = true;
          OrdeServ_param = true;
        } else {
          return "Las fechas ingresadas no son válidas";
        }
      }

      if (
        typeof scriptContext.fechadesde != "undefined" &&
        typeof scriptContext.fechahasta != "undefined"
      ) {
        let FechaDesde = scriptContext.fechadesde;
        FechaDesde = FechaDesde.replace(/-/g, "/");
        FechaDesde = FechaDesde.replace(/"/g, "");
        let FechaHasta = scriptContext.fechahasta;
        FechaHasta = FechaHasta.replace(/-/g, "/");
        FechaHasta = FechaHasta.replace(/"/g, "");
        let from = esFechaValida(FechaDesde);
        let to = esFechaValida(FechaHasta);

        log.debug("FechaDesde2", FechaDesde);
        log.debug("FechaHasta2", FechaHasta);

        if (from == true && to == true) {
          fechaTurnoDesde = FechaDesde;
          fechaTurnoHasta = FechaHasta;
          filtro_fecha = true;
          param = true;
          OrdeServ_param = true;

          log.debug("fechaTurnoDesde", fechaTurnoDesde);
          log.debug("fechaTurnoHasta", fechaTurnoHasta);
        } else {
          return "Las fechas ingresadas no son válidas";
        }
      }

      if (typeof scriptContext.turnoordenservicio != "undefined") {
        if (scriptContext.turnoordenservicio.length != 0) {
          filter_Tecnico.push("AND", [
            "transaction.tranid",
            "contains",
            scriptContext.turnoordenservicio,
          ]);
          param = true;
          tecnico_param = true;
        }
      }

      if (
        typeof scriptContext.turnodesde != "undefined" &&
        typeof scriptContext.turnohasta != "undefined"
      ) {
        let FechaDesde = scriptContext.turnodesde;
        FechaDesde = FechaDesde.replace(/-/g, "/");
        FechaDesde = FechaDesde.replace(/"/g, "");
        let FechaHasta = scriptContext.turnohasta;
        FechaHasta = FechaHasta.replace(/-/g, "/");
        FechaHasta = FechaHasta.replace(/"/g, "");

        let partesDesde = FechaDesde.split("/");
        let partesHasta = FechaHasta.split("/");
        let newFechaDesde = partesDesde[2] + "/" + partesDesde[1] + "/" + partesDesde[0];
        let newFechaHasta = partesHasta[2] + "/" + partesHasta[1] + "/" + partesHasta[0];

        let from = esFechaValida(newFechaDesde);
        let to = esFechaValida(newFechaHasta);

        if (from == true && to == true) {
          filter_Tecnico.push("AND", [
            "startdate",
            "within",
            newFechaDesde,
            newFechaHasta,
          ]);
          param = true;
          tecnico_param = true;
        } else {
          return "Las fechas ingresadas no son válidas";
        }
      }

      if (typeof scriptContext.codigotecnico != "undefined") {
        if (scriptContext.codigotecnico.length != 0) {
          //filter.push("AND", ["custrecord_ht_ot_tecnicoasignacion", "anyof", scriptContext.tecnico])
          param = true;
          filter_Tecnico.push("AND", [
            "assigned",
            "anyof",
            scriptContext.codigotecnico,
          ]);
          tecnico_param = true;
        }
      }

      if (typeof scriptContext.descripciontecnico != "undefined") {
        if (scriptContext.descripciontecnico.length != 0) {
          param = true;
          filter_Tecnico.push("AND", [
            "assigned.entityid",
            "haskeywords",
            scriptContext.descripciontecnico,
          ]);
          tecnico_param = true;
        }
      }

      if (typeof scriptContext.turnodescripciontaller != "undefined") {
        if (scriptContext.turnodescripciontaller.length != 0) {
          param = true;
          filter_Tecnico.push("AND", [
            "custevent_ht_turno_taller.custrecord_ht_tt_descripcion",
            "contains",
            scriptContext.turnodescripciontaller,
          ]);
          tecnico_param = true;
        }
      }

      if (typeof scriptContext.turnocodigotaller != "undefined") {
        if (scriptContext.turnocodigotaller.length != 0) {
          param = true;
          filter_Tecnico.push("AND", [
            "custevent_ht_turno_taller.custrecord_ht_tt_codigo",
            "startswith",
            scriptContext.turnocodigotaller,
          ]);
          tecnico_param = true;
        }
      }

      if (typeof scriptContext.codigotaller != "undefined") {
        if (scriptContext.codigotaller.length != 0) {
          param = true;
          filter_Taller.push("AND", [
            "custrecord_ht_ot_taller.custrecord_ht_tt_codigo",
            "startswith",
            scriptContext.codigotaller,
          ]);
          taller_param = true;
        }
      }

      if (typeof scriptContext.nombrecliente != "undefined") {
        if (scriptContext.nombrecliente.length != 0) {
          param = true;
          filter_Cliente.push("AND", [
            "altname",
            "contains",
            scriptContext.nombrecliente,
          ]);
          cliente_param = true;
        }
      }

      if (typeof scriptContext.cedularuc != "undefined") {
        if (scriptContext.cedularuc.length != 0) {
          param = true;
          filter_Cliente.push("AND", [
            "vatregnumber",
            "is",
            scriptContext.cedularuc,
          ]);
          cliente_param = true;
        }
      }

      if (typeof scriptContext.nombre != "undefined") {
        if (scriptContext.nombre.length != 0) {
          consulta_nro4.push(["altname", "contains", scriptContext.nombre]);
          param = true;
          consultanro4_param = true;
          //vehiculo_param = true;
        }
      }

      var idclienteconsulta = 0;
      if (typeof scriptContext.clienteId != "undefined") {
        if (scriptContext.clienteId.length != 0) {
          idclienteconsulta = scriptContext.clienteId;
          //filter_Vehiculo.push("AND", ["custrecord_ht_ot_cliente_id.internalid", "anyof", scriptContext.clienteId]);
          consulta_nro4.push([
            "custrecord_ht_bien_propietario",
            "anyof",
            scriptContext.clienteId,
          ]);
          param = true;
          consultanro4_param = true;
        }
      }

      if (typeof scriptContext.codigoClienteVehiculo != "undefined") {
        if (scriptContext.codigoClienteVehiculo.length != 0) {
          let id_cliente = getBuscarCliente(
            scriptContext.codigoClienteVehiculo
          );
          if (id_cliente != "" && idclienteconsulta == 0) {
            //filter_Vehiculo.push("AND", ["custrecord_ht_ot_cliente_id.internalid", "anyof", id_cliente])
            consulta_nro4.push([
              "custrecord_ht_bien_propietario",
              "anyof",
              id_cliente,
            ]);
          }
          param = true;
          //vehiculo_param = true;
          consultanro4_param = true;
        }
      }

      if (typeof scriptContext.nombrevehiculo != "undefined") {
        if (scriptContext.nombrevehiculo.length != 0) {
          param = true;
          //filter_Vehiculo.push("AND", ["custrecord_ht_ot_vehiculo.name", "contains", scriptContext.nombrevehiculo])
          consulta_nro4.push([
            "name",
            "contains",
            scriptContext.nombrevehiculo,
          ]);
          consultanro4_param = true;
        }
      }

      if (param == false) {
        return "Filtro no válido";
      }

      if (
        tecnico_param == true &&
        (taller_param == true ||
          cliente_param == true ||
          consultanro4_param == true ||
          OrdeServ_param == true)
      ) {
        return "Filtro no válido";
      }

      if (
        taller_param == true &&
        (tecnico_param == true ||
          cliente_param == true ||
          consultanro4_param == true ||
          OrdeServ_param == true)
      ) {
        return "Filtro no válido";
      }

      if (
        cliente_param == true &&
        (tecnico_param == true ||
          taller_param == true ||
          consultanro4_param == true ||
          OrdeServ_param == true)
      ) {
        return "Filtro no válido";
      }

      if (
        consultanro4_param == true &&
        (tecnico_param == true ||
          cliente_param == true ||
          taller_param == true ||
          OrdeServ_param == true)
      ) {
        return "Filtro no válido";
      }

      if (
        OrdeServ_param == true &&
        (tecnico_param == true ||
          cliente_param == true ||
          taller_param == true ||
          consultanro4_param == true)
      ) {
        return "Filtro no válido";
      }

      const Search_tecnico = search.create({
        type: HT_TURNO,
        filters: filter_Tecnico,
        columns: [
          search.createColumn({
            name: "custevent_ht_tr_hora",
            summary: "GROUP",
            label: "Hora",
          }),
          search.createColumn({
            name: "startdate",
            summary: "GROUP",
            label: "Fecha de inicio",
          }),
          search.createColumn({
            name: "custrecord_ht_tt_codigo",
            join: "CUSTEVENT_HT_TURNO_TALLER",
            summary: "GROUP",
            label: "Código",
          }),
          search.createColumn({
            name: "custrecord_ht_tt_descripcion",
            join: "CUSTEVENT_HT_TURNO_TALLER",
            summary: "GROUP",
            label: "Descripción",
          }),
          search.createColumn({
            name: "transaction",
            summary: "GROUP",
            label: "Transacción",
          }),
          search.createColumn({
            name: "assigned",
            summary: "GROUP",
            label: "Asignado a",
          }),
          search.createColumn({
            name: "title",
            summary: "GROUP",
            label: "Título de turno",
          }),
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "ID interno",
          }),
          search.createColumn({
            name: "internalid",
            join: "transaction",
            summary: "GROUP",
            label: "ID interno",
          }),
          search.createColumn({
            name: "internalid",
            join: "CUSTEVENT_HT_TURNO_TALLER",
            summary: "GROUP",
            label: "ID interno",
          }),
          search.createColumn({
            name: "internalid",
            join: "assigned",
            summary: "GROUP",
            label: "ID interno",
          }),
          search.createColumn({
            name: "entity",
            join: "transaction",
            summary: "GROUP",
            label: "ID interno",
          }),
          search.createColumn({
            name: "custevent_ht_turno_creado_por",
            summary: "GROUP",
            label: "Creador",
          }),
        ],
      });

      const Search_taller = search.create({
        type: HT_ORDEN_TRABAJO_RECORD, //Orden de Trabajo Search - DEVELOPER
        filters: filter_Taller,
        columns: [
          search.createColumn({
            name: "internalid",
            join: "custrecord_ht_ot_orden_servicio",
            summary: "GROUP",
            label: "ID interno",
          }),
          search.createColumn({
            name: "internalid",
            join: "custrecord_ht_ot_cliente_id",
            summary: "GROUP",
            label: "Id cliente",
          }),
          search.createColumn({
            name: "custrecord_ht_pp_descripcion",
            join: "custrecord_ht_ot_tipo_trabajo",
            summary: "GROUP",
            label: "HT OT descripcion",
          }),
          search.createColumn({
            name: "name",
            join: "custrecord_ht_ot_vehiculo",
            summary: "GROUP",
            label: "Destino Nombre",
          }),
          search.createColumn({
            name: "altname",
            join: "custrecord_ht_ot_vehiculo",
            summary: "GROUP",
            label: "Destino Nombre",
          }),
          search.createColumn({
            name: "internalid",
            join: "custrecord_ht_ot_vehiculo",
            summary: "GROUP",
            label: "Destino id",
          }),
          search.createColumn({
            name: "custrecord_ht_ot_comentariofinalizacion",
            summary: "GROUP",
            label: "HT OT Comentario",
          }),
          search.createColumn({
            name: "location",
            join: "custrecord_ht_ot_orden_servicio",
            summary: "GROUP",
            label: "HT OT punto de Venta",
          }),
        ],
      });

      const consultaNro4 = search.create({
        type: "customrecord_ht_record_bienes",
        filters: consulta_nro4,
        columns: [
          search.createColumn({ name: "altname", label: "Destino Nombre" }),
          search.createColumn({ name: "name", label: "Nombre" }),
          search.createColumn({
            name: "custrecord_ht_bien_propietario",
            label: "Id cliente",
          }),
          search.createColumn({ name: "name" }),
          search.createColumn({ name: "internalid", label: "ID interno" })
        ],
      });

      const Search_vehiculo = search.create({
        type: HT_ORDEN_TRABAJO_RECORD,
        filters: filter_Vehiculo,
        columns: [
          search.createColumn({
            name: "altname",
            join: "CUSTRECORD_HT_OT_VEHICULO",
            label: "Destino Nombre",
          }),
          search.createColumn({
            name: "name",
            join: "CUSTRECORD_HT_OT_VEHICULO",
            label: "ID",
          }),
          search.createColumn({
            name: "internalid",
            join: "custrecord_ht_ot_cliente_id",
            label: "Id cliente",
          }),
        ],
      });

      const Search_cliente = search.create({
        type: "customer", //Orden de Trabajo Search - DEVELOPER
        filters: filter_Cliente,
        columns: [
          search.createColumn({
            name: "altname",
            summary: "GROUP",
            label: "Nombre Cliente",
          }),
          search.createColumn({
            name: "vatregnumber",
            summary: "GROUP",
            label: "ID Cliente",
          }),
          search.createColumn({
            name: "email",
            summary: "GROUP",
            label: "email Cliente",
          }),
          search.createColumn({
            name: "internalid",
            summary: "GROUP",
            label: "ID interno",
          }),
        ],
      });

      const Search_OrdServ = search.create({
        type: HT_ORDEN_TRABAJO_RECORD,
        filters: filter_OrdenServ,
        columns: [
          search.createColumn({
            name: "internalid",
            join: "CUSTRECORD_HT_OT_ORDEN_SERVICIO",
            label: "ID interno",
          }),
          search.createColumn({
            name: "custrecord_ht_ot_taller",
            label: "Taller",
          }),
        ],
      });

      if (tecnico_param == true) {
        let arr = [];
        let usuarioCreacion = "";
        let myPagedData = Search_tecnico.runPaged({ pageSize: 1000 });
        myPagedData.pageRanges.forEach((pageRange) => {
          let myPage = myPagedData.fetch({ index: pageRange.index });
          myPage.data.forEach((result) => {
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
            let cedula_creador =
              result.getValue(columns[12]) == "- None -"
                ? ""
                : result.getValue(columns[12]);
            let sql =
              "SELECT firstname, lastname FROM employee WHERE custentity_ec_numero_registro = ?";
            let params = [cedula_creador];
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults();
            if (results.length > 0) {
              usuarioCreacion =
                resultSet.asMappedResults()[0]["firstname"] +
                " " +
                resultSet.asMappedResults()[0]["lastname"];
            }

            if (codigo_taller == "- None -") {
              codigo_taller = "";
            }
            if (codigo_descripcion == "- None -") {
              codigo_descripcion = "";
            }

            let repetido = false;
            let arracuxi = [];
            if (internalID != "" && internalID != null) {
              for (let i = 0; i < arr.length; i++) {
                if (arr[i][0] == internalID) {
                  repetido = true;
                }
              }
              arracuxi = [internalID];
              if (repetido == false) {
                //Buscar
                if (ID_transac != "") {
                  var ordenServ = getBuscarOS(ID_transac);
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
                    ordenServicio: transaccion.split("#")[1],
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
        myPagedData.pageRanges.forEach((pageRange) => {
          let myPage = myPagedData.fetch({ index: pageRange.index });
          myPage.data.forEach((result) => {
            let ID_OV = result.getValue({
              name: "internalid",
              join: "custrecord_ht_ot_orden_servicio",
              summary: "GROUP",
              label: "Orden Servicio",
            });
            let TurnoDatos = getTurnoDatos(ID_OV, filtro_fecha);
            let Hora_Inicio = TurnoDatos[0];
            if (Hora_Inicio == null) {
              Hora_Inicio = "";
            }

            let idClient = result.getValue({
              name: "internalid",
              join: "custrecord_ht_ot_cliente_id",
              summary: "GROUP",
              label: "Id cliente",
            });

            let datosCliente = getClienteDatos(idClient);

            let id_destino = result.getValue({
              name: "internalid",
              join: "custrecord_ht_ot_vehiculo",
              summary: "GROUP",
              label: "Destino id",
            });
            let Destino_Nombre = result.getValue({
              name: "altname",
              join: "custrecord_ht_ot_vehiculo",
              summary: "GROUP",
              label: "Destino Nombre",
            });
            let vid = result.getValue({
              name: "name",
              join: "custrecord_ht_ot_vehiculo",
              summary: "GROUP",
              label: "Destino Nombre",
            });
            let Tipo_trabajo_descripcion = result.getValue({
              name: "custrecord_ht_pp_descripcion",
              join: "custrecord_ht_ot_tipo_trabajo",
              summary: "GROUP",
              label: "Tipo trabajo descripcion",
            });
            if (Tipo_trabajo_descripcion == "- None -") {
              Tipo_trabajo_descripcion = "";
            }
            let Comentario = result.getValue({
              name: "custrecord_ht_ot_comentariofinalizacion",
              summary: "GROUP",
              label: "Comentarios",
            });
            if (Comentario == "- None -") {
              Comentario = "";
            }
            let Fecha_Creacion = TurnoDatos[1];
            if (Fecha_Creacion == null) {
              Fecha_Creacion = "";
            }
            let Punto_Venta = result.getText({
              name: "location",
              join: "custrecord_ht_ot_orden_servicio",
              summary: "GROUP",
              label: "Punto Venta",
            });
            let id_Punto_Venta = result.getValue({
              name: "location",
              join: "custrecord_ht_ot_orden_servicio",
              summary: "GROUP",
              label: "Punto Venta",
            });

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
        myPagedData.pageRanges.forEach((pageRange) => {
          let myPage = myPagedData.fetch({ index: pageRange.index });
          myPage.data.forEach((result) => {
            let Nombre = result.getValue({
              name: "altname",
              summary: "GROUP",
              label: "Nombre Cliente",
            });
            let Cliente_ID = result.getValue({
              name: "vatregnumber",
              summary: "GROUP",
              label: "ID Cliente",
            });
            let Email = result.getValue({
              name: "email",
              summary: "GROUP",
              label: "email Cliente",
            });
            let id_Cliente = result.getValue({
              name: "internalid",
              summary: "GROUP",
              label: "ID interno",
            });

            jsonResult.push({
              nombre: Nombre,
              clienteId: Cliente_ID,
              email: Email,
              codigoCliente: id_Cliente,
            });
          });
        });
      } else if (vehiculo_param == true) {
        let myPagedData = Search_vehiculo.runPaged({ pageSize: 1000 });
        let arr = [];
        myPagedData.pageRanges.forEach((pageRange) => {
          let myPage = myPagedData.fetch({ index: pageRange.index });
          myPage.data.forEach((result) => {
            let Destino_Nombre = result.getValue({
              name: "altname",
              join: "CUSTRECORD_HT_OT_VEHICULO",
              label: "Nombre",
            });
            let Destino_ID = result.getValue({
              name: "name",
              join: "CUSTRECORD_HT_OT_VEHICULO",
              label: "ID",
            });
            let Cliente_ID = result.getValue({
              name: "internalid",
              join: "custrecord_ht_ot_cliente_id",
              label: "Id cliente",
            });
            let datosCliente = getClienteDatos(Cliente_ID);
            let repetido = false;
            let arracuxi = [];
            for (let i = 0; i < arr.length; i++) {
              if (arr[i][0] == Destino_Nombre && arr[i][1] == Destino_ID) {
                repetido = true;
              }
            }
            arracuxi = [Destino_Nombre, Destino_ID];
            if (repetido == false) {
              arr.push(arracuxi);
              jsonResult.push({
                propietarioBien: datosCliente[1],
                codigoPropietario: datosCliente[0],
                nrodocPropietario: datosCliente[2],
                destinoNombre: Destino_Nombre,
                destinoId: Destino_ID,
              });
            }
          });
        });
      } else if (OrdeServ_param == true) {
        let arr = [];
        let myPagedData = Search_OrdServ.runPaged({ pageSize: 1000 });
        //log.error('myPagedData', myPagedData);
        myPagedData.pageRanges.forEach((pageRange) => {
          let myPage = myPagedData.fetch({ index: pageRange.index });
          myPage.data.forEach((result) => {
            let columns = result.columns;
            let idOrdenServic = result.getValue(columns[0]);
            let Taller = result.getValue(columns[1]);

            let repetido = false;
            let arracuxi = [];

            if (idOrdenServic != "" && idOrdenServic != null) {
              for (let i = 0; i < arr.length; i++) {
                if (arr[i][0] == idOrdenServic) {
                  repetido = true;
                }
              }
              arracuxi = [idOrdenServic];
              if (repetido == false) {
                //Buscar
                if (idOrdenServic != "") {
                  // log.error('idOrdenServic', idOrdenServic);
                  // log.error('Taller', Taller);
                  var ordenServ = getBuscarOS(idOrdenServic);
                  //log.error('REQUEST', ordenServ);
                  let TurnoDatos = [];
                  arr.push(arracuxi);
                  if (Taller != "") {
                    TurnoDatos = getTurnoDatos(
                      idOrdenServic,
                      filtro_fecha,
                      fechaTurnoDesde,
                      fechaTurnoHasta
                    );
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
                        nrodocPropietario: ordenServ[10],
                      });
                    }
                  } else {
                    jsonResult.push({
                      idTurno: "",
                      codigoTurno3S: "",
                      fechaTurno: "",
                      idTaller: "",
                      codigoTaller: "",
                      descripcionTaller: "",
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
                      codigoUsuarioCreacion: "",
                      usuarioCreacion: "",
                      nrodocPropietario: ordenServ[10],
                    });
                  }
                }
              }
            }
          });
        });
      } else if (consultanro4_param == true) {
        let myPagedData = consultaNro4.runPaged({ pageSize: 1000 });
        let arr = [];
        myPagedData.pageRanges.forEach((pageRange) => {
          let myPage = myPagedData.fetch({ index: pageRange.index });
          myPage.data.forEach((result) => {
            let Destino_Nombre = result.getValue({
              name: "altname",
              label: "Nombre",
            });
            let Destino_ID = result.getValue({ name: "name", label: "ID" });
            let Cliente_ID = result.getValue({
              name: "custrecord_ht_bien_propietario",
              label: "Id cliente",
            });
            let Id_Vehiculo = result.getValue({ name: "name" });
            let internalid = result.getValue({ name: "internalid" });
            let datosCliente = getClienteDatos(Cliente_ID);
            let repetido = false;
            let arracuxi = [];
            for (let i = 0; i < arr.length; i++) {
              if (arr[i][0] == Destino_Nombre && arr[i][1] == Destino_ID) {
                repetido = true;
              }
            }
            arracuxi = [Destino_Nombre, Destino_ID, Id_Vehiculo];
            if (repetido == false) {
              arr.push(arracuxi);
              jsonResult.push({
                propietarioBien: datosCliente[1],
                codigoPropietario: datosCliente[0],
                nrodocPropietario: datosCliente[2],
                destinoNombre: Destino_Nombre,
                destinoId: Destino_ID,
                internalID: internalid
              });
            }
          });
        });
      }
      log.debug("jsonResult", jsonResult);
      return jsonResult;
    } catch (error) {
      log.error("Error-GET", error);
      return error;
    }
  };

  const _post = (scriptContext) => {
    try {
      log.debug("--Original--", scriptContext);
      scriptContext = condicionesScriptContext(scriptContext); // Validacion personalizadas (Intercept)
      log.debug("--Evaluado--", scriptContext);

      let recordTurno = crearTurno(scriptContext);
      log.debug("Informacion Guardada", recordTurno);
      return {
        turnoID: recordTurno,
        mensaje: "Exito",
      };
    } catch (error) {
      log.debug("Error-POST", error);
      return {
        turnoID: null,
        mensaje: error.message,
      };
    }
  };

  const _delete = (scriptContext) => {
    try {
      if (scriptContext.opcion != 100) { throw new Error("Opción no válida") }
      log.debug("Data_Delete", scriptContext);
      eliminarTurno(scriptContext.turnoID);
      return {
        turnoID: scriptContext.turnoID,
        mensaje: "Registro eliminado",
      };
    } catch (error) {
      log.debug("Error-DELETE", error.message);
      return {
        turnoID: scriptContext.turnoID,
        mensaje: error.message,
      };
    }
  };

  /*
      Funciones para las Peticion de tipo Get
      */
  const getTurnoDatos = (id, filtrofecha, fechaTurnoDesde, fechaTurnoHasta) => {
    try {
      log.error("filtrofecha", filtrofecha);
      if (filtrofecha == true) {
        filter = [
          ["transaction.internalid", "anyof", id],
          "AND",
          ["startdate", "within", fechaTurnoDesde, fechaTurnoHasta],
        ];
      } else {
        filter = ["transaction.internalid", "anyof", id];
      }
      log.error("filter", filter);
      var busqueda = search.create({
        type: "task",
        filters: [filter],
        columns: [
          "custevent_ht_tr_hora",
          "startdate",
          "title",
          "internalid",
          "custevent_ht_turno_taller",
          "custevent_ht_turno_taller.custrecord_ht_tt_codigo",
          "custevent_ht_turno_taller.custrecord_ht_tt_descripcion",
          "custevent_ht_turno_creado_por",
        ],
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
        if (result[7] != "") {
          result[8] = getUsuarioCreacion(result[7]);
        } else {
          result[8] = "";
        }
      }
      return result;
    } catch (e) {
      log.error("Error en getTurnoDatos", e);
    }
  };
  const getBuscarOS = (id) => {
    try {
      var salesorderSearchObj = search.create({
        type: "salesorder",
        filters: [
          ["type", "anyof", "SalesOrd"],
          "AND",
          ["internalid", "anyof", id],
          "AND",
          ["mainline", "is", "T"],
        ],
        columns: [
          search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" }),
          search.createColumn({
            name: "altname",
            join: "CUSTBODY_HT_SO_BIEN",
            label: "Nombre",
          }),
          search.createColumn({
            name: "formulatext",
            formula: "{location}",
            label: "Fórmula (texto)",
          }),
          search.createColumn({
            name: "internalid",
            join: "location",
            label: "ID location",
          }),
          search.createColumn({
            name: "altname",
            join: "customerMain",
            label: "Name",
          }),
          search.createColumn({ name: "tranid", label: "Num. Pedido" }),
          search.createColumn({ name: "memo", label: "Nota" }),
          search.createColumn({
            name: "custbody_ht_os_correocliente",
            label: "email",
          }),
          search.createColumn({
            name: "formulatext",
            formula: "{entity.id}",
            label: "Fórmula (texto)",
          }),
          search.createColumn({
            name: "internalid",
            join: "CUSTBODY_HT_SO_BIEN",
            label: "Nombre",
          }),
          search.createColumn({
            name: "formulatext",
            formula: "{entity}",
            label: "Fórmula (texto)",
          }),
        ],
      });
      var myPagedData = salesorderSearchObj.runPaged({ pageSize: 1000 });
      var respuesta = [];
      myPagedData.pageRanges.forEach((pageRange) => {
        let myPage = myPagedData.fetch({ index: pageRange.index });
        myPage.data.forEach((result) => {
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
          let nrodocPropietario = result
            .getValue(columns[10])
            .split(" ")[0]
            .split("-")[2];
          let arreglo = [
            codigo,
            nombre,
            Ubicacion,
            idUbicacion,
            cliente,
            numPedido,
            idcliente,
            nota,
            email,
            idbien,
            nrodocPropietario,
          ];
          respuesta = arreglo;
        });
      });
      //log.error('respuesta.length', respuesta.length)
      return respuesta;
    } catch (e) {
      log.error("Error en BuscarOS", e);
    }
  };
  const getUsuarioCreacion = (id) => {
    try {
      var busqueda = search.create({
        type: "employee",
        filters: [["custentity_ec_numero_registro", "is", id]],
        columns: ["altname"],
      });
      var savedsearch = busqueda.run().getRange(0, 1);
      var neme = "";
      if (savedsearch.length > 0) {
        neme = savedsearch[0].getValue(busqueda.columns[0]);
      }
      return neme;
    } catch (e) {
      log.error("Error en getUsuarioCreacion", e);
    }
  };
  const getBuscarCliente = (codigo) => {
    try {
      var customerSearchObj = search.create({
        type: "customer",
        filters: [["formulatext: {vatregnumber}", "startswith", codigo]],
        columns: [
          search.createColumn({ name: "internalid", label: "ID interno" }),
        ],
      });

      var arr = [];
      var myPagedData = customerSearchObj.runPaged({ pageSize: 1000 });
      myPagedData.pageRanges.forEach((pageRange) => {
        let myPage = myPagedData.fetch({ index: pageRange.index });
        myPage.data.forEach((result) => {
          let columns = result.columns;
          let id = result.getValue(columns[0]);
          arr.push(id);
          return true;
        });
      });

      return arr;
    } catch (e) {
      log.error("Error en BuscarCliente", e);
    }
  };
  const getClienteDatos = (id) => {
    try {
      var customerSearchObj = search.create({
        type: "customer",
        filters: [["internalid", "anyof", id]],
        columns: [
          search.createColumn({ name: "internalid", label: "ID interno" }),
          search.createColumn({ name: "isperson", label: "Tipo" }),
          search.createColumn({ name: "altname", label: "Nombre" }),
          search.createColumn({
            name: "companyname",
            label: "Nombre de la empresa",
          }),
          search.createColumn({
            name: "custentity_ec_document_type",
            label: "EC Tipo de Documento",
          }),
          search.createColumn({ name: "vatregnumber", label: "Cedula/RUC" }),
        ],
      });
      var savedsearch = customerSearchObj.run().getRange(0, 1);
      var arr = [];
      if (savedsearch.length > 0) {
        let nombre = "";
        idcustomer = savedsearch[0].getValue(customerSearchObj.columns[0]);
        tipoperson = savedsearch[0].getValue(customerSearchObj.columns[1]);
        altname = savedsearch[0].getValue(customerSearchObj.columns[2]);
        companyname = savedsearch[0].getValue(customerSearchObj.columns[3]);
        tipodoc = savedsearch[0].getValue(customerSearchObj.columns[4]);
        cedRuc = savedsearch[0].getValue(customerSearchObj.columns[5]);

        if (tipodoc == "1") {
          nombre = companyname;
        } else {
          nombre = altname;
        }
        arr = [idcustomer, nombre, cedRuc];
      }
      return arr;
    } catch (e) {
      log.error("Error en getClienteDatos", e);
    }
  };
  const esFechaValida = (fecha) => {
    let regex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!regex.test(fecha)) {
      return false;
    }

    let partes = fecha.split("/");
    let dia = parseInt(partes[0], 10);
    let mes = parseInt(partes[1], 10) - 1;
    let anio = parseInt(partes[2], 10);

    let dateObj = new Date(anio, mes, dia);
    if (
      dateObj.getFullYear() !== anio ||
      dateObj.getMonth() !== mes ||
      dateObj.getDate() !== dia
    ) {
      return false;
    } else {
      return true;
    }
  };

  /*
    Funciones para las Peticion de tipo Post
  */
  function condicionesScriptContext(scriptContext) {
    // Se asigna id del Codigo tecnico por defecto (Usuario que realiza la peticion).
    if (!scriptContext.codigoTecnico || scriptContext.codigoTecnico == "") {
      scriptContext.codigoTecnico = runtime.getCurrentUser().id;
    }
    // Se asigna el nombre del usuario que realiza la solicitud.
    scriptContext.usuarioCreacion =
      scriptContext?.usuarioCreacion == ""
        ? "Usuario no encontrado"
        : scriptContext.usuarioCreacion;

    // Se valida Json de entrada.
    scriptContext = validarCamposRequeridos(scriptContext);

    // Se valida Si el taller existe.
    scriptContext = validarTaller(scriptContext); //log.debug("Validacion de Taller",scriptContext);

    // Se valida el formato de la fecha y se realiza el cambio en la fecha para la consulta.
    scriptContext = validaFormatoFecha(scriptContext); //log.debug("Validacion de Fecha y Formato",scriptContext);

    // Se obtiene el id de la Orden de Servicio (Codigo Interno).
    scriptContext = obtenerOrdenServicio(scriptContext); //log.debug("Consulta y Validacion OS",scriptContext);

    // Se valida si la orden de trabajo pertenece a una orden de servicio.
    scriptContext = obtenerCantidadOS(scriptContext); //log.debug("Consulta Original (OS tiene una OT)",scriptContext);

    // Se valida si la orden de trabajo ya tiene un turno asignado por el dia.
    scriptContext = validarTurnoDiario(scriptContext); //log.debug("Validacion si el turno ya fue generado por dia",scriptContext);

    // Se valida si la orden de servicio cumple las condiciones para el insert.
    scriptContext = validarOrdenServicio(scriptContext); //log.debug("Validaciones adicionales",scriptContext);

    // Si cumple todas las validaciones se retorna el scriptContext.
    return scriptContext;
  }

  function validarCamposRequeridos(scriptContext) {
    const camposRequeridos = [
      //"ordenServicioSys",
      "customer",
      "fecha",
      "hora",
      "taller",
      "codigoTurno",
      "usuarioCreacion",
      "iDVehiculo"
    ];

    for (let campo of camposRequeridos) {
      if (!scriptContext[campo]) {
        log.debug(
          "Campo requerido no encontrado, validarCamposRequeridos",
          campo
        );
        log.debug("Validacion del Body de la peticion", scriptContext);
        throw new Error(`Falta el campo ${campo}`);
      }
    }

    return scriptContext;
  }

  function validarTaller(scriptContext) {
    //if (scriptContext.taller === "12") {
    //  log.debug(ERROR_TALLER_NO_VALIDO, scriptContext);
    //  throw new Error(ERROR_TALLER_NO_VALIDO);
    //}

    const sql = "SELECT id FROM customrecord_ht_tt_tallertablet where id = (?)";
    const info = query.runSuiteQL({
      query: sql,
      params: [scriptContext.taller],
    });

    if (info.asMappedResults()[0]) {
      return scriptContext;
    } else {
      log.debug(ERROR_TALLER_NO_VALIDO, scriptContext);
      throw new Error(ERROR_TALLER_NO_VALIDO);
    }
  }

  function validaFormatoFecha(scriptContext) {
    let dateString = scriptContext?.fecha;

    const parts = dateString.split("/");
    if (parts.length !== 3) {
      log.debug(`La fecha ${dateString} no es válida`, scriptContext);
      throw new Error(`La fecha ${dateString} no es válida`);
    }
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
      log.debug(`La fecha ${dateString} no es válida`, scriptContext);
      throw new Error(`La fecha ${dateString} no es válida`);
    }
    //scriptContext.fecha = `${day}/${month}/${year}`;
    scriptContext.fecha = `${month}/${day}/${year}`;

    return scriptContext;
  }

  function obtenerOrdenServicio(scriptContext) {
    const errorMsg = "No encuentra Orden de Servicio";

    if (scriptContext.ordenServicio) {
      return scriptContext;
    }

    if (!scriptContext.ordenServicioSys) {
      log.debug(errorMsg, scriptContext);
      throw new Error(errorMsg);
    }

    const ConsultaOS = obtenerInfOSID(scriptContext.ordenServicioSys);


    if (ConsultaOS?.entityid != scriptContext.customer) {
      log.debug(errorMsg, scriptContext);
      throw new Error(
        "Los datos de la orden de servicio no coinciden con el cliente"
      );
    }

    let DataUsuarioVehiculos = buscarPorCodigoClienteVehiculo(
      scriptContext.customer
    );
    let ExisteVehiculoOrdenServcio = ValidarcodigoVehiculo(
      DataUsuarioVehiculos,
      scriptContext.iDVehiculo,
      ConsultaOS.bien
    );

    if (!ExisteVehiculoOrdenServcio) {
      log.debug(errorMsg, scriptContext);
      throw new Error("El vehiculo no pertenece a la Orden del servicio");
    }

    if (ConsultaOS?.numPedido) {
      scriptContext.ordenServicio = ConsultaOS?.internalidDoc;
      return scriptContext;
    }

    log.debug(errorMsg, scriptContext);
    throw new Error(errorMsg);
  }

  function obtenerCantidadOS(scriptContext) {
    const condicion = scriptContext.ordenServicio;
    const sql =
      "SELECT COUNT(*) as cantidad FROM customrecord_ht_record_ordentrabajo ot " +
      "INNER JOIN transaction so ON ot.custrecord_ht_ot_orden_servicio = so.id " +
      "WHERE ot.custrecord_ht_ot_orden_servicio = ?";
    const inf = query
      .runSuiteQL({
        query: sql,
        params: [condicion],
      })
      .asMappedResults()[0]["cantidad"];

    if (inf > 0) {
      return scriptContext;
    }

    const errorMsg = ERROR_ORDEN_SERVICIO + " " + scriptContext?.ordenServicio;
    log.debug(errorMsg, scriptContext);
    throw new Error(errorMsg);
  }

  function validarTurnoDiario(scriptContext) {
    let transactionId = scriptContext?.ordenServicio;
    let fecha = scriptContext?.fecha;

    let newfecha = fecha.split("/");
    newfecha = newfecha[1] + "/" + newfecha[0] + "/" + newfecha[2];

    //log.debug("transactionId---", transactionId);
    //log.debug("fecha---", fecha);
    //log.debug("newfecha---", newfecha);
    const sql =
      "SELECT COUNT(*) as cantidad FROM TASK WHERE transaction = ? AND TO_DATE(startdate) = (?)";
    const info = query.runSuiteQL({
      query: sql,
      params: [transactionId, newfecha],
    });

    //log.debug("info---cantidad", info);
    let cantidad = info.asMappedResults()[0]["cantidad"];

    //log.debug("cantidad---", cantidad);
    const errorMsg = `La orden de servicio ya tiene un turno asignado el dia ${newfecha}`;

    if (cantidad >= 1) {
      log.debug(errorMsg, scriptContext);
      throw new Error(errorMsg);
    }

    return scriptContext;
  }

  function validarOrdenServicio(scriptContext) {
    if (scriptContext.ordenServicio) {
      return scriptContext;
    }


    const data = obtenerInfOSID(scriptContext.ordenServicioSys);
    //log.debug("-----------------", data);
    if (!data) {
      log.debug(
        "No se pudo obtener información con el ID proporcionado",
        scriptContext
      );
      throw new Error("No se pudo obtener información con el ID proporcionado");
    }

    switch (data.status) {
      case "Cancelada":
        log.debug("Estado es Cancelada", scriptContext);
        throw new Error("Estado es Cancelada");
      case "Cerrada":
        log.debug("Estado es Cerrada", scriptContext);
        throw new Error("Estado es Cerrada");
    }

    log.debug("HT OS TRABAJADO", data.ht_OS_TRABAJADO);

    if (data.ht_OS_TRABAJADO !== "N") {
      log.debug("HT OS TRABAJADO (S)", scriptContext);
      throw new Error("HT OS TRABAJADO (S)");
    }

    if (data.HT_OS_APROBACIÓN_VENTA !== "APROBADO") {
      log.debug("Aprobación de venta no APROBADO", scriptContext);
      throw new Error("Aprobación de venta no APROBADO");
    }

    // log.debug("Aprobación de venta es APROBADO");
    return scriptContext;
  }

  function buscarPorCodigoClienteVehiculo(IdIdentificacion) {
    try {
      let Busqueda = search.create({
        type: "customrecord_ht_record_bienes",
        filters: [
          ["custrecord_ht_bien_propietario", "anyof", IdIdentificacion],
        ],
        columns: [
          search.createColumn({ name: "altname", label: "Destino Nombre" }),
          search.createColumn({ name: "name", label: "Nombre" }),
          search.createColumn({
            name: "custrecord_ht_bien_propietario",
            label: "Id cliente",
          }),
          search.createColumn({ name: "name" }),
          search.createColumn({ name: "internalid", label: "ID interno" })
        ],
      });

      let ResultadoConsulta = Busqueda.runPaged({ pageSize: 1000 });
      let ObjResultado = [];
      let arr = [];

      ResultadoConsulta.pageRanges.forEach((pageRange) => {
        let myPage = ResultadoConsulta.fetch({ index: pageRange.index });
        myPage.data.forEach((ResConsulta) => {
          let Destino_Nombre = ResConsulta.getValue({
            name: "altname",
            label: "Nombre",
          });
          let Destino_ID = ResConsulta.getValue({ name: "name", label: "ID" });
          let Cliente_ID = ResConsulta.getValue({
            name: "custrecord_ht_bien_propietario",
            label: "Id cliente",
          });
          let Id_Vehiculo = ResConsulta.getValue({ name: "name" });
          let internalid = ResConsulta.getValue({ name: "internalid" });

          let datosCliente = getClienteDatos(Cliente_ID);
          let repetido = false;
          let arracuxi = [];
          for (let i = 0; i < arr.length; i++) {
            if (arr[i][0] == Destino_Nombre && arr[i][1] == Destino_ID) {
              repetido = true;
            }
          }
          arracuxi = [Destino_Nombre, Destino_ID, Id_Vehiculo];
          if (repetido == false) {
            arr.push(arracuxi);
            ObjResultado.push({
              propietarioBien: datosCliente[1],
              codigoPropietario: datosCliente[0],
              nrodocPropietario: datosCliente[2],
              destinoNombre: Destino_Nombre,
              destinoId: Destino_ID,
              internalID: internalid,
            });
          }
        });
      });

      if (ObjResultado.length > 0) {
        return ObjResultado;
      } else {
        return false;
      }
    } catch (e) {
      log.error("buscarPorCodigoClienteVehiculo", e);
      return false;
    }
  }

  function ValidarcodigoVehiculo(data, codigoVehiculo, IdBienOrdenServicio) {

    if (codigoVehiculo == "" || codigoVehiculo == null) {
      return false;
    }

    for (let i = 0; i < data.length; i++) {
      if (data[i].internalID == codigoVehiculo) {
        if (codigoVehiculo == IdBienOrdenServicio) {
          return true;
        }
      }
    }
    return false;
  }

  const obtenerInfOSID = (ordenServicioSys) => {
    try {
      let Busqueda = search.create({
        type: "salesorder",
        filters: [
          ["type", "anyof", "SalesOrd"],
          "AND",
          ["tranid", "anyof", ordenServicioSys],
          "AND",
          ["mainline", "is", "T"],
        ],
        columns: [
          search.createColumn({ name: "custbody_ht_so_bien" }),
          search.createColumn({
            name: "altname",
            join: "CUSTBODY_HT_SO_BIEN",
            label: "Nombre",
          }),
          search.createColumn({
            name: "formulatext",
            formula: "{location}",
            label: "Fórmula (texto)",
          }),
          search.createColumn({
            name: "internalid",
            join: "location",
            label: "ID location",
          }),
          search.createColumn({
            name: "altname",
            join: "customerMain",
            label: "Name",
          }),
          search.createColumn({ name: "tranid" }),
          search.createColumn({ name: "memo" }),
          search.createColumn({
            name: "custbody_ht_os_correocliente",
            label: "email",
          }),
          search.createColumn({
            name: "formulatext",
            formula: "{entity.id}",
          }),
          search.createColumn({
            name: "internalid",
            join: "CUSTBODY_HT_SO_BIEN",
          }),
          search.createColumn({
            name: "formulatext",
            formula: "{entity}",
          }),
          search.createColumn({ name: "internalid" }),
          search.createColumn({ name: "custbody_ht_os_aprobacionventa" }),
          search.createColumn({ name: "custbody_ht_os_aprobacioncartera" }),
          search.createColumn({ name: "status" }),
          search.createColumn({ name: "statusRef" }),
          search.createColumn({ name: "custbody_ht_os_trabajado" }),
          //tranid
          search.createColumn({ name: "tranid" }),
          // entity
          search.createColumn({ name: "entity" }),
          // custbody_ht_os_identificacioncliente
          search.createColumn({ name: "custbody_ht_os_identificacioncliente" }),
        ],
      });
      let ObjResultado = [];
      let ResultadoConsulta = Busqueda.run();

      ResultadoConsulta.each(function (ResConsulta) {
        let bien = ResConsulta.getValue({ name: "custbody_ht_so_bien" });
        let nombre = ResConsulta.getValue({
          name: "altname",
          join: "CUSTBODY_HT_SO_BIEN",
        });
        let location = ResConsulta.getValue({ name: "formulatext" });
        let idlocation = ResConsulta.getValue({
          name: "internalid",
          join: "location",
        });
        let name = ResConsulta.getValue({
          name: "altname",
          join: "customerMain",
        });
        let numPedido = ResConsulta.getValue({ name: "tranid" });
        let nota = ResConsulta.getValue({ name: "memo" });
        let email = ResConsulta.getValue({
          name: "custbody_ht_os_correocliente",
        });
        let entityid = ResConsulta.getValue({ name: "entity" });
        let internalid = ResConsulta.getValue({
          name: "internalid",
          join: "CUSTBODY_HT_SO_BIEN",
        });
        let entity = ResConsulta.getValue({ name: "formulatext" });
        let tranid = ResConsulta.getValue({ name: "tranid" });
        let HT_OS_APROBACIÓN_VENTA = ResConsulta.getText({
          name: "custbody_ht_os_aprobacionventa",
        });
        let HT_OS_APROBACIÓN_CARTERA = ResConsulta.getText({
          name: "custbody_ht_os_aprobacioncartera",
        });
        let status = ResConsulta.getText({ name: "status" });
        let statusRef = ResConsulta.getValue({ name: "statusRef" });
        let internalidDoc = ResConsulta.getValue({ name: "internalid" });
        let ht_OS_TRABAJADO = ResConsulta.getValue({
          name: "custbody_ht_os_trabajado",
        });
        let IdIdentificacion = ResConsulta.getValue({
          name: "custbody_ht_os_identificacioncliente",
        });

        ObjResultado.push({
          bien: bien,
          nombre: nombre,
          location: location,
          idlocation: idlocation,
          name: name,
          numPedido: numPedido,
          nota: nota,
          email: email,
          entityid: entityid,
          internalid: internalid,
          entity: entity,
          tranid: tranid,
          HT_OS_APROBACIÓN_VENTA: HT_OS_APROBACIÓN_VENTA,
          HT_OS_APROBACIÓN_CARTERA: HT_OS_APROBACIÓN_CARTERA,
          status: status,
          statusRef: statusRef,
          internalidDoc: internalidDoc,
          ht_OS_TRABAJADO: ht_OS_TRABAJADO,
          IdIdentificacion: IdIdentificacion,
        });

        return true;
      });

      if (ObjResultado.length > 0) {
        return ObjResultado[0];
      } else {
        return false;
      }
    } catch (e) {
      log.error("ObtenerInfOS", e);
      return false;
    }
  };

  const crearTurno = (scriptContext) => {
    try {
      let turno = record.create({ type: record.Type.TASK });
      turno.setValue({
        fieldId: "title",
        value: scriptContext.codigoTurno,
      });
      turno.setValue({
        fieldId: "assigned",
        value: scriptContext.codigoTecnico,
      });
      turno.setValue({
        fieldId: "startdate",
        value: new Date(scriptContext.fecha),
      });
      turno.setValue({
        fieldId: "custevent_ht_tr_hora",
        value: new Date(scriptContext.hora),
      });
      turno.setValue({
        fieldId: "custevent_ht_turno_taller",
        value: scriptContext.taller,
      });
      turno.setValue({
        fieldId: "company",
        value: scriptContext.customer,
      });
      turno.setValue({
        fieldId: "transaction",
        value: scriptContext.ordenServicio,
      });
      turno.setValue({
        fieldId: "custevent_ht_turno_creado_por",
        value: scriptContext.usuarioCreacion,
      });

      return turno.save();
    } catch (error) {
      throw new Error("Error al guardar el turno");
    }
  };

  /*
    Funciones para las Peticion de tipo Delete
    */
  const eliminarTurno = (id) => {
    if (VerificarEstadoTarea(id)) {
      record.delete({ type: record.Type.TASK, id: id });
    }
  };

  function VerificarEstadoTarea(iDTurno) {
    let taskRecord = null;
    taskRecord = record.load({ type: record.Type.TASK, id: iDTurno });

    if (!taskRecord) {
      log.debug("La orden de servicio no se encuentra", iDTurno);
      throw new Error("No se encuentra el registro");
    }

    if (taskRecord.getValue({ fieldId: "status" }) === "COMPLETE") {
      log.debug("Estado de la orden de servicio es COMPLETE", iDTurno);
      throw new Error(
        "No se puede eliminar el turno, la orden de servicio esta completa"
      );
    }

    return true;
  }

  return {
    get: _get,
    post: _post,
    delete: _delete,
  };
});
