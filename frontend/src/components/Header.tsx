import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { Security } from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'primary.50', p: 1, borderRadius: 1, mr: 2 }}>
            <Security sx={{ color: 'primary.main', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
            Kuryente Mgmt
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
