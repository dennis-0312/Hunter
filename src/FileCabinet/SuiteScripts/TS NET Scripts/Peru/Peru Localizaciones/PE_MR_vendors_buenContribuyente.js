/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/file', 'N/record'], function (log, search, file, record) {

    function getInputData() {
        let carpeta = './SUNAT';
        let nombreArchivo = 'BueCont_TXT.txt';

        let vendors_a_cambiar = [];
        try {
            let fileObj = file.load({
                id: carpeta + '/' + nombreArchivo
            });

            let contenido = fileObj.getContents();
            let grupos = contenido.match(/[^|]+(?:\|[^|]+){0,3}/g);
            let cant_rucs_txt = grupos.length - 2//es menos 2: primera y ultima fila
            log.debug('MISAKI', 'Cantidad de RUC en TXT : ' + (cant_rucs_txt))

            let tamanio_bloque = 4000;
            let nro_corrida = 0;
            while (cant_rucs_txt > (tamanio_bloque * nro_corrida)) {
                nro_corrida++;
                desde = tamanio_bloque * (nro_corrida - 1) + 1
                hasta = cant_rucs_txt < tamanio_bloque * nro_corrida ? cant_rucs_txt : tamanio_bloque * nro_corrida

                log.debug('MISAKI', 'CORRIDA Nro: ' + nro_corrida + ' --> desde:' + desde + ', hasta:' + hasta)
                var filtroJson = []
                for (let i = desde; i <= hasta; i++) {
                    var inicio = 0;
                    var fin = grupos[i].indexOf('|');
                    var ruc = grupos[i].substring(inicio, fin).trim();
                    if (filtroJson.length > 0) {
                        filtroJson.push("or")
                    }

                    let filtro1 = ["custentity_pe_document_number", "is", ruc]
                    let filtro = [filtro1]
                    filtroJson.push(filtro)
                }

                var vendorSearch = search.create({
                    type: search.Type.VENDOR,
                    filters: [
                        filtroJson
                    ],
                    columns: ['custentity_pe_is_good_contributor', 'entityid', 'custentity_pe_document_number'],
                });
                let searchResult = vendorSearch.run();

                let pageSize = 500;
                let pageIndex = 0;
                let resultCount = 0;

                let contador_pagina = 1;
                let page = searchResult.getRange({
                    start: pageIndex * pageSize,
                    end: (pageIndex + 1) * pageSize,
                });
                log.debug('MISAKI', 'page[' + contador_pagina + '].length = ' + page.length)

                while (page.length > 0) {
                    page.forEach(function (result) {
                        let vendorId = result.id;
                        var ISBuenContribuyente = result.getValue('custentity_pe_is_good_contributor')

                        let data_vendor = {}
                        data_vendor.vendorId = vendorId
                        data_vendor.ISBuenContribuyente = ISBuenContribuyente
                        vendors_a_cambiar.push(data_vendor)

                    });

                    resultCount += page.length;
                    pageIndex++;

                    contador_pagina++;
                    page = searchResult.getRange({
                        start: pageIndex * pageSize,
                        end: (pageIndex + 1) * pageSize
                    });
                    log.debug('MISAKI', 'page[' + contador_pagina + '].length = ' + page.length)
                }
            }

        }
        catch (error) {
            log.debug('MISAKI', 'error = ' + error)
        }

        log.debug('MISAKI', 'vendors_a_cambiar.length = ' + vendors_a_cambiar.length)
        return vendors_a_cambiar;
    }

    function map(context) {
        try{
            var parsedValue = JSON.parse(context.value);
            var ISBuenContribuyente = parsedValue.ISBuenContribuyente;
            var vendorId = parsedValue.vendorId;
            let log_vendor = 'vendor [' + vendorId + '] --> ISBuenContribuyente['+ISBuenContribuyente+']'
            
            if (ISBuenContribuyente === false) 
            //if (true)
            {
                var vendorRecord = record.load({
                    type: record.Type.VENDOR,
                    id: vendorId,
                    isDynamic: true
                });
                vendorRecord.setValue({
                    fieldId: 'custentity_pe_is_good_contributor',
                    value: true
                    //value: false
                });
                vendorRecord.save();
                log_vendor += '--> vendor [' + vendorId + '] actualizado'
                log.debug('MISAKI', log_vendor)
            }else{
                log_vendor += '--> vendor [' + vendorId + '] no actualizado'
                log.debug('MISAKI', log_vendor)
            }
        }
        catch(error){
            log.debug('MISAKI', 'error: '+error)
        }

    }

    function reduce(context) {

    }

    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});