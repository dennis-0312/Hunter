/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['N/record', 'N/cache', 'N/file', 'N/runtime'], function (record, cache, file, runtime) {

	var customrecord_columns = [
		{ name: 'internalid', label: 'internalid' }
	]

	var transaction_columns = [
		{ label: 'internalid', name: 'internalid' },
		{ label: 'tranid', name: 'tranid' },
		{ label: 'name', name: 'name' },
		{ label: 'memo', name: 'memo' },
		{ label: 'currency', name: 'currency' },
		{ label: 'currency_symbol', join: 'currency', name: 'symbol' },
		{ label: 'exchangerate', name: 'exchangerate' },
		{ label: 'trandate', name: 'formuladate', formula: "{trandate}" },
		{ label: 'status', name: 'status' },
		{ label: 'postingperiod', name: 'postingperiod' },
		{ label: 'custbody_ts_importe_op', name: 'custbody_ts_importe_op' },
		{ label: 'custbody_cuenta_op', name: 'custbody_cuenta_op' },
		{ label: 'custbody_ts_related_transaction', name: 'custbody_ts_related_transaction' },
		{ label: 'type', join: 'CUSTBODY_TS_RELATED_TRANSACTION', name: 'type' },
		{ label: 'tipo', name: 'type' },
	];

	var subsidiary_columns = [
		{ label: 'internalid', name: 'internalid' },
		{ label: 'country', name: 'country' },
		{ label: 'legalname', name: 'legalname' },
		{ label: 'name', name: 'name' },
		{ label: 'taxidnum', name: 'taxidnum' },
		{ label: 'address_country', join: 'address', name: 'country' },
		{ label: 'phone', join: 'address', name: 'phone' },
		{ label: 'address1', join: 'address', name: 'address1' },
		{ label: 'address2', join: 'address', name: 'address2' },
		{ label: 'address3', join: 'address', name: 'address3' },
		{ label: 'city', join: 'address', name: 'city' },
		{ label: 'state', join: 'address', name: 'state' },
		{ label: 'zip', join: 'address', name: 'zip' }
	];

	var employee_columns = [
		{ name: 'internalid', label: 'internalid' },
		{ name: 'altname', label: 'altname' },
		{ name: 'firstname', label: 'firstname' },
		{ name: 'lastname', label: 'lastname' },
		{ name: 'entityid', label: 'entityid' },
		{ name: 'title', label: 'title' },
		{ name: 'email', label: 'email' },
		{ name: 'phone', label: 'phone' },
		{ name: 'subsidiary', label: 'subsidiary' },
		{ name: 'custentityts_ec_cod_tipo_doc_identidad', label: 'custentityts_ec_cod_tipo_doc_identidad' },
		{ name: 'department', label: 'department' },
		{ name: 'class', label: 'class' },
		{ name: 'location', label: 'location' },
		{ name: 'custentity_ec_numero_registro', label: 'custentity_ec_numero_registro' },
		{ name: 'address', label: 'address' },
		{ name: 'country', join: 'address', label: 'country' },
		{ name: 'address1', join: 'address', label: 'address1' },
		{ name: 'address2', join: 'address', label: 'address2' },
		{ name: 'zipcode', join: 'address', label: 'zipcode' },
		{ name: 'custentity_ec_cod_banco', label: 'custentity_ec_cod_banco' },
	];

	var customer_columns = [
		{ name: 'internalid', label: 'internalid' },
		{ name: 'altname', label: 'altname' },
		{ name: 'entityid', label: 'entityid' },
		{ name: 'companyname', label: 'companyname' },
		{ name: 'salesrep', label: 'salesrep' },
		{ name: 'category', label: 'category' },
		{ name: 'email', label: 'email' },
		{ name: 'phone', label: 'phone' },
		{ name: 'subsidiary', label: 'subsidiary' },
		{ name: 'custentityts_ec_cod_tipo_doc_identidad', label: 'custentityts_ec_cod_tipo_doc_identidad' },
		{ name: 'vatregnumber', label: 'vatregnumber' },
		{ name: 'address', label: 'address' },
		{ label: 'address_country', join: 'address', name: 'country' },
		{ label: 'address1', join: 'address', name: 'address1' },
		{ label: 'address2', join: 'address', name: 'address2' },
		{ label: 'address3', join: 'address', name: 'address3' },
		{ label: 'city', join: 'address', name: 'city' },
		{ label: 'state', join: 'address', name: 'state' },
		{ name: 'custentity_ec_cod_banco', label: 'custentity_ec_cod_banco' },
	];

	var vendor_columns = [
		{ name: 'internalid', label: 'internalid' },
		{ name: 'altname', label: 'altname' },
		{ name: 'entityid', label: 'entityid' },
		{ name: 'companyname', label: 'companyname' },
		{ name: 'category', label: 'category' },
		{ name: 'comments', label: 'comments' },
		{ name: 'email', label: 'email' },
		{ name: 'phone', label: 'phone' },
		{ name: 'subsidiary', label: 'subsidiary' },
		{ name: 'custentityts_ec_cod_tipo_doc_identidad', label: 'custentityts_ec_cod_tipo_doc_identidad' },
		{ name: 'vatregnumber', label: 'vatregnumber' },
		{ name: 'address', label: 'address' },
		{ label: 'address_country', join: 'address', name: 'country' },
		{ label: 'address1', join: 'address', name: 'address1' },
		{ label: 'address2', join: 'address', name: 'address2' },
		{ label: 'address3', join: 'address', name: 'address3' },
		{ label: 'city', join: 'address', name: 'city' },
		{ label: 'state', join: 'address', name: 'state' }
	];

	var prepayment_columns = [
		{ label: 'custrecord_ts_epmt_prepmt_currency_symbol', join: 'custrecord_ts_epmt_prepmt_currency', name: 'symbol' },
		{ label: 'custrecord_ts_epmt_prepmt_bank_account_number', join: 'custrecord_ts_epmt_prepmt_bank_account', name: 'number' },
		{ label: 'custrecord_ts_epmt_prepmt_bank_account_name', join: 'custrecord_ts_epmt_prepmt_bank_account', name: 'name' },
	];

	var payment_columns = [
		{ label: 'memo', join: 'custrecord_ts_epmt_prepaydet_origin_tran', name: 'memo' },
		{ label: 'custrecord_ts_epmt_prepaydet_entity.type', join: 'custrecord_ts_epmt_prepaydet_entity', name: 'type' }
	];

	let emitidos_columns = [
		{ label: 'internalid', name: 'internalid' },
		{ label: 'tranid', name: 'tranid' },
		{ label: 'memo', name: 'memo' },
		{ label: 'currency', name: 'currency' },
		{ label: 'currency_symbol', join: 'currency', name: 'symbol' },
		{ label: 'exchangerate', name: 'exchangerate' },
		{ label: 'trandate', name: 'formuladate', formula: "{trandate}" },
		{ label: 'status', name: 'custbody_est_emitido' },
		{ label: 'postingperiod', name: 'postingperiod' },
		{ label: 'amount', name: 'amount' },
		{ label: 'account', name: 'account' },
		{ label: 'custbody_ts_related_transaction', name: 'custbody_ts_related_transaction' },
		{ label: 'tipo', name: 'type' },
		{ label: 'custbody_ts_ec_numero_preimpreso', join: 'CUSTBODY_TS_RELATED_TRANSACTION', name: 'custbody_ts_ec_numero_preimpreso' },
		{ label: 'custbody_ec_serie_cxc_retencion', name: 'formulatext', formula: "{CUSTBODY_TS_RELATED_TRANSACTION.custbody_ec_serie_cxc_retencion}" },
		{ label: 'custbody_ts_ec_preimpreso_retencion', join: 'CUSTBODY_TS_RELATED_TRANSACTION', name: 'custbody_ts_ec_preimpreso_retencion' },
		{ label: 'custbody_ht_emitido_pago_electronico', name: 'custbody_ht_emitido_pago_electronico' },
		{ label: 'appliedtotransaction', name: 'appliedtotransaction' }
		
	]

	const getSubsidiaryColumns = () => {
		try {
			return subsidiary_columns;
		} catch (e) {
			log.error('[ Cache - getSubsidiaryColumns ]', e);
		}
	}

	const getCustomerColumns = () => {
		try {
			return customer_columns;
		} catch (e) {
			log.error('[ Cache - getCustomerColumns ]', e);
		}
	}

	const getVendorColumns = () => {
		try {
			return vendor_columns;

		} catch (e) {
			log.error('[ Cache - getVendorColumns ]', e);
		}
	}

	const getEmpoyeeColumns = () => {
		try {
			return employee_columns;
		} catch (e) {
			log.error('[ Cache - getEmpoyeeColumns ]', e);
		}
	}

	const getEPaymentPaymentBatchColumns = () => {
		try {
			let ePaymentPrePaymentColumns = [];
			let ePaymentPrePaymentRecord = record.create({ type: "customrecord_ts_epmt_payment_batch", isDynamic: true });
			ePaymentPrePaymentColumns = getRecordFields(ePaymentPrePaymentRecord);
			ePaymentPrePaymentColumns = ePaymentPrePaymentColumns.concat(prepayment_columns);
			return ePaymentPrePaymentColumns;
		} catch (e) {
			log.error('[ Cache - getEPaymentPaymentBatchColumns ]', e);
		}
	}

	const getEPaymentPaymentColumns = () => {
		try {
			let ePaymentPrePaymentDetailColumns = [];
			let ePaymentPrePaymentDetailRecord = record.create({ type: "customrecord_ts_epmt_payment", isDynamic: true });
			ePaymentPrePaymentDetailColumns = getRecordFields(ePaymentPrePaymentDetailRecord);
			ePaymentPrePaymentDetailColumns = ePaymentPrePaymentDetailColumns.concat(payment_columns);

			return ePaymentPrePaymentDetailColumns;
		} catch (e) {
			log.error('[ Cache - getEPaymentPaymentColumns ]', e);
		}
	}

	const getBankDetailColumns = () => {
		try {
			let bankDetailColumns = [];
			let bankDetailRecord = record.create({ type: "customrecord_2663_entity_bank_details", isDynamic: true });
			bankDetailColumns = getRecordFields(bankDetailRecord);
			return bankDetailColumns;
		} catch (e) {
			log.error('[ Cache - getbankDetailColumns ]', e);
		}
	}

	const geTransactionColumns = () => {
		try {
			return transaction_columns;
		} catch (e) {
			log.error('[ Cache - transaction_columns ]', e);
		}
	}

	const getEmitidosColumns = () => {
		try {
			return emitidos_columns;
		} catch (e) {
			log.error('[ Cache - emitidos_columns ]', e);
		}
	}

	const getRecordFields = (createdRecord) => {
		try {
			let createdRecordColumns = [];
			createdRecordColumns.push({ label: "internalid", name: "internalid", sort: "ASC" });
			let fields = createdRecord.getFields();

			for (var i = 0; i < fields.length; i++) {
				let columnName = fields[i];
				if (columnName.indexOf('custrecord') != 0) continue;
				let field = createdRecord.getField({ fieldId: columnName });
				let type = field.type;
				if (type == 'inlinehtml') continue;
				let column = {};
				if (type == 'date') {
					column = {
						label: columnName,
						name: 'formuladate',
						formula: "{" + columnName + "}"
					};
				} else {
					column = {
						label: columnName,
						name: columnName
					};
				}
				createdRecordColumns.push(column);
			}
			return createdRecordColumns;
		} catch (error) {
			log.error('[ Cache - getRecordFields ]', error);
		}
	}

	const getCustomRecordsColumns = (columnsResult, customRecordsArray) => {
		if (Array.isArray(customRecordsArray)) {
			for (var i = 0; i < customRecordsArray.length; i++) {
				var currentCustomRecordID = customRecordsArray[i];
				var currentRecordContext = record.create({ type: currentCustomRecordID });
				var currentRecordColumns = getRecordColums(currentRecordContext, customrecord_columns);
				columnsResult[currentCustomRecordID] = currentRecordColumns;
			}
		}
	}

	const getRecordColums = (recordObj, columnsArray) => {
		var resultArray = JSON.parse(JSON.stringify(columnsArray));
		var fields = recordObj.getFields();
		if (fields.length < 0) return resultArray;
		if (fields.indexOf("name") > -1) {
			resultArray.push({ name: "name", label: "name" });
		}
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].indexOf("custrecord") === 0) {
				var field = recordObj.getField(fields[i]);
				var type = field.type;
				if (type == "inlinehtml") continue;
				var col = {};
				var colName = fields[i];
				switch (type) {
					case 'date':
						col = {
							name: 'formuladate',
							label: colName,
							formula: '{' + colName + '}'
						};
						break;
					default:
						col = {
							name: colName,
							label: colName
						};
				}
				resultArray.push(col);
			}
		}

		return resultArray;
	}

	const getColumns = (customRecordsArray) => {
		let transaction_columns = geTransactionColumns();
		let subsidiary_columns = getSubsidiaryColumns();
		let employee_columns = getEmpoyeeColumns();
		let customer_columns = getCustomerColumns();
		let vendor_columns = getVendorColumns();
		let epayment_payment_batch_columns = getEPaymentPaymentBatchColumns();
		let epayment_payment_columns = getEPaymentPaymentColumns();
		let bank_detail_columns = getBankDetailColumns();
		let emitidos_columns = getEmitidosColumns();
		let columnsResult = {
			transaction_columns,
			subsidiary_columns,
			employee_columns,
			customer_columns,
			vendor_columns,
			epayment_payment_batch_columns,
			epayment_payment_columns,
			bank_detail_columns,
			emitidos_columns
		};
		getCustomRecordsColumns(columnsResult, customRecordsArray);
		return columnsResult;
	}


	return {
		getColumns
	};

});
