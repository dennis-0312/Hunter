/**
* @NApiVersion 2.x
* @NScriptType Suitelet
*/

define(['N / record', 'N / log'], function (record, log) {
    function createAssemblyBuild(workOrderId, buildQuantity, itemsInfo) {
        var workOrderRecord = record.load({ type: record.Type.WORK_ORDER, id: workOrderId });
        var assemblyBuild = record.create({ type: record.Type.ASSEMBLY_BUILD });

        assemblyBuild.setValue({ fieldId: 'assemblyitem', value: workOrderRecord.getValue('assemblyitem') });
        assemblyBuild.setValue({ fieldId: 'location', value: workOrderRecord.getValue('location') });
        assemblyBuild.setValue({ fieldId: 'quantity', value: buildQuantity });
        assemblyBuild.setValue({fieldId: 'workorder',value: workOrderId});

        itemsInfo.forEach(function (itemInfo) {
            var itemIndex = assemblyBuild.findSublistLineWithValue({ sublistId: 'component', fieldId: 'item', value: itemInfo.itemId });
            if (itemIndex !== -1) {
                assemblyBuild.setSublistValue({ sublistId: 'component', fieldId: 'quantity', line: itemIndex, value: itemInfo.itemQuantity });
                // Find the bin number from the original work order
                var woItemIndex = workOrderRecord.findSublistLineWithValue({ sublistId: 'item', fieldId: 'item', value: itemInfo.itemId });

                if (woItemIndex !== -1) {
                    var binNumber = workOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'binnumber', line: woItemIndex });








                    // Create an inventory detail record for the item
                    var inventoryDetail = record.create({ type: record.Type.INVENTORY_DETAIL });
                    // Consume serial numbers with the provided quantity
                    itemInfo.serialNumbers.forEach(function (serialNumberInfo) {
                        inventoryDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                        inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', value: serialNumberInfo.serialNumber });
                        inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binNumber });
                        inventoryDetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: serialNumberInfo.quantity });
                        inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });
                    });

                    // Set the inventory detail on the assembly build component
                    var inventoryDetailId = inventoryDetail.save();
                    assemblyBuild.setSublistValue({ sublistId: 'component', fieldId: 'inventorydetail', line: itemIndex, value: inventoryDetailId });
                }
            }
        });
        var buildId = assemblyBuild.save();
        return buildId;
    }

    function onRequest(context) {
        if (context.request.method === 'POST') {
            var requestBody = JSON.parse(context.request.body);
            try {
                var buildId = createAssemblyBuild(
                    requestBody.workOrderId,
                    requestBody.buildQuantity,
                    requestBody.itemsInfo
                );
                context.response.write({ output: 'Assembly build record created successfully with ID:' + buildId });
            } catch (error) { }
        }
    }

    return {
        onRequest: onRequest
    };

});
