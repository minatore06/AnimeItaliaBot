// server.js
// where your node app starts

// init project
const Discord = require('discord.js');
const ms = require('ms');
const fs = require('fs');
const opus = require('opusscript');
const { Client, Attachment, RichEmbed } = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");
var xp = require("./xp.json");
var eco = require("./eco.json");
var ticket = require("./ticket.json");

const bOwner = config.ownerID;
const prefix = config.prefix;
const token = config.token;
const talkedRecently = new Set();
const talkedNoMoney = new Set();
const ticketRecently = new Set();
const lvRoles = {0:'682658762393518251', 5:'682658760208023570', 10:'682658757943361561', 20:'682658755824844846', 30:'682658749961601028'}

var permissionLevel = 0;
var tempoMute = [[]];
var tempoOnMin = 1000;
var staff = [["316988662799925249", 0, 0], ["306101030704119808", 0, 0],["457523600530866187", 0, 0], ["302479840563691521", 0, 0], ["267303785880223744", 0, 0], ["207785335990648832", 0, 0], ["397191718577111050", 0, 0], ["308263263739838464", 0, 0], ["202787285266202624", 0, 0], ["457125304058773506", 0, 0], ["541679053904805900", 0, 0], ["327870532735205387", 0, 0]];
var gu = "681624606976901211" //guild id
var currency = '€';
var xpTemp = 0;
var entrate1 = 0;
var entrate2 = 0;
var entrate3 = 0;
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
  let lvlEmbed = new Discord.RichEmbed()
    .setAuthor(utente.username)
    .setColor('#14c5a2')
    .addField('Level', xp[utente.id].level, true)
    .addField('XP', xp[utente.id].xp, true)
    .setFooter(Math.floor(xp[utente.id].level*100*Math.PI)+Math.floor((xp[utente.id].level-1)*100*Math.PI/2)-xp[utente.id].xp+" XP per il prossimo livello", utente.displayAvatarURL);

  message.channel.send(lvlEmbed).then(msg => {
    msg.delete(20000)
    message.delete(5000)
  });
  
}

function sayError(message){
  let voiceChannel = message.member.voiceChannel;
  if(voiceChannel){
      voiceChannel.join().then(connection =>{
          const dispatcher = connection.playFile("./audio/error.mp3");
          dispatcher.on("end", end => {voiceChannel.leave();});
      }).catch(err => console.log(err));
  }
}

function rejectTicket(msg, utente, ch){
  utente.send("Ticket respinto")
  ticket[utente.id].nTickets=parseInt(ticket[utente.id].nTickets)-1;
  ch.overwritePermissions(utente.id,{
      VIEW_CHANNEL:false
  })

  ticket[utente.id].nTickets-=1

  ch.send(new Discord.RichEmbed()
    .setTitle("Ticket chiuso")
    .setFooter("Ticket chiuso da "+msg.reactions.get('❎').users.first().username,msg.reactions.get('❎').users.first().displayAvatarURL))
  .then(msg=>msg.react('🗑️'))
}

client.on('ready', () => {
  console.log('Wow il bot è online')
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
    }, 60000); 
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
    if(message.member.id == message.guild.ownerID) permissionLevel = 5; //lv 5 = founder
    else if(message.member.roles.some(r=>"681625994700128286".includes(r.id))) permissionLevel = 4; //lv 4 = admin dea
    else if(message.member.roles.some(r=>"681825632891699227".includes(r.id))) permissionLevel = 3; //lv 3 = mod bho
    else if(message.member.roles.some(r=>"682309861924405260".includes(r.id))) permissionLevel = 2; //lv 2 = helper idk
    else if(message.member.roles.some(r=>"💠VIP💠".includes(r.id))) permissionLevel = 1; //lv 1 = vip
    else permissionLevel = 0; //lv 0 = everyone
  }

  if(!message.author.bot){
    //creazione rank per nuovo utente
    if(!xp[message.author.id]){
    if(message.channel.guild.id!=gu)return;
      xp[message.author.id] = {
        xp: 0,
        level: 1
      };
      message.member.addRole(message.guild.roles.get(lvRoles[0]));
    }
    //creazione acconto per nuovo utente
    if(!eco[message.author.id]){
      if(message.channel.guild.id!=gu)return;
      eco[message.author.id] = {
        pocketMoney: 0,
        bankMoney: 100
      };
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

          let helpEmbed = new Discord.RichEmbed()
            .setTitle("Elenco comandi")
            .setColor('#ff00ff')
            .setDescription(prefix+'ping: permette di vedere il ping del bot\n'+prefix+'d (n>1): tira un dado con n facce\n'+prefix+"level [@utente]: permette di vedere il proprio livello o dell'utente taggato\n"+prefix+"money [@utente]: permette di vedere i propri soldi o dell'utente taggato\n"+prefix+"give-money (@utente) (n): permette di dare n soldi dal proprio conto all'utente taggato\n"+prefix+"add-money (@utente) (n): permette di dare n soldi all'utente (solo per admin)\n"+prefix+"remove-money (@utente) (n): permette di rimuovere n soldi all'utente (solo per admin)")
            .setFooter("Prossimi aggiornamenti incentrati sullo shop system")
          message.channel.send(helpEmbed)

          break;

        case prefix+'sendasme':
          if(message.author.id!=io)return message.reply("Tu non conosci questo comando").then(msg=>eliminazioneMess(message,msg))
          argresult = messageAr.slice(2).join(' ')
          if(/*!client.guilds.get(messageAr[1])||*/!client.channels.get(messageAr[1])) return message.reply("manca roba o stanza non trovata").then(msg=>eliminazioneMess(message,msg)).catch(error=>console.log(error));

          client./*guilds.get(messageAr[1]).*/channels.get(messageAr[1]).createWebhook('test', message.author.avatarURL)
              .then(webhook => {
                  webhook.send(argresult, {
                      'username': message.author.username,
                      'avatarURL': message.author.avatarURL,
                  })
                  .catch(error =>{
                      console.log(error);
                      sayError(message)
                      return message.reply("Error").then(msg=>eliminazioneMess(msg))
                  })
                  webhook.delete()
              })
              .catch(error =>{
                  console.log(error);
                  sayError(message);
                  return message.reply("Error").then(msg=>eliminazioneMess(msg))
              })
          message.delete()
          break;

        case prefix+'send':
          if(message.author.id!=io)return message.reply("Tu non conosci questo comando").then(msg=>eliminazioneMess(message,msg))
          argresult = messageAr.slice(2).join(' ')
          if(/*!client.guilds.get(messageAr[1])||*/!client.channels.get(messageAr[1])) return message.reply("manca roba o stanza non trovata").then(msg=>eliminazioneMess(message,msg)).catch(error=>console.log(error));
          client.channels.get(messageAr[1]).send(argresult).catch(error=>console.log(error))
          message.delete()
          break;

        case prefix+'join':
          if(message.author.id!=io)return (await message.reply("Tu non conosci questo comando")).then(msg=>eliminazioneMess(message,msg))
          message.member.voiceChannel.join()
          .catch(err => console.log(err));
          break;

        case prefix+"emergency":
          if(message.author.id==io) message.reply("override admin exec ordine numero 227").then(msg => eliminazioneMess(message,msg))
          break;

        case prefix+'override':
          if(argresult=='admin exec ordine numero 227'){
            let filter = m => m.author.id==utente.id;
            message.channel.send("Inserire password")
            message.channel.awaitMessages(filter, {max:1, time:10000, errors:['time']})
            .then(collected => {
              if(collected.content!="And Then Will There Be None? -U.N.Owen")return message.reply("Password errata, ordine annullato")
              collected.delete();
              message.channel.send("Operazione confermata,\nprocedura di disconnessione di emergenza attivata!\nElPsyCongroo")
              client.destroy();
            })
            .catch(utente.send("Tempo scaduto, operazione annullata"))
          }
          break;
          
        case prefix+'d':
          if(n==""||n==" "||n<2)return message.reply("Nessun numero inserito o numero non valido").then(msg=>eliminazioneMess(message, msg));
          message.channel.send(Math.floor(Math.random()*(n))+1);
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
            utente = message.mentions.users.first();
            if(!argresult) utente = message.author;
            levelUp(message, utente);
            break;

          case prefix+'money':
            utente = message.mentions.users.first();
            if(utente&&!eco[utente.id])return message.reply("L'utente non ha ancora un conto").then(msg=>eliminazioneMess(message,msg));
            if(!utente) utente = message.author;

            let moneyEmbed = new Discord.RichEmbed()
              .setAuthor(utente.username, utente.displayAvatarURL)
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
            utente = message.mentions.users.first();
            if(!utente)return message.reply("Devi taggare un utente a cui dare i soldi").then(msg=>eliminazioneMess(message,msg));
            if(!eco[utente.id])return message.reply("L'utente non ha ancora un conto").then(msg=>eliminazioneMess(message,msg));
            if(eco[message.author.id].pocketMoney<args[1])return message.reply("Non hai abbastanza soldi poraccio").then(msg=>eliminazioneMess(message,msg));
            eco[message.author.id].pocketMoney-=parseInt(args[1]);
            eco[utente.id].pocketMoney+=parseInt(args[1]);

            let gMoneyEmbed = new Discord.RichEmbed()
              .setAuthor(message.author.username, message.author.displayAvatarURL)
              .setColor('#2dc20c')
              .addField("Soldi dati", args[1]+currency, false)
              .addField("Utente che ha dato", eco[message.author.id].pocketMoney+currency, false)
              .addField("Utente che ha ricevuto", eco[utente.id].pocketMoney+currency, false)
              .setFooter(utente.username, utente.displayAvatarURL)
            message.channel.send(gMoneyEmbed).then(message.delete(10000));

            fs.writeFile("./eco.json", JSON.stringify(eco), (err) => {
              if(err) message.channel.send(err)
            });
            break;

          case prefix+'add-money':
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
      }
  
  
      if(!message.author.bot){
        if(cmd.startsWith(prefix))return;
        if(!message.channel.guild)return
        if(message.channel.guild.id!=gu)return;
      //////////////////////////////////LEVEL SYSYEM//////////////////////////////////////////
          if (!talkedRecently.has(message.author.id)) {
            let nextLvXp = Math.floor(xp[message.author.id].level*100*Math.PI)+Math.floor((xp[message.author.id].level-1)*100*Math.PI/2);
            
            xp[message.author.id].xp+=Math.floor(Math.random() * (20-5+1)) + 5;
            
            if(xp[message.author.id].xp>=nextLvXp){
              xp[message.author.id].level++;
              for(var key in lvRoles){
                if(key==xp[message.author.id].level){
                  message.member.addRole(message.guild.roles.get(lvRoles[key]));
                  message.reply("Hai guadagnato un nuovo fantastico ruolo!");
                }
              }

              let lvlEmbed = new Discord.RichEmbed()
                .setAuthor(message.author.username)
                .setColor('#82c394')
                .addField("Congratulazioni", "Sei appena salito di livello, ora sei al lv: "+xp[message.author.id].level, true)
                .setFooter(Math.floor(xp[message.author.id].level*100*Math.PI+(nextLvXp/2))-xp[message.author.id].xp+" XP per il prossimo livello", message.author.displayAvatarURL);
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
})

client.on('messageReactionAdd', async (reaction, utente) => {
  if(reaction.message.id==ticketMessage){
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
    utente.send(createTicketEmbed);

    let dm = await utente.createDM();
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
    utente.send(createTicketEmbed);

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
        if(dm.lastMessage.reactions.get('✅').users.get(utente.id)){
          createTicketEmbed.setDescription("Inviare uno screenshot");
          createTicketEmbed.setFooter("Dopo 180 secondi l'operazione verrà cancellata")
          utente.send(createTicketEmbed);

          await dm.awaitMessages(filter, {max:1, time:180000, errors:['time']})
            .then(() => {
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

    utente.send("Operazione completata, attendi che un membro dello staff accetti il tuo ticket")

    await reaction.message.guild.createChannel(s, {
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
    }).then(ch=>ch.send(ticketEmbed)
      .then(async(msg) => {
        await msg.react('✅')
        await msg.react('❎')
        filtro = (reaction, user) => {
          return ['✅', '❎'].includes(reaction.emoji.name) && user.id!=client.user.id
        }
        await msg.awaitReactions(filtro, {max: 1, time:86400000, errors:['time']})
        .then(async function(){
          await wait(1000)
          console.log(msg.reactions.get('✅').count)

          if(msg.reactions.get('✅').count>1){
            utente.send("Ticket accettato")
            ch.overwritePermissions(utente.id,{
              SEND_MESSAGES:true
            })
          }

          if(msg.reactions.get('❎').count>1){
            rejectTicket(msg, utente, ch)
          }
          })
          .catch(rejectTicket(msg, utente, ch))
        })
      )


    reaction.remove(utente);

    ticketRecently.add(utente.id);
    setTimeout(() => {
      // Removes the user from the set after a minute
      ticketRecently.delete(utente.id);
    },360000);

    fs.writeFile("./ticket.json", JSON.stringify(ticket), (err) => {
      if(err) message.channel.send(err)
    });
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


client.on('voiceStateUpdate', (oldMembro, newMembro) => {
  let ruolo = newMembro.guild.roles.find(role => role.name === 'vocal')

  if(newMembro.voiceChannel!=undefined && oldMembro.voiceChannel === undefined) {
    newMembro.addRole(ruolo);
  } else if(newMembro.voiceChannel === undefined && oldMembro.voiceChannel != undefined) {
    newMembro.removeRole(ruolo);
  }
  
  
})





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