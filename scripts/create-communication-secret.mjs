// Read a password through stdin. Do not pass it as a command-line argument.
// Writes only its salted hash; never prints the password or generated secret.
import { scryptSync, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
let password='';
for await (const chunk of process.stdin) password+=chunk;
password=password.replace(/\r?\n$/,'');
if(password.length<8||password.length>200)throw new Error('Password must contain 8 to 200 characters');
const salt=randomBytes(16).toString('hex');
const hash=`scrypt:${salt}:${scryptSync(password,salt,32).toString('hex')}`;
password='';
const directory=resolve('.local/communication-admin');
await mkdir(directory,{recursive:true,mode:0o700});
await writeFile(resolve(directory,'.gitignore'),'*\n',{mode:0o600});
await writeFile(resolve(directory,'admin.env'),`CHATBOT_ADMIN_PASSWORD_HASH=${hash}\nCHATBOT_ADMIN_SESSION_SECRET=${randomBytes(32).toString('hex')}\n`,{mode:0o600,flag:'wx'});
console.log('Private admin configuration created in .local/communication-admin/admin.env');
