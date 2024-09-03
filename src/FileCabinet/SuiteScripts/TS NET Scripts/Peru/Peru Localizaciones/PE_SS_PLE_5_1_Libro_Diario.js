/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Schedule Report: Mensual: Libro Mayor 5.1
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_libro_diario_5_1'; // PE - Libro Diario 5.1
            var logrecodId = 'customrecord_pe_generation_logs';
            let fedIdNumb = '';
            let hasinfo = 0;

            const params = getParams();
            log.debug('Params', params);
            if (featureSubsidiary) {
                const getruc = getRUC(params.filterSubsidiary)
                fedIdNumb = getruc;
            } else {
                const employerid = getEmployerID();
                fedIdNumb = employerid;
            }
            var createrecord = createRecord(logrecodId, featureSubsidiary, params.filterSubsidiary, params.filterPostingPeriod);
            const searchbook = searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary);

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
            setError(createrecord.irecord, logrecodId, createrecord.recordlogid, e);
            log.error({ title: 'ErrorInExecute', details: e });

        }
    }


    const getParams = () => {
        try {
            const scriptObj = runtime.getCurrentScript();
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_1_diario_sub' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_1_diario_per' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_1_diario_for' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_1_diario_fol' });
            // let ini_var =  scriptObj.getParameter({ name: 'custscript_pe_ini_ple_cyb_1_2' });
            // ini_var = parseInt(ini_var)

            return {
                filterSubsidiary: filterSubsidiary,
                filterPostingPeriod: filterPostingPeriod,
                filterFormat: filterFormat,
                fileCabinetId: fileCabinetId
                // ini_var: ini_var
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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Libro Mayor 5.1' });
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
        let flag = ''
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
            //log.debug('Count', searchResultCount)
            if (searchResultCount != 0) {
                if (searchResultCount <= 4000) {
                    searchLoad.run().each((result) => {
                        let arreglo = new Array();
                        const column01 = result.getValue(searchLoad.columns[0]);
                        const column02 = result.getValue(searchLoad.columns[1]);
                        const column03 = result.getValue(searchLoad.columns[2]);
                        const column04 = result.getValue(searchLoad.columns[3]);
                        const column05 = result.getValue(searchLoad.columns[4]);
                        const column06 = result.getValue(searchLoad.columns[5]);
                        const column07 = result.getValue(searchLoad.columns[6]);
                        let column08 = result.getValue(searchLoad.columns[7]);
                        if (column08 == '00') {
                            column08 = ''
                        }
                        const column09 = result.getValue(searchLoad.columns[8]);
                        const column10 = result.getValue(searchLoad.columns[9]);
                        const column11 = result.getValue(searchLoad.columns[10]);
                        const column12 = result.getValue(searchLoad.columns[11]);
                        const column13 = result.getValue(searchLoad.columns[12]);
                        const column14 = result.getValue(searchLoad.columns[13]);
                        const column15 = result.getValue(searchLoad.columns[14]);
                        let column16 = result.getValue(searchLoad.columns[15]);
                        column16 = column16.replace(/(\r\n|\n|\r)/gm, "");
                        column16 = column16.replace(/[\/\\|]/g, "");
                        const column17 = result.getValue(searchLoad.columns[16]);
                        let column18 = result.getValue(searchLoad.columns[17]);
                        column18 = parseFloat(column18).toFixed(2);
                        if (column18 <= 0) {
                            column18 = '0.00';
                        }
                        let column19 = result.getValue(searchLoad.columns[18]);
                        column19 = parseFloat(column19).toFixed(2);
                        if (column19 <= 0) {
                            column19 = '0.00';
                        }
                        var column20 = result.getValue(searchLoad.columns[19]);
                        const column20_1 = result.getValue(searchLoad.columns[20]);
                        const column20_2 = result.getValue(searchLoad.columns[21]);
                        const column20_3 = result.getValue(searchLoad.columns[22]);

                        if (column20 != '' && column20_1 != '' && column20_2 != '' && column20_3 != '') {
                            column20 = column20 + '&' + column20_1 + '&' + column20_2 + '&' + column20_3;
                            // arreglo.push(column20_1, column20_2, column20_3);
                            // for (let i = 0; i < arreglo.length; i++) {
                            //     column20 += '&' + arreglo[i];
                            // }
                        } else {
                            column20 = '';
                        }

                        var column21 = result.getValue(searchLoad.columns[23]);
                        var periodoEmision = formatDate(column15)['anio'] + formatDate(column15)['mes'] + '00';
                        if(column01 == periodoEmision) {
                           column21 = '1';
                        } else {
                           column21 = '8';
                        }
                        // const column22 = result.getValue(searchLoad.columns[25]);
                        // const column22 = result.getValue(searchLoad.columns[26]);
                        // const column23 = result.getValue(searchLoad.columns[27]);
                        // const column24 = result.getValue(searchLoad.columns[28]);
                        // const column25 = result.getValue(searchLoad.columns[29]);

                        json.push({
                            c1_periodo: column01,
                            c2_cuo: column02,
                            c3_nro_correlativo_asiento: column03,
                            c4_cod_cuenta_contable: column04,
                            c5_cod_unidad_op: column05,
                            c6_centro_costo: column06,
                            c7_tipo_moneda: column07,
                            c8_tipo_doc_entidad_emi: column08,
                            c9_nro_doc_entidad_emi: column09,
                            c10_tipo_comprobante: column10,
                            c11_nro_serie_comprobante: column11,
                            c12_nro_comprobante_pago: column12,
                            c13_fecha_contable: column13,
                            c14_fecha_vencimiento: column14,
                            c15_fecha_op_emision: column15,
                            c16_glosa_des_natu_op_reg: column16,
                            c17_glosa_ref_caso: column17,
                            c18_mov_debe: column18,
                            c19_mov_haber: column19,
                            c20_cod_libro: column20,
                            c21_20_1_campo1: column21
                            // c22_20_2_campo2: column22,
                            // c23_20_3_campo3: column23,
                            // c24_account: column24,
                            // c25_21_estado_op: column25
                        });
                        return true;
                    });

                    //log.debug('Json', json);
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
                            let arreglo = new Array();
                            const column01 = searchResult[j].getValue(searchLoad.columns[0]);
                            const column02 = searchResult[j].getValue(searchLoad.columns[1]);
                            const column03 = searchResult[j].getValue(searchLoad.columns[2]);
                            const column04 = searchResult[j].getValue(searchLoad.columns[3]);
                            const column05 = searchResult[j].getValue(searchLoad.columns[4]);
                            const column06 = searchResult[j].getValue(searchLoad.columns[5]);
                            const column07 = searchResult[j].getValue(searchLoad.columns[6]);
                            const column08 = searchResult[j].getValue(searchLoad.columns[7]);
                            const column09 = searchResult[j].getValue(searchLoad.columns[8]);
                            const column10 = searchResult[j].getValue(searchLoad.columns[9]);
                            const column11 = searchResult[j].getValue(searchLoad.columns[10]);
                            const column12 = searchResult[j].getValue(searchLoad.columns[11]);
                            const column13 = searchResult[j].getValue(searchLoad.columns[12]);
                            const column14 = searchResult[j].getValue(searchLoad.columns[13]);
                            const column15 = searchResult[j].getValue(searchLoad.columns[14]);
                            let column16 = searchResult[j].getValue(searchLoad.columns[15]);
                            column16 = column16.replace(/(\r\n|\n|\r)/gm, "");
                            column16 = column16.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
                            const column17 = searchResult[j].getValue(searchLoad.columns[16]);
                            let column18 = searchResult[j].getValue(searchLoad.columns[17]);
                            column18 = parseFloat(column18).toFixed(2);
                            if (column18 <= 0) {
                                column18 = '0.00';
                            }
                            let column19 = searchResult[j].getValue(searchLoad.columns[18]);
                            column19 = parseFloat(column19).toFixed(2);
                            if (column19 <= 0) {
                                column19 = '0.00';
                            }
                            var column20 = searchResult[j].getValue(searchLoad.columns[19]);
                            const column20_1 = searchResult[j].getValue(searchLoad.columns[20]);
                            const column20_2 = searchResult[j].getValue(searchLoad.columns[21]);
                            const column20_3 = searchResult[j].getValue(searchLoad.columns[22]);

                            if (column20 != '' && column20_1 != '' && column20_2 != '' && column20_3 != '') {
                                column20 = column20 + '&' + column20_1 + '&' + column20_2 + '&' + column20_3;

                            } else {
                                column20 = '';
                            }

                            var column21 = searchResult[j].getValue(searchLoad.columns[23]);
                            var periodoEmision = formatDate(column15)['anio'] + formatDate(column15)['mes'] + '00';
                            if(column01 == periodoEmision) {
                               column21 = '1';
                            } else {
                               column21 = '8';
                            }
                            // const column22 = result.getValue(searchLoad.columns[25]);
                            // const column22 = result.getValue(searchLoad.columns[26]);
                            // const column23 = result.getValue(searchLoad.columns[27]);
                            // const column24 = result.getValue(searchLoad.columns[28]);
                            // const column25 = result.getValue(searchLoad.columns[29]);

                            json.push({
                                c1_periodo: column01,
                                c2_cuo: column02,
                                c3_nro_correlativo_asiento: column03,
                                c4_cod_cuenta_contable: column04,
                                c5_cod_unidad_op: column05,
                                c6_centro_costo: column06,
                                c7_tipo_moneda: column07,
                                c8_tipo_doc_entidad_emi: column08,
                                c9_nro_doc_entidad_emi: column09,
                                c10_tipo_comprobante: column10,
                                c11_nro_serie_comprobante: column11,
                                c12_nro_comprobante_pago: column12,
                                c13_fecha_contable: column13,
                                c14_fecha_vencimiento: column14,
                                c15_fecha_op_emision: column15,
                                c16_glosa_des_natu_op_reg: column16,
                                c17_glosa_ref_caso: column17,
                                c18_mov_debe: column18,
                                c19_mov_haber: column19,
                                c20_cod_libro: column20,
                                c21_20_1_campo1: column21
                                // c22_20_2_campo2: column22,
                                // c23_20_3_campo3: column23,
                                // c24_account: column24,
                                // c25_21_estado_op: column25
                            });
                        }
                        start = start + 1000;
                        end = end + 1000;
                    }
                    return { thereisinfo: 1, content: json };
                }
            } else {
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
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cuo + '|' + searchResult[i].c3_nro_correlativo_asiento + '|' +
                    searchResult[i].c4_cod_cuenta_contable + '|' + searchResult[i].c5_cod_unidad_op + '|' + searchResult[i].c6_centro_costo + '|' +
                    searchResult[i].c7_tipo_moneda + '|' + searchResult[i].c8_tipo_doc_entidad_emi + '|' + searchResult[i].c9_nro_doc_entidad_emi + '|' +
                    searchResult[i].c10_tipo_comprobante + '|' + searchResult[i].c11_nro_serie_comprobante + '|' + searchResult[i].c12_nro_comprobante_pago + '|' +
                    searchResult[i].c13_fecha_contable + '|' + searchResult[i].c14_fecha_vencimiento + '|' + searchResult[i].c15_fecha_op_emision + '|' +
                    searchResult[i].c16_glosa_des_natu_op_reg + '|' + searchResult[i].c17_glosa_ref_caso + '|' + searchResult[i].c18_mov_debe + '|' +
                    searchResult[i].c19_mov_haber + '|' + searchResult[i].c20_cod_libro + '|' + searchResult[i].c21_20_1_campo1 + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }
    function CompletarCero(tamano, valor) {
        var strValor = valor + '';
        var lengthStrValor = strValor.length;
        var nuevoValor = valor + '';

        if (lengthStrValor <= tamano) {
            if (tamano != lengthStrValor) {
                for (var i = lengthStrValor; i < tamano; i++){
                    nuevoValor = '0' + nuevoValor;
                }
            }
            return nuevoValor;
        } else {
            return nuevoValor.substring(0,tamano);
        }
    }
    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        const header = '1 Periodo|2 CUO|3 Numero correlativo del asiento|4 Codigo de la cuenta contable|5 Codigo de Unidad de Operacion|6 Centro de Costo|7 Tipo de Moneda de Origen|8 Tipo de documento de identidad del emisor' +
            '|9 Numero de documento de identidad del emisor|10 Tipo de Comprobante|11 Numero de Serie del comprobante de Pago|12 Numero de compronbante de pago|13 Fecha Contable|14 Fecha de Vencimiento|15 Fecha de la operacion o emision|Glosa referencial' +
            '|16 Glosa o descripcion de la naturaleza de la operacion registrada de ser el caso|17 Glosa referencial, de ser el caso|18 Movimientos del Debe|19 Movimiento del Haber|20 Cod Libro|20.1 Campo 1|20.2 Campo 2|20.3 Campo 3|Account|21 Indica el estado de la operacion|\n';;
        try {
            //const periodname = getPeriodName(filterPostingPeriod);
            //const periodostring = retornaPeriodoString(periodname);
            var perLookup = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: filterPostingPeriod,
                columns: ['periodname','startdate']
            });
            
            var periodoFinDate = format.parse({
               type: format.Type.DATE,
               value: perLookup.startdate
           });
            
           const periodostring  = periodoFinDate.getFullYear() + CompletarCero(2,periodoFinDate.getMonth() + 1) + '00';


            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '050100' + '00' + '1' + hasinfo + '11_' + recordlogid;
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


    const setVoid = (irecord, logrecodId, recordlogid) => {
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


    const retornaPeriodoString = (campoRegistro01) => {
        if (campoRegistro01 >= '') {
            var valorAnio = campoRegistro01.split(' ')[1];
            var valorMes = campoRegistro01.split(' ')[0];
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
    }
});
