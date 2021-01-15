// server.js
// where your node app starts
// init project
const Discord = require('discord.js');
const ms = require('ms');
const fs = require('fs');
const opus = require('opusscript');
const cheerio = require('cheerio');
const request = require('request');
//const speech = require('web-speech');
const { Client, Attachment, RichEmbed } = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");
var xp = require("./xp.json");
var eco = require("./eco.json");
var ticket = require("./ticket.json");
var nextLv = require("./nextLv.json");
//const { request } = require('http');

const bOwner = config.ownerID;
const prefix = config.prefix;
const token = config.token;
const gu = config.guild;
const talkedRecently = new Set();
const talkedNoMoney = new Set();
const ticketRecently = new Set();
const lvRoles = {0:'682658762393518251', 5:'682658760208023570', 10:'682658757943361561', 20:'682658755824844846', 30:'682658749961601028'}

var permissionLevel = 0;
var tempoMute = [[]];
var tempoOnMin = 1000;
var staff = [["316988662799925249", 0, 0], ["306101030704119808", 0, 0],["457523600530866187", 0, 0], ["302479840563691521", 0, 0], ["267303785880223744", 0, 0], ["207785335990648832", 0, 0], ["397191718577111050", 0, 0], ["308263263739838464", 0, 0], ["202787285266202624", 0, 0], ["457125304058773506", 0, 0], ["541679053904805900", 0, 0], ["327870532735205387", 0, 0]];
var currency = '€';
var xpTemp = 0;
var entrate1 = 0;
var entrate2 = 0;
var entrate3 = 0;
var logChan = "783976312955076629";
const namek = "316988662799925249";
const io = "143318398548443136";
var ticketMessage = '708369096571617472';
var menzionare = true;
var tagTime = 60;
var pingRole;


function eliminazioneMess(message, msg)//funzione per eliminare il messaggio di risposta
{
 setTimeout(function(){
   if(msg)msg.delete();
    if(message)message.delete();
  }, 10000)
  return;
}

function wait(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

function levelUp(message, utente){
  let xpNec = 0;
  for (let i = 1; i <= xp[utente.id].level; i++) {
    xpNec += nextLv[i.toString()];
  }
  let lvlEmbed = new Discord.RichEmbed()
    .setAuthor(utente.username)
    .setColor('#14c5a2')
    .addField('Level', xp[utente.id].level, true)
    .addField('XP', xp[utente.id].xp, true)
    .setFooter(Math.floor(xpNec)-Math.floor(xp[utente.id].xp)+" XP per il prossimo livello", utente.displayAvatarURL());
  
  message.channel.send(lvlEmbed).then(msg => {
    msg.delete(20000)
    message.delete(5000)
  });
}

function sayError(message){
  let voiceChannel = message.member.voice.channel;
  if(voiceChannel){
      voiceChannel.join().then(connection =>{
          const dispatcher = connection.play("./audio/error.mp3");
          dispatcher.on("finish", end => {voiceChannel.leave();});
      }).catch(err => console.log(err));
  }
}

function sendImage(message, topic){
  var options = {
    url: "http://results.dogpile.com/serp?qc=images&q="+topic,
    method: "GET",
    headers: {
      "Accept": "text/html",
      "User-Agent": "Chrome"
    }
  };

  request(options, function(error, response, responseBody){
    if(error){
      message.channel.reply("Errore imprevisto").then(msg=>eliminazioneMess(message,msg));
      return;
    }

    $ = cheerio.load(responseBody)

    var links = $(".image a.link");
    var urls = new Array(links.length).fill(0).map((v, i) => links.eq(i).attr("href"));

    console.log(urls);
    
    if(!urls.length){
      message.channel.reply("Errore imprevisto").then(msg=>eliminazioneMess(message,msg));
      return;
    }

    message.channel.send(urls[Math.floor(Math.random()*urls.length)]);
  })
}

function rejectTicket(msg, utente, ch){
  utente.send("Ticket respinto")
  ticket[utente.id].nTickets=parseInt(ticket[utente.id].nTickets)-1;
  fs.writeFile("./ticket.json", JSON.stringify(ticket), (err) => {
    if(err) message.channel.send(err)
  });

  ch.overwritePermissions([
    {
      id: utente.id,
      deny: ['VIEW_CHANNEL']
    }
  ])

  client.channels.fetch(logChan).send(new Discord.RichEmbed()
  .setAuthor("Ticket "+ch.name, client.user.displayAvatarURL({dynamic:true}))
  .setColor('#D49F07')
  .setDescription("Ticket chiuso da "+msg.reactions.cache.get('❎').users.first().tag)
  .setFooter("Mod id: "+msg.reactions.cache.get('❎').users.first().id, msg.reactions.cache.get('❎').users.first().displayAvatarURL({dynamic_true})))

  ch.send(new Discord.RichEmbed()
    .setTitle("Ticket chiuso")
    .setFooter("Ticket chiuso da "+msg.reactions.cache.get('❎').users.first().username,msg.reactions.cache.get('❎').users.first().displayAvatarURL({dynamic:true})))
  .then(async msg=>{
    await msg.react('🗑️')
    deleteTicket(msg, false)
  })
}

async function deleteTicket(msg, error){
  let filtro = (reaction, user) => {
    return ['🗑️'].includes(reaction.emoji.name) && user.id!=client.user.id
  }
  await msg.awaitReactions(filtro, {max:1, time: 259200000, errors:['time']})
  .then(async ()=>{
    if(!error)await msg.reactions.cache.get('🗑️').remove()
    await client.channels.fetch(logChan).send(new Discord.RichEmbed()
    .setAuthor("Ticket #"+msg.channel.name, client.user.displayAvatarURL({dynamic:true}))
    .setColor('#000000')
    .setDescription("Ticket eliminato da "+msg.reactions.cache.get('🗑️').users.first().tag)
    .setFooter("Mod id: "+msg.reactions.cache.get('🗑️').users.first().id,msg.reactions.cache.get('🗑️').users.first().displayAvatarURL({dynamic:true})))

    if(msg.channel.client.user.id == client.user.id)msg.channel.delete();
  })
  .catch(async (err)=> {
    console.log(err)
    await client.channels.fetch(logChan).send(new Discord.RichEmbed()
    .setAuthor("Ticket #"+msg.channel.name, client.user.displayAvatarURL({dynamic:true}))
    .setColor('#000000')
    .setDescription("Ticket eliminato da "+msg.reactions.cache.get('🗑️').users.first().tag)
    .setFooter("Mod id: "+msg.reactions.cache.get('🗑️').users.first().id,msg.reactions.cache.get('🗑️').users.first().displayAvatarURL({dynamic:true})))

    if(msg.channel.client.user.id == client.user.id)msg.channel.delete();
  })
}

client.on('ready', () => {
  console.log('Wow il bot è online')


  /*client.api.applications(client.user.id).commands.post({data:{
    name: 'info',
    description: 'Mostra le informazioni del bot'
  }})*/
  
  try{
    client.ws.on('INTERACTION_CREATE', async interaction => {
      // do stuff and respond here
      console.log(interaction)
      console.log(interaction.data.options)
      var dati = {
          type: 2
      }

      switch(interaction.data.name){
        case "help":
          dati = {
            type: 4,
            data: {
              embeds: [{
                color: 0x15EE0E,
                title: "Elenco comandi",
                author: {
                  name: client.user.username,
                  icon_url: client.user.avatarURL()
                },
                description: "Lista dei comandi del bot",
                fields: [
                  {
                    name: "Other",
                    value: "`avatar` `serverIcon` `catgirl` `image` `d` `conv` `moduli` `send` `sendas` `sendas` `override` `join` `get rick rolled`"
                  },
                  {
                    name: "Level",
                    value: "`level` `allLevel`"
                  },
                  {
                    name: "Economy",
                    value: "`money` `give-money` `add-money` `remove-money`"
                  },
                  {
                    name: "Mod",
                    value: "`vmute` `vunmute` `mute`"
                  }
                ],
                thumbnail: {
                  url: (await client.guilds.cache.get(interaction.guild_id)).iconURL()
                },
                timestamp: new Date(),
                footer: {
                  text: (await client.users.fetch(bOwner)).tag,
                  icon_url: (await client.users.fetch(bOwner)).avatarURL({dynamic: true})
                }
              }]
            }
          }
          break;

          case "changelog":
            let changelog = require("./update.json");
            /*var embed = new Discord.MessageEmbed()
            .setAuthor("Changelog#"+changelog.num, client.user.avatarURL())
            .setTitle("Version: "+changelog.version)
            .setColor("#EB8C21")
            .setDescription(changelog.descizione)
            .setThumbnail(message.guild.iconURL())
            .setTimestamp()
            .setFooter(changelog.todo);
          
            if(client.users.cache.get(bOwner)){
              embed.setFooter(changelog.todo, client.users.cache.get(bOwner).avatarURL());
            }*/
            dati = {
              type: 4,
              data: {
                embeds: [{
                  color: 0xEB8C21,
                  title: "Version: "+changelog.version,
                  author: {
                    name: "Changelog#"+changelog.num,
                    icon_url: client.user.avatarURL()
                  },
                  description: changelog.descizione,
                  thumbnail: {
                    url: (await client.guilds.fetch(interaction.guild_id)).iconURL()
                  },
                  timestamp: new Date(),
                  footer: {
                    text: "TODO: "+changelog.todo,
                    icon_url: (await client.users.fetch(bOwner)).avatarURL({dynamic: true})
                  }
                }]
              }
            }
            break;
      }
      client.api.interactions(interaction.id, interaction.token).callback.post({data: dati})
    })
  }catch(err){
    console.log(err);
  }
  /*
  client.channels.get("708368858439876678").fetchMessage(ticketMessage);
  
  setInterval(() => {
  
  var ch1 = "690874112809369660" //channel1 id
  var ch2 = "690874154538238020" //channel2 id
  var ch3 = "690874196171030578" //channel3 id

          if(!client.guilds.get(gu)) return
          if(!client.channels.get(ch1)) return
          if(!client.channels.get(ch2)) return
          if(!client.channels.get(ch3)) return

          var on = client.guilds.get(gu).members.filter(m => m.presence.status === 'online').size
          var dnd = client.guilds.get(gu).members.filter(m => m.presence.status === 'dnd').size
          var afk = client.guilds.get(gu).members.filter(m => m.presence.status === 'idle').size 
          var online = parseInt(on) + parseInt(dnd) + parseInt(afk)
          var staff = client.guilds.get(gu).roles.get('683049440700923930').members
          var staffOnline = staff.size - staff.filter(m => m.presence.status === 'offline').size
          var utentiVocal = client.guilds.get(gu).roles.get('690873576508751932').members.size

          client.channels.get(ch1).setName("👮‍♂️ staff_online_" + staffOnline)
          client.channels.get(ch2).setName("📢Connessi in vocal: " + utentiVocal)
          client.channels.get(ch3).setName("✔ Online: " + online)
    }, 60000); */
})

client.on('message', async (message) =>{
  let messageAr =  message.content.split(" ");
  let cmd = messageAr[0];
  let args = messageAr.slice(1);
  var argresult = args.join(' ');
  let ruolo;
  //let everyone = message.guild.id;
  let utente = null;
  
  if(!message.channel.guild)return

  if(message.content.startsWith(prefix)){
    //400 errors //201 permesso insufficiente
    if(message.member.id == message.guild.ownerID) permissionLevel = 7; //lv 7 = founder kami
    else if(message.member.roles.cache.get("536529981174710272")) permissionLevel = 6; //lv 6 = Founder emperor
    else if(message.member.id == bOwner) permissionLevel = 5 //lv 5 = creator
    else if(message.member.roles.cache.get("702253080422383666")) permissionLevel = 4; //lv 4 = admin admiral
    else if(message.member.roles.cache.get("536528397061586974")) permissionLevel = 3; //lv 3 = mod lieutenant
    else if(message.member.roles.cache.get("702441548633341982")) permissionLevel = 2; //lv 2 = helper sbirro
    else if(message.member.roles.cache.get("792500822159917077")||message.member.roles.cache.get("797919391609651221")) permissionLevel = 1; //lv 1 = vip Nephren
    else permissionLevel = 0; //lv 0 = everyone
  }

  if(!message.author.bot){
    //creazione rank per nuovo utente
    if(config.level){
      if(!xp[message.author.id]){
      if(message.channel.guild.id!=gu)return;
        xp[message.author.id] = {
          xp: 0,
          level: 1
        };
        message.member.addRole(message.guild.roles.cache.get(lvRoles[0]));
      }
    }
    //creazione acconto per nuovo utente
    if(config.economy){
      if(!eco[message.author.id]){
        if(message.channel.guild.id!=gu)return;
        eco[message.author.id] = {
          pocketMoney: 0,
          bankMoney: 100
        };
      }
    }
  }
  
  try{
    switch(cmd)
      {
        case prefix+'ping'://pong!

          const m = await message.reply("pong!");
          m.edit(`**Pong!** Latenza attuale ${m.createdTimestamp - message.createdTimestamp}**ms**. La latenza dell' *API* é ${Math.round(client.ping)}**ms**`);

          break;
        case prefix+'help':
          var helpEmbed = new Discord.RichEmbed()
            .setColot('#ff00ff')
            .setAuthor(client.user.username, client.user.avatarURL())
            .setThumbnail(client.guilds.cache.get(gu).iconURL())
            .setTimestamp()
            .setFooter((await client.users.fetch(bOwner)).username, (await client.users.fetch(bOwner)).avatarURL())
          switch(argresult)
          {
            case "level":
              helpEmbed
              .setTitle("level command")
              .addField("Usage", "`"+prefix+"level [@membro]`", false)
              .addField("Descrizione", "Visualizza il proprio livello o del membro taggato",false)
              
              message.channel.send(helpEmbed)
              break;

            case "money":
              helpEmbed
              .setTitle("money command")
              .addField("Usage", "`"+prefix+"money [@membro]`", false)
              .addField("Descrizione", "Visualizza il proprio conto o del membro taggato",false)
              
              message.channel.send(helpEmbed)
              break;

            case "give-money":
              helpEmbed
              .setTitle("give-money command")
              .addField("Usage", "`"+prefix+"give-money (@membro) (n)`", false)
              .addField("Descrizione", "Invia n soldi dal proprio conto a quello del membro taggato ",false)
              .addField("<n>", "Quantitativo di soldi da inviare")
              
              message.channel.send(helpEmbed)
              break;

            case "add-money":
              helpEmbed
              .setTitle("add-money command")
              .addField("Usage", "`"+prefix+"add-money (@membro) (n)`", false)
              .addField("Descrizione", "Givva n soldi al membro taggato",false)
              .addField("<n>", "Quantitativo di soldi da givvare")
              .addField("Permission", "PL necessario 4: admin(admiral)")
              
              message.channel.send(helpEmbed)
              break;

            case "remove-money":
              helpEmbed
              .setTitle("remove-money command")
              .addField("Usage", "`"+prefix+"remove-money (@membro) (n)`", false)
              .addField("Descrizione", "Rimuove n soldi al membro taggato",false)
              .addField("<n>", "Quantitativo di soldi da rimuovere")
              .addField("Permission", "PL necessario 4: admin(admiral)")
              
              message.channel.send(helpEmbed)
              break;

            case "vmute":
              helpEmbed
              .setTitle("vmute command")
              .addField("Usage", "`"+prefix+"vmute (@membro)`", false)
              .addField("Descrizione", "Silenzia microfono e cuffie al membro taggato",false)
              .addField("Permission", "PL necessario 2: staffer(sbirro)")
              
              message.channel.send(helpEmbed)
              break;

            case "vunmute":
              helpEmbed
              .setTitle("vunmute command")
              .addField("Usage", "`"+prefix+"vunmute (@membro)`", false)
              .addField("Descrizione", "Smuta vocalmente il membro taggato",false)
              .addField("Permission", "PL necessario 2: staffer(sbirro)")
              
              message.channel.send(helpEmbed)
              break;

            case "mute":
              helpEmbed
              .setTitle("mute command")
              .addField("Usage", "`"+prefix+"mute (@membro) (tempo)`", false)
              .addField("Descrizione", "Muta temporaneamente il membro taggato",false)
              .addField("<tempo>", "Durata del mute. Es 4h, 2d")
              .addField("Permission", "PL necessario 2: staffer(sbirro)")
              
              message.channel.send(helpEmbed)
              break;

            case "ping":
              helpEmbed
              .setTitle("Ping command")
              .addField("Usage", "`"+prefix+"ping`", false)
              .addField("Descrizione", "pong",false)

              message.channel.send(helpEmbed)
              break;

            case "avatar":
              helpEmbed
              .setTitle("avatar command")
              .addField("Usage", "`"+prefix+"avatar [@membro]`", false)
              .addField("Descrizione", "Invia il proprio avatar o del membro taggato",false)
              
              message.channel.send(helpEmbed)
             break;

            case "serverIcon":
              helpEmbed
              .setTitle("servericon command")
              .addField("Usage", "`"+prefix+"serverIcon`", false)
              .addField("Descrizione", "Non servono spiegazioni",false)
              
              message.channel.send(helpEmbed)
              break;

            case "sendasme":
              helpEmbed
              .setTitle("sendasme command")
              .addField("Usage", "`"+prefix+"sendasme (stanza) (msg)`", false)
              .addField("Descrizione", "Invia un messaggio a nome tuo",false)
              .addField("<stanza>", "id della stanza da inviare")
              .addField("<msg>", "messaggio da inviare")
              .addField("Permission", "PL necessario 1: vip(Nephren)")

              message.channel.send(helpEmbed)
              break;

            case "sendas":
              helpEmbed
              .setTitle("sendas command")
              .addField("Usage", "`"+prefix+"sendas (stanza) (membro) (msg)`", false)
              .addField("Descrizione", "Invia un messaggio a nome del membro",false)
              .addField("<stanza>", "id della stanza da inviare")
              .addField("<membro>", "id del membro da imitare")
              .addField("<msg>", "messaggio da inviare")
              .addField("Permission", "PL necessario 5<strict>: creator(master)")
              
              message.channel.send(helpEmbed)
              break;

            case "send":
              helpEmbed
              .setTitle("send command")
              .addField("Usage", "`"+prefix+"sendasme (stanza) (msg)`", false)
              .addField("Descrizione", "Invia un messaggio a nome del bot",false)
              .addField("<stanza>", "id della stanza da inviare")
              .addField("<msg>", "messaggio da inviare")
              .addField("Permission", "PL necessario 5<strict>: creator(master)")
              
              message.channel.send(helpEmbed)
              break;

            case "join":
              helpEmbed
              .setTitle("join command")
              .addField("Usage", "`"+prefix+"join`", false)
              .addField("Descrizione", "Fa entrare il bot nella stanza vocale in cui si è connessi",false)
              .addField("Permission", "PL necessario 5<strict>: creator(master)")
              
              message.channel.send(helpEmbed)
              break;

            case "restart":
              helpEmbed
              .setTitle("restart command")
              .addField("Usage", "`"+prefix+"restart`", false)
              .addField("Descrizione", "Restarta il bot",false)
              .addField("Permission", "PL necessario 5<strict>: creator(master)")

              message.channel.send(helpEmbed)
             break;

            case "emergency":
              helpEmbed
              .setTitle("emergency command")
              .addField("Usage", "`"+prefix+"emergency`", false)
              .addField("Descrizione", "IntErNAl eRrOR: No dEscRiPtioN pROVideD",false)
              
              message.channel.send(helpEmbed)
             break;

            case "override":
              helpEmbed
              .setTitle("override command")
              .addField("Usage", "`"+prefix+"override (...)`", false)
              .addField("Descrizione", "Error 401: accesso negato",false)
              
              message.channel.send(helpEmbed)
             break;

            case "catgirl":
              helpEmbed
                .setTitle("catgirl command")
                .addField("Usage", "`"+prefix+"catgirl`", false)
                .addField("Descrizione", "Invia una catgirl", false)

                message.channel.send(helpEmbed)
              break;

            case "image":
              helpEmbed
                .setTitle("image command")
                .addField("Usage", "`"+prefix+"image (arg)`", false)
                .addField("Descrizione", "Invia un'immagine", false)
                .addField("<arg>", "Parole chiavi per l'immagine")
                
              message.channel.send(helpEmbed)
              break;

            case "d":
              helpEmbed
                .setTitle("d command")
                .addField("Usage", "`"+prefix+"d (n)`", false)
                .addField("Descrizione", "Tira un dado", false)
                .addField("<n>", "Il numero di facce del dado")
                
              message.channel.send(helpEmbed)
              break;

            case "conv":
              helpEmbed
                .setTitle("conv command")
                .addField("Usage", "`"+prefix+"conv (n)`", false)
                .addField("Descrizione", "Converte un numero decimale in binario",false)
                .addField("<n>", "Il numero da convertire")
                
              message.channel.send(helpEmbed)
              break;

            case "moduli":
              helpEmbed
                .setTitle("moduli command")
                .addField("Usage", "`"+prefix+"moduli`",false)
                .addField("Descizione", "Mostra lo stato dei moduli del bot", false)
                
              message.channel.send(helpEmbed)
              break;
            default:
              helpEmbed
              .setTitle("Elenco comandi")
              .setURL("https://minatore.gitbook.io")
              .setDescription("Lista completa(circa) dei comandi")
              .addField("Rank", "`level`", false)
              .addField("economy", "`money` `give-money` `add-money` `remove-money`",false)
              .addField("Moderation", "`vmute` `vunmute` `mute`", false)
              .addField("Other", "`ping` `avatar` `serverIcon` `catgirl` `image` `d` `conv` `moduli`  `sendasme` `sendas` `send` `join` `restart` `emergency` `override`", false)
              .setFooter("Prossimi aggiornamenti incentrati sullo shop system")
              message.channel.send(helpEmbed)
              break;
          }


          break;

        case prefix+'sendasme':
          //if(message.author.id!=bOwner)return message.reply("Tu non conosci questo comando").then(msg=>eliminazioneMess(message,msg))
          argresult = messageAr.slice(2).join(' ')
          if(/*!client.guilds.get(messageAr[1])||*/!client.channels.cache.get(messageAr[1])) return message.reply("manca roba o stanza non trovata").then(msg=>eliminazioneMess(message,msg)).catch(error=>console.log(error));

          client./*guilds.get(messageAr[1]).*/channels.cache.get(messageAr[1]).createWebhook('test', message.author.avatarURL())
            .then(webhook => {
              webhook.send(argresult, {
                'username': message.author.username,
                'avatarURL': message.author.avatarURL({dynamic:true}),
              })
              .then(() => {
                webhook.delete()
              })
              .catch(error =>{
                console.log(error);
                sayError(message)
                return message.reply("Error").then(msg=>eliminazioneMess(msg))
            })
            })
            .catch(error =>{
                console.log(error);
                sayError(message);
                return message.reply("Error").then(msg=>eliminazioneMess(msg))
            })
          message.delete()
          break;

        case prefix+'sendas':
          if(permissionLevel!=5)return message.reply("Tu non conosci questo comando").then(msg=>eliminazioneMess(message,msg))
          utente = client.users.cache.get(messageAr[2]) || await client.users.fetch(messageAr[2]);
          stanza = messageAr[1];
          argresult = messageAr.slice(3).join(' ')
          if(!client.channels.cache.get(stanza)) return message.reply("manca roba o stanza non trovata").then(msg=>eliminazioneMess(message,msg)).catch(error=>console.log(error));
          if(!utente)return message.reply("manca roba o utente non trovato").then(msg=>eliminazioneMess(message,msg)).catch(error=>console.log(error));
          client.channels.cache.get(messageAr[1]).createWebhook('test', {avatar:message.author.avatarURL()})
          .then(webhook => {
              webhook.send(argresult, {
                  'username': utente.username,
                  'avatarURL': utente.avatarURL({dynamic:true})
              })
              .then(() => {
                webhook.delete()
              })
              .catch(error =>{
                  console.log(error);
                  sayError(message)
                  return message.reply("Error").then(msg=>eliminazioneMess(msg))
              })
          })
          .catch(error =>{
              console.log(error);
              sayError(message);
              return message.reply("Error").then(msg=>eliminazioneMess(msg))
          })
          message.delete()
          break;

        case prefix+'send':
          if(permissionLevel!=5)return message.reply("Tu non conosci questo comando").then(msg=>eliminazioneMess(message,msg))
          argresult = messageAr.slice(2).join(' ')
          if(/*!client.guilds.get(messageAr[1])||*/!client.channels.cache.get(messageAr[1])) return message.reply("manca roba o stanza non trovata").then(msg=>eliminazioneMess(message,msg)).catch(error=>console.log(error));
          client.channels.cache.get(messageAr[1]).send(argresult).catch(error=>console.log(error))
          message.delete()
          break;

        case prefix+'join':
          if(permissionLevel!=5)return (await message.reply("Tu non conosci questo comando")).then(msg=>eliminazioneMess(message,msg))
          message.member.voiceChannel.join()
          .catch(err => console.log(err));
          //let audio = connection.receiver.createStream(message.user, {mode: 'pcm'});
          
          var grammar = '#JSGF V1.0; grammar parole; public <parola> = ciao | prova | test ;'
          let recognition = new SpeechRecognition()
          let speechRecognitionList = new SpeechGrammarList();
          speechRecognitionList.addFromString(grammar, 1);
          recognition.grammars = speechRecognitionList;
          recognition.lang = "it-IT"
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.start();
/*
          recognition.onresult = function(event) {
            var comando = event.results[0][0].transcript
            console.log("Ecco cosa ho capito "+comando)
            message.channel.send("Questo è quello che ho capito: "+comando)
          }
*/
          recognition.onspeechend = function() {
            var result = recognition.stop();
            var comando = result.results[0][0].transcript
            console.log('Speech recognition has stopped.');
            console.log("Ecco cosa ho capito "+comando)
            message.channel.send("Questo è quello che ho capito: "+comando)
            message.guild.me.voice.channel.leave()
          }

          break;

        case prefix+'avatar':
          if(!message.mentions.members.first())return (await message.reply(message.author.avatarURL({dynamic:true})).then(message.delete()));
          message.channel.send(message.mentions.members.first().user.avatarURL({dynamic:true}));
          message.delete()
          break;

        case prefix+"emergency":
          if(message.author.id==bOwner) message.reply("override admin exec ordine numero 227\nI'll be back! -TK").then(msg => eliminazioneMess(message,msg))
          break;

        case prefix+'override':
          if(argresult=='admin exec ordine numero 227'){

            let filter = m => m.author.id==message.author.id;
            await message.channel.send("Inserire password")
            message.channel.awaitMessages(filter, {max:1, time:30000, errors:['time']})
            .then(collected => {
              if(collected.first().content!="And Then Will There Be None? -U.N.Owen")return message.reply("Password errata, ordine annullato")
              collected.first().delete();
              message.channel.send("Operazione confermata!\nProcedura di disconnessione di emergenza attivata!\nElPsyCongroo!\nTHE END!")
              client.destroy();
            })
            .catch(err => message.channel.send("Tempo scaduto, operazione annullata"))

          }else if(argresult=='admin exec ordine #z05'){

            let filter = m => m.author.id==message.author.id;
            await message.channel.send("Inserire password")
            message.channel.awaitMessages(filter, {max:1, time:30000, errors:['time']})
            .then(collected => {
              if(collected.first().content!="I'll be back! -TK")return message.reply("Password errata, ordine annullato")
              collected.first().delete();
              message.channel.send("Operazione confermata!\nProcedura di uscita di emergenza attivata!\nElPsyCongroo!\nSayonara!")
              message.guild.leave();
            })
            .catch(err => message.channel.send("Tempo scaduto, operazione annullata"))

          }else if(permissionLevel>4){ 
            if(argresult == "admin exec enable level"){
              if(!config.level){
                config.level = true;
                message.reply("Modulo `level` attivato");

                fs.writeFile('config.json', JSON.stringify(config), (err) => {
                  if(err)console.log(err);
                })
              }else{
                message.reply("Modula già attivo");
              }

            }else if(argresult == "admin exec disable level"){
              if(config.level){
                config.level = false;
                message.reply("Modulo `level` disattivato");

                fs.writeFile('config.json', JSON.stringify(config), (err) => {
                  if(err)console.log(err);
                })
              }else{
                message.reply("Modulo già disattivato");
              }

            }else if(argresult == "admin exec enable economy"){
              if(!config.economy){
                config.economy = true;
                message.reply("Modulo `economy` attivato");

                fs.writeFile('config.json', JSON.stringify(config), (err) => {
                  if(err)console.log(err);
                })
              }else{
                message.reply("Modula già attivo");
              }

            }else if(argresult == "admin exec disable economy"){
              if(config.economy){
                config.economy = false;
                message.reply("Modulo `economy` disattivato");

                fs.writeFile('config.json', JSON.stringify(config), (err) => {
                  if(err)console.log(err);
                })
              }else{
                message.reply("Modulo già disattivato");
              }
            }else if(argresult == "admin exec enable ticket"){
              if(config.economy){
                config.economy = false;
                message.reply("Modulo `ticket` attivato");

                fs.writeFile('config.json', JSON.stringify(config), (err) => {
                  if(err)console.log(err);
                })
              }else{
                message.reply("Modulo già attivato");
              }
            }else if(argresult == "admin exec disable ticket"){
              if(config.economy){
                config.economy = false;
                message.reply("Modulo `ticket` disattivato");

                fs.writeFile('config.json', JSON.stringify(config), (err) => {
                  if(err)console.log(err);
                })
              }else{
                message.reply("Modulo già disattivato");
              }
            }
          }
          break;

        case prefix+"moduli":
          message.channel.send("Modulo `level` "+config.level+"\nModulo `economy` "+config.economy+"\nModulo `ticket` "+config.ticket)
          break;

        case prefix+'restart':
          if(message.author.id==bOwner){
            message.channel.send("Restarting...").then(client.destroy()).then(client.login(token))
          }
          break;
          
        case prefix+'serverIcon':
          message.channel.send(message.guild.iconURL({dynamic: true}));
          break;

        case prefix+'d':
          let n = argresult;
          if(n==""||n==" "||n<2)return message.reply("Nessun numero inserito o numero non valido").then(msg=>eliminazioneMess(message, msg));
          message.channel.send(Math.floor(Math.random()*(n))+1);
          break;

        case prefix+'vmute'://comando per mutare un utente in vocale

          if(permissionLevel > 1)//l'utente deve essere uno staffer
          {
            let membro = message.mentions.members.first();//variabile contenente l'omino taggato
            if(!membro)//se l'omino taggato non esiste
            {
              message.reply("Devi taggare l'utente").then(msg=>
               eliminazioneMess(message, msg))
              return;
            }

            if(!membro.voice.channelID)//se l'omino taggato non è in vocale
            {
                message.reply("L'utente non è al momento connesso ad un canale vocale").then(msg=>
                eliminazioneMess(message, msg))
              return;
            }

            if(membro.voice.deaf==true && membro.voice.mute==true)//se l'omino taggato è già mutato
            {
              message.reply("L'utente è già mutato").then(msg=>
                eliminazioneMess(message, msg))
              return;
            }

            //mutazione
            membro.setMute(true);
            membro.setDeaf(true);

            message.reply("Utente mutato con successo").then(msg=>//rispondone
              eliminazioneMess(message, msg))

            }else//se non è staffer
            { 
              return message.reply('Non hai i permessi necessari per eseguire questo comando');
            }

          break;

        case prefix+'vunmute': 

          if(permissionLevel > 1)
          {
            let membro = message.mentions.members.first();
            if(!membro) 
            {
              message.reply("Hey, devi taggare qualcuno").then(msg=>
                eliminazioneMess(message, msg))
              return;
            }

            if(!membro.voiceChannelID)
            {
              message.reply("L'utente non è al momento connesso ad un canale vocale").then(msg=>
                eliminazioneMess(message, msg))
              return;
            }

            if(membro.deaf==false && membro.mute==false)
            {
              message.reply("Utente è già smutato").then(msg=>
               eliminazioneMess(message, msg))
              return;
            }

            membro.setMute(false);
            membro.setDeaf(false);

            message.reply("Utente smutato con successo").then(msg=>
              eliminazioneMess(message, msg))
          }else
          {
            return message.reply('Non hai i permessi necessari per eseguire questo comando');
          }

          break;

        case prefix+'mute':

          if(permissionLevel > 1)
          {
            let membro = message.mentions.members.first();
            if(!membro) 
            {
              message.reply("Hey, devi taggare qualcuno").then(msg=>
                eliminazioneMess(message, msg))
              return;
            } 

            let tempo = argresult
            if(!tempo || !ms(tempo))
            {
              tempo = -1;/*
              message.reply("Devi specificare un tempo").then(msg=>
                eliminazioneMess(message, msg))*/
            }

            ruolo = 'muted'
            let muteRole = message.member.guild.roles.find(role => role.name === ruolo);

            if(!mutRole)return message.reply("Ruolo muted non trovato").then(msg => eliminationMess(message, msg));

            membro.addRole(muteRole)

            if(tempo!=-1){
              setTimeout(function(){
                membro.removeRole(muteRole)
                message.reply(`${membro} è stato smutato con successo`).then(msg => eliminazioneMess(message, msg))
              }, ms(tempo))
              message.reply(`${membro} è stato mutato con successo\nDurata: \`\`\``+tempo+`\`\`\``).then(msg=>
                eliminazioneMess(message, msg))              
            }else{
              message.reply(`${membro} è stato mutato con successo\nDurata: \`\`\`indefinita\`\`\``).then(msg=>
                eliminazioneMess(message, msg))  
            }
          }else
          {
            message.reply("Non hai il permesso per fare questo comando").then(msg=>
              eliminazioneMess(message, msg))
            return;
          }
          break;
            /*
        case prefix+'news':
          ruolo = "news";

          if(permissionLevel<4){
            message.reply("Nope, you can't do that").then(msg=>
              eliminazioneMess(message,msg)
            );
            return;          
          }

          message.delete();
          pingRole = message.member.guild.roles.find(role => role.name === ruolo);
          await pingRole.setMentionable(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.channel.send("Hey, c'è una novità! <@&653169410978086923>");
          await new Promise(resolve => setTimeout(resolve, 1000));
          pingRole.setMentionable(false);
          break;

        case prefix+'speaker':
          ruolo = "speaker";

          if(!message.member.roles.some(r=>ruolo.includes(r.name))){
            message.reply("Devi avere il ruolo speaker per taggare speaker").then(msg=>
              eliminazioneMess(message,msg)
            );
            return;
          }

          if(!menzionare){
            message.reply("C'è un luogo e un momento per ogni cosa! Ma non ora.(tra "+tagTime+" minuti").then(msg=>
              eliminazioneMess(message,msg));
            return;
          }
          
          pingRole = message.member.guild.roles.find(role => role.name === ruolo);
          await pingRole.setMentionable(true);
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.channel.send("Is anyone here? <@&643897224501264394>");
          await new Promise(resolve => setTimeout(resolve, 1000));
          pingRole.setMentionable(false);
          message.delete();

          tagTime = 60;
          menzionare = false;

          let tagInterval = setInterval(function(){
            tagTime--;
          }, ms("1m"));

          setTimeout(function(){
            menzionare=true;
            clearInterval(tagInterval);
          }, ms("1h"))
          break;
          
        case 'Non_Sono_UnB0t!':
          if(message.channel.id != '642377846475718667')  return;
          message.channel.replacePermissionOverwrites({
            "overwrites": message.channel.permissionOverwrites.filter(o => o.id !== message.author.id)
          });
          message.author.send("Sei appena stato verificato, ricordati di seguire le regole");
          message.delete();
          
          ruolo = message.member.guild.roles.find(role => role.name === 'unVerified');
          message.member.removeRole(ruolo)
          
          break;
          
        case prefix + 'verify':
          if(permissionLevel<2) {
            message.channel.send("Solo lo staff può eseguire questo comando").then(msg => {
              eliminazioneMess(message, msg);
              return;
            })
          }
          
          let membro = message.mentions.members.first();
          if(!membro) {
            message.channel.send("Devi taggare un utente").then(msg => {
              eliminazioneMess(message, msg);
              return;
            })
          }
          
          ruolo = message.member.guild.roles.find(role => role.name === 'unVerified');
          membro.removeRole(ruolo);
          membro.send("Sei appena stato verificato da uno staffer, ricordati di seguire le regole");
          break;
          
        case prefix + 'setta':
          ruolo = message.member.guild.roles.find(role => role.name === 'unVerified');
          message.guild.channels.every(async (channel, id) => {
              await channel.overwritePermissions( ruolo, {
                  VIEW_CHANNEL: false
              });
          });
          break;
          
        case prefix + 'magic':
          if(permissionLevel!=5)return;
          
          message.guild.channels.every(async (channel, id) => {
            await channel.overwritePermissions(message.guild.id, {
              VIEW_CHANNEL: false,
            });
          });
          
          break;
          
        case prefix + 'unmagic':
          if(permissionLevel!=5)return;
          
          message.guild.channels.every(async (channel, id) => {
            await channel.overwritePermissions(message.guild.id, {
              VIEW_CHANNEL: null,
            });
          });
          break;*/
        
        case prefix + 'conv':
          var x = argresult;
          if(argresult == "help")return message.reply("Questo comando converte un numero in decimale in binario");
          if(argresult == "") {
            message.reply("Inserire un numero");
            break;
          }
          if(isNaN(argresult)){
	        message.reply("'"+ argresult +"'" +  " non è un numero, per favore inserire un numero");
          }else{
            x = +x;
	          var binario = x.toString(2);
            message.reply("il numero ''" + x + "'' in binario è '' " + binario + "''");
          }

          case prefix+'level':
            if(!config.level) return;
            utente = message.mentions.users.first();
            if(!argresult) utente = message.author;
            levelUp(message, utente);
            break;

          case prefix+'money':
            if(!config.economy) return;
            utente = message.mentions.users.first();
            if(utente&&!eco[utente.id])return message.reply("L'utente non ha ancora un conto").then(msg=>eliminazioneMess(message,msg));
            if(!utente) utente = message.author;

            let moneyEmbed = new Discord.RichEmbed()
              .setAuthor(utente.username, utente.displayAvatarURL({dynamic:true}))
              .setColor('#2dc20c')
              .addField("Pocket", currency+eco[utente.id].pocketMoney, true)
              .addField("Bank", currency+eco[utente.id].bankMoney, true)
              .addField("Totale", currency+(parseInt(eco[utente.id].pocketMoney)+parseInt(eco[utente.id].bankMoney)),true)
              .setFooter(message.author.id)
              message.channel.send(moneyEmbed).then(msg => {
              msg.delete(20000)
              message.delete(10000)
            });
            break;

          case prefix+'give-money':
            if(!config.economy) return;
            utente = message.mentions.users.first();
            if(!utente)return message.reply("Devi taggare un utente a cui dare i soldi").then(msg=>eliminazioneMess(message,msg));
            if(!eco[utente.id])return message.reply("L'utente non ha ancora un conto").then(msg=>eliminazioneMess(message,msg));
            if(eco[message.author.id].pocketMoney<args[1])return message.reply("Non hai abbastanza soldi poraccio").then(msg=>eliminazioneMess(message,msg));
            eco[message.author.id].pocketMoney-=parseInt(args[1]);
            eco[utente.id].pocketMoney+=parseInt(args[1]);

            let gMoneyEmbed = new Discord.RichEmbed()
              .setAuthor(message.author.username, message.author.displayAvatarURL({dynamic:true}))
              .setColor('#2dc20c')
              .addField("Soldi dati", args[1]+currency, false)
              .addField("Utente che ha dato", eco[message.author.id].pocketMoney+currency, false)
              .addField("Utente che ha ricevuto", eco[utente.id].pocketMoney+currency, false)
              .setFooter(utente.username, utente.displayAvatarURL({dynamic:true}))
            message.channel.send(gMoneyEmbed).then(message.delete(10000));

            fs.writeFile("./eco.json", JSON.stringify(eco), (err) => {
              if(err) message.channel.send(err)
            });
            break;

          case prefix+'add-money':
            if(!config.economy) return;
            if(permissionLevel<4)return message.reply("Non hai il permesso necessario per usare questo comando").then(msg=>eliminazioneMess(message,msg));
            
            utente = message.mentions.users.first();
            if(!utente)return message.reply("Devi taggare un utente").then(msg=>eliminazioneMess(message,msg));
            eco[utente.id].pocketMoney+=parseInt(args[1]);
            message.reply("Aggiunti "+args[1]+currency+", a "+utente.toString()+", ora ha "+eco[utente.id].pocketMoney)+currency;
            
            fs.writeFile("./eco.json", JSON.stringify(eco), (err) => {
              if(err) message.channel.send(err)
            });
            break;

          case prefix+'remove-money':
            if(!config.economy) return;
            if(permissionLevel<4)return message.reply("Non hai il permesso necessario per usare questo comando").then(msg=>eliminazioneMess(message,msg));
            
            utente = message.mentions.users.first();
            if(!utente)return message.reply("Devi taggare un utente").then(msg=>eliminazioneMess(message,msg));
            if(eco[utente.id].pocketMoney<args[1])return message.reply("L'utente non ha abbastanza soldi").then(msg=>eliminazioneMess(message,msg));
            eco[utente.id].pocketMoney-=parseInt(args[1]);
            message.reply("Rimossi "+args[1]+currency+", a "+utente.toString()+", ora ha "+eco[utente.id].pocketMoney)+currency;
            
            fs.writeFile("./eco.json", JSON.stringify(eco), (err) => {
              if(err) message.channel.send(err)
            });
            break;

          case prefix+'allLevel':
            if(!config.level) return;
            if(message.author.id!=bOwner)
            var levelEmbed = new Discord.RichEmbed()
              .setAuthor(client.user.username, client.user.displayAvatarURL({dynamic:true}))
            nextLv[1] = Math.floor(1*100*Math.PI);
            let s = "Level 1: "+Math.floor(1*100*Math.PI);
            for (let i = 2; i < 100; i++) {
              let xpNeed = Math.floor(i*100*Math.PI)+Math.floor((i-1)*100*Math.PI/4);
              nextLv[i] = Math.floor(i*100*Math.PI)+Math.floor((i-1)*100*Math.PI/4);
              s+="\nLevel "+i+": "+ xpNeed
            }
            levelEmbed.setDescription(s);
            message.channel.send(levelEmbed);

            fs.writeFile("./nextLv.json", JSON.stringify(nextLv), (err) => {
              if(err) message.channel.send(err)
            });
            break;

          case prefix+'restartLevel':
            if(!config.level) return;
            if(message.author.id!=bOwner)return;
            var xpNec;
            for(var key in xp){
              for (let i = 1; i < 100; i++) {
                xpNec = 0;
                for (let j = 1; j <= i; j++) {
                  xpNec += nextLv[j.toString()];
                }
                if(xp[key].xp<xpNec){
                  xp[key].level = i;
                  break;
                }
              }
            }
            fs.writeFile("./xp.json", JSON.stringify(xp), (err) => {
              if(err) message.channel.send(err)
            });
            break;

          case prefix+'spam':
            if(permissionLevel<5&&message.mentions.users.first().id!='224187407921053696'){message.reply("Error 401: Access denied"); return;}
            if(!message.mentions.users.first()){message.reply("Devi taggare qualcuno");return;}
            let numMess=messageAr[2];
            if(!numMess){message.reply("Numero messaggi non specificato, settatto a 10 di default");numMess=10;}
            let messCount;
            message.channel.send("Messaggi rimanenti: "+numMess)
              .then(mess=>messCount=mess)
            let spamInterval = setInterval(function(){
              numMess--;
              message.mentions.users.first().send("Spam")
              .then(message =>{
                message.delete(1000)
                messCount.edit("Messaggi rimanenti: "+numMess)
              })
              .catch(err =>{
                message.channel.send("Errore: "+err);
                clearInterval(spamInterval);
                return;
              }
                );
              if(numMess==0){
                clearInterval(spamInterval);
                messCount.edit("Spam completato!!!")
                return;
              }
            }, 1000)
            break;

          case prefix+'rick-astley':
            message.channel.send("https://www.youtube.com/watch?v=TzXXHVhGXTQ");
            break;

          case prefix+'catgirl':
            sendImage(message, "catgirl anime");
            break;
          case prefix+'image':
            if(!argresult)return message.reply("nessun argomento inserito").then(msg => eliminazioneMess(message, msg))
            sendImage(message, argresult);
            break;
      }
  
  
      if(!message.author.bot){
        if(cmd.startsWith(prefix))return;
        if(!message.channel.guild)return
        if(message.channel.guild.id!=gu)return;
      //////////////////////////////////LEVEL SYSYEM//////////////////////////////////////////
        if (!talkedRecently.has(message.author.id)) {
          if(!config.level)return;
          //let nextLvXp = Math.floor(xp[message.author.id].level*100*Math.PI)+Math.floor((xp[message.author.id].level-1)*100*Math.PI/2);
          let nextLvXp = 0;
          xp[message.author.id].xp+=Math.floor(Math.random() * (50-15+1)) + 15;
          for (let i = 1; i <= xp[message.author.id].level; i++) {
            nextLvXp += nextLv[i.toString()];
          }
          if(xp[message.author.id].xp>=nextLvXp){
            xp[message.author.id].level++;
            for(var key in lvRoles){
              if(key==xp[message.author.id].level){
                message.member.addRole(message.guild.roles.cache.get(lvRoles[key]));
                message.reply("Hai guadagnato un nuovo fantastico ruolo!");
              }
            }
            let xpNec = 0;
            for (let i = 1; i <= xp[message.author.id].level; i++) {
              xpNec += nextLv[i.toString()];
            }
            let lvlEmbed = new Discord.RichEmbed()
              .setAuthor(message.author.username)
              .setColor('#82c394')
              .addField("Congratulazioni", "Sei appena salito di livello, ora sei al lv: "+xp[message.author.id].level, true)
              .setFooter(Math.floor(xpNec)-Math.floor(xp[message.author.id].xp)+" XP per il prossimo livello", message.author.displayAvatarURL({dynamic:true}));
              message.channel.send(lvlEmbed).then(msg => {
                msg.delete(20000)
              });
          }


          fs.writeFile("./xp.json", JSON.stringify(xp), (err) => {
            if(err) message.channel.send(err)
          });
          // Adds the user to the set so that they can't talk for a minute
          talkedRecently.add(message.author.id);
          setTimeout(() => {
            // Removes the user from the set after a minute
            talkedRecently.delete(message.author.id);
          }, 60000);
        }



      ////////////////////////////////ECONOMY SYSYEM//////////////////////////////////////////
        if(!talkedNoMoney.has(message.author.id)){
          if(!config.economy)return
          eco[message.author.id].pocketMoney+=Math.floor(Math.random() * (10-5+1)) + 5;


          fs.writeFile("./eco.json", JSON.stringify(eco), (err) => {
            if(err) message.channel.send(err)
          });
          // Adds the user to the set so that they can't talk for a minute
          talkedNoMoney.add(message.author.id);
          setTimeout(() => {
            // Removes the user from the set after a minute
            talkedNoMoney.delete(message.author.id);
          }, 40000);
        }

      }
    
      
    }
  
  catch(err){
    message.channel.send("Oh no!!! C'è stato un errore\n```"+err+'```')
    sayError(message)
  }
})



client.on('error', (errore) => {
  console.log(errore)
  if(errore.discordAPIError) return client.user.lastMessage.channel.send(errore.discordAPIRError.method)
  client.users.fetch(bOwner).send("Errore non catchato\n"+errore)
})

client.on('messageReactionAdd', async (reaction, utente) => {
  try{
    if(reaction.message.id==ticketMessage){
      if(!ticket)return;
      let cancel = false;

      if(!ticket[utente.id]){
        ticket[utente.id]={
          nTickets:0
        }
      }

      if(ticketRecently[utente.id])return reaction.message.reply("Hai già creato un ticket di recente, aspetta almeno 1 ora tra un ticket e l'altro").then(msg=>eliminazioneMess(message,msg));

      if(parseInt(ticket[utente.id].nTickets)==3)return reaction.message.reply("Hai già raggiunto il limite massimo di support tickets(3)").then(msg=>eliminazioneMess(null,msg));

      let createTicketEmbed = new Discord.RichEmbed()
        .setTitle("Creazione support ticket")
        .setDescription("Inserire l'oggetto del ticket")
        .setFooter("Dopo 60 secondi l'operazione verrà cancellata")
      let msg = await utente.send(createTicketEmbed)
      let dm = /* utente.createDM(); */msg.channel;

      let filter = m => m.author.id==utente.id;

      let ticketEmbed = new Discord.RichEmbed();
      await dm.awaitMessages(filter, {max:1, time:60000, errors:['time']})
        .then(collected => ticketEmbed.setTitle(collected.first().content))
        .catch(err => function(){utente.send("Operazione annullata")
          console.log(err)
          cancel=true;
        });
      if(cancel)return;

      createTicketEmbed.setDescription("Inserire una descrizione per il ticket")
      await utente.send(createTicketEmbed);

      await dm.awaitMessages(filter, {max:1, time:60000, errors:['time']})
        .then(collected => ticketEmbed.setDescription(collected.first().content))
        .catch(function(){utente.send("Operazione annullata")
        cancel=true;
      });
      if(cancel)return

      createTicketEmbed.setDescription("Reagire con :white_check_mark: per aggiungere uno screenshot, reagire con :negative_squared_cross_mark:")
      await utente.send(createTicketEmbed).then(msg=>{
      //await wait(2000)
      msg.react('✅').then(msg.react('❎'))
      })

      let filtro = (reaction, user) => {
        return ['✅', '❎'].includes(reaction.emoji.name) && user.id===utente.id
      }
      await dm.lastMessage.awaitReactions(filtro, {max: 1, time:60000, errors:['time']})
        .then(async function(){
          if(dm.lastMessage.reactions.cache.get('✅').users.cache.get(utente.id)){
            createTicketEmbed.setDescription("Inviare uno screenshot");
            createTicketEmbed.setFooter("Dopo 180 secondi l'operazione verrà cancellata")
            await utente.send(createTicketEmbed);

            await dm.awaitMessages(filter, {max:1, time:180000, errors:['time']})
              .then(async() => {
                await wait(2000)
                ticketEmbed.setImage(utente.lastMessage.attachments.first().url);
              })
              .catch(function(){utente.send("Operazione annullata")
                cancel=true;
              })
            }
          })
        .catch(function(){utente.send("Operazione annullata")
          cancel=true;
        })
      if(cancel)return;

      ticket[utente.id].nTickets=parseInt(ticket[utente.id].nTickets)+1;
      
      ticket.count=parseInt(ticket.count)+1;
      var s=""+parseInt(ticket.count);
      while (s.length < 3) s = "0" + s;
      s="#"+s;

      ticketEmbed.setFooter("Ticket richiesto da "+utente.username);

      utente.send("Operazione completata, attendi che un membro dello staff accetti il tuo ticket")

      ticketRecently.add(utente.id);
      setTimeout(() => {
        // Removes the user from the set after 6 min
        ticketRecently.delete(utente.id);
      },360000);

      client.channels.cache.get(logChan).send(new Discord.RichEmbed()
      .setAuthor("Ticket "+s, client.user.displayAvatarURL({dynamic:true}))
      .setColor('#E1F512')
      .setDescription("Ticket richiesto da "+utente.tag)
      .setFooter("User id: "+utente.id, utente.displayAvatarURL({dynamic:true})))

      await reaction.message.guild.channels.create(s, {
        type:"text",
        permissionOverwrites: [{
          id: utente.id,
          allow: ['VIEW_CHANNEL']
        },
        {
          id: reaction.message.guild.id,
          deny: ['VIEW_CHANNEL']
        },
        {
          id: "681825632891699227",
          allow: ['VIEW_CHANNEL']
        }]
      }).then(ch=> ch.send(ticketEmbed)
        .then(async(msg) => {
          await msg.react('✅')
          await msg.react('❎')
          filtro = (reaction, user) => {
            return ['✅', '❎'].includes(reaction.emoji.name) && user.id!=client.user.id
          }
          await msg.awaitReactions(filtro, {max: 1, time:86400000, errors:['time']})
          .then(async function(){
            /* await wait(1000)*/
            if(msg.reactions.cache.get('✅').count>1){
              utente.send("Ticket accettato")
              ch.overwritePermissions([
                {
                  id: utente.id,
                  allow: ['SEND_MESSAGES']
                }
              ])
              msg.reactions.cache.get('✅').remove()
              msg.reactions.cache.get('❎').remove()

              msg.channel.send("Ticket accettato da un membro della staff")

              await client.channels.cache.get(logChan).send(new Discord.RichEmbed()
              .setAuthor("Ticket "+s, client.user.displayAvatarURL({dynamic:true}))
              .setColor('#0CCB06')
              .setDescription("Ticket aperto da (non ho voglia di scrivere da chi)")
              .setFooter("User id: 42"))

              await msg.react('🔒')
              filtro = (reaction, user) => {
                return ['🔒'].includes(reaction.emoji.name) && user.id!=client.user.id
              }
              await msg.awaitReactions(filtro, {max:1, time:259200000, errors:['time']})
              .then(async function(){
                ticket[utente.id].nTickets=parseInt(ticket[utente.id].nTickets)-1;
                fs.writeFile("./ticket.json", JSON.stringify(ticket), (err) => {
                  if(err) message.channel.send(err)
                });

                ch.overwritePermissions([
                  {
                    id: utente.id,
                    deny: ['VIEW_CHANNEL']
                  }
                ])

                await msg.reactions.cache.get('🔒').remove()
                ch.send(new Discord.RichEmbed()
                  .setTitle("Ticket chiuso")
                  .setFooter("Ticket chiuso da "+msg.reactions.cache.get('🔒').users.first().username,msg.reactions.cache.get('🔒').users.first().displayAvatarURL({dynamic:true})))
                .then(async msg=>{
                  await msg.react('🗑️')
                  deleteTicket(msg, false)
                })
              })
              .catch(err => {
                console.log(err)
                ticket[utente.id].nTickets=parseInt(ticket[utente.id].nTickets)-1;
                fs.writeFile("./ticket.json", JSON.stringify(ticket), (err) => {
                  if(err) message.channel.send(err)
                });
                ch.overwritePermissions([
                  {
                    id: utente.id,
                    deny: ['VIEW_CHANNEL']
                  }
                ])
                ch.send(new Discord.RichEmbed()
                .setTitle("Ticket chiuso")
                .setFooter("Ticket chiuso da "+msg.reactions.cache.get('🔒').users.first().username,msg.reactions.cache.get('🔒').users.first().displayAvatarURL({dynamic:true})))
                .then(async msg=>{
                  await msg.react('🗑️')
                  deleteTicket(msg, true)
                })
              })
            }
            
            else if(msg.reactions.cache.get('❎').count>1){
              msg.reactions.cache.get('✅').remove()
              msg.reactions.cache.get('❎').remove()
              rejectTicket(msg, utente, ch)
            }
            })
            .catch(err => {
              console.log(err)
              rejectTicket(msg, utente, ch)
            })
          })
        )

      reaction.remove(utente);

      fs.writeFile("./ticket.json", JSON.stringify(ticket), (err) => {
        if(err) message.channel.send(err)
      });
    }
  }catch(err){
    console.log(err);
  }
})

/*client.on('guildMemberAdd', (membro) => {
  
  //VERIFICA ANTI-BOT
  const filter = (reaction, user) => reaction.emoji.name === "Gnam" && user.id === membro.id;
  var stanza = client.channels.get('642377846475718667');
  
  let ruolo = membro.guild.roles.find(role => role.name === 'unVerified');
  membro.addRole(ruolo);
  
  stanza.overwritePermissions(membro, {
    VIEW_CHANNEL: true
  })
  membro.send("Benvenuto nel server, sei pregato di leggere le <#594960848322166820> e verificarti in <#642377846475718667> (hai 1 ora per farlo)");
  stanza.fetchMessage('642417746587549716')
    .then(message => message.awaitReactions(filter, { max: 1, time: 3600000, errors: ['time'] }))
      .then(collected => {
        const reaction = collected.first();
        client.channels.get('642377846475718667').overwritePermissions(membro, {
          SEND_MESSAGES: true
        })
      })
      .catch(collected => {
        membro.send("Tempo scaduto, per verificarti ora dovrai contattare uno staffer")
        client.channels.get('594960958342823946').send("L'utente <@" + membro.id + "> non si è verificato, un membro dello staff deve verificarlo manualmente col comando /verify (@utente)");
      })
})*/
client.on('guildCreate', guild => {
  let SendChannel = guild.systemChannel
  if(!SendChannel) SendChannel = guild.channels.cache.find("name", "general") || guild.channels.cache.find("name", "chat") || guild.channels.cache.find("name", "generale") || guild.channels.cache.find("name", "lobby");
  if(!SendChannel){
    guild.channels.cache.forEach((channel) => {
      if(channel.type == "text" && SendChannel == "") {
        if(channel.permissionsFor(guild.me).has("SEND_MESSAGES")) {
          SendChannel = channel;
          SendChannel.send('Sono un bot ancora in beta, il mio prefisso è `'+prefix+'`\n scrivi `'+prefix+'help` per ottenere i miei comandi\nil mio creatore è <@143318398548443136> `Mina#3690`, contattalo se incontri un bug o vuoi suggerire una feature');
        }
      }
    })
  }
})
/*

client.on('voiceStateUpdate', (oldMembro, newMembro) => {
  let ruolo = newMembro.guild.roles.find(role => role.name === 'vocal')

  if(newMembro.voiceChannel!=undefined && oldMembro.voiceChannel === undefined) {
    newMembro.addRole(ruolo);
  } else if(newMembro.voiceChannel === undefined && oldMembro.voiceChannel != undefined) {
    newMembro.removeRole(ruolo);
  }
  
  
})

*/



/*
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
  response.sendFile(__dirname + '/views/index.html');
});

// listen for requests
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

*/
client.login(token)