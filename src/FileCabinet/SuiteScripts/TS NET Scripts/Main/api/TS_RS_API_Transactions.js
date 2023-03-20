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

                        const serviceOrder = new ServiceOrder(
                            scriptContext.customerid,
                            scriptContext.bien,
                            scriptContext.date,
                            scriptContext.department,
                            scriptContext.class,
                            scriptContext.location,
                            scriptContext.op,
                            scriptContext.nota,
                            scriptContext.salesrep,
                            scriptContext.terms
                        );

                        let items = scriptContext.items;
                        for (let i in items) {
                            let taxes = _controller.getTaxes(items[i].taxcode);
                            let detail = new Detail(
                                items[i].item,
                                items[i].price,
                                taxes.taxcode,
                                taxes.taxrate,
                                items[i].quantity,
                                items[i].department,
                                items[i].class,
                                items[i].location,
                                items[i].units,
                                items[i].description,
                                items[i].rate,
                                items[i].grossamt,
                                items[i].amount,
                                items[i].tax1amt
                            );
                            jsonDetail.push(detail.detail());
                        }
                        // log.debug('objHeader', servicio.header());
                        // log.debug('objDetail', jsonDetail);
                        //response = _controller.createServiceOrder(serviceOrder.header(), jsonDetail);
                        response = 'Ok!';
                    } else {
                        response = _error.ErrorMessages.SERVICE_ORDER_VALIDATION.GOODS_HAS_NOT_BEEN_SHIPPED;

                    }
                    break;
                // case 'factura':
                //     break;
                default:
                    response = _error.ErrorMessages.API_ERROR.DOES_NOT_EXIST_ACTION;
                    break;
            }

            let end = Date.now();
            let time = end - start;

            return {
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
