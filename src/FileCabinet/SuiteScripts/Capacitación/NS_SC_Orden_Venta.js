/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/url', 'N/https'], function (url, https) {

    function pageInit(context) {
        console.log('Inicio');
    }

    function enviarOV() {
        try {
            var miURL = url.resolveScript({
                scriptId: 'customscript_ns_rs_orden_venta',
                deploymentId: 'customdeploy_ns_rs_orden_venta'
            });

            var headerObj = {
                name: 'Accept-Language',
                value: 'en-us'
            };
            var response = https.get({
                url: miURL,
                headers: headerObj
            });
            console.log(response);
        } catch (error) {
            console.log(error);
        }

    }
    return {
        pageInit: pageInit,
        enviarOV: enviarOV
    }
});
