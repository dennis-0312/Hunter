/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {

    function _post(context) {
        let headers1 = [];
        headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';

        /*
        var GetCustomer = https.get({
            url: "https://test-telematicsapi.hunterlabs.io/customer/user/?first_name=" + context.customer.first_name + "&last_name=" + context.customer.last_name,
            headers: headers1
        });
        var GetDevice = https.get({
            url: "https://test-telematicsapi.hunterlabs.io/device/?id=" + context.device.id,
            headers: headers1
        });
        var GetAsset = https.get({
            url: "https://test-telematicsapi.hunterlabs.io/asset/?name=" + context.asset.name,
            headers: headers1
        });
        GetCustomer = JSON.parse(GetCustomer.body);
        GetDevice = JSON.parse(GetDevice.body);
        GetAsset = JSON.parse(GetAsset.body);
        log.debug("GetCustomer", GetCustomer);
        log.debug("GetDevice", GetDevice);
        log.debug("GetAsset", GetAsset);*/
        var GetDevice = https.get({
            url: "https://test-telematicsapi.hunterlabs.io/device/?id=" + context.device.id,
            headers: headers1
        });
        GetDevice = JSON.parse(GetDevice.body);

        var respCustomer;
        if (!context.customer.id) {
            respCustomer = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/",
                headers: headers1,
                body: JSON.stringify(context.customer),
            });
            respCustomer = JSON.parse(respCustomer.body);
            log.debug("respCustomer", respCustomer);
        } else {
            respCustomer = https.get({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/" + context.customer.id + "/",
                headers: headers1
            });
            respCustomer = JSON.parse(respCustomer.body);
            log.debug("respCustomer get", respCustomer);        
        }

        var respDevice;
        if (!GetDevice.count) {
            respDevice = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/device/",
                headers: headers1,
                body: JSON.stringify(context.device),
            });
            respDevice = JSON.parse(respDevice.body);
            log.debug("respDevice", respDevice);
        } else {
            respDevice = GetDevice.results[0];
        }

        var respAsset = {};
        if (!context.asset.id) {
            respAsset = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/asset/",
                headers: headers1,
                body: JSON.stringify(context.asset),
            });
            respAsset = JSON.parse(respAsset.body);
            log.debug("respAsset", respAsset);
        } else {
            respAsset = https.get({
                url: "https://test-telematicsapi.hunterlabs.io/asset/" + context.asset.id + "/",
                headers: headers1
            });
            respAsset = JSON.parse(respAsset.body);
            log.debug("respAsset GET", respAsset);

        }
        var responAssetCommand = new Array();
        var responUserAssetCommand = new Array();
        for (let i = 0; i < context.command.length; i++) {
            var respAssetCommand = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/asset-command/",
                headers: headers1,
                body: JSON.stringify({
                    "status": 1,
                    "command": context.command[i],
                    "asset": respAsset.id
                }),
            });
            respAssetCommand = JSON.parse(respAssetCommand.body);
            log.debug("respAssetCommand " + i, respAssetCommand);
            responAssetCommand[i] = respAssetCommand;
            var respUserAssetCommand = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/user-asset-command/",
                headers: headers1,
                body: JSON.stringify({
                    "can_execute": true,
                    "command": context.command[i],
                    "user": respCustomer.id,
                    "asset": respAsset.id
                }),
            });
            respUserAssetCommand = JSON.parse(respUserAssetCommand.body);
            responUserAssetCommand[i] = respUserAssetCommand;
        }
        const respSetPassword = https.get({
            url: "https://test-telematicsapi.hunterlabs.io/customer/user/" + respCustomer.id + "/set_password/",
            headers: headers1
        });
        log.debug("respSetPassword", respSetPassword);

        headers1['X-HTTP-Method-Override'] = 'PATCH';
        const respDeviceAdd = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + respAsset.id + "/device-add/",
            headers: headers1,
            body: JSON.stringify({
                "device_id": respDevice.id
            })
        });
        log.debug("respDeviceAdd", respSetPassword);

        const respAddUser = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + respAsset.id + "/user-add/",
            headers: headers1,
            body: JSON.stringify({
                "user_id": respCustomer.id
            })
        });
        log.debug("respAddUser", respAddUser);

        log.debug("resp-code", respCustomer);
        return { "device": respDevice, "customer": respCustomer, "asset": respAsset, "deviceAdd": respDeviceAdd.body, "userAdd": respAddUser.body, "Assetcommand": responAssetCommand, "UserAssetCommand": responUserAssetCommand, "SetPassword": respSetPassword.body };
    }

    return {
        post: _post
    }
});

