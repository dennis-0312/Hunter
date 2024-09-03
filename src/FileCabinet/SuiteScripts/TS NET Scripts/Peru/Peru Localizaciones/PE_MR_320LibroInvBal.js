/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.20          29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 3.20
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

  var hasInfo = 0;
  var month = "00";
  var year = "";

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
        dato4: dataMap[3],
        dato_descripcion: dataMap[4],
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

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Libro de Inventarios y Balances 3.20");
    var transactionJSON = {};
    transactionJSON["parametros"] = pGloblas;
    transactionJSON["transactions"] = [];
    context.output.iterator().each((key, value) => {
      value = JSON.parse(value);
      //transactionJSON["transactions"].push(value);
      transactionJSON["transactions"][value.dato3] = value;
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
        format: render.DataSource.OBJECT,
        alias: "input",
        data: {
          data: JSON.stringify(jsonAxiliar),
        },
      });

      /**** */
            stringXML2 = renderer.renderAsString();
            
            var FolderId = libPe.callFolder();
         
            if (FolderId != '' && FolderId != null) {
                // Crea el archivo
                var fileAux = file.create({
                    name: 'Auxiliar320',
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
      saldo = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    log.debug("jsonTransacion", jsonTransacion);

    var cont = 0;

    var totales = {};
    totales.ventas_netas_ingresos_operacionales = 0;
    totales.otros_ingresos_operacionales = 0;
    totales.total_ingresos_brutos = 0;
    totales.costo_de_ventas = 0;
    totales.utilidad_bruta = 0;

    totales.gastos_de_administracion = 0;
    totales.gastos_de_venta = 0;
    totales.depreciacion_y_amortizacion = 0;
    totales.utilidad_operativa = 0;

    totales.ingresos_financieros = 0;
    totales.gastos_financieros = 0;
    totales.otros_ingresos_de_gestion = 0;
    totales.perdida_por_diferencia_de_cambio = 0;
    totales.ganancia_por_diferencia_de_cambio = 0;
    totales.otros_gastos = 0;
    totales.resultados_por_exposicion_a_la_inflacion = 0;

    totales.impuesto_a_la_renta_y_partidas_extraordinaria = 0;
    totales.participaciones = 0;
    totales.impuesto_a_la_renta = 0;

    totales.resultados_antes_de_partidas_extraordinarias = 0;
    totales.ingresos_extraordinarios = 0;
    totales.gastos_extraordinarios = 0;

    totales.resultado_antes_de_interes_minoritario = 0;
    totales.interes_minoritario = 0;

    totales.utilidad_perdida_neta_del_ejercicio = 0;
    for (var k in transactions) {
      hasInfo = 1;

      cont++;
      let IDD = cont;

      if (!jsonTransacion[IDD]) {
        let dato_4 = parseFloat(transactions[k].dato4);
        log.debug("dato_4", dato_4);

        // let debitoFormat = numberWithCommas(transactions[k].debito);
        // log.debug('debitoFormat', debitoFormat);
        jsonTransacion[IDD] = {
          dato1: transactions[k].dato1,
          dato2: transactions[k].dato2,
          dato3: transactions[k].dato3,
          dato4: dato_4,
        };
        saldo += dato_4;
        // totalCredito = totalCredito + Number(transactions[k].credito);

        switch (transactions[k].dato_descripcion) {
          case "Ventas Netas (ingresos operacionales)":
            totales.ventas_netas_ingresos_operacionales += dato_4;
            break;
          case "Otros Ingresos Operacionales":
            totales.otros_ingresos_operacionales += dato_4;
            break;
          case "Costo de ventas":
            totales.costo_de_ventas += dato_4;
            break;
          case "Gastos de Administración":
            totales.gastos_de_administracion += dato_4;
            break;
          case "Gastos de Venta":
            totales.gastos_de_venta += dato_4;
            break;
          case "Depreciación y Amortización":
            totales.depreciacion_y_amortizacion += dato_4;
            break;
          case "Ingresos Financieros":
            totales.ingresos_financieros += dato_4;
            break;
          case "Gastos Financieros":
            totales.gastos_financieros += dato_4;
            break;
          case "Otros ingresos de gestión":
            totales.otros_ingresos_de_gestion += dato_4;
            break;
          case "Perdida por Diferencia de Cambio":
            totales.perdida_por_diferencia_de_cambio += dato_4;
            break;
          case "Ganancia por Diferencia de Cambio":
            totales.ganancia_por_diferencia_de_cambio += dato_4;
            break;
          case "Otros Gastos":
            totales.otros_gastos += dato_4;
            break;
          case "Resultados por Exposición a la Inflación":
            totales.resultados_por_exposicion_a_la_inflacion += dato_4;
            break;
          case "Participaciones":
            totales.participaciones += dato_4;
            break;
          case "Impuesto a la Renta":
            totales.impuesto_a_la_renta += dato_4;
            break;
          case "Ingresos Extraordinarios":
            totales.ingresos_extraordinarios += dato_4;
            break;
          case "Gastos Extraordinarios":
            totales.gastos_extraordinarios += dato_4;
            break;
          case "Interés Minoritario":
            totales.interes_minoritario += dato_4;
            break;
        }
      }
    }

    totales.total_ingresos_brutos = totales.ventas_netas_ingresos_operacionales + totales.otros_ingresos_operacionales;
    totales.utilidad_bruta = totales.costo_de_ventas;
    totales.utilidad_operativa = totales.gastos_de_administracion + totales.gastos_de_venta + totales.depreciacion_y_amortizacion;

    totales.impuesto_a_la_renta_y_partidas_extraordinaria = totales.participaciones + totales.impuesto_a_la_renta;
    totales.resultados_antes_de_partidas_extraordinarias = totales.ingresos_extraordinarios + totales.gastos_extraordinarios;
    totales.resultado_antes_de_interes_minoritario = totales.interes_minoritario;

    totales.utilidad_perdida_neta_del_ejercicio = totales.resultado_antes_de_interes_minoritario;

    //formato
    totales.ventas_netas_ingresos_operacionales = numberWithCommas(roundTwoDecimals(totales.ventas_netas_ingresos_operacionales).toFixed(2));
    totales.otros_ingresos_operacionales = numberWithCommas(roundTwoDecimals(totales.otros_ingresos_operacionales).toFixed(2));
    totales.total_ingresos_brutos = numberWithCommas(roundTwoDecimals(totales.total_ingresos_brutos).toFixed(2));
    totales.costo_de_ventas = numberWithCommas(roundTwoDecimals(totales.costo_de_ventas).toFixed(2));
    totales.utilidad_bruta = numberWithCommas(roundTwoDecimals(totales.utilidad_bruta).toFixed(2));
    totales.gastos_de_administracion = numberWithCommas(roundTwoDecimals(totales.gastos_de_administracion).toFixed(2));
    totales.gastos_de_venta = numberWithCommas(roundTwoDecimals(totales.gastos_de_venta).toFixed(2));
    totales.depreciacion_y_amortizacion = numberWithCommas(roundTwoDecimals(totales.depreciacion_y_amortizacion).toFixed(2));
    totales.utilidad_operativa = numberWithCommas(roundTwoDecimals(totales.utilidad_operativa).toFixed(2));
    totales.ingresos_financieros = numberWithCommas(roundTwoDecimals(totales.ingresos_financieros).toFixed(2));
    totales.gastos_financieros = numberWithCommas(roundTwoDecimals(totales.gastos_financieros).toFixed(2));
    totales.otros_ingresos_de_gestion = numberWithCommas(roundTwoDecimals(totales.otros_ingresos_de_gestion).toFixed(2));
    totales.perdida_por_diferencia_de_cambio = numberWithCommas(roundTwoDecimals(totales.perdida_por_diferencia_de_cambio).toFixed(2));
    totales.ganancia_por_diferencia_de_cambio = numberWithCommas(roundTwoDecimals(totales.ganancia_por_diferencia_de_cambio).toFixed(2));
    totales.otros_gastos = numberWithCommas(roundTwoDecimals(totales.otros_gastos).toFixed(2));
    totales.resultados_por_exposicion_a_la_inflacion = numberWithCommas(roundTwoDecimals(totales.resultados_por_exposicion_a_la_inflacion).toFixed(2));
    totales.impuesto_a_la_renta_y_partidas_extraordinaria = numberWithCommas(roundTwoDecimals(totales.impuesto_a_la_renta_y_partidas_extraordinaria).toFixed(2));
    totales.participaciones = numberWithCommas(roundTwoDecimals(totales.participaciones).toFixed(2));
    totales.impuesto_a_la_renta = numberWithCommas(roundTwoDecimals(totales.impuesto_a_la_renta).toFixed(2));
    totales.resultados_antes_de_partidas_extraordinarias = numberWithCommas(roundTwoDecimals(totales.resultados_antes_de_partidas_extraordinarias).toFixed(2));
    totales.ingresos_extraordinarios = numberWithCommas(roundTwoDecimals(totales.ingresos_extraordinarios).toFixed(2));
    totales.gastos_extraordinarios = numberWithCommas(roundTwoDecimals(totales.gastos_extraordinarios).toFixed(2));
    totales.resultado_antes_de_interes_minoritario = numberWithCommas(roundTwoDecimals(totales.resultado_antes_de_interes_minoritario).toFixed(2));
    totales.interes_minoritario = numberWithCommas(roundTwoDecimals(totales.interes_minoritario).toFixed(2));
    totales.utilidad_perdida_neta_del_ejercicio = numberWithCommas(roundTwoDecimals(totales.utilidad_perdida_neta_del_ejercicio).toFixed(2));

    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });

    year = periodSearch.periodname.split(" ")[1];

    let jsonCompany = {
      company: {
        firtsTitle: 'FORMATO 3.20: "LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE GANANCIAS Y PÉRDIDAS POR FUNCIÓN DEL 01.01 AL 31.12"',
        secondTitle: periodSearch.periodname.split(" ")[1],
        thirdTitle: companyRuc.replace(/&/g, "&amp;"),
        fourthTitle: companyName.replace(/&/g, "&amp;"),
      },
      totals: {
        dato4: Number(saldo).toFixed(2),
      },
      movements: jsonTransacion,
      totales: totales,
    };

    return jsonCompany;
  };

  const getFileName = () => {
    return `LE${companyRuc}${year}${month}00032000001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
  };

  const saveFile = (stringValue) => {
    var fileAuxliar = stringValue;
    var urlfile = "";
    // if (featSubsidiary) {
    //     nameReport = 'Formato 3.20_' + companyName + '.' + formatReport;
    // } else {
    //     nameReport = 'Formato 3.20_' + '.' + formatReport;
    // }
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

    log.debug("pGloblas.pRecordID", pGloblas.pRecordID);
    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template320LibroInvBal.xml");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // PE - Libro de Inventario y Balances - Estado de Resultados - 3.20
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_20",
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

    year = pGloblas.pAnio

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

        // 0. CODIGO
        arrAux[0] = result.getValue(columns[0]);

        // 1. MONTO
        arrAux[1] = result.getValue(columns[1]);

        // 1. MONTO
        arrAux[2] = result.getValue(columns[2]);

        // 1. MONTO
        arrAux[3] = result.getValue(columns[3]);

        // NOMBRE CODIGO 3.20
        arrAux[4] = result.getValue(columns[6]);

        arrResult.push(arrAux);
      });
    });
    log.debug("arrResult", arrResult);

    //!DATA PRUEBA - Inicio
    // for(var i=0;i<10;i++){
    //     arrAux = new Array();
    //     arrAux[0] = '123'
    //     arrAux[1] = '456789.00'
    //     arrResult.push(arrAux);
    // }
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
      companyRuc = "";
    }
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter('custscript_pe_320libinvbal_params'); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = {
    //   recordID: "",
    //   reportID: 109,
    //   subsidiary: 3,
    //   periodCon: 111,
    // };
    log.debug("previo", pGloblas);

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      pAnio: pGloblas.anioCon

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

  const roundTwoDecimals = (value) => {
    return Math.round(value * 100) / 100;
  };

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});
