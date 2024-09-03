/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                                    Remarks
 * 13.1           30 Set 2023     Dennis Fernández <dennis.fernandez@myevol.biz>          - Creación del reporte 13.1
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
    var month = "";
    var year = "";
    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;
    var hasInfo;

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
                columna01: dataMap[0],
                columna02: dataMap[1],
                columna03: dataMap[2],
                columna04: dataMap[3],
                columna05: dataMap[4],
                columna06: dataMap[5] == (null || "") ? 0 : dataMap[5],
                columna07: dataMap[6] == (null || "") ? 0 : dataMap[6],
                columna08: dataMap[7] == (null || "") ? 0 : dataMap[7],
                columna09: dataMap[8] == (null || "") ? 0 : dataMap[8],
                columna10: dataMap[9] == (null || "") ? 0 : dataMap[9],
                columna11: dataMap[10] == (null || "") ? 0 : dataMap[10],
                columna12: dataMap[11] == (null || "") ? 0 : dataMap[11],
                columna13: dataMap[12] == (null || "") ? 0 : dataMap[12],
                columna14: dataMap[13] == (null || "") ? 0 : dataMap[13],
                columna15: dataMap[14] == "- None -" ? "" : dataMap[14],

            };
            context.write({ key: key, value: resultTransactions });
        } catch (e) {
            log.error('[ Map Error ]', e);
        }
    }

    const summarize = (context) => {
        log.debug('Entro al summarize');
        getParameters();
        getSubdiary();
        getPeriod();
        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Permanente Valorizado 13.1")
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

        if ((transactionJSON["transactions"]).length != 0 && hasInfo == 1) {
            var renderer = render.create();
            renderer.templateContent = getTemplate();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "input",
                data: {
                    data: JSON.stringify(jsonAxiliar)
                }
            });

            var FolderId = libPe.callFolder();
            log.debug('trazaa 1', 'trazaa 1');
            if (FolderId != "" && FolderId != null) {
                // Crea el archivo
                var fileAux = file.create({
                    name: "AuxiliarFormato13.1",
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(jsonAxiliar),
                    encoding: file.Encoding.UTF8,
                    folder: FolderId,
                });

                var idfile = fileAux.save(); // Termina de grabar el archivo
                log.debug({
                    title: "URL ARCHIVO TEMP",
                    details: idfile,
                });
            }
            log.debug('trazaa 2', 'trazaa 2');
            stringXML = renderer.renderAsPdf();
            log.debug('trazaa 3', 'trazaa 3');
            saveFile(stringXML);
            log.debug('trazaa 4', 'trazaa 4');
            log.debug('Termino');
            return true;

        } else {
            log.debug('No data');
            libPe.noData(pGloblas.pRecordID);
        }
    }

    const getJsonData = (transactions) => {
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacion = {},
            cantidadUnidFisicas = 0,
            costoUnitBienIng = 0,
            costoTotalBienIng = 0,
            cantUnidFisicasBnRe = 0,
            costUnitBienRet = 0,
            costTotalBienRet = 0,
            cantUnidFisicasSalFinal = 0,
            costUnitSalFinal = 0,
            costTotalSalFinal = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;
        log.debug('transactions', transactions);
        let counter = 0;
        for (let k in transactions) {
            log.debug('transactions[k]', transactions[k]);
            let dato_cantidadUnidFisicas = parseFloat(transactions[k].columna06).toFixed(2);
            let dato_costoUnitBienIng = parseFloat(transactions[k].columna07).toFixed(2);
            let dato_costoTotalBienIng = parseFloat(transactions[k].columna08).toFixed(2);
            let dato_cantUnidFisicasBnRe = parseFloat(transactions[k].columna09).toFixed(2);
            let dato_costUnitBienRet = parseFloat(transactions[k].columna10).toFixed(2);
            let dato_costTotalBienRet = parseFloat(transactions[k].columna11).toFixed(2);
            let dato_cantUnidFisicasSalFinal = parseFloat(transactions[k].columna12).toFixed(2);
            let dato_costUnitSalFinal = parseFloat(transactions[k].columna13).toFixed(2);
            let dato_costTotalSalFinal = parseFloat(transactions[k].columna14).toFixed(2);

            let IDD = counter++;

            jsonTransacion[IDD] = {
                columna01: transactions[k].columna01,
                columna02: transactions[k].columna02,
                columna03: transactions[k].columna03,
                columna04: transactions[k].columna04,
                columna05: transactions[k].columna05,
                columna06: numberWithCommas(dato_cantidadUnidFisicas),
                columna07: numberWithCommas(dato_costoUnitBienIng),
                columna08: numberWithCommas(dato_costoTotalBienIng),
                columna09: numberWithCommas(dato_cantUnidFisicasBnRe),
                columna10: numberWithCommas(dato_costUnitBienRet),
                columna11: numberWithCommas(dato_costTotalBienRet),
                columna12: numberWithCommas(dato_cantUnidFisicasSalFinal),
                columna13: numberWithCommas(dato_costUnitSalFinal),
                columna14: numberWithCommas(dato_costTotalSalFinal),

            }

            cantidadUnidFisicas += Number(dato_cantidadUnidFisicas);
            costoUnitBienIng += Number(dato_costoUnitBienIng);
            costoTotalBienIng += Number(dato_costoTotalBienIng);
            cantUnidFisicasBnRe += Number(dato_cantUnidFisicasBnRe);
            costUnitBienRet += Number(dato_costUnitBienRet);
            costTotalBienRet += Number(dato_costTotalBienRet);
            cantUnidFisicasSalFinal += Number(dato_cantUnidFisicasSalFinal);
            costUnitSalFinal += Number(dato_costUnitSalFinal);
            costTotalSalFinal += Number(dato_costTotalSalFinal);

        }

        log.debug('jsonTransacion', jsonTransacion);

        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: pGloblas.pPeriod,
            columns: ['periodname', "startdate"]
        });
        let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
        year = periodSearch.startdate.split("/")[2];
        cantidadUnidFisicas = parseFloat(cantidadUnidFisicas).toFixed(2);
        costoUnitBienIng = parseFloat(costoUnitBienIng).toFixed(2);
        costoTotalBienIng = parseFloat(costoTotalBienIng).toFixed(2);
        cantUnidFisicasBnRe = parseFloat(cantUnidFisicasBnRe).toFixed(2);
        costUnitBienRet = parseFloat(costUnitBienRet).toFixed(2);
        costTotalBienRet = parseFloat(costTotalBienRet).toFixed(2);
        cantUnidFisicasSalFinal = parseFloat(cantUnidFisicasSalFinal).toFixed(2);
        costUnitSalFinal = parseFloat(costUnitSalFinal).toFixed(2);
        //add 2 decimals

        costTotalSalFinal = parseFloat(costTotalSalFinal).toFixed(2);

        var jsonAxiliar = {
            "company": {
                "firtsTitle": 'FORMATO 13.1: "REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO"',
                "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
            },
            "total": {
                "cantidadUnidFisicas": numberWithCommas(cantidadUnidFisicas),
                "costoUnitBienIng": numberWithCommas(costoUnitBienIng),
                "costoTotalBienIng": numberWithCommas(costoTotalBienIng),
                "cantUnidFisicasBnRe": numberWithCommas(cantUnidFisicasBnRe),
                "costUnitBienRet": numberWithCommas(costUnitBienRet),
                "costTotalBienRet": numberWithCommas(costTotalBienRet),
                "cantUnidFisicasSalFinal": numberWithCommas(cantUnidFisicasSalFinal),
                "costUnitSalFinal": numberWithCommas(costUnitSalFinal),
                "costTotalSalFinal": numberWithCommas(costTotalSalFinal)
            },
            "movements": jsonTransacion
        };
        return jsonAxiliar;
    }

    const getFileName = () => {
        //LE20139491077 AAAAMM00 130100001111
        return `LE${companyRuc}${year}${month}00130100001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
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

        // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
    }


    const getTemplate = () => {
        var aux = file.load("./Template/PE_Template13_1InvVal.ftl");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // PE - Libro Diario 12.1
        var savedSearch = search.load({ id: 'customsearch_pe_libro_impreso_13_1' });

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

        // savedSearch.columns.push(search.createColumn({
        //     name: 'formulatext',
        //     formula: "{tranid}",
        // }))

        // savedSearch.columns.push(search.createColumn({
        //     name: 'formulatext',
        //     formula: "NVL({account.displayname},'')",
        // }))

        // let searchResultCount = savedSearch.runPaged().count;
        // log.debug("vendorbillSearchObj result count", searchResultCount);
        var pagedData = savedSearch.runPaged({ pageSize: 1000 });
        var page, columns;
        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach((result) => {
                columns = result.columns;
                arrAux = new Array();

                log.debug('result', result);

                // 1. PERÍODO
                arrAux[0] = result.getValue(columns[0]);

                // 2. CUO
                arrAux[1] = result.getValue(columns[1]);

                // 3. CORRELATIVO
                arrAux[2] = result.getValue(columns[2]);

                // 4. CÓDIGO DEL CATÁLOGO UTILIZADO
                arrAux[3] = result.getValue(columns[3]);

                // 5. CÓDIGO DEL CATÁLOGO UTILIZADO 2
                arrAux[4] = result.getValue(columns[4]);

                // 6.  TIPO DE EXISTENCIA
                arrAux[5] = result.getValue(columns[5]);

                // 7. CÓDIGO PROPIO DE EXISTENCIA EN EL CAMPO 5
                arrAux[6] = result.getValue(columns[6]);

                // 8. CÓDIGO DEL CATÁLOGO UTILIZADO 3
                arrAux[7] = result.getValue(columns[7]);

                // 9. CÓDIGO PROPIO DE EXISTENCIA EN EL CAMPO 8
                arrAux[8] = result.getValue(columns[8]);

                // 10. FECHA DE EMISIÓN
                arrAux[9] = result.getValue(columns[9]);

                // 11. TIPO DE DOCUMENTO
                arrAux[10] = result.getValue(columns[10]);

                // 12. NÚMERO DE SERIE DEL DOCUMENTO
                arrAux[11] = result.getValue(columns[11]);

                // 13. NÚMERO DEL DOCUMENTO
                arrAux[12] = result.getValue(columns[12]);

                // 14. CÓDIGO DE OPERACIÓN
                arrAux[13] = result.getValue(columns[13]);

                arrResult.push(arrAux);
            });
        });
        log.debug('ResOriginal', arrResult);
        return arrResult;
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
        pGloblas = objContext.getParameter('custscript_pe_13_1_invval_params'); // || {};
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