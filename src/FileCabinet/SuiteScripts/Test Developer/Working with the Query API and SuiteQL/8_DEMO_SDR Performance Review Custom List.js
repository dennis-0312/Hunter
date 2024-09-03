/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/query', 'N/url'],

	function (serverWidget, query, url) {

		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		function onRequest(context) {
			var request = context.request;
			var response = context.response;

			//getting the parameters
			var emp_id = request.parameters.custparam_employee;
			var emp_disp = request.parameters.custparam_employee_disp;

			//loading and modfying the query
			var myLoadedQuery = query.load({
				id: 'custworkbook_sdr_wb_employee_cases'
			});

			var customerJoin = myLoadedQuery.joinTo({
				fieldId: 'company',
				target: 'customer'
			});

			var leadSourceJoin = customerJoin.joinTo({
				fieldId: 'leadsource',
				target: 'searchcampaign'
			});


			var firstCondition = myLoadedQuery.createCondition({
				fieldId: 'assigned',
				operator: query.Operator.ANY_OF,
				values: emp_id
			});

			var secondCondition = myLoadedQuery.createCondition({
				fieldId: 'timeelapsed',
				operator: query.Operator.GREATER,
				values: 0
			});

			myLoadedQuery.condition = myLoadedQuery.and(firstCondition, secondCondition);

			myLoadedQuery.columns = [
				myLoadedQuery.createColumn({
					fieldId: 'casenumber'
				}),
				myLoadedQuery.createColumn({
					fieldId: 'startdate'
				}),
				myLoadedQuery.createColumn({
					fieldId: 'title'
				}),
				myLoadedQuery.createColumn({
					fieldId: 'status',
					context: query.FieldContext.DISPLAY
				}),
				myLoadedQuery.createColumn({
					fieldId: 'assigned',
					context: query.FieldContext.DISPLAY
				}),
				myLoadedQuery.createColumn({
					fieldId: 'company',
					context: query.FieldContext.DISPLAY
				}),
				myLoadedQuery.createColumn({
					fieldId: 'escalateto',
					context: query.FieldContext.DISPLAY
				}),
				leadSourceJoin.createColumn({
					fieldId: 'category',
					context: query.FieldContext.DISPLAY
				}),
				//Adding a formula field to display the converted Time Elapsed to Days and Hours
				myLoadedQuery.createColumn({
					type: query.ReturnType.STRING,
					formula: `CONCAT('Days: ', TO_CHAR(FLOOR({timeelapsed}/24)), '| Hours: ', TO_CHAR(MOD(TO_NUMBER({timeelapsed}),24)) )`
				})
			];


			myLoadedQuery.sort = [
				myLoadedQuery.createSort({
					column: myLoadedQuery.columns[0],
					ascending: false
				})
			];

			var resultSet = myLoadedQuery.run();
			var results = resultSet.results;

			log.debug({
				title: 'Query Length: ',
				details: results.length
			});

			//end of query


			//creating the custom list
			var list = serverWidget.createList({
				title: 'Cases Handled by ' + emp_disp
			});

			//adding columns to the list
			list.addColumn({
				id: 'casenumber',
				type: serverWidget.FieldType.TEXT,
				label: 'Case Number'
			});
			list.addColumn({
				id: 'startdate',
				type: serverWidget.FieldType.TEXT,
				label: 'Start Date'
			});
			list.addColumn({
				id: 'title',
				type: serverWidget.FieldType.TEXT,
				label: 'Subject'
			});
			list.addColumn({
				id: 'status',
				type: serverWidget.FieldType.TEXT,
				label: 'Status'
			});
			list.addColumn({
				id: 'assigned',
				type: serverWidget.FieldType.TEXT,
				label: 'Assigned To'
			});
			list.addColumn({
				id: 'company',
				type: serverWidget.FieldType.TEXT,
				label: 'Company'
			});
			list.addColumn({
				id: 'escalateto',
				type: serverWidget.FieldType.TEXT,
				label: 'Escalate To'
			});
			list.addColumn({
				id: 'lscampaign',
				type: serverWidget.FieldType.TEXT,
				label: 'Lead Source Campaign Category'
			});
			list.addColumn({
				id: 'dayshours',
				type: serverWidget.FieldType.TEXT,
				label: 'Days | Hours'
			});


			//adding rows based on the results query

			for (var i = results.length - 1; i >= 0; i--) {
				list.addRows({
					rows: [{
						casenumber: results[i].values[0] + '',
						startdate: results[i].values[1] + '',
						title: results[i].values[2] + '',
						status: results[i].values[3] + '',
						assigned: results[i].values[4] + '',
						company: results[i].values[5] + '',
						escalateto: results[i].values[6] + '',
						lscampaign: results[i].values[7] + '',
						dayshours: results[i].values[8] + ''
					}]
				});
			}

			//creating the url
			var perfRecord = url.resolveRecord({
				recordType: 'customrecord_sdr_perf_review',
				isEditMode: true
			});

			//displaying the url
			list.addPageLink({
				title: 'Create Performance Review Record',
				type: serverWidget.FormPageLinkType.BREADCRUMB,
				url: perfRecord
			});

			response.writePage(list);
		}


		return {
			onRequest: onRequest
		};

	});
