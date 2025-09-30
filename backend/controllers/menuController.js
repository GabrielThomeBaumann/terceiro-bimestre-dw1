// menuController.js
const path = require('path');

exports.abrirMenu = (req, res) => {
    console.log('menuController - Rota / - Menu Acessando menu.html');
    res.sendFile(path.join(__dirname, '../../frontend/menu.html'));
};

exports.logout = (req, res) => {
    // Implementação da rota logout
    res.send('Rota logout');
};