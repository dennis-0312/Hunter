/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/search', 'N/format', 'N/runtime', 'N/task'],

    (record, log, search, format, runtime, task) => {
        const FORM_EC_FORMULARIO_FACTURA_VENTA = 101;//SANDBOX = 101, PRODUCCION = ?
        const TIPO_DOCUMENTO_18 = 16; //SANDBOX = 16, PRODUCCION = ?

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            try { 


                let cola = getCola(); //Obtenemos la cola

                if (cola.length > 0) {
                    log.debug('execute', 'Ejecucion Iniciada');

                    try {
                        parametros = JSON.parse(cola[0].parametros);


                        // let facturas = getFacturasFIN(parametros.cliente, parametros.fechaInicio, parametros.fechaFin, parametros.tipoOS, parametros.agrupador, 'POST');
                        let facturas = parametros.facturasSeleccionadas;


                        parametros.facturasInternas = facturas;

                        let facturaDirecta = generarFacturaDirecta(parametros, cola[0].id);

                        log.debug('execute', 'Factura Directa Generada: ' + facturaDirecta.id);

                    } catch (e) {
                        log.error('execute error getFacturasFIN', e);
                    }
                    //Verificamos si hay mas ejecuciones pendientes

                    try {
                        let scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_ts_ss_agrupacion_factura_os',
                            deploymentId: 'customdeploy_ts_ss_agrupacion_factura_os',
                            params: {
                                custscript_ts_ss_agrup_fac_params: '{}',
                                custscript_ts_ss_agrup_fac_slect_fact: 't'
                            }
                        });

                        scriptTask.submit();

                    } catch (error) {
                        log.error('Pendientes Task Error', error);

                    }

                }
            } catch (error) {
                log.error('execute', error);

            }
        }




        const generarFacturaDirecta = (params, id_cola) => {
            let idCabLog = params.id_log;
            /* try {
                //Creacion del log
                let parametrosCreacionLog = {
                    cliente: params.cliente,
                    agrupador: params.agrupador,
                    usuario: params.usuario
                };

                idCabLog = createCabLog(parametrosCreacionLog);
            } catch (error) {
                log.error('generarFacturaDirecta', error);
            } */
            try {
                let respuesta = {};
                //Creacion de la factura directa
                let facturaDirecta = record.create({
                    type: record.Type.INVOICE,
                    isDynamic: true
                });

                facturaDirecta.setValue({
                    fieldId: 'customform',
                    value: FORM_EC_FORMULARIO_FACTURA_VENTA
                });

                if (params.facturarA) {
                    facturaDirecta.setValue({
                        fieldId: 'entity',
                        value: params.facturarA
                    });
                } else {
                    facturaDirecta.setValue({
                        fieldId: 'entity',
                        value: params.cliente
                    });
                }

                if (params.agrupador) {
                    facturaDirecta.setValue({
                        fieldId: 'custbody_ht_cod_agru',
                        value: params.agrupador
                    });
                }

                facturaDirecta.setValue({
                    fieldId: 'trandate',
                    value: new Date()
                });

                facturaDirecta.setValue({
                    fieldId: 'memo',
                    value: params.glosa
                });

                facturaDirecta.setValue({
                    fieldId: 'department',
                    value: params.facturaDirecta.departamento
                });

                facturaDirecta.setValue({
                    fieldId: 'class',
                    value: params.facturaDirecta.clase
                });

                facturaDirecta.setValue({
                    fieldId: 'location',
                    value: params.facturaDirecta.oficina
                });

                facturaDirecta.setValue({
                    fieldId: 'custbodyts_ec_tipo_documento_fiscal',
                    value: TIPO_DOCUMENTO_18
                });

                facturaDirecta.setValue({
                    fieldId: 'terms',
                    value: params.terminoPago
                });

                facturaDirecta.setValue({
                    fieldId: 'custbodyec_nota_cliente',
                    value: params.notaFactura
                });

                //Lista de items que no inventariables
                // let itemNoInv = getItemsNoInv();

                //Actualizamos el porcentaje del log
                try {
                    updateCabLog({
                        idCabLog: idCabLog,
                        porcentaje: '30%'
                    });
                } catch (error) {
                    log.error('generarFacturaDirecta', error);

                }

                //Agregamos las lineas a la factura directa
                for (i = 0; i < params.facturaDirecta.items.length; i++) {
                    //let cantidad = params.facturaDirecta.items[i].cantidad;

                    facturaDirecta.selectNewLine({
                        sublistId: 'item'
                    });

                    //Validamos el Articulo es diferente de SRV 

                    if (params.facturaDirecta.items[i].item_f) {
                        facturaDirecta.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: params.facturaDirecta.items[i].item_f
                        });

                    } else {

                        //Buscamos dentro del array por el nombre del item (params.facturaDirecta.items[i].nombre + '-F')
                        // let articuloNoIng = itemNoInv.find(item => item.itemid == params.facturaDirecta.items[i].nombre + '-F');
 
                        facturaDirecta.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: params.facturaDirecta.items[i].id
                        });

                    }

                    facturaDirecta.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: params.facturaDirecta.items[i].cantidad
                    });

                    facturaDirecta.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'department',
                        value: params.facturaDirecta.departamento
                    });

                    facturaDirecta.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'class',
                        value: params.facturaDirecta.clase
                    });

                    facturaDirecta.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location',
                        value: params.facturaDirecta.oficina
                    });


                    facturaDirecta.commitLine({
                        sublistId: 'item'
                    });

                }

                let facturaDirectaId = facturaDirecta.save();

                //Actualizamos el porcentaje del log
                try {
                    updateCabLog({
                        idCabLog: idCabLog,
                        porcentaje: '60%'
                    });
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }

                //Asociamos las facturas internas

                AsociarFacturasInternas(params.facturasInternas, facturaDirectaId);

                //Actualizamos el porcentaje del log

                try {
                    updateCabLog({
                        idCabLog: idCabLog,
                        porcentaje: '90%'
                    });
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }

                //Asociamos las facturas directas
                AsociarFacturasDirecta(params.facturasInternas, facturaDirectaId);

                //Actualizamos el porcentaje del log
                try {
                    updateCabLog({
                        idCabLog: idCabLog,
                        porcentaje: '100%',
                        estado: 'Finalizado',
                        idFacturaDirecta: facturaDirectaId,
                        fechaFin: true,
                        errores: 'OK'
                    });

                    updateCola({
                        id: id_cola,
                        estado: 'Completado'
                    })
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }

                respuesta = {
                    id: facturaDirectaId
                };

                return respuesta;

            } catch (error) {
                log.error('generarFacturaDirecta', error);
                //Actualizamos el porcentaje del log
                try {
                    updateCabLog({
                        idCabLog: idCabLog,
                        porcentaje: '100%',
                        estado: 'Error',
                        fechaFin: true,
                        errores: error
                    });

                    updateCola({
                        id: id_cola,
                        estado: 'Error',
                        errores: error
                    })

                } catch (error) {
                    log.error('generarFacturaDirecta', error);

                }


            }
        }



        const AsociarFacturasInternas = (facturas, facturaDirecta) => {
            try {
                for (i = 0; i < facturas.length; i++) {
                    let factura = record.create({
                        type: "customrecord_ht_fact_internas_asociadas",
                        isDynamic: true
                    });

                    factura.setValue({
                        fieldId: 'custrecord_nro_factura',
                        value: facturaDirecta
                    });

                    factura.setValue({
                        fieldId: 'custrecord_nro_factura_interna',
                        value: facturas[i].id
                    });

                    factura.setValue({
                        fieldId: 'custrecord_orden_servicio',
                        value: facturas[i].creado_desde
                    });

                    if(facturas[i].nro_cuota){
                        factura.setValue({
                            fieldId: 'custrecord_nro_cuota',
                            value: facturas[i].nro_cuota
                        });
                    }
                 

                    factura.save();
                }
            } catch (e) {
                log.error('AsociarFacturasInternas', e);
            }
        }

        const AsociarFacturasDirecta = (facturas, facturaDirecta) => {
            try {
                for (i = 0; i < facturas.length; i++) {


                    let factura = record.submitFields({
                        type: "customsale_ec_factura_interna",
                        id: facturas[i].id,
                        values: {
                            custbody_ht_factura_directa: facturaDirecta
                        }
                    });
 
                }
            } catch (e) {
                log.error('AsociarFacturasDirecta', e);
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
                    value: 'En Proceso'
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

        const updateCabLog = (params) => {
            try {
                let cabLog = record.load({
                    type: 'customrecord_ts_log_ejec_agrup_fact_cab',
                    id: params.idCabLog
                });

                cabLog.setValue({
                    fieldId: 'custrecord_ts_porcentaje',
                    value: params.porcentaje
                });

                cabLog.setValue({
                    fieldId: 'custrecord_ts_error',
                    value: params.errores
                });


                if (params.estado) {
                    cabLog.setValue({
                        fieldId: 'custrecord_ts_estado',
                        value: params.estado
                    });
                }


                if (params.fechaFin) {
                    cabLog.setValue({
                        fieldId: 'custrecord_ts_fecha_fin',
                        value: new Date()
                    });
                }

                if (params.idFacturaDirecta) {
                    cabLog.setValue({
                        fieldId: 'custrecord_ts_fact_direct',
                        value: params.idFacturaDirecta
                    });
                }


                cabLog.save();

            } catch (error) {
                log.error('updateCabLog', error);
            }
        }

        const getCola = () => {
            try {
                let respuesta = [];
                var customrecord_ts_standar_ss_colaSearchObj = search.create({
                    type: "customrecord_ts_standar_ss_cola",
                    filters:
                        [
                            ["custrecord_ts_ss_estado", "is", "pendiente"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalId", label: "internalId" }),
                            search.createColumn({ name: "custrecord_ts_ss_fecha_inicio", label: "Fecha_Inicio" }),
                            search.createColumn({ name: "custrecord_ts_ss_parametros", label: "Parametros" })
                        ]
                });
                var searchResultCount = customrecord_ts_standar_ss_colaSearchObj.runPaged().count;
                log.debug("customrecord_ts_standar_ss_colaSearchObj result count", searchResultCount);
                customrecord_ts_standar_ss_colaSearchObj.run().each(function (result) {
                    respuesta.push({
                        id: result.getValue({ name: 'internalId' }),
                        ejecucionesPendientes: searchResultCount,
                        fechaInicio: result.getValue({ name: 'custrecord_ts_ss_fecha_inicio' }),
                        parametros: result.getValue({ name: 'custrecord_ts_ss_parametros' })
                    });
                    return true;
                });

                //Ordenamos la cola por fecha de inicio
                respuesta.sort((a, b) => {
                    return new Date(a.fechaInicio) - new Date(b.fechaInicio);
                });


                return respuesta;




            } catch (e) {
                log.error('getCola Error', e);
            }
        }

        const updateCola = (params) => {
            try {
                let cola = record.load({
                    type: 'customrecord_ts_standar_ss_cola',
                    id: params.id
                });

                cola.setValue({
                    fieldId: 'custrecord_ts_ss_estado',
                    value: params.estado
                });

                cola.setValue({
                    fieldId: 'custrecord_ts_ss_fecha_fin',
                    value: new Date()
                });

                if (params.errores) {
                    cola.setValue({
                        fieldId: 'custrecord_ts_ss_error',
                        value: params.errores
                    });
                }

                cola.save();


            } catch (error) {
                log.error('updateCola', error);
            }
        }
 

        return { execute }

    });
