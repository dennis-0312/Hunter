//https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=884&deploy=1 - SB
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define([
    'N/log',
    '../controller/TS_CM_Controller',
    '../error/TS_CM_ErrorMessages',
    '../model/TS_Model_ServiceOrder'
], (log, _controller, _error, _serviceOrder) => {

    const _get = (scriptContext) => {
        return 'Oracle Netsuite Connected - Release 2023.1';
    }

    const _post = (scriptContext) => {
        const start = Date.now();
        //log.debug('Request', scriptContext);
        let jsonDetail = new Array();
        let response = '';
        try {
            switch (scriptContext.accion) {
                case 'ordendeservicio':
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
                                scriptContext.emitirFactura
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
                                    items[i].importeImpuesto
                                );
                                jsonDetail.push(detail.detail());
                            }
                            // log.debug('objHeader', servicio.header());
                            // log.debug('objDetail', jsonDetail);
                            response = _controller.createServiceOrder(serviceOrder.header(), jsonDetail);
                            //response = 'Ok!';
                        } else {
                            response = _error.ErrorMessages.SERVICE_ORDER_VALIDATION.GOOD_DOES_NOT_EXISTE_OR_DOES_NOT_BELONG_TO_THE_CUSTOMER;
                        }
                    } else {
                        response = _error.ErrorMessages.SERVICE_ORDER_VALIDATION.GOOD_HAS_NOT_BEEN_SHIPPED;
                    }
                    break;
                case 'factura':
                    log.debug('Enter Invoice', 'Ingresé a factura');
                    response = _controller.createInvoice(scriptContext.ordenServicio);
                    break;
                default:
                    response = _error.ErrorMessages.API_ERROR.DOES_NOT_EXIST_ACTION;
                    break;
            }

            let end = Date.now();
            let time = end - start;

            return {
                'transaction':scriptContext.accion, 
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
