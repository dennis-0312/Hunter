/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([
    'N/currentRecord',
    'N/record',
    'N/ui/dialog',
    'N/query',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
], (currentRecord, record, dialog, query, _controller, _constant, _errorMessage) => {
    const SENSOR_TEMPERATURA = '75';
    const ESTADO_CHEQUEADO = 2;
    let typeMode;

    const pageInit = (context) => {
        let currentRecord = context.currentRecord;
        typeMode = context.mode;
        console.log('typeMode', typeMode);

        let item = currentRecord.getValue({ fieldId: 'custrecord_ht_ot_item' });
        if (item.length > 0) {
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

            // console.log(item);
            // let sql = 'SELECT custrecord_ht_pp_parametrizacion_valor as valor FROM customrecord_ht_pp_main_param_prod ' +
            //     'WHERE custrecord_ht_pp_parametrizacionid = ? AND custrecord_ht_pp_parametrizacion_rela = ?';
            // let resultSet = query.runSuiteQL({ query: sql, params: [item, parametro] });
            // let results = resultSet.asMappedResults();
            // let valor = results.length > 0 ? results[0]['valor'] : 0;
            let dsr = _controller.getParameter(item, _constant.Parameter.DSR_DEFINICION_DE_SERVICIOS)
            console.log(dsr);
            if (dsr != _constant.Valor.SI) {
                let field = currentRecord.getField('custrecord_ht_ot_servicios_commands');
                field.isDisplay = false;
                let field2 = currentRecord.getField('custrecord_ht_ot_numero_puertas');
                field2.isDisplay = false;
            }

            // if (typeMode == 'edit' && currentRecord.getValue('custrecord_flujo_de_convenio')) {
            let myFieldEstadoOT = currentRecord.getField('custrecord_ht_ot_estado');
            myFieldEstadoOT.isDisabled = true;
            // }
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
