/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/url'], function (log, https, url) {

    let OK_STATUS_CODE = [200, 201];

    const post = (context) => {
        let results = [];
        try {
            //context = { "customer": { "username": "dennis.fernandez@myevol.biz", "first_name": "DENNIS", "last_name": "FERNANDEZ", "email": "dennis.fernandez@myevol.biz", "id": "750", "is_active": true, "account_type": 1, "customer": { "company_code": "0991259546001", "identity_document_number": "1103756134", "identity_document_type": 3, "business_name": "", "phone_number": "+593949199789", "emergency_phone_number": "0985454544", "assistance_phone_number": "046004640", "technical_support_email": "soporteami@carsegsa.com" } }, "asset": { "id": "2254", "product": "", "name": "S/P", "description": "1001120523", "custom_name": "", "active": true, "asset_type": "2", "product_expire_date": "2024-10-17T05:00:00-05:00", "contract_code": "", "attributes": [{ "attribute": "10", "value": "BMW" }, { "attribute": "11", "value": "X2 X2 SDRIVE 20I AC 2.0 5P 4X2 TA" }, { "attribute": "12", "value": "1.8" }, { "attribute": "16", "value": "8LFTNY0247M3270067913" }, { "attribute": "17", "value": "594511204" }, { "attribute": "18", "value": "TRD-5263" }, { "attribute": "20", "value": "1001120523" }], "doors_sensors": 0 } };
            log.error("context", context);
            let headers = getHeaders();
            let urlBase = getTelematicUrlBase();

            if (!context.customer.username) return getResultResponse("error", results, `Propietario no tiene correo AMI configurado`);
            let getCustomerParams = { username: context.customer.username };
            let getCustomerUrl = formatUrl(`${urlBase}/customer/user/`, getCustomerParams)
            let getCustomerResponse = https.get({ headers, url: getCustomerUrl });
            if (OK_STATUS_CODE.indexOf(getCustomerResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getCustomerResponse.code, error: JSON.parse(getCustomerResponse.body) }));
            getCustomerResponse = JSON.parse(getCustomerResponse.body);
            log.error("getCustomerResponse", getCustomerResponse);
            if (!getCustomerResponse.count) return getResultResponse("error", results, `Propietario no encontrado ${context.customer.username}`);
            getCustomerResponse = getCustomerResponse.results[0];
            results.push(getCustomerResponse);

            let getAssetResponse = null;
            if (context.asset.name == "S/P" && context.asset.id) {
                let getAssetParams = { name: context.asset.name };
                let getAssetUrl = `${urlBase}/asset/${context.asset.id}/`;
                getAssetResponse = https.get({ headers, url: getAssetUrl });
                if (OK_STATUS_CODE.indexOf(getAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetResponse.code, error: JSON.parse(getAssetResponse.body) }));
                getAssetResponse = JSON.parse(getAssetResponse.body);
                log.error("getAssetResponse", getAssetResponse);

            } else if (context.asset.name == "S/P") {
                let getAssetParams = { name: context.asset.name };
                let getAssetUrl = formatUrl(`${urlBase}/asset/`, getAssetParams);
                getAssetResponse = https.get({ headers, url: getAssetUrl });
                if (OK_STATUS_CODE.indexOf(getAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetResponse.code, error: JSON.parse(getAssetResponse.body) }));
                getAssetResponse = JSON.parse(getAssetResponse.body);
                log.error("getAssetResponse", getAssetResponse);
                if (!getAssetResponse.count) return { status: "error", message: `No se encontró el vehículo con vid: ${context.asset.name}`, results };
                getAssetResponse = getAssetResponse.results[0];
            }
            if (getAssetResponse == null) return { status: "error", message: `El vehículo no se encuentra registrado en telematic y no tiene placa`, results };
            results.push(getAssetResponse);

            if (getAssetResponse.user.indexOf(getCustomerResponse.id) == -1) return { status: "error", message: `El vehículo con id ${context.asset.id} no le pertenece al propietario ${context.customer.username}`, results};

            headers['X-HTTP-Method-Override'] = 'PATCH';
            let patchAssetUrl = `${urlBase}/asset/${context.asset.id}/`;
            let patchAssetResponse = https.put({
                headers,
                url: patchAssetUrl,
                body: JSON.stringify(context.asset)
            });
            if (OK_STATUS_CODE.indexOf(patchAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetResponse.code, error: JSON.parse(patchAssetResponse.body) }));
            patchAssetResponse = JSON.parse(patchAssetResponse.body);
            log.error("patchAssetResponse", patchAssetResponse);
            results.push(patchAssetResponse);

            return getResultResponse("ok", results, "Ejecución exitosa");
        } catch (error) {
            log.error("error", error);
            return getResultResponse("error", results, "Ocurrió un error inesperado en la actualización de la cobertura");
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

    const getTelematicUrlBase = () => {
        return "https://test-telematicsapi.hunterlabs.io";
    }

    const getResultResponse = (status, results, message) => {
        return { status, results, message };
    }

    return {
        post
    }
});
