/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config"], (search, record, runtime, log, file, task, config) => {
    // Schedule Report: PE - Libro Caja y Bancos - Detalle de los Movimientos del Efectivo
    const execute = async (context) => {
        try {
            const featureSubsidiary = await runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_detalle_10_3_2'; // PE - Libro de Inventario y Balances - Detalle del Saldo de la Cuenta 10 - 3.2
            var logrecodId = 'customrecord_pe_generation_logs';
            let fedIdNumb = '';
            let hasinfo = 0;

            const params = await getParams();

            if (featureSubsidiary) {
                const getruc = await getRUC(params.filterSubsidiary)
                fedIdNumb = getruc;
            } else {
                const employerid = await getEmployerID();
                fedIdNumb = employerid;
            }

            var createrecord = await createRecord(logrecodId, featureSubsidiary, params.filterSubsidiary, params.filterPostingPeriod);
            const searchbook = await searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary, params.filterAnioPeriod);

            if (searchbook.thereisinfo == 1) {
                hasinfo = '1';
                const structuregbody = await structureBody(searchbook.content);
                const createfile = await createFile(params.filterPostingPeriod, fedIdNumb, hasinfo, createrecord.recordlogid, params.filterFormat, structuregbody, params.fileCabinetId, params.filterAnioPeriod);
                const statusProcess = await setRecord(createrecord.irecord, createrecord.recordlogid, createfile, logrecodId);
                log.debug({ title: 'FinalResponse', details: 'Estado del proceso: ' + statusProcess + ' OK!!' });
            } else {
                setVoid(createrecord.irecord, logrecodId, createrecord.recordlogid);
                log.debug({ title: 'FinalResponse', details: 'No hay registros para la solicitud: ' + createrecord.recordlogid });
            }
        } catch (e) {
            log.error({ title: 'ErrorInExecute', details: e });
            await setError(createrecord.irecord, logrecodId, createrecord.recordlogid, e)
        }
    }


    const getParams = async () => {
        try {
            const scriptObj = await runtime.getCurrentScript();
            const filterSubsidiary = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_2_invbal_sub' });
            const filterPostingPeriod = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_2_invbal_per' });
            const filterFormat = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_2_invbal_for' });
            const fileCabinetId = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_2_invbal_fol' });
            const filterAnioPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_2_invbal_year' });
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


    const getRUC = async (filterSubsidiary) => {
        try {
            const subLookup = await search.lookupFields({
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


    const getEmployerID = async () => {
        const configpage = await config.load({ type: config.Type.COMPANY_INFORMATION });
        const employeeid = configpage.getValue('employerid');
        return employeeid;
    }


    const createRecord = async (logrecodId, featureSubsidiary, filterSubsidiary, filterPostingPeriod) => {
        try {
            const recordlog = record.create({ type: logrecodId });
            if (featureSubsidiary) {
                recordlog.setValue({ fieldId: 'custrecord_pe_subsidiary_log', value: filterSubsidiary });
            }
            recordlog.setValue({ fieldId: 'custrecord_pe_period_log', value: filterPostingPeriod });
            recordlog.setValue({ fieldId: 'custrecord_pe_status_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_report_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Inventario y Balance 3.2' });
            const recordlogid = recordlog.save();

            return { recordlogid: recordlogid, irecord: record };
        } catch (e) {
            log.error({ title: 'createRecord', details: e });
        }
    }


    const searchBook = async (subsidiary, period, searchId, featureSubsidiary, anioperiod) => {
        let json = new Array();
        var searchResult;
        let division = 0.0;
        let laps = 0.0;
        let start = 0;
        let end = 1000;
        try {
            /*const transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        [["memorized", "is", "F"], "AND", ["posting", "is", "T"], "AND", ["formulatext: CASE WHEN (NVL({debitamount},0)-NVL({creditamount},0))=0 THEN 1 ELSE 0 END", "is", "0"], "AND", ["accounttype", "anyof", "Bank"], "AND", ["formulanumeric: CASE WHEN substr({account.number},1,2) = '10' THEN 1 ELSE 0 END", "equalto", "1"], "AND", ["voided", "is", "F"]]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CONCAT(SUBSTR(TO_CHAR({trandate} , 'YYYYMMDD'),1,6),'00')",
                            label: "1 Período"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "{account.number}",
                            label: "2 Cód. Cuenta Contable"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "{account.custrecord_pe_bank_code}",
                            label: "3 Cód, Entidad Financiera"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "{account.custrecord_pe_bank_account}",
                            label: "4 Número de la cuenta de la Entidad Financiera"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "DECODE({currency}, 'Soles', 'PEN', 'US Dollar', 'USD')",
                            label: "5 Tipo de Moneda"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "{debitamount}",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            summary: "SUM",
                            formula: "{creditamount}",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "'1'",
                            label: "8 Indica el estado de la operación"
                        })
                    ]
            });*/

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
            // const periodname = getPeriodName(period);
            // const periodostring = retornaPeriodoStringForView(periodname);
            // const PeriodoCompleto = func(periodostring.valorAnio, periodostring.valorMes);

            if (searchResultCount != 0) {
                if (searchResultCount <= 4000) {
                    await searchLoad.run().each((result) => {
                        let column01 = result.getValue(searchLoad.columns[0]);
                        //column01 = column01.split('/');
                        //const PeriodoCompleto = func(column01[0], column01[1]);
                        const column02 = result.getValue(searchLoad.columns[1]);
                        let column03 = result.getValue(searchLoad.columns[2]);
                        if (column03 == '- None -') {
                            column03 = '99'
                        }
                        let column04 = result.getValue(searchLoad.columns[3]);
                        if (column04 == '- None -') {
                            column04 = '-'
                        }
                        const column05 = result.getValue(searchLoad.columns[4]);
                        if (column05 == '- None -') {
                            column05 = '-'
                        }
                        let column06 = result.getValue(searchLoad.columns[5]);
                        if (column06 == '') {
                            column06 = '0.00'
                        } else {
                            column06 = parseFloat(column06).toFixed(2);
                            //column06 = numberWithCommas(column06);
                        }
                        let column07 = result.getValue(searchLoad.columns[6]);
                        if (column07 == '') {
                            column07 = '0.00'
                        } else {
                            column07 = parseFloat(column07).toFixed(2);
                            //column07 = numberWithCommas(column07);
                        }
                        const column08 = result.getValue(searchLoad.columns[7]);
                        let column09 = result.getValue(searchLoad.columns[8]);

                        //montos excluyentes
                        if(column06 != '0.00' && column07 != '0.00'){
                            let diferencia = column06 - column07;
                            if(diferencia > 0){
                                column06 = parseFloat(diferencia).toFixed(2);
                                column07 = '0.00';
                            } else {
                                diferencia = diferencia * (-1);
                                column06 = '0.00';
                                column07 = parseFloat(diferencia).toFixed(2);
                            }
                        }

                        if (column09 == anioperiod) {
                            json.push({
                                c1_periodo: column01,
                                c2_cod_cuenta_contable: column02,
                                c3_cod_entidad_financiera: column03,
                                c4_nro_cuenta_entidad_financiera: column04,
                                c5_tipo_moneda: column05,
                                c6_saldo_deudor: column06,
                                c7_saldo_acreedor: column07,
                                c8_estado_op: column08
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
                            searchResult = await searchLoad.run().getRange({ start: start, end: end });
                        } else {
                            searchResult = await searchLoad.run().getRange({ start: start, end: searchResultCount });
                        }
                        for (let j in searchResult) {
                            let column01 = searchResult[j].getValue(searchLoad.columns[0]);
                            //column01 = column01.split('/');
                            //const PeriodoCompleto = func(column01[0], column01[1]);
                            const column02 = searchResult[j].getValue(searchLoad.columns[1]);
                            const column03 = searchResult[j].getValue(searchLoad.columns[2]);
                            let column04 = searchResult[j].getValue(searchLoad.columns[3]);
                            if (column04 == '- None -') {
                                column04 = '-'
                            }
                            const column05 = searchResult[j].getValue(searchLoad.columns[4]);

                            if (column05 == '- None -') {
                                column05 = '-'
                            }
                            let column06 = searchResult[j].getValue(searchLoad.columns[5]);
                            if (column06 == '') {
                                column06 = '0.00'
                            } else {
                                column06 = parseFloat(column06).toFixed(2);
                                //column06 = numberWithCommas(column06);
                            }
                            let column07 = searchResult[j].getValue(searchLoad.columns[6]);
                            if (column07 == '') {
                                column07 = '0.00'
                            } else {
                                column07 = parseFloat(column07).toFixed(2);
                                //column07 = numberWithCommas(column07);
                            }
                            const column08 = searchResult[j].getValue(searchLoad.columns[7]);
                            let column09 = searchResult[j].getValue(searchLoad.columns[8]);

                            //montos excluyentes
                            if(column06 != '0.00' && column07 != '0.00'){
                                let diferencia = column06 - column07;
                                if(diferencia > 0){
                                    column06 = parseFloat(diferencia).toFixed(2);
                                    column07 = '0.00';
                                } else {
                                    diferencia = diferencia * (-1);
                                    column06 = '0.00';
                                    column07 = parseFloat(diferencia).toFixed(2);
                                }
                            }

                            if (column09 == anioperiod) {
                                json.push({
                                    c1_periodo: column01,
                                    c2_cod_cuenta_contable: column02,
                                    c3_cod_entidad_financiera: column03,
                                    c4_nro_cuenta_entidad_financiera: column04,
                                    c5_tipo_moneda: column05,
                                    c6_saldo_deudor: column06,
                                    c7_saldo_acreedor: column07,
                                    c8_estado_op: column08
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


    const structureBody = async (searchResult) => {
        let contentReport = '';
        try {
            for (let i in searchResult) {
                contentReport =
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cod_cuenta_contable + '|' + searchResult[i].c3_cod_entidad_financiera + '|' +
                    searchResult[i].c4_nro_cuenta_entidad_financiera + '|' + searchResult[i].c5_tipo_moneda + '|' + searchResult[i].c6_saldo_deudor + '|' +
                    searchResult[i].c7_saldo_acreedor + '|' + searchResult[i].c8_estado_op + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = async (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId, filterAnioPeriod) => {
        let typeformat;
        const header = '1 Periodo|2 Cod. Cuenta Contable|3 Cod, Entidad Financiera|4 Numero de la cuenta de la Entidad Financiera|5 Tipo de Moneda|6 Saldo Deudor|7 Saldo Acreedor|8 Indica el estado de la operacion|\n';
        try {
            let periodname = filterAnioPeriod;
            let nameReportGenerated = 'LE' + fedIdNumb + periodname + '1231030200' + '07' + '1' + hasinfo + '11_' + recordlogid;
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


    const setRecord = async (irecord, recordlogid, fileid, logrecodId) => {
        try {
            const fileAux = file.load({ id: fileid });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_file_cabinet_log: fileAux.url } });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: 'Generated' } });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_report_log: fileAux.name } });
            return recordlogid;
        } catch (e) {
            log.error({ title: 'setRecord', details: e });
        }
    }


    const setError = async (irecord, logrecodId, recordlogid, error) => {
        try {
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: 'ERROR: ' + error } });
        } catch (e) {
            log.error({ title: 'setError', details: e });
        }
    }


    const setVoid = async (irecord, logrecodId, recordlogid, estado) => {
        try {
            const estado = 'No hay registros';
            const report = 'Proceso finalizado';
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_status_log: estado } });
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_report_log: report } });
        } catch (e) {
            log.error({ title: 'setVoid', details: e });
        }
    }


    // const getPeriodName = (filterPostingPeriod) => {
    //     try {
    //         const perLookup = search.lookupFields({
    //             type: search.Type.ACCOUNTING_PERIOD,
    //             id: filterPostingPeriod,
    //             columns: ['periodname']
    //         });
    //         const period = perLookup.periodname;
    //         log.debug('PERIOD', period);
    //         return period;
    //     } catch (e) {
    //         log.error({ title: 'getPeriodName', details: e });
    //     }
    // }


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