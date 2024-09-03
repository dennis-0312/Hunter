/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/config', 'N/error', 'N/file', 'N/log', 'N/query', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/task', 'N/ui/dialog', 'N/ui/message', 'N/ui/serverWidget'],
    /**
 * @param{config} config
 * @param{error} error
 * @param{file} file
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{redirect} redirect
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 * @param{dialog} dialog
 * @param{message} message
 * @param{serverWidget} serverWidget
 */
    (config, error, file, log, query, record, redirect, runtime, search, task, dialog, message, serverWidget) => {
        const PAGE_SIZE = 1000;
        const SEARCH_ID = 'customsearch_ec_emision_masiva_fac_inter'; //EC Emisión Masiva de Facturas Internas - PRODUCCIÓN
        const userRecord = runtime.getCurrentUser();
        const currentScript = runtime.getCurrentScript();
        const CARGAR_LISTA = 'cargarLista';
        const LOG_RECORD = 'customrecord_ht_cr_fac_inter_lote';
        const PENDIENTE = '3';
        const FACTURAS_INTERNAS_RESULTS_SEARCH = 2998 //Factura Interna Lote - PRODUCCIÓN - SB:3042 - PR:2998
        const ANULACION_FACTURAS_INTERNAS_RESULTS_SEARCH = 2999 //Factura Interna Lote - PRODUCCIÓN - SB:3042 - PR:2999
        const SEARCH_ID2 = 'customsearch_ec_void_masiva_fac_inter'; //EC Anulación Masiva de Facturas Internas - PRODUCCIÓN
        let cargarLista = 0
        const inputfolder = 18064 //SB:16794 - PR:18064
        const outputfolder = 18065 //SB:16795 - PR:18065
        const inputfoldervoid = 18060 //SB:20072 - PR:18060
        const outputfoldervoid = 18061 //SB:20073 - PR:18061
        const PROCESS_EMISION = 2;
        const PROCESS_ANULACION = 1;

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                let method = scriptContext.request.method;
                let deploymentId = currentScript.deploymentId;
                if (deploymentId == "customdeploy_ts_sl_factura_interna_bulk") {
                    if (method == 'GET') {
                        //log.debug('userRecord', userRecord);
                        mainView(scriptContext);
                    } else {
                        processData(scriptContext, PROCESS_EMISION);
                        if (userRecord.id == 4) {
                            redirect.toSuitelet({
                                scriptId: 'customscript_ts_sl_factura_interna_bulk',
                                deploymentId: 'customdeploy_ts_sl_factura_interna_bulk',
                                parameters: {}
                            });
                        } else {
                            redirect.toSavedSearchResult({ id: FACTURAS_INTERNAS_RESULTS_SEARCH });
                        }
                    }
                }

                if (deploymentId == "customdeploy_ts_sl_factura_interna_void") {
                    if (method == 'GET') {
                        //log.debug('userRecord', userRecord);
                        mainViewVoid(scriptContext);
                    } else {
                        processData(scriptContext, PROCESS_ANULACION);
                        redirect.toSavedSearchResult({ id: ANULACION_FACTURAS_INTERNAS_RESULTS_SEARCH });
                    }
                }
            } catch (error) {
                log.error('Error', error);
            }
        }

        //* ---------------------------- EMISION FACTURA MASIVA ---------------------------- */
        const mainView = (body) => {
            try {
                let form = serverWidget.createForm({ title: 'Emisión Masiva de Facturas Internas' });
                form.clientScriptModulePath = '../client/TS_CS_Factura_Interna_Bulk.js';

                //& ---------------------------- RECUPERACIÓN DE PARAMETROS ---------------------------- */
                let pageId = parseInt(body.request.parameters.page);
                cargarLista = typeof body.request.parameters.paramCargarLista != 'undefined' ? body.request.parameters.paramCargarLista : 0;
                // log.debug('cargarLista', cargarLista)
                desde = typeof body.request.parameters.paramDesde != 'undefined' ? body.request.parameters.paramDesde : 0;
                hasta = typeof body.request.parameters.paramHasta != 'undefined' ? body.request.parameters.paramHasta : 0;
                log.debug('fechas1', `${desde}-${hasta}`);
                cliente = typeof body.request.parameters.paramCliente != 'undefined' ? body.request.parameters.paramCliente : 0;
                clientetxt = typeof body.request.parameters.paramClientetxt != 'undefined' ? body.request.parameters.paramClientetxt : 0;
                let nameButton = 'Procesar';

                //& ---------------------------- VALIDACIÓN DE CONFIGURACIÓN ---------------------------- */
                let companyInfo = config.load({ type: config.Type.COMPANY_INFORMATION });
                const URL = companyInfo.getValue({ fieldId: 'appurl' });
                // log.debug('URL', URL);
                // log.debug('userRecord.subsidiary', userRecord.subsidiary);
                if (userRecord.subsidiary.length == 0)
                    return body.response.write('No tienes configurado una subsidiaria en su registro de usuario. Ingrese una subsidiaria y luego reinicie sesión.');

                //& ---------------------------- CAMPOS FLAG ---------------------------- */
                let field_inputfolder = form.addField({ id: 'custpage_field_inputfolder', type: serverWidget.FieldType.TEXT, label: "Inputfolder" });
                field_inputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                field_inputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_inputfolder.defaultValue = inputfolder;

                let field_outputfolder = form.addField({ id: 'custpage_field_outputfolder', type: serverWidget.FieldType.TEXT, label: "Outputfolder" });
                field_outputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                field_outputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_outputfolder.defaultValue = outputfolder;

                let field_clientetxt = form.addField({ id: 'custpage_field_clientetxt', type: serverWidget.FieldType.TEXT, label: "Cliente TXT" });
                field_clientetxt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                field_clientetxt.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                let field_urlenviroment = form.addField({ id: 'custpage_field_urlenviroment', type: serverWidget.FieldType.TEXT, label: "URL" });
                field_urlenviroment.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                field_urlenviroment.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_urlenviroment.defaultValue = URL;

                //& ---------------------------- CAMPOS DE FILTRO ---------------------------- */
                form.addFieldGroup({ id: 'fieldgroup_filtros', label: 'Filtros' });

                let clienteField = form.addField({ id: 'custpage_field_cliente', type: serverWidget.FieldType.SELECT, source: 'customer', label: 'Cliente', container: 'fieldgroup_filtros' });
                if (cliente.length != 0 && cliente != 0) {
                    clienteField.defaultValue = cliente;
                    field_clientetxt.defaultValue = clientetxt;
                }

                let fechaDesdeField = form.addField({ id: 'custpage_field_fecha_desde', type: serverWidget.FieldType.DATE, label: 'Fec. Desde', container: 'fieldgroup_filtros' });
                fechaDesdeField.isMandatory = true;
                if (desde.length != 0 && desde != 0)
                    fechaDesdeField.defaultValue = new Date(desde);

                let fechaHastaField = form.addField({ id: 'custpage_field_fecha_hasta', type: serverWidget.FieldType.DATE, label: 'Fec. Hasta', container: 'fieldgroup_filtros' });
                fechaHastaField.isMandatory = true;
                if (hasta.length != 0 && hasta != 0)
                    fechaHastaField.defaultValue = new Date(hasta);

                //& ---------------------------- SUBLISTA ---------------------------- */
                form.addTab({ id: 'tab_orden_servicio', label: 'Órdenes de Servicio' });
                let sublist = form.addSublist({ id: 'sublist', type: serverWidget.SublistType.LIST, label: 'Órdenes de Servicio', tab: 'tab_orden_servicio' });
                sublist.addMarkAllButtons();
                sublist.addField({ id: 'sublist_field_seleccion', type: serverWidget.FieldType.CHECKBOX, label: '#' });
                let fielf_id = sublist.addField({ id: 'sublist_field_internalid', type: serverWidget.FieldType.TEXT, label: 'ID' });
                fielf_id.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                sublist.addField({ id: 'sublist_field_nrodoc', type: serverWidget.FieldType.TEXT, label: 'N° Documento' });
                sublist.addField({ id: 'sublist_field_fecha', type: serverWidget.FieldType.TEXT, label: 'Fecha' });
                sublist.addField({ id: 'sublist_field_cliente', type: serverWidget.FieldType.TEXT, label: 'Cliente' });
                sublist.addField({ id: 'sublist_field_importe', type: serverWidget.FieldType.CURRENCY, label: 'Importe' });

                //& ---------------------------- CAMPOS DE RESULTANDO ---------------------------- */
                form.addFieldGroup({ id: 'fieldgroup_results', label: 'Resultados' });
                let selectOptions = form.addField({ id: 'custpage_pageid', label: 'Página', type: serverWidget.FieldType.SELECT, container: 'fieldgroup_results' });
                let totalResultadodsField = form.addField({ id: 'custpage_field_totalresultados', type: serverWidget.FieldType.INTEGER, label: 'Total', container: 'fieldgroup_results' });
                totalResultadodsField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                if (cargarLista === CARGAR_LISTA) {
                    //& ---------------------------- PAGINADO DE RESULTADOS ---------------------------- */
                    let retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE, desde, hasta, cliente);
                    totalResultadodsField.defaultValue = retrieveSearch.count;
                    if (retrieveSearch.count > 0) {
                        let pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);

                        if (!pageId || pageId == '' || pageId < 0)
                            pageId = 0;
                        else if (pageId >= pageCount)
                            pageId = pageCount - 1;


                        for (i = 0; i < pageCount; i++) {
                            if (i == pageId) {
                                selectOptions.addSelectOption({ value: 'pageid_' + i, text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE), isSelected: true });
                            } else {
                                selectOptions.addSelectOption({ value: 'pageid_' + i, text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE) });
                            }
                        }

                        //& ---------------------------- CARGA DE RESULTADOS ---------------------------- */
                        let addResults = fetchSearchResult(retrieveSearch, pageId);
                        let j = 0;
                        addResults.forEach((result) => {
                            sublist.setSublistValue({ id: 'sublist_field_internalid', line: j, value: result.id });
                            sublist.setSublistValue({ id: 'sublist_field_nrodoc', line: j, value: result.tranid });
                            sublist.setSublistValue({ id: 'sublist_field_fecha', line: j, value: result.trandate });
                            sublist.setSublistValue({ id: 'sublist_field_cliente', line: j, value: result.cliente });
                            sublist.setSublistValue({ id: 'sublist_field_importe', line: j, value: result.importe });
                            j++
                        });
                    }
                } else {
                    if (!pageId || pageId == '' || pageId < 0)
                        pageId = 0;
                }

                //& ---------------------------- BUTTONS ---------------------------- */
                form.addSubmitButton(nameButton);
                //form.addButton({ id: 'btnFiltrar', label: 'Buscar', functionName: 'viewResults' });
                //form.addButton({ id: 'btnClean', label: 'Limpiar Filtros', functionName: 'cleanFilters' });

                //& ---------------------------- RESPONSE WRITEPAGE ---------------------------- */
                body.response.writePage(form);
            } catch (error) {
                log.error('Error-viewUploadFile', error);
            }
        }

        const processData = (body, process) => {
            log.debug('START', '|========================= START =========================|')
            let objMain = new Object();
            let objDataSend = new Object();
            let inputfolder = body.request.parameters.custpage_field_inputfolder;
            let sublistData = body.request.parameters.sublistdata;
            const delimiter = /\u0002/;
            sublistData = sublistData.split(delimiter);
            let logRecordid = createRecord(process);
            let recordTask = jsonRequest(sublistData, logRecordid, inputfolder, objMain);
            objDataSend.recordId = recordTask;
            taskScheduled(objDataSend, process);
            log.error('objDataSend', objDataSend);
            log.debug('END', '|========================== END ==========================|')
        }

        const jsonRequest = (sublistData, logRecordid, inputfolder) => {
            let json = new Array();
            try {
                for (let j in sublistData) {
                    let newarray = sublistData[j];
                    newarray = newarray.split('\u0001');
                    if (newarray[0] == 'T') { json.push(newarray[1]) }
                }
                log.debug('JSON', json);
                let fileid = saveJson(json, logRecordid, inputfolder);
                log.debug('fileid', fileid);
                let recordId = record.submitFields({
                    type: LOG_RECORD,
                    id: logRecordid,
                    values: { custrecord_ht_fibulk_input: fileid }
                })
                return recordId;
            } catch (error) {
                log.error('Error-jsonRequest', error);
            }
        }

        const taskScheduled = (objDataSend, process) => {
            try {
                if (process == PROCESS_EMISION) {
                    const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    mrTask.scriptId = 'customscript_ts_sc_factura_interna_bulk';
                    mrTask.deploymentId = 'customdeploy_ts_sc_factura_interna_bulk';
                    mrTask.params = {
                        custscript_ts_sc_fibulk_lote_id: objDataSend.recordId,
                        custscript_ts_sc_fibulk_punto_inicial: 0,
                        custscript_ts_sc_fibulk_countproccesstotal: 0,
                        custscript_ts_sc_fibulk_retorno: JSON.stringify(new Object())
                    }
                    let taskToken = mrTask.submit();
                    log.error('taskToken', taskToken);
                }

                if (process == PROCESS_ANULACION) {
                    const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    mrTask.scriptId = 'customscript_ts_sc_factura_interna_void';
                    mrTask.deploymentId = 'customdeploy_ts_sc_factura_interna_void';
                    mrTask.params = { custscript_ts_sc_fivoid_lote_id: objDataSend.recordId }
                    let taskToken = mrTask.submit();
                    log.error('taskToken', taskToken);
                }
            } catch (error) {
                log.error('Error-taskScheduled', error);
            }
        }

        const runSearch = (searchId, searchPageSize, desde, hasta, cliente) => {
            let searchObj = search.load({ id: searchId });
            let filters = searchObj.filters;
            if (desde != 0 && hasta != 0) {
                desde = formatDate2(desde);
                hasta = formatDate2(hasta);
                log.debug('EnterFilterFechas2', desde + ' - ' + hasta)
                const filterFechas = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [desde, hasta] });
                filters.push(filterFechas);
            }

            if (cliente != 0) {
                log.debug('EnterFilterCliente', cliente)
                const filterCliente = search.createFilter({ name: 'internalid', join: "customermain", operator: search.Operator.ANYOF, values: cliente });
                filters.push(filterCliente);
            }
            return searchObj.runPaged({ pageSize: searchPageSize });
        }

        const fetchSearchResult = (pagedData, pageIndex) => {
            let results = new Array();
            let searchPage = pagedData.fetch({ index: pageIndex });
            searchPage.data.forEach((result) => {
                let internalId = result.id;
                let tranid = result.getValue({ name: 'tranid' }).length > 0 ? result.getValue({ name: 'tranid' }) : ' ';
                let trandate = result.getValue({ name: 'trandate' }).length > 0 ? result.getValue({ name: 'trandate' }) : ' ';
                let cliente = result.getValue(pagedData.searchDefinition.columns[2]);
                let importe = result.getValue(pagedData.searchDefinition.columns[3]);

                results.push({
                    id: internalId,
                    tranid: tranid,
                    trandate: trandate,
                    cliente: cliente,
                    importe: importe

                });
            });
            return results;
        }

        const createRecord = (process) => {
            let recordlog = record.create({ type: LOG_RECORD, isDynamic: true });
            recordlog.setValue({ fieldId: 'custrecord_ht_fibulk_estado', value: PENDIENTE });
            recordlog.setValue({ fieldId: 'custrecord_ht_fibulk_proceso', value: process });
            let recordlogid = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true });
            return recordlogid;
        }

        const sysDate = () => {
            let date = new Date();
            var tdate = date.getDate();
            tdate = Number(tdate) < 10 ? `0${tdate}` : tdate;
            var month = date.getMonth() + 1;
            month = Number(month) < 10 ? `0${month}` : month;
            var year = date.getFullYear();
            return currentDate = `${tdate}${month}${year}`;
        }

        const formatDate2 = (fecha) => {
            const fechaISO = "2024-08-09T05:00:00.000Z";
            const date = new Date(fecha);
            const dia = String(date.getUTCDate()).padStart(2, '0');
            const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
            const anio = date.getUTCFullYear();
            return fechaFormateada = `${dia}/${mes}/${anio}`;
        }

        const saveJson = (contents, nombre, folder) => {
            let fecha = sysDate();
            let fileObj = file.create({
                name: `lote${nombre}_${fecha}.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: folder,
                isOnline: false
            });
            return fileObj.save();
        }

        //* ---------------------------- EMISION FACTURA MASIVA ---------------------------- */

        //* ---------------------------- ANULACIÓN FACTURA MASIVA ---------------------------- */
        const mainViewVoid = (body) => {
            try {
                let form = serverWidget.createForm({ title: 'Anulación Masiva de Facturas Internas' });
                form.clientScriptModulePath = '../client/TS_CS_Factura_Interna_Void.js';

                //& ---------------------------- RECUPERACIÓN DE PARAMETROS ---------------------------- */
                let pageId = parseInt(body.request.parameters.page);
                cargarLista = typeof body.request.parameters.paramCargarLista != 'undefined' ? body.request.parameters.paramCargarLista : 0;
                desde = typeof body.request.parameters.paramDesde != 'undefined' ? body.request.parameters.paramDesde : 0;
                hasta = typeof body.request.parameters.paramHasta != 'undefined' ? body.request.parameters.paramHasta : 0;
                log.debug('fechas1', `${desde}-${hasta}`);
                cliente = typeof body.request.parameters.paramCliente != 'undefined' ? body.request.parameters.paramCliente : 0;
                clientetxt = typeof body.request.parameters.paramClientetxt != 'undefined' ? body.request.parameters.paramClientetxt : 0;
                ordenServicio = typeof body.request.parameters.paramOrdenServicio != 'undefined' ? body.request.parameters.paramOrdenServicio : 0;
                nroCuota = typeof body.request.parameters.paramNroCuota != 'undefined' ? body.request.parameters.paramNroCuota : 0;
                let nameButton = 'Procesar';

                //& ---------------------------- VALIDACIÓN DE CONFIGURACIÓN ---------------------------- */
                let companyInfo = config.load({ type: config.Type.COMPANY_INFORMATION });
                const URL = companyInfo.getValue({ fieldId: 'appurl' });
                if (userRecord.subsidiary.length == 0)
                    return body.response.write('No tienes configurado una subsidiaria en su registro de usuario. Ingrese una subsidiaria y luego reinicie sesión.');

                //& ---------------------------- CAMPOS FLAG ---------------------------- */
                let field_inputfolder = form.addField({ id: 'custpage_field_inputfolder', type: serverWidget.FieldType.TEXT, label: "Inputfolder" });
                field_inputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                field_inputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_inputfolder.defaultValue = inputfoldervoid;

                let field_outputfolder = form.addField({ id: 'custpage_field_outputfolder', type: serverWidget.FieldType.TEXT, label: "Outputfolder" });
                field_outputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                field_outputfolder.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_outputfolder.defaultValue = outputfoldervoid;

                let field_urlenviroment = form.addField({ id: 'custpage_field_urlenviroment', type: serverWidget.FieldType.TEXT, label: "URL" });
                field_urlenviroment.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                field_urlenviroment.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                field_urlenviroment.defaultValue = URL;

                //& ---------------------------- CAMPOS DE FILTRO ---------------------------- */
                form.addFieldGroup({ id: 'fieldgroup_filtros', label: 'Filtros' });

                let clienteField = form.addField({ id: 'custpage_field_cliente', type: serverWidget.FieldType.SELECT, source: 'customer', label: 'Cliente', container: 'fieldgroup_filtros' });
                if (cliente.length != 0 && cliente != 0)
                    clienteField.defaultValue = cliente;

                let fechaDesdeField = form.addField({ id: 'custpage_field_fecha_desde', type: serverWidget.FieldType.DATE, label: 'Fec. Desde', container: 'fieldgroup_filtros' });
                fechaDesdeField.isMandatory = true;
                if (desde.length != 0 && desde != 0)
                    fechaDesdeField.defaultValue = new Date(desde);

                let fechaHastaField = form.addField({ id: 'custpage_field_fecha_hasta', type: serverWidget.FieldType.DATE, label: 'Fec. Hasta', container: 'fieldgroup_filtros' });
                fechaHastaField.isMandatory = true;
                if (hasta.length != 0 && hasta != 0)
                    fechaHastaField.defaultValue = new Date(hasta);

                let ordenServicioField = form.addField({ id: 'custpage_field_orden_servicio', type: serverWidget.FieldType.TEXT, label: 'Orden de Servicio', container: 'fieldgroup_filtros' });
                if (ordenServicio.length != 0 && ordenServicio != 0)
                    ordenServicioField.defaultValue = ordenServicio;

                let nroCuotaField = form.addField({ id: 'custpage_field_nrocuota', type: serverWidget.FieldType.INTEGER, label: 'N° Cuota', container: 'fieldgroup_filtros' });
                if (nroCuota.length != 0 && nroCuota != 0)
                    nroCuotaField.defaultValue = nroCuota;

                //& ---------------------------- SUBLISTA ---------------------------- */
                form.addTab({ id: 'tab_orden_servicio', label: 'Órdenes de Servicio' });
                let sublist = form.addSublist({ id: 'sublist', type: serverWidget.SublistType.LIST, label: 'Órdenes de Servicio', tab: 'tab_orden_servicio' });
                sublist.addMarkAllButtons();
                sublist.addField({ id: 'sublist_field_seleccion', type: serverWidget.FieldType.CHECKBOX, label: '#' });
                let fielf_id = sublist.addField({ id: 'sublist_field_internalid', type: serverWidget.FieldType.TEXT, label: 'ID' });
                fielf_id.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                sublist.addField({ id: 'sublist_field_nrodoc', type: serverWidget.FieldType.TEXT, label: 'N° Documento' });
                sublist.addField({ id: 'sublist_field_orden', type: serverWidget.FieldType.TEXT, label: 'Orden Servicio' });
                sublist.addField({ id: 'sublist_field_fecha', type: serverWidget.FieldType.TEXT, label: 'Fecha' });
                sublist.addField({ id: 'sublist_field_cliente', type: serverWidget.FieldType.TEXT, label: 'Cliente' });
                sublist.addField({ id: 'sublist_field_estado', type: serverWidget.FieldType.TEXT, label: 'Estado' });
                sublist.addField({ id: 'sublist_field_cuota', type: serverWidget.FieldType.TEXT, label: 'N° Cuota' });
                sublist.addField({ id: 'sublist_field_importe', type: serverWidget.FieldType.CURRENCY, label: 'Importe' });

                //& ---------------------------- CAMPOS DE RESULTANDO ---------------------------- */
                form.addFieldGroup({ id: 'fieldgroup_results', label: 'Resultados' });
                let selectOptions = form.addField({ id: 'custpage_pageid', label: 'Página', type: serverWidget.FieldType.SELECT, container: 'fieldgroup_results' });
                let totalResultadodsField = form.addField({ id: 'custpage_field_totalresultados', type: serverWidget.FieldType.INTEGER, label: 'Total', container: 'fieldgroup_results' });
                totalResultadodsField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                if (cargarLista === CARGAR_LISTA) {
                    //& ---------------------------- PAGINADO DE RESULTADOS ---------------------------- */
                    let retrieveSearch = runSearch2(SEARCH_ID2, PAGE_SIZE, desde, hasta, cliente, ordenServicio, nroCuota);
                    totalResultadodsField.defaultValue = retrieveSearch.count;
                    if (retrieveSearch.count > 0) {
                        let pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);

                        if (!pageId || pageId == '' || pageId < 0)
                            pageId = 0;
                        else if (pageId >= pageCount)
                            pageId = pageCount - 1;


                        for (i = 0; i < pageCount; i++) {
                            if (i == pageId) {
                                selectOptions.addSelectOption({ value: 'pageid_' + i, text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE), isSelected: true });
                            } else {
                                selectOptions.addSelectOption({ value: 'pageid_' + i, text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE) });
                            }
                        }

                        //& ---------------------------- CARGA DE RESULTADOS ---------------------------- */
                        let addResults = fetchSearchResult2(retrieveSearch, pageId);
                        let j = 0;
                        addResults.forEach((result) => {
                            sublist.setSublistValue({ id: 'sublist_field_internalid', line: j, value: result.id });
                            sublist.setSublistValue({ id: 'sublist_field_nrodoc', line: j, value: result.tranid });
                            sublist.setSublistValue({ id: 'sublist_field_orden', line: j, value: result.orden });
                            sublist.setSublistValue({ id: 'sublist_field_fecha', line: j, value: result.trandate });
                            sublist.setSublistValue({ id: 'sublist_field_cliente', line: j, value: result.cliente });
                            sublist.setSublistValue({ id: 'sublist_field_estado', line: j, value: result.estado });
                            sublist.setSublistValue({ id: 'sublist_field_cuota', line: j, value: result.cuota });
                            sublist.setSublistValue({ id: 'sublist_field_importe', line: j, value: result.importe });
                            j++
                        });
                    }
                } else {
                    if (!pageId || pageId == '' || pageId < 0)
                        pageId = 0;
                }

                //& ---------------------------- BUTTONS ---------------------------- */
                form.addSubmitButton(nameButton);

                //& ---------------------------- RESPONSE WRITEPAGE ---------------------------- */
                body.response.writePage(form);
            } catch (error) {
                log.error('Error-viewUploadFile', error);
            }
        }

        const runSearch2 = (searchId, searchPageSize, desde, hasta, cliente, ordenServicio, nroCuota) => {
            let searchObj = search.load({ id: searchId });
            let filters = searchObj.filters;
            if (desde != 0 && hasta != 0) {
                desde = formatDate2(desde);
                hasta = formatDate2(hasta);
                log.debug('EnterFilterFechas2', desde + ' - ' + hasta)
                const filterFechas = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [desde, hasta] });
                filters.push(filterFechas);
            }

            if (cliente != 0) {
                log.debug('EnterFilterCliente', cliente)
                const filterCliente = search.createFilter({ name: 'internalid', join: "customermain", operator: search.Operator.ANYOF, values: cliente });
                filters.push(filterCliente);
            }

            if (ordenServicio != 0) {
                //["custbody_ec_created_from_fac_int.numbertext","is","OS1001000383992"]
                log.debug('EnterFilterordenServicio', ordenServicio)
                const filterOenServicio = search.createFilter({ name: 'numbertext', join: 'custbody_ec_created_from_fac_int', operator: search.Operator.ANYOF, values: ordenServicio });
                filters.push(filterOenServicio);
            }

            if (nroCuota != 0) {
                log.debug('EnterFilternroCuota', nroCuota)
                const filterNroCuota = search.createFilter({ name: 'custbody_ec_nro_cuota_fac_int', operator: search.Operator.EQUALTO, values: nroCuota });
                filters.push(filterNroCuota);
            }

            return searchObj.runPaged({ pageSize: searchPageSize });
        }

        const fetchSearchResult2 = (pagedData, pageIndex) => {
            let results = new Array();
            let searchPage = pagedData.fetch({ index: pageIndex });
            searchPage.data.forEach((result) => {
                let internalId = result.id;
                let tranid = result.getValue({ name: 'tranid' }).length > 0 ? result.getValue({ name: 'tranid' }) : ' ';
                let orden = result.getText({ name: 'custbody_ec_created_from_fac_int' }).length > 0 ? result.getText({ name: 'custbody_ec_created_from_fac_int' }) : ' ';
                let trandate = result.getValue({ name: 'trandate' }).length > 0 ? result.getValue({ name: 'trandate' }) : ' ';
                let cliente = result.getValue(pagedData.searchDefinition.columns[3]);
                let estado = result.getText(pagedData.searchDefinition.columns[4]);
                let cuota = result.getValue(pagedData.searchDefinition.columns[5]).length > 0 ? result.getValue(pagedData.searchDefinition.columns[5]) : ' ';
                let importe = result.getValue(pagedData.searchDefinition.columns[6]);

                results.push({
                    id: internalId,
                    tranid: tranid,
                    orden: orden,
                    trandate: trandate,
                    cliente: cliente,
                    estado: estado,
                    cuota: cuota,
                    importe: importe,


                });
            });
            return results;
        }



        //* ---------------------------- ANULACIÓN FACTURA MASIVA ---------------------------- */


        return { onRequest }

    });
