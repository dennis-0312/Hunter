/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Schedule Report: PE - Anual: Libro de Inventarios y Balances - Detalle del Saldo de la Cuenta 12 - 3.3
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_detalle_12_3_3';
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
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_3_invbal_sub' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_3_invbal_per' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_3_invbal_for' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_3_invbal_fol' });
            const filterAnioPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_3_3_invbal_year' });
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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Inventario y Balance 3.3' });
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
            // const transactionSearchObj = search.create({
            //     type: "transaction",
            //     filters:
            //         [
            //             [["memorized", "is", "F"], "AND", ["posting", "is", "T"], "AND", ["formulatext: CASE WHEN (NVL({debitamount},0)-NVL({creditamount},0))=0 THEN 1 ELSE 0 END", "is", "0"], "AND", ["formulanumeric: CASE WHEN substr({account.number},1,2) = '12' THEN 1 ELSE 0 END", "equalto", "1"], "AND", ["voided", "is", "F"]]
            //         ],
            //     columns:
            //         [
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "CONCAT(SUBSTR(TO_CHAR({trandate} , 'YYYYMMDD'),1,6),'00')",
            //                 label: "1 Período"
            //             }),
            //             search.createColumn({
            //                 name: "internalid",
            //                 summary: "GROUP",
            //                 label: "2 CUO"
            //             }),
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "CONCAT('M', {internalid})",
            //                 label: "3 Correlativo"
            //             }),
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "NVL(NVL({custbody_pe_end_user_1.custentity_pe_code_document_type}, {customer.custentity_pe_code_document_type}),'0')",
            //                 label: "4 Tipo de Documento de Identidad del cliente"
            //             }),
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "NVL({custbody_pe_end_user_1.vatregnumber}, {customer.vatregnumber})",
            //                 label: "5 Número de Documento de Identidad del cliente"
            //             }),
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "CASE WHEN NVL({custbody_pe_end_user_1.custentity_pe_legal_name},{customer.custentity_pe_legal_name}) IS NULL THEN CASE WHEN NVL({custbody_pe_end_user_1.companyname},{customer.companyname}) IS NULL THEN CONCAT(NVL({custbody_pe_end_user_1.lastname},{customer.lastname}), CONCAT(' ', NVL({custbody_pe_end_user_1.firstname},{customer.firstname}))) ELSE NVL({custbody_pe_end_user_1.companyname},{customer.companyname}) END ELSE NVL({custbody_pe_end_user_1.custentity_pe_legal_name},{customer.custentity_pe_legal_name}) END",
            //                 label: "6 Apellidos y Nombres, Denominación o Razón Social del cliente"
            //             }),
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "TO_CHAR({trandate},'DD/MM/YYYY')",
            //                 label: "7 Fecha de Emisión"
            //             }),
            //             search.createColumn({
            //                 name: "formulanumeric",
            //                 summary: "SUM",
            //                 formula: "NVL({debitamount},'0')-NVL({creditamount},'0')",
            //                 label: "Formula (Numeric)"
            //             }),
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "'1'",
            //                 label: "9 Indica el estado de la operación"
            //             }),
            //             search.createColumn({
            //                 name: "formulatext",
            //                 summary: "GROUP",
            //                 formula: "{account.number}",
            //                 label: "10 Cód. Cuenta Contable"
            //             })
            //         ]
            // });

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
            // const parse = func(periodostring.valorAnio, periodostring.valorMes);
            
            if (searchResultCount != 0) {
                if (searchResultCount <= 4000) {
                    searchLoad.run().each((result) => {
                        let column01 = result.getValue(searchLoad.columns[0]);
                        //column01 = column01.split('/');
                        //const PeriodoCompleto = func(column01[0], column01[1]);
                        const column02 = result.getValue(searchLoad.columns[1]);
                        let column03 = result.getValue(searchLoad.columns[2]);
                        column03 = column03.replace(/(\r\n|\n|\r)/gm, "");
                        column03 = column03.replace(/[\/\\|]/g, "");
                        const column04 = result.getValue(searchLoad.columns[3]);
                        let column05 = result.getValue(searchLoad.columns[4]);
                        if (column05 == '- None -') {
                            column05 = '00000000000'
                        }
                        let column06 = result.getValue(searchLoad.columns[5]);
                        column06 = column06.replace(/(\r\n|\n|\r)/gm, "");
                        column06 = column06.replace(/[\/\\|]/g, "");
                        if (column06 == ' ' || column06 == '' || column06 == 'null') {
                            column06 = 'VACIO'
                        }
                        const column07 = result.getValue(searchLoad.columns[6]);
                        let column08 = result.getValue(searchLoad.columns[7]);
                        column08 = parseFloat(column08).toFixed(2);
                      column08 = (column08);
                        const column09 = result.getValue(searchLoad.columns[8]);
                        let column10 = result.getValue(searchLoad.columns[9]);
                        // column10 = column10.replace(/(\r\n|\n|\r)/gm, "");
                        // column10 = column10.replace(/[\/\\|]/g, "");


                        let column13 = result.getValue(searchLoad.columns[12]);
                        let column14 = result.getValue(searchLoad.columns[13]);
                        let column15 = result.getValue(searchLoad.columns[14]);

                        let nombre = column15;
                        let numTrabajador = column14;
                        let codigoTipoDocumento = '0';

                        if(column13 != '0'){
                            let entidad = getCustomer(column13);
                            if (entidad[0] == null) {
                                entidad = getProveedor(column13);
                            }
                            if (entidad[0] == null) {
                                entidad = getemployee(column13);
                            }

                            let company = entidad[0];
                            numTrabajador = entidad[1];
                            let isPerson = entidad[2];
                            let altname = entidad[3];
                            codigoTipoDocumento = entidad[4];

                            if (company == null) company = '';
                            if (numTrabajador == null) numTrabajador = '';
                            if (isPerson == null) isPerson = '';
                            if (altname == null) altname = '';
                            if (codigoTipoDocumento == null) codigoTipoDocumento = '';

                            if (isPerson == false) {
                                nombre = company;
                            } else if (isPerson == true) {
                                nombre = altname;
                            }
                        }

                        nombre = nombre.replace(/(\r\n|\n|\r)/gm, "");
                        nombre = nombre.replace(/[\/\\|]/g, "");
                        
                        if (column10 == anioperiod) {
                            json.push({
                                c1_periodo: column01,
                                c2_cuo: column02,
                                c3_correlativo: column03,
                                c4_tipo_doc_cliente: codigoTipoDocumento,
                                c5_nro_doc_cliente: numTrabajador,
                                c6_nombres_o_razon_social: nombre,
                                c7_fecha_emision: column07,
                                c8_monto_cuenta_por_cobrar_cliente: column08,
                                c9_estado_op: column09
                                // c10_cod_cuenta_contable: column10
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
                            let column03 = searchResult[j].getValue(searchLoad.columns[2]);
                            column03 = column03.replace(/(\r\n|\n|\r)/gm, "");
                            column03 = column03.replace(/[\/\\|]/g, "");
                            const column04 = searchResult[j].getValue(searchLoad.columns[3]);
                            let column05 = searchResult[j].getValue(searchLoad.columns[4]);
                            if (column05 == '- None -') {
                                column05 = '00000000000'
                            }
                            let column06 = searchResult[j].getValue(searchLoad.columns[5]);
                            column06 = column06.replace(/(\r\n|\n|\r)/gm, "");
                            column06 = column06.replace(/[\/\\|]/g, "");
                            if (column06 == ' ' || column06 == '' || column06 == 'null') {
                                column06 = 'VACIO'
                            }
                            const column07 = searchResult[j].getValue(searchLoad.columns[6]);
                            let column08 = searchResult[j].getValue(searchLoad.columns[7]);
                            column08 = parseFloat(column08).toFixed(2);
                            const column09 = searchResult[j].getValue(searchLoad.columns[8]);
                            let column10 = searchResult[j].getValue(searchLoad.columns[9]);
                            // column10 = column10.replace(/(\r\n|\n|\r)/gm, "");
                            // column10 = column10.replace(/[\/\\|]/g, "");
                           
                            let column13 = searchResult[j].getValue(searchLoad.columns[12]);
                            let column14 = searchResult[j].getValue(searchLoad.columns[13]);
                            let column15 = searchResult[j].getValue(searchLoad.columns[14]);

                            let nombre = column15;
                            let numTrabajador = column14;
                            let codigoTipoDocumento = '0';
    
                            if(column13 != '0'){
                                let entidad = getCustomer(column13);
                                if (entidad[0] == null) {
                                    entidad = getProveedor(column13);
                                }
                                if (entidad[0] == null) {
                                    entidad = getemployee(column13);
                                }
    
                                let company = entidad[0];
                                numTrabajador = entidad[1];
                                let isPerson = entidad[2];
                                let altname = entidad[3];
                                codigoTipoDocumento = entidad[4];
    
                                if (company == null) company = '';
                                if (numTrabajador == null) numTrabajador = '';
                                if (isPerson == null) isPerson = '';
                                if (altname == null) altname = '';
                                if (codigoTipoDocumento == null) codigoTipoDocumento = '';
    
                                if (isPerson == false) {
                                    nombre = company;
                                } else if (isPerson == true) {
                                    nombre = altname;
                                }
                            }
    
                            nombre = nombre.replace(/(\r\n|\n|\r)/gm, "");
                            nombre = nombre.replace(/[\/\\|]/g, "");

                            if (column10 == anioperiod) {
                                json.push({
                                    c1_periodo: column01,
                                    c2_cuo: column02,
                                    c3_correlativo: column03,
                                    c4_tipo_doc_cliente: codigoTipoDocumento,
                                    c5_nro_doc_cliente: numTrabajador,
                                    c6_nombres_o_razon_social: nombre,
                                    c7_fecha_emision: column07,
                                    c8_monto_cuenta_por_cobrar_cliente: column08,
                                    c9_estado_op: column09
                                    // c10_cod_cuenta_contable: column10
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
                    contentReport + searchResult[i].c1_periodo + '|' + searchResult[i].c2_cuo + '|' + searchResult[i].c3_correlativo + '|' +
                    searchResult[i].c4_tipo_doc_cliente + '|' + searchResult[i].c5_nro_doc_cliente + '|' + searchResult[i].c6_nombres_o_razon_social + '|' +
                    searchResult[i].c7_fecha_emision + '|' + searchResult[i].c8_monto_cuenta_por_cobrar_cliente + '|' + searchResult[i].c9_estado_op + '|' +
                    '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId,filterAnioPeriod) => {
        let typeformat;
        const header = '1 Periodo|2 CUO|3 Correlativo|4 Tipo de Documento de Identidad del cliente|5 Numero de Documento de Identidad del cliente|6 Apellidos y Nombres, Denominación o Razon Social del cliente|' +
            '7 Fecha de Emision|8 Monto de cada cuenta por cobrar del cliente|9 Indica el estado de la operacion|10 Cód. Cuenta Contable|\n';
        try {
            
            let periodname = filterAnioPeriod ;

            let nameReportGenerated = 'LE' + fedIdNumb + periodname + '1231030300' + '07' + '1' + hasinfo + '11_' + recordlogid;
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
            campoRegistro01 = valorAnio + valorMes + ultimoDia;
        }
        return campoRegistro01;
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
            campoRegistro01 = {
                valorAnio: valorAnio,
                valorMes: valorMes
            }
        }
        return campoRegistro01;
    }

const numberWithCommas = (x) => {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x))
          x = x.replace(pattern, "$1,$2");
      return x;
   }
  
    const func = (valorAnio, valorMes) => {
        // var date = new Date();
        var ultimoDia = new Date(valorAnio, valorMes, 0).getDate();
        var parse = String(valorAnio) + String(valorMes) + String(ultimoDia)
        return parse
    }

    const getProveedor = (id) => {
        id = Number(id);
        try {
            var arr = [];
            let vendor = search.lookupFields({
                type: "vendor",
                id: id,
                columns: [
                    "companyname", 'vatregnumber', 'isperson', 'altname', 'custentity_pe_code_document_type',
                ]
            });
            arr[0] = vendor.companyname;
            arr[1] = vendor.vatregnumber;
            arr[2] = vendor.isperson;
            arr[3] = vendor.altname;
            arr[4] = vendor.custentity_pe_code_document_type;
            return arr;
        } catch (error) {
            log.error('error-getProveedor', error);
        }
    }

    const getCustomer = (id) => {
        id = Number(id);
        try {
            var arr = [];
            let customer = search.lookupFields({
                type: "customer",
                id: id,
                columns: [
                    "companyname", 'vatregnumber', 'isperson', 'altname', 'custentity_pe_code_document_type'
                ]
            });
            arr[0] = customer.companyname;
            arr[1] = customer.vatregnumber;
            arr[2] = customer.isperson;
            arr[3] = customer.altname;
            arr[4] = customer.custentity_pe_code_document_type;
            return arr;
        } catch (error) {
            log.error('error-getCustomer', error);
        }
    }

    const getemployee = (id) => {
        id = Number(id);
        try {
            var arr = [];
            let employee = search.lookupFields({
                type: "employee",
                id: id,
                columns: [
                    "altname", 'custentity_pe_document_number', 'custentity_pe_code_document_type'
                ]
            });
            arr[0] = '';
            arr[1] = employee.custentity_pe_document_number;
            arr[2] = true;
            arr[3] = employee.altname;
            arr[4] = employee.custentity_pe_code_document_type;
            return arr;
        } catch (error) {
            log.error('error-getemployee', error);
        }
    }


    return {
        execute: execute
    }
});