/**
 * @NApiVersion 2.1
 */

class Servicio {
    constructor(customer, bien, date, department, clase, location, otherrefnum, memo, salesrep, terms) {
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
    }

    header() {
        let array = new Array();
        if (this.customer.value != null && this.customer.value.length > 0) { array.push(this.customer) }
        if (this.bien.value != null && this.bien.value.length > 0) { array.push(this.bien) }
        if (this.date.value != null && JSON.stringify(this.date.value).length > 0) { array.push(this.date) }
        if (this.department.value != null && this.department.value.length > 0) { array.push(this.department) }
        if (this.clase.value != null && this.clase.value.length > 0) { array.push(this.clase) }
        if (this.location.value != null && this.location.value.length > 0) { array.push(this.location) }
        if (this.otherrefnum.value != null && this.otherrefnum.value.length > 0) { array.push(this.otherrefnum) }
        if (this.memo.value != null && this.memo.value.length > 0) { array.push(this.memo) }
        if (this.salesrep.value != null && this.salesrep.value.length > 0) { array.push(this.salesrep) }
        if (this.terms.value != null && this.terms.value.length > 0) { array.push(this.terms) }
        return array;
    }
}

class Detail {
    constructor(item, price, taxcode, taxrate1, quantity, department, clase, location, units, description, rate, grossamt, amount, tax1amt) {
        this.item = { 'field': 'item', 'value': item };
        this.price = { 'field': 'price', 'value': price };
        this.taxcode = { 'field': 'taxcode', 'value': taxcode };
        this.taxrate1 = { 'field': 'taxrate1', 'value': taxrate1 };
        this.quantity = { 'field': 'quantity', 'value': quantity };
        this.department = { 'field': 'department', 'value': department };
        this.clase = { 'field': 'clase', 'value': clase };
        this.location = { 'field': 'location', 'value': location };
        this.units = { 'field': 'units', 'value': units };
        this.description = { 'field': 'description', 'value': description };
        this.rate = { 'field': 'rate', 'value': rate };
        this.grossamt = { 'field': 'grossamt', 'value': Number.parseFloat(grossamt).toFixed(2) };
        this.amount = { 'field': 'amount', 'value': (parseFloat(this.rate) * parseFloat(this.quantity)) };
        this.tax1amt = { 'field': 'tax1amt', 'value': tax1amt };
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
        return array;
    }
}
