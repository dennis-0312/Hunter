/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 4.1           28 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 4.1
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
  var month = "";
  var year = "";

  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const months_nros = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

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
        numberDoc: dataMap[0],
        name: dataMap[1],
        numerTran: dataMap[2],
        date: dataMap[3],
        currency: dataMap[4],
        import: dataMap[5],
        exchange: dataMap[6],
        amount: dataMap[7],
        typeImp: dataMap[8],
        amountRet: dataMap[9],
        balance: dataMap[10],
        constRet: dataMap[11],
        emisionRet: dataMap[12],
        tipoDocumento: dataMap[13],
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

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Libro de Retenciones 4.1");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;

    transactionJSON["transactions"] = {};
    context.output.iterator().each(function (key, value) {
      value = JSON.parse(value);

      transactionJSON["transactions"][value.numerTran] = value;
      return true;
    });
    //log.debug('transactionJSON', transactionJSON["transactions"]);

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
      totalAmount = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    log.debug("transactions", transactions);

    var total_amount = 0;
    var total_amountRet = 0;
    var total_balance = 0;
    for (var k in transactions) {
      let IDD = transactions[k].numerTran;
      if (!jsonTransacion[IDD]) {
        let exchange = Number(transactions[k].exchange).toFixed(3);
        let balance = Number(transactions[k].balance).toFixed(2);
        let amountRet = Number(transactions[k].amountRet).toFixed(2);

        jsonTransacion[IDD] = {
          numberDoc: transactions[k].numberDoc,
          name: transactions[k].name,
          numerTran: transactions[k].numerTran,
          date: transactions[k].date,
          currency: transactions[k].currency,
          import: transactions[k].import,
          exchange: exchange,
          amount: numberWithCommas(roundTwoDecimals(transactions[k].amount).toFixed(2)),
          typeImp: transactions[k].typeImp,
          amountRet: numberWithCommas(roundTwoDecimals(amountRet).toFixed(2)),
          balance: numberWithCommas(roundTwoDecimals(balance).toFixed(2)),
          constRet: transactions[k].constRet,
          emisionRet: transactions[k].emisionRet,
          tipoDocumento: transactions[k].tipoDocumento,
        };
        total_amount = total_amount + Number(transactions[k].amount);
        total_amountRet = total_amountRet + Number(transactions[k].amountRet);
        total_balance = total_balance + Number(transactions[k].balance);
      }
      hasInfo = 1;
    }

    //log.debug('jsonTransacion', jsonTransacion);
    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname", "startdate"],
    });

    let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
    month = months_nros[Number(periodSearch.startdate.split("/")[1]) - 1];
    year = periodSearch.startdate.split("/")[2];

    let jsonAxiliar = {
      company: {
        firtsTitle: "FORMATO 12.1: INVT. PERMANENTE",
        secondTitle: monthName.toLocaleUpperCase() + " " + year,
        thirdTitle: companyRuc.replace(/&/g, "&amp;"),
        fourthTitle: companyName.replace(/&/g, "&amp;").toLocaleUpperCase(),
      },
      total: {
        total: totalAmount.toFixed(2),
        total_amount: numberWithCommas(roundTwoDecimals(total_amount).toFixed(2)),
        total_amountRet: numberWithCommas(roundTwoDecimals(total_amountRet).toFixed(2)),
        total_balance: numberWithCommas(roundTwoDecimals(total_balance).toFixed(2)),
      },
      movements: jsonTransacion,
    };

    return jsonAxiliar;
  };

  const getFileName = () => {
    return `LE${companyRuc}${year}${month}00040100001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
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

  const saveFile = (stringValue) => {
    var fileAuxliar = stringValue;
    var urlfile = "";
    // if (featSubsidiary) {
    //     nameReport = 'Formato 4.1_' + companyName + '.' + formatReport;
    // } else {
    //     nameReport = 'Formato 4.1_' + '.' + formatReport;
    // }
    nameReport = getFileName();

    var folderID = libPe.callFolder();

    fileAuxliar.name = nameReport;
    fileAuxliar.folder = folderID;

    var fileID = fileAuxliar.save();

    let auxFile = file.load({ id: fileID });
    log.debug("hiii", auxFile);
    urlfile += auxFile.url;

    log.debug("pGloblas.pRecordID", pGloblas.pRecordID);
    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template41LibroRetenciones.xml");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 4.1: LIBRO DE RETENCIONES INCISOS E) Y F) DEL ART. 34° DE LA LEY DEL IMPUESTO A LA RENTA
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_4_1",
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

    savedSearch.filters.push(
      search.createFilter({
        name: "postingperiod",
        operator: search.Operator.IS,
        values: [pGloblas.pPeriod],
      })
    );

    //log.debug('FilterPeriod', pGloblas.pPeriod);

    // let searchResultCount = savedSearch.runPaged().count;
    // log.debug("vendorbillSearchObj result count", searchResultCount);
    var pagedData = savedSearch.runPaged({ pageSize: 1000 });
    var page, columns;

    pagedData.pageRanges.forEach(function (pageRange) {
      page = pagedData.fetch({ index: pageRange.index });
      page.data.forEach(function (result) {
        columns = result.columns;
        arrAux = new Array();

        // 0. N° DE DOCUMENTO DE IDENTIDAD
        arrAux[0] = result.getValue(columns[0]);

        // 1. APELLIDOS Y NOMBRES
        arrAux[1] = result.getValue(columns[1]);

        // 2. NÚMERO DE DOCUMENTO
        arrAux[2] = result.getValue(columns[2]);

        // 3. FECHA DE RETENCIÓN
        arrAux[3] = result.getValue(columns[3]);

        // 4. MONEDA
        arrAux[4] = result.getText(columns[4]);

        // 5. IMPORTE
        arrAux[5] = result.getValue(columns[5]);

        // 6. TIPO DE CAMBIO
        arrAux[6] = result.getValue(columns[6]);

        // 7. MONTO SOLES
        arrAux[7] = result.getValue(columns[7]);

        // 8. TIPO IMPOSITIVO
        arrAux[8] = Number(result.getValue(columns[8]));

        // 9. MONTO RET
        arrAux[9] = result.getValue(columns[9]);

        // 10. SALDO
        arrAux[10] = result.getValue(columns[10]);

        // 11. CONST RET
        arrAux[11] = result.getValue(columns[11]);

        // 12. EMISION RET
        arrAux[12] = result.getValue(columns[12]);

        // 12. TIPO DOCUMENTO
        arrAux[13] = result.getValue(columns[13]);

        // 13. ID
        let idInterno = result.getValue(columns[14]);
        //let montoRetenido = BuscarMontoRetenido(idInterno);
        //arrAux[9] = montoRetenido;
        //arrAux[10] = arrAux[10] - montoRetenido;

        arrResult.push(arrAux);
      });
    });
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
    pGloblas = objContext.getParameter("custscript_pe_41libroretenciones_params"); // || {};
    pGloblas = JSON.parse(pGloblas);

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
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

  const BuscarMontoRetenido = (id) => {
    let amount = 0;
    var vendorbillSearchObj = search.create({
      type: "vendorbill",
      filters:
        [
          ["type", "anyof", "VendBill"],
          "AND",
          ["internalid", "anyof", id]
        ],
      columns:
        [

          search.createColumn({
            name: "formulacurrency",
            summary: "SUM",
            formula: "ABS(CASE WHEN {applyingTransaction.type} = 'Crédito de factura' THEN {applyingTransaction.amount} ELSE 0 END)",
            label: "Fórmula (moneda)"
          })
        ]
    });

    vendorbillSearchObj.run().each(function(result){
      amount = result.getValue(vendorbillSearchObj.columns[0]);
    });

    return amount;
  };

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});