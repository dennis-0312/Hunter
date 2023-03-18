/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/currentRecord', 'N/ui/message'], (search, currentRecord, message) => {
    const HT_BIENES_SEARCH = "customsearch_ht_bienes"; //HT Bienes - PRODUCCION
    const HT_CONSULTA_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_consulta_orden_servicio'; //HT Consulta Orden de Servicio - PRODUCCION
    const HT_DETALLE_ORDEN_SERVICIO_SEARCH = 'customsearch_ht_detalle_orden_servicio'; //HT Detalle Orden de Servicio - PRODUCCION
    let typeMode = '';

    const pageInit = (context) => {
        typeMode = context.mode; //!Importante, no borrar.
        // var vendfield = objRecord.getField('custrecord_ht_db_item');

        // vendfield.removeSelectOption({ value: null });
        // vendfield.insertSelectOption({
        //     value: 9,
        //     text: 'HUNTER BASICO HUNTER BASICO'
        // });
    }

    const saveRecord = (context) => {
        const objRecord = currentRecord.get();
        let retorno = true;
        let placa = ''
        try {
            if (typeMode == 'create' || typeMode == 'copy') {
                // let serviceOrderId = objRecord.getValue('custrecord_ht_db_enlace');
                // let objSearch1 = search.load({ id: HT_DETALLE_ORDEN_SERVICIO_SEARCH });
                // let filters1 = objSearch1.filters;
                // const filterIntenalID = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: serviceOrderId });
                // filters1.push(filterIntenalID);
                // let resultCount1 = objSearch1.runPaged().count;
                // let result1 = objSearch1.run().getRange({ start: 0, end: 1 });
                // let clienteId = result1[0].getValue({ name: "internalid", join: "customerMain" });
                // let clienteName = result1[0].getValue({ name: "altname", join: "customerMain" });
                // let bienesList = objRecord.getValue('custrecord_ht_db_bien');
                // let bienesListText = objRecord.getText('custrecord_ht_db_bien');
                // console.log(bienesListText);
                // for (let i in bienesList) {
                //     // console.log(bienesList[i]);
                //     let objSearch = search.load({ id: HT_BIENES_SEARCH });
                //     let filters = objSearch.filters;
                //     const filterClienteID = search.createFilter({ name: 'custrecord_ht_bien_propietario', operator: search.Operator.ANYOF, values: clienteId });
                //     const filterBienID = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: bienesList[i] });
                //     filters.push(filterClienteID);
                //     filters.push(filterBienID);
                //     let resultCount = objSearch.runPaged().count;
                //     if (resultCount == 0) {
                //         let myMsg3 = message.create({
                //             title: 'Vehículo seleccionado no asociado al cliente',
                //             message: clienteName + ' no es el propietario del vehículo ' + bienesListText[i],
                //             type: message.Type.ERROR,
                //         });
                //         myMsg3.show();
                //         setTimeout(myMsg3.hide, 8000);
                //         retorno = false;
                //     }
                //     // else {
                //     //     console.log(bienesList[i] + ' - Si es tu carro');
                //     // }
                // }
                // return retorno

                let itemList = objRecord.getValue('custrecord_ht_db_item');
                let itemListText = objRecord.getText('custrecord_ht_db_item');
                let serviceOrderId = objRecord.getValue('custrecord_ht_db_enlace');
                let serviceOrderText = objRecord.getText('custrecord_ht_db_enlace');

                for (let i in itemList) {
                    let objSearch = search.load({ id: HT_DETALLE_ORDEN_SERVICIO_SEARCH });
                    let filters = objSearch.filters;
                    const filterItemID = search.createFilter({ name: 'internalid', join: 'item', operator: search.Operator.ANYOF, values: itemList[i] });
                    const filterServiceOrderID = search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: serviceOrderId });
                    filters.push(filterItemID);
                    filters.push(filterServiceOrderID);
                    let resultCount = objSearch.runPaged().count;
                    if (resultCount == 0) {
                        let myMsg3 = message.create({
                            title: 'Item no asociado a la Orden de Servicio',
                            message: 'El item ' + itemListText[i] + ' no está asociada la orden de servicio ' + serviceOrderText,
                            type: message.Type.ERROR,
                        });
                        myMsg3.show();
                        setTimeout(myMsg3.hide, 8000);
                        retorno = false;
                    }
                    // else {
                    //     console.log(itemList[i] + ' - Si es el item');
                    // }
                }
                return retorno
            }
        } catch (error) {
            console.log(error);
        }
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});
