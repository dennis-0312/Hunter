/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/search'], function(log, search) {
    function _get(context) {

        try{
                let ResultadoConsulta = null;
                let OpcionConsulta = context.OPCION;
                let IdVehiculo = context.v_CodigoVehiculo;
                let IdProducto = context.v_CodigoProducto;

                if(OpcionConsulta==100){
                    ResultadoConsulta = ConsultaCobertura(IdVehiculo, IdProducto);
                }else {
                    log.error('error','Opcion no valida');
                }

                return JSON.stringify({
                    ResultadoConsulta
               }); 

        } catch (error) {
                log.error('error', error);
                return JSON.stringify({
                    error: error.message
                });
        }
    }

    function ConsultaCobertura(Vehiculo, CodProducto){
        try{
                let Busqueda = search.load({
                    id:'customsearch_hu_ec_in_cobertura'
                });

                if (Vehiculo != 0) {
                    Busqueda.filters.push(search.createFilter({
                        name: 'custrecord_ht_co_bien', 
                        operator: search.Operator.IS,
                        values: Vehiculo
                    }));
                }                

                if (CodProducto != '') {
                    Busqueda.filters.push(search.createFilter({
                        name: 'custrecord_ht_pp_codigo', 
                        join: 'CUSTRECORD_HT_CO_FAMILIA_PROD',
                        operator: search.Operator.IS,
                        values: CodProducto
                    }));
                }


  /*       miBusqueda.filters.push(search.createFilter({
             name: 'trandate',
            operator: 'within',
            values: ['2023/09/01','2023/09/30'] 

        })); */
          
                let ObjResultado = new Array();
                let ResConsulta = Busqueda.run().getRange({ start: 0, end: 1000 });

                 for (let i in ResConsulta) {
                
                    var IdCobertura = ResConsulta[i].getValue(Busqueda.columns[0]);
                    var Vehiculo = ResConsulta[i].getValue(Busqueda.columns[1]);
                    var Identificacion = ResConsulta[i].getValue(Busqueda.columns[2]);
                    var Cliente = ResConsulta[i].getValue(Busqueda.columns[3]);
                    var Producto = ResConsulta[i].getValue(Busqueda.columns[4]);
                    var CoberturaInicial = ResConsulta[i].getValue(Busqueda.columns[5]);
                    var CoberturaFinal = ResConsulta[i].getValue(Busqueda.columns[6]);
                    var Estado = ResConsulta[i].getValue(Busqueda.columns[7]);
                    var IdGrupoProducto = ResConsulta[i].getValue(Busqueda.columns[8]);
                    var GrupoProducto = ResConsulta[i].getValue(Busqueda.columns[9]);
                    var DispositivoLojack = ResConsulta[i].getValue(Busqueda.columns[10]);
                    var DispositivoChaser = ResConsulta[i].getValue(Busqueda.columns[11]);

                    ObjResultado.push({
                        IdCobertura: IdCobertura,
                        Vehiculo: Vehiculo,
                        Identificacion: Identificacion,
                        Cliente: Cliente,
                        Producto: Producto,
                        CoberturaInicial: CoberturaInicial,
                        CoberturaFinal: CoberturaFinal,
                        Estado: Estado,
                        IdGrupoProducto: IdGrupoProducto,
                        GrupoProducto: GrupoProducto,
                        DispositivoChaser: DispositivoChaser,
                        DispositivoLojack: DispositivoLojack
                    }); 
                } 

                log.debug('Results', ObjResultado);
                return ObjResultado;

            } catch (error) {
            log.error('error', error);

            return JSON.stringify({
                error: error.message
            });
        }
        
    }

    function _post() {
        // post
    }

    function _put() {
        //put
    }

    function _delete() {
        //delete
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }

});