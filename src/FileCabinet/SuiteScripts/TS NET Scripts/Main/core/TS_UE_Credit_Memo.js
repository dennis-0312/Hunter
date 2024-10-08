/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_UE_Credit_Memo.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 6/12/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/log',
    'N/search',
    'N/record',
    'N/ui/serverWidget',
    'N/https',
    'N/error',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
],
    (log, search, record, serverWidget, https, error, _controller, _constant, _errorMessage) => {
        const afterSubmit = (context) => {
            if (context.type === context.UserEventType.CREATE) {
                const objRecord = context.newRecord;
                const idCM = objRecord.id;
                const palabraBuscada = "Withholding Tax";
                const memo = context.newRecord.getValue({ fieldId: 'memo' });
                if (memo.includes(palabraBuscada)) {
                    log.debug('Nota de Crédito', 'Certificado de Retención');
                } else {
                    let i;
                    let idB = objRecord.getValue('custbody_ht_so_bien');
                    let valor_tipo_agrupacion = -1, idCoberturaItem, envioPX = 0, envioTele = 0, itemid = 0, serieChaser = 0, busqueda_cobertura = '';
                    let numLines = objRecord.getLineCount({ sublistId: 'item' });
                    for (i = 0; i < numLines; i++) {
                        let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        log.debug('items', items);
                        let parametrosRespo = _controller.parametrizacion(items);
                        for (let j = 0; j < parametrosRespo.length; j++) {
                            if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                valor_tipo_agrupacion = parametrosRespo[j][1];
                            }
                        }
                    }
                    log.debug('idB', idB);
                    log.debug('valor_tipo_agrupacion', valor_tipo_agrupacion);
                    if (idB) {
                        busqueda_cobertura = getCoberturaItem(idB);
                    }
                    log.debug('busqueda_cobertura', busqueda_cobertura);
                    if (busqueda_cobertura.length != 0) {
                        itemid = busqueda_cobertura[0][0]
                        for (let i = 0; i < busqueda_cobertura.length; i++) {
                            let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                            if (parametrosRespo.length != 0) {
                                var accion_producto_2 = 0;
                                var valor_tipo_agrupacion_2 = 0;
                                for (let j = 0; j < parametrosRespo.length; j++) {
                                    if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS)
                                        valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                    if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                                        idCoberturaItem = busqueda_cobertura[i][1];
                                        serieChaser = busqueda_cobertura[i][2];
                                    }
                                    if (parametrosRespo[j][0] == _constant.Parameter.GPG_GENERA_PARAMETRIZACION_EN_GEOSYS)
                                        envioPX = parametrosRespo[j][1];
                                    if (parametrosRespo[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS)
                                        envioTele = parametrosRespo[j][1];
                                }
                            }
                        }
                    }
                    log.debug('idCoberturaItem', idCoberturaItem);
                    if (idCoberturaItem) {
                        record.submitFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: idCoberturaItem,
                            values: {
                                'custrecord_ht_co_estado_cobertura': _constant.Status.SUSPENDIDO,
                                'custrecord_ht_co_estado_conciliacion': _constant.Status.ENVIADO_A_CORTE
                            },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }

                        });
                        record.submitFields({
                            type: 'customrecord_ht_record_mantchaser',
                            id: serieChaser,
                            values: { 'custrecord_ht_mc_estadosimcard': _constant.Status.EN_PROCESO_DE_CORTE },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });

                        let dispositivo = search.lookupFields({
                            type: 'customrecord_ht_record_mantchaser',
                            id: serieChaser,
                            columns: ['custrecord_ht_mc_seriedispositivo', 'custrecord_ht_mc_celularsimcard']
                        });
                        // let idDispositivo = dispositivo.custrecord_ht_mc_seriedispositivo[0].value;
                        // record.submitFields({
                        //     type: 'customrecord_ht_record_detallechaserdisp',
                        //     id: idDispositivo,
                        //     values: { 'custrecord_ht_dd_estado': _constant.Status.DISPONIBLE },
                        //     options: { enableSourcing: false, ignoreMandatoryFields: true }
                        // });

                        try {
                            let idSimCard = dispositivo.custrecord_ht_mc_celularsimcard[0].value;
                            record.submitFields({
                                type: 'customrecord_ht_record_detallechasersim',
                                id: idSimCard,
                                values: {
                                    'custrecord_ht_ds_estado': _constant.Status.EN_PROCESO_DE_CORTE,
                                    'custrecord_ht_ds_fechacorte': new Date()
                                },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        } catch (error) {
                            log.error('Lojack', 'Dispositivo Lojack, no tiene SIM Card.');
                        }

                        let assetid = objRecord.getValue('custbody_ht_so_bien');
                        let customerid = objRecord.getValue('entity');
                        let productoid = itemid;
                        if (envioPX == _constant.Valor.SI) {
                            log.debug('DesestimientoPX', 'Función de impulso a PX, no hay desistimiento del servicio en PX')
                        }

                        if (envioTele == _constant.Valor.SI) {
                            log.debug('DesestimientoTM', 'Función de impulso a TM')
                            let vehiculo = search.lookupFields({
                                type: 'customrecord_ht_record_bienes',
                                id: idB,
                                columns: ['custrecord_ht_bien_id_telematic']
                            })
                            let telemat = {
                                id: vehiculo.custrecord_ht_bien_id_telematic,
                                // state: false,
                                active: false
                            }
                            // const envioTelematic = (json) => {
                            let myRestletHeaders = new Array();
                            myRestletHeaders['Accept'] = '*/*';
                            myRestletHeaders['Content-Type'] = 'application/json';

                            let myRestletResponse = https.requestRestlet({
                                body: JSON.stringify(telemat),
                                deploymentId: 'customdeploy_ns_rs_update_asset',
                                scriptId: 'customscript_ns_rs_update_asset',
                                headers: myRestletHeaders,
                            });
                            let response = myRestletResponse.body;
                            return response;
                            // }
                        }
                    }
                }
            }
        }

        const getCoberturaItem = (idBien) => {
            try {
                let busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", idBien]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_co_producto", label: "HT CO Producto" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "custrecord_ht_co_numeroserieproducto", label: "VID/SERIE" }),
                        ]
                });
                let savedsearch = busqueda.run().getRange(0, 100);
                let internalidItem = '';
                let internalid = '';
                let chaser = 0
                let arrayIdTotal = [];
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        let arrayId = [];
                        internalidItem = result.getValue(busqueda.columns[0]);
                        arrayId.push(internalidItem);
                        internalid = result.getValue(busqueda.columns[1]);
                        arrayId.push(internalid);
                        chaser = result.getValue(busqueda.columns[2]);
                        arrayId.push(chaser);
                        arrayIdTotal.push(arrayId);
                        return true;
                    });
                }
                return arrayIdTotal;
            } catch (e) {
                log.error('Error en getCoberturaItem', e);
            }
        }

        const getCobertura = (bien) => {
            try {
                var arrCoberturaId = new Array();
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", bien]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var pageData = busqueda.runPaged({
                    pageSize: 1000
                });

                pageData.pageRanges.forEach(function (pageRange) {
                    page = pageData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
                        var columns = result.columns;
                        var arrCobertura = new Array();
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null)
                            arrCobertura[0] = result.getValue(columns[0]);
                        else
                            arrCobertura[0] = '';
                        arrCoberturaId.push(arrCobertura);
                    });
                });
                return arrCoberturaId;
            } catch (e) {
                log.error('Error en getCobertura', e);
            }
        }
        return {
            afterSubmit: afterSubmit
        }
    });




/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 12/12/2022
Author: Dennis Fernández
Description: Creación del script en SB.
/*********************************************************************************************************************************************
Commit:02
Version: 1.0
Date: 15/12/2022
Author: Dennis Fernández
Description: Aplicación de evento EDIT.
==============================================================================================================================================*/
/*********************************************************************************************************************************************
Commit:03
Version: 1.0
Date: 23/03/2023
Author: Jeferson Mejia
Description: Se juntaron los scritps de Orden de Trabajo
==============================================================================================================================================*/
















