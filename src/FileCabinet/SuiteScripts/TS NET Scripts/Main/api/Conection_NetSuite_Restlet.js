let headersList = {
    "Accept": "*/*",
    "User-Agent": "Thunder Client (https://www.thunderclient.com)",
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJraWQiOiJjLjc0NTEyNDFfU0IxLjIwMjMtMDgtMzFfMDAtMDktMzUiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMDAwOzQiLCJhdWQiOlsiN0Y2MUY4RUEtO" +
    "EE5Mi00QTFFLUFBMDktNEQxNTBGODdFNEEwOzc0NTEyNDFfU0IxIiwiNTU2ZTE0NjkyNmQ3YmIzZjI3YjFlODU3NWE3ZThiZGYwNzQ1Njk3NWQ4OGRiYzJiNDZjYThjMWRkNzA0ODVkNiJdLCJzY29wZSI6WyJyZXN0b"+
    "GV0cyJdLCJpc3MiOiJodHRwczpcL1wvc3lzdGVtLm5ldHN1aXRlLmNvbSIsIm9pdCI6MTY5NjYyMzg4MCwiZXhwIjoxNjk2NjI3NDgwLCJpYXQiOjE2OTY2MjM4ODAsImp0aSI6Ijc0NTEyNDFfU0IxLmEtYS40ZWUzNDk"+
    "3Mi1lMzk1LTQ5ZDgtYTZhYy0xNTlkNGJiOTIyYjBfMTY5NjYyMzg4MDExOC4xNjk2NjIzODgwMTE4In0.gdOev7gZTNFiP99NuAa7TF8n94ycRJUomSUUck32f_YmA8tkkJ65kngfdC8ylb6SrLTsxGaI4uMTj-REQemo6X"+
    "qZqyOI87B1FeveLEy8X0zYimiYaupMd4Rf-C3mRoYTqcQyk_4b4pSw92K-uYR8ZBLAekDCzSOgHa3d4a5C3SY8FK8UqCi6dDpZBAakqIYtxrb2pW-tVwybUidjVwAtZqaUoVmoDI6LvR2jFf_h-KuhgBonXIFx5OpE_WRBhf52"+
    "KGr3uhjv-5LkwxixBoeVnfmgA3ZpRBU1TmwCVTwnt6rzr2fBS6KiARX4Jlx7tTd2H4I6KaAGkPONd4jpercC94zSRIyu5AMGan_htU-LeI9KQnYx4CoTbldfAxemsdxNsS4I9E7Zspp8VJYO07Cv6ddZnCWtx2MSGBg7GlAKwF"+
    "6NXTVFBiYmSJ6OOJ1S6dogCeSK8LHe1fquFRMqZOJ-QDF6YJngg-K9YrWt-1tXBw6cN8N7ifrMPJkhIsZG-1PHXnU3tWQrBpRvsbyrvwIUniwIt9M1TEInNRMef1_0a2vfPSKxq4idLGbmxJv3ezaN7ID6pM1UEHPImiyq_bcrX"+
    "tkyF17jP5h5FqaEhzBXd1fA2zc2pOPhd7-6yCLl3La2MKRz5o-AJMZQeJ3CyDkrOhH_HMMB0w0VEzkmpN2gnD4"
   }
   
   let response = await fetch("https://7451241-sb1.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=694&deploy=1&desde=01%2F04%2F2023&hasta=20%2F09%2F2023", { 
     method: "GET",
     headers: headersList
   });
   
   let data = await response.text();
   console.log(data);
   



   