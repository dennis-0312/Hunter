/**
 * @NApiVersion 2.1
 */

class Factura {
    constructor(param, parametrizacion, aplicacion, valor) {
        this.param = param;
        this.parametrizacion = { 'parametrizacion': parametrizacion };
        this.aplicacion = aplicacion;
        this.valor = valor;
    }

    params() {
        return this.valor
    }
}