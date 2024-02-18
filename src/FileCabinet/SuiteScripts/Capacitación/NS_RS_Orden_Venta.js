/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/task'], function (log, task) {

    function _get(context) {
        try {
            let miEjecucion = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_ns_ss_orden_venta',
                deploymentId: 'customdeploy_ns_ss_orden_venta'
            });
            let miRespuesta = miEjecucion.submit();
            log.debug('Respuesta', miRespuesta);
        } catch (error) {
            log.error('Error', error);
        }

    }

    return {
        get: _get
    }
});
