/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.9           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 3.9
 *
 */

define(['N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', './PE_LIB_Libros.js', 'N/format'], (runtime, search, config, render, record, file, libPe, format) => {

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

    const FOLDER_ID = 871;//532

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
                dato1: dataMap[0].replace("- None -", ""),
                dato2: dataMap[1].replace("- None -", ""),
                dato3: dataMap[2].replace("- None -", ""),
                dato4: (dataMap[3] == "" ? 0 : dataMap[3]),
                dato5: (dataMap[4] == "" ? 0 : dataMap[4]),
                dato6: (dataMap[5] == "" ? 0 : dataMap[5]),
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
        getSubdiary();
        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.9")
        var transactionJSON = {};
        transactionJSON["parametros"] = pGloblas
        transactionJSON["transactions"] = {};
        hasInfo = 0;
        let counter = 0;
        context.output.iterator().each((key, value) => {
            counter++;
            hasInfo = 1;
            value = JSON.parse(value);
            transactionJSON["transactions"][counter] = value;
            // log.debug('transactionJSONIntro', transactionJSON["transactions"]);
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
    const getJsonData = (transactions) => {
        // log.debug('MSK', 'getJsonData - Inicio');
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacion = {},
            jsonTransacionvine = new Array(),
            totalContable = 0,
            totalAmortizacion = 0,
            totalNeto = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;

        // log.debug('transactions', transactions);
        var cantidadLinea = 0;
        var montovienevalorContable = 0;
        var montovieneamortizacion = 0;
        var montovienevalorNeto = 0;
        var cantidadFor = 0;
        var cantidadAnterio = 0;
        let count = 0;
        let nuevoValorNeto = 0;

        for (var k in transactions) {
            count++;
            let IDD = transactions[k].dato1;
            var resultado1 = divisionRedondeoArriba(transactions[k].dato2.length, 50);
            cantidadLinea = cantidadLinea + resultado1 + 1;
            // log.debug('cantidadLinea',cantidadLinea);
            if (!jsonTransacion[count]) {
                let dato_4 = parseFloat(transactions[k].dato4);
                let dato_5 = parseFloat(transactions[k].dato5);
                let dato_6 = parseFloat(transactions[k].dato6);
                nuevoValorNeto = nuevoValorNeto + dato_4 - dato_5;
                //log.debug('dato_2', dato_2);
                // let debitoFormat = numberWithCommas(transactions[k].debito);
                // log.debug('debitoFormat', debitoFormat);
                jsonTransacion[count] = {
                    number: cantidadFor,
                    inicioOperacion: transactions[k].dato1,
                    descripcion: transactions[k].dato2,
                    tipo: transactions[k].dato3,
                    valorContable: dato_4,
                    amortizacion: dato_5,
                    //valorNeto: dato_6,
                    valorNeto: nuevoValorNeto
                }
                cantidadFor = cantidadFor + 1;
                totalContable += dato_4;
                totalAmortizacion += dato_5;
                totalNeto += dato_4 - dato_5;
            }
            if (cantidadLinea <= 110) {
                montovienevalorContable = Number(montovienevalorContable) + Number(transactions[k].dato4);
                montovieneamortizacion = Number(montovieneamortizacion) + Number(transactions[k].dato5);
                montovienevalorNeto = Number(montovienevalorNeto) + Number(transactions[k].dato4) - Number(transactions[k].dato5);
                cantidadAnterio = cantidadLinea;
            } else {

                jsonTransacionvine.push({
                    montovienevalorContable: formatearNumeroConComas(montovienevalorContable.toFixed(2)),
                    montovieneamortizacion: formatearNumeroConComas(montovieneamortizacion.toFixed(2)),
                    montovienevalorNeto: formatearNumeroConComas(montovienevalorNeto.toFixed(2)),
                    cantidadFor: cantidadFor - 1
                });


                cantidadLinea = 0;
                cantidadLinea = cantidadLinea + resultado1 + 1;
                montovienevalorContable = Number(montovienevalorContable) + Number(transactions[k].dato4);
                montovieneamortizacion = Number(montovieneamortizacion) + Number(transactions[k].dato5);
                montovienevalorNeto = Number(montovienevalorNeto) + Number(transactions[k].dato6);
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

        // let accountSearch = search.lookupFields({
        //     type: "account",
        //     id: pGloblas.pCuentaId,
        //     columns: ['custrecord_pe_bank', 'custrecord_pe_bank_account', 'description']
        // });
        // log.debug('accountSearch', accountSearch);
        let jsonAxiliar = {
            "company": {
                "firtTitle": companyName.replace(/&/g, '&amp;'),
                "secondTitle": 'Expresado en Moneda Nacional',
                "thirdTitle": 'FORMATO 3.9 - ' + periodSearch.periodname,
            },
            "cabecera": {
                "periodo": pGloblas.pAnio,
                "ruc": companyRuc,
                "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase()
            },
            "total": {
                "totalContable": totalContable,
                "totalAmortizacion": totalAmortizacion,
                "totalNeto": totalNeto
            },
            "movements": jsonTransacion,
            "jsonTransacionvine": jsonTransacionvine

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
        return `LE${companyRuc}${pGloblas.pAnio}1231030900071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    }

    const saveFile = (stringValue) => {
        asinfo = '1';

        var periodname = getPeriodName(pGloblas.pPeriod);
        var periodostring = retornaPeriodoString(periodname);
        var getruc = getRUC(pGloblas.pSubsidiary)
        fedIdNumb = getruc;
        var fileAuxliar = stringValue;
        var urlfile = '';

        nameReport = getFileName();
        //nameReport = 'LE' + fedIdNumb + periodostring + '010200' + '00' + '1' + asinfo + '11_X' + pGloblas.pRecordID + '.pdf';

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
        var aux = file.load("./Template/PE_Template_Formato_3_9.ftl");
        // log.debug('MSK', 'getTemplate - Fin');
        return aux.getContents();
    }

    const getTransactions = () => {
        // log.debug('MSK', 'getTransactions - Inicio');
        var arrResult = [];
        var _cont = 0;

        // FORMATO 3.24: "Anual: Libro de Invent...dos integrales - 3.24" 
        var savedSearch = search.load({
            id: 'customsearch_pe_libro_impreso_3_9'
        });

        // log.debug(' pGloblas.pSubsidiary', pGloblas.pSubsidiary)
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

        // savedSearch.filters.push(search.createFilter({
        //     name: 'account',
        //     operator: search.Operator.IS,
        //     values: pGloblas.pCuentaId
        // }));

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
                arrAux[4] = result.getValue(columns[4]);
                arrAux[5] = result.getValue(columns[5]);

                arrResult.push(arrAux);
            });
        });
        log.debug('MSK arrResult', arrResult.length);
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
        pGloblas = objContext.getParameter('custscript_pe_3_9_saldo_params');
        pGloblas = JSON.parse(pGloblas);

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pPeriod: pGloblas.periodCon,
            pAnio: pGloblas.anioCon
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
    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});