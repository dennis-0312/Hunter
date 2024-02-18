//https://7451241.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=685&deploy=1 - PR
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define([
    'N/log',
    '../controller/TS_CM_Controller',
    '../error/TS_CM_ErrorMessages',
    '../model/TS_Model_ServiceOrder',
    '../constant/TS_CM_Constant'
], (log, _controller, _error, _serviceOrder, _constant) => {

    const _get = (scriptContext) => {
        return 'Oracle NetSuite Connected - Release 2024.1';
    }

    const _post = (scriptContext) => {
        const start = Date.now();
        log.debug('Request', scriptContext);
        let jsonDetail = new Array();
        let response = '';
        try {
            switch (scriptContext.accion) {
                case 'ordendeservicio':
                    let items_param = scriptContext.items;
                    let T_VBI = false;
                    for (let i in items_param) {
                        let item_id = items_param[i].item;
                        let parametro = _controller.parametrizacion(item_id);
                        for (let j = 0; j < parametro.length; j++) {
                            if (parametro[j][2] == _constant.Codigo_parametro.COD_VBI_VALIDACION_DE_BIEN_INGRESADO && parametro[j][3] == _constant.Codigo_Valor.COD_SI) {
                                T_VBI = true;
                            }
                        }
                    }
                    // log.debug('Parámetro', T_VBI);
                    if (T_VBI == true && scriptContext.bien.length == 0) {
                        response = _error.ErrorMessages.SERVICE_ORDER_VALIDATION.GOOD_HAS_NOT_BEEN_SHIPPED;
                    } else {
                        if (scriptContext.bien.length > 0) {
                            let existsGood = _controller.getGood(scriptContext.bien, scriptContext.cliente);
                            if (existsGood > 0) {
                                const serviceOrder = new ServiceOrder(
                                    scriptContext.cliente,
                                    scriptContext.bien,
                                    scriptContext.fecha,
                                    scriptContext.centroCosto,
                                    scriptContext.clase,
                                    scriptContext.ubicacion,
                                    scriptContext.numeroOperacion,
                                    scriptContext.nota,
                                    scriptContext.representanteVenta,
                                    scriptContext.terminoPago,
                                    scriptContext.emitirFactura,
                                    scriptContext.consideracionTecnica,
                                    scriptContext.ejecutivareferencia,
                                    scriptContext.novedades,
                                    scriptContext.notacliente,
                                    scriptContext.cambioPropietarioConvenio,
                                    scriptContext.canaldistribucion,
                                    scriptContext.servicios,
                                    scriptContext.ejecutivagestion
                                );
                                let items = scriptContext.items;
                                for (let i in items) {
                                    let taxes = _controller.getTaxes(items[i].codigoImpuesto);
                                    let detail = new Detail(
                                        items[i].item,
                                        items[i].nivelPrecio,
                                        taxes.taxcode,
                                        taxes.taxrate,
                                        items[i].cantidad,
                                        items[i].centroCosto,
                                        items[i].clase,
                                        items[i].ubicacion,
                                        items[i].unidad,
                                        items[i].descripcion,
                                        items[i].importe,
                                        items[i].importeBruto,
                                        items[i].monto,
                                        items[i].importeImpuesto,
                                        items[i].clienteNuevo,
                                        items[i].clienteMonitoreo,
                                        items[i].codigoOrigen,
                                        items[i].dispositivoCustodia
                                    );
                                    jsonDetail.push(detail.detail());
                                }
                                log.debug('objHeader', serviceOrder.header());
                                log.debug('objDetail', jsonDetail);
                                response = _controller.createServiceOrder(serviceOrder.header(), jsonDetail);
                            } else {
                                response = _error.ErrorMessages.SERVICE_ORDER_VALIDATION.GOOD_DOES_NOT_EXISTE_OR_DOES_NOT_BELONG_TO_THE_CUSTOMER;
                            }
                        } else {
                            const serviceOrder = new ServiceOrder(
                                scriptContext.cliente,
                                scriptContext.bien,
                                scriptContext.fecha,
                                scriptContext.centroCosto,
                                scriptContext.clase,
                                scriptContext.ubicacion,
                                scriptContext.numeroOperacion,
                                scriptContext.nota,
                                scriptContext.representanteVenta,
                                scriptContext.terminoPago,
                                scriptContext.emitirFactura,
                                scriptContext.consideracionTecnica,
                                scriptContext.ejecutivareferencia,
                                scriptContext.novedades,
                                scriptContext.notacliente,
                                scriptContext.cambioPropietarioConvenio,
                                scriptContext.canaldistribucion,
                                scriptContext.servicios,
                                scriptContext.ejecutivagestion
                            );

                            let items = scriptContext.items;
                            for (let i in items) {
                                let taxes = _controller.getTaxes(items[i].codigoImpuesto);
                                let detail = new Detail(
                                    items[i].item,
                                    items[i].nivelPrecio,
                                    taxes.taxcode,
                                    taxes.taxrate,
                                    items[i].cantidad,
                                    items[i].centroCosto,
                                    items[i].clase,
                                    items[i].ubicacion,
                                    items[i].unidad,
                                    items[i].descripcion,
                                    items[i].importe,
                                    items[i].importeBruto,
                                    items[i].monto,
                                    items[i].importeImpuesto,
                                    items[i].clienteNuevo,
                                    items[i].clienteMonitoreo,
                                    items[i].codigoOrigen,
                                    items[i].dispositivoCustodia
                                );
                                jsonDetail.push(detail.detail());
                            }
                            log.debug('objHeader', serviceOrder.header());
                            log.debug('objDetail', jsonDetail);
                            response = _controller.createServiceOrder(serviceOrder.header(), jsonDetail);
                        }
                    }
                    break;
                case 'factura':
                    log.debug('Enter Invoice', 'Ingresé a factura');
                    if (scriptContext.ordenServicio.length > 0) {
                        let orderS = _controller.getServiceOrder(scriptContext.ordenServicio);
                        if (orderS > 0) {
                            response = _controller.createInvoice(scriptContext.ordenServicio);
                        } else {
                            response = _error.ErrorMessages.INVOICE.DOES_NOT_EXIST_SERVICE_ORDER;
                            log.debug('Enter Invoice', response);
                        }
                    } else {
                        response = _error.ErrorMessages.INVOICE.SERVICE_ORDER_HAS_NOT_BEEN_SHIPPED;
                    }
                    break;
                default:
                    response = _error.ErrorMessages.API_ERROR.DOES_NOT_EXIST_ACTION;
                    break;
            }

            let end = Date.now();
            let time = end - start;

            return {
                'transaction': scriptContext.accion,
                'response': response,
                'time': time
            };

        } catch (error) {
            log.error('Error-POST', error);
            return error.message;
        }
    }

    return {
        get: _get,
        post: _post
    }
});