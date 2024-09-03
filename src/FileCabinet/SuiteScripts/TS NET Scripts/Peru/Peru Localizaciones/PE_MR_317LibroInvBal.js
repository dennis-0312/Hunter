/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.17           29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 3.17
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
        col1: dataMap[0],
        col2: dataMap[1],
        col3: dataMap[2],
        col4: dataMap[3],
        col5: dataMap[4],
        col6: dataMap[5],
        col7: dataMap[6],
        col8: dataMap[7],
        col9: dataMap[8],
        col10: dataMap[9],
        col11: dataMap[10],
        col12: dataMap[11],
        col13: dataMap[12],
        col14: dataMap[13],
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

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.17");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;

    transactionJSON["transactions"] = [];
    context.output.iterator().each(function (key, value) {
      value = JSON.parse(value);

      transactionJSON["transactions"].push(value);
      return true;
    });
    log.debug("transactionJSON", transactionJSON["transactions"]);

    var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

    log.debug("jsonAxiliar", jsonAxiliar);
    //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
    if (!isObjEmpty(transactionJSON["transactions"])) {
      var renderer = render.create();

      renderer.templateContent = getTemplate();

      renderer.addCustomDataSource({
        format: render.DataSource.JSON,
        alias: "input",
        data: JSON.stringify(jsonAxiliar),
      });

      /**** *
            stringXML2 = renderer.renderAsString();
            
            var FolderId = FOLDER_ID;
         
            if (FolderId != '' && FolderId != null) {
                // Crea el archivo
                var fileAux = file.create({
                    name: 'Auxiliar317',
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
      jsonFinal = [],
      totalLine3 = 0,
      totalLine4 = 0,
      totalLine5 = 0,
      totalLine6 = 0,
      totalLine7 = 0,
      totalLine8 = 0,
      totalLine9 = 0,
      totalLine10 = 0,
      totalLine11 = 0,
      totalLine12 = 0,
      totalLine13 = 0,
      totalLine14 = 0;

    let transactionFinal = [];

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    log.debug("transactions", transactions);

    transactions.forEach((line) => {
      totalLine3 = parseFloat(totalLine3) + parseFloat(line.col3);
      totalLine4 = parseFloat(totalLine4) + parseFloat(line.col4);
      totalLine5 = parseFloat(totalLine5) + parseFloat(line.col5);
      totalLine6 = parseFloat(totalLine6) + parseFloat(line.col6);
      totalLine7 = parseFloat(totalLine7) + parseFloat(line.col7);
      totalLine8 = parseFloat(totalLine8) + parseFloat(line.col8);
      totalLine9 = parseFloat(totalLine9) + parseFloat(line.col9);
      totalLine10 = parseFloat(totalLine10) + parseFloat(line.col10);
      totalLine11 = parseFloat(totalLine11) + parseFloat(line.col11);
      totalLine12 = parseFloat(totalLine12) + parseFloat(line.col12);
      totalLine13 = parseFloat(totalLine13) + parseFloat(line.col13);
      totalLine14 = parseFloat(totalLine14) + parseFloat(line.col14);

      transactionFinal.push({
        col1: line.col1,
        col2: line.col2,
        col3: numberWithCommas(Number(line.col3).toFixed(2)),
        col4: numberWithCommas(Number(line.col4).toFixed(2)),
        col5: numberWithCommas(Number(line.col5).toFixed(2)),
        col6: numberWithCommas(Number(line.col6).toFixed(2)),
        col7: numberWithCommas(Number(line.col7).toFixed(2)),
        col8: numberWithCommas(Number(line.col8).toFixed(2)),
        col9: numberWithCommas(Number(line.col9).toFixed(2)),
        col10: numberWithCommas(Number(line.col10).toFixed(2)),
        col11: numberWithCommas(Number(line.col11).toFixed(2)),
        col12: numberWithCommas(Number(line.col12).toFixed(2)),
        col13: numberWithCommas(Number(line.col13).toFixed(2)),
        col14: numberWithCommas(Number(line.col14).toFixed(2)),
      });
    });

    log.debug("jsonTransacion", jsonTransacion);
    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });

    let naturalezaPerdida = 0;
    let naturalezaGanancia = 0;
    let funcionPerdida = 0;
    let funcionGanancia = 0;

    let totalNaturaleza = 0;
    let totalFuncion = 0;

    if(Number(totalLine11) - Number(totalLine12) > 0){
      naturalezaGanancia = Number(totalLine11) - Number(totalLine12)
      totalNaturaleza = Number(totalLine11);
    } else {
      naturalezaPerdida = Number(totalLine12) - Number(totalLine11)
      totalNaturaleza = Number(totalLine12);
    }

    if(Number(totalLine13) - Number(totalLine14) > 0){
      funcionGanancia = Number(totalLine13) - Number(totalLine14)
      totalFuncion = Number(totalLine13);
    } else {
      funcionPerdida = Number(totalLine14) - Number(totalLine13)
      totalFuncion = Number(totalLine14);
    }

    naturalezaPerdida = naturalezaPerdida.toFixed(2)
    naturalezaGanancia = naturalezaGanancia.toFixed(2)
    funcionPerdida = funcionPerdida.toFixed(2)
    funcionGanancia = funcionGanancia.toFixed(2)
    
    let jsonCompany = {
      company: {
        firtsTitle: 'FORMATO 3.17 : "LIBRO DE INVENTARIOS Y BALANCES - BALANCE DE COMPROBACIÓN"',
        secondTitle: pGloblas.pAnio,
        thirdTitle: companyRuc.replace(/&/g, "&amp;"),
        fourthTitle: companyName.replace(/&/g, "&amp;").toLocaleUpperCase(),
      },
      totals: {
        col1: "",
        col2: "",
        col3: numberWithCommas(Number(totalLine3).toFixed(2)),
        col4: numberWithCommas(Number(totalLine4).toFixed(2)),
        col5: numberWithCommas(Number(totalLine5).toFixed(2)),
        col6: numberWithCommas(Number(totalLine6).toFixed(2)),
        col7: numberWithCommas(Number(totalLine7).toFixed(2)),
        col8: numberWithCommas(Number(totalLine8).toFixed(2)),
        col9: numberWithCommas(Number(totalLine9).toFixed(2)),
        col10: numberWithCommas(Number(totalLine10).toFixed(2)),
        col11: numberWithCommas(Number(totalLine11).toFixed(2)),
        col12: numberWithCommas(Number(totalLine12).toFixed(2)),
        col13: numberWithCommas(Number(totalLine13).toFixed(2)),
        col14: numberWithCommas(Number(totalLine14).toFixed(2)),
      },
      resultado: {
        naturalezaPerdida: numberWithCommas(naturalezaPerdida),
        naturalezaGanancia: numberWithCommas(naturalezaGanancia),
        funcionPerdida: numberWithCommas(funcionPerdida),
        funcionGanancia: numberWithCommas(funcionGanancia),
        totalNaturaleza: numberWithCommas(totalNaturaleza),
        totalFuncion: numberWithCommas(totalFuncion),
      },
      movements: transactionFinal
    };

    return jsonCompany;
  };

  const saveFile = (stringValue) => {
    asinfo = "1";

    // var periodname = getPeriodName(pGloblas.pPeriod);
    // var periodostring = retornaPeriodoString(periodname);
    var periodAnioCon = pGloblas.pAnio;
    var getruc = getRUC(pGloblas.pSubsidiary);
    fedIdNumb = getruc;
    var fileAuxliar = stringValue;
    var urlfile = "";
    //LERRRRRRRRRRRAAAAMMDD031700CCOIM1.TXT
    nameReport = "LE" + fedIdNumb + periodAnioCon + "1231" + "031700" + "01" + "1" + asinfo + "11_" + pGloblas.pRecordID + ".pdf";
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
    var aux = file.load("./Template/PE_Template317LibroInvBal.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // PE - Libro de Inventario y Balances 3.17
    var savedSearch = search.load({
      id: "customsearch_pe_bc_3_17",
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

    savedSearch.columns.push(
      search.createColumn({
        name: "formulatext",
        summary: "GROUP",
        formula: "NVL({account.description},'')",
      })
    );

    var pagedData = savedSearch.runPaged({
      pageSize: 1000,
    });

    log.debug("pagedData", pagedData.pageRanges.length);

    var page, columns;
    var counter = 0;
    pagedData.pageRanges.forEach(function (pageRange) {
      page = pagedData.fetch({
        index: pageRange.index,
      });

      page.data.forEach(function (result) {
        columns = result.columns;
        arrAux = new Array();
        counter++;

        // 0. CUENTA Y SUBCUENTA CONTABLE - NÚMERO
        arrAux[0] = result.getValue(columns[1]);
        if (arrAux[0] == "- None -") {
          arrAux[0] = "";
        }

        // 1. CUENTA Y SUBCUENTA CONTABLE - DENOMINACIÓN
        arrAux[1] = result.getValue(columns[20]);
        if (arrAux[1] == "- None -") {
          arrAux[1] = "";
        }

        // 2. SALDOS INICIALES DEUDOR
        arrAux[2] = parseFloat(result.getValue(columns[2])).toFixed(2);

        // 3. SALDOS INICIALES ACREEDOR
        arrAux[3] = parseFloat(result.getValue(columns[3])).toFixed(2);

        // 4. MOVIMIENTOS DEBE
        arrAux[4] = parseFloat(result.getValue(columns[4])).toFixed(2);

        // 5. MOVIMIENTOS HABER
        arrAux[5] = parseFloat(result.getValue(columns[5])).toFixed(2);

        // 6. SALDOS FINALES DEUDOR
        arrAux[6] = parseFloat(result.getValue(columns[6])).toFixed(2);

        // 7. SALDOS FINALES ACREEDOR
        arrAux[7] = parseFloat(result.getValue(columns[7])).toFixed(2);

        // 8. SALDOS FINALES ACTIVO
        arrAux[8] = parseFloat(result.getValue(columns[12])).toFixed(2);

        // 9. SALDOS FINALES PASIVO
        arrAux[9] = parseFloat(result.getValue(columns[13])).toFixed(2);

        // 10. SALDOS FINALES ESTADO NATURALEZA PERDIDA
        arrAux[10] = parseFloat(result.getValue(columns[14])).toFixed(2);

        // 11. SALDOS FINALES ESTADO NATURALEZA GANACIA
        arrAux[11] = parseFloat(result.getValue(columns[15])).toFixed(2);

        // 12. SALDOS FINALES ESTADO FUNCION PERDIDA
        arrAux[12] = parseFloat(result.getValue(columns[14])).toFixed(2);

        // 13. SALDOS FINALES ESTADO FUNCION GANACIA
        arrAux[13] = parseFloat(result.getValue(columns[15])).toFixed(2);

        //19. AÑO

        let yearResult = result.getValue(columns[19]);

        // let yearResult = result.getValue(columns[0]).split("/")[0];
        // log.debug('yearResult', yearResult)
        // log.debug('pGloblas.pAnio', pGloblas.pAnio)
        if (yearResult == pGloblas.pAnio) {
          arrResult.push(arrAux);
        }
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
    pGloblas = objContext.getParameter("custscript_pe_317_libinvbal_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    /*pGloblas = {
            recordID: '',
            reportID: 113,
            subsidiary: 3,
            periodCon: 111
        }*/
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
    log.debug("featSubsidiary", featSubsidiary);
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

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});