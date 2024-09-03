/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Schedule Report: Registro del inventario permanente valorizado -detalle del inventario valorizado - 13.1
    const execute = async (context) => {
        try {
            const featureSubsidiary = await runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_ripv';
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
            const filterSubsidiary = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_13_1_invbal_sub' });
            const filterPostingPeriod = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_13_1_invbal_per' });
            const filterFormat = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_13_1_invbal_for' });
            const fileCabinetId = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_13_1_invbal_fol' });

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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Libro Mayor 13.1' });
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

                        const column01 = result.getValue(searchLoad.columns[0]);
                        const column02 = result.getValue(searchLoad.columns[1]);
                        const column03 = result.getValue(searchLoad.columns[2]);
                        const column04 = result.getValue(searchLoad.columns[3]);
                        let column05 = result.getValue(searchLoad.columns[4]);
                        let auxcolumn05 = column05.replace(/\s/g, ''); 
                        if (auxcolumn05 == '-None-') {
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
                        // log.debug({ title: 'column10', details: column10 });
                        column10 = convertDateFormat(column10);
                        // log.debug({ title: 'column10 formated', details: column10 });
                        const column11 = result.getValue(searchLoad.columns[10]);
                        let column12 = result.getValue(searchLoad.columns[11]);
                        if (column12 == '00') {
                            column12 = '0'
                        }
                        let column13 = result.getValue(searchLoad.columns[12]);
                        // column13 = column13.replace('0','');
                        column13 = parseInt(column13);
                      let column14 = result.getValue(searchLoad.columns[13]);
                      let auxcolumn14 = column14.replace(/\s/g, '');
                        if (auxcolumn14 == '-None-'|| auxcolumn14.indexOf('ERROR:') >= 0) {
                            column14 = ''
                        }
                      let column15 = result.getValue(searchLoad.columns[14]);
                      let auxcolumn15 = column15.replace(/\s/g, '');
                      if (auxcolumn15 == '-None-') {
                        column15 = ''
                      }
                      let column16 = result.getValue(searchLoad.columns[15]);
                      let auxcolumn16 = column16.replace(/\s/g, '');
                        if (auxcolumn16 == '-None-') {
                            column16 = ''
                        }
                      let column17 = result.getValue(searchLoad.columns[16]);
                      let auxcolumn17 = column17.replace(/\s/g, '');
                        if (auxcolumn17 == '-None-') {
                            column17 = ''
                        }
                        let column18 = result.getValue(searchLoad.columns[17]);
                        if (column18 == '0') {
                            column18 = '0.00'
                        } else {
                            column18 = parseFloat(column18).toFixed(8);
                        }
                        let column19 = result.getValue(searchLoad.columns[18]);
                        if (column19 == '0' || column19 == '' ) {
                            column19 = '0.00'
                        } else {
                            column19 = parseFloat(column19).toFixed(8);
                        }

                      let column20 = result.getValue(searchLoad.columns[19]);
                      let auxcolumn20 = column20.replace(/\s/g, '');
                        if (column20 == '0' || auxcolumn20 == '') {
                            column20 = '0.00'
                        } else {
                            column20 = parseFloat(column20).toFixed(2);
                        }

                        let column21 = result.getValue(searchLoad.columns[20]);
                        if (column21 == '0' || column21 == '' ) {
                            column21 = '0.00'
                        } else {
                            if (column21.length > 8) {
                                column21 = parseFloat(column21).toFixed(8);
                            }
                        }
                      let column22 = result.getValue(searchLoad.columns[21]);
                      //find Error in column22
                      let auxcolumn22 = column22.indexOf('ERROR:');
                      // el error era porque la formula tenia un "(" demas
                      log.debug({ title: 'tiene error', details: auxcolumn22 });
                        if (column22 == '0' || column22.indexOf('ERROR:') >= 0 || column22 == '' ) {
                            column22 = '0.00'
                        } else {
                            column22 = parseFloat(column22).toFixed(8);
                        }

                        if(Number(column22) < 0){
                            column22 = column22 * (-1);
                        }

                        let column23 = result.getValue(searchLoad.columns[22]);
                        if (column23 == '0' || column23 == '') {
                            column23 = '0.00'
                        } else {
                            column23 = parseFloat(column23).toFixed(2);
                        }

                        let column24 = result.getValue(searchLoad.columns[23]);
                        if (column24 = '0' || column24 == '') {
                            column24 = '0.00'
                        } else {
                            column24 = parseFloat(column24).toFixed(8);
                        }

                        let column25 = result.getValue(searchLoad.columns[24]);
                        if (column25 = '0' || column25 == '') {
                            column25 = '0.00'
                        } else {
                            column25 = parseFloat(column25).toFixed(8);
                        }

                        let column26 = result.getValue(searchLoad.columns[25]);
                        if (column26 = '0' || column26 == '') {
                            column26 = '0.00'
                        } else {
                            column26 = parseFloat(column26).toFixed(2);
                        }

                        const column27 = result.getValue(searchLoad.columns[26]);
                        // const column28 = result.getValue(searchLoad.columns[27]);

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
                            c21_20_1_campo1: column21,
                            c22_20_2_campo2: column22,
                            c23_20_3_campo3: column23,
                            c24_account: column24,
                            c25_cost_unit: column25,
                            c26_cost_total: column26,
                            c27_estado_operacion: column27
                            // c28_campo_libre: column28
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
                            if (auxcolumn05 == '-None-') {
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
                            // log.debug({ title: 'column10', details: column10 });
                            column10 = convertDateFormat(column10);
                            // log.debug({ title: 'column10 formated', details: column10 });

                            const column11 = searchResult[j].getValue(searchLoad.columns[10]);
                            let column12 = searchResult[j].getValue(searchLoad.columns[11]);
                            if (column12 == '00') {
                                column12 = '0'
                            }
                            let column13 = searchResult[j].getValue(searchLoad.columns[12]);
                            // column13 = column13.replace('0','');
                            column13 = parseInt(column13);
                            const column14 = searchResult[j].getValue(searchLoad.columns[13]);
                          let column15 = searchResult[j].getValue(searchLoad.columns[14]);
                          let auxcolumn15 = column15.replace(/\s/g, '');
                          if (auxcolumn15 == '-None-') {
                            column15 = ''
                          }
                          let column16 = searchResult[j].getValue(searchLoad.columns[15]);
                          let auxcolumn16 = column16.replace(/\s/g, '');
                            if (auxcolumn16 == '-None-') {
                                column16 = ''
                            }
                          let column17 = searchResult[j].getValue(searchLoad.columns[16]);
                          let auxcolumn17 = column17.replace(/\s/g, '');
                            if (auxcolumn17 == '-None-') {
                                column17 = ''
                            }
                            let column18 = searchResult[j].getValue(searchLoad.columns[17]);
                            if (column18 == '0') {
                                column18 = '0.00'
                            } else {
                                column18 = parseFloat(column18).toFixed(8);
                            }
                            let column19 = searchResult[j].getValue(searchLoad.columns[18]);
                            if (column19 == '0') {
                                column19 = '0.00'
                            } else {
                                column19 = parseFloat(column19).toFixed(8);
                            }

                            let column20 = searchResult[j].getValue(searchLoad.columns[19]);
                            if (column20 == '0') {
                                column20 = '0.00'
                            } else {
                                column20 = parseFloat(column20).toFixed(2);
                            }

                            let column21 = searchResult[j].getValue(searchLoad.columns[20]);
                            if (column21 == '0') {
                                column21 = '0.00'
                            } else {
                                if (column21.length > 8) {
                                    column21 = parseFloat(column21).toFixed(8);
                                }
                            }

                          let column22 = searchResult[j].getValue(searchLoad.columns[21]);
                          let auxcolumn22 = column22.indexOf('ERROR:');
                            if (column22 == '0' || auxcolumn22 >= 0) {
                                column22 = '0.00'
                            } else {
                                column22 = parseFloat(column22).toFixed(8);
                            }

                          let column23 = searchResult[j].getValue(searchLoad.columns[22]);
                          
                            if (column23 == '0') {
                                column23 = '0.00'
                            } else {
                                column23 = parseFloat(column23).toFixed(2);
                            }

                            let column24 = searchResult[j].getValue(searchLoad.columns[23]);
                            if (column24 = '0') {
                                column24 = '0.00'
                            } else {
                                column24 = parseFloat(column24).toFixed(8);
                            }

                            let column25 = searchResult[j].getValue(searchLoad.columns[24]);
                            if (column25 = '0') {
                                column25 = '0.00'
                            } else {
                                column25 = parseFloat(column25).toFixed(8);
                            }

                            let column26 = searchResult[j].getValue(searchLoad.columns[25]);
                            if (column26 = '0') {
                                column26 = '0.00'
                            } else {
                                column26 = parseFloat(column26).toFixed(2);
                            }

                            const column27 = searchResult[j].getValue(searchLoad.columns[26]);
                            // const column28 = searchResult[j].getValue(searchLoad.columns[27]);

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
                                c21_20_1_campo1: column21,
                                c22_20_2_campo2: column22,
                                c23_20_3_campo3: column23,
                                c24_account: column24,
                                c25_cost_unit: column25,
                                c26_cost_total: column26,
                                c27_estado_operacion: column27
                                // c28_campo_libre: column28
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
                    searchResult[i].c19_mov_haber + '|' + searchResult[i].c20_cod_libro + '|' + searchResult[i].c21_20_1_campo1 + '|' + searchResult[i].c22_20_2_campo2 +
                    '|' + searchResult[i].c23_20_3_campo3 + '|' + searchResult[i].c24_account + '|' + searchResult[i].c25_cost_unit + '|'
                    + searchResult[i].c26_cost_total + '|' + searchResult[i].c27_estado_operacion + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = async (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        const header = '1 Periodo|2 CUO|3 Correlativo|4 Codigo del catalogo utilizado|5 Codigo del catalogo utilizado|6 Tipo de Existencia|7 Codigo Propio de Existencia en el campo 5|8 Código del catálogo utilizado' +
            '|9 Codigo Propio de Existencia en el campo 8|10 Fecha de Emision|11 Tipo de Documento|12 Numero de Serie del Documento|13 Numero del Documento|14 Codigo de Operacion|15 Descripcion de la Existencia' +
            '|16 Codigo de la unidad de medida|17 Codigo del Metodo de valuacion|18 Cantidad de unidades fisicas|19 Costo unitario del bien Ingresado|20 Costo total del bien ingresado|21 Cantidad de unidades fisicas del bien retirado|22 Costo unitario del bien retirado|23 Costo total del bien retirado|24 Cantidad de unidades fisicas del saldo final|25 Costo unitario del saldo final|26 Costo total del saldo final|27 Indica el estado de la operacion|\n';
        try {
            //const periodname = await getPeriodName(filterPostingPeriod);
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
            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '130100' + '00' + '1' + hasinfo + '11_' + recordlogid;
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