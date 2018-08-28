import * as React from 'react';
import './index.css';
import {
	widget,
	ChartingLibraryWidgetOptions,
	LanguageCode,
	IChartingLibraryWidget,
} from '../../charting_library/charting_library.min';

import socket from '../../datafeeds/socket';
import datafeeds from '../../datafeeds/datafeeds';

export interface ChartContainerProps {
	symbol: ChartingLibraryWidgetOptions['symbol'];
	interval: ChartingLibraryWidgetOptions['interval'];

	// BEWARE: no trailing slash is expected in feed URL
	datafeedUrl: string;
	libraryPath: ChartingLibraryWidgetOptions['library_path'];
	chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
	chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
	clientId: ChartingLibraryWidgetOptions['client_id'];
	userId: ChartingLibraryWidgetOptions['user_id'];
	fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
	autosize: ChartingLibraryWidgetOptions['autosize'];
	studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
	containerId: ChartingLibraryWidgetOptions['container_id'];
}

export interface ChartContainerState {
}

const intervalMap = {
	'1': '1min',
	'5': '5min',
	'15': '15min',
	'30': '30min',
	'60': '60min',
	'1D': '1day',
	'1W': '1week',
	'1M': '1mon'
};

// second
const intervalTimeMap = {
	'1': 1 * 60,
	'5': 5 * 60,
	'15': 5 * 60,
	'30': 30 * 60,
	'60': 60 * 60,
	'1D': 24 * 60 * 60,
	'1W': 7 * 24 * 60 * 60,
	'1M': 30 * 24 * 60 * 60,
}

export class TVChartContainer extends React.PureComponent<Partial<ChartContainerProps>, ChartContainerState> {
	public static defaultProps: ChartContainerProps = {
		symbol: 'AAPL',
		interval: 'D',
		containerId: 'tv_chart_container',
		datafeedUrl: 'https://demo_feed.tradingview.com',
		libraryPath: '/charting_library/',
		chartsStorageUrl: 'https://saveload.tradingview.com',
		chartsStorageApiVersion: '1.1',
		clientId: 'tradingview.com',
		userId: 'public_user_id',
		fullscreen: false,
		autosize: true,
		studiesOverrides: {},
	};

	private tvWidget: IChartingLibraryWidget | null = null;
	private symbol: string;
	private interval: number | any;
	private socket: any;
	private cacheData: any = {};
	[key: string]: any;


	public componentDidMount(): void {

		this.symbol = this.getSymbolName().toLocaleUpperCase();
		this.interval = 5;
		// this.socket = new socket({});
		this.socket = new socket({});
		this.datafeeds = new datafeeds(this);

		// this.socket.doOpen();
		this.socket.onMessage('open', this.getKlineData);
		this.socket.onMessage('message', this.onMessage);

		const widgetOptions: ChartingLibraryWidgetOptions = {
			symbol: this.symbol,
			interval: this.interval,
			fullscreen: true,
			// preset: "mobile",
			container_id: this.props.containerId as ChartingLibraryWidgetOptions['container_id'],
			datafeed: this.datafeeds,
			library_path: this.props.libraryPath as string,
			timezone: 'Asia/Shanghai',
			locale: 'zh',
			debug: false,
			// favorites: {
			// 	intervals: ['1', '5', '15', '30', '60', '1D', '2D', '3D', '1W', '1M'],
			// 	chartTypes: ["Area", "Candles"]
			// },
			overrides: {
				"paneProperties.background": "#222222",
				"paneProperties.vertGridProperties.color": "#454545",
				"paneProperties.horzGridProperties.color": "#454545",
				"symbolWatermarkProperties.transparency": 90,
				"scalesProperties.textColor": "#AAA",
				'scalesProperties.fontSize': 13,
				'paneProperties.legendProperties.showLegend': false,
				"symbolWatermarkProperties.color": "rgba(0, 0, 0, 0.00)",
				"volumePaneSize": "large",
			},
			disabled_features: [
				'countdown',
				'timezone_menu',
				'header_symbol_search',
				'symbol_search_hot_key',
				'header_resolutions',
				'header_settings',
				'header_fullscreen_button',
				'header_chart_type',
				'header_indicators',
				'header_undo_redo',
				'header_compare',
				'header_screenshot',
				'control_bar',
				'header_saveload',
				"volume_force_overlay",
				"left_toolbar",
				'use_localstorage_for_settings',
				// 'adaptive_logo',
				'go_to_date',
				'timezone_menu',
				'timeframes_toolbar',
				'symbol_info',
			],
			enabled_features: [
				'header_widget',
			]
		};

		const tvWidget = new widget(widgetOptions);
		this.tvWidget = tvWidget;

		tvWidget.onChartReady(function () {
			tvWidget.chart().createStudy('MA Cross', false, false, [30, 120]);

			const _self = this;
			let chart = tvWidget.chart();
			const btnList = [
				{
					label: '1min',
					resolution: "1",
					chartType: 1
				},
				{

					label: '5min',
					resolution: "5",
				},
				{
					label: '15min',
					resolution: "15",
				},
				{
					label: '30min',
					resolution: "30",
				},
				{
					label: '1h',
					resolution: "60",
				},
				{
					class: 'selected',
					label: '日线',
					resolution: "1D"
				},
			];
			btnList.forEach(function (item) {
				let button = tvWidget.createButton({
					align: "left"
				});

				button.attr('class', "button " + item.class).attr("data-chart-type", item.chartType === undefined ? 8 : item.chartType).on('click', function (e) {
					let chartType = + button.attr("data-chart-type");
					if (chart.resolution() !== item.resolution) {
						chart.setResolution(item.resolution, () => { });
					}
					if (chart.chartType() !== chartType) {
						chart.setChartType(chartType);
					}
				})
				button.html(item.label);
				button.css('background-color', '#222222');
				button.css('color', 'white');
			});
		})

	}

	public componentWillUnmount(): void {
		if (this.tvWidget !== null) {
			this.tvWidget.remove();
			this.tvWidget = null;
		}
	}

	public render(): JSX.Element {
		return (
			<div
				id={this.props.containerId}
				className={'TVChartContainer'}
			/>
		);
	}

	/**
	 * 从 props 拿到 symbol
	 */
	getSymbolName () {
		console.log('getSymboleName..', this.props.symbol);
		let symbol = this.props.symbol || 'btcusdt';
		return symbol;
	}

	getKlineData = () => {
		let symbol = this.getSymbolName();
		let interval = this.interval;
		let to = Math.floor(Date.now() / 1000);
		console.log('getKline...????');
		this.sendMessage({
			"req": `market.${symbol}.kline.${intervalMap[interval]}`,
			id: Math.floor(Math.random() * 1000),
			to,
		})
	}

	initSymbol() {
		let symbolName = this.getSymbolName().toLocaleUpperCase();
		return {
			'name': symbolName,
			'timezone': 'Asia/Shanghai',
			'minmov': 1,
			'minmov2': 0,
			'pointvalue': 1,
			'fractional': false,
			'session': '24x7',
			'has_intraday': true,
			'has_no_volume': false,
			'description': symbolName,
			'pricescale': [1, 1, 100],
			'ticker': symbolName,
			'supported_resolutions': ['1', '5', '15', '30', '60', '1D', '1W', '1M']
		}
	}

	sendMessage(data: any) {
		if (this.socket.isConnected()) {
			this.socket.send(data)
		}
	}

	unSubscribe(interval: string) {
		let symbolName = this.getSymbolName();
		if (!intervalMap[interval]) {
			return;
		}
		this.sendMessage({
			id: Math.floor(Math.random() * 100000),
			unsub: `market.${symbolName}.kline.${intervalMap[interval]}`
		})
	}

	subscribe() {
		let symbolName = this.getSymbolName();
		let interval = this.interval;
		if (!intervalMap[interval]) {
			console.error('not in map..', interval);
			return;
		}
		console.log('subscribe...', interval);
		let symbol = `market.${symbolName}.kline.${intervalMap[interval]}`;
		this.sendMessage({
			id: Math.floor(Math.random() * 100000),
			sub: symbol
		})
	}

	onMessage = (data: any) => {
		if (data.ping) {
			this.sendMessage({
				pong: data.ping
			})
		}
		// 首次请求拿到的数据
		if (data.rep) {
			const list: any = []
			const klineKey = `${this.symbol}-${this.interval}`
			data.data.forEach((element: any) => {
				list.push({
					time: element.id * 1000,
					open: element.open,
					high: element.high,
					low: element.low,
					close: element.close,
					volume: element.vol,
				});
			});
			this.cacheData[klineKey] = list;
			this.lastTime = list[list.length - 1].time;
			this.subscribe();
		}
		// 订阅后，每条数据的推送
		if (data.tick) {
			console.log('onMessage tick..', data.tick);
			let tick = data.tick;
			let symbol = data.ch.split('.')[1];
			let thisSymbol = this.transferCoinType(this.symbol);
			console.log('symbol....', symbol, thisSymbol);
			if (thisSymbol !== symbol) {
				return;
			}
			this.datafeeds.updateData();
			let timeInterval = this.getTimeInterval();
			const klineKey = `${this.symbol}-${this.interval}`
			const barsData = {
				time: Math.floor(data.ts / timeInterval) * timeInterval,
				open: tick.open,
				high: tick.high,
				low: tick.low,
				close: tick.close,
				volume: tick.vol
			}
			// console.log('this.cacheData..', barsData, this.lastTime);
			if (barsData.time >= this.lastTime && this.cacheData[klineKey] && this.cacheData[klineKey].length) {
				this.cacheData[klineKey][this.cacheData[klineKey].length - 1] = barsData;
				// this.lastTime = barsData.time;
			}
		}
	}

	//onHistoryCallback仅一次调用，接收所有的请求历史
	getBars(symbolInfo: any, resolution: any, from: any, to: any, onHistoryCallback: any) {
		// console.log(' >> :', from, to)
		// console.log('i')
		if (this.interval != resolution) {
			console.warn('change interval/....', this.interval, resolution);
			this.unSubscribe(this.interval);
			this.interval = resolution;
			// this.subscribe();
			this.getKlineData();
		}
		const klineKey = `${this.symbol}-${this.interval}`;

		if (this.cacheData[klineKey] && this.cacheData[klineKey].length) {
			this.isLoading = false
			const newBars: any = []
			let length = this.cacheData[klineKey].length;
			// console.log('limitDate......', new Date(from * 1000), new Date(to * 1000))
			this.cacheData[klineKey].forEach((item: any, index: number) => {
				if (item.time >= from * 1000 && item.time <= to * 1000) {
					newBars.push(item)
				}
			});
			console.log('newBars....', newBars);
			if (newBars.length) {	
				onHistoryCallback(newBars, {noData: true});
			}
		} else {
			console.warn('getBar later??');
			// console.log(this.cacheData);
			const self = this
			this.getBarTimer = setTimeout(function () {
				self.getBars(symbolInfo, resolution, from, to, onHistoryCallback)
			}, 500)
		}
	}

	getTimeInterval(): number{
		// this.symbol;
		let time = intervalTimeMap[this.interval];
		console.log('getTimeInterval...', this.interval, time);
		if (time) {
			return time * 1000;
		}
		return 5 * 60 * 1000;
	}

	/**
	 * ETH/BTC -> ethbtc
	 * @param symbol 
	 */
	transferCoinType(symbol: string): string {
		try {
			let res = symbol.split('/').join('').toLocaleLowerCase();
			return res;
		} catch (e) {
			return '';
		}
	}

}
