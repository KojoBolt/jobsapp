import { useNavigate, useSearchParams } from 'react-router-dom';
import { QUIZ_STEPS } from './quizConfig';
import { useFunnel } from './FunnelContext';
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

  // Every step shares the same shell props: the layout owns the Back / Next
  // footer now, so each slide only supplies its own body.
  const shellProps = {
    onNext: handleNext,
    onBack: handleBack,
    isFirst: stepIndex === 0,
    stepNumber: stepIndex + 1,
  };

  // FunnelLayout owns the full-page shell (dark backdrop + rounded app card),
  // so each slide renders straight into the route.
  return renderStep();

  function renderStep() {
    switch (step.type) {
      case 'single':
      case 'multi':
        return <QuestionStep key={step.id} step={step} value={answers[step.id]} onAnswer={setAnswer} {...shellProps} />;
      case 'form':
        return <PersonalizeStep key={step.id} step={step} value={answers[step.id]} onAnswer={setAnswer} {...shellProps} />;
      case 'social-proof':
        return <SocialProofSlide key={step.id} step={step} {...shellProps} />;
      case 'reality-check':
        return <RealityCheckSlide key={step.id} step={step} answers={answers} {...shellProps} />;
      case 'loading':
        return (
          <LoadingSlide
            key={step.id}
            stage={step.stage}
            firstName={answers.personalize?.firstName || 'there'}
            onComplete={handleFunnelComplete}
          />
        );
      default:
        return null;
    }
  }
}
