/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config"], (search, record, email, runtime, log, file, task, config) => {
    const customsearch862 = 'customsearch862';
    function execute(context) {
        try {
            var idCustomer = getCustomer();
            log.debug('idCustomer',idCustomer[i]);
            log.debug('idCustomer',idCustomer.length);
             for (let i = 0; i < idCustomer.length; i++) {
                let objRecord = record.load({ type: record.Type.CUSTOMER, id: idCustomer[i], isDynamic: true });
                var territorio = objRecord.getValue('custentity_ht_cl_zonaventa');
                if(territorio){
                    log.debug('territorio',territorio);
                    var idRepresentante = getRepresentante(territorio);
                    if (idRepresentante){
                    log.debug('idRepresentante',idRepresentante);
                     var territorio = objRecord.setValue('salesrep',idRepresentante);
                    objRecord.save(); 
                    }
                 }
            } 
            //log.debug('territorio',territorio);

            //let objRecord = record.load({ type: record.Type.CUSTOMER, id: idRecord, isDynamic: true });


            
        } catch (error) {
            log.error('Error', error);
        }
    }
    function getCustomer() {
        try {
            var arrCustomerId = new Array();
            var busqueda = search.create({
                type: "customer",
                filters:
                [
                ],
                columns:
                [
                   search.createColumn({name: "internalid", label: "Internal ID"})
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
            return arrCustomerId;
        } catch (e) {
            log.error('Error en getCustomer', e);
        }
    }
    function getRepresentante(territorio) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_sales_territory",
                filters:
                [
                   ["internalid","anyof",territorio]
                ],
                columns:
                [
                   search.createColumn({name: "custrecord_ht_st_sales_representante", label: "Sales Representante"})
                ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var representante = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    representante = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return representante;
        } catch (e) {
            log.error('Error en getRepresentante', e);
        }
    }
    return {
        execute: execute
    }
});