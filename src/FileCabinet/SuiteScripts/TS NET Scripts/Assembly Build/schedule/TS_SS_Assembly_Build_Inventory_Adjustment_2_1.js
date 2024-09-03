/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/
define(['N/record', 'N/log', 'N/runtime', 'N/search', 'N/query'],
    function (record, log, runtime, search, query) {
        let currentScript = runtime.getCurrentScript();
        const FIXED_ASSET_ACCOUNT = "370"; // SB: 2676
        const EXPENSE_ACCOUNT = "1312";
        const ECUADOR_SUBSIDIARY = 2;
        const COMPONENTE_DISPOSITIVO_ID = "1";
        const COMPONENTE_LOJACK_ID = "3";
        const DISPOSITIVO_INSTALADO = "1";
        const COMPONENTE_FABRICACION_ID = "5"
        const ACTIVO_FIJO_EN_TRANSITO = 1433;
        const TIPO_MOVIEMIENTO_INGRESO = 1;
        const TIPO_MOVIEMIENTO_SALIDA = 2;
        const TIPO_MOVIEMIENTO_ASIENTO = 3;
        const PRO_ITEM_COMERCIAL_DE_PRODUCCION = 68;
        const SI = 2;

        const execute = (context) => {
            try {
                let scriptParameters = getScriptParameters();
                log.error("scriptParameters.alquiler.length", scriptParameters.alquiler.length);
                log.error("scriptParameters.assemblyFlow", scriptParameters.assemblyFlow);
                if (scriptParameters.assemblyFlow == 'alquiler') {
                    if (scriptParameters.alquiler.length == 0) {
                        let outputInventoryAdjustmentId = createInventoryAdjustmentSalidaSinAlquiler(scriptParameters);
                        createHTAjusteRelacionado(scriptParameters.workorder, outputInventoryAdjustmentId, TIPO_MOVIEMIENTO_SALIDA);

                        let inputInventoryAdjustmentId = createInventoryAdjustmentIngreso(scriptParameters, scriptParameters.comercial);
                        createHTAjusteRelacionado(scriptParameters.workorder, inputInventoryAdjustmentId, TIPO_MOVIEMIENTO_INGRESO);

                        let inputJournalEntryId = createJournalEntrySalidaConAlquiler(scriptParameters.item, outputInventoryAdjustmentId, scriptParameters.location);
                        createHTAjusteRelacionado(scriptParameters.workorder, inputJournalEntryId, TIPO_MOVIEMIENTO_ASIENTO);
                    } else {
                        let outputInventoryAdjustmentId = createInventoryAdjustmentSalidaConAlquiler(scriptParameters);
                        createHTAjusteRelacionado(scriptParameters.workorder, outputInventoryAdjustmentId, TIPO_MOVIEMIENTO_SALIDA);

                        let inputInventoryAdjustmentId = createInventoryAdjustmentIngreso(scriptParameters, scriptParameters.alquiler);
                        createHTAjusteRelacionado(scriptParameters.workorder, inputInventoryAdjustmentId, TIPO_MOVIEMIENTO_INGRESO);
                    }
                    createChaser(scriptParameters);
                } else if (scriptParameters.assemblyFlow == 'custodia') {
                    let inputInventoryAdjustmentId = createInventoryAdjustmentIngresoCustodia(scriptParameters);
                    createHTAjusteRelacionado(scriptParameters.workorder, inputInventoryAdjustmentId);

                    let outputInventoryAdjustmentId = createInventoryAdjustmentSalidaCustodia(scriptParameters);
                    createHTAjusteRelacionado(scriptParameters.workorder, outputInventoryAdjustmentId);
                    createChaser(scriptParameters);

                } else if (scriptParameters.assemblyFlow == 'garantia') {
                    let outputInventoryAdjustmentId = createInventoryAdjustmentSalidaGarantia(scriptParameters);
                    createHTAjusteRelacionado(scriptParameters.workorder, outputInventoryAdjustmentId);
                    createChaser(scriptParameters);
                }
            } catch (error) {
                log.error("error", error)
            }
        }

        const getScriptParameters = () => {
            let scriptParameters = new Object();
            scriptParameters.alquiler = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_alquiler') ? JSON.parse(currentScript.getParameter('custscript_ts_ss_buil_inv_adj_alquiler')) : "";
            scriptParameters.comercial = JSON.parse(currentScript.getParameter('custscript_ts_ss_buil_inv_adj_comercial'));
            scriptParameters.customer = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_customer');
            scriptParameters.location = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_location');
            scriptParameters.item = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_item') || "";
            scriptParameters.workorder = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_workorder') || "";
            scriptParameters.salesorder = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_salesorder') || "";
            scriptParameters.esCustodia = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_escustodia') || "";
            scriptParameters.deviceItem = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_deviceitem');
            scriptParameters.inventoryNumber = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_invtnumber');
            scriptParameters.deviceInventoryNumberId = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_reinvnumid');
            scriptParameters.assemblyFlow = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_assemblyfl');
            scriptParameters.datosTecnicos = currentScript.getParameter('custscript_ts_ss_buil_inv_adj_datotec');
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const createInventoryAdjustmentSalidaCustodia = (scriptParameters) => {
            let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
            newAdjust.setValue({ fieldId: 'customform', value: 120 });
            newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
            newAdjust.setValue({ fieldId: 'account', value: EXPENSE_ACCOUNT });
            newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
            newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
            newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
            setItemstoInventoryAdjustment(newAdjust, scriptParameters);
            let newRecord = newAdjust.save({ enableSourcing: false, ignoreMandatoryFields: true });
            log.error("newRecord createInventoryAdjustmentSalidaCustodia", newRecord);
            return newRecord;
        }

        const createInventoryAdjustmentSalidaGarantia = (scriptParameters) => {
            let sql = 'SELECT custrecord_ht_cuenta_de_garantia as cuentagarantia FROM subsidiary WHERE id = ?';
            let params = [ECUADOR_SUBSIDIARY];
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults();
            log.debug('CUENTA-DE-GARANTIA', results);
            if (results.length > 0) {
                let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
                newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
                newAdjust.setValue({ fieldId: 'account', value: results[0]['cuentagarantia'] });
                newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
                newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
                newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
                setItemstoInventoryAdjustment(newAdjust, scriptParameters);
                let newRecord = newAdjust.save({ enableSourcing: false, ignoreMandatoryFields: true });
                log.error("newRecord", newRecord);
                return newRecord;
            }
        }

        const createInventoryAdjustmentSalidaSinAlquiler = (scriptParameters) => {
            // let sql = 'SELECT it.assetaccount as inventoryaccount, af.custrecord_assettypeassetacc as fixedassetaccount FROM item it ' +
            //     'INNER JOIN customrecord_ncfar_assettype af ON it.custitem_ht_ar_tipoactivo = af.id ' +
            //     'WHERE it.id = ?';
            // let params = [scriptParameters.comercial.item];
            // let resultSet = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
            //let expenseaccount = resultSet.length > 0 ? resultSet : 0
            // log.error("expenseaccount", expenseaccount);
            let sql2 = 'SELECT custrecord_ht_cuenta_activo_fijo_transit FROM subsidiary WHERE id = ?';
            let params2 = [ECUADOR_SUBSIDIARY];
            let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 });
            let results2 = resultSet2.asMappedResults();
            log.debug('CUENTA-ACTIVO-FIJO-TRANSITO SalidaSinAlquiler', results2);
            if (results2.length > 0) {
                let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
                newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
                //newAdjust.setValue({ fieldId: 'account', value: expenseaccount });
                newAdjust.setValue({ fieldId: 'account', value: results2[0]['custrecord_ht_cuenta_activo_fijo_transit'] });
                newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
                newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
                newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
                setItemstoInventoryAdjustment(newAdjust, scriptParameters);
                let newRecord = newAdjust.save({ enableSourcing: false, ignoreMandatoryFields: true });
                log.error("newRecord SalidaSinAlquiler", newRecord);
                return newRecord;
            }
        }

        const setItemstoInventoryAdjustment = (newAdjust, scriptParameters) => {
            if (scriptParameters.assemblyFlow == 'alquiler' && scriptParameters.alquiler.length) {
                for (let i = 0; i < scriptParameters.alquiler.length; i++) {
                    let item = scriptParameters.alquiler[i];
                    let itemtype = getItemType(item.id);
                    log.error("itemtype", { itemtype, id: item.id });

                    //validamos si el id tiene punto "12758.0", si lo tienes lo eliminamos
                    let id = item.id;
                    if (id.includes(".")) {
                        id = id.split(".")[0];
                    }

                    let seriales = scriptParameters.alquiler[i].seriales;
                    log.error('JCEC - seriales', seriales);
                    if (seriales.length < 0) continue;
                    let quantity = seriales.length;
                    newAdjust.selectNewLine({ sublistId: 'inventory' });
                    // newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item.id });.
                    //cambio jcec 19/08/2024
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: id });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: scriptParameters.location });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: -1 * quantity });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: 0 });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'custcol_ec_alq_af', value: true });

                    let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                    for (let j = 0; j < seriales.length; j++) {
                        let inventoryDetail = seriales[j];

                        newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                        if (itemtype != "inventoryitem") {
                            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: inventoryDetail.serial });
                            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: inventoryDetail.deposit });
                            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: inventoryDetail.state });
                        } else {
                            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: inventoryDetail.deposit });
                            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: inventoryDetail.state });
                            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: -1 * inventoryDetail.quantity });
                        }

                        newDetail.commitLine({ sublistId: 'inventoryassignment' });
                    }
                    newAdjust.commitLine({ sublistId: 'inventory' });
                }
            }
            for (let i = 0; i < scriptParameters.comercial.length; i++) {
                let item = scriptParameters.comercial[i];
                let itemtype = getItemType(item.id);
                log.error("itemtype", { itemtype, id: item.id });
                //validamos si el id tiene punto "12758.0", si lo tienes lo eliminamos
                let id = item.id;
                if (id.includes(".")) {
                    id = id.split(".")[0];
                }


                let seriales = scriptParameters.comercial[i].seriales;
                if (seriales.length < 0) continue;
                let quantity = seriales.length;
                newAdjust.selectNewLine({ sublistId: 'inventory' });
                // newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item.id });
                //cambio jcec 19/08/2024
                newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: id });
                newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: scriptParameters.location });
                newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: -1 * quantity });

                let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });

                for (let j = 0; j < seriales.length; j++) {
                    let inventoryDetail = seriales[j];

                    newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                    if (itemtype != "inventoryitem") {
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: inventoryDetail.serial });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: inventoryDetail.deposit });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: inventoryDetail.state });
                    } else {
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: inventoryDetail.deposit });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: inventoryDetail.state });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: -1 * inventoryDetail.quantity });
                    }

                    newDetail.commitLine({ sublistId: 'inventoryassignment' });
                }
                newAdjust.commitLine({ sublistId: 'inventory' });
            }
        }

        const getDetailInventoryNumber = (scriptParameters) => {
            let inventoryNumberResult = search.create({
                type: "inventorybalance",
                filters: [
                    ["location", "anyof", scriptParameters.location],
                    "AND",
                    ["item", "anyof", scriptParameters.deviceItem],
                    "AND",
                    ["binnumber.custrecord_deposito_para_custodia", "is", "T"],
                    "AND",
                    ["inventorynumber", "anyof", scriptParameters.deviceInventoryNumberId]
                ],
                columns: [
                    search.createColumn({ name: "binnumber", label: "Bin Number" }),
                    search.createColumn({ name: "inventorynumber", label: "Inventory Number" }),
                    search.createColumn({ name: "status", label: "Status" }),
                    search.createColumn({ name: "available", label: "Available" })
                ]
            }).run().getRange(0, 1);
            if (!inventoryNumberResult.length) return {};
            return {
                binNumber: inventoryNumberResult[0].getValue('binnumber'),
                status: inventoryNumberResult[0].getValue('status'),
                inventoryNumber: inventoryNumberResult[0].getValue('inventorynumber'),
                quantity: -1
            };
        }

        const getItemType = (itemId) => {
            let itemRecord = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ["recordtype"]
            });
            return itemRecord.recordtype;
        }

        const createInventoryAdjustmentIngreso = (scriptParameters, components) => {
            let sql2 = 'SELECT custrecord_ht_cuenta_activo_fijo_transit FROM subsidiary WHERE id = ?';
            let params2 = [ECUADOR_SUBSIDIARY];
            let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 });
            let results2 = resultSet2.asMappedResults();
            log.debug('CUENTA-ACTIVO-FIJO-TRANSITO Ingreso', results2);
            if (results2.length > 0) {
                log.debug('components', components);
                let inventoryNumber = getInventoryNumber(components);
                log.debug('inventoryNumber', inventoryNumber);

                //Inicio Cambio JCEC 19/08/2024
                //Buscamos el tipo flujo de orden de trabajo

                let workOrderSearch = search.lookupFields({
                    type: 'customrecord_ht_record_ordentrabajo',
                    id: scriptParameters.workorder,
                    columns: ['custrecord_ht_ot_flu_acc', 'custrecord_ot_serie_acc', 'internalid']
                });

                //Imprimimos el resultado
                log.error('workOrderSearch', workOrderSearch);

                //asigamos los datos
                let custrecord_ht_ot_flu_acc = workOrderSearch.custrecord_ht_ot_flu_acc;
                let custrecord_ot_serie_acc = workOrderSearch.custrecord_ot_serie_acc;


                //Fin Cambio JCEC 19/08/2024

                //Inicio - dfernandez 21/08/2024
                if (!custrecord_ht_ot_flu_acc) {
                    let esItemProduccion = getParameter(scriptParameters.item, PRO_ITEM_COMERCIAL_DE_PRODUCCION)
                    if (esItemProduccion != 0 && esItemProduccion == SI) {
                        let serieItemProd = getNameForSerieItemProd(scriptParameters.datosTecnicos)
                        inventoryNumber = serieItemProd;
                    }
                }
                //Fin - dfernandez 21/08/2024



                let binNumber = getBinNumberAlquiler(scriptParameters.location);
                let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
                newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
                newAdjust.setValue({ fieldId: 'account', value: results2[0]['custrecord_ht_cuenta_activo_fijo_transit'] });
                newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
                newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
                newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
                //newAdjust.setValue({ fieldId: 'custbody_ht_ai_paraalquiler', value: true });
                newAdjust.selectNewLine({ sublistId: 'inventory' });
                newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: scriptParameters.item });
                newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: scriptParameters.location });
                newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: 1 });
                let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                newDetail.selectNewLine({ sublistId: 'inventoryassignment' });

                //Inicio Cambio JCEC 19/08/2024
                if (custrecord_ht_ot_flu_acc) {
                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: custrecord_ot_serie_acc });
                } else {
                    newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: inventoryNumber });
                }
                //Fin Cambio JCEC 19/08/2024

                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binNumber });
                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });
                newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                newDetail.commitLine({ sublistId: 'inventoryassignment' });
                newAdjust.commitLine({ sublistId: 'inventory' });

                log.error('JCEC - newAdjust', {
                    custrecord_ot_serie_acc: custrecord_ot_serie_acc,
                    inventoryNumber: inventoryNumber,
                    binNumber: binNumber
                });

                let newRecord = newAdjust.save({ enableSourcing: false, ignoreMandatoryFields: true });
                log.error("newRecord Ingreso", newRecord);
                return newRecord;
            }
        }

        const createInventoryAdjustmentIngresoCustodia = (scriptParameters) => {
            let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
            let binNumber = getBinNumberCustodia(scriptParameters.location);
            log.error("newRecord binNumber", binNumber);
            newAdjust.setValue({ fieldId: 'customform', value: 120 });
            newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
            newAdjust.setValue({ fieldId: 'account', value: EXPENSE_ACCOUNT });
            newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
            newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
            newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });

            newAdjust.selectNewLine({ sublistId: 'inventory' });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: scriptParameters.item });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: scriptParameters.location });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: 1 });

            let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
            newDetail.selectNewLine({ sublistId: 'inventoryassignment' });

            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: scriptParameters.inventoryNumber });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binNumber });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });

            newDetail.commitLine({ sublistId: 'inventoryassignment' });
            //newDetail.removeLine({ sublistId: 'inventoryassignment', line: 1 });
            newAdjust.commitLine({ sublistId: 'inventory' });

            let newRecord = newAdjust.save({ enableSourcing: false, ignoreMandatoryFields: true });
            log.error("newRecord createInventoryAdjustmentIngresoCustodia", newRecord);
            return newRecord;
        }

        const getBinNumberCustodia = (location) => {
            let binSearch = search.create({
                type: "bin",
                filters: [
                    ["location", "anyof", location],
                    "AND",
                    ["custrecord_deposito_para_custodia", "is", "T"]
                ],
                columns: ["binnumber"]
            }).run().getRange(0, 1);
            if (binSearch.length) return binSearch[0].id;
            return "";
        }

        const getBinNumberAlquiler = (location) => {
            let binSearch = search.create({
                type: "bin",
                filters: [
                    ["location", "anyof", location],
                    "AND",
                    ["custrecord_deposito_para_alquiler", "is", "T"]
                ],
                columns: ["binnumber"]
            }).run().getRange(0, 1);
            if (binSearch.length) return binSearch[0].id;
            return "";
        }

        const getInventoryNumber = (comercial) => {
            let serial = "";
            for (let i = 0; i < comercial.length; i++) {
                let type = comercial[i].type;
                if (type == COMPONENTE_DISPOSITIVO_ID || type == COMPONENTE_LOJACK_ID || type == COMPONENTE_FABRICACION_ID) {
                    serial = comercial[i].seriales[0].serial;
                }
            }
            return getSerialNumber(serial)
        }

        const getSerialNumber = (serial) => {
            if (!serial) return "";
            let serialSearch = search.lookupFields({
                type: "inventorynumber",
                id: serial,
                columns: ['inventorynumber']
            });
            return serialSearch.inventorynumber;
        }

        const createInventoryAdjustmentSalidaConAlquiler = (scriptParameters) => {
            // Inicio - dfernandez - 25/08/2024
            let activaCheckPorSalidaRein = true;
            let sql = 'SELECT expenseaccount FROM item WHERE id = ?';
            let params = [scriptParameters.comercial[0].id];
            let results = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
            log.debug('results', results[0].expenseaccount);
            // Fin - dfernandez - 25/08/2024
            let sql2 = 'SELECT custrecord_ht_cuenta_activo_fijo_transit FROM subsidiary WHERE id = ?';
            let params2 = [ECUADOR_SUBSIDIARY];
            let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 });
            let results2 = resultSet2.asMappedResults();
            log.debug('CUENTA-ACTIVO-FIJO-TRANSITO', results2);
            if (results2.length > 0) {
                let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
                newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
                newAdjust.setValue({ fieldId: 'account', value: results[0].expenseaccount });
                //newAdjust.setValue({ fieldId: 'account', value: results2[0]['custrecord_ht_cuenta_activo_fijo_transit'] });
                newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
                newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
                newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
                // Inicio - dfernandez - 25/08/2024
                newAdjust.setValue({ fieldId: 'custbody_ht_ai_porsalida_ra', value: activaCheckPorSalidaRein });
                // Fin - dfernandez - 25/08/2024
                setItemstoInventoryAdjustment(newAdjust, scriptParameters);
                let newRecord = newAdjust.save({ enableSourcing: false, ignoreMandatoryFields: true });
                log.error("JCEC createInventoryAdjustmentSalidaConAlquiler", newRecord);
                return newRecord;
            }
        }

        const getVehiculoFromWorkOrder = (workorderId) => {
            if (!workorderId) return "";
            let workOrderSearch = search.lookupFields({
                type: 'customrecord_ht_record_ordentrabajo',
                id: workorderId,
                columns: ['custrecord_ht_ot_vehiculo']
            });
            return workOrderSearch.custrecord_ht_ot_vehiculo.length ? workOrderSearch.custrecord_ht_ot_vehiculo[0].value : '';
        }

        const getChaserId = (scriptParameters) => {
            log.debug('getChaserId', scriptParameters);
            let inventoryNumber = "";
            if (scriptParameters.assemblyFlow == 'custodia') {
                inventoryNumber = scriptParameters.inventoryNumber;
            } else if (scriptParameters.assemblyFlow == 'alquiler') {
                if (scriptParameters.alquiler.length) {
                    inventoryNumber = getInventoryNumber(scriptParameters.alquiler);
                } else {
                    inventoryNumber = getInventoryNumber(scriptParameters.comercial);
                }
            } else if (scriptParameters.assemblyFlow == "garantia") {
                inventoryNumber = getInventoryNumber(scriptParameters.comercial);
            }
            if (!inventoryNumber) return;
            let chaserId = searchChaserByName(inventoryNumber);
            return chaserId;
        }

        const searchChaserByName = (inventoryNumber) => {
            let chaserSearchResult = search.create({
                type: "customrecord_ht_record_mantchaser",
                filters: [["name", "is", inventoryNumber]],
                columns: ["internalid"]
            }).run().getRange(0, 1);
            if (chaserSearchResult.length) return chaserSearchResult[0].id;
        }

        const createChaser = (scriptParameters) => {
            try {
                log.debug('scriptParameters', scriptParameters);
                if (verificarParametroCandado(scriptParameters.workorder)) {
                    log.debug('verificarParametroCandado', "Entry");
                    updateWorkOrder(scriptParameters.datosTecnicos, scriptParameters.workorder, scriptParameters.assemblyFlow);
                } else {
                    log.debug('getChaserId', "Entry");
                    let chaserId = getChaserId(scriptParameters);
                    log.debug('chaserId', chaserId)
                    let objRecordCreate;
                    if (chaserId) {
                        objRecordCreate = record.load({ type: 'customrecord_ht_record_mantchaser', id: chaserId, isDynamic: true });
                    } else {
                        objRecordCreate = record.create({ type: 'customrecord_ht_record_mantchaser', isDynamic: true });
                    }

                    if (scriptParameters.assemblyFlow == 'custodia') {
                        let itemSearch = search.lookupFields({
                            type: search.Type.ITEM,
                            id: scriptParameters.deviceItem,
                            columns: ["custitem_ht_ai_tipocomponente"]
                        });
                        if (itemSearch.custitem_ht_ai_tipocomponente.length) {
                            let type = itemSearch.custitem_ht_ai_tipocomponente[0].value
                            let searchResult = getCustomInventoryNumber(scriptParameters.inventoryNumber, type, true);
                            if (searchResult.length) {
                                setFieldsByType(objRecordCreate, type, searchResult[0], scriptParameters);
                            }
                        }
                    } else if (scriptParameters.assemblyFlow == 'alquiler') {
                        for (let i = 0; i < scriptParameters.alquiler.length; i++) {
                            let item = scriptParameters.alquiler[i].id;
                            let type = scriptParameters.alquiler[i].type;
                            let seriales = scriptParameters.alquiler[i].seriales;
                            if (!seriales.length) continue;
                            let searchResult = getCustomInventoryNumber(seriales, type, false);
                            if (!searchResult.length) continue;
                            setFieldsByType(objRecordCreate, type, searchResult[0], scriptParameters);
                        }
                    }

                    for (let i = 0; i < scriptParameters.comercial.length; i++) {
                        let item = scriptParameters.comercial[i].id;
                        let type = scriptParameters.comercial[i].type;
                        let seriales = scriptParameters.comercial[i].seriales;
                        if (!seriales.length) continue;
                        let searchResult = getCustomInventoryNumber(seriales, type, false);
                        if (!searchResult.length) continue;
                        setFieldsByType(objRecordCreate, type, searchResult[0], scriptParameters);
                    }
                    objRecordCreate.setValue("custrecord_ht_mc_estadolodispositivo", DISPOSITIVO_INSTALADO);
                    let recordId = objRecordCreate.save({ enableSourcing: false, ignoreMandatoryFields: false });
                    let workOrder = updateWorkOrder(recordId, scriptParameters.workorder, scriptParameters.assemblyFlow);
                    log.error("recordId", recordId);
                }
            } catch (error) {
                log.error("An error was ocurred in [createChaser] function", error);
            }
        }

        const updateWorkOrder = (chaserId, workOrderId, assemblyFlow) => {
            log.debug('updateWorkOrderEntry', `${chaserId} - ${workOrderId}`);
            let workOrderRecord = record.load({ type: "customrecord_ht_record_ordentrabajo", id: workOrderId, isDynamic: true });
            workOrderRecord.setValue('custrecord_ht_ot_serieproductoasignacion', chaserId);
            if (assemblyFlow == "alquiler") {
                workOrderRecord.setValue('custrecord_flujo_de_alquiler', true);
            } else if (assemblyFlow == "custodia") {
                workOrderRecord.setValue('custrecord_flujo_de_custodia', true);
            } else if (assemblyFlow == "garantia") {
                workOrderRecord.setValue('custrecord_flujo_de_garantia', true);
            }
            let id = workOrderRecord.save({ ignoreMandatoryFields: true, enableSourcing: false });
            log.error("updateWorkOrder", id);
        }

        const setFieldsByType = (objRecordCreate, type, result, scriptParameters) => {
            var columns = result.columns;

            if (type == "1") {
                let vehiculo = getVehiculoFromWorkOrder(scriptParameters.workorder);
                log.error('custrecord_ht_mc_seriedispositivo', result.getValue(columns[1]));

                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivo', value: result.getValue(columns[0]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[12]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_modelo', value: result.getValue(columns[4]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_unidad', value: result.getValue(columns[3]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_imei', value: result.getValue(columns[6]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_firmware', value: result.getValue(columns[7]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_script', value: result.getValue(columns[8]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_servidor', value: result.getValue(columns[9]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vid', value: vehiculo, ignoreFieldChange: true });
                //objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estado', value: result.getValue(columns[10]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estadolodispositivo', value: result.getValue(columns[10]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_tipodispositivo', value: result.getValue(columns[11]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vehiculo', value: vehiculo, ignoreFieldChange: true });
            } else if (type == "2") {
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_celularsimcard', value: result.getValue(columns[0]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_nocelularsim', value: result.getValue(columns[7]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_ip', value: result.getValue(columns[5]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_apn', value: result.getValue(columns[6]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_operadora', value: result.getValue(columns[4]), ignoreFieldChange: true });

            } else if (type == "3") {
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigoactivacion', value: result.getValue(columns[2]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigorespuesta', value: result.getValue(columns[3]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estadolojack', value: result.getValue(columns[4]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivolojack', value: result.getValue(columns[0]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[5]), ignoreFieldChange: true });
            }
        }

        const getCustomInventoryNumber = (seriales, type, isDeviceItem) => {
            let tipoItmesText;
            let customRecord;
            let columns;
            let estadoColumna = 0;

            switch (type) {
                case '1':
                    tipoItmesText = "custrecord_ht_dd_item";
                    customRecord = "customrecord_ht_record_detallechaserdisp";
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_dd_dispositivo", label: "dd_dispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_item", label: "dd_item" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispositivo", label: "dd_tipodispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_modelodispositivo", label: "dd_modelodispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_macaddress", label: "dd_macaddress" }),
                        search.createColumn({ name: "custrecord_ht_dd_imei", label: "dd_imei" }),
                        search.createColumn({ name: "custrecord_ht_dd_firmware", label: "dd_firmware" }),
                        search.createColumn({ name: "custrecord_ht_dd_script", label: "dd_script" }),
                        search.createColumn({ name: "custrecord_ht_dd_servidor", label: "dd_servidor" }),
                        search.createColumn({ name: "custrecord_ht_dd_estado", label: "dd_estado" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispocha", label: "dd_tipodispocha" }),
                        search.createColumn({ name: "name", label: "name" })
                    ];
                    break;
                case '2':
                    tipoItmesText = "custrecord_ht_ds_serie";
                    customRecord = "customrecord_ht_record_detallechasersim";
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_ds_simcard", label: "ds_simcard" }),
                        search.createColumn({ name: "custrecord_ht_ds_serie", label: "ds_serie" }),
                        search.createColumn({ name: "custrecord_ht_ds_tiposimcard", label: "ds_tiposimcard" }),
                        search.createColumn({ name: "custrecord_ht_ds_operadora", label: "ds_operadora" }),
                        search.createColumn({ name: "custrecord_ht_ds_ip", label: "ds_ip" }),
                        search.createColumn({ name: "custrecord_ht_ds_apn", label: "ds_apn" }),
                        search.createColumn({ name: "custrecord_ht_ds_numerocelsim", label: "ds_numerocelsim" }),
                        search.createColumn({ name: "custrecord_ht_ds_estado", label: "ds_estado" }),
                    ];
                    break;
                case '3':
                    tipoItmesText = "custrecord_ht_cl_seriebox";
                    customRecord = "customrecord_ht_record_detallechaslojack";
                    estadoColumna = 4;
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_cl_seriebox", label: "cl_seriebox" }),
                        search.createColumn({ name: "custrecord_ht_cl_activacion", label: "cl_activacion" }),
                        search.createColumn({ name: "custrecord_ht_cl_respuesta", label: "cl_respuesta" }),
                        search.createColumn({ name: "custrecord_ht_cl_estado", label: "cl_estado" }),
                        search.createColumn({ name: "name", label: "name" }),
                    ];
                    break;
                default:
                    return new Array();
            }
            let serialesId = new Array(), filter;
            if (isDeviceItem) {
                serialesId.push(seriales);
                filter = [`${tipoItmesText}.inventorynumber`, "is", serialesId];
            } else {
                for (let i = 0; i < seriales.length; i++) {
                    let serial = seriales[i].serial;
                    serialesId.push(serial);
                }
                filter = [tipoItmesText, "anyof", serialesId];
            }
            let customRecordSearchResult = search.create({ type: customRecord, filters: [filter], columns }).run().getRange(0, 1000);
            return customRecordSearchResult;
        }


        //Inicio Cambio JCEC 21/08/2024
        const createHTAjusteRelacionado = (workOrder, inventoryAdjustmentId, TipoMovimiento = '-1') => {
            log.debug('-custrecord_ts_ajuste_rela_transacci_gene-inventoryAdjustmentId', inventoryAdjustmentId)
            let ajusteRelacionado = record.create({ type: "customrecord_ht_ajuste_relacionados", isDinamyc: true });
            ajusteRelacionado.setValue("custrecord_ts_ajuste_rela_orden_trabajo", workOrder);
            ajusteRelacionado.setValue("custrecord_ts_ajuste_rela_transacci_gene", inventoryAdjustmentId);
            if (TipoMovimiento != '-1') {
                ajusteRelacionado.setValue("custrecord_ht_tipo_mov", TipoMovimiento);
            }
            ajusteRelacionado.setValue("custrecord_ts_ajuste_rela_fecha", new Date());
            let ajusteRelacionadoId = ajusteRelacionado.save({ enableSourcing: true, ignoreMandatoryFields: true });
            log.error("ajusteRelacionadoId", ajusteRelacionadoId);
        }

        const verificarParametroCandado = (workOrderId) => {
            const COD_PRO_ITEM_COMERCIAL_DE_PRODUCCION = "PRO";
            const COD_SI = "S";
            let itemVenta = search.lookupFields({ type: "customrecord_ht_record_ordentrabajo", id: workOrderId, columns: ["custrecord_ht_ot_item"] }).custrecord_ht_ot_item;
            let itemVentaId = itemVenta.length ? itemVenta[0].value : "";
            if (!itemVentaId) return true;
            let parametrizacionProducto = parametrizacionJson(itemVentaId);
            let esCandado = parametrizacionProducto[COD_PRO_ITEM_COMERCIAL_DE_PRODUCCION];
            log.error("esCandado", esCandado);
            return esCandado !== undefined && esCandado.valor == COD_SI;
        }

        const parametrizacionJson = (items) => {
            let parametrizacionResult = {};
            let searchResult = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters: [
                    ["custrecord_ht_pp_aplicacion", "is", "T"],
                    "AND",
                    ["custrecord_ht_pp_parametrizacionid", "anyof", items]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela" }),
                    search.createColumn({ name: "custrecord_ht_pp_code", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_RELA" }),
                    search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor" }),
                    search.createColumn({ name: "custrecord_ht_pp_codigo", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_VALOR" })
                ]
            });
            let resultCount = searchResult.runPaged().count;
            if (resultCount > 0) {
                let pageData = searchResult.runPaged({ pageSize: 1000 });
                pageData.pageRanges.forEach(pageRange => {
                    let page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        let columns = result.columns;
                        let idParametrizacion = result.getValue(columns[0]);
                        let codigoParametrizacion = result.getValue(columns[1]);
                        let idValor = result.getValue(columns[2]);
                        let codigoValor = result.getValue(columns[3]);

                        if (!codigoParametrizacion) return;

                        parametrizacionResult[codigoParametrizacion] = {
                            parametrizacion: codigoParametrizacion,
                            valor: codigoValor,
                            idValor,
                            idParametrizacion
                        }
                    });
                });
            }

            return parametrizacionResult;
        }

        const createJournalEntrySalidaConAlquiler = (item, adjustid, location) => {
            let sql1 = 'SELECT foreigntotal as amount, custbody_ht_af_ejecucion_relacionada FROM transaction WHERE id = ?';
            let sql2 = 'SELECT it.assetaccount as inventoryaccount, af.custrecord_assettypeassetacc as fixedassetaccount FROM item it ' +
                'INNER JOIN customrecord_ncfar_assettype af ON it.custitem_ht_ar_tipoactivo = af.id ' +
                'WHERE it.id = ?';
            let sql3 = 'SELECT custrecord_ht_cuenta_activo_fijo_transit FROM subsidiary WHERE id = ?';
            let journalid = 0
            try {
                let params1 = [adjustid]
                let params2 = [item]
                let params3 = [ECUADOR_SUBSIDIARY];
                let resultSet1 = query.runSuiteQL({ query: sql1, params: params1 });
                let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 });
                let resultSet3 = query.runSuiteQL({ query: sql3, params: params3 });
                let results1 = resultSet1.asMappedResults();
                log.debug('results1', results1);
                let results2 = resultSet2.asMappedResults();
                log.debug('results2', results2);
                let results3 = resultSet3.asMappedResults();
                log.debug('results3', results3);
                if (results1[0]['amount'] > 0 && results2.length > 0 && results3.length > 0) {
                    let objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
                    objRecord.setValue({ fieldId: 'trandate', value: new Date() });
                    objRecord.setValue({ fieldId: 'memo', value: 'Asiento de Diario por alquiler en tránsito' });
                    objRecord.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
                    objRecord.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: results1[0]['custbody_ht_af_ejecucion_relacionada'] });

                    objRecord.selectNewLine({ sublistId: 'line' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: results2[0]['fixedassetaccount'], ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: results1[0]['amount'], ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: '', ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: 'Asiento de Diario por alquiler en tránsito' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: '', ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: '', ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                    objRecord.commitLine({ sublistId: 'line' });

                    objRecord.selectNewLine({ sublistId: 'line' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: results3[0]['custrecord_ht_cuenta_activo_fijo_transit'], ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: '', ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: results1[0]['amount'], ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: 'Asiento de Diario por alquiler en tránsito' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: '', ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: '', ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                    objRecord.commitLine({ sublistId: 'line' });

                    journalid = objRecord.save({ ignoreMandatoryFields: false });
                }
                log.debug('journalid', journalid);
                return journalid;
            } catch (error) {
                log.error('Error-createJournalEntrySalidaConAlquiler', error);
                return 0;
            }
        }

        const getParameter = (item, parametro) => {
            let sql = "SELECT custrecord_ht_pp_parametrizacion_valor as valor FROM customrecord_ht_pp_main_param_prod " +
                "WHERE custrecord_ht_pp_aplicacion = 'T' AND custrecord_ht_pp_parametrizacionid = ? AND custrecord_ht_pp_parametrizacion_rela = ?";
            let resultSet = query.runSuiteQL({ query: sql, params: [item, parametro] });
            let results = resultSet.asMappedResults();
            let valor = results.length > 0 ? results[0]['valor'] : 0;
            return valor;
        }

        const getNameForSerieItemProd = (datosTecnicos) => {
            let sql = 'SELECT name FROM customrecord_ht_record_mantchaser WHERE id = ?';
            let params = [datosTecnicos]
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults();
            if (results.length > 0) {
                return results[0].name/* == null ? 0 : 1*/
            } else {
                return 0;
            }
        }


        return {
            execute
        }
    }
)