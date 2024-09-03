<#assign data=input.data?eval>
<#assign company=data.company>
<#assign total=data.total>
<#assign movements=data.movements>
<#assign cuentaCabecera=data.cuentaUno>
<#assign cuenta="0">
<#assign cantidad=1>
<#assign TotalDebe=0>
<#assign TotalHaber=0>
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>

    <head>
        <meta name="title" value="Formato 6.1" />
        <macrolist>
            <macro id="cabecera">
                <table width="100%">
                    <tr>
                        <td colspan="4" width="100%" align="center"><b>FORMATO 6.1: "LIBRO MAYOR"</b></td>
                    </tr>
                    <tr>
                        <td width="50%" align="left"><b>PERIODO</b></td>
                        <td width="5%" align="right"><b>:</b></td>
                        <td width="30%" align="left">${company.secondTitle}</td>
                        <td width="15%" align="left"></td>
                    </tr>
                    <tr>
                        <td width="50%" align="left"><b>RUC</b></td>
                        <td width="5%" align="right"><b>:</b></td>
                        <td width="30%" align="left">${company.thirdTitle}</td>
                        <td width="15%" align="left"></td>
                    </tr>
                    <tr>
                        <td width="50%" align="left"><b>APELLIDOS Y NOMBRES, DENOMINACION O RAZON SOCIAL</b></td>
                        <td width="5%" align="right"><b>:</b></td>
                        <td width="30%" align="left">${company.fourthTitle}</td>
                        <td width="15%" align="left"></td>
                    </tr>
                </table>
            </macro>
        </macrolist>
    </head>

    <body background-color="white" font-size="8" size="A4-landscape" header="cabecera" header-height="25mm"
        footer-height="10mm">
        
        <#list movements as key,mov>
            <#if cuenta == "0">

            <table  style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%; page-break-after: always">
                <tr>
                    <td colspan="2" align="left"><b>CODIGO Y/O DENOMINACIÓN DE LA CUENTA CONTABLE</b></td>
                    <td align="center">:${mov.codCuenta}</td>
                    <td colspan="2" align="left"></td>
                </tr>
                <tr>
                    <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">FECHA DE</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">LA OPERACIÓN</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">NÚMERO CORRELATIVO</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DEL LIBRO DIARIO (2)</td>
                            </tr>
                        </table>
                    </td>
                    <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">DESCRIPCION O GLOSA</td>
                            </tr>
                            <tr>
                                <td align="center" style="text-align:center;">DE LA OPERACIÓN</td>
                            </tr>
                        </table>
                    </td>
                    <td colspan="2" align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">SALDOS Y MOVIMIENTOS</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">DEUDOR</td>
                            </tr>
                        </table>
                    </td>
                    <td align="center " style="border:1px solid black; font-weight:bold">
                        <table>
                            <tr>
                                <td align="center" style="text-align:center;">ACREEDOR</td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <tr>
                    <td align="center">${mov.fechaOp}</td>
                    <td align="center">${mov.numAsiento}</td>
                    <td align="left">${mov.glosaDesc}</td>
                    <!-- <td align="left">${mov.glosaDesc}</td> -->
                    <td align="right">${mov.movDebe}</td>
                    <td align="right">${mov.movHaber}</td>
                </tr>
                
                <#assign TotalDebe = TotalDebe + mov.movDebe?number>
                <#assign TotalHaber = TotalHaber + mov.movHaber?number>
            <#else>
                <#if cuenta == mov.codCuenta>
                    <tr>
                        <td align="center">${mov.fechaOp}</td>
                        <td align="center">${mov.numAsiento}</td>
                        <td align="left">${mov.glosaDesc}</td>
                        <!-- <td align="left">${mov.glosaDesc}</td> -->
                        <td align="right">${mov.movDebe}</td>
                        <td align="right">${mov.movHaber}</td>
                    </tr>
                    <#assign TotalDebe = TotalDebe + mov.movDebe?number>
                    <#assign TotalHaber = TotalHaber + mov.movHaber?number>
                <#else>
                    <tr>
                        <td align="center"></td>
                        <td align="center"></td>
                        <td align="center"><b>TOTALES</b></td>
                        <td align="right"><b>${TotalDebe}</b></td>
                        <td align="right"><b>${TotalHaber}</b></td>
                    </tr>
                
                    <#assign TotalDebe = 0>
                    <#assign TotalHaber = 0>
                </table>
                <table  style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%; page-break-after: always">
                    <tr>
                        <td colspan="2" align="left"><b>CODIGO Y/O DENOMINACIÓN DE LA CUENTA CONTABLE</b></td>
                        <td align="center">:${mov.codCuenta}</td>
                        <td colspan="2" align="left"></td>
                    </tr>
                    <tr>
                        <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                            <table>
                                <tr>
                                    <td align="center" style="text-align:center;">FECHA DE</td>
                                </tr>
                                <tr>
                                    <td align="center" style="text-align:center;">LA OPERACIÓN</td>
                                </tr>
                            </table>
                        </td>
                        <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                            <table>
                                <tr>
                                    <td align="center" style="text-align:center;">NÚMERO CORRELATIVO</td>
                                </tr>
                                <tr>
                                    <td align="center" style="text-align:center;">DEL LIBRO DIARIO (2)</td>
                                </tr>
                            </table>
                        </td>
                        <td rowspan="2" align="center " style="border:1px solid black; font-weight:bold">
                            <table>
                                <tr>
                                    <td align="center" style="text-align:center;">DESCRIPCION O GLOSA</td>
                                </tr>
                                <tr>
                                    <td align="center" style="text-align:center;">DE LA OPERACIÓN</td>
                                </tr>
                            </table>
                        </td>
                        <td colspan="2" align="center " style="border:1px solid black; font-weight:bold">
                            <table>
                                <tr>
                                    <td align="center" style="text-align:center;">SALDOS Y MOVIMIENTOS</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center " style="border:1px solid black; font-weight:bold">
                            <table>
                                <tr>
                                    <td align="center" style="text-align:center;">DEUDOR</td>
                                </tr>
                            </table>
                        </td>
                        <td align="center " style="border:1px solid black; font-weight:bold">
                            <table>
                                <tr>
                                    <td align="center" style="text-align:center;">ACREEDOR</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
    
                    <tr>
                        <td align="center">${mov.fechaOp}</td>
                        <td align="center">${mov.numAsiento}</td>
                        <td align="left">${mov.glosaDesc}</td>
                        <!-- <td align="left">${mov.glosaDesc}</td> -->
                        <td align="right">${mov.movDebe}</td>
                        <td align="right">${mov.movHaber}</td>
                    </tr>
                    
                    <#assign TotalDebe = TotalDebe + mov.movDebe?number>
                    <#assign TotalHaber = TotalHaber + mov.movHaber?number>
                </#if>
            </#if>
            <#assign cuenta = mov.codCuenta>
        </#list>
        <tr>
            <td align="center"></td>
            <td align="center"></td>
            <td align="center"><b>TOTALES</b></td>
            <td align="right"><b>${TotalDebe}</b></td>
            <td align="right"><b>${TotalHaber}</b></td>
        </tr>
        </table>
    </body>
</pdf>