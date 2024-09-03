/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.14          28 Ago 2023     Ivan Morales <imorales@myevol.biz>             Creación del reporte 3.14
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
    var hasInfo = "";

    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;
    
    const getInputData = () => {
        try {
            getParameters();
            let transactions = getTransactions();
            return transactions;
        } catch (e) {
            log.error('MSK', 'getInputData - Error:' + e);
        }

    }

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);
            var resultTransactions = {
                dato1: (dataMap[0] == "- None -" ? "" : dataMap[0]),
                dato2: (dataMap[1] == "- None -" ? "" : dataMap[1]),
                dato3: (dataMap[2] == "- None -" ? "" : dataMap[2]),
                dato4: dataMap[3],
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
        getParameters();
        getSubdiary();
        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.14")
        var transactionJSON = {};
        transactionJSON["parametros"] = pGloblas
        transactionJSON["transactions"] = {};
        let counter = 0;
        hasInfo = 0;
        context.output.iterator().each((key, value) => {
            counter++;
            hasInfo = 1;
            value = JSON.parse(value);
            transactionJSON["transactions"][counter] = value;
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
                    data: JSON.stringify(jsonAxiliar)
                }
            });

            stringXML = renderer.renderAsPdf();
            saveFile(stringXML);
            log.debug('INFO', 'Termino el proceso');

            return true;

        } else {
            log.debug('INFO', 'No hay datos para procesar');
            libPe.noData(pGloblas.pRecordID);
        }

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
    const getJsonData = (transactions) => {
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacionvine = new Array(),
            jsonTransacion = {},
            suma = 0

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;

        let count = 0;
        var cantidadLinea = 0;
        var montoviene = 0;
        var cantidadFor = 0;
        var cantidadAnterio = 0;
        for (var k in transactions) {
            count++;
            var resultado1 = divisionRedondeoArriba(transactions[k].dato3.length, 24);
            let IDD = transactions[k].dato1;
            cantidadLinea = cantidadLinea + (resultado1*1.5) + 1;
            if (!jsonTransacion[count]) {
                let dato_4 = parseFloat(transactions[k].dato4);
                let dato_3 = transactions[k].dato3;
                jsonTransacion[count] = {
                    number: cantidadFor,
                    dato1: transactions[k].dato1,
                    dato2: transactions[k].dato2,
                    dato3: dato_3.replace(/&/g, '&amp;'),
                    dato4: numberWithCommas(parseFloat(dato_4).toFixed(2)),
                }
                cantidadFor = cantidadFor + 1;
                suma += dato_4;
            }
            if (cantidadLinea <= 90) {
                montoviene = Number(montoviene) + Number(transactions[k].dato4);
                cantidadAnterio = cantidadLinea;
              } else {
        
                jsonTransacionvine.push({
                  montoviene: numberWithCommas(montoviene.toFixed(2)),
                  cantidadFor: cantidadFor - 1
                });
        
        
                cantidadLinea = 0;
                cantidadLinea = cantidadLinea + (resultado1*1.5) + 1;
                montoviene = Number(montoviene) + Number(transactions[k].dato4);
              }
        }

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

        suma = suma.toFixed(2);
        let jsonAxiliar = {
            "company": {
                "firtTitle": companyName.replace(/&/g, '&amp;'),
                "secondTitle": 'Expresado en Moneda Nacional',
                "thirdTitle": 'FORMATO 3.14 - ' + periodSearch.periodname,
            },
            "cabecera": {
                "periodo": periodname_completo,
                "ruc": companyRuc,
                "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase()
            },
            "total": {
                "dato4": numberWithCommas(parseFloat(suma).toFixed(2)),
            },
            "movements": jsonTransacion,
            "jsonTransacionvine": jsonTransacionvine

        };

       
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
        return `LE${companyRuc}${pGloblas.pAnio}1231031400071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    }

    const saveFile = (stringValue) => {
        var periodname = getPeriodName(pGloblas.pPeriod);
        var periodostring = retornaPeriodoString(periodname);
        var getruc = getRUC(pGloblas.pSubsidiary)
        fedIdNumb = getruc;
        var fileAuxliar = stringValue;
        var urlfile = '';

        nameReport = getFileName();

        var folderID = libPe.callFolder();

        fileAuxliar.name = nameReport;
        fileAuxliar.folder = folderID;

        var fileID = fileAuxliar.save();

        let auxFile = file.load({ id: fileID });

        urlfile += auxFile.url;
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
    }

    const getTemplate = () => {
        var aux = file.load("./Template/PE_Template_Formato_3_14.ftl");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // FORMATO 3.24: "Anual: Libro de Invent...dos integrales - 3.24" 
        var savedSearch = search.load({
            id: 'customsearch_pe_libro_impreso_3_14'
        });

        if (featSubsidiary) {
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.IS,
                values: pGloblas.pSubsidiary
            }));
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
            pageSize: 1000
        });

        var page, columns;

        pagedData.pageRanges.forEach((pageRange) => {
            page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach((result) => {
                columns = result.columns;
                arrAux = new Array();
                arrAux[0] = result.getValue(columns[0]);
                arrAux[1] = result.getValue(columns[1]);
                arrAux[2] = result.getValue(columns[2]);
                arrAux[3] = result.getValue(columns[3]);
                arrResult.push(arrAux);
            });
        });
      
          //!DATA PRUEBA - Inicio
          // for(var i=0;i<10;i++){
          //     arrAux = new Array();
          //     arrAux[0] = 'Prueba '+i
          //     arrAux[1] = 'test'
          //     arrAux[2] = 'P-10068002511 JULISSA TATIANA TUESTA CHAVEZ'
          //     arrAux[3] = '12345.65'
          //     arrResult.push(arrAux);
          // }
          //!DATA PRUEBA - Fin
      
        return arrResult;
    }

    const getSubdiary = () => {

        if (featSubsidiary) {
            var dataSubsidiary = record.load({
                type: 'subsidiary',
                id: pGloblas.pSubsidiary
            });
            companyName = dataSubsidiary.getValue('legalname');
            companyRuc = dataSubsidiary.getValue('federalidnumber');
        } else {
            companyName = config.getFieldValue('legalname');
        }
    }

    const getParameters = () => {
        pGloblas = objContext.getParameter('custscript_pe_3_14_inventariosbaldet_par');
        pGloblas = JSON.parse(pGloblas);

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pPeriod: pGloblas.periodCon,
            pAnio: pGloblas.anioCon
        }

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
    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});
