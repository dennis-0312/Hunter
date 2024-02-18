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
        headers1['X-HTTP-Method-Override'] = 'PATCH';

        log.error("body", {
            "product": context.product,
            "name": context.name,
            "custom_name": context.custom_name,
            "description": context.description,
            "contract_code": context.contract_code,
            "owner": context.owner,
            "aceptation_date": context.aceptation_date,
            "active": context.active,
            "attributes": context.attributes,
            "doors_sensors": context.doors_sensors,
            "asset_type": context.asset_type,
            "product_expire_date": context.product_expire_date
        });
        var respasset = https.put({
            url: "https://test-telematicsapi.hunterlabs.io/asset/" + context.id + "/",
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
                "doors_sensors": context.doors_sensors,
                "asset_type": context.asset_type,
                "product_expire_date": context.product_expire_date
            })
        });

        log.debug("PUT /asset/" + context.id + "/", respasset);
        respasset = JSON.parse(respasset.body);
        log.debug("Response Body:", respasset);
        return { "asset": respasset };
    }
    return {
        post: _post
    }
});