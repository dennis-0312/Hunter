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

            //* CUSTOMER MONITOREO |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            if (!context.monitoreo.username) return getResultResponse("error", results, `Propietario no tiene correo AMI configurado`);
            let getCustomerMonitorParams = { username: context.monitoreo.username, customer__company_code: context.monitoreo.customer.company_code, customer__identity_document_number: context.monitoreo.customer.identity_document_number };
            let getCustomerMonitorUrl = formatUrl(`${urlBase}/customer/user/`, getCustomerMonitorParams);
            let getCustomerMonitorResponse = https.get({ headers, url: getCustomerMonitorUrl });
            if (OK_STATUS_CODE.indexOf(getCustomerMonitorResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getCustomerMonitorResponse.code, error: JSON.parse(getCustomerMonitorResponse.body) }));
            getCustomerMonitorResponse = JSON.parse(getCustomerMonitorResponse.body);
            log.error("getCustomerMonitorResponse", getCustomerMonitorResponse);

            let customerMonitorResponse = {};
            if (getCustomerMonitorResponse.count == 0) {
                //& Creación del cliente monitoreo validando que getCustomerMonitorResponse.count == 0 indicando que no existe ===========================================================
                let postCustomerMonitorUrl = `${urlBase}/customer/user/`;
                let postCustomerMonitorResponse = https.post({
                    headers,
                    url: postCustomerMonitorUrl,
                    body: JSON.stringify(context.monitoreo)
                });
                customerMonitorResponse = JSON.parse(postCustomerMonitorResponse.body);
                results.push(getResponseResult(postCustomerMonitorResponse.code, `POST: ${postCustomerMonitorUrl}`, customerMonitorResponse));
                if (OK_STATUS_CODE.indexOf(postCustomerMonitorResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: postCustomerMonitorResponse.code, error: customerMonitorResponse }));
                log.error("postCustomerResponse", customerMonitorResponse);
                //& ======================================================================================================================================================================
            } else if (getCustomerMonitorResponse.count == 1) {
                //& Actualiazión del cliente monitoreo validando que getCustomerMonitorResponse.count == 1 indicando que existe, enviar is_active en true ================================
                context.monitoreo.id = getCustomerMonitorResponse.results[0].id;
                let headers = getPatchHeaders();
                let patchCustomerMonitorUrl = `${urlBase}/customer/user/${context.monitoreo.id}/`;
                let patchCustomerMonitorResponse = https.put({
                    headers,
                    url: patchCustomerMonitorUrl,
                    body: JSON.stringify(context.monitoreo)
                });
                customerMonitorResponse = JSON.parse(patchCustomerMonitorResponse.body);
                results.push(getResponseResult(patchCustomerMonitorResponse.code, `PATCH: ${patchCustomerMonitorUrl}`, customerMonitorResponse));
                if (OK_STATUS_CODE.indexOf(patchCustomerMonitorResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchCustomerMonitorResponse.code, error: customerResponse }));
                log.error("patchCustomerMonitorResponse", customerMonitorResponse);
                //& ======================================================================================================================================================================
            } else {
                return getResultResponse("error", results, `Se encontró más de un propietario con el username ${context.monitoreo.username}`);
            }

            //* CUSTOMER |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            if (!context.customer.username) return getResultResponse("error", results, `Propietario no tiene correo AMI configurado`);
            let getCustomerParams = { username: context.customer.username, customer__company_code: context.customer.customer.company_code, customer__identity_document_number: context.customer.customer.identity_document_number };
            let getCustomerUrl = formatUrl(`${urlBase}/customer/user/`, getCustomerParams);
            let getCustomerResponse = https.get({ headers, url: getCustomerUrl });
            if (OK_STATUS_CODE.indexOf(getCustomerResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getCustomerResponse.code, error: JSON.parse(getCustomerResponse.body) }));
            getCustomerResponse = JSON.parse(getCustomerResponse.body);
            log.error("getCustomerResponse", getCustomerResponse);

            let customerResponse = {};
            if (getCustomerResponse.count == 0) {
                let postCustomerUrl = `${urlBase}/customer/user/`;
                let postCustomerResponse = https.post({
                    headers,
                    url: postCustomerUrl,
                    body: JSON.stringify(context.customer)
                });
                customerResponse = JSON.parse(postCustomerResponse.body);
                results.push(getResponseResult(postCustomerResponse.code, `POST: ${postCustomerUrl}`, customerResponse));
                if (OK_STATUS_CODE.indexOf(postCustomerResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: postCustomerResponse.code, error: customerResponse }));
                log.error("postCustomerResponse", customerResponse);


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

            //* ASSET ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            // TODO FLUJO ALTERNATIVO, verificar peticion get para ver como termina el flujo.
            /*            let assetResponse = {};
                        if (!context.asset.name) {
                            return getResultResponse("error", results, `No se envío un nombre para el vehículo`);
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
            */

            // TODO: Verificar como realizar la consulta get para realizar las validaciones comentadas.
            let assetResponse = {};
            if (context.asset.cod_sys) {
                let getAssetParams = { attributes__attribute__name: "COD_SYS", attributes__value: context.asset.cod_sys };
                let getAssetUrl = formatUrl(`${urlBase}/asset/`, getAssetParams);
                let getAssetResponse = https.get({ headers, url: getAssetUrl });
                if (OK_STATUS_CODE.indexOf(getAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetResponse.code, error: JSON.parse(getAssetResponse.body) }));
                getAssetResponse = JSON.parse(getAssetResponse.body);
                log.error("getAssetResponse", getAssetResponse);

                if (getAssetResponse.count == 0) {
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
                    return getResultResponse("error", results, `Se encontró más de un vehículo con el codigo sys ${context.asset.cod_sys}`);
                }
            } else {
                return getResultResponse("error", results, `No se envió un código para el vehículo`);
            }

            /*
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
            }*/

            //* DEVICE |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
            let deviceResponse = {};
            if (context.device.id) {
                let getDeviceParams = { id: context.device.id/*, company_code: context.device.company_code*/ };
                let getDeviceUrl = formatUrl(`${urlBase}/device/`, getDeviceParams);
                let getDeviceResponse = https.get({ headers, url: getDeviceUrl });
                if (OK_STATUS_CODE.indexOf(getDeviceResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getDeviceResponse.code, error: JSON.parse(getDeviceResponse.body) }));
                getDeviceResponse = JSON.parse(getDeviceResponse.body);
                log.error("getDeviceResponse", getDeviceResponse);

                if (getDeviceResponse.count == 0) {
                    let postDeviceUrl = `${urlBase}/device/`;
                    let postDeviceResponse = https.post({
                        headers,
                        url: postDeviceUrl,
                        body: JSON.stringify(context.device)
                    });
                    deviceResponse = JSON.parse(postDeviceResponse.body);
                    results.push(getResponseResult(postDeviceResponse.code, `POST: ${postDeviceUrl}`, deviceResponse));
                    if (OK_STATUS_CODE.indexOf(postDeviceResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: postDeviceResponse.code, error: deviceResponse }));
                    log.error("postDeviceResponse", deviceResponse);

                } else if (getDeviceResponse.count == 1) {
                    context.device.id = getDeviceResponse.results[0].id;
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

                } else {
                    return getResultResponse("error", results, `Se encontró más de un dispositivo con el id ${context.device.id}`);
                }

            } else {
                return getResultResponse("error", results, `No se envío el id del dispositivo`);
            }

            // Verificar Dispositivo no esté instalado en otro Vehiculo.
            let addDevice = false;
            if (context.device.id) {
                let getAssetParams = { devices__device__id: context.device.id };
                let getAssetUrl = formatUrl(`${urlBase}/asset/`, getAssetParams);
                let getAssetResponse = https.get({ headers, url: getAssetUrl });
                if (OK_STATUS_CODE.indexOf(getAssetResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetResponse.code, error: JSON.parse(getAssetResponse.body) }));
                getAssetResponse = JSON.parse(getAssetResponse.body);
                log.error("getAssetResponse", getAssetResponse);

                if (getAssetResponse.count == 0) {
                    addDevice = true;
                } else if (getAssetResponse.count == 1 && getAssetResponse.results[0].id != context.asset.id) {
                    return getResultResponse("error", results, `El dispositivo ${context.device.id} se encuentra instalado en el vehículo ${getAssetResponse.results[0].id}`);
                }
            }

            //customerResponse
            //assetResponse
            //deviceResponse
            if (addDevice) {
                // DEVICE - ADD
                let devices = assetResponse.get_devices ? assetResponse.get_devices.length : 0;
                if (devices) {
                    let deviceFound = assetResponse.get_devices.find(device => device.id == deviceResponse.id);
                    if (deviceFound === undefined) {
                        let headers = getPatchHeaders();
                        let patchAssetDeviceAddUrl = `${urlBase}/asset/${assetResponse.id}/device-add/`;
                        let patchAssetDeviceAddResponse = https.put({
                            headers,
                            url: patchAssetDeviceAddUrl,
                            body: JSON.stringify({ device_id: deviceResponse.id })
                        });
                        let deviceAddResponse = patchAssetDeviceAddResponse.body;
                        results.push(getResponseResult(patchAssetDeviceAddResponse.code, `PATCH: ${patchAssetDeviceAddUrl}`, deviceAddResponse));
                        if (OK_STATUS_CODE.indexOf(patchAssetDeviceAddResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetDeviceAddResponse.code, error: deviceAddResponse }));
                        log.error("patchAssetDeviceAddResponse", deviceAddResponse);
                    }
                } else {
                    let headers = getPatchHeaders();
                    let patchAssetDeviceAddUrl = `${urlBase}/asset/${assetResponse.id}/device-add/`;
                    let patchAssetDeviceAddResponse = https.put({
                        headers,
                        url: patchAssetDeviceAddUrl,
                        body: JSON.stringify({ device_id: deviceResponse.id })
                    });
                    let deviceAddResponse = patchAssetDeviceAddResponse.body;
                    results.push(getResponseResult(patchAssetDeviceAddResponse.code, `PATCH: ${patchAssetDeviceAddUrl}`, deviceAddResponse));
                    if (OK_STATUS_CODE.indexOf(patchAssetDeviceAddResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetDeviceAddResponse.code, error: deviceAddResponse }));
                    log.error("patchAssetDeviceAddResponse", deviceAddResponse);
                }
            }


            //USER - ADD TODO: Verificar Error 500 en user-add
            let customers = assetResponse.user ? assetResponse.user.length : 0;
            if (customers) {
                let customerFound = assetResponse.user.find(customerId => customerId == customerResponse.id);
                if (customerFound === undefined) {
                    let headers = getPatchHeaders();
                    let patchAssetUserAddUrl = `${urlBase}/asset/${assetResponse.id}/user-add/`;
                    let patchAssetUserAddResponse = https.put({
                        headers,
                        url: patchAssetUserAddUrl,
                        body: JSON.stringify({ user_id: customerResponse.id })
                    });
                    let userAddResponse = patchAssetUserAddResponse.body;
                    results.push(getResponseResult(patchAssetUserAddResponse.code, `PATCH: ${patchAssetUserAddUrl}`, userAddResponse));
                    //if (OK_STATUS_CODE.indexOf(patchAssetUserAddResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetUserAddResponse.code, error: userAddResponse }));
                    log.error("patchAssetUserAddResponse", userAddResponse);

                }
            } else {
                let headers = getPatchHeaders();
                let patchAssetUserAddUrl = `${urlBase}/asset/${assetResponse.id}/user-add/`;
                let patchAssetUserAddResponse = https.put({
                    headers,
                    url: patchAssetUserAddUrl,
                    body: JSON.stringify({ user_id: customerResponse.id })
                });
                let userAddResponse = patchAssetUserAddResponse.body;
                results.push(getResponseResult(patchAssetUserAddResponse.code, `PATCH: ${patchAssetUserAddUrl}`, userAddResponse));
                //if (OK_STATUS_CODE.indexOf(patchAssetUserAddResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchAssetUserAddResponse.code, error: userAddResponse }));
                log.error("patchAssetUserAddResponse", userAddResponse);
            }

            // ASSET - COMMAND
            let getAssetCommandParams = { asset: assetResponse.id };
            let getAssetCommandUrl = formatUrl(`${urlBase}/asset-command/`, getAssetCommandParams);
            let getAssetCommandResponse = https.get({ headers, url: getAssetCommandUrl });
            if (OK_STATUS_CODE.indexOf(getAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getAssetCommandResponse.code, error: JSON.parse(getDeviceResponse.body) }));
            getAssetCommandResponse = JSON.parse(getAssetCommandResponse.body);
            log.error("getAssetCommandResponse", getAssetCommandResponse);

            for (let i = 0; i < context.command.length; i++) {
                let assetCommandFound = getAssetCommandResponse.results.find(assetCommand => assetCommand.command == context.command[i]);
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
                    let patchAssetCommandUrl = `${urlBase}/asset-command/${assetCommandFound.id}/`;
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

            // USER - ASSET - COMMAND
            let getUserAssetCommandParams = { user: customerResponse.id, asset: assetResponse.id };
            let getUserAssetCommandUrl = formatUrl(`${urlBase}/user-asset-command/`, getUserAssetCommandParams);
            let getUserAssetCommandResponse = https.get({ headers, url: getUserAssetCommandUrl });
            if (OK_STATUS_CODE.indexOf(getUserAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getUserAssetCommandResponse.code, error: JSON.parse(getUserAssetCommandResponse.body) }));
            getUserAssetCommandResponse = JSON.parse(getUserAssetCommandResponse.body);
            log.error("getUserAssetCommandResponse", getUserAssetCommandResponse);

            for (let i = 0; i < context.command.length; i++) {
                let userAssetCommandFound = getUserAssetCommandResponse.results.find(userAssetCommand => userAssetCommand.command == context.command[i]);
                if (userAssetCommandFound === undefined) {
                    let postUserAssetCommandUrl = `${urlBase}/user-asset-command/`;
                    let postUserAssetCommandResponse = https.post({
                        headers,
                        url: postUserAssetCommandUrl,
                        body: JSON.stringify({ can_execute: true, command: context.command[i], user: customerResponse.id, asset: assetResponse.id })
                    });
                    let userAssetCommandResponse = JSON.parse(postUserAssetCommandResponse.body);
                    results.push(getResponseResult(postUserAssetCommandResponse.code, `POST: ${postUserAssetCommandUrl}`, userAssetCommandResponse));
                    if (OK_STATUS_CODE.indexOf(postUserAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: postUserAssetCommandResponse.code, error: userAssetCommandResponse }));
                    log.error("postUserAssetCommandResponse", userAssetCommandResponse);

                } else if (!userAssetCommandFound.can_execute) {
                    let headers = getPatchHeaders();
                    let patchUserAssetCommandUrl = `${urlBase}/user-asset-command/${userAssetCommandFound.id}/`;
                    let patchUserAssetCommandResponse = https.put({
                        headers,
                        url: patchUserAssetCommandUrl,
                        body: JSON.stringify({ can_execute: true, command: context.command[i], user: customerResponse.id, asset: assetResponse.id })
                    });
                    let userAssetCommandResponse = JSON.parse(patchUserAssetCommandResponse.body);
                    results.push(getResponseResult(patchUserAssetCommandResponse.code, `POST: ${patchUserAssetCommandUrl}`, userAssetCommandResponse));
                    if (OK_STATUS_CODE.indexOf(patchUserAssetCommandResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: patchUserAssetCommandResponse.code, error: userAssetCommandResponse }));
                    log.error("patchUserAssetCommandResponse", userAssetCommandResponse);
                }
            }

            // SET PASSWORD
            let getCustomerPasswordUrl = `${urlBase}/customer/user/${customerResponse.id}/set_password/`;
            let getCustomerPasswordResponse = https.get({ headers, url: getCustomerPasswordUrl });
            results.push(getResponseResult(getCustomerPasswordResponse.code, `GET: ${getCustomerPasswordUrl}`, getCustomerPasswordResponse.body));
            if (OK_STATUS_CODE.indexOf(getCustomerPasswordResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getCustomerPasswordResponse.code, error: JSON.parse(getCustomerPasswordResponse.body) }));

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

    const validateFields = (context) => {
        let deviceValidation = validateDevice(context.device);
        if (deviceValidation.status == "error") return deviceValidation;
        let customerValidation = validateCustomer(context.customer);
        if (customerValidation.status == "error") return customerValidation;
        let monitorValidation = validateMonitor(context.monitoreo);
        if (monitorValidation.status == "error") return monitorValidation;
        let assetValidation = validateAsset(context.asset);
        if (assetValidation.status == "error") return assetValidation;
        return null;
    }

    const validateCustomer = (customer) => {
        let validation = { message: "", status: "ok" };
        let mandatoryFields = ["username", "customer", "customer.company_code", "customer.identity_document_number"];

        if (!customer.username) {
            validation.status = "error";
            validation.message = "El propietario no tiene correo AMI configurado";
            return validation;
        }
        if (!customer.customer) {
            validation.status = "error";
            validation.message = "Verificar el campo customer en la trama del propietario";
            return validation;
        }
        if (!customer.customer.company_code) {
            validation.status = "error";
            validation.message = "Verificar el campo company_code en la trama del propietario";
            return validation;
        }
        if (!customer.customer.identity_document_number) {
            validation.status = "error";
            validation.message = "Verificar el campo identity_document_number en la trama del propietario";
            return validation;
        }
        return validation;
    }

    const validateMonitor = (customer) => {
        let validation = { message: "", status: "ok" };
        let mandatoryFields = ["username", "customer", "customer.company_code", "customer.identity_document_number"];

        if (!customer.username) {
            validation.status = "error";
            validation.message = "El cliente monitoreo no tiene correo AMI configurado";
            return validation;
        }
        if (!customer.customer) {
            validation.status = "error";
            validation.message = "Verificar el campo customer en la trama del cliente monitoreo";
            return validation;
        }
        if (!customer.customer.company_code) {
            validation.status = "error";
            validation.message = "Verificar el campo company_code en la trama del cliente monitoreo";
            return validation;
        }
        if (!customer.customer.identity_document_number) {
            validation.status = "error";
            validation.message = "Verificar el campo identity_document_number en la trama del cliente monitoreo";
            return validation;
        }
        return validation;
    }

    const validateAsset = (asset) => {
        let validation = { message: "", status: "ok" };
        let mandatoryFields = ["cod_sys", "product", "name", "product_expire_date"];

        if (!asset.cod_sys) {
            validation.status = "error";
            validation.message = "Verificar el campo código sys en la trama del vehículo.";
            return validation;
        }
        if (!asset.product) {
            validation.status = "error";
            validation.message = "Verificar el campo producto (TTR) en la trama del vehículo";
            return validation;
        }
        if (!asset.name) {
            validation.status = "error";
            validation.message = "Verificar el campo name (placa) en la trama del vehículo";
            return validation;
        }
        if (!asset.product_expire_date) {
            validation.status = "error";
            validation.message = "Verificar la fecha de expiración de la trama del vehículo";
            return validation;
        }
        return validation;
    }

    const validateDevice = (device) => {
        let validation = { message: "", status: "ok" };
        let mandatoryFields = ["id", "report_from", "model", "company_code"];
        if (!device.id) {
            validation.status = "error";
            validation.message = "Verificar que el dispositivo tenga un id";
            return validation;
        }
        if (!device.report_from) {
            validation.status = "error";
            validation.message = "Verifique que el servidor seleccionado sea válido para Telematic";
            return validation;
        }
        if (!device.model) {
            validation.status = "error";
            validation.message = "Verifique que el modelo o servidor sea válido para Telematic";
            return validation;
        }
        if (!device.company_code) {
            validation.status = "error";
            validation.message = "Verificar el campo company code";
            return validation;
        }
        return validation;
    }

    return {
        post
    }

});