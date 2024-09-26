/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'N/url','N/runtime'], (url, runtime) => {

    function pageInit(scriptContext){
        //DO NOTHING
    }
    
    const getSuiteletUrl = (scriptId, deploymentId) => {
        return url.resolveScript({
            scriptId: scriptId,
            deploymentId: deploymentId,
            returnExternalUrl: false
        });
    }

    const getHostDomain = () => {
        return host = url.resolveDomain({
            hostType: url.HostType.APPLICATION,
            accountId: runtime.accountId
        });
    }

    const addParametersToUrl = (suiteletURL, parameters) => {
        for (var param in parameters) {
            if (parameters[param]) {
                suiteletURL = `${suiteletURL}&${param}=${parameters[param]}`;
            }
        }
        return suiteletURL;
    }

    function customButtonFunction(type,id,CUSTOM_SCRIPT_PRINT, CUSTOM_DEPLOYMENT_PRINT,ftl=0){ // ftl es el parametro (numérico) adicional asignado para pantallas con más de 1 plantilla
        try {
            if(!ftl){
                var params = { type, id };
            }else{
                var params = { type, id, ftl };
            }
            var host = getHostDomain();
            var suiteletUrl = getSuiteletUrl(CUSTOM_SCRIPT_PRINT, CUSTOM_DEPLOYMENT_PRINT);
            var fullUrl = addParametersToUrl(`https://${host}${suiteletUrl}`, params);
            window.open(fullUrl, '_blank');
        } catch (error) {
            console.error("Error en la función printPagotest:", error.message);
            console.error("Tipo de error:", error.name);
            console.error("Stack Trace:", error.stack);
        }
    }
    
    return{
        pageInit,
        customButtonFunction
    };
});