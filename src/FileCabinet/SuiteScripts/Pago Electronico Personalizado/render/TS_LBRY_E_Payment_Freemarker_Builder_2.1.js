/**
 * @NApiVersion 2.1
 * @NModuleScope Public
*/

define([], function () {

    const builder = () => {
        let ftlString = "";
        ftlString += '<#setting locale = "computer">\n';
        ftlString += '<#setting number_format = "computer">\n';
        ftlString += '<#assign jsonContent = jsonString.text?eval>\n';
        ftlString += '<#assign paymentbatch = jsonContent.paymentBatch>\n';
        ftlString += '<#assign payments = paymentbatch.detail>\n';
        ftlString += '<#assign vendors = jsonContent.vendors>\n';
        ftlString += '<#assign customers = jsonContent.customers>\n';
        ftlString += '<#assign employees = jsonContent.employees>\n';
        ftlString += '<#assign subsidiary = jsonContent.subsidiary>\n';
        ftlString += '<#assign transactions = jsonContent.transactions>\n';
        ftlString += '<#assign aditional = jsonContent.aditional>\n';
        return ftlString;
    }

    const computeTotalAmount = () => {
        let ftlString = "";
        return ftlString;
    }

    const setPadding = () => {
        let ftlString = '<#function setPadding valor posicion caracter numeroDigitos>\n';
        ftlString += '<#if valor?length < numeroDigitos>\n';
        ftlString += '<#assign paddingLength = numeroDigitos - valor?length>\n';
        ftlString += '<#assign padding = "">\n';
        ftlString += '<#list 1..paddingLength as _>\n';
        ftlString += '<#assign padding = padding + caracter>\n';
        ftlString += '</#list>\n';
        ftlString += '<#if posicion == "left">\n';
        ftlString += '<#return padding + valor>\n';
        ftlString += '<#elseif posicion == "right">\n';
        ftlString += '<#return valor + padding>\n';
        ftlString += '<#else>\n';
        ftlString += '<#return valor>\n';
        ftlString += '</#if>\n';
        ftlString += '<#else>\n';
        ftlString += '<#return valor[0..numeroDigitos-1]>\n';
        ftlString += '</#if>\n';
        ftlString += '</#function>\n';
        return ftlString;
    }

    const setLength = () => {
        let ftlString = '<#function setLength valor numeroDigitos>\n';
        ftlString += '<#if valor?length < numeroDigitos>\n';
        ftlString += '<#assign paddingLength = numeroDigitos - valor?length>\n';
        ftlString += '<#assign padding = "">\n';
        ftlString += '<#list 1..paddingLength as _>\n';
        ftlString += '<#assign padding = padding + " ">\n';
        ftlString += '</#list>\n';
        ftlString += '<#return valor + padding>\n';
        ftlString += '<#else>\n';
        ftlString += '<#return valor[0..numeroDigitos-1]>\n';
        ftlString += '</#if>\n';
        ftlString += '</#function>\n';
        return ftlString;
    }

    const setMaxLength = () => {
        var ftlString = '<#function setMaxLength value total>\n';
        ftlString += '<#return value[0..*total]>\n';
        ftlString += '</#function>\n';
        return ftlString;
    }

    const formatAccountName = () => {
        var ftlString = '<#function formatAccountName accountName>\n';
        ftlString += '<#assign splitedName = accountName?split(" : ")>\n';
        ftlString += '<#return splitedName[splitedName?size - 1]>\n';
        ftlString += '</#function>\n';
        return ftlString;
    }

    const create = (ftlBodyContent) => {
        let ftlString = "";
        ftlString += builder();
        ftlString += computeTotalAmount();
        ftlString += setPadding();
        ftlString += setLength();
        ftlString += setMaxLength();
        ftlString += formatAccountName();
        ftlString += ftlBodyContent.replace(/<!--[\s\S]*?-->/g, '');
        return ftlString;
    }

    return {
        create
    }
});
