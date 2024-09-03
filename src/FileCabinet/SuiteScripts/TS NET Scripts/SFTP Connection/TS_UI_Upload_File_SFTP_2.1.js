/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
*/

define(["N/log", "N/sftp", "N/file", "N/search", "N/record"],
    function (log, sftp, file, search, record) {

        const onRequest = (context) => {
            try {
                log.error("start", "onRequest");
                if (context.request.method === 'GET') {
                    let fileId = context.request.parameters.fileId;
                    log.error("fileId", JSON.stringify(context.request.parameters));
                    if (!fileId) {
                        context.response.write(JSON.stringify({ status: "error" }));
                    } else {
                        let myFileToUpload = file.load({ id: fileId });
                        log.error("myFileToUpload", myFileToUpload.name);
                        let connection = connectSftp();
                        log.error("connection", connection);
                        connection.upload({
                            directory: '/',
                            filename: myFileToUpload.name,
                            file: myFileToUpload,
                            replaceExisting: true
                        });
                        log.error("end", { status: "ok" });
                        context.response.write(JSON.stringify({ status: "ok" }));
                    }
                }
            } catch (error) {
                log.error("error", error);
                context.response.write(JSON.stringify({ status: "error" }));
            }
        }

        function connectSftp() {
            let username = 'netsuite';
            let passwordGuid = "13a99046e84e42b49f4f293b9fe26562";
            let url = 'hunterapi.hunter.com.ec';
            let hostKey = 'AAAAB3NzaC1yc2EAAAADAQABAAABgQDZK6BBOWUzp5XZWvENeFAEwJX1MaGSHmJl/wtBt2kLegoi0AEL8nK4+g4V7eUtwOkJ4n0IhMVty+06Q6aonUKggdLRtADbsBrjHXI36PbkNDhfNcF4zcFpEzIjx5i/9ASdcHfRlI5s7NuUgZy3QTuUKiQ6YykQJwS3LQ4Y3s8fdVLNsw4GRW4ElT2QuabDzQyZZviqlyOT6o+LggFbXDscN/cyiZI/cMS+0nPnxkXofgochCh2AQUNZxzVMTdcfIrk93ShXtJa/q3ISeN4GHN234gXYtq4cAxPcn2c+2HRsB3Ub3KQwWNYx/aKCkcWqgC4bU24F1uw4C9Z2XgPMS5s5MJEtxZkWJ7XovWucVFtW1DfS+7LOiy2YiL3SwlOEdc9Xm3cV5utQxL2S8LwC0D9IK5iZZFHIUzxR824vLFH1UJqAuZsdFTblyEhMgba9ovCQXcvNEDxSynHYQEP3gwhN8DYPb6qyt4VHH8STKwfKfRa9bK9CRdaHaKVrDFm+Ds=';
            let port = 2122;
            let directory = '/RecursoDELEC_SANDBOX';
            let timeout = '';
            let hostKeyType = 'rsa';
            let connection = getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout);

            return connection;
        }

        function getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout) {
            let preConnectionObj = {};
            preConnectionObj.passwordGuid = passwordGuid;
            preConnectionObj.url = url;
            preConnectionObj.hostKey = hostKey;
            if (username) { preConnectionObj.username = username; }
            if (hostKeyType) { preConnectionObj.hostKeyType = hostKeyType; }
            if (port) { preConnectionObj.port = Number(port); }
            if (directory) { preConnectionObj.directory = directory; }
            if (timeout) { preConnectionObj.timeout = Number(timeout); }

            let connectionObj = sftp.createConnection(preConnectionObj);
            return connectionObj;
        }

        return {
            onRequest
        }
    }
)