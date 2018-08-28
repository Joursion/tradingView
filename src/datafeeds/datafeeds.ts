interface ISymbolInfo {

}

interface ISubscribeInfo{
    symbolInfo,
    resolution,
    subscribeUID,
    onRealtimeCallback,
    lastBarTime
}

const history = {};

/**
 * 在 datafeeds 实现 JSAPI，对原来的 TradingView 覆盖
 */
export default class datafeeds {
    private ctx: any;
    private socket: any;
    private subs: {
        [key: string]: ISubscribeInfo
    } = {};
    private requestPending: number = 0;

    constructor(ctx: any) {
        this.ctx = ctx;
    }

    public onReady(cb) {
        let configurationData = defaultConfigurationData;
        if (this.ctx.initConfig) {
            // configurationData
            Object.assign(configurationData, this.ctx.initConfig());
        }
        cb(configurationData);
    }

    public getBars(symbolInfo: ISymbolInfo, resolution: string, from: number, to: number, onHistoryCallback: Function,
        onErrorCallback, firstDataRequest) {
        // console.log('getBars')
        this.ctx.getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest);
    }

    public resolveSymbol(symbolName: string, onSymbolResolvedCallback: (symbolInfo: ISymbolInfo) => void,
        onResolveErrorCallback: (reason: any) => void) {
        let symbolInfo = defaultSymbol;
        if (this.ctx.initSymbol) {
            console.log('resolveSymbol.....', symbolInfo, this.ctx.initSymbol());
            Object.assign(symbolInfo, this.ctx.initSymbol());
        }
        onSymbolResolvedCallback(symbolInfo);
    }

    public subscribeBars(symbolInfo,  resolution,  onRealtimeCallback,  subscribeUID,  onResetCacheNeededCallback) {
        this._subscribeBars(symbolInfo,  resolution,  onRealtimeCallback,  subscribeUID,  onResetCacheNeededCallback);
    }

    public unsubscribeBars(symbolName) {
        this._unsubscribeBars(symbolName);
    }

    public updateData() {
        console.log('updateData...', this.requestPending, this.subs);
        if (this.requestPending) return;
        this.requestPending = 0
        for (let symbolName in this.subs) {
            this.requestPending++
            this.updatedateSubscribeData(symbolName);
        }
    }

    public updatedateSubscribeData (symbolName) {
        let subscribeInfo = this.subs[symbolName];
        const to = Math.floor(Date.now() / 1000);
        const from = to - this._periodLengthSeconds(subscribeInfo.resolution, 10);
        this.getBars(subscribeInfo.symbolInfo, subscribeInfo.resolution, from, to, (bars => {
            this._newDataReceived(symbolName, bars);
        }), () => {}, null);
        this.requestPending --;
    }

    // private function 

    private _newDataReceived (symbolName, bars) {
        let lastBar = bars[bars.length - 1];
        let subscribeInfo = this.subs[symbolName];
        if (!subscribeInfo.lastBarTime !== null && lastBar.time < subscribeInfo.lastBarTime) {
            return;
        }

        subscribeInfo.onRealtimeCallback(lastBar);
        subscribeInfo.lastBarTime = lastBar.time;

    }

    private _subscribeBars(symbolInfo,  resolution,  onRealtimeCallback,  subscribeUID,  onResetCacheNeededCallback) {
        // console.log('symbolInfo,  resolution,  onRealtimeCallback,  subscribeUID', symbolInfo,  resolution,  onRealtimeCallback,  subscribeUID);
        console.log(this.subs, symbolInfo.name);
        let newSub = {
            symbolInfo,
            resolution,
            subscribeUID,
            onRealtimeCallback,
            lastBarTime: null,
        }
        this.subs[symbolInfo.name] = newSub;
    }

    private _unsubscribeBars(subscribeUID) {
        delete this.subs[subscribeUID];
    }

    private _periodLengthSeconds(resolution, requiredPeriodsCount) {
        let daysCount = 0
        if (resolution === 'D' || resolution === '1D') {
            daysCount = requiredPeriodsCount
        } else if (resolution === 'M' || resolution === '1M') {
            daysCount = 31 * requiredPeriodsCount
        } else if (resolution === 'W' || resolution === '1W') {
            daysCount = 7 * requiredPeriodsCount
        } else {
            daysCount = requiredPeriodsCount * parseInt(resolution) / (24 * 60)
        }
        return daysCount * 24 * 60 * 60
    }
}

const defaultConfigurationData = {
    supports_search: true,
    supports_group_request: false,
    supported_resolutions: ['1', '5', '15', '30', '60', '1D', '2D', '3D', '1W', '1M'],
    supports_marks: true,
    supports_timescale_marks: true,
    supports_time: true
}

const defaultSymbol = {
    'name': 'BTCUSDT',
    'timezone': 'Asia/Shanghai',
    'minmov': 1,
    'minmov2': 0,
    'pointvalue': 1,
    'fractional': false,
    'session': '24x7',
    'has_intraday': true,
    'has_no_volume': false,
    'description': 'BTCUSDT',
    'pricescale': 1,
    'ticker': 'BTCUSDT',
    'supported_resolutions': ['1', '5', '15', '30', '60', '1D', '2D', '3D', '1W', '1M']
}