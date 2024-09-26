/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/render', 'N/file', 'N/search', 'SuiteScripts/IntegracionesHunter/Plantillas/Libreria'],

    function (render, file, search, libreria) {

        //ftl
        const TEMPLATE_PDF_VENDOR_BILL = "SuiteScripts/IntegracionesHunter/Plantillas/StandardTemplates/HU_EC_PLANTILLA_BASE_COMPROBANTE_CONTABLE.ftl";

        const onRequest = (context) => {
            try {
                if (context.request.method == 'GET') {
                    var jsonTemplate = {};
                    var { type, id } = context.request.parameters;
                    jsonTemplate = getDataForTemplate(type, id);

                    renderPDF(jsonTemplate, context);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }

        const getDataForTemplate = (type, id) => {
            try {
                var result = {};

                var recordData = extractRecord(type, id);
                var glImpactData = libreria.ExtraerImpactoGL(type, id);

                // Definir el encabezado según el tipo de documento o variación específica
                result.header = type == "vendorpayment" ? "Pago Factura" : "";

                // Definir si en el form hay acceso a la hora de emision
                result.hasHour = false;
                result.hour = "";

                result.location = recordData.location;
                result.entity = libreria.EscapeXml(recordData.entity);
                result.trandate = recordData.trandate;
                result.custbody_num_vale = recordData.custbody_num_vale;
                result.total = recordData.total;
                result.letrasTotal = libreria.NumeroALetras(recordData.total);
                result.memo = libreria.EscapeXml(recordData.memo);
                result.tranid = recordData.tranid;
                result.listGL = glImpactData;

                return result;

            } catch (error) {
                log.error('error-getDataForTemplate', error);
            }
        }

        const renderPDF = (json, context) => {
            var fileContents = file.load({ id: TEMPLATE_PDF_VENDOR_BILL }).getContents();

            var renderer = render.create();
            renderer.templateContent = fileContents;

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: json
            });

            result = renderer.renderAsString();
            context.response.renderPdf(result);
        }

        /**
         * 
         * @param {*} FormType 
         * @param {*} FormID 
         * Extrae y prepara la información requerida por la plantilla (no incluye GL)
         */
        function extractRecord(FormType, FormID){
            try{                
                var searchRecord = search.lookupFields({
                    type: FormType,
                    id: FormID,
                    columns: [
                        'location',
                        'entity',
                        'trandate',
                        'custbody_num_vale',
                        'total',
                        'memo',
                        'tranid'
                    ]
                });
                record = {};

                record.location = searchRecord.location?.length ? searchRecord.location[0].text : "";
                record.entity = searchRecord.entity?.length ? searchRecord.entity[0].text : "";
                record.trandate = searchRecord.trandate;
                record.custbody_num_vale = searchRecord.custbody_num_vale;                
                record.memo = searchRecord.memo;
                record.tranid = searchRecord.tranid;

                var monto = searchRecord.total;
                if (Number(monto) < 0) {
                    monto = Number(monto) * (-1);
                }
                record.total = monto;

                return record;
            }
            catch (errorRecord) {
                log.error('extractRecordError', errorRecord);
            }

        }

        return {
            onRequest
        };
    });