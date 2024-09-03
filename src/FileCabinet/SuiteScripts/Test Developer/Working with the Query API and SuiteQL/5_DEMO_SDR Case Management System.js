require(['N/query'],
	function (query) {

		var myLoadedQuery = query.load({
			id: 'custworkbook_sdr_wb_employee_cases'
		});

		//joining the customer record
		var customerJoin = myLoadedQuery.joinTo({
			fieldId: 'company',
			target: 'customer'
		});

		//joining the contact record
		var contactJoin = customerJoin.autoJoin({
			fieldId: 'contactlist'
		});

		//creating the conditions
		var firstCondition = myLoadedQuery.createCondition({
			fieldId: 'category', //field id of type
			operator: query.Operator.ANY_OF,
			values: [1, 2, 3] //equivalent to: TYPE IS ANY OF: CONCERN, PROBLEM OR QUESTION
		});

		var secondCondition = myLoadedQuery.createCondition({
			fieldId: 'timeelapsed',
			operator: query.Operator.GREATER,
			values: 0
		});

		var thirdCondition = contactJoin.createCondition({
			fieldId: 'phone',
			operator: query.Operator.EMPTY_NOT
		});


		//applying  the condition
		myLoadedQuery.condition = myLoadedQuery.and(firstCondition, secondCondition, thirdCondition);

		//creating the columns
		myLoadedQuery.columns = [
			myLoadedQuery.createColumn({
				fieldId: 'casenumber',
				alias: 'Case Number'
			}),
			myLoadedQuery.createColumn({
				fieldId: 'startdate',
				alias: 'Incident Date'
			}),
			myLoadedQuery.createColumn({
				fieldId: 'title',
				alias: 'Subject'
			}),
			myLoadedQuery.createColumn({
				fieldId: 'status',
				context: query.FieldContext.DISPLAY,
				alias: 'Status'
			}),
			myLoadedQuery.createColumn({
				fieldId: 'assigned',
				context: query.FieldContext.DISPLAY,
				alias: 'Assigned'
			}),
			myLoadedQuery.createColumn({
				fieldId: 'company',
				context: query.FieldContext.DISPLAY,
				alias: 'Company'
			}),
			myLoadedQuery.createColumn({
				fieldId: 'escalateto',
				context: query.FieldContext.DISPLAY,
				alias: 'Escalated To'
			}),
			myLoadedQuery.createColumn({
				fieldId: 'lastcustomermessagereceived',
				alias: 'Last Message Recieved'
			}),
			contactJoin.createColumn({
				fieldId: 'phone',
				alias: 'Customer Contact'
			}),


			//Adding a formula field to display the converted Time Elapsed to Days and Hours
			myLoadedQuery.createColumn({
				type: query.ReturnType.STRING,
				formula: `CONCAT('Days: ', TO_CHAR(FLOOR({timeelapsed}/24)), '| Hours: ', TO_CHAR(MOD(TO_NUMBER({timeelapsed}),24)) )`,
				alias: 'Days | Hours'
			}),
			//Adding a formula field that would display the billable amount: (time elapsed / 24) * 20 return 0.00 if the result is negative.
			myLoadedQuery.createColumn({
				type: query.ReturnType.STRING,
				formula: `CASE WHEN ({timeelapsed} /24) * 20 > 0 THEN TO_CHAR(({timeelapsed} /24) * 20 , '99,999,999.99') ELSE '0.00' END`,
				alias: 'Billable Amount'
			})
		];


		//sorting results
		myLoadedQuery.sort = [
			myLoadedQuery.createSort({
				column: myLoadedQuery.columns[0],
				ascending: false,
				caseSensitive: true,
				locale: query.SortLocale.EN_CA,
				nullsLast: false
			})
		];

		//executing the query
		var resultSet = myLoadedQuery.run();
		var results = resultSet.results;


		//displaying the query
		log.debug({
			title: 'Query Length: ',
			details: results.length
		});

		for (var i = 0; i < results.length; i++) {
			var mResult = results[i].asMap();
			log.debug({
				title: mResult
			});

		}
	});

