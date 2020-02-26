// server.js
// where your node app starts

// init project
const Discord = require('discord.js');
const ms = require('ms');
const fs = require('fs');
const { Client, Attachment, RichEmbed } = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");
var xp = require("./xp.json");
const bOwner = config.ownerID;
const prefix = config.prefix;
const token = config.token;
var permissionLevel = 0;
var tempoMute = [[]];
var tempoOnMin = 1000;
var staff = [["316988662799925249", 0, 0], ["306101030704119808", 0, 0],["457523600530866187", 0, 0], ["302479840563691521", 0, 0], ["267303785880223744", 0, 0], ["207785335990648832", 0, 0], ["397191718577111050", 0, 0], ["308263263739838464", 0, 0], ["202787285266202624", 0, 0], ["457125304058773506", 0, 0], ["541679053904805900", 0, 0], ["327870532735205387", 0, 0]];
var gu = "353241710794375169" //guild id
var xpTemp = 0;
var entrate1 = 0;
var entrate2 = 0;
var entrate3 = 0;
const namek = "316988662799925249";
const io = "575399619140255779";
var menzionare = true;
var tagTime = 60;
var pingRole;


function eliminazioneMess(message, msg)//funzione per eliminare il messaggio di risposta
{
 setTimeout(function(){
    msg.delete();
    message.delete();
  }, 10000)
  return;
}

function wait(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

function levelUp(message, utente){
  let lvlEmbed = new Discord.RichEmbed()
    .setAuthor(utente.username)
    .setColor('#14c5a2')
    .addField('Level', xp[utente.id].level, true)
    .addField('XP', xp[utente.id].xp, true)
    .setFooter(Math.floor(xp[utente.id].level*100*Math.PI)-xp[utente.id].xp+" XP per il prossimo livello", utente.displayAvatarURL);

  message.channel.send(lvlEmbed).then(msg => {
    msg.delete(10000)
    message.delete(5000)
  });
  
}

client.on('ready', () => {
  console.log('Wow il bot è online')
  /*
  setInterval(() => {
  
  var ch1 = "594960849920327711" //channel1 id
  var ch2 = "596265176827822102" //channel2 id
  var ch3 = "595164592259334154" //channel3 id

          if(!client.guilds.get(gu)) return
          if(!client.channels.get(ch1)) return
          if(!client.channels.get(ch2)) return
          if(!client.channels.get(ch3)) return

          var on = client.guilds.get(gu).members.filter(m => m.presence.status === 'online').size
          var dnd = client.guilds.get(gu).members.filter(m => m.presence.status === 'dnd').size
          var afk = client.guilds.get(gu).members.filter(m => m.presence.status === 'idle').size 
          var online = parseInt(on) + parseInt(dnd) + parseInt(afk)
          var staff = client.guilds.get(gu).roles.get('594960791363518465').members
          var staffOnline = staff.size - staff.filter(m => m.presence.status === 'offline').size
          var utentiVocal = client.guilds.get(gu).roles.get('595345228420874279').members.size-1

          client.channels.get(ch1).setName("👮‍♂️ staff_online_" + staffOnline)
          client.channels.get(ch2).setName("📢Connessi in vocal: " + utentiVocal)
          client.channels.get(ch3).setName("✔ Online: " + online)
    }, 10000); */
})

client.on('message', async (message) =>{
  let messageAr =  message.content.split(" ");
  let cmd = messageAr[0];
  let args = messageAr.slice(1);
  var argresult = args.join(' ');
  let ruolo;
  let everyone = message.guild.defaultRole;
  
  if(message.content.startsWith(prefix)){
    if(message.member.id == message.guild.ownerID || message.member.id == '316988662799925249') permissionLevel = 5; //lv 5 = founder
    else if(message.member.roles.some(r=>"✔️Admin✔️".includes(r.name))) permissionLevel = 4; //lv 4 = admin
    else if(message.member.roles.some(r=>"✔️Moderatori✔️".includes(r.name))) permissionLevel = 3; //lv 3 = mod
    else if(message.member.roles.some(r=>"Staff".includes(r.name))) permissionLevel = 2; //lv 2 = helper
    else if(message.member.roles.some(r=>"💠VIP💠".includes(r.name))) permissionLevel = 1; //lv 1 = vip
    else permissionLevel = 0; //lv 0 = everyone
  }

  if(cmd.split("").slice(0,2).join('')==prefix+'d'){
    var n = cmd.split("").slice(2).join('');
    if(n==""||n==" ")return message.reply("Nessun numero inserito").then(msg=>eliminazioneMess(message, msg));
    message.channel.send(Math.floor(Math.random()*(n))+1);
    return;
  }
  
  try{
    switch(cmd)
      {
        case prefix+'ping'://pong!

          const m = await message.reply("pong!");
          m.edit(`**Pong!** Latenza attuale ${m.createdTimestamp - message.createdTimestamp}**ms**. La latenza dell' *API* é ${Math.round(client.ping)}**ms**`);

          break;
        case prefix+'help':

          message.channel.send('```Comandi \nping: permette di vedere il ping del bot \nvmuta: permette di mutare un utente in vocale (solo staffer) \nvsmuta: serve a smutare un utante mutato precedentemente con vmuta (solo staffer) \nmuta: permette di mutare un utente in vocale e non permette di ricollegarsi ad esse per un determinato periodo di tempo (solo staffer) \nsmuta: permette di smutare un utente mutato precdentemente con muta (solo staffer) \n```')

          break;

        case prefix+'vmuta'://comando per mutare un utente in vocale

          if(permissionLevel > 1)//l'utente deve essere uno staffer
          {
            let membro = message.mentions.members.first();//variabile contenente l'omino taggato
            if(!membro)//se l'omino taggato non esiste
            {
              message.reply("Devi taggare l'utente").then(msg=>
               eliminazioneMess(message, msg))
              return;
            }

            if(!membro.voiceChannelID)//se l'omino taggato non è in vocale
            {
                message.reply("L'utente non è al momento connesso ad un canale vocale").then(msg=>
                eliminazioneMess(message, msg))
              return;
            }

            if(membro.deaf==true && membro.mute==true)//se l'omino taggato è già mutato
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

        case prefix+'vsmuta': 

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
              message.reply("This man isn't in a vocale").then(msg=>
                eliminazioneMess(message, msg))
              return;
            }

            if(membro.deaf==false && membro.mute==false)
            {
              message.reply("Utente già smutato").then(msg=>
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

        case prefix+'muta':

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
            if(!tempo)
            {
              message.reply("Devi specificare un tempo").then(msg=>
                eliminazioneMess(message, msg))
              return;
            }

            ruolo = 'muted'
            let muteRole = message.member.guild.roles.find(role => role.name === ruolo);

            membro.addRole(muteRole)

            setTimeout(function(){
              membro.removeRole(muteRole)
            }, ms(tempo))

          }else
          {
            message.reply("Non hai il permesso per fare questo comando").then(msg=>
              eliminazioneMess(message, msg))
            return;
          }
          break;
            
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
            await channel.overwritePermissions(everyone, {
              VIEW_CHANNEL: false,
            });
          });
          
          break;
          
        case prefix + 'unmagic':
          if(permissionLevel!=5)return;
          
          message.guild.channels.every(async (channel, id) => {
            await channel.overwritePermissions(everyone, {
              VIEW_CHANNEL: null,
            });
          });
          break;
        
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
            let utente = message.mentions.users.first();
            if(!argresult) utente = message.author;
            levelUp(message, utente);
            break;
      }  
  
  
      //////////////////////////////////LEVEL SYSYEM//////////////////////////////////////////
      if(!message.author.bot){
        if(!xp[message.author.id]){
          xp[message.author.id] = {
            xp: 0,
            level: 1
          };
        }
        if (talkedRecently.has(message.author.id)) {
            return;
          } else {
            let nextLvXp = Math.floor(xp[message.author.id].level*100*Math.PI)+Math.floor((xp[message.author.id].level-1)*100*Math.PI)/8;
            
            xp[message.author.id].xp+=Math.floor(Math.random() * (20-5+1)) + 5;
            
            if(xp[message.author.id].xp>=nextLvXp){
              xp[message.author.id].level++;
              
              let lvlEmbed = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor('#82c394')
                .addField("Congratulazioni", "Sei appena salito di livello, ora sei al lv: "+xp[message.author.id].level, true)
                .setFooter(Math.floor(xp[message.author.id].level*100*Math.PI)-xp[message.author.id].xp+" XP per il prossimo livello", message.author.displayAvatarURL);
                message.channel.send(lvlEmbed).then(msg => {
                  msg.delete(10000)
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
        
    
      }
  }
  
  catch(err){
    message.channel.send("Oh no!!! C'è stato un errore\n```"+err+'```')
  }
})



client.on('error', (errore) => {
  console.log(errore)
  if(errore.discordAPIError) return client.user.lastMessage.channel.send(errore.discordAPIRError.method)
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


/*client.on('voiceStateUpdate', (oldMembro, newMembro) => {
  let ruolo = newMembro.guild.roles.find(role => role.name === 'vocal')

  if(newMembro.voiceChannel!=undefined && oldMembro.voiceChannel === undefined) {
    newMembro.addRole(ruolo);
  } else if(newMembro.voiceChannel === undefined && oldMembro.voiceChannel != undefined) {
    newMembro.removeRole(ruolo);
  }
  
  
})*/





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