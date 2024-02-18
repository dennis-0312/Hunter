/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/log', 'N/search', 'N/runtime', 'N/redirect', 'N/task'], (serverWidget, log, search, runtime, redirect, task) => {
    const SEARCH = 'customsearch_estados_orden_venta';
    const LONGITUD_PAGINA = 10;
    const onRequest = (scriptContext) => {
        try {
            let recuperarBusqueda;
            let parametrofechadesde = '';
            let parametrofechahasta = '';
            let conteoPagina = '';
            let parametroordenvid = '';
            let k;
            let accion;

            let paginaId = parseInt(scriptContext.request.parameters.paginaId);

            if (typeof scriptContext.request.parameters.accion != 'undefined') {
                accion = scriptContext.request.parameters.accion;
                if (accion == 1) {
                    parametrofechadesde = scriptContext.request.parameters.fechaDesde;
                    parametrofechahasta = scriptContext.request.parameters.fechaHasta;
                    parametroordenvid = scriptContext.request.parameters.ordenvid;
                    log.debug('Debug', typeof parametroordenvid);
                }
            }

            if (scriptContext.request.method === 'GET') {
                let form = serverWidget.createForm({ title: 'Actualizar Estados Orden de Venta' });
                form.clientScriptModulePath = 'SuiteScripts/Capacitación/NS_CS_Estados_Orden_Venta.js';

                var grupo1 = form.addFieldGroup({
                    id: 'fieldgroupid',
                    label: 'Filtros Grupo 1'
                });

                form.addField({
                    id: 'fecha_desde',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Desde',
                    container: 'fieldgroupid'
                });

                let fecha_desde_flag = form.addField({
                    id: 'fecha_desde_flag',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Fecha Desde Flag',
                    container: 'fieldgroupid'
                });
                fecha_desde_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                form.addField({
                    id: 'fecha_hasta',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Hasta',
                    container: 'fieldgroupid'
                });

                let fecha_hasta_flag = form.addField({
                    id: 'fecha_hasta_flag',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Fecha Hasta Flag',
                    container: 'fieldgroupid'
                });
                fecha_hasta_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                var grupo2 = form.addFieldGroup({
                    id: 'fieldgroupid2',
                    label: 'Filtros Grupo 2'
                });

                let listaov = form.addField({
                    id: 'listaordenventa',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Orden de Venta',
                    container: 'fieldgroupid2'
                });
                listaov.addSelectOption({
                    value: -1,
                    text: 'Seleccione...'
                });

                let miBusqueda = search.load({ id: SEARCH });
                miBusqueda.run().each(function (result) {
                    let val = result.getValue(miBusqueda.columns[0]);
                    let text = result.getValue(miBusqueda.columns[1]);
                    listaov.addSelectOption({
                        value: val,
                        text: text
                    });
                    return true;
                });

                let listaov_flag = form.addField({
                    id: 'listaov_flag',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Orden Venta ID Flag',
                    container: 'fieldgroupid2'
                });
                listaov_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                listaov_flag.defaultValue = parametroordenvid;

                var grupo3 = form.addFieldGroup({
                    id: 'fieldgroupid3',
                    label: 'Paginado'
                });

                let sublist = form.addSublist({
                    id: 'sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Lista Ordenes de Venta'
                });
                sublist.addRefreshButton();
                sublist.addMarkAllButtons();

                sublist.addField({
                    id: 'campocheckbox',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Confirmar'
                });

                sublist.addField({
                    id: 'campo1',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ID'
                });

                sublist.addField({
                    id: 'campo2',
                    type: serverWidget.FieldType.TEXT,
                    label: 'NUMERO DOCUMENTO'
                });

                sublist.addField({
                    id: 'campo3',
                    type: serverWidget.FieldType.TEXT,
                    label: 'CLIENTE'
                });

                sublist.addField({
                    id: 'campo4',
                    type: serverWidget.FieldType.TEXT,
                    label: 'FECHA'
                });

                sublist.addField({
                    id: 'campo5',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ESTADO OV'
                });

                sublist.addField({
                    id: 'campo6',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ESTADO ACTIVIDAD'
                });

                let indice_pagina = form.addField({
                    id: 'custpage_pagina',
                    type: serverWidget.FieldType.SELECT,
                    label: 'INDICE DE PAGINA',
                    container: 'fieldgroupid3'
                });

                if (accion == 1) {
                    fecha_desde_flag.defaultValue = parametrofechadesde;
                    fecha_hasta_flag.defaultValue = parametrofechahasta;

                    //!PROCESO FILTRADO
                    recuperarBusqueda = runSearch(accion, parametrofechadesde, parametrofechahasta, parametroordenvid);
                    conteoPagina = Math.ceil(recuperarBusqueda.count / LONGITUD_PAGINA);
                    if (!paginaId || paginaId == '' || paginaId < 0) {
                        paginaId = 0;
                    } else if (paginaId >= conteoPagina) {
                        paginaId = conteoPagina - 1;
                    }

                    //*LONGITUD_PAGINA = 10
                    for (let j = 0; j < conteoPagina; j++) {
                        if (j == paginaId) {
                            indice_pagina.addSelectOption({
                                value: 'paginaid_' + j,
                                text: ((j * LONGITUD_PAGINA) + 1) + ' al ' + ((j + 1) * LONGITUD_PAGINA), //* = 1 al 10 // = 11 al 20 // = 21 al 30
                                isSelected: true
                            });
                        } else {
                            indice_pagina.addSelectOption({
                                value: 'paginaid_' + j,
                                text: ((j * LONGITUD_PAGINA) + 1) + ' al ' + ((j + 1) * LONGITUD_PAGINA)
                            });
                        }
                    }

                    if (recuperarBusqueda.count != 0) {
                        k = 0;
                        let resultados = busquedaResultados(recuperarBusqueda, paginaId);

                        resultados.forEach(function (result) {
                            sublist.setSublistValue({
                                id: 'campo1',
                                line: k,
                                value: result.id
                            });

                            sublist.setSublistValue({
                                id: 'campo2',
                                line: k,
                                value: result.numero_documento
                            });

                            sublist.setSublistValue({
                                id: 'campo3',
                                line: k,
                                value: result.cliente
                            });

                            sublist.setSublistValue({
                                id: 'campo4',
                                line: k,
                                value: result.fecha
                            });

                            sublist.setSublistValue({
                                id: 'campo5',
                                line: k,
                                value: result.estadoov
                            });

                            sublist.setSublistValue({
                                id: 'campo6',
                                line: k,
                                value: result.estadoactividad
                            });
                            k++
                        });
                    }
                }

                form.addSubmitButton({ label: 'Enviar' });
                scriptContext.response.writePage(form);
            } else {
                const delimiter = /\u0002/;
                const sublistData = scriptContext.request.parameters.sublistdata.split(delimiter);
                let idOVs = getData(sublistData);
                log.debug('Request', idOVs);
                let miTarea = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_ns_ss_estados_ov',
                    deploymentId: 'customdeploy_ns_ss_estados_ov',
                    params: {
                        'custscript_parametrorecuperado': idOVs
                    }
                });
                let tokenTarea = miTarea.submit();
                log.debug('Token', tokenTarea);
                redirect.toSuitelet({
                    scriptId: 'customscript_ns_ui_estados_orden_venta',
                    deploymentId: 'customdeploy_ns_ui_estado_orden_venta',
                    parameters: {}
                });
            }
        } catch (error) {
            log.error('Error', error);
        }


        function getData(sublistData) {
            let json = new Array();
            for (let i in sublistData) {
                let nuevoArreglo = sublistData[i];
                nuevoArreglo = nuevoArreglo.split('\u0001');
                //*"T\u00012\u0001OV-0000002\u0001Cliente Persona 1\u000105/07/2022\u0001Facturación pendiente\u0001Actividad Completada",
                //! ['T'], [2], ['OV-0000002]...

                if (nuevoArreglo[0] == 'T') {
                    json.push({
                        id: nuevoArreglo[1]
                    });

                }
            }
            return json;
        }


        //*BUSQUEDA
        function runSearch(accion, fechadesde, fechahasta, ordenvid) {
            let miBusqueda = search.load({ id: SEARCH });
            let filtros = miBusqueda.filters;
            if (accion == 1) {
                if (fechadesde.length != 0) {
                    let primerFiltro = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [fechadesde, fechahasta] });
                    filtros.push(primerFiltro);
                }

                if (ordenvid != -1 && ordenvid.length != 0) {
                    let segundoFiltro = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: ordenvid });
                    filtros.push(segundoFiltro);
                }
            }
            let pagedData = miBusqueda.runPaged({ pageSize: LONGITUD_PAGINA });
            return pagedData;
        }


        function busquedaResultados(recuperarBusqueda, paginaId) {
            let busquedaPagina = recuperarBusqueda.fetch({ index: paginaId });
            let results = new Array();

            busquedaPagina.data.forEach(function (result) {
                let id = result.getValue({ name: 'internalid', summary: "GROUP" });
                let numero_documento = result.getValue({ name: 'tranid', summary: "GROUP" });
                let cliente = result.getValue({ name: 'altname', join: "customer", summary: "GROUP" });
                let fecha = result.getValue({ name: 'trandate', summary: "GROUP" });
                let estadoov = result.getText({ name: 'statusref', summary: "GROUP" });
                let estadoactividad = result.getValue({ name: 'formulatext', summary: "GROUP", formula: "CASE WHEN {shipcomplete} = 'T' THEN 'Actividad Completada' WHEN {shipcomplete} = 'F' THEN 'Actividad Pendiente' END ", });

                results.push({
                    id: id,
                    numero_documento: numero_documento,
                    cliente: cliente,
                    fecha: fecha,
                    estadoov: estadoov,
                    estadoactividad: estadoactividad
                });
            });
            return results;
        }
    }

    return { onRequest }
});