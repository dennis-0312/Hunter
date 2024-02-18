/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/url'], function (log, https, url) {

    let OK_STATUS_CODE = [200, 201];

    const post = (context) => {
        let results = [];
        try {
            log.error("context", context);
            let headers = getHeaders();
            let urlBase = getTelematicUrlBase();

            //* CUSTOMER ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            log.error('CUSTOMER', '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||');
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
                customerResponse = getCustomerResponse.results[0];
            } else if (getCustomerResponse.count > 1) {
                return getResultResponse("error", results, `Se encontró más de un propietario con el username ${context.customer.username}`);
            }

            //* DEVICE ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            log.error('DEVICE', '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||');
            let deviceResponse = {};
            if (context.device.id) {
                let getDeviceParams = { id: context.device.id };
                let getDeviceUrl = formatUrl(`${urlBase}/device/`, getDeviceParams);
                let getDeviceResponse = https.get({ headers, url: getDeviceUrl });
                if (OK_STATUS_CODE.indexOf(getDeviceResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getDeviceResponse.code, error: JSON.parse(getDeviceResponse.body) }));
                getDeviceResponse = JSON.parse(getDeviceResponse.body);
                log.error("getDeviceResponse", getDeviceResponse);

                if (getDeviceResponse.count == 0) {
                    return getResultResponse("error", results, `No se encontró un dispositivo con el id ${context.device.id}`);
                } else if (getDeviceResponse.count == 1) {
                    context.device.id = getDeviceResponse.results[0].id;
                    let headers = getPatchHeaders();
                    let patchDeviceUrl = `${urlBase}/device/${context.device.id}/`;
                    let patchDeviceResponse = https.put({
                        headers,
                        url: patchDeviceUrl,
                        body: JSON.stringify({ active: false })
                    });
                    deviceResponse = JSON.parse(patchDeviceResponse.body);
                    results.push(getResponseResult(patchDeviceResponse.code, `PATCH: ${patchDeviceUrl}`, deviceResponse));
                    if (OK_STATUS_CODE.indexOf(patchDeviceResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchDeviceResponse.code, error: deviceResponse }));
                    log.error("patchDeviceResponse", deviceResponse);
                } else {
                    return getResultResponse("error", results, `Se encontró más de un dispositivo con el id ${context.device.id}`);
                }
            } else {
                return getResultResponse("error", results, `No se envío el id del dispositivo`);
            }

            //* ASSET ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            log.error('ASSET', '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||');
            let assetResponse = {};
            if (context.asset.name == "" || context.asset.name == undefined) {
                return getResultResponse("error", results, `No se envío un nombre para el vehículo`);
            } else if (context.asset.name != "S/P") {
                let getAssetParams = { name: context.asset.name, attributes__value: context.asset.cod_sys };
                log.debug('getAssetParams', getAssetParams);
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
                        body: JSON.stringify({ active: false })
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
                    body: JSON.stringify({ active: false })
                });
                assetResponse = JSON.parse(patchAssetResponse.body);
                results.push(getResponseResult(patchAssetResponse.code, `PATCH: ${patchAssetUrl}`, assetResponse));
                if (OK_STATUS_CODE.indexOf(patchAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetResponse.code, error: assetResponse }));
                log.error("patchAssetResponse", assetResponse);
            } else {
                return getResultResponse("error", results, `No se envión un id para el vehículo S/P`);
            }

            //* ASSET-USER-REMOVE ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            // log.error('ASSET-USER-REMOVE', '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||');
            // if (assetResponse.user.length && assetResponse.id) {
            //     if (assetResponse.user.indexOf(customerResponse.id) > -1) {
            //         let headers = getPatchHeaders();
            //         let patchAssetUserRemoveresponseUrl = `${urlBase}/asset/${assetResponse.id}/user-remove/`;
            //         let patchAssetUserRemoveResponse = https.put({
            //             headers,
            //             url: patchAssetUserRemoveresponseUrl,
            //             body: JSON.stringify({ user_id: customerResponse.id })
            //         });
            //         let assetUserRemoveResponse = JSON.parse(patchAssetUserRemoveResponse.body);
            //         results.push(getResponseResult(patchAssetUserRemoveResponse.code, `PATCH: ${patchAssetUserRemoveresponseUrl}`, assetUserRemoveResponse));
            //         //if (OK_STATUS_CODE.indexOf(patchAssetUserRemoveResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetUserRemoveResponse.code, error: assetUserRemoveResponse }));
            //         log.error("patchAssetUserRemoveResponse", assetUserRemoveResponse);
            //     }
            // }

            //* ASSET-DEVICE-REMOVE ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            log.error('ASSET-DEVICE-REMOVE', '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||');

            if (assetResponse.get_devices.length && deviceResponse.id) {
                if (assetResponse.get_devices.indexOf(deviceResponse.id) > -1) {
                    let headers = getPatchHeaders();
                    let patchAssetDeviceRemoveResponseUrl = `${urlBase}/asset/${assetResponse.id}/device-remove/`;
                    let patchAssetDeviceRemoveResponse = https.put({
                        headers,
                        url: patchAssetDeviceRemoveResponseUrl,
                        body: JSON.stringify({ device_id: deviceResponse.id })
                    });
                    let assetDeviceRemoveResponse = JSON.parse(patchAssetDeviceRemoveResponse.body);
                    results.push(getResponseResult(patchAssetDeviceRemoveResponse.code, `PATCH: ${patchAssetDeviceRemoveResponseUrl}`, assetDeviceRemoveResponse));
                    if (OK_STATUS_CODE.indexOf(patchAssetDeviceRemoveResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetDeviceRemoveResponse.code, error: assetDeviceRemoveResponse }));
                    log.error("patchAssetDeviceRemoveResponse", assetDeviceRemoveResponse);
                }
            }

            //* USER-ASSET-COMMAND-REMOVE-USER-ASSET-COMMANDS ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            // log.error('USER-ASSET-COMMAND-REMOVE-USER-ASSET-COMMANDS', '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||');
            // if (assetResponse.id && customerResponse.id) {
            //     let getUserAssetCommandParams = { user: customerResponse.id, asset: assetResponse.id };
            //     let getUserAssetCommandUrl = formatUrl(`${urlBase}/user-asset-command/`, getUserAssetCommandParams);
            //     let getUserAssetCommandResponse = https.get({ headers, url: getUserAssetCommandUrl });
            //     if (OK_STATUS_CODE.indexOf(getUserAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getUserAssetCommandResponse.code, error: JSON.parse(getUserAssetCommandResponse.body) }));
            //     let userAssetCommandResponse = JSON.parse(getUserAssetCommandResponse.body);
            //     log.error("getUserAssetCommandResponse", userAssetCommandResponse);

            //     if (userAssetCommandResponse.count) {
            //         for (let i = 0; i < userAssetCommandResponse.count; i++) {
            //             let putRemoveUserAssetCommandsUrl = `${urlBase}/user-asset-command/${userAssetCommandResponse.results[i].id}/remove-user-asset-commands/`;
            //             let putRemoveUserAssetCommandsResponse = https.put({
            //                 headers,
            //                 url: putRemoveUserAssetCommandsUrl,
            //                 body: JSON.stringify({ user: customerResponse.id, asset: assetResponse.id })
            //             });
            //             let removeUserAssetCommandsResponse = JSON.parse(putRemoveUserAssetCommandsResponse.body);
            //             results.push(getResponseResult(putRemoveUserAssetCommandsResponse.code, `PUT: ${putRemoveUserAssetCommandsUrl}`, removeUserAssetCommandsResponse));
            //             if (OK_STATUS_CODE.indexOf(putRemoveUserAssetCommandsResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: putRemoveUserAssetCommandsResponse.code, error: removeUserAssetCommandsResponse }));
            //             log.error("putRemoveUserAssetCommandsResponse", removeUserAssetCommandsResponse);
            //         }
            //     }
            // }


            //* ASSET-COMMANDS ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            log.error('ASSET-COMMANDS', '||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||');
            if (assetResponse.id && customerResponse.id) {
                let arrayCommandsid = new Array();
                let getUserAssetCommandParams = { user: customerResponse.id, asset: assetResponse.id };
                let getUserAssetCommandUrl = formatUrl(`${urlBase}/user-asset-command/`, getUserAssetCommandParams);
                let getUserAssetCommandResponse = https.get({ headers, url: getUserAssetCommandUrl });
                if (OK_STATUS_CODE.indexOf(getUserAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getUserAssetCommandResponse.code, error: JSON.parse(getUserAssetCommandResponse.body) }));
                let userAssetCommandResponse = JSON.parse(getUserAssetCommandResponse.body);
                log.error("getUserAssetCommandResponse", userAssetCommandResponse);

                if (userAssetCommandResponse.count) {
                    for (let i = 0; i < userAssetCommandResponse.count; i++) {
                        if (userAssetCommandResponse.results[i].status == 0) continue;
                        let getAssetCommandParams = { asset: userAssetCommandResponse.results[i].asset, command: userAssetCommandResponse.results[i].command };
                        let getAssetCommandUrl = formatUrl(`${urlBase}/asset-command/`, getAssetCommandParams);
                        let getAssetCommandResponse = https.get({ headers, url: getAssetCommandUrl });
                        if (OK_STATUS_CODE.indexOf(getAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetCommandResponse.code, error: JSON.parse(getAssetCommandResponse.body) }));
                        let assetCommandResponse = JSON.parse(getAssetCommandResponse.body);
                        log.error("getAssetCommandResponse", assetCommandResponse);
                        arrayCommandsid.push(assetCommandResponse.results[0].id)
                    }

                    log.error('arrayCommandsid', arrayCommandsid);
                    if (arrayCommandsid.length > 0) {
                        for (let i = 0; i < arrayCommandsid.length; i++) {
                            let headers = getPatchHeaders();
                            let patchAssetCommandUrl = `${urlBase}/asset-command/${arrayCommandsid[i]}/`;
                            let patchAssetCommandResponse = https.put({ headers, url: patchAssetCommandUrl, body: JSON.stringify({ /*asset: assetCommandResponse.results[0].asset, command: assetCommandResponse.results[0].command,*/ status: 0 }) });
                            let assetCommandResponse2 = JSON.parse(patchAssetCommandResponse.body);
                            results.push(getResponseResult(patchAssetCommandResponse.code, `PUT: ${patchAssetCommandUrl}`, assetCommandResponse2));
                            if (OK_STATUS_CODE.indexOf(patchAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetCommandResponse.code, error: assetCommandResponse2 }));
                            log.error("patchAssetCommandResponse", assetCommandResponse2);
                        }
                    }
                }
            }
            return getResultResponse("ok", results, "Ejecución exitosa", { customer: customerResponse, asset: assetResponse, device: deviceResponse });
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
        return { code, operation, body };
    }

    return {
        post
    }
});
