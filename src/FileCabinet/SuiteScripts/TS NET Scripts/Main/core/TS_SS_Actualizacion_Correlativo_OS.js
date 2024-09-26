/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/format'],
    function(email, log, record, runtime, search, task, format) {

        const PE_SERIE_RECORD = 'customrecord_serie_orden_servicio'; 
        const SERVICE_ORDER = 'salesorder'; 
        const FORMULARIO_OS = 142;

        function execute(context) {
            try {
                var scriptObj = runtime.getCurrentScript();
                var puntoInicio = scriptObj.getParameter({ name: 'custscript_ht_punto_inicio_o' }) || 0;

                log.debug('Inicio de ejecución', 'Punto de inicio: ' + puntoInicio);
				
				//se procesa las ordenes que coincidan tranid y frag.
				
				var registrosNoCoinciden = getOrdersTranidFlag(puntoInicio);

				log.debug('Registros con diferencia TranID y Flag', 'Cantidad: ' + registrosNoCoinciden.length);
	
				if (registrosNoCoinciden.length > 0) {
					updateTranidFromFlag(registrosNoCoinciden);
				}
				//se procesa las ordenes que coincidan tranid y frag.

                var ordenesServicio = getOrders(puntoInicio);

                log.debug('Total de registros duplicados', 'Cantidad: ' + ordenesServicio.json2.length);

                if (ordenesServicio.json2.length > 0) {
                    processDuplicates(ordenesServicio.json2);
                }
				

                if (ordenesServicio.json2.length >= 1000) {
                    var scriptTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT
                    });
                    scriptTask.scriptId = 'customscript_ts_ss_actual_correla_os';
                    scriptTask.deploymentId = 'customdeploy_ts_ss_actual_correla_os';
                    scriptTask.params = {'custscript_ht_punto_inicio_o': puntoInicio + 1000 };
                    //scriptTask.submit();
                }
				log.debug("termino correctamente");
            } catch (e) {
                log.error('Error en la ejecución', e.message);
            }
        }


		function getOrdersTranidFlag(puntoInicio) {
			const fechaActual = sysDate();
			const from = fechaActual + ' 00:00';
			const to = fechaActual + ' 23:59';
			
			var ordenes = search.create({
				type: "transaction",
				filters: [
					['type', 'anyof', 'SalesOrd'],
					'AND',
					['customform', 'anyof', FORMULARIO_OS],
					'AND',
					["datecreated", "within", from, to]
				],
				columns: [
					search.createColumn({ name: "tranid", label: "TranID" }),
					search.createColumn({ name: "internalid", label: "InternalID" }),
					search.createColumn({ name: "custbody_ec_flag_correlativo_os", label: "Flag Correlativo OS" })
				]
			});
		
			var registrosAgrupados = {}; // Para agrupar por TranID, InternalID y Flag Correlativo
			var registrosNoCoinciden = [];
			var totalRegistrosNoCoinciden = 0;
			var totalRegistrosEncontrados = 0; // Para contar los registros antes de agrupar
			var totalAgrupados = 0; // Para contar los registros agrupados
		
			var pagedData = ordenes.runPaged({
				pageSize: 1000
			});
		
			pagedData.pageRanges.forEach(function(pageRange) {
				if (pageRange.index < (puntoInicio / 1000)) {
					return;
				}
				var currentPage = pagedData.fetch({ index: pageRange.index });
		
				currentPage.data.forEach(function(result) {
					totalRegistrosEncontrados++; // Incrementar el contador de registros encontrados
		
					var tranid = result.getValue('tranid');
					var internalid = result.getValue('internalid');
					var flagCorrelativo = result.getValue('custbody_ec_flag_correlativo_os');
					
					// Crear una clave única para el agrupamiento usando los tres valores
					var claveAgrupacion = tranid + '|' + internalid + '|' + flagCorrelativo;
		
					// Agrupar usando la clave creada
					if (!registrosAgrupados[claveAgrupacion]) {
						registrosAgrupados[claveAgrupacion] = {
							tranid: tranid,
							internalid: internalid,
							flagCorrelativo: flagCorrelativo
						};
					}
				});
			});
		
			// Mostrar cuántos registros se encontraron en total antes de agrupar
			log.debug('Total de registros encontrados', totalRegistrosEncontrados);
		
			// Contar el número total de grupos únicos
			totalAgrupados = Object.keys(registrosAgrupados).length;
		
			// Validar registros que no coinciden
			Object.keys(registrosAgrupados).forEach(function(clave) {
				var registro = registrosAgrupados[clave];
				var tranid = registro.tranid;
				var flagCorrelativo = registro.flagCorrelativo;
		
				// Validar si tranid es diferente de custbody_ec_flag_correlativo_os
				if (tranid !== flagCorrelativo && flagCorrelativo.length > 0) {
					totalRegistrosNoCoinciden++;
					registrosNoCoinciden.push({
						tranid: tranid,
						internalid: registro.internalid,
						flagCorrelativo: flagCorrelativo
					});
				}
			});
		
			// Mostrar cuántos registros hay después de agrupar
			log.debug('Total de registros agrupados que no coinciden (únicos)', totalAgrupados);
			log.debug('Total de registros que no coinciden', totalRegistrosNoCoinciden);
		
			return registrosNoCoinciden;
		}
	

		function getOrders(puntoInicio) {
    const fechaActual = sysDate();
    const from = fechaActual + ' 00:00';
    const to = fechaActual + ' 23:59';
    log.debug('Debug', from + ' - ' + to);
    
    var ordenes = search.create({
        type: "transaction",
        filters: [
            ['type', 'anyof', 'SalesOrd'],
            'AND',
            ["datecreated", "within", from, to],
            'AND',
            ['customform', 'anyof', FORMULARIO_OS]
        ],
        columns: [
            search.createColumn({ name: "tranid", label: "tranid" }),
            search.createColumn({ name: "internalid", label: "internalid" })
        ]
    });

    var registrosAgrupados = {};
    var duplicados = [];
    var totalRegistrosEncontrados = 0;

    var pagedData = ordenes.runPaged({
        pageSize: 1000
    });

    pagedData.pageRanges.forEach(function(pageRange) {
        if (pageRange.index < (puntoInicio / 1000)) {
            return;
        }
        var currentPage = pagedData.fetch({ index: pageRange.index });

        currentPage.data.forEach(function(result) {
            totalRegistrosEncontrados++;  // Incrementar el contador de registros encontrados
            var tranid = result.getValue('tranid');
            var internalid = result.getValue('internalid');
            
            // Crear una clave única para el agrupamiento usando tranid e internalid
            var claveAgrupacion = tranid + '|' + internalid;

            if (!registrosAgrupados[claveAgrupacion]) {
                registrosAgrupados[claveAgrupacion] = { tranid: tranid, internalid: internalid };
            }
        });
    });

    // Mostrar la cantidad total de registros encontrados
    log.debug('Total de registros encontrados', totalRegistrosEncontrados);

    // Mostrar la cantidad de registros agrupados (número de combinaciones únicas)
    var totalAgrupados = Object.keys(registrosAgrupados).length;
    log.debug('Total de registros agrupados (únicos)', totalAgrupados);

    // Identificar duplicados
    Object.keys(registrosAgrupados).forEach(function(clave) {
        // Si hay duplicados, añadir a la lista
        if (Object.values(registrosAgrupados).filter(r => r.tranid === registrosAgrupados[clave].tranid).length > 1) {
            duplicados.push({ tranid: registrosAgrupados[clave].tranid, internalid: registrosAgrupados[clave].internalid });
        }
    });

    return { json2: duplicados };
}



    function updateTranidFromFlag(registros) {
        registros.forEach(function(orden) {
            log.debug('Actualizando TranID con Flag','tranid: ' + orden.tranid + ',InternalID: ' + orden.internalid + ', Nuevo TranID: ' + orden.flagCorrelativo);
            
            var recordToUpdate = record.load({
                type: SERVICE_ORDER,
                id: orden.internalid
            });

            recordToUpdate.setValue({
                fieldId: 'tranid',
                value: orden.flagCorrelativo
            });

            recordToUpdate.save();
        });
    }
	
	
	
	
        function processDuplicates(duplicados) {
            var registrosPorTranid = {};

            duplicados.forEach(function(orden) {
                if (!registrosPorTranid[orden.tranid]) {
                    registrosPorTranid[orden.tranid] = [];
                }
                registrosPorTranid[orden.tranid].push(orden.internalid);
            });

            Object.keys(registrosPorTranid).forEach(function(tranid) {
                var internalids = registrosPorTranid[tranid];
                if (internalids.length > 1) {
                    var originalInternalId = internalids[0];
                    var duplicateInternalIds = internalids.slice(1);

                    duplicateInternalIds.forEach(function(internalid) {
                        var newTranid = generateNewTranid();
                        log.debug('Actualizando TranID', 'InternalID: ' + internalid + ', Nuevo TranID: ' + newTranid);
                        
                        var duplicatedRecord = record.load({
                            type: SERVICE_ORDER,
                            id: internalid
                        });

                        duplicatedRecord.setValue({ fieldId: 'tranid', value: newTranid });
                        duplicatedRecord.save();
                    });
                }
            });
        }

        function generateNewTranid() {
            var serieRecord = search.create({
                type: PE_SERIE_RECORD,
                filters: [
                    ['custrecord_serie_os_formulario', 'is', FORMULARIO_OS]
                ],
                columns: ['custrecord_serie_os_numero_inicial', 'custrecord_serie_os_numero_digitos']
            });

            var resultSet = serieRecord.run().getRange({ start: 0, end: 1 });
            if (resultSet.length === 0) {
                throw new Error('No se encontró el registro de serie.');
            }

            var numeroInicial = parseInt(resultSet[0].getValue('custrecord_serie_os_numero_inicial'));
            var numeroDigitos = parseInt(resultSet[0].getValue('custrecord_serie_os_numero_digitos'));

            var nuevoNumero = (numeroInicial + 1).toString().padStart(numeroDigitos, '0');
            // Actualizar el número inicial
            record.submitFields({
                type: PE_SERIE_RECORD,
                id: resultSet[0].id,
                values: { 'custrecord_serie_os_numero_inicial': nuevoNumero }
            });

            return 'OS' + nuevoNumero;
        }
        
        function sysDate() { // Aquí defines la función 'sysDate'
            try {
                var date = new Date();
                var tdate = date.getDate();
                var month = date.getMonth() + 1; // jan = 0
                var year = date.getFullYear();
                return tdate + '/' + month + '/' + year;
            } catch (e) {
                log.error('Error-sysDate', e);
            }
        }

        return {
            execute: execute
        };
    });