/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search'], (search) => {        
    const beforeLoad = (scriptContext) => {
        try{
            let ftl = 0 // Valor para la plantilla a utilizar (Para pantallas con más de 1 plantilla)
            const form = scriptContext.form;
            form.clientScriptModulePath = 'SuiteScripts/IntegracionesHunter/Plantillas/ClientScripts/HU_EC_CS_STANDARD_PDF.js'

            var objRecord = scriptContext.newRecord;
            var id = objRecord.id;
            var type = objRecord.type;
            var tranIdStart  = (objRecord.getValue('tranid') ?? '').slice(0,3) // No mostrar en OS de Proveeduría

            const custScript = "customscript_hu_ec_st_orden_servicio";
            const custDeploy = "customdeploy_hu_ec_st_orden_servicio";

            if (scriptContext.type === scriptContext.UserEventType.VIEW && tranIdStart != 'OSP') {
                try{
                    ftl = 1 // 1 - Plantilla de Acta de Recepción
    
                    let bienId = objRecord.getValue({fieldId: 'custbody_ht_so_bien'}); 
    
                    if(bienId){
                        if(esVehiculoTerrrestre(bienId) && existeRecepcion(id)){
                            form.addButton({                    
                                id: "custpage_print_acta_button",
                                label: "Acta Recepción",
                                functionName: `customButtonFunction('${type}','${id}','${custScript}','${custDeploy}','${ftl}')`
                            });
                        }
                    }
                }catch(error){
                    log.error('Error-btn-Acta', error);
                }

                try{
                    ftl = 2 // 2 - Plantilla base de Orden de Servicio

                    form.addButton({                    
                        id: "custpage_print_os_button",
                        label: "Imprimir OS",
                        functionName: `customButtonFunction('${type}','${id}','${custScript}','${custDeploy}','${ftl}')`
                    });
                    
                }catch(error){
                    log.error('Error-btn-OS', error);
                }
            }
        }catch(error){
            log.error('Error', error);
        }                         
    }

    const esVehiculoTerrrestre = (id) => {
        var searchVehicleType = search.lookupFields({
            type: "customrecord_ht_record_bienes",
            id: id,
            columns: [
                'custrecord_ht_bien_tipobien'
            ]
        });
        let esVehiculo = false
        let tipobien = searchVehicleType.custrecord_ht_bien_tipobien?.length != 0 ? searchVehicleType.custrecord_ht_bien_tipobien[0].value : ""
        if(tipobien == 1){ // 1 es para vehiculos terrestres
            esVehiculo = true
        }
        return esVehiculo
    }

    const existeRecepcion = (id) => {
        let activitySearchObj = search.create({
            type: "activity",
            filters: [
                ["type", "anyof", "Event"], // Las Recepciones son de tipo Event
                "AND",
                ["transaction.internalid", "anyof", id]
            ],
            columns: [
                search.createColumn({name: "internalid", label: "Internal ID"})
            ]
        });
        let result = activitySearchObj.run().getRange({ start: 0, end: 1 });
        return result.length > 0;
    }

    return {
        beforeLoad : beforeLoad
    };
})
