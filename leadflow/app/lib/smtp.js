// smtp.js — minimal SMTP client using only Node built-ins.
// Supports implicit TLS (port 465) and STARTTLS (port 587), AUTH LOGIN.
// Works with Gmail app passwords, Outlook/Microsoft 365, Zoho, SendGrid SMTP, etc.
import net from 'net';
import tls from 'tls';

const TIMEOUT_MS = 20000;

class Conn {
  constructor(socket) {
    this.attach(socket);
  }

  attach(socket) {
    this.socket = socket;
    this.buf = '';
    this.waiter = null;
    socket.setTimeout(TIMEOUT_MS, () => this.fail(new Error('SMTP timeout')));
    socket.on('data', (d) => { this.buf += d.toString('utf8'); this.drain(); });
    socket.on('error', (e) => this.fail(e));
    socket.on('close', () => this.fail(new Error('SMTP connection closed')));
  }

  fail(err) {
    if (this.waiter) { const w = this.waiter; this.waiter = null; w.reject(err); }
    this.dead = err;
  }

  drain() {
    if (!this.waiter) return;
    const lines = this.buf.split('\r\n');
    let consumed = 0;
    const out = [];
    for (let i = 0; i < lines.length - 1; i++) {
      out.push(lines[i]);
      consumed += lines[i].length + 2;
      if (/^\d{3}(?: |$)/.test(lines[i])) {
        this.buf = this.buf.slice(consumed);
        const w = this.waiter; this.waiter = null;
        w.resolve(out.join('\n'));
        return;
      }
    }
  }

  read() {
    if (this.dead) return Promise.reject(this.dead);
    return new Promise((resolve, reject) => {
      this.waiter = { resolve, reject };
      this.drain();
    });
  }

  async cmd(line, expectCode) {
    if (line != null) this.socket.write(line + '\r\n');
    const reply = await this.read();
    const code = Number(reply.slice(0, 3));
    if (expectCode && code !== expectCode) {
      throw new Error(`SMTP error after "${line ? line.split(' ')[0] : 'connect'}": ${reply.split('\n')[0]}`);
    }
    return reply;
  }

  end() {
    try { this.socket.end(); } catch { /* ignore */ }
  }
}

function open(host, port, secure) {
  return new Promise((resolve, reject) => {
    const onErr = (e) => reject(e);
    const socket = secure
      ? tls.connect({ host, port, servername: host }, () => { socket.off('error', onErr); resolve(socket); })
      : net.connect({ host, port }, () => { socket.off('error', onErr); resolve(socket); });
    socket.once('error', onErr);
    socket.setTimeout(TIMEOUT_MS, () => { socket.destroy(); reject(new Error('SMTP connect timeout')); });
  });
}

function upgradeStartTls(socket, host) {
  return new Promise((resolve, reject) => {
    const secured = tls.connect({ socket, servername: host }, () => resolve(secured));
    secured.once('error', reject);
  });
}

/**
 * Send a raw RFC 5322 message.
 * @param {object} smtp settings: {host, port, secure, user, pass}
 * @param {string} from envelope sender address
 * @param {string|string[]} to recipient address(es)
 * @param {string} message full message (headers + body), CRLF line endings
 */
export async function smtpSend(smtp, from, to, message) {
  const port = Number(smtp.port) || (smtp.secure ? 465 : 587);
  const secure = !!smtp.secure || port === 465;
  let socket = await open(smtp.host, port, secure);
  let conn = new Conn(socket);

  try {
    await conn.cmd(null, 220); // server greeting
    let ehlo = await conn.cmd(`EHLO leadflow.local`, 250);

    if (!secure && /STARTTLS/i.test(ehlo)) {
      await conn.cmd('STARTTLS', 220);
      const secured = await upgradeStartTls(socket, smtp.host);
      conn = new Conn(secured);
      socket = secured;
      ehlo = await conn.cmd(`EHLO leadflow.local`, 250);
    }

    if (smtp.user) {
      await conn.cmd('AUTH LOGIN', 334);
      await conn.cmd(Buffer.from(smtp.user, 'utf8').toString('base64'), 334);
      await conn.cmd(Buffer.from(smtp.pass || '', 'utf8').toString('base64'), 235);
    }

    await conn.cmd(`MAIL FROM:<${from}>`, 250);
    const rcpts = Array.isArray(to) ? to : [to];
    for (const r of rcpts) await conn.cmd(`RCPT TO:<${r}>`, 250);
    await conn.cmd('DATA', 354);

    // dot-stuffing per RFC 5321
    const stuffed = message.replace(/\r\n\./g, '\r\n..');
    await conn.cmd(stuffed + '\r\n.', 250);
    try { await conn.cmd('QUIT', 221); } catch { /* some servers just close */ }
  } finally {
    conn.end();
  }
}
