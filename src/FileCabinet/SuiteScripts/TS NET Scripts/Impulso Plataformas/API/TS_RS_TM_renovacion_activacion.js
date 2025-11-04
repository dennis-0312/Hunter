/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/url'], (log, https, url) => {

    let OK_STATUS_CODE = [200, 201];
    let URL = "https://test-telematicsapi.hunterlabs.io" //SB: https://test-telematicsapi.hunterlabs.io / PR: https://telematicsapi.hunterlabs.io
    let TOKEN = 'ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI='

    const post = (context) => {
        let results = [];
        try {
            log.error("context", context);
            let headers = getHeaders();

            let urlBase = getTelematicUrlBase();
            let validationResult = validateFields(context);
            if (validationResult != null) return getResultResponse("error", results, validationResult.message);

            let getAssetUrl = `${urlBase}/asset/${context.asset}/`;
            let getAssetResponse = https.get({ headers, url: getAssetUrl });
            if (OK_STATUS_CODE.indexOf(getAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetResponse.code, error: JSON.parse(getAssetResponse.body) }));
            getAssetResponse = JSON.parse(getAssetResponse.body);
            log.debug("getAssetResponse", getAssetResponse);
            
            if (getAssetResponse.name) {
                let headers = getPatchHeaders();
                let patchAssetDeviceAddUrl = `${urlBase}/asset/${context.asset}/`;
                let patchAssetDeviceAddResponse = https.put({
                    headers,
                    url: patchAssetDeviceAddUrl,
                    body: JSON.stringify({ name: context.name, product_expire_date: context.product_expire_date, active: context.active })
                });
                let deviceAddResponse = patchAssetDeviceAddResponse.body;
                log.error("deviceAddResponse2", deviceAddResponse);
                results.push(getResponseResult(patchAssetDeviceAddResponse.code, `PATCH: ${patchAssetDeviceAddUrl}`, deviceAddResponse));
                if (OK_STATUS_CODE.indexOf(patchAssetDeviceAddResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetDeviceAddResponse.code, error: deviceAddResponse.body }));
            }
            return getResultResponse("ok", "Ejecución exitosa", results);
        } catch (error) {
            log.error("error", error);
            return getResultResponse("error", "Ocurrió un error inesperado", results);
        }
    }

    const formatUrl = (domain, params) => {
        return url.format({ domain, params });
    }

    const getHeaders = () => {
        let headers = {};
        headers['Accept'] = '*/*';
        headers['Content-Type'] = 'application/json';
        headers['Authorization'] = 'Basic ' + TOKEN;
        return headers;
    }

    const getPatchHeaders = () => {
        let headers = {};
        headers['Accept'] = '*/*';
        headers['Content-Type'] = 'application/json';
        headers['Authorization'] = 'Basic ' + TOKEN;
        headers['X-HTTP-Method-Override'] = 'PATCH';
        return headers;
    }

    const getTelematicUrlBase = () => {
        return URL;
    }

    const getResultResponse = (status, message, results, data) => {
        return { status, message, results, data };
    }

    const getResponseResult = (code, operation, body) => {
        return { code, operation, body };
    }

    const validateFields = (context) => {

        let assetValidation = validateAsset(context.asset);
        if (assetValidation.status == "error") return assetValidation;
        let nameValidation = validatename(context.name);
        if (nameValidation.status == "error") return nameValidation;
        let expire_dateValidation = validateexpire_date(context.product_expire_date);
        if (expire_dateValidation.status == "error") return expire_dateValidation;
        let activeValidation = validateactive(context.active);
        if (activeValidation.status == "error") return activeValidation;
        return null;
    }

    const validateAsset = (asset) => {
        let validation = { message: "", status: "ok" };
        if (!asset) {
            validation.status = "error";
            validation.message = "Verificar el campo asset  en la trama.";
            return validation;
        }

        return validation;
    }
    const validatename = (status) => {
        let validation = { message: "", status: "ok" };
        if (!status) {
            validation.status = "error";
            validation.message = "Verificar el campo name  en la trama.";
            return validation;
        }

        return validation;
    }
    const validateexpire_date = (status) => {
        let validation = { message: "", status: "ok" };
        if (!status) {
            validation.status = "error";
            validation.message = "Verificar el campo product_expire_date  en la trama.";
            return validation;
        }

        return validation;
    }
    const validateactive = (status) => {
        let validation = { message: "", status: "ok" };
        if (!status) {
            validation.status = "error";
            validation.message = "Verificar el campo active  en la trama.";
            return validation;
        }

        return validation;
    }



    return {
        post
    }

});