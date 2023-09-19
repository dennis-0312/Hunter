/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {
    function _post(context) {
        log.error("context", context);
        let headers1 = [];
        headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
        headers1['X-HTTP-Method-Override'] = 'PATCH';

        var respDevice = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/device/" + context.device.id + "/",
            headers: headers1,
            body: JSON.stringify({
                "active": false
            })
        });
        log.error("respDevice", respDevice);
        respDevice = JSON.parse(respDevice.body);

        var respAsset = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + context.asset.id + "/",
            headers: headers1,
            body: JSON.stringify({
                "active": false
            })
        });
        log.error("respAsset", respAsset);
        respAsset = JSON.parse(respAsset.body);

        var respDeviceRemove = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + context.asset.id + "/device-remove/",
            headers: headers1,
            body: JSON.stringify({
                "device_id": context.device.id
            })
        });
        log.error("respDeviceRemove", respDeviceRemove);

        var respUserRemove = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + context.asset.id + "/user-remove/",
            headers: headers1,
            body: JSON.stringify({
                "user_id": context.customer.id
            })
        });
        log.error("respUserRemove", respUserRemove);

        var respoAssetCommands = new Array();
        if (context.customer.id && context.asset.id) {
            delete headers1['X-HTTP-Method-Override'];
            var respUserAssetCommand = https.get({
                url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/?user=" + context.customer.id + "&asset=" + context.asset.id,
                headers: headers1
            });
            log.error("respUserAssetCommand", respUserAssetCommand);
            respUserAssetCommand = JSON.parse(respUserAssetCommand.body);

            for (let i = 0; i < respUserAssetCommand.count; i++) {
                const respRemoveUserAssetCommands = https.put({
                    url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/" + respUserAssetCommand.results[i].id + "/remove-user-asset-commands/",
                    headers: headers1,
                    body: JSON.stringify({
                        "user": respUserAssetCommand.results[i].user,
                        "asset": respUserAssetCommand.results[i].asset
                    })
                });
                log.error("respRemoveUserAssetCommands", respRemoveUserAssetCommands);
                respoAssetCommands.push(respRemoveUserAssetCommands.body);
            }
        }

        return {
            "device": respDevice,
            "asset": respAsset,
            "DeviceRemove": respDeviceRemove.body, "UserRemove": respUserRemove.body,
            "RemoveUserAssetCommands": respRemoveUserAssetCommands.body, "AssetCommands": respoAssetCommands
        };
    }
    return {
        post: _post
    }
});


