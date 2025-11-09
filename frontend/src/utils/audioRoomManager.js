// Simple Audio Room Manager using Web Audio API and WebRTC
class AudioRoomManager {
  constructor(socket, roomId, userId) {
    this.socket = socket;
    this.roomId = roomId;
    this.userId = userId;
    this.localStream = null;
    this.peerConnections = new Map();
    this.isMuted = true;
    this.isConnected = false;
  }

  async initialize() {
    try {
      // Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Mute by default
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      
      this.isConnected = true;
      console.log('✅ Audio room initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio room:', error);
      throw error;
    }
  }

  setMuted(muted) {
    if (!this.localStream) return;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
    
    this.isMuted = muted;
    console.log(`🎤 Microphone ${muted ? 'muted' : 'unmuted'}`);
  }

  async cleanup() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    
    this.isConnected = false;
    console.log('🔇 Audio room cleanup complete');
  }

  getMutedState() {
    return this.isMuted;
  }

  getConnectionState() {
    return this.isConnected;
  }
}

export default AudioRoomManager;
