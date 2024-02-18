/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @param {string} altname - El valor del campo altname.
 * @returns {string} - El campo altname en el formato deseado. 
 */
define(['N/query', 'N/https', 'N/log'], function (query, https, log) {


    function _data(context) {
        try {

            var clienteID = context.clienteID;
            var tipoOperacion = context.tipoOperacion
            var resultado = null;

            /*
            // Verifica si se proporcionó un ID de cliente válido
            if (clienteID == "" && tipoOperacion == "") {
                resultado = { error: 'Se requiere proporcionar el ID del cliente y el tipo de operación.' };
            }

            if (clienteID == "" || tipoOperacion == "") {
                resultado = { error: 'Se requiere proporcionar el ID del cliente y el tipo de operación.' };
            }
            */

            // getCustomerNameByID
            if (tipoOperacion == "get_customer_by_id") {
                clienteQuery = query.runSuiteQL({
                    query: `
                        SELECT
                            (CASE WHEN b.isperson <> 'T' THEN b.companyname ELSE CONCAT(b.firstname, CONCAT(' ', CONCAT(b.middlename, CONCAT(' ', b.lastname)))) END) as nombre_completo
                        FROM
                            customer b
                        WHERE
                            b.entityid = ?
                    `,
                    params: [`C-EC-${clienteID}`]
                });

                res = clienteQuery.asMappedResults();

                if (res.length > 0) {
                    resultado = {
                        "NOMBRE_COMPLETO": res[0]['nombre_completo']
                    };
                } else {
                    // Si no se encuentra el cliente, retorna una respuesta adecuada
                    resultado = { error: 'Cliente no encontrado.' };
                }

                return {
                    results: resultado
                };
            }


            // getCustomerAddressByID
            if (tipoOperacion == "get_customer_address_by_id") {
                //custrecord_ht_direccion_tipo
                clienteQuery = query.runSuiteQL({
                    query: `
                    SELECT
                    LPAD(c.custrecord_ht_direccion_tipo, 3, '0') as TIPO_DIRECCION,
                    d.name as TIPO,
                    b.label as DIRECCION
                FROM
                    customer a
                JOIN
                    CustomerAddressbook b on a.id = b.entity
                JOIN
                    customerAddressbookEntityAddress c on c.nkey = b.addressbookaddress
                JOIN
                    CUSTOMLIST_HT_TIPODIRECCION d on c.custrecord_ht_direccion_tipo = d.id
                WHERE
                    a.entityid = ?
                `,
                    params: [`C-EC-${clienteID}`]

                });

                res = clienteQuery.asMappedResults();

                if (res.length > 0) {
                    resultado = res;
                } else {
                    // Si no se encuentra el cliente, retorna una respuesta adecuada
                    resultado = { error: 'no data' };
                }

                return {
                    results: resultado
                };
            }

            // getListModoContacto
            if (tipoOperacion == "get_list_modo_contacto") {

                clienteQuery = query.runSuiteQL({
                    query: `
                    SELECT
                        CONCAT('00', TO_CHAR(custrecord_ht_md_codigo)) as CODIGO,
                        custrecord_ht_md_descripcion as MODO_CONTACTO
                    FROM
                        customrecord_ht_sc_modocontacto
                        `,
                    params: []
                });

                res = clienteQuery.asMappedResults();

                if (res.length > 0) {
                    resultado = res;
                } else {
                    resultado = { error: 'no data' };
                }

                return {
                    results: resultado
                };
            }


            // getCustomerProductsVehiclesByID
            if (tipoOperacion == "get_customer_products_vehicles_by_id") {

                clienteQuery = query.runSuiteQL({
                    query: `
                        SELECT
                        c.itemid as PRODUCTO,
                        c.displayname as DESC_PRODUCTO,
                        a.custrecord_ht_co_coberturafinal as FECHA,
                        d.name as ESTADO
                    FROM
                        customrecord_ht_co_cobertura a
                    JOIN
                        customrecord_ht_record_bienes b ON b.id = a.custrecord_ht_co_bien
                    JOIN
                        item c ON c.id = TO_CHAR(a.custrecord_ht_co_producto)
                    JOIN
                        CUSTOMLIST1170 d ON d.id = a.custrecord_ht_co_estado_cobertura
                    WHERE
                        a.custrecord_ht_co_bien = ?;
                        `,
                    params: [clienteID]
                });

                res = clienteQuery.asMappedResults();

                if (res.length > 0) {
                    resultado = res;
                } else {
                    resultado = { error: 'no data' };
                }

                return {
                    results: resultado
                };
            }

            // getCustomerVehiclesByID
            if (tipoOperacion == "get_customer_vehicles_by_id") {

                clienteQuery = query.runSuiteQL({
                    query: `
                    SELECT 
                    TOP 4
                        a.custrecord_ht_bien_placa as PLACA,
                        a.custrecord_ht_bien_motor as MOTOR,
                        a.custrecord_ht_bien_chasis as CHASIS,
                        'PLC.:' || a.custrecord_ht_bien_placa || '; ' ||
                        'MAR.:' || SUBSTR(d.name, INSTR(d.name, '-') + 2) || '; ' ||
                        'MOD.:' || SUBSTR(e.name, INSTR(e.name, '-') + 2) || '; ' ||
                        'COL.:' || SUBSTR(c.name, INSTR(c.name, '-') + 2) as NOMBRE_COMPLETO
                        --SUBSTR(d.name, INSTR(d.name, '-') + 2) as MARCA,
                        --SUBSTR(e.name, INSTR(e.name, '-') + 2) as MODELO,
                        --SUBSTR(c.name, INSTR(c.name, '-') + 2) as COLOR
                        FROM
                        customrecord_ht_record_bienes a
                    JOIN
                        customer b on a.custrecord_ht_bien_propietario = b.id
                    JOIN 
                        customrecord_ht_bn_colorcarseg c on a.custrecord_ht_bien_colorcarseg = c.id
                    JOIN 
                        customrecord_ht_bien_marca d on a.custrecord_ht_bien_marca = d.id
                    JOIN
                        customrecord_ht_bn_modelo e on a.custrecord_ht_bien_modelo = e.id
                    JOIN
                        customrecord_ht_co_cobertura f on a.id = f.custrecord_ht_co_bien
                    WHERE
                        b.entityid = ?
                        order by f.custrecord_ht_co_coberturafinal desc;
                    `,
                    params: [`C-EC-${clienteID}`]
                });

                res = clienteQuery.asMappedResults();

                if (res.length > 0) {
                    resultado = res;
                } else {
                    // Si no se encuentra el cliente, retorna una respuesta adecuada
                    resultado = { error: 'no data' };
                }

                return {
                    results: resultado
                };
            }

            // getCustomerPhonesByID
            if (tipoOperacion == "get_customer_phones_by_id") {

                let idcliente = query.runSuiteQL({
                    query: `SELECT a.id from customer a where a.entityid = ?`,
                    params: [`C-EC-${clienteID}`]
                })

                resid = idcliente.asMappedResults();

                if (resid.length > 0) {
                    //traer id interno del cliente
                    id = resid[0]['id'];

                    //log.debug('titulo', `entityid: ${id}`)

                    clienteQuery = query.runSuiteQL({
                        query: `
                        SELECT 
                        LPAD(b.custrecord_ht_campo_list_tipo_telefono, 3, '0') as CODIGO,
                        c.custrecord_ht_descripcion_tipo_telefono as TIPO,
                        b.custrecord_ht_campo_txt_telefono as TELEFONO 
                        FROM 
                            customer a
                        JOIN 
                            customrecord_ht_registro_telefono b on a.id = b.custrecord_ht_campo_lbl_entidad_telefono
                        JOIN
                            customrecordht_registro_tipo_telefono c on b.custrecord_ht_campo_list_tipo_telefono = c.id
                        WHERE
                            a.id = ?;
                        `,
                        params: [id]
                    });

                    res = clienteQuery.asMappedResults();

                    if (res.length > 0) {
                        resultado = res;
                    } else {
                        resultado = { error: 'no data' };
                    }

                } else {
                    resultado = { error: 'no existe cliente' };
                }

                return {
                    results: resultado
                }

            }

            //getlistResultadoGestion
            if (tipoOperacion == "get_list_resultado_gestion") {
                //custrecord_ht_direccion_tipo
                clienteQuery = query.runSuiteQL({
                    query: `
                    select
                    a.custrecord_ht_campo_txt_des_res_gestion as NOMBRE,
                    LPAD(a.custrecord_ht_campo_txt_cod_res_gestion, 3, '0') as COD_RES_GESTION
                    from
                    customrecord_ht_registro_result_gestion a
                    `
                });

                res = clienteQuery.asMappedResults();

                if (res.length > 0) {
                    resultado = res;
                } else {
                    // Si no se encuentra el cliente, retorna una respuesta adecuada
                    resultado = { error: 'no data' };
                }

                return {
                    results: resultado
                };
            }


            // custom

            /*
            select
                    *
                    from
                    CUSTOMRECORD_HT_SC_MOTIVO a
                    JOIN
                    CUSTOMRECORD_HT_RESULTADOGESTION b on a.custrecord_ht_mt_codigo_resulgesiton = b.id
                    where b.custrecord_ht_rg_codigo = ?
            */

            if (tipoOperacion == "custom") {
                //custrecord_ht_direccion_tipo
                suiteQuery = query.runSuiteQL({
                    query: `
           SELECT 
                CASE
                    WHEN (
                    SELECT custrecord_ht_pp_descripcion
                    FROM customrecord_ht_cr_pp_valores
                    WHERE id = h.custrecord_ht_co_familia_prod
                    ) LIKE '%AMI%'
                    THEN 'AMI'
                    ELSE 'PX'
                END AS plataforma,
                --(select custrecord_ht_pp_descripcion from customrecord_ht_cr_pp_valores where id = h.custrecord_ht_co_familia_prod) as plataforma,
                SUBSTR(b.entityid, INSTR(b.entityid, '-', 1, 2) + 1) as cliente,
                b.email as username,
                --b.custentity_ht_customer_id_telematic as amicliente,
                CASE WHEN (b.custentity_ht_customer_id_telematic is null or b.custentity_ht_customer_id_telematic = '') then '' else COALESCE(b.custentity_ht_customer_id_telematic, '') end as amicliente,
                TO_CHAR(a.id) as codvehiculo,
                TO_CHAR(a.id) as vehiculoid,
                --a.custrecord_ht_bien_id_telematic as amivehiculo,
                CASE WHEN (a.custrecord_ht_bien_id_telematic is null or a.custrecord_ht_bien_id_telematic = '') then '' else COALESCE(a.custrecord_ht_bien_id_telematic, '') end as amivehiculo,
                'PLC.:' || a.custrecord_ht_bien_placa || '; ' ||
                'MAR.:' || SUBSTR(d.name, INSTR(d.name, '-') + 2) || '; ' ||
                'MOD.:' || SUBSTR(e.name, INSTR(e.name, '-') + 2) || '; ' ||
                'COL.:' || SUBSTR(c.name, INSTR(c.name, '-') + 2) as descripcionvehiculo,
                TO_CHAR(f.id) as tipovehiculo,
                f.name as tipo,
                a.custrecord_ht_bien_placa as placa,
                TO_CHAR(d.id) as idmarca,
                SUBSTR(d.name, INSTR(d.name, '-') + 2) as marca,
                TO_CHAR(e.id) as idmodelo,
                SUBSTR(e.name, INSTR(e.name, '-') + 2) as modelo,
                a.custrecord_ht_bien_chasis as chasis,
                a.custrecord_ht_bien_motor as motor,
                c.custrecord_ht_bn_colorcarseg_descripcion as color,
                TO_CHAR(a.custrecord_ht_bien_ano) as anio,
                CASE when (g.custrecord_ht_cd_ruccanaldistribucion is null or g.custrecord_ht_cd_ruccanaldistribucion = '') then 'SIN DIRECCION' else COALESCE(g.custrecord_ht_cd_ruccanaldistribucion, '') end as idconcesionario,
                CASE when (g.custrecord_ht_cd_nombre is null or g.custrecord_ht_cd_nombre = '') then 'SIN DIRECCION' else COALESCE(g.custrecord_ht_cd_nombre, '') end as concesionariodesc,
                CASE when (g.custrecord_ht_cd_direccion is null or g.custrecord_ht_cd_direccion = '') then 'SIN DIRECCION' else COALESCE(g.custrecord_ht_cd_direccion, '') end as concesionariodire,
                CASE when (g_2.custrecord_ht_cd_ruccanaldistribucion is null or g_2.custrecord_ht_cd_ruccanaldistribucion = '') then 'SIN DIRECCION' else COALESCE(g_2.custrecord_ht_cd_ruccanaldistribucion, '') end as idfinanciera,
                CASE when (g_2.custrecord_ht_cd_nombre is null or g_2.custrecord_ht_cd_nombre = '') then 'SIN DIRECCION' else COALESCE(g_2.custrecord_ht_cd_nombre, '') end as financieradesc,
                CASE when (g_2.custrecord_ht_cd_direccion is null or g_2.custrecord_ht_cd_direccion = '') then 'SIN DIRECCION' else COALESCE(g_2.custrecord_ht_cd_direccion, '') end as financieradire,
                CASE when (g_3.custrecord_ht_cd_ruccanaldistribucion is null or g_3.custrecord_ht_cd_ruccanaldistribucion = '') then 'SIN DIRECCION' else COALESCE(g_3.custrecord_ht_cd_ruccanaldistribucion, '') end as idaseguradora,
                CASE when (g_3.custrecord_ht_cd_nombre is null or g_3.custrecord_ht_cd_nombre = '') then 'SIN DIRECCION' else COALESCE(g_3.custrecord_ht_cd_nombre, '') end as aseguradoradesc,
                CASE when (g_3.custrecord_ht_cd_direccion is null or g_3.custrecord_ht_cd_direccion = '') then 'SIN DIRECCION' else COALESCE(g_3.custrecord_ht_cd_direccion, '') end as aseguradoradire
                    FROM
                    customrecord_ht_record_bienes a
                JOIN
                    customer b on a.custrecord_ht_bien_propietario = b.id
                JOIN 
                    customrecord_ht_bn_colorcarseg c on a.custrecord_ht_bien_colorcarseg = c.id
                JOIN 
                    customrecord_ht_bien_marca d on a.custrecord_ht_bien_marca = d.id
                JOIN
                    customrecord_ht_bn_modelo e on a.custrecord_ht_bien_modelo = e.id
                JOIN
                    CUSTOMRECORD_HT_BIEN_TIPOBIEN f on a.custrecord_ht_bien_tipobien = f.id
                JOIN
                    CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION g on a.custrecord_ht_bien_consesionarios = g.id
                JOIN
                    CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION g_2 on a.custrecord_ht_bien_financiadovehiculo = g_2.id
                JOIN
                    CUSTOMRECORD_HT_RECORD_CANALDISTRIBUCION g_3 on a.custrecord_ht_bien_companiaseguros = g_3.id
                JOIN
                    customrecord_ht_co_cobertura h on a.id = h.custrecord_ht_co_bien
                WHERE 
                    a.id = ?
                    `,
                    params: [clienteID]
                });

                res = suiteQuery.asMappedResults();

                if (res.length > 0) {
                    //armar el json para consumir el servicio

                    resultado = res

                }
                else {
                    resultado = { error: 'no data' };
                }

                return {
                    results: resultado
                };
                
            }


        } catch (error) {
            log.debug({ title: 'Error', results: error })
            return {
                results: error.message
            };
        }
    }





    return {
        //get: getAllCustomers,
        post: _data,
        //get: obtenerTodosLosCamposCliente
    };


});