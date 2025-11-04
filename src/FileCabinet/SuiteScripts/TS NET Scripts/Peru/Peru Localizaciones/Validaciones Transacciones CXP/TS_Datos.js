/**
 * @NApiVersion 2.1
 * @Author dfernandez
 */
define([
    'N/runtime'
],
    (runtime) => {

        const getData = (name) => {
            let stringData = runtime.getCurrentScript().getParameter({ name: name });
            stringData = stringData.replace(/\s+/g, '');
            stringData = JSON.parse(stringData);
            return stringData;
        }

        const extractingData = (objeto, arreglo, relacion, eventMode, currentRecord) => {
            console.log('eventMode', eventMode);
            if (eventMode == 'edit' && currentRecord.type != 'expensereport') {
                const objetoAdicional = { internalid: currentRecord.id };
                Object.assign(objeto, objetoAdicional);
                const arregloAdicional = ["AND", ["internalid", "noneof", "?"]]
                arreglo.push(...arregloAdicional);
                const arregloAdicional2 = [["internalid", "internalid"]]
                relacion.push(...arregloAdicional2);
            }

            console.log("Nuevos Objetos ==================================================")
            console.log(objeto);
            console.log(arreglo);
            console.log(relacion);
            const mapeo = Object.fromEntries(relacion);
            let arregloFinal = arreglo.map((elemento) => {
                if (Array.isArray(elemento)) { // Si es un arreglo (filtro)
                    const clave = elemento[0]; // Obtener la clave del filtro (ej: "vendor.internalid")
                    if (mapeo[clave] && elemento[elemento.length - 1] === "?") {
                        // Reemplazar el ? con el valor del objeto
                        elemento[elemento.length - 1] = objeto[mapeo[clave]];
                    }
                }
                return elemento;
            });

            return arregloFinal;
        }


        return {
            getData,
            extractingData
        }

    });



// const getData2 = (name) => {
//     const stringData = runtime.getCurrentScript().getParameter({ name: name });
//     const objData = stringData.replace(/[\[\]]/g, '').split(',').map(elemento => elemento.trim());
//     return objData;
// }
