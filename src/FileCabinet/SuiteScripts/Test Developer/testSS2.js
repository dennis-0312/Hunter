/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/record', 'N/runtime', 'N/task'], (file, search, record, runtime, task) => {

    let currentScript = runtime.getCurrentScript();
    const execute = (context) => {
        try {
            //PRODUCTION
            const recordType = 'customrecord_ht_pp_main_param_prod';
            const recordTypeDelete = 'account';
            let array = [];

            // var purchaseorderSearchObj = search.create({
            //     type: recordType,
            //     filters:
            //         [
            //         ],
            //     columns:
            //         [
            //             search.createColumn({ name: "internalid", label: "internalid" }),
            //         ]
            // });

            // let searchResultCount = purchaseorderSearchObj.runPaged().count;
            // log.debug("customrecord_ht_record_bienesSearchObj result count", searchResultCount);
            // const purchaseOrderSearchPagedData = purchaseorderSearchObj.runPaged({ pageSize: 1000 });
            // for (let i = 0; i < purchaseOrderSearchPagedData.pageRanges.length; i++) {
            //     const purchaseOrderSearchPage = purchaseOrderSearchPagedData.fetch({ index: i });
            //     purchaseOrderSearchPage.data.forEach(result => {
            //         array.push(result.id)
            //     });
            // }

            let scriptObj = runtime.getCurrentScript();
            array = [255,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,1686,1687,1688,1689,9475,9476,1690,1691,1692,1693,1694,1695,1696,1697,1698,1699,1700,1701,1702,1703,1704,1705,1706,1707,1708,1709,1710,1711,1712,1713,1714,1715,1716,1717,1718,1719,1720,1721,1722,1723,1724,9507,9508,9509,9510,1725,1726,1727,1728,1729,1730,1731,9517,1732,1733,1734,1735,1736,1737,1738,1739,1740,1741,1742,1743,1744,1745,1746,1747,1748,1749,1750,1751,1752,1753,1754,1755,1756,1757,1758,1759,1760,1761,1762,1763,1764,1765,1766,1767,1768,1769,1770,1771,1772,1773,1774,1775,1776,1777,1778,1779,1780,1781,1782,1783,1784,1785,1786,1787,1788,1789,1790,1791,1792,1793,1794,1795,1796,1797,1798,1799,1800,1801,1802,1803,1804,1805,1806,1807,1808,1809,1810,1811,1812,1813,1814,1815,1816,1817,1818,1819,1820,1821,1822,1823,1824,1825,1826,1827,1828,1829,1830,1831,1832,1833,1834,1835,1836,1837,1838,1839,1840,1841,1842,1843,1844,1845,1846,1847,1848,1849,1850,1851,1852,1853,1854,1855,1856,1857,1858,1859,1860,1861,1862,1863,1864,1865,1866,1867,1868,1869,1870,1871,1872,1873,1874,1875,1876,1877,1878,1879,1880,1881,1882,1883,1884,1885,1886,1887,1888,1889,1890,1891,1892,9677,1893,1894,1895,1896,1897,1898,1899,9684,1900,1901,1902,1903,1904,1905,1906,1907,1908,1909,1910,1911,1912,1913,1914,1915,1916,1917,1918,1919,1920,1921,1922,1923,1924,1925,1926,1927,1928,2433,2434,2435,2436,10407,10408,2437,10410,10411,2438,2439,2440,10415,10416,2441,10418,10419,2442,10421,2443,2444,2445,2446,2447,2448,2449,2450,2451,2452,2453,2454,2455,2456,2457,2458,2459,2460,10441,10442,2461,10444,10445,2462,2463,2464,2465,2466,2467,2468,2469,2470,2471,2472,2473,2474,2475,2476,2477,10461,2478,2479,2480,2481,2482,2483,2484,2485,2486,2487,10472,10473,2488,2489,2490,2491,2492,10479,10480,2493,2494,2495,2496,10485,10486,2497,2498,2499,10489,2500,2501,2502,2503,2504,2505,2506,2507,2508,2509,2510,2511,2512,2513,10504,10505,10506,10507,2514,2515,2516,2517,2518,2519,2520,2521,2522,10516,10517,2523,10519,2524]
            log.debug('Init =================================================', 'Process');
            let totalAEliminar = array.length
            log.debug({ title: 'Cantidad de registros a eliminar', details: `${totalAEliminar} registros a eliminar` });
            let eliminados = 1;
            let noeliminados = 1;
            let arrayNoElimnados = new Array();
            let reprocessing = 0;
            let conteo = 0;
            let continuarDesde = Number(currentScript.getParameter('custscript_ts_ss_param_count2')) > 0 ? Number(currentScript.getParameter('custscript_ts_ss_param_count2')) : 0;
            log.debug('continuarDesde', continuarDesde)
            for (let index = continuarDesde; index < array.length; index++) {
                const element = array[index];
                //*ELIMINAR REGISTROS =================================================================================================================================
                try {
                    record.delete({ type: recordTypeDelete, id: element });
                    log.error('Debug: ' + element, 'eliminado / ' + scriptObj.getRemainingUsage());
                    log.debug({ title: 'Cantidad de registros eliminados', details: `${eliminados} registros eliminados` });
                    eliminados++
                    if (scriptObj.getRemainingUsage() < 100) {
                        reprocessing = 1
                        break;
                    }
                } catch (error) {
                    log.error('Error: ' + element, error.message + ' / ' + scriptObj.getRemainingUsage());
                    log.debug({ title: 'Cantidad de registros NO eliminados', details: `${noeliminados} registros NO eliminados` });
                    arrayNoElimnados.push(element)
                    noeliminados++
                }
                //* ===================================================================================================================================================
                //~ELIMINAR LÍNEAS DE REGISTROS =======================================================================================================================
                // try {
                //     let so = record.load({ type: 'customsale_ec_factura_interna', id: element });
                //     so.removeLine({ sublistId: 'item', line: 1, ignoreRecalc: true });
                //     so.save({ enableSourcing: false, ignoreMandatoryFields: true });
                //     log.error('Debug: ' + element, 'eliminado / ' + scriptObj.getRemainingUsage());
                //     log.debug({ title: 'Cantidad de registros eliminados', details: `${eliminados} registros eliminados.` });
                //     eliminados++
                //     if (scriptObj.getRemainingUsage() < 100) {
                //         reprocessing = 1
                //         break;
                //     }
                // } catch (error) {
                //     log.error('Error: ' + element, error.message + ' / ' + scriptObj.getRemainingUsage());
                //     log.debug({ title: 'Cantidad de registros NO eliminados', details: `${noeliminados} registros NO eliminados.` });
                //     arrayNoElimnados.push(element)
                //     noeliminados++
                // }
                conteo = index
                //~ ===================================================================================================================================================
            }
            log.debug('Resumen: ', `Registros no eliminados ${noeliminados} de ${totalAEliminar}`);
            log.debug('arrayNoElimnados: ', arrayNoElimnados)
            try {
                if (conteo < array.length && reprocessing == 1) {
                    let scriptTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_ts_mass_delete_1',
                        deploymentId: 'customdeploy_ts_mass_delete_1',
                        params: {
                            custscript_ts_ss_param_count: conteo,
                        }
                    });
                    let scriptTaskId = scriptTask.submit();
                    log.debug('scriptTaskId', scriptTaskId);
                }
            } catch (error) {
                log.error('Error', error);
            }
            log.debug('Finish =================================================', 'Process');
        } catch (error) {
            log.error('Error', error);
        }
    }



    return {
        execute: execute
    }
});
