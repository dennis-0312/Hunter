/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log'], (log) => {
	const beforeLoad = (context) => {
		log.debug('DEBUG', 'Inicio');
		var formContext = context.form;
		var newRecord = context.newRecord;
		var journalId = newRecord.id;
		//var notesField = formContext.getField({ id: 'custbody_pe_detraccion' });
		var notesField = newRecord.getValue('custbody_pe_detraccion');
		try {
			if (notesField == true) {
				formContext.addButton({
					id: 'custpage_btnProcesaDetr',
					label: 'Procesa Detracción',
					functionName: 'iniciaProcesoDetraccion(' + journalId + ')'
				});

				formContext.clientScriptModulePath = './PE_CS_Detracciones_Journal.js';
			}
		} catch (error) {
			log.error('Error-beforeLoad')
		}
	}
	return {
		beforeLoad: beforeLoad
	};
});