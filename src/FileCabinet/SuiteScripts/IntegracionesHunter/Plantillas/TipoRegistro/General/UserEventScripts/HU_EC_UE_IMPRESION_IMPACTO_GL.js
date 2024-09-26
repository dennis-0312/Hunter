/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    
    () => {
        
        const beforeLoad = (scriptContext) => {
            try{
                if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                
                    const custScript = "customscript_hu_ec_st_print_impacto_gl";
                    const custDeploy = "customdeploy_hu_ec_st_print_impacto_gl";
    
                    const form = scriptContext.form;
                    let objRecord = scriptContext.newRecord;
                    var id = objRecord.id;
                    var type = objRecord.type;
                    form.addButton({                    
                        id: "custpage_print_gl_button",
                        label: "Imprimir GL",
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
