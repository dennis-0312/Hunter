/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/runtime', 'N/record', 'N/plugin'], function (log, search, runtime, record, plugin) {

    function beforeLoad(context) {
        try {
            let objRecord = context.newRecord;
            let cliente = objRecord.getValue('entity');
            log.debug('Cliente', cliente);
            if (cliente.length != 0) {
                getData(objRecord);
                let objCliente = record.load({
                    type: record.Type.CUSTOMER,
                    id: cliente
                });
                let checkBox = objCliente.getValue('custentity_ec_cliente_ecommerce');
                if (checkBox == true) {
                    objRecord.setValue({ fieldId: 'custbody_ec_estados_os', value: 2 });
                }
            }
            getPlugin();
        } catch (error) {
            log.error('Error', error);
        }
    }

    function beforeSubmit(context) {
        let objRecord = context.newRecord;
        getData(objRecord);
    }

    function afterSubmit(context) {
        let objRecord = context.newRecord;
        try {
            let ordenvId = objRecord.id;
            let orden_venta = record.load({ type: record.Type.SALES_ORDER, id: ordenvId });
            let pago = orden_venta.getValue({ fieldId: 'total' });
            let estado = orden_venta.getValue('custbody_ec_estados_os');

            if (estado == 2) {
                let deposito = record.create({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    isDynamic: true,
                    defaultValues: {
                        salesorder: ordenvId
                    }
                });
                deposito.setValue({ fieldId: 'payment', value: pago });
                let depositoId = deposito.save();
                log.debug('Depósito', depositoId);
            }

        } catch (error) {

        }
    }

    function getData(objRecord) {
        let usuarioObjeto = runtime.getCurrentUser();
        let idUser = usuarioObjeto.id;
        let getCampos = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: idUser,
            columns: ['department', 'class', 'location']
        });
        log.debug('Debug', getCampos);
        let centro_costo = getCampos.department[0].value;
        let clase = getCampos.class[0].value;
        let ubicacion = getCampos.location[0].value;
        objRecord.setValue({ fieldId: 'department', value: centro_costo });
        objRecord.setValue({ fieldId: 'class', value: clase });
        objRecord.setValue({ fieldId: 'location', value: ubicacion });
    }

    function getPlugin() {
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
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
