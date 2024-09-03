/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(["N/log", "N/search", "N/record", "N/https", "N/runtime"], (
  log,
  search,
  record,
  https,
  runtime
) => {
  const beforeLoad = (context) => {
    try {
      var newRecord = context.newRecord; // Obtener el registro de pago de cliente (Customer Payment)
      var Estado_Fisico_FA = newRecord.getValue({
        fieldId: "custrecord_ht_af_estadofisico",
      });
      log.debug("Activos ", +Estado_Fisico_FA);
    } catch (error) {
      log.debug("Error beforeLoad", error.message);
    }
  };

  const beforeSubmit = (context) => {
    log.debug("BeforeSubmited", context.type);
  };

  const afterSubmit = (context) => {
    try {
      log.debug("afterSubmit ", "Ingreso");
      let objRecord = context.newRecord;

      let estadoActivo = objRecord.getValue("custrecord_assetstatus");
      let estadoFisicoActivo = objRecord.getValue(
        "custrecord_ht_af_estadofisico"
      );
      let activoFijoId = objRecord.id;

      if (
        estadoFisicoActivo == "11" ||
        estadoFisicoActivo == "13"/* ||
        estadoFisicoActivo == "10"*/
      ) {
        let result = obtenerArticuloInstalacionOrdenTrabajo(activoFijoId);
        log.debug("result", result);
        let { ordenServicio, historialActivoFijo } = result;
        if (result) {
          log.debug("buscarCobertura", "Ingresando");
          let coberturaResult = buscarCobertura(ordenServicio);
          log.error("coberturaResult", coberturaResult);

          if (coberturaResult) {
            let cobertura = coberturaResult.cobertura;
            /*let values = {
              custrecord_ht_co_estado: _constant.Status.ENTREGADO_A_CLIENTE,
            };*/
            //actualizarCobertura(cobertura, values);
            createCoberturaDetail(cobertura, estadoFisicoActivo);
            log.error("fin", "");
          }
        }
      }
    } catch (error) {
      log.debug("ERROR - afterSubmit", error);
    }
  };

  const createCoberturaDetail = (coberturaId, estadoActivo) => {
    try {
      let trackingHistory = record.create({
        type: "customrecord_ht_ct_cobertura_transaction",
      });
      trackingHistory.setValue("custrecord_ht_ct_transacciones", coberturaId);
      if (estadoActivo == "10") {
        trackingHistory.setText("custrecord_ht_ct_concepto", "Venta");
      } else {
        trackingHistory.setText("custrecord_ht_ct_concepto", "Devolución");
      }
      trackingHistory.setValue("custrecord_ht_ct_fecha_inicial", new Date());
      return trackingHistory.save();
    } catch (error) {}
  };

  const obtenerArticuloInstalacionOrdenTrabajo = (activoFijoId, status) => {
    let filters = [["custrecord_ht_af_enlace", "anyof", activoFijoId]];
    if (status) {
      filters.push("AND");
      filters.push(["custrecord_ht_hs_estado", "anyof", status]);
    }

    let searchResult = search
      .create({
        type: "customrecord_ht_record_historialsegui",
        filters,
        columns: [
          "custrecord_ht_hs_numeroordenservicio",
          search.createColumn({
            name: "created",
            sort: search.Sort.DESC,
            label: "Fecha de creación",
          }),
        ],
      })
      .run()
      .getRange(0, 1);
    if (searchResult.length) {
      let ordenServicio = searchResult[0].getValue(
        "custrecord_ht_hs_numeroordenservicio"
      );
      let ordenTrabajo = obtenerOrdenTrabajo(ordenServicio);
      if (ordenTrabajo)
        return {
          item: ordenTrabajo.item,
          ordenServicio,
          dispositivo: ordenTrabajo.dispositivo,
          ordenTrabajo: ordenTrabajo.ordenTrabajo,
          historialActivoFijo: searchResult[0].id,
        };
    }
    return "";
  };

  const obtenerOrdenTrabajo = (ordenServicioId) => {
    let searchResult = search
      .create({
        type: "customrecord_ht_record_ordentrabajo",
        filters: [
          ["custrecord_ht_ot_orden_servicio", "anyof", ordenServicioId],
        ],
        columns: [
          "custrecord_ht_ot_item",
          "custrecord_ht_ot_serieproductoasignacion",
        ],
      })
      .run()
      .getRange(0, 1);

    if (searchResult.length) {
      let item = searchResult[0].getValue("custrecord_ht_ot_item");
      let dispositivo = searchResult[0].getValue(
        "custrecord_ht_ot_serieproductoasignacion"
      );
      let ordenTrabajo = searchResult[0].id;
      return { item, dispositivo, ordenTrabajo };
    }
    return "";
  };

  const buscarCobertura = (ordenServicio) => {
    let resultSearch = search
      .create({
        type: "customrecord_ht_ct_cobertura_transaction",
        filters: [["custrecord_ht_ct_orden_servicio", "anyof", ordenServicio]],
        columns: ["custrecord_ht_ct_transacciones"],
      })
      .run()
      .getRange(0, 1);
    if (resultSearch.length) {
      let cobertura = resultSearch[0].getValue(
        "custrecord_ht_ct_transacciones"
      );
      return { cobertura };
    }
    return "";
  };

  return {
    beforeLoad: beforeLoad,
    //beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
