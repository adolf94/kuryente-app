import { Assistant, ChatBubble, Close, Person, Send, SmartToy } from "@mui/icons-material";
import { Avatar, Box, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton, Paper, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material"
import { useEffect, useRef,  useState } from "react";
import api from "../../../utils/api";


import Markdown from 'mui-markdown'
import ChatBubbles from "./ChatBubbles";

const SupportChatModal = ({open, onClose})=>{
    const theme = useTheme()
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const [message,setMessage] = useState("")
    const [loading,setLoading] = useState(false)
    const [messages,setMessages] = useState([])
    const scrollRef = useRef(null)
    const [chat_id,setChatId] = useState("")

    useEffect(() => {
        if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend  = ()=>{

        setMessages([...messages, {role:"user", text:message}])
        setMessage("")
        api.post("/support_ai/chat", {message, chat_id})
            .then((res)=>{
                
                setMessages(prev => [...prev, { role: 'model', text: res.data.response || "I'm buffering... try that again? 🔄" }]);
                setChatId(res.data.chat_id)
            })



    }

    return <Dialog maxWidth="md" fullWidth fullScreen={fullScreen} open={open} onClose={onClose}>
        <DialogTitle
        sx={{
            p: 1, 
            bgcolor: '#4f46e5', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
            <Assistant />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1 }}>Kuryente App Support AI</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700 }}>Utility bill assistant</Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <Close />
        </IconButton>
        </DialogTitle>
        <DialogContent  sx={{minHeight:"60vh",        
            flexGrow: 1, 
            p: 3, 
            mt:1,
            bgcolor: '#f8fafc', 
            display: 'flex', 
            flexDirection: 'column',
            gap: 3,
            overflowY: 'auto'}} ref={scrollRef}>
            {messages.map((m, i)=><ChatBubbles key={i} chat={m} />)}
        </DialogContent>
  <Box sx={{ p: 2.5, bgcolor: 'white', borderTop: '1px solid #f1f5f9' }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            placeholder="Ask your mentor anything..."
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                bgcolor: '#f8fafc',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
              }
            }}
          />
          <IconButton 
            disabled={!message.trim() || loading}
            onClick={handleSend}
            sx={{ 
              bgcolor: '#4f46e5', 
              color: 'white', 
              borderRadius: 3,
              '&:hover': { bgcolor: '#4338ca' },
              '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#cbd5e1' }
            }}
          >
            <Send />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
           {['Bat mataas bill?', 'Weh?', 'Bat tumaas nanaman yung madadaya?'].map((chip) => (
             <Chip 
               key={chip}
               label={chip} 
               size="small" 
               onClick={() => { setInput(chip); }}
               sx={{ 
                 fontSize: '0.65rem', 
                 fontWeight: 800, 
                 cursor: 'pointer',
                 bgcolor: '#f1f5f9',
                 color: '#64748b',
                 border: 'none',
                 '&:hover': { bgcolor: '#e2e8f0' }
               }} 
             />
           ))}
        </Stack>
      </Box>

    </Dialog>
}

export default SupportChatModal