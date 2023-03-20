/*=======================================================================================================================================================
This script for resources (Script contenedor de mesages de errores)
=========================================================================================================================================================
File Name: TS_CM_ErrorMessages.js                                                                        
Commit: 01                                                                                                                          
Date: 19/03/2023
Governance points: N/A
========================================================================================================================================================*/
/**
 * @NApiVersion 2.1
 */
define([], () => {

    let ErrorMessages = {
        API_ERROR: {
            DOES_NOT_EXIST_ACTION: 'Acción no definida o no existe.'
        },
        SERVICE_ORDER_VALIDATION: {
            GOODS_HAS_NOT_BEEN_SHIPPED: 'No se ha ingresado un bien.',
            GOODS_DOES_NOT_EXISTE_OR_DOES_NOT_BELONG_TO_THE_CUSTOMER: 'El bien no existe o no pertenece al cliente.'
        }
    };
    
    return { ErrorMessages }
});
