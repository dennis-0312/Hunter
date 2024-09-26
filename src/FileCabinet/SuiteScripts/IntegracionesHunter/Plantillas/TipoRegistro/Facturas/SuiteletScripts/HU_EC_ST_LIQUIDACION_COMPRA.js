/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
*/
define(['N/record', 'N/render', 'N/file', 'N/search', 'SuiteScripts/IntegracionesHunter/Plantillas/Libreria'],

    function (record, render, file, search, libreria) {

        //ftl
        const TEMPLATE_PDF = "SuiteScripts/IntegracionesHunter/Plantillas/StandardTemplates/HU_EC_PLANTILLA_FACTURA_PROVEEDORES.ftl";

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
                var result = {};
                
                var recordData = extractRecord(type, id);
                var glImpactData = libreria.ExtraerImpactoGL(type, id);

                result.listGL = glImpactData;

                result.entity = libreria.EscapeXml(recordData.entity);
                result.tranid = recordData.tranid;
                result.transactionnumber = recordData.transactionnumber;
                result.memo = libreria.EscapeXml(recordData.memo);
                result.location = recordData.location;
                result.trandate = recordData.trandate;
                result.custbodyts_ec_tipo_documento_fiscal = recordData.custbodyts_ec_tipo_documento_fiscal.slice(0, 17).toUpperCase();
                result.postingperiod = recordData.postingperiod;
                result.total = recordData.total;

                result.preCode = recordData.custbody_ec_serie_cxc_retencion;
                result.postCode = recordData.custbody_ts_ec_preimpreso_retencion;

                if(recordData.vendorId){
                    var searchVendorInfo = search.lookupFields({
                        type: "vendor",
                        id: recordData.vendorId,
                        columns: [
                            'vatregnumber',
                            'billaddress',
                            'altname'
                        ]
                    });
                    result.vatregnumber = searchVendorInfo.vatregnumber;
                    var posicion = searchVendorInfo.billaddress.indexOf(searchVendorInfo.altname);
                    if (posicion !== -1) {
                        var textoDespues = searchVendorInfo.billaddress.substring(posicion + searchVendorInfo.altname.length + 1);
                        result.billaddress = libreria.EscapeXml(textoDespues.replace("Ecuador","").trim());
                    }else{
                        result.billaddress = libreria.EscapeXml(searchVendorInfo.billaddress.replace("Ecuador","").trim());
                    }
                }

                var retIrList = []
                var retIrTotal = 0;
                if(recordData.ret1){
                    retIrTotal += Number(recordData.ret1montRet);
                    retIrList = [...retIrList, {
                        ret : extraerCodigoRetencion(recordData.ret1),
                        retBase : recordData.ret1base,
                        retPorcen : recordData.ret1porcen,
                        retMontRet : recordData.ret1montRet
                    }]
                }
                if(recordData.ret2){
                    retIrTotal += Number(recordData.ret2montRet);
                    retIrList = [...retIrList, {
                        ret : extraerCodigoRetencion(recordData.ret2),
                        retBase : recordData.ret2base,
                        retPorcen : recordData.ret2porcen,
                        retMontRet : recordData.ret2montRet
                    }]
                }
                if(recordData.ret3){
                    retIrTotal += Number(recordData.ret3montRet);
                    retIrList = [...retIrList, {
                        ret : extraerCodigoRetencion(recordData.ret3),
                        retBase : recordData.ret3base,
                        retPorcen : recordData.ret3porcen,
                        retMontRet : recordData.ret3montRet
                    }]
                }
                result.totalRetIR = retIrTotal;
                result.listRetIR = retIrList;

                result.importe_base_iva = recordData.importe_base_iva;
                var retIvaList = []
                var retIvaTotal = 0;
                if(Number(recordData.retIva10porc)){
                    retIvaTotal += Number(recordData.retIva10porc);
                    retIvaList = [...retIvaList, {
                        retIva : recordData.retIva10porc,
                        retIvaPorcen : "10.00"
                    }]
                }
                if(Number(recordData.retIva20porc)){
                    retIvaTotal += Number(recordData.retIva20porc);
                    retIvaList = [...retIvaList, {
                        retIva : recordData.retIva20porc,
                        retIvaPorcen : "20.00"
                    }]
                }
                if(Number(recordData.retIva30porc)){
                    retIvaTotal += Number(recordData.retIva30porc);
                    retIvaList = [...retIvaList, {
                        retIva : recordData.retIva30porc,
                        retIvaPorcen : "30.00"
                    }]
                }
                if(Number(recordData.retIva70porc)){
                    retIvaTotal += Number(recordData.retIva70porc);
                    retIvaList = [...retIvaList, {
                        retIva : recordData.retIva70porc,
                        retIvaPorcen : "70.00"
                    }]
                }
                if(Number(recordData.retIva100porc)){
                    retIvaTotal += Number(recordData.retIva100porc);
                    retIvaList = [...retIvaList, {
                        retIva : recordData.retIva100porc,
                        retIvaPorcen : "100.00"
                    }]
                }
                result.totalRetIva = retIvaTotal;
                result.listRetIva = retIvaList;

                return result;

            } catch (error) {
                log.error('error-getFactura', error);
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

        /**
         * 
         * @param {*} FormType 
         * @param {*} FormID 
         * Extrae y prepara la información requerida por la plantilla (no incluye GL)
         */
        function extractRecord(FormType, FormID){
            try{                
                var searchRecord = search.lookupFields({
                    type: FormType,
                    id: FormID,
                    columns: [
                        'entity',
                        'tranid',
                        'transactionnumber',
                        'memo',
                        'location',
                        'trandate',
                        'total',
                        'custbodyts_ec_tipo_documento_fiscal',
                        'postingperiod',

                        'custbody_ec_serie_cxc_retencion',
                        'custbody_ts_ec_preimpreso_retencion',

                        'custbody_ec_ret_ir',
                        'custbody_ec_importe_base_ir',
                        'custbody_ec_porcentaje_ret_ir',
                        'custbody_ec_monto_de_ret_ir',

                        'custbody_ec_ret_ir2',
                        'custbody_ec_impb_ir2',
                        'custbody_ec_ret_por_ir2',
                        'custbody_ec_mont_ret_2',

                        'custbody_ec_ret_ir3',
                        'custbody_ec_impb_ir3',
                        'custbody_ec_ret_por_ir3',
                        'custbody_ec_mont_ret_3',

                        'custbody_ec_importe_base_iva',
                        'custbody_ec_porcentaje_ret_10',
                        'custbody_ec_porcentaje_ret_20',
                        'custbody_ec_porcentaje_ret_30',
                        'custbody_ec_porcentaje_ret_70',
                        'custbody_ec_porcentaje_ret_100'
                    ]
                });
                recordBase = {};

                recordBase.entity = searchRecord.entity?.length ? searchRecord.entity[0].text : "";

                recordBase.vendorId = searchRecord.entity?.length ? searchRecord.entity[0].value : false;

                recordBase.tranid = searchRecord.tranid;
                recordBase.transactionnumber = searchRecord.transactionnumber;
                recordBase.memo = searchRecord.memo;
                recordBase.location = searchRecord.location?.length ? searchRecord.location[0].text : "";    
                recordBase.trandate = searchRecord.trandate;
                recordBase.custbodyts_ec_tipo_documento_fiscal = searchRecord.custbodyts_ec_tipo_documento_fiscal?.length ? searchRecord.custbodyts_ec_tipo_documento_fiscal[0].text : "";
                recordBase.postingperiod = searchRecord.postingperiod?.length ? searchRecord.postingperiod[0].text : "";

                var monto = searchRecord.total;
                if (Number(monto) < 0) {
                    monto = Number(monto) * (-1);
                }
                recordBase.total = monto;

                recordBase.custbody_ec_serie_cxc_retencion = searchRecord.custbody_ec_serie_cxc_retencion.length ? searchRecord.custbody_ec_serie_cxc_retencion[0].text : "";
                recordBase.custbody_ts_ec_preimpreso_retencion = searchRecord.custbody_ts_ec_preimpreso_retencion;

                recordBase.ret1 = searchRecord.custbody_ec_ret_ir.length ? searchRecord.custbody_ec_ret_ir[0].value : "";;
                recordBase.ret1base = searchRecord.custbody_ec_importe_base_ir;
                recordBase.ret1porcen = searchRecord.custbody_ec_porcentaje_ret_ir;
                recordBase.ret1montRet = searchRecord.custbody_ec_monto_de_ret_ir;

                recordBase.ret2 = searchRecord.custbody_ec_ret_por_ir2.length ? searchRecord.custbody_ec_ret_por_ir2[0].value : "";;
                recordBase.ret2base = searchRecord.custbody_ec_impb_ir2;
                recordBase.ret2porcen = searchRecord.custbody_ec_ret_ir2;
                recordBase.ret2montRet = searchRecord.custbody_ec_mont_ret_2;

                recordBase.ret3 = searchRecord.custbody_ec_ret_por_ir3.length ? searchRecord.custbody_ec_ret_por_ir3[0].value : "";;
                recordBase.ret3base = searchRecord.custbody_ec_impb_ir3;
                recordBase.ret3porcen = searchRecord.custbody_ec_ret_ir3;
                recordBase.ret3montRet = searchRecord.custbody_ec_mont_ret_3;
                
                recordBase.importe_base_iva = searchRecord.custbody_ec_importe_base_iva;
                recordBase.retIva10porc = searchRecord.custbody_ec_porcentaje_ret_10;
                recordBase.retIva20porc = searchRecord.custbody_ec_porcentaje_ret_20;
                recordBase.retIva30porc = searchRecord.custbody_ec_porcentaje_ret_30;
                recordBase.retIva70porc = searchRecord.custbody_ec_porcentaje_ret_70;
                recordBase.retIva100porc = searchRecord.custbody_ec_porcentaje_ret_100;

                return recordBase;
            }
            catch (errorRecord) {
                log.error('extractRecordError', errorRecord);
            }

        }

        function extraerCodigoRetencion(id){
            try{
                let taxCodeSearchField = search.lookupFields({
                    type: 'customrecord_4601_witaxcode',
                    id: id,
                    columns: [
                        'custrecord_ts_ec_cod_retencion_iva'
                    ]
                });
                return taxCodeSearchField.custrecord_ts_ec_cod_retencion_iva
            }catch (errorRecord) {
                log.error('extractRecordError', errorRecord);
            }
        }

        return {
            onRequest
        };
    });