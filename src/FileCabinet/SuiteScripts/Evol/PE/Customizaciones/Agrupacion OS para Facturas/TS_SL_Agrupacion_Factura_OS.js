/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    "N/ui/serverWidget",
    "N/record",
    "N/log",
    "N/search",
    "N/format",
    "N/task",
    "N/runtime",
    "N/url",
    "N/redirect",
    "N/file",
],
    (serverWidget, record, log, search, format, task, runtime, url, redirect, file) => {
        //Configuraciones para la creacion de la factura directa PE
        const inputfiles = 18054; // antes: 22928;
        const outputfiles = 22929;
        const RECORD_COLA = "customrecord_ts_standar_ss_cola_pe";
        const userRecord = runtime.getCurrentUser();
        let ubicacion_seleccionada;

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                //Creacion del formulario para transaccionar varias ordenes de servicio
                let form = serverWidget.createForm({ title: "Agrupación de Facturas para Factura Directa", });
                //Asignacion de un script para el formulario
                form.clientScriptModulePath = "./TS_CS_Agrupacion_Factura_OS.js";
                //Obtenemos los parametros de la URL
                let params = { flag: "" };
                if (scriptContext.request.parameters.custscript_ts_context) {
                    params = scriptContext.request.parameters.custscript_ts_context;
                    params = JSON.parse(params);
                }
                log.debug('params', params);
                //Agregamos el submit boton del formulario
                form.addSubmitButton({ label: "Crear Factura Directa" });
                form.addButton({
                    id: "custpage_btn_calcular_importe",
                    label: "Calcular Importe",
                    functionName: "calcularImporte",
                });
                //Creacion de la seccion de busqueda
                let seccionBusqueda = form.addFieldGroup({
                    id: "seccion_busqueda",
                    label: "Busqueda de Ordenes de Servicio",
                });
                //Creacion de campo de busqueda los agrupamos en una sola columna

                //cliente
                let cliente = form.addField({ id: "cliente", type: serverWidget.FieldType.SELECT, source: "customer", label: "Cliente", container: "seccion_busqueda" });
                //Fecha de inicio
                let fechaInicio = form.addField({ id: "fecha_inicio", type: serverWidget.FieldType.DATE, label: "Fecha de Inicio", container: "seccion_busqueda" });
                fechaInicio.isMandatory = true;
                //fecha fin
                let fechaFin = form.addField({ id: "fecha_fin", type: serverWidget.FieldType.DATE, label: "Fecha de Fin", container: "seccion_busqueda" });
                fechaFin.isMandatory = true;
                //moneda
                let currency = form.addField({ id: "currency", type: serverWidget.FieldType.SELECT, source: "currency", label: "Moneda", container: "seccion_busqueda" });
                currency.isMandatory = true;
                //Tipo de Orden de Servicio
                let tipo_doc = form.addField({ id: "tipo_doc", type: serverWidget.FieldType.SELECT, source: "customrecord_pe_fiscal_document_type", label: "Pe Tipo de Documento", container: "seccion_busqueda" });
                tipo_doc.isMandatory = true;

                let tipoOS = form.addField({ id: "tipo_os", type: serverWidget.FieldType.SELECT, label: "Tipo de Orden de Servicio", container: "seccion_busqueda" });
                tipoOS.addSelectOption({ value: "1", text: "Total" });
                tipoOS.addSelectOption({ value: "2", text: "Linea" });
                //ocultamos el campo
                tipoOS.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                let account = form.addField({ id: "account", type: serverWidget.FieldType.SELECT, label: "Cuenta AR", container: "seccion_busqueda" });
                account.isMandatory = true;
                account.addSelectOption({ value: '', text: '' });
                let accountSearchObj = search.create({
                    type: "account",
                    filters: [["type", "anyof", "AcctRec"]],
                    columns:
                        [search.createColumn({ name: "displayname", label: "Display Name" })]
                });
                var searchResultCount = accountSearchObj.runPaged().count;
                log.debug("accountSearchObj result count", searchResultCount);
                accountSearchObj.run().each((result) => {
                    account.addSelectOption({ value: result.id, text: result.getValue("displayname") });
                    return true;
                });

                let agrupador = form.addField({
                    id: "agrupador",
                    type: serverWidget.FieldType.TEXT,
                    label: "Agrupador",
                    container: "seccion_busqueda",
                });

                //Agrupador


                let referencia = form.addField({ id: "referencia", type: serverWidget.FieldType.TEXT, label: "referencia", container: "seccion_busqueda" });
                referencia.isMandatory = true;

                let glosa = form.addField({
                    id: "glosa",
                    type: serverWidget.FieldType.TEXT,
                    label: "Glosa",
                    container: "seccion_busqueda",
                });
                glosa.isMandatory = true;
                let facturar_A = form.addField({ id: "facturara", type: serverWidget.FieldType.SELECT, source: "customer", label: "Facturar_A", container: "seccion_busqueda" });
                let articulo = form.addField({ id: "articulo", type: serverWidget.FieldType.SELECT, source: "item", label: "Articulo", container: "seccion_busqueda" });

                // TODO: *-*-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
                // TODO: *-*-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

                // Llenar el SELECT con las ubicaciones de la subsidiaria 2

                // TODO: *-*-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
                // TODO: *-*-*-*-*-*-**-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
                let notaFactura = form.addField({
                    id: "nota_factura",
                    type: serverWidget.FieldType.TEXTAREA,
                    label: "Nota de Factura",
                    container: "seccion_busqueda",
                });
                let importeTotal = form.addField({
                    id: "importe_total",
                    type: serverWidget.FieldType.CURRENCY,
                    label: "base imponible",
                    container: "seccion_busqueda",
                });
                importeTotal.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });
                let igv = form.addField({
                    id: "igv",
                    type: serverWidget.FieldType.CURRENCY,
                    label: "igv",
                    container: "seccion_busqueda",
                });
                igv.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });
                let totalbody = form.addField({
                    id: "totalbody",
                    type: serverWidget.FieldType.CURRENCY,
                    label: "totalbody",
                    container: "seccion_busqueda",
                });
                totalbody.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });
                //Creacion de la seccion de resultados
                form.addFieldGroup({
                    id: "seccion_resultados",
                    label: "Resultados de la Busqueda",
                });
                //Creacion de la sublista
                let sublista = form.addSublist({
                    id: "sublista",
                    type: serverWidget.SublistType.LIST,
                    label: "Facturas Internas",
                    tab: "tab1",
                });
                //Validamos el flag para realizar la busqueda
                if (params.flag == "searchFacturaFin") {
                    //Seteamos los valores de los campos


                    let seccionlocalizacion = form.addFieldGroup({
                        id: "seccion_localizacion",
                        label: "PE Localizacion",
                    });
                    let ubicacion = form.addField({ id: "ubicacion", type: serverWidget.FieldType.SELECT, label: "Oficina", container: "seccion_localizacion", });
                    ubicacion.isMandatory = true;
                    ubicacion.addSelectOption({ value: '', text: '', });

                    let serie = form.addField({ id: "serie", type: serverWidget.FieldType.SELECT, label: "serie", container: "seccion_localizacion" });
                    serie.isMandatory = true;
                    let forma_pago = form.addField({ id: "forma_pago", type: serverWidget.FieldType.SELECT, source: "customlist_pe_fel_forma_pago", label: "PE EI Forma de Pago", container: "seccion_localizacion" });
                    forma_pago.isMandatory = true;
                    let tipo_operacion = form.addField({ id: "tipo_operacion", type: serverWidget.FieldType.SELECT, source: "customrecord_pe_tipo_facturacion", label: "PE EI Tipo de Operación", container: "seccion_localizacion" });
                    tipo_operacion.isMandatory = true;
                    let concept_detraction = form.addField({ id: "concept_detraction", type: serverWidget.FieldType.SELECT, source: "customrecord_pe_concept_detraction", label: "PE Concept Detraction", container: "seccion_localizacion" });
                    concept_detraction.isMandatory = true;
                    let terminoPago = form.addField({ id: "termino_pago", type: serverWidget.FieldType.SELECT, source: "term", label: "Termino de Pago", container: "seccion_localizacion" });
                    terminoPago.isMandatory = true;
                    let gratutita = form.addField({ id: "gratutita", type: serverWidget.FieldType.CHECKBOX, label: "PE Transferencia gratuita", container: "seccion_localizacion" });

                    const locationSearch = search.create({
                        type: "location",
                        filters: [
                            // ["internalid", "anyof", "3", "4", "5", "6", "7", "8", "9", "10"],
                            // "AND",
                            ["subsidiary", "anyof", "3"],
                        ],
                        columns: ["internalid", "name"],
                    });
                    locationSearch.run().each(function (result) {
                        // Agregar cada ubicación como una opción en el SELECT
                        ubicacion.addSelectOption({
                            value: result.getValue("internalid"),
                            text: result.getValue("name"),
                        });
                        return true; // Continuar iterando
                    });




                    let tipodocValue;
                    cliente.defaultValue = params.cliente;

                    if (params.ubicacion && params.tipo_doc) {
                        var customrecordts_ec_series_impresionSearchObj = search.create({
                            type: "customrecord_pe_serie",
                            filters:
                                [
                                    ["custrecord_pe_location", "anyof", params.ubicacion],
                                    "AND",
                                    ["custrecord_pe_tipo_documento_serie", "anyof", params.tipo_doc],
                                    'AND',
                                    ['isinactive', 'is', 'F']
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                                    search.createColumn({ name: "custrecord_pe_serie_impresion", label: "Serie de Impresión" })
                                ]
                        });

                        customrecordts_ec_series_impresionSearchObj.run().each(function (result) {
                            serie.addSelectOption({
                                value: result.getValue("internalid"),
                                text: result.getValue("custrecord_pe_serie_impresion"),
                            });

                            return true; // Continuar iterando
                        });
                    }
                    serie.defaultValue = params.serie;
                    referencia.defaultValue = params.referencia;

                    fechaInicio.defaultValue = new Date(params.fechaInicio);
                    tipoOS.defaultValue = params.tipoOS;
                    fechaFin.defaultValue = new Date(params.fechaFin);
                    account.defaultValue = params.account;
                    agrupador.defaultValue = params.agrupador;
                    tipo_doc.defaultValue = params.tipo_doc;

                    terminoPago.defaultValue = params.termino_pago;
                    glosa.defaultValue = params.glosa;
                    facturar_A.defaultValue = params.facturara;
                    articulo.defaultValue = params.articulo;

                    ubicacion.defaultValue = params.ubicacion;
                    notaFactura.defaultValue = params.nota_factura;
                    currency.defaultValue = params.currency;
                    //Obtenemos las Facturas FIN
                    let facturasFIN = getFacturasFIN(params.cliente, new Date(params.fechaInicio), new Date(params.fechaFin), params.tipoOS, params.agrupador, "GET", params.currency, params.facturara, params.articulo, params.tipo_doc);
                    //Agregamos las columnas a la sublista
                    //Agregamos un boton de seleccionar todos
                    sublista.addMarkAllButtons();
                    sublista.addField({
                        id: "check",
                        type: serverWidget.FieldType.CHECKBOX,
                        label: "Seleccionar",
                    });
                    sublista.addField({
                        id: "id",
                        type: serverWidget.FieldType.TEXT,
                        label: "ID",
                    });
                    sublista.addField({
                        id: "numero",
                        type: serverWidget.FieldType.TEXT,
                        label: "Numero",
                    });
                    sublista.addField({
                        id: "agrupador",
                        type: serverWidget.FieldType.TEXT,
                        label: "Agrupador",
                    });

                    sublista.addField({
                        id: "orden_servicio",
                        type: serverWidget.FieldType.TEXT,
                        label: "Orden de Servicio",
                    });
                    sublista.addField({
                        id: "orden_itemsname",
                        type: serverWidget.FieldType.TEXT,
                        label: "Articulo",
                    });
                    sublista.addField({
                        id: "nro_cuota",
                        type: serverWidget.FieldType.TEXT,
                        label: "Número de Cuota",
                    });
                    sublista.addField({
                        id: "fecha",
                        type: serverWidget.FieldType.TEXT,
                        label: "Fecha",
                    });
                    sublista.addField({
                        id: "cliente",
                        type: serverWidget.FieldType.TEXT,
                        label: "Cliente",
                    });
                    sublista.addField({
                        id: "facturar",
                        type: serverWidget.FieldType.TEXT,
                        label: "Facturar A",
                    });
                    sublista.addField({
                        id: "moneda",
                        type: serverWidget.FieldType.TEXT,
                        label: "Moneda",
                    });
                    sublista.addField({
                        id: "monto",
                        type: serverWidget.FieldType.TEXT,
                        label: "base imponible",
                    });
                    sublista.addField({
                        id: "impuestos",
                        type: serverWidget.FieldType.TEXT,
                        label: "impuestos",
                    });
                    sublista.addField({
                        id: "totalline",
                        type: serverWidget.FieldType.TEXT,
                        label: "total",
                    });
                    //Agregamos las lineas a la sublista
                    log.debug('facturasFIN', facturasFIN);
                    for (i = 0; i < facturasFIN.length; i++) {
                        sublista.setSublistValue({ id: "check", line: i, value: "F" });
                        sublista.setSublistValue({
                            id: "id",
                            line: i,
                            value: facturasFIN[i].id,
                        });
                        sublista.setSublistValue({
                            id: "numero",
                            line: i,
                            value: facturasFIN[i].numero,
                        });
                        if (facturasFIN[i].memo) {
                            sublista.setSublistValue({
                                id: "agrupador",
                                line: i,
                                value: facturasFIN[i].memo,
                            });
                        }
                        if (facturasFIN[i].creado_desde_text) {
                            sublista.setSublistValue({
                                id: "orden_servicio",
                                line: i,
                                value: facturasFIN[i].creado_desde_text,
                            });
                        }
                        if (facturasFIN[i].itemsName) {
                            sublista.setSublistValue({
                                id: "orden_itemsname",
                                line: i,
                                value: facturasFIN[i].itemsName,
                            });
                        }
                        if (facturasFIN[i].creado_desde) {
                            sublista.setSublistValue({
                                id: "id_orden_servicio",
                                line: i,
                                value: facturasFIN[i].creado_desde,
                            });
                        }
                        if (facturasFIN[i].nro_cuota) {
                            sublista.setSublistValue({
                                id: "nro_cuota_interno",
                                line: i,
                                value: facturasFIN[i].nro_cuota,
                            });
                        }

                        if (facturasFIN[i].facturar_a) {
                            sublista.setSublistValue({
                                id: "facturar",
                                line: i,
                                value: facturasFIN[i].facturar_a,
                            });
                        }
                        if (facturasFIN[i].nro_cuota) {
                            sublista.setSublistValue({
                                id: "nro_cuota",
                                line: i,
                                value: facturasFIN[i].nro_cuota,
                            });
                        }
                        sublista.setSublistValue({
                            id: "fecha",
                            line: i,
                            value: facturasFIN[i].fecha,
                        });
                        sublista.setSublistValue({
                            id: "cliente",
                            line: i,
                            value: facturasFIN[i].cliente,
                        });
                        sublista.setSublistValue({
                            id: "moneda",
                            line: i,
                            value: facturasFIN[i].currencyName,
                        });
                        sublista.setSublistValue({
                            id: "monto",
                            line: i,
                            value: facturasFIN[i].monto,
                        });
                        var impuestoslinea = parseFloat(facturasFIN[i].monto) * 0.18;
                        var totallinea = impuestoslinea + parseFloat(facturasFIN[i].monto);
                        log.debug('totallinea', totallinea);
                        sublista.setSublistValue({
                            id: "impuestos",
                            line: i,
                            value: impuestoslinea.toFixed(2),
                        });

                        sublista.setSublistValue({
                            id: "totalline",
                            line: i,
                            value: totallinea.toFixed(2),
                        });
                    }
                }
                scriptContext.response.writePage(form);
                //Creamos la factura directa cuando se envia el formulario
                if (scriptContext.request.method === "POST") {
                    try {
                        let cliente = scriptContext.request.parameters.cliente;
                        let fechaInicio = scriptContext.request.parameters.fecha_inicio;
                        let tipoOS = scriptContext.request.parameters.tipo_os;
                        let fechaFin = scriptContext.request.parameters.fecha_fin;
                        let currency = scriptContext.request.parameters.currency;
                        let account = scriptContext.request.parameters.account;
                        let agrupador = scriptContext.request.parameters.agrupador;
                        let termino_pago = scriptContext.request.parameters.termino_pago;
                        let glosa = scriptContext.request.parameters.glosa;


                        let facturara = scriptContext.request.parameters.facturara;
                        let articulo = scriptContext.request.parameters.articulo;
                        let ubicacion = scriptContext.request.parameters.ubicacion;
                        let serie = scriptContext.request.parameters.serie;
                        let nota_factura = scriptContext.request.parameters.nota_factura;

                        let tipo_doc = scriptContext.request.parameters.tipo_doc;
                        let forma_pago = scriptContext.request.parameters.forma_pago;
                        let tipo_operacion = scriptContext.request.parameters.tipo_operacion;
                        let concept_detraction = scriptContext.request.parameters.concept_detraction;
                        let gratutita = scriptContext.request.parameters.gratutita;
                        // Cadena de texto con los nombres de los campos
                        let labelsString = scriptContext.request.parameters.sublistalabels;
                        // Extraer los nombres de los campos
                        let fieldNames = labelsString.split("\u0001");
                        // Cadena de texto con los datos (ejemplo de datos proporcionados anteriormente)
                        let dataString = scriptContext.request.parameters.sublistadata;
                        // Dividir la cadena en registros individuales y filtrar registros vacíos
                        let records = dataString.split("\u0002").filter((record) => record);
                        //filtramos solo los registros que empiezan con T
                        records = records.filter((record) => record.startsWith("T"));
                        // Convertir cada registro en un objeto y agregarlo a un array
                        let facturasSeleccionadas = records.map((record) => {
                            let fields = record.split("\u0001");
                            // Crear un objeto para cada registro, asignando cada campo a su nombre correspondiente
                            let recordObj = fieldNames.reduce((obj, fieldName, index) => {
                                if (index > 0) {
                                    // Ignorar el primer campo 'Seleccionar'
                                    //nos saltamos el primer campo que es el checkbox
                                    obj[fieldName] = fields[index];
                                }
                                return obj;
                            }, {});
                            return recordObj;
                        });

                        let datosFacturasSeleccionas = getFacturasFIN(cliente, fechaInicio, fechaFin, tipoOS, agrupador, "POST", currency, facturara, articulo, tipo_doc);
                        log.debug("facturasSeleccionadas", facturasSeleccionadas);
                        datosFacturasSeleccionas = datosFacturasSeleccionas.filter((factura) => {
                            return facturasSeleccionadas.some((facturaSeleccionada) => {
                                return (
                                    facturaSeleccionada.ID == factura.id &&
                                    facturaSeleccionada.Articulo == factura.itemsName
                                );
                            });
                        });
                        //Limpiamos datos que no se necesitan
                        datosFacturasSeleccionas.forEach((factura) => {
                            delete factura.numero;
                            delete factura.fecha;
                            delete factura.cliente;
                            delete factura.monto;
                            delete factura.estado;
                            delete factura.memo;
                            delete factura.creado_desde_text;
                            delete factura.currency;
                        });
                        log.debug("datosFacturasSeleccionas", datosFacturasSeleccionas); // ! AQUI

                        let totalFacturasBuscadas = getFacturasLineasFIN(cliente, fechaInicio, fechaFin, tipoOS, agrupador, currency, facturara, articulo, tipo_doc);

                        log.debug("totalFacturasBuscadas", totalFacturasBuscadas);

                        let facturas = totalFacturasBuscadas.filter((factura) => {
                            return facturasSeleccionadas.some((facturaSeleccionada) => {
                                return (
                                    facturaSeleccionada.ID == factura.id &&
                                    facturaSeleccionada.Articulo == factura.itemsName
                                );
                            });
                        });

                        //Agrupamos las facturas sin importar si se repiten los numeros y totalizamos los items
                        log.debug("Item(s) de la factura(s) seleccionada(s)", facturas);
                        const resultado = [];

                        facturas.forEach(entry => {
                            const claveGrupo = `${entry.departamento}|${entry.clase}|${entry.oficina}|${entry.custbody_ht_facturar_a}`;

                            let grupo = resultado.find(g => g._clave === claveGrupo);

                            const item = {
                                id: entry.item,
                                item_f: entry.item_f,
                                nombre: entry.nombreItem,
                                unidad: entry.unidad,
                                cantidad: parseFloat(entry.cantidad),
                                price: entry.price,
                                rate: entry.rate
                            };

                            if (!grupo) {
                                grupo = {
                                    departamento: entry.departamento,
                                    clase: entry.clase,
                                    oficina: entry.oficina,
                                    facturar_a: entry.custbody_ht_facturar_a,
                                    bien: entry.bien,
                                    aseguradora: entry.aseguradora,
                                    concesionario: entry.concesionario,
                                    financiera: entry.financiera,
                                    items: [],
                                    _clave: claveGrupo // clave interna temporal para agrupar
                                };
                                resultado.push(grupo);
                            }

                            const itemExistente = grupo.items.find(i => i.id === item.id);
                            if (itemExistente) {
                                itemExistente.cantidad += item.cantidad;
                            } else {
                                grupo.items.push(item);
                            }
                        });
                        var facturaDirecta = resultado.map(({ _clave, ...resto }) => resto);



                        let currentUser = runtime.getCurrentUser();
                        //Creamos el registro de log
                        let id_log = createCabLog({ cliente: cliente, agrupador: agrupador, usuario: currentUser.id });
                        log.debug("tipo_doc", tipo_doc);
                        let ts_ss_agrup_fac_params = {
                            cliente: cliente,
                            fechaInicio: fechaInicio,
                            tipoOS: tipoOS,
                            fechaFin: fechaFin,
                            agrupador: agrupador,
                            terminoPago: termino_pago,
                            usuario: currentUser.id,
                            id_log: id_log,
                            glosa: glosa,
                            ubicacion: ubicacion,
                            serie: serie,
                            account: account,
                            notaFactura: nota_factura,
                            facturasSeleccionadas: datosFacturasSeleccionas,
                            facturaDirecta: facturaDirecta,
                            tipo_doc: tipo_doc,
                            forma_pago: forma_pago,
                            tipo_operacion: tipo_operacion,
                            concept_detraction: concept_detraction,
                            gratutita: gratutita,
                            currency: currency
                        };

                        log.debug("ts_ss_agrup_fac_params", ts_ss_agrup_fac_params);
                        //Agregamos a la cola
                        let recordColaId = agregarCola(ts_ss_agrup_fac_params);
                        let fileid = saveJson(
                            ts_ss_agrup_fac_params,
                            recordColaId,
                            inputfiles
                        );
                        log.debug("fileid", fileid);
                        let recordId = record.submitFields({
                            type: RECORD_COLA,
                            id: recordColaId,
                            values: { custrecord_ts_ss_parametros_pe: fileid },
                        });
                        log.debug("recordId", recordId);
                        try {
                            let ts_ss_agrup_fac_params_string = JSON.stringify(ts_ss_agrup_fac_params);
                            let scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: "customscript_ts_ss_agrupacion_factura_pe",
                                deploymentId: "customdeploy_ts_ss_agrupacion_factura_pe",
                                params: {
                                    custscriptts_ss_agrup_fac_par_pe: ts_ss_agrup_fac_params_string,
                                    custscript_ts_ss_agrup_fac_slect_fact_pe: "t",
                                },
                            });
                            let scriptTaskId = scriptTask.submit();
                            log.debug("scriptTaskId", scriptTaskId);
                        } catch (error) {
                            log.error("onRequest POST Task", error);
                        }

                        redirect.toSuitelet({ scriptId: 5900, deploymentId: 1 });

                    } catch (error) {
                        log.error("onRequest POST", error);
                    }
                }
            } catch (e) {
                log.error("onRequest", e);
            }
        };

        const getFacturasFIN = (cliente, fechaInicio, fechaFin, tipoOS, agrupador, flag, currency, facturaa, articulo, tipodocValue) => {
            try {
                let respuesta = new Array();
                let agrup = agrupador != "" ? agrupador : "%";
                let newfechaInicio;
                let newfechaFin;
                if (flag == "GET") {
                    //ejemplo de como formatear la fecha "2024-08-11T05:00:00.000Z" a "11/08/2024"
                    newfechaInicio = fechaInicio.toISOString().split("T")[0].split("-").reverse().join("/");
                    newfechaFin = fechaFin.toISOString().split("T")[0].split("-").reverse().join("/");
                } else {
                    newfechaInicio = fechaInicio;
                    newfechaFin = fechaFin;
                }

                let searchFacturasFIN;
                var filters = [
                    ["type", "anyof", "CuTrSale112"],
                    "AND",
                    ["status", "noneof", "CuTrSale112:V"],
                    "AND",
                    ["trandate", "within", newfechaInicio, newfechaFin],
                    "AND",
                    ["currency", "anyof", currency],
                    "AND",
                    ["amount", "notequalto", 0],
                    "AND",
                    ["memomain", "isnot", "VOID"],
                    "AND",
                    ["item", "noneof", "@NONE@"],
                    "AND",
                    ["custcol_ht_fac_agru", "isempty", ""],
                    "AND",
                    ["subsidiary", "anyof", "3"],
                    "AND",
                    ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 1]
                ]
                if (cliente && cliente !== "") {
                    filters.push("AND", ["entity", "anyof", cliente]);
                }
                if (agrupador && agrupador !== "") {
                    filters.push("AND", ["custbody_ht_cod_agru", "contains", agrup]);
                }
                if (facturaa && facturaa !== "") {
                    filters.push("AND", ["custbody_ht_facturar_a", "anyof", facturaa]);
                }
                if (articulo && articulo !== "") {
                    filters.push("AND", ["item", "anyof", articulo]);
                }

                searchFacturasFIN = search.create({
                    type: "transaction",
                    filters: filters,
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "tranid" }),
                        search.createColumn({ name: "trandate" }),
                        search.createColumn({ name: "entity" }),
                        search.createColumn({ name: "amount" }),
                        search.createColumn({ name: "fxgrossamount" }),
                        search.createColumn({ name: "approvalstatus" }),
                        search.createColumn({ name: "custbody_ht_cod_agru" }),
                        search.createColumn({ name: "custbody_ec_nro_cuota_fac_int" }),
                        search.createColumn({ name: "custbody_ec_created_from_fac_int" }),
                        search.createColumn({ name: "custbody_ht_facturar_a" }),
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "displayname", join: "item", label: "Display Name" }),
                        search.createColumn({ name: "symbol", join: "Currency", label: "Symbol" })
                    ],
                });


                let pagedData = searchFacturasFIN.runPaged({ pageSize: 1000 });
                // Verificar si hay al menos una página de resultados
                log.debug('pagedData', pagedData);
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
                                monto: result.getValue({ name: "fxgrossamount" }),
                                estado: result.getText({ name: "approvalstatus" }),
                                memo: result.getValue({ name: "custbody_ht_cod_agru" }),
                                nro_cuota: result.getValue({ name: "custbody_ec_nro_cuota_fac_int", }),
                                creado_desde: result.getValue({ name: "custbody_ec_created_from_fac_int", }),
                                creado_desde_text: result.getText({ name: "custbody_ec_created_from_fac_int", }),
                                items: result.getValue({ name: "item", }),
                                itemsName: result.getValue({ name: "displayname", join: "item", label: "Display Name" }),
                                currencyName: result.getValue({ name: "symbol", join: "Currency", label: "Symbol" }),
                                facturar_a: result.getText({ name: "custbody_ht_facturar_a" }),
                                facturar_id: result.getValue({ name: "custbody_ht_facturar_a" }),
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

        const getFacturasLineasFIN = (
            cliente,
            fechaInicio,
            fechaFin,
            tipoOS,
            agrupador,
            currency, facturaa, articulo, tipodocValue
        ) => {
            try {
                let respuesta = [];
                let agrup = agrupador != "" ? agrupador : "%";
                var invoiceSearchObj;
                var filters = [
                    ["type", "anyof", "CuTrSale112"],
                    "AND",
                    ["status", "noneof", "CuTrSale112:V"],
                    "AND",
                    ["trandate", "within", fechaInicio, fechaFin],
                    "AND",
                    ["item", "noneof", "@NONE@"],
                    "AND",
                    ["currency", "anyof", currency],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["memomain", "isnot", "VOID"],
                    "AND",
                    ["item.type", "noneof", "TaxItem"],
                    "AND",
                    ["subsidiary", "anyof", "3"],
                    "AND",
                    ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 1]

                ];
                if (cliente && cliente !== "") {
                    filters.push("AND", ["entity", "anyof", cliente]);
                }
                if (agrupador && agrupador !== "") {
                    filters.push("AND", ["custbody_ht_cod_agru", "contains", agrupador]);
                }
                if (facturaa && facturaa !== "") {
                    filters.push("AND", ["custbody_ht_facturar_a", "anyof", facturaa]);
                }
                if (articulo && articulo !== "") {
                    filters.push("AND", ["item", "anyof", articulo]);
                }

                invoiceSearchObj = search.create({
                    type: "transaction",
                    filters: filters,
                    columns: [
                        //Datos Cabecera
                        search.createColumn({ name: "internalid", label: "ID interno" }),
                        search.createColumn({
                            name: "tranid",
                            label: "Número de documento",
                        }),
                        search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" }),
                        search.createColumn({ name: "department", label: "Departamento" }),
                        search.createColumn({ name: "class", label: "Clase" }),
                        search.createColumn({ name: "location", label: "Oficina" }),
                        search.createColumn({ name: "custbody_ht_facturar_a", label: "custbody_ht_facturar_a" }),
                        search.createColumn({
                            name: "custbody_ht_os_companiaseguros",
                            label: "HT ASEGURADORA",
                        }),
                        search.createColumn({
                            name: "custbody_ht_os_concesionario",
                            label: "HT CONCESIONARIO",
                        }),
                        search.createColumn({
                            name: "custbody_ht_os_bancofinanciera",
                            label: "HT FINANCIERA",
                        }),
                        search.createColumn({ name: "item", label: "Artículo" }),
                        search.createColumn({
                            name: "custitem_ec_item_agrupado",
                            join: "item",
                            label: "Artículo F",
                        }),
                        search.createColumn({
                            name: "itemid",
                            join: "item",
                            label: "Nombre Articulo",
                        }),
                        search.createColumn({ name: "quantityuom", label: "Cantidad" }),
                        search.createColumn({ name: "unitid", label: "Unidad" }),
                        search.createColumn({
                            name: "taxcode",
                            label: "Artículo de impuesto sobre las ventas",
                        }),
                        search.createColumn({
                            name: "pricelevel",
                            label: "Nivel de Precio",
                        }),
                        search.createColumn({ name: "displayname", join: "item", label: "Display Name" }),
                        search.createColumn({ name: "rate", label: "Tarifa" }),
                        search.createColumn({ name: "fxrate", label: "fxrate" })
                    ],
                });

                let pagedData = invoiceSearchObj.runPaged({ pageSize: 1000 });
                if (pagedData.count > 0) {
                    let pageIndex = 0;
                    // Iterar a través de cada página
                    do {
                        // Obtener la página actual
                        let currentPage = pagedData.fetch({ index: pageIndex });
                        currentPage.data.forEach(function (result) {

                            let objFacturas = {
                                id: result.getValue({ name: "internalid" }),
                                numero: result.getValue({ name: "tranid" }),
                                bien: result.getValue({ name: "custbody_ht_so_bien" }),
                                departamento: result.getValue({ name: "department" }),
                                clase: result.getValue({ name: "class" }),
                                oficina: result.getValue({ name: "location" }),
                                aseguradora: result.getValue({ name: "custbody_ht_os_companiaseguros", }),
                                concesionario: result.getValue({ name: "custbody_ht_os_concesionario", }),
                                financiera: result.getValue({ name: "custbody_ht_os_bancofinanciera", }),
                                item: result.getValue({ name: "item" }),
                                item_f: result.getValue({ name: "custitem_ec_item_agrupado", join: "item", }),
                                nombreItem: result.getValue({ name: "itemid", join: "item" }),
                                cantidad: result.getValue({ name: "quantityuom" }),
                                unidad: result.getValue({ name: "unitid" }),
                                taxcode: result.getValue({ name: "taxcode" }),
                                price: result.getValue({ name: "pricelevel" }),
                                rate: result.getValue({ name: "fxrate" }),
                                custbody_ht_facturar_a: result.getValue({ name: "custbody_ht_facturar_a" }),
                                itemsName: result.getValue({ name: "displayname", join: "item", label: "Display Name" })
                            };
                            respuesta.push(objFacturas);
                        });
                        pageIndex++;
                    } while (pageIndex < pagedData.pageRanges.length);
                }

                return respuesta;
            } catch (error) {
                log.error("getFacturasLineasFIN", error);
            }
        };

        const agregarCola = (params) => {
            try {
                let createCola = record.create({
                    type: "customrecord_ts_standar_ss_cola_pe",
                    isDynamic: true,
                });
                createCola.setValue({ fieldId: "name", value: "Agrupacion Factura OS" });
                //createCola.setValue({ fieldId: 'custrecord_ts_ss_parametros', value: JSON.stringify(params) });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_estado_pe",
                    value: "pendiente",
                });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_creado_por_pe",
                    value: params.usuario,
                });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_fecha_inicio_pe",
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
                    type: "customrecord_ts_log_ejec_agrup_fact_pe",
                    isDynamic: true,
                });
                cabLog.setValue({ fieldId: "name", value: "Agrupacion de Facturas" });
                cabLog.setValue({ fieldId: "custrecord_ts_estado_pe", value: "pendiente" });
                cabLog.setValue({ fieldId: "custrecord_ts_porcentaje_pe", value: "0%" });
                cabLog.setValue({
                    fieldId: "custrecord_ts_cliente_pe",
                    value: params.cliente,
                });
                cabLog.setValue({
                    fieldId: "custrecord_ts_agrupador_pe",
                    value: params.agrupador,
                });
                cabLog.setValue({
                    fieldId: "custrecord_ts_fecha_inicio_pe",
                    value: new Date(),
                });
                if (params.usuario) {
                    cabLog.setValue({
                        fieldId: "custrecord_ts_creado_por_pe",
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
            log.debug("contents saveJson", contents);
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
