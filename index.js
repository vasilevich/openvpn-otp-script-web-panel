const express = require('express');
const {generatePassPhraseWithUserName} = require("./utils");
const app = express();
const runShellScript = require('./utils').runShellScript;
const apiPath = '/api';
const assets = 'public';
const openvpnscripts = 'openvpn-scripts';

const username = 'test';
runShellScript([`./${openvpnscripts}/create-user.sh`, username], {'passphrase': generatePassPhraseWithUserName(username)})
    .then((stdout) => {
        console.log(stdout);
    })
    .catch((error) => {
        console.log(error);
    });


// Serve the HTML file on GET request to the root endpoint
app.get('/', (req, res) => {
    res.sendFile(__dirname + `/${assets}/index.html`);
});


// Endpoint for fetching the list of users
app.get(`${apiPath}`, async (req, res) => {
    try {
        const users = (await runShellScript(`./${openvpnscripts}/list-users.sh`)).split('\n')
            .slice(1)
            .map(row => row.trim())
            .filter(row => row)
            .map(row => {
                const [name, begin, end, status] = row.split(',');
                return {name, begin, end, status};
            });
        res.send(users);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint for deleting a user
app.delete(`${apiPath}/:username`, async (req, res) => {
    try {
        const {username} = req.params;
        await runShellScript(`./${openvpnscripts}/delete-user.sh ${username}`);
        console.log(`Deleted user ${username}: ${stdout}`);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


// Endpoint for creating a user
app.post(`${apiPath}/:username`, async (req, res) => {
    try {
        const {username} = req.params;
        await runShellScript(`./${openvpnscripts}/create-user.sh ${username}`);
        console.log(`Created user ${username}`);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
