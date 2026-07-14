#!/usr/bin/env node
// Create or update a clone-app user.
//
//   node clone/add-user.js <username> <audience> [displayName]
//
// audience: private (Richard — full access, can manage the voice)
//           known   (friends/colleagues — chat, sees 'known'-scoped brain entries)
//           public  (anyone else — chat, public entries only)
//
// The password is read from the terminal (not from argv, so it stays out
// of shell history). Pipe it on stdin for non-interactive use.
import readline from 'readline';
import { upsertUser } from './auth.js';

const [username, audience = 'known', displayName] = process.argv.slice(2);
if (!username) {
  console.error('Usage: node clone/add-user.js <username> <audience: private|known|public> [displayName]');
  process.exit(1);
}

function askPassword() {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      let data = '';
      process.stdin.on('data', (c) => { data += c; });
      process.stdin.on('end', () => resolve(data.trim()));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.stdoutMuted = false;
    rl.question(`Password for ${username}: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    rl._writeToOutput = function (str) {
      // echo the prompt but not the typed password
      if (rl.stdoutMuted) rl.output.write('*');
      else rl.output.write(str);
      if (str.includes('Password')) rl.stdoutMuted = true;
    };
  });
}

const password = await askPassword();
try {
  upsertUser({ username, password, audience, displayName });
  console.log(`\n✅ User "${username}" saved (audience: ${audience}).`);
} catch (err) {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
}
