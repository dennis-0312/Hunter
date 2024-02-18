
/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/search','N/record'],

 function(search) {

    function doGet () {
        let ArrLista = [] ;

        let miBusqueda = search.load({
           id:'customsearchcustom_busqueda_os_fact_mes' 

        });

  /*       miBusqueda.filters.push(search.createFilter({
             name: 'trandate',
            operator: 'within',
            values: ['2023/09/01','2023/09/30'] 

        })); */
     

        //limita el numero de filas a traer
        let BusResultado = miBusqueda.run().getRange({
           start: 0, end: 1000 
        });

        for(var i=0; i< BusResultado.length; i++){
            ArrLista[i] = i +'-'+ [BusResultado[i].getValue('trandate') + ',' + 
                          BusResultado[i].getValue('tranid') + ',' + 
                            BusResultado[i].getValue('salesrep')];

        };

        ArrLista = BusResultado
        /*
        return JSON.stringify({
            results: BusResultado
        }); */

        //log.debug({details:  'error en busqueda'});

        return JSON.stringify(ArrLista);
    }

    return {
        'get': doGet,
    };

 });

 