
/*=======================================================================================================================================================
This script for resources (Script contenedor de funciones) 
=========================================================================================================================================================
File Name: TS_CM_Controller.js                                                                        
Commit: 01                                                                                                                          
Date: 16/03/2023
Governance points: N/A
========================================================================================================================================================*/
/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search) => {

        const createServiceOrder = (requestHeader, requestDetail) => {
            let objRecord = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
            for (let j in requestHeader) {
                objRecord.setValue({ fieldId: requestHeader[j].field, value: requestHeader[j].value });
            }

            const detail = objRecord.selectNewLine({ sublistId: 'item' });
            for (let k in requestDetail) {
                for (let i in requestDetail[k]) {
                    detail.setCurrentSublistValue({ sublistId: 'item', fieldId: requestDetail[k][i].field, value: requestDetail[k][i].value, ignoreFieldChange: false });
                }
                objRecord.commitLine({ sublistId: 'item' });
            }
            let response = objRecord.save({ ignoreMandatoryFields: true });
            return response;
        }


        const createInvoice = () => {
            let objRecord = record.transform({
                fromType: record.Type.CUSTOMER,
                fromId: 107,
                toType: record.Type.SALES_ORDER,
                isDynamic: true,
            });
        }


        const getTaxes = (tax) => {
            let lookUpTaxCode = search.lookupFields({ type: search.Type.SALES_TAX_ITEM, id: tax, columns: ['internalid', 'rate'] });
            let taxcode = lookUpTaxCode.internalid[0].value;
            let taxrate = lookUpTaxCode.rate;
            taxrate = taxrate.replace('%', '');
            return { 'taxcode': taxcode, 'taxrate': taxrate }
        }

        return {
            createServiceOrder,
            createInvoice,
            getTaxes
        }

    });
