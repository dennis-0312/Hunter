/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/url'], (log, https, url) => {

    let OK_STATUS_CODE = [200, 201];

    const post = (context) => {
        let results = [];
        //try {
        log.error("context", context);
        let headers = getHeaders();
        let urlBase = getTelematicUrlBase();
        let validationResult = validateFields(context);
        if (validationResult != null) return getResultResponse("error", results, validationResult.message);

        let getUserAssetCommandParams = { user: context.user, asset: context.asset };
        let getUserAssetCommandUrl = formatUrl(`${urlBase}/user-asset-command/`, getUserAssetCommandParams);
        let getUserAssetCommandResponse = https.get({ headers, url: getUserAssetCommandUrl });
        if (OK_STATUS_CODE.indexOf(getUserAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getUserAssetCommandResponse.code, error: JSON.parse(getUserAssetCommandResponse.body) }));
        getUserAssetCommandResponse = JSON.parse(getUserAssetCommandResponse.body);
        log.error("getUserAssetCommandResponse", getUserAssetCommandResponse);
        let userAssetCommandFound = getUserAssetCommandResponse.results.find(userAssetCommand => userAssetCommand.command == context.command);

        if (userAssetCommandFound) {
            let headers = getHeaders();
            let patchUserAssetCommandUrl = `${urlBase}/user-asset-command/${userAssetCommandFound.id}/remove-user-asset-commands/`;
            let patchUserAssetCommandResponse = https.put({
                headers,
                url: patchUserAssetCommandUrl,
                body: JSON.stringify({ user: context.user, asset: context.asset })
            });
            log.error("patchUserAssetCommandResponse", patchUserAssetCommandResponse.body);
            let userAssetCommandResponse = JSON.parse(patchUserAssetCommandResponse.body);
            results.push(getResponseResult(patchUserAssetCommandResponse.code, `POST: ${patchUserAssetCommandUrl}`, userAssetCommandResponse));
            if (OK_STATUS_CODE.indexOf(patchUserAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchUserAssetCommandResponse.code, error: userAssetCommandResponse }));

            return getResultResponse("ok", results, "Ejecución exitosa");
        } else {
            return getResultResponse("error", results, "No cuenta con Objetos para remover");
        }
        /* } catch (error) {
             log.error("error", error);
             return getResultResponse("error", results, "Ocurrió un error inesperado en la instalación");
         }*/
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
        let userValidation = validatuser(context.user);
        if (userValidation.status == "error") return userValidation;

        return null;
    }


    const validatecan_execute = (asset) => {
        let validation = { message: "", status: "ok" };
        if (!asset) {
            validation.status = "error";
            validation.message = "Verificar el campo can_execute  en la trama.";
            return validation;
        }

        return validation;
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
    const validatuser = (user) => {
        let validation = { message: "", status: "ok" };
        if (!user) {
            validation.status = "error";
            validation.message = "Verificar el campo user  en la trama.";
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