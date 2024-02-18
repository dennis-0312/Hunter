/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/log', 'N/render', 'N/file', 'N/record', 'N/search'], function (log, render, file, record, search) {

    function onRequest(context) {
        try {
            let bloque1 = '';
            let bloque2 = '';
            let detalleSoporte = '';
            const params = context.request.parameters;
            const id = 2407;

            //CARGA DE PLANTILLA
            const xmlTemplateFile = file.load({ id: 5869 });
            let renderer = render.create();
            let fileContent = xmlTemplateFile.getContents();

            //const objRecord = record.load({ type: 'itemfulfillment', id: id });
            //log.debug('Record', objRecord);
            renderer.addRecord('ordenservicio', record.load({ type: record.Type.SALES_ORDER, id: id }));
            let recordLoad = record.load({ type: record.Type.SALES_ORDER, id: id })

            let idCliente = search.lookupFields({
                type: record.Type.SALES_ORDER,
                id: recordLoad.getValue('entity'),
                columns: ['entity']
            });
            log.debug('Cliente', idCliente);
            idCliente = idCliente.entity[0].value;

            let idSubsidiaria = search.lookupFields({
                type: 'customer',
                id: idCliente,
                columns: ['subsidiary']
            });
            idSubsidiaria = idSubsidiaria.subsidiary[0].value;
            log.debug('Cliente', idSubsidiaria);

            var subsidiarySearchObj = search.create({
                type: "subsidiary",
                filters:
                    [
                        ["internalid", "anyof", idSubsidiaria]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", sort: search.Sort.ASC, label: "Nombre" }),
                        search.createColumn({ name: "city", label: "Ciudad" }),
                        search.createColumn({ name: "state", label: "Estado/provincia" }),
                        search.createColumn({ name: "country", label: "País" }),
                        search.createColumn({ name: "currency", label: "Moneda" }),
                        search.createColumn({ name: "legalname", label: "Nombre legal" })
                    ]
            });
            var searchResultCount = subsidiarySearchObj.runPaged().count;
            log.debug("subsidiarySearchObj result count", searchResultCount);
            let result = subsidiarySearchObj.run().getRange(0, 1);
            log.debug('Result', result);
            let legalName = result[0].getValue({ name: "legalname" });


            bloque1 += '<table border="1" style="margin-top: 10px; width: 400px;">';
            bloque1 += '<tr>'
            bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Lugar y Fecha</td>'
            bloque1 += '<td align="left" class="border">:</td>'
            bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">TABLA-1 10/may/13 - 16:42:05 - VBENAV - DGYESIS116</td>'
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
            bloque1 += '<td align="left" colspan="3" style="font-weight: bold">Subsidiaria</td>'
            bloque1 += '<td align="left" class="border">:</td>'
            bloque1 += '<td colspan="10" align="left" class="border" style="font-size: 10px;">' + legalName + '</td>'
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

            let busquedaCasos = search.load('customsearch_caso_busqueda');
            let resultCasos = busquedaCasos.run().getRange(0, 100);
            log.debug('Casos', resultCasos);
            for (let i in resultCasos) {
                let asunto = resultCasos[i].getValue({ name: "title" });
                let numero = resultCasos[i].getValue({ name: "casenumber" });
                let estado = resultCasos[i].getText({ name: "status" });
                let prioridad = resultCasos[i].getText({ name: "priority" });
                let asignado = resultCasos[i].getText({ name: "assigned" });

                detalleSoporte += '<tr>'
                detalleSoporte += '<td>' + asunto + '</td>'
                detalleSoporte += '<td>' + numero +'</td>'
                detalleSoporte += '<td>' + estado + '</td>'
                detalleSoporte += '<td>' + prioridad + '</td>'
                detalleSoporte += '<td>' + asignado + '</td>'
                detalleSoporte += '</tr>'
            }
            fileContent = fileContent.replace('<!--detallesoporte-->', detalleSoporte);



            renderer.templateContent = fileContent;
            const pdfFile = renderer.renderAsPdf();
            context.response.writeFile(pdfFile, true);
        } catch (error) {
            log.debug('Error', error);
        }
    }

    return {
        onRequest: onRequest
    }
});

