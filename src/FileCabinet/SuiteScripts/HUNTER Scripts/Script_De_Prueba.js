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
                let cliente = result.getValue({ name: "custentity_ec_vatregnumber", join: "CUSTRECORD_HT_BIEN_PROPIETARIO", label: "CLIENTE" });
                let username = result.getValue({ name: "email", join: "CUSTRECORD_HT_BIEN_PROPIETARIO", label: "USERNAME" });
                let amicliente = result.getValue({ name: "custentity_ht_customer_id_telematic", join: "CUSTRECORD_HT_BIEN_PROPIETARIO", label: "AMICLIENTE" });
                let codvehiculo = result.getValue({ name: "internalid", label: "CODVEHICULO" });
                json.push({
                    cliente: cliente,
                    username: username,
                    amicliente: amicliente,
                    codvehiculo: codvehiculo
                });
                return true;
            });

            log.debug('JSON', json);

            // Add additional code

            var headerObj = {
                name: 'Accept-Language',
                value: 'en-us'
            };
            var response = https.post({
                url: 'https://www.testwebsite.com',
                body: 'My POST Data',
                headers: headerObj
            });

            var myresponse_body = response.body; // see https.ClientResponse.body
            var myresponse_code = response.code; // see https.ClientResponse.code
            var myresponse_headers = response.headers; // see https.Clientresponse.headers

            // Add additional code
        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
