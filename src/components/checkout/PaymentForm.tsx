import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MuiCard from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import CurrencyBitcoinRoundedIcon from '@mui/icons-material/CurrencyBitcoinRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';

const Card = styled(MuiCard)<{ selected?: boolean }>(({ theme }) => ({
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  width: '100%',
  '&:hover': {
    background:
      'linear-gradient(to bottom right, hsla(210, 100%, 97%, 0.5) 25%, hsla(210, 100%, 90%, 0.3) 100%)',
    borderColor: 'primary.light',
    boxShadow: '0px 2px 8px hsla(0, 0%, 0%, 0.1)',
    ...theme.applyStyles('dark', {
      background:
        'linear-gradient(to right bottom, hsla(210, 100%, 12%, 0.2) 25%, hsla(210, 100%, 16%, 0.2) 100%)',
      borderColor: 'primary.dark',
      boxShadow: '0px 1px 8px hsla(210, 100%, 25%, 0.5)',
    }),
  },
  [theme.breakpoints.up('md')]: {
    flexGrow: 1,
    maxWidth: `calc(50% - ${theme.spacing(1)})`,
  },
  variants: [
    {
      props: ({ selected }) => selected,
      style: {
        borderColor: (theme.vars || theme).palette.primary.light,
        ...theme.applyStyles('dark', {
          borderColor: (theme.vars || theme).palette.primary.dark,
        }),
      },
    },
  ],
}));

interface PaymentFormProps {
  totalPrice: string;
  packageLabel: string;
  creditsToAdd: number;
  loading?: boolean;
  paymentMethod: 'paystack' | 'cryptomus';
  onPaymentMethodChange: (method: 'paystack' | 'cryptomus') => void;
  onPaystack: () => void;
  onCryptomus: () => void;
}

const PaymentForm = ({
  totalPrice,
  packageLabel,
  creditsToAdd,
  loading = false,
  paymentMethod,
  onPaymentMethodChange,
  onPaystack,
  onCryptomus,
}: PaymentFormProps) => {
  const handlePaymentTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPaymentMethodChange(event.target.value as 'paystack' | 'cryptomus');
  };

  const handlePay = () => {
    if (paymentMethod === 'paystack') {
      onPaystack();
      return;
    }

    onCryptomus();
  };

  return (
    <Stack spacing={{ xs: 3, sm: 6 }} useFlexGap>
      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          aria-label="Payment options"
          name="paymentType"
          value={paymentMethod}
          onChange={handlePaymentTypeChange}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Card selected={paymentMethod === 'paystack'}>
            <CardActionArea
              onClick={() => onPaymentMethodChange('paystack')}
              sx={{
                '.MuiCardActionArea-focusHighlight': {
                  backgroundColor: 'transparent',
                },
                '&:focus-visible': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCardRoundedIcon
                  fontSize="small"
                  sx={[
                    { color: 'grey.400' },
                    paymentMethod === 'paystack' && { color: 'primary.main' },
                  ]}
                />
                <Typography sx={{ fontWeight: 'medium' }}>
                  Paystack Checkout
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card selected={paymentMethod === 'cryptomus'}>
            <CardActionArea
              onClick={() => onPaymentMethodChange('cryptomus')}
              sx={{
                '.MuiCardActionArea-focusHighlight': {
                  backgroundColor: 'transparent',
                },
                '&:focus-visible': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CurrencyBitcoinRoundedIcon
                  fontSize="small"
                  sx={[
                    { color: 'grey.400' },
                    paymentMethod === 'cryptomus' && { color: 'primary.main' },
                  ]}
                />
                <Typography sx={{ fontWeight: 'medium' }}>
                  Cryptomus
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </RadioGroup>
      </FormControl>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info">
          {paymentMethod === 'paystack'
            ? 'You’ll complete your payment securely through Paystack.'
            : 'You’ll be redirected to Cryptomus to pay with crypto.'}
        </Alert>

        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Order summary
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Package</Typography>
            <Typography sx={{ fontWeight: 500 }}>{packageLabel}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Credits</Typography>
            <Typography sx={{ fontWeight: 500 }}>{creditsToAdd}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Total</Typography>
            <Typography sx={{ fontWeight: 700 }}>{totalPrice}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Payment method</Typography>
            <Typography sx={{ fontWeight: 500 }}>
              {paymentMethod === 'paystack' ? 'Paystack' : 'Cryptomus'}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : paymentMethod === 'paystack' ? (
            `Pay ${totalPrice} with Paystack`
          ) : (
            `Pay ${totalPrice} with Cryptomus`
          )}
        </Button>
      </Box>
    </Stack>
  );
};

export default PaymentForm;