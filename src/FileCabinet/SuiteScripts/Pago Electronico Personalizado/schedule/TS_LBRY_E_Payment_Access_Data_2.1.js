/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'N/search',
	'./TS_LBRY_E_Payment_Generate_Json_2.1.js'
], (search, GenerateJson) => {
	const getTransactions = (transaction_columns, transactionIDs) => {
		// log.error("transactionIDs", transactionIDs);
		// log.error("transactionIDs", transaction_columns);
		try {
			var Transaction_Search = search.create({
				type: "customtransaction_orden_pago",
				columns: transaction_columns,
				filters: [
					["internalid", "anyof", transactionIDs],
					"AND",
					["mainline", "is", "T"]
				]
			});
			return GenerateJson.getCustomRecordJSON_v3(Transaction_Search);
		} catch (e) {
			log.error('[ AccessData - getTransactions ]', e);
		}
	}

	const getEmitidos = (emitidos_columns, transactionIDs) => {
		// log.error("transactionIDs", transactionIDs);
		// log.error("transactionIDs", transaction_columns);
		try {
			var Transaction_Search = search.create({
				type: "transaction",
				columns: emitidos_columns,
				filters: [
					["internalid", "anyof", transactionIDs],
					"AND",
					["mainline", "is", "T"]
				]
			});
			return GenerateJson.getCustomRecordJSON_v2(Transaction_Search);
		} catch (e) {
			log.error('[ AccessData - getEmitidos ]', e);
		}
	}

	const getSubsidiaries = (subsidiary_columns) => {
		try {
			var Subsidiary_Search = search.create({
				type: search.Type.SUBSIDIARY,
				columns: subsidiary_columns,
				filters: []
			});
			return GenerateJson.getCustomRecordJSON_v2(Subsidiary_Search);
		} catch (e) {
			log.error('[ AccessData - getSubsidiaries ]', e);
		}
	}

	const getEmployees = (employee_columns, employeeIDs) => {
		try {
			var employeeJson = new Object();
			if (!employeeIDs.length) return employeeJson;
			var Employee_Search = search.create({
				type: search.Type.EMPLOYEE,
				columns: employee_columns,
				filters: [{
					name: 'internalid',
					operator: 'anyof',
					values: employeeIDs
				}]
			});
			return GenerateJson.getCustomRecordJSON_v2(Employee_Search);
		} catch (e) {
			log.error('[ AccessData - getEmployees ]', e);
		}
	}

	const getCustomers = (customer_columns, customerIDs) => {
		try {
			var customerJson = new Object();
			if (!customerIDs.length) return customerJson;
			var Customer_Search = search.create({
				type: search.Type.CUSTOMER,
				columns: customer_columns,
				filters: [{
					name: 'internalid',
					operator: 'anyof',
					values: customerIDs
				}]
			});
			return GenerateJson.getCustomRecordJSON_v2(Customer_Search);
		} catch (e) {
			log.error('[ AccessData - getCustomers ]', e);
		}
	}

	const getVendors = (vendor_columns, vendorIDs) => {
		try {
			var vendorJson = new Object();
			if (!vendorIDs.length) return vendorJson;
			var Vendor_Search = search.create({
				type: search.Type.VENDOR,
				columns: vendor_columns,
				filters: [{
					name: 'internalid',
					operator: 'anyof',
					values: vendorIDs
				}]
			});
			return GenerateJson.getCustomRecordJSON_v2(Vendor_Search);
		} catch (e) {
			log.error('[ AccessData - getVendors ]', e);
		}

	}

	const getCustomRecord = (recordName, recordColumns, ids) => {
		try {
			var customRecordJson = new Object();
			var custom_Search = search.create({
				type: recordName,
				columns: recordColumns,
				filters: [{ name: 'isinactive', operator: 'is', values: ['F'] }]
			});
			if (Array.isArray(ids) && ids.length) {
				let internalIdFilter = search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: ids
				});
				custom_Search.filters.push(internalIdFilter);
			}
			customRecordJson = GenerateJson.getCustomRecordJSON_v2(custom_Search);
			return customRecordJson;


		} catch (e) {
			log.error('[ AccessData - getCustomRecord ]', e);
		}

	}

	const getEPaymentPaymentBatchRecord = (ePaymentPrePaymentColumns, ePaymentPrePaymentIds) => {
		try {
			log.error("START", "PREPAYMENT");
			let ePaymentPrePaymentJson = new Object();
			let ePaymentPrePaymentSearch = search.create({
				type: "customrecord_ts_epmt_payment_batch",
				filters: [{
					name: 'internalid',
					operator: 'anyof',
					values: ePaymentPrePaymentIds
				}],
				columns: ePaymentPrePaymentColumns
			});
			ePaymentPrePaymentJson = GenerateJson.getEPaymentPaymentBatchJSON(ePaymentPrePaymentSearch);
			log.error("END", "PREPAYMENT");
			return ePaymentPrePaymentJson;
		} catch (error) {
			log.error('[ AccessData - getEPaymentPaymentBatchRecord ]', error);
		}
	}

	const getEPaymentPaymentRecord = (ePaymentPrePaymentJson, ePaymentPrePaymentDetailColumns, ePaymentPrePaymentIds) => {
		try {
			log.error("START", "PREPAYMENTDETAIL");
			let ePaymentPrePaymentDetailJson = new Object();
			let ePaymentPrePaymentSearch = search.create({
				type: "customrecord_ts_epmt_payment",
				filters: [{
					name: 'custrecord_ts_epmt_prepaydet_pre_payment',
					operator: 'anyof',
					values: ePaymentPrePaymentIds
				}],
				columns: ePaymentPrePaymentDetailColumns
			});
			ePaymentPrePaymentDetailJson = GenerateJson.getEPaymentPaymentJSON(ePaymentPrePaymentSearch);
			for (let id in ePaymentPrePaymentDetailJson) {
				var relatedRecordId = ePaymentPrePaymentDetailJson[id].custrecord_ts_epmt_prepaydet_pre_payment.value;
				if (relatedRecordId) {
					if (ePaymentPrePaymentJson[relatedRecordId].detail === undefined) {
						ePaymentPrePaymentJson[relatedRecordId].detail = [];
						ePaymentPrePaymentJson[relatedRecordId].ebanks = [];
					}
					ePaymentPrePaymentJson[relatedRecordId].detail.push(ePaymentPrePaymentDetailJson[id]);
				}
			}
			log.error("END", "PREPAYMENTDETAIL");
			return ePaymentPrePaymentJson;
		} catch (error) {
			log.error('[ AccessData - getEPaymentPaymentRecord ]', error);
		}
	}

	const getCustomerBankDetailRecord = (ePaymentPrePaymentJson, bankDetailColumns, customerIds) => {
		try {
			log.error("START", "getCustomerBankDetailRecord");
			let bankDetailJson = new Object();
			if (!customerIds.length) return bankDetailJson;
			let bankDetailSearch = search.create({
				type: "customrecord_2663_entity_bank_details",
				filters: [
					{ name: 'custrecord_2663_parent_customer', operator: 'anyof', values: customerIds }
				],
				columns: bankDetailColumns
			});
			bankDetailJson = GenerateJson.getBankDetailJSON(bankDetailSearch, "customer");
			for (let id in ePaymentPrePaymentJson) {
				let prePaymentDetailArray = ePaymentPrePaymentJson[id].detail;
				let paymentFileFormat = ePaymentPrePaymentJson[id].custrecord_ts_epmt_prepmt_pay_file_forma.value;
				for (let i = 0; i < prePaymentDetailArray.length; i++) {
					let prePaymentDetail = prePaymentDetailArray[i];
					let entityId = prePaymentDetail.custrecord_ts_epmt_prepaydet_entity.value;
					if (bankDetailJson[entityId] === undefined) continue;
					for (let j = 0; j < bankDetailJson[entityId].length; j++) {
						let bankDetail = bankDetailJson[entityId][j];
						let entityFileFormat = bankDetail.custrecord_2663_entity_file_format;
						if (!entityFileFormat) continue;
						if (bankDetail.custrecord_2663_entity_file_format.value != paymentFileFormat) continue;
						prePaymentDetail.ebank = bankDetail;
						ePaymentPrePaymentJson[id].ebanks.push(bankDetail);
					}
				}
			}
			log.error("END", "getCustomerBankDetailRecord");
			return bankDetailJson;
		} catch (error) {
			log.error('[ AccessData - getCustomerBankDetailRecord ]', error);
		}
	}

	const getVendorBankDetailRecord = (ePaymentPrePaymentJson, bankDetailColumns, vendorIds) => {
		try {
			log.error("START", "getVendorBankDetailRecord");
			let bankDetailJson = new Object();
			if (!vendorIds.length) return bankDetailJson;
			let bankDetailSearch = search.create({
				type: "customrecord_2663_entity_bank_details",
				filters: [
					{ name: 'custrecord_2663_parent_vendor', operator: 'anyof', values: vendorIds }
				],
				columns: bankDetailColumns
			});
			bankDetailJson = GenerateJson.getBankDetailJSON(bankDetailSearch, "vendor");
			log.error("bankDetailJson[entityId]", bankDetailJson)
			for (let id in ePaymentPrePaymentJson) {
				let prePaymentDetailArray = ePaymentPrePaymentJson[id].detail;
				//log.error("prePaymentDetailArray", prePaymentDetailArray);
				//let paymentFileFormat = ePaymentPrePaymentJson[id].custrecord_ts_epmt_prepmt_pay_file_forma.value;
				//log.error("paymentFileFormat", paymentFileFormat);
				for (let i = 0; i < prePaymentDetailArray.length; i++) {
					let prePaymentDetail = prePaymentDetailArray[i];
					//log.error("prePaymentDetail", prePaymentDetail);
					let entityId = prePaymentDetail.custrecord_ts_epmt_prepaydet_entity.value;
					//log.error("entityId", entityId);
					if (bankDetailJson[entityId] === undefined) continue;
					for (let j = 0; j < bankDetailJson[entityId].length; j++) {
						let bankDetail = bankDetailJson[entityId][j];
						//log.error("bakDetail", bankDetail);
						let entityFileFormat = bankDetail.custrecord_2663_entity_file_format;
						//log.error("entityFileFormat", entityFileFormat);
						if (!entityFileFormat) continue;
						// if (entityFileFormat.value != paymentFileFormat) continue;
						prePaymentDetail.ebank = bankDetail;
						ePaymentPrePaymentJson[id].ebanks.push(bankDetail);
					}
				}
			}
			log.error("END", "getVendorBankDetailRecord");
			return bankDetailJson;
		} catch (error) {
			log.error('[ AccessData - getVendorBankDetailRecord ]', error);
		}
	}

	const getEmployeeBankDetailRecord = (ePaymentPrePaymentJson, bankDetailColumns, employeeIds) => {
		try {
			log.error("START", "getEmployeeBankDetailRecord");
			let bankDetailJson = new Object();
			if (!employeeIds.length) return bankDetailJson;
			let bankDetailSearch = search.create({
				type: "customrecord_2663_entity_bank_details",
				filters: [
					{ name: 'custrecord_2663_parent_employee', operator: 'anyof', values: employeeIds }
				],
				columns: bankDetailColumns
			});
			bankDetailJson = GenerateJson.getBankDetailJSON(bankDetailSearch, "employee");
			for (let id in ePaymentPrePaymentJson) {
				let prePaymentDetailArray = ePaymentPrePaymentJson[id].detail;
				let paymentFileFormat = ePaymentPrePaymentJson[id].custrecord_ts_epmt_prepmt_tef_template.value;
				for (let i = 0; i < prePaymentDetailArray.length; i++) {
					let prePaymentDetail = prePaymentDetailArray[i];
					let entityId = prePaymentDetail.custrecord_ts_epmt_prepaydet_entity.value;
					if (bankDetailJson[entityId] === undefined) continue;
					for (let j = 0; j < bankDetailJson[entityId].length; j++) {
						let bankDetail = bankDetailJson[entityId][j];
						let entityFileFormat = bankDetail.custrecord_ts_epmt_payment_file_format;
						if (!entityFileFormat) continue;
						if (entityFileFormat.value != paymentFileFormat) continue;
						prePaymentDetail.ebank = bankDetail;
						ePaymentPrePaymentJson[id].ebanks.push(bankDetail);
					}
				}
			}
			log.error("END", "getEmployeeBankDetailRecord");
			return bankDetailJson;
		} catch (error) {
			log.error('[ AccessData - getEmployeeBankDetailRecord ]', error);
		}
	}

	return {
		getTransactions,
		getSubsidiaries,
		getEmployees,
		getCustomers,
		getVendors,
		getCustomRecord,
		getCustomerBankDetailRecord,
		getVendorBankDetailRecord,
		getEmployeeBankDetailRecord,
		getEPaymentPaymentBatchRecord,
		getEPaymentPaymentRecord,
		getEmitidos
	};

})