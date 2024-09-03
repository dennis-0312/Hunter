/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 1.2           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 1.2
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

    var month = "";
    var year = "";
    var hasInfo = "";

    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;

    const getInputData = () => {
        try {
            getParameters();
            return getTransactions();
        } catch (e) {
            log.error("MSK", "getInputData - Error:" + e);
        }
    };

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);
            var resultTransactions = {
                codUniOperacion: dataMap[0],
                fechaOperacion: dataMap[1],
                medioPago: dataMap[2] == "- None -" ? "" : dataMap[2],
                desOperacion: dataMap[3] == "- None -" ? "" : dataMap[3],
                razonSocial: dataMap[4] == "- None -" ? "" : dataMap[4],
                numeroTransaccion: dataMap[5] == "- None -" ? "" : dataMap[5],
                codigoCuentaContable: dataMap[6],
                denominacionCuenta: dataMap[7],
                debito: dataMap[8],
                credito: dataMap[9],
            };

            context.write({
                key: key,
                value: resultTransactions,
            });
        } catch (e) {
            log.error("MSK", "map - Error:" + e);
        }
    };

    const getPeriod = () => {
        var periodRecord = search.lookupFields({
            type: "accountingperiod",
            id: pGloblas.pPeriod,
            columns: ["startdate"],
        });
        var firstDate = format.parse({
            value: periodRecord.startdate,
            type: format.Type.DATE,
        });
        month = firstDate.getMonth() + 1;
        month = month < 10 ? `0${month}` : month;
        year = firstDate.getFullYear();
    };

    const summarize = (context) => {
        getParameters();
        // generateLog();
        getSubdiary();
        getPeriod();
        pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Caja y Banco 1.2");

        var transactionJSON = {};

        transactionJSON["parametros"] = pGloblas;

        transactionJSON["transactions"] = {};
        hasInfo = 0;
        context.output.iterator().each(function (key, value) {
            hasInfo = 1;
            value = JSON.parse(value);

            transactionJSON["transactions"][value.codUniOperacion] = value;
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
      
                * */
            stringXML = renderer.renderAsPdf();
            saveFile(stringXML);

            /**** */

            return true;
        } else {
            libPe.noData(pGloblas.pRecordID);
        }
    };
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
            jsonTransacionvine = new Array(),
            jsonTransacion = {},
            totalDebito = 0;
        totalCredito = 0;
        saldoDebito = 0;
        saldoCredito = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ["firstname", "lastname"],
        });
        var userName = employeeName.firstname + " " + employeeName.lastname;

        // log.debug('transactions', transactions);
        var cantidadLinea = 0;
        var montovieneDebito = 0;
        var montovieneCredito = 0;
        var cantidadFor = 0;
        var cantidadAnterio = 0;

        for (var k in transactions) {
            let IDD = transactions[k].codUniOperacion;
            var resultado1 = divisionRedondeoArriba(transactions[k].desOperacion.length, 15);
            var resultado2 = divisionRedondeoArriba(transactions[k].razonSocial.length, 15);
            var resultado3 = divisionRedondeoArriba(transactions[k].denominacionCuenta.length, 20);
            var mayor = encontrarMayor(resultado1, resultado2, resultado3);

            cantidadLinea = cantidadLinea + mayor + 1;
            if (!jsonTransacion[IDD]) {
                let creditoFormat = numberWithCommas(transactions[k].credito);

                let debitoFormat = numberWithCommas(transactions[k].debito);

                jsonTransacion[IDD] = {
                    number: cantidadFor,
                    codUniOperacion: transactions[k].codUniOperacion,
                    fechaOperacion: transactions[k].fechaOperacion,
                    medioPago: transactions[k].medioPago,
                    desOperacion: transactions[k].desOperacion,
                    razonSocial: transactions[k].razonSocial,
                    numeroTransaccion: transactions[k].numeroTransaccion,
                    codigoCuentaContable: transactions[k].codigoCuentaContable,
                    denominacionCuenta: transactions[k].denominacionCuenta,
                    debito: debitoFormat,
                    credito: creditoFormat,
                };
                cantidadFor = cantidadFor + 1;
                totalDebito = totalDebito + Number(transactions[k].debito);
                totalCredito = totalCredito + Number(transactions[k].credito);
            }

            if (cantidadLinea <= 80) {
                montovieneDebito = Number(montovieneDebito) + Number(transactions[k].debito);
                montovieneCredito = Number(montovieneCredito) + Number(transactions[k].credito);
                cantidadAnterio = cantidadLinea;
            } else {
                jsonTransacionvine.push({
                    montovieneDebito: numberWithCommas(montovieneDebito.toFixed(2)),
                    montovieneCredito: numberWithCommas(montovieneCredito.toFixed(2)),
                    cantidadFor: cantidadFor - 1,
                });

                cantidadLinea = 0;
                cantidadLinea = cantidadLinea + mayor + 1;
                montovieneDebito = Number(montovieneDebito) + Number(transactions[k].debito);
                montovieneCredito = Number(montovieneCredito) + Number(transactions[k].credito);
            }
        }
        log.debug("jsonTransacionvine", jsonTransacionvine);
        if (totalDebito > totalCredito) {
            saldoDebito = totalDebito - totalCredito;
        } else {
            saldoCredito = totalCredito - totalDebito;
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

        let accountSearch = search.lookupFields({
            type: "account",
            id: pGloblas.pCuentaId,
            columns: ["custrecord_pe_bank", "custrecord_pe_bank_account", "description", "custrecord_acct_bank_account_number"],
        });

        let jsonAxiliar = {
            company: {
                firtTitle: companyName.replace(/&/g, "&amp;"),
                secondTitle: "Expresado en Moneda Nacional",
                thirdTitle: "FORMATO 1.2 - " + periodSearch.periodname,
            },
            cabecera: {
                periodo: periodname_completo,
                ruc: companyRuc,
                razonSocial: companyName.replace(/&/g, "&amp;").toUpperCase(),
                entidadFinanciera: accountSearch.custrecord_pe_bank[0].text,
                codigoCuentaCorriente: accountSearch.custrecord_acct_bank_account_number,
            },
            total: {
                totalDebito: numberWithCommas(totalDebito.toFixed(2)),
                totalCredito: numberWithCommas(totalCredito.toFixed(2)),
                saldoDebito: numberWithCommas(saldoDebito.toFixed(2)),
                saldoCredito: numberWithCommas(saldoCredito.toFixed(2)),
            },
            movements: jsonTransacion,
            jsonTransacionvine: jsonTransacionvine,
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
            const fechaActual = new Date();
            const mesActual = fechaActual.getMonth() + 1;

            var valorAnio = campoRegistro01.split(" ")[1];
            var valorMes = campoRegistro01.split(" ")[0];
            if (valorMes.indexOf("Jan") >= 0 || valorMes.indexOf("ene") >= 0) {
                valorMes = "01";
            } else {
                if (valorMes.indexOf("feb") >= 0 || valorMes.indexOf("Feb") >= 0) {
                    if (mesActual == 2) {
                        valorMes = "02";
                    } else {
                        valorMes = "12";
                    }
                } else {
                    if (valorMes.indexOf("mar") >= 0 || valorMes.indexOf("Mar") >= 0) {
                        if (mesActual == 3) {
                            valorMes = "03";
                        } else {
                            valorMes = "12";
                        }
                    } else {
                        if (valorMes.indexOf("abr") >= 0 || valorMes.indexOf("Apr") >= 0) {
                            if (mesActual == 4) {
                                valorMes = "04";
                            } else {
                                valorMes = "12";
                            }
                        } else {
                            if (valorMes.indexOf("may") >= 0 || valorMes.indexOf("May") >= 0) {
                                if (mesActual == 5) {
                                    valorMes = "05";
                                } else {
                                    valorMes = "12";
                                }
                            } else {
                                if (valorMes.indexOf("jun") >= 0 || valorMes.indexOf("Jun") >= 0) {
                                    if (mesActual == 6) {
                                        valorMes = "06";
                                    } else {
                                        valorMes = "12";
                                    }
                                } else {
                                    if (valorMes.indexOf("jul") >= 0 || valorMes.indexOf("Jul") >= 0) {
                                        if (mesActual == 7) {
                                            valorMes = "07";
                                        } else {
                                            valorMes = "12";
                                        }
                                    } else {
                                        if (valorMes.indexOf("Aug") >= 0 || valorMes.indexOf("ago") >= 0) {
                                            if (mesActual == 8) {
                                                valorMes = "08";
                                            } else {
                                                valorMes = "12";
                                            }
                                        } else {
                                            if (valorMes.indexOf("set") >= 0 || valorMes.indexOf("sep") >= 0) {
                                                if (mesActual == 9) {
                                                    valorMes = "09";
                                                } else {
                                                    valorMes = "12";
                                                }
                                            } else {
                                                if (valorMes.indexOf("oct") >= 0) {
                                                    if (mesActual == 10) {
                                                        valorMes = "10";
                                                    } else {
                                                        valorMes = "12";
                                                    }
                                                } else {
                                                    if (valorMes.indexOf("nov") >= 0) {
                                                        if (mesActual == 11) {
                                                            valorMes = "11";
                                                        } else {
                                                            valorMes = "12";
                                                        }
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
        return `LE${companyRuc}${year}${month}00010200001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    };

    const saveFile = (stringValue) => {
        var periodname = getPeriodName(pGloblas.pPeriod);

        var getruc = getRUC(pGloblas.pSubsidiary);
        fedIdNumb = getruc;
        var fileAuxliar = stringValue;
        var urlfile = "";
        //nameReport = 'LE' + fedIdNumb + periodostring + '010200' + '00' + '1' + asinfo + '11_' + pGloblas.pRecordID + '.pdf';
        nameReport = getFileName();
        var folderID = libPe.callFolder();
        fileAuxliar.name = nameReport;
        fileAuxliar.folder = folderID;
        var fileID = fileAuxliar.save();

        let auxFile = file.load({
            id: fileID,
        });

        urlfile += auxFile.url;

        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
    };

    const getTemplate = () => {
        var aux = file.load("./Template/PE_Template_Formato_1_2.ftl");

        return aux.getContents();
    };

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // FORMATO 1.2: "LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE"
        var savedSearch = search.load({
            id: "customsearch_pe_1_2_libro_impreso",
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

        savedSearch.filters.push(
            search.createFilter({
                name: "postingperiod",
                operator: search.Operator.IS,
                values: [pGloblas.pPeriod],
            })
        );

        savedSearch.filters.push(
            search.createFilter({
                name: "account",
                operator: search.Operator.IS,
                values: pGloblas.pCuentaId,
            })
        );

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

                // 2. MEDIO DE PAGO
                arrAux[2] = result.getValue(columns[2]);

                // 3. DESCRIPCIÓN DE LA OPERACIÓN
                arrAux[3] = result.getValue(columns[3]);

                // 4. DENOMINACIÓN O RAZÓN SOCIAL
                arrAux[4] = result.getValue(columns[4]);

                // 5. NÚMERO DE TRANSACCIÓN BANCARIA
                arrAux[5] = result.getValue(columns[5]);

                // 6. CÓDIGO CUENTA CONTABLE ASOCIADA
                arrAux[6] = result.getValue(columns[6]);

                // 7. DENOMINACIÓN CUENTA CONTABLE ASOCIADA
                arrAux[7] = result.getValue(columns[7]);

                // 8. SALDO DEUDOR
                arrAux[8] = result.getValue(columns[8]);

                // 9. SALDO ACREEDOR
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
        }
    };

    const getParameters = () => {
        pGloblas = objContext.getParameter("custscript_pe_formato_1_2_params");
        pGloblas = JSON.parse(pGloblas);

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pPeriod: pGloblas.periodCon,
            pCuentaId: pGloblas.cuentaId,
            //pCuentaId: 341,
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