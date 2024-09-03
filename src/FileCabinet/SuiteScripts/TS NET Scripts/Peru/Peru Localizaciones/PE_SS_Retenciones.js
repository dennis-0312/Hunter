/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 
 * Task                         Date            Author                                      Remarks
 * Reporte de Retenciones       21 Ago 2023     Ivan Morales <imorales@myevol.biz>          Reporte de Retenciones
 */
 define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config", "N/format"], (search, record, runtime, log, file, task, config, format) => {

    function execute(context) {
        try {
            const featureSubsidiary = runtime.isFeatureInEffect({ feature: 'SUBSIDIARIES' });
            const searchId = 'customsearch_pe_reporte_comprobantes_ret';//ID de mi Búsqueda guardada
            var logrecodId = 'customrecord_pe_generation_logs';
            let fedIdNumb = '';
            let hasinfo = 0;

            const params = getParams();
            log.debug('params', params);
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

        }
        catch (e) {
            log.error({ title: 'ErrorInExecute', details: e });
            setError(createrecord.irecord, logrecodId, createrecord.recordlogid, e)
        }
    }

    const getParams = () => {
        try {
            const scriptObj = runtime.getCurrentScript();
            const filterSubsidiary = scriptObj.getParameter({ name: 'custscript_pe_subsidiary_retenciones' });
            const filterPostingPeriod = scriptObj.getParameter({ name: 'custscript_pe_period_retenciones' });
            const filterFormat = scriptObj.getParameter({ name: 'custscript_pe_format_retenciones' });
            let ini_var = scriptObj.getParameter({ name: 'custscript_pe_ini_retenciones' });//0
            const fileCabinetId = scriptObj.getParameter({ name: 'custscript_pe_filecabinetid_retenciones' });
            ini_var = parseInt(ini_var)

            return {
                filterSubsidiary: filterSubsidiary,
                filterPostingPeriod: filterPostingPeriod,
                filterFormat: filterFormat,
                ini_var: ini_var,
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
            recordlog.setValue({ fieldId: 'custrecord_pe_book_log', value: 'Reporte de Retenciones' });
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

        // log.debug('MSK', 'subsidiary = '+subsidiary)
        // log.debug('MSK', 'featureSubsidiary = '+featureSubsidiary)
        let ruc_subsidiaria = getRUC(subsidiary)
        // log.debug('MSK', 'ruc_subsidiaria = '+ruc_subsidiaria)
        try {
            const searchLoad = search.load({ id: searchId });
            let filters = searchLoad.filters;
            const filterOne = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: period });
            filters.push(filterOne);

            if (featureSubsidiary) {
                const filterTwo = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: subsidiary });
                filters.push(filterTwo);
            }

            const searchResultCount = searchLoad.runPaged().count;
            log.debug('Count', searchResultCount)//
            if (searchResultCount != 0) {
                if (searchResultCount <= 4000) {
                    searchLoad.run().each((result) => {
                        const column01 = result.getValue(searchLoad.columns[0]);//Document Number
                        const column03 = result.getValue(searchLoad.columns[2]);//Amount
                        const column09 = result.getValue(searchLoad.columns[8]);//Factura
                        //const column10 = Number(result.getValue(searchLoad.columns[9])).toFixed(2);
                        let column11 = Number(result.getValue(searchLoad.columns[10]));//Total Transaccion
                        if(column11 < 0){
                            column11 = column11 * (-1);
                        }
                        const column12 = result.getValue(searchLoad.columns[11]);//Fecha Factura
                        const column13 = result.getValue(searchLoad.columns[12]);//
                        const column18 = result.getValue(searchLoad.columns[17]);//Comprobante de Retención
                        const column16 = result.getValue(searchLoad.columns[15]);//Razón Social
                        const column02 = result.getValue(searchLoad.columns[1]);//Fecha de Emisión
                        const column19 = result.getValue(searchLoad.columns[18]);//Tipo Comprobante de Pago
                        const column08 = result.getValue(searchLoad.columns[7]);//Serie
                        const column15 = result.getValue(searchLoad.columns[14]);//RUC Proveedor

                        column11 = column11.toFixed(2);
                        /*
                        let column10 = TotalDetraccion(column08);
                        column10 = column10.toFixed(2);
                        */

                        json.push({
                            ruc: column15,
                            ret_serie: column01.split('-')[0],
                            ret_correlativo: column01.split('-')[1],
                            ret_importe: column11,
                            ref_femisionp: column12,
                            ref_tipo: column09.split('-')[0] == "FA" ? "01" : column09.split('-')[0] == "NC" ? "07" : column09.split('-')[0] == "ND" ? "08" : "01",
                            ref_seriep: column08.split('-')[1],
                            ref_numero: column09.split('-')[2],
                            ref_fecha: column13,
                            //ref_valor: column10,
                            ref_valor: column03,
                            ref_rete: column18,
                            ref_razonsocial: column16,
                            ref_femision: column02,
                            ref_comprobante: column19,
                            ret_correlativop: column08.split('-')[2],
                        });
                        return true;
                    });

                    log.debug('Json', json);//
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
                            const column03 = searchResult[j].getValue(searchLoad.columns[2]);
                            const column09 = result.getValue(searchLoad.columns[8]);//Factura
                            //const column10 = Number(result.getValue(searchLoad.columns[9])).toFixed(2);
                            let column11 = Number(result.getValue(searchLoad.columns[10]));
                            if(column11 < 0){
                                column11 = column11 * (-1);
                            }
                            const column12 = result.getValue(searchLoad.columns[11]);//Fecha Factura
                            const column13 = result.getValue(searchLoad.columns[12]);//
                            const column18 = result.getValue(searchLoad.columns[17]);//Comprobante de Retención
                            const column16 = result.getValue(searchLoad.columns[15]);//Razón Social
                            const column02 = result.getValue(searchLoad.columns[1]);//Fecha de Emisión
                            const column19 = result.getValue(searchLoad.columns[18]);//Tipo Comprobante de Pago
                            const column08 = result.getValue(searchLoad.columns[7]);//Serie
                            const column15 = result.getValue(searchLoad.columns[14]);//RUC Proveedor
                            
                            
                            column11 = column11.toFixed(2);
                            /*
                            let column10 = TotalDetraccion(column08);
                            column10 = column10.toFixed(2);
                            */

                            json.push({
                                ruc: column15,
                                ret_serie: column01.split('-')[0],
                                ret_correlativo: column01.split('-')[1],
                                ret_importe: column11,
                                ref_femisionp: column12,
                                ref_tipo: column09.split('-')[0] == "FA" ? "01" : column09.split('-')[0] == "NC" ? "07" : column09.split('-')[0] == "ND" ? "08" : "01",
                                ref_seriep: column08.split('-')[1],
                                ref_numero: column09.split('-')[2],
                                ref_fecha: column13,
                                //ref_valor: column10,
                                ref_valor: column03,
                                ref_rete: column18,
                                ref_razonsocial: column16,
                                ref_femision: column02,
                                ref_comprobante: column19,
                                ret_correlativop: column08.split('-')[2],
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
                    contentReport +
                    searchResult[i].ruc + '|' +
                    searchResult[i].ref_razonsocial + '|' + '|' + '|' + '|' +
                    searchResult[i].ret_serie + '|' +
                    searchResult[i].ret_correlativo + '|' +
                    searchResult[i].ref_femision + '|' +
                    searchResult[i].ret_importe + '|' +
                    // searchResult[i].ref_comprobante + '|' +
                    searchResult[i].ref_tipo + '|' +
                    searchResult[i].ref_seriep + '|' +
                    searchResult[i].ret_correlativop + '|' +
                    searchResult[i].ref_femisionp + '|' +
                    searchResult[i].ref_valor
                    // + '|' 
                    // +
                    // searchResult[i].c4_fecha + '|' + searchResult[i].c5_cuenta_contable + '|' + searchResult[i].c6_descripcion + '|' +
                    // searchResult[i].c7_suma_valor_contable + '|' + searchResult[i].c8_estado_operacion + '|' + searchResult[i].c9_ind_estado_operacion + '|' +
                    // searchResult[i].c10_anio 
                    + '|\n';
            }

            return contentReport;
        } catch (e) {
            log.error({ title: 'structureBody', details: e });
        }
    }

    const createFile = (filterPostingPeriod, fedIdNumb, hasinfo, recordlogid, filterFormat, structuregbody, fileCabinetId) => {
        let typeformat;
        const header = 'N° DE RUC AGENTE DE RETENCION|SERIE|NUMERO|F. EMISIÓN|MONTO|TIPO|SERIE |NUMERO|F.EMISIÓN|VALORTOTAL|\n'
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
            const periodostring = periodoFinDate.getFullYear() + CompletarCero(2, periodoFinDate.getMonth() + 1);
            // const periodname = getPeriodName(filterPostingPeriod);
            // const periodostring = retornaPeriodoString(periodname);

            // log.debug('MSK', 'periodname = '+periodname)
            log.debug('MSK', 'periodostring = ' + periodostring)

            const PDT = '0626'
            const RUC = fedIdNumb
            const PERIODO = periodostring
            let nameReportGenerated = PDT + RUC + PERIODO
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
                for (var i = lengthStrValor; i < tamano; i++) {
                    nuevoValor = '0' + nuevoValor;
                }
            }
            return nuevoValor;
        } else {
            return nuevoValor.substring(0, tamano);
        }
    }

    const retornaPeriodoString = (campoRegistro01) => {
        if (campoRegistro01 >= '') {
            var valorAnio = campoRegistro01.split(' ')[1];
            var valorMes = campoRegistro01.split(' ')[0];
            valorMes = valorMes.toLowerCase()
            if (valorMes.indexOf('jan') >= 0 || valorMes.indexOf('ene') >= 0) {
                valorMes = '01';
            } else {
                if (valorMes.indexOf('feb') >= 0) {
                    valorMes = '02';
                } else {
                    if (valorMes.indexOf('mar') >= 0) {
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
            campoRegistro01 = valorAnio + valorMes;
        }
        return campoRegistro01;
    }

    const convertDate = (fecha) => {
        // Convertir la fecha a un objeto Date
        var date = new Date(fecha);

        // Obtener el día, el mes y el año de la fecha
        var day = date.getDate();
        var month = date.getMonth() + 1; // Los meses en JavaScript empiezan en 0
        var year = date.getFullYear();

        // Convertir el día, el mes y el año a cadenas de caracteres
        var dayString = day.toString();
        var monthString = month.toString();
        var yearString = year.toString();

        // Añadir ceros a la izquierda si es necesario
        if (dayString.length === 1) {
            dayString = "0" + dayString;
        }
        if (monthString.length === 1) {
            monthString = "0" + monthString;
        }
        return `${dayString}/${monthString}/${yearString}`;
    }

    const TotalDetraccion = (numTransaccion) => {
        //log.debug('numTransaccion',numTransaccion)
        var idTransaccion = 0;
        var montoDetraccion = 0
        var vendorbillSearchObj = search.create({
            type: "vendorbill",
            filters:
                [
                    ["type", "anyof", "VendBill"],
                    "AND",
                    ["formulatext: {number}", "is", numTransaccion],
                    "AND",
                    ["mainline", "is", "T"]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "ID interno" })
                ]
        });
        var searchResultCount = vendorbillSearchObj.runPaged().count;

        if (searchResultCount != 0) {
            const searchResult = vendorbillSearchObj.run().getRange({ start: 0, end: 1 });
            idTransaccion = searchResult[0].getValue(vendorbillSearchObj.columns[0]);
        }

        //log.debug('idTransaccion',idTransaccion);
        if(idTransaccion != 0){
            var Factura = record.load({
                type: record.Type.VENDOR_BILL, // Tipo de registro Vendor Credit 
                id: idTransaccion, // Reemplaza con el ID de tu registro Vendor Credit
                isDynamic: false
            });

            var linksCount = Factura.getLineCount({ sublistId: 'links' });
            //log.debug('linksCount',linksCount);
            for (var i = 0; i < linksCount; i++){
                var tipo_transa = Factura.getSublistValue({ sublistId: 'links', fieldId: 'type', line: i });
                var montoLinks = Factura.getSublistValue({ sublistId: 'links', fieldId: 'total', line: i });
                if(tipo_transa == 'Crédito de factura'){
                    montoDetraccion = montoDetraccion + montoLinks;
                }
            }

        }

        return montoDetraccion
    }

    return {
        execute: execute
    }
});