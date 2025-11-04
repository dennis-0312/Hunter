/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/search', 'N/file', 'N/runtime', './class/Params'], function (record, log, search, file, runtime, Parameters) {

    // Constante con los tipos de documentos que deben generar retenciones
    const TIPOS_DOCUMENTOS_RETENCION = ['50']; // 50 = Factura. Agregar otros tipos aquí si es necesario

    // Constante con los códigos de impuesto que deben generar retenciones
    const CODIGOS_IMPUESTO_RETENCION = ['IGV_PE:S-PE']; // Agregar otros códigos de impuesto aquí si es necesario

    const afterSubmit = (context) => {
        try {
            log.audit('Iniciando proceso', 'Evaluando creación de comprobante de retención');
            const parameter = new Parameters();
            parameter.felPlantilla = 'custscript_pe_ei_fel_template';
            parameter.felMetodoEnvio = 'custscript_pe_ei_fel_sending_method';
            parameter.codRentencionImpuestos = 'custscript_pe_ue_retencion_cod';
            parameter.tipoComprobanteRetencion = 'custscript_pe_ue_retencion_type_doc';
            parameter.formRetencion = 'custscript_pe_ue_retencion_form';
            parameter.cuentaContable = 'custscript_pe_ue_retencion_account';
            parameter.folderOutputFiles = 'custscript_pe_ei_fel_output_files';
            parameter.importeMinimo = 'custscript_pe_ue_importe_minimo';
            parameter.taxCode = 'custscript_pe_ue_tax_code'

            const getData = parameter.getFieldValues(parameter);

            let PE_EI_FEL_PLANTILLA = getData.felPlantilla;
            let PE_EI_FEL_SENDING_METHOD = getData.felMetodoEnvio;
            let COD_RETENCION_IMPUESTOS = getData.codRentencionImpuestos;
            let TIPO_COMPROBANTE_RET = getData.tipoComprobanteRetencion;
            let CUSTOM_FORM_RETENCION = getData.formRetencion;
            let CUENTA_CONTABLE = getData.cuentaContable;
            let IMPORTE_MINIMO = getData.importeMinimo;
            let ID_TAXCODE = getData.taxCode;

            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.PAYBILLS || context.type === context.UserEventType.EDIT) {
                let generaComprobanteRetencion = false;
                let total_retencion = 0;
                let total_facturas_involucradas = 0;

                const currentRecord = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true });
                const entity = currentRecord.getValue('entity');
                const exchangerate = currentRecord.getValue('exchangerate');
                const currency = currentRecord.getValue('currency');
                const department = currentRecord.getValue('department');
                const class_ = currentRecord.getValue('class');
                const location = currentRecord.getValue('location');
                const applyCount = currentRecord.getLineCount({ sublistId: 'apply' });
                const subsidiary = currentRecord.getValue('subsidiary');
                const cuenta = currentRecord.getValue('apacct');

                // Verificar si la subsidiaria está configurada como agente de retención
                const subsidiarySearch = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subsidiary,
                    columns: ['custrecord_pe_is_wht_agent']
                });

                const custrecord_pe_is_wht_agent = subsidiarySearch.custrecord_pe_is_wht_agent;
                log.audit('Subsidiaria configuración', 'Subsidiary ID: ' + subsidiary + ', Agente Retención: ' + custrecord_pe_is_wht_agent);

                if (custrecord_pe_is_wht_agent == "true" || custrecord_pe_is_wht_agent == true) {
                    log.audit('Retención aplicable', 'Subsidiary: ' + subsidiary + ' - Procesando retención');

                    // Obtener datos del vendor en una sola operación
                    const vendorData = search.lookupFields({
                        type: record.Type.VENDOR,
                        id: entity,
                        columns: [
                            'custentity_4601_defaultwitaxcode',
                            'custentity_pe_is_wh_agent',
                            'custentity_pe_is_good_contributor',
                            'custentity_pe_sujeto_retencion'
                        ]
                    });

                    log.debug('Vendor data raw', JSON.stringify(vendorData));

                    // Extraer valores correctamente (manejar tanto valores directos como objetos)
                    let CodRetencionImpuestos = vendorData.custentity_4601_defaultwitaxcode;
                    if (CodRetencionImpuestos && typeof CodRetencionImpuestos === 'object') {
                        // Si es un array, tomar el primer elemento
                        if (Array.isArray(CodRetencionImpuestos) && CodRetencionImpuestos.length > 0) {
                            CodRetencionImpuestos = CodRetencionImpuestos[0].value || CodRetencionImpuestos[0];
                        }
                        // Si es un objeto con propiedad value
                        else if (CodRetencionImpuestos.value) {
                            CodRetencionImpuestos = CodRetencionImpuestos.value;
                        }
                        // Si es un objeto con propiedad text e id
                        else if (CodRetencionImpuestos.text && CodRetencionImpuestos.id) {
                            CodRetencionImpuestos = CodRetencionImpuestos.id;
                        }
                    }

                    // Convertir a string para comparación
                    CodRetencionImpuestos = String(CodRetencionImpuestos || '').trim();

                    const peAgenteRetencion = vendorData.custentity_pe_is_wh_agent;
                    const peBuenContriBuyente = vendorData.custentity_pe_is_good_contributor;
                    const peSujetoRetencion = vendorData.custentity_pe_sujeto_retencion;

                    log.audit('Validación proveedor', 'Vendor ID: ' + entity +
                        ', Código Retención: ' + CodRetencionImpuestos +
                        ', Es Agente: ' + peAgenteRetencion +
                        ', Buen Contribuyente: ' + peBuenContriBuyente +
                        ', Sujeto Retención: ' + peSujetoRetencion);

                    log.debug('Comparación códigos', 'CodRetencionImpuestos: "' + CodRetencionImpuestos + '" (tipo: ' + typeof CodRetencionImpuestos + '), COD_RETENCION_IMPUESTOS: "' + COD_RETENCION_IMPUESTOS + '" (tipo: ' + typeof COD_RETENCION_IMPUESTOS + ')');

                    if (CodRetencionImpuestos == COD_RETENCION_IMPUESTOS && peAgenteRetencion != true && peBuenContriBuyente != true && peSujetoRetencion == true) {
                        const referencias = [];
                        log.audit('Procesando facturas', 'Total items a revisar: ' + applyCount);

                        // Recopilar todas las facturas aplicables primero
                        const facturasParaValidar = [];
                        for (let i = 0; i < applyCount; i++) {
                            const apply = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                            const trantype = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'trantype', line: i });

                            if ((apply === true || apply === "T") && trantype === 'VendBill') {
                                const idFactura = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i });
                                const refnum = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'refnum', line: i });
                                const total = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'total', line: i });
                                const amount = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: i });
                                const fec_emi_fc = currentRecord.getSublistValue({ sublistId: 'apply', fieldId: 'applydate', line: i });

                                facturasParaValidar.push({
                                    line: i,
                                    amount: amount,
                                    trantype: trantype,
                                    id: idFactura,
                                    refnum: refnum,
                                    total: total,
                                    fec_emi_fc: fec_emi_fc
                                });
                            }
                        }

                        log.audit('Facturas encontradas', 'Total facturas aplicables: ' + facturasParaValidar.length);

                        // Validación masiva de tipos de documento y códigos de impuesto
                        const facturasValidadas = validarFacturasMasivo(facturasParaValidar);

                        // Crear referencias finales solo para facturas válidas, validando importes por líneas gravadas
                        facturasValidadas.forEach(function (factura) {
                            // Verificar líneas gravadas para calcular importe real sujeto a retención
                            const importeLineasGravadas = calcularImporteLineasGravadas(factura.id);
                            let importe_sujeto_retencion = importeLineasGravadas;

                            // Convertir a soles si es necesario
                            if (currency == 1) {
                                importe_sujeto_retencion = importe_sujeto_retencion * parseFloat(exchangerate);
                            }

                            // Solo agregar facturas cuyas líneas gravadas individualmente superen el mínimo
                            if (importe_sujeto_retencion >= IMPORTE_MINIMO) {
                                const referencia = {
                                    line: factura.line,
                                    amount: factura.amount,
                                    trantype: factura.trantype,
                                    id: factura.id,
                                    refnum: factura.refnum,
                                    importe_original_soles: parseFloat(factura.total).toFixed(2), // Total factura para referencia
                                    importe_pagado_soles: parseFloat(factura.amount).toFixed(2),
                                    importe_gravado_soles: importe_sujeto_retencion.toFixed(2), // Solo líneas gravadas
                                    fec_emi_fc: factura.fec_emi_fc
                                };

                                referencias.push(referencia);
                                total_facturas_involucradas += importe_sujeto_retencion; // Sumar solo líneas gravadas

                                log.debug('Factura válida agregada', 'ID: ' + factura.id + ' (' + factura.refnum + ') - Total factura: ' + factura.total + ', Líneas gravadas: ' + importe_sujeto_retencion.toFixed(2) + ' >= Mínimo: ' + IMPORTE_MINIMO);
                            } else {
                                log.debug('Factura omitida por importe gravado', 'ID: ' + factura.id + ' (' + factura.refnum + ') - Total factura: ' + factura.total + ', Líneas gravadas: ' + importe_sujeto_retencion.toFixed(2) + ' < Mínimo: ' + IMPORTE_MINIMO);
                            }
                        });
                        log.audit('Facturas válidas encontradas', 'Total: ' + referencias.length + ' facturas para evaluar retención');

                        if (referencias.length === 0) {
                            log.audit('Sin facturas válidas', 'No se creará comprobante - ninguna factura cumple TODOS los criterios: tipo documento (facturas) + código impuesto (IGV_PE:S-PE)');
                        } else {
                            if (currency == 1) {
                                total_facturas_involucradas = total_facturas_involucradas * parseFloat(exchangerate);
                            }
                            log.audit('Validación importe mínimo', 'Total facturas: ' + total_facturas_involucradas + ', Mínimo requerido: ' + IMPORTE_MINIMO);

                            if (total_facturas_involucradas >= IMPORTE_MINIMO) {
                                // Optimización: Cargar datos de facturas en lotes para reducir record.load calls
                                const facturasPorProcesar = referencias.filter(ref => ref.trantype === 'VendBill');

                                if (facturasPorProcesar.length > 0) {
                                    // Obtener datos básicos de todas las facturas en una sola búsqueda
                                    const datosFacturasSearch = search.create({
                                        type: record.Type.VENDOR_BILL,
                                        filters: [
                                            ['internalid', 'anyof', facturasPorProcesar.map(f => f.id)]
                                        ],
                                        columns: [
                                            'internalid',
                                            'postingperiod',
                                            'trandate',
                                            'custbody_pe_concept_detraction'
                                        ]
                                    });

                                    const datosFacturas = {};
                                    datosFacturasSearch.run().each(function (result) {
                                        const id = result.getValue('internalid');
                                        datosFacturas[id] = {
                                            periodo_cod: result.getValue('postingperiod'),
                                            periodo_des: result.getText('postingperiod'),
                                            trandate: result.getText('trandate'),
                                            codeDetraccion: result.getText('custbody_pe_concept_detraction')
                                        };
                                        return true;
                                    });

                                    log.debug('Datos facturas obtenidos', 'Total facturas con datos: ' + Object.keys(datosFacturas).length);

                                    // Obtener todos los periodos únicos para hacer búsquedas agrupadas
                                    const periodosUnicos = [...new Set(
                                        Object.values(datosFacturas)
                                            .filter(datos => datos.periodo_cod)
                                            .map(datos => datos.periodo_cod)
                                    )];

                                    // Búsqueda masiva de detracciones por periodo
                                    const facturasDetraccionPorPeriodo = {};

                                    if (periodosUnicos.length > 0) {
                                        const facturaSearch_det = search.load({ id: 'customsearch_pe_facturas_proveedor_det_2' });
                                        facturaSearch_det.filters.push(search.createFilter({ name: 'entity', operator: search.Operator.IS, values: entity }));
                                        facturaSearch_det.filters.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: periodosUnicos }));

                                        const resultSet_det = facturaSearch_det.run();

                                        resultSet_det.each(function (result) {
                                            const internalid = result.getValue({ name: 'internalid', summary: search.Summary.GROUP });
                                            const periodo = result.getValue({ name: 'postingperiod', summary: search.Summary.GROUP });

                                            if (!facturasDetraccionPorPeriodo[periodo]) {
                                                facturasDetraccionPorPeriodo[periodo] = new Set();
                                            }
                                            facturasDetraccionPorPeriodo[periodo].add(internalid);
                                            return true;
                                        });

                                        log.debug('Detracciones por periodo', 'Periodos procesados: ' + Object.keys(facturasDetraccionPorPeriodo).length);
                                    }

                                    // Aplicar los datos a las referencias
                                    referencias.forEach(function (referencia, index) {
                                        if (referencia.trantype === 'VendBill' && datosFacturas[referencia.id]) {
                                            const datos = datosFacturas[referencia.id];
                                            referencias[index].periodo_cod = datos.periodo_cod;
                                            referencias[index].periodo_des = datos.periodo_des;
                                            referencias[index].trandate = datos.trandate;

                                            // Verificar si está en la lista de detracciones
                                            const facturasDetraccion = facturasDetraccionPorPeriodo[datos.periodo_cod] || new Set();
                                            const esFacturaDetraccion = facturasDetraccion.has(referencia.id);

                                            referencias[index].esFacturaDetraccion = esFacturaDetraccion;

                                            // Aplicar lógica de retención
                                            if (!esFacturaDetraccion && String(datos.codeDetraccion).toUpperCase() === '000 SIN DETRACCION') {
                                                referencias[index].aplica_retencion = true;
                                                generaComprobanteRetencion = true;
                                                const retencion_item = (parseFloat(referencia.importe_pagado_soles) * 0.03).toFixed(2);
                                                referencias[index].retencion_item = retencion_item;
                                                total_retencion = total_retencion + parseFloat(retencion_item);
                                            } else {
                                                referencias[index].aplica_retencion = false;
                                                referencias[index].retencion_item = 0;
                                            }
                                        }
                                    });
                                }

                                // Procesar facturas sin datos (fallback individual)
                                for (let i = 0; i < referencias.length; i++) {
                                    if (referencias[i].trantype === 'VendBill' && !referencias[i].hasOwnProperty('periodo_cod')) {
                                        log.debug('Procesando factura individual', 'ID: ' + referencias[i].id + ' - Usando método fallback');

                                        let aplica_retencion = false;
                                        let retencion_item = 0;
                                        const id_factura_actual = referencias[i].id;
                                        let esFacturaDetraccion = false;
                                        let codeDetraccion = null;

                                        // Solo usar record.load como último recurso
                                        const vendorBillRecord = record.load({ type: record.Type.VENDOR_BILL, id: referencias[i].id });
                                        const periodo = vendorBillRecord.getValue({ fieldId: 'postingperiod' });
                                        const periodoDescripcion = vendorBillRecord.getText({ fieldId: 'postingperiod' });
                                        const trandate = vendorBillRecord.getText({ fieldId: 'trandate' });
                                        codeDetraccion = vendorBillRecord.getText({ fieldId: 'custbody_pe_concept_detraction' });
                                        referencias[i].periodo_cod = periodo;
                                        referencias[i].periodo_des = periodoDescripcion;
                                        referencias[i].trandate = trandate;

                                        if (referencias[i].periodo_des != null && referencias[i].periodo_des != "") {
                                            const facturaSearch_det = search.load({ id: 'customsearch_pe_facturas_proveedor_det_2' });
                                            facturaSearch_det.filters.push(search.createFilter({ name: 'entity', operator: search.Operator.IS, values: entity }));
                                            facturaSearch_det.filters.push(search.createFilter({ name: 'postingperiod', operator: search.Operator.IS, values: referencias[i].periodo_cod }));
                                            const resultSet_det = facturaSearch_det.run();

                                            resultSet_det.each(function (result) {
                                                const internalid = result.getValue({ name: 'internalid', summary: search.Summary.GROUP });
                                                if (id_factura_actual == internalid) {
                                                    esFacturaDetraccion = true;
                                                }
                                                return true;
                                            });

                                            referencias[i].esFacturaDetraccion = esFacturaDetraccion;
                                            if (!esFacturaDetraccion && String(codeDetraccion).toUpperCase() === '000 SIN DETRACCION') {
                                                aplica_retencion = true;
                                                generaComprobanteRetencion = true;
                                                total_retencion = total_retencion + parseFloat(referencias[i].importe_pagado_soles) * 0.03;
                                                retencion_item = (parseFloat(referencias[i].importe_pagado_soles) * 0.03).toFixed(2);
                                            }
                                        }
                                        referencias[i].aplica_retencion = aplica_retencion;
                                        referencias[i].retencion_item = retencion_item;
                                    }
                                }

                                log.audit('Evaluación de retenciones', 'Facturas procesadas: ' + referencias.length + ', Con retención: ' + referencias.filter(r => r.aplica_retencion).length);

                                if (generaComprobanteRetencion) {
                                    log.audit('Creando comprobante', 'Se creará Comprobante de Retención por: ' + total_retencion.toFixed(2));
                                    total_retencion = total_retencion.toFixed(2);

                                    const vendorCredit = record.create({
                                        type: record.Type.VENDOR_CREDIT,
                                        isDynamic: true
                                    });

                                    vendorCredit.setValue('customform', CUSTOM_FORM_RETENCION);
                                    vendorCredit.setValue('entity', entity);
                                    vendorCredit.setValue('account', cuenta);
                                    vendorCredit.setValue('subsidiary', subsidiary);
                                    vendorCredit.setValue('custbody_pe_document_type', TIPO_COMPROBANTE_RET);
                                    vendorCredit.setValue('total', total_retencion);
                                    vendorCredit.setValue('memo', 'Comprobante de Retención');
                                    vendorCredit.setValue('currency', currency);

                                    const searchLoad = search.create({
                                        type: 'customrecord_pe_serie', filters: [
                                            ['custrecord_pe_tipo_documento_serie', 'is', TIPO_COMPROBANTE_RET],
                                            'AND',
                                            ['custrecord_pe_location', 'is', location],
                                            'AND',
                                            ['custrecord_pe_subsidiaria', 'is', subsidiary]
                                        ],
                                        columns: [
                                            'custrecord_pe_serie_impresion',
                                            'custrecord_pe_inicio',
                                            'internalid'
                                        ]
                                    });
                                    const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });

                                    if (!searchResult || searchResult.length === 0) {
                                        throw new Error('No se encontró registro de serie para: Tipo=' + TIPO_COMPROBANTE_RET + ', Location=' + location + ', Subsidiary=' + subsidiary);
                                    }

                                    const serie = searchResult[0].getValue(searchLoad.columns[0]);
                                    const correlativo = (searchResult[0].getValue(searchLoad.columns[1]) + "").padStart(8, '0');
                                    const corrltv = parseInt(searchResult[0].getValue(searchLoad.columns[1]));
                                    const recordId = searchResult[0].getValue(searchLoad.columns[2]);
                                    const record1 = record.load({ type: 'customrecord_pe_serie', id: recordId });
                                    record1.setValue({ fieldId: 'custrecord_pe_inicio', value: (corrltv + 1) + "" });
                                    record1.save();

                                    const location_value = location;
                                    vendorCredit.setValue('custbody_pe_serie_cxp', serie);
                                    vendorCredit.setValue('custbody_pe_number', correlativo);
                                    vendorCredit.setValue('department', department);
                                    vendorCredit.setValue('class', class_);
                                    vendorCredit.setValue('location', location_value);
                                    vendorCredit.setValue('tranid', 'PE-' + serie + "-" + correlativo);

                                    referencias.forEach(function (dataItem) {
                                        if (dataItem.aplica_retencion) {
                                            vendorCredit.selectNewLine({ sublistId: 'expense' });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'account', value: CUENTA_CONTABLE });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: dataItem.retencion_item });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: ID_TAXCODE });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'department', value: department });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'class', value: class_ });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: location_value });

                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_factura_ln', value: dataItem.refnum });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcolpe_imp_original_ln', value: dataItem.importe_original_soles });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_imp_pagado_ln', value: dataItem.importe_pagado_soles });
                                            vendorCredit.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_ln_fec_emi_fc', value: dataItem.fec_emi_fc });
                                            vendorCredit.commitLine({ sublistId: 'expense' });

                                            const amount_sin_retencion = (0.97 * parseFloat(dataItem.amount)).toFixed(2);
                                            currentRecord.selectLine({ sublistId: 'apply', line: dataItem.line });
                                            currentRecord.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: amount_sin_retencion });
                                            currentRecord.commitLine({ sublistId: 'apply' });
                                        }
                                    });

                                    vendorCredit.setValue('custbody_psg_ei_template', PE_EI_FEL_PLANTILLA);
                                    vendorCredit.setValue('custbody_psg_ei_sending_method', PE_EI_FEL_SENDING_METHOD);
                                    vendorCredit.setValue('custbody_psg_ei_status', 1);
                                    currentRecord.save();
                                    const vendorCreditId = vendorCredit.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                    log.audit('Comprobante creado', 'ID: ' + vendorCreditId + ', Serie: ' + serie + '-' + correlativo);

                                    const vendorCreditUpd = record.load({
                                        type: record.Type.VENDOR_CREDIT,
                                        id: vendorCreditId,
                                        isDynamic: true
                                    });
                                    const applyCountUpd = vendorCreditUpd.getLineCount({ sublistId: 'apply' });
                                    let contadorRef = 0;

                                    referencias.forEach(function (dataItem) {
                                        if (dataItem.aplica_retencion) {
                                            for (let i = 0; i < applyCountUpd; i++) {
                                                const refnum = vendorCreditUpd.getSublistValue({ sublistId: 'apply', fieldId: 'refnum', line: i });
                                                const trantype = vendorCreditUpd.getSublistValue({ sublistId: 'apply', fieldId: 'trantype', line: i });
                                                const isApplied = vendorCreditUpd.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });

                                                if (refnum === dataItem.refnum && trantype === "VendBill") {
                                                    if (!isApplied) {
                                                        vendorCreditUpd.selectLine({ sublistId: 'apply', line: i });
                                                        vendorCreditUpd.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                                                        vendorCreditUpd.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'amount', value: dataItem.retencion_item });
                                                        vendorCreditUpd.commitLine({ sublistId: 'apply' });
                                                        log.debug('Aplicación retención', 'Factura: ' + dataItem.refnum + ', Monto: ' + dataItem.retencion_item);
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                        contadorRef++;
                                    });

                                    vendorCreditUpd.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                    log.audit('Proceso completado', 'Documento de Retención finalizado correctamente');

                                } else {
                                    log.audit('Sin retención', 'No se creará comprobante - todas las facturas tienen detracción o no cumplen condiciones');
                                }
                            } else {
                                log.audit('Importe insuficiente', 'No se creará comprobante - total facturas (' + total_facturas_involucradas + ') no supera el mínimo (' + IMPORTE_MINIMO + ')');
                            }
                        }
                    } else {
                        log.audit('Condiciones no cumplidas', 'Proveedor no aplica para retención');
                    }
                } else {
                    log.audit('Subsidiaria excluida', 'Subsidiary ' + subsidiary + ' no está configurada como agente de retención');
                }

            } else {
                log.debug('Contexto no aplicable', 'Tipo de evento no procesa retenciones');
            }
        } catch (error) {
            log.error('Error procesando retención', error.message);
        }
    }

    // Función optimizada para validar múltiples facturas de forma masiva
    function validarFacturasMasivo(facturas) {
        if (!facturas || facturas.length === 0) return [];

        const facturasValidas = [];
        const idsFacturas = facturas.map(f => f.id);

        log.audit('Validación masiva iniciada', 'Validando ' + facturas.length + ' facturas');

        try {
            // Validación masiva de tipos de documento usando search
            const tiposDocumentoSearch = search.create({
                type: record.Type.VENDOR_BILL,
                filters: [
                    ['internalid', 'anyof', idsFacturas],
                    'AND',
                    ['custbody_pe_document_type', 'anyof', TIPOS_DOCUMENTOS_RETENCION]
                ],
                columns: [
                    'internalid',
                    'custbody_pe_document_type'
                ]
            });

            const facturasConTipoValido = new Set();
            tiposDocumentoSearch.run().each(function (result) {
                facturasConTipoValido.add(result.getValue('internalid'));
                return true;
            });

            log.debug('Tipos documento válidos', 'Facturas que pasaron filtro de tipo: ' + facturasConTipoValido.size + '/' + facturas.length);

            // Solo validar códigos de impuesto para facturas que pasaron el primer filtro
            const facturasPorTipo = facturas.filter(f => facturasConTipoValido.has(f.id));

            if (facturasPorTipo.length === 0) {
                log.audit('Sin facturas válidas por tipo', 'Ninguna factura tiene tipo de documento válido (' + TIPOS_DOCUMENTOS_RETENCION.join(', ') + ')');
                return [];
            }

            log.audit('Validación masiva completada - Tipos documento', 'Facturas válidas por tipo: ' + facturasPorTipo.length + '/' + facturas.length + ' - Procesando códigos de impuesto individualmente');

            // Para códigos de impuesto, usar validación individual (método confiable)
            facturasPorTipo.forEach(function (factura) {
                const tieneCodigoImpuestoValido = verificarCodigoImpuesto(factura.id);
                if (tieneCodigoImpuestoValido) {
                    facturasValidas.push(factura);
                } else {
                    log.debug('Documento omitido por código impuesto', 'ID: ' + factura.id + ' (' + factura.refnum + ') - No tiene código de impuesto válido');
                }
            });

            log.audit('Validación masiva final', 'Facturas válidas completas: ' + facturasValidas.length + '/' + facturas.length);

        } catch (e) {
            log.error('Error en validación masiva', e.message);
            // Fallback a validación individual completa en caso de error
            log.audit('Fallback a validación individual', 'Usando método anterior debido a error');
            return validarFacturasIndividual(facturas);
        }

        return facturasValidas;
    }

    // Función de fallback para validación individual (método anterior)
    function validarFacturasIndividual(facturas) {
        const facturasValidas = [];

        facturas.forEach(function (factura) {
            const esDocumentoParaRetencion = verificarTipoDocumento(factura.id);
            if (!esDocumentoParaRetencion) {
                log.debug('Documento omitido', 'ID: ' + factura.id + ' - No es un tipo de documento para retención');
                return;
            }

            const tieneCodigoImpuestoValido = verificarCodigoImpuesto(factura.id);
            if (!tieneCodigoImpuestoValido) {
                log.debug('Documento omitido por código impuesto', 'ID: ' + factura.id + ' - No tiene código de impuesto válido para retención');
                return;
            }

            facturasValidas.push(factura);
        });

        return facturasValidas;
    }

    // Función para verificar si el documento es de un tipo que debe generar retención
    function verificarTipoDocumento(idFactura) {
        try {
            const tipoDocumentoFields = search.lookupFields({
                type: record.Type.VENDOR_BILL,
                id: idFactura,
                columns: ['custbody_pe_document_type']
            });

            let tipoDocumento = null;
            if (tipoDocumentoFields.custbody_pe_document_type instanceof Array &&
                tipoDocumentoFields.custbody_pe_document_type.length > 0) {
                tipoDocumento = tipoDocumentoFields.custbody_pe_document_type[0].value;
            } else {
                tipoDocumento = tipoDocumentoFields.custbody_pe_document_type;
            }

            // Verificar si el tipo de documento está en la lista de documentos que generan retención
            const esDocumentoParaRetencion = TIPOS_DOCUMENTOS_RETENCION.includes(String(tipoDocumento).trim());

            log.debug('Verificación tipo documento', {
                idFactura: idFactura,
                tipoDocumento: tipoDocumento,
                esDocumentoParaRetencion: esDocumentoParaRetencion
            });

            return esDocumentoParaRetencion;
        } catch (e) {
            log.error('Error verificando tipo de documento', 'ID: ' + idFactura + ', Error: ' + e.message);
            return false;
        }
    }

    // Función para verificar si la factura tiene un código de impuesto válido para retención
    function verificarCodigoImpuesto(idFactura) {
        try {
            // Cargar la factura para revisar las líneas de impuesto
            const vendorBillRecord = record.load({ type: record.Type.VENDOR_BILL, id: idFactura });
            const taxItemCount = vendorBillRecord.getLineCount({ sublistId: 'taxdetails' });

            // Solo log de debug para el conteo inicial, no para cada línea
            log.debug('Análisis códigos de impuesto', {
                idFactura: idFactura,
                totalLineasImpuesto: taxItemCount
            });

            const codigosEncontrados = [];

            for (let i = 0; i < taxItemCount; i++) {
                const taxCode = vendorBillRecord.getSublistText({ sublistId: 'taxdetails', fieldId: 'taxcode', line: i });

                if (taxCode) {
                    codigosEncontrados.push(taxCode);

                    // Verificar si el código de impuesto está en la lista permitida
                    if (CODIGOS_IMPUESTO_RETENCION.includes(String(taxCode).trim())) {
                        log.debug('Código impuesto válido encontrado', {
                            idFactura: idFactura,
                            codigoImpuesto: taxCode
                        });
                        return true;
                    }
                }
            }

            // También verificar en las líneas de expense/items
            const expenseCount = vendorBillRecord.getLineCount({ sublistId: 'expense' });

            for (let i = 0; i < expenseCount; i++) {
                const taxCodeExpense = vendorBillRecord.getSublistText({ sublistId: 'expense', fieldId: 'taxcode', line: i });

                if (taxCodeExpense) {
                    codigosEncontrados.push(taxCodeExpense);

                    // Verificar si el código de impuesto está en la lista permitida
                    if (CODIGOS_IMPUESTO_RETENCION.includes(String(taxCodeExpense).trim())) {
                        log.debug('Código impuesto válido encontrado en expense', {
                            idFactura: idFactura,
                            codigoImpuesto: taxCodeExpense
                        });
                        return true;
                    }
                }
            }

            // Solo un log de auditoría al final con resumen
            log.audit('Código impuesto no válido', 'Factura: ' + idFactura +
                ' | Encontrados: [' + [...new Set(codigosEncontrados)].join(', ') + ']' +
                ' | Requeridos: [' + CODIGOS_IMPUESTO_RETENCION.join(', ') + ']');

            return false;
        } catch (e) {
            log.error('Error verificando código de impuesto', 'ID: ' + idFactura + ', Error: ' + e.message);
            return false;
        }
    }

    // Función para calcular el importe de líneas gravadas que aplican para retención
    function calcularImporteLineasGravadas(idFactura) {
        try {
            const vendorBillRecord = record.load({ type: record.Type.VENDOR_BILL, id: idFactura });
            let totalLineasGravadas = 0;

            // Revisar líneas de expense
            const expenseCount = vendorBillRecord.getLineCount({ sublistId: 'expense' });

            for (let i = 0; i < expenseCount; i++) {
                const taxCode = vendorBillRecord.getSublistText({ sublistId: 'expense', fieldId: 'taxcode', line: i });
                const amount = vendorBillRecord.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: i });

                // Solo sumar líneas que tengan códigos de impuesto válidos para retención
                if (taxCode && CODIGOS_IMPUESTO_RETENCION.includes(String(taxCode).trim())) {
                    totalLineasGravadas += parseFloat(amount) || 0;

                    log.debug('Línea gravada encontrada', {
                        idFactura: idFactura,
                        linea: i + 1,
                        taxCode: taxCode,
                        amount: amount
                    });
                }
            }

            // Revisar líneas de items si existen
            const itemCount = vendorBillRecord.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < itemCount; i++) {
                const taxCode = vendorBillRecord.getSublistText({ sublistId: 'item', fieldId: 'taxcode', line: i });
                const amount = vendorBillRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                // Solo sumar líneas que tengan códigos de impuesto válidos para retención
                if (taxCode && CODIGOS_IMPUESTO_RETENCION.includes(String(taxCode).trim())) {
                    totalLineasGravadas += parseFloat(amount) || 0;

                    log.debug('Línea item gravada encontrada', {
                        idFactura: idFactura,
                        linea: i + 1,
                        taxCode: taxCode,
                        amount: amount
                    });
                }
            }

            log.debug('Cálculo líneas gravadas', {
                idFactura: idFactura,
                totalLineasGravadas: totalLineasGravadas,
                expenseLines: expenseCount,
                itemLines: itemCount
            });

            return totalLineasGravadas;

        } catch (e) {
            log.error('Error calculando líneas gravadas', 'ID: ' + idFactura + ', Error: ' + e.message);
            return 0;
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});