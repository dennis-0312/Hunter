/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.18          29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 3.18
 *
 */

define(["N/runtime", "N/search", "N/config", "N/render", "N/record", "N/file", "./PE_LIB_Libros.js"], (runtime, search, config, render, record, file, libPe) => {
  var objContext = runtime.getCurrentScript();

  /** PARAMETROS */
  var pGloblas = {};

  /** REPORTE */
  var formatReport = "pdf";
  var nameReport = "";
  var transactionFile = null;

  /** DATOS DE LA SUBSIDIARIA */
  var companyName = "";
  var companyRuc = "";
  var companyLogo = "";
  var companyDV = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;

  const jsonClaves = {
    "ACTIVIDADES DE OPERACIÓN": {
      "COBRANZA POR APORTES Y DEMÁS SERVICIOS": 0,
      "COBRANZA DE REGALÍAS, HONORARIOS, COMISIONES Y OTROS": 0,
      "COBRANZA DE INTERESES Y DIVIDENDOS RECIBIDOS": 0,
      "OTROS COBROS DE EFECTIVO RELATIVOS A LA ACTIVIDAD": 0,
      "PAGOS A PROVEEDORES POR EL SUMINISTRO DE BIENES Y SERVICIOS": 0,
      "PAGOS DE REMUNERACIONES Y BENEFICIOS SOCIALES": 0,
      "PAGO POR TRIBUTOS": 0,
      "PAGO DE INTERESES Y RENDIMIENTOS": 0,
      "IMPUTACIÓN DE DETRACCIONES INGRESADA COMO RECAUDACIÓN TRIBUTARIA": 0,
    },
    "ACTIVIDADES DE INVERSIÓN": {
      "COBRANZA DE VENTA DE VALORES E INVERSIONES PERMANENTES": 0,
      "COBRANZA DE VENTA DE INMUEBLES, MAQUINARIA Y EQUIPO": 0,
      "COBRANZA DE VENTA DE ACTIVOS INTANGIBLES": 0,
      "OTROS COBROS DE EFECTIVO RELATIVOS A LA ACTIVIDAD": 0,
      "PAGOS POR COMPRA DE VALORES E INVERSIONES PERMANENTES": 0,
      "COMPRA DE PROPIEDADES, PLANTA Y EQUIPO": 0,
      "PAGOS POR COMPRA DE ACTIVOS INTANGIBLES": 0,
      "OTROS PAGOS DE EFECTIVO RELATIVOS A LA ACTIVIDAD": 0,
    },
    "ACTIVIDADES DE FINANCIAMIENTO": {
      "EMISIÓN Y OBTENCIÓN DE OTROS PASIVOS FINANCIEROS": 0,
      "COBRANZA DE RECURSOS OBTENIDOS POR EMISIÓN DE VALORES U OTRAS OBLIGACIONES DE LARGO PLAZO": 0,
      "OTROS COBROS DE EFECTIVO RELATIVOS A LA ACTIVIDAD": 0,
      "AMORTIZACIÓN O PAGO DE OTROS PASIVOS FINANCIEROS": 0,
      "PAGO DE INTERESES FINANCIEROS": 0,
      "OTROS PAGOS DE EFECTIVO RELATIVOS A LA ACTIVIDAD": 0,
    },
  };

  const getInputData = () => {
    try {
      getParameters();
      let transactions = getTransactions();
      log.debug("transactions data", transactions);
      return getTransactions();
    } catch (e) {
      log.error("[ Get Input Data Error ]", e);
    }
  };

  const map = (context) => {
    try {
      // log.debug('Entro al map');
      // log.debug('context map', context);
      var key = context.key;
      var dataMap = JSON.parse(context.value);
      // log.debug("dataMap", dataMap);
      // log.debug("key", key);
      var resultTransactions = {
        dato1: dataMap[0],
        dato2: dataMap[1],
        dato3: dataMap[2],
        dato4: dataMap[3],
        dato5: dataMap[4],
        dato6: dataMap[5],
        dato7: dataMap[6],
      };

      context.write({
        key: key,
        value: resultTransactions,
      });
    } catch (e) {
      log.error("[ Map Error ]", e);
    }
  };

  const summarize = (context) => {
    log.debug("Entro al summarize");
    log.debug("context sumarize", context);
    getParameters();
    getSubdiary();

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.18");
    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;
    transactionJSON["transactions"] = {};

    context.output.iterator().each((key, value) => {
      // log.debug('sumarize key', key);
      value = JSON.parse(value);
      //transactionJSON["transactions"].push(value);
      transactionJSON["transactions"][key] = value;
      return true;
    });

    log.debug("transactionJSON", transactionJSON["transactions"]);

    var orderedjson = orderByCode(transactionJSON["transactions"]);
    log.debug("orderedjson", orderedjson);

    var sumado = sumarPorDato7(orderedjson);

    log.debug("sumado", sumado);

    var jsonSalida = pasarValores(sumado);

    log.debug("jsonSalida", jsonSalida);

    var jsonAxiliar = getJsonData(transactionJSON["transactions"], jsonSalida);
    //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
    if (!isObjEmpty(transactionJSON["transactions"])) {
      var renderer = render.create();
      renderer.templateContent = getTemplate();
      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "input",
        data: {
          data: JSON.stringify(jsonAxiliar),
        },
      });

     /**** *
      stringXML2 = renderer.renderAsString();

      var FolderId = 871;

      if (FolderId != "" && FolderId != null) {
        // Crea el archivo
        var fileAux = file.create({
          name: "Auxiliar318",
          fileType: file.Type.PLAINTEXT,
          // contents: stringXML2,
          contents: JSON.stringify(jsonAxiliar),
          encoding: file.Encoding.UTF8,
          folder: FolderId,
        });

        var idfile = fileAux.save(); // Termina de grabar el archivo
        log.debug({ title: "URL ARCHIVO TEMP", details: idfile });
      }

      /*** */
      stringXML = renderer.renderAsPdf();
      saveFile(stringXML);

      /**** */
      log.debug("Termino");
      return true;
    } else {
      log.debug("No data");
      libPe.noData(pGloblas.pRecordID);
    }
  };

  const getJsonData = (transactions, jsonSumado) => {
    let userTemp = runtime.getCurrentUser(),
      useID = userTemp.id,
      jsonTransacion = {},
      jsonFinal = [],
      totalLine1 = 0,
      totalLine2 = 0,
      totalLine3 = 0,
      saldo = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    log.debug("transactions", transactions);

    // for (var k in transactions) {
    //     let IDD = transactions[k].dato1;
    //     if (!jsonTransacion[IDD]) {
    //         let dato_3 = parseFloat(transactions[k].dato3);
    //         log.debug('dato_3', dato_3);

    //         jsonTransacion[IDD] = {
    //             dato1: transactions[k].dato1,
    //             dato2: transactions[k].dato2,
    //             dato3: dato_3,
    //         }
    //         saldo += dato_3;
    //     }
    // }

    log.debug("jsonTransacion", jsonTransacion);
    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });
    saldo = saldo.toFixed(2);
    let jsonCompany = {
      company: {
        firtsTitle: 'FORMATO 3.18: "LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE FLUJOS DE EFECTIVO"',
        secondTitle: periodSearch.periodname.split(" ")[1],
        thirdTitle: companyRuc.replace(/&/g, "&amp;"),
        fourthTitle: companyName.replace(/&/g, "&amp;"),
      },
      totals: {
        dato3: Number(saldo),
      },
      movements: jsonSumado,
    };

    return jsonCompany;
  };

  const saveFile = (stringValue) => {
    asinfo = "1";

    // var periodname = getPeriodName(pGloblas.pPeriod);
    // var periodostring = retornaPeriodoString(periodname);
    var periodAnioCon = pGloblas.pAnio;
    log.debug("periodAnioCon", periodAnioCon);
    var getruc = getRUC(pGloblas.pSubsidiary);
    fedIdNumb = getruc;
    var fileAuxliar = stringValue;
    var urlfile = "";
    //LERRRRRRRRRRRAAAAMMDD031700CCOIM1.TXT
    nameReport = "LE" + fedIdNumb + periodAnioCon + "1231" + "031800" + "01" + "1" + asinfo + "11_" + pGloblas.pRecordID + ".pdf";
    log.debug("nameReport", nameReport);

    var folderID = libPe.callFolder();

    fileAuxliar.name = nameReport;
    fileAuxliar.folder = folderID;

    var fileID = fileAuxliar.save();

    let auxFile = file.load({
      id: fileID,
    });
    // log.debug('hiii', auxFile)
    urlfile += auxFile.url;

    // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template318LibroInvBal.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.18 Libro Inventario y Balance
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_18",
    });

    if (featSubsidiary) {
      savedSearch.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: pGloblas.pSubsidiary,
        })
      );
    }

    // savedSearch.filters.push(search.createFilter({
    //     name: 'postingperiod',
    //     operator: search.Operator.IS,
    //     values: [pGloblas.pPeriod]
    // }));

    var pagedData = savedSearch.runPaged({
      pageSize: 1000,
    });

    var page, columns;
    let count = 0;
    pagedData.pageRanges.forEach(function (pageRange) {
      page = pagedData.fetch({
        index: pageRange.index,
      });

      page.data.forEach(function (result) {
        count++;
        columns = result.columns;
        arrAux = new Array();

        log.debug("result", result);

        let code = result.getValue(columns[2]);
        // code = processText(code);

        log.debug("code", code);

        // 0. TIPO
        arrAux[0] = result.getValue(columns[0]);

        // 1. CODIGO 2
        arrAux[1] = result.getValue(columns[1]);

        // 2. codigo 1
        arrAux[2] = result.getValue(columns[2]);

        // 3. MONTO
        arrAux[3] = result.getValue(columns[3]);

        // 3. codigo item
        arrAux[4] = result.getValue(columns[4]);

        //2 KEY
        arrAux[5] = result.getValue(columns[1]).toUpperCase();

        //
        arrAux[6] = result.getValue(columns[2]).toUpperCase();

        arrResult.push(arrAux);
      });
    });
    log.debug("count", count);
    log.debug("arrResult length", arrResult.length);
    log.debug("arrResult", arrResult);
    return arrResult;
  };

  const getSubdiary = () => {
    if (featSubsidiary) {
      log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary);
      var dataSubsidiary = record.load({
        type: "subsidiary",
        id: pGloblas.pSubsidiary,
      });
      companyName = dataSubsidiary.getValue("legalname");
      companyRuc = dataSubsidiary.getValue("federalidnumber");
    } else {
      companyName = config.getFieldValue("legalname");
      companyRuc = "";
    }
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter("custscript_pe_318libinvbal_params"); // || {};
    pGloblas = JSON.parse(pGloblas);

    // pGloblas = {
    //     recordID: '',
    //     reportID: 113,
    //     subsidiary: 3,
    //     periodCon: 111
    // }
    log.debug("previo", pGloblas);

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      pAnio: pGloblas.anioCon,
    };
    log.debug("XDDD", pGloblas);

    featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
  };

  const isObjEmpty = (obj) => {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) return false;
    }

    return true;
  };

  const numberWithCommas = (x) => {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
    return x;
  };

  const getRUC = (filterSubsidiary) => {
    try {
      const subLookup = search.lookupFields({
        type: search.Type.SUBSIDIARY,
        id: filterSubsidiary,
        columns: ["taxidnum"],
      });
      const ruc = subLookup.taxidnum;
      return ruc;
    } catch (e) {
      log.error({ title: "getRUC", details: e });
    }
  };

  const orderByCode = (jsonData) => {
    const grupos = {};

    for (const key in jsonData) {
      const dato = jsonData[key];
      const dato6 = dato.dato6;

      if (!grupos[dato6]) {
        grupos[dato6] = [];
      }

      grupos[dato6].push(dato);
    }

    return grupos;
  };
  function sumarPorDato7(gruposPorDato6) {
    const resultado = {};

    for (const dato6 in gruposPorDato6) {
      const datosDato6 = gruposPorDato6[dato6];
      resultado[dato6] = {};

      for (const dato of datosDato6) {
        const dato7 = dato.dato7;

        if (!resultado[dato6][dato7]) {
          resultado[dato6][dato7] = 0;
        }

        resultado[dato6][dato7] += parseFloat(dato.dato4);
      }
    }

    return resultado;
  }

  function pasarValores(jsonEntrada) {
    let t1 = jsonEntrada["ACTIVIDADES DE OPERACIÓN"]["COBRANZA POR APORTES Y DEMÁS SERVICIOS"];
    let t2 = jsonEntrada["ACTIVIDADES DE OPERACIÓN"]["PAGOS A PROVEEDORES POR EL SUMINISTRO DE BIENES Y SERVICIOS"];
    let t3 = jsonEntrada["ACTIVIDADES DE OPERACIÓN"]["PAGOS DE REMUNERACIONES Y BENEFICIOS SOCIALES"];
    let t4 = jsonEntrada["ACTIVIDADES DE INVERSIÓN"]["PAGOS POR COMPRA DE ACTIVOS INTANGIBLES"];
    let t5 = jsonEntrada["ACTIVIDADES DE INVERSIÓN"]["COMPRA DE PROPIEDADES, PLANTA Y EQUIPO"];
    let t6 = jsonEntrada["ACTIVIDADES DE INVERSIÓN"]["PAGOS POR COMPRA DE ACTIVOS INTANGIBLES"];
    let t7 = jsonEntrada["ACTIVIDADES DE FINANCIAMIENTO"]["AMORTIZACIÓN O PAGO DE OTROS PASIVOS FINANCIEROS"];

    let total1 = t1 - t2 - t3;
    let total2 = -t4 - t5 - t6;
    let total3 = -t7;
    let total4 = total1 + total2 + total3;
    let total5 = total4 + t7;

    const jsonSalida = {
      operacion: {
        operacion01: numberWithCommas(t1.toFixed(2)),
        operacion02: "0.00",
        operacion03: "0.00",
        operacion04: "0.00",
        operacion05: numberWithCommas(t2.toFixed(2)),
        operacion06: numberWithCommas(t3.toFixed(2)),
        operacion07: "0.00",
        operacion08: "0.00",
        operacion09: "0.00",
      },
      inversion: {
        inversion01: "0.00",
        inversion02: "0.00",
        inversion03: "0.00",
        inversion04: "0.00",
        inversion05: numberWithCommas(t4.toFixed(2)),
        inversion06: numberWithCommas(t5.toFixed(2)),
        inversion07: numberWithCommas(t6.toFixed(2)),
        inversion08: "0.00",
      },
      financiamiento: {
        financiamiento01: "0.00",
        financiamiento02: "0.00",
        financiamiento03: "0.00",
        financiamiento04: numberWithCommas(t7.toFixed(2)),
        financiamiento05: "0.00",
        financiamiento06: "0.00",
      },
      totals: {
        total01: numberWithCommas(total1.toFixed(2)),
        total02: numberWithCommas(total2.toFixed(2)),
        total03: numberWithCommas(total3.toFixed(2)),
        total04: numberWithCommas(total4.toFixed(2)),
        total05: numberWithCommas(total5.toFixed(2)),
      },
    };

    return jsonSalida;
  }

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});
