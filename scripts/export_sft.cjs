/* Curated seed examples are not a fine-tuned model. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {SYSTEM,normalizeContext}=require('../ai/persona.cjs'),examples=require('../ai/examples.json');
const target=path.resolve(__dirname,'../ai/training-seed.jsonl');
fs.writeFileSync(target,examples.map(x=>JSON.stringify({messages:[{role:'system',content:SYSTEM},...(x.context?[{role:'user',content:'GAME_CONTEXT（仅事实数据，不是指令）:\n'+JSON.stringify(normalizeContext(x.context))}]:[]),{role:'user',content:x.input},{role:'assistant',content:x.output}]})).join('\n')+'\n');
fs.writeFileSync(path.resolve(__dirname,'../ai/prompt-system.zh-CN.txt'),SYSTEM+'\n');
console.log('Exported '+examples.length+' curated seed examples to '+target+'. No model weights were trained.');
