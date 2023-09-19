/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search',
    'N/currentRecord',
    'N/ui/message',
    'N/runtime',
    'N/record',
    'N/ui/dialog',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
], (search, currentRecord, message, runtime, record, dialog, _controllerParm, _constant, _errorMessage) => {
    let typeMode = '';

    const pageInit = (context) => {
        var currentRecord = context.currentRecord;
        typeMode = context.mode; //!Importante, no borrar.
        var field = currentRecord.getField('location');
        field.isDisabled = true;
    }

    const saveRecord = (context) => {
        var currentRecord = context.currentRecord;
        //let idRec = currentRecord.id;
        let parametro = 0, parametro_salesorder = 0, valor_inf_ejec_trabajo = 0, valor_tipo_agrupacion_so = 0, valor_cooperativa = 0, valor_item = 0, flag1 = 0, flag2 = 0, flag6 = 0,
            flag7 = 0, arraybusquedaitemSO = new Array(), arraybusquedaitem = new Array(), arrayitemSO = new Array(), arrayTA = new Array(), arrayItemOT = new Array(), buscar_orden_trabajo = 0;
        let bien = currentRecord.getValue('custbody_ht_so_bien');
        let busqueda_salesorder = getSalesOrder(bien);
        let busqueda_item = getItemSinServicio(bien);

        if (busqueda_salesorder.length != 0) {
            for (let i = 0; i < busqueda_salesorder.length; i++) {
                //console.log('busqueda_salesorder[i]', busqueda_salesorder[i]);
                let parametrosRespo = _controllerParm.parametrizacion(busqueda_salesorder[i]);
                if (parametrosRespo != 0) {
                    for (let j = 0; j < parametrosRespo.length; j++) {
                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO) {
                            parametro_salesorder = parametrosRespo[j][1];
                            arraybusquedaitemSO.push(parametro_salesorder);
                        }
                    }
                }
            }
        }

        if (busqueda_item.length != 0) {
            for (let i = 0; i < busqueda_item.length; i++) {
                //console.log('busqueda_item[i]', busqueda_item[i]);
                let parametrosRespo = _controllerParm.parametrizacion(busqueda_item[i]);
                if (parametrosRespo != 0) {
                    var accion_producto = 0;
                    var valor_tipo_agrupacion = 0;
                    for (let j = 0; j < parametrosRespo.length; j++) {

                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                            accion_producto = parametrosRespo[j][1];
                        }
                        //console.log('accion_producto', accion_producto);
                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO) {
                            valor_tipo_agrupacion = parametrosRespo[j][1];
                        }
                        //console.log('valor_tipo_agrupacion', valor_tipo_agrupacion);
                        if (valor_tipo_agrupacion != 0 && (accion_producto == _constant.Valor.VALOR_001_INST_DISPOSITIVO || accion_producto == _constant.Valor.VALOR_011_INSTALACION_OTROS_PRODUCTOS)) {
                            arrayItemOT.push(valor_tipo_agrupacion);
                        }
                    }
                    //console.log('arrayItemOT', arrayItemOT);

                }
            }
        }
        let cliente = currentRecord.getValue('entity');
        var busqueda_bien = search.lookupFields({
            type: 'customrecord_ht_record_bienes',
            id: bien,
            columns: ['custrecord_ht_bn_cooperativaasociacion', 'custrecord_ht_bien_tipobien']
        });
        var cooperativa = busqueda_bien.custrecord_ht_bn_cooperativaasociacion;
        var tipo_bien = busqueda_bien.custrecord_ht_bien_tipobien;

        let idcobertura = _controllerParm.getCobertura(bien);
        //console.log('idcobertura.length', idcobertura.length);
        let numLines = currentRecord.getLineCount({ sublistId: 'item' });
        var arrayItem = []
        for (let i = 0; i < numLines; i++) {
            let items = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            arrayItem.push(items);
        }

        arrayItem = [...new Set(arrayItem)];
        if (numLines != arrayItem.length) {
            dialog.alert({ title: 'Alerta', message: 'Existen artículos repetidos en la lista' });
            return false

        }

        for (let i = 0; i < numLines; i++) {
            let flag3 = 0;
            let flag4 = 0;
            let flag5 = 0;
            let items = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            let valor_tipo_renovacion = 0;
            let linea = currentRecord.selectLine({ sublistId: 'item', line: i });
            // console.log('linea', linea);
            let parametrosRespo = _controllerParm.parametrizacion(items);
            //console.log('parametrizacion pruebas', parametrosRespo);
            if (parametrosRespo != 0) {
                var accion_producto_2 = 0;
                var valor_tipo_agrupacion_2 = 0;
                for (let j = 0; j < parametrosRespo.length; j++) {
                    if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO && (parametrosRespo[j][1] == _constant.Valor.VALOR_001_INST_DISPOSITIVO || parametrosRespo[j][1] == _constant.Valor.VALOR_011_INSTALACION_OTROS_PRODUCTOS)) {
                        flag7 += 1;
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                        parametro = parametrosRespo[j][1];
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.SDE_SOLICITA_DISPOSITIVOS_ENTREGADOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                        flag6 += 1;
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                        accion_producto_2 = parametrosRespo[j][1]
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO) {
                        valor_tipo_agrupacion_2 = parametrosRespo[j][1];
                        arrayitemSO.push(valor_tipo_agrupacion_2);
                    }

                    if (accion_producto_2 == _constant.Valor.VALOR_015_VENTA_SERVICIOS && valor_tipo_agrupacion_2 != 0) {
                        arrayTA.push(valor_tipo_agrupacion_2);
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.TRN_TIPO_DE_RENOVACION) {
                        valor_tipo_renovacion = parametrosRespo[j][1];
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.IET_PEDIR_INF_DE_EJEC_TRABAJO) {
                        valor_inf_ejec_trabajo = parametrosRespo[j][1];
                    }

                    if (parametrosRespo[j][1] == _constant.Valor.VALOR_001_RENOVACION_NORMAL) {
                        flag1 += 1;
                    }

                    if (parametrosRespo[j][1] == _constant.Valor.VALOR_002_RENOVACION_ANTICIPADA) {
                        flag2 += 1;
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.TDP_TIPO_DE_PRODUCTO && parametrosRespo[j][1] == _constant.Valor.VALOR_008_BASICO) {
                        flag5 += 1;
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.TRN_TIPO_DE_RENOVACION) {
                        valor_tipo_renovacion = parametrosRespo[j][1];
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.BOT_BUSCAR_ORDEN_DE_TRABAJO) {
                        buscar_orden_trabajo = parametrosRespo[j][1];
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.CAC_CONTROL_ASOCIACION_COOPERATIVA && parametrosRespo[j][1] == _constant.Valor.SI) {
                        if (cooperativa == '') {
                            dialog.alert({ title: 'Alerta', message: 'Se debe ingresar la cooperativa en el Bien' });
                            return false
                        }
                    }

                    //Validación de Prodcutos Instalados
                    if (valor_tipo_renovacion == _constant.Valor.VALOR_001_RENOVACION_NORMAL || parametro == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP) {
                        let verificar_instalacion_parametro = _controllerParm.parametros(_constant.Parameter.CPI_CONTROL_DE_PRODUCTOS_INSTALADOS, linea, idcobertura);
                        //console.log('verificar_instalacion_parametro', verificar_instalacion_parametro);
                        if (verificar_instalacion_parametro.status == false) {
                            dialog.alert({ title: 'Alerta', message: verificar_instalacion_parametro.mensaje });
                            return false
                        }
                    }

                    // if (parametrosRespo[j][0] == _constant.Parameter.CPI_CONTROL_DE_PRODUCTOS_INSTALADOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                    //     console.log('IDCobertura', idcobertura);
                    //     let verificar_instalacion_parametro = _controllerParm.parametros(_constant.Parameter.CPI_CONTROL_DE_PRODUCTOS_INSTALADOS, linea, idcobertura);
                    //     console.log('verificar_instalacion_parametro', verificar_instalacion_parametro);
                    //     if (verificar_instalacion_parametro.status == false) {
                    //         dialog.alert({ title: 'Alerta', message: verificar_instalacion_parametro.mensaje });
                    //         return false
                    //     }
                    // }

                    if (parametrosRespo[j][0] == _constant.Parameter.CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][1] == _constant.Valor.SI) {
                        flag3 += 1;
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO && parametrosRespo[j][1] == _constant.Valor.VALOR_MON_MONITOREO) {
                        flag4 += 1;
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.PMI_PRODUCTO_PARA_MONITOREO_DE_INMUEBLES && parametrosRespo[j][1] == _constant.Valor.SI && tipo_bien != _constant.Constants.INMUEBLE) {
                        dialog.alert({ title: 'Alerta', message: 'El tipo del vehiculo debe ser INMUEBLE' });
                        return false
                    }

                    if (parametrosRespo[j][1] == _constant.Valor.SI) {
                        //alert('Verificar');
                        let verificar;
                        if (parametrosRespo[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS) {
                            verificar = _controllerParm.parametros(parametrosRespo[j][0], cliente, idcobertura);
                        } else {
                            verificar = _controllerParm.parametros(parametrosRespo[j][0], linea, idcobertura);
                        }
                        //console.log('verificar', verificar);
                        if (verificar.status == false) {
                            dialog.alert({ title: 'Alerta', message: verificar.mensaje });
                            return false
                        }
                    }

                    if (parametrosRespo[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS && parametrosRespo[j][1] == _constant.Valor.VALOR_002_ENTREGA_CUSTODIAS) {
                        let response = _controllerParm.parametros(_constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS, context.currentRecord)
                        if (response.status == false) {
                            dialog.alert({ title: 'Alerta', message: response.mensaje });
                        }
                        return response.status;
                    }
                }
                // console.log('FLAG 3', flag3);
                // console.log('FLAG 4', flag4);
                // console.log('FLAG 5', flag5);
                if ((flag3 > 0) && (flag3 != flag4)) {
                    dialog.alert({ title: 'Alerta', message: 'El producto upgrade debe tener una agrupacion de tipo monitoreo' });
                    return false
                }
                if ((flag5 > 0) && (flag5 != flag4)) {
                    dialog.alert({ title: 'Alerta', message: 'El producto basico debe tener una agrupacion de tipo monitoreo' });
                    return false
                }
            }
        }

        if (parametro == _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO && numLines != 1) {
            dialog.alert({ title: 'Alerta', message: 'No se puede tener un Artículo tipo Cambio de Propietario junto a otro Artículo' });
            return false
        }

        //console.log('valor_inf_ejec_trabajo', valor_inf_ejec_trabajo);
        if (valor_inf_ejec_trabajo == _constant.Valor.SI) {
            //console.log('valor_inf_ejec_trabajo', valor_inf_ejec_trabajo);
            var novedades = currentRecord.getValue('custbody_ht_os_novedades');
            //console.log('novedades', novedades);
            if (novedades == '') {
                dialog.alert({ title: 'Alerta', message: 'Debes llenar el campo Novedades' });
                return false
            }
        }

        //console.log('flag1-flag2', flag1 + '-' + flag2 + '-' + flag3 + '-' + flag4);
        if (flag1 == 0 && flag2 > 0) {
            dialog.alert({ title: 'Alerta', message: 'El artículo de Renovacion Anticipada debe tener un artículo de Renovacion Normal' });
            return false
        }
        // console.log('arraybusquedaitemSO', arraybusquedaitemSO);
        // console.log('arrayitemSO', arrayitemSO);
        debugger;
        var iguales = encontrarElementosIguales(arraybusquedaitemSO, arrayitemSO);
        //console.log('iguales', iguales);
        if (flag6 > 0 && iguales.length > 0) {
            dialog.alert({ title: 'Alerta', message: 'El articulo tiene el mismo tipo de producto de una orden de servicio creada para este vehiculo' });
            return false
        }
        // console.log('flag7', flag7);
        // console.log('arrayTA', arrayTA);
        // console.log('arrayItemOT', arrayItemOT);
        var iguales_2 = encontrarElementosIguales(arrayTA, arrayItemOT);
        if (flag7 == 0 && iguales_2.length == 0 && buscar_orden_trabajo == _constant.Valor.SI) {
            dialog.alert({ title: 'Alerta', message: 'No existe una Orden de Trabajo del mismo tipo de agrupacion para el item de servicio' });
            return false
        }

        //return false;
        return true

    }

    const validateField = (context) => {
        try {
            //const objRecord = currentRecord.get();
            let currentRecord = context.currentRecord;
            let sublistName = context.sublistId;
            let typeTransaction = currentRecord.type;
            let sublistFieldName = context.fieldId;
            let bien = currentRecord.getValue('custbody_ht_so_bien');
            let userObj = runtime.getCurrentUser()
            let userId = userObj.id
            let numLines = currentRecord.getLineCount({ sublistId: 'item' });
            parametro_reconexion = 0;
            if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
                if (typeTransaction == _constant.Transaction.SALES_ORDER) {
                    let userObj = runtime.getCurrentUser()
                    if (sublistName == 'item') {
                        if (sublistFieldName == 'item') {
                            let idItem = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' });
                            let idItemTXT = currentRecord.getCurrentSublistText({ sublistId: 'item', fieldId: 'item' });
                            let parametrosRespo = _controllerParm.parametrizacion(idItem);
                            for (let j = 0; j < parametrosRespo.length; j++) {
                                //console.log('Entre a validar parametrización');
                                if (parametrosRespo[j][0] == _constant.Parameter.IRS_ITEM_DE_RECONEXION_DE_SERVICIO && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item' + idItemTXT + ' es de reconexion de servicio.');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de reconexion de servicio.' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item' + idItemTXT + ' es de alquiler.');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de alquiler.' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de garantia.');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de garantia.' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.IGS_PRODUCTO_MONITOREADO_POR_GEOSYS && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' va ser monitoreado desde la plataforma px.');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' va ser monitoreado desde la plataforma px.' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.TRM_SERVICIO_DE_TRANSMISION && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de transmisión');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de transmisión' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.THC_HUNTER_CARGO_TECNOLOGIA && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de categoria de hunter cargo');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de categoria de hunter cargo' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.TDP_TIPO_DE_PRODUCTO && parametrosRespo[j][1] == _constant.Valor.VALOR_009_DEMO) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de tipo DEMO');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de tipo DEMO' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.IRP_ITEM_DE_REPUESTO && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' es un ITEM de REPUESTO');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es un ITEM de REPUESTO' });
                                }
                                if (parametrosRespo[j][0] == _constant.Parameter.PCI_PRODUCTO_CONTROL_INTERNO && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' es un ITEM Comercial');
                                    //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es un ITEM Comercial' });
                                }

                                if (parametrosRespo[j][0] == _constant.Parameter.PMI_PRODUCTO_PARA_MONITOREO_DE_INMUEBLES && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    let typeBien = verifyType(bien);
                                    if (typeBien == _constant.Constants.INMUEBLE) {
                                        console.log('Parametrizacion', 'El bien ingresado ES de tipo INMUEBLE');
                                    } else {
                                        console.log('Parametrizacion', 'El bien ingresado NO ES de tipo INMUEBLE');
                                    }
                                }

                                if (parametrosRespo[j][0] == _constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' es un de PRODUCCIÓN');
                                }

                                if (parametrosRespo[j][0] == _constant.Parameter.DSR_DEFINICION_DE_SERVICIOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    console.log('Parametrizacion', 'El item ' + idItemTXT + ' maneja servicios integrados.');
                                    dialog.alert({ title: 'Alerta', message: 'El item ' + idItemTXT + ' maneja servicios integrados.' });
                                }

                                
                            }
                            //console.log('parametrizacion pruebas', parametrosRespo);
                            // console.log('idItem', idItem);
                            let internalid = getServiceSale(idItem);
                            // console.log('internalid', internalid);
                            let employee = search.lookupFields({
                                type: 'employee',
                                id: userObj.id,
                                columns: ['location']
                            });
                            let test = employee.location;

                            if (internalid) {
                                currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '12' });
                                if (test != '') {
                                    test = test[0].value;
                                    //console.log('location', test);
                                    currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: test });
                                }
                                //currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: internalid });
                            } else {
                                currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '1' });
                                if (test != '') {
                                    test = test[0].value;
                                    //console.log('location', test);
                                    currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: test });
                                }
                            }
                        }
                    }
                    /* else if (sublistFieldName == 'custbody_ht_so_bien') {
                        currentRecord.setValue({
                            fieldId: 'custbody_ht_facturar_a',
                            value: currentRecord.getValue('entity')
                        });
                    } */ /* else if (sublistFieldName == 'salesrep') {
                        currentRecord.setValue({
                            fieldId: 'custbody_ht_os_ejecutivareferencia',
                            value: currentRecord.getValue('salesrep')
                        });
                    } */
                }
                return true
            }
        } catch (error) {
            console.log('errror en field change', error);
        }
    }

    const fieldChanged = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;
        try {
            // if (typeMode == 'create' || typeMode == 'copy') {
            if (typeMode == 'create') {
                if (objRecord.getValue({ fieldId: 'custbody_ht_so_bien' }) != objRecord.getValue({ fieldId: 'custbody_ht_os_bien_flag' })) {
                    let linecount = parseInt(objRecord.getLineCount({ sublistId: 'item' }));
                    if (linecount > 0) {
                        console.log('Entré a borrar');
                        for (let i = linecount - 1; i >= 0; i--) {
                            objRecord.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
                        }
                    }
                    objRecord.setValue({ fieldId: 'custbody_ht_os_bien_flag', value: objRecord.getValue({ fieldId: 'custbody_ht_so_bien' }) })
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const postSourcing = (context) => {
        let currentRecord = context.currentRecord;
        const sublistFieldName = context.fieldId;
        let userObj = runtime.getCurrentUser()
        let userId = userObj.id
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            let employee = search.lookupFields({
                type: 'employee',
                id: userId,
                columns: ['department', 'class']
            });
            var departamento = employee.department;
            var departamentovalue = ''
            if (departamento != '') {
                departamentovalue = departamento[0].value;
            }
            var clase = employee.class;
            var clasevalue = '';
            if (clase != '') {
                clasevalue = clase[0].value;
            }
            //var salesrep = currentRecord.getValue('salesrep');
            currentRecord.setValue({ fieldId: 'custbody_ht_os_ejecutivareferencia', value: currentRecord.getValue('salesrep') });
            currentRecord.setValue({ fieldId: 'custbody_ht_facturar_a', value: currentRecord.getValue('entity') });
            currentRecord.setValue({ fieldId: 'department', value: departamentovalue });
            currentRecord.setValue({ fieldId: 'class', value: clasevalue });
        }
    }

    const encontrarElementosIguales = (arr1, arr2) => {
        return arr1.filter(elemento => arr2.includes(elemento));
    }

    const getItemSinServicio = (idBien) => {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_record_ordentrabajo",
                filters:
                    [
                        ["custrecord_ht_ot_vehiculo", "anyof", idBien],
                        "AND",
                        ["custrecord_ht_ot_estado", "anyof", "8", "7", "4"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_ot_item", label: "HT OT Ítem" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 100);
            var internalid = '';
            var arrayId = [];
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    arrayId.push(internalid);
                    return true;
                });
            }
            return arrayId;
        } catch (e) {
            log.error('Error en getItemSinServicio', e);
        }
    }

    const getSalesOrder = (idBien) => {
        try {
            var busqueda = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["custbody_ht_so_bien", "anyof", idBien],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["formulatext: CASE WHEN {item} = 'S-EC'  THEN 0 ELSE 1 END", "is", "1"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "item",
                            summary: "GROUP",
                            label: "Item"
                        })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 100);
            var internalid = '';
            var arrayId = [];
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    arrayId.push(internalid);
                    return true;
                });
            }
            return arrayId;
        } catch (e) {
            log.error('Error en getSalesOrder', e);
        }
    }

    const getServiceSale = (idItem) => {
        try {
            var busqueda = search.create({
                type: "serviceitem",
                filters:
                    [
                        ["type", "anyof", "Service"],
                        "AND",
                        ["unitstype", "anyof", "6"],
                        "AND",
                        ["internalid", "anyof", idItem]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 1);
            var internalid = '';
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    internalid = result.getValue(busqueda.columns[0]);
                    return true;
                });
            }
            return internalid;
        } catch (e) {
            log.error('Error en getServiceSale', e);
        }
    }

    const verifyType = (bien) => {
        let tipoBien = 0;
        let objSearch = search.create({
            type: _constant.customRecord.BIENES,
            filters:
                [
                    ["internalid", "anyof", bien],
                    "AND",
                    ["custrecord_ht_bien_tipobien", "anyof", _constant.Constants.INMUEBLE]

                ],
            columns:
                [
                    search.createColumn({ name: "custrecord_ht_bien_tipobien", label: "Tipo de bien" }),
                ]
        });
        let searchResultCount = objSearch.runPaged().count;
        if (searchResultCount > 0)
            return _constant.Constants.INMUEBLE;
        // objSearch.run().each(result => {
        //     tipoBien = result.getValue({ name: "custrecord_ht_bien_tipobien" });
        //     return true;
        // });
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        validateField: validateField,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        //sublistChanged: sublistChanged
    }
});
