/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Schedule Report: Registro del inventario permanente -detalle del inventario permanente - 12.1
    const execute = async (context) => {
        try {
            const featureSubsidiary = await runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_ripv_2'; // PE - Registro del Inventario Permanente en Unidades Físicas- 12.1
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
            const searchbook = await searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary);

            if (searchbook.thereisinfo == 1) {
                hasinfo = '1';
                const structuregbody = await structureBody(searchbook.content);
                const createfile = await createFile(params.filterPostingPeriod, fedIdNumb, hasinfo, createrecord.recordlogid, params.filterFormat, structuregbody, params.fileCabinetId);
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
            const filterSubsidiary = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_12_1_lib_in_perm_su' });
            const filterPostingPeriod = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_12_1_lib_in_perm_pe'});
            const filterFormat = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_12_1_lib_in_perm_fo' });
            const fileCabinetId = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_12_1_lib_in_perm_fl' });

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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Libro Mayor 12.1' });
            const recordlogid = recordlog.save();

            return { recordlogid: recordlogid, irecord: record };
        } catch (e) {
            log.error({ title: 'createRecord', details: e });
        }
    }


    const searchBook = async (subsidiary, period, searchId, featureSubsidiary) => {
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

            const searchResultCount = await searchLoad.runPaged().count;

            if (searchResultCount != 0) {
                if (searchResultCount <= 4000) {
                  await searchLoad.run().each((result) => {
                      log.debug({ title: 'result', details: result });

                        const column01 = result.getValue(searchLoad.columns[0]);
                        const column02 = result.getValue(searchLoad.columns[1]);
                        const column03 = result.getValue(searchLoad.columns[2]);
                        const column04 = result.getValue(searchLoad.columns[3]);
                        let column05 = result.getValue(searchLoad.columns[4]);
                        let auxcolumn05 = column05.replace(/\s/g, '');
                        if (auxcolumn05 == '-None-'|| column05.indexOf('ERROR:') >= 0) {
                            column05 = ''
                        }
                        let column06 = result.getValue(searchLoad.columns[5]);
                        let auxcolumn06 = column06.replace(/\s/g, '');                    
                        if (auxcolumn06 == '-None-') {
                            column06 = ''
                        }
                        const column07 = result.getValue(searchLoad.columns[6]);
                        let column08 = result.getValue(searchLoad.columns[7]);
                        let auxcolumn08 = column08.replace(/\s/g, '');
                        if (auxcolumn08 == '-None-') {
                            column08 = ''
                        }
                        let column09 = result.getValue(searchLoad.columns[8]);
                        let auxcolumn09 = column09.replace(/\s/g, '');                    
                        if (auxcolumn09 == '-None-') {
                            column09 = ''
                        }
                        let column10 = result.getValue(searchLoad.columns[9]);
                        column10 = convertDateFormat(column10);
                        const column11 = result.getValue(searchLoad.columns[10]);
                        const column12 = result.getValue(searchLoad.columns[11]);
                        
                        let column13 = result.getValue(searchLoad.columns[12]);                      
                        column13 = parseInt(column13);
                        let column14 = result.getValue(searchLoad.columns[13]);
                        let auxcolumn14 = column14.replace(/\s/g, ''); 
                        if (auxcolumn14 == '-None-'|| column14.indexOf('ERROR:') >= 0) {
                          column14 = ''
                        }
                        let column15 = result.getValue(searchLoad.columns[14]);
                        let auxcolumn15 = column15.replace(/\s/g, ''); 
                        if (auxcolumn15 == '-None-'|| auxcolumn15.indexOf('ERROR:') >= 0) {
                          column15 = ''
                        }
                        let column16 = result.getValue(searchLoad.columns[15]);
                        let auxcolumn16 = column16.replace(/\s/g, ''); 
                        if (auxcolumn16 == '-None-'|| auxcolumn16.indexOf('ERROR:') >= 0) {
                          column16 = ''
                        }
                        let column17 = result.getValue(searchLoad.columns[16]);
                        if (column17 == '0') {
                            column17 = '0.00'
                        }
                        let column18 = result.getValue(searchLoad.columns[17]);
                        if (column18 == '0') {
                            column18 = '0.00'
                        } 
                        let column19 = result.getValue(searchLoad.columns[18]);
                        if (column19 == '0') {
                            column19 = '0.00'
                        } 


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
                            c19_mov_haber: column19                            
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
                            searchResult = await searchLoad.run().getRange({ start: start, end: end });
                        } else {
                            searchResult = await searchLoad.run().getRange({ start: start, end: searchResultCount });
                        }
                        for (let j in searchResult) {

                            const column01 = searchResult[j].getValue(searchLoad.columns[0]);
                            const column02 = searchResult[j].getValue(searchLoad.columns[1]);
                            const column03 = searchResult[j].getValue(searchLoad.columns[2]);
                            const column04 = searchResult[j].getValue(searchLoad.columns[3]);
                            let column05 = searchResult[j].getValue(searchLoad.columns[4]);
                            let auxcolumn05 = column05.replace(/\s/g, '');
                            if (auxcolumn05 == '-None-'|| column05.indexOf('ERROR:') >= 0) {
                                column05 = ''
                            }
                            let column06 = searchResult[j].getValue(searchLoad.columns[5]);
                            let auxcolumn06 = column06.replace(/\s/g, '');                          
                            if (auxcolumn06 == '-None-') {
                                column06 = ''
                            }
                            const column07 = searchResult[j].getValue(searchLoad.columns[6]);
                            let column08 = searchResult[j].getValue(searchLoad.columns[7]);
                            let auxcolumn08 = column08.replace(/\s/g, ''); 
                            if (auxcolumn08 == '-None-') {
                                column08 = ''
                            }
                            let column09 = searchResult[j].getValue(searchLoad.columns[8]);
                            let auxcolumn09 = column09.replace(/\s/g, '');
                            if (auxcolumn09 == '-None-') {
                                column09 = ''
                            }
                            let column10 = searchResult[j].getValue(searchLoad.columns[9]);
                            column10 = convertDateFormat(column10);
                          
                            const column11 = searchResult[j].getValue(searchLoad.columns[10]);
                            let column12 = searchResult[j].getValue(searchLoad.columns[11]);
                            if (column12 == '00') {
                                column12 = '0'
                            }
                            const column13 = searchResult[j].getValue(searchLoad.columns[12]);                            
                            let column14 = result.getValue(searchLoad.columns[13]);
                            let auxcolumn14 = column14.replace(/\s/g, '');                          
                            if (auxcolumn14 == '-None-'|| auxcolumn14.indexOf('ERROR:') >= 0) {
                              column14 = ''
                            }
                            const column15 = searchResult[j].getValue(searchLoad.columns[14]);
                            const column16 = searchResult[j].getValue(searchLoad.columns[15]);
                            const column17 = searchResult[j].getValue(searchLoad.columns[16]);
                            let column18 = searchResult[j].getValue(searchLoad.columns[17]);
                            if (column18 == '0') {
                                column18 = '0.00'
                            }
                            let column19 = searchResult[j].getValue(searchLoad.columns[18]);
                            if (column19 == '0') {
                                column19 = '0.00'
                            } 
                            
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
                                c19_mov_haber: column19
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


    const structureBody = async (searchResult) => {
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
                    searchResult[i].c19_mov_haber  + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = async (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        const header = '1 Periodo|2 CUO|3 Correlativo|4 Codigo del catalogo utilizado|5 Codigo del catalogo utilizado|6 Tipo de Existencia|7 Código Propio de Existencia en el campo 5|8 Codigo del catalogo utilizado' +
            '|9 Código Propio de Existencia en el campo 8|10 Fecha de Emision|11 Tipo de Documento|12 Numero de Serie del Documento|13 Numero del Documento|14 Codigo de Operación|15 Descripción de la Existencia' +
            '|16 Codigo de la unidad de medida|17 Entradas de las unidades fisicas|18 Salidas de las unidades fisicas|19 Indica el estado de la operacion|\n';
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


            //const periodname = await getPeriodName(filterPostingPeriod);
            //const periodostring = retornaPeriodoString(periodname);
            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '120100' + '00' + '1' + hasinfo + '11_' + recordlogid;
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
            irecord.submitFields({ type: logrecodId, id: recordlogid, values: { custrecord_pe_file_cabinet_log: fileAux.url} });
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


    const getPeriodName = async (filterPostingPeriod) => {
        try {
            const perLookup = await search.lookupFields({
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
    function convertDateFormat(dateString) {
      const parts = dateString.split('/');
    
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
    
      const formattedDay = day.length === 1 ? '0' + day : day;
      const formattedMonth = month.length === 1 ? '0' + month : month;
    
      const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
    
      return formattedDate;
   }
   
    return {
        execute: execute
    }
});
