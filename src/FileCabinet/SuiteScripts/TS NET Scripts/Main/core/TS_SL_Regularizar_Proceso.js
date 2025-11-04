/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/https',
    'N/log',
    'N/record',
    'N/runtime',
    'N/search',
    'N/file',
    'N/query',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
],
    /**
 * @param{https} https
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (https, log, record, runtime, search, file, query, _controller, _constant) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let idServiceOrder = ''
            try {
                let method = scriptContext.request.method;
                if (method == 'GET') {
                    idServiceOrder = scriptContext.request.parameters.idServiceOrder;
                    let customer = scriptContext.request.parameters.customer;
                    let vehiculo = scriptContext.request.parameters.vehiculo;
                    let ordenServicio = scriptContext.request.parameters.ordenServicio;
                    let resultVerifyCreateWorkOrder = verifyCreateWorkOrder(idServiceOrder);
                    let resultverifyExistWorkOrder = verifyExistWorkOrder(idServiceOrder);
                    let urlParams = {
                        serviceOrder: idServiceOrder,
                        customer: customer,
                        vehiculo: vehiculo,
                        ordenServicio: ordenServicio,
                        comentario: ''
                    }
                    log.debug('urlParams', urlParams)
                    for (let i = 0; i < resultVerifyCreateWorkOrder.length; i++) {
                        let existe = false; // Variable para verificar si el item existe
                        for (let j = 0; j < resultverifyExistWorkOrder.length; j++) {
                            if (resultVerifyCreateWorkOrder[i].item === resultverifyExistWorkOrder[j].item) {
                                existe = true; // Si encontramos el item, cambiamos la variable a true
                                break; // Salimos del bucle interno ya que ya encontramos el item
                            }
                        }
                        if (existe) {
                            log.debug('Verificando Existencia de OT', `Ya existe una OT para el item ${resultVerifyCreateWorkOrder[i].item}`);
                        } else {
                            log.debug('Verificando Existencia de OT', `NO existe una OT para el item ${resultVerifyCreateWorkOrder[i].item}`);
                            urlParams.item = resultVerifyCreateWorkOrder[i].item
                            log.debug('urlParamsForItem', urlParams);
                            let workOrder = _controller.parametros(_constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO, urlParams);
                            log.debug('workOrder', workOrder);
                            let adp = _controller.getParameter(resultVerifyCreateWorkOrder[i].item, _constant.Parameter.ADP_ACCION_DEL_PRODUCTO);
                            if (adp == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO ||
                                adp == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP ||
                                adp == _constant.Valor.VALOR_007_CHEQUEO_DE_COMPONENTES ||
                                adp == _constant.Valor.VALOR_013_CHEQUEO_OTROS_PRODUCTOS) {
                                let fam = _controller.getParameter(resultVerifyCreateWorkOrder[i].item, _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS);
                                if (fam != 0) {
                                    let field = _controller.getFieldsCobertura(vehiculo, fam);
                                    if (field != 0) {
                                        log.debug('fields', field);
                                        record.submitFields({
                                            type: _constant.customRecord.ORDEN_TRABAJO,
                                            id: workOrder,
                                            values: {
                                                'custrecord_ht_ot_serieproductoasignacion': field[0]['custrecord_ht_co_numeroserieproducto'],
                                                'custrecord_ht_ot_ubicacion': field[0]['custrecord_ht_mc_ubicacion'] == null ? '' : field[0]['custrecord_ht_mc_ubicacion'],
                                                'custrecord_ht_ot_dispositivo': field[0]['custrecord_ht_co_numerodispositivo'] == null ? '' : field[0]['custrecord_ht_co_numerodispositivo'],
                                                'custrecord_ht_ot_modelo': field[0]['custrecord_ht_co_modelodispositivo'] == null ? '' : field[0]['custrecord_ht_co_modelodispositivo'],
                                                'custrecord_ht_ot_unidad': field[0]['custrecord_ht_co_unidad'] == null ? '' : field[0]['custrecord_ht_co_unidad'],
                                                'custrecord_ht_ot_firmware': field[0]['custrecord_ht_co_firmware'] == null ? '' : field[0]['custrecord_ht_co_firmware'],
                                                'custrecord_ht_ot_script': field[0]['custrecord_ht_co_script'] == null ? '' : field[0]['custrecord_ht_co_script'],
                                                'custrecord_ht_ot_servidor': field[0]['custrecord_ht_co_servidor'] == null ? '' : field[0]['custrecord_ht_co_servidor'],
                                                'custrecord_ht_ot_simcard': field[0]['custrecord_ht_co_celularsimcard'] == null ? '' : field[0]['custrecord_ht_co_celularsimcard'],
                                                'custrecord_ht_ot_ip': field[0]['custrecord_ht_co_ip'] == null ? '' : field[0]['custrecord_ht_co_ip'],
                                                'custrecord_ht_ot_apn': field[0]['custrecord_ht_co_apn'] == null ? '' : field[0]['custrecord_ht_co_apn'],
                                                'custrecord_ht_ot_imei': field[0]['custrecord_ht_co_imei'] == null ? '' : field[0]['custrecord_ht_co_imei'],
                                                'custrecord_ht_ot_vid': field[0]['custrecord_ht_co_vid'] == null ? '' : field[0]['custrecord_ht_co_vid'],
                                                'custrecord_ht_ot_boxserie': field[0]['custrecord_ht_co_seriedispolojack'] == null ? '' : field[0]['custrecord_ht_co_seriedispolojack'],
                                                'custrecord_ht_ot_codigoactivacion': field[0]['custrecord_ht_co_codigoactivacion'] == null ? '' : field[0]['custrecord_ht_co_codigoactivacion'],
                                                'custrecord_ht_ot_codigorespuesta': field[0]['custrecord_ht_co_codigorespuesta'] == null ? '' : field[0]['custrecord_ht_co_codigorespuesta']
                                            },
                                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                                        });
                                    }
                                }
                            }

                            // if (esGarantia) {
                            //     var bien = objRecord.getValue('custbody_ht_so_bien');
                            //     if (workOrder != 0) {
                            //         let itemVentaGarantia = new Array();
                            //         if (bien != '') { itemVentaGarantia = _controller.getProductoInstalado(bien, fam) }
                            //         log.debug("itemVentaGarantia", itemVentaGarantia);
                            //         if (itemVentaGarantia.toString().length > 0) {
                            //             let workOrderResult = search.create({
                            //                 type: _constant.customRecord.ORDEN_TRABAJO,
                            //                 filters: [["custrecord_ht_ot_orden_servicio", "anyof", idRecord]],
                            //                 columns: ["internalid"]
                            //             }).run().getRange(0, 100);
                            //             log.debug("workOrderResult", workOrderResult.length);
                            //             if (workOrderResult.length) {
                            //                 for (let i = 0; i < workOrderResult.length; i++) {
                            //                     let ordenTrabajoId = workOrderResult[i].id;
                            //                     let otid = record.submitFields({
                            //                         type: _constant.customRecord.ORDEN_TRABAJO,
                            //                         id: ordenTrabajoId,
                            //                         values: { "custrecord_ts_item_venta_garantia": itemVentaGarantia }
                            //                     });
                            //                     log.debug("OrdenTrabajoUpdate", `Orden de Trabajo ${otid} actualizada por flujo de garantía`);

                            //                 }
                            //             }
                            //         }
                            //     }
                            // }
                        }
                    }
                    record.submitFields({
                        type: "salesorder",
                        id: idServiceOrder,
                        values: { custbody_ht_ts_proceso_regularizacion: '' },
                    })
                }
            } catch (error) {
                log.error('Error', error);
                record.submitFields({
                    type: "salesorder",
                    id: idServiceOrder,
                    values: { custbody_ht_ts_proceso_regularizacion: '' },
                })
            }
        }

        const verifyProcessServiceOrder = (recordId) => {
            let jsonBulkFiles = new Array();
            let jsonServicesOrdersCheck = new Array();
            let existe = false;
            let loteSearchObj = search.create({
                type: "customrecord_ht_cr_fac_inter_lote",
                filters:
                    [
                        ["custrecord_ht_fibulk_estado", "anyof", "3", "4"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_fibulk_input", label: "Respuesta JSON" })
                    ]
            });
            let pagedData = loteSearchObj.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach((pageRange) => {
                var myPage = pagedData.fetch({ index: pageRange.index });
                myPage.data.forEach((result) => {
                    let jsonFileInput = result.getValue('custrecord_ht_fibulk_input');
                    jsonBulkFiles.push(jsonFileInput);
                    return true;
                });
            });
            if (jsonBulkFiles.length > 0) {
                for (let index = 0; index < jsonBulkFiles.length; index++) {
                    const element = jsonBulkFiles[index];
                    let fileObj = file.load({ id: element });
                    if (fileObj.size < 10485760) {
                        if (fileObj.getContents().includes(recordId)) {
                            existe = true;
                            break;
                        }
                    }
                }
            }
            log.debug('existe', existe);
            return existe;
        }

        const verifyCreateWorkOrder = (idServiceOrder) => {
            let sql = "SELECT tl.item as item FROM TransactionLine tl " +
                "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacionid = tl.item " +
                "INNER JOIN customrecord_ht_cr_parametrizacion_produ pp ON pa.custrecord_ht_pp_parametrizacion_rela = pp.id " +
                "WHERE tl.transaction = ? " +
                "AND pa.custrecord_ht_pp_parametrizacion_valor = ? " +
                "AND pp.custrecord_ht_pp_code = ?"
                "AND tl.custcol_ht_os_tipoarticulo IS NOT NULL"
            let params = [idServiceOrder, _constant.Valor.SI, _constant.Codigo_parametro.COD_GOT_GENERA_SOLICITUD_DE_TRABAJO];
            let results = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
            log.debug('results.verifyCreateWorkOrder', results);
            if (results[0]) {
                return results;
            } else {
                return 0
            }
        }

        const verifyExistProductionOrder = (idServiceOrder) => {
            let jsonResults = [];
            let workorderSearchObj = search.create({
                type: "workorder",
                filters:
                    [
                        ["type", "anyof", "WorkOrd"],
                        "AND",
                        ["createdfrom", "anyof", idServiceOrder],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "item", label: "Item" })
                    ]
            });
            let searchResultCount = workorderSearchObj.runPaged().count;
            //log.debug("workorderSearchObj result count", searchResultCount);
            workorderSearchObj.run().each((result) => {
                jsonResults.push({
                    id: Number(result.id),
                    item: Number(result.getValue({ name: "item", label: "Item" }))
                })
                return true;
            });
            log.debug('results.verifyExistProductionOrder', jsonResults);
            return jsonResults;
        }

        const verifyExistWorkOrder = (idServiceOrder) => {
            let sql = "SELECT id,custrecord_ht_ot_item as item FROM customrecord_ht_record_ordentrabajo " +
                "WHERE custrecord_ht_ot_orden_servicio = ?"
            let params = [idServiceOrder];
            let results = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
            log.debug('results.verifyExistWorkOrder', results);
            if (results[0]) {
                return results;
            } else {
                return 0
            }
        }

        return { onRequest }

    });

// Clientes:
// Error,ID Externo,ID Hunter,ID Telematic
// No se ha podido encontrar el registro con el ID externo = C-EC-1308369790,C-EC-1308369790,C-EC-1308369790,19711
// No se ha podido encontrar el registro con el ID externo = C-EC-1704546140,C-EC-1704546140,C-EC-1704546140,46182
// No se ha podido encontrar el registro con el ID externo = C-EC-1708387897,C-EC-1708387897,C-EC-1708387897,30983
// No se ha podido encontrar el registro con el ID externo = C-EC-1711785137,C-EC-1711785137,C-EC-1711785137,15822
// No se ha podido encontrar el registro con el ID externo = C-EC-1713141198,C-EC-1713141198,C-EC-1713141198,14413
// No se ha podido encontrar el registro con el ID externo = C-EC-1715848048001,C-EC-1715848048001,C-EC-1715848048001,19120
// No se ha podido encontrar el registro con el ID externo = C-EC-1717656142,C-EC-1717656142,C-EC-1717656142,45827
// No se ha podido encontrar el registro con el ID externo = C-EC-1726903188,C-EC-1726903188,C-EC-1726903188,63901
// No se ha podido encontrar el registro con el ID externo = C-EC-1753819687,C-EC-1753819687,C-EC-1753819687,59537
// No se ha podido encontrar el registro con el ID externo = C-EC-1757667884,C-EC-1757667884,C-EC-1757667884,870
// No se ha podido encontrar el registro con el ID externo = C-EC-1791279743001,C-EC-1791279743001,C-EC-1791279743001,3180
// No se ha podido encontrar el registro con el ID externo = C-EC-1792046912001,C-EC-1792046912001,C-EC-1792046912001,23072
// No se ha podido encontrar el registro con el ID externo = C-EC-0801685140,C-EC-0801685140,C-EC-0801685140,62298
// No se ha podido encontrar el registro con el ID externo = C-EC-0900714726,C-EC-0900714726,C-EC-0900714726,29497
// No se ha podido encontrar el registro con el ID externo = C-EC-0901396952,C-EC-0901396952,C-EC-0901396952,44783
// No se ha podido encontrar el registro con el ID externo = C-EC-0912145000,C-EC-0912145000,C-EC-0912145000,37763
// No se ha podido encontrar el registro con el ID externo = C-EC-0919642611,C-EC-0919642611,C-EC-0919642611,3048
// No se ha podido encontrar el registro con el ID externo = C-EC-0922346556,C-EC-0922346556,C-EC-0922346556,30441
// No se ha podido encontrar el registro con el ID externo = C-EC-0922960703,C-EC-0922960703,C-EC-0922960703,26451
// No se ha podido encontrar el registro con el ID externo = C-EC-0923055214,C-EC-0923055214,C-EC-0923055214,29874
// No se ha podido encontrar el registro con el ID externo = C-EC-0930904115,C-EC-0930904115,C-EC-0930904115,51791
// No se ha podido encontrar el registro con el ID externo = C-EC-0960362655,C-EC-0960362655,C-EC-0960362655,27775
// No se ha podido encontrar el registro con el ID externo = C-EC-0991259546001,C-EC-0991259546001,C-EC-0991259546001,68
// No se ha podido encontrar el registro con el ID externo = C-EC-099224220501,C-EC-099224220501,C-EC-099224220501,32625

// Bien:
// Error,External ID,HT BN COD SYSHUNTER,ID Telematic
// No se ha podido encontrar el registro con el ID externo = 1001055857,1001055857,1001055857,53983
// No se ha podido encontrar el registro con el ID externo = 1001060342,1001060342,1001060342,1417
// No se ha podido encontrar el registro con el ID externo = 1001082337,1001082337,1001082337,3653
// No se ha podido encontrar el registro con el ID externo = 1001097745,1001097745,1001097745,12680
// No se ha podido encontrar el registro con el ID externo = 1001102008,1001102008,1001102008,20397
// No se ha podido encontrar el registro con el ID externo = 1001107398,1001107398,1001107398,29107
// No se ha podido encontrar el registro con el ID externo = 1001108411,1001108411,1001108411,31404
// No se ha podido encontrar el registro con el ID externo = 1001116299,1001116299,1001116299,43661
// No se ha podido encontrar el registro con el ID externo = 1001119638,1001119638,1001119638,48295
// No se ha podido encontrar el registro con el ID externo = 1001119761,1001119761,1001119761,47918
// No se ha podido encontrar el registro con el ID externo = 1001126279,1001126279,1001126279,54822
// No se ha podido encontrar el registro con el ID externo = 1001140845,1001140845,1001140845,61261
// No se ha podido encontrar el registro con el ID externo = 1001145217,1001145217,1001145217,63414
// No se ha podido encontrar el registro con el ID externo = 1001171284,1001171284,1001171284,68517
// No se ha podido encontrar el registro con el ID externo = 1001171309,1001171309,1001171309,68518
// No se ha podido encontrar el registro con el ID externo = 1002045158,1002045158,1002045158,1224
// No se ha podido encontrar el registro con el ID externo = 1002054142,1002054142,1002054142,192
// No se ha podido encontrar el registro con el ID externo = 1002067473,1002067473,1002067473,229
// No se ha podido encontrar el registro con el ID externo = 1002070263,1002070263,1002070263,24095
// No se ha podido encontrar el registro con el ID externo = 1002072389,1002072389,1002072389,48766
// No se ha podido encontrar el registro con el ID externo = 1002073760,1002073760,1002073760,809
// No se ha podido encontrar el registro con el ID externo = 1002099171,1002099171,1002099171,43873
// No se ha podido encontrar el registro con el ID externo = 1002105153,1002105153,1002105153,793
// No se ha podido encontrar el registro con el ID externo = 1002108479,1002108479,1002108479,2461
// No se ha podido encontrar el registro con el ID externo = 1002117580,1002117580,1002117580,11170
// No se ha podido encontrar el registro con el ID externo = 1002124279,1002124279,1002124279,16371
// No se ha podido encontrar el registro con el ID externo = 1002127659,1002127659,1002127659,19810
// No se ha podido encontrar el registro con el ID externo = 1002130286,1002130286,1002130286,22177
// No se ha podido encontrar el registro con el ID externo = 1002132927,1002132927,1002132927,26177
// No se ha podido encontrar el registro con el ID externo = 1002135795,1002135795,1002135795,31009
// No se ha podido encontrar el registro con el ID externo = 1002137434,1002137434,1002137434,32696
// No se ha podido encontrar el registro con el ID externo = 1002138125,1002138125,1002138125,34470
// No se ha podido encontrar el registro con el ID externo = 1002154009,1002154009,1002154009,48675
// No se ha podido encontrar el registro con el ID externo = 1002156663,1002156663,1002156663,50395
// No se ha podido encontrar el registro con el ID externo = 1002178159,1002178159,1002178159,66339
// No se ha podido encontrar el registro con el ID externo = 1002181693,1002181693,1002181693,68085
// No se ha podido encontrar el registro con el ID externo = 1023026587,1023026587,1023026587,13
// No se ha podido encontrar el registro con el ID externo = 1023027827,1023027827,1023027827,1225
// No se ha podido encontrar el registro con el ID externo = 1023034992,1023034992,1023034992,12575
// No se ha podido encontrar el registro con el ID externo = 1023042861,1023042861,1023042861,12256
// No se ha podido encontrar el registro con el ID externo = 1023044744,1023044744,1023044744,12255