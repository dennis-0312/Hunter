/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.1           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 3.1
 *
 */

define(['N/format', 'N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', './PE_LIB_Libros.js'], (format, runtime, search, config, render, record, file, libPe) => {

  var objContext = runtime.getCurrentScript();

  /** PARAMETROS */
  var pGloblas = {};

  /** REPORTE */
  var formatReport = 'pdf';
  var nameReport = '';
  var transactionFile = null;

  /** DATOS DE LA SUBSIDIARIA */
  var companyName = '';
  var companyRuc = '';
  var companyLogo = '';
  var companyDV = '';
  var month = "";
  var year = "";
  var hasInfo = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;

  const getInputData = () => {
      // log.debug('MSK', 'getInputData - Inicio');
      try {
          getParameters();
          return getTransactions();
      } catch (e) {
          log.error('MSK', 'getInputData - Error:' + e);
      }
      // log.debug('MSK', 'getInputData - Fin');

  }

  const map = (context) => {
      try {
          var key = context.key;
          var dataMap = JSON.parse(context.value);
          var resultTransactions = {
              dato1: dataMap[0],
              dato2: dataMap[1],
              dato_descripcion: dataMap[2],
              dato_descripcion2: dataMap[3]
          };

          context.write({
              key: key,
              value: resultTransactions
          });

      } catch (e) {
          log.error('MSK', 'map - Error:' + e);
      }
  }

  const summarize = (context) => {
      // log.debug('MSK', 'summarize - Inicio');
      getParameters();
      // generateLog();
      getSubdiary();
      var periodId = getPeriodId(pGloblas.pAnio);
      pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, periodId, "Inventario y Balance 3.1")

      var transactionJSON = {};

      transactionJSON["parametros"] = pGloblas

      transactionJSON["transactions"] = {};
      hasInfo = 0;
      context.output.iterator().each((key, value) => {
          hasInfo = 1;
          value = JSON.parse(value);
          transactionJSON["transactions"][value.dato1] = value;
          return true;

      });
      log.debug('transactionJSON', transactionJSON["transactions"]);
      var jsonAxiliar = getJsonData(transactionJSON["transactions"]);
      log.debug('jsonAxiliar', jsonAxiliar);

      //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
      if (!isObjEmpty(transactionJSON["transactions"])) {
          var renderer = render.create();
          renderer.templateContent = getTemplate();
          renderer.addCustomDataSource({
              format: render.DataSource.OBJECT,
              alias: "input",
              data: {
                  data: JSON.stringify(jsonAxiliar)
              }
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
              log.debug({ title: 'URL ARCHIVO TEMP', details: idfile });
          }

          *** */
          stringXML = renderer.renderAsPdf();
          saveFile(stringXML);

          /**** */
          // log.debug('Termino');}
          return true;

      } else {
          log.debug('No data');
          libPe.noData(pGloblas.pRecordID);
      }
      // log.debug('MSK', 'summarize - Fin');

  }

  const getJsonData = (transactions) => {
      // log.debug('MSK', 'getJsonData - Inicio');
      let userTemp = runtime.getCurrentUser(), useID = userTemp.id, jsonTransacion = {}, totalDebito = 0, totalCredito = 0, saldoDebito = 0, saldoCredito = 0, saldo = 0;
      var employeeName = search.lookupFields({
          type: search.Type.EMPLOYEE,
          id: useID,
          columns: ['firstname', 'lastname']
      });
      var userName = employeeName.firstname + ' ' + employeeName.lastname;

      // log.debug('transactions', transactions);

      var activo = {}
      activo.efectivo=0;
      activo.cpc_comerciales_terceros=0;
      activo.cpc_personal_accionistas=0;
      activo.cpc_diversas=0;
      activo.servicios_otros_contratados=0;
      activo.existenias=0;
      activo.anticipios_otorgados=0;
      activo.TOTAL_ACTIVO_CORRIENTE=0;
      activo.estimacion_cuentas_cobranza=0;
      activo.inversiones_mobiliarias=0;
      activo.activos_adquiridos=0;
      activo.propiedades_planta_equipo=0;
      activo.intangibles=0;
      activo.depreciacion=0;
      activo.TOTAL_ACTIVO_NO_CORRIENTE=0;
      activo.TOTAL_ACTIVO=0;
      var pasivo = {}
      pasivo.sobregiro_bancario=0;
      pasivo.cpp_comerciales_terceros=0;
      pasivo.tributos=0;
      pasivo.remuneraciones=0;
      pasivo.cpp_diversas=0;
      pasivo.otras_proviciones=0;
      pasivo.anticipos_recibidos=0;
      pasivo.obligaciones_financieras=0;
      pasivo.TOTAL_PASIVO_CORRIENTE=0;
      pasivo.obligaciones_financieras2=0;
      pasivo.ingresos_diferidos=0;
      pasivo.TOTAL_PASIVO_NO_CORRIENTE=0;
      pasivo.capital=0;
      pasivo.capital_adicional=0;
      pasivo.resultados_Acumulados=0;
      pasivo.determinacion_resultado=0;
      pasivo.TOTAL_PATRIMONIO_NETO=0;
      pasivo.TOTAL_PASIVO_PATRIMONIO_NETO=0;

      for (var k in transactions) {
          let IDD = transactions[k].dato1;
          if (!jsonTransacion[IDD]) {
              let dato_2 = parseFloat(transactions[k].dato2);
              log.debug('dato_4', dato_2);
              // let debitoFormat = numberWithCommas(transactions[k].debito);
              // log.debug('debitoFormat', debitoFormat);
              jsonTransacion[IDD] = {
                  dato1: transactions[k].dato1,
                  dato2: dato_2,
              }
              saldo += dato_2;
              // totalCredito = totalCredito + Number(transactions[k].credito);

              log.debug('MSK-valor',transactions[k].dato_descripcion2)
              switch(transactions[k].dato_descripcion2){
                // case "Capital Adicional":
                //     activo.efectivo += dato_2;
                //     break;
                // case "1D0109TEMP":
                //     activo.cpc_comerciales_terceros += dato_2;
                //     break;
                case "Efectivo y equivalentes de efectivo":
                    activo.efectivo += dato_2;
                    break;
                case "Cuentas por cobrar comerciales - Terceros":
                    activo.cpc_comerciales_terceros += dato_2;
                    break;
                case "Cuentas por cobrar al personal, a los accionistas (socios), directores y gerentes":
                    activo.cpc_personal_accionistas += dato_2;
                    break;
                case "Cuentas por cobrar diversas - Terceros":
                    activo.cpc_diversas += dato_2;
                    break;
                case "Servicios y otros contratados por anticipados":
                    activo.servicios_otros_contratados += dato_2;
                    break;
                case "Existencias":
                    activo.existenias += dato_2;
                    break;
                case "Anticipos Otorgados":
                    activo.anticipios_otorgados += dato_2;
                    break;
                case "Estimacion de cuentas de cobranza dudosa":
                    activo.estimacion_cuentas_cobranza += dato_2;
                    break;
                case "Inversiones Mobiliarias":
                    activo.inversiones_mobiliarias += dato_2;
                    break;
                case "Activos Adquiridos en Arrendamiento":
                    activo.activos_adquiridos += dato_2;
                    break;
                case "Propiedades, Planta y Equipo":
                    activo.propiedades_planta_equipo += dato_2;
                    break;
                case "Intangibles":
                    activo.intangibles += dato_2;
                    break;
                case "Sobregiro Bancario":
                    pasivo.sobregiro_bancario += dato_2;
                    break;
                case "Cuentas por pagar comerciales - Terceros":
                    pasivo.cpp_comerciales_terceros += dato_2;
                    break;
                case "Tributos, contraprestaciones y aportes al sistema de pensiones y de salud por pagar":
                    pasivo.tributos += dato_2;
                    break;
                case "Remuneraciones y participaciones por pagar":
                    pasivo.remuneraciones += dato_2;
                    break;
                case "Cuentas por pagar diversas - Terceros":
                    pasivo.cpp_diversas += dato_2;
                    break;
                case "Otras provisiones":
                    pasivo.otras_proviciones += dato_2;
                    break;
                case "Anticipos recibidos":
                    pasivo.anticipos_recibidos += dato_2;
                    break;
                case "Obligaciones Financieras":
                    pasivo.obligaciones_financieras += dato_2;
                    break;
                case "Obligaciones Financieras":
                    pasivo.obligaciones_financieras2 += dato_2;
                    break;
                case "Ingresos Diferidos":
                    pasivo.ingresos_diferidos += dato_2;
                    break;
                case "Capital":
                    pasivo.capital += dato_2;
                    break;
                case "Capital Adicional":
                    pasivo.capital_adicional += dato_2;
                    break;
                case "Resultados acumulados":
                    pasivo.resultados_Acumulados += dato_2;
                    break;
                case "Determinación del resultado del ejercicio":
                    pasivo.determinacion_resultado += dato_2;
                    break;
              }
          }
      }
      activo.TOTAL_ACTIVO_CORRIENTE=activo.efectivo+
                                    activo.cpc_comerciales_terceros+
                                    activo.cpc_personal_accionistas+
                                    activo.cpc_diversas+
                                    activo.servicios_otros_contratados+
                                    activo.existenias+
                                    activo.anticipios_otorgados

      activo.TOTAL_ACTIVO_NO_CORRIENTE=activo.estimacion_cuentas_cobranza+
                                    activo.inversiones_mobiliarias+
                                    activo.activos_adquiridos+
                                    activo.propiedades_planta_equipo+
                                    activo.intangibles+
                                    activo.depreciacion

      activo.TOTAL_ACTIVO=activo.TOTAL_ACTIVO_CORRIENTE+activo.TOTAL_ACTIVO_NO_CORRIENTE
      
      pasivo.TOTAL_PASIVO_CORRIENTE=pasivo.sobregiro_bancario+
                                    pasivo.cpp_comerciales_terceros+
                                    pasivo.tributos+
                                    pasivo.remuneraciones+
                                    pasivo.cpp_diversas+
                                    pasivo.otras_proviciones+
                                    pasivo.anticipos_recibidos+
                                    pasivo.obligaciones_financieras

      
      pasivo.TOTAL_PASIVO_NO_CORRIENTE= pasivo.obligaciones_financieras2+
                                        pasivo.ingresos_diferidos

      pasivo.TOTAL_PATRIMONIO_NETO=pasivo.capital+
                                        pasivo.capital_adicional+
                                        pasivo.resultados_Acumulados+
                                        pasivo.determinacion_resultado
      
       pasivo.TOTAL_PASIVO_PATRIMONIO_NETO=pasivo.TOTAL_PASIVO_CORRIENTE+pasivo.TOTAL_PASIVO_NO_CORRIENTE+pasivo.TOTAL_PATRIMONIO_NETO

      //formato
      activo.efectivo=numberWithCommas(roundTwoDecimals(activo.efectivo).toFixed(2));
      activo.cpc_comerciales_terceros=numberWithCommas(roundTwoDecimals(activo.cpc_comerciales_terceros).toFixed(2));
      activo.cpc_personal_accionistas=numberWithCommas(roundTwoDecimals(activo.cpc_personal_accionistas).toFixed(2));
      activo.cpc_diversas=numberWithCommas(roundTwoDecimals(activo.cpc_diversas).toFixed(2));
      activo.servicios_otros_contratados=numberWithCommas(roundTwoDecimals(activo.servicios_otros_contratados).toFixed(2));
      activo.existenias=numberWithCommas(roundTwoDecimals(activo.existenias).toFixed(2));
      activo.anticipios_otorgados=numberWithCommas(roundTwoDecimals(activo.anticipios_otorgados).toFixed(2));
      activo.TOTAL_ACTIVO_CORRIENTE=numberWithCommas(roundTwoDecimals(activo.TOTAL_ACTIVO_CORRIENTE).toFixed(2));
      activo.estimacion_cuentas_cobranza=numberWithCommas(roundTwoDecimals(activo.estimacion_cuentas_cobranza).toFixed(2));
      activo.inversiones_mobiliarias=numberWithCommas(roundTwoDecimals(activo.inversiones_mobiliarias).toFixed(2));
      activo.activos_adquiridos=numberWithCommas(roundTwoDecimals(activo.activos_adquiridos).toFixed(2));
      activo.propiedades_planta_equipo=numberWithCommas(roundTwoDecimals(activo.propiedades_planta_equipo).toFixed(2));
      activo.intangibles=numberWithCommas(roundTwoDecimals(activo.intangibles).toFixed(2));
      activo.depreciacion=numberWithCommas(roundTwoDecimals(activo.depreciacion).toFixed(2));
      activo.TOTAL_ACTIVO_NO_CORRIENTE=numberWithCommas(roundTwoDecimals(activo.TOTAL_ACTIVO_NO_CORRIENTE).toFixed(2));
      activo.TOTAL_ACTIVO=numberWithCommas(roundTwoDecimals(activo.TOTAL_ACTIVO).toFixed(2));
      pasivo.sobregiro_bancario=numberWithCommas(roundTwoDecimals(pasivo.sobregiro_bancario).toFixed(2));
      pasivo.cpp_comerciales_terceros=numberWithCommas(roundTwoDecimals(pasivo.cpp_comerciales_terceros).toFixed(2));
      pasivo.tributos=numberWithCommas(roundTwoDecimals(pasivo.tributos).toFixed(2));
      pasivo.remuneraciones=numberWithCommas(roundTwoDecimals(pasivo.remuneraciones).toFixed(2));
      pasivo.cpp_diversas=numberWithCommas(roundTwoDecimals(pasivo.cpp_diversas).toFixed(2));
      pasivo.otras_proviciones=numberWithCommas(roundTwoDecimals(pasivo.otras_proviciones).toFixed(2));
      pasivo.anticipos_recibidos=numberWithCommas(roundTwoDecimals(pasivo.anticipos_recibidos).toFixed(2));
      pasivo.obligaciones_financieras=numberWithCommas(roundTwoDecimals(pasivo.obligaciones_financieras).toFixed(2));
      pasivo.TOTAL_PASIVO_CORRIENTE=numberWithCommas(roundTwoDecimals(pasivo.TOTAL_PASIVO_CORRIENTE).toFixed(2));
      pasivo.obligaciones_financieras2=numberWithCommas(roundTwoDecimals(pasivo.obligaciones_financieras2).toFixed(2));
      pasivo.ingresos_diferidos=numberWithCommas(roundTwoDecimals(pasivo.ingresos_diferidos).toFixed(2));
      pasivo.TOTAL_PASIVO_NO_CORRIENTE=numberWithCommas(roundTwoDecimals(pasivo.TOTAL_PASIVO_NO_CORRIENTE).toFixed(2));
      pasivo.capital=numberWithCommas(roundTwoDecimals(pasivo.capital).toFixed(2));
      pasivo.capital_adicional=numberWithCommas(roundTwoDecimals(pasivo.capital_adicional).toFixed(2));
      pasivo.resultados_Acumulados=numberWithCommas(roundTwoDecimals(pasivo.resultados_Acumulados).toFixed(2));
      pasivo.determinacion_resultado=numberWithCommas(roundTwoDecimals(pasivo.determinacion_resultado).toFixed(2));
      pasivo.TOTAL_PATRIMONIO_NETO=numberWithCommas(roundTwoDecimals(pasivo.TOTAL_PATRIMONIO_NETO).toFixed(2));
      pasivo.TOTAL_PASIVO_PATRIMONIO_NETO=numberWithCommas(roundTwoDecimals(pasivo.TOTAL_PASIVO_PATRIMONIO_NETO).toFixed(2));


      // log.debug('jsonTransacion', jsonTransacion);
      let periodSearch = search.lookupFields({
          type: search.Type.ACCOUNTING_PERIOD,
          id: pGloblas.pPeriod,
          columns: ['periodname']
      });

      let periodname_completo = ""
      switch (periodSearch.periodname.substring(0, 3)) {
          case "Ene":
              periodname_completo = periodSearch.periodname.replace("Ene", "Enero")
              break;
          case "Feb":
              periodname_completo = periodSearch.periodname.replace("Feb", "Febrero")
              break;
          case "Mar":
              periodname_completo = periodSearch.periodname.replace("Mar", "Marzo")
              break;
          case "Abr":
              periodname_completo = periodSearch.periodname.replace("Abr", "Abril")
              break;
          case "May":
              periodname_completo = periodSearch.periodname.replace("May", "Mayo")
              break;
          case "Jun":
              periodname_completo = periodSearch.periodname.replace("Jun", "Junio")
              break;
          case "Jul":
              periodname_completo = periodSearch.periodname.replace("Jul", "Julio")
              break;
          case "Ago":
              periodname_completo = periodSearch.periodname.replace("Ago", "Agosto")
              break;
          case "Set":
              periodname_completo = periodSearch.periodname.replace("Set", "Setiembre")
              break;
          case "Oct":
              periodname_completo = periodSearch.periodname.replace("Oct", "Octubre")
              break;
          case "Nov":
              periodname_completo = periodSearch.periodname.replace("Nov", "Noviembre")
              break;
          case "Dic":
              periodname_completo = periodSearch.periodname.replace("Dic", "Diciembre")
              break;
          default:
              periodname_completo = periodSearch.periodname
              break;
      }

      // let accountSearch = search.lookupFields({
      //     type: "account",
      //     id: pGloblas.pCuentaId,
      //     columns: ['custrecord_pe_bank', 'custrecord_pe_bank_account', 'description']
      // });
      // log.debug('accountSearch', accountSearch);

      var anio = periodname_completo.split(' ')[1]

      saldo = saldo.toFixed(2);
      let jsonAxiliar = {
          "company": {
              "firtTitle": companyName.replace(/&/g, '&amp;'),
              "secondTitle": 'Expresado en Moneda Nacional',
              "thirdTitle": 'FORMATO 3.1 - ' + periodSearch.periodname,
          },
          "cabecera": {
              "anio": anio,
              "ruc": companyRuc,
              "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase(),
              //"entidadFinanciera": accountSearch.custrecord_pe_bank[0].text,
              //"codigoCuentaCorriente": accountSearch.description,
          },
          "total": {
              "saldo": numberWithCommas(parseFloat(saldo))
          },
          "movements": jsonTransacion,
          "activo": activo,
          "pasivo": pasivo

      };

      // log.debug('MSK - jsonAxiliar', jsonAxiliar);
      return jsonAxiliar;
  }
  const getRUC = (filterSubsidiary) => {
      try {
          const subLookup = search.lookupFields({
              type: search.Type.SUBSIDIARY,
              id: filterSubsidiary,
              columns: ['taxidnum']
          });
          const ruc = subLookup.taxidnum;
          return ruc;
      } catch (e) {
          log.error({ title: 'getRUC', details: e });
      }
  }
  const getPeriodName = (filterPostingPeriod) => {
      try {
          const perLookup = search.lookupFields({
              type: search.Type.ACCOUNTING_PERIOD,
              id: filterPostingPeriod,
              columns: ['periodname']
          });
          const period = perLookup.periodname;
          return period;
      } catch (e) {
          log.error({ title: 'getPeriodName', details: e });
      }
  }
  const retornaPeriodoString = (campoRegistro01) => {
      if (campoRegistro01 >= '') {
          var valorAnio = campoRegistro01.split(' ')[1];
          var valorMes = campoRegistro01.split(' ')[0];
          if (valorMes.indexOf('Jan') >= 0 || valorMes.indexOf('ene') >= 0) {
              valorMes = '01';
          } else {
              if (valorMes.indexOf('feb') >= 0 || valorMes.indexOf('Feb') >= 0) {
                  valorMes = '02';
              } else {
                  if (valorMes.indexOf('mar') >= 0 || valorMes.indexOf('Mar') >= 0) {
                      valorMes = '03';
                  } else {
                      if (valorMes.indexOf('abr') >= 0 || valorMes.indexOf('Apr') >= 0) {
                          valorMes = '04';
                      } else {
                          if (valorMes.indexOf('may') >= 0 || valorMes.indexOf('May') >= 0) {
                              valorMes = '05';
                          } else {
                              if (valorMes.indexOf('jun') >= 0 || valorMes.indexOf('Jun') >= 0) {
                                  valorMes = '06';
                              } else {
                                  if (valorMes.indexOf('jul') >= 0 || valorMes.indexOf('Jul') >= 0) {
                                      valorMes = '07';
                                  } else {
                                      if (valorMes.indexOf('Aug') >= 0 || valorMes.indexOf('ago') >= 0) {
                                          valorMes = '08';
                                      } else {
                                          if (valorMes.indexOf('set') >= 0 || valorMes.indexOf('sep') >= 0) {
                                              valorMes = '09';
                                          } else {
                                              if (valorMes.indexOf('oct') >= 0) {
                                                  valorMes = '10';
                                              } else {
                                                  if (valorMes.indexOf('nov') >= 0) {
                                                      valorMes = '11';
                                                  } else {
                                                      valorMes = '12';
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
          campoRegistro01 = valorAnio + valorMes + '00';
      }
      return campoRegistro01;
  }

  const getFileName = () => {
      return `LE${companyRuc}${pGloblas.pAnio}1231030100071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
  }

  const getPeriodId = (textAnio) => {
      let startDate = new Date();
      let firstDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      firstDate = format.format({
          value: firstDate,
          type: format.Type.DATE
      });

      let resultSearch = search.create({
          type: "accountingperiod",
          filters: [
              ["isadjust", "is", "F"],
              "AND",
              ["isquarter", "is", "F"],
              "AND",
              ["isyear", "is", "F"],
              "AND",
              ["startdate", "on", firstDate]
          ],
          columns: [
              search.createColumn({
                  name: "internalid"
              })
          ]
      }).run().getRange(0, 1);
      if (resultSearch.length) return resultSearch[0].id;
      return "";
  }

  const saveFile = (stringValue) => {
      var periodname = getPeriodName(pGloblas.pPeriod);
      var periodostring = retornaPeriodoString(periodname);
      var getruc = getRUC(pGloblas.pSubsidiary)
      fedIdNumb = getruc;
      var fileAuxliar = stringValue;
      var urlfile = '';

      nameReport = getFileName();
      //nameReport = 'LE' + fedIdNumb + periodostring + '010200' + '00' + '1' + asinfo + '11_XXX' + pGloblas.pRecordID + '.pdf';

      var folderID = libPe.callFolder();

      fileAuxliar.name = nameReport;
      fileAuxliar.folder = folderID;

      var fileID = fileAuxliar.save();

      let auxFile = file.load({ id: fileID });
      // log.debug('hiii', auxFile)
      urlfile += auxFile.url;
      // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)
      libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
  }

  const getTemplate = () => {
      // log.debug('MSK', 'getTemplate - Inicio');
      var aux = file.load("./Template/PE_Template_Formato_3_1.ftl");
      // log.debug('MSK', 'getTemplate - Fin');
      return aux.getContents();
  }

  const getTransactions = () => {
      // log.debug('MSK', 'getTransactions - Inicio');
      var arrResult = [];
      var _cont = 0;

      // FORMATO 3.24: "Anual: Libro de Invent...dos integrales - 3.24" 
      var savedSearch = search.load({
          id: 'customsearch_pe_libro_impreso_3_1'
      });

      // log.debug(' pGloblas.pSubsidiary', pGloblas.pSubsidiary)
      if (featSubsidiary) {
          savedSearch.filters.push(search.createFilter({
              name: 'subsidiary',
              operator: search.Operator.IS,
              values: pGloblas.pSubsidiary
          }));
      }

    //   savedSearch.filters.push(search.createFilter({
    //       name: 'postingperiod',
    //       operator: search.Operator.IS,
    //       values: [pGloblas.pPeriod]
    //   }));

      // savedSearch.filters.push(search.createFilter({
      //     name: 'account',
      //     operator: search.Operator.IS,
      //     values: pGloblas.pCuentaId
      // }));

      var pagedData = savedSearch.runPaged({
          pageSize: 1000
      });

      var page, columns;

      pagedData.pageRanges.forEach(function (pageRange) {
          page = pagedData.fetch({
              index: pageRange.index
          });

          page.data.forEach(function (result) {
              columns = result.columns;
              // log.debug('result mirame', result);
              arrAux = new Array();
              // 0. CÓDIGO ÚNICO DE LA OPERACIÓN
              arrAux[0] = result.getValue(columns[0]);
              // 1. FECHA DE LA OPERACIÓN	
              arrAux[1] = result.getValue(columns[1]);

              // NOMBRE CODIGO 3.1
              arrAux[2] = result.getValue(columns[2]);
              // NOMBRE CODIGO 3.1
              arrAux[3] = result.getValue(columns[3]);

              arrResult.push(arrAux);
          });
      });
      log.debug('MSK', arrResult);
      return arrResult;
  }

  const getSubdiary = () => {
      // log.debug('MSK', 'getSubdiary - Inicio');

      if (featSubsidiary) {
          // log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary)
          var dataSubsidiary = record.load({
              type: 'subsidiary',
              id: pGloblas.pSubsidiary
          });
          companyName = dataSubsidiary.getValue('legalname');
          companyRuc = dataSubsidiary.getValue('federalidnumber');
      } else {
          companyName = config.getFieldValue('legalname');
      }
      // log.debug('MSK', 'getSubdiary - Fin');
  }

  const getParameters = () => {
      pGloblas = objContext.getParameter('custscript_pe_3_1_inventarios_params');
      pGloblas = JSON.parse(pGloblas);

      pGloblas = {
          pRecordID: pGloblas.recordID,
          pFeature: pGloblas.reportID,
          pSubsidiary: pGloblas.subsidiary,
        pPeriod: pGloblas.periodCon,
          pAnio: pGloblas.anioCon,
          // pCuentaId: pGloblas.cuentaId,
          //pCuentaId: 341,
      }
      // log.debug('MSK - Parámetros', pGloblas);

      featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
  }

  const isObjEmpty = (obj) => {
      for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) return false;
      }

      return true;
  }

  const numberWithCommas = (x) => {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}

const roundTwoDecimals = (value) => {
    return Math.round(value * 100) / 100;
}
  
  return {
      getInputData: getInputData,
      map: map,
      // reduce: reduce,
      summarize: summarize
  };

});
