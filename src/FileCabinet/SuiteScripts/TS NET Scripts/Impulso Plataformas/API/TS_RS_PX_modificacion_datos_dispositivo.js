/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/file', 'N/record'], (log, https, file, record) => {
    const URLPX = 'https://apipx.24hm.net/API_PX/WSPX.asmx'; //https://apipx.24hm.net/API_PX/WSPX.asmx?op=InsertaOrden
    const folderRequest = 24651; //SB: 28733 - PR:24651
    const folderResponse = 24652; //SB: 28734 - PR:24652

    const _post = (context) => {
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
        log.debug("AutenticacionToken", string);
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
            url: `${URLPX}?op=InsertaOrden`,
            headers: headers2,
            body: rawInsert
        });

        const regex2 = /.*<string>(.*)<\/string>.*/;
        let Respon = resp2.body.replace(regex2, '$1');
        log.debug('XML', rawInsert);
        let requestFile = saveJson(context, `request${context.NumeroOrden}`, folderRequest);
        log.debug('Response-Hunter-PXADMIN', resp2);
        let responseFile = saveJson(resp2, `response${context.NumeroOrden}`, folderResponse);
        createRecordTraza(context.NumeroOrden, requestFile, responseFile)
        return Respon;
    }

    const getBodyByOperacionOrden = (context) => {
        let rowXml = "";
        rowXml = getInstalacionBody(context);
        return rowXml;
    }

    const getInstalacionBody = (context) => {
        log.debug('Type of', typeof context.NombrePropietario);
        let rowXml = "<Ordenes><Orden>" +
            "<NumeroOrden>" + context.NumeroOrden + "</NumeroOrden>" +
            "<UsuarioIngreso>" + context.UsuarioIngreso + "</UsuarioIngreso>" +
            "<FechaInicioCobertura>" + context.FechaInicioCobertura + "</FechaInicioCobertura>" +
            "<FechaFinCobertura>" + context.FechaFinCobertura + "</FechaFinCobertura>" +
            "<OperacionOrden>" + context.OperacionOrden + "</OperacionOrden>" +
            "<Vehiculo>" +
            "<Placa></Placa>" +
            "<IdMarca>" + (context.IdMarca || "") + "</IdMarca>" +
            "<DescMarca>" + (context.DescMarca || "") + "</DescMarca>" +
            "<IdModelo>" + (context.IdModelo || "") + "</IdModelo>" +
            "<DescModelo>" + (context.DescModelo || "") + "</DescModelo>" +
            "<CodigoVehiculo>" + (context.CodigoVehiculo || "") + "</CodigoVehiculo>" +
            "<Chasis></Chasis>" +
            "<Motor></Motor>" +
            "<Color></Color>" +
            "<Anio></Anio>" +
            "<Tipo></Tipo>" +
            "</Vehiculo>" +
            "<Dispositivo>" +
            "<Vid>" + (context.Vid || "") + "</Vid>" +
            "<IdProducto></IdProducto>" +
            "<DescProducto></DescProducto>" +
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
            "<ServiciosInstalados></ServiciosInstalados>" +
            "<OperacionDispositivo>" + (context.OperacionDispositivo || "") + "</OperacionDispositivo>" +
            "<VidAnterior></VidAnterior>" +
            "</Dispositivo>" +
            "<Propietario>" +
            "<IdentificadorPropietario></IdentificadorPropietario>" +
            "<NombrePropietario></NombrePropietario>" +
            "<ApellidosPropietario></ApellidosPropietario>" +
            "<DireccionPropietario></DireccionPropietario>" +
            "<ConvencionalPropietario></ConvencionalPropietario>" +
            "<CelularPropietario></CelularPropietario>" +
            "<EmailPropietario></EmailPropietario>" +
            "</Propietario>" +
            "<Monitor>" +
            "<IdentificadorMonitorea></IdentificadorMonitorea>" +
            "<NombreMonitorea></NombreMonitorea>" +
            "<ApellidosMonitorea></ApellidosMonitorea>" +
            "<DireccionMonitorea></DireccionMonitorea>" +
            "<ConvencionalMonitorea></ConvencionalMonitorea>" +
            "<CelularMonitorea></CelularMonitorea>" +
            "<EmailMonitorea></EmailMonitorea>" +
            "</Monitor>" +
            "<Concesionario>" +
            "<IdentificadorConcesionario></IdentificadorConcesionario>" +
            "<RazonSocialConcesionario></RazonSocialConcesionario>" +
            "<DireccionConcesionario></DireccionConcesionario>" +
            "<ConvencionalConcesionario></ConvencionalConcesionario>" +
            "<CelularConcesionario></CelularConcesionario>" +
            "<EmailConcesionario></EmailConcesionario>" +
            "</Concesionario>" +
            "<Financiera>" +
            "<IdentificadorFinanciera></IdentificadorFinanciera>" +
            "<RazonSocialFinanciera></RazonSocialFinanciera>" +
            "<DireccionFinanciera></DireccionFinanciera>" +
            "<ConvencionalFinanciera></ConvencionalFinanciera>" +
            "<CelularFinanciera></CelularFinanciera>" +
            "<EmailFinanciera></EmailFinanciera>" +
            "</Financiera>" +
            "<Aseguradora>" +
            "<IdentificadorAseguradora></IdentificadorAseguradora>" +
            "<RazonSocialAseguradora></RazonSocialAseguradora>" +
            "<DireccionAseguradora></DireccionAseguradora>" +
            "<ConvencionalAseguradora></ConvencionalAseguradora>" +
            "<CelularAseguradora></CelularAseguradora>" +
            "<EmailAseguradora></EmailAseguradora>" +
            "</Aseguradora>" +
            "<Convenio>" +
            "<IdentificadorConvenio></IdentificadorConvenio>" +
            "<RazonSocialConvenio></RazonSocialConvenio>" +
            "<DireccionConvenio></DireccionConvenio>" +
            "<ConvencionalConvenio></ConvencionalConvenio>" +
            "<CelularConvenio></CelularConvenio>" +
            "<EmailConvenio></EmailConvenio></Convenio></Orden></Ordenes>";
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

    const saveJson = (contents, nombre, folder) => {
        let fecha = sysDate();
        let fileObj = file.create({
            name: `${nombre}_${fecha}.json`,
            fileType: file.Type.JSON,
            contents: JSON.stringify(contents),
            folder: folder,
            isOnline: false
        });
        return fileObj.save();
    }

    const sysDate = () => {
        let date = new Date();
        var tdate = date.getDate();
        tdate = Number(tdate) < 10 ? `0${tdate}` : tdate;
        var month = date.getMonth() + 1;
        month = Number(month) < 10 ? `0${month}` : month;
        var year = date.getFullYear();
        return currentDate = `${tdate}${month}${year}`;
    }

    const createRecordTraza = (cobertura, requestFile, responseFile) => {
        let objRecord = record.create({ type: 'customrecord_ht_ct_traza_impulso_platafo', isDynamic: true });
        objRecord.setValue({ fieldId: 'custrecord_ht_ip_cobertura', value: cobertura });
        objRecord.setValue({ fieldId: 'custrecord_ht_ip_impulso', value: 1 });
        objRecord.setValue({ fieldId: 'custrecord_ht_ip_plataforma', value: 'PX' });
        objRecord.setValue({ fieldId: 'custrecord_ht_ip_estado', value: 'enviado' });
        objRecord.setValue({ fieldId: 'custrecord_ht_ip_trama_envio', value: requestFile });
        objRecord.setValue({ fieldId: 'custrecord_ht_ip_trama_respuesta', value: responseFile });
        let saveRecord = objRecord.save();
        log.debug('saveRecord', saveRecord)
    }

    return {
        post: _post
    }
});