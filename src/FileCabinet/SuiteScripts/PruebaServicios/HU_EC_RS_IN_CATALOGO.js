/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/search'], function(log, search) {
    function _get(context){
        try{
          let CodigoTabla = context.codigotabla;
          let Codigo = context.codigo;
          let FechaEvaluada = context.fecha;

          
          FechaEvaluada = FechaEvaluada.replace(/-/g,'/');
          FechaEvaluada = FechaEvaluada.replace(/"/g,"")

            let ResultadoConsulta = [];

            if (CodigoTabla == 'iva'){

                let Busqueda = search.create({
                    type: "salestaxitem",
                   /* filters:
                    [
                     //["internalid","anyof",IdImpuesto]
                        [
                            ["effectivefrom","onorbefore",FechaEvaluada], 
                            "AND", 
                            ["validuntil","notbefore",FechaEvaluada]
                        ]                
                    ],*/
                    columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Nombre"
                        }),
                        search.createColumn({name: "internalid", label: "IdInterno"}),
                        search.createColumn({name: "itemid", label: "ID de artículo"}),
                        search.createColumn({name: "description", label: "Descripción Artículo"}),
                        search.createColumn({name: "rate", label: "Tarifa"}),
                        search.createColumn({name: "country", label: "País"}),
                        search.createColumn({name: "effectivefrom", label: "Vigencia Desde"}),
                        search.createColumn({name: "validuntil", label: "Vigencia Hasta"}),
                        search.createColumn({name: "isinactive", label: "Estado"}),
                    search.createColumn({name: "taxtype", label: "IdTipoImpuesto"})
                    ]
                });

                if (FechaEvaluada != '') {
                    Busqueda.filters.push(search.createFilter({
                        name: 'effectivefrom', 
                        operator: search.Operator.ONORBEFORE,
                        values: FechaEvaluada
                        }));
                    Busqueda.filters.push(search.createFilter({
                        name: 'validuntil', 
                        operator: search.Operator.NOTBEFORE,
                        values: FechaEvaluada
                        }));
                }
        
                let BusquedaNumReg = Busqueda.runPaged().count;
                log.debug("busqueda result count",BusquedaNumReg);
        
                let ResConsulta = Busqueda.run().getRange(0, BusquedaNumReg);
        
                for (let i in ResConsulta)  {
                    var Id= ResConsulta[i].getValue({name: 'internalid'});
                    var Descripcion= ResConsulta[i].getValue({name: 'description'});
                    var IdArticulo= ResConsulta[i].getValue({name: 'itemid'});
                    var Tarifa= ResConsulta[i].getValue({name: 'rate'});
                    var Pais= ResConsulta[i].getValue({name: 'country'});
                    var VigenciaDesde= ResConsulta[i].getValue({name: 'effectivefrom'});
                    var VigenciaHasta= ResConsulta[i].getValue({name: 'validuntil'});
                    var Estado= ResConsulta[i].getValue({name: 'isinactive'});
                    var IdTipoImpuesto= ResConsulta[i].getValue({name: 'taxtype'});

                    if (Estado='F'){
                        Estado= 'VIG';
                    }else{
                        Estado= 'INA';
                    }
        
                    ResultadoConsulta.push({
                        Id: Id,
                        Descripcion: Descripcion,
                        IdArticulo: IdArticulo,
                        Tarifa: Tarifa,
                        Pais: Pais,
                        VigenciaDesde: VigenciaDesde,
                        VigenciaHasta: VigenciaHasta,
                        Estado: Estado,
                        IdTipoImpuesto: IdTipoImpuesto
                    });
                }
            }

            if (CodigoTabla == 'mar'){
                let Busqueda = search.create({
                    type: "customrecord_ht_bien_marca",
                   /* filters:
                    [
                        ["internalid","is",Codigo]
                    ],*/
                    columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Descripcion"
                        }),
                        search.createColumn({name: "internalid", label: "Codigo Marca"}),
                    ]
                });

            if (Codigo != '') {
                Busqueda.filters.push(search.createFilter({
                name: 'internalid', 
                operator: search.Operator.IS,
                values: Codigo
                })); 
            } 

              let BusquedaNumReg = Busqueda.runPaged().count;
                let ResConsulta = Busqueda.run().getRange(0, BusquedaNumReg);
        
                for (let i in ResConsulta)  {
                    var IdMarca= ResConsulta[i].getValue({name: 'internalid'});
                    var Descripcion= ResConsulta[i].getValue({name: 'name'});
        
                    ResultadoConsulta.push({
                        IdMarca: IdMarca,
                        Descripcion: Descripcion
                    });
                }
            }

            return ResultadoConsulta;
        }catch (error) {
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