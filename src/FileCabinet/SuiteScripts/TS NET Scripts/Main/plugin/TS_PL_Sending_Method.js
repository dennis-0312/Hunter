/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['N/email', 'N/encode', 'N/format', 'N/https', 'N/record', 'N/search', 'N/runtime', 'N/file'],
    /**
     * @param{email} email
     * @param{encode} encode
     * @param{format} format
     * @param{https} https
     * @param{record} record
     * @param{search} search
     * 
     * send - This function is the entry point of our plugin script
    * @param {Object} plugInContext
    * @param {String} plugInContext.scriptId
    * @param {String} plugInContext.sendMethodId
    * @param {String} plugInContext.eInvoiceContent
    * @param {Array}  plugInContext.attachmentFileIds
    * @param {String} plugInContext.customPluginImpId
    * @param {Number} plugInContext.batchOwner
    * @param {Object} plugInContext.customer
    * @param {String} plugInContext.customer.id
    * @param {Array}  plugInContext.customer.recipients
    * @param {Object} plugInContext.transaction
    * @param {String} plugInContext.transaction.number
    * @param {String} plugInContext.transaction.id
    * @param {String} plugInContext.transaction.poNum
    * @param {String} plugInContext.transaction.tranType
    * @param {Number} plugInContext.transaction.subsidiary
    * @param {Object} plugInContext.sender
    * @param {String} plugInContext.sender.id
    * @param {String} plugInContext.sender.name
    * @param {String} plugInContext.sender.email
    * @param {Number} plugInContext.userId
    *
    * @returns {Object}  result
    * @returns {Boolean} result.success
    * @returns {String}  result.message
     */
    function (email, encode, format, https, record, search, runtime, file) {

        const GENERATED_FILE_FOLDER_ID = "1183";

        function send(pluginContext) {
            var result = {
                success: true,
                message: ""
            }
            try {
                var linesArray = [];

                var transactionId = pluginContext.transaction.id;
                var setup = getEnvirommentSetup();
                var name = "";
                var transactionRecord = getLookupFieldsSearch(search.Type.TRANSACTION, transactionId, ["recordtype", "custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"]);

                if (transactionRecord.recordtype == "invoice" && transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "01") {
                    linesArray = generateInvoiceLines(transactionId, setup, name);
                } else if (transactionRecord.recordtype == "itemfulfillment") {
                    linesArray = generateItemFulfillmentLines(transactionId, setup, name);
                } else if (transactionRecord.recordtype == "creditmemo") {
                    linesArray = generateCreditNoteLines(transactionId, setup, name);
                } else if (transactionRecord.recordtype == "invoice" && transactionRecord["custbodyts_ec_tipo_documento_fiscal.custrecordts_ec_cod_tipo_comprobante"] == "05") {
                    linesArray = generateDebitNoteLines(transactionId, setup, name);
                }

                var fileContent = printLines(linesArray);
                var fileId = generateFileTXT(name, fileContent);

                result.message = fileId + " - Archivo generado con éxito";
            } catch (error) {
                result = {
                    success: false,
                    message: "An error was ocurred: " + error.message
                }
            }
            return result;
        }

        function generateInvoiceLines(transactionId, setup, name) {
            var invoiceLines = [];
            var transactionRecord = getInvoiceTransaction(transactionId);

            var document = {};
            if (transactionRecord.itemFulfillmentCarrierDocumentType) {
                document = getLookupFieldsSearch("customrecord_ts_ec_doc_identidad", transactionRecord.itemFulfillmentCarrierDocumentType, ["custrecordts_ec_identity_code_ei"]);
            }
            name = transactionRecord.tranid;

            var VEline = ['VE', transactionRecord.documentTypeCode, transactionRecord.documentType.toUpperCase(), '1.0.0', ''];
            invoiceLines.push(VEline);

            var serie = transactionRecord.serie.split('-');
            var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", '000000001', transactionRecord.subsidiaryAddress.toUpperCase(), transactionRecord.subsidiaryEmail, ''];
            invoiceLines.push(ITline);

            var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                transactionRecord.itemFulfillment || "", transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', '', '', '',
                '0', '', transactionRecord.period, transactionRecord.itemFulfillmentCarrierAddress, transactionRecord.itemFulfillmentCarrierLegalName, document.custrecordts_ec_identity_code_ei || "", transactionRecord.itemFulfillmentCarrierRuc, "", "", transactionRecord.itemFulfillmentTransportStartDate,
                transactionRecord.itemFulfillmentTransportEndDate, transactionRecord.itemFulfillmentCarrierPlate, transactionRecord.address, ''];
            invoiceLines.push(ICline);

            var detailArray = getInvoiceTotalAndDetails(transactionRecord.items);
            invoiceLines = invoiceLines.concat(detailArray);

            var IALines = getIALines(transactionRecord);
            invoiceLines = invoiceLines.concat(IALines);

            return invoiceLines;
        }

        function getInvoiceTransaction(transactionId) {
            var transactionResult = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["internalidnumber", "equalto", transactionId],
                    "AND",
                    [["custbody_ht_guia_remision", "anyof", "@NONE@"], "OR", ["custbody_ht_guia_remision.mainline", "is", "T"]],
                    "AND",
                    ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"]
                ],
                columns: [
                    search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                    search.createColumn({ name: "mainline", label: "mainline" }),
                    search.createColumn({ name: "tranid", label: "tranid" }),
                    search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                    search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                    search.createColumn({ name: "custbody_ts_ec_serie_cxc", label: "serie" }),
                    search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "preprint" }),

                    search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                    search.createColumn({ name: "terms", label: "terms" }),

                    search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),

                    search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                    search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                    search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                    search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                    search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                    search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                    search.createColumn({ name: "custentity_ec_obligado_contabilidad", join: "customerMain", label: "customerObligatedToAccountFor" }),
                    search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                    search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                    search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),

                    search.createColumn({ name: "address1", join: "billingAddress", label: "address" }),
                    search.createColumn({ name: "city", join: "billingAddress", label: "city" }),


                    search.createColumn({ name: "custbody_ec_direccion_partida", join: "custbody_ht_guia_remision", label: "itemFulfillmentStartAddress" }),
                    search.createColumn({ name: "custbody_ec_numero_ide_destinatario", join: "custbody_ht_guia_remision", label: "itemFulfillmentAddresseDocumentNumber" }),
                    search.createColumn({ name: "custbody_ec_gr_identificaciontranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierDocumentType" }),
                    search.createColumn({ name: "custbody_ec_direccion_partida", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierAddress" }),
                    search.createColumn({ name: "custbody_ec_gr_razonsocialtranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierLegalName" }),
                    search.createColumn({ name: "custbody_ec_ruc_transportista", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierRuc" }),
                    search.createColumn({ name: "custbody_ec_gr_placatranspor", join: "custbody_ht_guia_remision", label: "itemFulfillmentCarrierPlate" }),
                    search.createColumn({ name: "tranid", join: "custbody_ht_guia_remision", label: "itemFulfillment" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custbody_ht_guia_remision.custbody_ec_gr_fechainiciotransporte}, 'DD/MM/YYYY')", label: "itemFulfillmentTransportStartDate" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custbody_ht_guia_remision.custbody_ec_gr_fechafintransporte}, 'DD/MM/YYYY')", label: "itemFulfillmentTransportEndDate" }),

                    search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                    search.createColumn({ name: "memo", label: "item.detail" }),
                    search.createColumn({ name: "quantity", label: "item.quantity" }),
                    search.createColumn({ name: "rate", label: "item.rate" }),
                    search.createColumn({ name: "amount", label: "item.amount" }),
                    search.createColumn({ name: "taxamount", label: "item.taxAmount" }),
                    search.createColumn({ name: "grossamount", label: "item.grossAmount" }),
                    search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                    search.createColumn({ name: "taxcode", label: "item.taxItem" }),
                    search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),
                    search.createColumn({ name: "custcol_ts_ec_cod_id_facturacion", label: "item.identifierCode" })
                    /*search.createColumn({ name: "discountitem", label: "discountItem"}),
                    search.createColumn({ name: "discountrate", label: "discountRate"})*/
                ]
            }).run().getRange(0, 1000);
            var transactionJson = {};
            for (var i = 0; i < transactionResult.length; i++) {
                if (i == 0) {
                    transactionJson = getMainLineFields(transactionResult[i]);
                    transactionJson.items = [];
                }
                var item = getLineFields(transactionResult[i]);
                transactionJson.items.push(item);
            }
            return transactionJson;
        }

        function getInvoiceTotalAndDetails(items) {
            var resultArray = [];
            var lineArray = [];
            // T LINE
            var subtotal12 = 0;
            var subtotal0 = 0;
            var subtotalNotSubject = 0;
            var subtotalWithoutTaxation = 0;
            var totalDescuento = 0;
            var ICE = 0;
            var IVA12 = 0;
            var totalAmount = 0;
            var tip = 0;
            var amountToPay = 0;

            var taxCodesId12 = ["26", "27", "28", "29", "36", "37", "38", "63"];
            var taxCodesId0 = ["40"];
            var taxCodesIdNotSubject = ["5"];
            var invoicingTaxName = "IVA";
            var invoicingTaxCode = "2";

            var TILineJson = {}

            for (var i = 0; i < items.length; i++) {
                var DEline = [];
                var IMline = [];
                var item = items[i];

                if (item.type == 'InvtPart') {
                    DEline = ['DE', item.code.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity, item.rate, 0, item.amount, ""];
                    lineArray.push(DEline);
                    if (taxCodesId12.indexOf(item.taxItem) > -1 && item.identifierCode == '2') {
                        subtotal12 += Number(item.amount);
                        IVA12 += Number(item.taxAmount);
                    }
                    if (taxCodesId0.indexOf(item.taxItem) > -1 && item.identifierCode == '0') subtotal0 += Number(item.amount);
                    if (taxCodesIdNotSubject.indexOf(item.taxItem) > -1 && item.identifierCode == '6') subtotalNotSubject += Number(item.amount);
                    subtotalWithoutTaxation += Number(item.amount);
                    totalAmount += Number(item.grossAmount);

                    IMline = ["IM", invoicingTaxCode, item.identifierCode, item.amount, item.taxRate, item.taxAmount, invoicingTaxName, ""];
                    lineArray.push(IMline);

                    // TI LINE
                    var TIKey = invoicingTaxCode + "|" + item.identifierCode;
                    if (TILineJson[TIKey] === undefined) {
                        TILineJson[TIKey] = [Number(item.amount), item.taxRate, Number(item.taxAmount), invoicingTaxName];
                    } else {
                        TILineJson[TIKey][0] = TILineJson[TIKey][0] + Number(item.amount);
                        TILineJson[TIKey][2] = TILineJson[TIKey][2] + Number(item.taxAmount);
                    }
                }
                amountToPay += Number(item.grossAmount);
            }

            var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, totalAmount, tip, amountToPay, ""];
            resultArray.push(TLine);
            for (var key in TILineJson) {
                var invoicingTax = key.split("|");
                var TILine = ["TI", invoicingTax[0], invoicingTax[1], TILineJson[key][0], TILineJson[key][1], TILineJson[key][2], TILineJson[key][3], ""];
                resultArray.push(TILine);
            }

            return resultArray.concat(lineArray);
        }

        function generateItemFulfillmentLines(transactionId, setup, name) {
            var itemFulfillmentLines = [];
            var transactionRecord = getItemFulfillmentTransaction(transactionId);
            name = transactionRecord.tranid;

            //VE
            var VEline = ['VE', "06", "GUÍA DE REMISIÓN", '1.0', ''];
            itemFulfillmentLines.push(VEline);

            var serie = transactionRecord.serie.split('-');
            //IT
            var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, transactionRecord.subsidiaryLegalName, transactionRecord.subsidiaryFederalNumber, '', "06", serie[0], serie[1] || "", '000000001', transactionRecord.subsidiaryAddress, transactionRecord.subsidiaryEmail, ''];
            itemFulfillmentLines.push(ITline);

            var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                transactionRecord.tranid, transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', '', '', '',
                '0', '', transactionRecord.period, transactionRecord.carrierAddress, transactionRecord.carrierLegalName, transactionRecord.carrierDocumentType, transactionRecord.carrierRuc, "", "", transactionRecord.TransportStartDate,
                transactionRecord.transportEndDate, transactionRecord.carrierPlate, transactionRecord.address, ''];
            itemFulfillmentLines.push(ICline);

            var DESTline = ['DEST', transactionRecord.addresseeRuc, transactionRecord.addressee, transactionRecord.addresseeAddress.replace(/\n/gi, ""), transactionRecord.transferReason, "", "", transactionRecord.route,
                "", "", "", "", ""];
            itemFulfillmentLines.push(DESTline);

            var detailArray = getItemFulfillmentDetail(transactionRecord.items);
            itemFulfillmentLines = itemFulfillmentLines.concat(detailArray);

            var IALine = ["IA", "Marca", "Chevrolet", ""];
            itemFulfillmentLines.push(IALine);

            return itemFulfillmentLines;
        }

        function getItemFulfillmentTransaction(transactionId) {
            var transactionResult = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ["type", "anyof", "ItemShip"],
                    "AND",
                    ["internalidnumber", "equalto", transactionId]
                ],
                columns: [
                    search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                    search.createColumn({ name: "mainline", label: "mainline" }),
                    search.createColumn({ name: "tranid", label: "tranid" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),

                    search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                    search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                    search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                    search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                    search.createColumn({ name: "shipaddress", label: "address" }),
                    search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                    search.createColumn({ name: "custentity_ec_obligado_contabilidad", join: "customerMain", label: "customerObligatedToAccountFor" }),
                    search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                    search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                    search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),
                    search.createColumn({ name: "custbody_ec_gr_razonsocialtranspor", label: "carrier" }),
                    search.createColumn({ name: "custbody_ec_ruc_transportista", label: "carrierRuc" }),
                    search.createColumn({ name: "custrecordts_ec_identity_code_ei", join: "custbody_ec_gr_identificaciontranspor", label: "carrierDocumentType" }),
                    search.createColumn({ name: "custbody_ec_direccion_partida", label: "carrierAddress" }),
                    search.createColumn({ name: "custbody_ec_gr_razonsocialtranspor", label: "carrierLegalName" }),
                    search.createColumn({ name: "custbody_ec_gr_placatranspor", label: "carrierPlate" }),

                    search.createColumn({ name: "formulatext", formula: "to_char({custbody_ec_gr_fechainiciotransporte}, 'DD/MM/YYYY')", label: "transportStartDate" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custbody_ec_gr_fechafintransporte}, 'DD/MM/YYYY')", label: "transportEndDate" }),

                    search.createColumn({ name: "custbody_ec_gr_razonsocialdestin", label: "addressee" }),
                    search.createColumn({ name: "custbody_ec_numero_ide_destinatario", label: "addresseeRuc" }),
                    search.createColumn({ name: "custrecordts_ec_identity_code_ei", join: "custbody_ec_gr_identificaciondestin", label: "addresseeDocumentType" }),
                    search.createColumn({ name: "custbody_ec_direccion_destinatario", label: "addresseeAddress" }),
                    search.createColumn({ name: "custbody_ec_gr_motivotraslado", label: "transferReason" }),
                    search.createColumn({ name: "custbody_ec_gr_ruta", label: "route" }),

                    search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                    search.createColumn({ name: "quantity", label: "item.quantity" }),
                    search.createColumn({ name: "memo", label: "item.detail" })
                ]
            }).run().getRange(0, 1000);

            var transactionJson = {};
            for (var i = 0; i < transactionResult.length; i++) {
                if (i == 0) {
                    transactionJson = getMainLineFields(transactionResult[i]);
                    transactionJson.items = [];
                }
                var item = getLineFields(transactionResult[i]);
                transactionJson.items.push(item);
            }
            return transactionJson;
        }

        function getItemFulfillmentDetail(items) {
            var resultArray = [];
            for (var i = 0; i < items.length; i++) {
                if (Number(items[i].quantity) > 0) {
                    var DEline = ["DE", items[i].code, "", items[i].detail, items[i].quantity, 0, 0, 0, ""];
                    resultArray.push(DEline);
                }
            }
            return resultArray;
        }

        function generateCreditNoteLines(transactionId, setup, name) {
            var creditNoteLines = [];
            var transactionRecord = getCreditNoteTransaction(transactionId);
            name = transactionRecord.tranid;

            var VEline = ['VE', transactionRecord.documentTypeCode, transactionRecord.documentType.toUpperCase(), '1.0.0', ''];
            creditNoteLines.push(VEline);

            var serie = transactionRecord.serie.split('-');
            var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", '000000001', transactionRecord.subsidiaryAddress.toUpperCase(), 'factura@suministro.com', ''];
            creditNoteLines.push(ITline);

            var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                "", transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', '', '', '',
                '0', '', transactionRecord.period, "", "", "", "", "", "", "",
                "", "", transactionRecord.address, ''];
            creditNoteLines.push(ICline);

            var detailArray = getCreditNoteTotalAndDetails(transactionRecord.items);
            creditNoteLines = creditNoteLines.concat(detailArray);

            var IALines = getIALines(transactionRecord);
            creditNoteLines = creditNoteLines.concat(IALines);

            creditNoteLines.push(IALines);
            return creditNoteLines;
        }

        function getCreditNoteTransaction(transactionId) {
            var transactionResult = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ["type", "anyof", "CustCred"],
                    "AND",
                    ["internalidnumber", "equalto", transactionId],
                    "AND",
                    ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"]
                ],
                columns: [
                    search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                    search.createColumn({ name: "tranid", label: "tranid" }),
                    search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                    search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                    search.createColumn({ name: "custbody_ts_ec_serie_cxc", label: "serie" }),
                    search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),

                    search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                    search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                    search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                    search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                    search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                    search.createColumn({ name: "custentity_ec_obligado_contabilidad", join: "customerMain", label: "customerObligatedToAccountFor" }),
                    search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                    search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                    search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),

                    search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                    search.createColumn({ name: "memo", label: "item.detail" }),
                    search.createColumn({ name: "quantity", label: "item.quantity", function: "absoluteValue" }),
                    search.createColumn({ name: "rate", label: "item.rate" }),
                    search.createColumn({ name: "amount", label: "item.amount", function: "absoluteValue" }),
                    search.createColumn({ name: "taxamount", label: "item.taxAmount", function: "absoluteValue" }),
                    search.createColumn({ name: "grossamount", label: "item.grossAmount", function: "absoluteValue" }),
                    search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                    search.createColumn({ name: "taxcode", label: "item.taxItem" }),
                    search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),
                    search.createColumn({ name: "custcol_ts_ec_cod_id_facturacion", label: "item.identifierCode" })

                ]
            }).run().getRange(0, 1000);
            var transactionJson = {};
            for (var i = 0; i < transactionResult.length; i++) {
                if (i == 0) {
                    transactionJson = getMainLineFields(transactionResult[i]);
                    transactionJson.items = [];
                }
                var item = getLineFields(transactionResult[i]);
                transactionJson.items.push(item);
            }
            return transactionJson;
        }

        function getCreditNoteTotalAndDetails(items) {
            var resultArray = [];
            var lineArray = [];

            var subtotal12 = 0, subtotal0 = 0, subtotalNotSubject = 0, subtotalWithoutTaxation = 0, totalDescuento = 0, ICE = 0, IVA12 = 0, totalAmount = 0, tip = 0, amountToPay = 0;
            var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, totalAmount, tip, amountToPay, ""];

            var taxCodesId12 = ["26", "27", "28", "29", "36", "37", "38", "63"];
            var taxCodesId0 = ["40"];
            var taxCodesIdNotSubject = ["5"];

            var invoicingTaxName = "IVA";
            var invoicingTaxCode = "2";

            var TILineJson = {}
            for (var i = 0; i < items.length; i++) {
                var DEline = [];
                var IMline = [];
                var item = items[i];

                if (item.type == 'InvtPart') {
                    DEline = ['DE', item.code.substring(0, 15), item.code.substring(0, 15), item.detail, item.quantity, item.rate, 0, item.amount, ""];
                    lineArray.push(DEline);
                    if (taxCodesId12.indexOf(item.taxItem) > -1 && item.identifierCode == '2') {
                        subtotal12 += Number(item.amount);
                        IVA12 += Number(item.taxAmount);
                    }
                    if (taxCodesId0.indexOf(item.taxItem) > -1 && item.identifierCode == '0') subtotal0 += Number(item.amount);
                    if (taxCodesIdNotSubject.indexOf(item.taxItem) > -1 && item.identifierCode == '6') subtotalNotSubject += Number(item.amount);
                    subtotalWithoutTaxation += Number(item.amount);
                    totalAmount += Number(item.grossAmount);

                    IMline = ["IM", invoicingTaxCode, item.identifierCode, item.amount, item.taxRate, item.taxAmount, invoicingTaxName, ""];
                    lineArray.push(IMline);

                    // TI LINE
                    var TIKey = invoicingTaxCode + "|" + item.identifierCode;
                    if (TILineJson[TIKey] === undefined) {
                        TILineJson[TIKey] = [Number(item.amount), item.taxRate, Number(item.taxAmount), invoicingTaxName];
                    } else {
                        TILineJson[TIKey][0] = TILineJson[TIKey][0] + Number(item.amount);
                        TILineJson[TIKey][2] = TILineJson[TIKey][2] + Number(item.taxAmount);
                    }
                }
                amountToPay += Number(item.grossAmount);
            }

            var TLine = ["T", subtotal12, subtotal0, subtotalNotSubject, subtotalWithoutTaxation, totalDescuento, ICE, IVA12, totalAmount, tip, amountToPay, ""];
            resultArray.push(TLine);
            for (var key in TILineJson) {
                var invoicingTax = key.split("|");
                var TILine = ["TI", invoicingTax[0], invoicingTax[1], TILineJson[key][0], TILineJson[key][1], TILineJson[key][2], TILineJson[key][3], ""];
                resultArray.push(TILine);
            }

            return resultArray.concat(lineArray);
        }

        function generateDebitNoteLines(transactionId, name) {
            var creditNoteLines = [];
            var transactionRecord = getDebitNoteTransaction(transactionId);
            name = transactionRecord.tranid;

            var VEline = ['VE', transactionRecord.documentTypeCode, transactionRecord.documentType.toUpperCase(), '1.0.0', ''];
            creditNoteLines.push(VEline);

            var serie = transactionRecord.serie.split('-');
            var ITline = ['IT', setup.enviromment, '1', transactionRecord.subsidiaryLegalName, "CARSEG S.A", transactionRecord.subsidiaryFederalNumber, '', transactionRecord.documentTypeCode, serie[0], serie[1] || "", '000000001', transactionRecord.subsidiaryAddress.toUpperCase(), 'factura@suministro.com', ''];
            creditNoteLines.push(ITline);

            var ICline = ['IC', transactionRecord.date, transactionRecord.subsidiaryAddress, transactionRecord.customerSpecialTaxPayer, transactionRecord.customerObligatedToAccountFor, transactionRecord.customerDocumentTypeCode,
                "", transactionRecord.customerName, transactionRecord.customerDocumentNumber, transactionRecord.currency, '', '', '', '',
                '0', '', transactionRecord.period, "", "", "", "", "", "", "",
                "", "", transactionRecord.address, ''];
            creditNoteLines.push(ICline);

            var detailArray = getCreditNoteTotalAndDetails(transactionRecord.items);
            creditNoteLines = creditNoteLines.concat(detailArray);

            var IALines = getIALines(transactionRecord);
            creditNoteLines = creditNoteLines.concat(IALines);

            creditNoteLines.push(IALines);
            return creditNoteLines;
        }

        function getDebitNoteTransaction(transactionId) {
            var transactionResult = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["internalidnumber", "equalto", transactionId],
                    "AND",
                    ["formulanumeric: NVL({debitamount},0) - NVL({creditamount},0)", "notequalto", "0"]
                ],
                columns: [
                    search.createColumn({ name: "line", sort: search.Sort.ASC, label: "Line ID" }),
                    search.createColumn({ name: "mainline", label: "mainline" }),

                    search.createColumn({ name: "tranid", label: "tranid" }),
                    search.createColumn({ name: "name", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentType" }),
                    search.createColumn({ name: "custrecordts_ec_cod_tipo_comprobante", join: "CUSTBODYTS_EC_TIPO_DOCUMENTO_FISCAL", label: "documentTypeCode" }),
                    search.createColumn({ name: "custbody_ts_ec_serie_cxc", label: "serie" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({trandate},'DD/MM/YYYY')", label: "date" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({duedate},'DD/MM/YYYY')", label: "duedate" }),
                    search.createColumn({ name: "terms", label: "terms" }),

                    search.createColumn({ name: "formulatext", formula: "CASE WHEN {currency.symbol} = 'USD' THEN 'DOLAR' END", label: "currency" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({accountingperiod.startdate},'MM/YYYY')", label: "period" }),

                    search.createColumn({ name: "name", join: "subsidiary", label: "subsidiaryName" }),
                    search.createColumn({ name: "legalname", join: "subsidiary", label: "subsidiaryLegalName" }),
                    search.createColumn({ name: "address1", join: "subsidiary", label: "subsidiaryAddress" }),
                    search.createColumn({ name: "taxidnum", join: "subsidiary", label: "subsidiaryFederalNumber" }),
                    search.createColumn({ name: "email", join: "subsidiary", label: "subsidiaryEmail" }),

                    search.createColumn({ name: "custentityec_contribuyente_especial", join: "customerMain", label: "customerSpecialTaxPayer" }),
                    search.createColumn({ name: "custentity_ec_obligado_contabilidad", join: "customerMain", label: "customerObligatedToAccountFor" }),
                    search.createColumn({ name: "custentityts_ec_cod_tipo_doc_identidad", join: "customerMain", label: "customerDocumentTypeCode" }),
                    search.createColumn({ name: "altname", join: "customerMain", label: "customerName" }),
                    search.createColumn({ name: "vatregnumber", join: "customerMain", label: "customerDocumentNumber" }),

                    search.createColumn({ name: "address1", join: "billingAddress", label: "address" }),
                    search.createColumn({ name: "city", join: "billingAddress", label: "city" }),

                    search.createColumn({ name: "itemid", join: "item", label: "item.code" }),
                    search.createColumn({ name: "memo", label: "item.detail" }),
                    search.createColumn({ name: "quantity", label: "item.quantity" }),
                    search.createColumn({ name: "rate", label: "item.rate" }),
                    search.createColumn({ name: "amount", label: "item.amount" }),
                    search.createColumn({ name: "taxamount", label: "item.taxAmount" }),
                    search.createColumn({ name: "grossamount", label: "item.grossAmount" }),
                    search.createColumn({ name: "type", join: 'item', label: "item.type" }),
                    search.createColumn({ name: "taxcode", label: "item.taxItem" }),
                    search.createColumn({ name: "formulanumeric", formula: "{taxitem.rate}", label: "item.taxRate" }),
                    search.createColumn({ name: "custcol_ts_ec_cod_id_facturacion", label: "item.identifierCode" })
                    /*search.createColumn({ name: "discountitem", label: "discountItem"}),
                    search.createColumn({ name: "discountrate", label: "discountRate"})*/
                ]
            }).run().getRange(0, 1000);
            var transactionJson = {};
            for (var i = 0; i < transactionResult.length; i++) {
                if (i == 0) {
                    transactionJson = getMainLineFields(transactionResult[i]);
                    transactionJson.items = [];
                }
                var item = getLineFields(transactionResult[i]);
                transactionJson.items.push(item);
            }
            return transactionJson;
        }

        function getMainLineFields(transactionResult) {
            var mainLineJson = {};
            var columns = transactionResult.columns;
            mainLineJson.internalid = transactionResult.id;
            mainLineJson.type = transactionResult.type;
            columns.forEach(function (column) {
                var column_key = column.label || column.name;
                var isItem = column_key.indexOf("item.");
                if (isItem == -1) {
                    mainLineJson[column_key] = transactionResult.getValue(column);
                }
            });
            return mainLineJson;
        }

        function getLineFields(transactionResult) {
            var items = [];
            var lineJson = {}
            var columns = transactionResult.columns;
            columns.forEach(function (column) {
                var column_key = column.label || column.name;
                var isItem = column_key.indexOf("item.");
                if (isItem != -1) {
                    column_key = column_key.replace("item.", "");
                    lineJson[column_key] = transactionResult.getValue(column);
                    items.push(lineJson);
                }
            });
            return lineJson;
        }

        function getIALines(transactionRecord) {
            var IALines = [];
            IALines.push(['IA', 'DIRECCION', transactionRecord.address, '']);
            IALines.push(['IA', 'CIUDAD', transactionRecord.city, '']);
            IALines.push(['IA', 'VENCIMIENTO', transactionRecord.duedate, '']);
            var daysuntilnetdue = getTermsDaysUntilNetDue(transactionRecord.terms);
            IALines.push(['IA', 'PLAZO', daysuntilnetdue, '']);
            return IALines;
        }

        function getTermsDaysUntilNetDue(termsId) {
            if (termsId) return "";
            var termRecord = search.lookupFields({
                type: search.Type.TERM,
                id: termsId,
                columns: ["daysuntilnetdue"]
            });
            return termRecord.daysuntilnetdue + " dias";
        }

        function getLookupFieldsSearch(type, id, columns) {
            var record = search.lookupFields({
                type: type, //search.Type.SUBSIDIARY,
                id: id, //filterSubsidiary,
                columns: columns
            });
            return record;
        }

        function printLines(linesArray) {
            var text = "";
            for (var i = 0; i < linesArray.length; i++) {
                text = text + linesArray[i].join('|') + "\n";
            }
            return text;
        }

        function getEnvirommentSetup() {
            var setup = {}

            setup.enviromment = runtime.envType == 'PRODUCTION' ? "2" : "1";
            setup.issuanceType = 1;

            return setup;
        }

        function generateFileTXT(namefile, contents) {
            return file.create({
                name: namefile + '.txt',
                fileType: file.Type.PLAINTEXT,
                contents: contents,
                encoding: file.Encoding.UTF8,
                folder: GENERATED_FILE_FOLDER_ID,
                isOnline: true
            }).save();
        }

        return {
            send: send
        };

    });
