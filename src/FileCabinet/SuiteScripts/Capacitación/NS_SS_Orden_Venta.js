/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/log', 'N/search'], function (log, search) {

    function execute(context) {
        try {
            let contenedor = new Array();
            let miBusqueda = search.load({ id: 'customsearch_estados_orden_venta' });
            let cantidad_ov = miBusqueda.runPaged().count;
            if (cantidad_ov != 0) {
                let results = miBusqueda.run().getRange({ start: 0, end: 1000 });
                for (let i in results) {
                    var idov = results[i].getValue(miBusqueda.columns[0]);
                    var numero_documento = results[i].getValue(miBusqueda.columns[1]);
                    var cliente = results[i].getValue(miBusqueda.columns[2]);
                    var fecha = results[i].getValue(miBusqueda.columns[3]);
                    var estado = results[i].getText(miBusqueda.columns[4]);
                    contenedor.push({
                        idov: idov,
                        numero_documento: numero_documento,
                        cliente: cliente,
                        fecha: fecha,
                        estado: estado
                    });
                }
                log.debug('Results', contenedor);
            }
        } catch (error) {
            log.error('Error', error);
        }
    }

    return {
        execute: execute
    }
});
