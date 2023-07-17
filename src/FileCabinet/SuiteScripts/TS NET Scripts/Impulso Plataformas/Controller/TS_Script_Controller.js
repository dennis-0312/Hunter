/**
 * @NApiVersion 2.1
 */
define(['N/log',
    'N/search',
    'N/record',
    './TS_ScriptPlataformas_controller'
], (log, search, record, _Controller) => {
    const HT_ORDEN_TRABAJO_RECORD = 'customrecord_ht_record_ordentrabajo' //HT Orden de trabajo
    var TIPO_AGRUPACION_PRODUCTO = '77';
    const ESTADO_VENTAS = 7;
    const SI = 9;
    const SCK_SOLICITA_CLIENTE_MONITOREO = 1;
    const PXB_ITEM_SOLICITA_CLIENTE_NUEVO = 72;
    const CPT_CONFIGURA_PLATAFORMA_TELEMATIC = 5;
    const GOT_GENERA_SOLICITUD_DE_TRABAJO = 34;
    const PCD_PIDE_CODIGO_DE_ORIGEN = 53;
    const PIM_PEDIR_INFORMACION_MEDICA = 60;
    const CPI_CONTROL_DE_PRODUCTOS_INSTALADOS = 25;
    const CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS = 21;

    return ({
        getCobertura: (id) => {
            var arrayCobertura = [];
            var busqueda = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_bien", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_co_producto", label: "HT CO PRODUCTO" })//producto de la cobertura
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 100);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    arrayCobertura.push(internalid);
                    return true;
                });
            }
            return arrayCobertura;
        },
        parametrizacion: (items) => {
            let arr = [];
            var busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        search.createFilter({
                            name: 'custrecord_ht_pp_aplicacion',
                            operator: search.Operator.IS,
                            values: true
                        }), search.createFilter({
                            name: 'custrecord_ht_pp_parametrizacionid',
                            operator: search.Operator.ANYOF,
                            values: items
                        })
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Param" }),
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" })
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
                    var parametrizacion = new Array();
                    result.getValue(columns[0]) != null ? parametrizacion[0] = result.getValue(columns[0]) : parametrizacion[0] = '';
                    result.getValue(columns[1]) != null ? parametrizacion[1] = result.getValue(columns[1]) : parametrizacion[1] = '';
                    arr.push(parametrizacion);
                });
            });
            return arr;
        },
        parametros: (parametro, id, type = null) => {
            let response = { status: true, mensaje: '' };
            let currentRecord = id;
            switch (parseInt(parametro)) {
                case CPT_CONFIGURA_PLATAFORMA_TELEMATIC:
                    switch (parseInt(type)) {
                        case 43:
                            response = _Controller.envioPXAdminInstall(id);
                            break;
                        case 10:
                            response = _Controller.envioCambioPropietario(id);
                            break;
                        default:
                            log.debug('accionEstadoOT');
                    }
                    break;
                case GOT_GENERA_SOLICITUD_DE_TRABAJO:
                    if (id.serviceOrder) {
                        let objRecord = record.create({ type: HT_ORDEN_TRABAJO_RECORD });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_servicio', value: id.serviceOrder });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente_id', value: id.customer });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: id.vehiculo });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_item', value: id.item });
                        //objRecord.setValue({ fieldId: 'custrecord_ht_ot_descripcionitem', value: id.displayname });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_estado', value: ESTADO_VENTAS });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_serivicio_txt', value: id.ordenServicio });
                        response = objRecord.save();
                    }
                    break;
                case PXB_ITEM_SOLICITA_CLIENTE_NUEVO:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var item_cliente = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente' });
                    currentRecord.setValue('custbody_es_cambio_de_propietario', true);
                    if (!item_cliente) {
                        response.status = false;
                        response.mensaje = 'Debe Ingresar un Nuevo Propietario.'
                        //response.mensaje = 'Debe Ingresar un Nuevo Propietario para el item: ' + item + '.'
                    }
                    break;
                case SCK_SOLICITA_CLIENTE_MONITOREO:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var item_cliente_monitoreo = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo' });
                    if (!item_cliente_monitoreo) {
                        response.status = false;
                        response.mensaje = 'No existe un Cliente Monitoreo para el item ' + item + '.'
                    }
                    break;
                case PCD_PIDE_CODIGO_DE_ORIGEN:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var item_cliente_monitoreo = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen' });
                    if (!item_cliente_monitoreo) {
                        response.status = false;
                        response.mensaje = 'No existe un Codigo de Origen en el item ' + item + '.'
                    }
                    break;
                case CPI_CONTROL_DE_PRODUCTOS_INSTALADOS://cpi control de productos instalados
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                    let tipoItem;
                    let parametrosRespoitem = _Controller.parametrizacion(item);
                    if (parametrosRespoitem.length != 0) {
                        for (let j = 0; j < parametrosRespoitem.length; j++) {
                            if (parametrosRespoitem[j][0] == TIPO_AGRUPACION_PRODUCTO) {
                                tipoItem = parametrosRespoitem[j][1];

                            }

                        }
                    }
                    if (type != null) {
                        for (let i = 0; i < type.length; i++) {
                            if (type[i] != '') {
                                let parametrosRespo = _Controller.parametrizacion(type[i]);
                                //response = parametrosRespo;
                                if (parametrosRespo.length != 0) {
                                    for (let j = 0; j < parametrosRespo.length; j++) {
                                        if (parametrosRespo[j][0] == TIPO_AGRUPACION_PRODUCTO && parametrosRespo[j][1] != tipoItem) {
                                            response.status = false;
                                            response.mensaje = 'No existe Item instalado con esta parametrizacion del ' + item + '.'
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (type == '') {
                        response.status = false;
                        response.mensaje = 'El bien ingresado no cuenta con dispositivo instalado'
                    }
                    break;
                case PIM_PEDIR_INFORMACION_MEDICA:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var item_ficha_medica = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_fichamedica' });
                    if (!item_ficha_medica) {
                        response.status = false;
                        response.mensaje = 'No existe una Ficha Médica para el item ' + item + '.'
                    }
                    break;
                case CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS:
                    let dispositivoCustodia = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia' });
                    if (dispositivoCustodia.length == 0) {
                        response.status = false;
                        response.mensaje = 'Debe Ingresar La Serie del Dispositivo en Custodia.'
                    }
                default:
                    log.debug('accionEstadoOT');
            }
            return response;
        }
    });
});