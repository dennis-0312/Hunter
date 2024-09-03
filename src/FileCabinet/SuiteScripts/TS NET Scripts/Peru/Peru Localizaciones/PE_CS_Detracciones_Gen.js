/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/error'],
	function (error) {
		function fieldChanged(context) {
			var fieldNameD = context.fieldId;
		}
		function showAllFields() {
			var elementFieldAcc = document.getElementById('custpage_field_acc_bank');
			elementFieldAcc.type = 'NORMAL';
		}
		function cancelarDetraccion() {
			var url = window.location.href;//get the URL of the page
			var params = url.split('&');//separate url and parameters
			window.location.href = params[0] + '&' + params[1]; //'https://5091977.app.netsuite.com/app/site/hosting/scriptlet.nl?script=209&deploy=1'
		}
		function saveRecord(context) {
			var currentRecord = context.currentRecord;
			var montoTotal = currentRecord.getValue({
				fieldId: 'custpagetotal'
			});
			if (montoTotal != undefined) {
				return confirm('¿Estás seguro de realizar el pago de ' + montoTotal + ' por detracciones?');
			} else { return true; }
		}
		return {
			saveRecord: saveRecord,
			fieldChanged: fieldChanged,
			showAllFields: showAllFields,
			cancelarDetraccion: cancelarDetraccion
		};
	}
);