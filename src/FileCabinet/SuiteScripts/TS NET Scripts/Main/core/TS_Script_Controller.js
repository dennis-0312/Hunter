/**
 * @NApiVersion 2.1
 */
define(['N/log',
    'N/search',

    'N/record',
   
    './TS_ScriptPlataformas_controller'
],
    (log, search, record, _Controller) => {

        let arr = [];
        return ({
            envioPXAdminClient: (json) => {
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';

                let output = url.resolveScript({
                    scriptId: 'customscript_ns_rs_px_services',
                    deploymentId: 'customdeploy_ns_rs_px_services',
                });
                console.log('output', output);

                let myRestletResponse = https.post({
                    url: output,
                    body: json,
                    headers: myRestletHeaders
                });

                let response = myRestletResponse.body;
                return response;
            },

            envioTelematicCambioFecha: (json) => {
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';

                let output = url.resolveScript({
                    scriptId: 'customscript_ns_rs_update_asset',
                    deploymentId: 'customdeploy_ns_rs_update_asset',
                });

                let myRestletResponse = https.post({
                    url: output,
                    body: json,
                    headers: myRestletHeaders
                });

                let response = myRestletResponse.body;
                return response;
            },

            envioTelematicCambioPropietario: (json) => {
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';

                let output = url.resolveScript({
                    scriptId: 'customscript_ns_rs_new_owner',
                    deploymentId: 'customdeploy_ns_rs_new_owner',
                });

                let myRestletResponse = https.post({
                    url: output,
                    body: json,
                    headers: myRestletHeaders
                });

                let response = myRestletResponse.body;
                return response;
            },

            envioPXAdmin: (json) => {
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';

                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(json),
                    deploymentId: 'customdeploy_ns_rs_px_services',
                    scriptId: 'customscript_ns_rs_px_services',
                    headers: myRestletHeaders,
                });
                let response = myRestletResponse.body;
                return response;
            },

            envioTelematic: (json) => {
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';

                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(json),
                    deploymentId: 'customdeploy_ns_rs_update_device',
                    scriptId: 'customscript_ns_rs_update_device',
                    headers: myRestletHeaders,
                });
                let response = myRestletResponse.body;
                return response;
            },
            parametrizacion: (items) => {

                var busqueda = search.create({
                    type: "customrecord_ht_pp_main_param_prod",
                    filters:
                        [

                            search.createFilter({
                                name: 'custrecord_ht_pp_aplicacion',
                                operator: search.Operator.IS,
                                values: true
                            }), search.createFilter({
                                name: 'custrecord_ht_pp_parametrizacionid',
                                operator: search.Operator.ANYOF,
                                values: items
                            })
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_rela", label: "Param" }),
                            search.createColumn({ name: "custrecord_ht_pp_parametrizacion_valor", label: "Valor" })
                        ]
                });
                var pageData = busqueda.runPaged({
                    pageSize: 1000
                });

                pageData.pageRanges.forEach(function (pageRange) {
                    page = pageData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
                        var columns = result.columns;
                        var parametrizacion = new Array();

                        if (result.getValue(columns[0]) != null) {
                            parametrizacion[0] = result.getValue(columns[0]);
                        } else {
                            parametrizacion[0] = '';
                        }
                        if (result.getValue(columns[1]) != null) {
                            parametrizacion[1] = result.getValue(columns[1]);
                        } else {
                            parametrizacion[1] = '';
                        }
                        arr.push(parametrizacion);
                    });
                });
                return arr;
            },
            parametros: (parametro, id, type = null) => {
                
                let title;
                switch (parametro) {
                    case '5':
                        switch (type) {
                            case 'ORDEN_TRABAJO':

                                title = _Controller.envioPXAdminInstall(id);
                                break;
                            case 10:

                                title = 'entroo';
                                break;
                            default:
                                log.debug('accionEstadoOT');
                        }
                        break;
                    case '34':
                        //const plFunctions = plugin.loadImplementation({ type: 'customscript_ts_pl_functions' });
                        //title = plFunctions.plGenerateOT(id);
                        break;
                    default:
                        log.debug('accionEstadoOT');
                }
                return title;

            }

        });
    });