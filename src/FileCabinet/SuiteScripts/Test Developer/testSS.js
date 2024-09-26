/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/record'], (file, search, record) => {

    const execute = (context) => {
        try {
            //PRODUCTION
            let purchaseorderSearchObj = search.create({
                type: "customrecord_ht_record_bienes",
                filters:
                    [
                        ["custrecord_bn_subsidiaria", "anyof", "2"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "ID" })
                    ]
            });
            var searchResultCount = purchaseorderSearchObj.runPaged().count;
            log.debug("customrecord_ht_record_bienesSearchObj result count", searchResultCount);
            const purchaseOrderSearchPagedData = purchaseorderSearchObj.runPaged({ pageSize: 1000 });
            for (let i = 0; i < purchaseOrderSearchPagedData.pageRanges.length; i++) {
                const purchaseOrderSearchPage = purchaseOrderSearchPagedData.fetch({ index: i });
                purchaseOrderSearchPage.data.forEach(result => {
                    try {
                        log.debug('Eliminado', result.id);
                        record.delete({ type: 'customrecord_ht_record_bienes', id: result.id });
                    } catch (error) {
                        log.error('Error', + result.id);
                    }
                });
            }
        } catch (error) {
            log.error('Error', error);
        }

    }



    return {
        execute: execute
    }
});
