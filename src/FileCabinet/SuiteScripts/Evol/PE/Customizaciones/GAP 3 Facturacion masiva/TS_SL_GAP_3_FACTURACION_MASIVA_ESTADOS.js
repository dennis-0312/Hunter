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
                    title: 'Agrupacion de Facturas PE'
                });

                form.clientScriptModulePath = './TS_CS_GAP_3_FACTURACION_MASIVA_ESTADO.js';
                var varInlineHtml = form.addField({ id: 'custpage_functions', type: serverWidget.FieldType.INLINEHTML, label: ' ' }).defaultValue = '<script>' + verRegistros + '</script>';
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
                    type: serverWidget.SublistType.STATICLIST,
                    label: 'Ejecuciones'
                });
                let sublistResultados = form.addSublist({
                    id: 'custpage_sublist_resultados',
                    type: serverWidget.SublistType.EDITOR,
                    label: 'Resultados'
                });
                sublistResultados.addField({ id: "custpage_slf_id", type: serverWidget.FieldType.TEXT, label: "ID" });
                sublistResultados.addField({ id: "custpage_slf_usuario", type: serverWidget.FieldType.TEXT, label: "Usuario" });
                sublistResultados.addField({ id: "custpage_slf_fecha", type: serverWidget.FieldType.TEXT, label: "Fecha Hora" });
                sublistResultados.addField({ id: "custpage_slf_os", type: serverWidget.FieldType.TEXT, label: "OS Seleccionada" });
       
                const field = sublistResultados.addField({
                    id: 'custpage_slf_articulo',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Facturas',
                    source: 'transaction'
                });

                field.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
                sublistResultados.addField({ id: "custpage_slf_factura", type: serverWidget.FieldType.TEXT, label: "Factura" });



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
                    type: serverWidget.FieldType.TEXTAREA,
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
                sublist.addField({
                    id: 'custpage_vinculo',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Vinculo'
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

                    /*   if (ejecuciones[i].factura_directa_ID) {
   
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
                       }*/

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
                    var inputHtml = "";
                    inputHtml = '<input type="button" onclick="verRegistros(' + ejecuciones[i].id + ')" value="Ver Resultados">';
                    inputHtml = '<a href="#" onclick="verRegistros(' + ejecuciones[i].id + ')">Ver Resultados</a>';
                    sublist.setSublistValue({
                        id: 'custpage_vinculo',
                        line: i,
                        value: inputHtml
                    });

                }




                scriptContext.response.writePage(form);








            } catch (e) {
                log.error('onRequest', e);
            }


        }
        function verRegistros(ids) {
            require(["N/search", "N/record", "N/currentRecord", "N/url"],
                function (search, record, currentRecord, url) {
                    console.log("ids", ids);
                    var currentRecord = currentRecord.get();


                    const llenarSublistaGuias = () => {
                        //Resultado de las guias generadas 
                        if (ids) {
                            var searchResult = search.create({
                                type: "customrecord_ts_log_ejec_agrup_fact_mm",
                                filters:
                                    [
                                        ["custrecord_ts_fact_direct_mm.taxline", "is", "F"],
                                        "AND",
                                        ["custrecord_ts_fact_direct_mm.item", "noneof", "@NONE@"],
                                        "AND",
                                        ["internalid", "anyof", ids]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "internalid", label: "internalid" }),
                                        search.createColumn({ name: "name", label: "Name" }),
                                        search.createColumn({ name: "scriptid", label: "Script ID" }),
                                        search.createColumn({ name: "custrecord_ts_fecha_inicio_mm", label: "Fecha Inicio" }),
                                        search.createColumn({ name: "custrecord_ts_porcentaje_mm", label: "Porcentaje" }),
                                        search.createColumn({ name: "custrecord_ts_creado_por_mm", label: "Creado Por" }),
                                        search.createColumn({ name: "custrecord_ts_cliente_mm", label: "Cliente" }),
                                        search.createColumn({
                                            name: "createdfrom",
                                            join: "CUSTRECORD_TS_FACT_DIRECT_MM",
                                            label: "Created From"
                                        }),
                                        search.createColumn({ name: "custrecord_ts_fecha_fin_mm", label: "Fecha FIn" }),
                                        search.createColumn({ name: "custrecord_ts_estado_mm", label: "Estado" }),
                                        search.createColumn({
                                            name: "invoicenum",
                                            join: "CUSTRECORD_TS_FACT_DIRECT_MM",
                                            label: "Invoice Number"
                                        }),
                                        search.createColumn({
                                            name: "internalid",
                                            join: "CUSTRECORD_TS_FACT_DIRECT_MM",
                                            label: "Internal ID"
                                        })
                                    ]
                            }).run().getRange(0, 1000);

                            let custpage_sublist_resultados = currentRecord.getSublist({ sublistId: 'custpage_sublist_resultados' });



                            if (searchResult.length) {
                                let i = 0;
                                searchResult.forEach(result => {
                                    let columns = result.columns;
                                    var newLine = currentRecord.insertLine({ sublistId: 'custpage_sublist_resultados', line: i });
                                    //if (result.getValue(columns[0])) {
                               
                                    currentRecord.setCurrentSublistValue({ sublistId: "custpage_sublist_resultados", fieldId: "custpage_slf_id", value: result.getValue(columns[0]) });
                                    currentRecord.setCurrentSublistValue({ sublistId: "custpage_sublist_resultados", fieldId: "custpage_slf_usuario", value: result.getText(columns[5]) });
                                    currentRecord.setCurrentSublistValue({ sublistId: "custpage_sublist_resultados", fieldId: "custpage_slf_fecha", value: result.getValue(columns[3]) });
                                    currentRecord.setCurrentSublistValue({ sublistId: "custpage_sublist_resultados", fieldId: "custpage_slf_os", value: result.getText(columns[7]) });
                                    currentRecord.setCurrentSublistValue({ sublistId: "custpage_sublist_resultados", fieldId: "custpage_slf_articulo", value: result.getValue(columns[11]) });
                                    currentRecord.setCurrentSublistValue({ sublistId: "custpage_sublist_resultados", fieldId: "custpage_slf_factura", value: result.getValue(columns[10]) });

                                    currentRecord.commitLine({ sublistId: 'custpage_sublist_resultados' });


                                    i++;
                                });
                            }

                        }
                        //Resultado de las ordenes con error


                        document.querySelector("#custpage_sublist_resultadostxt").click();
                    }
                    function clearTransactionSubList() {
                        var subListLength = currentRecord.getLineCount({ sublistId: "custpage_sublist_resultados" });
                        if (subListLength) {
                            currentRecord.selectLine({ sublistId: 'custpage_sublist_resultados', line: 0 });
                            for (var i = 0; i < subListLength; i++) {
                                console.log(custpage_sublist_resultados_machine.deleteline());
                            }
                        }

                    }

                    clearTransactionSubList();


                    llenarSublistaGuias();
                }
            );
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
                    type: 'customrecord_ts_log_ejec_agrup_fact_mm',
                    filters: [
                        [
                            "custrecord_ts_fecha_inicio_mm", "onorafter", fechaDesde
                        ],
                        "AND",
                        [
                            "custrecord_ts_fecha_inicio_mm", "onorbefore", fechaHasta
                        ]
                    ],
                    columns: [
                        search.createColumn({ "name": "internalid", "label": "ID" }),
                        search.createColumn({ "name": "custrecord_ts_porcentaje_mm", "label": "custrecord_ts_porcentaje" }),
                        search.createColumn({ "name": "custrecord_ts_estado_mm", "label": "Estado de la Ejecución" }),
                        search.createColumn({ "name": "custrecord_ts_error_mm", "label": "Errores" }),
                        search.createColumn({ "name": "custrecord_ts_creado_por_mm", "label": "Creado Por" }),
                        search.createColumn({ "name": "custrecord_ts_fecha_inicio_mm", "label": "Fecha Inicio", "sort": search.Sort.DESC }),
                        search.createColumn({ "name": "custrecord_ts_fecha_fin_mm", "label": "Fecha Fin" }),
                        search.createColumn({ "name": "custrecord_ts_cliente_mm", "label": "Cliente" }),
                        search.createColumn({ "name": "custrecord_ts_agrupador_mm", "label": "Agrupador" }),
                        search.createColumn({ "name": "custrecord_ts_fact_direct_mm", "label": "Factura directa" })
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
                                porcentaje: result.getValue({ name: 'custrecord_ts_porcentaje_mm' }),
                                estado: result.getValue({ name: 'custrecord_ts_estado_mm' }),
                                error: result.getValue({ name: 'custrecord_ts_error_mm' }),
                                creado_por: result.getText({ name: 'custrecord_ts_creado_por_mm' }),
                                fecha_inicio: result.getValue({ name: 'custrecord_ts_fecha_inicio_mm' }),
                                fecha_fin: result.getValue({ name: 'custrecord_ts_fecha_fin_mm' }),
                                cliente: result.getText({ name: 'custrecord_ts_cliente_mm' }),
                                agrupador: result.getValue({ name: 'custrecord_ts_agrupador_mm' }),
                                factura_directa_ID: result.getValue({ name: 'custrecord_ts_fact_direct_mm' }),
                                factura_directa_text: result.getText({ name: 'custrecord_ts_fact_direct_mm' })
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
