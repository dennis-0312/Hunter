/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log','N/search'], function(log, search) {
    function _get(context) {
        try{
            let ResultadoConsulta = null;
            let OpcionConsulta = context.OPCION;
            let IdCliente = context.v_CodigoCliente;
            let P_IdOficina = context.v_Oficina;
            let P_IdTipoCliente = context.v_IdTipoCliente;

            if (OpcionConsulta==100){
                ResultadoConsulta = ConsultaCliente(IdCliente, P_IdOficina, P_IdTipoCliente);
            }
/*             else if (Opcion == 101) {
                ResultadoConsulta = ConsultaDispositivoVehiculo(IdVehiculo);
            }  */
            else {
                log.error('error','Opcion no valida');
            }

            return JSON.stringify({ResultadoConsulta});

        }catch (error) {
            log.error('error', error);
            return JSON.stringify({error: error.message});
        }

    }

    function ConsultaCliente(Identificacion, CodOficina, CodTipoCliente){
        try{
            let Busqueda = search.load({
                id:'customsearch_hu_ec_in_cliente'
              });

             if (Identificacion != '') {
                Busqueda.filters.push(search.createFilter({
                name: 'entityid', 
                operator: search.Operator.IS,
                values: Identificacion
                }));
            }

            if (CodOficina != '') {
                Busqueda.filters.push(search.createFilter({
                name: 'internalid', 
                join: 'CUSTENTITY_HT_CL_OFICINACLIENTE',
                operator: search.Operator.IS,
                values: CodOficina
                })); 
            } 

           if (CodTipoCliente != '') {
                Busqueda.filters.push(search.createFilter({
                name: 'internalid',
                join: 'CUSTENTITY_TS_EC_TIPO_PERSONA',
                operator: search.Operator.IS,
                values: CodTipoCliente
                }));
            }

            let ObjResultado = new Array();
            let ResConsulta = Busqueda.run().getRange({ start: 0, end: 1000 });

            for (var i = 0; i< ResConsulta.length; i++) {
               let IdTipoDocumento = ResConsulta[i].getValue(Busqueda.columns[0]);
                let TipoDocumento = ResConsulta[i].getValue(Busqueda.columns[1]);
                let IdentificacionCliente = ResConsulta[i].getValue(Busqueda.columns[2]);
                let NombreCompleto = ResConsulta[i].getValue(Busqueda.columns[3]);
                let PrimerNombre = ResConsulta[i].getValue(Busqueda.columns[4]);
                let SegundoNombre = ResConsulta[i].getValue(Busqueda.columns[5]);
                let ApellidoPaterno = ResConsulta[i].getValue(Busqueda.columns[6]);
                let ApellidoMaterno = ResConsulta[i].getValue(Busqueda.columns[7]);
                let IdTipoPersona = ResConsulta[i].getValue(Busqueda.columns[8]);
                let TipoPersona = ResConsulta[i].getValue(Busqueda.columns[9]);
                let email = ResConsulta[i].getValue(Busqueda.columns[10]);
                let Telefono = ResConsulta[i].getValue(Busqueda.columns[11]);
                let Estado = ResConsulta[i].getValue(Busqueda.columns[12]);
                let IdEjecutiva = ResConsulta[i].getValue(Busqueda.columns[13]);
                let Ejecutiva = ResConsulta[i].getValue(Busqueda.columns[14]);
                let IdOficina = ResConsulta[i].getValue(Busqueda.columns[15]);
                let Oficina = ResConsulta[i].getValue(Busqueda.columns[16]);
                let IdSector = ResConsulta[i].getValue(Busqueda.columns[17]);
                let Sector = ResConsulta[i].getValue(Busqueda.columns[18]);

                ObjResultado.push({
                    IdTipoDocumento: IdTipoDocumento,
                    TipoDocumento: TipoDocumento,
                    IdentificacionCliente: IdentificacionCliente,
                    NombreCompleto: NombreCompleto,
                    PrimerNombre: PrimerNombre,
                    SegundoNombre: SegundoNombre,
                    ApellidoPaterno: ApellidoPaterno,
                    ApellidoMaterno: ApellidoMaterno,
                    IdTipoPersona: IdTipoPersona,
                    TipoPersona: TipoPersona,
                    email: email,
                    Telefono: Telefono,
                    Estado: Estado,
                    IdEjecutiva: IdEjecutiva,
                    Ejecutiva: Ejecutiva,
                    IdOficina: IdOficina,
                    Oficina: Oficina,
                    IdSector: IdSector,
                    Sector: Sector
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