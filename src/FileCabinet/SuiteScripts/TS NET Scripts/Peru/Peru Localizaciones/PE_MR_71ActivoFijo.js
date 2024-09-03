/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 7.1           18 Set 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 7.1
 *
 */

define(['N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', './PE_LIB_Libros.js'], (runtime, search, config, render, record, file, libPe) => {

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

    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;
    
    var hasInfo=0;
    var month = "00";
    var year = "";

    const getInputData = () => {
        log.debug('MSK', 'getInputData - Inicio');
        try {
            getParameters();
            return getTransactions();
        } catch (e) {
            log.error('MSK', 'getInputData - Error:' + e);
        }
        log.debug('MSK', 'getInputData - Fin');

    }

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);
            var resultTransactions = {
                col_01_periodo: dataMap[0],
                col_02_cuo: dataMap[1],
                col_03_correltivo: dataMap[2],
                col_04_codCatUtilizado: dataMap[3],
                col_05_codPropioActivo: dataMap[4],
                col_06_codCatUtil: (dataMap[5] == "- None -" ? "" : dataMap[5]),
                col_07_codExistencia: (dataMap[6] == "- None -" ? "" : dataMap[6]),
                col_08: dataMap[7],
                col_09: dataMap[8],
                col_10: dataMap[9],
                col_11: dataMap[10],
                col_12: dataMap[11],
                col_13: dataMap[12],
                col_14: dataMap[13],
                col_15: dataMap[14],
                col_16: dataMap[15],
                col_17: dataMap[16],
                col_18: dataMap[17],
                col_19: dataMap[18],
                col_20: dataMap[19],
                col_21: dataMap[20],
                col_22: dataMap[21],
                col_23: dataMap[22],
                col_24: dataMap[23],
                col_25: dataMap[24],
                col_26: dataMap[25],
                col_27: dataMap[26],
                col_28: dataMap[27],
                col_29: dataMap[28],
                col_30: dataMap[29],
                col_31: dataMap[30],
                col_32: dataMap[31],
                col_33: dataMap[32],
                col_34: dataMap[33],
                col_35: dataMap[34],
                col_36: dataMap[35],
                col_37: dataMap[36]
            };

            context.write({
                key: key,
                value: resultTransactions
            });
            //log.error('MSK', 'en map - ' + dataMap[0]);

        } catch (e) {
            log.error('MSK', 'map - Error:' + e);
        }
    }

    const summarize = (context) => {
        log.debug('MSK', 'summarize - Inicio');
        getParameters();
        // generateLog();
        getSubdiary();
        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.anioCon, "Registro de Activos Fijos 7.1")

        var transactionJSON = {};

        transactionJSON["parametros"] = pGloblas

        transactionJSON["transactions"] = {
        };
        context.output.iterator().each(function (key, value) {
            value = JSON.parse(value);

            transactionJSON["transactions"][value.col_02_cuo] = value;
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

                log.debug({
                    title: 'URL ARCHIVO TEMP',
                    details: idfile
                });

            }

            *** */
            stringXML = renderer.renderAsPdf();
            saveFile(stringXML);


            /**** */
            log.debug('Termino');
            return true;

        } else {
            log.debug('No data');
            libPe.noData(pGloblas.pRecordID);
        }
        log.debug('MSK', 'summarize - Fin');

    }

    const getJsonData = (transactions) => {
        //log.debug('MSK', 'getJsonData - Inicio');
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacion = {},
            totalMonto_15 = 0;
        totalMonto_16 = 0;
        totalMonto_17 = 0;
        totalMonto_18 = 0;
        totalMonto_19 = 0;
        totalMonto_20 = 0;
        totalMonto_21 = 0;
        totalMonto_22 = 0;
        totalMonto_23 = 0;
        totalMonto_28 = 0;
        totalMonto_29 = 0;
        totalMonto_30 = 0;
        totalMonto_35 = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;

        //log.debug('transactions', transactions);

        for (var k in transactions) {
            let IDD = transactions[k].col_02_cuo;
            if (!jsonTransacion[IDD]) {
                jsonTransacion[IDD] = {
                    col_01_periodo: transactions[k].col_01_periodo,
                    col_02_cuo: transactions[k].col_02_cuo,
                    col_03_correltivo: transactions[k].col_03_correltivo,
                    col_04_codCatUtilizado: transactions[k].col_04_codCatUtilizado,
                    col_05_codPropioActivo: transactions[k].col_05_codPropioActivo,
                    col_06_codCatUtil: transactions[k].col_06_codCatUtil,
                    col_07_codExistencia: transactions[k].col_07_codExistencia,
                    col_08: transactions[k].col_08,
                    col_09: transactions[k].col_09,
                    col_10: transactions[k].col_10,
                    col_11: transactions[k].col_11,
                    col_12: transactions[k].col_12,
                    col_13: transactions[k].col_13,
                    col_14: transactions[k].col_14,
                    col_15: numberWithCommas(roundTwoDecimals(transactions[k].col_15).toFixed(2)),
                    col_16: numberWithCommas(roundTwoDecimals(transactions[k].col_16).toFixed(2)),
                    col_17: numberWithCommas(roundTwoDecimals(transactions[k].col_17).toFixed(2)),
                    col_18: numberWithCommas(roundTwoDecimals(transactions[k].col_18).toFixed(2)),
                    col_19: numberWithCommas(roundTwoDecimals(transactions[k].col_19).toFixed(2)),
                    col_20: numberWithCommas(roundTwoDecimals(transactions[k].col_20).toFixed(2)),
                    col_21: numberWithCommas(roundTwoDecimals(transactions[k].col_21).toFixed(2)),
                    col_22: numberWithCommas(roundTwoDecimals(transactions[k].col_22).toFixed(2)),
                    col_23: numberWithCommas(roundTwoDecimals(transactions[k].col_23).toFixed(2)),
                    col_24: transactions[k].col_24,
                    col_25: transactions[k].col_25,
                    col_26: transactions[k].col_26,
                    col_27: transactions[k].col_27,
                    col_28: numberWithCommas(roundTwoDecimals(transactions[k].col_28).toFixed(2)),
                    col_29: numberWithCommas(roundTwoDecimals(transactions[k].col_29).toFixed(2)),
                    col_30: numberWithCommas(roundTwoDecimals(transactions[k].col_30).toFixed(2)),
                    col_31: transactions[k].col_31,
                    col_32: transactions[k].col_32,
                    col_33: transactions[k].col_33,
                    col_34: transactions[k].col_34,
                    col_35: transactions[k].col_35,
                    col_36: transactions[k].col_36,
                    col_37: transactions[k].col_37
                }
                totalMonto_15 = totalMonto_15 + Number(transactions[k].col_15);
                totalMonto_16 = totalMonto_16 + Number(transactions[k].col_16);
                totalMonto_17 = totalMonto_17 + Number(transactions[k].col_17);
                totalMonto_18 = totalMonto_18 + Number(transactions[k].col_18);
                totalMonto_19 = totalMonto_19 + Number(transactions[k].col_19);
                totalMonto_20 = totalMonto_20 + Number(transactions[k].col_20);
                totalMonto_21 = totalMonto_21 + Number(transactions[k].col_21);
                totalMonto_22 = totalMonto_22 + Number(transactions[k].col_22);
                totalMonto_23 = totalMonto_23 + Number(transactions[k].col_23);
                totalMonto_28 = totalMonto_28 + Number(transactions[k].col_28);
                totalMonto_29 = totalMonto_29 + Number(transactions[k].col_29);
                totalMonto_30 = totalMonto_30 + Number(transactions[k].col_30);
                totalMonto_35 = totalMonto_35 + Number(transactions[k].col_35);
                
                hasInfo=1;
            }
        }

        log.debug('jsonTransacion', jsonTransacion);
        //totalMonto_15 = numberFormat(totalMonto_15);
        
        // let periodSearch = search.lookupFields({
        //     type: search.Type.ACCOUNTING_PERIOD,
        //     id: pGloblas.pPeriod,
        //     columns: ['periodname']
        // });
        // let accountSearch = search.lookupFields({
        //     type: "account",
        //     id: pGloblas.pCuentaId,
        //     columns: ['custrecord_pe_bank','custrecord_pe_bank_account']
        // });
        year = pGloblas.pAnio

        let jsonAxiliar = {
            "company": {
                "firtTitle": companyName.replace(/&/g, '&amp;'),
                "secondTitle": 'Expresado en Moneda Nacional',
                "thirdTitle": 'FORMATO 7.1: "REGISTRO DE ACTIVOS FIJOS - DETALLE DE LOS ACTIVOS FIJOS" - ' + pGloblas.Anio,
            },
            "cabecera": {
                "Anio": pGloblas.pAnio,
                "ruc": companyRuc,
                "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase(),
                // "entidadFinanciera":accountSearch.custrecord_pe_bank[0].text,
                // "codigoCuentaCorriente":accountSearch.custrecord_pe_bank_account
            },
            "total": {
                "totalMonto_15": numberWithCommas(roundTwoDecimals(totalMonto_15).toFixed(2)),
                "totalMonto_16": numberWithCommas(roundTwoDecimals(totalMonto_16).toFixed(2)),
                "totalMonto_17": numberWithCommas(roundTwoDecimals(totalMonto_17).toFixed(2)),
                "totalMonto_18": numberWithCommas(roundTwoDecimals(totalMonto_18).toFixed(2)),
                "totalMonto_19": numberWithCommas(roundTwoDecimals(totalMonto_19).toFixed(2)),
                "totalMonto_20": numberWithCommas(roundTwoDecimals(totalMonto_20).toFixed(2)),
                "totalMonto_21": numberWithCommas(roundTwoDecimals(totalMonto_21).toFixed(2)),
                "totalMonto_22": numberWithCommas(roundTwoDecimals(totalMonto_22).toFixed(2)),
                "totalMonto_23": numberWithCommas(roundTwoDecimals(totalMonto_23).toFixed(2)),
                "totalMonto_28": numberWithCommas(roundTwoDecimals(totalMonto_28).toFixed(2)),
                "totalMonto_29": numberWithCommas(roundTwoDecimals(totalMonto_29).toFixed(2)),
                "totalMonto_30": numberWithCommas(roundTwoDecimals(totalMonto_30).toFixed(2)),
                "totalMonto_35": numberWithCommas(roundTwoDecimals(totalMonto_35).toFixed(2)),
            },
            "movements": jsonTransacion

        };

        //log.debug('MSK - jsonAxiliar', jsonAxiliar);
        return jsonAxiliar;
    }

    const saveFile = (stringValue) => {
        var fileAuxliar = stringValue;
        var urlfile = '';
        // if (featSubsidiary) {
        //     nameReport = 'Formato 7.1_' + companyName + '.' + formatReport;
        // } else {
        //     nameReport = 'Formato 7.1_' + '.' + formatReport;
        // }
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

    const getFileName = () => {
        return `LE${companyRuc}${year}${month}00070100001${hasInfo}11_${pGloblas.pRecordID}.pdf`;

     }

    const getTemplate = () => {
        log.debug('MSK', 'getTemplate - Inicio');
        var aux = file.load("./Template/PE_Template71ActivoFijo.ftl");
        log.debug('MSK', 'getTemplate - Fin');
        return aux.getContents();
    }

    const getTransactions = () => {
        log.debug('MSK', 'getTransactions - Inicio');
        var arrResult = [];
        var _cont = 0;

        // FORMATO 7.1: "Registro de Activos Fijos 7.1"
        var savedSearch = search.load({
            id: 'customsearch_pe_reporte_7_1'
        });

        log.debug(' pGloblas.pSubsidiary', pGloblas.pSubsidiary)
        if (featSubsidiary) {
            savedSearch.filters.push(search.createFilter({
                name: 'custrecord_deprhistsubsidiary',
                operator: search.Operator.IS,
                values: pGloblas.pSubsidiary
            }));
        }

        // savedSearch.filters.push(search.createFilter({
        //     name: 'postingperiod',
        //     operator: search.Operator.IS,
        //     values: [pGloblas.pPeriod]
        // }));

        savedSearch.filters.push(search.createFilter({
            name: 'formulatext',
            formula: "CONCAT(SUBSTR({custrecord_deprhistdate},7,4), '0000')",
            operator: search.Operator.IS,
            values: pGloblas.pAnio + '0000'
        }));


        // savedSearch.filters.push(search.createFilter({
        //     name: 'account',
        //     operator: search.Operator.IS,
        //     values: pGloblas.pCuentaId
        // }));

        // Agregar filtro para el año 2023
        // savedSearch.filters.push(search.createFilter({
        //     name: 'postingperiod',
        //     operator: search.Operator.WITHIN,
        //     values: ['startofyear', 'endofyear', 'FY'+pGloblas.pAnio]
        // }));
        // savedSearch.filters.push(search.createFilter({
        //     name: 'periodname',
        //     join: 'accountingPeriod',
        //     operator: search.Operator.CONTAINS,
        //     values: pGloblas.pAnio
        // }));

        log.debug('MSK', 'pGloblas.pAnio =>' + pGloblas.pAnio)
        log.debug('MSK', 'antes del pagedData')

        var pagedData = savedSearch.runPaged({
            pageSize: 1000
        });
        log.debug('MSK', 'despues del pagedData')

        var page, columns;

        var cont = 0
        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach(function (result) {
                columns = result.columns;
                arrAux = new Array();
                cont++

                //TEMPORAL
                //if(cont<100)
                {
                    arrAux[0] = result.getValue(columns[0]);

                    arrAux[1] = result.getValue(columns[1]);

                    arrAux[2] = result.getValue(columns[2]);

                    arrAux[3] = result.getValue(columns[3]);

                    arrAux[4] = result.getValue(columns[4]);

                    arrAux[5] = result.getValue(columns[5]);

                    arrAux[6] = result.getValue(columns[6]);

                    arrAux[7] = result.getValue(columns[7]);

                    arrAux[8] = result.getValue(columns[8]);

                    arrAux[9] = result.getValue(columns[9]);
                    arrAux[10] = result.getValue(columns[10]);
                    arrAux[11] = result.getValue(columns[11]);
                    arrAux[12] = result.getValue(columns[12]);
                    arrAux[13] = result.getValue(columns[13]);
                    arrAux[14] = result.getValue(columns[14]);
                    arrAux[15] = result.getValue(columns[15]);
                    arrAux[16] = result.getValue(columns[16]);
                    arrAux[17] = result.getValue(columns[17]);
                    arrAux[18] = result.getValue(columns[18]);
                    arrAux[19] = result.getValue(columns[19]);
                    arrAux[20] = result.getValue(columns[20]);
                    arrAux[21] = result.getValue(columns[21]);
                    arrAux[22] = result.getValue(columns[22]);
                    arrAux[23] = result.getValue(columns[23]);
                    arrAux[24] = result.getValue(columns[24]);
                    arrAux[25] = result.getValue(columns[25]);
                    arrAux[26] = result.getValue(columns[26]);
                    arrAux[27] = result.getValue(columns[27]);
                    arrAux[28] = result.getValue(columns[28]);
                    arrAux[29] = result.getValue(columns[29]);
                    arrAux[30] = result.getValue(columns[30]);
                    arrAux[31] = result.getValue(columns[31]);
                    arrAux[32] = result.getValue(columns[32]);
                    arrAux[33] = result.getValue(columns[33]);
                    arrAux[34] = result.getValue(columns[34]);
                    arrAux[35] = result.getValue(columns[35]);
                    arrAux[36] = result.getValue(columns[36]);

                    arrResult.push(arrAux);
                }

            });
        });
        log.debug('MSK', 'cont = '+cont)
        log.debug('MSK', 'getTransactions - Fin');
        return arrResult;
    }

    const getSubdiary = () => {
        log.debug('MSK', 'getSubdiary - Inicio');

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
        }
        log.debug('MSK', 'getSubdiary - Fin');
    }

    const getParameters = () => {
        pGloblas = objContext.getParameter('custscript_pe_mr_71activofijo_params');
        pGloblas = JSON.parse(pGloblas);

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pAnio: pGloblas.anioCon
        }
        log.debug('MSK - Parámetros', pGloblas);

        featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
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

    const isObjEmpty = (obj) => {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});
