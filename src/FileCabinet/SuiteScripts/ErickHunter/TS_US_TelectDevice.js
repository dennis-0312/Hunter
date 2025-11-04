/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/log',
    'N/record',
    'N/https',
    'N/query',
    '../TS NET Scripts/Main/controller/TS_CM_Controller',
    '../TS NET Scripts/Main/constant/TS_CM_Constant',
    '../TS NET Scripts/Main/error/TS_CM_ErrorMessages',
    'N/error',
    'N/search'
],
    (log, record, https, query, _controller, _constant, errorMessage, error, search) => {

        const beforeSubmit = (scriptContext) => {
            let objRecord = scriptContext.newRecord;
            let message = '';
            let recordType = '';
            let recordType2 = '';
            let dispositivoSerie = ''
            let columns = [];
            let columns2 = [];
            let idDispositivo = '';
            let simcardSerie = '';
            let idSimcard = '';
            let searchResultCountDisponibleSim = -1;
            let searchResultCountExisteInventarioSim = 0;
            let subsidiary = objRecord.getValue('custrecord_ht_mc_subsidiaria');
            let monitoreo = objRecord.getValue('custrecord_ht_mc_seriedispositivo');
            let lojack = objRecord.getValue('custrecord_ht_mc_seriedispositivolojack');
            let simcard = objRecord.getValue('custrecord_ht_mc_celularsimcard');
            let cargaFlujo = objRecord.getValue('custrecord_ht_ds_carga_flujo');

            if (!cargaFlujo) {
                if (monitoreo) {
                    recordType = 'customrecord_ht_record_detallechaserdisp';
                    idDispositivo = objRecord.getValue('custrecord_ht_mc_seriedispositivo');
                    dispositivoSerie = objRecord.getText('custrecord_ht_mc_seriedispositivo');
                    columns = ['custrecord_ht_dd_dispositivo'];
                } else if (lojack) {
                    recordType = 'customrecord_ht_record_detallechaslojack';
                    idDispositivo = objRecord.getValue('custrecord_ht_mc_seriedispositivolojack');
                    dispositivoSerie = objRecord.getText('custrecord_ht_mc_seriedispositivolojack');
                    columns = ['custrecord_ht_cl_lojack'];
                }

                if (simcard) {
                    recordType2 = 'customrecord_ht_record_detallechasersim';
                    idSimcard = objRecord.getValue('custrecord_ht_mc_celularsimcard');
                    simcardSerie = objRecord.getText('custrecord_ht_mc_celularsimcard');
                    columns2 = ['custrecord_ht_ds_simcard'];

                    let searchSim = getSearchLookupFields(recordType2, idSimcard, columns2)
                    idSimcard = searchSim.custrecord_ht_ds_simcard[0].value;

                    searchResultCountExisteInventarioSim = getInventoryNumber(idSimcard, simcardSerie)
                    if (searchResultCountExisteInventarioSim == 0) {
                        message += 'El SIM CARD no está en el inventario.'
                    }

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
                    log.debug("SIM CARD Disponible", searchResultCountDisponibleSim);
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
                let searchResultCountExisteInventarioDis = getInventoryNumber(idDispositivo, dispositivoSerie)
                if (searchResultCountExisteInventarioDis == 0) {
                    message += 'El Dispositivo no está en el inventario.'
                }


                let customrecord_ht_record_detallechaserdispSearchObj = search.create({
                    type: recordType,
                    filters:
                        [
                            ["custrecordht_hdd_subsidiaria", "anyof", subsidiary],
                            "AND",
                            ["name", "is", dispositivoSerie]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "Name" }),
                        ]
                });
                let searchResultCountDisponible = customrecord_ht_record_detallechaserdispSearchObj.runPaged().count;
                log.debug("Dispositivo Disponible", searchResultCountDisponible);
                if (searchResultCountDisponible == 0) {
                    message += 'El Dispositivo no está disponible.'
                }

                if (searchResultCountExisteInventarioDis == 0 || searchResultCountDisponible == 0 || searchResultCountExisteInventarioSim == 0 || searchResultCountDisponibleSim == 0) {
                    log.debug('message', message);
                    let custom_error = error.create({
                        name: 'El dispotivo o SIM CARD no se encuentran disponibles',
                        message: message,
                        notifyOff: false
                    });
                    throw custom_error;
                }
            }


            objRecord.getValue('custrecord_ht_ds_carga_flujo', false);
        }

        const getInventoryNumber = (item, serie) => {
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
                        search.createColumn({ name: "inventorynumber", label: "Number" })
                    ]
            });
            let searchResultCountExisteInventario = inventorynumberSearchObj.runPaged().count;
            log.debug("Item se encuentra en el inventario", searchResultCountExisteInventario);
            return searchResultCountExisteInventario;
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
            beforeSubmit: beforeSubmit,
            //afterSubmit: afterSubmit
        }

    });

