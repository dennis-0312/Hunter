/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    
    () => {
        
        const beforeLoad = (scriptContext) => {
            try{
                if (scriptContext.type === 'view') {

                    var custScript = "customscript_hu_ec_st_liquidacion_compra";
                    var custDeploy = "customdeploy_hu_ec_st_liquidacion_compra";
    
                    const form = scriptContext.form;
                    let objRecord = scriptContext.newRecord;
                    var id = objRecord.id;
                    var type = objRecord.type;
                    var status = objRecord.getValue({fieldId: 'status'});
                    var tipoDocumento = objRecord.getValue({fieldId: 'custbodyts_ec_tipo_documento_fiscal'}); 
        
                    // ID: 10 corresponde al documento de tipo "03 Liquidación de compra de Bienes o Prestación de servicios"
                    if (tipoDocumento == "10" || tipoDocumento == "4" || tipoDocumento == "9") {
                        if(status == "Abierta" || status == "Pagado por completo" || status == "Aprobación pendiente" ){
                            form.addButton({                            
                                id: "custpage_print_custom_button",
                                label: "Imprimir Personalizado",
                                functionName: `customButtonFunction('${type}','${id}','${custScript}','${custDeploy}')`
                            });
                        }
                    }
                    form.clientScriptModulePath = 'SuiteScripts/IntegracionesHunter/Plantillas/ClientScripts/HU_EC_CS_STANDARD_PDF.js'
                }          
            }catch(error){
                log.error('Error', error);
            }              
        }
        return {beforeLoad}
    }
    
)
