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
            let getResponse = context.endpoint;

            if (context.endpoint == 'asset/id') {
                let validationResult = validateFields(context);
                if (validationResult != null) return getResultResponse("error", results, validationResult.message);
                let getAssetUrl = `${urlBase}/asset/${context.asset}/`;
                let getResponse = https.get({ headers, url: getAssetUrl });
                if (OK_STATUS_CODE.indexOf(getResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getResponse.code, error: JSON.parse(getResponse.body) }));
                getResponse = JSON.parse(getResponse.body);
                log.debug("getAssetResponse", getResponse);
            }
            return getResponse;
        } catch (error) {
            log.error("error", error);
            return getResultResponse("error", "Ocurrió un error inesperado", getAssetResponse);
        }
    }

    const getHeaders = () => {
        let headers = {};
        headers['Accept'] = '*/*';
        headers['Content-Type'] = 'application/json';
        headers['Authorization'] = 'Basic ' + TOKEN;
        return headers;
    }

    const getTelematicUrlBase = () => {
        return URL;
    }

    const getResultResponse = (status, message, results, data) => {
        return { status, message, results, data };
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
            validation.message = "Verificar el campo asset en la trama.";
            return validation;
        }

        return validation;
    }
    const validatename = (status) => {
        let validation = { message: "", status: "ok" };
        if (!status) {
            validation.status = "error";
            validation.message = "Verificar el campo name en la trama.";
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
            validation.message = "Verificar el campo active en la trama.";
            return validation;
        }

        return validation;
    }



    return {
        post
    }

});