require(['N/query'],
	function (query) {

		//creating the query
		var myCreatedQuery = query.create({
			type: query.Type.SUPPORT_CASE
		});

		myCreatedQuery.columns = [
			myCreatedQuery.createColumn({
				fieldId: 'assigned',
				context: query.FieldContext.DISPLAY
			}),
			myCreatedQuery.createColumn({
				fieldId: 'company',
				context: query.FieldContext.DISPLAY
			}),
			myCreatedQuery.createColumn({
				fieldId: 'casenumber'
			}),
			myCreatedQuery.createColumn({
				fieldId: 'startdate'
			}),
			myCreatedQuery.createColumn({
				fieldId: 'lastcustomermessagereceived'
			}),
			myCreatedQuery.createColumn({
				fieldId: 'status',
				context: query.FieldContext.DISPLAY
			}),
			myCreatedQuery.createColumn({
				fieldId: 'title'
			}),
			myCreatedQuery.createColumn({
				fieldId: 'category',
				context: query.FieldContext.DISPLAY
			})
		];

		//converting query to suiteql
		var mySuiteQLQuery = myCreatedQuery.toSuiteQL();

		//displaying the SuiteQL String representation of the constructed query
		var suiteQLQuery = mySuiteQLQuery.query;
		log.debug({
			title: 'SuiteQL query: ',
			details: suiteQLQuery
		});


		//executing the query
		var resultSet = mySuiteQLQuery.run();
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