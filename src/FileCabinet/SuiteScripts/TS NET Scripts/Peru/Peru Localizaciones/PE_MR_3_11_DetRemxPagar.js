/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * Task                         Date            Author                                      Remarks
 * Formato 3.11                  28 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>          LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
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
      // log.debug("dataMap", dataMap);
      // log.debug("key", key);

      var resultTransactions = {
        key: key,
        codigo: dataMap[0],
        denominacion: dataMap[1],
        codigoTrabajador: dataMap[2],
        apellidosNombresTrabajador: dataMap[3],
        tipoDNITrabajador: dataMap[4],
        numeroDNITrabajador: dataMap[5],
        saldoFinal: dataMap[6],
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

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.11");

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

      var FolderId = 871;

      if (FolderId != "" && FolderId != null) {
        // Crea el archivo
        var fileAux = file.create({
          name: "AuxiliarFormato3.11",
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

      return true;
    } else {

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
  function encontrarMayor(numero1, numero2, numero3) {
    if (numero1 >= numero2 && numero1 >= numero3) {
      return numero1;
    } else if (numero2 >= numero1 && numero2 >= numero3) {
      return numero2;
    } else {
      return numero3;
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
    var cantidadLinea = 0;
    var montoviene = 0;
    var cantidadFor = 0;
    var cantidadAnterio = 0;
    // log.debug("transactions", transactions);

    for (var k in transactions) {
      let IDD = transactions[k].key;
      var resultado1 = divisionRedondeoArriba(transactions[k].apellidosNombresTrabajador.length, 36);
      var resultado2 = divisionRedondeoArriba(transactions[k].apellidosNombresTrabajador.length, 36);
      
      var mayor = encontrarMayor(resultado1, resultado2, 0);

      cantidadLinea = cantidadLinea + mayor + 1;
      if (!jsonTransacion[IDD]) {
        let saldoFinal = Number(transactions[k].saldoFinal);
        jsonTransacion[IDD] = {
          number: cantidadFor,
          codigo: transactions[k].codigo,
          denominacion: transactions[k].denominacion.replace(/&/g, "&amp;").toLocaleUpperCase(),

          codigoTrabajador: transactions[k].codigoTrabajador,
          apellidosNombresTrabajador: transactions[k].apellidosNombresTrabajador.replace(/&/g, "&amp;").toLocaleUpperCase(),

          tipoDNITrabajador: transactions[k].tipoDNITrabajador,
          numeroDNITrabajador: transactions[k].numeroDNITrabajador,
          saldoFinal: saldoFinal,
        };
        cantidadFor = cantidadFor + 1;
        totalAmount = totalAmount + Number(transactions[k].saldoFinal);
      }
      if (cantidadLinea <= 23) {
        montoviene = Number(montoviene) + Number(transactions[k].saldoFinal);
        cantidadAnterio = cantidadLinea;
      } else {

        jsonTransacionvine.push({
          montoviene: formatearNumeroConComas(montoviene.toFixed(2)),
          cantidadFor: cantidadFor - 1
        });


        cantidadLinea = 0;
        cantidadLinea = cantidadLinea + mayor+ 1;
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
        formato: 'FORMATO 3.11: "LIBRO DE INVENTARIOS Y BALANCES -  DETALLE DEL SALDO DE LA CUENTA 41 - REMUNERACIONES POR PAGAR"',
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
    return `LE${companyRuc}${pGloblas.pAnio}1231031100071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
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

    urlfile += auxFile.url;

    // log.debug("pGloblas.pRecordID", pGloblas.pRecordID);
    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("./Template/PE_Template_3_11_DetRemxPagar.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.11: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 41"
    var savedSearch = search.load({
      id: "customsearch_pe_libro_impreso_3_11",
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
        log.debug("result", result);


        // 0. CÓDIGO
        arrAux[0] = result.getValue(columns[0]);

        // 1. DENOMINACIÓN
        arrAux[1] = result.getValue(columns[1]);

        // 2. CÓDIGO TRABAJADOR
        arrAux[2] = result.getValue(columns[2]);

        //3. APELLIDOS Y NOMBRES TRABAJADOR
        arrAux[3] = result.getValue(columns[3]);

        //4. TIPO DNI TRABAJADOR
        arrAux[4] = result.getValue(columns[4]);

        //5. NÚMERO DNI TRABAJADOR
        arrAux[5] = result.getValue(columns[5]);

        //6. SALDO FINAL
        arrAux[6] = result.getValue(columns[6]);

        //7. fecha
        arrAux[7] = result.getText(columns[7]);

        // arrResult.push(arrAux);
        let year = arrAux[7].split(" ")[1];

        let idPersona = result.getValue(columns[8]);
        let nomCuenta = result.getValue(columns[9]);
        let cuenta_contable = result.getValue(columns[10]);

        let nombre = nomCuenta;
        let numTrabajador = cuenta_contable;
        let codigoTipoDocumento = '0';

        if (idPersona != '0') {
          let entidad = getCustomer(idPersona);
          if (entidad[0] == null) {
            entidad = getProveedor(idPersona);
          }
          if (entidad[0] == null) {
            entidad = getemployee(idPersona);
          }

          let company = entidad[0];
          numTrabajador = entidad[1];
          let isPerson = entidad[2];
          let altname = entidad[3];
          codigoTipoDocumento = entidad[4];

          if (company == null) company = '';
          if (numTrabajador == null) numTrabajador = '';
          if (isPerson == null) isPerson = '';
          if (altname == null) altname = '';
          if (codigoTipoDocumento == null) codigoTipoDocumento = '';

          if (isPerson == false) {
            nombre = company;
          } else if (isPerson == true) {
            nombre = altname;
          }
        }
        nombre = nombre.replace(/(\r\n|\n|\r)/gm, "");
        nombre = nombre.replace(/[\/\\|]/g, "");

        arrAux[2] = numTrabajador;
        arrAux[3] = nombre
        arrAux[4] = codigoTipoDocumento;
        arrAux[5] = numTrabajador;

        if (year == pGloblas.pAnio) {
          arrResult.push(arrAux);
        }

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
    }
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter("custscript_pe_3_11_detremxpagar_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = { recordID: 10, reportID: 131, subsidiary: 3, anioCon: "2023", periodCon: 113 };

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      pAnio: pGloblas.anioCon,
    };



    featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
  };

  const isObjEmpty = (obj) => {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) return false;
    }

    return true;
  };

  const getProveedor = (id) => {
    id = Number(id);
    try {
      var arr = [];
      let vendor = search.lookupFields({
        type: "vendor",
        id: id,
        columns: [
          "companyname", 'vatregnumber', 'isperson', 'altname', 'custentity_pe_code_document_type',
        ]
      });
      arr[0] = vendor.companyname;
      arr[1] = vendor.vatregnumber;
      arr[2] = vendor.isperson;
      arr[3] = vendor.altname;
      arr[4] = vendor.custentity_pe_code_document_type;
      return arr;
    } catch (error) {
      log.error('error-getProveedor', error);
    }
  }

  const getCustomer = (id) => {
    id = Number(id);
    try {
      var arr = [];
      let customer = search.lookupFields({
        type: "customer",
        id: id,
        columns: [
          "companyname", 'vatregnumber', 'isperson', 'altname', 'custentity_pe_code_document_type'
        ]
      });
      arr[0] = customer.companyname;
      arr[1] = customer.vatregnumber;
      arr[2] = customer.isperson;
      arr[3] = customer.altname;
      arr[4] = customer.custentity_pe_code_document_type;
      return arr;
    } catch (error) {
      log.error('error-getCustomer', error);
    }
  }

  const getemployee = (id) => {
    id = Number(id);
    try {
      var arr = [];
      let employee = search.lookupFields({
        type: "employee",
        id: id,
        columns: [
          "altname", 'custentity_pe_document_number', 'custentity_pe_code_document_type'
        ]
      });
      arr[0] = '';
      arr[1] = employee.custentity_pe_document_number;
      arr[2] = true;
      arr[3] = employee.altname;
      arr[4] = employee.custentity_pe_code_document_type;
      return arr;
    } catch (error) {
      log.error('error-getemployee', error);
    }
  }

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});