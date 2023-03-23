/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search','N/ui/serverWidget'], (log, record, search, serverWidget) => {
    
    const beforeLoad = (scriptContext) => {

        if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.CREATE) {
            //const objRecord = context.newRecord;
            try {
                /* var numLinesBeforeLoad = objRecord.getLineCount({
                    sublistId: "visuals",
                }); */

                /* var idPayment = getIdPayment(objRecord.id);
                var nroCuotasDefault = idPayment.cuota;
                var cuentasDefault = idPayment.cuenta; */
                log.debug('context form',scriptContext.form);
                let form = scriptContext.form;
                const objRecord = scriptContext.newRecord;
                let idSimCard = objRecord.getValue('custrecord_ht_ds_simcard');
                log.debug('idSimCard',idSimCard);
                let item = getInventoryItem(idSimCard);
                log.debug('item',item);
                /* let field = form.addField({
                    id: 'custpage_textfield',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Nro de Cuotas'
                });
                field.defaultValue = nroCuotasDefault;
                //field.isMandatory = true;
                field.layoutType = serverWidget.FieldLayoutType.NORMAL;
                field.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                }); */

                let select = form.addField({
                    id: 'custpage_selectfield',
                    type: serverWidget.FieldType.SELECT,
                    label: 'HT DS SERIE'
                });
                form.insertField({
                    field: select,
                    nextfield: 'custrecord_ht_ds_serie'
                });
                if(item){
                    log.debug('item',item.length);
                    for (let i = 0; i < item.length; i++) {
                        select.addSelectOption({
                            value: item[i].toString(),
                            text: item[i].toString()
                        });
                    }
                    //select.defaultValue = cuentasDefault;
                    //select.isMandatory = true;

                    var serie = objRecord.getValue('custpage_selectfield');
                    objRecord.setValue('custrecord_ht_ds_serietexto',serie);
                }
            } catch (error) {
                log.error('Error', error);
            }
        }
    }
    const beforeSubmit = (scriptContext) => {
        try {
           
            const objRecord = scriptContext.newRecord;
            var serie = objRecord.getValue('custpage_selectfield');

            log.debug('serie',serie);
            objRecord.setValue('custrecord_ht_ds_serietexto',serie);
            objRecord.save();
/*  
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
            }); */
        } catch (error) {
            log.error('Error beforeSubmit', error);
        }

    }
    /* const beforeSubmit = (context) => {
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
    } */
    function getInventoryItem(idSimCard) {
        try {
            var arrCustomerId = new Array();
            if(idSimCard){
            var busqueda = search.create({
                type: "inventorynumber",
                filters:
                [
                   ["item.internalid","anyof", idSimCard], 
                   "AND", 
                   ["isonhand","is","T"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "inventorynumber",
                      sort: search.Sort.ASC,
                      label: "Number"
                   }),
                   search.createColumn({name: "item", label: "Item"}),
                   search.createColumn({name: "memo", label: "Memo"}),
                   search.createColumn({name: "location", label: "Location"}),
                   search.createColumn({name: "quantityonhand", label: "On Hand"}),
                   search.createColumn({name: "quantityavailable", label: "Available"}),
                   search.createColumn({name: "quantityonorder", label: "On Order"}),
                   search.createColumn({name: "isonhand", label: "Is On Hand"}),
                   search.createColumn({name: "quantityintransit", label: "In Transit"}),
                   search.createColumn({name: "datecreated", label: "Date Created"})
                ]
             });
             var pageData = busqueda.runPaged({
                pageSize: 1000
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    var arrCustomer = new Array();
                    //0. Internal id match
                    if (result.getValue(columns[0]) != null)
                        arrCustomer[0] = result.getValue(columns[0]);
                    else
                        arrCustomer[0] = '';
                        arrCustomerId.push(arrCustomer);
                    });
                });
            }
            return arrCustomerId;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
        // afterSubmit: afterSubmit
    }
});
