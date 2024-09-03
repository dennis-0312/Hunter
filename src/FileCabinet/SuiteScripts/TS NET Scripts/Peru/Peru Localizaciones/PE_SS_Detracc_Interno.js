/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task'],
	function (search, record, email, runtime, log, file, task) {
		function execute(context) {
			var scriptObj = runtime.getCurrentScript();
			var journalId = scriptObj.getParameter({ name: 'custscript_pe_ss_detracc_interno_jou' }); //112;*/
			log.debug('journalId',journalId)
			//var journalId = 51249;
			log.debug({
				title: 'journalId',
				details: 'journalId es ' + journalId
			});
			var journalEntry = record.load({
				id: journalId,
				type: record.Type.JOURNAL_ENTRY,
				isDynamic: true
			});
			journalEntry.setValue({
				// fieldId: 'custbody_pe_status_detraccion_2',
				fieldId: 'custbody_pe_status_detraccion',// IMM 20230731
				value: "Procesando"
			});
			var recordId = journalEntry.save();

			var numLines = journalEntry.getLineCount({
				sublistId: 'line'
			});
			log.debug({
				title: 'Cantidad de Lineas',
				details: 'Cantidad de lineas: ' + numLines
			});
			for (var i = 0; i < numLines; i++) {
				let esFactura = false;

				var texto_si_es_fa_o_nc = journalEntry.getSublistValue({
					sublistId: 'line',
					fieldId: 'custcol_pe_ln_bill_detraccion',
					line: i
				});
				var miTexto = texto_si_es_fa_o_nc
				log.debug('MSK','Comprobante --> '+texto_si_es_fa_o_nc)

				try {
					var objRecord = record.load({
						type: record.Type.VENDOR_BILL,
						id: texto_si_es_fa_o_nc
					});
					esFactura = true;
				}catch{	}
				/*if(texto_si_es_fa_o_nc.includes("Factura")){
					esFactura = true;
				}
				if(texto_si_es_fa_o_nc.includes("Crédito de factura")){
					esFactura = false;
				}*/
				// var debit = journalEntry.getSublistValue({
				// 	sublistId: 'line',
				// 	fieldId: 'debit',
				// 	line: i
				// });
				// if(debit != null){
				// 	esFactura = true;
				// }
				log.debug('MSK','esFactura --> '+esFactura)


				/*
				PE LN VENDOR DETRACCION {custcol_pe_ln_vendor}, 
				PE LN BILL DETRACCION {custcol_pe_ln_bill_detraccion}, 
				PE LN DETRACCION NUMBER {custcol_pe_ln_detraccion_number}, 
				PE LN DETRACCION DATE {custcol_pe_ln_detraccion_date} y 
				PE LN DETRACCION custcol_pe_ln_detraccion
				*/
				var detraccionVendorId = journalEntry.getSublistValue({
					sublistId: 'line',
					// fieldId: 'custcol_pe_ln_vendor_2',
					fieldId: 'custcol_pe_ln_vendor_detraccion',//IMM 20230801
					line: i
				});
				var detraccionBillId = journalEntry.getSublistValue({
					sublistId: 'line',
					fieldId: 'custcol_pe_ln_bill_detraccion',
					line: i
				});
				var detraccionNumber = journalEntry.getSublistValue({
					sublistId: 'line',
					// fieldId: 'custcol_pe_ln_detraccion_number_2',
					fieldId: 'custcol_pe_ln_detraccion_number',//IMM 20230801
					line: i
				});
				var detraccionDate = journalEntry.getSublistValue({
					sublistId: 'line',
					// fieldId: 'custcol_pe_ln_detraccion_date_2',
					fieldId: 'custcol_pe_ln_detraccion_date',//IMM 20230801
					line: i
				});
				var isDetraccion = journalEntry.getSublistValue({
					sublistId: 'line',
					fieldId: 'custcol_pe_ln_detraccion',
					line: i
				});
				log.debug({
					title: 'Informacion de línea',
					details: detraccionVendorId + ' - ' + detraccionBillId + ' - ' + detraccionNumber + ' - ' + detraccionDate + ' - ' + isDetraccion + ' - '
				});
				var cantErrores = 0;
				log.debug('MSK', 'detraccionBillId = ' + detraccionBillId)
				log.debug('MSK', 'isDetraccion = ' + isDetraccion)
				log.debug('MSK', 'detraccionNumber = ' + detraccionNumber)
				log.debug('MSK', 'detraccionDate = ' + detraccionDate)
				if (isDetraccion //Aun no procesado
					&& detraccionVendorId != null //Tiene Vendor (Solo FA y NC)
				) {
					if (detraccionBillId != null && //Id de la Factura/Nota
						// detraccionNumber != null && //Solo FA
						// detraccionDate != null //Solo FA
						esFactura
					) {
						try {

							log.debug('MSK', 'Antes de actualizar')
							var update = record.submitFields({
								type: 'vendorbill', id: detraccionBillId,
								values: {
									custbody_pe_detraccion_number: detraccionNumber,
									custbody_pe_detraccion_dep_date: detraccionDate
									, custbody_pe_detraccion: true, custbody_pe_status_detraccion: 'Procesado'//IMM 20230801
								},
								options: {
									enableSourcing: false,
									ignoreMandatoryFields: true
								}
							});
							log.debug('MSK', 'Despues de actualizar')

							var journalEntryInt = record.load({
								id: journalId,
								type: record.Type.JOURNAL_ENTRY,
								isDynamic: true
							});

							var lineNum = journalEntryInt.selectLine({
								sublistId: 'line',
								line: i
							});

							journalEntryInt.setCurrentSublistValue({
								sublistId: 'line',
								fieldId: 'custcol_pe_ln_detraccion',
								value: false,
								ignoreFieldChange: true
							});

							journalEntryInt.commitLine({
								sublistId: 'line'
							});

							var recordJournalIdInt = journalEntryInt.save({
								enableSourcing: false,
								ignoreMandatoryFields: true
							});
						} catch (e) {
							cantErrores++;
							log.debug({
								title: 'Error encontrado',
								details: 'Error encontrado: ' + e.message
							});
						}
					} else if (detraccionBillId != null
						//Id de la Factura/Nota
					) {
						//Acá solo llegarpian las NC
						try {

							log.debug('MSK', 'Antes de actualizar NC')
							var update = record.submitFields({
								type: 'vendorcredit', id: detraccionBillId,
								values: {
									custbody_pe_detraccion: true, 
									custbody_pe_status_detraccion: 'Procesado'
								},
								options: {
									enableSourcing: false,
									ignoreMandatoryFields: true
								}
							});
							log.debug('MSK', 'Despues de actualizar NC')

							var journalEntryInt = record.load({
								id: journalId,
								type: record.Type.JOURNAL_ENTRY,
								isDynamic: true
							});

							var lineNum = journalEntryInt.selectLine({
								sublistId: 'line',
								line: i
							});

							journalEntryInt.setCurrentSublistValue({
								sublistId: 'line',
								fieldId: 'custcol_pe_ln_detraccion',
								value: false,
								ignoreFieldChange: true
							});

							journalEntryInt.commitLine({
								sublistId: 'line'
							});

							var recordJournalIdInt = journalEntryInt.save({
								enableSourcing: false,
								ignoreMandatoryFields: true
							});
						} catch (e) {
							cantErrores++;
							log.debug({
								title: 'Error encontrado NC',
								details: 'Error encontrado NC: ' + e.message
							});
						}
					}

				}
			}
			var estadoDetraccion = '';
			var detalleDetraccion = '';
			var journalEntryFin = record.load({
				id: journalId,
				type: record.Type.JOURNAL_ENTRY,
				isDynamic: true
			});
			if (cantErrores == 0) {
				journalEntryFin.setValue({
					// fieldId: 'custbody_pe_status_detraccion_2',
					fieldId: 'custbody_pe_status_detraccion',// IMM 20230731
					value: "Procesado"
				});
				journalEntryFin.setValue({
					// fieldId: 'custbody_pe_details_detraccion_2',
					fieldId: 'custbody_pe_details_detraccion',// IMM 20230731
					value: "Todas las facturas han sido actualizadas"
				});
				estadoDetraccion = "Procesado";
				detalleDetraccion = "Todas las facturas han sido actualizadas";
			}
			if (cantErrores > 0 && cantErrores < numLines) {
				journalEntryFin.setValue({
					// fieldId: 'custbody_pe_status_detraccion_2',
					fieldId: 'custbody_pe_status_detraccion',// IMM 20230731
					value: "Procesado con error"
				});
				journalEntryFin.setValue({
					// fieldId: 'custbody_pe_details_detraccion_2',
					fieldId: 'custbody_pe_details_detraccion',// IMM 20230731
					value: "Una o más líneas no se pudieron actualizar"
				});
				estadoDetraccion = "Procesado con error";
				detalleDetraccion = "Una o más líneas no se pudieron actualizar";
			}
			if (cantErrores == numLines) {
				journalEntryFin.setValue({
					// fieldId: 'custbody_pe_status_detraccion_2',
					fieldId: 'custbody_pe_status_detraccion',// IMM 20230731
					value: "Error"
				});
				journalEntryFin.setValue({
					// fieldId: 'custbody_pe_details_detraccion_2',
					fieldId: 'custbody_pe_details_detraccion',// IMM 20230731
					value: "No se pudo procesar valide si los campos de detraccion son correctos"
				});
				estadoDetraccion = "Error";
				detalleDetraccion = "No se pudo procesar valide si los campos de detraccion son correctos";
			}
			journalEntryFin.save();
			log.debug({
				title: 'Finalizado',
				details: 'Schedule finalizado'
			});
			/*
			{logo Evol NetSuite Team}
			Hola {user},
			Se ha procesado el pago de la Detraccion. El estado es el siguiente:
			{custbody_pe_status_detraccion}
			{custbody_pe_details_detraccion}
			Para entrar a la transacción entre aquí. (donde Aquí es el link del Journal)
			Saludos,
			Evol NetSuite Team
			
			var senderId = -5;
			var usuarioReceptor = runtime.getCurrentUser();
			log.debug({
				title: 'ID USUARIO',
				details: 'ID DE USUARIO ' + usuarioReceptor
			});
			//https://5091977.app.netsuite.com/core/media/media.nl?id=399&c=5091977&h=6731ee3fa1b2105ecbee
			email.send({
				author: senderId,
				recipients: usuarioReceptor.id,
				subject: 'Evol NetSuite - Proceso de pago detracción finalizado - Asiento ' + journalId + '',
				body: '<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">' +
					'<tr>' +
					'<td width="100%" colspan="2"><img style="display: block;" src="https://7460686-sb1.secure.netsuite.com/core/media/media.nl?id=31061&c=7460686_SB1&h=sEymOesZXFDN9agm4Lfa2pJ7tODn32Q37rQQMhWLX7QbUiaF" width="645" alt="main banner"/></td>' +
					'</tr>' +
					'</table>' +
					'<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">' +
					'<p>Hola ' + usuarioReceptor.name + ',</p>' +
					'<p>Se ha procesado el pago de la Detraccion. El estado es el siguiente:</p>' +
					'<p><strong> ' + estadoDetraccion + '. ' + detalleDetraccion + '. </strong></p>' +
					'<p>Si tienes algun inconveniente no dudes en comunicarte con nosotros</p>' +
					'<p>Saludos,</p>' +
					'<p>Evol NetSuite Team</p>' +
					'</table>'
       /*       +'<table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">'+
 						'<tr>'+
            			'<td width="100%" colspan="2"><img style="display: block;" src="https://5091977.app.netsuite.com/core/media/media.nl?id=41188&c=5091977&h=ceb9f85133238aae531c" width="645" alt="main banner"/></td>'+
            			'</tr>'+
        				'</table>'
			});*/
		}
		return {
			execute: execute
		};
	});