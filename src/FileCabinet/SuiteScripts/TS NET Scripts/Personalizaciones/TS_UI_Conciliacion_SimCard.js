/********************************************************************************************************************************************************
This script for Import Deposit Massive
/******************************************************************************************************************************************************** 
File Name: TS_UI_Importar_csv_depositos.js                                                                        
Commit: 01                                                  
Version: 1.1                                                                   
Date: 22/11/2022
ApiVersion: Script 2.x
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/

/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/redirect', 'N/task', 'N/search', 'N/file', 'N/url', 'N/record', "N/runtime"],
    function (serverWidget, redirect, task, search, file, url, record, runtime) {

        var ID_RECORD_LOG = 'customrecord_excel_conciliacion_gene_log';
        var taskId= '';
        function onRequest(context) {
            try {

                if (context.request.method === 'GET') {

                    var status = context.request.parameters.status_file;
                    var form = serverWidget.createForm('Carga de CSV Conciliación SIMCARD');

                    /* ---------------------------- INICIO CUERPO FORMULARIO ---------------------------- */
                    form.addField({ id: 'custpage_file', type: 'file', label: 'ARCHIVO CSV' }).isMandatory = true;

                    var fieldFileStatus = form.addField({ id: 'custpage_file_status', type: 'text', label: 'Log Carga Archivo' });
                    fieldFileStatus.defaultValue = status;
                    fieldFileStatus.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                    var fieldSeparador = form.addField({ id: 'custpage_separador_lista', type: 'select', label: 'Separador de Lista' });
                    fieldSeparador.addSelectOption({ value: 1, text: ';' });
                    fieldSeparador.addSelectOption({ value: 2, text: ',' });
                    var fieldDateInicial = form.addField({ id: 'custpage_date_inicial', type: serverWidget.FieldType.DATE, label: 'Desde' }).isMandatory = true;
                    var fieldDateFinal = form.addField({ id: 'custpage_date_final', type: serverWidget.FieldType.DATE, label: 'Hasta' }).isMandatory = true;
                    form.addButton({
                        id: 'custpage_busqueda',
                        label: 'Busqueda Conciliación',
                        functionName: 'busqueda()'
                    });
                    form.clientScriptModulePath = './TS_CS_Busqueda_Conciliacion.js';
                    /* ---------------------------- FIN CUERPO FORMULARIO ---------------------------- */


                    /* ---------------------------- INICIO LISTA LOGS DE ACTUALIZACIÓN ---------------------------- */
                    var sublist1 = form.addSublist({ id: 'sublist1', type: serverWidget.SublistType.LIST, label: 'Log de Generación' });
                    sublist1.addRefreshButton();

                    sublist1.addField({ id: 'list1_field_id', type: serverWidget.FieldType.TEXT, label: 'ID' });
                    sublist1.addField({ id: 'list1_field_employee', type: serverWidget.FieldType.TEXT, label: 'CREADO POR' });
                    sublist1.addField({ id: 'list1_field_datecreated', type: serverWidget.FieldType.TEXT, label: 'FECHA DE CREACION' });
                    sublist1.addField({ id: 'list1_field_name_file', type: serverWidget.FieldType.TEXT, label: 'NOMBRE DE ARCHIVO' });
                    sublist1.addField({ id: 'list1_field_status', type: serverWidget.FieldType.TEXT, label: 'ESTADO' });
                    sublist1.addField({ id: 'list1_field_busqueda', type: serverWidget.FieldType.TEXT, label: 'NOMBRE DE PROCESO' });
                    //sublist1.addField({ id: 'list1_field_deposit_output', type: serverWidget.FieldType.TEXT, label: 'DEPÓSITOS GENERADOS' });
                    /* ---------------------------- FIN LISTA LOGS DE ACTUALIZACIÓN ---------------------------- */
                    var objUser = runtime.getCurrentUser();

                    var varEmployee = search.lookupFields({
                        type: 'employee',
                        id: objUser.id,
                        columns: ['firstname', 'lastname']
                    });
                    var varEmployeeName = varEmployee.firstname + ' ' + varEmployee.lastname;

                    /* ---------------------------- INCIO SET LISTA LOGS DE ACTUALIZACIÓN ---------------------------- */
                    var j = 0;
                    var searchLoad = searchPrintListView();
                    //log.debug('searchLoad', searchLoad.length);

                    searchLoad.run().each(function (result) {
                        var column01 = result.getValue(searchLoad.columns[0]);
                        var column02 = result.getValue(searchLoad.columns[1]);
                        var column03 = result.getValue(searchLoad.columns[2]);
                        var column04 = result.getValue(searchLoad.columns[3]);
                        var column05 = result.getValue(searchLoad.columns[4]);
                        //var column06 = result.getValue(searchLoad.columns[5]);
                        // var column07 = result.getValue(searchLoad.columns[6]) || ' ';

                        sublist1.setSublistValue({ id: 'list1_field_id', line: j, value: column01 });
                        sublist1.setSublistValue({ id: 'list1_field_employee', line: j, value: varEmployeeName });
                        sublist1.setSublistValue({ id: 'list1_field_datecreated', line: j, value: column02 });
                        sublist1.setSublistValue({ id: 'list1_field_name_file', line: j, value: column03 });
                        sublist1.setSublistValue({ id: 'list1_field_status', line: j, value: column04 });
                        sublist1.setSublistValue({ id: 'list1_field_busqueda', line: j, value: column05});
                        // sublist1.setSublistValue({ id: 'list1_field_deposit_output', line: j, value: column07 });
                        j++
                        return true
                    });
                    /* ---------------------------- FIN SET LISTA LOGS DE ACTUALIZACIÓN ---------------------------- */

                    form.addSubmitButton('Cargar CSV');
                    context.response.writePage(form);

                } else {
                    var params = {}
                    var fileObj = context.request.files.custpage_file;
                    var getLinesLog = context.request.files.custpage_lines_log;
                    var param_sep_lista = context.request.parameters.custpage_separador_lista;
                    var param_fecha_inicial = context.request.parameters.custpage_date_inicial;
                    var param_fecha_final = context.request.parameters.custpage_date_final;
                    //log.debug('fileObj', fileObj);
                    log.debug('param_sep_lista', param_sep_lista);
                    var sep_lista = param_sep_lista == 1 ? ";" : ",";
                    log.debug('sep_lista', sep_lista);

                   
                    if (fileObj && fileObj.fileType == 'CSV') {
                        var contentCSV = fileObj.getContents();
                        log.debug('contentCSV', contentCSV);
                        params.status_file = 'Archivo Cargado - Revise el Log de Generación';
                        sendProccessCreateDeposit(contentCSV, fileObj.name, sep_lista, param_fecha_inicial, param_fecha_final);
                    } else {
                        params.status_file = 'El archivo debe tener formato CSV';
                    }
                    params.lines_log = getLinesLog;

                    redirect.toSuitelet({
                        scriptId: 'customscript_ts_ui_conciliacion_simcard',
                        deploymentId: 'customdeploy_ts_ui_conciliacion_simcard',
                        parameters: params
                    });
                }
            } catch (e) {
                log.error('Error-onRequest', e);
            }
        }


        function searchPrintListView() {
            try {
                var createSearch = search.create({
                    type: ID_RECORD_LOG,
                    filters: [["created", "within", "today"]],
                    columns:
                        [
                            "internalid",
                            //"owner",
                            search.createColumn({
                                name: "created",
                                sort: search.Sort.DESC
                            }),
                            "custrecord_id_name_file",
                            //"custrecord_contador_importacion",
                            "custrecord_status_proceso",
                            "custrecord_generar_proceso"
                        ]
                });
                return createSearch;
            } catch (e) {
                log.error('Error-searchPrintListView', e);
            }
        }


        function sendProccessCreateDeposit(_json_deposit, _name_file, _sep_lista, param_fecha_inicial, param_fecha_final) {
            try {
                var arrayDeposit = _json_deposit.split('\n');

                if (arrayDeposit.length != 0) {
                    var idRecLog = createRecordLog(ID_RECORD_LOG, _name_file);

                    _name_file = _name_file.replace('.csv', '.txt');
                    //var idFileCreate = contentFileLog(_name_file);

                    var mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                    mrTask.scriptId = 'customscript_ts_ss_importar_csv_simcard';
                    mrTask.deploymentId = 'customdeploy_ts_ss_importar_csv_simcard';
                    mrTask.params = {
                        'custscript_json_excel': _json_deposit,
                        'custscript_name_file': _name_file,
                        //'custscript_file_status_deposit_massive': idFileCreate,
                        'custscript_date_inicial': param_fecha_inicial,
                        'custscript_date_final': param_fecha_final,
                        'custscript_id_record': idRecLog,
                        'custscript_separador_csv': _sep_lista
                    }
                    
                    mrTask.submit();
                   
                }
            } catch (e) {
                log.error('Error-sendProccessCreateDeposit', e);
            }
        }


        function createRecordLog(logrecodId, _name_file) {
            try {
                var recordlog = record.create({ type: logrecodId });
                recordlog.setValue({ fieldId: 'custrecord_id_name_file', value: _name_file });
                recordlog.setValue({ fieldId: 'custrecord_status_proceso', value: "Procesando..." });
                recordlog.setValue({ fieldId: 'custrecord_generar_proceso', value: "Generando nombre para el Proceso..." });
                var recordLogId = recordlog.save();
                return recordLogId;
            } catch (e) {
                log.error({ title: 'Error-createRecord', details: e });
            }
        }


        return {
            onRequest: onRequest
        }
    });

/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 22/11/2022
Author: Jean Ñique
Description: Creación del script.
========================================================================================================================================================*/