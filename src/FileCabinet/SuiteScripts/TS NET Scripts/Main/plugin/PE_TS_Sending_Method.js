/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['N/email', 'N/encode', 'N/format', 'N/https', 'N/record', 'N/search', 'N/file', './umploadparts.js', 'N/runtime'],
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
    function (email, encode, format, https, record, search, file, multiPartUpload_1, runtime) {
        var recordtype = '';
        var internalId = '';
        var userId = '';
        var FOLDER_PDF = '';
        var script = runtime.getCurrentScript();
        var remainingUsage = script.getRemainingUsage();

        function send(pluginContext) {
            internalId = pluginContext.transaction.id;
            userId = pluginContext.sender.id;
            var transaction = pluginContext.transaction;
            var tranType = pluginContext.transaction.tranType
            var result = {};
            var request;
            var send = new Array();
            var array = [internalId, userId, tranType];
            FOLDER_PDF = BuscarFolder();
            // logStatus(internalId, 'Debug4 ' + JSON.stringify(transaction));
            // logStatus(internalId, 'Debug5 ' + tranType);

            result = {
                success: true,
                message: JSON.stringify(transaction)
            };

            try {
                var getcredentials = openCredentials(array);

                var request = getIdentifyDocument(internalId);

                logStatus(internalId, request);
                var headers1 = [];
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = 'Basic Y2xpZW50OnNlY3JldA==';

                var respAsset = https.post({
                    url: getcredentials.token + "?username=" + getcredentials.username + "&password=" + getcredentials.password + "&grant_type=password",
                    headers: headers1
                });
                var reponse = JSON.parse(respAsset.body);
                var tiket = '';
                var newtikect = getSentDocument(request.filename, reponse.access_token, getcredentials.ticket);

                newtikect = JSON.parse(newtikect.pdf)
                logStatus(internalId, newtikect);
                logStatus(internalId, 'File: ' + request.filename + ' - Request: ' + request.request);
                // saveFelTrace(internalId, 'SEND', 'Actividad 1', userId, JSON.stringify(newtikect));
                if (newtikect.tickets) {
                    tiket = newtikect.tickets[0];

                    var getpdf = getDocumentPDF(tiket, reponse.access_token, getcredentials.pdf);


                    var filepdf = generateFilePDF(request.filename, getpdf.pdf);
                    // saveFelTrace(internalId, 'SEND', 'Actividad 2', userId, JSON.stringify(filepdf));
                    if (filepdf == false) {
                        send = sendDocument(request.filename, request.request, reponse.access_token, getcredentials.document);
                        /* var tiempoInicio = new Date().getTime();
                        var tiempoTranscurrido = 0;
                        while (tiempoTranscurrido < 8000) {
                            tiempoTranscurrido = new Date().getTime() - tiempoInicio;
                        }*/
                        tiket = send.description;
                    }
                } else {
                    send = sendDocument(request.filename, request.request, reponse.access_token, getcredentials.document);
                    tiket = send.description;
                }

                //logStatus(array[0], send.description);
                //  
                // saveFelTrace(internalId, 'SEND', 'Actividad 3', userId, JSON.stringify(send));
                // saveFelTrace(internalId, 'SEND', 'Actividad 4', userId, JSON.stringify(filepdf));

                if (send.code == '0' || filepdf) {
                    var estatus = recuperarArchivos(tiket, reponse.access_token, request.filename, internalId, tranType, 1, getcredentials);
                    //saveFelTrace(internalId, 'SEND', 'Actividad 5', userId, JSON.stringify(estatus));
                    result.success = estatus.success;
                    result.message = '(Efact) ' + estatus.message
                } else {
                    result.success = false;
                    result.message = send.description || 'Fallo Envio';
                }
            } catch (error) {

                result = {
                    success: false,
                    message: error.message
                };
            }

            return result;
        }
        function BuscarFolder() {
            try {
                var folder = '';
                var tmpSearch = search.create({
                    type: search.Type.FOLDER,
                    filters:
                        [
                            ["name", search.Operator.IS, 'Docs'],
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "0.InternalId" }),
                        ]
                });
                var resultSet = tmpSearch.run().getRange({ start: 0, end: 50 });

                if (resultSet === '' || resultSet === null) {
                    var tmpfolder = search.create({
                        type: search.Type.FOLDER,
                        columns: [
                            search.createColumn({ name: "internalid", label: "0.InternalId" }),
                        ],
                        filters: [
                            ["name", search.Operator.IS, 'TS NET Scripts']
                        ]
                    });
                    var objResultfolder = tmpfolder.run().getRange(0, 50);
                    var varRecordFolder = record.create({
                        type: 'folder'
                    });
                    varRecordFolder.setValue('name', 'Docs');
                    varRecordFolder.setValue('parent', objResultfolder[0].getValue('internalid'));
                    folder = varRecordFolder.save();
                } else {
                    folder = resultSet[0].getValue('internalid')
                }
                return folder;
            } catch (e) {
                return e;
            }

        }
        function recuperarArchivos(tiket, access_token, filename, internalId, tranType, attempt, getcredentials) {
            var access_token = access_token;
            var tiket = tiket;
            var filename = filename;
            var tranType = tranType;
            var internalId = internalId;
            var maxAttempts = 15;
            remainingUsage = script.getRemainingUsage();
            var getpdf = getDocumentPDF(tiket, access_token, getcredentials.pdf);
            var filepdf = generateFilePDF(filename, getpdf.pdf);

            if (remainingUsage < 100) {
                return {
                    success: false,
                    message: 'Se alcanzo el límite de intentos, No se puede recuperar los archivos : ' + JSON.stringify(getpdf)
                };
            }

            if (filepdf == false) {

                var statusTrans = JSON.parse(getpdf.pdf);
                logStatus(internalId, statusTrans);
                if (statusTrans.code == "-9998" || statusTrans.code == "1033" || statusTrans.code == "0100") {

                    var newtikect = getSentDocument(filename, access_token, getcredentials.ticket);
                    //saveFelTrace(internalId, 'RECUPERARARCHIVOS', 'getSentDocument' + filename, userId, JSON.stringify(newtikect));
                    // saveFelTrace(internalId, 'RECUPERARARCHIVOS', 'Timeout start - ' + attempt, userId, getDateTime('GMT-5'));
                    // sleep(15000);
                    //sleepV2(20000);
                    //   saveFelTrace(internalId, 'RECUPERARARCHIVOS', 'Timeout ends - ' + attempt, userId, getDateTime('GMT-5'));
                    // logStatus(internalId, newtikect);
                    newtikect = JSON.parse(newtikect.pdf)

                    if (newtikect.tickets) {
                        var returns = recuperarArchivos(newtikect.tickets[0], access_token, filename, internalId, tranType, Number(attempt) + 1, getcredentials);
                        return returns
                    } else {
                        logStatus(internalId, 'entro');
                        if (newtikect.code == "0100") {

                            var returns2 = recuperarArchivos(tiket, access_token, filename, internalId, tranType, Number(attempt) + 1, getcredentials);
                            return returns2
                            logStatus(internalId, returns2);
                        } else {
                            return {
                                success: false,
                                message: newtikect.description
                            }
                        }

                    }



                } else {
                    return {
                        success: false,
                        message: statusTrans.description
                    };
                }


            } else {
                var getxml = getDocumentXML(tiket, access_token, getcredentials.xml);
                var getcdr = getDocumentCDR(tiket, access_token, getcredentials.cdr);

                var filexml = generateFileXML(filename, getxml.pdf);
                var filecdr = generateFileCDR(filename, getcdr.pdf);
                var recordSet = setRecord(tranType, internalId, filepdf, filexml, filecdr)
                return {
                    success: true,
                    message: 'Registro Correcto'
                };
            }





            //
        }
        function openCredentials(array) {
            try {
                var accountSearch = search.create({
                    type: array[2],
                    filters: [
                        search.createFilter({
                            name: "internalid", operator: search.Operator.IS, values: [array[0]]
                        })
                    ],
                    columns: ["subsidiary"]
                });

                var searchResult = accountSearch.run().getRange({ start: 0, end: 1 });

                var accountSearchs = search.create({
                    type: 'customrecord_pe_ei_enable_features',
                    filters: [
                        search.createFilter({
                            name: "custrecord_pe_ei_subsidiary", operator: search.Operator.IS, values: [searchResult[0].getValue({ name: "subsidiary" })]
                        })
                    ],
                    columns: ["internalid"]
                });

                var searchResults = accountSearchs.run().getRange({ start: 0, end: 1 });

                var credentials = search.lookupFields({
                    type: 'customrecord_pe_ei_enable_features',
                    id: searchResults[0].getValue({ name: "internalid" }),
                    columns: ['custrecord_pe_ei_url_ws', 'custrecord_pe_ei_url_get_pdf', 'custrecord_pe_ei_url_get_cdr', 'custrecord_pe_ei_url_get_xml', 'custrecord_pe_ei_url_post_document', 'custrecord_pe_ei_url_get_ticket', 'custrecord_pe_ei_user', 'custrecord_pe_ei_password', 'custrecord_pe_ei_employ_copy']
                });

                return {
                    token: credentials.custrecord_pe_ei_url_ws,
                    ticket: credentials.custrecord_pe_ei_url_get_ticket,
                    document: credentials.custrecord_pe_ei_url_post_document,
                    pdf: credentials.custrecord_pe_ei_url_get_pdf,
                    xml: credentials.custrecord_pe_ei_url_get_xml,
                    cdr: credentials.custrecord_pe_ei_url_get_cdr,
                    username: credentials.custrecord_pe_ei_user,
                    password: credentials.custrecord_pe_ei_password
                }
            } catch (e) {
                //logError(array[0], array[1], 'Error-openCredentials', e.message);
            }
        }

        function getIdentifyDocument(internalid) {

            var searchLoad = search.create({
                type: "transaction",
                filters:
                    [
                        [["type", "anyof", "CustCred"], "OR", ["type", "anyof", "CustInvc"], "OR", ["type", "anyof", "ItemShip"], "OR", ["type", "anyof", "VendCred"], "OR", ["type", "anyof", "CashSale"]],
                        "AND",
                        ["internalid", "anyof", internalid]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_pe_code_document_type", join: "custbody_pe_document_type", label: "document" }),
                        search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),
                        search.createColumn({ name: "formulanumeric", formula: "TO_NUMBER({custbody_pe_number})", label: "correlativo" }),
                        search.createColumn({ name: "custbody_pe_serie", label: "serie" }),
                        search.createColumn({ name: "custbody_pe_serie_cxp", label: "serie2" }),
                        search.createColumn({ name: "internalid", join: "customer", label: "emailrec" }),
                        search.createColumn({ name: "legalname", join: "subsidiary", label: "emisname" }),
                        search.createColumn({ name: "custbody_pe_document_type", label: "typedoc" }),
                        search.createColumn({ name: "taxidnum", join: "subsidiary", label: "rucemi" }),
                        search.createColumn({ name: "custbody_pe_ei_printed_xml_req", label: "request" }),
                        search.createColumn({ name: "custrecord_pe_serie_impresion", join: "CUSTBODY_PE_SERIE", label: "SerieImpresion" })
                    ]
            });

            var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            var typedoccode = searchResult[0].getValue(searchLoad.columns[0]);
            var numbering = searchResult[0].getValue(searchLoad.columns[1]);
            var correlativo = searchResult[0].getValue(searchLoad.columns[2]);
            // var serie = searchResult[0].getText({ name: "custbody_pe_serie", label: "serie" });
            var serie = searchResult[0].getValue({ name: "custrecord_pe_serie_impresion", join: "CUSTBODY_PE_SERIE", label: "SerieImpresion" });
            if (!serie) {
                serie = searchResult[0].getValue({ name: "custbody_pe_serie_cxp", label: "serie2" });
            }
            var emailrec = searchResult[0].getValue({ name: "internalid", join: "customer", label: "emailrec" });
            var emisname = searchResult[0].getValue({ name: "legalname", join: "subsidiary", label: "emisname" });
            var typedoc = searchResult[0].getText({ name: "custbody_pe_document_type", label: "typedoc" });
            var rucemi = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary", label: "rucemi" });
            var request = searchResult[0].getValue({ name: "custbody_pe_ei_printed_xml_req", label: "request" });
            var filename = rucemi + '-' + typedoccode + '-' + serie + '-' + correlativo;

            //logStatus(documentid, JSON.parse(request));
            return {
                typedoccode: typedoccode,
                numbering: numbering,
                correlativo: correlativo,
                serie: serie,
                emailrec: emailrec,
                emisname: emisname,
                typedoc: typedoc,
                filename: filename,
                request: request
            }

        }

        function getDocumentPDF(documento, token, url) {
            var headers1 = new Array();
            try {
                headers1['Accept'] = '*/*';
                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url + documento,
                    body: '',
                    headers: headers1
                });
                log.debug('response-pdf', response);
                //var body = JSON.parse(response.body);
                //logStatus(internalId, 'Debug3 ' + JSON.stringify(pdf));
                return {
                    pdf: response.body
                }
            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-getDocumentPDF', JSON.stringify(e));
            }
        }
        function getSentDocument(documento, token, url) {
            var headers1 = new Array();
            try {

                headers1['Accept'] = '*/*';

                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url + documento,
                    body: '',
                    headers: headers1
                });
                log.debug('response', response);
                //var body = JSON.parse(response.body);

                //logStatus(internalId, 'Debug3 ' + JSON.stringify(pdf));

                return {

                    pdf: response.body
                }
            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-getDocumentPDF', JSON.stringify(e));
            }
        }


        function getDocumentXML(documento, token, url) {
            var headers1 = new Array();
            try {

                headers1['Accept'] = '*/*';

                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url + documento,
                    body: '',
                    headers: headers1
                });
                log.debug('response', response);
                //var body = JSON.parse(response.body);

                //logStatus(internalId, 'Debug3 ' + JSON.stringify(pdf));

                return {

                    pdf: response.body
                }
            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-getDocumentPDF', JSON.stringify(e));
            }
        }
        function getDocumentCDR(documento, token, url) {
            var headers1 = new Array();
            try {

                headers1['Accept'] = '*/*';
                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url + documento,
                    body: '',
                    headers: headers1
                });
                log.debug('response', response);
                //var body = JSON.parse(response.body);

                //logStatus(internalId, 'Debug3 ' + JSON.stringify(pdf));
                return {
                    pdf: response.body
                }
            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-getDocumentPDF', JSON.stringify(e));
            }
        }


        function sendDocument(filename, request, access_token, url) {
            var headers1 = new Array();
            try {
                var files = [
                    { name: filename, value: file.load({ id: request }) } // file cabinet ids; you can use dynamic files

                ];

                var headers = [];
                headers['Accept'] = '*/*';
                headers['Authorization'] = 'Bearer ' + access_token;

                var resp = multiPartUpload_1.uploadParts(url, headers, files);
                resp = JSON.parse(resp.body);
                return resp;

            } catch (error) {

                return error;
                //logError(array[0], array[1], 'Error-sendDocument', JSON.stringify(e));
            }
        }


        function generateFilePDF(namefile, content) {
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
            } catch (error) {
                return false;
                // logStatus(internalId, error);
                //logError(array[0], array[1], 'Error-generateFilePDF', e.message);
            }
        }


        function generateFileXML(namefile, content) {
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
                //logError(array[0], array[1], 'Error-generateFileXML', e.message);
            }
        }

        function generateFileCDR(namefile, content) {
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
                //logError(array[0], array[1], 'Error-generateFileCDR', e.message);
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

        //<I> rhuaccha: 2024-08-20
        function sleepV2(ms) {
            var start = new Date().getTime();
            while (new Date().getTime() < start + ms) { }
        }
        //<F> rhuaccha: 2024-08-20


        function random() {
            return Math.random().toString(36).substr(2); // Eliminar `0.`
        }


        function token() {
            return random() + random() + random() + random() + random(); // Para hacer el token más largo
        }


        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_pe_ei_document_status' });
                logStatus.setValue('custrecord_pe_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status', docstatus);
                logStatus.save();
            } catch (error) {
                logStatus(internalId, error);
            }
        }


        function logError(internalid, response) {
            try {
                var logError = record.create({ type: 'customrecord_pe_ei_log_documents' });
                logError.setValue('custrecord_pe_ei_log_related_transaction', internalid);
                logError.setValue('custrecord_pe_ei_log_subsidiary', 3);
                logError.setValue('custrecord_pe_ei_log_employee', plugInContext.userIdd);
                logError.setValue('custrecord_pe_ei_log_status', 'Error');
                logError.setValue('custrecord_pe_ei_log_response', response);
                logError.save();
            } catch (e) {

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
                //var filejson = file.load({ id: jsonid });

                email.send({
                    author: sender,
                    recipients: [recipient],
                    subject: subject,
                    body: body,
                    attachments: [filepdf, filexml, filecdr]
                });

                var setrecord = setRecord(recordtype, internalid, tranid, filepdf.url, filexml.url, filecdr.url, 0, encodepdf, array);
                return setrecord;
            } catch (error) {

                //logError(array[0], array[1], 'Error-SendEmail', e.message);
            }
        }


        //function setRecord(recordtype, internalid, tranid, urlpdf, urlxml, urlcdr, urljson, encodepdf, array) {
        function setRecord(recordtype, internalid, urlpdf, urlxml, urlcdr) {
            var recordload = '';
            try {
                if (recordtype == 'invoice') {
                    recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                } else if (recordtype == 'creditmemo') {
                    recordload = record.load({ type: record.Type.CREDIT_MEMO, id: internalid });
                } else if (recordtype == 'vendorcredit') {
                    recordload = record.load({ type: 'vendorcredit', id: internalid });
                } else if (recordtype == 'itemfulfillment') {
                    recordload = record.load({ type: 'itemfulfillment', id: internalid });
                }
                else if (recordtype == 'cashsale') {
                    recordload = record.load({ type: 'cashsale', id: internalid });
                }
                //logStatus(internalId, 'internalid: ' + internalid + '-' + urlxml);
                //recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                //recordload.setValue('custbody_pe_fe_ticket_id', tranid);
                //recordload.setValue('custbody_pe_ei_printed_xml_request', urljson);
                recordload.setValue('custbody_pe_ei_printed_xml_res', urlxml);
                recordload.setValue('custbody_pe_ei_printed_cdr_res', urlcdr);
                recordload.setValue('custbody_pe_ei_printed_pdf', urlpdf);
                //recordload.setValue('custbody_pe_ei_printed_pdf_codificado', encodepdf);
                recordload.save();
                // recordload = record.create({type: 'customrecord_pe_ei_printed_fields',isDynamic: true});
                // recordload.setValue('name', tranid);
                // recordload.setValue('custrecord_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custrecord_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custrecord_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custrecord_pe_ei_printed_cdr_res', urlcdr);
                // recordload.save();
                return recordload;
            } catch (error) {

                //logError(array[0], array[1], 'Error-setRecord', e.message);
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

        //<I> rhuaccha: 2024-08-19
        function saveFelTrace(transactionId, event, message, userId, additional) {

            var process = record.create({
                type: 'customrecord_ts_fel_custom_trace'
            });
            var timeStamp = getDateTime('GMT-5');
            process.setValue('custrecord_ts_transacction', transactionId);
            process.setValue('custrecord_ts_time_stamp', timeStamp);
            process.setValue('custrecord_ts_event', event);
            process.setValue('custrecord_ts_message', message);
            process.setValue('custrecord_ts_user', userId);
            process.setValue('custrecord_ts_additional', additional);
            process.save();

        }


        function getDateTime(timeZone) {
            var currentDate = new Date();
            var offset = Number(timeZone.replace('GMT', '')) * 60 * 60 * 1000; // Convertir horas a milisegundos
            var utcDate = new Date(currentDate.getTime() + offset);

            var year = utcDate.getUTCFullYear();
            /*var month = String(utcDate.getUTCMonth() + 1).padStart(2, '0'); // El mes está indexado desde 0
            var day = String(utcDate.getUTCDate()).padStart(2, '0');
            var hours = String(utcDate.getUTCHours()).padStart(2, '0');
            var minutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
            var seconds = String(utcDate.getUTCSeconds()).padStart(2, '0');*/
            var month = String(utcDate.getUTCMonth() + 1); // El mes está indexado desde 0
            var day = String(utcDate.getUTCDate());
            var hours = String(utcDate.getUTCHours());
            var minutes = String(utcDate.getUTCMinutes());
            var seconds = String(utcDate.getUTCSeconds());
            var formattedDateTime = day + '-' + month + '-' + year + ' ' + hours + ':' + minutes + ':' + seconds;

            return formattedDateTime;
        }
        //<F> rhuaccha: 2024-08-19

        return {
            send: send
        };
    });