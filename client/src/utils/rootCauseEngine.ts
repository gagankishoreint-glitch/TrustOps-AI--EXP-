export type TrustScores = {
    operational: number;
    security: number;
    behavior: number;
    performance: number;
};
  
export function getRootCauseChain(subScores: TrustScores): string[] {
    // Find the key with the lowest score
    const entries = Object.entries(subScores) as [keyof TrustScores, number][];
    const lowest = entries.reduce((prev, curr) => curr[1] < prev[1] ? curr : prev);
    
    const lowestKey = lowest[0];
    
    switch (lowestKey) {
        case 'performance':
            return ['Network Congestion', 'Packet Loss', 'Buffer Bloat', 'UI Latency'];
        case 'behavior':
            return ['Unusual Login Event', 'API Request Spike', 'Rate Limit Hit', 'Session Desync'];
        case 'security':
            return ['Unauthorized IP Hit', 'Firewall Rule Bypass', 'Admin Override Attempt', 'Payload Interception'];
        case 'operational':
        default:
            return ['Sub-system Crash', 'Display Controller Desync', 'Memory Leak', 'Thermal Throttle Limit'];
    }
}
