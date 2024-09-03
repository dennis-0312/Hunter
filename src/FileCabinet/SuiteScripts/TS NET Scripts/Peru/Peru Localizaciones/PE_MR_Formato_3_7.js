/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.7           29 Sep 2023     Gian Crisolo <gian.crisolo@myevol.biz>             - Creación del reporte 3.7
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
    var hasInfo = '';

    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;

    const getInputData = () => {

        try {
            getParameters();
            var transactions = getTransactions();
            log.error('transactions',transactions)
            return transactions;
        } catch (e) {
            log.error('error getInputData',e)
        }

    }

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);
            var resultTransactions = {
                codigoCatalogo: dataMap[1],
                tipoExistencia: dataMap[2],
                descripcion: dataMap[6],
                codigoUnidad: dataMap[7],
                cantidad: dataMap[9],
                costoUnitario: dataMap[10],
                costoTotal: dataMap[11]
            };


            context.write({
                key: key,
                value: resultTransactions
            });


        } catch (e) {
            log.error('error map',e)
        }
    }

    const getFileName = () => {
        return `LE${companyRuc}${pGloblas.pAnio}1231030700071${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    }

    const getPeriodId = () => {
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
        try {

            getParameters();
            // generateLog();
            getSubdiary();
            var periodId = getPeriodId(pGloblas.pAnio);

            pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, periodId, "Inventario y Balance 3.7")

            var transactionJSON = {};

            transactionJSON["parametros"] = pGloblas;

            transactionJSON["transactions"] = [];
            hasInfo = 0;
            context.output.iterator().each(function (key, value) {
                hasInfo = 1;
                value = JSON.parse(value);

                transactionJSON["transactions"].push(value);
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

                /**** 
                stringXML2 = renderer.renderAsString();

                var FolderId = libPe.callFolder();

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
                }

                /*** */
                stringXML = renderer.renderAsPdf();
                saveFile(stringXML);


                /**** */

                return true;

            } else {
              log.error('ERROR', 'No data');
              libPe.noData(pGloblas.pRecordID);
            }

        } catch (error) {
            log.error("error", error);
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
        var arrayGeneral = new Array();
        var arraySecundario = new Array();
        var VAnVIENE = new Array();
        let totalMonto = 0;
        var cantidadLinea = 0;
        var montoviene = 0;
        var cantidadFor = 0;
        var cantidadAnterio = 0;
        for (var i = 0; i < transactions.length; i++) {
            var resultado1 = divisionRedondeoArriba(transactions[i].descripcion.length, 65);
            cantidadLinea = cantidadLinea + resultado1 + 1;
            if (cantidadLinea <= 25) {
                montoviene = Number(montoviene) + Number(transactions[i].costoTotal);
                arraySecundario.push(
                    transactions[i]
                );
            } else {

                arrayGeneral.push(arraySecundario)
                VAnVIENE.push(numberWithCommas(montoviene.toFixed(2)));

                arraySecundario = [];
                cantidadLinea = 0;
                cantidadLinea = cantidadLinea + resultado1 + 1;
                montoviene = Number(montoviene) + Number(transactions[i].costoTotal);
            }
            totalMonto = totalMonto + transactions[i].costoTotal;

        }
        totalMonto =  roundTwoDecimal(totalMonto) == 0 ? '0.00' : roundTwoDecimal(totalMonto)
        var AgregarelVAN = '';
       
        for (var i = 0; i < arrayGeneral.length; i++) {
            AgregarelVAN += '<table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >';
            AgregarelVAN += '<thead>';
            AgregarelVAN += ' <tr>';
            AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">CÓDIGO DE EXISTENCIA</td>';
            AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">TIPO DE EXISTENCIA</td>';
            AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">DESCRIPCIÓN</td>';
            AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">UNIDAD DE MEDIDA</td>';
            AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">CANTIDAD</td>';
            AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">COSTO UNITARIO</td>';
            AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">COSTO TOTAL</td>';
            AgregarelVAN += '</tr>';
            AgregarelVAN += '</thead>';
            AgregarelVAN += '<tbody>';
            if (i != 0) {
                AgregarelVAN += '<tr>';
                AgregarelVAN += '<td align = "center"></td>';
                AgregarelVAN += '<td align = "center"></td>';
                AgregarelVAN += '<td align = "left"></td>';
                AgregarelVAN += '<td align = "left"></td>';
                AgregarelVAN += '<td align = "center">VIENE</td>';
                AgregarelVAN += '<td align = "right"></td>';
                AgregarelVAN += '<td align = "right">' + VAnVIENE[i - 1] + '</td>';
                AgregarelVAN += '</tr>';
            }
            for (var k = 0; k < arrayGeneral[i].length; k++) {
                AgregarelVAN += '<tr>';
                AgregarelVAN += '<td align = "center">' + arrayGeneral[i][k].codigoCatalogo + '</td>';
                AgregarelVAN += '<td align = "center">' + arrayGeneral[i][k].tipoExistencia + '</td>';
                AgregarelVAN += '<td align = "left"><p style="width:300px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;"> ' + arrayGeneral[i][k].descripcion + '</p></td>';
              AgregarelVAN += '<td align = "left">' + arrayGeneral[i][k].codigoUnidad + '</td>';
              let cantidad1 = arrayGeneral[i][k].cantidad;
              cantidad1 = parseFloat(cantidad1).toFixed(2);
              cantidad1 = numberWithCommas(cantidad1);
              AgregarelVAN += '<td align = "center">' + cantidad1 + '</td>';
              let costoUnitario1 = arrayGeneral[i][k].costoUnitario;
              costoUnitario1 = parseFloat(costoUnitario1).toFixed(2);
              costoUnitario1 = numberWithCommas(costoUnitario1);
              AgregarelVAN += '<td align = "right">' + costoUnitario1 + '</td>';
              let costoTotal1 = arrayGeneral[i][k].costoTotal;
              costoTotal1 = parseFloat(costoTotal1).toFixed(2);
              costoTotal1 = numberWithCommas(costoTotal1);
                AgregarelVAN += '<td align = "right">' + costoTotal1 + '</td>';
                AgregarelVAN += '</tr>';
            }
            AgregarelVAN += '<tr>';
            AgregarelVAN += '<td align = "center"></td>';
            AgregarelVAN += '<td align = "center"></td>';
            AgregarelVAN += '<td align = "left"></td>';
            AgregarelVAN += '<td align = "left"></td>';
            AgregarelVAN += '<td align = "center">VAN</td>';
            AgregarelVAN += '<td align = "right"></td>';
            AgregarelVAN += '<td align = "right">' + VAnVIENE[i] + '</td>';
            AgregarelVAN += '</tr>';
            AgregarelVAN += '</tbody>';
            AgregarelVAN += '</table>';
            AgregarelVAN += '<div style="page-break-before: always;"></div>';

        }
        AgregarelVAN += '<table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >';
        AgregarelVAN += '<thead>';
        AgregarelVAN += ' <tr>';
        AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">CÓDIGO DE EXISTENCIA</td>';
        AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">TIPO DE EXISTENCIA</td>';
        AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">DESCRIPCIÓN</td>';
        AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">UNIDAD DE MEDIDA</td>';
        AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">CANTIDAD</td>';
        AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">COSTO UNITARIO</td>';
        AgregarelVAN += '<td align = "center" style= "border: 1px solid black; vertical-align: middle; font-weight:bold; text-align: center;">COSTO TOTAL</td>';
        AgregarelVAN += '</tr>';
        AgregarelVAN += '</thead>';
        AgregarelVAN += '<tbody>';

        if (i != 0){
            AgregarelVAN += '<tr>';
            AgregarelVAN += '<td align = "center"></td>';
            AgregarelVAN += '<td align = "center"></td>';
            AgregarelVAN += '<td align = "left"></td>';
            AgregarelVAN += '<td align = "left"></td>';
            AgregarelVAN += '<td align = "center">VIENE</td>';
            AgregarelVAN += '<td align = "right"></td>';
            AgregarelVAN += '<td align = "right">' + VAnVIENE[VAnVIENE.length - 1] + '</td>';
            AgregarelVAN += '</tr>';
        }

        for (var k = 0; k < arraySecundario.length; k++) {
            AgregarelVAN += '<tr>';
            AgregarelVAN += '<td align = "center">' + arraySecundario[k].codigoCatalogo + '</td>';
            AgregarelVAN += '<td align = "center">' + arraySecundario[k].tipoExistencia + '</td>';
            AgregarelVAN += '<td align = "left"><p style="width:300px;margin-top: 0;margin-bottom: 0;hyphens: auto;word-wrap: break-word;word-break: break-all;"> ' + arraySecundario[k].descripcion + '</p></td>';
          AgregarelVAN += '<td align = "left">' + arraySecundario[k].codigoUnidad + '</td>';
          let cantidad = numberWithCommas(parseFloat(arraySecundario[k].cantidad).toFixed(2));
          AgregarelVAN += '<td align = "center">' + cantidad+ '</td>';
           let costoUnitario = numberWithCommas(parseFloat(arraySecundario[k].costoUnitario).toFixed(2));
          AgregarelVAN += '<td align = "right">' + costoUnitario + '</td>';
           let costoTotal = numberWithCommas(parseFloat(arraySecundario[k].costoTotal).toFixed(2));
            AgregarelVAN += '<td align = "right">' + costoTotal + '</td>';
            AgregarelVAN += '</tr>';
        }
        AgregarelVAN += '<tr>';
        AgregarelVAN += '<td  align="center" style="border-top:1px solid black"></td>';
        AgregarelVAN += '<td align="center" style="border-top:1px solid black"></td>';
        AgregarelVAN += '<td  align="center" style="border-top:1px solid black"></td>';
        AgregarelVAN += '<td  align="center" style="border-top:1px solid black"></td>';
        AgregarelVAN += '<td  align="center" style="border-top:1px solid black"></td>';
        AgregarelVAN += ' <td  align="center" style="border:1px solid black; font-weight:bold;font-size: 11px;">SALDO TOTAL</td>';
        AgregarelVAN += '<td  align="right" style="border:1px solid black; font-weight:bold;font-size: 11px;">' + totalMonto  + '</td>';
        AgregarelVAN += '</tr>';

        AgregarelVAN += '</tbody>';
        AgregarelVAN += '</table>';





        let jsonAxiliar = {
            "company": {
                "firtTitle": companyName.replace(/&/g, '&amp;'),
                "secondTitle": 'Expresado en Moneda Nacional',
                "thirdTitle": 'FORMATO 3.7 - ' + pGloblas.Anio,
            },
            "cabecera": {
                "Anio": pGloblas.pAnio,
                "ruc": companyRuc,
                "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase(),
                "metodo": "1 Promedio Ponderado"
            },
            "total": {
                "totalMonto": roundTwoDecimal(totalMonto)
            },
            "movements": transactions,
            "AgregarelVAN": AgregarelVAN

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
    const roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
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

        urlfile += auxFile.url;
        log.debug('EXECUTION COMPLETE', auxFile)
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
    }

    const getTemplate = () => {

        var aux = file.load("./Template/PE_Template_Formato_3_7.ftl");

        return aux.getContents();
    }

    const getTransactions = () => {

        var arrResult = [];
        var _cont = 0;

        // FORMATO 3.7: "DETALLE DEL SALDO DE LA CUENTA 20 - MERCADERIAS Y LA CUENTA 21 - PRODUCTOS TERMINADOS
        var savedSearch = search.load({
            //id: 'customsearch_pe_libro_impreso_3_7'
            id: 'customsearch_pe_detalle_30_3_7'
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

        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach(function (result) {
                columns = result.columns;
                arrAux = new Array();
                // 1 Período
                arrAux[0] = result.getValue(columns[0]);

                // 2 Código de Catalogo
                arrAux[1] = result.getValue(columns[1]);
                let auxcolumn02 = arrAux[1].replace(/\s/g, '');
                if (auxcolumn02 == '-None-'|| auxcolumn02.indexOf('ERROR:') >= 0) {
                  arrAux[1] = ''
                }
                // 3 Tipo de Existencia
                arrAux[2] = result.getValue(columns[2]);
                let auxcolumn03 = arrAux[2].replace(/\s/g, '');
                if (auxcolumn03 == '-None-'|| auxcolumn03.indexOf('ERROR:') >= 0) {
                  arrAux[2] = ''
                }

                // 4 Código Propio de la Existencia
                arrAux[3] = result.getValue(columns[3]);

                // 5 Código del catálogo utilizado
                arrAux[4] = result.getValue(columns[4]);

                // 6 Código de Existencia correspondiente al catálogo señalado en el campo 5.
                arrAux[5] = result.getValue(columns[5]);

                // 7 Descripción de la existencia
                arrAux[6] = result.getValue(columns[6]).replace('- None -', '');

                // 8 Código de la Unidad de medida de la existencia
                arrAux[7] = result.getValue(columns[7]).replace('- None -', '');

                // 9 Código del método de valuación utilizado
                arrAux[8] = result.getValue(columns[8]);

                // 10 Cantidad de la existencia
                arrAux[9] = result.getValue(columns[9]);

                // 11 Costo unitario de la existencia
                arrAux[10] = Number(result.getValue(columns[10]));

                // 12 Costo total
                arrAux[11] = Number(result.getValue(columns[11]));

                // 13 Indica el estado de la operación
                arrAux[12] = result.getValue(columns[12]);

                // 14 Cuenta Contable
                arrAux[13] = result.getValue(columns[13]);

                // 15 Año
                arrAux[14] = result.getValue(columns[14]);

                if(Number(arrAux[14]) <= Number(pGloblas.pAnio)){
                    arrResult.push(arrAux);
                    log.error('arrAux',arrAux);
                }

            });
        });

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
        pGloblas = objContext.getParameter('custscript_pe_formato_3_7_params');

        pGloblas = JSON.parse(pGloblas);

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pAnio: pGloblas.anioCon
        }

      //   pGloblas = {
      //     pRecordID: 0,
      //     pFeature: 113,
      //     pSubsidiary: 3,
      //     periodCon: 114,
      //     pAnio:"2023"
      // }
      log.debug("pGloblas", pGloblas);
        featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
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
        summarize: summarize
    };

});