'use strict';
const {EmbedBuilder}=require('discord.js');
const web=require('./web-client');
const MAX_PER_POLL=12;
const idMarker=id=>'DELTA-CREW-WEB-EVENT-'+id;
function channelFor(event,env=process.env){
  if(event.kind==='form_response'||(event.kind==='form_published'&&event.payload?.restricted))return env.CREW_FORM_RESPONSES_CHANNEL_ID||env.CREW_HR_CHANNEL_ID;
  if(event.kind==='flight')return env.CREW_FLIGHTS_CHANNEL_ID||env.CREW_ANNOUNCEMENTS_CHANNEL_ID;
  return env.CREW_ANNOUNCEMENTS_CHANNEL_ID;
}
function render(event){
  const p=event.payload||{};
  const heading={flight:'Flight Operations Update',form_published:'New Community Form',form_response:'Form Response Received'}[event.kind]||'Crew Website Update';
  const embed=new EmbedBuilder().setTitle('Delta Air Lines | '+heading).setColor(event.kind==='form_response'?0x071D49:0xC8102E)
    .setTimestamp(new Date()).setFooter({text:idMarker(event.id)+' • Keep Climbing, Delta Air Lines.'});
  if(event.kind==='flight'){
    embed.setDescription('**'+String(p.flight_number||'Delta Flight').slice(0,60)+'** — '+String(p.departure||'TBA')+' → '+String(p.destination||'TBA'))
      .addFields({name:'Status',value:String(p.status||'SCHEDULED'),inline:true},
                 {name:'Departure',value:p.starts_at?'<t:'+Math.floor(Date.parse(p.starts_at)/1000)+':F>':'TBA',inline:true});
    if(p.form_url)embed.addFields({name:'Crew sign-up',value:'[Open flight fillout]('+p.form_url+')'});
  }else if(event.kind==='form_published'){
    embed.setDescription('**'+String(p.title||'New Form').slice(0,180)+'** is available.')
      .addFields({name:'Open form',value:'[View form]('+p.url+')'});
  }else if(event.kind==='form_response'){
    embed.setDescription('A new submission was received for **'+String(p.form_title||'Crew Form').slice(0,140)+'**.')
      .addFields({name:'Applicant',value:String(p.display_name||'Discord member').slice(0,100),inline:true},
                 {name:'Response ID',value:String(p.response_id||event.id),inline:true});
    if(p.responses_url)embed.addFields({name:'Staff review',value:'[View responses]('+p.responses_url+')'});
  }else embed.setDescription(String(p.summary||'Crew update').slice(0,1000));
  return embed;
}
function createDispatcher({client,guildId,logger=console,env=process.env}){
  let busy=false;
  async function dispatch(){
    if(busy)return {sent:0,pending:0};
    busy=true;
    let sent=0;
    try{
      const pending=(await web.getEvents()).events||[];
      const guild=await client.guilds.fetch(guildId);
      for(const event of pending.slice(0,MAX_PER_POLL)){
        const id=channelFor(event,env);
        if(!id){logger.warn('Crew announcement channel not set for '+event.kind);continue;}
        const channel=await guild.channels.fetch(id).catch(()=>null);
        if(!channel?.isTextBased()||!channel.send){logger.warn('Crew event destination unavailable: '+id);continue;}
        const marker=idMarker(event.id);
        const recent=await channel.messages.fetch({limit:50}).catch(()=>null);
        const found=recent&&[...recent.values()].some(m=>m.author?.id===client.user.id
          &&m.embeds?.some(e=>String(e.footer?.text||'').includes(marker)));
        if(!found)await channel.send({embeds:[render(event)],allowedMentions:{parse:[]}});
        // ack only after Discord confirms send; replay-safe across process restarts.
        await web.ackEvent(event.id);
        sent++;
      }
      return {sent,pending:Math.max(0,pending.length-sent)};
    }finally{busy=false;}
  }
  return {dispatch};
}
module.exports={createDispatcher,render,channelFor};
