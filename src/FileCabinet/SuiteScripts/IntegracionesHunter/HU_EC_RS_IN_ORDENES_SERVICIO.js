/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 * @param {string} altname - El valor del campo altname.
 * @returns {string} - El campo altname en el formato deseado. 
 */
 define(['N/query', 'N/https', 'N/log'], function (query, https, log) {

    function _get(context) {
        try{
            
            let Id = context.id;
            let ResultadoConsulta = [];

            switch (Id) {
              case "OS": 
                ResultadoConsulta = ConsultaOrdenServicio(context.IdCliente, 'PVP');
                break;
              case "CANAL":
                ResultadoConsulta = ConsultaCanal();
                break;
              case "OTRO":
                ResultadoConsulta = ConsultaCualquiera(context.tabla);
                break;
              default: 
                return 'id:400, No se encontraron resultados.';
            }
            return ResultadoConsulta;

        } catch (error) {
            log.debug({ title: 'Error', results: error })
            return {
                results: error.message
            };
        }
    }

    function _post(context){
        try{
            let ResultadoConsulta = [];

            ResultadoConsulta = ConsultaCualquiera(context.tabla);

            return ResultadoConsulta;
        }catch (error) {
            log.error('error', error.message);
            return 'id:400, No se pudo insertar el registro. Error controlado.';
        }
    }

    function  _put(context) {
        try{
            let rec = record.load({
                type: record.Type.customer,
                id: 455,
                isDynamic: false
            });

            rec.setValue({
                fieldId: 'custentity_ht_cl_primernombre',
                value: context.Nombre
            });

            let recId = rec.save();

            return recId;
        }catch (error) {
            log.error('error', error.message);
            return 'id:400, No se pudo insertar el registro. Error controlado.';
        }
    }
   
    function ConsultaCualquiera(Entidad) {
        try{
            let resultado = null;
log.error('post: ', Entidad);
          
            let CanalQuery = query.runSuiteQL({
              query: `${Entidad}`
              //query: `SELECT * FROM CUSTOMRECORD_HT_PP_MAIN_PARAM_PROD WHERE custrecord_ht_pp_parametrizacion_valor='118'`
              //query: `SELECT * FROM CUSTOMRECORD_HT_PP_MAIN_PARAM_PROD WHERE custrecord_ht_pp_parametrizacion_rela = 6`
            });

            let res = CanalQuery.asMappedResults();

            if (res.length > 0) {
                resultado = res;
            } else {
                resultado = { error: 'no data' };
            }

          log.error('consulta: ',resultado);

            return JSON.stringify({
                results: resultado
            });
         
        } catch (error) {
                log.error('error', error);
                //return JSON.stringify({error: error.message});
                return 'id:400, No se encontraron resultados. Error Controlado. (ConsultaCualquiera)';
        }
   }

    function ConsultaCanal() {
        try{
            let resultado = null;
            let CanalQuery = query.runSuiteQL({
                query: `SELECT  * FROM CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION`,
            });

            let res = CanalQuery.asMappedResults();

            if (res.length > 0) {
                resultado = res;
            } else {
                resultado = { error: 'no data' };
            }

            return JSON.stringify({
                results: resultado
            });
         
        } catch (error) {
                log.error('error', error);
                //return JSON.stringify({error: error.message});
                return 'id:400, No se encontraron resultados. Error Controlado. (ConsultaCanal)';
        }
   }
   
    function ConsultaOrdenServicio(idCliente, NivelPrecio) {
        try{
            let resultado = null;
            let OrdenQuery = query.runSuiteQL({
            query:  `SELECT OS.abbrevtype TipoDoc,
                            OS.autocalculatelag RutaCentroTrabajoFabricacion,
                            OS.billingaddress DireccionFactura,
                            OS.billingstatus EstadoFactura,
                            OS.closedate FechaCierre,
                            OS.createdby CreadoPor,
                            OS.createddate FechaCreacion,
                            OS.currency Moneda,
                            OS.custbody_15699_exclude_from_ep_process ExcluirPaogElectronico,
                            OS.custbody_ec_estado_de_autorizaci EstadoAutorizacion,
                            OS.custbody_ec_fecha_autorizacion FechaAutorizacion,
                            OS.custbody_ec_importe_base_iva ImporteBaseIVA,
                            OS.custbody_ec_monto_iva MontoIVA,
                            OS.custbody_edoc_gen_trans_pdf GeneraPDF,
                            OS.custbody_ei_ds_txn_identifier IdentificaDocElecFirmadoDigital,
                            OS.custbody_es_cambio_de_propietario EsCambioProp,
                            OS.custbody_ht_ai_orden_trabajo OrdenTrabajo,
                            OS.custbody_ht_ai_para_alquiler Alquiler,
                            OS.custbody_ht_ai_paraalquiler Alquiler1,
                            OS.custbody_ht_ai_porconvenio PorConvenio,
                            OS.custbody_ht_as_datos_tecnicos DatosTecnicos,
                            OS.custbody_ht_aprobador_proveduria AprobProveduria,
                            OS.custbody_ht_facturar_a FacturarA,
                            OS.custbody_ht_ce_ordentrabajo OrdenTrabajo1,
                            OS.custbody_ht_ce_ubicacion Ubicacion,
                            OS.custbody_ht_os_aprobacioncartera AprobacionCartera,
                            OS.custbody_ht_os_aprobacionventa AprobacionVenta,
                            OS.custbody_ht_os_bancofinanciera IdFinanciera, 
                            OS.custbody_ht_os_bien_flag IdBien,
                            OS.custbody_ht_os_companiaseguros IdSeguros,
                            OS.custbody_ht_os_concesionario IdConcecionario,
                            (
                                SELECT  CON.custrecord_ht_cd_nombre
                                FROM    CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION CON
                                WHERE   CON.ID = OS.custbody_ht_os_concesionario
                                AND     CON.custrecord_ht_cd_tipocanal = 2
                            ) CONCESIONARIO,
                            OS.custbody_ht_os_consideracion Trabajo_Tecnico,
                            OS.custbody_ht_os_convenio os_Convenio,
                            OS.custbody_ht_os_correocliente CorreoCliente,
                            OS.custbody_ht_os_direccioncliente DireccionCliente,
                            OS.custbody_ht_os_ejecutiva_backoffice IdEjecutivaGestion,
                            (
                                SELECT	EEM.firstname || ' ' || EEM.lastname
                                FROM	employee EEM
                                WHERE	OS.custbody_ht_os_ejecutiva_backoffice = EEM.id
                            ) EjecutivaGestion,
                            OS.custbody_ht_os_ejecutivareferencia IdEjecutivaReferencia,
                            (
                                SELECT	EEM.firstname || ' ' || EEM.lastname
                                FROM	employee EEM
                                WHERE	OS.custbody_ht_os_ejecutivareferencia = EEM.id
                            ) EjecutivaReferencia,
                            --salesrep EjecutivaRenovacion,
                            OS.custbody_ht_os_identificacioncliente IdCliente,
                            OS.custbody_ht_os_inicioactual InicioActual,
                            OS.custbody_ht_os_issue_invoice ,
                            OS.custbody_ht_os_limitecredito LimiteCredito,
                            OS.custbody_ht_os_nodividendos NoDividendos,
                            OS.custbody_ht_os_novedades Novedades,
                            OS.custbody_ht_os_origenordenservicio ,
                            OS.custbody_ht_os_nuevaemision NuevaEmision,
                            OS.custbody_ht_os_nuevovencimiento NuevoVencimiento,
                            OS.custbody_ht_os_oficinaejecutatrabajo OficinaEjecutaTrabajo,
                            OS.custbody_ht_os_origenordenservicio OrigenOrdenServicio,
                            OS.custbody_ht_os_otros_serv_inst OtrosServicios,
                            OS.custbody_ht_os_permitirentrega PermiteEntregaSinFact,
                            OS.custbody_ht_os_plazo Plazo,
                            OS.custbody_ht_os_plazoactual PlazoActual,
                            OS.custbody_ht_os_saldovencido SaldoVencido,
                            OS.custbody_ht_os_servicios Servicios,
                            OS.custbody_ht_os_telefonocliente TelefonoCliente,
                            OS.custbody_ht_os_trabajado OsTrabajado,
                            OS.custbody_ht_os_usaparalizador Paralizador,
                            OS.custbody_ht_os_vencimientoactual VencimientoActual,
                            OS.custbody_ht_os_vendcanaldistribucion Vendedor,
                            OS.custbody_ht_requiere_aprobacion_carter RequiereAprCartera,
                            OS.custbody_ht_so_bien IdBien1,
                            OS.custbody_psg_ei_trans_edoc_standard PaqDocElectronicos,
                            OS.custbody_report_timestamp HoraInforme,
                            OS.custbody_sii_article_61d FactSinContrapartida,
                            OS.custbody_sii_article_72_73 FactSimplificada,
                            OS.custbody_sii_invoice_date FechaFactura,
                            OS.custbody_sii_is_third_party EmitidaPorTerceros,
                            OS.custbody_sii_not_reported_in_time RegFactNoPudoEnviarse,
                            OS.custbody_sii_operation_date FechaOperacion,
                            OS.custbody_sii_orig_bill Factura1,
                            OS.custbody_sii_orig_invoice Factura2,
                            OS.custbody_sii_received_inv_type TipoFactura,
                            OS.custbody_ts_ec_metodo_pago MetodoPago,
                            OS.custbody_ts_ec_monto_letras MontoLetras,
                            OS.custbody_ts_ec_numero_preimpreso NumeroPreimpreso,
                            OS.custbody_ts_ec_serie_cxc SerieCxC,
                            OS.custbody_ts_ec_subsidiaria_pais Pais,
                            OS.custbodycustbody_ht_os_created_from_sa CreadaDesdeSatelite,
                            OS.custbodyec_empeado_proveduria Empleado,
                            OS.custbodyec_nota_cliente NotaCliente,
                            OS.custbodyts_ec_tipo_documento_fiscal TipoDocFiscal,
                            OS.customform FormularioPersonalizado,
                            OS.customtype TipoPersonalizado,
                            OS.daysopen DiasPendientes,
                            OS.email,
                            OS.employee IdEjecutivaRenovacion,
                            (
                                SELECT	EEM.firstname || ' ' || EEM.lastname
                                FROM	employee EEM
                                WHERE	OS.employee = EEM.id
                            ) EjecutivaRenovacion,
                            OS.entity ID_CLIENTE,
                            (
                                SELECT  CLI.altname
                                FROM    CUSTOMER CLI
                                WHERE   CLI.ID = OS.entity
                            ) CLIENTE,
                            OS.estgrossprofit GananciaBruta,
                            OS.estgrossprofitpercent PorcGananciaBruta,
                            OS.exchangerate TipoCambio,
                            OS.externalid IdExterno,
                            OS.foreigntotal ImporteTotal,
                            OS.forinvoicegrouping ,
                            OS.id IdInterno,
                            OS.isfinchrg CargoFichero,
                            OS.isreversal EsReversion,
                            OS.iswip Wip,
                            OS.lastmodifiedby IdUsuarioModifica,
                            OS.lastmodifieddate FechaModificacion,
                            OS.memo Nota,
                            OS.nextbilldate SigFechaFactura,
                            OS.nexus Nexo,
                            OS.number NumDocumento,
                            OS.onetime UnaVez,
                            OS.ordpicked Recogido,
                            OS.otherrefnum NumCheque,
                            OS.paymenthold RetencionPago,
                            OS.paymentmethod MetodoPago1,
                            OS.paymentoption OpcionPago,
                            OS.paymentlink VinculoPago,
                            OS.posting Contabilizacion,
                            OS.postingperiod PeriodoContable,
                            OS.printedpickingticket ComprobanteRetiroImpreso,
                            OS.recordtype TipoRegistro1,
                            OS.source SistemaSocio,
                            OS.startDate FechaInicio,
                            OS.status IdEstado,
                            (
                                SELECT TE.fullName
                                FROM   TransactionStatus TE
                                WHERE  OS.status = TE.id
                                AND     OS.type = TE.trantype
                                AND     OS.customtype = TE.trancustomtype
                            ) Estado,                            
                            OS.transactionnumber NumTransaccion,
                            OS.type Tipo,
                            OS.typebaseddocumentnumber NumeroDoc,
                            OS.userevenuearrangement DispoIngGenerados,
                            OS.visibletocustomer DispoCentroCli,
                            OS.void Anular,
                            OS.voided Anulado,
                            DOS.creditforeignamount TOTAL_ITEM,
                            DOS.custcol_ht_os_tipoarticulo,
                            I.description DESCRIPCION_ITEM,
                            I.displayname DESCRIPCION_ITEM1,
                            I.custitem_ht_at_tipotransaccion,
                            PRC.price,
                            PRC.pricelevelname
                        FROM    transaction OS,
                                transactionLine DOS,
                                Item I,
                                itemPrice PRC
                        WHERE   OS.ID = DOS.transaction
                        AND     DOS.item = I.id
                        AND     OS.abbrevtype = 'SERVORD'
                        AND     I.Id = PRC.item
                        AND     OS.TYPE = 'SalesOrd'
                        --AND   OS.actualproductionstartdate IS NOT NULL
                        --AND   OS.createdby IS NOT NULL
                        AND     DOS.accountinglinetype = 'INCOME'
                        AND     OS.entity = ?
                        AND     PRC.pricelevelname = ?
                        ORDER BY OS.CREATEDDATE `,
                        params: [idCliente, NivelPrecio]
            });

            let res = OrdenQuery.asMappedResults();

            if (res.length > 0) {
                resultado = res;
            } else {
                resultado = { error: 'no data' };
            }

            return JSON.stringify({
                results: resultado
            });

        }catch (error) {
                log.error('error', error);
                //return JSON.stringify({error: error.message});
                return 'id:400, No se encontraron resultados. Error Controlado. (ConsultaOrdenServicio)';
        }    
    }

    return {
        get: _get,
      post: _post
    }

 });