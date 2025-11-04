/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url'],

    function (url) {
        var data;
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            data = scriptContext
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            try {
                let cliente = scriptContext.currentRecord.getValue({
                    fieldId: 'cliente'
                });
                let fechaInicio = scriptContext.currentRecord.getValue({
                    fieldId: 'fecha_inicio'
                });
                let tipoOS = '1';

                let fechaFin = scriptContext.currentRecord.getValue({
                    fieldId: 'fecha_fin'
                });

                let agrupador = scriptContext.currentRecord.getValue({
                    fieldId: 'agrupador'
                });

                let termino_pago = scriptContext.currentRecord.getValue({
                    fieldId: 'termino_pago'
                });

                let glosa = scriptContext.currentRecord.getValue({
                    fieldId: 'glosa'
                });

                let facturar_a = scriptContext.currentRecord.getValue({
                    fieldId: 'facturar_a'
                });

                let nota_factura = scriptContext.currentRecord.getValue({
                    fieldId: 'nota_factura'
                });

                let importe_total = scriptContext.currentRecord.getValue({
                    fieldId: 'importe_total'
                });

                let params = {
                    flag: 'searchFacturaFin',
                    cliente: cliente,
                    fechaInicio: (fechaInicio != '') ? new Date(fechaInicio) : '',
                    tipoOS: tipoOS,
                    fechaFin: (fechaFin != '') ? new Date(fechaFin) : '',
                    agrupador: agrupador,
                    glosa: glosa,
                    facturar_a: facturar_a,
                    nota_factura: nota_factura,
                    importe_total: importe_total,
                    termino_pago: termino_pago
                };



                //Validamos que esten llenos los campos obligatorios
                if (
                    params.cliente != '' &&
                    params.fechaInicio != '' &&
                    params.fechaFin != ''
                ) {
                    if (scriptContext.sublistId == 'sublista' && scriptContext.fieldId == 'check') {
                        //Sumamos los montos seleccionados
                        let total = 0;
                        let sublistLineCount = scriptContext.currentRecord.getLineCount({
                            sublistId: 'sublista'
                        });

                        for (let i = 0; i < sublistLineCount; i++) {
                            let isSelected = scriptContext.currentRecord.getSublistValue({
                                sublistId: 'sublista',
                                fieldId: 'check',
                                line: i
                            });

                            if (isSelected) {
                                let monto = scriptContext.currentRecord.getSublistValue({
                                    sublistId: 'sublista',
                                    fieldId: 'monto',
                                    line: i
                                });
                                total += parseFloat(monto);
                            }
                        }



                        scriptContext.currentRecord.setValue({
                            fieldId: 'importe_total',
                            value: total
                        });


                    } else if (scriptContext.fieldId == 'termino_pago' || scriptContext.fieldId == 'facturar_a' || scriptContext.fieldId == 'glosa' || scriptContext.fieldId == 'nota_factura' || scriptContext.fieldId == 'importe_total') {

                    }

                    else {

                        params = JSON.stringify(params);
                        //Llamamos al Suitelet
                        window.onbeforeunload = null;
                        let ruta = url.resolveScript({
                            scriptId: 'customscript_ts_sl_agrup_factura_os',
                            deploymentId: 'customdeploy_ts_sl_agrup_factura_os',
                            params: {
                                custscript_ts_context: params
                            },
                            returnExternalUrl: false
                        });

                        setWindowChanged(window, false);
                        window.location.href = ruta;
                    }
                }



            } catch (e) {
                console.log('Error', e.message);
            }

        }


        /**
         * Function para calcular el importe total
         * 
         */

        function calcularImporte() {
            try {
                let scriptContext = data;
                let total = 0;
                let sublistLineCount = scriptContext.currentRecord.getLineCount({
                    sublistId: 'sublista'
                });

                for (let i = 0; i < sublistLineCount; i++) {
                    let isSelected = scriptContext.currentRecord.getSublistValue({
                        sublistId: 'sublista',
                        fieldId: 'check',
                        line: i
                    });

                    if (isSelected) {
                        let monto = scriptContext.currentRecord.getSublistValue({
                            sublistId: 'sublista',
                            fieldId: 'monto',
                            line: i
                        });
                        total += parseFloat(monto);
                    }
                }

                scriptContext.currentRecord.setValue({
                    fieldId: 'importe_total',
                    value: total
                });

            } catch (error) {
                console.log('Error', error.message);
            }
        }





        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            console.log('saveRecord');
            try {

                //Validamos que esten llenos los campos obligatorios
                let cliente = scriptContext.currentRecord.getValue({
                    fieldId: 'cliente'
                });
                let fechaInicio = scriptContext.currentRecord.getValue({
                    fieldId: 'fecha_inicio'
                });
                let tipoOS = '1';

                let fechaFin = scriptContext.currentRecord.getValue({
                    fieldId: 'fecha_fin'
                });
                let agrupador = scriptContext.currentRecord.getValue({
                    fieldId: 'agrupador'
                });
                let termino_pago = scriptContext.currentRecord.getValue({
                    fieldId: 'termino_pago'
                });

                let glosa = scriptContext.currentRecord.getValue({
                    fieldId: 'glosa'
                });





                //validamos que seleccione al menos un registro 

                let sublistLineCount = scriptContext.currentRecord.getLineCount({
                    sublistId: 'sublista'
                });

                let sublistValida = false;

                for (let i = 0; i < sublistLineCount; i++) {
                    let isSelected = scriptContext.currentRecord.getSublistValue({
                        sublistId: 'sublista',
                        fieldId: 'check',
                        line: i
                    });


                    if (isSelected) {
                        sublistValida = true;
                        break;
                    }
                }


                if (!sublistValida) {
                    alert('Debe seleccionar al menos un registro');
                    return false;
                }

                if (
                    cliente != '' &&
                    fechaInicio != '' &&
                    fechaFin != '' &&
                    termino_pago != '' &&
                    glosa != ''
                ) {
                    return true;
                } else {
                    alert('Debe llenar los campos obligatorios');
                    return false;
                }




            } catch (error) {
                log.error('Error', error.message);
                return false;

            }


        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            calcularImporte: calcularImporte,
            /*  postSourcing: postSourcing,
             sublistChanged: sublistChanged,
             lineInit: lineInit,
             validateField: validateField,
             validateLine: validateLine,
             validateInsert: validateInsert,
             validateDelete: validateDelete,*/
            saveRecord: saveRecord
        };

    });
