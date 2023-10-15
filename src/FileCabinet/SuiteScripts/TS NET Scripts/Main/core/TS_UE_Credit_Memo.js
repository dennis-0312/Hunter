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
        var TIPO_TRANSACCION = '2';
        var TIPO_AGRUPACION_PRODUCTO = '77';
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
                    let valor_tipo_agrupacion = 0, idCoberturaItem, envioPX = 0, envioTele = 0, itemid = 0;
                    let numLines = objRecord.getLineCount({ sublistId: 'item' });
                    for (i = 0; i < numLines; i++) {
                        let items = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        log.debug('items', items);
                        let parametrosRespo = _controller.parametrizacion(items);
                        for (let j = 0; j < parametrosRespo.length; j++) {
                            if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                valor_tipo_agrupacion = parametrosRespo[j][1];
                            }
                        }
                    }
                    log.debug('idB', idB);
                    let busqueda_cobertura = getCoberturaItem(idB);
                    log.debug('busqueda_cobertura', busqueda_cobertura);
                    if (busqueda_cobertura.length != 0) {
                        // [
                        //     [
                        //        "38208",
                        //        "3855"
                        //     ]
                        //  ]
                        itemid = busqueda_cobertura[0][0]
                        for (let i = 0; i < busqueda_cobertura.length; i++) {
                            let parametrosRespo = _controller.parametrizacion(busqueda_cobertura[i][0]);
                            if (parametrosRespo.length != 0) {
                                var accion_producto_2 = 0;
                                var valor_tipo_agrupacion_2 = 0;
                                for (let j = 0; j < parametrosRespo.length; j++) {
                                    if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                        valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                                    }
                                    if (valor_tipo_agrupacion == valor_tipo_agrupacion_2) {
                                        idCoberturaItem = busqueda_cobertura[i][1];
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

                    record.submitFields({
                        type: 'customrecord_ht_co_cobertura',
                        id: idCoberturaItem,
                        values: {
                            'custrecord_ht_co_estado_cobertura': 2
                        },
                        options: { enableSourcing: false, ignoreMandatoryFields: true }
                    });

                    let assetid = objRecord.getValue('custbody_ht_so_bien');
                    let customerid = objRecord.getValue('entity');
                    let productoid = itemid;
                    if (envioPX == _constant.Valor.SI) {
                        log.debug('DesestimientoPX', 'Función de impulso a PX')
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

        function getCoberturaItem(idBien) {
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", idBien]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_co_producto", label: "HT CO Producto" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 100);
                var internalidItem = '';
                var internalid = '';
                var arrayIdTotal = [];
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        var arrayId = [];
                        internalidItem = result.getValue(busqueda.columns[0]);
                        arrayId.push(internalidItem);
                        internalid = result.getValue(busqueda.columns[1]);
                        arrayId.push(internalid);
                        arrayIdTotal.push(arrayId);
                        return true;
                    });
                }
                return arrayIdTotal;
            } catch (e) {
                log.error('Error en getCoberturaItem', e);
            }
        }
        function getCobertura(bien) {
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
















