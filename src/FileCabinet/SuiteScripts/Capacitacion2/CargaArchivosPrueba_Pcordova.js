/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log','N/file'], function (log,file) {

    function _get(context) {
        try {
            let fileObj = file.create({
                name: 'PruebaPcordova.txt',
                fileType: file.Type.PLAINTEXT,
                contents: 'Hello World\nHello World ! 1'
            })

            fileObj.encoding=file.encoding.MAC_ROMAN
            fileObj.folder = 30

            let idfile = fileObj.save();
            
        } catch (error) {
            log.error('Error-GET',error)
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
