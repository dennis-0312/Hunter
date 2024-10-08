/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
    'N/log',
    'N/record',
    'N/search',
    'N/https',
    'N/query',
    'N/error',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
    '../controller/TS_CM_Controller'
],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{https} https
 * @param{query} query
 * @param{error} error
 */
    (log, record, search, https, query, error, _constant, _errorMessage, _controller) => {
        let placaOld = ""
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            placaOld = scriptContext.newRecord.getValue('custrecord_ht_bien_placa');
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            const objRecord = scriptContext.newRecord;
            const tipoBien = objRecord.getValue("custrecord_ht_bien_tipobien");
            if (tipoBien == _constant.Constants.TERRESTRE) {
                if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY) {
                    let tipo_terrestre = objRecord.getValue("custrecord_ht_bien_tipoterrestre");
                    const bien_placa = objRecord.getValue("custrecord_ht_bien_placa");
                    let patron_placa_vehiculo = /^[A-Z]{3}-[0-9]{4}$/;
                    if (tipo_terrestre == _constant.Constants.VEHICULO) {
                        if (bien_placa != "S/P") {
                            if (bien_placa.match(patron_placa_vehiculo) == null) {
                                let myCustomError = error.create({
                                    name: 'FORMATO DE PLACA INCORRECTO',
                                    message: 'Debe de ingresar una placa válida por ejemplo (ABC-1234) o (ABC-0123), o sin placa (S/P) si la desconoce.',
                                    notifyOff: false
                                });
                                log.debug('Error: ' + myCustomError.name, myCustomError.message);
                                throw myCustomError;
                            } else {
                                let objValidpl = getPlaca(bien_placa)
                                if (objValidpl[0] > 0) {
                                    let myCustomError = error.create({
                                        name: 'PLACA YA EXISTENTE',
                                        message: 'Las placas no se pueden repetir.',
                                        notifyOff: false
                                    });
                                    log.debug('Error: ' + myCustomError.name, myCustomError.message);
                                    throw myCustomError;

                                }
                                // for (let i = 0; i < Bienes.length; i++) {
                                //     if (bien_placa == Bienes[i][0]) {
                                //         let myCustomError = error.create({
                                //             name: 'PLACA YA EXISTENTE',
                                //             message: 'Las placas no se pueden repetir.',
                                //             notifyOff: false
                                //         });
                                //         log.debug('Error: ' + myCustomError.name, myCustomError.message);
                                //         throw myCustomError;
                                //     }
                                // }
                            }
                        }
                    }
                } else if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                    var tipo_terrestre = objRecord.getValue("custrecord_ht_bien_tipoterrestre");
                    const bien_placa = objRecord.getValue("custrecord_ht_bien_placa");
                    var patron_placa_vehiculo = /^[A-Z]{3}-[0-9]{4}$/;
                    var flag = true;
                    if (tipo_terrestre == _constant.Constants.VEHICULO) {
                        if (bien_placa != "S/P") {
                            if (bien_placa.match(patron_placa_vehiculo) == null) {
                                let myCustomError = error.create({
                                    name: 'FORMATO DE PLACA INCORRECTO',
                                    message: 'Debe de ingresar una placa válida por ejemplo (ABC-1234) o (ABC-0123), o sin placa (S/P) si la desconoce.',
                                    notifyOff: false
                                });
                                log.debug('Error: ' + myCustomError.name, myCustomError.message);
                                throw myCustomError;
                            } else {
                                let objValidpl = getPlaca(bien_placa)
                                if (objValidpl[0] > 0) {
                                    if (flag == true) {
                                        // log.debug('placaOld', placaOld)
                                        // if (objValidpl[1] != placaOld) {
                                        //     let myCustomError = error.create({
                                        //         name: 'PLACA YA EXISTENTE',
                                        //         message: 'Las placas no se pueden repetir.',
                                        //         notifyOff: false
                                        //     });
                                        //     log.debug('Error: ' + myCustomError.name, myCustomError.message);
                                        //     throw myCustomError;
                                        // }
                                    }
                                }
                                // for (let i = 0; i < Bienes.length; i++) {
                                //     if (bien_placa == Bienes[i][0]) {
                                //         let myCustomError = error.create({
                                //             name: 'PLACA YA EXISTENTE',
                                //             message: 'Las placas no se pueden repetir.',
                                //             notifyOff: false
                                //         });
                                //         log.debug('Error: ' + myCustomError.name, myCustomError.message);
                                //         throw myCustomError;
                                //     }
                                // }
                            }
                        }
                    }

                    // log.debug('objRecord.getValue("name") != objRecord.id', objRecord.getValue("name") + ' - ' + objRecord.id)
                    // if (objRecord.getValue("name") != objRecord.id) {
                    //     objRecord.setValue("name", objRecord.id)
                    // }
                }
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY || scriptContext.type === scriptContext.UserEventType.EDIT) {
                const objRecord = scriptContext.newRecord;
                let dispositivoTXT = '';
                let simCardTXT = '';
                const bienid = objRecord.id.toString();
                let vid = objRecord.getValue('name');
                let altname = objRecord.getValue('altname');
                let estadoConvenio = objRecord.getValue('custrecord_ht_bien_estadoconvenio');
                let documentNumber = objRecord.getValue('custrecord_ht_bien_seguimiento');
                let customer = objRecord.getValue('custrecord_ht_bien_propietario');
                let taller = objRecord.getValue('custrecord_ht_bien_taller_convenio');
                let transactionid = objRecord.getValue('custrecord_ht_bien_orden_serv_convenio');
                let isGenerico = objRecord.getValue("custrecord_ht_bien_generico");
                //let dispositivo = objRecord.getValue('custrecord_ht_bien_dispositivo_convenio');
                //let simCard = objRecord.getValue('custrecord_ht_bien_simcard_convenio');
                // try {
                //     // dispositivoTXT = objRecord.getText('custrecord_ht_bien_dispositivo_convenio');
                //     // simCardTXT = objRecord.getText('custrecord_ht_bien_simcard_convenio');
                // } catch (error) {
                //     //log.error('Error', 'Campos vacíos, no usar getText: ' + error)
                // }

                let datos = new Array();
                let typeComponents = ["1", "2"]
                //let components = [dispositivo, simCard];
                let ordenTrabajo;
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';

                try {
                    if (estadoConvenio == _constant.Status.ACTIVO && transactionid.length != 0) {
                        //let transactionid = _controller.identifyServiceOrder(documentNumber);
                        let objReturn = _controller.getItemOfServiceOrder(transactionid);
                        log.debug('OBJ', objReturn)
                        log.debug('Length OBJ', objReturn.length)
                        if (objReturn.length > 0) {
                            datos = {
                                serviceOrder: transactionid,
                                customer: customer,
                                vehiculo: bienid,
                                item: objReturn[0].itemid,
                                ordenServicio: objReturn[0].tranid
                            }
                            log.debug('objReturn', JSON.stringify(datos))
                            let existOrdenTrabajo = _controller.validateOrdenTrabajo(transactionid, bienid);
                            if (existOrdenTrabajo == 0) {
                                ordenTrabajo = _controller.parametros(_constant.Parameter.GOT_GENERA_SOLICITUD_DE_TRABAJO, datos);
                            } else {
                                ordenTrabajo = existOrdenTrabajo
                            }
                            log.debug('OrdenTrabajo', ordenTrabajo);
                            let params = {
                                soid: transactionid,
                                soline: 0,
                                specord: 'T',
                                assemblyitem: objReturn[0].itemid
                            };

                            let sql = 'SELECT COUNT(*) as cantidad FROM transaction WHERE custbody_ht_ce_ordentrabajo = ?';
                            let params2 = [ordenTrabajo]
                            let resultSet = query.runSuiteQL({ query: sql, params: params2 });
                            let results = resultSet.asMappedResults()[0]['cantidad'];
                            if (results == 0) {
                                let workOrder = record.create({ type: record.Type.WORK_ORDER, isDynamic: true, defaultValues: params });
                                workOrder.setValue({ fieldId: 'quantity', value: 1 });
                                workOrder.setValue({ fieldId: 'custbody_ht_ce_ordentrabajo', value: ordenTrabajo });
                                let woId = workOrder.save();
                                log.debug('woId', woId);
                                let order = record.load({ type: _constant.customRecord.ORDEN_TRABAJO, id: ordenTrabajo });
                                order.setValue({ fieldId: 'custrecord_ht_ot_ordenfabricacion', value: woId });
                                order.setValue({ fieldId: 'custrecord_ht_ot_taller', value: taller });
                                order.setValue({ fieldId: 'custrecord_ht_ot_estado', value: _constant.Status.PROCESANDO });
                                order.setValue({ fieldId: 'custrecord_flujo_de_convenio', value: true });
                                order.save();
                            } else {
                                log.debug('Exist', 'Ya existe Orden de Fabricación');
                            }
                            //TODO: IMPORTANTE! Se comenta el flujo para solo generar hasta la orden de trabajo con el ensamble.
                            // let existChaser = _controller.validateChaser(bienid, dispositivo, simCard);
                            // if (existChaser == 0) {
                            //     chaserRecord = _controller.createChaser(bienid, vid, typeComponents, components);
                            // } else {
                            //     chaserRecord = existChaser
                            // }

                            // log.debug('Chaser', chaserRecord);

                            // let updateOrdenTrabajo = _controller.updateOrdenTrabajo(ordenTrabajo, taller, chaserRecord, dispositivoTXT, simCardTXT);
                            // log.debug('updateOrdenTrabajo', updateOrdenTrabajo);
                            // let myUrlParameters = { myFirstParameter: updateOrdenTrabajo }
                            // let myRestletResponse = https.requestRestlet({
                            //     // body: JSON.stringify(json),
                            //     deploymentId: 'customdeploy_ts_rs_integration_plataform',
                            //     scriptId: 'customscript_ts_rs_integration_plataform',
                            //     headers: myRestletHeaders,
                            //     method: 'GET',
                            //     urlParams: myUrlParameters
                            // });
                            // let response = myRestletResponse.body;
                            // log.debug('Response', response);
                        } else {
                            log.error('Error-getItemOfServiceOrder', _errorMessage.ErrorMessages.ITEM_ORDEN_SERVICIO);
                        }
                    }

                    if (objRecord.getValue("custrecord_ht_bien_tipobien") == _constant.Constants.VEHICULO) {
                        if (altname.includes(bienid) == false) {
                            record.submitFields({
                                type: 'customrecord_ht_record_bienes',
                                id: bienid,
                                values: { 'altname': altname + bienid },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }

                        if (isGenerico) {
                            record.submitFields({
                                type: 'customrecord_ht_record_bienes',
                                id: bienid,
                                values: { 'altname': 'GENERICO.:' + bienid },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        }
                    }
                } catch (error) {
                    log.debug('Error', error);
                }
            }

            if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                const objRecord = scriptContext.newRecord;
                const bienid = objRecord.id.toString();
                let isGenerico = objRecord.getValue("custrecord_ht_bien_generico");
                if (objRecord.getValue("custrecord_ht_bien_tipobien") == _constant.Constants.VEHICULO) {
                    if (isGenerico) {
                        record.submitFields({
                            type: 'customrecord_ht_record_bienes',
                            id: bienid,
                            values: { 'altname': 'GENERICO.:' + bienid },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    } else {
                        let altnameFinal = altnameBien(objRecord);
                        record.submitFields({
                            type: 'customrecord_ht_record_bienes',
                            id: bienid,
                            values: { 'altname': altnameFinal },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }
                }
            }
        }

        const getBien = (internalId, flag) => {
            try {
                let arrCustomerId = new Array();
                let busqueda = search.create({
                    type: "customrecord_ht_record_bienes",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_bien_placa", label: "HT BN Placa" }),
                            search.createColumn({ name: "custrecord_ht_bien_motor", label: "HT BN Motor" }),
                            search.createColumn({ name: "custrecord_ht_bien_chasis", label: "HT BN Chasis" })
                        ]
                });
                if (flag == true) {
                    log.debug('internalId', internalId)
                    let filters = busqueda.filters;
                    const filterOne = search.createFilter({ name: 'internalid', operator: search.Operator.NONEOF, values: internalId });
                    filters.push(filterOne);
                }
                let pageData = busqueda.runPaged({ pageSize: 1000 });
                pageData.pageRanges.forEach(pageRange => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        let columns = result.columns;
                        let arrCustomer = new Array();
                        //0. Internal id match
                        if (result.getValue(columns[0]) != null) {
                            arrCustomer[0] = result.getValue(columns[0]);
                        } else {
                            arrCustomer[0] = '';
                        }
                        if (result.getValue(columns[1]) != null) {
                            arrCustomer[1] = result.getValue(columns[1]);
                        } else {
                            arrCustomer[1] = '';
                        }
                        if (result.getValue(columns[2]) != null) {
                            arrCustomer[2] = result.getValue(columns[2]);
                        } else {
                            arrCustomer[2] = '';
                        }
                        arrCustomerId.push(arrCustomer);
                    });

                });
                return arrCustomerId;
            } catch (error) {
                log.error('Error en getBien', error);
            }
        }

        const altnameBien = (objRecord) => {
            var placa = objRecord.getText("custrecord_ht_bien_placa");
            var motor = objRecord.getText("custrecord_ht_bien_motor");
            var chasis = objRecord.getText("custrecord_ht_bien_chasis");
            var marca = objRecord.getText("custrecord_ht_bien_marca");
            var tipo = objRecord.getText("custrecord_ht_bien_tipo");
            var modelo = objRecord.getText("custrecord_ht_bien_modelo");
            var color = objRecord.getText("custrecord_ht_bien_colorcarseg");

            if (placa) {
                placa = "PLC.:" + placa;
            } else {
                placa = "";
            }
            if (motor) {
                motor = "MOT.:" + motor;
            } else {
                motor = "";
            }
            if (chasis) {
                chasis = "CHA.:" + chasis;
            } else {
                chasis = "";
            }
            if (marca) {
                marca = "MAR.:" + marca;
            } else {
                marca = "";
            }
            if (tipo) {
                tipo = "TIP.:" + tipo;
            } else {
                tipo = "";
            }
            if (modelo) {
                modelo = "MOD.:" + modelo;
            } else {
                modelo = "";
            }
            if (color) {
                color = "COL.:" + color;
            } else {
                color = "";
            }
            let array = [placa, motor, chasis, marca, tipo, modelo, color];
            let txtfinal = "";
            for (let i = 0; i < array.length; i++) {
                if (array[i]) {
                    txtfinal += array[i];
                    if (i < array.length - 1 && array[i + 1]) txtfinal += " ";
                }
            }
            log.debug("txtfinal", txtfinal);
            return txtfinal;
        }

        const getPlaca = (placa) => {
            let objValidate = new Array();
            let bienesSearchObj = search.create({
                type: "customrecord_ht_record_bienes",
                filters:
                    [
                        ["custrecord_ht_bien_placa", "is", placa]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_bien_placa", label: "Placa" })
                    ]
            });
            let searchResultCount = bienesSearchObj.runPaged().count;
            log.debug("customrecord_ht_record_bienesSearchObj result count", searchResultCount);
            bienesSearchObj.run().each(result => {
                objValidate.push(searchResultCount, result.getValue('custrecord_ht_bien_placa'));
            });
            return objValidate;
        }

        return { beforeLoad, beforeSubmit, afterSubmit }
    });
