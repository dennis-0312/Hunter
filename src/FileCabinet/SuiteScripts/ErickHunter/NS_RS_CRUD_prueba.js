/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https', 'N/encode'], function (log, https, encode) {
  function _post(context) {
    let headers1 = [];
    headers1['Content-Type'] = 'text/xml';

    var raw = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n  <soap:Header>\r\n    <SeguridadPx xmlns=\"http://tempuri.org/\">\r\n      <StrToken>SH2PX20230126</StrToken>\r\n      <UserName>PxPrTest</UserName>\r\n      <Password>PX12%09#w</Password>\r\n    </SeguridadPx>\r\n  </soap:Header>\r\n  <soap:Body>\r\n    <AutenticacionUsuarioPx xmlns=\"http://tempuri.org/\" />\r\n  </soap:Body>\r\n</soap:Envelope>";
    const resp = https.post({
      url: "https://www2.huntermonitoreo.com/API_PX/WSPX.asmx",
      headers: headers1,
      body: raw
    });
    log.debug("resp-code", resp);
    return { response: resp.body };
  }
  function _get(context) {

    let headers1 = [];
    headers1['Content-Type'] = 'text/xml';

    var raw = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\r\n  <soap:Header>\r\n    <SeguridadPx xmlns=\"http://tempuri.org/\">\r\n      <StrToken>SH2PX20230126</StrToken>\r\n      <UserName>PxPrTest</UserName>\r\n      <Password>PX12%09#w</Password>\r\n    </SeguridadPx>\r\n  </soap:Header>\r\n  <soap:Body>\r\n    <AutenticacionUsuarioPx xmlns=\"http://tempuri.org/\" />\r\n  </soap:Body>\r\n</soap:Envelope>";
    const resp = https.post({
      url: "https://www2.huntermonitoreo.com/API_PX/WSPX.asmx",
      headers: headers1,
      body: raw
    });
    log.debug("resp-code", resp);
    return { response: resp.body };
  }
  return {
    get: _get,
    post: _post
  }
});
