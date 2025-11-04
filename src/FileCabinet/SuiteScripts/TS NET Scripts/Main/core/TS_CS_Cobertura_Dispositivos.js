/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/https', 'N/query', 'N/record', 'N/runtime', 'N/search', 'N/ui/dialog', 'N/ui/message', 'N/util', 'N/url'],
    /**
     * @param{currentRecord} currentRecord
     * @param{https} https
     * @param{query} query
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{dialog} dialog
     * @param{message} message
     * @param{util} util
     */
    (currentRecord, https, query, record, runtime, search, dialog, message, util, url) => {
        let OK_STATUS_CODE = [200, 201];
        let URL = "https://test-telematicsapi.hunterlabs.io" //SB: https://test-telematicsapi.hunterlabs.io / PR: https://telematicsapi.hunterlabs.io
        let TOKEN = 'ZGVubmlzLmZlcm5hbmRlekBteWV2b2wuYml6OkM0cnMzZ3M0QDIwMjI='
        let typeMode;
        const TM_RENOVACION_ACTIVACION = 2;

        const pageInit = (scriptContext) => {
            console.log('Init');
        }

        const getCobertura = (scriptContext) => {
            let results = [];
            try {
                console.log("scriptContext", scriptContext);
                let headers = getHeaders();
                let urlBase = getTelematicUrlBase();
                let getResponse = '';
                let mensaje = '';

                let assetValidation = validateAsset(scriptContext.asset);
                console.log(assetValidation);
                if (assetValidation.status == "error") {
                    mensaje = assetValidation.message
                    // return mensaje;
                } else {
                    let getAssetUrl = `${urlBase}/asset/${scriptContext.asset}/`;
                    getResponse = https.get({ headers, url: getAssetUrl });
                    if (OK_STATUS_CODE.indexOf(getResponse.code) == -1) return getResultResponse("error", results, JSON.stringify({ code: getResponse.code, error: JSON.parse(getResponse.body) }));
                    getResponse = JSON.parse(getResponse.body);
                    console.log("getAssetResponse", getResponse);
                    let placa = getResponse.name;
                    let fecha = getResponse.product_expire_date.split('T')[0]
                    let activo = getResponse.active ? 'Si' : 'No';
                    mensaje = `Fecha Cobertura: ${fecha} / Activo: ${activo}`
                }
                dialog.alert({ title: 'Cobertura Plataforma AMI', message: mensaje });
            } catch (error) {
                console.log("error", error);
                dialog.alert({ title: 'Alerta', message: JSON.stringify(getResponse) });
                //return getResultResponse("error", "Ocurrió un error inesperado", getResponse);
            }
        }

        const getAssetData = () => {
            const jsonData = {
                htEmail: {
                    email: "",
                    amiEmail: "",
                    mainEmail: "",
                    convenioEmail: ""
                },
                entityid: "C-EC-0301667911",
                phone: "",
                email: "",
                vatregnumber: "0301667911",
                custentity_ht_customer_id_telematic: "",
                internalid: [
                    {
                        value: "466193",
                        text: "466193"
                    }
                ],
                isperson: true,
                provincia: "GUANAL VIA CUENCA 1234 PUENTE DE CERTAG    EC",
                companyname: "ROBERTO CARLOS RODAS MUY",
                custentityts_ec_cod_tipo_doc_identidad: "05",
                homephone: "",
                custentity_ht_cl_primernombre: "ROBERTO",
                custentity_ht_cl_segundonombre: "CARLOS",
                custentity_ht_cl_apellidopaterno: "RODAS",
                custentity_ht_cl_apellidomaterno: "MUY"
            }

            // Convertir JSON a una cadena con formato
            const formattedJson = JSON.stringify(jsonData, null, 4);
            // Mostrar JSON en el textarea
            document.getElementById("custpage_view_results_impulso").value = formattedJson;
        }

        const postCobertura = (scriptContext) => {
            //console.log(scriptContext.request.headers.referer);
            // console.log(scriptContext.request.parameters);
            // console.log(scriptContext.request.url);
            // const queryString = Object.entries(scriptContext.request.parameters)
            //     .map(([key, value]) => `${key}=${value}`)
            //     .join('&');
            // let absoluteURL = `${scriptContext.request.url}?${queryString}`
            //console.log(absoluteURL)
            //dialog.alert({ title: 'Alerta', message: absoluteURL });

            let options = {
                title: "Requiere Confirmación",
                message: "¿Estás seguro de actualizar la cobertura en la plataforma?"
            };

            function success(result) {
                console.log("Success with value " + result);
                try {
                    if (result) {
                        record.submitFields({
                            type: 'customrecord_ht_co_cobertura',
                            id: scriptContext.id,
                            values: {
                                custrecord_ht_co_impulso_plataforma: TM_RENOVACION_ACTIVACION
                            },
                        })
                        //window.open(absoluteURL);
                        location.reload()
                    }
                } catch (error) {
                    dialog.alert({ title: 'Alerta', message: `No es posible realizar la acción, contacte con su administrador.` });
                    console.log(error);
                }
            }

            function failure(reason) {
                console.log("Failure: " + reason);
            }

            dialog.confirm(options).then(success).catch(failure);
        }

        const getData = (trama) => {
            console.log(trama);
            let urlBase = url.resolveScript({
                scriptId: 'customscript_ts_rs_tm_get_data',
                deploymentId: 'customdeploy_ts_rs_tm_get_data',
                returnExternalUrl: true
            });
            console.log(urlBase);
            // let myRestletHeaders = new Array();
            // myRestletHeaders['Accept'] = '*/*';
            // myRestletHeaders['Content-Type'] = 'application/json';
            var headerObj = {
                name: 'Accept-Language',
                value: 'en-us'
            };
            let myRestletResponse = https.post({
                url: 'https://7451241.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=5273&deploy=1',
                body: JSON.stringify(trama),
                headers: headerObj,
            });
            let response = myRestletResponse.body;
            return response;
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
                validation.message = "Verificar el campo asset en la trama. El bien NO tiene un ID TELEMATICS.";
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

        const formatDate = (fechaOriginal) => {
            const fecha = new Date(fechaOriginal);
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const anio = fecha.getFullYear();
            const fechaFormateada = `${dia}/${mes}/${anio}`;
            return fechaFormateada
        }

        return {
            pageInit: pageInit,
            // fieldChanged: fieldChanged,
            //saveRecord: saveRecord,
            getCobertura: getCobertura,
            getAssetData: getAssetData,
            postCobertura: postCobertura
        };

    });
