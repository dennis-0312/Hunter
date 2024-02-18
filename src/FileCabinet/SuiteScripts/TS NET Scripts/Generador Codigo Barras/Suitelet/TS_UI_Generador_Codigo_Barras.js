/**
 *@NApiVersion 2.x
*@NScriptType Suitelet
*/

define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/file', 'N/runtime'],
    function (serverWidget, search, redirect, file, runtime) {
        const SEARCH_FAM_ASSET = 'customsearch_ts_fam_asset';
        const PAGE_SIZE = 200;

        function onRequest(context) {
            try {
                if (context.request.method === 'GET') {
                    var form = serverWidget.createForm('Generador de codigo de Barras');
                    var resultBusqueda = false;
                    form.clientScriptModulePath = "./TS_CS_Generador_Codigo_Barras.js";
                    form.addSubmitButton('Filtrar');
                    form.addButton({ id: 'btn_cancelar', label: 'Limpiar Filtros', functionName: 'cancelar()' });
                    form.addButton({ id: 'btn_gene_report', label: 'Generar Codigo de Barra', functionName: 'generarCodBarr()' });

                    //Parametros
                    var pageId = parseInt(context.request.parameters.page);
                    var p_f_inicio = context.request.parameters.inicio;
                    if (p_f_inicio == undefined) p_f_inicio = '';
                    var p_f_fin = context.request.parameters.fin;
                    if (p_f_fin == undefined) p_f_fin = '';
                    var p_f_location = context.request.parameters.location;
                    if (p_f_location == undefined) p_f_location = '';
                    var p_f_estado = context.request.parameters.estado;
                    if (p_f_estado == undefined) p_f_estado = '';
                    var p_f_num_serie_disp = context.request.parameters.num_serie_disp;
                    if (p_f_num_serie_disp == undefined) p_f_num_serie_disp = '';
                    var p_f_bodega_activo = context.request.parameters.bodega_activo;
                    if (p_f_bodega_activo == undefined) p_f_bodega_activo = '';

                    if (p_f_inicio != '' || p_f_fin != '' || p_f_location != '' || p_f_estado != ''
                        || p_f_num_serie_disp != '' || p_f_bodega_activo != '') {
                        resultBusqueda = true;
                    }

                    // TAB 
                    form.addFieldGroup({ id: 'groupFilter', label: 'Filtros' });
                    form.addFieldGroup({ id: 'groupPaginado', label: 'Paginado' });

                    //Filtros
                    //Para activo fijo
                    var f_inicio = form.addField({ id: 'custpage_inicio', type: serverWidget.FieldType.DATE, label: 'Fecha Inicio', container: 'groupFilter' });
                    f_inicio.defaultValue = p_f_inicio;
                    var f_fin = form.addField({ id: 'custpage_fin', type: serverWidget.FieldType.DATE, label: 'Fecha Fin', container: 'groupFilter' });
                    f_fin.defaultValue = p_f_fin;
                    //Location
                    var f_location = form.addField({ id: 'custpage_location', type: serverWidget.FieldType.SELECT, label: 'OFICINA', container: 'groupFilter' });
                    f_location.addSelectOption({ value: '', text: 'Seleccione...' });
                    var resultsLocation = obtenerLocation();
                    resultsLocation.run().each(function (result) {
                        var internalid = result.id;
                        var name = result.getValue(resultsLocation.columns[1]);
                        f_location.addSelectOption({ value: internalid, text: name });
                        return true;
                    });
                    f_location.defaultValue = p_f_location;
                    //Status
                    var f_estado = form.addField({ id: 'custpage_estado', type: serverWidget.FieldType.SELECT, label: 'ESTADO DE ACTIVO', container: 'groupFilter' });
                    f_estado.addSelectOption({ value: '', text: 'Seleccione...' });
                    var resultsEstado = obtenerEstado();
                    resultsEstado.run().each(function (result) {
                        var internalid = result.id;
                        var name = result.getValue(resultsEstado.columns[1]);
                        f_estado.addSelectOption({ value: internalid, text: name });
                        return true;
                    });
                    f_estado.defaultValue = p_f_estado;
                    //Numero Serie Dispositivo
                    var f_num_serie_disp = form.addField({ id: 'custpage_num_serie_disp', type: serverWidget.FieldType.SELECT, label: 'Numero de Serie Dispositivo', container: 'groupFilter' });
                    f_num_serie_disp.addSelectOption({ value: '', text: 'Seleccione...' });
                    var resultsSerieDisp = obtenerSerieDisp();
                    resultsSerieDisp.run().each(function (result) {
                        var internalid = result.id;
                        var name = result.getValue(resultsSerieDisp.columns[1]);
                        f_num_serie_disp.addSelectOption({ value: internalid, text: name });
                        return true;
                    });
                    f_num_serie_disp.defaultValue = p_f_num_serie_disp;

                    //Bodega de Activo
                    var f_bodega_activo = form.addField({ id: 'custpage_bodega_activo', type: serverWidget.FieldType.SELECT, label: 'Bodega Activo', container: 'groupFilter' });
                    f_bodega_activo.addSelectOption({ value: '', text: 'Seleccione...' });
                    var resultsBodegaActivo = obtenerBodegaActivo();
                    resultsBodegaActivo.run().each(function (result) {
                        var internalid = result.id;
                        var name = result.getValue(resultsBodegaActivo.columns[1]);
                        f_bodega_activo.addSelectOption({ value: internalid, text: name });
                        return true;
                    });
                    f_bodega_activo.defaultValue = p_f_bodega_activo;


                    form.addTab({ id: 'custpage_tab1', label: 'Resultado de la Busqueda' });
                    form.addTab({ id: 'custpage_tab2', label: 'Log de Generacion' });


                    /** RESULTADOS */
                    var sublist1 = form.addSublist({ id: 'sublist1', type: serverWidget.SublistType.LIST, label: 'Resultados de la búsqueda', tab: 'custpage_tab1' });
                    sublist1.addMarkAllButtons();
                    sublist1.addField({ id: 'list1_check', type: serverWidget.FieldType.CHECKBOX, label: 'CHECK' });
                    //sublist1.addField({ id: 'list1_internalid', type: serverWidget.FieldType.TEXT, label: 'INTERNAL ID' });
                    sublist1.addField({ id: 'list1_id', type: serverWidget.FieldType.TEXT, label: 'ID' });
                    sublist1.addField({ id: 'list1_name', type: serverWidget.FieldType.TEXT, label: 'NOMBRE' });
                    sublist1.addField({ id: 'list1_num_serie_activo', type: serverWidget.FieldType.TEXT, label: 'NUMERO DE SERIE DEL ACTIVO' });
                    sublist1.addField({ id: 'list1_tipo_activo', type: serverWidget.FieldType.TEXT, label: 'TIPO DE ACTIVO' });
                    sublist1.addField({ id: 'list1_estado', type: serverWidget.FieldType.TEXT, label: 'ESTADO DE ACTIVO' });
                    sublist1.addField({ id: 'list1_cod_barra', type: serverWidget.FieldType.TEXT, label: 'CODIGO DE BARRA' });
                    sublist1.addField({ id: 'list1_fecha_act_fijo', type: serverWidget.FieldType.TEXT, label: 'FECHA INGRESO ACTIVO FIJO' });
                    sublist1.addField({ id: 'list1_num_serie_disp', type: serverWidget.FieldType.TEXT, label: 'NUM. SERIE DISPOSITIVO' });
                    sublist1.addField({ id: 'list1_bodega_activo', type: serverWidget.FieldType.TEXT, label: 'BODEGA DE ACTIVO' });

                    var sublist2 = form.addSublist({ id: 'sublist2', type: serverWidget.SublistType.STATICLIST, label: 'Log de Generacion', tab: 'custpage_tab2' });
                    sublist2.addRefreshButton();

                    sublist2.addField({ id: 'list2_propietario', type: serverWidget.FieldType.TEXT, label: 'PROPIETARIO' });
                    sublist2.addField({ id: 'list2_fecha_create', type: serverWidget.FieldType.TEXT, label: 'FECHA DE CREACION' });
                    sublist2.addField({ id: 'list2_estado', type: serverWidget.FieldType.TEXT, label: 'ESTADO' });
                    sublist2.addField({ id: 'list2_descarga', type: serverWidget.FieldType.TEXT, label: 'DESCARGAR' });

                    //Inicio LOG
                    var userObj = runtime.getCurrentUser();
                    log.error('userObj.id', userObj.id)

                    var search_Log = search.load({
                        id: 'customsearch_ht_log_barra_cod'
                    });

                    var filters = search_Log.filters;

                    var filter_user = search.createFilter({
                        name: 'owner',
                        operator: search.Operator.ANYOF,
                        values: userObj.id
                    });
                    filters.push(filter_user);

                    var log_cod_barra = search_Log.run(); //.getRange({start: pageId*10,end: pageId*10+10});
                    var j = 0;
                    log_cod_barra.each(function (result) {
                        var propie = result.getText(log_cod_barra.columns[0]);
                        var fecha_crea = result.getValue(log_cod_barra.columns[1]);
                        var estado_log = result.getValue(log_cod_barra.columns[2]);
                        var file_log = result.getValue(log_cod_barra.columns[3]);

                        sublist2.setSublistValue({
                            id: 'list2_propietario',
                            line: j,
                            value: propie
                        });
                        sublist2.setSublistValue({
                            id: 'list2_fecha_create',
                            line: j,
                            value: fecha_crea
                        });
                        sublist2.setSublistValue({
                            id: 'list2_estado',
                            line: j,
                            value: estado_log
                        });

                        if (file_log.substr(0, 4) != "http") {
                            sublist2.setSublistValue({
                                id: 'list2_descarga',
                                line: j,
                                value: 'No Data' //txtLink
                            });
                        } else {
                            sublist2.setSublistValue({
                                id: 'list2_descarga',
                                line: j,
                                value: "<a href='" + file_log + "'>Descargar</a>" //txtLink
                            });
                        }
                        j = j + 1;
                        return true
                    });
                    //FIN LOG

                    var searchLoad = obtenerFAM(p_f_inicio, p_f_fin, p_f_location, p_f_estado, p_f_num_serie_disp, p_f_bodega_activo);

                    /* ---------------------------- INICIO PAGINADO ---------------------------- */
                    var retrieveSearch = searchLoad.runPaged({ pageSize: PAGE_SIZE });
                    var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);

                    if (!pageId || pageId == '' || pageId < 0) {
                        pageId = 0;
                    } else if (pageId >= pageCount) {
                        pageId = pageCount - 1;
                    }

                    var selectOptions = form.addField({ id: 'custpage_pageid', type: serverWidget.FieldType.SELECT, label: 'Página', container: 'groupPaginado' });

                    if (resultBusqueda) {
                        for (i = 0; i < pageCount; i++) {
                            if (i == pageId) {
                                selectOptions.addSelectOption({
                                    value: 'pageid_' + i,
                                    text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
                                    isSelected: true
                                });
                            } else {
                                selectOptions.addSelectOption({
                                    value: 'pageid_' + i,
                                    text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE)
                                });
                            }
                        }

                        if (retrieveSearch.count != 0) {
                            var searchPage = retrieveSearch.fetch({ index: pageId });
                            var i = 0;

                            searchPage.data.forEach(function (result) {
                                var column00 = result.getValue(searchLoad.columns[0]) || ' ';
                                var column01 = result.getValue(searchLoad.columns[1]) || ' ';
                                var column02 = result.getValue(searchLoad.columns[2]) || ' ';
                                var column03 = result.getValue(searchLoad.columns[5]) || ' ';
                                var column04 = result.getText(searchLoad.columns[6]) || ' ';
                                var column05 = result.getText(searchLoad.columns[9]) || ' ';
                                var column06 = result.getValue(searchLoad.columns[10]) || ' ';
                                var column07 = result.getValue(searchLoad.columns[11]) || ' ';
                                var column08 = result.getText(searchLoad.columns[12]) || ' ';
                                var column09 = result.getText(searchLoad.columns[13]) || ' ';

                                //sublist1.setSublistValue({ id: 'list1_internalid', line: i, value: column00 });
                                sublist1.setSublistValue({ id: 'list1_id', line: i, value: column01 });
                                sublist1.setSublistValue({ id: 'list1_name', line: i, value: column02 });
                                sublist1.setSublistValue({ id: 'list1_num_serie_activo', line: i, value: column03 });
                                sublist1.setSublistValue({ id: 'list1_tipo_activo', line: i, value: column04 });
                                sublist1.setSublistValue({ id: 'list1_estado', line: i, value: column05 });
                                sublist1.setSublistValue({ id: 'list1_cod_barra', line: i, value: column06 });
                                sublist1.setSublistValue({ id: 'list1_fecha_act_fijo', line: i, value: column07 });
                                sublist1.setSublistValue({ id: 'list1_num_serie_disp', line: i, value: column08 });
                                sublist1.setSublistValue({ id: 'list1_bodega_activo', line: i, value: column09 });

                                i++
                                return true
                            });

                        }
                    }

                    context.response.writePage(form);
                } else {

                    const get_inicio = context.request.parameters.custpage_inicio;
                    const get_fin = context.request.parameters.custpage_fin;
                    const get_location = context.request.parameters.custpage_location;
                    const get_estado = context.request.parameters.custpage_estado;
                    const get_num_serie_disp = context.request.parameters.custpage_num_serie_disp;
                    const get_pageid = context.request.parameters.custpage_pageid;
                    const get_bodega_activo = context.request.parameters.custpage_bodega_activo;

                    var my_parameters = {
                        //flag: 1,
                        inicio: get_inicio,
                        fin: get_fin,
                        location: get_location,
                        estado: get_estado,
                        num_serie_disp: get_num_serie_disp,
                        bodega_activo: get_bodega_activo,
                        page: get_pageid
                    }



                    redirect.toSuitelet({
                        scriptId: 'customscript_ts_ui_generador_codig_barra',
                        deploymentId: 'customdeploy_ts_ui_generador_codig_barra',
                        parameters: my_parameters
                    });

                }
            } catch (e) {
                log.error('Error en onRequest', e);
            }
        }

        function obtenerLocation() {
            try {
                var busqLocation = search.create({
                    type: "location",
                    filters: [["isinactive", "is", "F"]],
                    columns: ['internalid', 'name']
                });
                return busqLocation;

            } catch (e) {
                log.error('Error en obtenerLocation', e);
            }
        }

        function obtenerEstado() {
            try {
                var busqEstado = search.create({
                    type: "customlist_ncfar_assetstatus",
                    filters: [["isinactive", "is", "F"]],
                    columns: ['internalid', 'name']
                });
                return busqEstado;

            } catch (e) {
                log.error('Error en obtenerLocation', e);
            }
        }

        function obtenerSerieDisp() {
            try {
                var busqEstado = search.create({
                    type: "customrecord_ht_record_mantchaser",
                    filters: [["isinactive", "is", "F"]],
                    columns: ['internalid', 'name']
                });
                return busqEstado;

            } catch (e) {
                log.error('Error en obtenerLocation', e);
            }
        }

        function obtenerBodegaActivo() {
            try {
                var busqEstado = search.create({
                    type: "customlist_ht_af_bodegaactivo",
                    filters: [["isinactive", "is", "F"]],
                    columns: ['internalid', 'name']
                });
                return busqEstado;

            } catch (e) {
                log.error('Error en obtenerLocation', e);
            }
        }

        function obtenerFAM(_inicio, _fin, _location, _estado, _num_serie_disp, _bodega_activo) {
            try {

                var loadSearchFAM = search.load({ id: SEARCH_FAM_ASSET });

                if (_inicio) {
                    loadSearchFAM.filters.push(search.createFilter({
                        name: 'custrecord_ht_af_fechaingresoaf',
                        operator: search.Operator.ONORAFTER,
                        values: [_inicio]
                    }));
                }
                if (_fin) {
                    loadSearchFAM.filters.push(search.createFilter({
                        name: 'custrecord_ht_af_fechaingresoaf',
                        operator: search.Operator.ONORBEFORE,
                        values: [_fin]
                    }));
                }
                if (_location) {
                    loadSearchFAM.filters.push(search.createFilter({
                        name: 'custrecord_assetlocation',
                        operator: search.Operator.ANYOF,
                        values: [_location]
                    }));
                }
                if (_estado) {
                    loadSearchFAM.filters.push(search.createFilter({
                        name: 'custrecord_assetstatus',
                        operator: search.Operator.ANYOF,
                        values: [_estado]
                    }));
                }
                if (_num_serie_disp) {
                    loadSearchFAM.filters.push(search.createFilter({
                        name: 'custrecord_nmero_de_serie_dispositivo',
                        operator: search.Operator.ANYOF,
                        values: [_num_serie_disp]
                    }));
                }
                if (_bodega_activo) {
                    loadSearchFAM.filters.push(search.createFilter({
                        name: 'custrecord_ht_af_bodegaactivo',
                        operator: search.Operator.ANYOF,
                        values: [_bodega_activo]
                    }));
                }

                return loadSearchFAM;

            } catch (e) {
                log.error('Error en obtenerArticulos', e);
            }

        }

        return {
            onRequest: onRequest
        }
    });