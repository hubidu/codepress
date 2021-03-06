const path = require('path');
const debug = require('debug')('codepress:run-scenario');

const { spawn } = require('child_process')

const WS_URL = 'http://localhost:3000';
const TestProjectDir = process.cwd();

const escapeDoubleQuotes = (str) => {
	return str.replace(/\\([\s\S])|(")/g,"\\$1$2"); 
}

const getConfig = (HelperName) => {
  if (HelperName === 'Puppeteer') {
    return { 
      helpers: {
        Puppeteer: {
          disableScreenshots: true,
  
          chrome: {
            // userDataDir: './_codepress/user-data' // TODO Speeds things up through caching, but also keeps cookies
          }
        },
        RealtimeReporterHelper: {
          require: './_codepress/realtime-reporter.helper.js',
        }
      }
    };
  }

  throw new Error(`Unknown helper ${HelperName}`);
}


module.exports = async (req, res) => {
  const {scenario} = req.params;

  const socket = require('socket.io-client')(WS_URL);

  // TODO Make that work for all helpers not only puppeteer
  const configOverrides = getConfig('Puppeteer');

  debug(`Spawing npx codeceptjs run --steps --override "${escapeDoubleQuotes(JSON.stringify(configOverrides))}" --grep "${escapeDoubleQuotes(scenario)}"`)

  process.chdir(TestProjectDir);
  const codeceptjsProcess = spawn(path.join('.', 'node_modules', '.bin', 'codeceptjs'), [
      'run', '--steps', 
      '--override', `"${escapeDoubleQuotes(JSON.stringify(configOverrides))}"`,
      '--grep', `"${escapeDoubleQuotes(scenario)}"`
  ], { stdio: ['ignore', 'pipe', 'inherit'], shell: true }); // shell true is important for quoted params

  socket.emit('codeceptjs.started', {
    pid: codeceptjsProcess.pid,
  });

  codeceptjsProcess.on('error', err => {
    socket.emit('codeceptjs.error', err);
  });
  codeceptjsProcess.on('close', code => {
    socket.emit('codeceptjs.exit', code);
  });
  codeceptjsProcess.on('exit', code => {
    socket.emit('codeceptjs.exit', code);
  });
  codeceptjsProcess.stdout.on('data', data => {
    socket.emit('codeceptjs.stdout', data);
  })

  res.status(200).send('OK');
}