/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/config', 'N/log', 'N/query', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{config} config
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (config, log, query, record, runtime, search) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */

        const FOLDER_OUTPUT = "6668";

        let currentScript = runtime.getCurrentScript();

        const execute = (scriptContext) => {
            log.error('Proccessing', 'START ================================================');
            let scriptParameters = getScriptParameters();
            if (scriptParameters.assemblyLotIds) {
                let ePaymentPayments = createAssemblyBuild(scriptParameters.assemblyLotIds);
            }
            log.error('Proccessing', 'FINISH ===============================================');
        }

        const getScriptParameters = () => {
            let scriptParameters = new Object();
            scriptParameters.assemblyLotIds = currentScript.getParameter('custscript_ts_ss_ebly_ppr_assemblylot_id');
            //log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const createAssemblyBuild = (workOrderId) => {
            let objJson = [
                // {
                //     serie: "123460010",
                //     quantity: 1,
                //     location: 5,
                //     bin: 4,
                //     lines: [
                //         {
                //             itemid: 791,
                //             serie: "123460010",
                //             bin: 4,
                //         },
                //         {
                //             itemid: 284,
                //             serie: "",
                //             bin: 4,
                //         }
                //     ]
                // }
                {
                    serie: "QUE000002",
                    quantity: 1,
                    location: 8,
                    bin: 308,
                    lines: [
                        {
                            itemid: 791,
                            serie: "QUE000002",
                            bin: 308,
                        },
                        {
                            itemid: 284,
                            serie: "",
                            bin: 308,
                        }
                    ]
                }
            ]
            
            try {
                let arrayBuilds = new Array();
                for (let i = 0; i < objJson.length; i++) {
                    let assemblyBuild = record.transform({
                        fromType: record.Type.WORK_ORDER,
                        fromId: workOrderId,
                        toType: record.Type.ASSEMBLY_BUILD,
                        isDynamic: true
                    });

                    assemblyBuild.setValue({ fieldId: 'quantity', value: objJson[i].quantity });
                    assemblyBuild.setValue({ fieldId: 'location', value: objJson[i].location });

                    if (objJson[i].serie.length > 0) {
                        let invdet = assemblyBuild.getSubrecord({ fieldId: 'inventorydetail' })
                        invdet.selectNewLine({ sublistId: 'inventoryassignment' });
                        invdet.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: objJson[i].serie });
                        invdet.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: objJson[i].bin });
                        invdet.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                        invdet.commitLine({ sublistId: 'inventoryassignment' });
                    }

                    let arrayLines = objJson[i].lines;
                    let countTotal = assemblyBuild.getLineCount({ sublistId: 'component' });
                    for (let j = 0; j < countTotal; j++) {
                        assemblyBuild.selectLine({ sublistId: 'component', line: j });
                        for (let k = 0; k < arrayLines.length; k++) {
                            let component = assemblyBuild.getCurrentSublistValue({ sublistId: 'component', fieldId: 'item' })
                            // log.error('component1', component + ' == ' + arrayLines[k].itemid);
                            if (component == arrayLines[k].itemid) {
                                // log.error('component2', component + ' == ' + arrayLines[k].itemid);
                                assemblyBuild.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: 1 });
                                let detail = assemblyBuild.getCurrentSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail' });
                                if (arrayLines[k].serie.length > 0) {
                                    detail.selectNewLine({ sublistId: 'inventoryassignment' });
                                    detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: 3488 });//3488 //4213
                                } else {
                                    detail.selectLine({ sublistId: 'inventoryassignment', line: 0 })
                                }
                                detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: arrayLines[k].bin });
                                detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                                detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                                detail.commitLine({ sublistId: 'inventoryassignment' });
                                break;
                            } else {
                                assemblyBuild.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: 0 });
                            }
                        }
                        assemblyBuild.commitLine({ sublistId: 'component' });

                        // let itemIndex = assemblyBuild.findSublistLineWithValue({ sublistId: 'component', fieldId: 'item', value: arrayLines[k].itemid });
                        // log.error('itemIndex', itemIndex);
                        // assemblyBuild.selectLine({ sublistId: 'component', line: itemIndex });
                        // assemblyBuild.setCurrentSublistValue({ sublistId: 'component', fieldId: 'quantity', value: 1 });
                        // let detail = assemblyBuild.getCurrentSublistSubrecord({ sublistId: 'component', fieldId: 'componentinventorydetail' });
                        // detail.selectLine({ sublistId: 'inventoryassignment', line: 0 })
                        // if (arrayLines[k].serie.length > 0)
                        //     detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: 4213 });
                        // detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: 4 });
                        // detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1 });
                        // detail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: 1 });
                        // detail.commitLine({ sublistId: 'inventoryassignment' });
                        // assemblyBuild.commitLine({ sublistId: 'component' });
                    }

                    let buildId = assemblyBuild.save();
                    log.error('buildId', buildId);
                    arrayBuilds.push(buildId);
                }
                log.error('arrayBuilds', arrayBuilds);
                return arrayBuilds
            } catch (error) {
                log.error('Error', error);
            }

        }

        return { execute }

    });
