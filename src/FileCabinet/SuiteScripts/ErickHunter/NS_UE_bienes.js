define /**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * Task          Date                Author                                         Remarks
 * DT-0000      01 Enero 2022       name lastname <examle@gmail.com>       
*/
 define(['N/log','N/record'],function(log,record) {

        function afterSubmit(context) {
            let ordenId = objRecord.id;
            let customer = record.load({ type: 'customrecord_ht_record_bienes', id:ordenId});
            let altname = customer.getValue({fieldId:'altname'});
            let headers1 = [];
      	    headers1['Accept'] = '*/*';
            headers1['Content-Type'] = 'application/json';
            headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
            let objRecord = context.newRecord;
            if(context.type !== context.UserEventType.EDIT){
                try{
                    var GetCustomer = https.get({
                        url:"https://test-telematicsapi.hunterlabs.io/asset/?user="+"STRING",
                        headers: headers1
                    });
                    GetCustomer = JSON.parse(GetCustomer.body);
                    headers1['X-HTTP-Method-Override'] = 'PATCH';
                    var respasset= https.put({
                        url: "https://test-telematicsapi.hunterlabs.io/asset/"+GetCustomer.id+"/",
                        headers: headers1,
                        body: JSON.stringify({
                            "product": context.product,
                            "name": context.name,
                            "custom_name": context.custom_name,
                            "description": context.description,
                            "contract_code": context.contract_code,
                            "owner": context.owner,
                            "aceptation_date": context.aceptation_date,
                            "active": context.active,
                            "attributes": context.attributes,
                            "doors_sensors":context.doors_sensors,
                            "asset_type": context.asset_type,
                            "product_expire_date": context.product_expire_date
                        })
                    });
                    respasset = JSON.parse(respasset.body);
                    log.debug("resp-code", respasset);
                
                } catch (error){
                    log.error('Error', error);
                }
            }

            if(context.type !== context.UserEventType.CREATE){
                try{
                 
                    var GetCustomer = https.get({
                        url:"https://test-telematicsapi.hunterlabs.io/asset/?user="+"STRING",
                        headers: headers1
                    });
                    GetCustomer = JSON.parse(GetCustomer.body);
                    if( GetCustomer.count){
                        return {"GetCustomer":GetCustomer};
                    }
                    var respAsset = https.post({
                        url: "https://test-telematicsapi.hunterlabs.io/asset/",
                        headers: headers1,
                        body: JSON.stringify({
                            "product": "PruebaEvol",
                            "name": "PruebaEvol",
                            "custom_name": "PruebaEvol",
                            "description": "PruebaEvol",
                            "contract_code": "PruebaEvol",
                            "owner": "403",
                            "aceptation_date": "2021-06-02T00:00:00Z",
                            "active": true,
                            "attributes": [
                            ],
                            "doors_sensors": 0,
                            "asset_type": "2",
                            "product_expire_date": "2026-01-06T00:00:00Z"
                        }),
                    });
                    respAsset = JSON.parse(respAsset.body);
                    log.debug("respAsset" , respAsset);
                } catch (error){
                    log.error('Error', error);
                }
            }
            

        }
        
       
        return {
                afterSubmit : afterSubmit
          }
   }
)