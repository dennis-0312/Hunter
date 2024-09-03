/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/encode', 'N/file', 'N/format', 'N/https', 'N/record', 'N/search', './umploadparts.js'],
    /**
 * @param{email} email
 * @param{encode} encode
 * @param{file} file
 * @param{format} format
 * @param{https} https
 * @param{record} record
 * @param{search} search
 */
    (email, encode, file, format, https, record, search, multiPartUpload_1) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */

        const FOLDER_PDF = 8338; // Path -> SuiteScripts/TS NET Scripts/Peru
        const CUSTOM_RECORD_EI_ENABLED_FEATURES = 'customrecord_pe_ei_enable_features';
        var url_token = '';
        var url_ticket = '';
        var url_document = '';
        var url_pdf = '';
        var url_xml = '';
        var url_cdr = '';

        const execute = (scriptContext) => {
            internalId = 111301;
            userId = 4;

            // var userMail = pluginContext.sender.email;
            // var tranID = pluginContext.transaction.number;
            // var senderDetails = pluginContext.sender;
            var customer = 27397;
            //var transaction = pluginContext.transaction;
            //var recipientList = customer.recipients;
            var tranType = 'vendorcredit'
            var result = {};
            var parameters;
            var docstatus = 'Sent'
            var request;
            var send = new Array();
            var statustrasanction = '';
            var sendresponsecode = 'Completed Process';
            var docstatus1 = 'Sending Failed';
            var array = [internalId, userId, tranType];

            // logStatus(internalId, 'Debug4 ' + JSON.stringify(transaction));
            // logStatus(internalId, 'Debug5 ' + tranType);
            result = {
                success: true,
                message: 'Transaction'/*JSON.stringify(transaction)*/
            };

            try {
                var getcredentials = openCredentials(array);
                url_token = getcredentials.wsurl;
                url_ticket = getcredentials.wsticket;
                url_document = getcredentials.wsdocument;
                url_pdf = getcredentials.wspdf;
                url_xml = getcredentials.wsxml;
                url_cdr = getcredentials.wscdr;
                var request = getIdentifyDocument(internalId);
                logStatus(internalId, request);
                logStatus(internalId, getcredentials);
                log.debug('track2', request);
                log.debug('track1', getcredentials);
                var headers1 = new Array();
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = 'Basic Y2xpZW50OnNlY3JldA==';

                var respAsset = https.post({
                    url: url_token +
                        "?username=" + getcredentials.username +
                        "&password=" + getcredentials.password +
                        "&grant_type=password",
                    headers: headers1
                });
                var reponse = JSON.parse(respAsset.body);
                log.debug('track3', reponse);
                logStatus(internalId, reponse);
                var tiket = '';
                var newtikect = getSentDocument(request.filename, reponse.access_token);
                newtikect = JSON.parse(newtikect.pdf);
                log.debug('track8', newtikect);
                logStatus(internalId, newtikect);
                if (newtikect.tickets) {
                    tiket = newtikect.tickets[0];
                    logStatus(internalId, 'entro newtikect.tickets');
                    log.debug('track7', 'entro newtikect.tickets');
                    var getpdf = getDocumentPDF(tiket, reponse.access_token);
                    logStatus(internalId, getpdf);
                    log.debug('track4', getpdf);
                    var filepdf = generateFilePDF(request.filename, getpdf.pdf);
                    log.debug('track12', filepdf);
                    logStatus(internalId, filepdf);
                    if (filepdf == false) {
                        send = sendDocument(request.filename, request.request, reponse.access_token);
                        sleep(15000);
                        tiket = send.description;
                    }
                } else {
                    log.debug('track23', 'entro sendDocument');
                    send = sendDocument(request.filename, request.request, reponse.access_token);
                    log.debug('track24', send);
                    logStatus(internalId, send);
                    sleep(15000);
                    tiket = send.description;

                }
                //logStatus(array[0], send.description);
                if (send.code == '0' || filepdf) {
                    log.debug('track6', send.description);
                    var estatus = recuperarArchivos(tiket, reponse.access_token, request.filename, internalId, tranType);
                    result.success = estatus.success;
                    result.message = estatus.message
                } else {
                    result.success = false;
                    result.message = send.description /*|| codestatus.description*/ || 'Fallo Envio';
                }
            } catch (error) {

                result = {
                    success: false,
                    message: error.message
                };
            }
            return result;
        }

        function recuperarArchivos(tiket, access_token, filename, internalId, tranType) {
            var access_token = access_token;
            var tiket = tiket;
            var filename = filename;
            var tranType = tranType;
            var internalId = internalId;
            var getpdf = getDocumentPDF(tiket, access_token);
            var filepdf = generateFilePDF(filename, getpdf.pdf);
            log.debug('track13', send.description);
            log.debug('track14', getpdf);
            log.debug('track15', JSON.parse(getpdf.pdf));

            if (filepdf == false) {
                var statusTrans = JSON.parse(getpdf.pdf);
                //logStatus(internalId, statusTrans);
                if (statusTrans.code == "-9998" || statusTrans.code == "1033" || statusTrans.code == "0100") {
                    var newtikect = getSentDocument(filename, access_token);
                    sleep(15000);
                    //logStatus(internalId, newtikect);
                    log.debug('track16', newtikect);
                    newtikect = JSON.parse(newtikect.pdf)
                    if (newtikect.tickets) {
                        var returns = recuperarArchivos(newtikect.tickets[0], access_token, filename, internalId, tranType);
                        return returns
                    } else {
                        //logStatus(internalId, 'entro');
                        if (newtikect.code == "0100") {
                            var returns2 = recuperarArchivos(tiket, access_token, filename, internalId, tranType);
                            log.debug('track17', returns2);
                            return returns2
                            //logStatus(internalId, returns2);

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
                var getxml = getDocumentXML(tiket, access_token);
                var getcdr = getDocumentCDR(tiket, access_token);
                var filexml = generateFileXML(filename, getxml.pdf);
                var filecdr = generateFileCDR(filename, getcdr.pdf);
                var recordSet = setRecord(tranType, internalId, filepdf, filexml, filecdr)
                log.debug('track18', getxml);
                log.debug('track19', getcdr);
                log.debug('track20', retfilexmlurns2);
                log.debug('track21', filecdr);
                log.debug('track22', recordSet);
                return {
                    success: true,
                    message: 'Registro Correcto'
                };
            }
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

                var credentials = search.create({
                    type: CUSTOM_RECORD_EI_ENABLED_FEATURES,
                    filters: [search.createFilter({ name: "custrecord_pe_ei_subsidiary", operator: search.Operator.IS, values: [searchResult[0].getValue({ name: "subsidiary" })] })],
                    columns: [
                        "internalid",
                        "custrecord_pe_ei_user",
                        "custrecord_pe_ei_password",
                        "custrecord_pe_ei_employ_copy",
                        "custrecord_pe_ei_url_ws",
                        "custrecord_pe_ei_url_get_ticket",
                        "custrecord_pe_ei_url_post_document",
                        "custrecord_pe_ei_url_get_pdf",
                        "custrecord_pe_ei_url_get_xml",
                        "custrecord_pe_ei_url_get_cdr"
                    ]
                });

                var searchResults = credentials.run().getRange({ start: 0, end: 1 });
                // var credentials = search.lookupFields({
                //     type: CUSTOM_RECORD_EI_ENABLED_FEATURES,
                //     id: searchResults[0].getValue({ name: "internalid" }),
                //     columns: ['custrecord_pe_ei_url_ws', 'custrecord_pe_ei_user', 'custrecord_pe_ei_password', 'custrecord_pe_ei_employ_copy']
                // });

                return {
                    username: searchResults[0].getValue({ name: "custrecord_pe_ei_user" }),
                    password: searchResults[0].getValue({ name: "custrecord_pe_ei_password" }),
                    wsurl: searchResults[0].getValue({ name: "custrecord_pe_ei_url_ws" }),
                    wsticket: searchResults[0].getValue({ name: "custrecord_pe_ei_url_get_ticket" }),
                    wsdocument: searchResults[0].getValue({ name: "custrecord_pe_ei_url_post_document" }),
                    wspdf: searchResults[0].getValue({ name: "custrecord_pe_ei_url_get_pdf" }),
                    wsxml: searchResults[0].getValue({ name: "custrecord_pe_ei_url_get_xml" }),
                    wscdr: searchResults[0].getValue({ name: "custrecord_pe_ei_url_get_cdr" })
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
                        search.createColumn({ name: "custbody_pe_ei_printed_xml_req", label: "request" })
                    ]
            });

            var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            var typedoccode = searchResult[0].getValue(searchLoad.columns[0]);
            var numbering = searchResult[0].getValue(searchLoad.columns[1]);
            var correlativo = searchResult[0].getValue(searchLoad.columns[2]);
            var serie = searchResult[0].getText({ name: "custbody_pe_serie", label: "serie" });
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

        function getDocumentPDF(documento, token) {
            var headers1 = new Array();
            try {
                headers1['Accept'] = '*/*';
                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url_pdf + documento,
                    body: '',
                    headers: headers1
                });
                log.debug('track5', response);
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

        function getSentDocument(documento, token) {
            var headers1 = new Array();
            try {

                headers1['Accept'] = '*/*';
                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url_ticket + documento,
                    body: '',
                    headers: headers1
                });
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

        function getDocumentXML(documento, token) {
            var headers1 = new Array();
            try {
                headers1['Accept'] = '*/*';
                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url_xml + documento,
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

        function getDocumentCDR(documento, token) {
            var headers1 = new Array();
            try {
                headers1['Accept'] = '*/*';
                headers1['Authorization'] = 'Bearer ' + token;
                var response = https.get({
                    url: url_cdr + documento,
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

        function sendDocument(filename, request, access_token) {
            var headers1 = new Array();
            try {
                var files = [
                    { name: filename, value: file.load({ id: request }) } // file cabinet ids; you can use dynamic files
                ];

                var headers = [];
                headers['Accept'] = '*/*';
                headers['Authorization'] = 'Bearer ' + access_token;
                var resp = multiPartUpload_1.uploadParts(url_document, headers, files);
                resp = JSON.parse(resp.body);
                return resp;

            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-sendDocument', JSON.stringify(e));
            }
        }

        function generateFilePDF(namefile, content) {
            try {
                log.debug('track26', namefile)
                log.debug('track27', content)
                var fileObj = file.create({
                    name: namefile + '.pdf',
                    fileType: file.Type.PDF,
                    contents: content,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                log.debug('track28', fileid)
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
                logStatus.setValue('custrecord_pe_ei_document_status_2', JSON.stringify(docstatus));
                var recordLog = logStatus.save();
            } catch (error) {
                logStatus(internalId, error);
                log.error('error-logStatus', error);
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

        return { execute }

    });
