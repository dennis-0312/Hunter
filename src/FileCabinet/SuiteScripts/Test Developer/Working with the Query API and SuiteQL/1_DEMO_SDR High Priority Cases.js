


require(['N/search'],

   function (search) {
      var highPrioCases = search.create({
         type: 'supportcase',
         filters:
            [search.createFilter({
               name: 'assigned',
               operator: search.Operator.ANYOF,
               values: 13                          //-5 is the administrator but can be any employee
            }),
            search.createFilter({
               name: 'priority',
               operator: search.Operator.ANYOF,
               values: 1                         //priority is high
            })
            ],

         columns: [
            search.createColumn({ name: 'casenumber' }),
            search.createColumn({ name: 'title' }),
            search.createColumn({ name: 'email' }),
            search.createColumn({ name: 'status' }),
            search.createColumn({ name: 'createddate' }),
            search.createColumn({ name: 'phone', join: 'customer' }),
         ]
      });

      var searchResults = highPrioCases.run().getRange({
         start: 0,
         end: 50
      });

      for (var i = 0; i < searchResults.length; i++) {
         var caseNum = searchResults[i].getValue({ name: 'casenumber' });
         var subject = searchResults[i].getValue({ name: 'title' });
         var emailAdd = searchResults[i].getValue({ name: 'email' });
         var stat = searchResults[i].getValue({ name: 'status' });
         var date = searchResults[i].getValue({ name: 'createddate' });
         var custPhone = searchResults[i].getValue({ name: 'phone', join: 'customer' });

         log.debug({
            title: 'High Priority Cases',
            details: 'Case No. : ' + caseNum + '\n' +
               'Subject : ' + subject + '\n' +
               'Customer Email : ' + emailAdd + '\n' +
               'Case Status : ' + stat + '\n' +
               'Date : ' + date + '\n' +
               'Contact : ' + custPhone
         });

      }

      var x = 0;
   });