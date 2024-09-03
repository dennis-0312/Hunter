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
                        response = createRequest(transactionId);
                        break;
                    case 'creditmemo':
                        response = createRequestCreditMemo(transactionId);
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
                        break;
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
                        search.createColumn({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "llegada" }),
                        search.createColumn({ name: "custbody_pe_delivery_address" }),
                        search.createColumn({ name: "custbody_pe_source_address" }),
                        search.createColumn({ name: "custbody_pe_document_number_ref" }),
                        search.createColumn({ name: "custbody_pe_document_series_ref" }),
                        search.createColumn({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type_ref", label: "codigo" }),//3
                        search.createColumn({ name: "name", join: "custbody_pe_document_type_ref", label: "name" }),
                        search.createColumn({ name: "transferlocation" }),
                        search.createColumn({ name: "custrecord_pe_cod_establishment_annex", join: "custbody_pe_location_source" }),
                        search.createColumn({ name: "type", join: "createdFrom" }),
                    ]
            });
            var searchResultitemfulfillment = itemfulfillmentSearchObj.run().getRange({ start: 0, end: 200 });
            var creadoDesde = searchResultitemfulfillment[0].getValue({ name: "type", join: "createdFrom" });
            var modalidad = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_traslado", join: "custbody_pe_modalidad_de_traslado", label: "modalidad" });
            var salesorderitems = searchResultitemfulfillment[0].getValue({ name: "internalid", join: "createdFrom", label: "Internal ID" });
            var Peserie = searchResultitemfulfillment[0].getText({ name: "custbody_pe_serie", label: "PE Serie" }) + "-" + searchResultitemfulfillment[0].getValue({ name: "custbody_pe_number", label: "PE Nombre" });
            var fechaEmision = searchResultitemfulfillment[0].getValue({ name: "trandate" });
            var partida = searchResultitemfulfillment[0].getText({ name: "custbody_pe_ubigeo_punto_partida" });
            var llegada = searchResultitemfulfillment[0].getText({ name: "custbody_pe_ubigeo_punto_llegada" });
            var motivo = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_motivo_de_traslado", join: "custbody_pe_motivos_de_traslado", label: "motivo" });
            partida = partida.split(':');
            llegada = llegada.split(':');

            var codigoDestino = searchResultitemfulfillment[0].getValue({ name: "transferlocation" });
            codigoDestino = getCodigoUbicacion(codigoDestino);
            var codigoLlegada = searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_cod_establishment_annex", join: "custbody_pe_location_source" });

            var observacion = searchResultitemfulfillment[0].getValue({ name: "memo", label: "Memo" });
            fechaEmision = fechaEmision.split('/');
            fechaEmision = fechaEmision[2] + '-' + padLeft(fechaEmision[1], 2, '0') + '-' + padLeft(fechaEmision[0], 2, '0');
            var fechatralado = searchResultitemfulfillment[0].getValue({ name: "custbody_pe_fecha_inicio_traslado" });
            fechatralado = fechatralado.split('/');
            fechatralado = fechatralado[2] + '-' + padLeft(fechatralado[1], 2, '0') + '-' + padLeft(fechatralado[0], 2, '0');
            var searchLoad;
            if (motivo == '04') {
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
                            search.createColumn({ name: "state", join: "subsidiary" }),
                            search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                            search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                            search.createColumn({ name: "internalid", join: "subsidiary" }),
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "internalid" })
                        ]

                });
            } else if (motivo == '02') {
                searchLoad = search.create({
                    type: "vendorreturnauthorization",
                    filters:
                        [
                            ["type", "anyof", "VendAuth"],
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
                            search.createColumn({ name: "state", join: "subsidiary" }),
                            search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                            search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                            search.createColumn({ name: "vatregnumber", join: "vendor" }),
                            search.createColumn({ name: "vatregnumber", join: "vendor" }),
                            search.createColumn({ name: "formulatext", formula: "CASE WHEN {vendor.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {vendor.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {customer.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "20 Doc. Type ID REC" }),//19
                            search.createColumn({ name: "companyname", join: "vendor" }),
                            search.createColumn({ name: "firstname", join: "vendor" }),
                            search.createColumn({ name: "lastname", join: "vendor" }),
                            search.createColumn({ name: "entity" }),
                            search.createColumn({ name: "city", join: "vendor" }),
                            search.createColumn({ name: "state", join: "vendor" }),
                            search.createColumn({ name: "address1", join: "vendor" }),
                            search.createColumn({ name: "address2", join: "vendor" }),
                            search.createColumn({ name: "country", join: "vendor" }),
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "internalid", join: "subsidiary" }),
                        ]

                });
            } else if (motivo == '13') {
                if (creadoDesde == 'SalesOrd') {
                    searchLoad = search.create({
                        type: "salesorder",
                        filters:
                            [
                                ["type", "anyof", "SalesOrd"],
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
                                search.createColumn({ name: "state", join: "subsidiary" }),
                                search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                                search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                                search.createColumn({ name: "vatregnumber", join: "customer" }),
                                search.createColumn({ name: "vatregnumber", join: "customer" }),
                                search.createColumn({ name: "formulatext", formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {customer.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "20 Doc. Type ID REC" }),//19
                                search.createColumn({ name: "companyname", join: "customer" }),
                                search.createColumn({ name: "firstname", join: "customer" }),
                                search.createColumn({ name: "lastname", join: "customer" }),
                                search.createColumn({ name: "entity" }),
                                search.createColumn({ name: "city", join: "customer" }),
                                search.createColumn({ name: "state", join: "customer" }),
                                search.createColumn({ name: "address1", join: "customer" }),
                                search.createColumn({ name: "address2", join: "customer" }),
                                search.createColumn({ name: "country", join: "customer" }),
                                search.createColumn({ name: "internalid" }),
                                search.createColumn({ name: "internalid", join: "subsidiary" }),
                            ]

                    });
                } else {
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
                                search.createColumn({ name: "state", join: "subsidiary" }),
                                search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                                search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                                search.createColumn({ name: "vatregnumber", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "vatregnumber", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "formulatext", formula: "CASE WHEN {vendor.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {custbody_pe_entidad_prestamo.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {custbody_pe_entidad_prestamo.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "20 Doc. Type ID REC" }),//19
                                search.createColumn({ name: "companyname", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "firstname", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "lastname", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "entity" }),
                                search.createColumn({ name: "city", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "state", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "address1", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "address2", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "country", join: "custbody_pe_entidad_prestamo" }),
                                search.createColumn({ name: "internalid" }),
                                search.createColumn({ name: "internalid", join: "subsidiary" }),
                                search.createColumn({ name: "internalid", join: "custbody_pe_entidad_prestamo" }),
                            ]

                    });
                }

            } else {
                searchLoad = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
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
                            search.createColumn({ name: "state", join: "subsidiary" }),
                            search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                            search.createColumn({ name: "country", join: "subsidiary", label: "country" }),
                            search.createColumn({ name: "vatregnumber", join: "customer" }),
                            search.createColumn({ name: "vatregnumber", join: "customer" }),
                            search.createColumn({ name: "formulatext", formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {customer.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "20 Doc. Type ID REC" }),//19
                            search.createColumn({ name: "companyname", join: "customer" }),
                            search.createColumn({ name: "firstname", join: "customer" }),
                            search.createColumn({ name: "lastname", join: "customer" }),
                            search.createColumn({ name: "entity" }),
                            search.createColumn({ name: "city", join: "customer" }),
                            search.createColumn({ name: "state", join: "customer" }),
                            search.createColumn({ name: "address1", join: "customer" }),
                            search.createColumn({ name: "address2", join: "customer" }),
                            search.createColumn({ name: "country", join: "customer" }),
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "internalid", join: "subsidiary" }),
                        ]

                });
            }

            var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
            var id_subsi = searchResult[0].getValue({ name: "internalid", join: "subsidiary" });

            var column08 = searchResult[0].getValue({ name: "legalname", join: "subsidiary", label: "10 Legal Name" });
            var column09 = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary", label: "taxidnum" });
            var zip = searchResult[0].getValue({ name: "zip", join: "subsidiary", label: "zip" });
            var column13 = searchResult[0].getValue({ name: "address1", join: "subsidiary" });
            var departamento = searchResult[0].getValue({ name: "city", join: "subsidiary" });
            var column14 = searchResult[0].getValue({ name: "state", join: "subsidiary" });
            var addr2 = searchResult[0].getValue({ name: "address2", join: "subsidiary", label: "address2" });
            var contry = searchResult[0].getValue({ name: "country", join: "subsidiary", label: "country" });

            if (id_subsi != null && id_subsi != '') {
                var datos_subsi = getSubsi(id_subsi);
                zip = datos_subsi.cod_ubi;
                departamento = datos_subsi.depa;
                addr2 = datos_subsi.distrito;
            }

            if (motivo == '13' && creadoDesde == 'TrnfrOrd') {
                var column21 = searchResult[0].getValue({ name: "vatregnumber", join: "custbody_pe_entidad_prestamo" });
                var column20 = '6';
                var column22 = searchResult[0].getValue({ name: "companyname", join: "custbody_pe_entidad_prestamo" });
                var column25 = searchResult[0].getValue({ name: "city", join: "custbody_pe_entidad_prestamo" });
                var column26 = searchResult[0].getValue({ name: "state", join: "custbody_pe_entidad_prestamo" });
                var column23 = searchResult[0].getValue({ name: "address1", join: "custbody_pe_entidad_prestamo" });
                var column28 = searchResult[0].getValue({ name: "country", join: "custbody_pe_entidad_prestamo" });
                var column27 = searchResult[0].getValue({ name: "address2", join: "custbody_pe_entidad_prestamo" });
            } else {
                var column21 = searchResult[0].getValue({ name: "vatregnumber", join: "customer" });
                var column20 = searchResult[0].getValue(searchLoad.columns[10]);
                var column22 = searchResult[0].getValue({ name: "companyname", join: "customer" });
                var column25 = searchResult[0].getValue({ name: "city", join: "customer" });
                var column26 = searchResult[0].getValue({ name: "state", join: "customer" });
                var column23 = searchResult[0].getValue({ name: "address1", join: "customer" });
                var column28 = searchResult[0].getValue({ name: "country", join: "customer" });
                var column27 = searchResult[0].getValue({ name: "address2", join: "customer" });
            }

            if (motivo != '04' && motivo != '02') {
                var CustomerId = '';
                if (motivo == '13' && creadoDesde == 'TrnfrOrd') {
                    CustomerId = searchResult[0].getValue({ name: "internalid", join: "custbody_pe_entidad_prestamo" });
                } else {
                    CustomerId = searchResult[0].getValue({ name: "entity" });
                }
                var searchCustomer = search.create({
                    type: "customer",
                    filters:
                        [
                            ["internalid", "anyof", CustomerId]
                        ],
                    columns:
                        [

                            search.createColumn({ name: "custrecord_pe_departamento", join: "Address" }),//0
                            search.createColumn({ name: "custrecord_pe_distrito", join: "Address" }),//0
                        ]
                })
                var ResultCustomer = searchCustomer.run().getRange({ start: 0, end: 200 });

                column25 = ResultCustomer[0].getValue({ name: "custrecord_pe_departamento", join: "Address" });
                column27 = ResultCustomer[0].getValue({ name: "custrecord_pe_distrito", join: "Address" });
            }

            if (motivo == '04' || motivo == '02') {
                column21 = column09;
                column20 = '6';
                column22 = column08;
                column25 = departamento;
                column26 = column14;
                column23 = column13;
                column28 = contry;
                column27 = addr2;
            }
            var zipCustomer = '';
            if (motivo != '04' && motivo != '02') {
                if (column20 == "1") {
                    column22 = searchResult[0].getValue({ name: "firstname", join: "customer" }) + ' ' + searchResult[0].getValue({ name: "lastname", join: "customer" });
                }
                var CustomerInternal = ''
                if (motivo == '13' && creadoDesde == 'TrnfrOrd') {
                    CustomerInternal = searchResult[0].getValue({ name: "internalid", join: "custbody_pe_entidad_prestamo" });
                } else {
                    CustomerInternal = searchResult[0].getValue({ name: "entity" });
                }
                var searchLoadCustomer = search.create({
                    type: "customer",
                    filters:
                        [
                            ["internalid", "anyof", CustomerInternal]
                        ],
                    columns:
                        [
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" }),//0
                        ]
                })
                var searchResultCustomer = searchLoadCustomer.run().getRange({ start: 0, end: 200 });

                zipCustomer = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" });

                //departamento = datos_customer.depa;
                //addr2 = datos_customer.distrito;
            }

            if (motivo == '04' || motivo == '02') {
                zipCustomer = zip;
            }

            var openRecord = record.load({ type: 'itemfulfillment', id: documentid, isDynamic: true });
            var linecount = openRecord.getLineCount({ sublistId: 'item' });
            var detalleItems = new Array;
            for (var i = 0; i < linecount; i++) {
                //var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                var codigo = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemname', line: i });
                var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                var unidades = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'unitsdisplay', line: i });
                var unit = getUnit(item);
                var description = DescriptionItem(item);
                detalleItems.push({
                    "ID": [
                        {
                            "_": i + 1
                        }
                    ],
                    "Note": [
                        {
                            "_": unidades
                        }
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
                        "_": observacion
                    }
                ],
                "LineCountNumeric": [
                    {
                        "_": linecount
                    }
                ],
                /*
                "AdditionalDocumentReference": [
                    {
                        "ID": [
                            {
                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_document_series_ref" }) + "-" + searchResultitemfulfillment[0].getValue({ name: "custbody_pe_document_number_ref" })
                            }
                        ],
                        "DocumentTypeCode": [
                            {
                                "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type_ref", label: "codigo" })
                            }
                        ],
                        "DocumentType": [
                            {
                                "_": searchResultitemfulfillment[0].getValue({ name: "name", join: "custbody_pe_document_type_ref", label: "name" })
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
                ],
                */
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
                                                "_": column21,
                                                "schemeID": column20
                                            }
                                        ]
                                    }
                                ],
                                "PostalAddress": [
                                    {
                                        "ID": [
                                            {
                                                "_": zipCustomer
                                            }
                                        ],
                                        "StreetName": [
                                            {
                                                "_": column23
                                            }
                                        ],
                                        "CitySubdivisionName": [
                                            {
                                                "_": "URBANIZACION"
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
                                        "Country": [
                                            {
                                                "IdentificationCode": [
                                                    {
                                                        "_": column28
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
                                                "_": column22
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
            var Shipment;
            if (modalidad == '02') {
                if (motivo == '04') {
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
                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_peso_tn" }),
                                        "unitCode": "TNE"
                                    }
                                ],

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
                                                        "schemeID": "1"
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
                                                "AddressTypeCode": [
                                                    {
                                                        "_": codigoDestino,
                                                        "listID": column21
                                                    }
                                                ],
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
                                                        "_": llegada[2]
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_delivery_address" })
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
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "llegada" })
                                                            }
                                                        ],
                                                        "AddressTypeCode": [
                                                            {
                                                                "_": codigoLlegada,
                                                                "listID": column21
                                                            }
                                                        ],
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
                                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" })
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
                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_peso_tn" }),
                                        "unitCode": "TNE"
                                    }
                                ],

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
                                                        "schemeID": "1"
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
                                                        "_": llegada[2]
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_delivery_address" })
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
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "llegada" })
                                                            }
                                                        ],
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
                                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" })
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
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]

                            }
                        ]
                    }
                }

            } else {
                if (motivo == '04') {

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
                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_peso_tn" }),
                                        "unitCode": "TNE"
                                    }
                                ],

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
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "name", join: "custbody_pe_delivery_information", label: "name" })
                                                            }
                                                        ],
                                                        "CompanyID": [
                                                            {
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_numero_de_registro_mtc" }),
                                                            }
                                                        ]
                                                    }
                                                ],
                                                "AgentParty": [
                                                    {
                                                        "PartyLegalEntity": [
                                                            {
                                                                "CompanyID": [
                                                                    {
                                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_autorizacion_principal" }),
                                                                        "schemeID": "06"
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
                                "Delivery": [
                                    {
                                        "DeliveryAddress": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_llegada", label: "llegada" })
                                                    }
                                                ],
                                                "AddressTypeCode": [
                                                    {
                                                        "_": codigoDestino,
                                                        "listID": column21
                                                    }
                                                ],
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
                                                        "_": llegada[2]
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_delivery_address" })
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
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "llegada" })
                                                            }
                                                        ],
                                                        "AddressTypeCode": [
                                                            {
                                                                "_": codigoLlegada,
                                                                "listID": column21
                                                            }
                                                        ],
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
                                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" })
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
                                                "DespatchParty": [
                                                    {
                                                        "AgentParty": [
                                                            {
                                                                "PartyLegalEntity": [
                                                                    {
                                                                        "CompanyID": [
                                                                            {
                                                                                "_": "NUMAUTORIREMIT123",
                                                                                "schemeID": "06"
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
                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_peso_tn" }),
                                        "unitCode": "TNE"
                                    }
                                ],

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
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "name", join: "custbody_pe_delivery_information", label: "name" })
                                                            }
                                                        ],
                                                        "CompanyID": [
                                                            {
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_numero_de_registro_mtc" }),
                                                            }
                                                        ]
                                                    }
                                                ],
                                                "AgentParty": [
                                                    {
                                                        "PartyLegalEntity": [
                                                            {
                                                                "CompanyID": [
                                                                    {
                                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_num_autorizacion_principal" }),
                                                                        "schemeID": "06"
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
                                "Delivery": [
                                    {
                                        "DeliveryAddress": [
                                            {
                                                "ID": [
                                                    {
                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_llegada", label: "llegada" })
                                                    }
                                                ],
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
                                                        "_": llegada[2]
                                                    }
                                                ],
                                                "AddressLine": [
                                                    {
                                                        "Line": [
                                                            {
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_delivery_address" })
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
                                                                "_": searchResultitemfulfillment[0].getValue({ name: "custrecord_pe_codigo", join: "custbody_pe_ubigeo_punto_partida", label: "llegada" })
                                                            }
                                                        ],
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
                                                                        "_": searchResultitemfulfillment[0].getValue({ name: "custbody_pe_source_address" })
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
                                                "DespatchParty": [
                                                    {
                                                        "AgentParty": [
                                                            {
                                                                "PartyLegalEntity": [
                                                                    {
                                                                        "CompanyID": [
                                                                            {
                                                                                "_": "NUMAUTORIREMIT123",
                                                                                "schemeID": "06"
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
                                ]

                            }
                        ]
                    }
                }

            }
            DespatchLine = {
                "DespatchLine": detalleItems
            }
            monnetJson = fusionarObjetos(monnetJson, Shipment);
            monnetJson = fusionarObjetos(monnetJson, DespatchLine);
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

        }
        function createRequestVendorCredit(documentid) {

            var searchLoad = search.create({
                type: "vendorcredit",
                filters:
                    [
                        ["internalid", "anyof", documentid],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns: [
                    // IDE----------
                    search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie_cxp}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),
                    search.createColumn({ name: "trandate", label: "2 Date" }),
                    search.createColumn({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type", label: "codigo" }),//2
                    search.createColumn({ name: "symbol", join: "Currency", label: "5 Symbol" }),//3
                    search.createColumn({ name: "otherrefnum", join: "createdFrom", label: "6 PO/Check Number" }),
                    // EMI--------------
                    search.createColumn({ name: "taxidnum", join: "subsidiary", label: "8 Tax ID" }),//5
                    search.createColumn({ name: "formulatext", formula: "{subsidiary.name}", label: "9 Trade Name" }),//6
                    search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }),//7
                    search.createColumn({ name: "address1", join: "location", label: "11 Address 1" }),
                    search.createColumn({ name: "address2", join: "location", label: "12 Address 2" }),
                    search.createColumn({ name: "address1", join: "subsidiary", label: "13 Address 1" }),

                    //search.createColumn({ name: "representingcustomer", join: "subsidiary", label: "Direccion" }),//11
                    search.createColumn({ name: "subsidiary", label: "Subsidiaria" }),//11
                    search.createColumn({ name: "entity" }),//12
                    search.createColumn({ name: "memo" }),//13
                    search.createColumn({ name: "address1", join: "subsidiary", label: "13 Address 1" })
                ]
            });
            var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
            var numeracion = searchResult[0].getValue(searchLoad.columns[0]);
            var fechaEmision = searchResult[0].getValue(searchLoad.columns[1]);
            fechaEmision = fechaEmision.split('/');
            fechaEmision = fechaEmision[2] + '-' + padLeft(fechaEmision[1], 2, '0') + '-' + padLeft(fechaEmision[0], 2, '0');
            var tipo_comprobante = searchResult[0].getValue(searchLoad.columns[2]);
            var moneda = searchResult[0].getValue(searchLoad.columns[3]);
            var memo = searchResult[0].getValue(searchLoad.columns[13]);

            var Emi_RUC = searchResult[0].getValue(searchLoad.columns[5]);
            //var Emi_NombreComercial = searchResult[0].getValue(searchLoad.columns[6]);
            var Emi_NombreComercial = searchResult[0].getValue(searchLoad.columns[7]);
            var Emi_RazonSocial = searchResult[0].getValue(searchLoad.columns[7]);
            //var CliRepre = searchResult[0].getValue(searchLoad.columns[11]);
            var idSubsi = searchResult[0].getValue(searchLoad.columns[11]);
            /*
            var customerRepresentante = record.load({
                type: 'customer',
                id: CliRepre
            });
            */
            var subsidiarySearchObj = search.create({
                type: "subsidiary",
                filters:
                    [
                        ["internalid", "anyof", idSubsi]
                    ],
                columns:
                    [
                        search.createColumn({ //0
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Nombre"
                        }),
                        search.createColumn({ name: "country", label: "País" }),//1
                        search.createColumn({//2
                            name: "country",
                            label: "País"
                        }),
                        search.createColumn({//3
                            name: "custrecord_pe_departamento",
                            join: "address",
                            label: "PE Departamento"
                        }),
                        search.createColumn({//4
                            name: "state",
                            join: "address",
                            label: " Estado"
                        }),
                        search.createColumn({//5
                            name: "custrecord_pe_distrito",
                            join: "address",
                            label: "PE Distrito"
                        }),
                        search.createColumn({//6
                            name: "address",
                            join: "address",
                            label: " Dirección"
                        }),
                        search.createColumn({//7
                            name: "custrecord_pe_cod_ubigeo",
                            join: "address",
                            label: "PE Cod Ubigeo"
                        })
                    ]
            });

            var searchResultsubsi = subsidiarySearchObj.run().getRange({ start: 0, end: 1 });


            var Emi_Pais = searchResultsubsi[0].getValue(subsidiarySearchObj.columns[2]);
            var Emi_Departamento = searchResultsubsi[0].getValue(subsidiarySearchObj.columns[3]);
            var Emi_Provincia = searchResultsubsi[0].getValue(subsidiarySearchObj.columns[4]);
            var Emi_Distrito = searchResultsubsi[0].getValue(subsidiarySearchObj.columns[5]);
            var Emi_Direccion = searchResultsubsi[0].getValue(subsidiarySearchObj.columns[6]);
            var Emi_Ubigeo = searchResultsubsi[0].getValue(subsidiarySearchObj.columns[7]);
            /*
            var Emi_Pais = Subsidia.getValue('address.');//PE
            var Emi_Departamento = Subsidia.getValue('billstate');
            var Emi_Provincia = Subsidia.getValue('billaddr2');
            var Emi_Distrito = Subsidia.getValue('billcity');//Lima
            var Emi_Direccion = Subsidia.getValue('billaddr1');//Av. Mexico 760
            var Emi_Ubigeo = Subsidia.getValue('billzip');
            */

            var Receptor = searchResult[0].getValue(searchLoad.columns[12]);

            var vendorSearchObj = search.create({
                type: "vendor",
                filters:
                    [
                        ["internalid", "anyof", Receptor]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custentity_pe_document_number", label: "PE Numero Documento Identidad" }),
                        search.createColumn({ name: "legalname", label: "Nombre legal" }),
                        search.createColumn({
                            name: "country",
                            join: "Address",
                            label: "País"
                        }),
                        search.createColumn({
                            name: "custrecord_pe_departamento",
                            join: "Address",
                            label: "PE Departamento"
                        }),
                        search.createColumn({
                            name: "state",
                            join: "Address",
                            label: "Estado/provincia"
                        }),
                        search.createColumn({
                            name: "custrecord_pe_distrito",
                            join: "Address",
                            label: "PE Distrito"
                        }),
                        search.createColumn({
                            name: "address1",
                            join: "Address",
                            label: "Dirección 1"
                        }),
                        search.createColumn({
                            name: "custrecord_pe_cod_ubigeo",
                            join: "Address",
                            label: "PE Cod Ubigeo"
                        })
                    ]
            });

            var Rec_RUC = '';
            var Rec_NombreComercial = '';
            var Rec_RazonSocial = '';
            var Rec_Pais = '';
            var Rec_Departamento = '';
            var Rec_Provincia = '';
            var Rec_Distrito = '';
            var Rec_Direccion = '';
            var Rec_Ubigeo = '';

            vendorSearchObj.run().each(function (result) {
                Rec_RUC = result.getValue(vendorSearchObj.columns[0]);
                Rec_NombreComercial = result.getValue(vendorSearchObj.columns[1]);
                Rec_RazonSocial = result.getValue(vendorSearchObj.columns[1]);
                Rec_Pais = result.getValue(vendorSearchObj.columns[2]);
                Rec_Departamento = result.getValue(vendorSearchObj.columns[3]);
                Rec_Provincia = result.getValue(vendorSearchObj.columns[4]);
                Rec_Distrito = result.getValue(vendorSearchObj.columns[5]);
                Rec_Direccion = result.getValue(vendorSearchObj.columns[6]);
                Rec_Ubigeo = result.getValue(vendorSearchObj.columns[7]);
                return true;
            });

            /*
            var ReceptorRecord = record.load({
                type: 'vendor',
                id: Receptor
            });
            var Rec_RUC = ReceptorRecord.getValue('custentity_pe_document_number');
            var Rec_NombreComercial = ReceptorRecord.getValue('legalname');
            //Rec_NombreComercial = 'Nombre Comercial'
            var Rec_RazonSocial = ReceptorRecord.getValue('legalname');
            var Rec_Pais = ReceptorRecord.getValue('billcountry');  //country
            var Rec_Departamento = ReceptorRecord.getValue('billcity'); //custrecord_pe_departamento
            var Rec_Provincia = ReceptorRecord.getValue('billaddr2'); //state
            var Rec_Distrito = ReceptorRecord.getValue('billstate'); //custrecord_pe_distrito
            var Rec_Direccion = ReceptorRecord.getValue('billaddr1');
            var Rec_Ubigeo = ReceptorRecord.getValue('billzip');//custrecord_pe_cod_ubigeo
            */

            // var TotalInvoiceAmount = 0.00
            // var SUNATTotalPaid = 0.00;

            // TotalInvoiceAmount = TotalInvoiceAmount.toFixed(2)+""
            // SUNATTotalPaid = SUNATTotalPaid.toFixed(2)+""

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
                        "PostalAddress": [
                            {
                                "ID": [
                                    {
                                        "_": Emi_Ubigeo
                                    }
                                ],
                                "StreetName": [
                                    {
                                        "_": Emi_Direccion
                                    }
                                ],
                                "CityName": [
                                    {
                                        "_": Emi_Provincia
                                    }
                                ],
                                "CountrySubentity": [
                                    {
                                        "_": Emi_Departamento
                                    }
                                ],
                                "District": [
                                    {
                                        "_": Emi_Distrito
                                    }
                                ],
                                "Country": [
                                    {
                                        "IdentificationCode": [
                                            {
                                                "_": Emi_Pais
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
                                        "schemeID": "6"
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
                    referencia.TotalInvoiceAmount = [
                        {
                            "_": ref_monto_total,
                            "currencyID": ref_moneda
                        }
                    ]

                    //!Documento de Pago
                    var vendorPaymentSearch = search.create({
                        type: 'vendorpayment',
                        filters: [['transactionnumber', 'is', doc_pago]],
                        columns: ['internalid', 'total', 'currency', 'trandate']
                    });
                    var Payment_ID = ""
                    // var Payment_PaidAmount = ""
                    var Payment_currencyID = ""
                    var Payment_PaidDate = ""
                    var searchResultsDocPago = vendorPaymentSearch.run().getRange({ start: 0, end: 1 });
                    if (searchResultsDocPago && searchResultsDocPago.length > 0) {
                        Payment_ID = searchResultsDocPago[0].getValue(vendorPaymentSearch.columns[0]);
                        Payment_currencyID = searchResultsDocPago[0].getValue(vendorPaymentSearch.columns[2]);
                        Payment_currencyID = record.load({ type: 'Currency', id: Payment_currencyID, isDynamic: true });
                        Payment_currencyID = Payment_currencyID.getValue('symbol');
                        Payment_PaidDate = searchResultsDocPago[0].getValue(vendorPaymentSearch.columns[3]).toString();
                        Payment_PaidDate = Payment_PaidDate.split('/')
                        Payment_PaidDate = Payment_PaidDate[2] + '-' + padLeft(Payment_PaidDate[1], 2, '0') + '-' + padLeft(Payment_PaidDate[0], 2, '0');

                        var openRecordVendPay = record.load({ type: 'vendorpayment', id: Payment_ID, isDynamic: true });
                        var applycountVendPay = openRecordVendPay.getLineCount({ sublistId: 'apply' });
                        for (var i = 0; i < applycountVendPay; i++) {
                            var apply_ = openRecordVendPay.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                            var doc_ = openRecordVendPay.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i });
                            if ((apply_ == 'T' || apply_ == true) && doc == doc_) {
                                amount_pag = openRecordVendPay.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: i });
                                total_pago_item = parseFloat(amount_ret) + parseFloat(amount_pag)
                                total_solo_pago += parseFloat(amount_pag)
                            }
                        }
                    }
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

        function createRequest(documentid) {


            var suma_descuentos_parciales = 0;

            var searchLoad = search.create({
                type: "transaction",
                filters:
                    [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["internalid", "anyof", documentid]
                    ],
                columns:
                    [
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),//0
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
                        search.createColumn({ name: "vatregnumber", join: "customer", label: "21 Tax Number" }), // name por cambiar campo 
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
                        search.createColumn({ name: "custrecord_pe_detraccion_account", join: "subsidiary", label: "numCuentaBcoNacionDetr" }),
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
                        search.createColumn({ name: "address2", join: "subsidiary", label: "address2" }),
                        search.createColumn({ name: "subsidiary" }),
                        search.createColumn({ name: "formulatext", formula: "CASE WHEN {custbody_pe_reason} = 'Aumento en el valor' THEN '02' WHEN {custbody_pe_reason} = 'Penalidades/ otros conceptos' THEN '03' WHEN {custbody_pe_reason} = 'Intereses por mora' THEN '01' END", label: "motivo" }),
                        search.createColumn({ name: "custbody_pe_reason_details" }),
                        search.createColumn({ name: "firstname", join: "customer" }),
                        search.createColumn({ name: "lastname", join: "customer" }),
                        search.createColumn({ name: "entity" }),
                        search.createColumn({ name: "name", join: "custbody_pe_concept_detraction" }),
                        search.createColumn({ name: "custrecord_pe_code_detraccion", join: "custbody_pe_concept_detraction" }),
                        search.createColumn({ name: "debitfxamount" }),
                        search.createColumn({ name: "memo" }),
                        search.createColumn({ name: "otherrefnum" }),
                        search.createColumn({ name: "internalid", join: "subsidiary" }),
                        search.createColumn({ name: "type", join: "createdFrom" }),
                        search.createColumn({ name: "internalid", join: "createdFrom" }),
                        search.createColumn({ name: "tranid", join: "createdFrom" }),

                    ]

            });
            var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });

            var tipoCreadoDesde = searchResult[0].getValue({ name: "type", join: "createdFrom" });
            var idCreadoDesde = searchResult[0].getValue({ name: "internalid", join: "createdFrom" });
            var numOV = searchResult[0].getValue({ name: "tranid", join: "createdFrom" });
            var numEjecucion = '';
            if (tipoCreadoDesde == 'SalesOrd' && idCreadoDesde) {
                var facturaVenta = record.load({
                    type: record.Type.SALES_ORDER, // Tipo de registro Vendor Credit 
                    id: idCreadoDesde, // Reemplaza con el ID de tu registro Vendor Credit
                    isDynamic: false
                });
                var linksCount = facturaVenta.getLineCount({ sublistId: 'links' });

                var fechaAnte = 0;

                for (var i = 0; i < linksCount; i++) {
                    var fech_Links = facturaVenta.getSublistValue({ sublistId: 'links', fieldId: 'trandate', line: i });
                    var tipo_Links = facturaVenta.getSublistValue({ sublistId: 'links', fieldId: 'type', line: i });
                    var num_Links = facturaVenta.getSublistValue({ sublistId: 'links', fieldId: 'tranid', line: i });

                    if (tipo_Links == 'Ejecución de orden de artículo') {
                        if (fechaAnte == 0) {
                            numEjecucion = num_Links;
                            fechaAnte = fech_Links;
                        } else {
                            if (fech_Links > fechaAnte) {
                                numEjecucion = num_Links;
                                fechaAnte = fech_Links;
                            }
                        }
                    }
                }
            }

            var valorneto = searchResult[0].getValue({ name: "debitfxamount" });
            var memo = searchResult[0].getValue({ name: "memo" });
            var CustomerInternal = searchResult[0].getValue({ name: "entity" });
            var otherrefnum = searchResult[0].getValue({ name: "otherrefnum" });
            var searchLoadCustomer = search.create({
                type: "customer",
                filters:
                    [

                        ["internalid", "anyof", CustomerInternal]
                    ],
                columns:
                    [
                        // IDE---------------------------------------------------------------------------------------------------------------------
                        search.createColumn({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" }),//0
                        search.createColumn({ name: "custrecord_pe_departamento", join: "Address", label: "PE Departamento" }),//0
                        search.createColumn({ name: "custrecord_pe_distrito", join: "Address", label: "PE Distrito" }),//0
                    ]
            })
            var searchResultCustomer = searchLoadCustomer.run().getRange({ start: 0, end: 200 });
            var tipodedoc = searchResult[0].getValue({ name: "custrecord_pe_cod_fact", join: "custbody_pe_ei_operation_type", label: "31 PE Cod Fact" });
            var zipCustomer = searchResultCustomer[0].getValue({ name: "custrecord_pe_cod_ubigeo", join: "Address", label: "PE Cod Ubigeo" });
            var depaCustomer = searchResultCustomer[0].getValue({ name: "custrecord_pe_departamento", join: "Address", label: "PE Departamento" });
            var distriCustomer = searchResultCustomer[0].getValue({ name: "custrecord_pe_distrito", join: "Address", label: "PE Distrito" });


            var nameDetraccion = searchResult[0].getValue({ name: "name", join: "custbody_pe_concept_detraction" });
            var codeDetraccion = searchResult[0].getValue({ name: "custrecord_pe_code_detraccion", join: "custbody_pe_concept_detraction" });

            // IDE---------------------------------------------------------------------------------------------------------------------

            var id_subsi = searchResult[0].getValue({ name: "internalid", join: "subsidiary" });


            var numeracion = searchResult[0].getValue(searchLoad.columns[0]);
            var zip = searchResult[0].getValue({ name: "zip", join: "subsidiary", label: "zip" });

            var departamento = searchResult[0].getValue({ name: "city", join: "subsidiary" });
            var contry = searchResult[0].getValue({ name: "country", join: "subsidiary", label: "country" });
            var addr2 = searchResult[0].getValue({ name: "address2", join: "subsidiary", label: "address2" });
            var reason = searchResult[0].getValue({ name: "custbody_pe_reason_details" });
            var reasoncodigo = searchResult[0].getValue({ name: "formulatext", label: "motivo" });
            // IMM:REFERENCIA

            if (id_subsi != null && id_subsi != '') {
                var datos_subsi = getSubsi(id_subsi);
                zip = datos_subsi.cod_ubi;
                departamento = datos_subsi.depa;
                addr2 = datos_subsi.distrito;
            }

            var ref_tipo_docs = searchResult[0].getValue({ name: "custbody_pe_document_type_ref" });
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

            var column05 = searchResult[0].getValue({ name: "symbol", join: "Currency" });
            var column06 = searchResult[0].getValue({ name: "otherrefnum", join: "createdFrom" });
            // EMI---------------------------------------------------------------------------------------------------------------------
            var column07 = searchResult[0].getValue(searchLoad.columns[6]);
            var column08 = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary" });
            var column09 = searchResult[0].getValue(searchLoad.columns[8]);
            var column10 = searchResult[0].getValue({ name: "legalname", join: "subsidiary" });
            var codubigeo = getUbigeo(searchResult[0].getValue({ name: "subsidiary" }));

            var column11 = searchResult[0].getValue({ name: "address1", join: "location" });
            var column12 = searchResult[0].getValue({ name: "address2", join: "location" });
            var column13 = searchResult[0].getValue({ name: "address1", join: "subsidiary" });
            var column14 = searchResult[0].getValue({ name: "state", join: "subsidiary" });
            var column15 = searchResult[0].getValue({ name: "address3", join: "subsidiary" });
            var column16 = searchResult[0].getValue({ name: "billcountrycode" });
            var column17 = searchResult[0].getValue({ name: "phone", join: "subsidiary" });
            var column18 = searchResult[0].getValue({ name: "email", join: "subsidiary" });
            var column19 = searchResult[0].getValue(searchLoad.columns[18]);
            // REC---------------------------------------------------------------------------------------------------------------------
            var column20 = searchResult[0].getValue(searchLoad.columns[19]);
            //var column21 = searchResult[0].getValue({ name: "vatregnumber", join: "customer" });
            var column22 = searchResult[0].getValue({ name: "companyname", join: "customer" });
            if (column20 == "1") {
                var column22 = searchResult[0].getValue({ name: "firstname", join: "customer" }) + ' ' + searchResult[0].getValue({ name: "lastname", join: "customer" });
            }
            var column21 = searchResult[0].getValue({ name: "vatregnumber", join: "customer" });

            var column23 = searchResult[0].getValue({ name: "address1", join: "customer" });
            var column25 = searchResult[0].getValue({ name: "city", join: "customer" });
            var column26 = searchResult[0].getValue({ name: "state", join: "customer" });
            var column27 = searchResult[0].getValue({ name: "address2", join: "customer" });
            var column28 = searchResult[0].getValue({ name: "country", join: "customer" });

            column25 = depaCustomer;
            column27 = distriCustomer;
            // CAB---------------------------------------------------------------------------------------------------------------------
            var column32 = searchResult[0].getValue({ name: "duedate" });
            if (column32 != '') {
                column32 = column32.split('/');
                column32 = column32[2] + '-' + padLeft(column32[1], 2, '0') + '-' + padLeft(column32[0], 2, '0');

            }
            // ADI---------------------------------------------------------------------------------------------------------------------
            var conceptDetr = searchResult[0].getText({ name: "custbody_pe_concept_detraction", label: "conceptDetr" });
            if (conceptDetr.length > 0) {
                conceptDetr = conceptDetr.split(' ')[0];
            }
            var montoDetr = 0;
            var suma = 0
            /* for (var i in searchResult) {
                 montoDetr = searchResult[i].getValue({ name: "custcol_4601_witaxamount", label: "montoDetr" });
                 logStatus(documentid, 'montoDetr: ' + i + ' - ' + montoDetr);
                 if (montoDetr.length > 0) {
                     suma += parseFloat(montoDetr)
                     break;
                 }
             }
             montoDetr = suma.toFixed(2);*/
            var medioPagoDetr = 'Depósito en cuenta';
            var porcentajeDetr = searchResult[0].getValue({ name: "custbody_pe_percentage_detraccion", label: "porcentajeDetr" });

            porcentajeDetr = porcentajeDetr.replace(/%/g, '');


            var tipoCambio = searchResult[0].getValue({ name: "exchangerate", label: "Exchange Rate" });


            // FREE--------------------------------------------------------------------------------------------------------------------
            var column43 = searchResult[0].getValue({ name: "custbody_pe_free_operation" });

            //*********************************** CONSTRUCCION DE TRAMA ***************************************/
            var nmro_documento = '';
            var razon_social = '';
            var direccion_cliente = '';

            nmro_documento = column21;
            razon_social = column22;
            direccion_cliente = column23;
            var detail = getDetail(documentid, column43 /*objPromocion*/);

            var grav = detail.gravadas;

            montoDetr = detail.montoDetracion;

            //montoDetr = detail.montoDetracion;
            var montoLetras = detail.importetotal;
            var totalVentas;
            var TaxAmount = 0;
            var TaxScheme = 0;
            var taxcheme;
            var TaxTypeCode = 'VAT';
            if (grav != 'Vacio') {
                totalVentas = grav.totalVentas;
                TaxAmount = detail.totalimpuestosgra[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosgra[0].idImpuesto;
                taxcheme = 'IGV';
            }
            var exo = detail.exoneradas;
            if (exo != 'Vacio') {
                totalVentas = exo.totalVentas;
                TaxAmount = detail.totalimpuestosexo[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosexo[0].idImpuesto;
                taxcheme = 'EXO';
            }
            var ina = detail.inafectas;
            if (ina != 'Vacio') {
                totalVentas = ina.totalVentas;
                TaxAmount = detail.totalimpuestosina[0].montoImpuesto;
                TaxScheme = detail.totalimpuestosina[0].idImpuesto;
                taxcheme = 'INA';
                TaxTypeCode = 'FRE'
            }
            var exp = detail.exportacion;
            if (exp != 'Vacio') {
                totalVentas = exp.totalVentas;
                TaxAmount = detail.totalimpuestoiExport[0].montoImpuesto;
                TaxScheme = detail.totalimpuestoiExport[0].idImpuesto;
                taxcheme = 'EXP';
                TaxTypeCode = 'FRE'
            }

            if (column43 == true) {
                taxcheme = 'GRA';
                TaxTypeCode = 'FRE'
            }


            var detalleItems = new Array;
            var totalImpuertos = 0;
            var valordeventaunitario = 0;
            for (var i = 0; i < detail.det.length; i++) {
                totalImpuertos = totalImpuertos + parseFloat(detail.det[i].totalImpuestos[0].montoImpuesto);
                valordeventaunitario = parseFloat(detail.det[i].valorVenta) / parseFloat(detail.det[i].cantidadItems)
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
                    ],
                    "PricingReference": [
                        {
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
                                            "_": column43 == true ? "02" : "01",
                                            "listName": "Tipo de Precio",
                                            "listAgencyName": "PE:SUNAT",
                                            "listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });

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
                ],
                    detalleItems[i].Item = [
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
                    detalleItems[i].Price = [
                        {
                            "PriceAmount": [
                                {
                                    "_": column43 == true ? "0.00" : detail.det[i].valorUnitario,
                                    "currencyID": column05
                                }
                            ]
                        }
                    ]

            }
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

            if (column05 == 'PEN') {
                var monto_Detracion = (montoDetr * tipoCambio).toFixed(2).toString();
            } else {
                var monto_Detracion = Math.round((montoDetr * tipoCambio).toFixed(2)).toString();
            }

            var note = {
                "Note": [
                    {
                        "_": monto,
                        "languageLocaleID": "1000"
                    },
                    {
                        "_": memo
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
            if (column43 == true) {
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
                                        "_": ref_tipo_docs == '103' ? '01' : '03',
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
                                                "_": "ercrguro@gmail.com"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }

            //IMorales 20231012
            if (codTipoDocumento == FACTURA || codTipoDocumento == BOLETA) {
                if (discounttotal > 0) {
                    asignature.AllowanceCharge = [
                        {
                            "ChargeIndicator": [
                                {
                                    "_": "false"
                                }
                            ],
                            "AllowanceChargeReasonCode": [
                                {
                                    "_": "02",
                                    "listAgencyName": "PE:SUNAT",
                                    "listName": "Cargo/descuento",
                                    "listSchemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo53"
                                }
                            ],
                            "Amount": [
                                {
                                    "_": discounttotal,
                                    "currencyID": column05
                                }
                            ]
                        }
                    ]
                }
            }

            asignature.TaxTotal = [
                {
                    "TaxAmount": [
                        {
                            "_": column43 == true ? '0.00' : detail.montototalimpuestos.toString(),
                            "currencyID": column05
                        }
                    ],
                    "TaxSubtotal": [
                        {
                            "TaxableAmount": [
                                {
                                    // "_": totalVentas,
                                    "_": (discounttotal > 0) ? estgrossprofit : totalVentas,//IMorales 20231012
                                    "currencyID": column05
                                }
                            ],
                            "TaxAmount": [
                                {
                                    // "_": totalImpuertos.toString(),
                                    "_": (discounttotal > 0) ? taxtotal_invoice : totalImpuertos.toString(),//IMorales 20231012
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
                                                "_": "ercrguro@gmail.com"
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
                                        "_": "122191"
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
                                "_": monto_Detracion,
                                "currencyID": "PEN"
                            }
                        ]
                    }
                ],
                "TaxTotal": [
                    {
                        "TaxAmount": [
                            {
                                "_": column43 == true ? '0.00' : detail.montototalimpuestos.toString(),
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
                                        "_": totalImpuertos.toString(),
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

            if (otherrefnum != null && otherrefnum != '') {
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
            } else {
                if (numOV != null && numOV != '') {
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
                                        "_": numOV
                                    }
                                ]
                            }
                        ],
                    }
                } else {
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
                        ]
                    }
                }
            }

            if (tipoCreadoDesde == 'SalesOrd' && idCreadoDesde != null && idCreadoDesde != '') {
                var DespatchDocumentReference = {
                    "DespatchDocumentReference": [
                        {
                            "ID": [
                                {
                                    "_": numEjecucion
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
                        }
                    ]
                }
            }

            var monnetJson;
            if (codTipoDocumento == FACTURA || codTipoDocumento == BOLETA) {
                primeraParte = fusionarObjetos(primeraParte, duedate);
                primeraParte = fusionarObjetos(primeraParte, InvoiceTypeCode);
                primeraParte = fusionarObjetos(primeraParte, note);
                primeraParte = fusionarObjetos(primeraParte, DocumentCurrencyCode);
                if (tipoCreadoDesde == 'SalesOrd' && idCreadoDesde != null && idCreadoDesde != '') {
                    primeraParte = fusionarObjetos(primeraParte, DespatchDocumentReference);
                }

                if (detail.applywh == true) {
                    primeraParte = fusionarObjetos(primeraParte, PaymentMeans);

                    var ultimaParte = {
                        "LegalMonetaryTotal": [
                            {
                                "LineExtensionAmount": [
                                    {
                                        "_": column43 == true ? '0.00' : totalVentas,
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
                    var ultimaParte = {
                        "LegalMonetaryTotal": [
                            {
                                "LineExtensionAmount": [
                                    {
                                        // "_": column43 == true ? '0.00' : totalVentas,
                                        "_": (discounttotal > 0) ? estgrossprofit : (column43 == true ? '0.00' : totalVentas),//IMorales 20231012
                                        "currencyID": column05
                                    }
                                ],
                                "TaxInclusiveAmount": [
                                    {
                                        "_": column43 == true ? '0.00' : detail.importetotal.toString(),
                                        "currencyID": column05
                                    }
                                ],
                                "PayableAmount": [
                                    {
                                        "_": column43 == true ? '0.00' : detail.importetotal.toString(),
                                        "currencyID": column05
                                    }
                                ]
                            }
                        ],
                        "InvoiceLine": detalleItems
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
                var detallenotaDEbito = new Array();
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

            // column05 = 'PEN' //TODO: Arreglar ===============



            var filename = column08 + '-' + codTipoDocumento + '-' + numeracion;
            var ticket = codTipoDocumento + '-' + numeracion




            monnetJson = JSON.stringify(monnetJson);

            var filejson = generateFileJSON(filename, monnetJson);
            var filejson = file.load({ id: filejson });

            setRecord(codTipoDocumento, documentid, ticket, /*urlpdf, urlxml, urlcdr,*/ filejson.id /*encodepdf, array*/)
            return 'Transacción ' + ticket + ' generada ' + ' - ' + detail.applywh;

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
        function getDetail(documentid, freeop /*_objPromocion*/) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExportacion = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonTotalImpuestoICBPER = new Array();
            var jsonTotalImpuestoEXPORT = new Array();
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
            var summontoImpuestoEXPORT = 0.0;
            var montoDetracion = 0;
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
            var applyDetr = false;

            try {
                var openRecord = '';
                openRecord = record.load({ type: record.Type.INVOICE, id: documentid, isDynamic: true });

                var total = openRecord.getValue({ fieldId: 'total' });
                var taxtotal = openRecord.getValue({ fieldId: 'taxtotal' });
                var codcustomer = openRecord.getText({ fieldId: 'entity' });
                codcustomer = codcustomer.split(' ');
                codcustomer = codcustomer[0];
                var linecount = openRecord.getLineCount({ sublistId: 'item' });
                //logStatus(documentid, linecount);
                // SE AGREGARON PARA LOS CASOS DE PROMOCIONES GLOBALES
                var subtotal_global_prom = openRecord.getValue({ fieldId: 'subtotal' });
                var taxcode_display_prom = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: 0 });
                var codigocargodescuento_prom = taxcode_display_prom == TAX_CODE_GRAVADA ? "02" : "03";

                //Inicio for
                for (var i = 0; i < linecount; i++) {
                    var jsonTotalImpuestos = new Array();
                    var jsonCargoDescuentoLines = new Array();
                    var precioVentaUnitario = 0.0;
                    var idimpuesto = '';
                    var codigo = '';
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


                    var item_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
                    var item_id = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var itemSearchObj = search.create({
                        type: "item",
                        filters:
                            [
                                ["internalid", "anyof", item_id]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "formulatext",
                                    formula: "{itemid}",
                                    label: "Fórmula (texto)"
                                })
                            ]
                    });
                    var searchResultCount = itemSearchObj.runPaged().count;
                    if (searchResultCount != 0) {
                        const searchResult = itemSearchObj.run().getRange({ start: 0, end: 1 });
                        item_display = searchResult[0].getValue(itemSearchObj.columns[0]);
                    }
                    // item_display = item_display.split(' ');
                    // item_display = item_display[0];
                    //logStatus(documentid, item_display);
                    var is_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: i });
                    var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                    var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var unit = getUnit(item);

                    var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                    var rateopfree = rate;

                    var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                    var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                    var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                    var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
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

                    //logStatus(documentid, 'Entré a DESCUENTO: ' + taxcode_display);
                    if (itemtype == 'Discount') {
                        montoDetracionValor = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                        montoDetracion = montoDetracion + (montoDetracionValor * -1);
                    }
                    if (itemtype == 'InvtPart' || itemtype == 'Service' || itemtype == 'NonInvtPart') {
                        precioVentaUnitario = (rate + (rate * (taxrate1 / 100)));
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


                            } else {
                                idimpuesto = '1000'; // Igv impuesto general a las ventas
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
                                tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                sumtotalVentasGRA += amount;
                                summontoImpuestoGRA += montoimpuesto;
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
                                jsonTotalImpuestosGRA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoGRA.toFixed(2)
                                });
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


                            } else {
                                idimpuesto = '9997'; //Exonerado
                                codigo = '1003'; // Total valor de venta - operaciones exoneradas
                                tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                                sumtotalVentasEXO += amount;
                                summontoImpuestoEXO += montoimpuesto;
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

                            jsonTotalImpuestosEXO.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoEXO.toFixed(2)
                            });
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


                            } else {
                                idimpuesto = '9998'; // Inafecto
                                codigo = '1002'; // Total valor de venta - operaciones inafectas
                                tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                                sumtotalVentasINA += amount;
                                summontoImpuestoINA += montoimpuesto;
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
                            jsonTotalImpuestosINA.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoINA.toFixed(2)
                            });
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
                                montoImpuesto: summontoImpuestoEXPORT.toFixed(2)
                            });
                        }

                        //logStatus(documentid, precioVentaUnitario);
                        if (anydiscountline == 'any') {
                            var rate_discount_line = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i + 1 }));
                            var amount_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i + 1 });
                            var tax1amt_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i + 1 });

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
                                    totalVentas: sumtotalVentasGRA
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
                                    totalVentas: sumtotalVentasEXO.toFixed(2)
                                }
                            } else if (taxcode_display == TAX_CODE_INAFECTA) {
                                indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                                codigocargocescuento = '00'; // Descuentos que no afectan la base imponible del IGV
                                sumtotalVentasINA -= amount_discount_line;
                                jsonInafectas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasINA.toFixed(2)
                                }
                            }

                            jsonCargoDescuentoLines.push({
                                indicadorCargoDescuento: indicadorcargodescuento,
                                codigoCargoDescuento: codigocargocescuento,
                                factorCargoDescuento: factorcargodescuento.toString(),
                                montoCargoDescuento: amount_discount_line.toFixed(2),
                                montoBaseCargoDescuento: montobasecargodscto.toString()
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
                        if (itemtype == 'NonInvtPart' || isicbp == true) {
                            //logStatus(documentid, 'Entré a ICBP: ' + isicbp);
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
                        }

                        if (unit == "") {
                            unit = "NIU"//IMorales 20230814
                        }
                        if (freeop == true) {
                            log.debug('MSK', 'description 1: ' + description)
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                //cantidadItems: '1',
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toFixed(2).toString(),
                                valorRefOpOnerosas: rateopfree.toFixed(2).toString(),
                                montoTotalImpuestos: '0.00'
                            });
                        } else if (anydiscountline == 'any') {
                            log.debug('MSK', 'description 2: ' + description)
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                                cargoDescuento: jsonCargoDescuentoLines,
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toFixed(2).toString(),
                                montoTotalImpuestos: parseFloat(tax1amt).toFixed(2)
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
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toFixed(2).toString(),
                                montoTotalImpuestos: tax1amt.toString()
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
                    totalimpuestosgra: jsonTotalImpuestosGRA,
                    totalimpuestosina: jsonTotalImpuestosINA,
                    totalimpuestosexo: jsonTotalImpuestosEXO,
                    totalimpuestoicbper: jsonTotalImpuestoICBPER,
                    totalimpuestoiExport: jsonTotalImpuestoEXPORT,
                    importetotal: total.toFixed(2),
                    montototalimpuestos: taxtotal.toFixed(2),
                    codigocliente: codcustomer,
                    anydiscoutnigv: anydiscoutnigv,
                    applywh: applyDetr,
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
            } catch (error) {
                //logError(array[0], array[1], 'Error-getDetail', JSON.stringify(e));
                return error;
            }
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
            try {

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
                            // search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "condPagoADI" }),
                            // search.createColumn({ name: "location", label: "moduloADI" }),
                            // search.createColumn({ name: "custbody_pe_delivery_address", join: "createdFrom", label: "dirDestinoADI" }),
                            // search.createColumn({ name: "custbody_pe_car_plate", join: "createdFrom", label: "placaVehicADI" }),
                            // search.createColumn({ name: "custbody_pe_ruc_empresa_transporte", join: "createdFrom", label: "rucTransportistaADI" }),
                        ]
                });

                var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                //?FORMULAS ======================================================================================================================================================
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column28 = searchResult[0].getValue({ name: "country", join: "customer" });
                var column23 = searchResult[0].getValue({ name: "address1", join: "customer" });
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
                fechaVencADI = fechaVencADI.split('/');
                fechaVencADI = fechaVencADI[2] + '-' + padLeft(fechaVencADI[1], 2, '0') + '-' + padLeft(fechaVencADI[0], 2, '0');

                // var condPagoADI = searchResult[0].getText({ name: "custbody_pe_ei_forma_pago", label: "condPagoADI" });
                // var moduloADI = searchResult[0].getText({ name: "location", label: "moduloADI" });
                // var dirDestinoADI = searchResult[0].getValue({ name: "custbody_pe_delivery_address", join: "createdFrom", label: "dirDestinoADI" });
                // var placaVehicADI = searchResult[0].getValue({ name: "custbody_pe_car_plate", join: "createdFrom", label: "placaVehicADI" });
                // var rucTransportistaADI = searchResult[0].getValue({ name: "custbody_pe_ruc_empresa_transporte", join: "createdFrom", label: "rucTransportistaADI" });
                var detail = getDetailCreditMemo(documentid, column43);

                var monto = '';
                if (tipoMoneda == 'PEN') {
                    monto = NumeroALetras(detail.importetotal, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
                } else {
                    monto = NumeroALetrasDolar(detail.importetotal, { plural: 'DOLARES AMERICANOS', singular: 'DOLAR AMERICANO', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                }
                jsonLeyenda = [
                    {
                        codigo: "1000",
                        descripcion: monto
                    }
                ]
                var totalVentas = 0;
                var TaxAmount = 0;
                var TaxScheme = 0;

                var taxcheme;
                var grav = detail.gravadas;
                var TaxTypeCode = 'VAT';
                if (grav != 'Vacio') {
                    totalVentas = grav.totalVentas;
                    TaxAmount = detail.totalimpuestosgra[0].montoImpuesto;
                    TaxScheme = detail.totalimpuestosgra[0].idImpuesto;
                    taxcheme = 'IGV';
                }
                var exo = detail.exoneradas;
                if (exo != 'Vacio') {
                    totalVentas = exo.totalVentas;
                    TaxAmount = detail.totalimpuestosexo[0].montoImpuesto;
                    TaxScheme = detail.totalimpuestosexo[0].idImpuesto;
                    taxcheme = 'EXO';
                }
                var ina = detail.inafectas;
                if (ina != 'Vacio') {
                    totalVentas = ina.totalVentas;
                    TaxAmount = detail.totalimpuestosina[0].montoImpuesto;
                    TaxScheme = detail.totalimpuestosina[0].idImpuesto;
                    taxcheme = 'INA';
                    TaxTypeCode = 'FRE'
                }
                var exp = detail.exportacion;
                if (exp != 'Vacio') {
                    totalVentas = exp.totalVentas;
                    TaxAmount = detail.totalimpuestoiExport[0].montoImpuesto;
                    TaxScheme = detail.totalimpuestoiExport[0].idImpuesto;
                    taxcheme = 'EXP';
                    TaxTypeCode = 'FRE'
                }



                if (column43 == true) {
                    taxcheme = 'GRA';
                    TaxTypeCode = 'FRE'
                }
                var detalleItems = new Array;
                var totalImpuertos = 0;
                var Monnetjson;



                for (var i = 0; i < detail.det.length; i++) {
                    totalImpuertos = totalImpuertos + parseFloat(detail.det[i].totalImpuestos[0].montoImpuesto);
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
                        "PricingReference": [
                            {
                                "AlternativeConditionPrice": [
                                    {
                                        "PriceAmount": [
                                            {
                                                "_": parseFloat(detail.det[i].valorUnitario).toFixed(2).toString(),
                                                "currencyID": tipoMoneda
                                            }
                                        ],
                                        "PriceTypeCode": [
                                            {
                                                "_": column43 == true ? "02" : "01",
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
                                        "_": column43 == true ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto,
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
                                                "_": column43 == true ? "0.00" : detail.det[i].totalImpuestos[0].montoImpuesto,
                                                "currencyID": tipoMoneda
                                            }
                                        ],
                                        "TaxCategory": [
                                            {
                                                "Percent": [
                                                    {
                                                        "_": column43 == true ? 0.00 : detail.det[i].totalImpuestos[0].porcentaje
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
                                        "_": column43 == true ? "0.00" : (parseFloat(detail.det[i].valorVenta) / parseFloat(detail.det[i].cantidadItems)).toFixed(2).toString(),
                                        "currencyID": tipoMoneda
                                    }
                                ]
                            }
                        ]
                    });

                }
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
                                },
                                {
                                    "_": "OBSERVACIONES GENERALES"
                                }
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
                                                            "_": numeroDocIdREC,
                                                            "schemeID": tipoDocIdREC,
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
                                                            "_": razonSocialREC
                                                        }
                                                    ]
                                                }
                                            ],
                                            "PartyLegalEntity": [
                                                {
                                                    "RegistrationName": [
                                                        {
                                                            "_": razonSocialREC
                                                        }
                                                    ],
                                                    "RegistrationAddress": [
                                                        {
                                                            "ID": [
                                                                {
                                                                    "_": "",
                                                                    "schemeAgencyName": "PE:INEI",
                                                                    "schemeName": "Ubigeos"
                                                                }
                                                            ],
                                                            "CityName": [
                                                                {
                                                                    "_": departamentoREC
                                                                }
                                                            ],
                                                            "CountrySubentity": [
                                                                {
                                                                    "_": provinciaREC
                                                                }
                                                            ],
                                                            "District": [
                                                                {
                                                                    "_": distritoREC
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
                                    "TaxSubtotal": [
                                        {
                                            "TaxableAmount": [
                                                {
                                                    "_": parseFloat(totalVentas).toFixed(2).toString(),
                                                    "currencyID": tipoMoneda
                                                }
                                            ],
                                            "TaxAmount": [
                                                {
                                                    "_": column43 == true ? "0.00" : totalImpuertos.toFixed(2).toString(),
                                                    "currencyID": tipoMoneda
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

                var filename = numeroDocId + '-' + codTipoDocumento + '-' + numeracion;
                Monnetjson = JSON.stringify(Monnetjson);


                var ticket = codTipoDocumento + '-' + numeracion
                var filejson = generateFileJSON(filename, Monnetjson);
                var filejson = file.load({ id: filejson });

                setRecord(codTipoDocumento, documentid, ticket, /*urlpdf, urlxml, urlcdr,*/ filejson.id /*encodepdf, array*/)
                return 'Transacción ' + ticket + ' generada ' + ' - JSON: ' + filejson.id;
            } catch (error) {
                //logError(array[0], array[1], 'Error-createRequestCreditMemo', JSON.stringify(e));
                return error;
            }
        }


        function getDetailCreditMemo(documentid, freeop) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExportacion = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonTotalImpuestoEXPORT = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
            var sumtotalVentasEXPORT = 0.0;
            var summontoImpuestoEXPORT = 0.0;
            var anydiscount = false;
            var factorcargodescuento = 0.0;


            try {
                var openRecord = record.load({ type: record.Type.CREDIT_MEMO, id: documentid, isDynamic: true });
                var total = openRecord.getValue({ fieldId: 'total' });
                var taxtotal = openRecord.getValue({ fieldId: 'taxtotal' });
                var codcustomer = openRecord.getText({ fieldId: 'entity' });
                codcustomer = codcustomer.split(' ');
                codcustomer = codcustomer[0];
                var linecount = openRecord.getLineCount({ sublistId: 'item' });
                for (var h = 0; h < linecount; h++) {
                    var itype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: h });
                    if (itype == 'Discount') {
                        var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: h }));
                        rate = rate.toString().replace('-', '').replace('%', '');
                        factorcargodescuento = rate / 100
                        round = factorcargodescuento.toString().split('.');
                        factorcargodescuento = round[1].length > 5 ? factorcargodescuento.toFixed(5) : factorcargodescuento
                        factorcargodescuento = parseFloat(factorcargodescuento)
                        anydiscount = true;
                        break;
                    }
                }

                if (anydiscount == false) {
                    for (var i = 0; i < linecount; i++) {
                        var jsonTotalImpuestos = new Array();
                        var precioVentaUnitario = 0.0;
                        var idimpuesto = '';
                        var codigo = '';
                        var tipoAfectacion = '';
                        var round = 0.0;

                        var item_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
                        item_display = item_display.split(' ');
                        item_display = item_display[0];
                        var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                        var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        var unit = getUnit(item);
                        var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                        var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                        var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                        var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                        var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                        var tax1amt = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                        var montoimpuesto = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                        if (unit == "") {
                            unit = "NIU"//IMorales 20230814
                        }
                        if (itemtype == 'InvtPart' || itemtype == 'Service') {
                            precioVentaUnitario = (rate + (rate * (taxrate1 / 100)));
                            round = precioVentaUnitario.toString().split('.');
                            if (typeof round[1] != 'undefined') {
                                precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(2) : precioVentaUnitario;
                            }
                            if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
                                if (freeop == true) {
                                    idimpuesto = '9996'; // Gratuito
                                    codigo = '1004'; // Total valor de venta – Operaciones gratuitas
                                    tipoAfectacion = '31'; // Gravado – Retiro por premio
                                    sumtotalVentasGRA += amount;
                                    summontoImpuestoGRA += montoimpuesto;
                                    jsonGravadas = {
                                        codigo: codigo,
                                        totalVentas: sumtotalVentasGRA
                                    }


                                } else {
                                    idimpuesto = '1000'; // Igv impuesto general a las ventas
                                    codigo = '1001'; // Total valor de venta - operaciones gravadas
                                    tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                    sumtotalVentasGRA += amount;
                                    summontoImpuestoGRA += montoimpuesto;
                                    jsonGravadas = {
                                        codigo: codigo,
                                        totalVentas: sumtotalVentasGRA.toFixed(2)
                                    }
                                }

                                jsonTotalImpuestosGRA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoGRA.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:E-PE') { // EXONERADAS
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


                                } else {
                                    idimpuesto = '9997'; // Exonerado
                                    codigo = '1003'; // Total valor de venta - operaciones exoneradas
                                    tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                                    sumtotalVentasEXO += amount;
                                    summontoImpuestoEXO += montoimpuesto;
                                    jsonExoneradas = {
                                        codigo: codigo,
                                        totalVentas: sumtotalVentasEXO.toFixed(2)
                                    }
                                }

                                jsonTotalImpuestosEXO.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoEXO.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:Inaf-PE') {
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


                                } else {
                                    idimpuesto = '9998'; //Inafecto
                                    codigo = '1002'; // Total valor de venta - operaciones inafectas
                                    tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                                    sumtotalVentasINA += amount;
                                    summontoImpuestoINA += montoimpuesto;
                                    jsonInafectas = {
                                        codigo: codigo,
                                        totalVentas: sumtotalVentasINA.toFixed(2)
                                    }
                                }

                                jsonTotalImpuestosINA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoINA.toFixed(2)
                                });
                            } else if (taxcode_display == 'IGV_PE:X-PE') { // exportacion
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
                                    montoImpuesto: summontoImpuestoEXPORT.toFixed(2)
                                });
                            }

                            jsonTotalImpuestos.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: tax1amt.toString(),
                                tipoAfectacion: tipoAfectacion,
                                montoBase: amount.toFixed(2).toString(),
                                porcentaje: taxrate1.toString()
                            });

                            log.debug('MSK', 'description 4: ' + description)
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: parseFloat(precioVentaUnitario).toFixed(2).toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toFixed(2).toString(),
                                montoTotalImpuestos: tax1amt.toString()
                            });
                        }
                    }

                    jsonReturn = {
                        det: json,
                        gravadas: jsonGravadas,
                        inafectas: jsonInafectas,
                        exoneradas: jsonExoneradas,
                        exportacion: jsonExportacion,
                        totalimpuestosgra: jsonTotalImpuestosGRA,
                        totalimpuestosina: jsonTotalImpuestosINA,
                        totalimpuestosexo: jsonTotalImpuestosEXO,
                        totalimpuestoiExport: jsonTotalImpuestoEXPORT,
                        importetotal: total,
                        montototalimpuestos: taxtotal.toString(),
                        codigocliente: codcustomer
                    }
                    return jsonReturn;
                } else {
                    for (var i = 0; i < linecount; i++) {
                        var jsonTotalImpuestos = new Array();
                        var precioVentaUnitario = 0.0;
                        var idimpuesto = '';
                        var codigo = '';
                        var tipoAfectacion = '';
                        var round = 0.0;
                        var round2 = 0.0;
                        var valorunitario = 0.0;
                        var montototalimpuestos = 0.0;
                        var precioventaunitario = 0.0

                        var item_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
                        item_display = item_display.split(' ');
                        item_display = item_display[0];
                        var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                        var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        var unit = getUnit(item);
                        var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                        var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                        var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                        var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                        var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                        var tax1amt = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                        var montoimpuesto = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));

                        if (itemtype == 'InvtPart' || itemtype == 'Service') {
                            //GLOBAL
                            valorunitario = rate - (rate * factorcargodescuento);
                            montototalimpuestos = valorunitario * (taxrate1 / 100);
                            round = valorunitario.toString().split('.');
                            if (typeof round[1] != 'undefined') {
                                valorunitario = round[1].length > 7 ? valorunitario.toFixed(7) : valorunitario;
                            }

                            precioventaunitario = parseFloat(valorunitario + montototalimpuestos);
                            round2 = precioventaunitario.toString().split('.');
                            if (typeof round2[1] != 'undefined') {
                                precioventaunitario = round2[1].length > 7 ? precioventaunitario.toFixed(7) : precioventaunitario;
                            }

                            // ====================================================================================================================
                            if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
                                idimpuesto = '1000'; // Igv impuesto general a las ventas
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
                                tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                sumtotalVentasGRA += amount - (amount * factorcargodescuento);
                                summontoImpuestoGRA += (montototalimpuestos * quantity);
                                jsonGravadas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasGRA.toFixed(2)
                                }
                                jsonTotalImpuestosGRA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoGRA.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:E-PE') { // EXONERADAS
                                idimpuesto = '9997'; // Exonerado
                                codigo = '1003'; // Total valor de venta - operaciones exoneradas
                                tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                                sumtotalVentasEXO += amount - (amount * factorcargodescuento);
                                summontoImpuestoEXO += montoimpuesto;
                                jsonExoneradas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasEXO.toFixed(2)
                                }
                                jsonTotalImpuestosEXO.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoEXO.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:Inaf-PE') { // INAFECTAS
                                idimpuesto = '9998'; //Inafecto
                                codigo = '1002'; // Total valor de venta - operaciones inafectas
                                tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                                sumtotalVentasINA += amount - (amount * factorcargodescuento);
                                summontoImpuestoINA += montoimpuesto;
                                jsonInafectas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasINA.toFixed(2)
                                }
                                jsonTotalImpuestosINA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoINA.toFixed(2)
                                });
                            }

                            jsonTotalImpuestos.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: (montototalimpuestos * quantity).toFixed(2),
                                tipoAfectacion: tipoAfectacion,
                                montoBase: (amount - (amount * factorcargodescuento)).toFixed(2),
                                porcentaje: taxrate1.toString()
                            });

                            log.debug('MSK', 'description 5: ' + description)
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: valorunitario.toString(),
                                precioVentaUnitario: precioventaunitario.toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: (amount - (amount * factorcargodescuento)).toFixed(2),
                                montoTotalImpuestos: (montototalimpuestos * quantity).toFixed(2)
                            });


                        }
                    }

                    jsonReturn = {
                        det: json,
                        gravadas: jsonGravadas,
                        inafectas: jsonInafectas,
                        exoneradas: jsonExoneradas,
                        totalimpuestosgra: jsonTotalImpuestosGRA,
                        totalimpuestosina: jsonTotalImpuestosINA,
                        totalimpuestosexo: jsonTotalImpuestosEXO,
                        importetotal: total,
                        montototalimpuestos: summontoImpuestoGRA.toFixed(2),
                        codigocliente: codcustomer
                    }
                    return jsonReturn;
                }
            } catch (error) {
                //logError(array[0], array[1], 'Error-getDetailCreditMemo', JSON.stringify(e));
                logStatus(documentid, error);
            }
        }
        //!============================================================================================================================================

        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_pe_ei_document_status' });
                logStatus.setValue('custrecord_pe_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status', docstatus);
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

        function DescriptionItem(itemid) {
            var descripcion = '';
            try {
                var getdesc = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemid,
                    columns: ['salesdescription']
                });
                var descripcion = getdesc.salesdescription;
                return descripcion;
            } catch (e) {
                log.debug('MSK', 'error: ' + e)
            }
        }

        function getSubsi(id_subsi) {
            try {
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                        [
                            ["internalid", "anyof", id_subsi]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "country", label: "País" }),
                            search.createColumn({
                                name: "custrecord_pe_departamento",
                                join: "address",
                                label: "PE Departamento"
                            }),
                            search.createColumn({
                                name: "custrecord_pe_distrito",
                                join: "address",
                                label: "PE Distrito"
                            }),
                            search.createColumn({
                                name: "address",
                                join: "address",
                                label: " Dirección"
                            }),
                            search.createColumn({
                                name: "custrecord_pe_cod_ubigeo",
                                join: "address",
                                label: "PE Cod Ubigeo"
                            })
                        ]
                });
                var searchResult = subsidiarySearchObj.run().getRange({ start: 0, end: 1 });
                var depa = searchResult[0].getValue(subsidiarySearchObj.columns[1]);
                var distrito = searchResult[0].getValue(subsidiarySearchObj.columns[2]);
                var addr = searchResult[0].getValue(subsidiarySearchObj.columns[3]);
                var cod_ubi = searchResult[0].getValue(subsidiarySearchObj.columns[4]);
                return {
                    depa: depa,
                    distrito: distrito,
                    addr: addr,
                    cod_ubi: cod_ubi,
                }
            } catch (error) {
                log.error('error', error);
            }
        }

        function getCodigoUbicacion(id) {
            try {
                var locationSearchObj = search.create({
                    type: "location",
                    filters:
                        [
                            ["internalid", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_pe_cod_establishment_annex", label: "PE Cod Anexo del establecimiento" })
                        ]
                });
                var searchResult = locationSearchObj.run().getRange({ start: 0, end: 1 });
                var codigo = searchResult[0].getValue(locationSearchObj.columns[0]);
                return codigo
            } catch (error) {
                log.error('error', error);
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


        function setRecord(recordtype, internalid, tranid, /*urlpdf, urlxml, urlcdr,*/ urljson /*encodepdf, array*/) {
            var recordload = '';
            try {
                if (recordtype == '07') {
                    recordload = record.load({ type: record.Type.CREDIT_MEMO, id: internalid });
                } else if (recordtype == '09') {
                    recordload = record.load({ type: 'itemfulfillment', id: internalid });
                } else {
                    recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                }
                //recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                recordload.setValue('custbody_pe_fe_ticket_id', tranid);
                recordload.setValue('custbody_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custbody_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custbody_pe_ei_printed_cdr_res', urlcdr);
                // recordload.setValue('custbody_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custbody_pe_ei_printed_pdf_codificado', encodepdf);
                recordload.save();
                // recordload = record.create({type: 'customrecord_pe_ei_printed_fields',isDynamic: true});
                // recordload.setValue('name', tranid);
                // recordload.setValue('custrecord_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custrecord_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custrecord_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custrecord_pe_ei_printed_cdr_res', urlcdr);
                // recordload.save();
                return recordload;
            } catch (e) {
                //logError(array[0], array[1], 'Error-setRecord', e.message);
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
                //logError(array[0], array[1], 'Error-setRecord', e.message);
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




        return {
            validate: validate
        };

    });