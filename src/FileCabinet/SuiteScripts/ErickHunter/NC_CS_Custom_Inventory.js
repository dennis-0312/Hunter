/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/search', 'N/ui/dialog'], (search, dialog) => {
    let typeMode = '';
    const INSTALADO = "1";

    const pageInit = (scriptContext) => {
        typeMode = scriptContext.mode; //!Importante, no borrar.
    }

    const saveRecord = (context) => {
        let currentRecord = context.currentRecord;
        //console.log('typeMode', typeMode);
        // alert(currentRecord.type)
        let inventoryAssignment = currentRecord.selectLine({ sublistId: 'inventoryassignment', line: 0 });
        let receiptinventorynumber = inventoryAssignment.getCurrentSublistText({ sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber' });
        let issueinventorynumber = inventoryAssignment.getCurrentSublistText({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber' });
        if (receiptinventorynumber.length > 0) {
            try {
                console.log('inventorydetailid', currentRecord.id);
                if (typeMode == 'create' || typeMode == 'copy') {
                    return validacionGlobalDatoTecnico(receiptinventorynumber);
                }

                if (typeMode == 'edit') {
                    let assemblyBuildid = getAssemblyBuild(currentRecord.id)
                    let pertenenciaDatoTecnico = validacionPertenenciaDatoTecnico(receiptinventorynumber, assemblyBuildid)
                    if (!pertenenciaDatoTecnico) {
                        console.log('no pertenece')
                        return validacionGlobalDatoTecnico(receiptinventorynumber)
                    } else {
                        console.log('pertenece')
                    }
                }
                return true;
            } catch (error) {
                console.log(error)
                dialog.alert({ title: 'Error', message: 'Ocurrió un error, comuníquese con su adminsitrador.' });
                return false;
            }
        }

        if (issueinventorynumber.length > 0) {
            let inventoryAssignmentLines = currentRecord.getLineCount({ sublistId: 'inventoryassignment' });
            let id = currentRecord.getValue({ fieldId: 'item' });
            let fieldLookUp = search.lookupFields({ type: 'serializedinventoryitem', id: id, columns: ['custitem_ht_ai_tipocomponente'] });
            let tipeItmes;
            if (Object.keys(fieldLookUp).length != 0) {
                if (fieldLookUp.custitem_ht_ai_tipocomponente.length != 0) {
                    tipeItmes = fieldLookUp.custitem_ht_ai_tipocomponente[0].value;
                }
            }
            let tipoItmesText;
            let customRecord;
            let columns;
            let estadoColumna = 0;
            //console.log(tipeItmes);
            switch (tipeItmes) {
                case '1':
                    tipoItmesText = " Dispositivo Chaser";
                    customRecord = "customrecord_ht_record_detallechaserdisp";
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_dd_dispositivo", label: "dd_dispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_item", label: "dd_item" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispositivo", label: "dd_tipodispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_modelodispositivo", label: "dd_modelodispositivo" }),
                        search.createColumn({ name: "custrecord_ht_dd_macaddress", label: "dd_macaddress" }),
                        search.createColumn({ name: "custrecord_ht_dd_imei", label: "dd_imei" }),
                        search.createColumn({ name: "custrecord_ht_dd_firmware", label: "dd_firmware" }),
                        search.createColumn({ name: "custrecord_ht_dd_script", label: "dd_script" }),
                        search.createColumn({ name: "custrecord_ht_dd_servidor", label: "dd_servidor" }),
                        search.createColumn({ name: "custrecord_ht_dd_estado", label: "dd_estado" }),
                        search.createColumn({ name: "custrecord_ht_dd_tipodispocha", label: "dd_tipodispocha" }),
                        search.createColumn({ name: "custrecord_ht_dd_vid", label: "dd_vid" }),
                        search.createColumn({ name: "custrecord_ht_dd_sn", label: "dd_sn" })
                    ];
                    break;
                case '2':
                    tipoItmesText = " Sim Card";
                    customRecord = "customrecord_ht_record_detallechasersim";
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_ds_simcard", label: "ds_simcard" }),
                        search.createColumn({ name: "custrecord_ht_ds_serie", label: "ds_serie" }),
                        search.createColumn({ name: "custrecord_ht_ds_tiposimcard", label: "ds_tiposimcard" }),
                        search.createColumn({ name: "custrecord_ht_ds_operadora", label: "ds_operadora" }),
                        search.createColumn({ name: "custrecord_ht_ds_ip", label: "ds_ip" }),
                        search.createColumn({ name: "custrecord_ht_ds_apn", label: "ds_apn" }),
                        search.createColumn({ name: "custrecord_ht_ds_numerocelsim", label: "ds_numerocelsim" }),
                        search.createColumn({ name: "custrecord_ht_ds_estado", label: "ds_estado" })
                    ];
                    break;
                case '3':
                    tipoItmesText = " LOJACK";
                    customRecord = "customrecord_ht_record_detallechaslojack";
                    estadoColumna = 4;
                    columns = [
                        search.createColumn({ name: "internalid", label: "ID" }),
                        search.createColumn({ name: "custrecord_ht_cl_seriebox", label: "cl_seriebox" }),
                        search.createColumn({ name: "custrecord_ht_cl_activacion", label: "cl_activacion" }),
                        search.createColumn({ name: "custrecord_ht_cl_respuesta", label: "cl_respuesta" }),
                        search.createColumn({ name: "custrecord_ht_cl_estado", label: "cl_estado" }),
                    ];
                    break;
                default:
                // alert("Revisar configuración TIPO DE COMPONENTE del artículo")
                // return false;
            }
            // console.log(customRecord);
            // console.log(columns);
            let flag = true;
            for (let j = 0; j < inventoryAssignmentLines; j++) {
                let inventoryAssignment = currentRecord.selectLine({ sublistId: 'inventoryassignment', line: j });
                let binNumber = inventoryAssignment.getCurrentSublistText({ sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber' });
                console.log(binNumber.length);
                try {
                    let tobinNumber = inventoryAssignment.getCurrentSublistText({ sublistId: 'inventoryassignment', fieldId: 'tobinnumber' });
                    if (tobinNumber.length > 0)
                        return true;
                } catch (error) {
                    console.log('No aplica validación de carga de datos');
                }

                if (binNumber == '' || tipeItmes == null) {
                    return true;
                }
                var busqueda = search.create({
                    type: customRecord,
                    filters:
                        [search.createFilter({ name: 'name', operator: search.Operator.IS, values: binNumber })],
                    columns: columns
                });

                var pageData = busqueda.runPaged({ pageSize: 1000 });

                if (pageData.count == 0) {
                    dialog.alert({ title: 'Información', message: tipoItmesText + ' ' + binNumber + ' No valido' });
                    return false;
                }
                pageData.pageRanges.forEach((pageRange) => {
                    page = pageData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        var columns = result.columns;
                        for (let i = 0; i < columns.length; i++) {
                            if (result.getValue(columns[i]) == '') {
                                dialog.alert({ title: 'Información', message: 'No se tiene llenado todos los campos del ' + tipoItmesText + ' ' + binNumber });
                                flag = false;
                                break;
                            }
                        }
                        console.log('ESTADOS', result.getValue(columns[estadoColumna]))
                        if (result.getValue(columns[estadoColumna]) != 5 && estadoColumna != 0) {
                            dialog.alert({ title: 'Información', message: 'Estado de Dispositivo ' + tipoItmesText + ' no Disponible ' + binNumber });
                            flag = false;
                            return false;
                        }
                    });
                });
            }
            return flag
        }
    }


    const validacionGlobalDatoTecnico = (serie) => {
        let retorno = true;
        let objSearch = search.create({ //Search: Datos Técnicos Search - DEVELOPER
            type: "customrecord_ht_record_mantchaser",
            filters:
                [
                    ["name", "is", serie],
                    "AND",
                    [["custrecord_ht_mc_estadolodispositivo", "anyof", INSTALADO], "OR", ["custrecord_ht_mc_estadolojack", "anyof", INSTALADO]]
                ],
            columns:
                [
                    search.createColumn({ name: "name", label: "Name" }),
                    search.createColumn({ name: "custrecord_ht_mc_estadolodispositivo", label: "ESTADO DISPOSITIVO" }),
                    search.createColumn({ name: "custrecord_ht_mc_estadolojack", label: "HT MC Estado Lojack" })
                ]
        });
        let searchResultCount = objSearch.runPaged().count;
        //log.debug("verificar duplicidad de dato técnico instalado", searchResultCount);
        if (searchResultCount > 0) {
            dialog.alert({ title: 'Información', message: 'Ya existe un Dato Técnico Instalado para esta Serie.' });
            retorno = false
        }
        return retorno;
    }

    const validacionPertenenciaDatoTecnico = (serie, assemblybuildid) => {
        let retorno = true;
        let objSearch = search.create({
            type: "customrecord_ht_record_mantchaser",
            filters:
                [
                    ["name", "is", serie],
                    "AND",
                    ["custrecord_ht_mc_enlace", "anyof", assemblybuildid]
                ],
            columns:
                [
                    search.createColumn({ name: "name", label: "Name" }),
                    search.createColumn({ name: "custrecord_ht_mc_estadolodispositivo", label: "ESTADO DISPOSITIVO" }),
                    search.createColumn({ name: "custrecord_ht_mc_estadolojack", label: "HT MC Estado Lojack" })
                ]
        });
        var searchResultCount = objSearch.runPaged().count;
        //log.debug("verificar pertenecia de dato técnico con el ensamble", searchResultCount);
        if (searchResultCount == 0) {
            retorno = false
        }
        return retorno;
    }

    const getAssemblyBuild = (inventoryid) => {
        let assemblyBuild = 0;
        let inventorydetailSearchObj = search.create({ //Search Ensamble para Validación de Duplicidad - DEVELOPER
            type: "inventorydetail",
            filters:
                [["internalid", "anyof", inventoryid]],
            columns:
                [search.createColumn({ name: "internalid", join: "transaction", label: "Internal ID" })]
        });
        let searchResultCount = inventorydetailSearchObj.runPaged().count;
        //log.debug("inventorydetailSearchObj result count", searchResultCount);
        inventorydetailSearchObj.run().each((result) => { assemblyBuild = result.getValue({ name: "internalid", join: "transaction", label: "Internal ID" }) });
        return assemblyBuild
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    }
});
