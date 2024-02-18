/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@NModuleScope SameAccount
*/
define(['N/ui/serverWidget', 'N/record', 'N/render', 'N/file', 'N/search', 'N/runtime', 'N/format', 'N/email', 'N/url'],
    function (serverWidget, record, render, file, search, runtime, format, email, url) {

        //ftl
        const TEMPLATE_PDF_COD_BARRAS_ID = './TS_FM_Asset_Codigo_Barras_pdf.ftl';
        const ID_LOG_RECORD = "customrecord_ht_generador_cod_barra_log"

        const onRequest = (context) => {
            if (context.request.method == 'GET') {
                let fecha_ = getFecha();
                let jsonTemplate = {};
                let { cod_barra_asiento } = context.request.parameters;
                jsonTemplate = getDataForTemplate(cod_barra_asiento)
                log.error('jsonTemplate', jsonTemplate);
                pdf = renderPDF(TEMPLATE_PDF_COD_BARRAS_ID, jsonTemplate, fecha_);
                //log.error('pdf',pdf);
                let createrecord = createRecord(ID_LOG_RECORD, pdf.fileUrl);

                context.response.renderPdf(pdf.result);
            }
        }

        const getDataForTemplate = (cod) => {
            var jasonresult = {};
            var result = cod.split(",")
            var codigobarras = [];
            var row = [];
            var hoja = [];
            var auxi_hoja = [];
            var cont = 0;
            var cont_hoja = 0;
            for (let i = 0; i < result.length; i++) {
                let codigo_barra = result[i];
                row.push(codigo_barra);

                if (cont == 0) {
                    cont ++;
                } else if (cont == 1) {
                    hoja.push(row);
                    cont = 0;
                    row = [];
                }

                if(i == result.length-1 && row.length != 0){
                    hoja.push(row);
                }
            }

            for (let i = 0; i < hoja.length; i++) {
                let codigo_barra = hoja[i];
                auxi_hoja.push(codigo_barra);

                if (cont_hoja != 2) {
                    cont_hoja ++;
                } else if (cont_hoja == 2) {
                    codigobarras.push(auxi_hoja);
                    cont_hoja = 0;
                    auxi_hoja = [];
                }

                if(i == hoja.length-1 && auxi_hoja.length != 0){
                    codigobarras.push(auxi_hoja);
                }

            }

            jasonresult.codigobarras = codigobarras;
            jasonresult.prueba1 = ["123456"];
            jasonresult.prueba2 = [["123456"]];
            jasonresult.prueba3 = [[["123456"]]];

            
            return jasonresult;

        }

        const renderPDF = (templateId, json, fecha) => {
            let fileContents = file.load({ id: templateId }).getContents();
            let idFolder = getFolderId('PDF Codigo de Barras');
            log.error('idFolder', idFolder);

            log.error('fecha', fecha.fecha);

            let fileName = 'Codigo de barras' + fecha.fecha;

            let data = {text: JSON.stringify(json)};

            let renderer = render.create();
            renderer.templateContent = fileContents;
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'record',
                data: data
            });
            result = renderer.renderAsString();
            let myFileObj = render.xmlToPdf({
                xmlString: result
            });

            myFileObj.name = fileName;
            myFileObj.folder = idFolder;

            var fileId = myFileObj.save();

            var idfile2 = file.load({
                id: fileId
            });
            var getURL = url.resolveDomain({ hostType: url.HostType.APPLICATION });
            var fileUrl = '';

            if (getURL != '') {
                fileUrl += 'https://' + getURL;
            }

            fileUrl += idfile2.url;

            /*
            log.error('fileUrl', fileUrl);
            log.error('fileId', fileId);
            */

            return {
                result,
                fileId,
                fileUrl
            }

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

        function getFecha() {
            let zonaHoraria = runtime.getCurrentScript().getParameter("TIMEZONE");
            log.debug('zonaHoraria', zonaHoraria);
            let formato_fecha = new Date();
            let Nuevahora = format.format({ value: formato_fecha, type: format.Type.DATETIME, timezone: zonaHoraria });
            let hora_fecha = Nuevahora;
            Nuevahora = Nuevahora.split(' ');

            let time = Nuevahora[1];
            time = time.split(':');
            let hora = parseInt(time[0]);
            if (parseInt(hora) < 10) {
                time = '0' + hora + time[1] + time[2];
            } else {
                time = hora + time[1] + time[2];
            }

            let date = Nuevahora[0];
            date = date.split('/');

            let mes = date[1];
            let dia = date[0];
            let ano = date[2];

            let fecha = dia + mes + ano + '_' + time;

            return { fecha: fecha, hora_fecha: hora_fecha };
        }

        function createRecord(logrecodId, fileUrl) {
            try {
                // const hoy = sysDate();
                // const period = func (hoy.year,hoy.month)
                const recordlog = record.create({ type: logrecodId });

                recordlog.setValue({ fieldId: 'custrecord_ht_cod_barra_log_estado', value: "Finalizado" });
                recordlog.setValue({ fieldId: 'custrecord_ht_cod_barra_log_file', value: fileUrl });
                let recordlogid = recordlog.save();

                return { recordlogid: recordlogid, irecord: record };
            } catch (e) {
                log.error({ title: 'createRecord', details: e });
            }
        }

        return {
            onRequest
        };
    });