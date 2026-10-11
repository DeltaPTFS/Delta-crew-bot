'use strict';
const {sendRoster}=require('./web-client');
function row(member){
  const roles=Array.from(member.roles.cache.values()).filter(r=>r.id!==member.guild.id);
  return {userId:member.id,discordUsername:member.user.username,
    displayName:member.displayName,guildId:member.guild.id,guildName:member.guild.name,
    roleIds:roles.map(role=>role.id),roleNames:roles.map(role=>role.name)};
}
async function upsertMember(member){
  if(member.user.bot)return;
  await sendRoster([row(member)]);
}
async function fullSync(guild){
  const members=await guild.members.fetch();
  const records=Array.from(members.values()).filter(x=>!x.user.bot).map(row);
  let total=0;
  for(let i=0;i<records.length;i+=80){
    const chunk=records.slice(i,i+80);
    await sendRoster(chunk);
    total+=chunk.length;
  }
  return total;
}
module.exports={row,upsertMember,fullSync};
