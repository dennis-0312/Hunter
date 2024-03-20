/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/record'], (file, search, record) => {

    const execute = (context) => {
        try {
            // let fileObj = file.load({
            //     //id: 'SuiteScripts/Capacitación/NS_CS_Estados_Orden_Venta.js' 30
            //     id: 30
            // });
            // log.debug('URL', fileObj.url);

            // let fileObj = file.create({
            //     name: 'test.txt',
            //     fileType: file.Type.PLAINTEXT,
            //     contents: 'Hello World\nHello World'
            // });
            // fileObj.folder = 'SuiteScripts/Capacitación/';
            // let fileId = fileObj.save();
            // log.debug('TESTID', fileId);

            // let objSearch = search.load({ id: 'customsearch_delete_clientes' });
            // let searchResultCount = objSearch.runPaged().count;
            // log.debug('INICIO', 'INICIO ========================================================================');
            // log.debug('Cantidad actual de clientes', searchResultCount);
            // if (searchResultCount > 0) {
            //     let result = objSearch.run().getRange({ start: 0, end: 1000 });
            //     for (let i in result) {
            //         try {
            //             let featureRecord = record.delete({ type: 'customer', id: result[i].id });
            //             log.debug('Cliente Eliminado', featureRecord);
            //         } catch (error) {
            //             // log.error('Error', error);
            //         }
            //     }
            // }
            // log.debug('FIN', 'FIN ========================================================================')

            log.debug('ELIMINAR', 'INIT')
            try {
                let featureRecord = record.delete({ type: 'assemblybuild', id: 1837 });
                log.debug('Eliminado', featureRecord);
            } catch (error) {
                log.error('Error', error);
            }
        } catch (error) {
            log.error('Error', error);
        }

    }



    return {
        execute: execute
    }
});
