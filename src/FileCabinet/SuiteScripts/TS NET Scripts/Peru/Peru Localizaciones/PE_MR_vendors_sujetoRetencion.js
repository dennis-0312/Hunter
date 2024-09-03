/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/record'], function (log, search, record) {

    function getInputData() {
        let vendors_a_cambiar = [];
        try {
            var vendorSearch = search.create({
                type: search.Type.VENDOR,
                filters: [
                    ["custentity_pe_is_wh_agent", "is", "false"],
                    "AND",
                    ["custentity_pe_is_agent_perception", "is", "false"],
                    "AND",
                    ["custentity_pe_is_good_contributor", "is", "false"],
                    // "AND",
                    // ["custentity_pe_sujeto_retencion", "is", "false"],
                    "AND",
                    ["custentity_pe_document_type", "is", "4"],//RUC
                    "AND",
                    ["custentity_pe_entity_country", "is", "187"]//PERU
                ],
                columns: ['custentity_pe_is_wh_agent', 'custentity_pe_is_agent_perception', 'custentity_pe_is_good_contributor', 'custentity_pe_sujeto_retencion',
                    'custentity_4601_defaultwitaxcode',//20230802
                    'entityid', 'custentity_pe_document_number']
            });
            let searchResult = vendorSearch.run();

            let pageSize = 1000;
            let pageIndex = 0;
            let resultCount = 0;

            let contador_pagina = 1;
            log.debug('MISAKI', 'start = ' + (pageIndex * pageSize) + ', end = ' + ((pageIndex + 1) * pageSize))
            let page = searchResult.getRange({
                start: pageIndex * pageSize,
                end: (pageIndex + 1) * pageSize,
            });
            log.debug('MISAKI', 'page[' + contador_pagina + '].length = ' + page.length)
            while (page.length > 0) {
                page.forEach(function (result) {
                    let vendorId = result.id;
                    var ISAgentePercepcion = result.getValue('custentity_pe_is_agent_perception')
                    var ISAgenteRetencion = result.getValue('custentity_pe_is_wh_agent')
                    var ISBuenContribuyente = result.getValue('custentity_pe_is_good_contributor')
                    var ISSujetoRetencion = result.getValue('custentity_pe_sujeto_retencion')
                    var CodRetencionImpuestos = result.getValue('custentity_4601_defaultwitaxcode')//20230802

                    let data_vendor = {}
                    data_vendor.vendorId = vendorId
                    data_vendor.ISAgentePercepcion = ISAgentePercepcion
                    data_vendor.ISAgenteRetencion = ISAgenteRetencion
                    data_vendor.ISBuenContribuyente = ISBuenContribuyente
                    data_vendor.ISSujetoRetencion = ISSujetoRetencion
                    data_vendor.CodRetencionImpuestos = CodRetencionImpuestos//20230802
                    vendors_a_cambiar.push(data_vendor)

                });
                resultCount += page.length;
                pageIndex++;

                contador_pagina++;
                log.debug('MISAKI', 'start = ' + (pageIndex * pageSize) + ', end = ' + ((pageIndex + 1) * pageSize))
                page = searchResult.getRange({
                    start: pageIndex * pageSize,
                    end: (pageIndex + 1) * pageSize
                });
                log.debug('MISAKI', 'page[' + contador_pagina + '].length = ' + page.length)
            }

        }
        catch (error) {
            log.debug('MISAKI', 'Error: ' + error)
        }
        log.debug('MISAKI', 'vendors_a_cambiar.length = ' + vendors_a_cambiar.length)
        return vendors_a_cambiar;

    }

    function map(context) {
        try {
            var parsedValue = JSON.parse(context.value);
            var ISAgentePercepcion = parsedValue.ISAgentePercepcion;
            var ISAgenteRetencion = parsedValue.ISAgenteRetencion;
            var ISBuenContribuyente = parsedValue.ISBuenContribuyente;
            var ISSujetoRetencion = parsedValue.ISSujetoRetencion;
            var CodRetencionImpuestos = parsedValue.CodRetencionImpuestos;//20230802
            var vendorId = parsedValue.vendorId;
            let log_vendor = 'vendor [' + vendorId + '] --> AgePercepcion[' + ISAgentePercepcion + '], AgeRetencion[' + ISAgenteRetencion + '], BuenContribuyente[' + ISBuenContribuyente + '], SujetoRetencion[' + ISSujetoRetencion + '], CodRetencionImpuestos[' + CodRetencionImpuestos + ']'
            if (ISAgentePercepcion === false && ISAgenteRetencion === false && ISBuenContribuyente === false &&
                (ISSujetoRetencion === false || CodRetencionImpuestos != '7')
            ) {
                var vendorRecord = record.load({
                    type: record.Type.VENDOR,
                    id: vendorId,
                    isDynamic: true
                });
                vendorRecord.setValue({
                    fieldId: 'custentity_pe_sujeto_retencion',
                    value: true
                });
                vendorRecord.setValue({ fieldId: 'custentity_4601_defaultwitaxcode', value: '7' });//20230802
                vendorRecord.save();
                log_vendor += '--> vendor [' + vendorId + '] actualizado'
                log.debug('MISAKI', log_vendor)
            } else {
                log_vendor += '--> vendor [' + vendorId + '] no actualizado'
                log.debug('MISAKI', log_vendor)
            }

        }
        catch (error) {
            log.debug('MISAKI', 'error: ' + error)
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