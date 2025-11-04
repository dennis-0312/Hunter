/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/config',
    'N/file',
    'N/log',
    'N/record',
    'N/runtime',
    'N/search',
    './config/config'
],
    /**
 * @param{config} config
 * @param{file} file
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (config, file, log, record, runtime, search, _config) => {
        let ENVIROMENT = '';
        const userRecord = runtime.getCurrentUser();
        const currentScript = runtime.getCurrentScript();

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            ENVIROMENT = configEnviroment();
            let deploymentId = currentScript.deploymentId;
            if (deploymentId == "customdeploy_ts_sl_ats_report") {
                if (scriptContext.request.method == 'GET') {
                    log.debug('userRecord', userRecord);
                    inputData(scriptContext);
                } else {
                    processData(scriptContext)
                }
            }
        }

        //* ---------------------------- IDENTIFICACION DE AMBIENTE ---------------------------- */
        const configEnviroment = () => {
            let companyid = config.load({ type: config.Type.COMPANY_INFORMATION }).getValue({ fieldId: 'companyid' });
            return companyid.includes('SB') ? _config.SANDBOX : _config.PRODUCTION
        }

        //* ---------------------------- PROCESO COMPARACION DE REPORTES SIRE VISTA ---------------------------- */
        const inputData = (scriptContext) => {
            //& ---------------------------- VARIABLES GENERALES ---------------------------- */
            let optionsContent = '';
            let custpage_subsidiary_field_content = '';


            //& ---------------------------- CARGA HTML ---------------------------- */
            let htmlFile = file.load({ id: ENVIROMENT.VARIABLES.FILE_INDEX });
            let htmlContent = htmlFile.getContents();


            //& ---------------------------- ASIGNACION DE VARIABLES A LA VISTA ---------------------------- */
            htmlContent = htmlContent.replace('href="!#"', `href="${ENVIROMENT.URL.NETSUITE_LINK}"`);
            htmlContent = htmlContent.replace('src="!#"', `src="${ENVIROMENT.URL.NETSUITE_LOGO}"`);
            // htmlContent = htmlContent.replace('varNameButton', ENVIROMENT.VARIABLES.NAME_BUTTON);
            // htmlContent = htmlContent.replace('varButton1XLS', ENVIROMENT.VARIABLES.NAME_BUTTON_SNON_XLS);
            // htmlContent = htmlContent.replace('varButton2XLS', ENVIROMENT.VARIABLES.NAME_BUTTON_NNOS_XLS);

            //& ---------------------------- CARGA DE SELECT SUBSIADIARIA ---------------------------- */
            let arraySubsidiaries = getSubsidiaries();
            log.debug('arraySubsidiaries', arraySubsidiaries)
            for (let i = 0; i < arraySubsidiaries.length; i++) {
                const element = arraySubsidiaries[i];
                custpage_subsidiary_field_content += `<option value="${element.value}">${element.text}</option>`
            }
            htmlContent = htmlContent.replace('<!--optionsContentSubsidiaries-->', custpage_subsidiary_field_content);


            //& ---------------------------- CARGA DE SELECT PERIODO ---------------------------- */
            let arrayPeriods = getPeriods();
            //log.debug('arrayPeriods', arrayPeriods)
            for (let i = 0; i < arrayPeriods.length; i++) {
                const element = arrayPeriods[i];
                optionsContent += `<option value="${element[0]} : ${element[1]} : ${element[2]}">${element[0]} : ${element[1]} : ${element[2]}</option>`
            }
            htmlContent = htmlContent.replace('<!--optionsContentPeriods-->', optionsContent);


            //& ---------------------------- CARGA HTML AL SUITELET ---------------------------- */
            scriptContext.response.write(htmlContent);
        }


        //* ---------------------------- PROCESO COMPARACION DE REPORTES SIRE ---------------------------- */
        const processData = (scriptContext) => {
            log.debug('START', '|========================= START =========================|')
            try {
                //& ---------------------------- VARIABLES GENERALES ---------------------------- */
                let inputData = {}
                let fileContent = '';
                let optionsContent = '';
                let searchReport = '';
                let scriptParameters = {}
                let custpage_subsidiary_field_content = '';


                //& ---------------------------- CARGA HTML ---------------------------- */
                let htmlFile = file.load({ id: ENVIROMENT.VARIABLES.FILE_INDEX });
                let htmlContent = htmlFile.getContents();

                //& ---------------------------- ASIGNACION DE VARIABLES A LA VISTA ---------------------------- */
                htmlContent = htmlContent.replace('href="!#"', `href="${ENVIROMENT.URL.NETSUITE_LINK}"`);
                htmlContent = htmlContent.replace('src="!#"', `src="${ENVIROMENT.URL.NETSUITE_LOGO}"`);


                //& ---------------------------- RECUPERACIÓN DE PARÁMETROS ---------------------------- */
                let environmentFeatures = getEnviromentFeatures();
                const reportField = scriptContext.request.parameters.custpage_report_field;
                const subsidiaryField = scriptContext.request.parameters.custpage_subsidiary_field;
                const periodField = scriptContext.request.parameters.custpage_period_field;
                scriptParameters.subsidiaryId = subsidiaryField;
                scriptParameters.periodId = periodField;
                //log.debug('scriptParameters', scriptParameters)


                //& ---------------------------- CARGA DE SELECT SUBSIADIARIA ---------------------------- */
                let arraySubsidiaries = getSubsidiaries();
                //log.debug('arraySubsidiaries', arraySubsidiaries)
                for (let i = 0; i < arraySubsidiaries.length; i++) {
                    const element = arraySubsidiaries[i];
                    custpage_subsidiary_field_content += `<option value="${element.value}">${element.text}</option>`
                }
                htmlContent = htmlContent.replace('<!--optionsContentSubsidiaries-->', custpage_subsidiary_field_content);


                //& ---------------------------- CARGA DE SELECT PERIODO ---------------------------- */
                let arrayPeriods = getPeriods();
                //log.debug('arrayPeriods', arrayPeriods)
                for (let i = 0; i < arrayPeriods.length; i++) {
                    const element = arrayPeriods[i];
                    optionsContent += `<option value="${element[0]} : ${element[1]} : ${element[2]}">${element[0]} : ${element[1]} : ${element[2]}</option>`
                }
                htmlContent = htmlContent.replace('<!--optionsContentPeriods-->', optionsContent);


                //& ---------------------------- CARGA TARJETA ---------------------------- */
                let subsidiary = findTextByValue(arraySubsidiaries, subsidiaryField)
                htmlContent = htmlContent.replace('Usuario.', runtime.getCurrentUser().email);
                htmlContent = htmlContent.replace('Subsidiaria.', subsidiary);
                htmlContent = htmlContent.replace('Periodo.', periodField);
                htmlContent = htmlContent.replace('Reporte.', reportField);

                let enabledButton =
                    `const generateExcelButton = document.getElementById('generateExcel');` +
                    `generateExcelButton.classList.remove('disabled');` +
                    `generateExcelButton.setAttribute('href', '#');` +
                    `generateExcelButton.removeAttribute('aria-disabled');`;
                htmlContent = htmlContent.replace('//<!--enabledButton-->', enabledButton);


                //& ---------------------------- PROCESANDO DATOS ---------------------------- */
                let atsArray = getATSXLSVentas(scriptParameters, environmentFeatures);
                let atsArrayRet = getATSXLSVentasRet(scriptParameters, environmentFeatures, atsArray);
                let atsArrayRetBanc = getATSXLSVentasRetBanc(scriptParameters, environmentFeatures, atsArrayRet);
                let formatDataJSON = getFormatData(atsArrayRetBanc);
                //log.debug('formatDataJSON', formatDataJSON)


                //& ---------------------------- CARGA DE JSON DATA ---------------------------- */
                let simulateDataLoading = '';
                simulateDataLoading += `const data = ${JSON.stringify(formatDataJSON)}`
                if (formatDataJSON)
                    htmlContent = htmlContent.replace('//<!--dataContent-->', simulateDataLoading);

                let nameFile = obtenerNombreEXCEL(periodField);
                log.debug('nameFile', nameFile)
                htmlContent = htmlContent.replace('Datos.xlsx', nameFile);


                //& ---------------------------- CARGA HTML AL SUITELET ---------------------------- */
                scriptContext.response.write(htmlContent);
                log.debug('END', '|========================== END ==========================|');
            } catch (error) {
                log.error('Error', error);
                log.debug('END', '|========================== END ERROR ==========================|');
            }
        }


        //* ---------------------------- FUNCIONES ---------------------------- */
        const getSubsidiaries = () => {
            let array = []
            let searchSelect = search.load({ id: ENVIROMENT.SEARCHS.SUBSIDIARIES });
            let searchSelectColumns = searchSelect.columns;
            searchSelect.run().each((result) => {
                array.push({
                    value: result.id,
                    text: result.getValue(searchSelectColumns[0])
                })
                return true;
            });

            return array;
        }

        const getPeriods = () => {
            let arrayPeriod = []
            let searchSelect = search.load({ id: ENVIROMENT.SEARCHS.PERIODS });
            let searchSelectColumns = searchSelect.columns;
            searchSelect.run().each((result) => {
                arrayPeriod.push(result.getText(searchSelectColumns[0]))
                return true;
            });
            //log.debug('arrayPeriod', arrayPeriod)
            // Filtrar los elementos que contienen "AF"
            const year = arrayPeriod
                .filter(item => item.startsWith("AF"))
                .map(item => parseInt(item.split(" ")[1])); // Extraer el año como número
            // Obtener el año más antiguo y el más actual
            const oldestYear = Math.min(...year);
            const currentYear = Math.max(...year);
            // Crear el arreglo con el año más antiguo y el más actual
            const years = [oldestYear, currentYear];
            //log.debug('years', years)
            const result = [];
            const quarterMonths = {
                "Q1": ["Ene", "Feb", "Mar"],
                "Q2": ["Abr", "May", "Jun"],
                "Q3": ["Jul", "Ago", "Sep"],
                "Q4": ["Oct", "Nov", "Dic"]
            };
            // Iterar desde 2023 hasta 2026
            for (let year = years[0]; year <= years[1]; year++) {
                // Iterar sobre cada trimestre
                for (const [quarter, months] of Object.entries(quarterMonths)) {
                    // Iterar sobre cada mes en el trimestre
                    for (const month of months) {
                        // Crear el arreglo por mes
                        result.push([`AF ${year}`, `${quarter} ${year}`, `${month} ${year}`]);
                    }
                }
            }
            return result
        }

        const findTextByValue = (data, valueToFind) => {
            const result = data.find(item => item.value === valueToFind);
            return result ? result.text : null; // Devuelve el texto o null si no se encuentra
        }

        const getEnviromentFeatures = () => {
            let features = new Object();
            features.hasSubsidiaries = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            return features;
        }

        const obtenerFechasDelMes = (cadena) => {
            //const cadena = "FY 2023 : Q1 2023 : Ene 2023";
            // Usar una expresión regular para encontrar "Ene 2023"
            const regex = /(\b[A-Za-z]{3}\s\d{4}\b)/;
            const resultado = cadena.match(regex);

            if (resultado) {
                log.debug(resultado[0]); // "Ene 2023"
                // Mapeo de nombres de meses a sus números
                nombreMes = resultado[0].split(" ")[0]
                anio = resultado[0].split(" ")[1]
                const meses = {
                    "ene": 1,
                    "feb": 2,
                    "mar": 3,
                    "abr": 4,
                    "may": 5,
                    "jun": 6,
                    "jul": 7,
                    "ago": 8,
                    "sep": 9,
                    "oct": 10,
                    "nov": 11,
                    "dic": 12
                };

                // Obtener el número del mes
                const mes = meses[nombreMes.toLowerCase()];
                // Validar si el mes es válido
                if (!mes) {
                    return false
                }
                // Fecha de inicio (primer día del mes)
                const fechaInicio = new Date(anio, mes - 1, 1); // mes - 1 porque los meses en JS son 0-indexed
                // Fecha de fin (último día del mes)
                const fechaFin = new Date(anio, mes, 0); // El día 0 del siguiente mes da el último día del mes actual
                // Formatear las fechas a "DD/MM/YYYY"
                const fechaInicioFormateada = fechaInicio.toISOString().split('T')[0].split('-').reverse().join('/');
                const fechaFinFormateada = fechaFin.toISOString().split('T')[0].split('-').reverse().join('/');
                return [fechaInicioFormateada, fechaFinFormateada];
            } else {
                log.debug("No se encontró el mes y año.");
                return false
            }
        }

        const obtenerNombreEXCEL = (cadena) => {
            //const cadena = "FY 2023 : Q1 2023 : Ene 2023";
            // Usar una expresión regular para encontrar "Ene 2023"
            const regex = /(\b[A-Za-z]{3}\s\d{4}\b)/;
            const resultado = cadena.match(regex);

            if (resultado) {
                log.debug(resultado[0]); // "Ene 2023"
                // Mapeo de nombres de meses a sus números
                let nameFile = `AT${resultado[0].replace(" ", "")}.xlsx`
                return nameFile;
            } else {
                log.debug("No se encontró el mes y año.");
                return false
            }
        }

        const getATSXLSVentas = (scriptParameters, environmentFeatures) => {
            let atsXLSCompra = search.load({ id: 'customsearch_ec_ats_ventas_mensual' });
            if (scriptParameters.periodId) {
                let periodo = obtenerFechasDelMes(scriptParameters.periodId);
                log.debug('periodo', periodo);
                //let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.periodId });
                const filterPeriod = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [periodo[0], periodo[1]] });
                atsXLSCompra.filters.push(filterPeriod);
            }
            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.subsidiaryId });
                atsXLSCompra.filters.push(subsidiaryFilter);
            }
            let pagedData = atsXLSCompra.runPaged({ pageSize: 1000 });
            let resultArray = new Array();
            for (let i = 0; i < pagedData.pageRanges.length; i++) {
                let page = pagedData.fetch({ index: pagedData.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    let rowArray = new Array();
                    for (let k = 0; k < columns.length; k++) {
                        rowArray.push(result.getValue(columns[k]));
                    }
                    resultArray.push(rowArray);
                }
            }
            return resultArray;
        }

        const getATSXLSVentasRet = (scriptParameters, environmentFeatures, atsArrayVentas) => {
            //saveJson(atsArrayVentas, 'atsArray', DEVELOPER_TRACKING_FOLDER);
            log.error('getATSXLSVentasRet', 'getATSXLSVentasRet');
            let atsXLSRetenciones = search.load({ id: 'customsearch_ec_ats_retenciones_mensual' });
            if (scriptParameters.periodId) {
                // let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.periodId });
                // atsXLSRetenciones.filters.push(periodFilter);
                let periodo = obtenerFechasDelMes(scriptParameters.periodId);
                const filterPeriod = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [periodo[0], periodo[1]] });
                atsXLSRetenciones.filters.push(filterPeriod);
            }
            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.subsidiaryId });
                atsXLSRetenciones.filters.push(subsidiaryFilter);
            }
            let objResults = atsXLSRetenciones.run().getRange({ start: 0, end: 1000 });
            log.debug('pageData', objResults);
            let pagedDataRetenciones = atsXLSRetenciones.runPaged({ pageSize: 1000 });
            let retencionesCount = 0;
            // Se crea un mapa para realizar la actualización de forma eficiente
            let retencionesMap = new Map();
            for (let i = 0; i < pagedDataRetenciones.pageRanges.length; i++) {
                let page = pagedDataRetenciones.fetch({ index: pagedDataRetenciones.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    // Extraer valor de la columna 4 de "retenciones mensual"
                    let retencionKey = String(result.getValue(columns[4]));
                    // Guardar los datos en el mapa para fácil acceso
                    retencionesMap.set(retencionKey, {
                        col5: result.getValue(columns[5]),
                        col6: result.getValue(columns[6]),
                        col7: result.getValue(columns[7]),
                        col8: result.getValue(columns[8]),
                        col9: result.getValue(columns[9]),
                        co20: result.getValue(columns[10]),
                        co21: result.getValue(columns[11]),
                        co22: result.getValue(columns[12]),
                        co23: result.getValue(columns[13]),
                        co24: result.getValue(columns[14]),
                        co25: result.getValue(columns[15]),
                        co26: result.getValue(columns[16]),
                        co27: result.getValue(columns[17]),
                        co28: result.getValue(columns[18]),
                        co29: result.getValue(columns[19]),
                        co30: result.getValue(columns[20]),
                        co31: result.getValue(columns[21]),
                    });
                    retencionesCount++;
                }
            }
            // Contar registros en atsArrayVentas
            let ventasCount = atsArrayVentas.length;
            log.debug('Conteo de registros', `Registros en búsqueda 1: ${ventasCount}`);
            log.debug('Conteo de registros', `Registros en búsqueda 2: ${retencionesCount}`);
            // Log para verificar los datos en el mapa
            log.debug('retencionesMap', JSON.stringify(retencionesMap))
            retencionesMap.forEach((value, key) => {
                log.debug('Datos en el mapa', `Key: ${key}, Value: ${JSON.stringify(value)}`);
            });
            // Ahora actualizamos atsArrayVentas con los datos del mapa
            let resultArray = atsArrayVentas.map((row, index) => {
                let ventasKey = String(row[13]);  // Convertir la clave a cadena
                let retencionData = retencionesMap.get(ventasKey);
                log.debug('Iteración del mapeo', `Índice: ${index}, ventasKey: ${ventasKey}, retencionData: ${JSON.stringify(retencionData)}`);
                if (retencionData) {
                    let updatedRow = [
                        ...row.slice(0, 19),  // Mantener las columnas antes del índice 19
                        retencionData.col5 !== undefined ? retencionData.col5 : row[19],  // Reemplazar columna 19
                        retencionData.col6 !== undefined ? retencionData.col6 : row[20],  // Reemplazar columna 20
                        retencionData.col7 !== undefined ? retencionData.col7 : row[21],  // Reemplazar columna 21
                        retencionData.col8 !== undefined ? retencionData.col8 : row[22],  // Reemplazar columna 22
                        retencionData.col9 !== undefined ? retencionData.col9 : row[23],  // Reemplazar columna 23
                        ...row.slice(24, 25),
                        retencionData.co20 !== undefined ? retencionData.co20 : row[25],  // Reemplazar columna 25
                        ...row.slice(26, 27),
                        retencionData.co21 !== undefined ? retencionData.co21 : row[27],  // Reemplazar columna 27
                        retencionData.co22 !== undefined ? retencionData.co22 : row[30],  // Reemplazar columna 30
                        retencionData.co23 !== undefined ? retencionData.co23 : row[28],  // Reemplazar columna 28
                        retencionData.co24 !== undefined ? retencionData.co24 : row[29],  // Reemplazar columna 29
                        retencionData.co25 !== undefined ? retencionData.co25 : row[30],  // Reemplazar columna 30
                        //...row.slice(31, 32),
                        retencionData.co26 !== undefined ? retencionData.co26 : row[32],
                        retencionData.co27 !== undefined ? retencionData.co27 : row[33],  // Reemplazar columna 33
                        retencionData.co28 !== undefined ? retencionData.co28 : row[34],  // Reemplazar columna 34
                        retencionData.co29 !== undefined ? retencionData.co29 : row[35],  // Reemplazar columna 35
                        //...row.slice(36),
                        ...row.slice(36, 48),
                        retencionData.co30 !== undefined ? retencionData.co30 : row[48],
                        retencionData.co31 !== undefined ? retencionData.co31 : row[49],
                        ...row.slice(50),
                        // Mantener las columnas desde el índice 35 en adelante

                        // retencionData.co20 !== undefined ? retencionData.co20 : row[25],  // Reemplazar columna 25
                        // retencionData.co21 !== undefined ? retencionData.co21 : row[27],  // Reemplazar columna 27
                        // retencionData.co22 !== undefined ? retencionData.co22 : row[30],  // Reemplazar columna 30
                        // retencionData.co23 !== undefined ? retencionData.co23 : row[28],  // Reemplazar columna 28
                        // retencionData.co24 !== undefined ? retencionData.co24 : row[29],  // Reemplazar columna 29
                        // retencionData.co25 !== undefined ? retencionData.co25 : row[31],  // Reemplazar columna 29
                        // retencionData.co26 !== undefined ? retencionData.co26 : row[32],  // Reemplazar columna 32
                        // retencionData.co27 !== undefined ? retencionData.co27 : row[33],  // Reemplazar columna 33
                        // retencionData.co28 !== undefined ? retencionData.co28 : row[34],  // Reemplazar columna 34
                    ];
                    log.debug('Fila actualizada', `Índice: ${index}, Updated Row: ${JSON.stringify(updatedRow)}`);
                    return updatedRow;
                } else {
                    log.debug('Fila no actualizada', `Índice: ${index}, Row: ${JSON.stringify(row)}`);
                    return row;  // Mantener la fila original si no hay coincidencia
                }
            });
            // Devolver el array con las actualizaciones realizadas
            return resultArray;
        }

        const getATSXLSVentasRetBanc = (scriptParameters, environmentFeatures, atsArrayVentas) => {
            //saveJson(atsArrayVentas, 'pruebaXLSatsArrayVentas', DEVELOPER_TRACKING_FOLDER)
            log.error('getATSXLSVentasRet', 'getATSXLSVentasRetBanc');
            let atsXLSRetenciones = search.load({ id: 'customsearch_ec_ret_ban_men' });
            if (scriptParameters.periodId) {
                // let periodFilter = search.createFilter({ name: 'postingperiod', operator: search.Operator.ANYOF, values: scriptParameters.periodId });
                // atsXLSRetenciones.filters.push(periodFilter);
                let periodo = obtenerFechasDelMes(scriptParameters.periodId);
                const filterPeriod = search.createFilter({ name: 'trandate', operator: search.Operator.WITHIN, values: [periodo[0], periodo[1]] });
                atsXLSRetenciones.filters.push(filterPeriod);
            }
            if (environmentFeatures.hasSubsidiaries) {
                let subsidiaryFilter = search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: scriptParameters.subsidiaryId });
                atsXLSRetenciones.filters.push(subsidiaryFilter);
            }
            let pagedDataRetenciones = atsXLSRetenciones.runPaged({ pageSize: 1000 });
            let ventasRetBanc = new Array();
            for (let i = 0; i < pagedDataRetenciones.pageRanges.length; i++) {
                let page = pagedDataRetenciones.fetch({ index: pagedDataRetenciones.pageRanges[i].index });
                for (let j = 0; j < page.data.length; j++) {
                    let result = page.data[j];
                    let columns = result.columns;
                    ventasRetBanc = [
                        result.getValue(columns[0]),
                        result.getValue(columns[1]),
                        result.getValue(columns[2]),
                        result.getValue(columns[3]),
                        result.getValue(columns[4]),
                        result.getValue(columns[5]),
                        result.getValue(columns[6]),
                        result.getText(columns[7]),
                        result.getValue(columns[8]),
                        result.getValue(columns[9]),
                        result.getValue(columns[10]),
                        result.getValue(columns[11]),
                        result.getValue(columns[12]),
                        result.getValue(columns[13]),
                        result.getValue(columns[14]),
                        result.getValue(columns[15]),
                        result.getValue(columns[16]),
                        result.getValue(columns[17]),
                        result.getValue(columns[18]),
                        result.getValue(columns[19]),
                        result.getValue(columns[20]),
                        result.getValue(columns[21]),
                        result.getValue(columns[22]),
                        result.getValue(columns[23]),
                        result.getValue(columns[24]),
                        result.getValue(columns[25]),
                        result.getValue(columns[26]),
                        result.getValue(columns[27]),//estaba comentado
                        result.getValue(columns[28]),
                        result.getValue(columns[29]),
                        result.getValue(columns[30]),
                        result.getValue(columns[31]),
                        result.getValue(columns[32]),
                        result.getValue(columns[33]),
                        result.getValue(columns[34]),
                        result.getValue(columns[35]),
                        result.getValue(columns[36]),
                        result.getValue(columns[37]),
                        result.getValue(columns[38]),
                        result.getValue(columns[39]),
                        result.getValue(columns[40]),
                        result.getValue(columns[41]),
                        result.getValue(columns[42]),
                        result.getValue(columns[43]),
                        result.getValue(columns[44]),
                        result.getValue(columns[45]),
                        result.getValue(columns[46]),
                        result.getValue(columns[47]),
                        result.getValue(columns[48]),
                        result.getValue(columns[49]),
                        result.getValue(columns[50]),
                        result.getValue(columns[51]),
                        result.getValue(columns[52])
                    ]
                    atsArrayVentas.push(ventasRetBanc)
                }
            }
            // let objResults = atsXLSRetenciones.run().getRange({ start: 0, end: 1000 });
            // log.debug('objResults', objResults);
            //saveJson(atsArrayVentas, 'objResults', DEVELOPER_TRACKING_FOLDER)
            return atsArrayVentas
        }

        const getFormatData = (array) => {
            let objData = [];

            for (let index = 0; index < array.length; index++) {
                const data = array[index];

                let lines = {
                    "RUC Empresa": data[2] || "",
                    "Periodo: MES": data[3] || "",
                    "Periodo: Año": data[4] || "",
                    "Tipo Identificacion": data[5] || "",
                    "Ruc / Cédula / Pasaporte": data[6] || "",
                    "Nombre (Opcional)": data[7] || "",
                    "Parterelvtas": data[8] || "",
                    "Establecimiento": data[9] || "",
                    "Co. Comprobante": data[10] || "",
                    "Cantidad De Comprob /Mes": Number(data[11]) || 0,
                    "Factura Sistema": data[12] || "",
                    "Fac. Físico": data[13] || "",
                    "Base No Aplica Iva": Number(data[14]) || 0,
                    "Base Impon. Tarifa 0%": Number(data[15]) || 0,
                    "Base Impon. Tarifa <> 0%": Number(data[16]) || 0,
                    "Monto Iva": Number(data[17]) || 0,
                    "Declarar Ret.Iva": Number(data[18]) || 0,
                    "Iva 10%": Number(data[19]) || 0,
                    "Iva 20%": Number(data[20]) || 0,
                    "Iva 30%": Number(data[21]) || 0,
                    "Iva 70%": Number(data[22]) || 0,
                    "Iva 100%": Number(data[23]) || 0,
                    "Monto Ice": Number(data[24]) || 0,
                    "Monto Ret. Iva": Number(data[25]) || 0,
                    "Declarar Ret.Renta": data[18] || "",
                    "Monto Ret. Ir": Number(data[27]) || 0,
                    "Ir 1%": Number(data[28]) || 0,
                    "Ir 2%": Number(data[29]) || 0,
                    "Ir 0%": Number(data[31]) || 0,
                    "Fecha De Emision": data[32] || "",
                    "Serie": data[33] || "",
                    "Secuencia": data[34] || "",
                    "Autorizacion": data[35] || "",
                    "Origenrtf": data[36] || "",
                    "Oficinartf": data[37] || "",
                    "Tasa Iva Movimiento": data[38] || "",
                    "Dscto.2% Solidario": data[39] || "",
                    "Tiportf": data[40] || "",
                    "Fec.Emisión Documento": data[41] || "",
                    "Fec.Autorización Sri": data[42] || "",
                    "Denominación Cliente": data[43] || "",
                    "Tipo Emisión": data[44] || "",
                    "Tipo Compen.": data[45] || "",
                    "Monto Compensación": Number(data[46]) || 0,
                    "Forma Pago": data[47] || "",
                    "Ir 1.75": Number(data[48]) || 0,
                    "Ir 2.75%": Number(data[49]) || 0,
                    "Par Rel.": data[50] || "",
                    "Monto Ice": Number(data[51]) || 0,
                    "Tipo Id. Sri": data[52] || ""
                }

                objData.push(lines)
            }

            return objData;
        }


        return { onRequest }

    });
