/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config","N/format"], (search, record, runtime, log, file, task, config,format) => {
    // Schedule Report: PE - Anual: Inv. Balance - Detalle 20 - 3.7
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_detalle_30_3_7'; // PE - Libro de Inventario y Balances - Detalle del Saldo de la Cuenta 20 - 3.7
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
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_7_invbal_sub' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_7_invbal_per' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_7_invbal_for' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_7_invbal_fol' });
            const filterAnioPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_7_invbal_year' });
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

    const createRecord = (logrecodId, featureSubsidiary, filterSubsidiary, filterPostingPeriod) => {
        try {
            const recordlog = record.create({ type: logrecodId });
            if (featureSubsidiary) {
                recordlog.setValue({ fieldId: 'custrecord_pe_subsidiary_log', value: filterSubsidiary });
            }
            var periodId = getPeriodId(filterPostingPeriod);
            recordlog.setValue({ fieldId: 'custrecord_pe_period_log', value: periodId });
            recordlog.setValue({ fieldId: 'custrecord_pe_status_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_report_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Inventario y Balance 3.7' });
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


            if (searchResultCount != 0) {
                if (searchResultCount <= 4000) {
                    searchLoad.run().each((result) => {

                        let column01 = result.getValue(searchLoad.columns[0]);
                        //column01 = column01.split('/');
                        //const PeriodoCompleto = func(column01[0], column01[1]);
                        let column02 = result.getValue(searchLoad.columns[1]);
                        if (column02 == '- None -' || column02 != '1' || column02 != '3') {
                            column02 = '9'
                        }
                        let column03 = result.getValue(searchLoad.columns[2]);
                        if (column03 == '- None -') {
                            column03 = '99'
                        }
                        let column04 = result.getValue(searchLoad.columns[3]);
                        if (column04 == '- None -') {
                            column04 = ''
                        }
                        let column05 = result.getValue(searchLoad.columns[4]);
                        if (column05 == '- None -') {
                            column05 = ''
                        }
                        let column06 = result.getValue(searchLoad.columns[5]);
                        if (column06 == '- None -') {
                            column06 = ''
                        }
                        let column07 = result.getValue(searchLoad.columns[6]);
                        if (column07 == '- None -') {
                            column07 = ''
                        }
                        column07 = column07.replace(/(\r\n|\n|\r)/gm, "");
                        column07 = column07.replace(/[\/\\|]/g, "");
                        let column08 = result.getValue(searchLoad.columns[7]);
                        if (column08 == '- None -') {
                            column08 = 'VACIO'
                        }
                        let column09 = result.getValue(searchLoad.columns[8]);
                        if (column09 == '- None -') {
                            column09 = '9'
                        }
                        let column10 = result.getValue(searchLoad.columns[9]);
                        column10 = parseFloat(column10).toFixed(8);

                        let column11 = result.getValue(searchLoad.columns[10]);
                        column11 = parseFloat(column11).toFixed(8);

                        let column12 = result.getValue(searchLoad.columns[11]);
                        column12 = parseFloat(column12).toFixed(8);

                        const column13 = result.getValue(searchLoad.columns[12]);
                        let column14 = result.getValue(searchLoad.columns[13]);
                        column14 = column14.replace(/(\r\n|\n|\r)/gm, "");
                        column14 = column14.replace(/[\/\\|]/g, "");
                        let column15 = result.getValue(searchLoad.columns[14]);
                        if (column15 == anioperiod) {
                            json.push({
                                c1_periodo: column01,
                                c2_cod_catalogo: column02,
                                c3_tipo_existencia: column03,
                                c4_cod_propio_existencia: column04,
                                c5_cod_catalogo_utilizado: column05,
                                c6_cod_existencia_campo5: column06,
                                c7_desc_existencia: column07,
                                c8_cod_unid_meddida_existencia: column08,
                                c9_cod_metod_valuacion_utilizado: column09,
                                c10_cant_existencia: column10,
                                c11_costo_unitario_existencia: column11,
                                c12_costo_total: column12,
                                c13_estado_op: column13,
                                c14_cuenta_contable: column14
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
                            const column02 = searchResult[j].getValue(searchLoad.columns[1]);
                            const column03 = searchResult[j].getValue(searchLoad.columns[2]);
                            let column04 = searchResult[j].getValue(searchLoad.columns[3]);
                            if (column04 == '- None -') {
                                column04 = ''
                            }
                            let column05 = searchResult[j].getValue(searchLoad.columns[4]);
                            if (column05 == '- None -') {
                                column05 = ''
                            }
                            let column06 = searchResult[j].getValue(searchLoad.columns[5]);
                            if (column06 == '- None -') {
                                column06 = ''
                            }
                            let column07 = searchResult[j].getValue(searchLoad.columns[6]);
                            if (column07 == '- None -') {
                                column07 = ''
                            }
                            column07 = column07.replace(/(\r\n|\n|\r)/gm, "");
                            column07 = column07.replace(/[\/\\|]/g, "");
                            const column08 = searchResult[j].getValue(searchLoad.columns[7]);
                            const column09 = searchResult[j].getValue(searchLoad.columns[8]);
                            let column10 = searchResult[j].getValue(searchLoad.columns[9]);
                            column10 = parseFloat(column10).toFixed(8);
                            let column11 = searchResult[j].getValue(searchLoad.columns[10]);
                            column11 = parseFloat(column11).toFixed(8);
                            let column12 = searchResult[j].getValue(searchLoad.columns[11]);
                            column12 = parseFloat(column12).toFixed(8);
                            const column13 = searchResult[j].getValue(searchLoad.columns[12]);
                            let column14 = searchResult[j].getValue(searchLoad.columns[13]);
                            column14 = column14.replace(/(\r\n|\n|\r)/gm, "");
                            column14 = column14.replace(/[\/\\|]/g, "");
                            let column15 = searchResult[j].getValue(searchLoad.columns[14]);

                            if (column15 == anioperiod) {
                                json.push({
                                    c1_periodo: column01,
                                    c2_cod_catalogo: column02,
                                    c3_tipo_existencia: column03,
                                    c4_cod_propio_existencia: column04,
                                    c5_cod_catalogo_utilizado: column05,
                                    c6_cod_existencia_campo5: column06,
                                    c7_desc_existencia: column07,
                                    c8_cod_unid_meddida_existencia: column08,
                                    c9_cod_metod_valuacion_utilizado: column09,
                                    c10_cant_existencia: column10,
                                    c11_costo_unitario_existencia: column11,
                                    c12_costo_total: column12,
                                    c13_estado_op: column13,
                                    c14_cuenta_contable: column14
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
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cod_catalogo + '|' + searchResult[i].c3_tipo_existencia + '|' +
                    searchResult[i].c4_cod_propio_existencia + '|' + searchResult[i].c5_cod_catalogo_utilizado + '|' + searchResult[i].c6_cod_existencia_campo5 + '|' +
                    searchResult[i].c7_desc_existencia + '|' + searchResult[i].c8_cod_unid_meddida_existencia + '|' + searchResult[i].c9_cod_metod_valuacion_utilizado + '|' +
                    searchResult[i].c10_cant_existencia + '|' + searchResult[i].c11_costo_unitario_existencia + '|' + searchResult[i].c12_costo_total + '|' +
                    searchResult[i].c13_estado_op + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId, filterAnioPeriod) => {
        let typeformat;
        const header = '1 Periodo|2 Codigo de Catalogo|3 Tipo de Existencia|4 Codigo Propio de la Existencia|5 Codigo del catalogo utilizado|6 Codigo de Existencia correspondiente al catalogo señalado en el campo 5.|' +
            '7 Descripcion de la existencia|8 Codigo de la Unidad de medida de la existencia|9 Codigo del método de valuación utilizado|10 Cantidad de la existencia|11 Costo unitario de la existencia|' +
            '12 Costo total|13 Indica el estado de la operacion|\n';
        try {

            let periodname = filterAnioPeriod;
            let nameReportGenerated = 'LE' + fedIdNumb + periodname + '1231030700' + '07' + '1' + hasinfo + '11_' + recordlogid;
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
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_file_cabinet_log: fileAux.url } });
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