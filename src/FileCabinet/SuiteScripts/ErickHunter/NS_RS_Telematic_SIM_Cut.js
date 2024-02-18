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

            // CUSTOMER
            if (!context.customer.username) return getResultResponse("error", results, `Propietario no tiene correo AMI configurado`);
            let getCustomerParams = { username: context.customer.username };
            let getCustomerUrl = formatUrl(`${urlBase}/customer/user/`, getCustomerParams);
            let getCustomerResponse = https.get({ headers, url: getCustomerUrl });
            if (OK_STATUS_CODE.indexOf(getCustomerResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getCustomerResponse.code, error: JSON.parse(getCustomerResponse.body) }));
            getCustomerResponse = JSON.parse(getCustomerResponse.body);
            log.error("getCustomerResponse", getCustomerResponse);
            if (getCustomerResponse.count == 0) return getResultResponse("error", results, `No se encontró un propietario con el username ${context.customer.username}`);

            // Device
            let deviceResponse = {};
            if (context.device.id) {
                let getDeviceParams = { id: context.device.id };
                let getDeviceUrl = formatUrl(`${urlBase}/device/`, getDeviceParams);
                let getDeviceResponse = https.get({ headers, url: getDeviceUrl });
                if (OK_STATUS_CODE.indexOf(getDeviceResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getDeviceResponse.code, error: JSON.parse(getDeviceResponse.body) }));
                getDeviceResponse = JSON.parse(getDeviceResponse.body);
                log.error("getDeviceResponse", getDeviceResponse);

                if (getDeviceResponse.count == 1) {
                    context.device.id = getDeviceResponse.results[0].id;
                    context.device.active = false;
                    let headers = getPatchHeaders();
                    let patchDeviceUrl = `${urlBase}/device/${context.device.id}/`;
                    let patchDeviceResponse = https.put({
                        headers,
                        url: patchDeviceUrl,
                        body: JSON.stringify(context.device)
                    });
                    deviceResponse = JSON.parse(patchDeviceResponse.body);
                    results.push(getResponseResult(patchDeviceResponse.code, `PATCH: ${patchDeviceUrl}`, deviceResponse));
                    if (OK_STATUS_CODE.indexOf(patchDeviceResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchDeviceResponse.code, error: deviceResponse }));
                    log.error("patchDeviceResponse", deviceResponse);
                } else if (getDeviceResponse.count == 0) {
                    return getResultResponse("error", results, `No se encontró un dispositivo con el id ${context.device.id}`);
                } else {
                    return getResultResponse("error", results, `Se encontró más de un dispositivo con el id ${context.device.id}`);
                }

            } else {
                return getResultResponse("error", results, `No se envío el id del dispositivo`);
            }

            return getResultResponse("ok", results, "Ejecución exitosa", {device: deviceResponse});
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
