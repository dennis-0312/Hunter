/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

    function _get(context) {
        try {
            let iddocument = context.iddocument;
            let objRecord = record.load({ type: record.Type.CUSTOMER_PAYMENT, id: iddocument, isDynamic: true });
            //let objRecord = record.load({ type: record.Type.VENDOR, id: iddocument, isDynamic: true });

           //let companyname = objRecord.getValue({ fieldId: 'entityid' });
  
            return {
                customerpayment: objRecord
               
            }
        } catch (error) {
            log.error('Error', error);
        }
    }


    function _post(context) {
        try {
            //REQUEST
            
            // FIELDS
            let customer = context.customer; // codigo cliente
            let currency  = context.currency; // codigo moneda
            let exchangerate = context.exchangerate; // tipo de cambio
            let aracct = context.aracct; // cuenta contable de cliente
            let trandate  = context.trandate; // fecha de transacción
            let location = context.location; // Ciudad
            let department = context.department; // departmento
            let paymentoption = context.paymentoption // tipo de pago
            let usepaymentoption = context.usepaymentoption // usar opcion de pago: valor true - false
            let applied = context.applied // valor aplicado
            let origtotal = context.origtotal // valor aplicado
            let payment = context.payment // pago
            let undepFunds = context.undepFunds // pago que será depositado en una cuenta bancaria
            let account = context.account; // cuenta deudora - cuenta de retención 
            let total = context.total // total
            let custbody_ec_origen_ingreso = context.custbody_ec_origen_ingreso // origen de ingreso HT - HUNTER
            let custbody_ec_comentario = context.custbody_ec_comentario // comentario
            let custbody_ts_ec_serie_retencion = context.custbody_ts_ec_serie_retencion // Serie de retención
            let custbody_ts_ec_preimpreso_retencion = context.custbody_ts_ec_preimpreso_retencion // número preimpreso
            let custbody_ts_ec_codigo_retencion = context.custbody_ts_ec_codigo_retencion // código de retención
            let custbody_ts_ec_porcentaje_retencion = context.custbody_ts_ec_porcentaje_retencion // porcentaje de retención
            let custbodyts_ec_cod_wht_autorization = context.custbodyts_ec_cod_wht_autorization // numero de autorizacion de retención
        

            // sublists
            // Apply : documento a aplicar
            let amount = Number.parseFloat( context.apply[0].amount).toFixed(2); // valor de pago
            let doc = context.apply[0].doc; // codigo de factura netsuite
            let internalid  = context.apply[0].internalid;    // codigo de factura netsuite
            let apply     = context.apply[0].apply; // aplicar
            
            /*
            log.debug('Dato cliente........', customer);
            log.debug('Dato moneda........', currency);
            log.debug('Dato tipo de cambio........', exchangerate);
            log.debug('Dato cuenta contable........', aracct);
            log.debug('Dato fecha transaccion........', trandate);
            log.debug('Dato location........', location);
            log.debug('Dato department........', department);
            log.debug('Dato paymentoption........', paymentoption);
            log.debug('Dato usepaymentoption........', usepaymentoption);
            log.debug('Dato applied........', applied);
            log.debug('Dato origtotal........', origtotal);
            log.debug('Dato payment........', payment);
            log.debug('Dato total........', total);
            log.debug('undepFunds........', undepFunds);
            log.debug('account........', account);
            */

            log.debug('custbody_ec_origen_ingreso........', custbody_ec_origen_ingreso);
            log.debug('custbody_ec_comentario........', custbody_ec_comentario);

            log.debug('custbody_ts_ec_serie_retencion........', custbody_ts_ec_serie_retencion);
            log.debug('custbody_ts_ec_preimpreso_retencion........', custbody_ts_ec_preimpreso_retencion);
            log.debug('custbody_ts_ec_codigo_retencion........', custbody_ts_ec_codigo_retencion);
            log.debug('custbody_ts_ec_porcentaje_retencion........', custbody_ts_ec_porcentaje_retencion);
            log.debug('custbodyts_ec_cod_wht_autorization........', custbodyts_ec_cod_wht_autorization);

            //CREATE RECORD
            let objRecord = record.create({ type: record.Type.CUSTOMER_PAYMENT, isDynamic: true });
            objRecord.setValue({ fieldId: 'customer', value: customer });
            objRecord.setValue({ fieldId: 'currency', value: currency });
            objRecord.setValue({ fieldId: 'exchangeRate', value: exchangerate });// campos de Netsuite
            objRecord.setValue({ fieldId: 'aracct', value: aracct }); // cuenta acreedora - cuenta de cliente
            objRecord.setValue({ fieldId: 'trandate', value: new Date(context.trandate) });
            objRecord.setValue({ fieldId: 'location', value: location });
            objRecord.setValue({ fieldId: 'department', value: department });
            objRecord.setValue({ fieldId: 'paymentoption', value: paymentoption });
            objRecord.setValue({ fieldId: 'usepaymentoption', value: usepaymentoption }); 
            objRecord.setValue({ fieldId: 'applied', value: applied });
            objRecord.setValue({ fieldId: 'origtotal', value: origtotal }); 
            objRecord.setValue({ fieldId: 'payment', value: payment });
            objRecord.setValue({ fieldId: 'undepFunds', value: undepFunds }); // pago que será depositado en una cuenta bancaria
            objRecord.setValue({ fieldId: 'account', value: account });// cuenta deudora - cuenta de retención
            objRecord.setValue({ fieldId: 'total', value: total });
            objRecord.setValue({ fieldId: 'custbody_ec_origen_ingreso', value: custbody_ec_origen_ingreso });// origen de ingreso HT - Hunter
            objRecord.setValue({ fieldId: 'custbody_ec_comentario', value: custbody_ec_comentario });// comentario
            objRecord.setValue({ fieldId: 'custbody_ts_ec_serie_retencion', value: custbody_ts_ec_serie_retencion });// serie de retención
            objRecord.setValue({ fieldId: 'custbody_ts_ec_preimpreso_retencion', value: custbody_ts_ec_preimpreso_retencion });// número preimpreso
            objRecord.setValue({ fieldId: 'custbody_ts_ec_codigo_retencion', value: custbody_ts_ec_codigo_retencion });// código de retención
            objRecord.setValue({ fieldId: 'custbody_ts_ec_porcentaje_retencion', value: custbody_ts_ec_porcentaje_retencion });// porcentaje de retención
            objRecord.setValue({ fieldId: 'custbodyts_ec_cod_wht_autorization', value: custbodyts_ec_cod_wht_autorization });// numero autorizacion de retención
          
            //objRecord.setValue({ fieldId: 'numeroretencion', value: numeroretencion });  
            //objRecord.setValue({ fieldId: 'codigoretencion', value: codigoretencion });  
            //objRecord.setValue({ fieldId: 'porcretencion', value: porcretencion });  
            //objRecord.setValue({ fieldId: 'comentario', value: comentario });  

            // Números de registro
            var apLine = objRecord.getLineCount({
                sublistId: "apply",
            });
            //log.debug('apLine....', apLine);

            let items = context.apply; // declaracion del arreglo del for
            //log.debug('items..1....', items);

            if(apLine > 0){
                for (var i = 0; i < apLine; i++) {

                    var refnum = objRecord.getSublistValue({

                        sublistId: 'apply',

                        fieldId: 'internalid',

                        line: i

                    });

                    var saldofact = objRecord.getSublistValue({

                        sublistId: 'apply',

                        fieldId: 'due',

                        line: i

                    });

                    //log.debug("internalid", internalid)
                    //log.debug("total", amount)
                    //log.debug("refnum", refnum)
                    //log.debug("saldo documento", saldofact)


                    /*log.audit({

                        title: "factura",

                        details: inv.id

                    })
                    */

                    //  Validar saldo de factura
                    if (refnum == internalid && saldofact < amount){
                        log.error({
                            title: 'Error: Documento no tiene saldo para aplicar', 
                            details: 'Documento: ' + internalid
                        });
                        return
                    }

                    // Aplicar documento de la lista
                    // si el código de factura es igual al internalId del documento
                    // si el documento tiene saldo
                    if (refnum == internalid && saldofact >= amount) {

                        //log.debug("factura", internalid)
                        //log.debug("total", amount)

                        var lnNum = objRecord.selectLine({

                            sublistId: 'apply',

                            line: i

                        });

                        
                        /*cruce.setCurrentSublistValue({

                            sublistId: 'apply',

                            fieldId: 'total',

                            value: acumula

                        });
                        */
                        //log.debug("total", acumula)
                        
                        // Aplicar documento
                        objRecord.setCurrentSublistValue({

                            sublistId: 'apply',

                            fieldId: 'apply',

                            value: true

                        });
                    
                        // Valor de aplicación
                        objRecord.setCurrentSublistValue({

                            sublistId: 'apply',

                            fieldId: 'amount',

                            value: amount

                        });
                        

                        objRecord.commitLine({

                            sublistId: 'apply'

                        });

                        

                    }

                }
            }

            
            let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
            log.debug('Result', recordId);
            return recordId;
        } catch (error) {
            log.error('Error', error);
            
        }


    }


    return {
        get: _get,
        post: _post
        //put: _put,
        //delete: _delete
    }
});