/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/record', 'N/render', 'N/file'],

    function (record, render, file) {

        //ftl
        const TEMPLATE_PDF_EXPENSE_REPORT = "../Templates/HU_EC_PLANTILLA_VALE_PROVISIONAL_CAJA.ftl";
        const onRequest = (context) => {
            try {
                if (context.request.method == 'GET') {
                    var { type, id } = context.request.parameters;

                    renderPDF(id, context);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }
        const renderPDF = (id, context) => {
            var fileContents = file.load({ id: TEMPLATE_PDF_EXPENSE_REPORT }).getContents();

            var renderer = render.create();
            renderer.templateContent = fileContents;
            renderer.addRecord({
                templateName: 'record',
                record: record.load({
                    type: 'journalentry', // Tipo de registro
                    id: id
                })
            });

            result = renderer.renderAsString();
            context.response.renderPdf(result);
        }

        return {
            onRequest
        };
    });