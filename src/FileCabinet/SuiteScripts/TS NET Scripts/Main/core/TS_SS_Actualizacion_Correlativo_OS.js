/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/log', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/format', 'N/url', 'N/query'],
    function (email, log, record, runtime, search, task, format, url, query) {

        const PE_SERIE_RECORD = 'customrecord_serie_orden_servicio';
        const SERVICE_ORDER = 'salesorder';
        const FORMULARIO_OS = 142;
        const EC_GERENTE_CARTERA = 1785;
        const EC_GERENTE_VENTA = 1786;

        function execute(context) {
            try {
                var scriptObj = runtime.getCurrentScript();
                var puntoInicio = scriptObj.getParameter({ name: 'custscript_ht_punto_inicio_o' }) || 0;
                log.debug('Inicio de ejecución', 'Punto de inicio: ' + puntoInicio);
                var registrosNoCoinciden = getOrdersTranidFlag(puntoInicio);
                //log.debug('Registros con diferencia TranID y Flag', 'Cantidad: ' + registrosNoCoinciden.length);
                if (registrosNoCoinciden.length > 0) {
                    updateTranidFromFlag(registrosNoCoinciden);
                }
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
                    scriptTask.params = { 'custscript_ht_punto_inicio_o': puntoInicio + 1000 };
                    //scriptTask.submit();
                }
                log.debug("termino correctamente");
            } catch (e) {
                log.error('Error en la ejecución', e.message);
            }
        }

        function getOrdersTranidFlag(puntoInicio) {
            const fechaActual = sysDate();
            //log.debug('Fecha Actual', fechaActual);
            let [dia, mes, año] = fechaActual.split('/');
            let fechaMenos3dias = new Date(año, mes - 1, dia);
            fechaMenos3dias.setDate(fechaMenos3dias.getDate() - 2);

            let diaMenos3 = String(fechaMenos3dias.getDate()).padStart(2, '0');
            let mesMenos3 = String(fechaMenos3dias.getMonth() + 1).padStart(2, '0');
            let añoMenos3 = fechaMenos3dias.getFullYear();
            let fechaMenos3Formateada = `${diaMenos3}/${mesMenos3}/${añoMenos3}`;

            const from = fechaActual + ' 00:00';
            const to = fechaActual + ' 23:59';

            log.debug('Rango de Fechas tranid', `From: ${from} - To: ${to}`);

            var ordenes = search.create({
                type: "transaction",
                filters: [
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['customform', 'anyof', FORMULARIO_OS],
                    'AND',
                    /*  ["datecreated", "within", from, to],
                    'AND',*/
                    ['status', "noneof", 'SalesOrd:H'],
                    /*'AND',
                    ['tranid', 'anyof', 'OS00002817'],
                    'AND',
                    ['tranid', 'isnot', 'custbody_ec_flag_correlativo_os'],*/
                    'AND',
                    ["datecreated", "within", from, to]
                ],
                columns: [
                    search.createColumn({ name: "tranid", label: "TranID" }),
                    search.createColumn({ name: "internalid", label: "InternalID" }),
                    search.createColumn({ name: "custbody_ec_flag_correlativo_os", label: "Flag Correlativo OS" })
                ]
            });

            var registrosAgrupados = {};
            var registrosNoCoinciden = [];
            var totalRegistrosNoCoinciden = 0;
            var totalRegistrosEncontrados = 0;
            var totalAgrupados = 0;

            var pagedData = ordenes.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach(function (pageRange) {
                if (pageRange.index < (puntoInicio / 1000)) {
                    return;
                }
                var currentPage = pagedData.fetch({ index: pageRange.index });
                currentPage.data.forEach(function (result) {
                    totalRegistrosEncontrados++;
                    var tranid = result.getValue('tranid');
                    var internalid = result.getValue('internalid');
                    var flagCorrelativo = result.getValue('custbody_ec_flag_correlativo_os');
                    var claveAgrupacion = tranid + '|' + internalid + '|' + flagCorrelativo;
                    if (!registrosAgrupados[claveAgrupacion]) {
                        registrosAgrupados[claveAgrupacion] = {
                            tranid: tranid,
                            internalid: internalid,
                            flagCorrelativo: flagCorrelativo
                        };
                    }
                });
            });
            //log.debug('Total de registros encontrados', totalRegistrosEncontrados);
            totalAgrupados = Object.keys(registrosAgrupados).length;
            Object.keys(registrosAgrupados).forEach(function (clave) {
                var registro = registrosAgrupados[clave];
                var tranid = registro.tranid;
                var flagCorrelativo = registro.flagCorrelativo;
                if (tranid !== flagCorrelativo && flagCorrelativo.length > 0) {
                    totalRegistrosNoCoinciden++;
                    registrosNoCoinciden.push({
                        tranid: tranid,
                        internalid: registro.internalid,
                        flagCorrelativo: flagCorrelativo
                    });
                }
            });

            //log.debug('Total de registros agrupados que no coinciden (únicos)', totalAgrupados);
            //log.debug('Total de registros que no coinciden', totalRegistrosNoCoinciden);

            return registrosNoCoinciden;
        }

        function getOrders(puntoInicio) {
            const fechaActual = sysDate();
            //log.debug('Fecha Actual', fechaActual);

            let [dia, mes, año] = fechaActual.split('/');
            let fechaMenos3dias = new Date(año, mes - 1, dia);
            fechaMenos3dias.setDate(fechaMenos3dias.getDate() - 2);

            let diaMenos3 = String(fechaMenos3dias.getDate()).padStart(2, '0');
            let mesMenos3 = String(fechaMenos3dias.getMonth() + 1).padStart(2, '0');
            let añoMenos3 = fechaMenos3dias.getFullYear();
            let fechaMenos3Formateada = `${diaMenos3}/${mesMenos3}/${añoMenos3}`;

            const from = fechaActual + ' 00:00';
            const to = fechaActual + ' 23:59';

            log.debug('Rango de Fechas duplicados 2', `From: ${from} - To: ${to}`);

            var ordenes = search.create({
                type: "transaction",
                filters: [
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    /*  ["datecreated", "within", from, to],
                        'AND',*/
                    ['customform', 'anyof', FORMULARIO_OS],
                    /*	'AND',
                        ['tranid', 'is', 'custbody_ec_flag_correlativo_os'],
                        'AND',
                        ['tranid', 'anyof', 'OS00002066'],*/
                    'AND',
                    ["datecreated", "within", from, to]
                ],
                columns: [
                    search.createColumn({ name: "tranid", label: "tranid" }),
                    search.createColumn({ name: "internalid", label: "internalid" }),
                    search.createColumn({ name: "custbody_ec_confirmacion_envio_email_c", label: "custbody_ec_confirmacion_envio_email_c" }),
                    search.createColumn({ name: "custbody_ec_confirmacion_envio_email_v", label: "custbody_ec_confirmacion_envio_email_v" }),
                    search.createColumn({ name: "custbody_ht_os_aprobacionventa", label: "custbody_ht_os_aprobacionventa" }),
                    search.createColumn({ name: "custbody_ht_os_aprobacioncartera", label: "custbody_ht_os_aprobacioncartera" })
                ]
            });

            var registrosAgrupados = {};
            var duplicados = [];
            var registrosUnicosSinDuplicados = [];
            var totalRegistrosEncontrados = 0;
            var internalid;
            var pagedData = ordenes.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach(function (pageRange) {
                if (pageRange.index < (puntoInicio / 1000)) {
                    return;
                }
                var currentPage = pagedData.fetch({ index: pageRange.index });
                currentPage.data.forEach(function (result) {
                    totalRegistrosEncontrados++;
                    var tranid = result.getValue('tranid');
                    internalid = result.getValue('internalid');
                    var confirmacionEnvioVenta = result.getValue('custbody_ec_confirmacion_envio_email_v');
                    log.debug("confirmacionEnvioVenta", confirmacionEnvioVenta);
                    var confirmacionEnvioCartera = result.getValue('custbody_ec_confirmacion_envio_email_c');
                    var aprobacionVenta = result.getValue('custbody_ht_os_aprobacionventa');
                    var aprobacionCartera = result.getValue('custbody_ht_os_aprobacioncartera');
                    var claveAgrupacion = tranid + '|' + internalid;
                    if (!registrosAgrupados[claveAgrupacion]) {
                        registrosAgrupados[claveAgrupacion] = { tranid: tranid, internalid: internalid, confirmacionEnvioVenta: confirmacionEnvioVenta, confirmacionEnvioCartera: confirmacionEnvioCartera, aprobacionVenta: aprobacionVenta, aprobacionCartera: aprobacionCartera };
                    }
                });
            });

            //log.debug('Total de registros encontrados', totalRegistrosEncontrados);
            var totalAgrupados = Object.keys(registrosAgrupados).length;
            //log.debug('Total de registros agrupados (únicos)', totalAgrupados);

            Object.keys(registrosAgrupados).forEach(function (clave) {
                var registro = registrosAgrupados[clave];
                var esDuplicado = Object.values(registrosAgrupados).filter(r => r.tranid === registro.tranid).length > 1;
                if (esDuplicado) {
                    duplicados.push({ tranid: registro.tranid, internalid: registro.internalid, confirmacionEnvioVenta: confirmacionEnvioVenta, confirmacionEnvioCartera: confirmacionEnvioCartera, aprobacionVenta: aprobacionVenta, aprobacionCartera: aprobacionCartera });
                } else {
                    registrosUnicosSinDuplicados.push(registro);
                }
            });


            //* =========================
            let arrayUserRoles = getAllRoles();
            //log.debug('arrayUserRoles', arrayUserRoles);
            const groupedByRole = arrayUserRoles.reduce((acc, curr) => {
                const role = curr.role;
                if (!acc[role]) {
                    acc[role] = [];
                }
                acc[role].push(curr);
                return acc;
            }, {});
            // let arrayRecipients = groupedByRole[EC_GERENTE_VENTA].map(item => parseInt(item.id));
            // log.debug('arrayRecipients', `${arrayRecipients}-${internalid}`);
            // email.send({
            //     author: 4,
            //     recipients: arrayRecipients,
            //     subject: 'Prueba Envío Correos',
            //     body: 'Prueba Envío',
            //     relatedRecords: {
            //         transactionId: internalid
            //     }
            // });
            //* =========================
            // log.debug('groupedByRole', groupedByRole);
            // Procesar cada tranID en registros únicos sin duplicados
            registrosUnicosSinDuplicados.forEach(function (registro) {
                if (!registro.confirmacionEnvioVenta && registro.aprobacionVenta === '2') {
                    const ConfirmacionEnvio = 'custbody_ec_confirmacion_envio_email_v';
                    processTransaction(registro.tranid, EC_GERENTE_VENTA, ConfirmacionEnvio, groupedByRole);
                    //log.debug("entro caso 1");
                }

                if (!registro.confirmacionEnvioCartera && registro.aprobacionCartera === '2') {
                    const ConfirmacionEnvio = 'custbody_ec_confirmacion_envio_email_c';
                    processTransaction(registro.tranid, EC_GERENTE_CARTERA, ConfirmacionEnvio, groupedByRole);
                    //log.debug("entro caso 3");
                }
            });
            return { json2: duplicados };
        }

        function hasRecordBeenModified(recordId) {
            var order = record.load({ type: SERVICE_ORDER, id: recordId });
            var lastModifiedDate = order.getValue('lastmodifieddate');
            var now = new Date();

            var threshold = 0.1 * 60 * 1000;
            var difference = now - new Date(lastModifiedDate);

            return difference < threshold;
        }


        function updateTranidFromFlag(registros) {
            registros.forEach(function (orden) {
                //log.debug('Verificando si actualizar TranID con Flag', 'tranid: ' + orden.tranid + ', InternalID: ' + orden.internalid + ', Flag Correlativo: ' + orden.flagCorrelativo);

                // Verifica si el registro ha sido modificado recientemente
                if (hasRecordBeenModified(orden.internalid)) {
                    //log.debug('El registro ha sido modificado recientemente', 'No se cambiará el TranID');
                    return; // Si ha sido modificado, salta la actualización del TranID
                }

                var recordToUpdate = record.load({ type: SERVICE_ORDER, id: orden.internalid });
                var currentFlag = recordToUpdate.getValue('custbody_ec_flag_correlativo_os');
                if (orden.tranid !== currentFlag) {
                    var duplicadoExistente = checkForDuplicate(orden.flagCorrelativo);
                    if (duplicadoExistente) {
                        // Generar nuevo TranID ya que existe un duplicado
                        var newTranid = generateNewTranid();
                        //log.debug('Asignando nuevo TranID', 'Nuevo TranID: ' + newTranid);
                        recordToUpdate.setValue({
                            fieldId: 'tranid',
                            value: newTranid
                        });
                        recordToUpdate.setValue({
                            fieldId: 'custbody_ec_flag_correlativo_os',
                            value: newTranid
                        });
                    } else {
                        // Actualizar solo el flag correlativo OS
                        recordToUpdate.setValue({
                            fieldId: 'tranid',
                            value: orden.flagCorrelativo
                        });
                    }
                    recordToUpdate.save();
                }
            });
        }

        function checkForDuplicate(flagCorrelativo) {
            var ordenes = search.create({
                type: "transaction",
                filters: [
                    ['tranid', 'is', flagCorrelativo],
                    'AND',
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['customform', 'anyof', FORMULARIO_OS]
                ]
            });
            return ordenes.runPaged().count > 0; // Retorna verdadero si existe al menos un duplicado
        }

        function processDuplicates(duplicados) {
            var registrosPorTranid = {};

            duplicados.forEach(function (orden) {
                if (!registrosPorTranid[orden.tranid]) {
                    registrosPorTranid[orden.tranid] = [];
                }
                registrosPorTranid[orden.tranid].push(orden);
            });

            Object.keys(registrosPorTranid).forEach(function (tranid) {
                var ordenes = registrosPorTranid[tranid];
                if (ordenes.length > 1) {
                    var originalOrden = ordenes[0];
                    var duplicateOrdenes = ordenes.slice(1);


                    processRegistro(originalOrden);

                    duplicateOrdenes.forEach(function (orden) {
                        var newTranid = generateNewTranid();
                        //log.debug('Actualizando TranID', 'InternalID: ' + orden.internalid + ', Nuevo TranID: ' + newTranid);
                        var duplicatedRecord = record.load({
                            type: SERVICE_ORDER,
                            id: orden.internalid
                        });
                        duplicatedRecord.setValue({ fieldId: 'tranid', value: newTranid });
                        duplicatedRecord.setValue({ fieldId: 'custbody_ec_flag_correlativo_os', value: newTranid });
                        duplicatedRecord.save();

                        orden.tranid = newTranid;

                        processRegistro(orden);
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

            record.submitFields({
                type: PE_SERIE_RECORD,
                id: resultSet[0].id,
                values: { 'custrecord_serie_os_numero_inicial': nuevoNumero }
            });

            return 'OS' + nuevoNumero;
        }

        function sysDate() {
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

        const processTransaction = (tranID, role, ConfirmacionEnvio, arrayUserRoles) => {
            const FN = 'processTransaction';
            try {
                //log.debug('Buscando transacción con tranID:', tranID);

                // Buscar el registro basado en el tranID proporcionado
                let transactionSearch = search.create({
                    type: 'transaction', // Asegúrate de que esto es el tipo correcto
                    columns: ['internalid', 'custbody_ht_os_ejecutiva_backoffice', 'entity', 'custbody_ht_so_bien', 'tranid'],
                    filters: [
                        ['tranid', 'is', tranID]
                    ]
                });

                let searchResult = transactionSearch.run().getRange(0, 1);
                //log.debug('Resultados de la búsqueda:', searchResult);

                if (searchResult.length === 0) {
                    throw new Error('No se encontró el registro con tranid: ' + tranID);
                }

                const currentRecord = searchResult[0];
                const transactionId = currentRecord.getValue('internalid');
                log.debug('ID de transacción encontrada:', transactionId);

                let ejecutiva_gestion = currentRecord.getValue('custbody_ht_os_ejecutiva_backoffice');
                let ejecutiva_gestion_text = currentRecord.getText('custbody_ht_os_ejecutiva_backoffice');
                let entity = currentRecord.getText('entity');
                let bien = currentRecord.getText('custbody_ht_so_bien');
                let arrayRecipients = arrayUserRoles[role].map(item => parseInt(item.id));
                log.debug('arrayRecipients', arrayRecipients);
                //let EMPLOYID = getUserRoles(role);
                //log.debug('EMPLOYID', EMPLOYID);
                let subject = 'Orden de Servicio ' + tranID + ' pendiente de aprobación por Venta';
                let body = '<p>Número de Documento: ' + tranID + '<br>Solicitante: ' + ejecutiva_gestion_text + '<br>Cliente: ' + entity + '<br>Bien: ' + bien + '<br>Estado: Pendiente de Aprobación</p><p><br>Puedes revisarlo ingresando a: http://www.netsuite.com para aprobarlo.<br> </p>';
                const transactionLink = getTransactionLink(transactionId);
                body += '<a href="' + transactionLink + '"><strong>Ver Registro</strong></a>';

                // EMPLOYID.forEach(function (employees) {
                // sendEmail(ejecutiva_gestion, subject, body, arrayRecipients, ejecutiva_gestion, transactionId);
                // // });
                // var emailRecord = record.load({ type: SERVICE_ORDER, id: transactionId });
                // emailRecord.setValue({ fieldId: ConfirmacionEnvio, value: true });
                // emailRecord.setValue({ fieldId: 'custbody_ec_confirmacion_num_orden', value: true });
                // emailRecord.save();
                let arrayAllWorkOrders = getAllWorkOrders(transactionId)
                if (arrayAllWorkOrders) {
                    for (let index = 0; index < arrayAllWorkOrders.length; index++) {
                        const id = arrayAllWorkOrders[index].id;
                        log.debug('id', id);
                        record.submitFields({
                            type: 'customrecord_ht_record_ordentrabajo',
                            id: id,
                            values: {
                                custrecord_ht_ot_orden_serivicio_txt: tranID
                            }
                        })
                    }
                }
            } catch (e) {
                log.error({
                    title: `${FN} error`,
                    details: { message: `${FN} - ${e.message || `Unexpected error`}` },
                });
                throw { message: `${FN} - ${e.message || `Unexpected error`}` };
            }
        }

        const getTransactionLink = (transactionId) => {
            return 'https://' + url.resolveDomain({
                hostType: url.HostType.APPLICATION
            }) + '/app/accounting/transactions/salesord.nl?id=' + transactionId + '&whence=';
        }

        const getUserRoles = (role) => {
            let EMPLOYID = new Array();
            let employeeSearch = search.create({
                type: 'employee',
                columns: ['internalid'],
                filters: ['role', 'is', role]
            });
            let resultEmployee = employeeSearch.run().getRange(0, 1000);
            if (resultEmployee.length != 0) {
                for (var i in resultEmployee) {
                    let employeeID = resultEmployee[i].getValue({ name: 'internalid' });
                    EMPLOYID.push({ 'id': employeeID });
                }
            }
            return EMPLOYID;
        }

        const sendEmail = (paramUser, paramSubject, paramBody, paramArrayUsers, userId, transactionId) => {
            log.debug('sendEmail', `${paramUser}, ${paramSubject}, ${paramBody}, ${paramArrayUsers}, ${userId}`)
            try {
                email.send({
                    author: userId,
                    recipients: paramArrayUsers,
                    subject: paramSubject,
                    body: paramBody,
                    relatedRecords: {
                        transactionId: transactionId
                    }
                });
            } catch (error) {

            }
            // try {
            //     if (paramUser) {
            //         log.debug('paramUser-if', paramUser)
            //         paramArrayUsers.forEach(function (employees) {
            //             if (employees.id) {
            //                 try {
            //                     var employSearch = search.lookupFields({
            //                         type: 'employee',
            //                         id: employees.id,
            //                         columns: ['email', 'firstname', 'lastname']
            //                     });
            //                     emailResult = employSearch.email;
            //                     nameResult = employSearch.firstname + ' ' + employSearch.lastname;
            //                 } catch (msgerror) {
            //                     return true;
            //                 }
            //             }
            //             if (!emailResult) {
            //                 log.debug('function sendemail ', 'Usuario no tiene correo');
            //                 return true;
            //             }
            //             email.send({
            //                 author: employees.id,
            //                 recipients: emailResult,
            //                 subject: paramSubject,
            //                 body: paramBody
            //             });
            //         });
            //     } else {
            //         log.debug('paramUser-else', paramUser)
            //         try {
            //             var employSearch = search.lookupFields({
            //                 type: 'employee',
            //                 id: paramUser,
            //                 columns: ['email', 'firstname', 'lastname']
            //             });
            //             emailResult = employSearch.email;
            //             nameResult = employSearch.firstname + ' ' + employSearch.lastname;
            //         } catch (msgerror) {
            //             return true;
            //         }
            //         if (!emailResult) {
            //             log.debug('function sendemail ', 'Usuario no tiene correo');
            //             return true;
            //         }
            //         if (userId) {
            //             email.send({
            //                 author: userId,
            //                 recipients: emailResult,
            //                 subject: paramSubject,
            //                 body: paramBody
            //             });
            //         } else {
            //             email.send({
            //                 author: paramUser,
            //                 recipients: emailResult,
            //                 subject: paramSubject,
            //                 body: paramBody
            //             });
            //         }


            //         // log.debug('paramUser-else', paramUser)
            //         // paramArrayUsers.forEach(function (employees) {
            //         //     if (employees.id) {
            //         //         try {
            //         //             var employSearch = search.lookupFields({
            //         //                 type: 'employee',
            //         //                 id: employees.id,
            //         //                 columns: ['email', 'firstname', 'lastname']
            //         //             });

            //         //             emailResult = employSearch.email;
            //         //             nameResult = employSearch.firstname + ' ' + employSearch.lastname;
            //         //         } catch (msgerror) {
            //         //             return true;
            //         //         }
            //         //     }
            //         //     if (!emailResult) {
            //         //         log.debug('function sendemail ', 'Usuario no tiene correo');
            //         //         return true;
            //         //     }
            //         //     email.send({
            //         //         author: employees.id,
            //         //         recipients: emailResult,
            //         //         subject: paramSubject,
            //         //         body: paramBody
            //         //     });
            //         // })
            //     }
            // } catch (error) {
            //     log.error('sendConfirmUserEmail', error);
            // }
        }

        function processRegistro(registro) {
            if (!registro.confirmacionEnvioVenta && registro.aprobacionVenta === '2') {
                const rolGerente = 1786;
                const ConfirmacionEnvio = 'custbody_ec_confirmacion_envio_email_v';
                processTransaction(registro.tranid, rolGerente, ConfirmacionEnvio);
                //log.debug("entro caso 1 duplicados");
            }

            if (!registro.confirmacionEnvioCartera && registro.aprobacionCartera === '2') {
                const rolGerente = 1785;
                const ConfirmacionEnvio = 'custbody_ec_confirmacion_envio_email_c';
                processTransaction(registro.tranid, rolGerente, ConfirmacionEnvio);
                //log.debug("entro caso 3 duplicados");
            }
        }

        const getAllRoles = () => {
            let arrayRecipients = []
            let employeeSearchObj = search.create({
                type: "employee",
                filters:
                    [
                        ["role", "anyof", "1785", "1786"],
                        "AND",
                        ["isinactive", "is", "F"],
                        "AND",
                        ["subsidiary", "anyof", "2"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "email", label: "email" }),
                        search.createColumn({ name: "locationnohierarchy", label: "location" }),
                        search.createColumn({ name: "subsidiarynohierarchy", label: "subsidiary" }),
                        search.createColumn({ name: "role", label: "role" })
                    ]
            });
            let searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count", searchResultCount);
            let pagedData = employeeSearchObj.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach((pageRange) => {
                let myPage = pagedData.fetch({ index: pageRange.index });
                myPage.data.forEach((result) => {
                    arrayRecipients.push({
                        id: result.id,
                        email: result.getValue({ name: "email", label: "email" }),
                        location: result.getValue({ name: "locationnohierarchy", label: "location" }),
                        subsidiary: result.getValue({ name: "subsidiarynohierarchy", label: "subsidiary" }),
                        role: result.getValue({ name: "role", label: "role" })
                    })
                    return true;
                });
            });
            return arrayRecipients;
        }

        const getAllWorkOrders = (serviceOrder) => {
            let sql = "SELECT id FROM customrecord_ht_record_ordentrabajo WHERE custrecord_ht_ot_orden_servicio = ?"
            let params = [serviceOrder];
            let results = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
            log.debug('getAllWorkOrders', results);
            return results;
        }

        return {
            execute: execute
        };
    });

//2653,
//  Orden de Servicio OS1025000006 pendiente de aprobación por Venta,
// <p>Número de Documento: OS1025000006<br>Solicitante: E-2145 KEXIA YARITZA PRIAS SAMANIEGO<br>Cliente: C-EC-0931011894 LISSETTE CAROLINA VILLACRES HARO<br>Bien: 362797<br>Estado: Pendiente de Aprobación</p><p><br>Puedes revisarlo ingresando a: http://www.netsuite.com para aprobarlo.<br> </p><a href="https://7451241.app.netsuite.com/app/accounting/transactions/salesord.nl?id=436767&whence="><strong>Ver Registro</strong></a>,
// ,
// 2466