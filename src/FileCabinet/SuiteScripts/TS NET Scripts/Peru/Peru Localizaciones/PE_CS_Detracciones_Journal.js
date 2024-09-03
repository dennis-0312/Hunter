/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/error', 'N/currentRecord', 'N/search', 'N/log', 'N/runtime', 'N/url'],
	function (error, currentRecord, search, log, runtime, url) {
		function fieldChanged(context) {
			var fieldNameD = context.fieldId;
		}

		function iniciaProcesoDetraccion(journalId) {

			var rec = currentRecord.get();
			// var actValue = rec.getValue({
			// 	fieldId: 'id'
			// });
			var actValue = journalId;
			console.log('JournalId: ' + journalId)

			var host = url.resolveDomain({
				hostType: url.HostType.APPLICATION
			});

			var relativePath = url.resolveScript({
				scriptId: 'customscript_pe_sl_activa_detracc',
				deploymentId: 'customdeploy_pe_sl_activa_detracc'
			});

			var windowOpen = window.open('https://' + host + relativePath + '&journalId=' + actValue, 'Suitelet Inicia Schedule', 'location=1,status=1,scrollbars=1, width=100,height=100');
			setTimeout(function () { windowOpen.close(); }, 2000);
		}


		function printRetentionReceipt() {

			var rec = currentRecord.get();
			var actValue = rec.getValue({
				fieldId: 'id'
			});

			var host = url.resolveDomain({
				hostType: url.HostType.APPLICATION
			});

			var relativePath = url.resolveScript({
				scriptId: 'customscript_pe_sl_activa_detracc',
				deploymentId: 'customdeploy_pe_sl_activa_detracc'
			});

			window.open('https://' + host + relativePath + '&journalId=' + actValue, 'Suitelet Inicia Schedule', 'location=1,status=1,scrollbars=1');
			
		}
		return {
			fieldChanged: fieldChanged,
			iniciaProcesoDetraccion: iniciaProcesoDetraccion,
			printRetentionReceipt: printRetentionReceipt
		};
	}
);