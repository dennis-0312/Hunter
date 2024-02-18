/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */
define(['N/sftp'], function(sftp) {
    var x = 0;
    function execute(context) {
        var x = 0;
        var objConnection = sftp.createConnection({    // establish connection to the FTP server
      
          username: 'netsuite',
      
          passwordGuid: '',
      
          url: 'hunteronline.com.ec',
      
          directory: '/',
    
          port: 2122,
      
          hostKey: 'myHostKey' // references var myHostKey
      
      });
      
        // Create a file to upload using the N/file module
        var myFileToUpload = file.create({
            name: 'originalname.js',
            fileType: file.Type.PLAINTEXT,
            contents: 'I am a test file.'
        });
    
        // Upload the file to the remote server
        connection.upload({
            directory: 'FEL',
            filename: 'newFileNameOnServer.js',
            file: myFileToUpload,
            replaceExisting: true
        });

    }
    return {
      execute: execute
    }
    var y = 0;
  })