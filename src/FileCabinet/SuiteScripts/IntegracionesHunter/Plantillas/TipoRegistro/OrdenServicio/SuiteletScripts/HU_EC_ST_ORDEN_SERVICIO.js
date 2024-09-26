/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/record', 'N/render', 'N/file', 'N/search', 'SuiteScripts/IntegracionesHunter/Plantillas/Libreria'],

    function (record, render, file, search, libreria) {

        const onRequest = (context) => {
            try {
                if (context.request.method == 'GET') {
                    var jsonTemplate = {};
                    var { type, id, ftl } = context.request.parameters;
                    if(ftl == 1){
                        jsonTemplate = getDataForTemplateActa(type, id);
                        var TEMPLATE_PDF = "SuiteScripts/IntegracionesHunter/Plantillas/StandardTemplates/HU_EC_FTL_ACTA_RECEPCION.ftl";
                    }else if(ftl == 2){
                        jsonTemplate = getDataForTemplateOS(type, id)
                        var TEMPLATE_PDF = "SuiteScripts/IntegracionesHunter/Plantillas/StandardTemplates/HU_EC_FTL_ORDEN_SERVICIO.ftl";                        
                    }

                    renderPDF(type, id, jsonTemplate, context, TEMPLATE_PDF);
                }
            } catch (e) {
                log.error("Error", "[ onRequest ] " + e);
            }
        }

        const getDataForTemplateActa = (type, id) => {
            try {
                let result = {};
                let recordLoad = record.load({ type: type, id: id });
                let eventData = getEventActivity(id)
                
                result.fechaRecepcion = eventData[0]
                result.horaRecepcion = eventData[1]
                result.recepcion = getEmployeeInfo(eventData[2])[0] ?? ''

                result.tranid = recordLoad.getText({fieldId: 'tranid'})
                result.location = recordLoad.getText({fieldId: 'location'})
                result.clientId = getClientInfo(recordLoad.getValue({fieldId: 'entity'}))[0]
                result.clientName = libreria.EscapeXml(getClientInfo(recordLoad.getValue({fieldId: 'entity'}))[1])
                result.telefono = getClientInfo(recordLoad.getValue({fieldId: 'entity'}))[2]
                result.celular = getClientInfo(recordLoad.getValue({fieldId: 'entity'}))[3]

                let vehidcleID = recordLoad.getValue({fieldId: 'custbody_ht_so_bien'})
                let vehicleLoad = record.load({ type: "customrecord_ht_record_bienes", id: vehidcleID });
                result.codVehiculo = vehicleLoad.getText({fieldId: 'name'})
                result.placa = vehicleLoad.getText({fieldId: 'custrecord_ht_bien_placa'})
                result.motor = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_motor'}))
                result.chasis = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_chasis'}))
                result.marca = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_marca'}))
                result.modelo = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_modelo'}))
                result.version = libreria.EscapeXml(vehicleLoad.getText({fieldId: 'custrecord_ht_bien_tipo'}))
                result.color = vehicleLoad.getText({fieldId: 'custrecord_ht_bien_colorcarseg'})

                let descriptionLines = []
                let linesCount = recordLoad.getLineCount('item')
                for( let i=0 ; i<linesCount; i++){ 
                    descriptionLines.push(recordLoad.getSublistText('item','description',i))
                }
                result.trabajosList = descriptionLines
                
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
                        'homephone'
                    ]
                });
                let clientId = searchClientInfo.vatregnumber
                let clientName = searchClientInfo.altname
                let phone = searchClientInfo.phone ? searchClientInfo.phone : searchClientInfo.homephone
                let mobilephone = searchClientInfo.mobilephone
                return [clientId, clientName, phone, mobilephone]
            }catch (error) {
                log.error('error-getClientInfo', error);
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
                       //search.createColumn({name: "custevent_ht_turno_taller", label: "Taller"})
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

        const getDataForTemplateOS = (type, id) => {
            try {
                let result = {};
                let recordLoad = record.load({ type: type, id: id });                

                result.tranid = recordLoad.getText({fieldId: 'tranid'}) ?? ''
                result.trandate = recordLoad.getText({fieldId: 'trandate'}) ?? ''

                let clien = recordLoad.getValue({fieldId: 'entity'})
                result.clientId = clien ? getClientInfo(clien)[0] : ''
                result.clientName = clien ? libreria.EscapeXml(getClientInfo(clien)[1]) : ''
                let empServ = recordLoad.getValue({fieldId: 'custbody_ht_os_ejecutiva_backoffice'})
                result.employeeServUser = empServ ? getEmployeeInfo(empServ)[0] : ''
                result.employeeServName = empServ ? libreria.EscapeXml(getEmployeeInfo(empServ)[1]) : ''
                let empRef = recordLoad.getValue({fieldId: 'custbody_ht_os_ejecutivareferencia'})
                result.employeeRefUser = empRef ? getEmployeeInfo(empRef)[0] : ''
                result.employeeRefName = empRef ? libreria.EscapeXml(getEmployeeInfo(empRef)[1]) : ''

                result.aproVenta = recordLoad.getText({fieldId: 'custbody_ht_os_aprobacionventa'}) ?? ''
                result.vehiculo = libreria.EscapeXml(recordLoad.getText({fieldId: 'custbody_ht_so_bien'})) ?? ''
                
                result.aseguradora = libreria.EscapeXml(recordLoad.getText({fieldId: 'custbody_ht_os_companiaseguros'})) ?? ''
                result.concesionario = libreria.EscapeXml(recordLoad.getText({fieldId: 'custbody_ht_os_concesionario'})) ?? ''
                result.financiera = libreria.EscapeXml(recordLoad.getText({fieldId: 'custbody_ht_os_bancofinanciera'})) ?? ''
                result.vendCanalDist = libreria.EscapeXml(recordLoad.getText({fieldId: 'custbody_ht_os_vendcanaldistribucion'})) ?? ''

                result.facturaId = getClientInfo(recordLoad.getValue({fieldId: 'custbody_ht_facturar_a'}))[0] ?? ''
                result.facturaName = libreria.EscapeXml(getClientInfo(recordLoad.getValue({fieldId: 'custbody_ht_facturar_a'}))[1]) ?? ''

                result.estado = recordLoad.getText({fieldId: 'status'}) ?? ''
                result.location = recordLoad.getText({fieldId: 'location'}) ?? ''
                result.memo = recordLoad.getText({fieldId: 'memo'}) ?? ''

                let dataCreate = getCreateUser(id)
                result.createdDate = dataCreate[1] ? dataCreate[1]: ''
                result.userCreatedBy = dataCreate.length ? getEmployeeInfo(dataCreate[0])[0] : ''

                let itemsLines = []
                let linesCount = recordLoad.getLineCount('item')
                let [descTotal, subTotal, iva, total] = [0, 0, 0, 0]
                for( let i=0 ; i<linesCount; i++){
                    let importeLinea =  recordLoad.getSublistValue('item','rate',i) ?? ''
                    let importeLineaText = recordLoad.getSublistText('item','rate',i) ?? ''
                    let subTotalLinea = recordLoad.getSublistValue('item','amount',i) ?? ''
                    let ivaLinea = recordLoad.getSublistValue('item','tax1amt',i) ?? ''
                    let totalLinea = recordLoad.getSublistValue('item','grossamt',i) ?? ''
                    if(subTotalLinea < 0){
                        descTotal += subTotalLinea*(-1)                        
                    }
                    if(importeLineaText.includes('%')){
                        importeLinea = importeLineaText
                    }
                    if(totalLinea == ''){
                        totalLinea = (subTotalLinea || 0) + (ivaLinea || 0)
                    }
                    subTotal += subTotalLinea || 0     
                    iva += ivaLinea || 0
                    total += totalLinea || 0
                    let objTemp = {
                        sec: i+1,
                        item: recordLoad.getSublistText('item','item',i) ?? '',
                        importe: Number.isFinite(importeLinea) ? importeLinea.toFixed(2) : importeLinea,
                        cantidad: recordLoad.getSublistValue('item','quantity',i),
                        subTotal: Number.isFinite(subTotalLinea) ? subTotalLinea.toFixed(2) : subTotalLinea,
                        iva: Number.isFinite(ivaLinea) ? ivaLinea.toFixed(2) : ivaLinea,
                        total: Number.isFinite(totalLinea) ? totalLinea.toFixed(2) : totalLinea
                    }
                    itemsLines.push(objTemp)
                }
                result.itemsList = itemsLines
                result.descTotal = Number.isFinite(descTotal) ? descTotal.toFixed(2) : descTotal
                result.subTotal = Number.isFinite(subTotal) ? subTotal.toFixed(2) : subTotal
                result.iva = Number.isFinite(iva) ? iva.toFixed(2) : iva
                result.total = Number.isFinite(total) ? total.toFixed(2) : total

                let installmentList = getInstallment(id)
                let totalPagar = recordLoad.getText({fieldId: 'total'}) ?? ''

                result.cuotas = installmentList.length ? installmentList : [{num:'1', porcentaje:'100%',importe:totalPagar}]

                result.cuotaDescripcion = recordLoad.getText({fieldId: 'terms'}) ?? ''

                return result;

            } catch (error) {
                log.error('error-getDataForTemplateOS', error);
            }
        }

        const getCreateUser = (idTransaction) => {
            let systemnoteSearchObj = search.create({
                type: "systemnote",
                filters:
                [
                    ["type","is","T"],
                   "AND", 
                   ["recordid","equalto",idTransaction]
                ],
                columns:
                [                   
                   "name",
                   "date"
                ]
             });
             userData = []
             systemnoteSearchObj.run().each( result => {
                userData.push(result.getValue({name: "name"}))
                userData.push(result.getValue({name: "date"}))
                return false // Solo una iteración
            })
            return userData
        }

        const getInstallment = (id) => {
            let installmentData = []
            try {

                var installmentSearchObj = search.create({
                    type: "transaction",
                    filters:
                    [
                       ["internalid","anyof",id]
                    ],
                    columns:
                    [
                       search.createColumn({ name: "amount", join: "installmentOnSalesOrder", label: "Importe" }),
                       search.createColumn({ name: "installmentnumber", join: "installmentOnSalesOrder", label: "Número de cuotas" }),
                       search.createColumn({ name: "percentage", join: "installmentOnSalesOrder", label: "Porcentaje" })
                    ]
                });       

                installmentSearchObj.run().each( result => {
                    installmentData.push(
                        {
                            num: result.getValue({name: "installmentnumber", join: "installmentOnSalesOrder"}),
                            porcentaje: result.getValue({name: "percentage", join: "installmentOnSalesOrder"}),
                            importe: result.getValue({name: "amount", join: "installmentOnSalesOrder"})
                        }
                    )
                    return true
                })

                installmentData?.sort((a,b) => (+a.num||0) - (+b.num||0))
                return installmentData
            } catch (error) {
                log.error('error-getInstallment', error);
                return installmentData
            }
        }

        const renderPDF = (type, id, json, context, template) => {
            var fileContents = file.load({ id: template }).getContents();

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