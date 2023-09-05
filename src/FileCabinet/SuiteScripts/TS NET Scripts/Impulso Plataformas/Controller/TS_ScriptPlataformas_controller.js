/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/search', 'N/record', 'N/https', 'N/url'],
    (log, search, record, https, url) => {
        let myRestletHeaders = new Array();
        myRestletHeaders['Accept'] = '*/*';
        myRestletHeaders['Content-Type'] = 'application/json';
        var date = new Date();
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        mm = mm < 10 ? '0' + mm : mm;
        dd = dd < 10 ? '0' + dd : dd;
        const OPERACION_ORDEN_INSTALACION = "001"; // Instalación
        const OPERACION_ORDEN_DESINSTALACION = "002"; // Desinstalación
        const OPERACION_ORDEN_REINSTALACION = "003"; // Reinstalación
        const OPERACION_ORDEN_RENOVACION = "004"; // Renovación
        const OPERACION_ORDEN_MODIFICACION = "005";
        const OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO = "006";
        const OPERACION_ORDEN_CHEQUEO_COMPONENTES = "007";
        const OPERACION_ORDEN_VENTA_SEGUROS = "008";
        const OPERACION_ORDEN_RENOVACION_SEGUROS = "009";
        const OPERACION_ORDEN_CAMBIO_PROPIETARIO = "010";
        const OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS = "011";
        const OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS = "012";
        const OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS = "013";
        const OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS = "014";
        const OPERACION_ORDEN_VENTA_SERVICIOS = "015";
        const OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS = "016";
        const OPERACION_ORDEN_ACTUALIZACION_ESTADOS = "017";
        const OPERACION_ORDEN_REGISTRAR_CANAL = "018";
        const OPERACION_ORDEN_INSTALACION_COMPONENTES = "019";

        const getHeaders = () => {
            let headers = [];
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            return headers;
        };

        const getDateValues = () => {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            month = month < 10 ? `0${month}` : month;
            day = day < 10 ? `0${day}` : day;
            return { year, month, day };
        }

        const getSalesOrder = (salesOrderId) => {
            let salesOrderValues = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: salesOrderId,
                columns: ['tranid']
            });
            return salesOrderValues;
        }

        const setAuthenticationValues = (PxAdmin) => {
            let { year, month, day } = getDateValues();

            PxAdmin["StrToken"] = `SH2PX${year}${month}${day}`;
            PxAdmin["UserName"] = `PxPrTest`;
            PxAdmin["Password"] = `PX12%09#w`;
            PxAdmin["UsuarioIngreso"] = `PRUEBAEVOL`;
        }

        const setEmptyFields = (PxAdmin) => {
            setVehiculoEmptyField(PxAdmin);
            setDispositivoEmptyFields(PxAdmin);
            setPropietarioEmptyFields(PxAdmin);
            setMonitorEmptyFields(PxAdmin);
            setConcesionarioEmptyFields(PxAdmin);
            setFinancieraEmptyFields(PxAdmin);
            setAseguradoraEmptyFields(PxAdmin);
            setConvenioEmptyFields(PxAdmin);
        }

        const setVehiculoEmptyField = (PxAdmin) => {
            PxAdmin["Placa"] = "";
            PxAdmin["IdMarca"] = "";
            PxAdmin["DescMarca"] = "";
            PxAdmin["IdModelo"] = "";
            PxAdmin["DescModelo"] = "";
            PxAdmin["CodigoVehiculo"] = "";
            PxAdmin["Chasis"] = "";
            PxAdmin["Motor"] = "";
            PxAdmin["Color"] = "";
            PxAdmin["Anio"] = "";
            PxAdmin["Tipo"] = "";
        }

        const setDispositivoEmptyFields = (PxAdmin) => {
            PxAdmin["Vid"] = "";
            PxAdmin["IdProducto"] = "";
            PxAdmin["DescProducto"] = "";
            PxAdmin["CodMarcaDispositivo"] = "";
            PxAdmin["MarcaDispositivo"] = "";
            PxAdmin["CodModeloDispositivo"] = "";
            PxAdmin["ModeloDispositivo"] = "";
            PxAdmin["Sn"] = "";
            PxAdmin["Imei"] = "";
            PxAdmin["NumeroCamaras"] = "0";
            PxAdmin["DireccionMac"] = "";
            PxAdmin["Icc"] = "";
            PxAdmin["NumeroCelular"] = "";
            PxAdmin["Operadora"] = "";
            PxAdmin["EstadoSim"] = "";
            PxAdmin["ServiciosInstalados"] = "";
            PxAdmin["OperacionDispositivo"] = "";
            PxAdmin["VidAnterior"] = "";
        }

        const setPropietarioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorPropietario"] = "";
            PxAdmin["NombrePropietario"] = "";
            PxAdmin["ApellidosPropietario"] = "";
            PxAdmin["DireccionPropietario"] = "";
            PxAdmin["ConvencionalPropietario"] = "";
            PxAdmin["CelularPropietario"] = "";
            PxAdmin["EmailPropietario"] = "";
        }

        const setMonitorEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorMonitorea"] = "";
            PxAdmin["NombreMonitorea"] = "";
            PxAdmin["ApellidosMonitorea"] = "";
            PxAdmin["DireccionMonitorea"] = "";
            PxAdmin["ConvencionalMonitorea"] = "";
            PxAdmin["CelularMonitorea"] = "";
            PxAdmin["EmailMonitorea"] = "";
        }

        const setConcesionarioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorConcesionario"] = "";
            PxAdmin["RazonSocialConcesionario"] = "";
            PxAdmin["DireccionConcesionario"] = "";
            PxAdmin["ConvencionalConcesionario"] = "";
            PxAdmin["CelularConcesionario"] = "";
            PxAdmin["EmailConcesionario"] = "";
        }

        const setFinancieraEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorFinanciera"] = "";
            PxAdmin["RazonSocialFinanciera"] = "";
            PxAdmin["RazonSocialFinanciera"] = "";
            PxAdmin["ConvencionalFinanciera"] = "";
            PxAdmin["CelularFinanciera"] = "";
            PxAdmin["EmailFinanciera"] = "";
        }

        const setAseguradoraEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorAseguradora"] = "";
            PxAdmin["RazonSocialAseguradora"] = "";
            PxAdmin["DireccionAseguradora"] = "";
            PxAdmin["ConvencionalAseguradora"] = "";
            PxAdmin["CelularAseguradora"] = "";
            PxAdmin["EmailAseguradoras"] = "";
        }

        const setConvenioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorConvenio"] = "";
            PxAdmin["RazonSocialConvenio"] = "";
            PxAdmin["DireccionConvenio"] = "";
            PxAdmin["ConvencionalConvenio"] = "";
            PxAdmin["CelularConvenio"] = "";
            PxAdmin["EmailConvenio"] = "";
        }

        const setSalesOrderValues = (PxAdmin, salesOrderId) => {
            let salesOrder = getSalesOrder(salesOrderId);
            PxAdmin["NumeroOrden"] = salesOrder.tranid;
        }

        const setVehiculoValues = (PxAdmin, vehiculo, operacionOrden) => {
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = vehiculo.custrecord_ht_bien_colorcarseg[0].text;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = vehiculo.custrecord_ht_bien_tipoterrestre[0].text;
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["DescModelo"] = vehiculo.custrecord_ht_bien_modelo[0].text;
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = vehiculo.custrecord_ht_bien_colorcarseg[0].text;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = vehiculo.custrecord_ht_bien_tipoterrestre[0].text;
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = vehiculo.custrecord_ht_bien_marca[0].value.substr(0, 3);
                PxAdmin["DescMarca"] = vehiculo.custrecord_ht_bien_marca[0].text;
                PxAdmin["IdModelo"] = vehiculo.custrecord_ht_bien_modelo[0].value.substr(0, 3);
                PxAdmin["CodigoVehiculo"] = vehiculo.name;
            }
        }

        const setDispositivoValues = (PxAdmin, Dispositivo, operacionOrden, workOrder) => {
            let modelo = Dispositivo.custrecord_ht_mc_modelo[0].text.split(' - ');
            let unidad = Dispositivo.custrecord_ht_mc_unidad[0].text.split(' - ');
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "D";
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "A";
            } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_seriedispositivo[0].text;
                PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                PxAdmin["NumeroCamaras"] = "0";
                PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_ip;
                PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                PxAdmin["Operadora"] = Dispositivo.custrecord_ht_mc_operadora[0].text;
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["OperacionDispositivo"] = "D";
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                PxAdmin["DescProducto"] = Dispositivo.name;
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
                PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["OperacionDispositivo"] = "I";
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                PxAdmin["OperacionDispositivo"] = "I";
                PxAdmin["CodMarcaDispositivo"] = modelo[0].substr(0, 3);
                PxAdmin["MarcaDispositivo"] = modelo[1];
                PxAdmin["CodModeloDispositivo"] = unidad[0].substr(0, 3);
                PxAdmin["ModeloDispositivo"] = unidad[1];
            }
        }

        const setPropietarioValues = (PxAdmin, Propietario, operacionOrden) => {
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosPropietario"] = Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionPropietario"] = "SURCO";
                PxAdmin["ConvencionalPropietario"] = "43576409";
                PxAdmin["CelularPropietario"] = Propietario.phone;
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosPropietario"] = Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionPropietario"] = "LIMA";
                PxAdmin["ConvencionalPropietario"] = "43576409";
                PxAdmin["CelularPropietario"] = Propietario.phone;
                PxAdmin["EmailPropietario"] = Propietario.email;
            }
        }

        const setMonitoreoValues = (PxAdmin, PropietarioMonitero, operacionOrden) => {
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorMonitorea"] = PropietarioMonitero.vatregnumber;
                PxAdmin["NombreMonitorea"] = PropietarioMonitero.custentity_ht_cl_primernombre + ' ' + PropietarioMonitero.custentity_ht_cl_segundonombre;
                PxAdmin["ApellidosMonitorea"] = PropietarioMonitero.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitero.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionMonitorea"] = "SURCO";
                PxAdmin["ConvencionalMonitorea"] = "43576409";
                PxAdmin["CelularMonitorea"] = PropietarioMonitero.phone;
                PxAdmin["EmailMonitorea"] = PropietarioMonitero.email;
            }
        }

        const envioPXAdminInstall = (Dispositivo, vehiculo, Propietario, PropietarioMonitero, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_INSTALACION);
                setMonitoreoValues(PxAdmin, PropietarioMonitero, OPERACION_ORDEN_INSTALACION);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("response", response);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminUninstall = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_DESINSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_DESINSTALACION);
                let response = sendPXServer(PxAdmin);
                log.error("PxAdmin", PxAdmin)
                if (response == 1) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    updatePxadmin.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminReinstall = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');
            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REINSTALACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REINSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_REINSTALACION);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminRenovation = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');
            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }

            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminModication = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');
            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MODIFICACION;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MODIFICACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MODIFICACION);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }

            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminMaintenanceCheck = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminCheckComponents = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_COMPONENTES;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminInsuranceSales = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SEGUROS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SEGUROS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SEGUROS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminInsuranceRenewal = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION_SEGUROS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminInstallOtherProducts = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION_OTROS_PRODUCTOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminUninstallOtherProducts = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminCheckOtherProducts = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminReinstallOtherProducts = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminServiceSales = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SERVICIOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SERVICIOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SERVICIOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminUpdateOwner = (Dispositivo, Propietario, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS;
                //setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                log.error("response", response);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminUpdateStates = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_ESTADOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminRegisterChanel = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REGISTRAR_CANAL;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REGISTRAR_CANAL);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminComponentInstallation = (Dispositivo, vehiculo, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesOrderId = order.getValue('custrecord_ht_ot_orden_servicio');
            let pxadminfinalizacion = order.getValue('custrecord_ht_ot_pxadminfinalizacion');

            if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId);
                setEmptyFields(PxAdmin);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION_COMPONENTES;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION_COMPONENTES);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION_COMPONENTES);
                log.error("PxAdmin", PxAdmin);
                let response = sendPXServer(PxAdmin);
                if (response == 1) {
                    order.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    order.save();
                    pxadminfinalizacion = true;
                }
            }
            if (!pxadminfinalizacion) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;
        }

        const envioPXAdminInstallTelec = (Dispositivo, vehiculo, Propietario, PropietarioMonitero, id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });

            let confirmaciontelamatic = order.getValue('custrecord_ht_ot_confirmaciontelamatic');

            if (!confirmaciontelamatic) {
                let telemat = {
                    customer: {
                        username: Propietario.email,
                        customer: {
                            identity_document_number: "0932677495",
                            company_code: "0991259546001",
                            identity_document_type: 3
                        },
                        first_name: Propietario.custentity_ht_cl_primernombre + ' ' + Propietario.custentity_ht_cl_segundonombre,
                        last_name: Propietario.custentity_ht_cl_apellidopaterno + ' ' + Propietario.custentity_ht_cl_apellidomaterno,
                        is_active: true,
                        email: Propietario.email,
                    },
                    asset: {
                        product: vehiculo.name,
                        name: vehiculo.altname,
                        custom_name: vehiculo.altname,
                        description: "PruebaEvol",
                        contract_code: "",
                        owner: "403",
                        aceptation_date: "2023-03-23T00:00:00Z",
                        active: true,
                        attributes: [
                            {

                                attribute: 10,
                                value: vehiculo.custrecord_ht_bien_marca[0].text,
                                attribute_name: "Brand"
                            },
                            {

                                attribute: 11,
                                value: vehiculo.custrecord_ht_bien_marca[0].text,
                                attribute_name: "Model"
                            },
                            {

                                attribute: 16,
                                value: vehiculo.custrecord_ht_bien_chasis,
                                attribute_name: "Chasis"
                            },
                            {

                                attribute: 17,
                                value: vehiculo.custrecord_ht_bien_motor,
                                attribute_name: "Motor"
                            },
                            {

                                attribute: 18,
                                value: vehiculo.custrecord_ht_bien_placa,
                                attribute_name: "Plate"
                            }
                        ],
                        doors_sensors: 0,
                        asset_type: "2",
                        product_expire_date: "2024-03-23T00:00:00Z"
                    },
                    device: {
                        report_from: 3,
                        active: true,
                        model: 1,
                        company_code: "",
                        id: Dispositivo.name
                    },
                    command: [
                        "CAR_LOCK",
                        "OPEN_DOOR_LOCKS"
                    ]

                }
                log.debug("telemat", telemat);
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(telemat),
                    deploymentId: 'customdeploy_ns_rs_new_installation',
                    scriptId: 'customscript_ns_rs_new_installation',
                    headers: myRestletHeaders,
                });

                let response = myRestletResponse.body;
                let Telematic = JSON.parse(response);
                if (Telematic.device && Telematic.customer && Telematic.asset) {
                    let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                    updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_confirmaciontelamatic', value: true })
                    updateTelematic.save();
                    confirmaciontelamatic = true;
                }
            }


            if (!confirmaciontelamatic) {
                let updateTelematic = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
                updateTelematic.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                updateTelematic.save();
                return false;
            }
            return true;

        };

        const envioCambioPropietario = (id) => {
            try {
                let order = record.load({ type: 'salesorder', id: id });
                fechaActual = "SH2PX" + yyyy + mm + dd;
                let clienteNew = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: 0 });
                let clienteMonitoreo = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: 0 });
                let vehiculo = search.lookupFields({
                    type: 'customrecord_ht_record_bienes', id: order.getValue('custbody_ht_so_bien'),
                    columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo',
                        'custrecord_ht_bien_chasis',
                        'custrecord_ht_bien_motor',
                        'custrecord_ht_bien_colorcarseg',
                        'custrecord_ht_bien_tipoterrestre',
                        'name',
                        'custrecord_ht_bien_ano',
                        'altname', 'custrecord_ht_bien_id_telematic']
                });
                let Propietario = search.lookupFields({
                    type: 'customer', id: order.getValue('entity'),
                    columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email', 'custentity_ht_customer_id_telematic']
                });
                let PropietarioNew = search.lookupFields({
                    type: 'customer', id: clienteNew,
                    columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email'
                    ]
                });
                let PropietarioMonitero = search.lookupFields({
                    type: 'customer', id: clienteMonitoreo,
                    columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email'
                    ]
                });
                let PxAdmin = {
                    StrToken: fechaActual,
                    UserName: "PxPrTest",
                    Password: "PX12%09#w",
                    NumeroOrden: "1101895503",
                    UsuarioIngreso: "PRUEBAEVOL",
                    OperacionOrden: "010",

                    CodigoVehiculo: vehiculo.name,

                    NumeroCamaras: "0",
                    OperacionDispositivo: "A",

                    IdentificadorPropietario: PropietarioNew.entityid,
                    NombrePropietario: PropietarioNew.custentity_ht_cl_primernombre + ' ' + PropietarioNew.custentity_ht_cl_segundonombre,
                    ApellidosPropietario: PropietarioNew.custentity_ht_cl_apellidopaterno + ' ' + PropietarioNew.custentity_ht_cl_apellidomaterno,
                    DireccionPropietario: "GUAYAQUIL",
                    ConvencionalPropietario: "43576409",
                    CelularPropietario: PropietarioNew.phone,
                    EmailPropietario: PropietarioNew.email,

                    IdentificadorMonitorea: PropietarioMonitero.entityid,
                    NombreMonitorea: PropietarioMonitero.custentity_ht_cl_primernombre + ' ' + PropietarioMonitero.custentity_ht_cl_segundonombre,
                    ApellidosMonitorea: PropietarioMonitero.custentity_ht_cl_apellidopaterno + ' ' + PropietarioMonitero.custentity_ht_cl_apellidomaterno,
                    DireccionMonitorea: "GUAYAQUIL",
                    ConvencionalMonitorea: "43576409",
                    CelularMonitorea: PropietarioMonitero.phone,
                    EmailMonitorea: PropietarioMonitero.email,
                }

                let outputPXadmin = url.resolveScript({
                    scriptId: 'customscript_ns_rs_px_services',
                    deploymentId: 'customdeploy_ns_rs_px_services',
                });


                let myRestletResponsePX = https.post({
                    url: outputPXadmin,
                    body: PxAdmin,
                    headers: myRestletHeaders
                });


                if (response == 1) {


                }

                let telemat = {
                    customerNew: {
                        username: PropietarioNew.entityid,
                        customer: {
                            identity_document_number: "0932677495",
                            company_code: "0991259546001",
                            identity_document_type: 3
                        },
                        first_name: PropietarioNew.custentity_ht_cl_primernombre + ' ' + PropietarioNew.custentity_ht_cl_segundonombre,
                        last_name: PropietarioNew.custentity_ht_cl_apellidopaterno + ' ' + PropietarioNew.custentity_ht_cl_apellidomaterno,
                        is_active: true,
                        email: PropietarioNew.email
                    },
                    customerOld: Propietario.custentity_ht_customer_id_telematic,
                    asset: vehiculo.custrecord_ht_bien_id_telematic

                }

                let output = url.resolveScript({
                    scriptId: 'customscript_ns_rs_new_owner',
                    deploymentId: 'customdeploy_ns_rs_new_owner',
                });


                let myRestletResponse = https.post({
                    url: output,
                    body: telemat,
                    headers: myRestletHeaders
                });

                let response = myRestletResponse.body;
            } catch (e) {
                return false;
            }
        }

        const sendPXServer = (PxAdmin) => {
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(PxAdmin),
                deploymentId: 'customdeploy_ns_rs_px_services',
                scriptId: 'customscript_ns_rs_px_services',
                headers: getHeaders(),
            });
            return myRestletResponse.body;
        }

        const Propietario = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let Propietario = search.lookupFields({
                type: 'customer', id: order.getValue('custrecord_ht_ot_cliente_id'),
                columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'email',
                    'vatregnumber'
                ]
            });
            return Propietario;
        }

        const vehiculo = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let vehiculo = search.lookupFields({
                type: 'customrecord_ht_record_bienes', id: order.getValue('custrecord_ht_ot_vehiculo'),
                columns: ['custrecord_ht_bien_placa', 'custrecord_ht_bien_marca', 'custrecord_ht_bien_modelo',
                    'custrecord_ht_bien_chasis',
                    'custrecord_ht_bien_motor',
                    'custrecord_ht_bien_colorcarseg',
                    'custrecord_ht_bien_tipoterrestre',
                    'name',
                    'custrecord_ht_bien_ano',
                    'altname',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_ruccanaldistribucion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_nombre',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_direccion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_telefono',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_tipocanal'
                ]
            });
            return vehiculo;

        }

        const Dispositivo = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let Dispositivo = search.lookupFields({
                type: 'customrecord_ht_record_mantchaser', id: order.getValue('custrecord_ht_ot_serieproductoasignacion'),
                columns: ['custrecord_ht_mc_vid', 'custrecord_ht_mc_modelo',
                    'custrecord_ht_mc_unidad',
                    'custrecord_ht_mc_seriedispositivo',
                    'custrecord_ht_mc_imei',
                    'name',
                    'custrecord_ht_mc_nocelularsim',
                    'custrecord_ht_mc_operadora',
                    'custrecord_ht_mc_ip', 'custrecord_ht_mc_celularsimcard',
                    'custrecord_ht_mc_estado'
                ]
            });
            return Dispositivo;
        }

        const PropietarioMonitoreo = (id) => {
            let lookupFieldsPropietarioMonitero = 0
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesorder = record.load({ type: 'salesorder', id: order.getValue('custrecord_ht_ot_orden_servicio') });
            let inventoryAssignmentLines = salesorder.getLineCount({ sublistId: 'item' });
            let PropietarioMonitero = 0;
            for (let j = 0; j < inventoryAssignmentLines; j++) {
                let item = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                if (item == order.getValue('custrecord_ht_ot_item')) {
                    PropietarioMonitero = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                }
            }
            log.debug('MONITOREOOOOOO', PropietarioMonitero);
            if (PropietarioMonitero != 0) {
                lookupFieldsPropietarioMonitero = search.lookupFields({
                    type: 'customer', id: PropietarioMonitero,
                    columns: [
                        'entityid',
                        'custentity_ht_cl_primernombre',
                        'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email',
                        'vatregnumber'
                    ]
                });
            }
            return lookupFieldsPropietarioMonitero;
        }

        return {
            envioPXAdminInstall,
            envioPXAdminUninstall,
            envioPXAdminReinstall,
            envioPXAdminRenovation,
            envioPXAdminModication,
            envioPXAdminMaintenanceCheck,
            envioPXAdminCheckComponents,
            envioPXAdminInsuranceSales,
            envioPXAdminInsuranceRenewal,
            envioPXAdminInstallOtherProducts,
            envioPXAdminUninstallOtherProducts,
            envioPXAdminCheckOtherProducts,
            envioPXAdminReinstallOtherProducts,
            envioPXAdminServiceSales,
            envioPXAdminUpdateOwner,
            envioPXAdminUpdateStates,
            envioPXAdminRegisterChanel,
            envioPXAdminComponentInstallation,
            envioPXAdminInstallTelec,
            envioCambioPropietario,
            Propietario,
            vehiculo,
            Dispositivo,
            PropietarioMonitoreo
        }
    });