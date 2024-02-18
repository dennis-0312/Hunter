/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search'], function(log, record, search) {

    function _getCobros(context){

        try {

            let tipoOperacion = context.tipoOperacion;
            let internalId = context.internalId;
            let entityid = context.entityid;
            let resultado = null;

            log.debug('tipoOperacion........', tipoOperacion);
            log.debug('internalId........', internalId);
            log.debug('entityid........', entityid);

            if (tipoOperacion == "cons_saldo_cliente") {
                resultado = _getSaldoCliente(internalId, entityid)

            }else if(tipoOperacion == "cons_entidades_financ") {
                resultado = _getEntidadesfinancieras(internalId)
            }
            else {
                log.error('error','No existe la opción de consulta');
            }

            return resultado

            /*
            return JSON.stringify({
                resultado
            }); 
            */

        }catch (error) {
            log.error('error', error);
            return JSON.stringify({
                error: error.message
            });
        }

    }


    // OBTIENE SALDO DE CLIENTE
    function _getSaldoCliente(internalId, entityid) {
        try {
    
            let miBusqueda = search.load({
            id:'customsearch_customsearch_saldo_cliente' 

                });
            
            //log.debug('internalId........', internalId);
            //log.debug('entityid........', entityid);
           
            log.debug('column name0........',miBusqueda.columns[0]);
            log.debug('column name1........',miBusqueda.columns[1]);
            log.debug('column name2........',miBusqueda.columns[2]);
            log.debug('column name3........',miBusqueda.columns[3]);
            log.debug('column name4........',miBusqueda.columns[4]);
            log.debug('column name4........',miBusqueda.columns[5]);
          
            // FILTRO INTERNAL ID CLIENTE
            if (internalId != '') {
                miBusqueda.filters.push(search.createFilter({
                name: 'internalid', 
                join: 'customermain',
                operator: search.Operator.ANYOF,
                values: internalId
                })); 
            } 

           // FILTRO NUMERO IDENTIFICACION CLIENTE
             if (entityid != '') {
                miBusqueda.filters.push(search.createFilter({
                name: 'entityid', 
                join: 'customermain',
                operator: search.Operator.IS,
                values: entityid
                })); 
            } 

            let saldoCliente = new Array();
            let results = miBusqueda.run().getRange({ start: 0, end: 50 });

            for (let i in results) {
                
                let internarlidcli = results[i].getValue(miBusqueda.columns[0]);
                //let identificacioncli = results[i].getValue(miBusqueda.columns[1]);
                let identificacioncli = results[i].getValue(miBusqueda.columns[1]).split('-')[2];
                let nombrecliente = results[i].getValue(miBusqueda.columns[2]);

              
                let importetotal = results[i].getValue(miBusqueda.columns[3]);
                let importepagado = results[i].getValue(miBusqueda.columns[4]);
                let importeporpagar = results[i].getValue(miBusqueda.columns[5]);// VALOR PENDIENTE DE PAGAR

               //log.debug('Nombre........',  results[i].getValue(miBusqueda.columns[2]));
 
                saldoCliente.push({
                    internarlidcli: internarlidcli,
                    identificacioncli: identificacioncli,
                    nombrecliente: nombrecliente,
                    importetotal: importetotal,
                    importepagado: importepagado,
                    importeporpagar: importeporpagar              
                   
                });
            }

            //log.debug('Results', saldoCliente);
            return saldoCliente;


        } catch (error) {
            log.debug({ title: 'Error', results: error })
            return {
                results: error.message
            };
        }
    }


   function _getEntidadesfinancieras(internalId) {
        try {


            log.debug('internalId........', internalId);
           
            let miBusqueda = search.load({
                id:'customsearch_hu_ec_in_cobros_entfinancie' 
    
                    });


            // FILTERS
            if (internalId != '') {
                miBusqueda.filters.push(search.createFilter({
                name: 'internalid', 
                operator: search.Operator.IS,
                values: internalId
                })); 
            }           

            let entidades = new Array();
            let results = miBusqueda.run().getRange({ start: 0, end: 150 });

            for (let i in results) {
                
                var descripcion = results[i].getValue(miBusqueda.columns[0]);
                var idexterno = descripcion.split('-')[0];
                //var idexterno = substr(id,1,3);

                var idinterno = results[i].getValue(miBusqueda.columns[1]);
                
                //log.debug('idexterno........', idexterno);
                
                entidades.push({
                    descripcion: descripcion,
                    idexterno: idexterno,
                    idinterno: idinterno     
                   
                });
            }

            log.debug('Results', entidades);
            return entidades;
  
           
        } catch (error) {
            log.error('Error', error);
        }
    }

    return {
        get: _getCobros,
        //post: _post
        //put: _put,
        //delete: _delete
    }


});