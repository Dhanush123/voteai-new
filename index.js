'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const bitcore = require('bitcore-lib-dash');
const p2p = require('bitcore-p2p-dash');

const server = express();
server.use(bodyParser.json());

var peer = new p2p.Peer({host: "35.227.101.202",network:bitcore.Networks.testnet});
var ready = false;

peer.on("ready", function() {
 ready = true; 
});

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
    var index = body["Result"].toString().indexOf("%");
    var authStatus = body["Result"].toString().substring(index-4,index) > 50.0;
    //body["Result"].toString().toLocaleLowerCase().includes("success");
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
  var privateKey = new bitcore.PrivateKey("cRqQZRvmFgERNAzRJwJgrD4yyS8cz4sYEro5DPMFJnQeZQq7NvwH");
  var address = privateKey.toAddress(); //one of my keys from Dash Qt desktop app
    var utxo = {
    "network":"testnet",
    "txId" : "115e8f72f39fad874cfab0deed11a80f24f967a84079fb56ddf53ea02e308986",
    "outputIndex" : 0,
    "address" : address,
    "script" : new bitcore.Script(address).toHex(),
    "satoshis" : 40
  };

  var transaction = new bitcore.Transaction()
    .from(utxo)
    .to('yXGeNPQXYFXhLAN1ZKrAjxzzBnZ2JZNKnh', 2)
    .sign(privateKey);
  
  if(ready) {
    var msg = new p2p.Messages();
    var tx = messages.Transaction(transaction);
    peer.sendMessage(tx);
  }
  
  console.log("transaction:",transaction.toString());
  
  var speech = "Your vote for presidential candidate " + candidate + " has been recorded."
  return clbk.json({
      speech: speech,
      displayText: speech,
  });
}

//function getCoinbaseProducts() {
// var options = { method: 'GET', url: 'https://api.gdax.com/products' };
//  request(options, function (error, response, body) {
//    if (error) throw new Error(error);
//    body = JSON.parse(body);
//    var relevantPairs = [];
//    for (var i = 0; i < body.length; i++) {
//      if (body[i]["quote_currency"] == "USD") {
//        relevantPairs.push(body[i]);
//      }
//    }
//    console.log("relevant crypto/currency pairs:",relevantPairs);
//    getMinCoinbaseCrypto(relevantPairs);
//  }); 
//}

//function getMinCoinbaseCrypto() {
//  var prices = [];
//  var pairs = ["BTC-USD","ETH-USD","LTC-USD"];
//  var options = { method: 'GET', url:  };//'https://api.gdax.com/products/pair/ticker'
//  for (var i = 0; i < pairs.length; i++) {
//    request(options, function (error, response, body) {
//      if (error) throw new Error(error);
//      body = JSON.parse(body); //just in case
//      prices.append(body["price"]); 
//    });          
//  }
//  while (prices.length != 3) {
//    //wait...
//  }
//  console.log()
//}

server.listen((process.env.PORT || 8000), function () {
  console.log('Server listening');
});