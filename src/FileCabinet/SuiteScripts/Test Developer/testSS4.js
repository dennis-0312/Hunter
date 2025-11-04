/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/record', 'N/runtime', 'N/task'], (file, search, record, runtime, task) => {

    let currentScript = runtime.getCurrentScript();
    const execute = (context) => {
        try {
            record.delete({ type: 'inventoryadjustment', id: 1547279 });
            //PRODUCTION
            // const recordType = 'customrecord_ht_pp_main_param_prod';
            // let conteo = 0;
            // var purchaseorderSearchObj = search.create({
            //     type: recordType,
            //     filters:
            //         [
            //         ],
            //     columns:
            //         [
            //             search.createColumn({ name: "internalid", label: "internalid" }),
            //         ]
            // });
            // var searchResultCount = purchaseorderSearchObj.runPaged().count;
            // log.debug("customrecord_ht_record_bienesSearchObj result count", searchResultCount);
            // const purchaseOrderSearchPagedData = purchaseorderSearchObj.runPaged({ pageSize: 1000 });
            // for (let i = 0; i < purchaseOrderSearchPagedData.pageRanges.length; i++) {
            //     const purchaseOrderSearchPage = purchaseOrderSearchPagedData.fetch({ index: i });
            //     purchaseOrderSearchPage.data.forEach(result => {
            //         try {
            //             log.debug("conteo", conteo);
            //             let scriptObj = runtime.getCurrentScript();
            //             log.debug('Remaining governance units proccess: ' + conteo, scriptObj.getRemainingUsage());
            //             if (scriptObj.getRemainingUsage() > 100) {
            //                 log.debug('Eliminado', result.id);
            //                 record.delete({ type: recordType, id: result.id });
            //                 conteo++
            //             } else {
            //                 return false
            //             }
            //         } catch (error) {
            //             log.error('Error ' + result.id, error);
            //         }
            //     });
            // }

            // log.debug("compare", `${searchResultCount} > ${conteo}`);
            // if (searchResultCount > conteo) {
            //     const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
            //     mrTask.scriptId = 'customscript_ts_test_ss';
            //     mrTask.deploymentId = 'customdeploy_ts_test_ss';
            //     mrTask.params = {}
            //     mrTask.submit();
            // } else {
            //     log.debug("compare", `Finalizó`);
            // }


            // let scriptObj = runtime.getCurrentScript();
            // let array = []
            // log.debug('Init =================================================', 'Process');
            // let totalAEliminar = array.length
            // log.debug({ title: 'Cantidad de registros a eliminar', details: `${totalAEliminar} registros a eliminar` });
            // let eliminados = 1;
            // let noeliminados = 1;
            // let arrayNoElimnados = new Array();
            // let reprocessing = 0;
            // let conteo = 0;
            // let continuarDesde = Number(currentScript.getParameter('custscript_ts_ss_param_count4')) > 0 ? Number(currentScript.getParameter('custscript_ts_ss_param_count4')) : 0;
            // log.debug('continuarDesde', continuarDesde)
            // for (let index = continuarDesde; index < array.length; index++) {
            //     const element = array[index];
                //*ELIMINAR REGISTROS =================================================================================================================================
                // try {
                //     record.delete({ type: 'customrecord_ht_record_detallechaserdisp', id: element });
                //     log.error('Debug: ' + element, 'eliminado / ' + scriptObj.getRemainingUsage());
                //     log.debug({ title: 'Cantidad de registros eliminados', details: `${eliminados} registros eliminados` });
                //     eliminados++
                // } catch (error) {
                //     log.error('Error: ' + element, error.message + ' / ' + scriptObj.getRemainingUsage());
                //     log.debug({ title: 'Cantidad de registros NO eliminados', details: `${noeliminados} registros NO eliminados` });
                //     arrayNoElimnados.push(element)
                //     noeliminados++
                // }
                //* ===================================================================================================================================================
                //~ELIMINAR LÍNEAS DE REGISTROS =======================================================================================================================
            //     try {
            //         let so = record.load({ type: 'customsale_ec_factura_interna', id: element });
            //         so.removeLine({ sublistId: 'item', line: 1, ignoreRecalc: true });
            //         so.save({ enableSourcing: false, ignoreMandatoryFields: true });
            //         log.error('Debug: ' + element, 'eliminado / ' + scriptObj.getRemainingUsage());
            //         log.debug({ title: 'Cantidad de registros eliminados', details: `${eliminados} registros eliminados.` });
            //         eliminados++
            //         if (scriptObj.getRemainingUsage() < 100) {
            //             reprocessing = 1
            //             break;
            //         }
            //     } catch (error) {
            //         log.error('Error: ' + element, error.message + ' / ' + scriptObj.getRemainingUsage());
            //         log.debug({ title: 'Cantidad de registros NO eliminados', details: `${noeliminados} registros NO eliminados.` });
            //         arrayNoElimnados.push(element)
            //         noeliminados++
            //     }
            //     conteo = index
            //     //~ ===================================================================================================================================================
            // }
            // log.debug('Resumen: ', `${noeliminados} de ${totalAEliminar}`)
            // log.debug('arrayNoElimnados: ', arrayNoElimnados)
            // try {
            //     if (conteo < array.length && reprocessing == 1) {
            //         let scriptTask = task.create({
            //             taskType: task.TaskType.SCHEDULED_SCRIPT,
            //             scriptId: 'customscript_ts_test4_ss',
            //             deploymentId: 'customdeploy_ts_test4_ss',
            //             params: {
            //                 custscript_ts_ss_param_count: conteo,
            //             }
            //         });
            //         let scriptTaskId = scriptTask.submit();
            //         log.debug('scriptTaskId', scriptTaskId);
            //     }
            // } catch (error) {
            //     log.error('Error', error);
            // }
            // // record.submitFields({
            // //     type: 'salesorder',
            // //     id: 552367,
            // //     values: {
            // //         custbody_ht_os_aprobacionventa: 2
            // //     }
            // // })
            // log.debug('Finish =================================================', 'Process');










        } catch (error) {
            log.error('Error', error);
        }

    }



    return {
        execute: execute
    }
});
