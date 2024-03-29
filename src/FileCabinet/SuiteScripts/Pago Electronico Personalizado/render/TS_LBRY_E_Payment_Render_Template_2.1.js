/**
 * @NApiVersion 2.1
 * @NModuleScope Public
*/

define(["N/runtime", 'N/render', 'N/file', './TS_LBRY_E_Payment_Freemarker_Builder_2.1.js'],
    (runtime, render, file, FreeMarker) => {

        const FOLDER = "6503" //SB: 6322 - PR 6503 /Path: SuiteScripts > Pago Electronico Personalizado

        function createFileRender(transactionJSON, ftlTemplateContent) {
            try {
                let renderer = render.create();
                let content = FreeMarker.create(ftlTemplateContent);

                let fileJson = file.create({
                    name: "Prueba_JSON",
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(transactionJSON),
                    folder: FOLDER
                }).save();


                let fileId = file.create({
                    name: "Prueba_FTL",
                    fileType: file.Type.PLAINTEXT,
                    contents: content,
                    folder: FOLDER
                }).save();

                renderer.templateContent = content;

                let jsonString = {
                    text: JSON.stringify(transactionJSON)
                };

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'jsonString',
                    data: jsonString
                });

                let outputFile = renderer.renderAsString();
                return outputFile;

            } catch (error) {
                log.error('[ RenderTemplate - createFileRender ]', error);
            }
        }

        function createPDFFileRender(transactionJSON, ftlTemplateContent) {

            try {
                let renderer = render.create();
                let content = FreeMarker.create(ftlTemplateContent);

                let fileJson = file.create({
                    name: "Prueba_JSON",
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(transactionJSON),
                    folder: FOLDER
                }).save();


                let fileId = file.create({
                    name: "Prueba_FTL_PDF",
                    fileType: file.Type.PLAINTEXT,
                    contents: content,
                    folder: FOLDER
                }).save();

                renderer.templateContent = content;

                let jsonString = {
                    text: JSON.stringify(transactionJSON).replaceAll("',&apos;").replaceAll("&", "&amp;")
                };

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'jsonString',
                    data: jsonString
                });
                
                let outputFile = renderer.renderAsPdf();
                return outputFile;
            } catch (error) {
                log.error('[ RenderTemplate - createPDFFileRender ]', error);
            }
        }

        return {
            createFileRender,
            createPDFFileRender
        }
    }
)


