import { Person, SmartToy } from "@mui/icons-material"
import { Avatar, Box, Paper, Stack } from "@mui/material"
import MuiMarkdown from "mui-markdown"
import { useMemo } from "react"



const ChatBubbles = ({chat: m})=>{

    const message = useMemo(()=>{
        return m.text
    },[m.text])


    return   <Box sx={{ 
            display: 'flex', 
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            width: '100%'
          }}>
            <Stack 
              direction={m.role === 'user' ? 'row-reverse' : 'row'} 
              spacing={1.5} 
              sx={{ maxWidth: '85%' }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: m.role === 'user' ? '#6366f1' : '#1e293b',
                  fontSize: 16
                }}
              >
                {m.role === 'user' ? <Person fontSize="inherit" /> : <SmartToy fontSize="inherit" />}
              </Avatar>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  borderRadius: 4, 
                  borderTopRightRadius: m.role === 'user' ? 2 : 16,
                  borderTopLeftRadius: m.role === 'model' ? 2 : 16,
                  bgcolor: m.role === 'user' ? '#4f46e5' : 'white',
                  color: m.role === 'user' ? 'white' : '#334155',
                  boxShadow: m.role === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                  border: m.role === 'user' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                <MuiMarkdown>
                  {message}
                </MuiMarkdown>
              </Paper>
            </Stack>
          </Box>
        
}

export default ChatBubbles