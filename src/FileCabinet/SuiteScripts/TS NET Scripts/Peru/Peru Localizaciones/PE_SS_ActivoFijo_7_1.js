/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 *
 * Task                     Date            Author                                      Remarks
 * Activos Fijos 7.1        17 Jul 2023     Ivan Morales <imorales@myevol.biz>          7.1 REGISTRO DE ACTIVOS FIJOS - DETALLE DE LOS ACTIVOS FIJOS REVALUADOS Y NO REVALUADOS
 */
 define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config"], (search, record, runtime, log, file, task, config) => {

    function execute(context) {
        try{
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_reporte_7_1';//ID de mi Búsqueda guardada
            var logrecodId = 'customrecord_pe_generation_logs';
            let fedIdNumb = '';
            let hasinfo = 0;

            const params = getParams();
            log.debug('params',params);
            if (featureSubsidiary) {
                const getruc = getRUC(params.filterSubsidiary)
                fedIdNumb = getruc;
            } else {
                const employerid = getEmployerID();
                fedIdNumb = employerid;
            }

            log.debug('MSK','antes de createRecord');
            var createrecord = createRecord(logrecodId, featureSubsidiary, params.filterSubsidiary, params.filterPostingPeriod);
            log.debug('MSK','despues de createRecord');
            const searchbook = searchBook(params.filterSubsidiary, params.filterPostingPeriod, searchId, featureSubsidiary, params.filterAnioPeriod);
            log.debug('MSK','despues de searchBook');

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

        }
        catch(e){
            log.error({ title: 'ErrorInExecute', details: e });
            setError(createrecord.irecord, logrecodId, createrecord.recordlogid, e)
        }
    }

    const getParams = () => {
        try {
            const scriptObj = runtime.getCurrentScript();
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_subsidiary_af7_1' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_period_af7_1' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_format__af7_1' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_filecabinetid_af7_1' });
            const filterAnioPeriod = scriptObj.getParameter({ name: 'custscript_pe_anio_af7_1' });

            log.debug('MSK', 'filterSubsidiary = '+filterSubsidiary)
            log.debug('MSK', 'filterPostingPeriod = '+filterPostingPeriod)
            log.debug('MSK', 'filterFormat = '+filterFormat)
            log.debug('MSK', 'fileCabinetId = '+fileCabinetId)
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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Registro de Activos Fijos 7.1' });
            const recordlogid = recordlog.save();

            return { recordlogid: recordlogid, irecord: record };
        } catch (e) {
            log.error({ title: 'createRecord', details: e });
        }
    }

    const searchBook = (subsidiary, period, searchId, featureSubsidiary, anioperiod) => {
        log.debug('MSK', 'subsidiary:'+subsidiary+'|period:'+period+'|searchId:'+searchId+'|featureSubsidiary:'+featureSubsidiary+'|anioperiod:'+anioperiod)
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

            // const filterOne = search.createFilter({
            //     name: 'postingperiod',
            //     operator: search.Operator.ANYOF,
            //     values: period
            // });

            // filters.push(filterOne);

            if (featureSubsidiary) {
                const filterTwo = search.createFilter({
                    name: 'custrecord_deprhistsubsidiary',
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                });
                filters.push(filterTwo);
            }
            const searchResultCount = searchLoad.runPaged().count;
            const periodname = getPeriodName(period);
            log.debug('Count - MSK', "cantidad: "+searchResultCount)
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
                        const column08 = result.getValue(searchLoad.columns[7]);
                        const column09 = result.getValue(searchLoad.columns[8]);
                        const column10 = result.getValue(searchLoad.columns[9]);
                        const column11 = result.getValue(searchLoad.columns[10]);
                        const column12 = result.getValue(searchLoad.columns[11]);
                        const column13 = result.getValue(searchLoad.columns[12]);
                        const column14 = result.getValue(searchLoad.columns[13]);
                        const column15 = result.getValue(searchLoad.columns[14]);
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
                        const column26 = result.getValue(searchLoad.columns[25]);
                        const column27 = result.getValue(searchLoad.columns[26]);
                        var column28 = result.getValue(searchLoad.columns[27]);
                        const column29 = result.getValue(searchLoad.columns[28]);
                        const column30 = result.getValue(searchLoad.columns[29]);
                        var column31 = result.getValue(searchLoad.columns[30]);
                        const column32 = result.getValue(searchLoad.columns[31]);
                        const column33 = result.getValue(searchLoad.columns[32]);
                        const column34 = result.getValue(searchLoad.columns[33]);
                        const column35 = result.getValue(searchLoad.columns[34]);
                        const column36 = result.getValue(searchLoad.columns[35]);
                        const column37 = result.getValue(searchLoad.columns[36]);
                        
                        if(column28 == '.00' || column28 == '0'){
                            column28 = "0.00";
                        } else {
                            column28 = Number(column28).toFixed(2);
                        }

                        if(column31 == '.00' || column31 == '0'){
                            column31 = "0.00";
                        } else {
                            column31 = Number(column31).toFixed(2);
                        }
                        //log.debug('MSK','column06 = '+column06+', column07 = '+column07+', column08 = '+column08+', column09 = '+column09)
                        
                        if(column01==anioperiod+"0000"){
                            json.push({
                                c1_: column01,
                                c2_: column02,
                                c3_: column03,
                                c4_: column04,
                                c5_: column05,
                                c6_: (column06=="- None -"?"":column06),
                                c7_: (column07=="- None -"?"":column07),
                                c8_: column08,
                                c9_: (column09=="- None -"?"":column09),
                                c10_: column10,
                                c11_: column11,
                                c12_: column12,
                                c13_: column13,
                                c14_: column14,

                                c15_: (column15==".00"?"0.00": column15),
                                c16_: (column16==".00"?"0.00": column16),
                                c17_: (column17==".00"?"0.00": column17),
                                c18_: (column18==".00"?"0.00": column18),
                                c19_: (column19==".00"?"0.00": column19),
                                c20_: (column20==".00"?"0.00": column20),
                                c21_: (column21==".00"?"0.00": column21),
                                c22_: (column22==".00"?"0.00": column22),
                                c23_: (column23==".00"?"0.00": column23),

                                c24_: column24,
                                c25_: column25,
                                c26_: column26,
                                c27_: column27,
                                
                                c28_: column28,
                                c29_: parseFloat(column29==".00"?"0.00":column29).toFixed(2),
                                c30_: parseFloat(column30==".00"?"0.00":column30).toFixed(2),
                                c31_: column31,
                                
                                c32_: (column32==".00"?"0.00":numberWithCommas(column32)),
                                c33_: (column33==".00"?"0.00":numberWithCommas(column33)),
                                c34_: (column34==".00"?"0.00":numberWithCommas(column34)),
                                c35_: (column35==".00"?"0.00":numberWithCommas(column35)),
                                c36_: (column36==".00"?"0.00":numberWithCommas(column36)),
                                c37_: column37
                            });
                        }
                        
                        return true;
                    });

                    // log.debug('Json', json);//
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
                            const column27 = searchResult[j].getValue(searchLoad.columns[26]);
                            var column28 = searchResult[j].getValue(searchLoad.columns[27]);
                            const column29 = searchResult[j].getValue(searchLoad.columns[28]);
                            const column30 = searchResult[j].getValue(searchLoad.columns[29]);
                            var column31 = searchResult[j].getValue(searchLoad.columns[30]);
                            const column32 = searchResult[j].getValue(searchLoad.columns[31]);
                            const column33 = searchResult[j].getValue(searchLoad.columns[32]);
                            const column34 = searchResult[j].getValue(searchLoad.columns[33]);
                            const column35 = searchResult[j].getValue(searchLoad.columns[34]);
                            const column36 = searchResult[j].getValue(searchLoad.columns[35]);
                            const column37 = searchResult[j].getValue(searchLoad.columns[36]);

                            if(column28 == '.00' || column28 == '0'){
                                column28 = "0.00";
                            } else {
                                column28 = Number(column28).toFixed(2);
                            }
    
                            if(column31 == '.00' || column31 == '0'){
                                column31 = "0.00";
                            } else {
                                column31 = Number(column31).toFixed(2);
                            }

                            // log.debug('MSK','anioperiod-2 = '+anioperiod+', column01-2 = '+column01)
                            if(column01==anioperiod+"0000"){
                                json.push({
                                    c1_: column01,
                                    c2_: column02,
                                    c3_: column03,
                                    c4_: column04,
                                    c5_: column05,
                                    c6_: (column06=="- None -"?"":column06),
                                    c7_: (column07=="- None -"?"":column07),
                                    c8_: column08,
                                    c9_: (column09=="- None -"?"":column09),
                                    c10_: column10,
                                    c11_: column11,
                                    c12_: column12,
                                    c13_: column13,
                                    c14_: column14,
                                    
                                    c15_: (column15==".00"?"0.00": column15),
                                    c16_: (column16==".00"?"0.00": column16),
                                    c17_: (column17==".00"?"0.00": column17),
                                    c18_: (column18==".00"?"0.00": column18),
                                    c19_: (column19==".00"?"0.00": column19),
                                    c20_: (column20==".00"?"0.00": column20),
                                    c21_: (column21==".00"?"0.00": column21),
                                    c22_: (column22==".00"?"0.00": column22),
                                    c23_: (column23==".00"?"0.00": column23),

                                    c24_: column24,
                                    c25_: column25,
                                    c26_: column26,
                                    c27_: column27,
                                    
                                    c28_: column28,
                                    c29_: parseFloat(column29==".00"?"0.00":column29).toFixed(2),
                                    c30_: parseFloat(column30==".00"?"0.00":column30).toFixed(2),
                                    c31_: column31,
                                    
                                    c32_: (column32==".00"?"0.00": column32),
                                    c33_: (column33==".00"?"0.00": column33),
                                    c34_: (column34==".00"?"0.00": column34),
                                    c35_: (column35==".00"?"0.00": column35),
                                    c36_: (column36==".00"?"0.00": column36),
                                    c37_: column37
                                });
                            }
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
            log.debug('MSK', 'traza error:'+e)
            log.error({ title: 'searchBook', details: e });
        }
    }

    const structureBody = (searchResult) => {
        let contentReport = '';
        try {
            for (let i in searchResult) {
                contentReport =
                    contentReport + 
                    searchResult[i].c1_ + '|' + 
                    searchResult[i].c2_ + '|' + 
                    searchResult[i].c3_ + '|' +
                    searchResult[i].c4_ + '|' + 
                    searchResult[i].c5_ + '|' + 
                    searchResult[i].c6_ + '|' +
                    searchResult[i].c7_ + '|' + 
                    searchResult[i].c8_ + '|' + 
                    searchResult[i].c9_ + '|' +
                    searchResult[i].c10_ + '|' + 
                    searchResult[i].c11_ + '|' + 
                    searchResult[i].c12_ + '|' + 
                    searchResult[i].c13_ + '|' +
                    searchResult[i].c14_ + '|' + 
                    searchResult[i].c15_ + '|' + 
                    searchResult[i].c16_ + '|' +
                    searchResult[i].c17_ + '|' + 
                    searchResult[i].c18_ + '|' + 
                    searchResult[i].c19_ + '|' +
                    searchResult[i].c20_ + '|' + 
                    searchResult[i].c21_ + '|' + 
                    searchResult[i].c22_ + '|' + 
                    searchResult[i].c23_ + '|' +
                    searchResult[i].c24_ + '|' + 
                    searchResult[i].c25_ + '|' + 
                    searchResult[i].c26_ + '|' +
                    searchResult[i].c27_ + '|' + 
                    searchResult[i].c28_ + '|' + 
                    searchResult[i].c29_ + '|' +
                    searchResult[i].c30_ + '|' + 
                    searchResult[i].c31_ + '|' + 
                    searchResult[i].c32_ + '|' + 
                    searchResult[i].c33_ + '|' +
                    searchResult[i].c34_ + '|' + 
                    searchResult[i].c35_ + '|' + 
                    searchResult[i].c36_ + '|' +
                    searchResult[i].c37_ + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }

    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId, filterAnioPeriod) => {
        let typeformat;
        let periodname = filterAnioPeriod ;
        log.debug('MSK','periodname : '+periodname)
        const header = '1 PERIODO'
        +'|2 CUO'
        +'|3 CORRELATIVO'
        +'|4 CODIGO DE CATALOGO UTILIZADO'
        +'|5 CODIGO PROPIO DEL ACTIVO FIJO CORRESPONDIENTE AL CATALOGO SENALADO EN EL CAMPO 4'
        +'|6 CODIGO DE CATALOGO UTILIZADO'
        +'|7 CODIGO DE EXISTENCIA CORRESPONDIENTE AL CATALOGO SENALADO EN EL CAMPO 6'
        +'|8 CODIGO DEL TIPO DE ACTIVO FIJO (VALIDAR CON PARAMETRO TABLA 18)'
        +'|9 CODIGO DE LA CUENTA CONTABLE DEL ACTIVO FIJO'
        +'|10 ESTADO DEL ACTIVO FIJO (VALIDAR CON PARAMETRO TABLA 19)'
        +'|11 DESCRIPCION DEL ACTIVO FIJO'
        +'|12 MARCA DEL ACTIVO FIJO'
        +'|13 MODELO DEL ACTIVO FIJO'
        +'|14 NUMERO DE SERIE Y/O PLACA DEL ACTIVO FIJO'
        +'|15 IMPORTE DEL SALDO INICIAL DEL ACTIVO FIJO '
        +'|16 ADQUISICION'
        +'|17 IMPORTE DE LAS MEJORAS DEL ACTIVO FIJO'
        +'|18 IMPORTE DE LOS RETIROS Y/O BAJAS DEL ACTIVO FIJO'
        +'|19 IMPORTE POR OTROS AJUSTES EN EL VALOR DEL ACTIVO FIJO'
        +'|20 VALOR DE LA REVALUACION VOLUNTARIA EFECTUADA'
        +'|21 VALOR DE LA REVALUACION EFECTUADA POR REORGANIZACION DE SOCIEDADES'
        +'|22 VALOR DE OTRAS REVALUACIONES EFECTUADA'
        +'|23 IMPORTE DEL VALOR DEL AJUSTE POR INFLACION DEL ACTIVO FIJO'
        +'|24 FECHA DE ADQUISICION DEL ACTIVO FIJO'
        +'|25 FECHA DE INICIO DEL USO DEL ACTIVO FIJO'
        +'|26 CODIGO DEL MÉTODO APLICADO EN EL CALCULO DE LA DEPRECIACION'
        +'|27 NUMERO DE DOCUMENTO DE AUTORIZACION PARA CAMBIAR EL MÉTODO DE LA DEPRECIACION'
        +'|FORMULA (NUMÉRICA)'
        +'|29 DEPRECIACION ACUMULADA AL CIERRE DEL EJERCICIO ANTERIOR.'
        +'|30 VALOR DE LA DEPRECIACION DEL EJERCICIO SIN CONSIDERAR LA REVALUACION'
        +'|31 VALOR DE LA DEPRECIACION DEL EJERCICIO RELACIONADA CON LOS RETIROS Y/O BAJAS DEL ACTIVO FIJO'
        +'|32 VALOR DE LA DEPRECIACION RELACIONADA CON OTROS AJUSTES'
        +'|33 VALOR DE LA DEPRECIACION DE LA REVALUACION VOLUNTARIA EFECTUADA'
        +'|34 VALOR DE LA DEPRECIACION DE LA REVALUACION EFECTUADA POR REORGANIZACION DE SOCIEDADES'
        +'|35 VALOR DE LA DEPRECIACION DE OTRAS REVALUACIONES EFECTUADAS'
        +'|36 VALOR DEL AJUSTE POR INFLACION DE LA DEPRECIACION'
        +'|37 INDICA EL ESTADO DE LA OPERACION'
        +'|\n';
        try {
            //const periodname = getPeriodName(filterPostingPeriod);
            const periodostring = retornaPeriodoString(periodname);
            //Estructura: LERRRRRRRRRRRAAAA000007010000OIM1.TXT
            //let nameReportGenerated = 'LE' + fedIdNumb + periodname + '070100' + '00' + '1' + hasinfo + '11_' + recordlogid;//
            let nameReportGenerated = 'LE' + fedIdNumb + periodname+"0000" + '070100' + '00' + '1111_'+ recordlogid;
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
   
    const numberWithCommas = (x) => {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x))
          x = x.replace(pattern, "$1,$2");
      return x;
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

    return {
        execute: execute
    }
});