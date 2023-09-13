/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/record', 'N/log', 'N/runtime', 'N/task', 'N/render', 'N/format', 'N/file', 'N/search'],
    function (record, log, runtime, task, render, format, file, search) {
        let currentScript = runtime.getCurrentScript();

        const FIXED_ASSET_ACCOUNT = "3202"; // SB: 2676
        const EXPENSE_ACCOUNT = "1501";
        const ECUADOR_SUBSIDIARY = "2";
        const COMPONENTE_DISPOSITIVO_ID = "1";

        const execute = (context) => {
            try {
                let scriptParameters = getScriptParameters();
                log.error("scriptParameters.alquiler.length", scriptParameters.alquiler.length);
                if (scriptParameters.alquiler.length == 0) {
                    createInventoryAdjustmentSalidaSinAlquiler(scriptParameters);

                    createInventoryAdjustmentIngreso(scriptParameters);
                } else {
                    createInventoryAdjustmentSalidaConAlquiler(scriptParameters);
                }
                createChaser(scriptParameters);
            } catch (error) {
                log.error("error", error)
            }
        }

        const getScriptParameters = () => {
            let scriptParameters = {};

            scriptParameters.comercial = JSON.parse(currentScript.getParameter('custscript_ts_ss_bld_cus_invad_comercial'));
            scriptParameters.customer = currentScript.getParameter('custscript_ts_ss_bld_cus_invad_customer');
            scriptParameters.location = currentScript.getParameter('custscript_ts_ss_bld_cus_invad_location');
            scriptParameters.item = currentScript.getParameter('custscript_ts_ss_bld_cus_invad_item') || "";
            scriptParameters.workorder = currentScript.getParameter('custscript_ts_ss_bld_cus_invad_workorder') || "";
            scriptParameters.salesorder = currentScript.getParameter('custscript_ts_ss_bld_cus_invad_salesorde') || "";
            scriptParameters.inventorynumber = currentScript.getParameter('custscript_ts_ss_bld_cus_invad_invnumber') || "";
            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const createInventoryAdjustmentSalidaSinAlquiler = (scriptParameters) => {
            let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });

            newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
            newAdjust.setValue({ fieldId: 'account', value: FIXED_ASSET_ACCOUNT });
            newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
            newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
            newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
            setItemstoInventoryAdjustment(newAdjust, scriptParameters);
            let newRecord = newAdjust.save();
            log.error("newRecord", newRecord);
        }

        const setItemstoInventoryAdjustment = (newAdjust, scriptParameters) => {
            for (let i = 0; i < scriptParameters.comercial.length; i++) {
                let item = scriptParameters.comercial[i];
                let itemtype = getItemType(item.id);
                log.error("itemtype", { itemtype, id: item.id });
                let seriales = scriptParameters.comercial[i].seriales;
                if (seriales.length < 0) continue;
                let quantity = seriales.length;
                newAdjust.selectNewLine({ sublistId: 'inventory' });
                newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item.id });
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

        const getItemType = (itemId) => {
            let itemRecord = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ["recordtype"]
            });
            return itemRecord.recordtype;
        }

        const createInventoryAdjustmentIngreso = (scriptParameters) => {
            let inventoryNumber = getinventoryNumber(scriptParameters.comercial);
            let binNumber = getBinNumberAlquiler(scriptParameters.location);

            let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });

            newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
            newAdjust.setValue({ fieldId: 'account', value: EXPENSE_ACCOUNT });
            newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
            newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
            newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
            newAdjust.setValue({ fieldId: 'custbody_ht_ai_paraalquiler', value: true });

            newAdjust.selectNewLine({ sublistId: 'inventory' });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: scriptParameters.item });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: scriptParameters.location });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: 1 });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: 0 });

            let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });

            newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: inventoryNumber });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binNumber });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });
            newDetail.commitLine({ sublistId: 'inventoryassignment' });
            newAdjust.commitLine({ sublistId: 'inventory' });

            let newRecord = newAdjust.save();
            log.error("newRecord", newRecord);
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

        const getinventoryNumber = (comercial) => {
            let serial = "";
            for (let i = 0; i < comercial.length; i++) {
                let type = comercial[i].type;
                if (type == COMPONENTE_DISPOSITIVO_ID) {
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

            let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });

            newAdjust.setValue({ fieldId: 'subsidiary', value: ECUADOR_SUBSIDIARY });
            newAdjust.setValue({ fieldId: 'account', value: EXPENSE_ACCOUNT });
            newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
            newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.customer });
            newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });

            setItemstoInventoryAdjustment(newAdjust, scriptParameters);
            let newRecord = newAdjust.save();
            log.error("newRecord", newRecord);
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

        const createChaser = (scriptParameters) => {
            try {
                let objRecordCreate = record.create({ type: 'customrecord_ht_record_mantchaser', isDynamic: true });

                for (let i = 0; i < scriptParameters.alquiler.length; i++) {
                    let item = scriptParameters.alquiler[i].id;
                    let type = scriptParameters.alquiler[i].type;
                    let seriales = scriptParameters.alquiler[i].seriales;
                    if (!seriales.length) continue;
                    let searchResult = getCustomInventoryNumber(seriales, type);
                    if (!searchResult.length) continue;
                    setFieldsByType(objRecordCreate, type, searchResult[0], scriptParameters);
                }

                for (let i = 0; i < scriptParameters.comercial.length; i++) {
                    let item = scriptParameters.comercial[i].id;
                    let type = scriptParameters.comercial[i].type;
                    let seriales = scriptParameters.comercial[i].seriales;
                    if (!seriales.length) continue;
                    let searchResult = getCustomInventoryNumber(seriales, type);
                    if (!searchResult.length) continue;
                    setFieldsByType(objRecordCreate, type, searchResult[0], scriptParameters);
                }
                let recordId = objRecordCreate.save({ enableSourcing: false, ignoreMandatoryFields: false });
                let workOrder = updateWorkOrder(recordId, scriptParameters.workorder);
                log.error("recordId", recordId);
            } catch (error) {
                log.error("An error was ocurred in [createChaser] function", error);
            }
        }

        const updateWorkOrder = (chaserId, workOrderId) => {
            let workOrderRecord = record.load({ type: "customrecord_ht_record_ordentrabajo", id: workOrderId, isDynamic: true });
            workOrderRecord.setValue('custrecord_ht_ot_serieproductoasignacion', chaserId);
            workOrderRecord.setValue('custrecord_flujo_de_alquiler', true);
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
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vid', value: result.getValue(columns[7]), ignoreFieldChange: true });
                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estado', value: result.getValue(columns[10]), ignoreFieldChange: true });
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

        const getCustomInventoryNumber = (seriales, type) => {
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
                    return [];
            }
            let serialesId = [];
            for (let i = 0; i < seriales.length; i++) {
                let serial = seriales[i].serial;
                serialesId.push(serial);
            }
            let customRecordSearchResult = search.create({
                type: customRecord,
                filters: [
                    [tipoItmesText, "anyof", serialesId]
                ],
                columns
            }).run().getRange(0, 1000);
            return customRecordSearchResult;
        }

        return {
            execute
        }
    }
)