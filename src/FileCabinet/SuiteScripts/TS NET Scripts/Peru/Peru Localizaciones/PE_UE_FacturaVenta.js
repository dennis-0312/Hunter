/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 *
 * Task          Date            Author                                         Remarks
 *               10 Jul 2023     Ivan Morales <imorales@myevol.biz>          - Aplicación de Detracciones en Factura de Venta
 * 
 */
 define(['N/record', 'N/log', 'N/search'], function (record, log, search) {

    let TIPO_COMPROBANTE_FA = '' //Se consulta a la tabla customrecord_pe_fiscal_document_type

    function beforeSubmit(scriptContext) {

        try {

            //! 1. Buscando ID de FACTURA
            var customrecordSearch_FA = search.create({
                type: 'customrecord_pe_fiscal_document_type', // Tabla Tipo de Documento
                filters: [
                    search.createFilter({
                        name: 'custrecord_pe_code_document_type', // Nombre del campo
                        operator: search.Operator.IS,
                        values: '01'//FACTURA
                    })
                ],
                columns: [
                    search.createColumn({
                        name: 'internalId', // ID de Factura a recuperar
                        sort: search.Sort.ASC // Ordenar de forma ascendente
                    })
                ]
            });
            var searchResults_FA = customrecordSearch_FA.run().getRange({ start: 0, end: 1 });
            if (searchResults_FA && searchResults_FA.length > 0) {
                TIPO_COMPROBANTE_FA = searchResults_FA[0].getValue({ name: 'internalId' });
            }


            //! 2. Seteando el concepto de la detracción por el concepto_hidden, solo al crear
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                let currentRecord = scriptContext.newRecord;
                log.debug('MSK1', '---beforeSubmit1---')
                var custbody_pe_concept_detraction = currentRecord.getValue('custbody_pe_concept_detraction');
                log.debug('MSK1', 'custbody_pe_concept_detraction=' + custbody_pe_concept_detraction)
                var custbody_pe_concept_detraction_hidden = currentRecord.getValue('custbody_pe_concept_detraction_hidden');
                log.debug('MSK1', 'custbody_pe_concept_detraction_hidden=' + custbody_pe_concept_detraction_hidden)
                currentRecord.setValue({ fieldId: 'custbody_pe_concept_detraction', value: custbody_pe_concept_detraction_hidden })
                log.debug('MSK1', 'He seteado el concepto de detracción')
            }

            //! 3. Realziar la operación de Detracción
            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
                let currentRecord = scriptContext.newRecord;

                var tipo_comprobante = currentRecord.getValue('custbody_pe_document_type');
                log.debug('Factura Venta', 'tipo_comprobante = ' + tipo_comprobante)
                if (tipo_comprobante == TIPO_COMPROBANTE_FA) {
                    log.debug('MSK', 'Sí es FA, evaluaremos si se aplica o no detracción')
                    // Recorrer todos los ítems de la factura
                    var itemCount = currentRecord.getLineCount({ sublistId: 'item' });
                    var codigo_impuesto = currentRecord.getValue('custpage_4601_witaxcode');

                    let aplica_retencion = false;
                    var exchangerate = currentRecord.getValue('exchangerate');//20230824 - tipo de cambio
                    log.debug('MSK', 'exchangerate = ' + exchangerate)
                    for (var i = 0; i < itemCount; i++) {
                        var amount = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                        // Verificar si el valor de AMOUNT es mayor a 700
                        if (amount * parseFloat(exchangerate) >= 700) {//20230824 - tipo de cambio
                            log.debug('Factura Venta', amount + 'Es mayor a 700')
                            aplica_retencion = true;
                            // Marcar el campo "¿APLICAR RETENCIÓN DE IMPUESTOS?" como "SI"
                            currentRecord.setSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line: i, value: true });
                        }
                    }
                    log.debug('Factura Venta', 'aplica_retencion = ' + aplica_retencion)
                    log.debug('Factura Venta', 'codigo_impuesto = ' + codigo_impuesto)
                    log.debug('Factura Venta', 'No voy a generar el Item Detracción, se debería aplicar automáticamente')

                } else {
                    log.debug('MSK', 'No es FA, no aplica detracción')
                }

            }
        }
        catch (error) {
            log.error('error', error)
        }
    }

    const afterSubmit = (context) => {
        log.debug('MSK', '---afterSubmit---')
        let currentRecord = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true });
        var custbody_pe_concept_detraction = currentRecord.getValue('custbody_pe_concept_detraction');
        log.debug('MSK', 'custbody_pe_concept_detraction=' + custbody_pe_concept_detraction)
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
