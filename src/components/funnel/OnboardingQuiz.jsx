import { useNavigate, useSearchParams } from 'react-router-dom';
import { QUIZ_STEPS } from './quizConfig';
import { useFunnel } from './FunnelContext';
import StepIndicator from './components/StepIndicator';
import QuestionStep from './components/QuestionStep';
import PersonalizeStep from './components/PersonalizeStep';
import SocialProofSlide from './components/SocialProofSlide';
import RealityCheckSlide from './components/RealityCheckSlide';
import LoadingSlide from './components/LoadingSlide';

export default function OnboardingQuiz() {
  const { answers, setAnswer } = useFunnel();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const stepIndex = Math.min(Math.max(Number(searchParams.get('step') || 0), 0), QUIZ_STEPS.length - 1);
  const step = QUIZ_STEPS[stepIndex];

  const goToStep = (index) => setSearchParams({ step: String(index) });
  const handleNext = () => (stepIndex === QUIZ_STEPS.length - 1 ? handleFunnelComplete() : goToStep(stepIndex + 1));
  const handleBack = () => stepIndex > 0 && goToStep(stepIndex - 1);

  const handleFunnelComplete = () => {
    const track = answers.experienceLevel?.track || 'professional';
    navigate(track === 'intern' ? '/start/checkout/intern' : '/start/checkout', { state: { answers } });
  };

  return (
    <div className="relative bg-[#0A0A0A] min-h-screen overflow-hidden">
      {/* Ambient glow — subtle, single accent color, no neon */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full bg-blue-600/5 blur-[120px]" />

      <div className="relative">
        {step.type !== 'loading' && (
          <StepIndicator currentStage={step.stage} onBack={handleBack} isFirst={stepIndex === 0} />
        )}
        {renderStep()}
      </div>
    </div>
  );

  function renderStep() {
    switch (step.type) {
      case 'single':
      case 'multi':
        return <QuestionStep key={step.id} step={step} value={answers[step.id]} onAnswer={setAnswer} onNext={handleNext} />;
      case 'form':
        return <PersonalizeStep key={step.id} step={step} value={answers[step.id]} onAnswer={setAnswer} onNext={handleNext} />;
      case 'social-proof':
        return <SocialProofSlide key={step.id} step={step} onNext={handleNext} />;
      case 'reality-check':
        return <RealityCheckSlide key={step.id} step={step} answers={answers} onNext={handleNext} />;
      case 'loading':
        return (
          <LoadingSlide
            key={step.id}
            firstName={answers.personalize?.firstName || 'there'}
            onComplete={handleFunnelComplete}
          />
        );
      default:
        return null;
    }
  }
}
