/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', 'N/task', "N/config"], (search, record, runtime, log, file, task, config) => {
    // Schedule Report: Creacionde Pago
    const ID_CHECK = 'check';
    const ID_VENDOR_PREPAYMENT = 'vendorprepayment';
    const ID_VENDOR_PAYMENT = 'vendorpayment'

    const execute = (context) => {
        const objContext = runtime.getCurrentScript();
        let json = objContext.getParameter('custscript_ts_ss_e_payment_jason');
        let id_log = objContext.getParameter('custscript_ts_ss_e_payment_id_log');
        try {
            //var data = {
            log.debug('json', json)
            var dataJSON = JSON.parse(json);
            var DatosLote = BuscarDatosLote(dataJSON.paymentBatchID);
            var DatosPagos = BuscarPagos(dataJSON.payments);
            let recordType = ''

            log.debug('DatosLote', DatosLote)
            log.debug('DatosPagos', DatosPagos)
            log.debug('dataJSON', dataJSON)
            log.debug('dataJSON', dataJSON.payments.length)

            for (let i = 0; i < DatosPagos.length; i++) {
                let tipoTransaccion = DatosPagos[i][5];
                if (DatosPagos[i][11] == 'APPROVED') {
                    log.debug('APPROVED', 'APPROVED')
                    let idCheckAnticipo = '';

                    if (tipoTransaccion == 'customEmployee') {
                        idCheckAnticipo = crearCheque(DatosLote, DatosPagos[i]);
                        recordType = ID_CHECK;
                    } else if (tipoTransaccion == 'proveedor') {
                        log.debug('DatosPagos[i][13]', DatosPagos[i][13]);
                        if (DatosPagos[i][13]) {
                            log.debug('DatosPagos[i][14][0].value', DatosPagos[i][14][0].value);
                            if (DatosPagos[i][14][0].value == 'VendBill') {
                                idCheckAnticipo = createVendorPayment(DatosLote, DatosPagos[i]);
                                recordType = ID_VENDOR_PAYMENT;
                            } else {
                                log.debug('Anticipo1', DatosPagos[i][14][0].value);
                                idCheckAnticipo = crearAnticipo(DatosLote, DatosPagos[i], 1);
                                recordType = ID_VENDOR_PREPAYMENT;
                            }
                        } else {
                            log.debug('Anticipo2', DatosPagos[i][13]);
                            idCheckAnticipo = crearAnticipo(DatosLote, DatosPagos[i]);
                            recordType = ID_VENDOR_PREPAYMENT;
                        }
                    }
                    log.debug('Number(DatosPagos[i][12])', Number(DatosPagos[i][12]));
                    log.debug('idCheckAnticipo', idCheckAnticipo);
                    record.submitFields({ type: 'customrecord_ts_epmt_payment', id: Number(DatosPagos[i][12]), values: { 'custrecord_ts_epmt_prepaydet_gener_trans': Number(idCheckAnticipo) } });
                    record.submitFields({ type: 'customtransaction_orden_pago', id: Number(DatosPagos[i][0]), values: { 'transtatus': 'C' } });
                    record.submitFields({ type: recordType, id: idCheckAnticipo, values: { 'tranid': DatosPagos[i][15] } });
                } else if (DatosPagos[i][11] == 'REJECTED') {
                    log.debug('REJECTED', 'REJECTED')
                    record.submitFields({
                        type: 'customtransaction_orden_pago',
                        id: Number(DatosPagos[i][0]),
                        values: {
                            'transtatus': 'D'
                        }
                    });
                }
            }

            let fechaActual = new Date();
            log.debug('fechaActual', fechaActual)
            log.debug('id_log', id_log)
            record.submitFields({
                type: 'customrecord_ts_epmt_return_file_log',
                id: Number(id_log),
                values: {
                    'custrecord_ts_epmt_ret_file_log_status': 'PROCESADO',
                    'custrecord_ts_epmt_ret_file_log_enddate': fechaActual
                }
            });

            let retorno = BuscarArchivoRetorno();
            log.debug('retorno', retorno);

            if (retorno != '') {
                var scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_ts_ss_e_payment_create_pay',
                    deploymentId: 'customdeploy_ts_ss_e_payment_create_pay',
                    params: {
                        custscript_ts_ss_e_payment_jason: retorno[1],
                        custscript_ts_ss_e_payment_id_log: retorno[0],
                    }
                });
                scriptTask.submit();
            }
        } catch (error) {
            log.debug('errorExecute', error);
            let fechaActual = new Date();
            record.submitFields({
                type: 'customrecord_ts_epmt_return_file_log',
                id: Number(id_log),
                values: {
                    'custrecord_ts_epmt_ret_file_log_status': 'ERROR',
                    'custrecord_ts_epmt_ret_file_log_enddate': fechaActual
                }
            });
        }
    }

    const BuscarDatosLote = (idLote) => {
        var dataLote = new Array();
        log.debug('idLote', idLote)
        let lote = record.load({ type: 'customrecord_ts_epmt_payment_batch', id: Number(idLote), isDynamic: true });
        let cuentaBanco = lote.getValue('custrecord_ts_epmt_prepmt_bank_account');
        let moneda = lote.getValue('custrecord_ts_epmt_prepmt_currency');
        let estado = lote.getValue('custrecord_ts_epmt_prepmt_status');
        let subsidiaria = lote.getValue('custrecord_ts_epmt_prepmt_subsidiary');
        let fechaPago = lote.getValue('custrecord_ts_epmt_prepmt_payment_date');
        let plantillaTEF = lote.getValue('custrecord_ts_epmt_prepmt_tef_template');
        dataLote = [cuentaBanco, moneda, estado, subsidiaria, fechaPago, plantillaTEF];
        return dataLote;
    }

    const BuscarPagos = (arrayPago) => {
        var Pagos = new Array();

        for (let i = 0; i < arrayPago.length; i++) {
            let arrayAuxi = new Array();
            let Pago = arrayPago[i];
            log.debug('Pago', Pago);

            var ePayment = search.lookupFields({
                type: 'customrecord_ts_epmt_payment',
                id: Number(Pago.PaymentID),
                columns: ['custrecord_ts_epmt_prepaydet_origin_tran', 'custrecord_ts_epmt_prepaydet_entity', 'custrecord_ts_epmt_prepaydet_tran_amount',
                    'custrecord_ts_epmt_prepaydet_paym_amount', 'custrecord_ts_epmt_prepaydet_status', 'custrecord_ts_epmt_prepaydet_payord_acc']
            });

            let OrdenPago = ePayment.custrecord_ts_epmt_prepaydet_origin_tran.length ? ePayment.custrecord_ts_epmt_prepaydet_origin_tran[0].value : '';
            let beneficiario = ePayment.custrecord_ts_epmt_prepaydet_entity.length ? ePayment.custrecord_ts_epmt_prepaydet_entity[0].value : '';
            let impOrigen = ePayment.custrecord_ts_epmt_prepaydet_tran_amount;
            let impPago = ePayment.custrecord_ts_epmt_prepaydet_paym_amount;
            let estado = ePayment.custrecord_ts_epmt_prepaydet_status;

            let tipoEntidad = '';
            if (Number(beneficiario) != 0) {
                let entidad = getCustomer(beneficiario);
                tipoEntidad = 'customEmployee';
                if (entidad[0] == null) {
                    entidad = getemployee(beneficiario);
                    tipoEntidad = 'customEmployee';
                }
                if (entidad[0] == null) {
                    entidad = getProveedor(beneficiario);
                    tipoEntidad = 'proveedor';
                }
            }

            let cuentaOrdenPago = ePayment.custrecord_ts_epmt_prepaydet_payord_acc.length ? ePayment.custrecord_ts_epmt_prepaydet_payord_acc[0].value : '';
            let memo = '';
            let clase = '';
            let departamento = '';
            let ubicacion = '';
            let relatedTransaction = '';
            let relatedT = '';
            let relatedType = '';

            if (Number(OrdenPago) != 0) {
                var op = search.lookupFields({
                    type: 'customtransaction_orden_pago',
                    id: Number(OrdenPago),
                    columns: ['memo', 'class', 'location', 'department', 'custbody_ts_related_transaction']
                });
                if (op.custbody_ts_related_transaction[0].value) {
                    relatedT = search.lookupFields({ type: search.Type.TRANSACTION, id: op.custbody_ts_related_transaction[0].value, columns: ['type'] });
                    relatedT = relatedT.type;
                }
                const tipoRegistros = [
                    { registro: "PurchOrd", tipo: "purchaseorder" },
                    { registro: "VendBill", tipo: "vendorbill" }
                ];
                memo = op.memo;
                clase = op.class.length ? op.class[0].value : '';
                departamento = op.department.length ? op.department[0].value : '';
                ubicacion = op.location.length ? op.location[0].value : '';
                relatedTransaction = op.custbody_ts_related_transaction[0].value;
                relatedType = relatedT;
            }
            arrayAuxi = [OrdenPago, beneficiario, impOrigen, impPago, estado, tipoEntidad, cuentaOrdenPago, memo, clase, departamento, ubicacion, Pago.status, Pago.PaymentID, relatedTransaction, relatedType, Pago.llave];
            Pagos.push(arrayAuxi);
        }
        return Pagos;
    }

    const crearCheque = (Lote, Pago) => {
        var recordlog = record.create({ type: ID_CHECK, isDynamic: true });
        recordlog.setValue({ fieldId: 'entity', value: Pago[1] });
        recordlog.setValue({ fieldId: 'subsidiary', value: Lote[3] });
        recordlog.setValue({ fieldId: 'account', value: Lote[0] });
        recordlog.setValue({ fieldId: 'currency', value: Lote[1] });
        recordlog.setValue({ fieldId: 'trandate', value: new Date() });
        recordlog.setValue({ fieldId: 'department', value: Number(Pago[9]) });
        recordlog.setValue({ fieldId: 'class', value: Number(Pago[8]) });
        recordlog.setValue({ fieldId: 'location', value: Number(Pago[10]) });
        recordlog.setValue({ fieldId: 'memo', value: Pago[7] });
        recordlog.setValue({ fieldId: 'custbody_est_emitido', value: 2 });

        recordlog.selectNewLine({ sublistId: 'expense' });
        recordlog.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'account', value: Pago[6] });
        recordlog.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'amount', value: Pago[3] });
        recordlog.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode', value: 5 }); //VAT_EC:UNDEF-EC
        recordlog.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'department', value: Number(Pago[9]) });
        recordlog.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'class', value: Number(Pago[8]) });
        recordlog.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'location', value: Number(Pago[10]) });
        recordlog.commitLine({ sublistId: 'expense' });
        let IDCheque = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true })
        log.error('IDCheque', 'Cheque: ' + IDCheque);
        return IDCheque
    }

    const crearAnticipo = (Lote, Pago, purchase = 0) => {
        var recordlog = record.create({ type: ID_VENDOR_PREPAYMENT, isDynamic: true });
        recordlog.setValue({ fieldId: 'entity', value: Number(Pago[1]) });
        recordlog.setValue({ fieldId: 'subsidiary', value: Number(Lote[3]) });
        recordlog.setValue({ fieldId: 'currency', value: Lote[1] });
        recordlog.setValue({ fieldId: 'account', value: Number(Lote[0]) });
        recordlog.setValue({ fieldId: 'trandate', value: new Date() });
        if (purchase == 1 && Pago[14][0].value == "PurchOrd")
            recordlog.setValue({ fieldId: 'purchaseorder', value: Pago[13] });
        recordlog.setValue({ fieldId: 'department', value: Number(Pago[9]) });
        recordlog.setValue({ fieldId: 'class', value: Number(Pago[8]) });
        recordlog.setValue({ fieldId: 'location', value: Number(Pago[10]) });
        recordlog.setValue({ fieldId: 'memo', value: Pago[7] });
        recordlog.setValue({ fieldId: 'payment', value: Pago[3] });
        recordlog.setValue({ fieldId: 'custbody_est_emitido', value: 2 });
        let IDAnticipo = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true });
        log.error('IDAnticipo', 'Anticipo Proveedor: ' + IDAnticipo);
        return IDAnticipo
    }

    const createVendorPayment = (Lote, Pago) => {
        try {
            let recordlog = record.transform({ fromType: record.Type.VENDOR_BILL, fromId: Pago[13], toType: record.Type.VENDOR_PAYMENT, isDynamic: true });
            recordlog.setValue({ fieldId: 'account', value: Number(Lote[0]) });
            recordlog.setValue({ fieldId: 'trandate', value: new Date() });
            recordlog.setValue({ fieldId: 'department', value: Number(Pago[9]) });
            recordlog.setValue({ fieldId: 'class', value: Number(Pago[8]) });
            recordlog.setValue({ fieldId: 'location', value: Number(Pago[10]) });
            recordlog.setValue({ fieldId: 'memo', value: Pago[7] });
            recordlog.setValue({ fieldId: 'custbody_est_emitido', value: 2 });
            let IDAnticipo = recordlog.save({ enableSourcing: true, ignoreMandatoryFields: true });
            log.error('IDAnticipo', 'Pago Proveedor: ' + IDAnticipo);
            return IDAnticipo
        } catch (error) {
            log.error('Error-createVendorPayment', error);
            return 0
        }
    }

    const getProveedor = (id) => {
        id = Number(id);
        try {
            var arr = new Array();
            let vendor = search.lookupFields({ type: "vendor", id: id, columns: ["internalid"] });
            arr[0] = vendor.internalid;
            return arr;
        } catch (error) {
            log.error('error-getProveedor', error);
        }
    }

    const getCustomer = (id) => {
        id = Number(id);
        try {
            var arr = new Array();
            let customer = search.lookupFields({ type: "customer", id: id, columns: ["internalid"] });
            arr[0] = customer.internalid;
            return arr;
        } catch (error) {
            log.error('error-getCustomer', error);
        }
    }

    const getemployee = (id) => {
        id = Number(id);
        try {
            var arr = new Array();
            let employee = search.lookupFields({ type: "employee", id: id, columns: ["internalid"] });
            arr[0] = employee.internalid;
            return arr;
        } catch (error) {
            log.error('error-getemployee', error);
        }
    }

    const BuscarArchivoRetorno = () => {
        try {
            var array = new Array()
            var busqueda = search.create({
                type: "customrecord_ts_epmt_return_file_log",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecord_ts_epmt_ret_file_log_status", "is", "PENDIENTE"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "ID interno" }),
                        search.createColumn({ name: "custrecord_ts_epmt_ret_file_log_data", label: "Datos" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            if (savedsearch.length > 0) {
                log.error('savedsearch', savedsearch)
                busqueda.run().each(function (result) {
                    let id_log_ret = result.getValue(busqueda.columns[0]);
                    let datosRetorno = result.getValue(busqueda.columns[1]);
                    array = [id_log_ret, datosRetorno];
                    return true;
                });
            }
            return array;
        } catch (error) {
            log.error('error-BuscarArchivoRetorno', error);
        }
    }

    const BuscarFechaActual = () => {
        let date = new Date();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        var dayString = day.toString();
        var monthString = month.toString();
        if (dayString.length === 1) {
            dayString = "0" + dayString;
        }
        if (monthString.length === 1) {
            monthString = "0" + monthString;
        }
        return dayString + '/' + monthString + '/' + year
    }

    return {
        execute: execute
    }
});