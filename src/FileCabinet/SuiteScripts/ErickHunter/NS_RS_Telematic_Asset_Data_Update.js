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

            let assetResponse = {};
            if (context.asset.name == "") {
                return getResultResponse("error", results, `No se envío un nombre para el vehículo`);
            } else if (context.asset.name != "S/P") {
                let getAssetParams = { name: context.asset.name };
                let getAssetUrl = formatUrl(`${urlBase}/asset/`, getAssetParams);
                let getAssetResponse = https.get({ headers, url: getAssetUrl });
                if (OK_STATUS_CODE.indexOf(getAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetResponse.code, error: JSON.parse(getAssetResponse.body) }));
                getAssetResponse = JSON.parse(getAssetResponse.body);
                log.error("getAssetResponse", getAssetResponse);

                if (getAssetResponse.count == 0) {
                    return getResultResponse("error", results, `No se encontró un vehículo con el name ${context.asset.name}`);
                } else if (getAssetResponse.count == 1) {
                    context.asset.id = getAssetResponse.results[0].id;
                    let headers = getPatchHeaders();
                    let patchAssetUrl = `${urlBase}/asset/${context.asset.id}/`;
                    let patchAssetResponse = https.put({
                        headers,
                        url: patchAssetUrl,
                        body: JSON.stringify(context.asset)
                    });
                    assetResponse = JSON.parse(patchAssetResponse.body);
                    results.push(getResponseResult(patchAssetResponse.code, `PATCH: ${patchAssetUrl}`, assetResponse));
                    if (OK_STATUS_CODE.indexOf(patchAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetResponse.code, error: assetResponse }));
                    log.error("patchAssetResponse", assetResponse);

                } else {
                    return getResultResponse("error", results, `Se encontró más de un vehículo con el name ${context.asset.name}`);
                }

            } else if (context.asset.id) {
                let headers = getPatchHeaders();
                let patchAssetUrl = `${urlBase}/asset/${context.asset.id}/`;
                let patchAssetResponse = https.put({
                    headers,
                    url: patchAssetUrl,
                    body: JSON.stringify(context.asset)
                });
                assetResponse = JSON.parse(patchAssetResponse.body);
                results.push(getResponseResult(patchAssetResponse.code, `PATCH: ${patchAssetUrl}`, assetResponse));
                if (OK_STATUS_CODE.indexOf(patchAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetResponse.code, error: assetResponse }));
                log.error("patchAssetResponse", assetResponse);
            } else {
                let postAssetUrl = `${urlBase}/asset/`;
                let postAssetResponse = https.post({
                    headers,
                    url: postAssetUrl,
                    body: JSON.stringify(context.asset)
                });
                assetResponse = JSON.parse(postAssetResponse.body);
                results.push(getResponseResult(postAssetResponse.code, `POST: ${postAssetUrl}`, assetResponse));
                if (OK_STATUS_CODE.indexOf(postAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: postAssetResponse.code, error: assetResponse }));
                log.error("postAssetResponse", assetResponse);
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
