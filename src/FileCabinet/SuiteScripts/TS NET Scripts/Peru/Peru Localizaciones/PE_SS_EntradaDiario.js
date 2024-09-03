/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 *
 * Task                             Date            Author                                  Remarks
 * Creación Entrada de Diario       08 Agosto 2023  Ivan Morales <imorales@myevol.biz>      Se debe correr el 01 de cada mes
 * 
 */
define(['N/log', 'N/search', 'N/file', 'N/record', 'N/format'], function (log, search, file, record, format) {

    async function execute(context) {
        await Crear_EntradaDiario()
    }

    async function Crear_EntradaDiario() {
        try {
            //!1.0 ULTIMOS 12 MESES y ULTIMO MES
            let codigos_doce_meses = []
            let codigo_ultimo_mes = 0

            let meses_pasados = []
            let ultimo_mes
            let ultimo_mes_texto
            var currentDate = new Date();
            // currentDate.setMonth(currentDate.getMonth() + 1);//simulamos que estamos agosto
            currentDate.setDate(1);//Establecemos la fecha al primer dia del mes actual (por si corra un 2, 3. 4 del mes). Pero siempre debemos un día del siguinte mes
            log.debug('MSK', 'currentDate = ' + currentDate)
            for (let i = 0; i < 12; i++) {
                // log.debug('MSK', 'antes currentDate['+i+'] = ' + currentDate)
                // log.debug('MSK', 'antes currentDate.getMonth()['+i+'] = ' + currentDate.getMonth())
                currentDate.setMonth(currentDate.getMonth() - 1);
                // log.debug('MSK', 'despues currentDate['+i+'] = ' + currentDate)
                // log.debug('MSK', 'despues currentDate.getMonth()['+i+'] = ' + currentDate.getMonth())
                var currentMonth = currentDate.getMonth(); // Retorna el mes actual (0-11, donde 0 es enero)
                var currentYear = currentDate.getFullYear(); // Retorna el año actual (4 dígitos)

                let mes_letra = currentMonth == 0 ? 'Ene' :
                    currentMonth == 1 ? 'Feb' :
                        currentMonth == 2 ? 'Mar' :
                            currentMonth == 3 ? 'Abr' :
                                currentMonth == 4 ? 'May' :
                                    currentMonth == 5 ? 'Jun' :
                                        currentMonth == 6 ? 'Jul' :
                                            currentMonth == 7 ? 'Ago' :
                                                currentMonth == 8 ? 'Set' :
                                                    currentMonth == 9 ? 'Oct' :
                                                        currentMonth == 10 ? 'Nov' :
                                                            currentMonth == 11 ? 'Dic' :
                                                                '';

                let mes_texto = currentMonth == 0 ? 'Enero' :
                    currentMonth == 1 ? 'Febrero' :
                        currentMonth == 2 ? 'Marzo' :
                            currentMonth == 3 ? 'Abril' :
                                currentMonth == 4 ? 'Mayo' :
                                    currentMonth == 5 ? 'Junio' :
                                        currentMonth == 6 ? 'Julio' :
                                            currentMonth == 7 ? 'Agosto' :
                                                currentMonth == 8 ? 'Setiembre' :
                                                    currentMonth == 9 ? 'Octubre' :
                                                        currentMonth == 10 ? 'Noviembre' :
                                                            currentMonth == 11 ? 'Diciembre' :
                                                                '';
                mes_pasado = mes_letra + " " + currentYear
                if (i == 0) {
                    ultimo_mes = mes_pasado;
                    ultimo_mes_texto = mes_texto + " " + currentYear
                    log.debug('MSK', 'ultimo_mes = ' + ultimo_mes)
                }
                meses_pasados.push(mes_pasado)
            }
            log.debug('MSK', 'meses_pasados = ' + meses_pasados)

            var filtroJson = []
            for (let j = 0; j < 12; j++) {
                if (meses_pasados[j].trim().length > 0) {
                    if (filtroJson.length > 0) {
                        filtroJson.push("or")
                    }

                    let filtro1 = ["periodname", "is", meses_pasados[j]]
                    let filtro = [filtro1]
                    filtroJson.push(filtro)
                }
            }
            // log.debug('MSK', 'filtroJson = ' + filtroJson)

            //Recuperando ID de los periodos pasados
            var accountingPeriodSearch = search.create({
                type: search.Type.ACCOUNTING_PERIOD,
                columns: ['periodname', 'startdate', 'enddate'],
                filters: [filtroJson],
            });
            // log.debug('MSK', 'accountingPeriodSearch = '+accountingPeriodSearch)

            var busqueda = accountingPeriodSearch.run();
            // log.debug('MSK', 'busqueda.count = '+busqueda.count)

            busqueda.each(function (result) {
                var idPeriodo = result.id;
                var idPeriodoTexto = idPeriodo.toString();
                codigos_doce_meses.push(idPeriodoTexto)

                var nombre_periodo = result.getValue('periodname');
                if (nombre_periodo == ultimo_mes) {
                    codigo_ultimo_mes = idPeriodo
                }
                return true;
            });
            log.debug('MSK', 'codigos_doce_meses = ' + codigos_doce_meses)
            log.debug('MSK', 'codigo_ultimo_mes = ' + codigo_ultimo_mes)

            //!2.0 CONSULTANDO NUESTRAS VENTAS: REGISTRO DE VENTAS 14.1
            let Op_gravadas = 0;
            let Op_no_gravadas = 0;
            let exportaciones = 0;
            let dPRORRATA = 0;

            let miBusqueda = search.load({ id: 'customsearch_pe_registro_de_ventas_14_1' });//ID de mi busqueda guardada
            let filters = miBusqueda.filters;
            const filterOne = search.createFilter({
                name: 'postingperiod',
                operator: search.Operator.ANYOF,
                //values: [['152', '171', '172', '142']]
                values: [codigos_doce_meses]
            });
            filters.push(filterOne)

            let cantidad = miBusqueda.runPaged().count;
            log.debug('MSK', 'cantidad reporte 14.1 (12 meses) = ' + cantidad)
            if (cantidad != 0) {

                let tam_pagina = 500
                let trazitas_json = new Array();

                let suma_13x_pe = 0
                let suma_14s_pe = 0
                let suma_15desc = 0
                let suma_15igv = 0
                let suma_17igvdescuento_pe = 0
                let suma_18e_pe = 0
                let suma_19i_pe = 0
                let suma_20sun_pe = 0
                let suma_21iun_pe = 0
                let suma_22inaf_pe = 0
                let suma_23icbp = 0
                let suma_24otros = 0
                let suma_25total = 0

                let salida = {}
                for (let i = 0; i < Math.ceil(cantidad / tam_pagina); i++) {
                    let results = miBusqueda.run().getRange({
                        start: tam_pagina * i,//0    10  (posicion inicial)
                        end: tam_pagina * (i + 1)//10   20  (posicion final, no incluyente)
                    });
                    // log.debug('resultado busqueda guardada', results);

                    for (let j = 0; j < results.length; j++) {
                        var col12 = results[j].getValue(miBusqueda.columns[12])
                        var col13 = results[j].getValue(miBusqueda.columns[13])
                        var col14 = results[j].getValue(miBusqueda.columns[14])
                        var col15 = results[j].getValue(miBusqueda.columns[15])
                        var col16 = results[j].getValue(miBusqueda.columns[16])
                        var col17 = results[j].getValue(miBusqueda.columns[17])
                        var col18 = results[j].getValue(miBusqueda.columns[18])
                        var col19 = results[j].getValue(miBusqueda.columns[19])
                        var col20 = results[j].getValue(miBusqueda.columns[20])
                        var col21 = results[j].getValue(miBusqueda.columns[21])
                        var col22 = results[j].getValue(miBusqueda.columns[22])
                        var col23 = results[j].getValue(miBusqueda.columns[23])
                        var col24 = results[j].getValue(miBusqueda.columns[24])
                        var col25 = results[j].getValue(miBusqueda.columns[25])
                        var col26 = results[j].getValue(miBusqueda.columns[26])

                        let trazitas_item = {}
                        trazitas_item.col12 = col12,
                            trazitas_item.col13 = col13,
                            trazitas_item.col14 = col14,
                            trazitas_item.col15 = col15,
                            trazitas_item.col16 = col16,
                            trazitas_item.col17 = col17,
                            trazitas_item.col18 = col18,
                            trazitas_item.col19 = col19,
                            trazitas_item.col20 = col20,
                            trazitas_item.col21 = col21,
                            trazitas_item.col22 = col22,
                            trazitas_item.col23 = col23,
                            trazitas_item.col24 = col24,
                            trazitas_item.col25 = col25,//MONEDA
                            trazitas_item.col26 = col26,//TIPO CAMBIO
                            trazitas_json.push(trazitas_item)
                        log.debug('resultado trazitas_item 14.1', trazitas_item);

                        //let tipo_cambio = 1.00
                        let tipo_cambio = parseFloat(col26)

                        suma_13x_pe = suma_13x_pe + parseFloat(col12) * tipo_cambio
                        suma_14s_pe = suma_14s_pe + parseFloat(col13) * tipo_cambio
                        suma_15desc = suma_15desc + parseFloat(col14) * tipo_cambio
                        suma_15igv = suma_15igv + parseFloat(col15) * tipo_cambio
                        suma_17igvdescuento_pe = suma_17igvdescuento_pe + parseFloat(col16) * tipo_cambio
                        suma_18e_pe = suma_18e_pe + parseFloat(col17) * tipo_cambio
                        suma_19i_pe = suma_19i_pe + parseFloat(col18) * tipo_cambio
                        suma_20sun_pe = suma_20sun_pe + parseFloat(col19) * tipo_cambio
                        suma_21iun_pe = suma_21iun_pe + parseFloat(col20) * tipo_cambio
                        suma_22inaf_pe = suma_22inaf_pe + parseFloat(col21) * tipo_cambio
                        suma_23icbp = suma_23icbp + parseFloat(col22) * tipo_cambio
                        suma_24otros = suma_24otros + parseFloat(col23) * tipo_cambio
                        suma_25total = suma_25total + parseFloat(col24) * tipo_cambio

                        salida.suma_13x_pe = suma_13x_pe
                        salida.suma_14s_pe = suma_14s_pe
                        salida.suma_15desc = suma_15desc
                        salida.suma_15igv = suma_15igv
                        salida.suma_17igvdescuento_pe = suma_17igvdescuento_pe
                        salida.suma_18e_pe = suma_18e_pe
                        salida.suma_19i_pe = suma_19i_pe
                        salida.suma_20sun_pe = suma_20sun_pe
                        salida.suma_21iun_pe = suma_21iun_pe
                        salida.suma_22inaf_pe = suma_22inaf_pe
                        salida.suma_23icbp = suma_23icbp
                        salida.suma_24otros = suma_24otros
                        salida.suma_25total = suma_25total
                    }
                }
                log.debug('resultado salida', salida);
                Op_gravadas = suma_14s_pe;
                // Op_no_gravadas = suma_22inaf_pe;
                // exportaciones = suma_18e_pe;
                
                Op_no_gravadas = suma_18e_pe + suma_22inaf_pe;
                exportaciones = suma_13x_pe;
            }

            log.debug('MSK', '----');
            log.debug('MSK', 'Op_gravadas = ' + Op_gravadas);
            log.debug('MSK', 'Op_no_gravadas = ' + Op_no_gravadas);
            log.debug('MSK', 'exportaciones = ' + exportaciones);
            dPRORRATA = (Op_gravadas + exportaciones) / (Op_gravadas + Op_no_gravadas + exportaciones)
            log.debug('MSK', 'dPRORRATA = (Op_gravadas + exportaciones)/ (Op_gravadas + Op_no_gravadas + exportaciones) = ' + dPRORRATA);
            log.debug('MSK', '');

            //!3.0 CONSULTANDO NUESTRAS COMPRAS: Registro de Compra 8.1 (Gravadas y No Gravadas)
            let Compras_nac_gravadas = 0;
            let Compras_nac_no_gravadas = 0;

            let miBusqueda_8_1 = search.load({ id: 'customsearch_pe_registro_de_compra_8_1' });//ID de mi busqueda guardada
            let filters_8_1 = miBusqueda_8_1.filters;
            const filterOne_8_1 = search.createFilter({
                name: 'postingperiod',
                // operator: search.Operator.ANYOF,
                // values: [codigos_doce_meses]
                operator: search.Operator.IS,
                values: codigo_ultimo_mes
            });
            filters_8_1.push(filterOne_8_1)

            let cantidad_8_1 = miBusqueda_8_1.runPaged().count;
            log.debug('MSK', 'cantidad_8_1 = ' + cantidad_8_1)
            if (cantidad_8_1 != 0) {

                let tam_pagina = 500
                let trazitas_json = new Array();

                let suma_14_BI_OpGrav = 0
                let suma_15_Impuesto = 0
                let suma_16_BI_OpNoGrav = 0
                let suma_17_Impuesto = 0
                let suma_18_BI_OpGravNoDerFiscal = 0
                let suma_19_Impuesto = 0
                let suma_20_Valor_NoGrav = 0
                let suma_21_ISC = 0
                let suma_22_ICBP = 0
                let suma_22_Otros_Tributos = 0
                let suma_23_Total = 0

                let salida = {}
                for (let i = 0; i < Math.ceil(cantidad_8_1 / tam_pagina); i++) {
                    let results = miBusqueda_8_1.run().getRange({
                        start: tam_pagina * i,//0    10  (posicion inicial)
                        end: tam_pagina * (i + 1)//10   20  (posicion final, no incluyente)
                    });
                    // log.debug('resultado busqueda guardada', results);

                    for (let j = 0; j < results.length; j++) {
                        var col13 = results[j].getValue(miBusqueda_8_1.columns[13])
                        var col14 = results[j].getValue(miBusqueda_8_1.columns[14])
                        var col15 = results[j].getValue(miBusqueda_8_1.columns[15])
                        var col16 = results[j].getValue(miBusqueda_8_1.columns[16])
                        var col17 = results[j].getValue(miBusqueda_8_1.columns[17])
                        var col18 = results[j].getValue(miBusqueda_8_1.columns[18])
                        var col19 = results[j].getValue(miBusqueda_8_1.columns[19])
                        var col20 = results[j].getValue(miBusqueda_8_1.columns[20])
                        var col21 = results[j].getValue(miBusqueda_8_1.columns[21])
                        var col22 = results[j].getValue(miBusqueda_8_1.columns[22])
                        var col23 = results[j].getValue(miBusqueda_8_1.columns[23])
                        var col24 = results[j].getValue(miBusqueda_8_1.columns[24])
                        var col25 = results[j].getValue(miBusqueda_8_1.columns[25])

                        let trazitas_item = {}
                        trazitas_item.col13 = col13,
                            trazitas_item.col14 = col14,
                            trazitas_item.col15 = col15,
                            trazitas_item.col16 = col16,
                            trazitas_item.col17 = col17,
                            trazitas_item.col18 = col18,
                            trazitas_item.col19 = col19,
                            trazitas_item.col20 = col20,
                            trazitas_item.col21 = col21,
                            trazitas_item.col22 = col22,
                            trazitas_item.col23 = col23,
                            trazitas_item.col24 = col24,//MONEDA
                            trazitas_item.col25 = col25,//TIPO CAMBIO
                            trazitas_json.push(trazitas_item)
                        log.debug('resultado trazitas_item 8.1', trazitas_item);

                        //let tipo_cambio = 1.00
                        let tipo_cambio = parseFloat(col25)

                        suma_14_BI_OpGrav = suma_14_BI_OpGrav + parseFloat(col13) * tipo_cambio
                        suma_15_Impuesto = suma_15_Impuesto + parseFloat(col14) * tipo_cambio
                        suma_16_BI_OpNoGrav = suma_16_BI_OpNoGrav + parseFloat(col15) * tipo_cambio
                        suma_17_Impuesto = suma_17_Impuesto + parseFloat(col16) * tipo_cambio
                        suma_18_BI_OpGravNoDerFiscal = suma_18_BI_OpGravNoDerFiscal + parseFloat(col17) * tipo_cambio
                        suma_19_Impuesto = suma_19_Impuesto + parseFloat(col18) * tipo_cambio
                        suma_20_Valor_NoGrav = suma_20_Valor_NoGrav + parseFloat(col19) * tipo_cambio
                        suma_21_ISC = suma_21_ISC + parseFloat(col20) * tipo_cambio
                        suma_22_ICBP = suma_22_ICBP + parseFloat(col21) * tipo_cambio
                        suma_22_Otros_Tributos = suma_22_Otros_Tributos + parseFloat(col22) * tipo_cambio
                        suma_23_Total = suma_23_Total + parseFloat(col23) * tipo_cambio

                        salida.suma_14_BI_OpGrav = suma_14_BI_OpGrav
                        salida.suma_15_Impuesto = suma_15_Impuesto
                        salida.suma_16_BI_OpNoGrav = suma_16_BI_OpNoGrav
                        salida.suma_17_Impuesto = suma_17_Impuesto
                        salida.suma_18_BI_OpGravNoDerFiscal = suma_18_BI_OpGravNoDerFiscal
                        salida.suma_19_Impuesto = suma_19_Impuesto
                        salida.suma_20_Valor_NoGrav = suma_20_Valor_NoGrav
                        salida.suma_21_ISC = suma_21_ISC
                        salida.suma_22_ICBP = suma_22_ICBP
                        salida.suma_22_Otros_Tributos = suma_22_Otros_Tributos
                        salida.suma_23_Total = suma_23_Total
                    }
                }
                log.debug('resultado salida', salida);
                Compras_nac_gravadas = suma_14_BI_OpGrav;
                Compras_nac_no_gravadas = suma_16_BI_OpNoGrav;
            }

            log.debug('MSK', 'Compras_nac_gravadas = ' + Compras_nac_gravadas);
            log.debug('MSK', 'Compras_nac_no_gravadas = ' + Compras_nac_no_gravadas);
            log.debug('MSK', '');

            //!4.0 CONSULTANDO NUESTRAS COMPRAS: Registro de Compra 8.2 (Importaciones)
            let importaciones = 0;
            let dMONTO_COMPRAS = 0;
            let dENTRADA_DIARIO = 0;

            let miBusqueda_8_2 = search.load({ id: 'customsearch_pe_registro_de_compra_8_2' });//ID de mi busqueda guardada
            let filters_8_2 = miBusqueda_8_2.filters;
            const filterOne_8_2 = search.createFilter({
                name: 'postingperiod',
                // operator: search.Operator.ANYOF,
                // values: [codigos_doce_meses]
                operator: search.Operator.IS,
                values: codigo_ultimo_mes
            });
            filters_8_2.push(filterOne_8_2)

            let cantidad_8_2 = miBusqueda_8_2.runPaged().count;
            log.debug('MSK', 'cantidad_8_2 = ' + cantidad_8_2)
            if (cantidad_8_2 != 0) {

                let tam_pagina = 500
                let trazitas_json = new Array();

                let suma_8_valor_de_adquisiciones = 0
                let suma_9_otros_conceptos = 0
                let suma_10_importe_total = 0
                let suma_15_monto_retencion_igv = 0
                let suma_27_deduccion_costo_enajenacion = 0
                let suma_30_impuesto_retenido = 0

                let salida = {}
                for (let i = 0; i < Math.ceil(cantidad_8_2 / tam_pagina); i++) {
                    let results = miBusqueda_8_2.run().getRange({
                        start: tam_pagina * i,//0    10  (posicion inicial)
                        end: tam_pagina * (i + 1)//10   20  (posicion final, no incluyente)
                    });
                    // log.debug('resultado busqueda guardada', results);

                    for (let j = 0; j < results.length; j++) {
                        var col7 = results[j].getValue(miBusqueda_8_2.columns[7])
                        var col8 = results[j].getValue(miBusqueda_8_2.columns[8])
                        var col9 = results[j].getValue(miBusqueda_8_2.columns[9])
                        var col14 = results[j].getValue(miBusqueda_8_2.columns[14])
                        var col26 = results[j].getValue(miBusqueda_8_2.columns[26])
                        var col29 = results[j].getValue(miBusqueda_8_2.columns[29])
                        var col15 = results[j].getValue(miBusqueda_8_2.columns[15])//MONEDA
                        var col16 = results[j].getValue(miBusqueda_8_2.columns[16])//TIPO CAMBIO

                        let trazitas_item = {}
                        trazitas_item.col7 = col7,
                            trazitas_item.col8 = col8,
                            trazitas_item.col9 = col9,
                            trazitas_item.col14 = col14,
                            trazitas_item.col26 = col26,
                            trazitas_item.col29 = col29
                        trazitas_item.col15 = col15
                        trazitas_item.col16 = col16
                        trazitas_json.push(trazitas_item)
                        log.debug('resultado trazitas_item 8.2', trazitas_item);

                        //let tipo_cambio = 1.00
                        let tipo_cambio = parseFloat(col16)

                        suma_8_valor_de_adquisiciones = suma_8_valor_de_adquisiciones + parseFloat(col7) * tipo_cambio
                        suma_9_otros_conceptos = suma_9_otros_conceptos + parseFloat(col8) * tipo_cambio
                        suma_10_importe_total = suma_10_importe_total + parseFloat(col9) * tipo_cambio
                        suma_15_monto_retencion_igv = suma_15_monto_retencion_igv + parseFloat(col14) * tipo_cambio
                        suma_27_deduccion_costo_enajenacion = suma_27_deduccion_costo_enajenacion + parseFloat(col26) * tipo_cambio
                        suma_30_impuesto_retenido = suma_30_impuesto_retenido + parseFloat(col29) * tipo_cambio

                    }
                }

                salida.suma_8_valor_de_adquisiciones = suma_8_valor_de_adquisiciones
                salida.suma_9_otros_conceptos = suma_9_otros_conceptos
                salida.suma_10_importe_total = suma_10_importe_total
                salida.suma_15_monto_retencion_igv = suma_15_monto_retencion_igv
                salida.suma_27_deduccion_costo_enajenacion = suma_27_deduccion_costo_enajenacion
                salida.suma_30_impuesto_retenido = suma_30_impuesto_retenido

                log.debug('resultado salida', salida);
                importaciones = suma_10_importe_total;
            }

            log.debug('MSK', '----');
            log.debug('MSK', 'importaciones = ' + importaciones);
            dMONTO_COMPRAS = Compras_nac_gravadas + importaciones + Compras_nac_no_gravadas
            log.debug('MSK', 'dMONTO_COMPRAS = Compras_nac_gravadas + importaciones + Compras_nac_no_gravadas = ' + dMONTO_COMPRAS);
            dENTRADA_DIARIO = ((dMONTO_COMPRAS * 0.18) - (dMONTO_COMPRAS * dPRORRATA * 0.18)).toFixed(2)
            log.debug('MSK', 'dENTRADA_DIARIO = (dMONTO_COMPRAS*0.18)-(dMONTO_COMPRAS*dPRORRATA*0.18) = ' + dENTRADA_DIARIO);


            //!5.0 CREACION DE ENTRADA DE DIARIO
            try {
                let journalEntry = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true,
                });

                journalEntry.setValue({
                    fieldId: 'subsidiary',
                    value: 3,//ASBANC
                });

                journalEntry.setValue({
                    fieldId: 'currency',
                    value: 1,//SOLES
                });

                journalEntry.setValue({
                    fieldId: 'exchangerate',
                    value: 1.00,//TIPO CAMBIO
                });

                ultimoDiaMesPasado = getLastDayOfLastMonth()
                journalEntry.setValue({
                    fieldId: 'trandate',
                    value: ultimoDiaMesPasado
                });

                journalEntry.setValue({
                    fieldId: 'postingperiod',
                    value: codigo_ultimo_mes//PERIODO
                });

                journalEntry.setValue({
                    fieldId: 'memo',
                    value: 'Prorrata - ' + ultimo_mes_texto
                });

                // Set the first item line
                journalEntry.selectNewLine({
                    sublistId: 'line',
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: 1909,//Cuenta debito
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: dENTRADA_DIARIO
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: 179//Departamento - CC-01_CIERRE CONTABLE
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: 66//Clase - CTA0001-CONTABILIDAD-001
                });

                journalEntry.commitLine({
                    sublistId: 'line',
                });

                // Set the second item line
                journalEntry.selectNewLine({
                    sublistId: 'line',
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: 211,//Cuenta credito
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: dENTRADA_DIARIO,
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: 179//Departamento - CC-01_CIERRE CONTABLE
                });

                journalEntry.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: 66//Clase - CTA0001-CONTABILIDAD-001
                });

                journalEntry.commitLine({
                    sublistId: 'line',
                });

                // Save the Journal Entry record
                var journalEntryId = journalEntry.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: false,
                });

                log.debug({
                    title: 'Journal Entry Created',
                    details: 'Journal Entry ID: ' + journalEntryId,
                });

            }
            catch (err) {
                log.debug('MSK', 'error en creacion de Entrada de Diario: ' + err);
            }

        }
        catch (error) {
            log.debug('MSK', 'error: ' + error);
        }



    }

    function getLastDayOfLastMonth() {
        // Obtenemos la fecha actual
        var today = new Date();

        // Establecemos el día en 0 para retroceder al último día del mes pasado
        today.setDate(0);

        // Obtenemos el último día del mes actual para obtener el día correcto
        var lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        return lastDayOfLastMonth;
    }

    return {
        execute: execute
    }
});
