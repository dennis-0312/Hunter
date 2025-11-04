/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/ui/serverWidget", "N/record", "N/log", "N/search", "N/format", "N/task", "N/runtime", "N/url", "N/redirect", "N/file",],
    (serverWidget, record, log, search, format, task, runtime, url, redirect, file) => {
        //Configuraciones para la creacion de la factura directa
        const inputfiles = 18054; // antes: 22928;
        const outputfiles = 22929;
        const RECORD_COLA = "customrecord_ts_standar_ss_cola_maf_mov";
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

            var scriptObj = runtime.getCurrentScript();


            try {
                let params = { flag: "" };
                log.debug('scriptContext.request.parameters.custscript_ts_context', scriptContext.request.parameters);
                if (scriptContext.request.parameters.custscript_ts_context) {
                    params = scriptContext.request.parameters.custscript_ts_context;
                    params = JSON.parse(params);
                }
                var tipoGenerador = scriptObj.getParameter({ name: 'custscript_tipo_fac', });
                if (params.flag == "searchFacturaFin") {
                    tipoGenerador = params.tipo_generado;
                }
                //Creacion del formulario para transaccionar varias ordenes de servicio
                let form = serverWidget.createForm({ title: "Agrupación de Facturas " + tipoGenerador, });
                //Asignacion de un script para el formulario
                form.clientScriptModulePath = "./TS_CS_GAP_3_FACTURACION_MASIVA.js";
                //Obtenemos los parametros de la URL



                log.debug('params', params);

                //Agregamos el submit boton del formulario
                form.addSubmitButton({ label: "Crear Factura Directa" });
                form.addButton({ id: "custpage_btn_calcular_importe", label: "Calcular Importe", functionName: "calcularImporte", });
                //Creacion de la seccion de busqueda
                let seccionBusqueda = form.addFieldGroup({ id: "seccion_busqueda", label: "Busqueda de Ordenes de Servicio", });
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
                let tipoOS = form.addField({ id: "tipo_os", type: serverWidget.FieldType.SELECT, label: "Tipo de Orden de Servicio", container: "seccion_busqueda" });
                tipoOS.addSelectOption({ value: "1", text: "Total" });
                tipoOS.addSelectOption({ value: "2", text: "Linea" });
                //ocultamos el campo
                tipoOS.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                let tipo_doc = form.addField({ id: "tipo_doc", type: serverWidget.FieldType.SELECT, source: "customrecord_pe_fiscal_document_type", label: "Pe Tipo de Documento", container: "seccion_busqueda" });
                tipo_doc.isMandatory = true;
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
                let tipo_generado = form.addField({ id: "tipo_generado", type: serverWidget.FieldType.TEXT, label: "tipo_generado", container: "seccion_busqueda", });
                //tipo_generado.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED,});
                tipo_generado.defaultValue = tipoGenerador;
                let agrupador = form.addField({ id: "agrupador", type: serverWidget.FieldType.TEXT, label: "Agrupador", container: "seccion_busqueda", });


                //Agrupador


                let referencia = form.addField({ id: "referencia", type: serverWidget.FieldType.TEXT, label: "referencia", container: "seccion_busqueda" });
                referencia.isMandatory = true;



                let glosa = form.addField({ id: "glosa", type: serverWidget.FieldType.TEXT, label: "Glosa", container: "seccion_busqueda", });
                glosa.isMandatory = true;

                let notaFactura = form.addField({ id: "nota_factura", type: serverWidget.FieldType.TEXTAREA, label: "Nota de Factura", container: "seccion_busqueda", });
                let importeTotal = form.addField({ id: "importe_total", type: serverWidget.FieldType.CURRENCY, label: "base imponible", container: "seccion_busqueda", });
                importeTotal.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED, });
                let igv = form.addField({ id: "igv", type: serverWidget.FieldType.CURRENCY, label: "igv", container: "seccion_busqueda", });
                igv.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED, });
                let totalbody = form.addField({ id: "totalbody", type: serverWidget.FieldType.CURRENCY, label: "totalbody", container: "seccion_busqueda", });
                totalbody.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED, });
                let fileField = form.addField({ id: 'custpage_csv_file', type: serverWidget.FieldType.FILE, label: 'Importar CSV' });
                if (tipoGenerador == 'MOVILIZA') {
                    fileField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                }
                //Creacion de la seccion de resultados
                form.addFieldGroup({ id: "seccion_resultados", label: "Resultados de la Busqueda", });
                //Creacion de la sublista
                let sublista = form.addSublist({ id: "sublista", type: serverWidget.SublistType.LIST, label: "Orde de Servicio", tab: "tab1", });
                //Validamos el flag para realizar la busqueda
                if (params.flag == "searchFacturaFin") {
                    //Seteamos los valores de los campos
                    let seccionlocalizacion = form.addFieldGroup({ id: "seccion_localizacion", label: "PE Localizacion", });
                    let ubicacion = form.addField({ id: "ubicacion", type: serverWidget.FieldType.SELECT, label: "Oficina", container: "seccion_localizacion", });
                    ubicacion.isMandatory = true;
                    ubicacion.addSelectOption({ value: '', text: '', });

                    let serie = form.addField({ id: "serie", type: serverWidget.FieldType.SELECT, label: "serie", container: "seccion_localizacion" });
                    serie.isMandatory = true;
                    let forma_pago = form.addField({ id: "forma_pago", type: serverWidget.FieldType.SELECT, source: "customlist_pe_fel_forma_pago", label: "PE EI Forma de Pago", container: "seccion_localizacion" });
                    forma_pago.isMandatory = true;
                    let tipo_operacion = form.addField({ id: "tipo_operacion", type: serverWidget.FieldType.SELECT, source: "customrecord_pe_tipo_facturacion", label: "PE EI Tipo de Operación", container: "seccion_localizacion" });
                    tipo_operacion.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                    let concept_detraction = form.addField({ id: "concept_detraction", type: serverWidget.FieldType.SELECT, source: "customrecord_pe_concept_detraction", label: "PE Concept Detraction", container: "seccion_localizacion" });
                    concept_detraction.isMandatory = true;
                    let terminoPago = form.addField({ id: "termino_pago", type: serverWidget.FieldType.SELECT, source: "term", label: "Termino de Pago", container: "seccion_localizacion" });
                    terminoPago.isMandatory = true;
                    let gratutita = form.addField({ id: "gratutita", type: serverWidget.FieldType.CHECKBOX, label: "PE Transferencia gratuita", container: "seccion_localizacion" });
                    if (tipoGenerador == 'MAF' || tipoGenerador == 'MOVILIZA') {
                        agrupador.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                        concept_detraction.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                        tipo_generado.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                    }
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


                    /* var fieldLookUp = search.lookupFields({
                        type: 'customer',
                        id: params.cliente,
                        columns: ['address']
                    });*/
                    tipo_doc.defaultValue = params.tipo_doc;
                    let tipodocValue = params.tipo_doc;
                    cliente.defaultValue = params.cliente;

                    if (params.ubicacion && tipodocValue) {
                        var customrecordts_ec_series_impresionSearchObj = search.create({
                            type: "customrecord_pe_serie",
                            filters:
                                [
                                    ["custrecord_pe_location", "anyof", params.ubicacion],
                                    "AND",
                                    ["custrecord_pe_tipo_documento_serie", "anyof", tipodocValue],
                                    "AND",
                                    ["isinactive", "is", "F"]
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
                    // direccion.defaultValue = fieldLookUp.address
                    fechaInicio.defaultValue = new Date(params.fechaInicio);
                    tipoOS.defaultValue = params.tipoOS;
                    fechaFin.defaultValue = new Date(params.fechaFin);
                    account.defaultValue = params.account;

                    agrupador.defaultValue = params.agrupador;

                    terminoPago.defaultValue = params.termino_pago;
                    glosa.defaultValue = params.glosa;

                    ubicacion.defaultValue = params.ubicacion;
                    notaFactura.defaultValue = params.nota_factura;
                    currency.defaultValue = params.currency;
                    //Obtenemos las Facturas FIN
                    let facturasFIN = getFacturasFIN(params.cliente, new Date(params.fechaInicio), new Date(params.fechaFin), params.tipoOS, params.agrupador, "GET", params.currency, tipoGenerador, tipodocValue);
                    //Agregamos las columnas a la sublista
                    //Agregamos un boton de seleccionar todos
                    sublista.addMarkAllButtons();
                    sublista.addField({ id: "check", type: serverWidget.FieldType.CHECKBOX, label: "Seleccionar", });
                    sublista.addField({ id: "id", type: serverWidget.FieldType.TEXT, label: "ID", });
                    var numero = sublista.addField({ id: "numero", type: serverWidget.FieldType.TEXT, label: "Numero", });
                    var listAgrupador = sublista.addField({ id: "agrupador", type: serverWidget.FieldType.TEXT, label: "Agrupador", });

                    sublista.addField({ id: "orden_servicio", type: serverWidget.FieldType.TEXT, label: "Orden de Servicio", });
                    sublista.addField({ id: "orden_itemsname", type: serverWidget.FieldType.TEXT, label: "Articulo", });
                    var nro_cuota = sublista.addField({ id: "nro_cuota", type: serverWidget.FieldType.TEXT, label: "Número de Cuota", });
                    if (tipoGenerador == 'MAF' || tipoGenerador == 'MOVILIZA') {
                        listAgrupador.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                        nro_cuota.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                        numero.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN, });
                    }
                    sublista.addField({ id: "fecha", type: serverWidget.FieldType.TEXT, label: "Fecha", });
                    sublista.addField({ id: "cliente", type: serverWidget.FieldType.TEXT, label: "Cliente", });
                    sublista.addField({ id: "factura", type: serverWidget.FieldType.TEXT, label: "Facturar_a", });
                    sublista.addField({ id: "moneda", type: serverWidget.FieldType.TEXT, label: "Moneda", });
                    sublista.addField({ id: "monto", type: serverWidget.FieldType.TEXT, label: "base imponible", });
                    sublista.addField({ id: "impuestos", type: serverWidget.FieldType.TEXT, label: "impuestos", });
                    sublista.addField({ id: "totalline", type: serverWidget.FieldType.TEXT, label: "total", });
                    //Agregamos las lineas a la sublista
                    log.debug('facturasFIN', facturasFIN);
                    for (i = 0; i < facturasFIN.length; i++) {
                        sublista.setSublistValue({ id: "check", line: i, value: "F" });
                        sublista.setSublistValue({ id: "id", line: i, value: facturasFIN[i].id, });
                        sublista.setSublistValue({ id: "numero", line: i, value: facturasFIN[i].numero, });
                        if (facturasFIN[i].memo) {
                            sublista.setSublistValue({ id: "agrupador", line: i, value: facturasFIN[i].memo, });
                        }
                        if (facturasFIN[i].creado_desde_text) {
                            sublista.setSublistValue({ id: "orden_servicio", line: i, value: facturasFIN[i].creado_desde_text, });
                        }
                        if (tipoGenerador == 'MAF' || tipoGenerador == 'MOVILIZA') {
                            sublista.setSublistValue({ id: "orden_servicio", line: i, value: facturasFIN[i].numero, });
                        }
                        if (facturasFIN[i].itemsName) {
                            sublista.setSublistValue({ id: "orden_itemsname", line: i, value: facturasFIN[i].itemsName, });
                        }
                        if (facturasFIN[i].creado_desde) {
                            sublista.setSublistValue({ id: "id_orden_servicio", line: i, value: facturasFIN[i].creado_desde, });
                        }
                        if (facturasFIN[i].nro_cuota) {
                            sublista.setSublistValue({ id: "nro_cuota_interno", line: i, value: facturasFIN[i].nro_cuota, });
                        }
                        if (facturasFIN[i].nro_cuota) {
                            sublista.setSublistValue({ id: "nro_cuota", line: i, value: facturasFIN[i].nro_cuota, });
                        }
                        sublista.setSublistValue({ id: "fecha", line: i, value: facturasFIN[i].fecha, });
                        sublista.setSublistValue({ id: "cliente", line: i, value: facturasFIN[i].cliente, });
                        sublista.setSublistValue({ id: "factura", line: i, value: facturasFIN[i].factura, });
                        sublista.setSublistValue({ id: "moneda", line: i, value: facturasFIN[i].currencyName, });
                        sublista.setSublistValue({ id: "monto", line: i, value: facturasFIN[i].monto, });
                        var impuestoslinea = parseFloat(facturasFIN[i].monto) * 0.18;
                        var totallinea = impuestoslinea + parseFloat(facturasFIN[i].monto);

                        sublista.setSublistValue({ id: "impuestos", line: i, value: impuestoslinea.toFixed(2), });
                        sublista.setSublistValue({ id: "totalline", line: i, value: totallinea.toFixed(2), });
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
                        let tipo_generado = scriptContext.request.parameters.tipo_generado;
                        let termino_pago = scriptContext.request.parameters.termino_pago;
                        let glosa = scriptContext.request.parameters.glosa;

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

                        let datosFacturasSeleccionas = getFacturasFIN(cliente, fechaInicio, fechaFin, tipoOS, agrupador, "POST", currency, tipo_generado, tipo_doc);
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

                        let totalFacturasBuscadas = getFacturasLineasFIN(cliente, fechaInicio, fechaFin, tipoOS, agrupador, currency, tipo_generado, tipo_doc);

                        log.debug("totalFacturasBuscadas", totalFacturasBuscadas);

                        let facturas = totalFacturasBuscadas.filter((factura) => {
                            return facturasSeleccionadas.some((facturaSeleccionada) => {
                                return (
                                    (tipo_generado == 'MOVILIZA' ? (facturaSeleccionada.ID == factura.id) : (facturaSeleccionada.ID == factura.id &&
                                        facturaSeleccionada.Articulo == factura.itemsName))

                                );
                            });
                        });

                        //Agrupamos las facturas sin importar si se repiten los numeros y totalizamos los items
                        log.debug("Item(s) de la factura(s) seleccionada(s)", facturas);
                        let facturaarray = [];
                        let facturaDirecta = {};
                        facturaDirecta.bien = facturas[0].bien;
                        facturaDirecta.departamento = facturas[0].departamento;
                        facturaDirecta.clase = facturas[0].clase;
                        facturaDirecta.oficina = ubicacion;
                        facturaDirecta.tipo_generado = tipo_generado;
                        facturaDirecta.aseguradora = facturas[0].aseguradora;
                        facturaDirecta.concesionario = facturas[0].concesionario;
                        facturaDirecta.financiera = facturas[0].financiera;
                        facturaDirecta.items = [];

                        //unimos los items y Sumamos las cantidades
                        let items = new Array();
                        const facturaMap = new Map();
                        facturas.forEach((factura) => {
                            if (tipo_generado == 'MOVILIZA') {
                                const key = `${factura.id}-${factura.numero}`;

                                if (!facturaMap.has(key)) {
                                    facturaMap.set(key, {
                                        id: factura.id,
                                        bien: factura.bien,
                                        departamento: factura.departamento,
                                        clase: factura.clase,
                                        tipo_generado: tipo_generado,
                                        oficina: factura.oficina,
                                        aseguradora: factura.aseguradora,
                                        concesionario: factura.concesionario,
                                        financiera: factura.financiera,
                                        cliente: factura.cliente,
                                        items: []
                                    });
                                }

                                facturaMap.get(key).items.push({
                                    id: factura.item,
                                    item_f: factura.item_f,
                                    nombre: factura.nombreItem,
                                    unidad: factura.unidad,
                                    cantidad: Number(factura.cantidad),
                                    price: factura.price,
                                    rate: factura.rate,
                                    itemtype: factura.itemtype
                                });
                            } else if (tipo_generado == 'AGRUPADA') {

                                let item = items.find((item) => datosFacturasSeleccionas.some((dato) => dato.id === factura.id) && item.id == factura.item && item.price == factura.price && item.rate == factura.rate);
                                //log.debug('item-track', item);
                                if (item) {
                                    item.cantidad += Number(factura.cantidad);
                                    // log.debug("factura  { 455", { factura, facturas });
                                } else {
                                    // log.debug("factura else { 456", { factura, facturas });
                                    items.push({
                                        id: factura.item,
                                        item_f: factura.item_f,
                                        nombre: factura.nombreItem,
                                        unidad: factura.unidad,
                                        cantidad: Number(factura.cantidad),
                                        price: factura.price,
                                        rate: factura.rate,
                                    });

                                }
                            }

                        });
                        if (tipo_generado == 'AGRUPADA') {
                            facturaDirecta.items = items;
                            facturaarray.push(facturaDirecta);
                        }
                        if (tipo_generado == 'MOVILIZA') {
                            facturaarray = Array.from(facturaMap.values());
                        }
                        if (tipo_generado == 'MAF') {
                            facturaarray = facturas;
                        }


                        //obtenemos el usuario actual
                        let currentUser = runtime.getCurrentUser();
                        //Creamos el registro de log
                        let id_log = createCabLog({ cliente: cliente, agrupador: agrupador, usuario: currentUser.id });
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
                            tipo_generado: tipo_generado,
                            ubicacion: ubicacion,
                            serie: serie,
                            account: account,
                            notaFactura: nota_factura,
                            facturasSeleccionadas: datosFacturasSeleccionas,
                            facturaDirecta: facturaarray,
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
                            values: { custrecord_ts_ss_parametros_mm: fileid },
                        });
                        log.debug("recordId", recordId);
                        try {
                            let ts_ss_agrup_fac_params_string = JSON.stringify(ts_ss_agrup_fac_params);
                            let scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: "customscript_ts_ss_gap_3_facturacion_mas",
                                deploymentId: "customdeploy_ts_ss_gap_3_facturacion_mas",
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
                        //Nos redirigimos a la pagina de resultados

                        redirect.toSuitelet({ scriptId: 5848, deploymentId: 1 });

                    } catch (error) {
                        log.error("onRequest POST", error);
                    }
                }
            } catch (e) {
                log.error("onRequest", e);
            }
        };

        const getFacturasFIN = (cliente, fechaInicio, fechaFin, tipoOS, agrupador, flag, currency, tipoGenerador, tipodocValue) => {
            try {
                let respuesta = new Array();
                let agrup = agrupador != "" ? agrupador : "%";
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
                if (tipoGenerador == 'MAF') {
                    var filters = [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["trandate", "within", newfechaInicio, newfechaFin],
                        "AND",
                        ["currency", "anyof", currency],
                        "AND",
                        ["item", "noneof", "@NONE@"],
                        "AND",
                        ["custbody_fac_maf", "is", "T"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["amount", "notequalto", 0],
                        "AND",
                        ["custcol_ht_fac_agru", "isempty", ""],
                        "AND",
                        [
                            ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 1],
                            "OR",
                            ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 4],
                            "OR",
                            ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 7],
                        ]
                    ];
                    if (cliente && cliente !== "") {
                        filters.push("AND", ["entity", "anyof", cliente]);
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
                            search.createColumn({ name: "custbody_ht_facturar_a" }),
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "displayname", join: "item", label: "Display Name" }),
                            search.createColumn({ name: "symbol", join: "Currency", label: "Symbol" })
                        ],
                    });
                } else if (tipoGenerador == 'MOVILIZA') {

                    var filters = [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["trandate", "within", newfechaInicio, newfechaFin],
                        "AND",
                        ["currency", "anyof", currency],
                        "AND",
                        ["custbody_fac_moviliza", "is", "T"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["amount", "notequalto", 0],
                        'AND',
                        ['status', 'anyof', 'SalesOrd:B'],
                        "AND",
                        [
                            ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 1],
                            "OR",
                            ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 4],
                            "OR",
                            ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 7],
                        ]
                    ];
                    if (cliente && cliente !== "") {
                        filters.push("AND", ["entity", "anyof", cliente]);
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
                            search.createColumn({ name: "custbody_ht_facturar_a" }),
                            search.createColumn({ name: "fxamount" }),
                            search.createColumn({ name: "approvalstatus" }),
                            search.createColumn({ name: "symbol", join: "Currency", label: "Symbol" })
                        ],
                    });
                }

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
                                factura: result.getText({ name: "custbody_ht_facturar_a" }),
                                monto: (tipoGenerador == 'MOVILIZA' ? result.getValue({ name: "fxamount" }) : result.getValue({ name: "fxgrossamount" })),
                                estado: result.getText({ name: "approvalstatus" }),
                                memo: (tipoGenerador == 'MAF' || tipoGenerador == 'MOVILIZA' ? '' : result.getValue({ name: "custbody_ht_cod_agru" })),
                                nro_cuota: (tipoGenerador == 'MAF' || tipoGenerador == 'MOVILIZA' ? '' : result.getValue({ name: "custbody_ec_nro_cuota_fac_int" })),
                                creado_desde: (tipoGenerador == 'MAF' || tipoGenerador == 'MOVILIZA' ? '' : result.getValue({ name: "custbody_ec_created_from_fac_int" })),
                                creado_desde_text: (tipoGenerador == 'MAF' || tipoGenerador == 'MOVILIZA' ? '' : result.getText({ name: "custbody_ec_created_from_fac_int" })),
                                items: (tipoGenerador == 'MOVILIZA' ? '' : result.getValue({ name: "item", })),
                                itemsName: (tipoGenerador == 'MOVILIZA' ? '' : result.getValue({ name: "displayname", join: "item", label: "Display Name" })),
                                currencyName: result.getValue({ name: "symbol", join: "Currency", label: "Symbol" }),

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

        const getFacturasLineasFIN = (cliente, fechaInicio, fechaFin, tipoOS, agrupador, currency, tipo_generado, tipodocValue) => {
            try {

                let respuesta = [];
                let agrup = agrupador != "" ? agrupador : "%";
                var invoiceSearchObj;

                if (tipo_generado == 'MAF' || tipo_generado == 'MOVILIZA') {
                    var filters = [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["currency", "anyof", currency],
                        "AND",
                        ["trandate", "within", fechaInicio, fechaFin],
                        "AND",
                        ["item", "noneof", "@NONE@"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["custbody_ht_facturar_a.custentity_pe_code_document_type", "startswith", tipodocValue == 50 ? 6 : 1]
                    ];
                    if (cliente && cliente !== "") {
                        filters.push("AND", ["entity", "anyof", cliente]);
                    }
                    invoiceSearchObj = search.create({
                        type: "transaction",
                        filters: filters,
                        columns: [
                            //Datos Cabecera
                            search.createColumn({ name: "internalid", label: "ID interno" }),
                            search.createColumn({ name: "tranid", label: "Número de documento", }),
                            search.createColumn({ name: "entity", label: "cliente", }),
                            search.createColumn({ name: "custbody_ht_so_bien", label: "Bien" }),
                            search.createColumn({ name: "department", label: "Departamento" }),
                            search.createColumn({ name: "class", label: "Clase" }),
                            search.createColumn({ name: "location", label: "Oficina" }),
                            search.createColumn({ name: "item", label: "Artículo" }),
                            search.createColumn({ name: "itemid", join: "item", label: "Nombre Articulo", }),
                            search.createColumn({ name: "quantityuom", label: "Cantidad" }),
                            search.createColumn({ name: "unitid", label: "Unidad" }),
                            search.createColumn({ name: "taxcode", label: "Artículo de impuesto sobre las ventas", }),
                            search.createColumn({ name: "pricelevel", label: "Nivel de Precio", }),
                            search.createColumn({ name: "displayname", join: "item", label: "Display Name" }),
                            search.createColumn({ name: "itemtype", label: "itemType" }),
                            search.createColumn({ name: "rate", label: "Tarifa" }),
                            search.createColumn({ name: "fxrate", label: "fxrate" }),
                            search.createColumn({ name: "custbody_ht_facturar_a" }),
                            search.createColumn({ name: "line", label: "Línea del artículo" })
                        ],
                    });
                }


                invoiceSearchObj.run().each(function (result) {

                    let objFacturas = {
                        id: result.getValue({ name: "internalid" }),
                        numero: result.getValue({ name: "tranid" }),
                        bien: result.getValue({ name: "custbody_ht_so_bien" }),
                        departamento: result.getValue({ name: "department" }),
                        clase: result.getValue({ name: "class" }),
                        oficina: result.getValue({ name: "location" }),
                        aseguradora: (tipo_generado == 'MAF' ? '' : result.getValue({ name: "custbody_ht_os_companiaseguros", })),
                        concesionario: (tipo_generado == 'MAF' ? '' : result.getValue({ name: "custbody_ht_os_concesionario", })),
                        financiera: (tipo_generado == 'MAF' ? '' : result.getValue({ name: "custbody_ht_os_bancofinanciera", })),
                        item: result.getValue({ name: "item" }),
                        item_f: (tipo_generado == 'MAF' ? '' : result.getValue({ name: "custitem_ec_item_agrupado", join: "item", })),
                        nombreItem: result.getValue({ name: "itemid", join: "item" }),
                        cantidad: result.getValue({ name: "quantityuom" }),
                        unidad: result.getValue({ name: "unitid" }),
                        taxcode: result.getValue({ name: "taxcode" }),
                        tipo_generado: tipo_generado,
                        price: result.getValue({ name: "pricelevel" }),
                        cliente: result.getValue({ name: "custbody_ht_facturar_a" }),
                        rate: result.getValue({ name: "fxrate" }),
                        itemtype: result.getValue({ name: "itemtype", label: "itemType" }),
                        itemsName: result.getValue({ name: "displayname", join: "item", label: "Display Name" }),
                        linea: result.getValue({ name: "line", label: "Línea del artículo" }),
                    };
                    respuesta.push(objFacturas);
                    return true;
                });
                return respuesta;
            } catch (error) {
                log.error("getFacturasLineasFIN", error);
            }
        };

        const agregarCola = (params) => {
            try {
                let createCola = record.create({
                    type: "customrecord_ts_standar_ss_cola_maf_mov",
                    isDynamic: true,
                });
                createCola.setValue({ fieldId: "name", value: "Agrupacion Factura OS" });
                //createCola.setValue({ fieldId: 'custrecord_ts_ss_parametros', value: JSON.stringify(params) });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_estado_mm",
                    value: "pendiente",
                });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_creado_por_mm",
                    value: params.usuario,
                });
                createCola.setValue({
                    fieldId: "custrecord_ts_ss_fecha_inicio_mm",
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
                    type: "customrecord_ts_log_ejec_agrup_fact_mm",
                    isDynamic: true,
                });
                cabLog.setValue({ fieldId: "name", value: "Agrupacion de Facturas" });
                cabLog.setValue({ fieldId: "custrecord_ts_estado_mm", value: "pendiente" });
                cabLog.setValue({ fieldId: "custrecord_ts_porcentaje_mm", value: "0%" });
                cabLog.setValue({
                    fieldId: "custrecord_ts_cliente_mm",
                    value: params.cliente,
                });
                cabLog.setValue({
                    fieldId: "custrecord_ts_agrupador_mm",
                    value: params.agrupador,
                });
                cabLog.setValue({
                    fieldId: "custrecord_ts_fecha_inicio_mm",
                    value: new Date(),
                });
                if (params.usuario) {
                    cabLog.setValue({
                        fieldId: "custrecord_ts_creado_por_mm",
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
