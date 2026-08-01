import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Khalad aan la qaban ayaa dhacay app-ka:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 14, fontFamily: 'Inter, sans-serif', color: '#0B1F2B', textAlign: 'center', padding: 24,
        }}>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 20 }}>Wax baa qaldamay</h2>
          <p style={{ color: '#64748A', maxWidth: 380 }}>
            Khalad lama filaan ah ayaa dhacay. Fadlan bogga dib u shub.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '11px 22px', borderRadius: 10, border: 'none', background: '#0B1F2B',
              color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
            }}
          >
            Dib u Shub Bogga
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
