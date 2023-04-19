/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/log','N/record', 'N/https'], function(log,record,https) {

  

    function afterSubmit(context) {
        let objRecord = context.newRecord;
        let ordenId = objRecord.id;
        let idTelematic = objRecord.getValue({fieldId:'custrecord_ht_mc_id_telematic'});
        if (context.type === 'create' || context.type === 'edit') {
            if(idTelematic.length ==0){
                let telemat = {
                    device:{
                        report_from: 3,
                        active: true,
                        model: 1,
                        company_code: "PruebaEvol",
                        id: objRecord.getValue('name')
                    }
                }
                let Telematic = envioTelematic(telemat);
                log.debug('Telematic',Telematic);
                Telematic = JSON.parse(Telematic);
                
                if (Telematic.Device.id) {
                    let cliente  = record.load({ type:'customrecord_ht_record_mantchaser', id:ordenId}); 
                    cliente.setValue({fieldId:'custrecord_ht_mc_id_telematic',value:Telematic.Device.id})
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
            deploymentId: 'customdeploy_ts_rs_new_device',
            scriptId: 'customscript_ts_rs_new_device',
            headers: myRestletHeaders,
        });
        let response = myRestletResponse.body;
        return response;
    }
    return {
        
        afterSubmit: afterSubmit
    }
});

