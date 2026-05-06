import * as React from 'react';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type UserPlan = 'free' | 'starter' | 'pro';
type PaymentMethod = 'paystack' | 'cryptomus';

type BillingData = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  saveAddress: boolean;
};

interface ReviewProps {
  totalPrice: string;
  packageLabel: string;
  creditsToAdd: number;
  currentPlan: UserPlan;
  currentCredits?: number;
  billingData: BillingData;
  paymentMethod: PaymentMethod;
}

const planLabels: Record<UserPlan, string> = {
  free: 'Basic',
  starter: 'Starter',
  pro: 'Pro',
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  paystack: 'Paystack Checkout',
  cryptomus: 'Cryptomus',
};

const Review = ({
  totalPrice,
  packageLabel,
  creditsToAdd,
  currentPlan,
  currentCredits = 0,
  billingData,
  paymentMethod,
}: ReviewProps) => {
  const fullName = [billingData.firstName, billingData.lastName]
    .filter(Boolean)
    .join(' ') || 'N/A';

  const addressLines = [
    billingData.address1,
    billingData.address2,
    [billingData.city, billingData.state, billingData.zip].filter(Boolean).join(', '),
    billingData.country,
  ].filter(Boolean);

  return (
    <Stack spacing={2}>
      <List disablePadding>
        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Package" secondary={packageLabel} />
          <Typography variant="body2">{totalPrice}</Typography>
        </ListItem>

        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText
            primary="Credits to add"
            secondary="Applications unlocked after payment"
          />
          <Typography variant="body2">{creditsToAdd}</Typography>
        </ListItem>

        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Current plan" secondary="Active account tier" />
          <Typography variant="body2">{planLabels[currentPlan]}</Typography>
        </ListItem>

        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText
            primary="Current balance"
            secondary="Available application credits"
          />
          <Typography variant="body2">{currentCredits}</Typography>
        </ListItem>

        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Total" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {totalPrice}
          </Typography>
        </ListItem>
      </List>

      <Divider />

      <Stack
        direction="column"
        divider={<Divider flexItem />}
        spacing={2}
        sx={{ my: 2 }}
      >
        <div>
          <Typography variant="subtitle2" gutterBottom>
            Billing details
          </Typography>
          <Typography gutterBottom>{fullName}</Typography>
          {addressLines.map((line, i) => (
            <Typography key={i} sx={{ color: 'text.secondary' }}>
              {line}
            </Typography>
          ))}
        </div>

        <div>
          <Typography variant="subtitle2" gutterBottom>
            Payment details
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap sx={{ width: '100%', mb: 1 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Method:
            </Typography>
            <Typography variant="body2">
              {paymentMethodLabels[paymentMethod]}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ width: '100%', mb: 1 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Package:
            </Typography>
            <Typography variant="body2">{packageLabel}</Typography>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap sx={{ width: '100%', mb: 1 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Amount:
            </Typography>
            <Typography variant="body2">{totalPrice}</Typography>
          </Stack>
        </div>
      </Stack>
    </Stack>
  );
};

export default Review;