import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reference = searchParams.get('reference') || searchParams.get('trxref') || 'N/A';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        px: 2,
      }}
    >
      <Box
        sx={{
          backgroundColor: '#fff',
          borderRadius: 3,
          px: { xs: 3, sm: 6 },
          py: 5,
          maxWidth: 560,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', mb: 1 }} />

        <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50', mb: 2 }}>
          Payment Successful!
        </Typography>

        <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
          Thank you! Your payment has been received.
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Reference: {reference}
        </Typography>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 3,
            mb: 3,
            textAlign: 'left',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 2 }}>
            Payment Details
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Status</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#4caf50' }}>Confirmed</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Provider</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>Paystack</Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          Your credits will appear in your account within a few moments.
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
          For any queries, please contact our support team.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/dashboard')}
          sx={{
            px: 6,
            py: 1.5,
            backgroundColor: '#1a3c5e',
            '&:hover': { backgroundColor: '#15304d' },
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
}