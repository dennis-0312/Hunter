/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {

    let OK_STATUS_CODE = [200, 201];

    const post = (context) => {
        try {
            let results = [];
            let headers = getHeaders();
            let urlBase = getTelematicUrlBase();

            if (!context.customer.username) return getResultResponse("error", results, `Propietario no tiene correo AMI configurado`);
            let getCustomerParams = { username: context.customer.username };
            let getCustomerUrl = formatUrl(`${urlBase}/customer/user/`, getCustomerParams);
            let getCustomerResponse = https.get({ headers, url: getCustomerUrl });
            if (OK_STATUS_CODE.indexOf(getCustomerResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getCustomerResponse.code, error: JSON.parse(getCustomerResponse.body) }));
            getCustomerResponse = JSON.parse(getCustomerResponse.body);
            log.error("getCustomerResponse", getCustomerResponse);

            let customerResponse = {};
            if (getCustomerResponse.count == 0) {
                return getResultResponse("error", results, `No se encontró un propietario con el username ${context.customer.username}`);
            } else if (getCustomerResponse.count == 1) {
                context.customer.id = getCustomerResponse.results[0].id;
                let headers = getPatchHeaders();
                let patchCustomerUrl = `${urlBase}/customer/user/${context.customer.id}/`;
                let patchCustomerResponse = https.put({
                    headers,
                    url: patchCustomerUrl,
                    body: JSON.stringify(context.customer)
                });
                customerResponse = JSON.parse(patchCustomerResponse.body);
                results.push(getResponseResult(patchCustomerResponse.code, `PATCH: ${patchCustomerUrl}`, customerResponse));
                if (OK_STATUS_CODE.indexOf(patchCustomerResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchCustomerResponse.code, error: customerResponse }));
                log.error("patchCustomerResponse", customerResponse);
            } else {
                return getResultResponse("error", results, `Se encontró más de un propietario con el username ${context.customer.username}`);
            }

            return getResultResponse("ok", results, "Ejecución exitosa", {customer: customerResponse});
        } catch (error) {
            log.error("error", error);
            return getResultResponse("error", results, "Ocurrió un error inesperado en la instalación");
        }
    }

    const formatUrl = (domain, params) => {
        return url.format({ domain, params });
    }

    const getHeaders = () => {
        let headers = {};
        headers['Accept'] = '*/*';
        headers['Content-Type'] = 'application/json';
        headers['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
        return headers;
    }

    const getPatchHeaders = () => {
        let headers = {};
        headers['Accept'] = '*/*';
        headers['Content-Type'] = 'application/json';
        headers['Authorization'] = 'Basic ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI=';
        headers['X-HTTP-Method-Override'] = 'PATCH';
        return headers;
    }

    const getTelematicUrlBase = () => {
        return "https://test-telematicsapi.hunterlabs.io";
    }

    const getResultResponse = (status, results, message, data) => {
        return { status, results, message, data };
    }

    const getResponseResult = (code, operation, body) => {
        return {code, operation, body};
    }

    return {
        post
    }
});
