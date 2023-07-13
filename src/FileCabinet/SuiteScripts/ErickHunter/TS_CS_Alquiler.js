
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search'], (url, currentRecord, dialog, search) => {

    const pageInit = (scriptContext) => {
     
        console.log(2);
    }

  
    const cancelarFiltros = (item) => {
        console.log(item);
    }

  

    return {
        pageInit: pageInit,
       
        cancelarFiltros: cancelarFiltros,
        
    };

});
