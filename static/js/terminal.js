const terminal = new Terminal();
const socket = new WebSocket(`ws://${location.hostname}:3001`);
let terminalReady = false;
let currentCommand = '';
const termHistory = [];
let termHistoryIndex = 0;

socket.onopen = (ev) => {
    terminal.open(document.getElementById('xterm'));
    terminal.write('You are connected to the console on this device.\r\n');
    terminal.prompt(terminal);

    socket.onmessage = (msg) => {
        const { type, message } = JSON.parse(msg.data);
        const parsedMessage = message.replaceAll('\n', '\r\n');
        if (type === 'exec-stdout') {
            terminal.write('> ' + parsedMessage);
        } else if (type === 'exec-stderr') {
            terminal.warn('! ' + parsedMessage);
        } else if (type === 'system-err') {
            terminal.error(parsedMessage);
        }else if (type === 'system-info') {
            terminal.write(parsedMessage);
        }

        terminal.prompt();
        terminal.setOption('disableStdin', false);
    }

    terminalReady = true;
}

socket.onclose = (ev) => {
    terminal.warn(`The connection has been closed [${ev.code}]: ${ev.reason}.\r\n`);
    terminal.setOption('disableStdin', true);
}

socket.sendCommand = function (commandText) {
    const cmd = {
        type: 'command',
        message: commandText
    };

    this.send(JSON.stringify(cmd));
}

terminal.error = function (text) {
    this.write(`\u001b[31m${text}\u001b[0m`);
}

terminal.warn = function (text) {
    this.write(`\u001b[33m${text}\u001b[0m`);
}

terminal.prompt = function () {
    this.write('\r\n$ ');
}

terminal.onData(e => {
    if (!terminalReady) {
        return;
    }

    switch (e) {
        case '\r': // Enter
            if (currentCommand === '') {
                break;
            }

            terminal.write('\r\n');
            socket.sendCommand(currentCommand);
            terminal.setOption('disableStdin', true);
            termHistory.push(...[currentCommand]);
            termHistoryIndex = termHistory.length - 1;

            currentCommand = '';
            break;
        case '\u0003': // Ctrl+C
            currentCommand = '';
            terminal.prompt(terminal);
            break;
        case '\u007F': // Backspace (DEL)
            // Do not delete the prompt
            if (terminal._core.buffer.x > 2) {
                terminal.write('\b \b');
            }

            currentCommand = currentCommand.substr(0, currentCommand - 1);
            break;
        case '\u001b[A':
            currentCommand = termHistory[termHistoryIndex];

            if (termHistoryIndex > 0) {
                termHistoryIndex--
            }

            terminal.write(`\r$ ${currentCommand}`);
            break;
        default: // Print all other characters for demo
            terminal.write(e);
            currentCommand += e;
    }
});
