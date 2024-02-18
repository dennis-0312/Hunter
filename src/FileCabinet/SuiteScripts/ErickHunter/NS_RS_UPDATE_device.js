/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {
    const _post = (context) => {
        let headers = getHeaderRequest();
        let body = getBodyRequest(context);
        let url = `https://test-telematicsapi.hunterlabs.io/device/${context.id}/`;
        log.error("PUT", url)
        log.error("BodyRequest", body);
        let respDevice = https.put({
            url,
            headers,
            body
        });
        log.debug(`Response`, respDevice);

        respDevice = JSON.parse(respDevice.body);
        return { "Device": respDevice };
    }

    const getBodyRequest = ({ report_from, active, model, company_code, id }) => {
        let body = JSON.stringify({ report_from, active, model, company_code, id });
        return body;
    }

    const getHeaderRequest = () => {
        let headers = [];
        headers['Accept'] = '*/*';
        headers['Content-Type'] = 'application/json';
        headers['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
        headers['X-HTTP-Method-Override'] = 'PATCH';
        return headers;
    }

    return {
        post: _post
    }
});