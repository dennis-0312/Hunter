/*******************************************************************************************************************
This script for Reporte de presupuesto (Lista de oc, facturas de compra, nc y pagos) 
/******************************************************************************************************************* 
File Name: TS_UI_REPORTE_RP_Report.js                                                                        
Commit: 02                                                        
Version: 1.0                                                                     
Date: 18/08/2022
ApiVersion: Script 2.1
Enviroment: PR
Governance points: N/A
==================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/redirect',
    'N/log',
    'N/runtime',
    'N/task',
    'N/record',
    'N/config',

],
    (serverWidget, search, redirect, log, runtime, task, record, config,) => {

        const URL_DETALLE_SEARCH = '/app/common/search/searchresults.nl?searchid=' //+####&whence=
        const ID_BUSQUEDA_DETALLE_RESERVADO = 6407 //SB-5200 --- PR-?
        const ID_BUSQUEDA_DETALLE_COMPROMETIDO = 6408 //SB-5200 --- PR-?
        const ID_BUSQUEDA_DETALLE_EJECUTADO = 6409 //SB-5200 --- PR-?
        const ID_BUSQUEDA_ADICION = 6418 //SB-5200 --- PR-?
        const ID_BUSQUEDA_DISMINUCION = 6417 //SB-5200 --- PR-?
        const CLIENT_SCRIPT_FILE_ID = 17198; //SB-603431 - PR-?
        const LOG_RECORD = 'customrecord_co_log_report_ppto'; //CO Log Report PPTO
        const EJECUTADO_SEARCH = 'customsearch_control_ppto_ejecutado';
        let parametros = '';

        class Parametros {
            constructor(fdesde, fhasta, fdesdetxt, fhastatxt, partida, ceco, categoria, cuenta, unidadF, unidadT, eje) {
                this.fdesde = fdesde;
                this.fhasta = fhasta;
                this.fdesdetxt = fdesdetxt;
                this.fhastatxt = fhastatxt;
                this.partida = partida;
                this.ceco = ceco;
                this.categoria = categoria;
                this.cuenta = cuenta;
                this.unidadF = unidadF
                this.unidadT = unidadT;
                this.eje = eje
            }
        }


        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method === 'GET') {
                    let process = 'generatereport'
                    let flag = 0;
                    let vacio = -1;
                    let from = '';
                    let to = '';
                    let budget = '';
                    let costcenter = '';
                    let category = '';
                    let unidadF = '';
                    let account = '';
                    let unidadT = '';
                    let eje = '';
                    // let param1txt = ''
                    let fromtxt = '';
                    let totxt = '';
                    let pageCount = 0;

                    // Config declaration==========================================
                    const userObj = runtime.getCurrentUser();
                    let configRecObj = config.load({ type: config.Type.COMPANY_INFORMATION });
                    const URL = configRecObj.getValue({ fieldId: 'appurl' }); //!https://cuenta.app.netsuite.com
                    let form = serverWidget.createForm({ title: 'Ensamble de Alquiler', hideNavBar: false });
                    form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;
                    //==============================================================
                    let inventorydetailAlquiler = new Array;
                    var inventorydetailSearchObj = search.create({
                        type: "inventorydetail",
                        filters:
                            [
                                ["inventorynumber.quantityavailable", "greaterthanorequalto", "1"],
                                "AND",
                                ["binnumber", "anyof", "15"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "inventorynumber",
                                    sort: search.Sort.ASC,
                                    label: " Number"
                                }),
                                search.createColumn({ name: "item", label: "Item" }),
                                search.createColumn({ name: "binnumber", label: "Bin Number" }),
                                search.createColumn({ name: "status", label: "Status" }),
                                search.createColumn({ name: "quantity", label: "Quantity" }),
                                search.createColumn({ name: "location", label: "Location" }),
                                search.createColumn({
                                    name: "internalid",
                                    join: "binNumber",
                                    label: "Internal ID"
                                })
                            ]
                    });
                    var pageData = inventorydetailSearchObj.runPaged({
                        pageSize: 1000
                    });

                    if (pageData.count != 0) {
                        pageData.pageRanges.forEach(function (pageRange) {
                            page = pageData.fetch({ index: pageRange.index });

                            page.data.forEach(function (result) {
                                var columns = result.columns;
                                let arrayLenth = new Array;
                                arrayLenth[0] = result.getValue(columns[0]);
                                arrayLenth[1] = result.getValue(columns[1]);
                                arrayLenth[2] = result.getValue(columns[2]);
                                arrayLenth[3] = result.getValue(columns[3]);
                                arrayLenth[4] = result.getValue(columns[4]);
                                arrayLenth[5] = result.getValue(columns[5]);
                                arrayLenth[6] = '"' + result.getText(columns[0]) + '"';
                                arrayLenth[7] = '"' + result.getText(columns[2]) + '"';
                                arrayLenth[8] = '"' + result.getText(columns[3]) + '"';
                                inventorydetailAlquiler.push(arrayLenth);

                            });
                        });
                    }

                    var inventorydetailSearchObj = search.create({
                        type: "inventorydetail",
                        filters:
                            [
                                ["inventorynumber.quantityavailable", "greaterthanorequalto", "1"],

                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "inventorynumber",
                                    sort: search.Sort.ASC,
                                    label: " Number"
                                }),
                                search.createColumn({ name: "item", label: "Item" }),
                                search.createColumn({ name: "binnumber", label: "Bin Number" }),
                                search.createColumn({ name: "status", label: "Status" }),
                                search.createColumn({ name: "quantity", label: "Quantity" }),
                                search.createColumn({ name: "location", label: "Location" }),
                                search.createColumn({
                                    name: "internalid",
                                    join: "binNumber",
                                    label: "Internal ID"
                                })
                            ]
                    });
                    var pageDatainven = inventorydetailSearchObj.runPaged({
                        pageSize: 1000
                    });
                    let inventorydetail = new Array;
                    if (pageDatainven.count != 0) {
                        pageDatainven.pageRanges.forEach(function (pageRange) {
                            page = pageDatainven.fetch({
                                index: pageRange.index
                            });

                            page.data.forEach(function (result) {
                                var columns = result.columns;
                                let arrayLenth = new Array;
                                arrayLenth[0] = result.getValue(columns[0]);
                                arrayLenth[1] = result.getValue(columns[1]);
                                arrayLenth[2] = result.getValue(columns[2]);
                                arrayLenth[3] = result.getValue(columns[3]);
                                arrayLenth[4] = result.getValue(columns[4]);
                                arrayLenth[5] = result.getValue(columns[5]);
                                arrayLenth[6] = '"' + result.getText(columns[0]) + '"';
                                arrayLenth[7] = '"' + result.getText(columns[2]) + '"';
                                arrayLenth[8] = '"' + result.getText(columns[3]) + '"';
                                inventorydetail.push(arrayLenth);

                            });
                        });
                    }
                    log.debug(inventorydetail);
                    //*Parameters ======================================================
                    parametros = new Parametros(from, to, fromtxt, totxt, budget, costcenter, category, account, unidadF, unidadT, eje);
                    let pageId = parseInt(scriptContext.request.parameters.page);
                    item = scriptContext.request.parameters.item;


                    form.addFieldGroup({ id: 'groupFilters', label: 'Información principal' });
                    let selectPartida = form.addField({ id: 'custpage_categoria_presupuesto', type: serverWidget.FieldType.TEXT, label: 'CAMPO COLOCAR', container: 'groupFilters' });
                    let pageHTML = '<!DOCTYPE html>'
                    pageHTML += '<html lang="en">'
                    pageHTML += '<head>'
                    pageHTML += '<meta charset="UTF-8">'
                    pageHTML += '<meta http-equiv="X-UA-Compatible" content="IE=edge">'
                    pageHTML += '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
                    pageHTML += '<title>Connect Print</title>'
                    pageHTML += '</head>'
                    pageHTML += '<body>'
                    pageHTML += '<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>'
                    pageHTML += '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>'
                    pageHTML += '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">'

                    pageHTML += '<div class="modal fade" id="myModal" role="dialog">'
                    pageHTML += '<div class="modal-dialog modal-lg">'
                    pageHTML += '<div class="modal-content">'
                    pageHTML += '<div class="modal-header">'
                    pageHTML += '<button type="button" class="close" data-dismiss="modal">&times;</button> <br>'
                    pageHTML += '<form>'
                    pageHTML += '<div class="form-row">'
                    pageHTML += '<div class="col-md-3 mb-4">'
                    pageHTML += '<label >SERIAL/LOT NUMBER</label>'
                    pageHTML += '<select  class="form-control" id="serial">'

                    pageHTML += '</select>'
                    pageHTML += '</div>'
                    pageHTML += '<div class="col-md-3 mb-4">'
                    pageHTML += '<label >BIN</label>'
                    pageHTML += '<input type="text" id="bin" class="form-control" placeholder="BIN" disabled>'
                    pageHTML += '</div>'
                    pageHTML += '<div class="col-md-3 mb-4">'
                    pageHTML += '<label >STATUS</label>'
                    pageHTML += '<input type="text" id="status" class="form-control" placeholder="STATUS" disabled>'
                    pageHTML += '</div>'
                    pageHTML += '<div class="col-md-3 mb-4">'
                    pageHTML += '<label >QUANTITY</label>'
                    pageHTML += '<input type="text" id="quantity" class="form-control" placeholder="QUANTITY" disabled>'
                    pageHTML += '</div>'
                    pageHTML += '</div>'

                    pageHTML += '</form></br>'
                    pageHTML += '</div>'

                    pageHTML += '<div class="modal-footer">'
                    pageHTML += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
                    pageHTML += '</div>'
                    pageHTML += '</div>'
                    pageHTML += '</div>'
                    pageHTML += '</div>'

                    pageHTML += '<script>'
                    pageHTML += 'let inventorydetailAlquiler = new Array;'
                    pageHTML += 'let inventorydetail = new Array;'
                    pageHTML += 'let data = new Array;'
                    pageHTML += 'let itemAc;'
                    pageHTML += 'function modalFunction(item, quantity) {'
                    pageHTML += 'console.log(data);'
                    pageHTML += 'itemAc= item;'
                    pageHTML += 'inventorydetail=[];'
                    pageHTML += 'inventorydetailAlquiler=[];'
                    pageHTML += 'let count = 0;'
                    pageHTML += '$("#myModal").modal();'
                    pageHTML += '$("#serial").find("option").remove();'
                    pageHTML += '$("#status").val(" ");'
                    pageHTML += '$("#bin").val(" ");'
                    pageHTML += '$("#quantity").val(0);'
                    pageHTML += '$("#serial").append($("<option />", {'
                    pageHTML += 'text:" ",'
                    pageHTML += 'value:0,'
                    pageHTML += ' }));'

                    for (let index = 0; index < inventorydetailAlquiler.length; index++) {
                        pageHTML += 'if(' + inventorydetailAlquiler[index][1] + ' == item){'
                        pageHTML += 'inventorydetailAlquiler.push([' + inventorydetailAlquiler[index] + ']);'
                        pageHTML += '$("#serial").append($("<option />", {'
                        pageHTML += 'text:' + inventorydetailAlquiler[index][6] + ','
                        pageHTML += 'value:' + inventorydetailAlquiler[index][0] + ','
                        pageHTML += ' }));'
                        pageHTML += ' count = count+1'
                        pageHTML += '}'

                    }
                    pageHTML += 'if(count==0){'
                    for (let index = 0; index < inventorydetail.length; index++) {
                        pageHTML += 'if(' + inventorydetail[index][1] + ' == item){'
                        pageHTML += 'inventorydetail.push([' + inventorydetail[index] + ']);'
                        pageHTML += '$("#serial").append($("<option />", {'
                        pageHTML += 'text:' + inventorydetail[index][6] + ','
                        pageHTML += 'value:' + inventorydetail[index][0] + ','
                        pageHTML += ' }));'
                        pageHTML += '}'
                    }
                    pageHTML += '}'
                    pageHTML += 'console.log(item);'
                    pageHTML += 'console.log(inventorydetail);'
                    pageHTML += 'for (let index = 0; index < data.length; index++) {'
                    pageHTML += 'if(data[index][0] == item){'
                    pageHTML += '$("#serial").val(data[index][1]);'
                    pageHTML += '$("#status").val(data[index][6]);'
                    pageHTML += '$("#bin").val(data[index][5]);'
                    pageHTML += '$("#quantity").val(data[index][4]);'
                    pageHTML += '}'
                    pageHTML += '}'

                    pageHTML += '}'
                    pageHTML += '$(document).ready(function() {'
                    pageHTML += '$("#btnClean").click(function(){'
                    pageHTML += ' var  rConfig =  JSON.parse( "{}" ) ; '
                    pageHTML += ' rConfig["context"] = "/SuiteScripts/ErickHunter/TS_CS_Alquiler"; '
                    pageHTML += ' var entryPointRequire = require.config(rConfig); '
                    pageHTML += 'entryPointRequire(["/SuiteScripts/ErickHunter/TS_CS_Alquiler"], '
                    pageHTML += ' function(mod){ try{    if (!!window)    {        '
                    pageHTML += '}mod.cancelarFiltros(data);}finally{    '
                    pageHTML += '   if (!!window)    {  '
                    pageHTML += ' }} });'
                    pageHTML += '});'
                    pageHTML += '$("#serial").change(function(){'
                    pageHTML += 'if($("#serial").val()!=" "){'
                    pageHTML += 'let count = 0;'
                    pageHTML += 'let imtesType = 0;'
                    pageHTML += 'let dataarray = new Array;'
                    pageHTML += 'console.log(data);'
                    pageHTML += 'console.log(itemAc);'
                    pageHTML += 'for (let index = 0; index < data.length; index++) {'
                    pageHTML += 'if(data[index][0] == itemAc){'
                    pageHTML += 'count = index+1;'
                    pageHTML += 'console.log(itemAc);'
                    pageHTML += '}'
                    pageHTML += '}'
                    pageHTML += 'if(count!=0 && $("#serial").val() ==0){'
                    pageHTML += 'data.splice(count-1,1)'
                    pageHTML += '}'
                    pageHTML += 'console.log(count);'
                    pageHTML += 'for (let index = 0; index < inventorydetailAlquiler.length; index++) {'
                    pageHTML += 'if(inventorydetailAlquiler[index][0] == $("#serial").val()){'
                    pageHTML += 'dataarray[0] = itemAc;dataarray[1] = inventorydetailAlquiler[index][0];dataarray[2] = inventorydetailAlquiler[index][2];dataarray[3] = inventorydetailAlquiler[index][3];dataarray[4] = inventorydetailAlquiler[index][4];'
                    pageHTML += 'dataarray[5] = inventorydetailAlquiler[index][7];'
                    pageHTML += 'dataarray[6] = inventorydetailAlquiler[index][8];'
                    pageHTML += 'if(count==0){'
                    pageHTML += 'data.push(dataarray);'
                    pageHTML += '}else{'
                    pageHTML += ' data[count-1]=dataarray;'
                    pageHTML += '}'
                    pageHTML += ' imtesType = index;'
                    pageHTML += ' $("#bin").val(inventorydetailAlquiler[index][7]);'
                    pageHTML += ' $("#status").val(inventorydetailAlquiler[index][8]);'
                    pageHTML += ' $("#quantity").val(inventorydetailAlquiler[index][4]);'
                    pageHTML += '}'
                    pageHTML += '}  '
                    pageHTML += 'if(imtesType==0){'
                    pageHTML += 'for (let index = 0; index < inventorydetail.length; index++) {'
                    pageHTML += 'if(inventorydetail[index][0] == $("#serial").val()){'
                    pageHTML += 'console.log(inventorydetail[index]);'
                    pageHTML += 'dataarray[0] = itemAc;dataarray[1] = inventorydetail[index][0];dataarray[2] = inventorydetail[index][2];dataarray[3] = inventorydetail[index][3];dataarray[4] = inventorydetail[index][4];'
                    pageHTML += 'dataarray[5] = inventorydetail[index][7];'
                    pageHTML += 'dataarray[6] = inventorydetail[index][8];'
                    pageHTML += 'if(count==0){'
                    pageHTML += 'data.push(dataarray);'
                    pageHTML += '}else{'
                    pageHTML += ' data[count-1]=dataarray;'
                    pageHTML += '}'
                    pageHTML += ' $("#bin").val(inventorydetail[index][7]);'
                    pageHTML += ' $("#status").val(inventorydetail[index][8]);'
                    pageHTML += ' $("#quantity").val(inventorydetail[index][4]);'
                    pageHTML += '}'
                    pageHTML += '}'
                    pageHTML += '}'
                    pageHTML += '}'
                    pageHTML += '});'
                    pageHTML += '});'
                    pageHTML += '</script>'
                    pageHTML += '</body>'
                    pageHTML += '</html>';
                    let field = form.addField({
                        id: 'custpage_canvas',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' '
                    }).defaultValue = pageHTML;

                    let field_partida_flag = form.addField({ id: 'custpage_categoriappto_flag', type: serverWidget.FieldType.TEXT, label: "PARTIDA FLAG", container: 'groupFilters' });
                    field_partida_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_partida_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_partida_flag.defaultValue = parametros.partida;

                    let field_cuenta_flag = form.addField({ id: 'custpage_cuenta_flag', type: serverWidget.FieldType.TEXT, label: "CUENTA FLAG", container: 'groupFilters' });
                    field_cuenta_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_cuenta_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_cuenta_flag.defaultValue = parametros.cuenta;

                    let field_unidad_funcional_flag = form.addField({ id: 'custpage_unidad_funcional_flag', type: serverWidget.FieldType.TEXT, label: "UNIDAD FUNCIONAL FLAG", container: 'groupFilters' });
                    field_unidad_funcional_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_unidad_funcional_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_unidad_funcional_flag.defaultValue = parametros.unidadT;

                    let field_eje_de_inter_flag = form.addField({ id: 'custpage_eje_de_inter_flag', type: serverWidget.FieldType.TEXT, label: "EJE DE INTERVENCION FLAG", container: 'groupFilters' });
                    field_eje_de_inter_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_eje_de_inter_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_eje_de_inter_flag.defaultValue = parametros.eje;

                    let field_unidad_territorial_flag = form.addField({ id: 'custpage_unidad_territorial_flag', type: serverWidget.FieldType.TEXT, label: "UNIDAD TERRITORIAL FLAG", container: 'groupFilters' });
                    field_unidad_territorial_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_unidad_territorial_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_unidad_territorial_flag.defaultValue = parametros.unidadF;

                    let field_proyecto_flag = form.addField({ id: 'custpage_proyecto_flag', type: serverWidget.FieldType.TEXT, label: "PROYECTO FLAG", container: 'groupFilters' });
                    field_proyecto_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_proyecto_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    field_proyecto_flag.defaultValue = parametros.category;

                    let field_date_filter_from_flag = form.addField({ id: 'custpage_date_filter_from_flag', type: serverWidget.FieldType.TEXT, label: 'FECHA EMISION DESDE FLAG', container: 'groupFilters' });
                    field_date_filter_from_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_date_filter_from_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    let field_date_filter_to_flag = form.addField({ id: 'custpage_date_filter_to_flag', type: serverWidget.FieldType.TEXT, label: 'FECHA EMISION HASTA FLAG', container: 'groupFilters' });
                    field_date_filter_to_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_date_filter_to_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    if (flag == 0) {
                        selectPartida.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });


                    }
                    //?=================================================================================================================================================================================

                    form.addSubtab({ id: 'custpage_main_sub_tab1', label: 'Components', tab: 'custpage_sample_tab1' });
                    form.addSubtab({ id: 'custpage_main_sub_tab2', label: 'Reportes Procesados', tab: 'custpage_sample_tab2' });
                    //!Imaportant ======================================================
                    let field_process_type = form.addField({ id: 'custpage_process_type', type: serverWidget.FieldType.TEXT, label: 'PROCESO', tab: 'custpage_main_sub_tab2' });
                    field_process_type.defaultValue = process;
                    field_process_type.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    field_process_type.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    //!=================================================================
                    //*=================================================================

                    //*Lista Presupuestos ========================================================================================================================================
                    let sublist = form.addSublist({ id: 'sublist', type: serverWidget.SublistType.LIST, label: 'Components', tab: 'custpage_main_sub_tab1' });

                    sublist.addField({ id: 'sublist_field_id', type: serverWidget.FieldType.TEXT, label: 'ID' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    sublist.addField({ id: 'sublist_field_component', type: serverWidget.FieldType.TEXT, label: 'COMPONENT' });
                    sublist.addField({ id: 'sublist_field_quantity', type: serverWidget.FieldType.TEXT, label: 'QUANTITY' });
                    sublist.addField({ id: 'sublist_field_units', type: serverWidget.FieldType.TEXT, label: 'UNITS' });
                    sublist.addField({ id: 'sublist_field_inventory', type: serverWidget.FieldType.TEXT, label: 'INVENTORY DETAIL' });

                    log.error("item", item);
                    if (item) {
                        var bomrevisionSearchObj = search.create({
                            type: "bomrevision",
                            filters:
                                [
                                    ["billofmaterials", "anyof", `${item}`]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "billofmaterials", label: "Bill of Materials" }),
                                    search.createColumn({ name: "name", label: "Name" }),
                                    search.createColumn({ name: "item", join: "component", label: "Item" }),
                                    search.createColumn({ name: "quantity", join: "component", label: "Quantity" }),
                                    search.createColumn({ name: "bomrevision", join: "component", label: "Revision Name" }),
                                    search.createColumn({ name: "units", join: "component", label: "Units" }),
                                    search.createColumn({ name: "custrecord_ht_articulo_alquileractivo", label: "HT Artículo de Alquiler" })
                                ]
                        });
                        var pageData = bomrevisionSearchObj.runPaged({
                            pageSize: 1000
                        });
                        log.error("pageData.count", pageData.count);
                        if (pageData.count != 0) {
                            let count = 0
                            pageData.pageRanges.forEach(function (pageRange) {
                                page = pageData.fetch({
                                    index: pageRange.index
                                });
                                page.data.forEach(function (result) {
                                    var columns = result.columns;
                                    sublist.setSublistValue({ id: 'sublist_field_id', line: count, value: 1 });
                                    sublist.setSublistValue({ id: 'sublist_field_component', line: count, value: '<input class="form-control"  id="item' + columns + '" type="text" placeholder="" value="' + result.getText(columns[2]) + '" readonly>' });
                                    sublist.setSublistValue({ id: 'sublist_field_quantity', line: count, value: '<input class="form-control"  id="quantity' + columns + '" type="number" placeholder="" value="' + result.getValue(columns[3]) + '" >' });
                                    sublist.setSublistValue({ id: 'sublist_field_units', line: count, value: '<input class="form-control"  id="units' + columns + '" type="text" placeholder="" value="' + result.getValue(columns[5]) + '" readonly>' });
                                    sublist.setSublistValue({ id: 'sublist_field_inventory', line: count, value: '<button class="btn btn-dark" onclick="modalFunction(' + result.getValue(columns[2]) + ',' + result.getValue(columns[3]) + ')" id="btn-modal" ><i class="fa fa-folder"></i>Añadir</button>' });
                                    count = count + 1;

                                });
                            });
                        }
                    } else {
                        log.debug('no tiene item');
                    }

                    //*============================================================================================================================================================
                    //log.debug('Prueba Constructor', cate.categoria);
                    //form.addSubmitButton({ label: 'Generar Reporte' });
                    form.addButton({ id: 'btnClean', label: 'Guardar', functionName: 'cancelarFiltros(' + item + ')' });
                    scriptContext.response.writePage(form);
                }
            } catch (error) {
                log.error('Error-onRequest', error);
            }
        }

        return {
            onRequest: onRequest
        }
    });
/*******************************************************************************************************************
TRACKING
/*******************************************************************************************************************
Commit:01
Version: 1.0
Date: 18/08/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==================================================================================================================*/