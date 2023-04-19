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
        var respCustomer = https.post({
            
            url: "https://test-telematicsapi.hunterlabs.io/customer/user/",
            headers: headers1,
            body: JSON.stringify(context.customer),
        });
        respCustomer = JSON.parse(respCustomer.body);
        return  {"customer":respCustomer };
  
    }

   

    return {
        
        post: _post
    }
});
