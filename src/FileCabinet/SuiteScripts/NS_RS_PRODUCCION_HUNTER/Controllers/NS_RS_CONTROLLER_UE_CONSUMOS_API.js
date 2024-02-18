/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 *@returns {string}
 *
 *Este script se encarga de consumir los servicios API
 *V_1.0.0
**/
define(['N/query', 'N/https', 'N/log', 'N/search', 'N/record', 'N/email'], function (query, https, log, search, record, email) {

    /**********FUNCIONES POST**********/
    function updateVehiculoPlataforma(id) {
        try {

            log.debug({ title: 'id', details: id })

            var resultado

            //consumir busqueda guardada por columnas
            var savedSearch = search.load({
                id: 'customsearch_data_actualiza_bien_platafo'
            });

            log.debug({ title: 'savedSearch', details: savedSearch })



        } catch (error) {
            resultado = { error: error };
            //log.error('Error en beforeSubmit', error);
        }

        return resultado;

    }

    /**********************************/

    function _get(context) {

    }


    //funcion para enviar alertas por correo con el modulo de netsuite
    function sendAlertEmail(data) {
        try {
            // Extraer datos del cuerpo de la solicitud (debe estar en formato JSON)
            var requestData = JSON.parse(data);

            // Datos para el correo electrónico
            var recipients = requestData.recipients; // Un arreglo de direcciones de correo
            var subject = requestData.subject;
            var body = requestData.body;

            // Crear y enviar el correo electrónico
            var emailOptions = {
                author: -5, // ID del remitente (-5 generalmente representa el usuario actual)
                recipients: recipients,
                subject: subject,
                body: body
            };

            email.send(emailOptions);

            // Registrar la alerta o evento en algún lugar, si es necesario
            // Por ejemplo, podrías crear un registro personalizado para llevar un registro de las alertas

            // Devolver una respuesta indicando que el correo se envió con éxito
            return { success: true, message: 'Correo de alerta enviado con éxito' };
        } catch (e) {
            // Capturar cualquier error y devolver una respuesta de error
            return { success: false, message: 'Error al enviar el correo de alerta: ' + e.message };
        }
    }


    function guardarLog(data) {

        try {
            var customRecord = record.create({
                type: 'customrecord_ht_datos_log_consumo_apis',
                isDynamic: true,
            });

            customRecord.setValue({ fieldId: 'name', value: 'SEGUIMIENTO_GENESYS' });
            customRecord.setValue({ fieldId: 'custrecord_ht_anio', value: data.custrecord_ht_anio });
            customRecord.setValue({ fieldId: 'custrecord_ht_api', value: data.custrecord_ht_api });
            customRecord.setValue({ fieldId: 'custrecord_ht_categoria', value: data.custrecord_ht_categoria });
            customRecord.setValue({ fieldId: 'custrecord_ht_chasis', value: data.custrecord_ht_chasis });
            customRecord.setValue({ fieldId: 'custrecord_ht_cliente_orden', value: data.custrecord_ht_cliente_orden });
            customRecord.setValue({ fieldId: 'custrecord_ht_cliente_propietario', value: data.custrecord_ht_cliente_propietario });
            customRecord.setValue({ fieldId: 'custrecord_ht_codigo_vehiculo', value: data.custrecord_ht_codigo_vehiculo });
            customRecord.setValue({ fieldId: 'custrecord_ht_color', value: data.custrecord_ht_color });
            customRecord.setValue({ fieldId: 'custrecord_ht_correos', value: data.custrecord_ht_correos });
            customRecord.setValue({ fieldId: 'custrecord_ht_empresa', value: data.custrecord_ht_empresa });
            customRecord.setValue({ fieldId: 'custrecord_ht_estado', value: data.custrecord_ht_estado });
            customRecord.setValue({ fieldId: 'custrecord_ht_fecha', value: data.custrecord_ht_fecha });
            customRecord.setValue({ fieldId: 'custrecord_ht_fecha_fin', value: data.custrecord_ht_fecha_fin });
            customRecord.setValue({ fieldId: 'custrecord_ht_fecha_ingreso', value: data.custrecord_ht_fecha_ingreso });
            customRecord.setValue({ fieldId: 'custrecord_ht_fecha_inicio', value: data.custrecord_ht_fecha_inicio });
            customRecord.setValue({ fieldId: 'custrecord_ht_fecha_modificacion', value: data.custrecord_ht_fecha_modificacion });
            customRecord.setValue({ fieldId: 'custrecord_ht_financiera', value: data.custrecord_ht_financiera });
            customRecord.setValue({ fieldId: 'custrecord_ht_item', value: data.custrecord_ht_item });
            customRecord.setValue({ fieldId: 'custrecord_ht_marca', value: data.custrecord_ht_marca });
            customRecord.setValue({ fieldId: 'custrecord_ht_modelo', value: data.custrecord_ht_modelo });
            customRecord.setValue({ fieldId: 'custrecord_ht_motor', value: data.custrecord_ht_motor });
            customRecord.setValue({ fieldId: 'custrecord_ht_numero_os', value: data.custrecord_ht_numero_os });
            customRecord.setValue({ fieldId: 'custrecord_ht_numero_ot', value: data.custrecord_ht_numero_ot });
            customRecord.setValue({ fieldId: 'custrecord_ht_origen', value: data.custrecord_ht_origen });
            customRecord.setValue({ fieldId: 'custrecord_ht_placa', value: data.custrecord_ht_placa });
            customRecord.setValue({ fieldId: 'custrecord_ht_producto', value: data.custrecord_ht_producto });
            customRecord.setValue({ fieldId: 'custrecord_ht_propietario', value: data.custrecord_ht_propietario });
            customRecord.setValue({ fieldId: 'custrecord_ht_resultado', value: data.custrecord_ht_resultado });
            customRecord.setValue({ fieldId: 'custrecord_ht_sub_categoria', value: data.custrecord_ht_sub_categoria });
            customRecord.setValue({ fieldId: 'custrecord_ht_telefonos', value: data.custrecord_ht_telefonos });
            customRecord.setValue({ fieldId: 'custrecord_ht_tipo_registro', value: data.custrecord_ht_tipo_registro });
            customRecord.setValue({ fieldId: 'custrecord_ht_tipo_vehiculo', value: data.custrecord_ht_tipo_vehiculo });
            customRecord.setValue({ fieldId: 'custrecord_ht_usuario', value: data.custrecord_ht_usuario });
            customRecord.setValue({ fieldId: 'custrecord_ht_usuario_ingreso', value: data.custrecord_ht_usuario_ingreso });
            customRecord.setValue({ fieldId: 'custrecord_ht_usuario_modificacion', value: data.custrecord_ht_usuario_modificacion });
            customRecord.setValue({ fieldId: 'custrecord_ht_vid', value: data.custrecord_ht_vid });

            // Save the record
            var recordId = customRecord.save();

            log.debug('Record Created', 'Record ID: ' + recordId);

            //validar si se inserto
            if (recordId) {
                return {
                    success: true,
                    message: 'Record created successfully',
                    recordId: recordId
                };
            } else {
                return {
                    success: false,
                    message: 'Error creating record'
                };
            }

        } catch (e) {
            log.error('Error Creating Record', e.message);
            return {
                success: false,
                message: 'Error catch creating record: ' + e.message
            };
        }

    }

    function obtenerFechaActual() {
        const fecha = new Date();

        const dia = fecha.getDate().toString().padStart(2, '0'); // Obtén el día y asegúrate de que tenga 2 dígitos
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // El mes se indexa desde 0, así que agrega 1
        const año = fecha.getFullYear();

        const fechaFormateada = `${año}/${mes}/${dia}`;
        return fechaFormateada;
    }

    function _post(context) {
        try {
            var resultadoServicio
            var valor = context.valor;
            var usuario = context.usuario;
            var tipoOperacion = context.tipoOperacion;

            if (tipoOperacion == 'updateVehiculoPlataforma') {

                function getSearchResults(codigoVehiculo) {
                    // Cargar la búsqueda guardada
                    var savedSearch = search.load({
                        id: 'customsearch_data_actualiza_bien_platafo'
                    });

                    var searchResults = savedSearch.run();

                    var resultsArray = [];

                    searchResults.each(function (result) {
                        var resultObject = {};

                        // Acceder a los valores por el campo "label"
                        result.columns.forEach(function (column) {
                            var label = column.label;
                            var value = result.getValue(column);

                            resultObject[label] = value;
                        });

                        if (resultObject['codvehiculo'] === codigoVehiculo) {
                            resultsArray.push(resultObject);
                        }

                        return true;
                    });

                    return resultsArray;
                }

                var res_getSearchResults = getSearchResults(valor);

                log.debug({ title: 'Search Results', details: res_getSearchResults });

                function createJSONObjects(searchResults) {
                    var jsonObjects = {
                        "PX": [],
                        "AMI": []
                    };

                    // Recorrer los resultados de la búsqueda
                    searchResults.forEach(function (result) {

                        var pxObject = {
                            "plataforma": "PX",
                            "cliente": result['cliente'],
                            "username": result['username'],
                            "amicliente": result['amicliente'],
                            "codvehiculo": result['codvehiculo'],
                            "vehiculoid": result['codvehiculo'],
                            "amivehiculo": result['amivehiculo'],
                            "descripcionvehiculo": 'PLC. ' + result['placa'] + ' MOT. ' + result['motor'] + ' CHA. ' + result['chasis'],
                            "tipovehiculo": result['tipovehiculo'],
                            "tipo": result['tipo'],
                            "placa": result['placa'],
                            "idmarca": result['idmarca'],
                            "marca": result['marca'],
                            "idmodelo": result['idmodelo'],
                            "modelo": result['modelo'],
                            "chasis": result['chasis'],
                            "motor": result['motor'],
                            "color": result['color'],
                            "anio": result['anio'],
                            "idconcesionario": result['idconcesionario'],
                            "concesionariodesc": result['concesionariodesc'],
                            "concesionariodire": result['concesionariodire'],
                            "idfinanciera": result['idfinanciera'],
                            "financieradesc": result['financieradesc'],
                            "financieradire": result['financieradire'],
                            "idaseguradora": result['idaseguradora'],
                            "aseguradoradesc": result['aseguradoradesc'],
                            "aseguradoradire": result['aseguradoradire']
                        };

                        var amiObject = {
                            "plataforma": "AMI",
                            "cliente": result['cliente'],
                            "username": result['username'],
                            "amicliente": result['amicliente'],
                            "codvehiculo": result['codvehiculo'],
                            "vehiculoid": result['codvehiculo'],
                            "amivehiculo": result['amivehiculo'],
                            "descripcionvehiculo": 'PLC. ' + result['placa'] + ' MOT. ' + result['motor'] + ' CHA. ' + result['chasis'],
                            "tipovehiculo": result['tipovehiculo'],
                            "tipo": result['tipo'],
                            "placa": result['placa'],
                            "idmarca": result['idmarca'],
                            "marca": result['marca'],
                            "idmodelo": result['idmodelo'],
                            "modelo": result['modelo'],
                            "chasis": result['chasis'],
                            "motor": result['motor'],
                            "color": result['color'],
                            "anio": result['anio'],
                            "idconcesionario": result['idconcesionario'],
                            "concesionariodesc": result['concesionariodesc'],
                            "concesionariodire": result['concesionariodire'],
                            "idfinanciera": result['idfinanciera'],
                            "financieradesc": result['financieradesc'],
                            "financieradire": result['financieradire'],
                            "idaseguradora": result['idaseguradora'],
                            "aseguradoradesc": result['aseguradoradesc'],
                            "aseguradoradire": result['aseguradoradire']
                        };

                        // Agregar objetos a los arreglos respectivos
                        jsonObjects['PX'].push(pxObject);
                        jsonObjects['AMI'].push(amiObject);
                    });

                    return jsonObjects;
                }

                // Llamar a la función para crear los objetos JSON
                var jsonObjects = createJSONObjects(res_getSearchResults);

                // Imprimir o utilizar los objetos JSON según sea necesario
                log.debug({ title: 'PX JSON', details: jsonObjects['PX'][0] });
                log.debug({ title: 'AMI JSON', details: jsonObjects['AMI'][0] });

                //consumir api de login desde netsuite con usuario y contraseña de https://www.hunteronline.com.ec:443/ApiNetsuite/Login
                var urltoken = 'https://www.hunteronline.com.ec:443/ApiNetsuite/Login';
                var headersToken = {
                    'Content-Type': 'application/json'
                };

                var bodyToken = {
                    "usuarioAPI": "WSNETSUITE",
                    "passAPI": "N!sEt%9"
                }

                var response = https.post({
                    url: urltoken,
                    headers: headersToken,
                    body: JSON.stringify(bodyToken)
                });

                var respuestaToken = JSON.parse(response.body);

                if (response.status === 200 || 201) {

                    //consumit el api de actualizacion para las dos plataformas
                    var urlActualizaBien = 'https://www.hunteronline.com.ec/ApiNetsuite/bien'

                    var headersActualizaBien = {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain',
                        'Authorization': 'Bearer ' + respuestaToken.token
                    };

                    //enviar el json sin corchetes
                    var responseActualizaBienPX = https.post({
                        url: urlActualizaBien,
                        headers: headersActualizaBien,
                        body: JSON.stringify(jsonObjects['PX'][0])
                    });

                    var responseActualizaBienAMI = https.post({
                        url: urlActualizaBien,
                        headers: headersActualizaBien,
                        body: JSON.stringify(jsonObjects['AMI'][0])
                    });

                    //unir los resultados de las dos plataformas considerando el valor status y el mensaje
                    var respuestaActualizaBienPX = JSON.parse(responseActualizaBienPX.body);
                    var respuestaActualizaBienAMI = JSON.parse(responseActualizaBienAMI.body);

                    var statusPX
                    var statusAMI

                    if (respuestaActualizaBienPX.status == "200") {
                        statusPX = "200"
                    } else {
                        statusPX = "500"

                    }

                    if (respuestaActualizaBienAMI.status == "200") {
                        statusAMI = "200"
                    } else {
                        statusAMI = "500"

                    }

                    var respuestaActualizaBien = {
                        "statusPX": statusPX,
                        "statusAMI": statusAMI
                    }

                    log.debug({ title: 'resActualizaBienPX', details: respuestaActualizaBienPX })
                    log.debug({ title: 'resActualizaBienAMI', details: respuestaActualizaBienAMI })

                    var fechaActual = obtenerFechaActual();

                    //armar JSON para guardar en log
                    var jsonLogAMI = {
                        "custrecord_ht_anio": jsonObjects['AMI'][0].anio,
                        "custrecord_ht_api": "https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1175&deploy=1",
                        "custrecord_ht_categoria": "ACTUALIZA_PLATAFORMA_AMI",
                        "custrecord_ht_chasis": jsonObjects['AMI'][0].chasis,
                        "custrecord_ht_cliente_orden": jsonObjects['AMI'][0].cliente,
                        "custrecord_ht_cliente_propietario": jsonObjects['AMI'][0].cliente,
                        "custrecord_ht_codigo_vehiculo": jsonObjects['AMI'][0].codvehiculo,
                        "custrecord_ht_color": jsonObjects['AMI'][0].color,
                        "custrecord_ht_financiera": jsonObjects['AMI'][0].financieradesc,
                        "custrecord_ht_marca": jsonObjects['AMI'][0].marca,
                        "custrecord_ht_modelo": jsonObjects['AMI'][0].modelo,
                        "custrecord_ht_motor": jsonObjects['AMI'][0].motor,
                        "custrecord_ht_origen": "NETSUITE",
                        "custrecord_ht_placa": jsonObjects['AMI'][0].placa,
                        "custrecord_ht_propietario": jsonObjects['AMI'][0].cliente,
                        "custrecord_ht_resultado": respuestaActualizaBienAMI,
                        "custrecord_ht_sub_categoria": jsonObjects['AMI'][0].tipo,
                        "custrecord_ht_tipo_registro": "ACTUALIZACION",
                        "custrecord_ht_tipo_vehiculo": jsonObjects['AMI'][0].tipovehiculo,
                        "custrecord_ht_vid": jsonObjects['AMI'][0].codvehiculo,
                        "custrecord_ht_datos_enviados": JSON.stringify(responseActualizaBienAMI.body),
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario
                    }

                    var jsonLogPX = {
                        "custrecord_ht_anio": jsonObjects['PX'][0].anio,
                        "custrecord_ht_api": "https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=1175&deploy=1",
                        "custrecord_ht_categoria": "ACTUALIZA_PLATAFORMA_PX",
                        "custrecord_ht_chasis": jsonObjects['PX'][0].chasis,
                        "custrecord_ht_cliente_orden": jsonObjects['PX'][0].cliente,
                        "custrecord_ht_cliente_propietario": jsonObjects['PX'][0].cliente,
                        "custrecord_ht_codigo_vehiculo": jsonObjects['PX'][0].codvehiculo,
                        "custrecord_ht_color": jsonObjects['PX'][0].color,
                        "custrecord_ht_financiera": jsonObjects['PX'][0].financieradesc,
                        "custrecord_ht_marca": jsonObjects['PX'][0].marca,
                        "custrecord_ht_modelo": jsonObjects['PX'][0].modelo,
                        "custrecord_ht_motor": jsonObjects['PX'][0].motor,
                        "custrecord_ht_origen": "NETSUITE",
                        "custrecord_ht_placa": jsonObjects['PX'][0].placa,
                        "custrecord_ht_propietario": jsonObjects['PX'][0].cliente,
                        "custrecord_ht_resultado": respuestaActualizaBienPX,
                        "custrecord_ht_sub_categoria": jsonObjects['PX'][0].tipo,
                        "custrecord_ht_tipo_registro": "ACTUALIZACION",
                        "custrecord_ht_tipo_vehiculo": jsonObjects['PX'][0].tipovehiculo,
                        "custrecord_ht_vid": jsonObjects['PX'][0].codvehiculo,
                        "custrecord_ht_datos_enviados": JSON.stringify(responseActualizaBienPX.body),
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario
                    }

                    //guardar en log
                    var resGuardarLogAMI = guardarLog(jsonLogAMI);
                    var resGuardarLogPX = guardarLog(jsonLogPX);

                    //log.debug({ title: 'resGuardarLogAMI', details: resGuardarLogAMI })
                    //log.debug({ title: 'resGuardarLogPX', details: resGuardarLogPX })


                    resultadoServicio = respuestaActualizaBien

                } else {

                    resultadoServicio = respuestaToken

                    //registrar log de error
                    var jsonLogError = {
                        "custrecord_ht_api": "updateVehiculoPlataforma",
                        "custrecord_ht_categoria": "ERROR_TOKEN",
                        "custrecord_ht_resultado": respuestaToken,
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario
                    }

                    var resGuardarLogError = guardarLog(jsonLogError);

                    log.debug({ title: 'resGuardarLogError', details: resGuardarLogError })

                }


            }

            if (tipoOperacion == 'updateClientePlataforma') {

                function getSearchResults(codCliente) {

                    var jsonObjects = {
                        "PX": [],
                        "AMI": []
                    };
                    // Cargar la búsqueda guardada
                    var savedSearch = search.load({
                        id: 'customsearchdata_actualiza_cliente_plata'
                    });

                    var searchResults = savedSearch.run();

                    var resultsArray = [];

                    searchResults.each(function (result) {
                        var resultObject = {};

                        // Acceder a los valores por el campo "label"
                        result.columns.forEach(function (column) {
                            var label = column.label;
                            var value = result.getValue(column);

                            resultObject[label] = value;
                        });

                        if (resultObject['id_cliente'] === codCliente) {
                            resultsArray.push(resultObject);

                            //log.debug({ title: 'resultObject', details: resultObject })
                        }

                        return true;
                    });

                    //armar el json para consumir el servicio
                    var pxObject = {
                        "id_cliente": resultsArray[0].id_cliente.split('-').slice(2).join('-'),
                        "primer_nombre": resultsArray[0].primer_nombre,
                        "segundo_nombre": resultsArray[0].segundo_nombre,
                        "apellido_paterno": resultsArray[0].apellido_paterno,
                        "apellido_materno": resultsArray[0].apellido_materno,
                        "direccion": resultsArray[0].direccion.replace(/\n/g, ' '),
                        //filtrar el resultado y traer el valor del telefono convencional con codigo 10 
                        "telefono_convencional": (resultsArray.find(function (item) { return item.tipo_telefono == '10' }) || {}).telefono || "",
                        //filtrar el resultado y traer el valor del telefono convencional con codigo 4
                        "telefono_celular": (resultsArray.find(function (item) { return item.tipo_telefono == '4' }) || {}).telefono || "",
                        "email": resultsArray[0].email,
                        "id_usuario": usuario,
                        "plataforma": "PX",
                        "email_ami": "",
                        "ami_tipodocumento": "",
                        "amicliente": "",
                        "ami_company": "0991259546001",
                        "ami_support": "soporteami@carsegsa.com",
                        "ami_telefono": "0985454544",
                        "ami_celular": "046004640"
                    }

                    var amiObject = {
                        "id_cliente": resultsArray[0].id_cliente.split('-').slice(2).join('-'),
                        "primer_nombre": resultsArray[0].primer_nombre,
                        "segundo_nombre": resultsArray[0].segundo_nombre,
                        "apellido_paterno": resultsArray[0].apellido_paterno,
                        "apellido_materno": resultsArray[0].apellido_materno,
                        "direccion": resultsArray[0].direccion.replace(/\n/g, ' '),
                        "telefono_convencional": (resultsArray.find(function (item) { return item.tipo_telefono == '10' }) || {}).telefono || "",
                        "telefono_celular": (resultsArray.find(function (item) { return item.tipo_telefono == '4' }) || {}).telefono || "",
                        "email": resultsArray[0].email,
                        "id_usuario": usuario,
                        "plataforma": "AMI",
                        "email_ami": (resultsArray.find(function (item) { return item.tipo_correo == '2' }) || {}).email || "",
                        "ami_tipodocumento": resultsArray[0].ami_tipodocumento,
                        "amicliente": resultsArray[0].amicliente,
                        "ami_company": "0991259546001",
                        "ami_support": "soporteami@carsegsa.com",
                        "ami_telefono": "0985454544",
                        "ami_celular": "046004640"
                    }

                    jsonObjects['PX'].push(pxObject);
                    jsonObjects['AMI'].push(amiObject);

                    return jsonObjects;
                }

                var res_getSearchResults = getSearchResults(valor);

                log.debug({ title: 'Search Results', details: res_getSearchResults });

                //consumir api de login desde netsuite con usuario y contraseña de https://www.hunteronline.com.ec:443/ApiNetsuite/Login
                var urltoken = 'https://www.hunteronline.com.ec:443/ApiNetsuite/Login';
                var headersToken = {
                    'Content-Type': 'application/json'
                };

                var bodyToken = {
                    "usuarioAPI": "WSNETSUITE",
                    "passAPI": "N!sEt%9"
                }

                var response = https.post({
                    url: urltoken,
                    headers: headersToken,
                    body: JSON.stringify(bodyToken)
                });

                var respuestaToken = JSON.parse(response.body);

                if (response.status === 200 || 201) {

                    var urlActualizaBien = 'https://www.hunteronline.com.ec/ApiNetsuite/cliente'

                    var headersActualizaBien = {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain',
                        'Authorization': 'Bearer ' + respuestaToken.token
                    };

                    //enviar el json sin corchetes
                    var responseActualizaClientePX = https.post({
                        url: urlActualizaBien,
                        headers: headersActualizaBien,
                        body: JSON.stringify(res_getSearchResults['PX'][0])
                    });

                    var responseActualizaClienteAMI = https.post({
                        url: urlActualizaBien,
                        headers: headersActualizaBien,
                        body: JSON.stringify(res_getSearchResults['AMI'][0])
                    });

                    var respuestaActualizaBienPX = JSON.parse(responseActualizaClientePX.body);
                    var respuestaActualizaBienAMI = JSON.parse(responseActualizaClienteAMI.body);

                    var statusPX
                    var statusAMI

                    if (respuestaActualizaBienPX.status == "200") {
                        statusPX = "200"
                    } else {
                        statusPX = "500"

                        //enviar alerta
                        var subject = 'Error al actualizar cliente en plataforma PX'
                        var body = respuestaActualizaBienPX.message
                        var recipients = ['bleon@hunter.com.pe']

                        var emailOptions = {
                            recipients: recipients,
                            subject: subject,
                            body: body
                        }

                        var emailDataJSON = JSON.stringify(emailOptions);
                        //var resSendEmail = sendAlertEmail(emailDataJSON);

                        //log.debug({ title: 'resSendEmail', details: resSendEmail })

                    }

                    if (respuestaActualizaBienAMI.status == "200") {
                        statusAMI = "200"
                    } else {
                        statusAMI = "500"

                        //enviar alerta
                        var subject = 'Error al actualizar cliente en plataforma PX'
                        var body = respuestaActualizaBienPX.message
                        var recipients = ['bleon@hunter.com.pe']

                        var emailOptions = {
                            recipients: recipients,
                            subject: subject,
                            body: body
                        }

                        var emailDataJSON = JSON.stringify(emailOptions);
                        //var resSendEmail = sendAlertEmail(emailDataJSON);

                        //log.debug({ title: 'resSendEmail', details: resSendEmail })
                    }

                    var respuestaActualizaBien = {
                        "statusPX": statusPX,
                        "statusAMI": statusAMI
                    }

                    log.debug({ title: 'responseActualizaClientePX', details: responseActualizaClientePX })
                    log.debug({ title: 'responseActualizaClienteAMI', details: responseActualizaClienteAMI })

                    var fechaActual = obtenerFechaActual();

                    //armar JSON para guardar en log

                    var jsonLogAMI = {
                        "custrecord_ht_api": "updateClientePlataforma",
                        "custrecord_ht_categoria": "ACTUALIZA_PLATAFORMA_AMI",
                        "custrecord_ht_resultado": respuestaActualizaBienAMI,
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario,
                        "custrecord_ht_datos_enviados": JSON.stringify(responseActualizaClienteAMI.body)
                    }

                    var jsonLogPX = {
                        "custrecord_ht_api": "updateClientePlataforma",
                        "custrecord_ht_categoria": "ACTUALIZA_PLATAFORMA_PX",
                        "custrecord_ht_resultado": respuestaActualizaBienPX,
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario,
                        "custrecord_ht_datos_enviados": JSON.stringify(responseActualizaClientePX.body)
                    }

                    //guardar en log
                    var resGuardarLogAMI = guardarLog(jsonLogAMI);
                    var resGuardarLogPX = guardarLog(jsonLogPX);

                    //log.debug({ title: 'resGuardarLogAMI', details: resGuardarLogAMI })
                    resultadoServicio = respuestaActualizaBien

                } else {

                    resultadoServicio = respuestaToken

                    //registrar log de error
                    var jsonLogError = {
                        "custrecord_ht_api": "updateClientePlataforma",
                        "custrecord_ht_categoria": "ERROR_TOKEN",
                        "custrecord_ht_resultado": respuestaToken,
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario
                    }

                    var resGuardarLogError = guardarLog(jsonLogError);

                    log.debug({ title: 'resGuardarLogError', details: resGuardarLogError })
                }

            }

            if (tipoOperacion == 'updateEstadoPlataforma') {

                function getSearchResults(serieDispositivo) {

                    var jsonObjects = {
                        "PX": [],
                        "AMI": []
                    };

                    // funcion para retornar la descripcion y el codigo de la familia
                    function getFamiliaProducto(codinterno) {

                        var familiaProducto = {
                            "descripcionfamilia": "",
                            "codigofamilia": ""
                        }

                        var savedSearch = search.load({
                            id: 'customsearch_data_familia_producto'
                        });

                        var searchResults = savedSearch.run();

                        searchResults.each(function (result) {
                            var resultObject = {};

                            // Acceder a los valores por el campo "label"
                            result.columns.forEach(function (column) {
                                var label = column.label;
                                var value = result.getValue(column);

                                resultObject[label] = value;
                            });

                            if (resultObject['codinterno'] === codinterno) {
                                familiaProducto.descripcionfamilia = resultObject['descripcionfamilia']
                                familiaProducto.codigofamilia = resultObject['codigofamilia']
                            }

                            return true;
                        });

                        return familiaProducto

                    }

                    // funcion para retornar los datos segun la seriedispositivo en el chaser
                    function getDataDispositivo(seriedispositivo) {

                        var dataChaser = {
                            "idmarcadispositivo": "",
                            "marcadispositivo": "",
                            "idmodelodispositivo": "",
                            "modelodispositivo": "",
                            "serieSim": "",
                            "direccionMacSim": ""
                        }

                        var savedSearch = search.load({
                            id: 'customsearch_data_dispositivo_chaser'
                        });

                        var searchResults = savedSearch.run();

                        //var resultsArray = [];

                        searchResults.each(function (result) {
                            var resultObject = {};

                            // Acceder a los valores por el campo "label"
                            result.columns.forEach(function (column) {
                                var label = column.label;
                                var value = result.getValue(column);

                                resultObject[label] = value;
                            });

                            if (resultObject['seriedispositivo'] === seriedispositivo) {
                                //resultsArray.push(resultObject);

                                log.debug({ title: 'resultObject', details: resultObject })

                                dataChaser.idmarcadispositivo = resultObject['idMarcaDispositivo']
                                dataChaser.marcadispositivo = resultObject['marcaDispositivo']
                                dataChaser.idmodelodispositivo = resultObject['idModeloDispositivo']
                                dataChaser.modelodispositivo = resultObject['modeloDispositivo']
                                dataChaser.serieSim = resultObject['serieSim']
                                dataChaser.direccionMacSim = resultObject['direccionMacSim']
                            }

                            return true;
                        });

                        return dataChaser

                    }

                    var getDataDispositivoresult = getDataDispositivo(valor);

                    log.debug({ title: 'getDataDispositivoresult', details: getDataDispositivoresult })

                    // Cargar la búsqueda guardada
                    var savedSearch = search.load({
                        id: 'customsearch_data_actualiza_estado_plata'
                    });

                    var searchResults = savedSearch.run();

                    var resultsArray = [];

                    searchResults.each(function (result) {
                        var resultObject = {};

                        // Acceder a los valores por el campo "label"
                        result.columns.forEach(function (column) {
                            var label = column.label;
                            var value = result.getValue(column);

                            resultObject[label] = value;
                        });

                        if (resultObject['serieDispositivo'] === serieDispositivo) {
                            resultsArray.push(resultObject);
                        }

                        return true;
                    });

                    //armar el json para consumir el servicio
                    var pxObject = {
                        "plataforma": "PX",
                        "codVehiculo": resultsArray[0].codVehiculo,
                        "idVehiculo": resultsArray[0].codVehiculo,
                        "placaVehiculo": resultsArray[0].placaVehiculo,
                        "idMarcaVehiculo": resultsArray[0].idMarcaVehiculo,
                        "marcaVehiculo": resultsArray[0].marcaVehiculo,
                        "idModeloVehiculo": resultsArray[0].idModeloVehiculo,
                        "modeloVehiculo": resultsArray[0].modeloVehiculo,
                        "chasisVehiculo": resultsArray[0].chasisVehiculo,
                        "motorVehiculo": resultsArray[0].motorVehiculo,
                        "colorVehiculo": resultsArray[0].colorVehiculo,
                        "anioVehiculo": resultsArray[0].anioVehiculo,
                        "tipoVehiculo": resultsArray[0].tipoVehiculo,
                        "idfamiliaProdructo": getFamiliaProducto(resultsArray[0].familiaProducto).codigofamilia,
                        "familiaProdructo": getFamiliaProducto(resultsArray[0].familiaProducto).descripcionfamilia,
                        "idmarcaDispositivo": getDataDispositivoresult.idmarcadispositivo || "",
                        "marcaDispositivo": getDataDispositivoresult.marcadispositivo || "",
                        "idmodeloDispositivo": getDataDispositivoresult.idmodelodispositivo || "",
                        "modeloDispositivo": getDataDispositivoresult.modelodispositivo || "",
                        "serieDispositivo": resultsArray[0].seriedispositivo,
                        "vidDispositivo": resultsArray[0].vidDispositivo,
                        "imeiDispositivo": resultsArray[0].imeiDispositivo,
                        "direccionMacSim": resultsArray[0].direccionMacSim,
                        "serieSim": getDataDispositivoresult.serieSim || "",
                        "numeroCelularSim": resultsArray[0].numeroCelularSim,
                        "operadoraSim": resultsArray[0].operadoraSim,
                        "estadoFamiliaProducto": getFamiliaProducto(resultsArray[0].familiaProducto).estadoFamiliaProducto,
                        "nemonicoUsuario": "TEST"
                    }

                    var amiObject = {
                        "plataforma": "AMI",
                        "codVehiculo": resultsArray[0].codVehiculo,
                        "idVehiculo": resultsArray[0].codVehiculo,
                        "placaVehiculo": resultsArray[0].placaVehiculo,
                        "idMarcaVehiculo": resultsArray[0].idMarcaVehiculo,
                        "marcaVehiculo": resultsArray[0].marcaVehiculo,
                        "idModeloVehiculo": resultsArray[0].idModeloVehiculo,
                        "modeloVehiculo": resultsArray[0].modeloVehiculo,
                        "chasisVehiculo": resultsArray[0].chasisVehiculo,
                        "motorVehiculo": resultsArray[0].motorVehiculo,
                        "colorVehiculo": resultsArray[0].colorVehiculo,
                        "anioVehiculo": resultsArray[0].anioVehiculo,
                        "tipoVehiculo": resultsArray[0].tipoVehiculo,
                        "idfamiliaProdructo": getFamiliaProducto(resultsArray[0].familiaProducto).codigofamilia,
                        "familiaProdructo": getFamiliaProducto(resultsArray[0].familiaProducto).descripcionfamilia,
                        "idmarcaDispositivo": getDataDispositivoresult.idmarcadispositivo || "",
                        "marcaDispositivo": getDataDispositivoresult.marcadispositivo || "",
                        "idmodeloDispositivo": getDataDispositivoresult.idmodelodispositivo || "",
                        "modeloDispositivo": getDataDispositivoresult.modelodispositivo || "",
                        "serieDispositivo": resultsArray[0].seriedispositivo,
                        "vidDispositivo": resultsArray[0].vidDispositivo,
                        "imeiDispositivo": resultsArray[0].imeiDispositivo,
                        "direccionMacSim": resultsArray[0].direccionMacSim,
                        "serieSim": getDataDispositivoresult.serieSim || "",
                        "numeroCelularSim": resultsArray[0].numeroCelularSim,
                        "operadoraSim": resultsArray[0].operadoraSim,
                        "estadoFamiliaProducto": getFamiliaProducto(resultsArray[0].familiaProducto).estadoFamiliaProducto,
                        "nemonicoUsuario": "TEST"
                    }

                    jsonObjects['PX'].push(pxObject);
                    jsonObjects['AMI'].push(amiObject);

                    return jsonObjects;

                }

                var res_getSearchResults = getSearchResults(valor);

                log.debug({ title: 'Search Results', details: res_getSearchResults });

                //consumir api de login desde netsuite con usuario y contraseña de https://www.hunteronline.com.ec:443/ApiNetsuite/Login
                var urltoken = 'https://www.hunteronline.com.ec:443/ApiNetsuite/Login';
                var headersToken = {
                    'Content-Type': 'application/json'
                };

                var bodyToken = {
                    "usuarioAPI": "WSNETSUITE",
                    "passAPI": "N!sEt%9"
                }

                var response = https.post({
                    url: urltoken,
                    headers: headersToken,
                    body: JSON.stringify(bodyToken)
                });

                var respuestaToken = JSON.parse(response.body);

                if (response.status === 200 || 201) {

                    var urlActualizaEstado = 'https://www.hunteronline.com.ec/ApiNetsuite/estado'

                    var headersActualizaEstado = {
                        'Content-Type': 'application/json',
                        'accept': 'text/plain',
                        'Authorization': 'Bearer ' + respuestaToken.token
                    };

                    //enviar el json sin corchetes
                    var responseActualizaEstadoPX = https.post({
                        url: urlActualizaEstado,
                        headers: headersActualizaEstado,
                        body: JSON.stringify(res_getSearchResults['PX'][0])
                    });

                    var responseActualizaEstadoAMI = https.post({
                        url: urlActualizaEstado,
                        headers: headersActualizaEstado,
                        body: JSON.stringify(res_getSearchResults['AMI'][0])
                    });

                    var respuestaActualizaEstadoPX = JSON.parse(responseActualizaEstadoPX.body);
                    var respuestaActualizaEstadoAMI = JSON.parse(responseActualizaEstadoAMI.body);

                    var statusPX
                    var statusAMI

                    if (respuestaActualizaEstadoPX.status == "200") {
                        statusPX = "200"
                    } else {
                        statusPX = "500"
                    }

                    if (respuestaActualizaEstadoAMI.status == "200") {
                        statusAMI = "200"
                    } else {
                        statusAMI = "500"
                    }

                    var respuestaActualizaEstado = {
                        "statusPX": statusPX,
                        "statusAMI": statusAMI
                    }

                    log.debug({ title: 'responseActualizaEstadoPX', details: responseActualizaEstadoPX })
                    log.debug({ title: 'responseActualizaEstadoAMI', details: responseActualizaEstadoAMI })

                    var fechaActual = obtenerFechaActual();

                    //armar JSON para guardar en log

                    var jsonLogAMI = {
                        "custrecord_ht_api": "updateEstadoPlataforma",
                        "custrecord_ht_categoria": "ACTUALIZA_PLATAFORMA_AMI",
                        "custrecord_ht_resultado": respuestaActualizaEstadoAMI,
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario,
                        "custrecord_ht_datos_enviados": JSON.stringify(responseActualizaEstadoAMI.body)
                    }

                    var jsonLogPX = {
                        "custrecord_ht_api": "updateEstadoPlataforma",
                        "custrecord_ht_categoria": "ACTUALIZA_PLATAFORMA_PX",
                        "custrecord_ht_resultado": respuestaActualizaEstadoPX,
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario,
                        "custrecord_ht_datos_enviados": JSON.stringify(responseActualizaEstadoPX.body)
                    }

                    //guardar en log
                    var resGuardarLogAMI = guardarLog(jsonLogAMI);
                    var resGuardarLogPX = guardarLog(jsonLogPX);

                    //log.debug({ title: 'resGuardarLogAMI', details: resGuardarLogAMI })
                    resultadoServicio = respuestaActualizaEstado


                } else {

                    resultadoServicio = respuestaToken

                    //registrar log de error
                    var jsonLogError = {
                        "custrecord_ht_api": "updateEstadoPlataforma",
                        "custrecord_ht_categoria": "ERROR_TOKEN",
                        "custrecord_ht_resultado": respuestaToken,
                        "custrecord_ht_fecha": new Date(fechaActual),
                        "custrecord_ht_fecha_ingreso": new Date(fechaActual),
                        "custrecord_ht_fecha_inicio": new Date(fechaActual),
                        "custrecord_ht_usuario_ingreso": usuario
                    }

                    var resGuardarLogError = guardarLog(jsonLogError);

                    log.debug({ title: 'resGuardarLogError', details: resGuardarLogError })

                }


            }

            if (tipoOperacion == 'test') {

                //probar el envio de correo
                var subject = 'Test de envio de correo'
                var body = 'Test de envio de correo'
                var recipients = ['bleon@hunter.com.pe']

                var emailOptions = {
                    recipients: recipients,
                    subject: subject,
                    body: body
                }

                log.debug({ title: 'emailOptions', details: emailOptions })

                var emailDataJSON = JSON.stringify(emailOptions);

                var resSendEmail = sendAlertEmail(emailDataJSON);

                log.debug({ title: 'resSendEmail', details: resSendEmail })

            }



            log.debug({ title: 'resultadoServicio', details: resultadoServicio })

            return resultadoServicio

        } catch (error) {
            log.error('Error en xd', error);
        }
    }

    function _put(context) {

    }

    function _delete(context) {

    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});
