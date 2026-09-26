import { SystemStatePage } from "./SystemStatePage";
export function SystemErrorPage({ onRetry = () => window.location.reload() }) { return <SystemStatePage code="500" title="Ocurrió un error inesperado" description="No pudimos mostrar esta página. Intentá nuevamente o volvé al inicio." retry={onRetry} alert />; }
