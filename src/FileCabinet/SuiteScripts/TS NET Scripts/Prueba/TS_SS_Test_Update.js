/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/search', 'N/runtime'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search, runtime) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            let scriptObj = runtime.getCurrentScript();
            let buildId = '';
            try {
                // let assemblyBuild = record.transform({ fromType: 'salesorder', fromId: 180761, toType: "customsale_ec_factura_interna", isDynamic: true });
                // assemblyBuild.setValue('custbodyts_ec_tipo_documento_fiscal', 7);
                // assemblyBuild.setValue('location', 5);

                // let salesOrderToFacturaInterna = record.load({ type: record.Type.SALES_ORDER, id: 176332, isDynamic: true });
                // let numLinesBillingschedule = salesOrderToFacturaInterna.getLineCount({ sublistId: 'billingschedule' });
                // let numLinesItem = salesOrderToFacturaInterna.getLineCount({ sublistId: 'item' });
                // log.error('numLines', `${numLinesBillingschedule}`);
                // if (numLinesBillingschedule > 1) {
                //     log.error('numLinesBillingschedule', 'Pendiente desarrollo para facturas recurrentes');
                //     // for (let i = 0; i < numLinesBillingschedule; i++) {
                //     //     var billamount = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'billingschedule', fieldId: 'billamount', line: i });
                //     //     var billdate = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'billingschedule', fieldId: 'billdate', line: i });
                //     //     log.error('billingschedule', `${billamount}-${billdate}`);
                //     //     let assemblyBuild = record.transform({fromType: 'salesorder',fromId: 176332,toType: "customsale_ec_factura_interna",isDynamic: true});
                //     // }
                //     // buildId = assemblyBuild.save();
                // } else {
                //     let assemblyBuild = record.transform({ fromType: 'salesorder', fromId: 176332, toType: "customsale_ec_factura_interna", isDynamic: true });
                //     assemblyBuild.setValue('custbodyts_ec_tipo_documento_fiscal', 7);
                //     assemblyBuild.setValue('location', 5);   
                //     for (let i = 0; i < numLinesItem; i++) {
                //         let itemOriginal = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i })
                //         let itemAgrupado = salesOrderToFacturaInterna.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_so_item_agrupado', line: i })
                //         assemblyBuild.selectLine({ sublistId: 'item', line: i });
                //         if (itemAgrupado) {
                //             assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemAgrupado });
                //         } else {
                //             assemblyBuild.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemOriginal });
                //         }
                //         assemblyBuild.commitLine({ sublistId: 'item' });
                //     }
                //     buildId = assemblyBuild.save();
                // }
                // log.error('buildId', buildId);

                let salesOrderToFacturaInterna = record.load({ type: 'customsale_ec_factura_interna', id: 193169, isDynamic: true });
                salesOrderToFacturaInterna.setValue('status', 'D');
                buildId = salesOrderToFacturaInterna.save();
                log.error('buildId', buildId);




















                // let accountSearchObj = search.create({
                //     type: "savedsearch",
                //     filters:
                //         [
                //             ["access", "anyof", "PRIVATE"],
                //             "AND",
                //             ["internalid", "noneof", "1509"]
                //         ],
                //     columns:
                //         [
                //             search.createColumn({ name: "internalid", label: "Internal ID" }),
                //             search.createColumn({ name: "title", sort: search.Sort.ASC, label: "Title" })
                //         ]
                // });
                // let searchResultCount = accountSearchObj.runPaged().count;
                // log.debug("accountSearchObj result count", searchResultCount);
                // if (searchResultCount > 0) {
                //     let objResults = accountSearchObj.run().getRange({ start: 0, end: 2 });
                //     for (let i in objResults) {
                //         if (scriptObj.getRemainingUsage() < 200) {
                //             log.error('Supera memoria');
                //             break;
                //         }
                //         let id = objResults[i].getValue({ name: "internalid" });
                //         record.submitFields({
                //             type: 'savedsearch',
                //             id: id,
                //             values: {
                //                 ispublic: true
                //             },
                //         })
                //         // record.save({ type: 'savedsearch', id: id });
                //         log.debug('Registro Actualizado', id);
                //     }
                // }
                // accountSearchObj.run().each((result) => {return true});
            } catch (error) {
                log.error('Error', error);
            }
        }

        return { execute }

    });
