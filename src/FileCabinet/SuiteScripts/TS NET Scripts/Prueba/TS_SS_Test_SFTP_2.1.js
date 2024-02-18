/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(["N/log", "N/sftp", "N/file", "N/search", "N/record"],
    function (log, sftp, file, search, record) {

        const execute = (context) => {
            log.error("Schedule Test START", "");
            try {


                var x = 0;

                var connection = sftp.createConnection({    // establish connection to the FTP server
                    username: 'netsuite',
                    passwordGuid: 'f16847704b454d6eaf8b38670d045eb2',
                    url: 'hunterapi.hunter.com.ec',
                    directory: '/',
                    port: 2122,
                    hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABgQDZK6BBOWUzp5XZWvENeFAEwJX1MaGSHmJl/wtBt2kLegoi0AEL8nK4+g4V7eUtwOkJ4n0IhMVty+06Q6aonUKggdLRtADbsBrjHXI36PbkNDhfNcF4zcFpEzIjx5i/9ASdcHfRlI5s7NuUgZy3QTuUKiQ6YykQJwS3LQ4Y3s8fdVLNsw4GRW4ElT2QuabDzQyZZviqlyOT6o+LggFbXDscN/cyiZI/cMS+0nPnxkXofgochCh2AQUNZxzVMTdcfIrk93ShXtJa/q3ISeN4GHN234gXYtq4cAxPcn2c+2HRsB3Ub3KQwWNYx/aKCkcWqgC4bU24F1uw4C9Z2XgPMS5s5MJEtxZkWJ7XovWucVFtW1DfS+7LOiy2YiL3SwlOEdc9Xm3cV5utQxL2S8LwC0D9IK5iZZFHIUzxR824vLFH1UJqAuZsdFTblyEhMgba9ovCQXcvNEDxSynHYQEP3gwhN8DYPb6qyt4VHH8STKwfKfRa9bK9CRdaHaKVrDFm+Ds=' // references var myHostKey

                });

                // Create a file to upload using the N/file module
                var myFileToUpload = file.create({
                    name: 'test.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: 'I am a test file.'
                });

                connection.upload({
                    directory: '/',
                    filename: 'newTestFile.txt',
                    file: myFileToUpload,
                    replaceExisting: true
                });

                // Download the file from the remote server
                let downloadedFile = connection.download({
                    directory: '/',
                    filename: 'newTestFile.txt'
                });

                log.error("downloadedFile", downloadedFile.name);
            } catch (error) {
                log.error("error", error);
            }


            log.error("Schedule Test END", "");
        }

        return {
            execute
        }
    }
)