/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/format'],
    function(email, log, record, runtime, search, task, format) {

        const PE_SERIE_RECORD = 'customrecord_serie_orden_servicio'; 
        const SERVICE_ORDER = 'salesorder'; 
        const FORMULARIO_OS = 137;

        function execute(context) {
            try {
                var scriptObj = runtime.getCurrentScript();
                var puntoInicio = scriptObj.getParameter({ name: 'custscript_ht_punto_inicio_os' }) || 0;

                log.debug('Inicio de ejecución', 'Punto de inicio: ' + puntoInicio);

                var ordenesServicio = getOrders(puntoInicio);

                log.debug('Total de registros encontrados', 'Cantidad: ' + ordenesServicio.json2.length);

                if (ordenesServicio.json2.length > 0) {
                    processDuplicates(ordenesServicio.json2);
                }

                if (ordenesServicio.json2.length >= 1000) {
                    var scriptTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT
                    });
                    scriptTask.scriptId = 'customscript_ts_ss_actual_correla_osp';
                    scriptTask.deploymentId = 'customdeploy_ts_ss_actual_correla_osp';
                    scriptTask.params = {'custscript_ht_punto_inicio_os': puntoInicio + 1000 };
                    //scriptTask.submit();
                }

            } catch (e) {
                log.error('Error en la ejecución', e.message);
            }
        }

        function getOrders(puntoInicio) {
            const fechaActual  = sysDate(); 
            const from = fechaActual  + ' 00:00';
            const to = fechaActual  + ' 23:59';
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

            var pagedData = ordenes.runPaged({
                pageSize: 1000
            });

            pagedData.pageRanges.forEach(function(pageRange) {
                if (pageRange.index < (puntoInicio / 1000)) {
                    return;
                }
                var currentPage = pagedData.fetch({ index: pageRange.index });

                currentPage.data.forEach(function(result) {
                    var tranid = result.getValue('tranid');
                    var internalid = result.getValue('internalid');
                    
                    log.debug('Registro encontrado', 'TranID: ' + tranid + ', InternalID: ' + internalid);
                    
                    if (!registrosAgrupados[tranid]) {
                        registrosAgrupados[tranid] = new Set();
                    }

                    registrosAgrupados[tranid].add(internalid);
                });
            });

            // Identificar duplicados
            Object.keys(registrosAgrupados).forEach(function(tranid) {
                if (registrosAgrupados[tranid].size > 1) {
                    registrosAgrupados[tranid].forEach(function(internalid) {
                        duplicados.push({ tranid: tranid, internalid: internalid });
                    });
                }
            });

            return { json2: duplicados };
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