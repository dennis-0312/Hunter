/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/render', 'N/file', 'N/log', 'N/record', 'N/search'], (render, file, log, record, search) => {

    function onRequest(context) {
        let bloque1 = '';
        const params = context.request.parameters;
        const id = 2407;
        const subsidiary = params.subsidiary
        var createdfrom = params.createdfrom;

        //CARGA DE PLANTILLA
        const xmlTemplateFile = file.load({ id: 5867 });
        let renderer = render.create();
        let fileContent = xmlTemplateFile.getContents();

        //const objRecord = record.load({ type: 'itemfulfillment', id: id });
        //log.debug('Record', objRecord);
        renderer.addRecord('ordenservicio', record.load({
            type: 'salesorder',
            id: id
        }));

        let recordLoad = record.load({ type: 'salesorder', id: id })

        let entity = search.lookupFields({
            type: record.Type.OPPORTUNITY,
            id: recordLoad.getValue('opportunity'),
            columns: ['entity']
        })

        log.debug('Param0', entity)

        // let salesexecutive = search.lookupFields({
        //     type: record.Type.PROSPECT,
        //     id: entity.entity[0].value,
        //     columns: ['salesrep']
        // });

        //log.debug('Param', salesexecutive[0].value)

        // bloque1 += '<table border="1" style="margin-top: 10px; width: 400px;">';
        // bloque1 += '<tr>'
        // bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Lugar y Fecha</td>'
        // bloque1 += '<td align="left" class="border">:</td>'
        // bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">GUAYAQUIL VERNAZA 10/may/13 - 16:42:05 - VBENAV - DGYESIS116</td>'
        // bloque1 += '</tr>'
        // bloque1 += '<tr>'
        // bloque1 += '<td align="left" colspan="3" style="font-weight: bold">ID. Cliente</td>'
        // bloque1 += '<td align="left" class="border">:</td>'
        // bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">0904795184</td>'
        // bloque1 += '</tr>'
        // bloque1 += '<tr>'
        // bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Cliente</td>'
        // bloque1 += '<td align="left" class="border">:</td>'
        // bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">MARCELO HAON ARIAS</td>'
        // bloque1 += '</tr>'
        // bloque1 += '<tr>'
        // bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Compañia</td>'
        // bloque1 += '<td align="left" class="border">:</td>'
        // bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;"></td>'
        // bloque1 += '</tr>'
        // bloque1 += '<tr>'
        // bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Teléfono</td>'
        // bloque1 += '<td align="left" class="border">:</td>'
        // bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;"></td>'
        // bloque1 += '</tr>'
        // bloque1 += '<tr>'
        // bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Ej. de Venta</td>'
        // bloque1 += '<td align="left" class="border">:</td>'
        // bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;"></td>'
        // bloque1 += '</tr>'
        // bloque1 += '</table>'


        bloque1 += '<table border="1" style="margin-top: 10px; width: 400px;">';
        bloque1 += '<tr>'
        bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Lugar y Fecha</td>'
        bloque1 += '<td align="left" class="border">:</td>'
        bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">GUAYAQUIL VERNAZA 10/may/13 - 16:42:05 - VBENAV - DGYESIS116</td>'
        bloque1 += '</tr>'
        bloque1 += '<tr>'
        bloque1 += '<td align="left" colspan="3" style="font-weight: bold">ID. Cliente</td>'
        bloque1 += '<td align="left" class="border">:</td>'
        bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">0904795184</td>'
        bloque1 += '</tr>'
        bloque1 += '<tr>'
        bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Cliente</td>'
        bloque1 += '<td align="left" class="border">:</td>'
        bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">MARCELO HAON ARIAS</td>'
        bloque1 += '</tr>'
        bloque1 += '<tr>'
        bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Compañia</td>'
        bloque1 += '<td align="left" class="border">:</td>'
        bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;"></td>'
        bloque1 += '</tr>'
        bloque1 += '<tr>'
        bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Teléfono</td>'
        bloque1 += '<td align="left" class="border">:</td>'
        bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;"></td>'
        bloque1 += '</tr>'
        bloque1 += '<tr>'
        bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Ej. de Venta</td>'
        bloque1 += '<td align="left" class="border">:</td>'
        bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;"></td>'
        bloque1 += '</tr>'
        bloque1 += '</table>'
        fileContent = fileContent.replace('<!--bloque1-->', bloque1);


        renderer.templateContent = fileContent;
        const pdfFile = renderer.renderAsPdf();
        context.response.writeFile(pdfFile, true);
    }

    return {
        onRequest: onRequest
    }
});
