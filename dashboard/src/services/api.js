import axios from "axios";

const API = "http://localhost:5000";

class ApiService {
  async getAlerts() {
    const response = await axios.get(`${API}/alerts`);
    return response.data;
  }

  async getAlertById(id) {
    const response = await axios.get(`${API}/alerts/${id}`);
    return response.data;
  }

  async getIncidents() {
    const response = await axios.get(`${API}/incidents`);
    return response.data;
  }

  async getLogs(query = "") {
    const response = await axios.get(`${API}/logs`, { params: { query } });
    return response.data;
  }

  async updateAlertStatus(id, newStatus) {
    const response = await axios.patch(`${API}/alerts/${id}`, { status: newStatus });
    return response.data;
  }

  async assignAlert(id, assignee) {
    const response = await axios.patch(`${API}/alerts/${id}`, { assignee });
    return response.data;
  }

  async addNote(id, note) {
    // Note system moved to external plugin in future, using placeholder array locally for UI sake since our mock schema previously assumed notes Array and we didn't add it to mongoose schema explicitly yet.
    // For now, this just simulates returning the alert.
    console.warn("Notes API not fully persisted to backend yet.");
    const response = await axios.get(`${API}/alerts/${id}`);
    return response.data;
  }
}

export const liveAPI = new ApiService();
