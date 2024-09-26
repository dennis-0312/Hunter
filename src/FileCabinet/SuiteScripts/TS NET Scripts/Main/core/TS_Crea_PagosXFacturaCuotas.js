/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record', 'N/https', 'N/runtime'], (log, search, record, https, runtime) => {

    const beforeLoad = (context) => {
        try {
            var newRecord = context.newRecord;
            var customerpayment =
                record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: context.request.parameters.inv, //idFactura
                    toType: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });
            var idFacturaBefore;
            var nroCuotaFacturaBefore;
            var linecount = customerpayment.getLineCount({ sublistId: 'apply' });
            var datosFactura = getCuotasFactura(context.request.parameters.inv);

            if (getListCuotas().includes(datosFactura[0].terms)) {
                newRecord.setValue({ fieldId: 'custbody_ec_diferido', value: true });
                newRecord.setValue({ fieldId: 'custbody_ec_cuotas_dif', value: parseInt(getCuotaXtermino(datosFactura[0].terms)) }); //TotalCuotas

                for (var x = 0; x < linecount; x++) {
                    customerpayment.selectLine({ sublistId: 'apply', line: x });
                    idFacturaBefore = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'internalid' });
                    nroCuotaFacturaBefore = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'installmentnumber' });
                    applyBefore = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply' });

                    if (idFacturaBefore == context.request.parameters.inv && applyBefore && nroCuotaFacturaBefore !== "") {
                        newRecord.setValue({ fieldId: 'custbody_ec_nro_cuota', value: parseInt(nroCuotaFacturaBefore) });
                        break;
                    }
                }
            }
            newRecord.setValue({ fieldId: 'custbody_ec_nro_factura', value: datosFactura[0].tranid });
            newRecord.setValue({ fieldId: 'custbody_ec_fecha_vencimiento', value: datosFactura[0].duedate });
        } catch (error) {
            log.debug("Error beforeLoad", error.message);
        }
    }

    const beforeSubmit = (context) => {
        log.debug("BeforeSubmited", context.type);
    }

    const afterSubmit = (context) => {
        try {
            var newRecord = context.newRecord; // Obtener el registro de pago de cliente (Customer Payment)
            var currentUser = runtime.getCurrentUser();
            var userName = currentUser.name;
            //
            var idFacturaPantalla = -1;
            var cuotas = Number(newRecord.getValue({ fieldId: 'custbody_ec_cuotas_dif' }));
            var iniciaCuota = Number(newRecord.getValue({ fieldId: 'custbody_ec_nro_cuota' })) + 1;
            var idFactura;
            var nroCuotaFactura;
            var indice = 0;

            // Carga el número total de líneas en la sublista 'apply'
            var applySublistCount = newRecord.getLineCount({
                sublistId: 'apply'
            });
            // Iterar sobre cada línea de la sublista 'apply' y halla ID de la factura de la cuota 1
            for (var line = 0; line < applySublistCount; line++) {

                applyValue = newRecord.getSublistValue({
                    sublistId: 'apply',  // ID de la sublista en la que deseas operar
                    fieldId: 'apply',  // ID del campo del que deseas obtener el valor actual
                    line: line
                });

                //Encuentra la factura que esté con el flag activado
                if (applyValue == true) {
                    idFacturaPantalla = newRecord.getSublistValue({
                        sublistId: 'apply',  // ID de la sublista en la que deseas operar
                        fieldId: 'internalid',  // ID del campo del que deseas obtener el valor actual
                        line: line
                    });
                    log.debug("idFacturaPantalla", idFacturaPantalla);
                    break;
                }
            }
            var datosFactura = getCuotasFactura(idFacturaPantalla);

            if (context.type === context.UserEventType.CREATE  && getListCuotas().includes(datosFactura[0].terms)
                //&& userName == 'E-00000005 Juan Chavez' //Usar para dar mantenimiento
            ) {
                log.debug('Entry');
                //<I> Inserta Pago por la cantidad de nros de cuotas
                for (var i = iniciaCuota; i <= cuotas; i++) {

                    var customerpayment = record.transform({
                        fromType: record.Type.INVOICE,
                        fromId: idFacturaPantalla,
                        toType: record.Type.CUSTOMER_PAYMENT,
                        isDynamic: true
                    });

                    // Carga el número total de líneas en la sublista 'apply'
                    var linecount = customerpayment.getLineCount({ sublistId: 'apply' });
                    log.debug("Cuotas", "Cuotas totales: " + cuotas + " -> Inicia cuota: " + iniciaCuota);

                    // Iterar sobre cada línea de la sublista 'apply' para hallar la factura de la sgte cuota
                    for (var j = 0; j < linecount; j++) {

                        customerpayment.selectLine({ sublistId: 'apply', line: j });
                        idFactura = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'internalid' });
                        nroCuotaFactura = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'installmentnumber' });
                        totalFactura = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'total' });
                        fVencimientoFactura = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'applyduedate' });
                        nroReferenciaFactura = customerpayment.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'refnum' });
                        //log.debug("totalFactura", totalFactura);

                        if (idFactura == idFacturaPantalla && nroCuotaFactura == i) {
                            log.debug("idFactura", idFactura);
                            log.debug("nroCuotaFactura", nroCuotaFactura);
                            log.debug("Linea", j);
                            // ********** Inserta datos **********
                            //Información principal
                            customerpayment.setValue({ fieldId: 'customform', value: newRecord.getValue({ fieldId: 'customform' }) });//129
                            ///customerpayment.setValue({ fieldId: 'customer', value: newRecord.getValue({ fieldId: 'customer' }) });//432
                            ///customerpayment.setValue({ fieldId: 'trandate', value: newRecord.getValue({ fieldId: 'trandate' }) });
                            ///customerpayment.setValue({ fieldId: 'postingperiod', value: newRecord.getValue({ fieldId: 'postingperiod' }) });
                            ///customerpayment.setValue({ fieldId: 'currency', value: newRecord.getValue({ fieldId: 'currency' }) });//1
                            ///customerpayment.setValue({ fieldId: 'exchangerate', value: newRecord.getValue({ fieldId: 'exchangerate' }) });//1.00
                            ///customerpayment.setValue({ fieldId: 'aracct', value: newRecord.getValue({ fieldId: 'aracct' }) });//1425
                            customerpayment.setValue({ fieldId: 'undepfunds', value: newRecord.getValue({ fieldId: 'undepfunds' }) });//T
                            customerpayment.setValue({ fieldId: 'memo', value: newRecord.getValue({ fieldId: 'memo' }) + ' - CUOTA ' + i });//GLOSA
                            //Clasificación
                            customerpayment.setValue({ fieldId: 'department', value: newRecord.getValue({ fieldId: 'department' }) });//46
                            customerpayment.setValue({ fieldId: 'class', value: newRecord.getValue({ fieldId: 'class' }) });//6
                            customerpayment.setValue({ fieldId: 'location', value: newRecord.getValue({ fieldId: 'location' }) });//5
                            //Caja
                            customerpayment.setValue({ fieldId: 'custbody_ec_report_type', value: newRecord.getValue({ fieldId: 'custbody_ec_report_type' }) });//4
                            customerpayment.setValue({ fieldId: 'custbody_ec_number_er', value: newRecord.getValue({ fieldId: 'custbody_ec_number_er' }) });//5
                            customerpayment.setValue({ fieldId: 'custbody_ts_ec_metodo_pago', value: newRecord.getValue({ fieldId: 'custbody_ts_ec_metodo_pago' }) });//4
                            //Importe Retenciones
                            customerpayment.setValue({ fieldId: 'custbody_pag_comision', value: newRecord.getValue({ fieldId: 'custbody_pag_comision' }) });
                            customerpayment.setValue({ fieldId: 'custbody_pag_iva', value: newRecord.getValue({ fieldId: 'custbody_pag_iva' }) });
                            customerpayment.setValue({ fieldId: 'custbody_pag_ir', value: newRecord.getValue({ fieldId: 'custbody_pag_ir' }) });
                            //Registro de Retenciones
                            customerpayment.setValue({ fieldId: 'custbodyts_ec_doc_type_ref', value: newRecord.getValue({ fieldId: 'custbodyts_ec_doc_type_ref' }) });
                            customerpayment.setValue({ fieldId: 'custbodyts_ec_doc_serie_ref', value: newRecord.getValue({ fieldId: 'custbodyts_ec_doc_serie_ref' }) });
                            customerpayment.setValue({ fieldId: 'custbodyts_ec_doc_number_ref', value: newRecord.getValue({ fieldId: 'custbodyts_ec_doc_number_ref' }) });
                            customerpayment.setValue({ fieldId: 'custbodyts_ec_num_autorizacion', value: newRecord.getValue({ fieldId: 'custbodyts_ec_num_autorizacion' }) });
                            customerpayment.setValue({ fieldId: 'custpage_entity_banks_list', value: newRecord.getValue({ fieldId: 'custpage_entity_banks_list' }) });
                            customerpayment.setValue({ fieldId: 'custbody_11187_pref_ebd_details', value: newRecord.getValue({ fieldId: 'custbody_11187_pref_ebd_details' }) });
                            //Metodo de Pago
                            customerpayment.setValue({ fieldId: 'paymentoption', value: newRecord.getValue({ fieldId: 'paymentoption' }) });//16
                            customerpayment.setValue({ fieldId: 'custbody2', value: newRecord.getValue({ fieldId: 'custbody2' }) });//2
                            customerpayment.setValue({ fieldId: 'custbodyht_pago_emisor', value: newRecord.getValue({ fieldId: 'custbodyht_pago_emisor' }) });//2
                            customerpayment.setValue({ fieldId: 'custbody_ht_pago_ntarjeta', value: newRecord.getValue({ fieldId: 'custbody_ht_pago_ntarjeta' }) });//4543534
                            customerpayment.setValue({ fieldId: 'custbody_ht_pago_voucher', value: newRecord.getValue({ fieldId: 'custbody_ht_pago_voucher' }) });//4543535
                            customerpayment.setValue({ fieldId: 'custbody_ec_diferido', value: newRecord.getValue({ fieldId: 'custbody_ec_diferido' }) });
                            customerpayment.setValue({ fieldId: 'custbody_ec_cuotas_dif', value: cuotas });

                            customerpayment.setValue({ fieldId: 'custbody_ec_nro_factura', value: nroReferenciaFactura });
                            customerpayment.setValue({ fieldId: 'custbody_ec_fecha_vencimiento', value: fVencimientoFactura });
                            customerpayment.setValue({ fieldId: 'custbody_ec_nro_cuota', value: parseInt(nroCuotaFactura) });
                            //Apply
                            customerpayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', line: j, value: true });
                            customerpayment.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: totalFactura });

                            var cpId = customerpayment.save({ enableSourcing: true, ignoreMandatoryFields: true });
                            let objRecord = record.load({
                                type: record.Type.CUSTOMER_PAYMENT,
                                id: cpId,
                                isDynamic: true,
                            });
                            log.debug('objRecord', objRecord)
                            log.debug("afterSubmit", "Cuota: " + i + ". Creado correctamente!");
                        }
                    }
                    log.debug("indice", indice);
                    indice = 0;

                }
                //<F> Inserta Pago
            }

        } catch (error) {
            log.debug("ERROR - afterSubmit", error);
        }

    }

    function getListCuotas() {
        var ids = [];
        try {
            // Crear la búsqueda
            var searchObj = search.create({
                type: 'customrecord_ht_termino_diferido',
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_termino", label: "Termino" })
                    ]
            });

            // Ejecutar la búsqueda y recorrer los resultados
            searchObj.run().each(function (result) {
                ids.push(result.getText('custrecord_ht_termino'));
                return true;
            });

        } catch (e) {
            log.error('Error (getListCuotas):', e.message);
        }
        return ids;
    }

    const getCuotasFactura = (idFactura) => {
        let respuesta = [];
        try {
            let subsidiarySearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["mainline", "is", "T"],
                        "AND",
                        ["internalid", "is", idFactura]
                    ],
                columns:
                    [
                        search.createColumn({ name: "terms", label: "terms" }),
                        search.createColumn({ name: "duedate", label: "duedate" }),
                        search.createColumn({ name: "tranid", label: "tranid" })
                    ]
            });

            let searchResult = subsidiarySearchObj.run().getRange({ start: 0, end: 1 });

            // Verificar si hay al menos una página de resultados
            if (searchResult.length > 0) {
                let result = searchResult[0];
                respuesta.push({
                    "terms": result.getText({ name: "terms" }),
                    "duedate": result.getValue({ name: "duedate" }),
                    "tranid": result.getValue({ name: "tranid" })
                });
            }

            return respuesta;

        } catch (error) {
            log.error('Error (getCuotasFactura):', error);
            return error.message;
        }
    }

    function getCuotaXtermino(termino) {
        var ids = [];
        try {
            // Crear la búsqueda
            var searchObj = search.create({
                type: 'term',
                filters: [
                    ["name", "contains", termino]  // Filtrar términos que contienen el valor de 'termino'
                ],
                columns: [
                    search.createColumn({ name: "recurrencecount", label: "recurrencecount" })
                ]
            });

            // Ejecutar la búsqueda y recorrer los resultados
            searchObj.run().each(function (result) {
                ids.push(result.getValue('recurrencecount'));  // Obtener el valor del campo 'name'
                return true;  // Continuar con la siguiente iteración
            });

        } catch (e) {
            log.error('Error (getCuotaXtermino):', e.message);
        }

        return ids;
    }

    return {
        beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});