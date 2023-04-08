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
            TRANSACTION_SEARCH: 'customsearch_ht_transaction_search', //HT Transaction Search -  PRODUCCION
            COST_PROVISION_SEARCH: 'customsearch_ht_asiento_prov_costos_suma', //HT Asiento Provisión Costos CONSOLIDADO - PRODUCCION
            COST_PROVISION_DETAIL_SEARCH: 'customsearch_ht_asiento_prov_costos', //HT Asiento Provisión Costos DETALLE - PRODUCCION
        },
        DOCUMENT_TYPE: {
            INVOICE: 4,
        },
        TRANSACTION_TYPE: {
            SERVICE_ORDER_TYPE: 'SalesOrd',

        }
    };

    return { Constants }

});
