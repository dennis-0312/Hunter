/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search','N/query'], function(log, record, search, query) {
    
    function _get(context) {
        try {
            let contenedor = new Array();
            let tipoCuenta ='BANK';
             
            let mySearch = search.load({ id: 'customsearch_ec_plan_cuentas' }); 
            
            //Add Filter to search           
            
            if (tipoCuenta !=''){
                let filter1 = search.createFilter({
                    name: 'accttype',
                    operator: search.Operator.IS,
                    values: [tipoCuenta]
                });
                mySearch.filters.push(filter1);
            }
            let searchResultCount = mySearch.runPaged().count;
                                   
            if (searchResultCount != 0) {
                let results = mySearch.run().getRange({ start: 0, end: searchResultCount });
                for (let i in results) {
                    var id = results[i].getValue(mySearch.columns[0]);
                    var cuenta_contable = results[i].getValue(mySearch.columns[1]);                   
                    var nombre = results[i].getValue(mySearch.columns[2]);
                    var banco = results[i].getValue(mySearch.columns[13]);
                    var numero_cuenta = results[i].getValue(mySearch.columns[14]);
                    
                    contenedor.push({
                        id: id,
                        cuenta_contable: cuenta_contable,                        
                        nombre: nombre,
                        banco: banco,
                        numero_cuenta: numero_cuenta
                        
                    });
                }
                log.debug('Results', contenedor);
                return contenedor;
                
            }

        } catch (error) {
            log.error('Error-GET', error)
        }

    }

    function loadAndRunSearch(context) {
        let arreglo = new Array();
        var salesorderSearchObj = search.create({
            type: "salesorder",
            filters:
            [
               ["type","anyof","SalesOrd"], 
               "AND", 
               ["custbody_ec_estados_os","anyof","1"], 
               "AND", 
               ["custrecord_ht_id_orden_servicio.custrecord_ht_ot_estado","anyof","2"], 
               "AND", 
               ["trandate","within",context.fechaIni,context.fechaFin]
            ],
            columns:
            [
               search.createColumn({
                  name: "internalid",
                  summary: "GROUP",
                  label: "ID interno"
               }),
               search.createColumn({
                  name: "type",
                  summary: "GROUP",
                  label: "Tipo"
               }),
               search.createColumn({
                  name: "tranid",
                  summary: "GROUP",
                  label: "Número de documento"
               }),
               search.createColumn({
                  name: "trandate",
                  summary: "GROUP",
                  label: "Fecha"
               }),
               search.createColumn({
                  name: "statusref",
                  summary: "GROUP",
                  label: "Estado"
               }),
               search.createColumn({
                  name: "custbody_ht_os_oficinaejecutatrabajo",
                  summary: "GROUP",
                  label: "HT Oficina que ejecuta el trabajo"
               }),
               search.createColumn({
                  name: "custbody_ht_os_ejecutivareferencia",
                  summary: "GROUP",
                  label: "HT Ejecutiva de referencia"
               }),
               search.createColumn({
                  name: "custbody_ht_os_bancofinanciera",
                  summary: "GROUP",
                  label: "HT Banco/Financiera"
               }),
               search.createColumn({
                  name: "custbody_ht_os_companiaseguros",
                  summary: "GROUP",
                  label: "HT Compañía de seguros"
               }),
               search.createColumn({
                  name: "custbody_ht_os_concesionaria",
                  summary: "GROUP",
                  label: "HT Concesionaria"
               }),
               search.createColumn({
                  name: "custbody_ht_os_vendcanaldistribucion",
                  summary: "GROUP",
                  label: "HT Vendedor del canal de distribución"
               }),
               search.createColumn({
                  name: "custbody_ec_estados_os",
                  summary: "GROUP",
                  label: "HT Estado Orden de servicio"
               }),
               search.createColumn({
                  name: "custrecord_ht_ot_estado",
                  join: "CUSTRECORD_HT_ID_ORDEN_SERVICIO",
                  summary: "GROUP",
                  label: "HT Estado Orden de trabajo"
               }),
               search.createColumn({
                  name: "altname",
                  join: "CUSTRECORD_HT_ID_ORDEN_SERVICIO",
                  summary: "GROUP",
                  label: "Nombre"
               })
            ]
         });

        var searchResultCount = salesorderSearchObj.runPaged().count;
        log.debug("salesorderSearchObj result count",searchResultCount);
        if (searchResultCount != 0)
        {
            let results = salesorderSearchObj.run().getRange({ start: 0, end: searchResultCount });
            for (let i in results) 
            {
                var idov = results[i].getValue(salesorderSearchObj.columns[0]);
                var numero_documento = results[i].getValue(salesorderSearchObj.columns[1]);                   
                var fecha = results[i].getValue(salesorderSearchObj.columns[3]);
                var estado = results[i].getValue(salesorderSearchObj.columns[4]);
                var oficina_trabajo = results[i].getValue(salesorderSearchObj.columns[5]);
                var ejecutivo_referencia = results[i].getValue(salesorderSearchObj.columns[6]);
                var financiera = results[i].getValue(salesorderSearchObj.columns[7]);
                var aseguradora= results[i].getValue(salesorderSearchObj.columns[8]);
                var concesionario = results[i].getValue(salesorderSearchObj.columns[9]);
                var vendedor= results[i].getValue(salesorderSearchObj.columns[10]);

                
                arreglo.push({
                    idov: idov,
                    numero_documento: numero_documento,                        
                    fecha: fecha,
                    estado: estado,
                    oficina_trabajo: oficina_trabajo,
                    ejecutivo_Referencia: ejecutivo_referencia,
                    financiera: financiera,
                    aseguradora: aseguradora,
                    concesionario: concesionario,
                    vendedor: vendedor
                }); 
              
            };
            return arreglo;
        }
    }

    function _post(context) {
        try {
            let arreglo = new Array();
            arreglo=loadAndRunSearch(context);

            log.debug('Results', arreglo);
           
            return "post";
        } catch (error) {
            log.error('Error', error);
        }
    }

    function _put(context) {
       try {
            //REQUEST
            let idsalesorder = context.idsalesorder;
            let trandate = context.trandate;

            //UPDATE RECORD
            let objRecord = record.load({ type: record.Type.salesorder,  id: idsalesorder, isDynamic: true });
            objRecord.setValue({ fieldId: 'trandate', value: trandate, ignoreFieldChange: true });
            let recordId = objRecord.save({ enableSourcing: false, ignoreMandatoryFields: false });
            
            return {
                id: recordId,
                success: 1
            }
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