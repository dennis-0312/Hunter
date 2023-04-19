/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/https'], function(log,https) {

    function _post(context) {
            let headers1 = [];
      	    headers1['Accept'] = '*/*';
            headers1['Content-Type'] = 'application/json';
            headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
            var GetCustomer = https.get({
                url:"https://test-telematicsapi.hunterlabs.io/customer/user/?first_name="+context.customer.first_name+"&last_name="+context.customer.last_name+"&username="+context.customer.username,
                headers: headers1
            });
            var GetDevice = https.get({
                url:"https://test-telematicsapi.hunterlabs.io/device/?id="+context.device.id,
                headers: headers1
            });
            GetCustomer = JSON.parse(GetCustomer.body);
            GetDevice = JSON.parse(GetDevice.body);
      		if(GetDevice.count || GetCustomer.count){
              return {"GetDevice":GetDevice,"GetCustomer":GetCustomer};
            }
           
            var respCustomer = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/",
                headers: headers1,
                body: JSON.stringify(context.customer),
            });
      		var respAsset = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/asset/",
                headers: headers1,
                body: JSON.stringify(context.asset),
            });
      		var respDevice = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/device/",
                headers: headers1,
                body: JSON.stringify(context.device),
            });
      		respCustomer = JSON.parse(respCustomer.body);
      		respAsset = JSON.parse(respAsset.body);
      		respDevice = JSON.parse(respDevice.body);
      		var responAssetCommand=new Array();
            var responUserAssetCommand =new Array();
      		for (let i = 0; i < context.command.length; i++) {
              	var respAssetCommand = https.post({
                  url: "https://test-telematicsapi.hunterlabs.io/asset-command/",
                  headers: headers1,
                  body: JSON.stringify({
                    "status":1,
                    "command":context.command[i],
                    "asset":respAsset.id
                  }),
            	});
              respAssetCommand = JSON.parse(respAssetCommand.body);
              responAssetCommand[i] =respAssetCommand;
              var respUserAssetCommand = https.post({
                  url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/",
                  headers: headers1,
                  body: JSON.stringify({
                    "can_execute":true,
                    "command":context.command[i],
                    "user":respCustomer.id,
                    "asset":respAsset.id
                  }),
            	});
              respUserAssetCommand = JSON.parse(respUserAssetCommand.body);
              responUserAssetCommand[i] = respUserAssetCommand;
            }
            const respSetPassword = https.get({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/"+respCustomer.id+"/set_password/",
                headers: headers1
            });
      		headers1['X-HTTP-Method-Override'] = 'PATCH';
      	    const respDeviceAdd = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset/"+respAsset.id+"/device-add/",
                headers: headers1,
                body: JSON.stringify({
                    "device_id":respDevice.id
                })
            });
      		const respAddUser = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset/"+respAsset.id+"/user-add/",
                headers: headers1,
                body: JSON.stringify({
                    "user_id":respCustomer.id
                })
            });
            log.debug("resp-code", respCustomer);
            return  {"device":respDevice,"customer":respCustomer, "asset" :respAsset,"deviceAdd": respDeviceAdd.body,"userAdd":respAddUser.body,"Assetcommand":responAssetCommand,"UserAssetCommand":responUserAssetCommand,"SetPassword":respSetPassword.body };
    }

    return {
        post: _post
    }
});

;

