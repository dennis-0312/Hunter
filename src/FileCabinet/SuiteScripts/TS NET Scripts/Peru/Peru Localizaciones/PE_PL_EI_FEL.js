/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = =\
||                                                                                                                  ||
||   This script for Sales FEL (Pluging para FEL)                                                                   ||
||                                                                                                                  ||
||   File Name: TS_PL_EI_FEL.js                                                                                      ||
||                                                                                                                  ||
||   Commit      Version     Date            ApiVersion         Enviroment       Governance points                  ||
||   06          3.1         11/01/2022      Script 2.0         SB               N/A                                ||
||                                                                                                                  ||
\  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = == = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */
define(["N/record", "N/file", "N/email", "N/encode", "N/search", "N/https", "N/log"],
    function (record, file, email, encode, search, https, log) {
        var recordtype = '';
        var FOLDER_PDF = 421; //SB: 421
        var FOLDER_EXCEPTIONS = 1403; //SB: 1403
        var internalId = '';
        var userId = '';
        var docstatus2 = 'Parsing Failed';

        function send(plugInContext) {
            result = {
                success: true,
                message: 'success'
            }
            try {
                internalId = plugInContext.transaction.id;
                userId = plugInContext.sender.id;
                var userMail = plugInContext.sender.email;
                var tranID = plugInContext.transaction.number;

                var docstatus = 'Sent'
                var request;
                var send = new Array();
                var statustrasanction = '';
                var sendresponsecode = 'Completed Process';
                var docstatus1 = 'Sending Failed';
                var array = [internalId, userId];
                var getcredentials = openCredentials(array);

                var urlsendinfo = getcredentials.wsurl + 'wsParser_2_1/rest/parserWS';
                var urlgetpdf = getcredentials.wsurl + 'wsBackend/clients/getDocumentPDF';
                var urlgetinfourl = getcredentials.wsurl + 'wsBackend/clients/getPdfURL';
                var urlgetxml = getcredentials.wsurl + 'wsBackend/clients/getDocumentXML';
                var urlgetcdr = getcredentials.wsurl + 'wsBackend/clients/getDocumentCDR';

                var tokensend = token();
                var tokenpdf = token();
                var tokenxml = token();
                var tokencdr = token();
                var tokenurl = token();

                //Bloque de identificación de transancción
                var identifydocument = getIdentifyDocument(internalId);
                if (identifydocument == '01' || identifydocument == '03') {
                    request = createRequest(internalId, array);
                    recordtype = 'invoice';
                } else if (identifydocument == '08') {
                    request = createRequestDebitMemo(internalId, array);
                    recordtype = 'invoice';
                } else {
                    request = createRequestCreditMemo(internalId, array);
                }

                //Bloque de validación si documento ya existe en OSCE
                var existDocument = getDocumentPDF(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokenurl, urlgetinfourl, array);
                sleep(1000);
                if (existDocument.codigo == '0') {
                    statustrasanction = '0';
                } else {
                    send = sendDocument(getcredentials.username, getcredentials.password, tokensend, urlsendinfo, request, array);
                    sleep(3000);
                    statustrasanction = send.responsecode;
                    logStatus(internalId, send.response);
                }

                //Bloque de ejecucíon de envío de documento
                if (statustrasanction == '0') {
                    var getpdf = getDocumentPDF(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokenpdf, urlgetpdf, array);
                    var getxml = getDocumentXML(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokenxml, urlgetxml, array);
                    var getcdr = getDocumentCDR(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokencdr, urlgetcdr, array);
                    sleep(3000);
                    if (getpdf.mensaje == 'OK' && getxml.mensaje == 'OK' && getcdr.mensaje == 'OK') {
                        var filepdf = generateFilePDF(request.numbering, getpdf.pdf, array);
                        var filexml = generateFileXML(request.numbering, getxml.xml, array);
                        var filecdr = generateFileCDR(request.numbering, getcdr.cdr, array);
                        var filejson = generateFileJSON(request.numbering, request.request, array);
                        if (filepdf != '' && filexml != '' && filecdr != '' && filejson != '') {
                            var arrayheader = [userId, getcredentials.recipients, request.emisname, request.numbering, request.typedoc, docstatus, filepdf, filexml, filecdr, filejson, getpdf.pdf];
                            var arraybody = [internalId];
                            var sendemail = sendEmail(true, arrayheader, arraybody, recordtype, array);
                            logStatus(internalId, sendemail);
                        } else {
                            logError(internalId, userId, docstatus2, 'Error en envío de email');
                            result.success = false;
                            result.message = "Failure";
                        }
                    } else {
                        logError(internalId, userId, docstatus2, 'Error en generación de archivos');
                        result.success = false;
                        result.message = "Failure";
                    }
                } else if (send.responsecode == '1033') {
                    logError(internalId, userId, docstatus1, send.response);
                    result.success = false;
                    result.message = "Failure";
                } else {
                    var filetxt = generateFileTXT(request.numbering, request.request, array);
                    var res = 'Request: ' + filetxt + ' - ' + send.response;
                    logError(internalId, userId, docstatus1, res);
                    result.success = false;
                    result.message = "Failure";
                }
            } catch (e) {
                logError(internalId, userId, docstatus2, JSON.stringify(e));
                result.success = false;
                result.message = "Failure";
            }
            return result;
        }


        function getIdentifyDocument(documentid) {
            try {
                var searchLoad = search.create({
                    type: "transaction",
                    filters:
                        [
                            [["type", "anyof", "CashSale"], "OR", ["type", "anyof", "CustInvc"]],
                            "AND",
                            ["internalid", "anyof", documentid]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {custbody_pe_document_type} = 'Factura' THEN '01' WHEN {custbody_pe_document_type} = 'Boleta de Venta' THEN '03' WHEN {custbody_pe_document_type} = 'Nota de Debito' THEN '08' END",
                                label: "Document Type"
                            }),
                        ]
                });

                var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                var column01 = searchResult[0].getValue(searchLoad.columns[0]);
                return column01;
            } catch (e) {

            }
        }


        function getDocumentPDF(username, password, codCPE, numSerieCPE, numCPE, token, url, array) {
            var headers1 = new Array();
            try {
                var req = JSON.stringify({
                    "user": {
                        "username": username,
                        "password": password
                    },
                    "codCPE": codCPE,
                    "numSerieCPE": numSerieCPE,
                    "numCPE": numCPE
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;
                var response = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });
                var body = JSON.parse(response.body);
                var codigo = body.codigo;
                var mensaje = body.mensaje;
                var pdf = body.pdf;

                return {
                    codigo: codigo,
                    mensaje: mensaje,
                    pdf: pdf
                }
            } catch (e) {
                logError(array[0], array[1], 'Error-getDocumentPDF', JSON.stringify(e));
            }
        }


        function getDocumentXML(username, password, codCPE, numSerieCPE, numCPE, token, url, array) {
            var headers1 = new Array();
            try {
                var req = JSON.stringify({
                    "user": {
                        "username": username,
                        "password": password
                    },
                    "codCPE": codCPE,
                    "numSerieCPE": numSerieCPE,
                    "numCPE": numCPE
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;
                var response = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });
                var body = JSON.parse(response.body);
                var mensaje = body.mensaje;
                var xml = body.xml;

                return {
                    mensaje: mensaje,
                    xml: xml
                }
            } catch (e) {
                logError(array[0], array[1], 'Error-getDocumentXML', JSON.stringify(e));
            }
        }


        function getDocumentCDR(username, password, codCPE, numSerieCPE, numCPE, token, url, array) {
            var headers1 = new Array();
            try {
                var req = JSON.stringify({
                    "user": {
                        "username": username,
                        "password": password
                    },
                    "codCPE": codCPE,
                    "numSerieCPE": numSerieCPE,
                    "numCPE": numCPE
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;
                var response = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });
                var body = JSON.parse(response.body);
                var mensaje = body.mensaje;
                var cdr = body.cdr;

                return {
                    mensaje: mensaje,
                    cdr: cdr
                }
            } catch (e) {
                logError(array[0], array[1], 'Error-getDocumentCDR', JSON.stringify(e));
            }
        }


        function sendDocument(username, password, token, url, request, array) {
            var headers1 = new Array();
            try {
                var encode64 = base64Encoded(request.request);
                var filename = request.filenameosce;
                var req = JSON.stringify({
                    "customer": {
                        "username": username,
                        "password": password
                    },
                    "fileName": filename + '.json',
                    "fileContent": encode64
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;
                var myresponse = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });

                var body = JSON.parse(myresponse.body);
                var responsecode = body.responseCode;
                var response = body.responseContent;
                return {
                    responsecode: responsecode,
                    response: response,
                    filename: filename
                }
            } catch (e) {
                logError(array[0], array[1], 'Error-sendDocument', JONS.stringify(e));
            }
        }


        function createRequest(documentid, array) {

            var json = new Array();
            var jsonMain = new Array();
            var jsonIDE = new Array();
            var jsonEMI = new Array();
            var jsonREC = new Array();
            var jsonDRF = new Array();
            var jsonCAB = new Array();
            var arrayCAB = new Array();
            var jsonLeyenda = new Array();
            var jsonADI = new Array();
            var factura = new Array();
            var fulfillment = 0;

            try {
                var searchLoad = search.create({
                    type: "transaction",
                    filters:
                        [
                            [["type", "anyof", "CashSale"], "OR", ["type", "anyof", "CustInvc"]],
                            "AND",
                            ["internalid", "anyof", documentid]
                        ],
                    columns:
                        [
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))",
                                label: "1 Formula (Text)"
                            }),
                            search.createColumn({ name: "trandate", label: "2 Date" }),
                            search.createColumn({ name: "datecreated", label: "3 Date Created" }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {custbody_pe_document_type} = 'Factura' THEN '01' WHEN {custbody_pe_document_type} = 'Boleta de Venta' THEN '03' END",
                                label: "4 Document Type"
                            }),
                            search.createColumn({
                                name: "symbol",
                                join: "Currency",
                                label: "5 Symbol"
                            }),
                            search.createColumn({
                                name: "otherrefnum",
                                join: "createdFrom",
                                label: "6 PO/Check Number"
                            }),
                            // EMI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "6",
                                label: "7 Doc. Type ID EMI"
                            }),
                            search.createColumn({
                                name: "taxidnum",
                                join: "subsidiary",
                                label: "8 Tax ID"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {subsidiary.name} = 'Parent Company : Feniziam' THEN 'Feniziam' END",
                                label: "9 Trade Name"
                            }),
                            search.createColumn({
                                name: "legalname",
                                join: "subsidiary",
                                label: "10 Legal Name"
                            }),
                            search.createColumn({
                                name: "address1",
                                join: "subsidiary",
                                label: "11 Address 1"
                            }),
                            search.createColumn({
                                name: "address2",
                                join: "subsidiary",
                                label: "12 Address 2"
                            }),
                            search.createColumn({
                                name: "city",
                                join: "subsidiary",
                                label: "13 City"
                            }),
                            search.createColumn({
                                name: "state",
                                join: "subsidiary",
                                label: "14 State/Province"
                            }),
                            search.createColumn({
                                name: "address3",
                                join: "subsidiary",
                                label: "15 Address 3"
                            }),
                            search.createColumn({ name: "billcountrycode", label: "16 Billing Country Code" }),
                            search.createColumn({
                                name: "phone",
                                join: "subsidiary",
                                label: "17 Phone"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "subsidiary",
                                label: "18 Email"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "'0000'",
                                label: "19 Cod Sunat"
                            }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' END",
                                label: "20 Doc. Type ID REC"
                            }),
                            search.createColumn({
                                name: "vatregnumber",
                                join: "customer",
                                label: "21 Tax Number"
                            }),
                            search.createColumn({
                                name: "companyname",
                                join: "customer",
                                label: "22 Company Name"
                            }),
                            search.createColumn({
                                name: "address1",
                                join: "customer",
                                label: "23 Address 1"
                            }),
                            search.createColumn({
                                name: "address2",
                                join: "customer",
                                label: "24 Address 2"
                            }),
                            search.createColumn({
                                name: "city",
                                join: "customer",
                                label: "25 City"
                            }),
                            search.createColumn({
                                name: "state",
                                join: "customer",
                                label: "26 State/Province"
                            }),
                            search.createColumn({
                                name: "address3",
                                join: "customer",
                                label: "27 Address 3"
                            }),
                            search.createColumn({
                                name: "countrycode",
                                join: "customer",
                                label: "28 Country Code"
                            }),
                            search.createColumn({
                                name: "phone",
                                join: "customer",
                                label: "29 Phone"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "customer",
                                label: "30 Email"
                            }),
                            // CAB---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "custrecord_pe_cod_fact",
                                join: "CUSTBODY_PE_EI_OPERATION_TYPE",
                                label: "31 PE Cod Fact"
                            }),
                            search.createColumn({ name: "duedate", label: "32 Due Date/Receive By" }),
                            // ADI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "33 PE EI Forma de Pago" }),
                            search.createColumn({ name: "custbody_pe_delivery_address", label: "34 PE Delivery address" }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({custbody_pe_driver_name}, CONCAT(' ', {custbody_pe_driver_last_name}))",
                                label: "35 Formula (Text)"
                            }),
                            search.createColumn({ name: "custbody_pe_ruc_empresa_transporte", label: "36 PE RUC EMP. TRANS." }),
                            search.createColumn({ name: "custbody_pe_car_plate", label: "37 PE Car Plate" }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_document_type", label: "38 PE Document Type" }),
                            search.createColumn({ name: "custbody_pe_serie", label: "39 PE Serie" }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "internalid",
                                join: "customer",
                                label: "40 Internal ID"
                            }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "TO_NUMBER({custbody_pe_number})",
                                label: "41 Formula (Numeric)"
                            }),
                            search.createColumn({ name: "createdfrom", label: "42 Created From" }),
                            // ADI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "location", label: "43 Location" }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({salesRep.firstname}, CONCAT(' ', {salesRep.lastname}))",
                                label: "44 Formula (Text)"
                            }),
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "tranid",
                                join: "createdFrom",
                                label: "45 Document Number"
                            }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({customer.firstname}, CONCAT('-', {customer.lastname}))",
                                label: "46 Formula (Text)"
                            }),
                            // FREE--------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_free_operation", label: "47 Transferencia Libre" }),
                        ]
                });
                var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column01 = searchResult[0].getValue(searchLoad.columns[0]);
                var column02 = searchResult[0].getValue(searchLoad.columns[1]);
                column02 = column02.split('/');
                column02 = column02[2] + '-' + column02[1] + '-' + column02[0];
                var column03 = searchResult[0].getValue(searchLoad.columns[2]);
                column03 = column03.split(' ');
                column03 = column03[1] + ':00';
                var column04 = searchResult[0].getValue(searchLoad.columns[3]);
                var column05 = searchResult[0].getValue(searchLoad.columns[4]);
                var column06 = searchResult[0].getValue(searchLoad.columns[5]);
                // EMI---------------------------------------------------------------------------------------------------------------------
                var column07 = searchResult[0].getValue(searchLoad.columns[6]);
                var column08 = searchResult[0].getValue(searchLoad.columns[7]);
                var column09 = searchResult[0].getValue(searchLoad.columns[8]);
                var column10 = searchResult[0].getValue(searchLoad.columns[9]);
                //var codubigeo = getUbigeo();
                var column11 = searchResult[0].getValue(searchLoad.columns[10]);
                var column12 = searchResult[0].getValue(searchLoad.columns[11]);
                var column13 = searchResult[0].getValue(searchLoad.columns[12]);
                var column14 = searchResult[0].getValue(searchLoad.columns[13]);
                var column15 = searchResult[0].getValue(searchLoad.columns[14]);
                var column16 = searchResult[0].getValue(searchLoad.columns[15]);
                var column17 = searchResult[0].getValue(searchLoad.columns[16]);
                var column18 = searchResult[0].getValue(searchLoad.columns[17]);
                var column19 = searchResult[0].getValue(searchLoad.columns[18]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column20 = searchResult[0].getValue(searchLoad.columns[19]);
                var column21 = searchResult[0].getValue(searchLoad.columns[20]);
                var column22 = searchResult[0].getValue(searchLoad.columns[21]);
                var column23 = searchResult[0].getValue(searchLoad.columns[22]);
                var column24 = searchResult[0].getValue(searchLoad.columns[23]);
                var column25 = searchResult[0].getValue(searchLoad.columns[24]);
                var column26 = searchResult[0].getValue(searchLoad.columns[25]);
                var column27 = searchResult[0].getValue(searchLoad.columns[26]);
                var column28 = searchResult[0].getValue(searchLoad.columns[27]);
                var column29 = searchResult[0].getValue(searchLoad.columns[28]);
                var column30 = searchResult[0].getValue(searchLoad.columns[29]);
                // CAB---------------------------------------------------------------------------------------------------------------------
                var column31 = searchResult[0].getValue(searchLoad.columns[30]);
                var column32 = searchResult[0].getValue(searchLoad.columns[31]);
                if (column32 != '') {
                    column32 = column32.split('/');
                    column32 = column32[2] + '-' + column32[1] + '-' + column32[0];
                }
                // ADI---------------------------------------------------------------------------------------------------------------------
                var column33 = searchResult[0].getText(searchLoad.columns[32]);
                var column34 = searchResult[0].getValue(searchLoad.columns[33]);
                var column35 = searchResult[0].getValue(searchLoad.columns[34]);
                var column36 = searchResult[0].getValue(searchLoad.columns[35]);
                var column37 = searchResult[0].getValue(searchLoad.columns[36]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column38 = searchResult[0].getText(searchLoad.columns[37]);
                var column39 = searchResult[0].getText(searchLoad.columns[38]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column40 = searchResult[0].getValue(searchLoad.columns[39]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column41 = searchResult[0].getValue(searchLoad.columns[40]);
                var column42 = searchResult[0].getValue(searchLoad.columns[41]);
                // ADI---------------------------------------------------------------------------------------------------------------------
                var column43 = searchResult[0].getText(searchLoad.columns[42]);
                var column44 = searchResult[0].getValue(searchLoad.columns[43]);
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column45 = searchResult[0].getValue(searchLoad.columns[44]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column46 = searchResult[0].getValue(searchLoad.columns[45]);
                if (column04 == '03') {
                    column22 = column46;
                }
                // FREE---------------------------------------------------------------------------------------------------------------------
                var column47 = searchResult[0].getValue(searchLoad.columns[46]);

                jsonIDE = {
                    numeracion: column01,
                    fechaEmision: column02,
                    horaEmision: column03,
                    codTipoDocumento: column04,
                    tipoMoneda: column05,
                    numeroOrdenCompra: column45,
                    fechaVencimiento: column32
                }

                jsonEMI = {
                    tipoDocId: column07,
                    numeroDocId: column08,
                    nombreComercial: column09,
                    razonSocial: column10,
                    //ubigeo: codubigeo.ubigeo,
                    direccion: column11 + ' ' + column12,
                    departamento: column13,
                    provincia: column14,
                    distrito: column15,
                    codigoPais: column16,
                    telefono: column17,
                    correoElectronico: column18,
                    codigoAsigSUNAT: column19
                }

                jsonREC = {
                    tipoDocId: column20,
                    numeroDocId: column21,
                    razonSocial: column22,
                    direccion: column23 + ' ' + column24,
                    departamento: column25,
                    provincia: column26,
                    distrito: column27,
                    codigoPais: column28,
                    telefono: column29,
                    correoElectronico: column30
                }

                var detail = getDetail(documentid, array, column47);
                var monto = NumeroALetras(detail.importetotal, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
                jsonLeyenda = [
                    {
                        codigo: "1000",
                        descripcion: monto
                    }
                ]

                //Objeto comodín para inicializar el json, luego será eliminado
                jsonCAB = {
                    inicializador: 'Inicializador, debe ser borrado'
                }

                if (column47 == false) {
                    var grav = detail.gravadas;
                    var aplydiscount = new Array();
                    if (grav != 'Vacio') {
                        if (detail.anydiscoutnigv === 'any') {
                            jsonCAB.gravadas = detail.gravadas;
                            aplydiscount = detail.totalimpuestosgra.pop();
                            var newtotalimpuestosgra = {
                                idImpuesto: aplydiscount.idImpuesto,
                                montoImpuesto: detail.montototalimpuestos.toString()
                            }
                            arrayCAB.push(newtotalimpuestosgra);
                        } else {
                            jsonCAB.gravadas = detail.gravadas;
                            arrayCAB.push(detail.totalimpuestosgra.pop());
                        }
                    }

                    var ina = detail.inafectas;
                    if (ina != 'Vacio') {
                        jsonCAB.inafectas = detail.inafectas;
                        arrayCAB.push(detail.totalimpuestosina.pop());
                    }

                    var exo = detail.exoneradas;
                    if (exo != 'Vacio') {
                        jsonCAB.exoneradas = detail.exoneradas;
                        arrayCAB.push(detail.totalimpuestosexo.pop());
                    }
                } else if (column47 == true) {
                    jsonLeyenda.push({
                        'codigo': '1002',
                        'descripcion': 'TRANSFERENCIA GRATUITA DE UN BIEN Y/O SERVICIO PRESTADO GRATUITAMENTE'
                    });
                    var grav = detail.gravadas;
                    var totalVentasGra = 0;
                    var montoImpuestoGra = 0;
                    var aplydiscount = new Array();
                    if (grav != 'Vacio') {
                        if (detail.anydiscoutnigv === 'any') {
                            jsonCAB.gravadas = detail.gravadas;
                            aplydiscount = detail.totalimpuestosgra.pop();
                            var newtotalimpuestosgra = {
                                idImpuesto: aplydiscount.idImpuesto,
                                montoImpuesto: detail.montototalimpuestos.toString()
                            }
                            arrayCAB.push(newtotalimpuestosgra);
                        } else {
                            totalVentasGra = detail.gravadas.totalVentas;
                            montoImpuestoGra = detail.totalimpuestosgra.pop();
                            montoImpuestoGra = montoImpuestoGra.montoImpuesto;
                        }
                    }

                    var ina = detail.inafectas;
                    var totalVentasIna = 0;
                    var montoImpuestoIna = 0;
                    if (ina != 'Vacio') {
                        totalVentasIna = detail.inafectas.totalVentas;
                        montoImpuestoIna = detail.totalimpuestosina.pop();
                        montoImpuestoIna = montoImpuestoIna.montoImpuesto;
                    }

                    var exo = detail.exoneradas;
                    var totalVentasExo = 0;
                    var montoImpuestoExo = 0;
                    if (exo != 'Vacio') {
                        totalVentasExo = detail.exoneradas.totalVentas;
                        montoImpuestoExo = detail.totalimpuestosexo.pop();
                        montoImpuestoExo = montoImpuestoExo.montoImpuesto;
                    }


                    jsonCAB.gratuitas = {
                        "codigo": "1004",
                        "totalVentas": (parseFloat(totalVentasGra) + parseFloat(totalVentasIna) + parseFloat(totalVentasExo)).toFixed(2)
                    }

                    arrayCAB.push({
                        "idImpuesto": "9996",
                        "montoImpuesto": (parseFloat(montoImpuestoGra) + parseFloat(montoImpuestoIna) + parseFloat(montoImpuestoExo)).toFixed(2)
                    });
                }

                var icbper = detail.totalimpuestoicbper;
                if (icbper.length != '') {
                    arrayCAB.push(icbper.pop());
                }

                jsonCAB.totalImpuestos = arrayCAB;
                jsonCAB.importeTotal = column47 == true ? '0.00' : detail.importetotal.toString();
                jsonCAB.tipoOperacion = column31;
                jsonCAB.leyenda = jsonLeyenda;
                jsonCAB.montoTotalImpuestos = column47 == true ? '0.00' : detail.montototalimpuestos.toString();

                if (typeof detail.cargodescuento != 'undefined') {
                    jsonCAB.totalDescuentos = detail.totaldescuentos;
                    jsonCAB.cargoDescuento = detail.cargodescuento;
                }
                delete jsonCAB.inicializador;

                if (column42 != '') {
                    fulfillment = openFulfillment(column42);
                }

                jsonADI = [
                    {
                        tituloAdicional: "@@codCliente",
                        valorAdicional: detail.codigocliente
                    },
                    {
                        tituloAdicional: "@@condPago",
                        valorAdicional: column33
                    },
                    {
                        tituloAdicional: "@@dirDestino",
                        valorAdicional: column34
                    },
                    {
                        tituloAdicional: "@@transportista",
                        valorAdicional: column35
                    },
                    {
                        tituloAdicional: "@@rucTransportista",
                        valorAdicional: column36
                    },
                    {
                        tituloAdicional: "@@placaVehic",
                        valorAdicional: column37
                    },
                    // {
                    //     tituloAdicional: "@@zona",
                    //     valorAdicional: codubigeo.codubigeo
                    // },
                    {
                        tituloAdicional: "@@modulo",
                        valorAdicional: column43
                    },
                    {
                        tituloAdicional: "@@nroInterno",
                        valorAdicional: column06
                    },
                    {
                        tituloAdicional: "@@vendedor",
                        valorAdicional: column44
                    },
                    // {
                    //     tituloAdicional: "@@localidad",
                    //     valorAdicional: codubigeo.ubigeolocalidad
                    // }
                ]

                if (fulfillment != 0) {
                    jsonDRF = [
                        {
                            tipoDocRelacionado: "09",
                            numeroDocRelacionado: fulfillment.guia
                        }
                    ]
                    // jsonADI.push({
                    //     tituloAdicional: "@@ordCarga",
                    //     valorAdicional: fulfillment.ordencarga
                    // });
                }

                jsonMain = {
                    IDE: jsonIDE,
                    EMI: jsonEMI,
                    REC: jsonREC,
                    DRF: jsonDRF,
                    CAB: jsonCAB,
                    DET: detail.det
                    // ADI: jsonADI
                }

                var filename = column08 + '-' + column04 + '-' + column01;
                if (column04 == '01') {
                    json = JSON.stringify({ "factura": jsonMain });
                } else if (column04 == '03') {
                    json = JSON.stringify({ "boleta": jsonMain });
                }

                return {
                    request: json,
                    filenameosce: filename,
                    numbering: column01,
                    serie: column39,
                    correlativo: column41,
                    emailrec: column40,
                    emisname: column10,
                    typedoc: column38,
                    typedoccode: column04,
                }
            } catch (e) {
                logError(array[0], array[1], 'Error-createRequest', JSON.stringify(e));
            }
        }


        function getDetail(documentid, array, freeop) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonTotalImpuestoICBPER = new Array();
            var jsonCargoDescuento = new Array();
            var jsonTotalDescuentos = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
            // Params for subtotal
            var montobasecargodescuento = '';
            //Flag discount
            var anydiscoutnigv = '';
            // var jsontest = new Array();

            try {
                var openRecord = '';
                try {
                    openRecord = record.load({ type: record.Type.INVOICE, id: documentid, isDynamic: true });
                } catch (error) {
                    openRecord = record.load({ type: record.Type.CASH_SALE, id: documentid, isDynamic: true });
                }
                var total = openRecord.getValue({ fieldId: 'total' });
                var taxtotal = openRecord.getValue({ fieldId: 'taxtotal' });
                var codcustomer = openRecord.getText({ fieldId: 'entity' });
                codcustomer = codcustomer.split(' ');
                codcustomer = codcustomer[0];
                var linecount = openRecord.getLineCount({ sublistId: 'item' });

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


                    var item_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
                    item_display = item_display.split(' ');
                    item_display = item_display[0];
                    var is_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: i });
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

                    if (itemtype == 'InvtPart' || itemtype == 'Service' || itemtype == 'NonInvtPart') {
                        precioVentaUnitario = (rate + (rate * (taxrate1 / 100)));
                        round = precioVentaUnitario.toString().split('.');
                        if (typeof round[1] != 'undefined') {
                            precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(7) : precioVentaUnitario;
                        }

                        if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
                            if (freeop == true) {
                                idimpuesto = '9996'; // Gratuito
                                codigo = '1004'; // Total valor de venta – Operaciones gratuitas
                                tipoAfectacion = '11'; // Gravado – Retiro por premio
                                sumtotalVentasGRA += amount;
                                summontoImpuestoGRA += montoimpuesto;
                                jsonGravadas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasGRA
                                }
                                rate = '0.00';
                                precioVentaUnitario = '0.00';
                            } else {
                                idimpuesto = '1000'; // Igv impuesto general a las ventas
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
                                tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                sumtotalVentasGRA += amount;
                                summontoImpuestoGRA += montoimpuesto;
                            }

                            try {
                                itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                                log.debug('AnyDiscount', itemtype_discount);
                            } catch (error) { }
                            if (itemtype_discount == 'Discount') {
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
                                rate = '0.00';
                                precioVentaUnitario = '0.00';
                            } else {
                                idimpuesto = '9997'; //Exonerado
                                codigo = '1003'; // Total valor de venta - operaciones exoneradas
                                tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                                sumtotalVentasEXO += amount;
                                summontoImpuestoEXO += montoimpuesto;
                            }

                            try {
                                itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                                log.debug('AnyDiscount', itemtype_discount);
                            } catch (error) { }

                            if (itemtype_discount == 'Discount') {
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
                        } else if (taxcode_display == 'IGV_PE:Inaf-PE') { // INAFECTAS
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
                                rate = '0.00';
                                precioVentaUnitario = '0.00';
                            } else {
                                idimpuesto = '9998'; // Inafecto
                                codigo = '1002'; // Total valor de venta - operaciones inafectas
                                tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                                sumtotalVentasINA += amount;
                                summontoImpuestoINA += montoimpuesto;
                            }
                            try {
                                itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                                log.debug('AnyDiscount', itemtype_discount);
                            } catch (error) { }

                            if (itemtype_discount == 'Discount') {
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
                        }

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
                            var montobasecargodscto = amount
                            amount = amount - amount_discount_line;
                            tax1amt = tax1amt - tax1amt_discount_line;

                            if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
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
                            } else if (taxcode_display == 'IGV_PE:E-PE') {
                                indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                                codigocargocescuento = '01'; // Descuentos que no afectan la base imponible del IGV
                                sumtotalVentasEXO -= amount_discount_line;
                                jsonExoneradas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasEXO.toFixed(2)
                                }
                            } else if (taxcode_display == 'IGV_PE:Inaf-PE') {
                                indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                                codigocargocescuento = '01'; // Descuentos que no afectan la base imponible del IGV
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

                        jsonTotalImpuestos.push({
                            idImpuesto: idimpuesto,
                            montoImpuesto: tax1amt.toFixed(2),
                            tipoAfectacion: tipoAfectacion,
                            montoBase: amount.toString(),
                            porcentaje: taxrate1.toString()
                        });

                        if (itemtype == 'NonInvtPart') {
                            var montoImp = 0.4 * parseInt(quantity);
                            tax1amt = (tax1amt + montoImp).toFixed(2);
                            taxtotal = parseFloat(taxtotal) + montoImp;
                            total = parseFloat(total) + montoImp;

                            jsonTotalImpuestoICBPER.push({
                                idImpuesto: '7152',
                                montoImpuesto: montoImp.toFixed(2)
                            });

                            jsonTotalImpuestos.push({
                                idImpuesto: '7152',
                                montoImpuesto: montoImp.toFixed(2),
                                tipoAfectacion: tipoAfectacion,
                                montoBase: quantity.toString(),
                                porcentaje: '0.40'
                            });
                        }

                        if (freeop == true) {
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: '1',
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: precioVentaUnitario.toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toString(),
                                valorRefOpOnerosas: amount.toString(),
                                montoTotalImpuestos: '0.00'
                            });
                        } else if (anydiscountline == 'any') {
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: precioVentaUnitario.toString(),
                                cargoDescuento: jsonCargoDescuentoLines,
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toString(),
                                montoTotalImpuestos: tax1amt.toFixed(2)
                            });
                        } else {
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: precioVentaUnitario.toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toString(),
                                montoTotalImpuestos: tax1amt.toString()
                            });
                        }
                    } else if (itemtype == 'Subtotal') {
                        montobasecargodescuento = amount; //subtotal
                    } else if (itemtype == 'Discount' && is_discount_line == false) {
                        if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
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
                    var newcalculate = jsonGravadas.totalVentas - amount;
                    jsonGravadas.totalVentas = newcalculate.toFixed(2);
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
                    totalimpuestosgra: jsonTotalImpuestosGRA,
                    totalimpuestosina: jsonTotalImpuestosINA,
                    totalimpuestosexo: jsonTotalImpuestosEXO,
                    totalimpuestoicbper: jsonTotalImpuestoICBPER,
                    importetotal: total.toFixed(2),
                    montototalimpuestos: taxtotal.toFixed(2),
                    codigocliente: codcustomer,
                    anydiscoutnigv: anydiscoutnigv
                }

                //! ACTIVAR PARA DESCUENTOS
                if (jsonCargoDescuento.length != 0) {
                    if (codigocargocescuento == '03') {
                        jsonReturn.totaldescuentos = jsonTotalDescuentos;
                    }
                    jsonReturn.cargodescuento = jsonCargoDescuento;
                }

                return jsonReturn;
            } catch (e) {
                logError(array[0], array[1], 'Error-getDetail', JSON.stringify(e));
            }
        }


        function createRequestCreditMemo(documentid, array) {
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
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))",
                                label: "1Formula (Text)"
                            }),
                            search.createColumn({ name: "trandate", label: "2Date" }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "'07'",
                                label: "3 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "symbol",
                                join: "Currency",
                                label: "4 Symbol"
                            }),
                            search.createColumn({ name: "otherrefnum", label: "5 PO/Check Number" }),
                            // EMI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "6",
                                label: "6 Formula (Numeric)"
                            }),
                            search.createColumn({
                                name: "taxidnum",
                                join: "subsidiary",
                                label: "7Tax ID"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {subsidiary.name} = 'Parent Company : Feniziam' THEN 'Feniziam' END",
                                label: "8Formula (Text)"
                            }),
                            search.createColumn({
                                name: "legalname",
                                join: "subsidiary",
                                label: "9Legal Name"
                            }),
                            search.createColumn({
                                name: "address1",
                                join: "subsidiary",
                                label: "10Address 1"
                            }),
                            search.createColumn({
                                name: "address2",
                                join: "subsidiary",
                                label: "11Address 2"
                            }),
                            search.createColumn({
                                name: "city",
                                join: "subsidiary",
                                label: "12City"
                            }),
                            search.createColumn({
                                name: "state",
                                join: "subsidiary",
                                label: "13State/Province"
                            }),
                            search.createColumn({
                                name: "address3",
                                join: "subsidiary",
                                label: "14Address 3"
                            }),
                            search.createColumn({ name: "billcountrycode", label: "15Billing Country Code" }),
                            search.createColumn({
                                name: "phone",
                                join: "subsidiary",
                                label: "16Phone"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "subsidiary",
                                label: "17Email"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "'0000'",
                                label: "18Formula (Text)"
                            }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' END",
                                label: "19Formula (Text)"
                            }),
                            search.createColumn({
                                name: "vatregnumber",
                                join: "customer",
                                label: "20Tax Number"
                            }),
                            search.createColumn({
                                name: "companyname",
                                join: "customer",
                                label: "21Company Name"
                            }),
                            search.createColumn({
                                name: "address1",
                                join: "customer",
                                label: "22Address 1"
                            }),
                            search.createColumn({
                                name: "address2",
                                join: "customer",
                                label: "23Address 2"
                            }),
                            search.createColumn({
                                name: "city",
                                join: "customer",
                                label: "24 City"
                            }),
                            search.createColumn({
                                name: "state",
                                join: "customer",
                                label: "25 State/Province"
                            }),
                            search.createColumn({
                                name: "address3",
                                join: "customer",
                                label: "26 Address 3"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "customer",
                                label: "27 Email"
                            }),
                            // DRF---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {createdFrom.custbody_pe_document_type} = 'Factura' THEN '01' WHEN {createdFrom.custbody_pe_document_type} = 'Boleta de Venta' THEN '03' END",
                                label: "28 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({createdFrom.custbody_pe_serie}, CONCAT('-', {createdFrom.custbody_pe_number}))",
                                label: "29 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "custrecord_pe_codigo_motivo",
                                join: "CUSTBODY_PE_REASON",
                                label: "30 PE Codigo Motivo"
                            }),
                            search.createColumn({
                                name: "name",
                                join: "CUSTBODY_PE_REASON",
                                label: "31 Name"
                            }),
                            // CAB---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "custrecord_pe_cod_fact",
                                join: "CUSTBODY_PE_EI_OPERATION_TYPE",
                                label: "32 PE Cod Fact"
                            }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_document_type", label: "33 PE Document Type" }),
                            search.createColumn({ name: "custbody_pe_serie", label: "34 PE Serie" }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "internalid",
                                join: "customer",
                                label: "35 Internal ID"
                            }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "TO_NUMBER({custbody_pe_number})",
                                label: "36 Formula (Numeric)"
                            }),
                            // ADI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_document_date_ref", label: "37 PE Document Date Ref" }),
                            search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "38 PE EI Forma de Pago" }),
                            search.createColumn({ name: "location", label: "39 Location" }),
                            search.createColumn({
                                name: "custbody_pe_delivery_address",
                                join: "createdFrom",
                                label: "40 PE Delivery address"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({createdFrom.custbody_pe_driver_name}, CONCAT(' ', {createdFrom.custbody_pe_driver_last_name}))",
                                label: "41 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "custbody_pe_car_plate",
                                join: "createdFrom",
                                label: "42 PE Car Plate"
                            }),
                            search.createColumn({
                                name: "custbody_pe_ruc_empresa_transporte",
                                join: "createdFrom",
                                label: "43 PE RUC Emp. Trans."
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({salesRep.firstname}, CONCAT(' ', {salesRep.lastname}))",
                                label: "44 Formula (Text)"
                            }),
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "duedate",
                                join: "createdFrom",
                                label: "45 Due Date/Receive By"
                            }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "createdfrom",
                                join: "createdFrom",
                                label: "46 Created From"
                            }),
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "createdfrom",
                                join: "createdFrom",
                                label: "47 Created From"
                            }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({customer.firstname}, CONCAT('-', {customer.lastname}))",
                                label: "48 Formula (Text)"
                            })
                            //search.createColumn({ name: "duedate", label: "45 Due Date/Receive By" }),
                        ]
                });

                var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column01 = searchResult[0].getValue(searchLoad.columns[0]);
                var column02 = searchResult[0].getValue(searchLoad.columns[1]);
                column02 = column02.split('/');
                column02 = column02[2] + '-' + column02[1] + '-' + column02[0];
                var column03 = searchResult[0].getValue(searchLoad.columns[2]);
                var column04 = searchResult[0].getValue(searchLoad.columns[3]);
                var column05 = searchResult[0].getValue(searchLoad.columns[4]);
                // EMI---------------------------------------------------------------------------------------------------------------------
                var column06 = searchResult[0].getValue(searchLoad.columns[5]);
                var column07 = searchResult[0].getValue(searchLoad.columns[6]);
                var column08 = searchResult[0].getValue(searchLoad.columns[7]);
                var column09 = searchResult[0].getValue(searchLoad.columns[8]);
                //var codubigeo = getUbigeo();
                var column10 = searchResult[0].getValue(searchLoad.columns[9]);
                var column11 = searchResult[0].getValue(searchLoad.columns[10]);
                var column12 = searchResult[0].getValue(searchLoad.columns[11]);
                var column13 = searchResult[0].getValue(searchLoad.columns[12]);
                var column14 = searchResult[0].getValue(searchLoad.columns[13]);
                var column15 = searchResult[0].getValue(searchLoad.columns[14]);
                var column16 = searchResult[0].getValue(searchLoad.columns[15]);
                var column17 = searchResult[0].getValue(searchLoad.columns[16]);
                var column18 = searchResult[0].getValue(searchLoad.columns[17]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column19 = searchResult[0].getValue(searchLoad.columns[18]);
                var column20 = searchResult[0].getValue(searchLoad.columns[19]);
                var column21 = searchResult[0].getValue(searchLoad.columns[20]);
                var column22 = searchResult[0].getValue(searchLoad.columns[21]);
                var column23 = searchResult[0].getValue(searchLoad.columns[22]);
                var column24 = searchResult[0].getValue(searchLoad.columns[23]);
                var column25 = searchResult[0].getValue(searchLoad.columns[24]);
                var column26 = searchResult[0].getValue(searchLoad.columns[25]);
                var column27 = searchResult[0].getValue(searchLoad.columns[26]);
                // DRF-------------------------------------------------
                var column28 = searchResult[0].getValue(searchLoad.columns[27]);
                var column29 = searchResult[0].getValue(searchLoad.columns[28]);
                var column30 = searchResult[0].getValue(searchLoad.columns[29]);
                var column31 = searchResult[0].getValue(searchLoad.columns[30]);
                // CAB---------------------------------------------------------------------------------------------------------------------
                var column32 = searchResult[0].getValue(searchLoad.columns[31]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column33 = searchResult[0].getText(searchLoad.columns[32]);
                var column34 = searchResult[0].getText(searchLoad.columns[33]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column35 = searchResult[0].getValue(searchLoad.columns[34]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column36 = searchResult[0].getValue(searchLoad.columns[35]);
                // ADI---------------------------------------------------------------------------------------------------------------------
                var column37 = searchResult[0].getValue(searchLoad.columns[36]);
                var column38 = searchResult[0].getText(searchLoad.columns[37]);
                var column39 = searchResult[0].getText(searchLoad.columns[38]);
                var column40 = searchResult[0].getValue(searchLoad.columns[39]);
                var column41 = searchResult[0].getValue(searchLoad.columns[40]);
                var column42 = searchResult[0].getValue(searchLoad.columns[41]);
                var column43 = searchResult[0].getValue(searchLoad.columns[42]);
                var column44 = searchResult[0].getValue(searchLoad.columns[43]);
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column45 = searchResult[0].getValue(searchLoad.columns[44]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column46 = searchResult[0].getValue(searchLoad.columns[45]);
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column47 = searchResult[0].getText(searchLoad.columns[46]);
                column47 = column47.split('#');
                column47 = column47[1];
                // REC---------------------------------------------------------------------------------------------------------------------
                var column48 = searchResult[0].getValue(searchLoad.columns[47]);
                if (column28 == '03') {
                    column21 = column48;
                }


                jsonIDE = {
                    numeracion: column01,
                    fechaEmision: column02,
                    //codTipoDocumento: column03,
                    tipoMoneda: column04
                    //numeroOrdenCompra: column05,
                    //fechaVencimiento: column45
                }

                jsonEMI = {
                    tipoDocId: column06,
                    numeroDocId: column07,
                    nombreComercial: column08,
                    razonSocial: column09,
                    //ubigeo: codubigeo.ubigeo,
                    direccion: column10 + ' ' + column11 + ' ' + column12 + ' ' + column13 + ' ' + column14,
                    // departamento: column12,
                    // provincia: column13,
                    // distrito: column14,
                    codigoPais: column15,
                    telefono: column16,
                    correoElectronico: column17,
                    codigoAsigSUNAT: column18
                }

                jsonREC = {
                    tipoDocId: column19,
                    numeroDocId: column20,
                    razonSocial: column21,
                    direccion: column22 + ' ' + column23,
                    // departamento: column24,
                    // provincia: column25,
                    // distrito: column26,
                    correoElectronico: column27
                }

                var detail = getDetailCreditMemo(documentid, array);

                // var flag = JSON.stringify(detail);
                // generateFileTXT('errortest2', flag, array);

                var monto = NumeroALetras(detail.importetotal, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
                jsonLeyenda = [
                    {
                        codigo: "1000",
                        descripcion: monto
                    }
                ]

                //Objeto comodín para inicializar el json, luego será eliminado
                jsonCAB = {
                    inicializador: 'Inicializador, debe ser borrado'
                }

                var grav = detail.gravadas;
                if (grav != 'Vacio') {
                    jsonCAB.gravadas = detail.gravadas;
                    arrayImporteTotal.push(parseFloat(detail.gravadas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosgra.pop());
                }

                var ina = detail.inafectas;
                if (ina != 'Vacio') {
                    jsonCAB.inafectas = detail.inafectas;
                    arrayImporteTotal.push(parseFloat(detail.inafectas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosina.pop());
                }

                var exo = detail.exoneradas;
                if (exo != 'Vacio') {
                    jsonCAB.exoneradas = detail.exoneradas;
                    arrayImporteTotal.push(parseFloat(detail.exoneradas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosexo.pop());
                }

                jsonCAB.totalImpuestos = arrayCAB;
                if (typeof detail.cargodescuento != 'undefined') {
                    jsonCAB.totalDescuentos = detail.totaldescuentos;
                }

                for (var i in arrayImporteTotal) {
                    sumaImporteTotal += arrayImporteTotal[i];
                }
                var importTotal = sumaImporteTotal + parseFloat(detail.montototalimpuestos);
                //var importTotal = parseFloat(detail.gravadas.totalVentas) + parseFloat(detail.inafectas.totalVentas) + parseFloat(detail.exoneradas.totalVentas) + parseFloat(detail.montototalimpuestos);
                jsonCAB.importeTotal = importTotal.toFixed(2)
                //jsonCAB.importeTotal = detail.importetotal.toString();
                jsonCAB.tipoOperacion = column32;
                jsonCAB.leyenda = jsonLeyenda;
                jsonCAB.montoTotalImpuestos = detail.montototalimpuestos;

                if (typeof detail.cargodescuento != 'undefined') {
                    // jsonCAB.totalDescuentos = detail.totaldescuentos;
                    jsonCAB.cargoDescuento = detail.cargodescuento;
                }
                delete jsonCAB.inicializador;

                var fulfillment = openFulfillment(column46);

                jsonDRF = [
                    {
                        tipoDocRelacionado: column28,
                        numeroDocRelacionado: column29,
                        codigoMotivo: column30,
                        descripcionMotivo: column31
                    }
                    // {
                    //     tipoDocRelacionado: "09",
                    //     numeroDocRelacionado: fulfillment.guia
                    // }
                ]

                jsonADI = [
                    {
                        tituloAdicional: "@@codCliente",
                        valorAdicional: detail.codigocliente
                    },
                    {
                        tituloAdicional: "@@condPago",
                        valorAdicional: column38
                    },
                    {
                        tituloAdicional: "@@dirDestino",
                        valorAdicional: column40
                    },
                    {
                        tituloAdicional: "@@transportista",
                        valorAdicional: column41
                    },
                    {
                        tituloAdicional: "@@rucTransportista",
                        valorAdicional: column43
                    },
                    {
                        tituloAdicional: "@@placaVehic",
                        valorAdicional: column42
                    },
                    // {
                    //     tituloAdicional: "@@zona",
                    //     valorAdicional: codubigeo.codubigeo
                    // },
                    {
                        tituloAdicional: "@@ordCarga",
                        valorAdicional: fulfillment.ordencarga
                    },
                    {
                        tituloAdicional: "@@modulo",
                        valorAdicional: column39
                    },
                    {
                        tituloAdicional: "@@nroInterno",
                        valorAdicional: column05
                    },
                    {
                        tituloAdicional: "@@fechaVenc",
                        valorAdicional: column37
                    },
                    {
                        tituloAdicional: "@@ordenCompra",
                        valorAdicional: column47
                    },
                    {
                        tituloAdicional: "@@vendedor",
                        valorAdicional: column44
                    },
                    // {
                    //     tituloAdicional: "@@localidad",
                    //     valorAdicional: codubigeo.ubigeolocalidad
                    // }
                ]

                jsonMain = {
                    IDE: jsonIDE,
                    EMI: jsonEMI,
                    REC: jsonREC,
                    DRF: jsonDRF,
                    CAB: jsonCAB,
                    DET: detail.det,
                    // ADI: jsonADI
                }

                var filename = column07 + '-' + column03 + '-' + column01;
                json = JSON.stringify({ "notaCredito": jsonMain });

                //log.debug({ title: 'Json', details: json });

                // var res = 'filenameosce: ' + filename + ' --  numbering:' + column01 + ' -- serie: ' +  column34 + ' -- correlativo: ' + column37 + ' -- emailrec: ' +  column36 + ' -- emisname: ' + column09 + ' -- typedoc: ' + column33 + ' -- typedoccode: ' + column03;
                // logError(array[0], array[1], 'Error-createRequestCreditMemo', res);
                return {
                    request: json,
                    filenameosce: filename,
                    numbering: column01,
                    serie: column34,
                    correlativo: column36,
                    emailrec: column35,
                    emisname: column09,
                    typedoc: column33,
                    typedoccode: column03
                };
            } catch (e) {
                logError(array[0], array[1], 'Error-createRequestCreditMemo', JSON.stringify(e));
            }
        }


        function getDetailCreditMemo(documentid, array) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
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

                        if (itemtype == 'InvtPart' || itemtype == 'Service') {
                            precioVentaUnitario = (rate + (rate * (taxrate1 / 100)));
                            round = precioVentaUnitario.toString().split('.');
                            if (typeof round[1] != 'undefined') {
                                precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(7) : precioVentaUnitario;
                            }
                            if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
                                idimpuesto = '1000'; // Igv impuesto general a las ventas
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
                                tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                sumtotalVentasGRA += amount;
                                summontoImpuestoGRA += montoimpuesto;
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
                                sumtotalVentasEXO += amount;
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
                                sumtotalVentasINA += amount;
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
                                montoImpuesto: tax1amt.toString(),
                                tipoAfectacion: tipoAfectacion,
                                montoBase: amount.toString(),
                                porcentaje: taxrate1.toString()
                            });

                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: precioVentaUnitario.toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toString(),
                                montoTotalImpuestos: tax1amt.toString()
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
            } catch (e) {
                logError(array[0], array[1], 'Error-getDetailCreditMemo', JSON.stringify(e));
            }
        }


        function createRequestDebitMemo(documentid, array) {
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
            var sumaImporteTotal = 0.0;
            try {
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
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))",
                                label: "1Formula (Text)"
                            }),
                            search.createColumn({ name: "trandate", label: "2Date" }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "'08'",
                                label: "3 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "symbol",
                                join: "Currency",
                                label: "4 Symbol"
                            }),
                            search.createColumn({ name: "otherrefnum", label: "5 PO/Check Number" }),
                            // EMI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "6",
                                label: "6 Formula (Numeric)"
                            }),
                            search.createColumn({
                                name: "taxidnum",
                                join: "subsidiary",
                                label: "7Tax ID"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {subsidiary.name} = 'Parent Company : Feniziam' THEN 'Feniziam' END",
                                label: "8Formula (Text)"
                            }),
                            search.createColumn({
                                name: "legalname",
                                join: "subsidiary",
                                label: "9Legal Name"
                            }),
                            search.createColumn({
                                name: "address1",
                                join: "subsidiary",
                                label: "10Address 1"
                            }),
                            search.createColumn({
                                name: "address2",
                                join: "subsidiary",
                                label: "11Address 2"
                            }),
                            search.createColumn({
                                name: "city",
                                join: "subsidiary",
                                label: "12City"
                            }),
                            search.createColumn({
                                name: "state",
                                join: "subsidiary",
                                label: "13State/Province"
                            }),
                            search.createColumn({
                                name: "address3",
                                join: "subsidiary",
                                label: "14Address 3"
                            }),
                            search.createColumn({ name: "billcountrycode", label: "15Billing Country Code" }),
                            search.createColumn({
                                name: "phone",
                                join: "subsidiary",
                                label: "16Phone"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "subsidiary",
                                label: "17Email"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "'0000'",
                                label: "18Formula (Text)"
                            }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' END",
                                label: "19Formula (Text)"
                            }),
                            search.createColumn({
                                name: "vatregnumber",
                                join: "customer",
                                label: "20Tax Number"
                            }),
                            search.createColumn({
                                name: "companyname",
                                join: "customer",
                                label: "21Company Name"
                            }),
                            search.createColumn({
                                name: "address1",
                                join: "customer",
                                label: "22Address 1"
                            }),
                            search.createColumn({
                                name: "address2",
                                join: "customer",
                                label: "23Address 2"
                            }),
                            search.createColumn({
                                name: "city",
                                join: "customer",
                                label: "24 City"
                            }),
                            search.createColumn({
                                name: "state",
                                join: "customer",
                                label: "25 State/Province"
                            }),
                            search.createColumn({
                                name: "address3",
                                join: "customer",
                                label: "26 Address 3"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "customer",
                                label: "27 Email"
                            }),
                            // DRF---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {custbody_pe_document_type_ref} = 'Factura' THEN '01' WHEN {custbody_pe_document_type_ref} = 'Boleta de Venta' THEN '03' END",
                                label: "28 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({custbody_pe_document_series_ref}, CONCAT('-', {custbody_pe_document_number_ref}))",
                                label: "29 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "custrecord_pe_codigo_motivo",
                                join: "CUSTBODY_PE_REASON",
                                label: "30 PE Codigo Motivo"
                            }),
                            search.createColumn({
                                name: "name",
                                join: "CUSTBODY_PE_REASON",
                                label: "31 Name"
                            }),
                            // CAB---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "custrecord_pe_cod_fact",
                                join: "CUSTBODY_PE_EI_OPERATION_TYPE",
                                label: "32 PE Cod Fact"
                            }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_document_type", label: "33 PE Document Type" }),
                            search.createColumn({ name: "custbody_pe_serie", label: "34 PE Serie" }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "internalid",
                                join: "customer",
                                label: "35 Internal ID"
                            }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "TO_NUMBER({custbody_pe_number})",
                                label: "36 Formula (Numeric)"
                            }),
                            // ADI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_document_date_ref", label: "37 PE Document Date Ref" }),
                            search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "38 PE EI Forma de Pago" }),
                            search.createColumn({ name: "location", label: "39 Location" }),
                            search.createColumn({
                                name: "custbody_pe_delivery_address",
                                join: "createdFrom",
                                label: "40 PE Delivery address"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({createdFrom.custbody_pe_driver_name}, CONCAT(' ', {createdFrom.custbody_pe_driver_last_name}))",
                                label: "41 Formula (Text)"
                            }),
                            search.createColumn({
                                name: "custbody_pe_car_plate",
                                join: "createdFrom",
                                label: "42 PE Car Plate"
                            }),
                            search.createColumn({
                                name: "custbody_pe_ruc_empresa_transporte",
                                join: "createdFrom",
                                label: "43 PE RUC Emp. Trans."
                            }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({salesRep.firstname}, CONCAT(' ', {salesRep.lastname}))",
                                label: "44 Formula (Text)"
                            }),
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "duedate",
                                join: "createdFrom",
                                label: "45 Due Date/Receive By"
                            }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "createdfrom",
                                join: "createdFrom",
                                label: "46 Created From"
                            }),
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "createdfrom",
                                join: "createdFrom",
                                label: "47 Created From"
                            }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({customer.firstname}, CONCAT('-', {customer.lastname}))",
                                label: "48 Formula (Text)"
                            })
                            //search.createColumn({ name: "duedate", label: "45 Due Date/Receive By" }),
                        ]
                });

                var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column01 = searchResult[0].getValue(searchLoad.columns[0]);
                var column02 = searchResult[0].getValue(searchLoad.columns[1]);
                column02 = column02.split('/');
                column02 = column02[2] + '-' + column02[1] + '-' + column02[0];
                var column03 = searchResult[0].getValue(searchLoad.columns[2]);
                var column04 = searchResult[0].getValue(searchLoad.columns[3]);
                var column05 = searchResult[0].getValue(searchLoad.columns[4]);
                // EMI---------------------------------------------------------------------------------------------------------------------
                var column06 = searchResult[0].getValue(searchLoad.columns[5]);
                var column07 = searchResult[0].getValue(searchLoad.columns[6]);
                var column08 = searchResult[0].getValue(searchLoad.columns[7]);
                var column09 = searchResult[0].getValue(searchLoad.columns[8]);
                //var codubigeo = getUbigeo();
                var column10 = searchResult[0].getValue(searchLoad.columns[9]);
                var column11 = searchResult[0].getValue(searchLoad.columns[10]);
                var column12 = searchResult[0].getValue(searchLoad.columns[11]);
                var column13 = searchResult[0].getValue(searchLoad.columns[12]);
                var column14 = searchResult[0].getValue(searchLoad.columns[13]);
                var column15 = searchResult[0].getValue(searchLoad.columns[14]);
                var column16 = searchResult[0].getValue(searchLoad.columns[15]);
                var column17 = searchResult[0].getValue(searchLoad.columns[16]);
                var column18 = searchResult[0].getValue(searchLoad.columns[17]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column19 = searchResult[0].getValue(searchLoad.columns[18]);
                var column20 = searchResult[0].getValue(searchLoad.columns[19]);
                var column21 = searchResult[0].getValue(searchLoad.columns[20]);
                var column22 = searchResult[0].getValue(searchLoad.columns[21]);
                var column23 = searchResult[0].getValue(searchLoad.columns[22]);
                var column24 = searchResult[0].getValue(searchLoad.columns[23]);
                var column25 = searchResult[0].getValue(searchLoad.columns[24]);
                var column26 = searchResult[0].getValue(searchLoad.columns[25]);
                var column27 = searchResult[0].getValue(searchLoad.columns[26]);
                // DRF-------------------------------------------------
                var column28 = searchResult[0].getValue(searchLoad.columns[27]);
                var column29 = searchResult[0].getValue(searchLoad.columns[28]);
                var column30 = searchResult[0].getValue(searchLoad.columns[29]);
                var column31 = searchResult[0].getValue(searchLoad.columns[30]);
                // CAB---------------------------------------------------------------------------------------------------------------------
                var column32 = searchResult[0].getValue(searchLoad.columns[31]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column33 = searchResult[0].getText(searchLoad.columns[32]);
                var column34 = searchResult[0].getText(searchLoad.columns[33]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column35 = searchResult[0].getValue(searchLoad.columns[34]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column36 = searchResult[0].getValue(searchLoad.columns[35]);
                // ADI---------------------------------------------------------------------------------------------------------------------
                var column37 = searchResult[0].getValue(searchLoad.columns[36]);
                var column38 = searchResult[0].getText(searchLoad.columns[37]);
                var column39 = searchResult[0].getText(searchLoad.columns[38]);
                var column40 = searchResult[0].getValue(searchLoad.columns[39]);
                var column41 = searchResult[0].getValue(searchLoad.columns[40]);
                var column42 = searchResult[0].getValue(searchLoad.columns[41]);
                var column43 = searchResult[0].getValue(searchLoad.columns[42]);
                var column44 = searchResult[0].getValue(searchLoad.columns[43]);
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column45 = searchResult[0].getValue(searchLoad.columns[44]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var column46 = searchResult[0].getValue(searchLoad.columns[45]);
                // IDE---------------------------------------------------------------------------------------------------------------------
                var column47 = searchResult[0].getText(searchLoad.columns[46]);
                column47 = column47.split('#');
                column47 = column47[1];
                // REC---------------------------------------------------------------------------------------------------------------------
                var column48 = searchResult[0].getValue(searchLoad.columns[47]);
                if (column28 == '03') {
                    column21 = column48;
                }


                jsonIDE = {
                    numeracion: column01,
                    fechaEmision: column02,
                    //codTipoDocumento: column03,
                    tipoMoneda: column04
                    //numeroOrdenCompra: column05,
                    //fechaVencimiento: column45
                }

                jsonEMI = {
                    tipoDocId: column06,
                    numeroDocId: column07,
                    nombreComercial: column08,
                    razonSocial: column09,
                    //ubigeo: codubigeo.ubigeo,
                    direccion: column10 + ' ' + column11 + ' ' + column12 + ' ' + column13 + ' ' + column14,
                    // departamento: column12,
                    // provincia: column13,
                    // distrito: column14,
                    codigoPais: column15,
                    telefono: column16,
                    correoElectronico: column17,
                    codigoAsigSUNAT: column18
                }

                jsonREC = {
                    tipoDocId: column19,
                    numeroDocId: column20,
                    razonSocial: column21,
                    direccion: column22 + ' ' + column23,
                    // departamento: column24,
                    // provincia: column25,
                    // distrito: column26,
                    correoElectronico: column27
                }

                var detail = getDetailDebitMemo(documentid, array);

                //var flag = JSON.stringify(detail);
                //generateFileTXT('errortest2', flag, array);

                var monto = NumeroALetras(detail.importetotal, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
                jsonLeyenda = [
                    {
                        codigo: "1000",
                        descripcion: monto
                    }
                ]

                //Objeto comodín para inicializar el json, luego será eliminado
                jsonCAB = {
                    inicializador: 'Inicializador, debe ser borrado'
                }

                var grav = detail.gravadas;
                if (grav != 'Vacio') {
                    jsonCAB.gravadas = detail.gravadas;
                    arrayImporteTotal.push(parseFloat(detail.gravadas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosgra.pop());
                }

                var ina = detail.inafectas;
                if (ina != 'Vacio') {
                    jsonCAB.inafectas = detail.inafectas;
                    arrayImporteTotal.push(parseFloat(detail.inafectas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosina.pop());
                }

                var exo = detail.exoneradas;
                if (exo != 'Vacio') {
                    jsonCAB.exoneradas = detail.exoneradas;
                    arrayImporteTotal.push(parseFloat(detail.exoneradas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosexo.pop());
                }

                jsonCAB.totalImpuestos = arrayCAB;
                if (typeof detail.cargodescuento != 'undefined') {
                    jsonCAB.totalDescuentos = detail.totaldescuentos;
                }

                for (var i in arrayImporteTotal) {
                    sumaImporteTotal += arrayImporteTotal[i];
                }
                var importTotal = sumaImporteTotal + parseFloat(detail.montototalimpuestos);
                //var importTotal = parseFloat(detail.gravadas.totalVentas) + parseFloat(detail.inafectas.totalVentas) + parseFloat(detail.exoneradas.totalVentas) + parseFloat(detail.montototalimpuestos);
                jsonCAB.sumOtrosCargos = '0.00'
                jsonCAB.importeTotal = importTotal.toFixed(2);
                jsonCAB.totalAnticipos = '0.00'
                //jsonCAB.importeTotal = detail.importetotal.toString();
                jsonCAB.tipoOperacion = column32;
                jsonCAB.leyenda = jsonLeyenda;
                jsonCAB.montoTotalImpuestos = detail.montototalimpuestos;

                if (typeof detail.cargodescuento != 'undefined') {
                    // jsonCAB.totalDescuentos = detail.totaldescuentos;
                    jsonCAB.cargoDescuento = detail.cargodescuento;
                }
                delete jsonCAB.inicializador;

                //var fulfillment = openFulfillment(column46);

                jsonDRF = [
                    {
                        tipoDocRelacionado: column28,
                        numeroDocRelacionado: column29,
                        codigoMotivo: column30,
                        descripcionMotivo: column31
                    }
                    // {
                    //     tipoDocRelacionado: "09",
                    //     numeroDocRelacionado: fulfillment.guia
                    // }
                ]

                //?Activar para Fulfillment
                // jsonADI = [
                //     {
                //         tituloAdicional: "@@codCliente",
                //         valorAdicional: detail.codigocliente
                //     },
                //     {
                //         tituloAdicional: "@@condPago",
                //         valorAdicional: column38
                //     },
                //     {
                //         tituloAdicional: "@@dirDestino",
                //         valorAdicional: column40
                //     },
                //     {
                //         tituloAdicional: "@@transportista",
                //         valorAdicional: column41
                //     },
                //     {
                //         tituloAdicional: "@@rucTransportista",
                //         valorAdicional: column43
                //     },
                //     {
                //         tituloAdicional: "@@placaVehic",
                //         valorAdicional: column42
                //     },
                //     // {
                //     //     tituloAdicional: "@@zona",
                //     //     valorAdicional: codubigeo.codubigeo
                //     // },
                //     {
                //         tituloAdicional: "@@ordCarga",
                //         valorAdicional: fulfillment.ordencarga
                //     },
                //     {
                //         tituloAdicional: "@@modulo",
                //         valorAdicional: column39
                //     },
                //     {
                //         tituloAdicional: "@@nroInterno",
                //         valorAdicional: column05
                //     },
                //     {
                //         tituloAdicional: "@@fechaVenc",
                //         valorAdicional: column37
                //     },
                //     {
                //         tituloAdicional: "@@ordenCompra",
                //         valorAdicional: column47
                //     },
                //     {
                //         tituloAdicional: "@@vendedor",
                //         valorAdicional: column44
                //     },
                //     // {
                //     //     tituloAdicional: "@@localidad",
                //     //     valorAdicional: codubigeo.ubigeolocalidad
                //     // }
                // ]

                jsonMain = {
                    IDE: jsonIDE,
                    EMI: jsonEMI,
                    REC: jsonREC,
                    DRF: jsonDRF,
                    CAB: jsonCAB,
                    DET: detail.det
                    // ADI: jsonADI
                }

                var filename = column07 + '-' + column03 + '-' + column01;
                json = JSON.stringify({ "notaDebito": jsonMain });

                //!Activar para envío
                return {
                    request: json,
                    filenameosce: filename,
                    numbering: column01,
                    serie: column34,
                    correlativo: column36,
                    emailrec: column35,
                    emisname: column09,
                    typedoc: column33,
                    typedoccode: column03
                };
            } catch (e) {
                logError(array[0], array[1], 'Error-createRequestDebitMemo', JSON.stringify(e));
            }
        }


        function getDetailDebitMemo(documentid, array) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
            var anydiscount = false;
            var factorcargodescuento = 0.0;


            try {
                var openRecord = record.load({ type: record.Type.INVOICE, id: documentid, isDynamic: true });
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

                        if (itemtype == 'InvtPart' || itemtype == 'Service') {
                            precioVentaUnitario = (rate + (rate * (taxrate1 / 100)));
                            round = precioVentaUnitario.toString().split('.');
                            if (typeof round[1] != 'undefined') {
                                precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(7) : precioVentaUnitario;
                            }
                            if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
                                idimpuesto = '1000'; // Igv impuesto general a las ventas
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
                                tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                sumtotalVentasGRA += amount;
                                summontoImpuestoGRA += montoimpuesto;
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
                                sumtotalVentasEXO += amount;
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
                                sumtotalVentasINA += amount;
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
                                montoImpuesto: tax1amt.toString(),
                                tipoAfectacion: tipoAfectacion,
                                montoBase: amount.toString(),
                                porcentaje: taxrate1.toString()
                            });

                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: rate.toString(),
                                precioVentaUnitario: precioVentaUnitario.toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: amount.toString(),
                                montoTotalImpuestos: tax1amt.toString()
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
            } catch (e) {
                logError(array[0], array[1], 'Error-getDetailDebitMemo', JSON.stringify(e));
            }
        }


        function base64Encoded(content) {
            var base64encoded = encode.convert({
                string: content,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            return base64encoded;
        }


        function base64Decoded(content) {
            var base64decoded = encode.convert({
                string: content,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            });
            return base64decoded;
        }


        function generateFileTXT(namefile, content, array) {
            try {
                var fileObj = file.create({
                    name: namefile + '.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: content,
                    encoding: file.Encoding.UTF8,
                    folder: FOLDER_EXCEPTIONS,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (e) {
                logError(array[0], array[1], 'Error-generateFileTXT', e.message);
            }
        }


        function generateFilePDF(namefile, content, array) {
            try {
                var fileObj = file.create({
                    name: namefile + '.pdf',
                    fileType: file.Type.PDF,
                    contents: content,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (e) {
                logError(array[0], array[1], 'Error-generateFilePDF', e.message);
            }
        }


        function generateFileXML(namefile, content, array) {
            try {
                var xml = base64Decoded(content);
                var fileObj = file.create({
                    name: namefile + '.xml',
                    fileType: file.Type.XMLDOC,
                    contents: xml,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (e) {
                logError(array[0], array[1], 'Error-generateFileXML', e.message);
            }
        }


        function generateFileCDR(namefile, content, array) {
            try {
                var cdr = base64Decoded(content);
                var fileObj = file.create({
                    name: namefile + '-CDR.xml',
                    fileType: file.Type.XMLDOC,
                    contents: cdr,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (e) {
                logError(array[0], array[1], 'Error-generateFileCDR', e.message);
            }
        }


        function generateFileJSON(namefile, content, array) {
            try {
                var fileObj = file.create({
                    name: namefile + '.json',
                    fileType: file.Type.JSON,
                    contents: content,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (e) {
                logError(array[0], array[1], 'Error-generateFileJSON', e.message);
            }
        }


        function sendEmail(success, arrayheader, arraybody, recordtype, array) {
            try {
                var sender = arrayheader[0];
                var recipient = arrayheader[1];
                var emisname = arrayheader[2];
                var tranid = arrayheader[3];
                var typedoc = arrayheader[4];
                var docstatus = arrayheader[5];
                var pdfid = arrayheader[6];
                var xmlid = arrayheader[7];
                var cdrid = arrayheader[8];
                var jsonid = arrayheader[9];
                var encodepdf = arrayheader[10];
                var internalid = arraybody[0];

                var subject = emisname + " - " + typedoc + "  " + tranid + ": " + docstatus;
                var body = '';
                if (success) {
                    body += '<p>Este es un mensaje automático de EVOL Latinoamerica.</p>';
                    body += '<p>Se ha generado la ' + typedoc + ' <b>' + tranid + '</b> con Internal ID <b>' + internalid + '</b> y estado <b>' + docstatus + '</b>.</p>';
                } else {
                    body += '<p>Este es un mensaje de error automático de EVOL Latinoamerica .</p>';
                    body += '<p>Se produjo un error al emitir la ' + typedoc + ' <b>' + tranid + '</b> con Internal ID <b>' + internalid + '</b> y estado <b>' + docstatus + '</b>.</p>';
                    // if (mensajeError != '') {
                    //     body += '<p>El error es el siguiente:</p>';
                    //     body += '<p>' + mensajeError + '</p>';
                    // }
                }

                var filepdf = file.load({ id: pdfid });
                var filexml = file.load({ id: xmlid });
                var filecdr = file.load({ id: cdrid });
                var filejson = file.load({ id: jsonid });

                email.send({
                    author: sender,
                    recipients: [recipient],
                    subject: subject,
                    body: body,
                    attachments: [filepdf, filexml, filecdr, filejson]
                });

                var setrecord = setRecord(recordtype, internalid, tranid, filepdf.url, filexml.url, filecdr.url, filejson.url, encodepdf, array);
                return setrecord;
            } catch (e) {
                logError(array[0], array[1], 'Error-SendEmail', e.message);
            }
        }


        function setRecord(recordtype, internalid, tranid, urlpdf, urlxml, urlcdr, urljson, encodepdf, array) {
            var recordload = '';
            try {
                if (recordtype != '') {
                    try {
                        recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                    } catch (error) {
                        recordload = record.load({ type: record.Type.CASH_SALE, id: internalid, isDynamic: true });
                    }
                } else {
                    recordload = record.load({ type: record.Type.CREDIT_MEMO, id: internalid });
                }

                recordload.setValue('custbody_pe_fe_ticket_id', tranid);
                recordload.setValue('custbody_pe_ei_printed_xml_req', urljson);
                recordload.setValue('custbody_pe_ei_printed_xml_res', urlxml);
                recordload.setValue('custbody_pe_ei_printed_cdr_res', urlcdr);
                recordload.setValue('custbody_pe_ei_printed_pdf', urlpdf);
                recordload.setValue('custbody_pe_ei_printed_pdf_codificado', encodepdf);
                recordload.save();

                return 'Sent';
            } catch (e) {
                logError(array[0], array[1], 'Error-setRecord', e.message);
            }
        }


        function openCredentials(array) {
            try {
                var credentials = search.lookupFields({
                    type: 'customrecord_pe_ei_enable_features_2',
                    id: 1,
                    columns: ['custrecord_pe_ei_url_ws_2', 'custrecord_pe_ei_user_2', 'custrecord_pe_ei_password_2', 'custrecord_pe_ei_employ_copy_2']
                });

                return {
                    wsurl: credentials.custrecord_pe_ei_url_ws,
                    username: credentials.custrecord_pe_ei_user,
                    password: credentials.custrecord_pe_ei_password,
                    recipients: credentials.custrecord_pe_ei_employ_copy[0].value
                }
            } catch (e) {
                logError(array[0], array[1], 'Error-openCredentials', e.message);
            }
        }


        function sleep(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds) {
                    break;
                }
            }
        }


        function random() {
            return Math.random().toString(36).substr(2); // Eliminar `0.`
        }


        function token() {
            return random() + random() + random() + random() + random(); // Para hacer el token más largo
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
                log.error('getUnit', e);
            }
        }


        function openFulfillment(ov) {
            var guia = '';
            try {
                var itemfulfillmentSearchObj = search.create({
                    type: "itemfulfillment",
                    filters:
                        [
                            ["type", "anyof", "ItemShip"],
                            "AND",
                            ["createdfrom.internalid", "anyof", ov]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "createdfrom", label: "Created From" }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))",
                                label: "Formula (Text)"
                            })
                        ]
                });
                var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
                if (searchResultCount != 0) {
                    var searchResult = itemfulfillmentSearchObj.run().getRange({ start: 0, end: 1 });
                    var ordencarga = searchResult[0].getValue(itemfulfillmentSearchObj.columns[0]);
                    guia = searchResult[0].getValue(itemfulfillmentSearchObj.columns[2]);
                    return {
                        ordencarga: ordencarga,
                        guia: guia
                    }
                } else {
                    return 0;
                }
            } catch (e) {

            }
        }


        function getUbigeo() {
            try {
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                        [
                            ["internalid", "anyof", "3"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "custrecord_pe_cod_ubigeo",
                                join: "address",
                                label: "PE Cod Ubigeo"
                            }),
                            search.createColumn({
                                name: "custrecord_pe_ubigeo",
                                join: "address",
                                label: "PE Ubigeo"
                            })
                        ]
                });
                var searchResult = subsidiarySearchObj.run().getRange({ start: 0, end: 1 });
                var ubigeo = searchResult[0].getValue(subsidiarySearchObj.columns[0]);
                var ubigeolocalidad = searchResult[0].getText(subsidiarySearchObj.columns[1]);
                return {
                    ubigeo: ubigeo,
                    ubigeolocalidad: ubigeolocalidad
                }
            } catch (e) {

            }
        }


        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_pe_ei_document_status' });
                logStatus.setValue('custrecord_pe_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status', docstatus);
                logStatus.save();
            } catch (e) {

            }
        }


        function logError(internalid, userid, docstatus, response) {
            try {
                var logError = record.create({ type: 'customrecord_pe_ei_log_documents_2' });
                logError.setValue('custrecord_pe_ei_log_related_transaction_2', internalid);
                logError.setValue('custrecord_pe_ei_log_subsidiary_2', 1);
                logError.setValue('custrecord_pe_ei_log_employee_2', userid);
                logError.setValue('custrecord_pe_ei_log_status_2', docstatus);
                logError.setValue('custrecord_pe_ei_log_response_2', response);
                logError.save();
            } catch (e) {

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
                letrasCentavos: '',
                letrasMonedaPlural: currency.plural || 'SOLES',//'PESOS', 'Dólares', 'Bolívares', 'etcs'
                letrasMonedaSingular: currency.singular || 'SOL', //'PESO', 'Dólar', 'Bolivar', 'etc'
                letrasMonedaCentavoPlural: currency.centPlural || 'CENTIMOS',
                letrasMonedaCentavoSingular: currency.centSingular || 'CENTIMO'
            };

            if (data.centavos > 0) {
                data.letrasCentavos = 'CON ' + (function () {
                    if (data.centavos == 1)
                        return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                    else
                        return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
                })();
            };

            if (data.enteros == 0)
                return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
            if (data.enteros == 1)
                return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
            else
                return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        }


        return {
            send: send
        };
    });
/***************************************************************************************************************
TRACKING
/***************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 01/12/2021
Author: Dennis Fernández
Description: Creación del script.
==============================================================================================================*/
/* Commit:02
Version: 1.0
Date: 22/11/2021
Author: Dennis Fernández
Description: Desarrollo de proceso de envío a OSCE.
==============================================================================================================*/
/* Commit:03
Version: 2.0
Date: 13/12/2021
Author: Dennis Fernández
Description: Desarrollo de proceso mapeo NC.
==============================================================================================================*/
/* Commit:04
Version: 3.0
Date: 27/12/2021
Author: Dennis Fernández
Description: Desarrollo de proceso descuentos.
==============================================================================================================*/
/* Commit:05
Version: 3.1
Date: 31/12/2021
Author: Dennis Fernández
Description: Desarrollo de proceso monto en letras.
==============================================================================================================*/
/* Commit:06
Version: 3.1
Date: 10/01/2022
Author: Dennis Fernández
Description: Se realiza carga de first and last name for set company field when type doc is boleta..
==============================================================================================================*/