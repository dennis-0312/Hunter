/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {
    const URLPX = 'https://apipx.24hm.net/API_PX/WSPX.asmx'; // -> reemplezar https://www2.huntermonitoreo.com/API_PX/WSPX.asmx

    function _post(context) {
        
        log.error("context-sendPXServer", context);
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
            url: `${URLPX}?op=AutenticacionUsuarioPx`,
            headers: headers1,
            body: raw
        });
        let xmlDoc = resp.body;
        const regex = /.*<AutenticacionUsuarioPxResult>(.*)<\/AutenticacionUsuarioPxResult>.*/;
        let rowXml = getBodyByOperacionOrden(context);
        log.debug("rowXml", rowXml);
        let string = xmlDoc.replace(regex, '$1');
        let headers2 = [];
        headers2['Content-Type'] = 'text/xml';
        headers2['SOAPAction'] = 'http://tempuri.org/InsertaOrden';
        headers2['Authorization'] = 'Bearer 2bbca8dd-81ca-4de8-ae3e-3f212286cafe';
        let rawInsert = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n" +
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
            url: `${URLPX}?op=InsertaOrden`,
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
        rowXml = renovacionCobertura(context);
        return rowXml;
    }

    const renovacionCobertura = (context) => {
        //log.debug('Type of', typeof context.NombrePropietario); //* cuando no está devuelve indefinido
        let rowXml = "<Ordenes><Orden><NumeroOrden>" + context.NumeroOrden + "</NumeroOrden>" +
            "<UsuarioIngreso>" + context.UsuarioIngreso + "</UsuarioIngreso>" +
            "<OperacionOrden>" + context.OperacionOrden + "</OperacionOrden>" +
            // "<NombreEjecutiva></NombreEjecutiva>"
            // "<Ciudad></Ciudad>"
            // "<Sucursal></Sucursal>"
            // "<EstadoCartera></EstadoCartera>"
            "<FechaInicioCobertura>" + context.FechaInicioCobertura + "</FechaInicioCobertura>" +
            "<FechaFinCobertura>" + context.FechaFinCobertura + "</FechaFinCobertura>" +
            // "<Vehiculo>" +
            // "<Placa></Placa>" +
            // "<IdMarca>" + (context.IdMarca || "") + "</IdMarca>" +
            // "<DescMarca>" + (context.DescMarca || "") + "</DescMarca>" +
            // "<IdModelo>" + (context.IdModelo || "") + "</IdModelo>" +
            // "<DescModelo>" + (context.DescModelo || "") + "</DescModelo>" +
            // "<CodigoVehiculo>" + (context.CodigoVehiculo || "") + "</CodigoVehiculo>" +
            // "<Chasis></Chasis>" +
            // "<Motor></Motor>" +
            // "<Color></Color>" +
            // "<Anio></Anio>" +
            // "<Tipo></Tipo>" +
            // "</Vehiculo>" +
            // "<Dispositivo>" +
            "<Vid>" + (context.Vid || "") + "</Vid>" +
            // "<IdProducto></IdProducto>" +
            // "<DescProducto></DescProducto>" +
            // "<CodMarcaDispositivo>" + (context.CodMarcaDispositivo || "") + "</CodMarcaDispositivo>" +
            // "<MarcaDispositivo>" + (context.MarcaDispositivo || "") + "</MarcaDispositivo>" +
            // "<CodModeloDispositivo>" + (context.CodModeloDispositivo || "") + "</CodModeloDispositivo>" +
            // "<ModeloDispositivo>" + (context.ModeloDispositivo || "") + "</ModeloDispositivo>" +
            // "<Sn>" + (context.Sn || "") + "</Sn>" +
            // "<Imei>" + (context.Imei || "") + "</Imei>" +
            // "<NumeroCamaras>" + (context.NumeroCamaras || "") + "</NumeroCamaras>" +
            // "<DireccionMac>" + (context.DireccionMac || "") + "</DireccionMac>" +
            // "<Icc>" + (context.Icc || "") + "</Icc>" +
            // "<NumeroCelular>" + (context.NumeroCelular || "") + "</NumeroCelular>" +
            // "<Operadora>" + (context.Operadora || "") + "</Operadora>" +
            // "<EstadoSim>" + (context.EstadoSim || "") + "</EstadoSim>" +
            // "<ServiciosInstalados></ServiciosInstalados>" +
            "<OperacionDispositivo>" + (context.OperacionDispositivo || "") + "</OperacionDispositivo>"
            // "<VidAnterior></VidAnterior>" +
            // "</Dispositivo>" +
            // "<Propietario>" +
            // "<IdentificadorPropietario></IdentificadorPropietario>" +
            // "<NombrePropietario></NombrePropietario>" +
            // "<ApellidosPropietario></ApellidosPropietario>" +
            // "<DireccionPropietario></DireccionPropietario>" +
            // "<ConvencionalPropietario></ConvencionalPropietario>" +
            // "<CelularPropietario></CelularPropietario>" +
            // "<EmailPropietario></EmailPropietario>" +
            // "</Propietario>" +
            // "<Monitor>" +
            // "<IdentificadorMonitorea></IdentificadorMonitorea>" +
            // "<NombreMonitorea></NombreMonitorea>" +
            // "<ApellidosMonitorea></ApellidosMonitorea>" +
            // "<DireccionMonitorea></DireccionMonitorea>" +
            // "<ConvencionalMonitorea></ConvencionalMonitorea>" +
            // "<CelularMonitorea></CelularMonitorea>" +
            // "<EmailMonitorea></EmailMonitorea>" +
            // "</Monitor>" +
            // "<Concesionario>" +
            // "<IdentificadorConcesionario></IdentificadorConcesionario>" +
            // "<RazonSocialConcesionario></RazonSocialConcesionario>" +
            // "<DireccionConcesionario></DireccionConcesionario>" +
            // "<ConvencionalConcesionario></ConvencionalConcesionario>" +
            // "<CelularConcesionario></CelularConcesionario>" +
            // "<EmailConcesionario></EmailConcesionario>" +
            // "</Concesionario>" +
            // "<Financiera>" +
            // "<IdentificadorFinanciera></IdentificadorFinanciera>" +
            // "<RazonSocialFinanciera></RazonSocialFinanciera>" +
            // "<DireccionFinanciera></DireccionFinanciera>" +
            // "<ConvencionalFinanciera></ConvencionalFinanciera>" +
            // "<CelularFinanciera></CelularFinanciera>" +
            // "<EmailFinanciera></EmailFinanciera>" +
            // "</Financiera>" +
            // "<Aseguradora>" +
            // "<IdentificadorAseguradora></IdentificadorAseguradora>" +
            // "<RazonSocialAseguradora></RazonSocialAseguradora>" +
            // "<DireccionAseguradora></DireccionAseguradora>" +
            // "<ConvencionalAseguradora></ConvencionalAseguradora>" +
            // "<CelularAseguradora></CelularAseguradora>" +
            // "<EmailAseguradora></EmailAseguradora>" +
            // "</Aseguradora>" +
            // "<Convenio>" +
            // "<IdentificadorConvenio></IdentificadorConvenio>" +
            // "<RazonSocialConvenio></RazonSocialConvenio>" +
            // "<DireccionConvenio></DireccionConvenio>" +
            // "<ConvencionalConvenio></ConvencionalConvenio>" +
            // "<CelularConvenio></CelularConvenio>" +
            // "<EmailConvenio></EmailConvenio></Convenio></Orden></Ordenes>";
        return rowXml;
    }

    return {
        post: _post
    }
});