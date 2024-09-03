require(['N/query'],
  function (query) {
    var custUnbilledQuery = `SELECT 
                                  customer.entityid, 
                                  BUILTIN.DF(customer.defaultbillingaddress), 
                                  ROUND(BUILTIN.CURRENCY_CONVERT(customer.balancesearch), 2), 
                                  BUILTIN.CURRENCY_CONVERT(customer.unbilledorderssearch), 
                                  ROUND(((customer.creditlimit - customer.balancesearch) / NULLIF(customer.creditlimit, 0))*100, 2) 
                                FROM 
                                  customer, 
                                  customersubsidiaryrelationship 
                                WHERE 
                                  customer.id = customersubsidiaryrelationship.entity 
                                  AND customersubsidiaryrelationship.subsidiary = 1             /*subsidiary is US-West*/
                                  AND customer.entitystatus = 13                                /*status is Customer - Closed Won*/
                                  AND customer.unbilledorderssearch > 0 
                                  AND customer.salesrep =-5                                     /*sales rep is your account (administrator)*/
                                ORDER BY 
                                  customer.entityid ASC`;

    //executing the query
    var resultSet = query.runSuiteQLPaged({
      query: custUnbilledQuery,
      pageSize: 10
    }).iterator();

    //displaying the query
    resultSet.each(function (page) {
      var pageIterator = page.value.data.iterator();
      //optional page marker
      /*log.debug({
          title: 'NEW PAGE MARKER'
      });*/
      pageIterator.each(function (row) {

        log.debug({
          title: 'Customer: ' + row.value.getValue(0) + '\n' +
            'Address: ' + row.value.getValue(1) + '\n' +
            'Balance: ' + row.value.getValue(2) + '\n' +
            'Unbilled Order: ' + row.value.getValue(3) + '\n' +
            '% of Credit Remaining: ' + row.value.getValue(4)
        });

        return true;

      });

      return true;

    });
  });