/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * Task                         Date            Author                                      Remarks
 * Formato 3.13                  28 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>          LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
 */
define(["N/runtime", "N/search", "N/config", "N/render", "N/record", "N/file", "./PE_LIB_Libros.js", "N/format"], (runtime, search, config, render, record, file, libPe, format) => {
  var objContext = runtime.getCurrentScript();

  /** PARAMETROS */
  var pGloblas = {};

  /** REPORTE */
  var formatReport = "pdf";
  var nameReport = "";
  var transactionFile = null;
  var d = new Date();
  var fechaHoraGen = d.getDate() + "" + (d.getMonth() + 1) + "" + d.getFullYear() + "" + d.getHours() + "" + d.getMinutes() + "" + d.getSeconds();

  /** DATOS DE LA SUBSIDIARIA */
  var companyName = "";
  var companyRuc = "";
  var companyLogo = "";
  var companyDV = "";
  var hasInfo = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;
  

  const getInputData = () => {
    log.debug("Inicio");
    try {
      getParameters();

      return getTransactions();
    } catch (e) {
      log.error("[ Get Input Data Error ]", e);
    }
  };

  const map = (context) => {
    try {
      var key = context.key;
      var dataMap = JSON.parse(context.value);
      // log.debug("dataMap", dataMap);
      // log.debug("key", key);

      var resultTransactions = {
        key: key,
        tipoDNITerceros: (dataMap[0] == "- None -" ? "" : dataMap[0]),
        numDNITerceros: (dataMap[1] == "- None -" ? "" : dataMap[1]),
        nombresTerceros: (dataMap[2] == "- None -" ? "" : dataMap[2]),
        description: (dataMap[3] == "- None -" ? "" : dataMap[3]),
        fechaEmision: dataMap[4],
        monto: dataMap[5],
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
    getParameters();
    getSubdiary();

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.13");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;

    transactionJSON["transactions"] = {};
    context.output.iterator().each(function (key, value) {
      value = JSON.parse(value);
      // log.debug("value", value);
      transactionJSON["transactions"][value.key] = value;
      return true;
    });
    // log.debug("transactionJSON", transactionJSON["transactions"]);

    var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

    // log.debug("jsonAxiliarFinal", jsonAxiliar);
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

      var FolderId = FOLDER_ID;

      if (FolderId != "" && FolderId != null) {
        // Crea el archivo
        var fileAux = file.create({
          name: "AuxiliarFormato3.13",
          fileType: file.Type.PLAINTEXT,
          contents: stringXML2,
          encoding: file.Encoding.UTF8,
          folder: FolderId,
        });

        var idfile = fileAux.save(); // Termina de grabar el archivo

        log.debug({
          title: "URL ARCHIVO TEMP",
          details: idfile,
        });
      }

      *** */
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

  function divisionRedondeoArriba(dividendo, divisor) {
    if (divisor === 0) {
      throw new Error("El divisor no puede ser cero.");
    }

    var resultado = dividendo / divisor;
    var enteroResultado = parseInt(resultado); // Obtén la parte entera

    if (resultado > 0 && resultado !== enteroResultado) {
      return enteroResultado + 1;
    } else if (resultado < 0 && resultado !== enteroResultado) {
      return enteroResultado; // Si el resultado es negativo, no se redondea hacia arriba
    } else {
      return enteroResultado; // Si no hay fracción decimal, no se redondea
    }
  }

  const getJsonData = (transactions) => {
    let userTemp = runtime.getCurrentUser(),
      useID = userTemp.id,
      jsonTransacion = {},
      jsonTransacionvine = new Array(),
      totalAmount = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    // log.debug("transactions", transactions);
    var cantidadLinea = 0;
    var montoviene = 0;
    var cantidadFor = 0;
    var cantidadAnterio = 0;

    for (var k in transactions) {
      var resultado1 = divisionRedondeoArriba(transactions[k].nombresTerceros.length, 61);
      cantidadLinea = cantidadLinea + resultado1 + 1;
      let IDD = transactions[k].key;
      if (!jsonTransacion[IDD]) {
        let monto = Number(transactions[k].monto);

        jsonTransacion[IDD] = {
          number: cantidadFor,
          tipoDNITerceros: transactions[k].tipoDNITerceros,
          numDNITerceros: transactions[k].numDNITerceros,
          nombresTerceros: transactions[k].nombresTerceros.replace(/&/g, "&amp;").toLocaleUpperCase(),
          description: transactions[k].description.replace(/&/g, "&amp;").toLocaleUpperCase(),
          fechaEmision: transactions[k].fechaEmision,
          monto: monto,
        };
        cantidadFor = cantidadFor + 1;
        totalAmount = totalAmount + Number(transactions[k].monto);
      }
      if (cantidadLinea <= 41) {
        montoviene = Number(montoviene) + Number(transactions[k].monto);
        cantidadAnterio = cantidadLinea;
      } else {

        jsonTransacionvine.push({
          montoviene: numberWithCommas(montoviene.toFixed(2)),
          cantidadFor: cantidadFor - 1
        });


        cantidadLinea = 0;
        cantidadLinea = cantidadLinea + resultado1+ 1;
        montoviene = Number(montoviene) + Number(transactions[k].monto);
      }
    }

    log.debug("jsonTransacion", jsonTransacion);

    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });
    let periodname = periodSearch.periodname.split(" ");


    let jsonAxiliar = {
      company: {
        formato: 'FORMATO 3.13: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 46 - CUENTAS POR PAGAR DIVERSAS"',
        ejercicio: "EJERCICIO: " + pGloblas.pAnio,
        ruc: "RUC: " + companyRuc,
        name: "RAZÓN SOCIAL: " + companyName.replace(/&/g, "&amp;").toLocaleUpperCase(),
      },
      total: {
        total: totalAmount
      },
      movements: jsonTransacion,
      "jsonTransacionvine": jsonTransacionvine
    };

    return jsonAxiliar;
  };

  const getFileName = () => {
    return `LE${companyRuc}${pGloblas.pAnio}1231031300071111_${pGloblas.pRecordID}.pdf`;
  }

  const saveFile = (stringValue) => {
    var fileAuxliar = stringValue;
    var urlfile = "";
    
    nameReport = getFileName();

    var folderID = libPe.callFolder();

    fileAuxliar.name = nameReport;
    fileAuxliar.folder = folderID;

    var fileID = fileAuxliar.save();

    let auxFile = file.load({
      id: fileID,
    });
    log.debug("hiii auxFile", auxFile);
    urlfile += auxFile.url;

    // log.debug("pGloblas.pRecordID", pGloblas.pRecordID);
    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template_3_13_DetCXPDivers.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.13: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 46"
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_13",
    });

    log.debug(" pGloblas.pSubsidiary", pGloblas.pSubsidiary);
    if (featSubsidiary) {
      savedSearch.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: pGloblas.pSubsidiary,
        })
      );
    }

    var startdate = format.format({
      value: new Date(pGloblas.pAnio, 0, 1),
      type: format.Type.DATE
    });
    var enddate = format.format({
      value: new Date(pGloblas.pAnio, 12, 0),
      type: format.Type.DATE
    });

    savedSearch.filters.push(search.createFilter({
      name: 'trandate',
      operator: search.Operator.WITHIN,
      values: [startdate, enddate]
    }));

    // savedSearch.filters.push(
    //   search.createFilter({
    //     name: "postingperiod",
    //     operator: search.Operator.IS,
    //     values: [pGloblas.pPeriod],
    //   })
    // );

    var pagedData = savedSearch.runPaged({
      pageSize: 1000,
    });

    var page, columns;

    pagedData.pageRanges.forEach(function (pageRange) {
      page = pagedData.fetch({
        index: pageRange.index,
      });

      page.data.forEach(function (result) {
        columns = result.columns;
        arrAux = new Array();

        // log.debug("result", result);

        // 0. DNI:  TIPO (TABLA 2) - TERCEROS
        arrAux[0] = result.getValue(columns[0]);

        // 1. DNI: NÚMERO - TERCEROS
        arrAux[1] = result.getValue(columns[1]);

        // 2. APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL - TERCEROS
        arrAux[2] = result.getValue(columns[2]);

        //3. DESCRIPCIÓN DE LA OBLIGACIÓN
        arrAux[3] = result.getValue(columns[3]);

        //4. FECHA DE EMISIÓN DEL COMPROBANTE DE PAGO O FECHA DE INICIO DE LA OPERACIÓN
        arrAux[4] = result.getValue(columns[4]);

        //5. MONTO PENDIENTE DE PAGO
        arrAux[5] = result.getValue(columns[5]);

        let year = arrAux[4].split("/")[2];
        // log.debug("year", year);
        // log.debug("pGloblas.pAnio", pGloblas.pAnio);
        if (year == pGloblas.pAnio) {
          arrResult.push(arrAux);
        }

      });
    });

    //!DATA PRUEBA - Inicio
    for(var i=0;i<30;i++){
        arrAux = new Array();
        arrAux[0] = '6'
        arrAux[1] = '2049411391'+i
        arrAux[2] = 'SERVICIOS TURISTICOS ATLANTA E.I.R.L.	'
        arrAux[3] = 'Prueba 3.13'
        arrAux[4] = '11/08/2023'
        arrAux[5] = '3400.00'
        arrResult.push(arrAux);
    }
    //!DATA PRUEBA - Fin

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
    }
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter("custscript_pe_3_13_detcxpdivers_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = { recordID: 10, reportID: 133, subsidiary: 3, anioCon: "2023", periodCon: 113 };

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      pAnio: pGloblas.anioCon,
    };
    log.debug("pGloblas", pGloblas);

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
    while (pattern.test(x))
      x = x.replace(pattern, "$1,$2");
		   
    return x;
  }

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});