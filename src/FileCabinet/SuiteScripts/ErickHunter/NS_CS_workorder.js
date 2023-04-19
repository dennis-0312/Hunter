/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/currentRecord'], function(currentRecord) {


    function sublistChanged(context) {
        var currentRecord = context.currentRecord;
       
                let invDetailRec = currentRecord.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail'});
                //let binNumber = invDetailRec.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber',  line: i });
                let inventoryAssignmentLines = invDetailRec.getLineCount({ sublistId: 'inventoryassignment' });
                console.log(inventoryAssignmentLines);
                //let inventoryAssignment = invDetailRec.getCurrentSublistSubrecord({ sublistId: 'inventoryassignment'});
                for (let j = 0; j < inventoryAssignmentLines; j++) {
                    let inventoryAssignment = invDetailRec.selectLine({ sublistId: 'inventoryassignment', line: j });
                    let binNumber = inventoryAssignment.getCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber' });
                    console.log(inventoryAssignment);
                    console.log(binNumber);
                }
              
               
           
           
     
    }

    return {
        sublistChanged: sublistChanged
    }
});
