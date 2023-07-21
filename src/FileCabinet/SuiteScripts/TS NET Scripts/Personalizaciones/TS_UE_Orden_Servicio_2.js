/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  
||   This script for Customer (Generación de identificador para cliente)                                            
||                                                                                                                  
||   File Name: TS_UE_Orden_Servicio_2.js                                                                            
||                                                                                                                  
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  
||   01          1.0         26/01/2023      Script 2.1         SB               N/A                                
||                                                                                                                  
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/redirect', 'N/ui/serverWidget', 'N/runtime', 'N/https','N/format'], (log, search, record, redirect, serverWidget, runtime, https, format) => {

    const afterSubmit = (context) => {
        const currentRecord = context.newRecord;
        const idRecord = currentRecord.id;

        if (context.type === context.UserEventType.CREATE) {
            let objRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
            let promotion = objRecord.getValue('automaticallyapplypromotions');
            let customer = objRecord.getValue('entity');
            let aprobacion_venta = objRecord.getValue('custbody_ht_os_aprobacionventa');
            let aprobacion_cartera = objRecord.getValue('custbody_ht_os_aprobacioncartera');
            log.debug('promotion', promotion);
            let numLines = objRecord.getLineCount({ sublistId: 'item' });
            if (promotion == false) {
                for (let i = 0; i < numLines; i++) {
                    objRecord.selectLine({
                        sublistId: 'item',
                        line: i
                    });
                    let rate = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'rate' });
                    if (rate < 0) {
                        objRecord.setValue('custbody_ht_os_aprobacionventa', 2);
                        objRecord.setValue('orderstatus', 'A');
                        log.debug('status', objRecord.getValue('orderstatus'));
                    }
                }
            } else {
                log.debug('numLines', numLines);
                if (numLines == 1) {
                    for (let i = 0; i < numLines; i++) {
                        objRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        let items = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                        var solicitaAprobacion = getSolicitaAprobacion(items);
                        var accionProducto = getAccionProducto(items);
                        var periodosServicio = getPeriodosServicio(items);
                        var tipoTransaccion = getTipoTransaccion(items);
                        if (solicitaAprobacion != '' && accionProducto != '' && periodosServicio != '') {
                            objRecord.setValue('orderstatus', 'A');
                            objRecord.setValue('custbody_ht_os_aprobacionventa', 2);
                        } else if (solicitaAprobacion != '' && accionProducto != '' && tipoTransaccion != '') {
                            objRecord.setValue('orderstatus', 'A');
                            objRecord.setValue('custbody_ht_os_aprobacionventa', 2);
                        }
                    }
                }
            }
            for (let i = 0; i < numLines; i++) {
                objRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });
                let idItem = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                var descriptionItem = getDescription(customer, idItem);
                if (descriptionItem) {
                    objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: descriptionItem });
                }
                objRecord.commitLine({ sublistId: 'item' });

            }
            objRecord.save({ ignoreMandatoryFields: true, enableSourcing: false });
        }

    }

    function getDescription(entity, item) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_record_descriparticulo",
                filters:
                    [
                        ["custrecord_ht_da_enlace", "anyof", entity],
                        "AND",
                        ["custrecord_ht_da_articulocomercial", "anyof", item]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_ht_da_enlace", label: "HT DA Enlace" }),
                        search.createColumn({ name: "custrecord_ht_da_articulocomercial", label: "HT DA Artículo comercial" }),
                        search.createColumn({ name: "custrecord_ht_da_descripcionventa", label: "HT DA Descripción de Venta" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var description = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    description = result.getValue(busqueda.columns[3]);
                    return true;
                });
            }
            return description;
        } catch (e) {
            log.error('Error en getDescription', e);
        }
    }
    const beforeLoad = (context) => {
        try {
            var form = context.form;
            var currentRecord = context.newRecord;

            var type_event = context.type;
            var userObj = runtime.getCurrentUser()
            var userId = userObj.id
            //let idItem = objRecord.get
/*             if (type_event === context.UserEventType.CREATE) { 16/03/2023

                currentRecord.setValue('custbody_ht_os_ejecutiva_backoffice', userId)
                var employee = search.lookupFields({
                    type: 'employee',
                    id: userObj.id,
                    columns: ['location']
                });
                var test = employee.location;
                log.debug('test', test);
                if (test != '') {
                    test = test[0].value;


                    currentRecord.setValue('location', test);

                }

            } */
            if (type_event == context.UserEventType.VIEW) {
                const idRecord = currentRecord.id;
                let objRecord = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
                let aprobacion_venta = objRecord.getValue('custbody_ht_os_aprobacionventa');
                let numLines = objRecord.getLineCount({ sublistId: 'item' });
                var htClient = '';
                var bien = '';
                var cobertura = '';
                var fechaInicial = '';
                var fechaFinal = '';
                if (numLines == 1) {
                    for (let i = 0; i < numLines; i++) {
                        objRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        let items = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                        log.debug('items', items);
                        var solicitaAprobacion = getSolicitaAprobacion(items);
                        var accionProducto = getAccionProducto(items);
                        var periodosServicio = getPeriodosServicio(items);
                        var tipoTransaccion = getTipoTransaccion(items);
                        if (solicitaAprobacion != '' && accionProducto != '' && periodosServicio != '') {
                            htClient = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_display' });
                            htClient = getCustomer(htClient);
                            bien = objRecord.getValue('custbody_ht_so_bien');
                            cobertura = getCobertura(bien);
                        } else if (solicitaAprobacion != '' && accionProducto != '' && tipoTransaccion != '') {
                            var fechaInicialItem = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cambio_fecha' });
                            fechaInicial = formatDate(fechaInicialItem);
                            log.debug('fechaInicial', fechaInicial);

                            
                            fechaFinal = new Date(fechaInicialItem);
                            fechaFinal = fechaFinal.setFullYear(fechaFinal.getFullYear() + 1);
                            fechaFinal = new Date(fechaFinal);

                            fechaFinal = formatDate(fechaFinal);
                            log.debug('fechaFinal', fechaFinal);
                            //var nuevaFecha = getFechaCobertura(fechaCobertura, fechaCobertura);

                            bien = objRecord.getValue('custbody_ht_so_bien');
                            cobertura = getCobertura(bien);
                        }
                    }

                }
                log.debug('htClient + bien + cobertura', htClient + ' - ' + bien + ' - ' + cobertura);
                if (aprobacion_venta == 2) {
                    form.addButton({
                        id: 'custpage_ts_aprobar_venta',
                        label: 'Aprobar Venta',
                        functionName: 'aprobarVenta(' + idRecord + ',"' + htClient + '","' + bien + '","' + cobertura + '","' + fechaInicial + '","' + fechaFinal + '")'
                    });
                    form.clientScriptModulePath = './TS_CS_Aprobar_Venta.js';
                }
            }
            /* let Propietario = search.lookupFields({
                type: 'customer', id: htClient,
                columns: [
                    'entityid',
                    'custentity_ht_cl_primernombre',
                    'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'email'
                ]
            });
            let PxAdmin = {
                StrToken: "SH2PX20230308",
                UserName: "PxPrTest",
                Password: "PX12%09#w",
                NumeroOrden: "1101895503",
                UsuarioIngreso: "PRUEBAEVOL",
                OperacionOrden: "010",

                CodigoVehiculo: "1001119667",

                NumeroCamaras: "0",
                OperacionDispositivo: "C",

                IdentificadorPropietario: Propietario.entityid,
                NombrePropietario: Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre,
                ApellidosPropietario: Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno,
                DireccionPropietario: "GUAYAQUIL",
                ConvencionalPropietario: "43576409",
                CelularPropietario: Propietario.phone,
                EmailPropietario: Propietario.email,

                IdentificadorMonitorea: "43576409",
                NombreMonitorea: "ROLANDO",
                ApellidosMonitorea: "ZAMUDIO DE LA CRUZ",
                DireccionMonitorea: "SURCO",
                ConvencionalMonitorea: "43576409",
                CelularMonitorea: "989046299",
                EmailMonitorea: "rzamud@hunterlojak.com",

            }
            log.debug('PxAdmin', PxAdmin); */

        } catch (e) {
            log.error('Error en beforeLoad', e);
        }
    }
    function padTo2Digits(num) {
        return num.toString().padStart(2, '0');
      }
    function formatDate(date) {
        return [
          padTo2Digits(date.getDate()),
          padTo2Digits(date.getMonth() + 1),
          date.getFullYear(),
        ].join('/');
      }
    function getFechaCobertura(fechaInicial, fechaFinal) {
        try {

            //var dateinicial = new Date(fechaCobertura);
            var coberturaInicial = fechaInicial;
            var coberturaFinal = fechaFinal;
            coberturaFinal.setFullYear(coberturaFinal.getFullYear() + 1)
            return {
                coberturaInicial: coberturaInicial,
                coberturaFinal: coberturaFinal
            };

        } catch (e) {
            log.debug('Error-sysDate', e);
        }

    }
    function getCustomer(id) {
        try {
            var busqueda = search.create({
                type: "customer",
                filters:
                    [
                        ["entityid", "is", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    function getCobertura(id) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_bien", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    function getSolicitaAprobacion(id) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", "11"],
                        "AND",
                        ["custrecord_ht_pp_parametrizacionid", "anyof", id],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", "9"],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    function getAccionProducto(id) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", "2"],
                        "AND",
                        ["custrecord_ht_pp_parametrizacionid", "anyof", id],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", "10"],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    function getTipoTransaccion(id) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", "8"],
                        "AND",
                        ["custrecord_ht_pp_parametrizacionid", "anyof", id],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", "13"],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    function getPeriodosServicio(id) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        ["custrecord_ht_pp_parametrizacion_rela", "anyof", "9"],
                        "AND",
                        ["custrecord_ht_pp_parametrizacionid", "anyof", id],
                        "AND",
                        ["custrecord_ht_pp_parametrizacion_valor", "anyof", "14"],
                        "AND",
                        ["custrecord_ht_pp_aplicacion", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacionid", label: "Param. Prod." })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    return {
        afterSubmit: afterSubmit,
        beforeLoad: beforeLoad
    }
});
/********************************************************************************************************************
TRACKING
/********************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 26/01/2023
Author: Jeferson Mejia
Description: Creación del script.
===================================================================================================================*/