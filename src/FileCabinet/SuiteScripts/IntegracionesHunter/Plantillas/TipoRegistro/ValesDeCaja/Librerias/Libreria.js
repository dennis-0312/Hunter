/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define([], function() {
        /**
         * @param {Number} num 
         * @returns Numero en Letras para Cheques
         */
        function NumeroALetras(num) {
            var data = {
                numero: num,
                enteros: Math.floor(num),
                centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                porcentaje: (((Math.round(num * 100)) - (Math.floor(num) * 100))) == 0 ? '0/100 ' : '/100 ',
                letrasCentavos: '',
            };

            if (data.enteros == 0) {
                return 'CERO ' + ' CON ' + data.centavos + data.porcentaje;
            } else {
                return Millones(data.enteros) + ' CON ' + data.centavos + data.porcentaje;
            }
        }

        function Unidades(num) {
            switch (num) {
                case 1: return 'UN';
                case 2: return 'DOS';
                case 3: return 'TRES';
                case 4: return 'CUATRO';
                case 5: return 'CINCO';
                case 6: return 'SEIS';
                case 7: return 'SIETE';
                case 8: return 'OCHO';
                case 9: return 'NUEVE';
            }

            return '';
        }//Unidades()

        function Decenas(num) {
            var decena = Math.floor(num / 10);
            var unidad = num - (decena * 10);

            switch (decena) {
                case 1:
                    switch (unidad) {
                        case 0: return 'DIEZ';
                        case 1: return 'ONCE';
                        case 2: return 'DOCE';
                        case 3: return 'TRECE';
                        case 4: return 'CATORCE';
                        case 5: return 'QUINCE';
                        default: return 'DIECI' + Unidades(unidad);
                    }
                case 2:
                    switch (unidad) {
                        case 0: return 'VEINTE';
                        default: return 'VEINTI' + Unidades(unidad);
                    }
                case 3: return DecenasY('TREINTA', unidad);
                case 4: return DecenasY('CUARENTA', unidad);
                case 5: return DecenasY('CINCUENTA', unidad);
                case 6: return DecenasY('SESENTA', unidad);
                case 7: return DecenasY('SETENTA', unidad);
                case 8: return DecenasY('OCHENTA', unidad);
                case 9: return DecenasY('NOVENTA', unidad);
                case 0: return Unidades(unidad);
            }
        }//Unidades()

        function DecenasY(strSin, numUnidades) {
            if (numUnidades > 0) {
                return strSin + ' Y ' + Unidades(numUnidades)
            }
            return strSin;
        }//DecenasY()

        function Centenas(num) {
            var centenas = Math.floor(num / 100);
            var decenas = num - (centenas * 100);
            switch (centenas) {
                case 1:
                    if (decenas > 0) {
                        return 'CIENTO ' + Decenas(decenas);
                    }
                    return 'CIEN';
                case 2: return 'DOSCIENTOS ' + Decenas(decenas);
                case 3: return 'TRESCIENTOS ' + Decenas(decenas);
                case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
                case 5: return 'QUINIENTOS ' + Decenas(decenas);
                case 6: return 'SEISCIENTOS ' + Decenas(decenas);
                case 7: return 'SETECIENTOS ' + Decenas(decenas);
                case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
                case 9: return 'NOVECIENTOS ' + Decenas(decenas);
            }
            return Decenas(decenas);
        }//Centenas()

        function Seccion(num, divisor, strSingular, strPlural) {
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)
            var letras = '';

            if (cientos > 0) {
                if (cientos > 1) {
                    letras = Centenas(cientos) + ' ' + strPlural;
                } else {
                    letras = strSingular;
                }
            }

            if (resto > 0) {
                letras += '';
            }
            return letras;
        }//Seccion()

        function Miles(num) {
            var divisor = 1000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            var strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
            var strCentenas = Centenas(resto);

            if (strMiles == '') {
                return strCentenas;
            }
            return strMiles + ' ' + strCentenas;
        }//Miles()

        function Millones(num) {
            var divisor = 1000000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            // var strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
            var strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
            var strMiles = Miles(resto);

            if (strMillones == '') {
                return strMiles;
            }
            return strMillones + ' ' + strMiles;
        }//Millones()
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    return {
        NumeroALetras
    };
});