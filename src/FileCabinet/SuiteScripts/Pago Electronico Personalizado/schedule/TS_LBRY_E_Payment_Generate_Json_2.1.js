/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['N/record', 'N/format', 'N/search'], function (record, format, search) {

	const generateEmployeeJSON = (myPage) => {
		try {
			var employeeJson = {};
			myPage.data.forEach(function (result) {
				var columns = result.columns;
				var internalId = result.getValue({ name: 'internalid' });
				if (!employeeJson[internalId]) {
					employeeJson[internalId] = {};
				}
				for (var i = 0; i < columns.length; i++) {
					var value = "";
					if (columns[i].name === 'formuladate') {
						if (result.getValue(columns[i])) {
							value = format.parse({
								value: result.getValue(columns[i]),
								type: format.Type.DATE
							});
							value = value.toISOString();
						}
						employeeJson[internalId][columns[i].label] = value;
					} else if (columns[i].name === 'role') {
						//if(result.getValue(columns[i])) {
						if (!employeeJson[internalId]["roles"]) {
							employeeJson[internalId]["roles"] = [];
						}
						value = getValueYText(result, columns[i]);
						employeeJson[internalId]["roles"].push(value);
						//}
					} else {
						//if (result.getValue(columns[i])) {
						value = getValueYText(result, columns[i]);
						if (value && /^[0-9]*\.[0-9]+/.test(value) && value.split('.').length <= 2) {
							value = parseFloat(value);
						}
						//}
						employeeJson[internalId][columns[i].label] = value;
					}
				}
			});
			return employeeJson;

		} catch (e) {
			log.error('[ GenerateJson - generateEmployeeJSON ]', e);
		}

	}

	const generateCustomerJSON = (myPage) => {
		try {
			var customerJson = {};
			myPage.data.forEach(function (result) {
				var columns = result.columns;
				var internalId = result.getValue({ name: 'internalid' });
				if (!customerJson[internalId]) {
					customerJson[internalId] = {};
				}
				for (var i = 0; i < columns.length; i++) {
					var value = "";
					if (columns[i].name === 'formuladate') {
						if (result.getValue(columns[i])) {
							value = format.parse({
								value: result.getValue(columns[i]),
								type: format.Type.DATE
							});
							value = value.toISOString();
						}
					} else {
						value = getValueYText(result, columns[i]);
						if (value && /^[0-9]*\.[0-9]+/.test(value) && value.split('.').length <= 2) {
							value = parseFloat(value);
						}
					}
					customerJson[internalId][columns[i].label] = value;
				}
			});
			return customerJson;
		} catch (e) {
			log.error('[ GenerateJson - generateCustomerJSON ]', e);
		}

	}

	const generateVendorJSON = (myPage) => {
		try {
			var vendorJson = {};
			myPage.data.forEach(function (result) {
				var columns = result.columns;
				var internalId = result.getValue({ name: 'internalid' });
				if (!vendorJson[internalId]) {
					vendorJson[internalId] = {};
				}
				for (var i = 0; i < columns.length; i++) {
					var value = "";
					if (columns[i].name === 'formuladate') {
						if (result.getValue(columns[i])) {
							value = format.parse({
								value: result.getValue(columns[i]),
								type: format.Type.DATE
							});
							value = value.toISOString();
						}
					} else {
						//  if (result.getValue(columns[i])) {
						value = getValueYText(result, columns[i]);
						if (value && /^[0-9]*\.[0-9]+/.test(value) && value.split('.').length <= 2) {
							value = parseFloat(value);
						}
						//  }
					}
					vendorJson[internalId][columns[i].label] = value;
				}
			});
			return vendorJson;
		} catch (e) {
			log.error('[ GenerateJson - generateVendorJSON ]', e);
		}

	}

	const getCustomRecordJSON_v2 = (savedSearch) => {
		var dataJson = new Object();
		var myPageData = savedSearch.runPaged({ pageSize: 1000 });
		myPageData.pageRanges.forEach(pageRange => {
			var myPage = myPageData.fetch({ index: pageRange.index });
			myPage.data.forEach(result => {
				var columns = result.columns;
				var internalId = result.getValue({ name: 'internalid' });
				if (!dataJson[internalId]) {
					dataJson[internalId] = {};
				}
				for (var i = 0; i < columns.length; i++) {
					var value = "";
					if (columns[i].name === 'formuladate') {
						if (result.getValue(columns[i])) {
							value = format.parse({ value: result.getValue(columns[i]), type: format.Type.DATE });
							value = value.toISOString();
						}
					} else if (columns[i].name === 'formulatext') {
						value = result.getValue(columns[i])
					} else {
						value = getValueYText(result, columns[i]);
						if (value && /^[0-9]*\.[0-9]+/.test(value) && value.split('.').length <= 2) {
							value = parseFloat(value);
						}
					}
					dataJson[internalId][columns[i].label] = value;
				}
			});
		});
		return dataJson;
	}

	const getCustomRecordJSON_v3 = (savedSearch) => {
		var dataJson = new Object();
		let relatedJson = new Object();
		var myPageData = savedSearch.runPaged({ pageSize: 1000 });
		myPageData.pageRanges.forEach(pageRange => {
			var myPage = myPageData.fetch({ index: pageRange.index });
			myPage.data.forEach(result => {
				var columns = result.columns;
				var internalId = result.getValue({ name: 'internalid' });
				if (!dataJson[internalId]) {
					dataJson[internalId] = {};
				}
				for (var i = 0; i < columns.length; i++) {
					var value = "";
					if (columns[i].name === 'formuladate') {
						if (result.getValue(columns[i])) {
							value = format.parse({ value: result.getValue(columns[i]), type: format.Type.DATE });
							value = value.toISOString();
						}
					} else {
						value = getValueYText(result, columns[i]);
						if (value && /^[0-9]*\.[0-9]+/.test(value) && value.split('.').length <= 2) {
							value = parseFloat(value);
						}
					}
					dataJson[internalId][columns[i].label] = value;
				}
				let relatedInternalId = result.getValue({ name: 'custbody_ts_related_transaction' });
				let type = result.getValue({ name: "type", join: "CUSTBODY_TS_RELATED_TRANSACTION" });
				if (relatedInternalId && type == "VendBill") {
					let vendorbillSearchObj = search.create({
						type: "vendorbill",
						filters:
							[["type", "anyof", "VendBill"], "AND", ["internalid", "anyof", relatedInternalId], "AND", ["mainline", "is", "T"]],
						columns:
							[
								search.createColumn({ name: "internalid", label: "Internal ID" }),
								search.createColumn({ name: "tranid", label: "Document Number" }),
								search.createColumn({ name: "custbodyts_ec_tipo_documento_fiscal", label: "EC - Tipo de Documento Fiscal" }),
								search.createColumn({ name: "custbody_ts_ec_serie_doc_cxp", label: "EC - CxP SERIE" }),
								search.createColumn({ name: "custbody_ts_ec_serie_cxc", label: "EC - SERIE CxC" }),
								search.createColumn({ name: "custbody_ts_ec_numero_preimpreso", label: "EC - NUMERO PREIMPRESO" }),
								search.createColumn({ name: "custbodyts_ec_num_autorizacion", label: "EC - Número de Autorización" }),
								search.createColumn({ name: "custbody_ec_fecha_autorizacion", label: "HT Fecha autorización" }),
								search.createColumn({ name: "custbody_ec_serie_cxc_retencion", label: "EC - SERIE CXC RETENCIÓN" }),
								search.createColumn({ name: "custbody_ts_ec_preimpreso_retencion", label: "EC - PREIMPRESO RETENCION" })
							]
					});
					//let searchResultCount = vendorbillSearchObj.runPaged().count;
					vendorbillSearchObj.run().each(res => {
						let retencion = res.getValue({ name: "custbody_ec_serie_cxc_retencion" }) ? res.getText({ name: "custbody_ec_serie_cxc_retencion" }) + res.getValue({ name: "custbody_ts_ec_preimpreso_retencion" }) : '';
						relatedJson = {
							sustento: res.getValue({ name: "custbody_ts_ec_numero_preimpreso" }),
							custbodyts_ec_num_autorizacion: res.getValue({ name: "custbodyts_ec_num_autorizacion" }),
							custbody_ec_fecha_autorizacion: res.getValue({ name: "custbody_ec_fecha_autorizacion" }),
							retencion: retencion
						}
						return true;
					});
				}
				dataJson[internalId].relatedTransaction = relatedJson;
			});
		});
		return dataJson;
	}

	const getEPaymentPaymentBatchJSON = (ePaymentPrePaymentSearch) => {
		try {
			let ePaymentPrePaymentJSON = getRecordJSON(ePaymentPrePaymentSearch);
			return ePaymentPrePaymentJSON;
		} catch (error) {
			log.error('[ GenerateJson - getEPaymentPaymentBatchJSON ]', error);
		}
	}

	const getEPaymentPaymentJSON = (ePaymentPrePaymentDetailSearch) => {
		try {
			let ePaymentPrePaymentDetailJSON = getRecordJSON(ePaymentPrePaymentDetailSearch);
			return ePaymentPrePaymentDetailJSON;
		} catch (error) {
			log.error('[ GenerateJson - getEPaymentPaymentJSON ]', error);
		}
	}

	const getBankDetailJSON = (bankDetailSearch, entityType) => {
		try {
			let dataJson = {};
			let myPageData = bankDetailSearch.runPaged({ pageSize: 1000 });
			myPageData.pageRanges.forEach(function (pageRange) {
				let myPage = myPageData.fetch({ index: pageRange.index });
				myPage.data.forEach(function (result) {
					let columns = result.columns;
					let internalId = result.getValue({ name: 'internalid' });
					let entityId = "";
					if (entityType == "customer") {
						entityId = result.getValue({ name: 'custrecord_2663_parent_customer' });
					} else if (entityType == "vendor") {
						entityId = result.getValue({ name: 'custrecord_2663_parent_vendor' });
					} else if (entityType == "employee") {
						entityId = result.getValue({ name: 'custrecord_2663_parent_employee' });
					}
					log.error("entityId", entityId);
					if (!entityId) return;
					if (dataJson[entityId] === undefined) dataJson[entityId] = [];
					let json = {};
					for (let i = 0; i < columns.length; i++) {
						let value = "";
						if (columns[i].name === 'formuladate') {
							if (!result.getValue(columns[i])) continue;
							value = format.parse({ value: result.getValue(columns[i]), type: format.Type.DATE });
							value = value.toISOString();
						} else {
							value = getValueYText(result, columns[i]);
							if (value && /^[0-9]*\.[0-9]+/.test(value) && value.split('.').length <= 2) {
								value = parseFloat(value);
							}
						}
						json[columns[i].label] = value;
					}
					dataJson[entityId].push(json);
				});
			});
			return dataJson;
		} catch (error) {
			log.error('[ GenerateJson - getBankDetailJSON ]', error);
		}
	}

	const getRecordJSON = (savedSearch) => {
		try {
			let dataJson = {};
			let myPageData = savedSearch.runPaged({ pageSize: 1000 });
			myPageData.pageRanges.forEach(function (pageRange) {
				let myPage = myPageData.fetch({ index: pageRange.index });
				myPage.data.forEach(function (result) {
					let columns = result.columns;
					let internalId = result.getValue({ name: 'internalid' });
					if (!dataJson[internalId]) dataJson[internalId] = {};
					for (let i = 0; i < columns.length; i++) {
						let value = "";
						if (columns[i].name === 'formuladate') {
							if (!result.getValue(columns[i])) continue;
							value = format.parse({
								value: result.getValue(columns[i]),
								type: format.Type.DATE
							});
							value = value.toISOString();
						} else {
							value = getValueYText(result, columns[i]);
							if (value && /^[0-9]*\.[0-9]+/.test(value) && value.split('.').length <= 2) {
								value = parseFloat(value);
							}
						}
						dataJson[internalId][columns[i].label] = value;
					}
				});
			});
			return dataJson;
		} catch (error) {
			log.error("error", error);
		}
	}

	const getValueYText = (result, field) => {
		var value = "";
		var objResult = JSON.parse(JSON.stringify(result)).values;
		if (Array.isArray(objResult[field.label])) {
			value = {
				value: result.getValue(field),
				text: result.getText(field)
			};
		} else {
			value = result.getValue(field);
		}
		return value;
	}


	return {
		generateEmployeeJSON,
		generateVendorJSON,
		generateCustomerJSON,
		getCustomRecordJSON_v2,
		getCustomRecordJSON_v3,
		getEPaymentPaymentBatchJSON,
		getEPaymentPaymentJSON,
		getBankDetailJSON,
		getRecordJSON
	};

})
