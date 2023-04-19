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
            var respDevice= https.put({
                url: "https://test-telematicsapi.hunterlabs.io/device/"+context.id+"/",
                headers: headers1,
                body: JSON.stringify({
                    "report_from": context.report_from ,
                    "active": context.active ,
                    "model": context.model,
                    "company_code": context.company_code ,
                    "id": context.id 
                })
            });
            respDevice = JSON.parse(respDevice.body);
            log.debug("resp-code", respDevice);
            return {"Device" : respDevice};
    }
    return {
        post: _post
    }
});