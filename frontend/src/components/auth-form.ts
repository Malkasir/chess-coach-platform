import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AuthService, LoginRequest, RegisterRequest } from '../services/auth-service.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/button/filled-button.js';
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/radio/radio.js';

@customElement('auth-form')
export class AuthForm extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 400px;
      margin: 2rem auto;
    }
    .auth-container {
      padding: 2rem;
      border-radius: 20px;
      background-color: var(--md-sys-color-surface-container-high);
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .name-row {
      display: flex;
      gap: 1rem;
    }
    .name-row md-filled-text-field {
      flex: 1;
    }
    .error-message {
      color: var(--md-sys-color-error);
      margin-bottom: 1rem;
    }
    .success-message {
      color: var(--md-sys-color-primary);
      margin-bottom: 1rem;
    }
    md-tabs {
      margin-bottom: 2rem;
    }
  `;

  @property({ type: Object }) authService!: AuthService;
  @state() private mode: 'login' | 'signup' = 'login';
  @state() private loading = false;
  @state() private error = '';
  @state() private success = '';
  @state() private formData = {
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  };

  private switchMode(e: CustomEvent) {
    const newMode = (e.target as any).activeTabIndex === 0 ? 'login' : 'signup';
    this.mode = newMode;
    this.error = '';
    this.success = '';
    this.formData = {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    };
  }

  private updateForm(field: string, value: string) {
    this.formData = { ...this.formData, [field]: value };
  }


  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.loading) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    try {
      if (this.mode === 'login') {
        const loginRequest: LoginRequest = {
          email: this.formData.email,
          password: this.formData.password
        };
        await this.authService.login(loginRequest);
        this.success = 'Login successful! Redirecting...';
        this.dispatchEvent(new CustomEvent('auth-success', {
          detail: { user: this.authService.getCurrentUser() },
          bubbles: true
        }));
      } else {
        const registerRequest: RegisterRequest = {
          email: this.formData.email,
          password: this.formData.password,
          firstName: this.formData.firstName,
          lastName: this.formData.lastName
        };
        await this.authService.register(registerRequest);
        this.success = 'Registration successful! Welcome!';
        this.dispatchEvent(new CustomEvent('auth-success', {
          detail: { user: this.authService.getCurrentUser() },
          bubbles: true
        }));
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'An error occurred';
    } finally {
      this.loading = false;
    }
  }

  private isFormValid(): boolean {
    const { email, password, firstName, lastName } = this.formData;
    if (this.mode === 'login') {
      return email.length > 0 && password.length > 0;
    } else {
      return email.length > 0 && password.length >= 6 && firstName.length > 0 && lastName.length > 0;
    }
  }

  render() {
    return html`
      <div class="auth-container">
        <md-tabs @change=${this.switchMode}>
          <md-primary-tab>Login</md-primary-tab>
          <md-primary-tab>Sign Up</md-primary-tab>
        </md-tabs>

        ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
        ${this.success ? html`<div class="success-message">${this.success}</div>` : ''}

        <form @submit=${this.handleSubmit}>
          ${this.mode === 'signup' ? html`
            <div class="name-row">
              <md-filled-text-field
                label="First Name"
                .value=${this.formData.firstName}
                @input=${(e: any) => this.updateForm('firstName', e.target.value)}
                required
              ></md-filled-text-field>
              <md-filled-text-field
                label="Last Name"
                .value=${this.formData.lastName}
                @input=${(e: any) => this.updateForm('lastName', e.target.value)}
                required
              ></md-filled-text-field>
            </div>
          ` : ''}

          <div class="form-group">
            <md-filled-text-field
              label="Email"
              type="email"
              .value=${this.formData.email}
              @input=${(e: any) => this.updateForm('email', e.target.value)}
              required
            ></md-filled-text-field>
          </div>

          <div class="form-group">
            <md-filled-text-field
              label="Password"
              type="password"
              .value=${this.formData.password}
              @input=${(e: any) => this.updateForm('password', e.target.value)}
              minlength="${this.mode === 'signup' ? '6' : '1'}"
              required
            ></md-filled-text-field>
          </div>


          <md-filled-button type="submit" ?disabled=${!this.isFormValid() || this.loading}>
            ${this.loading ? 'Loading...' : this.mode === 'login' ? 'Login' : 'Create Account'}
          </md-filled-button>
        </form>
      </div>
    `;
  }
}
