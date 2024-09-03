/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
 define(['N/log', 'N/search', 'N/file', 'N/record'], function (log, search, file, record) {

    function getInputData() {
        let carpeta = './SUNAT';
        var nombreArchivo = 'AgenPerc_TXT.txt';

        let vendors_a_cambiar = [];
        try {
            let fileObj = file.load({
                id: carpeta + '/' + nombreArchivo
            });

            let contenido = fileObj.getContents();
            let grupos = contenido.match(/[^|]+(?:\|[^|]+){0,3}/g);
            log.debug('MISAKI', 'Cantidad de RUC en TXT : ' + (grupos.length - 1))
            // let cantidad_proveedores_que_cumplen = 0;/////////////////
            // let cantidad_actualizados = 0;///////////////////

            var filtroJson = []
            // let lista_de_rucs = [];/////////////
            for (let i = 1; i < grupos.length; i++) {
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
            // log.debug('MISAKI', 'filtroJson : ' + filtroJson)

            var vendorSearch = search.create({
                type: search.Type.VENDOR,
                filters: [
                    filtroJson
                ],
                columns: ['custentity_pe_is_agent_perception', 'entityid', 'custentity_pe_document_number'],
            });
            let searchResult = vendorSearch.run();

            let pageSize = 1000;
            let pageIndex = 0;
            let resultCount = 0;

            let contador_pagina=1;
            // log.debug('MISAKI', 'start = ' + (pageIndex * pageSize))
            // log.debug('MISAKI', 'end = ' + ((pageIndex + 1) * pageSize))
            let page = searchResult.getRange({
                start: pageIndex * pageSize,
                end: (pageIndex + 1) * pageSize,
            });
            log.debug('MISAKI', 'page['+contador_pagina+'].length = ' + page.length)

            while (page.length > 0) {
                page.forEach(function (result) {
                    let vendorId = result.id;
                    var ISPercepcion = result.getValue('custentity_pe_is_agent_perception')

                    let data_vendor = {}
                    data_vendor.vendorId = vendorId
                    data_vendor.ISPercepcion = ISPercepcion
                    vendors_a_cambiar.push(data_vendor)
                    
                });

                resultCount += page.length;
                pageIndex++;

                // log.debug('MISAKI', 'start = ' + (pageIndex * pageSize))
                // log.debug('MISAKI', 'end = ' + ((pageIndex + 1) * pageSize))
                contador_pagina++;
                page = searchResult.getRange({
                    start: pageIndex * pageSize,
                    end: (pageIndex + 1) * pageSize
                });
                log.debug('MISAKI', 'page['+contador_pagina+'].length = ' + page.length)
            }
        }
        catch (error) {
            log.debug('MISAKI', 'error = ' + error)
        }

        return vendors_a_cambiar;
    }

    function map(context) {
        try{
            var parsedValue = JSON.parse(context.value);
            var ISPercepcion = parsedValue.ISPercepcion;
            var vendorId = parsedValue.vendorId;
            let log_vendor = 'vendor [' + vendorId + '] --> ISPercepcion['+ISPercepcion+']'
            if (ISPercepcion === false) 
            //if (true)
            {
                var vendorRecord = record.load({
                    type: record.Type.VENDOR,
                    id: vendorId,
                    isDynamic: true
                });
                vendorRecord.setValue({
                    fieldId: 'custentity_pe_is_agent_perception',
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