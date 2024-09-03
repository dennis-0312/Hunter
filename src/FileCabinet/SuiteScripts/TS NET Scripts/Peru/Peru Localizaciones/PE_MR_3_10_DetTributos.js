/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * Task                         Date            Author                                      Remarks
 * Formato 3.10                  28 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>          LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
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
  var month = "";
  var year = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;
  var hasInfo;

  const getInputData = () => {
    log.debug("Inicio");
    try {
      getParameters();
      let transactions = getTransactions();
      log.debug("transactions result", transactions);
      return getTransactions();
    } catch (e) {
      log.error("[ Get Input Data Error ]", e);
    }
  };

  const map = (context) => {
    try {
      var key = context.key;
      var dataMap = JSON.parse(context.value);
      log.debug("dataMap", dataMap);
      // log.debug("key", key);

      var resultTransactions = {
        // key: key,
        codigo: dataMap[0],
        denominacion: dataMap[1],
        saldoFinal: dataMap[2]
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

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.10");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;
    transactionJSON["transactions"] = {};
    hasInfo = 0;
    let counter = 0;
    context.output.iterator().each(function (key, value) {
      hasInfo = 1;
      value = JSON.parse(value);
      transactionJSON["transactions"][counter] = value;
      counter++;
      return true;
    });
    
    log.debug("transactionJSON final", transactionJSON["transactions"]);

    var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

    log.debug("jsonAxiliarFinal", jsonAxiliar);
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
          name: "AuxiliarFormato3.10",
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

  const getJsonData = (transactions) => {
    let userTemp = runtime.getCurrentUser(),
      useID = userTemp.id,
      jsonTransacion = {},
      totalAmount = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    // log.debug("transactions", transactions);
    let counter = 0;
    for (var k in transactions) {
      log.debug("transactions[k]", transactions[k]);
      let IDD = transactions[k].denominacion;
      if (!jsonTransacion[counter]) {
        let saldoFinal = Number(transactions[k].saldoFinal).toFixed(2);
        saldoFinal = numberWithCommas(saldoFinal);

        jsonTransacion[counter] = {
          codigo: transactions[k].codigo,
          denominacion: transactions[k].denominacion.replace(/&/g, "&amp;").toLocaleUpperCase(),
          saldoFinal: saldoFinal,
        };
        totalAmount = totalAmount + Number(transactions[k].saldoFinal);
        counter++;
      }
    }

    // log.debug("jsonTransacion", jsonTransacion);

    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });
    let periodname = periodSearch.periodname.split(" ");

    let jsonAxiliar = {
      company: {
        formato: 'FORMATO 3.10: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 40 - TRIBUTOS POR PAGAR"',
        ejercicio: "EJERCICIO: " + pGloblas.pAnio,
        ruc: "RUC: " + companyRuc,
        name: "RAZÓN SOCIAL: " + companyName.replace(/&/g, "&amp;").toLocaleUpperCase(),
        // firtTitle: companyName.replace(/&/g, "&amp;"),
        // secondTitle: "Expresado en Moneda Nacional",
        // thirdTitle: "COMPROBANTES DE RETENCION - " + periodSearch.periodname,
      },
      total: {
        total: totalAmount.toFixed(2),
      },
      movements: jsonTransacion,
    };

    return jsonAxiliar;
  };

  const getFileName = () => {//LE2013949107720231231031000071111
    return `LE${companyRuc}${pGloblas.pAnio}1231031000071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
 }

  const saveFile = (stringValue) => {
      var fileAuxliar = stringValue;
      var urlfile = '';

      nameReport = getFileName();

      var folderID = libPe.callFolder();

      fileAuxliar.name = nameReport;
      fileAuxliar.folder = folderID;

      var fileID = fileAuxliar.save();

      let auxFile = file.load({
          id: fileID
      });
      log.debug('hiii', auxFile)
      urlfile += auxFile.url;

      // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

      libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
  }

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template_3_10_DetTributos.xml");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.10: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 40"
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_10",
    });

    // log.debug(" pGloblas.pSubsidiary", pGloblas.pSubsidiary);
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

    pagedData.pageRanges.forEach((pageRange) => {
      page = pagedData.fetch({
        index: pageRange.index,
      });

      page.data.forEach((result) => {
        columns = result.columns;
        arrAux = new Array();

        log.debug("result", result);

        // 0. CÓDIGO
        arrAux[0] = result.getValue(columns[0]);

        // 1. DENOMINACIÓN
        arrAux[1] = result.getValue(columns[1]);

        // 2. SALDO FINAL
        arrAux[2] = result.getValue(columns[2]);

        //3. fecha
        arrAux[3] = result.getText(columns[3]);

        // arrResult.push(arrAux);
        // let year = arrAux[3].split(" ")[1];
        // log.debug("year", year);
        // log.debug("pGloblas.pAnio", pGloblas.pAnio);

        // if (year == pGloblas.pAnio) {
          arrResult.push(arrAux);
        // }
      });
    });
    return arrResult;
  };

  const getSubdiary = () => {
    if (featSubsidiary) {
      // log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary);
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
    pGloblas = objContext.getParameter("custscript_pe_3_10_dettributos_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = { recordID: 10, reportID: 130, subsidiary: 3, anioCon: "2023", periodCon: 113 };

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
