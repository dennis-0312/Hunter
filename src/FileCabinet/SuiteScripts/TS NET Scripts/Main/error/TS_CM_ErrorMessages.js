/**
 * @NApiVersion 2.1
 */
define([], () => {

    let ErrorMessages = {
        API_ERROR: {
            DOES_NOT_EXIST_ACTION: 'Acción no definida o no existe.'
        },
        SERVICE_ORDER_VALIDATION: {
            GOOD_HAS_NOT_BEEN_SHIPPED: 'No se ha ingresado un bien.',
            GOOD_DOES_NOT_EXISTE_OR_DOES_NOT_BELONG_TO_THE_CUSTOMER: 'El bien no existe o no pertenece al cliente.'
        },
        INVOICE: {
            SERVICE_ORDER_HAS_NOT_BEEN_SHIPPED: "Orden de servicio no definida.",
            DOES_NOT_EXIST_SERVICE_ORDER: "Orden de servicio no existe o ya está facturada."
        },
        IDENTIFICACION_ORDEN_SERVICIO: 'No se encontró resultados para la identificación de la Orden de Servicio en la función identifyServiceOrder()',
        ITEM_ORDEN_SERVICIO: 'No se encontró el item en la Orden de Servicio en la función getItemOfServiceOrder()'
    };

    return { ErrorMessages }
});
