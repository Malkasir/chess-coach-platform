import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('video-call')
export class VideoCall extends LitElement {
  @property() room = 'chess-default';

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
      // @ts-ignore
      new JitsiMeetExternalAPI(domain, options);
    };
    document.head.appendChild(script);
  }

  render() {
    return html`<div id="jitsi-container"></div>`;
  }
}
