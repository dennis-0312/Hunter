/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/http'], function(log,http) {

    function _get(context) {
      
        let response = http.get({
            url: 'http://www.google.com'
        });
            
            sendGetRequest();
      
        return {response : response};
    }

    function _post(context) {
        
        try {
            let headers1 = [];
      	    headers1['Accept'] = '*/*';
            headers1['Content-Type'] = 'application/json';
            headers1['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
            var raw = JSON.stringify({
                "username": "jicaryichijo@gmail.com",
                "customer": {
                  "identity_document_number": "0932677495",
                  "company_code": "0991259546001",
                  "identity_document_type": 3
                },
                "first_name": "pruebaEvol",
                "last_name": "pruebaEvol",
                "is_active": true,
                "email": "jicaryichijo@gmail.com"
              });
            const resp = https.post({
                url: "https://test-telematicsapi.hunterlabs.io/customer/user/",
                headers: headers1,
                body: raw
            });
            log.debug("resp-code", resp);
            return {response : resp};
        } catch (error) {
            return{ 'Error' : error }
            log.error('Error' , error);
        }
    }

    function _put(context) {
        
    }

    function _delete(context) {
        
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});
