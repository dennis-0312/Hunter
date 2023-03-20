/*=======================================================================================================================================================
This script for resources (Script contenedor de constantes)
=========================================================================================================================================================
File Name: TS_CM_Constant.js                                                                        
Commit: 01                                                                                                                          
Date: 19/03/2023
Governance points: N/A
========================================================================================================================================================*/
/**
 * @NApiVersion 2.1
 */
define([], () => {

    let Constants = {
        RECORDS: {
            DOES_NOT_EXIST_ACTION: 0
        },
        SEARCHS: {
            SEARCH_FOR_GOOD: 'customsearch_ht_bienes', //HT Bienes - PRODUCCION
            TRANSACTION_SEARCH: 'customsearch_ht_transaction_search' //HT Transaction Search -  PRODUCCION
        },
        DOCUMENT_TYPE:{
            INVOICE: 4,
        },
        TRANSACTION_TYPE: {
            SERVICE_ORDER_TYPE: 'SalesOrd',
            
        }
    };

    return { Constants }

});
