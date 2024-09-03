/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.19          29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 3.19
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

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;
  //const FOLDER_ID = libPe.callFolder();

  //
  var cuentas = [
    "1. Efecto acumulado de los cambios en las políticas contables y la corrección de errores sustanciales",
    "2. Distribuciones o asignaciones de utilidades efectuadas en el período",
    "3. Dividendos y participaciones acordados durante el período",
    "4. Nuevos aportes de accionistas",
    "5. Movimiento de prima en la colocación de aportes y donaciones",
    "6. Incrementos o disminuciones por fusiones o escisiones",
    "7. Revaluación de activos",
    "8. Capitalización de partidas patrimoniales",
    "9. Redención de Acciones de Inversión o reducción de capital",
    "10. Utilidad (pérdida) Neta del ejercicio",
    "11. Otros incrementos o disminuciones de las partidas patrimoniales",
  ];
  var row1Column1 = ["4D0126", "4D0127"];
  var row2Column3 = ["4D0134"];
  var row3Column2 = ["4D0104", "4D0204"];
  var row4Column3 = ["4D0132", "4D0133", "4D0232"];
  var row11Column2 = ["4D0105", "4D0205"];
  var row11Column6 = ["4D0135", "4D0114", "4D0112", "4D0212", "4D0233", "4D0214", "4D0235", "4D0234"];

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
        dato1: dataMap[0],
        dato2: dataMap[1],
        dato3: dataMap[2],
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
    getParameters();
    getSubdiary();

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.19");
    var transactionJSON = {};
    transactionJSON["parametros"] = pGloblas;
    transactionJSON["transactions"] = {};
    context.output.iterator().each((key, value) => {
      value = JSON.parse(value);
      //transactionJSON["transactions"].push(value);
      transactionJSON["transactions"][value.dato2] = value;
      return true;
    });
    log.debug("transactionJSON", transactionJSON["transactions"]);
    var jsonAxiliar = getJsonData(transactionJSON["transactions"]);
    //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
    log.debug("jsonAxiliar", jsonAxiliar);
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

      /**** */
      // stringXML2 = renderer.renderAsString();

      // var FolderId = FOLDER_ID;

      // if (FolderId != "" && FolderId != null) {
      //   // Crea el archivo
      //   var fileAux = file.create({
      //     name: "Auxiliar319",
      //     fileType: file.Type.PLAINTEXT,
      //     contents: stringXML2,
      //     encoding: file.Encoding.UTF8,
      //     folder: FolderId,
      //   });

      //   var idfile = fileAux.save(); // Termina de grabar el archivo

      //   log.debug({
      //     title: "URL ARCHIVO TEMP",
      //     details: idfile,
      //   });
      // }

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

  const getJsonData = (transactions) => {
    let userTemp = runtime.getCurrentUser(),
      useID = userTemp.id,
      jsonTransacion = {},
      saldo = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    log.debug("transactions", transactions);

    var total1 = 0; // 4D0126 + 4D0127
    var total2 = 0; // 4D0134
    var total3 = 0; // 4D0104 + 4D0204
    var total4 = 0; // 4D0132 + 4D0133 + 4D0232
    var total5 = 0; // 4D0105 + 4D0205
    var total6 = 0; // 4D0135 + 4D0114 + 4D0112 + 4D0212 + 4D0233 + 4D0214 + 4D0235 + 4D0234
    var lastYear = 0; // 4D0101

    let IDD = 0;

    for (var k in transactions) {
      let dato_2 = transactions[k].dato2;
      let dato_3 = parseFloat(transactions[k].dato3);
      log.debug("dato_2", dato_2);
      //if dato_2  is in row1Column1
      if (row1Column1.includes(dato_2)) {
        total1 += dato_3;
      }
      if (row2Column3.includes(dato_2)) {
        total2 += dato_3;
      }
      if (row3Column2.includes(dato_2)) {
        total3 += dato_3;
      }
      if (row4Column3.includes(dato_2)) {
        total4 += dato_3;
      }
      if (row11Column2.includes(dato_2)) {
        total5 += dato_3;
      }
      if (row11Column6.includes(dato_2)) {
        total6 += dato_3;
      }
      if (dato_2 == "4D0101") {
        lastYear += dato_3;
      }
    }

    log.debug("jsonTransacion", jsonTransacion);
    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });

    let totalv2 = Number(total3) + Number(total5) + Number(lastYear);
    let totalv3 = Number(total2) + Number(total4);
    let pos8 = Number(total5) + Number(total6);
    let pos8_b = Number(lastYear) + Number(total2);
    let totalFinal = Number(total1) + Number(pos8_b) + Number(total3) + Number(total4) + Number(pos8);

    let jsonCompany = {
      company: {
        firtsTitle: 'FORMATO 3.19 : "LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE CAMBIOS EN EL PATRIMONIO NETO DEL 01.01 AL 31.12"',
        secondTitle: periodSearch.periodname.split(" ")[1],
        thirdTitle: companyRuc.replace(/&/g, "&amp;"),
        fourthTitle: companyName.replace(/&/g, "&amp;"),
      },
      account: {
        title1: "SALDOS AL 31 DE DICIEMBRE DE " + periodSearch.periodname.split(" ")[1],
        title2: "SALDOS AL 31 DE DICIEMBRE DE " + periodSearch.periodname.split(" ")[1],
      },
      lastYear: {
        totalCapital: numberWithCommas(lastYear.toFixed(2)),
      },
      vTotals: {
        totalv1: numberWithCommas(total1.toFixed(2)),
        totalv2: numberWithCommas(totalv2.toFixed(2)),
        totalv3: numberWithCommas(totalv3.toFixed(2)),
        totalv4: "0.00",
        totalv5: "0.00",
        totalv6: numberWithCommas(total6.toFixed(2)),
        totalv7: "0.00",
        totalv8: numberWithCommas(totalFinal.toFixed(2)),
      },
      movements: {
        1: {
          desc: cuentas[0],
          pos1: numberWithCommas(total1.toFixed(2)),
          pos2: "0.00",
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: numberWithCommas(total1.toFixed(2)),
        },
        2: {
          desc: cuentas[1],
          pos1: "0.00",
          pos2: numberWithCommas(lastYear.toFixed(2)),
          pos3: numberWithCommas(total2.toFixed(2)),
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: numberWithCommas(pos8_b.toFixed(2)),
        },
        3: {
          desc: cuentas[2],
          pos1: "0.00",
          pos2: numberWithCommas(total3.toFixed(2)),
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: numberWithCommas(total3.toFixed(2)),
        },
        4: {
          desc: cuentas[3],
          pos1: "0.00",
          pos2: "0.00",
          pos3: numberWithCommas(total4.toFixed(2)),
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: numberWithCommas(total4.toFixed(2)),
        },
        5: {
          desc: cuentas[4],
          pos1: "0.00",
          pos2: "0.00",
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: "0.00",
        },
        6: {
          desc: cuentas[5],
          pos1: "0.00",
          pos2: "0.00",
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: "0.00",
        },
        7: {
          desc: cuentas[6],
          pos1: "0.00",
          pos2: "0.00",
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: "0.00",
        },
        8: {
          desc: cuentas[7],
          pos1: "0.00",
          pos2: "0.00",
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: "0.00",
        },
        9: {
          desc: cuentas[8],
          pos1: "0.00",
          pos2: "0.00",
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: "0.00",
        },
        10: {
          desc: cuentas[9],
          pos1: "0.00",
          pos2: "0.00",
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: "0.00",
          pos7: "0.00",
          pos8: "0.00",
        },
        11: {
          desc: cuentas[10],
          pos1: "0.00",
          pos2: numberWithCommas(total5.toFixed(2)),
          pos3: "0.00",
          pos4: "0.00",
          pos5: "0.00",
          pos6: numberWithCommas(total6.toFixed(2)),
          pos7: "0.00",
          pos8: numberWithCommas(pos8.toFixed(2)),
        },
      },
    };

    return jsonCompany;
  };

  const saveFile = (stringValue) => {
    asinfo = "1";
    var periodAnioCon = pGloblas.anioCon;
    var getruc = getRUC(pGloblas.pSubsidiary);
    fedIdNumb = getruc;
    var fileAuxliar = stringValue;
    var urlfile = "";
    //LERRRRRRRRRRRAAAAMMDD031900CCOIM1.TXT
    nameReport = "LE" + fedIdNumb + periodAnioCon + "1231" + "031900" + "01" + "1" + asinfo + "11_" + pGloblas.pRecordID + ".pdf";
    log.debug("nameReport", nameReport);

    var folderID = libPe.callFolder();

    fileAuxliar.name = nameReport;
    fileAuxliar.folder = folderID;

    var fileID = fileAuxliar.save();

    let auxFile = file.load({
      id: fileID,
    });
    urlfile += auxFile.url;

    // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template319LibroInvBal.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.19 Libro Inventario y Balance
    var savedSearch = search.load({
      id: "customsearch_pe_319_lib_invbal",
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

    pagedData.pageRanges.forEach(function (pageRange) {
      page = pagedData.fetch({
        index: pageRange.index,
      });

      page.data.forEach(function (result) {
        columns = result.columns;
        arrAux = new Array();
        log.debug("result", result);

        // 0. CODIGO
        arrAux[0] = result.getValue(columns[0]);

        // 1. MONTO
        arrAux[1] = result.getValue(columns[1]);

        // 1. saldo
        arrAux[2] = result.getValue(columns[2]);

        arrResult.push(arrAux);
      });
    });
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
    pGloblas = objContext.getParameter("custscript_pe_319libinvbal_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = {
    //         recordID: '',
    //         reportID: 113,
    //         subsidiary: 3,
    //   periodCon: 111,
    //   anioCon: 2023,

    // }

    log.debug("previo", pGloblas);

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      anioCon: pGloblas.anioCon,
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
