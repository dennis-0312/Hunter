/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

define([
  "N/log",
  "N/search",
  "N/record",
  "N/query",
  "N/url",
  "N/runtime",
  "N/https",
], function (log, search, record, query, url, runtime, https) {
  /**
   * TODO: Funciones auxiliares.
   */
  function respuestaGlobales(opcion) {
    const responses = {
      1: {
        results: [],
        status: "ERROR",
        message: "Error al procesar la solicitud.",
      },
    };
    return responses[opcion] || null;
  }

  function createColumn(name, join = null, summary = null, label, sort) {
    const columnConfig = { name, join, summary, label };
    if (sort === "ASC") columnConfig.sort = "ASC";
    return search.createColumn(columnConfig);
  }

  function getValueOrEmpty(result, column) {
    const value = result.getValue(column);
    return value === "- None -" ? "" : value;
  }

  function getTextOrEmpty(result, column) {
    const value = result.getText(column);
    return value === "- None -" ? "" : value;
  }

  function establecerSiexisteValor(objRecord, fieldId, value) {
    if (value !== undefined && value !== null) {
      objRecord.setValue({ fieldId, value });
    }
  }

  /**
   *  TODO: Busquedas
   */
  const obtenerOrdenesdeTrabajoXordenServicio = (os, item, bien) => {
    try {
      const filter = [
        ["custrecord_ht_ot_orden_servicio.class", "noneof", "@NONE@"],
        "AND",
        ["custrecord_ht_ot_orden_servicio.department", "noneof", "@NONE@"],
      ];

      os
        ? filter.push("AND", ["custrecord_ht_ot_orden_servicio", "anyof", os])
        : null;
      item
        ? filter.push("AND", ["custrecord_ht_ot_item", "anyof", item])
        : null;
      bien
        ? filter.push("AND", ["custrecord_ht_ot_vehiculo", "anyof", bien])
        : null;

      const mySearch = search.create({
        type: "customrecord_ht_record_ordentrabajo",
        filters: filter,
        columns: [
          createColumn("internalid", null, "GROUP", "Internal ID"),
          createColumn("custrecord_ht_ot_estado", null, "GROUP", "Estado OT"),
          createColumn("custrecord_ht_ot_modelobien", null, "GROUP", "Modelo bien"),
          createColumn("name", null, "GROUP", "Name"),
          createColumn("custrecord_ht_ot_item", null, "GROUP", "Item"),
          createColumn("custrecord_ht_ot_vehiculo", null, "GROUP", "Vehiculo"),
          createColumn("custrecord_ht_ot_serieproductoasignacion", null, "GROUP", "Serie Producto Asignacion"),
          createColumn("custrecord_ht_ot_modelo", null, "GROUP", "Modelo"),
          createColumn("custrecord_ht_ot_unidad", null, "GROUP", "Unidad"),
          createColumn("custrecord_ht_ot_vid", null, "GROUP", "VID"),
        ],
      });

      let results = [];

      let myPagedData = mySearch.runPaged();
      myPagedData.pageRanges.forEach(function (pageRange) {
        let myPage = myPagedData.fetch({ index: pageRange.index });
        myPage.data.forEach(function (result) {

          let itemfamilia = obtenerParametrizacionItem(
            result.getValue({
              name: "custrecord_ht_ot_item",
              summary: search.Summary.GROUP,
            }),
            //[75]
            [107]
          );

          results.push({
            id: getValueOrEmpty(result, { name: "internalid", summary: search.Summary.GROUP }),
            estado: getValueOrEmpty(result, { name: "custrecord_ht_ot_estado", summary: search.Summary.GROUP }),
            estadoText: getTextOrEmpty(result, { name: "custrecord_ht_ot_estado", summary: search.Summary.GROUP }),
            name: getValueOrEmpty(result, { name: "name", summary: search.Summary.GROUP }),
            item: getValueOrEmpty(result, { name: "custrecord_ht_ot_item", summary: search.Summary.GROUP }),
            vehiculo: getValueOrEmpty(result, { name: "custrecord_ht_ot_vehiculo", summary: search.Summary.GROUP }),
            modeloBien: getValueOrEmpty(result, { name: "custrecord_ht_ot_modelobien", summary: search.Summary.GROUP }),
            serieProductoAsignacion: getValueOrEmpty(result, { name: "custrecord_ht_ot_serieproductoasignacion", summary: search.Summary.GROUP }),
            modelo: getValueOrEmpty(result, { name: "custrecord_ht_ot_modelo", summary: search.Summary.GROUP }),
            unidad: getValueOrEmpty(result, { name: "custrecord_ht_ot_unidad", summary: search.Summary.GROUP }),
            vid: getValueOrEmpty(result, { name: "custrecord_ht_ot_vid", summary: search.Summary.GROUP }),
            itemfamilia: itemfamilia[0]?.Valor || "",
          });
        });
      });

      return results;
    } catch (e) {
      log.error("Error en ObtenerOrdenTrabajo", e);
      return [];
    }
  };

  const obtenerParametrizacionItem = (items, busquedaParametro) => {
    try {
      let data = [];
      let parametrosOpcionales;

      let filtro = [
        //["custrecord_ht_pp_aplicacion", "is", "T"], // Solo aplicaciones , Preguntar
        //"AND",
        ["custrecord_ht_pp_parametrizacionid", "anyof", items],
      ];

      if (busquedaParametro !== undefined) {
        parametrosOpcionales = busquedaParametro?.toString();
        filtro.push("AND", [
          "custrecord_ht_pp_parametrizacion_rela",
          "anyof",
          parametrosOpcionales.split(","),
        ]);
      }

      let busqueda = search.create({
        type: "customrecord_ht_pp_main_param_prod",
        filters: filtro,
        columns: [
          search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Param" }),
          search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" }),
          search.createColumn({ name: "custrecord_ht_pp_code", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_RELA", label: "Código" }),
          search.createColumn({ name: "custrecord_ht_pp_codigo", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_VALOR", label: "Código" }),
        ],
      });

      let resultCount = busqueda.runPaged().count;

      if (resultCount > 0) {
        let pageData = busqueda.runPaged({ pageSize: 1000 });
        pageData.pageRanges.forEach((pageRange) => {
          let page = pageData.fetch({ index: pageRange.index });
          page.data.forEach((result) => {
            let columns = result.columns;
            let parametrizacion = {
              Param: result.getValue(columns[2]) || "",
              ParamId: result.getValue(columns[0]) || "",
              Valor: result.getValue(columns[3]) || "",
              ValorText: result.getText(columns[1]) || "",
              ValorId: result.getValue(columns[1]) || "",
            };
            data.push(parametrizacion);
          });
        });
      }

      return data;
    } catch (error) {
      log.error("Error en obtenerParametrizacionItem", error);
      return [];
    }
  };

  const esItemServicio = (id) => {
    try {
      const busqueda = search.create({
        type: "serviceitem",
        filters: [
          ["type", "anyof", "Service"],
          "AND",
          ["unitstype", "anyof", "2"], // 2 = Servicio
          "AND",
          ["internalid", "anyof", id],
        ],
        columns: [{ name: "internalid", label: "Internal ID" }],
      });

      const savedsearch = busqueda.run().getRange({ start: 0, end: 1 });
      return savedsearch.length > 0 ? 1 : "";
    } catch (e) {
      log.error("Error en getRepresentante", e);
      return "";
    }
  };

  const obtenerItemParametrizadoPorBien = (IdOs, IdVehiculo) => {
    let results = [];

    try {
      let serviceOrderSearch = search.create({
        type: search.Type.SALES_ORDER,
        filters: [
          ["internalid", "is", IdOs],
          "AND",
          ["subsidiary", "anyof", "2"], // Subsidiaria.
          "AND",
          ["item.internalid", "noneof", "@NONE@"],
          "AND",
          ["custbody_ht_so_bien", "anyof", IdVehiculo],
          "AND",
          // TaxItem
          ["item.type", "noneof", "TaxItem"],
        ],
        columns: [
          search.createColumn({ name: "internalid" }),
          search.createColumn({ name: "item" }),
          search.createColumn({ name: "custcol_ht_os_und_tiempo_cobertura" }),
          search.createColumn({ name: "custcol_ht_os_tiempo_cobertura" }),
          search.createColumn({ name: "rate" }),
          search.createColumn({ name: "displayname", join: "item" }),
          search.createColumn({ name: "internalid", join: "item" }),
          search.createColumn({ name: "type", join: "item" }),
          search.createColumn({ name: "custbody_ht_so_bien" }),
        ],
      });

      let searchResult = serviceOrderSearch.runPaged();

      searchResult.pageRanges.forEach(function (pageRange) {
        let myPage = searchResult.fetch({ index: pageRange.index });

        myPage.data.forEach(function (result) {
          let infoparametros = "";
          item = result.getValue({ name: "item" });
          infoparametros = obtenerParametrizacionItem(
            item,
            // [7, 2, 6, 75, 34, 36]
            [113, 104, 118, 107, 109, 153]
          );

          results.push({
            internalidOs: result.getValue({ name: "internalid" }),
            iditem: item,
            TipoPlazo: result.getValue({ name: "custcol_ht_os_und_tiempo_cobertura" }),
            Plazo: result.getValue({ name: "custcol_ht_os_tiempo_cobertura" }),
            infoparametros: infoparametros,
            price: result.getValue({ name: "rate" }),
            displayname: result.getValue({ name: "displayname", join: "item" }),
            internalidItem: result.getValue({ name: "internalid", join: "item" }),
            type: result.getValue({ name: "type", join: "item" }),
            bien: result.getValue({ name: "custbody_ht_so_bien" }),
          });
        });
      });


      // Clasificar items
      if (results.length > 0) {
        let clasificacion = ClasificarItems(results);
        return clasificacion;
      }

      return [];
    } catch (error) {
      log.debug("error", error);
      return [];
    }
  };

  const obtenerItemParametrizadoPorBien_V2 = (IdOs, IdVehiculo, Empresa, FechaOs) => {
    let results = [];

    let Filtro = [["item.internalid", "noneof", "@NONE@"], "AND", ["item.type", "noneof", "TaxItem"], "AND", ["subsidiary", "anyof", Empresa]];

    log.debug("Filtro", Filtro);

    if (IdOs) {
      Filtro.push("AND");
      Filtro.push(["internalid", "is", IdOs]);
    }

    if (IdVehiculo) {
      Filtro.push("AND");
      Filtro.push(["custbody_ht_so_bien", "anyof", IdVehiculo]);
    }

    if (FechaOs) {
      Filtro.push("AND");
      Filtro.push(["trandate", "onorafter", FechaOs]);
    }

    log.debug("Filtro", Filtro);

    try {
      let serviceOrderSearch = search.create({
        type: search.Type.SALES_ORDER,
        filters: Filtro,
        columns: [
          search.createColumn({ name: "internalid" }),
          search.createColumn({ name: "item" }),
          search.createColumn({ name: "rate" }),
          search.createColumn({ name: "trandate" }),
          search.createColumn({ name: "custcol_ht_os_und_tiempo_cobertura" }),
          search.createColumn({ name: "custcol_ht_os_tiempo_cobertura" }),
          search.createColumn({ name: "displayname", join: "item" }),
          search.createColumn({ name: "internalid", join: "item" }),
          search.createColumn({ name: "type", join: "item" }),
          search.createColumn({ name: "custbody_ht_so_bien" }),
        ],
      });

      let searchResult = serviceOrderSearch.runPaged();

      searchResult.pageRanges.forEach(function (pageRange) {
        let myPage = searchResult.fetch({ index: pageRange.index });

        myPage.data.forEach(function (result) {
          let infoparametros = "";
          item = result.getValue({ name: "item" });
          infoparametros = obtenerParametrizacionItem(
            item,
            // [7, 2, 6, 75, 34, 36]
            [113, 104, 118, 107, 109, 153]
          );

          results.push({
            internalidOs: result.getValue({ name: "internalid" }),
            fechaOs: result.getValue({ name: "trandate" }),
            TipoPlazo: result.getText({ name: "custcol_ht_os_und_tiempo_cobertura" }),
            Plazo: result.getValue({ name: "custcol_ht_os_tiempo_cobertura" }),
            iditem: item,
            infoparametros: infoparametros,
            price: result.getValue({ name: "rate" }),
            displayname: result.getValue({ name: "displayname", join: "item" }),
            internalidItem: result.getValue({ name: "internalid", join: "item" }),
            type: result.getValue({ name: "type", join: "item" }),
            bien: result.getValue({ name: "custbody_ht_so_bien" }),
          });
        });
      });

      log.debug("results: ", results);


      // Clasificar items
      if (results.length > 0) {
        let clasificacion = ClasificarItems_V2(results);
        return clasificacion;
      }

      return [];
    } catch (error) {
      log.debug("error", error);
      return [];
    }
  };

  const obtenerInformacionItemOs = (idOS, itemId, ttr) => {
    try {
      // Crear una búsqueda para obtener los datos del registro de la orden de venta
      let searchResult = search.create({
        type: "salesorder",
        filters: [
          ["internalid", "is", idOS],
          "AND",
          ["item.internalid", "is", itemId]
        ],
        columns: [
          "entity",
          "item",
          "custcol_ht_os_cliente",
          "custcol_ht_os_cliente_monitoreo",
          "custcol_ht_os_tiempo_cobertura",
          "custcol_ht_os_und_tiempo_cobertura"
        ]
      }).run().getRange({ start: 0, end: 1 });

      if (searchResult.length > 0) {
        let result = searchResult[0];
        let cliente = result.getValue({ name: "entity" });
        let items = result.getValue({ name: "item" });
        let clienteItem = result.getValue({ name: "custcol_ht_os_cliente" });
        let monitoreo = result.getValue({ name: "custcol_ht_os_cliente_monitoreo" });
        let quantity = parseInt(result.getValue({ name: "custcol_ht_os_tiempo_cobertura" })) || 0;
        let unidadTiempo = result.getValue({ name: "custcol_ht_os_und_tiempo_cobertura" }) || 0;
        let itemMeses = esItemServicio(items);

        return {
          cliente,
          clienteItem,
          items,
          monitoreo,
          quantity,
          unidadTiempo,
          itemMeses,
          idOS,
          ttr
        };
      } else {
        log.debug("Item no encontrado", `El item con ID ${itemId} no se encontró en la orden de venta con ID ${idOS}.`);
        return null;
      }
    } catch (e) {
      log.error("Error al obtener la información del item", e);
      return null;
    }
  };

  const obtenerNombreOS = (id) => {
    try {
      const salesorderSearchObj = search.create({
        type: "salesorder",
        filters: [
          ["type", "anyof", "SalesOrd"],
          "AND",
          ["internalid", "anyof", id],
          "AND",
          ["mainline", "is", "T"],
        ],
        columns: [
          { name: "internalid" },
          { name: "tranid", label: "Num. Pedido" },
          { name: "trandate", label: "Fecha de la transacción" },
        ],
      });

      const searchResult = salesorderSearchObj
        .run()
        .getRange({ start: 0, end: 1 });

      if (searchResult.length > 0) {
        let resultado = {
          tranid: searchResult[0].getValue({ name: "tranid", label: "Num. Pedido" }),
          trandate: searchResult[0].getValue({ name: "trandate", label: "Fecha de la transacción" }),
        };

        return resultado;
      } else {
        return {}; // No se encontró la orden de servicio
      }
    } catch (e) {
      log.error("Error en BuscarOS", e);
      return {};
    }
  };

  // const obtenerTodasFamiliasProducto = () => {
  //   try {
  //     var sqlQuery = `
  //               SELECT DISTINCT val.id, val.custrecord_ht_pp_codigo, val.custrecord_ht_pp_descripcion
  //               FROM	customrecord_ht_pp_main_param_prod rel, 
  //                     CUSTOMRECORD_HT_CR_PARAMETRIZACION_PRODU param, 
  //                     MAP_customrecord_ht_pp_main_param_prod_custrecord_ht_pp_parametrizacion_valor mp, 
  //                     CUSTOMRECORD_HT_CR_PP_VALORES val 
  //               WHERE rel.custrecord_ht_pp_parametrizacion_rela = param.id 
  //               AND rel.id = mp.mapone 
  //               AND mp.maptwo = val.id 
  //               AND rel.isinactive = 'F' 
  //               AND param.isinactive = 'F'
  //               AND param.custrecord_ht_pp_code = 'FAM'
  //         `;

  //     var resultSet = query.runSuiteQL({
  //       query: sqlQuery,
  //     });

  //     const result = resultSet
  //       .asMappedResults()
  //       .map((item) => item.custrecord_ht_pp_codigo)
  //       .filter((codigo) => codigo !== null);

  //     // log.debug('Results', result);
  //     return result;
  //   } catch (error) {
  //     log.error("Error obtenerTodasFamiliasProducto", error);
  //     return [];
  //   }
  // };

  const obtenerTodasFamiliasProducto = () => {
    try {
      var sqlQuery = `
      SELECT DISTINCT
          SUBSTR(BUILTIN.DF(custrecord_ht_pp_parametrizacion_valor), 1, 2) AS "cccc"
      FROM
          customrecord_ht_pp_main_param_prod
      WHERE
          custrecord_ht_pp_parametrizacion_rela = '107'
      `;

      var resultSet = query.runSuiteQL({
        query: sqlQuery,
      });

      const result = resultSet
        .asMappedResults()
        .map((item) => item.cccc)
        .filter((codigo) => codigo !== null);

      //log.debug('Results', result);
      return result;

    } catch (error) {
      log.error("Error obtenerTodasFamiliasProducto", error);
      return [];
    }
  };

  const obtenerCoberturaVehiculoFamilia = (idBien, idfamilia) => {
    try {
      let mySearch = search.create({
        type: "customrecord_ht_co_cobertura",
        filters: [
          ["custrecord_ht_co_bien", "anyof", idBien],
          "AND",
          ["custrecord_ht_co_familia_prod", "anyof", idfamilia],
          // "AND",
          // ["custrecord_ht_co_estado_cobertura", "anyof", "1", "2"] //ACTIVO o SUSPENDIDO
        ],
        columns: [
          search.createColumn({ name: "internalid" }),
          search.createColumn({ name: "custrecord_ht_co_producto" }),
          search.createColumn({ name: "custrecord_ht_co_coberturainicial" }),
          search.createColumn({ name: "custrecord_ht_co_coberturafinal" }),
          search.createColumn({ name: "custrecord_ht_co_numeroserieproducto" }),
          search.createColumn({ name: "custrecord_ht_co_plazo" }),
          search.createColumn({ name: "custrecord_ht_co_estado_cobertura" }),
        ],
      });

      let results = [];

      let myPagedData = mySearch.runPaged();
      myPagedData.pageRanges.forEach(function (pageRange) {
        let myPage = myPagedData.fetch({ index: pageRange.index });
        myPage.data.forEach(function (result) {
          results.push({
            id: result.getValue({ name: "internalid" }),
            producto: result.getValue({ name: "custrecord_ht_co_producto" }),
            coberturaInicial: result.getValue({ name: "custrecord_ht_co_coberturainicial" }),
            coberturaFinal: result.getValue({ name: "custrecord_ht_co_coberturafinal" }),
            numeroSerie: result.getValue({ name: "custrecord_ht_co_numeroserieproducto" }),
            plazo: result.getValue({ name: "custrecord_ht_co_plazo" }),
            estadoCobertura: result.getValue({ name: "custrecord_ht_co_estado_cobertura" }),
          });
        });
      });

      return results[0];
    } catch (e) {
      log.error("Error en getCoberturaItem", e);
      return [];
    }
  };

  const validarExistenciaEnsamblajeParaOT = (OrdenTrabajoID) => {
    if (!OrdenTrabajoID) {
      return false;
    }

    // Consulta SQL para contar el número de ensamblajes asociados a la orden de trabajo
    let sql =
      "SELECT COUNT(*) as cantidad FROM transaction WHERE custbody_ht_ce_ordentrabajo = ? AND recordtype = 'assemblybuild'";
    let resultSet = query.runSuiteQL({ query: sql, params: [OrdenTrabajoID] });
    let results = resultSet.asMappedResults();

    let cantidad = results[0]["cantidad"] == 0 ? false : true;
    return cantidad;
  };

  /**
   * TODO: Crear registro o actualizar cobertura.
   */
  const FilasCobertura = (objRecord, objetoJson, esNuevo) => {
    establecerSiexisteValor(objRecord, "custrecord_ht_co_bien", objetoJson.bien);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_propietario", objetoJson.propietario);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_producto", objetoJson.producto);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_numeroserieproducto", objetoJson.serieproducto);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_familia_prod", objetoJson.ttr);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_modelodispositivo", objetoJson.modeloDispositivo);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_unidad", objetoJson.unidadDispositivo);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_vid", objetoJson.vidDispositivo);
    establecerSiexisteValor(objRecord, "custrecord_ht_co_estado", objetoJson.estado);

    if (esNuevo || objetoJson.t_PPS) {
      establecerSiexisteValor(objRecord, "custrecord_ht_co_estado_cobertura", objetoJson.estadoCobertura);
      establecerSiexisteValor(objRecord, "custrecord_ht_co_coberturainicial", objetoJson.start ? new Date(objetoJson.start) : null);
      establecerSiexisteValor(objRecord, "custrecord_ht_co_plazo", objetoJson.plazo);
      establecerSiexisteValor(objRecord, "custrecord_ht_co_coberturafinal", objetoJson.end ? new Date(objetoJson.end) : null);
    }
  };

  const FilasDetalleCobertura = (objRecord_2, objetoJson, identificacionCobertura) => {
    establecerSiexisteValor(objRecord_2, "custrecord_ht_ct_transacciones", identificacionCobertura);
    establecerSiexisteValor(objRecord_2, "custrecord_ht_ct_orden_servicio", objetoJson.salesorder);
    establecerSiexisteValor(objRecord_2, "custrecord_ht_ct_orden_trabajo", objetoJson.ordentrabajo);
    establecerSiexisteValor(objRecord_2, "custrecord_ht_ct_concepto", objetoJson.concepto);

    if (objetoJson.t_PPS) {
      establecerSiexisteValor(objRecord_2, "custrecord_ht_ct_fecha_inicial", objetoJson.start ? new Date(objetoJson.start) : null);
      establecerSiexisteValor(objRecord_2, "custrecord_ht_ct_fecha_final", objetoJson.end ? new Date(objetoJson.end) : null);
    }
  };

  const Genera_Actualiza_Cobertura = (objetoJson) => {
    log.debug("Genera_Actualiza_Cobertura", objetoJson);
    // funcion para crear cobertura
    const HT_COBERTURA_RECORD = "customrecord_ht_co_cobertura";
    const HT_DETALLE_COBERTURA = "customrecord_ht_ct_cobertura_transaction";

    if (
      objetoJson === null ||
      objetoJson === undefined ||
      Object.keys(objetoJson).length === 0
    ) {
      return {
        CoberturaID: 0,
        DetalleCoberturaID: 0,
        Mensaje: "Verifique el dispositivo a Instalar o la Orden de Servicio",
      };
    }

    try {
      let response;
      let response_2;
      let objRecord =
        objetoJson.cobertura === 0
          ? record.create({ type: HT_COBERTURA_RECORD, isDynamic: true })
          : record.load({
            type: HT_COBERTURA_RECORD,
            id: objetoJson.cobertura,
            isDynamic: true,
          });

      try {
        FilasCobertura(objRecord, objetoJson, objetoJson.cobertura === 0);
        response = objRecord.save(); // Guarda Cobertura
      } catch (error) {
        response = parseInt(objetoJson?.cobertura || "0");
        log.error("No genero cobertura", error);
      }

      try {
        let objRecord_2 = record.create({ type: HT_DETALLE_COBERTURA, isDynamic: true });
        FilasDetalleCobertura(objRecord_2, objetoJson, response);
        response_2 = objRecord_2.save();
      } catch (error) {
        log.error("No genero detalle de cobertura", error);
        response_2 = 0;
      }
      // Guarda detalle Cobertura

      return {
        CoberturaID: response,
        DetalleCoberturaID: response_2,
        Mensaje: "Exito",
      };
    } catch (error) {
      log.error("Error_Genera_Actualiza_Cobertura", error);
      return {
        CoberturaID: parseInt(objetoJson?.cobertura || "0"),
        DetalleCoberturaID: 0,
        Mensaje: error.message,
      };
    }
  }; //!! Importante

  /**
   * TODO: Funciones.
   */
  const ClasificarItems = (data) => {
    try {
      const defaultClassification = {
        etiqueta: "SINCONTEMPLAR",
        valor: "SCTR",
        familia: "SCTR-SINCONTEMPLAR",
        items: [],
      };

      const classification = [];

      data.forEach((item) => {
        const infoparametros = item.infoparametros || [];
        const ppsParam = infoparametros.find((param) => param.Param === "PPS");
        const famParam = infoparametros.find((param) => param.Param === "FAM");
        const adpParam = infoparametros.find((param) => param.Param === "ADP");
        const ttrParam = infoparametros.find((param) => param.Param === "TTR");

        const pps = ppsParam ? ppsParam.Valor : "N";
        const idpps = ppsParam ? ppsParam.ParamId : 0;
        const adp = adpParam ? adpParam.Valor : "000";
        const etiqueta = famParam
          ? famParam.Param
          : defaultClassification.etiqueta;
        const valor = famParam ? famParam.Valor : defaultClassification.valor;
        const familia = famParam
          ? famParam.ValorText
          : defaultClassification.familia;
        const idfamilia = famParam ? famParam.ParamId : 0;
        const valorTTR = ttrParam ? ttrParam.ValorId : 0;
        const valorfamilia = famParam
          ? famParam.ValorId
          : defaultClassification.familia;

        const familiaGrupo = famParam ? famParam.Valor : defaultClassification.familia;


        let group = classification.find(
          (group) => group.etiqueta === etiqueta && group.valor === valor
        );

        if (!group) {
          group = {
            etiqueta,
            valor,
            familia,
            items: [],
          };
          classification.push(group);
        }

        group.items.push({
          idbien: item.bien,
          internalidOs: item.internalidOs,
          iditem: item.iditem,
          tipoplazo: item.TipoPlazo,
          plazo: item.Plazo,
          displayname: item.displayname,
          type: item.type,
          pps,
          adp,
          idfamilia,
          idpps,
          valorTTR,
          valorfamilia,
          familiaGrupo
        });
      });

      return classification;
    } catch (error) {
      console.error("Error al clasificar los items:", error);
      return [];
    }
  };

  const ClasificarItems_V2 = (data) => {
    try {
      const defaultClassification = {
        etiqueta: "SINCONTEMPLAR",
        valor: "SCTR",
        familia: "SCTR-SINCONTEMPLAR",
        items: [],
      };

      const classification = [];

      data.forEach((item) => {
        const infoparametros = item.infoparametros || [];
        const ppsParam = infoparametros.find((param) => param.Param === "PPS");
        const famParam = infoparametros.find((param) => param.Param === "FAM");
        const adpParam = infoparametros.find((param) => param.Param === "ADP");
        const ttrParam = infoparametros.find((param) => param.Param === "TTR");

        const pps = ppsParam ? ppsParam.Valor : "N";
        const idpps = ppsParam ? ppsParam.ParamId : 0;
        const adp = adpParam ? adpParam.Valor : "001";

        const internalidOs = item.internalidOs;
        const fechaOs = item.fechaOs;

        const etiqueta = famParam
          ? famParam.Param
          : defaultClassification.etiqueta;
        const valor = famParam ? famParam.Valor : defaultClassification.valor;
        const familia = famParam
          ? famParam.ValorText
          : defaultClassification.familia;
        const idfamilia = famParam ? famParam.ParamId : 0;
        const valorTTR = ttrParam ? ttrParam.ValorId : 0;
        const valorfamilia = famParam
          ? famParam.ValorId
          : defaultClassification.familia;

        const familiaGrupo = famParam ? famParam.Valor : defaultClassification.familia;


        let group = classification.find(
          (group) => group.internalidOs === internalidOs && group.fechaOs === fechaOs && group.etiqueta === etiqueta && group.valor === valor
        );

        if (!group) {
          group = {
            internalidOs,
            fechaOs,
            etiqueta,
            valor,
            familia,
            items: [],
          };
          classification.push(group);
        }

        group.items.push({
          idbien: item.bien,
          tipoplazo: item.TipoPlazo,
          plazo: item.Plazo,
          iditem: item.iditem,
          displayname: item.displayname,
          type: item.type,
          pps,
          adp,
          idfamilia,
          idpps,
          valorTTR,
          valorfamilia,
          familiaGrupo
        });
      });

      return classification;
    } catch (error) {
      console.error("Error al clasificar los items:", error);
      return [];
    }
  };


  const CalcularCobertura = (Cantidad, UnidadTiempo, Fecha, esReverso = false) => {
    if (
      (Cantidad == 0 && UnidadTiempo == 0 && Fecha == "01/01/1900") ||
      (!Cantidad && !UnidadTiempo) || (UnidadTiempo > 3) || (UnidadTiempo < 1)
    ) {
      return {
        coberturaInicial: "01/01/1900",
        coberturaFinal: "01/01/1900",
      };
    }

    // Desglosa la fecha en día, mes y año, y crea un objeto Date con la hora 22:00:00
    let [day, month, year] = Fecha.split("/");
    let date_final = new Date(Date.UTC(year, month - 1, day, 22, 0, 0));
    const fechaInicial = new Date(date_final);

    const esBisiesto = (year) => {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    };

    try {

      if (esReverso) {
        switch (UnidadTiempo) {
          case 1: // Año
            date_final.setUTCFullYear(
              date_final.getUTCFullYear() - parseInt(Cantidad)
            );
            break;
          case 3: // Día
            date_final.setUTCDate(date_final.getUTCDate() - parseInt(Cantidad));
            break;
          default: // Mes
            date_final.setUTCMonth(date_final.getUTCMonth() - parseInt(Cantidad));
            break;
        }
      } else {
        switch (UnidadTiempo) {
          case 1: // Año
            date_final.setUTCFullYear(
              date_final.getUTCFullYear() + parseInt(Cantidad)
            );
            break;
          case 3: // Día
            date_final.setUTCDate(date_final.getUTCDate() + parseInt(Cantidad));
            break;
          default: // Mes
            date_final.setUTCMonth(date_final.getUTCMonth() + parseInt(Cantidad));
            break;
        }
      }

      // Ajustar para años bisiestos y no bisiestos
      if (
        date_final.getUTCMonth() === 1 &&
        date_final.getUTCDate() === 29 &&
        !esBisiesto(date_final.getUTCFullYear())
      ) {
        date_final.setUTCDate(28);
      }

      if (esReverso) {
        return {
          coberturaInicial: date_final.toISOString(),
          coberturaFinal: fechaInicial.toISOString()
        };
      } else {
        return {
          coberturaInicial: fechaInicial.toISOString(),
          coberturaFinal: date_final.toISOString(),
        };
      }

    } catch (e) {
      log.error("Error en CalcularCobertura", e);
      return {};
    }
  }; //!! CalcularCobertura

  const CompararFechas = (fecha1, fecha2) => {
    // Verificar si alguna de las fechas es nula o indefinida
    if (!fecha1 || !fecha2) {
      return true;
    }

    // Convertir las fechas de string a objetos Date
    const partesFecha1 = fecha1.split("/");
    const partesFecha2 = fecha2.split("/");

    const date1 = new Date(
      parseInt(partesFecha1[2], 10),
      parseInt(partesFecha1[1], 10) - 1,
      parseInt(partesFecha1[0], 10)
    );
    const date2 = new Date(
      parseInt(partesFecha2[2], 10),
      parseInt(partesFecha2[1], 10) - 1,
      parseInt(partesFecha2[0], 10)
    );

    // Comparar las fechas
    return date1 < date2;
  };

  // * Temporary
  function ObtenerAdpItems(item) {
    const adpValues = item.items.map((subItem) => subItem.adp);
    const uniqueAdpValues = [...new Set(adpValues)];
    return uniqueAdpValues;
  }

  function DeterminarProceso(adpList) {
    const adpInstalacion = ["001", "015"];
    const adpRenovacion = ["004"];
    const adpInstalacionParcialArticulo = ["001"];
    const adpCambioPropietario = ["010"];

    const condiciones = [
      { condicion: adpInstalacion.every(adp => adpList.includes(adp)), valor: 1 },
      { condicion: adpRenovacion.some(adp => adpList.includes(adp)), valor: 2 },
      { condicion: adpInstalacionParcialArticulo.every(adp => adpList.includes(adp)), valor: 3 },
      { condicion: adpCambioPropietario.some(adp => adpList.includes(adp)), valor: 4 },
    ];

    return condiciones.find(({ condicion }) => condicion)?.valor || 0;
  }

  // NEW

  // Prueba del llamado
  // let pruebaPut = makeApiRequest(objectInput, "customdeploy_hu_ec_rs_pd_coberturas", "customscript_hu_ec_rs_pd_coberturas", "PUT", true);
  // log.debug("Prueba de llamado a RESTlet", pruebaPut);

  /**
 * Realiza una solicitud a una API Restlet de NetSuite.
 *
 * @param {Object} json - El cuerpo de la solicitud en formato JSON.
 * @param {string} deploymentId - El ID de despliegue del Restlet.
 * @param {string} scriptId - El ID del script del Restlet.
 * @param {string} [method='POST'] - El método HTTP a utilizar (por defecto es 'POST').
 * @param {boolean} [input=false] - Si es true, devuelve la respuesta como texto; de lo contrario, la parsea como JSON.
 * @returns {Object|string} - La respuesta de la API, parseada como JSON o como texto si `input` es true.
 */
  const makeApiRequest = (json, deploymentId, scriptId, method = 'POST', input = false) => {
    let myRestletHeaders = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };

    let requestOptions = {
      deploymentId: deploymentId,
      scriptId: scriptId,
      headers: myRestletHeaders,
      method: method
    };

    // Omitir el cuerpo si el método es GET
    if (method !== 'GET') {
      requestOptions.body = JSON.stringify(json);
    }

    try {
      let myRestletResponse = https.requestRestlet(requestOptions);
      let response = myRestletResponse?.body;
      if (input) {
        return response;
      } else {
        return JSON.parse(response);
      }
    } catch (error) {
      log.error("Error en la solicitud API", error);
      return { "status": error };
    }
  };

  return {
    respuestaGlobales,
    createColumn,
    getValueOrEmpty,
    getTextOrEmpty,
    establecerSiexisteValor,
    obtenerOrdenesdeTrabajoXordenServicio,
    obtenerParametrizacionItem,
    // esItemServicio,
    obtenerItemParametrizadoPorBien,
    obtenerItemParametrizadoPorBien_V2,
    obtenerInformacionItemOs,
    obtenerNombreOS,
    obtenerTodasFamiliasProducto,
    obtenerCoberturaVehiculoFamilia,
    validarExistenciaEnsamblajeParaOT,
    Genera_Actualiza_Cobertura,
    CalcularCobertura,
    CompararFechas,
    ObtenerAdpItems,
    DeterminarProceso,
    makeApiRequest,
  };
});
