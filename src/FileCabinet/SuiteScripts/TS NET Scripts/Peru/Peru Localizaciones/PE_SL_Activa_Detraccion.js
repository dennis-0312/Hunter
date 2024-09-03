/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/redirect', 'N/task', 'N/log', 'N/file', 'N/encode'],
	(ui, email, runtime, search, redirect, task, log, file, encode) => {
		const onRequest = (context) => {
			log.debug('Inicio', 'Inicio');
			try {
				if (context.request.method === 'GET') {
					var filterPagePOST = context.request.parameters.journalId;
					var form = ui.createForm({ title: 'Activación de Proceso Detracción' });
					log.debug('filterPagePOST', filterPagePOST);

					var scriptTask = task.create({
						taskType: task.TaskType.SCHEDULED_SCRIPT,
						scriptId: 'customscript_pe_ss_detracc_interno',
						deploymentId: 'customdeploy_pe_ss_detracc_interno',
						params: { 'custscript_pe_ss_detracc_interno_jou': filterPagePOST }
					});
					scriptTask.submit();
					context.response.writePage(form);
				} else {
					var filterPagePOST = context.request.parameters.journalId;
				}
			} catch (error) {
				log.error('Error-onRequest', error);
			}

		}
		return {
			onRequest: onRequest
		};
	});