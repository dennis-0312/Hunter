/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/encode', 'N/task'], function (log, https, encode, task) {
    function _post(context) {
        log.error("context-sendPXServer", context);
        /*let mapReduceScript = task.create({ taskType: task.TaskType.MAP_REDUCE });
        mapReduceScript.scriptId = 'customscript_ts_mr_px_admin';
        mapReduceScript.deploymentId = 'customdeploy_ts_mr_px_admin';
        mapReduceScript.params = {
            'custscript_strtoken': 'SH2PX20230220',
            'custscript_username': 'PxPrTest',
            'custscript_password': 'PX12%09#w',
            'custscript_numeroorden': '1101895503',
            'custscript_usuarioingreso': 'PRUEBAEVOL',
            'custscript_operacionorden': '001'
    
        };
        let mapReduceTaskId = mapReduceScript.submit();
        return true;*/
        let headers1 = [];
        headers1['Content-Type'] = 'text/xml';
        headers1['SOAPAction'] = 'http://tempuri.org/AutenticacionUsuarioPx';
        var raw = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n  <soap:Header>\r\n    <SeguridadPx xmlns=\"http://tempuri.org/\">\r\n " +
            "<StrToken>" + context.StrToken + "</StrToken>\r\n" +
            "<UserName>" + context.UserName + "</UserName>\r\n" +
            "<Password>" + context.Password + "</Password>\r\n" +
            "</SeguridadPx>\r\n  </soap:Header>\r\n  <soap:Body>\r\n" +
            "<AutenticacionUsuarioPx xmlns=\"http://tempuri.org/\" />\r\n  </soap:Body>\r\n</soap:Envelope>";

        log.debug('raw', raw);
        const resp = https.post({
            url: "https://www2.huntermonitoreo.com/API_PX/WSPX.asmx?op=AutenticacionUsuarioPx",
            headers: headers1,
            body: raw
        });

        var xmlDoc = resp.body;
        const regex = /.*<AutenticacionUsuarioPxResult>(.*)<\/AutenticacionUsuarioPxResult>.*/;

        let rowXml = getBodyByOperacionOrden(context);

        log.debug("rowXml", rowXml);
        let string = xmlDoc.replace(regex, '$1');
        let headers2 = [];
        headers2['Content-Type'] = 'text/xml';
        headers2['SOAPAction'] = 'http://tempuri.org/InsertaOrden';
        headers2['Authorization'] = 'Bearer 2bbca8dd-81ca-4de8-ae3e-3f212286cafe';
        var rawInsert = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n" +
            "<soap:Header>\r\n  " +
            "<SeguridadPx xmlns=\"http://tempuri.org/\">\r\n" +
            "<StrToken>" + context.StrToken + "</StrToken>\r\n" +
            "<AutenticacionToken>" + string + "</AutenticacionToken>\r\n" +
            "<UserName>" + context.UserName + "</UserName>\r\n" +
            "<Password>" + context.Password + "</Password>\r\n" +
            "</SeguridadPx>\r\n" +
            "</soap:Header>\r\n" +
            "<soap:Body>\r\n" +
            "<InsertaOrden xmlns=\"http://tempuri.org/\">\r\n" +
            "<strXml>\r\n" +
            "<![CDATA[\r\n" +
            rowXml + "\r\n" +
            "]]>\r\n" +
            "</strXml>\r\n" +
            "</InsertaOrden>\r\n" +
            "</soap:Body>\r\n" +
            "</soap:Envelope>";
        const resp2 = https.post({
            url: "https://www2.huntermonitoreo.com/API_PX/WSPX.asmx?op=InsertaOrden",
            headers: headers2,
            body: rawInsert
        });


        const regex2 = /.*<string>(.*)<\/string>.*/;
        let Respon = resp2.body.replace(regex2, '$1');
        log.debug('XML', rawInsert);
        log.debug('Response-Hunter-PXADMIN', resp2);
        return Respon;

    }

    const getBodyByOperacionOrden = (context) => {
        let rowXml = "";
        rowXml = getInstalacionBody(context);
        /*
        if (context.OperacionOrden == "002") {
          rowXml = getDesinstalacionBody(context);
        } else {
          rowXml = getInstalacionBody(context);
        }*/
        return rowXml;
    }

    const getInstalacionBody = (context) => {
        log.debug('Type of', typeof context.NombrePropietario);
        let rowXml = "<Ordenes><Orden><NumeroOrden>" + context.NumeroOrden + "</NumeroOrden><UsuarioIngreso>" + context.UsuarioIngreso + "</UsuarioIngreso>" +
            "<OperacionOrden>" + context.OperacionOrden + "</OperacionOrden>" +
            "<Vehiculo>" +
            "<Placa>" + (context.Placa || "") + "</Placa>" +
            "<IdMarca>" + (context.IdMarca || "") + "</IdMarca>" +
            "<DescMarca>" + (context.DescMarca || "") + "</DescMarca>" +
            "<IdModelo>" + (context.IdModelo || "") + "</IdModelo>" +
            "<DescModelo>" + (context.DescModelo || "") + "</DescModelo>" +
            "<CodigoVehiculo>" + (context.CodigoVehiculo || "") + "</CodigoVehiculo>" +
            "<Chasis>" + (context.Chasis || "") + "</Chasis>" +
            "<Motor>" + (context.Motor || "") + "</Motor>" +
            "<Color>" + (context.Color || "") + "</Color>" +
            "<Anio>" + (context.Anio || "") + "</Anio>" +
            "<Tipo>" + (context.Tipo || "") + "</Tipo>" +
            "</Vehiculo>" +
            "<Dispositivo>" +
            "<Vid>" + (context.Vid || "") + "</Vid>" +
            "<IdProducto>" + (context.IdProducto || "") + "</IdProducto>" +
            "<DescProducto>" + (context.DescProducto || "") + "</DescProducto>" +
            "<CodMarcaDispositivo>" + (context.CodMarcaDispositivo || "") + "</CodMarcaDispositivo>" +
            "<MarcaDispositivo>" + (context.MarcaDispositivo || "") + "</MarcaDispositivo>" +
            "<CodModeloDispositivo>" + (context.CodModeloDispositivo || "") + "</CodModeloDispositivo>" +
            "<ModeloDispositivo>" + (context.ModeloDispositivo || "") + "</ModeloDispositivo>" +
            "<Sn>" + (context.Sn || "") + "</Sn>" +
            "<Imei>" + (context.Imei || "") + "</Imei>" +
            "<NumeroCamaras>" + (context.NumeroCamaras || "") + "</NumeroCamaras>" +
            "<DireccionMac>" + (context.DireccionMac || "") + "</DireccionMac>" +
            "<Icc>" + (context.Icc || "") + "</Icc>" +
            "<NumeroCelular>" + (context.NumeroCelular || "") + "</NumeroCelular>" +
            "<Operadora>" + (context.Operadora || "") + "</Operadora>" +
            "<EstadoSim>" + (context.EstadoSim || "") + "</EstadoSim>" +
            "<ServiciosInstalados>" + context.ServiciosInstalados + "</ServiciosInstalados>" +
            "<OperacionDispositivo>" + (context.OperacionDispositivo || "") + "</OperacionDispositivo>" +
            "<VidAnterior>" + (context.VidAnterior || "") + "</VidAnterior>" +
            "</Dispositivo>" +
            "<Propietario>" +
            "<IdentificadorPropietario>" + (context.IdentificadorPropietario || "") + "</IdentificadorPropietario>" +
            "<NombrePropietario>" + (context.NombrePropietario || "") + "</NombrePropietario>" +
            "<ApellidosPropietario>" + (context.ApellidosPropietario || "") + "</ApellidosPropietario>" +
            "<DireccionPropietario>" + (context.DireccionPropietario || "") + "</DireccionPropietario>" +
            "<ConvencionalPropietario>" + (context.ConvencionalPropietario || "") + "</ConvencionalPropietario>" +
            "<CelularPropietario>" + (context.CelularPropietario || "") + "</CelularPropietario>" +
            "<EmailPropietario>" + (context.EmailPropietario || "") + "</EmailPropietario>" +
            "</Propietario>" +
            "<Monitor>" +
            "<IdentificadorMonitorea>" + (context.IdentificadorMonitorea || "") + "</IdentificadorMonitorea>" +
            "<NombreMonitorea>" + (context.NombreMonitorea || "") + "</NombreMonitorea>" +
            "<ApellidosMonitorea>" + (context.ApellidosMonitorea || "") + "</ApellidosMonitorea>" +
            "<DireccionMonitorea>" + (context.DireccionMonitorea || "") + "</DireccionMonitorea>" +
            "<ConvencionalMonitorea>" + (context.ConvencionalMonitorea || "") + "</ConvencionalMonitorea>" +
            "<CelularMonitorea>" + (context.CelularMonitorea || "") + "</CelularMonitorea>" +
            "<EmailMonitorea>" + (context.EmailMonitorea || "") + "</EmailMonitorea>" +
            "</Monitor>" +
            "<Concesionario>" +
            "<IdentificadorConcesionario>" + (context.IdentificadorConcesionario || "") + "</IdentificadorConcesionario>" +
            "<RazonSocialConcesionario>" + (context.RazonSocialConcesionario || "") + "</RazonSocialConcesionario>" +
            "<DireccionConcesionario>" + (context.DireccionConcesionario || "") + "</DireccionConcesionario>" +
            "<ConvencionalConcesionario>" + (context.ConvencionalConcesionario || "") + "</ConvencionalConcesionario>" +
            "<CelularConcesionario>" + (context.CelularConcesionario || "") + "</CelularConcesionario>" +
            "<EmailConcesionario>" + (context.EmailConcesionario || "") + "</EmailConcesionario>" +
            "</Concesionario>" +
            "<Financiera>" +
            "<IdentificadorFinanciera>" + (context.IdentificadorFinanciera || "") + "</IdentificadorFinanciera>" +
            "<RazonSocialFinanciera>" + (context.RazonSocialFinanciera || "") + "</RazonSocialFinanciera>" +
            "<DireccionFinanciera>" + (context.DireccionFinanciera || "") + "</DireccionFinanciera>" +
            "<ConvencionalFinanciera>" + (context.ConvencionalFinanciera || "") + "</ConvencionalFinanciera>" +
            "<CelularFinanciera>" + (context.CelularFinanciera || "") + "</CelularFinanciera>" +
            "<EmailFinanciera>" + (context.EmailFinanciera || "") + "</EmailFinanciera>" +
            "</Financiera>" +
            "<Aseguradora>" +
            "<IdentificadorAseguradora>" + (context.IdentificadorAseguradora || "") + "</IdentificadorAseguradora>" +
            "<RazonSocialAseguradora>" + (context.RazonSocialAseguradora || "") + "</RazonSocialAseguradora>" +
            "<DireccionAseguradora>" + (context.DireccionAseguradora || "") + "</DireccionAseguradora>" +
            "<ConvencionalAseguradora>" + (context.ConvencionalAseguradora || "") + "</ConvencionalAseguradora>" +
            "<CelularAseguradora>" + (context.CelularAseguradora || "") + "</CelularAseguradora>" +
            "<EmailAseguradora>" + (context.EmailAseguradora || "") + "</EmailAseguradora>" +
            "</Aseguradora>" +
            "<Convenio>" +
            "<IdentificadorConvenio>" + (context.IdentificadorConvenio || "") + "</IdentificadorConvenio>" +
            "<RazonSocialConvenio>" + (context.RazonSocialConvenio || "") + "</RazonSocialConvenio>" +
            "<DireccionConvenio>" + (context.DireccionConvenio || "") + "</DireccionConvenio>" +
            "<ConvencionalConvenio>" + (context.ConvencionalConvenio || "") + "</ConvencionalConvenio>" +
            "<CelularConvenio>" + (context.CelularConvenio || "") + "</CelularConvenio>" +
            "<EmailConvenio>" + (context.EmailConvenio || "") + "</EmailConvenio></Convenio></Orden></Ordenes>";
        return rowXml;
    }

    const getDesinstalacionBody = (context) => {
        let rowXml = "<Ordenes><Orden><NumeroOrden>" + context.NumeroOrden + "</NumeroOrden><UsuarioIngreso>" + context.UsuarioIngreso + "</UsuarioIngreso>" +
            "<OperacionOrden>" + context.OperacionOrden + "</OperacionOrden>" +
            "<Vehiculo>" +
            "<CodigoVehiculo>" + (context.CodigoVehiculo || "") + "</CodigoVehiculo>" +
            "</Vehiculo>" +
            "<Dispositivo>" +
            "<Vid>" + (context.Vid || "") + "</Vid>" +
            "<OperacionDispositivo>" + (context.OperacionDispositivo || "") + "</OperacionDispositivo>" +
            "</Dispositivo>" +
            "</Orden></Ordenes>";
        return rowXml;
    }

    return {
        post: _post
    }
});