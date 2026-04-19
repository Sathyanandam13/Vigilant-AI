import axios from "axios";

const API = "http://localhost:5000";

// Simple token storage simulation
let authToken = localStorage.getItem("soc_token");

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${authToken}` }
});

class ApiService {
  async login(username, password) {
    const response = await axios.post(`${API}/auth/login`, { username, password });
    authToken = response.data.token;
    localStorage.setItem("soc_token", authToken);
    return response.data;
  }

  async getAlerts() {
    const response = await axios.get(`${API}/alerts`, getHeaders());
    return response.data;
  }


  async getAlertById(id) {
    const response = await axios.get(`${API}/alerts/${id}`, getHeaders());
    return response.data;
  }

  async getIncidents() {
    const response = await axios.get(`${API}/incidents`, getHeaders());
    return response.data;
  }

  async getLogs(query = "") {
    const response = await axios.get(`${API}/logs`, { ...getHeaders(), params: { query } });
    return response.data;
  }

  async updateAlertStatus(id, newStatus) {
    const response = await axios.patch(`${API}/alerts/${id}`, { status: newStatus }, getHeaders());
    return response.data;
  }

  async assignAlert(id, assignee) {
    const response = await axios.patch(`${API}/alerts/${id}`, { assignee }, getHeaders());
    return response.data;
  }

  async addNote(id, note) {
    // Note system moved to external plugin in future
    console.warn("Notes API not fully persisted to backend yet.");
    const response = await axios.get(`${API}/alerts/${id}`, getHeaders());
    return response.data;
  }

  async getIncident(id) {
    const response = await axios.get(`${API}/incidents/${id}`, getHeaders());
    return response.data;
  }

  async patchIncident(id, data) {
    const response = await axios.patch(`${API}/incidents/${id}`, data, getHeaders());
    return response.data;
  }

  async getIpInfo(ip) {
    const response = await axios.get(`${API}/ips/${ip}`, getHeaders());
    return response.data;
  }

}

export const liveAPI = new ApiService();
