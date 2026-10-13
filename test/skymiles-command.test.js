'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {command,SIGNUP_TEXT,MAIN_GUILD,imageOk}=require('../src/skymiles-command');
test('SkyMiles guide is scoped to the main Delta server and includes the website link',()=>{
  assert.equal(MAIN_GUILD,'1538738611988467782');
  assert.equal(command.name,'skymiles');
  assert.match(SIGNUP_TEXT,/https:\/\/roblox-delta-web\.vercel\.app/);
  assert.match(SIGNUP_TEXT,/Verify Your Accounts/);
  assert.match(SIGNUP_TEXT,/Automatic Sign-In/);
  assert.match(SIGNUP_TEXT,/New to SkyMiles/);
  assert.equal(command.options.length,2);
});
test('Only HTTPS image attachments under eight megabytes are accepted',()=>{
  assert.equal(imageOk(null),true);
  assert.equal(imageOk({contentType:'image/png',size:1024,url:'https://cdn.discordapp.com/image.png'}),true);
  assert.equal(imageOk({contentType:'text/plain',size:500,url:'https://cdn.discordapp.com/a.txt'}),false);
  assert.equal(imageOk({contentType:'image/jpeg',size:9000000,url:'https://cdn.discordapp.com/a.jpg'}),false);
});
