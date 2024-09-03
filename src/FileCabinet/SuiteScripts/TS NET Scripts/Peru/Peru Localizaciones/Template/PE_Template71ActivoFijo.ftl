<#assign data = input.data?eval >
<#assign company = data.company >
<#assign cabecera = data.cabecera >
<#assign total = data.total >
<#assign movements = data.movements >
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
   <head>

      <meta name="title" value="Formato 7.1" />
      <macrolist>
         <macro id = "cabecera">
            <table width="100%" font-size="8">
               <tr>
                  <td colspan="3" align="center" style= "font-weight: bold;">FORMATO 7.1: "REGISTRO DE ACTIVOS FIJOS - DETALLE DE LOS ACTIVOS FIJOS"</td>
               </tr>
               <tr>
                  <td width="30%" align="left" style= "font-weight: bold;">PERIODO</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="65%" align="left">${cabecera.Anio}</td>
               </tr>
               <tr>
                  <td width="30%" align="left" style= "font-weight: bold;">RUC</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="65%" align="left">${cabecera.ruc}</td>
               </tr>
               <tr>
                  <td width="30%" align="left" style= "font-weight: bold;">DENOMINACIÓN O RAZÓN SOCIAL</td>
                  <td width="5%" align="left" style= "font-weight: bold;">:</td>
                  <td width="65%" align="left">${cabecera.razonSocial}</td>
               </tr>
            </table>
         </macro>
      </macrolist>
   </head>
   <body background-color="white" font-size="3.5" size="A3-landscape" header = "cabecera" header-height="30mm" footer-height="10mm">
      <table style="font-family: Verdana, Arial, Helvetica, sans-serif; width:100%" >
         <thead>
            <tr>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">CODIGO</td></tr>
					 <tr><td align="center" style="text-align:center; ">RELACIONADO</td></tr>
					 <tr><td align="center" style="text-align:center; ">CON EL ACTIVO</td></tr>
					 <tr><td align="center" style="text-align:center; ">FIJO</td></tr>
				   </table>
			   </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">CUENTA</td></tr>
					 <tr><td align="center" style="text-align:center; ">CONTABLE</td></tr>
					 <tr><td align="center" style="text-align:center; ">DEL ACTIVO</td></tr>
					 <tr><td align="center" style="text-align:center; ">FIJO</td></tr>
				   </table>
			      </td>
               <td align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">DETALLE DEL ACTIVO FIJO</td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">MARCA</td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">MODELO</td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">N° DE</td></tr>
					 <tr><td align="center" style="text-align:center; ">SERIE Y/O</td></tr>
					 <tr><td align="center" style="text-align:center; ">PLACA</td></tr>
				   </table>
				</td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
			   <table>
					 <tr><td align="center" style="text-align:center; ">SALDO</td></tr>
					 <tr><td align="center" style="text-align:center; ">INICIAL</td></tr>
				   </table>
			    </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">ADQUISICIONES</td></tr>
					 <tr><td align="center" style="text-align:center; ">Y/O</td></tr>
					 <tr><td align="center" style="text-align:center; ">ADICIONES</td></tr>
				   </table>
				</td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">SALDO</td></tr>
					 <tr><td align="center" style="text-align:center; ">FINAL</td></tr>
				   </table>
			    </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">MEJORAS</td>

               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">RETIROS</td></tr>
					 <tr><td align="center" style="text-align:center; ">Y/O</td></tr>
					 <tr><td align="center" style="text-align:center; ">BAJAS</td></tr>
				   </table>
			     </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">OTROS</td></tr>
					 <tr><td align="center" style="text-align:center; ">AJUSTES</td></tr>
				   </table>
			    </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">VALOR</td></tr>
					 <tr><td align="center" style="text-align:center; ">HISTORICO DEL</td></tr>
					 <tr><td align="center" style="text-align:center; ">ACTIVO FIJO</td></tr>
				   </table>
			      </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">AJUSTE POR INFLAC</td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">VALOR</td></tr>
					 <tr><td align="center" style="text-align:center; ">AJUSTADO DEL</td></tr>
					 <tr><td align="center" style="text-align:center; ">ACTIVO FIJO</td></tr>
				   </table>
				 </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">FECHA</td></tr>
					 <tr><td align="center" style="text-align:center; ">DE</td></tr>
					 <tr><td align="center" style="text-align:center; ">ADQUISICIÓN</td></tr>
				   </table>
			     </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">FECHA DE INICIO DEL</td></tr>
					 <tr><td align="center" style="text-align:center; ">USO DEL ACTIVO FIJO</td></tr>
				   </table>
			    </td>
               <td align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">DEPRECIACIÓN</td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">PORCENT. DE</td></tr>
					 <tr><td align="center" style="text-align:center; ">DEPREC</td></tr>
				   </table>
			    </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">DEPRECIACIÓN</td></tr>
					 <tr><td align="center" style="text-align:center; ">ACUMULADA</td></tr>
					 <tr><td align="center" style="text-align:center; ">AL CIERRE DEL</td></tr>
					 <tr><td align="center" style="text-align:center; ">EJERCICIO ANTERIOR</td></tr>
				   </table>
			      </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">DEPRECIACIÓN</td></tr>
					 <tr><td align="center" style="text-align:center; ">DEL</td></tr>
					 <tr><td align="center" style="text-align:center; ">EJERCICIO</td></tr>
				   </table>
			     </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">DEPREC. DEL EJERC</td></tr>
					 <tr><td align="center" style="text-align:center; ">RELAC CON LOS</td></tr>
					 <tr><td align="center" style="text-align:center; ">RETIROS / BAJAS</td></tr>
				   </table>
			     </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">DEPREC. RELACIONADA</td></tr>
					 <tr><td align="center" style="text-align:center; ">CON OTROS AJUSTES</td></tr>
				   </table>
			    </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">DEPREC.</td></tr>
					 <tr><td align="center" style="text-align:center; ">ACUMULADA HISTÓRICA</td></tr>
				   </table>
			    </td>
               <td rowspan="2" align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">AJ. POR INFLAC</td></tr>
					 <tr><td align="center" style="text-align:center; ">DE LA DEPREC.</td></tr>
				   </table>
			    </td>
               <td rowspan="2" align = "center" style= "border: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">
					<table>
					 <tr><td align="center" style="text-align:center; ">DEPRECIACIÓN ACUMULADA</td></tr>
					 <tr><td align="center" style="text-align:center; ">AJUSTADA POR INFLACIÓN</td></tr>
				   </table>
			    </td>
            </tr>
            <tr>
               <td align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">DESCRIPCIÓN</td>
               <td align = "center" style= "border-left: 1px solid black; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold; vertical-align: middle; text-align: center;">MÉTODO APLICADO</td>
            </tr>
         </thead>
         <tbody>
            <#list movements as key,mov>
               <tr>
                  <td align = "left ">${mov.col_05_codPropioActivo}</td>
                  <td align = "left ">${mov.col_09}</td>
                  <td align = "left ">${mov.col_11}</td>
                  <td align = "left ">${mov.col_12}</td>
                  <td align = "left ">${mov.col_13}</td>
                  <td align = "left ">${mov.col_14}</td>
                  <td align = "right ">${mov.col_15}</td>
                  <td align = "right ">${mov.col_16}</td>
                  <td align = "right "></td>
                  <td align = "right ">${mov.col_17}</td>

                  <td align = "right ">${mov.col_18}</td>
                  <td align = "right ">${mov.col_19}</td>
                  <td align = "right "></td>
                  <td align = "right ">${mov.col_23}</td>
                  <td align = "right "></td>
                  <td align = "center ">${mov.col_24}</td>
                  <td align = "center ">${mov.col_25}</td>
                  <td align = "center ">${mov.col_26}</td>
                  <td align = "right ">${mov.col_28}</td>
                  <td align = "right ">${mov.col_29}</td>
                  
                  <td align = "right ">${mov.col_30}</td>
                  <td align = "right ">${mov.col_31}</td>
                  <td align = "right ">${mov.col_32}</td>
                  <td align = "right ">${mov.col_35}</td>
                  <td align = "right ">${mov.col_36}</td>
                  <td align = "right ">${mov.col_35}</td>
               </tr>
            </#list>
			<tr>
                  <td align = "left "></td>
                  <td align = "left "></td>
                  <td align = "left "><b>TOTAL GENERAL</b></td>
                  <td align = "left "></td>
                  <td align = "left "></td>
                  <td align = "left "></td>
                  <td style="border:1px solid black;" align = "right">${total.totalMonto_15}</td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right ">${total.totalMonto_16}</td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right "></td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right ">${total.totalMonto_17}</td>
                  
				  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_18}</td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_19}</td>
				  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_23}</td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
				  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_28}</td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_29}</td>
				  
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_30}</td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
				  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_35}</td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right"></td>
                  <td style="border-top:1px solid black;border-right:1px solid black;border-bottom:1px solid black;" align = "right">${total.totalMonto_35}</td>
               </tr>
         </tbody>
      </table>  
  </body>
</pdf>