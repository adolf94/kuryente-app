import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import type { SvgIconProps } from '@mui/material';

interface AdminMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement<SvgIconProps>;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

const AdminMetricCard: React.FC<AdminMetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary' 
}) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ 
      borderRadius: 2, 
      border: '1px solid', 
      borderColor: 'divider',
      height: '100%'
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight="600" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="700" color="text.primary">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: `${color}.50`, 
            color: `${color}.main`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.cloneElement(icon, { fontSize: 'medium' })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminMetricCard;
