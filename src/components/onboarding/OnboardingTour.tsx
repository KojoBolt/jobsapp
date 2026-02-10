import { useState, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Confetti from "@/components/accelerators/Confetti";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const steps: Step[] = [
  {
    target: "#sidebar-identity-vault",
    content: "Upload your resume and set your professional tone here. This is the \"Soul\" of your job search.",
    title: "Step 1: Map your DNA",
    disableBeacon: true,
    placement: "right",
  },
  {
    target: "#sidebar-strategy",
    content: "Tell us which industries, company sizes, and roles you are hunting for.",
    title: "Step 2: Set your Targets",
    placement: "right",
  },
  {
    target: "#sidebar-tracker",
    content: "This is where the magic happens. Track your manual leads or deploy our AI+Human team to apply for you.",
    title: "Step 3: Mission Control",
    placement: "right",
  },
  {
    target: "#add-job-button",
    content: "Add a manual link to track it, or use a credit to let us handle the professional submission for you!",
    title: "Ready to launch?",
    placement: "bottom",
  },
];

const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) => {
  const [dontShow, setDontShow] = useState(false);
  const navigate = useNavigate();

  const handleSkip = () => {
    if (dontShow) {
      localStorage.setItem("onboarding_tour_completed", "true");
    }
    closeProps.onClick(new MouseEvent("click") as any);
  };

  return (
    <div
      {...tooltipProps}
      className="rounded-xl border border-transparent bg-card p-5 shadow-2xl"
      style={{
        maxWidth: 340,
        borderImage: "linear-gradient(135deg, hsl(270 60% 55%), hsl(213 94% 55%)) 1",
        borderWidth: 2,
        borderStyle: "solid",
      }}
    >
      {step.title && (
        <h3
          className="mb-2 text-base font-bold text-foreground"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {step.title}
        </h3>
      )}
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{step.content as string}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="dont-show"
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(!!v)}
          />
          <label htmlFor="dont-show" className="text-[10px] text-muted-foreground cursor-pointer">
            Don't show again
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs">
            Skip Tour
          </Button>
          {isLastStep ? (
            <Button
              variant="hero"
              size="sm"
              onClick={() => {
                localStorage.setItem("onboarding_tour_completed", "true");
                navigate("/identity-vault");
              }}
              className="text-xs"
            >
              Go to Vault
            </Button>
          ) : (
            <Button {...primaryProps} variant="hero" size="sm" className="text-xs">
              Next ({index + 1}/{size})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [run, setRun] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const { user } = useAuth();

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      if (status === STATUS.FINISHED) {
        localStorage.setItem("onboarding_tour_completed", "true");
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          onComplete();
        }, 3000);
      } else if (status === STATUS.SKIPPED) {
        onComplete();
      }
    },
    [onComplete],
  );

  return (
    <>
      {showConfetti && <Confetti />}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        callback={handleCallback}
        tooltipComponent={CustomTooltip}
        styles={{
          options: {
            zIndex: 10000,
            overlayColor: "rgba(0, 0, 0, 0.6)",
          },
          overlay: {
            backdropFilter: "blur(2px)",
          },
        }}
        floaterProps={{
          styles: {
            arrow: { color: "hsl(var(--card))" },
          },
        }}
      />
    </>
  );
};

export default OnboardingTour;
