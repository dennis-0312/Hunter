/**
 * @NApiVersion 2.1
 */
define([
    'N/log',
    'N/record',
    'N/search',
    '../constant/TS_CM_Constant',
    '../../Impulso Plataformas/Controller/TS_ScriptPlataformas_controller'
],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search, _constant, _platformController) => {
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
        const VALOR_001_INST_DISPOSITIVO = 43;
        const VALOR_010_CAMBIO_DE_PROPIETARIO = 10;
        //! FUNCTIONS ====================================================================================================================================================
        const createServiceOrder = (requestHeader, requestDetail) => {
            let objRecord = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
            for (let j in requestHeader) {
                objRecord.setValue({ fieldId: requestHeader[j].field, value: requestHeader[j].value });
            }

            const detail = objRecord.selectNewLine({ sublistId: 'item' });
            for (let k in requestDetail) {
                for (let i in requestDetail[k]) {
                    detail.setCurrentSublistValue({ sublistId: 'item', fieldId: requestDetail[k][i].field, value: requestDetail[k][i].value, ignoreFieldChange: false });
                }
                objRecord.commitLine({ sublistId: 'item' });
            }
            let response = objRecord.save({ ignoreMandatoryFields: true });
            return response;
        }

        const createInvoice = (serviceOrder) => {
            let recTransform = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: serviceOrder,
                toType: record.Type.INVOICE,
                isDynamic: true,
            });

            recTransform.setValue('custbodyts_ec_tipo_documento_fiscal', _constant.Constants.DOCUMENT_TYPE.INVOICE);
            return recTransform.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        const createJournal = (fecha, provision, nota) => {
            const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });

            objRecord.setValue({ fieldId: 'trandate', value: new Date(fecha) });
            //objRecord.setValue({ fieldId: 'currency', value: context.currency });
            objRecord.setValue({ fieldId: 'memo', value: nota });
            objRecord.setValue({ fieldId: 'subsidiary', value: 2 });

            objRecord.selectNewLine({ sublistId: 'line' });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 1237, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: provision, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
            objRecord.commitLine({ sublistId: 'line' });

            objRecord.selectNewLine({ sublistId: 'line' });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 798, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: provision, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
            objRecord.commitLine({ sublistId: 'line' });

            const newJournal = objRecord.save({ ignoreMandatoryFields: false });

            return newJournal
        }

        const createProvisionDetail = (journal, serviceOrder, itemm, cost, inventory, income, amountProvided) => {
            const objRecord = record.create({ type: _constant.Constants.CUSTOM_RECORD.PROVISION_DETAIL, isDynamic: true });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_asiento_provision', value: journal });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_transaccion_prov', value: serviceOrder });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_item', value: itemm });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_cost_account', value: cost });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_inventory_account', value: inventory });
            if (income != 0)
                objRecord.setValue({ fieldId: 'custrecord_ht_dp_income_account', value: income });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_provision', value: amountProvided });
            return objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        const parametros = (parametro, id, type = null) => {
            let response = { status: true, mensaje: '' };
            let currentRecord = id;
            switch (parseInt(parametro)) {
                case CPT_CONFIGURA_PLATAFORMA_TELEMATIC:
                    switch (parseInt(type)) {
                        case VALOR_001_INST_DISPOSITIVO:
                            response = _platformController.envioPXAdminInstall(id);
                            break;
                        case VALOR_010_CAMBIO_DE_PROPIETARIO:
                            response = _platformController.envioCambioPropietario(id);
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
                case CPI_CONTROL_DE_PRODUCTOS_INSTALADOS: //cpi control de productos instalados
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                    let tipoItem;
                    let parametrosRespoitem = _platformController.parametrizacion(item);
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
                                let parametrosRespo = _platformController.parametrizacion(type[i]);
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

        //! QUERIES =======================================================================================================================================================
        const getTaxes = (tax) => {
            let lookUpTaxCode = search.lookupFields({ type: search.Type.SALES_TAX_ITEM, id: tax, columns: ['internalid', 'rate'] });
            let taxcode = lookUpTaxCode.internalid[0].value;
            let taxrate = lookUpTaxCode.rate;
            taxrate = taxrate.replace('%', '');
            return { 'taxcode': taxcode, 'taxrate': taxrate }
        }

        const getGood = (good, customer) => {
            let objSearch = search.load({ id: _constant.Constants.SEARCHS.SEARCH_FOR_GOOD });
            let filters = objSearch.filters;
            const goodFilter = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: good });
            const customerFilter = search.createFilter({ name: 'custrecord_ht_bien_propietario', operator: search.Operator.ANYOF, values: customer });
            filters.push(goodFilter);
            filters.push(customerFilter);
            let resultCount = objSearch.runPaged().count;
            return resultCount;
        }

        const getServiceOrder = (transaction) => {
            let objSearch = search.load({ id: _constant.Constants.SEARCHS.TRANSACTION_SEARCH });
            let filters = objSearch.filters;
            const typeFilter = search.createFilter({ name: 'type', operator: search.Operator.ANYOF, values: 'SalesOrd' });
            const transactionFilter = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: transaction });
            const statusFilter = search.createFilter({ name: 'status', operator: search.Operator.NONEOF, values: ["SalesOrd:C", "SalesOrd:H", "SalesOrd:D", "SalesOrd:G"] });
            const mainlineFilter = search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: 'T' });
            filters.push(typeFilter);
            filters.push(transactionFilter);
            filters.push(statusFilter);
            filters.push(mainlineFilter);
            let resultCount = objSearch.runPaged().count;
            let result = objSearch.run().getRange({ start: 0, end: 100 });
            log.debug('Result', result);
            return resultCount;
        }

        const getCostProvision = (fecha, nota) => {
            let objResults = 0;
            const objTotal = search.load({ id: _constant.Constants.SEARCHS.COST_PROVISION_SEARCH });
            const searchResultCount = objTotal.runPaged().count;
            if (searchResultCount > 0) {
                objResults = objTotal.run().getRange({ start: 0, end: 500 });
                log.debug('objResults', objResults);
                const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
                objRecord.setValue({ fieldId: 'trandate', value: new Date(fecha) });
                objRecord.setValue({ fieldId: 'memo', value: nota });
                objRecord.setValue({ fieldId: 'subsidiary', value: 2 });
                for (let i in objResults) {
                    const location = objResults[i].getValue({ name: "location", summary: "GROUP" });
                    const costAccount = objResults[i].getValue({ name: "custcol_ht_so_cost_account", summary: "GROUP" });
                    const inventoryAccount = objResults[i].getValue({ name: "custcol_ht_so_inventory_account", summary: "GROUP" });
                    const provision = objResults[i].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
                    objRecord.selectNewLine({ sublistId: 'line' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: costAccount, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: provision, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                    objRecord.commitLine({ sublistId: 'line' });

                    objRecord.selectNewLine({ sublistId: 'line' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: inventoryAccount, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: provision, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                    objRecord.commitLine({ sublistId: 'line' });
                }
                objResults = objRecord.save({ ignoreMandatoryFields: false });
            }
            return objResults;
        }

        const getProvisionDetail = () => {
            let json = new Array();
            let searchResult;
            let start = 0;
            let end = 1000;
            let size = 1000;
            //const date = new Date('2023-2-1'); //!Elegir fecha
            const date = new Date();
            const ultimoDia = new Date(date.getFullYear(), date.getMonth(), 0);
            const nota = 'Provisión Abril'
            log.debug('ultimoDiaTimeZona', ultimoDia);
            let journal = getCostProvision(ultimoDia, nota);
            if (journal != 0) {
                const objSearch = search.load({ id: _constant.Constants.SEARCHS.COST_PROVISION_DETAIL_SEARCH });
                const searchResultCount = objSearch.runPaged().count;
                log.debug('Count', searchResultCount);
                let division = searchResultCount / size;
                let laps = Math.round(division);
                if (division > laps) {
                    laps = laps + 1
                }
                for (let i = 1; i <= laps; i++) {
                    if (i != laps) {
                        searchResult = objSearch.run().getRange({ start: start, end: end });
                    } else {
                        searchResult = objSearch.run().getRange({ start: start, end: searchResultCount });
                    }

                    for (let j in searchResult) {
                        const internalid = searchResult[j].getValue({ name: "internalid", summary: "GROUP" });
                        const item = searchResult[j].getValue({ name: "item", summary: "GROUP" });
                        const costAccount = objResults[i].getValue({ name: "custcol_ht_so_cost_account", summary: "GROUP" });
                        const inventoryAccount = objResults[i].getValue({ name: "custcol_ht_so_inventory_account", summary: "GROUP" });
                        const provision = searchResult[j].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
                        json.push([journal, internalid, item, costAccount, inventoryAccount, 0, provision]);
                    }
                    start = start + size;
                    end = end + size;
                }
                return json;
            } else {
                return 0;
            }
        }

        const getAccountPaymentMethod = (paymentMethod) => {
            let mySearch = search.create({
                type: "customrecord_ht_cuentas_nrocuotas",
                filters:
                    [
                        ["custrecord_ht_cc_paymentmethod", "anyof", paymentMethod]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_cc_paymentmethod",
                            summary: "GROUP",
                            label: "Payment Method"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_cc_cuenta",
                            summary: "GROUP",
                            label: "Cuenta"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_cc_cuota",
                            summary: "GROUP",
                            label: "Cuota"
                        })
                    ]
            });
            mySearch.run().each(result => {
                let entity = result.getValue({ name: 'entity' });
                return true;
            });

            /*
            customrecord_ht_cuentas_nrocuotasSearchObj.id="customsearch1688534783904";
            customrecord_ht_cuentas_nrocuotasSearchObj.title="Cuentas y Nro Cuotas Search - DEVELOPER (copy)";
            var newSearchId = customrecord_ht_cuentas_nrocuotasSearchObj.save();
            */
        }

        const getCobertura = (id) => {
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
        }

        const parametrizacion = (items) => {
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
        }


        return {
            createServiceOrder,
            createInvoice,
            createProvisionDetail,
            parametros,
            getTaxes,
            getGood,
            getServiceOrder,
            getProvisionDetail,
            getAccountPaymentMethod,
            getCobertura,
            parametrizacion,
        }

    });
/*
& SCRIPT SE APLICA EN:
^getServiceOrder ===========================================================================================================================================================
^ TS_RS_API_Transactions
^getAccountPaymentMethod ====================================================================================================================================================
^ TS_RS_API_Transactions
*/
