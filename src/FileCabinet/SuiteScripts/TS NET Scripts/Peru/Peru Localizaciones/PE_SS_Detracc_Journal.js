/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', 'N/format', "N/config"],
    (search, record, email, runtime, log, file, task, format, config) => {

        const execute = (context) => {
            var featureSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            var configpage = config.load({ type: config.Type.COMPANY_INFORMATION });

            // var searchId = 'customsearch_pe_detracciones_x_pagar' // Saved Search: 2524 - PE Detracciones x Pagar
            var searchId = 'customsearch_pe_detracciones_x_pagar_nc2' //! IMorales 20230901 - incluye NC, orientado a items
            var scriptObj = runtime.getCurrentScript();
            var filterPostingPeriod = scriptObj.getParameter({
                // name: 'custscript_pe_period_bnacion_journal'
                name: 'custscript_pe_ss_detracc_journal_per'//IMorales 20230926 (Cambios GG)
            }); //112;
            var filterSubsidiary = scriptObj.getParameter({
                // name: 'custscript_pe_subsidiary_journal'
                name: 'custscript_pe_ss_detracc_journal_sub'//IMorales 20230926 (Cambios GG)
            }); //2;
            var filterAccountBank = scriptObj.getParameter({
                // name: 'custscript_pe_account_bank_journal'
                name: 'custscript_pe_ss_detracc_journal_acc'//IMorales 20230926 (Cambios GG)
            });

            var fedIdNumb;
            custrecord_pe_detraccion_sales
            var recordAccount;

            var companyname;

            var detraccionAccountId;
            var detraccionAccountName;

            var detraccionAccountDolId;
            var detraccionAccountDolName;

            if (featureSubsidiary || featureSubsidiary == 'T') {
                var subLookup = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: filterSubsidiary,
                    columns: ['taxidnum', 'custrecord_pe_detraccion_account' // change custrecord_pe_detraccion_account_2->custrecord_pe_detraccion_account
                        , 'custrecord_pe_detraccion_account_dol']//IMorales 20230906
                });

                fedIdNumb = subLookup.taxidnum;

                recordAccount = subLookup.custrecord_pe_detraccion_account;

                recordAccount = JSON.stringify(recordAccount);
                detraccionAccountId = recordAccount.split('"')[3];
                detraccionAccountName = recordAccount.split('"')[7];


                recordAccountDol = subLookup.custrecord_pe_detraccion_account_dol;
                recordAccountDol = JSON.stringify(recordAccountDol);
                detraccionAccountDolId = recordAccountDol.split('"')[3];
                detraccionAccountDolName = recordAccountDol.split('"')[7];

                log.debug('MSK-recordAccount', recordAccount)
                log.debug('MSK-recordAccountDol', recordAccountDol)

            } else {
                fedIdNumb = configpage.getValue('employerid');

                companyname = configpage.getValue('legalname');

                recordAccount = configpage.getValue('custrecord_pe_detraccion_account');// change custrecord_pe_detraccion_account_2->custrecord_pe_detraccion_account

                detraccionAccountId = recordAccount;

                var accLookup = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: recordAccount,
                    columns: ['name']
                });

                detraccionAccountName = accLookup.name;
            }

            var perLookup = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: filterPostingPeriod,
                columns: ['periodname']
            });
            var accLookup = search.lookupFields({
                type: search.Type.ACCOUNT,
                id: filterAccountBank,
                columns: ['name']
            });


            var accBankName = accLookup.name;
            var periodName = perLookup.periodname;

            var fileCabinetId = scriptObj.getParameter({
                // name: 'custscript_pe_filecabinet_detracc_id'
                name: 'custscript_pe_ss_detracc_journal_fol'//IMorales 20230926 (Cambios GG)
            }); //223

            log.debug('File cabinet ID', fileCabinetId)

            try {
                log.debug({
                    title: 'INICIO',
                    details: 'INICIANDO SCHEDULED JOURNAL TEMPLATE: ' + fedIdNumb + ' - ' + fedIdNumb
                });
                //var cuentaRegistro = 0 ;
                var searchLoad = search.load({ id: searchId });
                log.debug({ title: 'searchLoad', details: searchLoad });
                log.debug({ title: "searchLoadColumns", details: searchLoad.columns });
                var filters = searchLoad.filters; //reference Search.filters object to a new variable
                var filterOne = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: filterPostingPeriod });
                filters.push(filterOne); //add the filter using .push() method

                if (featureSubsidiary || featureSubsidiary == 'T') {
                    var filterTwo = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: filterSubsidiary });
                    filters.push(filterTwo);
                }

                var stringContentReport = '';
                var periodString = retornaPeriodoString(periodName);
                var folderReportGenerated = fileCabinetId;
                var result = searchLoad.run().getRange({ start: 0, end: 1000 });
                log.debug({ title: 'result', details: result });
                var i = 0;
                var cuentaMonto = parseFloat(0);
                var rucAdquiriente = '';
                var razAdquiriente = '';
                var d = new Date();

                log.debug({
                    title: 'date:',
                    details: 'Fecha: ' + d.getDate() + '. Dia de la semana: ' + d.getDay() +
                        '. Mes (0 al 11): ' + d.getMonth() + '. Año: ' + d.getFullYear() +
                        '. Hora: ' + d.getHours() + '. Hora UTC: ' + d.getUTCHours() +
                        '. Minutos: ' + d.getMinutes() + '. Segundos: ' + d.getSeconds()
                });

                var fechaHoraGen = d.getDate() + '' + (d.getMonth() + 1) + '' + d.getFullYear() + '' + d.getHours() + '' + d.getMinutes() + '' + d.getSeconds();
                var fechaGen = d.getDate() + '/' + (d.getMonth() + 1) + '/' + (d.getFullYear() + '').substr(2, 4) + '';
                var fechaDetalle = d.getDate() + ('00' + (d.getMonth() + 1) + '').slice(-2) + (d.getFullYear() + '') + '';
                var fechaGenInic = '01/' + ('00' + (d.getMonth() + 1) + '').slice(-2) + '/' + (d.getFullYear() + '') + '';
                var customAccountingPeriod = search.create({
                    type: search.Type.ACCOUNTING_PERIOD,
                    columns: [
                        { name: 'internalId' },
                        { name: 'periodname' }
                    ]
                });
                log.debug('fechaGenInic antes', fechaGenInic);
                var parsedSampleDate = format.parse({value: fechaGenInic,type: format.Type.DATE});
                log.debug('fechaGenInic antes', parsedSampleDate);

                var parsedSampleDate = format.format({
                    value: parsedSampleDate,
                    type: format.Type.DATE
                });

                log.debug('fechaGenInic despues', parsedSampleDate);

                customAccountingPeriod.filters = [
                    search.createFilter({
                        name: 'startdate',
                        operator: search.Operator.ON,
                        values: fechaGenInic
                    })
                ]

                var resultSet = customAccountingPeriod.run();
                var results = resultSet.getRange({
                    start: 0,
                    end: 1
                });
                log.debug({
                    title: 'resultsGG',
                    details: results
                });
                var nameAcc = '';
                for (var i in results) {
                    // log.debug('Found custom list record', results[i]);
                    nameAcc = results[i].getValue({
                        name: 'periodname'
                    });
                };

                log.debug({
                    title: 'nameAcc',
                    details: 'nameAcc: ' + nameAcc
                });


                for (i; i < result.length; i++) {
                    var campoRegistro00 = result[i].getValue(searchLoad.columns[0]);
                    var campoRegistro01 = result[i].getValue(searchLoad.columns[1]);
                    if (featureSubsidiary || featureSubsidiary == 'T') {
                        var campoRegistro02 = result[i].getValue(searchLoad.columns[2]);
                        var campoRegistro03 = result[i].getValue(searchLoad.columns[3]);
                    } else {
                        var campoRegistro02 = fedIdNumb;
                        var campoRegistro03 = companyname;
                    }
                    rucAdquiriente = campoRegistro02;
                    razAdquiriente = campoRegistro03;
                    if (razAdquiriente == '- None -') {
                        razAdquiriente = '';
                    }
                    if (razAdquiriente.length >= 35) {
                        razAdquiriente = razAdquiriente.substr(0, 35);
                    } else {
                        razAdquiriente = ('                                   ' + razAdquiriente).slice(-35);
                    }
                    var campoRegistro04 = result[i].getValue(searchLoad.columns[4]);
                    var campoRegistro05 = result[i].getValue(searchLoad.columns[5]);
                    var campoRegistro06 = result[i].getValue(searchLoad.columns[6]);
                    var campoRegistro07 = result[i].getValue(searchLoad.columns[7]);
                    var campoRegistro08 = result[i].getValue(searchLoad.columns[8]);
                    var campoRegistro09 = result[i].getValue(searchLoad.columns[9]);
                    if (campoRegistro09 == '- None -') {
                        campoRegistro09 = '';
                    }
                    campoRegistro09 = ('000' + campoRegistro09).slice(-3);
                    var campoRegistro10 = result[i].getValue(searchLoad.columns[10]);
                    if (campoRegistro10 == '- None -') {
                        campoRegistro10 = '';
                    }
                    campoRegistro10 = ('00000000000' + campoRegistro10).slice(-11);
                    var campoRegistro11 = result[i].getValue(searchLoad.columns[11]);
                    //cuentaMonto     = (parseFloat(cuentaMonto).toFixed(2) + parseFloat(campoRegistro11).toFixed(2));
                    campoRegistro11 = parseFloat(campoRegistro11).toFixed(2);
                    cuentaMonto = parseFloat(cuentaMonto) + parseFloat(campoRegistro11);
                    campoRegistro11 = campoRegistro11.replace('.', '');
                    campoRegistro11 = campoRegistro11.replace(',', '');
                    campoRegistro11 = ('000000000000000' + campoRegistro11).slice(-15);
                    var campoRegistro12 = result[i].getValue(searchLoad.columns[12]);
                    if (campoRegistro12 == '- None -') {
                        campoRegistro12 = '';
                    }
                    campoRegistro12 = ('00' + campoRegistro12).slice(-2);
                    var campoRegistro13 = result[i].getValue(searchLoad.columns[13]);
                    var campoRegistro14 = result[i].getValue(searchLoad.columns[14]);

                    var campoRegistro15 = result[i].getValue(searchLoad.columns[15]);

                    campoRegistro15 = ('0000' + campoRegistro15).slice(-4);

                    var campoRegistro16 = result[i].getValue(searchLoad.columns[16]);

                    campoRegistro16 = ('00000000' + campoRegistro16).slice(-8);

                    var campoRegistro17 = result[i].getValue(searchLoad.columns[17]);

                    var campoRegistro18 = result[i].getValue(searchLoad.columns[18]);

                    var campoRegistro19 = result[i].getValue(searchLoad.columns[19]);

                    var campoRegistro20 = result[i].getValue(searchLoad.columns[20]);

                    var campoRegistro21 = result[i].getValue(searchLoad.columns[21]);

                    // var campoRegistro22 = result[i].getText(searchLoad.columns[22]);
                    var campoRegistro22 = result[i].getValue(searchLoad.columns[22]);

                    let debito;
                    let credito;

                    if (campoRegistro14 == "01") {
                        debito = result[i].getValue(searchLoad.columns[11]);
                        credito = "0";
                        log.debug('MSK', 'VendorBill')

                        var vendorBill = record.load({
                            type: record.Type.VENDOR_BILL,
                            id: campoRegistro20,
                            isDynamic: true,
                        });

                        var itemCount = vendorBill.getLineCount({
                            sublistId: "item",
                        });

                        log.debug('vendorBill', vendorBill);
                        log.debug('itemCount', itemCount);
                        for (var line = 0; line < itemCount; line++) {
                            var item_department = vendorBill.getSublistValue({
                                sublistId: "item",
                                fieldId: "department_display",
                                line: line,
                            });
                            var item_clase = vendorBill.getSublistValue({
                                sublistId: "item",
                                fieldId: "class_display",
                                line: line,
                            });

                            var item_location = vendorBill.getSublistValue({
                                sublistId: "item",
                                fieldId: "location_display",
                                line: line,
                            });
                            log.debug('line', line);
                            log.debug('item_department', item_department);
                            log.debug('item_clase', item_clase);
                            log.debug('item_location', item_location);
                        }
                    } else {
                        debito = "0";
                        credito = Math.abs(parseFloat(result[i].getValue(searchLoad.columns[11])));
                        log.debug('MSK', 'VendorCredit')
                        log.debug('MSK', 'campoRegistro20 = ' + campoRegistro20)
                        log.debug('MSK', 'traza 0')
                        var vendorCredit = record.load({
                            //type: record.Type.VENDOR_CREDIT,
                            type: "vendorcredit",
                            id: campoRegistro20,
                            isDynamic: true,
                        });
                        log.debug('MSK', 'traza 1')

                        var itemCount = vendorCredit.getLineCount({
                            sublistId: "item",
                        });
                        log.debug('MSK', 'traza 2')

                        for (var line = 0; line < itemCount; line++) {
                            log.debug('MSK', 'traza 2.' + line)
                            var item_department = vendorCredit.getSublistValue({
                                sublistId: "item",
                                fieldId: "department_display",
                                line: line,
                            });
                            var item_clase = vendorCredit.getSublistValue({
                                sublistId: "item",
                                fieldId: "class_display",
                                line: line,
                            });

                            var item_location = vendorCredit.getSublistValue({
                                sublistId: "item",
                                fieldId: "location_display",
                                line: line,
                            });


                        }
                        log.debug('MSK', 'traza 3')
                    }

                    if (!featureSubsidiary) {
                        filterSubsidiary = '';
                    }

                    log.debug('debito', Number(debito));
                    log.debug('credito', Number(credito));
                    if (Number(debito) != 0 || Number(credito) != 0) {
                        stringContentReport =
                            stringContentReport +
                            'DET' + fechaDetalle + ',' +
                            filterSubsidiary + ',' +
                            //'Soles' + ',' +
                            //campoRegistro22 + ',' + //GG - 20230815
                            //(campoRegistro22=="1"?"PEN":campoRegistro22=="2"?"USD":"") + ',' + //IM 20230906
                            // 'PEN' + ',' + //IM 20230906 - A Solicitud de CMLB
                            'Soles' + ',' + //IM 20230926 - A Solicitud de SANDRA
                            '1' + ',' +
                            fechaGen + ',' +
                            nameAcc + ',' +
                            //detraccionAccountName + ',' +
                            (campoRegistro22 == "1" ? detraccionAccountName : campoRegistro22 == "2" ? detraccionAccountDolName : "") + ',' + //IM 20230906

                            // result[i].getValue(searchLoad.columns[11]) + ',' +
                            // '0' + ',' +
                            (campoRegistro14 == "01" ? result[i].getValue(searchLoad.columns[11]) : "0") + ',' +//IMorales 20230901
                            (campoRegistro14 == "01" ? "0" : Math.abs(parseFloat(result[i].getValue(searchLoad.columns[11])))) + ',' +//IMorales 20230901

                            item_department + ',' +
                            item_location + ',' +
                            item_clase + ',' +
                            ',' +
                            'Pago de Detracciones Periodo ' + periodName + ',' +
                            //detraccionAccountId + ',' +
                            (campoRegistro22 == "1" ? detraccionAccountId : campoRegistro22 == "2" ? detraccionAccountDolId : "") + ',' + //IM 20230906
                            'T' + ',' +

                            'T' + ',' +
                            // (campoRegistro14=="01"?"T":"F") + ',' +//IMorales 20230901

                            campoRegistro21 + ',' +
                            campoRegistro20 + ',' +
                            ',' +
                            ',' +
                            campoRegistro07 + ',' +
                            campoRegistro15 + '-' + campoRegistro16 +
                            '\n';
                    }

                };

                log.debug('stringContentReport', stringContentReport);

                cuentaMonto = parseFloat(cuentaMonto).toFixed(2) + '';
                /*cuentaMonto = cuentaMonto.replace('.','');
                cuentaMonto = cuentaMonto.replace(',','');
                cuentaMonto = ('000000000000000'+cuentaMonto).slice(-15);*/

                var lineaPrincipal = 'External ID,Subsidiary,Currency,Exchange Rate,Date,Posting Period,Account,Debit,Credit,Department,Location,Class,Name,Memo,Account ID,PE Detraccion,PE LN Detraccion,PE LN Vendor,PE LN Bill Detraccion,PE LN Detraccion Date,PE LN Detraccion Number,Proveedor,Numero de Documento';

                if (!featureSubsidiary) {
                    filterSubsidiary = '';
                }

                var lineaFinal = 'DET' + fechaDetalle + ',' +
                    filterSubsidiary + ',' +
                    // 'Soles' + ',' +
                    // 'PEN' + ',' +//GG - 20230815
                    'Soles' + ',' + //IM 20230926 - A Solicitud de SANDRA
                    '1' + ',' +
                    fechaGen + ',' +
                    nameAcc + ',' +
                    accBankName + ',' +
                    '0' + ',' +
                    cuentaMonto + ',' +
                    ',' +
                    ',' +
                    ',' +
                    ',' +
                    'Pago de Detracciones Periodo ' + periodName + ',' +
                    filterAccountBank + ',' +
                    ',' +
                    ',' +
                    ',' +
                    ',' +
                    ',' +
                    ',' +
                    ',' +
                    ',';

                log.debug('MSK', "lineaPrincipal: " + lineaPrincipal);
                log.debug('MSK', "stringContentReport: " + stringContentReport);
                log.debug('MSK', "lineaFinal: " + lineaFinal);
                stringContentReport = lineaPrincipal + '\n' + stringContentReport + lineaFinal;

                var nameReportGenerated = 'D' + fedIdNumb + periodString + '_' + fechaHoraGen;
                var fileObj = file.create({
                    name: nameReportGenerated + '.CSV',
                    fileType: file.Type.CSV,
                    contents: stringContentReport,
                    encoding: file.Encoding.UTF8,
                    folder: folderReportGenerated,
                    isOnline: true
                });
                var fileId = fileObj.save();
                var fileAux = file.load({ id: fileId });
                log.debug({ title: 'myObj', details: 'FINALIZANDO DETRACCIONES JOURNAL TEMPLATE, FILE GENERADO ' + fileId });
                var customRecord = record.create({/* type: 'customrecord_pe_generation_logs_2',*/type: 'customrecord_pe_generation_logs', isDynamic: true }); //IMorales 20230727
                if (featureSubsidiary || featureSubsidiary == 'T') {
                    var nameData = {
                        custrecord_pe_subsidiary_log: parseInt(filterSubsidiary, 10),
                        custrecord_pe_periodo_log: filterPostingPeriod,
                        custrecord_pe_report_log: nameReportGenerated,
                        custrecord_pe_status_log: 'Generated',
                        custrecord_pe_file_cabinet_log: fileAux.url + '&_xd=T',
                        custrecord_pe_book_log: 'Detracciones JOURNAL TEMPLATE'
                    };
                } else {
                    var nameData = {
                        custrecord_pe_periodo_log: filterPostingPeriod,
                        custrecord_pe_report_log: nameReportGenerated,
                        custrecord_pe_status_log: 'Generated',
                        custrecord_pe_file_cabinet_log: fileAux.url + '&_xd=T',
                        custrecord_pe_book_log: 'Detracciones JOURNAL TEMPLATE'
                    };
                }
                for (var key in nameData) {
                    if (nameData.hasOwnProperty(key)) {
                        customRecord.setValue({ fieldId: key, value: nameData[key] });
                    }
                }
                var recordId = customRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
                log.debug('recordId', recordId)
            } catch (err) {
                /*var subject = 'Fatal Error: Unable to transform salesorder to item fulfillment!';
                var authorId = -5;
                var recipientEmail = 'jesusc1967@hotmail.com';
                email.send({
                    author: authorId,
                    recipients: recipientEmail,
                    subject: subject,
                    body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
                });*/
                log.error('err', err)
            }
        }

        const corregirLongitud = (valorCampo, formatoCampo, longitudCampo) => {
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
        }

        const retornaPeriodoString = (campoRegistro01) => {
            if (campoRegistro01 >= '') {
                var valorAnio = campoRegistro01.split(' ')[1];
                var valorMes = campoRegistro01.split(' ')[0];
                if (valorMes.indexOf('Jan') >= 0 || valorMes.indexOf('Ene') >= 0) {
                    valorMes = '01';
                } else {
                    if (valorMes.indexOf('Feb') >= 0) {
                        valorMes = '02';
                    } else {
                        if (valorMes.indexOf('Mar') >= 0) {
                            valorMes = '03';
                        } else {
                            if (valorMes.indexOf('Abr') >= 0 || valorMes.indexOf('Apr') >= 0) {
                                valorMes = '04';
                            } else {
                                if (valorMes.indexOf('May') >= 0) {
                                    valorMes = '05';
                                } else {
                                    if (valorMes.indexOf('Jun') >= 0) {
                                        valorMes = '06';
                                    } else {
                                        if (valorMes.indexOf('Jul') >= 0) {
                                            valorMes = '07';
                                        } else {
                                            if (valorMes.indexOf('Aug') >= 0 || valorMes.indexOf('Ago') >= 0) {
                                                valorMes = '08';
                                            } else {
                                                if (valorMes.indexOf('Set') >= 0 || valorMes.indexOf('Sep') >= 0) {
                                                    valorMes = '09';
                                                } else {
                                                    if (valorMes.indexOf('Oct') >= 0) {
                                                        valorMes = '10';
                                                    } else {
                                                        if (valorMes.indexOf('Nov') >= 0) {
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
                campoRegistro01 = valorAnio.substr(2, 4) + valorMes;
            }
            return campoRegistro01;
        }
        return {
            execute: execute
        };
    });