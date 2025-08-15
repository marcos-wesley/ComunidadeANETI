// Audio utility functions for notifications and messages

class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;

  constructor() {
    // Initialize audio context on first user interaction
    this.setupAudioContext();
  }

  private setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio not supported in this browser:', error);
      this.isEnabled = false;
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext && this.isEnabled) {
      this.setupAudioContext();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }
  }

  // Generate notification sound
  async playNotificationSound() {
    if (!this.isEnabled || !this.audioContext) return;
    
    await this.ensureAudioContext();
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Notification sound: gentle bell-like tone
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Generate message sent sound
  async playMessageSentSound() {
    if (!this.isEnabled || !this.audioContext) return;
    
    await this.ensureAudioContext();
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Message sent: quick ascending chirp
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch (error) {
      console.warn('Could not play message sent sound:', error);
    }
  }

  // Generate message received sound
  async playMessageReceivedSound() {
    if (!this.isEnabled || !this.audioContext) return;
    
    await this.ensureAudioContext();
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Message received: gentle descending tone
      oscillator.frequency.setValueAtTime(550, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(350, this.audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.25);
    } catch (error) {
      console.warn('Could not play message received sound:', error);
    }
  }

  // Enable/disable audio
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isAudioEnabled() {
    return this.isEnabled;
  }
}

export const audioManager = new AudioManager();

// Helper functions to play sounds with user interaction check
export const playNotificationSound = () => audioManager.playNotificationSound();
export const playMessageSentSound = () => audioManager.playMessageSentSound();
export const playMessageReceivedSound = () => audioManager.playMessageReceivedSound();