/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/record", "N/log", "N/search", "N/format", "N/task", "N/runtime", "N/url", "N/redirect", "N/file",],
    (serverWidget, record, log, search, format, task, runtime, url, redirect, file) => {
        //Configuraciones para la creacion de la factura directa 1637379
        const inputfiles = 18054; // antes: 22928;
        const outputfiles = 22929;
        const RECORD_COLA = "customrecord_ts_standar_ss_cola_am";
        const userRecord = runtime.getCurrentUser();
        let ubicacion_seleccionada;
        const redirectToSuitelet = 5851;
        let SUBSIDIARY = '';

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            var scriptObj = runtime.getCurrentScript();
            SUBSIDIARY = runtime.getCurrentUser().subsidiary;

            try {

                //Creacion del formulario para transaccionar varias ordenes de servicio
                let form = serverWidget.createForm({ title: "Aplicaciones Masivas de saldo a favor", });
                //Asignacion de un script para el formulario
                form.clientScriptModulePath = "./TS_CS_GAP5_Aplicacion_Masiva_Saldo_favor.js";
                //Obtenemos los parametros de la URL
                let params = { flag: "" };
                if (scriptContext.request.parameters.custscript_ts_context) {
                    params = scriptContext.request.parameters.custscript_ts_context;
                    params = JSON.parse(params);
                }

                //Agregamos el submit boton del formulario
                form.addSubmitButton({ label: "PROCESAR APLICACIÓN" });

                //Creacion de la seccion de busqueda
                let seccionBusqueda = form.addFieldGroup({ id: "seccion_busqueda", label: "Seleccionar ", });
                //Creacion de campo de busqueda los agrupamos en una sola columna

                let custom_deposito = form.addField({ id: "custom_deposito", type: serverWidget.FieldType.SELECT, label: "deposito", container: "seccion_busqueda" });

                var journalEntrySearch = search.create({
                    type: "journalentry",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "Journal"],
                            "AND",
                            ["custbody_apl_sf", "is", "T"],
                            "AND",
                            ["custbody_ht_procesado_ant_sf", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                            search.createColumn({ name: "tranid", summary: "GROUP", label: "tranid" })
                        ]
                });
                var pagedData = journalEntrySearch.runPaged({ pageSize: 1000 });
                custom_deposito.addSelectOption({
                    value: '',
                    text: ''
                });
                pagedData.pageRanges.forEach(function (pageRange) {
                    var page = pagedData.fetch({ index: pageRange.index });

                    page.data.forEach(function (result) {
                        custom_deposito.addSelectOption({
                            value: result.getValue({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                            text: result.getValue({ name: "tranid", summary: "GROUP", label: "tranid" })
                        });
                    });
                });
                custom_deposito.isMandatory = true;
                let cliente = form.addField({ id: "cliente", type: serverWidget.FieldType.SELECT, source: "customer", label: "Cliente", container: "seccion_busqueda" });

                //Fecha de inicio
                let fechaInicio = form.addField({ id: "fecha_inicio", type: serverWidget.FieldType.DATE, label: "Fecha de Inicio", container: "seccion_busqueda" });
                fechaInicio.isMandatory = true;
                //fecha fin
                let fechaFin = form.addField({ id: "fecha_fin", type: serverWidget.FieldType.DATE, label: "Fecha de Fin", container: "seccion_busqueda" });
                fechaFin.isMandatory = true;
                let custom_cliente_deposito = form.addField({ id: "custom_cliente_deposito", type: serverWidget.FieldType.SELECT, source: "customer", label: "CLIENTE DEPOSITO", container: "seccion_busqueda", });
                custom_cliente_deposito.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                let custom_subsidiaria = form.addField({ id: "custom_subsidiaria", type: serverWidget.FieldType.SELECT, source: "subsidiary", label: "SUBSIDIARIA", container: "seccion_busqueda", });
                custom_subsidiaria.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                let custom_importe = form.addField({ id: "custom_importe", type: serverWidget.FieldType.TEXT, label: "importe", container: "seccion_busqueda" });
                custom_importe.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

                let custom_cuenta = form.addField({ id: "custom_cuenta", type: serverWidget.FieldType.TEXT, label: "cuenta", container: "seccion_busqueda" });
                custom_cuenta.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                let custom_importe_aplicado = form.addField({ id: "custom_importe_aplicado", type: serverWidget.FieldType.TEXT, label: "importe amplicado", container: "seccion_busqueda" });
                custom_importe_aplicado.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                let custom_importe_perdida = form.addField({ id: "custom_importe_perdida", type: serverWidget.FieldType.TEXT, label: "importe perdida", container: "seccion_busqueda" });
                custom_importe_perdida.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                let custom_importe_ganancia = form.addField({ id: "custom_importe_ganancia", type: serverWidget.FieldType.TEXT, label: "importe ganancia", container: "seccion_busqueda" });
                custom_importe_ganancia.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                let currency = form.addField({ id: "currency", type: serverWidget.FieldType.SELECT, source: "currency", label: "Moneda", container: "seccion_busqueda" });
                currency.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                let custom_tipo_cambio = form.addField({ id: "custom_tipo_cambio", type: serverWidget.FieldType.TEXT, label: "Tipo Cambio", container: "seccion_busqueda" });
                //custom_tipo_cambio.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                //Tipo de Orden de Servicio

                //& <I>26/07/25 dfernandez
                let custom_fecha = form.addField({ id: "custom_fecha", type: serverWidget.FieldType.DATE, label: "Fecha", container: "seccion_busqueda" });
                custom_fecha.defaultValue = new Date(); // Establecer fecha actual por defecto
                let custom_periodo_contable = form.addField({ id: "custom_periodo_contable", type: serverWidget.FieldType.SELECT, source: "accountingperiod", label: "Periodo Contable", container: "seccion_busqueda" });
                let custom_glosa = form.addField({ id: "custom_glosa", type: serverWidget.FieldType.TEXT, label: "Glosa", container: "seccion_busqueda" });
                custom_glosa.isMandatory = true;
                let custom_tipo_diario = form.addField({ id: "custom_tipo_diario", type: serverWidget.FieldType.SELECT,source: "customrecord_pe_tipo_de_diario", label: "Tipo de Diario", container: "seccion_busqueda" });
                //& <F>26/07/25 dfernandez

                let fileField = form.addField({ id: 'custpage_csv_file', type: serverWidget.FieldType.FILE, label: 'Importar Archivo' });


                //Creacion de la seccion de resultados
                form.addFieldGroup({ id: "seccion_resultados", label: "Resultados de la Busqueda", });
                //Creacion de la sublista
                let sublista = form.addSublist({ id: "sublista", type: serverWidget.SublistType.LIST, label: "Detalle", tab: "tab1", });
                //Validamos el flag para realizar la busqueda


                sublista.addField({ id: "check", type: serverWidget.FieldType.CHECKBOX, label: "marcar", });
                sublista.addField({ id: "id", type: serverWidget.FieldType.TEXT, label: "ID documento", });
                var id_cliente = sublista.addField({ id: "id_cliente", type: serverWidget.FieldType.TEXT, label: "id_cliente", });

                sublista.addField({ id: "cliente", type: serverWidget.FieldType.TEXT, label: "cliente", });
                sublista.addField({ id: "documento", type: serverWidget.FieldType.TEXT, label: "documento", });
                sublista.addField({ id: "fecha", type: serverWidget.FieldType.TEXT, label: "Fecha", });
                sublista.addField({ id: "importe", type: serverWidget.FieldType.TEXT, label: "importe", });
                sublista.addField({ id: "importe_pagar", type: serverWidget.FieldType.TEXT, label: "importe pagar", });
                let aplicacion_parcial = sublista.addField({ id: "aplicacion_parcial", type: serverWidget.FieldType.TEXT, label: "aplicación parcial", });
                aplicacion_parcial.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.ENTRY
                });
                sublista.addField({ id: "cuenta", type: serverWidget.FieldType.TEXT, label: "cuenta por cobrar", });
                let cuenta_id = sublista.addField({ id: "cuenta_id", type: serverWidget.FieldType.TEXT, label: "cuenta_id", });
                cuenta_id.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                sublista.addField({ id: "department", type: serverWidget.FieldType.TEXT, label: "departamento", })/*.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })*/;
                sublista.addField({ id: "class", type: serverWidget.FieldType.TEXT, label: "class", })/*.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })*/;
                sublista.addField({ id: "location", type: serverWidget.FieldType.TEXT, label: "location", })/*.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN })*/;

                if (params.flag == "anticipo") {
                    custom_deposito.defaultValue = params.custom_deposito;
                    cliente.defaultValue = params.cliente;
                    fechaInicio.defaultValue = new Date(params.fechaInicio);
                    fechaFin.defaultValue = new Date(params.fechaFin);

                    custom_cliente_deposito.defaultValue = params.custom_cliente_deposito;
                    custom_subsidiaria.defaultValue = params.custom_subsidiaria;
                    custom_importe.defaultValue = params.custom_importe;
                    currency.defaultValue = params.currency;
                    custom_tipo_cambio.defaultValue = params.custom_tipo_cambio;
                    custom_cuenta.defaultValue = params.custom_cuenta;

                    custom_fecha.defaultValue = new Date(params.custom_fecha);
                    custom_periodo_contable.defaultValue = params.custom_periodo_contable;
                    custom_glosa.defaultValue = params.custom_glosa;
                    custom_tipo_diario.defaultValue = params.custom_tipo_diario;
                    let facturasFIN = getFacturasFIN(params.cliente, new Date(params.fechaInicio), new Date(params.fechaFin), "GET", params.currency);
                    if (facturasFIN) {
                        for (i = 0; i < facturasFIN.length; i++) {
                            sublista.setSublistValue({ id: "check", line: i, value: "F" });
                            sublista.setSublistValue({ id: "id", line: i, value: facturasFIN[i].id, });
                            sublista.setSublistValue({ id: "cliente", line: i, value: facturasFIN[i].cliente, });
                            sublista.setSublistValue({ id: "id_cliente", line: i, value: facturasFIN[i].id_cliente, });
                            sublista.setSublistValue({ id: "documento", line: i, value: facturasFIN[i].numero, });
                            sublista.setSublistValue({ id: "fecha", line: i, value: facturasFIN[i].fecha, });
                            sublista.setSublistValue({ id: "importe", line: i, value: facturasFIN[i].monto, });
                            sublista.setSublistValue({ id: "importe_pagar", line: i, value: parseFloat(facturasFIN[i].amountremaining), });
                            sublista.setSublistValue({ id: "cuenta", line: i, value: facturasFIN[i].account, });
                            sublista.setSublistValue({ id: "aplicacion_parcial", line: i, value: 0, });
                            sublista.setSublistValue({ id: "cuenta_id", line: i, value: facturasFIN[i].cuenta_id, });
                            sublista.setSublistValue({ id: "department", line: i, value: facturasFIN[i].department, });
                            sublista.setSublistValue({ id: "class", line: i, value: facturasFIN[i].class, });
                            sublista.setSublistValue({ id: "location", line: i, value: facturasFIN[i].location, });
                        }
                    }
                }

                scriptContext.response.writePage(form);
                //Creamos la factura directa cuando se envia el formulario
                if (scriptContext.request.method === "POST") {
                    try {
                        let custom_deposito = scriptContext.request.parameters.custom_deposito;
                        let custom_cliente_deposito = scriptContext.request.parameters.custom_cliente_deposito;
                        let custom_importe = scriptContext.request.parameters.custom_importe;
                        let custom_tipo_cambio = scriptContext.request.parameters.custom_tipo_cambio;
                        let currency = scriptContext.request.parameters.currency;
                        let custom_cuenta = scriptContext.request.parameters.custom_cuenta;
                        let custom_subsidiaria = scriptContext.request.parameters.custom_subsidiaria;
                        let custom_importe_perdida = scriptContext.request.parameters.custom_importe_perdida;
                        let custom_importe_ganancia = scriptContext.request.parameters.custom_importe_ganancia;

                        //& <I>17/07/25 dfernandez
                        let custom_fecha = scriptContext.request.parameters.custom_fecha;
                        let custom_periodo_contable = scriptContext.request.parameters.custom_periodo_contable;
                        let custom_glosa = scriptContext.request.parameters.custom_glosa;
                        let custom_tipo_diario = scriptContext.request.parameters.custom_tipo_diario;
                        log.debug('Params',
                            {
                                custom_fecha: custom_fecha,
                                custom_periodo_contable: custom_periodo_contable,
                                custom_glosa: custom_glosa,
                                custom_tipo_diario: custom_tipo_diario
                            }
                        )
                        //& <F>17/07/25 dfernandez

                        let labelsString = scriptContext.request.parameters.sublistalabels;
                        let fieldNames = labelsString.split("\u0001");

                        let dataString = scriptContext.request.parameters.sublistadata;
                        let records = dataString.split("\u0002").filter((record) => record);

                        records = records.filter((record) => record.startsWith("T"));

                        let facturasSeleccionadas = records.map((record) => {
                            let fields = record.split("\u0001");

                            let recordObj = fieldNames.reduce((obj, fieldName, index) => {
                                if (index > 0) {
                                    obj[fieldName || 'cuenta_id'] = fields[index];
                                }
                                return obj;
                            }, {});
                            return recordObj;
                        });
                        let currentUser = runtime.getCurrentUser();
                        let id_log = createCabLog({ cliente: custom_cliente_deposito, agrupador: 'agrupador', usuario: currentUser.id });
                        let AsientoAnticipo = {};
                        AsientoAnticipo.custom_deposito = custom_deposito;
                        AsientoAnticipo.usuario = currentUser.id;
                        AsientoAnticipo.custom_cliente_deposito = custom_cliente_deposito;
                        AsientoAnticipo.custom_importe = custom_importe;
                        AsientoAnticipo.custom_tipo_cambio = custom_tipo_cambio;
                        AsientoAnticipo.currency = currency;
                        AsientoAnticipo.cuenta = custom_cuenta;
                        AsientoAnticipo.custom_importe_perdida = custom_importe_perdida;
                        AsientoAnticipo.custom_importe_ganancia = custom_importe_ganancia;
                        AsientoAnticipo.custom_subsidiaria = custom_subsidiaria;
                        AsientoAnticipo.id_log = id_log;
                        AsientoAnticipo.facturas = facturasSeleccionadas;

                        //& <I>17/07/25 dfernandez
                        AsientoAnticipo.custom_fecha = custom_fecha
                        AsientoAnticipo.custom_periodo_contable = custom_periodo_contable
                        AsientoAnticipo.custom_glosa = custom_glosa,
                        AsientoAnticipo.custom_tipo_diario = custom_tipo_diario
                        //& <F>17/07/25 dfernandez

                        let recordColaId = agregarCola(AsientoAnticipo);
                        let fileid = saveJson(
                            AsientoAnticipo,
                            recordColaId,
                            inputfiles
                        );
                        log.debug("fileid", fileid);
                        let recordId = record.submitFields({
                            type: RECORD_COLA,
                            id: recordColaId,
                            values: { custrecord_ts_ss_parametros_am: fileid },
                        });

                        try {

                            let scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: "customscript_ts_ss_gap5_aplicacion_masiv",
                                deploymentId: "customdeploy_ts_ss_gap5_aplicacion_masiv",
                            });
                            let scriptTaskId = scriptTask.submit();
                            log.debug("scriptTaskId", scriptTaskId);
                        } catch (error) {
                            log.error("onRequest POST Task", error);
                        }
                        redirect.toSuitelet({ scriptId: redirectToSuitelet, deploymentId: 1 });
                    } catch (error) {
                        log.error("onRequest POST", error);
                    }
                }
            } catch (e) {
                log.error("onRequest", e);
            }
        };

        const getFacturasFIN = (cliente, fechaInicio, fechaFin, flag, currency) => {
            try {
                let respuesta = new Array();

                let newfechaInicio;
                let newfechaFin;
                if (flag == "GET") {
                    newfechaInicio = fechaInicio
                        .toISOString()
                        .split("T")[0]
                        .split("-")
                        .reverse()
                        .join("/");
                    newfechaFin = fechaFin
                        .toISOString()
                        .split("T")[0]
                        .split("-")
                        .reverse()
                        .join("/");
                } else {
                    newfechaInicio = fechaInicio;
                    newfechaFin = fechaFin;
                }

                let searchFacturasFIN;

                var filters = [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["currency", "anyof", currency],
                    "AND",
                    ["status", "anyof", "CustInvc:A"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["trandate", "within", newfechaInicio, newfechaFin],
                    "AND",
                    ["subsidiary", "anyof", SUBSIDIARY]
                ];


                if (cliente && cliente !== "") {
                    filters.push("AND", ["entity", "anyof", cliente]);
                }
                searchFacturasFIN = search.create({
                    type: "invoice",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters: filters,
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "tranid" }),
                            search.createColumn({ name: "entity" }),
                            search.createColumn({ name: "account" }),
                            search.createColumn({ name: "exchangerate" }),
                            search.createColumn({ name: "amountremaining" }),
                            search.createColumn({ name: "fxamount", label: "Amount (Foreign Currency)" }),
                            search.createColumn({ name: "department" }),
                            search.createColumn({ name: "class" }),
                            search.createColumn({ name: "location" })
                        ]
                });


                let pagedData = searchFacturasFIN.runPaged({ pageSize: 1000 });
                // Verificar si hay al menos una página de resultados
                if (pagedData.count > 0) {
                    let pageIndex = 0;
                    // Iterar a través de cada página
                    do {
                        // Obtener la página actual
                        let currentPage = pagedData.fetch({ index: pageIndex });
                        currentPage.data.forEach(function (result) {
                            respuesta.push({
                                id: result.getValue({ name: "internalid" }),
                                numero: result.getValue({ name: "tranid" }),
                                fecha: result.getValue({ name: "trandate" }),
                                cliente: result.getText({ name: "entity" }),
                                id_cliente: result.getValue({ name: "entity" }),
                                account: result.getText({ name: "account" }),
                                monto: result.getValue({ name: "fxamount" }),
                                amountremaining: (parseFloat(result.getValue({ name: "amountremaining" })) / parseFloat(result.getValue({ name: "exchangerate" }))).toFixed(2),
                                cuenta_id: result.getValue({ name: "account" }),
                                department: result.getValue({ name: "department" }),
                                class: result.getValue({ name: "class" }),
                                location: result.getValue({ name: "location" })
                            });
                        });
                        pageIndex++;
                    } while (pageIndex < pagedData.pageRanges.length);
                }
                return respuesta;
            } catch (e) {
                log.error("getOrdenesServicio", e);
            }
        };



        const agregarCola = (params) => {
            try {
                let createCola = record.create({
                    type: "customrecord_ts_standar_ss_cola_am",
                    isDynamic: true,
                });
                createCola.setValue({ fieldId: "name", value: "Agrupacion Factura OS" });
                //createCola.setValue({ fieldId: 'custrecord_ts_ss_parametros', value: JSON.stringify(params) });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_estado_am",
                    value: "pendiente",
                });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_creado_por_am",
                    value: params.usuario,
                });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_fecha_inicio_am",
                    value: new Date(),
                });
                return createCola.save();
            } catch (e) {
                log.error("Agregar Cola Error", e);
            }
        };

        const createCabLog = (params) => {
            try {
                let cabLog = record.create({
                    type: "customrecord_ts_log_ejec_agrup_fact_am",
                    isDynamic: true,
                });
                cabLog.setValue({ fieldId: "name", value: "Agrupacion de Facturas" });
                cabLog.setValue({ fieldId: "custrecord_ts_estado_am", value: "pendiente" });
                cabLog.setValue({ fieldId: "custrecord_ts_porcentaje_am", value: "0%" });
                cabLog.setValue({
                    fieldId: "custrecord_ts_cliente_am",
                    value: params.cliente,
                });
                cabLog.setValue({
                    fieldId: "custrecord_ts_agrupador_am",
                    value: params.agrupador,
                });
                cabLog.setValue({
                    fieldId: "custrecord_ts_fecha_inicio_am",
                    value: new Date(),
                });
                if (params.usuario) {
                    cabLog.setValue({
                        fieldId: "custrecord_ts_creado_por_am",
                        value: params.usuario,
                    });
                }
                cabLog.save();
                return cabLog.id;
            } catch (error) {
                log.error("createCabLog", error);
            }
        };

        // ! CREACIÓN FINAL PARA LA FACTURA
        // ! INJECTAR LA UBICACIÓN SELECCIONADA
        const saveJson = (contents, nombre, folder) => {
            let fecha = sysDate();
            let fileObj = file.create({
                name: `lote${nombre}_${fecha}.json`,
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: folder,
                isOnline: false,
            });
            return fileObj.save();
        };

        const sysDate = () => {
            let date = new Date();
            var tdate = date.getDate();
            tdate = Number(tdate) < 10 ? `0${tdate}` : tdate;
            var month = date.getMonth() + 1;
            month = Number(month) < 10 ? `0${month}` : month;
            var year = date.getFullYear();
            return (currentDate = `${tdate}${month}${year}`);
        };

        return { onRequest };
    });
