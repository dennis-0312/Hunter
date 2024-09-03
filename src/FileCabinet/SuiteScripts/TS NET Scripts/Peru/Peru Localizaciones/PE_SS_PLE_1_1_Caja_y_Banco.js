/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Schedule Report: PE - Libro Caja y Bancos - Detalle de los Movimientos del Efectivo
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_detalle_de_cyb_1_1';
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
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_1_caja_y_banco_su' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_1_caja_y_banco_pe' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_1_caja_y_banco_fo' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_1_1_caja_y_banco_id' });

            log.debug('PERIODO', filterPostingPeriod);
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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Caja y Banco 1.1' });
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
        let dateFormat = 'DD/MM/YYYY';
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
                        let column06 = result.getValue(searchLoad.columns[5]);                  

                    if (column06 != "- None -") {                                  
                      let filters = [search.createFilter({ name: "name", operator: search.Operator.CONTAINS, values: column06 })];
                      let columns = [search.createColumn({ name: "internalid" })];
            
                      let mysearch = search.create({
                        type: "department",
                        filters: filters,
                        columns: columns,
                      });
                      var searchResults = mysearch.run();
                      var firstResult = searchResults.getRange({ start: 0, end: 1 })[0];

                      let internalId = firstResult.getValue({ name: "internalid" });
                      column06 = internalId;

                    } else {
                      // log.debug({ title: 'firstResult', details: firstResult });
                      column06 = "0";
                    }

                        const column07 = result.getValue(searchLoad.columns[6]);
                        const column08 = result.getValue(searchLoad.columns[7]);
                        let column09 = result.getValue(searchLoad.columns[8]);
                        const column10 = result.getValue(searchLoad.columns[9]);
                        let column11 = result.getValue(searchLoad.columns[10]);
                        if (column11 != '- None -') {
                          column11 = convertDateFormat(column11);
                        }                         
                    
                        let column12 = result.getValue(searchLoad.columns[11]);
                        if (column12 == '- None -') {
                            column12 = ''
                        }
                    
                        let column13 = result.getValue(searchLoad.columns[12]);
                        // if (column13 != '- None -') {
                        //   const formattedDate13 = format.format({
                        //     value:  new Date(column13),
                        //     type: format.Type.DATE,
                        //     format: dateFormat
                        //   });
                        //   column13 = formattedDate13;
                        // }                    
                        const column14 = result.getValue(searchLoad.columns[13]);
                        let column15 = result.getValue(searchLoad.columns[14]);
                        if (column15 == '- None -') {
                            column15 = ''
                        } 
                        let column16 = result.getValue(searchLoad.columns[15]);
                        column16 = parseFloat(column16).toFixed(2);
                        let column17 = result.getValue(searchLoad.columns[16]);
                        column17 = parseFloat(column17).toFixed(2);
                        var column18 = result.getValue(searchLoad.columns[17]);
                        const column18_2 = result.getValue(searchLoad.columns[18]);
                        const column18_3 = result.getValue(searchLoad.columns[19]);

                        if (column18 != '- None -' && column18_2 != '- None -' && column18_3 != '- None -') {
                            column18 = column18 + '&' + column18_2 + '&' + column18_3;

                        } else {
                            column18 = '';
                        }
                        var column19 = result.getValue(searchLoad.columns[20]);
                        var periodoEmision = formatDate(column13)['anio'] + formatDate(column13)['mes'] + '00';
                        if(column01 == periodoEmision) {
                            column19 = '1';
                        } else {
                            column19 = '8';
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
                            c15_estado_op: column15,
                            c16_movimiento_debe: column16,
                            c17_suma_haber: column17,
                            c18_dato_estructurado: column18,
                            c19_indica_estado: column19
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
                            const column09 = searchResult[j].getValue(searchLoad.columns[8]);
                            const column10 = searchResult[j].getValue(searchLoad.columns[9]);
                            let column11 = searchResult[j].getValue(searchLoad.columns[10]);
                            if (column11 != '- None -') {
                              column11 = convertDateFormat(column11);
                            }   

                            let column12 = searchResult[j].getValue(searchLoad.columns[11]);
                            if (column12 = '- None -') {
                                column12 = ''
                            }
                            const column13 = searchResult[j].getValue(searchLoad.columns[12]);
                            const column14 = searchResult[j].getValue(searchLoad.columns[13]);
                            let column15 = searchResult[j].getValue(searchLoad.columns[14]);
                            if (column15 = '- None -') {
                                column15 = ''
                            }
                            let column16 = searchResult[j].getValue(searchLoad.columns[15]);
                            if (column16 == '' || column16 == ' ') {
                                column16 = '0.00'
                            }
                            let column17 = searchResult[j].getValue(searchLoad.columns[16]);
                            column17 = parseFloat(column17).toFixed(2);
                            var column18 = searchResult[j].getValue(searchLoad.columns[17]);
                            const column18_2 = searchResult[j].getValue(searchLoad.columns[18]);
                            const column18_3 = searchResult[j].getValue(searchLoad.columns[19]);

                            if (column18 != '- None -' && column18_2 != '- None -' && column18_3 != '- None -') {
                                column18 = column18 + '&' + column18_2 + '&' + column18_3;

                            } else {
                                column18 = '';
                            }
                            var column19 = searchResult[j].getValue(searchLoad.columns[20]);
                            var periodoEmision = formatDate(column13)['anio'] + formatDate(column13)['mes'] + '00';
                            if(column01 == periodoEmision) {
                                column19 = '1';
                            } else {
                                column19 = '8';
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
                                c15_estado_op: column15,
                                c16_movimiento_debe: column16,
                                c17_suma_haber: column17,
                                c18_dato_estructurado: column18,
                                c19_indica_estado: column19
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
                    searchResult[i].c7_medio_de_pago + '|' + searchResult[i].c8_descripcion + '|' + searchResult[i].c9_tipo_doc_beneficiario + '|' +
                    searchResult[i].c10_nro_doc + '|' + searchResult[i].c11_nombre_ruc + '|' + searchResult[i].c12_nro_tran_banciaria + '|' +
                    searchResult[i].c13_debito + '|' + searchResult[i].c14_credito + '|' + searchResult[i].c15_estado_op + '|' + searchResult[i].c16_movimiento_debe
                    + '|' + searchResult[i].c17_suma_haber + '|' + searchResult[i].c18_dato_estructurado + '|' + searchResult[i].c19_indica_estado + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        const header = '1 Periodo|2 Cuo|3 correlativo |4 codigo de idenetidad|5 codigo cuenta bancaria|6 fecha|\n';
        try {
			
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
            // const periodname = getPeriodName(filterPostingPeriod);
            // const periodostring = retornaPeriodoString(periodname);
			
            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '010100' + '00' + '1' + hasinfo + '11_' + recordlogid;
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
  
    function convertDateFormat(dateString) {
      // Split the date into parts using "/"
      const parts = dateString.split('/');
    
      // Get the day, month, and year
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
    
      // Add leading zeros if needed
      const formattedDay = day.length === 1 ? '0' + day : day;
      const formattedMonth = month.length === 1 ? '0' + month : month;
    
      // Create the new date in the desired format
      const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
    
      return formattedDate;
    }

    return {
        execute: execute
    }
});