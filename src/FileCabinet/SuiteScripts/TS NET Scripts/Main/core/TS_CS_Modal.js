/*********************************************************************************************************************************************
This script for Sales Order (Emisión de Orden de Trabajo) 
/*********************************************************************************************************************************************
File Name: TS_UE_Detalle_Bien.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 13/01/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
=============================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message', 'N/url'], (search, currentRecord, message, url) => {
    let typeMode = '';

    const pageInit = (scriptContext) => {
        typeMode = scriptContext.mode; //!Importante, no borrar.
    }

    const fieldChanged = (scriptContext) => {
        const objRecord = currentRecord.get();
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            var sublistName = scriptContext.sublistId;
            var sublistFieldName = scriptContext.fieldId;
            var line = scriptContext.line;
            // if (sublistName === 'item' && sublistFieldName === 'custcol_ht_os_select_bien') {
            //     let leftPosition;
            //     let topPosition;

            //     leftPosition = (window.screen.width / 2) - ((600 / 2) + 10);
            //     topPosition = (window.screen.width / 2) - ((600 / 2) + 10);

            //     let params = '';
            //     params += 'height=' + 600 + ', width=' + 600;
            //     params += ', left=' + leftPosition + ", top=" + topPosition;
            //     params += ', screenX=' + leftPosition + ", screenY=" + topPosition;
            //     params += ', status=no';
            //     params += ', toolbar=no';
            //     params += ', menubar=no';
            //     params += ', resizable=yes';
            //     params += ', scrollbars=no';
            //     params += ', location=no';
            //     params += ', directories=no';

            //     let customer = objRecord.getValue({ fieldId: 'entity' });
            //     let token = objRecord.getValue({ fieldId: 'custbody_ht_dev_token' });
            //     let item = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
            //     let description = objRecord.getCurrentSublistText({ sublistId: 'item', fieldId: 'item' });
            //     let quantity = objRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });

            //     //objRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_select_bien', value: 2 });
            //     try {
            //         let suiteletURL = url.resolveScript({
            //             scriptId: 'customscript_ts_ui_pop_up',
            //             deploymentId: 'customdeploy_ts_ui_pop_up',
            //             params: {
            //                 'customer': customer,
            //                 'item': item,
            //                 'description': description,
            //                 'quantity': quantity,
            //                 'token': token
            //             }
            //         });
            //         console.log('Init');
            //         window.open(suiteletURL, 'Nueva ventana', params);
            //         return true;
            //     } catch (error) {
            //         alert(error);
            //     }
            // }

            // objRecord.setValue({
            //     fieldId: 'memo',
            //     value: 'Item: ' + objRecord.getCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: 'item'
            //     }) + ' is selected'
            // });


            if (sublistName === 'custpage_sublist1' && sublistFieldName === 'custpage_field_item') {
                // if (objRecord.getCurrentSublistText({ sublistId: 'custpage_sublist1', fieldId: 'custpage_field_item' }).length != 0) {
                let item = objRecord.getCurrentSublistText({ sublistId: 'custpage_sublist1', fieldId: 'custpage_field_item' })
                alert(item);
                //console.log(item);
                // }
            }
        }
    }

    const sublistChanged = (scriptContext) => {
        const objRecord = currentRecord.get();
        var sublistName = scriptContext.sublistId;
        var op = scriptContext.operation;
        if (sublistName === 'item')
            objRecord.setValue({
                fieldId: 'memo',
                value: 'Total has changed to ' + op
            });
    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        //sublistChanged: sublistChanged
    }
});
