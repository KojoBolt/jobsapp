import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

type UserPlan = 'free' | 'starter' | 'pro';

interface InfoProps {
  totalPrice: string;
  currentPlan: UserPlan;
  packageLabel: string;
  creditsToAdd: number;
  currentCredits?: number;
}

const planLabels: Record<UserPlan, string> = {
  free: 'Basic',
  starter: 'Starter',
  pro: 'Pro',
};

const Info = ({
  totalPrice,
  currentPlan,
  packageLabel,
  creditsToAdd,
  currentCredits = 0,
}: InfoProps) => {
  const items = [
    {
      name: packageLabel,
      desc: 'Selected credit package',
      price: totalPrice,
    },
    {
      name: 'Current plan',
      desc: 'Your active account tier',
      price: planLabels[currentPlan],
    },
    {
      name: 'Credits to add',
      desc: 'Applications unlocked after payment',
      price: `${creditsToAdd ?? 0}`,
    },
    {
      name: 'Current balance',
      desc: 'Available application credits',
      price: `${currentCredits}`,
    },
  ];

  return (
    <React.Fragment>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
        Total
      </Typography>

      <Typography variant="h4" gutterBottom>
        {totalPrice}
      </Typography>

      <List disablePadding>
        {items.map((item) => (
          <ListItem key={item.name} sx={{ py: 1, px: 0 }}>
            <ListItemText
              sx={{ mr: 2 }}
              primary={item.name}
              secondary={item.desc}
            />
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {item.price}
            </Typography>
          </ListItem>
        ))}
      </List>
    </React.Fragment>
  );
};

export default Info;