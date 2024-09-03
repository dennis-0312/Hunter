/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 1.1           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 1.1
 *
 */

define(["N/runtime", "N/search", "N/config", "N/render", "N/record", "N/file", "./PE_LIB_Libros.js", "N/format"], (runtime, search, config, render, record, file, libPe, format) => {
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

  var month = "";
  var year = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;
  var hasInfo;

  const getInputData = () => {
    // log.debug('MSK', 'getInputData - Inicio');
    try {
      getParameters();
      return getTransactions();
    } catch (e) {
      log.error("MSK", "getInputData - Error:" + e);
    }
    // log.debug('MSK', 'getInputData - Fin');
  };

  const map = (context) => {
    try {
      var key = context.key;
      var dataMap = JSON.parse(context.value);
      var resultTransactions = {
        codUniOperacion: dataMap[0],
        fechaOperacion: dataMap[1],
        desOperacion: dataMap[2] == "- None -" ? "" : dataMap[2],
        numeroCuenta: dataMap[3],
        denominacion: dataMap[4],
        debito: dataMap[5],
        credito: dataMap[6],
      };

      context.write({
        key: key,
        value: resultTransactions,
      });
    } catch (e) {
      log.error("MSK", "map - Error:" + e);
    }
  };

  const summarize = (context) => {
    // log.debug('MSK', 'summarize - Inicio');
    getParameters();
    // generateLog();
    getSubdiary();
    getPeriod();
    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Caja y Banco 1.1");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;

    transactionJSON["transactions"] = {};
    hasInfo = 0;
    context.output.iterator().each(function (key, value) {
      hasInfo = 1;
      value = JSON.parse(value);

      transactionJSON["transactions"][value.codUniOperacion] = value;
      return true;
    });
    // log.debug('transactionJSON', transactionJSON["transactions"]);

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

      /**** *
          stringXML2 = renderer.renderAsString();

          var FolderId = FOLDER_ID;

          if (FolderId != '' && FolderId != null) {
              // Crea el archivo
              var fileAux = file.create({
                  name: 'AuxiiliarPaPa',
                  fileType: file.Type.PLAINTEXT,
                  contents: stringXML2,
                  encoding: file.Encoding.UTF8,
                  folder: FolderId
              });


              var idfile = fileAux.save(); // Termina de grabar el archivo

              log.debug({
                  title: 'URL ARCHIVO TEMP',
                  details: idfile
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
    log.debug("MSK", "summarize - Fin");
  };
  function limitarLongitudCadena(cadena, maximo) {
    if (cadena.length > maximo) {
      return cadena.slice(0, maximo); // Recorta la cadena al máximo especificado
    } else {
      return cadena; // La cadena es igual o más corta que el máximo, no se modifica
    }
  }

  const getJsonData = (transactions) => {
    // log.debug('MSK', 'getJsonData - Inicio');
    let userTemp = runtime.getCurrentUser(),
      jsonTransacionvine = new Array(),
      useID = userTemp.id,
      jsonTransacion = {},
      totalDebito = 0;
    totalCredito = 0;
    saldoDebito = 0;
    saldoCredito = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    // log.debug('transactions', transactions);
    var cantidadLinea = 0;
    var montovienedebito = 0;
    var montovieneCredito = 0;
    var cantidadFor = 0;
    var cantidadAnterio = 0;
    for (var k in transactions) {
      let IDD = transactions[k].codUniOperacion;
      cantidadLinea = cantidadLinea + 1;
      if (!jsonTransacion[IDD]) {
        let creditoFormat = numberWithCommas(transactions[k].credito);
        log.debug("credito", creditoFormat);

        let debitoFormat = numberWithCommas(transactions[k].debito);
        log.debug("debitoFormat", debitoFormat);

        jsonTransacion[IDD] = {
          number: cantidadFor,
          codUniOperacion: transactions[k].codUniOperacion,
          fechaOperacion: transactions[k].fechaOperacion,
          desOperacion: limitarLongitudCadena(transactions[k].desOperacion, 56),
          numeroCuenta: transactions[k].numeroCuenta,
          denominacion: limitarLongitudCadena(transactions[k].denominacion, 44),
          debito: debitoFormat,
          credito: creditoFormat,
        };
        cantidadFor = cantidadFor + 1;
        totalDebito = totalDebito + Number(transactions[k].debito);
        totalCredito = totalCredito + Number(transactions[k].credito);
      }
      if (cantidadLinea <= 28) {
        montovienedebito = Number(montovienedebito) + Number(transactions[k].debito);
        montovieneCredito = Number(montovieneCredito) + Number(transactions[k].credito);
        cantidadAnterio = cantidadLinea;
      } else {
        jsonTransacionvine.push({
          montovienedebito: numberWithCommas(montovienedebito.toFixed(2)),
          montovieneCredito: numberWithCommas(montovieneCredito.toFixed(2)),
          cantidadFor: cantidadFor - 1,
        });

        cantidadLinea = 0;
        cantidadLinea = cantidadLinea + 1;
        montovienedebito = Number(montovienedebito) + Number(transactions[k].debito);
        montovieneCredito = Number(montovieneCredito) + Number(transactions[k].credito);
      }
    }

    if (totalDebito > totalCredito) {
      saldoDebito = totalDebito - totalCredito;
      saldoDebito = numberWithCommas(roundTwoDecimals(saldoDebito));
      saldoCredito = "0.00";
    } else {
      saldoCredito = totalCredito - totalDebito;
      saldoCredito = numberWithCommas(roundTwoDecimals(saldoCredito));
      saldoDebito = "0.00";
    }

    log.debug("jsonTransacion", jsonTransacion);
    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });

    let periodname_completo = "";
    switch (periodSearch.periodname.substring(0, 3)) {
      case "Ene":
        periodname_completo = periodSearch.periodname.replace("Ene", "Enero");
        break;
      case "Feb":
        periodname_completo = periodSearch.periodname.replace("Feb", "Febrero");
        break;
      case "Mar":
        periodname_completo = periodSearch.periodname.replace("Mar", "Marzo");
        break;
      case "Abr":
        periodname_completo = periodSearch.periodname.replace("Abr", "Abril");
        break;
      case "May":
        periodname_completo = periodSearch.periodname.replace("May", "Mayo");
        break;
      case "Jun":
        periodname_completo = periodSearch.periodname.replace("Jun", "Junio");
        break;
      case "Jul":
        periodname_completo = periodSearch.periodname.replace("Jul", "Julio");
        break;
      case "Ago":
        periodname_completo = periodSearch.periodname.replace("Ago", "Agosto");
        break;
      case "Sep":
        periodname_completo = periodSearch.periodname.replace("Sep", "Setiembre");
        break;
      case "Oct":
        periodname_completo = periodSearch.periodname.replace("Oct", "Octubre");
        break;
      case "Nov":
        periodname_completo = periodSearch.periodname.replace("Nov", "Noviembre");
        break;
      case "Dic":
        periodname_completo = periodSearch.periodname.replace("Dic", "Diciembre");
        break;
      default:
        periodname_completo = periodSearch.periodname;
        break;
    }

    let jsonAxiliar = {
      company: {
        firtTitle: companyName.replace(/&/g, "&amp;"),
        secondTitle: "Expresado en Moneda Nacional",
        thirdTitle: "FORMATO 1.1 - " + periodSearch.periodname,
      },
      cabecera: {
        periodo: periodname_completo,
        ruc: companyRuc,
        razonSocial: companyName.replace(/&/g, "&amp;").toUpperCase(),
      },
      total: {
        totalDebito: numberWithCommas(roundTwoDecimals(totalDebito).toFixed(2)),
        totalCredito: numberWithCommas(roundTwoDecimals(totalCredito).toFixed(2)),
        saldoDebito: saldoDebito,
        saldoCredito: saldoCredito,
      },
      movements: jsonTransacion,
      jsonTransacionvine: jsonTransacionvine,
    };

    // log.debug('MSK - jsonAxiliar', jsonAxiliar);
    return jsonAxiliar;
  };

  const roundTwoDecimals = (value) => {
    return Math.round(value * 100) / 100;
  };

  const getFileName = () => {
    return `LE${companyRuc}${year}${month}00010100001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
  };

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
    log.debug("hiii", auxFile);
    urlfile += auxFile.url;

    // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    // log.debug('MSK', 'getTemplate - Inicio');
    var aux = file.load("./Template/PE_Template_Formato_1_1.ftl");
    // log.debug('MSK', 'getTemplate - Fin');
    return aux.getContents();
  };

  const getTransactions = () => {
    // log.debug('MSK', 'getTransactions - Inicio');
    var arrResult = [];
    var _cont = 0;

    // FORMATO 1.1: "LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO"
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_1_1",
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

    savedSearch.filters.push(
      search.createFilter({
        name: "postingperiod",
        operator: search.Operator.IS,
        values: [pGloblas.pPeriod],
      })
    );

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

        // 0. CÓDIGO ÚNICO DE LA OPERACIÓN
        arrAux[0] = result.getValue(columns[0]);

        // 1. FECHA DE LA OPERACIÓN
        arrAux[1] = result.getValue(columns[1]);

        // 2. DESCRIPCIÓN DE LA OPERACIÓN
        arrAux[2] = result.getValue(columns[2]);

        // 3. CÓDIGO CUENTA CONTABLE ASOCIADA
        arrAux[3] = result.getValue(columns[3]);

        // 4. DENOMINACIÓN CUENTA CONTABLE ASOCIADA
        arrAux[4] = result.getValue(columns[4]);

        // 5. SALDO DEUDOR
        arrAux[5] = result.getValue(columns[5]);

        // 6. SALDO ACREEDOR
        arrAux[6] = result.getValue(columns[6]);

        arrResult.push(arrAux);
      });
    });
    // log.debug('MSK', 'getTransactions - Fin');
    return arrResult;
  };

  const getPeriod = () => {
    var periodRecord = search.lookupFields({
      type: "accountingperiod",
      id: pGloblas.pPeriod,
      columns: ["startdate"],
    });
    var firstDate = format.parse({
      value: periodRecord.startdate,
      type: format.Type.DATE,
    });
    month = firstDate.getMonth() + 1;
    month = month < 10 ? `0${month}` : month;
    year = firstDate.getFullYear();
  };

  const getSubdiary = () => {
    // log.debug('MSK', 'getSubdiary - Inicio');

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
    // log.debug('MSK', 'getSubdiary - Fin');
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter("custscript_pe_formato_1_1_params");
    pGloblas = JSON.parse(pGloblas);

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
    };
    // log.debug('MSK - Parámetros', pGloblas);

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

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});
