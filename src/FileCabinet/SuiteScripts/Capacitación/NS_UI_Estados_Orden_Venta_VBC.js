/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
 define(['N/ui/serverWidget', 'N/log', 'N/search','N/runtime'], (serverWidget, log, search, runtime) => {
    const onRequest = (scriptContext) => {
        try {
            if (scriptContext.request.method === 'GET') {
                let form = serverWidget.createForm({
                    title: 'Actualizar Estados Orden de Venta'
                });

                form.addField({
                    id: 'fecha_desde',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Desde'
                });

                form.addField({
                    id: 'fecha_hasta',
                    type: serverWidget.FieldType.DATE,
                    label: 'Fecha Hasta'
                });

                let listaov = form.addField({
                    id: 'listaordenventa',
                    type: serverWidget.FieldType.SELECT, //combo
                    label: 'Orden de Venta'
                });
                listaov.addSelectOption({
                    value: -1,
                    text: 'Seleccione...'
                });

                let sublist = form.addSublist({
                    id: 'sublist',
                    type: serverWidget.SublistType.LIST, //lista no editable
                    label: 'Lista Ordenes de Venta'
                });
                sublist.addRefreshButton(); //boton actualizar
                sublist.addMarkAllButtons(); // boton seleccionar todos
                
                //agrega checkbox, el orden en que se definen los campos afecta la visualizacion de formulario
                sublist.addField({
                    id: 'campocheckbox',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Confirmar'
                });

                sublist.addField({
                    id: 'campo1',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ID'
                });

                sublist.addField({
                    id: 'campo2',
                    type: serverWidget.FieldType.TEXT,
                    label: 'NUMERO DOCUMENTO'
                });

                sublist.addField({
                    id: 'campo3',
                    type: serverWidget.FieldType.TEXT,
                    label: 'CLIENTE'
                });

                sublist.addField({
                    id: 'campo4',
                    type: serverWidget.FieldType.TEXT,
                    label: 'FECHA'
                });

                sublist.addField({
                    id: 'campo5',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ESTADO OV'
                });

                sublist.addField({
                    id: 'campo6',
                    type: serverWidget.FieldType.TEXT,
                    label: 'ESTADO ACTIVIDAD'
                });


                let i = 0;
                let j = 0;
                let miBusqueda = search.load({ id: 'customsearch_estados_orden_venta' }); //busqueda guardada
                let cantidad_ov = miBusqueda.runPaged().count;
                
                miBusqueda.run().each(function (result) { //ciclo que recorre lo que devuelve busqueda //trae hasta 4 mil registros a la vez
                    /*
                    cuanto consume la consulta por registro
                    let liminte = runtime.getCurrentScript().getRemainingUpdate; //cuantos registros puedo traer por pagina
                    if (limite < 995){ //puntos de gobernancia//memoria
                        log.debug('Limite', 'Registros ' + j + 'de ' + cantidad_ov);
                        return false;
                    }
                    */

                    
                    let id = result.getValue(miBusqueda.columns[0]);
                    let numero_documento = result.getValue(miBusqueda.columns[1]);
                    let cliente = result.getValue(miBusqueda.columns[2]);
                    let fecha = result.getValue(miBusqueda.columns[3]);
                    let estadoov = result.getText(miBusqueda.columns[4]); //texto no valor
                    let estadoactividad = result.getValue(miBusqueda.columns[5]);

                    sublist.setSublistValue({ //cuando se carga una lista d una busqueda guardada
                        id: 'campo1', //id que se asigno en la creacion de la lista
                        line: i,
                        value: id
                    });

                    sublist.setSublistValue({
                        id: 'campo2',
                        line: i,
                        value: numero_documento
                    });

                    sublist.setSublistValue({
                        id: 'campo3',
                        line: i,
                        value: cliente
                    });

                    sublist.setSublistValue({
                        id: 'campo4',
                        line: i,
                        value: fecha
                    });

                    sublist.setSublistValue({
                        id: 'campo5',
                        line: i,
                        value: estadoov
                    });

                    sublist.setSublistValue({
                        id: 'campo6',
                        line: i,
                        value: estadoactividad
                    });
                    i++
                    return true; //fin de ciclo
                });

                form.addSubmitButton({
                    label: 'Enviar'
                });

                scriptContext.response.writePage(form); //siempre va al final del formulario
            } else {

            }
        } catch (error) {
            log.error('Error', error);
        }

    }

    return { onRequest }
});