/**
 *@NApiVersion 2.1
*/
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/record'], function (serverWidget, search, url, record) {

    class Constant {
        constructor() {
            this.EMPTY_SELECT_VALUE = -1;
            this.PARTIDA_SEARCH_ID = "customsearch_co_partida_presupuestal_rp";
            this.UNIDAD_FUNCIONAL_SEARCH_ID = "customsearch_co_unidad_funcional_co";
            this.UNIDAD_TERRITORIAL_SEARCH_ID = "customsearch_co_unidad_territorial_rp";
            this.EJE_INTERVENCION_SEARCH_ID = "customsearch_co_eje_de_intervencion_rp";
            this.PROYECT_SEARCH_ID = "customsearch_co_proyecto_rp";
            this.ACCOUNT_SEARCH_ID = "customsearch_co_account_rp";
            this.PRESUPUESTO_MENSUAL_RECORD_ID = 'customrecord_lh_categoriap_periodo';
            this.CONTROL_PRESUPUESTAL_RESERVADO_SEARCH_ID = "customsearch_control_ppto_reservado";
            this.CONTROL_PRESUPUESTAL_COMPROMETIDO_SEARCH_ID = "customsearch_control_ppto_comprometido";
            this.CONTROL_PRESUPUESTAL_EJECUTADO_SEARCH_ID = "customsearch_control_ppto_ejecutado";
            this.PAGE_SIZE = 500;
        }

    }

    class Field {
        constructor(field) {
            this.field = field;
        }

        addSelectOption = (value, text, isSelected = null) => {
            this.field.addSelectOption({
                value,
                text,
                isSelected
            });
        }

        updateDisplayType = (displayType) => {
            return this.field.updateDisplayType({ displayType });
        }
        updateBreakType = (displayType) => {
            return this.field.updateBreakType({ breakType: displayType });
        }

        setDefaultValue = (value) => {
            this.field.defaultValue = value;
        }

        getDefaultValue = () => {
            return this.field.defaultValue;
        }

        setMandatoryValue = (value) => {
            this.field.isMandatory = value;
        }

        setDisabledValue = (value) => {
            this.field.isDisabled = value;
        }
    }

    class SubList {
        constructor(sublist) {
            this.sublist = sublist;
        }

        addSublistField = (id, type, label, source = null) => {
            return new Field(this.sublist.addField({
                id,
                type,
                label,
                source
            }));
        }

        addSublistFieldHidden = (id, type, label, source = null) => {
            return new Field(this.sublist.addField({
                id,
                type,
                label,
                source
            }));//.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        }

        setSublistValue = (id, line, value) => {
            this.sublist.setSublistValue({
                id,
                line,
                value
            });
        }

        addRefreshButton = () => {
            this.sublist.addRefreshButton();
        }
    }

    class UserInterface {
        constructor() {
            this.FORM = null;
            this.FIELDS_NAME = this.getFormFieldsName();
            this.FIELDS_ID = this.getFormFieldsId();
            this.CONSTANT = new Constant();
        }

        init = () => {
            log.error("Que fue");
        }

        createForm = (formName) => {
            this.FORM = serverWidget.createForm(formName);
        }

        addSubmitButton = (name) => {
            this.FORM.addSubmitButton(name);
        }

        addField = (id, type, label, container = null, source = null) => {
            return new Field(this.FORM.addField({
                id,
                type,
                label,
                container,
                source
            }));
        }

        addSublist = (id, type, label) => {
            return new SubList(this.FORM.addSublist({
                id,
                type,
                label
            }));
        }

        addButton = (id, label, functionName) => {
            this.FORM.addButton({
                id,
                label,
                functionName
            });
        }
        addsubilistnew = () => {
            return new SubList(this.FORM.addSublist({
                id: 'custpage_sublistadd',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'DEPOSITOS'
            }));
        }
        addFieldGroup = (id, label) => {
            return this.FORM.addFieldGroup({
                id, label
            });
        }

        getValuesSubsidiary = (subsidiaryID) => {
            let customSub = record.load({ type: 'subsidiary', id: subsidiaryID });
            return {
                ruc: customSub.getValue('federalidnumber'),
                razonSocial: customSub.getValue('legalname'),
                direccion: customSub.getValue('mainaddress_text'),
                remitente: customSub.getValue('legalname')
            }
        }

        getFormFieldsName = () => {
            return {
                form: {
                    main: 'Reporte Integrado de Movimientos Presupuestales'
                },
                fieldgroup: {
                    filters: 'Periodo',
                    segmentation: 'Segmentación',
                    results: 'Lista de Presupuestos'
                },
                field: {
                    subsidiary: 'Subsidiaria',
                    startdate: 'Fecha de Inicio',
                    enddate: 'Fecha de Fin',
                    partida: 'Partida de Presupuesto',
                    unidadfuncional: 'Unidad Funcional',
                    unidadterritorial: 'Unidad Territorial',
                    ejeintervencion: 'Eje de Intervención',
                    proyect: 'Proyecto',
                    account: 'Cuenta',
                    page: 'Indice de Pagina',
                    functions: ' '
                },
                sublist: {
                    results: 'Lista de Presupuestos'
                },
                sublistfield: {
                    id: 'Id',
                    partida: 'Partida',
                    name: 'Nombre',
                    unidadfuncional: 'Unidad Funcional',
                    unidadterritorial: 'Unidad Territorial',
                    ejeintervencion: 'Eje Intervencion',
                    proyect: 'Proyecto',
                    account: 'Cuenta',
                    increase: 'Aumento',
                    decrease: 'Disminución',
                    total: 'Total',
                    available: 'Disponible'
                },
                button: {
                    excel: 'Descargar Excel',
                    pdf: 'Descargar Pdf',
                    reset: 'Limpiar Filtros'
                }
            }
        }

        getFormFieldsId = () => {
            return {
                fieldgroup: {
                    filters: 'custpage_fg_filters',
                    segmentation: 'custpage_fg_segmentation',
                    results: 'custpage_fg_results'
                },
                field: {
                    subsidiary: 'custpage_f_subsidiary',
                    startdate: 'custpage_f_startdate',
                    enddate: 'custpage_f_enddate',
                    partida: 'custpage_f_partida',
                    unidadfuncional: 'custpage_f_unidadfuncional',
                    unidadterritorial: 'custpage_f_unidadterritorial',
                    ejeintervencion: 'custpage_f_ejeintervencion',
                    proyect: 'custpage_f_proyect',
                    account: 'custpage_f_account',
                    page: 'custpage_f_page',
                    functions: 'custpage_f_functions'
                },
                sublist: {
                    results: 'custpage_sl_results'
                },
                sublistfield: {
                    id: 'custpage_slf_id',
                    partida: 'custpage_slf_partida',
                    name: 'custpage_slf_name',
                    unidadfuncional: 'custpage_slf_unidadfuncional',
                    unidadterritorial: 'custpage_slf_unidadterritorial',
                    ejeintervencion: 'custpage_slf_ejeintervencion',
                    proyect: 'custpage_slf_proyect',
                    account: 'custpage_slf_account',
                    increase: 'custpage_slf_increase',
                    decrease: 'custpage_slf_decrease',
                    total: 'custpage_slf_total',
                    available: 'custpage_slf_available'
                },
                button: {
                    excel: 'custpage_b_excel',
                    pdf: 'custpage_b_pdf',
                }
            }
        }

        setPartidaFieldData = (partidaField, subsidiary) => {
            let partidaSearch = search.load({ id: 'customsearch_serch_location' });
            var filter = search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.IS,
                values: subsidiary
            });


            partidaSearch.filters.push(filter);
            partidaField.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            partidaSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[1]);
                partidaField.addSelectOption(value, text);
                return true;
            });
        }
        setPartidaFieldDataSerie = (partidaField, localizacion) => {
            let partidaSearch = search.load({ id: 'customsearchserch_guia' });
            var filter = search.createFilter({
                name: 'custrecord_pe_location',
                operator: search.Operator.IS,
                values: localizacion
            });


            partidaSearch.filters.push(filter);
            partidaField.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            partidaSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[1]);
                partidaField.addSelectOption(value, text);
                return true;
            });
        }


        setCustomerData = (fieldID, paramSearch, paramFilter) => {
            let partidaSearch = search.load({ id: paramSearch });
            partidaSearch.filters.push(this.createFilter("subsidiary", search.Operator.ANYOF, paramFilter));
            fieldID.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            partidaSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[1]);
                fieldID.addSelectOption(value, text);
                return true;
            });
        }

        setUnidadFuncionalFieldData = (unidadFuncionalField) => {
            let unidadFuncionalSearch = search.load({ id: this.CONSTANT.UNIDAD_FUNCIONAL_SEARCH_ID });
            unidadFuncionalField.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            unidadFuncionalSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[1]);
                unidadFuncionalField.addSelectOption(value, text);
                return true;
            });
        }

        setCuentasFieldData = (CuentasField) => {
            var accountSearchObj = search.create({
                type: "account",
                filters:
                    [
                        ["type", "anyof", "AcctPay"],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "displayname", label: "Nombre para mostrar" }),
                        search.createColumn({ name: "internalid", label: "ID interno" })
                    ]
            });
            CuentasField.addSelectOption('', '');
            accountSearchObj.run().each(function (result) {
                let value = result.getValue(result.columns[1]);
                let text = result.getValue(result.columns[0]);
                CuentasField.addSelectOption(value, text);
                return true;
            });
        }

        setTipoTransaccionFieldData = (TipoTransaccionFiel) => {
            TipoTransaccionFiel.addSelectOption('', '');
            TipoTransaccionFiel.addSelectOption('Factura', 'Factura');
            TipoTransaccionFiel.addSelectOption('Informe de gastos', 'Informe de gastos');
            TipoTransaccionFiel.addSelectOption('Pago de factura', 'Pago de factura');
            TipoTransaccionFiel.addSelectOption('Crédito de factura', 'Crédito de factura');
            TipoTransaccionFiel.addSelectOption('Diario', 'Diario');

        }

        setUnidadTerritorialFieldData = (unidadTerritorialField) => {
            let unidadTerritorialSearch = search.load({ id: this.CONSTANT.UNIDAD_TERRITORIAL_SEARCH_ID });
            unidadTerritorialField.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            unidadTerritorialSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[1]);
                unidadTerritorialField.addSelectOption(value, text);
                return true;
            });
        }

        setEjeIntervencionFieldData = (ejeIntervencionField) => {
            let ejeIntervencionSearch = search.load({ id: this.CONSTANT.EJE_INTERVENCION_SEARCH_ID });
            ejeIntervencionField.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            ejeIntervencionSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[1]);
                ejeIntervencionField.addSelectOption(value, text);
                return true;
            });
        }

        setProyectFieldData = (proyectField) => {
            let proyectSearch = search.load({ id: this.CONSTANT.PROYECT_SEARCH_ID });
            proyectField.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            proyectSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[1]);
                text = result.getValue(result.columns[2]) ? `${result.getValue(result.columns[2])} ${text}` : text;
                proyectField.addSelectOption(value, text);
                return true;
            });
        }

        setAccountFieldData = (accountField) => {
            let accountSearch = search.load({ id: this.CONSTANT.ACCOUNT_SEARCH_ID });
            accountField.addSelectOption(this.CONSTANT.EMPTY_SELECT_VALUE, '- Seleccione -');
            accountSearch.run().each(function (result) {
                let value = result.getValue(result.columns[0]);
                let text = result.getValue(result.columns[2]) + ' - ' + result.getValue(result.columns[1]);
                accountField.addSelectOption(value, text);
                return true;
            });
        }

        setResultSubListData = (resultSubList, defaultValues, firstDay, lastDay, busquedaLista) => {

            let customSearch = search.load({ id: busquedaLista });

            customSearch.filters.push(this.createFilter("subsidiary", search.Operator.ANYOF, defaultValues.subsidiaria));
            //customSearch.filters.push(this.createFilter("custbody_pe_location_source", search.Operator.ANYOF, defaultValues.vendedorField));
            customSearch.filters.push(this.createFilter("trandate", search.Operator.WITHIN, [firstDay, lastDay]));

            //customSearch.filters.push(this.createFilter("custbody_pe_document_type", search.Operator.ANYOF, defaultValues.peComprobanteField));

            let pagedData = customSearch.runPaged({ pageSize: this.CONSTANT.PAGE_SIZE });
            let resultTotalNumber = pagedData.count;
            if (resultTotalNumber) {
                let pageField = this.addField(this.FIELDS_ID.field.page, serverWidget.FieldType.SELECT, this.FIELDS_NAME.field.page, this.FIELDS_ID.fieldgroup.results);
                let pagedCount = Math.ceil(resultTotalNumber / this.CONSTANT.PAGE_SIZE);
                for (let i = 0; i < pagedCount; i++) {
                    let value = i;
                    let text = ((i * this.CONSTANT.PAGE_SIZE) + 1) + ' - ' + ((i + 1) * this.CONSTANT.PAGE_SIZE);
                    if (i == defaultValues.page) {
                        pageField.addSelectOption(value, text, true);
                    } else {
                        pageField.addSelectOption(value, text);
                    }
                }

                let page = pagedData.fetch({ index: defaultValues.page });
                let resultJson = {}, partidasInternalIdArray = [];
                page.data.forEach(result => {
                    let columns = result.columns;
                    let internalid = result.getValue({ name: "internalid", label: "ID interno" });
                    let internalUser = result.getValue({ name: "internalid", join: "customerMain", label: "ID interno" });
                    let tranid = result.getValue({ name: "tranid", label: "Número de documento" });
                    let vendor = result.getValue({ name: "trandate", label: "Fecha" });
                    let estado = result.getValue({ name: "statusref", label: "Estado" });
                    let cliente = result.getValue({ name: "altname", join: "customerMain", label: "Nombre" });
                    let articulo = result.getValue({ name: "displayname", join: "item", label: "Nombre para mostrar" });
                    let importe = result.getValue({ name: "custcol_ht_so_cost_import", label: "Importe de Provisión de Costo" }) || 0;
                    let idarticulo = result.getValue({ name: "item", label: "Artículo" });

                    let costo = result.getText({ name: "custcol_ht_so_cost_account", label: "Cuenta de Costos" });
                    let provision = result.getText({ name: "custcol_ht_so_cost_account_provision", label: "HT Cuenta Provision de Costo" });
                    let directa = result.getText({ name: "custbody_ht_factura_directa", label: "HT Factura Directa Agrupada" });
                    let idcosto = result.getValue({ name: "custcol_ht_so_cost_account", label: "Cuenta de Costos" });
                    let idprovision = result.getValue({ name: "custcol_ht_so_cost_account_provision", label: "HT Cuenta Provision de Costo" });
                    let departamento = result.getValue({ name: "department", label: "Departamento" }) || ' ';
                    let clase = result.getValue({ name: "class", label: "Clase" }) || ' ';
                    let oficina = result.getValue({ name: "location", label: "Oficina" }) || ' ';


                    resultJson = {
                        internalid: internalid,
                        vendor: vendor,
                        tranid: tranid,
                        cliente: cliente,
                        estado: estado,
                        articulo: articulo,
                        importe: importe,
                        internalUser: internalUser,
                        idarticulo: idarticulo,
                        costo: costo,
                        provision: provision,
                        idcosto: idcosto,
                        idprovision: idprovision,
                        directa: directa,
                        departamento: departamento,
                        clase: clase,
                        oficina: oficina,

                    }

                    partidasInternalIdArray.push(resultJson);
                });


                let line = 0;
                for (let index = 0; index < partidasInternalIdArray.length; index++) {
                    const result = partidasInternalIdArray[index];

                    resultSubList.setSublistValue('custpage_sublist_id', line, result.internalid);
                    resultSubList.setSublistValue('custpage_sublist_documento', line, result.tranid);
                    resultSubList.setSublistValue('custpage_sublist_fecha', line, result.vendor);
                    resultSubList.setSublistValue('custpage_sublist_idcliente', line, result.internalUser);
                    resultSubList.setSublistValue('custpage_sublist_cliente', line, result.cliente);
                    resultSubList.setSublistValue('custpage_sublist_estado', line, result.estado);
                    resultSubList.setSublistValue('custpage_sublist_idarticulo', line, result.idarticulo);
                    resultSubList.setSublistValue('custpage_sublist_articulo', line, result.articulo);
                    resultSubList.setSublistValue('custpage_sublist_importe', line, result.importe);
                    resultSubList.setSublistValue('custpage_sublist_costo', line, result.costo);
                    resultSubList.setSublistValue('custpage_sublist_provicion', line, result.provision);
                    resultSubList.setSublistValue('custpage_sublist_directa', line, result.directa);

                    resultSubList.setSublistValue('custpage_sublist_codcosto', line, result.idcosto);
                    resultSubList.setSublistValue('custpage_sublist_codprovision', line, result.idprovision);
                    resultSubList.setSublistValue('custpage_sublist_departamento', line, result.departamento);
                    resultSubList.setSublistValue('custpage_sublist_clase', line, result.clase);
                    resultSubList.setSublistValue('custpage_sublist_oficina', line, result.oficina);
                    line++;

                }

            }
        }
        setResultSubListDataLog = (resultSubList, defaultValues) => {
            let customSearch = search.load({ id: 'customsearch_log_errores_asiento' });
            let pagedData = customSearch.runPaged({ pageSize: this.CONSTANT.PAGE_SIZE });
            let resultTotalNumber = pagedData.count;
            if (resultTotalNumber) {
                let pageField = this.addField(this.FIELDS_ID.field.page, serverWidget.FieldType.SELECT, this.FIELDS_NAME.field.page, this.FIELDS_ID.fieldgroup.results);
                let pagedCount = Math.ceil(resultTotalNumber / this.CONSTANT.PAGE_SIZE);
                for (let i = 0; i < pagedCount; i++) {
                    let value = i;
                    let text = ((i * this.CONSTANT.PAGE_SIZE) + 1) + ' - ' + ((i + 1) * this.CONSTANT.PAGE_SIZE);
                    if (i == defaultValues.page) {
                        pageField.addSelectOption(value, text, true);
                    } else {
                        pageField.addSelectOption(value, text);
                    }
                }

                let page = pagedData.fetch({ index: defaultValues.page });
                let resultJson = {}, partidasInternalIdArray = [];
                page.data.forEach(result => {
                    let columns = result.columns;
                    let internalid = result.getValue({ name: "internalid", label: "ID interno" });
                    let estado = result.getValue({ name: "custrecord_logas_estado", label: "Estado " });
                    let usuario = result.getText({ name: "custrecord_log_usuario", label: "Usuario" });
                    let asiento = result.getValue({ name: "custrecord_log_asiento", label: "Asiento Creado " });
                    let asientotext = result.getText({ name: "custrecord_log_asiento", label: "Asiento Creado " });
                    let creacion = result.getValue({ name: "custrecord_log_fecha_creacion", label: "Fecha  de creacion " });
                    let finalizacion = result.getValue({ name: "custrecord_log_fecha_finalizacion", label: "Fecha de finalizacion " });
                    let creado = result.getText({ name: "custrecord_log_creado", label: "Creado por" });
                    let err = result.getValue({ name: "custrecord_log_errores" });


                    resultJson = {
                        internalid: internalid,
                        asientotext: asientotext,
                        err: err || ' ',
                        estado: estado,
                        usuario: usuario,
                        asiento: asiento,
                        creacion: creacion,
                        finalizacion: finalizacion,
                        creado: creado,


                    }

                    partidasInternalIdArray.push(resultJson);
                });

                log.debug('partidasInternalIdArray', partidasInternalIdArray);
                let line = 0;
                for (let index = 0; index < partidasInternalIdArray.length; index++) {
                    const result = partidasInternalIdArray[index];
                    let textasiento = '<a href="' + url.resolveRecord({
                        recordType: 'journalentry',
                        recordId: result.asiento
                    }) + '">' + result.asientotext + '</a>';
                    resultSubList.setSublistValue('custpage_sublist_id', line, result.internalid);
                    resultSubList.setSublistValue('custpage_sublist_estado', line, result.estado);
                    resultSubList.setSublistValue('custpage_sublist_usuario', line, result.usuario);
                    resultSubList.setSublistValue('custpage_sublist_asiento', line, textasiento);
                    resultSubList.setSublistValue('custpage_sublist_creacion', line, result.creacion);
                    resultSubList.setSublistValue('custpage_sublist_finalizacion', line, result.finalizacion);
                    resultSubList.setSublistValue('custpage_sublist_creado', line, result.creado);
                    resultSubList.setSublistValue('custpage_sublist_errores', line, result.err);

                    line++;

                }

            }
        }


        setSelectedValueFilter = (fieldId, value, targetSearch) => {
            if (!(value != this.CONSTANT.EMPTY_SELECT_VALUE && value)) return;
            let filter = this.createFilter(fieldId, search.Operator.ANYOF, value);
            targetSearch.filters.push(filter);
        }

        createFilter = (name, operator, values, join = null) => {
            let json = { name, operator, values, join };
            log.error("filters", json);
            return search.createFilter({
                join,
                name,
                operator,
                values
            });
        }

        addResetButton = () => {
            this.FORM.addResetButton();
        }

        setClientScript = (clientScriptName) => {
            if (!this.FORM) return;
            log.error("setClientScript", clientScriptName);
            this.FORM.clientScriptModulePath = clientScriptName;
        }
    }

    roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
    }

    return {
        UserInterface
    }
})