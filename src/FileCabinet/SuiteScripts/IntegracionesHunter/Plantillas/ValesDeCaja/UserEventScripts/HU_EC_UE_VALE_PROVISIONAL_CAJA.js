/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    
    () => {
        /**
         * Defines the function definitio that is executed before record is loaded
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord
         * @param {string} scriptContext.type
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            const form = scriptContext.form;
            let objRecord = scriptContext.newRecord;
            var id = objRecord.id;
            var type = 'journalentry'
            form.addButton({
                id: "custpage_custom_button",
                label: "Imprimir Vale",
                functionName: `customButtonFunction('${type}','${id}')`
            });
            form.clientScriptModulePath = 'SuiteScripts/IntegracionesHunter/Plantillas/ValesDeCaja/ClientScripts/HU_EC_CS_VALE_PROVISIONAL_CAJA.js'
        }
        return {beforeLoad}
    }
    
    )