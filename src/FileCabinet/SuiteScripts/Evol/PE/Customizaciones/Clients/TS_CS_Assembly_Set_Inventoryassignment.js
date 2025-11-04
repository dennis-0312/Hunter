/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/log', 'N/ui/dialog', 'N/search'],
    function (currentRecord, log, dialog, search) {

        function fieldChanged(context) {
            var record = context.currentRecord;
            var fieldId = context.fieldId;

            if (fieldId !== 'custbody_ht_as_datos_tecnicos') return;

            try {
                validateAvailableInventory(record);
                setQuantity(record);
                // dialog.alert({
                //     title: 'Proceso completado',
                //     message: 'Asignación de inventario realizada con éxito.'
                // });
            } catch (e) {
                console.log('Error', e);
                dialog.alert({
                    title: 'Error',
                    message: 'Error al asignar inventario: ' + e.message
                });
            }
        }

        function setQuantity(assemblyBuild) {
            var countTotal = assemblyBuild.getLineCount({ sublistId: 'component' });

            console.log('Total lines', countTotal);

            for (var j = 0; j < countTotal; j++) {
                // Primero verificar si la línea existe realmente
                try {
                    assemblyBuild.selectLine({
                        sublistId: 'component',
                        line: j
                    });

                    // Obtener el ID del item usando getSublistValue en lugar de getCurrentSublistValue
                    // var component = assemblyBuild.getSublistValue({
                    //     sublistId: 'component',
                    //     fieldId: 'item',
                    //     line: j
                    // });

                    // console.log('Processing line', {
                    //     line: j,
                    //     component: component
                    // });

                    assemblyBuild.setCurrentSublistValue({
                        sublistId: 'component',
                        fieldId: 'quantity',
                        line: j,
                        value: 0
                    });
                } catch (e) {
                    console.log('Error processing line ' + j, e);
                }
            }
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
            let filtros = '';

            var mySearch = search.create({
                type: "customrecord_ht_record_mantchaser",
                filters:
                    [
                        ["internalid", "anyof", assemblyBuild.getValue('custbody_ht_as_datos_tecnicos')]
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
            }

            if (searchResultCountExisteInventarioDis.count != 0 && searchResultCountDisponible != 0 && searchResultCountExisteInventarioSim.count != 0 && searchResultCountDisponibleSim != 0) {
                if (locationDis && (locationDis == locationSim || !locationSim)) {
                    assemblyBuild.setValue({ fieldId: 'location', value: locationDis });
                } else {
                    console.log('locationDis == locationSim', `${locationDis} == ${locationSim}`);
                    dialog.alert({
                        title: 'Error',
                        message: 'El Dispositivo y SimCard no se encuentran en la misma ubicación'
                    });
                }
            }

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
            fieldChanged: fieldChanged
        };
    });