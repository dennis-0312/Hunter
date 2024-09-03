/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/query', 'N/file'],

    function (query, file) {

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {
            //creating the query
            var myCreatedQuery = query.create({
                type: query.Type.CUSTOMER
            });

            var firstCondition = myCreatedQuery.createCondition({
                fieldId: 'searchstage',
                operator: query.Operator.ANY_OF,
                values: 'Lead'
            });
            var secondCondition = myCreatedQuery.createCondition({
                fieldId: 'datecreated',
                operator: query.Operator.WITHIN,
                values: query.RelativeDateRange.LAST_ROLLING_YEAR
            });


            myCreatedQuery.condition = myCreatedQuery.and(firstCondition, secondCondition);

            myCreatedQuery.columns = [
                myCreatedQuery.createColumn({
                    fieldId: 'entityid',
                    aggregate: query.Aggregate.COUNT
                }),
                myCreatedQuery.createColumn({
                    type: query.ReturnType.STRING,
                    formula: `TO_CHAR({datecreated},'Month DD,YYYY')`,
                    groupBy: true
                })
            ];

            var myCreatedQuerySQL = myCreatedQuery.toSuiteQL();
            var suiteQLQuery = myCreatedQuerySQL.query;

            //displaying query on the Execution Log
            log.debug({
                title: 'Query Statement',
                details: suiteQLQuery
            });

            var resultSuiteQL = query.runSuiteQL(myCreatedQuerySQL);
            var results = resultSuiteQL.results;

            log.debug({
                title: 'Query Length: ',
                details: results.length
            });

            for (var i = results.length - 1; i >= 0; i--) {
                log.debug({
                    title: 'Query Values',
                    details: results[i].values
                });
            }
            //end

            return {
                type: 'suiteql',
                query: suiteQLQuery
            };


        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            var queryhResult = JSON.parse(context.value);
            context.write({
                key: context.key,
                value: {
                    LeadCount: queryhResult.values[0],
                    Date: queryhResult.values[1]
                }
            });
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            context.write(context.key, context.values[0]);
        }


        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(context) {
            var keys = '';
            var queryValues = '';
            var len = 0;

            // Use the N/file module to create a file that stores the reduce stage output,
            // which you gathered by using the output iterator.
            var fileObj = file.create({
                name: 'lead_count_suiteql.csv',
                fileType: 'CSV',
                contents: 'Lead Count This Fiscal Year' + '\n'
            });

            context.output.iterator().each(function (key, value) {
                keys += (key + ' ');
                queryValues += (value + '\n').replace('{', '').replace('}', '').replace('"', '');
                fileObj.appendLine({
                    value: (value + '\n').replace('{', '').replace('}', '').replace('"', '')
                });
                len++;
                return true;
            });

            log.audit({
                title: 'Keys',
                details: keys
            });
            log.audit({
                title: 'Values',
                details: queryValues
            });
            log.audit({
                title: 'Length',
                details: len
            });

            fileObj.folder = 291; //internal id - located at filecabinet

            var fileId = fileObj.save();
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
