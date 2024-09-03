/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search'],

    function (search) {

        /**
         * Definition of the Scheduled script trigger point.
         *
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
         * @Since 2015.2
         */
        function execute(scriptContext) {
            var highPrioCases = search.create({
                type: 'supportcase',
                filters:
                    [search.createFilter({
                        name: 'assigned',
                        operator: search.Operator.ANYOF,
                        values: -5                        //-5 is the administrator but can be any employee
                    }),
                    search.createFilter({
                        name: 'priority',
                        operator: search.Operator.ANYOF,
                        values: 1                        //priority is high
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

        }

        return {
            execute: execute
        };

    });
