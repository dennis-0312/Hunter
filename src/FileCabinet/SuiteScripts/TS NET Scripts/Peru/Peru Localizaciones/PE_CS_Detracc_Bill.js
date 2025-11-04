/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search'], function (currentRecord, search) {

    const saveRecord = (context) => { }

    const fieldChanged = (context) => {
        const objRecord = currentRecord.get();
        try {
            let fieldName = context.fieldId;
            if (fieldName == 'custbody_pe_concept_detraction') {
                let currencyName = objRecord.getValue('currencyname')
                let conceptDetraction = objRecord.getValue('custbody_pe_concept_detraction');
                let percentageDetraccion = objRecord.getValue('custbody_pe_percentage_detraccion');

                console.log('monedaName', currencyName);
                console.log('conceptDetraction', conceptDetraction);
                console.log('percentageDetraccion', percentageDetraccion);

                if (conceptDetraction != 1) {
                    let witaxCode = getWitaxCode(conceptDetraction, currencyName);
                    console.log('witaxCode', witaxCode)
                    objRecord.setValue({ fieldId: 'custpage_4601_witaxcode', value: witaxCode.taxCodes, ignoreFieldChange: true });
                    //objRecord.setValue({ fieldId: 'custpage_4601_witaxrate', value: percentageDetraccion, ignoreFieldChange: true });
                }
            }
        } catch (error) {
            console.log('Error-fieldChanged: ' + error);
        }
    }


    const getWitaxCode = (conceptDetraction, currencyName) => {
        try {
            let objSearch = search.create({
                type: "customrecord_pe_concept_detraction",
                filters:
                    [
                        ["internalid", "anyof", conceptDetraction]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "custrecord_pe_code_detraccion", label: "PE Code Detraccion" }),
                        search.createColumn({ name: "custrecord_pe_percentage_detraction", label: "PE Percentage Detraction" }),
                        search.createColumn({ name: "custrecord_pe_tax_codes_pen", label: "PE Tax Code Soles" }),
                        search.createColumn({ name: "custrecord_pe_tax_codes_dol", label: "PE Tax Code Dolares" })
                    ]
            });
            let searchResultCount = objSearch.runPaged().count;
            log.error('searchResultCount-getWitaxCode', searchResultCount);
            const searchResult = objSearch.run().getRange(0, 1);
            log.error('searchResult-getWitaxCode', searchResult);
            let column01 = currencyName == 'Soles' ? searchResult[0].getValue(objSearch.columns[3]) : searchResult[0].getValue(objSearch.columns[4]);
            return {
                taxCodes : column01,
                percentageDetraction : searchResult[0].getValue(objSearch.columns[2])
            };

            // const searchLoad = search.create({
            //     type: "customrecord_4601_witaxcode",
            //     filters:
            //         [
            //             ["custrecord_4601_wtc_witaxtype", "anyof", "1"],
            //             "AND",
            //             ["custrecord_4601_wtc_rate", "equalto", detraction]
            //         ],
            //     columns:
            //         [
            //             search.createColumn({ name: "internalid", label: "Internal ID" })
            //         ]
            // });

            // const searchResult = searchLoad.run().getRange(0, 1);
            // let column01 = searchResult[0].getValue(searchLoad.columns[0]);
            // return column01;



        } catch (error) {
            log.error('Error-getWitaxCode', error)
        }
    }


    return {
        //saveRecord: saveRecord,
        fieldChanged: fieldChanged,
    }
});
