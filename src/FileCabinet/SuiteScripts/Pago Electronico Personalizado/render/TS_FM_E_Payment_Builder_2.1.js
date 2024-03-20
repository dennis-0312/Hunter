/**
 * @NApiVersion 2.1
 * @NModuleScope Public
*/

define ([], function () {

    const builder = () => {
        let ftlString = "";
        ftlString += '<#setting locale = "computer">\n';
        ftlString += '<#setting number_format = "computer">\n';
        ftlString += '<#assign jsonContent = jsonString.text?eval>\n';
        //ftlString += '<#assign header = jsonContent.header>\n';
        //ftlString += '<#assign body = jsonContent.body>\n';
        return ftlString;
    }

    const computeTotalAmount = () => {
        let ftlString = "";

        return ftlString;
    }

    const create = (ftlBodyContent) => {
        let ftlString = "";
        ftlString += builder();
        ftlString += computeTotalAmount();
        ftlString += ftlBodyContent.replace(/<!--[\s\S]*?-->/g, '');
        return ftlString;
    }

    return {
        create
    }
});
