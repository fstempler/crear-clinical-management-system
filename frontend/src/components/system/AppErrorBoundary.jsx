import { Component } from "react";
import { useLocation } from "react-router";
import { SystemStatePage } from "../../pages/system/SystemStatePage";
class Boundary extends Component {
  state = { failed: false, locationKey: this.props.locationKey };
  static getDerivedStateFromError() { return { failed: true }; }
  static getDerivedStateFromProps(props, state) { return props.locationKey !== state.locationKey ? { failed: false, locationKey: props.locationKey } : null; }
  componentDidCatch(error) { if (import.meta.env.DEV) console.error(error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <SystemStatePage code="500" title="Ocurrió un error inesperado" description="No pudimos mostrar esta página. Intentá nuevamente o volvé al inicio." retry={() => this.setState({ failed: false })} alert />;
  }
}
export function AppErrorBoundary({ children }) { const location = useLocation(); return <Boundary locationKey={location.key}>{children}</Boundary>; }
