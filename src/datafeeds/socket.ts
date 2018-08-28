// import io from 'socket'
const pako = require('pako');
const defaultWSURL = process.env.WSURL || 'wss://api.huobi.pro/ws';

interface ISocket {
    url?: string;
    heartbeat?: number;
}

interface IHandleMap {
    [key: string]: Function
}

export default class socket {

    private url: string;
    private heartbeat: number;
    private heartbeatId: any;
    private handleMap: IHandleMap;
    private connected: boolean;
    private socket: WebSocket;

    constructor(options: ISocket) {
        this.url = options.url || defaultWSURL;
        this.heartbeat = options.heartbeat || 0;
        this.handleMap = {};
        this.connected = false;

        const websocket = new WebSocket(this.url);
        websocket.binaryType = 'arraybuffer'
        websocket.onclose = (e: CloseEvent) => this._onClose(e);
        websocket.onmessage = (e: MessageEvent) => this._onMessage(e);
        websocket.onerror = (e: Event) => this._onError(e);
        websocket.onopen = (e: Event) => this._onOpen(e);
        // this.web
        this.socket = websocket;
    }

    /** */
    public onMessage(subName: string, cb: (data: any) => void): void {
        if (!this.handleMap[subName]) {
            this.handleMap[subName] = cb;
        }
    }

    public send(data: any) {
        this.socket.send(JSON.stringify(data))
    }

    public isConnected(): boolean {
        return this.connected;
    }

    private handleMessage(subName: string, data: any) {
        let cb = this.handleMap[subName];
        cb && cb(data);
    }

    private _onOpen(e: Event): void {
        this.connected = true;
        this.handleMessage('open', {});
    }

    private _onClose(e: CloseEvent): void {
        this.closeHeartbeat();
        this.connected = false;
    }

    private _onMessage(msg: MessageEvent): void {
        try {
            let message = pako.inflate(msg.data, {
                to: 'string'
            });
            let data = JSON.parse(message);
            this.handleMessage('message', data);
        } catch (e) {
            console.error('parse message error: ', e);
        }
    }

    private _onError(e: Event): void {
        this.closeHeartbeat();
        this.connected = false;
        console.error('websocket on error', e);
    }

    private initHeartbeat() {
        let heartbeat = this.heartbeat;
        if (heartbeat && !this.heartbeatId) {
            this.heartbeatId = setInterval(() => {

            }, heartbeat * 1000);
        }
    }

    private closeHeartbeat() {
        let heartbeatId = this.heartbeatId;
        heartbeatId && clearInterval(heartbeatId);
    }
}
