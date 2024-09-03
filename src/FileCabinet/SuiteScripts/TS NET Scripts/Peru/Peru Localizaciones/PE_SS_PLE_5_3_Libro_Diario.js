/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  ||
||   This script for PLE mensual Libro Diario 5.3 (Detalle Plan de Contable Utilizado)                              ||
||                                                                                                                  ||
||   File Name: PE_SC_PLE_5_3_Libro_Diario.js                                                                       ||
||                                                                                                                  ||
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  ||
||   03          1.1         25/12/2021      Script 2.1         PROD             ? - pendiente calcular             ||
||                                                                                                                  ||
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */

define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {
    // Schedule Report: Mensual: Libro Mayor 5.3
    const execute = (context) => {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_libro_diario_5_3';
            var logrecodId = 'customrecord_pe_generation_logs';
            let fedIdNumb = '';
            let hasinfo = 0;

            const params = getParams();
            log.debug('Parametros', params);
            if (featureSubsidiary) {
                const getruc = getRUC(params.filterSubsidiary)
                fedIdNumb = getruc;
            } else {
                const employerid = getEmployerID();
                fedIdNumb = employerid;
            }
            var createrecord = createRecord(logrecodId, featureSubsidiary, params.filterSubsidiary, params.filterPostingPeriod);
            const searchbook = searchBook(params.filterSubsidiary,params.filterPostingPeriod, searchId, featureSubsidiary);

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
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_3_libro_diario_sb' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_3_libro_diario_pe' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_3_libro_diario_fr' });
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_ss_ple_5_3_libro_diario_fl' });
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
            // const hoy = sysDate();
            // const period = func (hoy.year,hoy.month)
            const recordlog = record.create({ type: logrecodId });
            if (featureSubsidiary) {
                recordlog.setValue({ fieldId: 'custrecord_pe_subsidiary_log', value: filterSubsidiary });
            }
            recordlog.setValue({ fieldId: 'custrecord_pe_period_log', value: filterPostingPeriod});
            recordlog.setValue({ fieldId: 'custrecord_pe_status_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_report_log', value: "Procesando..." });
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Libro Mayor 5.3' });
            const recordlogid = recordlog.save();

            return { recordlogid: recordlogid, irecord: record };
        } catch (e) {
            log.error({ title: 'createRecord', details: e });
        }
    }


    const searchBook = (subsidiary, period,searchId, featureSubsidiary) => {
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
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                });
                filters.push(filterTwo);
            }

            const searchResultCount = searchLoad.runPaged().count;
            const periodname = getPeriodName(period);
            const periodostring = retornaPeriodoStringForView(periodname);
            const PeriodoCompleto = func(periodostring.valorAnio, periodostring.valorMes);
            log.debug('Count', searchResultCount)
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
                        let column08 = result.getValue(searchLoad.columns[7]);
                        if (column08 == '00') {
                            column08 = ''
                        }
                        const column09 = result.getValue(searchLoad.columns[8]);
                        const column10 = result.getValue(searchLoad.columns[9]);
                        const column11 = result.getValue(searchLoad.columns[10]);

                        json.push({
                            c1_periodo: PeriodoCompleto,
                            c2_cuo: column02,
                            c3_nro_correlativo_asiento: column03,
                            c4_cod_cuenta_contable: column04,
                            c5_cod_unidad_op: column05,
                            c6_centro_costo: column06,
                            c7_tipo_moneda: column07,
                            c8_tipo_doc_entidad_emi: column08,
                            c9_nro_doc_entidad_emi: column09,
                            c10_tipo_comprobante: column10,
                            c11_nro_serie_comprobante: column11
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


                            json.push({
                                c1_periodo: PeriodoCompleto,
                                c2_cuo: column02,
                                c3_nro_correlativo_asiento: column03,
                                c4_cod_cuenta_contable: column04,
                                c5_cod_unidad_op: column05,
                                c6_centro_costo: column06,
                                c7_tipo_moneda: column07,
                                c8_tipo_doc_entidad_emi: column08,
                                c9_nro_doc_entidad_emi: column09,
                                c10_tipo_comprobante: column10,
                                c11_nro_serie_comprobante: column11

                            });
                        }
                        start = start + 1000;
                        end = end + 1000;
                    }
                    return { thereisinfo: 1, content: json };
                }
            } else {
				
				//!Data Prueba - Inicio
				// json.push({
							// c1_periodo: '202212',
							// c2_cuo: 'R CUENTA PUENTE',
							// c3_nro_correlativo_asiento: '',
							// c4_cod_cuenta_contable: '01',
							// c5_cod_unidad_op: 'PLAN CONTABLE GENERAL EMPRESARIAL',
							// c6_centro_costo: '',
							// c7_tipo_moneda: '',
							// c8_tipo_doc_entidad_emi: '1',
							// c9_nro_doc_entidad_emi: '14',
							// c10_tipo_comprobante: 'Balance',
							// c11_nro_serie_comprobante: 'Banco'

						// });
				// return { thereisinfo: 1, content: json };
				//!Data Prueba - Fin
				
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
                    searchResult[i].c10_tipo_comprobante + '|' + searchResult[i].c11_nro_serie_comprobante + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }


    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
         const header = '1 Periodo|2 CUO|3 Numero correlativo del asiento|4 Codigo de la cuenta contable|5 Codigo de Unidad de Operacion|6 Centro de Costo|7 Tipo de Moneda de Origen|8 Tipo de documento de identidad del emisor' +
          '|9 Numero de documento de identidad del emisor|10 Tipo de Comprobante|11 Numero de Serie del comprobante de Pago|\n';
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
			
            let nameReportGenerated = 'LE' + fedIdNumb + periodostring + '050300' + '00' + '1' + hasinfo + '11_' + recordlogid;
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
            log.debug('periodname',period + '-' + filterPostingPeriod);
            return period;
        } catch (e) {
            log.error({ title: 'getPeriodName', details: e });
        }
    }


    function retornaPeriodoString(campoRegistro01) {
        try {
            if (campoRegistro01 >= '') {
                var valorAnio = campoRegistro01.split(' ')[1];
                var valorMes = campoRegistro01.split(' ')[0].toLowerCase();
                if (valorMes.indexOf('jan') >= 0 || valorMes.indexOf('ene') >= 0) {
                    valorMes = '01';
                } else {
                    if (valorMes.indexOf('feb') >= 0 || valorMes.indexOf('feb') >= 0) {
                        valorMes = '02';
                    } else {
                        if (valorMes.indexOf('mar') >= 0 ) {
                            valorMes = '03';
                        } else {
                            if (valorMes.indexOf('abr') >= 0 || valorMes.indexOf('apr') >= 0) {
                                valorMes = '04';
                            } else {
                                if (valorMes.indexOf('may') >= 0) {
                                    valorMes = '05';
                                } else {
                                    if (valorMes.indexOf('jun') >= 0) {
                                        valorMes = '06';
                                    } else {
                                        if (valorMes.indexOf('jul') >= 0) {
                                            valorMes = '07';
                                        } else {
                                            if (valorMes.indexOf('aug') >= 0 || valorMes.indexOf('ago') >= 0) {
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
        } catch (e) {
            log.error({ title: 'retornaPeriodoString', details: e });
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

    const retornaPeriodoStringForView = (campoRegistro01) => {
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

    const sysDate = () => {

        try {

            let date = new Date();
            var day = date.getDate();
            var month = date.getMonth() + 1; // jan = 0
            var year = date.getFullYear();
            // return currentDate = day + '/' + month + '/' + year;
            return{
                year : year , 
                month : month
            }

        } catch (e) {
            log.error('Error-sysDate', e);

        }

    }

    return {
        execute: execute
    }
});


/***************************************************************************************************************
TRACKING
/***************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 28/10/2021
Author: Dennis Fernández
Description: Creación del script.
==============================================================================================================*/
/* Commit:02
Version: 1.0
Date: 
Author: 
Description:
==============================================================================================================*/
/* Commit:03
Version: 1.1
Date: 25/12/2021
Author: Dennis Fernandez R.
Description: Se modifica vista de periodo contable
==============================================================================================================*/
