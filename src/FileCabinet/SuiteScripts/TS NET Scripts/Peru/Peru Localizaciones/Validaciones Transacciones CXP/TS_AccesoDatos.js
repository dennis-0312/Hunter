/**
 * @NApiVersion 2.1
 * @Author dfernandez
 */
define(['N/search'],

    (search) => {

        const mappingData = (currentRecord, objParameters) => {
            let objParams = {};
            let scriptParameterValue = '';
            console.log('currentRecord.type', currentRecord.type)
            for (let key in objParameters) {
                if (objParameters.hasOwnProperty(key)) {
                    const scriptParameterKey = objParameters[key];
                    if (currentRecord.type == 'expensereport' && scriptParameterKey.startsWith('custcol')) {
                        scriptParameterValue = currentRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: scriptParameterKey });
                    } else {
                        scriptParameterValue = currentRecord.getValue(scriptParameterKey);
                    }
                    objParams[key] = scriptParameterValue;
                }
            }

            return objParams;
        }

        const validateData = (arrayFilters) => {
            let transactionSearchObj = search.create({
                type: "transaction",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters: arrayFilters,
                columns: [search.createColumn({ name: "internalid" })]
            });
            let searchResultCount = transactionSearchObj.runPaged().count;
            console.log("transactionSearchObj result count", searchResultCount);

            return searchResultCount;
        }


        return {
            mappingData,
            validateData
        }

    });


// [
//     ["type", "anyof", "VendBill", "VendCred"],
//     "AND",
//     ["mainline", "is", "T"],
//     "AND",
//     ["vendor.internalid", "anyof", "34733"],
//     "AND",
//     ["custbody_pe_document_type", "anyof", "50"],
//     "AND",
//     ["custbody_pe_serie_cxp", "is", "F002"],
//     "AND",
//     ["custbody_pe_number", "is", "00001231"],
//     "AND",
//     ["subsidiary", "anyof", "3"],
// ]
