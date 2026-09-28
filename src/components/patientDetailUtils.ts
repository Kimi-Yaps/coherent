import type { PatientSessionEvent } from './PatientDetailSections';

export const buildPatientSummary = (event: PatientSessionEvent): string => {
  const { relapseSymptoms } = event;
  const symptomCount = [
    ...relapseSymptoms.emotionalSymptoms,
    ...relapseSymptoms.cognitiveSymptoms,
    ...relapseSymptoms.behavioralSymptoms,
    ...relapseSymptoms.physicalSymptoms,
  ].length;
  const triggerSummary = relapseSymptoms.identifiedTriggers.slice(0, 2).join(' and ').toLowerCase();
  const riskSummary = relapseSymptoms.riskLevel === 'stable'
    ? 'current relapse risk remains low'
    : `current relapse risk is ${relapseSymptoms.riskLevel} at ${relapseSymptoms.riskScore}%`;

  return `${event.patientName} is in ${event.primaryCondition.toLowerCase()} with ${event.recoveryDays} days of recovery progress. The record shows ${riskSummary} and is currently in ${relapseSymptoms.currentStage.toLowerCase()}. Key factors include ${triggerSummary}. Across the clinical record, ${symptomCount} signals were identified, supporting continued monitoring and a focused follow-up with ${event.assignedClinician}.`;
};
