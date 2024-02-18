/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define([
    'N/log',
    'N/record',
    'N/https',
    'N/query',
    '../TS NET Scripts/Main/controller/TS_CM_Controller',
    '../TS NET Scripts/Main/constant/TS_CM_Constant',
    '../TS NET Scripts/Main/error/TS_CM_ErrorMessages'
],
    (log, record, https, query, _controller, _constant, errorMessage) => {
        const afterSubmit = (scriptContext) => {
            let objRecord = scriptContext.newRecord;
            let id = objRecord.id;
            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
                updateDevice(objRecord);
                //updateSim(objRecord)
            }
        }

        const updateDevice = (objRecord) => {
            if (objRecord.getValue('custrecord_ht_mc_seriedispositivo').length > 0) {
                let objRec = record.submitFields({
                    type: _constant.customRecord.DISPOSITIVO,
                    id: objRecord.getValue('custrecord_ht_mc_seriedispositivo'),
                    values: {
                        'custrecord_ht_dd_modelodispositivo': objRecord.getValue('custrecord_ht_mc_modelo'),
                        'custrecord_ht_dd_imei': objRecord.getValue('custrecord_ht_mc_imei'),
                        'custrecord_ht_dd_firmware': objRecord.getValue('custrecord_ht_mc_firmware'),
                        'custrecord_ht_dd_script': objRecord.getValue('custrecord_ht_mc_script'),
                        'custrecord_ht_dd_servidor': objRecord.getValue('custrecord_ht_mc_servidor'),
                        'custrecord_ht_dd_tipodispositivo': objRecord.getValue('custrecord_ht_mc_unidad'),
                        'custrecord_ht_dd_vid': objRecord.getValue('custrecord_ht_mc_vid'),
                        'custrecord_ht_dd_macaddress': objRecord.getValue('custrecord_ht_mc_macaddress'),
                        'custrecord_ht_dd_sn': objRecord.getValue('custrecord_ht_mc_sn'),
                        'custrecord_ht_dd_estado': objRecord.getValue('custrecord_ht_mc_estadolodispositivo')
                    },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
                log.error('Registro', objRec);

                let sql = 'SELECT custbody_ht_ce_ordentrabajo as otid FROM transaction WHERE id = ?';
                let resultSet = query.runSuiteQL({ query: sql, params: [objRecord.getValue('custrecord_ht_mc_enlace')] });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    try {
                        let objOt = record.submitFields({
                            type: _constant.customRecord.ORDEN_TRABAJO,
                            id: results[0]['otid'],
                            values: {
                                'custrecord_ht_ot_firmware': objRecord.getText('custrecord_ht_mc_firmware'),
                                'custrecord_ht_ot_script': objRecord.getText('custrecord_ht_mc_script'),
                                'custrecord_ht_ot_servidor': objRecord.getText('custrecord_ht_mc_servidor'),
                                'custrecord_ht_ot_vid': objRecord.getValue('custrecord_ht_mc_vid')
                            },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        log.error('RegistroOT', objOt);
                    } catch (error) { }
                }
            }
        }
        
        const updateSim = (objRecord) => {
            record.submitFields({
                type: _constant.customRecord.CHASER,
                id: objRecord.getValue('custrecord_ht_mc_seriedispositivo'),
                values: {
                    'custrecord_ht_mc_modelo': objRecord.getValue('custrecord_ht_dd_modelodispositivo'),
                    'custrecord_ht_mc_imei': objRecord.getValue('custrecord_ht_dd_imei'),
                    'custrecord_ht_mc_firmware': objRecord.getValue('custrecord_ht_dd_firmware'),
                    'custrecord_ht_mc_script': objRecord.getValue('custrecord_ht_dd_script'),
                    'custrecord_ht_mc_servidor': objRecord.getValue('custrecord_ht_dd_servidor'),
                    'custrecord_ht_mc_tipodispositivo': objRecord.getValue('custrecord_ht_mc_seriedispositivo'),
                    'custrecord_ht_mc_unidad': objRecord.getValue('custrecord_ht_dd_tipodispositivo'),
                    'custrecord_ht_mc_vid': objRecord.getValue('custrecord_ht_dd_vid'),
                    'custrecord_ht_mc_macaddress': objRecord.getValue('custrecord_ht_dd_macaddress'),
                    'custrecord_ht_mc_sn': objRecord.getValue('custrecord_ht_dd_sn'),
                    'custrecord_ht_cl_estado': objRecord.getValue('custrecord_ht_dd_estado')
                },
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });
        }
        const updateLojack = (objRecord) => { }

        const envioTelematic = (json) => {
            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(json),
                deploymentId: 'customdeploy_ts_rs_new_device',
                scriptId: 'customscript_ts_rs_new_device',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            return response;
        }

        return {
            afterSubmit: afterSubmit
        }

        // if (idTelematic.length == 0) {
        //     let telemat = {
        //         device: {
        //             report_from: 3,
        //             active: true,
        //             model: 1,
        //             company_code: "PruebaEvol",
        //             id: objRecord.getValue('name')
        //         }
        //     }
        //     let Telematic = envioTelematic(telemat);
        //     log.debug('Telematic', Telematic);
        //     Telematic = JSON.parse(Telematic);

        //     if (Telematic.Device.id) {
        //         let cliente = record.load({ type: 'customrecord_ht_record_mantchaser', id: ordenId });
        //         cliente.setValue({ fieldId: 'custrecord_ht_mc_id_telematic', value: Telematic.Device.id })
        //         cliente.save();
        //     }
        // }
    });

