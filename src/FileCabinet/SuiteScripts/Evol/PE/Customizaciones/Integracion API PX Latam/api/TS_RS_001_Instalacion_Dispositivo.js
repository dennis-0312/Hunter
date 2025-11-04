/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/file', 'N/https', 'N/log', 'N/query', 'N/search', 'N/xml'],
    /**
 * @param{file} file
 * @param{https} https
 * @param{log} log
 * @param{query} query
 * @param{search} search
 * @param{xml} xml
 */
    (file, https, log, query, search, xml) => {
        const TRAMA_PATH = '../resource/requestpx.xml';

        const get = (requestParams) => { }
        const put = (requestBody) => { }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            try {
                let sentence = '';
                let xmlFileContent = file.load(TRAMA_PATH).getContents();
                let xmlDocument = xml.Parser.fromString({ text: xmlFileContent });
                log.debug('xmlDocument', xmlDocument);
                return 'Success';
            } catch (error) {

            }
        }

        const doDelete = (requestParams) => { }
        return { get, put, post, delete: doDelete }

    });


// try {
//     const response = await fetch("https://6460294-sb1.suitetalk.api.netsuite.com/services/rest/record/v1/account", {
//         method: 'GET',
//         headers: {
//             Authorization: 'OAuth oauth_consumer_key="5a4f8cb7161dad09db9ad5a79e96884f43f7da10ffa4e408b436e322b808864e", oauth_nonce="DpAtLFSWZ2V5gHTfVFL0CES0hz1zyeED", oauth_signature="kBCpFE9TdFGv7pd9L4GDdlnJnqZixty%2BkcbRLFXkpQ8%3D", oauth_signature_method="HMAC-SHA256", oauth_timestamp="1737040972", oauth_token="269fe942f76355d2b34cb51de6fb117f08e99de774ced4c712e6cfc446f92f2d", oauth_version="1.0", realm=6460294_SB1"'
//         }
//     });

//     if (response.ok) {
//         const result = await response.json();
//         console.log(result);
//     }
// } catch (err) {
//     console.error(err);
// }