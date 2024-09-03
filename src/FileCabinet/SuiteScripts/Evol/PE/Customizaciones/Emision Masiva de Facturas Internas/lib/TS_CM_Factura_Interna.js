/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/search', 'N/transaction', 'N/runtime'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search, transaction, runtime) => {
        const CUSTOM_TRANSACTION_FACTURA_INTERNA = "customsale_ec_factura_interna";
        const COMPROBANTE_FISCAL = 37;
        const ESTADO_FACTURA_INTERNA = 2;

        const creacionFacturaInterna = (ordenID, cantidadTotalRegistrosProcesados, contadorProcesados, contentResults) => {
            //log.debug('START', '|========================= START LIB =========================|')
            let buildId = 0;
            let objbuildId = new Array();
            let nroCuota = 1
            let salesOrderToFacturaInterna = record.load({ type: record.Type.SALES_ORDER, id: ordenID, isDynamic: true });
            let tranid = salesOrderToFacturaInterna.getValue('tranid');
            let location = salesOrderToFacturaInterna.getValue('location');
            let numLinesBillingschedule = salesOrderToFacturaInterna.getLineCount({ sublistId: 'billingschedule' });
            let numLinesItem = salesOrderToFacturaInterna.getLineCount({ sublistId: 'item' });

            // log.error('numLines', `${numLinesBillingschedule}`);
            // log.error('numLinesItem', `${numLinesItem}`);
            try {
                if (numLinesBillingschedule > 1) {
                    for (let i = 0; i < numLinesBillingschedule; i++) {
                        let scriptObj = runtime.getCurrentScript();
                        //log.debug('Remaining governance units proccess numLinesBillingschedule: ' + i, scriptObj.getRemainingUsage());
                        let billamount = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'billingschedule', fieldId: 'billamount', line: i });
                        let billdate = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'billingschedule', fieldId: 'billdate', line: i });
                        //log.error('billingschedule', `Conteo ${i}-${billamount}-${billdate}`);
                        let assemblyBuild = record.transform({ fromType: record.Type.SALES_ORDER, fromId: ordenID, toType: CUSTOM_TRANSACTION_FACTURA_INTERNA, isDynamic: true });
                        assemblyBuild.setValue('custbody_ec_created_from_fac_int', ordenID);
                        assemblyBuild.setValue('custbody_ec_nro_cuota_fac_int', nroCuota);
                        assemblyBuild.setValue('custbodyts_ec_tipo_documento_fiscal', COMPROBANTE_FISCAL);
                        assemblyBuild.setValue('location', location);
                        assemblyBuild.setValue('trandate', billdate);
                        for (let j = 0; j < numLinesItem; j++) {
                            let itemOriginal = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j })
                            let itemAgrupado = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_so_item_agrupado', line: j })
                            let quantity = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j })
                            let units = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'units', line: j })
                            log.debug('UNITS', units);
                            quantity = parseFloat(quantity) / numLinesBillingschedule;
                            //log.error('quantity-itemOriginal-itemAgrupado', `${quantity}-${itemOriginal}-${itemAgrupado}`);
                            assemblyBuild.selectLine({ sublistId: 'item', line: j });
                            if (itemAgrupado) {
                                assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemAgrupado });
                            } else {
                                assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemOriginal });
                            }
                            assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: quantity });
                            assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'units', value: units });
                            assemblyBuild.commitLine({ sublistId: 'item' });
                        }
                        buildId = assemblyBuild.save();
                        let fieldLookUp = search.lookupFields({ type: CUSTOM_TRANSACTION_FACTURA_INTERNA, id: buildId, columns: ['tranid'] });
                        //log.error('buildId', `Factura # ${i + 1} - ${fieldLookUp.tranid}`);
                        buildId = fieldLookUp.tranid;
                        objbuildId.push(buildId)
                        nroCuota++
                    }
                    buildId = objbuildId;
                } else {
                    let assemblyBuild = record.transform({ fromType: record.Type.SALES_ORDER, fromId: ordenID, toType: CUSTOM_TRANSACTION_FACTURA_INTERNA, isDynamic: true });
                    assemblyBuild.setValue('custbody_ec_created_from_fac_int', ordenID);
                    assemblyBuild.setValue('custbodyts_ec_tipo_documento_fiscal', COMPROBANTE_FISCAL);
                    assemblyBuild.setValue('location', location);
                    for (let j = 0; j < numLinesItem; j++) {
                        let itemOriginal = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j })
                        let itemAgrupado = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_so_item_agrupado', line: j })
                        let units = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'units', line: j })
                        log.debug('UNITS', units);
                        assemblyBuild.selectLine({ sublistId: 'item', line: j });
                        if (itemAgrupado) {
                            assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemAgrupado });
                        } else {
                            assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemOriginal });
                        }
                        assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'units', value: units });
                        assemblyBuild.commitLine({ sublistId: 'item' });
                    }
                    buildId = assemblyBuild.save();
                    let fieldLookUp = search.lookupFields({ type: CUSTOM_TRANSACTION_FACTURA_INTERNA, id: buildId, columns: ['tranid'] });
                    log.error('buildId', fieldLookUp.tranid);
                    buildId = fieldLookUp.tranid;
                }
                contentResults.push({
                    ordenServicio: tranid,
                    resultado: buildId
                })
            } catch (error) {
                contentResults.push({
                    ordenServicio: tranid,
                    resultado: JSON.stringify(error)
                })
            }
            if (buildId != 0) {
                cantidadTotalRegistrosProcesados = contadorProcesados++
                salesOrderToFacturaInterna.setValue('custbody_ec_estado_factura_interna', ESTADO_FACTURA_INTERNA);
                salesOrderToFacturaInterna.save();
            }
            //log.debug('END', '|========================== END LIB ==========================|')

            return {
                cantidadTotalRegistrosProcesados: cantidadTotalRegistrosProcesados,
                contentResults: contentResults
            }
        }

        const anulacionFacturaInterna = (ordenID, cantidadTotalRegistrosProcesados, contadorProcesados, contentResults) => {
            log.debug('START', '|========================= START LIB =========================|')
            let buildId = 0;

            try {
                let fieldLookUp = search.lookupFields({ type: CUSTOM_TRANSACTION_FACTURA_INTERNA, id: ordenID, columns: ['tranid', 'custbody_ec_created_from_fac_int'] });
                log.error('buildId', fieldLookUp);
                buildId = fieldLookUp.tranid;
                let creadoDesde = fieldLookUp.custbody_ec_created_from_fac_int[0].value
                cantidadTotalRegistrosProcesados = contadorProcesados++
                try {
                    transaction.void({ type: CUSTOM_TRANSACTION_FACTURA_INTERNA, id: ordenID });
                } catch (error) { }

                let transactionSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "CuTrSale113"],
                            "AND",
                            ["custbody_ec_created_from_fac_int", "anyof", creadoDesde],
                            "AND",
                            ["status", "anyof", "CuTrSale113:C"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "tranid", label: "Document Number" })
                        ]
                });
                let searchResultCount = transactionSearchObj.runPaged().count;
                log.debug("Factura Interna result count", searchResultCount);
                if (searchResultCount == 0) {
                    try {
                        let serviceOrderUpdate = record.submitFields({
                            type: SERVICE_ORDER,
                            id: creadoDesde,
                            values: {
                                custbody_ec_estado_factura_interna: _constant.Status.FACTURA_INTERNA_ANULADA
                            },
                        })
                        log.error('serviceOrderUpdate', `Orden de Servicio Actualizada por acción de anulación masiva de Factura Interna: ${serviceOrderUpdate}`);
                    } catch (error) {
                        log.error('Error-serviceOrderUpdate', error);
                    }
                }
                contentResults.push({
                    transaccion: buildId,
                    resultado: 'Anulado'
                })
            } catch (error) {
                contentResults.push({
                    transaccion: buildId,
                    resultado: JSON.stringify(error)
                })
            }
            log.debug('END', '|========================== END LIB ==========================|')

            return {
                cantidadTotalRegistrosProcesados: cantidadTotalRegistrosProcesados,
                contentResults: contentResults
            }
        }

        return { creacionFacturaInterna, anulacionFacturaInterna }
    });
