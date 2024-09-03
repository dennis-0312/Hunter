/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/log', 'N/search', 'N/format', "N/url"],

    (serverWidget, record, log, search, format, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                const request = scriptContext.request;

                //Obtenemos los parametros de la URL
                const id = request.parameters.id;
                const deploy = request.parameters.deploy;


                let form = serverWidget.createForm({
                    title: 'Agrupacion de Facturas'
                });

                form.clientScriptModulePath = './TS_CS_Agrupacion_Factura_OS_estado.js';

                //Seccion de Busqueda
                let Busqueda = form.addFieldGroup({
                    id: 'busqueda',
                    label: 'Filtros de Busqueda'
                });
                //Campo de Busqueda de ejecuciones
                let fechaDesde = form.addField({
                    id: 'custpage_fechadesde',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Desde',
                    container: 'busqueda'
                });
                fechaDesde.defaultValue = new Date();

                let fechaHasta = form.addField({
                    id: 'custpage_fechahasta',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Hasta',
                    container: 'busqueda'
                });

                fechaHasta.defaultValue = new Date();

                //Creamos un Sublist para mostrar las ejecuciones
                let sublist = form.addSublist({
                    id: 'custpage_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Ejecuciones'
                });

                let updateBoton = sublist.addRefreshButton();

                //Agregamos las columnas a la sublist
                sublist.addField({
                    id: 'custpage_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ID'
                });

                sublist.addField({
                    id: 'custpage_estado',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Estado de la Ejecución'
                });

                sublist.addField({
                    id: 'custpage_porcentaje',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Porcentaje'
                });

                sublist.addField({
                    id: 'custpage_cliente',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Cliente'
                });

                sublist.addField({
                    id: 'custpage_agrupador',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Agrupador'
                });

                sublist.addField({
                    id: 'custpage_factura_directa',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Factura Directa'
                })

                sublist.addField({
                    id: 'custpage_fecha_creacion',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Fecha de Creación'
                });

                sublist.addField({
                    id: 'custpage_fecha_fin',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Fecha de Fin'
                });

                sublist.addField({
                    id: 'custpage_creado_por',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Creado Por'
                });

                sublist.addField({
                    id: 'custpage_error',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Errores'
                });

                let ejecuciones;
                let params = {};
                //Obtenemos los parametros de la URL

                /*  ejecuciones = getEjecuciones({
                     fechaDesde_default: fechaDesde.defaultValue,
                     fechaHasta_default: fechaHasta.defaultValue
                 }); */
                if (request.parameters.custscript_ts_params) {
                    params = request.parameters.custscript_ts_params;
                    params = JSON.parse(params);
                    ejecuciones = getEjecuciones(params);
                    fechaDesde.defaultValue = params.fechaDesde;
                    fechaHasta.defaultValue = params.fechaHasta;

                } else {
                    ejecuciones = getEjecuciones({
                        fechaDesde_default: fechaDesde.defaultValue,
                        fechaHasta_default: fechaHasta.defaultValue
                    });
                }



                //Agregamos las Lineas  


                //log.debug('ejecuciones', ejecuciones);

                for (let i = 0; i < ejecuciones.length; i++) {

                    if (ejecuciones[i].id) {
                        sublist.setSublistValue({
                            id: 'custpage_id',
                            line: i,
                            value: ejecuciones[i].id
                        });
                    }

                    if (ejecuciones[i].estado) {
                        sublist.setSublistValue({
                            id: 'custpage_estado',
                            line: i,
                            value: ejecuciones[i].estado
                        });
                    }

                    if (ejecuciones[i].porcentaje) {
                        sublist.setSublistValue({
                            id: 'custpage_porcentaje',
                            line: i,
                            value: ejecuciones[i].porcentaje
                        });
                    }

                    if (ejecuciones[i].cliente) {
                        sublist.setSublistValue({
                            id: 'custpage_cliente',
                            line: i,
                            value: ejecuciones[i].cliente
                        });
                    }

                    if (ejecuciones[i].agrupador) {
                        sublist.setSublistValue({
                            id: 'custpage_agrupador',
                            line: i,
                            value: ejecuciones[i].agrupador
                        });
                    }

                    if (ejecuciones[i].factura_directa_ID) {

                        //Creanis un enlace a la factura directa
                        let facturaDirecta = '<a href="' + url.resolveRecord({
                            recordType: 'invoice',
                            recordId: ejecuciones[i].factura_directa_ID
                        }) + '">' + ejecuciones[i].factura_directa_text + '</a>';

                        sublist.setSublistValue({
                            id: 'custpage_factura_directa',
                            line: i,
                            value: facturaDirecta
                        });
                    }

                    if (ejecuciones[i].fecha_inicio) {
                        sublist.setSublistValue({
                            id: 'custpage_fecha_creacion',
                            line: i,
                            value: ejecuciones[i].fecha_inicio
                        });
                    }

                    if (ejecuciones[i].fecha_fin) {
                        sublist.setSublistValue({
                            id: 'custpage_fecha_fin',
                            line: i,
                            value: ejecuciones[i].fecha_fin
                        });
                    }

                    if (ejecuciones[i].creado_por) {
                        sublist.setSublistValue({
                            id: 'custpage_creado_por',
                            line: i,
                            value: ejecuciones[i].creado_por
                        });
                    }

                    if (ejecuciones[i].error) {
                        sublist.setSublistValue({
                            id: 'custpage_error',
                            line: i,
                            value: ejecuciones[i].error
                        });
                    }


                }




                scriptContext.response.writePage(form);








            } catch (e) {
                log.error('onRequest', e);
            }


        }

        const getEjecuciones = (params) => {
            try {
                let respuesta = [];
                let fechaDesde;
                let fechaHasta;

                if (params.fechaDesde_default && params.fechaHasta_default) {
                    fechaDesde = params.fechaDesde_default;
                    fechaHasta = params.fechaHasta_default;
                } else {
                    fechaDesde = params.fechaDesde;
                    fechaHasta = params.fechaHasta;
                }

                log.debug('fechaDesde', fechaDesde);
                log.debug('fechaHasta', fechaHasta);

                let TS_LOG_EJEC_AGRUP_FACT_CAB_SEARCH = search.create({
                    type: 'customrecord_ts_log_ejec_agrup_fact_cab',
                    filters: [
                        [
                            "custrecord_ts_fecha_inicio", "onorafter", fechaDesde
                        ],
                        "AND",
                        [
                            "custrecord_ts_fecha_inicio", "onorbefore", fechaHasta
                        ]
                    ],
                    columns: [
                        search.createColumn({ "name": "internalid", "label": "ID" }),
                        search.createColumn({ "name": "custrecord_ts_porcentaje", "label": "custrecord_ts_porcentaje" }),
                        search.createColumn({ "name": "custrecord_ts_estado", "label": "Estado de la Ejecución" }),
                        search.createColumn({ "name": "custrecord_ts_error", "label": "Errores" }),
                        search.createColumn({ "name": "custrecord_ts_creado_por", "label": "Creado Por" }),
                        search.createColumn({ "name": "custrecord_ts_fecha_inicio", "label": "Fecha Inicio", "sort": search.Sort.DESC }),
                        search.createColumn({ "name": "custrecord_ts_fecha_fin", "label": "Fecha Fin" }),
                        search.createColumn({ "name": "custrecord_ts_cliente", "label": "Cliente" }),
                        search.createColumn({ "name": "custrecord_ts_agrupador", "label": "Agrupador" }),
                        search.createColumn({ "name": "custrecord_ts_fact_direct", "label": "Factura directa" })
                    ]
                });

                let pagedData = TS_LOG_EJEC_AGRUP_FACT_CAB_SEARCH.runPaged({
                    pageSize: 1000
                });

                // Verificar si hay al menos una página de resultados
                if (pagedData.count > 0) {
                    let pageIndex = 0;

                    // Iterar a través de cada página
                    do {
                        // Obtener la página actual
                        let currentPage = pagedData.fetch({ index: pageIndex });
                        currentPage.data.forEach(function (result) {
                            respuesta.push({
                                id: result.getValue({ name: 'internalid' }),
                                porcentaje: result.getValue({ name: 'custrecord_ts_porcentaje' }),
                                estado: result.getValue({ name: 'custrecord_ts_estado' }),
                                error: result.getValue({ name: 'custrecord_ts_error' }),
                                creado_por: result.getText({ name: 'custrecord_ts_creado_por' }),
                                fecha_inicio: result.getValue({ name: 'custrecord_ts_fecha_inicio' }),
                                fecha_fin: result.getValue({ name: 'custrecord_ts_fecha_fin' }),
                                cliente: result.getText({ name: 'custrecord_ts_cliente' }),
                                agrupador: result.getValue({ name: 'custrecord_ts_agrupador' }),
                                factura_directa_ID: result.getValue({ name: 'custrecord_ts_fact_direct' }),
                                factura_directa_text: result.getText({ name: 'custrecord_ts_fact_direct' })
                            });
                        });
                        pageIndex++;
                    } while (pageIndex < pagedData.pageRanges.length)

                }


                return respuesta;


            } catch (error) {
                log.error('getEjecuciones', error);
            }
        }

        return { onRequest }

    });
