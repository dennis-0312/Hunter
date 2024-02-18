/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log',
    'N/search',
    'N/record',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, search, record, _controller, _constant, _errorMessages) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => { }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => { }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                let objRecord = scriptContext.newRecord;
                if (objRecord.getValue('custrecord_ht_co_estado_cobertura') == _constant.Status.SUSPENDIDO && objRecord.getValue('custrecord_ht_co_estado_conciliacion') == _constant.Status.ENVIADO_A_CORTE) {
                    let idchaser = objRecord.getValue('custrecord_ht_co_numeroserieproducto');
                    let idbien = objRecord.getValue('custrecord_ht_co_bien');
                    let estadoSim = 'COR';
                    try {
                        let parametrosResponse = _controller.parametrizacion(objRecord.getValue('custrecord_ht_co_producto'));
                        if (parametrosResponse.length != 0) {
                            for (let j = 0; j < parametrosResponse.length; j++) {
                                if (parametrosResponse[j][0] == _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS)
                                    envioCortePX = parametrosResponse[j][1];

                                if (parametrosResponse[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS)
                                    envioCorteTM = parametrosResponse[j][1];
                            }

                            // log.debug('CortePX', 'Enviado a Corte PX: ' + envioCortePX);
                            // log.debug('CorteTM', 'Enviado a Corte TM: ' + envioCorteTM);
                            // log.debug('Datos', 'Datos de corte: ' + idchaser + ' - ' + idbien + ' - ' + estadoSim);

                            if (envioCortePX == _constant.Valor.SI) {
                                const returCortePX = _controller.envioPXActualizacionEstado(idchaser, idbien, estadoSim);
                                log.debug('ResponseCortePX', returCortePX);
                            }

                            if (envioCorteTM == _constant.Valor.SI) {
                                const returnCorteTM = _controller.envioTelecCorteSim(idchaser);
                                log.debug('ResponseCorteTM', returnCorteTM);
                            }
                        }
                    } catch (error) {
                        log.error('Error-Corte', error);
                    }
                }

                actualizacionCoberturaTelematic(objRecord);
            }

        }

        const actualizacionCoberturaTelematic = (objRecord) => {
            let ordenTrabajoId = obtenerOrdenTrabajo(objRecord.id);
            if (!ordenTrabajoId) return;
            _controller.envioTelecActualizacionCobertura(ordenTrabajoId, objRecord.getValue('custrecord_ht_co_coberturafinal'));
        }

        const obtenerOrdenTrabajo = (coberturaId) => {
            let resultSearch = search.create({
                type: "customrecord_ht_ct_cobertura_transaction",
                filters: [
                  ["custrecord_ht_ct_transacciones","anyof",coberturaId]
                ],
                columns: [
                   search.createColumn({ name: "custrecord_ht_ct_orden_trabajo", label: "Orden de Trabajo" }),
                   search.createColumn({ name: "created", sort: search.Sort.DESC, label: "Date Created" })
                 ]
            }).run().getRange(0,1000);
            if (!resultSearch.length) return;
            return resultSearch[0].getValue("custrecord_ht_ct_orden_trabajo");
        }

        return {
            // beforeLoad,
            // beforeSubmit,
            afterSubmit
        }

    });


// if (objRecord.getValue('custrecord_ht_co_estado_cobertura') == _constant.Status.SUSPENDIDO && objRecord.getValue('custrecord_ht_co_estado_conciliacion') == _constant.Status.ENVIADO_A_CORTE) {}

// let idchaser = objRecord.getValue('custrecord_ht_co_numeroserieproducto');
// let idbien = objRecord.getValue('custrecord_ht_co_bien');
// let parametrosResponse = _controller.parametrizacion(objRecord.getValue('custrecord_ht_co_producto'));
// if (parametrosResponse.length != 0) {
//     for (let j = 0; j < parametrosResponse.length; j++) {
//         if (parametrosResponse[j][0] == _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS)
//             envioCortePX = parametrosResponse[j][1];

//         if (parametrosResponse[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS)
//             envioCorteTM = parametrosResponse[j][1];
//     }
// }

//     log.debug('CortePX', 'Enviado a Corte PX: ' + envioCortePX);
//     log.debug('CorteTM', 'Enviado a Corte TM: ' + envioCorteTM);
//     log.debug('Datos', 'Datos de corte: ' + idchaser + ' - ' + idbien + ' - ' + 'COR');


// if (envioCortePX == _constant.Valor.SI) {
//     const envioPXActualizacionEstado (dispositivoId, vehiculoId, estadoSim);

//     if (envioCorteTM == _constant.Valor.SI) {
//         const envioPXActualizacionEstado(dispositivoId, vehiculoId, estadoSim);
//     }

// }
