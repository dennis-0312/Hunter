/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search'], (url, currentRecord, dialog, search) => {

    const COMPONENT_INVENTORY_DETAIL_POPUP_ID = 'compinvdet_popup_';
    const SUBSIDIARY_PE = 3

    const pageInit = (scriptContext) => {
        console.log('START PAGEINIT');
    }

    const fieldChanged = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;
        let sublistId = scriptContext.sublistId;
        let fieldId = scriptContext.fieldId;
        let line = scriptContext.line;

        if (scriptContext.fieldId == 'custpage_field_datos_tecnicos') {
            let location = currentRecord.getValue('custpage_f_location');
            let item = currentRecord.getValue('custpage_f_item');
            let workorder = currentRecord.getValue('custpage_f_workorder');
            let salesorder = currentRecord.getValue('custpage_f_salesorder');
            let customer = currentRecord.getValue('custpage_f_customer');
            let subsidiary = currentRecord.getValue('custpage_f_subsidiary');
            let datoTecnico = currentRecord.getValue('custpage_field_datos_tecnicos');

            if (subsidiary == SUBSIDIARY_PE) {
                let locationReturn = validateAvailableInventory(currentRecord);
                location = locationReturn ? locationReturn : location;
            }

            let parametros = {
                location,
                item,
                workorder,
                salesorder,
                customer,
                subsidiary,
                datoTecnico
            }

            console.log(parametros);

            if (location != -1) {
                let url = getSuiteletURL(parametros);
                //evitamos mostrar el mensaje de confirmacion
                window.onbeforeunload = null;
                window.open(url, '_self');
            }
        }

        //Inicio Cambio JCEC 08/10/2024
        if (scriptContext.fieldId == 'custpage_f_location') {

            let location = currentRecord.getValue('custpage_f_location');
            let item = currentRecord.getValue('custpage_f_item');
            let workorder = currentRecord.getValue('custpage_f_workorder');
            let salesorder = currentRecord.getValue('custpage_f_salesorder');
            let customer = currentRecord.getValue('custpage_f_customer');
            let subsidiary = currentRecord.getValue('custpage_f_subsidiary');

            let parametros = {
                location,
                item,
                workorder,
                salesorder,
                customer,
                subsidiary
            }

            console.log(parametros);

            let url = getSuiteletURL(parametros);
            //evitamos mostrar el mensaje de confirmacion
            window.onbeforeunload = null;
            window.open(url, '_self');

        }

        //Fin Cambio JCEC 08/10/2024

        if (sublistId == 'custpage_sl_components' && fieldId == 'custpage_slf_quantity') {
            let getInventoryDetail = JSON.parse(currentRecord.getValue('custpage_f_inventorydetail'));
            if (getInventoryDetail[line] === undefined) return true;
            let length = Object.keys(getInventoryDetail[line]).length;
            let quantity = currentRecord.getSublistValue('custpage_sl_components', 'custpage_slf_quantity', line);
            if (length == quantity && quantity != 0) {
                updateSetTagIcon(line + 1);
            } else {
                updateNeededTagIcon(line + 1)
            }
        }

        return true;
    }

    //Inicio Cambio JCEC 08/10/2024
    const saveRecord = (scriptContext) => {
        let currentRecord = scriptContext.currentRecord;

        let ordenTrabajo = currentRecord.getValue('custpage_f_workorder');
        if (verificarParametroCandado(ordenTrabajo)) {
            if (currentRecord.getValue({ fieldId: 'custpage_field_datos_tecnicos' })) return true;
        } else {
            return true;
        }
    }
    //Fin Cambio JCEC 08/10/2024

    const updateSetTagIcon = (line) => {
        let id = `${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`;
        var element = document.getElementById(`${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`);
        element.classList.remove("i_inventorydetailneeded");
        element.classList.add("i_inventorydetailset");
    }

    const updateNeededTagIcon = (line) => {
        let id = `${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`;
        var element = document.getElementById(`${COMPONENT_INVENTORY_DETAIL_POPUP_ID}${line}`);
        element.classList.remove("i_inventorydetailset");
        element.classList.add("i_inventorydetailneeded");
    }

    const verificarParametroCandado = (workOrderId) => {
        const COD_PRO_ITEM_COMERCIAL_DE_PRODUCCION = "PRO";
        const COD_SI = "S";
        let itemVenta = search.lookupFields({
            type: "customrecord_ht_record_ordentrabajo",
            id: workOrderId,
            columns: ["custrecord_ht_ot_item"]
        }).custrecord_ht_ot_item;
        let itemVentaId = itemVenta.length ? itemVenta[0].value : "";
        if (!itemVentaId) return true;
        let parametrizacionProducto = parametrizacionJson(itemVentaId);
        let esCandado = parametrizacionProducto[COD_PRO_ITEM_COMERCIAL_DE_PRODUCCION];
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

    //Inicio Cambio JCEC 08/10/2024
    const getSuiteletURL = (parametros) => {
        return url.resolveScript({
            scriptId: 'customscript_ts_ui_assembly_build_21_pe',
            deploymentId: 'customdeploy_ts_ui_assembly_build_21_pe',
            params: parametros
        });
    }
    //Fin Cambio JCEC 08/10/2024

    const addParametersToUrl = (suiteletURL, parameters) => {
        for (let param in parameters) {
            if (parameters[param]) {
                suiteletURL = `${suiteletURL}&${param}=${parameters[param]}`;
            }
        }
        return suiteletURL;
    }

    const getHeaderParameters = (currentRecord) => {
        let values = {
            item: currentRecord.getValue('custpage_f_item'),
            billofmaterials: currentRecord.getValue('custpage_f_billofmaterials'),
            location: currentRecord.getValue('custpage_f_location'),
        };
        return values;
    }

    function validateAvailableInventory(assemblyBuild) {
        let message = '';
        let recordType = '';
        let recordType2 = '';
        let dispositivoSerie = ''
        let columns = [];
        let columns2 = [];
        let idDispositivo = '';
        let simcardSerie = '';
        let idSimcard = '';
        let searchResultCountExisteInventarioDis = 0;
        let searchResultCountExisteInventarioSim = 0;
        let searchResultCountDisponibleSim = -1;
        let searchResultCountDisponible = 0;
        let locationDis = '';
        let locationSim = '';
        let subsidiary = '';
        let monitoreo = '';
        let lojack = '';
        let simcard = '';
        let location = '';
        let filtros = '';
        var mySearch = search.create({
            type: "customrecord_ht_record_mantchaser",
            filters:
                [
                    ["internalid", "anyof", assemblyBuild.getValue('custpage_field_datos_tecnicos')]
                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_ht_mc_subsidiaria", label: "HT Subsidiaria" }),
                    search.createColumn({ name: "custrecord_ht_mc_seriedispositivo", label: "HT MC Serie Dispositivo Chaser" }),
                    search.createColumn({ name: "custrecord_ht_mc_seriedispositivolojack", label: "HT MC Serie Dispositivo Lojack" }),
                    search.createColumn({ name: "custrecord_ht_mc_celularsimcard", label: "HT MC Celular Sim Card" })
                ]
        });
        var searchResultCount = mySearch.runPaged().count;
        console.log("mySearch result count", searchResultCount);
        mySearch.run().each(function (result) {
            subsidiary = result.getValue('custrecord_ht_mc_subsidiaria');
            monitoreo = result.getValue('custrecord_ht_mc_seriedispositivo');
            lojack = result.getValue('custrecord_ht_mc_seriedispositivolojack');
            simcard = result.getValue('custrecord_ht_mc_celularsimcard');


            if (monitoreo) {
                recordType = 'customrecord_ht_record_detallechaserdisp';
                idDispositivo = result.getValue('custrecord_ht_mc_seriedispositivo');
                dispositivoSerie = result.getText('custrecord_ht_mc_seriedispositivo');
                columns = ['custrecord_ht_dd_dispositivo'];
                filtros =
                    [
                        ["custrecordht_hdd_subsidiaria", "anyof", subsidiary],
                        "AND",
                        ["name", "is", dispositivoSerie]
                    ]

            } else if (lojack) {
                recordType = 'customrecord_ht_record_detallechaslojack';
                idDispositivo = result.getValue('custrecord_ht_mc_seriedispositivolojack');
                dispositivoSerie = result.getText('custrecord_ht_mc_seriedispositivolojack');
                columns = ['custrecord_ht_cl_lojack'];
                filtros =
                    [
                        ["custrecord_ht_cl_lojack_sub", "anyof", subsidiary],
                        "AND",
                        ["name", "is", dispositivoSerie]
                    ]

            }

            if (simcard) {
                recordType2 = 'customrecord_ht_record_detallechasersim';
                idSimcard = result.getValue('custrecord_ht_mc_celularsimcard');
                simcardSerie = result.getText('custrecord_ht_mc_celularsimcard');
                columns2 = ['custrecord_ht_ds_simcard'];

                let searchSim = getSearchLookupFields(recordType2, idSimcard, columns2)
                idSimcard = searchSim.custrecord_ht_ds_simcard[0].value;

                searchResultCountExisteInventarioSim = getInventoryNumber(idSimcard, simcardSerie)
                if (searchResultCountExisteInventarioSim.count == 0) {
                    message += 'El SIM CARD no está en el inventario.'
                }

                locationSim = searchResultCountExisteInventarioSim.location; //*Location*/

                let customrecord_ht_record_detallechasersimSearchObj = search.create({
                    type: recordType2,
                    filters:
                        [
                            ["custrecord_ht_ds_subsidiaria", "anyof", subsidiary],
                            "AND",
                            ["name", "is", simcardSerie]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "Name" }),
                        ]
                });
                searchResultCountDisponibleSim = customrecord_ht_record_detallechasersimSearchObj.runPaged().count;
                console.log("SIM CARD Disponible", searchResultCountDisponibleSim);
                if (searchResultCountDisponibleSim == 0) {
                    message += 'El SIM CARD no está disponible.'
                }
            }

            let searchDis = getSearchLookupFields(recordType, idDispositivo, columns)
            if (monitoreo) {
                idDispositivo = searchDis.custrecord_ht_dd_dispositivo[0].value;
            } else if (lojack) {
                idDispositivo = searchDis.custrecord_ht_cl_lojack[0].value;
            }
            searchResultCountExisteInventarioDis = getInventoryNumber(idDispositivo, dispositivoSerie)
            if (searchResultCountExisteInventarioDis.count == 0) {
                message += 'El Dispositivo no está en el inventario.'
            }

            locationDis = searchResultCountExisteInventarioDis.location; //*Location*/

            let customrecord_ht_record_detallechaserdispSearchObj = search.create({
                type: recordType,
                filters: filtros,
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                    ]
            });
            searchResultCountDisponible = customrecord_ht_record_detallechaserdispSearchObj.runPaged().count;
            console.log("Dispositivo Disponible", searchResultCountDisponible);
            if (searchResultCountDisponible == 0) {
                message += 'El Dispositivo no está disponible.'
            }
        });

        console.log({
            searchResultCountExisteInventarioDis: searchResultCountExisteInventarioDis.count,
            searchResultCountExisteInventarioSim: searchResultCountExisteInventarioSim.count,
            searchResultCountDisponible: searchResultCountDisponible,
            searchResultCountDisponibleSim: searchResultCountDisponibleSim
        })

        if (searchResultCountExisteInventarioDis.count == 0 || searchResultCountDisponible == 0 || searchResultCountExisteInventarioSim.count == 0 || searchResultCountDisponibleSim == 0) {
            console.log('message', message);
            dialog.alert({
                title: 'Error',
                message: message
            });
            location = -1;
        }

        if (searchResultCountExisteInventarioDis.count != 0 && searchResultCountDisponible != 0 && searchResultCountExisteInventarioSim.count != 0 && searchResultCountDisponibleSim != 0) {
            if (locationDis && (locationDis == locationSim || !locationSim)) {
                location = locationDis
            } else {
                console.log('locationDis == locationSim', `${locationDis} == ${locationSim}`);
                dialog.alert({
                    title: 'Error',
                    message: 'El Dispositivo y SimCard no se encuentran en la misma ubicación'
                });
                location = -1;
            }
        }

        return location;
    }

    const getInventoryNumber = (item, serie) => {
        let location = '';
        let inventorynumberSearchObj = search.create({
            type: "inventorynumber",
            filters:
                [
                    ["item", "anyof", item],
                    "AND",
                    ["inventorynumber", "is", serie],
                    "AND",
                    ["quantityavailable", "greaterthan", "0"]
                ],
            columns:
                [
                    search.createColumn({ name: "inventorynumber", label: "Number" }),
                    search.createColumn({ name: "location", label: "Location" }),
                ]
        });
        let searchResultCountExisteInventario = inventorynumberSearchObj.runPaged().count;
        console.log("Item se encuentra en el inventario", searchResultCountExisteInventario);
        inventorynumberSearchObj.run().each(function (result) {
            location = result.getValue("location");
        });

        let jsonReturn = {
            count: searchResultCountExisteInventario,
            location: location
        };
        console.log(jsonReturn);
        return jsonReturn
    }

    const getSearchLookupFields = (recordType, id, columns) => {
        let searchDis = search.lookupFields({
            type: recordType,
            id: id,
            columns: columns
        })

        return searchDis
    }

    return {
        pageInit,
        fieldChanged,
        saveRecord
    };
});
