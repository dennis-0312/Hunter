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
    'N/query',
    '../controller/TS_CM_Controller',
    '../constant/TS_CM_Constant',
    '../error/TS_CM_ErrorMessages',
], (search, currentRecord, message, runtime, record, dialog, query, _controllerParm, _constant, _errorMessage) => {
    let typeMode = '';
    const COD_CPR_ACCION_DEL_PRODUCTO = 'CPR'; //_constant.Codigo_parametro.COD_CPR_CONVERSION_DE_PRODUCTO_UPGRADE
    const COD_RFU_ACCION_DEL_PRODUCTO = 'RFU'; //_constant.Codigo_parametro.COD_RFU_REVISIÓN_DE_FAMILIA_UPGRADE
    const COD_FAM_ACCION_DEL_PRODUCTO = 'FAM'; //_constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS
    const COD_VBI_ACCION_DEL_PRODUCTO = 'VBI'; //_constant.Codigo_parametro.COD_VBI_VALIDACION_DE_BIEN_INGRESADO
    const VAL_SI_ACCION_DEL_PRODUCTO = 'S'; //_constant.Codigo_Valor.COD_SI

    const pageInit = (context) => {
        let currentRecord = context.currentRecord;
        typeMode = context.mode; //!Importante, no borrar.
        if (currentRecord.getValue('customform') != _constant.Form.ORDEN_PROVEDURIA && currentRecord.getValue('customform') != _constant.Form.STANDAR_SALES_ORDER) {
            let field = currentRecord.getField('location');
            field.isDisabled = false;
        }
        console.log('typeMode', typeMode);
        if (typeMode == 'create' || typeMode == 'copy') {
            if (currentRecord.getValue('customform') == _constant.Form.ORDEN_PROVEDURIA) {
                currentRecord.setValue({ fieldId: 'entity', value: 541 });
            }

            //currentRecord.setValue('custbody_ht_os_servicios', [3,4,5]);
        }
    }

    const saveRecord = (context) => {
        var currentRecord = context.currentRecord;
        if (currentRecord.getValue('customform') != _constant.Form.ORDEN_PROVEDURIA && currentRecord.getValue('customform') != _constant.Form.STANDAR_SALES_ORDER) {
            let userObj = runtime.getCurrentUser();
            let userId = userObj.id; // 507190 => 209 Edwin
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var T_VBI = false;
            let accionProducto = 0, familiaDeProductos, esConvenio = false, tieneDispositivoParaCustodia = {}, revisionNivelPrecios, itemParametrizacion, parametro_salesorder = 0, valor_inf_ejec_trabajo = 0, valor_tipo_agrupacion_so = 0, valor_cooperativa = 0, valor_item = 0, flag1 = 0, flag2 = 0, flag6 = 0,
                flag7 = 0, arraybusquedaitemSO = new Array(), arraybusquedaitem = new Array(), arrayitemSO = new Array(), arrayTA = new Array(), arrayItemOT = new Array(), buscar_orden_trabajo = 0;

            let numLines = currentRecord.getLineCount({ sublistId: 'item' });
            var arrayItem = []
            for (let i = 0; i < numLines; i++) {
                let items = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                arrayItem.push(items);
            }

            arrayItem = [...new Set(arrayItem)];
            if (numLines != arrayItem.length) {
                dialog.alert({ title: 'Alerta', message: 'Existen artículos repetidos en la lista' });
                return false;
            }

            for (let i = 0; i < numLines; i++) {
                let items = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                let parametrosRespo = _controllerParm.parametrizacion(items);
                if (parametrosRespo != 0) {
                    for (let j = 0; j < parametrosRespo.length; j++) {
                        if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_VBI_VALIDACION_DE_BIEN_INGRESADO && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_SI) {
                            T_VBI = true;
                        }
                    }
                }
            }

            let bien = currentRecord.getValue('custbody_ht_so_bien');
            let cambio_propie_convenio = currentRecord.getValue('custbody_es_cambio_de_propietario');
            let convenio = '';
            let estado_convenio = '';
            let cod_convenio = '';
            if (cambio_propie_convenio && bien != '') {
                let busqueda_bien = obtenerConvenio(bien);
                console.log('busqueda_bien ', busqueda_bien);
                convenio = busqueda_bien[0];
                estado_convenio = busqueda_bien[1];
                cod_convenio = busqueda_bien[2];
                if (convenio == '') {
                    dialog.alert({ title: 'Alerta', message: 'El Bien no tiene un Convenio' });
                    return false
                } else if (estado_convenio != '1') {
                    dialog.alert({ title: 'Alerta', message: 'Estado del Convenio del Bien no esta Activo' });
                    return false
                }
            }

            if (T_VBI == true && bien == '') {
                dialog.alert({ title: 'Alerta', message: 'No se ha ingresado un bien.' });
                return false
            }

            let busqueda_salesorder = [];
            let busqueda_item = [];

            if (bien != '') {
                busqueda_salesorder = getSalesOrder(bien);
                busqueda_item = getItemSinServicio(bien);
            }

            if (busqueda_salesorder.length != 0) {
                for (let i = 0; i < busqueda_salesorder.length; i++) {
                    let parametrosRespo = _controllerParm.parametrizacion(busqueda_salesorder[i]);
                    if (parametrosRespo != 0) {
                        for (let j = 0; j < parametrosRespo.length; j++) {
                            if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                parametro_salesorder = parametrosRespo[j][1];
                                arraybusquedaitemSO.push(parametro_salesorder);
                            }
                        }
                    }
                }
            }

            if (busqueda_item.length != 0) {
                for (let i = 0; i < busqueda_item.length; i++) {
                    let parametrosRespo = _controllerParm.parametrizacion(busqueda_item[i]);
                    if (parametrosRespo != 0) {
                        var accion_producto = 0;
                        var valor_tipo_agrupacion = 0;
                        for (let j = 0; j < parametrosRespo.length; j++) {

                            if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                                accion_producto = parametrosRespo[j][1];
                            }

                            if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                                valor_tipo_agrupacion = parametrosRespo[j][1];
                            }

                            if (valor_tipo_agrupacion != 0 && (accion_producto == _constant.Valor.VALOR_001_INST_DISPOSITIVO || accion_producto == _constant.Valor.VALOR_011_INSTALACION_OTROS_PRODUCTOS)) {
                                arrayItemOT.push(valor_tipo_agrupacion);
                            }
                        }
                    }
                }
            }
            let cliente = currentRecord.getValue('entity');

            var fam_product = [];
            var cooperativa = '';
            var tipo_bien = '';
            let idcobertura = [];
            if (bien != '') {
                var busqueda_bien = search.lookupFields({
                    type: 'customrecord_ht_record_bienes',
                    id: bien,
                    columns: ['custrecord_ht_bn_cooperativaasociacion', 'custrecord_ht_bien_tipobien']
                });
                cooperativa = busqueda_bien.custrecord_ht_bn_cooperativaasociacion;
                tipo_bien = busqueda_bien.custrecord_ht_bien_tipobien;
                idcobertura = _controllerParm.getCobertura(bien);
                console.log('idcobertura.length', idcobertura.length);
                fam_product = getCoberturaItem(bien);
            }


            let esRevisionFamiliaCustodia = false;
            for (let i = 0; i < numLines; i++) {
                var T_CPR = false;
                var T_RFU = false;
                var T_FAM = '';
                let flag3 = 0;
                let flag4 = 0;
                let flag5 = 0;
                let items = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                let valor_tipo_renovacion = 0;
                let linea = currentRecord.selectLine({ sublistId: 'item', line: i });
                let nivelPrecio = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'price', line: i });
                let nextItemIsDiscount = verifyNextItemIsDiscount(currentRecord, i, numLines);
                let verificar_instalacion_parametro;

                if (cambio_propie_convenio && convenio != '') {
                    let obn_item = obtenerItem(items);
                    console.log('obn_item', obn_item);
                    if (obn_item["custitem_ht_it_convenio.custrecord_ht_cn_codigo"] != cod_convenio) {
                        dialog.alert({ title: 'Alerta', message: 'El convenio del Articulo es diferente al del Bien' });
                        return false
                    }
                }

                let parametrosRespo = _controllerParm.parametrizacion(items);
                if (parametrosRespo != 0) {
                    var accion_producto_2 = 0;
                    var valor_tipo_agrupacion_2 = 0;
                    if (parametrosRespo.length) itemParametrizacion = items;
                    for (let j = 0; j < parametrosRespo.length; j++) {
                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO && (parametrosRespo[j][1] == _constant.Valor.VALOR_001_INST_DISPOSITIVO || parametrosRespo[j][1] == _constant.Valor.VALOR_011_INSTALACION_OTROS_PRODUCTOS)) {
                            flag7 += 1;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                            accionProducto = parametrosRespo[j][1];
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.SDE_SOLICITA_DISPOSITIVOS_ENTREGADOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                            flag6 += 1;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.ADP_ACCION_DEL_PRODUCTO) {
                            accion_producto_2 = parametrosRespo[j][1]
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
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
                            if (cooperativa == '' && bien != '') {
                                dialog.alert({ title: 'Alerta', message: 'Se debe ingresar la cooperativa en el Bien' });
                                return false
                            }
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.RFC_REVISION_DE_FAMILIA_DE_CUSTODIA && parametrosRespo[j][1] == _constant.Valor.SI) {
                            console.log('FAMCUSTODIA', parametrosRespo[j][0]);
                            esRevisionFamiliaCustodia = true;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.FAM_FAMILIA_DE_PRODUCTOS) {
                            familiaDeProductos = { familiaProductoId: parametrosRespo[j][1], familiaProductoName: parametrosRespo[j][3] };
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.RLP_REVISION_DE_NIVEL_DE_PRECIOS) {
                            console.log('RLP', parametrosRespo[j][0]);
                            revisionNivelPrecios = parametrosRespo[j][1];
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.PHV_PRODUCTO_HABILITADO_PARA_LA_VENTA && parametrosRespo[j][1] == _constant.Valor.VALOR_X_USO_CONVENIOS) {
                            esConvenio = true;
                        }

                        //Determinar CPR RFU FAM/****************** */
                        if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_SI) {
                            T_CPR = true;
                        }
                        if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_RFU_REVISIÓN_DE_FAMILIA_UPGRADE && parametrosRespo[j][3] == _constant.Codigo_Valor.COD_SI) {
                            T_RFU = true;
                        }
                        if (parametrosRespo[j][2] == _constant.Codigo_parametro.COD_FAM_FAMILIA_DE_PRODUCTOS) {
                            T_FAM = getParamValor(parametrosRespo[j][1]);
                        }
                        if (T_CPR == true && T_RFU == true) {
                            for (let index = 0; index < fam_product.length; index++) {
                                if (fam_product[index] == T_FAM) {
                                    dialog.alert({ title: 'Alerta', message: 'Ya existe una Cobertura con la misma Familia de Producto que un Item' });
                                    return false
                                }
                            }
                        }

                        /****************************************** */
                        //Validación de Prodcutos Instalados
                        if (parametrosRespo[j][0] == _constant.Parameter.CPI_CONTROL_DE_PRODUCTOS_INSTALADOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                            console.log('ADPEntryCPI', accionProducto);
                            if (valor_tipo_renovacion == _constant.Valor.VALOR_001_RENOVACION_NORMAL || accionProducto == _constant.Valor.VALOR_002_DESINSTALACION_DE_DISP || accionProducto == _constant.Valor.VALOR_006_MANTENIMIENTO_CHEQUEO_DE_DISPOSITIVO) {
                                verificar_instalacion_parametro = _controllerParm.parametros(_constant.Parameter.CPI_CONTROL_DE_PRODUCTOS_INSTALADOS, linea, idcobertura, accionProducto, bien);
                                if (verificar_instalacion_parametro.status == false) {
                                    dialog.alert({ title: 'Alerta', message: verificar_instalacion_parametro.mensaje });
                                    return false
                                }
                            } else if (accionProducto == _constant.Valor.VALOR_001_INST_DISPOSITIVO) {
                                verificar_instalacion_parametro = _controllerParm.parametros(_constant.Parameter.CPI_CONTROL_DE_PRODUCTOS_INSTALADOS, linea, 1, accionProducto, bien);
                            }
                            console.log('ADP2', accionProducto);
                            console.log('FAM', familiaDeProductos);
                            if (verificar_instalacion_parametro.status == false) {
                                dialog.alert({ title: 'Alerta', message: verificar_instalacion_parametro.mensaje });
                                return false
                            }
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.CPR_CONVERSION_DE_PRODUCTO_UPGRADE && parametrosRespo[j][1] == _constant.Valor.SI) {
                            flag3 += 1;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.TAG_TIPO_AGRUPACION_PRODUCTO && parametrosRespo[j][1] == _constant.Valor.VALOR_MON_MONITOREO) {
                            flag4 += 1;
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.PMI_PRODUCTO_PARA_MONITOREO_DE_INMUEBLES && parametrosRespo[j][1] == _constant.Valor.SI && tipo_bien != _constant.Constants.INMUEBLE) {
                            if (bien != '') {
                                dialog.alert({ title: 'Alerta', message: 'El tipo del vehiculo debe ser INMUEBLE' });
                                return false
                            }
                        }

                        if (parametrosRespo[j][1] == _constant.Valor.SI) {
                            let verificar;
                            if (parametrosRespo[j][0] == _constant.Parameter.GPT_GENERA_PARAMETRIZACION_EN_TELEMATICS) {
                                verificar = _controllerParm.parametros(parametrosRespo[j][0], cliente, idcobertura);
                            } else {
                                verificar = _controllerParm.parametros(parametrosRespo[j][0], linea, idcobertura);
                            }
                            if (verificar.status == false) {
                                dialog.alert({ title: 'Alerta', message: verificar.mensaje });
                                return false
                            }
                        }

                        if (parametrosRespo[j][0] == _constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS && parametrosRespo[j][1] == _constant.Valor.VALOR_002_ENTREGA_CUSTODIAS) {
                            let response = _controllerParm.parametros(_constant.Parameter.CCD_CONTROL_DE_CUSTODIAS_DE_DISPOSITIVOS, context.currentRecord)
                            tieneDispositivoParaCustodia = response;
                        }

                    }
                    if ((flag3 > 0) && (flag3 != flag4)) {
                        dialog.alert({ title: 'Alerta', message: 'El producto upgrade debe tener una agrupacion de tipo monitoreo' });
                        return false
                    }
                    if ((flag5 > 0) && (flag5 != flag4)) {
                        dialog.alert({ title: 'Alerta', message: 'El producto basico debe tener una agrupacion de tipo monitoreo' });
                        return false
                    }

                    if (revisionNivelPrecios) {
                        console.log('revisionNivelPrecios', revisionNivelPrecios);
                        if (esConvenio) {
                            let itemRecord = obtenerItem(items);
                            if (!itemRecord["custitem_ht_it_convenio.custrecord_ht_cn_codigo"]) {
                                dialog.alert({ title: 'Alerta', message: 'Configure un código de convenio para el artículo' });
                                return false;
                            } else {
                                if (!(nivelPrecio.includes(itemRecord["custitem_ht_it_convenio.custrecord_ht_cn_codigo"]) || nivelPrecio == _constant.PriceLevels.PVP || nivelPrecio == _constant.PriceLevels.PERSONALIZADO) && nextItemIsDiscount) {
                                    dialog.alert({ title: 'Alerta', message: 'Seleccione el nivel de precio correspondiente al código de convenio' });
                                    return false;
                                }
                            }
                        } else {
                            console.log('Entry', 'Entry1');
                            if (!(nivelPrecio == _constant.PriceLevels.PVP || nivelPrecio == _constant.PriceLevels.PERSONALIZADO) && nextItemIsDiscount) {
                                dialog.alert({ title: 'Alerta', message: 'Seleccione el nivel de precio correspondiente al artículo' });
                                return false;
                            }
                        }
                    }
                }
            }

            if (accionProducto == _constant.Valor.VALOR_003_REINSTALACION_DE_DISP && esRevisionFamiliaCustodia) {
                console.log('Entra Reinstalación Custodia');
                let custodia = buscarCustodia(cliente, familiaDeProductos.familiaProductoId);
                console.log('Entra Reinstalación Custodia' + ' - ' + custodia);
                if (custodia == 0) {
                    dialog.alert({ title: 'Alerta', message: `No se encuentra un registro de custodia para esta familia de producto ${familiaDeProductos.familiaProductoName}` });
                    return false;
                }
            }

            if (tieneDispositivoParaCustodia.status == false) {
                dialog.alert({ title: 'Alerta', message: tieneDispositivoParaCustodia.mensaje });
                return false;
            }

            if (accionProducto == _constant.Valor.VALOR_010_CAMBIO_DE_PROPIETARIO && numLines != 1) {
                dialog.alert({ title: 'Alerta', message: 'No se puede tener un Artículo tipo Cambio de Propietario junto a otro Artículo' });
                return false
            }

            if (valor_inf_ejec_trabajo == _constant.Valor.SI) {
                var novedades = currentRecord.getValue('custbody_ht_os_novedades');
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

            var iguales = encontrarElementosIguales(arraybusquedaitemSO, arrayitemSO);
            //console.log('iguales', iguales);
            if (flag6 > 0 && iguales.length > 0) {
                dialog.alert({ title: 'Alerta', message: 'El articulo tiene el mismo tipo de producto de una orden de servicio creada para este vehiculo' });
                return false
            }

            var iguales_2 = encontrarElementosIguales(arrayTA, arrayItemOT);
            if (flag7 == 0 && iguales_2.length == 0 && buscar_orden_trabajo == _constant.Valor.SI) {
                dialog.alert({ title: 'Alerta', message: 'No existe una Orden de Trabajo del mismo tipo de agrupacion para el item de servicio' });
                return false
            }

            // if (userId == 4) {
            //     return false
            // } else {
            //     return true
            // }
            //return false;
            return true
        } else {
            return true
        }
    }

    const validateField = (context) => {
        var currentRecord = context.currentRecord;
        if (currentRecord.getValue('customform') != _constant.Form.ORDEN_PROVEDURIA && currentRecord.getValue('customform') != _constant.Form.STANDAR_SALES_ORDER) {
            //alert('userId', 'Entry validateField');
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
                                    // if (parametrosRespo[j][0] == _constant.Parameter.IRS_ITEM_DE_RECONEXION_DE_SERVICIO && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item' + idItemTXT + ' es de reconexion de servicio.');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de reconexion de servicio.' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.ALQ_PRODUCTO_DE_ALQUILER && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item' + idItemTXT + ' es de alquiler.');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de alquiler.' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.PGR_PRODUCTO_DE_GARANTÍA && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de garantia.');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de garantia.' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.IGS_PRODUCTO_MONITOREADO_POR_GEOSYS && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' va ser monitoreado desde la plataforma px.');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' va ser monitoreado desde la plataforma px.' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.TRM_SERVICIO_DE_TRANSMISION && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de transmisión');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de transmisión' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.THC_HUNTER_CARGO_TECNOLOGIA && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de categoria de hunter cargo');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de categoria de hunter cargo' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.TDP_TIPO_DE_PRODUCTO && parametrosRespo[j][1] == _constant.Valor.VALOR_009_DEMO) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' es de tipo DEMO');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es de tipo DEMO' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.IRP_ITEM_DE_REPUESTO && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' es un ITEM de REPUESTO');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es un ITEM de REPUESTO' });
                                    // }
                                    // if (parametrosRespo[j][0] == _constant.Parameter.PCI_PRODUCTO_CONTROL_INTERNO && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' es un ITEM Comercial');
                                    //     //dialog.alert({ title: 'Alerta', message: 'El item ' + idItem + ' es un ITEM Comercial' });
                                    // }

                                    // if (parametrosRespo[j][0] == _constant.Parameter.PMI_PRODUCTO_PARA_MONITOREO_DE_INMUEBLES && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     if (bien != '') {
                                    //         let typeBien = verifyType(bien);
                                    //         if (typeBien == _constant.Constants.INMUEBLE) {
                                    //             console.log('Parametrizacion', 'El bien ingresado ES de tipo INMUEBLE');
                                    //         } else {
                                    //             console.log('Parametrizacion', 'El bien ingresado NO ES de tipo INMUEBLE');
                                    //         }
                                    //     }
                                    // }

                                    // if (parametrosRespo[j][0] == _constant.Parameter.PRO_ITEM_COMERCIAL_DE_PRODUCCION && parametrosRespo[j][1] == _constant.Valor.SI) {
                                    //     console.log('Parametrizacion', 'El item ' + idItemTXT + ' es un de PRODUCCIÓN');
                                    // }

                                    if (parametrosRespo[j][0] == _constant.Parameter.DSR_DEFINICION_DE_SERVICIOS && parametrosRespo[j][1] == _constant.Valor.SI) {
                                        let sql = 'SELECT custitem_ht_it_servicios as servicios FROM item WHERE id = ?';
                                        let params = [idItem]
                                        let array = new Array();
                                        let resultSet = query.runSuiteQL({ query: sql, params: params });
                                        let results = resultSet.asMappedResults();
                                        if (results.length > 0) {
                                            let arregloconvertido = results[0]['servicios'].split(",")
                                            array = arregloconvertido.map(a => parseInt(a));
                                            dialog.alert({ title: 'Alerta', message: 'El item ' + idItemTXT + ' maneja servicios integrados.' });
                                            currentRecord.setValue('custbody_ht_os_servicios', array);
                                        }
                                    }
                                }
                                let internalid = getServiceSale(idItem);
                                let employee = search.lookupFields({
                                    type: 'employee',
                                    id: userObj.id,
                                    columns: ['location']
                                });
                                let test = employee.location;

                                if (internalid) {
                                    //currentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: '12' });
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
        } else {
            return true;
        }
    }

    const fieldChanged = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;
        if (objRecord.getValue('customform') != _constant.Form.ORDEN_PROVEDURIA && objRecord.getValue('customform') != _constant.Form.STANDAR_SALES_ORDER) {
            //alert('userId', 'Entry fieldChanged');
            var FieldName = scriptContext.fieldId;
            let userObj = runtime.getCurrentUser();
            let userId = userObj.id; // 507190 => 209 Edwin
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
                if (typeMode == 'create' || typeMode == 'copy') {
                    if (FieldName == 'custbody_ht_so_bien') {
                        let bien = objRecord.getValue({ fieldId: 'custbody_ht_so_bien' });
                        let busqueda_bien = obtenerConvenio(bien)
                        let convenio = busqueda_bien[0];
                        if (convenio != '') {
                            objRecord.setValue({ fieldId: 'custbody_ht_os_convenio', value: convenio });
                        }
                    }
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    const postSourcing = (context) => {
        let currentRecord = context.currentRecord;
        if (currentRecord.getValue('customform') != _constant.Form.ORDEN_PROVEDURIA && currentRecord.getValue('customform') != _constant.Form.STANDAR_SALES_ORDER) {
            //alert('userId', 'Entry postSourcing');
            const sublistFieldName = context.fieldId;
            let userObj = runtime.getCurrentUser()
            let userId = userObj.id
            if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
                let employee = search.lookupFields({
                    type: 'employee',
                    id: userId,
                    columns: [
                        'department',
                        'class',
                        'location'
                    ]
                });
                let departamento = employee.department;
                let departamentovalue = ''
                if (departamento != '') {
                    departamentovalue = departamento[0].value;
                }
                let clase = employee.class;
                let clasevalue = '';
                if (clase != '') {
                    clasevalue = clase[0].value;
                }

                // let location = employee.location;
                // let locationvalue = '';
                // if (location != '') {
                //     locationvalue = location[0].value;
                // }
                //var salesrep = currentRecord.getValue('salesrep');
                currentRecord.setValue({ fieldId: 'custbody_ht_os_ejecutivareferencia', value: currentRecord.getValue('salesrep') });
                currentRecord.setValue({ fieldId: 'custbody_ht_facturar_a', value: currentRecord.getValue('entity') });
                currentRecord.setValue({ fieldId: 'department', value: departamentovalue });
                currentRecord.setValue({ fieldId: 'class', value: clasevalue });
                // currentRecord.setValue({ fieldId: 'location', value: locationvalue });
            }
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

    const buscarCustodia = (item, familiaDeProductos) => {
        let custodiaResult = search.create({
            type: "customrecord_ht_record_custodia",
            filters: [
                ["custrecord_ht_ct_cliente", "anyof", item],
                "AND",
                ["custrecord_ht_ct_familia", "anyof", familiaDeProductos]
            ],
            columns: ["internalid"]
        }).run().getRange(0, 1000);
        return custodiaResult.length
    }

    function getCoberturaItem(idBien) {
        try {
            var busqueda = search.create({
                type: "customrecord_ht_co_cobertura",
                filters:
                    [
                        ["custrecord_ht_co_bien", "anyof", idBien],
                        "AND",
                        ["custrecord_ht_co_estado_cobertura", "anyof", "1", "2"] //ACTIVO o SUSPENDIDO
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_codigo", join: "custrecord_ht_co_familia_prod", label: "Código" })
                    ]
            });
            var savedsearch = busqueda.run().getRange(0, 100);
            var cod_familia = '';
            var internalid = '';
            var array_cod_familia = [];
            if (savedsearch.length > 0) {
                busqueda.run().each(function (result) {
                    var arrayId = [];
                    cod_familia = result.getValue(busqueda.columns[0]);
                    array_cod_familia.push(cod_familia);
                    return true;
                });
            }
            return array_cod_familia;
        } catch (e) {
            log.error('Error en getCoberturaItem', e);
        }
    }

    function getParamValor(ID_parametrizacionVal) {
        try {
            let codigo = '';
            var busqueda = search.create({
                type: "customrecord_ht_cr_pp_valores",
                filters:
                    [
                        ["internalid", "anyof", ID_parametrizacionVal]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ht_pp_codigo", label: "Código" }),
                    ]
            });
            var pageData = busqueda.runPaged({
                pageSize: 1
            });

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    var columns = result.columns;
                    //0. Internal id match
                    if (result.getValue(columns[0]) != null) {
                        codigo = result.getValue(columns[0]);
                    }
                });
            });
            return codigo;
        } catch (e) {
            log.error('Error en getParamValor', e);
        }
    }

    const verifyNextItemIsDiscount = (currentRecord, i, numLines) => {
        if (numLines == i + 1) return false;
        let nextItem = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i + 1 });
        if (!nextItem) return false;
        let itemRecordType = obtenerItem(nextItem);
        if (itemRecordType.recordtype && itemRecordType.recordtype == "discountitem") return true;
        return false;
    }

    const obtenerItem = (id) => {
        return search.lookupFields({
            type: "item",
            id: id,
            columns: ["recordtype", "custitem_ht_it_convenio.custrecord_ht_cn_codigo"]
        });
    }

    const obtenerConvenio = (bien) => {
        let busqueda_bien = search.lookupFields({
            type: 'customrecord_ht_record_bienes',
            id: bien,
            columns: ['custrecord_ht_bien_conveniovehiculo', 'custrecord_ht_bien_estadoconvenio', 'custrecord_ht_bien_conveniovehiculo.custrecord_ht_cn_codigo']
        });
        console.log('busqueda_bien', busqueda_bien);
        let convenio = busqueda_bien.custrecord_ht_bien_conveniovehiculo.length ? busqueda_bien.custrecord_ht_bien_conveniovehiculo[0].value : '';
        let estadoConvenio = busqueda_bien.custrecord_ht_bien_estadoconvenio.length ? busqueda_bien.custrecord_ht_bien_estadoconvenio[0].value : '';
        let cod_convenio = busqueda_bien["custrecord_ht_bien_conveniovehiculo.custrecord_ht_cn_codigo"];

        console.log('cod_convenio', cod_convenio);
        let result = [convenio, estadoConvenio, cod_convenio];
        return result;
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        validateField: validateField,
        fieldChanged: fieldChanged,
        //postSourcing: postSourcing, //*DESCATIVADO POR ROL FACTURACION_LIQUIDACION - REVISAR
        //sublistChanged: sublistChanged
    }
});