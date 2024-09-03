<#assign data = input.data?eval >
<#assign company = data.company >
<#assign cabecera = data.cabecera >
<#assign total = data.total >
<#assign activo = data.activo >
<#assign pasivo = data.pasivo >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>
      <meta name="title" value="Formato 1.2" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%"  style= "font-size: 10px;">
               <tr>
                  <td colspan="3" align="center" style= "font-weight: bold;">FORMATO 3.1 : "LIBRO DE INVENTARIOS Y BALANCES - BALANCE GENERAL" </td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">EJERCICIO</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.anio}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">RUC</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.ruc}</td>
               </tr>
               <tr>
                  <td width="40%" align="left" style= "font-weight: bold;">RAZON SOCIAL</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="55%" align="left">${cabecera.razonSocial}</td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="8" size="A4-landscape" header="cabecera" header-height="30mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" writing-mode="lr">
        
		<tr>
			<td style="border: 1px solid black;"></td>
			<td align="center" style="border-top: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black;"><b>${cabecera.anio}</b></td>
			<td></td>
			<td style="border: 1px solid black;"></td>
			<td align="center" style="border-top: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black;"><b>${cabecera.anio}</b></td>
		</tr>
		<tr>
			<td></td>
		</tr>
		
		<tr>
			<td align="center" colspan="2" style="border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black;"><b>ACTIVO</b></td>
			<td style="border-left: 1px solid black;"></td>
			<td align="center" colspan="2" style="border: 1px solid black;"><b>PASIVO Y PATRIMONIO</b></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		
		
		<tr>
			<td style="border-left: 1px solid black;"><b><u>ACTIVO CORRIENTE</u></b></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"><b><u>PASIVO CORRIENTE</u></b></td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Efectivo y equivalentes de efectivo</td>
			<td align="right" style="border-left: 1px solid black;">${activo.efectivo}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Sobregiro Bancario</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.sobregiro_bancario}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Cuentas por cobrar comerciales - Terceros</td>
			<td align="right" style="border-left: 1px solid black;">${activo.cpc_comerciales_terceros}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Cuentas por pagar comerciales - Terceros</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.cpp_comerciales_terceros}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Cuentas por cobrar al personal, a los accionistas (socios), directores y gerentes</td>
			<td align="right" style="border-left: 1px solid black;">${activo.cpc_personal_accionistas}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Tributos, contraprestaciones y aportes al sistema de pensiones y de salud por pagar</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.tributos}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Cuentas por cobrar diversas - Terceros</td>
			<td align="right" style="border-left: 1px solid black;">${activo.cpc_diversas}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Remuneraciones y participaciones por pagar</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.remuneraciones}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Servicios y otros contratados por anticipados</td>
			<td align="right" style="border-left: 1px solid black;">${activo.servicios_otros_contratados}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Cuentas por pagar diversas - Terceros</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.cpp_diversas}</td>
		</tr>
		
		<tr>
			<td style="border-left: 1px solid black;">Existencias</td>
			<td align="right" style="border-left: 1px solid black;">${activo.existenias}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Otras provisiones</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.otras_proviciones}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Anticipos Otorgados</td>
			<td align="right" style="border-left: 1px solid black;">${activo.anticipios_otorgados}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Anticipos recibidos</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.anticipos_recibidos}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td align="right" style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Obligaciones Financieras</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.obligaciones_financieras}</td>
		</tr>
		<tr>
			<td align="center" style="border-left: 1px solid black;"><b>TOTAL ACTIVO CORRIENTE</b></td>
			<td align="right" style="border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black;"><b>${activo.TOTAL_ACTIVO_CORRIENTE}</b></td>
			<td style="border-left: 1px solid black;"></td>
			<td align="center" style="border-left: 1px solid black;"><b>TOTAL PASIVO CORRIENTE</b></td>
			<td align="right" style="border: 1px solid black;"><b>${pasivo.TOTAL_PASIVO_CORRIENTE}</b></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"><b><u>ACTIVO NO CORRIENTE</u></b></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"><b><u>PASIVO NO CORRIENTE</u></b></td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Estimacion de cuentas de cobranza dudosa</td>
			<td align="right" style="border-left: 1px solid black;">${activo.estimacion_cuentas_cobranza}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Obligaciones Financieras</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.obligaciones_financieras2}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Inversiones Mobiliarias</td>
			<td align="right" style="border-left: 1px solid black;">${activo.inversiones_mobiliarias}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Ingresos Diferidos</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.ingresos_diferidos}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Activos Adquiridos en Arrendamiento</td>
			<td align="right" style="border-left: 1px solid black;">${activo.activos_adquiridos}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Propiedades, Planta y Equipo</td>
			<td align="right" style="border-left: 1px solid black;">${activo.propiedades_planta_equipo}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Intangibles</td>
			<td align="right" style="border-left: 1px solid black;">${activo.intangibles}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;">Depreciación,amortización y agotamiento acumulados</td>
			<td align="right" style="border-left: 1px solid black;">${activo.depreciacion}</td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td align="center" style="border-left: 1px solid black;"><b>TOTAL ACTIVO NO CORRIENTE</b></td>
			<td align="right" style="border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black;"><b>${activo.TOTAL_ACTIVO_NO_CORRIENTE}</b></td>
			<td style="border-left: 1px solid black;"></td>
			<td align="center" style="border-left: 1px solid black;"><b>TOTAL PASIVO NO CORRIENTE</b></td>
			<td align="right" style="border: 1px solid black;"><b>${pasivo.TOTAL_PASIVO_NO_CORRIENTE}</b></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"><b><u>PATRIMONIO NETO</u></b></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Capital</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.capital}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Capital Adicional</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.capital_adicional}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Resultados acumulados</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.resultados_Acumulados}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;">Determinación del resultado del ejercicio</td>
			<td align="right" style="border-left: 1px solid black; border-right: 1px solid black;">${pasivo.determinacion_resultado}</td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td align="center" style="border-left: 1px solid black;"><b>TOTAL PATRIMONIO NETO</b></td>
			<td align="right" style="border: 1px solid black;"><b>${pasivo.TOTAL_PATRIMONIO_NETO}</b></td>
		</tr>
		<tr>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black;"></td>
			<td style="border-left: 1px solid black; border-right: 1px solid black;"></td>
		</tr>
		<tr>
			<td align="center" style="border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black;"><b>TOTAL ACTIVO</b></td>
			<td align="right" style="border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black;"><b>${activo.TOTAL_ACTIVO}</b></td>
			<td style="border-left: 1px solid black;"></td>
			<td align="center" style="border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black;"><b>TOTAL PASIVO Y PATRIMONIO NETO</b></td>
			<td align="right" style="border: 1px solid black;"><b>${pasivo.TOTAL_PASIVO_PATRIMONIO_NETO}</b></td>
		</tr>
      </table>
	  <p>(1) Se podrá hacer uso del formato aprobado por la CONASEV, en tanto se cumpla con registrar la información mínima requerida para este Formato.</p>
  </body>
</pdf>