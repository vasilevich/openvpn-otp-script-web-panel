const pty = require('node-pty');
const crypto = require('crypto');

const runShellScript = (scriptPaths, inputs = {}) => {
    return new Promise((resolve, reject) => {
        const shell = pty.spawn('sh', [scriptPaths].flat(), {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.cwd(),
            env: process.env
        });

        let output = '';
        let waitForPrompt = false;

        shell.on('data', (data) => {
            output += data.toString();

            if (waitForPrompt) {
                for (const prompt in inputs) {
                    if (output.includes(prompt)) {
                        shell.write(inputs[prompt] + '\r');
                        waitForPrompt = false;
                        break;
                    }
                }
            }
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

        // Wait for the first prompt before sending input
        waitForPrompt = true;

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

const generatePassPhraseWithUserName = (username) => {
    return crypto.createHash('sha256').update(username).digest('base64');
};

module.exports = {
    runShellScript,
    generatePassPhraseWithUserName
}
