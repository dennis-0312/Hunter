/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 * @param {string} altname - El valor del campo altname.
 * @returns {string} - El campo altname en el formato deseado. 
 */
 define(['N/query', 'N/https', 'N/log','N/record'], function (query, https, log, record) {
    function _put() {
        try {
                //let ExternalId = context.externalid;
                let idActualiza = 0;
                let Resultado = [];

                let QueryActivoSinCuenta = query.runSuiteQL({
                    query: `SELECT	T.ID IdAsiento,
                                    T.TRANID CodAsiento,
                                    T.MEMO Glosa,
                                    T.externalid NumDiario,
                                    AF.ID IdActivo,
                                    AF.externalid IdGlosa,
                                    AF.NAME CodActivo,
                                    AF.custrecord_assetsourcetrn IdAsientoAF
                            FROM    transaction T,
                                    customrecord_ncfar_asset AF
                            WHERE	T.type = 'Journal'
                            AND		T.MEMO IS NOT NULL
                            AND     T.MEMO LIKE 'IMP.ACTIVO-%'
                            AND		SUBSTR(T.MEMO, 12) = AF.externalid
                            AND		AF.custrecord_assetsourcetrn is null `
                });
                let detActivosPorActualizar = QueryActivoSinCuenta.asMappedResults();
                log.error('Detalle: ', detActivosPorActualizar);

                if (detActivosPorActualizar.length > 0){
                    
                    IdActivo = 0;

                    for (let i in detActivosPorActualizar) {

                        let IdAsiento = detActivosPorActualizar[i]['idasiento'];
                        let IdActivo = detActivosPorActualizar[i]['idactivo']; 

                        log.error('IdAsiento: ', IdAsiento);
                        log.error('IdActivo: ', IdActivo);
                        

                        if (IdActivo != 0){
                            let objActivo = record.load({ type: 'customrecord_ncfar_asset', id: IdActivo, isDynamic: true }); //abre tabla
                            log.error('objActivo: ',objActivo);
                
                            objActivo.setValue({fieldId: 'custrecord_assetsourcetrn', value: IdAsiento, ignoreFieldChange: true});
                
                            idActualiza = 0;
                            idActualiza = objActivo.save({ enableSourcing: false, ignoreMandatoryFields: false });

                            if ((idActualiza != 0) && (idActualiza != -1)){
                                Resultado.push({
                                    IdAsiento: IdAsiento,
                                    CodAsiento: detActivosPorActualizar[i]['codasiento'],
                                    Glosa: detActivosPorActualizar[i]['glosa'],
                                    Diario: detActivosPorActualizar[i]['numdiario'],
                                    IdActivo: IdActivo,
                                    IdGlosa: detActivosPorActualizar[i]['idglosa'],
                                    CodActivo: detActivosPorActualizar[i]['codactivo'],
                                    IdAsientoAF: IdAsiento,
                                    Actualizado: 'SI'
                                });
                            }else {
                                Resultado.push({
                                    IdAsiento: IdAsiento,
                                    CodAsiento: detActivosPorActualizar[i]['codasiento'],
                                    Glosa: detActivosPorActualizar[i]['glosa'],
                                    Diario: detActivosPorActualizar[i]['numdiario'],
                                    IdActivo: IdActivo,
                                    IdGlosa: detActivosPorActualizar[i]['idglosa'],
                                    CodActivo: detActivosPorActualizar[i]['codactivo'],
                                    IdAsientoAF: 0,
                                    Actualizado: 'NO'
                                });
                            }    
                        }   
                    }
            return JSON.stringify({
                results: Resultado
            });
                    //return Resultado;
                } else {
                    return 'No se encontraron Activos por actualizar.';
                }
        } catch (error) {
            log.error('error', error);
            return JSON.stringify({
                results: 'id:400, No se encontraron resultados. Error controlado (ActualizaGlosaActivo).'
            });
            //return 'id:400, No se encontraron resultados. Error controlado (ActualizaGlosaActivo).';
        }
    }

    return {
        put: _put
    }

 })