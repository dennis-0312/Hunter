/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
*/

define(['N/search', 'N/email', 'N/file', 'N/runtime', 'N/log', 'N/format', 'N/record', 'N/task'],
    (search, email, file, runtime, log, format, record, task) => {

        const MAX_PAGINATION_SIZE = 1000;
        var currentScript = runtime.getCurrentScript();

        const getInputData = (context) => {
            try {
                let environmentFeatures = getEnviromentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);

                let transactions = getATSVentasExportaciones(scriptParameters, environmentFeatures);

                return transactions;
            } catch (error) {
                log.error("error", error);
            }
        }

        const map = (context) => {
            try {
                let key = context.key;
                let result = JSON.parse(context.value);

                // 1 Código Venta
                let codigoVenta = result[0];

                // 2 Tipo de Identificación del Cliente
                let tipoIdentificacion = result[1].replace('- None -', '');

                // 3 No. de Identificación del Cliente
                let numeroIdentificacion = result[2].replace('- None -', '');

                // 4 Parte Relacionada
                let parteRelacionada = result[3].replace('- None -', '');
                
                // 5 Tipo de Cliente
                let tipoCliente = result[4].replace('- None -', '');

                // 6 Razón o denominación social del exportador
                let razonSocial = result[5].replace('- None -', '');

                // 7 Tipos de régimen fiscal del exterior
                let tipoRegimenFiscal = result[6].replace('- None -', '');
                
                // 8 País de residencia o establecimiento permanente de quien proviene el ingreso régimen general
                let paisRegimenGeneral = result[7].replace('- None -', '');

                // 9 País de residencia o establecimiento permanente de quien proviene el ingreso paraíso fiscal
                let paisParaisoFiscal = result[8].replace('- None -', '');

                // 10 Denominación del régimen fiscal preferente
                let denominacionRegimenFiscal = result[9].replace('- None -', '');

                // 11 País de residencia o establecimiento permanente a quien se Efectúa la exportación o ingreso
                let paisEfectuaExportacion = result[10].replace('- None -', '');

                // 12 Exportación a paraíso fiscal, jurisdicción de menor imposición o régimen fiscal preferente
                let exportacionParaisoFiscal = result[11].replace('- None -', '');
                
                // 13 Tipo de Exportación / Ingreso del exterior
                let tipoExportacion = result[12].replace('- None -', '');

                // 14 Tipos de Ingresos del exterior
                let tipoIngresosExterior = result[13].replace('- None -', '');

                // 15 ¿El ingreso del ext. fue gravado con impuesto a la renta en el país en el que se obtuvo?
                let ingresoExteriorGravado = result[14].replace('- None -', '');

                // 16 Valor del impuesto a la renta o impuesto similar pagado en el exterior por el ingreso obtenido
                let valorImpuestoPagadoExterior = result[15];

                // 17 tipo de Comprobante
                let tipoComprobante = result[16].replace('- None -', '');

                // 18 No. de refrendo - Distrito Aduanero
                let numeroReferendoDistrito = result[17].replace('- None -', '');

                // 19 No. de refrendo - Año
                let numeroReferendoAnio = result[18].replace('- None -', '');

                // 20 No. del refrendo - Régimen
                let numeroReferendoRegimen = result[19].replace('- None -', '');

                // 21 No. del refrendo - Correlativo
                let numeroReferendoCorrelativo = result[20].replace('- None -', '');

                // 22 No. del refrendo - Verificador
                let numeroReferendoVerificador = result[21].replace('- None -', '');

                // 23 No. de documento de transporte
                let numeroDocumentoTransporte = result[22].replace('- None -', '');

                // 24 Fecha de registro contable
                let fechaRegistroContable = result[23].replace('- None -', '');

                // 25 No. de FUE
                let numeroFUE = result[24].replace('- None -', '');

                // 26 Valor FOB / Valor del ingreso del exterior
                let valorFOB = result[25];

                // 27 Valor del Comprobante local / exterior
                let valorFOBComprobante = result[26];

                // 28 No. de serie del comprobante de venta - establecimiento
                let establecimiento = result[27].replace('- None -', '');

                // 29 No. de serie del comprobante de venta - punto de emisión
                let puntoEmision = result[28].replace('- None -', '');

                // 30 No. secuencial del comprobante de venta
                let numeroSecuencial = result[29].replace('- None -', '');

                // 31 No. de autorización del comprobante de venta
                let numeroAutorizacion = result[30].replace('- None -', '');

                // 32 Fecha de emisión del comprobante de venta
                let fechaEmision = result[31].replace('- None -', '');

                let rowString = `${codigoVenta}|${tipoIdentificacion}|${numeroIdentificacion}|${parteRelacionada}|${tipoCliente}|${razonSocial}|` +
                `${tipoRegimenFiscal}|${paisRegimenGeneral}|${paisParaisoFiscal}|${denominacionRegimenFiscal}|${paisEfectuaExportacion}|${exportacionParaisoFiscal}|`+
                `${tipoExportacion}|${tipoIngresosExterior}|${ingresoExteriorGravado}|${valorImpuestoPagadoExterior}|${tipoComprobante}|${numeroReferendoDistrito}|` +
                `${numeroReferendoAnio}|${numeroReferendoRegimen}|${numeroReferendoCorrelativo}|${numeroReferendoVerificador}|${numeroDocumentoTransporte}|` +
                `${fechaRegistroContable}|${numeroFUE}|${valorFOB}|${valorFOBComprobante}|${establecimiento}|${puntoEmision}|${numeroSecuencial}|${numeroAutorizacion}|${fechaEmision}\r\n`;
                
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

        const getATSVentasExportaciones = (scriptParameters, environmentFeatures) => {
            let atsFormaPagoSearch = search.load({
                id: "customsearchts_ec_ats_ventas_exportacion"
            });

            if (scriptParameters.periodId) {
                let periodFilter = search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.periodId
                });
                atsFormaPagoSearch.filters.push(periodFilter);
            }

            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: scriptParameters.subsidiaryId
                });
                atsFormaPagoSearch.filters.push(subsidiaryFilter);
            }

            let pagedData = atsFormaPagoSearch.runPaged({ pageSize: MAX_PAGINATION_SIZE });

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
                scriptParameters.subsidiaryId = currentScript.getParameter('custscript_ts_mr_ec_ats_vnt_exp_subsidia');
            scriptParameters.periodId = currentScript.getParameter('custscript_ts_mr_ec_ats_vnt_exp_period');
            scriptParameters.folderId = currentScript.getParameter('custscript_ts_mr_ec_ats_vnt_exp_folder');
            scriptParameters.atsFilesId = currentScript.getParameter('custscript_ts_mr_ec_ats_vnt_exp_atsfiles');
            scriptParameters.logId = currentScript.getParameter('custscript_ts_mr_ec_ats_vnt_exp_logid');
            //<I> rhuaccha: 2024-02-26
            scriptParameters.format = currentScript.getParameter('custscript_ts_mr_ec_ats_vnt_exp_formato');
            //<F> rhuaccha: 2024-02-26

            log.error("scriptParameters", scriptParameters);
            return scriptParameters;
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
            return `VENTAS DE EXPORTACIONES(${scriptParameters.subsidiaryId}, ${scriptParameters.periodId}, ${fileCount}).txt`;
        }

        const executeMapReduce = (scriptParameters, environmentFeatures) => {
            let params = {};

            if (environmentFeatures.hasSubsidiaries) {
                params['custscript_ts_ss_ec_ats_int_arc_subsidia'] = scriptParameters.subsidiaryId;
            }

            params['custscript_ts_ss_ec_ats_int_arc_period'] = scriptParameters.periodId;

            params['custscript_ts_ss_ec_ats_int_arc_folder'] = scriptParameters.folderId;

            params['custscript_ts_ss_ec_ats_int_arc_atsfiles'] = scriptParameters.atsFilesId;

            params['custscript_ts_ss_ec_ats_int_arc_logid'] = scriptParameters.logId;
            //<I> rhuaccha: 2024-02-26
            params['custscript_ts_ss_ec_ats_int_arc_formato'] = scriptParameters.format;
            //<F> rhuaccha: 2024-02-26
            log.error("executeMapReduce", params);
            let scriptTask = task.create({
                //taskType: task.TaskType.MAP_REDUCE,
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_ts_ss_ec_ats_integra_archiv',
                deploymentId: 'customdeploy_ts_ss_ec_ats_integra_archiv',
                params
            });
            let scriptTaskId = scriptTask.submit();
        }

        return {
            getInputData,
            map,
            summarize
        }
    }
)