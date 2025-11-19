// Simple Audio Room Manager using Web Audio API
class AudioRoomManager {
  constructor(socket, roomId, userId) {
    this.socket = socket;
    this.roomId = roomId;
    this.userId = userId;
    this.localStream = null;
    this.peerConnections = new Map();
    this.isMuted = true;
    this.isConnected = false;
    this.microphoneReady = false;
  }

  async initialize() {
    try {
      // Don't request microphone immediately, just mark as ready to use
      this.isConnected = true;
      console.log('✅ Audio room initialized (mic will be requested on unmute)');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio room:', error);
      throw error;
    }
  }

  async requestMicrophone() {
    if (this.localStream) {
      return true; // Already have access
    }

    try {
      console.log('🎤 Requesting microphone access...');
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Start muted
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      
      this.microphoneReady = true;
      console.log('✅ Microphone access granted');
      return true;
    } catch (error) {
      console.error('Failed to get microphone access:', error);
      this.microphoneReady = false;
      throw error;
    }
  }

  async setMuted(muted) {
    // If trying to unmute and don't have microphone yet, request it
    if (!muted && !this.localStream) {
      await this.requestMicrophone();
    }

    if (!this.localStream) {
      console.warn('No microphone stream available');
      return;
    }
    
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
    this.microphoneReady = false;
    console.log('🔇 Audio room cleanup complete');
  }

  getMutedState() {
    return this.isMuted;
  }

  getConnectionState() {
    return this.isConnected;
  }

  hasMicrophone() {
    return this.microphoneReady;
  }
}

export default AudioRoomManager;
