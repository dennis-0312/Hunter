/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

    function _get(busqueda) {
        try {
         log.debug('Request', busqueda);
            // let busqueda = "17866";

           // let objRecord = record.load({ type: record.Type.SALES_ORDER, id: busqueda.busqueda });
           let objRecord = record.load({ type: 'customsale_ht_orden_servicio', id: busqueda.busqueda  });
            log.debug('Busqueda.........', objRecord);
            //let objRecord = record.load({ type: record.Type.CUSTOMER, id: idcustomer, isDynamic: true });
            let tranid = objRecord.getValue({ fieldId: 'tranid' });
            let entityname = objRecord.getValue({ fieldId: 'entityname' });
            //let trandate = objRecord.getValue({ fieldId: 'trandate' });
            let customform = objRecord.getValue({ fieldId: 'customform' });
            let salesrep = objRecord.getValue({ fieldId: 'salesrep' });



            return {
                objRecord: objRecord
            }
            
        } catch (error) {
            log.error('Error-GET', error)
        }

    }

  
    function _post(context) {
        try {

const start = Date.now();
            log.debug('Request', context);
            //const HOME_DELIVERY = 337;
            //const STORE_PICKUP = 338;
            const STATUS_PAGADO = 1;

            //let customer = context.customerid;
            let items = context.items;
            let department = context.department;
            let clases = context.clase;
            let location = context.location;
            //let shipmethod = context.shipmethod;
            //let deliverymethod = '';
            //let subRecordAddress = '';
            let vatregnumber = context.customer;
            let customerform = context.customerform;
            let usuario = context.usuario;
// consulta de internalId
            var busquedaCustomer = search.create({
                type: search.Type.CUSTOMER,
                columns: ['entityid', 'altname', 'internalid'],
                 filters: ['vatregnumber', search.Operator.HASKEYWORDS, vatregnumber]
            });
            var myResultSet = busquedaCustomer.run().getRange({ start: 0, end: 1 });;
            //log.debug('Busqueda.........', myResultSet);
            log.debug('Busqueda.........', myResultSet);
           log.debug('items.........', items);
            var theCount = busquedaCustomer.runPaged().count;
           if (theCount != 1) {
                log.debug('Error consulta', myResultSet);
            } else {
             //consulta de customer el id
                for (let i in myResultSet) {
                    var altname = myResultSet[i].getValue(busquedaCustomer.columns[1]);
                    var customer = myResultSet[i].getValue(busquedaCustomer.columns[2]);
                }
                log.debug('Busqueda.customer........', customer);
                log.debug('Usuario Ingreso.........', usuario);
                // CREATION ORDER RECORD
                //let objRecord = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
                //let objRecord = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
               let objRecord = record.create({ type: 'customsale_ht_orden_servicio', isDynamic: true });
              
                //PRIMARY INFORMATION
                objRecord.setValue({ fieldId: 'entity', value: customer }); //* //REQUEST
                objRecord.setValue({ fieldId: 'customform', value: customerform });

                objRecord.setValue({ fieldId: 'trandate', value: new Date(context.fecha) }); //* //REQUEST
                //*objRecord.setValue({ fieldId: 'otherrefnum', value: context.op }); //*  //REQUEST
                objRecord.setValue({ fieldId: 'memo', value: usuario });
                objRecord.setValue({ fieldId: 'custbody_pe_status_ov', value: STATUS_PAGADO });
                objRecord.setValue({ fieldId: 'custbody_ec_estados_os', value: STATUS_PAGADO });

                //SALES INFORMATION
                objRecord.setValue({ fieldId: 'salesrep', value: context.salesrep }); // REQUEST

                //CLASSIFICATION
                objRecord.setValue({ fieldId: 'department', value: department }); //* //REQUEST
                objRecord.setValue({ fieldId: 'class', value: clases }); //* //REQUEST
                objRecord.setValue({ fieldId: 'location', value: location }); //* //REQUEST

                //SHIPPING
                objRecord.setValue({ fieldId: 'shipdate', value: new Date(context.shipdate) }); //REQUEST

                //BILLING
                //*objRecord.setValue({ fieldId: 'custbody_il_metodo_pago', value: context.paymentmethod }); //REQUEST

                //DELIVERY METHOD
                //*objRecord.setValue({ fieldId: 'shipmethod', value: shipmethod }); //REQUEST
                ///*deliverymethod = shipmethod == HOME_DELIVERY ? 1 : 2;
                //*objRecord.setValue({ fieldId: 'custbody_il_metodo_entrega', value: deliverymethod }); //REQUEST
                //*objRecord.setValue({ fieldId: 'custbody_il_codigo_cupon', value: context.couponcode }); //REQUEST

                //?: DETAILS ITEMS ===================================================
                const itemLine = objRecord.selectNewLine({ sublistId: 'item' });
                for (let i in items) {
                    let mul = 0;
                    let itemid = '';
                    let subTotal = -2;
                    let taxrate = '';
                    let lookUpTaxCode = '';
                    //log.debug('SKU', items[i].sku);

                    //itemid = items[i].sku;
                  itemid = items[i].itemid;
                    //if (itemid != subTotal) {
                     //   itemid = getItemID(items[i].sku);
                      //  if (itemid == 0) {
                       //     return 'SKU no registrado';
                       // }
                   // }

                    let taxcode = items[i].taxcode;
                    lookUpTaxCode = search.lookupFields({ type: search.Type.SALES_TAX_ITEM, id: taxcode, columns: ['internalid', 'rate'] });
                    taxcode = lookUpTaxCode.internalid[0].value;
                    taxrate = lookUpTaxCode.rate;
                    taxrate = taxrate.replace('%', '');
                    if (items[i].quantity != '') {
                        mul = (items[i].rate) * (items[i].quantity);
                    } else {
                        mul = items[i].amount;
                    }

                    log.debug('Valor Item', mul);

                    let grossamt = Number.parseFloat(items[i].grossamt).toFixed(2);
					log.debug('Item', itemid + ' - ' + typeof itemid);
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: mul, ignoreFieldChange: true }); //* CALCULO
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemid, ignoreFieldChange: false }); //* //REQUEST
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: items[i].description, ignoreFieldChange: false }); //REQUEST
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: items[i].quantity, ignoreFieldChange: false }); //REQUEST
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: items[i].rate, ignoreFieldChange: true }); //REQUEST
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: items[i].pricelevel, ignoreFieldChange: false }); //REQUEST
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: location, ignoreFieldChange: false }); //* REQUEST

                    
                   
                    //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: taxcode, ignoreFieldChange: false }); //* //GET
                    //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxrate1', value: taxrate, ignoreFieldChange: false }); // GET
                    //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: department, ignoreFieldChange: false }); //* REQUEST
                    //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: clases, ignoreFieldChange: false }); //* REQUEST
                    //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'units', value: items[i].units, ignoreFieldChange: false }); //REQUEST
                    //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt', value: grossamt, ignoreFieldChange: false }); //REQUEST
                    //itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'tax1amt', value: items[i].tax1amt, ignoreFieldChange: false }); //REQUEST

                    //custcol_pe_tax_code_id
                    //custcol_pe_afec_igv
                    objRecord.commitLine({ sublistId: 'item' });
                }

                let OrdenServicioId = objRecord.save({ ignoreMandatoryFields: false });
                log.debug('OrdenServicio.....', OrdenServicioId);
              }
            return "Grabado..........";

        } catch (error) {
            log.error('Error', error);
        }
    }
   
 const getItemID = (sku) => {
        let result = 0;
        const searchLoad = search.create({
            type: "item",
            filters:
                [
                    ["type", "anyof", "InvtPart", "Discount", "Service"],
                    "AND",
                    ["upccode", "startswith", sku]
                ],
            columns:
                [
                    search.createColumn({
                        name: "itemid",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    'internalid'
                ]
        });
        let searchResultCount = searchLoad.runPaged().count;
        if (searchResultCount != 0) {
            let searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
            let column01 = searchResult[0].getValue(searchLoad.columns[1]);
            result = column01;
        }
        return result;
    }

   
    function _put(context) {
        try {
            log.debug('Result', 'Hola Mundo..put.');
        } catch (error) {
            log.error('Error', error);
        }

    }

    function _delete(context) {
        try {
            log.debug('Result', 'Hola Mundo..delete.');
        } catch (error) {
            log.error('Error', error);
        }

    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});