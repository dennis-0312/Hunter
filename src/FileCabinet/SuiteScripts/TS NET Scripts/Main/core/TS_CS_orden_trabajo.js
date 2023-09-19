/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([
    'N/currentRecord',
    'N/record',
    'N/ui/dialog',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
], (currentRecord, record, dialog, _controller, _constant, _errorMessage) => {
    const SENSOR_TEMPERATURA = '75';
    const ESTADO_CHEQUEADO = 2;
    let typeMode;

    const pageInit = (context) => {
        let currentRecord = context.currentRecord;
        typeMode = context.mode;
        console.log('typeMode', typeMode);
        let item = currentRecord.getValue({ fieldId: 'custrecord_ht_ot_item' });
        let parametrosRespo = _controller.parametrizacion(item);
        let estadoOT = currentRecord.getValue('custrecord_ht_ot_estado');
        //console.log('parametrosRespo', parametrosRespo);
        let parametro = 0;
        for (let j = 0; j < parametrosRespo.length; j++) {
            if (parametrosRespo[j][0] == SENSOR_TEMPERATURA) {
                parametro = parametrosRespo[j][1];
            }
        }
        //console.log('parametro', parametro);
        if (parametro != '9') {
            //var form = context.form;
            var myField = currentRecord.getField('custrecord_ht_ot_termometro');
            myField.isVisible = false;
        }

        if (typeMode == 'edit' && estadoOT == _constant.Status.CHEQUEADO) {
            currentRecord.getField('custrecord_ht_ot_supervisorasignacion').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_tecnicoasignacion').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_fechatrabajoasignacion').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_horatrabajoasignacion').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_serieproductoasignacion').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_ubicacion').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_estadochaser').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_motivos').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_fueraciudad').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_fuerataller').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_connovedad').isDisabled = true
            currentRecord.getField('custrecord_ht_ot_listacomentarios').isDisabled = true
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
