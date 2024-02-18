/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/plugin'], function (plugin) {
    function onRequest(context) {
        var impls = plugin.findImplementations({ type: 'customscript_ns_pl_configuracion' });

        for (var i = 0; i < impls.length; i++) {
            var pl = plugin.loadImplementation({ type: 'customscript_ns_pl_configuracion', implementation: impls[i] });
            log.debug('Log1', 'impl ' + impls[i] + ' result = ' + pl.doTheMagic(10, 20));
        }

        var pl = plugin.loadImplementation({ type: 'customscript_ns_pl_configuracion' });
        log.debug('Log2', 'default impl result = ' + pl.doTheMagic(10, 20));
        log.debug('Log3', pl.otroMetodo());
    }

    return {
        onRequest: onRequest
    };
});