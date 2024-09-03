/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/log', 'N/search', 'N/format', 'N/task', 'N/runtime', 'N/url', 'N/redirect'],

    (serverWidget, record, log, search, format, task, runtime, url, redirect) => {
        //Configuraciones para la creacion de la factura directa


        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            try {
                //Creacion del formulario para transaccionar varias ordenes de servicio
                let form = serverWidget.createForm({
                    title: 'Agrupación de Facturas para Factura Directa'
                });

                //Asignacion de un script para el formulario
                form.clientScriptModulePath = './TS_CS_Agrupacion_Factura_OS.js';

                //Obtenemos los parametros de la URL
                let params = {
                    flag: ''
                };

                if (scriptContext.request.parameters.custscript_ts_context) {
                    params = scriptContext.request.parameters.custscript_ts_context;
                    params = JSON.parse(params);
                }

                //Agregamos el submit boton del formulario
                form.addSubmitButton({
                    label: 'Crear Factura Directa'
                });

                form.addButton({
                    id: 'custpage_btn_calcular_importe',
                    label: 'Calcular Importe',
                    functionName: 'calcularImporte'
                });
                
                //Creacion de la seccion de busqueda
                let seccionBusqueda = form.addFieldGroup({
                    id: 'seccion_busqueda',
                    label: 'Busqueda de Ordenes de Servicio'
                });

                //Creacion de campo de busqueda los agrupamos en una sola columna
                //cliente
                let cliente = form.addField({
                    id: 'cliente',
                    type: serverWidget.FieldType.SELECT,
                    source: 'customer',
                    label: 'Cliente',
                    container: 'seccion_busqueda'
                });
                cliente.isMandatory = true;

                //Fecha de inicio

                let fechaInicio = form.addField({
                    id: 'fecha_inicio',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha de Inicio',
                    container: 'seccion_busqueda'
                });
                fechaInicio.isMandatory = true;


                //fecha fin

                let fechaFin = form.addField({
                    id: 'fecha_fin',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha de Fin',
                    container: 'seccion_busqueda'
                });

                fechaFin.isMandatory = true;


                //Tipo de Orden de Servicio
                let tipoOS = form.addField({
                    id: 'tipo_os',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Tipo de Orden de Servicio',
                    container: 'seccion_busqueda'
                });

                tipoOS.addSelectOption({
                    value: '1',
                    text: 'Total'
                });

                tipoOS.addSelectOption({
                    value: '2',
                    text: 'Linea'
                });

                //ocultamos el campo
                tipoOS.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                let terminoPago = form.addField({
                    id: 'termino_pago',
                    type: serverWidget.FieldType.SELECT,
                    source: 'term',
                    label: 'Termino de Pago',
                    container: 'seccion_busqueda'
                });

                terminoPago.isMandatory = true;


                //Agrupador

                let agrupador = form.addField({
                    id: 'agrupador',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Agrupador',
                    container: 'seccion_busqueda'
                });

                let glosa = form.addField({
                    id: 'glosa',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Glosa',
                    container: 'seccion_busqueda'
                });

                glosa.isMandatory = true;

                let facturar_a = form.addField({
                    id: 'facturar_a',
                    type: serverWidget.FieldType.SELECT,
                    source: 'customer',
                    label: 'Facturar a',
                    container: 'seccion_busqueda'
                });

                let notaFactura = form.addField({
                    id: 'nota_factura',
                    type: serverWidget.FieldType.TEXTAREA,
                    label: 'Nota de Factura',
                    container: 'seccion_busqueda'
                });

                let importeTotal = form.addField({
                    id: 'importe_total',
                    type: serverWidget.FieldType.CURRENCY,
                    label: 'Importe Total',
                    container: 'seccion_busqueda'
                });

                importeTotal.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });


                //Creacion de la seccion de resultados

                let seccionResultados = form.addFieldGroup({
                    id: 'seccion_resultados',
                    label: 'Resultados de la Busqueda'
                });

                //Creacion de la sublista
                let sublista = form.addSublist({
                    id: 'sublista',
                    type: serverWidget.SublistType.LIST,
                    label: 'Facturas Internas',
                    tab: 'tab1'
                });


                //Validamos el flag para realizar la busqueda
                if (params.flag == 'searchFacturaFin') {

                    //Seteamos los valores de los campos
                    cliente.defaultValue = params.cliente;
                    fechaInicio.defaultValue = new Date(params.fechaInicio);
                    tipoOS.defaultValue = params.tipoOS;
                    fechaFin.defaultValue = new Date(params.fechaFin);
                    agrupador.defaultValue = params.agrupador;
                    terminoPago.defaultValue = params.termino_pago;
                    glosa.defaultValue = params.glosa;
                    facturar_a.defaultValue = params.facturar_a;
                    notaFactura.defaultValue = params.nota_factura;



                    //Obtenemos las Facturas FIN
                    let facturasFIN = getFacturasFIN(params.cliente, new Date(params.fechaInicio), new Date(params.fechaFin), params.tipoOS, params.agrupador, 'GET');




                    //Agregamos las columnas a la sublista
                    //Agregamos un boton de seleccionar todos
                    sublista.addMarkAllButtons();

                    sublista.addField({
                        id: 'check',
                        type: serverWidget.FieldType.CHECKBOX,
                        label: 'Seleccionar'
                    });

                    sublista.addField({
                        id: 'id',
                        type: serverWidget.FieldType.TEXT,
                        label: 'ID'
                    });

                    sublista.addField({
                        id: 'numero',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Numero'
                    });

                    sublista.addField({
                        id: 'agrupador',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Agrupador'
                    });

                    sublista.addField({
                        id: "orden_servicio",
                        type: serverWidget.FieldType.TEXT,
                        label: "Orden de Servicio"
                    }); 
                  
                    sublista.addField({
                        id: 'nro_cuota',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Número de Cuota'
                    });

                    sublista.addField({
                        id: 'fecha',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Fecha'
                    });

                    sublista.addField({
                        id: 'cliente',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Cliente'
                    });

                    sublista.addField({
                        id: 'monto',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Monto'
                    });

                    //Agregamos las lineas a la sublista
                    for (i = 0; i < facturasFIN.length; i++) {
                        sublista.setSublistValue({
                            id: 'check',
                            line: i,
                            value: 'F'
                        });
                        sublista.setSublistValue({
                            id: 'id',
                            line: i,
                            value: facturasFIN[i].id
                        });

                        sublista.setSublistValue({
                            id: 'numero',
                            line: i,
                            value: facturasFIN[i].numero
                        });

                        if (facturasFIN[i].memo) {
                            sublista.setSublistValue({
                                id: 'agrupador',
                                line: i,
                                value: facturasFIN[i].memo
                            });
                        }

                        if (facturasFIN[i].creado_desde_text) {
                            sublista.setSublistValue({
                                id: 'orden_servicio',
                                line: i,
                                value: facturasFIN[i].creado_desde_text
                            });
                        }

                        if(facturasFIN[i].creado_desde){
                            sublista.setSublistValue({
                                id: 'id_orden_servicio',
                                line: i,
                                value: facturasFIN[i].creado_desde
                            });
                        }

                        if(facturasFIN[i].nro_cuota){
                            sublista.setSublistValue({
                                id: 'nro_cuota_interno',
                                line: i,
                                value: facturasFIN[i].nro_cuota
                            });
                        }
                        if(facturasFIN[i].nro_cuota){
                            sublista.setSublistValue({
                                id: 'nro_cuota',
                                line: i,
                                value: facturasFIN[i].nro_cuota
                            });
                        }

                        sublista.setSublistValue({
                            id: 'fecha',
                            line: i,
                            value: facturasFIN[i].fecha
                        });

                        sublista.setSublistValue({
                            id: 'cliente',
                            line: i,
                            value: facturasFIN[i].cliente
                        });

                        sublista.setSublistValue({
                            id: 'monto',
                            line: i,
                            value: facturasFIN[i].monto
                        });

                    }


                }

                scriptContext.response.writePage(form);


                //Creamos la factura directa cuando se envia el formulario
                if (scriptContext.request.method === 'POST') {

                    try {

                        let cliente = scriptContext.request.parameters.cliente;
                        let fechaInicio = scriptContext.request.parameters.fecha_inicio;
                        let tipoOS = scriptContext.request.parameters.tipo_os;
                        let fechaFin = scriptContext.request.parameters.fecha_fin;
                        let agrupador = scriptContext.request.parameters.agrupador;
                        let termino_pago = scriptContext.request.parameters.termino_pago;
                        let glosa = scriptContext.request.parameters.glosa;
                        let facturar_a = scriptContext.request.parameters.facturar_a;
                        let nota_factura = scriptContext.request.parameters.nota_factura;
                        // Cadena de texto con los nombres de los campos
                        let labelsString = scriptContext.request.parameters.sublistalabels;
                        // Extraer los nombres de los campos
                        let fieldNames = labelsString.split('\u0001');

                        // Cadena de texto con los datos (ejemplo de datos proporcionados anteriormente)
                        let dataString = scriptContext.request.parameters.sublistadata

                        // Dividir la cadena en registros individuales y filtrar registros vacíos
                        let records = dataString.split('\u0002').filter(record => record);

                        //filtramos solo los registros que empiezan con T
                        records = records.filter(record => record.startsWith('T'));


                        // Convertir cada registro en un objeto y agregarlo a un array
                        let facturasSeleccionadas = records.map(record => {
                            let fields = record.split('\u0001');
                            // Crear un objeto para cada registro, asignando cada campo a su nombre correspondiente
                            let recordObj = fieldNames.reduce((obj, fieldName, index) => {
                                if (index > 0) { // Ignorar el primer campo 'Seleccionar'
                                    //nos saltamos el primer campo que es el checkbox
                                    obj[fieldName] = fields[index];
                                }
                                return obj;
                            }, {});
                            return recordObj;
                        });

                        let datosFacturasSeleccionas = getFacturasFIN(cliente, fechaInicio, fechaFin, tipoOS, agrupador, 'POST');
                        
                         datosFacturasSeleccionas = datosFacturasSeleccionas.filter(factura =>{
                            return facturasSeleccionadas.some(facturaSeleccionada => {
                                return facturaSeleccionada.ID == factura.id;
                            });
                         })

                         //Limpiamos datos que no se necesitan
                         datosFacturasSeleccionas.forEach(factura => {
                                delete factura.numero;
                                delete factura.fecha;
                                delete factura.cliente;
                                delete factura.monto;
                                delete factura.estado;
                                delete factura.memo;
                                delete factura.creado_desde_text;
                            });

                        
                                


                        let totalFacturasBuscadas = getFacturasLineasFIN(cliente, fechaInicio, fechaFin, tipoOS, agrupador);
                        //let facturasInternas = getFacturasFIN(cliente, fechaInicio, fechaFin, tipoOS, agrupador, 'POST');

                        //Filtramos las facturas seleccionadas en el total de facturas 
                        let facturas = totalFacturasBuscadas.filter(factura => {
                            return facturasSeleccionadas.some(facturaSeleccionada => {
                                return facturaSeleccionada.ID == factura.id;
                            });
                        });


                        //Agrupamos las facturas sin importar si se repiten los numeros y totalizamos los items

                        let facturaDirecta = {}
                        facturaDirecta.bien = facturas[0].bien;
                        facturaDirecta.departamento = facturas[0].departamento;
                        facturaDirecta.clase = facturas[0].clase;
                        facturaDirecta.oficina = facturas[0].oficina;
                        facturaDirecta.aseguradora = facturas[0].aseguradora;
                        facturaDirecta.concesionario = facturas[0].concesionario;
                        facturaDirecta.financiera = facturas[0].financiera;
                        facturaDirecta.items = [];

                        //unimos los items y Sumamos las cantidades

                        let items = [];

                        facturas.forEach(factura => {
                            let item = items.find(item => item.id == factura.item);
                            if (item) {
                                item.cantidad += Number(factura.cantidad);
                            } else {
                                items.push({
                                    id: factura.item,
                                    item_f: factura.item_f,
                                    nombre: factura.nombreItem,
                                    unidad: factura.unidad,
                                    cantidad: Number(factura.cantidad)
                                });
                            }
                        });

                        facturaDirecta.items = items;

                        //obtenemos el usuario actual
                        let currentUser = runtime.getCurrentUser();



                        //Creamos el registro de log
                        let id_log = createCabLog({
                            cliente: cliente,
                            agrupador: agrupador,
                            usuario: currentUser.id
                        });
                        let ts_ss_agrup_fac_params = {
                            cliente: cliente,
                            fechaInicio: fechaInicio,
                            tipoOS: tipoOS,
                            fechaFin: fechaFin,
                            agrupador: agrupador,
                            terminoPago: termino_pago,
                            usuario: currentUser.id,
                            id_log: id_log,
                            glosa: glosa,
                            facturarA: facturar_a,
                            notaFactura: nota_factura,
                            facturasSeleccionadas: datosFacturasSeleccionas,
                            facturaDirecta: facturaDirecta,
                        };

                        log.debug('ts_ss_agrup_fac_params', ts_ss_agrup_fac_params);

                        //Agregamos a la cola
                        agregarCola(ts_ss_agrup_fac_params);

                        try {
                            let ts_ss_agrup_fac_params_string = JSON.stringify(ts_ss_agrup_fac_params);
                            let scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_ts_ss_agrupacion_factura_os',
                                deploymentId: 'customdeploy_ts_ss_agrupacion_factura_os',
                                params: {
                                    custscript_ts_ss_agrup_fac_params: ts_ss_agrup_fac_params_string,
                                    custscript_ts_ss_agrup_fac_slect_fact: 't'
                                }
                            });

                            let scriptTaskId = scriptTask.submit();



                        } catch (error) {
                            log.error('onRequest POST Task', error);

                        }


                        //Nos redirigimos a la pagina de resultados
                        redirect.toSuitelet({
                            scriptId: 1800,
                            deploymentId: 1,
                        });

                    } catch (error) {
                        log.error('onRequest POST', error);

                    }

                }

            } catch (e) {
                log.error('onRequest', e);
            }

        }

        const getFacturasFIN = (cliente, fechaInicio, fechaFin, tipoOS, agrupador, flag) => {
            try {
                let respuesta = [];

                let agrup = (agrupador != '') ? agrupador : '%';
                let newfechaInicio;
                let newfechaFin;
                if (flag == 'GET') {
                    //ejemplo de como formatear la fecha "2024-08-11T05:00:00.000Z" a "11/08/2024"

                    newfechaInicio = fechaInicio.toISOString().split('T')[0].split('-').reverse().join('/');
                    newfechaFin = fechaFin.toISOString().split('T')[0].split('-').reverse().join('/');

                   /*  newfechaInicio = format.format({
                        value: fechaInicio,
                        type: format.Type.DATE
                    });

                    newfechaFin = format.format({
                        value: fechaFin,
                        type: format.Type.DATE
                    }); */
                } else {
                    newfechaInicio = fechaInicio;
                    newfechaFin = fechaFin;
                }



                let searchFacturasFIN;
 

                if (agrupador != '') {
                    searchFacturasFIN = search.create({
                        type: 'transaction',
                        filters: [
                            ["type", "anyof", "CuTrSale113"],
                            "AND",
                            ["status", "noneof", "CuTrSale113:V"],
                            "AND",
                            ['mainline', 'is', 'T'],
                            'AND',
                            ['entity', 'anyof', cliente],
                            'AND',
                            // ["trandate", "within", "11/08/2024", "11/08/2024"],
                            ['trandate', 'within', newfechaInicio, newfechaFin],
                            "AND",
                            ["custbodyts_ec_tipo_documento_fiscal", "anyof", "37"],
                            "AND",
                            ["custbody_ht_cod_agru", "is", agrup],
                            "AND",
                            ["custbody_ht_factura_directa", "anyof", "@NONE@"],
                            "AND",
                            ["memomain","isnot","VOID"]



                        ],
                        columns: [
                            search.createColumn({
                                name: 'internalid'
                            }),
                            search.createColumn({
                                name: 'tranid'
                            })
                            , search.createColumn({
                                name: 'trandate'
                            }),
                            search.createColumn({
                                name: 'entity'
                            }),
                            search.createColumn({
                                name: 'amount'
                            }),
                            search.createColumn({
                                name: 'approvalstatus'
                            }),
                            search.createColumn({
                                name: 'custbody_ht_cod_agru'
                            }),
                            search.createColumn({
                                name: 'custbody_ec_nro_cuota_fac_int'
                            }),
                            search.createColumn({
                                name: 'custbody_ec_created_from_fac_int'
                            }),

                        ]
                    });
                }
                else {
                    searchFacturasFIN = search.create({
                        type: 'transaction',
                        filters: [
                            ["type", "anyof", "CuTrSale113"],
                            "AND",
                            ["status", "noneof", "CuTrSale113:V"],
                            "AND",
                            ['mainline', 'is', 'T'],
                            'AND',
                            ['entity', 'anyof', cliente],
                            'AND',
                            ['trandate', 'within', newfechaInicio, newfechaFin],
                            "AND",
                            ["custbodyts_ec_tipo_documento_fiscal", "anyof", "37"],
                            /* "AND",
                            ["custbody_ht_cod_agru", "is", agrup], */
                            "AND",
                            ["custbody_ht_factura_directa", "anyof", "@NONE@"],
                            "AND",
                            ["memomain","isnot","VOID"]
                        ],
                        columns: [
                            search.createColumn({
                                name: 'internalid'
                            }),
                            search.createColumn({
                                name: 'tranid'
                            })
                            , search.createColumn({
                                name: 'trandate'
                            }),
                            search.createColumn({
                                name: 'entity'
                            }),
                            search.createColumn({
                                name: 'amount'
                            }),
                            search.createColumn({
                                name: 'approvalstatus'
                            }),
                            search.createColumn({
                                name: 'custbody_ht_cod_agru'
                            }), 
                            search.createColumn({
                                name: 'custbody_ec_nro_cuota_fac_int'
                            }),
                            search.createColumn({
                                name: 'custbody_ec_created_from_fac_int'
                            }),

                        ]
                    });
                }


                let pagedData = searchFacturasFIN.runPaged({
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
                                numero: result.getValue({ name: 'tranid' }),
                                fecha: result.getValue({ name: 'trandate' }),
                                cliente: result.getText({ name: 'entity' }),
                                monto: result.getValue({ name: 'amount' }),
                                estado: result.getText({ name: 'approvalstatus' }),
                                memo: result.getValue({ name: 'custbody_ht_cod_agru' }),
                                nro_cuota: result.getValue({ name: 'custbody_ec_nro_cuota_fac_int' }),
                                creado_desde: result.getValue({ name: 'custbody_ec_created_from_fac_int' }),
                                creado_desde_text: result.getText({ name: 'custbody_ec_created_from_fac_int' })

                            });
                        });
                        pageIndex++;
                    } while (pageIndex < pagedData.pageRanges.length)

                }



                return respuesta;

            } catch (e) {
                log.error('getOrdenesServicio', e);
            }

        }

        const getFacturasLineasFIN = (cliente, fechaInicio, fechaFin, tipoOS, agrupador) => {
            try {
                let respuesta = [];

                let agrup = (agrupador != '') ? agrupador : '%';

                var invoiceSearchObj;

                if (agrupador != '') {
                    invoiceSearchObj = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["type", "anyof", "CuTrSale113"],
                                "AND",
                                ["status", "noneof", "CuTrSale113:V"],
                                "AND",
                                ["entity", "anyof", cliente],
                                'AND',
                                ['trandate', 'within', fechaInicio, fechaFin],
                                "AND",
                                ["custbody_ht_cod_agru", "is", agrupador],
                                "AND",
                                ["custbodyts_ec_tipo_documento_fiscal", "anyof", "37"],
                                "AND",
                                ["item", "noneof", "@NONE@"],
                                "AND",
                                ["taxline", "is", "F"],
                                "AND",
                                ["custbody_ht_factura_directa", "anyof", "@NONE@"],
                                "AND",
                            ["memomain","isnot","VOID"]
                            ],
                        columns:
                            [
                                //Datos Cabecera
                                search.createColumn({ name: "internalid", label: "ID interno" }),
                                search.createColumn({ name: "tranid", label: "Número de documento" }),
                                search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" }),
                                search.createColumn({ name: "department", label: "Departamento" }),
                                search.createColumn({ name: "class", label: "Clase" }),
                                search.createColumn({ name: "location", label: "Oficina" }),
                                search.createColumn({ name: "custbody_ht_os_companiaseguros", label: "HT ASEGURADORA" }),
                                search.createColumn({ name: "custbody_ht_os_concesionario", label: "HT CONCESIONARIO" }),
                                search.createColumn({ name: "custbody_ht_os_bancofinanciera", label: "HT FINANCIERA" }),




                                search.createColumn({ name: "item", label: "Artículo" }),
                                search.createColumn({ name: "custitem_ec_item_agrupado", join: "item", label: "Artículo F" }),
                                search.createColumn({
                                    name: "itemid",
                                    join: "item",
                                    label: "Nombre Articulo"
                                }),
                                search.createColumn({ name: "quantity", label: "Cantidad" }),
                                search.createColumn({ name: "unitabbreviation", label: "Unidad" }),
                                search.createColumn({ name: "taxcode", label: "Artículo de impuesto sobre las ventas" })
                            ]
                    });
                } else {
                    invoiceSearchObj = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["type", "anyof", "CuTrSale113"],
                                "AND",
                                ["status", "noneof", "CuTrSale113:V"],
                                "AND",
                                ["entity", "anyof", cliente],
                                'AND',
                                ['trandate', 'within', fechaInicio, fechaFin],
                                "AND",
                                ["custbodyts_ec_tipo_documento_fiscal", "anyof", "37"],
                                "AND",
                                ["item", "noneof", "@NONE@"],
                                "AND",
                                ["taxline", "is", "F"],
                                "AND",
                                ["custbody_ht_factura_directa", "anyof", "@NONE@"],
                                "AND",
                            ["memomain","isnot","VOID"]
                            ],

                        columns:
                            [
                                //Datos Cabecera
                                search.createColumn({ name: "internalid", label: "ID interno" }),
                                search.createColumn({ name: "tranid", label: "Número de documento" }),
                                search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" }),
                                search.createColumn({ name: "department", label: "Departamento" }),
                                search.createColumn({ name: "class", label: "Clase" }),
                                search.createColumn({ name: "location", label: "Oficina" }),
                                search.createColumn({ name: "custbody_ht_os_companiaseguros", label: "HT ASEGURADORA" }),
                                search.createColumn({ name: "custbody_ht_os_concesionario", label: "HT CONCESIONARIO" }),
                                search.createColumn({ name: "custbody_ht_os_bancofinanciera", label: "HT FINANCIERA" }),




                                search.createColumn({ name: "item", label: "Artículo" }),
                                search.createColumn({ name: "custitem_ec_item_agrupado", join: "item", label: "Artículo F" }),
                                search.createColumn({
                                    name: "itemid",
                                    join: "item",
                                    label: "Nombre Articulo"
                                }),
                                search.createColumn({ name: "quantity", label: "Cantidad" }),
                                search.createColumn({ name: "unitabbreviation", label: "Unidad" }),
                                // search.createColumn({ name: "baseunit", join: "item", label: "Unidad" }),
                                search.createColumn({ name: "taxcode", label: "Artículo de impuesto sobre las ventas" })

                            ]
                    });
                }


                //contamos los resultados
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug("invoiceSearchObj result count", searchResultCount);


                invoiceSearchObj.run().each(function (result) {
                    respuesta.push({
                        id: result.getValue({ name: 'internalid' }),
                        numero: result.getValue({ name: 'tranid' }),
                        bien: result.getValue({ name: 'custbody_ht_so_bien' }),
                        departamento: result.getValue({ name: 'department' }),
                        clase: result.getValue({ name: 'class' }),
                        oficina: result.getValue({ name: 'location' }),
                        aseguradora: result.getValue({ name: 'custbody_ht_os_companiaseguros' }),
                        concesionario: result.getValue({ name: 'custbody_ht_os_concesionario' }),
                        financiera: result.getValue({ name: 'custbody_ht_os_bancofinanciera' }),




                        item: result.getValue({ name: 'item' }),
                        item_f: result.getValue({ name: 'custitem_ec_item_agrupado', join: "item" }),
                        nombreItem: result.getValue({
                            name: "itemid",
                            join: "item",
                        }),
                        cantidad: result.getValue({ name: 'quantity' }),
                        unidad: result.getValue({ name: "unitabbreviation" }),
                        taxcode: result.getValue({ name: 'taxcode' })
                    });


                    return true;
                });


                return respuesta;

            } catch (error) {
                log.error('getFacturasLineasFIN', error);

            }

        }

        const agregarCola = (params) => {
            try {
                let createCola = record.create({
                    type: 'customrecord_ts_standar_ss_cola',
                    isDynamic: true
                });

                createCola.setValue({
                    fieldId: 'name',
                    value: 'Agrupacion Factura OS'
                });

                createCola.setValue({
                    fieldId: 'custrecord_ts_ss_parametros',
                    value: JSON.stringify(params)
                });

                createCola.setValue({
                    fieldId: 'custrecord_ts_ss_estado',
                    value: 'pendiente'
                });

                createCola.setValue({
                    fieldId: 'custrecord_ts_ss_creado_por',
                    value: params.usuario
                });

                createCola.setValue({
                    fieldId: 'custrecord_ts_ss_fecha_inicio',
                    value: new Date()
                });

                createCola.save();

            } catch (e) {
                log.error('Agregar Cola Error', e)
            }
        }


        const createCabLog = (params) => {
            try {
                let cabLog = record.create({
                    type: 'customrecord_ts_log_ejec_agrup_fact_cab',
                    isDynamic: true
                });

                cabLog.setValue({
                    fieldId: 'name',
                    value: 'Agrupacion de Facturas'
                });


                cabLog.setValue({
                    fieldId: 'custrecord_ts_estado',
                    value: 'pendiente'
                });

                cabLog.setValue({
                    fieldId: 'custrecord_ts_porcentaje',
                    value: '0%'
                });

                cabLog.setValue({
                    fieldId: 'custrecord_ts_cliente',
                    value: params.cliente
                });

                cabLog.setValue({
                    fieldId: 'custrecord_ts_agrupador',
                    value: params.agrupador
                });

                cabLog.setValue({
                    fieldId: 'custrecord_ts_fecha_inicio',
                    value: new Date()
                });

                if (params.usuario) {
                    cabLog.setValue({
                        fieldId: 'custrecord_ts_creado_por',
                        value: params.usuario
                    });
                }


                cabLog.save();

                return cabLog.id;

            } catch (error) {
                log.error('createCabLog', error);
            }
        }





        return { onRequest }


    });
