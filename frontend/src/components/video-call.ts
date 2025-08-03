import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('video-call')
export class VideoCall extends LitElement {
  /** Room name passed to the Jitsi iframe */
  @property({ type: String }) room = 'chess-default';

  private api: any = null;

  static styles = css`
    #jitsi-container {
      width: 100%;
      height: 600px;
    }
  `;

  firstUpdated() {
    const domain = 'meet.jit.si';
    const options = {
      roomName: this.room,
      width: '100%',
      height: 600,
      parentNode: this.renderRoot.querySelector('#jitsi-container'),
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
