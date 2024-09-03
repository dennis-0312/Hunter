/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format",'N/render', './PE_LIB_Libros.js'], (search, record, runtime, log, file, task, config, format, render, libPe) => {
    // Schedule Report: PE - Libro Caja y Bancos - Detalle de los Movimientos del Efectivo
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    /** PARAMETROS */
    var pGloblas = {};

    const execute = (context) => {
        try {
            var featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

            var pGloblas = getParameters();
            var subsidi = getSubdiary(featSubsidiary,pGloblas);
            var companyName = subsidi[0];
            var companyRuc = subsidi[1];
            var periodo = getPeriod(pGloblas);
            var month = periodo[0];
            var year = periodo[1];
            var hasInfo = 0;

            var transaccion = getTransactions(featSubsidiary,pGloblas);
            pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Libro Mayor 6.1")
            if(transaccion.length > 0){
                hasInfo = 1;
                var jsonAxiliar = getJsonData(transaccion,pGloblas,companyRuc,companyName);
                
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

                let nameReport = getFileName(companyRuc, year, month, hasInfo, pGloblas);
                saveFile(stringXML,nameReport,pGloblas);
                log.debug('Termino');
                return true;

            } else {
                log.debug('ERROR','No data');
                libPe.noData(pGloblas.pRecordID);
            }
        } catch (e) {
            log.error({ title: 'ErrorInExecute', details: e });
        }
    }


    const getTransactions = (featSubsidiary,pGloblas) => {
        var arrResult = [];
        var _cont = 0;

        // PE - Libro Diario 6.1
        var savedSearch = search.load({ id: 'customsearch_pe_libro_mayor_6_1' });

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

        let searchResultCount = savedSearch.runPaged().count;
        var pagedData = savedSearch.runPaged({ pageSize: 1000 });
        var page, columns;
        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach((result) => {
                columns = result.columns;
                arrAux = new Array();
                let arreglo = new Array();

                // 1. PERÍODO
                arrAux[0] = result.getValue(columns[0]);

                // 2. CUO
                arrAux[1] = result.getValue(columns[1]);

                // 3. NÚMERO CORRELATIVO DEL ASIENTO
                arrAux[2] = result.getValue(columns[2]);

                // 4. CÓDIGO DE LA CUENTA CONTABLE
                arrAux[3] = result.getValue(columns[3]);

                // 5. CÓDIGO DE UNIDAD DE OPERACIÓN
                arrAux[4] = result.getValue(columns[4]);

                // 6. CENTRO DE COSTO
                arrAux[5] = result.getValue(columns[5]);

                // 7. TIPO DE MONEDA DE ORIGEN
                arrAux[6] = result.getValue(columns[6]);

                // 8. TIPO DE DOCUMENTO DE IDENTIDAD DEL EMISOR
                arrAux[7] = result.getValue(columns[7]);

                // 9. NÚMERO DE DOCUMENTO DE IDENTIDAD DEL EMISOR
                arrAux[8] = result.getValue(columns[8]);

                // 10.TIPO DE COMPROBANTE
                arrAux[9] = result.getValue(columns[9]);

                // 11. NÚMERO DE SERIE DEL COMPROBANTE DE PAGO
                arrAux[10] = result.getValue(columns[10]);

                // 12. NÚMERO DE COMPRONBANTE DE PAGO
                arrAux[11] = result.getValue(columns[11]);

                // 13. FECHA CONTABLE
                arrAux[12] = result.getValue(columns[12]);

                // 14. FECHA DE VENCIMIENTO
                arrAux[13] = result.getValue(columns[13]);

                // 15. FECHA DE LA OPERACIÓN O EMISIÓN
                arrAux[14] = result.getValue(columns[14]);

                // 16. GLOSA O DESCRIPCIÓN DE LA NATURALEZA DE LA OPERACIÓN REGISTRADA DE SER EL CASO
                arrAux[15] = result.getValue(columns[15]);

                // 17. GLOSA REFERENCIAL
                arrAux[16] = result.getValue(columns[16]);

                // 18. MOVIMIENTOS DEL DEBE
                arrAux[17] = result.getValue(columns[17]);

                // 19. MOVIMIENTO DEL HABER
                arrAux[18] = result.getValue(columns[18]);

                // 20.  COD LIBRO
                arrAux[19] = result.getValue(columns[19]);

                // 20.1 CAMPO 1 ==== 21
                arrAux[20] = result.getValue(columns[20]);

                // 20.2 CAMPO 2
                arrAux[21] = result.getValue(columns[21]);

                // 20.3 CAMPO 3
                arrAux[22] = result.getValue(columns[22]);

                if (arrAux[20] != '' && arrAux[21] != '' && arrAux[22] != '') {
                    arreglo.push(arrAux[20], arrAux[21], arrAux[22]);
                    for (let i = 0; i < arreglo.length; i++) {
                        if ((i + 1) != arreglo.length) {
                            arrAux[20] += arreglo[i] + '&amp;';
                        } else {
                            arrAux[20] += arreglo[i]
                        }
                    }
                } else {
                    arrAux[20] = '';
                }

                // 22 INDICA EL ESTADO DE LA OPERACIÓN
                arrAux[23] = result.getValue(columns[23]);
                //log.error('arrAux',arrAux)
                arrResult.push(arrAux);
            });
        });

        //arrResult = ordenarCuenta(arrResult);
        //log.error('arrResult',arrResult)

        return arrResult;
    }

    const getPeriod = (pGloblas) => {
        try {
            var periodRecord = search.lookupFields({
                type: "accountingperiod",
                id: pGloblas.pPeriod,
                columns: ["startdate"]
            });
            var firstDate = format.parse({
                value: periodRecord.startdate,
                type: format.Type.DATE
            });
            let month = firstDate.getMonth() + 1;
            month = month < 10 ? `0${month}` : month;
            let year = firstDate.getFullYear();
    
            return [month,year]
        } catch (error) {
            log.error('error getPeriod',error)
        }
        
    }

    const getParameters = () => {
        try {
            var objContext = runtime.getCurrentScript();
            let pGloblas = objContext.getParameter('custscript_pe_6_1_params_pdf'); // || {};
            pGloblas = JSON.parse(pGloblas);

            pGloblas = {
                pRecordID: pGloblas.recordID,
                pFeature: pGloblas.reportID,
                pSubsidiary: pGloblas.subsidiary,
                pPeriod: pGloblas.periodCon,
            }
            return pGloblas;
        } catch (error) {
            
            log.error('error getParameters',error)
        }
        
    }

    const getSubdiary = (featSubsidiary,pGloblas) => {
        try {
            let companyName = '';
            let companyRuc = '';
            if (featSubsidiary) {
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
            return [companyName,companyRuc];
        } catch (error) {
            log.error('error getSubdiary',error)
        }
    }

    const getFileName = (companyRuc, year, month, hasInfo, pGloblas) => {
        return `LE${companyRuc}${year}${month}00060100001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    }

    const getTemplate = () => {
        var aux = file.load("./Template/PE_Template6_1LibMay.ftl");
        return aux.getContents();
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

    const getJsonData = (transactions,pGloblas,companyRuc,companyName) => {
        var cantidadtotal = 0;
        var primeraCuenta = '';
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacion = {},
            movDebe = 0,
            movHaber = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });

        for(let i = 0; i < transactions.length ; i++){
            let dato_movDebe = parseFloat(transactions[i][17]);
            let dato_movHaber = parseFloat(transactions[i][18]);
            if(i == 0){
                primeraCuenta = transactions[i][3]
            }
            jsonTransacion[i] = {
                periodoContable: transactions[i][0],
                cuo: transactions[i][1],
                numAsiento: transactions[i][2],
                codCuenta: transactions[i][3],
                codOp: transactions[i][4],
                ceco: transactions[i][5],
                tipoMoneda: transactions[i][6],
                tipoDocIdentidad: transactions[i][7],
                numDocIdentidad: transactions[i][8],
                tipoComprob: transactions[i][9],
                serieComprob: transactions[i][10],
                comprobPago: transactions[i][11],
                fecha: transactions[i][12],
                dueDate: transactions[i][13],
                fechaOp: transactions[i][14],
                glosaDesc: transactions[i][15],
                glosaRef: transactions[i][16],
                movDebe: Number(transactions[i][17]).toFixed(2),
                movHaber: Number(transactions[i][18]).toFixed(2),
                codLibro: transactions[i][19],
                codLibro2: transactions[i][20],
                estadoOp: transactions[i][23]
            }
            movDebe += dato_movDebe;
            movHaber += dato_movHaber;
        }

        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: pGloblas.pPeriod,
            columns: ['periodname', "startdate"]
        });
        let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
        let year = periodSearch.startdate.split("/")[2];
        movDebe = parseFloat(movDebe)
        movHaber = parseFloat(movHaber)

        
        var jsonAxiliar = {
            "company": {
                "firtsTitle": 'FORMATO 6.1: INVT. PERMANENTE',
                "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
                "cantidadtotal": cantidadtotal,
            },
            "total": {
                "movDebe": movDebe,
                "movHaber": movHaber,
            },
            "movements": jsonTransacion,
            "cuentaUno": primeraCuenta
        };
        return jsonAxiliar;
    }

    const saveFile = (stringValue,nameReport,pGloblas) => {
        var fileAuxliar = stringValue;
        var urlfile = '';
        var folderID = libPe.callFolder();
        fileAuxliar.name = nameReport;
        fileAuxliar.folder = folderID;

        var fileID = fileAuxliar.save();

        let auxFile = file.load({ id: fileID });
        urlfile += auxFile.url;
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)

    }

    return {
        execute: execute
    }
});