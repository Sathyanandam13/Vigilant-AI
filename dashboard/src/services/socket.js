import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (this.socket) return;

        this.socket = io(SOCKET_URL);

        this.socket.on("connect", () => {
            console.log("Connected to SOC real-time stream");
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from SOC stream");
        });
    }

    subscribeToAlerts(callback) {
        if (!this.socket) this.connect();
        this.socket.on("new-alert", callback);
    }

    subscribeToLogs(callback) {
        if (!this.socket) this.connect();
        this.socket.on("new-log", callback);
    }

    subscribeToIncidents(callback) {
        if (!this.socket) this.connect();
        this.socket.on("new-incident", callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
