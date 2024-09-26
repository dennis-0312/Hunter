/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([ 'N/url','N/runtime'], (url, runtime) => {
    
    /**
     * Function to be executed after page is initialized.
     * 
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode
     * 
     * @since 2015.2
     */

    const CUSTOM_SCRIPT_PRINT_EXPENSEREPORT = "customscript_hu_ec_st_vale_provisional";
    const CUSTOM_DEPLOYMENT_PRINT_EXPENSEREPORT = "customdeploy_hu_ec_st_vale_provisional";

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

    function customButtonFunction(type,id){
        try {
            var params = { type, id };
            var host = getHostDomain();
            var suiteletUrl = getSuiteletUrl(CUSTOM_SCRIPT_PRINT_EXPENSEREPORT, CUSTOM_DEPLOYMENT_PRINT_EXPENSEREPORT);
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