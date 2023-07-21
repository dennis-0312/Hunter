/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
*/

define(['N/search', 'N/email', 'N/file', 'N/runtime', 'N/log', 'N/format', 'N/record', 'N/task'],
    (search, email, file, runtime, log, format, record, task) => {

        const MAX_PAGINATION_SIZE = 1000;
        var currentScript = runtime.getCurrentScript();

        const getInputData = () => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);

                let transactions = getATSComprasDetalladas(scriptParameters, environmentFeatures);

                return transactions;
            } catch (error) {
                log.error("error", error);
            }
        }

        const map = (context) => {
            try {
                let key = context.key;

                let result = JSON.parse(context.value);

                // 1 Codigo de compra
                let codigoCompra = result[0];

                // 2 Codigo de sustento
                let codigoSustento = result[1].replace('- None -', '');

                // 3 Tipo de identificacion del proveedor
                let tipoIdentificacionProveedor = result[2].replace('- None -', '');

                // 4 Numero de identificacion del proveedor
                let numeroIdentificacionProveedor = result[3].replace('- None -', '');

                // 5 Codigo del tipo de comprobante
                let codigoTipoComprobante = result[4].replace('- None -', '');

                // 6 Parte relacionada
                let parteRelacionada = result[5].replace('- None -', '');
                if (["01", "02", "03"].indexOf(tipoIdentificacionProveedor) == -1) {
                    parteRelacionada = '';
                }

                // 7 Tipo de proveedor
                let tipoProveedor = result[6].replace('- None -', '');
                if (tipoIdentificacionProveedor != "03") {
                    tipoProveedor = "";
                }

                // 8 Proveedor razon social
                let razonSocialProveedor = "";
                if (tipoProveedor != "" && tipoIdentificacionProveedor == "03") {
                    razonSocialProveedor = result[7].replace('- None -', '');
                }

                // 9 Fecha de registro del comprobante de venta
                let fechaRegistro = result[8].replace('- None -', '');


                // 10 Numero de serie del comprobante de venta - Establecimiento
                let establecimientoCV = "";
                if (result[9] != '- None -') {
                    establecimientoCV = result[9].padStart(3, '0');
                } else {
                    if (["11", "12", "19", "20"].indexOf(codigoTipoComprobante) > -1) {
                        establecimientoCV = '999';
                    } else {
                        establecimientoCV = '';
                    }
                }

                // 11 Punto emision del comprobante de venta
                let puntoEmisionCV = "";
                if (result[10] != '- None -') {
                    puntoEmisionCV = result[10].padStart(3, '0');
                } else {
                    if (["11", "12", "19", "20"].indexOf(codigoTipoComprobante) > -1) {
                        puntoEmisionCV = '999';
                    } else {
                        puntoEmisionCV = '';
                    }
                }

                // 12 CV Secuencial
                let numeroSecuencialCV = result[11].replace('- None -', '');

                // 13 CV Fecha de emision
                let fechaEmision = result[12];

                // 14 CV Numero de autorizacion
                let numeroAutorizacion = result[13].replace('- None -', '');

                // 15 Base Imponible no objeto de IVA
                let baseImponibleNoIva = Number(result[14]);
                baseImponibleNoIva = roundTwoDecimals(Math.abs(baseImponibleNoIva));

                // 16 Base imponible tarifa 0% de IVA 
                let baseImponible0Iva = Number(result[15]);
                baseImponible0Iva = roundTwoDecimals(Math.abs(baseImponible0Iva));

                // 17 Base imponible gravada
                let baseImponibleGravada = Number(result[16]);
                baseImponibleGravada = roundTwoDecimals(Math.abs(baseImponibleGravada));

                // 18 Base exenta
                let baseImponibleExenta = Number(result[17]);
                baseImponibleExenta = roundTwoDecimals(Math.abs(baseImponibleExenta));

                // 19 Monto ICE
                let montoIce = Number(result[18]);
                montoIce = roundTwoDecimals(Math.abs(montoIce));

                // 20 Monto IVA
                let montoIva = Number(result[19]);
                montoIva = roundTwoDecimals(Math.abs(montoIva));

                // 21 Retencion bienes 10% IVA 
                let retencionIva10 = Number(result[20]);
                retencionIva10 = roundTwoDecimals(Math.abs(retencionIva10));

                // 22 Retencion servicios 20% IVA
                let retencionIva20 = Number(result[21]);
                retencionIva20 = roundTwoDecimals(Math.abs(retencionIva20));

                // 23 Retencion de IVA 30% bienes
                let retencionIva30 = Number(result[22]);
                retencionIva30 = roundTwoDecimals(Math.abs(retencionIva30));

                // 24 Retencion de IVA 50% bienes
                let retencionIva50 = Number(result[23]);
                retencionIva30 = roundTwoDecimals(Math.abs(retencionIva50));

                // 25 Retencion de IVA 70% servicios
                let retencionIva70 = Number(result[24]);
                retencionIva70 = roundTwoDecimals(Math.abs(retencionIva70));

                // 26 Retencion de IVA 100%
                let retencionIva100 = Number(result[25]);
                retencionIva100 = roundTwoDecimals(Math.abs(retencionIva100));

                // 27 Total bases imponibles
                let totalBasesImponibles = Number(result[26]);

                // 28 Pago Local o Extranjero
                let pagoLocalExtranjero = result[27].replace('- None -', '');

                // 29 Tipos de regimen fiscal del exterior
                let tipoRegimen = result[28].replace('- None -', '');

                // 30 País de residencia o establecimiento permanente a quién se efectúa el pago régimen general
                let paisEfectuaPagoRegimen = result[29];
                if (tipoRegimen != '01') paisEfectuaPagoRegimen = "";

                // 31 País de residencia o establecimiento permanente a quién se efectúa el pago paraíso fiscal
                let paisEfectuaPagoParaiso = result[30];
                if (tipoRegimen != '02') paisEfectuaPagoParaiso = "";

                // 32 Denominación del régimen fiscal preferente o jurisdicción de menor imposición.
                let denominacionPago = result[31];
                if (tipoRegimen != "03") denominacionPago = "";

                // 33 País al que se efectúa el pago
                let paisEfectuaPago = result[32].replace('- None -', '');
                if (pagoLocalExtranjero == "01") paisEfectuaPago = 'NA';

                // 34 ¿Aplica convenio de doble tributación?
                let aplicaConvenioDobleTributacion = result[33].replace('- None -', '');
                if (pagoLocalExtranjero == '01') aplicaConvenioDobleTributacion = 'NA';

                // 35 ¿Pago al exterior en aplicación a la Normativa Legal?
                let pagoExteriorSujetoRetencionNormativaLegal = "";
                if (result[34] != '- None -') {
                    if (pagoLocalExtranjero == "01" || aplicaConvenioDobleTributacion != "NO") {
                        pagoExteriorSujetoRetencionNormativaLegal = "NA";
                    } else {
                        pagoExteriorSujetoRetencionNormativaLegal = result[34];
                    }
                } else {
                    pagoExteriorSujetoRetencionNormativaLegal = "";
                }

                // 36 ¿El pago es a un régimen fiscal preferente o de menor imposición?
                let pagoRegimenFiscalPreferente = result[35];

                // 37 No. de serie del comprobante de retención - establecimiento
                let establecimientoCR = result[36].replace('- None -', '');

                // 38 No. de serie del comprobante de retención - punto de emisiónd
                let puntoEmisionCR = result[37].replace('- None -', '');

                // 39 No. secuencial del comprobante de retención
                let numeroSecuencialCR = result[38].replace('- None -', '');

                // 40 No. de autorización del comprobante de retención
                let numeroAutorizacionCR = result[39].replace('- None -', '');

                // 41 Fecha de emision del comprobante de retención
                let fechaEmisionCR = result[40].replace('- None -', '');

                // 42 Código tipo de comprobante modificado por una Nota de Crédito o Débito
                let codigoTipoCM = result[41].replace('- None -', '');

                // 43 No. de serie del comprobante modificado - establecimiento
                let establecimientoCM = result[42].replace('- None -', '');

                // 44 No. de serie del comprobante modificado - punto de emisión
                let puntoEmisionCM = result[43].replace('- None -', '');

                // 45 No. secuencial del comprobante modificado
                let secuencialCM = result[44].replace('- None -', '');

                // 46 No. de autorización del comprobante modificado
                let numeroAutorizacionCM = result[45].replace('- None -', '');

                let rowString = `${codigoCompra}|${codigoSustento}|${tipoIdentificacionProveedor}|${numeroIdentificacionProveedor}|${codigoTipoComprobante}|` +
                    `${parteRelacionada}|${tipoProveedor}|${razonSocialProveedor}|${fechaRegistro}|${establecimientoCV}|${puntoEmisionCV}|${numeroSecuencialCV}|` +
                    `${fechaEmision}|${numeroAutorizacion}|${baseImponibleNoIva}|${baseImponible0Iva}|${baseImponibleGravada}|${baseImponibleExenta}${montoIce}|` +
                    `${montoIva}|${retencionIva10}|${retencionIva20}|${retencionIva30}|${retencionIva50}|${retencionIva70}|${retencionIva100}|${totalBasesImponibles}|` +
                    `${pagoLocalExtranjero}|${tipoRegimen}|${paisEfectuaPagoRegimen}|${paisEfectuaPagoParaiso}|${denominacionPago}|${paisEfectuaPago}|${aplicaConvenioDobleTributacion}|` +
                    `${pagoExteriorSujetoRetencionNormativaLegal}|${pagoRegimenFiscalPreferente}|${establecimientoCR}|${puntoEmisionCR}|${numeroSecuencialCR}|${numeroAutorizacionCR}|` +
                    `${fechaEmisionCR}|${codigoTipoCM}|${establecimientoCM}|${puntoEmisionCM}|${secuencialCM}|${numeroAutorizacionCM}\r\n`;

                context.write({
                    key: context.key,
                    value: {
                        rowString
                    }
                });

            } catch (error) {
                log.error("error", error);
            }
        }

        const summarize = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);

                let fileContent = "";
                let lineCount = 0;
                let fileCount = 0;

                context.output.iterator().each(function (key, value) {
                    let obj = JSON.parse(value);
                    fileContent += obj.rowString;
                    lineCount++;
                    if (lineCount % 10000 == 0) {
                        scriptParameters.atsFilesId += saveFile(fileContent, fileCount, scriptParameters) + '|';
                        fileContent = "";
                        lineCount = 0;
                        fileCount++;
                    }
                    return true;
                });

                if (lineCount != 0) {
                    scriptParameters.atsFilesId += saveFile(fileContent, fileCount, scriptParameters) + '|';
                }

                log.error("summarize", scriptParameters);
                executeMapReduce(scriptParameters, environmentFeatures);
            } catch (error) {
                log.error("error", error);
            }
        }

        const executeMapReduce = (scriptParameters, environmentFeatures) => {
            let params = {};

            if (environmentFeatures.hasSubsidiaries) {
                params['custscript_ts_mr_ec_ats_com_ree_subsidia'] = scriptParameters.subsidiaryId;
            }

            params['custscript_ts_mr_ec_ats_com_ree_period'] = scriptParameters.periodId;

            params['custscript_ts_mr_ec_ats_com_ree_folder'] = scriptParameters.folderId;

            params['custscript_ts_mr_ec_ats_com_ree_atsfiles'] = scriptParameters.atsFilesId;

            params['custscript_ts_mr_ec_ats_com_ree_logid'] = scriptParameters.logId;
            log.error("executeMapReduce", params);
            let scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_ts_mr_ec_ats_compra_reembol',
                deploymentId: 'customdeploy_ts_mr_ec_ats_compra_reembol',
                params
            });
            let scriptTaskId = scriptTask.submit();
        }

        const getEnviromentFeatures = () => {
            let features = {};
            features.hasSubsidiaries = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            return features;
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};

            if (environmentFeatures.hasSubsidiaries)
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_det_subsidia');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_det_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_det_folder');
            scriptParameters.atsFilesId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_det_atsfiles');
            scriptParameters.logId = currentScript.getParameter('custscript_ts_mr_ec_ats_com_det_logid');

            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
        }

        const getATSComprasDetalladas = (scriptParameters, environmentFeatures) => {
            let aTSComprasDetalladasSearch = search.load({
                id: 'customsearch_ts_ec_compras_detalladas'
            });

            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.periodId
                });
                aTSComprasDetalladasSearch.filters.push(periodFilter);
            }

            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.subsidiaryId
                });
                aTSComprasDetalladasSearch.filters.push(subsidiaryFilter);
            }

            let pagedData = aTSComprasDetalladasSearch.runPaged({ pageSize: MAX_PAGINATION_SIZE });

            let resultArray = [];
            for (let i = 0; i < pagedData.pageRanges.length; i++) {

                let page = pagedData.fetch({
                    index: pagedData.pageRanges[i].index
                });

                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;

                    let rowArray = [];
                    for (let k = 0; k < columns.length; k++) {
                        rowArray.push(result.getValue(columns[k]));
                    }
                    resultArray.push(rowArray);
                }
            }
            return resultArray;
        }

        const saveFile = (contents, fileCount, scriptParameters) => {
            let name = getFileName(scriptParameters, fileCount);

            let plainTextFile = file.create({
                name,
                fileType: file.Type.PLAINTEXT,
                contents,
                encoding: file.Encoding.UTF8,
                folder: scriptParameters.folderId
            });
            return plainTextFile.save();
        }

        const getFileName = (scriptParameters, fileCount) => {
            return `COMPRAS DETALLADAS(${scriptParameters.subsidiaryId}, ${scriptParameters.periodId}, ${fileCount}).txt`;
        }

        const roundTwoDecimals = (number) => {
            return Math.round(Number(number) * 100) / 100;
        }

        return {
            getInputData,
            map,
            summarize
        }
    }
)