/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */

 /*
Creado Por: DAVID ARISTEGA
Fecha: 02/09/2024
Ejecutable: Función principal que se ejecuta al recibir una petición RESTlet
Objetivo: Realiza la creación de coberturas para los diferentes procesos de instalación, renovación y cambio de propietario.
Script: https://7451241-sb1.app.netsuite.com/app/common/scripting/script.nl?id=1803&whence=
Ambiente: SB1, Sandbox
*/

 define(["N/https","N/log", "N/search", 'N/record', 'SuiteScripts/IntegracionesHunter/Plantillas/Controllers/coberturaController',"./UtilsGeneral/HU_EC_FUNCION", "./UtilsGeneral/HU_EC_CONSTANTES"], (https,log, search, record, coberturaController,_funcion, _const) => {

  const _post = (requestBody) => {

    log.debug("POST request received", requestBody);

    const { opcion = "0", esConvenio = false  } = requestBody || {};
  
    switch (opcion) {
      case 1:
        try {
          const data = PostCaso1(requestBody);
          log.debug("Respuesta Post 1", data);
          return JSON.stringify(data);
  
        } catch (e) {
          log.debug("Error respuesta Post 1", e);
          return JSON.stringify({ results: [coberturaController.respuestaGlobales("1")] });
        }
      case 2:
        try {
          const data = PostCaso2(requestBody);
          log.debug("Respuesta Post 2", data);
          return JSON.stringify(data);
  
        } catch (e) {
          log.debug("Error respuesta Post 2", e);
          return JSON.stringify({ results: [coberturaController.respuestaGlobales("1")] });
        }
      case 3:
          try {
            const data = PostCaso3(requestBody);
            log.debug("Respuesta Post 3", data);
            return JSON.stringify(data);
    
          } catch (e) {
            log.debug("Error respuesta Post 3", e);
            return JSON.stringify({ results: [coberturaController.respuestaGlobales("1")] });
        }
      case 4:
        try {
          const data = PostCaso4(requestBody);
          log.debug("Respuesta Post 4", data);
          return JSON.stringify(data);
    
        } catch (e) {
          log.debug("Error respuesta Post 4", e);
          return JSON.stringify({ results: [coberturaController.respuestaGlobales("1")] });
        }
      default:
        log.debug({ title: "default Post", details: requestBody });
        return JSON.stringify({ results: [] });
        }
  };

  const PostCaso1 = (requestBody) => {
    const familiasdisponibles = coberturaController.obtenerTodasFamiliasProducto();

    // log.debug("familiasdisponibles:", familiasdisponibles); //VBC 

    const procesosComunes = {
      "001": Proceso_Instalacion_001,
      "004": Proceso_Renovacion_004,
      "010": Proceso_Cambio_Propietario_010
    };

    const gruposdefamilia = familiasdisponibles.reduce((handlers, family) => {
      handlers[family] = { ...procesosComunes };
      return handlers;
    }, {});

    // log.debug("gruposdefamilia:", gruposdefamilia); //VBC 

    const respuesta = [];
    const manejarError = (mensaje) => {
      respuesta.push({
        Cobertura_ID: 0,
        DetalleCobertura_ID: 0,
        Mensaje: mensaje,
      });
    };

    try {
      const dataResult = coberturaController.obtenerItemParametrizadoPorBien( requestBody.idOrdenServicio, requestBody.idbien );

      log.debug("dataResult", dataResult);

      if (dataResult.length === 0) {
        manejarError("No se encontraron datos para el bien especificado.");
        return {
          results: respuesta,
          status: "Error",
          message: "No se encontraron datos",
        };
      }
 
      const procesarItem = (item, requestBody, gruposdefamilia, respuesta) => {
        const family = item.valor;
        const json = gruposdefamilia[family] ? CoreFamilia(item, requestBody, family, gruposdefamilia) : null;

        // Caso solo 010
        if (json?.results?.length > 0) {
          json.results.forEach((item) => {
            respuesta.push(item);
          });
          return;
        }
        
        // Caso 001, 004
        return json
          ? respuesta.push(coberturaController.Genera_Actualiza_Cobertura(json))
          : manejarError(`No se pudo generar la cobertura para la familia: ${family}`);
      };

      dataResult.forEach((item) => {
        gruposdefamilia[item.valor]
          ? procesarItem(item, requestBody, gruposdefamilia, respuesta)
          : manejarError(`No se encontró un manejador para la familia: ${item.valor}`);
      });

      return { results: respuesta, status: "Proceso Finalizado" };
    } catch (error) {
      log.debug("Error PostCaso1", error);
      manejarError(error.message);
      return { results: respuesta, status: "Error", message: error.message };
    }
  };

  const PostCaso2 = (requestBody) => {
    try { 
      let respuesta = [];
      respuesta.push(coberturaController.Genera_Actualiza_Cobertura(requestBody));

      return { results: respuesta, status: "Proceso Finalizado",  };
    } catch (error) {
      log.debug("Error PostCaso1", error);
      manejarError(error.message);
      return { results: respuesta, status: "Error", message: error.message };
    }
  };

  const PostCaso3 = (requestBody) => {
    try {
      const obtenerParametrizacionItem = (items, busquedaParametro) => { 
        let data = [];

        for (let i = 0; i < busquedaParametro.length; i++) {
            try {
                let filtro = [
                    ["custrecord_ht_pp_parametrizacionid", "is", items],
                    "AND",
                    ["custrecord_ht_pp_parametrizacion_rela.custrecord_ht_pp_code", "is", busquedaParametro[i]]
                ];
        
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
                    let pageData = busqueda.runPaged({ pageSize: 1 });
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
        
            } catch (error) {
                log.error("Error en obtenerParametrizacionItem", error);
            }
        }
        
        return data;
      };
      
      let datatemporales = obtenerParametrizacionItem(28215, ['FAM', 'TTR', 'ADP','PPS']); // ! Debug

      log.error("datatemporales", datatemporales); // ! Debug

      return { results: datatemporales, status: "Proceso Finalizado" };
      

    } catch (error) {
      log.error("Error en la ejecución del script", error);
    }
  };

  const PostCaso4 = (requestBody) => {
    try {
      // Crear búsqueda para obtener registros pendientes de procesamiento
      const busquedaSegmentoCobertura = search.create({
        type: "customrecord_ven_orden_servicio_log",
        filters: [["custrecord_procesado", "is", "F"]],
        columns: [
          "internalid",
          "custrecord_id_os",
          "custrecord_id_bien",
          "custrecord_id_origen",
          "custrecord_origen",
          "custrecord_procesado",
          "custrecord_impulso",
        ].map((name) => search.createColumn({ name })),
      });

      const myResultParaCobertura = busquedaSegmentoCobertura.run().getRange({ start: 0, end: 1000 });
      const theCountFac = busquedaSegmentoCobertura.runPaged().count;

      log.debug("Número de registros encontrados", theCountFac);

      // Procesar cada resultado de la búsqueda
      myResultParaCobertura.forEach((result, index) => {
        const data = {
          InternalIdDoc: result.getValue(busquedaSegmentoCobertura.columns[0]),
          InternalOS: result.getValue(busquedaSegmentoCobertura.columns[1]),
          InternalBien: result.getValue(busquedaSegmentoCobertura.columns[2]),
          InternalOrigen: result.getValue(busquedaSegmentoCobertura.columns[3]),
          Origen: result.getValue(busquedaSegmentoCobertura.columns[4]),
          Procesado: result.getValue(busquedaSegmentoCobertura.columns[5]),
          Impulso: result.getValue(busquedaSegmentoCobertura.columns[6]),
        };

        log.debug(`Procesando registro ${index + 1}`, data);

        if (data.InternalOS == requestBody.idOrdenServicio){
        
          try {
          // Consulta a la API para obtener detalles de la orden de servicio
          let response = requestBody.json; // Colocar la respuesta de la API 

          // Consulta a la API para obtener detalles de la orden de servicio
          // let response = {...};
          let responseBody = response;

          // Validar la respuesta de la API y actualizar el registro de log
          if (responseBody?.DetalleOrden?.length === 0 || responseBody?.DetalleOrden?.some((info) => info?.ADP === "")) {
            actualizarProcesadoLog(data.InternalIdDoc, data.Impulso, "T");
          } else if (responseBody?.DetalleOrden?.length > 0) {
            try {
              // Preparar datos para enviar a la API externa
              let DataToSend = response;
              let token = _funcion.loginGetToken();

              let headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              };

              let options = {
                method: "POST",
                headers: headers,
                body: JSON.stringify(DataToSend),
              };

              // Enviar datos a la API externa
              let response2 = https.post({
                url: _const.URLS.HUNTER_API_NETSUITE + "/OrdenServicioNS",
                body: options.body,
                headers: options.headers,
              });

              log.debug("URL de la API externa", _const.URLS.HUNTER_API_NETSUITE + "/OrdenServicioNS");

              let temporal = JSON.parse(response2.body);
              log.debug("Respuesta de la API externa", temporal);

              // Validar la respuesta de la API externa y actualizar el registro de log
              if (response2.code === 200) {
                // let responseBody2 = JSON.parse(response2.body);
                // log.debug("Respuesta de la API externa", responseBody2);
                actualizarProcesadoLog(data.InternalIdDoc, data.Impulso, "T");
                return true;
              } else {
                log.error("Error HTTP", `Código de estado: ${response2.code}, Respuesta: ${response2.body}`);
                actualizarProcesadoLog(data.InternalIdDoc, data.Impulso, "F");
                return `Código de estado: ${response2.code}, Respuesta: ${response2.body}`;
              }
            } catch (error) {
              actualizarProcesadoLog(data.InternalIdDoc, data.Impulso, "F");
            }
          }else{
            log.debug("Error", "Tiempo Agotado.");
            actualizarProcesadoLog(data.InternalIdDoc, data.Impulso, "F");
          }
          
        } catch (error) {
          log.debug("Error en la consulta de la API", error);
          actualizarProcesadoLog(data.InternalIdDoc, data.Impulso, "F");
        }
      }

      });
    } catch (error) {
      log.error("Error en la ejecución del script", error);
    }
  };

  const actualizarProcesadoLog = (internalId, Impulso, estadoProcesado, traza, api_Externo) => {
    try {
      record.submitFields({
        type: "customrecord_ven_orden_servicio_log",
        id: internalId,
        values: {
          custrecord_procesado: estadoProcesado,
          custrecord_impulso: parseInt(Impulso) + 1,
          custrecord32: traza,
          custrecord_respuesta_api: api_Externo
        },
      });
      log.debug("Registro actualizado", `ID: ${internalId}`);
    } catch (error) {
      log.error("Error actualizando el registro", error);
    }
  };
  
  function CoreFamilia(item, requestBody, familia, gruposdefamilia) {
    try {

      let coreRespuesta; 
      let listaAdp = coberturaController.ObtenerAdpItems(item);
      log.debug("listaAdp: ", listaAdp);
      const proceso = coberturaController.DeterminarProceso(listaAdp);
      log.debug("proceso: ", proceso);

        switch (proceso) {
          case 1:
            coreRespuesta = Proceso_Instalacion_001(item, familia, requestBody, gruposdefamilia);
            break;
          case 2:
            coreRespuesta = Proceso_Renovacion_004(item, familia, requestBody, gruposdefamilia);
            break;
          case 3:
            coreRespuesta = Proceso_Instalacion_Parcial_Articulo_001(item, familia, requestBody, gruposdefamilia);
            break;
          case 4:
            coreRespuesta = Proceso_Cambio_Propietario_010(item, familia, requestBody, gruposdefamilia);
            break;
          default:
            log.debug("Error", "No se encontró un proceso adecuado para los valores de adp proporcionados.");
            coreRespuesta = null;
            break;
        }

        return coreRespuesta;
    } catch (error) {
      log.debug("Error CoreFamily", error);
      return null;
    }
  };

  /*
  * Procesos 001, 004, 010, 001 Parcial Articulo
  * */
  function Proceso_Instalacion_001(item, familia, requestBody, gruposdefamilia) {
    try {
        const ppsValor = requestBody?.esConvenio ? "S" : "N";
        const serviceItem = item.items.find(subItem =>
            subItem.type === "Service" && subItem.pps === ppsValor && subItem.adp === "015"
        );

        if (!serviceItem) {
            log.debug("Error", `No se encontró un ítem de tipo "Service" con las condiciones especificadas para la familia ${familia}.`);
            return null;
        }

        const infoCoberturaEncontrada = coberturaController.obtenerCoberturaVehiculoFamilia(serviceItem.idbien, serviceItem.valorfamilia);
        log.debug("infoCoberturaEncontrada Instalacion 001", infoCoberturaEncontrada);

        const cobertura = infoCoberturaEncontrada?.id || 0;
        const concepto = cobertura ? 15 : 17;

        for (const adp of Object.keys(gruposdefamilia[familia])) {
            const assemblyItem = item.items.find(subItem =>
                subItem.type === "Assembly" && subItem.pps === "N" && subItem.adp === adp
            );

            if (assemblyItem) {
                return EstructurarJSON(assemblyItem, serviceItem, requestBody, { adp, concepto, cobertura });
            }
        }

        return {};
    } catch (error) {
        log.debug('Error procesando la cobertura', error);
        return null;
    }
  };

  function Proceso_Renovacion_004(item, familia, requestBody, gruposdefamilia) {
    log.debug("Proceso_Renovacion_004", { item, family: familia, requestBody });
    try {

      const serviceItem = item.items.find(
        (subItem) =>
          subItem.type === "Service" && subItem.pps === "S" && subItem.adp === "004"
      );

      let infoCoberturaEncontrada = coberturaController.obtenerCoberturaVehiculoFamilia(serviceItem.idbien, serviceItem.valorfamilia)
      log.debug("--infoCoberturaEncontrada Instalacion 004--", infoCoberturaEncontrada); // ! Debug

      if(!infoCoberturaEncontrada?.coberturaFinal){
        return null;
      }

      return EstructurarJSON(serviceItem, serviceItem, requestBody, {adp : serviceItem?.adp, concepto: 8, cobertura: infoCoberturaEncontrada?.id, fecha: infoCoberturaEncontrada?.coberturaFinal});

    } catch (error) {
      log.debug('Error procesando la cobertur2', error);
      return null;
    }
  };

  function Proceso_Cambio_Propietario_010(item, familia, requestBody, gruposdefamilia) {
    
    let dataCobertura = [];

    try {
      log.debug("ProcesoCambioPropietario", { item, familia, requestBody });
      
      // Buscar el ítem correspondiente al cambio de propietario
      const cambioPropietarioItem = item.items.find((subItem) => subItem.type === "Service" && subItem.pps === "S" && subItem.adp === "010");

      if(cambioPropietarioItem){        
        let infoCoberturaEncontrada = coberturaController.obtenerCoberturaVehiculoFamilia(cambioPropietarioItem.idbien, cambioPropietarioItem.valorfamilia)
        let respuesta = EstructurarJSON(cambioPropietarioItem, cambioPropietarioItem, requestBody, {adp : cambioPropietarioItem?.adp, concepto: 15, cobertura: infoCoberturaEncontrada?.id, fecha: null });

        return respuesta;
      }
    } catch (error) {
      dataCobertura.push({
        Cobertura_ID: 0,
        DetalleCobertura_ID: 0,
        Mensaje: error.message
      });

      return { results: dataCobertura, status: "Error", message: error.message };
    }
  }; // ! Prueba

  /*
  * Importante Eventos retorna un JSON
  * */
  function EstructurarJSON(emsambleItem, servicioItem, requestBody, infodinamic) {
      try {
        const obtenerDetallesItem = (item) => coberturaController.obtenerInformacionItemOs(item.internalidOs, item.iditem, item.valorfamilia);
        const IdentificaEstadoCobertura = (item) => item.pps === "N" ? 3 : 1;
        const fechaAccion = (fecha) => `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
  
        let detallesServicio, detalleEnsamble, EstadoCobertura, EstadoInstalacion, infoOS, infoOT, cobertura, Ensamble, json = {};
    
        switch (infodinamic.adp) {
          case "001":
            EstadoCobertura = IdentificaEstadoCobertura(servicioItem);
            EstadoInstalacion = 1;
    
            detalleEnsamble = obtenerDetallesItem(emsambleItem);
            detallesServicio = obtenerDetallesItem(servicioItem);
    
            if (!detallesServicio || (detallesServicio?.quantity === 0 && detallesServicio?.unidadTiempo === 0)) {
              throw new Error("El ítem de servicio no posee unidad ni tiempo, Verifique.");
            }
    
            infoOS = coberturaController.obtenerNombreOS(detallesServicio.idOS);
            infoOT = coberturaController.obtenerOrdenesdeTrabajoXordenServicio(parseInt(detallesServicio.idOS), detalleEnsamble.items);
            Ensamble = coberturaController.validarExistenciaEnsamblajeParaOT(infoOT[0]?.id);
            cobertura = coberturaController.CalcularCobertura(detallesServicio.quantity, parseInt(detallesServicio.unidadTiempo), infoOS?.trandate);
    
            log.debug("infoOT", infoOT);

            if (infoOT[0]?.estado === "7" || (infoOT[0]?.estado === "4" && !Ensamble) || infoOT[0]?.estado == "" ) {
              cobertura = coberturaController.CalcularCobertura(0, 0, "01/01/1900");
              EstadoCobertura = 3;
              EstadoInstalacion = detallesServicio.quantity = "";
            }
    
            // if(false){
            if (infoOT?.length > 0 || requestBody?.esConvenio) {
              json = CrearJson(detalleEnsamble, detallesServicio, infoOT[0], cobertura, EstadoInstalacion, EstadoCobertura, requestBody, infodinamic);
            } else {
              log.debug("Error", "No se encontraron órdenes de trabajo para la orden de servicio.");
            }
            break;
    
          case "004":
            EstadoCobertura = IdentificaEstadoCobertura(servicioItem);
            EstadoInstalacion = 1;
    
            detallesServicio = obtenerDetallesItem(servicioItem);
            infoOS = coberturaController.obtenerNombreOS(detallesServicio.idOS);
            infoOT = coberturaController.obtenerOrdenesdeTrabajoXordenServicio(false, false, requestBody?.idbien);
  
            let fechaHoy = new Date();
            const fechaCobertura = coberturaController.CompararFechas(infodinamic.fecha, infoOS.trandate) ? fechaAccion(fechaHoy) : infodinamic.fecha;
            cobertura = coberturaController.CalcularCobertura(detallesServicio.quantity, parseInt(detallesServicio.unidadTiempo), fechaCobertura);
    
            if (infoOT?.length > 0) {
            // if (false) {
              json = CrearJson(detallesServicio, detallesServicio, infoOT[0], cobertura, EstadoInstalacion, EstadoCobertura, requestBody, infodinamic);
            } else {
              log.debug("Error", "No se encontraron órdenes de trabajo.");
            }
            break;
    
          case "010":
            EstadoCobertura = IdentificaEstadoCobertura(servicioItem);
            EstadoInstalacion = 1;
    
            detallesServicio = obtenerDetallesItem(servicioItem);
            infoOS = coberturaController.obtenerNombreOS(detallesServicio.idOS);
            infoOT = coberturaController.obtenerOrdenesdeTrabajoXordenServicio(false, false, requestBody?.idbien);
  
            const fechaCobertura010 = infoOS?.trandate;
            cobertura = coberturaController.CalcularCobertura(detallesServicio.quantity, parseInt(detallesServicio.unidadTiempo), fechaCobertura010);
    
            // Nuevo propietario
            detallesServicio.cliente = detallesServicio?.clienteItem ? detallesServicio?.clienteItem : detallesServicio?.cliente;

            if (infoOT?.length > 0) {
            // if (false) {
              json = CrearJson(detallesServicio, detallesServicio, infoOT[0], cobertura, EstadoInstalacion, EstadoCobertura, requestBody, infodinamic);
            } else {
              log.debug("Error", "No se encontraron órdenes de trabajo.");
            }
            break;

          default:
            log.debug("Error", "Tipo de operación no soportada.");
            break;
        }
    
        return json;
    
      } catch (error) {
        log.debug("Error generarJson", error);
        return {};
      }
  };

  function CrearJson(detallesItem, detallesItemInst, infoOT, cobertura, EstadoInstalacion, EstadoCobertura, requestBody, infodinamic) {

     const esConvenio = requestBody.esConvenio;
     const esAdp004 = infodinamic.adp === "004";
     const ValorDefinido = (valor, defecto = "") => valor ?? defecto; 

     return {
         bien: ValorDefinido(requestBody.idbien),
         propietario: ValorDefinido(detallesItem?.cliente),
         start: esConvenio ? "01/01/1900" : ValorDefinido(cobertura?.coberturaInicial),
         plazo: esConvenio ? 0 : ValorDefinido(detallesItemInst?.quantity),
         end: esConvenio ? "01/01/1900" : ValorDefinido(cobertura?.coberturaFinal),
         estado: esConvenio ? null : ValorDefinido(EstadoInstalacion),
         concepto: esConvenio ? 12 : ValorDefinido(infodinamic.concepto),
         producto: esAdp004 ? null : ValorDefinido(detallesItem?.items), 
         salesorder: ValorDefinido(detallesItemInst?.idOS),
         serieproducto: esAdp004 ? null : ValorDefinido(infoOT?.serieProductoAsignacion),
         ordentrabajo: esAdp004 ? null : ValorDefinido(infoOT?.id),
         monitoreo: "",
         cobertura: ValorDefinido(infodinamic.cobertura),
         ttr: ValorDefinido(detallesItemInst?.ttr),
         estadoCobertura: ValorDefinido(EstadoCobertura),
         t_PPS: true,
         modeloDispositivo: esAdp004 ? null : ValorDefinido(infoOT?.modelo),
         unidadDispositivo: esAdp004 ? null : ValorDefinido(infoOT?.unidad),
         vidDispositivo: esAdp004 ? null : ValorDefinido(infoOT?.vid)
     };
  };

  return {
    post: _post,
  };
});