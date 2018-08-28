import * as React from 'react';
import './App.css';
import { TVChartContainer } from './components/TVChartContainer/index';

const coinTypeArr = [
	'btc', 'eos', 'usdt', 'cxp', 'eth', 'ht',	
]


class App extends React.Component {

	componentDidMount() {
		
	}

	// ETHBTC -> ETH/BTC or ethbtc
	transferHanlderSymbol () {
		let url = document.URL;
		console.log('component.url..', url);
		let urlArr = url.split('/');
		let symbol = urlArr[urlArr.length - 1];
		return (
			<TVChartContainer symbol={symbol} />
		)
	}

	render() {
		return (
			<div className={ 'App' }>
			{
				this.transferHanlderSymbol()
			}
			{/* <TVChartContainer/> */}
			</div>
		);
	}
}

export default App;

