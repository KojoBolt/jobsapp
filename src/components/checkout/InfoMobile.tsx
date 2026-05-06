import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Info from './Info';

type UserPlan = 'free' | 'starter' | 'pro';

interface InfoMobileProps {
  totalPrice: string;
  currentPlan: UserPlan;
  packageLabel: string;
  creditsToAdd: number;
  currentCredits?: number;
}

const InfoMobile = ({
  totalPrice,
  currentPlan,
  packageLabel,
  creditsToAdd,
  currentCredits = 0,
}: InfoMobileProps) => {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const drawerList = (
    <Box sx={{ width: 'auto', px: 3, pb: 3, pt: 8 }} role="presentation">
      <IconButton
        onClick={toggleDrawer(false)}
        sx={{ position: 'absolute', right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>

      <Info
        totalPrice={totalPrice}
        currentPlan={currentPlan}
        packageLabel={packageLabel}
        creditsToAdd={creditsToAdd}
        currentCredits={currentCredits}
      />
    </Box>
  );

  return (
    <div>
      <Button
        variant="text"
        endIcon={<ExpandMoreRoundedIcon />}
        onClick={toggleDrawer(true)}
      >
        View details
      </Button>

      <Drawer
        open={open}
        anchor="top"
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            top: 'var(--template-frame-height, 0px)',
            backgroundImage: 'none',
            backgroundColor: 'background.paper',
          },
        }}
      >
        {drawerList}
      </Drawer>
    </div>
  );
};

export default InfoMobile;