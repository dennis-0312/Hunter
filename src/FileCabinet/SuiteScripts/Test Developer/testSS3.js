/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/file', 'N/search', 'N/record', 'N/runtime', 'N/task'], (file, search, record, runtime, task) => {

    let currentScript = runtime.getCurrentScript();
    const execute = (context) => {
        try {
            //PRODUCTION
            // const recordType = 'customrecord_ht_pp_main_param_prod';
            // let conteo = 0;
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
            // var searchResultCount = purchaseorderSearchObj.runPaged().count;
            // log.debug("customrecord_ht_record_bienesSearchObj result count", searchResultCount);
            // const purchaseOrderSearchPagedData = purchaseorderSearchObj.runPaged({ pageSize: 1000 });
            // for (let i = 0; i < purchaseOrderSearchPagedData.pageRanges.length; i++) {
            //     const purchaseOrderSearchPage = purchaseOrderSearchPagedData.fetch({ index: i });
            //     purchaseOrderSearchPage.data.forEach(result => {
            //         try {
            //             log.debug("conteo", conteo);
            //             let scriptObj = runtime.getCurrentScript();
            //             log.debug('Remaining governance units proccess: ' + conteo, scriptObj.getRemainingUsage());
            //             if (scriptObj.getRemainingUsage() > 100) {
            //                 log.debug('Eliminado', result.id);
            //                 record.delete({ type: recordType, id: result.id });
            //                 conteo++
            //             } else {
            //                 return false
            //             }
            //         } catch (error) {
            //             log.error('Error ' + result.id, error);
            //         }
            //     });
            // }

            // log.debug("compare", `${searchResultCount} > ${conteo}`);
            // if (searchResultCount > conteo) {
            //     const mrTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
            //     mrTask.scriptId = 'customscript_ts_test_ss';
            //     mrTask.deploymentId = 'customdeploy_ts_test_ss';
            //     mrTask.params = {}
            //     mrTask.submit();
            // } else {
            //     log.debug("compare", `Finalizó`);
            // }


            let scriptObj = runtime.getCurrentScript();
            let array = [464129, 464476, 464517, 464762, 464783, 465040, 465073, 465087, 465440, 486486, 486528, 487996, 489213, 491268, 455905, 491825, 492238, 456249, 458728, 460937, 464512, 482122, 482863, 485970, 486447, 487454, 488339, 489652, 490577, 491754, 452160, 452525, 452569, 452605, 452829, 453227, 453246, 453299, 453686, 454043, 454070, 454118, 454475, 454516, 454883, 455056, 455080, 455467, 455479, 455829, 492300, 464775, 466169, 468023, 477309, 479701, 458323, 480260, 480287, 482054, 482128, 482514, 484128, 486999, 493110, 493451, 493468, 493476, 493484, 493493, 493501, 493509, 493524, 493936, 493942, 493951, 493959, 493964, 493977, 493983, 493999, 494012, 494022, 452130, 452153, 452186, 452210, 452554, 452819, 452842, 452868,
                452894, 453235, 453256, 453266, 453289, 453626, 453645, 453670, 453676, 453706, 454022, 454029, 454052, 454079, 454092, 454444, 454513, 454838, 454850, 454905, 455045, 455091, 455430, 455458, 455484, 455820, 455842, 455895, 455912, 456230, 456269, 456292, 456624, 456669, 456939, 457005, 457236, 457271, 457627, 457649, 457671, 457692, 457718, 457926, 457988, 458369, 458742, 458777, 459233, 459280, 459292, 459591, 459613, 459933, 459940, 459974, 459995, 460022, 460328, 460366, 460408, 460756, 460774, 460818, 460988, 461022, 461337, 461394, 461747, 461758, 461802, 462134, 462188, 462640, 493131, 453683, 455106, 489144, 493521, 487507, 489140, 489694, 482859, 492317, 491248, 491743, 482520, 492632, 492713, 493069, 493517, 493935,
                493974, 468293, 469633, 469112, 470016, 491787, 492235, 492244, 492261, 492272, 492280, 482470, 492314, 492673, 492645, 492674, 492682, 492693, 492697, 492709, 492718, 492728, 493035, 493042, 493056, 493448, 492643, 493087, 454115, 454460, 454465, 454470, 454483, 454495, 454825, 454865, 454892, 454908, 455048, 455069, 492322, 455096, 455114, 455437, 455455, 455489, 455825, 455839, 455865, 455915, 456241, 456273, 456311, 493096, 493113, 493037, 493075, 493082, 456649, 492724, 456681, 493053, 493061, 492698, 492707, 492667, 492327, 492638, 456944, 493068, 456961, 493099, 493103, 493125, 457228, 457233, 457276, 457293, 457631, 457686, 457709, 457931, 457956, 458010, 459567, 459579, 459584, 459603, 459948, 458332, 458788, 459250,
                459254, 458754, 459533, 459972, 460017, 460021, 460356, 458397, 459288, 459256, 459273, 460391, 454845, 456703, 460415, 460425, 460765, 460778, 460793, 460823, 460946, 460968, 461006, 461011, 461383, 461400, 461763, 462140, 460404, 462661, 462875, 462927, 462174, 462225, 463261, 463299, 463639, 463674, 463710, 464041, 464065, 464101, 464125, 464451, 464456, 480315, 483486, 468837, 468860, 468894, 468899, 468923, 469050, 481123, 479287, 479316, 479664, 480244, 480282, 480657, 456963, 457640, 458768, 459587, 460335, 460750, 460981, 461734, 462834, 464470, 458355, 462635, 463267, 463645, 464113, 464490, 478742, 463671, 463685, 464045, 463717, 464043, 464056, 464070, 464433, 464108, 464431, 464450, 464464, 464739, 464733, 464737,
                464742, 464746, 464826, 464798, 464824, 465033, 465061, 465439, 465103, 465437, 465459, 465478, 465516, 465502, 465514, 465519, 465523, 465870, 465857, 465868, 465877, 465892, 465929, 465917, 465927, 466140, 466147, 466204, 466191, 466202, 466207, 466222, 466566, 466542, 466564, 466580, 466595, 466629, 466612, 466627, 466842, 466852, 466896, 466890, 466894, 466912, 466930, 467076, 467060, 467074, 467094, 467102, 467464, 467458, 467462, 467474, 467491, 517445, 471362, 517670, 518127, 517800, 517868, 466859, 466898, 466916, 467050, 467104, 467119, 467445, 467519, 467782, 467823, 467976, 468011, 468268, 468329, 468559, 468594, 468846, 468890, 439756, 467949, 470030, 468282, 468331, 468560, 469081, 469342, 469392, 469405, 469663,
                469669, 469955, 469969, 470005, 470242, 470239, 469714, 468833, 468845, 469093, 469370, 469401, 469408, 469641, 469680, 469338, 468908, 468875, 469124, 469727, 469949, 469978, 469086, 480314, 470557, 469089, 471227, 470596, 470577, 470593, 477835, 470840, 470864, 470886, 470292, 470300, 470538, 477247, 470279, 467830, 467959, 467794, 467798, 475677, 475701, 475393, 475642, 475424, 475651, 475673, 475419, 475423, 476454, 476479, 475985, 476018, 475727, 475946, 475696, 475722, 477012, 477240, 479705, 479714, 479682, 479697, 480234, 480237, 480245, 479729, 480233, 480251, 480270, 470851, 470876, 470565, 470587, 474317, 474320, 474005, 474264, 474582, 474616, 474324, 474465, 471520, 471845, 489207, 471507, 471519, 472226, 472487,
                472138, 477884, 477901, 477926, 478244, 477880, 478800, 478824, 487933, 477873, 477904, 477924, 478238, 478267, 478312, 478736, 478780, 485437, 486507, 486962, 487021, 487530, 489231, 485442, 485450, 485455, 485463, 485468, 485988, 485991]
            log.debug('Init =================================================', 'Process');
            let totalAEliminar = array.length
            log.debug({ title: 'Cantidad de registros a eliminar', details: `${totalAEliminar} registros a eliminar` });
            let eliminados = 1;
            let noeliminados = 1;
            let arrayNoElimnados = new Array();
            let reprocessing = 0;
            let conteo = 0;
            let continuarDesde = Number(currentScript.getParameter('custscript_ts_ss_param_count3')) > 0 ? Number(currentScript.getParameter('custscript_ts_ss_param_count3')) : 0;
            log.debug('continuarDesde', continuarDesde)
            for (let index = continuarDesde; index < array.length; index++) {
                const element = array[index];
                //*ELIMINAR REGISTROS =================================================================================================================================
                // try {
                //     record.delete({ type: 'customrecord_ht_record_detallechaserdisp', id: element });
                //     log.error('Debug: ' + element, 'eliminado / ' + scriptObj.getRemainingUsage());
                //     log.debug({ title: 'Cantidad de registros eliminados', details: `${eliminados} registros eliminados` });
                //     eliminados++
                // } catch (error) {
                //     log.error('Error: ' + element, error.message + ' / ' + scriptObj.getRemainingUsage());
                //     log.debug({ title: 'Cantidad de registros NO eliminados', details: `${noeliminados} registros NO eliminados` });
                //     arrayNoElimnados.push(element)
                //     noeliminados++
                // }
                //* ===================================================================================================================================================
                //~ELIMINAR LÍNEAS DE REGISTROS =======================================================================================================================
                try {
                    let so = record.load({ type: 'customsale_ec_factura_interna', id: element });
                    so.removeLine({ sublistId: 'item', line: 1, ignoreRecalc: true });
                    so.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    log.error('Debug: ' + element, 'eliminado / ' + scriptObj.getRemainingUsage());
                    log.debug({ title: 'Cantidad de registros eliminados', details: `${eliminados} registros eliminados.` });
                    eliminados++
                    if (scriptObj.getRemainingUsage() < 100) {
                        reprocessing = 1
                        break;
                    }
                } catch (error) {
                    log.error('Error: ' + element, error.message + ' / ' + scriptObj.getRemainingUsage());
                    log.debug({ title: 'Cantidad de registros NO eliminados', details: `${noeliminados} registros NO eliminados.` });
                    arrayNoElimnados.push(element)
                    noeliminados++
                }
                conteo = index
                //~ ===================================================================================================================================================
            }
            log.debug('Resumen: ', `${noeliminados} de ${totalAEliminar}`)
            log.debug('arrayNoElimnados: ', arrayNoElimnados)
            try {
                if (conteo < array.length && reprocessing == 1) {
                    let scriptTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_ts_test3_ss',
                        deploymentId: 'customdeploy_ts_test3_ss',
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
            // record.submitFields({
            //     type: 'salesorder',
            //     id: 552367,
            //     values: {
            //         custbody_ht_os_aprobacionventa: 2
            //     }
            // })
            log.debug('Finish =================================================', 'Process');










        } catch (error) {
            log.error('Error', error);
        }

    }



    return {
        execute: execute
    }
});
