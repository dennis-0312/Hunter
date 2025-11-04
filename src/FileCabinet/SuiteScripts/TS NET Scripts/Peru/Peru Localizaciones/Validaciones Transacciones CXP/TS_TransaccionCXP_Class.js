/**
 * @NApiVersion 2.1
 * @Author dfernandez
 */
define([],

    () => {

        class TransaccionCXP {
            constructor() {
                this.entidad = '';
                this.tipoDocumento = '';
                this.serie = '';
                this.nroImpreso = '';
                this.subsidiaria = '';
            }

            existRecord(count) {
                if (count == 0) {
                    return true;
                } else {
                    return false;
                }
            }
        }

        return TransaccionCXP

    });
