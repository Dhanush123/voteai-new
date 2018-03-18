'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const server = express();
server.use(bodyParser.json());

server.post('/', function (req, res) {
  console.log('webhook request');
  try {
      if (req.body) {
          var requestBody = req.body;
          if (requestBody.result) {
            if (requestBody.result.action == 'auth') {
              console.log("going to auth intent...");
              auth(requestBody,res);
            }
          }
      }
  }
  catch (err) {
    console.error('Cannot process request', err);
    return res.status(400).json({
        status: {
            code: 400,
            errorType: err.message
        }
    });
  }
});

function auth(body,clbk) {
  console.log("even in auth???");
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
  console.log("in voiceAuth!!!");
  var options = { method: 'POST',
  url: 'https://siv.voiceprintportal.com/sivservice/api/authentications/bywavurl',
  headers: 
   { contentlanguage: 'en-US',
     vsitwavurl: audioUrl,
     vsitpassword: 'db135c5b81e061bd4a7bb7b360ee34e778894979440ecace0eb8d12cfe9061cd',
     userid: 'dhanushp',
     vsitdeveloperid: 'c2e297ef8a444fcab3026f0838856a53',
     'content-type': 'audio/wav' } };
  console.log("before request...");
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log("no error...");
    var authStatus = body["Result"].includes("successful");
    console.log("voice auth status:",body["Result"]);
    var speech = authStatus ? "Voice authentication has found eligible voter Dhanush Patel." : "Unauthorized access attempt. This incident has been reported!"; 
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
    var speech = confidence > 0.9 ? "Facial authentication has found eligible voter Dhanush Patel." : "Unauthorized access attempt. This incident has been reported!"; 
    return clbk.json({
        speech: speech,
        displayText: speech,
      });
    });
}

server.listen((process.env.PORT || 8000), function () {
  console.log('Server listening');
});