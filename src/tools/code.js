import {spawn} from "node:child_process";
export function codeExecute(args={},cwd=process.cwd()){
 const language=String(args.language||"node").toLowerCase();
 const source=String(args.code||"");
 if(!source) throw Error("code required");
 const timeout=Math.min(Math.max(Number(args.timeout)||30000,1000),120000);
 const commands={node:["node",["-e",source]],python:["python",["-c",source]],python3:["python3",["-c",source]]};
 const spec=commands[language];
 if(!spec) throw Error("Unsupported code language");
 return new Promise((resolve,reject)=>{
  const child=spawn(spec[0],spec[1],{cwd,shell:false,windowsHide:true});
  let stdout="",stderr="";
  const timer=setTimeout(()=>{child.kill();reject(Error("Code execution timed out"))},timeout);
  child.stdout.on("data",d=>stdout+=d); child.stderr.on("data",d=>stderr+=d);
  child.on("error",e=>{clearTimeout(timer);reject(e)});
  child.on("close",code=>{clearTimeout(timer);resolve({exitCode:code,stdout:stdout.slice(0,200000),stderr:stderr.slice(0,200000)})});
 });
}
