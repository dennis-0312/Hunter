<?xml version="1.0"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
    <head>
        <link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}"
            src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}"
            src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />
        <#if .locale=="zh_CN">
            <link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}"
                src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />
            <#elseif .locale=="zh_TW">
                <link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}"
                    src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />
                <#elseif .locale=="ja_JP">
                    <link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}"
                        src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />
                    <#elseif .locale=="ko_KR">
                        <link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}"
                            src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />
                        <#elseif .locale=="th_TH">
                            <link name="NotoSansThai" type="font" subtype="opentype"
                                src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />
        </#if>
        <style type="text/css">
            table {
                font-size: 9pt;
                table-layout: fixed;
                width: 100%;
            }

            th {
                font-weight: bold;
                font-size: 8pt;
                vertical-align: middle;
                padding: 5px 6px 3px;
                background-color: #e3e3e3;
                color: #333333;
                padding-bottom: 10px;
                padding-top: 10px;
            }

            td {
                padding: 4px 6px;
            }

            b {
                font-weight: bold;
                color: #333333;
            }
        </style>

        <macrolist>
            <macro id="nlfooter">
                <table class="footer" style="width: 100%;">
                    <tr>
                        <td style="margin-top: -100px; margin-left: 300px;">
                            <barcode codetype="qrcode" height="100px" width="100px" showtext="true"
                                value="${ordenservicio.tranid}" />
                        </td>
                    </tr>
                </table>
            </macro>
        </macrolist>
    </head>

    <body footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">
        <table style="font-size:10pt;width:100%;">
            <tr>
                <td style="font-weight: bold;">CONTRATO CARSEG S.A.</td>
                <td rowspan="2"><img
                        src="https://7451241-sb1.app.netsuite.com/core/media/media.nl?id=4965&amp;c=7451241_SB1&amp;h=kMRwg77zDdTR6UeLphyCHdb03owaZmjQRhvxORdtHVPxvAlM"
                        style="width: 50px; height: 60px; margin-left: 350px; margin-top: -50px" /></td>
            </tr>
        </table>

        <table>
            <tr>
                <td align="center" border="1" style="font-size: 16px; font-weight: bold;"><b>Acta de Entrega -
                        Recepci&oacute;n de Veh&iacute;culos</b></td>
                <td>&nbsp;</td>
            </tr>
        </table>

        <!--bloque1-->
        <br />
        <table border="1" style="margin-top: 10px; width: 400px;">
            <tr>
                <td align="left" colspan="3" style="font-weight: bold">Lugar y Fecha</td>
                <td align="left" class="border">:</td>
                <td colspan="10" align="left" class="border" style="font-size: 10px;">${ordenservicio.trandate}</td>
            </tr>
            <tr>
                <td align="left" colspan="3" style="font-weight: bold">ID. Cliente</td>
                <td align="left" class="border">:</td>
                <td colspan="10" align="left" class="border" style="font-size: 10px;">${ordenservicio.entity}</td>
            </tr>
            <tr>
                <td align="left" colspan="3" style="font-weight: bold">Cliente</td>
                <td align="left" class="border">:</td>
                <td colspan="10" align="left" class="border" style="font-size: 10px;">
                    ${ordenservicio.entity.companyname}</td>
            </tr>
            <tr>
                <td align="left" colspan="3" style="font-weight: bold">Compañia</td>
                <td align="left" class="border">:</td>
                <td colspan="10" align="left" class="border" style="font-size: 10px;"></td>
            </tr>

            <tr>
                <td align="left" colspan="3" style="font-weight: bold">Teléfono</td>
                <td align="left" class="border">:</td>
                <td colspan="10" align="left" class="border" style="font-size: 10px;"></td>
            </tr>
            <tr>
                <td align="left" colspan="3" style="font-weight: bold">Ej. de Venta</td>
                <td align="left" class="border">:</td>
                <td colspan="10" align="left" class="border" style="font-size: 10px;"></td>
            </tr>
        </table>
        <br />
        <table>
            <thead>
                <tr>
                    <th>ASUNTO</th>
                    <th>NUMERO</th>
                    <th>ESTADO</th>
                    <th>PRIORIDAD</th>
                    <th>ASIGNADO A</th>
                </tr>
            </thead>
            <!--detallesoporte-->
        </table>

        <br />
        <#if record.usernotes?has_content>
            <table>
                <#list record.usernotes as usernotes>
                    <#if usernotes_index==0>
                        <thead>
                            <tr>
                                <th>${usernotes.title@label}</th>
                                <th>${usernotes.note@label}</th>
                                <th>${usernotes.notedate@label}</th>
                                <th>${usernotes.time@label}</th>
                                <th>${usernotes.notetype@label}</th>
                                <th>${usernotes.direction@label}</th>
                            </tr>
                        </thead>
                    </#if>
                    <tr>
                        <td>${usernotes.title}</td>
                        <td>${usernotes.note}</td>
                        <td>${usernotes.notedate}</td>
                        <td>${usernotes.time}</td>
                        <td>${usernotes.notetype}</td>
                        <td>${usernotes.direction}</td>
                    </tr>
                </#list>
            </table>
        </#if><br />
        <#if record.mediaitem?has_content>
            <table>
                <#list record.mediaitem as mediaitem>
                    <#if mediaitem_index==0>
                        <thead>
                            <tr>
                                <th>${mediaitem.mediaitem@label}</th>
                                <th>${mediaitem.folder@label}</th>
                                <th>${mediaitem.filesize@label}</th>
                                <th>${mediaitem.lastmodifieddate@label}</th>
                                <th>${mediaitem.filetype@label}</th>
                            </tr>
                        </thead>
                    </#if>
                    <tr>
                        <td>${mediaitem.mediaitem}</td>
                        <td>${mediaitem.folder}</td>
                        <td>${mediaitem.filesize}</td>
                        <td>${mediaitem.lastmodifieddate}</td>
                        <td>${mediaitem.filetype}</td>
                    </tr>
                </#list>
            </table>
        </#if>

        <!--bloque2-->
    </body>
</pdf>