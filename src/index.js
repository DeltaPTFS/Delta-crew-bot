'use strict';
require('dotenv/config');
const http=require('node:http');
const {Client,Events,GatewayIntentBits}=require('discord.js');
const {command,handle}=require('./commands');
const {createDispatcher}=require('./dispatcher');
const {configured}=require('./web-client');
const {fullSync,upsertMember}=require('./roster-sync');
const token=process.env.DISCORD_TOKEN?.trim();
const guildId=process.env.DELTA_CREW_GUILD_ID?.trim();
if(!token||!/^\d{15,22}$/.test(guildId||'')){
  console.error('Set DISCORD_TOKEN and DELTA_CREW_GUILD_ID in RavenHost variables.');
  process.exit(1);
}
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers]});
const dispatcher=createDispatcher({client,guildId});
let ready=false;
client.once(Events.ClientReady,async bot=>{
  ready=true;
  console.log('Delta Air Lines Crew Bot ready: '+bot.user.tag);
  try{
    const guild=await bot.guilds.fetch(guildId);
    await guild.commands.set([command.toJSON()]);
    console.log('Registered /crew command in guild '+guildId);
  }catch(err){console.error('Failed to register /crew:',err);}
  if(!configured())console.warn('Website sync is not configured.');
  else {
    const crewGuild=await bot.guilds.fetch(guildId).catch(()=>null);
    if(crewGuild)fullSync(crewGuild).catch(err=>console.warn('Initial Crew roster sync:',err.message));
    if(crewGuild)setInterval(()=>fullSync(crewGuild).catch(err=>console.warn('Crew roster reconciliation:',err.message)),6*60*60*1000).unref();
  }
  else dispatcher.dispatch().catch(err=>console.error('Crew event sync:',err));
  const interval=Math.max(15000,Number(process.env.POLL_INTERVAL_MS)||30000);
  setInterval(()=>{if(configured())dispatcher.dispatch().catch(err=>console.error('Crew event sync:',err));},interval).unref();
});
client.on(Events.InteractionCreate,async interaction=>{
  if(!interaction.isChatInputCommand()||interaction.commandName!=='crew')return;
  await handle(interaction,{guildId,dispatch:dispatcher.dispatch}).catch(err=>console.error('Crew command:',err));
});
client.on(Events.GuildMemberAdd,member=>{if(member.guild.id===guildId&&configured())upsertMember(member).catch(console.error);});
client.on(Events.GuildMemberUpdate,(_old,member)=>{if(member.guild.id===guildId&&configured())upsertMember(member).catch(console.error);});
client.on(Events.Error,err=>console.error('Discord connection:',err));
const port=Number(process.env.PORT)||3000;
http.createServer((_req,res)=>{
  res.writeHead(ready?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});
  res.end(JSON.stringify({name:'delta-air-lines-crew-bot',ready,websiteConfigured:configured()}));
}).listen(port,'0.0.0.0',()=>console.log('Health check port '+port));
client.login(token).catch(err=>{console.error('Discord login error',err);process.exitCode=1;});
