/**
 * @NApiVersion 2.1
 */
define([
    'N/log',
    'N/record',
    'N/search',
    'N/query',
    'N/runtime',
    '../constant/TS_CM_Constant',
    '../../Impulso Plataformas/Controller/TS_ScriptPlataformas_controller',
    'SuiteScripts/IntegracionesHunter/HU_TS_ScriptPlataformas_controller'
],
    /**
     * @param{log} log
     * @param{record} record
     * @param{search} search
     */
    (log, record, search, query, runtime, _constant, _platformController, _platformControllerLatam) => {
        //! FUNCTIONS ====================================================================================================================================================
        const createServiceOrder = (requestHeader, requestDetail) => {
            let objRecord = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
            for (let j in requestHeader) {
                objRecord.setValue({ fieldId: requestHeader[j].field, value: requestHeader[j].value });
            }
            const detail = objRecord.selectNewLine({ sublistId: 'item' });
            for (let k in requestDetail) {
                for (let i in requestDetail[k]) {
                    log.debug('Detail', requestDetail[k][i].field + ' - ' + requestDetail[k][i].value);
                    detail.setCurrentSublistValue({ sublistId: 'item', fieldId: requestDetail[k][i].field, value: requestDetail[k][i].value, ignoreFieldChange: false });
                }
                objRecord.commitLine({ sublistId: 'item' });
            }
            let response = objRecord.save({ ignoreMandatoryFields: true });
            return response;
        }

        const createInvoice = (serviceOrder) => {
            let recTransform = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: serviceOrder,
                toType: record.Type.INVOICE,
                isDynamic: true,
            });
            recTransform.setValue('custbodyts_ec_tipo_documento_fiscal', _constant.Constants.DOCUMENT_TYPE.INVOICE);
            return recTransform.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        const createJournal = (fecha, provision, nota) => {
            const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });

            objRecord.setValue({ fieldId: 'trandate', value: new Date(fecha) });
            //objRecord.setValue({ fieldId: 'currency', value: context.currency });
            objRecord.setValue({ fieldId: 'memo', value: nota });
            objRecord.setValue({ fieldId: 'subsidiary', value: 2 });

            objRecord.selectNewLine({ sublistId: 'line' });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 1237, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: provision, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
            objRecord.commitLine({ sublistId: 'line' });

            objRecord.selectNewLine({ sublistId: 'line' });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 798, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: provision, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
            objRecord.commitLine({ sublistId: 'line' });

            const newJournal = objRecord.save({ ignoreMandatoryFields: false });

            return newJournal
        }

        const createProvisionDetail = (journal, serviceOrder, itemm, cost, inventory, income, amountProvided) => {
            const objRecord = record.create({ type: _constant.Constants.CUSTOM_RECORD.PROVISION_DETAIL, isDynamic: true });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_asiento_provision', value: journal });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_transaccion_prov', value: serviceOrder });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_item', value: itemm });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_cost_account', value: cost });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_inventory_account', value: inventory });
            if (income != 0)
                objRecord.setValue({ fieldId: 'custrecord_ht_dp_income_account', value: income });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_provision', value: amountProvided });
            return objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        const wrapPxResponse = (rawResponse, payload) => {
            //cambio JMON 14/12/2025 mejora - normaliza la respuesta PX para evitar objetos vacíos
            let status = false;
            let mensaje = '';
            let respuesta = rawResponse;
            let detalle = payload || null;
            let raw = rawResponse;
            try {
                if (typeof rawResponse === 'string') {
                    try {
                        const parsed = JSON.parse(rawResponse);
                        // Si viene como objeto {status,mensaje,detalle}
                        if (parsed && typeof parsed === 'object') {
                            respuesta = parsed;
                            if (parsed.status !== undefined) status = parsed.status === true || parsed.status === 'true';
                            if (parsed.mensaje) mensaje = parsed.mensaje;
                            if (parsed.detalle) detalle = parsed.detalle;
                        }
                    } catch (e) {
                        // string simple: usa tal cual
                        status = rawResponse === '1';
                        mensaje = rawResponse === '1' ? '' : rawResponse;
                    }
                } else if (typeof rawResponse === 'object' && rawResponse !== null) {
                    if (rawResponse.status !== undefined) {
                        status = rawResponse.status === true || rawResponse.status === 'true';
                        mensaje = rawResponse.mensaje || '';
                        respuesta = rawResponse.respuesta !== undefined ? rawResponse.respuesta : rawResponse;
                        detalle = rawResponse.detalle || detalle;
                    }
                } else if (rawResponse === 1) {
                    status = true;
                }
            } catch (e) {
                mensaje = e.message;
            }
            return { status, mensaje, respuesta, detalle, raw };
        };

        const parametros = (parametro, id, type = null, adp = null, bien = null, cliente = null) => {
            log.error('Controller - parametro, id, type = null, adp = null, bien = null, cliente = null', `${parametro}, ${id}, ${type} = null, ${adp} = null, ${bien} = null, ${cliente} = null`);
            log.error('Controller - objId', id);
            let response = { status: true, mensaje: '' };
            let currentRecord = id;
            let idordenFabricación = 0;
            switch (parametro) {
                case _constant.Codigo_parametro.COD_GPG_GENERA_PARAMETRIZACION_EN_GEOSYS:
                    switch (parseInt(type)) {
                        case _constant.Codigo_Valor.COD_VALOR_001_INST_DISPOSITIVO:
                            log.debug('PX-LATAM', 'Instalacion dispositivo');
                            log.debug('IMPULSO-PX-START', { ot: id, tipo: type, accion: '001' }); //cambio JMON 14/12/2025
                            response = _platformControllerLatam.envioPXInstalacionDispositivoPeru(id, runtime.getCurrentUser().subsidiary, _constant.Constants.URLPX); // id Orden de Trabajo
                            response = wrapPxResponse(response, { ot: id, tipo: type });
                            log.debug('ResponsePX', response);
                            log.debug('IMPULSO-PX-DATA', { detalle: response.detalle, respuesta: response.respuesta, raw: response.raw }); //cambio JMON 14/12/2025
                            log.debug('IMPULSO-PX-END', response); //cambio JMON 14/12/2025
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_010_CAMBIO_DE_PROPIETARIO:
                            log.debug('PX-LATAM', 'Cambio de propietario');
                            log.debug('IMPULSO-PX-START', { ot: id, tipo: type, accion: '010' }); //cambio JMON 14/12/2025
                            response = _platformControllerLatam.envioPXCambioPropietario(id, runtime.getCurrentUser().subsidiary, _constant.Constants.URLPX); // id Orden de Trabajo
                            response = wrapPxResponse(response, { ot: id, tipo: type });
                            log.debug('ResponsePX', response);
                            log.debug('IMPULSO-PX-DATA', { detalle: response.detalle, respuesta: response.respuesta, raw: response.raw }); //cambio JMON 14/12/2025
                            log.debug('IMPULSO-PX-END', response); //cambio JMON 14/12/2025
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_002_DESINSTALACION_DE_DISP:
                            log.debug('PX-LATAM', 'Desinstalacion dispositivo');
                            log.debug('IMPULSO-PX-START', { ot: id, tipo: type, accion: '002' }); //cambio JMON 14/12/2025
                            response = _platformControllerLatam.envioPXDesinstalacionDispositivo(id, runtime.getCurrentUser().subsidiary, _constant.Constants.URLPX); // id Orden de Trabajo
                            response = wrapPxResponse(response, { ot: id, tipo: type });
                            log.debug('ResponsePX', response);
                            log.debug('IMPULSO-PX-DATA', { detalle: response.detalle, respuesta: response.respuesta, raw: response.raw }); //cambio JMON 14/12/2025
                            log.debug('IMPULSO-PX-END', response); //cambio JMON 14/12/2025
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_004_RENOVACION_DE_DISP:
                            log.debug('PX-LATAM', 'Renovacion dispositivo');
                            log.debug('IMPULSO-PX-START', { ot: id, tipo: type, accion: '004' }); //cambio JMON 14/12/2025
                            response = _platformControllerLatam.envioPXRenovacionDispositivo(id, runtime.getCurrentUser().subsidiary, _constant.Constants.URLPX, bien); // id Orden de Trabajo
                            response = wrapPxResponse(response, { ot: id, tipo: type });
                            log.debug('ResponsePX', response);
                            log.debug('IMPULSO-PX-DATA', { detalle: response.detalle, respuesta: response.respuesta, raw: response.raw }); //cambio JMON 14/12/2025
                            log.debug('IMPULSO-PX-END', response); //cambio JMON 14/12/2025
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO:
                            log.debug('PX-LATAM', 'Mantenimiento/Chequeo Dispositivo PX');
                            log.debug('IMPULSO-PX-START', { ot: id, tipo: type, accion: '006' }); //cambio JMON 14/12/2025
                            response = _platformControllerLatam.envioPXMantenimientoChequeoDispositivo(id, runtime.getCurrentUser().subsidiary, _constant.Constants.URLPX); // id Orden de Trabajo
                            response = wrapPxResponse(response, { ot: id, tipo: type });
                            log.debug('ResponsePX', response);
                            log.debug('IMPULSO-PX-DATA', { detalle: response.detalle, respuesta: response.respuesta, raw: response.raw }); //cambio JMON 14/12/2025
                            log.debug('IMPULSO-PX-END', response); //cambio JMON 14/12/2025
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_007_CHEQUEO_DE_COMPONENTES:
                            log.debug('PX-LATAM', 'Chequeo de Componentes PX');
                            log.debug('IMPULSO-PX-START', { ot: id, tipo: type, accion: '007' }); //cambio JMON 14/12/2025
                            response = _platformControllerLatam.envioPXChequeoComponentes(id, runtime.getCurrentUser().subsidiary, _constant.Constants.URLPX); // id Orden de Trabajo
                            response = wrapPxResponse(response, { ot: id, tipo: type });
                            log.debug('ResponsePX', response);
                            log.debug('IMPULSO-PX-DATA', { detalle: response.detalle, respuesta: response.respuesta, raw: response.raw }); //cambio JMON 14/12/2025
                            log.debug('IMPULSO-PX-END', response); //cambio JMON 14/12/2025
                            break;
                        default:
                            log.debug('accionEstadoOT');
                    }
                    break;
                case _constant.Codigo_parametro.COD_GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS:
                    switch (parseInt(type)) {
                        case _constant.Codigo_Valor.COD_VALOR_001_INST_DISPOSITIVO:
                            response = _platformController.envioTelecInstalacionNueva(id); // id Orden de Trabajo
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_010_CAMBIO_DE_PROPIETARIO:
                            log.debug('COD_VALOR_010_CAMBIO_DE_PROPIETARIOTM', 'Entré a cambiar propietario TM')
                            // response = _platformController.envioCambioPropietario(id);
                            response = _platformController.envioTelecCambioPropietario(id); // id Orden de Trabajo
                            log.debug('ResponseTM', response)
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_002_DESINSTALACION_DE_DISP:
                            log.debug('VALOR_002_DESINSTALACION_DE_DISP_TM', 'Entré a Desinstalacion TM');
                            response = _platformController.envioTelecDesinstalacionDispositivo(id); // id Orden de Trabajo
                            log.debug('ResponseTM', response);
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO:
                            log.debug('COD_VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO', 'Entré a Chequeo Dispositivo TM');
                            response = _platformController.envioTelecDesinstalacionDispositivo(id); // id Orden de Trabajo
                            log.debug('ResponseTM', response);
                            break;
                        case _constant.Codigo_Valor.COD_VALOR_003_REINSTALACION_DE_DISP:
                            response = _platformController.envioTelecInstalacionNueva(id); // id Orden de Trabajo
                            break;
                        default:
                            response.status = false;
                            response.mensaje = 'El cliente no cuenta con un correo tipo AMI.'
                            let sql = 'SELECT COUNT(*) AS cantidad FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = ? AND custrecord_ht_ce_enlace = ?';
                            let results = query.runSuiteQL({ query: sql, params: [_constant.Constants.EMAIL_TYPE_AMI, id] }).asMappedResults();
                            if (results[0].cantidad > 0) {
                                response.status = true;
                                response.mensaje = ''
                            }
                    }
                    break;
                case _constant.Codigo_parametro.COD_VOT_VARIAS_ORDENES_DE_TRABAJO:
                    log.debug('id.item-Varias', id.item);
                    if (id.serviceOrder) {
                        let relatedItemsArr = [];
                        let arrayWorkOrders = [];
                        let fam = getParameter(id.item, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);
                        let ttr = getParameter(id.item, _constant.Codigo_parametro.COD_TTR_TIPO_TRANSACCION);
                        let tag = getParameter(id.item, _constant.Codigo_parametro.COD_TAG_TIPO_AGRUPACION_PRODUCTO);
                        let alq = getParameter(id.item, _constant.Codigo_parametro.COD_ALQ_PRODUCTO_DE_ALQUILER);
                        let dsr = getParameter(id.item, _constant.Codigo_parametro.COD_DSR_DEFINICION_DE_SERVICIOS);
                        let nio = getParameter(id.item, _constant.Codigo_parametro.COD_PHV_PRODUCTO_HABILITADO_PARA_LA_VENTA);
                        let ccd = getParameter(id.item, _constant.Codigo_parametro.COD_CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS);
                        let pgr = getParameter(id.item, _constant.Codigo_parametro.COD_PGR_PRODUCTO_DE_GARANTÍA);

                        var customrecord_ht_pp_main_item_relacionadoSearchObj = search.create({
                            type: "customrecord_ht_pp_main_item_relacionado",
                            filters:
                                [
                                    ["custrecord_ht_pp_parametrizacionir", "anyof", id.item]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "custrecord_ht_pp_descripcionit", label: "Descripción" })
                                ]
                        });
                        let searchResultCount = customrecord_ht_pp_main_item_relacionadoSearchObj.run().getRange(0, 1000);
                        log.debug("customrecord_ht_pp_main_item_relacionadoSearchObj result count", searchResultCount);
                        if (searchResultCount.length != 0) {
                            for (let index = 0; index < searchResultCount.length; index++) {
                                relatedItemsArr.push(searchResultCount[index].getValue({ name: 'custrecord_ht_pp_descripcionit' }));
                            }
                        }
                        log.debug('Crea ordenes de trabajo')

                        if (relatedItemsArr.length != 0) {
                            for (let index = 0; index < relatedItemsArr.length; index++) {
                                let currentItem = relatedItemsArr[index];
                                let objRecord = record.create({ type: _constant.customRecord.ORDEN_TRABAJO });
                                objRecord.setValue({ fieldId: 'customform', value: _constant.Form.PE_ORDEN_TRABAJO_AUTOSAFE });
                                objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_servicio', value: id.serviceOrder });
                                objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente_id', value: id.customer });
                                objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: id.vehiculo });
                                objRecord.setValue({ fieldId: 'custrecord_ht_ot_itemrelacionado', value: currentItem });
                                objRecord.setValue({ fieldId: 'custrecord_ht_ot_item', value: id.item });
                                objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_serivicio_txt', value: id.ordenServicio });
                                if (fam.codigo != 0)
                                    objRecord.setValue({ fieldId: 'custrecord_ht_ot_producto', value: fam.idinterno });
                                if (ttr.codigo != 0)
                                    objRecord.setValue({ fieldId: 'custrecord_ht_ot_tipo_trabajo', value: ttr.idinterno });
                                if (tag.codigo != 0)
                                    objRecord.setValue({ fieldId: 'custrecordht_ot_tipo_agrupacion', value: tag.idinterno });
                                if (alq.codigo != 0 && alq.codigo == _constant.Codigo_Valor.COD_SI)
                                    objRecord.setValue({ fieldId: 'custrecord_flujo_de_alquiler', value: true });
                                if (nio.codigo != 0 && nio.codigo == _constant.Valor.VALOR_X_USO_CONVENIOS)
                                    objRecord.setValue({ fieldId: 'custrecord_flujo_de_convenio', value: true });
                                if (dsr.codigo != 0 && dsr.codigo == _constant.Codigo_Valor.COD_SI) {
                                    let sql = 'SELECT custitem_ht_it_servicios as servicios FROM item WHERE id = ?';
                                    let aditionalService = query.runSuiteQL({ query: sql, params: [id.item] }).asMappedResults();
                                    log.debug('ENTRY-aditionalService', aditionalService)
                                    let cadena = aditionalService[0].servicios;
                                    let arreglo = cadena.split(",").map(num => parseInt(num.trim(), 10));
                                    objRecord.setValue({ fieldId: 'custrecord_ht_ot_servicios_commands', value: arreglo });
                                }
                                if (ccd.codigo != 0 && ccd.codigo == _constant.Codigo_Valor.COD_VALOR_002_ENTREGA_CUSTODIAS)
                                    objRecord.setValue({ fieldId: 'custrecord_flujo_de_custodia', value: true });
                                if (pgr.codigo != 0 && pgr.codigo == _constant.Codigo_Valor.COD_SI)
                                    objRecord.setValue({ fieldId: 'custrecord_flujo_de_garantia', value: true });

                                workOrder = objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                arrayWorkOrders.push(workOrder);
                            }
                            response = arrayWorkOrders.length > 0 ? arrayWorkOrders[0] : 0
                        }
                    }
                    break;
                case _constant.Codigo_parametro.COD_GOT_GENERA_SOLICITUD_DE_TRABAJO:
                    log.debug('Controller - Track1', id);
                    if (id.serviceOrder) {
                        let relatedItemsArr = [];
                        let fam = getParameter(id.item, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);
                        let ttr = getParameter(id.item, _constant.Codigo_parametro.COD_TTR_TIPO_TRANSACCION);
                        let tag = getParameter(id.item, _constant.Codigo_parametro.COD_TAG_TIPO_AGRUPACION_PRODUCTO);
                        let alq = getParameter(id.item, _constant.Codigo_parametro.COD_ALQ_PRODUCTO_DE_ALQUILER);
                        log.debug('Controller - ALQ mepeando respuesta', alq);
                        let dsr = getParameter(id.item, _constant.Codigo_parametro.COD_DSR_DEFINICION_DE_SERVICIOS);
                        let nio = getParameter(id.item, _constant.Codigo_parametro.COD_PHV_PRODUCTO_HABILITADO_PARA_LA_VENTA);
                        log.debug('PARAMCONVENIO', nio);
                        let ccd = getParameter(id.item, _constant.Codigo_parametro.COD_CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS);
                        // let searchProductoRelacionado = search.create({
                        //     type: "customrecord_ht_pp_main_item_relacionado",
                        //     filters:
                        //         [
                        //             ["custrecord_ht_pp_parametrizacionir", "anyof", id.item]
                        //         ],
                        //     columns:
                        //         [
                        //             search.createColumn({ name: "custrecord_ht_pp_descripcionit", sort: search.Sort.DESC, label: "Descripción" })
                        //         ]
                        // });
                        // let searchResultCount = searchProductoRelacionado.run().getRange(0, 1000);
                        // if (searchResultCount.length != 0) {
                        //     for (let index = 0; index < searchResultCount.length; index++) {
                        //         relatedItemsArr.push(searchResultCount[index].getValue({ name: 'custrecord_ht_pp_descripcionit' }));
                        //     }
                        // }
                        // log.debug('Crea ordenes de trabajo', '===============================')
                        // if (relatedItemsArr.length != 0) {
                        //     log.debug('Crea ordenes de trabajo relatedItemsArr', '===============================')
                        //     for (let index = 0; index < relatedItemsArr.length; index++) {
                        //         let currentItem = relatedItemsArr[index];
                        //         let objRecord = record.create({ type: _constant.customRecord.ORDEN_TRABAJO });
                        //         objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_servicio', value: id.serviceOrder });
                        //         objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente_id', value: id.customer });
                        //         objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: id.vehiculo });
                        //         objRecord.setValue({ fieldId: 'custrecord_ht_ot_itemrelacionado', value: currentItem });
                        //         objRecord.setValue({ fieldId: 'custrecord_ht_ot_item', value: id.item });
                        //         objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_serivicio_txt', value: id.ordenServicio });
                        //         if (fam != 0)
                        //             objRecord.setValue({ fieldId: 'custrecord_ht_ot_producto', value: fam });
                        //         if (ttr != 0)
                        //             objRecord.setValue({ fieldId: 'custrecord_ht_ot_tipo_trabajo', value: ttr });
                        //         if (tag != 0)
                        //             objRecord.setValue({ fieldId: 'custrecordht_ot_tipo_agrupacion', value: tag });
                        //         if (alq != 0 && alq == _constant.Codigo_Valor.COD_SI)
                        //             objRecord.setValue({ fieldId: 'custrecord_flujo_de_alquiler', value: true });
                        //         if (nio != 0 && nio == _constant.Valor.VALOR_X_USO_CONVENIOS)
                        //             objRecord.setValue({ fieldId: 'custrecord_flujo_de_convenio', value: true });
                        //         if (dsr != 0 && dsr == _constant.Codigo_Valor.COD_SI) {
                        //             // let array = new Array();
                        //             // let array2 = new Array();
                        //             let sql = 'SELECT custitem_ht_it_servicios as servicios FROM item WHERE id = ?';
                        //             //let sql2 = 'SELECT custbody_ht_os_servicios as servicios FROM transaction WHERE id = ?'
                        //             let aditionalService = query.runSuiteQL({ query: sql, params: [id.item] }).asMappedResults();
                        //             log.debug('ENTRY-aditionalService', aditionalService)
                        //             let cadena = aditionalService[0].servicios;
                        //             let arreglo = cadena.split(",").map(num => parseInt(num.trim(), 10));
                        //             objRecord.setValue({ fieldId: 'custrecord_ht_ot_servicios_commands', value: arreglo });
                        //             // let resultSet2 = query.runSuiteQL({ query: sql2, params: [id.serviceOrder] });
                        //             // let results2 = resultSet2.asMappedResults();
                        //             // if (results.length > 0 && results2.length > 0) {
                        //             //     let arregloconvertido = results[0]['servicios'].split(",")
                        //             //     array = arregloconvertido.map(a => parseInt(a));
                        //             //     let arregloconvertido2 = results2[0]['servicios'].split(",")
                        //             //     array2 = arregloconvertido2.map(a => parseInt(a));
                        //             //     let common = array.filter((it) => array2.includes(it));
                        //             //     objRecord.setValue({ fieldId: 'custrecord_ht_ot_servicios_commands', value: common });
                        //             // }
                        //         }
                        //         response = objRecord.save();
                        //     }
                        // } 
                        // else {
                        log.error('Controller - Crea ordenes de trabajo unique', '===============================')
                        let objRecord = record.create({ type: _constant.customRecord.ORDEN_TRABAJO });
                        objRecord.setValue({ fieldId: 'customform', value: _constant.Form.PE_ORDEN_TRABAJO_AUTOSAFE });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_servicio', value: id.serviceOrder });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_cliente_id', value: id.customer });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_vehiculo', value: id.vehiculo });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_item', value: id.item });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_itemrelacionado', value: id.item });
                        objRecord.setValue({ fieldId: 'custrecord_ht_ot_orden_serivicio_txt', value: id.ordenServicio });
                        if (fam.codigo != 0)
                            objRecord.setValue({ fieldId: 'custrecord_ht_ot_producto', value: fam.idinterno });
                        if (ttr.codigo != 0)
                            objRecord.setValue({ fieldId: 'custrecord_ht_ot_tipo_trabajo', value: ttr.idinterno });
                        if (tag.codigo != 0)
                            objRecord.setValue({ fieldId: 'custrecordht_ot_tipo_agrupacion', value: tag.idinterno });
                        log.debug('Controller - ALQ entrando a setear check', `${alq.codigo} != 0 && ${alq.codigo} == ${_constant.Codigo_Valor.COD_SI}`);
                        if (alq.codigo != 0 && alq.codigo == _constant.Codigo_Valor.COD_SI)
                            objRecord.setValue({ fieldId: 'custrecord_flujo_de_alquiler', value: true });
                        if (nio.codigo != 0 && nio.codigo == _constant.Valor.VALOR_X_USO_CONVENIOS) {
                            log.debug('Controller - ENTRY-PARAMCONVENIO', nio)
                            objRecord.setValue({ fieldId: 'custrecord_flujo_de_convenio', value: true });
                        }
                        //& <I> dfernandez | 20/08/2025
                        if (ccd.codigo != 0 && ccd.codigo == _constant.Codigo_Valor.COD_VALOR_002_ENTREGA_CUSTODIAS)
                            objRecord.setValue({ fieldId: 'custrecord_flujo_de_custodia', value: true });
                        //& <F> dfernandez | 20/08/2025
                        if (dsr.codigo != 0 && dsr.codigo == _constant.Codigo_Valor.COD_SI) {
                            let sql = 'SELECT custitem_ht_it_servicios as servicios FROM item WHERE id = ?';
                            let aditionalService = query.runSuiteQL({ query: sql, params: [id.item] }).asMappedResults();
                            log.error('Controller - ENTRY-aditionalService', aditionalService)
                            let cadena = aditionalService[0].servicios;
                            let arreglo = cadena.split(",").map(num => parseInt(num.trim(), 10));
                            objRecord.setValue({ fieldId: 'custrecord_ht_ot_servicios_commands', value: arreglo });
                        }
                        //** LÓGICA PARA ASIGNAR LA OF EN CASO SE GENERA DESPUÉS ================================== */
                        //id.item - id.serviceOrder
                        let workorderSearchObj = search.create({
                            type: "workorder",
                            filters:
                                [
                                    ["type", "anyof", "WorkOrd"],
                                    "AND",
                                    ["item", "anyof", id.item],
                                    "AND",
                                    ["createdfrom", "anyof", id.serviceOrder]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "tranid", label: "Document Number" })
                                ]
                        });
                        let searchResultCount2 = workorderSearchObj.runPaged().count;
                        log.debug("Controller - workorderSearchObj result count", searchResultCount2);
                        if (searchResultCount2 > 0) {
                            workorderSearchObj.run().each((result) => {
                                idordenFabricación = result.id
                            });
                            objRecord.setValue({ fieldId: 'custrecord_ht_ot_ordenfabricacion', value: idordenFabricación });
                        }
                        //** ====================================================================================== */
                        response = objRecord.save(); //save Orden de Trabajo
                        log.debug("Orden de Trabajo Create", response);
                        if (idordenFabricación != 0) {
                            record.submitFields({
                                type: "workorder",
                                id: idordenFabricación,
                                values: { custbody_ht_ce_ordentrabajo: response },
                            })
                        }
                        // }
                    }
                    break;
                case _constant.Codigo_parametro.COD_PXB_ITEM_SOLICITA_CLIENTE_NUEVO:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var item_cliente = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente' });
                    if (!item_cliente) {
                        response.status = false;
                        response.mensaje = 'No existe un Cliente para el item ' + item + '.'
                    }
                    break;
                case _constant.Codigo_parametro.COD_SCK_SOLICITA_CLIENTE_MONITOREO:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var item_cliente_monitoreo = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo' });
                    if (!item_cliente_monitoreo) {
                        response.status = false;
                        response.mensaje = 'No existe un Cliente Monitoreo para el item ' + item + '.'
                    }
                    break;
                case _constant.Codigo_parametro.COD_PCD_PIDE_CODIGO_DE_ORIGEN:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var codigo_origen = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ns_codigo_origen' });
                    var codigo_origen_sys = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcoll_ns_codigo_origen_sys' });
                    if (!codigo_origen && !codigo_origen_sys) {
                        response.status = false;
                        response.mensaje = 'No existe un Codigo de Origen en el item ' + item + '.'
                    }
                    break;
                case _constant.Codigo_parametro.COD_CPI_CONTROL_DE_PRODUCTOS_INSTALADOS://cpi control de productos instalados
                    //console.log('PARAM', parametro + ' - ' + id + ' - ' + type + ' - ' + adp + ' - ' + bien + ' - ' + cliente)
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                    let familia;
                    if (adp == _constant.Codigo_Valor.COD_VALOR_001_INST_DISPOSITIVO) {
                        let famSearch = search.create({
                            type: "customrecord_ht_pp_main_param_prod",
                            filters:
                                [
                                    ["custrecord_ht_pp_parametrizacionid", "anyof", item],
                                    "AND",
                                    ["custrecord_ht_pp_parametrizacion_rela.custrecord_ht_pp_code", "anyof", _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS],
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" })
                                ]
                        });
                        let famSearchCount = famSearch.runPaged().count;
                        log.debug("customrecord_ht_pp_main_param_prodSearchObj result count", famSearchCount);
                        famSearch.run().each((result) => {
                            familia = result.getValue({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" })
                            return true;
                        });
                        //console.log('FAM', familia);
                        let mySearch = search.create({
                            type: "customrecord_ht_co_cobertura",
                            filters:
                                [
                                    ["custrecord_ht_co_bien", "anyof", bien],
                                    "AND",
                                    ["custrecord_ht_co_familia_prod", "anyof", familia],
                                    "AND",
                                    ["custrecord_ht_co_estado", "anyof", _constant.Status.INSTALADO]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" })
                                ]
                        });
                        let searchResultCount = mySearch.runPaged().count;
                        //console.log("customrecord_ht_co_coberturaSearchObj result count", searchResultCount);
                        if (searchResultCount > 0) {
                            response.status = false;
                            response.mensaje = 'Ya existe un producto instalado con esta familia de producto.'
                        }
                    } else if (adp == _constant.Codigo_Valor.COD_VALOR_002_DESINSTALACION_DE_DISP) {
                        if (type != null) {
                            let fam = getParameter(item, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);
                            let producto = getProductoInstalado(bien, fam);
                            //console.log('PRODUCTO', producto);
                            if (producto == 0) {
                                response.status = false;
                                response.mensaje = 'No existe un producto instalado con esta familia de producto del ITEM ' + item + '.'
                            }
                        }

                        if (type == '') {
                            response.status = false;
                            response.mensaje = 'El bien ingresado no cuenta con dispositivo instalado.'
                        }
                    } else if (adp == _constant.Codigo_Valor.COD_VALOR_004_RENOVACION_DE_DISP) {
                        //console.log('resultSet-adp_constant.Codigo_Valor.COD_VALOR_004_RENOVACION_DE_DISP', ` ${adp}`);
                        familia = getParameter(item, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);
                        if (familia > 0) {
                            //!Alquiler comentado por renovación de ALQU
                            let productoInstalado = getProductoInstalado(bien, familia);
                            if (productoInstalado > 0) {
                                let esAlquiler = getParameter(productoInstalado, _constant.Codigo_parametro.COD_ALQ_PRODUCTO_DE_ALQUILER);
                                let alq = getParameter(item, _constant.Codigo_parametro.COD_ALQ_PRODUCTO_DE_ALQUILER);
                                //console.log('resultSet-Reno-Params', `esAlquiler = ${esAlquiler} - alq = ${alq}`);
                                if (esAlquiler != 0 || alq != 0) {
                                    if (esAlquiler != _constant.Codigo_Valor.COD_SI || alq != _constant.Codigo_Valor.COD_SI) {
                                        response.status = false;
                                        response.mensaje = 'Está intentando renovar un producto en alquiler con un artículo de venta o renovar un producto de venta con una artículo de alquiler.'
                                    }
                                }
                            }
                            //console.log('resultSet-Reno-Params', cliente + ' - ' + familia);
                            let sql = "SELECT count(*) FROM TransactionLine tl " +
                                "INNER JOIN customrecord_ht_pp_main_param_prod pa ON pa.custrecord_ht_pp_parametrizacionid = tl.item " +
                                "WHERE custcol_ht_os_tipoarticulo = 'Ensamblaje' AND tl.entity = ? AND pa.custrecord_ht_pp_parametrizacion_valor = ?"
                            let params = [cliente, familia]
                            let resultSet = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
                            //console.log('resultSet-Reno', resultSet);
                            let param = resultSet == 0 ? 0 : 1
                            if (param == 0) {
                                response.status = false;
                                response.mensaje = 'No existe una Orden de Servicio con esta Familia de Producto.'
                            }

                        }
                    } else if (adp == _constant.Codigo_Valor.COD_VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                        if (type != null) {
                            let fam = getParameter(item, _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS);
                            let producto = getProductoInstalado(bien, fam);
                            if (producto == 0) {
                                response.status = false;
                                response.mensaje = 'No existe un producto instalado para la familia del producto ' + item + '.'
                            }
                        }
                        if (type == '') {
                            response.status = false;
                            response.mensaje = 'El bien ingresado no cuenta con dispositivo instalado.'
                        }
                    }
                    break;
                case _constant.Codigo_parametro.COD_PIM_PEDIR_INFORMACION_MEDICA:
                    var item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description' });
                    var item_ficha_medica = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_fichamedica' });
                    if (!item_ficha_medica) {
                        response.status = false;
                        response.mensaje = 'No existe una Ficha Médica para el item ' + item + '.'
                    }
                    break;
                case _constant.Codigo_parametro.COD_CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS:
                    let dispositivoCustodia = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_dispositivo_en_custodia' });
                    if (!dispositivoCustodia) {
                        let item = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                        let objSearch = search.create({
                            type: _constant.customRecord.CUSTODIA,
                            filters: [
                                ["custrecord_ht_ct_cliente", "anyof", currentRecord.getValue('entity')],
                                "AND",
                                ["custrecord_ht_ct_nombredispositivo", "anyof", item]
                            ],
                            columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
                        });
                        let searchResultCount = objSearch.runPaged().count;
                        if (searchResultCount == 0) {
                            let objSearch2 = search.create({
                                type: _constant.customRecord.CUSTODIA,
                                filters: [
                                    ["custrecord_ht_ct_cliente", "anyof", currentRecord.getValue('entity')]
                                ],
                                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
                            });
                            let searchResultCount2 = objSearch2.runPaged().count;
                            if (searchResultCount2 == 0) {
                                response.status = false;
                                response.mensaje = 'No existe un registro de custodia para este cliente.'
                            } else {
                                response.status = true;
                                response.mensaje = 'Existe al menos un registro de custodia que no pertenece al artículo.'
                            }
                        } else {
                            response.status = true;
                        }
                    } else {
                        let objSearch = search.create({
                            type: _constant.customRecord.CUSTODIA,
                            filters: [
                                ["name", "haskeywords", dispositivoCustodia],
                                "AND",
                                ["custrecord_ht_ct_cliente", "anyof", currentRecord.getValue('entity')]
                            ],
                            columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
                        });
                        let searchResultCount = objSearch.runPaged().count;
                        if (searchResultCount == 0) {
                            response.status = false;
                            response.mensaje = 'No existe un registro de custodia para esta serie o no le pertenece a este cliente.'
                        }
                    }
                default:
                    log.debug('accionEstadoOT');
            }
            return response;
        }

        const getinventoryNumber = (comercial) => {
            let serial = "";
            for (let i = 0; i < comercial.length; i++) {
                let type = comercial[i].type;
                if (type == _constant.Constants.COMPONENTE_DISPOSITIVO_ID) {
                    serial = comercial[i].seriales[0].serial;
                }
            }
            return getSerialNumber(serial)
        }

        const getBinNumberAlquiler = (location) => {
            let binSearch = search.create({
                type: "bin",
                filters: [
                    ["location", "anyof", location],
                    "AND",
                    ["custrecord_deposito_para_alquiler", "is", "T"]
                ],
                columns: ["binnumber"]
            }).run().getRange(0, 1);
            if (binSearch.length) return binSearch[0].id;
            return "";
        }

        const getBinNumberComercial = (location) => {
            let binSearch = search.create({
                type: "bin",
                filters: [
                    ["location", "anyof", location],
                    "AND",
                    ["custrecord_deposito_para_bodega_comercia", "is", "T"]
                ],
                columns: ["binnumber"]
            }).run().getRange(0, 1);
            if (binSearch.length) return binSearch[0].id;
            return "";
        }

        const getBinNumberCustodia = (location, flujo = 0) => {
            let ubicacion = location;
            // if (flujo == _constant.Constants.FLUJO_CUSTODIA) {
            //     let objSearch = search.create({
            //         type: "location",
            //         filters:
            //             [
            //                 ["custrecord_ht_ub_ubicacioncustodia", "is", "T"],
            //                 "AND",
            //                 ["custrecord_ht_ubicacion_padre", "anyof", ubicacion]
            //             ],
            //         columns:
            //             [
            //                 search.createColumn({ name: "internalid", label: "Internal ID" }),
            //             ]
            //     });
            //     let searchResultCount = objSearch.runPaged().count;
            //     if (searchResultCount > 0) {
            //         objSearch.run().each(result => {
            //             ubicacion = result.getValue({ name: "internalid", label: "Internal ID" });
            //             return true;
            //         });
            //     }
            // }

            let binSearch = search.create({
                type: _constant.Transaction.BIN,
                filters: [
                    ["location", "anyof", ubicacion],
                    "AND",
                    ["custrecord_deposito_para_custodia", "is", "T"]
                ],
                columns: ["binnumber"]
            }).run().getRange(0, 1);
            if (binSearch.length) return binSearch[0].id;
            return "";
        }

        const getBinNumberRevision = (location) => {
            let binSearch = search.create({
                type: _constant.Transaction.BIN,
                filters: [
                    ["location", "anyof", location],
                    "AND",
                    ["custrecord_ht_deposito_para_revision", "is", "T"]
                ],
                columns: ["binnumber"]
            }).run().getRange(0, 1);
            if (binSearch.length) return binSearch[0].id;
            return "";
        }

        const getBinConvenio = (location, convenio) => {
            let binSearch = search.create({
                type: _constant.Transaction.BIN,
                filters: [
                    ["location", "anyof", location],
                    "AND",
                    ["custrecord_ht_bin_para_convenio", "is", "T"],
                    "AND",
                    ["custrecord_ht_bin_convenio", "anyof", convenio]
                ],
                columns: ["binnumber"]
            }).run().getRange(0, 1);
            if (binSearch.length) return binSearch[0].id;
            return "";
        }

        const getInstall = (objParameters) => {
            let productId = 0;
            let productInstall = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_numeroserieproducto", "anyof", objParameters.serieChaser],
                        "AND",
                        ["custrecord_ht_co_bien", "anyof", objParameters.bien],
                        "AND",
                        ["custrecord_ht_co_estado", "anyof", _constant.StatusPE.INSTALADO]
                    ],
                columns:
                    [
                        'custrecord_ht_co_producto',
                    ]
            });
            let resultCount = productInstall.runPaged().count;
            if (resultCount > 0) {
                productInstall.run().each(result => {
                    productId = result.getValue({ name: "custrecord_ht_co_producto" });
                    return true;
                });
            }
            return productId;
        }

        const getInstallDevice = (objParameters) => {
            let productId = 0;
            let productInstall = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_numeroserieproducto", "anyof", objParameters.serieChaser],
                        "AND",
                        ["custrecord_ht_co_bien", "anyof", objParameters.bien],
                    ],
                columns:
                    [
                        'internalid'
                    ]
            });
            let resultCount = productInstall.runPaged().count;
            if (resultCount > 0) {
                productInstall.run().each(result => {
                    productId = result.getValue({ name: "custrecord_ht_co_producto" });
                    return true;
                });
            }
            return productId;
        }

        const createInventoryAdjustmentIngreso = (scriptParameters, objParams = 0, tipoFlujo = 0) => {
            log.debug('Controller - scriptParameters', scriptParameters);
            log.debug('Controller - tipoFlujo', tipoFlujo);
            let binNumber, account, unitCost, flujo, item, location, customRecord, field, columns, memo;
            let sql = 'SELECT custrecord_ht_cuenta_activo_fijo_transit FROM subsidiary WHERE id = ?';
            let result = query.runSuiteQL({ query: sql, params: [scriptParameters.subsidiary] }).asMappedResults();
            let sqlGetCuentaCustodia = 'SELECT custrecord_ht_cuenta_de_custodia FROM subsidiary WHERE id = ?';
            let resultGetCuentaCustodia = query.runSuiteQL({ query: sqlGetCuentaCustodia, params: [scriptParameters.subsidiary] }).asMappedResults();
            let sqlGetCuentaGarantia = 'SELECT custrecord_ht_cuenta_de_garantia FROM subsidiary WHERE id = ?';
            let resultGetCuentaGarantia = query.runSuiteQL({ query: sqlGetCuentaGarantia, params: [scriptParameters.subsidiary] }).asMappedResults();

            //^Alquiler
            if (tipoFlujo == 0) {
                binNumber = getBinNumberAlquiler(scriptParameters.location);
                account = result[0].custrecord_ht_cuenta_activo_fijo_transit;
                unitCost = 0;
                memo = 'Ajuste de ingreso por alquiler.';
                flujo = 'custbody_ht_ai_paraalquiler';
                location = scriptParameters.location;
                if (scriptParameters.tag == _constant.Codigo_Valor.COD_VALOR_LOJ_LOJACK) {
                    customRecord = 'customrecord_ht_record_detallechaslojack'
                    field = 'custrecord_ht_cl_lojack'
                    columns = [search.createColumn({ name: field })];
                } else {
                    customRecord = 'customrecord_ht_record_detallechaserdisp'
                    field = 'custrecord_ht_dd_dispositivo'
                    columns = [search.createColumn({ name: field })];
                }

                let busqueda = search.create({
                    type: customRecord,
                    filters:
                        [["name", "startswith", scriptParameters.comercial]],
                    columns: columns
                });

                busqueda.run().each((result) => {
                    item = result.getValue({ name: field });
                    return true;
                });
            }

            //^Convenio
            if (tipoFlujo == 1) {
                // binNumber = getBinNumberComercial(scriptParameters.location);
                binNumber = objParams.binNumber;
                account = objParams.account;
                unitCost = parseFloat(objParams.costo);
                item = scriptParameters.item;
                flujo = 'custbody_ht_ai_porconvenio';
                location = scriptParameters.location;
                memo = 'Ajuste de ingreso por convenio.'
            }

            //^Custodia
            if (tipoFlujo == 2) {
                let ubicacion = 0;
                binNumber = scriptParameters.deposito;
                account = resultGetCuentaCustodia[0].custrecord_ht_cuenta_de_custodia;
                unitCost = 0;
                flujo = 'custbody_ht_ai_custodia';
                location = scriptParameters.location;
                item = scriptParameters.dispositivo;
                memo = 'Ajuste de ingreso por custodia.'
            }

            //^Garantía
            if (tipoFlujo == 3) {
                binNumber = scriptParameters.deposito;
                account = resultGetCuentaGarantia[0].custrecord_ht_cuenta_de_garantia;;
                unitCost = 0;
                item = scriptParameters.dispositivo;
                flujo = 'custbody_ai_por_garantia';
                location = scriptParameters.location;
                memo = 'Ajuste de ingreso por garantía.'
            }

            log.debug('Controller - createInventoryAdjustmentIngreso.account', account);
            log.debug('Controller - createInventoryAdjustmentIngreso.binNumber', binNumber);
            log.debug('Controller - createInventoryAdjustmentIngreso.customRecord', customRecord);
            log.debug('Controller - createInventoryAdjustmentIngreso.item', item);
            log.debug('Controller - createInventoryAdjustmentIngreso.location', location);
            let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
            newAdjust.setValue({ fieldId: 'subsidiary', value: scriptParameters.subsidiary });
            newAdjust.setValue({ fieldId: 'account', value: account });
            newAdjust.setValue({ fieldId: 'adjlocation', value: location });
            newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.recipientId });
            newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
            newAdjust.setValue({ fieldId: 'memo', value: memo });
            newAdjust.setValue({ fieldId: flujo, value: scriptParameters.boleano });

            newAdjust.selectNewLine({ sublistId: 'inventory' });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item });
            //newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: scriptParameters.dispositivo });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: location });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: 1 });
            newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: unitCost });

            let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
            newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: scriptParameters.comercial });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binNumber });
            newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });
            newDetail.commitLine({ sublistId: 'inventoryassignment' });
            newAdjust.commitLine({ sublistId: 'inventory' });

            let newRecord = newAdjust.save({ enableSourcing: false, ignoreMandatoryFields: true });
            log.error("Controller - newRecord", newRecord);
            return newRecord;
        }

        const updateHistorialAF = (objParameters) => {
            let historialId = 0;
            let activoFijo = 0;
            let historialAF = search.create({
                type: "customrecord_ht_record_historialsegui",
                filters:
                    [
                        ["custrecord_ht_af_enlace.custrecord_assetserialno", "startswith", objParameters.comercial],
                        "AND",
                        ["custrecord_ht_hs_vidvehiculo", "startswith", objParameters.bien],
                        "AND",
                        ["custrecord_ht_hs_estado", "anyof", _constant.StatusPE.INSTALADO]
                    ],
                columns:
                    [
                        'internalid',
                        'custrecord_ht_af_enlace'
                    ]
            });
            let resultCount = historialAF.runPaged().count;
            if (resultCount > 0) {
                historialAF.run().each(result => {
                    historialId = result.getValue({ name: "internalid" });
                    activoFijo = result.getValue({ name: "custrecord_ht_af_enlace" });
                    return true;
                });

                let dateNow = getDateNow();
                log.debug('dateNow', dateNow)
                record.submitFields({
                    type: 'customrecord_ht_record_historialsegui',
                    id: historialId,
                    values: {
                        'custrecord_ht_hs_numeroordenserviciodes': objParameters.salesorder,
                        'custrecord_ht_hs_fechaordenserviciodes': new Date(dateNow),
                        'custrecord_ht_hs_estado': _constant.StatusPE.DESINSTALADO
                    },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
            }
            try {
                historialId = record.submitFields({
                    type: 'customrecord_ncfar_asset',
                    id: activoFijo,
                    values: { 'custrecord_ht_alquilado': false },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
            } catch (error) { }
            return historialId;
        }

        const historialInstall = (installId, objParameters) => {
            log.debug('objParameters', JSON.stringify(objParameters))
            let count = verifyExistHistorial(objParameters.salesorder, objParameters.ordentrabajoId, _constant.Status.DEVOLUCION);
            log.debug('Count', count)
            if (count == 0) {
                let objRecord = record.create({ type: 'customrecord_ht_ct_cobertura_transaction', isDynamic: true });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_transacciones', value: installId });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_orden_servicio', value: objParameters.salesorder });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_orden_trabajo', value: objParameters.ordentrabajoId });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_concepto', value: _constant.Status.DEVOLUCION });
                let savehistorialInstall = objRecord.save();
                log.debug('savehistorialInstall', savehistorialInstall)
            }
        }

        const verifyExistHistorial = (salesorder, ordentrabajo, concepto) => {
            let objSearch = search.create({
                type: "customrecord_ht_ct_cobertura_transaction",
                filters:
                    [
                        ["custrecord_ht_ct_orden_servicio", "anyof", salesorder],
                        "AND",
                        ["custrecord_ht_ct_orden_trabajo", "anyof", ordentrabajo],
                        "AND",
                        ["custrecord_ht_ct_concepto", "anyof", concepto]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            return searchResultCount;
        }

        const updateInstall = (objParameters) => {
            log.debug('updateInstall', objParameters)
            let installId = 0;
            let instalado;
            let desinstalado;
            let dañado;
            let perdido;

            if (objParameters.subsidiary == _constant.Constants.ECUADOR_SUBSIDIARY) {
                instalado = _constant.Status.INSTALADO;
                desinstalado = _constant.Status.DESINSTALADO;
                dañado = _constant.Status.DANADO;
                perdido = _constant.Status.PERDIDO;
            } else if (objParameters.subsidiary == _constant.Constants.PERU_SUBSIDIARY) {
                instalado = _constant.StatusPE.INSTALADO;
                desinstalado = _constant.StatusPE.DESINSTALADO;
                dañado = _constant.StatusPE.DANADO;
                perdido = _constant.StatusPE.PERDIDO;
            }

            let productInstall = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_numeroserieproducto", "anyof", objParameters.serieChaser],
                        "AND",
                        ["custrecord_ht_co_bien", "anyof", objParameters.bien],
                        "AND",
                        ["custrecord_ht_co_estado", "noneof", desinstalado]
                    ],
                columns:
                    ['internalid']
            });
            let resultCount = productInstall.runPaged().count;
            if (resultCount > 0) {
                productInstall.run().each(result => {
                    installId = result.getValue({ name: "internalid" });
                    return true;
                });
                log.debug('installId', installId);
                log.debug('estado', objParameters.estado);
                let updateRec = record.load({ type: 'customrecord_ht_co_cobertura', id: installId, isDynamic: true });

                if ((objParameters.estado == dañado || objParameters.estado == perdido || objParameters.estado == desinstalado)) {
                    log.debug('estadoInfra', objParameters.estado);
                    // updateRec.setValue({ fieldId: 'custrecord_ht_co_producto', value: objParameters.item });
                    updateRec.setValue({ fieldId: 'custrecord_ht_co_estado', value: desinstalado });
                    updateRec.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: _constant.Status.SIN_DISPOSITIVO });
                    historialInstall(installId, objParameters)
                } else if (objParameters.estado == instalado) { }

                if (objParameters.t_PPS == true) {
                    updateRec.setValue({ fieldId: 'custrecord_ht_co_estado_cobertura', value: _constant.Status.SIN_DISPOSITIVO });
                }
                let updaetIns = updateRec.save();
                log.debug('ConfirmaciónActualizacióndeCobertura', updaetIns)
            }
            return installId;
        }

        const updateOrdenTrabajo = (ordentrabajoid, taller, chaser, serieDispositivo, serieSimCard) => {
            let updateRecord = record.submitFields({
                type: _constant.customRecord.ORDEN_TRABAJO,
                id: ordentrabajoid,
                values: {
                    // 'custrecord_ht_ot_estado': _constant.Status.CHEQUEADO,
                    'custrecord_ht_ot_taller': taller,
                    'custrecord_ht_ot_serieproductoasignacion': chaser,
                    'custrecord_ht_ot_dispositivo': serieDispositivo,
                    'custrecord_ht_ot_simcard': serieSimCard,
                    'custrecord_ht_ot_estadochaser': _constant.Status.INSTALADO,
                    'custrecord_ht_ot_motivos': _constant.Constants.CONVENIO,
                    'custrecord_flujo_de_convenio': true
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            return updateRecord;
        }

        const createChaser = (bien, vid, arrayTypes, arrayComponents) => {
            log.debug('ArrayComponents', arrayComponents)
            try {
                let objRecordCreate = record.create({ type: _constant.customRecord.CHASER, isDynamic: true });
                for (let i = 0; i < arrayTypes.length; i++) {
                    //let item = objRecord.getSublistValue({ sublistId: 'component', fieldId: 'item', line: i });
                    //let quantity = objRecord.getSublistValue({ sublistId: 'component', fieldId: 'quantity', line: i });
                    // let fieldLookUp = search.lookupFields({ type: 'serializedinventoryitem', id: arrayComponents[i], columns: ['custitem_ht_ai_tipocomponente'] });
                    let tipeItmes = arrayTypes[i]
                    // if (Object.keys(fieldLookUp).length != 0) {
                    //     if (fieldLookUp.custitem_ht_ai_tipocomponente.length != 0) {
                    //         tipeItmes = fieldLookUp.custitem_ht_ai_tipocomponente[0].value;
                    //     }
                    // }

                    //log.debug('tipeItmes', tipeItmes)
                    if (tipeItmes == 1) {
                        //log.debug('tipeItmesEntry', tipeItmes)
                        let chaser = getInventorynumber(arrayComponents, i, tipeItmes);
                        chaser.pageRanges.forEach(pageRange => {
                            page = chaser.fetch({ index: pageRange.index });
                            page.data.forEach(result => {
                                let columns = result.columns;
                                // log.debug('ChaserdResultColumns', columns);
                                // log.debug('custrecord_ht_mc_seriedispositivo', result.getValue(columns[1]));
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivo', value: result.getValue(columns[0]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[12]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_modelo', value: result.getValue(columns[4]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_unidad', value: result.getValue(columns[3]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_imei', value: result.getValue(columns[6]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_firmware', value: result.getValue(columns[7]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_script', value: result.getValue(columns[8]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_servidor', value: result.getValue(columns[9]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vid', value: vid, ignoreFieldChange: true });
                                //objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estado', value: _constant.Status.INSTALADO, ignoreFieldChange: true });
                                //TODO: ACTIVAR DE RETIRAR EL CAMPO Y VALIDAR FLUJO
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estadolodispositivo', value: _constant.Status.INSTALADO, ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_tipodispositivo', value: result.getValue(columns[11]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_vehiculo', value: bien, ignoreFieldChange: true });
                            });
                        });
                    }

                    if (tipeItmes == 2) {
                        //log.debug('tipeItmesEntry', tipeItmes)
                        let Simcard = getInventorynumber(arrayComponents, i, tipeItmes);
                        Simcard.pageRanges.forEach(pageRange => {
                            page = Simcard.fetch({ index: pageRange.index });
                            page.data.forEach(result => {
                                let columns = result.columns;
                                //log.debug('SimcardResultColumns', columns);
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_celularsimcard', value: result.getValue(columns[0]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_nocelularsim', value: result.getValue(columns[7]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_ip', value: result.getValue(columns[5]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_apn', value: result.getValue(columns[6]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_operadora', value: result.getValue(columns[4]), ignoreFieldChange: true });
                            });
                        });
                    }

                    if (tipeItmes == 3) {
                        //log.debug('tipeItmesEntry', tipeItmes)
                        let lojack = getInventorynumber(arrayComponents, i, tipeItmes);
                        lojack.pageRanges.forEach(pageRange => {
                            page = lojack.fetch({ index: pageRange.index });
                            page.data.forEach(result => {
                                let columns = result.columns;
                                //log.debug('LojackdResultColumns', columns);
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigoactivacion', value: result.getValue(columns[2]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_codigorespuesta', value: result.getValue(columns[3]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_estadolojack', value: result.getValue(columns[4]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_seriedispositivolojack', value: result.getValue(columns[0]), ignoreFieldChange: true });
                                objRecordCreate.setValue({ fieldId: 'name', value: result.getValue(columns[5]), ignoreFieldChange: true });
                            });
                        });
                    }
                }
                //objRecordCreate.setValue({ fieldId: 'custrecord_ht_mc_enlace', value: id, ignoreFieldChange: true });//^Activar solo si viene de Work Order
                let recordId = objRecordCreate.save({ enableSourcing: false, ignoreMandatoryFields: false });
                return recordId;
            } catch (error) {
                log.error('Error-CreateChaser', error);
                return 0;
            }

        }

        const getInventorynumber = (arrayComponents, i, tipeItmes) => {
            log.debug('getInventorynumber', 'Entré a getInventorynumber')
            let tipoItmesText;
            let customRecord;
            let columns;
            let estadoColumna = 0;
            switch (tipeItmes) {
                case '1':
                    tipoItmesText = "custrecord_ht_dd_item";
                    customRecord = "customrecord_ht_record_detallechaserdisp";
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_dd_dispositivo", label: "dd_dispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_item", label: "dd_item" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispositivo", label: "dd_tipodispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_modelodispositivo", label: "dd_modelodispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_macaddress", label: "dd_macaddress" }),
                        search.createColumn({ name: "custrecord_ht_dd_imei", label: "dd_imei" }),
                        search.createColumn({ name: "custrecord_ht_dd_firmware", label: "dd_firmware" }),
                        search.createColumn({ name: "custrecord_ht_dd_script", label: "dd_script" }),
                        search.createColumn({ name: "custrecord_ht_dd_servidor", label: "dd_servidor" }),
                        search.createColumn({ name: "custrecord_ht_dd_estado", label: "dd_estado" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispocha", label: "dd_tipodispocha" }),
                        search.createColumn({ name: "name", label: "name" })
                    ];
                    break;
                case '2':
                    tipoItmesText = "custrecord_ht_ds_serie";
                    customRecord = "customrecord_ht_record_detallechasersim";
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_ds_simcard", label: "ds_simcard" }),
                        search.createColumn({ name: "custrecord_ht_ds_serie", label: "ds_serie" }),
                        search.createColumn({ name: "custrecord_ht_ds_tiposimcard", label: "ds_tiposimcard" }),
                        search.createColumn({ name: "custrecord_ht_ds_operadora", label: "ds_operadora" }),
                        search.createColumn({ name: "custrecord_ht_ds_ip", label: "ds_ip" }),
                        search.createColumn({ name: "custrecord_ht_ds_apn", label: "ds_apn" }),
                        search.createColumn({ name: "custrecord_ht_ds_numerocelsim", label: "ds_numerocelsim" }),
                        search.createColumn({ name: "custrecord_ht_ds_estado", label: "ds_estado" })
                    ];
                    break;
                case '3':
                    tipoItmesText = "custrecord_ht_cl_seriebox";
                    customRecord = "customrecord_ht_record_detallechaslojack";
                    estadoColumna = 4;
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_cl_seriebox", label: "cl_seriebox" }),
                        search.createColumn({ name: "custrecord_ht_cl_activacion", label: "cl_activacion" }),
                        search.createColumn({ name: "custrecord_ht_cl_respuesta", label: "cl_respuesta" }),
                        search.createColumn({ name: "custrecord_ht_cl_estado", label: "cl_estado" }),
                        search.createColumn({ name: "name", label: "name" }),
                    ];
                    break;
                default:
                    break;
            }

            // let invDetailRec = objRecord.getSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail', line: i });
            // let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });

            // for (let j = 0; j < arrayParams.length; j++) {
            // let inventorynumber = invDetailRec.getSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', line: j });
            let inventorynumber = arrayComponents[i];
            //log.debug('Records', customRecord + ' - ' + tipoItmesText + ' - ' + inventorynumber);
            let busqueda = search.create({
                type: customRecord,
                filters:
                    [
                        ["internalid", "anyof", inventorynumber]
                    ],
                columns: columns
            });
            let pageData = busqueda.runPaged({ pageSize: 1000 });
            // let objResults = busqueda.run().getRange({ start: 0, end: 1 });
            // log.debug('pageData', objResults);
            return pageData;
            // }
        }

        const createInventoryAdjustmentSalida = (scriptParameters) => {
            log.debug('scriptParameters', scriptParameters);
            let newAdjust = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
            newAdjust.setValue({ fieldId: 'subsidiary', value: _constant.Constants.ECUADOR_SUBSIDIARY });
            newAdjust.setValue({ fieldId: 'adjlocation', value: scriptParameters.location });
            newAdjust.setValue({ fieldId: 'customer', value: scriptParameters.recipientId });
            newAdjust.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: scriptParameters.salesorder });
            newAdjust.setValue({ fieldId: 'custbody_ht_ai_porconvenio', value: scriptParameters.boleano });
            //log.debug('account', objParams.account);
            let objParams = setItemstoInventoryAdjustment(newAdjust, scriptParameters, scriptParameters.comercial, scriptParameters.sim);
            //log.debug('account2', objParams.account);
            newAdjust.setValue({ fieldId: 'account', value: objParams.account });
            let newRecord = newAdjust.save();
            //log.error("newRecord", newRecord);
            return objParams;
        }

        const setItemstoInventoryAdjustment = (newAdjust, scriptParameters, disp, sim) => {
            let arrayCosto = new Array()
            let serie = 0;
            let suma = 0;
            let deviceBillOfMaterials = getDeviceBillofMaterials(disp);
            log.debug('deviceBillOfMaterials', deviceBillOfMaterials);
            let simBillOfMaterials = getSimBillofMaterials(sim);
            log.debug('simBillOfMaterials', simBillOfMaterials);
            let arrayComponents = getComponents(scriptParameters.item, scriptParameters.location);
            let account = arrayComponents[0][4];
            let binNumber = arrayComponents[0][3]
            log.debug('ArrayComponents', arrayComponents);
            log.debug('ARRAYYYY', disp + ' - ' + sim);
            for (let i = 0; i < arrayComponents.length; i++) {
                let item = arrayComponents[i][2];
                //log.debug('ITEMMMMM', arrayComponents[i][0].length + ' > ' + 0 + ' && ' + item + ' == ' + scriptParameters.item);
                if (arrayComponents[i][0].length > 0 && (item == deviceBillOfMaterials || item == simBillOfMaterials)) {
                    newAdjust.selectNewLine({ sublistId: 'inventory' });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: scriptParameters.location });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: -1 });
                    newAdjust.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'unitcost', value: arrayComponents[i][0] });

                    let newDetail = newAdjust.getCurrentSublistSubrecord({ sublistId: 'inventory', fieldId: 'inventorydetail' });
                    newDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                    if (arrayComponents[i][1] != "4") {
                        if (arrayComponents[i][1] == 1 || arrayComponents[i][1] == 3)
                            serie = getSerie(disp)
                        if (arrayComponents[i][1] == 2)
                            serie = getSerie(sim)
                        // if (arrayComponents[i][1] == 3)
                        //     serie = getSerie(disp)

                        log.debug('SERIE', item + ' - ' + serie + ' - ' + arrayComponents[i][1]);
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: serie }); //8959300110505600000 //	1128192493
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: arrayComponents[i][3] });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });
                    } else {
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: arrayComponents[i][3] });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'status', value: 1 });
                        newDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: -1 });
                    }
                    newDetail.commitLine({ sublistId: 'inventoryassignment' });
                    newAdjust.commitLine({ sublistId: 'inventory' });
                    suma += parseFloat(arrayComponents[i][0])
                    log.debug('SUMA', suma);
                }
            }

            return {
                account: account,
                binNumber: binNumber,
                costo: suma
            }
        }

        const createRegistroCustodia = (objParams) => {
            let newCustodia = 0;
            let objSearch = search.create({
                type: _constant.customRecord.CUSTODIA,
                filters: [
                    ["name", "haskeywords", objParams.comercial],
                    "AND",
                    ["custrecord_ht_ct_cliente", "anyof", objParams.recipientId]
                ],
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
            });
            let searchResultCount = objSearch.runPaged().count;
            log.debug('¿Existe ya una custodia?', searchResultCount);
            //Obtener Cobertura 14/08/2024
            let CoberturaId = 0;
            let Coberturaproducto = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_numeroserieproducto", "anyof", objParams.serieChaser],
                        "AND",
                        ["custrecord_ht_co_bien", "anyof", objParams.bien]
                    ],
                columns:
                    ['internalid']
            });
            Coberturaproducto.run().each(result => {
                CoberturaId = result.getValue({ name: "internalid" });
                return true;
            });
            log.debug('CoberturaId', CoberturaId);
            //Obtener Cobertura 14/08/2024
            if (searchResultCount == 0) {
                const objRecord = record.create({ type: _constant.customRecord.CUSTODIA, isDynamic: true });
                objRecord.setValue({ fieldId: 'name', value: objParams.comercial });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_cliente', value: objParams.recipientId });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_nombredispositivo', value: objParams.dispositivo });
                //objRecord.setValue({ fieldId: 'custrecord_ht_ct_nombredispositivo', value: objParams.item });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_ubicacion', value: objParams.location });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_deposito', value: objParams.deposito });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_estado', value: _constant.Status.DESINSTALADO });
                //objRecord.setValue({ fieldId: 'custrecord_ht_ct_venta', value: 42857 });
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_familia', value: objParams.familia });
                //Agregando Cobertura 14/08/2024
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_cobertura', value: CoberturaId });
                //Agregando Cobertura 14/08/2024
                //& <I> dfernandez | 12/08/2025
                objRecord.setValue({ fieldId: 'custrecord_ht_ct_vehiculo', value: objParams.bien });
                //& <F> dfernandez | 12/08/2025
                newCustodia = objRecord.save({ ignoreMandatoryFields: false });
            }
            return newCustodia;
        }

        const deleteRegistroCustodia = (objParams) => {
            //log.debug('objParams', objParams)
            let registroCustodia = 0
            let objSearch = search.create({
                type: _constant.customRecord.CUSTODIA,
                filters: [["name", "haskeywords", objParams.comercial]],
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
            });
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0) {
                objSearch.run().each(result => {
                    registroCustodia = result.getValue({ name: "internalid", label: "Internal ID" });
                    return true;
                });

                // record.submitFields({
                //     type: _constant.customRecord.CUSTODIA,
                //     id: registroCustodia,
                //     values: {
                //         'isinactive': true
                //         // 'custrecord_ht_ct_estado': _constant.Status.INSTALADO,
                //         // 'custrecord_ht_ct_vehiculo': objParams.bien
                //     },
                //     options: { enableSourcing: false, ignoreMandatoryFields: true }
                // });

                let deleteRecordPromise = record.delete.promise({
                    type: _constant.customRecord.CUSTODIA,
                    id: registroCustodia
                });
                deleteRecordPromise.then(() => {
                    log.debug('Success', 'Custodia Record successfully deleted');
                }, (error) => {
                    log.error('Ocurrió un error al elimianr el registro de custodia', error);
                });
            }
            // return registroCustodia;
        }

        const verifyExistHistorialAF = (objParameters) => {
            let historialAF = search.create({
                type: "customrecord_ht_record_historialsegui",
                filters:
                    [
                        ["custrecord_ht_hs_numeroordenservicio", "anyof", objParameters.salesorder],
                        "AND",
                        ["custrecord_ht_hs_vidvehiculo", "startswith", objParameters.bien],
                    ],
                columns:
                    ['internalid']
            });
            return historialAF;
        }

        //! QUERIES =======================================================================================================================================================
        const getTaxes = (tax) => {
            let lookUpTaxCode = search.lookupFields({ type: search.Type.SALES_TAX_ITEM, id: tax, columns: ['internalid', 'rate'] });
            let taxcode = lookUpTaxCode.internalid[0].value;
            let taxrate = lookUpTaxCode.rate;
            taxrate = taxrate.replace('%', '');
            return { 'taxcode': taxcode, 'taxrate': taxrate }
        }

        const getGood = (good, customer) => {
            let objSearch = search.load({ id: _constant.Constants.SEARCHS.SEARCH_FOR_GOOD });
            let filters = objSearch.filters;
            const goodFilter = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: good });
            const customerFilter = search.createFilter({ name: 'custrecord_ht_bien_propietario', operator: search.Operator.ANYOF, values: customer });
            filters.push(goodFilter);
            filters.push(customerFilter);
            let resultCount = objSearch.runPaged().count;
            return resultCount;
        }

        const getServiceOrder = (transaction) => {
            let objSearch = search.load({ id: _constant.Constants.SEARCHS.TRANSACTION_SEARCH });
            let filters = objSearch.filters;
            const typeFilter = search.createFilter({ name: 'type', operator: search.Operator.ANYOF, values: 'SalesOrd' });
            const transactionFilter = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: transaction });
            const statusFilter = search.createFilter({ name: 'status', operator: search.Operator.NONEOF, values: ["SalesOrd:C", "SalesOrd:H", "SalesOrd:D", "SalesOrd:G"] });
            const mainlineFilter = search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: 'T' });
            filters.push(typeFilter);
            filters.push(transactionFilter);
            filters.push(statusFilter);
            filters.push(mainlineFilter);
            let resultCount = objSearch.runPaged().count;
            let result = objSearch.run().getRange({ start: 0, end: 100 });
            log.debug('Result', result);
            return resultCount;
        }

        const getCostProvision = (fecha, nota) => {
            let objResults = 0;
            const objTotal = search.load({ id: _constant.Constants.SEARCHS.COST_PROVISION_SEARCH });
            const searchResultCount = objTotal.runPaged().count;
            if (searchResultCount > 0) {
                objResults = objTotal.run().getRange({ start: 0, end: 500 });
                log.debug('objResults', objResults);
                const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
                objRecord.setValue({ fieldId: 'trandate', value: new Date(fecha) });
                objRecord.setValue({ fieldId: 'memo', value: nota });
                objRecord.setValue({ fieldId: 'subsidiary', value: 2 });
                for (let i in objResults) {
                    const location = objResults[i].getValue({ name: "location", summary: "GROUP" });
                    const costAccount = objResults[i].getValue({ name: "custcol_ht_so_cost_account", summary: "GROUP" });
                    const inventoryAccount = objResults[i].getValue({ name: "custcol_ht_so_inventory_account", summary: "GROUP" });
                    const provision = objResults[i].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
                    objRecord.selectNewLine({ sublistId: 'line' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: costAccount, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: provision, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                    objRecord.commitLine({ sublistId: 'line' });

                    objRecord.selectNewLine({ sublistId: 'line' });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: inventoryAccount, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: provision, ignoreFieldChange: false });
                    objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                    objRecord.commitLine({ sublistId: 'line' });
                }
                objResults = objRecord.save({ ignoreMandatoryFields: false });
            }
            return objResults;
        }

        const getProvisionDetail = () => {
            let json = new Array();
            let searchResult;
            let start = 0;
            let end = 1000;
            let size = 1000;
            //const date = new Date('2023-2-1'); //!Elegir fecha
            const date = new Date();
            const ultimoDia = new Date(date.getFullYear(), date.getMonth(), 0);
            const nota = 'Provisión Abril'
            log.debug('ultimoDiaTimeZona', ultimoDia);
            let journal = getCostProvision(ultimoDia, nota);
            if (journal != 0) {
                const objSearch = search.load({ id: _constant.Constants.SEARCHS.COST_PROVISION_DETAIL_SEARCH });
                const searchResultCount = objSearch.runPaged().count;
                log.debug('Count', searchResultCount);
                let division = searchResultCount / size;
                let laps = Math.round(division);
                if (division > laps) {
                    laps = laps + 1
                }
                for (let i = 1; i <= laps; i++) {
                    if (i != laps) {
                        searchResult = objSearch.run().getRange({ start: start, end: end });
                    } else {
                        searchResult = objSearch.run().getRange({ start: start, end: searchResultCount });
                    }

                    for (let j in searchResult) {
                        const internalid = searchResult[j].getValue({ name: "internalid", summary: "GROUP" });
                        const item = searchResult[j].getValue({ name: "item", summary: "GROUP" });
                        const costAccount = objResults[i].getValue({ name: "custcol_ht_so_cost_account", summary: "GROUP" });
                        const inventoryAccount = objResults[i].getValue({ name: "custcol_ht_so_inventory_account", summary: "GROUP" });
                        const provision = searchResult[j].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
                        json.push([journal, internalid, item, costAccount, inventoryAccount, 0, provision]);
                    }
                    start = start + size;
                    end = end + size;
                }
                return json;
            } else {
                return 0;
            }
        }

        const getAccountPaymentMethod = (paymentMethod) => {
            let mySearch = search.create({
                type: "customrecord_ht_cuentas_nrocuotas",
                filters:
                    [
                        ["custrecord_ht_cc_paymentmethod", "anyof", paymentMethod]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_cc_paymentmethod",
                            summary: "GROUP",
                            label: "Payment Method"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_cc_cuenta",
                            summary: "GROUP",
                            label: "Cuenta"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_cc_cuota",
                            summary: "GROUP",
                            label: "Cuota"
                        })
                    ]
            });
            mySearch.run().each(result => {
                let entity = result.getValue({ name: 'entity' });
                return true;
            });

            /*
            customrecord_ht_cuentas_nrocuotasSearchObj.id="customsearch1688534783904";
            customrecord_ht_cuentas_nrocuotasSearchObj.title="Cuentas y Nro Cuotas Search - DEVELOPER (copy)";
            var newSearchId = customrecord_ht_cuentas_nrocuotasSearchObj.save();
            */
        }

        const getCobertura = (id) => {
            let arrayCobertura = [];
            let busqueda = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_bien", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_co_producto", label: "HT CO PRODUCTO" })//producto de la cobertura
                    ]
            });
            let savedsearch = busqueda.run().getRange(0, 100);
            let internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    arrayCobertura.push(internalid);
                    return true;
                });
            }
            return arrayCobertura;
        }

        const parametrizacionJson = (items) => {
            let parametrizacionResult = {};
            let searchResult = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters: [
                    ["custrecord_ht_pp_aplicacion", "is", "T"],
                    "AND",
                    ["custrecord_ht_pp_parametrizacionid", "anyof", items]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela" }),
                    search.createColumn({ name: "custrecord_ht_pp_code", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_RELA" }),
                    search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor" }),
                    search.createColumn({ name: "custrecord_ht_pp_codigo", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_VALOR" })
                ]
            });
            let resultCount = searchResult.runPaged().count;
            if (resultCount > 0) {
                let pageData = searchResult.runPaged({ pageSize: 1000 });
                pageData.pageRanges.forEach(pageRange => {
                    let page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        let columns = result.columns;
                        let idParametrizacion = result.getValue(columns[0]);
                        let codigoParametrizacion = result.getValue(columns[1]);
                        let idValor = result.getValue(columns[2]);
                        let codigoValor = result.getValue(columns[3]);

                        if (!codigoParametrizacion) return;

                        parametrizacionResult[codigoParametrizacion] = {
                            parametrizacion: codigoParametrizacion,
                            valor: codigoValor,
                            idValor,
                            idParametrizacion
                        }
                    });
                });
            }

            return parametrizacionResult;
        }

        const parametrizacion = (items) => {
            let arr = new Array();
            let busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        search.createFilter({ name: 'custrecord_ht_pp_aplicacion', operator: search.Operator.IS, values: true }),
                        search.createFilter({ name: 'custrecord_ht_pp_parametrizacionid', operator: search.Operator.ANYOF, values: items })
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Param" }),
                        search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" }),
                        search.createColumn({ name: "custrecord_ht_pp_code", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_RELA", label: "Código" }),
                        search.createColumn({ name: "custrecord_ht_pp_codigo", join: "CUSTRECORD_HT_PP_PARAMETRIZACION_VALOR", label: "Código" })
                    ]
            });

            //console.log(busqueda)
            let resultCount = busqueda.runPaged().count;
            //log.debug('COUNTTTTTTTTTTTTT', resultCount);
            if (resultCount > 0) {
                let pageData = busqueda.runPaged({ pageSize: 1000 });
                pageData.pageRanges.forEach(pageRange => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        let columns = result.columns;
                        let parametrizacion = new Array();
                        result.getValue(columns[0]) != null ? parametrizacion[0] = result.getValue(columns[0]) : parametrizacion[0] = '';
                        result.getValue(columns[1]) != null ? parametrizacion[1] = result.getValue(columns[1]) : parametrizacion[1] = '';
                        result.getValue(columns[2]) != null ? parametrizacion[2] = result.getValue(columns[2]) : parametrizacion[2] = '';
                        result.getValue(columns[3]) != null ? parametrizacion[3] = result.getValue(columns[3]) : parametrizacion[3] = '';
                        arr.push(parametrizacion);
                    });
                });
            } else {
                arr = resultCount;
            }
            return arr;
        }

        const getDateNow = () => {
            let fechaHoy = new Date();
            let dia = fechaHoy.getDate();
            let mes = fechaHoy.getMonth() + 1; // Los meses en JavaScript comienzan desde 0, por lo que se suma 1
            let año = fechaHoy.getFullYear();
            return año + '/' + mes + '/' + dia
        }

        const identifyServiceOrder = (transaction) => {
            let transactionid = 0;
            let objSearch = search.create({
                type: _constant.Transaction.INVOICE,
                filters:
                    [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["numbertext", "haskeywords", transaction]
                    ],
                columns:
                    [
                        search.createColumn({ name: "createdfrom", summary: "GROUP", label: "Created From" }),
                        search.createColumn({ name: "tranid", summary: "GROUP", label: "Document Number" }),
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0 && searchResultCount <= 4000) {
                objSearch.run().each(result => {
                    transactionid = result.getValue({ name: "createdfrom", summary: "GROUP", label: "Created From" });
                    return true;
                });
            }
            return transactionid;
        }

        const getItemOfServiceOrder = (transactionid) => {
            let objService = new Array();
            let objSearch = search.create({
                type: _constant.Transaction.SALES_ORDER,
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", transactionid],
                        "AND",
                        ["item.type", "anyof", "Assembly", "Kit"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "itemtype", label: "itemType" })
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0 && searchResultCount <= 4000) {
                objSearch.run().each(result => {
                    let itemid = result.getValue({ name: "item", label: "Item" });
                    let tranid = result.getValue({ name: "tranid", label: "Document Number" });
                    objService.push({
                        itemid: itemid,
                        tranid: tranid
                    })
                    return true;
                });
            }
            return objService;
        }

        const validateOrdenTrabajo = (transaction, bien) => {
            let recordid = 0;
            let objSearch = search.create({
                type: _constant.customRecord.ORDEN_TRABAJO,
                filters:
                    [
                        ["custrecord_ht_ot_orden_servicio", "anyof", transaction],
                        "AND",
                        ["custrecord_ht_ot_vehiculo", "anyof", bien]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        //search.createColumn({ name: "custrecord_ht_ot_estado", label: "Estado OT" }),//*VALIDACIÓN PARA NO ENTRAR A CREAR NADA, pendiente de probar
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0) {
                let objResults = objSearch.run().getRange({ start: 0, end: 1 });
                recordid = objResults[0].getValue({ name: "internalid", label: "Internal ID" });
            }
            return recordid;
        }

        const validateChaser = (bien, dispositivo, sim) => {
            let recordid = 0;
            let objSearch = search.create({
                type: _constant.customRecord.CHASER,
                filters:
                    [
                        ["custrecord_ht_mc_vehiculo", "anyof", bien],
                        "AND",
                        ["custrecord_ht_mc_seriedispositivo", "anyof", dispositivo],
                        "AND",
                        ["custrecord_ht_mc_celularsimcard", "anyof", sim]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0) {
                let objResults = objSearch.run().getRange({ start: 0, end: 1 });
                recordid = objResults[0].getValue({ name: "internalid", label: "Internal ID" });
            }
            return recordid;
        }

        const getOficinaPorTaller = (taller) => {
            let recordTaller = search.lookupFields({
                type: 'customrecord_ht_tt_tallertablet',
                id: taller,
                columns: ['custrecord_ht_tt_oficina']
            });
            return recordTaller.custrecord_ht_tt_oficina[0].value;
        }

        const getItemType = (itemId) => {
            let itemRecord = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ["recordtype"]
            });
            return itemRecord.recordtype;
        }

        const getComponents = (item, location) => {
            let billofmaterials = 0;
            let component = 0;
            let account = 0;
            let binNumber = 0;
            let newArray = new Array();
            let assemblyitemSearchObj = search.create({
                type: "assemblyitem",
                filters:
                    [
                        ["type", "anyof", "Assembly"],
                        "AND",
                        ["internalid", "anyof", item],
                        "AND",
                        ["assemblyitembillofmaterials.default", "is", "T"],
                        "AND",
                        ["preferredbin", "is", "T"]
                    ],
                columns:
                    [
                        // search.createColumn({ name: "itemid", sort: search.Sort.ASC, label: "Name" }),
                        search.createColumn({ name: "billofmaterialsid", join: "assemblyItemBillOfMaterials", label: "Bill of Materials ID" }),
                        //search.createColumn({ name: "assetaccount", label: "Asset Account" }),
                        search.createColumn({ name: "internalid", join: "binNumber", label: "Internal ID" }),
                        search.createColumn({ name: "expenseaccount", label: "Expense/COGS Account" })
                        // search.createColumn({ name: "billofmaterials", join: "assemblyItemBillOfMaterials", label: "Bill of Materials" }),
                        // search.createColumn({ name: "default", join: "assemblyItemBillOfMaterials", label: "Default" })

                    ]
            });
            let searchResultCount = assemblyitemSearchObj.runPaged().count;
            if (searchResultCount > 0) {
                assemblyitemSearchObj.run().each(result => {
                    billofmaterials = result.getValue({ name: "billofmaterialsid", join: "assemblyItemBillOfMaterials", label: "Bill of Materials ID" });
                    account = result.getValue({ name: "expenseaccount", label: "Expense/COGS Account" });
                    binNumber = result.getValue({ name: "internalid", join: "binNumber", label: "Internal ID" });
                    return true;
                });

                let bomrevisionSearchObj = search.create({
                    type: "bomrevision",
                    filters:
                        [
                            ["billofmaterials", "anyof", billofmaterials],
                            "AND",
                            ["component.quantity", "equalto", "1"]
                        ],
                    columns:
                        [
                            //search.createColumn({ name: "billofmaterials", label: "Bill of Materials" }),
                            search.createColumn({ name: "item", join: "component", label: "Item" })
                        ]
                });
                let searchResultCount2 = bomrevisionSearchObj.runPaged().count;
                if (searchResultCount2 > 0) {
                    bomrevisionSearchObj.run().each(result => {
                        component = result.getValue({ name: "item", join: "component", label: "Item" });
                        let objData = getAverageCost(component, location);
                        objData.push(component, binNumber, account)
                        newArray.push(objData)
                        return true;
                    });
                }
            }
            return newArray;
        }

        const getAverageCost = (item, location) => {
            let averageCost = 0
            let itemtype = 0;
            let objData = new Array();
            let objSearch = search.create({
                type: "inventoryitem",
                filters:
                    [
                        ["type", "anyof", "InvtPart", "Assembly"],
                        "AND",
                        ["internalid", "anyof", item],
                        "AND",
                        ["inventorylocation", "anyof", location]
                    ],
                columns:
                    [
                        search.createColumn({ name: "locationaveragecost", label: "Location Average Cost" }),
                        search.createColumn({ name: "custitem_ht_ai_tipocomponente", label: "HT Tipo de Componente Chaser" })

                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0) {
                let objResults = objSearch.run().getRange({ start: 0, end: 1 });
                averageCost = objResults[0].getValue({ name: "locationaveragecost", label: "Location Average Cost" });
                itemtype = objResults[0].getValue({ name: "custitem_ht_ai_tipocomponente", label: "HT Tipo de Componente Chaser" });
                objData.push(averageCost, itemtype)
            }
            return objData;
        }

        const getSerie = (number) => {
            let serie = 0
            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                        ["type", "anyof", "InvtPart", "Assembly"],
                        "AND",
                        ["inventorynumber.inventorynumber", "startswith", number]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", join: "inventoryNumber", label: "Internal ID" }),
                        search.createColumn({ name: "inventorynumber", join: "inventoryNumber", label: "Number" })
                    ]
            });
            var searchResultCount = itemSearchObj.runPaged().count;
            //log.debug("itemSearchObj result count", searchResultCount);
            itemSearchObj.run().each(function (result) {
                serie = account = result.getValue({ name: "internalid", join: "inventoryNumber", label: "Internal ID" });

                return true;
            });
            return serie;
        }

        const getOrdenTrabajoParaTurno = (serviceOrder, item) => {
            let ordenTrabajo = 0;
            let objSearch = search.create({
                type: _constant.customRecord.ORDEN_TRABAJO,
                filters:
                    [
                        ["custrecord_ht_ot_orden_servicio", "anyof", serviceOrder],
                        "AND",
                        ["custrecord_ht_ot_item", "anyof", item]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" })
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            if (searchResultCount > 0) {
                objSearch.run().each(result => {
                    ordenTrabajo = result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" });
                    return true;
                });
            }
            return ordenTrabajo;
        }

        const getDeviceBillofMaterials = (disp) => {
            try {
                let dispositivo = query.runSuiteQL({
                    query: `SELECT a.custrecord_ht_dd_dispositivo from CUSTOMRECORD_HT_RECORD_DETALLECHASERDISP a where a.name = ?`,
                    params: [disp]
                });

                let dispositivoMapp = dispositivo.asMappedResults();
                //log.debug('dispositivoMapp', dispositivoMapp);
                if (dispositivoMapp.length > 0) {
                    dispositivo = dispositivoMapp[0]['custrecord_ht_dd_dispositivo'];
                }
                return dispositivo;
            } catch (error) {
                log.error('getDeviceBillofMaterials', error)
            }

        }

        const getSimBillofMaterials = (sim) => {
            try {
                let simcard = query.runSuiteQL({
                    query: `SELECT a.custrecord_ht_ds_simcard from CUSTOMRECORD_HT_RECORD_DETALLECHASERSIM a where a.name = ?`,
                    params: [sim]
                });
                let simcardMap = simcard.asMappedResults();
                //log.debug('simcardMap', simcardMap);
                if (simcardMap.length > 0) {
                    simcard = simcardMap[0]['custrecord_ht_ds_simcard'];
                }
                return simcard;
            } catch (error) {
                log.error('getSimBillofMaterials', error)
            }
        }

        const envioTelecActualizacionCobertura = (ordenTrabajoId, fechaFinCobertura) => {
            return _platformController.envioTelecActualizacionCobertura(ordenTrabajoId, fechaFinCobertura);
        }

        const envioTelecCorteSim = (dispositivoId) => {
            return _platformController.envioTelecCorteSim(dispositivoId)
        }

        const envioPXActualizacionEstado = (dispositivoId, vehiculoId, estadoSim) => {
            return _platformController.envioPXActualizacionEstado(dispositivoId, vehiculoId, estadoSim)
        }

        const envioPXMantenimientoChequeoDispositivo = (idOrdenTrabajo, idActivoFijo) => {
            return _platformController.envioPXMantenimientoChequeoDispositivo(idOrdenTrabajo, idActivoFijo);
        }

        const envioTelecDesinstalacionDispositivoActivoFijo = (idOrdenTrabajo, idActivoFijo) => {
            return _platformController.envioTelecDesinstalacionDispositivoActivoFijo(idOrdenTrabajo, idActivoFijo);
        }

        const getFieldsCobertura = (bien, familia) => {
            try {
                let sql = 'SELECT co.*, dt.custrecord_ht_mc_ubicacion FROM customrecord_ht_co_cobertura co ' +
                    'INNER JOIN customrecord_ht_record_mantchaser dt ON co.custrecord_ht_co_numeroserieproducto = dt.id ' +
                    'WHERE co.custrecord_ht_co_bien = ? AND co.custrecord_ht_co_familia_prod = ?';
                let resultSet = query.runSuiteQL({ query: sql, params: [bien, familia] });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    return results
                } else {
                    return 0;
                }
            } catch (error) {
                log.error('Error-getFieldsCobertura', error)
                return 0;
            }
        }

        const existInstallOtherService = (serviceOrder, workOrder) => {
            let sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_nc_servicios_instalados ' +
                'WHERE custrecord_ns_orden_servicio_si = ? AND custrecord_ns_orden_trabajo = ?';
            let params = [serviceOrder, workOrder]
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
            if (results.length > 0) {
                return results[0]['cantidad']/*[0]['custrecord_ht_co_producto'] == null ? 0 : 1*/
            } else {
                return 0;
            }
        }

        const getDisplayNameDispos = (datosTecnicos) => {
            let sql = 'SELECT it.displayname FROM customrecord_ht_record_mantchaser dt ' +
                'INNER JOIN customrecord_ht_record_detallechaserdisp di ON dt.custrecord_ht_mc_seriedispositivo = di.id ' +
                'INNER JOIN item it ON di.custrecord_ht_dd_dispositivo = it.id ' +
                'WHERE dt.id = ?';
            let params = [datosTecnicos]
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
            if (results.length > 0) {
                return results[0]['displayname']/* == null ? 0 : 1*/
            } else {
                return 0;
            }
        }

        const getDisplayNameLojack = (datosTecnicos) => {
            let sql = 'SELECT it.displayname FROM customrecord_ht_record_mantchaser dt ' +
                'INNER JOIN customrecord_ht_record_detallechaslojack di ON dt.custrecord_ht_mc_seriedispositivolojack = di.id ' +
                'INNER JOIN item it ON di.custrecord_ht_cl_lojack = it.id ' +
                'WHERE dt.id = ?';
            let params = [datosTecnicos]
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
            if (results.length > 0) {
                return results[0]['displayname']/* == null ? 0 : 1*/
            } else {
                return 0;
            }
        }

        const createHTAjusteRelacionado = (workOrder, inventoryAdjustmentId) => {
            let ajusteRelacionado = record.create({
                type: "customrecord_ht_ajuste_relacionados",
                isDinamyc: true
            });
            ajusteRelacionado.setValue("custrecord_ts_ajuste_rela_orden_trabajo", workOrder);
            ajusteRelacionado.setValue("custrecord_ts_ajuste_rela_transacci_gene", inventoryAdjustmentId);

            let ajusteRelacionadoId = ajusteRelacionado.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.error("ajusteRelacionadoId", ajusteRelacionadoId);
        }

        const getParameter = (parametrizacionid, parametro) => {
            log.debug('Controller - parametrizacionid - parametro ', `${parametrizacionid}, ${parametro}`)
            let sql = "SELECT va.custrecord_ht_pp_codigo as valor, va.id as idinterno  FROM customrecord_ht_pp_main_param_prod pp " +
                "INNER JOIN customrecord_ht_cr_parametrizacion_produ pr ON pp.custrecord_ht_pp_parametrizacion_rela = pr.id " +
                "INNER JOIN customrecord_ht_cr_pp_valores va ON  pp.custrecord_ht_pp_parametrizacion_valor = va.id " +
                "WHERE pp.custrecord_ht_pp_aplicacion = 'T' AND pp.custrecord_ht_pp_parametrizacionid = ? AND pr.custrecord_ht_pp_code = ?";
            let resultSet = query.runSuiteQL({ query: sql, params: [parametrizacionid, parametro] });
            let results = resultSet.asMappedResults();
            let valor = results.length > 0 ? results[0]['valor'] : 0;
            let idinterno = results.length > 0 ? results[0]['idinterno'] : 0;
            log.debug('Controller - valor === ', `${valor}`)
            return {
                codigo: valor,
                idinterno: idinterno
            };
        }

        const getProductoInstalado = (bien, familia) => {
            try {
                let sql = 'SELECT custrecord_ht_co_producto as producto FROM customrecord_ht_co_cobertura ' +
                    'WHERE custrecord_ht_co_estado = 1 AND custrecord_ht_co_bien = ? AND custrecord_ht_co_familia_prod = ?';
                let results = query.runSuiteQL({ query: sql, params: [bien, familia] }).asMappedResults();
                log.error('Response-getProductoInstalado', results);
                let producto = results.length > 0 ? results[0]['producto'] : 0;
                return producto;
            } catch (error) {
                log.error('Error-getProductoInstalado', error)
                return 0;
            }
        }

        const getProductoDesinstalado = (bien, familia) => {
            try {
                let sql = 'SELECT custrecord_ht_co_producto as producto FROM customrecord_ht_co_cobertura ' +
                    'WHERE custrecord_ht_co_estado = 2 AND custrecord_ht_co_bien = ? AND custrecord_ht_co_familia_prod = ?';
                let resultSet = query.runSuiteQL({
                    query: sql,
                    params: [bien, familia]
                });
                let results = resultSet.asMappedResults();
                let producto = results.length > 0 ? results[0]['producto'] : 0;
                return producto;
            } catch (error) {
                log.error('Error-getProductoInstalado', error)
                return 0;
            }
        }

        const getFiledsDatosTecnicos = (datosTecnicosid) => {
            try {
                let objReturn = new Array();
                log.debug('EntryRes', datosTecnicosid)
                let objSearch = search.create({
                    type: "customrecord_ht_record_mantchaser",
                    filters:
                        [
                            ["internalid", "anyof", datosTecnicosid]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "Name" }),
                            search.createColumn({ name: "custrecord_ht_dd_modelodispositivo_descr", join: "CUSTRECORD_HT_MC_MODELO", label: "Descripcion" }),
                            search.createColumn({ name: "custrecord_ht_dd_tipodispositivo_descrip", join: "CUSTRECORD_HT_MC_UNIDAD", label: "Descripcion" }),
                            search.createColumn({ name: "custrecord_ht_mc_firmware_descrip", join: "CUSTRECORD_HT_MC_FIRMWARE", label: "Descripcion" }),
                            search.createColumn({ name: "custrecord_ht_mc_script_descrip", join: "CUSTRECORD_HT_MC_SCRIPT", label: "Descripcion" }),
                            search.createColumn({ name: "custrecord_ht_mc_servidor_descrip", join: "CUSTRECORD_HT_MC_SERVIDOR", label: "Descripcion" }),
                            search.createColumn({ name: "name", join: "CUSTRECORD_HT_MC_CELULARSIMCARD", label: "Name" }),
                            search.createColumn({ name: "custrecord_ht_mc_ip", label: "HT MC IP" }),
                            search.createColumn({ name: "custrecord_ht_mc_apn", label: "HT MC APN" }),
                            search.createColumn({ name: "custrecord_ht_dd_imei", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVO", label: "HT DD IMEI" }),
                            search.createColumn({ name: "custrecord_ht_dd_vid", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVO", label: "HT DD VID" }),
                            search.createColumn({ name: "custrecord_ht_cl_seriebox", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVOLOJACK", label: "HT CL BOX" }),
                            search.createColumn({ name: "custrecord_ht_mc_codigoactivacion", label: "HT MC Código de activación" }),
                            search.createColumn({ name: "custrecord_ht_mc_codigorespuesta", label: "HT MC Código de respuesta" })
                        ]
                });
                let results = objSearch.runPaged().count;
                log.debug("objSearch result count", results);
                if (results > 0) {
                    objSearch.run().each((result) => {
                        objReturn.push({
                            chaser: result.id,
                            serie: result.getValue({ name: "name", label: "Name" }),
                            modelo: result.getValue({ name: "custrecord_ht_dd_modelodispositivo_descr", join: "CUSTRECORD_HT_MC_MODELO", label: "Descripcion" }),
                            unidad: result.getValue({ name: "custrecord_ht_dd_tipodispositivo_descrip", join: "CUSTRECORD_HT_MC_UNIDAD", label: "Descripcion" }),
                            fimware: result.getValue({ name: "custrecord_ht_mc_firmware_descrip", join: "CUSTRECORD_HT_MC_FIRMWARE", label: "Descripcion" }),
                            script: result.getValue({ name: "custrecord_ht_mc_script_descrip", join: "CUSTRECORD_HT_MC_SCRIPT", label: "Descripcion" }),
                            servidor: result.getValue({ name: "custrecord_ht_mc_servidor_descrip", join: "CUSTRECORD_HT_MC_SERVIDOR", label: "Descripcion" }),
                            simcard: result.getValue({ name: "name", join: "CUSTRECORD_HT_MC_CELULARSIMCARD", label: "Name" }),
                            ip: result.getValue({ name: "custrecord_ht_mc_ip", label: "HT MC IP" }),
                            apn: result.getValue({ name: "custrecord_ht_mc_apn", label: "HT MC APN" }),
                            imei: result.getValue({ name: "custrecord_ht_dd_imei", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVO", label: "HT DD IMEI" }),
                            vid: result.getValue({ name: "custrecord_ht_dd_vid", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVO", label: "HT DD VID" }),
                            box: result.getValue({ name: "custrecord_ht_cl_seriebox", join: "CUSTRECORD_HT_MC_SERIEDISPOSITIVOLOJACK", label: "HT CL BOX" }),
                            activacion: result.getValue({ name: "custrecord_ht_mc_codigoactivacion", label: "HT MC Código de activación" }),
                            respuesta: result.getValue({ name: "custrecord_ht_mc_codigorespuesta", label: "HT MC Código de respuesta" })
                        })
                        return true;
                    });
                    return objReturn;
                } else {
                    return 0;
                }
            } catch (error) {
                log.error('Error-getFiledsDatosTecnicos', error)
            }
        }

        const getLocationToAssembly = (assemblyId) => {
            let location = 0
            let jsonData = {};
            let assemblybuildSearchObj = search.create({
                type: "assemblybuild",
                filters:
                    [
                        ["type", "anyof", "Build"],
                        "AND",
                        ["createdfrom", "anyof", assemblyId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "ID Interno" }),
                        search.createColumn({ name: "location", summary: "GROUP", label: "Location" }),
                        search.createColumn({ name: "custbody_ht_ce_ordentrabajo", summary: "GROUP", label: "HT CE Orden de trabajo" })
                    ]
            });
            assemblybuildSearchObj.run().each(result => {
                jsonData.assemblybuildid = result.getValue({ name: "internalid", summary: "GROUP", label: "ID Interno" })
                jsonData.location = result.getValue({ name: "location", summary: "GROUP", label: "Location" })
                return true;
            });
            let searchResultCount = assemblybuildSearchObj.runPaged().count;
            if (searchResultCount) {
                let inventorydetailSearchObj = search.create({
                    type: "inventorydetail",
                    filters:
                        [
                            ["transaction.internalid", "anyof", jsonData.assemblybuildid],
                            "AND",
                            ["itemcount", "greaterthan", "0"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "inventorynumber", label: " Number" }),
                            search.createColumn({ name: "binnumber", label: "Bin Number" }),
                            search.createColumn({ name: "status", label: "Status" }),
                            search.createColumn({ name: "quantity", label: "Quantity" }),
                            search.createColumn({ name: "itemcount", label: "Item Count" }),
                        ]
                });
                inventorydetailSearchObj.run().each((result) => {
                    jsonData.binnumber = result.getValue({ name: "binnumber", label: "Bin Number" })
                    return true;
                });
            } else {
                jsonData.binnumber = '';
            }
            return jsonData;
        }

        const paramCodes = (items) => {
            let arr = new Array();
            let busqueda = search.create({
                type: "customrecord_ht_pp_main_param_prod",
                filters:
                    [
                        search.createFilter({
                            name: 'custrecord_ht_pp_aplicacion',
                            operator: search.Operator.IS,
                            values: true
                        }), search.createFilter({
                            name: 'custrecord_ht_pp_parametrizacionid',
                            operator: search.Operator.ANYOF,
                            values: items
                        })
                    ],
                columns:
                    [
                        // search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Param" }),
                        // search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" }),
                        search.createColumn({
                            name: "custrecord_ht_pp_code",
                            join: "CUSTRECORD_HT_PP_PARAMETRIZACION_RELA",
                            label: "Código Parámetro"
                        }),
                        search.createColumn({
                            name: "custrecord_ht_pp_codigo",
                            join: "CUSTRECORD_HT_PP_PARAMETRIZACION_VALOR",
                            label: "Código Valor"
                        })
                    ]
            });
            let resultCount = busqueda.runPaged().count;
            if (resultCount > 0) {
                let pageData = busqueda.runPaged({ pageSize: 1000 });
                pageData.pageRanges.forEach(pageRange => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        let columns = result.columns;
                        let parametrizacion = new Array();
                        result.getValue(columns[0]) != null ? parametrizacion[0] = result.getValue(columns[0]) : parametrizacion[0] = '';
                        result.getValue(columns[1]) != null ? parametrizacion[1] = result.getValue(columns[1]) : parametrizacion[1] = '';
                        // result.getValue(columns[2]) != null ? parametrizacion[2] = result.getValue(columns[2]) : parametrizacion[2] = '';
                        // result.getValue(columns[3]) != null ? parametrizacion[3] = result.getValue(columns[3]) : parametrizacion[3] = '';
                        arr.push({
                            paramCode: parametrizacion[0],
                            valorCode: parametrizacion[1]
                        });
                    });
                });
            } else {
                arr = resultCount;
            }
            return arr;
        }

        return {
            createServiceOrder,
            createInvoice,
            createProvisionDetail,
            parametros,
            getTaxes,
            getGood,
            getServiceOrder,
            getProvisionDetail,
            getAccountPaymentMethod,
            getCobertura,
            parametrizacionJson,
            parametrizacion,
            createInventoryAdjustmentIngreso,
            updateHistorialAF,
            getDateNow,
            updateInstall,
            getInstall,
            identifyServiceOrder,
            getItemOfServiceOrder,
            getOficinaPorTaller,
            validateOrdenTrabajo,
            updateOrdenTrabajo,
            createChaser,
            validateChaser,
            createInventoryAdjustmentSalida,
            getAverageCost,
            getComponents,
            getOrdenTrabajoParaTurno,
            createRegistroCustodia,
            getBinNumberCustodia,
            getBinNumberRevision,
            getBinConvenio,
            deleteRegistroCustodia,
            verifyExistHistorialAF,
            envioTelecCorteSim,
            envioTelecActualizacionCobertura,
            envioPXActualizacionEstado,
            envioPXMantenimientoChequeoDispositivo,
            envioTelecDesinstalacionDispositivoActivoFijo,
            getFieldsCobertura,
            existInstallOtherService,
            getDisplayNameDispos,
            getDisplayNameLojack,
            getFiledsDatosTecnicos,
            getParameter,
            getProductoInstalado,
            getProductoDesinstalado,
            getLocationToAssembly,
            paramCodes
        }
    });
/*
& SCRIPT SE APLICA EN:
^==========================================================================================================================================================================================
^ TS_RS_API_Transactions
^ TS_RS_API_Transactions
^ TS_UE_Sales_Order
^ TS_UE_Orden_Trabajo
^ TS_UE_Bien
^ TS_UE_Task
^ TS_CS_Bienes_Nombre
*/
