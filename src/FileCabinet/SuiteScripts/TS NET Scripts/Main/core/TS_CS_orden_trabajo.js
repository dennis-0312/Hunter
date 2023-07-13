/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define([ 
        'N/currentRecord', 
       
  
        'N/record', 
       
        '../../Impulso Plataformas/Controller/TS_Script_Controller' 
      ], function
        (currentRecord, record,  _controllerParm){

    var SENSOR_TEMPERATURA = '75';        
    function pageInit(context) {
       
        var currentRecord = context.currentRecord;
        typeMode = context.mode;
        console.log('typeMode',typeMode);
         var item = currentRecord.getValue({ fieldId: 'custrecord_ht_ot_item' });
        let parametrosRespo = _controllerParm.parametrizacion(item);
        console.log('parametrosRespo',parametrosRespo);
        let parametro = 0;
        for (let j = 0; j < parametrosRespo.length; j++) {
            if (parametrosRespo[j][0] == SENSOR_TEMPERATURA) {
                parametro = parametrosRespo[j][1];
            }
        }
        console.log('parametro',parametro);
        if(parametro != '9'){ 
            //var form = context.form;
            var myField = currentRecord.getField('custrecord_ht_ot_termometro');
            myField.isVisible = false;
         }
    }

    function saveRecord(context) {
        return true;
    }
    function reloadFuncion(url) {
        alert(url);
    }
    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        reloadFuncion:reloadFuncion,
    }
});
