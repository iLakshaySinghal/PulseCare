import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider } from '@mui/material';
import { Dashboard, People, Description, Notifications, History, Person, CalendarMonth, Healing, Science, LocalPharmacy, Warning, SmartToy, AccountBalanceWallet, LocalHospital, BarChart } from '@mui/icons-material';

const drawerWidth = 240;

export const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) return null;

  // Define sidebar menu options based on role permissions
  const menuItems = [];

  const isAdmin = ['Super Admin', 'Hospital Admin'].includes(user.role);
  const isStaff = ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Billing Executive'].includes(user.role);

  // Admin Features (Dashboard & Audits)
  if (isAdmin) {
    menuItems.push({ text: 'Admin Control Center', path: '/', icon: <Dashboard /> });
    menuItems.push({ text: 'System Analytics', path: '/analytics', icon: <BarChart /> });
    menuItems.push({ text: 'Operations AI', path: '/ai/operations', icon: <SmartToy /> });
  }

  // Patient Demographic List (Staff only)
  if (['Hospital Admin', 'Receptionist', 'Doctor', 'Nurse'].includes(user.role)) {
    menuItems.push({ text: 'Patient Registry', path: '/patients', icon: <People /> });
  }

  // Appointments for Patients & Staff
  if (['Super Admin', 'Hospital Admin', 'Receptionist', 'Doctor', 'Nurse', 'Patient'].includes(user.role)) {
    menuItems.push({ text: 'Appointments', path: '/appointments', icon: <CalendarMonth /> });
  }

  // Doctor Consultations
  if (user.role === 'Doctor') {
    menuItems.push({ text: 'Consultation Queue', path: '/consultation', icon: <Healing /> });
  }

  // Inpatient Admissions
  if (['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'].includes(user.role)) {
    menuItems.push({ text: 'Inpatient Desk', path: '/inpatient', icon: <LocalHospital /> });
  }
  if (['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(user.role)) {
    menuItems.push({ text: 'Bed Grid', path: '/inpatient/beds', icon: <LocalHospital /> });
  }
  if (['Super Admin', 'Hospital Admin', 'Nurse', 'Receptionist'].includes(user.role)) {
    menuItems.push({ text: 'Room Allocation', path: '/inpatient/rooms', icon: <LocalHospital /> });
  }

  // Laboratory Scans
  if (['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Lab Technician'].includes(user.role)) {
    menuItems.push({ text: 'Lab Testing', path: '/laboratory', icon: <Science /> });
  }

  // Pharmacy Inventory
  if (['Super Admin', 'Hospital Admin', 'Pharmacist', 'Doctor', 'Nurse'].includes(user.role)) {
    menuItems.push({ text: 'Pharmacy', path: '/pharmacy', icon: <LocalPharmacy /> });
  }

  // Billing & Payments
  if (['Super Admin', 'Hospital Admin', 'Billing Executive', 'Patient'].includes(user.role)) {
    menuItems.push({ text: 'Billing & Invoices', path: '/billing', icon: <AccountBalanceWallet /> });
  }
  if (['Super Admin', 'Hospital Admin', 'Billing Executive'].includes(user.role)) {
    menuItems.push({ text: 'Revenue Ledger', path: '/billing/revenue', icon: <AccountBalanceWallet /> });
  }

  // Emergency Department
  if (['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(user.role)) {
    menuItems.push({ text: 'Emergency Room', path: '/emergency', icon: <Warning /> });
  }

  // AI Patient features
  if (['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'].includes(user.role)) {
    menuItems.push({ text: 'AI Chat Concierge', path: '/ai/chat', icon: <SmartToy /> });
    menuItems.push({ text: 'AI Symptom Analyzer', path: '/ai/symptoms', icon: <SmartToy /> });
  }
  if (['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Pharmacist', 'Patient'].includes(user.role)) {
    menuItems.push({ text: 'AI Pill Explainer', path: '/ai/prescriptions', icon: <SmartToy /> });
  }

  // Clinical EMR Charting / View
  if (['Doctor', 'Nurse', 'Pharmacist', 'Lab Technician'].includes(user.role)) {
    menuItems.push({ text: 'Clinical Notes & Files', path: '/emr', icon: <Description /> });
  }

  // Patient Portal Features (Self Profile & Records)
  if (user.role === 'Patient') {
    menuItems.push({ text: 'My Profile Sheet', path: '/', icon: <Person /> });
    menuItems.push({ text: 'My Medical Records', path: '/emr', icon: <History /> });
  }

  // Common notification feed for everyone
  menuItems.push({ text: 'Notification Logs', path: '/notifications', icon: <Notifications /> });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none'
        }
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isSelected}
                  sx={{
                    mx: 1.5,
                    my: 0.5,
                    borderRadius: 2,
                    color: isSelected ? '#ffffff' : 'text.secondary',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(99, 102, 241, 0.18)',
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.25)'
                      }
                    },
                    '&:hover': {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      transform: 'translateX(3px)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <ListItemIcon sx={{ color: isSelected ? '#818cf8' : 'text.secondary', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontFamily: 'Outfit',
                      fontSize: '0.95rem',
                      fontWeight: isSelected ? 600 : 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
