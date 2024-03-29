/**
 * @NApiVersion 2.1
 */

class ServiceOrder {
    constructor(customer, bien, date, department, clase, location, otherrefnum, memo, salesrep, terms, issueinvoice, consideracion, ejecutivareferencia, novedades, notacliente, cambpropietarioconv, canaldistribucion, servicios, ejecutivagestion) {
        this.customer = { 'field': 'entity', 'value': customer }
        this.bien = { 'field': 'custbody_ht_so_bien', 'value': bien }
        this.date = { 'field': 'trandate', 'value': new Date(date) }
        this.department = { 'field': 'department', 'value': department }
        this.clase = { 'field': 'class', 'value': clase }
        this.location = { 'field': 'location', 'value': location }
        this.otherrefnum = { 'field': 'otherrefnum', 'value': otherrefnum }
        this.memo = { 'field': 'memo', 'value': memo }
        this.salesrep = { 'field': 'salesrep', 'value': salesrep }
        this.terms = { 'field': 'terms', 'value': terms }
        this.billto = { 'field': 'custbody_ht_facturar_a', 'value': customer }
        this.fromsatellite = { 'field': 'custbodycustbody_ht_os_created_from_sa', 'value': true }
        this.issueinvoice = issueinvoice
        this.issueinvoicetrue = { 'field': 'custbody_ht_os_issue_invoice', 'value': true }
        this.consideracion = { 'field': 'custbody_ht_os_consideracion', 'value': consideracion }
        this.ejecutivareferencia = { 'field': 'custbody_ht_os_ejecutivareferencia', 'value': ejecutivareferencia }
        this.novedades = { 'field': 'custbody_ht_os_novedades', 'value': novedades }
        this.notacliente = { 'field': 'custbodyec_nota_cliente', 'value': notacliente }
        this.cambpropietarioconv = { 'field': 'custbody_es_cambio_de_propietario', 'value': cambpropietarioconv }
        this.canaldistribucion = { 'field': 'custbody_ht_os_vendcanaldistribucion', 'value': canaldistribucion }
        this.servicios = { 'field': 'custbody_ht_os_servicios', 'value': servicios }
        this.ejecutivagestion = { 'field': 'custbody_ht_os_ejecutiva_backoffice', 'value': ejecutivagestion }
    }

    header() {
        let array = new Array();
        array.push(this.fromsatellite);
        if (this.customer.value != null && this.customer.value.length > 0) {
            array.push(this.customer)
            array.push(this.billto)
        }
        if (this.bien.value != null && this.bien.value.length > 0) { array.push(this.bien) }
        if (this.date.value != null && JSON.stringify(this.date.value).length > 0) { array.push(this.date) }
        if (this.department.value != null && this.department.value.length > 0) { array.push(this.department) }
        if (this.clase.value != null && this.clase.value.length > 0) { array.push(this.clase) }
        if (this.location.value != null && this.location.value.length > 0) { array.push(this.location) }
        if (this.otherrefnum.value != null && this.otherrefnum.value.length > 0) { array.push(this.otherrefnum) }
        if (this.memo.value != null && this.memo.value.length > 0) { array.push(this.memo) }
        if (this.salesrep.value != null && this.salesrep.value.length > 0) { array.push(this.salesrep) }
        if (this.terms.value != null && this.terms.value.length > 0) { array.push(this.terms) }
        if (this.issueinvoice == true) { array.push(this.issueinvoicetrue) }
        if (this.consideracion.value != null && this.consideracion.value.length > 0) { array.push(this.consideracion) }
        if (this.ejecutivareferencia.value != null && this.ejecutivareferencia.value.length > 0) { array.push(this.ejecutivareferencia) }
        if (this.novedades.value != null && this.novedades.value.length > 0) { array.push(this.novedades) }
        if (this.notacliente.value != null && this.notacliente.value.length > 0) { array.push(this.notacliente) }
        if (this.cambpropietarioconv.value != null && this.cambpropietarioconv.value) { array.push(this.cambpropietarioconv) }
        if (this.canaldistribucion.value != null && this.canaldistribucion.value.length > 0) { array.push(this.canaldistribucion) }
        if (this.servicios.value != null && this.servicios.value.length > 0) { array.push(this.servicios) }
        if (this.ejecutivagestion.value != null && this.ejecutivagestion.value.length > 0) { array.push(this.ejecutivagestion) }
        return array;
    }
}

class Detail {
    constructor(item, price, taxcode, taxrate1, quantity, department, clase, location, units, description, rate, grossamt, amount, tax1amt, customer, customermon, codorigen, dispcustodia) {
        this.item = { 'field': 'item', 'value': item }
        this.price = { 'field': 'price', 'value': price }
        this.taxcode = { 'field': 'taxcode', 'value': taxcode }
        this.taxrate1 = { 'field': 'taxrate1', 'value': taxrate1 }
        this.quantity = { 'field': 'quantity', 'value': quantity }
        this.department = { 'field': 'department', 'value': department }
        this.clase = { 'field': 'clase', 'value': clase }
        this.location = { 'field': 'location', 'value': location }
        this.units = { 'field': 'units', 'value': units }
        this.description = { 'field': 'description', 'value': description }
        this.rate = { 'field': 'rate', 'value': rate }
        this.grossamt = { 'field': 'grossamt', 'value': Number.parseFloat(grossamt).toFixed(2) }
        this.amount = { 'field': 'amount', 'value': (parseFloat(this.rate) * parseFloat(this.quantity)) }
        this.tax1amt = { 'field': 'tax1amt', 'value': tax1amt }
        this.customer = { 'field': 'custcol_ht_os_cliente', 'value': customer }
        this.customermon = { 'field': 'custcol_ht_os_cliente_monitoreo', 'value': customermon }
        this.codorigen = { 'field': 'custcol_ns_codigo_origen', 'value': codorigen }
        this.dispcustodia = { 'field': 'custcol_ts_dispositivo_en_custodia', 'value': dispcustodia }
    }

    detail() {
        let array = new Array();
        if (this.item.value != null && this.item.value.length > 0) { array.push(this.item) }
        if (this.price.value != null && this.price.value.length > 0) { array.push(this.price) }
        if (this.taxcode.value != null && this.taxcode.value.length > 0) { array.push(this.taxcode) }
        if (this.taxrate1.value != null && this.taxrate1.value.length > 0) { array.push(this.taxrate1) }
        if (this.quantity.value != null && this.quantity.value.length > 0) { array.push(this.quantity) }
        if (this.department.value != null && this.department.value.length > 0) { array.push(this.department) }
        if (this.clase.value != null && this.clase.value.length > 0) { array.push(this.clase) }
        if (this.location.value != null && this.location.value.length > 0) { array.push(this.location) }
        if (this.units.value != null && this.units.value.length > 0) { array.push(this.units) }
        if (this.description.value != null && this.description.value.length > 0) { array.push(this.description) }
        if (this.rate.value != null && this.rate.value.length > 0) { array.push(this.rate) }
        if (this.grossamt.value != null && this.grossamt.value.length > 0) { array.push(this.grossamt) }
        if (this.amount.value != null && this.amount.value.length > 0) { array.push(this.amount) }
        if (this.tax1amt.value != null && this.tax1amt.value.length > 0) { array.push(this.tax1amt) }
        if (this.customer.value != null && this.customer.value.length > 0) { array.push(this.customer) }
        if (this.customermon.value != null && this.customermon.value.length > 0) { array.push(this.customermon) }
        if (this.codorigen.value != null && this.codorigen.value.length > 0) { array.push(this.codorigen) }
        if (this.dispcustodia.value != null && this.dispcustodia.value.length > 0) { array.push(this.dispcustodia) }
        return array;
    }
}
