/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/file', 'N/https', 'N/email', 'N/search', 'N/encode', 'N/xml'], function (log, file, https, email, search, encode, xml) {
    const URL = 'https://7451241-sb1.app.netsuite.com';
    const CARPETA = 611;
    var id = 4;
    const URL2 = "https://7451241-sb1.app.netsuite.com/app/accounting/print/hotprint.nl?regular=T&sethotprinter=T&formnumber=18&id=" + id + "&label=Mi+primer+registro&printtype=CUSTOMRECORD&trantype=CUSTOM&recordtype=customrecord_dfr_registro_personalizado"


    function _get(context) {
        try {
            var response = getTXT();
            return response;
        } catch (error) {
            log.error('Error-GET', error);
        }
    }

    function _post(context) {
        try {
            let publica = true;
            let contenidoArchivo = context.contenido;
            let nombreArchivo = context.nombre;
            let tipoArchivo = context.tipo;
            if (tipoArchivo == 'png') {
                tipo = file.Type.PNGIMAGE;
            }

            if (tipoArchivo == 'jpg') {
                tipo = file.Type.JPGIMAGE;
            }

            if (tipoArchivo == 'gif') {
                tipo = file.Type.GIFIMAGE;
            }

            if (tipoArchivo == 'pdf') {
                tipo = file.Type.PDF;
                publica = false;
            }

            let fileObj = file.create({
                name: nombreArchivo + '.' + tipoArchivo,
                fileType: tipo,
                folder: CARPETA,
                isOnline: publica,
                encoding: file.UTF_8,
                contents: contenidoArchivo
            });

            let fileId = fileObj.save();
            let fileResponse = file.load({ id: fileId });
            return { retorno: URL + fileResponse.url };
        } catch (error) {
            log.error('Error-POST', error);
            return error;
        }
    }

    function getTXT() {
        var txtFile = 'ID|Número Documento|Fecha Emisión Cliente\n';
        var mySearch = search.load({ id: 'customsearch_ec_busqueda_os' });
        mySearch.run().each(function (result) {
            var internalid = result.getValue({ name: 'internalid', summary: "GROUP" });
            var nrodocumento = result.getValue({ name: 'tranid', summary: "GROUP" });
            var fecha_emicliente = result.getValue({ name: 'datecreated', join: "customerMain", summary: "GROUP" });
            txtFile += internalid + '|' + nrodocumento + '|' + fecha_emicliente + '|\n'
            return true;
        });
        var date = new Date();
        //Creation of file
        var fileObj = file.create({
            //To make each file unique and avoid overwriting, append date on the title
            name: 'txt- ' + date.toLocaleDateString() + '.biz',
            fileType: file.Type.PLAINTEXT,
            contents: txtFile,
            encoding: file.Encoding.UTF8,
            folder: CARPETA
        });

        //Save the CSV file
        var fileId = fileObj.save()
        log.debug('File ID...', fileId);
        return fileId;
    }

    function getXLS() {
        //!BUSQUEDA OS
        let contentRow = '';
        let contentRow2 = '';
        var mySearch = search.load({ id: 'customsearch_ec_busqueda_os' });
        let result = mySearch.run().getRange({ start: 0, end: 1000 });

        //!BUSQUEDA CLIENTE
        let myCustomer = search.load({ id: 'customsearch_ec_busqueda_cliente' });
        let result2 = myCustomer.run().getRange({ start: 0, end: 1000 });

        var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
        xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
        xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
        xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
        xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
        xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

        //!HOJA 1
        xmlString += '<Worksheet ss:Name="Hoja1">'; //TODO ====> HOJA
        for (let i in result) {
            var internalid = result[i].getValue({ name: 'internalid', summary: "GROUP" });
            var nrodocumento = result[i].getValue({ name: 'tranid', summary: "GROUP" });
            var fecha_emicliente = result[i].getValue({ name: 'datecreated', join: "customerMain", summary: "GROUP" });
            contentRow += '<Row>' +
                '<Cell><Data ss:Type="String">' + internalid + '</Data></Cell>' +
                '<Cell><Data ss:Type="String">' + nrodocumento + '</Data></Cell>' +
                '<Cell><Data ss:Type="String">' + fecha_emicliente + '</Data></Cell>' +
                '</Row>';
        }
        xmlString += '<Table>' + contentRow + '</Table></Worksheet>';

        //!HOJA 2
        xmlString += '<Worksheet ss:Name="Hoja2">'; //TODO ====> HOJA
        for (let i in result2) {
            var internalid = result2[i].getValue({ name: 'internalid' });
            var nombre = result2[i].getValue({ name: 'altname' });
            var empresa = result2[i].getValue({ name: 'companyname' });
            contentRow2 += '<Row>' +
                '<Cell><Data ss:Type="String">' + internalid + '</Data></Cell>' +
                '<Cell><Data ss:Type="String">' + nombre + '</Data></Cell>' +
                '<Cell><Data ss:Type="String">' + empresa + '</Data></Cell>' +
                '</Row>';
        }
        xmlString += '<Table>' + contentRow2 + '</Table></Worksheet></Workbook>';

        var encodeXLS = encode.convert({
            string: xmlString,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });

        let xlsCreate = file.create({
            name: "testXLS2.xls",
            fileType: file.Type.EXCEL,
            contents: encodeXLS,
            folder: CARPETA
        });

        let idFile = xlsCreate.save();

        return idFile;
    }

    function funcXML() {
        const fileXML = 5566;
        let sentence = '';
        let body = '';
        body += '<bookstore xmlns:b="http://www.qualifiednamespace.com/book">';
        body += '<b:book category="cooking">';
        body += '<b:title lang="en">Everyday Italian</b:title>';
        body += '<b:author>Giada De Laurentiis</b:author>';
        body += '<b:year>2005</b:year>';
        body += '<b:price>30.00</b:price>';
        body += '</b:book>';
        body += '<b:book category="children">';
        body += '<b:title lang="en">Harry Potter</b:title>';
        body += '<b:author>J K. Rowling</b:author>';
        body += '<b:year>2005</b:year>';
        body += '<b:price>29.99</b:price>';
        body += '</b:book>';
        body += '<b:book category="web">';
        body += '<b:title lang="en">XQuery Kick Start</b:title>';
        body += '<b:author>James McGovern</b:author>';
        body += '<b:author>Per Bothner</b:author>';
        body += '<b:author>Kurt Cagle</b:author>';
        body += '<b:author>James Linn</b:author>';
        body += '<b:author>Vaidyanathan Nagarajan</b:author>';
        body += '<b:year>2003</b:year>';
        body += '<b:price>49.99</b:price>';
        body += '</b:book>';
        body += '<b:book category="web" cover="paperback">';
        body += '<b:title lang="en">Learning XML</b:title>';
        body += '<b:author>Erik T. Ray</b:author>';
        body += '<b:year>2003</b:year>';
        body += '<b:price>39.95</b:price>';
        body += '</b:book>';
        body += '</bookstore>';

        // var fileObj = file.create({
        //     name: 'testXML.xml',
        //     fileType: file.Type.XMLDOC,
        //     contents: body
        // });
        // fileObj.folder = CARPETA;
        // var fileId = fileObj.save();

        var xmlFileContent = file.load(fileXML).getContents();
        var xmlDocument = xml.Parser.fromString({ text: xmlFileContent });

        var bookNode = xml.XPath.select({
            node: xmlDocument,
            xpath: '//b:book'
        });

        for (var i = 0; i < bookNode.length; i++) {
            var title = bookNode[i].getElementsByTagName({ tagName: 'b:title' })[0].textContent;
            var author = bookNode[i].getElementsByTagName({ tagName: 'b:author' })[0].textContent;
            sentence += 'Author: ' + author + ' wrote ' + title + '.\n';
        }
        return sentence;
    }

    function funcXML2() {
        let content = '';
        var xmlString = '<?xml version="1.0" encoding="UTF-8"?><config date="1465467658668" transient="false">Contenido</config>';
        var xmlDocument = xml.Parser.fromString({ text: xmlString });
        log.debug('xmlDocument', xmlDocument);
        var bookNode = xml.XPath.select({ node: xmlDocument, xpath: '//config' });

        for (var i = 0; i < bookNode.length; i++) {
            log.debug('Config contenido', bookNode[i].textContent);
            content = bookNode[i].textContent;
        }
        return content
    }

    function funcXML3() {
        try {
            var xmlData = file.load({ id: 5566 });
            var payLoadId = 'hOLA';
            var docElement = xmlData.getContents();

            var bookShelf = xml.Parser.fromString({ text: '<cXML payloadID="' + payLoadId + '"></cXML>' });

            var newBookNode = bookShelf.createElement({ tagName: "book" });
            // var newTitleNode = bookShelf.createElement({ tagName: "title" });
            // var newTitleNodeValue = bookShelf.createTextNode({ data: "Texto Ejemplo" });
            // var newAuthorNode = bookShelf.createElement({ tagName: "author" });
            // var newAuthorNodeValue = bookShelf.createTextNode({ data: "Texto Ejemplo2" });
            // newTitleNode.appendChild({ newChild: newTitleNodeValue });
            // newAuthorNode.appendChild({ newChild: newAuthorNodeValue });
            // newBookNode.appendChild({ newChild: newTitleNode });
            // newBookNode.appendChild({ newChild: newAuthorNode });


            bookShelf.appendChild({ newChild: newBookNode });
            var asString = xml.Parser.toString({ document: bookShelf });



            // var doc = xml.Parser.fromString({
            //     text: '<cXML payloadID="' + payLoadId + '"></cXML>'
            // });


            // let add = doc.createElement({ tagName: 'Lab' })
            // doc.documentElement.appendChild({ newChild: add });

            // var asString = xml.Parser.toString({ document: doc });
        } catch (error) {
            log.error('Error', error);
            return error;
        }

        //var newbook = bookShelf.appendChild({ newChild: newBookNode });


    }

    function funcINI() {
        // let body = 'OyBsYXN0IG1vZGlmaWVkIDEgQXByaWwgMjAwMSBieSBKb2huIERvZQpbb3duZXJdCm5hbWUgPSBKb2huIERvZQpvcmdhbml6YXRpb24gPSBBY21lIFdpZGdldHMgSW5jLgoKW2RhdGFiYXNlXQo7IHVzZSBJUCBhZGRyZXNzIGluIGNhc2UgbmV0d29yayBuYW1lIHJlc29sdXRpb24gaXMgbm90IHdvcmtpbmcKc2VydmVyID0gMTkyLjAuMi42MiAgICAgCnBvcnQgPSAxNDMKZmlsZSA9ICJwYXlyb2xsLmRhdCI=';
        let contenidoINI = "W0dFTkVSQUxdClNlcnZpZG9yPTEwLjEwMC54eC54eCAKU2Vydmlkb3JITT0xMC4xMDAueHgueHh4IApTRVJWSURPUkdFTz0xMC4xMDAueHgueHggClNxbF9Vc3VhcmlvPXN5c2h1bnRlcl8xClNxbF9QYXNzd29yZD1rwrVqwrVuwrUzwrU1wrV6wrVzwrV1wrUKRm9ybWF0b19GZWNoYT1kZC9tbS95eXl5CkZvcm1hdG9fRmVjaGFfU3FsPW1tL2RkL3l5eXkKTWFzY2FyYV9GZWNoYT0jIy8jIy8jIyMjCkZvcm1hdG9fSG9yYT1ISDpNTTpTUwpNYXNjYXJhX0hvcmE9IyM6IyM6IyMKRm9ybWF0b19Nb25lZGE9IywjMC4wMApUaXR1bG9fQXBsaWNhY2lvbj0gU1lTSFVOVEVSClNlcnZpZG9yX0hpc3Rvcmljbz0KU3FsX1Bhc3N3b3JkX0hpc3Rvcmljbz0KUnV0YV9NYW51YWxlcz1cXHNlcnZlclxzeXNodW50ZXJcbWFudWFsZXNcCk9maWNpbmE9MQpTZXJ2aWRvcl9TdWN1cnNhbD0xMC4xMDAueHgueHgKUnV0YV9Eb2N1bWVudG9zPTEwLjEwMC54eC54eFxpbWFnZW5lc0h1bnRlclxkb2N1bWVudG8uYXNwClJ1dGFfRG9jdW1lbnRvc19hbnQ9MTAuMTAwLnh4Lnh4XGltYWdlbmVzSHVudGVyXA=="

        let encoded = encode.convert({
            string: contenidoINI,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8
        });

        encoded = encoded.split('=');
        log.debug('Type', encoded[1].split('.'));
        let valor = encoded[1].split('\n');
        let nuevoValor = valor[0];
        return nuevoValor;
    }



    return {
        get: _get,
        //post: _post
    }
});
