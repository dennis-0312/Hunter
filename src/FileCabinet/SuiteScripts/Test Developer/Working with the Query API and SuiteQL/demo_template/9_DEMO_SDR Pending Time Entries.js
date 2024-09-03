require(['N/query'],
    function (query) {

        var myCreatedQuery = query.create({
            type: query.Type.TIME_BILL
        });

        myCreatedQuery.condition = myCreatedQuery.createCondition({
            fieldId: 'approvalstatus',
            operator: query.Operator.ANY_OF,
            values: 2                                                    //approval status is pending approval
        });

        myCreatedQuery.columns = [
            myCreatedQuery.createColumn({
                fieldId: 'trandate'
            }),
            myCreatedQuery.createColumn({
                fieldId: 'employee',
                context: query.FieldContext.DISPLAY
            }),
            myCreatedQuery.createColumn({
                fieldId: 'customer',
                context: query.FieldContext.DISPLAY
            }),
            myCreatedQuery.createColumn({
                label: 'Hours',
                type: query.ReturnType.STRING,
                formula: `CONCAT(TO_CHAR({hours}), ' hours')`
            }),
            myCreatedQuery.createColumn({
                label: 'Check Date',
                type: query.ReturnType.STRING,
                formula: `CASE WHEN {trandate} = TRUNC(CURRENT_DATE) THEN 'DUE TODAY' WHEN {trandate} < TRUNC(CURRENT_DATE) THEN 'PRIOR TO TODAY' END`
            })
        ];

        //sort according to transaction date
        myCreatedQuery.sort = [
            myCreatedQuery.createSort({
                column: myCreatedQuery.columns[0],
                ascending: true
            })
        ];

        //executing the query
        var resultSet = myCreatedQuery.run();
        var results = resultSet.results;

        //displaying query               
        log.debug({
            title: 'Query Length: ',
            details: results.length

        });

        for (var i = results.length - 1; i >= 0; i--) {
            log.debug({
                title: results[i].values
            });
        }
    });