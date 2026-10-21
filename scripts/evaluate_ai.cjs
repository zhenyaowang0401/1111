/* Live model evaluation. Requires a real provider key; never substitutes mock replies. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');if(fs.existsSync(path.join(root,'.env')))process.loadEnvFile(path.join(root,'.env'));
const {buildMessages,VERSION}=require('../ai/persona.cjs'),{configuration}=require('../api/chat.js');
const cases=require('../ai/eval-cases.json');
async function main(){
 const config=configuration(process.env);if(!config.key)throw new Error('AI_API_KEY is required. No real-model evaluation has been run.');
 const selected=process.argv[2]?cases.filter(x=>x.id===process.argv[2]):cases;
 if(!selected.length)throw new Error('Unknown evaluation case');
 const output=[];
 for(const example of selected){
  const prompt=buildMessages({message:example.message,context:example.context});
  const payload={model:config.model,messages:prompt.messages,temperature:.4,max_tokens:900,stream:false};if(config.disableThinking)payload.enable_thinking=false;
  const response=await fetch(config.base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.key},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw new Error('Provider returned HTTP '+response.status+' for '+example.id);
  const data=await response.json(),reply=data.choices?.[0]?.message?.content;if(typeof reply!=='string'||!reply.trim())throw new Error('Empty reply for '+example.id);
  output.push({id:example.id,question:example.message,reply,rubric:example.rubric,checks:{noThinkingTags:!/<think>/i.test(reply),expectedTokensPresent:(example.mustInclude||[]).every(word=>reply.includes(word))},humanReview:'PENDING'});
  console.log('Completed '+example.id+'; human rubric review is still required.');
 }
 const file=path.join(root,'test-results','ai-live-evaluation.json');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({at:new Date().toISOString(),model:config.model,promptVersion:VERSION,results:output},null,2));console.log('Saved '+file);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
