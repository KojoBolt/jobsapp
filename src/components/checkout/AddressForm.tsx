import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled } from '@mui/material/styles';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
}));

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

interface AddressFormProps {
  billingData: BillingData;
  setBillingData: React.Dispatch<React.SetStateAction<BillingData>>;
  errors: Record<string, string>;
}

const AddressForm = ({
  billingData,
  setBillingData,
  errors,
}: AddressFormProps) => {
  const handleChange =
    (field: keyof BillingData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const value =
        field === 'saveAddress'
          ? (event.target as HTMLInputElement).checked
          : event.target.value;

      setBillingData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  return (
    <Grid container spacing={3}>
      <FormGrid size={{ xs: 12, md: 6 }}>
        <FormLabel htmlFor="first-name" required>
          First name
        </FormLabel>
        <OutlinedInput
          id="first-name"
          name="first-name"
          placeholder="John"
          autoComplete="given-name"
          required
          size="small"
          value={billingData.firstName}
          onChange={handleChange('firstName')}
          error={!!errors.firstName}
        />
        {errors.firstName && <FormHelperText error>{errors.firstName}</FormHelperText>}
      </FormGrid>

      <FormGrid size={{ xs: 12, md: 6 }}>
        <FormLabel htmlFor="last-name" required>
          Last name
        </FormLabel>
        <OutlinedInput
          id="last-name"
          name="last-name"
          placeholder="Snow"
          autoComplete="family-name"
          required
          size="small"
          value={billingData.lastName}
          onChange={handleChange('lastName')}
          error={!!errors.lastName}
        />
        {errors.lastName && <FormHelperText error>{errors.lastName}</FormHelperText>}
      </FormGrid>

      <FormGrid size={{ xs: 12 }}>
        <FormLabel htmlFor="address1" required>
          Address line 1
        </FormLabel>
        <OutlinedInput
          id="address1"
          name="address1"
          placeholder="Street name and number"
          autoComplete="shipping address-line1"
          required
          size="small"
          value={billingData.address1}
          onChange={handleChange('address1')}
          error={!!errors.address1}
        />
        {errors.address1 && <FormHelperText error>{errors.address1}</FormHelperText>}
      </FormGrid>

      <FormGrid size={{ xs: 12 }}>
        <FormLabel htmlFor="address2">Address line 2</FormLabel>
        <OutlinedInput
          id="address2"
          name="address2"
          placeholder="Apartment, suite, unit, etc. (optional)"
          autoComplete="shipping address-line2"
          size="small"
          value={billingData.address2}
          onChange={handleChange('address2')}
        />
      </FormGrid>

      <FormGrid size={{ xs: 6 }}>
        <FormLabel htmlFor="city" required>
          City
        </FormLabel>
        <OutlinedInput
          id="city"
          name="city"
          placeholder="New York"
          autoComplete="address-level2"
          required
          size="small"
          value={billingData.city}
          onChange={handleChange('city')}
          error={!!errors.city}
        />
        {errors.city && <FormHelperText error>{errors.city}</FormHelperText>}
      </FormGrid>

      <FormGrid size={{ xs: 6 }}>
        <FormLabel htmlFor="state" required>
          State
        </FormLabel>
        <OutlinedInput
          id="state"
          name="state"
          placeholder="NY"
          autoComplete="address-level1"
          required
          size="small"
          value={billingData.state}
          onChange={handleChange('state')}
          error={!!errors.state}
        />
        {errors.state && <FormHelperText error>{errors.state}</FormHelperText>}
      </FormGrid>

      <FormGrid size={{ xs: 6 }}>
        <FormLabel htmlFor="zip" required>
          Zip / Postal code
        </FormLabel>
        <OutlinedInput
          id="zip"
          name="zip"
          placeholder="12345"
          autoComplete="shipping postal-code"
          required
          size="small"
          value={billingData.zip}
          onChange={handleChange('zip')}
          error={!!errors.zip}
        />
        {errors.zip && <FormHelperText error>{errors.zip}</FormHelperText>}
      </FormGrid>

      <FormGrid size={{ xs: 6 }}>
        <FormLabel htmlFor="country" required>
          Country
        </FormLabel>
        <OutlinedInput
          id="country"
          name="country"
          placeholder="United States"
          autoComplete="country-name"
          required
          size="small"
          value={billingData.country}
          onChange={handleChange('country')}
          error={!!errors.country}
        />
        {errors.country && <FormHelperText error>{errors.country}</FormHelperText>}
      </FormGrid>

      <FormGrid size={{ xs: 12 }}>
        <FormControlLabel
          control={
            <Checkbox
              name="saveAddress"
              checked={billingData.saveAddress}
              onChange={handleChange('saveAddress')}
            />
          }
          label="Use this address for payment details"
        />
      </FormGrid>
    </Grid>
  );
};

export default AddressForm;