/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
define(['N/record', 'N/file', 'N/runtime', 'N/email', 'N/url'], function (record, file, runtime, email, url) {

    FOLDER_ID = 341;

    function execute(context) {

        try {

            var remainingUsagei = runtime.getCurrentScript().getRemainingUsage();
            log.debug('remaining usage inicio:' + remainingUsagei);

            var miRegistro = record.create({
                type: 'customrecord_file_test',
            });
            miRegistro.setText('custrecord_minombre', 'Isaac');
            miRegistro.setText('custrecord_micorreo', 'iferro@xxx.com');
            miRegistro.setText('custrecord_micelular', '987654321');
            var miRecordCreado = miRegistro.save({ ignoreMandatoryFields: true, enableSourcing: false });
            log.debug('miRecordCreado', miRecordCreado);






















            /*             var userObj = runtime.getCurrentUser().id;
                        log.debug('userObj', userObj); */
            var userObj = 33;


            //var idEmisor = 9582;
            var recipientId = 'ezdeta2603@gmail.com';

            // RUTA ABSOLUTA: Images/myImageFile.jpg (toda la ruta)
            // RUTA RELATIVA: ./Images/myImageFile.jpg (parte de la ruta)

/*             var fileImagen0 = file.load({
                id: './contenido_imagen.txt'
            });
            log.debug('fileImagen0', fileImagen0);
            log.debug('fileImagen0 size', fileImagen0.size);
            log.debug('fileImagen0 content', fileImagen0.getContents());
            var contenidoFile = fileImagen0.getContents();

            var idFile = saveFile('myfileTest2.gif', contenidoFile);
            var adjunto = file.load(idFile);
            log.debug('adjunto', adjunto); */

            /*             var idFile1 = saveFile('myfileTest.txt', contenidoFile);
                        var adjunto1 = file.load(idFile1);
                        var idFile2 = saveFile('myfileTest.ini', contenidoFile);
                        var adjunto2 = file.load(idFile2); */


            // CONSTRUIR LA URL
/*             var scheme = 'https://';
            var host = url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });
            log.debug('host', host);
            var urlImagen = scheme + host + adjunto.url;
            log.debug('urlImagen', urlImagen);

            
            record.submitFields({
                type: 'customrecord_file_test',
                id: 1,
                values: { 
                    'custrecord_img_file_cabinet': adjunto.id,
                    'custrecord_url_interna': urlImagen,
                },
                options: {
                    ignoreMandatoryFields: true,
                    enablesourcing: false,
                }
            });

            var response = https.get({
                url: 'https://www.testwebsite.com',
                headers: headerObj
            }); */


/*             var recFile = record.create({
                type: 'customrecord_file_test',
                isDynamic: true
            });
            recFile.setValue('custrecord_img_file_cabinet', idFile2);
            recFile.save({ ignoreMandatoryFields: true, enableSourcing: false }); */


            /*             email.send({
                            author: userObj,
                            recipients: [recipientId],
                            subject: 'Test Sample Email Module',
                            body: 'email body',
                            attachments: [adjunto],
                            relatedRecords: {
                                entityId: recipientId,
                                customRecord: {
                                    id: recordId,
                                    recordType: recordTypeId
                                }
                            }
                        }); */



            /*             var customerTest = record.load({
                            type: 'employee',
                            id: 5,
                            isDynamic: true
                        });
                        log.debug('customerTest', customerTest); */

            var remainingUsagef = runtime.getCurrentScript().getRemainingUsage();
            log.debug('remaining usage fin:' + remainingUsagef);



        } catch (e) {
            log.debug("Error executing", e);
        }



    }

    function saveFile(fileName, fileContents) {
        /*         if (fileContents.startsWith('data:image/jpeg;base64'))
                    fileContents = fileContents.substring('data:image/jpeg;base64,'.length); */
        //log.debug('saving file:', `${fileName} : ${fileContents.length} : ${fileContents}`)
        var formato = '';

        // NO ESTRUCTURADOS
        if (fileName.indexOf('.jpg') !== -1) formato = file.Type.JPGIMAGE;
        if (fileName.indexOf('.png') !== -1) formato = file.Type.PNGIMAGE;
        if (fileName.indexOf('.gif') !== -1) formato = file.Type.GIFIMAGE;
        if (fileName.indexOf('.pdf') !== -1) formato = file.Type.PDF;


        // ESTRUCTURADOS
        if (fileName.indexOf('.txt') !== -1) formato = file.Type.PLAINTEXT;
        if (fileName.indexOf('.ini') !== -1) formato = file.Type.CONFIG;
        if (fileName.indexOf('.xls') !== -1) formato = file.Type.EXCEL;
        if (fileName.indexOf('.xml') !== -1) formato = file.Type.XMLDOC;

        var fileObj = file.create({
            name: fileName,
            fileType: formato,
            contents: fileContents,
            description: 'This is a plain text file.',
            encoding: file.Encoding.UTF8,
            isOnline: true,
            folder: FOLDER_ID
        });
        var fileId = fileObj.save();
        log.debug('fileId', fileId);
        return fileId;
    }

    return {
        execute: execute
    }
});
