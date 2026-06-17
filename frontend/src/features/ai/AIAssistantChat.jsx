import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, Avatar, Paper, List, ListItem, CircularProgress } from '@mui/material';
import { SmartToy, Person, Send, CalendarToday } from '@mui/icons-material';
import { assistAppointment } from './aiSlice.js';

export const AIAssistantChat = () => {
  const dispatch = useDispatch();
  const { appointmentAssistant } = useSelector(state => state.ai);
  const { loading } = appointmentAssistant;

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am Pulsecare AI. You can ask me general health questions, or schedule assistance, like: 'I need to see a cardiologist next Monday morning'!"
    }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { sender: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    try {
      const resultAction = await dispatch(assistAppointment(inputText));
      if (assistAppointment.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        
        const aiMsg = {
          sender: 'ai',
          text: payload.message,
          recommendation: {
            doctor: payload.recommendedDoctor,
            specialty: payload.recommendedSpecialty,
            slots: payload.suggestedSlots
          }
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error searching for slots.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, the request timed out.' }]);
    }
  };

  return (
    <Box p={3} sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
      <Box mb={3} display="flex" alignItems="center" gap={1.5}>
        <SmartToy color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            Pulsecare AI Concierge
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Get instant health support and schedule consultations interactively
          </Typography>
        </Box>
      </Box>

      {/* Chat Messages Frame */}
      <Box
        flexGrow={1}
        sx={{
          overflowY: 'auto',
          mb: 2,
          p: 2.5,
          borderRadius: 4,
          backgroundColor: 'rgba(15, 23, 42, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5
        }}
      >
        {messages.map((msg, index) => {
          const isAI = msg.sender === 'ai';
          return (
            <Box
              key={index}
              display="flex"
              flexDirection={isAI ? 'row' : 'row-reverse'}
              alignItems="flex-start"
              gap={1.5}
            >
              <Avatar sx={{ bgcolor: isAI ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
                {isAI ? <SmartToy sx={{ fontSize: 20 }} /> : <Person sx={{ fontSize: 20 }} />}
              </Avatar>

              <Box sx={{ maxWidth: '75%' }}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: isAI ? '0px 16px 16px 16px' : '16px 0px 16px 16px',
                    backgroundColor: isAI ? 'rgba(30, 41, 59, 0.8)' : 'primary.dark',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#f8fafc' }}>
                    {msg.text}
                  </Typography>
                </Paper>

                {/* Render Doctor Slots Card */}
                {isAI && msg.recommendation && msg.recommendation.doctor && (
                  <Card sx={{ mt: 1.5, backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
                    <CardContent sx={{ p: '16px !important' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Recommended Specialist
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {msg.recommendation.doctor.name}
                      </Typography>
                      <Typography variant="body2" color="primary.light" sx={{ mb: 2 }}>
                        Department: {msg.recommendation.specialty}
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Suggested Appointments:
                      </Typography>
                      <Grid container spacing={1}>
                        {msg.recommendation.slots?.map((slot, sIdx) => (
                          <Grid item xs={6} key={sIdx}>
                            <Button
                              variant="outlined"
                              size="small"
                              fullWidth
                              startIcon={<CalendarToday sx={{ fontSize: 12 }} />}
                              sx={{ fontSize: '0.72rem', py: 0.8 }}
                            >
                              {slot.date} @ {slot.startTime}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Box>
          );
        })}

        {loading && (
          <Box display="flex" alignItems="center" gap={1.5} sx={{ pl: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
              <SmartToy sx={{ fontSize: 20 }} />
            </Avatar>
            <Paper sx={{ p: 2, borderRadius: '0px 16px 16px 16px', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
              <CircularProgress size={20} color="inherit" />
            </Paper>
          </Box>
        )}
      </Box>

      {/* Input Box */}
      <form onSubmit={handleSend}>
        <Box display="flex" gap={1.5}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your request here... (e.g. 'I need a pediatrician next Monday morning')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !inputText.trim()}
            sx={{ px: 3 }}
          >
            <Send />
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AIAssistantChat;
