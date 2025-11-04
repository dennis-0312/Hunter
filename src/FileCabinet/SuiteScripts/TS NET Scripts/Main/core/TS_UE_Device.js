/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/log',
    'N/query',
    'N/record',
    'N/search',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
],
    (log, query, record, search, _controller, _constant) => {

        const beforeLoad = (scriptContext) => { }
        const beforeSubmit = (scriptContext) => { }

        const afterSubmit = (scriptContext) => {
            try {
                let objRecord = scriptContext.newRecord;
                let id = objRecord.id;
                if (scriptContext.type == scriptContext.UserEventType.EDIT) {
                    updateDevice(objRecord);
                    //updateSim(objRecord)
                }
            } catch (error) {
                log.debug('ERROR afterSubmit', error);
            }
        }

        const updateDevice = (objRecord) => {
            try {
                if (objRecord.getValue('custrecord_ht_dd_dispositivo').length > 0) {
                    let sql2 = 'SELECT id, custrecord_ht_mc_enlace as ensambleid FROM customrecord_ht_record_mantchaser WHERE custrecord_ht_mc_seriedispositivo = ?'
                    let resultSet2 = query.runSuiteQL({ query: sql2, params: [objRecord.id] });
                    let results2 = resultSet2.asMappedResults();
                    log.error('RESULT', results2);
                    if (results2.length > 0) {
                        let objRec = record.submitFields({
                            type: _constant.customRecord.CHASER,
                            id: results2[0]['id'],
                            values: {
                                // 'custrecord_ht_dd_modelodispositivo': objRecord.getValue('custrecord_ht_mc_modelo'),
                                // 'custrecord_ht_dd_imei': objRecord.getValue('custrecord_ht_mc_imei'),
                                // 'custrecord_ht_dd_firmware': objRecord.getValue('custrecord_ht_mc_firmware'),
                                // 'custrecord_ht_dd_script': objRecord.getValue('custrecord_ht_mc_script'),
                                // 'custrecord_ht_dd_servidor': objRecord.getValue('custrecord_ht_mc_servidor'),
                                // 'custrecord_ht_dd_tipodispositivo': objRecord.getValue('custrecord_ht_mc_unidad'),
                                // 'custrecord_ht_dd_vid': objRecord.getValue('custrecord_ht_mc_vid'),
                                // 'custrecord_ht_dd_macaddress': objRecord.getValue('custrecord_ht_mc_macaddress'),
                                // 'custrecord_ht_dd_sn': objRecord.getValue('custrecord_ht_mc_sn'),
                                // 'custrecord_ht_dd_estado': objRecord.getValue('custrecord_ht_mc_estadolodispositivo')

                                'custrecord_ht_mc_modelo': objRecord.getValue('custrecord_ht_dd_modelodispositivo'),
                                'custrecord_ht_mc_imei': objRecord.getValue('custrecord_ht_dd_imei'),
                                'custrecord_ht_mc_firmware': objRecord.getValue('custrecord_ht_dd_firmware'),
                                'custrecord_ht_mc_script': objRecord.getValue('custrecord_ht_dd_script'),
                                'custrecord_ht_mc_servidor': objRecord.getValue('custrecord_ht_dd_servidor'),
                                'custrecord_ht_mc_unidad': objRecord.getValue('custrecord_ht_dd_tipodispositivo'),
                                'custrecord_ht_mc_vid': objRecord.getValue('custrecord_ht_dd_vid'),
                                'custrecord_ht_mc_macaddress': objRecord.getValue('custrecord_ht_dd_macaddress'),
                                'custrecord_ht_mc_sn': objRecord.getValue('custrecord_ht_dd_sn'),
                                'custrecord_ht_mc_estadolodispositivo': objRecord.getValue('custrecord_ht_dd_estado')
                            },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        log.error('Registro', objRec);
                        try {
                            if (results2[0].ensambleid != null) {
                                let sql = 'SELECT custbody_ht_ce_ordentrabajo as otid FROM transaction WHERE id = ?';
                                let resultSet = query.runSuiteQL({ query: sql, params: [results2[0]['ensambleid']] });
                                let results = resultSet.asMappedResults();
                                log.error('results', results);
                                log.error('results.length', results.length);
                                if (results.length > 0) {
                                    try {
                                        for (let i = 0; i < results.length; i++) {
                                            let objOt = record.submitFields({
                                                type: _constant.customRecord.ORDEN_TRABAJO,
                                                id: results[i]['otid'],
                                                values: {
                                                    'custrecord_ht_ot_firmware': objRecord.getText('custrecord_ht_dd_firmware'),
                                                    'custrecord_ht_ot_script': objRecord.getText('custrecord_ht_dd_script'),
                                                    'custrecord_ht_ot_servidor': objRecord.getText('custrecord_ht_dd_servidor'),
                                                    'custrecord_ht_ot_vid': objRecord.getValue('custrecord_ht_dd_vid')
                                                },
                                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                                            });
                                            log.error('RegistroOT', objOt);
                                        }
                                    } catch (error) { }
                                }
                            } else {
                                let sql3 = 'SELECT id as otid FROM customrecord_ht_record_ordentrabajo WHERE custrecord_ht_ot_serieproductoasignacion = ?';
                                let results3 = query.runSuiteQL({ query: sql3, params: [results2[0].id] }).asMappedResults();
                                log.error('results3', results3);
                                if (results3.length > 0) {
                                    try {

                                        for (let index = 0; index < results3.length; index++) {
                                            let objOt = record.submitFields({
                                                type: _constant.customRecord.ORDEN_TRABAJO,
                                                id: results3[index].otid,
                                                values: {
                                                    'custrecord_ht_ot_firmware': objRecord.getText('custrecord_ht_dd_firmware'),
                                                    'custrecord_ht_ot_script': objRecord.getText('custrecord_ht_dd_script'),
                                                    'custrecord_ht_ot_servidor': objRecord.getText('custrecord_ht_dd_servidor'),
                                                    'custrecord_ht_ot_vid': objRecord.getValue('custrecord_ht_dd_vid')
                                                },
                                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                                            });
                                            log.error('RegistroOT', objOt);
                                        }
                                    } catch (error) { }
                                }
                            }
                        } catch (error) { }
                    }
                }
            } catch (error) {
                log.debug('ERROR updateDevice', error);
            }
        }
        return { beforeLoad, beforeSubmit, afterSubmit }
    });
