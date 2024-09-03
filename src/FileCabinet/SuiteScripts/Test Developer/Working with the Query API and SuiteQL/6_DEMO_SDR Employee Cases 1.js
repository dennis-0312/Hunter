require(['N/query'],
	function (query) {

		var myLoadedQuery = query.load({
			id: 'custworkbook_sdr_wb_employee_cases'	//workbook or dataset id	
		});

		//convert to suiteql
		var mySuiteQLQuery = myLoadedQuery.toSuiteQL();

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

