import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import AddressForm from './AddressForm';
import Info from './Info';
import InfoMobile from './InfoMobile';
import PaymentForm from './PaymentForm';
import Review from './Review';
import logo from '../../assets/images/job-logo.png';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';
import Loader from '../loader/Loader';

const steps = ['Billing information', 'Payment details', 'Review your order'];

// Key used to save/load billing info from localStorage
const BILLING_STORAGE_KEY = 'jobapp_saved_billing';

type UserPlan = 'free' | 'starter' | 'pro';
type PurchaseType = 'activation' | 'topup';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: UserPlan;
  credits_remaining: number | null;
  total_credits_earned: number | null;
};

type CheckoutState = {
  selectedPlan?: UserPlan;
  purchaseType?: PurchaseType;
};

type BillingData = {
  firstName: string;
  lastName: string;
  email: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  saveAddress: boolean;
};

const EMPTY_BILLING: BillingData = {
  firstName: '',
  lastName: '',
  email: '',
  address1: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  saveAddress: false,
};

const PACKAGE_CONFIG = {
  activation: {
    label: 'Basic Activation',
    credits: 200,
    priceUsd: 99.00,
    planToStore: 'free' as UserPlan,
  },
  starter: {
    label: 'Starter Top-up',
    credits: 100,
    priceUsd: 29.00,
    planToStore: 'starter' as UserPlan,
  },
  pro: {
    label: 'Pro Top-up',
    credits: 200,
    priceUsd: 400.00,
    planToStore: 'pro' as UserPlan,
  },
};

//  Load saved billing from localStorage, returns null if nothing saved
const loadSavedBilling = (): BillingData | null => {
  try {
    const raw = localStorage.getItem(BILLING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BillingData;
    // Always restore saveAddress as true so the checkbox reflects saved state
    return { ...parsed, saveAddress: true };
  } catch {
    return null;
  }
};

// Save billing fields to localStorage (exclude saveAddress flag itself)
const saveBillingToStorage = (data: BillingData) => {
  try {
    localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable in some browsers — fail silently
  }
};

//  Remove saved billing from localStorage
const clearSavedBilling = () => {
  try {
    localStorage.removeItem(BILLING_STORAGE_KEY);
  } catch {
    // fail silently
  }
};

export default function Checkout(props: { disableCustomTheme?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as CheckoutState;

  const [activeStep, setActiveStep] = React.useState(0);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'paystack' | 'cryptomus'>('paystack');

  //  Initialize billing data from localStorage if a saved address exists,
  // otherwise start with empty fields. This runs once on component creation
  // so the form is pre-filled before the user even sees it.
  const [billingData, setBillingData] = React.useState<BillingData>(
    () => loadSavedBilling() ?? EMPTY_BILLING
  );

  const [billingErrors, setBillingErrors] = React.useState<Record<string, string>>({});

  //  Whenever billingData changes, decide whether to save or clear storage.
  // - If saveAddress is checked → persist the latest values immediately
  // - If saveAddress is unchecked → wipe any previously saved data
  React.useEffect(() => {
    if (billingData.saveAddress) {
      saveBillingToStorage(billingData);
    } else {
      clearSavedBilling();
    }
  }, [billingData]);

  const handleNext = () => {
    if (activeStep === 0) {
      const isValid = validateBillingStep();
      if (!isValid) return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  React.useEffect(() => {
    setProfile(null);
    setLoadingProfile(true);
    setProfileError(null);
    setActiveStep(0);
    setBillingErrors({});
    // Don't reset billingData here — we want saved address to persist
    // across navigations. Only re-load from storage on each visit.
    setBillingData(loadSavedBilling() ?? EMPTY_BILLING);

    const fetchProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session?.user) {
          navigate('/login', { state: { returnTo: '/checkout' } });
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, plan, credits_remaining, total_credits_earned')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Profile not found.');

        setProfile(data as Profile);
      } catch (error) {
        console.error('fetchProfile error:', error);
        setProfileError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [navigate, location.key]);

  const purchaseType: PurchaseType =
    state.purchaseType || (profile?.plan === 'free' ? 'activation' : 'topup');

  const selectedPackage =
    purchaseType === 'activation'
      ? PACKAGE_CONFIG.activation
      : state.selectedPlan === 'pro'
      ? PACKAGE_CONFIG.pro
      : PACKAGE_CONFIG.starter;

  const totalPrice = `$${selectedPackage.priceUsd.toFixed(2)}`;
  const creditsToBuy = selectedPackage.credits;

  const handleInitializePaystack = async () => {
    try {
      setPaymentLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      const packageKey =
        purchaseType === 'activation'
          ? 'activation'
          : state.selectedPlan === 'pro'
          ? 'pro'
          : 'starter';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-paystack`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            packageKey,
            callbackUrl: `${window.location.origin}/payment/callback`,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize Paystack payment');
      if (!data.authorization_url) throw new Error('Missing Paystack authorization URL');

      window.location.href = data.authorization_url;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleInitializeCryptomus = async () => {
    try {
      setPaymentLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not authenticated');

      const packageKey =
        purchaseType === 'activation'
          ? 'activation'
          : state.selectedPlan === 'pro'
          ? 'pro'
          : 'starter';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-cryptomus`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ packageKey }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize Cryptomus payment');
      if (!data.payment_url) throw new Error('Missing Cryptomus payment URL');

      window.location.href = data.payment_url;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Crypto payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const validateBillingStep = () => {
    const errors: Record<string, string> = {};

    if (!billingData.firstName.trim()) errors.firstName = 'First name is required';
    if (!billingData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!billingData.address1.trim()) errors.address1 = 'Address is required';
    if (!billingData.city.trim()) errors.city = 'City is required';
    if (!billingData.state.trim()) errors.state = 'State is required';
    if (!billingData.zip.trim()) errors.zip = 'ZIP / Postal code is required';
    if (!billingData.country.trim()) errors.country = 'Country is required';

    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  if (loadingProfile) {
    return (
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <Box sx={{ p: 4 }}>
          <Loader />
        </Box>
      </AppTheme>
    );
  }

  if (profileError) {
    return (
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography color="error">Failed to load checkout: {profileError}</Typography>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ position: 'fixed', top: '1rem', right: '1rem' }}>
        <ColorModeIconDropdown />
      </Box>

      <Grid
        container
        sx={{
          height: {
            xs: '100%',
            sm: 'calc(100dvh - var(--template-frame-height, 0px))',
          },
          mt: { xs: 4, sm: 0 },
        }}
      >
        {/* Left sidebar */}
        <Grid
          size={{ xs: 12, sm: 5, lg: 4 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            backgroundColor: 'background.paper',
            borderRight: { sm: 'none', md: '1px solid' },
            borderColor: { sm: 'none', md: 'divider' },
            alignItems: 'start',
            pt: 16,
            px: 10,
            gap: 4,
          }}
        >
          <img src={logo} alt="Logo" style={{ width: '100px', height: 'auto', margin: '0 auto' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '100%', maxWidth: 500 }}>
            <Info
              totalPrice={totalPrice}
              currentPlan={profile?.plan || 'free'}
              packageLabel={selectedPackage.label}
              creditsToAdd={selectedPackage.credits}
              currentCredits={profile?.credits_remaining || 0}
            />
          </Box>
        </Grid>

        {/* Right main content */}
        <Grid
          size={{ sm: 12, md: 7, lg: 8 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '100%',
            width: '100%',
            backgroundColor: { xs: 'transparent', sm: 'background.default' },
            alignItems: 'start',
            pt: { xs: 0, sm: 16 },
            px: { xs: 2, sm: 10 },
            gap: { xs: 4, md: 8 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: { sm: 'space-between', md: 'flex-end' },
              alignItems: 'center',
              width: '100%',
              maxWidth: { sm: '100%', md: 600 },
            }}
          >
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexGrow: 1,
              }}
            >
              <Stepper id="desktop-stepper" activeStep={activeStep} sx={{ width: '100%', height: 40 }}>
                {steps.map((label) => (
                  <Step sx={{ ':first-of-type': { pl: 0 }, ':last-of-type': { pr: 0 } }} key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Box>

          {/* Mobile order summary card */}
          <Card sx={{ display: { xs: 'flex', md: 'none' }, width: '100%' }}>
            <CardContent
              sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <Typography variant="subtitle2" gutterBottom>Selected package</Typography>
                <Typography variant="body1">{totalPrice}</Typography>
              </div>
              <InfoMobile
                totalPrice={totalPrice}
                currentPlan={profile?.plan || 'free'}
                packageLabel={selectedPackage.label}
                creditsToAdd={selectedPackage.credits}
                currentCredits={profile?.credits_remaining || 0}
              />
            </CardContent>
          </Card>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              width: '100%',
              maxWidth: { sm: '100%', md: 600 },
              maxHeight: '720px',
              gap: { xs: 5, md: 'none' },
            }}
          >
            {/* Mobile stepper */}
            <Stepper
              id="mobile-stepper"
              activeStep={activeStep}
              alternativeLabel
              sx={{ display: { sm: 'flex', md: 'none' } }}
            >
              {steps.map((label) => (
                <Step
                  sx={{
                    ':first-of-type': { pl: 0 },
                    ':last-of-type': { pr: 0 },
                    '& .MuiStepConnector-root': { top: { xs: 6, sm: 12 } },
                  }}
                  key={label}
                >
                  <StepLabel sx={{ '.MuiStepLabel-labelContainer': { maxWidth: '70px' } }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === steps.length ? (
              <Stack spacing={2} useFlexGap>
                <Typography variant="h1">✅</Typography>
                <Typography variant="h5">Ready for payment verification</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Your checkout data has been loaded successfully.
                </Typography>
              </Stack>
            ) : (
              <>
                {activeStep === 0 && (
                  <AddressForm
                    billingData={billingData}
                    setBillingData={setBillingData}
                    errors={billingErrors}
                  />
                )}

                {activeStep === 1 && (
                  <PaymentForm
                    totalPrice={totalPrice}
                    packageLabel={selectedPackage.label}
                    creditsToAdd={creditsToBuy}
                    loading={paymentLoading}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    onPaystack={handleInitializePaystack}
                    onCryptomus={handleInitializeCryptomus}
                  />
                )}

                {activeStep === 2 && (
                  <Review
                    totalPrice={totalPrice}
                    packageLabel={selectedPackage.label}
                    creditsToAdd={creditsToBuy}
                    currentPlan={profile?.plan || 'free'}
                    currentCredits={profile?.credits_remaining || 0}
                    billingData={billingData}
                    paymentMethod={paymentMethod}
                  />
                )}

                <Box
                  sx={[
                    {
                      display: 'flex',
                      flexDirection: { xs: 'column-reverse', sm: 'row' },
                      alignItems: 'end',
                      flexGrow: 1,
                      gap: 1,
                      pb: { xs: 12, sm: 0 },
                      mt: { xs: 2, sm: 0 },
                      mb: '60px',
                    },
                    activeStep !== 0
                      ? { justifyContent: 'space-between' }
                      : { justifyContent: 'flex-end' },
                  ]}
                >
                  {activeStep !== 0 && (
                    <Button
                      startIcon={<ChevronLeftRoundedIcon />}
                      onClick={handleBack}
                      variant="text"
                      sx={{ display: { xs: 'none', sm: 'flex' } }}
                    >
                      Previous
                    </Button>
                  )}

                  {activeStep !== 0 && (
                    <Button
                      startIcon={<ChevronLeftRoundedIcon />}
                      onClick={handleBack}
                      variant="outlined"
                      fullWidth
                      sx={{ display: { xs: 'flex', sm: 'none' } }}
                    >
                      Previous
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    endIcon={<ChevronRightRoundedIcon />}
                    onClick={handleNext}
                    sx={{ width: { xs: '100%', sm: 'fit-content' } }}
                  >
                    {activeStep === steps.length - 1 ? 'Continue to payment' : 'Next'}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </AppTheme>
  );
}