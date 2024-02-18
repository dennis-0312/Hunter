/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/record', 'N/currentRecord', 'N/transaction', 'N/https', 'N/search', '../../Impulso Plataformas/Controller/TS_Script_Controller'],
    (url, record, currentRecord, transaction, https, search, _Controller) => {
        var ENVIO_PLATAFORMAS = '36';
        var TIPO_TRANSACCION = '2';
        var CAMBIO_PROPIETARIO_COBERTURA = '24';
        var TIPO_AGRUPACION_PRODUCTO = '77';
        const pageInit = (scriptContext) => {
            alert('hola mundo'); //!Importante, no borrar.
        }

        const aprobarVenta = (idRecord, htClient, bien, fechaInicial, monitoreo) => {
            //const aprobarVenta = (objRecord) => {
            //try {
            //console.log('objRecord',objRecord);
            var f = new Date();
            let parametro = 0;
            let parametrocambpropcobertura = 0;
            var valor_tipo_agrupacion = 0;
            var fechaActual = formatDateJson(f);
            fechaActual = "SH2PX" + fechaActual;
            console.log('fechaInicial', fechaInicial);
            var fechainialtest = new Date(fechaInicial);
            var fechafinaltest = new Date(fechaInicial);
            fechafinaltest = fechafinaltest.setMonth(fechafinaltest.getMonth() + 12);
            fechafinaltest = new Date(fechafinaltest);
            console.log('fechainialtest', fechainialtest);
            console.log('fechafinaltest', fechafinaltest);
            var fechaInicialSplit = fechaInicial.split('/');
            var fechaInicialTelematic = fechaInicialSplit[2] + '-' + fechaInicialSplit[1] + '-' + fechaInicialSplit[0] + 'T00:00';
            //var fechaFinalSplit = fechaFinal.split('/');
            //var fechaFinalTelematic = fechaFinalSplit[2] + '-' + fechaFinalSplit[1] + '-' + fechaFinalSplit[0] + 'T00:00';
            let objRecord_salesorder = record.load({ type: 'salesorder', id: idRecord, isDynamic: true });
            let numLines = objRecord_salesorder.getLineCount({ sublistId: 'item' });
            let parametrosRespo;

            let returEjerepo = false;

            for (let i = 0; i < numLines; i++) {
                objRecord_salesorder.selectLine({
                    sublistId: 'item',
                    line: i
                });

                let items = objRecord_salesorder.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                parametrosRespo = _Controller.parametrizacion(items);
                console.log(parametrosRespo);
                if (parametrosRespo.length != 0) {
                    for (let j = 0; j < parametrosRespo.length; j++) {
                        if (parametrosRespo[j][0] == TIPO_TRANSACCION) {
                            parametro = parametrosRespo[j][1];
                        }
                        if (parametrosRespo[j][0] == CAMBIO_PROPIETARIO_COBERTURA) {
                            parametrocambpropcobertura = parametrosRespo[j][1];
                        }
                        if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                            valor_tipo_agrupacion = parametrosRespo[j][1];
                        }

                    }
                }
            }

            if (parametrocambpropcobertura == '18') {
                console.log('parametrocambpropcobertura');
                record.submitFields({
                    type: 'salesorder',
                    id: idRecord,
                    values: { 'custbody_ht_os_aprobacionventa': 1 },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });

                transaction.void({
                    type: transaction.Type.SALES_ORDER, //disable Void Transactions Using Reversing Journals in Account Pref
                    id: idRecord
                });

                location.reload();
            } else {
                if (parametro != 0) {
                    console.log('entra plataformas');
                    for (let j = 0; j < parametrosRespo.length; j++) {
                        if (parametrosRespo[j][0] == ENVIO_PLATAFORMAS && parametro == '9') {
                            returEjerepo = _Controller.parametros(ENVIO_PLATAFORMAS, idRecord, parametro);


                        }
                    }
                    console.log('returEjerepo', returEjerepo);

                    if (returEjerepo == false) {
                        let busqueda_cobertura = getCoberturaItem(bien);
                        log.debug('busqueda_cobertura', busqueda_cobertura);
                        if (busqueda_cobertura.length != 0) {
                            for (let i = 0; i < busqueda_cobertura.length; i++) {

                                let parametrosRespo = _controllerParm.parametrizacion(busqueda_cobertura[i][0]);
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

                                    }
                                }
                            }
                        }
                        console.log('monitoreo', monitoreo);
                        console.log('htClient', htClient);
                        console.log('bien', bien);

                        record.submitFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: idCoberturaItem,
                            values: {
                                'custrecord_ht_co_clientemonitoreo': monitoreo,
                                'custrecord_ht_co_propietario': htClient
                            },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });

                        record.submitFields({
                            type: 'customrecord_ht_record_bienes',
                            id: bien,
                            values: { 'custrecord_ht_bien_propietario': htClient },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        record.submitFields({
                            type: 'salesorder',
                            id: idRecord,
                            values: { 'custbody_ht_os_aprobacionventa': 1, 'orderstatus': 'B' },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        console.log('despues');
                        transaction.void({
                            type: transaction.Type.SALES_ORDER, //disable Void Transactions Using Reversing Journals in Account Pref
                            id: idRecord
                        });

                    }
                    location.reload();
                }
            }
        }

        function padTo2Digits(num) {
            return num.toString().padStart(2, '0');
        }
        function formatDateJson(date) {
            return [

                date.getFullYear(),
                padTo2Digits(date.getMonth() + 1),
                padTo2Digits(date.getDate())

            ].join('');
        }
        function formatDateJson(date) {
            return [

                date.getFullYear(),
                padTo2Digits(date.getMonth() + 1),
                padTo2Digits(date.getDate())

            ].join('');
        }
        function getDispositivo(bien) {
            try {
                var arrDispositivoId = new Array();
                var busqueda = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                        [
                            ["custrecord_ht_co_bien", "anyof", bien]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_co_numeroserieproducto", label: "HT CO Número serie Producto" })
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
                        var arrDispositivo = new Array();
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null)
                            arrDispositivo[0] = result.getValue(columns[0]);
                        else
                            arrDispositivo[0] = '';
                        arrDispositivoId.push(arrDispositivo);
                    });
                });
                return arrDispositivoId;
            } catch (e) {
                log.error('Error en getCustomer', e);
            }
        }
        const envioPXAdmin = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let output = url.resolveScript({
                scriptId: 'customscript_ns_rs_px_services',
                deploymentId: 'customdeploy_ns_rs_px_services',
            });
            console.log('output', output);

            let myRestletResponse = https.post({
                url: output,
                body: json,
                headers: myRestletHeaders
            });

            let response = myRestletResponse.body;
            return response;
        }
        function getCobertura(id) {
            try {
                var arrInternalid = []
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
                var internalid = [];
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        internalid = result.getValue(busqueda.columns[0]);
                        arrInternalid.push(internalid)
                        return true;
                    });
                }
                return arrInternalid;
            } catch (e) {
                log.error('Error en getCustomer', e);
            }
        }
        const envioTelematicCambioFecha = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let output = url.resolveScript({
                scriptId: 'customscript_ns_rs_update_asset',
                deploymentId: 'customdeploy_ns_rs_update_asset',
            });

            let myRestletResponse = https.post({
                url: output,
                body: json,
                headers: myRestletHeaders
            });

            let response = myRestletResponse.body;
            return response;
        }
        const envioTelematicCambioPropietario = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            let output = url.resolveScript({
                scriptId: 'customscript_ns_rs_new_owner',
                deploymentId: 'customdeploy_ns_rs_new_owner',
            });

            let myRestletResponse = https.post({
                url: output,
                body: json,
                headers: myRestletHeaders
            });

            let response = myRestletResponse.body;
            return response;
        }
        return {
            pageInit: pageInit,
            aprobarVenta: aprobarVenta
        };

    });
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 27/06/2022
Author: Jeferson Mejia
Description: Creación del script.
========================================================================================================================================================*/