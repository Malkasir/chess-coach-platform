import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ThemeService, ThemeConfiguration } from '../services/theme-service.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/button/filled-button.js';

@customElement('theme-selector')
export class ThemeSelector extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
    .controls-row {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .theme-selector-group {
      flex: 1;
      min-width: 150px;
    }
    md-filled-select {
      width: 100%;
    }
  `;

  @property({ type: Object }) themeService!: ThemeService;
  @state() private config: ThemeConfiguration = {
    pieceTheme: 'cburnett',
    boardTheme: 'classic-wood',
    animationTheme: 'smooth',
    appTheme: 'gradient-purple'
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.themeService) {
      this.config = this.themeService.getConfiguration();
      this.themeService.addThemeChangeListener(this.handleThemeChange.bind(this));
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.themeService) {
      this.themeService.removeThemeChangeListener(this.handleThemeChange.bind(this));
    }
  }

  private handleThemeChange(newConfig: ThemeConfiguration) {
    this.config = newConfig;
  }

  private selectPieceTheme(e: any) {
    this.themeService.updateConfiguration({ pieceTheme: e.target.value });
  }

  private selectBoardTheme(e: any) {
    this.themeService.updateConfiguration({ boardTheme: e.target.value });
  }

  private selectAnimationTheme(e: any) {
    this.themeService.updateConfiguration({ animationTheme: e.target.value });
  }

  private selectAppTheme(e: any) {
    this.themeService.updateConfiguration({ appTheme: e.target.value });
  }

  private resetThemes() {
    this.themeService.resetToDefaults();
  }

  render() {
    return html`
      <div class="controls-row">
        <div class="theme-selector-group">
          <md-filled-select label="Pieces" .value=${this.config.pieceTheme} @change=${this.selectPieceTheme}>
            ${ThemeService.PIECE_THEMES.map(theme => html`
              <md-select-option value=${theme.id}>${theme.name}</md-select-option>
            `)}
          </md-filled-select>
        </div>
        <div class="theme-selector-group">
          <md-filled-select label="Board" .value=${this.config.boardTheme} @change=${this.selectBoardTheme}>
            ${ThemeService.BOARD_THEMES.map(theme => html`
              <md-select-option value=${theme.id}>${theme.name}</md-select-option>
            `)}
          </md-filled-select>
        </div>
        <div class="theme-selector-group">
          <md-filled-select label="Animation" .value=${this.config.animationTheme} @change=${this.selectAnimationTheme}>
            ${ThemeService.ANIMATION_THEMES.map(theme => html`
              <md-select-option value=${theme.id}>${theme.name}</md-select-option>
            `)}
          </md-filled-select>
        </div>
        <div class="theme-selector-group">
          <md-filled-select label="App" .value=${this.config.appTheme} @change=${this.selectAppTheme}>
            ${ThemeService.APP_THEMES.map(theme => html`
              <md-select-option value=${theme.id}>${theme.name}</md-select-option>
            `)}
          </md-filled-select>
        </div>
      </div>
      <div class="controls-row">
        <md-filled-button @click=${this.resetThemes}>Reset to Defaults</md-filled-button>
      </div>
    `;
  }
}
