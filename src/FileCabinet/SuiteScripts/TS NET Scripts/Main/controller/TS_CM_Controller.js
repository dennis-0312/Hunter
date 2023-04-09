/**
 * @NApiVersion 2.1
 */
define([
    'N/log',
    'N/record',
    'N/search',
    '../constant/TS_CM_Constant',
],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search, _constant) => {

        //! FUNCTIONS ====================================================================================================================================================
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


        const createInvoice = (serviceOrder) => {
            let recTransform = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: serviceOrder,
                toType: record.Type.INVOICE,
                isDynamic: true,
            });

            recTransform.setValue('custbodyts_ec_tipo_documento_fiscal', _constant.Constants.DOCUMENT_TYPE.INVOICE);
            return recTransform.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        const createJournal = (fecha, provision, nota) => {
            const objRecord = record.create({ type: record.Type.JOURNAL_ENTRY, isDynamic: true });

            objRecord.setValue({ fieldId: 'trandate', value: new Date(fecha) });
            //objRecord.setValue({ fieldId: 'currency', value: context.currency });
            objRecord.setValue({ fieldId: 'memo', value: nota });
            objRecord.setValue({ fieldId: 'subsidiary', value: 2 });

            objRecord.selectNewLine({ sublistId: 'line' });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 1237, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: provision, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
            objRecord.commitLine({ sublistId: 'line' });

            objRecord.selectNewLine({ sublistId: 'line' });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: 798, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: provision, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'department', value: 310, ignoreFieldChange: false });
            // objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'class', value: 3, ignoreFieldChange: false });
            objRecord.setCurrentSublistValue({ sublistId: 'line', fieldId: 'location', value: 2, ignoreFieldChange: false });
            objRecord.commitLine({ sublistId: 'line' });

            const newJournal = objRecord.save({ ignoreMandatoryFields: false });

            return newJournal
        }

        const createProvisionDetail = (journal, serviceOrder, itemm, amountProvided) => {
            const objRecord = record.create({ type: _constant.Constants.CUSTOM_RECORD.PROVISION_DETAIL, isDynamic: true });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_asiento_provision', value: journal });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_transaccion_prov', value: serviceOrder });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_item', value: itemm });
            objRecord.setValue({ fieldId: 'custrecord_ht_dp_provision', value: amountProvided });
            return objRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
        }

        //! QUERIES =======================================================================================================================================================
        const getTaxes = (tax) => {
            let lookUpTaxCode = search.lookupFields({ type: search.Type.SALES_TAX_ITEM, id: tax, columns: ['internalid', 'rate'] });
            let taxcode = lookUpTaxCode.internalid[0].value;
            let taxrate = lookUpTaxCode.rate;
            taxrate = taxrate.replace('%', '');
            return { 'taxcode': taxcode, 'taxrate': taxrate }
        }

        const getGood = (good, customer) => {
            let objSearch = search.load({ id: _constant.Constants.SEARCHS.SEARCH_FOR_GOOD });
            let filters = objSearch.filters;
            const goodFilter = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: good });
            const customerFilter = search.createFilter({ name: 'custrecord_ht_bien_propietario', operator: search.Operator.ANYOF, values: customer });
            filters.push(goodFilter);
            filters.push(customerFilter);
            let resultCount = objSearch.runPaged().count;
            return resultCount;
        }

        const getServiceOrder = (transaction) => {
            let objSearch = search.load({ id: _constant.Constants.SEARCHS.TRANSACTION_SEARCH });
            let filters = objSearch.filters;
            const typeFilter = search.createFilter({ name: 'type', operator: search.Operator.ANYOF, values: 'SalesOrd' });
            const transactionFilter = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: transaction });
            const statusFilter = search.createFilter({ name: 'status', operator: search.Operator.NONEOF, values: ["SalesOrd:C", "SalesOrd:H", "SalesOrd:D", "SalesOrd:G"] });
            const mainlineFilter = search.createFilter({ name: 'mainline', operator: search.Operator.IS, values: 'T' });
            filters.push(typeFilter);
            filters.push(transactionFilter);
            filters.push(statusFilter);
            filters.push(mainlineFilter);
            let resultCount = objSearch.runPaged().count;
            let result = objSearch.run().getRange({ start: 0, end: 100 });
            log.debug('Result', result);
            return resultCount;
        }

        const getCostProvision = () => {
            let objResults = 0;
            const objTotal = search.load({ id: _constant.Constants.SEARCHS.COST_PROVISION_SEARCH });
            const searchResultCount = objTotal.runPaged().count;
            if (searchResultCount > 0) {
                objResults = objTotal.run().getRange({ start: 0, end: 1 })
            }
            return objResults;
        }

        const getProvisionDetail = () => {
            let json = new Array();
            let searchResult;
            let start = 0;
            let end = 1000;
            let size = 1000;

            const objResults = getCostProvision();
            //const date = new Date('2023-2-1'); //!Elegir fecha
            const date = new Date();
            const ultimoDia = new Date(date.getFullYear(), date.getMonth(), 0);
            log.debug('ultimoDiaTimeZona', ultimoDia);
            if (objResults != 0) {
                const total = objResults[0].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
                const nota = 'Provisión Abril'
                let journal = createJournal(ultimoDia, total, nota);
                log.debug('journal', journal);

                const objSearch = search.load({ id: _constant.Constants.SEARCHS.COST_PROVISION_DETAIL_SEARCH });
                const searchResultCount = objSearch.runPaged().count;
                log.debug('Count', searchResultCount);
                let division = searchResultCount / size;
                let laps = Math.round(division);
                if (division > laps) {
                    laps = laps + 1
                }

                for (let i = 1; i <= laps; i++) {
                    if (i != laps) {
                        searchResult = objSearch.run().getRange({ start: start, end: end });
                    } else {
                        searchResult = objSearch.run().getRange({ start: start, end: searchResultCount });
                    }

                    for (let j in searchResult) {
                        const internalid = searchResult[j].getValue({ name: "internalid", summary: "GROUP" });
                        const item = searchResult[j].getValue({ name: "item", summary: "GROUP" });
                        const provision = searchResult[j].getValue({ name: "formulanumeric", summary: "SUM", formula: "({quantity} - {quantityshiprecv}) * {item.averagecost}" });
                        json.push([journal, internalid, item, provision]);
                    }
                    start = start + size;
                    end = end + size;
                }
                return json;
            } else {
                return 0;
            }
        }


        return {
            createServiceOrder,
            createInvoice,
            createProvisionDetail,
            getTaxes,
            getGood,
            getServiceOrder,
            getProvisionDetail,
        }

    });
