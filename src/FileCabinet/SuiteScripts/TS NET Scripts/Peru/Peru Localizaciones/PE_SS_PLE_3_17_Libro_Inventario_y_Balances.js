/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config"], (search, record, runtime, log, file, task, config) => {
    // 	Anual: Libro de Inventario y Balances - Balance de Comprobación- 3.17
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_bc_3_17';
            var logrecodId = 'customrecord_pe_generation_logs';
            let fedIdNumb = '';
            let hasinfo = 0;

            const params = getParams();

            if (featureSubsidiary) {
                const getruc = getRUC(params.filterSubsidiary)
                fedIdNumb = getruc;
            } else {
                const employerid = getEmployerID();
                fedIdNumb = employerid;
            }

            var createrecord = createRecord(logrecodId, featureSubsidiary, params.filterSubsidiary, params.filterPostingPeriod);
            const searchbook = searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary, params.filterAnioPeriod);

            if (searchbook.thereisinfo == 1) {
                hasinfo = '1';
                const structuregbody = structureBody(searchbook.content);
                const createfile = createFile(params.filterPostingPeriod, fedIdNumb, hasinfo, createrecord.recordlogid, params.filterFormat, structuregbody, params.fileCabinetId, params.filterAnioPeriod);
                const statusProcess = setRecord(createrecord.irecord, createrecord.recordlogid, createfile, logrecodId);
                log.debug({ title: 'FinalResponse', details: 'Estado del proceso: ' + statusProcess + ' OK!!' });
            } else {
                setVoid(createrecord.irecord, logrecodId, createrecord.recordlogid);
                log.debug({ title: 'FinalResponse', details: 'No hay registros para la solicitud: ' + createrecord.recordlogid });
            }
        } catch (e) {
            log.error({ title: 'ErrorInExecute', details: e });
            setError(createrecord.irecord, logrecodId, createrecord.recordlogid, e)
        }
    }


    const getParams = () => {
        try {
            const scriptObj = runtime.getCurrentScript();
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_ss_ple_3_17_invbal_sub' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_ss_ple_3_17_invbal_per' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_ss_ple_3_17_invbal_for' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_ss_ple_3_17_invbal_fol' });
            const filterAnioPeriod = scriptObj.getParameter({ name: 'custscript_ss_ple_3_17_invbal_year' });
            return {
                filterSubsidiary: filterSubsidiary,
                filterPostingPeriod: filterPostingPeriod,
                filterFormat: filterFormat,
                fileCabinetId: fileCabinetId,
                filterAnioPeriod: filterAnioPeriod
            }
        } catch (e) {
            log.error({ title: 'getParams', details: e });
        }
    }


    const getRUC = (filterSubsidiary) => {
        try {
            const subLookup = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: filterSubsidiary,
                columns: ['taxidnum']
            });
            const ruc = subLookup.taxidnum;
            return ruc;
        } catch (e) {
            log.error({ title: 'getRUC', details: e });
        }
    }


    const getEmployerID = () => {
        const configpage = config.load({ type: config.Type.COMPANY_INFORMATION });
        const employeeid = configpage.getValue('employerid');
        return employeeid;
    }


    const createRecord = (logrecodId, featureSubsidiary, filterSubsidiary, filterPostingPeriod) => {
        try {
            const recordlog = record.create({ type: logrecodId });
            if (featureSubsidiary) {
                recordlog.setValue({ fieldId: 'custrecord_pe_subsidiary_log', value: filterSubsidiary });
            }
            recordlog.setValue({ fieldId: 'custrecord_pe_period_log', value: filterPostingPeriod });
            recordlog.setValue({ fieldId: 'custrecord_pe_status_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_report_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Inventario y Balance 3.17' });
            const recordlogid = recordlog.save();

            return { recordlogid: recordlogid, irecord: record };
        } catch (e) {
            log.error({ title: 'createRecord', details: e });
        }
    }


    const searchBook = (subsidiary, period, searchId, featureSubsidiary, anioperiod) => {
        let json = new Array();
        var searchResult;
        let division = 0.0;
        let laps = 0.0;
        let start = 0;
        let end = 1000;
        try {

            const searchLoad = search.load({
                id: searchId
            });

            let filters = searchLoad.filters;

            // const filterOne = search.createFilter({
            //     name: 'postingperiod',
            //     operator: search.Operator.ANYOF,
            //     values: period
            // });

            // filters.push(filterOne);

            if (featureSubsidiary) {
                const filterTwo = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                });
                filters.push(filterTwo);
            }

            const searchResultCount = searchLoad.runPaged().count;
            const periodname = getPeriodName(period);
            const periodostring = retornaPeriodoStringForView(periodname);
            const PeriodoCompleto = func(periodostring.valorAnio, periodostring.valorMes);
            log.debug('PERIODO', PeriodoCompleto);

            if (searchResultCount != 0) {
                if (searchResultCount <= 4000) {
                    searchLoad.run().each((result) => {
                        let column01 = result.getValue(searchLoad.columns[0]);
                        //column01 = column01.split('/');
                        //const PeriodoCompleto = func(column01[0], column01[1]);
                        let column02 = result.getValue(searchLoad.columns[1]);
                        if (column02 == '- None -') {
                            column02 = ''
                        }
                        let column03 = result.getValue(searchLoad.columns[2]);
                        column03 = parseFloat(column03).toFixed(2);
                        //column03 = numberWithCommas(column03);                      
                        if (column03 <= 0) {
                            column03 = '0.00';
                        }
                        let column04 = result.getValue(searchLoad.columns[3]);
                        column04 = parseFloat(column04).toFixed(2);
                        //column04 = numberWithCommas(column04);

                        if (column04 <= 0) {
                            column04 = '0.00'

                        }
                        let column05 = result.getValue(searchLoad.columns[4]);
                        column05 = parseFloat(column05).toFixed(2);
                        //column05 = numberWithCommas(column05);
                        if (column05 <= 0) {
                            column05 = '0.00'
                        }
                        let column06 = result.getValue(searchLoad.columns[5]);
                        column06 = parseFloat(column06).toFixed(2);
                        //column06 = numberWithCommas(column06);
                        if (column06 <= 0) {
                            column06 = '0.00'
                        }
                        let column07 = result.getValue(searchLoad.columns[6]);
                        column07 = parseFloat(column07).toFixed(2);
                        //column07 = numberWithCommas(column07);
                        if (column07 <= 0) {
                            column07 = '0.00'
                        }
                        let column08 = result.getValue(searchLoad.columns[7]);
                        column08 = parseFloat(column08).toFixed(2);
                        //column08 = numberWithCommas(column08);
                        if (column08 <= 0) {
                            column08 = '0.00'
                        }
                        let column09 = result.getValue(searchLoad.columns[8]);
                        column09 = parseFloat(column09).toFixed(2);
                        //column09 = numberWithCommas(column09);
                        if (column09 <= 0) {
                            column09 = '0.00'
                        }
                        let column10 = result.getValue(searchLoad.columns[9]);
                        column10 = parseFloat(column10).toFixed(2);
                        //column10 = numberWithCommas(column10);
                        if (column10 <= 0) {
                            column10 = '0.00'
                        }
                        let column11 = result.getValue(searchLoad.columns[10]);
                        column11 = parseFloat(column11).toFixed(2);
                        //column11 = numberWithCommas(column11);
                        if (column11 <= 0) {
                            column11 = '0.00'
                        }
                        let column12 = result.getValue(searchLoad.columns[11]);
                        column12 = parseFloat(column12).toFixed(2);
                        //column12 = numberWithCommas(column12);
                        if (column12 <= 0) {
                            column12 = '0.00'
                        }
                        let column13 = result.getValue(searchLoad.columns[12]);
                        column13 = parseFloat(column13).toFixed(2);
                        //column13 = numberWithCommas(column13);
                        if (column13 <= 0) {
                            column13 = '0.00'
                        }
                        let column14 = result.getValue(searchLoad.columns[13]);
                        column14 = parseFloat(column14).toFixed(2);
                        //column14 = numberWithCommas(column14);
                        if (column14 <= 0) {
                            column14 = '0.00'
                        }
                        let column15 = result.getValue(searchLoad.columns[14]);
                        column15 = parseFloat(column15).toFixed(2);
                        //column15 = numberWithCommas(column15);
                        if (column15 <= 0) {
                            column15 = '0.00'
                        }
                        let column16 = result.getValue(searchLoad.columns[15]);
                        column16 = parseFloat(column16).toFixed(2);
                        //column16 = numberWithCommas(column16);

                        if (column16 <= 0) {
                            column16 = '0.00'
                        }
                        let column17 = result.getValue(searchLoad.columns[16]);
                        column17 = parseFloat(column17).toFixed(2);
                        //column17 = numberWithCommas(column17);
                        if (column17 <= 0) {
                            column17 = '0.00'
                        }
                        let column18 = result.getValue(searchLoad.columns[17]);
                        column18 = parseFloat(column18).toFixed(2);
                        //column18 = numberWithCommas(column18);
                        if (column18 <= 0) {
                            column18 = '0.00'
                        }
                        const column19 = result.getValue(searchLoad.columns[18]);
                        let column20 = result.getValue(searchLoad.columns[19]);
                        if (column20 == anioperiod) {
                            json.push({
                                c1_periodo: column01,
                                c2_cod_cuenta: column02,
                                c3_saldos_inic_debe: column03,
                                c4_saldos_inic_haber: column04,
                                c5_mov_ejercicio_debe: column05,
                                c6_mov_ejercicio_haber: column06,
                                c7_sum_mayor_debe: column07,
                                c8_sum_mayor_haber: column08,
                                c9_saldo_deudor: column09,
                                c10_saldo_acreedor: column10,
                                c11_transf_Debe: column11,
                                c12_transf_haber: column12,
                                c13_cuent_balanc_Activo: column13,
                                c14_cuent_balanc_Pasivo: column14,
                                c15_result_natura_perdida: column15,
                                c16_result_natura_ganancia: column16,
                                c17_adiciones: column17,
                                c18_deducciones: column18,
                                c19_estado_ope: column19

                            });
                        }

                        return true;

                    });

                    return { thereisinfo: 1, content: json };

                } else {
                    division = searchResultCount / 1000;
                    laps = Math.round(division);
                    if (division > laps) {
                        laps = laps + 1
                    }
                    for (let i = 1; i <= laps; i++) {
                        if (i != laps) {
                            searchResult = searchLoad.run().getRange({ start: start, end: end });
                        } else {
                            searchResult = searchLoad.run().getRange({ start: start, end: searchResultCount });
                        }
                        for (let j in searchResult) {

                            let column01 = searchResult[j].getValue(searchLoad.columns[0]);
                            //column01 = column01.split('/');
                            //const PeriodoCompleto = func(column01[0], column01[1]);

                            let column02 = result.getValue(searchLoad.columns[1]);
                            if (column02 == '- None -') {
                                column02 = ''
                            }
                            let column03 = result[j].getValue(searchLoad.columns[2]);
                            column03 = parseFloat(column03).toFixed(2);
                            //column03 = numberWithCommas(column03);
                            if (column03 <= 0) {
                                column03 = '0.00'
                            }
                            let column04 = result[j].getValue(searchLoad.columns[3]);
                            column04 = parseFloat(column04).toFixed(2);
                            //column04 = numberWithCommas(column04);
                            if (column04 <= 0) {
                                column04 = '0.00'
                            }
                            let column05 = result[j].getValue(searchLoad.columns[4]);
                            column05 = parseFloat(column05).toFixed(2);
                            //column05 = numberWithCommas(column05);
                            if (column05 <= 0) {
                                column05 = '0.00'
                            }
                            let column06 = result[j].getValue(searchLoad.columns[5]);
                            column06 = parseFloat(column06).toFixed(2);
                            //column06 = numberWithCommas(column06);
                            if (column06 <= 0) {
                                column06 = '0.00'
                            }
                            let column07 = result[j].getValue(searchLoad.columns[6]);
                            column07 = parseFloat(column07).toFixed(2);
                            //column07 = numberWithCommas(column07);
                            if (column07 <= 0) {
                                column07 = '0.00'
                            }
                            let column08 = result[j].getValue(searchLoad.columns[7]);
                            column08 = parseFloat(column08).toFixed(2);
                            //column08 = numberWithCommas(column08);
                            if (column08 <= 0) {
                                column08 = '0.00'
                            }
                            let column09 = result[j].getValue(searchLoad.columns[8]);
                            column09 = parseFloat(column09).toFixed(2);
                            //column09 = numberWithCommas(column09);
                            if (column09 <= 0) {
                                column09 = '0.00'
                            }
                            let column10 = result[j].getValue(searchLoad.columns[9]);
                            column10 = parseFloat(column10).toFixed(2);
                            //column10 = numberWithCommas(column10);
                            if (column10 <= 0) {
                                column10 = '0.00'
                            }
                            let column11 = result[j].getValue(searchLoad.columns[10]);
                            column11 = parseFloat(column11).toFixed(2);
                            //column11 = numberWithCommas(column11);
                            if (column11 <= 0) {
                                column11 = '0.00'
                            }
                            let column12 = result[j].getValue(searchLoad.columns[11]);
                            column12 = parseFloat(column12).toFixed(2);
                            //column12 = numberWithCommas(column12);
                            if (column12 <= 0) {
                                column12 = '0.00'
                            }
                            let column13 = result[j].getValue(searchLoad.columns[12]);
                            column13 = parseFloat(column13).toFixed(2);
                            //column13 = numberWithCommas(column13);
                            if (column13 <= 0) {
                                column13 = '0.00'
                            }
                            let column14 = result[j].getValue(searchLoad.columns[13]);
                            column14 = parseFloat(column14).toFixed(2);
                            //column14 = numberWithCommas(column14);
                            if (column14 <= 0) {
                                column14 = '0.00'
                            }
                            let column15 = result[j].getValue(searchLoad.columns[14]);
                            column15 = parseFloat(column15).toFixed(2);
                            //column15 = numberWithCommas(column15);
                            if (column15 <= 0) {
                                column15 = '0.00'
                            }
                            let column16 = result[j].getValue(searchLoad.columns[15]);
                            column16 = parseFloat(column16).toFixed(2);
                            //column16 = numberWithCommas(column16);
                            if (column16 <= 0) {
                                column16 = '0.00'
                            }
                            let column17 = result[j].getValue(searchLoad.columns[16]);
                            column17 = parseFloat(column17).toFixed(2);
                            //column17 = numberWithCommas(column17);
                            if (column17 <= 0) {
                                column17 = '0.00'
                            }
                            let column18 = result[j].getValue(searchLoad.columns[17]);
                            column18 = parseFloat(column18).toFixed(2);
                            //column18 = numberWithCommas(column18);
                            if (column18 <= 0) {
                                column18 = '0.00'
                            }
                            const column19 = result[j].getValue(searchLoad.columns[18]);
                            let column20 = result[j].getValue(searchLoad.columns[19]);
                            if (column20 == anioperiod) {
                                json.push({
                                    c1_periodo: column01,
                                    c2_cod_cuenta: column02,
                                    c3_saldos_inic_debe: column03,
                                    c4_saldos_inic_haber: column04,
                                    c5_mov_ejercicio_debe: column05,
                                    c6_mov_ejercicio_haber: column06,
                                    c7_sum_mayor_debe: column07,
                                    c8_sum_mayor_haber: column08,
                                    c9_saldo_deudor: column09,
                                    c10_saldo_acreedor: column10,
                                    c11_transf_Debe: column11,
                                    c12_transf_haber: column12,
                                    c13_cuent_balanc_Activo: column13,
                                    c14_cuent_balanc_Pasivo: column14,
                                    c15_result_natura_perdida: column15,
                                    c16_result_natura_ganancia: column16,
                                    c17_adiciones: column17,
                                    c18_deducciones: column18,
                                    c19_estado_ope: column19
                                });
                            }
                        }
                        start = start + 1000;
                        end = end + 1000;
                    }

                    return { thereisinfo: 1, content: json };
                }
            }
            else {
                return { thereisinfo: 0 }
            }
        } catch (e) {
            log.error({ title: 'searchBook', details: e });
        }
    }


    const structureBody = (searchResult) => {
        let contentReport = '';
        try {
            for (let i in searchResult) {
                contentReport =
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cod_cuenta + '|' + searchResult[i].c3_saldos_inic_debe + '|' +
                    searchResult[i].c4_saldos_inic_haber + '|' + searchResult[i].c5_mov_ejercicio_debe + '|' + searchResult[i].c6_mov_ejercicio_haber + '|' +
                    searchResult[i].c7_sum_mayor_debe + '|' + searchResult[i].c8_sum_mayor_haber + '|' + searchResult[i].c9_saldo_deudor + '|' +
                    searchResult[i].c10_saldo_acreedor + '|' + searchResult[i].c11_transf_Debe + '|' + searchResult[i].c12_transf_haber + '|' +
                    searchResult[i].c13_cuent_balanc_Activo + '|' + searchResult[i].c14_cuent_balanc_Pasivo + '|'
                    + searchResult[i].c15_result_natura_perdida + '|' + searchResult[i].c16_result_natura_ganancia + '|' + searchResult[i].c17_adiciones + '|'
                    + searchResult[i].c18_deducciones + '|' + searchResult[i].c19_estado_ope + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId, filterAnioPeriod) => {
        let typeformat;
        const header = '1 Periodo|2 Código de catalogo|3 Codigo de rubro|4 Saldo rubro|5 Estado de operacion|6 Campos Libres|\n';
        try {
            let periodname = filterAnioPeriod;

            let nameReportGenerated = 'LE' + fedIdNumb + periodname + '1231031700' + '07' + '1' + hasinfo + '11_' + recordlogid;
            if (filterFormat == 'CSV') {
                nameReportGenerated = nameReportGenerated + '.csv';
                structuregbody = header + structuregbody;
                structuregbody = structuregbody.replace(/[,]/gi, ' ');
                structuregbody = structuregbody.replace(/[|]/gi, ',');
                typeformat = file.Type.CSV;
            } else {
                nameReportGenerated = nameReportGenerated + '.txt';
                typeformat = file.Type.PLAINTEXT;
            }
            const fileObj = file.create({
                name: nameReportGenerated,
                fileType: typeformat,
                contents: structuregbody,
                encoding: file.Encoding.UTF8,
                folder: fileCabinetId,
                isOnline: true
            });
            const fileId = fileObj.save();
            return fileId;
        } catch (e) {
            log.error({ title: 'createFile', details: e });
        }
    }


    const setRecord = (irecord, recordlogid, fileid, logrecodId) => {
        try {
            const fileAux = file.load({ id: fileid });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_file_cabinet_log: fileAux.url + '&_xd=T' } });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: 'Generated' } });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_report_log: fileAux.name } });
            return recordlogid;
        } catch (e) {
            log.error({ title: 'setRecord', details: e });
        }
    }


    const setError = (irecord, logrecodId, recordlogid, error) => {
        try {
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: 'ERROR: ' + error } });
        } catch (e) {
            log.error({ title: 'setError', details: e });
        }
    }


    const setVoid = (irecord, logrecodId, recordlogid, estado) => {
        try {
            const estado = 'No hay registros';
            const report = 'Proceso finalizado';
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: estado } });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_report_log: report } });
        } catch (e) {
            log.error({ title: 'setVoid', details: e });
        }
    }


    const getPeriodName = (filterPostingPeriod) => {
        try {
            const perLookup = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: filterPostingPeriod,
                columns: ['periodname']
            });
            const period = perLookup.periodname;
            return period;
        } catch (e) {
            log.error({ title: 'getPeriodName', details: e });
        }
    }


    const retornaPeriodoStringForView = (campoRegistro01) => {
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
            //campoRegistro01 = valorAnio + valorMes + '30';
            var json = {
                valorAnio: valorAnio,
                valorMes: valorMes
            }
        }
        return json;
    }


    const func = (valorAnio, valorMes) => {
        // var date = new Date();
        var ultimoDia = new Date(valorAnio, valorMes, 0).getDate();
        var PeriodoCompleto = String(valorAnio) + String(valorMes) + String(ultimoDia)
        return PeriodoCompleto
    }

    const numberWithCommas = (x) => {
        x = x.toString();
        var pattern = /(-?\d+)(\d{3})/;
        while (pattern.test(x))
            x = x.replace(pattern, "$1,$2");
        return x;
    }


    return {
        execute: execute
    }
});