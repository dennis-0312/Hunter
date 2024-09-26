/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    
    () => {
        
        const beforeLoad = (scriptContext) => {
            try{
                if (scriptContext.type === 'view') {
                
                    const custScript = "customscript_hu_ec_st_pago_factura";
                    const custDeploy = "customdeploy_hu_ec_st_pago_factura";
    
                    const form = scriptContext.form;
                    let objRecord = scriptContext.newRecord;
                    var id = objRecord.id;
                    var type = objRecord.type;                
    
                    form.addButton({                    
                        id: "custpage_print_custom_button",
                        label: "Imprimir Personalizado",
                        functionName: `customButtonFunction('${type}','${id}','${custScript}','${custDeploy}')`
                    });                    
                    
                    form.clientScriptModulePath = 'SuiteScripts/IntegracionesHunter/Plantillas/ClientScripts/HU_EC_CS_STANDARD_PDF.js'
                }
            }catch(error){
                log.error('Error', error);
            }                      
        }
        return {beforeLoad}
    }
    
)
