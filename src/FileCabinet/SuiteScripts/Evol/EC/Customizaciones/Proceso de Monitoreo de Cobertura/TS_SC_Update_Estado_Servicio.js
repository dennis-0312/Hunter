/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/task'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 */
    (log, record, runtime, search, task) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            let scriptObj = runtime.getCurrentScript();
            let array = []


            log.debug('Init =================================================', 'Process');
            let totalAEliminar = array.length
            log.debug({ title: 'Cantidad de registros a eliminar', details: `${totalAEliminar} registros a eliminar` });
            let eliminados = 1;
            let noeliminados = 1;
            let arrayNoElimnados = new Array();
            let reprocessing = 0;
            let conteo = 0;
            let continuarDesde = Number(currentScript.getParameter('custscript_ts_ss_param_count2')) > 0 ? Number(currentScript.getParameter('custscript_ts_ss_param_count2')) : 0;
            log.debug('continuarDesde', continuarDesde)
            for (let index = continuarDesde; index < array.length; index++) {
                const element = array[index];
                //~ELIMINAR LÍNEAS DE REGISTROS =======================================================================================================================
                try {
                    let so = record.load({ type: 'customsale_ec_factura_interna', id: element });
                    so.removeLine({ sublistId: 'item', line: 1, ignoreRecalc: true });
                    so.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.error('Debug: ' + element, 'eliminado / ' + scriptObj.getRemainingUsage());
                    log.debug({ title: 'Cantidad de registros eliminados', details: `${eliminados} registros eliminados.` });
                    eliminados++
                    if (scriptObj.getRemainingUsage() < 100) {
                        reprocessing = 1
                        break;
                    }
                } catch (error) {
                    log.error('Error: ' + element, error.message + ' / ' + scriptObj.getRemainingUsage());
                    log.debug({ title: 'Cantidad de registros NO eliminados', details: `${noeliminados} registros NO eliminados.` });
                    arrayNoElimnados.push(element)
                    noeliminados++
                }
                conteo = index
                //~ ===================================================================================================================================================
            }
            log.debug('Resumen: ', `${noeliminados} de ${totalAEliminar}`)
            log.debug('arrayNoElimnados: ', arrayNoElimnados)
            try {
                if (conteo < array.length && reprocessing == 1) {
                    let scriptTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_ts_test2_ss',
                        deploymentId: 'customdeploy_ts_test2_ss',
                        params: {
                            custscript_ts_ss_param_count: conteo,
                        }
                    });
                    let scriptTaskId = scriptTask.submit();
                    log.debug('scriptTaskId', scriptTaskId);
                }
            } catch (error) {
                log.error('Error', error);
            }
            // record.submitFields({
            //     type: 'salesorder',
            //     id: 552367,
            //     values: {
            //         custbody_ht_os_aprobacionventa: 2
            //     }
            // })
            log.debug('Finish =================================================', 'Process');
        }

        return { execute }

    });
