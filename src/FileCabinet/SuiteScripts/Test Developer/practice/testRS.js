/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/file', 'N/xml', 'N/encode', 'N/render', 'N/query', 'N/record'], (log, file, xml, encode, render, query, record) => {
    const URL = 'https://7451241-sb1.app.netsuite.com';

    const _get = (requestParams) => {
        // try {
        //     //let res = funcXML();
        //     //let res = funcINI();
        //     //let res = getImage(requestParams);
        //     //let res = funcXLS();
        //     //let res = funcXMLLoad();
        //     let res = funcXMLModify();
        //     return res;
        // } catch (error) {
        //     log.debug('Error', error);
        // }

        try {
            let sql = 'SELECT co.*, dt.custrecord_ht_mc_ubicacion FROM customrecord_ht_co_cobertura co ' +
                'INNER JOIN customrecord_ht_record_mantchaser dt ON co.custrecord_ht_co_numeroserieproducto = dt.id ' +
                'WHERE co.custrecord_ht_co_bien = ? AND co.custrecord_ht_co_familia_prod = ?';
            sql = 'SELECT COUNT(*) as cantidad FROM customrecord_ht_nc_servicios_instalados ' +
                'WHERE custrecord_ns_orden_servicio_si = ? AND custrecord_ns_orden_trabajo = ?';
            sql = 'SELECT foreigntotal, custbody_ht_af_ejecucion_relacionada FROM transaction WHERE id = ?';
            sql = 'SELECT * FROM CUSTOMRECORD_NCFAR_ASSETTYPE WHERE id = ?'
            sql = 'SELECT it.assetaccount as inventoryaccount, af.custrecord_assettypeassetacc as fixedassetaccount FROM item it ' +
                'INNER JOIN customrecord_ncfar_assettype af ON it.custitem_ht_ar_tipoactivo = af.id ' +
                'WHERE it.id = ?';
            sql = 'SELECT * FROM transaction WHERE id = ?';

            sql = 'SELECT it.displayname FROM customrecord_ht_record_mantchaser dt ' +
                'INNER JOIN customrecord_ht_record_detallechaserdisp di ON dt.custrecord_ht_mc_seriedispositivo = di.id ' +
                'INNER JOIN item it ON di.custrecord_ht_dd_dispositivo = it.id ' +
                'WHERE dt.id = ?';
            sql = 'SELECT * FROM transaction WHERE id = ?'

            // sql = 'SELECT it.displayname FROM customrecord_ht_record_mantchaser dt ' +
            //     'INNER JOIN customrecord_ht_record_detallechaslojack di ON dt.custrecord_ht_mc_seriedispositivolojack = di.id ' +
            //     'INNER JOIN item it ON di.custrecord_ht_cl_lojack = it.id ' +
            //     'WHERE dt.id = ?';
            //let params = [requestParams.bien, requestParams.familia];
            //let params = [requestParams.service, requestParams.work]
            //let params = [requestParams.adjustid]
            //let params = [requestParams.item]
            //let params = [requestParams.chaser]
            let params = [requestParams.ordenTrabajoid];
            let resultSet = query.runSuiteQL({ query: sql, params: params });
            let results = resultSet.asMappedResults()/*[0]['cantidad']*/;
            if (results.length > 0) {
                return results//[0]['displayname']/*[0]['custrecord_ht_co_producto'] == null ? 0 : 1*/
            } else {
                return 0;
            }
            // let response = createJournalEntrySalidaConAlquiler(requestParams.item, requestParams.adjustid, requestParams.location);
            // return response;
        } catch (error) {
            return error;
        }
    }


    const _post = (context) => {
        try {
            let res = postPDF(context);
            return res;
        } catch (error) {
            log.debug('Error', error);
        }
    }

    const _put = (context) => { }

    const funcXML = () => {
        const param1 = 'Dennis Fernández'
        let sentence = '';
        let body = '';
        body += '<?xml version="1.0" encoding="UTF-8"?>';
        body += '<bookstore xmlns:b="http://www.qualifiednamespace.com/book">';
        body += '<b:book category="web">';
        body += '<b:title lang="en">Harry Potter</b:title>';
        body += '<b:author>' + param1 + '</b:author>';
        body += '</b:book>';
        body += '<b:book category="children">';
        body += '<b:title lang="en">Harry Potter 2</b:title>';
        body += '<b:author>James McGovern</b:author>';
        body += '</b:book>';
        body += '</bookstore>';


        let fileObj = file.create({
            name: 'test.xml',
            fileType: file.Type.XMLDOC,
            encoding: file.Encoding.UTF_8,
            contents: body
        });
        // fileObj.encoding = file.Encoding.MAC_ROMAN;
        fileObj.folder = 609;
        let fileId = fileObj.save();
        log.debug('fileId-Saved', fileId);
        //let xmlDocument = file.load({ id: fileId }); // POR ID
        let xmlDocument = file.load({ id: 'SuiteScripts/Test Developer/Archivos/test.xml' });// POR RUTA
        log.debug('xmlDocument', xmlDocument + ' - ' + xmlDocument.size);
        let xmlFileContent = xmlDocument.getContents();
        log.debug('Contents', xmlFileContent);
        //===================================================
        let reencoded = encode.convert({
            string: xmlFileContent,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
        if (xmlDocument.size < 10485760) {
            let xmlDocument = xml.Parser.fromString({ text: xmlFileContent });
            let bookNode = xml.XPath.select({ node: xmlDocument, xpath: '//b:book' });
            for (let i = 0; i < bookNode.length; i++) {
                let title = bookNode[i].getElementsByTagName({ tagName: 'b:title' })[0].textContent;
                let author = bookNode[i].getElementsByTagName({ tagName: 'b:author' })[0].textContent;
                sentence += 'Author: ' + author + ' wrote ' + title + '.\n';
            }
            log.debug('Sentence', sentence);
            // options.response.write(sentence);
        }
        return { contenido: reencoded };
    }

    const funcXMLLoad = () => {
        var xmlString = '<?xml version="1.0" encoding="UTF-8"?><config date="1465467658668" transient="false">Some content</config>';

        var xmlDocument = xml.Parser.fromString({
            text: xmlString
        });

        var bookNode = xml.XPath.select({
            node: xmlDocument,
            xpath: '//config'
        });

        for (var i = 0; i < bookNode.length; i++) {
            log.debug('Config content', bookNode[i].textContent);
        }
        return { contenido: true };
    }

    const funcXMLModify = () => {
        // var xmlData = file.load({ id: 2562 });

        // var bookShelf = xml.Parser.fromString(xmlData.getContents());
        // log.debug('Contexnt', bookShelf);
        // var newBookNode = bookShelf.createElement("book");
        // var newTitleNode = bookShelf.createElement("title");
        // var newTitleNodeValue = bookShelf.createTextNode("");
        // var newAuthorNode = bookShelf.createElement("author");
        // var newAuthorNodeValue = bookShelf.createTextNode("");
        // newTitleNode.appendChild(newTitleNodeValue);
        // newAuthorNode.appendChild(newAuthorNodeValue);
        // newBookNode.appendChild(newTitleNode);
        // newBookNode.appendChild(newAuthorNode);

        // var newbook = bookShelf.appendChild({
        //     newChild: newBookNode
        // });

        var xmlData = file.load({ id: 2562 }).getContents();
        var bookShelf = xml.Parser.fromString({
            text: xmlData
        });

        var newBookNode = bookShelf.createElement("book");
        var newTitleNode = bookShelf.createElement("title");
        var newTitleNodeValue = bookShelf.createTextNode("Sample Title");
        var newAuthorNode = bookShelf.createElement("author");
        var newAuthorNodeValue = bookShelf.createTextNode("Sample Title");

        newBookNode.appendChild(newTitleNode);
        newBookNode.appendChild(newAuthorNode);
        newTitleNode.appendChild(newTitleNodeValue);
        newAuthorNode.appendChild(newAuthorNodeValue);

        // var newbook = bookShelf.appendChild({
        //     newChild: newBookNode
        // });

        return true;
    }

    const funcXLS = () => {
        const param1 = 'Dennis Fernández'
        let sentence = '';
        let xmlString = '';
        xmlString += '<?xml version="1.0"?> <?mso-application progid="Excel.Sheet"?>';
        xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
        xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
        xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
        xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
        xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

        xmlString += '<Worksheet ss:Name="Sheet1">';
        xmlString += '<Table>' +
            '<Row>' +
            '<Cell><Data ss:Type="String"> First Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Second Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Third Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Fourth Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Fifth Header </Data></Cell>' +
            '</Row>';

        xmlString += '<Row>' +
            '<Cell><Data ss:Type="String">Row 1 Column 1</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 2</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 3</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 4</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 5</Data></Cell>' +
            '</Row>';

        xmlString += '<Row>' +
            '<Cell><Data ss:Type="String">Row 2 Column 1</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 2</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 3</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 4</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 5</Data></Cell>' +
            '</Row>';

        xmlString += '</Table></Worksheet>'

        xmlString += '<Worksheet ss:Name="Sheet2">';
        xmlString += '<Table>' +
            '<Row>' +
            '<Cell><Data ss:Type="String"> First Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Second Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Third Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Fourth Header </Data></Cell>' +
            '<Cell><Data ss:Type="String"> Fifth Header </Data></Cell>' +
            '</Row>';

        xmlString += '<Row>' +
            '<Cell><Data ss:Type="String">Row 1 Column 1</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 2</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 3</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 4</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 1 Column 5</Data></Cell>' +
            '</Row>';

        xmlString += '<Row>' +
            '<Cell><Data ss:Type="String">Row 2 Column 1</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 2</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 3</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 4</Data></Cell>' +
            '<Cell><Data ss:Type="String">Row 2 Column 5</Data></Cell>' +
            '</Row>';

        xmlString += '</Table></Worksheet></Workbook>'

        let xmlStringEncode = encode.convert({
            string: xmlString,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });

        let fileObj = file.create({
            name: 'testExcel.xls',
            fileType: file.Type.EXCEL,
            // encoding: file.Encoding.BASE_64,
            contents: xmlStringEncode
        });
        // fileObj.encoding = file.Encoding.MAC_ROMAN;
        fileObj.folder = 609;
        let fileId = fileObj.save();
        log.debug('fileId-Saved', fileId);
        let xmlDocument = file.load({ id: fileId }); // POR ID
        //let xmlDocument = file.load({ id: 'SuiteScripts/Test Developer/Archivos/test.xml' });// POR RUTA
        log.debug('xmlDocument', xmlDocument + ' - ' + xmlDocument.size);


        let xmlFileContent = xmlDocument.getContents();
        let xmlStringDecode = encode.convert({
            string: xmlFileContent,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8
        });
        log.debug('Contents', xmlStringDecode);
        // //===================================================
        // let reencoded = encode.convert({
        //     string: xmlFileContent,
        //     inputEncoding: encode.Encoding.UTF_8,
        //     outputEncoding: encode.Encoding.BASE_64
        // });
        // if (xmlDocument.size < 10485760) {
        //     let xmlDocument = xml.Parser.fromString({ text: xmlFileContent });
        //     let bookNode = xml.XPath.select({ node: xmlDocument, xpath: '//b:book' });
        //     for (let i = 0; i < bookNode.length; i++) {
        //         let title = bookNode[i].getElementsByTagName({ tagName: 'b:title' })[0].textContent;
        //         let author = bookNode[i].getElementsByTagName({ tagName: 'b:author' })[0].textContent;
        //         sentence += 'Author: ' + author + ' wrote ' + title + '.\n';
        //     }
        //     log.debug('Sentence', sentence);
        //     // options.response.write(sentence);
        // }
        return { contenido: xmlDocument };
    }

    const postImage = (context) => {
        let body = context.image;
        log.debug("Request", body);
        // let encoded = encode.convert({
        //     string: body,
        //     inputEncoding: encode.Encoding.BASE_64,
        //     outputEncoding: encode.Encoding.UTF_8
        // });

        let fileObj = file.create({
            name: 'testimagegif.gif',
            fileType: file.Type.GIFIMAGE,
            encoding: file.Encoding.UTF_8,
            folder: 609,
            isOnline: true,
            contents: body
        });
        let fileId = fileObj.save();
        log.debug('fileId-Saved', fileId);

        let fileObjURL = file.load({
            // id: 'Images/myImageFile.jpg'
            id: fileId
        });
        log.debug({
            details: "File URL: " + fileObjURL.url
        });

        return { response: URL + fileObjURL.url };
    }

    const getImage = (context) => {
        let img = context.paramimg;
        log.debug('GETIMG', img)
        let fileObjURL = file.load({
            // id: 'Images/myImageFile.jpg'
            id: img
        });
        return { response: URL + fileObjURL.url };
    }

    const postPDF = (context) => {
        // let body = context.image;
        // log.debug("Request", body);
        let body = '';
        body += '<?xml version="1.0" encoding="UTF-8"?>';
        body += '<bookstore xmlns:b="http://www.qualifiednamespace.com/book">';
        body += '<b:book category="web">';
        body += '<b:title lang="en">Harry Potter</b:title>';
        body += '<b:author>Hola</b:author>';
        body += '</b:book>';
        body += '<b:book category="web">';
        body += '<b:title lang="en">Harry Potter 2</b:title>';
        body += '<b:author>James McGovern</b:author>';
        body += '</b:book>';
        body += '</bookstore>';

        let fileObj = file.create({
            name: 'testpdf.pdf',
            fileType: file.Type.PDF,
            encoding: file.Encoding.UTF_8,
            folder: 609,
            isOnline: true,
            contents: body
        });
        let fileId = fileObj.save();
        log.debug('fileId-Saved', fileId);

        let fileObjURL = file.load({
            // id: 'Images/myImageFile.jpg'
            id: fileId
        });
        log.debug({
            details: "File URL: " + fileObjURL.url
        });

        return { response: URL + fileObjURL.url };
    }

    const funcINI = () => {
        const param1 = 'Dennis Fernández'
        let body = 'OyBsYXN0IG1vZGlmaWVkIDEgQXByaWwgMjAwMSBieSBKb2huIERvZQpbb3duZXJdCm5hbWUgPSBKb2huIERvZQpvcmdhbml6YXRpb24gPSBBY21lIFdpZGdldHMgSW5jLgoKW2RhdGFiYXNlXQo7IHVzZSBJUCBhZGRyZXNzIGluIGNhc2UgbmV0d29yayBuYW1lIHJlc29sdXRpb24gaXMgbm90IHdvcmtpbmcKc2VydmVyID0gMTkyLjAuMi42MiAgICAgCnBvcnQgPSAxNDMKZmlsZSA9ICJwYXlyb2xsLmRhdCI=';

        // //let xmlDocument = file.load({ id: fileId }); // POR ID
        let reencoded = encode.convert({
            string: body,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8
        });

        let fileObj = file.create({
            name: 'testini.config',
            fileType: file.Type.CONFIG,
            // encoding: file.Encoding.UTF_8,
            folder: 609,
            contents: reencoded
        });
        let fileId = fileObj.save();
        log.debug('fileId-Saved', fileId);
        //===================================================

        return { contenido: fileId };
    }

    const createJournalEntrySalidaConAlquiler = (item, adjustid, location) => {
        let sql1 = 'SELECT foreigntotal as amount, custbody_ht_af_ejecucion_relacionada FROM transaction WHERE id = ?';
        let sql2 = 'SELECT it.assetaccount as inventoryaccount, af.custrecord_assettypeassetacc as fixedassetaccount FROM item it ' +
            'INNER JOIN customrecord_ncfar_assettype af ON it.custitem_ht_ar_tipoactivo = af.id ' +
            'WHERE it.id = ?';
        let journalid = 0
        try {
            let params1 = [adjustid]
            let params2 = [item]
            let resultSet1 = query.runSuiteQL({ query: sql1, params: params1 });
            let resultSet2 = query.runSuiteQL({ query: sql2, params: params2 });
            let results1 = resultSet1.asMappedResults();
            let results2 = resultSet2.asMappedResults()/*[0]['cantidad']*/;
            if (results1[0]['amount'] > 0 && results2.length > 0) {
                log.debug('Asiento', 'Entré');
                //return results/*[0]['custrecord_ht_co_producto'] == null ? 0 : 1*/
                const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });
                objRecord.setValue({ fieldId: 'trandate', value: new Date() });
                objRecord.setValue({ fieldId: 'memo', value: 'Asiento de Diario por alquiler en tránsito' });
                objRecord.setValue({ fieldId: 'subsidiary', value: 2 });
                objRecord.setValue({ fieldId: 'custbody_ht_af_ejecucion_relacionada', value: results1[0]['custbody_ht_af_ejecucion_relacionada'] });

                objRecord.selectNewLine({ sublistId: 'line' });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: results2[0]['inventoryaccount'], ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: results1[0]['amount'], ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: '', ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: 'Asiento de Diario por alquiler en tránsito' });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: '', ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: '', ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                objRecord.commitLine({ sublistId: 'line' });

                objRecord.selectNewLine({ sublistId: 'line' });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: results2[0]['fixedassetaccount'], ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: '', ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: results1[0]['amount'], ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: 'Asiento de Diario por alquiler en tránsito' });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: '', ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: '', ignoreFieldChange: false });
                objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: location, ignoreFieldChange: false });
                objRecord.commitLine({ sublistId: 'line' });

                journalid = objRecord.save({ ignoreMandatoryFields: false });
            }
            return journalid;
        } catch (error) {
            log.error('Error-createJournalEntrySalidaConAlquiler', error);
            return error;
        }
    }


    return {
        get: _get,
        post: _post,
        // put: _put,
        // delete: _delete
    }
});
