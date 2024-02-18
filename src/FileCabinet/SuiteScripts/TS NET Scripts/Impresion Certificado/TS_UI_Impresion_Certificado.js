/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/ui/serverWidget', 'N/record', 'N/render', 'N/file', 'N/search', 'N/runtime', 'N/format', 'N/email','N/url'],

    function (serverWidget, record, render, file, search, runtime, format, email, url) {

        //ftl
        const TEMPLATE_CERTIFICADO_INSTALACION_ID = "./TS_FTL_Impresion_Certificado_Instalacion.ftl";
        const TEMPLATE_CERTIFICADO_PROPIEDAD_ID = "./TS_FTL_Impresion_Certificado_Propiedad.ftl";
        const TEMPLATE_CERTIFICADO_PROPIEDAD_ROJO_GENE = "./TS_FTL_Impresion_Certificado_Propiedad_Rojo_General.ftl";
        const TEMPLATE_CERTIFICADO_PROPIEDAD_AZUL = "./TS_FTL_Impresion_Certificado_Propiedad_Azul.ftl";
        const TEMPLATE_CERTIFICADO_PROPIEDAD_BRANDEADOS = "./TS_FTL_Impresion_Certificado_Propiedad_Ambacar.ftl";
        const TEMPLATE_CERTIFICADO_PROPIEDAD_LEADER = "./TS_FTL_Impresion_Certificado_Propiedad_Leader.ftl"
        const TEMPLATE_CERTIFICADO_PROPIEDAD_ROJO_CONV = "./TS_FTL_Impresion_Certificado_Propiedad_Rojo_Convenio.ftl";

        //Imagen
        const Leader_Link_cabecera = "./Imagen_de_Certificados/Leader_Link_cabecera.jpg";
        const Rojo_Ambarca_cabecera = "./Imagen_de_Certificados/Rojo_Ambarca_cabecera.jpg";
        const Rojo_General_cabecera = "./Imagen_de_Certificados/Rojo_General_cabecera.jpg";
        const Rojo_General_piePagina = "./Imagen_de_Certificados/Rojo_General_piePagina.jpg";
        const Azul_Carsec = "./Imagen_de_Certificados/Carsec.jpg";
        const Azul_Hunter_Monitoreo = "./Imagen_de_Certificados/Hunter_Monitoreo.jpg";

        const onRequest = (context) => {
            try {
                log.error("onRequest", "onRequest");

                if (context.request.method == 'GET') {
                    log.error("GET", "Get");
                    let jsonTemplate = {};
                    let { type, workOrder } = context.request.parameters;
                    log.error("Params", { workOrder, type });
                    jsonTemplate = getDataForTemplate(workOrder);
                    log.error("jsonTemplate", jsonTemplate);

                    let convenio_OS = jsonTemplate.workOrder.convenio;
                    let email = jsonTemplate.workOrder.custrecord_ht_ot_correocliente;
                    let idOV = jsonTemplate.workOrder.saleordenID;
                    let tipoConv = Conven(convenio_OS);
                    log.error("tipoConv", tipoConv);
                    if(tipoConv != '' && tipoConv != null){
                        tipoConv = tipoConv.toLowerCase();
                    }
                    let certificadoPropie = TEMPLATE_CERTIFICADO_PROPIEDAD_ID;

                    log.error("tipoConv", tipoConv);
                    if (tipoConv == 'convenio galmack' || tipoConv == 'maresa' || tipoConv == 'autolider' ||
                        tipoConv == 'consorcio pichincha' || tipoConv == 'motorplan' || tipoConv == 'no convenios/contados' ||
                        tipoConv == 'vehicentro sin convenio') {
                        certificadoPropie = TEMPLATE_CERTIFICADO_PROPIEDAD_ROJO_GENE;//Rojo General
                        log.error("1", "1");
                    } else if (tipoConv == 'convenio galarmobil' || tipoConv == 'no convenios/contados' || tipoConv == 'peugeot' || tipoConv == 'changan') {
                        certificadoPropie = TEMPLATE_CERTIFICADO_PROPIEDAD_AZUL;//Azul
                        log.error("2", "2");
                    } else if (tipoConv == 'convenio ambacar') {
                        certificadoPropie = TEMPLATE_CERTIFICADO_PROPIEDAD_BRANDEADOS;//Ambacar
                        log.error("3", "3");
                    } else if (tipoConv == 'lader'){
                        certificadoPropie = TEMPLATE_CERTIFICADO_PROPIEDAD_LEADER;//Leader
                        log.error("4", "4");
                    } else if (tipoConv == 'toyota del ecuador' || tipoConv == 'convenio induauto' || tipoConv == 'convenio suzuki' ||
                        tipoConv == 'vehicentro convenio') {
                        certificadoPropie = TEMPLATE_CERTIFICADO_PROPIEDAD_ROJO_CONV;//Rojos Convenio
                        log.error("5", "5");
                    }
                    
                    log.error("certificadoPropie", certificadoPropie);
                    
                    let pdf = "";
                    if (type == "instalacion") {
                        pdf = renderPDF(TEMPLATE_CERTIFICADO_INSTALACION_ID, jsonTemplate, type);
                    } else if (type == "propiedad") {
                        pdf = renderPDF(certificadoPropie, jsonTemplate, type);
                    }

                    envia_email(email, pdf.fileId, idOV);

                    context.response.renderPdf(pdf.result);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }

        const getDataForTemplate = (workOrderId) => {
            let workOrder = getWorkOrder(workOrderId);
            log.error('workOrder.custrecord_ht_ot_vehiculo',workOrder.custrecord_ht_ot_vehiculo);
            let cobertura = getCobertura(workOrder.custrecord_ht_ot_vehiculo, workOrder.custrecord_ht_ot_cliente_id, workOrder.custrecord_ht_ot_item, workOrder.custrecord_ht_ot_serieproductoasignacion);
            log.error("cobertura", cobertura);
            let subsidiary = getSubsidiary(workOrder.subsidiary);
            let location = getLocation(workOrder.location);
            let customer = getCustomer(workOrder.custrecord_ht_ot_cliente_id);
            let imagen = getImagen();
            let data = getData();
            return {
                workOrder,
                cobertura,
                subsidiary,
                location,
                customer,
                imagen,
                data
            }
        }

        const getWorkOrder = (workOrderId) => {
            let workOrder = search.lookupFields({
                type: "customrecord_ht_record_ordentrabajo",
                id: workOrderId,
                columns: [
                    "custrecord_ht_ot_vehiculo",
                    "custrecord_ht_ot_cliente_id",
                    "custrecord_ht_ot_item",
                    "custrecord_ht_ot_item.displayname",
                    "custrecord_ht_ot_serieproductoasignacion",
                    "custrecord_ht_ot_taller.custrecord_ht_tt_oficina",
                    "custrecord_ht_ot_placa",
                    "custrecord_ht_ot_marca",
                    "custrecord_ht_ot_modelobien",
                    "custrecord_ht_ot_fechatrabajoasignacion",
                    "custrecord_ht_ot_horatrabajoasignacion",
                    "custrecord_ht_ot_orden_servicio.tranid",
                    "custrecord_ht_ot_orden_servicio.subsidiary",
                    "custrecord_ht_ot_tipo",
                    "custrecord_ht_ot_color",
                    "custrecord_ht_ot_motor",
                    "custrecord_ht_ot_vehiculo.custrecord_ht_bien_ano",
                    "custrecord_ht_ot_chasis",
                    "custrecord_ht_ot_correocliente",
                    "custrecord_ht_ot_orden_servicio.custbody_ht_os_convenio",
                    "custrecord_ht_ot_orden_servicio.internalid",
                    "custrecord_ht_ot_orden_servicio.total"
                ]
            });
            let result = {};
            result.custrecord_ht_ot_vehiculo = workOrder.custrecord_ht_ot_vehiculo.length ? workOrder.custrecord_ht_ot_vehiculo[0].value : "";
            result.custrecord_ht_ot_cliente_id = workOrder.custrecord_ht_ot_cliente_id.length ? workOrder.custrecord_ht_ot_cliente_id[0].value : "";
            result.custrecord_ht_ot_item = workOrder.custrecord_ht_ot_item.length ? workOrder.custrecord_ht_ot_item[0].value : "";
            result.producto = workOrder["custrecord_ht_ot_item.displayname"];
            result.custrecord_ht_ot_serieproductoasignacion = workOrder.custrecord_ht_ot_serieproductoasignacion.length ? workOrder.custrecord_ht_ot_serieproductoasignacion[0].text : "";
            result.custrecord_ht_ot_placa = workOrder.custrecord_ht_ot_placa;
            result.custrecord_ht_ot_marca = workOrder.custrecord_ht_ot_marca.length ? workOrder.custrecord_ht_ot_marca[0].text : "";
            result.custrecord_ht_ot_modelobien = workOrder.custrecord_ht_ot_modelobien.length ? workOrder.custrecord_ht_ot_modelobien[0].text : "";
            result.subsidiary = workOrder["custrecord_ht_ot_orden_servicio.subsidiary"].length ? workOrder["custrecord_ht_ot_orden_servicio.subsidiary"][0].value : "";
            result.location = workOrder["custrecord_ht_ot_taller.custrecord_ht_tt_oficina"].length ? workOrder["custrecord_ht_ot_taller.custrecord_ht_tt_oficina"][0].value : "";
            result.tranid = workOrder["custrecord_ht_ot_orden_servicio.tranid"];
            result.custrecord_ht_ot_tipo = workOrder.custrecord_ht_ot_tipo.length ? workOrder.custrecord_ht_ot_tipo[0].text : "";
            result.custrecord_ht_ot_color = workOrder.custrecord_ht_ot_color.length ? workOrder.custrecord_ht_ot_color[0].text : "";
            result.custrecord_ht_ot_motor = workOrder.custrecord_ht_ot_motor;
            result.anio = workOrder["custrecord_ht_ot_vehiculo.custrecord_ht_bien_ano"];
            result.custrecord_ht_ot_chasis = workOrder.custrecord_ht_ot_chasis;
            result.custrecord_ht_ot_correocliente = workOrder.custrecord_ht_ot_correocliente;
            result.convenio = workOrder["custrecord_ht_ot_orden_servicio.custbody_ht_os_convenio"].length ? workOrder["custrecord_ht_ot_orden_servicio.custbody_ht_os_convenio"][0].text : "";
            result.saleordenID = workOrder["custrecord_ht_ot_orden_servicio.internalid"].length ? workOrder["custrecord_ht_ot_orden_servicio.internalid"][0].value : "";;
            result.total = workOrder["custrecord_ht_ot_orden_servicio.total"];
            return result;
        }

        const getCobertura = (assetId, customerId, itemId, serie) => {
            log.error("assetId", assetId);
            log.error("customerId", customerId);
            log.error("itemId", itemId);
            log.error("serie", serie);
            let coberturaSearchResult = search.create({
                type: "customrecord_ht_co_cobertura",
                filters: [
                    ["custrecord_ht_co_bien", "anyof", assetId],
                    "AND",
                    ["custrecord_ht_co_propietario", "anyof", customerId],
                    "AND",
                    ["custrecord_ht_co_producto", "anyof", itemId],
                    "AND",
                    ["custrecord_ht_co_numeroserieproducto.name", "is", serie]
                ],
                columns: [
                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_co_estado_cobertura", label: "HT CO Estado Cobertura" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturainicial}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturafinal}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturainicial" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturafinal" })
                ]
            }).run().getRange(0, 10);

            let result = {
                name: "",
                custrecord_ht_co_estado_cobertura: "",
                custrecord_ht_co_coberturainicial: "",
                custrecord_ht_co_coberturafinal: "",
                custrecord_ht_co_coberturainicialtext: "",
                custrecord_ht_co_coberturafinaltext: "",
            };

            log.error("coberturaSearchResult.length", coberturaSearchResult.length);

            if (!coberturaSearchResult.length) return result;
            let columns = coberturaSearchResult[0].columns;
            return {
                name: coberturaSearchResult[0].getValue("name"),
                custrecord_ht_co_estado_cobertura: coberturaSearchResult[0].getText("custrecord_ht_co_estado_cobertura"),
                custrecord_ht_co_coberturainicialtext: coberturaSearchResult[0].getValue(columns[2]),
                custrecord_ht_co_coberturafinaltext: coberturaSearchResult[0].getValue(columns[3]),
                //custrecord_ht_co_coberturainicial: format.parse({ value: coberturaSearchResult[0].getValue(columns[4]), type: format.Type.DATE }),
                //custrecord_ht_co_coberturafinal: format.parse({ value: coberturaSearchResult[0].getValue(columns[5]), type: format.Type.DATE })
                custrecord_ht_co_coberturainicial: coberturaSearchResult[0].getValue(columns[4]),
                custrecord_ht_co_coberturafinal: coberturaSearchResult[0].getValue(columns[5])

            };
        }

        const getSubsidiary = (subsidiaryId) => {
            let subsidiary = search.lookupFields({
                type: "subsidiary",
                id: subsidiaryId,
                columns: ["legalname"]
            });

            return subsidiary;
        }

        const getLocation = (locationId) => {
            let location = search.lookupFields({
                type: "location",
                id: locationId,
                columns: ["name"]
            });

            return location;
        }

        const getCustomer = (customerId) => {

            let result = {};

            let customer = search.lookupFields({
                type: "customer",
                id: customerId,
                columns: [
                    "custentity_ht_cl_primernombre",
                    "custentity_ht_cl_segundonombre",
                    "custentity_ht_cl_apellidopaterno",
                    "custentity_ht_cl_apellidomaterno",
                    "companyname",
                    "isperson"
                ]
            });

            let companyname = customer.companyname;
            if(customer.isperson == true){
                companyname = customer.custentity_ht_cl_primernombre + ' ' + customer.custentity_ht_cl_segundonombre + ' ' + 
                                customer.custentity_ht_cl_apellidopaterno + ' ' + customer.custentity_ht_cl_apellidomaterno;
            }

            result.companyname = companyname;
            return result;
        }

        const renderPDF = (templateId, json, type) => {
            let fileContents = file.load({ id: templateId }).getContents();
            let idFolder = getFolderId('TS NET Scripts');
            log.error('fileContents', fileContents);
            log.error('idFolder', idFolder);
            let fileName = 'Certificado de ' + type;

            let renderer = render.create();
            renderer.templateContent = fileContents;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: json
            });
            result = renderer.renderAsString();
            result.replace(/&/g,'&amp;');
            let myFileObj = render.xmlToPdf({
                xmlString: result
            });

            myFileObj.name = fileName;
            myFileObj.folder = idFolder;

            var fileId = myFileObj.save();
            log.error('fileId', fileId);

            return {
                result,
                fileId
            }

            //return myFileObj.getContents();
        }

        function getFolderId(folderName) {
            var ResultSet = search.create({
                type: 'folder',
                filters: ['name', 'is', folderName],
                columns: ['internalid']
            });

            objResult = ResultSet.run().getRange(0, 1);

            if (objResult.length != 0) {
                return objResult[0].id;
            } else {
                return null;
            }
        }

        //relate record
        const envia_email = (correo, id, recordId) => {
            try {
                var fileObj = file.load({
                    id: id
                });
                log.error('recordId',recordId);
                recordId = Number(recordId);
                var author = runtime.getCurrentUser();
                var subject = 'Certificado pdf';
                var authorId = author.id;
                var recipientEmail = correo;
                email.send({
                    author: authorId,
                    recipients: recipientEmail,
                    subject: subject,
                    body: 'Certificado PDF',
                    attachments: [fileObj],
                    relatedRecords: {
                        transactionId: recordId
                    }
                });

                file.delete({
                    id: id
                });
            } catch (error) {
                log.error('error', error);
            }
        }

        function Conven(NombreConvenio) {

            let nombre = NombreConvenio.split(' - ');
            return nombre[1];
        }

        function getImagen() {

            var host = url.resolveDomain({
                hostType: url.HostType.APPLICATION,
                accountId: runtime.accountId
            });
            
            var fileUrl = 'https://' + host;

            let result = {};

            let L_Link_cabecera = fileUrl + file.load({ id: Leader_Link_cabecera }).url;
            let R_Ambarca_cabecera = fileUrl + file.load({ id: Rojo_Ambarca_cabecera }).url;
            let R_General_cabecera = fileUrl + file.load({ id: Rojo_General_cabecera }).url;
            let R_General_piePagina = fileUrl + file.load({ id: Rojo_General_piePagina }).url;
            let A_Carsec = fileUrl + file.load({ id: Azul_Carsec }).url;
            let A_Hunter_Monitoreo = fileUrl + file.load({ id: Azul_Hunter_Monitoreo }).url;
            

            log.error('L_Link_cabecera',L_Link_cabecera.replace(/&/g, '&amp;'));
            log.error('R_Ambarca_cabecera',R_Ambarca_cabecera.replace(/&/g, '&amp;'));
            log.error('R_General_cabecera',R_General_cabecera.replace(/&/g, '&amp;'));
            log.error('R_General_piePagina',R_General_piePagina.replace(/&/g, '&amp;'));
            log.error('A_Carsec',A_Carsec.replace(/&/g, '&amp;'));
            log.error('A_Hunter_Monitoreo',A_Hunter_Monitoreo.replace(/&/g, '&amp;'));

            //replace('&', '&amp;')).replace('>', '&gt;')).replace('<', '&lt;');

            result.L_Link_cabecera = L_Link_cabecera.replace(/&/g,'&amp;');
            result.R_Ambarca_cabecera = R_Ambarca_cabecera.replace(/&/g, '&amp;');
            result.R_General_cabecera = R_General_cabecera.replace(/&/g, '&amp;');
            result.R_General_piePagina = R_General_piePagina.replace(/&/g, '&amp;');
            result.A_Carsec = A_Carsec.replace(/&/g, '&amp;');
            result.A_Hunter_Monitoreo = A_Hunter_Monitoreo.replace(/&/g, '&amp;');
            return result;
        }

        function getData() {

            let result = {};

            var fecha = new Date()
            var MM = fecha.getMonth() + 1;
            var AAAA = fecha.getFullYear();
            var DD = fecha.getDate();

            if (DD.length == 1) {
                DD = '0' + DD;
            }

            if (MM.length == 1) {
                MM = '0' + MM;
            }

            result.period = DD + '/' + MM + '/' + AAAA;

            return result;
        }

        return {
            onRequest
        };
    });