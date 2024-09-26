/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/record', 'N/render', 'N/file', 'N/search', 'SuiteScripts/IntegracionesHunter/Plantillas/Libreria'],

    function (record, render, file, search, libreria) {

        //ftl
        const TEMPLATE_PDF = "SuiteScripts/IntegracionesHunter/Plantillas/StandardTemplates/HU_EC_FTL_ORDEN_TRABAJO.ftl";

        const onRequest = (context) => {
            try {
                if (context.request.method == 'GET') {
                    var jsonTemplate = {};
                    var { type, id } = context.request.parameters;
                    jsonTemplate = getDataForTemplate(type, id);

                    renderPDF(type, id, jsonTemplate, context);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }

        const getDataForTemplate = (type, id) => {
            try {
                let result = {};

                let recordRecepcion = record.load({ type: type, id: id });
                let ordenServicioId = recordRecepcion.getValue({fieldId: 'transaction'})

                let recordOrdenServ = ordenServicioId ? record.load({ type: 'salesorder', id: ordenServicioId }) : ''
                if(recordOrdenServ){

                    let eventData = getEventActivity(ordenServicioId)
                    result.fechaRecepcion = eventData[0]
                    result.horaRecepcion = eventData[1]
                    result.recepcion = getEmployeeInfo(eventData[2])[0] ?? ''
                    result.location = recordOrdenServ.getText({fieldId: 'location'})
                    result.clientId = getClientInfo(recordOrdenServ.getValue({fieldId: 'entity'}))[0]
                    result.clientName = libreria.EscapeXml(getClientInfo(recordOrdenServ.getValue({fieldId: 'entity'}))[1])
                    result.telefono = getClientInfo(recordOrdenServ.getValue({fieldId: 'entity'}))[2]
                    result.celular = getClientInfo(recordOrdenServ.getValue({fieldId: 'entity'}))[3]
                    let isPerson = getClientInfo(recordOrdenServ.getValue({fieldId: 'entity'}))[4]
                    result.companyName = isPerson ? '' : libreria.EscapeXml(getClientInfo(recordOrdenServ.getValue({fieldId: 'entity'}))[5])

                    let vehidcleID = recordOrdenServ.getValue({fieldId: 'custbody_ht_so_bien'})
                    let vehicleLoad = record.load({ type: "customrecord_ht_record_bienes", id: vehidcleID });
                    result.placa = vehicleLoad.getText({fieldId: 'custrecord_ht_bien_placa'})
                    result.color = vehicleLoad.getText({fieldId: 'custrecord_ht_bien_colorcarseg'})
                    result.chasis = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_chasis'}))
                    result.motor = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_motor'}))
                    result.marca = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_marca'}))
                    result.modelo = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_modelo'}))
                    result.version = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_tipo'}))
                   
                    result.codVehiculo = vehicleLoad.getText({fieldId: 'name'})
                    result.tranid = recordOrdenServ.getText({fieldId: 'tranid'})

                    result.novComercial = libreria.EscapeXml(recordOrdenServ.getText({fieldId: 'memo'}) ?? '')
                    result.novTecnica = libreria.EscapeXml(recordOrdenServ.getText({fieldId: 'custbody_ht_os_consideracion'}) ?? '')

                    result.date = recordOrdenServ.getText({fieldId: 'trandate'}) ?? ''
                    result.trabajosData = getOT(ordenServicioId)

                    let lojackData =  []
                    let monitoreoData = []
                    let vehicleData = getVehicleDevices(vehidcleID)
                    vehicleData.forEach(data => {
                        if(Object.keys(data).length != 0 &&  Object.keys(data).length < 5) lojackData.push(data)
                        else if(Object.keys(data).length >= 5) monitoreoData.push(data)
                    })
                    result.lojackData = lojackData
                    result.monitoreoData = monitoreoData

                    }
                return result;

            } catch (error) {
                log.error('error-getDataForTemplate', error);
            }
        }

        const getEmployeeInfo = (id) => {
            try{
                var searchUserName = search.lookupFields({
                    type: "employee",
                    id: id,
                    columns: [
                        'email',
                        'altname'                        
                    ]
                });
                let email = searchUserName.email
                let user = email?.substring(0,email.indexOf("@")) ?? ''
                let name = searchUserName.altname                
                return [user,name]
            }catch (error) {
                log.error('error-getEmployeeInfo', error);
            }            
        }

        const getEventActivity = (id) => {
            try{
                let activitySearchObj = search.create({
                    type: "activity",
                    filters:
                    [
                       ["type","anyof","Event"], // Las Recepciones son de tipo Event
                       "AND", 
                       ["transaction.internalid","anyof", id]
                    ],
                    columns:
                    [
                       search.createColumn({name: "startdate", label: "Fecha"}),
                       search.createColumn({name: "starttime", label: "Tiempo"}),
                       search.createColumn({name: "assigned", label: "Asignado a"}),
                    ]
                 });
                 let eventData = []
                 activitySearchObj.run().each( result => {
                     eventData = []
                     eventData.push(result.getValue({name: "startdate"}))
                     eventData.push(result.getValue({name: "starttime"}))
                     eventData.push(result.getValue({name: "assigned"}))
                     return true // Continua a la siguiente iteración
                 })
    
                 return eventData   
            }catch (error) {
                log.error('error-getEventActivity', error);
            }                    
        }

        const getClientInfo = (id) => {
            try{
                var searchClientInfo = search.lookupFields({
                    type: "customer",
                    id: id,
                    columns: [
                        'vatregnumber',
                        'altname',
                        'phone',
                        'mobilephone',
                        'homephone',
                        'isperson',
                        'companyname'
                    ]
                });
                let clientId = searchClientInfo.vatregnumber
                let clientName = searchClientInfo.altname
                let phone = searchClientInfo.phone ? searchClientInfo.phone : searchClientInfo.homephone
                let mobilephone = searchClientInfo.mobilephone
                let isPerson = searchClientInfo.isperson
                let companyName = searchClientInfo.companyname
                return [clientId, clientName, phone, mobilephone, isPerson, companyName]
            }catch (error) {
                log.error('error-getClientInfo', error);
            }            
        }

        const getVehicleDevices = (idVehiculo) => {
            let devicesData = []
            try{
                let ht_co_coberturaSearchObj = search.create({
                    type: "customrecord_ht_co_cobertura",
                    filters:
                    [
                        ["custrecord_ht_co_bien","anyof",idVehiculo], // ID del bien (vehículo)
                        "AND",
                        ["custrecord_ht_co_estado","anyof","1"] // Solo los Instalados
                    ],
                    columns:
                    [
                        "custrecord_ht_co_numeroserieproducto",

                        "custrecord_ht_co_seriedispolojack",
                        "custrecord_ht_co_codigoactivacion",
                        "custrecord_ht_co_codigorespuesta",

                        "custrecord_ht_co_numerodispositivo",
                        "custrecord_ht_co_unidad",
                        "custrecord_ht_co_imei",
                        "custrecord_ht_co_modelodispositivo",
                        "custrecord_ht_co_celularsimcard",
                        "custrecord_ht_co_ip",
                        "custrecord_ht_co_apn",
                        "custrecord_ht_co_vid",
                        "custrecord_ht_co_servidor",
                        "custrecord_ht_co_firmware",
                        "custrecord_ht_co_script"
                    ]
                 });
                 
                 ht_co_coberturaSearchObj.run().each( result => {
                    let tempObj = {}
                    let deviceID = result.getValue({name: "custrecord_ht_co_numeroserieproducto"}) ?? ''
                    let ubicacionDispositivo = ''
                    if(deviceID){
                        var searchDeviceLocation = search.lookupFields({
                            type: "customrecord_ht_record_mantchaser",
                            id: deviceID,
                            columns: [
                                'custrecord_ht_mc_ubicacion'
                            ]
                        });
                        ubicacionDispositivo = searchDeviceLocation.custrecord_ht_mc_ubicacion ?? ''
                    }

                    let serieLojack = result.getValue({name: "custrecord_ht_co_seriedispolojack"}) ?? ''
                    let serieChaser = result.getValue({name: "custrecord_ht_co_numerodispositivo"}) ?? ''
                    if(deviceID && serieLojack){
                        tempObj.serieLojack = serieLojack
                        tempObj.activacion = result.getValue({name: "custrecord_ht_co_codigoactivacion"}) ?? ''
                        tempObj.respuesta = result.getValue({name: "custrecord_ht_co_codigorespuesta"}) ?? ''
                        tempObj.ubicacionDispositivo = ubicacionDispositivo
                    } else if (deviceID && serieChaser){
                        tempObj.serieChaser = serieChaser
                        tempObj.unidad = libreria.EscapeXml(result.getValue({name: "custrecord_ht_co_unidad"}) ?? '')
                        tempObj.imei = result.getValue({name: "custrecord_ht_co_imei"}) ?? ''
                        tempObj.modelo = libreria.EscapeXml(result.getValue({name: "custrecord_ht_co_modelodispositivo"}) ?? '')
                        tempObj.sim = result.getValue({name: "custrecord_ht_co_celularsimcard"}) ?? ''
                        tempObj.ip = result.getValue({name: "custrecord_ht_co_ip"}) ?? ''
                        tempObj.apn = libreria.EscapeXml(result.getValue({name: "custrecord_ht_co_apn"}) ?? '')
                        tempObj.vid = result.getValue({name: "custrecord_ht_co_vid"}) ?? ''
                        tempObj.servidor = libreria.EscapeXml(result.getValue({name: "custrecord_ht_co_servidor"}) ?? '')
                        tempObj.firmware = result.getValue({name: "custrecord_ht_co_firmware"}) ?? ''
                        tempObj.script = result.getValue({name: "custrecord_ht_co_script"}) ?? ''
                        tempObj.ubicacionDispositivo = ubicacionDispositivo
                    }
                    devicesData.push(tempObj)
                    return true // Continua a la siguiente iteración
                 })
    
                 return devicesData   
            }catch (error) {
                log.error('error-getVehicleDevices', error);
                return devicesData 
            }                    
        }

        const getOT = (idOS) => {
            try{
                let ordenTrabajoSearchObj = search.create({
                    type: "customrecord_ht_record_ordentrabajo",
                    filters:
                    [
                        ["custrecord_ht_ot_orden_servicio","anyof",idOS]
                    ],
                    columns:
                    [
                        "name",
                        "custrecord_ht_ot_itemrelacionado"
                    ]
                 });
                 let otData = []
                 ordenTrabajoSearchObj.run().each( result => {
                    let tempObj = {}

                    tempObj.otNro = result.getValue({name: "name"}) ?? ''

                    let itemTrabajoID = result.getValue({name: "custrecord_ht_ot_itemrelacionado"}) ?? ''
                    var searchItem = search.lookupFields({
                        type: "item",
                        id: itemTrabajoID,
                        columns: [
                            'displayname'
                        ]
                    });
                    tempObj.trabajo = searchItem.displayname ?? ''

                    otData.push(tempObj)
                    return true // Continua a la siguiente iteración
                 })
    
                 return otData   
            }catch (error) {
                log.error('error-getOT', error);
            }                    
        }
        
        const renderPDF = (type, id, json, context) => {
            var fileContents = file.load({ id: TEMPLATE_PDF }).getContents();

            var renderer = render.create();
            renderer.templateContent = fileContents;

            renderer.addRecord({
                templateName: 'record',
                record: record.load({
                    type: type,
                    id: id
                })
            });

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: json
            });

            result = renderer.renderAsString();
            context.response.renderPdf(result);
        }

        return {
            onRequest
        };
    });