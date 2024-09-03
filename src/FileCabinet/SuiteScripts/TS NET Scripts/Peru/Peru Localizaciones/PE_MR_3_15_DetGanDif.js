/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * Task                         Date            Author                                      Remarks
 * Formato 3.15                  28 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>          LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
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

      var resultTransactions = {
        key: key,
        concepto: (dataMap[0] == "- None -" ? "" : dataMap[0]),
        numComprobantes: dataMap[1],
        saldoFinal: dataMap[2],
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

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.15");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;

    transactionJSON["transactions"] = {};
    hasInfo = 0;
    context.output.iterator().each(function (key, value) {
      hasInfo = 1;
      value = JSON.parse(value);
      transactionJSON["transactions"][value.key] = value;
      return true;
    });

    var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

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
  function formatearNumeroConComas(numero) {
    // Convierte el número a una cadena
    const numeroString = numero.toString();
  
    // Divide la cadena en parte entera y parte decimal (si existe)
    const partes = numeroString.split('.');
    const parteEntera = partes[0];
    const parteDecimal = partes.length > 1 ? '.' + partes[1] : '';
  
    // Agrega comas para separar los miles en la parte entera
    const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
    // Combina la parte entera formateada y la parte decimal (si existe)
    const numeroFormateado = parteEnteraFormateada + parteDecimal;
  
    return numeroFormateado;
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
    var cantidadLinea = 0;
    var montoviene = 0;
    var cantidadFor = 0;
    var cantidadAnterio = 0;

    for (var k in transactions) {
      let IDD = transactions[k].key;
      cantidadLinea = cantidadLinea + 1;
      if (!jsonTransacion[IDD]) {
        let saldoFinal = Number(transactions[k].saldoFinal);
        jsonTransacion[IDD] = {
          number: cantidadFor,
          concepto: transactions[k].concepto.replace(/&/g, "&amp;").toLocaleUpperCase(),
          numComprobantes: transactions[k].numComprobantes,
          saldoFinal: saldoFinal,
        };
        cantidadFor = cantidadFor + 1;
        totalAmount = totalAmount + Number(transactions[k].saldoFinal);
      }
      if (cantidadLinea <= 27) {
        montoviene = Number(montoviene) + Number(transactions[k].saldoFinal);
        cantidadAnterio = cantidadLinea;
      } else {
  
        jsonTransacionvine.push({
          montoviene: formatearNumeroConComas(montoviene.toFixed(2)),
          cantidadFor: cantidadFor - 1
        });


        cantidadLinea = 0;
        cantidadLinea = cantidadLinea + 1;
        montoviene = Number(montoviene) + Number(transactions[k].saldoFinal);
      }
    }


    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });

    let periodname = periodSearch.periodname.split(" ");

    let jsonAxiliar = {
      company: {
        formato: 'FORMATO 3.15: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 49" - GANANCIAS DIFERIDAS"',
        ejercicio: "EJERCICIO: " + pGloblas.pAnio,
        ruc: "RUC: " + companyRuc,
        name: "RAZÓN SOCIAL: " + companyName.replace(/&/g, "&amp;").toLocaleUpperCase(),
      },
      total: {
        total: totalAmount,
      },
      movements: jsonTransacion,
      "jsonTransacionvine": jsonTransacionvine
    };

    return jsonAxiliar;
  };

  const getFileName = () => {
    return `LE${companyRuc}${pGloblas.pAnio}1231031500071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
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
    log.debug("Execution Complete", auxFile);
    urlfile += auxFile.url;

    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template_3_15_DetGanDif.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.15: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 49"
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_15",
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

        // 0. CONCEPTO
        arrAux[0] = result.getValue(columns[0]);

        // 1. NÚMERO DE  COMPROBANTE DE PAGO RELACIONADO
        arrAux[1] = result.getValue(columns[1]);

        // 2. SALDO FINAL
        arrAux[2] = result.getValue(columns[2]);

        // 2. Fecha
        arrAux[3] = result.getText(columns[3]);

        let year = arrAux[3].split(" ")[1];
        if (year == pGloblas.pAnio) {
          arrResult.push(arrAux);
        }
      });
    });

    //!DATA PRUEBA - Inicio
    // for(var i=0;i<10;i++){
    //     arrAux = new Array();
    //     arrAux[0] = 'Impuesto a la Renta Diferido'
    //     arrAux[1] = 'AD-101'+i
    //     arrAux[2] = '1436.34'
    //     arrAux[3] = 'Ago 2023'
    //     arrResult.push(arrAux);
    // }
    //!DATA PRUEBA - Fin

    return arrResult;
  };

  const getSubdiary = () => {
    if (featSubsidiary) {
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
    pGloblas = objContext.getParameter("custscript_pe_3_15_detgandif_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = { recordID: 10, reportID: 134, subsidiary: 3, anioCon: "2023", periodCon: 113 };

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
