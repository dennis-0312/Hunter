/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                                    Remarks
 * 9.2           01 Oct 2023     Dennis Fernández <dennis.fernandez@myevol.biz>          - Creación del reporte 9.2
 *
 */

define(['N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', './PE_LIB_Libros.js', 'N/format'], (runtime, search, config, render, record, file, libPe, format) => {

        let objContext = runtime.getCurrentScript();
        /** PARAMETROS */
        let pGloblas = {};
        /** REPORTE */
        let formatReport = 'pdf';
        let nameReport = '';
        let transactionFile = null;
        /** DATOS DE LA SUBSIDIARIA */
        let companyName = '';
        let companyRuc = '';
        let companyLogo = '';
        let companyDV = '';
        let featureSTXT = null;
        let featMultibook = null;
        let featSubsidiary = null;

        var hasInfo=0;
        var month = "";
        var year = "";

        const months = [
            "enero",
            "febrero",
            "marzo",
            "abril",
            "mayo",
            "junio",
            "julio",
            "agosto",
            "septiembre",
            "octubre",
            "noviembre",
            "diciembre"
        ];
        const months_nros = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

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
                    periodoContable: (dataMap[0] == "- None -" ? "" : dataMap[0]),
                    fechaRecepcion: (dataMap[1] == "- None -" ? "" : dataMap[1]),
                    fecha: (dataMap[2] == "- None -" ? "" : dataMap[2]),
                    tipoExistencia: dataMap[3],
                    serieGuia: (dataMap[4] == "- None -" ? "" : dataMap[4]),
                    nroGuia: (dataMap[5] == "- None -" ? "" : dataMap[5]),
                    serieComprobante: (dataMap[6] == "- None -" ? "" : dataMap[6]),
                    nroComprobante: (dataMap[7] == "- None -" ? "" : dataMap[7]),
                    ruc: (dataMap[8] == "- None -" ? "" : dataMap[8]),
                    razonSocial: (dataMap[9] == "- None -" ? "" : dataMap[9]),
                    sumEntregada: (dataMap[10] == "" ? 0 : dataMap[10]),
                    sumDevuelta: (dataMap[11] == "" ? 0 : dataMap[11]),
                    sumVendida: (dataMap[12] == "" ? 0 : dataMap[12]),
                    sumSaldo: (dataMap[13] == "" ? 0 : dataMap[13]),
                    idInterno: (dataMap[14] == "" ? 0 : dataMap[14])
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
            pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Consignatorio 9.2")
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
            let jsonAxiliar = getJsonData(transactionJSON["transactions"]);
            log.debug('jsonAxiliar', jsonAxiliar);
            if ((transactionJSON["transactions"]).lengt != 0) {
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
                sumEntregada = 0,
                sumDevuelta = 0,
                sumVendida = 0,
                sumSaldo = 0;

            // let employeeName = search.lookupFields({
            //     type: search.Type.EMPLOYEE,
            //     id: useID,
            //     columns: ['firstname', 'lastname']
            // });
            // let userName = employeeName.firstname + ' ' + employeeName.lastname;

            log.debug('transactions', transactions);
            for (let k in transactions) {
                let dato_sumEntregada = parseFloat(transactions[k].sumEntregada);
                let dato_sumDevuelta = parseFloat(transactions[k].sumDevuelta);
                let dato_sumVendida = parseFloat(transactions[k].sumVendida);
                let dato_sumSaldo = parseFloat(transactions[k].sumSaldo);
                let IDD = transactions[k].idInterno;
                jsonTransacion[IDD] = {
                    periodoContable: transactions[k].periodoContable,
                    fechaRecepcion: transactions[k].fechaRecepcion,
                    fecha: transactions[k].fecha,
                    tipoExistencia: transactions[k].tipoExistencia,
                    serieGuia: transactions[k].serieGuia,
                    nroGuia: transactions[k].nroGuia,
                    serieComprobante: transactions[k].serieComprobante,
                    nroComprobante: transactions[k].nroComprobante,
                    ruc: transactions[k].ruc,
                    razonSocial: transactions[k].razonSocial,
                    sumEntregada: numberWithCommas(roundTwoDecimals(transactions[k].sumEntregada).toFixed(2)),
                    sumDevuelta: numberWithCommas(roundTwoDecimals(transactions[k].sumDevuelta).toFixed(2)),
                    sumVendida: numberWithCommas(roundTwoDecimals(transactions[k].sumVendida).toFixed(2)),
                    sumSaldo: numberWithCommas(roundTwoDecimals(transactions[k].sumSaldo).toFixed(2)),
                    idInterno: transactions[k].idInterno
                }
                sumEntregada += dato_sumEntregada;
                sumDevuelta += dato_sumDevuelta;
                sumVendida += dato_sumVendida;
                sumSaldo += dato_sumSaldo;

                hasInfo=1;
            }

            log.debug('jsonTransacion', jsonTransacion);
            let periodSearch = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: pGloblas.pPeriod,
                columns: ['periodname', "startdate"]
            });
            let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
            month = months_nros[Number(periodSearch.startdate.split("/")[1]) - 1];
            year = periodSearch.startdate.split("/")[2];
            sumEntregada = parseFloat(sumEntregada.toFixed(2))
            sumDevuelta = parseFloat(sumDevuelta.toFixed(2))
            sumVendida = parseFloat(sumVendida.toFixed(2))
            sumSaldo = parseFloat(sumSaldo.toFixed(2))

            let jsonAxiliar = {
                "company": {
                    "firtsTitle": 'FORMATO 9.2: CONSG. CONSIGNATARIO',
                    "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                    "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                    "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
                },
                "total": {
                    "sumEntregada": numberWithCommas(roundTwoDecimals(sumEntregada).toFixed(2)),
                    "sumDevuelta": numberWithCommas(roundTwoDecimals(sumDevuelta).toFixed(2)),
                    "sumVendida": numberWithCommas(roundTwoDecimals(sumVendida).toFixed(2)),
                    "sumSaldo": numberWithCommas(roundTwoDecimals(sumSaldo).toFixed(2))
                },
                "movements": jsonTransacion
            };
            log.debug('jsonAxiliar 1', jsonAxiliar);
            return jsonAxiliar;
        }

        const getFileName = () => {
            return `LE${companyRuc}${year}${month}00090200001${hasInfo}11_${pGloblas.pRecordID}.pdf`;
    
         }

        const saveFile = (stringValue) => {
            let fileAuxliar = stringValue;
            let urlfile = '';
            // if (featSubsidiary) {
            //     nameReport = 'Formato 9.2_' + companyName + '.' + formatReport;
            // } else {
            //     nameReport = 'Formato 9.2_' + '.' + formatReport;
            // }
            nameReport = getFileName();
            fileAuxliar.name = nameReport;
            fileAuxliar.folder = libPe.callFolder();
            let fileID = fileAuxliar.save();
            let auxFile = file.load({ id: fileID });
            urlfile += auxFile.url;
            log.debug('pGloblas.pRecordID', pGloblas.pRecordID)
            libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
        }

        const getTemplate = () => {
            var aux = file.load("./Template/PE_Template9_2ConsigConsignatario.ftl");
            return aux.getContents();
        }

        const getTransactions = () => {
            var arrResult = [];
            var _cont = 0;
            // PE - Libro Diario 9.2
            var savedSearch = search.load({ id: 'customsearch_pe_libro_impreso_9_2' });

            if (featSubsidiary) {
                savedSearch.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.IS,
                    values: pGloblas.pSubsidiary
                }));
            }

            // savedSearch.filters.push(search.createFilter({
            //     name: 'postingperiod',
            //     operator: search.Operator.IS,
            //     values: [pGloblas.pPeriod]
            // }));

            // savedSearch.columns.push(search.createColumn({
            //     name: 'formulatext',
            //     formula: "{tranid}",
            // }))

            // savedSearch.columns.push(search.createColumn({
            //     name: 'formulatext',
            //     formula: "NVL({account.displayname},'')",
            // }))

            savedSearch.filters.push(search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.IS,
                values: [pGloblas.pPeriod]
            }));

            let searchResultCount = savedSearch.runPaged().count;
            log.debug("vendorbillSearchObj result count", searchResultCount);
            let pagedData = savedSearch.runPaged({ pageSize: 1000 });
            let page, columns;
            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    columns = result.columns;
                    arrAux = new Array();

                    // 1. PERÍODO
                    arrAux[0] = result.getValue(columns[0]);

                    // 2. FECHA RECEPCION
                    arrAux[1] = result.getValue(columns[1]);

                    // 3. FECHA
                    arrAux[2] = result.getValue(columns[2]);

                    // 4. TIPO DE EXISTENCIA
                    arrAux[3] = result.getValue(columns[3]);

                    // 5. SERIE DE GUÍA DE REMISIÓN
                    arrAux[4] = result.getValue(columns[4]);

                    // 6. NÚMERO DE GUÍA DE REMISIÓN
                    arrAux[5] = result.getValue(columns[5]);

                    // 7. SERIE DE COMPROBANTE DE PAGO
                    arrAux[6] = result.getValue(columns[6]);

                    // 8. NÚMERO DE COMPROBANTE DE PAGO
                    arrAux[7] = result.getValue(columns[7]);

                    // 9.RUC
                    arrAux[8] = result.getValue(columns[8]);

                    // 10. RAZÓN SOCIAL
                    arrAux[9] = result.getValue(columns[9]);

                    // 11. SUM OF CANTIDAD ENTREGADA
                    arrAux[10] = result.getValue(columns[10]);

                    // 12. SUM OF CANTIDAD DEVUELTA
                    arrAux[11] = result.getValue(columns[11]);

                    // 13. SUM OF CANTIDAD VENDIDA
                    arrAux[12] = result.getValue(columns[12]);

                    // 14. SUM OF SALDO DE LOS BIENES EN CONSIGNACIÓN
                    arrAux[13] = result.getValue(columns[13]);

                    // 15. ID INTERNO
                    arrAux[14] = result.getValue(columns[14]);

                    arrResult.push(arrAux);
                });
            });
            log.debug('ResOriginal', arrResult);
            //!DATA PRUEBA - Inicio
            // for(var i=0;i<10;i++){
            //     arrAux = new Array();
            //     arrAux[0] = 'set-2023'
            //     arrAux[1] = '30/09/2023'
            //     arrAux[2] = '30/09/2023'
            //     arrAux[3] = '01'
            //     arrAux[4] = 'GR001'
            //     arrAux[5] = '12345'+i
            //     arrAux[6] = 'F123'
            //     arrAux[7] = '444'
            //     arrAux[8] = '2058678888'
            //     arrAux[9] = 'Empresa ejemplo'
            //     arrAux[10] = '123.45'
            //     arrAux[11] = '123.45'
            //     arrAux[12] = '123.45'
            //     arrAux[13] = '123.45'
            //     arrAux[14] = '1'+i
            //     arrResult.push(arrAux);
            // }
            //!DATA PRUEBA - Fin
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
            pGloblas = objContext.getParameter('custscript_pe_9_2_consignatario_params'); // || {};
            pGloblas = JSON.parse(pGloblas);
            pGloblas = {
                pRecordID: pGloblas.recordID,
                pFeature: pGloblas.reportID,
                pSubsidiary: pGloblas.subsidiary,
                pPeriod: pGloblas.periodCon,
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
