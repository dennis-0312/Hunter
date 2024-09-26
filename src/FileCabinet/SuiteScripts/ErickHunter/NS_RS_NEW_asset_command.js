/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/url'], (log, https, url) => {

    let OK_STATUS_CODE = [200, 201];

    const post = (context) => {
        let results = [];
        try {
            log.error("context", context);
            let headers = getHeaders();
            let urlBase = getTelematicUrlBase();
            let validationResult = validateFields(context);
            if (validationResult != null) return getResultResponse("error", results, validationResult.message);

            //* ASSET-COMMAND |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            let getAssetCommandParams = { asset: context.asset };
            let getAssetCommandUrl = formatUrl(`${urlBase}/asset-command/`, getAssetCommandParams);
            let getAssetCommandResponse = https.get({ headers, url: getAssetCommandUrl });
            if (OK_STATUS_CODE.indexOf(getAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetCommandResponse.code, error: JSON.parse(getDeviceResponse.body) }));
            getAssetCommandResponse = JSON.parse(getAssetCommandResponse.body);
            log.error("getAssetCommandResponse", getAssetCommandResponse);
            //log.error("Commands", context.command);
            let assetCommandFound = getAssetCommandResponse.results.find(assetCommand => assetCommand.command == context.command);
            let assetCommandResponse = 0;
            log.error("assetCommandFound", assetCommandFound);
            if (assetCommandFound === undefined) {
                let postAssetCommandUrl = `${urlBase}/asset-command/`;
                let postAssetCommandResponse = https.post({
                    headers,
                    url: postAssetCommandUrl,
                    body: JSON.stringify({ status: context.status, command: context.command, asset: context.asset })
                });
                assetCommandResponse = JSON.parse(postAssetCommandResponse.body);
                
                results.push(getResponseResult(assetCommandResponse.code, `POST: ${postAssetCommandUrl}`, assetCommandResponse));
                if (OK_STATUS_CODE.indexOf(postAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: postAssetCommandResponse.code, error: assetCommandResponse }));
                log.error("postAssetCommandResponse", assetCommandResponse);
            } else if (assetCommandFound.id) {
                let headers = getPatchHeaders();
                let patchAssetCommandUrl = `${urlBase}/asset-command/${assetCommandFound.id}/`;
                let patchAssetCommandResponse = https.put({
                    headers,
                    url: patchAssetCommandUrl,
                    body: JSON.stringify({ status: context.status, command: context.command, asset: context.asset })
                });
                assetCommandResponse = JSON.parse(patchAssetCommandResponse.body);

                results.push(getResponseResult(patchAssetCommandResponse.code, `PATCH: ${patchAssetCommandUrl}`, assetCommandResponse));
                if (OK_STATUS_CODE.indexOf(patchAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetCommandResponse.code, error: assetCommandResponse }));
                log.error("patchAssetCommandResponse", assetCommandResponse);
            }
            return getResultResponse("ok", results, "Ejecución exitosa");
        } catch (error) {
            log.error("error", error);
            return getResultResponse("error", results, "Ocurrió un error inesperado ");
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
        return { code, operation, body };
    }

    const validateFields = (context) => {

        let assetValidation = validateAsset(context.asset);
        if (assetValidation.status == "error") return assetValidation;
        let statusValidation = validatestatus(context.status);
        if (statusValidation.status == "error") return statusValidation;
        let commandValidation = validatecommand(context.command);
        if (commandValidation.status == "error") return commandValidation;
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
    const validatestatus = (status) => {
        let validation = { message: "", status: "ok" };
        if (!status) {
            validation.status = "error";
            validation.message = "Verificar el campo status  en la trama.";
            return validation;
        }

        return validation;
    }
    const validatecommand = (command) => {
        let validation = { message: "", status: "ok" };
        if (!command) {
            validation.status = "error";
            validation.message = "Verificar el campo command  en la trama.";
            return validation;
        }

        return validation;
    }



    return {
        post
    }

});