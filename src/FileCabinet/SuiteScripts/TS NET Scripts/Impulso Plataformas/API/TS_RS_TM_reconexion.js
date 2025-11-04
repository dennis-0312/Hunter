/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {
    let URL = "https://telematicsapi.hunterlabs.io" //SB: https://test-telematicsapi.hunterlabs.io / PR: https://telematicsapi.hunterlabs.io
    let TOKEN = 'ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI='

    function _post(context) {
        let headers1 = [];
        headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Basic ' + TOKEN;
        headers1['X-HTTP-Method-Override'] = 'PATCH';
        var resCustomer = https.put({
            url: URL + "/customer/user/" + context.customer + "/",
            headers: headers1,
            body: JSON.stringify({ "is_active": true })
        });

        
        var resDevice = https.put({
            url: URL + "/device/" + context.device + "/",
            headers: headers1,
            body: JSON.stringify({ "active": true })
        });
        var resAssetDevice = https.put({
            url: URL + "/asset/" + context.asset + "/device-add/",
            headers: headers1,
            body: JSON.stringify({
                "device_id": context.device
            })
        });
        var resAssetUser = https.put({
            url: URL + "/asset/" + context.asset + "/user-add/",
            headers: headers1,
            body: JSON.stringify({
                "device_id": context.device
            })
        });
        resDevice = JSON.parse(resDevice.body);
        resCustomer = JSON.parse(resCustomer.body);
        log.debug("resp-code", resCustomer);
        return {
            "Customer": resCustomer, "Device": resDevice, "AssetDevice": resAssetDevice.body,
            "AssetUser": resAssetUser.body
        };
    }
    return {
        post: _post
    }
});