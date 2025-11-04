/**
 * @author dfernandez
 * @NApiVersion 2.1
 */
define(['N/runtime', 'N/log'],
    /**
 * @param{runtime} runtime
 */
    (runtime, log) => {

        class Parameters {
            constructor() {
                this.felPlantilla = '';
                this.felMetodoEnvio = '';
                this.codRentencionImpuestos = '';
                this.tipoComprobanteRetencion = '';
                this.formRetencion = '';
                this.cuentaContable = '';
                this.folderOutputFiles = '';
                this.importeMinimo = '';
                this.taxCode = '';
            }

            getFieldValues(objParameters) {
                let objParams = {};
                for (let key in objParameters) {
                    if (objParameters.hasOwnProperty(key)) { // Verificar que la clave pertenezca al objeto
                        const scriptParameterKey = objParameters[key]; // Obtener el nombre del parámetro de script
                        const scriptParameterValue = runtime.getCurrentScript().getParameter({ name: scriptParameterKey }); // Obtener el valor del parámetro
                        objParams[key] = scriptParameterValue; // Asignar el valor al objeto de resultados
                    }
                }
                return objParams;
            }

            // getFieldValueByName(name) {
            //     return runtime.getCurrentScript().getParameter({ name: this.cuentaContable });
            // }

        }

        return Parameters

    });
