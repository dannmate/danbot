const client = require("twilio")(process.env["SID"], process.env["KEY"]);
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const mongo = require("mongodb").MongoClient;
var qs = require("querystring");
var emoji = require("moji-translate");
const BoxSDK = require("box-node-sdk");
var request = require('request');
const Dropbox = require('dropbox').Dropbox;
const fetch = require('isomorphic-fetch'); 
const Util = require("../Util.js");

module.exports = async function(context, req) {
  context.log("JavaScript HTTP trigger function processed a request.");
  var bdy = qs.parse(req.body);
  var msg_result = await GetMessage(bdy);

  const twiml = new MessagingResponse();
  const message = twiml.message(msg_result.msg_send);
  if (msg_result.media != '')  message.media(msg_result.media);
  context.res = {
    status: 200,
    body: twiml.toString(),
    headers: { "Content-Type": "text/xml" }
  };
  context.done();
};

async function GetMessage(msg_recv) {
  return new Promise((resolve, reject) => {
    const url = process.env["MONGO_PW"];
    
    var msg_to_send = '';
    mongo.connect(
      url,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      (err, client) => {
        if (err) {
          console.error(err);
          return;
        }
        const db = client.db("danbotdb");
        const Users = db.collection("Users");
        
        Users.findOne({ num: msg_recv.From }, function(err, User) {
          if (err) {
            console.error(err);
            return;
          }
         
          if (User.said_hi == 0) {
            var botnm = '';
            if (User.name == 'Ney ne') { botnm = "NOSE-BOT!!"}
            else if (User.name == 'bb') {botnm = "BB-BOT!!"}
            else {botnm = "DAN-BOT!!"}
            msg_to_send =
              "Hi " +
              User.name +
              "!\nThis is Daniel.. I am a chat-bot for Daniel... aka the " + botnm + emoji.getEmojiForWord('robot') + "Before you can chat with me further I first must verify you! Please answer the following question: \n\n" +
              User.auth_msg;
              Users.updateOne({num: User.num}, {'$set': {'said_hi': 1}}, (err, updateitem) => {
              })
            resolve({msg_send: msg_to_send, media: ''});
          } else if (User.said_hi == 1 & User.is_auth == 0)  {
                 if (User.auth_answer == msg_recv.Body.toString().toUpperCase()) {
                  msg_to_send = "You're authorized " + User.name + "!" + emoji.translate('clap') +  "\n"+ User.christmas_msg + "\n" 
                                +  emoji.getEmojiForWord('love') + 
                                "\n\nThe real Daniel has created this for you, you can: \n-Ask me a funny joke \n-Show you a memory of our family \n-Get the weather for where Daniel currently is \n-Or just tell me how much you love me! Plus lots more interactions!"
                                + "\nTest it out, ask me to tell you a joke!\nOr type 'Help' for a list of commands.";
                  
                  Users.updateOne({num: User.num}, {'$set': {'is_auth': 1}}, (err, updateitem) => { })
                  resolve({msg_send: msg_to_send, media: ''})

                 } else {
                  msg_to_send = "Oh no wrong answer, don't be cheeky - try again!";
                  resolve({msg_send: msg_to_send, media: ''})
                 }

          } else if (User.said_hi == 1 & User.is_auth == 1){ //MAIN CONVERSATION
               
                if (msg_recv.Body.toString().toUpperCase() == 'TELL ME A JOKE') {

                  request.get({
                    url: 'https://icanhazdadjoke.com/',
                    json: true,
                    headers: { 'User-Agent': 'request' }
                  }, (err, response, data) => {
                    if (err) {
                      console.log('Error:', err);
                    } else if (response.statusCode !== 200) {
                    } else {
                       resolve({msg_send: data.joke, media: ''})  
                    }
                  });

                }
                else if (User.name == 'bb' & Util.Contains(msg_recv.Body.toString().toUpperCase(), 'BB MEM')){
                  var dbx = new Dropbox({ accessToken: process.env["DROPBOX_TOKEN"], fetch: fetch });
                  dbx.filesListFolder({path: ''})
                    .then(function(response) {
                    img_path = response.entries[Math.floor(Math.random() *response.entries.length)].path_display;
                    dbx.filesGetTemporaryLink({"path": img_path})
                    .then(function(response) {
                      resolve({msg_send: 'iz mem', media:  response.link})
                    })
                    .catch(function(error) {
                      console.log(error);
                    });
                    })
                    .catch(function(error) {
                      console.log(error);
                    });
                }
                else if (Util.Contains(msg_recv.Body.toString().toUpperCase(), 'I LOVE YOU') || Util.Contains(msg_recv.Body.toString().toUpperCase(), 'I LUV')){
                    if( User.name == 'bb') {
                      var collection = require('../bbnames.json');
                      var bbname = collection.bbnames[Math.floor(Math.random()*collection.bbnames.length)].name;
                      collection = require('../love.json');
                      var love =  collection.love[Math.floor(Math.random()*collection.love.length)].name;
                    
                       resolve({msg_send: 'I ' + love + ' ' + bbname, media: ''});
                    } else if (User.name == 'Brendan') {
                      resolve({msg_send: 'I love you too bro', media: ''});
                    } else {
                      resolve({msg_send: 'I love you too ' + User.name , media: ''});
                    }              
                } else if (User.name == 'Ney ne' & Util.Contains(msg_recv.Body.toString().toUpperCase(), 'YOU NOSE')) {
                  resolve({msg_send: 'I love you too!' , media: ''});
                } else if (Util.Contains(msg_recv.Body.toString().toUpperCase(), 'FAMILY MEM')) {

                  var jsonConfig = require("../box-config1.json");
                  var sdk = BoxSDK.getPreconfiguredInstance(jsonConfig);

                  var boxclient = sdk.getAppAuthClient("enterprise");

                  Util.GetRandomItem(boxclient).then(item => {
                    //console.log(item.path);
                    boxclient.files
                      .update(item.id, { shared_link: boxclient.accessLevels.OPEN })
                      .then(file => {
                        //console.log(file.shared_link.download_url);
                        //console.log(item.path);

                        resolve({
                          media: file.shared_link.download_url,
                          msg_send: item.path
                        });
                      });
                  });
                } else if (Util.Contains(msg_recv.Body.toString().toUpperCase(), 'WEATHER') || Util.Contains(msg_recv.Body.toString().toUpperCase(), 'WEATHAH')) {
                  var strReplaceList = require("../weather_str_replace.json").list;
                  var url = "https://api.darksky.net/forecast/ " + process.env["DARKSKY_API_KEY"] + "/49.282730,-123.120735";
                  request.get(
                    {
                      url: url,
                      json: true,
                      headers: { "User-Agent": "request" }
                    },
                    (err, res, data) => {
                      if (err) {
                        console.log("Error:", err);
                      } else if (res.statusCode !== 200) {
                        console.log("Status:", res);
                      } else {
                        var icon = data.hourly.icon;
                        var summary = Math.round(data.currently.temperature) + "F / " + (Math.round((data.currently.temperature - 32) / 1.8)) + "C\n\n" + data.hourly.summary;
                        if (User.name == 'bb') {
                          for (var i in strReplaceList) {                         
                            summary = Util.ReplaceAll(summary, strReplaceList[i].from, strReplaceList[i].to);                        
                          }
                        }
                        resolve({msg_send: summary, media: ''});

                      }
                    }
                  );
                }
                else if ((msg_recv.Body.toString().toUpperCase() == 'HELP')) {
                  resolve({msg_send: "Tell me a joke\nShow me the weather\nShow me a family memory", media: ''});
                }
                else {
                  resolve({msg_send: "Sorry, I don't understand that!", media: ''});
                }
                         
          } 
        });
      }
    );
  });
}

