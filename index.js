const express = require('express');
const { exec } = require('child_process');
const app = express();
const assets = 'public';
const openvpnscripts = 'openvpn-scripts';


// Serve the HTML file on GET request to the root endpoint
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Endpoint for fetching the list of users
app.get('/api', (req, res) => {
    // Run the list-users.sh script and parse its output
    exec(`.${openvpnscripts}/list-users.sh`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            res.status(500).send('Internal server error');
            return;
        }
        const rows = stdout.split('\n').slice(1, -1);
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
    exec(`.${openvpnscripts}/delete-user ${username}`, (error, stdout, stderr) => {
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
    exec(`.${openvpnscripts}/create-user ${username}`, (error, stdout, stderr) => {
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
