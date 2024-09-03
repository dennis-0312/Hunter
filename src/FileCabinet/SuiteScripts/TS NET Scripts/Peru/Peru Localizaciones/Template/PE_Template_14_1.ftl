<#assign data=input.data?eval>
<#assign company=data.company>
<#assign movements=data.movements>
<#assign cuenta="0">
<#assign cantidad=1>
<#assign TotalDebe=0>
<#assign TotalHaber=0>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
    <head font-size="8" >
        <meta name="title" value="Formato 14.1" />
        <macrolist>
            <macro id="cabecera">
                <table width="100%">
                    <tr>
                        <td colspan="4" width="100%" align="center"><b><h1>FORMATO 14.1: REGISTRO DE VENTAS E INGRESOS</h1></b></td>
                    </tr>
                    <tr>
                        <td width="35%" align="left"><h1>PERIODO</h1></td>
                        <td width="35%" align="left"><h1>:${company.secondTitle}</h1></td>
                        <td width="30%" align="left"></td>
                    </tr>
                    <tr>
                        <td width="35%" align="left"><h1>RUC</h1></td>
                        <td width="35%" align="left"><h1>:${company.thirdTitle}</h1></td>
                        <td width="30%" align="left"></td>
                    </tr>
                    <tr>
                        <td width="35%" align="left"><h1>APELLIDOS Y NOMBRES, DENOMINACION O RAZON SOCIAL</h1></td>
                        <td width="35%" align="left"><h1>:${company.fourthTitle}</h1></td>
                        <td width="30%" align="left"></td>
                    </tr>
                </table>
            </macro>
        </macrolist>
    </head>

    <body background-color="white" font-size="3" size="A4-landscape" header="cabecera" header-height="20mm"
        footer-height="10mm">
            <table  style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%;">
                <tr>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">NÚMERO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">CORRELATIVO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DEL REGISTRO O </td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">CÓDIGO UNICO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE LA OPERACIÓN</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">FECHA DE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">EMISIÓN DEL</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">COMPROBANTE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE PAGO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">O DOCUMENTO</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">FECHA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">VENCIMIENTO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">Y/O PAGO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">COMPROBANTE DE PAGO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">O DOCUMENTO </td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">INFORMACIÓN DEL CLIENTE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">VALOR</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">FACTURADO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE LA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">EXPORTACIÓN</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">BASE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">IMPONIBLE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE LA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">OPERACIÓN</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">GRAVADA</td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">IMPORTE TOTAL DE LA OPERACIÓN</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"> EXONERADA O INAFECTA</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">ISC</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">IGV Y/O IPM</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">OTROS TRIBUTOS</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">Y CARGOS QUE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">NO FORMAN PARTE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE LA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">BASE IMPONIBLE</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">IMPORTE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">TOTAL</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DEL</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">COMPROBANTE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE PAGO</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="5" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">TIPO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">CAMBIO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="4" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">REFERENCIA DEL COMPROBANTE DE PAGO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">O DOCUMENTO ORIGINAL QUE SE MODIFICA</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">TIPO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">N° SERIE O</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">N° DE SERIE DE LA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">MAQUINA REGISTRADORA</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">NÚMERO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">DOCUMENTO DE IDENTIDAD</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">APELLIDOS Y NOMBRES</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DENOMINACIÓN</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">O RAZÓN SOCIAL</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">EXONERADA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td><td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">INAFECTA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">FECHA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">TIPO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">SERIE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="3" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">N° DEL</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">COMPROBANTE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE PAGO O DOCUMENTO</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">TIPO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">NÚMERO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;"></td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr></tr>
                <tr></tr>
                <#list movements as key,mov>
                    <tr>
                        <td align="center">${mov.c3_correlativo}</td>
                        <td align="center">${mov.c4_fecha_emision_comprobante_pago_doc}</td>
                        <td align="center">${mov.c5_fecha_vencimiento_o_fecha_pago}</td>
                        <td align="center">${mov.c6_tipo_comprobante_pago_o_documento}</td>
                        <td align="center">${mov.c7_serie_comprobante_pago_o_documento}</td>
                        <td align="center">${mov.c8_nro_comprobante_pago_o_documento}</td>
                        <td align="center">${mov.c10_tipo_documento_identidad_cliente}</td>
                        <td align="center">${mov.c11_numero_ruc_cliente_o_nro_doc}</td>
                        <td align="center">${mov.c12_nombres_o_razon_social}</td>
                        <td align="center">${mov.c13_x_pe}</td>
                        <td align="center">${mov.c14_s_pe}</td>
                        <td align="center">${mov.c18_e_pe}</td>
                        <td align="center">${mov.c19_i_pe}</td>
                        <td align="center">${mov.c20_sun_pe}</td>
                        <td align="center">${mov.c21_iun_pe}</td>
                        <td align="center">${mov.c24_otros}</td>
                        <td align="center">${mov.c25_total}</td>
                        <td align="center">${mov.c27_tc}</td>
                        <td align="center">${mov.c28_fecha_doc_ref}</td>
                        <td align="center">${mov.c29_td_doc_ref}</td>
                        <td align="center">${mov.c30_serie_doc_ref}</td>
                        <td align="center">${mov.c31_num_doc_ref}</td>
                    </tr>
                </#list>
            </table>
    </body>
</pdf>