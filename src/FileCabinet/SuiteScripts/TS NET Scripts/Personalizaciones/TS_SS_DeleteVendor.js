/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/record'], (file, search, record) => {

    const execute = (context) => {
        try {

            let objSearch = search.load({ id: 'customsearch_delete_vendor' });
            let searchResultCount = objSearch.runPaged().count;
            log.debug('INICIO', 'INICIO ========================================================================');
            log.debug('Cantidad actual de Vendor', searchResultCount);
            if (searchResultCount > 0) {
                let result = objSearch.run().getRange({ start: 0, end: 1000 });
                for (let i in result) {
                    try {
                        let featureRecord = record.delete({ type: 'vendor', id: result[i].id });
                        log.debug('Vendor Eliminado', featureRecord);
                    } catch (error) {
                        // log.error('Error', error);
                    }
                }
            }
            log.debug('FIN', 'FIN ========================================================================')
        } catch (error) {
            log.error('Error', error);
        }

    }



    return {
        execute: execute
    }
});
