
let data = [
    [
        ["107", "136", "FAM", "HU"],
        ["160", "1798", "PED", "S"],
        ["161", "1799", "PNB", "N"],
        ["113", "1798", "PPS", "S"],
        ["114", "1798", "PRG", "S"],
        ["144", "1799", "PXB", "N"],
        ["116", "7", "TAG", "LOJ"],
        ["141", "1798", "VDP", "S"],
        ["104", "1838", "ADP", "004"],
        ["105", "1799", "APR", "N"],
        ["127", "1798", "CPI", "S"],
        ["106", "1799", "CPR", "N"],
        ["121", "1798", "GOC", "S"],
        ["108", "1798", "GOF", "S"],
        ["143", "1799", "PCD", "N"],
        ["112", "1798", "PHV", "S"],
        ["123", "1798", "PPC", "S"],
        ["125", "1807", "TCH", "001"],
        ["142", "1839", "TRN", "001"],
        ["118", "3060", "TTR", "REN"]
    ],
    [
        ["104", "1838", "ADP", "004"],
        ["105", "1799", "APR", "N"],
        ["106", "1799", "CPR", "N"],
        ["107", "127", "FAM", "CC"],
        ["121", "1798", "GOC", "S"],
        ["108", "1798", "GOF", "S"],
        ["138", "1799", "IET", "N"],
        ["143", "1799", "PCD", "N"],
        ["160", "1799", "PED", "N"],
        ["112", "1798", "PHV", "S"],
        ["161", "1799", "PNB", "N"],
        ["123", "1798", "PPC", "S"],
        ["113", "1798", "PPS", "S"],
        ["130", "1799", "PVC", "N"],
        ["144", "1799", "PXB", "N"],
        ["116", "1", "TAG", "MON"],
        ["125", "1811", "TCH", "002"],
        ["142", "1839", "TRN", "001"],
        ["118", "3014", "TTR", "CHR"],
        ["141", "1798", "VDP", "S"],
        ["127", "1798", "CPI", "S"]
    ],
    [
        ["107", "136", "FAM", "HU"],
        ["160", "1798", "PED", "S"],
        ["161", "1799", "PNB", "N"],
        ["113", "1798", "PPS", "S"],
        ["114", "1798", "PRG", "S"],
        ["144", "1799", "PXB", "N"],
        ["116", "7", "TAG", "LOJ"],
        ["141", "1798", "VDP", "S"],
        ["104", "1838", "ADP", "004"],
        ["105", "1799", "APR", "N"],
        ["127", "1798", "CPI", "S"],
        ["106", "1799", "CPR", "N"],
        ["121", "1798", "GOC", "S"],
        ["108", "1798", "GOF", "S"],
        ["143", "1799", "PCD", "N"],
        ["112", "1798", "PHV", "S"],
        ["123", "1798", "PPC", "S"],
        ["125", "1807", "TCH", "001"],
        ["142", "1839", "TRN", "002"],
        ["118", "3060", "TTR", "REN"]
    ],
    [
        ["107", "136", "FAM", "AB"],
        ["160", "1798", "PED", "S"],
        ["161", "1799", "PNB", "N"],
        ["113", "1798", "PPS", "S"],
        ["114", "1798", "PRG", "S"],
        ["144", "1799", "PXB", "N"],
        ["116", "7", "TAG", "LOJ"],
        ["141", "1798", "VDP", "S"],
        ["104", "1838", "ADP", "004"],
        ["105", "1799", "APR", "N"],
        ["127", "1798", "CPI", "S"],
        ["106", "1799", "CPR", "N"],
        ["121", "1798", "GOC", "S"],
        ["108", "1798", "GOF", "S"],
        ["143", "1799", "PCD", "N"],
        ["112", "1798", "PHV", "S"],
        ["123", "1798", "PPC", "S"],
        ["125", "1807", "TCH", "001"],
        //  ["142", "1839", "TRN", "001"],
        ["118", "3060", "TTR", "REN"]
    ],
];


function groupByArray(arr) {
    let result = [];

    try {
        arr.forEach(subArray => {
            // Buscar en el sub arreglo
            let famItem = subArray.find(item => item[2] === 'FAM');
            let trnItem = subArray.find(item => item[2] === 'TRN');
            let adpItem = subArray.find(item => item[2] === 'ADP');

            // Si falta alguno de los campos FAM, ADP, o TRN, agregar un mensaje de error
            if (!famItem || !adpItem || !trnItem) {
                let errorGroup = [];
                if (!famItem) {
                    errorGroup.push(['FAM_FIELD_NOT_FOUND']);
                } else {
                    errorGroup.push(famItem);
                }

                if (!adpItem) {
                    errorGroup.push(['ADP_FIELD_NOT_FOUND']);
                } else {
                    errorGroup.push(adpItem);
                }

                if (!trnItem) {
                    errorGroup.push(['TRN_FIELD_NOT_FOUND']);
                } else {
                    errorGroup.push(trnItem);
                }

                result.push(errorGroup);
                return;
            }

            // Verificar si ya existe un grupo de familias con el mismo valor en index 3
            let existingGroup = result.find(group => group.some(gItem => gItem[2] === 'FAM' && gItem[3] === famItem[3]));

            if (existingGroup) {
                // Si ya existe un grupo con el mismo FAM, verificamos si TRN es diferente
                let trnExists = existingGroup.some(gItem => gItem[2] === 'TRN' && gItem[3] === trnItem[3]);

                if (!trnExists) {
                    // Si el TRN es diferente, agregarlo al mismo grupo de familias
                    existingGroup.push(trnItem);
                }
            } else {
                // Si no existe un grupo con el FAM, crear uno nuevo
                result.push([famItem, adpItem, trnItem]);
            }

        });

        // por si las dudas eliminamos los posibles duplicados
        result = result.filter((group, index, self) => {
            let groupString = JSON.stringify(group);
            return self.findIndex(g => JSON.stringify(g) === groupString) === index;
        });
    } catch (error) {
        console.log(error.message);
        result = [];
    }

    return result;
}

let groupedData = groupByArray(data);

console.log(groupedData);

/*
[
  [
    [ '107', '136', 'FAM', 'HU' ],
    [ '104', '1838', 'ADP', '004' ],
    [ '142', '1839', 'TRN', '001' ],
    [ '142', '1839', 'TRN', '002' ]
  ],
  [
    [ '107', '127', 'FAM', 'CC' ],
    [ '104', '1838', 'ADP', '004' ],
    [ '142', '1839', 'TRN', '001' ]
  ],
  [
    [ '107', '136', 'FAM', 'AB' ],
    [ '104', '1838', 'ADP', '004' ],
    [ 'TRN_FIELD_NOT_FOUND' ]
  ]
]
*/