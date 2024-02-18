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

            // ASSET
            let assetResponse = {};
            if (!context.asset.name || context.asset.name == "S/P") {
                return getResultResponse("error", results, `No se envío un nombre para el vehículo`);
            } else {
                let getAssetParams = { name: context.asset.name };
                let getAssetUrl = formatUrl(`${urlBase}/asset/`, getAssetParams);
                let getAssetResponse = https.get({ headers, url: getAssetUrl });
                if (OK_STATUS_CODE.indexOf(getAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetResponse.code, error: JSON.parse(getAssetResponse.body) }));
                getAssetResponse = JSON.parse(getAssetResponse.body);
                log.error("getAssetResponse", getAssetResponse);
                if (getAssetResponse.count == 0) return getResultResponse("error", results, `No se encontró un vehículo con el name ${context.asset.name}`);
            }

            // ASSET - COMMAND
            let getAssetCommandParams = { asset: assetResponse.id };
            let getAssetCommandUrl = formatUrl(`${urlBase}/asset-command/`, getAssetCommandParams);
            let getAssetCommandResponse = https.get({ headers, url: getAssetCommandUrl });
            if (OK_STATUS_CODE.indexOf(getAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetCommandResponse.code, error: JSON.parse(getDeviceResponse.body) }));
            getAssetCommandResponse = JSON.parse(getAssetCommandResponse.body);
            log.error("getAssetCommandResponse", getAssetCommandResponse);

            for (let i = 0; i < context.command.length; i++) {
                let assetCommandFound = getAssetCommandResponse.result.find(assetCommand => assetCommand.command == context.command[i]);
                if (assetCommandFound === undefined) {
                    let postAssetCommandUrl = `${urlBase}/asset-command/`;
                    let postAssetCommandResponse = https.post({
                        headers,
                        url: postAssetCommandUrl,
                        body: JSON.stringify({ status: 1, command: context.command[i], asset: assetResponse.id })
                    });
                    let assetCommandResponse = JSON.parse(postAssetCommandResponse.body);
                    results.push(getResponseResult(postAssetCommandResponse.code, `POST: ${postAssetCommandUrl}`, assetCommandResponse));
                    if (OK_STATUS_CODE.indexOf(postAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: postAssetCommandResponse.code, error: assetCommandResponse }));
                    log.error("postAssetCommandResponse", assetCommandResponse);

                } else if (assetCommandFound.status != 1) {
                    let headers = getPatchHeaders();
                    let patchAssetCommandUrl = `${urlBase}/asset-command/`;
                    let patchAssetCommandResponse = https.put({
                        headers,
                        url: patchAssetCommandUrl,
                        body: JSON.stringify({ status: 1, command: context.command[i], asset: assetResponse.id })
                    });
                    let assetCommandResponse = JSON.parse(patchAssetCommandResponse.body);
                    results.push(getResponseResult(patchAssetCommandResponse.code, `PATCH: ${patchAssetCommandUrl}`, assetCommandResponse));
                    if (OK_STATUS_CODE.indexOf(patchAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetCommandResponse.code, error: assetCommandResponse }));
                    log.error("patchAssetCommandResponse", assetCommandResponse);
                }
            }

            return getResultResponse("ok", results, "Ejecución exitosa");
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
