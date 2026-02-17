/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */
define(['N/config', 'N/email', 'N/encode', 'N/file', 'N/format', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/log'],
    /**
     * @param{config} config
     * @param{email} email
     * @param{encode} encode
     * @param{file} file
     * @param{format} format
     * @param{https} https
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    /**
    * @param {Object} pluginContext
.   * @param {String} pluginContext.content
    * @param {String} pluginContext.transactionInfo.transactionId
    * @param {String} pluginContext.transactionInfo.transactionType
    * @param {Number} pluginContext.userId
    * @returns {Object} result
    * @returns {string} result.success
    * @returns {String} result.message
    */

    function (config, email, encode, file, format, https, record, runtime, search, log) {
        var FOLDER_PDF = 604;          //SB: 513   PR: 604 - ok
        var internalId = '';
        var userId = '';
        var FORMA_PAGO_CREDITO = 2;
        var REASON_AUMENTO_DE_VALOR = 4;
        var FACTURA = 1;
        var BOLETA = 3;
        var NOTA_CREDITO = 7;
        var NOTA_DEBITO = 8;
        var GUIA_REMISION = 9;

        function validate(pluginContext) {
            log.debug({
                title: 'Custom Log - Debug',
                details: 'This is a debug message.'
            });
            var result = { success: false, message: "Validation failed." };
            try {
                var transactionId = pluginContext.transactionInfo.transactionId;
                var tranType = pluginContext.transactionInfo.transactionType
                var response;
                switch (tranType) {
                    case 'invoice':
                        response = createRequest(transactionId, tranType, 'CustInvc');
                        break;
                    case 'creditmemo':
                        response = createRequestCreditMemo(transactionId);
                        break;
                    case 'cashsale':
                        response = createRequest(transactionId, tranType, 'CashSale');
                        break;
                    case 'vendorcredit':
                        response = createRequestVendorCredit(transactionId);
                        break;
                    case 'itemfulfillment':
                        response = createRequestItemsFul(transactionId);
                        break;
                    default:
                        result.success = false;
                        result.message = 'Tracacción no válida';
                        return result;
                }
                result.success = true;
                result.message = response;
                return result;
            } catch (error) {
                result.success = false;
                result.message = "Val " + error.message;
            }
            return result;
        }
        function createRequestItemsFul(documentid) {
            var trace = 'Actividad 1';
            try {

                var itemfulfillmentSearchObj = search.create({
                    type: "itemfulfillment",
                    filters:
                        [
                            ["type", "anyof", "ItemShip"],
                            "AND",
                            ["internalid", "anyof", documentid]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "internalid", join: "createdFrom", label: "Internal ID" }),
                            search.createColumn({ name: "memo", label: "Memo" }),
                            search.createColumn({ name: "internalid", join: "customerMain", label: "Internal ID" }),
                            search.createColumn({ name: "custbody_pe_serie", label: "PE Serie" }),
                            search.createColumn({ name: "name", join: "custbody_pe_delivery_information", label: "name" }),
                            search.createColumn({ name: "custbody_pe_reason_details" }),
                            search.createColumn({ name: "custbody_pe_peso_tn" }),
                            search.createColumn({ name: "custrecord_pe_motivo_traslado", join: "custbody_pe_modalidad_de_traslado", label: "modalidad" }),
                            search.createColumn({ name: "custrecord_pe_motivo_de_traslado", join: "custbody_pe_motivos_de_traslado", label: "motivo" }),
                            search.createColumn({ name: "custbody_pe_ruc_vendor" }),
                            search.createColumn({ name: "custbody_pe_fecha_inicio_traslado" }),
                            search.createColumn({ name: "custbody_pe_number", label: "PE Nombre" }),
                            search.createColumn({ name: "custbody_pe_ubigeo_punto_partida" }),
                            search.createColumn({ name: "custbody_pe_ubigeo_punto_llegada" }),
                            search.createColumn({ name: "custbody_pe_driver_license" }),
                            search.createColumn({ name: "custbody_pe_car_plate" }),
                            search.createColumn({ name: "custbody_pe_driver_document_number" }),
                            search.createColumn({ name: "custbody_pe_driver_name" }),
                            search.createColumn({ name: "custbody_pe_driver_last_name" }),
                            search.createColumn({ name: "custbody_pe_numero_de_registro_mtc" }),
                            search.createColumn({ name: "custbody_pe_num_autorizacion_principal" }),
                            search.createColumn({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_llegada", label: "llegada" }),
                            search.createColumn({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "partida" }),
                            search.createColumn({ name: "custbody_pe_delivery_address" }),
                            search.createColumn({ name: "custrecord_pe_cod_establishment_annex", join: "custbody_pe_location_source", label: "codigoEstablecimiento" }),//3
                            search.createColumn({ name: "custbody_pe_source_address" }),
                            search.createColumn({ name: "custbody_pe_document_number_ref", label: "Número Documento de Referencia" }),
                            search.createColumn({ name: "custbody_pefechadeentregareal" }),
                            search.createColumn({ name: "custbody_pe_document_series_ref", label: "Serie de Referencia" }),
                            search.createColumn({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type_ref", label: "codigo" }),//3
                            search.createColumn({ name: "name", join: "custbody_pe_document_type_ref", label: "name" }),
                            //<I> rhuaccha: 2024-04-26
                            search.createColumn({ name: "custrecord_pe_code_operation_type", join: "CUSTBODY_PE_OPERATION_TYPE", label: "operationType" }),
                            search.createColumn({ name: "internalid", join: "CUSTBODY_PE_EMPRESA_ADUANERA", label: "IDInterno" }),
                            //<F> rhuaccha: 2024-04-26 -- index 32
                            //&Inicio - dfernandez - 09/05/2024
                            search.createColumn({ name: "otherrefnum", join: "createdFrom", label: "Orden de Compra" }),
                            search.createColumn({ name: "custrecord_pe_driver_address", join: "custbody_pe_delivery_information", label: "Domicilio de Transporte" }),
                            search.createColumn({ name: "custrecord_pe_car_brand", join: "custbody_pe_delivery_information", label: "Marca de Vehículo" }),
                            search.createColumn({ name: "recordType", join: "createdFrom", label: "Tipo de Registro" }),
                            search.createColumn({ name: "custbody_pe_cert_insc_transportista", label: "Certificado Transportista" }),
                            //&Fin - dfernandez - 09/05/2024
                            //&Inicio - dfernandez - 20/05/2024
                            search.createColumn({ name: "custbody_pe_ubicacion_para_serie", label: "PE UBICACIÓN PARA SERIE" }),
                            search.createColumn({ name: "custrecord_pe_direccion_origen", join: "custbody_pe_ubicacion_para_serie", label: "Dirección 1" }),
                            search.createColumn({ name: "terms", join: "createdFrom", label: "Condición" }),
                            search.createColumn({ name: "altname", join: "custbody_pe_empresa_aduanera" }),
                            search.createColumn({ name: "custentity_pe_document_number", join: "custbody_pe_empresa_aduanera" }),
                            search.createColumn({ name: "address1", join: "custbody_pe_empresa_aduanera" }),
                            search.createColumn({ name: "address2", join: "custbody_pe_empresa_aduanera" }),
                            search.createColumn({ name: "country", join: "custbody_pe_empresa_aduanera" }),
                            search.createColumn({ name: "custbody_pe_nro_precinto" }),
                            search.createColumn({ name: "custbody_pe_nro_precinto_2" }),
                            search.createColumn({ name: "custbody_pe_nro_precinto_3" }),
                            search.createColumn({ name: "custbody_pe_nro_precinto_4" }),
                            search.createColumn({ name: "custbody_pe_nro_contenedor" }),
                            search.createColumn({ name: "custbody_pe_nro_contenedor_2" }),
                            search.createColumn({ name: "custrecord_pe_carrete", join: "custbody_pe_delivery_information" }),
                            //&Fin - dfernandez - 05/20/2024

                            //INICIO jEchevarria 31/05/2024 
                            search.createColumn({ name: "custrecord_pe_driver_code_document_num", join: "custbody_pe_conductor" }),
                            search.createColumn({ name: "custentity_pe_document_number", join: "custbody_pe_empresa_aduanera" }),
                            search.createColumn({ name: "custbody_pe_num_bultos" }),

                            //DATOS DEL PUERTO
                            search.createColumn({ name: "custrecord_pe_cod_puerto", join: "custbody_pe_cod_puerto" }),
                            search.createColumn({ name: "custrecord_locationtypecode", join: "custbody_pe_cod_puerto" }),
                            search.createColumn({ name: "custrecord_pe_nombre_puerto", join: "custbody_pe_cod_puerto" }),

                            //DATOS DEL AEREOPUERTO   
                            search.createColumn({ name: "custrecord_pe_cod_aeropuerto", join: "custbody_pe_codigo_aeropuerto" }),
                            search.createColumn({ name: "custrecord_locationtypecodeaero", join: "custbody_pe_codigo_aeropuerto" }),
                            search.createColumn({ name: "custrecord_pe_nombre_aeropuerto", join: "custbody_pe_codigo_aeropuerto" }),

                            //DATOS DEL TIPO DE DOC PARA LA EMPRESA ADUANERA
                            search.createColumn({ name: "custentity_pe_code_document_type", join: "custbody_pe_empresa_aduanera" }),

                            //DATOS PARA AdditionalItemProperty
                            search.createColumn({ name: "custbody_pe_document_series_ref" }),
                            search.createColumn({ name: "custbody_pe_document_number_ref" }),

                            //DATOS PARA Item
                            search.createColumn({ name: "name", join: "custbody_pe_motivos_de_traslado" }),
                            search.createColumn({ name: "custrecord_pe_company_name", join: "custbody_pe_delivery_information", label: "name" }),
                            //FIN jEchevarria 31/05/2024
                            search.createColumn({ name: "internalid", join: "customer", label: "InternalID" }), //<I> rhuaccha: 2024-09-13
                            search.createColumn({ name: "createdfrom", label: "CreatedFromId" }), //<I> rhuaccha: 2024-10-14
                        ]
                });

                var searchResultitemfulfillment = itemfulfillmentSearchObj.run().getRange({ start: 0, end: 200 });
                var modalidad = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_traslado", join: "custbody_pe_modalidad_de_traslado", label: "modalidad" });
                var salesorderitems = searchResultitemfulfillment[0].getValue({ name: "internalid", join: "createdFrom", label: "Internal ID" });
                var Peserie = searchResultitemfulfillment[0].getText({ name: "custbody_pe_serie", label: "PE Serie" }) + "-" + searchResultitemfulfillment[0].getValue({ name: "custbody_pe_number", label: "PE Nombre" });
                var fechaEmision = searchResultitemfulfillment[0].getValue({ name: "trandate" });
                var fechaEmisionEntrega = searchResultitemfulfillment[0].getValue({ name: "custbody_pefechadeentregareal" });
                var CodigoLocal = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_cod_establishment_annex", join: "custbody_pe_location_source", label: "codigoEstablecimiento" });
                var partida = searchResultitemfulfillment[0].getText({ name: "custbody_pe_ubigeo_punto_partida" });
                var llegada = searchResultitemfulfillment[0].getText({ name: "custbody_pe_ubigeo_punto_llegada" });
                var motivo = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_de_traslado", join: "custbody_pe_motivos_de_traslado", label: "motivo" });
                //Inicio - dfernandez - 20/05/2024
                var otherrefnum = searchResultitemfulfillment[0].getValue({ name: "otherrefnum", join: "createdFrom", label: "Orden de Compra" });
                var domicilioTransporte = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_address", join: "custbody_pe_delivery_information", label: "Domicilio de Transporte" });
                var marcaVehiculo = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_car_brand", join: "custbody_pe_delivery_information", label: "Marca de Vehículo" });
                var tipoRegistroPadre = searchResultitemfulfillment[0].getValue({ name: "recordType", join: "createdFrom", label: "Tipo de Registro" });
                var serieRef = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_document_series_ref", label: "Serie de Referencia" });
                var nroDocRef = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_document_number_ref", label: "Número Documento de Referencia" });
                var docTypeRefCode = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type_ref", label: "codigo" });
                var docTypeRefName = searchResultitemfulfillment[0].getValue({ name: "name", join: "custbody_pe_document_type_ref", label: "name" });
                var sedePlanta = searchResultitemfulfillment[0].getText({ name: "custbody_pe_ubicacion_para_serie", label: "PE UBICACIÓN PARA SERIE" });
                //Cambio Jechevarria 20/06/2024
                var planta = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_direccion_origen", join: "custbody_pe_ubicacion_para_serie", label: "Dirección 1" });
                if (planta) {
                    //quitamos los saltos de linea
                    planta = planta.replace(/(\r\n|\n|\r)/gm, " ");
                }
                var email = "";
                var condicionPago = searchResultitemfulfillment[0].getText({ name: "terms", join: "createdFrom", label: "Condición" });
                var puntoLlegada = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_delivery_address" });
                var razonSocial = searchResultitemfulfillment[0].getValue({ name: "altname", join: "custbody_pe_empresa_aduanera" });
                var rucProv = searchResultitemfulfillment[0].getValue({ name: "custentity_pe_document_number", join: "custbody_pe_empresa_aduanera" }); // MD1
                var direccionProv = searchResultitemfulfillment[0].getValue({ name: "address1", join: "custbody_pe_empresa_aduanera" }) + "-" + searchResultitemfulfillment[0].getValue({ name: "address2", join: "custbody_pe_empresa_aduanera" }) + "-" + searchResultitemfulfillment[0].getText({ name: "country", join: "custbody_pe_empresa_aduanera" });
                var cleanedData = direccionProv.replace(/-/g, '').replace(/\s/g, '');
                var precinto1 = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_nro_precinto" });
                var precinto2 = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_nro_precinto_2" });
                var precinto3 = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_nro_precinto_3" });
                var precinto4 = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_nro_precinto_4" });
                var contenedor1 = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_nro_contenedor" });
                var contenedor2 = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_nro_contenedor_2" });
                var carreta = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_carrete", join: "custbody_pe_delivery_information" });
                //Fin - dfernandez - 20/05/2024
                //<I> rhuaccha: 2024-04-26
                var operationType = Number(nvl(searchResultitemfulfillment[0].getValue(itemfulfillmentSearchObj.columns[32]), ''));
                var empAduaId = nvl(searchResultitemfulfillment[0].getValue(itemfulfillmentSearchObj.columns[33]), '');
                var customerId = searchResultitemfulfillment[0].getValue(itemfulfillmentSearchObj.columns[68]); //<I> rhuaccha: 2024-09-13
                const EXPORT_CODE = 17;
                var empAduanera;

                log.debug('Tipo de operación: ' + operationType, 'Empresa Aduanera: ' + empAduaId);
                if (operationType === EXPORT_CODE) {

                    empAduanera = getEmpAduaneraDetails(empAduaId, documentid);


                } else {
                    empAduanera = {
                        status: true,
                        message: '-',
                        details: {
                            idProveedor: '',
                            nombreProveedor: '',
                            departamento: '',
                            provincia: '',
                            distrito: '',
                            direccion: '',
                            pais: '',
                            zipCode: '',
                            phone: ''
                        }
                    }
                }
                //<F> rhuaccha: 2024-04-26



                partida = partida.split(':');
                llegada = llegada.split(':');






                var observacion = searchResultitemfulfillment[0].getValue({ name: "memo", label: "Memo" });
                fechaEmision = fechaEmision.split('/');
                fechaEmision = fechaEmision[2] + '-' + padLeft(fechaEmision[1], 2, '0') + '-' + padLeft(fechaEmision[0], 2, '0');
                fechaEmisionEntrega = fechaEmisionEntrega.split('/');
                fechaEmisionEntrega = fechaEmisionEntrega[2] + '-' + padLeft(fechaEmisionEntrega[1], 2, '0') + '-' + padLeft(fechaEmisionEntrega[0], 2, '0');
                var fechatralado = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_fecha_inicio_traslado" });
                fechatralado = fechatralado.split('/');
                fechatralado = fechatralado[2] + '-' + padLeft(fechatralado[1], 2, '0') + '-' + padLeft(fechatralado[0], 2, '0');
                var searchLoad;
                var transferOrden = "";



                searchLoad = search.create({
                    type: "transferorder",
                    filters:
                        [
                            ["type", "anyof", "TrnfrOrd"],
                            "AND",
                            ["internalid", "anyof", salesorderitems]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }),
                            search.createColumn({ name: "taxidnum", join: "subsidiary", label: "taxidnum" }),
                            search.createColumn({ name: "zip", join: "subsidiary", label: "zip" }),
                            search.createColumn({ name: "address1", join: "subsidiary" }),
                            search.createColumn({ name: "city", join: "subsidiary" }),
                            search.createColumn({ name: "transferlocation" }),
                            search.createColumn({ name: "state", join: "subsidiary" }),
                            search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                            search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                            search.createColumn({ name: "entity" }),
                        ]
                });
                var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
                var searchResulttrnas = searchLoad.run().getRange({ start: 0, end: 200 });

                if (searchResult.length != 0) {
                    var getCodigo = search.lookupFields({
                        type: 'location',
                        id: searchResult[0].getValue({ name: "transferlocation" }),
                        columns: ['custrecord_pe_cod_establishment_annex']
                    });
                    var transferOrden = getCodigo.custrecord_pe_cod_establishment_annex;
                }

                if (searchResult.length == 0) {
                    searchLoad = search.create({
                        type: "salesorder",
                        filters:
                            [
                                ["type", "anyof", "SalesOrd"],
                                "AND",
                                ["internalid", "anyof", salesorderitems],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }),
                                search.createColumn({ name: "taxidnum", join: "subsidiary", label: "taxidnum" }),
                                search.createColumn({ name: "zip", join: "subsidiary", label: "zip" }),
                                search.createColumn({ name: "address1", join: "subsidiary" }),
                                search.createColumn({ name: "city", join: "subsidiary" }),
                                search.createColumn({ name: "state", join: "subsidiary" }),
                                search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                                search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                                search.createColumn({ name: "vatregnumber", join: "customer" }),

                                search.createColumn({ name: "internalid" }),
                                search.createColumn({ name: "tranid" }),
                                search.createColumn({ name: "entity" }),
                            ]
                    });
                    var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
                }



                if (searchResult.length == 0) {
                    searchLoad = search.create({
                        type: "vendorreturnauthorization",
                        filters:
                            [
                                ["type", "anyof", "VendAuth"],
                                "AND",
                                ["internalid", "anyof", salesorderitems],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }),
                                search.createColumn({ name: "taxidnum", join: "subsidiary", label: "taxidnum" }),
                                search.createColumn({ name: "zip", join: "subsidiary", label: "zip" }),
                                search.createColumn({ name: "address1", join: "subsidiary" }),
                                search.createColumn({ name: "city", join: "subsidiary" }),
                                search.createColumn({ name: "state", join: "subsidiary" }),
                                search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                                search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                                search.createColumn({ name: "vatregnumber", join: "customer" }),

                                search.createColumn({ name: "internalid" }),
                                search.createColumn({ name: "tranid" }),
                                search.createColumn({ name: "entity" }),
                            ]

                    });
                    var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
                }

                var CustomerInternal = searchResult[0].getValue({ name: "entity" }) || 0;
                log.debug('CustomerInternal', CustomerInternal);
                var searchLoadCustomer = search.create({
                    type: search.Type.ENTITY,
                    filters:
                        [
                            ["internalid", "anyof", CustomerInternal],
                            "AND",
                            ["address.isdefaultshipping", "is", "T"],
                        ],
                    columns:
                        [
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" }),//0
                            search.createColumn({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" }),
                            search.createColumn({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" }),
                            search.createColumn({ name: "city", join: "Address", label: "city" }),
                            search.createColumn({ name: "custrecord_pe_cod_doc_type", join: "custentity_pe_document_type" }),
                            search.createColumn({ name: "address1", join: "address", label: " Address 1" }),
                            search.createColumn({ name: "custentity_pe_document_number" }),
                            search.createColumn({ name: "altname" }),

                            search.createColumn({ name: "email" }),
                            search.createColumn({ name: "country" })

                        ]
                });
                var searchResultCustomer = searchLoadCustomer.run().getRange({ start: 0, end: 1 });
                if (searchResultCustomer.length !== 0) {
                    var column22 = searchResultCustomer[0].getValue({ name: "altname" });
                    var column28 = searchResultCustomer[0].getValue({ name: "country" });
                    email = searchResultCustomer[0].getValue({ name: "email" });
                    var column21 = searchResultCustomer[0].getValue({ name: "custentity_pe_document_number" });
                    var column20 = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_doc_type", join: "custentity_pe_document_type" });

                    var zipCustomer = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" });
                    var column27 = searchResultCustomer[0].getValue({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" });
                    var column26 = searchResultCustomer[0].getValue({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" });
                    var column25 = searchResultCustomer[0].getValue({ name: "city", join: "Address", label: "city" });
                    var column23 = searchResultCustomer[0].getValue({ name: "address1", join: "address", label: " Address 1" });
                }

                var column08 = searchResult[0].getValue({ name: "legalname", join: "subsidiary", label: "10 Legal Name" });
                var column09 = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary", label: "taxidnum" });
                var zip = searchResult[0].getValue({ name: "zip", join: "subsidiary", label: "zip" });
                var column13 = searchResult[0].getValue({ name: "address1", join: "subsidiary" });
                var departamento = searchResult[0].getValue({ name: "city", join: "subsidiary" });
                var column14 = searchResult[0].getValue({ name: "state", join: "subsidiary" });
                var addr2 = searchResult[0].getValue({ name: "address2", join: "subsidiary", label: "address2" });
                var contry = searchResult[0].getValue({ name: "country", join: "subsidiary", label: "country" });

                if (searchResulttrnas.length != 0) {
                    var column21 = column09;
                    var column20 = '6';
                    var column22 = column08;
                    var column25 = departamento;
                    var column26 = column14;
                    var column23 = column13;
                    var column28 = contry;
                    var column27 = addr2;
                }

                var openRecord = record.load({ type: 'itemfulfillment', id: documentid, isDynamic: true });
                var linecount = openRecord.getLineCount({ sublistId: 'item' });
                var Peso = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_peso_tn" });
                Peso = validarYRedondearNumero(Peso);
                var detalleItems = new Array;
                var suma = 0;

                //Inicio Cambio Jechevarria 20/06/2024
                var indice = 0;
                var ItemsTypeData = getAllUnitMesureForItemFul();
                //FIN Cambio Jechevarria 20/06/2024
                for (var i = 0; i < linecount; i++) {
                    var itemType = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                    var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                    var codigo = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemname', line: i });
                    var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    if (itemType === 'Kit') {

                    } else {
                        suma += quantity;
                    }


                    var cantidadLine = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sj_peso_individual_', line: i });
                    var PesoLine = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_gg_peso_', line: i });
                    //Cambio Jechevarria 20/06/2024
                    //Peso = Peso + (parseFloat(quantity) * parseFloat(cantidadLine))
                    var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var note = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'unitsdisplay', line: i });
                    var get_custcol_pe_unidad_base = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_unidad_base', line: i });
                    //buscamos el valor por el name dentro del array

                    var itemNoteType = ItemsTypeData.find(function (element) {
                        return element.Name === get_custcol_pe_unidad_base;
                    });

                    //INICIO Cambio Jechevarria 20/06/2024
                    var getunit = '';


                    var motivo_traslado = searchResultitemfulfillment[0].getValue({ name: "name", join: "custbody_pe_motivos_de_traslado" });
                    var item_busqueda = search.create({
                        type: search.Type.ITEM,
                        filters: [['internalid', 'anyof', item]],
                        columns: [
                            {
                                name: 'custrecord_pe_expo_unit',
                                join: 'custitem_pe_measurement_unit',
                            },
                            {
                                name: 'custitem_pe_cod_measure_unit'
                            },
                            {
                                name: 'unitstype'
                            }
                        ]
                    })
                    var item_datos = item_busqueda.run().getRange({ start: 0, end: 1 });


                    if (motivo_traslado === '09 EXPORTACION') {
                        getunit = item_datos[0].getValue({ name: 'custrecord_pe_expo_unit', join: 'custitem_pe_measurement_unit' })
                    } else {
                        getunit = item_datos[0].getValue({ name: 'custitem_pe_cod_measure_unit' });
                    }


                    var unit = '';

                    if (motivo_traslado === '09 EXPORTACION') {
                        unit = getunit;
                    } else {
                        unit = getunit;
                    }

                    //FIN Cambio Jechevarria 20/06/2024
                    //Inicio - dfernandez - 20/05/2024
                    var pesoTotal = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_sj_peso_total', line: i });
                    //<I> rhuaccha: 2024-08-14
                    if (!isValid(pesoTotal)) {
                        var itemId = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        var itemDet = getItemDetails(itemId);
                        pesoTotal = Number((Number(quantity) * Number(itemDet.peso)).toFixed(2));
                    }
                    //<F> rhuaccha: 2024-08-14

                    if (itemType === 'Kit') {

                    } else {
                        detalleItems.push({
                            "ID": [
                                {
                                    "_": indice + 1
                                }
                            ],
                            "Note": [
                                {
                                    "_": itemNoteType.Abbreviation,
                                },
                                //Inicio - dfernandez - 10/05/2024
                                {
                                    "_": pesoTotal,
                                    "languageID": "H"
                                },
                                //Fin - dfernandez - 10/05/2024



                            ],
                            "DeliveredQuantity": [
                                {
                                    "_": quantity,
                                    "unitCode": unit
                                }
                            ],
                            "OrderLineReference": [
                                {
                                    "LineID": [
                                        {
                                            "_": i + 1
                                        }
                                    ]
                                }
                            ],
                            "Item": [
                                {
                                    "Description": [
                                        {
                                            "_": description
                                        }
                                    ],
                                    "SellersItemIdentification": [
                                        {
                                            "ID": [
                                                {
                                                    "_": codigo
                                                }
                                            ]
                                        }
                                    ]

                                }
                            ]
                        })
                        indice++;
                    }
                }


                var monnetJson;
                monnetJson = {

                    "UBLVersionID": [
                        {
                            "_": "2.1"
                        }
                    ],
                    "CustomizationID": [
                        {
                            "_": "2.0"
                        }
                    ],
                    "ID": [
                        {
                            "_": Peserie
                        }
                    ],
                    "IssueDate": [
                        {
                            "_": fechaEmision,
                        }
                    ],
                    "IssueTime": [
                        {
                            "_": "00:00:00"
                        }
                    ],
                    "DespatchAdviceTypeCode": [
                        {
                            "_": "09"
                        }
                    ],
                    "Note": [
                        {
                            "_": observacion.toUpperCase()
                        }
                    ],
                    "LineCountNumeric": [
                        {
                            "_": linecount
                        }
                    ]
                }


                trace = 'Actividad 2';
                //Inicio - dfernandez - 20/05/2024
                if (planta) var nuevoObjetoNote = { "_": planta, "languageID": "E" }; monnetJson.Note.push(nuevoObjetoNote);
                if (tipoRegistroPadre === SALESORDER) if (otherrefnum) var nuevoObjetoNote = { "_": otherrefnum, "languageID": "F" }; monnetJson.Note.push(nuevoObjetoNote); //monnetJson.Note.splice(1, 0, nuevoObjetoNote);
                if (condicionPago) var nuevoObjetoNote = { "_": condicionPago, "languageID": "G" }; monnetJson.Note.push(nuevoObjetoNote);
                if (domicilioTransporte) var nuevoObjetoNote = { "_": domicilioTransporte.replace(/\n/g, " "), "languageID": "H" }; monnetJson.Note.push(nuevoObjetoNote);
                if (marcaVehiculo) var nuevoObjetoNote = { "_": marcaVehiculo, "languageID": "I" }; monnetJson.Note.push(nuevoObjetoNote);
                var nuevoObjetoNote = { "_": suma, "languageID": "J" }; monnetJson.Note.push(nuevoObjetoNote);
                if (puntoLlegada) var nuevoObjetoNote = { "_": puntoLlegada.replace(/\n/g, " ").replace(/\r/g, ""), "languageID": "K" }; monnetJson.Note.push(nuevoObjetoNote);
                if (razonSocial) var nuevoObjetoNote = { "_": razonSocial, "languageID": "L" }; monnetJson.Note.push(nuevoObjetoNote);
                if (rucProv) var nuevoObjetoNote = { "_": rucProv, "languageID": "M" }; monnetJson.Note.push(nuevoObjetoNote);
                if (cleanedData) var nuevoObjetoNote = { "_": direccionProv, "languageID": "N" }; monnetJson.Note.push(nuevoObjetoNote);
                if (precinto1) var nuevoObjetoNote = { "_": precinto1, "languageID": "P" }; monnetJson.Note.push(nuevoObjetoNote);
                if (precinto2) var nuevoObjetoNote = { "_": precinto2, "languageID": "Q" }; monnetJson.Note.push(nuevoObjetoNote);
                if (precinto3) var nuevoObjetoNote = { "_": precinto3, "languageID": "R" }; monnetJson.Note.push(nuevoObjetoNote);
                if (precinto4) var nuevoObjetoNote = { "_": precinto4, "languageID": "S" }; monnetJson.Note.push(nuevoObjetoNote);
                if (contenedor1) var nuevoObjetoNote = { "_": contenedor1, "languageID": "T" }; monnetJson.Note.push(nuevoObjetoNote);
                if (contenedor2) var nuevoObjetoNote = { "_": contenedor2, "languageID": "U" }; monnetJson.Note.push(nuevoObjetoNote);
                if (sedePlanta) var nuevoObjetoNote = { "_": sedePlanta, "languageID": "V" }; monnetJson.Note.push(nuevoObjetoNote);
                if (carreta) var nuevoObjetoNote = { "_": carreta, "languageID": "W" }; monnetJson.Note.push(nuevoObjetoNote);

                //<I> rhuaccha: 2024-09-13
                if (operationType === EXPORT_CODE) {
                    monnetJson.Note.push({
                        "_": empAduanera.details.phone,
                        "languageID": "D"
                    });
                }
                trace = 'Actividad 3';



                //Venta nacional    
                //Cambio Jechevarria 06/11/2024 - Cambio de la condición para que se muestre el teléfono en la nota cuando el motivo de traslado es 01 Venta
                // if (operationType === '01' || String(operationType) === '1') {
                if (motivo === '01' || String(motivo) === '1') {

                    var lookup;
                    if (customerId) {
                        lookup = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: customerId,
                            columns: ['phone']
                        });
                    }

                    var tmpPhone = '';
                    if (lookup && Object.keys(lookup).length > 0) {
                        tmpPhone = lookup.phone;
                    }

                    monnetJson.Note.push({
                        "_": tmpPhone,
                        "languageID": "D"
                    });
                }
                //<F> rhuaccha: 2024-09-13
                trace = 'Actividad 4';
                const uniqueData = new Array();
                const languageIDs = new Set();
                trace = 'Actividad 5';
                monnetJson.Note.forEach(function (item) { // item => // MD1
                    if (item.languageID && !languageIDs.has(item.languageID)) {
                        languageIDs.add(item.languageID);
                        uniqueData.push(item);
                    } else if (!item.languageID) {
                        uniqueData.push(item);
                    }
                });
                trace = 'Actividad 6';
                monnetJson.Note = uniqueData
                //Fin - dfernandez - 20/05/2024
                //<I> rhuaccha: 2024-10-14
                var createdFromId = searchResultitemfulfillment[0].getValue({ name: "createdfrom" });
                var lookupResult = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: createdFromId,
                    columns: ['type']
                });
                var createValue = '';
                if (Object.keys(lookupResult).length !== 0) {
                    createValue = lookupResult.type[0].value;
                }
                trace = 'Actividad 7';

                if (motivo === '01' && createValue === 'SalesOrd') { // Si el motivo es "Venta" y si viene desde una orden de venta
                    var relatedDoc = getRelatedDocument(createdFromId);
                    var addDocRef = {
                        "AdditionalDocumentReference": [
                            {
                                "ID": [
                                    {
                                        "_": relatedDoc.data.serie + "-" + relatedDoc.data.numero
                                    }
                                ],
                                "DocumentTypeCode": [
                                    {
                                        "_": relatedDoc.data.tipoDoc
                                    }
                                ],
                                "IssuerParty": [
                                    {
                                        "PartyIdentification": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": relatedDoc.data.subsidiary,
                                                        "schemeID": "6"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                    monnetJson = fusionarObjetos(monnetJson, addDocRef);
                }
                //<F> rhuaccha: 2024-10-14



                if (serieRef) {
                    AdditionalDocumentReference = {
                        "AdditionalDocumentReference": [
                            {
                                "ID": [
                                    {
                                        "_": serieRef + "-" + nroDocRef // MD1
                                    }
                                ],
                                "DocumentTypeCode": [
                                    {
                                        "_": docTypeRefCode
                                    }
                                ],
                                "DocumentType": [
                                    {
                                        "_": docTypeRefName
                                    }
                                ],
                                "IssuerParty": [
                                    {
                                        "PartyIdentification": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": column09,
                                                        "schemeID": "6"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                    monnetJson = fusionarObjetos(monnetJson, AdditionalDocumentReference);
                }
                AdditionalDocumentReference = {
                    "AdditionalDocumentReference": [
                        {
                            "ID": [
                                {
                                    "_": "118-2022-40-0001"
                                }
                            ],
                            "DocumentTypeCode": [
                                {
                                    "_": "50"
                                }
                            ],
                            "DocumentType": [
                                {
                                    "_": "Descripcion tipo de documento relacionado"
                                }
                            ]
                        }
                    ]
                }

                //INICIO jEchevarria 31/05/2024

                var ruc_expo = searchResultitemfulfillment[0].getValue({ name: "custentity_pe_document_number", join: "custbody_pe_empresa_aduanera" });

                Signature = {
                    "Signature": [
                        {
                            "ID": [
                                {
                                    "_": "IDSignature"
                                }
                            ],
                            "SignatoryParty": [
                                {
                                    "PartyIdentification": [
                                        {
                                            "ID": [
                                                {
                                                    "_": column08
                                                }
                                            ]
                                        }
                                    ],
                                    "PartyName": [
                                        {
                                            "Name": [
                                                {
                                                    "_": column09
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ],
                            "DigitalSignatureAttachment": [
                                {
                                    "ExternalReference": [
                                        {
                                            "URI": [
                                                {
                                                    "_": "IDSignature"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "DespatchSupplierParty": [
                        {
                            "Party": [
                                {
                                    "PartyIdentification": [
                                        {
                                            "ID": [
                                                {
                                                    "_": column09,
                                                    "schemeID": "6"
                                                }
                                            ]
                                        }
                                    ],
                                    "PostalAddress": [
                                        {
                                            "ID": [
                                                {
                                                    "_": zip
                                                }
                                            ],
                                            "StreetName": [
                                                {
                                                    "_": column13
                                                }
                                            ],
                                            "CitySubdivisionName": [
                                                {
                                                    "_": "URBANIZACION"
                                                }
                                            ],
                                            "CityName": [
                                                {
                                                    "_": departamento
                                                }
                                            ],
                                            "CountrySubentity": [
                                                {
                                                    "_": column14
                                                }
                                            ],
                                            "District": [
                                                {
                                                    "_": addr2
                                                }
                                            ],
                                            "Country": [
                                                {
                                                    "IdentificationCode": [
                                                        {
                                                            "_": contry
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "PartyLegalEntity": [
                                        {
                                            "RegistrationName": [
                                                {
                                                    "_": column09
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "DeliveryCustomerParty": [
                        {
                            "Party": [
                                {
                                    "PartyIdentification": [
                                        {
                                            "ID": [
                                                {
                                                    //JECHAVARRIA 31/05/2024
                                                    // "_": (operationType === EXPORT_CODE) ? empAduanera.details.idProveedor : column21, //column21,
                                                    "_": (operationType === EXPORT_CODE) ? ruc_expo : column21, //column21,
                                                    "schemeID": (operationType === EXPORT_CODE) ? searchResultitemfulfillment[0].getValue({ name: "custentity_pe_code_document_type", join: "custbody_pe_empresa_aduanera" }) : column20
                                                }
                                            ]
                                        }
                                    ],
                                    "PostalAddress": [
                                        {
                                            "ID": [
                                                {
                                                    "_": (operationType === EXPORT_CODE) ? empAduanera.details.zipCode : zipCustomer, //zipCustomer
                                                }
                                            ],
                                            "StreetName": [
                                                {
                                                    "_": (operationType === EXPORT_CODE) ? empAduanera.details.direccion : column23, //column23
                                                }
                                            ],
                                            "CitySubdivisionName": [
                                                {
                                                    "_": "URBANIZACION"
                                                }
                                            ],
                                            "CityName": [
                                                {
                                                    "_": (operationType === EXPORT_CODE) ? empAduanera.details.provincia : column25, //column25
                                                }
                                            ],
                                            "CountrySubentity": [
                                                {
                                                    "_": (operationType === EXPORT_CODE) ? empAduanera.details.departamento : column26, //column26
                                                }
                                            ],
                                            "District": [
                                                {
                                                    "_": (operationType === EXPORT_CODE) ? empAduanera.details.distrito : column27, //column27
                                                }
                                            ],
                                            "Country": [
                                                {
                                                    "IdentificationCode": [
                                                        {
                                                            "_": (operationType === EXPORT_CODE) ? empAduanera.details.pais : column28, //column28
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "PartyLegalEntity": [
                                        {
                                            "RegistrationName": [
                                                {
                                                    "_": (operationType === EXPORT_CODE) ? empAduanera.details.nombre : column22, //column22
                                                }
                                            ]
                                        }
                                    ],
                                    "Contact": [
                                        {
                                            "ElectronicMail": [
                                                {
                                                    "_": email ? email : ' '
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }


                log.debug('modalidad', modalidad)
                var Shipment;
                //DATOS PARA FirstArrivalPortLocation
                var FirstArrivalPortLocation_id;
                if (searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_cod_puerto", join: "custbody_pe_cod_puerto" })) {
                    FirstArrivalPortLocation_id = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_cod_puerto", join: "custbody_pe_cod_puerto" });
                } else {
                    FirstArrivalPortLocation_id = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_cod_aeropuerto", join: "custbody_pe_codigo_aeropuerto" });
                }

                var firstArrivalPortLocation_LocationTypeCode;
                if (searchResultitemfulfillment[0].getValue({ name: "custrecord_locationtypecode", join: "custbody_pe_cod_puerto" })) {
                    firstArrivalPortLocation_LocationTypeCode = searchResultitemfulfillment[0].getValue({ name: "custrecord_locationtypecode", join: "custbody_pe_cod_puerto" });
                } else {
                    firstArrivalPortLocation_LocationTypeCode = searchResultitemfulfillment[0].getValue({ name: "custrecord_locationtypecodeaero", join: "custbody_pe_codigo_aeropuerto" });
                }

                var firstArrivalPortLocation_Name;
                if (searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_nombre_puerto", join: "custbody_pe_cod_puerto" })) {
                    firstArrivalPortLocation_Name = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_nombre_puerto", join: "custbody_pe_cod_puerto" });
                } else {
                    firstArrivalPortLocation_Name = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_nombre_aeropuerto", join: "custbody_pe_codigo_aeropuerto" });
                }
                //DATOS PARA FinalArrivalPortLocation

                if (modalidad == '02') {
                    if (operationType === EXPORT_CODE) {
                        Shipment = {
                            "Shipment": [
                                {
                                    "ID": [
                                        {
                                            "_": "SUNAT_Envio"
                                        }
                                    ],
                                    "HandlingCode": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_de_traslado", join: "custbody_pe_motivos_de_traslado", label: "motivo" })
                                        }
                                    ],
                                    "HandlingInstructions": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_reason_details" })
                                        }
                                    ],
                                    "GrossWeightMeasure": [
                                        {
                                            "_": Peso,
                                            "unitCode": "KGM"
                                        }
                                    ],

                                    "TotalTransportHandlingUnitQuantity": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_bultos" })
                                        }
                                    ],


                                    //Inicio - dfernandez - 10/05/2024
                                    "SpecialInstructions": [
                                        {
                                            "_": "SUNAT_Envio_IndicadorVehiculoConductoresTransp"
                                        }
                                    ],
                                    //Fin - dfernandez - 10/05/2024
                                    "ShipmentStage": [
                                        {
                                            "TransportModeCode": [
                                                {
                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_traslado", join: "custbody_pe_modalidad_de_traslado", label: "modalidad" })
                                                }
                                            ],
                                            "TransitPeriod": [
                                                {
                                                    "StartDate": [
                                                        {
                                                            "_": fechatralado
                                                        }
                                                    ]
                                                }
                                            ],
                                            "DriverPerson": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_document_number" }),
                                                            "schemeID": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_code_document_num", join: "custbody_pe_conductor" })
                                                        }
                                                    ],
                                                    "FirstName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_name" })
                                                        }
                                                    ],
                                                    "FamilyName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_last_name" })
                                                        }
                                                    ],
                                                    "JobTitle": [
                                                        {
                                                            "_": "Principal"
                                                        }
                                                    ],
                                                    "IdentityDocumentReference": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_license" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]

                                        }
                                    ],
                                    "Delivery": [
                                        {
                                            "DeliveryAddress": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_llegada", label: "llegada" })
                                                        }
                                                    ],
                                                    'AddressTypeCode': motivo == '04' ? [
                                                        {
                                                            "_": transferOrden,
                                                            "listID": column21

                                                        }
                                                    ] : [],
                                                    "CitySubdivisionName": [
                                                        {
                                                            "_": "URBANIZACION"
                                                        }
                                                    ],

                                                    "CityName": [
                                                        {
                                                            "_": llegada[0]
                                                        }
                                                    ],
                                                    "CountrySubentity": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "District": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "AddressLine": [
                                                        {
                                                            "Line": [
                                                                {
                                                                    "_": puntoLlegada.replace(/\n/g, " ").replace(/\r/g, "")
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "Country": [
                                                        {
                                                            "IdentificationCode": [
                                                                {
                                                                    "_": "PE"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ],
                                            "Despatch": [
                                                {
                                                    "DespatchAddress": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "partida" })
                                                                }
                                                            ],
                                                            'AddressTypeCode': motivo == '04' ? [
                                                                {
                                                                    "_": CodigoLocal,
                                                                    "listID": column09

                                                                }
                                                            ] : [],
                                                            "CitySubdivisionName": [
                                                                {
                                                                    "_": "URBANIZACION"
                                                                }
                                                            ],
                                                            "CityName": [
                                                                {
                                                                    "_": partida[0]
                                                                }
                                                            ],
                                                            "CountrySubentity": [
                                                                {
                                                                    "_": partida[1]
                                                                }
                                                            ],
                                                            "District": [
                                                                {
                                                                    "_": partida[2]
                                                                }
                                                            ],
                                                            "AddressLine": [
                                                                {
                                                                    "Line": [
                                                                        {
                                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" }).replace(/\n/g, " ").replace(/\r/g, "")
                                                                        }
                                                                    ]
                                                                }
                                                            ],
                                                            "Country": [
                                                                {
                                                                    "IdentificationCode": [
                                                                        {
                                                                            "_": "PE"
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "TransportHandlingUnit": [
                                        {
                                            "TransportEquipment": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_car_plate" })
                                                        },
                                                        // //Inicio - dfernandez - 2024-05-09
                                                        // {
                                                        //     "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_address", join: "custbody_pe_delivery_information", label: "Domicilio de Transporte" }),
                                                        //     "languageID": "H"
                                                        // },
                                                        // {
                                                        //     "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_car_brand", join: "custbody_pe_delivery_information", label: "Marca de Vehículo" }),
                                                        //     "languageID": "I"
                                                        // }
                                                        // //Fin - dfernandez - 2024-05-09
                                                    ],
                                                    //Inicio - dfernandez - 10/05/2024
                                                    "ApplicableTransportMeans": [
                                                        {
                                                            "RegistrationNationalityID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_cert_insc_transportista", label: "Certificado Transportista" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                    //Fin - dfernandez - 10/05/2024
                                                }
                                            ]
                                        }
                                    ],
                                    "FirstArrivalPortLocation": [
                                        {
                                            "ID": [
                                                {
                                                    "_": FirstArrivalPortLocation_id
                                                }
                                            ],
                                            "LocationTypeCode": [
                                                {
                                                    "_": firstArrivalPortLocation_LocationTypeCode
                                                }
                                            ],
                                            "Name": [
                                                {
                                                    "_": firstArrivalPortLocation_Name
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    } else {
                        Shipment = {
                            "Shipment": [
                                {
                                    "ID": [
                                        {
                                            "_": "SUNAT_Envio"
                                        }
                                    ],
                                    "HandlingCode": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_de_traslado", join: "custbody_pe_motivos_de_traslado", label: "motivo" })
                                        }
                                    ],
                                    "HandlingInstructions": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_reason_details" })
                                        }
                                    ],
                                    "GrossWeightMeasure": [
                                        {
                                            "_": Peso,
                                            "unitCode": "KGM"
                                        }
                                    ],

                                    //Inicio - dfernandez - 10/05/2024
                                    "SpecialInstructions": [
                                        {
                                            "_": "SUNAT_Envio_IndicadorVehiculoConductoresTransp"
                                        }
                                    ],
                                    //Fin - dfernandez - 10/05/2024
                                    "ShipmentStage": [
                                        {
                                            "TransportModeCode": [
                                                {
                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_traslado", join: "custbody_pe_modalidad_de_traslado", label: "modalidad" })
                                                }
                                            ],
                                            "TransitPeriod": [
                                                {
                                                    "StartDate": [
                                                        {
                                                            "_": fechatralado
                                                        }
                                                    ]
                                                }
                                            ],
                                            "DriverPerson": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_document_number" }),
                                                            "schemeID": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_code_document_num", join: "custbody_pe_conductor" })
                                                        }
                                                    ],
                                                    "FirstName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_name" })
                                                        }
                                                    ],
                                                    "FamilyName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_last_name" })
                                                        }
                                                    ],
                                                    "JobTitle": [
                                                        {
                                                            "_": "Principal"
                                                        }
                                                    ],
                                                    "IdentityDocumentReference": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_license" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]

                                        }
                                    ],
                                    "Delivery": [
                                        {
                                            "DeliveryAddress": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_llegada", label: "llegada" })
                                                        }
                                                    ],
                                                    'AddressTypeCode': motivo == '04' ? [
                                                        {
                                                            "_": transferOrden,
                                                            "listID": column21

                                                        }
                                                    ] : [],
                                                    "CitySubdivisionName": [
                                                        {
                                                            "_": "URBANIZACION"
                                                        }
                                                    ],

                                                    "CityName": [
                                                        {
                                                            "_": llegada[0]
                                                        }
                                                    ],
                                                    "CountrySubentity": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "District": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "AddressLine": [
                                                        {
                                                            "Line": [
                                                                {
                                                                    "_": puntoLlegada.replace(/\n/g, " ").replace(/\r/g, "")
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "Country": [
                                                        {
                                                            "IdentificationCode": [
                                                                {
                                                                    "_": "PE"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ],
                                            "Despatch": [
                                                {
                                                    "DespatchAddress": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "partida" })
                                                                }
                                                            ],
                                                            'AddressTypeCode': motivo == '04' ? [
                                                                {
                                                                    "_": CodigoLocal,
                                                                    "listID": column09

                                                                }
                                                            ] : [],
                                                            "CitySubdivisionName": [
                                                                {
                                                                    "_": "URBANIZACION"
                                                                }
                                                            ],
                                                            "CityName": [
                                                                {
                                                                    "_": partida[0]
                                                                }
                                                            ],
                                                            "CountrySubentity": [
                                                                {
                                                                    "_": partida[1]
                                                                }
                                                            ],
                                                            "District": [
                                                                {
                                                                    "_": partida[2]
                                                                }
                                                            ],
                                                            "AddressLine": [
                                                                {
                                                                    "Line": [
                                                                        {
                                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" }).replace(/\n/g, " ").replace(/\r/g, "")
                                                                        }
                                                                    ]
                                                                }
                                                            ],
                                                            "Country": [
                                                                {
                                                                    "IdentificationCode": [
                                                                        {
                                                                            "_": "PE"
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                    "TransportHandlingUnit": [
                                        {
                                            "TransportEquipment": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_car_plate" })
                                                        },
                                                        // //Inicio - dfernandez - 2024-05-09
                                                        // {
                                                        //     "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_address", join: "custbody_pe_delivery_information", label: "Domicilio de Transporte" }),
                                                        //     "languageID": "H"
                                                        // },
                                                        // {
                                                        //     "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_car_brand", join: "custbody_pe_delivery_information", label: "Marca de Vehículo" }),
                                                        //     "languageID": "I"
                                                        // }
                                                        // //Fin - dfernandez - 2024-05-09
                                                    ],
                                                    //Inicio - dfernandez - 10/05/2024
                                                    "ApplicableTransportMeans": [
                                                        {
                                                            "RegistrationNationalityID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_cert_insc_transportista", label: "Certificado Transportista" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                    //Fin - dfernandez - 10/05/2024
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                } else {
                    if (operationType === EXPORT_CODE) {
                        Shipment = {
                            "Shipment": [
                                {
                                    "ID": [
                                        {
                                            "_": "SUNAT_Envio"
                                        }
                                    ],
                                    "HandlingCode": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_de_traslado", join: "custbody_pe_motivos_de_traslado", label: "motivo" })
                                        }
                                    ],
                                    "HandlingInstructions": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_reason_details" })
                                        }
                                    ],
                                    "GrossWeightMeasure": [
                                        {
                                            "_": Peso,
                                            "unitCode": "KGM"
                                        }
                                    ],
                                    "TotalTransportHandlingUnitQuantity": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_bultos" })
                                        }
                                    ],
                                    //INCIO jEchevarria 31/05/2024
                                    "SpecialInstructions": [
                                        {
                                            "_": "SUNAT_Envio_IndicadorVehiculoConductoresTransp"
                                        }
                                    ],

                                    //FIN jEchevarria 31/05/2024
                                    "ShipmentStage": [
                                        {
                                            "TransportModeCode": [
                                                {
                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_traslado", join: "custbody_pe_modalidad_de_traslado", label: "modalidad" })
                                                }
                                            ],
                                            "TransitPeriod": [
                                                {
                                                    "StartDate": [
                                                        {
                                                            "_": fechatralado
                                                        }
                                                    ]
                                                }
                                            ],
                                            "CarrierParty": [
                                                {
                                                    "PartyIdentification": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_ruc_vendor" }),
                                                                    "schemeID": "6"
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "PartyLegalEntity": [
                                                        {
                                                            "RegistrationName": [
                                                                {
                                                                    //cambio jechevarria 21/06/2024
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_company_name", join: "custbody_pe_delivery_information", label: "name" })
                                                                }
                                                            ],
                                                            "CompanyID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_numero_de_registro_mtc" }) || ' ',
                                                                }
                                                            ]
                                                        }
                                                    ],

                                                }
                                            ],
                                            //INICIO jEchevarria 31/05/2024
                                            "DriverPerson": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_document_number" }),
                                                            "schemeID": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_code_document_num", join: "custbody_pe_conductor" })
                                                        }
                                                    ],
                                                    "FirstName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_name" })
                                                        }
                                                    ],
                                                    "FamilyName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_last_name" })
                                                        }
                                                    ],
                                                    "JobTitle": [
                                                        {
                                                            "_": "Principal"
                                                        }
                                                    ],
                                                    "IdentityDocumentReference": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_license" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                            //FIN jEchevarria 31/05/2024

                                        }
                                    ],
                                    "Delivery": [
                                        {
                                            "DeliveryAddress": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_llegada", label: "llegada" })
                                                        }
                                                    ],
                                                    'AddressTypeCode': motivo == '04' ? [
                                                        {
                                                            "_": transferOrden,
                                                            "listID": column21

                                                        }
                                                    ] : [],
                                                    "CitySubdivisionName": [
                                                        {
                                                            "_": "URBANIZACION"
                                                        }
                                                    ],

                                                    "CityName": [
                                                        {
                                                            "_": llegada[0]
                                                        }
                                                    ],
                                                    "CountrySubentity": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "District": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "AddressLine": [
                                                        {
                                                            "Line": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_delivery_address" }).replace(/\n/g, " ").replace(/\r/g, "")
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "Country": [
                                                        {
                                                            "IdentificationCode": [
                                                                {
                                                                    "_": "PE"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ],
                                            "Despatch": [
                                                {
                                                    "DespatchAddress": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "partida" })
                                                                }
                                                            ],
                                                            'AddressTypeCode': motivo == '04' ? [
                                                                {
                                                                    "_": CodigoLocal,
                                                                    "listID": column09

                                                                }
                                                            ] : [],
                                                            "CitySubdivisionName": [
                                                                {
                                                                    "_": "URBANIZACION"
                                                                }
                                                            ],

                                                            "CityName": [
                                                                {
                                                                    "_": partida[0]
                                                                }
                                                            ],
                                                            "CountrySubentity": [
                                                                {
                                                                    "_": partida[1]
                                                                }
                                                            ],
                                                            "District": [
                                                                {
                                                                    "_": partida[2]
                                                                }
                                                            ],
                                                            "AddressLine": [
                                                                {
                                                                    "Line": [
                                                                        {
                                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" }).replace(/\n/g, " ").replace(/\r/g, "")
                                                                        }
                                                                    ]
                                                                }
                                                            ],
                                                            "Country": [
                                                                {
                                                                    "IdentificationCode": [
                                                                        {
                                                                            "_": "PE"
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]

                                                }
                                            ]
                                        }
                                    ],
                                    "TransportHandlingUnit": [
                                        {
                                            "TransportEquipment": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_car_plate" })
                                                        },
                                                        /*  //Inicio - dfernandez - 09/05/2024
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_address", join: "custbody_pe_delivery_information", label: "Domicilio de Transporte" }),
                                                            "languageID": "H"
                                                        },
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_car_brand", join: "custbody_pe_delivery_information", label: "Marca de Vehículo" }),
                                                            "languageID": "I"
                                                        }
                                                        Fin - dfernandez - 09/05/2024 */
                                                    ],
                                                    //Inicio - dfernandez - 10/05/2024
                                                    "ApplicableTransportMeans": [
                                                        {
                                                            "RegistrationNationalityID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_cert_insc_transportista", label: "Certificado Transportista" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                    //Fin - dfernandez -10/05/2024
                                                }
                                            ]
                                        }
                                    ],
                                    "FirstArrivalPortLocation": [
                                        {
                                            "ID": [
                                                {
                                                    "_": FirstArrivalPortLocation_id
                                                }
                                            ],
                                            "LocationTypeCode": [
                                                {
                                                    "_": firstArrivalPortLocation_LocationTypeCode
                                                }
                                            ],
                                            "Name": [
                                                {
                                                    "_": firstArrivalPortLocation_Name
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                        if (searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_autorizacion_principal" })) {
                            Shipment.Shipment[0].ShipmentStage[0].CarrierParty[0].AgentParty = [{

                                "PartyLegalEntity": [
                                    {
                                        "CompanyID": [
                                            {
                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_autorizacion_principal" }) || ' ',
                                                "schemeID": "06"
                                            }
                                        ]
                                    }
                                ]

                            }]
                        }
                    } else {
                        Shipment = {
                            "Shipment": [
                                {
                                    "ID": [
                                        {
                                            "_": "SUNAT_Envio"
                                        }
                                    ],
                                    "HandlingCode": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_de_traslado", join: "custbody_pe_motivos_de_traslado", label: "motivo" })
                                        }
                                    ],
                                    "HandlingInstructions": [
                                        {
                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_reason_details" })
                                        }
                                    ],
                                    "GrossWeightMeasure": [
                                        {
                                            "_": Peso,
                                            "unitCode": "KGM"
                                        }
                                    ],
                                    //INCIO jEchevarria 31/05/2024
                                    "SpecialInstructions": [
                                        {
                                            "_": "SUNAT_Envio_IndicadorVehiculoConductoresTransp"
                                        }
                                    ],

                                    //FIN jEchevarria 31/05/2024
                                    "ShipmentStage": [
                                        {
                                            "TransportModeCode": [
                                                {
                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_traslado", join: "custbody_pe_modalidad_de_traslado", label: "modalidad" })
                                                }
                                            ],
                                            "TransitPeriod": [
                                                {
                                                    "StartDate": [
                                                        {
                                                            "_": fechatralado
                                                        }
                                                    ]
                                                }
                                            ],
                                            "CarrierParty": [
                                                {
                                                    "PartyIdentification": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_ruc_vendor" }),
                                                                    "schemeID": "6"
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "PartyLegalEntity": [
                                                        {
                                                            "RegistrationName": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_company_name", join: "custbody_pe_delivery_information", label: "name" })
                                                                }
                                                            ],
                                                            "CompanyID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_numero_de_registro_mtc" }) || ' ',
                                                                }
                                                            ]
                                                        }
                                                    ],

                                                }
                                            ],
                                            //INICIO jEchevarria 31/05/2024
                                            "DriverPerson": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_document_number" }),
                                                            "schemeID": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_code_document_num", join: "custbody_pe_conductor" })
                                                        }
                                                    ],
                                                    "FirstName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_name" })
                                                        }
                                                    ],
                                                    "FamilyName": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_last_name" })
                                                        }
                                                    ],
                                                    "JobTitle": [
                                                        {
                                                            "_": "Principal"
                                                        }
                                                    ],
                                                    "IdentityDocumentReference": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_driver_license" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                            //FIN jEchevarria 31/05/2024
                                        }
                                    ],
                                    "Delivery": [
                                        {
                                            "DeliveryAddress": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_llegada", label: "llegada" })
                                                        }
                                                    ],
                                                    'AddressTypeCode': motivo == '04' ? [
                                                        {
                                                            "_": transferOrden,
                                                            "listID": column21

                                                        }
                                                    ] : [],
                                                    "CitySubdivisionName": [
                                                        {
                                                            "_": "URBANIZACION"
                                                        }
                                                    ],

                                                    "CityName": [
                                                        {
                                                            "_": llegada[0]
                                                        }
                                                    ],
                                                    "CountrySubentity": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "District": [
                                                        {
                                                            "_": llegada[1]
                                                        }
                                                    ],
                                                    "AddressLine": [
                                                        {
                                                            "Line": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_delivery_address" }).replace(/\n/g, " ").replace(/\r/g, "")
                                                                }
                                                            ]
                                                        }
                                                    ],
                                                    "Country": [
                                                        {
                                                            "IdentificationCode": [
                                                                {
                                                                    "_": "PE"
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ],
                                            "Despatch": [
                                                {
                                                    "DespatchAddress": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "partida" })
                                                                }
                                                            ],
                                                            'AddressTypeCode': motivo == '04' ? [
                                                                {
                                                                    "_": CodigoLocal,
                                                                    "listID": column09

                                                                }
                                                            ] : [],
                                                            "CitySubdivisionName": [
                                                                {
                                                                    "_": "URBANIZACION"
                                                                }
                                                            ],

                                                            "CityName": [
                                                                {
                                                                    "_": partida[0]
                                                                }
                                                            ],
                                                            "CountrySubentity": [
                                                                {
                                                                    "_": partida[1]
                                                                }
                                                            ],
                                                            "District": [
                                                                {
                                                                    "_": partida[2]
                                                                }
                                                            ],
                                                            "AddressLine": [
                                                                {
                                                                    "Line": [
                                                                        {
                                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" }).replace(/\n/g, " ").replace(/\r/g, "")
                                                                        }
                                                                    ]
                                                                }
                                                            ],
                                                            "Country": [
                                                                {
                                                                    "IdentificationCode": [
                                                                        {
                                                                            "_": "PE"
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]

                                                }
                                            ]
                                        }
                                    ],
                                    "TransportHandlingUnit": [
                                        {
                                            "TransportEquipment": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_car_plate" })
                                                        },
                                                        /*  //Inicio - dfernandez - 09/05/2024
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_driver_address", join: "custbody_pe_delivery_information", label: "Domicilio de Transporte" }),
                                                            "languageID": "H"
                                                        },
                                                        {
                                                            "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_car_brand", join: "custbody_pe_delivery_information", label: "Marca de Vehículo" }),
                                                            "languageID": "I"
                                                        }
                                                        Fin - dfernandez - 09/05/2024 */
                                                    ],
                                                    //Inicio - dfernandez - 10/05/2024
                                                    "ApplicableTransportMeans": [
                                                        {
                                                            "RegistrationNationalityID": [
                                                                {
                                                                    "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_cert_insc_transportista", label: "Certificado Transportista" })
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                    //Fin - dfernandez - 10/05/2024
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                        if (searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_autorizacion_principal" })) {
                            Shipment.Shipment[0].ShipmentStage[0].CarrierParty[0].AgentParty = [{

                                "PartyLegalEntity": [
                                    {
                                        "CompanyID": [
                                            {
                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_autorizacion_principal" }) || ' ',
                                                "schemeID": "06"
                                            }
                                        ]
                                    }
                                ]

                            }]
                        }
                    }

                }

                DespatchLine = {
                    "DespatchLine": detalleItems
                }
                monnetJson = fusionarObjetos(monnetJson, Signature);
                monnetJson = fusionarObjetos(monnetJson, Shipment);
                monnetJson = fusionarObjetos(monnetJson, DespatchLine);



                //INICIO jEchevarria 31/05/2024
                var AdditionalItemProperty_DAM_Value = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_document_series_ref" }) + '-' + searchResultitemfulfillment[0].getValue({ name: "custbody_pe_document_number_ref" });

                //Agregamos a todos los items el siguiente obj
                var AdditionalItemProperty_DAM_1 = {
                    "AdditionalItemProperty": [
                        {
                            "Name": [
                                {
                                    "_": "Numero de declaracion aduanera (DAM)"
                                }
                            ],
                            "NameCode": [
                                {
                                    "_": "7021"
                                }
                            ],
                            "Value": [
                                {
                                    "_": AdditionalItemProperty_DAM_Value
                                }
                            ]
                        }, {
                            "Name": [
                                {
                                    "_": "Numero de serie en la DAM o DS"
                                }
                            ],
                            "NameCode": [
                                {
                                    "_": "7023"
                                }
                            ],
                            "Value": [
                                {
                                    "_": "0001"
                                }
                            ]
                        }
                    ]
                }

                //recorremos todos los items 
                if (operationType === EXPORT_CODE) {
                    for (var i = 0; i < monnetJson.DespatchLine.length; i++) {
                        monnetJson.DespatchLine[i].Item[0].AdditionalItemProperty = AdditionalItemProperty_DAM_1.AdditionalItemProperty;
                    }
                }


                //FIN jEchevarria 31/05/2024



                monnetJson = {
                    "_D": "urn:oasis:names:specification:ubl:schema:xsd:DespatchAdvice-2",
                    "_A": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
                    "_B": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
                    "_E": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
                    "DespatchAdvice": [monnetJson]
                }
                codTipoDocumento = "09";
                var filename = column09 + '-' + codTipoDocumento + '-' + Peserie;
                var ticket = codTipoDocumento + '-' + Peserie;
                monnetJson = JSON.stringify(monnetJson);
                var filejson = generateFileJSON(filename, monnetJson);
                var filejson = file.load({ id: filejson });
                setRecord(codTipoDocumento, documentid, ticket, /*urlpdf, urlxml, urlcdr,*/ filejson.id /*encodepdf, array*/)
                return 'Transacción ' + ticket + ' generada ' + ' - ';
            } catch (error) {

                log.debug(trace, error.message);
            }
        }

        function getAllUnitMesureForItemFul() {
            var Items = []
            var datos = search.create({
                type: "unitstype",
                filters:
                    [
                        ["baseunit", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Nombre" }),
                        search.createColumn({ name: "abbreviation", label: "Abreviatura" }),
                        search.createColumn({ name: "baseunit", label: "Es unidad base" })
                    ]
            });

            var searchResult = datos.run().getRange({ start: 0, end: 1000 });
            for (var i = 0; i < searchResult.length; i++) {
                Items.push({
                    "Name": searchResult[i].getValue({ name: "name" }),
                    "Abbreviation": searchResult[i].getValue({ name: "abbreviation" }),
                    "BaseUnit": searchResult[i].getValue({ name: "baseunit" })
                })
            }


            return Items;

        }

        //<I> rhuaccha: 2024-04-26
        function logError(internalId, docStatus, response) {
            var logError = record.create({ type: 'customrecord_pe_ei_log_documents' });
            logError.setValue('custrecord_pe_ei_log_related_transaction', internalId);
            logError.setValue('custrecord_pe_ei_log_subsidiary', 3);
            logError.setValue('custrecord_pe_ei_log_employee', 6);
            logError.setValue('custrecord_pe_ei_log_status', docStatus);
            logError.setValue('custrecord_pe_ei_log_response', response);
            logError.save();
        }

        function getEmpAduaneraDetails(internalId, greId) {
            var obj = {
                status: false,
                message: 'INIT'
            }
            try {
                var tmpSearch = search.create({
                    type: "vendor",
                    filters:
                        [
                            ["internalid", "anyof", internalId]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "entityid", label: "0. IDProveedor" }),
                            search.createColumn({ name: "altname", label: "1.Nombre" }),
                            search.createColumn({ name: "custentity_pe_vendor_name", label: "2.NombreProv" }),
                            // search.createColumn({ name: "custentity_pe_document_number", label: "3.NumDocumento" }),
                            search.createColumn({
                                name: "custrecord_pe_departamento",
                                join: "Address",
                                label: "3.Departamento"
                            }),
                            search.createColumn({
                                name: "custrecord_pe_distrito",
                                join: "Address",
                                label: "4.Distrito"
                            }),
                            search.createColumn({
                                name: "address2",
                                join: "Address",
                                label: "5.Provincia"
                            }),
                            search.createColumn({
                                name: "address1",
                                join: "Address",
                                label: "6.Direccion"
                            }),
                            search.createColumn({
                                name: "countrycode",
                                join: "Address",
                                label: "7.Pais"
                            }),
                            search.createColumn({
                                name: "zipcode",
                                join: "Address",
                                label: "8.ZipCode"
                            }),
                            search.createColumn({
                                name: "phone",
                                label: "9.Phone"
                            })
                        ]
                });

                var result = tmpSearch.run().getRange({ start: 0, end: 1 });

                if (result && result.length > 0) {
                    obj = {
                        status: true,
                        message: 'INIT',
                        details: {
                            idProveedor: nvl(result[0].getValue(tmpSearch.columns[0]), ''),
                            nombre: nvl(result[0].getValue(tmpSearch.columns[1]), ''),
                            nombreProveedor: nvl(result[0].getValue(tmpSearch.columns[2]), ''),
                            departamento: nvl(result[0].getValue(tmpSearch.columns[3]), ''),
                            provincia: nvl(result[0].getValue(tmpSearch.columns[5]), ''),
                            distrito: nvl(result[0].getValue(tmpSearch.columns[4]), ''),
                            direccion: nvl(result[0].getValue(tmpSearch.columns[6]), ''),
                            pais: nvl(result[0].getValue(tmpSearch.columns[7]), ''),
                            zipCode: nvl(result[0].getValue(tmpSearch.columns[8]), ''),
                            phone: nvl(result[0].getValue(tmpSearch.columns[9]), ''),//<I> rhuaccha: 2024-09-13
                        }
                    }
                }

            } catch (error) {
                log.debug('Error getEmpAduaneraDetails', JSON.stringify(error.message));
                obj = {
                    status: false,
                    message: 'Error: ' + error.message
                }
            }
            return obj;
        }

        function nvl(value, defaultValue) {
            return (value !== null && value !== undefined && value !== '') ? value : defaultValue;
        }
        //<F> rhuaccha: 2024-04-26

        //!VENDORCREDIT ============================================================================================================================
        function createRequestVendorCredit(documentid) {

            var searchLoad = search.create({
                type: "vendorcredit",
                filters:
                    [
                        ["internalid", "anyof", documentid]
                    ],
                columns: [
                    // IDE----------
                    search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie_cxp}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),
                    search.createColumn({ name: "trandate", label: "2 Date" }),
                    search.createColumn({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type", label: "codigo" }),//2
                    search.createColumn({ name: "symbol", join: "Currency", label: "5 Symbol" }),//3
                    search.createColumn({ name: "otherrefnum", join: "createdFrom", label: "6 PO/Check Number" }),
                    search.createColumn({ name: "taxidnum", join: "subsidiary", label: "8 Tax ID" }),//5
                    search.createColumn({ name: "formulatext", formula: "{subsidiary.name}", label: "9 Trade Name" }),//6
                    search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }),//7
                    search.createColumn({ name: "address1", join: "location", label: "11 Address 1" }),
                    search.createColumn({ name: "address2", join: "location", label: "12 Address 2" }),
                    search.createColumn({ name: "address1", join: "subsidiary", label: "13 Address 1" }),
                    //search.createColumn({ name: "custrecordrepresentingvendor", join: "subsidiary", label: "Direccion" }),//11
                    search.createColumn({ name: "entity" }),//12
                    search.createColumn({ name: "memo" }),//13
                ]
            });
            var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
            var numeracion = searchResult[0].getValue(searchLoad.columns[0]);
            var fechaEmision = searchResult[0].getValue(searchLoad.columns[1]);
            fechaEmision = fechaEmision.split('/');
            fechaEmision = fechaEmision[2] + '-' + padLeft(fechaEmision[1], 2, '0') + '-' + padLeft(fechaEmision[0], 2, '0');
            var tipo_comprobante = searchResult[0].getValue(searchLoad.columns[2]);
            var moneda = searchResult[0].getValue(searchLoad.columns[3]);
            var memo = searchResult[0].getValue(searchLoad.columns[12]);

            var Emi_RUC = searchResult[0].getValue(searchLoad.columns[5]);
            var Emi_NombreComercial = searchResult[0].getValue(searchLoad.columns[6]);
            var Emi_RazonSocial = searchResult[0].getValue(searchLoad.columns[7]);


            var Receptor = searchResult[0].getValue(searchLoad.columns[11]);

            var ReceptorRecord = record.load({
                type: 'vendor',
                id: Receptor
            });
            var Rec_RUC = ReceptorRecord.getValue('custentity_pe_document_number');
            var Rec_NombreComercial = ReceptorRecord.getValue('altname');
            var Rec_RazonSocial = ReceptorRecord.getValue('companyname');
            if (!Rec_RazonSocial) {
                Rec_RazonSocial = ReceptorRecord.getValue('altname');
            }

            var type = ReceptorRecord.getValue('custentity_pe_code_document_type');
            var searchLoadCustomer = search.create({
                type: "vendor",
                filters:
                    [

                        ["internalid", "anyof", Receptor],
                        "AND",
                        ["address.isdefaultshipping", "is", "T"]
                    ],
                columns:
                    [
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" }),//0
                        search.createColumn({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" }),
                        search.createColumn({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" }),
                        search.createColumn({ name: "city", join: "Address", label: "city" }),
                        search.createColumn({ name: "address1", join: "address", label: " Address 1" }),


                    ]
            });
            var searchResultCustomer = searchLoadCustomer.run().getRange({ start: 0, end: 200 });
            if (searchResultCustomer.length > 0) {
                var Rec_Ubigeo = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" });
                var Rec_Distrito = searchResultCustomer[0].getValue({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" });
                var Rec_Departamento = searchResultCustomer[0].getValue({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" });
                var Rec_Provincia = searchResultCustomer[0].getValue({ name: "city", join: "Address", label: "city" });
                var Rec_Direccion = searchResultCustomer[0].getValue({ name: "address1", join: "address", label: " Address 1" });
            }
            logStatus(documentid, Rec_RazonSocial);
            var Rec_Pais = ReceptorRecord.getValue('billcountry');


            // var TotalInvoiceAmount = 0.00
            // var SUNATTotalPaid = 0.00;

            // TotalInvoiceAmount = TotalInvoiceAmount.toFixed(2)+""
            // SUNATTotalPaid = SUNATTotalPaid.toFixed(2)+""
            //Inicio cambio Jechevarria 21/06/2024
            var entityId = searchResult[0].getValue({ name: "entity" });

            var codigo_j = search.create({
                type: "vendor",
                filters:
                    [
                        ["internalid", "anyof", entityId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custentity_pe_document_number", label: "codigo" }),
                    ]
            }).run().getRange({ start: 0, end: 1 })[0].getValue({ name: "custentity_pe_document_number" });

            var primeraParte = {
                "UBLVersionID": [
                    {
                        "_": "2.0"
                    }
                ],
                "CustomizationID": [
                    {
                        "_": "1.0"
                    }
                ],
                "Signature": [
                    {
                        "ID": [
                            {
                                "_": "IDSignature"
                            }
                        ],
                        "SignatoryParty": [
                            {
                                "PartyIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": Emi_RUC
                                            }
                                        ]
                                    }
                                ],
                                "PartyName": [
                                    {
                                        "Name": [
                                            {
                                                "_": Emi_RazonSocial
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "DigitalSignatureAttachment": [
                            {
                                "ExternalReference": [
                                    {
                                        "URI": [
                                            {
                                                "_": "IDSignature"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "ID": [
                    {
                        "_": numeracion
                    }
                ],
                "IssueDate": [
                    {
                        "_": fechaEmision
                    }
                ],
                "AgentParty": [
                    {
                        "PartyIdentification": [
                            {
                                "ID": [
                                    {
                                        "_": Emi_RUC,
                                        "schemeID": "6"
                                    }
                                ]
                            }
                        ],
                        "PartyName": [
                            {
                                "Name": [
                                    {
                                        "_": Emi_NombreComercial
                                    }
                                ]
                            }
                        ],

                        "PartyLegalEntity": [
                            {
                                "RegistrationName": [
                                    {
                                        "_": Emi_RazonSocial
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "ReceiverParty": [
                    {
                        "PartyIdentification": [
                            {
                                "ID": [
                                    {
                                        "_": Rec_RUC,
                                        "schemeID": type
                                    }
                                ]
                            }
                        ],
                        "PartyName": [
                            {
                                "Name": [
                                    {
                                        "_": Rec_NombreComercial
                                    }
                                ]
                            }
                        ],
                        "PostalAddress": [
                            {
                                "ID": [
                                    {
                                        "_": Rec_Ubigeo
                                    }
                                ],
                                "StreetName": [
                                    {
                                        "_": Rec_Direccion
                                    }
                                ],
                                "CityName": [
                                    {
                                        "_": Rec_Provincia
                                    }
                                ],
                                "CountrySubentity": [
                                    {
                                        "_": Rec_Departamento
                                    }
                                ],
                                "District": [
                                    {
                                        "_": Rec_Distrito
                                    }
                                ],
                                "Country": [
                                    {
                                        "IdentificationCode": [
                                            {
                                                "_": Rec_Pais
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "PartyLegalEntity": [
                            {
                                "RegistrationName": [
                                    {
                                        "_": Rec_RazonSocial
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "SUNATRetentionSystemCode": [
                    {
                        "_": "01"//Retención 3.00%
                    }
                ],
                "SUNATRetentionPercent": [
                    {
                        "_": "3.00"//Tasa
                    }
                ],
                "Note": [
                    {
                        "_": memo
                    }
                    /*  ,{
                         "_": codigo_j,
                         "languageID": "J"
                     } */
                ],
            }

            var refrencias = []

            var openRecord = record.load({ type: 'vendorcredit', id: documentid, isDynamic: true });
            var applycount = openRecord.getLineCount({ sublistId: 'apply' });
            var doc_pago = openRecord.getValue('memo');
            var ret_total = openRecord.getValue('usertotal');
            var ret_tipocambio = openRecord.getValue('exchangerate');
            ret_total = (parseFloat(ret_total) * parseFloat(ret_tipocambio)).toFixed(2)
            // var ret_total_pago = parseFloat(ret_total);
            var ret_moneda = openRecord.getValue('currency');
            var ret_moneda = record.load({ type: 'Currency', id: ret_moneda, isDynamic: true });
            var ret_moneda = ret_moneda.getValue('symbol');
            var ret_fecha = openRecord.getValue('trandate');
            var re_dia = ret_fecha.getDate();
            var re_mes = ret_fecha.getMonth() + 1;
            var re_año = ret_fecha.getFullYear();
            var ret_fecha = re_año + '-' + padLeft(re_mes, 2, '0') + '-' + padLeft(re_dia, 2, '0');
            ret_tipocambio = parseFloat(ret_tipocambio)

            primeraParte.TotalInvoiceAmount = [
                {
                    "_": ret_total,
                    "currencyID": "PEN"//Siempre PEN
                }
            ]

            var total_solo_pago = 0
            for (var h = 0; h < applycount; h++) {
                var referencia = {}
                var apply = openRecord.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: h });
                if (apply == 'T' || apply == true) {
                    var total_pago_item = 0;
                    var amount_pag = 0
                    var amount_ret = openRecord.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: h });
                    var trantype = openRecord.getSublistValue({ sublistId: 'apply', fieldId: 'trantype', line: h });
                    var doc = openRecord.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: h });
                    var ref_id_secuencial = ""
                    var ref_tipo_documento = ""

                    //!Factura de Referencia
                    if (trantype == 'VendBill') {
                        var openRecordRef = record.load({ type: 'vendorbill', id: doc, isDynamic: true });
                        var ref_serie = openRecordRef.getValue('custbody_pe_serie_cxp');
                        var ref_correlativo = openRecordRef.getValue('custbody_pe_number');
                        var ref_tipo = openRecordRef.getValue('custbody_pe_document_type');
                        var ref_fecha = openRecordRef.getValue('trandate');
                        var ref_monto_total = openRecordRef.getValue('usertotal');
                        var ref_currency = openRecordRef.getValue('currency');
                        var dia = ref_fecha.getDate();
                        var mes = ref_fecha.getMonth() + 1; // Meses comienzan en 0, por lo que sumamos 1
                        var año = ref_fecha.getFullYear();
                        var ref_fecha = año + '-' + padLeft(mes, 2, '0') + '-' + padLeft(dia, 2, '0');

                        ref_id_secuencial = ref_serie + "-" + ref_correlativo

                        var openRecordRefTipo = record.load({ type: 'customrecord_pe_fiscal_document_type', id: ref_tipo, isDynamic: true });
                        ref_tipo_documento = openRecordRefTipo.getValue('custrecord_pe_code_document_type');

                        var ref_monedaRecord = record.load({ type: 'Currency', id: ref_currency, isDynamic: true });
                        var ref_moneda = ref_monedaRecord.getValue('symbol');
                    }

                    referencia.ID = [
                        {
                            "_": ref_id_secuencial,
                            "schemeID": ref_tipo_documento
                        }
                    ]
                    referencia.IssueDate = [
                        {
                            "_": ref_fecha
                        }
                    ]
                    //ref_monto_total
                    referencia.TotalInvoiceAmount = [
                        {
                            "_": ref_monto_total.toFixed(2),
                            "currencyID": ref_moneda
                        }
                    ]

                    //!Documento de Pago
                    var vendorPaymentSearch = search.create({
                        type: 'vendorpayment',
                        filters: [['transactionnumber', 'is', doc_pago]],
                        columns: ['internalid', 'total', 'currency', 'trandate']
                    });
                    var vendorPrepaymentSearch = search.create({
                        type: 'vendorprepaymentapplication',
                        filters: [['transactionnumber', 'is', doc_pago]],
                        columns: ['internalid', 'total', 'currency', 'trandate']
                    });
                    var Payment_ID = ""
                    // var Payment_PaidAmount = ""
                    var Payment_currencyID = ""
                    var Payment_PaidDate = ""
                    var searchResultsDocPago = vendorPaymentSearch.run().getRange({ start: 0, end: 1 });
                    var searchResultsDocPagoPrepayment = vendorPrepaymentSearch.run().getRange({ start: 0, end: 1 });
                    // if (searchResultsDocPago && searchResultsDocPago.length > 0) {
                    Payment_ID = searchResultsDocPago.length > 0 ? searchResultsDocPago[0].getValue(vendorPaymentSearch.columns[0]) : searchResultsDocPagoPrepayment[0].getValue(vendorPrepaymentSearch.columns[0]);
                    Payment_currencyID = searchResultsDocPago.length > 0 ? searchResultsDocPago[0].getValue(vendorPaymentSearch.columns[2]) : searchResultsDocPagoPrepayment[0].getValue(vendorPrepaymentSearch.columns[2]);
                    Payment_currencyID = record.load({ type: 'Currency', id: Payment_currencyID, isDynamic: true });
                    Payment_currencyID = Payment_currencyID.getValue('symbol');
                    Payment_PaidDate = searchResultsDocPago.length > 0 ? searchResultsDocPago[0].getValue(vendorPaymentSearch.columns[3]).toString() : searchResultsDocPagoPrepayment[0].getValue(vendorPrepaymentSearch.columns[3]).toString();
                    Payment_PaidDate = Payment_PaidDate.split('/')
                    Payment_PaidDate = Payment_PaidDate[2] + '-' + padLeft(Payment_PaidDate[1], 2, '0') + '-' + padLeft(Payment_PaidDate[0], 2, '0');
                    var typesublist = searchResultsDocPago.length > 0 ? 'apply' : 'bill';
                    var openRecordVendPay = record.load({ type: searchResultsDocPago.length > 0 ? 'vendorpayment' : 'vendorprepaymentapplication', id: Payment_ID, isDynamic: true });
                    var applycountVendPay = openRecordVendPay.getLineCount({ sublistId: typesublist });
                    for (var i = 0; i < applycountVendPay; i++) {
                        var apply_ = openRecordVendPay.getSublistValue({ sublistId: typesublist, fieldId: 'apply', line: i });
                        var doc_ = openRecordVendPay.getSublistValue({ sublistId: typesublist, fieldId: 'doc', line: i });
                        if ((apply_ == 'T' || apply_ == true) && doc == doc_) {
                            amount_pag = openRecordVendPay.getSublistValue({ sublistId: typesublist, fieldId: 'amount', line: i });
                            total_pago_item = parseFloat(amount_ret) + parseFloat(amount_pag)
                            total_solo_pago += parseFloat(amount_pag)
                        }
                    }
                    //}
                    //total_pago_item
                    referencia.Payment = [
                        {
                            "ID": [
                                {
                                    "_": Payment_ID
                                }
                            ],
                            "PaidAmount": [
                                {
                                    "_": total_pago_item.toFixed(2),
                                    "currencyID": Payment_currencyID
                                }
                            ],
                            "PaidDate": [
                                {
                                    "_": Payment_PaidDate
                                }
                            ]
                        }
                    ]

                    //!Información de Retención
                    referencia.SUNATRetentionInformation = [
                        {
                            "SUNATRetentionAmount": [
                                {
                                    "_": (parseFloat(amount_ret) * parseFloat(ret_tipocambio)).toFixed(2),
                                    "currencyID": "PEN"//Siempre PEN
                                }
                            ],
                            "SUNATRetentionDate": [
                                {
                                    "_": ret_fecha
                                }
                            ],
                            "SUNATNetTotalPaid": [
                                {
                                    "_": (parseFloat(amount_pag) * parseFloat(ret_tipocambio)).toFixed(2),
                                    "currencyID": "PEN"//Siempre PEN
                                }
                            ],
                            "ExchangeRate": [
                                {
                                    "SourceCurrencyCode": [
                                        {
                                            "_": ref_moneda
                                        }
                                    ],
                                    "TargetCurrencyCode": [
                                        {
                                            "_": "PEN"//Siempre PEN
                                        }
                                    ],
                                    "CalculationRate": [
                                        {
                                            "_": ret_tipocambio
                                        }
                                    ],
                                    "Date": [
                                        {
                                            "_": ret_fecha
                                        }
                                    ]
                                }
                            ]
                        }
                    ]

                    refrencias.push(referencia)
                }
            }
            primeraParte.SUNATTotalPaid = [
                {
                    "_": (total_solo_pago * parseFloat(ret_tipocambio)).toFixed(2),
                    "currencyID": "PEN"//Siempre PEN
                }
            ]


            primeraParte.SUNATRetentionDocumentReference = refrencias;

            var monnetJson = {
                "_D": "urn:sunat:names:specification:ubl:peru:schema:xsd:Retention-1",
                "_A": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
                "_B": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
                "_E": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
                "_SUNAT": "urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1",
                "Retention": [primeraParte]
            }
            monnetJson = JSON.stringify(monnetJson);

            var filename = Emi_RUC + '-' + tipo_comprobante + '-' + numeracion;
            var ticket = tipo_comprobante + '-' + numeracion

            var filejson = generateFileJSON(filename, monnetJson);
            var filejson = file.load({ id: filejson });


            setRecordVendor(tipo_comprobante, documentid, ticket, filejson.id)
            return 'Transacción ' + ticket + ' generada ' + ' - ';
        }

        //!INVOICE/CASHSALE ============================================================================================================================
        function createRequest(documentid, tranType, type) {
            var trace = 'createRequest 0';
            //try {

            //logError(documentid, 'Transaction Type: ' + tranType + ' - ' + type, 'Este es un log de prueba - Factura de venta ');
            var suma_descuentos_parciales = 0;

            var searchLoad = search.create({
                type: "transaction",
                filters:
                    [
                        ["type", "anyof", 'CustInvc'],
                        "AND",
                        ["internalid", "anyof", documentid],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        //<I> rhuaccha: 2024-05-07 change requested by bruno.acosta@evol.biz
                        // search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),//0
                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie.custrecord_pe_serie_impresion}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),
                        //<F> rhuaccha: 2024-05-07 change requested by bruno.acosta@evol.biz
                        search.createColumn({ name: "trandate", label: "2 Date" }),
                        search.createColumn({ name: "datecreated", label: "3 Date Created" }),
                        search.createColumn({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type", label: "codigo" }),//3
                        search.createColumn({ name: "symbol", join: "Currency", label: "5 Symbol" }),
                        search.createColumn({ name: "otherrefnum", join: "createdFrom", label: "6 PO/Check Number" }),
                        // EMI---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulanumeric", formula: "6", label: "7 Doc. Type ID EMI" }),//6
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "8 Tax ID" }),
                        search.createColumn({ name: "formulatext", formula: "{subsidiary.name}", label: "9 Trade Name" }),//8
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }),
                        search.createColumn({ name: "address1", join: "location", label: "11 Address 1" }),
                        search.createColumn({ name: "address2", join: "location", label: "12 Address 2" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "13 Address 1" }),

                        search.createColumn({ name: "state", join: "subsidiary", label: "14 State/Province" }),
                        search.createColumn({ name: "address3", join: "subsidiary", label: "15 Address 3" }),
                        search.createColumn({ name: "billcountrycode", label: "16 Billing Country Code" }),
                        search.createColumn({ name: "phone", join: "subsidiary", label: "17 Phone" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "18 Email" }),
                        search.createColumn({ name: "formulatext", formula: "'0000'", label: "19 Cod Sunat" }),//18
                        // REC---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {customer.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "20 Doc. Type ID REC" }),//19
                        search.createColumn({ name: "custentity_pe_document_number", join: "customer", label: "21 Tax Number" }), // name por cambiar campo 
                        search.createColumn({ name: "companyname", join: "customer", label: "22 Company Name" }),
                        search.createColumn({ name: "address1", join: "customer" }),
                        search.createColumn({ name: "billaddress2", label: "24 Address 2" }),
                        search.createColumn({ name: "city", join: "customer", label: "25 City" }),
                        search.createColumn({ name: "state", join: "customer", label: "26 State/Province" }),
                        search.createColumn({ name: "address2", join: "customer", label: "27 Address 3" }),
                        search.createColumn({ name: "country", join: "customer", label: "28 Country Code" }),
                        search.createColumn({ name: "phone", join: "customer", label: "29 Phone" }),
                        search.createColumn({ name: "email", join: "customer", label: "30 Email" }),
                        // CAB---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custbody_pe_operation_type", label: "31 PE Cod Fact" }),
                        search.createColumn({ name: "custrecord_pe_cod_fact", join: "custbody_pe_ei_operation_type", label: "31 PE Cod Fact" }),
                        search.createColumn({ name: "duedate", label: "32 Due Date/Receive By" }),
                        // ADI---------------------------------------------------------------------------------------------------------------------

                        // COM---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custbody_pe_document_type", label: "34 PE Document Type" }),
                        search.createColumn({ name: "custbody_pe_serie", label: "35 PE Serie" }),
                        // REC---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "internalid", join: "customer", label: "36 Internal ID" }),
                        // COM---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulanumeric", formula: "TO_NUMBER({custbody_pe_number})", label: "37 Formula (Numeric)" }),//36
                        search.createColumn({ name: "createdfrom", label: "38 Created From" }),
                        // ADI---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "location", label: "39 Location" }),
                        search.createColumn({ name: "formulatext", formula: "CONCAT({salesRep.firstname}, CONCAT(' ', {salesRep.lastname}))", label: "40 Formula (Text)" }),//39
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "tranid", join: "createdFrom", label: "41 Document Number" }),
                        // REC---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulatext", formula: "CONCAT({customer.firstname}, CONCAT('-', {customer.lastname}))", label: "42 Formula (Text)" }),//41
                        search.createColumn({ name: "custbody_pe_free_operation", label: "43 Transferencia Libre" }),
                        // ADI DETRACCION---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "formaPagoDetr" }),
                        search.createColumn({ name: "custbody_pe_concept_detraction", label: "conceptDetr" }),
                        // search.createColumn({ name: "custrecord_pe_detraccion_account", join: "subsidiary", label: "numCuentaBcoNacionDetr" }),
                        search.createColumn({ name: "custcol_4601_witaxamount", label: "montoDetrac" }),
                        search.createColumn({ name: "custbody_pe_percentage_detraccion", label: "porcentajeDetr" }),
                        search.createColumn({ name: "exchangerate", label: "Exchange Rate" }),
                        // IMM:REFERENCIA
                        search.createColumn({ name: "custbody_pe_document_type_ref" }),
                        search.createColumn({ name: "custbody_pe_document_series_ref", label: "ref_series" }),
                        search.createColumn({ name: "custbody_pe_document_number_ref", label: "ref_number" }),
                        search.createColumn({ name: "custbody_pe_document_date_ref", label: "fehca" }),
                        search.createColumn({ name: "zip", join: "subsidiary", label: "zip" }),

                        search.createColumn({ name: "city", join: "subsidiary", label: "city" }),
                        search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                        search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),//custrecord_pe_distrito
                        search.createColumn({ name: "subsidiary" }),
                        search.createColumn({ name: "name", join: "custbody_pe_reason", label: "name" }),
                        search.createColumn({ name: "custrecord_pe_codigo_motivo", join: "custbody_pe_reason", label: "custrecord_pe_codigo_motivo" }),
                        search.createColumn({ name: "firstname", join: "customer" }),
                        search.createColumn({ name: "lastname", join: "customer" }),
                        search.createColumn({ name: "entity" }),
                        search.createColumn({ name: "name", join: "custbody_pe_concept_detraction" }),
                        search.createColumn({ name: "custrecord_pe_code_detraccion", join: "custbody_pe_concept_detraction" }),
                        search.createColumn({ name: "debitfxamount" }),
                        search.createColumn({ name: "memo" }),
                        search.createColumn({ name: "location" }),
                        search.createColumn({ name: "terms" }),
                        //search.createColumn({ name: "custbody_pefacturarelacionadaalanticip" }),
                        //search.createColumn({ name: "custbody_pe_serie", join: "custbody_pefacturarelacionadaalanticip" }),
                        //search.createColumn({ name: "custbody_pe_number", join: "custbody_pefacturarelacionadaalanticip" }),
                        search.createColumn({ name: "createdfrom", label: "Created From" }),
                        search.createColumn({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type_ref", label: "custrecord_pe_code_document_type" }),
                        search.createColumn({ name: "otherrefnum" }),
                        //Inicio - dfernandez - 10/05/2024
                        search.createColumn({ name: "tranid", join: "createdfrom", label: "Pedido" }),
                        //search.createColumn({ name: "custbody_sj_motiv_venta", join: "createdfrom", label: "Motivo" }),
                        search.createColumn({ name: "salesrep", join: "createdfrom", label: "Vendedor" }),
                        //Fin - dfernandez - 10/05/2024
                        //Inicio - jEchevarria - 2024-05-28 2072
                        //search.createColumn({ name: "custbody_sj_origen", label: "SJ - ORIGEN" }),
                        // search.createColumn({ name: "custbody_sj_destino", label: "SJ - DESTINO" }),
                        // search.createColumn({ name: "custbody_sj_partida", label: "SJ - PARTIDA ARANCELARIA" }),
                        // search.createColumn({ name: "custbody_sj_incoterm", label: "SJ - INCOTERM" }),

                        search.createColumn({ name: "shipaddress", join: "createdfrom", label: "ENVIAR A" }),
                        search.createColumn({ name: "custbody_pe_ei_operation_type", label: "PE TIPO DE OPERACIÓN" }),
                        search.createColumn({ name: "salesrep", label: "Vendedor Factura" }),
                        search.createColumn({ name: "companyname", join: 'customer', label: "PE TIPO DE OPERACIÓN" }),
                        //Fin - jEchevarria - 2024-05-28 2077
                        //<I> rhuaccha: 2024-08-12
                        //search.createColumn({ name: "custbody_pe_donacion", label: "EsDonacion" }),
                        search.createColumn({ name: "custrecord_pe_cuenta_banco_nacion", join: "subsidiary", label: "CtaDetraccion" }),
                        //<F> rhuaccha: 2024-08-12
                    ]

            });
            var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            var valorneto = searchResult[0].getValue({ name: "debitfxamount" });
            var memo = searchResult[0].getValue({ name: "memo" });
            var anticipotaxtotal = 0;
            var anticipototal = 0;
            var anticiposubtotal = 0;
            var correo = searchResult[0].getValue({ name: "email", join: "customer", label: "30 Email" });
            var custbody_pe_ei_forma_pago = searchResult[0].getText({ name: "custbody_pe_ei_forma_pago", label: "formaPagoDetr" });
            var anticipo = searchResult[0].getValue({ name: "custbody_pefacturarelacionadaalanticip" });
            var anticiposerie = searchResult[0].getText({ name: "custbody_pe_serie", join: "custbody_pefacturarelacionadaalanticip" }) + '-' + searchResult[0].getValue({ name: "custbody_pe_number", join: "custbody_pefacturarelacionadaalanticip" });

            if (anticipo) {
                var facturaanticipo = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", 'CustInvc'],
                            "AND",
                            ["internalid", "anyof", anticipo],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custentity_pe_document_number", join: "customer" }),
                            search.createColumn({ name: "custentity_pe_code_document_type", join: "customer" }),
                            search.createColumn({ name: "taxtotal" }),
                            search.createColumn({ name: "total" }),

                            search.createColumn({ name: "trandate" }),
                            search.createColumn({ name: "symbol", join: "Currency" }),

                        ]
                });
                var searchResultanticipo = facturaanticipo.run().getRange({ start: 0, end: 1 });
                var anticipodoc = searchResultanticipo[0].getValue({ name: "custentity_pe_document_number", join: "customer" });
                var anticipotype = searchResultanticipo[0].getValue({ name: "custentity_pe_code_document_type", join: "customer" });
                anticipotaxtotal = searchResultanticipo[0].getValue({ name: "taxtotal" });
                anticipototal = searchResultanticipo[0].getValue({ name: "total" });
                anticiposubtotal = parseFloat(anticipototal) - parseFloat(anticipotaxtotal);
                var anticipocurrency = searchResultanticipo[0].getValue({ name: "symbol", join: "Currency" });
                var anticipofechaEmision = searchResultanticipo[0].getValue({ name: "trandate" });
                anticipofechaEmision = anticipofechaEmision.split('/');
                anticipofechaEmision = anticipofechaEmision[2] + '-' + padLeft(anticipofechaEmision[1], 2, '0') + '-' + padLeft(anticipofechaEmision[0], 2, '0');
            }
            var intercotransaction = searchResult[0].getValue({ name: "createdfrom", label: "Created From" });

            var CustomerInternal = searchResult[0].getValue({ name: "entity" });
            var otherrefnum = searchResult[0].getValue({ name: "otherrefnum" });

            var NewLocation = searchResult[0].getText({ name: "location" });
            var newTerms = searchResult[0].getText({ name: "terms" });

            var searchLoadCustomer = search.create({
                type: "customer",
                filters:
                    [
                        ["internalid", "anyof", CustomerInternal],
                        "AND",
                        ["address.isdefaultbilling", "is", "T"]
                    ],
                columns:
                    [
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" }),//0
                        search.createColumn({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" }),
                        search.createColumn({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" }),
                        search.createColumn({ name: "state", join: "Address", label: "city" }),
                        search.createColumn({ name: "address1", join: "Address", label: " Address 1" }),
                    ]
            });
            var searchResultCustomer = searchLoadCustomer.run().getRange({ start: 0, end: 200 });

            var searchLoadSubsidiaria = search.create({
                type: "subsidiary",
                filters:
                    [
                        ["internalid", "anyof", searchResult[0].getValue({ name: "subsidiary" })]
                    ],
                columns:
                    [
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" }),//0
                        search.createColumn({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" }),
                        search.createColumn({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" }),
                        search.createColumn({ name: "city", join: "Address", label: "city" }),
                        search.createColumn({ name: "address1", join: "address", label: " Address 1" }),


                    ]
            });
            var searchResultSubsidiaria = searchLoadSubsidiaria.run().getRange({ start: 0, end: 200 });

            var tipodedoc = searchResult[0].getValue({ name: "custrecord_pe_cod_fact", join: "custbody_pe_ei_operation_type", label: "31 PE Cod Fact" });
            var zipCustomer = "";
            var distrito = "";
            var departamentosub = "12";
            var city = "";
            var address1 = "";

            if (searchResultCustomer.length > 0) {
                zipCustomer = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" });
                distrito = searchResultCustomer[0].getValue({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" });
                departamentosub = searchResultCustomer[0].getValue({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" });
                city = searchResultCustomer[0].getValue({ name: "state", join: "Address", label: "city" });
                address1 = searchResultCustomer[0].getValue({ name: "address1", join: "address", label: " Address 1" });
            }
            var zip = searchResult[0].getValue({ name: "zip", join: "subsidiary", label: "zip" });
            var addr2 = searchResult[0].getValue({ name: "address2", join: "subsidiary", label: "address2" });
            var column13 = searchResult[0].getValue({ name: "address1", join: "subsidiary" });
            var column14 = searchResult[0].getValue({ name: "state", join: "subsidiary" });
            var departamento = searchResult[0].getValue({ name: "city", join: "subsidiary" });

            if (searchResultSubsidiaria.length > 0) {
                zip = searchResultSubsidiaria[0].getValue({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" });
                addr2 = searchResultSubsidiaria[0].getValue({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" });
                column13 = searchResultSubsidiaria[0].getValue({ name: "address1", join: "address", label: " Address 1" });
                column14 = searchResultSubsidiaria[0].getValue({ name: "city", join: "Address", label: "city" });
                departamento = searchResultSubsidiaria[0].getValue({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" });
            }
            var nameDetraccion = searchResult[0].getValue({ name: "name", join: "custbody_pe_concept_detraction" });

            var codeDetraccion = searchResult[0].getValue({ name: "custrecord_pe_code_detraccion", join: "custbody_pe_concept_detraction" });

            // IDE---------------------------------------------------------------------------------------------------------------------
            var numeracion = searchResult[0].getValue(searchLoad.columns[0]);


            var contry = searchResult[0].getValue({ name: "country", join: "subsidiary", label: "country" });

            var reason = searchResult[0].getValue({ name: "name", join: "custbody_pe_reason", label: "name" });
            var reasoncodigo = searchResult[0].getValue({ name: "custrecord_pe_codigo_motivo", join: "custbody_pe_reason", label: "custrecord_pe_codigo_motivo" });
            // IMM:REFERENCIA

            var ref_tipo_docs = searchResult[0].getValue({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type_ref", label: "custrecord_pe_code_document_type" });
            var series_ref = searchResult[0].getValue({ name: "custbody_pe_document_series_ref", label: "series_ref" });
            var ref_number = searchResult[0].getValue({ name: "custbody_pe_document_number_ref", label: "ref_number" });

            var fechaEmision = searchResult[0].getValue({ name: "trandate" });
            fechaEmision = fechaEmision.split('/');
            fechaEmision = fechaEmision[2] + '-' + padLeft(fechaEmision[1], 2, '0') + '-' + padLeft(fechaEmision[0], 2, '0');
            var horaEmision = searchResult[0].getValue({ name: "datecreated" });
            horaEmision = horaEmision.split(' ');
            horaEmision = horaEmision[1] + ':00';
            var codTipoDocumento = searchResult[0].getValue(searchLoad.columns[3]);
            if (codTipoDocumento == NOTA_DEBITO) {
                var fechaEmisionRef = searchResult[0].getValue({ name: "custbody_pe_document_date_ref" });
                fechaEmisionRef = fechaEmisionRef.split('/');
                fechaEmisionRef = fechaEmisionRef[2] + '-' + padLeft(fechaEmisionRef[1], 2, '0') + '-' + padLeft(fechaEmisionRef[0], 2, '0');

            }

            //IMorales 20231012
            var discounttotal = 0
            var estgrossprofit = 0
            var taxtotal_invoice = 0
            if (tranType == 'invoice') {
                if (codTipoDocumento == FACTURA || codTipoDocumento == BOLETA) {
                    log.debug('MSK', 'codTipoDocumento=' + codTipoDocumento)
                    // Recuperar un registro de factura (Invoice) por su ID
                    var invoiceRecord = record.load({
                        type: record.Type.INVOICE,
                        id: documentid // Reemplaza documentid con el ID de la factura que deseas consultar
                    });

                    // Obtener el valor del campo personalizado "discountitem"
                    _discounttotal = invoiceRecord.getValue('discounttotal');//Total Descuento (Des Global)
                    _estgrossprofit = invoiceRecord.getValue('estgrossprofit');//SubTotal despues de aplicar Dcto (Des Parcial y Des Global)
                    _taxtotal = invoiceRecord.getValue('taxtotal');//igv despues de aplicar dcto (Des Parcial y Des Global)

                    log.debug('MSK', '_discounttotal=' + _discounttotal)
                    log.debug('MSK', '_estgrossprofit=' + _estgrossprofit)
                    log.debug('MSK', '_taxtotal=' + _taxtotal)
                    if (_discounttotal) {
                        discounttotal = (-1) * parseFloat(_discounttotal)
                    }
                    if (_estgrossprofit) {
                        estgrossprofit = parseFloat(_estgrossprofit)
                    }
                    if (_taxtotal) {
                        taxtotal_invoice = parseFloat(_taxtotal)
                    }
                }
            }
            var column05 = searchResult[0].getValue({ name: "symbol", join: "Currency" });

            // EMI---------------------------------------------------------------------------------------------------------------------
            var column07 = searchResult[0].getValue(searchLoad.columns[6]);
            var column08 = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary" });
            var column09 = searchResult[0].getValue(searchLoad.columns[8]);
            var column10 = searchResult[0].getValue({ name: "legalname", join: "subsidiary" });



            // REC---------------------------------------------------------------------------------------------------------------------
            var column20 = searchResult[0].getValue(searchLoad.columns[19]);
            //var column21 = searchResult[0].getValue({ name: "vatregnumber", join: "customer" });
            var column22 = searchResult[0].getValue({ name: "companyname", join: "customer" });
            if (column20 == "1") {
                var column22 = searchResult[0].getValue({ name: "firstname", join: "customer" }) + ' ' + searchResult[0].getValue({ name: "lastname", join: "customer" });
            }
            var column21 = searchResult[0].getValue({ name: "custentity_pe_document_number", join: "customer" });


            var column25 = searchResult[0].getValue({ name: "city", join: "customer" });
            var column26 = searchResult[0].getValue({ name: "state", join: "customer" });
            var column27 = searchResult[0].getValue({ name: "address2", join: "customer" });
            var column28 = searchResult[0].getValue({ name: "country", join: "customer" });

            // CAB---------------------------------------------------------------------------------------------------------------------
            var column32 = searchResult[0].getValue({ name: "duedate" });
            if (column32 != '') {
                column32 = column32.split('/');
                column32 = column32[2] + '-' + padLeft(column32[1], 2, '0') + '-' + padLeft(column32[0], 2, '0');

            } else {
                column32 = fechaEmision;
            }
            // ADI---------------------------------------------------------------------------------------------------------------------
            var conceptDetr = searchResult[0].getText({ name: "custbody_pe_concept_detraction", label: "conceptDetr" });
            if (conceptDetr.length > 0) {
                conceptDetr = conceptDetr.split(' ')[0];
            }
            var montoDetr = 0;
            var suma = 0
            var medioPagoDetr = 'Depósito en cuenta';
            var porcentajeDetr = searchResult[0].getValue({ name: "custbody_pe_percentage_detraccion", label: "porcentajeDetr" });
            porcentajeDetr = porcentajeDetr.replace(/%/g, '');
            var tipoCambio = searchResult[0].getValue({ name: "exchangerate", label: "Exchange Rate" });
            // FREE--------------------------------------------------------------------------------------------------------------------
            var column43 = searchResult[0].getValue({ name: "custbody_pe_free_operation" });
            var isDonation = searchResult[0].getValue({ name: "custbody_pe_donacion" });

            //*********************************** CONSTRUCCION DE TRAMA ***************************************/
            var nmro_documento = '';
            var razon_social = '';
            var direccion_cliente = '';
            nmro_documento = column21;
            razon_social = column22;
            direccion_cliente = address1;
            trace = 'createRequest 1';
            log.debug('documentid', documentid);
            log.debug('column43', column43);
            log.debug('tranType', tranType);
            log.debug('isDonation', isDonation);
            log.debug('tipodedoc', tipodedoc);
            var detail = getDetail(documentid, column43, tranType, isDonation, tipodedoc);
            log.debug('detail', detail);
            // saveJson(detail, numeracion + '.json');
            var grav = detail.gravadas;
            montoDetr = detail.montoDetracion;
            //montoDetr = detail.montoDetracion;
            var montoLetras = detail.importetotal;
            var taxelement = new Array();
            var totalVentas = 0;
            var TaxAmount = 0;
            var TaxScheme = 0;
            var apliccaanticipo = 0
            var taxcheme;
            var TaxTypeCode = 'VAT';
            if (grav != 'Vacio') {
                totalVentas = totalVentas + parseFloat(grav.totalVentas);
                TaxAmount = detail.totalimpuestosgra[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosgra[0].idImpuesto;
                taxcheme = 'IGV';
                if (column43 == true || isDonation == true) { //<I> rhuaccha: 2024-08-12
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(grav.totalVentas, column05, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;
            }
            var exo = detail.exoneradas;
            if (exo != 'Vacio') {
                totalVentas = totalVentas + parseFloat(exo.totalVentas);
                TaxAmount = detail.totalimpuestosexo[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosexo[0].idImpuesto;
                taxcheme = 'EXO';
                if (column43 == true || isDonation == true) { //<I> rhuaccha: 2024-08-12
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(exo.totalVentas, column05, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;

            }
            var grat = detail.gratuita;
            if (grat != 'Vacio') {

                TaxAmount = detail.totalimpuestoigratuita[0].montoImpuesto;
                TaxScheme = detail.totalimpuestoigratuita[0].idImpuesto;
                TaxTypeCode = 'FRE'
                taxcheme = 'GRA';
                var taxableAmount = TaxableAmount(grat.totalVentas, column05, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;

            }
            var ina = detail.inafectas;
            if (ina != 'Vacio') {
                totalVentas = totalVentas + parseFloat(ina.totalVentas);
                TaxAmount = detail.totalimpuestosina[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosina[0].idImpuesto;
                taxcheme = 'INA';
                TaxTypeCode = 'FRE';
                if (column43 == true || isDonation == true) { //<I> rhuaccha: 2024-08-12
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(ina.totalVentas, column05, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;

            }
            var exp = detail.exportacion;
            if (exp != 'Vacio') {
                totalVentas = totalVentas + parseFloat(exp.totalVentas);
                TaxAmount = detail.totalimpuestoiExport[0].montoImpuesto;
                TaxScheme = detail.totalimpuestoiExport[0].idImpuesto;
                taxcheme = 'EXP';
                TaxTypeCode = 'FRE';
                if (column43 == true || isDonation == true) { //<I> rhuaccha: 2024-08-12
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(exp.totalVentas, column05, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;
            }
            trace = 'createRequest 2';
            var detalleItems = new Array();
            var totalImpuertos = 0;
            var valordeventaunitario = 0;
            //INICIO Jechevarria 30-05-2024 2072
            var tipoOperacionValidacion = searchResult[0].getText({ name: "custbody_pe_ei_operation_type", label: "PE TIPO DE OPERACIÓN" });
            var accountDet = searchResult[0].getValue({ name: "custrecord_pe_cuenta_banco_nacion", join: "subsidiary" }); //<I> rhuaccha: 2024-10-11
            //imprimimos el json 
            //saveJson(detail, "detalle_Factura");
            //FIN jechevarria 30-05-2024 2077 
            //Insercion del detalle del documento
            trace = 'createRequest 3';
            var subtotalAmount = 0; //<I> rhuaccha: 2024-09-16
            for (var i = 0; i < detail.det.length; i++) {
                subtotalAmount += detail.det[i].amount; //<I> rhuaccha: 2024-09-16
                totalImpuertos = totalImpuertos + parseFloat(detail.det[i].totalImpuestos[0].montoImpuesto);
                valordeventaunitario = parseFloat(detail.det[i].valorVenta) / parseFloat(detail.det[i].cantidadItems)
                //INICIO jechevarria 19/06/2024
                var importeBruto = parseFloat(detail.det[i].importeBruto);
                var descuento = 0;
                if (detail.det[i].cargoDescuento) {
                    descuento = parseFloat(detail.det[i].cargoDescuento[0].importeBruto);
                }
                var campo_AT = importeBruto + descuento;
                campo_AT = campo_AT.toFixed(2);


                detalleItems.push({
                    "ID": [
                        {
                            "_": detail.det[i].numeroItem
                        }
                    ],
                    "Note": [
                        {
                            "_": detail.det[i].unidad
                        }
                    ],
                    "InvoicedQuantity": [
                        {
                            "_": detail.det[i].cantidadItems,
                            "unitCode": detail.det[i].unidad,
                            "unitCodeListID": "UN/ECE rec 20",
                            "unitCodeListAgencyName": "United Nations Economic Commission for Europe"
                        }
                    ],
                    "LineExtensionAmount": [
                        {
                            "_": detail.det[i].valorVenta,
                            "currencyID": column05
                        }
                    ]
                });


                //<F> rhuaccha: 2024-09-13
                //cambio jechevarria 19/06/2024, Se configura en la linea 5174
                /*  if (codTipoDocumento == NOTA_DEBITO) {
                     
                     if (detail.det[i].valorVenta) {
                         BillingReferenceLine.push({
                             ID: [
                                 {
                                     _: detail.det[i].valorVenta,
                                     schemeID: "AP"
                                 }
                             ]
                         })
 
                     }
                     if (detail.det[i].cargoDescuento) {
                         var factor = detail.det[i].cargoDescuento[0].factorCargoDescuento * 100;
                         //lo convertimos a un texto del formato ##.##
                         factor = factor.toFixed(2) + '';
                         BillingReferenceLine.push({
                             ID: [
                                 {
                                     _: factor,
                                     schemeID: "AO"
                                 }
                             ]
                         })
                     }
                     
 
                 } */




                //FIN  jechevarria 30-05-2024

                //Inicio - dfernandez - 04/06/2024
                var PricingReference = new Array();
                PricingReference.push({
                    "AlternativeConditionPrice": [
                        {
                            "PriceAmount": [
                                {
                                    "_": column43 == true ? valordeventaunitario.toFixed(2).toString() : detail.det[i].precioVentaUnitario,
                                    "currencyID": column05
                                }
                            ],
                            "PriceTypeCode": [
                                {
                                    "_": detail.det[i].tipoprecio,
                                    "listName": "Tipo de Precio",
                                    "listAgencyName": "PE:SUNAT",
                                    "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16"
                                }
                            ]
                        }
                    ]
                })
                detalleItems[i].PricingReference = PricingReference;
                //Fin - dfernandez - 04/06/2024

                //IMorales 20231011
                if (detail.det[i].cargoDescuento) {
                    detalleItems[i].AllowanceCharge = [{
                        "ChargeIndicator": [
                            {
                                "_": detail.det[i].cargoDescuento[0].indicadorCargoDescuento,
                            }
                        ],
                        "AllowanceChargeReasonCode": [
                            {
                                "_": detail.det[i].cargoDescuento[0].codigoCargoDescuento,
                                "listAgencyName": "PE:SUNAT",
                                "listName": "Cargo/descuento",
                                "listschemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo53"
                            }
                        ],
                        "Amount": [
                            {
                                "_": detail.det[i].cargoDescuento[0].montoCargoDescuento,
                                "currencyID": column05
                            }
                        ],
                        "BaseAmount": [
                            {
                                "_": detail.det[i].cargoDescuento[0].montoBaseCargoDescuento,
                                "currencyID": column05
                            }
                        ]
                    }]


                    suma_descuentos_parciales += parseFloat("0" + detail.det[i].cargoDescuento[0].montoCargoDescuento)
                }
                //Cambio Jechevarria 19/06/2024
                if (detail.det[i].taxcheme === "GRA") {
                    if (codTipoDocumento == FACTURA || codTipoDocumento == BOLETA) {
                        if (column43 == false) {
                            detalleItems[i].TaxTotal = [
                                {
                                    "TaxAmount": [
                                        {
                                            "_": "0.00",
                                            "currencyID": column05
                                        }
                                    ],
                                    "TaxSubtotal": [
                                        {
                                            "TaxableAmount": [
                                                {
                                                    "_": detail.det[i].totalImpuestos[0].montoBase,
                                                    "currencyID": column05
                                                }
                                            ],
                                            "TaxAmount": [
                                                {
                                                    "_": "0.00",
                                                    "currencyID": column05
                                                }
                                            ],
                                            "TaxCategory": [
                                                {
                                                    "Percent": [
                                                        {
                                                            "_": detail.det[i].totalImpuestos[0].porcentaje
                                                        }
                                                    ],
                                                    "TaxExemptionReasonCode": [
                                                        {
                                                            "_": detail.det[i].totalImpuestos[0].tipoAfectacion,
                                                            "listAgencyName": "PE:SUNAT",
                                                            "listName": "Afectacion del IGV",
                                                            "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07"
                                                        }
                                                    ],
                                                    "TaxScheme": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": detail.det[i].totalImpuestos[0].idImpuesto,
                                                                    "schemeName": "Codigo de tributos",
                                                                    "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                                                    "schemeAgencyName": "PE:SUNAT"
                                                                }
                                                            ],
                                                            "Name": [
                                                                {
                                                                    "_": detail.det[i].taxcheme
                                                                }
                                                            ],
                                                            "TaxTypeCode": [
                                                                {
                                                                    "_": detail.det[i].TaxTypeCode
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        } else {
                            detalleItems[i].TaxTotal = [
                                {
                                    "TaxAmount": [
                                        {
                                            "_": column43 == true ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto,
                                            "currencyID": column05
                                        }
                                    ],
                                    "TaxSubtotal": [
                                        {
                                            "TaxableAmount": [
                                                {
                                                    "_": detail.det[i].totalImpuestos[0].montoBase,
                                                    "currencyID": column05
                                                }
                                            ],
                                            "TaxAmount": [
                                                {
                                                    "_": detail.det[i].totalImpuestos[0].montoImpuesto,
                                                    "currencyID": column05
                                                }
                                            ],
                                            "TaxCategory": [
                                                {
                                                    "Percent": [
                                                        {
                                                            "_": detail.det[i].totalImpuestos[0].porcentaje
                                                        }
                                                    ],
                                                    "TaxExemptionReasonCode": [
                                                        {
                                                            "_": detail.det[i].totalImpuestos[0].tipoAfectacion,
                                                            "listAgencyName": "PE:SUNAT",
                                                            "listName": "Afectacion del IGV",
                                                            "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07"
                                                        }
                                                    ],
                                                    "TaxScheme": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": detail.det[i].totalImpuestos[0].idImpuesto,
                                                                    "schemeName": "Codigo de tributos",
                                                                    "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                                                    "schemeAgencyName": "PE:SUNAT"
                                                                }
                                                            ],
                                                            "Name": [
                                                                {
                                                                    "_": detail.det[i].taxcheme
                                                                }
                                                            ],
                                                            "TaxTypeCode": [
                                                                {
                                                                    "_": detail.det[i].TaxTypeCode
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }


                    } else {
                        detalleItems[i].TaxTotal = [
                            {
                                "TaxAmount": [
                                    {
                                        "_": column43 == true ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto,
                                        "currencyID": column05
                                    }
                                ],
                                "TaxSubtotal": [
                                    {
                                        "TaxableAmount": [
                                            {
                                                "_": detail.det[i].totalImpuestos[0].montoBase,
                                                "currencyID": column05
                                            }
                                        ],
                                        "TaxAmount": [
                                            {
                                                "_": detail.det[i].totalImpuestos[0].montoImpuesto,
                                                "currencyID": column05
                                            }
                                        ],
                                        "TaxCategory": [
                                            {
                                                "Percent": [
                                                    {
                                                        "_": detail.det[i].totalImpuestos[0].porcentaje
                                                    }
                                                ],
                                                "TaxExemptionReasonCode": [
                                                    {
                                                        "_": detail.det[i].totalImpuestos[0].tipoAfectacion,
                                                        "listAgencyName": "PE:SUNAT",
                                                        "listName": "Afectacion del IGV",
                                                        "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07"
                                                    }
                                                ],
                                                "TaxScheme": [
                                                    {
                                                        "ID": [
                                                            {
                                                                "_": detail.det[i].totalImpuestos[0].idImpuesto,
                                                                "schemeName": "Codigo de tributos",
                                                                "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                                                "schemeAgencyName": "PE:SUNAT"
                                                            }
                                                        ],
                                                        "Name": [
                                                            {
                                                                "_": detail.det[i].taxcheme
                                                            }
                                                        ],
                                                        "TaxTypeCode": [
                                                            {
                                                                "_": detail.det[i].TaxTypeCode
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                } else {
                    detalleItems[i].TaxTotal = [
                        {
                            "TaxAmount": [
                                {
                                    "_": column43 == true ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto,
                                    "currencyID": column05
                                }
                            ],
                            "TaxSubtotal": [
                                {
                                    "TaxableAmount": [
                                        {
                                            "_": detail.det[i].totalImpuestos[0].montoBase,
                                            "currencyID": column05
                                        }
                                    ],
                                    "TaxAmount": [
                                        {
                                            "_": detail.det[i].totalImpuestos[0].montoImpuesto,
                                            "currencyID": column05
                                        }
                                    ],
                                    "TaxCategory": [
                                        {
                                            "Percent": [
                                                {
                                                    "_": detail.det[i].totalImpuestos[0].porcentaje
                                                }
                                            ],
                                            "TaxExemptionReasonCode": [
                                                {
                                                    "_": detail.det[i].totalImpuestos[0].tipoAfectacion,
                                                    "listAgencyName": "PE:SUNAT",
                                                    "listName": "Afectacion del IGV",
                                                    "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07"
                                                }
                                            ],
                                            "TaxScheme": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": detail.det[i].totalImpuestos[0].idImpuesto,
                                                            "schemeName": "Codigo de tributos",
                                                            "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                                            "schemeAgencyName": "PE:SUNAT"
                                                        }
                                                    ],
                                                    "Name": [
                                                        {
                                                            "_": detail.det[i].taxcheme
                                                        }
                                                    ],
                                                    "TaxTypeCode": [
                                                        {
                                                            "_": detail.det[i].TaxTypeCode
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
                detalleItems[i].Item = [
                    {
                        "Description": [
                            {
                                // "_": detail.det[i].taxCodeDisplay === 'TTG_PE:TTG' ? detail.det[i].descripcionProducto + ' - BONIFICACIÓN' : detail.det[i].descripcionProducto //detail.det[i].descripcionProducto
                                "_": getItemDescription(detail.det[i].descripcionProducto, detail.det[i].taxCodeDisplay, detail.det[i].cuponCode)
                            }
                        ],
                        "SellersItemIdentification": [
                            {
                                "ID": [
                                    {
                                        "_": detail.det[i].codigoProducto
                                    }
                                ]
                            }
                        ]
                    }
                ]

                detalleItems[i].Price = [
                    {
                        "PriceAmount": [
                            {
                                // "_": column43 == true ? "0.00" : detail.det[i].valorUnitario,
                                "_": (isDonation || column43) ? "0.00" : detail.det[i].valorUnitario, //<I> rhuaccha: 2024-08-12
                                "currencyID": column05
                            }
                        ]
                    }
                ]

            }
            trace = 'createRequest 4';
            //saveJson(detalleItems, "detalle_Factura_debito");
            var totalVentaAplly = parseFloat(totalVentas) + parseFloat(totalImpuertos);
            if (detail.applywh == true) {
                montoLetras = totalVentaAplly;
            }
            var monto = '';
            if (column05 == 'PEN') {
                monto = NumeroALetras(montoLetras, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
            } else {
                monto = NumeroALetrasDolar(montoLetras, { plural: 'DOLARES AMERICANOS', singular: 'DOLAR AMERICANO', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
            }
            trace = 'createRequest 5';
            //IMorales 20231110
            var primeraParte = {}
            if (suma_descuentos_parciales > 0 || discounttotal > 0) {
                log.debug('MSK', 'suma_descuentos_parciales = ' + suma_descuentos_parciales)
                log.debug('MSK', 'discounttotal_global = ' + discounttotal)
                var total_descuento = suma_descuentos_parciales + discounttotal
                log.debug('MSK', 'total_descuento = ' + total_descuento)
                primeraParte = generateCabecera_con_descuento(numeracion, fechaEmision, total_descuento);
            } else {
                primeraParte = generateCabecera(numeracion, fechaEmision);
            }

            var duedate = generateduedate(column32);
            var InvoiceTypeCode = generateInvoiceTypeCode(codTipoDocumento, tipodedoc);
            trace = 'createRequest 6';
            var note = {
                "Note": [
                    {
                        "_": monto.trim(),
                        "languageLocaleID": "1000"
                    }
                ],

                "DocumentCurrencyCode": [
                    {
                        "_": column05,
                        "listID": "ISO 4217 Alpha",
                        "listName": "Currency",
                        "listAgencyName": "United Nations Economic Commission for Europe"
                    }
                ]
            }
            if (memo != '') {
                note.Note.push(
                    {
                        "_": memo
                    }
                )
            }
            //INICIO Jechevarria 19-06-2024 


            if (column43 == true || isDonation == true) { //<I> rhuaccha: 2024-08-12
                note.Note.push(
                    {
                        "_": "TRANSFERENCIA GRATUITA DE UN BIEN Y/O SERVICIO PRESTADO GRATUITAMENTE",
                        "languageLocaleID": "1002"
                    }

                )
            }
            if (detail.applywh == true) {
                note.Note.push(
                    {
                        "_": "Operación sujeta a detracción",
                        "languageLocaleID": "2006"
                    }
                )

            }



            // has discount
            /* if (detail.totalLineDisc && detail.totalLineDisc !== 0 ) {
                subtotalAmount = subtotalAmount - detail.totalLineDisc;
            }*/

            //Fin - dfernandez - 04/06/2024
            trace = 'createRequest 11';
            var discrep = {
                "DiscrepancyResponse": [
                    {
                        "ResponseCode": [
                            {
                                "_": reasoncodigo,
                                "listAgencyName": "PE:SUNAT",
                                "listName": "Tipo de nota de debito",
                                "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo10"
                            }
                        ],
                        "Description": [
                            {
                                "_": reason
                            }
                        ]
                    }
                ],
                "BillingReference": [
                    {
                        "InvoiceDocumentReference": [
                            {
                                "ID": [
                                    {
                                        "_": series_ref + '-' + ref_number
                                    }
                                ],
                                "IssueDate": [
                                    {
                                        "_": fechaEmisionRef
                                    }
                                ],
                                "DocumentTypeCode": [
                                    {
                                        "_": ref_tipo_docs,
                                        "listName": "Tipo de Documento",
                                        "listSchemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01",
                                        "listAgencyName": "PE:SUNAT"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
            var asignature = {
                "Signature": [
                    {
                        "ID": [
                            {
                                "_": "IDSignature"
                            }
                        ],
                        "SignatoryParty": [
                            {
                                "PartyIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": column08
                                            }
                                        ]
                                    }
                                ],
                                "PartyName": [
                                    {
                                        "Name": [
                                            {
                                                "_": column09
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "DigitalSignatureAttachment": [
                            {
                                "ExternalReference": [
                                    {
                                        "URI": [
                                            {
                                                "_": "IDSignature"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "AccountingSupplierParty": [
                    {
                        "Party": [
                            {
                                "PartyIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": column08,
                                                "schemeID": column07,
                                                "schemeName": "Documento de Identidad",
                                                "schemeAgencyName": "PE:SUNAT",
                                                "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06"
                                            }
                                        ]
                                    }
                                ],
                                "PartyName": [
                                    {
                                        "Name": [
                                            {
                                                "_": column10
                                            }
                                        ]
                                    }
                                ],
                                "PartyLegalEntity": [
                                    {
                                        "RegistrationName": [
                                            {
                                                "_": column10
                                            }
                                        ],
                                        "RegistrationAddress": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": zip,
                                                        "schemeAgencyName": "PE:INEI",
                                                        "schemeName": "Ubigeos"
                                                    }
                                                ],
                                                "AddressTypeCode": [
                                                    {
                                                        "_": "0000",
                                                        "listAgencyName": "PE:SUNAT",
                                                        "listName": "Establecimientos anexos"
                                                    }
                                                ],
                                                "CityName": [
                                                    {
                                                        "_": departamento
                                                    }
                                                ],
                                                "CountrySubentity": [
                                                    {
                                                        "_": column14
                                                    }
                                                ],
                                                "District": [
                                                    {
                                                        "_": addr2
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": column13
                                                            }
                                                        ]
                                                    }
                                                ],
                                                "Country": [
                                                    {
                                                        "IdentificationCode": [
                                                            {
                                                                "_": contry,
                                                                "listID": "ISO 3166-1",
                                                                "listAgencyName": "United Nations Economic Commission for Europe",
                                                                "listName": "Country"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "AccountingCustomerParty": [
                    {
                        "Party": [
                            {
                                "PartyIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": nmro_documento,
                                                "schemeID": column20,
                                                "schemeName": "Documento de Identidad",
                                                "schemeAgencyName": "PE:SUNAT",
                                                "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06"
                                            }
                                        ]
                                    }
                                ],
                                "PartyName": [
                                    {
                                        "Name": [
                                            {
                                                "_": razon_social
                                            }
                                        ]
                                    }
                                ],
                                "PartyLegalEntity": [
                                    {
                                        "RegistrationName": [
                                            {
                                                "_": razon_social
                                            }
                                        ],
                                        "RegistrationAddress": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": zipCustomer,
                                                        "schemeAgencyName": "PE:INEI",
                                                        "schemeName": "Ubigeos"
                                                    }
                                                ],
                                                "CityName": [
                                                    {
                                                        "_": city
                                                    }
                                                ],
                                                "CountrySubentity": [
                                                    {
                                                        "_": departamentosub
                                                    }
                                                ],
                                                "District": [
                                                    {
                                                        "_": distrito
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": direccion_cliente
                                                            }
                                                        ]
                                                    }
                                                ],
                                                "Country": [
                                                    {
                                                        "IdentificationCode": [
                                                            {
                                                                "_": column28,
                                                                "listID": "ISO 3166-1",
                                                                "listAgencyName": "United Nations Economic Commission for Europe",
                                                                "listName": "Country"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                "Contact": [
                                    {
                                        "ElectronicMail": [
                                            {
                                                "_": "correo@efact.pe"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
            trace = 'createRequest 12';
            //IMorales 20231012
            if (codTipoDocumento == FACTURA || codTipoDocumento == BOLETA) {
                // logError(documentid, 'Tipo: ' + codTipoDocumento + ' - discount: ' + Math.abs(discounttotal));
                // if (Math.abs(discounttotal) > 0) {
                if (detail.otherCharge.exist == 'Y' && tipoOperacionValidacion === "Exportación de Bienes") {
                    var peCargo = search.lookupFields({
                        type: search.Type.ITEM,
                        id: detail.otherCharge.itemId,
                        columns: ['custitem_pe_cargo_descuento_otro']
                    });

                    var codigo = search.lookupFields({
                        type: "customrecord_pe_cargo_desc_otro",
                        id: peCargo.custitem_pe_cargo_descuento_otro[0].value,
                        columns: ['custrecord_pe_cargo_codigo_sunat']
                    });
                    asignature.AllowanceCharge = [
                        {
                            "ChargeIndicator": [
                                {
                                    "_": "true"
                                }
                            ],
                            "AllowanceChargeReasonCode": [
                                {
                                    // "_": "02",
                                    "_": codigo.custrecord_pe_cargo_codigo_sunat,
                                    "listAgencyName": "PE:SUNAT",
                                    "listName": "Cargo/descuento",
                                    "listSchemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo53"
                                }
                            ],
                            "Amount": [
                                {
                                    "_": detail.otherCharge.importeBruto, // discounttotal,
                                    "currencyID": column05
                                }
                            ]
                        }
                    ]
                }
            }
            trace = 'createRequest 13';
            // if (column43 == true || isDonation == true) { //<I> rhuaccha: 2024-08-12
            if (codTipoDocumento == FACTURA) { // agregado de forma temporal
                asignature.PaymentTerms = [
                    {
                        "ID": [
                            {
                                "_": "FormaPago"
                            }
                        ],
                        "PaymentMeansID": [
                            {
                                "_": custbody_pe_ei_forma_pago
                            }
                        ]
                    }
                ]
                //<I> rhuaccha: 2024-09-19
                if (custbody_pe_ei_forma_pago.toUpperCase() === 'CREDITO') {
                    var paymentTermAmount = 0;
                    if (detail.applywh == true) {
                        paymentTermAmount = Number(totalVentaAplly);
                    } else if (anticipo) {
                        paymentTermAmount = (Number(detail.importetotal) - Number(anticipototal));
                    } else {
                        paymentTermAmount = (column43 || isDonation) ? 0 : Number(detail.importetotal);
                    }
                    asignature.PaymentTerms[0].Amount = [
                        {
                            "_": parseFloat(paymentTermAmount).toFixed(2),
                            "currencyID": column05
                        }
                    ];
                    asignature.PaymentTerms.push({
                        "ID": [
                            {
                                "_": "FormaPago"
                            }
                        ],
                        "PaymentMeansID": [
                            {
                                "_": "Cuota001"
                            }
                        ],
                        "Amount": [
                            {
                                "_": parseFloat(paymentTermAmount).toFixed(2),
                                "currencyID": column05
                            }
                        ],
                        "PaymentDueDate": [
                            {
                                "_": column32 // dueDate
                            }
                        ]
                    });
                }
                //<F> rhuaccha: 2024-09-19
            }
            if (anticipo) {
                asignature.PrepaidPayment = [
                    {
                        "ID": [
                            {
                                "_": "01",
                                "SchemeName": "Anticipo",
                                "schemeAgencyName": "PE:SUNAT"
                            }
                        ],
                        "PaidAmount": [
                            {
                                "_": anticipototal,
                                "currencyID": anticipocurrency
                            }
                        ],
                        "PaidDate": [
                            {
                                "_": anticipofechaEmision
                            }
                        ]
                    }
                ]
                asignature.PaymentTerms = [
                    {
                        "ID": [
                            {
                                "_": "FormaPago"
                            }
                        ],
                        "PaymentMeansID": [
                            {
                                "_": custbody_pe_ei_forma_pago
                            }
                        ]
                    }
                ],
                    asignature.AllowanceCharge = [
                        {
                            "ChargeIndicator": [
                                {
                                    "_": "false"
                                }
                            ],
                            "AllowanceChargeReasonCode": [
                                {
                                    "_": "04",
                                    "listAgencyName": "PE:SUNAT",
                                    "listName": "Cargo/descuento",
                                    "listSchemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo53"
                                }
                            ],
                            "Amount": [
                                {
                                    "_": anticiposubtotal.toFixed(2),
                                    "currencyID": anticipocurrency
                                }
                            ]
                        }
                    ]

            }
            trace = 'createRequest 14';
            asignature.TaxTotal = [
                {
                    "TaxAmount": [
                        {
                            // "_": column43 == true ? '0.00' : (parseFloat(detail.montototalimpuestos) - parseFloat(anticipotaxtotal)).toFixed(2),
                            "_": (column43 || isDonation) ? '0.00' : (parseFloat(detail.montototalimpuestos) - parseFloat(anticipotaxtotal)).toFixed(2), //<I> rhuaccha: 2024-08-12
                            "currencyID": column05
                        }
                    ],
                    "TaxSubtotal": taxelement
                }
            ]

            trace = 'createRequest 15';
            var PaymentMeans = {
                "Signature": [
                    {
                        "ID": [
                            {
                                "_": "IDSignature"
                            }
                        ],
                        "SignatoryParty": [
                            {
                                "PartyIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": column08
                                            }
                                        ]
                                    }
                                ],
                                "PartyName": [
                                    {
                                        "Name": [
                                            {
                                                "_": column09
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "DigitalSignatureAttachment": [
                            {
                                "ExternalReference": [
                                    {
                                        "URI": [
                                            {
                                                "_": "IDSignature"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "AccountingSupplierParty": [
                    {
                        "Party": [
                            {
                                "PartyIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": column08,
                                                "schemeID": column07,
                                                "schemeName": "Documento de Identidad",
                                                "schemeAgencyName": "PE:SUNAT",
                                                "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06"
                                            }
                                        ]
                                    }
                                ],
                                "PartyName": [
                                    {
                                        "Name": [
                                            {
                                                "_": column10
                                            }
                                        ]
                                    }
                                ],
                                "PartyLegalEntity": [
                                    {
                                        "RegistrationName": [
                                            {
                                                "_": column10
                                            }
                                        ],
                                        "RegistrationAddress": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": zip,
                                                        "schemeAgencyName": "PE:INEI",
                                                        "schemeName": "Ubigeos"
                                                    }
                                                ],
                                                "AddressTypeCode": [
                                                    {
                                                        "_": "0000",
                                                        "listAgencyName": "PE:SUNAT",
                                                        "listName": "Establecimientos anexos"
                                                    }
                                                ],
                                                "CityName": [
                                                    {
                                                        "_": departamento
                                                    }
                                                ],
                                                "CountrySubentity": [
                                                    {
                                                        "_": column14
                                                    }
                                                ],
                                                "District": [
                                                    {
                                                        "_": addr2
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": column13
                                                            }
                                                        ]
                                                    }
                                                ],
                                                "Country": [
                                                    {
                                                        "IdentificationCode": [
                                                            {
                                                                "_": contry,
                                                                "listID": "ISO 3166-1",
                                                                "listAgencyName": "United Nations Economic Commission for Europe",
                                                                "listName": "Country"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "AccountingCustomerParty": [
                    {
                        "Party": [
                            {
                                "PartyIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": nmro_documento,
                                                "schemeID": column20,
                                                "schemeName": "Documento de Identidad",
                                                "schemeAgencyName": "PE:SUNAT",
                                                "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06"
                                            }
                                        ]
                                    }
                                ],
                                "PartyName": [
                                    {
                                        "Name": [
                                            {
                                                "_": razon_social
                                            }
                                        ]
                                    }
                                ],
                                "PartyLegalEntity": [
                                    {
                                        "RegistrationName": [
                                            {
                                                "_": razon_social
                                            }
                                        ],
                                        "RegistrationAddress": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": zipCustomer,
                                                        "schemeAgencyName": "PE:INEI",
                                                        "schemeName": "Ubigeos"
                                                    }
                                                ],
                                                "CityName": [
                                                    {
                                                        "_": city
                                                    }
                                                ],
                                                "CountrySubentity": [
                                                    {
                                                        "_": departamentosub
                                                    }
                                                ],
                                                "District": [
                                                    {
                                                        "_": distrito
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": direccion_cliente
                                                            }
                                                        ]
                                                    }
                                                ],
                                                "Country": [
                                                    {
                                                        "IdentificationCode": [
                                                            {
                                                                "_": column28,
                                                                "listID": "ISO 3166-1",
                                                                "listAgencyName": "United Nations Economic Commission for Europe",
                                                                "listName": "Country"
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                "Contact": [
                                    {
                                        "ElectronicMail": [
                                            {
                                                "_": "correo@efact.pe"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "PaymentMeans": [
                    {
                        "ID": [
                            {
                                "_": "Detraccion"
                            }
                        ],
                        "PaymentMeansCode": [
                            {
                                "_": '001',
                                "listAgencyName": "PE:SUNAT",
                                "listName": "Medio de pago",
                                "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo59"
                            }
                        ],
                        "PayeeFinancialAccount": [
                            {
                                "ID": [
                                    {
                                        "_": accountDet //<I> rhuaccha: 2024-10-11 - "122191"
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "PaymentTerms": [
                    {
                        "ID": [
                            {
                                "_": "Detraccion"
                            }
                        ],
                        "PaymentMeansID": [
                            {
                                "_": codeDetraccion,
                                "schemeName": "Codigo de detraccion",
                                "schemeAgencyName": "PE:SUNAT",
                                "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo54"
                            }
                        ],
                        "Note": [
                            {
                                "_": valorneto
                            }
                        ],
                        "PaymentPercent": [
                            {
                                "_": porcentajeDetr
                            }
                        ],
                        "Amount": [
                            {
                                "_": (montoDetr * tipoCambio).toFixed(2).toString(),
                                "currencyID": "PEN"
                            }
                        ]
                    }
                ],
                "TaxTotal": [
                    {
                        "TaxAmount": [
                            {
                                // "_": column43 == true ? '0.00' : detail.montototalimpuestos.toString(),
                                "_": (column43 || isDonation) ? '0.00' : detail.montototalimpuestos.toString(), //<I> rhuaccha: 2024-08-12
                                "currencyID": column05
                            }
                        ],
                        "TaxSubtotal": [
                            {
                                "TaxableAmount": [
                                    {
                                        "_": totalVentas,
                                        "currencyID": column05
                                    }
                                ],
                                "TaxAmount": [
                                    {
                                        //"_": totalImpuertos.toString(),
                                        "_": detail.montototalimpuestos.toString(),
                                        "currencyID": column05
                                    }
                                ],
                                "TaxCategory": [
                                    {
                                        "TaxScheme": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": TaxScheme,
                                                        "schemeName": "Codigo de tributos",
                                                        "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                                        "schemeAgencyName": "PE:SUNAT"
                                                    }
                                                ],
                                                "Name": [
                                                    {
                                                        "_": taxcheme
                                                    }
                                                ],
                                                "TaxTypeCode": [
                                                    {
                                                        "_": TaxTypeCode
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
            var DocumentCurrencyCode = {
                "DocumentCurrencyCode": [
                    {
                        "_": column05,
                        "listID": "ISO 4217 Alpha",
                        "listName": "Currency",
                        "listAgencyName": "United Nations Economic Commission for Europe"
                    }
                ],
                "LineCountNumeric": [
                    {
                        "_": detail.det.length
                    }
                ],
                "OrderReference": [
                    {
                        "ID": [
                            {
                                "_": otherrefnum
                            }
                        ]
                    }
                ],
            }
            var monnetJson;
            trace = 'createRequest 16';
            if (codTipoDocumento == FACTURA || codTipoDocumento == BOLETA) {
                primeraParte = fusionarObjetos(primeraParte, duedate);
                primeraParte = fusionarObjetos(primeraParte, InvoiceTypeCode);
                primeraParte = fusionarObjetos(primeraParte, note);
                primeraParte = fusionarObjetos(primeraParte, DocumentCurrencyCode);

                if (tranType == 'invoice' && intercotransaction && intercotransaction > 0) {
                    var invoiceRecord = record.load({
                        type: 'salesorder',
                        id: intercotransaction // Reemplaza documentid con el ID de la factura que deseas consultar
                    });
                    var linecount = invoiceRecord.getLineCount({ sublistId: 'links' });

                    for (var i = 0; i < linecount; i++) {
                        var translatedValue = invoiceRecord.getSublistValue({ sublistId: 'links', fieldId: 'type', line: i });

                        if (translatedValue == "Item Fulfillment" || translatedValue == "Ejecución de orden de artículo") {
                            var itemsfullRecord = record.load({
                                type: 'itemfulfillment',
                                id: invoiceRecord.getSublistValue({ sublistId: 'links', fieldId: 'id', line: i })
                            });
                            note.Note.push(
                                {
                                    "_": invoiceRecord.getValue('tranid'),
                                    "languageID": "D"
                                }

                            )
                            var DespatchDocumentReference = {
                                "DespatchDocumentReference": [
                                    {
                                        "ID": [
                                            {
                                                "_": itemsfullRecord.getText('custbody_pe_serie') + "-" + itemsfullRecord.getValue('custbody_pe_number')
                                            }
                                        ],
                                        "DocumentTypeCode": [
                                            {
                                                "_": "09",
                                                "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01",
                                                "listAgencyName": "PE:SUNAT",
                                                "listName": "Tipo de Documento"
                                            }
                                        ]
                                    }],
                            }
                            primeraParte = fusionarObjetos(primeraParte, DespatchDocumentReference);

                        }
                    }
                }
                if (anticipo) {

                    var AdditionalDocumentReference = {
                        "AdditionalDocumentReference": [
                            {
                                "ID": [
                                    {
                                        "_": anticiposerie,
                                    }
                                ],
                                "DocumentTypeCode": [
                                    {
                                        "_": "02",
                                        "listName": "Documento Relacionado",
                                        "listAgencyName": "PE:SUNAT",
                                        "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo12"
                                    }
                                ],
                                "DocumentStatusCode": [
                                    {
                                        "_": "01",
                                        "listName": "Anticipo",
                                        "listAgencyName": "PE:SUNAT"
                                    }
                                ],
                                "IssuerParty": [
                                    {
                                        "PartyIdentification": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": anticipodoc,
                                                        "schemeID": anticipotype,
                                                        "SchemeName": "Documento de Identidad",
                                                        "schemeAgencyName": "PE:SUNAT",
                                                        "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                    }
                    primeraParte = fusionarObjetos(primeraParte, AdditionalDocumentReference);

                }
                if (detail.applywh == true) {
                    primeraParte = fusionarObjetos(primeraParte, PaymentMeans);

                    var ultimaParte = {
                        "LegalMonetaryTotal": [
                            {
                                "LineExtensionAmount": [
                                    {
                                        "_": (column43 || isDonation) ? '0.00' : totalVentas,
                                        "currencyID": column05
                                    }
                                ],
                                "TaxInclusiveAmount": [
                                    {
                                        "_": totalVentaAplly.toFixed(2),
                                        "currencyID": column05
                                    }
                                ],
                                "PayableAmount": [
                                    {
                                        "_": totalVentaAplly.toFixed(2),
                                        "currencyID": column05
                                    }
                                ]
                            }
                        ],
                        "InvoiceLine": detalleItems
                    }
                    primeraParte = fusionarObjetos(primeraParte, ultimaParte);
                } else {
                    primeraParte = fusionarObjetos(primeraParte, asignature);
                    if (anticipo) {
                        var ultimaParte = {
                            "LegalMonetaryTotal": [
                                {
                                    "LineExtensionAmount": [
                                        {
                                            // "_": column43 == true ? '0.00' : totalVentas,
                                            "_": (discounttotal > 0) ? estgrossprofit : ((column43 || isDonation) ? '0.00' : totalVentas).toFixed(2),//IMorales 20231012
                                            "currencyID": column05
                                        }
                                    ],
                                    "TaxInclusiveAmount": [
                                        {
                                            "_": (column43 || isDonation) ? '0.00' : detail.importetotal.toString(),
                                            "currencyID": column05
                                        }
                                    ],
                                    "PrepaidAmount": [
                                        {
                                            "_": anticipototal,
                                            "currencyID": column05
                                        }
                                    ],
                                    "PayableAmount": [
                                        {
                                            "_": (parseFloat(detail.importetotal) - parseFloat(anticipototal)).toFixed(2),
                                            "currencyID": column05
                                        }
                                    ]
                                }
                            ],
                            "InvoiceLine": detalleItems
                        }
                    } else { // mod
                        if (detail.otherCharge.exist == 'Y' && tipoOperacionValidacion === "Exportación de Bienes") {
                            var ultimaParte = {
                                "LegalMonetaryTotal": [
                                    {
                                        "LineExtensionAmount": [
                                            {
                                                // "_": column43 == true ? '0.00' : totalVentas,
                                                "_": (discounttotal > 0) ? estgrossprofit : ((column43 || isDonation) ? '0.00' : totalVentas),//IMorales 20231012
                                                "currencyID": column05
                                            }
                                        ],
                                        "TaxInclusiveAmount": [
                                            {
                                                // "_": (column43 || isDonation) ? '0.00' : detail.importetotal.toString(),
                                                "_": (column43 || isDonation) ? '0.00' : parseFloat(Number(detail.importetotal) - Number(detail.otherCharge.importeBruto)).toFixed(2),
                                                "currencyID": column05
                                            }
                                        ],
                                        "ChargeTotalAmount": [
                                            {
                                                "_": detail.otherCharge.importeBruto,
                                                "currencyID": column05
                                            }
                                        ],
                                        "PayableAmount": [
                                            {
                                                "_": (column43 || isDonation) ? '0.00' : detail.importetotal.toString(),
                                                // "_": (column43 || isDonation) ? '0.00' : parseFloat(Number(detail.importetotal) + Number(detail.otherCharge.importeBruto)).toFixed(2),
                                                "currencyID": column05
                                            }
                                        ]
                                    }
                                ],
                                "InvoiceLine": detalleItems
                            }
                        } else {
                            var ultimaParte = {
                                "LegalMonetaryTotal": [
                                    {
                                        "LineExtensionAmount": [
                                            {
                                                // "_": column43 == true ? '0.00' : totalVentas,
                                                "_": (discounttotal > 0) ? estgrossprofit : ((column43 || isDonation) ? '0.00' : totalVentas),//IMorales 20231012
                                                "currencyID": column05
                                            }
                                        ],
                                        "TaxInclusiveAmount": [
                                            {
                                                "_": (column43 || isDonation) ? '0.00' : detail.importetotal.toString(),
                                                "currencyID": column05
                                            }
                                        ],
                                        "PayableAmount": [
                                            {
                                                "_": (column43 || isDonation) ? '0.00' : detail.importetotal.toString(),
                                                "currencyID": column05
                                            }
                                        ]
                                    }
                                ],
                                "InvoiceLine": detalleItems
                            }
                        }
                    }

                    primeraParte = fusionarObjetos(primeraParte, ultimaParte);
                }

                monnetJson = {
                    "_D": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
                    "_A": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
                    "_B": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
                    "_E": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
                    "Invoice": [primeraParte]
                }
            } else if (codTipoDocumento == NOTA_DEBITO) {
                //Validacion Jechevarria 21/06/2024
                var detallenotaDEbito = new Array();
                trace = 'createRequest 17';
                for (var i = 0; i < detail.det.length; i++) {
                    totalImpuertos = totalImpuertos + parseFloat(detail.det[i].totalImpuestos[0].montoImpuesto);
                    detallenotaDEbito.push({
                        "ID": [
                            {
                                "_": detail.det[i].numeroItem
                            }
                        ],
                        "Note": [
                            {
                                "_": detail.det[i].unidad
                            }
                        ],
                        "DebitedQuantity": [
                            {
                                "_": detail.det[i].cantidadItems,
                                "unitCode": detail.det[i].unidad,
                                "unitCodeListID": "UN/ECE rec 20",
                                "unitCodeListAgencyName": "United Nations Economic Commission for Europe"
                            }
                        ],
                        "LineExtensionAmount": [
                            {
                                "_": detail.det[i].valorVenta,
                                "currencyID": column05
                            }
                        ],
                        "BillingReference": [
                            {
                                "BillingReferenceLine": [

                                ]
                            }
                        ],
                        "PricingReference": [
                            {
                                "AlternativeConditionPrice": [
                                    {
                                        "PriceAmount": [
                                            {
                                                "_": detail.det[i].precioVentaUnitario,
                                                "currencyID": column05
                                            }
                                        ],
                                        "PriceTypeCode": [
                                            {
                                                "_": "01",
                                                "listName": "Tipo de Precio",
                                                "listAgencyName": "PE:SUNAT",
                                                "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "TaxTotal": [
                            {
                                "TaxAmount": [
                                    {
                                        "_": detail.det[i].totalImpuestos[0].montoImpuesto,
                                        "currencyID": column05
                                    }
                                ],
                                "TaxSubtotal": [
                                    {
                                        "TaxableAmount": [
                                            {
                                                "_": detail.det[i].totalImpuestos[0].montoBase,
                                                "currencyID": column05
                                            }
                                        ],
                                        "TaxAmount": [
                                            {
                                                "_": detail.det[i].totalImpuestos[0].montoImpuesto,
                                                "currencyID": column05
                                            }
                                        ],
                                        "TaxCategory": [
                                            {
                                                "Percent": [
                                                    {
                                                        "_": detail.det[i].totalImpuestos[0].porcentaje
                                                    }
                                                ],
                                                "TaxExemptionReasonCode": [
                                                    {
                                                        "_": detail.det[i].totalImpuestos[0].tipoAfectacion,
                                                        "listAgencyName": "PE:SUNAT",
                                                        "listName": "Afectacion del IGV",
                                                        "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07"
                                                    }
                                                ],
                                                "TaxScheme": [
                                                    {
                                                        "ID": [
                                                            {
                                                                "_": detail.det[i].totalImpuestos[0].idImpuesto,
                                                                "schemeName": "Codigo de tributos",
                                                                "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                                                "schemeAgencyName": "PE:SUNAT"
                                                            }
                                                        ],
                                                        "Name": [
                                                            {
                                                                "_": detail.det[i].taxcheme
                                                            }
                                                        ],
                                                        "TaxTypeCode": [
                                                            {
                                                                "_": detail.det[i].TaxTypeCode
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "Item": [
                            {
                                "Description": [
                                    {
                                        "_": detail.det[i].descripcionProducto
                                    }
                                ],
                                "SellersItemIdentification": [
                                    {
                                        "ID": [
                                            {
                                                "_": detail.det[i].codigoProducto
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "Price": [
                            {
                                "PriceAmount": [
                                    {
                                        "_": detail.det[i].valorUnitario,
                                        "currencyID": column05
                                    }
                                ]
                            }
                        ]
                    });

                    //INICIO jechevarria 30-05-2024

                    importeBruto = parseFloat(detail.det[i].importeBruto);
                    descuento = 0;
                    if (detail.det[i].cargoDescuento) {
                        descuento = parseFloat(detail.det[i].cargoDescuento[0].importeBruto);
                    }
                    campo_AT = importeBruto + descuento;
                    campo_AT = campo_AT.toFixed(2);
                    detallenotaDEbito[i].BillingReference[0].BillingReferenceLine.push({
                        ID: [
                            {
                                "_": campo_AT,
                                "schemeID": "AT"
                            }
                        ]
                    });
                    //<I> rhuaccha: 2024-09-20
                    detallenotaDEbito[i].BillingReference[0].BillingReferenceLine.push({
                        ID: [
                            {
                                "_": detail.det[i].unitDisplay,
                                "schemeID": "AU"
                            }
                        ]
                    });
                    detallenotaDEbito[i].BillingReference[0].BillingReferenceLine.push(
                        {
                            ID: [
                                {
                                    "_": parseFloat(detail.det[i].tarifa).toFixed(2),
                                    "schemeID": "AV"
                                }
                            ]
                        }
                    );
                    //<F> rhuaccha: 2024-09-20
                    /* BillingReferenceLine.push({
                        ID: [
                            {
                                "_": campo_AT,
                                "schemeID": "AT"
                            }
                        ]
                    }); */
                    /*   if (detail.det[i].valorVenta) {
                          BillingReferenceLine.push({
                              ID: [
                                  {
                                      _: detail.det[i].valorVenta,
                                      schemeID: "AP"
                                  }
                              ]
                          })
  
                      } */
                    /* if (detail.det[i].cargoDescuento) {
                        var factor = detail.det[i].cargoDescuento[0].factorCargoDescuento * 100;
                        //lo convertimos a un texto del formato ##.##
                        factor = factor.toFixed(2) + '';
                        BillingReferenceLine.push({
                            ID: [
                                {
                                    _: factor,
                                    schemeID: "AO"
                                }
                            ]
                        })
                    } */



                    //FIN jechevarria 30-05-2024

                }


                primeraParte = fusionarObjetos(primeraParte, note);
                primeraParte = fusionarObjetos(primeraParte, discrep);
                primeraParte = fusionarObjetos(primeraParte, asignature);
                var RequestedMonetaryTotal = {
                    "RequestedMonetaryTotal": [
                        {
                            "LineExtensionAmount": [
                                {
                                    "_": totalVentas,
                                    "currencyID": column05
                                }
                            ],
                            "PayableAmount": [
                                {
                                    "_": detail.importetotal.toString(),
                                    "currencyID": column05
                                }
                            ]
                        }
                    ],
                    "DebitNoteLine": detallenotaDEbito
                }

                primeraParte = fusionarObjetos(primeraParte, RequestedMonetaryTotal);
                monnetJson = {
                    "_D": "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2",
                    "_A": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
                    "_B": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
                    "_E": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
                    "DebitNote": [primeraParte]
                }
            }

            trace = 'createRequest 18';
            //Cambio inicio Jechevarria 19/06/2024
            if (codTipoDocumento == FACTURA || codTipoDocumento == BOLETA) {
                if (column43 == true || isDonation == true) { //<I> rhuaccha: 2024-08-21: The "OR" condition was added
                    monnetJson.Invoice[0].TaxTotal[0].TaxSubtotal[0].TaxAmount[0]._ = totalImpuertos.toString();
                    monnetJson.Invoice[0].LegalMonetaryTotal[0].LineExtensionAmount[0]._ = "0.00";
                    //Eliminamos los campos UBLExtensions y AllowanceCharge
                    delete monnetJson.Invoice[0].UBLExtensions;
                    delete monnetJson.Invoice[0].AllowanceCharge;

                }
            }



            // column05 = 'PEN' //TODO: Arreglar ===============


            trace = 'createRequest 19';
            var filename = column08 + '-' + codTipoDocumento + '-' + numeracion;
            var ticket = codTipoDocumento + '-' + numeracion




            monnetJson = JSON.stringify(monnetJson);
            trace = 'createRequest 20';
            var filejson = generateFileJSON(filename, monnetJson);
            var filejson = file.load({ id: filejson });
            trace = 'createRequest 21';
            setRecord(codTipoDocumento, documentid, ticket, filejson.id, tranType)
            trace = 'createRequest 22';
            return 'Transacción ' + ticket + ' generada ' + ' - ' + true;
            /* } catch (error) {
                 log.debug(documentid, error.message);
             }*/
        }
        //!INVOICE/CASHSALE ============================================================================================================================

        function TaxableAmount(totalVentas, column05, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal) {
            var primeraParte = {
                "TaxableAmount": [
                    {
                        // "_": totalVentas,
                        "_": apliccaanticipo != 0 ? totalVentas : (parseFloat(totalVentas) - parseFloat(anticiposubtotal)).toFixed(2),//IMorales 20231012
                        "currencyID": column05
                    }
                ],
                "TaxAmount": [
                    {
                        // "_": totalImpuertos.toString(),
                        "_": apliccaanticipo != 0 ? TaxAmount : (parseFloat(TaxAmount) - parseFloat(anticipotaxtotal)).toFixed(2),
                        "currencyID": column05
                    }
                ],
                "TaxCategory": [
                    {
                        "TaxScheme": [
                            {
                                "ID": [
                                    {
                                        "_": TaxScheme,
                                        "schemeName": "Codigo de tributos",
                                        "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                        "schemeAgencyName": "PE:SUNAT"
                                    }
                                ],
                                "Name": [
                                    {
                                        "_": taxcheme
                                    }
                                ],
                                "TaxTypeCode": [
                                    {
                                        "_": TaxTypeCode
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
            if (TaxScheme == "9996") primeraParte.TaxAmount[0]._ = "0.0"

            return primeraParte;
        }

        function generateCabecera(numeracion, fechaEmision) {
            var primeraParte = {
                "UBLVersionID": [
                    {
                        "_": "2.1"
                    }
                ],
                "CustomizationID": [
                    {
                        "_": "2.0"
                    }
                ],
                "ID": [
                    {
                        "_": numeracion
                    }
                ],
                "IssueDate": [
                    {
                        "_": fechaEmision
                    }
                ],
                "IssueTime": [
                    {
                        "_": "00:00:00"
                    }
                ],

            }
            return primeraParte;
        }



        function generateCabecera_con_descuento(numeracion, fechaEmision, monto_descuento) {
            var primeraParte = {
                "UBLExtensions": [
                    {
                        "UBLExtension": [
                            {
                                "ExtensionContent": [
                                    {
                                        "TotalDiscount": [
                                            {
                                                "_": monto_descuento
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "UBLVersionID": [
                    {
                        "_": "2.1"
                    }
                ],
                "CustomizationID": [
                    {
                        "_": "2.0"
                    }
                ],
                "ID": [
                    {
                        "_": numeracion
                    }
                ],
                "IssueDate": [
                    {
                        "_": fechaEmision
                    }
                ],
                "IssueTime": [
                    {
                        "_": "00:00:00"
                    }
                ],

            }
            return primeraParte;
        }

        function generateduedate(column32) {
            var duedate = {
                "DueDate": [
                    {
                        "_": column32
                    }
                ]
            }
            return duedate;
        }

        function generateInvoiceTypeCode(codTipoDocumento, tipodedoc) {
            var InvoiceTypeCode = {
                "InvoiceTypeCode": [
                    {
                        "_": codTipoDocumento,
                        "listName": "Tipo de Documento",
                        "listSchemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51",
                        "listID": tipodedoc,
                        "name": "Tipo de Operacion",
                        "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01",
                        "listAgencyName": "PE:SUNAT"
                    }
                ]
            }
            return InvoiceTypeCode
        }

        function padLeft(value, length, padChar) {
            value = value.toString(); // Asegurarse de que el valor sea una cadena de texto
            padChar = padChar || '0'; // Usar '0' como carácter de relleno predeterminado
            while (value.length < length) {
                value = padChar + value;
            }
            return value;
        }

        function fusionarObjetos(obj1, obj2) {
            var resultado = {};

            // Copiar las propiedades del primer objeto
            for (var clave1 in obj1) {
                if (obj1.hasOwnProperty(clave1)) {
                    resultado[clave1] = obj1[clave1];
                }
            }

            // Copiar las propiedades del segundo objeto, sobrescribiendo las existentes
            for (var clave2 in obj2) {
                if (obj2.hasOwnProperty(clave2)) {
                    resultado[clave2] = obj2[clave2];
                }
            }

            return resultado;
        }
        //<I> rhuaccha: 2024-08-12: the variable isDonation was added
        function getDetail(documentid, freeop, tranType, isDonation, tipodedoc) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExportacion = ['Vacio'];
            var jsonGrat = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonTotalImpuestoICBPER = new Array();
            var jsonTotalImpuestoEXPORT = new Array();
            var jsonTotalImpuestoGRAT = new Array();
            var jsonCargoDescuento = new Array();
            var jsonTotalDescuentos = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
            var sumtotalVentasEXPORT = 0.0;
            var sumtotalVentasGRAT = 0.0;
            var summontoImpuestoEXPORT = 0.0;
            var summontoImpuestoGRAT = 0.0;
            var montoDetracion = 0;
            var applyAnty = new Array();
            var montoDetracionValor = 0
            // Params for subtotal
            var montobasecargodescuento = '';
            //Flag discount
            var anydiscoutnigv = '';
            // var jsontest = new Array();
            const TAX_CODE_GRAVADA = 'IGV_PE:S-PE'
            const TAX_CODE_INAFECTA = 'IGV_PE:Inaf-PE'
            const TAX_CODE_EXENTA = 'IGV_PE:E-PE'
            const TAXT_CODE_UNDEF = 'IGV_PE:UNDEF-PE'
            const TAXT_CODE_EXPORT = 'IGV_PE:X-PE'
            const TAXT_CODE_GRATUITA = 'TTG_PE:TTG'
            var applyDetr = false;
            var otherCharge = {
                exist: 'N'
            };

            //try {
            var openRecord = '';
            openRecord = record.load({ type: tranType, id: documentid, isDynamic: true });

            var total = openRecord.getValue({ fieldId: 'total' });
            var taxtotal = openRecord.getValue({ fieldId: 'taxtotal' });
            var codcustomer = openRecord.getText({ fieldId: 'entity' });

            codcustomer = codcustomer.split(' ');
            codcustomer = codcustomer[0];
            var linecount = openRecord.getLineCount({ sublistId: 'item' });
            var linkscount = openRecord.getLineCount({ sublistId: 'links' });
            for (var index = 0; index < linkscount - 1; index++) {
                var totalanticipo = openRecord.getSublistValue({ sublistId: 'links', fieldId: 'total', line: index });
                var type = openRecord.getSublistValue({ sublistId: 'links', fieldId: 'type', line: index });
                var intenal = openRecord.getSublistValue({ sublistId: 'links', fieldId: 'id', line: index });
                if (type == 'Aplicación de depósito' || type == 'Deposit Application') {
                    applyAnty.push(intenal);
                    applyAnty.push(totalanticipo);
                }


            }
            //logStatus(documentid, linecount);
            // SE AGREGARON PARA LOS CASOS DE PROMOCIONES GLOBALES
            var subtotal_global_prom = openRecord.getValue({ fieldId: 'subtotal' });
            var taxcode_display_prom = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: 0 });
            var codigocargodescuento_prom = taxcode_display_prom == TAX_CODE_GRAVADA ? "02" : "03";
            var totalLineDisc = 0; //<I> rhuaccha: 2024-09-16


            //Inicio for
            for (var i = 0; i < linecount; i++) {
                var jsonTotalImpuestos = new Array();
                var jsonCargoDescuentoLines = new Array();
                var precioVentaUnitario = 0.0;
                var idimpuesto = '';
                var codigo = '';
                var taxcheme = '';
                var TaxTypeCode = 'VAT';
                var tipoAfectacion = '';
                var itemtype_discount = 'notExist';
                var anydiscountline = '';

                //Params for discount
                var indicadorcargodescuento = '';
                var codigocargocescuento = '';
                var factorcargodescuento = 0.0;
                var montocargodescuento = 0.0;
                var round = 0.0;
                var taxcode_display_discount = '';
                var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                var getCodigo = search.lookupFields({
                    type: search.Type.ITEM,
                    id: item,
                    columns: ['itemid']
                });
                var item_display = getCodigo.itemid;


                //logStatus(documentid, item_display);
                var is_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: i });
                var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                var grossamt = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i });

                var unit = getUnit(item);

                var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                var rateopfree = rate;

                var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                var taxrate1GRa = taxcode_display == TAXT_CODE_GRATUITA ? 0 : parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                var tax1amt = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                var directtax1amt = tax1amt
                var directamount = amount
                //logStatus(documentid, 'tax1amt1: ' + tax1amt);
                var montoimpuesto = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                var isicbp = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_icbp', line: i });
                var applywh = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line: i });
                if (applyDetr == false) {
                    applyDetr = applywh;
                }
                //<I> rhuaccha: 2024-09-13
                var unitsDisplay = getUnitDisplay(openRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'units',
                    line: i
                }));
                //<F> rhuaccha: 2024-09-13

                //logStatus(documentid, 'Entré a DESCUENTO: ' + taxcode_display);
                if (itemtype == 'Discount') {
                    montoDetracionValor = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                    montoDetracion = montoDetracion + (montoDetracionValor * -1);
                }
                if (itemtype == 'InvtPart' || itemtype == 'Service' || itemtype == 'NonInvtPart' || itemtype == 'Assembly' || itemtype == 'Kit') {
                    precioVentaUnitario = (rate + (rate * (taxrate1GRa / 100)));
                    //logStatus(documentid, precioVentaUnitario);
                    round = precioVentaUnitario.toString().split('.');
                    if (typeof round[1] != 'undefined') {
                        precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(2) : precioVentaUnitario;
                    }

                    if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                        if (freeop == true) {
                            idimpuesto = '9996'; // Gratuito
                            codigo = '1004'; // Total valor de venta – Operaciones gratuitas
                            tipoAfectacion = '15'; // Gravado – Retiro por premio
                            sumtotalVentasGRA += amount;
                            summontoImpuestoGRA += montoimpuesto;
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA
                            }
                            taxcheme = 'GRA';
                            TaxTypeCode = 'FRE';


                        } else {
                            idimpuesto = '1000'; // Igv impuesto general a las ventas
                            codigo = '1001'; // Total valor de venta - operaciones gravadas
                            tipoAfectacion = '10'; // Gravado - Operación Onerosa
                            sumtotalVentasGRA += amount;
                            summontoImpuestoGRA += montoimpuesto;
                            taxcheme = 'IGV';

                        }

                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA

                            }
                            jsonTotalImpuestosGRA = [{
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoGRA.toFixed(2),
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }];
                        }
                        // jsonGravadas = {
                        //     codigo: codigo,
                        //     totalVentas: sumtotalVentasGRA
                        // }
                        // jsonTotalImpuestosGRA.push({
                        //     idImpuesto: idimpuesto,
                        //     montoImpuesto: summontoImpuestoGRA.toFixed(2)
                        // });

                    } else if (taxcode_display == TAX_CODE_EXENTA) { // EXONERADAS
                        if (freeop == true) {
                            idimpuesto = '9996'; // Gratuito
                            codigo = '1004'; // Total valor de venta - operaciones exoneradas
                            tipoAfectacion = '21'; // Exonerado – Transferencia Gratuita
                            sumtotalVentasEXO += amount;
                            summontoImpuestoEXO += montoimpuesto;
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2)
                            }
                            taxcheme = 'GRA';
                            TaxTypeCode = 'FRE';

                        } else {
                            idimpuesto = '9997'; //Exonerado
                            codigo = '1003'; // Total valor de venta - operaciones exoneradas
                            tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                            sumtotalVentasEXO += amount;
                            summontoImpuestoEXO += montoimpuesto;
                            taxcheme = 'EXO';
                        }

                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                            //log.debug('AnyDiscount', itemtype_discount);
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2)

                            }
                        }

                        jsonTotalImpuestosEXO = [{
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoEXO.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        }];
                    } else if (taxcode_display == TAX_CODE_INAFECTA) { // INAFECTAS
                        if (freeop == true || isDonation == true) {//<I> rhuaccha: 2024-08-12: The "or" condition was added
                            idimpuesto = '9996'; // Gratuito
                            codigo = '1004'; // Total valor de venta - operaciones inafectas
                            tipoAfectacion = isDonation ? '37' : (freeop ? '35' : ''); // '35'; // Inafecto – Retiro por premio
                            sumtotalVentasINA += amount;
                            summontoImpuestoINA += montoimpuesto;
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2)
                            }
                            taxcheme = 'GRA';
                            TaxTypeCode = 'FRE'

                        } else {
                            idimpuesto = '9998'; // Inafecto
                            codigo = '1002'; // Total valor de venta - operaciones inafectas
                            tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                            sumtotalVentasINA += amount;
                            summontoImpuestoINA += montoimpuesto;
                            taxcheme = 'INA';
                            TaxTypeCode = 'FRE';
                        }
                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2)

                            }
                        }
                        jsonTotalImpuestosINA = [{
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoINA.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        }];
                    } else if (taxcode_display == TAXT_CODE_EXPORT) { // exportacion
                        log.debug('Exportacion', 'entro a Exportacion');
                        //&Inicio - dfernandez - 08/01/2025
                        if (freeop && tipodedoc == '0200') {
                            idimpuesto = '9996'
                        } else {
                            idimpuesto = '9995'
                        }
                        //&Fin - dfernandez - 08/01/2025
                        codigo = '1004'; // Total valor de venta - operaciones inafectas
                        tipoAfectacion = '40'; // TaxExemptionReasonCode
                        sumtotalVentasEXPORT += amount;
                        summontoImpuestoEXPORT += montoimpuesto;
                        jsonExportacion = {
                            codigo: codigo,
                            totalVentas: sumtotalVentasEXPORT.toFixed(2)

                        }

                        jsonTotalImpuestoEXPORT.push({
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoEXPORT.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        });
                        //&Inicio - dfernandez - 08/01/2025
                        taxcheme = 'GRA';
                        //&Fin - dfernandez - 08/01/2025
                        TaxTypeCode = 'FRE'
                    } else if (taxcode_display == TAXT_CODE_GRATUITA) { // exportacion
                        log.debug('Exportacion', 'entro a Exportacion');

                        idimpuesto = '9996'; // Gratuito
                        codigo = '1004'; // Total valor de venta - operaciones inafectas
                        tipoAfectacion = '31'; // TaxExemptionReasonCode
                        sumtotalVentasGRAT += amount;
                        summontoImpuestoGRAT += montoimpuesto;
                        jsonGrat = {
                            codigo: codigo,
                            totalVentas: sumtotalVentasGRAT.toFixed(2)

                        }

                        jsonTotalImpuestoGRAT = [{
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoGRAT.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        }];
                        taxcheme = 'GRA';
                        TaxTypeCode = 'FRE'
                    }


                    //logStatus(documentid, precioVentaUnitario);
                    if (anydiscountline == 'any') {
                        var rate_discount_line = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i + 1 }));
                        var amount_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i + 1 });
                        var tax1amt_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i + 1 });
                        var grossamt_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i + 1 });

                        tax1amt_discount_line = parseFloat(tax1amt_discount_line.toString().replace('-', ''));
                        rate_discount_line = rate_discount_line.toString().replace('-', '').replace('%', '');
                        factorcargodescuento = rate_discount_line / 100;
                        round = factorcargodescuento.toString().split('.');
                        if (typeof round[1] != 'undefined') {
                            round[1].length > 5 ? factorcargodescuento = factorcargodescuento.toFixed(5) : factorcargodescuento
                        }
                        amount_discount_line = parseFloat(amount_discount_line.toString().replace('-', ''));
                        montocargodescuento = parseFloat(amount_discount_line) * parseFloat(factorcargodescuento);
                        var dsctoVentaUnitario = parseFloat(precioVentaUnitario) * parseFloat(factorcargodescuento);
                        precioVentaUnitario = parseFloat(precioVentaUnitario) - dsctoVentaUnitario;

                        var montobasecargodscto = amount
                        amount = amount - amount_discount_line;
                        tax1amt = tax1amt - tax1amt_discount_line;
                        //logStatus(documentid, 'tax1amt2: ' + tax1amt);

                        if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que afectan la base imponible del IGV
                            sumtotalVentasGRA -= amount_discount_line;
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA,
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }
                            summontoImpuestoGRA -= tax1amt_discount_line;
                            //<I> rhuaccha: 2024-08-20
                            /*jsonTotalImpuestosGRA.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoGRA.toFixed(2)
                            });*/
                            jsonTotalImpuestosGRA = [{
                                idImpuesto: idimpuesto,
                                montoImpuesto: parseFloat(summontoImpuestoGRA).toFixed(2)
                            }];
                            //<F> rhuaccha: 2024-08-20
                        } else if (taxcode_display == TAX_CODE_EXENTA) {
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que no afectan la base imponible del IGV
                            sumtotalVentasEXO -= amount_discount_line;
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2),
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }
                        } else if (taxcode_display == TAX_CODE_INAFECTA) {
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que no afectan la base imponible del IGV
                            sumtotalVentasINA -= amount_discount_line;
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2),
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }
                        }

                        jsonCargoDescuentoLines.push({
                            indicadorCargoDescuento: indicadorcargodescuento,
                            codigoCargoDescuento: codigocargocescuento,
                            factorCargoDescuento: factorcargodescuento.toString(),
                            montoCargoDescuento: amount_discount_line.toFixed(2),
                            montoBaseCargoDescuento: montobasecargodscto.toString(),
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt_discount_line

                        });
                    }
                    //logStatus(documentid, 'tax1amt3: ' + tax1amt);
                    if (tax1amt == 0) {
                        tax1amt = directtax1amt
                    }
                    if (amount == 0) {
                        amount = directamount
                    }
                    jsonTotalImpuestos.push({
                        idImpuesto: idimpuesto,
                        montoImpuesto: tax1amt.toFixed(2),
                        tipoAfectacion: tipoAfectacion,
                        montoBase: amount.toFixed(2).toString(),
                        porcentaje: taxrate1.toString()
                    });

                    //logStatus(documentid, JSON.stringify(isicbp));
                    /* if (itemtype == 'NonInvtPart' || (isicbp == true && isicbp !== undefined)) {
                        log.debug(documentid, 'Entré a ICBP: ' + isicbp);
                        var montoImp = 0.5 * parseInt(quantity);
                        tax1amt = (tax1amt + montoImp).toFixed(2);
                        taxtotal = parseFloat(taxtotal) + montoImp;
                        //total = parseFloat(total) + montoImp;
 
                        jsonTotalImpuestoICBPER.push({
                            idImpuesto: '7152',
                            montoImpuesto: montoImp.toFixed(2)
                        });
 
                        jsonTotalImpuestos.push({
                            idImpuesto: '7152',
                            montoImpuesto: montoImp.toFixed(2),
                            tipoAfectacion: tipoAfectacion,
                            montoBase: quantity.toString(),
                            porcentaje: '0.50'
                        });
                    }*/

                    if (unit == "") {
                        unit = "NIU"//IMorales 20230814
                    }
                    if (freeop == true || isDonation == true) { //<I> rhuaccha: 2024-08-12: The "or" condition was added
                        log.debug('MSK', 'description 1: ' + description)
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            //cantidadItems: '1',
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            tipoprecio: '02',
                            valorUnitario: rate.toString(),
                            precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            valorRefOpOnerosas: rateopfree.toFixed(2).toString(),
                            montoTotalImpuestos: '0.00',
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode,
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt,
                            taxCodeDisplay: taxcode_display, //<I> rhuaccha: 2024-08-20
                            unitDisplay: nvl(unitsDisplay, openRecord.getSublistValue({ sublistId: 'item', fieldId: 'units_display', line: i })), //<I> rhuaccha: 2024-09-13
                            tarifa: parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })),
                            amount: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }), //<I> rhuaccha: 2024-09-16
                            cuponCode: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_codigo_cupon', line: i }) //<I> rhuaccha: 2024-09-19
                        });
                    } else if (anydiscountline == 'any') {
                        log.debug('MSK', 'description 2: ' + description)
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            tipoprecio: '01',
                            valorUnitario: rate.toString(),
                            precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                            cargoDescuento: jsonCargoDescuentoLines,
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            montoTotalImpuestos: parseFloat(tax1amt).toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode,
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt,
                            taxCodeDisplay: taxcode_display, //<I> rhuaccha: 2024-08-20
                            unitDisplay: nvl(unitsDisplay, openRecord.getSublistValue({ sublistId: 'item', fieldId: 'units_display', line: i })), //<I> rhuaccha: 2024-09-13
                            tarifa: parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })),
                            amount: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }), //<I> rhuaccha: 2024-09-16
                            cuponCode: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_codigo_cupon', line: i }) //<I> rhuaccha: 2024-09-19
                        });
                    } else {
                        //logStatus(documentid, 'Json: ' + precioVentaUnitario);
                        log.debug('MSK', 'description 3: ' + description)
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            tipoprecio: taxcode_display == TAXT_CODE_GRATUITA ? '02' : '01',
                            valorUnitario: taxcode_display == TAXT_CODE_GRATUITA ? '0.00' : rate.toString(),
                            precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            montoTotalImpuestos: tax1amt.toString(),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode,
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt,
                            taxCodeDisplay: taxcode_display, //<I> rhuaccha: 2024-08-20
                            unitDisplay: nvl(unitsDisplay, openRecord.getSublistValue({ sublistId: 'item', fieldId: 'units_display', line: i })), //<I> rhuaccha: 2024-09-13
                            tarifa: parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })),
                            amount: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }), //<I> rhuaccha: 2024-09-16
                            cuponCode: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_codigo_cupon', line: i }) //<I> rhuaccha: 2024-09-19
                        });
                    }
                } else if (itemtype == 'Subtotal') {
                    montobasecargodescuento = amount; //subtotal
                } else if (itemtype == 'Discount' && is_discount_line == false && taxcode_display != TAXT_CODE_UNDEF) {
                    if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                        indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                        codigocargocescuento = '02'; // Descuentos globales que afectan la base imponible del IGV
                        anydiscoutnigv = 'any';
                    } else {
                        indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                        codigocargocescuento = '03'; // Descuentos globales que no afectan la base imponible del IGV
                    }
                    rate = rate.toString().replace('-', '').replace('%', '');
                    factorcargodescuento = rate / 100
                    round = factorcargodescuento.toString().split('.');
                    if (typeof round[1] != 'undefined') {
                        round[1].length > 5 ? factorcargodescuento = factorcargodescuento.toFixed(5) : factorcargodescuento
                    }
                    amount = amount.toString().replace('-', '')
                    jsonTotalDescuentos.push({
                        codigo: "2005",
                        totalDescuentos: amount
                    });

                    jsonCargoDescuento.push({
                        indicadorCargoDescuento: indicadorcargodescuento,
                        codigoCargoDescuento: codigocargocescuento,
                        factorCargoDescuento: factorcargodescuento.toString(),
                        montoCargoDescuento: amount,
                        montoBaseCargoDescuento: montobasecargodescuento.toString()
                    });
                } else if (itemtype == 'OthCharge') {
                    otherCharge.exist = 'Y';
                    otherCharge.type = itemtype;
                    otherCharge.itemId = item;
                    otherCharge.importeBruto = grossamt;
                }
                if (itemtype === 'Discount') {
                    totalLineDisc += Math.abs(Number(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }))); //<I> rhuaccha: 2024-09-16
                }

            }

            if (anydiscoutnigv == 'any') {
                //!IMorales 20231110 - Comentado, dado que el descuento al totalVentas ya se hace más arriba
                // var newcalculate = jsonGravadas.totalVentas - amount;
                // jsonGravadas.totalVentas = newcalculate.toFixed(2);
            } else {
                if (jsonGravadas != 'Vacio') {
                    jsonGravadas = {
                        codigo: jsonGravadas.codigo,
                        totalVentas: jsonGravadas.totalVentas.toFixed(2)
                    }
                }
            }

            // if (jsonGravadas != 'Vacio') {
            //     jsonGravadas = {
            //         codigo: jsonGravadas.codigo,
            //         totalVentas: jsonGravadas.totalVentas.toFixed(2)
            //     }
            // }

            jsonReturn = {
                det: json,
                gravadas: jsonGravadas,
                inafectas: jsonInafectas,
                exoneradas: jsonExoneradas,
                exportacion: jsonExportacion,
                gratuita: jsonGrat,
                totalimpuestosgra: jsonTotalImpuestosGRA,
                totalimpuestosina: jsonTotalImpuestosINA,
                totalimpuestosexo: jsonTotalImpuestosEXO,
                totalimpuestoicbper: jsonTotalImpuestoICBPER,
                totalimpuestoiExport: jsonTotalImpuestoEXPORT,
                totalimpuestoigratuita: jsonTotalImpuestoGRAT,
                importetotal: total.toFixed(2),
                montototalimpuestos: taxtotal.toFixed(2),
                codigocliente: codcustomer,
                anydiscoutnigv: anydiscoutnigv,
                applywh: applyDetr,
                applyanty: applyAnty,
                montoDetracion: montoDetracion.toFixed(2).toString(),
                otherCharge: otherCharge,
                totalLineDisc: totalLineDisc //<I> rhuaccha: 2024-09-16
            }

            //! ACTIVAR PARA DESCUENTOS
            if (jsonCargoDescuento.length != 0) {
                if (codigocargocescuento == '03') {
                    jsonReturn.totaldescuentos = jsonTotalDescuentos;
                }
                jsonReturn.cargodescuento = jsonCargoDescuento;

                // }
                // else if (jsonCargoDescuento.length == 0 && _objPromocion != null && _objPromocion['p_dsctoglobal']) {
                //     var amount_prom = (_objPromocion.monto_dscto).replace('-', '');
                //     var jsonTotalDescuentosProm = new Array();
                //     var jsonCargoDescuentoProm = new Array();
                //     if (codigocargodescuento_prom == '03') {
                //         jsonTotalDescuentosProm.push({ codigo: "2005", totalDescuentos: amount_prom })
                //         jsonReturn.totaldescuentos = jsonTotalDescuentosProm;
                //     }

                //     jsonCargoDescuentoProm.push({
                //         indicadorCargoDescuento: 'false',
                //         codigoCargoDescuento: codigocargodescuento_prom,
                //         factorCargoDescuento: _objPromocion.p_descuento,
                //         montoCargoDescuento: amount_prom,
                //         montoBaseCargoDescuento: subtotal_global_prom.toString()
                //     });
                //     jsonReturn.cargodescuento = jsonCargoDescuentoProm
            }

            return jsonReturn;
            /* } catch (error) {
                 log.debug('Error-getDetail', JSON.stringify(error));
                 return error;
             }*/
        }

        function generateFileJSON(namefile, content) {
            var folder;

            var resultSet = search.create({
                type: 'folder',
                columns: ['internalid'],
                filters: [
                    ['name', 'is', 'Docs']
                ]
            });
            var objResult = resultSet.run().getRange(0, 50);

            if (objResult == '' || objResult == null) {
                var resultSetfolder = search.create({
                    type: 'folder',
                    columns: ['internalid'],
                    filters: [
                        ['name', 'is', 'TS NET Scripts']
                    ]
                });
                var objResultfolder = resultSetfolder.run().getRange(0, 50);
                var varRecordFolder = record.create({
                    type: 'folder'
                });
                varRecordFolder.setValue('name', 'Docs');
                varRecordFolder.setValue('parent', objResultfolder[0].getValue('internalid'));
                folder = varRecordFolder.save();
            } else {
                folder = objResult[0].getValue('internalid')
            }



            log.debug('folder', folder);
            var fileObj = file.create({
                name: namefile + '.json',
                fileType: file.Type.JSON,
                contents: content,
                folder: folder,
                isOnline: true
            });
            var fileid = fileObj.save();



            return fileid;

        }

        //!NOTA DE CREDITO ============================================================================================================================
        function createRequestCreditMemo(documentid) {
            var json = new Array();
            var jsonMain = new Array();
            var jsonIDE = new Array();
            var jsonEMI = new Array();
            var jsonREC = new Array();
            var jsonDRF = new Array();
            var jsonCAB = new Array();
            var arrayCAB = new Array();
            var arrayImporteTotal = new Array();
            var jsonLeyenda = new Array();
            var jsonADI = new Array();
            var jsonADI2 = new Array();
            var sumaImporteTotal = 0.0;
            var taxelement = new Array();

            var searchLoad = search.create({
                type: "creditmemo",
                filters:
                    [
                        ["type", "anyof", "CustCred"],
                        "AND",
                        ["internalid", "anyof", documentid]
                    ],
                columns:
                    [
                        //?FORMULAS ===========================================================================================================================================
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),
                        search.createColumn({ name: "formulatext", formula: "'07'", label: "codTipoDocumento" }),
                        // EMI---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulanumeric", formula: "6", label: "tipoDocId" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }), search.createColumn({ name: "formulatext", formula: "'0000'", label: "codigoAsigSUNAT" }),
                        // REC---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {customer.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "tipoDocIdREC" }),
                        search.createColumn({ name: "formulatext", formula: "CONCAT({customer.firstname}, CONCAT('-', {customer.lastname}))", label: "rucREC" }),
                        // DRF---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {custbody_pe_document_type_ref} = 'Factura' THEN '01' WHEN {custbody_pe_document_type_ref} = 'Boleta de Venta' THEN '03' END", label: "tipoDocRelacionado" }),
                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_document_series_ref}, CONCAT('-', {custbody_pe_document_number_ref}))", label: "numeroDocRelacionado" }),
                        // COM---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulanumeric", formula: "TO_NUMBER({custbody_pe_number})", label: "correlativo" }),
                        search.createColumn({ name: "createdfrom", join: "createdFrom", label: "fulfillment" }),
                        // ADI---------------------------------------------------------------------------------------------------------------------
                        // search.createColumn({ name: "createdfrom", join: "createdFrom", label: "ordenCompraADI" }),
                        // search.createColumn({ name: "formulatext", formula: "CONCAT({createdFrom.custbody_pe_driver_name}, CONCAT(' ', {createdFrom.custbody_pe_driver_last_name}))", label: "transportistaADI" }),
                        // search.createColumn({ name: "formulatext", formula: "CONCAT({salesRep.firstname}, CONCAT(' ', {salesRep.lastname}))", label: "vendedorADI" }),
                        //?====================================================================================================================================================
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "trandate", label: "fechaEmision" }),
                        search.createColumn({ name: "custbody_pe_free_operation", label: "gratuita" }),
                        search.createColumn({ name: "symbol", join: "Currency", label: "tipoMoneda" }),
                        search.createColumn({ name: "otherrefnum", label: "numeroOrdenCompra" }),
                        search.createColumn({ name: "duedate", join: "createdFrom", label: "fechaVencimiento" }),
                        // EMI---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "numeroDocId" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "razonSocial" }),
                        search.createColumn({ name: "address1", join: "subsidiary", label: "direccion1" }),
                        search.createColumn({ name: "address2", join: "location", label: "direccion2" }),
                        search.createColumn({ name: "city", join: "subsidiary", label: "departamento" }),
                        search.createColumn({ name: "state", join: "subsidiary", label: "provincia" }),
                        search.createColumn({ name: "address2", join: "subsidiary", label: "distrito" }),
                        search.createColumn({ name: "billcountrycode", label: "codigoPais" }),
                        search.createColumn({ name: "phone", join: "subsidiary", label: "telefono" }),
                        search.createColumn({ name: "email", join: "subsidiary", label: "correoElectronico" }),
                        // REC---------------------------------------------------------------------------------------------------------------------

                        search.createColumn({ name: "vatregnumber", join: "customer", label: "numeroDocIdREC" }),
                        search.createColumn({ name: "companyname", join: "customer", label: "razonSocialREC" }),
                        search.createColumn({ name: "billaddress1", label: "direccionREC1" }),
                        search.createColumn({ name: "billaddress2", label: "direccionREC2" }),
                        search.createColumn({ name: "city", join: "customer", label: "departamentoREC" }),
                        search.createColumn({ name: "state", join: "customer", label: "provinciaREC" }),
                        search.createColumn({ name: "address2", join: "customer", label: "distritoREC" }),
                        search.createColumn({ name: "email", join: "customer", label: "correoElectronicoREC" }),
                        search.createColumn({ name: "internalid", join: "customer", label: "emailrec" }),
                        // DRF---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custrecord_pe_codigo_motivo", join: "CUSTBODY_PE_REASON", label: "codigoMotivo" }),
                        search.createColumn({ name: "name", join: "CUSTBODY_PE_REASON", label: "descripcionMotivo" }),
                        // CAB---------------------------------------------------------------------------------------------------------------------
                        //search.createColumn({ name: "custrecord_ns_code_operation_type", join: "custbody_pe_operation_type", label: "tipoOperacion" }),
                        // COM---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custbody_pe_document_type", label: "typedoc" }),
                        search.createColumn({ name: "custbody_pe_serie", label: "serie" }),
                        // ADI---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custbody_pe_document_date_ref", label: "fechaVencADI" }),
                        search.createColumn({ name: "zip", join: "subsidiary", label: "zip" }),
                        search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                        search.createColumn({ name: "address1", join: "customer", label: "address1" }),
                        search.createColumn({ name: "country", join: "customer", label: "country" }),
                        search.createColumn({ name: "entity" }),

                        //Inicio jechevarrie 20/06/2024
                        //search.createColumn({ name: "custbody_pe_direccion_entrega_prede" }),
                        search.createColumn({ name: "salesrep" }),
                        search.createColumn({ name: "createdfrom", join: "createdFrom" }),
                        search.createColumn({ name: "type", join: "createdFrom" }),
                        //search.createColumn({ name: "custbody_sj_motiv_devolucion" }),
                        //search.createColumn({ name: "custbody_pe_fecha_venci_ref", label: "fechaVencRef" }), //<I> rhuaccha: 2024-08-26
                        //search.createColumn({ name: "custbody_pe_condicion_ref", label: "condicionRef" }), //<I> rhuaccha: 2024-08-26
                        //search.createColumn({ name: "custbody_pe_forma_pago_ref", label: "formaPagoRef" }), //<I> rhuaccha: 2024-08-26


                        // search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "condPagoADI" }),
                        // search.createColumn({ name: "location", label: "moduloADI" }),
                        // search.createColumn({ name: "custbody_pe_delivery_address", join: "createdFrom", label: "dirDestinoADI" }),
                        // search.createColumn({ name: "custbody_pe_car_plate", join: "createdFrom", label: "placaVehicADI" }),
                        // search.createColumn({ name: "custbody_pe_ruc_empresa_transporte", join: "createdFrom", label: "rucTransportistaADI" }),
                    ]
            });

            var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            /* setLog({
                title: 'searchResult',
                details: JSON.stringify(searchResult)
            }) */
            //?FORMULAS ======================================================================================================================================================
            // IDE---------------------------------------------------------------------------------------------------------------------
            var column28 = searchResult[0].getValue({ name: "country", join: "customer" });
            var column23 = searchResult[0].getValue({ name: "address1", join: "customer" });//Address Line
            var numeracion = searchResult[0].getValue(searchLoad.columns[0]);
            var zip = searchResult[0].getValue({ name: "zip", join: "subsidiary", label: "zip" });
            var codTipoDocumento = searchResult[0].getValue(searchLoad.columns[1]);
            // EMI---------------------------------------------------------------------------------------------------------------------
            var tipoDocId = searchResult[0].getValue(searchLoad.columns[2]);
            var nombreComercial = searchResult[0].getValue(searchLoad.columns[3]);

            // REC---------------------------------------------------------------------------------------------------------------------
            var tipoDocIdREC = searchResult[0].getValue(searchLoad.columns[5]);
            var rucREC = searchResult[0].getValue(searchLoad.columns[6]);
            if (tipoDocRelacionado == '03') {
                razonSocialREC = rucREC;
            }
            // DRF---------------------------------------------------------------------------------------------------------------------
            var tipoDocRelacionado = searchResult[0].getValue(searchLoad.columns[7]);
            var numeroDocRelacionado = searchResult[0].getValue(searchLoad.columns[8]);
            // COM---------------------------------------------------------------------------------------------------------------------
            var column43 = searchResult[0].getValue({ name: "custbody_pe_free_operation" });
            //?====================================================================================================================================================
            var fechaEmision = searchResult[0].getValue({ name: "trandate", label: "fechaEmision" });
            fechaEmision = fechaEmision.split('/');
            fechaEmision = fechaEmision[2] + '-' + padLeft(fechaEmision[1], 2, '0') + '-' + padLeft(fechaEmision[0], 2, '0');
            var tipoMoneda = searchResult[0].getValue({ name: "symbol", join: "Currency", label: "tipoMoneda" });
            var numeroOrdenCompra = searchResult[0].getValue({ name: "otherrefnum", label: "numeroOrdenCompra" });
            var fechaVencimiento = searchResult[0].getValue({ name: "duedate", join: "createdFrom", label: "fechaVencimiento" });
            var column05 = searchResult[0].getValue({ name: "symbol", join: "Currency" });

            // EMI---------------------------------------------------------------------------------------------------------------------
            var numeroDocId = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary", label: "numeroDocId" });
            var razonSocial = searchResult[0].getValue({ name: "legalname", join: "subsidiary", label: "razonSocial" });
            //var codubigeo = getUbigeo();
            var direccion1 = searchResult[0].getValue({ name: "address1", join: "subsidiary", label: "direccion1" });
            var direccion2 = searchResult[0].getValue({ name: "address2", join: "location", label: "direccion2" });
            var departamento = searchResult[0].getValue({ name: "city", join: "subsidiary", label: "departamento" });
            var provincia = searchResult[0].getValue({ name: "state", join: "subsidiary", label: "provincia" });
            var distrito = searchResult[0].getValue({ name: "address2", join: "subsidiary", label: "distrito" });
            var codigoPais = searchResult[0].getValue({ name: "country", join: "subsidiary", label: "country" });
            var telefono = searchResult[0].getValue({ name: "phone", join: "subsidiary", label: "telefono" });
            var correoElectronico = searchResult[0].getValue({ name: "email", join: "subsidiary", label: "correoElectronico" });
            // REC---------------------------------------------------------------------------------------------------------------------
            var numeroDocIdREC = searchResult[0].getValue({ name: "vatregnumber", join: "customer", label: "numeroDocIdREC" });
            var razonSocialREC = searchResult[0].getValue({ name: "companyname", join: "customer", label: "razonSocialREC" });

            var departamentoREC = searchResult[0].getValue({ name: "city", join: "customer", label: "departamentoREC" });
            var provinciaREC = searchResult[0].getValue({ name: "state", join: "customer", label: "provinciaREC" });
            var distritoREC = searchResult[0].getValue({ name: "address2", join: "customer", label: "distritoREC" });

            // DRF---------------------------------------------------------------------------------------------------------------------
            var codigoMotivo = searchResult[0].getValue({ name: "custrecord_pe_codigo_motivo", join: "CUSTBODY_PE_REASON", label: "codigoMotivo" });
            var descripcionMotivo = searchResult[0].getValue({ name: "name", join: "CUSTBODY_PE_REASON", label: "descripcionMotivo" });
            // CAB---------------------------------------------------------------------------------------------------------------------
            var tipoOperacion = searchResult[0].getValue({ name: "custrecord_pe_cod_fact", join: "CUSTBODY_PE_EI_OPERATION_TYPE", label: "tipoOperacion" });
            // COM---------------------------------------------------------------------------------------------------------------------
            var typedoc = searchResult[0].getText({ name: "custbody_pe_document_type", label: "typedoc" });
            var serie = searchResult[0].getText({ name: "custbody_pe_serie", label: "serie" });
            // REC---------------------------------------------------------------------------------------------------------------------
            var emailrec = searchResult[0].getValue({ name: "internalid", join: "customer", label: "emailrec" });
            // ADI---------------------------------------------------------------------------------------------------------------------
            var fechaVencADI = searchResult[0].getValue({ name: "custbody_pe_document_date_ref", label: "fechaVencADI" });
            var partesFecha = fechaVencADI.split("/");
            var fechaInicial = new Date(partesFecha[2], partesFecha[1] - 1, partesFecha[0]);
            fechaInicial.setDate(fechaInicial.getDate() + 1);
            var nuevaFecha = fechaInicial.toISOString().split('T')[0]; // fechaInicial.toLocaleDateString();
            //<I> rhuaccha: 2024-08-26
            //var tmpDate = searchResult[0].getValue({ name: "custbody_pe_fecha_venci_ref" });
            // var newDate = '';
            // if (tmpDate) {
            //     var dateArr = tmpDate.split("/");
            //     var initDate = new Date(dateArr[2], dateArr[1] - 1, dateArr[0]);
            //     initDate.setDate(initDate.getDate());
            //     newDate = initDate.toISOString().split('T')[0];
            // }
            //var condicionRef = searchResult[0].getText({ name: "custbody_pe_condicion_ref" });
            //var formaPagoRef = searchResult[0].getText({ name: "custbody_pe_forma_pago_ref" });
            //<F> rhuaccha: 2024-08-26
            var CustomerInternal = searchResult[0].getValue({ name: "entity" });
            var searchLoadCustomer = search.create({
                type: "customer",
                filters:
                    [
                        ["internalid", "anyof", CustomerInternal],
                        "AND",
                        ["address.isdefaultshipping", "is", "T"]
                    ],
                columns:
                    [
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" }),//0
                        search.createColumn({ name: "altname" }),
                        search.createColumn({ name: "custentity_pe_document_number" }),
                        search.createColumn({ name: "custrecord_pe_cod_doc_type", join: "custentity_pe_document_type" }),

                        search.createColumn({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" }),
                        search.createColumn({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" }),
                        search.createColumn({ name: "city", join: "Address", label: "city" }),

                    ]
            });
            var searchResultCustomer = searchLoadCustomer.run().getRange({ start: 0, end: 200 });
            var zipCustomer = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" });
            var column27 = searchResultCustomer[0].getValue({ name: "custrecord_pe_distrito", join: "Address", label: "distrito" });
            var column26 = searchResultCustomer[0].getValue({ name: "custrecord_pe_departamento", join: "Address", label: "departamento" });
            var column25 = searchResultCustomer[0].getValue({ name: "city", join: "Address", label: "city" });
            var nameCustomer = searchResultCustomer[0].getValue({ name: "altname" });
            var document_number = searchResultCustomer[0].getValue({ name: "custentity_pe_document_number" });
            var doc_type = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_doc_type", join: "custentity_pe_document_type" });
            fechaVencADI = fechaVencADI.split('/');
            fechaVencADI = fechaVencADI[2] + '-' + padLeft(fechaVencADI[1], 2, '0') + '-' + padLeft(fechaVencADI[0], 2, '0');


            // var condPagoADI = searchResult[0].getText({ name: "custbody_pe_ei_forma_pago", label: "condPagoADI" });
            // var moduloADI = searchResult[0].getText({ name: "location", label: "moduloADI" });
            // var dirDestinoADI = searchResult[0].getValue({ name: "custbody_pe_delivery_address", join: "createdFrom", label: "dirDestinoADI" });
            // var placaVehicADI = searchResult[0].getValue({ name: "custbody_pe_car_plate", join: "createdFrom", label: "placaVehicADI" });
            // var rucTransportistaADI = searchResult[0].getValue({ name: "custbody_pe_ruc_empresa_transporte", join: "createdFrom", label: "rucTransportistaADI" });

            var detail = getDetailCreditMemo(documentid, column43);
            /*   setLog({
                  title: 'detail',
                  details: detail
              }); */


            var monto = '';
            if (tipoMoneda == 'PEN') {
                monto = NumeroALetras(detail.importetotal, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
            } else {
                monto = NumeroALetrasDolar(detail.importetotal, { plural: 'DOLARES AMERICANOS', singular: 'DOLAR AMERICANO', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
            }
            jsonLeyenda = [
                {
                    codigo: "1000",
                    descripcion: monto.trim()
                }
            ]



            var totalVentas = 0;
            var TaxAmount = 0;
            var TaxScheme = 0;
            var apliccaanticipo = 0;
            var anticipotaxtotal = 0;
            var anticiposubtotal = 0;
            var taxcheme;
            var grav = detail.gravadas;
            var TaxTypeCode = 'VAT';
            if (grav != 'Vacio') {
                totalVentas = totalVentas + parseFloat(grav.totalVentas);
                // TaxAmount = detail.totalimpuestosgra[0].montoImpuesto;
                if (detail.totalimpuestosgra.length > 1) {
                    TaxAmount = detail.totalimpuestosgra[1].montoImpuesto;
                } else {
                    TaxAmount = detail.totalimpuestosgra[0].montoImpuesto;
                }

                TaxScheme = detail.totalimpuestosgra[0].idImpuesto;
                taxcheme = 'IGV';
                if (column43 == true) {
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(grav.totalVentas, tipoMoneda, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;
            }

            var exo = detail.exoneradas;
            if (exo != 'Vacio') {
                totalVentas = totalVentas + parseFloat(exo.totalVentas);
                TaxAmount = detail.totalimpuestosexo[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosexo[0].idImpuesto;
                taxcheme = 'EXO';
                if (column43 == true) {
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(exo.totalVentas, tipoMoneda, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;

            }

            var grat = detail.gratuita;
            if (grat != 'Vacio') {

                TaxAmount = detail.totalimpuestoigratuita[0].montoImpuesto;
                TaxScheme = detail.totalimpuestoigratuita[0].idImpuesto;
                TaxTypeCode = 'FRE'
                taxcheme = 'GRA';
                var taxableAmount = TaxableAmount(grat.totalVentas, tipoMoneda, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;

            }


            var ina = detail.inafectas;
            if (ina != 'Vacio') {
                totalVentas = totalVentas + parseFloat(ina.totalVentas);
                TaxAmount = detail.totalimpuestosina[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosina[0].idImpuesto;
                taxcheme = 'INA';
                TaxTypeCode = 'FRE';
                if (column43 == true) {
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(ina.totalVentas, tipoMoneda, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;

            }


            var exp = detail.exportacion;
            if (exp != 'Vacio') {
                totalVentas = totalVentas + parseFloat(exp.totalVentas);
                TaxAmount = detail.totalimpuestoiExport[0].montoImpuesto;
                TaxScheme = detail.totalimpuestoiExport[0].idImpuesto;
                taxcheme = 'EXP';
                TaxTypeCode = 'FRE';
                if (column43 == true) {
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var taxableAmount = TaxableAmount(exp.totalVentas, column05, TaxAmount, TaxScheme, taxcheme, TaxTypeCode, apliccaanticipo, anticipotaxtotal, anticiposubtotal)
                taxelement.push(taxableAmount);
                apliccaanticipo = 1;
            }


            if (column43 == true) {
                taxcheme = 'GRA';
                TaxTypeCode = 'FRE'
            }

            var detalleItems = new Array;
            var totalImpuertos = 0;
            var Monnetjson;

            var valordeventaunitario = 0;

            var subtotalCmAmount = 0;
            for (var i = 0; i < detail.det.length; i++) {
                subtotalCmAmount += detail.det[i].amount;
                totalImpuertos = totalImpuertos + parseFloat(detail.det[i].totalImpuestos[0].montoImpuesto);
                valordeventaunitario = parseFloat(detail.det[i].valorVenta) / parseFloat(detail.det[i].cantidadItems)
                //INICIO Jechevarria 30-05-2024
                var importeBruto = parseFloat(detail.det[i].importeBruto);
                var descuento = 0;
                if (detail.det[i].cargoDescuento) {
                    descuento = parseFloat(detail.det[i].cargoDescuento[0].importeBruto);
                }
                var campo_AT = importeBruto + descuento;
                campo_AT = campo_AT.toFixed(2);

                if (detail.det[i].taxCodeDisplay == 'TTG_PE:TTG') {
                    campo_AT = '0.00';
                }

                var getPriceAmount;

                if (detail.det[i].cargoDescuento) {
                    getPriceAmount = parseFloat(detail.det[i].valorUnitario) * (1 - parseFloat(detail.det[i].cargoDescuento[0].factorCargoDescuento));
                    getPriceAmount = getPriceAmount.toFixed(2);
                    getPriceAmount = getPriceAmount.toString();
                } else {
                    getPriceAmount = detail.det[i].valorUnitario;
                }
                var itemDescription
                if (detail.det[i].taxCodeDisplay == 'TTG_PE:TTG') {
                    itemDescription = detail.det[i].descripcionProducto + ' - BONIFICACION - ' + detail.det[i].cuponCode;
                } else {
                    itemDescription = detail.det[i].descripcionProducto;
                }

                detalleItems.push({
                    "ID": [
                        {
                            "_": detail.det[i].numeroItem
                        }
                    ],
                    "Note": [
                        {
                            "_": detail.det[i].unidad
                        }
                    ],
                    "CreditedQuantity": [
                        {
                            "_": detail.det[i].cantidadItems,
                            "unitCode": detail.det[i].unidad,
                            "unitCodeListID": "UN/ECE rec 20",
                            "unitCodeListAgencyName": "United Nations Economic Commission for Europe"
                        }
                    ],
                    "LineExtensionAmount": [
                        {
                            "_": detail.det[i].valorVenta,
                            "currencyID": tipoMoneda
                        }
                    ],
                    "BillingReference": [
                        {
                            "BillingReferenceLine": [
                                {
                                    "ID": [
                                        {
                                            "_": campo_AT,
                                            "schemeID": "AT"
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "PricingReference": [
                        {
                            "AlternativeConditionPrice": [
                                {
                                    "PriceAmount": [
                                        {
                                            "_": column43 == true ? valordeventaunitario.toFixed(2).toString() : detail.det[i].precioVentaUnitario,
                                            "currencyID": tipoMoneda
                                        }
                                    ],
                                    "PriceTypeCode": [
                                        {
                                            "_": detail.det[i].tipoprecio,
                                            "listName": "Tipo de Precio",
                                            "listAgencyName": "PE:SUNAT",
                                            "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16"
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "TaxTotal": [
                        {
                            "TaxAmount": [
                                {
                                    // "_": column43 == true ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto,
                                    "_": (column43 == true) ? "0.00" : (detail.det[i].taxCodeDisplay === 'TTG_PE:TTG') ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto, //<I> rhuaccha: 2024-08-29
                                    "currencyID": tipoMoneda
                                }
                            ],
                            "TaxSubtotal": [
                                {
                                    "TaxableAmount": [
                                        {
                                            "_": detail.det[i].totalImpuestos[0].montoBase,
                                            "currencyID": tipoMoneda
                                        }
                                    ],
                                    "TaxAmount": [
                                        {
                                            // "_": detail.det[i].totalImpuestos[0].montoImpuesto,
                                            "_": detail.det[i].taxCodeDisplay === 'TTG_PE:TTG' ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto, //<I> rhuaccha: 2024-08-29
                                            "currencyID": tipoMoneda
                                        }
                                    ],
                                    "TaxCategory": [
                                        {
                                            "Percent": [
                                                {
                                                    // "_": detail.det[i].totalImpuestos[0].porcentaje,
                                                    "_": detail.det[i].taxCodeDisplay === 'TTG_PE:TTG' ? "0.00" : detail.det[i].totalImpuestos[0].porcentaje, //<I> rhuaccha: 2024-08-29
                                                }
                                            ],
                                            "TaxExemptionReasonCode": [
                                                {
                                                    "_": detail.det[i].totalImpuestos[0].tipoAfectacion,
                                                    "listAgencyName": "PE:SUNAT",
                                                    "listName": "Afectacion del IGV",
                                                    "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07"
                                                }
                                            ],
                                            "TaxScheme": [
                                                {
                                                    "ID": [
                                                        {
                                                            "_": detail.det[i].totalImpuestos[0].idImpuesto,
                                                            "schemeName": "Codigo de tributos",
                                                            "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo05",
                                                            "schemeAgencyName": "PE:SUNAT"
                                                        }
                                                    ],
                                                    "Name": [
                                                        {
                                                            "_": detail.det[i].taxcheme
                                                        }
                                                    ],
                                                    "TaxTypeCode": [
                                                        {
                                                            "_": detail.det[i].TaxTypeCode
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "Item": [
                        {
                            "Description": [
                                {
                                    "_": itemDescription
                                }
                            ],
                            "SellersItemIdentification": [
                                {
                                    "ID": [
                                        {
                                            "_": detail.det[i].codigoProducto
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "Price": [
                        {
                            "PriceAmount": [
                                {
                                    // "_": column43 == true ? "0.00" : detail.det[i].valorUnitario,
                                    "_": column43 == true ? "0.00" : getPriceAmount,
                                    "currencyID": tipoMoneda
                                }
                            ]
                        }
                    ]
                });



                if (detail.det[i].taxcheme == 'EXO') {
                    detalleItems[i].BillingReference[0].BillingReferenceLine.push({
                        ID: [
                            {
                                _: detail.det[i].valorVenta,
                                schemeID: "AP"
                            }
                        ]
                    });

                }
                if (detail.det[i].cargoDescuento) {
                    var factor = detail.det[i].cargoDescuento[0].factorCargoDescuento * 100;
                    //lo convertimos a un texto del formato ##.##
                    factor = factor.toFixed(2) + '';

                    detalleItems[i].BillingReference[0].BillingReferenceLine.push({
                        ID: [
                            {
                                _: factor,
                                schemeID: "AO"
                            }
                        ]
                    });
                }

                if (detail.det[i].taxCodeDisplay == 'TTG_PE:TTG') {
                    detalleItems[i].BillingReference[0].BillingReferenceLine.push({
                        ID: [
                            {
                                _: "100.00",
                                schemeID: "AO"
                            }
                        ]
                    });
                }
                /*     if (BillingReference.length > 0) {
                        detalleItems[i].BillingReference = BillingReference;
                    } */
                //FIN Jechevarria 30-05-2024
                //<I> rhuaccha: 2024-09-13
                detalleItems[i].BillingReference[0].BillingReferenceLine.push({
                    ID: [
                        {
                            "_": detail.det[i].unitDisplay,
                            "schemeID": "AU"
                        }
                    ]
                });

                var getAVValue = 0;

                /*  if(detail.det[i].cargoDescuento){
                    getAVValue = parseFloat(detail.det[i].tarifa) * (1 - parseFloat(detail.det[i].cargoDescuento[0].factorCargoDescuento));
                    getAVValue = getAVValue.toFixed(2);
                    getAVValue = getAVValue.toString();
                }else {
                    getAVValue = detail.det[i].tarifa;
                 } */


                detalleItems[i].BillingReference[0].BillingReferenceLine.push({
                    ID: [
                        {
                            "_": detail.det[i].tarifa,
                            "schemeID": "AV"
                        }
                    ]
                });
                //<F> rhuaccha: 2024-09-13  
            }


            //Inicio Cambio Jechevarria 20-06-2024
            // var direccionEntrega = searchResult[0].getValue({ name: "custbody_pe_direccion_entrega_prede" });
            // if (direccionEntrega) {
            //     //le quitamos el salto de linea 
            //     direccionEntrega = direccionEntrega.replace(/\n/g, ' ');
            // }
            var salesrep = searchResult[0].getText({ name: "salesrep" });
            var createdfromType = searchResult[0].getValue({ name: "type", join: "createdFrom" });

            var idCreatedFrom = '';


            var ordenFactura;
            var nota_f;
            var nota_o;

            if (createdfromType == 'RtnAuth') {
                idCreatedFrom = searchResult[0].getValue({ name: "createdfrom", join: "createdFrom" });
                if (idCreatedFrom) {
                    ordenFactura = search.create({
                        type: "invoice",
                        filters:
                            [
                                ["type", "anyof", "CustInvc"],
                                "AND",
                                ["internalid", "anyof", idCreatedFrom]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "tranid", join: "createdFrom" })
                            ]
                    }).run().getRange(0, 1)[0].getValue({ name: "tranid", join: "createdFrom" });
                }
            } else {
                idCreatedFrom = searchResult[0].getValue({ name: "createdfrom", join: "createdFrom" });
                if (idCreatedFrom) {
                    ordenFactura = search.create({
                        type: "salesorder",
                        filters:
                            [
                                ["type", "anyof", "SalesOrd"],
                                "AND",
                                ["internalid", "anyof", idCreatedFrom]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "tranid" })
                            ]
                    }).run().getRange(0, 1)[0].getValue({ name: "tranid" });
                }
            }

            if (ordenFactura) {
                nota_f = {
                    "_": ordenFactura,
                    "languageID": "F"
                }
            }


            if (detail.gravadas != 'Vacio') {
                var gravadas = 0;
                for (var i = 0; i < detail.det.length; i++) {
                    if (detail.det[i].cargoDescuento) {
                        gravadas += parseFloat(detail.det[i].cargoDescuento[0].montoCargoDescuento);
                    }

                }

                if (gravadas > 0) {
                    gravadas = gravadas.toFixed(2);
                    nota_o = {
                        "_": gravadas,
                        "languageID": "O"
                    }
                }

            }


            //Fin Cambio Jechevarria 14-08-2024

            //var custbody_sj_motiv_devolucion = searchResult[0].getText({ name: "custbody_sj_motiv_devolucion" });



            Monnetjson = {
                "_D": "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2",
                "_A": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
                "_B": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
                "_E": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
                "CreditNote": [
                    {
                        "UBLVersionID": [
                            {
                                "_": "2.1"
                            }
                        ],
                        "CustomizationID": [
                            {
                                "_": "2.0"
                            }
                        ],
                        "ID": [
                            {
                                "_": numeracion
                            }
                        ],
                        "IssueDate": [
                            {
                                "_": fechaEmision
                            }
                        ],
                        "IssueTime": [
                            {
                                "_": "00:00:00"
                            }
                        ],
                        "Note": [
                            {
                                "_": monto,
                                "languageLocaleID": "1000"
                            }
                            // {
                            //     "_": newDate, // nuevaFecha,
                            //     "languageID": "C"

                            // },
                            //<I> rhuaccha: 2024-09-13
                            // {
                            //     "_": condicionRef, // formaPagoRef,
                            //     "languageID": "E"
                            // },
                            //<F> rhuaccha: 2024-09-13
                            // {
                            //     "_": custbody_sj_motiv_devolucion,
                            //     "languageID": "G"
                            // },
                            // //Inicio Jechevarria 20-06-2024
                            // {
                            //     "_": direccionEntrega,
                            //     "languageID": "I"
                            // },
                            // {
                            //     "_": salesrep,
                            //     "languageID": "H"
                            // },
                            //<I> rhuaccha: 2024-08-26
                            // {
                            //     "_": '001',
                            //     "languageID": "P"
                            // },
                            //<F> rhuaccha: 2024-08-26
                            //Fin Jechevarria 20-06-2024
                            // {
                            //     "_": "OBSERVACIONES GENERALES"
                            // }
                        ],
                        "DocumentCurrencyCode": [
                            {
                                "_": tipoMoneda,
                                "listID": "ISO 4217 Alpha",
                                "listName": "Currency",
                                "listAgencyName": "United Nations Economic Commission for Europe"
                            }
                        ],
                        "DiscrepancyResponse": [
                            {
                                "ResponseCode": [
                                    {
                                        "_": codigoMotivo,
                                        "listAgencyName": "PE:SUNAT",
                                        "listName": "Tipo de nota de credito",
                                        "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo09"
                                    }
                                ],
                                "Description": [
                                    {
                                        "_": descripcionMotivo
                                    }
                                ]
                            }
                        ],
                        "BillingReference": [
                            {
                                "InvoiceDocumentReference": [
                                    {
                                        "ID": [
                                            {
                                                "_": numeroDocRelacionado
                                            }
                                        ],
                                        "IssueDate": [
                                            {
                                                "_": fechaVencADI
                                            }
                                        ],
                                        "DocumentTypeCode": [
                                            {
                                                "_": tipoDocRelacionado,
                                                "listName": "Tipo de Documento",
                                                "listSchemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01",
                                                "listAgencyName": "PE:SUNAT"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        //inicio cambio Jechevarria 20-06-2024
                        /*   "OrderReference": [
                              {
                                  "ID": [
                                      {
                                          "_": numeroOrdenCompra
                                      }
                                  ]
                              }
                          ], */
                        //fin cambio Jechevarria 20-06-2024
                        "Signature": [
                            {
                                "ID": [
                                    {
                                        "_": "IDSignature"
                                    }
                                ],
                                "SignatoryParty": [
                                    {
                                        "PartyIdentification": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": numeroDocId
                                                    }
                                                ]
                                            }
                                        ],
                                        "PartyName": [
                                            {
                                                "Name": [
                                                    {
                                                        "_": razonSocial
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                "DigitalSignatureAttachment": [
                                    {
                                        "ExternalReference": [
                                            {
                                                "URI": [
                                                    {
                                                        "_": "IDSignature"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "AccountingSupplierParty": [
                            {
                                "Party": [
                                    {
                                        "PartyIdentification": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": numeroDocId,
                                                        "schemeID": tipoDocId,
                                                        "schemeName": "Documento de Identidad",
                                                        "schemeAgencyName": "PE:SUNAT",
                                                        "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06"
                                                    }
                                                ]
                                            }
                                        ],
                                        "PartyName": [
                                            {
                                                "Name": [
                                                    {
                                                        "_": nombreComercial
                                                    }
                                                ]
                                            }
                                        ],
                                        "PartyLegalEntity": [
                                            {
                                                "RegistrationName": [
                                                    {
                                                        "_": nombreComercial
                                                    }
                                                ],
                                                "RegistrationAddress": [
                                                    {
                                                        "ID": [
                                                            {
                                                                "_": zip,
                                                                "schemeAgencyName": "PE:INEI",
                                                                "schemeName": "Ubigeos"
                                                            }
                                                        ],
                                                        "AddressTypeCode": [
                                                            {
                                                                "_": "0000",
                                                                "listAgencyName": "PE:SUNAT",
                                                                "listName": "Establecimientos anexos"
                                                            }
                                                        ],
                                                        "CityName": [
                                                            {
                                                                "_": departamento
                                                            }
                                                        ],
                                                        "CountrySubentity": [
                                                            {
                                                                "_": provincia
                                                            }
                                                        ],
                                                        "District": [
                                                            {
                                                                "_": distrito
                                                            }
                                                        ],
                                                        "AddressLine": [
                                                            {
                                                                "Line": [
                                                                    {
                                                                        "_": direccion1
                                                                    }
                                                                ]
                                                            }
                                                        ],
                                                        "Country": [
                                                            {
                                                                "IdentificationCode": [
                                                                    {
                                                                        "_": codigoPais,
                                                                        "listID": "ISO 3166-1",
                                                                        "listAgencyName": "United Nations Economic Commission for Europe",
                                                                        "listName": "Country"
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "AccountingCustomerParty": [
                            {
                                "Party": [
                                    {
                                        "PartyIdentification": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": document_number,
                                                        "schemeID": doc_type,
                                                        "schemeName": "Documento de Identidad",
                                                        "schemeAgencyName": "PE:SUNAT",
                                                        "schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06"
                                                    }
                                                ]
                                            }
                                        ],
                                        "PartyName": [
                                            {
                                                "Name": [
                                                    {
                                                        "_": nameCustomer
                                                    }
                                                ]
                                            }
                                        ],
                                        "PartyLegalEntity": [
                                            {
                                                "RegistrationName": [
                                                    {
                                                        "_": nameCustomer
                                                    }
                                                ],
                                                "RegistrationAddress": [
                                                    {
                                                        "ID": [
                                                            {
                                                                "_": zipCustomer,
                                                                "schemeAgencyName": "PE:INEI",
                                                                "schemeName": "Ubigeos"
                                                            }
                                                        ],
                                                        "CityName": [
                                                            {
                                                                "_": column25
                                                            }
                                                        ],
                                                        "CountrySubentity": [
                                                            {
                                                                "_": column26
                                                            }
                                                        ],
                                                        "District": [
                                                            {
                                                                "_": column27
                                                            }
                                                        ],
                                                        "AddressLine": [
                                                            {
                                                                "Line": [
                                                                    {
                                                                        "_": column23
                                                                    }
                                                                ]
                                                            }
                                                        ],
                                                        "Country": [
                                                            {
                                                                "IdentificationCode": [
                                                                    {
                                                                        "_": column28,
                                                                        "listID": "ISO 3166-1",
                                                                        "listAgencyName": "United Nations Economic Commission for Europe",
                                                                        "listName": "Country"
                                                                    }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ],
                                        "Contact": [
                                            {
                                                "ElectronicMail": [
                                                    {
                                                        "_": "ercrguro@gmail.com"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        "TaxTotal": [
                            {
                                "TaxAmount": [
                                    {
                                        "_": column43 == true ? "0.00" : detail.montototalimpuestos.toString(),
                                        "currencyID": tipoMoneda
                                    }
                                ],
                                "TaxSubtotal": taxelement
                            }
                        ],
                        "LegalMonetaryTotal": [
                            {
                                "LineExtensionAmount": [
                                    {
                                        "_": column43 == true ? "0.00" : totalVentas,
                                        "currencyID": tipoMoneda
                                    }
                                ],
                                "PayableAmount": [
                                    {
                                        "_": column43 == true ? "0.00" : detail.importetotal.toString(),
                                        "currencyID": tipoMoneda
                                    }
                                ]
                            }
                        ],
                        "CreditNoteLine": detalleItems

                    }
                ]
            }

            //--<I> JChaveza 2025-10-24
            if (salesrep || salesrep != '') {
                Monnetjson.CreditNote[0].Note.push({
                    "_": salesrep,
                    "languageID": "H"
                });
            }
            Monnetjson.CreditNote[0].Note.push({ "_": '001', "languageID": "P" });
            Monnetjson.CreditNote[0].Note.push({ "_": "OBSERVACIONES GENERALES" });
            //--<F> JChaveza 2025-10-24

            //<I> rhuaccha: 2024-08-26
            // if (formaPagoRef === 'Credito') {
            //     var noteArray = Monnetjson.CreditNote[0].Note;
            //     var newObject = {
            //         "_": "001",
            //         "languageID": "Q"
            //     };

            //     var index = -1;
            //     for (var i = 0; i < noteArray.length; i++) {
            //         if (noteArray[i]._ === "OBSERVACIONES GENERALES") {
            //             index = i;
            //             break;
            //         }
            //     }

            //     if (index !== -1) {
            //         noteArray.splice(index, 0, newObject);
            //     } else {
            //         noteArray.push(newObject);
            //     }
            // }
            //<I> rhuaccha: 2024-09-03: validate empty fields
            Monnetjson.CreditNote[0].Note = Monnetjson.CreditNote[0].Note.filter(function (note) {
                var tagArr = ['C', 'G', 'P']
                if (tagArr.indexOf(note.languageID) !== -1) {
                    return note._ !== "";
                }
                return true;
            });
            Monnetjson.CreditNote[0].Note.push({
                "_": parseFloat(subtotalCmAmount).toFixed(2),
                "languageID": "S"

            });
            //<F> rhuaccha: 2024-08-26


            if (nota_f) {
                Monnetjson.CreditNote[0].Note.push(nota_f);
            }

            if (nota_o) {
                Monnetjson.CreditNote[0].Note.push(nota_o);
            }

            var filename = numeroDocId + '-' + codTipoDocumento + '-' + numeracion;
            Monnetjson = JSON.stringify(Monnetjson);


            var ticket = codTipoDocumento + '-' + numeracion
            var filejson = generateFileJSON(filename, Monnetjson);
            var filejson = file.load({ id: filejson });

            setRecord(codTipoDocumento, documentid, ticket, /*urlpdf, urlxml, urlcdr,*/ filejson.id /*encodepdf, array*/)
            return 'Transacción ' + ticket + ' generada ' + ' - JSON: ' + filejson.id;

        }

        function getDetailCreditMemo(documentid, freeop) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExportacion = ['Vacio'];
            var jsonGrat = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonTotalImpuestoICBPER = new Array();
            var jsonTotalImpuestoEXPORT = new Array();
            var jsonTotalImpuestoGRAT = new Array();
            var jsonCargoDescuento = new Array();
            var jsonTotalDescuentos = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
            var sumtotalVentasEXPORT = 0.0;
            var sumtotalVentasGRAT = 0.0;
            var summontoImpuestoEXPORT = 0.0;
            var summontoImpuestoGRAT = 0.0;
            var montoDetracion = 0;
            var applyAnty = new Array();
            var montoDetracionValor = 0
            // Params for subtotal
            var montobasecargodescuento = '';
            //Flag discount
            var anydiscoutnigv = '';
            // var jsontest = new Array();
            const TAX_CODE_GRAVADA = 'IGV_PE:S-PE'
            const TAX_CODE_INAFECTA = 'IGV_PE:Inaf-PE'
            const TAX_CODE_EXENTA = 'IGV_PE:E-PE'
            const TAXT_CODE_UNDEF = 'IGV_PE:UNDEF-PE'
            const TAXT_CODE_EXPORT = 'IGV_PE:X-PE'
            const TAXT_CODE_GRATUITA = 'TTG_PE:TTG'
            var applyDetr = false;


            // try {
            var openRecord = record.load({ type: record.Type.CREDIT_MEMO, id: documentid, isDynamic: true });
            /*  setLog({
                 title: 'openRecord',
                 details: openRecord
             }) */




            var total = openRecord.getValue({ fieldId: 'total' });
            var taxtotal = openRecord.getValue({ fieldId: 'taxtotal' });
            var codcustomer = openRecord.getText({ fieldId: 'entity' });
            codcustomer = codcustomer.split(' ');
            codcustomer = codcustomer[0];
            var linecount = openRecord.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < linecount; i++) {
                var jsonTotalImpuestos = new Array();
                var jsonCargoDescuentoLines = new Array();
                var precioVentaUnitario = 0.0;
                var idimpuesto = '';
                var codigo = '';
                var taxcheme = '';
                var TaxTypeCode = 'VAT';
                var tipoAfectacion = '';
                var itemtype_discount = 'notExist';
                var anydiscountline = '';

                //Params for discount
                var indicadorcargodescuento = '';
                var codigocargocescuento = '';
                var factorcargodescuento = 0.0;
                var montocargodescuento = 0.0;
                var round = 0.0;
                var taxcode_display_discount = '';
                var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                var getCodigo = search.lookupFields({
                    type: search.Type.ITEM,
                    id: item,
                    columns: ['itemid']
                });
                var item_display = getCodigo.itemid;


                //logStatus(documentid, item_display);
                var is_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: i });
                var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                //cambio Jechevarria 19/06/2024
                var grossamt = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i });

                var unit = getUnit(item);

                var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                var rateopfree = rate;

                var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                var taxrate1GRa = taxcode_display == TAXT_CODE_GRATUITA ? 0 : parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                var tax1amt = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                var directtax1amt = tax1amt
                var directamount = amount
                //logStatus(documentid, 'tax1amt1: ' + tax1amt);
                var montoimpuesto = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                var isicbp = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_icbp', line: i });
                var applywh = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line: i });
                if (applyDetr == false) {
                    applyDetr = applywh;
                }
                //<I> rhuaccha: 2024-09-13
                var unitsDisplay = getUnitDisplay(openRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'units',
                    line: i
                }));
                //<F> rhuaccha: 2024-09-13

                //logStatus(documentid, 'Entré a DESCUENTO: ' + taxcode_display);
                if (itemtype == 'Discount') {
                    montoDetracionValor = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                    montoDetracion = montoDetracion + (montoDetracionValor * -1);
                }
                if (itemtype == 'InvtPart' || itemtype == 'Service' || itemtype == 'NonInvtPart' || itemtype == 'Assembly' || itemtype == 'Kit') {
                    precioVentaUnitario = (rate + (rate * (taxrate1GRa / 100)));
                    //logStatus(documentid, precioVentaUnitario);
                    round = precioVentaUnitario.toString().split('.');
                    if (typeof round[1] != 'undefined') {
                        precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(2) : precioVentaUnitario;
                    }

                    if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                        if (freeop == true) {
                            idimpuesto = '9996'; // Gratuito
                            codigo = '1004'; // Total valor de venta – Operaciones gratuitas
                            tipoAfectacion = '15'; // Gravado – Retiro por premio
                            sumtotalVentasGRA += amount;
                            summontoImpuestoGRA += montoimpuesto;
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA
                            }
                            taxcheme = 'GRA';
                            TaxTypeCode = 'FRE';


                        } else {
                            idimpuesto = '1000'; // Igv impuesto general a las ventas
                            codigo = '1001'; // Total valor de venta - operaciones gravadas
                            tipoAfectacion = '10'; // Gravado - Operación Onerosa
                            sumtotalVentasGRA += amount;
                            summontoImpuestoGRA += montoimpuesto;
                            taxcheme = 'IGV';

                        }

                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA

                            }
                            jsonTotalImpuestosGRA = [{
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoGRA.toFixed(2),
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }];
                        }
                        // jsonGravadas = {
                        //     codigo: codigo,
                        //     totalVentas: sumtotalVentasGRA
                        // }
                        // jsonTotalImpuestosGRA.push({
                        //     idImpuesto: idimpuesto,
                        //     montoImpuesto: summontoImpuestoGRA.toFixed(2)
                        // });

                    } else if (taxcode_display == TAX_CODE_EXENTA) { // EXONERADAS
                        if (freeop == true) {
                            idimpuesto = '9996'; // Gratuito
                            codigo = '1004'; // Total valor de venta - operaciones exoneradas
                            tipoAfectacion = '21'; // Exonerado – Transferencia Gratuita
                            sumtotalVentasEXO += amount;
                            summontoImpuestoEXO += montoimpuesto;
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2)
                            }
                            taxcheme = 'GRA';
                            TaxTypeCode = 'FRE';

                        } else {
                            idimpuesto = '9997'; //Exonerado
                            codigo = '1003'; // Total valor de venta - operaciones exoneradas
                            tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                            sumtotalVentasEXO += amount;
                            summontoImpuestoEXO += montoimpuesto;
                            taxcheme = 'EXO';
                        }

                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                            //log.debug('AnyDiscount', itemtype_discount);
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2)

                            }
                        }

                        jsonTotalImpuestosEXO = [{
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoEXO.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        }];
                    } else if (taxcode_display == TAX_CODE_INAFECTA) { // INAFECTAS
                        if (freeop == true) {
                            idimpuesto = '9996'; // Gratuito
                            codigo = '1004'; // Total valor de venta - operaciones inafectas
                            tipoAfectacion = '35'; // Inafecto – Retiro por premio
                            sumtotalVentasINA += amount;
                            summontoImpuestoINA += montoimpuesto;
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2)
                            }
                            taxcheme = 'GRA';
                            TaxTypeCode = 'FRE'

                        } else {
                            idimpuesto = '9998'; // Inafecto
                            codigo = '1002'; // Total valor de venta - operaciones inafectas
                            tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                            sumtotalVentasINA += amount;
                            summontoImpuestoINA += montoimpuesto;
                            taxcheme = 'INA';
                            TaxTypeCode = 'FRE';
                        }
                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2)

                            }
                        }
                        jsonTotalImpuestosINA = [{
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoINA.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        }];
                    } else if (taxcode_display == TAXT_CODE_EXPORT) { // exportacion
                        log.debug('Exportacion', 'entro a Exportacion');

                        idimpuesto = '9995'; // Gratuito
                        codigo = '1004'; // Total valor de venta - operaciones inafectas
                        tipoAfectacion = '40'; // TaxExemptionReasonCode
                        sumtotalVentasEXPORT += amount;
                        summontoImpuestoEXPORT += montoimpuesto;
                        jsonExportacion = {
                            codigo: codigo,
                            totalVentas: sumtotalVentasEXPORT.toFixed(2)

                        }

                        jsonTotalImpuestoEXPORT.push({
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoEXPORT.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        });
                        taxcheme = 'EXP';
                        TaxTypeCode = 'FRE'
                    } else if (taxcode_display == TAXT_CODE_GRATUITA) { // exportacion
                        log.debug('Exportacion', 'entro a Exportacion');

                        idimpuesto = '9996'; // Gratuito
                        codigo = '1004'; // Total valor de venta - operaciones inafectas
                        tipoAfectacion = '31'; // TaxExemptionReasonCode
                        sumtotalVentasGRAT += amount;
                        summontoImpuestoGRAT += montoimpuesto;
                        jsonGrat = {
                            codigo: codigo,
                            totalVentas: sumtotalVentasGRAT.toFixed(2)

                        }

                        jsonTotalImpuestoGRAT = [{
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoGRAT.toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode
                        }];
                        taxcheme = 'GRA';
                        TaxTypeCode = 'FRE'
                    }


                    //logStatus(documentid, precioVentaUnitario);
                    if (anydiscountline == 'any') {
                        var rate_discount_line = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i + 1 }));
                        var amount_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i + 1 });
                        var tax1amt_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i + 1 });
                        var grossamt_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i + 1 });


                        tax1amt_discount_line = parseFloat(tax1amt_discount_line.toString().replace('-', ''));
                        rate_discount_line = rate_discount_line.toString().replace('-', '').replace('%', '');
                        factorcargodescuento = rate_discount_line / 100;
                        round = factorcargodescuento.toString().split('.');
                        if (typeof round[1] != 'undefined') {
                            round[1].length > 5 ? factorcargodescuento = factorcargodescuento.toFixed(5) : factorcargodescuento
                        }
                        amount_discount_line = parseFloat(amount_discount_line.toString().replace('-', ''));
                        montocargodescuento = parseFloat(amount_discount_line) * parseFloat(factorcargodescuento);
                        var dsctoVentaUnitario = parseFloat(precioVentaUnitario) * parseFloat(factorcargodescuento);
                        precioVentaUnitario = parseFloat(precioVentaUnitario) - dsctoVentaUnitario;

                        var montobasecargodscto = amount
                        amount = amount - amount_discount_line;
                        tax1amt = tax1amt - tax1amt_discount_line;
                        //logStatus(documentid, 'tax1amt2: ' + tax1amt);

                        if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que afectan la base imponible del IGV
                            sumtotalVentasGRA -= amount_discount_line;
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA,
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }
                            summontoImpuestoGRA -= tax1amt_discount_line;
                            jsonTotalImpuestosGRA.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoGRA.toFixed(2)
                            });
                        } else if (taxcode_display == TAX_CODE_EXENTA) {
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que no afectan la base imponible del IGV
                            sumtotalVentasEXO -= amount_discount_line;
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2),
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }
                        } else if (taxcode_display == TAX_CODE_INAFECTA) {
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que no afectan la base imponible del IGV
                            sumtotalVentasINA -= amount_discount_line;
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2),
                                taxcheme: taxcheme,
                                TaxTypeCode: TaxTypeCode
                            }
                        }

                        jsonCargoDescuentoLines.push({
                            indicadorCargoDescuento: indicadorcargodescuento,
                            codigoCargoDescuento: codigocargocescuento,
                            factorCargoDescuento: factorcargodescuento.toString(),
                            montoCargoDescuento: amount_discount_line.toFixed(2),
                            montoBaseCargoDescuento: montobasecargodscto.toString(),
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt_discount_line
                        });
                    }
                    //logStatus(documentid, 'tax1amt3: ' + tax1amt);
                    if (tax1amt == 0) {
                        tax1amt = directtax1amt
                    }
                    if (amount == 0) {
                        amount = directamount
                    }
                    jsonTotalImpuestos.push({
                        idImpuesto: idimpuesto,
                        montoImpuesto: tax1amt.toFixed(2),
                        tipoAfectacion: tipoAfectacion,
                        montoBase: amount.toFixed(2).toString(),
                        porcentaje: taxrate1.toString()
                    });

                    //logStatus(documentid, JSON.stringify(isicbp));
                    /* if (itemtype == 'NonInvtPart' || (isicbp == true && isicbp !== undefined)) {
                        log.debug(documentid, 'Entré a ICBP: ' + isicbp);
                        var montoImp = 0.5 * parseInt(quantity);
                        tax1amt = (tax1amt + montoImp).toFixed(2);
                        taxtotal = parseFloat(taxtotal) + montoImp;
                        //total = parseFloat(total) + montoImp;
        
                        jsonTotalImpuestoICBPER.push({
                            idImpuesto: '7152',
                            montoImpuesto: montoImp.toFixed(2)
                        });
        
                        jsonTotalImpuestos.push({
                            idImpuesto: '7152',
                            montoImpuesto: montoImp.toFixed(2),
                            tipoAfectacion: tipoAfectacion,
                            montoBase: quantity.toString(),
                            porcentaje: '0.50'
                        });
                    }*/

                    if (unit == "") {
                        unit = "NIU"//IMorales 20230814
                    }
                    var codeCupon = ""
                    try {
                        codeCupon = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_codigo_cupon', line: i + 1 });
                    } catch (error) {
                        codeCupon = ""
                    }


                    if (freeop == true) {
                        log.debug('MSK', 'description 1: ' + description)
                        //validamos si existe la siguiente linea 

                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            //cantidadItems: '1',
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            tipoprecio: '02',
                            valorUnitario: rate.toString(),
                            precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            valorRefOpOnerosas: rateopfree.toFixed(2).toString(),
                            montoTotalImpuestos: '0.00',
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode,
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt,
                            taxCodeDisplay: taxcode_display, //<I> rhuaccha: 2024-08-29
                            unitDisplay: nvl(unitsDisplay, openRecord.getSublistValue({ sublistId: 'item', fieldId: 'units_display', line: i })), //<I> rhuaccha: 2024-09-13
                            tarifa: parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })),
                            amount: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }), //<I> rhuaccha: 2024-09-16
                            cuponCode: codeCupon//<I> rhuaccha: 2024-09-19
                        });
                    } else if (anydiscountline == 'any') {
                        log.debug('MSK', 'description 2: ' + description)
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            tipoprecio: '01',
                            valorUnitario: rate.toString(),
                            precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                            cargoDescuento: jsonCargoDescuentoLines,
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            montoTotalImpuestos: parseFloat(tax1amt).toFixed(2),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode,
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt,
                            taxCodeDisplay: taxcode_display, //<I> rhuaccha: 2024-08-29
                            unitDisplay: nvl(unitsDisplay, openRecord.getSublistValue({ sublistId: 'item', fieldId: 'units_display', line: i })), //<I> rhuaccha: 2024-09-13
                            tarifa: parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })),
                            amount: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }), //<I> rhuaccha: 2024-09-16
                            cuponCode: codeCupon //<I> rhuaccha: 2024-09-19
                        });
                    } else {
                        //logStatus(documentid, 'Json: ' + precioVentaUnitario);
                        log.debug('MSK', 'description 3: ' + description)
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            tipoprecio: taxcode_display == TAXT_CODE_GRATUITA ? '02' : '01',
                            valorUnitario: taxcode_display == TAXT_CODE_GRATUITA ? '0.00' : rate.toString(),
                            precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            montoTotalImpuestos: tax1amt.toString(),
                            taxcheme: taxcheme,
                            TaxTypeCode: TaxTypeCode,
                            //Cambio jechevarria 19/06/2024
                            importeBruto: grossamt,
                            taxCodeDisplay: taxcode_display, //<I> rhuaccha: 2024-08-29
                            unitDisplay: nvl(unitsDisplay, openRecord.getSublistValue({ sublistId: 'item', fieldId: 'units_display', line: i })), //<I> rhuaccha: 2024-09-13
                            tarifa: parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })),
                            amount: openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }), //<I> rhuaccha: 2024-09-16
                            cuponCode: codeCupon //<I> rhuaccha: 2024-09-19 
                        });
                    }
                } else if (itemtype == 'Subtotal') {
                    montobasecargodescuento = amount; //subtotal
                } else if (itemtype == 'Discount' && is_discount_line == false && taxcode_display != TAXT_CODE_UNDEF) {
                    if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                        indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                        codigocargocescuento = '02'; // Descuentos globales que afectan la base imponible del IGV
                        anydiscoutnigv = 'any';
                    } else {
                        indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                        codigocargocescuento = '03'; // Descuentos globales que no afectan la base imponible del IGV
                    }
                    rate = rate.toString().replace('-', '').replace('%', '');
                    factorcargodescuento = rate / 100
                    round = factorcargodescuento.toString().split('.');
                    if (typeof round[1] != 'undefined') {
                        round[1].length > 5 ? factorcargodescuento = factorcargodescuento.toFixed(5) : factorcargodescuento
                    }
                    amount = amount.toString().replace('-', '')
                    jsonTotalDescuentos.push({
                        codigo: "2005",
                        totalDescuentos: amount
                    });

                    jsonCargoDescuento.push({
                        indicadorCargoDescuento: indicadorcargodescuento,
                        codigoCargoDescuento: codigocargocescuento,
                        factorCargoDescuento: factorcargodescuento.toString(),
                        montoCargoDescuento: amount,
                        montoBaseCargoDescuento: montobasecargodescuento.toString()
                    });
                }

            }

            if (anydiscoutnigv == 'any') {
                //!IMorales 20231110 - Comentado, dado que el descuento al totalVentas ya se hace más arriba
                // var newcalculate = jsonGravadas.totalVentas - amount;
                // jsonGravadas.totalVentas = newcalculate.toFixed(2);
            } else {
                if (jsonGravadas != 'Vacio') {
                    jsonGravadas = {
                        codigo: jsonGravadas.codigo,
                        totalVentas: jsonGravadas.totalVentas.toFixed(2)
                    }
                }
            }


            jsonReturn = {
                det: json,
                gravadas: jsonGravadas,
                inafectas: jsonInafectas,
                exoneradas: jsonExoneradas,
                exportacion: jsonExportacion,
                gratuita: jsonGrat,
                totalimpuestosgra: jsonTotalImpuestosGRA,
                totalimpuestosina: jsonTotalImpuestosINA,
                totalimpuestosexo: jsonTotalImpuestosEXO,
                totalimpuestoicbper: jsonTotalImpuestoICBPER,
                totalimpuestoiExport: jsonTotalImpuestoEXPORT,
                totalimpuestoigratuita: jsonTotalImpuestoGRAT,
                importetotal: total.toFixed(2),
                montototalimpuestos: taxtotal.toFixed(2),
                codigocliente: codcustomer,
                anydiscoutnigv: anydiscoutnigv,
                applywh: applyDetr,
                applyanty: applyAnty,
                montoDetracion: montoDetracion.toFixed(2).toString()
            }

            //! ACTIVAR PARA DESCUENTOS
            if (jsonCargoDescuento.length != 0) {
                if (codigocargocescuento == '03') {
                    jsonReturn.totaldescuentos = jsonTotalDescuentos;
                }
                jsonReturn.cargodescuento = jsonCargoDescuento;

                // }
                // else if (jsonCargoDescuento.length == 0 && _objPromocion != null && _objPromocion['p_dsctoglobal']) {
                //     var amount_prom = (_objPromocion.monto_dscto).replace('-', '');
                //     var jsonTotalDescuentosProm = new Array();
                //     var jsonCargoDescuentoProm = new Array();
                //     if (codigocargodescuento_prom == '03') {
                //         jsonTotalDescuentosProm.push({ codigo: "2005", totalDescuentos: amount_prom })
                //         jsonReturn.totaldescuentos = jsonTotalDescuentosProm;
                //     }

                //     jsonCargoDescuentoProm.push({
                //         indicadorCargoDescuento: 'false',
                //         codigoCargoDescuento: codigocargodescuento_prom,
                //         factorCargoDescuento: _objPromocion.p_descuento,
                //         montoCargoDescuento: amount_prom,
                //         montoBaseCargoDescuento: subtotal_global_prom.toString()
                //     });
                //     jsonReturn.cargodescuento = jsonCargoDescuentoProm
            }

            return jsonReturn;
            /* } catch (error) {
                 //logError(array[0], array[1], 'Error-getDetailCreditMemo', JSON.stringify(e));
                 logStatus(documentid, error);
             }*/
        }
        //!============================================================================================================================================

        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_pe_ei_document_status' });
                logStatus.setValue('custrecord_pe_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status_2', docstatus);
                logStatus.save();
            } catch (error) {

            }
        }

        function getUnit(itemid) {
            var unit = '';
            try {
                var getunit = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemid,
                    columns: ['custitem_pe_cod_measure_unit']
                });
                var unit = getunit.custitem_pe_cod_measure_unit;
                return unit;
            } catch (e) {
                log.debug('MSK', 'error: ' + e)
            }
        }

        function getUbigeo(id) {
            try {
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                        [
                            ["internalid", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "addr1",
                                join: "address",
                                label: "Adress"
                            }),
                            search.createColumn({
                                name: "zip",
                                join: "address",
                                label: "PE Ubigeo"
                            }),
                            search.createColumn({
                                name: "addr2",
                                join: "address",
                                label: "addr2"
                            }),
                            search.createColumn({
                                name: "country",
                                join: "address",
                                label: "country"
                            })
                        ]
                });
                var searchResult = subsidiarySearchObj.run().getRange({ start: 0, end: 1 });
                var direccion = searchResult[0].getValue(subsidiarySearchObj.columns[0]);
                var ubigeo = searchResult[0].getValue(subsidiarySearchObj.columns[1]);
                var addr2 = searchResult[0].getValue(subsidiarySearchObj.columns[2]);
                var country = searchResult[0].getValue(subsidiarySearchObj.columns[3]);
                return {

                    direccion: direccion,
                    ubigeo: ubigeo,
                    addr2: addr2,
                    country: country,
                }
            } catch (e) {

            }
        }

        function setRecord(recordtype, internalid, tranid, /*urlpdf, urlxml, urlcdr,*/ urljson /*encodepdf, array*/, tranType) {
            var recordload = '';
            try {
                if (recordtype == '07') {
                    recordload = record.load({ type: record.Type.CREDIT_MEMO, id: internalid });
                } else if (recordtype == '09') {
                    recordload = record.load({ type: 'itemfulfillment', id: internalid });
                } else {
                    recordload = record.load({ type: tranType, id: internalid, isDynamic: true })
                }
                //recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                recordload.setValue('custbody_pe_fe_ticket_id', tranid);
                recordload.setValue('custbody_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custbody_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custbody_pe_ei_printed_cdr_res', urlcdr);
                // recordload.setValue('custbody_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custbody_pe_ei_printed_pdf_codificado', encodepdf);
                // recordload.save();
                recordload.save({ ignoreMandatoryFields: true });
                // recordload = record.create({type: 'customrecord_pe_ei_printed_fields',isDynamic: true});
                // recordload.setValue('name', tranid);
                // recordload.setValue('custrecord_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custrecord_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custrecord_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custrecord_pe_ei_printed_cdr_res', urlcdr);
                // recordload.save();
                return recordload;
            } catch (e) {
                // logError(array[0], array[1], 'Error-setRecord', e.message);
                log.debug(internalid, e.message);
            }
        }

        function setRecordVendor(recordtype, internalid, tranid, /*urlpdf, urlxml, urlcdr,*/ urljson /*encodepdf, array*/) {
            var recordload = '';
            try {
                if (recordtype == '20') {
                    recordload = record.load({ type: 'vendorcredit', id: internalid });
                }

                recordload.setValue('custbody_pe_fe_ticket_id', tranid);
                recordload.setValue('custbody_pe_ei_printed_xml_req', urljson);
                recordload.save();
                return recordload;
            } catch (e) {
                log.debug('Error-setRecord', e.message);
            }
        }


        //BLOQUE DE CONVERSIÓN MONTO EN LETRAS================================================================================================================================================================================================
        function Unidades(num) {
            switch (num) {
                case 1: return 'UN';
                case 2: return 'DOS';
                case 3: return 'TRES';
                case 4: return 'CUATRO';
                case 5: return 'CINCO';
                case 6: return 'SEIS';
                case 7: return 'SIETE';
                case 8: return 'OCHO';
                case 9: return 'NUEVE';
            }

            return '';
        }//Unidades()


        function Decenas(num) {
            var decena = Math.floor(num / 10);
            var unidad = num - (decena * 10);

            switch (decena) {
                case 1:
                    switch (unidad) {
                        case 0: return 'DIEZ';
                        case 1: return 'ONCE';
                        case 2: return 'DOCE';
                        case 3: return 'TRECE';
                        case 4: return 'CATORCE';
                        case 5: return 'QUINCE';
                        default: return 'DIECI' + Unidades(unidad);
                    }
                case 2:
                    switch (unidad) {
                        case 0: return 'VEINTE';
                        default: return 'VEINTI' + Unidades(unidad);
                    }
                case 3: return DecenasY('TREINTA', unidad);
                case 4: return DecenasY('CUARENTA', unidad);
                case 5: return DecenasY('CINCUENTA', unidad);
                case 6: return DecenasY('SESENTA', unidad);
                case 7: return DecenasY('SETENTA', unidad);
                case 8: return DecenasY('OCHENTA', unidad);
                case 9: return DecenasY('NOVENTA', unidad);
                case 0: return Unidades(unidad);
            }
        }//Unidades()


        function DecenasY(strSin, numUnidades) {
            if (numUnidades > 0) {
                return strSin + ' Y ' + Unidades(numUnidades)
            }
            return strSin;
        }//DecenasY()


        function Centenas(num) {
            var centenas = Math.floor(num / 100);
            var decenas = num - (centenas * 100);
            switch (centenas) {
                case 1:
                    if (decenas > 0) {
                        return 'CIENTO ' + Decenas(decenas);
                    }
                    return 'CIEN';
                case 2: return 'DOSCIENTOS ' + Decenas(decenas);
                case 3: return 'TRESCIENTOS ' + Decenas(decenas);
                case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
                case 5: return 'QUINIENTOS ' + Decenas(decenas);
                case 6: return 'SEISCIENTOS ' + Decenas(decenas);
                case 7: return 'SETECIENTOS ' + Decenas(decenas);
                case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
                case 9: return 'NOVECIENTOS ' + Decenas(decenas);
            }

            return Decenas(decenas);
        }//Centenas()


        function Seccion(num, divisor, strSingular, strPlural) {
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)
            var letras = '';

            if (cientos > 0) {
                if (cientos > 1) {
                    letras = Centenas(cientos) + ' ' + strPlural;
                } else {
                    letras = strSingular;
                }
            }

            if (resto > 0) {
                letras += '';
            }
            return letras;
        }//Seccion()


        function Miles(num) {
            var divisor = 1000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            var strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
            var strCentenas = Centenas(resto);

            if (strMiles == '') {
                return strCentenas;
            }
            return strMiles + ' ' + strCentenas;
        }//Miles()


        function Millones(num) {
            var divisor = 1000000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            // var strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
            var strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
            var strMiles = Miles(resto);

            if (strMillones == '') {
                return strMiles;
            }
            return strMillones + ' ' + strMiles;
        }//Millones()


        function NumeroALetras(num, currency) {
            currency = currency || {};
            var data = {
                numero: num,
                enteros: Math.floor(num),
                centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                porcentaje: (((Math.round(num * 100)) - (Math.floor(num) * 100))) == 0 ? '0/100 ' : '/100 ',
                letrasCentavos: '',
                letrasMonedaPlural: currency.plural || 'SOLES',//'PESOS', 'DOLARES AMERICANOS', 'Bolívares', 'etcs'
                letrasMonedaSingular: currency.singular || 'SOL', //'PESO', 'DOLAR AMERICANOS'', 'Bolivar', 'etc'
                letrasMonedaCentavoPlural: currency.centPlural || 'CENTIMOS',
                letrasMonedaCentavoSingular: currency.centSingular || 'CENTIMO'
            };


            if (data.enteros == 0)
                return 'CERO ' + ' CON ' + data.centavos + data.porcentaje + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
            if (data.enteros == 1)
                return Millones(data.enteros) + ' CON ' + data.centavos + data.porcentaje + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
            else
                return Millones(data.enteros) + ' CON ' + data.centavos + data.porcentaje + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        }

        function NumeroALetrasDolar(num, currency) {
            currency = currency || {};
            var data = {
                numero: num,
                enteros: Math.floor(num),
                centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                porcentaje: (((Math.round(num * 100)) - (Math.floor(num) * 100))) == 0 ? '0/100 ' : '/100 ',
                letrasCentavos: '',
                letrasMonedaPlural: currency.plural || 'DOLARES AMERICANOS',//'PESOS', 'SOLES', 'Bolívares', 'etcs'
                letrasMonedaSingular: currency.singular || 'DOLAR AMERICANO', //'PESO', 'SOL', 'Bolivar', 'etc'
                letrasMonedaCentavoPlural: currency.centPlural || 'CENTAVOS',
                letrasMonedaCentavoSingular: currency.centSingular || 'CENTAVO'
            };



            if (data.enteros == 0)
                return 'CERO ' + ' CON ' + data.centavos + data.porcentaje + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
            if (data.enteros == 1)
                return Millones(data.enteros) + ' CON ' + data.centavos + data.porcentaje + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
            else
                return Millones(data.enteros) + ' CON ' + data.centavos + data.porcentaje + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        }


        function saveJson(contents, nombre) {
            var name = new Date();
            var fileObj = file.create({
                name: nombre, /// + "_" + name + ".json", // MD1
                fileType: file.Type.JSON,
                contents: JSON.stringify(contents),
                folder: 929,
                isOnline: false
            });
            // Save the file
            var id = fileObj.save();
        }

        //<I> rhuaccha: 2024-08-14
        function isValid(value) {
            return value !== null && value !== undefined && value !== '';
        }

        function getItemDetails(itemId) {
            var result = null;
            try {
                var itemSearch = search.create({
                    type: search.Type.ITEM,
                    filters: [
                        ['internalid', 'is', itemId]
                    ],
                    columns: [
                        search.createColumn({ name: 'itemid', label: 'Item ID' }),
                        search.createColumn({ name: 'displayname', label: 'Display Name' }),
                        search.createColumn({ name: 'type', label: 'Type' }),
                        search.createColumn({ name: 'custitem_sj_peso_de_articulo_', label: 'peso' }),
                        search.createColumn({ name: 'custitem_sj_cubicaje_', label: 'cubicaje' }),
                    ]
                });
                var searchResult = itemSearch.run().getRange({ start: 0, end: 1 });
                if (searchResult.length > 0) {
                    var item = searchResult[0];
                    result = {
                        itemId: item.getValue('itemid'),
                        displayName: item.getValue('displayname'),
                        type: item.getValue('type'),
                        peso: item.getValue('custitem_sj_peso_de_articulo_'),
                        cubicaje: item.getValue('custitem_sj_cubicaje_')
                    };
                }
            } catch (error) {
                console.log('Error : ' + error.message);
            }
            return result;
        }

        function nvl(value, defaultValue) {
            return (value !== null && value !== undefined && value !== '') ? value : defaultValue;
        }
        function getUnitDisplay(internalId) {
            var value = '';
            try {
                var lookup = search.lookupFields({
                    type: 'unitstype',
                    id: internalId,
                    columns: ['name', 'unitname']
                });

                if (Object.keys(lookup).length !== 0) {
                    value = nvl(lookup.unitname, lookup.name);
                }

            } catch (error) {
                value = '';
            }
            return value;
        }

        function getItemDescription(description, taxCode, cuponCode) {
            var value = '';
            try {
                if (taxCode === 'TTG_PE:TTG') {
                    value = description + ' - BONIFICACIÓN';
                    if (isValid(cuponCode)) {
                        value = value + ' - ' + cuponCode;
                    }
                } else {
                    value = description;
                }
            } catch (error) {
                value = description;
            }
            return value;
        }
        //<F> rhuaccha: 2024-08-14

        function getRelatedDocument(createFromId) {
            var resultObj = {
                status: false,
                message: 'init',
                data: {}
            }
            try {
                var tmpSearch = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ['type', 'anyof', 'CustInvc'],
                        'AND',
                        ['createdfrom', 'is', createFromId],
                        'AND',
                        ['mainline', 'is', 'T']
                    ],
                    columns: [
                        search.createColumn({
                            name: 'tranid',
                            sort: search.Sort.DESC
                        }),
                        search.createColumn({
                            name: 'custrecord_pe_code_document_type',
                            join: 'custbody_pe_document_type',
                            label: 'Tipo de Documento'
                        }),
                        search.createColumn({
                            name: 'custrecord_pe_serie_impresion',
                            join: 'custbody_pe_serie',
                            label: 'Serie'
                        }),
                        search.createColumn({
                            name: 'custbody_pe_number',
                            label: 'Numero'
                        }),
                        search.createColumn({
                            name: 'taxidnum',
                            join: 'subsidiary',
                            label: 'RUC'
                        }),
                    ]
                });

                var latestInvoice = null;
                tmpSearch.run().each(function (result) {
                    latestInvoice = {
                        tranId: result.getValue({
                            name: 'tranid'
                        }),
                        tipoDoc: result.getValue({
                            name: 'custrecord_pe_code_document_type',
                            join: 'custbody_pe_document_type'
                        }),
                        serie: result.getValue({
                            name: 'custrecord_pe_serie_impresion',
                            join: 'custbody_pe_serie'
                        }),
                        numero: result.getValue({
                            name: 'custbody_pe_number'
                        }),
                        subsidiary: result.getValue({
                            name: 'taxidnum',
                            join: 'subsidiary'
                        }),
                    };
                    return false; // solo obtener la primera iteración
                });
                resultObj.status = true;
                resultObj.message = 'Proceso completado correctamente.';
                resultObj.data = latestInvoice;
            } catch (error) {
                resultObj.status = false;
                resultObj.message = error.message
            }
            return resultObj;
        }

        function shouldAddToJson(column43, isDonation) {
            return !(column43 || isDonation);
        }


        function setLog(params) {
            logMessage.push(params);
        }

        function saveLog() {
            /* let fileLog = file.create({
                name: 'TS_PL_Ooutbond_Validation_log.txt',
                fileType: file.Type.PLAINTEXT,
                contents: JSON.stringify(logMessage),
                folder: 1162
            });
    
            fileLog.save(); */
        }

        function validarYRedondearNumero(numero) {
            // Verificar si el valor es un número válido
            if (isNaN(numero) || numero === null || numero === "") {
                return "El valor ingresado no es un número válido.";
            }

            // Convertir el número a un valor numérico (por si se pasa como cadena)
            numero = parseFloat(numero);

            // Verificar si el número tiene más de 3 decimales
            const partes = numero.toString().split('.');

            if (partes.length > 1 && partes[1].length > 3) {
                // Redondear a 3 decimales
                return (Math.round(numero * 1000) / 1000).toFixed(3);
            } else {
                // Si tiene 3 decimales o menos, devolverlo tal cual
                return numero.toFixed(2); // Para mostrarlo con 2 decimales
            }
        }

        return {
            validate: validate
        };

    });