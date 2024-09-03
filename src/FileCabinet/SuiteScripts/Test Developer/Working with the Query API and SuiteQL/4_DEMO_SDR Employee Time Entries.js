require(['N/query'],
	function (query) {

		//creating the query
		var myCreatedQuery = query.create({
			type: query.Type.TIME_BILL
		});

		var firstCondition = myCreatedQuery.createCondition({
			fieldId: 'memo',
			operator: query.Operator.EMPTY_NOT,
		});

		myCreatedQuery.condition = firstCondition;



		myCreatedQuery.columns = [
			myCreatedQuery.createColumn({
				fieldId: 'trandate'
			}),
			myCreatedQuery.createColumn({
				fieldId: 'employee',
				context: query.FieldContext.DISPLAY
			}),
			myCreatedQuery.createColumn({
				fieldId: 'hours'
			}),
			myCreatedQuery.createColumn({
				fieldId: 'approvalstatus',
				context: query.FieldContext.DISPLAY
			})
		];

		//executing the query
		var resultSet = myCreatedQuery.run();
		var results = resultSet.results;


		//displaying the query
		log.debug({
			title: 'Query Length: ',
			details: results.length
		});

		for (var i = 0; i < results.length; i++) {
			log.debug({
				title: results[i].values
			});
		}
	});