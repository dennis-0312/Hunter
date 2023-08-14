/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([
    'N/currentRecord',
    'N/record',
    'N/ui/dialog',
    '../../Impulso Plataformas/Controller/TS_Script_Controller'
], (currentRecord, record, dialog, _controllerParm) => {
    const SENSOR_TEMPERATURA = '75';
    const ESTADO_CHEQUEADO = 2;
    let typeMode;

    const pageInit = (context) => {
        var currentRecord = context.currentRecord;
        typeMode = context.mode;
        console.log('typeMode', typeMode);
        var item = currentRecord.getValue({ fieldId: 'custrecord_ht_ot_item' });
        let parametrosRespo = _controllerParm.parametrizacion(item);
        console.log('parametrosRespo', parametrosRespo);
        let parametro = 0;
        for (let j = 0; j < parametrosRespo.length; j++) {
            if (parametrosRespo[j][0] == SENSOR_TEMPERATURA) {
                parametro = parametrosRespo[j][1];
            }
        }

        console.log('parametro', parametro);
        if (parametro != '9') {
            //var form = context.form;
            var myField = currentRecord.getField('custrecord_ht_ot_termometro');
            myField.isVisible = false;
        }
    }

    const saveRecord = (context) => {
        if (typeMode == 'edit') {
            let currentRecord = context.currentRecord;
            let statusOT = currentRecord.getValue('custrecord_ht_ot_estado');
            let statusChaser = currentRecord.getValue('custrecord_ht_ot_estadochaser');
            let retorno = true;
            //console.log('Response', statusOT + ' - ' + statusChaser)
            if (statusOT == ESTADO_CHEQUEADO && statusChaser.length == 0) {
                dialog.alert({ title: 'Alerta', message: 'Debe ingresar un estado para dispositivo Chaser.' });
                retorno = false;
            }
            return retorno
        } else {
            return true;
        }
    }

    const reloadFuncion = (url) => { alert(url) }


    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        reloadFuncion: reloadFuncion,
    }
});
