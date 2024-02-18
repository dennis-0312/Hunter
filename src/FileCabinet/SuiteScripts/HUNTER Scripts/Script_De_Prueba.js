/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/https', 'N/log', 'N/record', 'N/search'],
    (https, log, record, search) => {
        const beforeLoad = (scriptContext) => { }
        const beforeSubmit = (scriptContext) => { }

        const afterSubmit = (scriptContext) => {
            log.debug('Prueba', 'Prueba User Event');
            let json = new Array();
            var customrecord_ht_record_bienesSearchObj = search.create({
                type: "customrecord_ht_record_bienes",
                filters:
                    [
                        ["internalid", "anyof", "1001120514"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custentity_ec_vatregnumber",
                            join: "CUSTRECORD_HT_BIEN_PROPIETARIO",
                            label: "CLIENTE"
                        }),
                        search.createColumn({
                            name: "email",
                            join: "CUSTRECORD_HT_BIEN_PROPIETARIO",
                            label: "USERNAME"
                        }),
                        search.createColumn({
                            name: "custentity_ht_customer_id_telematic",
                            join: "CUSTRECORD_HT_BIEN_PROPIETARIO",
                            label: "AMICLIENTE"
                        }),
                        search.createColumn({ name: "internalid", label: "CODVEHICULO" })
                    ]
            });
            var searchResultCount = customrecord_ht_record_bienesSearchObj.runPaged().count;
            log.debug("customrecord_ht_record_bienesSearchObj result count", searchResultCount);
            customrecord_ht_record_bienesSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                let cliente = result.getValue({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_BIEN_PROPIETARIO", label: "CLIENTE" });
                let userame = result.getValue({ name: "email", join: "CUSTRECORD_HT_BIEN_PROPIETARIO", label: "USERNAME" });
                let amicliente = result.getValue({ name: "custentity_ht_customer_id_telematic", join: "CUSTRECORD_HT_BIEN_PROPIETARIO", label: "AMICLIENTE" });
                let codvehiculo = result.getValue({ name: "internalid", label: "CODVEHICULO" });
                json.push({
                    cliente: cliente,
                    userame: userame,
                    amicliente: amicliente,
                    codvehiculo: codvehiculo
                });
                return true;
            });

            log.debug('JSON', json);
            /*
            customrecord_ht_record_bienesSearchObj.id="customsearch1697156099490";
            customrecord_ht_record_bienesSearchObj.title="Búsqueda de Bienes (copy)";
            var newSearchId = customrecord_ht_record_bienesSearchObj.save();
            */
        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
