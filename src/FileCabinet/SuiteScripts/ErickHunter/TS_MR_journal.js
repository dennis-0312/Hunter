/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/record', 'N/task', 'N/runtime'], function(log, search, record, task, runtime) {
    const scriptObj = runtime.getCurrentScript();
    const arregloTrimestre = [['01', '02', '03'], ['04', '05', '06'], ['07', '08', '09'], ['10', '11', '12']];

    const TEMPORALIDAD_TRIMESTRAL = 2;

    function getInputData() {
        let id = scriptObj.getParameter({ name: 'custscriptcustscript_param_journal' });
        let customer = record.load({ type:'journalentry', id:id}); 
        let temporalidad = customer.getValue({fieldId:'custbody_lh_temporalidad_flag'});
        let numLines =  customer.getLineCount({sublistId: 'line'});
        try{
            for (let i = 0; i < numLines; i++) {
                let AplicaPPTO = customer.getSublistValue({ sublistId: 'line', fieldId: 'custcollh_aplica_ppto',line: i });
                
                let date = customer.getValue({ fieldId: 'trandate' });
                date = sysDate(date); 
                let month = date.month;
                let tempo = 0;
                
                if(AplicaPPTO){
                    let nivelControl = parseInt(customer.getValue('custbody_lh_nivel_control_flag'));
                    let criterioControl = customer.getSublistValue({ sublistId: 'line', fieldId: 'department',line: i });
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
                              
                            ]
                    });
                   
                    let resultCount = presupuestado.runPaged().count;
                    
                    if (resultCount != 0) {
                        let result = presupuestado.run().getRange({ start: 0, end: 1 });
                        categoria = result[0].getValue(presupuestado.columns[0]);
                       
                        
                    }
                    
                    customer.setSublistValue({ sublistId: 'line', fieldId: 'custcol_lh_ppto_flag', value: categoria ,line:i});
                   
                    
                }
            }
            customer.save();
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
    function map(context) {
      
    }

    function reduce(context) {
      
    }

    function summarize(summary) {
       
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
