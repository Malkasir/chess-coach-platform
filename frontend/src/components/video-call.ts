import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('video-call')
export class VideoCall extends LitElement {
  /** Room name passed to the Jitsi iframe */
  @property({ type: String }) room = 'chess-default';
  
  /** Player display name for the video call */
  @property({ type: String }) playerName = 'Chess Player';

  private api: any = null;

  static styles = css`
    #jitsi-container {
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
  `;

  firstUpdated() {
    const domain = 'meet.jit.si';
    const options = {
      roomName: this.room,
      width: '100%',
      height: '100%',
      parentNode: this.renderRoot.querySelector('#jitsi-container'),
      userInfo: {
        displayName: this.playerName
      },
      configOverwrite: {
        startWithAudioMuted: true,        // Better UX - users can unmute
        prejoinPageEnabled: false         // Skip prejoin page for smoother experience
      }
    };

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.onload = () => {
      // @ts-ignore – Jitsi attaches itself to window
      this.api = new JitsiMeetExternalAPI(domain, options);
    };
    document.head.appendChild(script);
  }

  disconnect() {
    if (this.api) {
      this.api.dispose();
      this.api = null;
    }
    const container = this.renderRoot.querySelector('#jitsi-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  render() {
    return html`<div id="jitsi-container"></div>`;
  }
}
