/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log','N/search','N/query'], function(log,search,query) {


    function _get(context) {

        try {

            let clienteID=context.cliente
            let tipoOperacion=context.tipoOperacion

            let jsonDatos
            let jsonDatosTelefono
            let telefonos=[]
            let cliente=[]
            let i=0
            log.debug(`id_cliente: ${clienteID}`)

            if(tipoOperacion=="DatosCliente"){
                let datosCli = query.runSuiteQL({
                    //query: 'SELECT custrecord_ht_campo_list_tipo_telefono,custrecord_ht_campo_txt_telefono,custrecord_ht_campo_lbl_entidad_telefono,custrecord_ht_campo_txt_extension,b.entityid,b.vatregnumber FROM customrecord_ht_registro_telefono a  JOIN customer b on a.custrecord_ht_campo_lbl_entidad_telefono=b.id '
                    query: `SELECT b.entityid,b.firstname,b.companyname,isperson,(CASE WHEN b.isperson<>'T' THEN b.companyname ELSE CONCAT(b.firstname,CONCAT(' ',CONCAT(b.middlename,CONCAT(' ',b.lastname)))) END) as nombre_completo FROM customer b WHERE  b.entityid = ?`,
                    params: [`C-EC-${clienteID}`]
                }) 

                let objCliente=datosCli.results

                log.debug("titulo",objCliente)
                    for(let i in objCliente){
                        entityid = objCliente[i].values[0]
                        firsname = objCliente[i].values[1]
                        companyname = objCliente[i].values[2]
                        isperson = objCliente[i].values[3]
                        nombre_completo=objCliente[i].values[4]
                    }

                log.debug('titulo', `entityid: ${entityid} - firsname:${firsname}`)
                //LISTA
                cliente.push({"ENTITYID":entityid,"FIRSTNAME":firsname,"COMPANYNAME":companyname,"ISPERSON":isperson/*,"VATREGNUMBER":VatRegNumber*/,"NOMBRE_COMPLETO":nombre_completo})

                log.debug(`iterador: ${i++}`)

                return JSON.stringify({title:'DatosCliente',results:cliente})

            }

           if(tipoOperacion=="TelefonoCliente"){

               let datosTel = query.runSuiteQL({
                        //query: 'SELECT custrecord_ht_campo_list_tipo_telefono,custrecord_ht_campo_txt_telefono,custrecord_ht_campo_lbl_entidad_telefono,custrecord_ht_campo_txt_extension,b.entityid,b.vatregnumber FROM customrecord_ht_registro_telefono a  JOIN customer b on a.custrecord_ht_campo_lbl_entidad_telefono=b.id '
                        query: 'SELECT custrecord_ht_campo_list_tipo_telefono,custrecord_ht_campo_txt_telefono,custrecord_ht_campo_lbl_entidad_telefono,custrecord_ht_campo_txt_extension,b.entityid FROM customrecord_ht_registro_telefono a  JOIN customer b on a.custrecord_ht_campo_lbl_entidad_telefono=b.id  WHERE  b.entityid = ? ',
                        params: [`C-EC-${clienteID}`]
                    })

                let objDatos = datosTel.results
                log.debug("titulo",objDatos)
                    for (let i in objDatos) {

                       // log.debug(JSON.stringify(objDatos))

                        TipoTelefono = objDatos[i].values[0]
                        Telefono = objDatos[i].values[1]
                        EntidadTelefono = objDatos[i].values[2]
                        Extension = objDatos[i].values[3]
                        CustomerID = objDatos[i].values[4]
                       // VatRegNumber = objDatos[i].values[5]
                     
                        log.debug('titulo', `tipo_telefono: ${TipoTelefono} - telefono:${Telefono}`)
                        //LISTA
                        telefonos.push({"CODIGO":TipoTelefono,"TIPO":TipoTelefono,"TELEFONO":Telefono,"CUSTOMERID":CustomerID/*,"VATREGNUMBER":VatRegNumber*/})

                        log.debug(`iterador: ${i++}`)

                    }

                    //return JSON.stringify(objDatos)
                    return JSON.stringify({title:'DatosTelefono',results:telefonos})
           }

           if(tipoOperacion=="DireccionCliente"){
                let datosDirec = query.runSuiteQL({
                    //query: 'SELECT custrecord_ht_campo_list_tipo_telefono,custrecord_ht_campo_txt_telefono,custrecord_ht_campo_lbl_entidad_telefono,custrecord_ht_campo_txt_extension,b.entityid,b.vatregnumber FROM customrecord_ht_registro_telefono a  JOIN customer b on a.custrecord_ht_campo_lbl_entidad_telefono=b.id '
                    query: 'SELECT * FROM custform_29_7451241_sb1_776',
                    //params: [`C-EC-${clienteID}`]
                })
           }

           if(tipoOperacion=="TelefonoTotalCliente"){
                let datostelef = query.runSuiteQL({
                    //query: 'SELECT custrecord_ht_campo_list_tipo_telefono,custrecord_ht_campo_txt_telefono,custrecord_ht_campo_lbl_entidad_telefono,custrecord_ht_campo_txt_extension,b.entityid,b.vatregnumber FROM customrecord_ht_registro_telefono a  JOIN customer b on a.custrecord_ht_campo_lbl_entidad_telefono=b.id '
                    query: 'SELECT a.* FROM customrecord_ht_registro_telefono a  JOIN customer b on a.custrecord_ht_campo_lbl_entidad_telefono=b.id  WHERE  b.entityid = ?',
                    params: [`C-EC-${clienteID}`]
                })

                let objDatos = datostelef.results
                
                return JSON.stringify({title:'DatosTelefono',objDatos})
            }



        } catch (error) {
            log.debug({title: 'Error', results: error})
            return JSON.stringify({title:'Error',results:error.message})
        }

        
    }

    function _post(context) {
        
    }

    function _put(context) {
        
    }

    function _delete(context) {
        
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});
