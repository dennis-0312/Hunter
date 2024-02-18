/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
 define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/file'], function (serverWidget, search, redirect, file) {

    const SEARCH_ITEMS = 'customsearch_ts_busqueda_articulo';
    const PAGE_SIZE = 400;

    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {

                var form = serverWidget.createForm('Consulta de artículos');
                //form.clientScriptFileId = 81667;    // SANDBOX ---> SuiteScripts > TS NET Scripts > Consulta ArticuloS
                form.clientScriptFileId = 10516;  // PRODUCCIÓN ---> SuiteScripts > TS NET Scripts > Consulta ArticuloS
                form.addSubmitButton('Filtrar');
                form.addButton({ id: 'btn_cancelar', label: 'Limpiar Filtros', functionName: 'cancelar()' });

                /** PARÁMETROS */
                var pageId = parseInt(context.request.parameters.page);
                // var p_flag = context.request.parameters.flag;
                // if (p_flag == undefined) p_flag = 0;
                var p_isbn = context.request.parameters.isbn;
                if (p_isbn == undefined) p_isbn = '';
                var p_nombre = context.request.parameters.nombre;
                if (p_nombre == undefined) p_nombre = '';
                var p_autor = context.request.parameters.autor;
                if (p_autor == undefined) p_autor = '';
                var p_editorial = context.request.parameters.editorial;
                if (p_editorial == undefined) p_editorial = '';
                var p_categoria = context.request.parameters.categoria;
                if (p_categoria == undefined) p_categoria = '';
                var p_subcategoria = context.request.parameters.subcategoria;
                if (p_subcategoria == undefined) p_subcategoria = '';
                var p_ubicacion = context.request.parameters.ubicacion;
                if (p_ubicacion == undefined) p_ubicacion = '';
                var p_vendor = context.request.parameters.vendor;
                if (p_vendor == undefined) p_vendor = '';


                /** TAB */
                //form.addTab({ id: 'custpage_sample_tab1', label: 'Resultados' });
                form.addFieldGroup({ id: 'groupFilter', label: 'Filtros' });
                form.addFieldGroup({ id: 'groupPaginado', label: 'Paginado' });


                /** FILTROS */
                var f_isbn = form.addField({ id: 'custpage_isbn', type: 'text', label: 'ISBN', container: 'groupFilter' });
                f_isbn.defaultValue = p_isbn;
                var f_nombre = form.addField({ id: 'custpage_nombre', type: 'text', label: 'NOMBRE', container: 'groupFilter' });
                f_nombre.defaultValue = p_nombre;
                var f_autor = form.addField({ id: 'custpage_autor', type: 'text', label: 'AUTOR', container: 'groupFilter' });
                f_autor.defaultValue = p_autor;
                var f_editorial = form.addField({ id: 'custpage_editorial', type: 'text', label: 'EDITORIAL', container: 'groupFilter' });
                f_editorial.defaultValue = p_editorial;

                var f_categoria = form.addField({ id: 'custpage_categoria', type: 'select', label: 'CATEGORÍA', container: 'groupFilter' });
                f_categoria.addSelectOption({ value: '', text: 'Seleccione...' });
                var resultsCategorias = obtenerCategorias();
                resultsCategorias.run().each(function (result) {
                    var internalid = result.id;
                    var name = result.getValue(resultsCategorias.columns[1]);
                    f_categoria.addSelectOption({ value: internalid, text: name });
                    return true;
                });
                f_categoria.defaultValue = p_categoria;


                var f_subcategoria = form.addField({ id: 'custpage_subcategoria', type: 'select', label: 'SUB-CATEGORÍA', container: 'groupFilter' });
                f_subcategoria.addSelectOption({ value: '', text: 'Seleccione...' });
                var resultsSubcategorias = obtenerSubcategorias();
                resultsSubcategorias.run().each(function (result) {
                    var internalid = result.id;
                    var name = result.getValue(resultsSubcategorias.columns[1]);
                    f_subcategoria.addSelectOption({ value: internalid, text: name });
                    return true;
                });
                f_subcategoria.defaultValue = p_subcategoria;

                var f_ubicacion = form.addField({ id: 'custpage_ubicacion', type: 'select', label: 'UBICACIÓN', container: 'groupFilter' });
                f_ubicacion.addSelectOption({ value: '', text: 'Seleccione...' });
                var resultsUbicaciones = obtenerUbicaciones();
                resultsUbicaciones.run().each(function (result) {
                    var internalid = result.id;
                    var name = result.getValue(resultsUbicaciones.columns[1]);
                    f_ubicacion.addSelectOption({ value: internalid, text: name });
                    return true;
                });
                f_ubicacion.defaultValue = p_ubicacion;

                var f_vendor = form.addField({ id: 'custpage_vendor', type: 'select', label: 'PROVEEDOR', container: 'groupFilter' });
                f_vendor.addSelectOption({ value: '', text: 'Seleccione...' });
                var resultsVendors = obtenerProveedores();
                var pageVen = 0;
                var pagedVendor = resultsVendors.runPaged({
                    pageSize: 1000,
                });

                pagedVendor.pageRanges.forEach(function (pageRange){
                    pageVen = pagedVendor.fetch({
                        index: pageRange.index,
                    });
                    log.debug('pageVen',pageVen);

                    pageVen.data.forEach(function (result) {
                        var internalid = result.id;
                        var name = result.getValue(resultsVendors.columns[1]);
                        f_vendor.addSelectOption({ value: internalid, text: name });
                        return true
                    });
                });
                f_vendor.defaultValue = p_vendor;

                // CAMPO FLAG
                // var f_flag = form.addField({ id: 'custpage_flag', type: 'text', label: 'FLAG', container: 'groupFilter' });
                // f_flag.updateDisplayType({ displayType: serverWidget.FieldDisplayType.NORMAL });
                // f_flag.defaultValue = '0';


                /** RESULTADOS */
                var sublist1 = form.addSublist({ id: 'sublist1', type: serverWidget.SublistType.LIST, label: 'Resultados de la búsqueda' });
                sublist1.addField({ id: 'list1_isbn', type: serverWidget.FieldType.TEXT, label: 'ISBN' });
                sublist1.addField({ id: 'list1_vendor', type: serverWidget.FieldType.TEXT, label: 'PROVEEDOR' });
                sublist1.addField({ id: 'list1_nombre', type: serverWidget.FieldType.TEXT, label: 'NOMBRE' });
                sublist1.addField({ id: 'list1_autor', type: serverWidget.FieldType.TEXT, label: 'AUTOR' });
                sublist1.addField({ id: 'list1_editorial', type: serverWidget.FieldType.TEXT, label: 'EDITORIAL' });
                sublist1.addField({ id: 'list1_categoria', type: serverWidget.FieldType.TEXT, label: 'CATEGORÍA' });
                sublist1.addField({ id: 'list1_subcategoria', type: serverWidget.FieldType.TEXT, label: 'SUB-CATEGORÍA' });
                sublist1.addField({ id: 'list1_ubicacion', type: serverWidget.FieldType.TEXT, label: 'UBICACIÓN' });
                sublist1.addField({ id: 'list1_cant_disponible', type: serverWidget.FieldType.TEXT, label: 'CANTIDAD DISPONIBLE' });
                sublist1.addField({ id: 'list1_precio_base', type: serverWidget.FieldType.TEXT, label: 'PRECIO BASE' });
                //sublist1.addField({ id: 'list1_imagen', type: serverWidget.FieldType.TEXT, label: 'IMAGEN' });


                var searchLoad = obtenerArticulos(p_isbn, p_nombre, p_autor, p_editorial, p_categoria, p_subcategoria, p_ubicacion, p_vendor);
                //log.debug('searchLoad', searchLoad);


                //if (p_flag != 0) {
                /* ---------------------------- INICIO PAGINADO ---------------------------- */
                var retrieveSearch = searchLoad.runPaged({ pageSize: PAGE_SIZE });
                //log.debug('retrieveSearch', retrieveSearch.count);
                var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);
                //log.debug('pageCount', pageCount);


                // Set pageId to correct value if out of index
                if (!pageId || pageId == '' || pageId < 0)
                    pageId = 0;
                else if (pageId >= pageCount)
                    pageId = pageCount - 1;


                // Add drop-down and options to navigate to specific page
                var selectOptions = form.addField({ id: 'custpage_pageid', type: 'select', label: 'Página', container: 'groupPaginado' });

                for (i = 0; i < pageCount; i++) {
                    if (i == pageId) {
                        selectOptions.addSelectOption({
                            value: 'pageid_' + i,
                            text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
                            isSelected: true
                        });
                    } else {
                        selectOptions.addSelectOption({
                            value: 'pageid_' + i,
                            text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE)
                        });
                    }
                }
                /* ---------------------------- FIN PAGINADO ---------------------------- */


                if (retrieveSearch.count != 0) {

                    var searchPage = retrieveSearch.fetch({ index: pageId });
                    var i = 0;

                    searchPage.data.forEach(function (result) {
                        var column01 = result.getValue(searchLoad.columns[0]) || ' ';
                        var column02 = result.getValue(searchLoad.columns[1]) || ' ';
                        var column03 = result.getValue(searchLoad.columns[2]) || ' ';
                        var column04 = result.getValue(searchLoad.columns[3]) || ' ';
                        var column05 = result.getValue(searchLoad.columns[4]) || ' ';
                        var column06 = result.getText(searchLoad.columns[5]) || ' ';
                        var column07 = result.getText(searchLoad.columns[6]) || ' ';
                        var column15 = result.getText(searchLoad.columns[14]) || ' ';
                        var column16 = result.getValue(searchLoad.columns[15]) || '0';
                        var column17 = result.getValue(searchLoad.columns[16]) || '0.00';
                        var column19 = result.getText(searchLoad.columns[18]) || ' ';
                        //var column18 = result.getValue(searchLoad.columns[17]) || 'Sin imagen';
                        //if (column18 != 'Sin imagen') column18 = '<img src=' + ('https://6785603-sb1.app.netsuite.com' + getUrlImagen(column18)) + ' width="100" height="100">';
                        //log.debug('column18', column18);

                        sublist1.setSublistValue({ id: 'list1_isbn', line: i, value: column02 });
                        sublist1.setSublistValue({ id: 'list1_vendor', line: i, value: column19 });
                        sublist1.setSublistValue({ id: 'list1_nombre', line: i, value: column03 });
                        sublist1.setSublistValue({ id: 'list1_autor', line: i, value: column04 });
                        sublist1.setSublistValue({ id: 'list1_editorial', line: i, value: column05 });
                        sublist1.setSublistValue({ id: 'list1_categoria', line: i, value: column06 });
                        sublist1.setSublistValue({ id: 'list1_subcategoria', line: i, value: column07 });
                        sublist1.setSublistValue({ id: 'list1_ubicacion', line: i, value: column15 });
                        sublist1.setSublistValue({ id: 'list1_cant_disponible', line: i, value: column16 });
                        sublist1.setSublistValue({ id: 'list1_precio_base', line: i, value: column17 });
                        //sublist1.setSublistValue({ id: 'list1_imagen', line: i, value: column18 });
                        i++
                        return true
                    });
                }
                //}

                context.response.writePage(form);

            } else {

                //const get_flag = context.request.parameters.custpage_flag;
                const get_isbn = context.request.parameters.custpage_isbn;
                const get_nombre = context.request.parameters.custpage_nombre;
                const get_autor = context.request.parameters.custpage_autor;
                const get_editorial = context.request.parameters.custpage_editorial;
                const get_categoria = context.request.parameters.custpage_categoria;
                const get_subcategoria = context.request.parameters.custpage_subcategoria;
                const get_ubicacion = context.request.parameters.custpage_ubicacion;
                const get_vendor = context.request.parameters.custpage_vendor;
                const get_pageid = context.request.parameters.custpage_pageid;


                var my_parameters = {
                    //flag: 1,
                    isbn: get_isbn,
                    nombre: get_nombre,
                    autor: get_autor,
                    editorial: get_editorial,
                    categoria: get_categoria,
                    subcategoria: get_subcategoria,
                    ubicacion: get_ubicacion,
                    vendor: get_vendor,
                    page: get_pageid
                }

                // log.debug('get_isbn', get_isbn);
                // log.debug('get_nombre', get_nombre);
                // log.debug('get_autor', get_autor);
                // log.debug('get_editorial', get_editorial);
                // log.debug('get_categoria', get_categoria);
                // log.debug('get_subcategoria', get_subcategoria);
                // log.debug('get_pageid', get_pageid);


                redirect.toSuitelet({
                    scriptId: 'customscript_ts_ui_consulta_articulo',
                    deploymentId: 'customdeploy_ts_ui_consulta_articulo',
                    isExternal: true,
                    parameters: my_parameters
                });
            }

        } catch (e) {
            log.error('Error en onRequest', e);
        }

    }


    function obtenerCategorias() {
        try {
            var busqCategorias = search.create({
                type: "customrecordib_lista_categoria",
                filters: [["isinactive", "is", "F"]],
                columns: ['internalid', 'name']
            });
            return busqCategorias;

        } catch (e) {
            log.error('Error en obtenerCategorias', e);
        }
    }


    function obtenerSubcategorias() {
        try {
            var busqSubcategorias = search.create({
                type: "customrecordib_lista_subcategoria",
                filters: [["isinactive", "is", "F"]],
                columns: ['internalid', 'name']
            });
            return busqSubcategorias;

        } catch (e) {
            log.error('Error en obtenerSubcategorias', e);
        }
    }


    function obtenerUbicaciones() {
        try {
            var busqUbicaciones = search.create({
                type: "location",
                filters: [["isinactive", "is", "F"]],
                columns: ['internalid', 'name']
            });

            return busqUbicaciones;

        } catch (e) {
            log.error('Error en obtenerUbicaciones', e);
        }
    }


    function obtenerProveedores() {
        try {
            var busqProveedores = search.create({
                type: "vendor",
                filters: [["isinactive", "is", "F"]],
                columns: ['internalid', 'companyname']
            });

            return busqProveedores;

        } catch (e) {
            log.error('Error en obtenerProveedores', e);
        }
    }


    function getUrlImagen(_id_imagen) {
        try {

            var fileObj = file.load({ id: _id_imagen });
            return fileObj.url;

        } catch (e) {
            log.error('Error en getUrlImagen', e);
        }
    }


    function obtenerArticulos(_isbn, _nombre, _autor, _editorial, _categoria, _subcategoria, _ubicacion, _vendor) {
        try {

            var loadSearchItems = search.load({ id: SEARCH_ITEMS });

            if (_isbn) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'name',
                    operator: search.Operator.CONTAINS,
                    values: [_isbn]
                }));
            }
            if (_nombre) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'displayname',
                    operator: search.Operator.CONTAINS,
                    values: [_nombre]
                }));
            }
            if (_autor) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'custitem_ib_autor',
                    operator: search.Operator.CONTAINS,
                    values: [_autor]
                }));
            }
            if (_editorial) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'custitem_ib_editorial',
                    operator: search.Operator.CONTAINS,
                    values: [_editorial]
                }));
            }
            if (_categoria) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'custitemib_categoria',
                    operator: search.Operator.ANYOF,
                    values: [_categoria]
                }));
            }
            if (_subcategoria) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'custitemib_subcategoria',
                    operator: search.Operator.ANYOF,
                    values: [_subcategoria]
                }));
            }
            if (_ubicacion) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'inventorylocation',
                    operator: search.Operator.ANYOF,
                    values: [_ubicacion]
                }));
            }
            if (_vendor) {
                loadSearchItems.filters.push(search.createFilter({
                    name: 'othervendor',
                    operator: search.Operator.ANYOF,
                    values: [_vendor]
                }));
            }

            return loadSearchItems;

        } catch (e) {
            log.error('Error en obtenerArticulos', e);
        }

    }

    return {
        onRequest: onRequest
    }
});