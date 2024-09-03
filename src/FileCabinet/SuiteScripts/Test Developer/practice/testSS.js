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

            // log.debug('ELIMINAR', 'INIT')
            // try {
            //     let featureRecord = record.delete({ type: 'assemblybuild', id: 1837 });
            //     log.debug('Eliminado', featureRecord);
            // } catch (error) {
            //     log.error('Error', error);
            // }

            // let purchaseorderSearchObj = search.create({
            //     type: "vendorbill",
            //     settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            //     filters:
            //         [
            //             ["type", "anyof", "VendBill"],
            //             "AND",
            //             ["mainline", "is", "F"],
            //             "AND",
            //             ["taxitem", "anyof", "24128"],
            //             "AND",
            //             ["custbody_base_niva", "equalto", "0.00"]
            //         ],
            //     columns:
            //         [
            //             search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" })
            //         ]
            // });
            // var searchResultCount = purchaseorderSearchObj.runPaged().count;
            // log.debug("purchaseorderSearchObj result count", searchResultCount);
            // const purchaseOrderSearchPagedData = purchaseorderSearchObj.runPaged({ pageSize: 1000 });
            // for (let i = 0; i < purchaseOrderSearchPagedData.pageRanges.length; i++) {
            //     const purchaseOrderSearchPage = purchaseOrderSearchPagedData.fetch({ index: i });
            //     purchaseOrderSearchPage.data.forEach(result => {
            //         try {
            //             const internalId = result.getValue({ name: 'internalid', summary: search.Summary.GROUP })
            //             let objRecRecord = record.load({ type: 'vendorbill', id: internalId, isDynamic: true });
            //             let res = objRecRecord.save({ enableSourcing: true, ignoreMandatoryFields: true })
            //             // const internalId = result.getValue({ name: 'internalid', summary: search.Summary.GROUP })
            //             // record.delete({ type: 'purchaseorder', id: internalId });
            //             // log.debug('Orden', 'Orden ' + internalId + ' eliminada');
            //             log.debug('Factura', 'Factura ' + res + ' actualizada');
            //         } catch (error) {
            //             log.error('Error', error);
            //         }
            //     });
            // }

            // let objRecord = record.load({ type: record.Type.SCRIPT_DEPLOYMENT, id: 2310, isDynamic: true });
            // objRecord.setValue('audsubsidiary', [2]);
            // var recordId = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
            //Update 3005
            var scriptdeploymentSearchObj = search.create({
                type: "scriptdeployment",
                filters:
                    [
                        ["script.scripttype", "anyof", "CLIENT", "RESTLET", "SCRIPTLET", "USEREVENT", "ACTION"],
                        "AND",
                        ["script.owner", "anyof", "4"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "scriptid", label: "Custom ID" }),
                        search.createColumn({ name: "script", label: "Script ID" }),
                        search.createColumn({ name: "recordtype", label: "Record Type" }),
                        search.createColumn({ name: "status", label: "Status" }),
                        search.createColumn({ name: "scripttype", join: "script", label: "Script Type" }),
                        search.createColumn({ name: "owner", join: "script", label: "Owner" })
                    ]
            });
            var searchResultCount = scriptdeploymentSearchObj.runPaged().count;
            log.debug('Inicio', 'INICIO=========================')
            log.debug("scriptdeploymentSearchObj result count", searchResultCount);
            let num = 1
            scriptdeploymentSearchObj.run().each(function (result) {
                let id = result.id
                try {
                    let recordId = record.submitFields({ type: record.Type.SCRIPT_DEPLOYMENT, id: id, values: { audsubsidiary: [2] } });
                    log.error('recordId', recordId + ' - ' + num);
                } catch (error) {
                    log.error('error', id + ' - ' + num);
                }
                num++
                return true;
            });
            // let recordId = record.submitFields({ type: record.Type.SCRIPT_DEPLOYMENT, id: 2310, values: { audsubsidiary: [2] } })
            log.debug('Finish', 'FIN============================')
        } catch (error) {
            log.error('Error', error);
        }

    }



    return {
        execute: execute
    }
});
