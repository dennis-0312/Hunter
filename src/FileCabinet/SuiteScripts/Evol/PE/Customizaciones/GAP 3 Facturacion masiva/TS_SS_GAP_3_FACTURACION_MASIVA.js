/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/search', 'N/format', 'N/runtime', 'N/task', 'N/file', 'N/transaction'],

    (record, log, search, format, runtime, task, file, transaction) => {
        const FORM_EC_FORMULARIO_FACTURA_VENTA = 101;//SANDBOX = 101, PRODUCCION = ?
        const FORM_PE_FORMULARIO_FACTURA_VENTA = 183;
        const TIPO_DOCUMENTO_18 = 16; //SANDBOX = 16, PRODUCCION = ?
        const TIPO_DOCUMENTO_01 = 50;
        const LOG_RECORD = 'customrecord_ts_standar_ss_cola_maf_mov'
        const inputfolder = 18054;
        const PENDIENTE = 3;
        const COMPLETADO = 1;
        const ERROR = 2;
        const PROCESANDO = 4;


        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            try {
                let cola = getCola(); //Obtenemos la cola
                log.debug('cola', cola);
                if (cola.length > 0) {
                    log.debug('execute', 'Ejecucion Iniciada');
                    // try {
                    let fileObjContent = file.load({ id: cola[0].parametros });
                    parametros = JSON.parse(fileObjContent.getContents());

                    let facturas = parametros.facturasSeleccionadas;
                    parametros.facturasInternas = facturas;
                    let facturaDirecta = generarFacturaDirecta(parametros, cola[0]);
                    log.debug('execute', 'Factura Directa Generada: ' + facturaDirecta.id);
                    //} catch (e) {
                    //7  log.error('execute error getFacturasFIN', e);
                    // }
                    //Verificamos si hay mas ejecuciones pendientes
                    try {
                        let scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_ts_ss_gap_3_facturacion_mas',
                            deploymentId: 'customdeploy_ts_ss_gap_3_facturacion_mas',
                            params: {
                                custscriptts_ss_agrup_fac_par_pe: '{}',
                                custscript_ts_ss_agrup_fac_slect_fact_pe: 't'
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
            log.debug('params', params);
            let idCabLog = params.id_log;
            var facturas = new Array();
            try {
                let respuesta = new Object();

                for (i = 0; i < params.facturaDirecta.length; i++) {

                    let facturaDirecta = record.transform({
                        fromType: 'salesorder',
                        fromId: params.facturaDirecta[i].id,
                        toType: 'invoice',
                        isDynamic: false,
                    });

                    let numInvoiceItems = facturaDirecta.getLineCount({ sublistId: 'item' });
                    datosdefactura(facturaDirecta, params, i, params.facturaDirecta[i].cliente);
                    var totaldescuento = 0;
                    var totaldescuentoprimera = 0;

                    for (let j = numInvoiceItems - 1; j >= 0; j--) {
                        let invoiceItemId = facturaDirecta.getSublistValue({ sublistId: 'item', fieldId: 'line', line: j });
                        let itemid = facturaDirecta.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                        let itemtype = facturaDirecta.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                        let rate = facturaDirecta.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: j });
                        if (invoiceItemId !== params.facturaDirecta[i].linea && params.tipo_generado == 'MAF') {
                            facturaDirecta.removeLine({ sublistId: 'item', line: j });
                        }
                        var entroelemento = 0;
                        totaldescuento = 0;
                        if (params.tipo_generado == 'MOVILIZA') {
                            for (let index = 0; index < params.facturaDirecta[i].items.length; index++) {
                                if (itemid == params.facturaDirecta[i].items[index].id) {
                                    entroelemento = 1;
                                }

                                totaldescuento += parseFloat(params.facturaDirecta[i].items[index].rate)
                            }
                            if (itemtype == 'Service' && entroelemento == 1) {
                                totaldescuentoprimera = rate;
                                totaldescuento = parseFloat(352.82) - (totaldescuento - parseFloat(rate));
                                facturaDirecta.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: j, value: totaldescuento });
                            }
                        }
                    }
                    log.debug('totaldescuentoprimera', totaldescuentoprimera);
                    let invoiceId = facturaDirecta.save({ ignoreMandatoryFields: true });
                    if (params.tipo_generado == 'MOVILIZA') {
                        let facturaOriginal = record.copy({
                            type: record.Type.INVOICE,
                            id: invoiceId,
                            isDynamic: false // Si necesitas modificar valores antes de guardarla
                        });
                        facturaOriginal.setValue({ fieldId: 'approvalstatus', value: 2 });
                        let numInvoiceItemssegundo = facturaOriginal.getLineCount({ sublistId: 'item' });
                        var totaldescuento = 0;
                        for (let f = numInvoiceItemssegundo - 1; f >= 0; f--) {
                            let itemtype = facturaOriginal.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: f });
                            let rate = facturaOriginal.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: f });
                            if (itemtype != 'Service') {
                                facturaOriginal.removeLine({ sublistId: 'item', line: f });

                            } else {
                                facturaOriginal.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: f, value: (parseFloat(totaldescuentoprimera) - parseFloat(rate)) });
                            }
                        }
                        let nuevaFacturaId = facturaOriginal.save({ ignoreMandatoryFields: true });

                        facturas.push(nuevaFacturaId);

                    }
                    if (params.tipo_generado == 'MAF' || params.tipo_generado == 'MOVILIZA') {
                        let loadRecord = record.load({ type: 'salesorder', id: params.facturaDirecta[i].id, isDynamic: true });
                        var linkscount = loadRecord.getLineCount({ sublistId: 'item' });
                        for (var index = 0; index < linkscount; index++) {
                            var item = loadRecord.getSublistValue({ sublistId: 'item', fieldId: 'line', line: index });
                            if (item == params.facturaDirecta[i].linea) {
                                loadRecord.selectLine({ sublistId: 'item', line: index });
                                loadRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_fac_agru', value: invoiceId });
                                loadRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_fec_fact', value: new Date() });
                                loadRecord.commitLine({ sublistId: 'item' });
                            }
                            if (params.tipo_generado == 'MOVILIZA') {
                                loadRecord.selectLine({ sublistId: 'item', line: index });
                                loadRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_fac_agru', value: invoiceId });
                                loadRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_fec_fact', value: new Date() });
                                loadRecord.commitLine({ sublistId: 'item' });
                            }

                        }
                        loadRecord.save();
                    }


                    facturas.push(invoiceId);

                }



                log.debug('facturas', facturas);
                try {
                    updateCabLog({ idCabLog: idCabLog, porcentaje: '100%' });
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }

                let fileObjContent = file.load({ id: id_cola.parametros });
                contentResults = JSON.parse(fileObjContent.getContents());
                contentResults.facturaDirectaid = facturas;
                let returnFileId = saveJson(contentResults, fileObjContent.name, inputfolder)
                id_cola.facturaDirectaid = facturas
                taskScheduled(id_cola)

                try {
                    updateCabLog({ idCabLog: idCabLog, porcentaje: '100%', estado: 'Finalizado', idFacturaDirecta: facturas, fechaFin: true, errores: 'OK' });
                    updateCola({ id: id_cola.id, estado: 'Completado' })
                } catch (error) {
                    log.error('generarFacturaDirecta', error);
                }
                respuesta = { id: facturas };
                return respuesta;
            } catch (error) {
                log.error('generarFacturaDirecta', error);
                //Actualizamos el porcentaje del log
                try {
                    updateCabLog({ idCabLog: idCabLog, porcentaje: '100%', estado: 'Error', fechaFin: true, errores: error });
                    updateCola({ id: id_cola.id, estado: 'Error', errores: error })
                } catch (error) {
                    log.error('generarFacturaDirecta', error);

                }
            }
        }
        const datosdefactura = (facturaDirecta, params, i, cliente) => {
            const result = search.lookupFields({
                type: 'salesorder',
                id: params.facturaDirecta[i].id,
                columns: ['department', 'class', 'location']
            });
            facturaDirecta.setValue({ fieldId: 'customform', value: FORM_PE_FORMULARIO_FACTURA_VENTA });
            facturaDirecta.setValue({ fieldId: 'entity', value: cliente });
            params.account ? facturaDirecta.setValue({ fieldId: 'account', value: params.account }) : log.debug('Account', 'Cuenta por configurada.');
            if (params.agrupador) { facturaDirecta.setValue({ fieldId: 'custbody_ht_cod_agru', value: params.agrupador }); }
            facturaDirecta.setValue({ fieldId: 'trandate', value: new Date() });
            facturaDirecta.setValue({ fieldId: 'memo', value: params.glosa });
            facturaDirecta.setValue({ fieldId: 'currency', value: params.currency });

            facturaDirecta.setValue({ fieldId: 'department', value: result.department[0].value });
            facturaDirecta.setValue({ fieldId: 'class', value: result.class[0].value });
            facturaDirecta.setValue({ fieldId: 'location', value: params.ubicacion });
            facturaDirecta.setValue({ fieldId: 'approvalstatus', value: 2 });


            facturaDirecta.setValue({ fieldId: 'custbody_pe_document_type', value: params.tipo_doc });
            facturaDirecta.setValue({ fieldId: 'terms', value: params.terminoPago });
            facturaDirecta.setValue({ fieldId: 'custbodyec_nota_cliente', value: params.notaFactura });
            facturaDirecta.setValue({ fieldId: 'custbody_ht_status_process_group', value: PENDIENTE });
            facturaDirecta.setValue({ fieldId: 'custbody_pe_serie', value: params.serie });

            facturaDirecta.setValue({ fieldId: 'custbody_pe_ei_forma_pago', value: params.forma_pago });
            facturaDirecta.setValue({ fieldId: 'custbody_pe_concept_detraction', value: params.concept_detraction });
            facturaDirecta.setValue({ fieldId: 'custbody_pe_ei_operation_type', value: params.tipo_operacion });
            if (params.gratutita != 'F') {
                facturaDirecta.setValue({ fieldId: 'custbody_pe_free_operation', value: true });
                facturaDirecta.setValue({ fieldId: 'discountitem', value: 43898 });
            }
        }
        const getWitaxCode = (conceptDetraction, currencyName) => {
            try {
                let objSearch = search.create({
                    type: "customrecord_pe_concept_detraction",
                    filters:
                        [
                            ["internalid", "anyof", conceptDetraction]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "Name" }),
                            search.createColumn({ name: "custrecord_pe_code_detraccion", label: "PE Code Detraccion" }),
                            search.createColumn({ name: "custrecord_pe_percentage_detraction", label: "PE Percentage Detraction" }),
                            search.createColumn({ name: "custrecord_pe_tax_codes_pen", label: "PE Tax Code Soles" }),
                            search.createColumn({ name: "custrecord_pe_tax_codes_dol", label: "PE Tax Code Dolares" })
                        ]
                });
                let searchResultCount = objSearch.runPaged().count;
                log.error('searchResultCount-getWitaxCode', searchResultCount);
                const searchResult = objSearch.run().getRange(0, 1);
                log.error('searchResult-getWitaxCode', searchResult);
                let column01 = currencyName == 'Soles' ? searchResult[0].getValue(objSearch.columns[3]) : searchResult[0].getValue(objSearch.columns[4]);
                return {
                    taxCodes: column01,
                    percentageDetraction: searchResult[0].getValue(objSearch.columns[2])
                };

                // const searchLoad = search.create({
                //     type: "customrecord_4601_witaxcode",
                //     filters:
                //         [
                //             ["custrecord_4601_wtc_witaxtype", "anyof", "1"],
                //             "AND",
                //             ["custrecord_4601_wtc_rate", "equalto", detraction]
                //         ],
                //     columns:
                //         [
                //             search.createColumn({ name: "internalid", label: "Internal ID" })
                //         ]
                // });

                // const searchResult = searchLoad.run().getRange(0, 1);
                // let column01 = searchResult[0].getValue(searchLoad.columns[0]);
                // return column01;



            } catch (error) {
                log.error('Error-getWitaxCode', error)
            }
        }
        const updateCabLog = (params) => {
            try {
                let cabLog = record.load({ type: 'customrecord_ts_log_ejec_agrup_fact_mm', id: params.idCabLog });
                cabLog.setValue({ fieldId: 'custrecord_ts_porcentaje_mm', value: params.porcentaje });
                cabLog.setValue({ fieldId: 'custrecord_ts_error_mm', value: params.errores });
                if (params.estado) { cabLog.setValue({ fieldId: 'custrecord_ts_estado_mm', value: params.estado }) }
                if (params.fechaFin) { cabLog.setValue({ fieldId: 'custrecord_ts_fecha_fin_mm', value: new Date() }) }
                if (params.idFacturaDirecta) { cabLog.setValue({ fieldId: 'custrecord_ts_fact_direct_mm', value: params.idFacturaDirecta }) }
                cabLog.save();
            } catch (error) {
                log.error('updateCabLog', error);
            }
        }

        const getCola = () => {
            try {
                let respuesta = new Array();
                var customrecord_ts_standar_ss_colaSearchObj = search.create({
                    type: "customrecord_ts_standar_ss_cola_maf_mov",
                    filters:
                        [
                            ["custrecord_ts_ss_estado_mm", "is", "pendiente"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalId", label: "internalId" }),
                            search.createColumn({ name: "custrecord_ts_ss_fecha_inicio_mm", label: "Fecha_Inicio" }),
                            search.createColumn({ name: "custrecord_ts_ss_parametros_mm", label: "Parametros" })
                        ]
                });
                var searchResultCount = customrecord_ts_standar_ss_colaSearchObj.runPaged().count;
                log.debug("customrecord_ts_standar_ss_colaSearchObj result count", searchResultCount);
                customrecord_ts_standar_ss_colaSearchObj.run().each(function (result) {
                    respuesta.push({
                        id: result.getValue({ name: 'internalId' }),
                        ejecucionesPendientes: searchResultCount,
                        fechaInicio: result.getValue({ name: 'custrecord_ts_ss_fecha_inicio_mm' }),
                        parametros: result.getValue({ name: 'custrecord_ts_ss_parametros_mm' })
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
                let cola = record.load({ type: 'customrecord_ts_standar_ss_cola_maf_mov', id: params.id });
                cola.setValue({ fieldId: 'custrecord_ts_ss_estado_mm', value: params.estado });
                cola.setValue({ fieldId: 'custrecord_ts_ss_fecha_inicio_mm', value: new Date() });
                if (params.errores) { cola.setValue({ fieldId: 'custrecord_ts_ss_error_mm', value: params.errores }) }
                cola.save();
            } catch (error) {
                log.error('updateCola', error);
            }
        }

        const taskScheduled = (objSendData) => {
            try {
                const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                mrTask.scriptId = 'customscript_ts_sc_agru_fac_asociar_bulk';
                mrTask.deploymentId = 'customdeploy_ts_sc_agru_fac_asociar_bulk';
                mrTask.params = {
                    custscript_ts_sc_fabulk_lote_id: objSendData.id,
                    custscript_ts_sc_fabulk_punto_inicial: 0,
                    custscript_ts_sc_fabulk_countproccesstot: 0,
                    custscript_ts_sc_fabulk_retorno: 0,
                    custscript_ts_sc_fabulk_facturaDirectaid: objSendData.facturaDirectaid
                }
                let taskToken = mrTask.submit();
                log.error('taskToken', taskToken);
            } catch (error) {
                log.error('Error-taskScheduled', error);
                record.submitFields({ type: LOG_RECORD, id: recordId, values: { custrecord_ts_ss_estado_asociar_fac: PENDIENTE } });
            }
        }

        const saveJson = (contents, nombre, folder) => {
            let fileObj = file.create({
                name: nombre,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: folder,
                isOnline: false
            });
            return fileObj.save();
        }

        return { execute }

    });


// if (params.facturarA) {
//     facturaDirecta.setValue({ fieldId: 'entity', value: params.facturarA });
// } else {
//     facturaDirecta.setValue({ fieldId: 'entity', value: params.cliente });
// }