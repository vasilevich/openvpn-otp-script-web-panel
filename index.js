const express = require('express');
const { exec } = require('child_process');
const app = express();
const assets = 'public';
const openvpnscripts = 'openvpn-scripts';
const execSh = require('exec-sh');
const execShPromise = require("exec-sh").promise;


const pty = require('node-pty');

const runShellScript = (scriptPath) => {
 return new Promise((resolve, reject) => {
    const shell = pty.spawn('sh', [scriptPath], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    });

    let output = '';

    shell.on('data', (data) => {
      output += data.toString();
    });

    shell.on('exit', (code) => {
      if (code === 0) {
        const result = output
          .split('\n')
          .filter(line => line.trim() !== '')
          .join('\n');
        resolve(result);
      } else {
        reject(`child process exited with code ${code}`);
      }
    });

    // Clean up the PTY instance and event listeners
    const cleanup = () => {
      shell.destroy();
      shell.removeAllListeners();
    };

    // Clean up on process exit or unhandled rejection
    process.once('exit', cleanup);
    process.once('unhandledRejection', (error) => {
      console.error('Unhandled rejection:', error);
      cleanup();
      process.exit(1);
    });
  });
}

// Endpoint for fetching the list of users
app.get('/api', async (req, res) => {
	


    execSh(`sh ./${openvpnscripts}/list-users.sh`, {},(error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).send('Internal server error');
            return;
        }
        const rows = stdout.split('\n').slice(1).map(row=>row.trim()).filter(row=>row);
	console.log(3333,stdout);
	const users = rows.map(row => {
            const [name, begin, end, status] = row.split(',');
            return { name, begin, end, status };
        });
        res.send(users);
    });
});

// Endpoint for deleting a user
app.delete('/api/:username', (req, res) => {
    const { username } = req.params;
    // Run the delete-user script with the username as argument
    execSh(`sh ./${openvpnscripts}/delete-user ${username}`, {},(error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).send('Internal server error');
            return;
        }
        console.log(`Deleted user ${username}: ${stdout}`);
        res.sendStatus(204);
    });
});

// Endpoint for creating a user
app.post('/api/:username', (req, res) => {
    const { username } = req.params;
    // Run the create-user script with the username as argument
    execSh(`sh ./${openvpnscripts}/create-user ${username}`, {},(error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).send('Internal server error');
            return;
        }
        console.log(`Created user ${username}: ${stdout}`);
        res.send(stdout);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
