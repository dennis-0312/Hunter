/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/https'], function(log,https) {
    function _post(context) {
            let newCustomer;
 			let headers1 = [];
      	    headers1['Accept'] = '*/*';
            headers1['Content-Type'] = 'application/json';
            headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
            var GetCustomer = https.get({
                url:"https://test-telematicsapi.hunterlabs.io/customer/user/?username="+context.customerNew.username,
                headers: headers1
            });
            GetCustomer = JSON.parse(GetCustomer.body);
            if(GetCustomer.count ){
                newCustomer=GetCustomer.results[0].id;
            }else{
                var respCustomer = https.post({
                    url: "https://test-telematicsapi.hunterlabs.io/customer/user/",
                    headers: headers1,
                    body: JSON.stringify(context.customerNew),
                });
                respCustomer = JSON.parse(respCustomer.body);
                newCustomer = respCustomer.id
            }
            
            
            var respoRemoveUserAssetCommands =new Array();
      		var responUserAssetCommand =new Array();
            if(context.commandUserAsset){
                for (let i = 0; i < context.commandUserAsset.length; i++) {
                    const respRemoveUserAssetCommands = https.put({
                        url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/"+context.commandUserAsset[i].id+"/remove-user-asset-commands/",
                        headers: headers1,
                        body: JSON.stringify({
                            "user": context.customerOld,
                            "asset": context.asset
                        })
                    });
                    respoRemoveUserAssetCommands[i] =respRemoveUserAssetCommands.body;
                    var respUserAssetCommand = https.post({
                        url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/"+context.commandUserAsset[i].id+"/add-user-asset-commands/",
                        headers: headers1,
                        body: JSON.stringify({
                            "commands": [
                                context.commandUserAsset[i].command
                              ],
                              "user": newCustomer,
                              "asset": context.asset
                        }),
                      });
                        respUserAssetCommand = JSON.parse(respUserAssetCommand.body);
                        responUserAssetCommand[i] = respUserAssetCommand;
                }
            }
            
            const respSetPassword = https.get({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/"+newCustomer+"/set_password/",
                headers: headers1
            });
            
            headers1['X-HTTP-Method-Override'] = 'PATCH';
          
            const respUserRemove = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset/"+context.asset+"/user-remove/",
                headers: headers1,
                body: JSON.stringify({
                    "user_id":context.customerOld
                })
            });
            const respAddUser = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset/"+context.asset+"/user-add/",
                headers: headers1,
                body: JSON.stringify({
                    "user_id":newCustomer
                })
            });
            log.debug("resp-code", respAddUser);
            return {"newCustomer":newCustomer,"AddUser" : respAddUser.body,
                    "UserRemove"  : respUserRemove.body,
                    "SetPassword":respSetPassword.body};
    }
    return {
        post: _post
    }
});