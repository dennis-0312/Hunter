/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||
||   This script for Customer (Generación de identificador para cliente)
||
||   File Name: TS_UE_Asset.js
||
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points
||   01          1.0         26/01/2023      Script 2.1         SB               N/A
||
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/error',
    'N/log',
    'N/search',
    'N/record',
    'N/redirect',
    'N/ui/serverWidget',
    'N/runtime',
    'N/https',
    'N/format',
    'N/query',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant'
], (error, log, search, record, redirect, serverWidget, runtime, https, format, query, _controller, _constant) => {

    const afterSubmit = (context) => {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                const currentRecord = context.newRecord;
                const idRecord = currentRecord.id;
                let objRecord = record.load({ type: 'customrecord_ncfar_asset', id: idRecord, isDynamic: true });
                log.debug('idRecord', idRecord);
                var cadenaConCeros = agregarCeros(idRecord);
                log.debug('cadenaConCeros', cadenaConCeros);
                objRecord.setValue('custrecord_ht_af_codigobarra', cadenaConCeros);
                objRecord.save();
            }
        } catch (e) {
            log.error('Error en el afterSubmit', e);
        }
    }

    const beforeLoad = (context) => {
        try {
            var form = context.form;
            var currentRecord = context.newRecord;
            const idRecord = currentRecord.id;
            const typeRecord = currentRecord.type;

            if (context.type == context.UserEventType.VIEW) {
                var codigobarras = currentRecord.getValue('custrecord_ht_af_codigobarra');
                if (codigobarras != '') {
                    form.addButton({
                        id: 'custpage_ts_codigo_barras',
                        label: 'Código de Barras',
                        functionName: 'printCodigoBarras(' + idRecord + ',"' + typeRecord + '")'
                    });
                    form.clientScriptModulePath = './TS_CS_Codigo_Barras.js';
                }
            }
        } catch (e) {
            log.error('Error en el beforeSubmit', e);
        }
    }

    function agregarCeros(num) {
        var numString = num.toString(); // convertir el número en una cadena
        while (numString.length < 11) { // agregar ceros a la izquierda mientras la cadena sea menor que 11
            numString = '0' + numString;
        }
        return numString;
    }

    const beforeSubmit = (context) => {
        try {
            let customError = "";
            let objRecord = context.newRecord;

            if (context.type === context.UserEventType.EDIT) {
                let estadoActivo = objRecord.getValue("custrecord_assetstatus");
                let estadoFisicoActivo = objRecord.getValue("custrecord_ht_af_estadofisico");
                let activoFijoId = objRecord.id;
                log.error("error", { estadoActivo, estadoFisicoActivo, activoFijoId });
                if (estadoActivo == "4" && (estadoFisicoActivo == "11" || estadoFisicoActivo == "13")) {
                    let result = obtenerArticuloInstalacionOrdenTrabajo(activoFijoId, _constant.Status.INSTALADO);
                    log.error("result", result);
                    if (result) {
                        let telematicResult = true, pxResult = true;
                        let { item, ordenServicio, dispositivo, ordenTrabajo } = result;
                        log.error("valores", { item, ordenServicio, dispositivo, ordenTrabajo });
                        let parametrizacion = _controller.parametrizacionJson(item);
                        let impulsoTelematic = parametrizacion[_constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS];
                        let impulsoPX = parametrizacion[_constant.Codigo_parametro.COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS];
                        log.error("Entro a preguntar envio plataforma", { impulsoTelematic, impulsoPX });
                        if (impulsoTelematic !== undefined && impulsoTelematic.valor == _constant.Codigo_Valor.COD_SI) {
                            telematicResult = _controller.envioTelecDesinstalacionDispositivoActivoFijo(ordenTrabajo, activoFijoId);
                            if (!telematicResult) throw error.create({ name: "CUSTOM_ERROR", message: "Ocurrió un error al impulsar a Telematic", notifyOff: false });
                        }
                        if (impulsoPX !== undefined && impulsoPX.valor == _constant.Codigo_Valor.COD_SI) {
                            pxResult = _controller.envioPXMantenimientoChequeoDispositivo(ordenTrabajo, activoFijoId);
                            if (!pxResult) throw error.create({ name: "CUSTOM_ERROR", message: "Ocurrió un error al impulsar a Px", notifyOff: false });
                        }
                        log.error("Valores", { telematicResult, pxResult });
                        if (telematicResult && pxResult) {
                            let coberturaResult = buscarCobertura(ordenServicio);
                            let valoresDispositivo = buscarDispositivo(dispositivo);
                            if (valoresDispositivo.simCard) {
                                actualizarSimCard(valoresDispositivo.simCard);
                            }
                            if (valoresDispositivo.cargaDispositivo) {
                                actualizarCargaDispositivo(valoresDispositivo.cargaDispositivo);
                            }
                            if (coberturaResult) {
                                let cobertura = coberturaResult.cobertura;
                                let values = { "custrecord_ht_co_estado_cobertura": _constant.Status.SIN_DISPOSITIVO };
                                actualizarCobertura(cobertura, values);
                            }
                        }

                        // let result = obtenerArticuloInstalacionOrdenTrabajo(activoFijoId, _constant.Status.INSTALADO);
                        // log.error("result", result);
                        // let { historialActivoFijo } = result;
                        
                        let sql = 'SELECT id FROM customrecord_ht_record_historialsegui WHERE custrecord_ht_hs_estado = 1 AND custrecord_ht_af_enlace = ?';
                        let params = [activoFijoId]
                        let resultSet = query.runSuiteQL({ query: sql, params: params });
                        let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
                        if (results.length > 0) {
                            record.submitFields({
                                type: "customrecord_ht_record_historialsegui",
                                id: results[0]['id'],
                                values: {
                                    "custrecord_ht_hs_estado": _constant.Status.DANADO
                                }
                            });
                        }
                    }
                } else if (estadoActivo == "4" && estadoFisicoActivo == "10") {
                    let invoiceId = objRecord.getValue("custrecord_assetsalesinvoice");
                    let result = obtenerArticuloInstalacionOrdenTrabajo(activoFijoId);
                    log.error("result", result);
                    let { ordenServicio, historialActivoFijo } = result;
                    if (result && invoiceId) {
                        let coberturaResult = buscarCobertura(ordenServicio);
                        log.error("coberturaResult", coberturaResult);

                        if (coberturaResult) {
                            let cobertura = coberturaResult.cobertura;
                            let values = { "custrecord_ht_co_estado": _constant.Status.ENTREGADO_A_CLIENTE };
                            actualizarCobertura(cobertura, values);
                            createCoberturaDetail(cobertura, invoiceId);
                            actualizarHistorialActivoFijo(historialActivoFijo);
                            log.error("fin", "");
                        }
                    }
                }
            }
        } catch (e) {
            log.error("error", error)
            if (e.name == "CUSTOM_ERROR") {
                throw error.create({ name: "CUSTOM_ERROR", message: "Ocurrió un error al impulsar a Telematic", notifyOff: false });
            }
        }
    }

    const createCoberturaDetail = (coberturaId, invoiceId) => {
        try {
            let trackingHistory = record.create({
                type: "customrecord_ht_ct_cobertura_transaction"
            });
            trackingHistory.setValue("custrecord_ht_ct_transacciones", coberturaId);
            trackingHistory.setValue("custrecord_ht_ct_orden_servicio", invoiceId);
            trackingHistory.setText("custrecord_ht_ct_concepto", "Venta");
            trackingHistory.setValue("custrecord_ht_ct_fecha_inicial", new Date());
            return trackingHistory.save();
        } catch (error) {

        }
    }

    const actualizarHistorialActivoFijo = (historialActivoFijoId) => {
        record.submitFields({
            type: "customrecord_ht_record_historialsegui",
            id: historialActivoFijoId,
            values: {
                "custrecord_ht_hs_estado": _constant.Status.ENTREGADO_A_CLIENTE
            }
        });
    }

    const obtenerArticuloInstalacionOrdenTrabajo = (activoFijoId, status) => {
        let filters = [["custrecord_ht_af_enlace", "anyof", activoFijoId]];
        if (status) {
            filters.push("AND");
            filters.push(["custrecord_ht_hs_estado", "anyof", status]);
        }

        let searchResult = search.create({
            type: "customrecord_ht_record_historialsegui",
            filters,
            columns: [
                "custrecord_ht_hs_numeroordenservicio",
                search.createColumn({ name: "created", sort: search.Sort.DESC, label: "Fecha de creación" })
            ]
        }).run().getRange(0, 1);
        if (searchResult.length) {
            let ordenServicio = searchResult[0].getValue("custrecord_ht_hs_numeroordenservicio");
            let ordenTrabajo = obtenerOrdenTrabajo(ordenServicio);
            if (ordenTrabajo) return { item: ordenTrabajo.item, ordenServicio, dispositivo: ordenTrabajo.dispositivo, ordenTrabajo: ordenTrabajo.ordenTrabajo, historialActivoFijo: searchResult[0].id };
        }
        return "";
    }

    const obtenerOrdenTrabajo = (ordenServicioId) => {
        let searchResult = search.create({
            type: "customrecord_ht_record_ordentrabajo",
            filters: [
                ["custrecord_ht_ot_orden_servicio", "anyof", ordenServicioId]
            ],
            columns: ["custrecord_ht_ot_item", "custrecord_ht_ot_serieproductoasignacion"]
        }).run().getRange(0, 1);

        if (searchResult.length) {
            let item = searchResult[0].getValue("custrecord_ht_ot_item");
            let dispositivo = searchResult[0].getValue("custrecord_ht_ot_serieproductoasignacion");
            let ordenTrabajo = searchResult[0].id;
            return { item, dispositivo, ordenTrabajo };
        }
        return "";
    }

    const buscarCobertura = (ordenServicio) => {
        let resultSearch = search.create({
            type: "customrecord_ht_ct_cobertura_transaction",
            filters: [["custrecord_ht_ct_orden_servicio", "anyof", ordenServicio]],
            columns: ["custrecord_ht_ct_transacciones"]
        }).run().getRange(0, 1);
        if (resultSearch.length) {
            let cobertura = resultSearch[0].getValue("custrecord_ht_ct_transacciones");
            return { cobertura };
        }
        return "";
    }

    const buscarDispositivo = (dispositivo) => {
        let resultSearch = search.lookupFields({
            type: "customrecord_ht_record_mantchaser",
            id: dispositivo,
            columns: ["custrecord_ht_mc_celularsimcard", "custrecord_ht_mc_seriedispositivo"]
        });
        let cargaDispositivo = resultSearch.custrecord_ht_mc_seriedispositivo.length ? resultSearch.custrecord_ht_mc_seriedispositivo[0].value : "";
        let simCard = resultSearch.custrecord_ht_mc_celularsimcard.length ? resultSearch.custrecord_ht_mc_celularsimcard[0].value : "";
        return { simCard, cargaDispositivo };
    }

    const actualizarCobertura = (idCobertura, values) => {
        return record.submitFields({
            type: "customrecord_ht_co_cobertura",
            id: idCobertura,
            values
        });
    }

    const actualizarSimCard = (simCard) => {
        return record.submitFields({
            type: "customrecord_ht_record_detallechasersim",
            id: simCard,
            values: {
                "custrecord_ht_ds_estado": 2
            }
        });
    }

    const actualizarCargaDispositivo = (cargaDispositivo) => {
        return record.submitFields({
            type: "customrecord_ht_record_detallechaserdisp",
            id: cargaDispositivo,
            values: {
                "custrecord_ht_dd_estado": 3
            }
        });
    }

    return {
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit,
        beforeLoad: beforeLoad
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 04/04/2023
Author: Jeferson Mejia
Description: Creación del script.
===================================================================================================================*/