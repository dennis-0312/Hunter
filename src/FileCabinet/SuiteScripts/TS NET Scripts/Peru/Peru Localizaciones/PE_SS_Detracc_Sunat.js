/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', 'N/config', 'N/format'],
    (search, record, email, runtime, log, file, task, config, format) => {

        const execute = (context) => {
            var featureSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            var configpage = config.load({ type: config.Type.COMPANY_INFORMATION });

            log.debug('MSK', 'Vamos a llamar a customsearch_pe_detracciones_x_pagar')
            // var searchId = 'customsearch_pe_detracciones_x_pagar' // Saved Search: 2524 - PE Detracciones x Pagar
            var searchId = 'customsearch_pe_detracciones_x_pagar_nc2' //IMorales - Incluye Notas de Crédito
            var scriptObj = runtime.getCurrentScript();
            var filterPostingPeriod = scriptObj.getParameter({
                // name: 'custscript_pe_period_detracc_sunat'
                name: 'custscript_pe_ss_detracc_sunat_per'//IMorales 20230926 (Cambios GG)
            }); //112;
            var filterSubsidiary = scriptObj.getParameter({
                // name: 'custscript_pe_subsidiary_detracc_sunat'
                name: 'custscript_pe_ss_detracc_sunat_sub'//IMorales 20230926 (Cambios GG)
            }); //2;
            var consecutivo = scriptObj.getParameter({
                // name: 'custscript_pe_consecutivo_detracc_sunat'
                name: 'custscript_pe_ss_detracc_sunat_con'//IMorales 20230926 (Cambios GG)
            });
            var fedIdNumb;
            var companyname;

            if (featureSubsidiary || featureSubsidiary == 'T') {
                var subLookup = search.lookupFields({ type: search.Type.SUBSIDIARY, id: filterSubsidiary, columns: ['taxidnum'] });
                fedIdNumb = subLookup.taxidnum;
            } else {
                fedIdNumb = configpage.getValue('employerid');

                companyname = configpage.getValue('legalname');
            }
            var perLookup = search.lookupFields({ type: search.Type.ACCOUNTING_PERIOD, id: filterPostingPeriod, columns: ['periodname'] });
            var periodName = perLookup.periodname;
            var fileCabinetId = scriptObj.getParameter({ /*name: 'custscript_pe_filecabinet_sunat_id'*/name: 'custscript_pe_ss_detracc_sunat_file' });
            try {
                log.debug({ title: 'INICIO', details: 'INICIANDO SCHEDULED SUNAT: ' + fedIdNumb + ' - ' + fedIdNumb });
                var searchLoad = search.load({ id: searchId });
                var filters = searchLoad.filters;
                var filterOne = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: filterPostingPeriod });
                filters.push(filterOne);
                if (featureSubsidiary || featureSubsidiary == 'T') {
                    var filterTwo = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: filterSubsidiary });
                    filters.push(filterTwo);
                }
                var stringContentReport = '';
                var perLookup = search.lookupFields({ type: search.Type.ACCOUNTING_PERIOD, id: filterPostingPeriod, columns: ['periodname', 'startdate'] });
                var periodoFinDate = format.parse({ type: format.Type.DATE, value: perLookup.startdate });
                const periodString = (periodoFinDate.getFullYear()).toString();
                var folderReportGenerated = fileCabinetId;
                log.debug('Debug', filterPostingPeriod + '-' + filterSubsidiary + '-' + folderReportGenerated)
                var result = searchLoad.run().getRange({ start: 0, end: 1000 });
                var i = 0;
                var cuentaMonto = 0;
                var rucAdquiriente = '';
                var razAdquiriente = '';

                //Tomo las NC
                let lst_NC = []
                let id_facturas = "_";
                for (i; i < result.length; i++) {
                    let tipo_doc = result[i].getValue(searchLoad.columns[14])
                    // log.debug('MSK', 'tipo_doc = '+tipo_doc)
                    if (tipo_doc == "07") {
                        let objNC = {}
                        objNC.internalId = result[i].getValue(searchLoad.columns[20])
                        objNC.importe_detraccion = result[i].getValue(searchLoad.columns[11])
                        objNC.internalIdReferencia = result[i].getValue(searchLoad.columns[25])
                        id_facturas = id_facturas + objNC.internalIdReferencia + "_"
                        lst_NC.push(objNC)
                    }
                }
                log.debug('MSK-lst_NC', lst_NC)

                i = 0;
                for (i; i < result.length; i++) {
                    let tipo_doc = result[i].getValue(searchLoad.columns[14])
                    if (tipo_doc == "01")//Incluye solo Facturas
                    {
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
                        if (campoRegistro07 == '- None -') {
                            campoRegistro07 = '';
                        }
                        campoRegistro07 = '                                   ';
                        var campoRegistro_08 = result[i].getValue(searchLoad.columns[8]);
                        if (campoRegistro_08 == '- None -') {
                            campoRegistro_08 = '';
                        }
                        campoRegistro_08 = ('000000000' + campoRegistro_08).slice(-9);
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
                        /*cuentaMonto     = cuentaMonto + parseFloat(campoRegistro11).toFixed(2);
                        campoRegistro11 = parseFloat(campoRegistro11).toFixed(2) + '';
                        campoRegistro11 = campoRegistro11.replace('.','');
                        campoRegistro11 = campoRegistro11.replace(',','');
                        campoRegistro11 = ('000000000000000'+campoRegistro11).slice(-15);*/

                        campoRegistro11 = parseFloat(campoRegistro11).toFixed(2);

                        //IMorales 20230904 - Inicio
                        let idFactura = result[i].getValue(searchLoad.columns[20])
                        if (id_facturas.indexOf("_" + idFactura + "_") != -1) {
                            log.debug('MSK', "En esta Factura aplicaré descuento --> " + idFactura)
                            for (let ii = 0; ii < lst_NC.length; ii++) {
                                if (lst_NC[ii].internalIdReferencia == idFactura) {
                                    log.debug('MSK', "Debo restar este valor --> " + lst_NC[ii].importe_detraccion)
                                    let monto_resta = lst_NC[ii].importe_detraccion
                                    campoRegistro11 = parseFloat(campoRegistro11) + parseFloat(monto_resta)
                                    campoRegistro11 = parseFloat(campoRegistro11).toFixed(2);
                                    log.debug('MSK', "campoRegistro11 =" + campoRegistro11)
                                    log.debug('MSK', "monto_resta =" + monto_resta)
                                }
                            }
                        }
                        //IMorales 20230904 - Fin

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
                        //var campoRegistro21 = result[i].getValue(searchLoad.columns[21]);
                        if (campoRegistro11 != '000000000000000') {
                            stringContentReport =
                                stringContentReport +
                                campoRegistro05 + campoRegistro06 + campoRegistro07 + campoRegistro_08 + campoRegistro09 + campoRegistro10 +
                                campoRegistro11 + campoRegistro12 + campoRegistro13 + campoRegistro14 + campoRegistro15 + campoRegistro16 + '\n';
                        }
                    }
                };

                cuentaMonto = parseFloat(cuentaMonto).toFixed(2) + '';
                cuentaMonto = cuentaMonto.replace('.', '');
                cuentaMonto = cuentaMonto.replace(',', '');
                cuentaMonto = ('000000000000000' + cuentaMonto).slice(-15);

                var anioTemp = periodString.substring(2, 4);

                var lineaPrincipal = '*' + rucAdquiriente + razAdquiriente + anioTemp + consecutivo + cuentaMonto;

                stringContentReport = lineaPrincipal + '\n' + stringContentReport;

                var d = new Date();

                log.debug({
                    title: 'date:',
                    details: 'Fecha: ' + d.getDate() + '. Dia de la semana: ' + d.getDay() +
                        '. Mes (0 al 11): ' + d.getMonth() + '. Año: ' + d.getFullYear() +
                        '. Hora: ' + d.getHours() + '. Hora UTC: ' + d.getUTCHours() +
                        '. Minutos: ' + d.getMinutes() + '. Segundos: ' + d.getSeconds()
                });

                var fechaHoraGen = d.getDate() + '' + (d.getMonth() + 1) + '' + d.getFullYear() + '' + d.getHours() + '' + d.getMinutes() + '' + d.getSeconds();

                var nameReportGenerated = 'D' + fedIdNumb + anioTemp + consecutivo;
                var fileObj = file.create({
                    name: nameReportGenerated + '.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: stringContentReport,
                    encoding: file.Encoding.UTF8,
                    folder: folderReportGenerated,
                    isOnline: true
                });
                var fileId = fileObj.save();
                var fileAux = file.load({ id: fileId });
                log.debug({ title: 'myObj', details: 'FINALIZANDO DETRACCIONES SUNAT, FILE GENERADO ' + fileId });

                var customRecord = record.create({ /*type: 'customrecord_pe_generation_logs_2',*/ type: 'customrecord_pe_generation_logs', isDynamic: true });

                if (featureSubsidiary || featureSubsidiary == 'T') {
                    var nameData = {
                        custrecord_pe_subsidiary_log: filterSubsidiary,
                        custrecord_pe_periodo_log: filterPostingPeriod,
                        custrecord_pe_report_log: nameReportGenerated,
                        custrecord_pe_status_log: 'Generated',
                        custrecord_pe_file_cabinet_log: fileAux.url,
                        custrecord_pe_book_log: 'Detracciones SUNAT'
                    };
                } else {
                    var nameData = {
                        custrecord_pe_periodo_log: filterPostingPeriod,
                        custrecord_pe_report_log: nameReportGenerated,
                        custrecord_pe_status_log: 'Generated',
                        custrecord_pe_file_cabinet_log: fileAux.url,
                        custrecord_pe_book_log: 'Detracciones SUNAT'
                    };
                }

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
            } catch (e) {
                var subject = 'Fatal Error: Unable to transform salesorder to item fulfillment!';
                /*var authorId = -5;
                var recipientEmail = 'jesusc1967@hotmail.com';
                email.send({
                    author: authorId,
                    recipients: recipientEmail,
                    subject: subject,
                    body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
                });*/
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
                campoRegistro01 = valorAnio + valorMes;
            }
            return campoRegistro01;
        }
        return {
            execute: execute
        };
    });