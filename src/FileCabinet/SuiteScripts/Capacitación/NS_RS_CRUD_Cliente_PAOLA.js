/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log','N/record'], (log,record)=>{

    function _get(context) {
        try {

            let idCliente = context.idCliente
            
            let objRecord=record.load({type:record.Type.CUSTOMER,id:idCliente,isDynamic:true})

            let companyname=objRecord.getValue({fieldId:'companyname'})
            let email=objRecord.getValue({fieldId:'email'})
            let phone=objRecord.getValue({fieldId:'phone'})
            let subsidiary=objRecord.getText({fieldId:'subsidiary'})

            log.debug('companyname',companyname)

            return JSON.stringify({companyname:companyname,email:email,phone:phone,subsidiary:subsidiary})

        } catch (error) {
            log.error('Error',error)
        }

    }

    function _post (context)  {
        try {
            //Request (recuperación de la solicitud, de los parametros de entrada)
            let isperson=context.isperson
            let companyname= context.companyname
            let email=context.email
            let phone= context.phone
            let subsidiary=context.subsidiary

            let objRecord = record.create({
                type:record.Type.CUSTOMER,
                isDynamic: false
             })

             objRecord.setValue({fieldId:'isperson', value:isperson,ignoreFieldChange:true})
             objRecord.setValue({fieldId:'companyname',value:companyname,ignoreFieldChange:true})
             objRecord.setValue({fieldId:'email',value:email,ignoreFieldChange:true})
             objRecord.setValue({fieldId:'phone',value:phone,ignoreFieldChange:true})
             objRecord.setValue({fieldId:'subsidiary',value:subsidiary,ignoreFieldChange:true})
             let recordID=objRecord.save({enableSourcing:false,ignoreMandatoryFields: true})

             log.debug('Result',recordID) //log a nivel de netsuit
             return {status:200,idClienteCreado:recordID}

        } catch (error) {
            log.error('Error',error) 
        }
    }

    function _put(context) {
            let idCliente=context.idCliente
            let companyname=context.companyname
            let phone=context.phone

            //abrir el registro
            let objRecord=record.load({type:record.Type.CUSTOMER, id:idCliente, isDynamic:true})

            objRecord.setValue({fieldId:'companyname',value:companyname,ignoreFieldChange:true})
            objRecord.setValue({fieldId:'phone',value:phone,ignoreFieldChange:true})
            let recordID=objRecord.save({enableSourcing:false,ignoreMandatoryFields: true})

            log.debug('ERROR PUT',recordID)
            return {id:recordID,success:1}

    }

    function _delete(context) {
        let idCustomer=context.idCustomer
        record.delete({type:record.Type.CUSTOMER,id:idCustomer})

        log.debug('DELETE',idCustomer)
        return JSON.stringify({resultado:"Registro Eliminado"})
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
})
