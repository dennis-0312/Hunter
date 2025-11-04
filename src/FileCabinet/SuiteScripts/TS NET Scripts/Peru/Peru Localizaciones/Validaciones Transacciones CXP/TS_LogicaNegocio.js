/**
 * @NApiVersion 2.1
 * @Author dfernandez
 */
define([
    'N/ui/dialog',
    './TS_Datos',
    './TS_AccesoDatos',
    './TS_TransaccionCXP_Class'
],
    (dialog, datos, accessData, TransaccionCXP) => {

        const validationResponse = (scriptContext, eventMode) => {
            try {
                const currentRecord = scriptContext.currentRecord;
                const data = datos.getData('custscript_ts_get_data_transaction');

                const transactioncxp = new TransaccionCXP();
                transactioncxp.entidad = data[0];
                transactioncxp.tipoDocumento = data[1];
                transactioncxp.serie = data[2];
                transactioncxp.nroImpreso = data[3];
                transactioncxp.subsidiaria = data[4];

                console.log("transactioncxp ==================================================")
                console.log(transactioncxp)
                const mappData = accessData.mappingData(currentRecord, transactioncxp);
                console.log("mappData ==================================================")
                console.log(mappData);
                console.log(JSON.stringify(mappData));

                const searchData = datos.getData('custscript_ts_get_data_search');
                console.log("searchData ==================================================")
                console.log(searchData);
                console.log(JSON.stringify(searchData));

                const dataRelacion = datos.getData('custscript_ts_get_data_relaciones');
                console.log("dataRelacion ==================================================")
                console.log(dataRelacion);
                console.log(JSON.stringify(dataRelacion));

                const filtersData = datos.extractingData(mappData, searchData, dataRelacion, eventMode, currentRecord);
                console.log("filtersData ==================================================")
                console.log(filtersData);
                console.log(JSON.stringify(filtersData));

                const resultData = accessData.validateData(filtersData);
                console.log("resultData ==================================================")
                console.log(resultData);

                const verifyExistRecord = transactioncxp.existRecord(resultData);
                console.log("verifyExistRecord ==================================================")
                console.log(verifyExistRecord);

                if (!verifyExistRecord) {
                    dialog.alert({
                        title: 'Validación de duplicidad',
                        message: 'Ya existe una transacción con el mismo tipo de documento, serie y correlativo para este proveedor.'
                    });
                    return false
                }

                return true;
            } catch (error) {
                console.log(error)
                return false;
            }
        }

        return {
            validationResponse
        };

    });
