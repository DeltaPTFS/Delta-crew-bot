'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {channelFor,render}=require('../src/dispatcher');
const {permitted,canSync,command}=require('../src/commands');
const {row:crewRow}=require('../src/roster-sync');

test('Crew notifications route restricted forms and all responses to private HR',()=>{
  const env={CREW_ANNOUNCEMENTS_CHANNEL_ID:'public',CREW_FORM_RESPONSES_CHANNEL_ID:'private',CREW_FLIGHTS_CHANNEL_ID:'flights'};
  assert.equal(channelFor({kind:'form_response'},env),'private');
  assert.equal(channelFor({kind:'form_published',payload:{restricted:true}},env),'private');
  assert.equal(channelFor({kind:'form_published',payload:{restricted:false}},env),'public');
  assert.equal(channelFor({kind:'flight'},env),'flights');
});
test('Unknown guild never gets Crew command access',()=>{
  assert.equal(permitted({inGuild:()=>true,guildId:'100'},'200'),false);
  assert.equal(permitted({inGuild:()=>true,guildId:'200'},'200'),true);
});
test('Only BOD, Leadership and HR may force sync',()=>{
  const fake={memberPermissions:{has:()=>false},member:{roles:{cache:new Map([['1554666482988875788',{}]])}}};
  assert.equal(canSync(fake),true);
  fake.member.roles.cache.clear();
  assert.equal(canSync(fake),false);
});
test('Event embeds contain a stable marker and no full application answers',()=>{
  const embed=render({id:123,kind:'form_response',payload:{
    form_title:'Pilot Application',display_name:'Captain Example',response_id:123,
    answers:{passport:'DO NOT EXPOSE'}
  }}).toJSON();
  assert.match(embed.footer.text,/DELTA-CREW-WEB-EVENT-123/);
  assert.doesNotMatch(JSON.stringify(embed),/DO NOT EXPOSE/);
});
test('All required Crew actions are registered',()=>{
  const json=command.toJSON();
  assert.equal(json.name,'crew');
  assert.ok(json.options[0].choices.some(c=>c.value==='forms'));
  assert.ok(json.options[0].choices.some(c=>c.value==='flights'));
});

test('Crew roster events include only the Crew guild and exact role IDs',()=>{
  const member={id:'1554669633573888010',displayName:'Example Crew',user:{username:'crew.example'},
    guild:{id:'1554669999999999999',name:'Delta Crew'},
    roles:{cache:new Map([['1554669999999999999',{id:'1554669999999999999',name:'@everyone'}],
      ['1554666482988875788',{id:'1554666482988875788',name:'Human Resources'}]])}};
  const item=crewRow(member);
  assert.equal(item.guildName,'Delta Crew');
  assert.deepEqual(item.roleIds,['1554666482988875788']);
});
