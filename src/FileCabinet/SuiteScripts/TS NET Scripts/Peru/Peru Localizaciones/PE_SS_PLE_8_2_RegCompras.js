/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Schedule Report: Mensual: Reg. de Compras 8.1/8.2
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_registro_de_compra_8_2';
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
            const searchbook = searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary);
            log.debug({ title: 'searchBook', details: searchbook });
            if (searchbook.thereisinfo == 1) {
                hasinfo = '1';
                const structuregbody = structureBody(searchbook.content);
                const createfile = createFile(params.filterPostingPeriod, fedIdNumb, hasinfo, createrecord.recordlogid, params.filterFormat, structuregbody, params.fileCabinetId);
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
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_82_sub' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_82_per' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_82_for' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_82_fol' });

            return {
                filterSubsidiary: filterSubsidiary,
                filterPostingPeriod: filterPostingPeriod,
                filterFormat: filterFormat,
                fileCabinetId: fileCabinetId
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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Registro de Compras 8.2' });
            const recordlogid = recordlog.save();

            return { recordlogid: recordlogid, irecord: record };
        } catch (e) {
            log.error({ title: 'createRecord', details: e });
        }
    }


    const searchBook = (subsidiary, period, searchId, featureSubsidiary) => {
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

            const filterOne = search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.ANYOF,
                values: period
            });

            filters.push(filterOne);

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
                        const column01 = result.getValue(searchLoad.columns[0]);
                        const column02 = result.getValue(searchLoad.columns[1]);
                        const column03 = result.getValue(searchLoad.columns[2]);
                        const column04 = result.getValue(searchLoad.columns[3]);
                        const column05 = result.getValue(searchLoad.columns[4]);
                        const column06 = result.getValue(searchLoad.columns[5]);
                        const column07 = result.getValue(searchLoad.columns[6]);
                        const column08 = result.getValue(searchLoad.columns[7]);
                        let column09 = result.getValue(searchLoad.columns[8]);
                        if (column09 == '.00') {
                            column09 = '0.00'
                        }
                        const column10 = result.getValue(searchLoad.columns[9]);
                        let column11 = result.getValue(searchLoad.columns[10]);
                        if (column11 == '- None -') {
                            column11 = ''
                        }
                        let column12 = result.getValue(searchLoad.columns[11]);
                        if (column12 == '- None -') {
                            column12 = ''
                        }
                        let column13 = result.getValue(searchLoad.columns[12]);
                        if (column13 == '- None -') {
                            column13 = ''
                        }
                        let column14 = result.getValue(searchLoad.columns[13]);
                        if (column14 == '- None -') {
                            column14 = ''
                        }
                        let column15 = result.getValue(searchLoad.columns[14]);
                        if (column15 == '.00') {
                            column15 = '0.00'
                        }
                        const column16 = result.getValue(searchLoad.columns[15]);
                        const column17 = result.getValue(searchLoad.columns[16]);
                        const column18 = result.getValue(searchLoad.columns[17]);
                        const column19 = result.getValue(searchLoad.columns[18]);
                        const column20 = result.getValue(searchLoad.columns[19]);
                        const column21 = result.getValue(searchLoad.columns[20]);
                        const column22 = result.getValue(searchLoad.columns[21]);
                        const column23 = result.getValue(searchLoad.columns[22]);
                        const column24 = result.getValue(searchLoad.columns[23]);
                        const column25 = result.getValue(searchLoad.columns[24]);
                        let column26 = result.getValue(searchLoad.columns[25]);
                        if (column26 == '.00') {
                            column26 = '0.00'
                        }
                        let column27 = result.getValue(searchLoad.columns[26]);
                        if (column27 == '.00') {
                            column27 = '0.00'
                        }
                        let column28 = result.getValue(searchLoad.columns[27]);
                        if (column28 == '.00') {
                            column28 = '0.00'
                        }
                        let column29 = result.getValue(searchLoad.columns[28]);
                        if (column29 != '') {
                            column29 = parseFloat(column29).toFixed(2);
                        }
                        let column30 = result.getValue(searchLoad.columns[29]);
                        if (column30 == '.00') {
                            column30 = '0.00'
                        }
                        if (column30 != '') {
                            column30 = parseFloat(column30).toFixed(2);
                        }
                        let column31 = result.getValue(searchLoad.columns[30]);
                        if (column31 == '- None -') {
                            column31 = ''
                        }
                        let column32 = result.getValue(searchLoad.columns[31]);
                        if (column32 == '- None -') {
                            column32 = ''
                        }
                        let column33 = result.getValue(searchLoad.columns[32]);
                        if (column33 == '- None -') {
                            column33 = ''
                        }
                        let column34 = result.getValue(searchLoad.columns[33]);
                        if (column34 == '- None -') {
                            column34 = ''
                        }
                        let column35 = result.getValue(searchLoad.columns[34]);
                        if (column35 == '- None -') {
                            column35 = ''
                        }
                        const column36 = result.getValue(searchLoad.columns[35]);
                        const column37 = result.getValue(searchLoad.columns[36]);
                        const column38 = result.getValue(searchLoad.columns[37]);
                        const column39 = result.getValue(searchLoad.columns[38]);

                        json.push({
                            c1_periodo: column01,
                            c2_cuo: column02,
                            c3_correlativo: column03,
                            c4_Fecha_de_emision: column04,
                            c5_tipo_comprobante: column05,
                            c6_serie_comprobante: column06,
                            c7_nro_comprobante: column07,
                            c8_valor_Adquisiciones: column08,
                            c9_otros_conceptos: column09,
                            c10_importe_total: column10,
                            c11_tipo_comprobante_credito: column11,
                            c12_serie_comp_Dua: column12,
                            c13_año_emision_dua: column13,
                            c14_nro_orden: column14,
                            c15_monto_retención: column15,
                            c16_cod_moneda: column16,
                            c17_tipo_Cambio: column17,
                            c18_pais_residencia: column18,
                            c19_apellidos_nombres: column19,
                            c20_domicilio_extranjero: column20,
                            c21_numero_ident: column21,
                            c22_numero_ident_fiscal: column22,
                            c23_apellidos_nombres_proveedor: column23,
                            c24_pais_residencia: column24,
                            c25_vicunlo: column25,
                            c26_renta_bruta: column26,
                            c27_Deduccion_costo: column27,
                            c28_renta_neta: column28,
                            c29_tasa_retención: column29,
                            c30_impuesto_retenido: column30,
                            c31_convenio: column31,
                            c32_exoneracion_aplicada: column32,
                            c33_tipo_renta: column33,
                            c34_modalidad_servicio: column34,
                            c35_aplicacion_penultimo: column35,
                            c36_estado_oportunidad: column36,
                            c37_periodo: column37,
                            c38_periodo_inicial: column38,
                            c39_periodo_final: column39
                        });
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
                            const column01 = searchResult[j].getValue(searchLoad.columns[0]);
                            const column02 = searchResult[j].getValue(searchLoad.columns[1]);
                            const column03 = searchResult[j].getValue(searchLoad.columns[2]);
                            const column04 = searchResult[j].getValue(searchLoad.columns[3]);
                            const column05 = searchResult[j].getValue(searchLoad.columns[4]);
                            const column06 = searchResult[j].getValue(searchLoad.columns[5]);
                            const column07 = searchResult[j].getValue(searchLoad.columns[6]);
                            const column08 = searchResult[j].getValue(searchLoad.columns[7]);
                            let column09 = searchResult[j].getValue(searchLoad.columns[8]);
                            if (column09 == '.00') {
                                column09 = '0.00'
                            }
                            const column10 = searchResult[j].getValue(searchLoad.columns[9]);
                            let column11 = searchResult[j].getValue(searchLoad.columns[10]);
                            if (column11 == '- None -') {
                                column11 = ''
                            }
                            let column12 = searchResult[j].getValue(searchLoad.columns[11]);
                            if (column12 == '- None -') {
                                column12 = ''
                            }
                            let column13 = searchResult[j].getValue(searchLoad.columns[12]);
                            if (column13 == '- None -') {
                                column13 = ''
                            }
                            let column14 = searchResult[j].getValue(searchLoad.columns[13]);
                            if (column14 == '- None -') {
                                column14 = ''
                            }
                            let column15 = searchResult[j].getValue(searchLoad.columns[14]);
                            if (column15 == '.00') {
                                column15 = '0.00'
                            }
                            const column16 = searchResult[j].getValue(searchLoad.columns[15]);
                            const column17 = searchResult[j].getValue(searchLoad.columns[16]);
                            const column18 = searchResult[j].getValue(searchLoad.columns[17]);
                            const column19 = searchResult[j].getValue(searchLoad.columns[18]);
                            const column20 = searchResult[j].getValue(searchLoad.columns[19]);
                            const column21 = searchResult[j].getValue(searchLoad.columns[20]);
                            const column22 = searchResult[j].getValue(searchLoad.columns[21]);
                            const column23 = searchResult[j].getValue(searchLoad.columns[22]);
                            const column24 = searchResult[j].getValue(searchLoad.columns[23]);
                            const column25 = searchResult[j].getValue(searchLoad.columns[24]);
                            const column26 = searchResult[j].getValue(searchLoad.columns[25]);
                            let column27 = searchResult[j].getValue(searchLoad.columns[26]);
                            if (column27 == '.00') {
                                column27 = '0.00'
                            }
                            const column28 = searchResult[j].getValue(searchLoad.columns[27]);
                            let column29 = searchResult[j].getValue(searchLoad.columns[28]);
                            column29 = parseFloat(column29).toFixed(2);
                            const column30 = searchResult[j].getValue(searchLoad.columns[29]);
                            const column31 = searchResult[j].getValue(searchLoad.columns[30]);
                            const column32 = searchResult[j].getValue(searchLoad.columns[31]);
                            const column33 = searchResult[j].getValue(searchLoad.columns[32]);
                            const column34 = searchResult[j].getValue(searchLoad.columns[33]);
                            const column35 = searchResult[j].getValue(searchLoad.columns[34]);
                            const column36 = searchResult[j].getValue(searchLoad.columns[35]);
                            const column37 = result[j].getValue(searchLoad.columns[36]);
                            const column38 = result[j].getValue(searchLoad.columns[37]);
                            const column39 = result[j].getValue(searchLoad.columns[38]);

                            json.push({
                                c1_periodo: column01,
                                c2_cuo: column02,
                                c3_correlativo: column03,
                                c4_Fecha_de_emision: column04,
                                c5_tipo_comprobante: column05,
                                c6_serie_comprobante: column06,
                                c7_nro_comprobante: column07,
                                c8_valor_Adquisiciones: column08,
                                c9_otros_conceptos: column09,
                                c10_importe_total: column10,
                                c11_tipo_comprobante_credito: column11,
                                c12_serie_comp_Dua: column12,
                                c13_año_emision_dua: column13,
                                c14_nro_orden: column14,
                                c15_monto_retención: column15,
                                c16_cod_moneda: column16,
                                c17_tipo_Cambio: column17,
                                c18_pais_residencia: column18,
                                c19_apellidos_nombres: column19,
                                c20_domicilio_extranjero: column20,
                                c21_numero_ident: column21,
                                c22_numero_ident_fiscal: column22,
                                c23_apellidos_nombres_proveedor: column23,
                                c24_pais_residencia: column24,
                                c25_vicunlo: column25,
                                c26_renta_bruta: column26,
                                c27_Deduccion_costo: column27,
                                c28_renta_neta: column28,
                                c29_tasa_retención: column29,
                                c30_impuesto_retenido: column30,
                                c31_convenio: column31,
                                c32_exoneracion_aplicada: column32,
                                c33_tipo_renta: column33,
                                c34_modalidad_servicio: column34,
                                c35_aplicacion_penultimo: column35,
                                c36_estado_oportunidad: column36,
                                c37_periodo: column37,
                                c38_perido_inicial: column38,
                                c39_perido_final: column39
                            });
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
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cuo + '|' + searchResult[i].c3_correlativo + '|' +
                    searchResult[i].c4_Fecha_de_emision + '|' + searchResult[i].c5_tipo_comprobante + '|' + searchResult[i].c6_serie_comprobante + '|' +
                    searchResult[i].c7_nro_comprobante + '|' + searchResult[i].c8_valor_Adquisiciones + '|' + searchResult[i].c9_otros_conceptos + '|' +
                    searchResult[i].c10_importe_total + '|' + searchResult[i].c11_tipo_comprobante_credito + '|' + searchResult[i].c12_serie_comp_Dua + '|' +
                    searchResult[i].c13_año_emision_dua + '|' + searchResult[i].c14_nro_orden + '|' + searchResult[i].c15_monto_retención + '|' + searchResult[i].c16_cod_moneda + '|' +
                    searchResult[i].c17_tipo_Cambio + '|' + searchResult[i].c18_pais_residencia + '|' + searchResult[i].c19_apellidos_nombres + '|' + searchResult[i].c20_domicilio_extranjero + '|' + searchResult[i].c21_numero_ident + '|' +
                    searchResult[i].c22_numero_ident_fiscal + '|' + searchResult[i].c23_apellidos_nombres_proveedor + '|' + searchResult[i].c24_pais_residencia + '|' +
                    searchResult[i].c25_vicunlo + '|' + searchResult[i].c26_renta_bruta + '|' + searchResult[i].c27_Deduccion_costo + '|' + searchResult[i].c28_renta_neta + '|' +
                    searchResult[i].c29_tasa_retención + '|' + searchResult[i].c30_impuesto_retenido + '|' + searchResult[i].c31_convenio + '|' + searchResult[i].c32_exoneracion_aplicada + '|' +
                    searchResult[i].c33_tipo_renta + '|' + searchResult[i].c34_modalidad_servicio + '|' + searchResult[i].c35_aplicacion_penultimo + '|' + searchResult[i].c36_estado_oportunidad + '|' + searchResult[i].c37_periodo + '|' + searchResult[i].c38_perido_inicial + '|' + searchResult[i].c39_perido_final + '|\n'; '|\n';
            }

            return contentReport;

        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        const header = custscript_pe_ss_ple_8_1_per_v2
            '\n';
        try {
            var perLookup = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: filterPostingPeriod,
                columns: ['periodname', 'startdate']
            });

            var periodoFinDate = format.parse({
                type: format.Type.DATE,
                value: perLookup.startdate
            });

            const periodostring = periodoFinDate.getFullYear() + CompletarCero(2, periodoFinDate.getMonth() + 1) + '00';


            //const periodname = getPeriodName(filterPostingPeriod);
            //const periodostring = retornaPeriodoString(periodname);
            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '080200' + '00' + '1' + hasinfo + '11_' + recordlogid;
            if (filterFormat == 'CSV') {
                nameReportGenerated = nameReportGenerated + '.csv';
                structuregbody = header + structuregbody;
                //structuregbody = structuregbody.replace(/[,]/gi, ' ');
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

    const retornaPeriodoString = (column01) => {
        if (column01 >= '') {
            var valorAnio = column01.split(' ')[1];
            var valorMes = column01.split(' ')[0];
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
            column01 = valorAnio + valorMes + '00';
        }
        return column01;
    }


    return {
        execute: execute
    }
});