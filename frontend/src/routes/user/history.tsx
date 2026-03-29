import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowBack, History } from '@mui/icons-material'
import UserHistoryView from '../../components/index/user/UserHistoryView'

const HistoryComponent = () => {
    const navigate = useNavigate()

    return (
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
            <Box mb={4}>
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate({ to: '/user' })}
                    sx={{ mb: 2, color: 'text.secondary', fontWeight: 700 }}
                >
                    Back to Dashboard
                </Button>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ p: 1.5, bgcolor: 'primary.50', color: 'primary.main', borderRadius: 3 }}>
                        <History fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="800">Account History</Typography>
                        <Typography variant="body2" color="text.secondary">Complete scannable ledger of your account activity</Typography>
                    </Box>
                </Stack>
            </Box>

            <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <UserHistoryView />
            </Box>
        </Container>
    )
}

export const Route = createFileRoute('/user/history')({
    component: HistoryComponent,
})
