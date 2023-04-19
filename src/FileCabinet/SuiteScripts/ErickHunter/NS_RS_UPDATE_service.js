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
            var respassetCommand= https.put({
                url: "https://test-telematicsapi.hunterlabs.io/asset-command/",
                headers: headers1,
                body: JSON.stringify({
                    "status": context.status,
                    "command": context.command,
                    "asset": context.asset
                })
            });
            respassetCommand = JSON.parse(respassetCommand.body);
            log.debug("resp-code", respassetCommand);
            return {"assetCommand" : respassetCommand};
    }
    return {
        post: _post
    }
});