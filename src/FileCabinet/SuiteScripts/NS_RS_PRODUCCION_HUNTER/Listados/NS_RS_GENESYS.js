/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @param {string} altname - El valor del campo altname.
 * @returns {string} - El campo altname en el formato deseado. 
 */
define(['N/query'], function (query) {

    function _data(context) {
        try {

            var nombre_cola = context.nombre_cola;
            var tipoOperacion = context.tipoOperacion;
            var resultado = null;

            // custom
            if (tipoOperacion == "tipificacionesbycola") {
                //custrecord_ht_direccion_tipo
                clienteQuery = query.runSuiteQL({
                    query: `
                    select
                    a.custrecord_ht_cod_tipi_genesys as COD_TIPI_GENESYS,
                    a.custrecord_ht_nombre_tipificacion as NOMBRE_TIPIFICACION,
                    a.custrecord_ht_resultado_gestion as CODIGO_RESULTADO_GESTION_HUNTER,
                    a.custrecord_ht_codigo_motivo as CODIGO_MOTIVO_HUNTER,
                    a.custrecord_ht_colas as COLAS,
                    a.custrecord_ht_id_cola as ID_COLA
                    from
                    customrecord_est_mot_homologa_genesys a
                    where a.custrecord_ht_colas = ?
                    `,
                    params: [`${nombre_cola}`]
                });

                res = clienteQuery.asMappedResults();

                if (res.length > 0) {
                    resultado = res;
                } else {
                    // Si no se encuentra el cliente, retorna una respuesta adecuada
                    resultado = { error: 'no data' };
                }

                return {
                    results: resultado
                };
            }

        } catch (error) {
            log.debug({ title: 'Error', results: error })
            return {
                results: error.message
            };
        }
    }

    function _get(context) {
        try {

        } catch (error) {
            log.debug({ title: 'Error', results: error })
            return {
                resultado: error.message
            };
        }
    }





    return {
        //get: getAllCustomers,
        post: _data,
        //get: obtenerTodosLosCamposCliente
    };


});