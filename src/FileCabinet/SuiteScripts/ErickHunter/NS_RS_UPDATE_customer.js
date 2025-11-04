/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], (log, https) => {

    let URL = "https://test-telematicsapi.hunterlabs.io" //SB: https://test-telematicsapi.hunterlabs.io / PR: https://telematicsapi.hunterlabs.io
    let TOKEN = 'ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI='

    const _post = (context) => {
        let urlBase = getTelematicUrlBase();
        let headers1 = [];
        headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Basic ' + TOKEN;
        headers1['X-HTTP-Method-Override'] = 'PATCH';
        var respcustomer = https.put({
            url: `${urlBase}/customer/user/${context.id}/`,
            headers: headers1,
            body: JSON.stringify({
                "username": context.username,
                "customer": context.customer,
                "first_name": context.first_name,
                "last_name": context.last_name,
                "is_active": context.is_active,
                "email": context.email
            })
        });
        respcustomer = JSON.parse(respcustomer.body);
        log.debug("resp-code", respcustomer);
        return { "customer ": respcustomer };
    }

    const getTelematicUrlBase = () => {
        return URL;
    }

    return {
        post: _post
    }
});
