/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

/*
Creado Por: DAVID ARISTEGA
Fecha: 02/09/2024
Ejecutable: Función principal que se ejecuta según el Evento establecido en NetSuite
Objetivo: Realiza registros pendientes de procesamiento y envía los datos a un API externo para generar la cobertura, Casos: Cortesia, Cobertura, Cambio de propietario OS , al crear una factura, al Chequear una OT. * Objetivo: Procesar registros pendientes y enviar los datos a una API externa para generar la cobertura.
* Casos de uso:
* - Cortesía
* - Cobertura
* - Cambio de propietario OS
* - Creación de una factura
* - Chequeo de una OT
Script: https://7451241-sb1.app.netsuite.com/app/common/scripting/script.nl?id=1818
Ambiente: SB1, Sandbox
*/


define(["N/record", "N/log", "N/search", "SuiteScripts/IntegracionesHunter/Plantillas/Controllers/coberturaController"],
  function (record, log, search, coberturaController) {

    function beforeSubmit(context) {
      try {
        if (!shouldProcess(context, ["customrecord_ht_record_ordentrabajo"])) return;

        const newRecord = context.newRecord;
        const oldRecord = context.oldRecord;

        const estadoOTNuevo = newRecord.getValue("custrecord_ht_ot_estado");
        const estadoOTAnterior = oldRecord.getValue("custrecord_ht_ot_estado");

        log.debug(
          "Comparación de estados",
          `Anterior: ${estadoOTAnterior}, Nuevo: ${estadoOTNuevo}`
        );

        if ((estadoOTAnterior === "2" && estadoOTNuevo === "2") || (estadoOTAnterior === "4" && estadoOTNuevo === "4")) return;

        const idos = newRecord.getValue("custrecord_ht_ot_orden_servicio");
        const bien = newRecord.getValue("custrecord_ht_ot_vehiculo");
        const origen = "OT";
        const HTotrasInstalaciones = newRecord.getValue("custrecord_ht_ot_others_installs");

        log.debug("HTotrasInstalaciones", HTotrasInstalaciones);

        if (HTotrasInstalaciones != (true || "T" || "true")) {
          // log.debug("Se impulsa Guardado desde", newRecord.type);
          const logRecordId = createLogRecord({
            idos,
            bien,
            idOrigen: newRecord.id,
            origen,
          });

          log.debug("Registro de log creado", "ID: " + logRecordId);
        } else {
          log.debug("No se impulsa Guardado desde", { recordType: newRecord.type, idos: idos || 0, bien: bien || 0, origen: origen });
        }


      } catch (error) {
        log.debug("Error al crear log", error);
      }
    }

    function afterSubmit(context) {
      try {
        if (!shouldProcess(context, ["salesorder", "invoice"])) return;

        const newRecord = context.newRecord;
        const recordType = newRecord.type;
        let idos,
          bien,
          origen,
          cambioPropietario,
          flatValidacion = false;

        switch (recordType) {

          case "salesorder":
            idos = newRecord.id;
            bien = newRecord.getValue("custbody_ht_so_bien");
            cambioPropietario = newRecord.getValue("custbody_es_cambio_de_propietario");
            log.debug("cambioPropietario", cambioPropietario);
            origen = "OS";

            const validaciontotal = newRecord.getValue("total");
            // log.debug("validaciontotal", validaciontotal);

            const cortesia = validaciontotal == 0 && cambioPropietario == false;

            if (!bien) {
              log.debug("No se encuentra la orden de servicio asociada");
              flatValidacion = true;
              return;
            }

            const dataResult = coberturaController.obtenerItemParametrizadoPorBien(idos, bien);
            log.debug("dataResult", dataResult);

            if (cortesia) {
              flatValidacion = dataResult.some((item) => item.items.some((subItem) => subItem.adp === "004")) ? false : true;

              if (!flatValidacion) {
                log.debug("Evento para generar la cobertura menor a un año por cortesía");

                // !Evento para generar la cobertura menor a un año por cortesía
                coberturaController.makeApiRequest(
                  {
                    idOrdenServicio: idos,
                    idbien: bien,
                  },
                  "customdeploy_hu_ec_rs_in_reno_cobertura",
                  "customscript_hu_ec_rs_in_reno_cobertura",
                  "POST",
                  false
                ); // !Condicion para cobertura menor a un año por cortesía
              }

              // !Parametrizacion de un producto de convenio 
              // !Validar Ambacar y Suzuki 
            } else if (dataResult.some((item) => item.items.some((subItem) => subItem.type === "Service" && subItem.adp === "015" && subItem.pps === "S"))) {
              log.debug("Encontro un producto de convenio", recordType);

              // !Restlet para generar la cobertura 
              coberturaController.makeApiRequest(
                {
                  opcion: 1,
                  idOrdenServicio: idos,
                  idbien: bien,
                  esConvenio: true,
                  esCambioPropietario: false
                },
                "customdeploy_hu_ec_rs_in_core_cobertura",
                "customscript_hu_ec_rs_in_core_cobertura",
                "POST",
                false
              );
              // flatValidacion = true;  // !Condicion para no guardar cobertura por convenio


            } else if (dataResult.some((item) => item.items.some((subItem) => subItem.type === "Service" && subItem.adp === "010" && subItem.pps === "S" && cambioPropietario == true))) {
              log.debug("Encontro caso cambioPropietario", recordType);

              // !Restlet para generar la cobertura Cambio de propietario 
              coberturaController.makeApiRequest(
                {
                  opcion: 1,
                  idOrdenServicio: idos,
                  idbien: bien,
                  esConvenio: false,
                  esCambioPropietario: true
                },
                "customdeploy_hu_ec_rs_in_core_cobertura",
                "customscript_hu_ec_rs_in_core_cobertura",
                "POST",
                false
              );

            } else {
              flatValidacion = true;
            }
            break;

          case "invoice":
            idos = newRecord.getValue("createdfrom") || 0;
            bien = newRecord.getValue("custbody_ht_so_bien") || 0;
            origen = "FAC";

            log.debug("context.UserEventType", context.type);
            log.debug("newRecord.id", newRecord.id);

            if (!bien || !idos) {
              log.debug("No se encuentra la orden de servicio asociada o bien asociado");
              flatValidacion = true;
            } else {

              if (context.UserEventType.EDIT == context.type) {

                let recordId = context.newRecord.id;
                let recordType = context.newRecord.type;

                // Volver a cargar el registro para asegurarse de tener el estado más reciente
                let updatedRecord = record.load({
                  type: recordType,
                  id: recordId
                });

                // Obtener el estado actualizado
                let estadoINNuevo = updatedRecord?.getText("status");
                let estadoINAnterior = context.oldRecord?.getText("status");

                if (estadoINNuevo == "Anulada") {
                  log.debug("estadoINNuevo-", estadoINNuevo);
                  log.debug("estadoINAnterior-", estadoINAnterior);

                  if (estadoINAnterior !== estadoINNuevo) {

                    log.debug("Se impulsa true", true);

                    // !Evento para anular la cobertura solo si es Renovacion menor a un año (Reverso)
                    coberturaController.makeApiRequest(
                      {
                        idOrdenServicio: idos,
                        idbien: bien,
                        esReverso: true
                      },
                      "customdeploy_hu_ec_rs_in_reno_cobertura",
                      "customscript_hu_ec_rs_in_reno_cobertura",
                      "POST",
                      false
                    );
                  }
                }

              }

              if (context.UserEventType.CREATE == context.type) {
                // !Evento para generar la cobertura solo si es Renovacion menor a un año
                coberturaController.makeApiRequest(
                  {
                    idOrdenServicio: idos,
                    idbien: bien,
                    esReverso: false
                  },
                  "customdeploy_hu_ec_rs_in_reno_cobertura",
                  "customscript_hu_ec_rs_in_reno_cobertura",
                  "POST",
                  false
                );

              }

              if (context.UserEventType.EDIT != context.type && context.UserEventType.CREATE != context.type) {
                flatValidacion = true;
              }

            }

            break;
        }

        if (flatValidacion) {
          log.debug("No se impulsa Guardado desde", { recordType: recordType, idos: idos || 0, bien: bien || 0, origen: origen });
          return;
        }

        log.debug("Se impulsa Guardado desde", recordType);
        const logRecordId = createLogRecord({
          idos,
          bien,
          idOrigen: newRecord.id,
          origen,
        });

        log.debug("Registro de log creado", "ID: " + logRecordId);
      } catch (error) {
        log.error("Error al crear log", { idos: idos || 0, bien: bien || 0, origen: origen || "", error });
      }
    }

    // Funciones auxiliares
    function shouldProcess(context, validTypes) {
      const recordType = context.newRecord.type;
      return (
        validTypes.includes(recordType) &&
        (context.type === context.UserEventType.CREATE ||
          (context.type === context.UserEventType.EDIT &&
            recordType === "customrecord_ht_record_ordentrabajo" || "invoice" || "salesorder"))
      );
    }

    function createLogRecord({ idos, bien, idOrigen, origen }) {
      // Búsqueda para verificar si ya existe un registro con los mismos idOrigen, idos, y bien

      // const existingRecordSearch = search.create({
      //   type: "customrecord_ven_orden_servicio_log",
      //   filters: [
      //     ["custrecord_id_origen", "equalto", idOrigen],
      //     "AND",
      //     ["custrecord_id_os", "equalto", idos],
      //     "AND",
      //     ["custrecord_id_bien", "equalto", bien]
      //   ],
      //   columns: [
      //     { name: "internalid" },
      //   ],
      // });

      // const myPagedData = existingRecordSearch.runPaged({ pageSize: 1000 });
      // let respuesta = [];

      // myPagedData.pageRanges.forEach((pageRange) => {
      //   const myPage = myPagedData.fetch({ index: pageRange.index });

      //   myPage.data.forEach(function (result) {
      //     respuesta.push({
      //       internal: result.getValue({ name: "internalid" }),
      //     });
      //   });
      // });

      // // Si se encuentra un registro, no se inserta uno nuevo
      // if (respuesta.length > 0) {
      //   log.debug("Registro existente", `No se crea un nuevo registro para idOrigen: ${idOrigen}, idos: ${idos}, bien: ${bien}`);
      //   return null; // O puedes retornar algún valor específico para indicar que no se creó
      // }

      // Si no existe el registro, se crea uno nuevo
      const logRecord = record.create({
        type: "customrecord_ven_orden_servicio_log",
        isDynamic: true,
      });

      logRecord.setValue("custrecord_id_os", idos);
      logRecord.setValue("custrecord_id_bien", bien);
      logRecord.setValue("custrecord_id_origen", idOrigen);
      logRecord.setValue("custrecord_origen", origen);
      logRecord.setValue("custrecord_procesado", "F");
      logRecord.setValue("custrecord_impulso", 0);

      return logRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: true,
      });
    }


    return {
      beforeSubmit: beforeSubmit,
      afterSubmit: afterSubmit,
    };
  });