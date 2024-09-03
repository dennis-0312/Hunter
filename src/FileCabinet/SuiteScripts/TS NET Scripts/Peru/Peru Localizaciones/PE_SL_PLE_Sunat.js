/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

// this creates a Suitelet form that lets you write and send an email
define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/redirect', 'N/task', 'N/log', './PE_LIB_Libros.js'],
    function (ui, email, runtime, search, redirect, task, log, libPe) {
        function onRequest(context) {
            // log.debug({ title: 'context', details: 'Ejecutando' });
            try {
                var fileCabinetId = libPe.callFolder();//363->1597-->998
                if (context.request.method === 'GET') {
                    try {
                        var pageId = parseInt(context.request.parameters.custscript_pe_paginacion_form);
                        if (pageId = '') {
                            pageId = 0;
                        }

                        var featureSubsidiary = runtime.isFeatureInEffect({
                            feature: "SUBSIDIARIES"
                        });

                        var form = ui.createForm({
                            title: 'Generador Libros Electrónicos - SUNAT '
                        });
                        //
                        form.clientScriptModulePath = "./PE_CS_PLE_Sunat.js";
                        var field_reporte = form.addField({
                            id: 'field_reporte',
                            type: ui.FieldType.SELECT,
                            source: 'customrecord_pe_electronic_books',
                            label: 'Reporte'
                        });
                        field_reporte.layoutType = ui.FieldLayoutType.NORMAL;
                        field_reporte.breakType = ui.FieldBreakType.STARTCOL;
                        field_reporte.isMandatory = true;

                        // var field_subsidiary = form.addField({
                        //     id: 'field_subsidiary',
                        //     type: ui.FieldType.SELECT,
                        //     source: 'subsidiary',
                        //     label: 'Subsidiaria'
                        // });
                        // field_subsidiary.layoutType = ui.FieldLayoutType.NORMAL;
                        // field_subsidiary.isMandatory = true;

                        if (featureSubsidiary || featureSubsidiary == 'T') {
                            var field_subsidiary = form.addField({
                                id: 'field_subsidiary',
                                type: ui.FieldType.SELECT,
                                label: 'Subsidiaria'
                            });

                            var myFilter = search.createFilter({
                                name: 'country',
                                operator: search.Operator.IS,
                                values: 'PE'
                            });
                            var mySearchSubs = search.create({
                                type: search.Type.SUBSIDIARY,
                                columns: ['internalId', 'name'],
                                filters: myFilter
                            });

                            mySearchSubs.run().each(function (result) {
                                var subId = result.getValue({
                                    name: 'internalId'
                                });
                                var subName = result.getValue({
                                    name: 'name'
                                });
                                field_subsidiary.addSelectOption({
                                    value: subId,
                                    text: subName
                                });
                                return true;
                            });
                        }

                        var field_acc_period = form.addField({
                            id: 'field_acc_period',
                            type: ui.FieldType.SELECT,
                            source: 'accountingperiod',
                            label: 'Periodo Contable'
                        });
                        field_acc_period.layoutType = ui.FieldLayoutType.NORMAL;
                        field_acc_period.isMandatory = true;
                        //Inicio*
                        var field_ano = form.addField({
                            id: 'field_ano',
                            type: ui.FieldType.SELECT,
                            label: 'Año Contable'
                        });

                        var accountingperiodSearchObj = search.create({
                            type: "accountingperiod",
                            filters: [
                                ["isyear", "is", "T"]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "periodname",
                                    sort: search.Sort.ASC,
                                    label: "Nombre"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    label: "ID"
                                })
                            ]
                        });
                        accountingperiodSearchObj.run().each(function (result) {
                            var anoId = result.getValue({
                                name: 'internalId'
                            });
                            var anoName = result.getValue({ name: 'periodname' });
                            anoName = anoName.split(' ');
                            anoName = anoName[1];
                            field_ano.addSelectOption({
                                value: anoName,
                                text: anoName
                            });
                            return true;
                        });

                        //Fin*
                        form.addSubmitButton({
                            label: 'Generar reporte'
                        });

                        /**/
                        var field_format = form.addField({
                            id: 'field_format',
                            type: ui.FieldType.SELECT,
                            label: 'Formato de descarga'
                        });
                        field_format.addSelectOption({
                            value: 'TXT',
                            text: 'Formato Texto'
                        });
                        field_format.addSelectOption({
                            value: 'CSV',
                            text: 'Formato CSV'
                        });

                        field_format.addSelectOption({
                            value: 'PDF',
                            text: 'Formato PDF'
                        });
                        /**/

                        //IMorales 20230829 - Inicio
                        var field_account = form.addField({
                            id: 'field_account',
                            type: ui.FieldType.SELECT,
                            label: 'Cuenta Asociada'
                        });

                        // log.debug('MSK', 'traza 1');
                        var accountSearchObj = search.create({
                            type: "account",
                            filters: [
                                ["number", "startswith", "104"]
                            ],
                            columns:
                                [
                                    search.createColumn({
                                        name: "internalid",
                                        summary: "GROUP",
                                        label: "ID interno"
                                    }),
                                    search.createColumn({
                                        name: "localizedname",
                                        summary: "GROUP",
                                        label: "Nombre localizado"
                                    })
                                ]
                        });

                        // log.debug('MSK', 'traza 2');
                        accountSearchObj.run().each(function (result) {
                            var id = result.getValue(accountSearchObj.columns[0]);
                            var nombre = result.getValue(accountSearchObj.columns[1]);
                            if (id != null && id != '') {
                                field_account.addSelectOption({
                                    value: id,
                                    text: nombre
                                });
                            }
                            return true;
                        });
                        //log.debug('MSK', 'traza 4');


                        //IMorales 20230829 - Fin

                        var field_boletas_rrhh = form.addField({
                            id: 'field_boletas_rrhh',
                            type: ui.FieldType.CHECKBOX,
                            label: 'Incluir Boletas de Venta y Recibos por Honorarios'
                        });

                        var field_incluir_ventas = form.addField({
                            id: 'field_incluir_ventas',
                            type: ui.FieldType.CHECKBOX,
                            label: 'TTG considerado en Base Imponible'
                        });

                        field_incluir_ventas.defaultValue = "T";

                        var sublist_reports = form.addSublist({
                            id: 'customsearch_pe_generation_logs_sublist',
                            type: ui.SublistType.STATICLIST,
                            label: 'Log de generacion'
                        });
                        sublist_reports.addRefreshButton();
                        var internalId = sublist_reports.addField({
                            id: 'id',
                            label: 'ID',
                            type: ui.FieldType.TEXT
                        });
                        var user = sublist_reports.addField({
                            id: 'user',
                            label: ' Creado por',
                            type: ui.FieldType.TEXT
                        });
                        var datecreate = sublist_reports.addField({
                            id: 'datecreate',
                            label: 'Fecha de creacion',
                            type: ui.FieldType.TEXT
                        });
                        var subsidiary = sublist_reports.addField({
                            id: 'subsidiary',
                            label: 'Subsidiaria',
                            type: ui.FieldType.TEXT
                        });
                        var period = sublist_reports.addField({
                            id: 'period',
                            label: 'Periodo',
                            type: ui.FieldType.TEXT
                        });
                        var bookReport = sublist_reports.addField({
                            id: 'bookreport',
                            label: 'Libro Contable',
                            type: ui.FieldType.TEXT
                        });
                        var reportname = sublist_reports.addField({
                            id: 'reportname',
                            label: 'Reporte',
                            type: ui.FieldType.TEXT
                        });
                        var link = sublist_reports.addField({
                            id: 'link',
                            label: 'Descargar',
                            type: ui.FieldType.TEXT
                        });

                        var mySearch = search.load({
                            id: 'customsearch_pe_generation_logs_sublist'
                        });

                        var resultSetPE = mySearch.run(); //.getRange({start: pageId*10,end: pageId*10+10});
                        var j = 0;
                        resultSetPE.each(function (result) {
                            var txtId = result.getValue(resultSetPE.columns[0]) || '--';
                            var txtUsuario = result.getText(resultSetPE.columns[1]) || '--';
                            var txtDate = result.getValue(resultSetPE.columns[2]) || '--';
                            var txtSubsidi = result.getText(resultSetPE.columns[3]) || '--';
                            //txtSubsidi = txtSubsidi == ''?' ':txtSubsidi;
                            //log.debug({ title: 'txtSubsidi', details: txtSubsidi });
                            var txtPeriod = result.getText(resultSetPE.columns[4]) || '--';
                            //txtPeriod = txtPeriod == ''?' ':txtPeriod;
                            var txtReport = result.getValue(resultSetPE.columns[5]) || '--';
                            var txtStatus = result.getValue(resultSetPE.columns[6]) || '--';
                            var txtFileLog = result.getValue(resultSetPE.columns[7]) || '--';
                            var txtBookLog = result.getValue(resultSetPE.columns[8]) || '--';
                            sublist_reports.setSublistValue({
                                id: 'id',
                                line: j,
                                value: txtId
                            });
                            sublist_reports.setSublistValue({
                                id: 'user',
                                line: j,
                                value: txtUsuario
                            });
                            sublist_reports.setSublistValue({
                                id: 'datecreate',
                                line: j,
                                value: txtDate
                            });
                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                sublist_reports.setSublistValue({
                                    id: 'subsidiary',
                                    line: j,
                                    value: txtSubsidi
                                });
                            }
                            sublist_reports.setSublistValue({
                                id: 'period',
                                line: j,
                                value: txtPeriod
                            });
                            sublist_reports.setSublistValue({
                                id: 'bookreport',
                                line: j,
                                value: txtBookLog
                            });
                            sublist_reports.setSublistValue({
                                id: 'reportname',
                                line: j,
                                value: txtReport
                            });
                            if (txtStatus != 'Generated') {
                                sublist_reports.setSublistValue({
                                    id: 'link',
                                    line: j,
                                    value: txtStatus //txtLink
                                });
                            } else {
                                sublist_reports.setSublistValue({
                                    id: 'link',
                                    line: j,
                                    value: "<a target='_blank' download href='" + txtFileLog + "'>Descargar</a>" //txtLink
                                });
                            }
                            j++;
                            return true;
                        });
                        context.response.writePage(form);

                    } catch (e) {
                        log.error({ title: 'Error', details: e });
                    }

                } else {
                    var request = context.request.parameters;
                    var selectSubs = context.request.parameters.field_subsidiary;
                    var selectRepo = context.request.parameters.field_reporte;
                    var selectPeri = context.request.parameters.field_acc_period;
                    var selectForm = context.request.parameters.field_format;
                    var selectano = context.request.parameters.field_ano;
                    var selectCheck = context.request.parameters.field_boletas_rrhh;
                    var selectCheckVentas = context.request.parameters.field_incluir_ventas;
                    //log.debug({ title: 'request', details: selectano });

                    var selectCuentaAsociada = context.request.parameters.field_account;

                    var paramsJson = {};

                    paramsJson['recordID'] = 0;
                    paramsJson['reportID'] = selectRepo;
                    paramsJson['subsidiary'] = selectSubs;
                    paramsJson['periodCon'] = selectPeri;
                    paramsJson['anioCon'] = selectano;
                    paramsJson['format'] = selectForm;

                    // if (selectRepo == 1) {
                    //     var scriptTask = task.create({
                    //         taskType: task.TaskType.SCHEDULED_SCRIPT,
                    //         scriptId: 'customscript_pe_schedule_ple_14',
                    //         deploymentId: 'customdeploy_pe_schedule_ple_14',
                    //         params: {
                    //             custscript_pe_subsidiary_ple_14: selectSubs,
                    //             custscript_pe_period_ple_14: selectPeri,
                    //             custscript_pe_page_ple_14: 0,
                    //             custscript_pe_page2_ple_14: 0,
                    //             custscript_pe_archivos_gen_ple_14: '',
                    //             custscript_pe_formato_ple_14: selectForm,
                    //             custscript_pe_incluir_ple_14: selectCheckVentas
                    //         }
                    //     });
                    //     var scriptTaskId = scriptTask.submit();
                    // }
                    // if (selectRepo == 3) {
                    //     var scriptTask = task.create({
                    //         taskType: task.TaskType.MAP_REDUCE,
                    //         scriptId: 'customscript_libro_diario_map_reduce',
                    //         deploymentId: 'customdeploy_libro_diario_map_reduce',
                    //         params: {
                    //             custscript_subsi_diario_mprd: selectSubs,
                    //             custscript_period_diario_mprd: selectPeri,
                    //             custscript_format_diario_mprd: selectForm,
                    //             custscript_ini_diario_mprd: 0
                    //         }
                    //     });
                    //     var scriptTaskId = scriptTask.submit();

                    //     var scriptTask2 = task.create({
                    //         taskType: task.TaskType.SCHEDULED_SCRIPT,
                    //         scriptId: 'customscript_pe_schedule_ple_5_3_cuentas',
                    //         deploymentId: 'customdeploy_pe_schedule_ple_5_3_cuentas',
                    //         params: {
                    //             custscript_pe_subsidiary_ple_5_3: selectSubs,
                    //             custscript_pe_period_ple_5_3: selectPeri,
                    //             custscript_pe_format_ple_5_3: selectForm
                    //             //custscript_pe_archivos_gen_ple_8_1: ''
                    //         }
                    //     });
                    //     var scriptTaskId2 = scriptTask2.submit();

                    // }
                    if (selectRepo == 4) {
                        //3.3 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 12 CUENTAS POR COBRAR COMERCIALES – TERCEROS Y 13 CUENTAS POR COBRAR COMERCIALES – RELACIONADAS
                        //Anual: Inv. Balance - Detalle 12
                        try {
                            if (selectForm == 'PDF') {
                                var parametrosJson = {};

                                parametrosJson['recordID'] = 10;
                                parametrosJson['reportID'] = selectRepo;
                                parametrosJson['subsidiary'] = selectSubs;
                                parametrosJson['periodCon'] = selectPeri;
                                parametrosJson['anioCon'] = selectano;
                                try {
                                    var scriptTask = task.create({
                                        taskType: task.TaskType.MAP_REDUCE,
                                        scriptId: 'customscript_pe_mr_formato_3_3',
                                        deploymentId: 'customdeploy_pe_mr_formato_3_3',
                                        params: {
                                            custscript_pe_formato_3_3_params: parametrosJson
                                        }
                                    });
                                    scriptTask.submit();

                                } catch (e) {
                                    log.error({ title: 'Error - Formato 3.3', details: e });
                                }
                            }
                            else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_3_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_3_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_3_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_3_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_3_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_3_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_3_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 5) {
                        //3.4 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO  DE LA CUENTA 14 CUENTAS POR COBRAR AL PERSONAL, A LOS ACCIONISTAS (SOCIOS), DIRECTORES Y GERENTES
                        //3.4: Anual: Inv. Balance - Detalle 14
                        try {
                            if (selectForm == 'PDF') {

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_4",
                                    deploymentId: "customdeploy_pe_mr_formato_3_4",
                                    params: {
                                        custscript_pe_formato_3_4_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();

                            } else {

                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_4_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_4_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_4_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_4_invbal_per: 113,
                                        custscript_pe_ss_ple_3_4_invbal_for: 'TXT',
                                        custscript_pe_ss_ple_3_4_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_4_invbal_anio: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 6) {
                        //3.5 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO  DE LA CUENTA 16 CUENTAS POR COBRAR DIVERSAS - TERCEROS O CUENTA 17 - CUENTAS POR COBRAR DIVERSAS - RELACIONADAS
                        //3.5 - Anual: Inv. Balance - Detalle 16
                        try {
                            if (selectForm == 'PDF') {

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_5",
                                    deploymentId: "customdeploy_pe_mr_formato_3_5",
                                    params: {
                                        custscript_pe_formato_3_5_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_5_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_5_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_5_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_5_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_5_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_5_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_5_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 7) {
                        //3.6 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 19 ESTIMACIÓN DE CUENTAS DE COBRANZA DUDOSA
                        //Anual: Inv. Balance - Detalle 19
                        try {
                            if (selectForm == 'PDF') {

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_6",
                                    deploymentId: "customdeploy_pe_mr_formato_3_6",
                                    params: {
                                        custscript_pe_formato_3_6_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_6_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_6_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_6_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_6_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_6_invbal_for: 'TXT',
                                        custscript_pe_ss_ple_3_6_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_6_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 8) {
                        //3.7 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 20 - MERCADERIAS Y LA CUENTA 21 - PRODUCTOS TERMINADOS
                        //Anual: Inv. Balance - Detalle 20
                        try {
                            if (selectForm == 'PDF') {

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_7",
                                    deploymentId: "customdeploy_pe_mr_formato_3_7",
                                    params: {
                                        custscript_pe_formato_3_7_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_7_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_7_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_7_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_7_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_7_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_7_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_7_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 62) {
                        //3.8 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 30 INVERSIONES MOBILIARIAS
                        //Anual: Inv. Balance - Detalle 30
                        try {
                            if (selectForm == 'PDF') {
                                /*
                                var parametrosJson = {};
        
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
        
                                var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: "customscript_pe_mr_formato_3_7",
                                deploymentId: "customdeploy_pe_mr_formato_3_7",
                                params: {
                                    custscript_pe_formato_3_7_params: parametrosJson,
                                },
                                });
                                scriptTask.submit();
                                */
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_ts_ss_ple_3_8_invbal',
                                    deploymentId: 'customdeploy_ts_ss_ple_3_8_invbal',
                                    params: {
                                        custscript_ts_ss_ple_3_8_invbal_sub: selectSubs,
                                        custscript_ts_ss_ple_3_8_invbal_per: selectPeri,
                                        custscript_ts_ss_ple_3_8_invbal_for: selectForm,
                                        custscript_ts_ss_ple_3_8_invbal_fol: fileCabinetId,
                                        custscript_ts_ss_ple_3_8_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 10) {
                        //3.9 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 34 - INTANGIBLES
                        //Anual: Inv. Balance - Detalle 34
                        try {
                            log.debug('MSK-10', 'selectRepo = ' + selectRepo)
                            log.debug('MSK-10', 'selectForm = ' + selectForm)
                            if (selectForm == 'PDF') {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                log.debug('MSK-10', 'antes de llamar al mr')
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_9_saldo",
                                    deploymentId: "customdeploy_pe_mr_3_9_saldo",
                                    params: {
                                        custscript_pe_3_9_saldo_params: parametrosJson,
                                    },
                                });
                                log.debug('MSK-10', 'despues de llamar al mr')
                                scriptTask.submit();
                                log.debug('MSK-10', 'despues del submit')
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: "customscript_pe_ss_ple_3_9_invbal",
                                    deploymentId: "customdeploy_pe_ss_ple_3_9_invbal",
                                    params: {
                                        custscript_pe_ss_ple_3_9_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_9_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_9_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_9_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_9_invbal_year: selectano,
                                    },
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: "Error", details: "Error Libro: " + selectRepo + " - " + e });
                        }
                    }
                    // if (selectRepo == 11) {
                    //     var scriptTask = task.create({
                    //         taskType: task.TaskType.MAP_REDUCE,
                    //         scriptId: 'customscript_pe_mprd_ple_10_efectivo',
                    //         deploymentId: 'customdeploy_pe_mprd_ple_10_efectivo',
                    //         params: {
                    //             custscript_pe_ple_10_subsidiary_mprd: selectSubs,
                    //             custscript_pe_ple_10_year_acc_mprd: selectano,
                    //             custscript_pe_ple_10_format_mprd: selectForm
                    //         }
                    //     });
                    //     var scriptTaskId = scriptTask.submit();

                    // }
                    // if (selectRepo == 12) {
                    //     var scriptTask = task.create({
                    //         taskType: task.TaskType.MAP_REDUCE,
                    //         scriptId: 'customscript_pe_mprd_ple_12_cxc_comer',
                    //         deploymentId: 'customdeploy_pe_mprd_ple_12_cxc_comer',
                    //         params: {
                    //             custscript_pe_ple_12_subsidiary_mprd: selectSubs,
                    //             custscript_pe_ple_12_year_acc_mprd: selectano,
                    //             custscript_pe_ple_12_format_mprd: selectForm
                    //         }
                    //     });
                    //     var scriptTaskId = scriptTask.submit();

                    // }
                    if (selectRepo == 13) {
                        //3.12 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 42 CUENTAS POR PAGAR COMERCIALES – TERCEROS Y LA CUENTA 43 CUENTAS POR PAGAR COMERCIALES – RELACIONADAS
                        //Anual: Inv. Balance - Detalle 42
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_12_detproveedores",
                                    deploymentId: "customdeploy_pe_mr_3_12_detproveedores",
                                    params: {
                                        custscript_pe_3_12_detproveedores_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: "customscript_pe_ss_ple_3_12_invbal",
                                    deploymentId: "customdeploy_pe_ss_ple_3_12_invbal",
                                    params: {
                                        custscript_pe_ss_ple_3_12_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_12_invbal_per: 116, // 116 Nov
                                        custscript_pe_ss_ple_3_12_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_12_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_12_invbal_year: selectano,
                                    },
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 14) {
                        //3.13 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 46 CUENTAS POR PAGAR DIVERSAS – TERCEROS Y DE LA CUENTA 47 CUENTAS POR PAGAR DIVERSAS – RELACIONADAS
                        //Anual: Inv. Balance - Detalle 46
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_13_detcxpdivers",
                                    deploymentId: "customdeploy_pe_mr_3_13_detcxpdivers",
                                    params: {
                                        custscript_pe_3_13_detcxpdivers_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_13_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_13_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_13_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_13_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_13_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_13_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_13_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 16) {
                        //3.1 LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE SITUACIÓN FINANCIERA
                        //Anual: Inv. Balance - Estado de Situacion Financiera - 3.1
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_1_inventarios",
                                    deploymentId: "customdeploy_pe_mr_3_1_inventarios",
                                    params: {
                                        custscript_pe_3_1_inventarios_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_1_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_1_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_1_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_1_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_1_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_1_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_1_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 19) {
                        //5.1 LIBRO DIARIO
                        //Mensual: Libro Diario 5.1
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_51librodiario',
                                    deploymentId: 'customdeploy_pe_mr_51librodiario',
                                    params: {
                                        custscript_pe_51librodiario_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_5_1_diario',
                                    deploymentId: 'customdeploy_pe_ss_ple_5_1_diario',
                                    params: {
                                        custscript_pe_ss_ple_5_1_diario_sub: selectSubs,
                                        custscript_pe_ss_ple_5_1_diario_per: selectPeri,
                                        custscript_pe_ss_ple_5_1_diario_for: selectForm,
                                        //custscript_pe_ini_ple_5_1: 0,
                                        custscript_pe_ss_ple_5_1_diario_fol: fileCabinetId
                                    }
                                });
                                log.debug('para1', selectSubs + 'para2' + selectPeri + 'para3' + selectForm + 'para4' + fileCabinetId);
                                scriptTask.submit();
                            }


                        } catch (e) {
                            log.error({ title: 'Error', details: e });
                        }
                    }
                    if (selectRepo == 20) {
                        //Mensual: Libro Mayor 6.1
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_6_1_libro_mayor_pdf',
                                    deploymentId: 'customdeploy_6_1_libro_mayor_pdf',
                                    params: {
                                        custscript_pe_6_1_params_pdf: paramsJson
                                    }
                                });
                                scriptTask.submit();
                                /*
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_61libromayor',
                                    deploymentId: 'customdeploy_pe_mr_61libromayor',
                                    params: {
                                        custscript_pe_61libromayor_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                                */
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_6_1_mayor',
                                    deploymentId: 'customdeploy_pe_ss_ple_6_1_mayor',
                                    params: {
                                        custscript_pe_ss_ple_6_1_mayor_sub: selectSubs,
                                        custscript_pe_ss_ple_6_1_mayor_per: selectPeri,
                                        custscript_pe_ss_ple_6_1_mayor_for: selectForm,
                                        custscript_pe_ss_ple_6_1_mayor_qt: 0,
                                        custscript_pe_ss_ple_6_1_mayor_fol: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }


                        } catch (e) {
                            log.error({ title: 'ErrorLibroMayor6.1', details: e });
                        }
                    }

                    //!LIBRO 8.1 y 8.2
                    if (selectRepo == 22) {
                        try {
                            let data = new Object();
                            data.selectSubsidiary = selectSubs;
                            data.selectPeriod = selectPeri;
                            data.selectFormat = selectForm;

                            let scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: "customscript_pe_ss_ple_8_1_v2",
                                deploymentId: "customdeploy_pe_ss_ple_8_1_v2",
                                params: { custscript_pe_ss_ple_8_1_per_v2: JSON.stringify(data) }
                            });
                            let scriptTaskId = scriptTask.submit();
                            log.debug('scriptTaskId: 8.1', scriptTaskId);

                            let scriptTask2 = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: "customscript_pe_ss_ple_8_2_v2",
                                deploymentId: "customdeploy_pe_ss_ple_8_2_v2",
                                params: { custscript_pe_ss_ple_8_2_per_v2: JSON.stringify(data) }
                            });
                            let scriptTaskId2 = scriptTask2.submit();
                            log.debug('scriptTaskId: 8.2', scriptTaskId2);



                            // var scriptTask = task.create({
                            //     taskType: task.TaskType.SCHEDULED_SCRIPT,
                            //     scriptId: 'customscript_pe_ss_ple_8_1',
                            //     deploymentId: 'customdeploy_pe_ss_ple_8_1',
                            //     params: {
                            //         'custscript_pe_ss_ple_8_1_sub': selectSubs,
                            //         'custscript_pe_ss_ple_8_1_per': selectPeri,
                            //         'custscript_pe_ss_ple_8_1_page': 0,
                            //         'custscript_pe_ss_ple_8_1_file': '',
                            //         'custscript_pe_ss_ple_8_1_for': selectForm,
                            //         'custscript_pe_ss_ple_8_1_inc': selectCheck
                            //     }
                            // });
                            // var scriptTaskId = scriptTask.submit();

                            // var scriptTask2 = task.create({
                            //     taskType: task.TaskType.SCHEDULED_SCRIPT,
                            //     scriptId: 'customscript_pe_ss_ple_82',
                            //     deploymentId: 'customdeploy_pe_ss_ple_82',
                            //     params: {
                            //         custscript_pe_ss_ple_82_sub: selectSubs,
                            //         custscript_pe_ss_ple_82_per: selectPeri,
                            //         custscript_pe_ss_ple_82_for: selectForm,
                            //         custscript_pe_ss_ple_82_fol: fileCabinetId
                            //     }
                            // });
                            // var scriptTaskId2 = scriptTask2.submit();
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 23) {
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_ss_ple_14_1_regventas',
                                deploymentId: 'customdeploy_pe_ss_ple_14_1_regventas',
                                params: {
                                    custscript_pe_ss_ple_14_1_regventas_sub: selectSubs,
                                    custscript_pe_ss_ple_14_1_regventas_per: selectPeri,
                                    custscript_pe_ss_ple_14_1_regventas_for: selectForm,
                                    custscript_pe_ss_ple_14_1_regventas_fol: fileCabinetId
                                }
                            });
                            scriptTask.submit();
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 25) {
                        //1.2 LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE
                        //Mensual: Libro Caja y Banco 1.2 - Detalle de Movimientos Cuenta Corriente
                        try {
                            if (selectForm == 'PDF') {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["cuentaId"] = selectCuentaAsociada;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_1_2",
                                    deploymentId: "customdeploy_pe_mr_formato_1_2",
                                    params: {
                                        custscript_pe_formato_1_2_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_1_2_caja_y_banco',
                                    deploymentId: 'customdeploy_pe_ss_ple_1_2_caja_y_banco',
                                    params: {
                                        custscript_pe_ss_ple_1_2_caja_y_banco_su: selectSubs,
                                        custscript_pe_ss_ple_1_2_caja_y_banco_pe: selectPeri,
                                        custscript_pe_ss_ple_1_2_caja_y_banco_fo: selectForm,
                                        custscript_pe_ss_ple_1_2_caja_y_banco_id: fileCabinetId,
                                        custscript_pe_ss_ple_1_2_caja_y_banco_qt: 0
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 26) {
                        //1.1 LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
                        //Mensual: Libro Caja y Banco 1.1 - Detalle de Movimientos del Efectivo
                        try {
                            if (selectForm == 'PDF') {
                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_1_1",
                                    deploymentId: "customdeploy_pe_mr_formato_1_1",
                                    params: {
                                        custscript_pe_formato_1_1_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();

                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_1_1_caja_y_banco',
                                    deploymentId: 'customdeploy_pe_ss_ple_1_1_caja_y_banco',
                                    params: {
                                        custscript_pe_ss_ple_1_1_caja_y_banco_su: selectSubs,
                                        custscript_pe_ss_ple_1_1_caja_y_banco_pe: selectPeri,
                                        custscript_pe_ss_ple_1_1_caja_y_banco_fo: selectForm,
                                        custscript_pe_ss_ple_1_1_caja_y_banco_id: fileCabinetId,
                                        custscript_pe_ss_ple_1_1_caja_y_banco_qt: 0
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 27) {
                        //5.3 LIBRO DIARIO - DETALLE DEL PLAN CONTABLE UTILIZADO
                        //Mensual: Libro Diario 5.3 - Detalle Plan de Contable Utilizado
                        try {
                            if (selectForm == 'PDF') {
                                log.error("XD", "libro pdf 5.3")
                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_5_3_libro_diario",
                                    deploymentId: "customdeploy_pe_mr_5_3_libro_diario",
                                    params: {
                                        custscript_pe_5_3_librod_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();

                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_5_3_libro_diario',
                                    deploymentId: 'customdeploype_ss_ple_5_3_libro_diario',
                                    params: {
                                        custscript_pe_ss_ple_5_3_libro_diario_sb: selectSubs,
                                        custscript_pe_ss_ple_5_3_libro_diario_fr: selectForm,
                                        custscript_pe_ss_ple_5_3_libro_diario_fl: fileCabinetId,
                                        custscript_pe_ss_ple_5_3_libro_diario_pe: selectPeri
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 28) {
                        //3.2 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 10 EFECTIVO Y EQUIVALENTES DE EFECTIVO
                        //Anual: Inv. Balance - Detalle 10
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_2_inventariosbal",
                                    deploymentId: "customdeploy_pe_mr_3_2_inventariosbal",
                                    params: {
                                        custscript_pe_3_2_inventariosbal_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_2_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_2_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_2_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_2_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_2_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_2_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_2_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 29) {
                        //3.15 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 37 ACTIVO DIFERIDO Y DE LA CUENTA 49 PASIVO DIFERIDO
                        //Anual: Inv. Balance - Detalle 49
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_15_detgandif",
                                    deploymentId: "customdeploy_pe_mr_3_15_detgandif",
                                    params: {
                                        custscript_pe_3_15_detgandif_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_15_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_15_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_15_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_15_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_15_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_15_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_15_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 30) {
                        //3.14 LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 47 - BENEFICIOS SOCIALES DE LOS TRABAJADORES (PCGR) - NO APLICABLE PARA EL PCGE
                        //Anual: Inv. Balance - Detalle 47
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_14_inventariosbalde",
                                    deploymentId: "customdeploy_pe_mr_3_14_inventariosbalde",
                                    params: {
                                        custscript_pe_3_14_inventariosbaldet_par: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_14_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_14_lib_in_y_ba',
                                    params: {
                                        custscript_pe_ss_ple_3_14_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_14_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_14_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_14_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_14_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 31) {
                        //3.20 - Anual: Libro de Inventario y Balances - Estado de resultados
                        //Anual: Libro de Inventario y Balances - Estado de resultados - 3.20
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_320libinvbal',
                                    deploymentId: 'customdeploy_pe_320libinvbal',
                                    params: {
                                        custscript_pe_320libinvbal_params: paramsJson
                                    }
                                });
                                scriptTask.submit();

                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_20_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_20_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_20_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_20_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_20_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_20_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_20_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 32) {
                        //3.24 LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE RESULTADOS INTEGRALES
                        //Anual: Libro de Inventario y Balances - Estado de resultados integrales - 3.24
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_24",
                                    deploymentId: "customdeploy_pe_mr_formato_3_24",
                                    params: {
                                        custscript_pe_formato_3_24_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_24_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_24_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_24_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_24_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_24_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_24_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_24_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 33) {
                        //3.25 LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE FLUJOS DE EFECTIVO - MÉTODO INDIRECTO
                        //Anual: Libro de Inventario y Balances - Estado de flujos de efectivo - 3.25
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_25",
                                    deploymentId: "customdeploy_pe_mr_formato_3_25",
                                    params: {
                                        custscript_pe_formato_3_25_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_25_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_3_25_invbal',
                                    params: {
                                        custscript_pe_ss_ple_3_25_lib_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_3_25_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_3_25_invbal_for: selectForm,
                                        custscript_pe_ss_ple_3_25_invbal_fol: fileCabinetId,
                                        custscript_pe_ss_ple_3_25_invbal_yea: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 34) {
                        //13.1 REGISTRO DEL INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO
                        //Anual: Libro de Registro del inventario permanente valorizado -detalle del inventario valorizado - 13.1
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_13_1_inv_val",
                                    deploymentId: "customdeploy_pe_mr_13_1_inv_val",
                                    params: {
                                        custscript_pe_13_1_invval_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_13_1_invbal',
                                    deploymentId: 'customdeploy_pe_ss_ple_13_1_invbal',
                                    params: {
                                        custscript_pe_ss_ple_13_1_invbal_sub: selectSubs,
                                        custscript_pe_ss_ple_13_1_invbal_per: selectPeri,
                                        custscript_pe_ss_ple_13_1_invbal_for: selectForm,
                                        custscript_pe_ss_ple_13_1_invbal_fol: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 35) {
                        //3.17 LIBRO DE INVENTARIOS Y BALANCES - BALANCE DE COMPROBACIÓN
                        //Anual: Libro de Inventario y Balances - Balance de Comprobación- 3.17
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_317libinvbal',
                                    deploymentId: 'customdeploy_pe_317libinvbal',
                                    params: {
                                        custscript_pe_317_libinvbal_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_ss_ple_3_17_invbal',
                                    deploymentId: 'customdeploy_ss_ple_3_17_invbal',
                                    params: {
                                        custscript_ss_ple_3_17_invbal_sub: selectSubs,
                                        custscript_ss_ple_3_17_invbal_per: selectPeri,
                                        custscript_ss_ple_3_17_invbal_for: selectForm,
                                        custscript_ss_ple_3_17_invbal_fol: fileCabinetId,
                                        custscript_ss_ple_3_17_invbal_year: selectano
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 36) {
                        //12.1 REGISTRO DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS - DETALLE DEL INVENTARIO PERMANENTE EN UNIDADES FÍSICAS
                        //Anual: Libro de Registro del inventario permanente - detalle del inventario permanente - 12.1
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_12_1_inv_perm",
                                    deploymentId: "customdeploy_pe_mr_12_1_inv_perm",
                                    params: {
                                        custscript_pe_12_1_invper_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_12_1_lib_in_perm',
                                    deploymentId: 'customdeploy_pe_ss_ple_12_1_lib_in_perm',
                                    params: {
                                        custscript_pe_ss_ple_12_1_lib_in_perm_su: selectSubs,
                                        custscript_pe_ss_ple_12_1_lib_in_perm_pe: selectPeri,
                                        custscript_pe_ss_ple_12_1_lib_in_perm_fo: selectForm,
                                        custscript_pe_ss_ple_12_1_lib_in_perm_fl: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 37) {
                        //9.1 REGISTRO DE CONSIGNACIONES - PARA EL CONSIGNADOR - CONTROL DE BIENES ENTREGADOS EN CONSIGNACIÓN
                        //Anual: Libro de Registro de Consignaciones - Para el Consignador - 9.1
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_9_1_consignador',
                                    deploymentId: 'customdeploy_pe_mr_9_1_consignador',
                                    params: {
                                        custscript_pe_9_1_consignador_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                try {
                                    var scriptTask = task.create({
                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                        scriptId: 'customscript_pe_ss_ple_9_1_registro',
                                        deploymentId: 'customdeploype_sc_ple_9_1',
                                        params: {
                                            custscript_ts_sc_ple_9_1_subsidiary: selectSubs,
                                            custscript__ts_sc_ple_9_1_period: selectPeri,
                                            custscript_ts_sc_ple_9_1_format: selectForm,
                                            custscript_ts_sc_ple_9_1_folderid: fileCabinetId
                                        }
                                    });
                                    log.debug('para1', selectSubs + 'para2' + selectPeri + 'para3' + selectForm + 'para4' + fileCabinetId);
                                    scriptTask.submit();

                                } catch (e) {
                                    log.error({ title: 'Error', details: e });
                                }
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 39) {
                        //9.2 REGISTRO DE CONSIGNACIONES - PARA EL CONSIGNATARIO - CONTROL DE BIENES RECIBIDOS EN CONSIGNACIÓN
                        //Anual: Libro de Registro de Consignaciones - Para el Consignatario - 9.2
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_9_2_consignatario',
                                    deploymentId: 'customdeploy_pe_mr_9_2_consignatario',
                                    params: {
                                        custscript_pe_9_2_consignatario_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                try {
                                    var scriptTask = task.create({
                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                        scriptId: 'customscript_ss_ple_9_2_registro',
                                        deploymentId: 'customdeploy_pe_sc_ple_9_2_registro',
                                        params: {
                                            custscript_ts_sc_ple_9_2_subsidiary: selectSubs,
                                            custscript_ts_sc_ple_9_2_period: selectPeri,
                                            custscript_ts_sc_ple_9_2_format: selectForm,
                                            custscript_ts_sc_ple_9_2_folderid: fileCabinetId
                                        }
                                    });
                                    log.debug('para1', selectSubs + 'para2' + selectPeri + 'para3' + selectForm + 'para4' + fileCabinetId);
                                    scriptTask.submit();

                                } catch (e) {
                                    log.error({ title: 'Error', details: e });
                                }
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 41) {
                        //Mensual: Recibos por Honorarios
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_ss_rxh',
                                deploymentId: 'customdeploy_pe_ss_rxh',
                                params: {
                                    custscript_pe_subsidiary_rpt_rxh: selectSubs,
                                    custscript_pe_period_rpt_rxh: selectPeri,
                                    custscript_pe_format_rpt_rxh: selectForm,
                                    custscript_pe_ini_rpt_rxh: 0,
                                    custscript_pe_filecabinetid_rpt_rxh: fileCabinetId
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'ErrorReporteRxH', details: e });
                        }
                    }

                    if (selectRepo == 43) {
                        //7.1 REGISTRO DE ACTIVOS FIJOS - DETALLE DE LOS ACTIVOS FIJOS REVALUADOS Y NO REVALUADOS
                        //Anual: Registro de Activos Fijos - Detalle de los activos fijos revaluados y no revaluados 7.1
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_71activofijo',
                                    deploymentId: 'customdeploy_pe_mr_71activofijo',
                                    params: {
                                        custscript_pe_mr_71activofijo_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_activofijo_7_1',
                                    deploymentId: 'customdeploy_pe_ss_activofijo_7_1',
                                    params: {
                                        custscript_pe_subsidiary_af7_1: selectSubs,
                                        custscript_pe_period_af7_1: selectPeri,
                                        custscript_pe_format__af7_1: selectForm,
                                        custscript_pe_filecabinetid_af7_1: fileCabinetId,
                                        custscript_pe_anio_af7_1: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 44) {
                        //Mensual: Reporte de Comprobantes de Retencion
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_ss_retenciones',
                                deploymentId: 'customdeploy_pe_ss_retencion',
                                params: {
                                    custscript_pe_subsidiary_retenciones: selectSubs,
                                    custscript_pe_period_retenciones: selectPeri,
                                    custscript_pe_format_retenciones: selectForm,
                                    custscript_pe_ini_retenciones: 0,
                                    custscript_pe_filecabinetid_retenciones: fileCabinetId
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'ErrorRetenciones', details: e });
                        }
                    }

                    // if (selectRepo == 47) {
                    //     //Mensual: Formato 3.2 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 10 - CAJA Y BANCOS
                    //     try {
                    //         var scriptTask = task.create({
                    //             taskType: task.TaskType.SCHEDULED_SCRIPT,
                    //             scriptId: 'customscript_pe_scheduled_formato_3_2',
                    //             deploymentId: 'customdeploy_pe_scheduled_formato_3_2',
                    //             params: {
                    //                 custscript_pe_subsidiary_formato_3_2: selectSubs,
                    //                 custscript_pe_period_formato_3_2: selectPeri,
                    //                 custscript_pe_format_formato_3_2: selectForm,
                    //                 custscript_pe_ini_formato_3_2: 0,
                    //                 custscript_pe_filecabinetid_formato_3_2: fileCabinetId
                    //             }
                    //         });
                    //         scriptTask.submit();

                    //     } catch (e) {
                    //         log.error({ title: 'Error - Formato 3.2', details: e });
                    //     }
                    // }

                    if (selectRepo == 52) {
                        //3.10 LIBRO DE INVENTARIOS Y BALANCES -  DETALLE DEL SALDO DE LA CUENTA 40 - TRIBUTOS POR PAGAR
                        //FORMATO 3.10
                        let parametrosJson = {};

                        parametrosJson["recordID"] = 10;
                        parametrosJson["reportID"] = selectRepo;
                        parametrosJson["subsidiary"] = selectSubs;
                        parametrosJson["periodCon"] = selectPeri;
                        parametrosJson["anioCon"] = selectano;

                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: "customscript_pe_mr_3_10_dettributos",
                                deploymentId: "customdeploy_pe_mr_3_10_dettributos",
                                params: {
                                    custscript_pe_3_10_dettributos_params: parametrosJson,
                                },
                            });
                            scriptTask.submit();
                        } catch (e) {
                            log.error({ title: "Error - Formato 3.10", details: e });
                        }
                    }

                    if (selectRepo == 57) {
                        //3.19 LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE CAMBIOS EN EL PATRIMONIO NETO
                        //FORMATO 3.19
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_319libinvbal',
                                    deploymentId: 'customdeploy_pe_319libinvbal',
                                    params: {
                                        custscript_pe_319libinvbal_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ple_3_19_inventarios_bal',
                                    deploymentId: 'customdeploy_pe_ple_3_19_inventarios_bal',
                                    params: {
                                        custscript_pe_3_19_inventarios: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 59) {
                        //4.1 LIBRO DE RETENCIONES INCISO E) Y F) DEL ART. 34° DE LA LEY DEL IMPUESTO A LA RENTA
                        //FORMATO 4.1
                        log.debug('traza 1', 'selectRepo = ' + selectRepo)
                        log.debug('traza2', 'selectForm = ' + selectForm)
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_41libroretenciones',
                                    deploymentId: 'customdeploy_pe_41libroretenciones',
                                    params: {
                                        custscript_pe_41libroretenciones_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_4_1',
                                    deploymentId: 'customdeploy_pe_schedule_ple_4_1',
                                    params: {
                                        custscriptpe_subsidiary_ple_4_1: selectSubs,
                                        custscript_pe_period_ple_4_1: selectPeri,
                                        custscript_pe_formato_4_1: selectForm,
                                        custscript_pe_filecabinetid_ple_4_1: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }


                        } catch (e) {
                            log.error({ title: 'Error - Formato 4.1', details: e });
                        }
                    }

                    if (selectRepo == 61) {
                        //3.18 LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE FLUJOS DE EFECTIVO - MÉTODO DIRECTO
                        //FORMATO 3.18
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_318libinvbal',
                                    deploymentId: 'customdeploy_pe_318libinvbal',
                                    params: {
                                        custscript_pe_318libinvbal_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ple_3_18_inventarios_bal',
                                    deploymentId: 'customdeploy_pe_ple_3_18_inventarios_bal',
                                    params: {
                                        custscript_pe_3_18_inventarios_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error - Formato 3.18', details: e });
                        }
                    }



                    if (selectRepo == 53) {
                        // FORMATO 3.11 : "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 41"
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_11_detremxpagar",
                                    deploymentId: "customdeploy_pe_mr_3_11_detremxpagar",
                                    params: {
                                        custscript_pe_3_11_detremxpagar_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_ss_ple_3_11_invbal',
                                    deploymentId: 'customdeploy_ple_3_11_inventariobalance',
                                    params: {
                                        custscript_pe_3_11_inventarios_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    // if (selectRepo == 120) {
                    //     //Mensual: Libro de Inventario y Balances - Detalle del Saldo de la Cuenta 34 - 3.9
                    //     try {
                    //         var scriptTask = task.create({
                    //             taskType: task.TaskType.SCHEDULED_SCRIPT,
                    //             scriptId: 'customscript_pe_schedule_invbal3_9',
                    //             deploymentId: 'customdeploy_pe_schedule_invbal3_9',
                    //             params: {
                    //                 custscript_pe_subsidiary_invbal3_9: selectSubs,
                    //                 custscript_pe_period_invbal3_9: selectPeri,
                    //                 custscript_pe_format_invbal3_9: selectForm,
                    //                 custscript_pe_ini_invbal3_9: 0,
                    //                 custscript_pe_filecabinetid_in: fileCabinetId
                    //             }
                    //         });
                    //         scriptTask.submit();

                    //     } catch (e) {
                    //         log.error({ title: 'ErrorInvBal3_9', details: e });
                    //     }
                    // }

                    redirect.toSuitelet({
                        scriptId: 'customscript_pe_sl_ple_sunat',
                        deploymentId: 'customdeploy_pe_sl_ple_sunat',
                        parameters: {}
                    });
                }
            } catch (e) {
                log.error({ title: 'Error', details: e });
            }
        }
        return {
            onRequest: onRequest
        };
    });