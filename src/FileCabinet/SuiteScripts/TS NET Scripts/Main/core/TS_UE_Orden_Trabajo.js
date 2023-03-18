
/*********************************************************************************************************************************************
This script for Sales Order (Se consumira el servicio para consulta de información de NetSuite y generar la orden de trabajo) 
/*********************************************************************************************************************************************
File Name: TS_UE_Orden_Trabajo.js                                                                        
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
define(['N/log', 'N/search', 'N/record', 'N/https', 'N/error'], (log, search, record, https, error) => {
    const HT_DETALLE_ORDEN_SERVICIO = 'customsearch_ht_detalle_orden_servicio'; //HT Detalle Orden de Servicio - PRODUCCION
    const HT_CONSULTA_ORDEN_TRABAJO = 'customsearch_ht_consulta_orden_trabajo'; //HT Consulta Orden de trabajo - PRODUCCION
    const tipo_servicio_alquiler = 1;
    const tipo_servicio_chequeo = 3;
    const tipo_servicio_demo = 4;
    const TIPO_SERVICIO_DESINSTALACION = 5;
    const tipo_devolucion = 6;
    const tipo_garantia = 7;
    const tipo_renovacion_cobertura = 8;
    const tipo_upgrade = 9;
    const TIPO_VENTA = 10;
    const CONVENIO = 12;
    const ESTADO_CHEQUEADA = 2;
    const HABILITAR_LOG_SEGUIMIENTO = 1;
    const HABILITAR_LOG_VALIDACION = 1;

    const beforeSubmit = (context) => {
        if (context.type === context.UserEventType.CREATE) {
            let validate = 1
            if (validate == 1) {
                var myCustomError = error.create({
                    name: 'WRONG_PARAMETER_TYPE',
                    message: 'Wrong parameter type selected.',
                    notifyOff: false
                });
                // This will write 'Error: WRONG_PARAMETER_TYPE Wrong parameter type selected' to the log
                log.error('Error: ' + myCustomError.name, myCustomError.message);
                throw myCustomError;
            }
        }
    }

    const afterSubmit = (context) => {
        if (context.type === context.UserEventType.EDIT) {
            //log.debug('Entré', 'EDIT');
            let objRecord = context.newRecord;
            let id = context.newRecord.id;
            let accionEstadoOT = 'Sin estado';
            const filterIDOT = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: id });
            const filterEstadoChequeada = search.createFilter({ name: 'custrecord_ht_ot_estado', operator: search.Operator.ANYOF, values: ESTADO_CHEQUEADA });
            //const filterEsConvenio = search.createFilter({ name: 'class', join: 'custrecord_ht_id_orden_servicio', operator: search.Operator.ANYOF, values: CLASS_CONVENIO });
            const filterGeneraParamTelematic = search.createFilter({
                name: 'entityid',
                join: 'custrecord_ht_campo_lbl_entidad_telefono', operator: search.Operator.HASKEYWORDS,
                values: true
            });

            try {
                //select para identificar estado de la orden de trabajo
                let objSearch = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO });
                let filters = objSearch.filters;
                filters.push(filterIDOT);
                filters.push(filterEstadoChequeada);
                let estaChequeada = objSearch.runPaged().count;
                //log.debug('Count', estaChequeada);
                if (estaChequeada > 0) {
                    accionEstadoOT = ESTADO_CHEQUEADA;
                }

                switch (accionEstadoOT) {
                    case ESTADO_CHEQUEADA:
                        log.debug('generaParametrización', 'Genera parametrización en las plataformas.');
                        let cobertura = getCobertura();
                        record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: objRecord.getValue('custrecord_ht_ot_orden_servicio'),
                            values: {
                                'custbody_ht_os_trabajado': 'S'
                            }
                        });
                        let json = {
                            bien: objRecord.getValue('custrecord_ht_ot_vehiculo'),
                            propietario: objRecord.getValue('custrecord_ht_ot_cliente_id'),
                            start: cobertura.coberturaInicial,
                            // plazo: objSearch.getValue(''),
                            end: cobertura.coberturaFinal,
                            producto: objRecord.getValue('custrecord_ht_bien_item'),
                            serieproducto: objRecord.getValue('custrecord_ht_ot_serieproductoasignacion')
                        }
                        let results = objSearch.run().getRange({ start: 0, end: 1 });
                        // log.debug('Debug1', 'Estoy chequeada');
                        // log.debug('Res', results);
                        let tipoOrdenServicio = results[0].getValue({ name: "custbody_ht_os_tipoordenservicio", join: "CUSTRECORD_HT_ID_ORDEN_SERVICIO" });
                        //log.debug('tipoOrdenServicio', tipoOrdenServicio);
                        //TODO =====================================================================================================================================================
                        const tipoOS = parseInt(tipoOrdenServicio);      
                        switch (tipoOS) {
                            case TIPO_VENTA:
                                // log.debug('acciónOrdenServicio', 'Genera instalación');
                                // let codigoDispositivo = results[0].getValue({ name: "custrecord_ht_ot_serieproductoasignacion" });

                                // //let esConvenio = results[0].getValue({ name: "formulatext", formula: "CASE WHEN {CUSTRECORD_HT_ID_ORDEN_SERVICIO.class} = 'Venta : Venta Convenio' THEN 'SI' ELSE 'NO' END" });
                                // let esConvenio = results[0].getValue({ name: "formulatext", formula: "DECODE({CUSTRECORD_HT_ID_ORDEN_SERVICIO.custbody_ht_os_tipoordenservicio}, 'Convenio', 'SI','NO')" });
                                // if (codigoDispositivo.length > 0) {
                                //     let objSearch3 = search.load({ id: HT_DETALLE_ORDEN_SERVICIO });
                                //     let filters3 = objSearch3.filters;
                                //     const filterCodigoDispositivo = search.createFilter({ name: 'inventorynumber', join: 'itemnumber', operator: search.Operator.STARTSWITH, values: codigoDispositivo });
                                //     filters3.push(filterCodigoDispositivo);
                                //     filters3.push(filterGeneraParamTelematic);
                                //     let generaParamTelematic = objSearch3.runPaged().count;
                                //     //log.debug('Count2', generaParamTelematic);

                                //     if (generaParamTelematic > 0 && esConvenio == 'SI') {
                                //         log.debug('generaParametrización', 'Genera parametrización en pxadmin - convenio.');
                                //     }

                                //     if (generaParamTelematic > 0 && esConvenio == 'NO') {
                                //         log.debug('generaParametrización', 'Genera parametrización en telematic y pxadmin.');
                                //     }
                                // }









                                break;
                            // case CONVENIO:
                            //     log.debug('acciónOrdenServicio', 'Genera instalación Convenio');
                            //     let codigoDispositivo2 = results[0].getValue({ name: "custrecord_ht_ot_serieproductoasignacion" });

                            //     //let esConvenio = results[0].getValue({ name: "formulatext", formula: "CASE WHEN {CUSTRECORD_HT_ID_ORDEN_SERVICIO.class} = 'Venta : Venta Convenio' THEN 'SI' ELSE 'NO' END" });
                            //     let esConvenio2 = results[0].getValue({ name: "formulatext", formula: "DECODE({CUSTRECORD_HT_ID_ORDEN_SERVICIO.custbody_ht_os_tipoordenservicio}, 'Convenio', 'SI','NO')" });
                            //     if (codigoDispositivo2.length > 0) {
                            //         let objSearch3 = search.load({ id: HT_DETALLE_ORDEN_SERVICIO });
                            //         let filters3 = objSearch3.filters;
                            //         const filterCodigoDispositivo = search.createFilter({ name: 'inventorynumber', join: 'itemnumber', operator: search.Operator.STARTSWITH, values: codigoDispositivo2 });
                            //         filters3.push(filterCodigoDispositivo);
                            //         filters3.push(filterGeneraParamTelematic);
                            //         let generaParamTelematic = objSearch3.runPaged().count;
                            //         //log.debug('Count2', generaParamTelematic);

                            //         if (generaParamTelematic > 0 && esConvenio2 == 'SI') {
                            //             log.debug('generaParametrización', 'Genera parametrización en pxadmin - convenio.');
                            //         }

                            //         if (generaParamTelematic > 0 && esConvenio2 == 'NO') {
                            //             log.debug('generaParametrización', 'Genera parametrización en telematic y pxadmin.');
                            //         }
                            //     }
                            //     break;
                            // case TIPO_SERVICIO_DESINSTALACION:
                            //     log.debug('acciónOrdenServicio', 'Genera desisntalación');
                            //     break;
                            default:
                                //log.debug('tipoOS', `Sorry, we are out of ${tipoOS}.`);
                                break;
                        }
                        break;
                    default:
                        log.debug('accionEstadoOT', `Sorry, we are out of ${accionEstadoOT}.`);
                }


                // function esConvenio(filterIDOT, filterEsConvenio) {
                //     let objSearch2 = search.load({ id: HT_CONSULTA_ORDEN_TRABAJO });
                //     let filters2 = objSearch2.filters;
                //     filters2.push(filterIDOT);
                //     filters2.push(filterEsConvenio);
                //     let esConvenio = objSearch2.runPaged().count;
                //     log.debug('Count-Esconvenio', esConvenio);
                //     if (esConvenio > 0) {
                //         return 1;
                //     } else {
                //         return 0;
                //     }
                // }




                // let results = objSearch.run().getRange({ start: 0, end: 100 });
                // log.debug('Res', results);


                // let myRestletHeaders = new Array();
                // myRestletHeaders['Accept'] = '*/*';
                // myRestletHeaders['Content-Type'] = 'application/json';

                // let myUrlParameters = {
                //     myFirstParameter: 'firstparam',
                //     mySecondParameter: 'secondparam'
                // }

                // let myRestletResponse = https.requestRestlet({
                //     body: 'My Restlet body',
                //     deploymentId: 'customdeploy_ts_rs_integration_plataform',
                //     scriptId: 'customscript_ts_rs_integration_plataform',
                //     headers: myRestletHeaders,
                //     method: 'GET',
                //     urlParams: myUrlParameters
                // });

                // let response = myRestletResponse.body;
                // //log.debug('Debug', response);
            } catch (error) {
                log.error('Error', error);
            }
        }
    }

    //const envioPXAdmin = () => { }

    const envioTelematic = (json) => {
        let myRestletHeaders = new Array();
        myRestletHeaders['Accept'] = '*/*';
        myRestletHeaders['Content-Type'] = 'application/json';

        let myUrlParameters = {
            myFirstParameter: 'firstparam',
            mySecondParameter: 'secondparam'
        }

        let myRestletResponse = https.requestRestlet({
            body: JSON.stringify(json),
            deploymentId: 'customdeploy_ts_rs_integration_plataform',
            scriptId: 'customscript_ts_rs_integration_plataform',
            headers: myRestletHeaders,
        });
        let response = myRestletResponse.body;
        log.debug('Response', response);
    }

    const getCobertura = () => {
        try {
            let date = new Date();
            let day = date.getDate();
            let month = date.getMonth() + 1; // jan = 0
            let year = date.getFullYear();
            month = month <= 9 ? '0' + month : month;
            let coberturaInicial = year + '/' + month + '/' + day;
            let coberturaFinal = (year + 1) + '/' + month + '/' + (day - 1);
            return {
                coberturaInicial: coberturaInicial,
                coberturaFinal: coberturaFinal
            };
        } catch (e) {
            console.log('Error-sysDate', e);
        }

    }

    return {
        //beforeSubmit: beforeSubmit,
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
