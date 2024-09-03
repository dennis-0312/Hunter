/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"],
    function (search, record, email, runtime, log, file, task, config, format) {
        function execute(context) {
            try {
                /*if (context.type >== context.InvocationType.ON_DEMAND){
    return;
   }*/
                var featureSubsidiary = runtime.isFeatureInEffect({
                    feature: "SUBSIDIARIES"
                });

                var configpage = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });

                var folderSearch = search.load({
                    id: 'customsearch_pe_search_folder'
                });
                var folderResult = folderSearch.run().getRange(0, 1);
                if (folderResult.length != 0) {
                    var columns = folderResult[0].columns;
                    var folderID = folderResult[0].getValue(columns[0]);
                }

                var fileCabinetId = folderID;

                var searchId = 'customsearch_pe_registro_de_compra_8_1';
                var searchId2 = 'customsearch_pe_reg_compras_8_1_er';
                var scriptObj = runtime.getCurrentScript();
                // log.debug({ title: 'scriptObj', details: scriptObj });
                var filterPostingPeriod = scriptObj.getParameter({
                    name: 'custscript_pe_ss_ple_8_1_per'
                }); //112;
                var filterSubsidiary = scriptObj.getParameter({
                    name: 'custscript_pe_ss_ple_8_1_sub'
                }); //2;
                var filterPage = scriptObj.getParameter({
                    name: 'custscript_pe_ss_ple_8_1_page'
                }); //2;

                filterPage = parseInt(filterPage, 10);
                var filterArchivosGen = scriptObj.getParameter({
                    name: 'custscript_pe_ss_ple_8_1_file'
                });
                var filterFormat = scriptObj.getParameter({
                    name: 'custscript_pe_ss_ple_8_1_for'
                });
                // var fileIdLog = scriptObj.getParameter({
                //     name: 'custscript_pe_id_log_1'
                // });
                var incluirFlag = scriptObj.getParameter({
                    name: 'custscript_pe_ss_ple_8_1_inc'
                });

                // log.debug({ title: 'Response1', details: filterPostingPeriod });
                // log.debug({ title: 'Response2', details: filterSubsidiary });
                // log.debug({ title: 'Response3', details: filterPage });
                // log.debug({ title: 'Response4', details: filterArchivosGen });
                // log.debug({ title: 'Response5', details: filterFormat });
                // log.debug({ title: 'Response6', details: incluirFlag });

                var recordIdAux = null;

                // if (fileIdLog == null || fileIdLog == '') {

                var customRecordAux = record.create({
                    type: 'customrecord_pe_generation_logs',
                    isDynamic: true
                });
                if (featureSubsidiary || featureSubsidiary == 'T') {
                    var nameDataAux = {
                        custrecord_pe_subsidiary_log: filterSubsidiary,
                        custrecord_pe_period_log: filterPostingPeriod,
                        custrecord_pe_report_log: "Procesando...",
                        custrecord_pe_status_log: "Procesando...",
                        custrecord_pe_file_cabinet_log: "",
                        custrecord_pe_book_log: "Registro de Compras 8.1"
                    };
                } else {
                    var nameDataAux = {
                        custrecord_pe_period_log: filterPostingPeriod,
                        custrecord_pe_report_log: "Procesando...",
                        custrecord_pe_status_log: "Procesando...",
                        custrecord_pe_file_cabinet_log: "",
                        custrecord_pe_book_log: "Registro de Compras 8.1"
                    };
                }
                for (var key in nameDataAux) {
                    if (nameDataAux.hasOwnProperty(key)) {
                        customRecordAux.setValue({
                            fieldId: key,
                            value: nameDataAux[key]
                        });
                    }
                }
                recordIdAux = customRecordAux.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                // }
                // else {
                //     recordIdAux = fileIdLog;
                // }

                var tipoFormato = file.Type.PLAINTEXT;
                var terminacionFile = '.txt'
                var cambiaCSV = false;
                if (filterFormat == 'CSV') {
                    tipoFormato = file.Type.CSV;
                    terminacionFile = '.csv';
                    cambiaCSV = true;
                }

                var corteRegistros = 25;
                if (featureSubsidiary || featureSubsidiary == 'T') {
                    var subLookup = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: filterSubsidiary,
                        columns: ['taxidnum']
                    });

                    var fedIdNumb = subLookup.taxidnum;
                } else {
                    var fedIdNumb = configpage.getValue('employerid');
                }
                var perLookup = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: filterPostingPeriod,
                    columns: ['periodname', 'startdate']
                });
                var dateini = perLookup.startdate;


                var periodoFinDate = format.parse({
                    type: format.Type.DATE,
                    value: perLookup.startdate
                });


                perLookup = CompletarCero(2, periodoFinDate.getMonth() + 1)
                log.error('perLookup', perLookup)
                // var fileCabinetId = scriptObj.getParameter({
                //     name: 'custscript_pe_filecabinet_id'
                // }); //223
                try {
                    log.debug({ title: 'myObj', details: 'INICIANDO SCHEDULED COMPRAS' + fedIdNumb });
                    //var cuentaRegistro = 0 ;
                    var searchLoad = search.load({
                        id: searchId
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
                    var searchResultCount = searchLoad.runPaged().count;
                    log.debug({ title: 'searchResultCount', details: searchResultCount });
                    var stringContentReport = '';
                    var periodString = '';
                    var folderReportGenerated = fileCabinetId;
                    //searchLoad.columns[0]
                    //var searchResult = mySearch.run().getRange({start: 0,end: 100});
                    var result = searchLoad.run().getRange({
                        start: filterPage * 1000,
                        end: filterPage * 1000 + 1000
                    }); //.each(function(result) {
                    log.debug({ title: 'result', details: result });
                    var i = 0;
                    for (i; i < result.length; i++) {
                        var campoRegistro01 = result[i].getValue(searchLoad.columns[0]);
                        var campoRegistro02 = result[i].getValue(searchLoad.columns[1]);
                        var campoRegistro03 = result[i].getValue(searchLoad.columns[2]);
                        var campoRegistro04 = result[i].getValue(searchLoad.columns[3]);
                        var campoRegistro05 = result[i].getValue(searchLoad.columns[4]);
                        var campoRegistro06 = result[i].getValue(searchLoad.columns[5]);
                        var campoRegistro07 = result[i].getValue(searchLoad.columns[6]);
                        var campoRegistro08 = result[i].getValue(searchLoad.columns[7]);
                        if (campoRegistro08 == '- None -') {
                            campoRegistro08 = '';
                        }
                        var campoRegistro09 = result[i].getValue(searchLoad.columns[8]);
                        var campoRegistro10 = result[i].getValue(searchLoad.columns[9]);
                        var campoRegistro11 = result[i].getValue(searchLoad.columns[10]);
                        var campoRegistro12 = result[i].getValue(searchLoad.columns[11]);
                        var campoRegistro13 = result[i].getValue(searchLoad.columns[12]);
                        var campoRegistro14 = result[i].getValue(searchLoad.columns[13]);
                        if (campoRegistro14 == '.00') {
                            campoRegistro14 = '0.00'
                        }
                        var campoRegistro15 = result[i].getValue(searchLoad.columns[14]);
                        if (campoRegistro15 == '.00') {
                            campoRegistro15 = '0.00'
                        }
                        var campoRegistro16 = result[i].getValue(searchLoad.columns[15]);
                        if (campoRegistro16 == '.00') {
                            campoRegistro16 = '0.00'
                        }
                        var campoRegistro17 = result[i].getValue(searchLoad.columns[16]);
                        if (campoRegistro17 == '.00') {
                            campoRegistro17 = '0.00'
                        }
                        var campoRegistro18 = result[i].getValue(searchLoad.columns[17]);
                        if (campoRegistro18 == '.00') {
                            campoRegistro18 = '0.00'
                        }
                        var campoRegistro19 = result[i].getValue(searchLoad.columns[18]);
                        if (campoRegistro19 == '.00') {
                            campoRegistro19 = '0.00'
                        }
                        var campoRegistro20 = result[i].getValue(searchLoad.columns[19]);
                        if (campoRegistro20 == '.00') {
                            campoRegistro20 = '0.00'
                        }
                        var campoRegistro21 = result[i].getValue(searchLoad.columns[20]);
                        if (campoRegistro21 == '.00') {
                            campoRegistro21 = '0.00'
                        }
                        var campoRegistro22 = result[i].getValue(searchLoad.columns[21]);
                        if (campoRegistro22 == '.00') {
                            campoRegistro22 = '0.00'
                        }
                        var campoRegistro23 = result[i].getValue(searchLoad.columns[22]);
                        if (campoRegistro23 == '.00') {
                            campoRegistro23 = '0.00'
                        }
                        var campoRegistro24 = result[i].getValue(searchLoad.columns[23]);
                        if (campoRegistro24 == '.00') {
                            campoRegistro24 = '0.00'
                        }
                        var campoRegistro25 = result[i].getValue(searchLoad.columns[24]);
                        var campoRegistro26 = result[i].getValue(searchLoad.columns[25]);
                        if (campoRegistro26 == '1.00') {
                            campoRegistro26 = '1.000'
                        }

                        var campoRegistro27 = result[i].getValue(searchLoad.columns[26]);
                        if (campoRegistro27 == '- None -') {
                            campoRegistro27 = '';
                        }
                        var campoRegistro28 = result[i].getValue(searchLoad.columns[27]);
                        if (campoRegistro28 == '- None -') {
                            campoRegistro28 = '';
                        }
                        var campoRegistro29 = result[i].getValue(searchLoad.columns[28]);
                        if (campoRegistro29 == '- None -') {
                            campoRegistro29 = '';
                        }
                        var campoRegistro30 = result[i].getValue(searchLoad.columns[29]);
                        if (campoRegistro30 == '- None -') {
                            campoRegistro30 = '';
                        }
                        var campoRegistro31 = result[i].getValue(searchLoad.columns[30]);
                        if (campoRegistro31 == '- None -') {
                            campoRegistro31 = '';
                        }
                        var campoRegistro32 = result[i].getValue(searchLoad.columns[31]);
                        if (campoRegistro32 == '- None -') {
                            campoRegistro32 = '';
                        }
                        var campoRegistro33 = result[i].getValue(searchLoad.columns[32]);
                        if (campoRegistro33 == '- None -') {
                            campoRegistro33 = '';
                        }
                        var campoRegistro34 = result[i].getValue(searchLoad.columns[33]);
                        if (campoRegistro34 == '- None -') {
                            campoRegistro34 = '';
                        }
                        var campoRegistro35 = result[i].getValue(searchLoad.columns[34]);
                        if (campoRegistro35 == '- None -') {
                            campoRegistro35 = '';
                        }
                        var campoRegistro36 = result[i].getValue(searchLoad.columns[35]);
                        if (campoRegistro36 == '- None -') {
                            campoRegistro36 = '';
                        }
                        var campoRegistro37 = result[i].getValue(searchLoad.columns[36]);
                        if (campoRegistro37 == '- None -') {
                            campoRegistro37 = '';
                        }
                        var campoRegistro38 = result[i].getValue(searchLoad.columns[37]);
                        var campoRegistro39 = result[i].getValue(searchLoad.columns[38]);
                        var campoRegistro40 = result[i].getValue(searchLoad.columns[39]);
                        var campoRegistro41 = result[i].getValue(searchLoad.columns[40]);
                        var campoRegistro42 = result[i].getValue(searchLoad.columns[41]);
                        var periodoEmision = formatDate(campoRegistro04)['anio'] + formatDate(campoRegistro04)['mes'] + '00';
                        if (campoRegistro06 == '01' && (campoRegistro01 == periodoEmision)) {
                            campoRegistro42 = '1';
                        } else if (campoRegistro06 != '01' && (campoRegistro01 == periodoEmision)) {
                            campoRegistro42 = '0';
                        } else if (campoRegistro06 == '01' && (campoRegistro01 != periodoEmision)) {
                            campoRegistro42 = '6';
                        } else if (campoRegistro06 != '01' && (campoRegistro01 != periodoEmision)) {
                            campoRegistro42 = '7';
                        }
                        var campoRegistro43 = result[i].getValue(searchLoad.columns[42]);
                        var campoRegistro44 = result[i].getValue(searchLoad.columns[43]);
                        var campoRegistro45 = result[i].getValue(searchLoad.columns[44]);

                        stringContentReport =
                            stringContentReport + campoRegistro01 + '|' + campoRegistro02 + '|' + campoRegistro03 + '|' +
                            campoRegistro04 + '|' + campoRegistro05 + '|' + campoRegistro06 + '|' + campoRegistro07 + '|' +
                            campoRegistro08 + '|' + campoRegistro09 + '|' + campoRegistro10 + '|' + campoRegistro11 + '|' +
                            campoRegistro12 + '|' + campoRegistro13 + '|' + campoRegistro14 + '|' + campoRegistro15 + '|' +
                            campoRegistro16 + '|' + campoRegistro17 + '|' + campoRegistro18 + '|' + campoRegistro19 + '|' +
                            campoRegistro20 + '|' + campoRegistro21 + '|' + campoRegistro22 + '|' + campoRegistro23 + '|' +
                            campoRegistro24 + '|' + campoRegistro25 + '|' + campoRegistro26 + '|' + campoRegistro27 + '|' +
                            campoRegistro28 + '|' + campoRegistro29 + '|' + campoRegistro30 + '|' + campoRegistro31 + '|' +
                            campoRegistro32 + '|' + campoRegistro33 + '|' + campoRegistro34 + '|' + campoRegistro35 + '|' +
                            campoRegistro36 + '|' + campoRegistro37 + '|' + campoRegistro38 + '|' + campoRegistro39 + '|' +
                            campoRegistro40 + '|' + campoRegistro41 + '|' + campoRegistro42 + '|' + campoRegistro43 + '|' +
                            campoRegistro44 + '|' + campoRegistro45 + '|\n'
                    };
                    var searchLoad2 = search.load({
                        id: searchId2
                    });
                    var filters2 = searchLoad2.filters; //reference Search.filters object to a new variable
                    var filterOne = search.createFilter({ //create new filter
                        name: 'postingperiod',
                        operator: search.Operator.ANYOF,
                        values: filterPostingPeriod
                    });
                    filters2.push(filterOne); //add the filter using .push() method
                    if (featureSubsidiary || featureSubsidiary == 'T') {
                        var filterTwo = search.createFilter({ //create new filter
                            name: 'subsidiary',
                            operator: search.Operator.ANYOF,
                            values: filterSubsidiary
                        });
                        filters2.push(filterTwo); //add the filter using .push() method
                    }
                    var searchResultCount = searchLoad2.runPaged().count;
                    log.debug({ title: 'searchResultCount', details: searchResultCount });
                    var result2 = searchLoad2.run().getRange({
                        start: filterPage * 1000,
                        end: filterPage * 1000 + 1000
                    });
                    var i = 0;
                    for (i; i < result2.length; i++) {
                        var campoRegistro01 = result2[i].getValue(searchLoad2.columns[0]);
                        var campoRegistro02 = result2[i].getValue(searchLoad2.columns[1]);
                        var campoRegistro03 = result2[i].getValue(searchLoad2.columns[2]);
                        var campoRegistro04 = result2[i].getValue(searchLoad2.columns[3]);
                        var campoRegistro05 = result2[i].getValue(searchLoad2.columns[4]);
                        var campoRegistro06 = result2[i].getValue(searchLoad2.columns[5]);
                        var campoRegistro07 = result2[i].getValue(searchLoad2.columns[6]);
                        var campoRegistro08 = result2[i].getValue(searchLoad2.columns[7]);
                        if (campoRegistro08 == '- None -') {
                            campoRegistro08 = '';
                        }
                        var campoRegistro09 = result2[i].getValue(searchLoad2.columns[8]);
                        var campoRegistro10 = result2[i].getValue(searchLoad2.columns[9]);
                        var campoRegistro11 = result2[i].getValue(searchLoad2.columns[10]);
                        var campoRegistro12 = result2[i].getValue(searchLoad2.columns[11]);
                        var campoRegistro13 = result2[i].getValue(searchLoad2.columns[12]);
                        var campoRegistro14 = result2[i].getValue(searchLoad2.columns[13]);
                        if (campoRegistro14 == '.00') {
                            campoRegistro14 = '0.00'
                        }
                        var campoRegistro15 = result2[i].getValue(searchLoad2.columns[14]);
                        if (campoRegistro15 == '.00') {
                            campoRegistro15 = '0.00'
                        }
                        var campoRegistro16 = result2[i].getValue(searchLoad2.columns[15]);
                        if (campoRegistro16 == '.00') {
                            campoRegistro16 = '0.00'
                        }
                        var campoRegistro17 = result2[i].getValue(searchLoad2.columns[16]);
                        if (campoRegistro17 == '.00') {
                            campoRegistro17 = '0.00'
                        }
                        var campoRegistro18 = result2[i].getValue(searchLoad2.columns[17]);
                        if (campoRegistro18 == '.00') {
                            campoRegistro18 = '0.00'
                        }
                        var campoRegistro19 = result2[i].getValue(searchLoad2.columns[18]);
                        if (campoRegistro19 == '.00') {
                            campoRegistro19 = '0.00'
                        }
                        var campoRegistro20 = result2[i].getValue(searchLoad2.columns[19]);
                        if (campoRegistro20 == '.00') {
                            campoRegistro20 = '0.00'
                        }
                        var campoRegistro21 = result2[i].getValue(searchLoad2.columns[20]);
                        if (campoRegistro21 == '.00') {
                            campoRegistro21 = '0.00'
                        }
                        var campoRegistro22 = result2[i].getValue(searchLoad2.columns[21]);
                        if (campoRegistro22 == '.00') {
                            campoRegistro22 = '0.00'
                        }
                        var campoRegistro23 = result2[i].getValue(searchLoad2.columns[22]);
                        if (campoRegistro23 == '.00') {
                            campoRegistro23 = '0.00'
                        }
                        var campoRegistro24 = result2[i].getValue(searchLoad2.columns[23]);
                        if (campoRegistro24 == '.00') {
                            campoRegistro24 = '0.00'
                        }
                        var campoRegistro25 = result2[i].getValue(searchLoad2.columns[24]);
                        var campoRegistro26 = result2[i].getValue(searchLoad2.columns[25]);
                        if (campoRegistro26 == '1.00') {
                            campoRegistro26 = '1.000'
                        }
                        var campoRegistro27 = result2[i].getValue(searchLoad2.columns[26]);
                        if (campoRegistro27 == '- None -') {
                            campoRegistro27 = '';
                        }
                        var campoRegistro28 = result2[i].getValue(searchLoad2.columns[27]);
                        if (campoRegistro28 == '- None -') {
                            campoRegistro28 = '';
                        }
                        var campoRegistro29 = result2[i].getValue(searchLoad2.columns[28]);
                        if (campoRegistro29 == '- None -') {
                            campoRegistro29 = '';
                        }
                        var campoRegistro30 = result2[i].getValue(searchLoad2.columns[29]);
                        if (campoRegistro30 == '- None -') {
                            campoRegistro30 = '';
                        }
                        var campoRegistro31 = result2[i].getValue(searchLoad2.columns[30]);
                        if (campoRegistro31 == '- None -') {
                            campoRegistro31 = '';
                        }
                        var campoRegistro32 = result2[i].getValue(searchLoad2.columns[31]);
                        if (campoRegistro32 == '- None -') {
                            campoRegistro32 = '';
                        }
                        var campoRegistro33 = result2[i].getValue(searchLoad2.columns[32]);
                        if (campoRegistro33 == '- None -') {
                            campoRegistro33 = '';
                        }
                        var campoRegistro34 = result2[i].getValue(searchLoad2.columns[33]);
                        if (campoRegistro34 == '- None -') {
                            campoRegistro34 = '';
                        }
                        var campoRegistro35 = result2[i].getValue(searchLoad2.columns[34]);
                        if (campoRegistro35 == '- None -') {
                            campoRegistro35 = '';
                        }
                        var campoRegistro36 = result2[i].getValue(searchLoad2.columns[35]);
                        if (campoRegistro36 == '- None -') {
                            campoRegistro36 = '';
                        }
                        var campoRegistro37 = result2[i].getValue(searchLoad2.columns[36]);
                        if (campoRegistro37 == '- None -') {
                            campoRegistro37 = '';
                        }
                        var campoRegistro38 = result2[i].getValue(searchLoad2.columns[37]);
                        var campoRegistro39 = result2[i].getValue(searchLoad2.columns[38]);
                        var campoRegistro40 = result2[i].getValue(searchLoad2.columns[39]);
                        var campoRegistro41 = result2[i].getValue(searchLoad2.columns[40]);
                        var campoRegistro42 = result2[i].getValue(searchLoad2.columns[41]);
                        var periodoEmision = formatDate(campoRegistro04)['anio'] + formatDate(campoRegistro04)['mes'] + '00';
                        if (campoRegistro06 == '01' && (campoRegistro01 == periodoEmision)) {
                            campoRegistro42 = '1';
                        } else if (campoRegistro06 != '01' && (campoRegistro01 == periodoEmision)) {
                            campoRegistro42 = '0';
                        } else if (campoRegistro06 == '01' && (campoRegistro01 != periodoEmision)) {
                            campoRegistro42 = '6';
                        } else if (campoRegistro06 != '01' && (campoRegistro01 != periodoEmision)) {
                            campoRegistro42 = '7';
                        }
                        var campoRegistro43 = result2[i].getValue(searchLoad2.columns[42]);
                        var campoRegistro44 = result2[i].getValue(searchLoad2.columns[43]);
                        var campoRegistro45 = result2[i].getValue(searchLoad2.columns[44]);
                        stringContentReport =
                            stringContentReport + campoRegistro01 + '|' + campoRegistro02 + '|' + campoRegistro03 + '|' +
                            campoRegistro04 + '|' + campoRegistro05 + '|' + campoRegistro06 + '|' + campoRegistro07 + '|' +
                            campoRegistro08 + '|' + campoRegistro09 + '|' + campoRegistro10 + '|' + campoRegistro11 + '|' +
                            campoRegistro12 + '|' + campoRegistro13 + '|' + campoRegistro14 + '|' + campoRegistro15 + '|' +
                            campoRegistro16 + '|' + campoRegistro17 + '|' + campoRegistro18 + '|' + campoRegistro19 + '|' +
                            campoRegistro20 + '|' + campoRegistro21 + '|' + campoRegistro22 + '|' + campoRegistro23 + '|' +
                            campoRegistro24 + '|' + campoRegistro25 + '|' + campoRegistro26 + '|' + campoRegistro27 + '|' +
                            campoRegistro28 + '|' + campoRegistro29 + '|' + campoRegistro30 + '|' + campoRegistro31 + '|' +
                            campoRegistro32 + '|' + campoRegistro33 + '|' + campoRegistro34 + '|' + campoRegistro35 + '|' +
                            campoRegistro36 + '|' + campoRegistro37 + '|' + campoRegistro38 + '|' + campoRegistro39 + '|' +
                            campoRegistro40 + '|' + campoRegistro41 + '|' + campoRegistro42 + '|' + campoRegistro43 + '|' +
                            campoRegistro44 + '|' + campoRegistro45 + '|\n'
                    };
                    log.debug({ title: 'stringContentReport', details: stringContentReport });
                    var nameReportGenerated = 'LE' + fedIdNumb + perLookup + '080100' + '00' + '1111' + '_' + filterPage;
                    var fileObj = file.create({
                        name: nameReportGenerated + terminacionFile,
                        fileType: tipoFormato,
                        contents: stringContentReport,
                        encoding: file.Encoding.UTF8,
                        folder: folderReportGenerated,
                        isOnline: true
                    });
                    // log.debug({ title: 'stringContentReport', details: stringContentReport });
                    var fileId = fileObj.save();
                    fileObj.url
                    log.debug({ title: 'myObj', details: 'FINALIZANDO SCHEDULED VENTAS, FILE GENERADO ' + fileId });
                    var cadenaFileGen = '';
                    if (filterPage == 0) {
                        filterArchivosGen = fileId;
                    } else {
                        filterArchivosGen = filterArchivosGen + ';' + fileId;
                    }

                    if (i == 1000) {
                        //log.debug({ title: 'I', details: 'Estoy entrando en IF e i = ' + i });
                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_ss_ple_8_1',
                            deploymentId: 'customdeploy_pe_ss_ple_8_1',
                            params: {
                                custscript_pe_ss_ple_8_1_sub: filterSubsidiary,
                                custscript_pe_ss_ple_8_1_per: filterPostingPeriod,
                                custscript_pe_ss_ple_8_1_page: filterPage + 1,
                                custscript_pe_ss_ple_8_1_file: filterArchivosGen,
                                custscript_pe_ss_ple_8_1_for: filterFormat,
                                custscript_pe_ss_ple_8_1_inc: incluirFlag
                            }
                        });
                        var scriptTaskId = scriptTask.submit();
                    } else {
                        log.debug('test incluirFlag', incluirFlag);
                        // log.debug({ title: 'I', details: 'Estoy entrando en ELSE e i = ' + i });
                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_ss_ple_8_1_ex',
                            deploymentId: 'customdeploy_pe_ss_ple_8_1_ex',
                            params: {
                                custscript_pe_ss_ple_8_1_ex_sub: filterSubsidiary,
                                custscript_pe_ss_ple_8_1_ex_per: filterPostingPeriod,
                                custscript_pe_ss_ple_8_1_ex_pag: 0,
                                custscript_pe_ss_ple_8_1_ex_file: filterArchivosGen,
                                custscript_pe_ss_ple_8_1_ex_for: filterFormat,
                                custscript_pe_ss_ple_8_1_ex_log: recordIdAux,
                                custscript_pe_ss_ple_8_1_ex_bol: incluirFlag,
                                custscript_pe_ss_ple_8_1_ex_fol: fileCabinetId
                            }
                        });
                        var scriptTaskId = scriptTask.submit();
                        var cabeceraCSV = 'Periodo,' +
                            'Numero correlativo del mes o Codigo unico de la Operacion (CUO),' +
                            'Numero correlativo del asiento contable,' +
                            'Fecha de emision del comprobante de pago o documento,' +
                            'Fecha de Vencimiento o Fecha de Pago,' +
                            'Tipo de Comprobante de Pago o Documento,' +
                            'Serie del comprobante de pago o documento,' +
                            'Emision de la DUA o DSI,' +
                            'Numero del comprobante de pago o documento,' +
                            'En caso de optar por anotar el importe total de las operaciones diarias ,' +
                            'Tipo de Documento de Identidad del proveedor,' +
                            'Numero de RUC del proveedor o numero de documento de Identidad,' +
                            'Apellidos y nombres denominacion o razon social  del proveedor,' +
                            'Base imponible de las adquisiciones gravadas que dan derecho a credito fiscal,' +
                            'Monto del Impuesto General a las Ventas,' +
                            'Base imponible de las adquisiciones gravadas que dan derecho a credito fiscal,' +
                            'Monto del Impuesto General a las Ventas,' +
                            'Base imponible de las adquisiciones gravadas que no dan derecho a credito fiscal ,' +
                            'Monto del Impuesto General a las Ventas,' +
                            'Valor de las adquisiciones no gravadas,' +
                            'Monto del Impuesto Selectivo al Consumo,' +
                            'Impuesto al Consumo de las Bolsas de Plastico,' +
                            'Otros conceptos tributos y cargos que no formen parte de la base imponible,' +
                            'Importe total de las adquisiciones registradas segun comprobante de pago,' +
                            'Codigo  de la Moneda,' +
                            'Tipo de cambio,' +
                            'Fecha de emision del comprobante de pago que se modifica,' +
                            'Tipo de comprobante de pago que se modifica,' +
                            'Numero de serie del comprobante de pago que se modifica,' +
                            'Codigo de la dependencia Aduanera de la Declaracion unica de Aduanas (DUA),' +
                            'Numero del comprobante de pago que se modifica,' +
                            'Fecha de emision de la Constancia de Deposito de Detraccion,' +
                            'Numero de la Constancia de Deposito de Detraccion,' +
                            'Marca del comprobante de pago sujeto a retencion,' +
                            'Clasificacion de los bienes y servicios adquiridos,' +
                            'Identificacion del Contrato o del proyecto en el caso de los Operadores de las sociedades irregulares,' +
                            'Error tipo 1,' +
                            'Error tipo 2,' +
                            'Error tipo 3,' +
                            'Error tipo 4,' +
                            'Indicador de Comprobantes de pago cancelados con medios de pago,' +
                            'Estado que identifica la oportunidad de la anotacion o indicacion si esta corresponde a un ajuste\n';
                        if (filterArchivosGen == fileId) {
                            //Se generĂ³ un solo archivo menor a 1000 registros
                            log.debug({ title: 'myObj', details: 'CADENA DE ARCHIVOS GENERADOS ' + filterArchivosGen });
                            var fileLoad = file.load({
                                id: filterArchivosGen
                            });
                            var contentFile = '';
                            if (fileLoad.size < 10485760) {
                                contentFile = fileLoad.getContents();
                            }
                            var nameReportGenerated_N = 'LE' + fedIdNumb + perLookup + '080100' + '00' + '1111_' + filterArchivosGen;
                            if (filterFormat == 'CSV') {
                                contentFile = contentFile.replace(/\|/g, ',');
                                contentFile = cabeceraCSV + contentFile;
                            }
                            var fileFinal = file.load({ id: fileId });
                            fileFinal.name = nameReportGenerated_N + terminacionFile;
                            fileFinal.contents = contentFile;
                            fileFinal.encoding = file.Encoding.UTF8;
                            fileFinal.folder = folderReportGenerated;
                            fileFinal.isOnline = true;

                            // var fileFinal = file.create({
                            //     name: nameReportGenerated_N + terminacionFile,
                            //     fileType: tipoFormato,
                            //     contents: contentFile,
                            //     encoding: file.Encoding.UTF8,
                            //     folder: folderReportGenerated,
                            //     isOnline: true
                            // });
                            var fileId = fileFinal.save();
                            var fileAux = file.load({
                                id: fileId
                            });
                            log.debug({
                                title: 'myObj',
                                details: 'URL DESCARGA DE ARCHIVO FINAL ' + fileAux.url
                            });
                            var customRecord = record.load({
                                type: 'customrecord_pe_generation_logs',
                                id: recordIdAux
                            });
                            var nameData = {
                                custrecord_pe_subsidiary_log: filterSubsidiary,
                                custrecord_pe_period_log: filterPostingPeriod,
                                custrecord_pe_report_log: nameReportGenerated_N + terminacionFile,
                                custrecord_pe_status_log: 'Generated',
                                custrecord_pe_file_cabinet_log: fileAux.url,
                                custrecord_pe_book_log: 'Registro de Compras 8.1'
                            };
                            for (var key in nameData) {
                                if (nameData.hasOwnProperty(key)) {
                                    customRecord.setValue({
                                        fieldId: key,
                                        value: nameData[key]
                                    });
                                }
                            }
                            var recordId = customRecord.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: false
                            });
                        } else {
                            //Se generaron mas de un archivo de 1000 registros
                            log.debug({
                                title: 'myObj',
                                details: 'CADENA DE ARCHIVOS GENERADOS ' + filterArchivosGen
                            });
                            var filesCreados = filterArchivosGen.split(';');
                            var correlativoFile = '';
                            if (filesCreados.length <= corteRegistros) {
                                var contentFile = '';
                                for (var i = 0; i < filesCreados.length; i++) {
                                    var fileLoad = file.load({
                                        id: filesCreados[i]
                                    });
                                    if (fileLoad.size < 10485760) {
                                        contentFile = contentFile + fileLoad.getContents();
                                    }
                                    if (i == 0) {
                                        correlativoFile = filesCreados[i]
                                    }
                                }
                                var nameReportGenerated_N = 'LE' + fedIdNumb + perLookup + '080100' + '00' + '1111_' + correlativoFile;
                                if (filterFormat == 'CSV') {
                                    contentFile = contentFile.replace(/\|/g, ',');
                                    contentFile = cabeceraCSV + contentFile;
                                }
                                var fileFinal = file.load({ id: fileId });
                                fileFinal.name = nameReportGenerated_N + terminacionFile;
                                fileFinal.contents = contentFile;
                                fileFinal.encoding = file.Encoding.UTF8;
                                fileFinal.folder = folderReportGenerated;
                                fileFinal.isOnline = true;
                                var fileId = fileFinal.save();
                                var urlfile = '';
                                var fileAux = file.load({
                                    id: fileId
                                });
                                urlfile += fileAux.url;
                                log.debug({
                                    title: 'myObj',
                                    details: 'URL DESCARGA DE ARCHIVO FINAL ' + fileAux.url + '&_xd=T'
                                });

                                var customRecord = record.create({
                                    type: 'customrecord_pe_generation_logs',
                                    id: recordIdAux
                                });
                                var nameData = {
                                    custrecord_pe_subsidiary_log: filterSubsidiary,
                                    custrecord_pe_period_log: filterPostingPeriod,
                                    custrecord_pe_report_log: nameReportGenerated_N + terminacionFile,
                                    custrecord_pe_status_log: 'Generated',
                                    custrecord_pe_file_cabinet_log: fileAux.url
                                };
                                for (var key in nameData) {
                                    if (nameData.hasOwnProperty(key)) {
                                        customRecord.setValue({
                                            fieldId: key,
                                            value: nameData[key]
                                        });
                                    }
                                }
                                var recordId = customRecord.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: false
                                });
                            } else {
                                var cuentaRegistroCreado = 1;
                                var contentFile = '';

                                for (var i = 0; i < filesCreados.length; i++) {
                                    var fileLoad = file.load({
                                        id: filesCreados[i]
                                    });
                                    if (i == 0) {
                                        correlativoFile = filesCreados[i]
                                    }
                                    if (fileLoad.size < 10485760) {
                                        contentFile = contentFile + fileLoad.getContents();
                                    }
                                    if ((i + 1) % corteRegistros == 0 || (i + 1) == filesCreados.length) {
                                        var nameReportGenerated_N = 'LE' + fedIdNumb + perLookup + '080100' + '00' + '1111_' + correlativoFile + '(' + cuentaRegistroCreado + ')';
                                        if (filterFormat == 'CSV') {
                                            contentFile = contentFile.replace(/\|/g, ',');
                                            contentFile = cabeceraCSV + contentFile;
                                        }
                                        var fileFinal = file.load({ id: fileId });
                                        fileFinal.name = nameReportGenerated_N + terminacionFile;
                                        fileFinal.contents = contentFile;
                                        fileFinal.encoding = file.Encoding.UTF8;
                                        fileFinal.folder = folderReportGenerated;
                                        fileFinal.isOnline = true;
                                        var fileId = fileFinal.save();
                                        var fileAux = file.load({
                                            id: fileId
                                        });
                                        log.debug({
                                            title: 'myObj', details: 'URL DESCARGA DE ARCHIVO FINAL ' + cuentaRegistroCreado + ': ' + fileAux.url
                                        });
                                        contentFile = '';
                                        cuentaRegistroCreado++;
                                        var customRecord = record.create({
                                            type: 'customrecord_pe_generation_logs',
                                            id: recordIdAux
                                        });
                                        var nameData = {
                                            custrecord_pe_subsidiary_log: filterSubsidiary,
                                            custrecord_pe_period_log: filterPostingPeriod,
                                            custrecord_pe_report_log: nameReportGenerated_N + terminacionFile,
                                            custrecord_pe_status_log: 'Generated',
                                            custrecord_pe_file_cabinet_log: fileAux.url
                                        };
                                        for (var key in nameData) {
                                            if (nameData.hasOwnProperty(key)) {
                                                customRecord.setValue({
                                                    fieldId: key,
                                                    value: nameData[key]
                                                });
                                            }
                                        }
                                        var recordId = customRecord.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: false
                                        });
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    log.error('e', e);
                    /*var subject = 'Fatal Error: Unable to transform salesorder to item fulfillment!';
                    var authorId = -5;
                    var recipientEmail = 'jesusc1967@hotmail.com';
                    email.send({
                        author: authorId,
                        recipients: recipientEmail,
                        subject: subject,
                        body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
                    });*/
                }
            } catch (e) {
                log.error({ title: 'execute', details: e });
            }

        }

        function corregirLongitud(valorCampo, formatoCampo, longitudCampo) {
            try {
                if (valorCampo != '') {
                    if (!isNaN(valorCampo)) {
                        if (valorCampo.length <= longitudCampo * -1) {
                            valorCampo = (formatoCampo + valorCampo).slice(longitudCampo);
                        } else {
                            valorCampo = valorCampo.substr(valorCampo.length + longitudCampo);
                        }
                    }
                    if (isNaN(valorCampo)) {
                        if (valorCampo.length > longitudCampo * -1) {
                            valorCampo = valorCampo.substr(valorCampo.length + longitudCampo);
                        }
                    }
                }
                return valorCampo;
            } catch (e) {
                log.error({ title: 'corregirLongitud', details: e });
            }
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

        function retornaPeriodoString(campoRegistro01) {
            try {
                if (campoRegistro01 >= '') {
                    var valorAnio = campoRegistro01.split(' ')[1];
                    var valorMes = campoRegistro01.split(' ')[0].toLowerCase();
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
            } catch (e) {
                log.error({ title: 'retornaPeriodoString', details: e });
            }

        }

        function quitaCaracterEspecial(texto) {
            texto = texto.replace('.', '');
            texto = texto.replace(',', '');
            texto = texto.replace('-', '');
            texto = texto.replace('_', '');
            texto = texto.replace(';', '');
            texto = texto.replace('|', '');
            texto = texto.replace('%', '');
            texto = texto.replace('&', '');
            texto = texto.replace('(', '');
            texto = texto.replace(')', '');
            texto = texto.replace('=', '');
            texto = texto.replace('"', '');
            texto = texto.replace('·', '');
            texto = texto.replace('$', '');
            texto = texto.replace('!', '');
            texto = texto.replace('^', '');
            texto = texto.replace('+', '');
            texto = texto.replace('`', '');
            texto = texto.replace('ç', '');
            return texto;
        }

        // CONVIERTE A LA FECHA EN FORMATO JSON
        function formatDate(dateString) {
            var date = dateString.split('/');
            if (Number(date[0]) < 10) date[0] = '0' + Number(date[0]);
            if (Number(date[1]) < 10) date[1] = '0' + Number(date[1]);
            return { 'anio': date[2], 'mes': date[1], 'dia': date[0] }
        }

        return {
            execute: execute
        };
    });