/**
* @NApiVersion 2.1
* @NModuleScope Public
* Task          Date            Author                                         Remarks
* LE            28 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación de la libreria
*
*/

define(['N/record', 'N/runtime', 'N/search'], (record, runtime, search) => {

    const createLog = (paramSub, paramPeriod, paramName) => {
        let featSubsidiary = runtime.isFeatureInEffect({feature: "SUBSIDIARIES"}),
            customRecordAux = record.create({
            type: 'customrecord_pe_generation_logs',
            isDynamic: true
        });

        if (featSubsidiary || featSubsidiary == 'T') {
            var nameDataAux = {
                custrecord_pe_subsidiary_log: paramSub,
                custrecord_pe_period_log: paramPeriod,
                custrecord_pe_report_log: "Procesando...",
                custrecord_pe_status_log: "Procesando...",
                custrecord_pe_file_cabinet_log: "",
                custrecord_pe_book_log: paramName
            };
        } else {
            var nameDataAux = {
                custrecord_pe_period_log: paramPeriod,
                custrecord_pe_report_log: "Procesando...",
                custrecord_pe_status_log: "Procesando...",
                custrecord_pe_file_cabinet_log: "",
                custrecord_pe_book_log: paramName
            };
        }

        for (var key in nameDataAux) {
            if (nameDataAux.hasOwnProperty(key)) {
                customRecordAux.setValue({
                    fieldId: key,
                    value: nameDataAux[key]
                });
            }
        }

        let recordIdAux = customRecordAux.save({
            enableSourcing: false,
            ignoreMandatoryFields: false
        });

       return recordIdAux;
    }

    const loadLog = (paramRecord, paramName, paramUrl) => {
        let customRecord = record.load({
            type: 'customrecord_pe_generation_logs',
            id: paramRecord
        });

        let nameData = {
            custrecord_pe_report_log: paramName,
            custrecord_pe_status_log: 'Generated',
            custrecord_pe_file_cabinet_log: paramUrl,
        };

        for (var key in nameData) {
            if (nameData.hasOwnProperty(key)) {
                customRecord.setValue({
                    fieldId: key,
                    value: nameData[key]
                });
            }
        }
        customRecord.save();
    }

    const noData = (paramRecord) => {
        let customRecord = record.load({
            type: 'customrecord_pe_generation_logs',
            id: paramRecord
        });

        let nameData = {
            custrecord_pe_report_log: "Proceso finalizado",
            custrecord_pe_status_log: "No hay registros",
        };

        for (var key in nameData) {
            if (nameData.hasOwnProperty(key)) {
                customRecord.setValue({
                    fieldId: key,
                    value: nameData[key]
                });
            }
        }
        customRecord.save(paramRecord);
    }

    const callFolder = () => {
        var folderSearch = search.load({
            id: 'customsearch_pe_search_folder'
        });
        var folderID
        let folderResult = folderSearch.run().getRange(0,1);
            if(folderResult.length != 0){
                // let columns = folderResult[0].columns;
                folderID = folderResult[0].getValue(folderSearch.columns[0]);
            }
        
        return folderID;
    }

    return {
        createLog   : createLog,
        loadLog     : loadLog,
        noData      : noData,
        callFolder  : callFolder
    }
});