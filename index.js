'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const server = express();
server.use(bodyParser.json());

server.post('/', function (req, res) {
  console.log('webhook request:',req.body);
  if (req.body.result.action == 'auth') {
    auth(req.body,res);
  }
  else if (req.body.result.action == 'recieve_vote') {
    vote(req.body,res);
  }
  else {
    var speech = "An error has occured. The system could not tell whether you wanted to be authenticated or vote. Please try again.";
    return res.json({
      speech: speech,
      displayText: speech
    });
  }
});

function auth(body,clbk) {
  var url = body["originalRequest"]["data"]["message"]["attachments"][0]["payload"]["url"];
  console.log("url:",url);
  if (url.toString().includes(".jpg")) {
    photoAuth(url, clbk);
  }
  else if (url.toString().includes(".mp4")) {
    voiceAuth(url, clbk);
  }
  else {
    var speech = "Error in voice authentication...";
    return clbk.json({
      speech: speech,
      displayText: speech,
    });
  }
}

function voiceAuth(audioUrl,clbk) {
  var options = { method: 'POST',
  url: 'https://siv.voiceprintportal.com/sivservice/api/authentications/bywavurl',
  headers: 
   { contentlanguage: 'en-US',
     vsitwavurl: audioUrl,
     vsitpassword: 'db135c5b81e061bd4a7bb7b360ee34e778894979440ecace0eb8d12cfe9061cd',
     userid: 'dhanushp',
     vsitdeveloperid: 'c2e297ef8a444fcab3026f0838856a53',
     'content-type': 'audio/wav' } };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    body = JSON.parse(body);
    var authStatus = body["Result"].toString().toLocaleLowerCase().includes("success");
    console.log("voice auth status:",body["Result"]);
    var speech = authStatus ? "Voice authentication has found eligible voter Dhanush Patel.\nWould you like to vote now?" : "Unauthorized access attempt. This incident has been reported!"; 
    return clbk.json({
      speech: speech,
      displayText: speech,
    });
  });  
}

function photoAuth(photoUrl,clbk) {
    var options = { method: 'POST',
    url: 'https://api.clarifai.com/v2/models/SFHacks2018/outputs',
    headers: 
     { authorization: 'Key a55f155142f9481dbb369f5f34bc04e2',
       'content-type': 'application/json' },
    body: { inputs: [ { data: { image: { url: photoUrl } } } ] },
    json: true };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    var confidence = body["outputs"][0]["data"]["concepts"][0]["value"];
    console.log("photo match confidence:",confidence);
    var speech = confidence > 0.9 ? "Facial authentication has found eligible voter Dhanush Patel.\nWould you like to vote now?" : "Unauthorized access attempt. This incident has been reported!"; 
    return clbk.json({
        speech: speech,
        displayText: speech,
      });
    });
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function vote(body,clbk) {
  var candidate = body["result"]["parameters"]["Candidates"];
  var paymentMethod = getRandomInt(2);
  //0 = Dash, 1 = Ethereum
  console.log("candidate:",candidate);
  var privateKey = new bitcore.PrivateKey("yMa4HeiFTvUWTTiukHiV3RsRH6eveakMgR"); //one of my keys from Dash Qt desktop app
    var utxo = {
    "txId" : "115e8f72f39fad874cfab0deed11a80f24f967a84079fb56ddf53ea02e308986",
    "outputIndex" : 0,
    "address" : "yQgGqVdasi5jGfweJ84HJz4qp4ac5G2gxG",
    "script" : new bitcore.Script(address).toHex(),
    "satoshis" : 40
  };

  var transaction = new bitcore.Transaction()
    .from(utxo)
    .to('1Gokm82v6DmtwKEB8AiVhm82hyFSsEvBDK', 2)
    .sign(privateKey);
  
  console.log("transaction:",transaction.toString());
  
  var speech = "Your vote for presidential candidate " + candidate + " has been recorded."
  return clbk.json({
      speech: speech,
      displayText: speech,
  });
}

server.listen((process.env.PORT || 8000), function () {
  console.log('Server listening');
});