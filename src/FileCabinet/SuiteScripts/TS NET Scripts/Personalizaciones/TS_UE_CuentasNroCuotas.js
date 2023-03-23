/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search','N/ui/serverWidget'], (log, record, search, serverWidget) => {
    
    const beforeLoad = (context) => {

        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
            const objRecord = context.newRecord;
            try {
                var numLinesBeforeLoad = objRecord.getLineCount({
                    sublistId: "visuals",
                });
                var idPayment = getIdPayment(objRecord.id);
                var nroCuotasDefault = idPayment.cuota;
                var cuentasDefault = idPayment.cuenta;
                //log.debug('numLinesBeforeLoad',numLinesBeforeLoad);
                
/*                 if(numLinesBeforeLoad > 0){
                    for(i = 0; i < numLinesBeforeLoad; i++){
                        var location = objRecord.getSublistValue({
                            sublistId: 'visuals',
                            fieldId: 'location',
                            line: i
                        });
                        location = location.split('//')[1];
                        log.debug('location',location);
                        log.debug('isFinite(location)',isFinite(location));
                         if(isFinite(location)){
                            nroCuotasDefault = objRecord.getSublistValue({
                                sublistId: 'visuals',
                                fieldId: 'flags',
                                line: i
                            }); 
                            cuentasDefault = location;
                        } 
                    }
                } */
                log.debug('context form',context.form);
                let form = context.form;
                let field = form.addField({
                    id: 'custpage_textfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Nro de Cuotas'
                });
                field.defaultValue = nroCuotasDefault;
                //field.isMandatory = true;
                field.layoutType = serverWidget.FieldLayoutType.NORMAL;
                field.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                let select = form.addField({
                    id: 'custpage_selectfield',
                    type: serverWidget.FieldType.SELECT,
                    source: 'account',
                    label: 'Cuenta'
                });
                select.defaultValue = cuentasDefault;
                //select.isMandatory = true;
                form.insertField({
                    field: select,
                    nextfield: 'isinactive'
                });
                form.insertField({
                    field: field,
                    nextfield: 'custpage_selectfield'
                });
    
                
            } catch (error) {
                log.error('Error', error);
            }
        }
    }
    const beforeSubmit = (context) => {
        try {
           
            const objRecord = context.newRecord;

            var numLines = objRecord.getLineCount({
                sublistId: "visuals",
            });
            log.debug('numLines',numLines);
            var nroCuotas = objRecord.getValue('custpage_textfield');
            var cuenta = objRecord.getValue('custpage_selectfield');
            var flag = false;
            log.debug('nroCuotas y cuentas',nroCuotas+'-'+cuenta);
            var pos = 0;

            if(numLines > 0){
                for(i = 0; i < numLines; i++){
                    var location = objRecord.getSublistValue({
                        sublistId: 'visuals',
                        fieldId: 'location',
                        line: i
                    });
                    location = location.split('//')[1];
                    log.debug('location',location);
                    log.debug('isFinite(location)',isFinite(location));
                    if(isFinite(location)){
                        
                        var cuotaActual = objRecord.getSublistValue({
                            sublistId: 'visuals',
                            fieldId: 'flags',
                            line: i
                        }); 
                        var cuentaActual = location;
                        
                        if(cuotaActual != nroCuotas || cuentaActual != cuenta){
                            flag = true;
                            pos = i;
                        }
                    } 
                }
            }
  
            if(nroCuotas && nroCuotas!=null && nroCuotas!='' && cuenta && cuenta!=null && cuenta!=''){

                if(numLines > 0 && !flag){
                    //añadir linea
                    objRecord.insertLine({
                        sublistId: 'visuals',
                        line: numLines,
                    });
                    pos = numLines;
          
                }//else{
                    objRecord.setSublistValue({
                        sublistId: "visuals",
                        fieldId: "flags",
                        value: nroCuotas,
                        line: pos
                    });
                    objRecord.setSublistValue({
                        sublistId: "visuals",
                        fieldId: "location",
                        value: 'http://'+cuenta,
                        line: pos
                    }); 
               // }
               
            }
            var nuevoValorNroCuotas = objRecord.getSublistValue({
                sublistId: 'visuals',
                fieldId: 'flags',
                line: pos
            });
            var nuevoValorCuentas = objRecord.getSublistValue({
                sublistId: 'visuals',
                fieldId: 'location',
                line: pos
            });
            nuevoValorCuentas = nuevoValorCuentas.split('//')[1];


            log.debug('objRecord.id',objRecord.id);
            var idPayment = getIdPayment(objRecord.id);
            log.debug('idPayment',idPayment);
            if(idPayment){
                log.debug('entra idPayment');
                var jeRec = record.load({
                    type: 'customrecord_ht_cuentas_nrocuotas',
                    isDynamic: true,
                    id: idPayment.id,
                });
                jeRec.setValue('custrecord_ht_cc_cuenta',nuevoValorCuentas);
                jeRec.setValue('custrecord_ht_cc_cuota', nuevoValorNroCuotas);
                jeRec.save();
            }else{
                log.debug('no entra idPayment');
                var jeRec = record.create({
                    type: 'customrecord_ht_cuentas_nrocuotas',
                    isDynamic: true
                });
                jeRec.setValue('custrecord_ht_cc_paymentmethod',objRecord.id);
                jeRec.setValue('custrecord_ht_cc_cuenta',nuevoValorCuentas);
                jeRec.setValue('custrecord_ht_cc_cuota', nuevoValorNroCuotas);
                jeRec.save();
            }
            objRecord.removeLine({
                sublistId: 'visuals',
                line: pos,
                ignoreRecalc: true
            });
        } catch (error) {
            log.error('Error beforeSubmit', error);
        }

    }

    function getIdPayment(id) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_cuentas_nrocuotas",
                filters:
                [
                   ["custrecord_ht_cc_paymentmethod","anyof",id]
                ],
                columns:
                [
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({name: "custrecord_ht_cc_cuenta", label: "Cuenta"}),
                   search.createColumn({name: "custrecord_ht_cc_cuota", label: "Cuota"})
                ]
             });
             var savedsearch = busqueda.run().getRange(0, 1);
             var paymentMethod = {};
             if (savedsearch.length > 0) {
                 busqueda.run().each(function (result) {
                    paymentMethod.id = result.getValue(busqueda.columns[0]);
                    paymentMethod.cuenta = result.getValue(busqueda.columns[1]);
                    paymentMethod.cuota = result.getValue(busqueda.columns[2]);
                    return true;
                 });
             }
             log.debug('paymentMethod busqueda',paymentMethod);
            return paymentMethod;
        } catch (e) {
            log.error('Error en getIdPayment', e);
        }
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});
