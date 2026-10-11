'use strict';
const {SlashCommandBuilder,PermissionFlagsBits,EmbedBuilder}=require('discord.js');
const web=require('./web-client');
const choices=[
  {name:'List active forms',value:'forms'},
  {name:'Upcoming hosted flights',value:'flights'},
  {name:'Website and bot status',value:'status'},
  {name:'Retry undelivered website notifications',value:'sync'}
];
const command=new SlashCommandBuilder().setName('crew')
.setDescription('Delta Air Lines Crew operations and website integration')
.addStringOption(o=>o.setName('action').setDescription('Crew operation').setRequired(true).addChoices(...choices));
function permitted(interaction,guildId){
  return interaction.inGuild()&&interaction.guildId===guildId;
}
function canSync(interaction){
  const roles=interaction.member?.roles?.cache;
  const privileged=new Set(['1554665018690248714','1554666461644197988','1554666482988875788']);
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ||(roles&&[...privileged].some(role=>roles.has(role)));
}
async function handle(interaction,options={}){
  if(!permitted(interaction,options.guildId)){
    return interaction.reply({content:'This command is only available in the configured Delta Crew server.',ephemeral:true});
  }
  await interaction.deferReply({ephemeral:true});
  const action=interaction.options.getString('action',true);
  try{
    if(action==='status'){
      await interaction.editReply('**Delta Crew Bot** — Online. Website connection: '+(web.configured()?'configured':'missing credentials')+'.');
      return;
    }
    if(action==='sync'){
      if(!canSync(interaction)){await interaction.editReply('Only BOD, Leadership or Human Resources may retry notifications.');return;}
      const report=await options.dispatch();
      await interaction.editReply('Website notifications synchronized: '+report.sent+' sent, '+report.pending+' pending.');
      return;
    }
    if(action==='forms'){
      const forms=(await web.getForms()).forms||[];
      if(!forms.length){await interaction.editReply('No published crew forms are currently available.');return;}
      await interaction.editReply({embeds:[new EmbedBuilder().setColor(0xC8102E).setTitle('Delta Crew | Active Forms')
        .setDescription(forms.slice(0,15).map(f=>'• **'+f.title.slice(0,100)+'** — [Open form]('+f.url+')').join('\n'))
        .setFooter({text:'Role restrictions are enforced when you open the website.'})]});return;
    }
    if(action==='flights'){
      const flights=(await web.getFlights()).flights||[];
      if(!flights.length){await interaction.editReply('There are no upcoming hosted flights.');return;}
      await interaction.editReply({embeds:[new EmbedBuilder().setColor(0x071D49).setTitle('Delta Crew | Upcoming Flights')
        .setDescription(flights.slice(0,12).map(f=>'• **'+f.number+'** '+f.departure+' → '+f.destination+
          ' — <t:'+Math.floor(Date.parse(f.starts_at)/1000)+':F>\n  [Crew fillout]('+f.form_url+')').join('\n'))]});return;
    }
  }catch(error){
    console.error('Crew slash command error:',error);
    await interaction.editReply('Crew website service is temporarily unavailable: '+error.message.slice(0,200));
  }
}
module.exports={command,handle,canSync,permitted};
