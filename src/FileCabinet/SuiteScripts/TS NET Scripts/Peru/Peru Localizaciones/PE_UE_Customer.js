/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*
* Task          Date            Author                                         Remarks
* GAP 50        26 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>         - Codigo aleatorio para el campo Código Recaudador.
* GAP 51        24 Jul 2023     Jeferson Mejia <jeferson.mejia@myevol.biz>    - Cuentas a Cobrar Clientes
* Freshdesk     11 Ago 2023     Ivan Morales <ivan.morales@myevol.biz>        - Deschekear campo matchFrreshdesk
*
*/

define(["N/search", "N/log"], (search, log) => {
    const PREFERENCIAS_SISTEMA = -10;
    const beforeLoad = (context) => {
        log.debug('context.type', context.type);
               if (context.type === context.UserEventType.CREATE) {
                 var currentRecord = context.newRecord;
            
            // Asignar un valor al campo personalizado
            if(context.request != null){
                var parameterValue = context.request.parameters.param; // Obtiene el valor del parámetro
                log.debug('parameterValue',context.request.parameters);
           currentRecord.setValue({
               fieldId: 'custentity_pe_document_number',
               value: parameterValue
           });
            }
            
                 
           

        }

       
    };

    const beforeSubmit = (context) => {
        const FN = 'beforeSubmit';
        try {
            if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT){ // GAP 51
                let transaction = context.newRecord;
                if(transaction.getValue({fieldId: 'custentity_asb_cuenta_cobrar_soles'})){
                    transaction.setValue({fieldId: 'receivablesaccount', value: transaction.getValue({fieldId: 'custentity_asb_cuenta_cobrar_soles'})});
                } else{
                    transaction.setValue({fieldId: 'receivablesaccount', value: PREFERENCIAS_SISTEMA});
                }
                if (context.type === context.UserEventType.CREATE) {
                    let flag = true;
                    while (flag) {
                        let transaction = context.newRecord,
                        date = new Date();
            
                        let code = date.getMilliseconds() + '' + date.getSeconds() + '' + date.getMinutes() + '' + date.getHours() + '' + date.getDate() + '' + date.getMonth(); 
                            code = code.substring(0,6);
    
                         log.debug('MSK', 'Antes de customerSearch');
                        let customerSearch = search.create({
                            type: 'customer',
                            columns: ['internalid'],
                            filters: ['custentity_pe_cod_rec', 'is', code]
                        });
                         log.debug('MSK', 'Despues de customerSearch');
                
                        let resultCustomer = customerSearch.run().getRange(0, 1);
                         log.debug('MSK', 'Despues de la busqueda');
                        
                        if (resultCustomer.length == 0) {
                            flag = false;
                            transaction.setValue({fieldId: 'custentity_pe_cod_rec', value: code});
                        }
                    }
                   
                }

                //IMorales 20230811 - Inicio
                let valor_actual_indicador = transaction.getValue({fieldId: 'custentity_indicador_freshdesk'})
                if(valor_actual_indicador=="2")//Vino desde MR TS_MR_Customer_to_Freshdesk
                {
                    transaction.setValue({fieldId: 'custentity_indicador_freshdesk', value: '1'});
                }else//1, 0, cualquier otro valor
                {
                    transaction.setValue({fieldId: 'custentity_indicador_freshdesk', value: '0'});//Nuevo cambio
                }
                //IMorales 20230811 - Fin
            } 
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    const afterSubmit = (context) => {
        const FN = 'afterSubmit';
        try {
            
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    return {
        beforeLoad:beforeLoad,
        beforeSubmit:beforeSubmit,
        //afterSubmit: afterSubmit
    };
});