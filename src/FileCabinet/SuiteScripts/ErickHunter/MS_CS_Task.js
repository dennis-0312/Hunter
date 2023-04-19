/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record'], function(search,record) {

    function beforeLoad(context) {
        
    }

    function beforeSubmit(context) {
        
    }

    function afterSubmit(context) {
        
        let objRecord = context.newRecord;
        let NumeroItmes ;
        
            let relateditem =objRecord.getValue({fieldId:'relateditem'});
            let transaction =objRecord.getValue({fieldId:'transaction'});
            let customer = record.load({ type:'salesorder', id:transaction}); 
            let numLines =  customer.getLineCount({sublistId: 'item'});
            
            for (let i = 0; i < numLines; i++) {
                let AplicaPPTO = customer.getSublistValue({ sublistId: 'item', fieldId: 'item',line: i });
                if(AplicaPPTO == relateditem){
                    NumeroItmes = i;
                }
            }
         
            const busqueda = search.create({
                type: "customrecord_ht_record_ordentrabajo",
                filters:[["custrecord_ht_ot_orden_servicio", "anyof", transaction]],
                columns:[search.createColumn({name: "internalid", label: "ID"}),]
            });
            var pageData = busqueda.runPaged({pageSize: 1000});
            
            log.debug('relateditem',relateditem);
            let  params = {soid : transaction,  soline :NumeroItmes,    specord : 'T',  assemblyitem : relateditem};
            log.debug('params',params);
            log.debug('compoundLabel',pageData.pageRanges[0].compoundLabel);
            
            let workOrder = record.create({ type: record.Type.WORK_ORDER, isDynamic: true, defaultValues: params});
            
            workOrder.setValue({    fieldId: 'quantity',    value: 1 });
            workOrder.setValue({    fieldId: 'custbody_ht_ce_ordentrabajo',    value: pageData.pageRanges[0].compoundLabel });
            var woId = workOrder.save();
            log.debug('woId',woId);
            let order  = record.load({ type:'customrecord_ht_record_ordentrabajo', id:pageData.pageRanges[0].compoundLabel}); 
            order.setValue({fieldId:'custrecord_ht_ot_ordenfabricacion', value:woId });
            
            order.save();
            
        

       


    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
