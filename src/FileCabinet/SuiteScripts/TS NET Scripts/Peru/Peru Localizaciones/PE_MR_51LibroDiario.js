/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 5.1           29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 5.1
 *
 */

define(['N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', './PE_LIB_Libros.js', "N/format"], (runtime, search, config, render, record, file, libPe, format) => {

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
    var year = "";
    var month = "";

    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;

    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    const getInputData = () => {
        try {
            getParameters();

            return getTransactions();
        } catch (e) {
            log.error('[ Get Input Data Error ]', e);
        }


    }

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);

            var resultTransactions = {
                numberCorr: dataMap[0],
                date: dataMap[1],
                description: dataMap[2],
                bookCode: dataMap[3],
                numberUnique: dataMap[4],
                numberDoc: dataMap[5],
                code: dataMap[6],
                denomination: dataMap[7],
                debit: dataMap[8],
                credit: dataMap[9],

            };

            context.write({
                key: key,
                value: resultTransactions
            });

        } catch (e) {
            log.error('[ Map Error ]', e);
        }

    }

    const getPeriod = () => {
        var periodRecord = search.lookupFields({
            type: "accountingperiod",
            id: pGloblas.pPeriod,
            columns: ["startdate"]
        });
        var firstDate = format.parse({
            value: periodRecord.startdate,
            type: format.Type.DATE
        });
        month = firstDate.getMonth() + 1;
        month = month < 10 ? `0${month}` : month;
        year = firstDate.getFullYear();
    }

    const summarize = (context) => {
        log.debug('Entro al summarize');
        getParameters();
        getSubdiary();
        getPeriod();

        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Libro Diario 5.1")

        var transactionJSON = {};

        transactionJSON["parametros"] = pGloblas

        transactionJSON["transactions"] = [];
        hasInfo = 0;
        context.output.iterator().each(function (key, value) {
            hasInfo = 1;
            value = JSON.parse(value);

            transactionJSON["transactions"].push(value);
            return true;

        });
        log.debug('transactionJSON', transactionJSON["transactions"]);

        var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

        //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
        if ((transactionJSON["transactions"]).lengt != 0) {
            log.debug('mirame', JSON.stringify(jsonAxiliar));
            log.debug('mirame de nuevo', JSON.stringify(jsonAxiliar.movements))
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
                    name: 'AuxiiliarBumbum',
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
            log.debug('Termino');
            return true;

        } else {
            log.debug('No data');
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
            totalDebit = 0,
            jsonTransacionvine = new Array(),
            totalCredit = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;

        var cantidadLinea = 0;
        var montovieneDebito = 0;
        var montovieneCredito = 0;
        var cantidadFor = 0;
        var cantidadAnterio = 0;

        for (var k in transactions) {
            //let IDD = transactions[k].numberCorr;
            let IDD = k;

            let dato_debit = parseFloat(transactions[k].debit);
            let dato_credit = parseFloat(transactions[k].credit);

            jsonTransacion[IDD] = {
                number: cantidadFor,
                numberCorr: transactions[k].numberCorr,
                date: transactions[k].date,
                description: transactions[k].description,
                bookCode: transactions[k].bookCode,
                numberUnique: transactions[k].numberUnique,
                numberDoc: transactions[k].numberDoc,
                code: transactions[k].code,
                denomination: transactions[k].denomination,
                debit: Number(transactions[k].debit),
                credit: Number(transactions[k].credit),
            }
            cantidadFor = cantidadFor + 1;
            totalDebit += dato_debit;
            totalCredit += dato_credit

        }
        const claves = Object.keys(jsonTransacion);

        // Usar forEach para iterar sobre las claves y acceder a los valores correspondientes
        claves.forEach(function (clave) {

            const valor = jsonTransacion[clave];
            var resultado1 = divisionRedondeoArriba(valor.denomination.length, 24);
            log.debug('caractenes', valor.denomination.length);
            log.debug('resultado1', resultado1);
            cantidadLinea = cantidadLinea + resultado1 + 1;
            log.debug('cantidadLinea', cantidadLinea);

            if (cantidadLinea <= 33) {

                montovieneDebito = Number(montovieneDebito) + Number(valor.debit);
                montovieneCredito = Number(montovieneCredito) + Number(valor.credit);
                cantidadAnterio = cantidadLinea;
            } else {
                jsonTransacionvine.push({
                    montovieneDebito: numberWithCommas(montovieneDebito.toFixed(2)),
                    montovieneCredito: numberWithCommas(montovieneCredito.toFixed(2)),
                    cantidadFor: valor.number - 1
                });
                cantidadLinea = 0;
                cantidadLinea = cantidadLinea + resultado1 + 1;
                montovieneDebito = Number(montovieneDebito) + Number(valor.debit);
                montovieneCredito = Number(montovieneCredito) + Number(valor.credit);
            }
        });

        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: pGloblas.pPeriod,
            columns: ['periodname', "startdate"]
        });
        let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
        let year = periodSearch.startdate.split("/")[2];

        var jsonAxiliar = {
            "company": {
                "firtsTitle": 'FORMATO 5.1: LIBRO DIARIO',
                "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
            },
            "totalDebit": {
                "total": Number(totalDebit)
            },
            "totalCredit": {
                "total": Number(totalCredit)
            },
            "movements": jsonTransacion,
            "jsonTransacionvine": jsonTransacionvine
        };

        return jsonAxiliar;
    }

    const numberWithCommas = (x) => {
        x = x.toString();
        var pattern = /(-?\d+)(\d{3})/;
        while (pattern.test(x))
            x = x.replace(pattern, "$1,$2");
        return x;
    }
    const getFileName = () => {
        return `LE${companyRuc}${year}${month}00050100001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    }

    const saveFile = (stringValue) => {
        var fileAuxliar = stringValue;
        var urlfile = '';

        nameReport = getFileName();

        var folderID = libPe.callFolder();

        fileAuxliar.name = nameReport;
        fileAuxliar.folder = folderID;

        var fileID = fileAuxliar.save();

        let auxFile = file.load({
            id: fileID
        });
        log.debug('hiii', auxFile)
        urlfile += auxFile.url;

        log.debug('pGloblas.pRecordID', pGloblas.pRecordID)
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)

    }

    const getTemplate = () => {
        var aux = file.load("./Template/PE_Template51LibroDiario.ftl");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // PE - Libro Diario 5.1
        var savedSearch = search.load({
            id: 'customsearch_pe_libro_diario_5_1'
        });

        if (featSubsidiary) {
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.IS,
                values: pGloblas.pSubsidiary
            }));
        }

        savedSearch.filters.push(search.createFilter({
            name: 'postingperiod',
            operator: search.Operator.IS,
            values: [pGloblas.pPeriod]
        }));

        savedSearch.columns.push(search.createColumn({
            name: 'formulatext',
            formula: "{tranid}",
        }))

        savedSearch.columns.push(search.createColumn({
            name: 'formulatext',
            formula: "NVL({account.displayname},'')",
        }))

        let searchResultCount = savedSearch.runPaged().count;

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
                arrAux = new Array();

                // 0. NÚMERO CORRELATIVO DEL ASIENTO O CÓDIGO ÚNICO DE LA OPERACIÓN
                arrAux[0] = result.getValue(columns[1]);

                // 1. FECHA DE LA OPERACIÓN
                arrAux[1] = result.getValue(columns[14]);

                // 2. GLOSA O DESCRIPCIÓN DE LA OPERACIÓN
                arrAux[2] = result.getValue(columns[15]);

                // 3. CÓDIGO DEL LIBRO O REGISTRO (TABLA 8)
                arrAux[3] = 5;

                // 4. NÚMERO CORRELATIVO
                arrAux[4] = result.getValue(columns[2]);

                // 5. NÚMERO DEL DOCUMENTO SUSTENTATORIO
                arrAux[5] = result.getValue(columns[24]);

                // 6. CÓDIGO
                arrAux[6] = result.getValue(columns[3]);

                // 7. DENOMINACION
                arrAux[7] = result.getValue(columns[25]);

                // 8. DEBE
                arrAux[8] = Number(result.getValue(columns[17])).toFixed(2);

                // 9. HABER
                arrAux[9] = Number(result.getValue(columns[18])).toFixed(2);

                arrResult.push(arrAux);
            });
        });
        return arrResult;
    }

    const getSubdiary = () => {

        if (featSubsidiary) {
            log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary)
            var dataSubsidiary = record.load({
                type: 'subsidiary',
                id: pGloblas.pSubsidiary
            });
            companyName = dataSubsidiary.getValue('legalname');
            companyRuc = dataSubsidiary.getValue('federalidnumber');
        } else {
            companyName = config.getFieldValue('legalname');
            companyRuc = ''
        }
    }

    const getParameters = () => {
        pGloblas = objContext.getParameter('custscript_pe_51librodiario_params'); // || {};
        pGloblas = JSON.parse(pGloblas);
        log.debug('previo', pGloblas)

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pPeriod: pGloblas.periodCon,
        }
        log.debug('XDDD', pGloblas);

        featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
    }

    const isObjEmpty = (obj) => {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }

        return true;
    }

    function CompletarCero(tamano, valor) {
        var strValor = valor + '';
        var lengthStrValor = strValor.length;
        var nuevoValor = valor + '';

        if (lengthStrValor <= tamano) {
            if (tamano != lengthStrValor) {
                for (var i = lengthStrValor; i < tamano; i++) {
                    nuevoValor = '0' + nuevoValor;
                }
            }
            return nuevoValor;
        } else {
            return nuevoValor.substring(0, tamano);
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});