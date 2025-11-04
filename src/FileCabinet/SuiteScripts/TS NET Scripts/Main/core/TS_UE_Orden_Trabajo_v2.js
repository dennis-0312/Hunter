/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/config',
    'N/email',
    'N/file',
    'N/format',
    'N/https',
    'N/log',
    'N/query',
    'N/record',
    'N/runtime',
    'N/search',
    'N/ui/message',
    'N/ui/serverWidget',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
],
    (config, email, file, format, https, log, query, record, runtime, search, message, serverWidget, _controller, _constant) => {

        const beforeLoad = (scriptContext) => {
            let objRecord = scriptContext.newRecord;
            let id = scriptContext.newRecord.id;
            let form = scriptContext.form;
            let buttonEdit = form.getButton('edit');
            let workOrderId = objRecord.getValue('custrecord_ht_ot_ordenfabricacion');
            let estado = objRecord.getValue('custrecord_ht_ot_estado');
            let serieDispositivo = objRecord.getValue('custrecord_ht_ot_serieproductoasignacion');
            let serviceOrderid = objRecord.getValue('custrecord_ht_ot_orden_servicio');
            let othersInstalls = objRecord.getValue('custrecord_ht_ot_others_installs');
            let flujoAccesorio = objRecord.getValue('custrecord_ht_ot_flu_acc');
            let item = objRecord.getValue('custrecord_ht_ot_itemrelacionado');

            form.clientScriptModulePath = './TS_CS_Ensamble_Dispositivo.js';

            if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                let objParams = _controller.paramCodes(item);
                const esAccionComercialActivados = objParams.some(
                    obj =>
                        obj.paramCode === _constant.Codigo_parametro.COD_ADP_ACCION_DEL_PRODUCTO &&
                        obj.valorCode === _constant.Codigo_parametro.COD_VALOR_051_ACTIVADOS
                );
                log.debug(`objParams Item: ${item}`, existeActivacion);

                if (esAccionComercialActivados) {
                    if (serviceOrderid) {
                        let sql = 'SELECT so.status as estado ' +
                            'FROM customrecord_ht_record_ordentrabajo ot ' +
                            'INNER JOIN transaction so ON ot.custrecord_ht_ot_orden_servicio = so.id ' +
                            'WHERE ot.custrecord_ht_ot_orden_servicio = ? FETCH FIRST 1 ROWS ONLY';

                        let resultSet = query.runSuiteQL({ query: sql, params: [serviceOrderid] });
                        let results = resultSet.asMappedResults();
                        if (results.length > 0) {
                            if (results[0]['estado'] == 'A') {
                                buttonEdit.isDisabled = true;
                                let messageObj = message.create({
                                    type: message.Type.WARNING,
                                    title: 'Orden de Servicio PENDIENTE de APROBACIÓN!',
                                    message: 'Póngase en contacto con su supervisor antes de continuar.',
                                    //duration: 10000
                                });
                                form.addPageInitMessage({ message: messageObj });
                            }

                            if (results[0]['estado'] == 'H' || results[0]['estado'] == 'C') {
                                buttonEdit.isDisabled = true;
                                let messageObj = message.create({
                                    type: message.Type.ERROR,
                                    title: 'Orden de Servicio CERRADA o CANCELADA!',
                                    message: 'Póngase en contacto con su supervisor antes de continuar.',
                                    //duration: 10000
                                });
                                form.addPageInitMessage({ message: messageObj });
                            }
                        }
                    }

                    let sql2 = 'SELECT custrecord_ts_reg_imp_plt_estado as estado ' +
                        'FROM customrecord_ts_regis_impulso_plataforma ' +
                        'WHERE custrecord_ts_reg_imp_plt_ordentrabajo = ? ' +
                        'ORDER BY id DESC FETCH FIRST 1 ROWS ONLY';
                    let results2 = query.runSuiteQL({ query: sql2, params: [id] }).asMappedResults();

                    if (results2.length > 0) {
                        if (results2[0].estado === 'error') {
                            let messageObj = message.create({
                                type: message.Type.ERROR,
                                title: 'Ocurrio un error con las plataformas.',
                                message: 'Póngase en contacto con el área de soporte.',
                                //duration: 10000
                            });
                            form.addPageInitMessage({ message: messageObj });
                        }
                    }

                    if (estado == _constant.Status.CHEQUEADO) {
                        let messageObj = message.create({
                            type: message.Type.CONFIRMATION,
                            title: 'Orden de Trabajo Chequeada',
                            message: 'La Orden de Trabajo ha sido Chequeda Correctamente.',
                            //duration: 10000
                        });
                        form.addPageInitMessage({ message: messageObj });
                    }

                    if (estado == _constant.Status.PROCESANDO) {
                        if (workOrderId) {
                            let existAssembly = validateExistAssemblyForOT(id);
                            if (!existAssembly) {
                                form.addButton({
                                    id: 'custpage_ts_fabricarproducto',
                                    label: 'Ensamble de Dispositivo',
                                    functionName: 'ensambleDispositivo(' + workOrderId + ')'
                                });
                            }
                        }
                    }

                    if (estado == _constant.Status.PROCESANDO || estado == _constant.Status.CHEQUEADO) {
                        if (serieDispositivo || othersInstalls || flujoAccesorio) {
                            form.addButton({
                                id: 'custpage_ts_chequeo',
                                label: 'Chequear Orden',
                                functionName: 'chequearOrden(' + id + ')'
                            });
                        }
                    }
                }
            }
        }

        const afterSubmit = (scriptContext) => {
            let objRecord = scriptContext.newRecord;
            let id = scriptContext.newRecord.id;
            let item = objRecord.getValue('custrecord_ht_ot_itemrelacionado');

            if (context.type === context.UserEventType.EDIT) {
                let objParams = _controller.paramCodes(item);
                const esAccionComercialActivados = objParams.some(
                    obj =>
                        obj.paramCode === _constant.Codigo_parametro.COD_ADP_ACCION_DEL_PRODUCTO &&
                        obj.valorCode === _constant.Codigo_parametro.COD_VALOR_051_ACTIVADOS
                );

                if (esAccionComercialActivados) {
                    //Implementar Lógica de Activados, acciones a incluir:
                    // instalación venta y activación de servicios (es dual)
                    // mapeo de campos unidad de tiempo y tiempo en el detalle de la os por ser dual para aplicar el tiempo de servicio en la cobertura
                    // creación de registro de cobertura considerando los parámetros
                    // activación de cobertura considerando los parámetros
                    // impulso a plataformas no aplica porque no se tiene el impulso a plataformas HUNTER PE
                }
            }
        }

        return { beforeLoad, /*beforeSubmit,*/ afterSubmit }

    });
