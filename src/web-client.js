'use strict';
const BASE=process.env.DELTA_WEBSITE_URL?.trim().replace(/\/+$/,'')||'';
const SECRET=process.env.DELTA_CREW_API_SECRET?.trim()||'';
function configured(){return /^https:\/\//i.test(BASE)&&SECRET.length>=32;}
async function request(path,options={}){
  if(!configured()) throw new Error('Configure DELTA_WEBSITE_URL (HTTPS) and DELTA_CREW_API_SECRET (32+ chars).');
  const response=await fetch(BASE+path,{...options,headers:{Authorization:'Bearer '+SECRET,'Accept':'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...options.headers},signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('Website HTTP '+response.status+': '+String(data.detail||'Request failed').slice(0,150));
  return data;
}
async function sendRoster(members){return request('/internal/crew/roster',{method:'POST',body:JSON.stringify({members})});}
async function getForms(){return request('/internal/crew/forms');}
async function getFlights(){return request('/internal/crew/flights');}
async function getEvents(){return request('/internal/crew/events');}
async function ackEvent(id){if(!/^\d+$/.test(String(id)))throw new Error('Invalid event');return request('/internal/crew/events/'+id+'/ack',{method:'POST',body:'{}'});}
module.exports={configured,getForms,getFlights,getEvents,ackEvent,sendRoster};
