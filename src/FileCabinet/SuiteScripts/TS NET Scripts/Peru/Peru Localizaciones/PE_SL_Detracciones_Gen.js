/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/redirect', 'N/task', 'N/log', 'N/file', 'N/encode', 'N/config', './PE_LIB_Libros.js'],
    //!Pasar los paramétros de los programados
    (ui, email, runtime, search, redirect, task, log, file, encode, config, libPE) => {

        let items_detraccion = ",19,1955,1946,"
        const onRequest = (context) => {
            //const file_cabinet_detrac_id = 415;

            const file_cabinet_detrac_id = libPE.callFolder();//646;//MISAKI
            try {
                if (context.request.method === 'GET') {

                    var featureSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
                    var companyruc;
                    var companyname;
                    var configpage = config.load({ type: config.Type.COMPANY_INFORMATION });

                    companyruc = configpage.getValue('employerid');
                    companyname = configpage.getValue('legalname');

                    var filterPostingPeriod = context.request.parameters.custscript_pe_period_stlt_det;
                    var filterSubsidiary = context.request.parameters.custscript_pe_subsidiary_stlt_det;
                    var filterPage = context.request.parameters.custscript_pe_page_stlt_det;
                    log.debug('Params', filterPostingPeriod + ' - ' + filterSubsidiary + ' - ' + filterPage)
                    var scriptObj = runtime.getCurrentScript();
                    log.debug('MSK', 'filterPage = ' + filterPage)
                    if (filterPage == '3' || filterPage == 3) {
                        var form = ui.createForm({ title: 'Archivos de Detracción Generados' });

                        var sublist_reports = form.addSublist({
                            id: 'customsearch_pe_generation_logs_sublist',
                            type: ui.SublistType.STATICLIST,
                            label: 'Log de generacion'
                        });
                        sublist_reports.addRefreshButton();
                        var internalId = sublist_reports.addField({
                            id: 'id',
                            label: 'ID',
                            type: ui.FieldType.TEXT
                        });
                        var user = sublist_reports.addField({
                            id: 'user',
                            label: ' Creado por',
                            type: ui.FieldType.TEXT
                        });
                        var datecreate = sublist_reports.addField({
                            id: 'datecreate',
                            label: 'Fecha de creacion',
                            type: ui.FieldType.TEXT
                        });
                        var subsidiary = sublist_reports.addField({
                            id: 'subsidiary',
                            label: 'Subsidiaria',
                            type: ui.FieldType.TEXT
                        });
                        var period = sublist_reports.addField({
                            id: 'period',
                            label: 'Periodo',
                            type: ui.FieldType.TEXT
                        });
                        var bookReport = sublist_reports.addField({
                            id: 'bookreport',
                            label: 'Libro Contable',
                            type: ui.FieldType.TEXT
                        });
                        var reportname = sublist_reports.addField({
                            id: 'reportname',
                            label: 'Reporte',
                            type: ui.FieldType.TEXT
                        });
                        var link = sublist_reports.addField({
                            id: 'link',
                            label: 'Descargar',
                            type: ui.FieldType.TEXT
                        });

                        log.debug('MSK', 'A punto de llamar a customsearch_pe_gene_logs_detraction2')
                        var mySearch = search.load({
                            id: 'customsearch_pe_gene_logs_detraction2' //! Saved Search: 2521 - PE Generation Logs Detraction
                        });
                        var resultSetPE = mySearch.run();
                        log.debug('MSK', 'Ya llamé a customsearch_pe_gene_logs_detraction2')

                        var j = 0;
                        resultSetPE.each(function (result) {
                            log.debug('recorriendo resultSetPE', resultSetPE)
                            var txtId = result.getValue(resultSetPE.columns[0]) || '--';
                            var txtUsuario = result.getText(resultSetPE.columns[1]) || '--';
                            var txtDate = result.getValue(resultSetPE.columns[2]) || '--';
                            var txtSubsidi = result.getText(resultSetPE.columns[3]) || '--';
                            var txtPeriod = result.getText(resultSetPE.columns[4]) || '--';
                            var txtReport = result.getValue(resultSetPE.columns[5]) || '--';
                            var txtStatus = result.getValue(resultSetPE.columns[6]) || '--';
                            var txtFileLog = result.getValue(resultSetPE.columns[7]) || '--';
                            var txtBookLog = result.getValue(resultSetPE.columns[8]) + ' ';
                            sublist_reports.setSublistValue({
                                id: 'id',
                                line: j,
                                value: txtId
                            });
                            sublist_reports.setSublistValue({
                                id: 'user',
                                line: j,
                                value: txtUsuario
                            });
                            sublist_reports.setSublistValue({
                                id: 'datecreate',
                                line: j,
                                value: txtDate
                            });

                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                sublist_reports.setSublistValue({
                                    id: 'subsidiary',
                                    line: j,
                                    value: txtSubsidi
                                });
                            }

                            sublist_reports.setSublistValue({
                                id: 'period',
                                line: j,
                                value: txtPeriod
                            });
                            sublist_reports.setSublistValue({
                                id: 'bookreport',
                                line: j,
                                value: txtBookLog
                            });
                            sublist_reports.setSublistValue({
                                id: 'reportname',
                                line: j,
                                value: txtReport
                            });
                            if (txtStatus != 'Generated') {
                                sublist_reports.setSublistValue({
                                    id: 'link',
                                    line: j,
                                    value: txtStatus //txtLink
                                });
                            } else {
                                sublist_reports.setSublistValue({
                                    id: 'link',
                                    line: j,
                                    value: "<a target='_blank' download href='" + txtFileLog + "'>Descargar</a>" //txtLink
                                    //value: "<a href='" + txtFileLog + "'>Descargar</a>" //txtLink
                                });
                            }
                            j++;
                            // log.debug('MSK','recorriendo resultSetPE-fin')
                            return true;
                        });
                    } else {
                        log.debug('MSK', 'filterPage no es 3')
                        var form = ui.createForm({ title: 'Generador Archivos de Detracción' });
                        form.clientScriptModulePath = './PE_CS_Detracciones_Gen.js';
                        //form.clientScriptFileId = 1201; //TODO PE_Client_Detracciones_Gen.js 
                        /*var field_subsidiary = form.addField({
                            id: 'custpage_subsidiary',
                            type: ui.FieldType.SELECT,
                            source: 'subsidiary',
                            label: 'Subsidiaria'
                        });*/

                        log.debug('featureSubsidiary', featureSubsidiary);
                        if (featureSubsidiary || featureSubsidiary == 'T') {
                            /*INICIO SUBS*/
                            var field_subsidiary = form.addField({
                                id: 'custpage_subsidiary',
                                type: ui.FieldType.SELECT,
                                label: 'Subsidiaria'
                            });

                            var myFilter = search.createFilter({
                                name: 'country',
                                operator: search.Operator.IS,
                                values: 'PE'
                            });
                            var mySearchSubs = search.create({
                                type: search.Type.SUBSIDIARY,
                                columns: ['internalId', 'name'],
                                filters: myFilter
                            });

                            mySearchSubs.run().each(function (result) {
                                var subId = result.getValue({ name: 'internalId' });
                                var subName = result.getValue({ name: 'name' });
                                field_subsidiary.addSelectOption({ value: subId, text: subName });
                                return true;
                            });
                            field_subsidiary.isMandatory = true;
                            /*FIN SUBS*/
                        }

                        log.debug('MSK', 'traza 1')
                        var field_acc_period = form.addField({
                            id: 'custpage_field_acc_period',
                            type: ui.FieldType.SELECT,
                            source: 'accountingperiod',
                            label: 'Periodo Contable'
                        });
                        var field_acc_bank = form.addField({
                            id: 'custpage_field_acc_bank',
                            type: ui.FieldType.SELECT,
                            label: 'Banco'
                        });

                        var field_page = form.addField({
                            id: 'custpage_field_page',
                            type: ui.FieldType.TEXT,
                            label: 'Pagina'
                        });


                        log.debug('MSK', 'traza 2')
                        field_page.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });

                        // var filed = form.addField({
                        //     id: 'custpage_suitelet_file1',
                        //     type: ui.FieldType.FILE,
                        //     label: 'File 1'
                        // });

                        log.debug('MSK', 'A punto de consumir customsearch_pe_accounts_banking')
                        var mySearch = search.load({ id: 'customsearch_pe_accounts_banking' }); //! Saved Search: 2522 - PE Accounts Bankings
                        if (filterPage == '2') {
                            var filters_bank = mySearch.filters;
                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                var filtersubsi = search.createFilter({ //create new filter
                                    name: 'subsidiary',
                                    operator: search.Operator.ANYOF,
                                    values: filterSubsidiary
                                });

                                filters_bank.push(filtersubsi); //add the filter using .push() method
                            }
                        }
                        var resultSetPE = mySearch.run(); //.getRange({start: pageId*10,end: pageId*10+10});
                        log.debug('MSK', 'Despues de consumir customsearch_pe_accounts_banking')

                        var j = 0;
                        var cont = 0;
                        resultSetPE.each(function (result) {
                            cont++;
                            var txtCampo01 = result.getValue(resultSetPE.columns[0]) || '--';;
                            var txtCampo02 = result.getValue(resultSetPE.columns[1]) || '--';;
                            var txtCampo03 = result.getValue(resultSetPE.columns[2]) || '--';;
                            var txtCampo04 = result.getValue(resultSetPE.columns[3]) || '--';;
                            var txtCampo05 = result.getValue(resultSetPE.columns[4]) || '--';;
                            field_acc_bank.addSelectOption({
                                value: txtCampo01,
                                text: txtCampo02
                            });
                            return true;
                        });
                        log.debug('MSK', 'resultSetPE2 - tiene ' + cont + ' filas')
                        field_acc_bank.updateDisplayType({
                            displayType: ui.FieldDisplayType.HIDDEN
                        });
                        field_acc_period.layoutType = ui.FieldLayoutType.NORMAL;
                        field_acc_period.isMandatory = true;

                        if (filterPage != '2') {
                            var btnSubmit = form.addSubmitButton({ label: 'Mostrar' });
                        }
                        if (filterPage == '2') {
                            var btnSubmit = form.addSubmitButton({
                                label: 'Pagar'
                            });
                            //var btnCancelar = form.addResetButton({
                            var btnCancelar = form.addButton({
                                id: 'btnCancelar',
                                label: 'Cancelar',
                                functionName: 'cancelarDetraccion'
                            });

                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                field_subsidiary.updateDisplayType({
                                    displayType: ui.FieldDisplayType.DISABLED
                                });
                            }

                            field_acc_period.updateDisplayType({
                                displayType: ui.FieldDisplayType.DISABLED
                            });
                            field_acc_bank.updateDisplayType({
                                displayType: ui.FieldDisplayType.NORMAL
                            });

                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                field_subsidiary.defaultValue = filterSubsidiary;
                            }

                            field_acc_period.defaultValue = filterPostingPeriod;
                            field_page.defaultValue = filterPage;

                            log.debug('MSK', 'a punto de consumir customsearch_pe_detracciones_x_pagar |filterPostingPeriod=' + filterPostingPeriod + ',filterSubsidiary=' + filterSubsidiary)
                            var searchLoad = search.load({
                                //  id: 'customsearch_pe_detracciones_x_pagar' //! Saved Search: 2524 - PE Detracciones x Pagar
                                id: 'customsearch_pe_detracciones_x_pagar_nc2' //! IMorales, incluye NC, orientado a items
                            });
                            var filters = searchLoad.filters; //reference Search.filters object to a new variable
                            var filterOne = search.createFilter({ //create new filter
                                name: 'postingperiod',
                                operator: search.Operator.ANYOF,
                                values: filterPostingPeriod
                            });

                            filters.push(filterOne); //add the filter using .push() method

                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                var filterTwo = search.createFilter({ //create new filter
                                    name: 'subsidiary',
                                    operator: search.Operator.ANYOF,
                                    values: filterSubsidiary
                                });

                                filters.push(filterTwo); //add the filter using .push() method
                            }

                            var resultSetPE = searchLoad.run(); //.getRange({start: pageId*10,end: pageId*10+10});
                            log.debug('MSK', 'ya consumí customsearch_pe_detracciones_x_pagar')


                            var sublist_reports = form.addSublist({
                                id: '_customsearch_detracciones_sublist',
                                type: ui.SublistType.STATICLIST,
                                label: 'Registros de detracciones por realizar'
                            });
                            sublist_reports.addRefreshButton();
                            var cabeceraColumnas = '';
                            var inicioExcel = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                            inicioExcel += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                            inicioExcel += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                            inicioExcel += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                            inicioExcel += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                            inicioExcel += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
                            /*xmlStr  =     '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                            xmlStr +=     '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                            xmlStr +=     'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                            xmlStr +=     'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                            xmlStr +=     'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                            xmlStr +=     'xmlns:html="http://www.w3.org/TR/REC-html40">';*/
                            inicioExcel += '<Worksheet ss:Name="Sheet1">';
                            inicioExcel += '<Table><Row>';
                            log.debug('MSK', 'resultSetPE.columns.length = ' + resultSetPE.columns.length)
                            for (var i = 0; i < resultSetPE.columns.length; i++) {
                                sublist_reports.addField({
                                    id: 'campo' + i,
                                    label: resultSetPE.columns[i].label,
                                    type: ui.FieldType.TEXT
                                });
                                if (i == 0) {
                                    cabeceraColumnas = resultSetPE.columns[i].label;
                                } else {
                                    cabeceraColumnas = cabeceraColumnas + ',' + resultSetPE.columns[i].label
                                }
                                var cabecera = resultSetPE.columns[i].label;
                                cabecera.replace('á', 'a');
                                cabecera.replace('é', 'e');
                                cabecera.replace('í', 'i');
                                cabecera.replace('ó', 'o');
                                cabecera.replace('ú', 'u');
                                inicioExcel += '<Cell><Data ss:Type="String">' + cabecera + '</Data></Cell>';
                            }
                            inicioExcel += '</Row>'
                            var j = 0;
                            var contenidoCSV = '';
                            var montoTotalSearch = 0;

                            var cont2 = 0;
                            resultSetPE.each(function (result) {
                                cont2++;
                                inicioExcel += '<Row>'
                                var contenidoLinea = '';

                                log.debug({
                                    title: 'Mapping1',
                                    details: result
                                })
                                for (var i = 0; i < resultSetPE.columns.length; i++) {
                                    log.debug('Map2', result.getValue(resultSetPE.columns[11]))
                                    if (result.getValue(resultSetPE.columns[11]) >= 1) {
                                        if (i == 2 || i == 3) {
                                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                                contenidoLinea = contenidoLinea + result.getValue(resultSetPE.columns[i]);
                                            } else {
                                                if (i == 2) {
                                                    contenidoLinea = contenidoLinea + companyruc;
                                                } else {
                                                    contenidoLinea = contenidoLinea + companyname;
                                                }
                                            }
                                        } else {
                                            if (result.getValue(resultSetPE.columns[i]) == '- None -') {
                                                contenidoLinea = contenidoLinea + '';
                                            } else {
                                                contenidoLinea = contenidoLinea + result.getValue(resultSetPE.columns[i]);
                                            }
                                        }
                                        if (i == 11) {
                                            var valorMontoLinea = result.getValue(resultSetPE.columns[i]);
                                            montoTotalSearch = parseFloat(montoTotalSearch) + parseFloat(valorMontoLinea);
                                            montoTotalSearch = montoTotalSearch.toFixed(2);
                                        }
                                        if (i == resultSetPE.columns.length - 1) {
                                            contenidoLinea = contenidoLinea + '\n';
                                        } else {
                                            contenidoLinea = contenidoLinea + ',';
                                        }
                                        if (i == 11 || i == 19) {
                                            inicioExcel += '<Cell><Data ss:Type="Number">' + result.getValue(resultSetPE.columns[i]) + '</Data></Cell>';
                                        } else {
                                            if (i == 2) {
                                                inicioExcel += '<Cell><Data ss:Type="String">' + companyruc + '</Data></Cell>';
                                            } else if (i == 3) {
                                                inicioExcel += '<Cell><Data ss:Type="String">' + companyname + '</Data></Cell>';
                                            } else {
                                                inicioExcel += '<Cell><Data ss:Type="String">' + result.getValue(resultSetPE.columns[i]) + '</Data></Cell>';
                                            }
                                        }
                                        if (i == 2 || i == 3) {
                                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                                sublist_reports.setSublistValue({
                                                    id: 'campo' + i,
                                                    line: j,
                                                    value: result.getValue(resultSetPE.columns[i])
                                                });
                                            } else {
                                                if (i == 2) {
                                                    sublist_reports.setSublistValue({
                                                        id: 'campo' + i,
                                                        line: j,
                                                        value: companyruc
                                                    });
                                                }
                                                else {
                                                    sublist_reports.setSublistValue({
                                                        id: 'campo' + i,
                                                        line: j,
                                                        value: companyname
                                                    });
                                                }
                                            }
                                        } else {
                                            // log.debug('MSK','campo:' + i+'|line:'+j+' = '+result.getValue(resultSetPE.columns[i]))
                                            var resul = result.getValue(resultSetPE.columns[i]);
                                            if (resul == '- None -') {
                                                resul = '';
                                            }
                                            sublist_reports.setSublistValue({ id: 'campo' + i, line: j, value: resul || '-' });
                                        }
                                    }
                                }
                                inicioExcel += '</Row>'
                                contenidoCSV = contenidoCSV + contenidoLinea;
                                j++;
                                return true;
                            });

                            log.debug('MSK', 'customsearch_pe_detracciones_x_pagar ha devuelto ' + cont2 + ' filas')
                            inicioExcel += '</Table></Worksheet></Workbook>'

                            var fileFinal = file.create({
                                name: 'ReporteDetracciones.csv',
                                fileType: file.Type.CSV,
                                contents: cabeceraColumnas + '\n' + contenidoCSV,
                                encoding: file.Encoding.UTF8,
                                folder: file_cabinet_detrac_id,
                                isOnline: true
                            });
                            var fileId = fileFinal.save();
                            var fileAux = file.load({
                                id: fileId
                            });
                            log.debug({
                                title: 'myObj',
                                details: 'URL DESCARGA DE ARCHIVO FINAL ' + fileAux.url
                            });
                            var baseEncode = encode.convert({
                                string: inicioExcel,
                                inputEncoding: encode.Encoding.UTF_8,
                                outputEncoding: encode.Encoding.BASE_64
                            });
                            var fileFinal2 = file.create({
                                name: 'ReporteDetracciones.xls',
                                fileType: file.Type.EXCEL,
                                contents: baseEncode,
                                folder: file_cabinet_detrac_id
                            });
                            var fileId2 = fileFinal2.save();
                            var fileAux2 = file.load({ id: fileId2 });
                            log.debug({ title: 'myObj', details: 'URL DESCARGA DE ARCHIVO FINAL ' + fileAux2.url });

                            var fieldtotal = form.addField({ id: 'custpagetotal', type: ui.FieldType.TEXT, label: 'totalDetraccion' });
                            fieldtotal.defaultValue = montoTotalSearch;
                            fieldtotal.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });
                            var fielddescargar = form.addField({ id: 'custpagefielddescargar', type: ui.FieldType.INLINEHTML, label: 'Descargar resumen' });
                            fielddescargar.defaultValue = "<br><br><a target='_blank' href='" + fileAux.url + "'>Descargar archivo CSV</a><br><br><a target='_blank' href='" + fileAux2.url + "'>Descargar archivo EXCEL</a>";
                        }
                    }
                    context.response.writePage(form);
                } else {
                    // var file_cabinet_detrac_id = 422;
                    log.debug('File cabinet ID 2', file_cabinet_detrac_id)

                    var filterPagePOST = context.request.parameters.custpage_field_page;
                    log.debug('SUBSIDIARY', context.request.parameters.custpage_subsidiary);
                    if (filterPagePOST == '2' || filterPagePOST == 2) {
                        log.debug('MSK', 'Primera busqueda')//MISAKI
                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            //scriptId: 212,
                            scriptId: 'customscript_pe_ss_detracc_bnacion',
                            deploymentId: 'customdeploy_pe_ss_detracc_bnacion',
                            params: {
                                //  custscript_pe_subsidiary_bnacion_sunat: context.request.parameters.custpage_subsidiary,
                                //  custscript_pe_period_bnacion_sunat: context.request.parameters.custpage_field_acc_period,
                                //  custscript_pe_filecabinet_bn_id: file_cabinet_detrac_id
                                custscript_pe_ss_detracc_bnacion_sub: context.request.parameters.custpage_subsidiary,
                                custscript_pe_ss_detracc_bnacion_per: context.request.parameters.custpage_field_acc_period,
                                custscript_pe_ss_detracc_bnacion_file: file_cabinet_detrac_id
                            }
                        });
                        scriptTask.submit();
                        log.debug('MSK', 'Segunda busqueda')//MISAKI
                        /*var scriptTask2 = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            //scriptId: 210,
                            scriptId: 'customscript_pe_schedule_detracc_sunat',
                            deploymentId: 'customdeploy_pe_schedule_detracc_sunat',
                            params: {
                                custscript_pe_subsidiary_detracc_sunat: context.request.parameters.custpage_subsidiary,
                                custscript_pe_period_detracc_sunat: context.request.parameters.custpage_field_acc_period
                            }
                        });
                        
                        var scriptTaskId2 = scriptTask2.submit();*/
                        log.debug('MSK', 'Tercera busqueda')//MISAKI
                        var scriptTask3 = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            //scriptId: 214,
                            scriptId: 'customscript_pe_ss_detracc_journal',
                            deploymentId: 'customdeploy_pe_ss_detracc_journal',
                            params: {
                                //  custscript_pe_subsidiary_journal: context.request.parameters.custpage_subsidiary,
                                //  custscript_pe_period_bnacion_journal: context.request.parameters.custpage_field_acc_period,
                                //  custscript_pe_account_bank_journal: context.request.parameters.custpage_field_acc_bank,
                                //  custscript_pe_filecabinet_detracc_id: file_cabinet_detrac_id
                                custscript_pe_ss_detracc_journal_sub: context.request.parameters.custpage_subsidiary,
                                custscript_pe_ss_detracc_journal_per: context.request.parameters.custpage_field_acc_period,
                                custscript_pe_ss_detracc_journal_acc: context.request.parameters.custpage_field_acc_bank,
                                custscript_pe_ss_detracc_journal_fol: file_cabinet_detrac_id
                            }
                        });
                        scriptTask3.submit();


                        log.debug('MSK', 'Redirect')//MISAKI
                        redirect.toSuitelet({
                            /*scriptId: 209 ,
                            deploymentId: 1,*/
                            scriptId: 'customscript_pe_sl_detracciones_gen',//MISAKI
                            deploymentId: 'customdeploy_pe_sl_detracciones_gen',
                            parameters: {
                                custscript_pe_period_stlt_det: context.request.parameters.custpage_field_acc_period,
                                custscript_pe_subsidiary_stlt_det: context.request.parameters.custpage_subsidiary,
                                custscript_pe_page_stlt_det: '3'
                            }
                        });
                    }

                    log.debug('filterPagePOST (opcion 2)', 'filterPagePOST = ' + filterPagePOST + ' (opcion 2)')//MISAKI
                    if (filterPagePOST == '1' || filterPagePOST == '' || filterPagePOST == null) {
                        redirect.toSuitelet({
                            /*scriptId: 209 ,
                            deploymentId: 1,*/
                            scriptId: 'customscript_pe_sl_detracciones_gen',//MISAKI
                            deploymentId: 'customdeploy_pe_sl_detracciones_gen',
                            parameters: {
                                custscript_pe_period_stlt_det: context.request.parameters.custpage_field_acc_period,
                                custscript_pe_subsidiary_stlt_det: context.request.parameters.custpage_subsidiary,
                                custscript_pe_page_stlt_det: '2'
                            }
                        });
                    }
                }
            } catch (error) {
                log.debug('Error', error);
            }

        }
        return {
            onRequest: onRequest
        };
    });


// var transactionSearchObj = search.create({
//     type: "transaction",
//     filters:
//     [
//        [[[["type","anyof","VendBill"],"AND",["memorized","is","F"],
//        "AND",
//        ["posting","is","T"],
//        "AND",
//        ["voided","is","F"],
//        "AND",
//        ["mainline","is","F"],
//        "AND",
//        ["taxline","is","F"],
//        "AND",
//        ["formulatext: CASE WHEN {custbody_pe_detraccion_number} = '' THEN '1' WHEN {custbody_pe_detraccion_number} IS NULL THEN '1'  ELSE '0' END","is","1"],
//        "AND",
//        [["item","anyof","65"],"OR",["account","anyof","2636"]],
//        "AND",
//        ["custbody_pe_status_detraccion","isnot","Procesado"]]],
//        "OR",[[["type","anyof","VendCred"],"AND",["memorized","is","F"],"AND",["posting","is","T"],"AND",["voided","is","F"],"AND",["mainline","is","F"],"AND",["taxline","is","F"],"AND",["formulatext: CASE WHEN {custbody_pe_detraccion_number} = '' THEN '1' WHEN {custbody_pe_detraccion_number} IS NULL THEN '1'  ELSE '0' END","is","1"],"AND",[["item","anyof","65"],"OR",["account","anyof","2636"]],"AND",["custbody_pe_status_detraccion","isnot","Procesado"]]]]
//     ]