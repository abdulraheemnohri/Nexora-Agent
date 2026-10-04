const safeLinux=/^(pwd|ls(?:\s.*)?|cat\s+[^;&|]+|echo(?:\s.*)?|git\s+(status|diff|log)(?:\s.*)?)$/i;
const safeWin=/^(cd|dir|type|echo|git\s+(status|diff|log))(?:\s.*)?$/i;
export function risk(command,platform=process.platform){const c=String(command||"");if(/(rm\s+-rf|del\s+\/s|format\s|diskpart|shutdown|reboot|reg\s+delete|git\s+push|git\s+reset\s+--hard)/i.test(c))return"critical";if(/(npm\s+install|pip\s+install|apt\s|dnf\s|pacman\s|mv\s|cp\s|mkdir\s|touch\s|write)/i.test(c))return"high";if(platform==="win32"?safeWin.test(c):safeLinux.test(c))return"safe";return"medium"}
export const commandRisk=risk;
export function decide(input,mode="ask"){const r=typeof input==="string"?risk(input):String(input?.risk||"medium");const m=mode==="high-risk"?"ask":mode;if(m==="unrestricted")return"allow";if(r==="critical")return"ask";if(m==="safe"&&r!=="safe")return"deny";if(m==="trusted"&&r!=="critical")return"allow";return r==="safe"?"allow":"ask"}
export const decision=decide;