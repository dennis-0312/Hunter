/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 1.2           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 1.2
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
                dato3: dataMap[2],
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

    const summarize = (context) => {
        // log.debug('MSK', 'summarize - Inicio');
        getParameters();
        // generateLog();
        getSubdiary();
        var periodId = getPeriodId();
        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, periodId, "Caja y Banco 3.25")

        var transactionJSON = {};

        transactionJSON["parametros"] = pGloblas

        transactionJSON["transactions"] = {
        };
        hasInfo = 0;
        context.output.iterator().each((key, value) => {
            hasInfo = 1;
            value = JSON.parse(value);
            transactionJSON["transactions"][value.dato3] = value;
            return true;

        });
        log.debug('transactionJSON', transactionJSON["transactions"]);

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

        for (var k in transactions) {
            let IDD = transactions[k].dato1;

            // if (!jsonTransacion[IDD]) {
                let dato_4 = parseFloat(transactions[k].dato4);
                log.debug('dato_4', dato_4);

                // let debitoFormat = numberWithCommas(transactions[k].debito);
                // log.debug('debitoFormat', debitoFormat);
                jsonTransacion[IDD] = {
                    dato1: transactions[k].dato1,
                    dato2: transactions[k].dato2,
                    dato3: transactions[k].dato3,
                    dato4: dato_4,
                }
                saldo += dato_4;
                // totalCredito = totalCredito + Number(transactions[k].credito);
            // }
        }

        // if (totalDebito > totalCredito) {
        //     saldoDebito = totalDebito - totalCredito
        // } else {
        //     saldoCredito = totalCredito - totalDebito
        // }

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

        let jsonAxiliar = {
            "company": {
                "firtTitle": companyName.replace(/&/g, '&amp;'),
                "secondTitle": 'Expresado en Moneda Nacional',
                "thirdTitle": 'FORMATO 3.25 - ' + periodSearch.periodname,
            },
            "cabecera": {
                "periodo": periodname_completo,
                "ruc": companyRuc,
                "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase(),
                //"entidadFinanciera": accountSearch.custrecord_pe_bank[0].text,
                //"codigoCuentaCorriente": accountSearch.description,
            },
            "total": {
                // "totalDebito": totalDebito.toFixed(2),
                // "totalCredito": totalCredito.toFixed(2),
                // "saldoDebito": saldoDebito.toFixed(2),
                "saldo": numberWithCommas(saldo)
            },
            "movements": jsonTransacion

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
        return `LE${companyRuc}${pGloblas.pAnio}1231032500071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
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
        // log.debug('hiii', auxFile)
        urlfile += auxFile.url;
        // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
    }

    const getTemplate = () => {
        // log.debug('MSK', 'getTemplate - Inicio');
        var aux = file.load("./Template/PE_Template_Formato_3_25.ftl");
        // log.debug('MSK', 'getTemplate - Fin');
        return aux.getContents();
    }

    const getTransactions = () => {
        // log.debug('MSK', 'getTransactions - Inicio');
        var arrResult = [];
        var _cont = 0;

        // FORMATO 3.24: "Anual: Libro de Invent...dos integrales - 3.24" 
        var savedSearch = search.load({
            id: 'customsearch_pe_libro_impreso_3_25'
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

        let searchResultCount = savedSearch.runPaged().count;
        log.debug("transactionSearchObj result count", searchResultCount);

        // savedSearch.filters.push(search.createFilter({
        //     name: 'postingperiod',
        //     operator: search.Operator.IS,
        //     values: [pGloblas.pPeriod]
        // }));

        // savedSearch.filters.push(search.createFilter({
        //     name: 'account',
        //     operator: search.Operator.IS,
        //     values: pGloblas.pCuentaId
        // }));

        var pagedData = savedSearch.runPaged({ pageSize: 1000 });

        var page, columns;
        let contador = 0
        pagedData.pageRanges.forEach((pageRange) => {
            page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach((result) => {
                columns = result.columns;
                log.debug('contador+++++++++++++++++++', contador);
                // log.debug('result mirame', result);
                arrAux = new Array();

                // 0. CÓDIGO ÚNICO DE LA OPERACIÓN
                arrAux[0] = result.getValue(columns[0]);

                // 1. FECHA DE LA OPERACIÓN	
                arrAux[1] = result.getValue(columns[1]);

                // 2. MEDIO DE PAGO	
                arrAux[2] = result.getValue(columns[2]);

                // 3. DESCRIPCIÓN DE LA OPERACIÓN
                arrAux[3] = result.getValue(columns[3]);

                // 4. DENOMINACIÓN O RAZÓN SOCIAL
                // arrAux[4] = result.getValue(columns[4]);

                // // 5. NÚMERO DE TRANSACCIÓN BANCARIA
                // arrAux[5] = result.getValue(columns[5]);

                // // 6. CÓDIGO CUENTA CONTABLE ASOCIADA
                // arrAux[6] = result.getValue(columns[6]);

                // // 7. DENOMINACIÓN CUENTA CONTABLE ASOCIADA
                // arrAux[7] = result.getValue(columns[7]);

                // // 8. SALDO DEUDOR
                // arrAux[8] = result.getValue(columns[8]);

                // // 9. SALDO ACREEDOR
                // arrAux[9] = result.getValue(columns[9]);
                contador++
                arrResult.push(arrAux);
            });
        });
        log.debug('MSKLENFTH', arrResult.length);
        log.debug('MSK', arrResult);
        //!DATA PRUEBA - Inicio
         for(var i=0;i<10;i++){
             arrAux = new Array();
             arrAux[0] = '2023/09'
             arrAux[1] = '09'
             arrAux[2] = '5D010'+i
             arrAux[3] = '-120148.56'
             arrResult.push(arrAux);
         }
        //!DATA PRUEBA - Fin
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
        pGloblas = objContext.getParameter('custscript_pe_formato_3_25_params');
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
