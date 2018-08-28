const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
// const ReactDOMServer = require('react-dom/server');
// const TradingView = require('./src/components/TVChartContainer/index');


const app = express();

app.use(compression());

function handlerRender(req, res) {
    // console.log('req...', req);
    // const html = ReactDOMServer.renderToString(<TradingView/>);

    // fs.readFile('./index.html', 'utf8', (err, data) => {
    //     if (err) throw err;

    //     const document = data.replace(/<div id='root'><\/div>/, `<div id="app">${html}</div>`);
    //     res.send(document);
    // })

    res.sendFile('./index.html', {root: path.join(__dirname, 'build')});
}

app.use('/build', express.static(path.join(__dirname, 'build')));

app.get('*', handlerRender);

app.listen(9088);