/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format",'N/render'], (search, record, email, runtime, log, file, task, config, format, render) => {
    // Schedule Report: PE - Registro de Ventas 14.1
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const execute = async (context) => {
        try {
            const featureSubsidiary = await runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_registro_de_ventas_14_1';
            var logrecodId = 'customrecord_pe_generation_logs';
            let fedIdNumb = '';
            let nombreCompany = '';
            let hasinfo = 0;

            const params = await getParams();

            if (featureSubsidiary) {
                const getruc = await getRUC(params.filterSubsidiary)
                fedIdNumb = getruc[0];
                nombreCompany = getruc[1];
            } else {
                const employerid = await getEmployerID();
                fedIdNumb = employerid;
            }

            var createrecord = await createRecord(logrecodId, featureSubsidiary, params.filterSubsidiary, params.filterPostingPeriod);
            const searchbook = await searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary);
            // log.debug({ title: 'searchBook', details: searchbook });

            if (searchbook.thereisinfo == 1) {
                hasinfo = '1';
                if(params.filterFormat == 'PDF'){
                    //log.debug('searchbook.content',searchbook.content);
                    var jsonAxiliar = getJsonData(searchbook.content,params.filterPostingPeriod,fedIdNumb,nombreCompany);
                    //log.debug('jsonAxiliar',jsonAxiliar);
                    const createfile = await createFile(params.filterPostingPeriod, fedIdNumb, hasinfo, createrecord.recordlogid, params.filterFormat, jsonAxiliar, params.fileCabinetId);
                    const statusProcess = await setRecord(createrecord.irecord, createrecord.recordlogid, createfile, logrecodId);
                    log.debug({ title: 'FinalResponse', details: 'Estado del proceso: ' + statusProcess + ' OK!!' });
                } else {
                    const structuregbody = await structureBody(searchbook.content);
                    const createfile = await createFile(params.filterPostingPeriod, fedIdNumb, hasinfo, createrecord.recordlogid, params.filterFormat, structuregbody, params.fileCabinetId);
                    const statusProcess = await setRecord(createrecord.irecord, createrecord.recordlogid, createfile, logrecodId);
                    log.debug({ title: 'FinalResponse', details: 'Estado del proceso: ' + statusProcess + ' OK!!' });
                }
                
            } else {
                setVoid(createrecord.irecord, logrecodId, createrecord.recordlogid);
                log.debug({ title: 'FinalResponse', details: 'No hay registros para la solicitud: ' + createrecord.recordlogid });
            }
        } catch (e) {
            log.error({ title: 'ErrorInExecute', details: e });
            await setError(createrecord.irecord, logrecodId, createrecord.recordlogid, e)
        }
    }

    const getTemplate = () => {
        var aux = file.load("./Template/PE_Template_14_1.ftl");
        return aux.getContents();
    }

    const getParams = async () => {
        try {
            const scriptObj = await runtime.getCurrentScript();
            const filterSubsidiary = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_14_1_regventas_sub' });
            const filterPostingPeriod = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_14_1_regventas_per' });
            const filterFormat = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_14_1_regventas_for' });
            const fileCabinetId = await scriptObj.getParameter({ name: 'custscript_pe_ss_ple_14_1_regventas_fol' });

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
                columns: ['taxidnum','legalname']
            });
            const ruc = subLookup.taxidnum;
            const legalname = subLookup.legalname;
            return [ruc,legalname];
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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Reg. Ventas 14.1' });
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
                        //log.debug({ title: 'searchBook', details: result });
                        const column01 = result.getValue(searchLoad.columns[0]);
                        const column02 = result.getValue(searchLoad.columns[1]);
                        const column03 = result.getValue(searchLoad.columns[2]);
                        const column04 = result.getValue(searchLoad.columns[3]);
                        let column05 = result.getValue(searchLoad.columns[4]);
                        if (column05 == '- None -') {
                            column05 = ''
                        }
                        const column06 = result.getValue(searchLoad.columns[5]);
                        const column07 = result.getValue(searchLoad.columns[6]);
                        const column08 = result.getValue(searchLoad.columns[7]);
                        let column09 = result.getValue(searchLoad.columns[8]);
                        if (column09 == '- None -') {
                            column09 = ''
                        }
                        const column10 = result.getValue(searchLoad.columns[9]);
                        let column11 = result.getValue(searchLoad.columns[10]);
                        if (column11 == '- None -') {
                            column11 = ''
                        }
                        const column12 = result.getValue(searchLoad.columns[11]);
                        let column13 = result.getValue(searchLoad.columns[12]);
                        if (column13 == '.00') {
                            column13 = '0.00'
                        }
                        let column14 = result.getValue(searchLoad.columns[13]);
                        column14 = parseFloat(column14).toFixed(2)
                        if (column14 == '.00') {
                            column14 = '0.00'

                        }
                        let column15 = result.getValue(searchLoad.columns[14]);
                        if (column15 == '.00') {
                            column15 = '0.00'
                        }
                        let column16 = result.getValue(searchLoad.columns[15]);
                        if (column06 == '07') {
                            if(Number(column16) > 0){
                                column16 = column16 * (-1);
                            }
                        }
                        column16 = parseFloat(column16).toFixed(2)
                        let column17 = result.getValue(searchLoad.columns[16]);
                        if (column17 == '.00') {
                            column17 = '0.00'
                        }
                        let column18 = result.getValue(searchLoad.columns[17]);
                        if (column18 == '.00') {
                            column18 = '0.00'
                        }
                        let column19 = result.getValue(searchLoad.columns[18]);
                        if (column19 == '.00') {
                            column19 = '0.00'
                        }
                        let column20 = result.getValue(searchLoad.columns[19]);
                        if (column20 == '.00') {
                            column20 = '0.00'
                        }
                        let column21 = result.getValue(searchLoad.columns[20]);
                        if (column21 == '.00') {
                            column21 = '0.00'
                        }
                        let column22 = result.getValue(searchLoad.columns[21]);
                        if (column22 == '.00') {
                            column22 = '0.00'
                        }
                        let column23 = result.getValue(searchLoad.columns[22]);
                        if (column23 == '.00') {
                            column23 = '0.00'
                        }
                        let column24 = result.getValue(searchLoad.columns[23]);
                        if (column24 == '.00') {
                            column24 = '0.00'
                        }
                        let column25 = result.getValue(searchLoad.columns[24]);
                        column25 = parseFloat(column25).toFixed(2)
                        const column26 = result.getValue(searchLoad.columns[25]);
                        const column27 = result.getValue(searchLoad.columns[26]);
                        let column28 = result.getValue(searchLoad.columns[27]);
                        if (column28 == '- None -') {
                            column28 = ''
                        }
                        let column29 = result.getValue(searchLoad.columns[28]);
                        if (column29 == '- None -') {
                            column29 = ''
                        }
                        let column30 = result.getValue(searchLoad.columns[29]);
                        if (column30 == '- None -') {
                            column30 = ''
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
                        //log.debug({ title: 'column34 none', details: column34 });
                        //remove spaces from string
                        column34 = column34.replace(/\s/g, '');
                        if (column34 == '-None-') {
                            column34 = ''
                            log.debug({ title: 'column34 vacio', details: column34 });

                        }
                        let column35 = result.getValue(searchLoad.columns[34]);
                        if (column35 == '- None -') {
                            column35 = ''
                        }
                        const column36 = result.getValue(searchLoad.columns[35]);
                        const column37 = result.getValue(searchLoad.columns[36]);
                        const column38 = result.getValue(searchLoad.columns[37]);
                        const column39 = result.getValue(searchLoad.columns[38]);
                        let column40 = result.getValue(searchLoad.columns[39]);
                        if (column40 == '- None -') {
                            column40 = ''
                        }
                        const column41 = result.getValue(searchLoad.columns[40]);
                        let column42 = result.getValue(searchLoad.columns[41]);
                        if (column42 == '- None -') {
                            column42 = ''
                        }
                        let column43 = result.getValue(searchLoad.columns[42]);
                        if (column43 == '.00') {
                            column43 = '0.00'
                        }
                        let column44 = result.getValue(searchLoad.columns[43]);
                        if (column44 == '.00') {
                            column44 = '0.00'
                        }
                        let column45 = result.getValue(searchLoad.columns[44]);
                        if (column45 == '.00') {
                            column45 = '0.00'
                        }
                        let column46 = result.getValue(searchLoad.columns[45]);
                        if (column46 == '.00') {
                            column46 = '0.00'
                        }
                        let column47 = result.getValue(searchLoad.columns[46]);
                        if (column47 == '.00') {
                            column47 = '0.00'
                        }
                        let column48 = result.getValue(searchLoad.columns[47]);
                        if (column48 == '.00') {
                            column48 = '0.00'
                        }
                        let column49 = result.getValue(searchLoad.columns[48]);
                        if (column49 == '.00') {
                            column49 = '0.00'
                        }
                        let column50 = result.getValue(searchLoad.columns[49]);
                        if (column50 == '.00') {
                            column50 = '0.00'
                        }
                        const column51 = result.getValue(searchLoad.columns[50]);
                        json.push({
                            c1_periodo: column01,
                            c2_cuo: column02,
                            c3_correlativo: column03,
                            c4_fecha_emision_comprobante_pago_doc: column04,
                            c5_fecha_vencimiento_o_fecha_pago: column05,
                            c6_tipo_comprobante_pago_o_documento: column06,
                            c7_serie_comprobante_pago_o_documento: column07,
                            c8_nro_comprobante_pago_o_documento: column08,
                            c9_en_caso_operaciones_diarias_o_credito_fiscal: column09,
                            c10_tipo_documento_identidad_cliente: column10,
                            c11_numero_ruc_cliente_o_nro_doc: column11,
                            c12_nombres_o_razon_social: column12,
                            c13_x_pe: column13,
                            c14_s_pe: column14,
                            c15_desc: column15,
                            c16_igv: column16,
                            c17_igv_descuento_pe: column17,
                            c18_e_pe: column18,
                            c19_i_pe: column19,
                            c20_sun_pe: column20,
                            c21_iun_pe: column21,
                            c22_inaf_pe: column22,
                            c23_icbp: column23,
                            c24_otros: column24,
                            c25_total: column25,
                            c26_mon: column26,
                            c27_tc: column27,
                            c28_fecha_doc_ref: column28,
                            c29_td_doc_ref: column29,
                            c30_serie_doc_ref: column30,
                            c31_num_doc_ref: column31,
                            c32_identificador_contrato: column32,
                            c33_inconsistencia_tc: column33,
                            c34_medio_pago: column34,
                            c35_estado_identifica: column35,
                            c36: column36,
                            c37: column37,
                            c38: column38,
                            c39: column39,
                            c40: column40,
                            c41: column41,
                            c42: column42,
                            c43: column43,
                            c44: column44,
                            c45: column45,
                            c46: column46,
                            c47: column47,
                            c48: column48,
                            c49: column49,
                            c50: column50,
                            c51: column51

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
                            if (column05 == '- None -') {
                                column05 = ''
                            }
                            const column06 = searchResult[j].getValue(searchLoad.columns[5]);
                            const column07 = searchResult[j].getValue(searchLoad.columns[6]);
                            const column08 = searchResult[j].getValue(searchLoad.columns[7]);
                            let column09 = searchResult[j].getValue(searchLoad.columns[8]);
                            if (column09 == '- None -') {
                                column09 = ''
                            }
                            const column10 = searchResult[j].getValue(searchLoad.columns[9]);
                            const column11 = searchResult[j].getValue(searchLoad.columns[10]);
                            const column12 = searchResult[j].getValue(searchLoad.columns[11]);
                            let column13 = searchResult[j].getValue(searchLoad.columns[12]);
                            if (column13 == '.00') {
                                column13 = '0.00'
                            }
                            let column14 = searchResult[j].getValue(searchLoad.columns[13]);
                            column14 = parseFloat(column14).toFixed(2)
                            if (column14 == '.00') {
                                column14 = '0.00'

                            }
                            let column15 = searchResult[j].getValue(searchLoad.columns[14]);
                            if (column15 == '.00') {
                                column15 = '0.00'
                            }
                            let column16 = searchResult[j].getValue(searchLoad.columns[15]);
                            if (column06 == '07') {
                                if(Number(column16) > 0){
                                    column16 = column16 * (-1);
                                }
                            }
                            column16 = parseFloat(column16).toFixed(2)

                            let column17 = searchResult[j].getValue(searchLoad.columns[16]);
                            if (column17 == '.00') {
                                column17 = '0.00'
                            }
                            let column18 = searchResult[j].getValue(searchLoad.columns[17]);
                            if (column18 == '.00') {
                                column18 = '0.00'
                            }
                            let column19 = searchResult[j].getValue(searchLoad.columns[18]);
                            if (column19 == '.00') {
                                column19 = '0.00'
                            }
                            let column20 = searchResult[j].getValue(searchLoad.columns[19]);
                            if (column20 == '.00') {
                                column20 = '0.00'
                            }
                            let column21 = searchResult[j].getValue(searchLoad.columns[20]);
                            if (column21 == '.00') {
                                column21 = '0.00'
                            }
                            let column22 = searchResult[j].getValue(searchLoad.columns[21]);
                            if (column22 == '.00') {
                                column22 = '0.00'
                            }
                            let column23 = searchResult[j].getValue(searchLoad.columns[22]);
                            if (column23 == '.00') {
                                column23 = '0.00'
                            }
                            let column24 = searchResult[j].getValue(searchLoad.columns[23]);
                            if (column24 == '.00') {
                                column24 = '0.00'
                            }
                            let column25 = searchResult[j].getValue(searchLoad.columns[24]);
                            column25 = parseFloat(column25).toFixed(2)
                            const column26 = searchResult[j].getValue(searchLoad.columns[25]);
                            const column27 = searchResult[j].getValue(searchLoad.columns[26]);
                            let column28 = searchResult[j].getValue(searchLoad.columns[27]);
                            if (column28 == '- None -') {
                                column28 = ''
                            }
                            let column29 = searchResult[j].getValue(searchLoad.columns[28]);
                            if (column29 == '- None -') {
                                column29 = ''
                            }
                            let column30 = searchResult[j].getValue(searchLoad.columns[29]);
                            if (column30 == '- None -') {
                                column30 = ''
                            }
                            let column31 = searchResult[j].getValue(searchLoad.columns[30]);
                            if (column31 == '- None -') {
                                column31 = ''
                            }
                            let column32 = searchResult[j].getValue(searchLoad.columns[31]);
                            if (column32 == '- None -') {
                                column32 = ''
                            }
                            let column33 = searchResult[j].getValue(searchLoad.columns[32]);
                            if (column33 == '- None -') {
                                column33 = ''
                            }
                            let column34 = searchResult[j].getValue(searchLoad.columns[33]);
                            if (column34 == '- None -') {
                                column34 = ''
                            }
                            let column35 = searchResult[j].getValue(searchLoad.columns[34]);
                            if (column35 == '- None -') {
                                column35 = ''
                            }
                            const column36 = result.getValue(searchLoad.columns[35]);
                            const column37 = result.getValue(searchLoad.columns[36]);
                            const column38 = result.getValue(searchLoad.columns[37]);
                            const column39 = result.getValue(searchLoad.columns[38]);
                            let column40 = result.getValue(searchLoad.columns[39]);
                            if (column40 == '- None -') {
                                column40 = ''
                            }
                            const column41 = result.getValue(searchLoad.columns[40]);
                            let column42 = result.getValue(searchLoad.columns[41]);
                            if (column42 == '- None -') {
                                column42 = ''
                            }
                            let column43 = result.getValue(searchLoad.columns[42]);
                            if (column43 == '.00') {
                                column43 = '0.00'
                            }
                            let column44 = result.getValue(searchLoad.columns[43]);
                            if (column44 == '.00') {
                                column44 = '0.00'
                            }
                            let column45 = result.getValue(searchLoad.columns[44]);
                            if (column45 == '.00') {
                                column45 = '0.00'
                            }
                            let column46 = result.getValue(searchLoad.columns[45]);
                            if (column46 == '.00') {
                                column46 = '0.00'
                            }
                            let column47 = result.getValue(searchLoad.columns[46]);
                            if (column47 == '.00') {
                                column47 = '0.00'
                            }
                            let column48 = result.getValue(searchLoad.columns[47]);
                            if (column48 == '.00') {
                                column48 = '0.00'
                            }
                            let column49 = result.getValue(searchLoad.columns[48]);
                            if (column49 == '.00') {
                                column49 = '0.00'
                            }
                            let column50 = result.getValue(searchLoad.columns[49]);
                            if (column50 == '.00') {
                                column50 = '0.00'
                            }
                            const column51 = result.getValue(searchLoad.columns[50]);
                            json.push({
                                c1_periodo: column01,
                                c2_cuo: column02,
                                c3_correlativo: column03,
                                c4_fecha_emision_comprobante_pago_doc: column04,
                                c5_fecha_vencimiento_o_fecha_pago: column05,
                                c6_tipo_comprobante_pago_o_documento: column06,
                                c7_serie_comprobante_pago_o_documento: column07,
                                c8_nro_comprobante_pago_o_documento: column08,
                                c9_en_caso_operaciones_diarias_o_credito_fiscal: column09,
                                c10_tipo_documento_identidad_cliente: column10,
                                c11_numero_ruc_cliente_o_nro_doc: column11,
                                c12_nombres_o_razon_social: column12,
                                c13_x_pe: column13,
                                c14_s_pe: column14,
                                c15_desc: column15,
                                c16_igv: column16,
                                c17_igv_descuento_pe: column17,
                                c18_e_pe: column18,
                                c19_i_pe: column19,
                                c20_sun_pe: column20,
                                c21_iun_pe: column21,
                                c22_inaf_pe: column22,
                                c23_icbp: column23,
                                c24_otros: column24,
                                c25_total: column25,
                                c26_mon: column26,
                                c27_tc: column27,
                                c28_fecha_doc_ref: column28,
                                c29_td_doc_ref: column29,
                                c30_serie_doc_ref: column30,
                                c31_num_doc_ref: column31,
                                c32_identificador_contrato: column32,
                                c33_inconsistencia_tc: column33,
                                c34_medio_pago: column34,
                                c35_estado_identifica: column35,
                                c36: column36,
                                c37: column37,
                                c38: column38,
                                c39: column39,
                                c40: column40,
                                c41: column41,
                                c42: column42,
                                c43: column43,
                                c44: column44,
                                c45: column45,
                                c46: column46,
                                c47: column47,
                                c48: column48,
                                c49: column49,
                                c50: column50,
                                c51: column51
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
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cuo + '|' + searchResult[i].c3_correlativo + '|' + searchResult[i].c4_fecha_emision_comprobante_pago_doc + '|' + searchResult[i].c5_fecha_vencimiento_o_fecha_pago + '|' +
                    searchResult[i].c6_tipo_comprobante_pago_o_documento + '|' + searchResult[i].c7_serie_comprobante_pago_o_documento + '|' + searchResult[i].c8_nro_comprobante_pago_o_documento + '|' + searchResult[i].c9_en_caso_operaciones_diarias_o_credito_fiscal + '|' + searchResult[i].c10_tipo_documento_identidad_cliente + '|' +
                    searchResult[i].c11_numero_ruc_cliente_o_nro_doc + '|' + searchResult[i].c12_nombres_o_razon_social + '|' + searchResult[i].c13_x_pe + '|' + searchResult[i].c14_s_pe + '|' + searchResult[i].c15_desc + '|' +
                    searchResult[i].c16_igv + '|' + searchResult[i].c17_igv_descuento_pe + '|' + searchResult[i].c18_e_pe + '|' + searchResult[i].c19_i_pe + '|' + searchResult[i].c20_sun_pe + '|' +
                    searchResult[i].c21_iun_pe + '|' + searchResult[i].c22_inaf_pe + '|' + searchResult[i].c23_icbp + '|' + searchResult[i].c24_otros + '|' + searchResult[i].c25_total + '|' +
                    searchResult[i].c26_mon + '|' + searchResult[i].c27_tc + '|' + searchResult[i].c28_fecha_doc_ref + '|' + searchResult[i].c29_td_doc_ref + '|' + searchResult[i].c30_serie_doc_ref + '|' +
                    searchResult[i].c31_num_doc_ref + '|' + searchResult[i].c32_identificador_contrato + '|' + searchResult[i].c33_inconsistencia_tc + '|' + searchResult[i].c34_medio_pago + '|' + searchResult[i].c35_estado_identifica + '|' +
                    searchResult[i].c36 + '|' + searchResult[i].c37 + '|' + searchResult[i].c37 + '|' + searchResult[i].c38 + '|' + searchResult[i].c39 + '|' + searchResult[i].c40 + '|' +
                    searchResult[i].c41 + '|' + searchResult[i].c42 + '|' + searchResult[i].c43 + '|' + searchResult[i].c44 + '|' + searchResult[i].c45 + '|' + searchResult[i].c46 + '|' + searchResult[i].c47 + '|' +
                    searchResult[i].c48 + '|' + searchResult[i].c48 + '|' + searchResult[i].c50 + '|' + searchResult[i].c51 + '|\n';
            }
            return contentReport;

        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = async (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        var fileObj;
        var stringXML;
        var fileID;
        log.debug('filterFormat',filterFormat);
        const header = '1 Periodo|2 CUO|3 Correlativo|4 Fecha de Emision del Comprobante de Pago o Documento|5 Fecha de Vencimiento o Fecha de Pago|6 Tipo de Comprobante de Pago o Documento|7 Serie del Comprobante de Pago o Documento|8 Nro del Comprobante de Pago o Documento' +
            '|9 en caso de optar por imp tot de las operaciones diarias o no otorguen derecho a credito fiscal|10 Tipo de Documento de identidad del cliente|11 Numero de RUC del cliente o numero de documento de identidad según corresponda' +
            '|12 Apellidos y nombres o razon social del cliente. En caso de personas naturales|13 X-PE|14 S-PE|15 Desc|16 IGV|17 IGV Descuento PE|18 E-PE|19 I-PE|20 SUn-PE|21 IUn-PE|22 Inaf-PE|23 ICBP|24 Otros|25 Total|26 Mon|27 TC|28 Fecha Doc Ref|29 TD Doc Ref|30 Serie Doc Ref' +
            '|31 Num Doc Ref|32 identificador Contrato|33 Inconsistencia TC|34 Medio de Pago|35 Estado que identifica|36 Periodo|37 Periodo Inicial|38 Periodo Final|39 meses anteriores 12|40 es rectificacion|41 Tipo Transaccion|42 Memo|43 Descuento exonerado|' +
            '|44 Descuento PE|45 Descuento X-PE|46 Descuento Inaf-PE|47 SNop-PE|48 SNoc-PE|49 E-PE|50 INoc-PE|51 0 Ordenamiento|\n';
        try {
            //const periodname = await getPeriodName(filterPostingPeriod);
            //const periodostring = retornaPeriodoString(periodname);
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
            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '140100' + '00' + '1' + hasinfo + '11_' + recordlogid;
            if (filterFormat == 'CSV') {
                nameReportGenerated = nameReportGenerated + '.csv';
                structuregbody = header + structuregbody;
                structuregbody = structuregbody.replace(/[,]/gi, ' ');
                structuregbody = structuregbody.replace(/[|]/gi, ',');
                typeformat = file.Type.CSV;
            } else if (filterFormat == 'TXT') {
                nameReportGenerated = nameReportGenerated + '.txt';
                typeformat = file.Type.PLAINTEXT;
            } else if(filterFormat == 'PDF'){
                nameReportGenerated = nameReportGenerated + '.pdf';
                //log.debug('structuregbody',structuregbody)
                var renderer = render.create();
                var a  = getTemplate();
                renderer.templateContent = getTemplate();
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "input",
                    data: {
                        data: JSON.stringify(structuregbody)
                    }
                });
                stringXML = renderer.renderAsPdf();
                log.debug('stringXML',stringXML);
            }


            if(filterFormat == 'PDF'){
                stringXML.name = nameReportGenerated;
                stringXML.folder = fileCabinetId;
                fileID = stringXML.save();
                /*
                let auxFile = file.load({ id: fileID });
                urlfile += auxFile.url;
                */
            } else {
                fileObj = file.create({
                    name: nameReportGenerated,
                    fileType: typeformat,
                    contents: structuregbody,
                    encoding: file.Encoding.UTF8,
                    folder: fileCabinetId,
                    isOnline: true
                });
                fileID = fileObj.save();
            }
            
            return fileID;
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
                for (var i = lengthStrValor; i < tamano; i++) {
                    nuevoValor = '0' + nuevoValor;
                }
            }
            return nuevoValor;
        } else {
            return nuevoValor.substring(0, tamano);
        }
    }

    const getJsonData = (transactions,periodo,companyRuc,companyName) => {
        var cantidadtotal = 0;
        var primeraCuenta = '';
        
        jsonTransacion = {},
        movDebe = 0,
        movHaber = 0;

        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: periodo,
            columns: ['periodname', "startdate"]
        });
        let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
        let year = periodSearch.startdate.split("/")[2];

        for(let i = 0; i < transactions.length ; i++){
            jsonTransacion[i] = transactions[i]
        }

        /*
        movDebe = parseFloat(movDebe)
        movHaber = parseFloat(movHaber)
        */
        
        var jsonAxiliar = {
            "company": {
                "firtsTitle": 'FORMATO 14.1: REGISTRO DE VENTAS E INGRESOS',
                "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
                "cantidadtotal": cantidadtotal,
            },
            "total": {
                "movDebe": movDebe,
                "movHaber": movHaber,
            },
            "movements": jsonTransacion
        };
        return jsonAxiliar;
    }

    return {
        execute: execute
    }
}); 