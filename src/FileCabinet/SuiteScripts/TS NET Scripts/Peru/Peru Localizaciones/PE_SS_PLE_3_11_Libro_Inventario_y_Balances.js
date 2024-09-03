/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 * Task                         Date            Author                                                  Remarks
 * Formato 3.11                  30 Set 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>        LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 41
 */
define(["N/search", "N/record", "N/runtime", "N/log", "N/file", "N/task", "N/config", "./PE_LIB_Libros.js"], (search, record, runtime, log, file, task, config, libPe) => {
  // Anual: Libro de Inventario y Balances - cuenta 41

  var pGloblas = {};

  const execute = (context) => {
    try {
      const featureSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
      const searchId = "customsearch_pe_detalle_42_3_12_2";
      var logrecodId = "customrecord_pe_generation_logs";
      let fedIdNumb = "";
      let hasinfo = 0;

      const params = getParams();

      log.debug("params finales", JSON.stringify(params));
      // {"filterSubsidiary":3,"filterPostingPeriod":114,"filterFormat":"CSV","fileCabinetId":871,"filterAnioPeriod":"2023"}
      if (featureSubsidiary) {
        const getruc = getRUC(params.filterSubsidiary);
        fedIdNumb = getruc;
      } else {
        const employerid = getEmployerID();
        fedIdNumb = employerid;
      }

      var createrecord = createRecord(logrecodId, featureSubsidiary, params.filterSubsidiary, params.filterPostingPeriod);
      const searchbook = searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary, params.filterAnioPeriod);

      if (searchbook.thereisinfo == 1) {
        hasinfo = "1";
        const structuregbody = structureBody(searchbook.content);
        const createfile = createFile(params.filterPostingPeriod, fedIdNumb, hasinfo, createrecord.recordlogid, params.filterFormat, structuregbody, params.fileCabinetId, params.filterAnioPeriod);
        const statusProcess = setRecord(createrecord.irecord, createrecord.recordlogid, createfile, logrecodId);
        log.debug({ title: "FinalResponse", details: "Estado del proceso: " + statusProcess + " OK!!" });
      } else {
        setVoid(createrecord.irecord, logrecodId, createrecord.recordlogid);
        log.debug({ title: "FinalResponse", details: "No hay registros para la solicitud: " + createrecord.recordlogid });
      }
    } catch (e) {
      log.error({ title: "ErrorInExecute", details: e });
      setError(createrecord.irecord, logrecodId, createrecord.recordlogid, e);
    }
  };

  const getParams = () => {
    try {
      var folderID = libPe.callFolder();
      const scriptObj = runtime.getCurrentScript();
      pGloblas = scriptObj.getParameter('custscript_pe_3_11_inventarios_params'); // || {};
      log.debug("pGloblas del script", pGloblas);
      pGloblas = JSON.parse(pGloblas);
      // pGloblas = {
      //   recordID: 0,
      //   reportID: 113,
      //   subsidiary: 3,
      //   periodCon: 114,
      //   anioCon: "2023",
      //   format: "CSV",
      //   fileCabinetId: FOLDER_ID,
      // };


      // log.debug("global", JSON.stringify(pGloblas));


      return {
        filterSubsidiary: pGloblas.subsidiary,
        filterPostingPeriod: pGloblas.periodCon,
        filterFormat: pGloblas.format,
        fileCabinetId: folderID,
        filterAnioPeriod: pGloblas.anioCon,
      };
    } catch (e) {
      log.error({ title: "getParams", details: e });
    }
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

  const getEmployerID = () => {
    const configpage = config.load({ type: config.Type.COMPANY_INFORMATION });
    const employeeid = configpage.getValue("employerid");
    return employeeid;
  };

  const createRecord = (logrecodId, featureSubsidiary, filterSubsidiary, filterPostingPeriod) => {
    try {
      const recordlog = record.create({ type: logrecodId });
      if (featureSubsidiary) {
        recordlog.setValue({ fieldId: "custrecord_pe_subsidiary_log", value: filterSubsidiary });
      }
      recordlog.setValue({ fieldId: "custrecord_pe_period_log", value: filterPostingPeriod });
      recordlog.setValue({ fieldId: "custrecord_pe_status_log", value: "Procesando..." });
      recordlog.setValue({ fieldId: "custrecord_pe_report_log", value: "Procesando..." });
      recordlog.setValue({ fieldId: "custrecord_pe_book_log", value: "Inventario y Balance 3.11" });
      const recordlogid = recordlog.save();

      return { recordlogid: recordlogid, irecord: record };
    } catch (e) {
      log.error({ title: "createRecord", details: e });
    }
  };

  const searchBook = (subsidiary, period, searchId, featureSubsidiary, anioperiod) => {
    let json = new Array();
    var searchResult;
    let division = 0.0;
    let laps = 0.0;
    let start = 0;
    let end = 1000;
    try {
      const searchLoad = search.load({
        id: searchId,
      });

      let filters = searchLoad.filters;

      // const filterOne = search.createFilter({
      //     name: 'postingperiod',
      //     operator: search.Operator.ANYOF,
      //     values: period
      // });

      // filters.push(filterOne);

      if (featureSubsidiary) {
        const filterTwo = search.createFilter({
          name: "subsidiary",
          operator: search.Operator.ANYOF,
          values: subsidiary,
        });
        filters.push(filterTwo);
      }

      const searchResultCount = searchLoad.runPaged().count;

      if (searchResultCount != 0) {
        if (searchResultCount <= 4000) {
          searchLoad.run().each((result) => {
            log.debug("result", result);
            let periodo = result.getValue(searchLoad.columns[0]);
            let cuo = result.getValue(searchLoad.columns[1]);
            let correlativo = result.getValue(searchLoad.columns[2]);
            let tipo_doc_proveedor = result.getValue(searchLoad.columns[3]);
            //reemplazar espacios vacios            
            tipo_doc_proveedor = tipo_doc_proveedor.replace(/\s/g, "");
            log.debug("tipo_doc_proveedor", tipo_doc_proveedor);
            tipo_doc_proveedor = tipo_doc_proveedor == "-None-" ? "" : tipo_doc_proveedor;
            let nro_doc_proveedor = result.getValue(searchLoad.columns[4]);
            nro_doc_proveedor = nro_doc_proveedor.replace(/\s/g, "");;
            nro_doc_proveedor = nro_doc_proveedor == "-None-" ? "" : nro_doc_proveedor;

            let fecha_emision = result.getValue(searchLoad.columns[5]);
            let nombre_razonSocial = result.getValue(searchLoad.columns[6]);
            let nombreRZ = nombre_razonSocial.replace(/\s/g, "");;
            nombre_razonSocial = nombreRZ == "-None-" ? "" : nombre_razonSocial;
            let monto_cuenta = result.getValue(searchLoad.columns[7]);
            //monto_cuenta = numberWithCommas(monto_cuenta);
            let estado_operacion = result.getValue(searchLoad.columns[8]);
            let cuenta_contable = result.getValue(searchLoad.columns[9]);
            let anio = result.getValue(searchLoad.columns[10]);
            let idPersona = result.getValue(searchLoad.columns[11]);
            let nomCuenta = result.getValue(searchLoad.columns[12]);

            log.debug('idPersona', idPersona);
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
            log.debug('anioperiod', anioperiod)
            log.debug('anio', anio)
            if (anio == anioperiod) {
              json.push({
                c1_periodo: periodo,
                c2_cuo: cuo,
                c3_correlativo: correlativo,
                c4_tipo_doc_proveedor: codigoTipoDocumento,
                c5_nro_doc_proveedor: numTrabajador,
                c6_fecha_emision: fecha_emision,
                c7_nombre_razonSocial: nombre,
                c8_monto_cuenta: monto_cuenta,
                c9_estado_operacion: estado_operacion,
                c10_cuenta_contable: cuenta_contable,
                c11_anio: anio,
                c12_cod_trabajador: numTrabajador
              });
            }
            return true;
          });

          if (json.length > 0) {
            return { thereisinfo: 1, content: json };
          } else {
            return { thereisinfo: 0 }
          }
        } else {
          division = searchResultCount / 1000;
          laps = Math.round(division);
          if (division > laps) {
            laps = laps + 1;
          }
          for (let i = 1; i <= laps; i++) {
            if (i != laps) {
              searchResult = searchLoad.run().getRange({ start: start, end: end });
            } else {
              searchResult = searchLoad.run().getRange({ start: start, end: searchResultCount });
            }
            for (let j in searchResult) {
              let periodo = result.getValue(searchLoad.columns[0]);
              let cuo = result.getValue(searchLoad.columns[1]);
              let correlativo = result.getValue(searchLoad.columns[2]);
              let tipo_doc_proveedor = result.getValue(searchLoad.columns[3]);
              //reemplazar espacios vacios
              tipo_doc_proveedor = tipo_doc_proveedor.replace(/\s/g, "");
              tipo_doc_proveedor = tipo_doc_proveedor == "-None-" ? "" : tipo_doc_proveedor;

              let nro_doc_proveedor = result.getValue(searchLoad.columns[4]);
              nro_doc_proveedor = nro_doc_proveedor.replace(/\s/g, "");;
              nro_doc_proveedor = nro_doc_proveedor == "-None-" ? "" : nro_doc_proveedor;

              let fecha_emision = result.getValue(searchLoad.columns[5]);
              let nombre_razonSocial = result.getValue(searchLoad.columns[6]);
              let nombreRZ = nombre_razonSocial.replace(/\s/g, "");;
              nombre_razonSocial = nombreRZ == "-None-" ? "" : nombre_razonSocial;
              let monto_cuenta = result.getValue(searchLoad.columns[7]);
              //monto_cuenta = numberWithCommas(monto_cuenta);
              let estado_operacion = result.getValue(searchLoad.columns[8]);
              let cuenta_contable = result.getValue(searchLoad.columns[9]);
              let anio = result.getValue(searchLoad.columns[10]);
              let idPersona = result.getValue(searchLoad.columns[11]);
              let nomCuenta = result.getValue(searchLoad.columns[12]);

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


              if (anio == anioperiod) {
                json.push({
                  c1_periodo: periodo,
                  c2_cuo: cuo,
                  c3_correlativo: correlativo,
                  c4_tipo_doc_proveedor: codigoTipoDocumento,
                  c5_nro_doc_proveedor: numTrabajador,
                  c6_fecha_emision: fecha_emision,
                  c7_nombre_razonSocial: nombre,
                  c8_monto_cuenta: monto_cuenta,
                  c9_estado_operacion: estado_operacion,
                  c10_cuenta_contable: cuenta_contable,
                  c11_anio: anio,
                  c12_cod_trabajador: numTrabajador
                });
              }
            }
            start = start + 1000;
            end = end + 1000;
          }

          if (json.length > 0) {
            return { thereisinfo: 1, content: json };
          } else {
            return { thereisinfo: 0 }
          }
        }
      } else {
        return { thereisinfo: 0 };
      }
    } catch (e) {
      log.error({ title: "searchBook", details: e });
    }
  };

  const structureBody = (searchResult) => {
    let contentReport = "";
    try {
      for (let i in searchResult) {
        contentReport = contentReport + searchResult[i].c1_periodo + "|" + searchResult[i].c2_cuo + "|" + searchResult[i].c3_correlativo + "|" + searchResult[i].c10_cuenta_contable + "|" + searchResult[i].c4_tipo_doc_proveedor + "|" + searchResult[i].c5_nro_doc_proveedor + "|" + searchResult[i].c12_cod_trabajador + "|" + searchResult[i].c7_nombre_razonSocial + "|" + searchResult[i].c8_monto_cuenta + "|" + searchResult[i].c9_estado_operacion + "|\n";
      }

      return contentReport;
    } catch (e) {
      log.error({ title: "structureBody", details: e });
    }
  };

  const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId, filterAnioPeriod) => {
    let typeformat;
    const header = "1 Periodo|2 CUO|3 CORRELATIVO |4 Codigo Cuenta  |5 Tipo Documento |6 Nro Documento |7 Codigo Trabajador | 8 Apellidos Nombres RazonSocial | 9 Monto | 10 Estado Operacion |\n";
    try {
      let periodname = filterAnioPeriod;
      let nameReportGenerated = "LE" + fedIdNumb + periodname + "1231031100" + "07" + "1" + hasinfo + "11_" + recordlogid;
      if (filterFormat == "CSV") {
        nameReportGenerated = nameReportGenerated + ".csv";
        structuregbody = header + structuregbody;
        structuregbody = structuregbody.replace(/[,]/gi, " ");
        structuregbody = structuregbody.replace(/[|]/gi, ",");
        typeformat = file.Type.CSV;
      } else {
        nameReportGenerated = nameReportGenerated + ".txt";
        typeformat = file.Type.PLAINTEXT;
      }
      const fileObj = file.create({
        name: nameReportGenerated,
        fileType: typeformat,
        contents: structuregbody,
        encoding: file.Encoding.UTF8,
        folder: fileCabinetId,
        isOnline: true,
      });
      const fileId = fileObj.save();
      return fileId;
    } catch (e) {
      log.error({ title: "createFile", details: e });
    }
  };

  const setRecord = (irecord, recordlogid, fileid, logrecodId) => {
    try {
      const fileAux = file.load({ id: fileid });
      irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_file_cabinet_log: fileAux.url } });
      irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: "Generated" } });
      irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_report_log: fileAux.name } });
      return recordlogid;
    } catch (e) {
      log.error({ title: "setRecord", details: e });
    }
  };

  const setError = (irecord, logrecodId, recordlogid, error) => {
    try {
      irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: "ERROR: " + error } });
    } catch (e) {
      log.error({ title: "setError", details: e });
    }
  };

  const setVoid = (irecord, logrecodId, recordlogid) => {
    try {
      const estado = "No hay registros";
      const report = "Proceso finalizado";
      irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: estado } });
      irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_report_log: report } });
    } catch (e) {
      log.error({ title: "setVoid", details: e });
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

  const retornaPeriodoStringForView = (campoRegistro01) => {
    if (campoRegistro01 >= "") {
      var valorAnio = campoRegistro01.split(" ")[1];
      var valorMes = campoRegistro01.split(" ")[0];
      if (valorMes.indexOf("Jan") >= 0 || valorMes.indexOf("Ene") >= 0) {
        valorMes = "01";
      } else {
        if (valorMes.indexOf("Feb") >= 0) {
          valorMes = "02";
        } else {
          if (valorMes.indexOf("Mar") >= 0) {
            valorMes = "03";
          } else {
            if (valorMes.indexOf("Abr") >= 0 || valorMes.indexOf("Apr") >= 0) {
              valorMes = "04";
            } else {
              if (valorMes.indexOf("May") >= 0) {
                valorMes = "05";
              } else {
                if (valorMes.indexOf("Jun") >= 0) {
                  valorMes = "06";
                } else {
                  if (valorMes.indexOf("Jul") >= 0) {
                    valorMes = "07";
                  } else {
                    if (valorMes.indexOf("Aug") >= 0 || valorMes.indexOf("Ago") >= 0) {
                      valorMes = "08";
                    } else {
                      if (valorMes.indexOf("Set") >= 0 || valorMes.indexOf("Sep") >= 0) {
                        valorMes = "09";
                      } else {
                        if (valorMes.indexOf("Oct") >= 0) {
                          valorMes = "10";
                        } else {
                          if (valorMes.indexOf("Nov") >= 0) {
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
      //campoRegistro01 = valorAnio + valorMes + '30';
      var json = {
        valorAnio: valorAnio,
        valorMes: valorMes,
      };
    }
    return json;
  };

  const func = (valorAnio, valorMes) => {
    // var date = new Date();
    var ultimoDia = new Date(valorAnio, valorMes, 0).getDate();
    var PeriodoCompleto = String(valorAnio) + String(valorMes) + String(ultimoDia);
    return PeriodoCompleto;
  };

  const numberWithCommas = (x) => {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
      x = x.replace(pattern, "$1,$2");
    return x;
  }

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
    execute: execute,
  };
});