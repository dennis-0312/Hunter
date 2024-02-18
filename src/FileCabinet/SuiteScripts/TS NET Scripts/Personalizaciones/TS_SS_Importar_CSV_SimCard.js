/********************************************************************************************************************************************************
This script for Import Deposit
/******************************************************************************************************************************************************** 
File Name: TS_SS_Importar_csv_depositos.js                                                                        
Commit: 01                                                  
Version: 1.1                                                                   
Date: 22/11/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/

/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/record',
    'N/runtime',
    'N/search',
    'N/task',
    'N/file',
    'N/url',
    'N/https',
    '../Main/constant/TS_CM_Constant'
],
    function (record, runtime, search, task, file, url, https, _constant) {

        const DEPOSIT = 'deposit';
        const LOG_RECORD_ID = 'customrecord_excel_conciliacion_gene_log';
        var record_log_id = '';
        var scriptObj = '';
        var arrDepositClean = [];
        var host = '';
        var DATA_CLEAN = '';
        var DATA_CLEAN_1 = ";;;";
        var DATA_CLEAN_2 = ",,,";
        var CADENA_KEY = '||';
        const FORM_DEPOSIT = 131;       // Formulario PE Deposito
        const ID_FOLDER = 1149;          // SB:463,  PR:767  SuiteScripts > TS NET Scripts > TS Importación Depósitos > EVOL File Log Massive Guides
        const ID_FOLDER_2 = 7616;       // SB:7616, PR:768  SuiteScripts > TS NET Scripts > TS Importación Depósitos > EVOL File Array Massive Deposits


        function execute(context) {
            try {
                scriptObj = runtime.getCurrentScript();
                host = url.resolveDomain({ hostType: url.HostType.APPLICATION });

                var deposit_process = scriptObj.getParameter('custscript_json_excel');
                log.debug('deposit_process', deposit_process);
                //var recall = scriptObj.getParameter('custscript_name_file');
                record_log_id = scriptObj.getParameter('custscript_id_record');
                deposit_process = deposit_process.split("\r\n");

                log.debug('deposit_process split', deposit_process);
                log.debug('deposit_process.length', deposit_process.length);
                var separador_lista = scriptObj.getParameter('custscript_separador_csv');
                var fecha_inicial = scriptObj.getParameter('custscript_date_inicial');
                log.debug('fecha_inicial', fecha_inicial);
                fecha_inicial = fecha_inicial + ' 0:00';
                var fecha_final = scriptObj.getParameter('custscript_date_final');
                log.debug('fecha_final', fecha_final);
                fecha_final = fecha_final + ' 23:59';

                //log.debug('parametros', deposit_process + '-' + recall + '-' + record_log_id + '-' + separador_lista + '-'  + fecha_inicial+ fecha_final );
                //DATA_CLEAN = separador_lista == ";" ? DATA_CLEAN_1 : DATA_CLEAN_2;

                //log.debug('deposit_process', deposit_process);

                /* var arrayDeposit = deposit_process.split(/\r\n|\r|\n/);
                if (!recall) {
                    log.debug('no hace rellamado');

                    log.debug('arrayDeposit', arrayDeposit);
                    arrDepositClean = cleanArray(arrayDeposit);
                    log.debug('arrDepositClean', arrDepositClean);
                } else {
                    log.debug('hace rellamado');
                    arrDepositClean = JSON.parse(arrayDeposit);
                    log.debug('arrDepositClean', arrDepositClean);
                } */
                //test = [];
                var token = 'HUNTER' + (Math.random() + 1).toString(36).substring(2);
                log.debug('token', token);
                /* log.debug('fecha_inicial', typeof (fecha_inicial));
                log.debug('fecha_final', typeof (fecha_final)); */
                setToken(fecha_inicial, fecha_final, token);
                log.debug('paso setToken', 'paso setToken');
                var f = new Date();
                var fechaActual = formatDateJson(f);
                log.debug('fechaActual', fechaActual);
                for (var i = 0; i < deposit_process.length - 1; i++) {
                    //log.debug('i', i);
                    //log.debug('separador_lista', separador_lista);
                    //log.debug('deposit_process[i]', deposit_process[i]);
                    var arraycsv = deposit_process[i].split(separador_lista)
                    //log.debug('arraycsv', arraycsv); //["﻿0103230106","345901014465644"]
                    //log.debug('arraycsv', typeof (arraycsv));//object
                    var serie = arraycsv[0];
                    serie = serie.replace('﻿', '');
                    log.debug('obj1 serie', serie)      //	﻿0103230106
                    //log.debug('obj1 type', typeof (serie));//	string
                    var celular = arraycsv[1];
                    log.debug('obj2 celular', celular);//345901014465644
                    //log.debug('obj2 type', typeof (celular));//	string
                    log.debug('i', i);
                    setConciliacion(fecha_inicial, fecha_final, serie, celular, token, fechaActual); //Por algun motivo el "i" aumenta solo
                    log.debug('paso setConciliacion', 'paso setConciliacion');
                    log.debug('i despues setConciliacion', i);
                    log.debug('deposit_process', deposit_process);
                    log.debug('deposit_process.length', deposit_process.length);
                }
                //log.debug('test',test);
                record.submitFields({ type: LOG_RECORD_ID, id: record_log_id, values: { 'custrecord_status_proceso': 'Finalizado' } });
                record.submitFields({ type: LOG_RECORD_ID, id: record_log_id, values: { 'custrecord_generar_proceso': token } });                /*  var content_process_deposit = createDeposit(arrDepositClean, separador_lista, name);
                log.debug('content_process_deposit', content_process_deposit);
                var file_log = contentFileLog(name, content_process_deposit);
                var my_file = file.load({ id: file_log });
                var url_logs = 'https://' + host + my_file.url;
                url_logs = '<a href="' + url_logs + '" target="_blank">Ver</a>'
                setRecord(LOG_RECORD_ID, record_log_id, url_logs, false);
 */
            } catch (e) {
                log.error('Error execute: ' + e);
            }
        }

        function formatDateJson(date) {
            return [

                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()

            ].join('');
        }
        function setConciliacion(fecha_inicial, fecha_final, serie, celular, token, fechaActual) {
            try {
                log.debug('setConciliacion', 'setConciliacion');
                fechaActual = "SH2PX" + fechaActual;
                var busqueda = search.create({
                    type: "customrecord_ht_record_detallesimcard",
                    filters:
                        [
                            ["custrecord_ht_dsc_serie", "is", serie],
                            "AND",
                            ["custrecord_ht_dsc_numerocelsim", "is", celular],
                            "AND",
                            ["created", "within", fecha_inicial, fecha_final],
                            "AND",
                            ["custrecord_ht_dsc_coberdispo.custrecord_ht_co_token", "is", token]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_dsc_coberdispo", label: "HT Cobertura de Dispositivo" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]

                });
                var savedsearch = busqueda.run().getRange(0, 1000);
                log.debug('savedsearch', savedsearch);
                var internalidCobertura = '';
                var internalidConciliacion = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        internalidCobertura = result.getValue(busqueda.columns[0]);
                        log.debug('internalidCobertura', internalidCobertura);
                        record.submitFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: internalidCobertura,
                            values: {
                                custrecord_ht_co_estado_conciliacion: _constant.Status.CONCILIADO
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                        internalidConciliacion = result.getValue(busqueda.columns[1]);
                        log.debug('internalidConciliacion', internalidConciliacion);
                        record.submitFields({
                            type: 'customrecord_ht_record_detallesimcard',
                            id: internalidConciliacion,
                            values: {
                                custrecord_ht_dsc_estado_conciliacion: _constant.Status.CONCILIADO,
                                custrecord_ht_dsc_estado:  _constant.Status.CONFIRMADO
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                        var cobertura = search.lookupFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: internalidCobertura,
                            columns: ['custrecord_ht_co_bien', 'custrecord_ht_co_vid', 'custrecord_ht_co_numeroserieproducto']
                        });
                        var idDispositivo = (cobertura.custrecord_ht_co_numeroserieproducto)[0].value
                        var mant_dispositivo = search.lookupFields({
                            type: 'customrecord_ht_record_mantchaser',
                            id: idDispositivo,
                            columns: ['custrecord_ht_mc_id_telematic', 'custrecord_ht_mc_celularsimcard']
                        });

                        var idSimcard = (mant_dispositivo.custrecord_ht_mc_celularsimcard)[0].value
                        record.submitFields({
                            type: 'customrecord_ht_record_detallechasersim',
                            id: idSimcard,
                            values: {
                                'custrecord_ht_ds_estado': _constant.Status.CORTE //CORTE
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });

                        var telemat = {
                            id: mant_dispositivo.custrecord_ht_mc_id_telematic,
                            active: false
                        }
                        var PxAdmin = {
                            StrToken: fechaActual,
                            UserName: "PxPrTest",
                            Password: "PX12%09#w",
                            NumeroOrden: "1101895503",
                            UsuarioIngreso: "PRUEBAEVOL",
                            OperacionOrden: "002",

                            CodigoVehiculo: (cobertura.custrecord_ht_co_bien)[0].value,
                            NumeroCamaras: "0",
                            Vid: (cobertura.custrecord_ht_co_vid)[0].value,

                            IdProducto: idDispositivo,
                            OperacionDispositivo: "D"
                        }

                        //var Telematic = envioTelematic(telemat);
                        var PXAdminPrueba = envioPXAdmin(PxAdmin);
                        //log.debug('Telematic', Telematic);
                        log.debug('PXAdminPrueba', PXAdminPrueba);
                        return true;
                    });
                }
            } catch (e) {
                log.error('setToken', e);
            }
        }

        function setToken(fecha_inicial, fecha_final, token) {
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_record_detallesimcard",
                    filters:
                        [
                            ["created", "within", fecha_inicial, fecha_final],
                            "AND",
                            ["custrecord_ht_dsc_coberdispo.custrecord_ht_co_token", "is", ""],
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_dsc_coberdispo", label: "HT Cobertura de Dispositivo" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "custrecord_ht_co_numeroserieproducto", join: "CUSTRECORD_HT_DSC_COBERDISPO", label: "Número serie Producto" })
                        ]
                });
                var savedsearch = busqueda.run().getRange(0, 1000);
                log.debug('setToken savedsearch', savedsearch);
                var internalidCobertura = '';
                var internalidConciliacion = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        var cod_opera = Operadora(result.getValue(busqueda.columns[2]));
                        if (cod_opera == _constant.Constants.MOVISTAR || cod_opera == _constant.Constants.CLARO) {
                            internalidCobertura = result.getValue(busqueda.columns[0]);
                            log.debug('setToken internalidCobertura', internalidCobertura);
                            record.submitFields({
                                type: 'customrecord_ht_co_cobertura',
                                id: internalidCobertura,
                                values: {
                                    custrecord_ht_co_token: token
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                            internalidConciliacion = result.getValue(busqueda.columns[1]);
                            log.debug('setToken internalidConciliacion', internalidConciliacion);
                            record.submitFields({
                                type: 'customrecord_ht_record_detallesimcard',
                                id: internalidConciliacion,
                                values: {
                                    custrecord_ht_dsc_token: token
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                        return true;
                    });
                }
            } catch (e) {
                log.error('setToken', e);
            }
        }

        function Operadora(id) {
            try {
                var busqueda = search.create({
                    type: "customrecord_ht_record_mantchaser",
                    filters:
                        [
                            ["internalid", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_cs_operadora_codigo", join: "CUSTRECORD_HT_MC_OPERADORA", label: "Codigo" })
                        ]

                });
                var savedsearch = busqueda.run().getRange(0, 1000);
                log.debug('setToken savedsearch', savedsearch);
                var internalidCobertura = '';
                if (savedsearch.length > 0) {
                    busqueda.run().each(function (result) {
                        internalidCobertura = result.getValue(busqueda.columns[0]);
                    });
                }
                return internalidCobertura;
            } catch (e) {
                log.error('Operadora', e);
            }
        }

        function envioPXAdmin(json) {
            var myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            var myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ns_rs_px_services',
                scriptId: 'customscript_ns_rs_px_services',
                headers: myRestletHeaders,
            });
            var response = myRestletResponse.body;
            return response;
        }
        function envioTelematic(json) {
            var myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';

            var myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ns_rs_update_device',
                scriptId: 'customscript_ns_rs_update_device',
                headers: myRestletHeaders,
            });
            var response = myRestletResponse.body;
            return response;
        }
        return {
            execute: execute
        }
    });