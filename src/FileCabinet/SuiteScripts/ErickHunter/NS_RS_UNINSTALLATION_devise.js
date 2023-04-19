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
            headers1['X-HTTP-Method-Override'] = 'PATCH';
            
            var respDevice = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/device/"+context.device+"/",
                headers: headers1,
                body: JSON.stringify({
                    "active":false
                })
            });
            respDevice = JSON.parse(respDevice.body);
       		var respAsset = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset/"+context.asset+"/",
                headers: headers1,
                body: JSON.stringify({
                    "active":false
                })
            });
            respAsset = JSON.parse(respAsset.body);
            var respDeviceRemove = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset/"+context.asset+"/device-remove/",
                headers: headers1,
                body: JSON.stringify({
                    "device_id":context.device
                })
            });
            var respUserRemove = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset/"+context.asset+"/user-remove/",
                headers: headers1,
                body: JSON.stringify({
                    "user_id":context.Customer
                })
            });
            log.debug("resp-code", respDevice);
            var respoAssetCommands =new Array();
            for (let i = 0; i < context.commandAsset.length; i++) {
                var respAssetCommands = https.put({
                    url: "https://test-telematicsapi.hunterlabs.io/asset-command/"+context.commandAsset[i].id+"/",
                    headers: headers1,
                    body: JSON.stringify({
                        "status": 0,
                        "command": context.commandAsset[i].command,
                        "asset": context.asset
                    })
                });
                respoAssetCommands[i] =JSON.parse(respAssetCommands.body);
            }
            let headersPut = [];
            headersPut['Accept'] = '*/*';
            headersPut['Content-Type'] = 'application/json';
            headersPut['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
            const respRemoveUserAssetCommands = https.put({
                url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/"+context.asset+"/remove-user-asset-commands/",
                headers: headersPut,
                body: JSON.stringify({
                    "user": context.Customer,
                    "asset": context.asset
                })
            });
            return {"device" : respDevice,
                    "asset"  : respAsset,
                    "DeviceRemove":respDeviceRemove.body,"UserRemove":respUserRemove.body,
                    "RemoveUserAssetCommands":respRemoveUserAssetCommands.body,"AssetCommands":respoAssetCommands};
    }
    return {
        post: _post
    }
});



