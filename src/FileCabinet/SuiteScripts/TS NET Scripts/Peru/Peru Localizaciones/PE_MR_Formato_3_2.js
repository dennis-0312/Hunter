/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.2           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 3.2
 *
 */

define(["N/format", "N/runtime", "N/search", "N/config", "N/render", "N/record", "N/file", "./PE_LIB_Libros.js"], (format, runtime, search, config, render, record, file, libPe) => {
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
  var hasInfo = "";
  var year = "";
  var month = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;

  const getInputData = () => {
    try {
      getParameters();
      return getTransactions();
    } catch (e) {
      log.error("getInputData - Error:" + e);
    }
  };

  const map = (context) => {
    try {
      var key = context.key;
      var dataMap = JSON.parse(context.value);
      var resultTransactions = {
        dato1: dataMap[0],
        dato2: dataMap[1],
        dato3: dataMap[2] == "- None -" ? "" : dataMap[2],
        dato4: dataMap[3] == "- None -" ? "" : dataMap[3],
        dato5: dataMap[4] == "- None -" ? "" : dataMap[4],
        dato6: dataMap[5] == "- None -" ? "" : dataMap[5],
        dato7: dataMap[6] == "" ? 0 : dataMap[6],
        dato8: dataMap[7] == "" ? 0 : dataMap[7],
        dato9: dataMap[8],
        dato10: dataMap[9],
      };

      context.write({
        key: key,
        value: resultTransactions,
      });
    } catch (e) {
      log.error("map - Error:" + e);
    }
  };

  const summarize = (context) => {
    getParameters();
    getSubdiary();
    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.2");
    var transactionJSON = {};
    transactionJSON["parametros"] = pGloblas;
    transactionJSON["transactions"] = {};
    hasInfo = 0;
    context.output.iterator().each((key, value) => {
      hasInfo = 1;
      value = JSON.parse(value);
      transactionJSON["transactions"][value.dato2] = value;
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
      /**** */
      stringXML2 = renderer.renderAsString();

      stringXML = renderer.renderAsPdf();
      saveFile(stringXML);
      log.debug("INFO", "Termino");
      return true;
    } else {
      log.debug("ERROR", "No data");
      libPe.noData(pGloblas.pRecordID);
    }
  };

  const getJsonData = (transactions) => {
    let userTemp = runtime.getCurrentUser(),
      useID = userTemp.id,
      jsonTransacion = {},
      totalDebito = 0,
      totalCredito = 0,
      saldoDebito = 0,
      saldoCredito = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;


    for (var k in transactions) {
      let IDD = transactions[k].dato2;
      if (!jsonTransacion[IDD]) {
        let dato_7 = parseFloat(transactions[k].dato7);
        let dato_8 = parseFloat(transactions[k].dato8);

        jsonTransacion[IDD] = {
          codigo: transactions[k].dato2,
          denominacion: transactions[k].dato3,
          entidadFinanciera: transactions[k].dato4,
          numeroCuenta: transactions[k].dato5,
          tipoMoneda: transactions[k].dato6,
          deudor: dato_7,
          acreedor: dato_8,
        };
        saldoDebito += dato_7;
        saldoCredito += dato_8;
        totalDebito = totalDebito + Number(dato_7);
        totalCredito = totalCredito + Number(dato_8);
        // totalCredito = totalCredito + Number(transactions[k].credito);
      }
    }

    if (totalDebito > totalCredito) {
      saldoDebito = totalDebito - totalCredito;
      saldoCredito = 0;
    } else {
      saldoCredito = totalCredito - totalDebito;
      saldoDebito = 0;
    }

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
      case "Set":
        periodname_completo = periodSearch.periodname.replace("Set", "Setiembre");
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
        thirdTitle: "FORMATO 3.2 - " + periodSearch.periodname,
      },
      cabecera: {
        periodo: pGloblas.pAnio,
        ruc: companyRuc,
        razonSocial: companyName.replace(/&/g, "&amp;").toUpperCase(),
      },
      total: {
        saldoCredito: parseFloat(saldoCredito),
        saldoDebito: parseFloat(saldoDebito),
        totalDebito: parseFloat(totalDebito),
        totalCredito: parseFloat(totalCredito),
      },
      movements: jsonTransacion,
    };
    return jsonAxiliar;
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
  const getPeriodName = (filterPostingPeriod) => {
    try {
      const perLookup = search.lookupFields({
        type: search.Type.ACCOUNTING_PERIOD,
        id: filterPostingPeriod,
        columns: ["periodname"],
      });
      const period = perLookup.periodname;
      return period;
    } catch (e) {
      log.error({ title: "getPeriodName", details: e });
    }
  };
  const retornaPeriodoString = (campoRegistro01) => {
    if (campoRegistro01 >= "") {
      var valorAnio = campoRegistro01.split(" ")[1];
      var valorMes = campoRegistro01.split(" ")[0];
      if (valorMes.indexOf("Jan") >= 0 || valorMes.indexOf("ene") >= 0) {
        valorMes = "01";
      } else {
        if (valorMes.indexOf("feb") >= 0 || valorMes.indexOf("Feb") >= 0) {
          valorMes = "02";
        } else {
          if (valorMes.indexOf("mar") >= 0 || valorMes.indexOf("Mar") >= 0) {
            valorMes = "03";
          } else {
            if (valorMes.indexOf("abr") >= 0 || valorMes.indexOf("Apr") >= 0) {
              valorMes = "04";
            } else {
              if (valorMes.indexOf("may") >= 0 || valorMes.indexOf("May") >= 0) {
                valorMes = "05";
              } else {
                if (valorMes.indexOf("jun") >= 0 || valorMes.indexOf("Jun") >= 0) {
                  valorMes = "06";
                } else {
                  if (valorMes.indexOf("jul") >= 0 || valorMes.indexOf("Jul") >= 0) {
                    valorMes = "07";
                  } else {
                    if (valorMes.indexOf("Aug") >= 0 || valorMes.indexOf("ago") >= 0) {
                      valorMes = "08";
                    } else {
                      if (valorMes.indexOf("set") >= 0 || valorMes.indexOf("sep") >= 0) {
                        valorMes = "09";
                      } else {
                        if (valorMes.indexOf("oct") >= 0) {
                          valorMes = "10";
                        } else {
                          if (valorMes.indexOf("nov") >= 0) {
                            valorMes = "11";
                          } else {
                            valorMes = "12";
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      campoRegistro01 = valorAnio + valorMes + "00";
    }
    return campoRegistro01;
  };

  const getFileName = () => {
    return `LE${companyRuc}${pGloblas.pAnio}1231030200071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
  };

  const saveFile = (stringValue) => {
    var fileAuxliar = stringValue;
    var urlfile = "";

    nameReport = getFileName();

    var folderID = libPe.callFolder();

    fileAuxliar.name = nameReport;
    fileAuxliar.folder = folderID;

    var fileID = fileAuxliar.save();

    let auxFile = file.load({ id: fileID });
    urlfile += auxFile.url;
    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template_Formato_3_2.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.24: "Anual: Libro de Invent...dos integrales - 3.24"
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_2",
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
      type: format.Type.DATE,
    });
    var enddate = format.format({
      value: new Date(pGloblas.pAnio, 12, 0),
      type: format.Type.DATE,
    });

    savedSearch.filters.push(
      search.createFilter({
        name: "trandate",
        operator: search.Operator.WITHIN,
        values: [startdate, enddate],
      })
    );

    // savedSearch.filters.push(search.createFilter({
    //     name: 'account',
    //     operator: search.Operator.IS,
    //     values: pGloblas.pCuentaId
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
        // 0. CÓDIGO ÚNICO DE LA OPERACIÓN
        arrAux[0] = result.getValue(columns[0]);
        // 1. FECHA DE LA OPERACIÓN
        arrAux[1] = result.getValue(columns[1]);

        arrAux[2] = result.getValue(columns[2]);

        arrAux[3] = result.getValue(columns[3]);

        arrAux[4] = result.getValue(columns[4]);

        arrAux[5] = result.getValue(columns[5]);

        arrAux[6] = result.getValue(columns[6]);

        arrAux[7] = result.getValue(columns[7]);

        arrAux[8] = result.getValue(columns[8]);

        arrAux[9] = result.getValue(columns[9]);

        arrResult.push(arrAux);
      });
    });
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
      companyRuc = "";
    }
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter("custscript_pe_3_2_inventariosbal_params");
    pGloblas = JSON.parse(pGloblas);

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      pAnio: pGloblas.anioCon,
    };
    log.debug('Parámetros', pGloblas);

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
