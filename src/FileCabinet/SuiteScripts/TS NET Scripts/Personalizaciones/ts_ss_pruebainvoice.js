/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */ 
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config"], (search, record, email, runtime, log, file, task, config) => {
const SALES_ORDER = 'salesorder'
    function execute(context) {
        var SalesOrder = lookupItemSalesOrders();
        log.debug('SalesOrder',SalesOrder);
    }
    /**
 * SuiteScript 2.0 - Búsqueda de órdenes de venta facturadas
 */

function lookupItemSalesOrders() {
    var busqueda = search.create({
        type: SALES_ORDER,
        filters:
        [
           ["type","anyof","SalesOrd"], 
           "AND",   
           ["status","anyof","SalesOrd:G"], 
           "AND", 
           ["item.type","anyof","Service"], 
           "AND", 
           ["line","equalto","1"]
        ],
        columns:
        [
           search.createColumn({name: "internalid", label: "Internal ID"})
        ]
     });
     var array_pe_es_anticipo = [];

     // Configurar los límites de la paginación
     var pageSize = 1000;
     var pageIndex = 0;
     var resultCount = 0;

     // Realizar la búsqueda y obtener los resultados en páginas
     var searchResult = busqueda.run();

     do {
         var page = searchResult.getRange({
             start: pageIndex * pageSize,
             end: (pageIndex + 1) * pageSize
         });

         page.forEach(function (result) {
             var internalid = result.getValue(busqueda.columns[0]);
             array_pe_es_anticipo.push(internalid);
         });

         resultCount += page.length;
         pageIndex++;
     } while (resultCount < searchResult.count);
     
     return array_pe_es_anticipo;
  }
  
    return {
        execute: execute
    }
});