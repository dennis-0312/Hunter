/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * Task                         Date            Author                                      Remarks
 * Formato 3.12                  28 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>          LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
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
        tipoDNIProveedor: dataMap[0],
        numDNIProveedor: dataMap[1],
        nombresProveedor: dataMap[2],
        fechaEmision: dataMap[3],
        nroComprobante: dataMap[4],
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

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.12");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;

    transactionJSON["transactions"] = {};
    hasInfo = 0;
    context.output.iterator().each(function (key, value) {
      hasInfo = 1;
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
          name: "AuxiliarFormato3.12",
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

    log.debug("transactions", transactions);

    for (var k in transactions) {
      let IDD = transactions[k].key;
      cantidadLinea = cantidadLinea + 1;
      if (!jsonTransacion[IDD]) {
        let monto = parseFloat(transactions[k].monto).toFixed(2);
        jsonTransacion[IDD] = {
          number: cantidadFor,
          tipoDNIProveedor: transactions[k].tipoDNIProveedor,
          numDNIProveedor: transactions[k].numDNIProveedor,
          nombresProveedor: transactions[k].nombresProveedor.replace(/&/g, "&amp;").toLocaleUpperCase(),
          fechaEmision: transactions[k].fechaEmision,
          nroComprobante: transactions[k].nroComprobante,
          monto: numberWithCommas(monto),
        };
        cantidadFor = cantidadFor + 1;
        totalAmount = totalAmount + Number(transactions[k].monto);
      }
      if (cantidadLinea <= 25) {
        montoviene = Number(montoviene) + Number(transactions[k].monto);
        cantidadAnterio = cantidadLinea;
      } else {
        
        jsonTransacionvine.push({
          montoviene: numberWithCommas(montoviene.toFixed(2)),
          cantidadFor: cantidadFor - 1
        });


        cantidadLinea = 0;
        cantidadLinea = cantidadLinea + 1;
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
        formato: 'FORMATO 3.12: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 42 - PROVEEDORES"',
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
    return `LE${companyRuc}${pGloblas.pAnio}1231031200071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
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
    var aux = file.load("./Template/PE_Template_3_12_DetProveedores.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.12: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 42 - PROVEEDORES"
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_12",
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

        // 0. DNI:  TIPO (TABLA 2) - PROVEEDOR
        arrAux[0] = result.getValue(columns[0]);

        // 1. DNI: NÚMERO - PROVEEDOR
        arrAux[1] = result.getValue(columns[1]);

        // 2. APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL - PROVEEDOR
        arrAux[2] = result.getValue(columns[2]);

        //3. FECHA DE EMISIÓN DEL COMPROBANTE DE PAGO
        arrAux[3] = result.getValue(columns[3]);

        //4. NRO. DE COMPROBANTE
        arrAux[4] = result.getValue(columns[4]);

        //5. MONTO DE LA CUENTA POR PAGAR
        arrAux[5] = result.getValue(columns[5]);

        let year = arrAux[3].split("/")[2];

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
        arrAux[0] = '1'
        arrAux[1] = '7187996'+i
        arrAux[2] = 'PEDRO MATEO JUAN'
        arrAux[3] = '16/06/2023'
        arrAux[4] = 'F001-00000054'
        arrAux[5] = '494.42'
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
    pGloblas = objContext.getParameter("custscript_pe_3_12_detproveedores_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = { recordID: 10, reportID: 132, subsidiary: 3, anioCon: "2023", periodCon: 113 };

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
