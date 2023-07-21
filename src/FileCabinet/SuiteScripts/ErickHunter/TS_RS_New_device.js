/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/https'], function(log,https) {



    function _post(context) {
        log.error("context", context.device);
        let headers1 = [];
      	headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
        var respDevice = https.post({
            url: "https://test-telematicsapi.hunterlabs.io/device/",
            headers: headers1,
            body: JSON.stringify(context.device),
        });
        respDevice = JSON.parse(respDevice.body);
        return  {"Device":respDevice };
    }

   

    return {
        post: _post

    }
});
