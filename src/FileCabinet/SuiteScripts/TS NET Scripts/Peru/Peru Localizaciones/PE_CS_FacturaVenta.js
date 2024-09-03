/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *
 * Task          Date            Author                                         Remarks
 *               10 Jul 2023     Ivan Morales <imorales@myevol.biz>          - Aplicación de Detracciones en Factura de Venta
 * 
 */
define(['N/currentRecord', 'N/search'], function (currentRecord, search) {

    let typeMode = "";
    let TIPO_COMPROBANTE_FA = '' //Se consulta a la tabla customrecord_pe_fiscal_document_type

    const ID_RETENCION_DEFAULT = '23'//ASB:23, TS:, GG:23 (COMBO SUPERIOR)

    function pageInit(context) {
        typeMode = context.mode;
        console.log("typeMode = " + typeMode)

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
    }

    function fieldChanged(context) {
        try {
            if (typeMode == "create" || typeMode == "edit" || typeMode == "copy") {
                var currentRecordObj = currentRecord.get();

                let tipo_comprobante_select = currentRecordObj.getValue({ fieldId: 'custbody_pe_document_type' });

                console.log('TIPO_COMPROBANTE_FA (consultado) = '+TIPO_COMPROBANTE_FA)
                console.log('tipo_comprobante_select (seleccionado) = '+tipo_comprobante_select)
                if (tipo_comprobante_select == TIPO_COMPROBANTE_FA) {
                    
                    var itemTotal = document.getElementById("item_total").textContent;
                    let imm_itemToal = currentRecordObj.getValue({ fieldId: 'custbody_total_items' });

                    if (imm_itemToal != itemTotal) {
                        var exchangerate = currentRecordObj.getValue({ fieldId: 'exchangerate' });//20230824 - tipo de cambio
                        currentRecordObj.setValue({ fieldId: 'custbody_total_items', value: itemTotal });
                        var itemCount = currentRecordObj.getLineCount({ sublistId: 'item' });

                        var codigo_impuesto = currentRecordObj.getValue('custpage_4601_witaxcode');
                        let aplica_retencion = false;

                        //primero recorremos buscando uno que implique retencion
                        for (var i = 0; i < itemCount; i++) {
                            var amount = currentRecordObj.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                            if (amount * parseFloat(exchangerate) >= 700) {//20230824 - tipo de cambio
                                aplica_retencion = true;

                                if (codigo_impuesto == undefined || codigo_impuesto == "") {
                                    console.log('Seteamos combo de arriba')
                                    currentRecordObj.setValue({ fieldId: 'custbody_pe_concept_detraction', value: ID_RETENCION_DEFAULT });//por defecto será: 037 Demas servicios gravados IGV
                                }

                                break;
                            }
                        }
                        console.log('aplica_retencion = ' + aplica_retencion)

                        setTimeout(function () {
                            for (var i = 0; i < itemCount; i++) {
                                var amount = currentRecordObj.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                                if (amount * parseFloat(exchangerate) >= 700) {//20230824 - tipo de cambio
                                    currentRecordObj.selectLine({ sublistId: 'item', line: i });
                                    currentRecordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', value: true });
                                    currentRecordObj.commitLine({ sublistId: 'item' });
                                } else {
                                    currentRecordObj.selectLine({ sublistId: 'item', line: i });
                                    currentRecordObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', value: false });
                                    currentRecordObj.commitLine({ sublistId: 'item' });
                                }
                            }
                        }, 1000);

                    }


                    //Cambio en Tipo Detracción
                    if (context.fieldId === 'custbody_pe_concept_detraction') {
                        var comboSuperior = context.currentRecord.getValue({ fieldId: 'custbody_pe_concept_detraction' });
                        var moneda = context.currentRecord.getValue({ fieldId: 'currency' });//! 1=PEN, 2=USD
                        var pctj = 0

                        if (comboSuperior != null && comboSuperior != "") {
                            console.log("comboSuperior => " + comboSuperior)
                            var customrecordSearch = search.create({
                                type: 'customrecord_pe_concept_detraction', // Tipo de registro personalizado
                                filters: [
                                    search.createFilter({
                                        name: 'internalId', // Nombre del campo
                                        operator: search.Operator.IS,
                                        values: comboSuperior // Tipo de Detraccion
                                    })
                                ],
                                columns: [
                                    search.createColumn({
                                        name: 'custrecord_pe_percentage_detraction', // Nombre del campo "Porcentaje"
                                        sort: search.Sort.ASC // Ordenar de forma ascendente
                                    })
                                ]
                            });
                            var searchResults = customrecordSearch.run().getRange({ start: 0, end: 1 });
                            if (searchResults && searchResults.length > 0) {
                                pctj = searchResults[0].getValue({ name: 'custrecord_pe_percentage_detraction' });
                            }

                            console.log('pctj = ' + pctj)

                            //Busqueda en Venta
                            let busquedaSelect = search.load({ id: "customsearch_codigos_retencion_impuestos" })
                            let filtro1 = search.createFilter({
                                name: 'custrecord_4601_wtc_availableon',
                                operator: search.Operator.IS,
                                values: 'onsales'
                            });
                            busquedaSelect.filters.push(filtro1);
                            busquedaSelect.run().each(function (result) {
                                let id = result.getValue(busquedaSelect.columns[0])
                                let nombre1 = result.getValue(busquedaSelect.columns[1])
                                let nombre2 = result.getValue(busquedaSelect.columns[2])
                                let aplicado_en = result.getValue(busquedaSelect.columns[3])
                                let tasa = result.getValue(busquedaSelect.columns[4])
                                console.log('id:' + id + ", nombre1:" + nombre1 + ", nombre2:" + nombre2 + ", aplicado_en:" + aplicado_en + ", tasa:" + tasa)

                                if(pctj==tasa){
                                    if(
                                        (moneda=="1" && !(nombre1.indexOf('USD')>0))//SOLES
                                        ||(moneda=="2" && (nombre1.indexOf('USD')>0))//DOLARES
                                    )
                                    {
                                        console.log('seteo de combo inferior=> moneda:'+moneda+"|nombre1:"+nombre1+"|tasa:"+tasa)
                                        context.currentRecord.setValue({ fieldId: 'custpage_4601_witaxcode', value: id });
                                        return false
                                    }
                                }
                                return true;
                            })

                            //Busqueda en Ambos (Compra y Venta)
                            let busquedaSelect2 = search.load({ id: "customsearch_codigos_retencion_impuestos" })
                            let filtro2 = search.createFilter({
                                name: 'custrecord_4601_wtc_availableon',
                                operator: search.Operator.IS,
                                values: 'both'
                            });
                            busquedaSelect2.filters.push(filtro2);
                            busquedaSelect2.run().each(function (result) {
                                let id = result.getValue(busquedaSelect2.columns[0])
                                let nombre1 = result.getValue(busquedaSelect2.columns[1])
                                let nombre2 = result.getValue(busquedaSelect2.columns[2])
                                let aplicado_en = result.getValue(busquedaSelect2.columns[3])
                                let tasa = result.getValue(busquedaSelect2.columns[4])
                                console.log('id:' + id + ", nombre1:" + nombre1 + ", nombre2:" + nombre2 + ", aplicado_en:" + aplicado_en + ", tasa:" + tasa)
                                
                                if(pctj==tasa){
                                    if(
                                        (moneda=="1" && !(nombre1.indexOf('USD')>0))//SOLES
                                        ||(moneda=="2" && (nombre1.indexOf('USD')>0))//DOLARES
                                    )
                                    {
                                        console.log('seteo de combo inferior=> moneda:'+moneda+"|nombre1:"+nombre1+"|tasa:"+tasa)
                                        context.currentRecord.setValue({ fieldId: 'custpage_4601_witaxcode', value: id });
                                        return false
                                    }
                                }
                                return true;
                            })

                        }


                    }
                } else {
                    console.log('No es FA, no hay detracción')
                }

                //!Al cambiar el Tipo de Documento
                if (context.fieldId === 'custbody_pe_document_type') {
                    console.log('MSK-->CHANGE custbody_pe_document_type')
                    setTimeout(function () {
                        console.log('MSK-->ENTRE AL IF')
                        let tipo_documento = currentRecordObj.getValue({ fieldId: 'custbody_pe_document_type' });
                        console.log('MSK-->tipo_documento=' + tipo_documento)
                        if (tipo_documento == TIPO_COMPROBANTE_FA) {
                            console.log('MSK-->Setee el concepto de detracción')
                            currentRecordObj.setValue({ fieldId: 'custbody_pe_concept_detraction', value: '1' });//000 Sin Detraccion
                        }
                    }, 1000);
                }
                if (context.fieldId === 'custbody_pe_concept_detraction') {
                    concepto_detraccion = currentRecordObj.getValue({ fieldId: 'custbody_pe_concept_detraction' });
                    console.log('MSK-->concepto_detraccion=' + concepto_detraccion)
                    currentRecordObj.setValue({ fieldId: 'custbody_pe_concept_detraction_hidden', value: concepto_detraccion });
                    console.log('MSK-->concepto_detraccion hidden = ' + concepto_detraccion)
                }
            }
        } catch (err) {
            console.log('ERROR GENERAL')
            console.log(err)
        }


    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    }
});
