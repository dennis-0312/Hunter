/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/query','N/log','N/search'], function(query, log, search) {

    function _get(context) {
        try{
            let ResultadoConsulta = null;
            let IdCliente = context.CLIENTE;
            let IdVehiculo = context.VEHICULO;
            let IdProducto = context.PRODUCTO;
            let Opcion = context.OpcionConsulta;

            if(Opcion==100){
                ResultadoConsulta = ConsultaBienClienteProducto(IdCliente,IdVehiculo);
            }
            else if (Opcion == 101) {
                ResultadoConsulta = ConsultaDispositivoVehiculo(IdVehiculo);
            } 
            else if (Opcion == 102) {
                ResultadoConsulta = ConsultaCoberturaVehiculoProducto(IdVehiculo, IdProducto);
            }
            else {
                log.error('erro','Opcion no valida');
            }

            return JSON.stringify({
                 ResultadoConsulta
            }); 

        }catch (error) {
            log.error('error', error);
            return JSON.stringify({
                error: error.message
            });
        }
    }

    function ConsultaBienClienteProducto(CodCliente, CodVehiculo){
        try {
            log.debug('sp: ',CodCliente);

            let resultado = null;


            let data = query.runSuiteQL({
                query: `
                select DISTINCT 
                    A.custrecord_ht_bien_propietario IdNsCliente,
                    C.entityid Identificacion,
                    C.altname Cliente,
                    A.id IdVehiculo,
                    A.altname NombreVehiculo,
                    A.custrecord_ht_bien_marca IdMarca,
                    (
                        select  MAR.name
                        from    customrecord_ht_bien_marca MAR
                        WHERE   A.custrecord_ht_bien_marca = MAR.id
                    ) Marca,
                    A.custrecord_ht_bien_modelo IdModelo,
                    (
                        select  MDA.name
                        from    customrecord_ht_bn_modelo MDA
                        WHERE   A.custrecord_ht_bien_modelo = MDA.id
                    ) Modelo,
                    A.custrecord_ht_bien_chasis Chasis,
                    A.custrecord_ht_bien_placa Placa,
                    A.custrecord_ht_bien_tipo IdTipo,
                    (
                        select  T.name
                        from    customrecord_ht_record_tipovehiculo T
                        WHERE   A.custrecord_ht_bien_tipo = T.id
                    ) Tipo,
                    B.custrecord_ht_co_familia_prod IdNsProducto,
                    (
                        select  CV.name
                        from    customrecord_ht_cr_pp_valores CV
                        where   CV.id = B.custrecord_ht_co_familia_prod
                    ) Producto,
                    B.custrecord_ht_co_coberturainicial FechaInicio,
                    B.custrecord_ht_co_coberturafinal FechaFin,
                    B.custrecord_ht_co_estado_cobertura IdEstadoCobertura,
                    (
                        select  es.name
                        from    CUSTOMLIST1170 es
                        where   es.id = B.custrecord_ht_co_estado_cobertura
                    ) EstadoCobertura,
                    C.category IdTipoCliente,
                    (
                        select  cc.name
                        from    customerCategory cc
                        where   cc.id = C.category
                    )  TipoCliente
                from    customrecord_ht_record_bienes  A,
                        customrecord_ht_co_cobertura B,
                        customer C
                where   A.id = B.custrecord_ht_co_bien
                and     A.custrecord_ht_bien_propietario  = C.id
                and     B.custrecord_ht_co_estado_cobertura in (1,2) --ACT,INA
                --and     A.custrecord_ht_bien_estadoconvenio not in (1) --ESTADO CONVENIO ACT
                --and     C.category not in (14) --PUB `
                
               /*  and     C.entityid = ?
                and     A.id =  ? `, */
                
                //params:  [`${CodCliente}`,`${CodVehiculo}`]
            });

            let res = data.asMappedResults();

            if (res.length > 0) {
                resultado = res;
            } else {
                resultado = { error: 'no data' };
            }

            return resultado;

        } catch (error) {
            log.error('error', error);

            return JSON.stringify({
                error: error.message
            });
        }
    }

    function ConsultaDispositivoVehiculo(CodVehiculo){
        //CUSTOMRECORD_HT_RECORD_MANTCHASER
        
        try{
            log.debug('sp', 'ConsultaDispositivoVehiculo');
            let resultado = null;


            let data = query.runSuiteQL({
                query: `
                            select  *
                            from    CUSTOMRECORD_HT_RECORD_MANTCHASER A
                            where   A.custrecord_ht_mc_vehiculo = ?`,
                params:  [`${CodVehiculo}`]
            });

            let res = data.asMappedResults();

            if (res.length > 0) {
                resultado = res;
            } else {
                resultado = { error: 'no data' };
            }

            return resultado;


        }catch (error) {
            log.error('error', error);

            return JSON.stringify({
                error: error.message
            });
        }
    }

    function ConsultaCoberturaVehiculoProducto(CodVehiculo, CodProducto){

        try{
            log.debug('sp:','ConsultaCoberturaVehiculoProducto');
            let resultado = null;


            let data = query.runSuiteQL({
                query: `
                            select  *
                            from    customrecord_ht_co_cobertura cc
                            where   cc.custrecord_ht_co_bien = ?
                            and     cc.custrecord_ht_co_producto = ?`,
                params:  [`${CodVehiculo}`,`${CodProducto}`]
            });

            let res = data.asMappedResults();

            if (res.length > 0) {
                resultado = res;
            } else {
                resultado = { error: 'no data' };
            }

            return resultado;


        }catch (error) {
            log.error('error', error);

            return JSON.stringify({
                error: error.message
            });
        }
    }

    function _post(context) {
        // post
    }

    function _put(context) {
        //put
    }

    function _delete(context) {
        //delete
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }

 });

