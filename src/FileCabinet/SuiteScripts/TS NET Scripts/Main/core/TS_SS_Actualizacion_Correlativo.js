/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/log', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/task'],
    /**
 * @param{email} email
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (email, log, query, record, runtime, search, task) => {
        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const PE_SERIE_RECORD = 'customrecordts_ec_series_impresion';
        const CUSTOM_TRANSACTION_FACTURA_INTERNA = "customsale_ec_factura_interna";
        const FACTURA = 'invoice';
        const SERVICE_ORDER = 'salesorder';
        // const FACTURA = 16;
        const execute = (scriptContext) => {
            const objContext = runtime.getCurrentScript();
            let flag = '';
            let json = new Array();
            let json2 = new Array();
            //let init = '0';
            try {
                let init = objContext.getParameter({ name: 'custscript_ht_punto_inicio' });
                init = (parseInt(init) + 1);
                log.debug('INIT', init);
                const sysdate = sysDate();
                const invoices = getInvoices(sysdate);
                if (invoices != 0) {
                    if (invoices.json.length != 0) {
                        log.debug('Invoices', invoices.json);
                        json = setRecords(invoices.json);
                        if (json.length != 0) {
                            flag = 'error';
                            log.debug('flag1', flag)
                            //sendEmail(flag, json);
                        } else {
                            flag = 'success';
                            log.debug('flag2', flag)
                            //sendEmail(flag, json);
                        }
                    } else {
                        log.debug('Debug', 'No presenta inconsistencias');
                        flag = 'voice';
                        //sendEmail(flag, json);
                    }

                    if (invoices.json2.length != 0) {
                        log.debug('Invoices2', invoices.json2);
                        json2 = verifiedRecord(invoices.json2);
                        if (json2.length != 0) {
                            flag = 'error';
                            log.debug('flag3', flag)
                            // sendEmail(flag, json2);
                        } else {
                            flag = 'success2';
                            // sendEmail(flag, json2);
                            log.debug('flag4', flag)
                        }
                    } else {
                        log.debug('Debug', 'No se encontraron duplicados');
                    }
                } else {
                    log.debug('Debug', 'No se encontraron registros');
                }

                try {
                    if (init < 3) {
                        let scheduledScript = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
                        scheduledScript.scriptId = 'customscript_ts_ss_actualizacion_correla';
                        scheduledScript.deploymentId = 'customdeploy_ts_ss_actualizacion_correla';
                        scheduledScript.params = { 'custscript_ht_punto_inicio': init };
                        scheduledScript.submit();
                    }
                } catch (error) {
                    log.debu('Error-Update',)
                }
            } catch (e) {
                log.error('Error-execute', e);
            }
        }

        const getInvoices = (sysdate) => {
            let json = new Array();
            let json2 = new Array();
            const from = sysdate + ' 0:00';
            const to = sysdate + ' 23:59';
            log.debug('Debug', from + ' - ' + to);
            try {
                let searchLoad = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "CustInvc", "CuTrSale112", SERVICE_ORDER],
                            "AND",
                            ["datecreated", "within", from, to]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", summary: "GROUP", label: "1 Internal ID" }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                //Cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                                // formula: "REGEXP_REPLACE(CONCAT({custbody_ts_ec_serie_cxc}, {custbody_ts_ec_numero_preimpreso}),'-','')",
                                formula: "REGEXP_REPLACE(CONCAT(CONCAT({custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_iniciales_tip_comprob},{custbody_ts_ec_serie_cxc.custrecord_ts_ec_series_impresion}),{custbody_ts_ec_numero_preimpreso}),'-','')",
                                label: "2 SERIE A ACTUALIZAR"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                //Cambio JCEC 2024-08-03 por error en la formula para Facturas Internas 
                                // formula: "REGEXP_REPLACE(REGEXP_REPLACE({tranid},'FA', ''),'-','')", 
                                formula: "REGEXP_REPLACE(REGEXP_REPLACE({tranid},CONCAT({custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_iniciales_tip_comprob},{custbody_ts_ec_serie_cxc.custrecord_ts_ec_series_impresion}), ''),'-','')",
                                label: "3 SERIE ACTUAL"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                //Cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                                // formula: "REGEXP_REPLACE (CONCAT('FA', CONCAT({custbody_ts_ec_serie_cxc},{custbody_ts_ec_numero_preimpreso})),'-','')",
                                formula: "REGEXP_REPLACE (CONCAT({custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_iniciales_tip_comprob}, CONCAT({custbody_ts_ec_serie_cxc},{custbody_ts_ec_numero_preimpreso})),'-','')",
                                label: "4 SERIE FINAL"
                            }),
                            search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", summary: "GROUP", label: "5 PE NUMBER" }),
                            search.createColumn({ name: "datecreated", summary: "GROUP", label: "6 FECHA CREACION" }),
                            search.createColumn({ name: "custrecordts_ec_iniciales_tip_comprob", join: "custbodyts_ec_tipo_documento_fiscal", summary: "GROUP", label: "7 SERIE" }),
                            search.createColumn({ name: "recordtype", summary: "GROUP", label: "8 RECORD TYPE" })
                        ]
                });
                const searchResultCount = searchLoad.runPaged().count;
                if (searchResultCount != 0) {
                    const searchResult = searchLoad.run().getRange({ start: 0, end: 1000 });
                    for (let j in searchResult) {
                        const column01 = searchResult[j].getValue(searchLoad.columns[0]);
                        const column02 = searchResult[j].getValue(searchLoad.columns[1]);
                        const column03 = searchResult[j].getValue(searchLoad.columns[2]);
                        const column04 = searchResult[j].getValue(searchLoad.columns[3]);
                        //cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                        const column05 = searchResult[j].getValue(searchLoad.columns[6]);
                        const column06 = searchResult[j].getValue(searchLoad.columns[7]);
                        if (column02 != column03) {
                            json.push({
                                internalid: column01,
                                serie: column02,
                                seriefinal: column04,
                                prefijo: column05,
                                transactionType: column06
                            });
                        } else {
                            json2.push({
                                internalid: column01,
                                serie: column02,
                                seriefinal: column04,
                                prefijo: column05,
                                transactionType: column06
                            });
                        }
                    }
                    return { json: json, json2: json2 };
                } else {
                    return 0;
                }
            } catch (e) {
                log.error('Error-getInvoices', e);
            }
        }

        const sysDate = () => {
            try {
                var date = new Date();
                var tdate = date.getDate();
                var month = date.getMonth() + 1; // jan = 0
                var year = date.getFullYear();
                return currentDate = tdate + '/' + month + '/' + year;
            } catch (e) {
                log.error('Error-sysDate', e);
            }
        }

        const setRecords = (invoices) => {
            let json = new Array();
            try {
                for (let i in invoices) {
                    let peDocumentType = '';
                    let peSerieValue = '';
                    let peSerie = '';
                    let recordType = invoices[i].transactionType == FACTURA ? FACTURA : (invoices[i].transactionType == SERVICE_ORDER ? SERVICE_ORDER : CUSTOM_TRANSACTION_FACTURA_INTERNA);
                    log.debug('recordType', recordType);
                    const recordLoad = record.load({ type: recordType, id: invoices[i].internalid, isDynamic: true, });
                    //cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                    // peDocumentType = recordLoad.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    peDocumentType = invoices[i].prefijo;
                    peSerie = recordLoad.getText({ fieldId: 'custbody_ts_ec_serie_cxc' });
                    peSerieValue = recordLoad.getValue({ fieldId: 'custbody_ts_ec_serie_cxc' });
                    recordLoad.setValue({ fieldId: 'tranid', value: invoices[i].seriefinal, ignoreFieldChange: true });
                    //cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                    recordLoad.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: peSerie, ignoreFieldChange: true });
                    const recordid = recordLoad.save();
                    const subLookup = search.lookupFields({ type: recordType, id: recordid, columns: ['tranid'] });
                    const tranid = subLookup.tranid;
                    if (tranid != invoices[i].seriefinal) {
                        const newrec = generateCorrelative(peSerieValue, peSerie, peDocumentType);
                        log.debug('NewRecord JCEC Set Record', newrec);
                        record.submitFields({
                            type: recordType,
                            id: recordid,
                            values: {
                                'custbody_ts_ec_numero_preimpreso': newrec.correlative,
                                //cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                                'custbody_ts_ec_serie_cxc': peSerie,
                                'tranid': newrec.newtranid
                            }
                        });
                        const subLookup2 = search.lookupFields({ type: recordType, id: recordid, columns: ['tranid'] });
                        const tranid2 = subLookup2.tranid;
                        if (tranid2 != newrec.newtranid) {
                            json.push(invoices[i].internalid);
                        }
                    }
                }
                return json;
            } catch (e) {
                log.error('Error-getInvoices', e);
            }
        }

        const verifiedRecord = (invoices2) => {
            let hash = new Array();
            let json = new Array();
            try {
                //! NO BORRAR, FUNCIÓN PARA ENCONTRAR DUPLICADOS ==========================================
                //===================================================================================
                // const busqueda = invoices2.reduce((acc, invoices2) => {
                //     acc[invoices2.serie] = ++acc[invoices2.serie] || 0;
                //     return acc;
                // }, {});

                // const duplicados = invoices2.filter((invoices2) => {
                //     return busqueda[invoices2.serie];
                // });
                //log.debug('Duplicados', duplicados);
                //===================================================================================
                const duplicados = invoices2.filter((current) => {
                    let exists = hash[current.serie];
                    hash[current.serie] = true;
                    return exists;
                });
                log.debug('Duplicados-Update', duplicados);
                for (let i in duplicados) {
                    let peDocumentType = '';
                    let peSerieValue = '';
                    let peSerie = '';
                    let recordType = duplicados[i].transactionType == FACTURA ? FACTURA : CUSTOM_TRANSACTION_FACTURA_INTERNA;
                    const recordLoad = record.load({ type: recordType, id: duplicados[i].internalid, isDynamic: true, });
                    //cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                    // peDocumentType = recordLoad.getValue({ fieldId: 'custbodyts_ec_tipo_documento_fiscal' });
                    peDocumentType = duplicados[i].prefijo;
                    peSerie = recordLoad.getText({ fieldId: 'custbody_ts_ec_serie_cxc' });
                    peSerieValue = recordLoad.getValue({ fieldId: 'custbody_ts_ec_serie_cxc' });
                    const newrec = generateCorrelative(peSerieValue, peSerie, peDocumentType);
                    log.debug('NewRecord JCEC Duplicados', newrec);
                    recordLoad.setValue({ fieldId: 'custbody_ts_ec_numero_preimpreso', value: newrec.correlative, ignoreFieldChange: true });
                    recordLoad.setValue({ fieldId: 'tranid', value: newrec.newtranid, ignoreFieldChange: true });
                    //cambio JCEC 2024-08-03 por error en la formula para Facturas Internas
                    recordLoad.setValue({ fieldId: 'custbody_ts_ec_serie_cxc', value: peSerie, ignoreFieldChange: true });
                    const recordid = recordLoad.save();
                    //record.submitFields({ type: record.Type.INVOICE, id: recordid, values: { 'tranid': newtranid } });
                    const subLookup = search.lookupFields({ type: recordType, id: recordid, columns: ['tranid'] });
                    const tranid = subLookup.tranid;
                    log.debug('NewRecord', 'id: ' + recordid + ' tranid: ' + newrec.newtranid);
                    if (tranid != newrec.newtranid) {
                        json.push(duplicados[i].internalid);
                    }
                }
                log.debug('JSON', json);
                return json;
            } catch (error) {
                log.error('Error-getInvoices', error);
            }
        }

        const generateCorrelative = (peSerieValue, peSerie, peDocumentType) => {
            let ceros;
            let newtranid = '';
            try {
                const numberLookup = search.lookupFields({ type: PE_SERIE_RECORD, id: peSerieValue, columns: ['custrecord_ts_ec_rango_inicial'] });
                const peinicio = parseInt(numberLookup.custrecord_ts_ec_rango_inicial);
                const next_number = peinicio + 1
                record.submitFields({ type: PE_SERIE_RECORD, id: peSerieValue, values: { 'custrecord_ts_ec_rango_inicial': next_number } });
                if (next_number.toString().length == 1) {
                    ceros = '00000000';
                }
                else if (next_number.toString().length == 2) {
                    ceros = '0000000';
                }
                else if (next_number.toString().length == 3) {
                    ceros = '000000';
                }
                else if (next_number.toString().length == 4) {
                    ceros = '00000';
                }
                else if (next_number.toString().length == 5) {
                    ceros = '0000';
                }
                else if (next_number.toString().length == 6) {
                    ceros = '000';
                }
                else if (next_number.toString().length == 7) {
                    ceros = '00';
                }
                else if (next_number.toString().length == 8) {
                    ceros = '0';
                } else if (next_number.toString().length >= 9) {
                    ceros = '';
                }
                const correlative = ceros + next_number;

                // if (peDocumentType == BOLETA) {
                //     newtranid = 'BV-' + peSerie + '-' + correlative;
                // } else 
                // if (peDocumentType == FACTURA) {
                newtranid = peDocumentType + peSerie.replace("-", ""); + correlative;
                // }
                return {
                    newtranid: newtranid,
                    correlative: correlative
                };
            } catch (error) {
                log.error('Error-generateCorrelative', error);
            }

        }

        const sendEmail = (flag, json) => {
            try {
                let body = '';
                const subject = 'Informe de proceso programado - Revisión de series y correlativos'
                const sysdate = sysDate();
                //const userObj = runtime.getCurrentUser();
                // const sessionObj = runtime.getCurrentSession();

                // log.debug('EmailUser', sessionObj.id + ' - ' + userObj.id);
                if (flag == 'error') {
                    body += '<p>Este es un mensaje automático de EVOL Latinoamerica.</p>';
                    body += '<p>Proceso programado ejecutado correctamente el <b>' + sysdate + '</b>, resumen: revisar las siguientes facturas(ID): <b>' + json + '</b></p>';
                } else if (flag == 'success') {
                    body += '<p>Este es un mensaje automático de EVOL Latinoamerica.</p>';
                    body += '<p>Proceso programado ejecutado correctamente el <b>' + sysdate + '</b>, resumen: <b>facturas corregidas correctamente</b></p>';
                } else if (flag == 'success2') {
                    body += '<p>Este es un mensaje automático de EVOL Latinoamerica.</p>';
                    body += '<p>Proceso programado ejecutado correctamente el <b>' + sysdate + '</b>, resumen: <b>No se encontraron duplicados</b></p>';
                } else {
                    body += '<p>Este es un mensaje automático de EVOL Latinoamerica.</p>';
                    body += '<p>Proceso programado ejecutado correctamente el <b>' + sysdate + '</b>, resumen: <b>No presenta inconsistencias</b></p>';
                }

                email.send({
                    author: 5676, //! PROD 
                    //author: 517, //! SANDBOX
                    recipients: [11, -5, 97918, 2420, 517], //! PROD
                    //recipients: [517], //! SANDBOX
                    subject: subject,
                    body: body
                });
            } catch (e) {
                log.error('Error-sendEmail', e);
            }
        }

        return { execute }

    });