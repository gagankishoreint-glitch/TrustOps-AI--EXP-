import { TrustScores } from './rootCauseEngine';

/**
 * Calculates the mathematically rigorous joint probability of a systemic failure
 * treating all sub-scores as independent survival variables.
 */
export function calculateJointProbability(scores: TrustScores): number {
    const pOps = scores.operational / 100;
    const pSec = scores.security / 100;
    const pBehav = scores.behavior / 100;
    const pPerf = scores.performance / 100;

    // Probability of systemic survival
    const jointSurvival = pOps * pSec * pBehav * pPerf;
    
    // Probability of Failure
    return 1 - jointSurvival;
}

/**
 * Contextual scaling interceptor. If latency is severely high but local frequency is perfectly 
 * stable, it overwrites the typical 'Performance Risk' -> 'Critical' to a 'Background Sync'.
 */
export function contextualScaleRisk(
    baseType: string, 
    latency: number, 
    frequency: number,
    baseRiskLevel: 'Stable' | 'Caution' | 'Critical'
): { scaledType: string, scaledRiskLevel: 'Stable' | 'Caution' | 'Critical', evidenceOverride?: string } {
    
    // Contextual Override: High Network overhead but no physical display stress
    if (latency > 1500 && frequency >= 450) {
        return {
            scaledType: 'Background Sync',
            scaledRiskLevel: 'Stable', // Overwrite to low risk
            evidenceOverride: `Latency spiked to ${latency}ms, but display output held stable at ${frequency}Hz. Identifies as non-destructive background syncing overhead.`
        };
    }

    return { scaledType: baseType, scaledRiskLevel: baseRiskLevel };
}
