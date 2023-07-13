<?xml version="1.0"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>

    <head>
        <meta name="title" value="Código de Barras"/>
        <link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />
        <#if .locale == "zh_CN">
            <link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />
            <#elseif .locale == "zh_TW">
            <link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />
            <#elseif .locale == "ja_JP">
            <link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />
            <#elseif .locale == "ko_KR">
            <link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />
            <#elseif .locale == "th_TH">
            <link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />
        </#if>

        <style type="text/css">
            * {
                <#if .locale=="zh_CN">font-family: NotoSans, NotoSansCJKsc, sans-serif;
                <#elseif .locale=="zh_TW">font-family: NotoSans, NotoSansCJKtc, sans-serif;
                <#elseif .locale=="ja_JP">font-family: NotoSans, NotoSansCJKjp, sans-serif;
                <#elseif .locale=="ko_KR">font-family: NotoSans, NotoSansCJKkr, sans-serif;
                <#elseif .locale=="th_TH">font-family: NotoSans, NotoSansThai, sans-serif;
                <#else>font-family: NotoSans, sans-serif;
                </#if>
            }

            table {
                font-size: 9pt;
                table-layout: fixed;
            }

            th {
                font-weight: bold;
                font-size: 8pt;
                vertical-align: middle;
                padding: 5px 6px 3px;
                background-color: #333333;
                color: #333333;
            }

            td {
                padding: 4px 6px;
            }

            td p {
                align: left
            }

            b {
                font-weight: bold;
                color: #333333;
            }

            table.header td {
                padding: 0;
                font-size: 10pt;
            }

            table.footer td {
                padding: 0;
                font-size: 8pt;
            }

            table.itemtable th {
                padding-bottom: 10px;
                padding-top: 10px;
            }

            table.body td {
                padding-top: 2px;
            }

            table.total {
                page-break-inside: avoid;
            }

            tr.totalrow {
                background-color: #333333;
                line-height: 200%;
            }


            tr.totalrow2 {
                line-height: 100%;
            }

            td.totalboxtop {
                font-size: 12pt;
                background-color: #333333;
            }

            td.addressheader {
                font-size: 8pt;
                padding-top: 6px;
                padding-bottom: 2px;
            }

            td.address {
                padding-top: 0;
            }

            td.totalboxmid {
                font-size: 28pt;
                padding-top: 20px;
                background-color: #333333;
            }

            td.totalboxbot {
                background-color: #333333;
                font-weight: bold;
            }

            span.title {
                font-size: 18pt;
            }

            span.number {
                font-size: 16pt;
            }

            span.itemname {
                font-weight: bold;
                line-height: 150%;
            }

            hr {
                width: 100%;
                color: #333333;
                background-color: #333333;
                height: 1px;
            }

            .bordes {
                border: 0.1px solid #333333;
                /* border-collapse: collapse; */
            }

            .border {
                border-right: 0.1px solid #000;
                border-left: 0.1px solid #000;
            }

            .borderbottom {
                border-bottom: 0.1px solid #333333;
            }

            .separador {
                width: 5px;
            }

            .fontwhite {
                color: #fff;
            }

            .fondowhite {
                background-color: #fff;
            }

            .coloremaiil {
                color: #0883db;
            }

            .textalign {
                text-justify: none;
            }
            .content {
                min-height: 500px;
            }
        </style>
    </head>

    <body footer="nlfooter" footer-height="3.5em" padding="0.5in 0.5in 0.5in 0.5in" size="A7">
        <div>
            <table style="float: left; width: 50%;">
                <tr>
                    <td>
                        <#if companyInformation.logoUrl?length !=0>
                            <@filecabinet nstype="image" src="${companyInformation.logoUrl}"
                                style="float: left; width: 140px; height: 50px;" />
                        </#if>
                    </td>
                </tr>
                <tr><td rowspan="5" align="left" style="font-size: 8px"><barcode codetype="code25" showtext="true" value="${record.codigobarras}" width="124" height="34"/></td></tr>
                
            </table>
        </div>

    </body>
</pdf>