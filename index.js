// require('dotenv').config()
// const config = {
//     WIDTH: parseInt(process.env.WIDTH) || 1024,
//     HEIGHT: parseInt(process.env.HEIGHT) || 720,
//     DEBUG: false,
//     MAIN_HOST: process.env.MAIN_HOST || "https://andresokol.herokuapp.com/",
// };

// if (process.env.DEBUG !== undefined) {
//     config.DEBUG = true;
// }

const electron = require('electron');
const {app, BrowserWindow, dialog} = require('electron');
const path = require('path');
const url = require('url');

const log = require('electron-log');

log.transports.file.level = 'silly';
log.transports.console.level = 'silly';

let win;

function createWindow () {
    global.SOCKET_HOST = config.MAIN_HOST;

    log.info('SOCKET_HOST', global.SOCKET_HOST);

    // let displays = electron.screen.getAllDisplays();

    // message = 'Choose display to show overlay:';
    // options = [];

    // for (let i = 0; i < displays.length; i += 1) {
    //     options.push('Display ' + i + '. x=' + displays[i].bounds.x + 
    //                  '; y=' + displays[i].bounds.y);
    // }

    // log.info(message);
    // log.info(options);

    // let displayIndex = dialog.showMessageBox({
    //     type: 'info',
    //     message: 'Found ' + displays.length + ' displays.',
    //     buttons: options,
    // });

    // log.info('Chosen display:');
    // log.info(displays[displayIndex]);

    // let launch_display = displays[displayIndex].bounds;

    win = new BrowserWindow({
                              width: 800,
                              height: 600,
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    //win.webContents.openDevTools();

    win.on('closed', () => {
        win = null
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});