/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/url', 'N/runtime','N/record', 'N/search'],

    function (url, runtime, record, search) {
        const pageInit = (context) => {
            typeMode = context.mode; //!Importante, no borrar.
        }

        const validateField = (context) => {
            console.log('context',context);
            var test = context.fieldId;
            console.log('test',test);
            try{

                /* var fieldOrdenTrabajo = scriptContext.currentRecord.getField({
                    fieldId: 'custbody_ht_ai_orden_trabajo'
                });
                var busquedaAssemblyBuild = search.create({
                    type: search.Type.ASSEMBLY_BUILD,
                    filters: [
                    ],
                    columns: [
                    search.createColumn({
                        name: "internalid",
                        label: "Internal ID"
                    }),
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    })
                    ]
                })
    
                var resultado = busquedaAssemblyBuild.run().getRange(0, 1000);
    
                console.log(resultado);
                if (resultado != null) {
    
                    fieldOrdenTrabajo.removeSelectOption({
                        value: null
                    });
    
                    for (var i = 0; i < resultado.length; i++) {
                        fieldOrdenTrabajo.insertSelectOption({
                        value: resultado[i].getValue('internalid'),
                        text: resultado[i].getValue('name')
                    });
                    }
    
                } */
            }catch(e){
                console.log('errror en field change', e);
            }  
            
          }
        return {
            pageInit: pageInit,
            validateField: validateField          
        };

    });