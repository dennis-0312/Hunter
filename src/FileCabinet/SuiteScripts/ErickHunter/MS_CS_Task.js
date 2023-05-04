/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search',
    'N/record',
    '../TS NET Scripts/Impulso Plataformas/Controller/TS_Script_Controller'
], (search, record, _controller) => {
    const ALQUILER_PARAM = 13;
    const SI = 9;
    let esAlquiler = 'continue';
    const beforeLoad = (context) => { }
    const beforeSubmit = (context) => { }

    const afterSubmit = (context) => {
        let objRecord = context.newRecord;
        let NumeroItmes;

        let relateditem = objRecord.getValue({ fieldId: 'relateditem' });
        let transaction = objRecord.getValue({ fieldId: 'transaction' });
        let customer = record.load({ type: 'salesorder', id: transaction });
        let numLines = customer.getLineCount({ sublistId: 'item' });

        try {
            let parametrosRespo = _controller.parametrizacion(relateditem);
            //log.debug('parametrizacion pruebas', parametrosRespo);

            if (parametrosRespo.length != 0) {
                for (let j = 0; j < parametrosRespo.length; j++) {
                    //log.debug('parámetros', parametrosRespo[j][0] + ' - ' + parametrosRespo[j][1]);
                    if (parametrosRespo[j][0] == ALQUILER_PARAM) {
                        esAlquiler = parametrosRespo[j][1];
                        break;
                    }
                }
            }
            //log.debug('ESALQUILER', esAlquiler);
            // if (esAlquiler == 'continue') {
            //     for (let i = 0; i < numLines; i++) {
            //         let AplicaPPTO = customer.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            //         if (AplicaPPTO == relateditem) {
            //             NumeroItmes = i;
            //         }
            //     }

            //     const busqueda = search.create({
            //         type: "customrecord_ht_record_ordentrabajo",
            //         filters: [["custrecord_ht_ot_orden_servicio", "anyof", transaction]],
            //         columns: [search.createColumn({ name: "internalid", label: "ID" })]
            //     });
            //     var pageData = busqueda.runPaged({ pageSize: 1000 });

            //     log.debug('relateditem', relateditem);
            //     let params = { soid: transaction, soline: NumeroItmes, specord: 'T', assemblyitem: relateditem };
            //     log.debug('params', params);
            //     log.debug('compoundLabel', pageData.pageRanges[0].compoundLabel);

            //     let workOrder = record.create({ type: record.Type.WORK_ORDER, isDynamic: true, defaultValues: params });

            //     workOrder.setValue({ fieldId: 'quantity', value: 1 });
            //     workOrder.setValue({ fieldId: 'custbody_ht_ce_ordentrabajo', value: pageData.pageRanges[0].compoundLabel });
            //     var woId = workOrder.save();
            //     log.debug('woId', woId);
            //     let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: pageData.pageRanges[0].compoundLabel });
            //     order.setValue({ fieldId: 'custrecord_ht_ot_ordenfabricacion', value: woId });
            //     order.save();
            // }
            for (let i = 0; i < numLines; i++) {
                let AplicaPPTO = customer.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                if (AplicaPPTO == relateditem) {
                    NumeroItmes = i;
                }
            }

            const busqueda = search.create({
                type: "customrecord_ht_record_ordentrabajo",
                filters: [["custrecord_ht_ot_orden_servicio", "anyof", transaction]],
                columns: [search.createColumn({ name: "internalid", label: "ID" })]
            });
            var pageData = busqueda.runPaged({ pageSize: 1000 });

            log.debug('relateditem', relateditem);
            let params = { soid: transaction, soline: NumeroItmes, specord: 'T', assemblyitem: relateditem };
            log.debug('params', params);
            log.debug('compoundLabel', pageData.pageRanges[0].compoundLabel);

            let workOrder = record.create({ type: record.Type.WORK_ORDER, isDynamic: true, defaultValues: params });

            workOrder.setValue({ fieldId: 'quantity', value: 1 });
            workOrder.setValue({ fieldId: 'custbody_ht_ce_ordentrabajo', value: pageData.pageRanges[0].compoundLabel });
            var woId = workOrder.save();
            log.debug('woId', woId);
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: pageData.pageRanges[0].compoundLabel });
            order.setValue({ fieldId: 'custrecord_ht_ot_ordenfabricacion', value: woId });
            order.save();
        } catch (error) {
            log.error('Error-POST', error);
            return error.message;
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
