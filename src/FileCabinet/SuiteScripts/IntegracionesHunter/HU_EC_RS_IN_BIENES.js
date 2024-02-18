/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/search'], function(log, search){
    function _get(context){
      
        try{
            let ResultadoConsulta = [];
           let OpcionConsulta = context.opcion;
            let IdVehiculo = context.CodigoVehiculo;
            let IdCliente = context.CodigoCliente;
//let IdVehiculo ="";
          //let IdCliente ="";
          log.error('Prueba.................',context);

            if (OpcionConsulta==100){
               ResultadoConsulta = ConsultaVehiculo(IdVehiculo, IdCliente);
            }
            else {
                log.error('error','Opcion no valida');
            }

            return JSON.stringify({ResultadoConsulta});



        }catch (error) {
            log.error('error', error);
            return JSON.stringify({error: error.message});
        }      
/*
try{

            let Busqueda = search.load({
                id:'customsearch_hu_ec_rs_in_bienes'
            });

     
          let arrayCobertura=[];
            let ResConsulta = Busqueda.run().getRange({ start: 0, end: 1000 });
          
if (ResConsulta.length > 0) {
                Busqueda.run().each(function (result) {
                    //internalid = result.getValue(Busqueda.columns[0]);
                  var Vehiculo= result.getValue(Busqueda.columns[0]);
                    arrayCobertura.push(Vehiculo);

                });
            }
            return arrayCobertura;

        }catch (error) {
            log.error('error', error);

            return JSON.stringify({
                error: error.message
            });
        }*/
      
    }

   
    function ConsultaVehiculo(CodVehiculo, Identificacion){
        try{

            let Busqueda = search.load({
                id:'customsearch_hu_ec_rs_in_bienes'
            });

            if (CodVehiculo != '') {
                Busqueda.filters.push(search.createFilter({
                name: 'internalid', 
                operator: search.Operator.ANYOF,
                values: CodVehiculo
                }));
            }
   

            if (Identificacion != '') {
                Busqueda.filters.push(search.createFilter({
                name: 'custrecord_ht_bien_propietario', 
                operator: search.Operator.ANYOF,
                values: Identificacion
                }));
            }
   

            let ObjResultado = new Array();
            let ResConsulta = Busqueda.run().getRange({ start: 0, end: 1000 });

            for (let i in ResConsulta) {
                //var Vehiculo= ResConsulta[i].getValue(Busqueda.columns[0]);
                var Vehiculo= ResConsulta[i].getValue({name: 'name'});
                var VehiculoNombre= ResConsulta[i].getValue({name: 'altname'});
                var Script = ResConsulta[i].getValue({name: 'scriptid'});
                var Cliente = ResConsulta[i].getValue({name: 'custrecord_ht_bien_propietario'});

                var IdTipoBien= ResConsulta[i].getValue({name: 'custrecord_ht_bien_tipobien'});
                var IdTipoTerrestre= ResConsulta[i].getValue({name: 'custrecord_ht_bien_tipoterrestre'});
                var Placa= ResConsulta[i].getValue({name: 'custrecord_ht_bien_placa'});
                var Origen= ResConsulta[i].getValue({name: 'custrecord_ht_bn_tipoorigen'});
                var Motor= ResConsulta[i].getValue({name: 'custrecord_ht_bien_motor'});
                var Marca= ResConsulta[i].getValue({name: 'custrecord_ht_bien_marca'});
                var Modelo= ResConsulta[i].getValue({name: 'custrecord_ht_bien_modelo'});
                var Tipo= ResConsulta[i].getValue({name: 'custrecord_ht_bien_tipo'});
                var Transmision= ResConsulta[i].getValue({name: 'custrecord_ht_bien_transmision'});
                var Caracteristica= ResConsulta[i].getValue({name: 'custrecord_ht_bien_caractadicional'});
                var ColorCarseg= ResConsulta[i].getValue({name: 'custrecord_ht_bien_colorcarseg'});
                var ColorFabricante= ResConsulta[i].getValue({name: 'custrecord_ht_bien_colorfabricante'});
                var ColorMatricula= ResConsulta[i].getValue({name: 'custrecord_ht_bien_colormatricula'});
                var Version= ResConsulta[i].getValue({name: 'custrecord_bien_version'});
                var TipoCabina= ResConsulta[i].getValue({name: 'custrecord_ht_bien_tipocabina'});
                var Cilindraje= ResConsulta[i].getValue({name: 'custrecord_ht_bien_cilindraje'});
                var Traccion= ResConsulta[i].getValue({name: 'custrecord_ht_bien_traccion'});
                var TipoFlota= ResConsulta[i].getValue({name: 'custrecord_ht_bien_tipoflota'});
                var Anio= ResConsulta[i].getValue({name: 'custrecord_ht_bien_ano'});
                var Clave= ResConsulta[i].getValue({name: 'custrecord_ht_bien_clave'});
                var Recorrido= ResConsulta[i].getValue({name: 'custrecord_ht_bien_recorrido'});
                var UsoVehicular= ResConsulta[i].getValue({name: 'custrecord_ht_bien_usovehiculo'});
                var OFicina= ResConsulta[i].getValue({name: 'custrecord_ht_bien_oficina'});
                var FormaPago= ResConsulta[i].getValue({name: 'custrecord_ht_bien_formapago'});
                var Conductor= ResConsulta[i].getValue({name: 'custrecord_ht_bien_conductor'});
                var Concesionario= ResConsulta[i].getValue({name: 'custrecord_ht_bien_consesionarios'});
                var Aseguradora= ResConsulta[i].getValue({name: 'custrecord_ht_bien_companiaseguros'});
                var Financiera = ResConsulta[i].getValue({name: 'custrecord_ht_bien_financiadovehiculo'});
                var CopAsociacion= ResConsulta[i].getValue({name: 'custrecord_ht_bn_cooperativaasociacion'});                
                var Convenio= ResConsulta[i].getValue({name: 'custrecord_ht_bien_conveniovehiculo'});
                var EstadoConvenio= ResConsulta[i].getValue({name: 'custrecord_ht_bien_estadoconvenio'});
                var OSConvenio= ResConsulta[i].getValue({name: 'custrecord_ht_bien_orden_serv_convenio'});
                var seguimiento= ResConsulta[i].getValue({name: 'custrecord_ht_bien_seguimiento'});

                ObjResultado.push({
                    Vehiculo: Vehiculo,
                    VehiculoNombre: VehiculoNombre,
                    Script: Script,
                    Cliente: Cliente,
                    IdTipoBien: IdTipoBien,
                    IdTipoTerrestre: IdTipoTerrestre,
                    Placa: Placa,
                    Origen: Origen,
                    Motor: Motor,
                    Marca: Marca,
                    Modelo: Modelo,
                    Tipo: Tipo,
                    Transmision:Transmision,
                    Caracteristica: Caracteristica,
                    ColorCarseg: ColorCarseg,
                    ColorFabricante:ColorFabricante,
                    ColorMatricula: ColorMatricula,
                    Version: Version,
                    TipoCabina: TipoCabina,
                    Cilindraje: Cilindraje,
                    Traccion: Traccion,
                    TipoFlota: TipoFlota,
                    Anio: Anio,
                    Clave: Clave,
                    Recorrido: Recorrido,
                    UsoVehicular: UsoVehicular,
                    OFicina: OFicina,
                    FormaPago: FormaPago,
                    Conductor: Conductor,
                    Concesionario: Concesionario,
                    Aseguradora: Aseguradora,
                    Financiera: Financiera,
                    CopAsociacion: CopAsociacion,
                    Convenio: Convenio,
                    EstadoConvenio: EstadoConvenio,
                    OSConvenio: OSConvenio,
                    seguimiento: seguimiento
                });
            }

            log.debug('Results', ObjResultado);
            return ObjResultado;    

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