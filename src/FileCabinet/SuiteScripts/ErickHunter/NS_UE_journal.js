/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/log','N/record','N/search','N/error','N/task'], function(log,record,search,error,task) {

    const arregloTrimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
    const TEMPORALIDAD_TRIMESTRAL = 2;
    const CECO_NIVEL_CONTROL = 1;
    const CUENTA_NIVEL_CONTROL = 2;
    const CATEGORIA_NIVEL_CONTROL = 3;
    
    function beforeSubmit(scriptContext) {
        

        
        const objRecord = scriptContext.newRecord; 
        let temporalidad = objRecord.getValue('custbody_lh_temporalidad_flag');
        var numLines = objRecord.getLineCount({sublistId: 'line'});
        for (let i = 0; i < numLines; i++) {
            
            let AplicaPPTO = objRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcollh_aplica_ppto',line: i });
            if(AplicaPPTO){
                let nivelControl = parseInt(objRecord.getValue('custbody_lh_nivel_control_flag'));

                let criterioControl = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'department',line: i });
                let criterioControlCategoria = objRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_lh_categoria_ppto_oc',line: i });
                
                switch (nivelControl) {
                    case CECO_NIVEL_CONTROL:
                        msgCriterio = 'No tiene presupuesto para este centro de costo.';
                        msgVacio = 'Debe ingresar un centro de costo.';
                        break;
                    case CUENTA_NIVEL_CONTROL:
                        msgCriterio = 'No tiene presupuesto para esta cuenta.';
                        msgVacio = 'Debe ingresar una cuenta.';
                        break;
                    case CATEGORIA_NIVEL_CONTROL:
                        msgVacio = 'Debe ingresar un centro de costo.';
                        if (criterioControlCategoria.length == 0) {
                            var myCustomError = error.create({
                                name: 'EventError',
                                message: 'Debe ingresar una categoría',
                                notifyOff: false
                            });
                            throw myCustomError;
                                            
                        }
                        msgCriterio = 'No tiene presupuesto para esta categoría.';
                       
                        break;
                    default:
                        msgCriterio = 'Revisar la configuración del Nivel de Control.'
                        break;
                }                
                if (criterioControl.length == 0) {
                    var myCustomError = error.create({
                        name: 'EventError',
                        message: msgVacio,
                        notifyOff: false
                    });
                    throw myCustomError;
                }                       
               
            
            }
            }
    }
    function afterSubmit(context) {
       
        let objRecord = context.newRecord;
        let ordenId = objRecord.id;
        let temporalidad = objRecord.getValue({fieldId:'custbody_lh_temporalidad_flag'});
        let numLines =  objRecord.getLineCount({sublistId: 'line'});
        var thirdID = record.submitFields({
            type:'journalentry',
            id: ordenId,
            values: {
                'memo': 'categoria' ,
                'custcol_lh_ppto_flag ' : 4
            }
        });
        try{
            for (let i = 0; i < numLines; i++) {
                let AplicaPPTO = objRecord.getSublistValue({ sublistId: 'line', fieldId: 'custcollh_aplica_ppto',line: i });
                let inventoryAssignment = currentRecord.selectLine({ sublistId: 'line', line: i });
                inventoryAssignment.getCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: 'asdasdas' });
            
                let date = objRecord.getValue({ fieldId: 'trandate' })
        
                date = sysDate(date); 
                let month = date.month;
                let tempo = 0;
                
                if(AplicaPPTO){
                    let nivelControl = parseInt(objRecord.getValue('custbody_lh_nivel_control_flag'));
                    let criterioControl = objRecord.getSublistValue({ sublistId: 'line', fieldId: 'department',line: i });
                    if (temporalidad == TEMPORALIDAD_TRIMESTRAL) {
                        //!const trimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];
                        for (let i in arregloTrimestre) {
                            let bloque = arregloTrimestre[i].includes(month.toString());
                            if (bloque == true) {
                                tempo = parseInt(i);
                                break;
                            }
                        }
                    }
                    let presupuesto = 0;
                    let categoria = 0;
                    const presupuestado = search.create({
                        type: "customrecord_lh_presupuesto_trimestral",
                        filters:
                            [
                                ["custrecord_lh_detalle_cppto_status_tr", "anyof", "1"],
                                "AND",
                                ["custrecord_lh_detalle_cppto_categoria_tr.custrecord_lh_cp_centro_costo", "anyof", parseInt( criterioControl)],
                                "AND",
                                ["custrecord_lh_detalle_cppto_anio_tr.name", "haskeywords", parseInt(date.year)]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "custrecord_lh_detalle_cppto_categoria_tr", label: "0 Categoría" }),
                                search.createColumn({ name: "custrecord_lh_detalle_cppto_" + parseInt(tempo), label: "1 Trimestre" }),
                            ]
                    });
                   
                    let resultCount = presupuestado.runPaged().count;
                    
                    if (resultCount != 0) {
                        let result = presupuestado.run().getRange({ start: 0, end: 1 });
                        categoria = result[0].getValue(presupuestado.columns[0]);
                        presupuesto = parseFloat(result[0].getValue(presupuestado.columns[1]));
                        
                    }
                    
                   
                    
                   
                }
            }
        }catch (e) {
           log.debug('Error-sysDate', e);
        }
          
    }
    const sysDate = (date_param) => {
        try {
            let date = new Date(date_param);
            let month = date.getMonth() + 1; // jan = 0
            let year = date.getFullYear();
            month = month <= 9 ? '0' + month : month;
            return {
                month: month,
                year: year
            }
        } catch (e) {
           log.debug('Error-sysDate', e);
        }
    }
 
    return {
        
        beforeSubmit: beforeSubmit,
        afterSubmit :afterSubmit
    }
});
