/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/log','N/record', 'N/https'], function(log,record,https) {

  

    function afterSubmit(context) {
        let objRecord = context.newRecord;
        let ordenId = objRecord.id;
        let idTelematic = objRecord.getValue({fieldId:'custrecord_ht_bien_id_telematic'});
        if (context.type === 'create' || context.type === 'edit') {
            if(idTelematic.length ==0){
                let telemat = {
                    asset:{
                        product: "PruebaEvol",
                        name: "PruebaEvol",
                        custom_name: "PruebaEvol",
                        description: "PruebaEvol",
                        contract_code: "PruebaEvol",
                        owner: "403",
                        aceptation_date: "2021-06-02T00:00:00Z",
                        active: true,
                        attributes: [
                        ],
                        doors_sensors: 0,
                        asset_type: "2",
                        product_expire_date: "2026-01-06T00:00:00Z"
                    }
                }
                let Telematic = envioTelematic(telemat);
                log.debug('Telematic',Telematic);
                Telematic = JSON.parse(Telematic);
                
                if (Telematic.Asset.id) {
                    let cliente  = record.load({ type:'customrecord_ht_record_bienes', id:ordenId}); 
                    cliente.setValue({fieldId:'custrecord_ht_bien_id_telematic',value:Telematic.Asset.id})
                    cliente.save(); 
                }
            }
        }
        

       
    }
    const envioTelematic = (json) => {
        let myRestletHeaders = new Array();
        myRestletHeaders['Accept'] = '*/*';
        myRestletHeaders['Content-Type'] = 'application/json';
        let myRestletResponse = https.requestRestlet({
            body: JSON.stringify(json),
            deploymentId: 'customdeploy_ts_rs_new_asset',
            scriptId: 'customscript_ts_rs_new_asset',
            headers: myRestletHeaders,
        });
        let response = myRestletResponse.body;
        return response;
    }
    return {
        
        afterSubmit: afterSubmit
    }
});

