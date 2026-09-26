import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { SystemStatePage } from "./SystemStatePage";
export function OfflinePage() { const online = useNetworkStatus(); return <SystemStatePage code="" title={online ? "Conexión restablecida" : "Sin conexión"} description={online ? "Ya podés intentar acceder nuevamente." : "Revisá tu conexión. Es posible que algunas funciones no estén disponibles."} retry={() => window.location.reload()} />; }
