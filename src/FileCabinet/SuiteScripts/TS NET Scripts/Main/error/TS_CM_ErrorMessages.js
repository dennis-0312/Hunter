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
        }
    };

    return { ErrorMessages }
});
