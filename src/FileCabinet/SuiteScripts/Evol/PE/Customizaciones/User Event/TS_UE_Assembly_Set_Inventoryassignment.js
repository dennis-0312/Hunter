/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/search'],
    function (record, log, search) {

        function afterSubmit(context) {
            if (context.type !== context.UserEventType.CREATE) return;
            var assemblyBuild = context.newRecord;

            try {
                log.debug('Iniciando actualización', {
                    recordId: assemblyBuild.id,
                    type: assemblyBuild.type
                });

                let datosTecnicos = assemblyBuild.getValue({ fieldId: 'custbody_ht_as_datos_tecnicos' });

                if (datosTecnicos) {
                    // Cargar el registro en modo dinámico
                    assemblyBuild = record.load({
                        type: record.Type.ASSEMBLY_BUILD,
                        id: assemblyBuild.id,
                        isDynamic: true
                    });

                    var objJson = getJsonData(assemblyBuild);

                    // Actualizar campos principales
                    assemblyBuild.setValue({ fieldId: 'quantity', value: objJson[0].quantity });

                    // 1. Actualizar inventory detail principal si hay serie
                    if (objJson[0].serie && objJson[0].serie.length > 0) {
                        updateMainInventoryDetail(assemblyBuild, objJson[0]);
                    }

                    // 2. Procesar componentes
                    var arrayLines = objJson[0].lines;
                    var componentCount = assemblyBuild.getLineCount({ sublistId: 'component' });
                    log.debug('Total componentes a procesar', componentCount);

                    for (var j = 0; j < componentCount; j++) {
                        try {
                            // Seleccionar línea
                            assemblyBuild.selectLine({
                                sublistId: 'component',
                                line: j
                            });

                            // Obteniendo componente de línea
                            var componentId = assemblyBuild.getCurrentSublistValue({
                                sublistId: 'component',
                                fieldId: 'item'
                            });

                            log.debug(`Procesando línea ${j} - Componente ID: ${componentId}`);

                            // Buscar coincidencia
                            var matchedLine = arrayLines.find(function (line) {
                                return line.itemid == componentId;
                            });

                            if (matchedLine) {
                                log.debug('Coincidencia encontrada', matchedLine);
                                updateComponentLine(assemblyBuild, j, matchedLine);
                            }

                            // Confirmar cambios en la línea
                            assemblyBuild.commitLine({ sublistId: 'component' });

                        } catch (e) {
                            log.error(`Error procesando línea ${j}`, e);
                        }
                    }

                    // Guardar cambios
                    var buildId = assemblyBuild.save();
                    log.audit('Assembly Build actualizado', buildId);
                }


            } catch (e) {
                log.error('Error en afterSubmit', e);
                //throw e;
            }
        }

        function updateMainInventoryDetail(record, jsonData) {
            try {
                log.debug('Actualizando inventory detail principal');

                // Obtener subrecord
                var invdet = record.getSubrecord({ fieldId: 'inventorydetail' });

                // Limpiar asignaciones existentes
                clearInventoryAssignments(invdet);

                // Crear nueva asignación
                invdet.selectNewLine({ sublistId: 'inventoryassignment' });

                // Asignar valores
                invdet.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    value: jsonData.serie
                });

                if (jsonData.bin) {
                    invdet.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'binnumber',
                        value: jsonData.bin
                    });
                }

                invdet.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: 1
                });

                // Confirmar cambios
                invdet.commitLine({ sublistId: 'inventoryassignment' });

            } catch (e) {
                log.error('Error actualizando inventory detail principal', e);
                throw e;
            }
        }

        function updateComponentLine(record, lineNum, lineData) {
            try {
                log.debug('Actualizando línea', lineNum);

                // 1. Actualizar cantidad del componente
                record.setCurrentSublistValue({
                    sublistId: 'component',
                    fieldId: 'quantity',
                    value: lineData.quantity || 1
                });

                // 2. Obtener subrecord
                var detail = record.getCurrentSublistSubrecord({
                    sublistId: 'component',
                    fieldId: 'componentinventorydetail'
                });

                // 3. Si no existe, crearlo
                if (!detail) {
                    log.debug('Creando nuevo subrecord para línea', lineNum);
                    detail = record.createCurrentSublistSubrecord({
                        sublistId: 'component',
                        fieldId: 'componentinventorydetail'
                    });
                }

                // 4. Limpiar asignaciones existentes
                //clearInventoryAssignments(detail);

                // 5. Crear nueva asignación
                detail.selectNewLine({ sublistId: 'inventoryassignment' });

                // 6. Asignar valores
                if (lineData.serie) {
                    detail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        value: lineData.serie
                    });
                }

                if (lineData.bin) {
                    detail.setCurrentSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'binnumber',
                        value: lineData.bin
                    });
                }

                detail.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'inventorystatus',
                    value: lineData.status || 1
                });

                // 7. Establecer cantidad
                detail.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: lineData.quantity || 1
                });

                // 8. Confirmar cambios
                detail.commitLine({ sublistId: 'inventoryassignment' });

            } catch (e) {
                log.error(`Error actualizando línea ${lineNum}`, e);
                throw e;
            }
        }

        function clearInventoryAssignments(subrecord) {
            try {
                if (!subrecord) return;

                var assignCount = subrecord.getLineCount({ sublistId: 'inventoryassignment' });
                log.debug('Asignaciones a limpiar', assignCount);

                for (var i = assignCount - 1; i >= 0; i--) {
                    subrecord.removeLine({ sublistId: 'inventoryassignment', line: i });
                }
            } catch (e) {
                log.error('Error limpiando asignaciones', e);
                throw e;
            }
        }

        function getJsonData(assemblyBuild) {
            let jsonData = {};
            let lines = [];
            let recordType = '';
            let recordType2 = '';
            let dispositivoSerie = ''
            let columns = [];
            let columns2 = [];
            let idDispositivo = '';
            let simcardSerie = '';
            let idSimcard = '';
            let monitoreo = '';
            let lojack = '';
            let simcard = '';
            let inventoryNumberDis = '';
            let inventoryNumberSim = '';

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
            //var searchResultCount = mySearch.runPaged().count;
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
                } else if (lojack) {
                    recordType = 'customrecord_ht_record_detallechaslojack';
                    idDispositivo = result.getValue('custrecord_ht_mc_seriedispositivolojack');
                    dispositivoSerie = result.getText('custrecord_ht_mc_seriedispositivolojack');
                    columns = ['custrecord_ht_cl_lojack'];
                }

                let searchDis = getSearchLookupFields(recordType, idDispositivo, columns)
                if (monitoreo) {
                    idDispositivo = searchDis.custrecord_ht_dd_dispositivo[0].value;
                } else if (lojack) {
                    idDispositivo = searchDis.custrecord_ht_cl_lojack[0].value;
                }

                inventoryNumberDis = InventoryBinNumbers(dispositivoSerie, idDispositivo);

                lines.push({
                    itemid: idDispositivo,  // ID debe coincidir exactamente
                    quantity: 1,
                    bin: inventoryNumberDis.bin,       // Bin para el componente
                    serie: inventoryNumberDis.inventorynumberid, // Serie para el componente
                    status: 1
                })

                if (simcard) {
                    recordType2 = 'customrecord_ht_record_detallechasersim';
                    idSimcard = result.getValue('custrecord_ht_mc_celularsimcard');
                    simcardSerie = result.getText('custrecord_ht_mc_celularsimcard');
                    columns2 = ['custrecord_ht_ds_simcard'];

                    let searchSim = getSearchLookupFields(recordType2, idSimcard, columns2)
                    idSimcard = searchSim.custrecord_ht_ds_simcard[0].value;

                    inventoryNumberSim = InventoryBinNumbers(simcardSerie, idSimcard);

                    lines.push({
                        itemid: idSimcard,  // ID debe coincidir exactamente
                        quantity: 1,
                        bin: inventoryNumberSim.bin,       // Bin para el componente
                        serie: inventoryNumberSim.inventorynumberid, // Serie para el componente
                        status: 1
                    })
                }
            });

            jsonData.quantity = 1
            jsonData.serie = dispositivoSerie
            jsonData.bin = inventoryNumberDis.bin
            jsonData.lines = lines

            log.debug('jsonData', [jsonData]);

            return [jsonData];

            // return [
            //     {
            //         quantity: 1,
            //         serie: "SERIE-12345",  // Serie para el inventory detail principal
            //         bin: 760,        // Bin para el inventory detail principal
            //         lines: [
            //             {
            //                 itemid: 27409,  // ID debe coincidir exactamente
            //                 quantity: 1,
            //                 bin: 760,       // Bin para el componente
            //                 serie: "756505", // Serie para el componente
            //                 status: 1
            //             }
            //         ]
            //     }
            //];
        }

        function InventoryBinNumbers(serie, item) {
            let jsonData = {};
            var inventorynumberbinSearchObj = search.create({
                type: "inventorynumberbin",
                filters:
                    [
                        ["inventorynumber", "is", serie],
                        "AND",
                        ["inventorynumber.item", "anyof", item],
                        "AND",
                        ["quantityavailable", "greaterthan", "0"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "inventorynumber", label: "Inventory Number" }),
                        search.createColumn({ name: "location", label: "Location" }),
                        search.createColumn({ name: "binnumber", label: "Bin Number" }),
                        search.createColumn({ name: "quantityavailable", label: "Available" })
                    ]
            });
            var searchResultCount = inventorynumberbinSearchObj.runPaged().count;
            log.debug("inventorynumberbinSearchObj result count", searchResultCount);
            inventorynumberbinSearchObj.run().each(function (result) {
                jsonData.inventorynumberid = result.getValue('inventorynumber');
                jsonData.bin = result.getValue('binnumber');
            });

            return jsonData;
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
            afterSubmit: afterSubmit
        };
    });