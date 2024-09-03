/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Mensual: LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE 1.2
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_detalle_de_cyb_1_2'; // PE - Libro Caja y Bancos - Detalle de los Movimientos de la Cuenta Corriente 1.2
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
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_2_caja_y_banco_su' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_2_caja_y_banco_pe' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_2_caja_y_banco_fo' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_2_caja_y_banco_id' });

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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Caja y Banco 1.2' });
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
                        const column09 = result.getValue(searchLoad.columns[8]);
                        const column10 = result.getValue(searchLoad.columns[9]);
                        const column11 = result.getValue(searchLoad.columns[10]);
                        const column12 = result.getValue(searchLoad.columns[11]);
                        let column13 = result.getValue(searchLoad.columns[12]);
                        column13 = parseFloat(column13).toFixed(2);
                        if (column13 == 'NaN') {
                            column13 = '0.00'
                        }
                        let column14 = result.getValue(searchLoad.columns[13]);
                        column14 = parseFloat(column14).toFixed(2);
                        if (column14 == 'NaN') {
                            column14 = '0.00'

                        }
                        var column15 = result.getValue(searchLoad.columns[14]);
                        var periodoEmision = formatDate(column06)['anio'] + formatDate(column06)['mes'] + '00';
                        if(column01 == periodoEmision) {
                           column15 = '1';
                        } else {
                           column15 = '1';
                        }

                        json.push({
                            c1_periodo: column01,
                            c2_cuo: column02,
                            c3_correlativo: column03,
                            c4_cod_entidad: column04,
                            c5_cod_cta_bancaria: column05,
                            c6_fecha_op: column06,
                            c7_medio_de_pago: column07,
                            c8_descripcion: column08,
                            c9_tipo_doc_beneficiario: column09,
                            c10_nro_doc: column10,
                            c11_nombre_ruc: column11,
                            c12_nro_tran_banciaria: column12,
                            c13_debito: column13,
                            c14_credito: column14,
                            c15_estado_op: column15
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
                            const column07 = searchResult[j].getValue(searchLoad.columns[0]);
                            const column08 = searchResult[j].getValue(searchLoad.columns[1]);
                            const column10 = searchResult[j].getValue(searchLoad.columns[2]);
                            const column11 = searchResult[j].getValue(searchLoad.columns[3]);
                            const column12 = searchResult[j].getValue(searchLoad.columns[4]);
                            let column13 = searchResult[j].getValue(searchLoad.columns[5]);
                            column13 = parseFloat(column13).toFixed(2);
                            if (column13 == 'NaN') {
                                column13 = '0.00'
                            }
                            let column14 = searchResult[j].getValue(searchLoad.columns[0]);
                            column14 = parseFloat(column14).toFixed(2);
                            if (column14 == 'NaN') {
                                column14 = '0.00'

                            }
                            var column15 = searchResult[j].getValue(searchLoad.columns[1]);
                            var periodoEmision = formatDate(column06)['anio'] + formatDate(column06)['mes'] + '00';
                            if(column01 == periodoEmision) {
                               column15 = '1';
                            } else {
                               column15 = '8';
                            }

                            json.push({
                                c1_periodo: column01,
                                c2_cuo: column02,
                                c3_correlativo: column03,
                                c4_cod_entidad: column04,
                                c5_cod_cta_bancaria: column05,
                                c6_fecha_op: column06,
                                c7_medio_de_pago: column07,
                                c8_descripcion: column08,
                                c9_tipo_doc_beneficiario: column09,
                                c10_nro_doc: column10,
                                c11_nombre_ruc: column11,
                                c12_nro_tran_banciaria: column12,
                                c13_debito: column13,
                                c14_credito: column14,
                                c15_estado_op: column15
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
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cuo + '|' + searchResult[i].c3_correlativo + '|' +
                    searchResult[i].c4_cod_entidad + '|' + searchResult[i].c5_cod_cta_bancaria + '|' + searchResult[i].c6_fecha_op + '|' +
                    searchResult[i].c7_medio_de_pago + '|' + searchResult[i].c8_descripcion + '|' + searchResult[i].c9_tipo_doc_beneficiario + '|'+
                    searchResult[i].c10_nro_doc + '|' + searchResult[i].c11_nombre_ruc + '|' + searchResult[i].c12_nro_tran_banciaria + '|'+
                    searchResult[i].c13_debito + '|' + searchResult[i].c14_credito + '|' + searchResult[i].c15_estado_op +'|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        const header = '1 Periodo|2 Codigo de catálogo|3 Codigo de rubro|4 Saldo rubro|5 Estado de operacion|6 Campos Libres|\n';
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

            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '010200' + '00' + '1' + hasinfo + '11_' + recordlogid;
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
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_file_cabinet_log: fileAux.url} });
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